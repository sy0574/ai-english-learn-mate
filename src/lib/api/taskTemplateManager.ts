import { TaskTemplate, TaskTemplateInput } from '../types/taskTemplate';

const STORAGE_KEY = 'task-templates';

export class TaskTemplateManager {
  private static instance: TaskTemplateManager;
  private templates: Map<string, TaskTemplate>;

  private constructor() {
    this.templates = this.loadTemplates();
  }

  public static getInstance(): TaskTemplateManager {
    if (!TaskTemplateManager.instance) {
      TaskTemplateManager.instance = new TaskTemplateManager();
    }
    return TaskTemplateManager.instance;
  }

  private loadTemplates(): Map<string, TaskTemplate> {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const templates = JSON.parse(saved) as TaskTemplate[];
        return new Map(templates.map(template => [template.id, template]));
      }
    } catch (error) {
      console.error('Error loading task templates:', error);
    }
    return new Map();
  }

  private saveTemplates(): void {
    try {
      const templates = Array.from(this.templates.values());
      localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
    } catch (error) {
      console.error('Error saving task templates:', error);
    }
  }

  public getAllTemplates(): TaskTemplate[] {
    return Array.from(this.templates.values()).sort((a, b) => {
      // Sort by priority first
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      // Then by updated date
      return new Date(b.updated).getTime() - new Date(a.updated).getTime();
    });
  }

  public getTemplate(id: string): TaskTemplate | undefined {
    return this.templates.get(id);
  }

  public createTemplate(input: TaskTemplateInput): TaskTemplate {
    const now = new Date().toISOString();
    const template: TaskTemplate = {
      ...input,
      id: `template_${Date.now()}`,
      created: now,
      updated: now,
    };

    this.templates.set(template.id, template);
    this.saveTemplates();
    return template;
  }

  public updateTemplate(id: string, updates: Partial<TaskTemplateInput>): TaskTemplate {
    const existing = this.templates.get(id);
    if (!existing) {
      throw new Error(`Template with ID ${id} not found`);
    }

    const updated: TaskTemplate = {
      ...existing,
      ...updates,
      id,
      updated: new Date().toISOString(),
    };

    this.templates.set(id, updated);
    this.saveTemplates();
    return updated;
  }

  public deleteTemplate(id: string): boolean {
    const deleted = this.templates.delete(id);
    if (deleted) {
      this.saveTemplates();
    }
    return deleted;
  }

  public executeTemplate(
    id: string, 
    variables: Record<string, string>
  ): { prompt: string; timeout: number; priority: TaskTemplate['priority'] } {
    const template = this.templates.get(id);
    if (!template) {
      throw new Error(`Template with ID ${id} not found`);
    }

    // Replace variables in the user prompt template
    let prompt = template.userPromptTemplate;
    Object.entries(variables).forEach(([key, value]) => {
      prompt = prompt.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
    });

    return {
      prompt: `${template.systemPrompt}\n\n${prompt}`,
      timeout: template.timeoutMs,
      priority: template.priority,
    };
  }
}
