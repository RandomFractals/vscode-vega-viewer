'use strict';
import { 
  workspace, 
  window, 
  ExtensionContext, 
  Disposable, 
  Uri, 
  ViewColumn, 
  Memento,
  WorkspaceFolder, 
  Webview,
  WebviewOptions, 
  WebviewPanel, 
  WebviewPanelOnDidChangeViewStateEvent 
} from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { previewManager } from './preview.manager';

export default class VegaPreview {
    
  private _storage: Memento;
  private _uri: Uri;
  private _previewUri: Uri;
  private _fileName: string;
  private _title: string;
  private _panel: WebviewPanel;
  private _html: string;
  protected _disposables: Disposable[] = [];

  constructor(context: ExtensionContext, uri: Uri, 
    viewColumn: ViewColumn, template: string) {
    this._storage = context.workspaceState;
    this._uri = uri;
    this._fileName = path.basename(uri.fsPath);
    this._html = template;
    this.initWebview('vega', viewColumn);
    this.configure();
  }

  private initWebview(scheme: string, viewColumn: ViewColumn) {
    // create preview uri and title
    this._previewUri = this._uri.with({scheme: scheme});
    this._title = `Preview ${this._fileName}`;

    // create webview panel
    const webviewOptions = {
      enableScripts: true,
      enableCommandUris: true,
      retainContextWhenHidden: true,
      localResourceRoots: this.getLocalResourceRoots()
    };
    this._panel = window.createWebviewPanel('vega.preview', 
      this._title, viewColumn, webviewOptions);

    this._panel.onDidDispose(() => {
      this.dispose();
    }, null, this._disposables);

    this._panel.onDidChangeViewState(
      (viewStateEvent: WebviewPanelOnDidChangeViewStateEvent) => {
      let active = viewStateEvent.webviewPanel.visible;
    }, null, this._disposables);

    this.webview.onDidReceiveMessage(message => {
      // console.log(message);
      switch (message) {
        case 'refresh':
          this.refresh();
          break;
      }
    }, null, this._disposables);

    previewManager.add(this);
  }

  private getLocalResourceRoots(): Uri[] {
    const localResourceRoots: Uri[] = [];
    const workspaceFolder: WorkspaceFolder = workspace.getWorkspaceFolder(this.uri);
    if (workspaceFolder) {
      localResourceRoots.push(workspaceFolder.uri);
    }
    else if (!this.uri.scheme || this.uri.scheme === 'file') {
      localResourceRoots.push(Uri.file(path.dirname(this.uri.fsPath)));
    }
    // console.log(localResourceRoots);
    return localResourceRoots;
  }

  public getOptions(): any {
    return {
      uri: this.previewUri.toString(),
      state: this.state
    };
  }

  public configure() {
    let options = this.getOptions();
    this.webview.html = this.html;
    // NOTE: let webview fire refresh
    // when vega preview DOM content is initialized
    // this.refresh();
  }

  public refresh(): void {
    workspace.openTextDocument(this.uri).then(document => {
      // console.log('vega.preview.refresh:', this._fileName);
      const vegaSpec: string = document.getText();
      try {
        const spec = JSON.parse(vegaSpec);
        const data = this.getData(spec);
        this.webview.postMessage({
          spec: vegaSpec,
          data: data
        });
      }
      catch (error) {
        console.error('vega.viewer:', error.message);
        this.webview.postMessage({error: error});
      }
    });
  }

  private getData(spec:any): any {
    const dataFiles = {};
    const data = spec['data'];
    let fileData;
    if (data !== undefined) {
      if (Array.isArray(data)) {
        data.filter(d => d['url'] !== undefined)
          .forEach(d => {
            fileData = this.getFileData(d['url']);
            if (fileData) {
              dataFiles[fileData.url] = fileData.data;
            }
          });
      }
      else if (data['url'] !== undefined) {
        const url = data['url'];
         fileData = this.getFileData(url);
         if (fileData) {
          dataFiles[url] = fileData.data;
         }
      }
    }
    // console.log('vega.viewer:dataFiles:', dataFiles);
    return dataFiles;
  }

  // TODO: change this to async later
  private getFileData(filePath: string) {
    let data = {url: filePath, data: filePath};
    if (!filePath.startsWith('http')) {
      // must be local data file reference
      const dataFilePath = path.join(path.dirname(this._uri.fsPath), filePath);
      // console.log(dataFilePath);
      if (fs.existsSync(dataFilePath)) {
        data['data'] = fs.readFileSync(dataFilePath, 'utf8');
      }
      else {
        data = null;
        console.error('vega.viewer:', `${filePath} doesn't exist`);
      }
    }
    return data;
  }

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

  get visible(): boolean {
    return this._panel.visible;
  }

  get webview(): Webview {
    return this._panel.webview;
  }

  get storage(): Memento {
    return this._storage;
  }
    
  get state(): any {
    return this.storage.get(this.previewUri.toString());
  }
    
  get uri(): Uri {
    return this._uri;
  }

  get previewUri(): Uri {
    return this._previewUri;
  }
  
  get html(): string {
    return this._html;
  }
}
