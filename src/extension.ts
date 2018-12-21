'use strict';
import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    console.log('vega-viewer is now active!');
    let disposable = vscode.commands.registerCommand('extension.showVegaView', () => {
        //vscode.window.showInformationMessage('Hello Vega!');
        const panel = vscode.window.createWebviewPanel(
            'vega-viewer', 'Vega Viewer',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            });
        panel.webview.html = getVegaWebviewHtml();
    });
    context.subscriptions.push(disposable);
}

export function deactivate() {
}

function getVegaWebviewHtml() {
    return `<!DOCTYPE html>
        <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Vega Viewer</title>
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