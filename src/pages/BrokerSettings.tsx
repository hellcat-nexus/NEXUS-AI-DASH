import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Settings, 
  Wifi, 
  WifiOff, 
  AlertCircle, 
  CheckCircle,
  Trash2,
  Edit3,
  Key,
  Server
} from 'lucide-react';
import { BrokerConnection } from '../types/trading';
import { AddConnectionModal } from '../components/AddConnectionModal';

export const BrokerSettings: React.FC = () => {
  const [connections, setConnections] = useState<BrokerConnection[]>([
    {
      id: 'sierra-1',
      name: 'Sierra Chart - Main',
      type: 'SIERRA_CHART',
      status: 'CONNECTED',
      lastSync: Date.now() - 30000,
      account: 'DEMO-001',
      endpoint: 'localhost:11099'
    },
    {
      id: 'ninja-1',
      name: 'NinjaTrader 8',
      type: 'NINJA_TRADER',
      status: 'DISCONNECTED',
      lastSync: Date.now() - 3600000,
      account: 'SIM101',
      endpoint: 'localhost:8080'
    },
    {
      id: 'rithmic-1',
      name: 'Rithmic API',
      type: 'RITHMIC',
      status: 'CONNECTED',
      lastSync: Date.now() - 5000,
      account: 'LIVE-001',
      apiKey: '****-****-****-1234'
    }
  ]);

  const [showAddForm, setShowAddForm] = useState(false);

  // persist connections to localStorage
  useEffect(() => {
    const stored = localStorage.getItem('broker-connections');
    if (stored) {
      try { setConnections(JSON.parse(stored)); } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('broker-connections', JSON.stringify(connections));
  }, [connections]);

  const handleAddConnection = (conn: BrokerConnection) => {
    setConnections(prev => [...prev, conn]);
  };

  const getStatusIcon = (status: BrokerConnection['status']) => {
    switch (status) {
      case 'CONNECTED':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'DISCONNECTED':
        return <WifiOff className="w-5 h-5 text-gray-400" />;
      case 'ERROR':
        return <AlertCircle className="w-5 h-5 text-red-400" />;
    }
  };

  const getStatusColor = (status: BrokerConnection['status']) => {
    switch (status) {
      case 'CONNECTED':
        return 'text-green-400 bg-green-900/20';
      case 'DISCONNECTED':
        return 'text-gray-400 bg-gray-900/20';
      case 'ERROR':
        return 'text-red-400 bg-red-900/20';
    }
  };

  const getBrokerIcon = (type: BrokerConnection['type']) => {
    switch (type) {
      case 'SIERRA_CHART':
        return <Server className="w-6 h-6 text-blue-400" />;
      case 'NINJA_TRADER':
        return <Settings className="w-6 h-6 text-purple-400" />;
      case 'RITHMIC':
        return <Wifi className="w-6 h-6 text-orange-400" />;
      default:
        return <Server className="w-6 h-6 text-gray-400" />;
    }
  };

  const formatLastSync = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ago`;
    }
    return `${minutes}m ago`;
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Broker Connections</h1>
          <p className="text-gray-400">Manage your trading platform connections and API integrations</p>
        </div>
        
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Connection</span>
        </button>
      </div>

      {/* Connection Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <CheckCircle className="w-8 h-8 text-green-400" />
            <span className="text-2xl font-bold text-green-400">
              {connections.filter(c => c.status === 'CONNECTED').length}
            </span>
          </div>
          <h3 className="text-white font-medium">Connected</h3>
          <p className="text-sm text-gray-400">Active connections</p>
        </div>
        
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <WifiOff className="w-8 h-8 text-gray-400" />
            <span className="text-2xl font-bold text-gray-400">
              {connections.filter(c => c.status === 'DISCONNECTED').length}
            </span>
          </div>
          <h3 className="text-white font-medium">Disconnected</h3>
          <p className="text-sm text-gray-400">Inactive connections</p>
        </div>
        
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <AlertCircle className="w-8 h-8 text-red-400" />
            <span className="text-2xl font-bold text-red-400">
              {connections.filter(c => c.status === 'ERROR').length}
            </span>
          </div>
          <h3 className="text-white font-medium">Errors</h3>
          <p className="text-sm text-gray-400">Failed connections</p>
        </div>
      </div>

      {/* Connections List */}
      <div className="space-y-4">
        {connections.map((connection) => (
          <div key={connection.id} className="bg-gray-900 border border-gray-700 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gray-800 rounded-lg">
                  {getBrokerIcon(connection.type)}
                </div>
                
                <div>
                  <div className="flex items-center space-x-3">
                    <h3 className="text-lg font-semibold text-white">{connection.name}</h3>
                    <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${getStatusColor(connection.status)}`}>
                      {getStatusIcon(connection.status)}
                      <span className="text-sm font-medium">{connection.status}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 mt-1 text-sm text-gray-400">
                    <span>Account: {connection.account}</span>
                    <span>•</span>
                    <span>Last sync: {formatLastSync(connection.lastSync)}</span>
                    {connection.endpoint && (
                      <>
                        <span>•</span>
                        <span>Endpoint: {connection.endpoint}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
                  <Edit3 className="w-4 h-4" />
                </button>
                <button className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            {connection.status === 'CONNECTED' && (
              <div className="mt-4 pt-4 border-t border-gray-700">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Data Feed: </span>
                    <span className="text-green-400">Active</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Order Routing: </span>
                    <span className="text-green-400">Enabled</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Auto Sync: </span>
                    <span className="text-blue-400">Every 30s</span>
                  </div>
                </div>
              </div>
            )}
            
            {connection.status === 'ERROR' && (
              <div className="mt-4 pt-4 border-t border-gray-700">
                <div className="flex items-center space-x-2 text-red-400">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">Connection failed: Unable to authenticate with broker API</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {showAddForm && (
        <AddConnectionModal onClose={()=>setShowAddForm(false)} onAdd={handleAddConnection} />
      )}

      {/* Supported Brokers Info */}
      <div className="mt-8 bg-gray-900 border border-gray-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Supported Trading Platforms</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="flex items-center space-x-3 p-3 bg-gray-800 rounded-lg">
            <Server className="w-6 h-6 text-blue-400" />
            <div>
              <div className="text-white font-medium">Sierra Chart</div>
              <div className="text-xs text-gray-400">ACSIL Integration</div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 p-3 bg-gray-800 rounded-lg">
            <Settings className="w-6 h-6 text-purple-400" />
            <div>
              <div className="text-white font-medium">NinjaTrader 8</div>
              <div className="text-xs text-gray-400">NTI Integration</div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 p-3 bg-gray-800 rounded-lg">
            <Wifi className="w-6 h-6 text-orange-400" />
            <div>
              <div className="text-white font-medium">Rithmic</div>
              <div className="text-xs text-gray-400">Direct API</div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 p-3 bg-gray-800 rounded-lg">
            <Key className="w-6 h-6 text-green-400" />
            <div>
              <div className="text-white font-medium">Interactive Brokers</div>
              <div className="text-xs text-gray-400">TWS API</div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 p-3 bg-gray-800 rounded-lg">
            <Server className="w-6 h-6 text-yellow-400" />
            <div>
              <div className="text-white font-medium">TD Ameritrade</div>
              <div className="text-xs text-gray-400">REST API</div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 p-3 bg-gray-800 rounded-lg opacity-50">
            <Plus className="w-6 h-6 text-gray-400" />
            <div>
              <div className="text-gray-400 font-medium">More Coming Soon</div>
              <div className="text-xs text-gray-500">20+ Brokers Supported</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};