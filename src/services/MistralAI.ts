import { Mistral } from '@mistralai/mistralai';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  context?: any;
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
}

export class MistralAIService {
  private static instance: MistralAIService;
  private client: Mistral;
  private apiKey: string = '0sa77QVQOdtKXDcWxKjLkrCFLTU3xb7Y';
  private isConfigured: boolean = true;
  private dashboardContext: DashboardContext | null = null;

  static getInstance(): MistralAIService {
    if (!MistralAIService.instance) {
      MistralAIService.instance = new MistralAIService();
    }
    return MistralAIService.instance;
  }

  constructor() {
    this.client = new Mistral({ apiKey: this.apiKey });
    this.loadConfiguration();
  }

  private loadConfiguration() {
    const stored = localStorage.getItem('mistral-ai-config');
    if (stored) {
      try {
        const config = JSON.parse(stored);
        if (config.apiKey && config.apiKey !== this.apiKey) {
          this.apiKey = config.apiKey;
          this.client = new Mistral({ apiKey: this.apiKey });
        }
      } catch (error) {
        console.error('Failed to load Mistral AI configuration:', error);
      }
    } else {
      // Save the default API key
      localStorage.setItem('mistral-ai-config', JSON.stringify({ apiKey: this.apiKey }));
    }
  }

  public configure(apiKey: string): boolean {
    try {
      this.apiKey = apiKey;
      this.client = new Mistral({ apiKey });
      this.isConfigured = true;
      
      // Save configuration
      localStorage.setItem('mistral-ai-config', JSON.stringify({ apiKey }));
      
      return true;
    } catch (error) {
      console.error('Failed to configure Mistral AI:', error);
      return false;
    }
  }

  public updateDashboardContext(context: DashboardContext) {
    this.dashboardContext = context;
  }

  public async sendMessage(message: string, conversationHistory: ChatMessage[] = []): Promise<string> {
    if (!this.isConfigured) {
      throw new Error('Mistral AI is not configured. Please add your API key.');
    }

    try {
      const systemPrompt = this.buildSystemPrompt();
      const contextPrompt = this.buildContextPrompt();
      
      const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'system', content: contextPrompt },
        ...conversationHistory.slice(-10).map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        { role: 'user', content: message }
      ];

      const response = await this.client.chat.complete({
        model: 'mistral-large-latest',
        messages: messages as any,
        temperature: 0.7,
        maxTokens: 2000,
      });

      return response.choices[0]?.message?.content || 'Sorry, I could not generate a response.';
    } catch (error) {
      console.error('Mistral AI API error:', error);
      throw new Error('Failed to get response from Mistral AI. Please check your API key and try again.');
    }
  }

  private buildSystemPrompt(): string {
    return `You are NEXUS AI, an advanced trading assistant integrated with the NEXUS V5.0 Professional Trading Platform. You have access to real-time market data, trading strategies, positions, risk metrics, and comprehensive trading analytics.

Your capabilities include:
- Analyzing market conditions and providing trading insights
- Evaluating strategy performance and suggesting optimizations
- Assessing risk metrics and portfolio health
- Interpreting order flow and liquidation data
- Reviewing trading journal entries and performance
- Providing educational content about trading concepts
- Helping with platform configuration and setup

You should:
- Be professional, knowledgeable, and concise
- Provide actionable insights based on the current dashboard data
- Use specific numbers and metrics when available
- Suggest concrete actions when appropriate
- Ask clarifying questions when needed
- Explain complex trading concepts clearly
- Always consider risk management in your advice

You have access to the current dashboard state including market data, positions, strategies, risk metrics, and trading history.`;
  }

  private buildContextPrompt(): string {
    if (!this.dashboardContext) {
      return 'No dashboard data is currently available.';
    }

    const context = this.dashboardContext;
    let prompt = 'Current Dashboard Context:\n\n';

    // Market Data
    if (context.marketData && context.marketData.length > 0) {
      prompt += `MARKET DATA:\n`;
      context.marketData.forEach(market => {
        prompt += `- ${market.symbol}: $${market.price} (${market.changePercent >= 0 ? '+' : ''}${market.changePercent.toFixed(2)}%), Volume: ${(market.volume / 1000).toFixed(0)}K\n`;
      });
      prompt += '\n';
    }

    // Active Positions
    if (context.positions && context.positions.length > 0) {
      prompt += `ACTIVE POSITIONS:\n`;
      context.positions.forEach(pos => {
        prompt += `- ${pos.symbol} ${pos.side} ${pos.size} contracts @ $${pos.entryPrice}, Current P&L: ${pos.pnl >= 0 ? '+' : ''}$${pos.pnl.toFixed(0)} (${pos.pnlPercent.toFixed(2)}%)\n`;
      });
      prompt += '\n';
    }

    // Strategy Performance
    if (context.strategies && context.strategies.length > 0) {
      prompt += `STRATEGY STATUS:\n`;
      context.strategies.forEach(strategy => {
        prompt += `- ${strategy.name}: ${strategy.enabled ? 'ACTIVE' : 'INACTIVE'}, Signal: ${strategy.signal}, Confidence: ${strategy.confidence.toFixed(1)}%, P&L: ${strategy.pnl >= 0 ? '+' : ''}$${strategy.pnl.toFixed(0)}\n`;
      });
      prompt += '\n';
    }

    // Risk Metrics
    if (context.riskMetrics) {
      prompt += `RISK METRICS:\n`;
      prompt += `- Daily P&L: ${context.riskMetrics.dailyPnl >= 0 ? '+' : ''}$${context.riskMetrics.dailyPnl.toFixed(0)}\n`;
      prompt += `- Portfolio Heat: ${context.riskMetrics.portfolioHeat.toFixed(1)}%\n`;
      prompt += `- Win Rate: ${context.riskMetrics.winRate.toFixed(1)}%\n`;
      prompt += `- Sharpe Ratio: ${context.riskMetrics.sharpeRatio.toFixed(2)}\n`;
      prompt += `- Max Drawdown: ${context.riskMetrics.maxDrawdown.toFixed(0)}\n\n`;
    }

    // Order Flow
    if (context.orderFlow) {
      prompt += `ORDER FLOW:\n`;
      prompt += `- Cumulative Delta: ${context.orderFlow.cumulativeDelta.toFixed(0)}\n`;
      prompt += `- Bid Volume: ${(context.orderFlow.bidVolume / 1000).toFixed(0)}K\n`;
      prompt += `- Ask Volume: ${(context.orderFlow.askVolume / 1000).toFixed(0)}K\n`;
      prompt += `- Volume Imbalance: ${context.orderFlow.imbalance.toFixed(1)}%\n\n`;
    }

    // MQ Score
    if (context.mqScore) {
      prompt += `MARKET QUALITY SCORE:\n`;
      prompt += `- Overall Score: ${context.mqScore.overallScore.toFixed(1)} (Grade: ${context.mqScore.grade})\n`;
      prompt += `- Liquidity: ${context.mqScore.dimensions.liquidity.score.toFixed(1)} (${context.mqScore.dimensions.liquidity.status})\n`;
      prompt += `- Efficiency: ${context.mqScore.dimensions.efficiency.score.toFixed(1)} (${context.mqScore.dimensions.efficiency.status})\n`;
      prompt += `- Volatility: ${context.mqScore.dimensions.volatility.score.toFixed(1)} (${context.mqScore.dimensions.volatility.status})\n\n`;
    }

    // Recent Trading Performance
    if (context.trades && context.trades.length > 0) {
      const recentTrades = context.trades.slice(-5);
      prompt += `RECENT TRADES (Last 5):\n`;
      recentTrades.forEach(trade => {
        prompt += `- ${trade.symbol} ${trade.type} ${trade.quantity} @ $${trade.entry} → $${trade.exit || 'OPEN'}, Result: ${trade.result >= 0 ? '+' : ''}${trade.result.toFixed(2)}%, R: ${trade.rMultiple.toFixed(2)}\n`;
      });
      prompt += '\n';
    }

    // Broker Connections
    if (context.brokerConnections && context.brokerConnections.length > 0) {
      prompt += `BROKER CONNECTIONS:\n`;
      context.brokerConnections.forEach(conn => {
        prompt += `- ${conn.name} (${conn.type}): ${conn.status}\n`;
      });
      prompt += '\n';
    }

    return prompt;
  }

  public isReady(): boolean {
    return this.isConfigured;
  }

  public getApiKey(): string {
    return this.apiKey;
  }

  // Analysis Methods
  public async analyzeMarketConditions(): Promise<string> {
    if (!this.dashboardContext) {
      return 'No market data available for analysis.';
    }

    const prompt = `Based on the current market data, order flow, and MQ Score, provide a comprehensive analysis of current market conditions. Include:
1. Overall market sentiment and direction
2. Key support/resistance levels
3. Volume and liquidity analysis
4. Risk assessment
5. Trading opportunities or warnings`;

    return this.sendMessage(prompt);
  }

  public async analyzeStrategyPerformance(): Promise<string> {
    if (!this.dashboardContext?.strategies) {
      return 'No strategy data available for analysis.';
    }

    const prompt = `Analyze the current strategy performance and provide insights on:
1. Which strategies are performing best/worst
2. Signal quality and confidence levels
3. Recommendations for strategy optimization
4. Risk-adjusted performance evaluation`;

    return this.sendMessage(prompt);
  }

  public async analyzeRiskProfile(): Promise<string> {
    if (!this.dashboardContext?.riskMetrics) {
      return 'No risk data available for analysis.';
    }

    const prompt = `Evaluate the current risk profile and provide recommendations on:
1. Portfolio heat and exposure levels
2. Risk-reward ratios and position sizing
3. Drawdown analysis and recovery strategies
4. Risk management improvements`;

    return this.sendMessage(prompt);
  }

  public async analyzeTradingJournal(): Promise<string> {
    if (!this.dashboardContext?.trades) {
      return 'No trading history available for analysis.';
    }

    const prompt = `Analyze the trading journal and performance history to identify:
1. Trading patterns and behaviors
2. Best and worst performing setups
3. Areas for improvement
4. Psychological insights and recommendations`;

    return this.sendMessage(prompt);
  }
}

export const mistralAI = MistralAIService.getInstance();