import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Activity, Settings, Wifi, WifiOff } from 'lucide-react';
import { MarketData as MarketDataType } from '../types/trading';
import { ConfigModal } from './ConfigModal';
import { dataTranslator, UniversalDataFormat } from '../services/DataTranslator';

interface MarketDataProps {
  data: MarketDataType[];
}

export const MarketData: React.FC<MarketDataProps> = ({ data }) => {
  const [showConfig, setShowConfig] = useState(false);
  const [translatedData, setTranslatedData] = useState<UniversalDataFormat | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'error'>('disconnected');
  const [dataSource, setDataSource] = useState<string>('UNKNOWN');

  useEffect(() => {
    // Listen for translated data events
    const handleDataTranslated = (event: CustomEvent) => {
      setTranslatedData(event.detail.data);
      setDataSource(event.detail.source);
      setConnectionStatus('connected');
    };

    window.addEventListener('dataTranslated', handleDataTranslated as EventListener);

    // Check for existing translated data
    const lastData = dataTranslator.getLastTranslatedData();
    if (lastData) {
      setTranslatedData(lastData);
      setConnectionStatus('connected');
    }

    return () => {
      window.removeEventListener('dataTranslated', handleDataTranslated as EventListener);
    };
  }, []);

  const handleConfigSave = (settings: any) => {
    console.log('Market Data settings saved:', settings);
    // Apply settings to component
  };

  const getConnectionIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Wifi className="w-4 h-4 text-green-400" />;
      case 'error':
        return <WifiOff className="w-4 h-4 text-red-400" />;
      default:
        return <WifiOff className="w-4 h-4 text-gray-400" />;
    }
  };

  const getConnectionText = () => {
    switch (connectionStatus) {
      case 'connected':
        return `Live - ${dataSource}`;
      case 'error':
        return 'Connection Error';
      default:
        return 'Disconnected';
    }
  };

  // Use translated data if available, otherwise fall back to props data
  const displayData = translatedData ? [
    {
      symbol: translatedData.market.symbol,
      price: translatedData.market.price,
      change: translatedData.market.close - translatedData.market.open,
      changePercent: ((translatedData.market.close - translatedData.market.open) / translatedData.market.open) * 100,
      volume: translatedData.market.volume,
      bid: translatedData.market.bid,
      ask: translatedData.market.ask,
      spread: translatedData.market.ask - translatedData.market.bid,
      timestamp: translatedData.timestamp
    }
  ] : data;

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">Market Data</h2>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            {getConnectionIcon()}
            <span className="text-sm text-gray-400">{getConnectionText()}</span>
          </div>
          <button
            onClick={() => setShowConfig(true)}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            title="Configure Market Data"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {translatedData && (
        <div className="mb-4 p-3 bg-blue-900/20 border border-blue-800 rounded-lg">
          <div className="flex items-center space-x-2 text-blue-400 text-sm">
            <Activity className="w-4 h-4" />
            <span>Real-time data from {dataSource}</span>
            <span className="text-gray-400">•</span>
            <span className="text-gray-400">
              Last update: {new Date(translatedData.timestamp).toLocaleTimeString()}
            </span>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayData.map((item) => (
          <div key={item.symbol} className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <span className="text-lg font-semibold text-white">{item.symbol}</span>
              <Activity className="w-4 h-4 text-blue-400" />
            </div>
            
            <div className="text-2xl font-bold text-white mb-1">
              {item.price.toFixed(2)}
            </div>
            
            <div className={`flex items-center space-x-1 text-sm ${
              item.change >= 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {item.change >= 0 ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              <span>{item.change >= 0 ? '+' : ''}{item.change.toFixed(2)}</span>
              <span>({item.changePercent.toFixed(2)}%)</span>
            </div>
            
            <div className="mt-3 pt-3 border-t border-gray-700">
              <div className="flex justify-between text-xs text-gray-400">
                <span>Bid: {item.bid.toFixed(2)}</span>
                <span>Ask: {item.ask.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>Volume: {(item.volume / 1000).toFixed(0)}K</span>
                <span>Spread: {item.spread.toFixed(2)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <ConfigModal
        isOpen={showConfig}
        onClose={() => setShowConfig(false)}
        componentType="market-data"
        onSave={handleConfigSave}
      />
    </div>
  );
};