export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  context?: any;
  metadata?: {
    model?: string;
    temperature?: number;
    tokens?: number;
    confidence?: number;
  };
}

export interface DashboardContext {
  marketData: any[];
  strategies: any[];
  positions: any[];
  riskMetrics: any;
  orderFlow: any;
  liquidationData: any;
  mqScore: any;
  trades: any[];
  performance: any;
  brokerConnections: any[];
  economicEvents?: any[];
  technicalIndicators?: any;
  sentiment?: any;
  volatility?: any;
  correlations?: any;
}

export interface AIAnalysisResult {
  analysis: string;
  confidence: number;
  recommendations: string[];
  risks: string[];
  opportunities: string[];
  keyMetrics: Record<string, any>;
  timestamp: number;
}

export interface AIConfiguration {
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  topK: number;
  safeMode: boolean;
  rateLimitInterval: number;
  cacheDuration: number;
  conversationHistoryLimit: number;
  customInstructions?: string;
}