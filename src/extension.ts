"use strict";
import {
  workspace, 
  window, 
  commands, 
  ExtensionContext,
  Disposable,
  QuickPickItem, 
  Uri, 
  ViewColumn, 
  TextDocument,
  TextDocumentChangeEvent 
} from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { VegaPreview, VegaPreviewSerializer } from './vega.preview';
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

  // initialize Vega templates
  const templateManager: ITemplateManager = new TemplateManager(context.asAbsolutePath('templates'));
  const previewTemplate: Template = templateManager.getTemplate('vega.preview.html');

  // register Vega preview serializer for restore on vscode restart
  window.registerWebviewPanelSerializer('vega.preview', 
    new VegaPreviewSerializer(context.extensionPath, previewTemplate.content));

  // Vega: Create Vega document 
  const createVegaDocumentCommand: Disposable = commands.registerCommand('vega.create', () => 
    createVegaDocument(
      templateManager.getTemplate('vega.vg.json').content, 
      templateManager.getTemplate('vega.lite.vl.json').content)
  );
  context.subscriptions.push(createVegaDocumentCommand);

  // Vega: Examples command
  const vegaExamplesCommand: Disposable = commands.registerCommand('vega.examples', () => 
    showVegaExamples(context.asAbsolutePath('examples'), 'vg.json')
  );
  context.subscriptions.push(vegaExamplesCommand);

  // Vega: Examples Lite command
  const vegaExamplesLiteCommand: Disposable = commands.registerCommand('vega.examples.lite', () => 
    showVegaExamples(context.asAbsolutePath('examples'), 'vl.json')
  );
  context.subscriptions.push(vegaExamplesLiteCommand);

  // Vega: Preview command
  const vegaWebview: Disposable = commands.registerCommand('vega.preview', (uri) => {
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
    const preview: VegaPreview = 
      new VegaPreview(context.extensionPath, resource, viewColumn, previewTemplate.content);
    previewManager.add(preview);
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
  // console.info('vega.viewer:isVegaFile:', fileName, document.languageId, 'file');
  return VEGA_FILE_EXTENSIONS.findIndex(vegaFileExt => vegaFileExt === fileExt) >= 0;
}

function getViewColumn(): ViewColumn {
  const activeEditor = window.activeTextEditor;
  return activeEditor ? (activeEditor.viewColumn + 1) : ViewColumn.One;
}

async function createVegaDocument(vegaTemplate: string, vegaLiteTemplate: string): Promise<void> {
  const vegaFileUri: Uri = await window.showSaveDialog({
    defaultUri: Uri.parse(path.join(workspace.rootPath, 'chart')).with({scheme: 'file'}),
    filters: {
      'Vega Document': ['vg'],
      'Vega-Lite Document': ['vl']
    }
  });
  if (vegaFileUri) {
    const vegaContent: string = vegaFileUri.fsPath.endsWith('.vg') ? vegaTemplate : vegaLiteTemplate;
    fs.writeFile(vegaFileUri.fsPath, vegaContent, (error) => {
      if (error) {
        window.showErrorMessage(`Failed to create Vega document: ${vegaFileUri.fsPath}`);
      } else {
        workspace.openTextDocument(vegaFileUri).then(document => {
          window.showTextDocument(document, ViewColumn.One);
        });
      }
    });
  }
}

async function showVegaExamples(examplesPath: string, examplesExtension: string): Promise<void> {
  const fileNames: string[] = fs.readdirSync(examplesPath).filter(f => f.endsWith(examplesExtension));
  const fileItems: Array<QuickPickItem> = [];
  fileNames.forEach(fileName => fileItems.push(
    {label: `$(graph) ${fileName}`}
  ));
  const selectedExample: QuickPickItem = await window.showQuickPick(fileItems, {canPickMany: false});
  if (selectedExample) {
    const exampleFileName: string = selectedExample.label.replace('$(graph) ', '');
    const exampleFileUri: Uri = Uri.file(path.join(examplesPath, exampleFileName));
    workspace.openTextDocument(exampleFileUri).then(document => {
      window.showTextDocument(document, ViewColumn.One);
    });
  }
}