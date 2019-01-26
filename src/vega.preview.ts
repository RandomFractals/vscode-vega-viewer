'use strict';
import { 
  workspace, 
  window, 
  Disposable, 
  Uri, 
  ViewColumn, 
  Memento,
  WorkspaceFolder, 
  Webview,
  WebviewPanel, 
  WebviewPanelOnDidChangeViewStateEvent, 
  WebviewPanelSerializer
} from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { previewManager } from './preview.manager';

export class VegaPreviewSerializer implements WebviewPanelSerializer {
  constructor(private template: string) {
  }

  async deserializeWebviewPanel(webviewPanel: WebviewPanel, state: any) {
    // console.log('vega.viewer:deserialize:', state.uri.toString());
    previewManager.add(
      new VegaPreview( Uri.parse(state.uri),
        webviewPanel.viewColumn, this.template, webviewPanel
    ));
  }
}
export class VegaPreview {
    
  private _uri: Uri;
  private _previewUri: Uri;
  private _fileName: string;
  private _title: string;
  private _html: string;
  private _panel: WebviewPanel;
  protected _disposables: Disposable[] = [];

  constructor(uri: Uri, viewColumn: ViewColumn, 
    template: string, panel?: WebviewPanel) {
    this._uri = uri;
    this._fileName = path.basename(uri.fsPath);
    this._previewUri = this._uri.with({scheme: 'vega'});
    this._title = `Preview ${this._fileName}`;
    this._html = template;
    this._panel = panel;
    this.initWebview(viewColumn);
    this.configure();
  }

  private initWebview(viewColumn: ViewColumn) {
    if (!this._panel) {
    // create webview panel
    this._panel = window.createWebviewPanel('vega.preview', 
      this._title, viewColumn, 
      this.getWebviewOptions());
    }

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
  }

  private getWebviewOptions(): any {
    return {
      enableScripts: true,
      enableCommandUris: true,
      retainContextWhenHidden: true,
      localResourceRoots: this.getLocalResourceRoots()
    };
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

  public configure() {
    this.webview.html = this.html;
    // NOTE: let webview fire refresh
    // when vega preview DOM content is initialized
    // this.refresh();
  }

  public refresh(): void {
    // reveal corresponding Vega preview panel
    this._panel.reveal(this._panel.viewColumn, true); // preserve focus
    // open Vega json spec text document
    workspace.openTextDocument(this.uri).then(document => {
      // console.log('vega.preview.refresh:', this._fileName);
      const vegaSpec: string = document.getText();
      try {
        const spec = JSON.parse(vegaSpec);
        const data = this.getData(spec);
        this.webview.postMessage({
          uri: this._uri.toString(),
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
