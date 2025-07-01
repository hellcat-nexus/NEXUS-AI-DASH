import React from 'react';
import { Target, TrendingUp, TrendingDown, Minus, Settings } from 'lucide-react';
import { Strategy } from '../types/trading';

interface StrategyMonitorProps {
  strategies: Strategy[];
}

export const StrategyMonitor: React.FC<StrategyMonitorProps> = ({ strategies }) => {
  const getSignalIcon = (signal: string) => {
    switch (signal) {
      case 'BUY':
        return <TrendingUp className="w-4 h-4 text-green-400" />;
      case 'SELL':
        return <TrendingDown className="w-4 h-4 text-red-400" />;
      default:
        return <Minus className="w-4 h-4 text-gray-400" />;
    }
  };

  const getSignalColor = (signal: string) => {
    switch (signal) {
      case 'BUY':
        return 'text-green-400 bg-green-900/20';
      case 'SELL':
        return 'text-red-400 bg-red-900/20';
      default:
        return 'text-gray-400 bg-gray-900/20';
    }
  };

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">Strategy Monitor</h2>
        <Settings className="w-5 h-5 text-gray-400 cursor-pointer hover:text-white transition-colors" />
      </div>
      
      <div className="space-y-4">
        {strategies.map((strategy) => (
          <div key={strategy.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-full ${strategy.enabled ? 'bg-green-900/20' : 'bg-gray-700'}`}>
                  <Target className={`w-4 h-4 ${strategy.enabled ? 'text-green-400' : 'text-gray-400'}`} />
                </div>
                <div>
                  <h3 className="text-white font-medium">{strategy.name}</h3>
                  <p className="text-xs text-gray-400">Weight: {(strategy.weight * 100).toFixed(1)}%</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${getSignalColor(strategy.signal)}`}>
                  <div className="flex items-center space-x-1">
                    {getSignalIcon(strategy.signal)}
                    <span>{strategy.signal}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-white">
                    {strategy.confidence.toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-400">Confidence</div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="flex space-x-6">
                <div>
                  <div className={`text-sm font-medium ${strategy.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {strategy.pnl >= 0 ? '+' : ''}${strategy.pnl.toFixed(0)}
                  </div>
                  <div className="text-xs text-gray-400">P&L</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-white">{strategy.trades}</div>
                  <div className="text-xs text-gray-400">Trades</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-white">{strategy.winRate.toFixed(1)}%</div>
                  <div className="text-xs text-gray-400">Win Rate</div>
                </div>
              </div>
              
              <div className="w-24 bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(strategy.confidence, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};