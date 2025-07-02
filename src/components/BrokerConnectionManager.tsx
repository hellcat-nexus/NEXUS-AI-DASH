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
  Zap,
  Monitor,
  Server,
  Shield,
  Bell
} from 'lucide-react';
import { BrokerConnection } from '../types/trading';
import { ConfigModal } from './ConfigModal';

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
  const [showConfig, setShowConfig] = useState(false);
  const [dataFeed, setDataFeed] = useState({
    ticksReceived: 0,
    lastTick: null as any,
    latency: 0,
    isStreaming: false,
    dataRate: 0,
    errorCount: 0
  });

  const [connectionConfig, setConnectionConfig] = useState({
    autoReconnect: true,
    heartbeatInterval: 30,
    maxReconnectAttempts: 5,
    dataBufferSize: 1000,
    compressionEnabled: true,
    encryptionEnabled: false,
    alertsEnabled: true,
    logLevel: 'INFO' as 'DEBUG' | 'INFO' | 'WARN' | 'ERROR'
  });

  const handleConnect = async () => {
    setIsConnecting(true);
    addLog(`Attempting to connect to ${connection.name}...`);
    
    try {
      // Simulate connection process with realistic steps
      addLog(`Resolving endpoint ${connection.endpoint}...`);
      await new Promise(resolve => setTimeout(resolve, 800));
      
      if (connection.type === 'NINJA_TRADER') {
        addLog(`Connecting to NinjaTrader 8 on ${connection.endpoint}:${connection.endpoint?.includes(':') ? connection.endpoint.split(':')[1] : '8080'}`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        addLog(`Authenticating with account ${connection.account}...`);
        await new Promise(resolve => setTimeout(resolve, 600));
        
        addLog(`Enabling NTI (NinjaTrader Interface)...`);
        await new Promise(resolve => setTimeout(resolve, 400));
        
        addLog(`Subscribing to market data feeds...`);
        await new Promise(resolve => setTimeout(resolve, 500));
        
        addLog(`✅ Connection established successfully`);
        addLog(`📊 Data feed active - receiving market data`);
        addLog(`🔄 Auto-reconnect enabled`);
        
        // Start simulated data feed
        setDataFeed(prev => ({ ...prev, isStreaming: true }));
        
        onUpdate({
          ...connection,
          status: 'CONNECTED',
          lastSync: Date.now()
        });
      } else if (connection.type === 'SIERRA_CHART') {
        addLog(`Connecting to Sierra Chart DTC server on ${connection.endpoint}...`);
        await new Promise(resolve => setTimeout(resolve, 1200));
        
        addLog(`Establishing DTC protocol connection...`);
        await new Promise(resolve => setTimeout(resolve, 800));
        
        addLog(`✅ Sierra Chart connection established`);
        addLog(`📈 Market data subscription active`);
        
        setDataFeed(prev => ({ ...prev, isStreaming: true }));
        
        onUpdate({
          ...connection,
          status: 'CONNECTED',
          lastSync: Date.now()
        });
      } else if (connection.type === 'RITHMIC') {
        addLog(`Connecting to Rithmic R|API+ servers...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        addLog(`Authenticating with API credentials...`);
        await new Promise(resolve => setTimeout(resolve, 800));
        
        addLog(`✅ Rithmic connection established`);
        addLog(`⚡ Real-time data streaming active`);
        
        setDataFeed(prev => ({ ...prev, isStreaming: true }));
        
        onUpdate({
          ...connection,
          status: 'CONNECTED',
          lastSync: Date.now()
        });
      }
    } catch (error) {
      addLog(`❌ Connection failed: ${error}`);
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
    addLog(`Disconnecting from ${connection.name}...`);
    setDataFeed(prev => ({ ...prev, isStreaming: false }));
    onUpdate({
      ...connection,
      status: 'DISCONNECTED',
      lastSync: Date.now()
    });
    addLog(`🔌 Disconnected successfully`);
  };

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setConnectionLogs(prev => [...prev, `[${timestamp}] ${message}`].slice(-20)); // Keep last 20 logs
  };

  const handleConfigSave = (settings: any) => {
    setConnectionConfig(prev => ({ ...prev, ...settings }));
    addLog(`⚙️ Configuration updated`);
    
    // Apply settings to connection
    if (settings.autoReconnect !== undefined) {
      addLog(`Auto-reconnect ${settings.autoReconnect ? 'enabled' : 'disabled'}`);
    }
    
    if (settings.alertsEnabled !== undefined) {
      addLog(`Alerts ${settings.alertsEnabled ? 'enabled' : 'disabled'}`);
    }
  };

  // Simulate data feed updates
  useEffect(() => {
    if (dataFeed.isStreaming && connection.status === 'CONNECTED') {
      const interval = setInterval(() => {
        setDataFeed(prev => {
          const newTicksReceived = prev.ticksReceived + Math.floor(Math.random() * 8) + 1;
          const newDataRate = Math.floor(Math.random() * 50) + 20; // Ticks per second
          
          return {
            ...prev,
            ticksReceived: newTicksReceived,
            lastTick: {
              symbol: connection.type === 'NINJA_TRADER' ? 'ES' : 
                     connection.type === 'SIERRA_CHART' ? 'NQ' : 'CL',
              price: 4320 + (Math.random() - 0.5) * 20,
              volume: Math.floor(Math.random() * 200) + 1,
              timestamp: Date.now()
            },
            latency: Math.floor(Math.random() * 15) + 1,
            dataRate: newDataRate,
            errorCount: prev.errorCount + (Math.random() < 0.02 ? 1 : 0) // 2% chance of error
          };
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [dataFeed.isStreaming, connection.status, connection.type]);

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

  const getBrokerIcon = () => {
    switch (connection.type) {
      case 'NINJA_TRADER': return <Monitor className="w-6 h-6 text-purple-400" />;
      case 'SIERRA_CHART': return <Server className="w-6 h-6 text-blue-400" />;
      case 'RITHMIC': return <Zap className="w-6 h-6 text-orange-400" />;
      case 'INTERACTIVE_BROKERS': return <Database className="w-6 h-6 text-green-400" />;
      default: return <Database className="w-6 h-6 text-gray-400" />;
    }
  };

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-gray-800 rounded-lg">
            {getBrokerIcon()}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">{connection.name}</h3>
            <div className="flex items-center space-x-3 mt-1">
              <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${getStatusColor()}`}>
                {getStatusIcon()}
                <span className="text-sm font-medium">{connection.status}</span>
              </div>
              <span className="text-sm text-gray-400">{connection.type.replace('_', ' ')}</span>
              {connection.status === 'CONNECTED' && (
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-green-400">Live</span>
                </div>
              )}
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
          
          <button 
            onClick={() => setShowConfig(true)}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            title="Configure Connection"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Connection Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Endpoint</label>
            <div className="text-white font-mono text-sm bg-gray-800 px-3 py-2 rounded">
              {connection.endpoint || 'Not configured'}
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Account</label>
            <div className="text-white font-mono text-sm bg-gray-800 px-3 py-2 rounded">
              {connection.account || 'Not specified'}
            </div>
          </div>
          {connection.apiKey && (
            <div>
              <label className="block text-sm text-gray-400 mb-1">API Key</label>
              <div className="text-white font-mono text-sm bg-gray-800 px-3 py-2 rounded">
                {connection.apiKey.replace(/./g, '*')}
              </div>
            </div>
          )}
        </div>
        
        {connection.status === 'CONNECTED' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Data Feed</span>
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-green-400" />
                <span className="text-green-400">Streaming</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Ticks Received</span>
              <span className="text-white font-mono">{dataFeed.ticksReceived.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Data Rate</span>
              <span className="text-white font-mono">{dataFeed.dataRate}/sec</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Latency</span>
              <span className={`font-mono ${dataFeed.latency < 10 ? 'text-green-400' : dataFeed.latency < 20 ? 'text-yellow-400' : 'text-red-400'}`}>
                {dataFeed.latency}ms
              </span>
            </div>
            {dataFeed.lastTick && (
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Last Tick</span>
                <span className="text-white font-mono">
                  {dataFeed.lastTick.symbol} @ {dataFeed.lastTick.price.toFixed(2)}
                </span>
              </div>
            )}
            {dataFeed.errorCount > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Errors</span>
                <span className="text-red-400 font-mono">{dataFeed.errorCount}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Connection Logs */}
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-white">Connection Log</h4>
          <div className="flex items-center space-x-2">
            <select 
              value={connectionConfig.logLevel}
              onChange={(e) => setConnectionConfig(prev => ({ ...prev, logLevel: e.target.value as any }))}
              className="text-xs bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white"
            >
              <option value="DEBUG">Debug</option>
              <option value="INFO">Info</option>
              <option value="WARN">Warning</option>
              <option value="ERROR">Error</option>
            </select>
            <button 
              onClick={() => setConnectionLogs([])}
              className="text-xs text-gray-400 hover:text-white px-2 py-1 bg-gray-700 rounded"
            >
              Clear
            </button>
          </div>
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

      {/* Platform-specific Configuration */}
      {connection.type === 'NINJA_TRADER' && (
        <div className="mt-6 pt-6 border-t border-gray-700">
          <h4 className="text-sm font-medium text-white mb-4">NinjaTrader 8 Configuration</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">NTI Port:</span>
                <span className="text-white">8080</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Market Data:</span>
                <span className="text-green-400">✓ Enabled</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Order Routing:</span>
                <span className="text-green-400">✓ Enabled</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Position Updates:</span>
                <span className="text-green-400">Real-time</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Auto-reconnect:</span>
                <span className={connectionConfig.autoReconnect ? 'text-green-400' : 'text-gray-400'}>
                  {connectionConfig.autoReconnect ? '✓ Enabled' : '✗ Disabled'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Compression:</span>
                <span className={connectionConfig.compressionEnabled ? 'text-green-400' : 'text-gray-400'}>
                  {connectionConfig.compressionEnabled ? '✓ Enabled' : '✗ Disabled'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {connection.type === 'SIERRA_CHART' && (
        <div className="mt-6 pt-6 border-t border-gray-700">
          <h4 className="text-sm font-medium text-white mb-4">Sierra Chart Configuration</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">DTC Protocol:</span>
                <span className="text-green-400">✓ Active</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Port:</span>
                <span className="text-white">11099</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">ACSIL:</span>
                <span className="text-green-400">✓ Enabled</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Buffer Size:</span>
                <span className="text-white">{connectionConfig.dataBufferSize}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {connection.type === 'RITHMIC' && (
        <div className="mt-6 pt-6 border-t border-gray-700">
          <h4 className="text-sm font-medium text-white mb-4">Rithmic Configuration</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">R|API+ Version:</span>
                <span className="text-white">3.9.1</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Environment:</span>
                <span className="text-white">Live</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Encryption:</span>
                <span className={connectionConfig.encryptionEnabled ? 'text-green-400' : 'text-gray-400'}>
                  {connectionConfig.encryptionEnabled ? '✓ Enabled' : '✗ Disabled'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Heartbeat:</span>
                <span className="text-white">{connectionConfig.heartbeatInterval}s</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Configuration Modal */}
      <ConfigModal
        isOpen={showConfig}
        onClose={() => setShowConfig(false)}
        componentType={`broker-${connection.type.toLowerCase()}`}
        initialSettings={{
          dataSources: {
            [connection.type.toLowerCase()]: {
              enabled: connection.status === 'CONNECTED',
              endpoint: connection.endpoint || '',
              autoReconnect: connectionConfig.autoReconnect,
              ...connectionConfig
            }
          }
        }}
        onSave={handleConfigSave}
      />
    </div>
  );
};