"use strict";
import {
  workspace, 
  window, 
  commands, 
  ExtensionContext,
  Disposable, 
  Uri, 
  ViewColumn, 
  TextDocument, 
} from "vscode";
import VegaPreview from './vega.preview';
import {PreviewManager, previewManager} from './preview.manger';

export function activate(context: ExtensionContext) {
  // Vega: Preview
  let vegaWebview: Disposable = commands.registerCommand('vega.preview', (uri) => {
    let resource: any = uri;
    let viewColumn: ViewColumn = getViewColumn();
    if (!(resource instanceof Uri)) {
      if (window.activeTextEditor) {
        resource = window.activeTextEditor.document.uri;
      } else {
        window.showInformationMessage('Open a Vega file first to Preview.');
        return;
      }
    }
    const preview: VegaPreview = new VegaPreview(context, resource, viewColumn);
    return preview.webview;
  });

  // Add disposable commands to subscriptions
  context.subscriptions.push(vegaWebview);

  // Refresh associated preview on Vega file save
  workspace.onDidSaveTextDocument(document => {
    if (isVegaFile(document)) {
      const uri: Uri = document.uri.with({scheme: 'vega-preview'});
      const preview: VegaPreview = previewManager.find(uri);
      if (preview) {
        preview.refresh();
      }
    }
  });

  // Reset associated preview on Vega file change
  workspace.onDidChangeTextDocument(args => {
    if (isVegaFile(args.document)) {
      const uri: Uri = args.document.uri.with({scheme: 'vega-preview'});
      const preview: VegaPreview = previewManager.find(uri);
      if (preview && args.contentChanges.length > 0) {
        preview.refresh();
      }
    }
  });

  // Reset all previews on config change
  workspace.onDidChangeConfiguration(() => {
    previewManager.configure();
  });

} // end of activate()

export function deactivate() {
}

function isVegaFile(document: TextDocument) {
  // TODO
  return true;
}

function getViewColumn(): ViewColumn {
  const activeEditor = window.activeTextEditor;
  return activeEditor ? (activeEditor.viewColumn + 1) : ViewColumn.One;
}
