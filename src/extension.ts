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
  TextDocumentChangeEvent 
} from "vscode";
import * as path from 'path';
import VegaPreview from './vega.preview';
import {PreviewManager, previewManager} from './preview.manger';

const VEGA_FILE_EXTENSIONS: string[] = [
  '.vega',
  '.vg',
  '.vl',
  '.vg.json',
  '.vl.json'
];

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
  workspace.onDidSaveTextDocument((document: TextDocument) => {
    if (isVegaFile(document)) {
      const uri: Uri = document.uri.with({scheme: 'vega'});
      const preview: VegaPreview = previewManager.find(uri);
      if (preview) {
        preview.refresh();
      }
    }
  });

  // Reset associated preview on Vega file change
  workspace.onDidChangeTextDocument((changeEvent: TextDocumentChangeEvent) => {
    if (isVegaFile(changeEvent.document)) {
      const uri: Uri = changeEvent.document.uri.with({scheme: 'vega'});
      const preview: VegaPreview = previewManager.find(uri);
      if (preview && changeEvent.contentChanges.length > 0) {
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
  const fileName: string = path.basename(document.uri.fsPath).replace('.json', ''); // strip out .json ext
  const fileExt: string = fileName.substr(fileName.lastIndexOf('.') + 1);
  console.log('vega.viewer.isVegaFile: doc:', fileName , 'lang:', document.languageId, 'ext:', fileExt);
  //console.log('vega:content:', document.getText());
  return VEGA_FILE_EXTENSIONS.findIndex(vegaFileExt => vegaFileExt === fileExt) >= 0;
}

function getViewColumn(): ViewColumn {
  const activeEditor = window.activeTextEditor;
  return activeEditor ? (activeEditor.viewColumn + 1) : ViewColumn.One;
}
