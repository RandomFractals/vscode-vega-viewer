import * as fs from 'fs';
import * as path from 'path';

/**
 * Template manager api interface.
 */
export interface ITemplateManager {
  getTemplate(name: string): Template;
}

/**
 * Template type for loading file templates.
 */
export class Template {
  // template name
  public name: string = '';

  // template file content
  public content: string = '';
}

/**
 * Template manager implementation for html files.
 */
export class TemplateManager implements ITemplateManager {
  
  // loaded templates
  private templates: Array<Template>;

  /**
   * Creates new template manager and loads templates 
   * from the specified template folder.
   * @param templateFolder Template folder to inspect.
   */
  public constructor(private templateFolder: string) {
    this.templates = this.loadTemplates();
  }

  /**
   * Loads .html and .json templates from the specified template folder.
   * @param templateFolder Template folder to inspect.
   */
  private loadTemplates(): Array<Template> {
    // console.info('vega.viewer: loading vega templates...');
    const fileNames: string[] = fs.readdirSync(this.templateFolder)
      .filter(fileName => fileName.endsWith('.html') || fileName.endsWith('.json'));
    const templates: Array<Template> = [];
    fileNames.forEach(fileName => templates.push(
      {name: fileName, content: fs.readFileSync(path.join(this.templateFolder, fileName), 'utf8')}
    ));
    // console.log('vega.viewer:templates:', fileNames);
    return templates;
  }

  /**
   * Gets file template with the specified name.
   * @param name template name to find.
   */
  public getTemplate(name: string): Template {
    return this.templates.find(t => t.name === name);
  }
}