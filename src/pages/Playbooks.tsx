import React, { useState } from 'react';
import {
  Plus,
  Search,
  Filter,
  ChevronDown,
  Star,
  BarChart2,
  Target,
  TrendingUp,
  Edit,
  Trash2
} from 'lucide-react';

interface Playbook {
  id: string;
  name: string;
  description: string;
  winRate: number;
  profitFactor: number;
  averageRRR: number;
  trades: number;
  isFavorite: boolean;
  tags: string[];
  lastUpdated: string;
}

export const Playbooks: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');

  const mockPlaybooks: Playbook[] = [
    {
      id: '1',
      name: 'Breakout Momentum',
      description: 'Trading breakouts with volume confirmation in trending markets',
      winRate: 72.5,
      profitFactor: 2.4,
      averageRRR: 2.8,
      trades: 145,
      isFavorite: true,
      tags: ['Momentum', 'Breakout', 'Trending'],
      lastUpdated: '2024-03-15'
    },
    {
      id: '2',
      name: 'Range Reversal',
      description: 'Catching reversals at range extremes with order flow confirmation',
      winRate: 65.8,
      profitFactor: 1.9,
      averageRRR: 2.2,
      trades: 98,
      isFavorite: false,
      tags: ['Range', 'Reversal', 'Order Flow'],
      lastUpdated: '2024-03-12'
    },
    {
      id: '3',
      name: 'Supply Demand',
      description: 'Trading institutional supply and demand zones with volume profile',
      winRate: 68.2,
      profitFactor: 2.1,
      averageRRR: 2.5,
      trades: 124,
      isFavorite: true,
      tags: ['Supply Demand', 'Volume Profile', 'Institutional'],
      lastUpdated: '2024-03-10'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Trading Playbooks</h1>
          <p className="text-gray-400">Manage and optimize your trading strategies</p>
        </div>

        <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
          <Plus className="w-4 h-4" />
          <span>New Playbook</span>
        </button>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row md:items-center md:space-x-4 space-y-4 md:space-y-0 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search playbooks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center space-x-4">
          <div className="relative">
            <button className="flex items-center space-x-2 px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg">
              <Filter className="w-4 h-4" />
              <span>Filter</span>
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          <select
            value={selectedFilter}
            onChange={(e) => setSelectedFilter(e.target.value)}
            className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-2 text-white"
          >
            <option value="all">All Playbooks</option>
            <option value="favorites">Favorites</option>
            <option value="recent">Recently Updated</option>
            <option value="performance">Best Performance</option>
          </select>
        </div>
      </div>

      {/* Playbooks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockPlaybooks.map((playbook) => (
          <div key={playbook.id} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">{playbook.name}</h3>
                  <p className="text-gray-400 text-sm">{playbook.description}</p>
                </div>
                <button
                  className={`p-1 rounded-lg transition-colors ${
                    playbook.isFavorite ? 'text-yellow-400' : 'text-gray-600 hover:text-yellow-400'
                  }`}
                >
                  <Star className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <BarChart2 className="w-4 h-4 text-blue-400 mr-1" />
                    <span className="text-white font-semibold">{playbook.winRate}%</span>
                  </div>
                  <div className="text-xs text-gray-400">Win Rate</div>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <Target className="w-4 h-4 text-green-400 mr-1" />
                    <span className="text-white font-semibold">{playbook.averageRRR}</span>
                  </div>
                  <div className="text-xs text-gray-400">Avg RRR</div>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <TrendingUp className="w-4 h-4 text-purple-400 mr-1" />
                    <span className="text-white font-semibold">{playbook.profitFactor}</span>
                  </div>
                  <div className="text-xs text-gray-400">Profit Factor</div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                {playbook.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-gray-800 text-gray-400 text-xs rounded-lg"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">
                  Updated {new Date(playbook.lastUpdated).toLocaleDateString()}
                </span>
                <div className="flex items-center space-x-2">
                  <button className="p-1 text-gray-400 hover:text-white transition-colors">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button className="p-1 text-gray-400 hover:text-red-500 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};