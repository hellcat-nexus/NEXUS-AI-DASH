import { AIConfiguration } from "../pasted_content";

export class ConfigurationService {
  private config: AIConfiguration;

  constructor() {
    this.config = {
      apiKey: 
define_api_key_here
,
      model: 'mistral-large-latest',
      temperature: 0.7,
      maxTokens: 4000,
      topP: 0.95,
      topK: 50,
      safeMode: true,
      rateLimitInterval: 1000, // milliseconds
      cacheDuration: 300000, // milliseconds (5 minutes)
      conversationHistoryLimit: 100, // number of messages
    };
    this.loadConfiguration();
  }

  private loadConfiguration() {
    try {
      const stored = localStorage.getItem('nexus-ai-config');
      if (stored) {
        const savedConfig = JSON.parse(stored);
        this.config = { ...this.config, ...savedConfig };
      }
    } catch (error) {
      console.error('Failed to load NEXUS AI configuration:', error);
    }
  }

  public saveConfiguration() {
    try {
      localStorage.setItem('nexus-ai-config', JSON.stringify(this.config));
    } catch (error) {
      console.error('Failed to save NEXUS AI configuration:', error);
    }
  }

  public configure(config: Partial<AIConfiguration>): void {
    this.config = { ...this.config, ...config };
    this.saveConfiguration();
  }

  public getConfiguration(): AIConfiguration {
    return { ...this.config };
  }

  public get<T extends keyof AIConfiguration>(key: T): AIConfiguration[T] {
    return this.config[key];
  }
}

export const configService = new ConfigurationService();


