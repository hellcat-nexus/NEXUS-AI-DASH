import { ChatMessage } from '../types/ai';

export class ConversationHistoryManager {
  private history: ChatMessage[] = [];
  private limit: number;

  constructor(limit: number) {
    this.limit = limit;
    this.loadHistory();
  }

  private loadHistory(): void {
    try {
      const stored = localStorage.getItem('nexus-ai-conversation-history');
      if (stored) {
        this.history = JSON.parse(stored);
        this.trimHistory();
      }
    } catch (error) {
      console.error('Failed to load conversation history:', error);
      this.history = [];
    }
  }

  private saveHistory(): void {
    try {
      localStorage.setItem('nexus-ai-conversation-history', JSON.stringify(this.history));
    } catch (error) {
      console.error('Failed to save conversation history:', error);
    }
  }

  private trimHistory(): void {
    if (this.history.length > this.limit) {
      this.history = this.history.slice(-this.limit);
    }
  }

  public addMessage(message: ChatMessage): void {
    this.history.push(message);
    this.trimHistory();
    this.saveHistory();
  }

  public getHistory(): ChatMessage[] {
    return [...this.history];
  }

  public clearHistory(): void {
    this.history = [];
    this.saveHistory();
  }

  public size(): number {
    return this.history.length;
  }

  public setLimit(limit: number): void {
    this.limit = limit;
    this.trimHistory();
    this.saveHistory();
  }
}