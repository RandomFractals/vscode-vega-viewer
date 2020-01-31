'use strict';
import { 
  workspace, 
  window, 
  Disposable, 
  Uri, 
  ViewColumn, 
  WorkspaceFolder, 
  Webview,
  WebviewPanel, 
  WebviewPanelOnDidChangeViewStateEvent, 
  WebviewPanelSerializer,
  commands
} from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import * as lzString from 'lz-string';
import * as jsonStringify from 'json-stringify-pretty-compact';
import * as config from './config';
import {Logger} from './logger';
import {previewManager} from './preview.manager';
import {Template} from './template.manager';

/**
 * Vega preview web panel serializer for restoring previews on vscode reload.
 */
export class VegaPreviewSerializer implements WebviewPanelSerializer {

  private _logger: Logger;
  
  /**
   * Creates new webview serializer.
   * @param viewType Web view type.
   * @param extensionPath Extension path for loading scripts, examples and data.
   * @param template Webview preview html template.
   */
  constructor(private viewType: string, private extensionPath: string, private template: Template) {
    this._logger = new Logger(`${this.viewType}.serializer:`, config.logLevel);
  }

  /**
   * Restores webview panel on vscode reload for vega and data previews.
   * @param webviewPanel Webview panel to restore.
   * @param state Saved web view panel state.
   */
  async deserializeWebviewPanel(webviewPanel: WebviewPanel, state: any) {
    this._logger.debug('deserializeWeviewPanel(): url:', state.uri.toString());
    previewManager.add(
      new VegaPreview(
        this.viewType,
        this.extensionPath, 
        Uri.parse(state.uri),
        webviewPanel.viewColumn, 
        this.template, 
        webviewPanel
    ));
  }
}

/**
 * Main vega preview webview implementation for this vscode extension.
 */
export class VegaPreview {
  
  protected _disposables: Disposable[] = [];
  private _extensionPath: string;
  private _uri: Uri;
  private _url: string;
  private _fileName: string;
  private _title: string;
  private _content: string;
  private _spec: any;
  private _previewUri: Uri;
  private _html: string;
  private _panel: WebviewPanel;
  private _logger: Logger;

  /**
   * Creates new Vega preview.
   * @param viewType Preview webview type, i.e. vega.preview or vega.data.preview.
   * @param extensionPath Extension path for loading webview scripts, etc.
   * @param uri Vega spec json doc uri to preview.
   * @param viewColumn vscode IDE view column to display vega preview in.
   * @param template Webview html template reference.
   * @param panel Optional webview panel reference for restore on vscode IDE reload.
   */
  constructor(
    viewType: string,
    extensionPath: string, 
    uri: Uri, 
    viewColumn: ViewColumn, 
    template: Template, 
    panel?: WebviewPanel) {

    // save ext path, document uri, and create prview uri
    this._extensionPath = extensionPath;
    this._uri = uri; // vega spec uri
    this._url = uri.toString(true);
    this._fileName = path.basename(uri.fsPath);
    this._previewUri = this._uri.with({scheme: 'vega'});
    this._logger = new Logger(`${viewType}:`, config.logLevel);
    // this._logger.debug('():loading Vega spec:', this._vegaSpecUrl);

    // create preview panel title
    switch (viewType) {
      case 'vega.preview':
        this._title = this._fileName;
        if (this._url.startsWith('https://')) {
          this._title = 'Untitled';
        }
        break;
      case 'vega.visual.vocabulary':
        this._title = 'Visual Vocabulary';
        break;  
      default: // vega.help
        this._title = 'Vega Help';
        break;
    }

    // create html template for the webview with scripts path replaced
    const scriptsPath: string = Uri.file(path.join(this._extensionPath, 'web/scripts'))
      .with({scheme: 'vscode-resource'}).toString(true);
    const stylesPath: string = Uri.file(path.join(this._extensionPath, 'web/styles'))     
      .with({scheme: 'vscode-resource'}).toString(true);
     
    this._html = template.content.replace(/\{scripts\}/g, scriptsPath)
      .replace(/\{styles\}/g, stylesPath);

    // initialize webview panel
    this._panel = panel;
    this.initWebview(viewType, viewColumn);
    this.configure();
  } // end of constructor()

  /**
   * Initializes vega preview webview panel.
   * @param viewType Preview webview type, i.e. vega.preview or vega.data.preview.
   * @param viewColumn vscode IDE view column to display preview in.
   */
  private initWebview(viewType: string, viewColumn: ViewColumn): void {
    if (!this._panel) {
      // create new webview panel
      this._panel = window.createWebviewPanel(viewType, this._title, viewColumn, this.getWebviewOptions());
      let panelIconPath: string;
      switch (viewType) {
        case 'vega.preview':
          panelIconPath = './images/vega-viewer.svg';
          break;
        case 'vega.visual.vocabulary':
          panelIconPath = './images/visual-vocabulary.svg';
          break;  
        default: // vega.help, etc.
          panelIconPath = './images/vega-viewer.svg';
          break;
      }
      this._panel.iconPath = Uri.file(path.join(this._extensionPath, panelIconPath));
    }

    // dispose preview panel 
    this._panel.onDidDispose(() => {
      this.dispose();
    }, null, this._disposables);

    // TODO: handle view state changes later
    this._panel.onDidChangeViewState(
      (viewStateEvent: WebviewPanelOnDidChangeViewStateEvent) => {
      let active = viewStateEvent.webviewPanel.visible;
    }, null, this._disposables);

    // process web view messages
    this.webview.onDidReceiveMessage(message => {
      switch (message.command) {
        case 'refresh':
          this.refresh();
          break;
        case 'exportSvg':
          this.exportSvg(message.svg);
          break;
        case 'exportPng':
          this.exportPng(message.imageData);
          break;
        case 'saveVegaSpec':
          this.saveVegaSpec(message.spec);
          break;
        case 'openFile':
          if (this._url.startsWith('https://')) {
            // open remote vega spec in browser
            commands.executeCommand('vscode.open', this._uri);
          } 
          else {
            // open vega spec json in text editor
            workspace.openTextDocument(this._uri).then(document => {
              window.showTextDocument(document, ViewColumn.One);
            });
          }
          break;
        case 'viewOnline':
          this.viewOnline();
          break;
        case 'showData':
          this.showData(message.dataUri);
          break;
        case 'showHelp':
          const helpUri: Uri = Uri.parse('https://github.com/RandomFractals/vscode-vega-viewer#usage');
          commands.executeCommand('vscode.open', helpUri);
          break;
        case 'buyCoffee':
          const buyCoffeeUri: Uri = Uri.parse('https://ko-fi.com/datapixy');
          commands.executeCommand('vscode.open', buyCoffeeUri);
          break;  
      }
    }, null, this._disposables);
  } // end of initWebview()

  /**
   * Creates webview options with local resource roots, etc
   * for vega preview webview display.
   */
  private getWebviewOptions(): any {
    return {
      enableScripts: true,
      enableCommandUris: true,
      retainContextWhenHidden: true,
      localResourceRoots: this.getLocalResourceRoots()
    };
  }

  /**
   * Creates local resource roots for loading scripts in vega preview webview.
   */
  private getLocalResourceRoots(): Uri[] {
    const localResourceRoots: Uri[] = [];
    const workspaceFolder: WorkspaceFolder = workspace.getWorkspaceFolder(this.uri);
    if (workspaceFolder) {
      localResourceRoots.push(workspaceFolder.uri);
    }
    else if (!this.uri.scheme || this.uri.scheme === 'file') {
      localResourceRoots.push(Uri.file(path.dirname(this.uri.fsPath)));
    }

    // add web view styles and scripts folders
    localResourceRoots.push(Uri.file(path.join(this._extensionPath, './web/styles')));
    localResourceRoots.push(Uri.file(path.join(this._extensionPath, './web/scripts')));

    this._logger.debug('getLocalResourceRoots():', localResourceRoots);
    return localResourceRoots;
  }

  /**
   * Configures webview html for preview.
   */
  public configure(): void {
    this.webview.html = this.html;
    // NOTE: let webview fire refresh message
    // when vega preview DOM content is initialized
    // see: this.refresh();
  }

  /**
   * Launches referenced vega spec csv or json data preview.
   * @param dataUrl The url of the data file to load.
   */
  public showData(dataUrl: string): void {
    let dataUri: Uri;
    if (dataUrl.startsWith('http://') || dataUrl.startsWith('https://')) {
      dataUri = Uri.parse(dataUrl);
    }
    else { 
      // join with vega spec file path for reletive data file loading
      dataUri = Uri.file(path.join(path.dirname(this._uri.fsPath), dataUrl));
    }
    this._logger.info(`showData(): ${this.dataPreviewCommand}`, dataUri.toString(true));
    
    // execute requested data preview command
    let viewDataCommand: string = 'vscode.open'; // default
    commands.getCommands().then(availableCommands => {
      if (availableCommands.includes(this.dataPreviewCommand)) {
        viewDataCommand = this.dataPreviewCommand;
      }
      commands.executeCommand(viewDataCommand, dataUri);
    });
  }

  /**
   * Reloads vega preview on vega spec json doc save changes or vscode IDE reload.
   */
  public refresh(): void {
    // reveal corresponding Vega preview panel
    this._panel.reveal(this._panel.viewColumn, true); // preserve focus
    if (this._url.startsWith('https://vega.github.io/editor/#/url/')) {
      // get encoded vega spec from online editor url
      const vegaSpecInfo = this.getVegaSpecInfo('https://vega.github.io/editor/#/url/', this._url);
      this._content = vegaSpecInfo.specString;
      this.refreshView(this._content, vegaSpecInfo.fileType);
    }
    else if (this._url.startsWith('https://gist.github.com/')) {
      this.loadVegaGist(this._url);
    }
    else {
      // try to open local Vega json spec text document
      workspace.openTextDocument(this.uri).then(document => {
        this._logger.debug('refresh(): file:', this._fileName);
        this._content = document.getText();
        this.refreshView(this._content);
      });
    }
  }

  /**
   * Refreshes Vega preview.
   * @param vegaSpec Vega spec string to parse and visualize.
   * @param fileType Vega spec file type.
   */
  private refreshView(vegaSpec: string, fileType: string = null): void {
    try {
      // parse Vega spec string
      this._spec = JSON.parse(vegaSpec);

      // extract data sources
      const data = this.getData(this._spec);

      if (this._url.startsWith('https://vega.github.io/editor/#/url/')) {
        // update vega editor spec file name
        const title = this._spec['title'];
        const description = this._spec['description'];
        if (title !== undefined) {
          this._fileName = `${title}.${fileType}`;
        }
        else if (description !== undefined) {
          // use truncated description for filename title
          this._fileName = `${description.substr(0, 100)}.${fileType}`;
        } 
        else {
          this._fileName = `Unititled.${fileType}`;
        }
        // update web view panel title
        this._panel.title = this._fileName;
      }

      // refresh web view
      this.webview.postMessage({
        command: 'refresh',
        fileName: this._fileName,
        uri: this._uri.toString(),
        spec: vegaSpec,
        data: data
      });
    }
    catch (error) {
      this._logger.error('refresh():', error.message);
      this.webview.postMessage({error: error});
    }
  }

  /**
   * Creates Vega spec info from encoded vega spec url.
   * @param {string} baseUrl Vega spec base url to strip out.
   * @param {string} vegaSpecUrl Full Vega spec url.
   */
  private getVegaSpecInfo(baseUrl: string, vegaSpecUrl: string): any {
    // extract vega spec from url
    const vegaSpecUrlPart = vegaSpecUrl.replace(baseUrl, '');
    const vegaSpecPosition = vegaSpecUrlPart.indexOf('/');
    const vegaSpecType = vegaSpecUrlPart.substring(0, vegaSpecPosition);
    this._logger.debug('getVegaSpecInfo(): spec type:', vegaSpecType);

    const compressedVegaSpec = vegaSpecUrlPart.substring(vegaSpecPosition + 1);
    const vegaSpecString = lzString.decompressFromEncodedURIComponent(compressedVegaSpec);
    return {
      fileType: (vegaSpecType === 'vega' ? 'vg.json' : 'vl.json'),
      specString: vegaSpecString,
      compressedString: compressedVegaSpec
    };
  }

  /**
   * Loads Vega spec from github gist.
   * @param vegaGistUrl Vega spec gist url.
   */
  private loadVegaGist(vegaGistUrl: string): void {
    // extract gist info from gist url
    const pathTokens: Array<string> = this._uri.path.split('/');
    const fragment: string = this._uri.fragment;
    const gistId: string = pathTokens[2]; // skip github username

    this._logger.debug('loadVegaGist(): gist url', vegaGistUrl);
    this._logger.debug('loadVegaGist(): gist id:', gistId);
    this._logger.debug('loadVegaGist(): fragment:', fragment);

    // get gist content
    const requestOptions: any = {
      protocol: 'https:',
      host: 'api.github.com',
      port: 443,
      path: `/gists/${gistId}`,
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'vscode-vega-viewer'
      }
    };
    https.get(requestOptions, (response) => {
      response.setEncoding('utf8');      
      let data: string = '';
      response.on('data', (chunk) => {
        data += chunk;
      });
      response.on('end', () => {
        // parse gist info
        const gist: any = JSON.parse(data);

        // get vega files
        const vegaFiles: Array<any> = Object.keys(gist.files).filter(fileName => 
          (fileName.endsWith('.vg.json') || fileName.endsWith('.vl.json')));          
        this._logger.debug('loadVegaGist(): Vega files', vegaFiles);

        if (vegaFiles.length > 0) {
          // load the first vega file from gist for now
          this._fileName = vegaFiles[0];
          // update web view panel title
          this._panel.title = this._fileName;
          // display vega spec from gist
          this._content = gist.files[this._fileName].content;
          const fileType: string = (this._fileName.endsWith('.vg.json')) ? 'vg.json': 'vl.json';
          this.refreshView(this._content, fileType);
        }
      });
    }).on('error', (error) => {
      this._logger.error('loadVegaGist():', error.message);
      this.webview.postMessage({error: error});
    });
  } // end of loadVegaGist()

  /**
   * Extracts data urls and loads local data files to pass to vega preview webview.
   * @param spec Vega json doc spec root or nested data references to extract.
   */
  private getData(spec: any): any {
    const dataFiles = {};

    // get top level data urls
    let dataUrls: Array<string> = this.getDataUrls(spec);

    // add nested spec data urls for view compositions (facets, repeats, etc.)
    dataUrls = dataUrls.concat(this.getDataUrls(spec['spec']));
    this._logger.debug('getData(): dataUrls:', dataUrls);

    // get all local files data
    dataUrls.forEach(dataUrl => {
      if (dataUrl.startsWith('http://') || dataUrl.startsWith('https://')) {
        // add remote data source reference
        dataFiles[dataUrl] = dataUrl;
      }
      else {
        // get local file data
        const fileData: string = this.getFileData(dataUrl);
        if (fileData) {
          dataFiles[dataUrl] = fileData;
        }
        this._logger.debug('getData(): localDataUrl:', dataUrl);
      }
    });
    return dataFiles;
  }
  
  /**
   * Recursively extracts data urls from the specified vega json doc spec 
   * or knowwn nested data elements for loading local data content.
   * @param spec Vega json doc spec root or nested data references to extract.
   */
  private getDataUrls(spec: any): Array<string> {
    let dataUrls: Array<string> = [];
    if (spec === undefined){
      return dataUrls; // base case
    }
    const data: any = spec['data'];
    const transforms: Array<any> = spec['transform'];
    let layers: Array<any> = [];
    layers = layers.concat(spec['layer']);
    layers = layers.concat(spec['concat']);
    layers = layers.concat(spec['hconcat']);
    layers = layers.concat(spec['vconcat']);
    if (data !== undefined) {
      // get top level data references
      if (Array.isArray(data)) {
        data.filter(d => d['url'] !== undefined).forEach(d => {
          dataUrls.push(d['url']);
        });
      }
      else if (data['url'] !== undefined) {
        dataUrls.push(data['url']);
      }
    }
    if (layers !== undefined && Array.isArray(layers)) {
      // get layers data references
      layers.forEach(layer => {
        dataUrls = dataUrls.concat(this.getDataUrls(layer));
      });
    }
    if (transforms !== undefined) {
      // get transform data references
      transforms.forEach(transformData => {
        dataUrls = dataUrls.concat(this.getDataUrls(transformData['from']));
      });
    }
    return dataUrls;
  }

  /**
   * Loads actual local data file content.
   * @param filePath Local data file path.
   * TODO: change this to async later
   */
  private getFileData(filePath: string): string {
    let data:string = null;
    const dataFilePath = path.join(path.dirname(this._uri.fsPath), filePath);
    if (fs.existsSync(dataFilePath)) {
      data = fs.readFileSync(dataFilePath, 'utf8');
    }
    else {
      this._logger.error('getFileData():', `${filePath} doesn't exist`);
    }
    return data;
  }

  /**
   * Encodes Vega spec and opens it in browser 
   * for preview and edits in Vega Editor online.
   */
  private viewOnline(): void {
    const vegaSpecType: string = this._fileName.endsWith('.vg.json') ? 'vega' : 'vega-lite';
    let vegaEditorUrl: string = `https://vega.github.io/editor/#/url/${vegaSpecType}/`;
    vegaEditorUrl += lzString.compressToEncodedURIComponent(this._content);
    const vegaEditorUri: Uri = Uri.parse(vegaEditorUrl);
    commands.executeCommand('vscode.open', vegaEditorUri);
  }

  /**
   * Displays Save SVG dialog and saves it for export SVG feature from preview panel.
   * @param svg Svg document export to save.
   */
  private async exportSvg(svg: string): Promise<void> {
    const svgFilePath: string = this.getFilePath().replace('.json', '');
    const svgFileUri: Uri = await window.showSaveDialog({
      defaultUri: Uri.parse(svgFilePath).with({scheme: 'file'}),
      filters: {'SVG': ['svg']}
    });
    if (svgFileUri) {
      fs.writeFile(svgFileUri.fsPath, svg, (error) => {
        if (error) {
          const errorMessage: string = `Failed to save file: ${svgFileUri.fsPath}`;
          this._logger.error('exportSvg():', errorMessage);
          window.showErrorMessage(errorMessage);
        }
      });
    }
    this.webview.postMessage({command: 'showMessage', message: ''});
  }

  /**
   * Displays Save PNG dialog and saves it for export PNG feature from preview panel.
   * @param imageData Image data to save in png format.
   */
  private async exportPng(imageData: string): Promise<void> {
    const base64: string = imageData.replace('data:image/png;base64,', '');
    const pngFilePath: string = this.getFilePath().replace('.json', '');
    const pngFileUri: Uri = await window.showSaveDialog({
      defaultUri: Uri.parse(pngFilePath).with({scheme: 'file'}),
      filters: {'PNG': ['png']}
    });
    if (pngFileUri) {
      fs.writeFile(pngFileUri.fsPath, base64, 'base64', (error) => {
        if (error) {
          const errorMessage: string = `Failed to save file: ${pngFileUri.fsPath}`;
          this._logger.error('exportPng():', errorMessage);
          window.showErrorMessage(errorMessage);
        }
      });
    }
    this.webview.postMessage({command: 'showMessage', message: ''});
  }

  /**
   * Displays Save Vega spec dialog and saves it.
   * @param vegaSpec Vega spec json to save.
   */
  private async saveVegaSpec(vegaSpec: any): Promise<void> {
    const specFilePath: string = this.getFilePath();
    const specFileUri: Uri = await window.showSaveDialog({
      defaultUri: Uri.parse(specFilePath).with({scheme: 'file'}),
      filters: {'JSON': ['json']}
    });
    if (specFileUri) {
      fs.writeFile(specFileUri.fsPath, this._content, (error) => {
        if (error) {
          const errorMessage: string = `Failed to save file: ${specFileUri.fsPath}`;
          this._logger.error('saveVegaSpec():', errorMessage);
          window.showErrorMessage(errorMessage);
        }
        else {
          // open saved Vega spec
          commands.executeCommand('vscode.open', specFileUri);
        }
      });
    }
    this.webview.postMessage({command: 'showMessage', message: ''});
  }

  /**
   * Creates local file path for saving json and image files.
   */
  private getFilePath() {
    let filePath: string = this._uri.fsPath;
    if (this._url.startsWith('https://')) {
      filePath = this._fileName;
    }
    return filePath;
  }

  /**
   * Disposes this preview resources.
   */
  public dispose() {
    previewManager.remove(this);
    this._panel.dispose();
    while (this._disposables.length) {
      const item = this._disposables.pop();
      if (item) {
        item.dispose();
      }
    }
  }

  /**
   * Gets preview panel visibility status.
   */
  get visible(): boolean {
    return this._panel.visible;
  }

  /**
   * Gets the underlying webview instance for this preview.
   */
  get webview(): Webview {
    return this._panel.webview;
  }
    
  /**
   * Gets the source vega spec json doc uri for this preview.
   */
  get uri(): Uri {
    return this._uri;
  }

  /**
   * Gets the preview uri to load on commands triggers or vscode IDE reload. 
   */
  get previewUri(): Uri {
    return this._previewUri;
  }
  
  /**
   * Gets the html content to load for this preview.
   */
  get html(): string {
    return this._html;
  }

  /**
   * Gets vega data preview command setting.
   */
  get dataPreviewCommand(): string {
    return <string>workspace.getConfiguration('vega.viewer').get('dataPreviewCommand');
  }
}
