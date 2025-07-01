import React from 'react';
import { TrendingUp, TrendingDown, Clock, DollarSign } from 'lucide-react';
import { Position } from '../types/trading';

interface PositionManagerProps {
  positions: Position[];
}

export const PositionManager: React.FC<PositionManagerProps> = ({ positions }) => {
  const totalPnl = positions.reduce((sum, pos) => sum + pos.pnl, 0);

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">Active Positions</h2>
        <div className="flex items-center space-x-4">
          <div className={`text-lg font-bold ${totalPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(0)}
          </div>
          <span className="text-sm text-gray-400">Total P&L</span>
        </div>
      </div>
      
      {positions.length === 0 ? (
        <div className="text-center py-8">
          <DollarSign className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">No active positions</p>
        </div>
      ) : (
        <div className="space-y-4">
          {positions.map((position, index) => (
            <div key={index} className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-full ${
                    position.side === 'LONG' ? 'bg-green-900/20' : 'bg-red-900/20'
                  }`}>
                    {position.side === 'LONG' ? (
                      <TrendingUp className="w-4 h-4 text-green-400" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-400" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-white font-medium">{position.symbol}</h3>
                    <p className="text-sm text-gray-400">{position.side} {position.size} contracts</p>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className={`text-lg font-bold ${position.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {position.pnl >= 0 ? '+' : ''}${position.pnl.toFixed(0)}
                  </div>
                  <div className={`text-sm ${position.pnlPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    ({position.pnlPercent >= 0 ? '+' : ''}{position.pnlPercent.toFixed(2)}%)
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between items-center text-sm">
                <div className="flex space-x-6">
                  <div>
                    <span className="text-gray-400">Entry: </span>
                    <span className="text-white">{position.entryPrice.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Current: </span>
                    <span className="text-white">{position.currentPrice.toFixed(2)}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2 text-gray-400">
                  <Clock className="w-4 h-4" />
                  <span>{position.duration}</span>
                </div>
              </div>
              
              <div className="mt-3 w-full bg-gray-700 rounded-full h-1">
                <div 
                  className={`h-1 rounded-full transition-all duration-300 ${
                    position.pnl >= 0 ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-gradient-to-r from-red-500 to-red-600'
                  }`}
                  style={{ width: `${Math.min(Math.abs(position.pnlPercent) * 10, 100)}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};