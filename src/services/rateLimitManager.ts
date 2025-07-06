export class RateLimitManager {
  private rateLimiter: Map<string, number> = new Map();
  private interval: number;

  constructor(interval: number) {
    this.interval = interval; // milliseconds
  }

  public checkRateLimit(endpoint: string): boolean {
    const now = Date.now();
    const lastCall = this.rateLimiter.get(endpoint) || 0;
    
    if (now - lastCall < this.interval) {
      return false;
    }
    
    this.rateLimiter.set(endpoint, now);
    return true;
  }

  public setInterval(interval: number): void {
    this.interval = interval;
  }
}


