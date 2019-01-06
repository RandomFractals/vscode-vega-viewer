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
import { previewManager } from './preview.manager';

export default class VegaPreview {
    
  private _storage: Memento;
  private _uri: Uri;
  private _previewUri: Uri;
  private _fileName: string;
  private _title: string;
  private _panel: WebviewPanel;
  private _html: string;
  private _content: string;

  protected _disposables: Disposable[] = [];

  constructor(context: ExtensionContext, uri: Uri, viewColumn: ViewColumn, template: string) {
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
    const webviewOptions: WebviewOptions = {
      enableScripts: true,
      enableCommandUris: true,
      localResourceRoots: this.getLocalResourceRoots()
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

  public refresh(): void {
    workspace.openTextDocument(this.uri).then(document => {
      const vegaSpec: string = document.getText();
      // console.log('vega.preview.refresh:', this._fileName);
      this.webview.postMessage({spec: vegaSpec});
    });
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
