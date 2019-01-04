import * as fs from 'fs';
import * as path from 'path';

export interface ITemplateManager {
  getTemplate(name: string): Template;
}

export class Template {
  public name: string = '';
  public content: string = '';
}

export class TemplateManager implements ITemplateManager {
  private templates: Array<Template>;

  public constructor(private templateFolder: string) {
    this.templates = this.loadTemplates();
  }

  private loadTemplates(): Array<Template> {
    const fileNames = fs.readdirSync(this.templateFolder).filter(f => f.endsWith('.html') || f.endsWith('.json'));
    let templates: Array<Template> = [];
    fileNames.forEach(fileName => templates.push(
      {name: fileName, content: fs.readFileSync(path.join(this.templateFolder, fileName), 'utf8')}
    ));
    console.log('vega.viewer:templates:', fileNames);
    return templates;
  }

  public getTemplate(name: string): Template {
    return this.templates.find(t => t.name === name);
  }
}