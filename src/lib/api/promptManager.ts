import { AnalysisTask } from '@/types';
import { ANALYSIS_PROMPTS, PromptTemplate } from '../config/promptTemplates';

const STORAGE_KEY = 'prompt-templates';

export class PromptManager {
  private static instance: PromptManager;
  private promptTemplates: Record<AnalysisTask, PromptTemplate>;

  private constructor() {
    this.promptTemplates = this.loadPromptTemplates();
  }

  public static getInstance(): PromptManager {
    if (!PromptManager.instance) {
      PromptManager.instance = new PromptManager();
    }
    return PromptManager.instance;
  }

  private loadPromptTemplates(): Record<AnalysisTask, PromptTemplate> {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (this.validatePromptTemplates(parsed)) {
          return parsed;
        }
      }
    } catch (error) {
      console.error('Error loading prompt templates:', error);
    }
    return ANALYSIS_PROMPTS;
  }

  private validatePromptTemplates(templates: any): templates is Record<AnalysisTask, PromptTemplate> {
    if (!templates || typeof templates !== 'object') return false;
    
    for (const task of Object.keys(ANALYSIS_PROMPTS)) {
      const template = templates[task];
      if (!template ||
          typeof template.name !== 'string' ||
          typeof template.description !== 'string' ||
          typeof template.systemPrompt !== 'string' ||
          typeof template.userPromptTemplate !== 'string' ||
          !template.outputFormat ||
          !['json', 'text', 'markdown'].includes(template.outputFormat.type)) {
        return false;
      }
    }
    
    return true;
  }

  private savePromptTemplates(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.promptTemplates));
    } catch (error) {
      console.error('Error saving prompt templates:', error);
    }
  }

  public getPromptTemplate(task: AnalysisTask): PromptTemplate {
    return this.promptTemplates[task];
  }

  public updatePromptTemplate(task: AnalysisTask, template: PromptTemplate): void {
    this.promptTemplates[task] = template;
    this.savePromptTemplates();
  }

  public resetToDefaults(): void {
    this.promptTemplates = { ...ANALYSIS_PROMPTS };
    this.savePromptTemplates();
  }

  public generatePrompt(task: AnalysisTask, variables: Record<string, string>): {
    systemPrompt: string;
    userPrompt: string;
    outputFormat: PromptTemplate['outputFormat'];
  } {
    const template = this.getPromptTemplate(task);
    let userPrompt = template.userPromptTemplate;

    // Replace variables in the template
    Object.entries(variables).forEach(([key, value]) => {
      userPrompt = userPrompt.replace(new RegExp(`{{${key}}}`, 'g'), value);
    });

    return {
      systemPrompt: template.systemPrompt,
      userPrompt,
      outputFormat: template.outputFormat
    };
  }
}
