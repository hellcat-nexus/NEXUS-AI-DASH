import React, { useState, useEffect, useRef } from 'react';
import {
  Plus,
  Save,
  Play,
  Download,
  Upload,
  Settings,
  Code,
  FileText,
  ChevronDown,
  BarChart2
} from 'lucide-react';

interface Cell {
  id: string;
  type: 'code' | 'markdown';
  content: string;
  output?: string;
}

export const Notebook: React.FC = () => {
  const [cells, setCells] = useState<Cell[]>(() => {
    const stored = localStorage.getItem('notebook-cells');
    if (stored) {
      try { return JSON.parse(stored); } catch {}
    }
    return [
      {
        id: '1',
        type: 'markdown',
        content: '# Trading Analysis Notebook\n\nUse this notebook to analyze your trading data and develop strategies.',
      },
      {
        id: '2',
        type: 'code',
        content: `import pandas as pd
import numpy as np
import matplotlib.pyplot as plt

# Load trading data
trades_df = pd.read_csv('trades.csv')
print(trades_df.head())`,
        output: '   Date       Symbol  Entry  Exit  PnL  RRR\n0  2024-03-15  AAPL    150.2 152.8 2.6  2.1\n1  2024-03-15  MSFT    280.4 285.2 4.8  1.8\n2  2024-03-14  GOOGL   140.8 138.2 -2.6 -1.2'
      },
      {
        id: '3',
        type: 'markdown',
        content: '## Performance Analysis\n\nLet\'s analyze the trading performance metrics.',
      },
      {
        id: '4',
        type: 'code',
        content: `# Calculate performance metrics
win_rate = len(trades_df[trades_df['PnL'] > 0]) / len(trades_df) * 100
avg_rrr = trades_df['RRR'].mean()
profit_factor = abs(trades_df[trades_df['PnL'] > 0]['PnL'].sum() / trades_df[trades_df['PnL'] < 0]['PnL'].sum())

print(f"Win Rate: {win_rate:.2f}%")
print(f"Average RRR: {avg_rrr:.2f}")
print(f"Profit Factor: {profit_factor:.2f}")`,
        output: 'Win Rate: 68.50%\nAverage RRR: 1.92\nProfit Factor: 2.40'
      }
    ];
  });

  useEffect(()=>{
    localStorage.setItem('notebook-cells', JSON.stringify(cells));
  }, [cells]);

  const [selectedCell, setSelectedCell] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);

  const addCell = (type: 'code' | 'markdown') => {
    const newCell: Cell = {
      id: Date.now().toString(),
      type,
      content: '',
    };
    setCells([...cells, newCell]);
    setShowMenu(false);
  };

  const updateCellContent = (id: string, content: string) => {
    setCells(prev => prev.map(c => c.id === id ? { ...c, content } : c));
  };

  const handleRun = (id: string) => {
    setCells(prev => prev.map(c => c.id === id ? { ...c, output: 'Executed (simulation)' } : c));
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Trading Notebook</h1>
          <p className="text-gray-400">Analyze and document your trading strategies</p>
        </div>

        <div className="flex items-center space-x-4">
          <div className="relative">
            <button onClick={()=>setShowMenu(v=>!v)} className="flex items-center space-x-2 px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg">
              <Plus className="w-4 h-4" />
              <span>Add Cell</span>
              <ChevronDown className="w-4 h-4" />
            </button>
            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-gray-900 border border-gray-800 rounded-lg shadow-lg overflow-hidden z-50">
                <button
                  onClick={() => addCell('code')}
                  className="flex items-center w-full px-4 py-2 text-left hover:bg-gray-800"
                >
                  <Code className="w-4 h-4 mr-2" />
                  <span>Code Cell</span>
                </button>
                <button
                  onClick={() => addCell('markdown')}
                  className="flex items-center w-full px-4 py-2 text-left hover:bg-gray-800"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  <span>Markdown Cell</span>
                </button>
              </div>
            )}
          </div>

          <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
            <Save className="w-4 h-4" />
            <span>Save</span>
          </button>

          <div className="flex items-center space-x-2">
            <button className="p-2 text-gray-400 hover:text-white bg-gray-900 border border-gray-800 rounded-lg transition-colors">
              <Upload className="w-4 h-4" />
            </button>
            <button className="p-2 text-gray-400 hover:text-white bg-gray-900 border border-gray-800 rounded-lg transition-colors">
              <Download className="w-4 h-4" />
            </button>
            <button className="p-2 text-gray-400 hover:text-white bg-gray-900 border border-gray-800 rounded-lg transition-colors">
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Notebook Cells */}
      <div className="space-y-4">
        {cells.map((cell) => (
          <div
            key={cell.id}
            className={`bg-gray-900 border ${
              selectedCell === cell.id ? 'border-blue-500' : 'border-gray-800'
            } rounded-xl overflow-hidden`}
            onClick={() => setSelectedCell(cell.id)}
          >
            <div className="flex items-center justify-between p-2 bg-gray-800">
              <div className="flex items-center space-x-2">
                {cell.type === 'code' ? (
                  <Code className="w-4 h-4 text-blue-400" />
                ) : (
                  <FileText className="w-4 h-4 text-purple-400" />
                )}
                <span className="text-sm text-gray-400">
                  {cell.type === 'code' ? 'Python' : 'Markdown'}
                </span>
              </div>

              {cell.type === 'code' && (
                <button className="p-1 text-gray-400 hover:text-white transition-colors" onClick={()=>handleRun(cell.id)}>
                  <Play className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="p-4">
              <div className="font-mono text-sm">
                {selectedCell === cell.id ? (
                  <textarea
                    value={cell.content}
                    onChange={e=>updateCellContent(cell.id, e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white h-40"
                  />
                ) : (
                  <pre className="text-white whitespace-pre-wrap">{cell.content}</pre>
                )}
              </div>

              {cell.type === 'code' && cell.output && (
                <div className="mt-4 pt-4 border-t border-gray-800">
                  <pre className="font-mono text-sm text-gray-400 whitespace-pre-wrap">
                    {cell.output}
                  </pre>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};