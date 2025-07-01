import React, { useState } from 'react';
import { 
  Play,
  Settings,
  Calendar,
  ChevronDown,
  BarChart2,
  TrendingUp,
  DollarSign,
  Target
} from 'lucide-react';
import { StrategyMonitor } from '../components/StrategyMonitor';
import { RiskDashboard } from '../components/RiskDashboard';
import { Strategy, RiskMetrics } from '../types/trading';

interface BacktestResult {
  totalTrades: number;
  winRate: number;
  profitFactor: number;
  sharpeRatio: number;
  maxDrawdown: number;
  netProfit: number;
  averageRRR: number;
  successfulTrades: number;
  failedTrades: number;
}

export const Backtesting: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState('1D');
  const [selectedPeriod, setSelectedPeriod] = useState('6M');
  
  const mockResults: BacktestResult = {
    totalTrades: 156,
    winRate: 68.5,
    profitFactor: 2.8,
    sharpeRatio: 1.92,
    maxDrawdown: 12.4,
    netProfit: 45280,
    averageRRR: 2.1,
    successfulTrades: 107,
    failedTrades: 49
  };

  const mockStrategies: Strategy[] = [
    {
      id: 'strat1',
      name: 'Breakout Momentum',
      enabled: true,
      confidence: 82,
      signal: 'BUY',
      pnl: 12450,
      trades: 56,
      winRate: 71.4,
      weight: 0.3
    },
    {
      id: 'strat2',
      name: 'Range Reversal',
      enabled: false,
      confidence: 65,
      signal: 'HOLD',
      pnl: -2450,
      trades: 42,
      winRate: 61.2,
      weight: 0.25
    },
    {
      id: 'strat3',
      name: 'Supply Demand',
      enabled: true,
      confidence: 78,
      signal: 'SELL',
      pnl: 8450,
      trades: 38,
      winRate: 68.9,
      weight: 0.45
    }
  ];

  const mockRisk: RiskMetrics = {
    dailyPnl: 2450,
    maxDrawdown: 4800,
    portfolioHeat: 48.5,
    sharpeRatio: 1.52,
    winRate: 68.5,
    profitFactor: 2.8,
    totalTrades: 156,
    riskPerTrade: 1.5
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Strategy Backtesting</h1>
          <p className="text-gray-400">Test and optimize your trading strategies</p>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className={`flex items-center space-x-2 px-6 py-2 ${
              isRunning
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-blue-600 hover:bg-blue-700'
            } rounded-lg transition-colors`}
          >
            <Play className="w-4 h-4" />
            <span>{isRunning ? 'Stop' : 'Run Backtest'}</span>
          </button>

          <button className="flex items-center space-x-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors">
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </button>
        </div>
      </div>

      {/* Configuration Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Time Period</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Timeframe</label>
              <select
                value={selectedTimeframe}
                onChange={(e) => setSelectedTimeframe(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
              >
                <option value="1m">1 Minute</option>
                <option value="5m">5 Minutes</option>
                <option value="15m">15 Minutes</option>
                <option value="1h">1 Hour</option>
                <option value="4h">4 Hours</option>
                <option value="1D">1 Day</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Period</label>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
              >
                <option value="1M">1 Month</option>
                <option value="3M">3 Months</option>
                <option value="6M">6 Months</option>
                <option value="1Y">1 Year</option>
                <option value="ALL">All Time</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Strategy Parameters</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Risk per Trade</label>
              <input
                type="number"
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
                placeholder="1-5%"
                defaultValue={2}
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Stop Loss</label>
              <input
                type="number"
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
                placeholder="Points"
                defaultValue={50}
              />
            </div>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Market Conditions</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Market Type</label>
              <select className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white">
                <option value="all">All Markets</option>
                <option value="trending">Trending</option>
                <option value="ranging">Ranging</option>
                <option value="volatile">Volatile</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Volume Profile</label>
              <select className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white">
                <option value="all">All Volumes</option>
                <option value="high">High Volume</option>
                <option value="low">Low Volume</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Results Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <BarChart2 className="w-8 h-8 text-blue-400" />
            <div className="text-right">
              <div className="text-2xl font-bold text-white">{mockResults.winRate}%</div>
              <div className="text-sm text-gray-400">Win Rate</div>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="text-sm">
              <div className="text-gray-400">Success</div>
              <div className="text-white font-medium">{mockResults.successfulTrades}</div>
            </div>
            <div className="text-sm text-right">
              <div className="text-gray-400">Failed</div>
              <div className="text-white font-medium">{mockResults.failedTrades}</div>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <TrendingUp className="w-8 h-8 text-green-400" />
            <div className="text-right">
              <div className="text-2xl font-bold text-white">{mockResults.profitFactor}</div>
              <div className="text-sm text-gray-400">Profit Factor</div>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="text-sm">
              <div className="text-gray-400">Sharpe</div>
              <div className="text-white font-medium">{mockResults.sharpeRatio}</div>
            </div>
            <div className="text-sm text-right">
              <div className="text-gray-400">Drawdown</div>
              <div className="text-white font-medium">{mockResults.maxDrawdown}%</div>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <DollarSign className="w-8 h-8 text-purple-400" />
            <div className="text-right">
              <div className="text-2xl font-bold text-white">${mockResults.netProfit}</div>
              <div className="text-sm text-gray-400">Net Profit</div>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="text-sm">
              <div className="text-gray-400">Total Trades</div>
              <div className="text-white font-medium">{mockResults.totalTrades}</div>
            </div>
            <div className="text-sm text-right">
              <div className="text-gray-400">Avg. Trade</div>
              <div className="text-white font-medium">${(mockResults.netProfit / mockResults.totalTrades).toFixed(2)}</div>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <Target className="w-8 h-8 text-orange-400" />
            <div className="text-right">
              <div className="text-2xl font-bold text-white">{mockResults.averageRRR}</div>
              <div className="text-sm text-gray-400">Average RRR</div>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="text-sm">
              <div className="text-gray-400">Best Trade</div>
              <div className="text-white font-medium">3.8 R</div>
            </div>
            <div className="text-sm text-right">
              <div className="text-gray-400">Worst Trade</div>
              <div className="text-white font-medium">-1.2 R</div>
            </div>
          </div>
        </div>
      </div>

      {/* Strategy Monitor and Risk Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StrategyMonitor strategies={mockStrategies} />
        <RiskDashboard riskMetrics={mockRisk} />
      </div>
    </div>
  );
};