import React, { useState, useEffect } from 'react';
import { 
  Wifi, 
  WifiOff, 
  AlertCircle, 
  CheckCircle, 
  Settings, 
  Play, 
  Square, 
  RefreshCw,
  Activity,
  Database,
  Zap
} from 'lucide-react';
import { BrokerConnection } from '../types/trading';

interface ConnectionManagerProps {
  connection: BrokerConnection;
  onUpdate: (connection: BrokerConnection) => void;
  onDelete: (id: string) => void;
}

export const BrokerConnectionManager: React.FC<ConnectionManagerProps> = ({ 
  connection, 
  onUpdate, 
  onDelete 
}) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionLogs, setConnectionLogs] = useState<string[]>([]);
  const [dataFeed, setDataFeed] = useState({
    ticksReceived: 0,
    lastTick: null as any,
    latency: 0,
    isStreaming: false
  });

  const handleConnect = async () => {
    setIsConnecting(true);
    setConnectionLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Attempting to connect to ${connection.name}...`]);
    
    try {
      // Simulate connection process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (connection.type === 'NINJA_TRADER') {
        setConnectionLogs(prev => [...prev, 
          `[${new Date().toLocaleTimeString()}] Connecting to NinjaTrader 8 on ${connection.endpoint}`,
          `[${new Date().toLocaleTimeString()}] Authenticating with account ${connection.account}`,
          `[${new Date().toLocaleTimeString()}] Connection established successfully`,
          `[${new Date().toLocaleTimeString()}] Data feed active - receiving market data`
        ]);
        
        // Start simulated data feed
        setDataFeed(prev => ({ ...prev, isStreaming: true }));
        
        onUpdate({
          ...connection,
          status: 'CONNECTED',
          lastSync: Date.now()
        });
      }
    } catch (error) {
      setConnectionLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Connection failed: ${error}`]);
      onUpdate({
        ...connection,
        status: 'ERROR',
        lastSync: Date.now()
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    setConnectionLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Disconnecting from ${connection.name}...`]);
    setDataFeed(prev => ({ ...prev, isStreaming: false }));
    onUpdate({
      ...connection,
      status: 'DISCONNECTED',
      lastSync: Date.now()
    });
  };

  // Simulate data feed updates
  useEffect(() => {
    if (dataFeed.isStreaming && connection.status === 'CONNECTED') {
      const interval = setInterval(() => {
        setDataFeed(prev => ({
          ...prev,
          ticksReceived: prev.ticksReceived + Math.floor(Math.random() * 5) + 1,
          lastTick: {
            symbol: 'ES',
            price: 4320 + (Math.random() - 0.5) * 10,
            volume: Math.floor(Math.random() * 100) + 1,
            timestamp: Date.now()
          },
          latency: Math.floor(Math.random() * 10) + 1
        }));
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [dataFeed.isStreaming, connection.status]);

  const getStatusColor = () => {
    switch (connection.status) {
      case 'CONNECTED': return 'text-green-400 bg-green-900/20';
      case 'DISCONNECTED': return 'text-gray-400 bg-gray-900/20';
      case 'ERROR': return 'text-red-400 bg-red-900/20';
      default: return 'text-gray-400 bg-gray-900/20';
    }
  };

  const getStatusIcon = () => {
    switch (connection.status) {
      case 'CONNECTED': return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'DISCONNECTED': return <WifiOff className="w-5 h-5 text-gray-400" />;
      case 'ERROR': return <AlertCircle className="w-5 h-5 text-red-400" />;
      default: return <WifiOff className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-gray-800 rounded-lg">
            <Database className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">{connection.name}</h3>
            <div className="flex items-center space-x-3 mt-1">
              <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${getStatusColor()}`}>
                {getStatusIcon()}
                <span className="text-sm font-medium">{connection.status}</span>
              </div>
              <span className="text-sm text-gray-400">{connection.type}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {connection.status === 'CONNECTED' ? (
            <button
              onClick={handleDisconnect}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
            >
              <Square className="w-4 h-4" />
              <span>Disconnect</span>
            </button>
          ) : (
            <button
              onClick={handleConnect}
              disabled={isConnecting}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded-lg transition-colors"
            >
              {isConnecting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              <span>{isConnecting ? 'Connecting...' : 'Connect'}</span>
            </button>
          )}
          
          <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Connection Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Endpoint</label>
            <div className="text-white font-mono text-sm">{connection.endpoint}</div>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Account</label>
            <div className="text-white font-mono text-sm">{connection.account}</div>
          </div>
        </div>
        
        {connection.status === 'CONNECTED' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Data Feed</span>
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-green-400" />
                <span className="text-green-400">Active</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Ticks Received</span>
              <span className="text-white font-mono">{dataFeed.ticksReceived.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Latency</span>
              <span className="text-white font-mono">{dataFeed.latency}ms</span>
            </div>
            {dataFeed.lastTick && (
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Last Tick</span>
                <span className="text-white font-mono">{dataFeed.lastTick.price.toFixed(2)}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Connection Logs */}
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-white">Connection Log</h4>
          <button 
            onClick={() => setConnectionLogs([])}
            className="text-xs text-gray-400 hover:text-white"
          >
            Clear
          </button>
        </div>
        <div className="max-h-32 overflow-y-auto space-y-1">
          {connectionLogs.length === 0 ? (
            <div className="text-xs text-gray-500">No connection activity</div>
          ) : (
            connectionLogs.map((log, index) => (
              <div key={index} className="text-xs text-gray-300 font-mono">
                {log}
              </div>
            ))
          )}
        </div>
      </div>

      {/* API Configuration for NT8 */}
      {connection.type === 'NINJA_TRADER' && (
        <div className="mt-6 pt-6 border-t border-gray-700">
          <h4 className="text-sm font-medium text-white mb-4">NinjaTrader 8 Configuration</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-400">NTI Port: </span>
              <span className="text-white">8080</span>
            </div>
            <div>
              <span className="text-gray-400">Market Data: </span>
              <span className="text-green-400">Enabled</span>
            </div>
            <div>
              <span className="text-gray-400">Order Routing: </span>
              <span className="text-green-400">Enabled</span>
            </div>
            <div>
              <span className="text-gray-400">Position Updates: </span>
              <span className="text-green-400">Real-time</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};