import { Mistral } from '@mistralai/mistralai';
import { ChatMessage, DashboardContext, AIAnalysisResult, AIConfiguration } from "../pasted_content";
import { configService } from "./config";
import { RateLimitManager } from "./rateLimitManager";
import { CacheManager } from "./cacheManager";
import { ConversationHistoryManager } from "./conversationHistoryManager";
import { AIConfigurationError, AIRateLimitError, AIAPIError, AIContextError, AIAnalysisError } from "./errors";
import { MarketDataFormatter, PortfolioFormatter, StrategyFormatter, RiskMetricsFormatter, OrderFlowFormatter, MarketQualityFormatter, TradingActivityFormatter, ConnectionFormatter } from "./contextFormatters";

export class NEXUSAIService {
  private static instance: NEXUSAIService;
  private client: Mistral | null = null;
  private isConfigured: boolean = false;
  private dashboardContext: DashboardContext | null = null;
  private rateLimitManager: RateLimitManager;
  private analysisCache: CacheManager<AIAnalysisResult>;
  private conversationHistoryManager: ConversationHistoryManager;

  private marketDataFormatter: MarketDataFormatter;
  private portfolioFormatter: PortfolioFormatter;
  private strategyFormatter: StrategyFormatter;
  private riskMetricsFormatter: RiskMetricsFormatter;
  private orderFlowFormatter: OrderFlowFormatter;
  private marketQualityFormatter: MarketQualityFormatter;
  private tradingActivityFormatter: TradingActivityFormatter;
  private connectionFormatter: ConnectionFormatter;

  static getInstance(): NEXUSAIService {
    if (!NEXUSAIService.instance) {
      NEXUSAIService.instance = new NEXUSAIService();
    }
    return NEXUSAIService.instance;
  }

  constructor() {
    this.rateLimitManager = new RateLimitManager(configService.get("rateLimitInterval"));
    this.analysisCache = new CacheManager<AIAnalysisResult>(configService.get("cacheDuration"));
    this.conversationHistoryManager = new ConversationHistoryManager(configService.get("conversationHistoryLimit"));

    this.marketDataFormatter = new MarketDataFormatter();
    this.portfolioFormatter = new PortfolioFormatter();
    this.strategyFormatter = new StrategyFormatter();
    this.riskMetricsFormatter = new RiskMetricsFormatter();
    this.orderFlowFormatter = new OrderFlowFormatter();
    this.marketQualityFormatter = new MarketQualityFormatter();
    this.tradingActivityFormatter = new TradingActivityFormatter();
    this.connectionFormatter = new ConnectionFormatter();

    this.initializeClient();
  }

  private initializeClient() {
    const apiKey = configService.get("apiKey");
    if (apiKey && apiKey !== "define_api_key_here") {
      this.client = new Mistral({ apiKey: apiKey });
      this.isConfigured = true;
    } else {
      this.isConfigured = false;
      this.client = null;
    }
  }

  // Configuration Management
  public configure(config: Partial<AIConfiguration>): boolean {
    try {
      configService.configure(config);
      this.initializeClient();
      this.rateLimitManager.setInterval(configService.get("rateLimitInterval"));
      this.analysisCache.setDuration(configService.get("cacheDuration"));
      this.conversationHistoryManager.setLimit(configService.get("conversationHistoryLimit"));
      return true;
    } catch (error) {
      console.error("Failed to configure NEXUS AI service:", error);
      throw new AIConfigurationError("Failed to configure NEXUS AI service", error);
    }
  }

  public getConfiguration(): AIConfiguration {
    return configService.getConfiguration();
  }

  public getAvailableModels(): string[] {
    // This should ideally come from Mistral API or a predefined list in config
    return [
      'mistral-large-latest',
      'mistral-medium-latest',
      'mistral-small-latest',
      'pixtral-large-latest',
      'codestral-latest'
    ];
  }

  // Context Management
  public updateDashboardContext(context: DashboardContext) {
    this.dashboardContext = context;
    this.analysisCache.clear(); // Clear cache when context changes
  }

  public getDashboardContext(): DashboardContext | null {
    return this.dashboardContext;
  }

  // Core AI Communication
  public async sendMessage(
    message: string,
    options: {
      useHistory?: boolean;
      systemPrompt?: string;
      temperature?: number;
      maxTokens?: number;
      model?: string;
    } = {}
  ): Promise<ChatMessage> {
    if (!this.isConfigured || !this.client) {
      throw new AIConfigurationError("NEXUS AI service not configured. Please provide an API key.");
    }

    if (!this.rateLimitManager.checkRateLimit('sendMessage')) {
      throw new AIRateLimitError("Rate limit exceeded. Please wait a moment.");
    }

    try {
      const systemPrompt = options.systemPrompt || this.buildAdvancedSystemPrompt();
      const contextPrompt = this.buildContextPrompt();

      const messages: any[] = [
        { role: 'system', content: systemPrompt },
        { role: 'system', content: contextPrompt }
      ];

      if (options.useHistory !== false) {
        messages.push(...this.conversationHistoryManager.getHistory().map(msg => ({
          role: msg.role,
          content: msg.content
        })));
      }

      messages.push({ role: 'user', content: message });

      const response = await this.client.chat.complete({
        model: options.model || configService.get("model"),
        messages: messages,
        temperature: options.temperature || configService.get("temperature"),
        maxTokens: options.maxTokens || configService.get("maxTokens"),
        topP: configService.get("topP"),
        safeMode: configService.get("safeMode"),
      });

      const responseContent = response.choices[0]?.message?.content ||
        'Unable to generate response. Please try again.';

      const chatMessage: ChatMessage = {
        id: this.generateId(),
        role: 'assistant',
        content: responseContent,
        timestamp: Date.now(),
        metadata: {
          model: options.model || configService.get("model"),
          temperature: options.temperature || configService.get("temperature"),
          tokens: response.usage?.totalTokens || 0,
          confidence: this.calculateConfidence(responseContent)
        }
      };

      this.conversationHistoryManager.addMessage(chatMessage);

      return chatMessage;
    } catch (error: any) {
      console.error('AI API error:', error);
      if (error.name === 'MistralAPIError') {
        throw new AIAPIError(`Mistral AI API error: ${error.message}`, error);
      } else if (error instanceof NEXUSAIBaseError) {
        throw error; // Re-throw custom errors
      } else {
        throw new AIAPIError(`Unknown AI service error: ${error.message || 'Unknown error'}`, error);
      }
    }
  }

  // Advanced System Prompt
  private buildAdvancedSystemPrompt(): string {
    return `You are NEXUS AI Pro, an elite trading assistant with advanced analytical capabilities integrated with the NEXUS V5.0 Professional Trading Platform.\n\nCORE CAPABILITIES:\n• Real-time market analysis and pattern recognition\n• Advanced risk assessment and portfolio optimization\n• Strategy backtesting and performance evaluation\n• Order flow analysis and market microstructure insights\n• Sentiment analysis and behavioral finance principles\n• Economic calendar integration and macro analysis\n• Multi-timeframe technical analysis\n• Options flow and derivatives analysis\n• Correlation analysis and pair trading insights\n• Automated alert generation and trade signals\n\nANALYTICAL FRAMEWORK:\n• Technical Analysis: Price action, indicators, chart patterns\n• Fundamental Analysis: Economic data, earnings, sector trends\n• Quantitative Analysis: Statistical models, backtesting, optimization\n• Risk Management: Position sizing, stop losses, portfolio heat\n• Behavioral Analysis: Market psychology, sentiment indicators\n• Macro Analysis: Economic cycles, central bank policies\n\nRESPONSE STANDARDS:\n• Provide specific, actionable insights with concrete numbers\n• Always include confidence levels and risk assessments\n• Cite relevant data points and metrics from the dashboard\n• Explain reasoning behind recommendations\n• Highlight both opportunities and risks\n• Use professional trading terminology appropriately\n• Maintain objectivity and avoid emotional bias\n\nRISK MANAGEMENT PRIORITY:\n• Always prioritize capital preservation\n• Consider risk-reward ratios in all recommendations\n• Account for market conditions and volatility\n• Emphasize position sizing and diversification\n• Monitor correlation risks and concentration\n\nYour responses should be professional, precise, and actionable for serious traders and institutions.`;
  }

  private buildContextPrompt(): string {
    if (!this.dashboardContext) {
      return 'No dashboard data currently available. Operating in limited mode.';
    }

    const context = this.dashboardContext;
    let prompt = '=== CURRENT MARKET CONTEXT ===\n\n';

    prompt += this.marketDataFormatter.format(context.marketData);
    prompt += this.portfolioFormatter.format(context.positions);
    prompt += this.strategyFormatter.format(context.strategies);
    prompt += this.riskMetricsFormatter.format(context.riskMetrics);
    prompt += this.orderFlowFormatter.format(context.orderFlow);
    prompt += this.marketQualityFormatter.format(context.mqScore);
    prompt += this.tradingActivityFormatter.format(context.trades);
    prompt += this.connectionFormatter.format(context.brokerConnections);

    return prompt;
  }

  // Comprehensive Analysis Methods (Refactored to use CacheManager)
  public async analyzeMarketConditions(): Promise<AIAnalysisResult> {
    const cacheKey = 'market_conditions';
    const cached = this.analysisCache.get(cacheKey);
    if (cached) return cached;

    const prompt = `Provide a comprehensive market analysis including:\n\n1. MARKET STRUCTURE ANALYSIS\n   - Current trend direction and strength\n   - Key support/resistance levels\n   - Volume profile and liquidity analysis\n\n2. VOLATILITY ASSESSMENT\n   - Current volatility regime\n   - Expected volatility vs implied volatility\n   - Risk-on vs risk-off sentiment\n\n3. MACRO ENVIRONMENT\n   - Economic cycle positioning\n   - Central bank policy implications\n   - Sector rotation patterns\n\n4. TECHNICAL INDICATORS\n   - Multi-timeframe analysis\n   - Momentum and trend indicators\n   - Divergence patterns\n\n5. TRADING OPPORTUNITIES\n   - High-probability setups\n   - Risk-reward assessments\n   - Position sizing recommendations\n\nProvide specific price levels, percentages, and actionable insights.`;

    try {
      const response = await this.sendMessage(prompt, { useHistory: false });
      const analysis = this.parseAnalysisResponse(response.content);
      this.analysisCache.set(cacheKey, analysis);
      return analysis;
    } catch (error) {
      throw new AIAnalysisError("Failed to analyze market conditions", error);
    }
  }

  public async analyzeStrategyPerformance(): Promise<AIAnalysisResult> {
    const cacheKey = 'strategy_performance';
    const cached = this.analysisCache.get(cacheKey);
    if (cached) return cached;

    const prompt = `Analyze current strategy performance with focus on:\n\n1. STRATEGY EFFECTIVENESS\n   - Performance metrics and benchmarking\n   - Risk-adjusted returns analysis\n   - Drawdown analysis and recovery\n\n2. SIGNAL QUALITY\n   - Confidence levels and accuracy\n   - False signal analysis\n   - Timing and execution quality\n\n3. OPTIMIZATION OPPORTUNITIES\n   - Parameter tuning recommendations\n   - Market regime adaptations\n   - Portfolio allocation adjustments\n\n4. RISK MANAGEMENT\n   - Position sizing optimization\n   - Stop-loss effectiveness\n   - Correlation risk assessment\n\n5. IMPLEMENTATION IMPROVEMENTS\n   - Execution quality metrics\n   - Slippage and cost analysis\n   - Technology and infrastructure\n\nProvide specific recommendations with expected impact metrics.`;

    try {
      const response = await this.sendMessage(prompt, { useHistory: false });
      const analysis = this.parseAnalysisResponse(response.content);
      this.analysisCache.set(cacheKey, analysis);
      return analysis;
    } catch (error) {
      throw new AIAnalysisError("Failed to analyze strategy performance", error);
    }
  }

  public async analyzeRiskProfile(): Promise<AIAnalysisResult> {
    const cacheKey = 'risk_profile';
    const cached = this.analysisCache.get(cacheKey);
    if (cached) return cached;

    const prompt = `Conduct comprehensive risk analysis covering:\n\n1. PORTFOLIO RISK METRICS\n   - Value at Risk (VaR) analysis\n   - Maximum drawdown assessment\n   - Sharpe ratio and risk-adjusted returns\n\n2. CONCENTRATION RISK\n   - Position sizing evaluation\n   - Correlation analysis\n   - Sector/geographic exposure\n\n3. MARKET RISK FACTORS\n   - Interest rate sensitivity\n   - Volatility exposure\n   - Liquidity risk assessment\n\n4. OPERATIONAL RISKS\n   - Technology and execution risks\n   - Counterparty risk evaluation\n   - Regulatory compliance\n\n5. STRESS TESTING\n   - Scenario analysis\n   - Tail risk assessment\n   - Crisis period performance\n\nProvide specific risk metrics and mitigation strategies.`;

    try {
      const response = await this.sendMessage(prompt, { useHistory: false });
      const analysis = this.parseAnalysisResponse(response.content);
      this.analysisCache.set(cacheKey, analysis);
      return analysis;
    } catch (error) {
      throw new AIAnalysisError("Failed to analyze risk profile", error);
    }
  }

  public async analyzeTradingJournal(): Promise<AIAnalysisResult> {
    const cacheKey = 'trading_journal';
    const cached = this.analysisCache.get(cacheKey);
    if (cached) return cached;

    const prompt = `Analyze trading journal data for performance insights:\n\n1. BEHAVIORAL PATTERNS\n   - Trading frequency and timing\n   - Emotional decision-making patterns\n   - Consistency in execution\n\n2. PERFORMANCE ANALYTICS\n   - Win/loss ratios and streaks\n   - Best/worst performing setups\n   - Time-based performance variations\n\n3. PSYCHOLOGICAL INSIGHTS\n   - Risk tolerance assessment\n   - Discipline and patience metrics\n   - Bias identification\n\n4. IMPROVEMENT OPPORTUNITIES\n   - Skill development areas\n   - Process optimization\n   - Mental game enhancement\n\n5. SYSTEMATIC IMPROVEMENTS\n   - Rule-based system development\n   - Automation opportunities\n   - Performance tracking enhancements\n\nProvide actionable insights for skill development and performance improvement.`;

    try {
      const response = await this.sendMessage(prompt, { useHistory: false });
      const analysis = this.parseAnalysisResponse(response.content);
      this.analysisCache.set(cacheKey, analysis);
      return analysis;
    } catch (error) {
      throw new AIAnalysisError("Failed to analyze trading journal", error);
    }
  }

  // Advanced Analysis Methods (Refactored to use CacheManager)
  public async analyzeOptionsFlow(): Promise<AIAnalysisResult> {
    const cacheKey = 'options_flow';
    const cached = this.analysisCache.get(cacheKey);
    if (cached) return cached;

    const prompt = `Analyze options flow and derivatives data:\n\n1. UNUSUAL OPTIONS ACTIVITY\n   - Large block trades and sweeps\n   - Unusual volume patterns\n   - Institutional flow indicators\n\n2. VOLATILITY ANALYSIS\n   - Implied volatility surface\n   - Volatility skew analysis\n   - Term structure evaluation\n\n3. POSITIONING INSIGHTS\n   - Put/call ratios\n   - Open interest analysis\n   - Gamma exposure levels\n\n4. MARKET MAKING ACTIVITY\n   - Dealer positioning\n   - Flow direction analysis\n   - Liquidity provision patterns\n\nProvide specific trading opportunities and risk assessments.`;

    try {
      const response = await this.sendMessage(prompt, { useHistory: false });
      const analysis = this.parseAnalysisResponse(response.content);
      this.analysisCache.set(cacheKey, analysis);
      return analysis;
    } catch (error) {
      throw new AIAnalysisError("Failed to analyze options flow", error);
    }
  }

  public async analyzeSentiment(): Promise<AIAnalysisResult> {
    const cacheKey = 'sentiment_analysis';
    const cached = this.analysisCache.get(cacheKey);
    if (cached) return cached;

    const prompt = `Analyze market sentiment and behavioral indicators:\n\n1. SENTIMENT INDICATORS\n   - Fear & Greed Index analysis\n   - Put/call ratios\n   - VIX and volatility metrics\n\n2. POSITIONING DATA\n   - Institutional vs retail positioning\n   - Commitment of Traders (COT) data\n   - Fund flow analysis\n\n3. BEHAVIORAL PATTERNS\n   - Herding behavior identification\n   - Contrarian opportunities\n   - Momentum vs mean reversion\n\n4. SOCIAL SENTIMENT\n   - News sentiment analysis\n   - Social media indicators\n   - Analyst recommendations\n\nProvide sentiment-based trading strategies and risk warnings.`;

    try {
      const response = await this.sendMessage(prompt, { useHistory: false });
      const analysis = this.parseAnalysisResponse(response.content);
      this.analysisCache.set(cacheKey, analysis);
      return analysis;
    } catch (error) {
      throw new AIAnalysisError("Failed to analyze sentiment", error);
    }
  }

  public async generateTradingPlan(): Promise<AIAnalysisResult> {
    const cacheKey = 'trading_plan';
    const cached = this.analysisCache.get(cacheKey);
    if (cached) return cached;

    const prompt = `Create a comprehensive trading plan based on current conditions:\n\n1. MARKET OUTLOOK\n   - Short-term and medium-term view\n   - Key levels and catalysts\n   - Risk scenarios\n\n2. STRATEGY SELECTION\n   - Recommended strategies\n   - Market regime alignment\n   - Risk-reward profiles\n\n3. POSITION MANAGEMENT\n   - Entry and exit criteria\n   - Position sizing guidelines\n   - Risk management rules\n\n4. EXECUTION PLAN\n   - Order types and timing\n   - Slippage minimization\n   - Performance tracking\n\n5. CONTINGENCY PLANS\n   - Stop-loss protocols\n   - Scenario-based adjustments\n   - Risk escalation procedures\n\nProvide a detailed, actionable trading plan with specific parameters.`;

    try {
      const response = await this.sendMessage(prompt, { useHistory: false });
      const analysis = this.parseAnalysisResponse(response.content);
      this.analysisCache.set(cacheKey, analysis);
      return analysis;
    } catch (error) {
      throw new AIAnalysisError("Failed to generate trading plan", error);
    }
  }

  // Utility Methods
  private parseAnalysisResponse(content: string): AIAnalysisResult {
    // Extract key components from the AI response
    const recommendations = this.extractRecommendations(content);
    const risks = this.extractRisks(content);
    const opportunities = this.extractOpportunities(content);
    const confidence = this.calculateConfidence(content);
    const keyMetrics = this.extractKeyMetrics(content);

    return {
      analysis: content,
      confidence,
      recommendations,
      risks,
      opportunities,
      keyMetrics,
      timestamp: Date.now()
    };
  }

  private extractRecommendations(content: string): string[] {
    const recommendations = [];
    const lines = content.split('\n');

    for (const line of lines) {
      if (line.toLowerCase().includes('recommend') ||
        line.toLowerCase().includes('should') ||
        line.toLowerCase().includes('consider')) {
        recommendations.push(line.trim());
      }
    }

    return recommendations.slice(0, 10); // Limit to top 10
  }

  private extractRisks(content: string): string[] {
    const risks = [];
    const lines = content.split('\n');

    for (const line of lines) {
      if (line.toLowerCase().includes('risk') ||
        line.toLowerCase().includes('caution') ||
        line.toLowerCase().includes('warning')) {
        risks.push(line.trim());
      }
    }

    return risks.slice(0, 10);
  }

  private extractOpportunities(content: string): string[] {
    const opportunities = [];
    const lines = content.split('\n');

    for (const line of lines) {
      if (line.toLowerCase().includes('opportunity') ||
        line.toLowerCase().includes('potential') ||
        line.toLowerCase().includes('setup')) {
        opportunities.push(line.trim());
      }
    }

    return opportunities.slice(0, 10);
  }

  private extractKeyMetrics(content: string): Record<string, any> {
    const metrics: Record<string, any> = {};
    const numberRegex = /(\d+(?:\.\d+)?%?)/g;
    const matches = content.match(numberRegex);

    if (matches) {
      matches.forEach((match, index) => {
        metrics[`metric_${index}`] = match;
      });
    }

    return metrics;
  }

  private calculateConfidence(content: string): number {
    // Simple confidence calculation based on content analysis
    let confidence = 50; // Base confidence

    // Increase confidence for specific numbers and data
    if (content.match(/\d+\.\d+%/g)) confidence += 10;
    if (content.match(/\$\d+/g)) confidence += 10;
    if (content.length > 500) confidence += 10;
    if (content.toLowerCase().includes('strong')) confidence += 5;
    if (content.toLowerCase().includes('clear')) confidence += 5;

    // Decrease confidence for uncertainty
    if (content.toLowerCase().includes('uncertain')) confidence -= 10;
    if (content.toLowerCase().includes('unclear')) confidence -= 10;
    if (content.toLowerCase().includes('maybe')) confidence -= 5;

    return Math.max(0, Math.min(100, confidence));
  }

  // Public Status Methods
  public isReady(): boolean {
    return this.isConfigured && !!this.client;
  }

  public getStatus(): {
    configured: boolean;
    model: string;
    contextAvailable: boolean;
    conversationLength: number;
    cacheSize: number;
  } {
    return {
      configured: this.isConfigured,
      model: configService.get("model"),
      contextAvailable: !!this.dashboardContext,
      conversationLength: this.conversationHistoryManager.size(),
      cacheSize: this.analysisCache.size()
    };
  }

  public async testConnection(): Promise<boolean> {
    try {
      await this.sendMessage('Test connection', { useHistory: false });
      return true;
    } catch (error) {
      console.error("Connection test failed:", error);
      return false;
    }
  }

  // Utility Functions
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}

// Export singleton instance
export const nexusAIService = NEXUSAIService.getInstance();


