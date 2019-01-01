'use strict';
import { Uri } from 'vscode';
import VegaPreview from './vega.preview';

export class PreviewManager {
    
  private static _instance: PreviewManager;
  private _previews: VegaPreview[] = [];

  private constructor() {
  }

  public static get Instance() {
    return this._instance || (this._instance = new this());
  }

  public add(preview: VegaPreview): void {
    this._previews.push(preview!);
  }

  public remove(preview: VegaPreview): void {
    let found = this._previews.indexOf(preview!);
    if (found >= 0) {
      this._previews.splice(found, 1);
    }
  }

  public find(uri: Uri): VegaPreview {        
    return this._previews.find(p => p.previewUri.toString() === uri.toString());
  }

  public active(): VegaPreview {
    return this._previews.find(p => p.visible);
  }
    
  public configure(): void {
    this._previews.forEach(p => p.configure());
  }
}

export const previewManager = PreviewManager.Instance;
