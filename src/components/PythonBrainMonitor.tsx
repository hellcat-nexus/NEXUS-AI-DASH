import React, { useState, useEffect } from 'react';
import {
  Brain,
  Activity,
  Zap,
  Database,
  TrendingUp,
  Shield,
  Target,
  BarChart3,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  Cpu,
  Settings,
  Play,
  Pause,
  Server,
  Wifi,
  WifiOff,
  AlertTriangle
} from 'lucide-react';
import { pythonBrainClient, PythonBrainStatus, PythonAnalysisResult } from '../services/PythonBrainClient';

interface PythonBrainMonitorProps {
  dashboardContext?: any;
}

export const PythonBrainMonitor: React.FC<PythonBrainMonitorProps> = ({ dashboardContext }) => {
  const [status, setStatus] = useState<PythonBrainStatus | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isServerAvailable, setIsServerAvailable] = useState(false);
  const [recentAnalysis, setRecentAnalysis] = useState<PythonAnalysisResult[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [autoAnalysisEnabled, setAutoAnalysisEnabled] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<number>(0);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check initial connection status
    setIsConnected(pythonBrainClient.getConnectionStatus());
    setIsServerAvailable(pythonBrainClient.getServerAvailability());
    
    // Load status with error handling (only if server is available)
    if (pythonBrainClient.getServerAvailability()) {
      loadStatus();
    }
    
    // Set up event listeners
    const handleConnection = (event: CustomEvent) => {
      setIsConnected(event.detail.isConnected);
      setIsServerAvailable(event.detail.serverAvailable);
      
      if (event.detail.status === 'connected') {
        setConnectionError(null);
        loadStatus(); // Load status when connected
      } else if (event.detail.status === 'failed') {
        setConnectionError('Failed to connect to Python Brain server after multiple attempts.');
      } else if (event.detail.status === 'server_unavailable') {
        setConnectionError('Python Brain server is not running or not accessible on port 5000.');
      } else if (event.detail.status === 'error') {
        setConnectionError('WebSocket connection error occurred.');
      }
    };

    const handleAnalysisResult = (event: CustomEvent) => {
      const result = event.detail as PythonAnalysisResult;
      setRecentAnalysis(prev => [result, ...prev.slice(0, 9)]); // Keep last 10
      setLastUpdate(Date.now());
    };

    const handleAutoAnalysis = (event: CustomEvent) => {
      console.log('🐍 Auto analysis triggered:', event.detail);
    };

    window.addEventListener('pythonBrainConnection', handleConnection as EventListener);
    window.addEventListener('pythonAnalysisResult', handleAnalysisResult as EventListener);
    window.addEventListener('pythonAutoAnalysis', handleAutoAnalysis as EventListener);

    // Subscribe to analysis results
    const unsubscribe = pythonBrainClient.subscribe('analysis_result', (result: PythonAnalysisResult) => {
      setRecentAnalysis(prev => [result, ...prev.slice(0, 9)]);
    });

    // Periodic status updates (only if server is available)
    const statusInterval = setInterval(() => {
      if (pythonBrainClient.getServerAvailability() && pythonBrainClient.getConnectionStatus()) {
        loadStatus();
      }
    }, 30000); // Every 30 seconds

    return () => {
      window.removeEventListener('pythonBrainConnection', handleConnection as EventListener);
      window.removeEventListener('pythonAnalysisResult', handleAnalysisResult as EventListener);
      window.removeEventListener('pythonAutoAnalysis', handleAutoAnalysis as EventListener);
      unsubscribe();
      clearInterval(statusInterval);
    };
  }, []);

  useEffect(() => {
    // Auto-distribute dashboard context when it changes
    if (dashboardContext && autoAnalysisEnabled && isConnected && isServerAvailable) {
      pythonBrainClient.distributeData(dashboardContext);
    }
  }, [dashboardContext, autoAnalysisEnabled, isConnected, isServerAvailable]);

  const loadStatus = async () => {
    if (isLoading || !isServerAvailable) return; // Prevent concurrent requests and don't load if server unavailable
    
    setIsLoading(true);
    try {
      const currentStatus = await pythonBrainClient.getStatus();
      setStatus(currentStatus);
      setConnectionError(null);
    } catch (error) {
      console.error('Failed to load Python Brain status:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setConnectionError(errorMessage);
      // Don't clear status on error, keep showing last known status
    } finally {
      setIsLoading(false);
    }
  };

  const runAnalysis = async (analysisType: string) => {
    if (!isServerAvailable) {
      setConnectionError('Cannot run analysis: Python Brain server is not available');
      return;
    }

    if (!isConnected) {
      setConnectionError('Cannot run analysis: Python Brain not connected');
      return;
    }

    if (!dashboardContext) {
      setConnectionError('Cannot run analysis: No data available');
      return;
    }

    setIsAnalyzing(true);
    setConnectionError(null);
    
    try {
      let result: PythonAnalysisResult;

      switch (analysisType) {
        case 'market':
          result = await pythonBrainClient.analyzeMarket(dashboardContext.marketData || []);
          break;
        case 'strategy':
          result = await pythonBrainClient.analyzeStrategy(
            dashboardContext.strategies || [],
            dashboardContext.performance || {}
          );
          break;
        case 'risk':
          result = await pythonBrainClient.analyzeRisk(
            dashboardContext.riskMetrics || {},
            dashboardContext.positions || []
          );
          break;
        case 'portfolio':
          result = await pythonBrainClient.optimizePortfolio(
            dashboardContext.positions || [],
            0.12, // 12% target return
            'medium' // risk tolerance
          );
          break;
        case 'prediction':
          result = await pythonBrainClient.predictPrice(dashboardContext.marketData || [], 24);
          break;
        case 'patterns':
          result = await pythonBrainClient.detectPatterns(dashboardContext.marketData || []);
          break;
        default:
          throw new Error(`Unknown analysis type: ${analysisType}`);
      }

      setRecentAnalysis(prev => [result, ...prev.slice(0, 9)]);
      setLastUpdate(Date.now());
    } catch (error) {
      console.error(`Analysis error (${analysisType}):`, error);
      setConnectionError(error instanceof Error ? error.message : `Analysis failed: ${analysisType}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getStatusColor = () => {
    if (!isServerAvailable) return 'text-red-400 bg-red-900/20';
    if (!isConnected) return 'text-orange-400 bg-orange-900/20';
    if (!status?.pythonReady) return 'text-yellow-400 bg-yellow-900/20';
    return 'text-green-400 bg-green-900/20';
  };

  const getStatusText = () => {
    if (!isServerAvailable) return 'Server Unavailable';
    if (!isConnected) return 'Disconnected';
    if (!status?.pythonReady) return 'Initializing';
    return 'Ready';
  };

  const getStatusIcon = () => {
    if (!isServerAvailable) return <Server className="w-5 h-5 text-red-400" />;
    if (!isConnected) return <WifiOff className="w-5 h-5 text-orange-400" />;
    if (!status?.pythonReady) return <Clock className="w-5 h-5 text-yellow-400" />;
    return <Wifi className="w-5 h-5 text-green-400" />;
  };

  const formatAnalysisType = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getAnalysisIcon = (type: string) => {
    switch (type) {
      case 'market_analysis': return <TrendingUp className="w-4 h-4 text-green-400" />;
      case 'strategy_analysis': return <Target className="w-4 h-4 text-blue-400" />;
      case 'risk_analysis': return <Shield className="w-4 h-4 text-orange-400" />;
      case 'portfolio_optimization': return <BarChart3 className="w-4 h-4 text-purple-400" />;
      case 'price_prediction': return <TrendingUp className="w-4 h-4 text-cyan-400" />;
      case 'pattern_detection': return <Activity className="w-4 h-4 text-pink-400" />;
      default: return <Brain className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 relative">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-purple-900/20 rounded-full">
            <Brain className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Python Brain</h2>
            <p className="text-sm text-gray-400">Advanced Analytics Engine</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${getStatusColor()}`}>
            {getStatusIcon()}
            <span className="text-sm font-medium">{getStatusText()}</span>
          </div>
          
          <button
            onClick={() => setAutoAnalysisEnabled(!autoAnalysisEnabled)}
            disabled={!isServerAvailable || !isConnected}
            className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${
              autoAnalysisEnabled 
                ? 'bg-green-600 text-white' 
                : 'bg-gray-800 text-gray-400'
            }`}
            title={`Auto Analysis: ${autoAnalysisEnabled ? 'Enabled' : 'Disabled'}`}
          >
            {autoAnalysisEnabled ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          </button>
          
          <button
            onClick={loadStatus}
            disabled={isLoading || !isServerAvailable}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 disabled:opacity-50 rounded-lg transition-colors"
            title="Refresh Status"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Server Unavailable Alert */}
      {!isServerAvailable && (
        <div className="mb-6 p-4 bg-red-900/20 border border-red-700 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <div>
              <h4 className="text-red-400 font-medium">Python Brain Server Not Available</h4>
              <p className="text-red-300 text-sm mt-1">
                The Python Brain server is not running or not accessible on port 5000.
              </p>
              <div className="text-red-300 text-xs mt-2 space-y-1">
                <p>To start the Python Brain server, run one of these commands:</p>
                <div className="bg-red-800/30 p-2 rounded font-mono text-xs">
                  <p><code>npm run dev</code> (starts all servers)</p>
                  <p><code>npm run python-brain</code> (starts only Python Brain)</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Connection Error Alert */}
      {connectionError && isServerAvailable && (
        <div className="mb-6 p-4 bg-orange-900/20 border border-orange-700 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-orange-400" />
            <div>
              <h4 className="text-orange-400 font-medium">Connection Issue</h4>
              <p className="text-orange-300 text-sm mt-1">{connectionError}</p>
            </div>
          </div>
        </div>
      )}

      {/* Status Overview */}
      {status && isServerAvailable && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <Cpu className="w-5 h-5 text-blue-400" />
              <span className="text-xs text-gray-400">CLIENTS</span>
            </div>
            <div className="text-xl font-bold text-white">{status.connectedClients}</div>
            <div className="text-sm text-gray-400">Connected</div>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <Database className="w-5 h-5 text-green-400" />
              <span className="text-xs text-gray-400">STREAMS</span>
            </div>
            <div className="text-xl font-bold text-white">{status.activeStreams}</div>
            <div className="text-sm text-gray-400">Active</div>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <Activity className="w-5 h-5 text-purple-400" />
              <span className="text-xs text-gray-400">CACHE</span>
            </div>
            <div className="text-xl font-bold text-white">{status.analysisCache}</div>
            <div className="text-sm text-gray-400">Cached</div>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-5 h-5 text-orange-400" />
              <span className="text-xs text-gray-400">HEARTBEAT</span>
            </div>
            <div className="text-xl font-bold text-white">
              {status.lastHeartbeat ? Math.floor((Date.now() - status.lastHeartbeat) / 1000) : '--'}s
            </div>
            <div className="text-sm text-gray-400">Ago</div>
          </div>
        </div>
      )}

      {/* Analysis Controls */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-4">Quick Analysis</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <button
            onClick={() => runAnalysis('market')}
            disabled={!isServerAvailable || !isConnected || isAnalyzing}
            className="flex items-center space-x-2 px-4 py-3 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-800 disabled:opacity-50 rounded-lg transition-colors"
          >
            <TrendingUp className="w-4 h-4 text-green-400" />
            <span>Market Analysis</span>
          </button>
          
          <button
            onClick={() => runAnalysis('strategy')}
            disabled={!isServerAvailable || !isConnected || isAnalyzing}
            className="flex items-center space-x-2 px-4 py-3 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-800 disabled:opacity-50 rounded-lg transition-colors"
          >
            <Target className="w-4 h-4 text-blue-400" />
            <span>Strategy Review</span>
          </button>
          
          <button
            onClick={() => runAnalysis('risk')}
            disabled={!isServerAvailable || !isConnected || isAnalyzing}
            className="flex items-center space-x-2 px-4 py-3 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-800 disabled:opacity-50 rounded-lg transition-colors"
          >
            <Shield className="w-4 h-4 text-orange-400" />
            <span>Risk Analysis</span>
          </button>
          
          <button
            onClick={() => runAnalysis('portfolio')}
            disabled={!isServerAvailable || !isConnected || isAnalyzing}
            className="flex items-center space-x-2 px-4 py-3 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-800 disabled:opacity-50 rounded-lg transition-colors"
          >
            <BarChart3 className="w-4 h-4 text-purple-400" />
            <span>Portfolio Optimization</span>
          </button>
          
          <button
            onClick={() => runAnalysis('prediction')}
            disabled={!isServerAvailable || !isConnected || isAnalyzing}
            className="flex items-center space-x-2 px-4 py-3 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-800 disabled:opacity-50 rounded-lg transition-colors"
          >
            <Zap className="w-4 h-4 text-cyan-400" />
            <span>Price Prediction</span>
          </button>
          
          <button
            onClick={() => runAnalysis('patterns')}
            disabled={!isServerAvailable || !isConnected || isAnalyzing}
            className="flex items-center space-x-2 px-4 py-3 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-800 disabled:opacity-50 rounded-lg transition-colors"
          >
            <Activity className="w-4 h-4 text-pink-400" />
            <span>Pattern Detection</span>
          </button>
        </div>
      </div>

      {/* Recent Analysis Results */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Recent Analysis</h3>
          {lastUpdate > 0 && (
            <span className="text-sm text-gray-400">
              Last update: {new Date(lastUpdate).toLocaleTimeString()}
            </span>
          )}
        </div>
        
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {recentAnalysis.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Brain className="w-12 h-12 mx-auto mb-4 text-gray-600" />
              <p>No analysis results yet</p>
              <p className="text-sm">
                {!isServerAvailable 
                  ? "Start the Python Brain server to enable analysis"
                  : !isConnected 
                    ? "Waiting for connection to Python Brain server"
                    : "Run an analysis to see results here"
                }
              </p>
            </div>
          ) : (
            recentAnalysis.map((result, index) => (
              <div key={index} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {getAnalysisIcon(result.analysis_type)}
                    <span className="text-white font-medium">
                      {formatAnalysisType(result.analysis_type)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-400">
                    <Clock className="w-3 h-3" />
                    <span>{result.processing_time}ms</span>
                  </div>
                </div>
                
                <div className="text-sm text-gray-300 mb-2">
                  {result.result.error ? (
                    <span className="text-red-400">Error: {result.result.error}</span>
                  ) : (
                    <span>
                      Analysis completed successfully
                      {result.confidence && (
                        <span className="ml-2 text-blue-400">
                          (Confidence: {(result.confidence * 100).toFixed(1)}%)
                        </span>
                      )}
                    </span>
                  )}
                </div>
                
                <div className="text-xs text-gray-500">
                  {new Date(result.timestamp).toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Loading Indicator */}
      {isAnalyzing && (
        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center rounded-xl">
          <div className="flex items-center space-x-3 px-6 py-3 bg-gray-900 border border-gray-700 rounded-lg">
            <RefreshCw className="w-5 h-5 animate-spin text-blue-400" />
            <span className="text-white">Running Analysis...</span>
          </div>
        </div>
      )}
    </div>
  );
};