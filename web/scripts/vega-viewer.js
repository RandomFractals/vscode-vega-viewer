let vscode, view, message, data, title, 
themeSelector, theme = '',
dataSourceSelector, saveFileTypeSelector;

// start with blank vega spec
let spec = {
  "$schema": "https://vega.github.io/schema/vega/v5.json",
  "width": 400,
  "height": 200,
  "padding": 5
};

// create custom vega data loader
const vegaLoader = vega.loader();
const dataLoader = vega.loader();
dataLoader.load = (uri) => {
  if (uri.startsWith('http://') || uri.startsWith('https://')) {
    return vegaLoader.load(uri);
  }  
  // else use local data passed to this view
  return new Promise((resolve, reject) => {
    if (data !== undefined && data[uri]) {
      resolve(data[uri]);
    }
    else {
      message.innerHTML += `<p>${uri} doesn't exist</p>`;
      reject(`${uri} doesn't exist`);
    } 
  });
};

document.addEventListener('DOMContentLoaded', event => {
  // initialize page elements
  title = document.getElementById('title');
  message = document.getElementById('message');
  dataSourceSelector = document.getElementById('data-source-selector');
  themeSelector = document.getElementById('theme-selector');
  saveFileTypeSelector = document.getElementById('save-file-type-selector');

  // create blank vega embed view
  view = preview(spec);
  try {
    // notify webview
    vscode = acquireVsCodeApi();
    vscode.postMessage({command: 'refresh'});
  }
  catch (error) {
    // ignore: must be loaded outside of vscode webview
  }
});

// vega spec update handler
window.addEventListener('message', event => {
  switch (event.data.command) {
    case 'showMessage':
      showMessage(event.data.message);
      break;
    case 'refresh':
      try {
        vscode.setState({uri: event.data.uri});
        title.innerHtml = `<span class="label">📈</span>${event.data.fileName.replace('.json', '')}`;
        spec = JSON.parse(event.data.spec);
        data = event.data.data;
        loadDataSourceList(data, dataSourceSelector);
        if (saveFileTypeSelector.options.length === 3) { // initial save options count
          loadSaveOptions(event.data.fileName, saveFileTypeSelector);
        }
        view = preview(spec, theme);
      }
      catch (error) {
        console.error('vega.preview:', error.message);
        showMessage(error.message);
      }
      break;
  }
});

function loadDataSourceList(dataSources, dataSourceSelector) {
  // clear data sources display
  dataSourceSelector.innerHTML = '<option value="">🔡 Data</option>';
  // load data source uri's
  Object.keys(dataSources).forEach(dataUri => {
    dataSourceSelector.innerHTML += `<option value="${dataUri}">${dataUri}</option>"`;
  });
}

function loadSaveOptions(fileName, saveFileTypeSelector) {
  if (fileName.endsWith('vg.json')) {
    saveFileTypeSelector.innerHTML += '<option value=".vg.json">&nbsp;{ }&nbsp; vg</option>';
  } 
  else {
    saveFileTypeSelector.innerHTML += '<option value=".vl.json">&nbsp;{ }&nbsp; vl</option>';
  }
}

function changeTheme() {
  theme = themeSelector.value;
  preview(spec, theme);
}

// vega preview update
function preview(spec, theme) {
  showMessage(''); // 'Loading Vega spec preview...';
  vegaEmbed('#vis', spec, {loader: dataLoader, theme: theme})
    .then (result => {
      view = result.view;
    })
    .catch (error => {
      console.error('vega.preview:', error.message);
      showMessage(error.message);
      view = null;
    });
  return view;
}

function reloadData() {
	vscode.postMessage({
		command: 'refresh'
	});
}

function openFile() {
  vscode.postMessage({command: 'openFile'});
}

function viewOnline() {
  vscode.postMessage({command: 'viewOnline'});
}

function showData() {
  const dataUri = dataSourceSelector.value;
  if (dataUri) {
    vscode.postMessage({
      command: 'showData',
      dataUri: dataUri
    });
  }
}

function showHelp() {
  vscode.postMessage({command: 'showHelp'});
}

function buyCoffee() {
  vscode.postMessage({command: 'buyCoffee'});
}

function saveGraph() {
  const fileType = saveFileTypeSelector.value;
  if (!view) return;
  switch (fileType) {
    case '.svg':
      showMessage('Exporting SVG...');
      view.toSVG().then(svg => {
        vscode.postMessage({command: 'exportSvg', svg: svg});
      })
      .catch(error => showMessage(error.message));
      break;
    case '.png':
      showMessage('Exporting PNG...');
      view.toCanvas().then(canvas => {
        vscode.postMessage({
          command: 'exportPng', 
          imageData: canvas.toDataURL()
        });
      })
      .catch(error => showMessage(error.message));            
      break;
    default: // .vg or .vl json
      vscode.postMessage({
        command: 'saveVegaSpec', 
        spec: spec
      });
      break;
  }
}

function showMessage(text) {
  message.innerText = text;
}
