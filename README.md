# Vega Viewer

[![Version](https://img.shields.io/visual-studio-marketplace/v/RandomFractalsInc.vscode-vega-viewer.svg?color=orange&style=?style=for-the-badge&logo=visual-studio-code)](https://marketplace.visualstudio.com/items?itemName=RandomFractalsInc.vscode-vega-viewer)
[![Installs](https://img.shields.io/visual-studio-marketplace/i/RandomFractalsInc.vscode-vega-viewer.svg?color=orange)](https://marketplace.visualstudio.com/items?itemName=RandomFractalsInc.vscode-vega-viewer)
[![Downloads](https://img.shields.io/visual-studio-marketplace/d/RandomFractalsInc.vscode-vega-viewer.svg?color=orange)](https://marketplace.visualstudio.com/items?itemName=RandomFractalsInc.vscode-vega-viewer)
<a href='https://ko-fi.com/F1F812DLR' target='_blank' title='support: https://ko-fi.com/dataPixy'>
  <img height='24' style='border:0px;height:20px;' src='https://az743702.vo.msecnd.net/cdn/kofi3.png?v=2' alt='https://ko-fi.com/dataPixy' /></a>

[Vega Viewer](https://marketplace.visualstudio.com/items?itemName=RandomFractalsInc.vscode-vega-viewer) provides language support and Interactive Preview of [Vega](https://vega.github.io/vega/) and
[Vega-Lite](https://vega.github.io/vega-lite/) `JSON` specification graphs.
Use Vega Viewer to find and prototype custom data visualizations using Vega maps 🗺️ and graphs 📈.

![Advanced Vega Charts](https://github.com/RandomFractals/vscode-vega-viewer/blob/master/docs/images/vega-viewer-advanced-charts.png?raw=true
 "Vega Viewer Advanced Charts Multipanel View")

# Features

- Create Vega or Vega-Lite JSON `{}` specification documents
- Vega and Vega-Lite Graphs Preview 📈
- Local and http(s) data files support
- SVG and PNG Graph Export options
- 724 searchable built-in [Vega](https://vega.github.io/vega/examples/) and [Vega-Lite Examples](https://vega.github.io/vega-lite/examples/)
- [Vega Themes](https://twitter.com/search?q=%23vegaThemes&src=typed_query) Preview
- Load Vega specs from online [Vega Editor](https://vega.github.io/editor) or github gists
- Preview Vega graphs 📈 from starred gists, playgrounds, and data visualizations in [GistPad 📘](https://marketplace.visualstudio.com/items?itemName=vsls-contrib.gistfs)
- View and Share Vega(-Lite) spec in the online [Vega Editor](https://vega.github.io/editor)
- Referenced `CSV` and `JSON` data display via [Data Preview 🈸](https://marketplace.visualstudio.com/items?itemName=RandomFractalsInc.vscode-data-preview)

![Vega Viewer Data Preview](https://github.com/RandomFractals/vscode-vega-viewer/blob/master/docs/images/vega-viewer-data-preview.png?raw=true
 "Vega Viewer Data Preview")

# Settings

Install [Data Preview 🈸](https://marketplace.visualstudio.com/items?itemName=RandomFractalsInc.vscode-data-preview)
or use built-in `vscode.open` command to preivew `CSV` and `JSON` data files referenced in your Vega graph 📈 specifications.

![Vega Viewer Data Preview Command Setting](https://github.com/RandomFractals/vscode-vega-viewer/blob/master/docs/images/vega-viewer-data-preview-command-setting.png?raw=true
 "Vega Viewer Data Preview Command Setting")

# Usage

1. Use `Vega: Create Vega Spec` command from `View -> Command Pallette...` menu
to Create and Save new Vega or Vega-Lite document with the corresponding Vega `json` `$schema` reference.

2. Use `Vega: Preview Vega Graph` command on an open `.vg.json` or `.vl.json` Vega spec document to Preview Graph 📈.

3. Save updated Vega spec `json` document to Preview updated Graph 📈.

4. Use `Vega: Preview Remote Vega Graph` command to preview URL encoded Vega specs from online
[Vega Editor](https://vega.github.io/editor) or [github gists](https://gist.github.com/).

## Built-in Examples

1. Use `Vega: Examples` command to view the list of built-in [Vega Examples](https://vega.github.io/vega/examples/).

2. Use `Vega: Lite Examples` command to view all the [Vega-Lite Maps 🗺 and Graphs 📈](https://vega.github.io/vega-lite/examples/) created by the Vega dev community.

3. Use `Vega: Visual Vocabulary Examples` command to View quick list of [Visual Vocabulary Vega](https://github.com/gramener/visual-vocabulary-vega/) Examples.

...

## Example: [Vega Contour Plot Preview](https://vega.github.io/vega/examples/contour-plot/)

![Vega Viewer Plot Example](https://github.com/RandomFractals/vscode-vega-viewer/blob/master/docs/images/vega-viewer-contour.png?raw=true
 "Vega Viewer Contour Plot Preview")

# Vega Viewer VSCode Contributions

Vega Viewer Settings, Commands, Keyboard Shortcuts, Languages, and JSON Validation feature contributions:

![Vega Viewer Contributions](https://github.com/RandomFractals/vscode-vega-viewer/blob/master/docs/images/vega-viewer-contributions.png?raw=true
 "Vega Viewer VSCode Contributions")

# Vega Viewer Commands

Vega Viewer provides the following Commands to view built-in Vega and Vega-Lite graph examples and create new visualization specification documents:

![Vega Viewer Commands](https://github.com/RandomFractals/vscode-vega-viewer/blob/master/docs/images/vega-viewer-commands.png?raw=true
 "Vega Viewer VSCode Commands")

# Vega Viewer GistPad Integration

Vega Viewer integrates with [GistPad](https://marketplace.visualstudio.com/items?itemName=vsls-contrib.gistfs) extension for Vega and Vega-Lite graph Previews:

![Vega Viewer Gistpad Integration](https://github.com/RandomFractals/vscode-vega-viewer/blob/master/docs/images/vega-viewer-gistpad-integration.png?raw=true
 "Vega Viewer GistPad Integration")

# Recommended Extensions

Recommended extesnsions for working with data, gists, maps and SVG graphs 📈 in [VSCode](https://code.visualstudio.com/):

| Extension | Description |
| --- | --- |
| [Data Preivew 🈸](https://marketplace.visualstudio.com/items?itemName=RandomFractalsInc.vscode-data-preview) | Data Preview 🈸 extension for importing 📤 viewing 🔎 slicing 🔪 dicing 🎲 charting 📊 & exporting 📥 large JSON array/config, YAML, Apache Arrow, Avro & Excel data files. |
| [GistPad 📘](https://marketplace.visualstudio.com/items?itemName=vsls-contrib.gistfs) | VS Code extension for managing and sharing code snippets, notes and interactive samples using GitHub Gists. |
| [SVG](https://marketplace.visualstudio.com/items?itemName=jock.svg) | SVG language support extension. |
| [Geo Data Viewer 🗺️](https://marketplace.visualstudio.com/items?itemName=RandomFractalsInc.geo-data-viewer) | Geo Data Viewer for generating snazzy maps 🗺️ with keplerGL. |

# Dev Log

See [#VegaViewer 📈 tag on Twitter](https://twitter.com/hashtag/vegaviewer?src=hash&f=live&vertical=default) for the latest updates on this vscode extension development.

# Dev Build

```bash
$ git clone https://github.com/RandomFractals/vscode-vega-viewer
$ cd vscode-vega-viewer
$ npm install
$ code .
```
`F5` to launch Vega Viewer extension VSCode debug session:

![Alt text](https://github.com/RandomFractals/vscode-vega-viewer/blob/master/docs/images/vscode-vega-viewer-dev-screen.png?raw=true
 "Vega Viewer Dev Preview")

# Contributions

Any and all test, code and feedback contributions are welcome.

Open an issue or create a pull request to make Vega Viewer 📈 work better for all.

# Support

Become a [Fan](https://github.com/sponsors/RandomFractals/sponsorships?tier_id=18883&preview=false) and sponsor our dev efforts on this and other [Random Fractals, Inc.](https://twitter.com/search?q=%23RandomFractalsInc&src=typed_query&f=live) code and [data viz extensions](https://marketplace.visualstudio.com/publishers/RandomFractalsInc) if you find them useful, educational, or enhancing your daily dataViz/dev code workflows:

☕️ https://ko-fi.com/dataPixy
💖 https://github.com/sponsors/RandomFractals
