import React, { useState, useEffect } from 'react';
import { X, Save, Settings, Database, Wifi, Bell, Palette, Shield } from 'lucide-react';

interface ConfigSettings {
  // Data Source Settings
  dataSources: {
    ninjaTrader: {
      enabled: boolean;
      endpoint: string;
      port: number;
      autoReconnect: boolean;
    };
    sierraChart: {
      enabled: boolean;
      endpoint: string;
      port: number;
      autoReconnect: boolean;
    };
    rithmic: {
      enabled: boolean;
      apiKey: string;
      environment: 'test' | 'live';
      autoReconnect: boolean;
    };
  };
  
  // Display Settings
  display: {
    theme: 'dark' | 'light' | 'auto';
    refreshRate: number;
    showAnimations: boolean;
    compactMode: boolean;
    showTooltips: boolean;
  };
  
  // Alert Settings
  alerts: {
    enabled: boolean;
    soundEnabled: boolean;
    priceAlerts: boolean;
    volumeAlerts: boolean;
    positionAlerts: boolean;
    strategyAlerts: boolean;
  };
  
  // Risk Settings
  risk: {
    maxPositionSize: number;
    maxDailyLoss: number;
    autoStopLoss: boolean;
    riskPerTrade: number;
  };
  
  // Strategy Settings
  strategies: {
    [key: string]: {
      enabled: boolean;
      weight: number;
      parameters: Record<string, any>;
    };
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
    dataSources: {
      ninjaTrader: {
        enabled: true,
        endpoint: 'localhost',
        port: 8080,
        autoReconnect: true,
      },
      sierraChart: {
        enabled: false,
        endpoint: 'localhost',
        port: 11099,
        autoReconnect: true,
      },
      rithmic: {
        enabled: false,
        apiKey: '',
        environment: 'test',
        autoReconnect: true,
      },
    },
    display: {
      theme: 'dark',
      refreshRate: 1000,
      showAnimations: true,
      compactMode: false,
      showTooltips: true,
    },
    alerts: {
      enabled: true,
      soundEnabled: true,
      priceAlerts: true,
      volumeAlerts: true,
      positionAlerts: true,
      strategyAlerts: true,
    },
    risk: {
      maxPositionSize: 10,
      maxDailyLoss: 1000,
      autoStopLoss: true,
      riskPerTrade: 2,
    },
    strategies: {
      'Momentum': { enabled: true, weight: 0.3, parameters: {} },
      'Reversal': { enabled: true, weight: 0.25, parameters: {} },
      'Breakout': { enabled: true, weight: 0.45, parameters: {} },
    },
  });

  useEffect(() => {
    if (initialSettings) {
      setSettings(prev => ({ ...prev, ...initialSettings }));
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
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return newSettings;
    });
  };

  if (!isOpen) return null;

  const tabs = [
    { id: 'data-sources', label: 'Data Sources', icon: Database },
    { id: 'display', label: 'Display', icon: Palette },
    { id: 'alerts', label: 'Alerts', icon: Bell },
    { id: 'risk', label: 'Risk', icon: Shield },
    { id: 'strategies', label: 'Strategies', icon: Settings },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-800 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div className="flex items-center space-x-3">
            <Settings className="w-6 h-6 text-blue-400" />
            <h2 className="text-xl font-bold text-white">
              {componentType} Configuration
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
                  
                  {/* NinjaTrader Settings */}
                  <div className="bg-gray-800 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-white font-medium">NinjaTrader 8</h4>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={settings.dataSources.ninjaTrader.enabled}
                          onChange={(e) => updateSetting('dataSources.ninjaTrader.enabled', e.target.checked)}
                          className="rounded border-gray-600 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-gray-400">Enabled</span>
                      </label>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">Endpoint</label>
                        <input
                          type="text"
                          value={settings.dataSources.ninjaTrader.endpoint}
                          onChange={(e) => updateSetting('dataSources.ninjaTrader.endpoint', e.target.value)}
                          className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">Port</label>
                        <input
                          type="number"
                          value={settings.dataSources.ninjaTrader.port}
                          onChange={(e) => updateSetting('dataSources.ninjaTrader.port', parseInt(e.target.value))}
                          className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Sierra Chart Settings */}
                  <div className="bg-gray-800 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-white font-medium">Sierra Chart</h4>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={settings.dataSources.sierraChart.enabled}
                          onChange={(e) => updateSetting('dataSources.sierraChart.enabled', e.target.checked)}
                          className="rounded border-gray-600 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-gray-400">Enabled</span>
                      </label>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">Endpoint</label>
                        <input
                          type="text"
                          value={settings.dataSources.sierraChart.endpoint}
                          onChange={(e) => updateSetting('dataSources.sierraChart.endpoint', e.target.value)}
                          className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">Port</label>
                        <input
                          type="number"
                          value={settings.dataSources.sierraChart.port}
                          onChange={(e) => updateSetting('dataSources.sierraChart.port', parseInt(e.target.value))}
                          className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Rithmic Settings */}
                  <div className="bg-gray-800 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-white font-medium">Rithmic</h4>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={settings.dataSources.rithmic.enabled}
                          onChange={(e) => updateSetting('dataSources.rithmic.enabled', e.target.checked)}
                          className="rounded border-gray-600 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-gray-400">Enabled</span>
                      </label>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">API Key</label>
                        <input
                          type="password"
                          value={settings.dataSources.rithmic.apiKey}
                          onChange={(e) => updateSetting('dataSources.rithmic.apiKey', e.target.value)}
                          className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                          placeholder="Enter API key..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">Environment</label>
                        <select
                          value={settings.dataSources.rithmic.environment}
                          onChange={(e) => updateSetting('dataSources.rithmic.environment', e.target.value)}
                          className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                        >
                          <option value="test">Test</option>
                          <option value="live">Live</option>
                        </select>
                      </div>
                    </div>
                  </div>
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
                        checked={settings.alerts.strategyAlerts}
                        onChange={(e) => updateSetting('alerts.strategyAlerts', e.target.checked)}
                        className="rounded border-gray-600 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-white">Strategy Alerts</span>
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
                </div>
              )}

              {activeTab === 'strategies' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-white">Strategy Configuration</h3>
                  
                  <div className="space-y-4">
                    {Object.entries(settings.strategies).map(([name, strategy]) => (
                      <div key={name} className="bg-gray-800 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-white font-medium">{name}</h4>
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={strategy.enabled}
                              onChange={(e) => updateSetting(`strategies.${name}.enabled`, e.target.checked)}
                              className="rounded border-gray-600 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="ml-2 text-gray-400">Enabled</span>
                          </label>
                        </div>
                        <div>
                          <label className="block text-sm text-gray-400 mb-2">Weight</label>
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={strategy.weight}
                            onChange={(e) => updateSetting(`strategies.${name}.weight`, parseFloat(e.target.value))}
                            className="w-full"
                          />
                          <div className="text-sm text-gray-400 mt-1">{(strategy.weight * 100).toFixed(0)}%</div>
                        </div>
                      </div>
                    ))}
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