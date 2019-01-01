'use strict';
import { 
  workspace, 
  window, 
  ExtensionContext, 
  Disposable, 
  Uri, 
  ViewColumn, 
  Memento, 
  Webview,
  WebviewOptions, 
  WebviewPanel, 
  WebviewPanelOnDidChangeViewStateEvent 
} from 'vscode';
import * as path from 'path';
import { previewManager } from './preview.manger';

export default class VegaPreview {
    
  private _storage: Memento;
  private _uri: Uri;
  private _previewUri: Uri;
  private _fileName: string;
  private _title: string;
  private _panel: WebviewPanel;
  protected _disposables: Disposable[] = [];

  constructor(context: ExtensionContext, uri: Uri, viewColumn: ViewColumn) {
    this._storage = context.workspaceState;
    this._uri = uri;
    this._fileName = path.basename(uri.fsPath);
    this.initWebview('vega-preview', viewColumn);
    //this.initService(context);
    this.configure();
  }

  private initWebview(scheme: string, viewColumn: ViewColumn) {
    this._previewUri = this._uri.with({scheme: scheme});
    this._title = `Preview ${this._fileName}`;
    const webviewOptions: WebviewOptions = {
      enableScripts: true,
      enableCommandUris: true,
    };
    this._panel = window.createWebviewPanel('vega.preview', 
      this._title, viewColumn, webviewOptions);

    this._panel.onDidDispose(() => {
      this.dispose();
    }, null, this._disposables);

    this._panel.onDidChangeViewState((e: WebviewPanelOnDidChangeViewStateEvent) => {
      let active = e.webviewPanel.visible;
    }, null, this._disposables);

    this.webview.onDidReceiveMessage((e) => {
      if (e.error) {
        window.showErrorMessage(e.error);
      }
    }, null, this._disposables);

    previewManager.add(this);
  }

  private getLocalResourceRoots(): Uri[] {
    const folder = workspace.getWorkspaceFolder(this.uri);
    if (folder) {
      return [folder.uri];
    }
    if (!this.uri.scheme || this.uri.scheme === 'file') {
      return [Uri.file(path.dirname(this.uri.fsPath))];
    }
    return [];
  }
  
  public update(content: string, options: any) {
    //this._service.init(content, options);
    this.webview.html = this.html;
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
    this.refresh();
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

  refresh(): void {
    // TODO
    console.log('vega.preview.referesh:', this._fileName);
  }
  
  get html(): string {
    return `<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta http-equiv="Content-Security-Policy" 
          content="default-src * 'unsafe-inline' 'unsafe-eval'; frame-src *;">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Vega Preview</title>
        <script src="https://cdn.jsdelivr.net/npm/vega@4.4"></script>
        <script src="https://cdn.jsdelivr.net/npm/vega-lite@3.0.0-rc10"></script>
        <script src="https://cdn.jsdelivr.net/npm/vega-embed@3.26.1"></script>
        <style>
          body {
            background-color: #fff;
          }
        </style>
      </head>
      <body>
        <div id="vis"></div>
        <script type="text/javascript">
          var spec = "https://raw.githubusercontent.com/vega/vega/master/docs/examples/bar-chart.vg.json";
          vegaEmbed('#vis', spec).then(function(result) {
            // Access the Vega view instance (https://vega.github.io/vega/docs/api/view/) as result.view
          }).catch(console.error);
        </script>
      </body>
    </html>`;
  }
}
