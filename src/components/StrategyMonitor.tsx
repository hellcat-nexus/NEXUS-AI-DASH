import React, { useState, useEffect } from 'react';
import { Target, TrendingUp, TrendingDown, Minus, Settings, Play, Pause, RotateCcw } from 'lucide-react';
import { Strategy } from '../types/trading';
import { ConfigModal } from './ConfigModal';
import { dataTranslator, UniversalDataFormat } from '../services/DataTranslator';

interface StrategyMonitorProps {
  strategies: Strategy[];
}

export const StrategyMonitor: React.FC<StrategyMonitorProps> = ({ strategies }) => {
  const [showConfig, setShowConfig] = useState(false);
  const [translatedData, setTranslatedData] = useState<UniversalDataFormat | null>(null);
  const [isRunning, setIsRunning] = useState(true);

  useEffect(() => {
    const handleDataTranslated = (event: CustomEvent) => {
      setTranslatedData(event.detail.data);
    };

    window.addEventListener('dataTranslated', handleDataTranslated as EventListener);

    return () => {
      window.removeEventListener('dataTranslated', handleDataTranslated as EventListener);
    };
  }, []);

  const handleConfigSave = (settings: any) => {
    console.log('Strategy Monitor settings saved:', settings);
  };

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

  // Convert translated data to strategy format if available
  const displayStrategies = translatedData ? 
    Object.entries(translatedData.strategies).map(([name, strategy], index) => ({
      id: `strategy-${index}`,
      name,
      enabled: strategy.enabled,
      confidence: strategy.confidence,
      signal: strategy.signal,
      pnl: strategy.pnl,
      trades: Math.floor(Math.random() * 50) + 10, // Mock data
      winRate: Math.random() * 40 + 50, // Mock data
      weight: 1 / Object.keys(translatedData.strategies).length
    })) : strategies;

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">Strategy Monitor</h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className={`p-2 rounded-lg transition-colors ${
              isRunning 
                ? 'text-green-400 hover:bg-green-900/20' 
                : 'text-gray-400 hover:bg-gray-800'
            }`}
            title={isRunning ? 'Pause Strategies' : 'Resume Strategies'}
          >
            {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          <button
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            title="Reset All Strategies"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowConfig(true)}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            title="Configure Strategies"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {translatedData && (
        <div className="mb-4 p-3 bg-purple-900/20 border border-purple-800 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <span className="text-purple-400">
              Strategies synchronized with {translatedData.source}
            </span>
            <span className="text-gray-400">
              {Object.values(translatedData.strategies).filter(s => s.enabled).length} active
            </span>
          </div>
        </div>
      )}
      
      <div className="space-y-4">
        {displayStrategies.map((strategy) => (
          <div key={strategy.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-full ${
                  strategy.enabled && isRunning ? 'bg-green-900/20' : 'bg-gray-700'
                }`}>
                  <Target className={`w-4 h-4 ${
                    strategy.enabled && isRunning ? 'text-green-400' : 'text-gray-400'
                  }`} />
                </div>
                <div>
                  <h3 className="text-white font-medium">{strategy.name}</h3>
                  <div className="flex items-center space-x-2">
                    <p className="text-xs text-gray-400">Weight: {(strategy.weight * 100).toFixed(1)}%</p>
                    {!isRunning && (
                      <span className="text-xs px-2 py-1 bg-yellow-900/20 text-yellow-400 rounded">
                        PAUSED
                      </span>
                    )}
                  </div>
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
                  className={`h-2 rounded-full transition-all duration-300 ${
                    strategy.enabled && isRunning
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500'
                      : 'bg-gray-600'
                  }`}
                  style={{ width: `${Math.min(strategy.confidence, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <ConfigModal
        isOpen={showConfig}
        onClose={() => setShowConfig(false)}
        componentType="strategy-monitor"
        onSave={handleConfigSave}
      />
    </div>
  );
};