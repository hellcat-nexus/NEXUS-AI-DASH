import React from 'react';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { MarketData as MarketDataType } from '../types/trading';

interface MarketDataProps {
  data: MarketDataType[];
}

export const MarketData: React.FC<MarketDataProps> = ({ data }) => {
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">Market Data</h2>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-gray-400">Live</span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.map((item) => (
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
    </div>
  );
};