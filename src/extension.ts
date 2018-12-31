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
  Webview,
  WebviewPanel
} from "vscode";

const PreviewCommand = "vega.preview";

export function activate(context: ExtensionContext) {
  console.log("vega.viewer is now active!");
  let disposable: Disposable = commands.registerCommand(
    PreviewCommand, (uri) => {
      let resource: Uri = uri;

      // get vega file info
      resource = window.activeTextEditor.document.uri;
      const filePath = resource.path;
      const fileName = filePath.substr(filePath.lastIndexOf('/') + 1);

      // create preview panel
      const webviewOptions = {
        enableScripts: true,
        enableCommandUris: true,
        retainContextWhenHidden: true
      };
      const panel:WebviewPanel = window.createWebviewPanel(
        PreviewCommand,
        `Preview ${fileName}`,
        getViewColumn(),
        webviewOptions
      );
      panel.webview.html = getVegaWebviewHtml();
    }
  );

  // add disposables to subscriptions
  context.subscriptions.push(disposable);
}

export function deactivate() {}

function getViewColumn(): ViewColumn {
  const activeEditor = window.activeTextEditor;
  return activeEditor ? (activeEditor.viewColumn + 1) : ViewColumn.One;
}

function getVegaWebviewHtml() {
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
          var spec = //"https://raw.githubusercontent.com/vega/vega/master/docs/examples/circle-packing.vg.json";
          vegaEmbed('#vis', spec).then(function(result) {
            // Access the Vega view instance (https://vega.github.io/vega/docs/api/view/) as result.view
          }).catch(console.error);
        </script>
      </body>
    </html>`;
}
