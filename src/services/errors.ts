export class NEXUSAIBaseError extends Error {
  public code: string;
  public details?: any;

  constructor(message: string, code: string, details?: any) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, NEXUSAIBaseError.prototype);
  }
}

export class AIConfigurationError extends NEXUSAIBaseError {
  constructor(message: string, details?: any) {
    super(message, 'AI_CONFIG_ERROR', details);
    Object.setPrototypeOf(this, AIConfigurationError.prototype);
  }
}

export class AIRateLimitError extends NEXUSAIBaseError {
  constructor(message: string, details?: any) {
    super(message, 'AI_RATE_LIMIT_ERROR', details);
    Object.setPrototypeOf(this, AIRateLimitError.prototype);
  }
}

export class AIAPIError extends NEXUSAIBaseError {
  constructor(message: string, details?: any) {
    super(message, 'AI_API_ERROR', details);
    Object.setPrototypeOf(this, AIAPIError.prototype);
  }
}

export class AIContextError extends NEXUSAIBaseError {
  constructor(message: string, details?: any) {
    super(message, 'AI_CONTEXT_ERROR', details);
    Object.setPrototypeOf(this, AIContextError.prototype);
  }
}

export class AIAnalysisError extends NEXUSAIBaseError {
  constructor(message: string, details?: any) {
    super(message, 'AI_ANALYSIS_ERROR', details);
    Object.setPrototypeOf(this, AIAnalysisError.prototype);
  }
}

export class AICacheError extends NEXUSAIBaseError {
  constructor(message: string, details?: any) {
    super(message, 'AI_CACHE_ERROR', details);
    Object.setPrototypeOf(this, AICacheError.prototype);
  }
}


