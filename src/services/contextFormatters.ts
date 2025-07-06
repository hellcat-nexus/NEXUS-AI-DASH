import { DashboardContext } from '../types/ai';

export abstract class BaseFormatter {
  protected formatNumber(num: number, decimals: number = 2): string {
    return num.toFixed(decimals);
  }

  protected formatCurrency(amount: number): string {
    return `$${amount.toFixed(2)}`;
  }

  protected formatPercentage(value: number): string {
    return `${value.toFixed(2)}%`;
  }

  protected formatVolume(volume: number): string {
    if (volume >= 1000000) {
      return `${(volume / 1000000).toFixed(1)}M`;
    } else if (volume >= 1000) {
      return `${(volume / 1000).toFixed(1)}K`;
    }
    return volume.toString();
  }
}

export class MarketDataFormatter extends BaseFormatter {
  public format(marketData: any[]): string {
    if (!marketData?.length) return '';

    let prompt = '📊 MARKET DATA:\n';
    marketData.forEach(market => {
      const trend = market.changePercent >= 0 ? '📈' : '📉';
      const volatility = Math.abs(market.changePercent) > 5 ? 'HIGH' : 'NORMAL';
      prompt += `${trend} ${market.symbol}: ${this.formatCurrency(market.price)} (${market.changePercent >= 0 ? '+' : ''}${this.formatPercentage(market.changePercent)})\n`;
      prompt += `   Volume: ${this.formatVolume(market.volume)} | Volatility: ${volatility}\n`;
    });
    return prompt + '\n';
  }
}

export class PortfolioFormatter extends BaseFormatter {
  public format(positions: any[]): string {
    if (!positions?.length) return '';

    let prompt = '💼 PORTFOLIO POSITIONS:\n';
    let totalPnL = 0;
    let totalExposure = 0;

    positions.forEach(pos => {
      totalPnL += pos.pnl;
      totalExposure += Math.abs(pos.notionalValue || pos.size * pos.entryPrice);
      const status = pos.pnl >= 0 ? '✅' : '❌';
      prompt += `${status} ${pos.symbol} ${pos.side} ${pos.size} @ ${this.formatCurrency(pos.entryPrice)}\n`;
      prompt += `   P&L: ${pos.pnl >= 0 ? '+' : ''}${this.formatCurrency(pos.pnl)} (${this.formatPercentage(pos.pnlPercent)})\n`;
    });

    prompt += `\n📈 Portfolio Summary: Total P&L: ${this.formatCurrency(totalPnL)} | Exposure: ${this.formatCurrency(totalExposure)}\n\n`;
    return prompt;
  }
}

export class StrategyFormatter extends BaseFormatter {
  public format(strategies: any[]): string {
    if (!strategies?.length) return '';

    let prompt = '🤖 STRATEGY PERFORMANCE:\n';
    strategies.forEach(strategy => {
      const status = strategy.enabled ? '🟢 ACTIVE' : '🔴 INACTIVE';
      const signal = this.formatSignal(strategy.signal);
      prompt += `${status} ${strategy.name}: ${signal}\n`;
      prompt += `   Confidence: ${this.formatPercentage(strategy.confidence)} | P&L: ${strategy.pnl >= 0 ? '+' : ''}${this.formatCurrency(strategy.pnl)}\n`;
    });
    return prompt + '\n';
  }

  private formatSignal(signal: string): string {
    const signalMap = {
      'BUY': '🟢 BUY',
      'SELL': '🔴 SELL',
      'HOLD': '🟡 HOLD',
      'NEUTRAL': '⚪ NEUTRAL'
    };
    return signalMap[signal.toUpperCase()] || signal;
  }
}

export class RiskMetricsFormatter extends BaseFormatter {
  public format(riskMetrics: any): string {
    if (!riskMetrics) return '';

    let prompt = '⚠️ RISK ANALYSIS:\n';
    prompt += `Daily P&L: ${riskMetrics.dailyPnl >= 0 ? '+' : ''}${this.formatCurrency(riskMetrics.dailyPnl)}\n`;
    prompt += `Portfolio Heat: ${this.formatPercentage(riskMetrics.portfolioHeat)} ${this.getRiskLevel(riskMetrics.portfolioHeat)}\n`;
    prompt += `Win Rate: ${this.formatPercentage(riskMetrics.winRate)} | Sharpe: ${this.formatNumber(riskMetrics.sharpeRatio)}\n`;
    prompt += `Max Drawdown: ${this.formatCurrency(riskMetrics.maxDrawdown)} | Recovery: ${this.getRecoveryStatus(riskMetrics)}\n\n`;
    return prompt;
  }

  private getRiskLevel(heat: number): string {
    if (heat < 20) return '🟢 LOW';
    if (heat < 50) return '🟡 MEDIUM';
    if (heat < 80) return '🟠 HIGH';
    return '🔴 CRITICAL';
  }

  private getRecoveryStatus(risk: any): string {
    if (risk.recoveryFactor > 0.8) return '🟢 GOOD';
    if (risk.recoveryFactor > 0.5) return '🟡 MODERATE';
    return '🔴 POOR';
  }
}

export class OrderFlowFormatter extends BaseFormatter {
  public format(orderFlow: any): string {
    if (!orderFlow) return '';

    let prompt = '📊 ORDER FLOW ANALYSIS:\n';
    const delta = orderFlow.cumulativeDelta;
    const imbalance = orderFlow.imbalance;

    prompt += `Cumulative Delta: ${this.formatNumber(delta, 0)} ${delta > 0 ? '(Bullish)' : '(Bearish)'}\n`;
    prompt += `Volume Imbalance: ${this.formatPercentage(imbalance)} ${Math.abs(imbalance) > 20 ? '(SIGNIFICANT)' : ''}\n`;
    prompt += `Bid/Ask Ratio: ${this.formatNumber(orderFlow.bidVolume / orderFlow.askVolume)}\n\n`;
    return prompt;
  }
}

export class MarketQualityFormatter extends BaseFormatter {
  public format(mqScore: any): string {
    if (!mqScore) return '';

    let prompt = '🎯 MARKET QUALITY:\n';
    prompt += `Overall Score: ${this.formatNumber(mqScore.overallScore, 1)}/100 (${mqScore.grade})\n`;
    prompt += `Liquidity: ${this.formatNumber(mqScore.dimensions.liquidity.score, 1)} (${mqScore.dimensions.liquidity.status})\n`;
    prompt += `Efficiency: ${this.formatNumber(mqScore.dimensions.efficiency.score, 1)} (${mqScore.dimensions.efficiency.status})\n`;
    prompt += `Volatility: ${this.formatNumber(mqScore.dimensions.volatility.score, 1)} (${mqScore.dimensions.volatility.status})\n\n`;
    return prompt;
  }
}

export class TradingActivityFormatter extends BaseFormatter {
  public format(trades: any[]): string {
    if (!trades?.length) return '';

    const recentTrades = trades.slice(-10);
    let prompt = '📈 RECENT TRADING ACTIVITY:\n';

    const winRate = recentTrades.filter(t => t.result > 0).length / recentTrades.length * 100;
    const avgReturn = recentTrades.reduce((sum, t) => sum + t.result, 0) / recentTrades.length;

    prompt += `Last 10 Trades: ${this.formatPercentage(winRate)} win rate | Avg: ${this.formatPercentage(avgReturn)}\n`;
    recentTrades.slice(-3).forEach(trade => {
      const result = trade.result >= 0 ? '✅' : '❌';
      prompt += `${result} ${trade.symbol} ${trade.type}: ${this.formatPercentage(trade.result)} (R: ${this.formatNumber(trade.rMultiple)})\n`;
    });
    return prompt + '\n';
  }
}

export class ConnectionFormatter extends BaseFormatter {
  public format(brokerConnections: any[]): string {
    if (!brokerConnections?.length) return '';

    let prompt = '🔗 CONNECTIONS:\n';
    brokerConnections.forEach(conn => {
      const status = conn.status === 'CONNECTED' ? '✅' : '❌';
      prompt += `${status} ${conn.name} (${conn.type}): ${conn.status}\n`;
    });
    return prompt + '\n';
  }
}