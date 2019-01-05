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
import { previewManager } from './preview.manager';
import { Template, ITemplateManager, TemplateManager } from './template.manager';

const VEGA_FILE_EXTENSIONS: string[] = [
  '.vega',
  '.vg',
  '.vl',
  '.vg.json',
  '.vl.json'
];

export function activate(context: ExtensionContext) {
  console.info('vega.viewer: loading vega templates...');

  // initialize vega templates
  const templateManager: ITemplateManager = new TemplateManager(context.asAbsolutePath('templates'));
  const previewTemplate: Template = templateManager.getTemplate('vega.preview.html');

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
    const preview: VegaPreview = new VegaPreview(context, resource, viewColumn, previewTemplate.content);
    return preview.webview;
  });

  // add disposable commands to subscriptions
  context.subscriptions.push(vegaWebview);

  // refresh associated preview on Vega file save
  workspace.onDidSaveTextDocument((document: TextDocument) => {
    if (isVegaFile(document)) {
      const uri: Uri = document.uri.with({scheme: 'vega'});
      const preview: VegaPreview = previewManager.find(uri);
      if (preview) {
        preview.refresh();
      }
    }
  });

  // reset associated preview on Vega file change
  workspace.onDidChangeTextDocument((changeEvent: TextDocumentChangeEvent) => {
    if (isVegaFile(changeEvent.document)) {
      const uri: Uri = changeEvent.document.uri.with({scheme: 'vega'});
      const preview: VegaPreview = previewManager.find(uri);
      if (preview && changeEvent.contentChanges.length > 0) {
        // TODO: add refresh interval before enabling this
        // preview.refresh();
      }
    }
  });

  // reset all previews on config change
  workspace.onDidChangeConfiguration(() => {
    previewManager.configure();
  });

  console.info('vega.viewer: activated!');
} // end of activate()

export function deactivate() {
}

function isVegaFile(document: TextDocument): boolean {
  const fileName: string = path.basename(document.uri.fsPath).replace('.json', ''); // strip out .json ext
  const fileExt: string = fileName.substr(fileName.lastIndexOf('.'));
  return VEGA_FILE_EXTENSIONS.findIndex(vegaFileExt => vegaFileExt === fileExt) >= 0;
}

function getViewColumn(): ViewColumn {
  const activeEditor = window.activeTextEditor;
  return activeEditor ? (activeEditor.viewColumn + 1) : ViewColumn.One;
}
