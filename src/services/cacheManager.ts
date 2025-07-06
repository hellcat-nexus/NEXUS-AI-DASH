export class CacheManager<T> {
  private cache: Map<string, { data: T; timestamp: number }> = new Map();
  private duration: number;

  constructor(duration: number) {
    this.duration = duration; // milliseconds
  }

  public get(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp > this.duration) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  public set(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  public clear(): void {
    this.cache.clear();
  }

  public size(): number {
    return this.cache.size;
  }

  public setDuration(duration: number): void {
    this.duration = duration;
  }

  public cleanup(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.duration) {
        this.cache.delete(key);
      }
    }
  }
}