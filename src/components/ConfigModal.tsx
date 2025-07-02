import React, { useState, useEffect } from 'react';
import { X, Save, Settings, Database, Wifi, Bell, Palette, Shield, Monitor, Server, Zap } from 'lucide-react';

interface ConfigSettings {
  // Data Source Settings
  dataSources: {
    ninjaTrader?: {
      enabled: boolean;
      endpoint: string;
      port: number;
      autoReconnect: boolean;
      heartbeatInterval: number;
      maxReconnectAttempts: number;
      dataBufferSize: number;
      compressionEnabled: boolean;
      encryptionEnabled: boolean;
      logLevel: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
    };
    sierraChart?: {
      enabled: boolean;
      endpoint: string;
      port: number;
      autoReconnect: boolean;
      dtcProtocol: boolean;
      acsil: boolean;
      dataBufferSize: number;
      logLevel: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
    };
    rithmic?: {
      enabled: boolean;
      apiKey: string;
      environment: 'test' | 'live';
      autoReconnect: boolean;
      encryptionEnabled: boolean;
      heartbeatInterval: number;
      maxReconnectAttempts: number;
      logLevel: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
    };
    [key: string]: any;
  };
  
  // Display Settings
  display: {
    theme: 'dark' | 'light' | 'auto';
    refreshRate: number;
    showAnimations: boolean;
    compactMode: boolean;
    showTooltips: boolean;
    autoScale: boolean;
    gridLines: boolean;
  };
  
  // Alert Settings
  alerts: {
    enabled: boolean;
    soundEnabled: boolean;
    priceAlerts: boolean;
    volumeAlerts: boolean;
    positionAlerts: boolean;
    strategyAlerts: boolean;
    connectionAlerts: boolean;
    riskAlerts: boolean;
  };
  
  // Risk Settings
  risk: {
    maxPositionSize: number;
    maxDailyLoss: number;
    autoStopLoss: boolean;
    riskPerTrade: number;
    portfolioHeatLimit: number;
    marginCallThreshold: number;
  };
  
  // Strategy Settings
  strategies: {
    [key: string]: {
      enabled: boolean;
      weight: number;
      parameters: Record<string, any>;
    };
  };

  // Advanced Settings
  advanced: {
    dataRetention: number;
    performanceMode: boolean;
    debugMode: boolean;
    apiTimeout: number;
    maxConcurrentConnections: number;
  };
}

interface ConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  componentType: string;
  initialSettings?: Partial<ConfigSettings>;
  onSave: (settings: ConfigSettings) => void;
}

export const ConfigModal: React.FC<ConfigModalProps> = ({
  isOpen,
  onClose,
  componentType,
  initialSettings,
  onSave
}) => {
  const [activeTab, setActiveTab] = useState('data-sources');
  const [settings, setSettings] = useState<ConfigSettings>({
    dataSources: {},
    display: {
      theme: 'dark',
      refreshRate: 1000,
      showAnimations: true,
      compactMode: false,
      showTooltips: true,
      autoScale: true,
      gridLines: true,
    },
    alerts: {
      enabled: true,
      soundEnabled: true,
      priceAlerts: true,
      volumeAlerts: true,
      positionAlerts: true,
      strategyAlerts: true,
      connectionAlerts: true,
      riskAlerts: true,
    },
    risk: {
      maxPositionSize: 10,
      maxDailyLoss: 1000,
      autoStopLoss: true,
      riskPerTrade: 2,
      portfolioHeatLimit: 80,
      marginCallThreshold: 25,
    },
    strategies: {
      'Momentum': { enabled: true, weight: 0.3, parameters: {} },
      'Reversal': { enabled: true, weight: 0.25, parameters: {} },
      'Breakout': { enabled: true, weight: 0.45, parameters: {} },
    },
    advanced: {
      dataRetention: 30,
      performanceMode: false,
      debugMode: false,
      apiTimeout: 5000,
      maxConcurrentConnections: 5,
    },
  });

  useEffect(() => {
    if (initialSettings) {
      setSettings(prev => ({ 
        ...prev, 
        ...initialSettings,
        dataSources: { ...prev.dataSources, ...initialSettings.dataSources }
      }));
    }
  }, [initialSettings]);

  useEffect(() => {
    // Load settings from localStorage
    const stored = localStorage.getItem(`nexus-config-${componentType}`);
    if (stored) {
      try {
        const parsedSettings = JSON.parse(stored);
        setSettings(prev => ({ ...prev, ...parsedSettings }));
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    }
  }, [componentType]);

  const handleSave = () => {
    // Save to localStorage
    localStorage.setItem(`nexus-config-${componentType}`, JSON.stringify(settings));
    onSave(settings);
    onClose();
  };

  const updateSetting = (path: string, value: any) => {
    setSettings(prev => {
      const newSettings = { ...prev };
      const keys = path.split('.');
      let current: any = newSettings;
      
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {};
        }
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return newSettings;
    });
  };

  if (!isOpen) return null;

  const getBrokerIcon = (type: string) => {
    switch (type) {
      case 'ninja': return <Monitor className="w-4 h-4" />;
      case 'sierra': return <Server className="w-4 h-4" />;
      case 'rithmic': return <Zap className="w-4 h-4" />;
      default: return <Database className="w-4 h-4" />;
    }
  };

  const tabs = [
    { id: 'data-sources', label: 'Data Sources', icon: Database },
    { id: 'display', label: 'Display', icon: Palette },
    { id: 'alerts', label: 'Alerts', icon: Bell },
    { id: 'risk', label: 'Risk', icon: Shield },
    { id: 'strategies', label: 'Strategies', icon: Settings },
    { id: 'advanced', label: 'Advanced', icon: Wifi },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-800 rounded-xl w-full max-w-5xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div className="flex items-center space-x-3">
            <Settings className="w-6 h-6 text-blue-400" />
            <h2 className="text-xl font-bold text-white">
              {componentType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())} Configuration
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex h-[600px]">
          {/* Sidebar */}
          <div className="w-64 bg-gray-800 border-r border-gray-700">
            <div className="p-4">
              <h3 className="text-sm font-medium text-gray-400 mb-4">SETTINGS</h3>
              <nav className="space-y-2">
                {tabs.map(tab => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                        activeTab === tab.id
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-400 hover:text-white hover:bg-gray-700'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6">
              {activeTab === 'data-sources' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-white">Data Source Configuration</h3>
                  
                  {/* Broker-specific settings */}
                  {componentType.includes('ninja') && (
                    <div className="bg-gray-800 rounded-lg p-6">
                      <div className="flex items-center space-x-3 mb-6">
                        <Monitor className="w-6 h-6 text-purple-400" />
                        <h4 className="text-white font-medium text-lg">NinjaTrader 8 Settings</h4>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm text-gray-400 mb-2">Endpoint</label>
                            <input
                              type="text"
                              value={settings.dataSources.ninjaTrader?.endpoint || 'localhost'}
                              onChange={(e) => updateSetting('dataSources.ninjaTrader.endpoint', e.target.value)}
                              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-400 mb-2">NTI Port</label>
                            <input
                              type="number"
                              value={settings.dataSources.ninjaTrader?.port || 8080}
                              onChange={(e) => updateSetting('dataSources.ninjaTrader.port', parseInt(e.target.value))}
                              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-400 mb-2">Heartbeat Interval (seconds)</label>
                            <input
                              type="number"
                              value={settings.dataSources.ninjaTrader?.heartbeatInterval || 30}
                              onChange={(e) => updateSetting('dataSources.ninjaTrader.heartbeatInterval', parseInt(e.target.value))}
                              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm text-gray-400 mb-2">Max Reconnect Attempts</label>
                            <input
                              type="number"
                              value={settings.dataSources.ninjaTrader?.maxReconnectAttempts || 5}
                              onChange={(e) => updateSetting('dataSources.ninjaTrader.maxReconnectAttempts', parseInt(e.target.value))}
                              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-400 mb-2">Data Buffer Size</label>
                            <input
                              type="number"
                              value={settings.dataSources.ninjaTrader?.dataBufferSize || 1000}
                              onChange={(e) => updateSetting('dataSources.ninjaTrader.dataBufferSize', parseInt(e.target.value))}
                              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-400 mb-2">Log Level</label>
                            <select
                              value={settings.dataSources.ninjaTrader?.logLevel || 'INFO'}
                              onChange={(e) => updateSetting('dataSources.ninjaTrader.logLevel', e.target.value)}
                              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                            >
                              <option value="DEBUG">Debug</option>
                              <option value="INFO">Info</option>
                              <option value="WARN">Warning</option>
                              <option value="ERROR">Error</option>
                            </select>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-6 space-y-3">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={settings.dataSources.ninjaTrader?.autoReconnect ?? true}
                            onChange={(e) => updateSetting('dataSources.ninjaTrader.autoReconnect', e.target.checked)}
                            className="rounded border-gray-600 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-white">Auto-reconnect on disconnect</span>
                        </label>
                        
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={settings.dataSources.ninjaTrader?.compressionEnabled ?? true}
                            onChange={(e) => updateSetting('dataSources.ninjaTrader.compressionEnabled', e.target.checked)}
                            className="rounded border-gray-600 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-white">Enable data compression</span>
                        </label>
                        
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={settings.dataSources.ninjaTrader?.encryptionEnabled ?? false}
                            onChange={(e) => updateSetting('dataSources.ninjaTrader.encryptionEnabled', e.target.checked)}
                            className="rounded border-gray-600 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-white">Enable encryption (SSL/TLS)</span>
                        </label>
                      </div>
                    </div>
                  )}

                  {componentType.includes('sierra') && (
                    <div className="bg-gray-800 rounded-lg p-6">
                      <div className="flex items-center space-x-3 mb-6">
                        <Server className="w-6 h-6 text-blue-400" />
                        <h4 className="text-white font-medium text-lg">Sierra Chart Settings</h4>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm text-gray-400 mb-2">DTC Server Endpoint</label>
                            <input
                              type="text"
                              value={settings.dataSources.sierraChart?.endpoint || 'localhost'}
                              onChange={(e) => updateSetting('dataSources.sierraChart.endpoint', e.target.value)}
                              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-400 mb-2">DTC Port</label>
                            <input
                              type="number"
                              value={settings.dataSources.sierraChart?.port || 11099}
                              onChange={(e) => updateSetting('dataSources.sierraChart.port', parseInt(e.target.value))}
                              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm text-gray-400 mb-2">Data Buffer Size</label>
                            <input
                              type="number"
                              value={settings.dataSources.sierraChart?.dataBufferSize || 1000}
                              onChange={(e) => updateSetting('dataSources.sierraChart.dataBufferSize', parseInt(e.target.value))}
                              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-400 mb-2">Log Level</label>
                            <select
                              value={settings.dataSources.sierraChart?.logLevel || 'INFO'}
                              onChange={(e) => updateSetting('dataSources.sierraChart.logLevel', e.target.value)}
                              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                            >
                              <option value="DEBUG">Debug</option>
                              <option value="INFO">Info</option>
                              <option value="WARN">Warning</option>
                              <option value="ERROR">Error</option>
                            </select>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-6 space-y-3">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={settings.dataSources.sierraChart?.dtcProtocol ?? true}
                            onChange={(e) => updateSetting('dataSources.sierraChart.dtcProtocol', e.target.checked)}
                            className="rounded border-gray-600 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-white">Enable DTC Protocol</span>
                        </label>
                        
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={settings.dataSources.sierraChart?.acsil ?? true}
                            onChange={(e) => updateSetting('dataSources.sierraChart.acsil', e.target.checked)}
                            className="rounded border-gray-600 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-white">Enable ACSIL Interface</span>
                        </label>
                      </div>
                    </div>
                  )}

                  {componentType.includes('rithmic') && (
                    <div className="bg-gray-800 rounded-lg p-6">
                      <div className="flex items-center space-x-3 mb-6">
                        <Zap className="w-6 h-6 text-orange-400" />
                        <h4 className="text-white font-medium text-lg">Rithmic Settings</h4>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm text-gray-400 mb-2">API Key</label>
                            <input
                              type="password"
                              value={settings.dataSources.rithmic?.apiKey || ''}
                              onChange={(e) => updateSetting('dataSources.rithmic.apiKey', e.target.value)}
                              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                              placeholder="Enter your Rithmic API key..."
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-400 mb-2">Environment</label>
                            <select
                              value={settings.dataSources.rithmic?.environment || 'test'}
                              onChange={(e) => updateSetting('dataSources.rithmic.environment', e.target.value)}
                              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                            >
                              <option value="test">Test Environment</option>
                              <option value="live">Live Environment</option>
                            </select>
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm text-gray-400 mb-2">Heartbeat Interval (seconds)</label>
                            <input
                              type="number"
                              value={settings.dataSources.rithmic?.heartbeatInterval || 30}
                              onChange={(e) => updateSetting('dataSources.rithmic.heartbeatInterval', parseInt(e.target.value))}
                              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-400 mb-2">Max Reconnect Attempts</label>
                            <input
                              type="number"
                              value={settings.dataSources.rithmic?.maxReconnectAttempts || 5}
                              onChange={(e) => updateSetting('dataSources.rithmic.maxReconnectAttempts', parseInt(e.target.value))}
                              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-6 space-y-3">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={settings.dataSources.rithmic?.encryptionEnabled ?? true}
                            onChange={(e) => updateSetting('dataSources.rithmic.encryptionEnabled', e.target.checked)}
                            className="rounded border-gray-600 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-white">Enable SSL/TLS encryption</span>
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'display' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-white">Display Settings</h3>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Theme</label>
                      <select
                        value={settings.display.theme}
                        onChange={(e) => updateSetting('display.theme', e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
                      >
                        <option value="dark">Dark</option>
                        <option value="light">Light</option>
                        <option value="auto">Auto</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Refresh Rate (ms)</label>
                      <input
                        type="number"
                        value={settings.display.refreshRate}
                        onChange={(e) => updateSetting('display.refreshRate', parseInt(e.target.value))}
                        className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
                        min="100"
                        max="10000"
                        step="100"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.display.showAnimations}
                        onChange={(e) => updateSetting('display.showAnimations', e.target.checked)}
                        className="rounded border-gray-600 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-white">Show Animations</span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.display.compactMode}
                        onChange={(e) => updateSetting('display.compactMode', e.target.checked)}
                        className="rounded border-gray-600 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-white">Compact Mode</span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.display.showTooltips}
                        onChange={(e) => updateSetting('display.showTooltips', e.target.checked)}
                        className="rounded border-gray-600 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-white">Show Tooltips</span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.display.autoScale}
                        onChange={(e) => updateSetting('display.autoScale', e.target.checked)}
                        className="rounded border-gray-600 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-white">Auto-scale Charts</span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.display.gridLines}
                        onChange={(e) => updateSetting('display.gridLines', e.target.checked)}
                        className="rounded border-gray-600 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-white">Show Grid Lines</span>
                    </label>
                  </div>
                </div>
              )}

              {activeTab === 'alerts' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-white">Alert Settings</h3>
                  
                  <div className="space-y-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.alerts.enabled}
                        onChange={(e) => updateSetting('alerts.enabled', e.target.checked)}
                        className="rounded border-gray-600 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-white">Enable Alerts</span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.alerts.soundEnabled}
                        onChange={(e) => updateSetting('alerts.soundEnabled', e.target.checked)}
                        className="rounded border-gray-600 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-white">Sound Alerts</span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.alerts.connectionAlerts}
                        onChange={(e) => updateSetting('alerts.connectionAlerts', e.target.checked)}
                        className="rounded border-gray-600 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-white">Connection Alerts</span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.alerts.priceAlerts}
                        onChange={(e) => updateSetting('alerts.priceAlerts', e.target.checked)}
                        className="rounded border-gray-600 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-white">Price Alerts</span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.alerts.volumeAlerts}
                        onChange={(e) => updateSetting('alerts.volumeAlerts', e.target.checked)}
                        className="rounded border-gray-600 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-white">Volume Alerts</span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.alerts.positionAlerts}
                        onChange={(e) => updateSetting('alerts.positionAlerts', e.target.checked)}
                        className="rounded border-gray-600 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-white">Position Alerts</span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.alerts.riskAlerts}
                        onChange={(e) => updateSetting('alerts.riskAlerts', e.target.checked)}
                        className="rounded border-gray-600 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-white">Risk Alerts</span>
                    </label>
                  </div>
                </div>
              )}

              {activeTab === 'risk' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-white">Risk Management</h3>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Max Position Size</label>
                      <input
                        type="number"
                        value={settings.risk.maxPositionSize}
                        onChange={(e) => updateSetting('risk.maxPositionSize', parseInt(e.target.value))}
                        className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Max Daily Loss ($)</label>
                      <input
                        type="number"
                        value={settings.risk.maxDailyLoss}
                        onChange={(e) => updateSetting('risk.maxDailyLoss', parseInt(e.target.value))}
                        className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Risk Per Trade (%)</label>
                      <input
                        type="number"
                        value={settings.risk.riskPerTrade}
                        onChange={(e) => updateSetting('risk.riskPerTrade', parseFloat(e.target.value))}
                        className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
                        step="0.1"
                        min="0.1"
                        max="10"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Portfolio Heat Limit (%)</label>
                      <input
                        type="number"
                        value={settings.risk.portfolioHeatLimit}
                        onChange={(e) => updateSetting('risk.portfolioHeatLimit', parseInt(e.target.value))}
                        className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
                      />
                    </div>
                  </div>

                  <div className="flex items-center">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.risk.autoStopLoss}
                        onChange={(e) => updateSetting('risk.autoStopLoss', e.target.checked)}
                        className="rounded border-gray-600 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-white">Auto Stop Loss</span>
                    </label>
                  </div>
                </div>
              )}

              {activeTab === 'advanced' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-white">Advanced Settings</h3>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Data Retention (days)</label>
                      <input
                        type="number"
                        value={settings.advanced.dataRetention}
                        onChange={(e) => updateSetting('advanced.dataRetention', parseInt(e.target.value))}
                        className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-400 mb-2">API Timeout (ms)</label>
                      <input
                        type="number"
                        value={settings.advanced.apiTimeout}
                        onChange={(e) => updateSetting('advanced.apiTimeout', parseInt(e.target.value))}
                        className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Max Concurrent Connections</label>
                      <input
                        type="number"
                        value={settings.advanced.maxConcurrentConnections}
                        onChange={(e) => updateSetting('advanced.maxConcurrentConnections', parseInt(e.target.value))}
                        className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.advanced.performanceMode}
                        onChange={(e) => updateSetting('advanced.performanceMode', e.target.checked)}
                        className="rounded border-gray-600 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-white">Performance Mode (reduces visual effects)</span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.advanced.debugMode}
                        onChange={(e) => updateSetting('advanced.debugMode', e.target.checked)}
                        className="rounded border-gray-600 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-white">Debug Mode (verbose logging)</span>
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-4 p-6 border-t border-gray-800">
          <button
            onClick={onClose}
            className="px-6 py-2 text-gray-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex items-center space-x-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Save Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
};