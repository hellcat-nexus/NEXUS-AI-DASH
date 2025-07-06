export interface PythonAnalysisRequest {
  type: 'market_analysis' | 'strategy_analysis' | 'risk_analysis' | 'portfolio_optimization' | 'price_prediction' | 'pattern_detection' | 'strategy_backtest';
  data: any;
  priority?: 'low' | 'medium' | 'high';
  timeout?: number;
}

export interface PythonAnalysisResult {
  analysis_type: string;
  result: any;
  timestamp: string;
  processing_time: number;
  confidence?: number;
}

export interface PythonBrainStatus {
  pythonReady: boolean;
  connectedClients: number;
  activeStreams: number;
  lastHeartbeat: number | null;
  analysisCache: number;
}

export class PythonBrainClient {
  private static instance: PythonBrainClient;
  private websocket: WebSocket | null = null;
  private baseUrl: string = 'http://localhost:5000';
  private wsUrl: string = 'ws://localhost:5000';
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 3;
  private reconnectDelay: number = 5000;
  private pendingRequests: Map<string, any> = new Map();
  private subscribers: Map<string, Function[]> = new Map();
  private analysisCache: Map<string, PythonAnalysisResult> = new Map();
  private connectionTimeout: NodeJS.Timeout | null = null;
  private serverCheckInterval: NodeJS.Timeout | null = null;
  private isServerAvailable: boolean = false;

  static getInstance(): PythonBrainClient {
    if (!PythonBrainClient.instance) {
      PythonBrainClient.instance = new PythonBrainClient();
    }
    return PythonBrainClient.instance;
  }

  constructor() {
    // Check server availability first, then attempt connection
    this.checkServerAvailability();
    
    // Set up periodic server availability checks
    this.serverCheckInterval = setInterval(() => {
      this.checkServerAvailability();
    }, 10000); // Check every 10 seconds
  }

  private async checkServerAvailability(): Promise<void> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
        }
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        if (!this.isServerAvailable) {
          console.log('🐍 Python Brain server is now available');
          this.isServerAvailable = true;
          // If server just became available and we're not connected, try to connect
          if (!this.isConnected) {
            this.connect();
          }
        }
      } else {
        this.handleServerUnavailable();
      }
    } catch (error) {
      this.handleServerUnavailable();
    }
  }

  private handleServerUnavailable(): void {
    if (this.isServerAvailable) {
      console.log('🐍 Python Brain server is no longer available');
      this.isServerAvailable = false;
      this.isConnected = false;
      if (this.websocket) {
        this.websocket.close();
        this.websocket = null;
      }
      this.emitConnectionEvent('server_unavailable');
    }
  }

  private connect() {
    // Don't attempt connection if server is not available
    if (!this.isServerAvailable) {
      console.log('🐍 Skipping connection attempt - server not available');
      return;
    }

    // Clear any existing connection timeout
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
    }

    try {
      console.log('🐍 Attempting to connect to Python Brain at:', this.wsUrl);
      this.websocket = new WebSocket(this.wsUrl);
      
      // Set a connection timeout
      this.connectionTimeout = setTimeout(() => {
        if (this.websocket && this.websocket.readyState === WebSocket.CONNECTING) {
          console.log('🐍 Connection timeout, closing WebSocket');
          this.websocket.close();
        }
      }, 5000);

      this.websocket.onopen = () => {
        console.log('🐍 Connected to Python Brain');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        if (this.connectionTimeout) {
          clearTimeout(this.connectionTimeout);
          this.connectionTimeout = null;
        }
        this.emitConnectionEvent('connected');
      };

      this.websocket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('🐍 Error parsing message:', error);
        }
      };

      this.websocket.onclose = (event) => {
        console.log('🐍 Disconnected from Python Brain', event.code, event.reason);
        this.isConnected = false;
        if (this.connectionTimeout) {
          clearTimeout(this.connectionTimeout);
          this.connectionTimeout = null;
        }
        this.emitConnectionEvent('disconnected');
        this.handleReconnect();
      };

      this.websocket.onerror = (error) => {
        console.error('🐍 WebSocket error:', error);
        if (this.connectionTimeout) {
          clearTimeout(this.connectionTimeout);
          this.connectionTimeout = null;
        }
        this.emitConnectionEvent('error');
      };

    } catch (error) {
      console.error('🐍 Failed to connect to Python Brain:', error);
      if (this.connectionTimeout) {
        clearTimeout(this.connectionTimeout);
        this.connectionTimeout = null;
      }
      this.handleReconnect();
    }
  }

  private handleReconnect() {
    // Only attempt reconnect if server is available
    if (!this.isServerAvailable) {
      console.log('🐍 Skipping reconnect - server not available');
      return;
    }

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay;
      console.log(`🐍 Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms...`);
      
      setTimeout(() => {
        this.connect();
      }, delay);
    } else {
      console.error('🐍 Max reconnection attempts reached. Will retry when server becomes available.');
      this.emitConnectionEvent('failed');
      // Reset attempts so we can try again when server becomes available
      this.reconnectAttempts = 0;
    }
  }

  private handleMessage(message: any) {
    switch (message.type) {
      case 'connection_status':
        console.log('🐍 Python Brain status:', message);
        break;
        
      case 'analysis_result':
        this.handleAnalysisResult(message);
        break;
        
      case 'analysis_complete':
        this.handleAnalysisComplete(message);
        break;
        
      case 'auto_analysis':
        this.handleAutoAnalysis(message);
        break;
        
      case 'data_update':
        this.handleDataUpdate(message);
        break;
        
      case 'python_status':
        this.emitStatusEvent(message);
        break;
        
      default:
        console.log('🐍 Unknown message type:', message.type);
    }
  }

  private handleAnalysisResult(message: any) {
    const result: PythonAnalysisResult = {
      analysis_type: message.analysis_type,
      result: message.result,
      timestamp: message.timestamp,
      processing_time: message.processing_time || 0,
      confidence: message.result.confidence
    };

    // Cache the result
    this.analysisCache.set(`${result.analysis_type}_${Date.now()}`, result);

    // Notify subscribers
    this.notifySubscribers('analysis_result', result);

    // Emit custom event
    window.dispatchEvent(new CustomEvent('pythonAnalysisResult', {
      detail: result
    }));
  }

  private handleAnalysisComplete(message: any) {
    this.notifySubscribers('analysis_complete', message);
  }

  private handleAutoAnalysis(message: any) {
    this.notifySubscribers('auto_analysis', message);
    
    // Emit custom event for auto analysis
    window.dispatchEvent(new CustomEvent('pythonAutoAnalysis', {
      detail: message
    }));
  }

  private handleDataUpdate(message: any) {
    this.notifySubscribers('data_update', message);
  }

  private notifySubscribers(eventType: string, data: any) {
    const subscribers = this.subscribers.get(eventType) || [];
    subscribers.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('🐍 Error in subscriber callback:', error);
      }
    });
  }

  private emitConnectionEvent(status: string) {
    window.dispatchEvent(new CustomEvent('pythonBrainConnection', {
      detail: { status, isConnected: this.isConnected, serverAvailable: this.isServerAvailable }
    }));
  }

  private emitStatusEvent(status: any) {
    window.dispatchEvent(new CustomEvent('pythonBrainStatus', {
      detail: status
    }));
  }

  // Public API Methods

  public async analyzeMarket(marketData: any): Promise<PythonAnalysisResult> {
    return this.requestAnalysis({
      type: 'market_analysis',
      data: { market_data: marketData }
    });
  }

  public async analyzeStrategy(strategies: any[], performance: any): Promise<PythonAnalysisResult> {
    return this.requestAnalysis({
      type: 'strategy_analysis',
      data: { strategies, performance }
    });
  }

  public async analyzeRisk(portfolio: any, positions: any[]): Promise<PythonAnalysisResult> {
    return this.requestAnalysis({
      type: 'risk_analysis',
      data: { portfolio, positions }
    });
  }

  public async optimizePortfolio(positions: any[], targetReturn: number, riskTolerance: string): Promise<PythonAnalysisResult> {
    return this.requestAnalysis({
      type: 'portfolio_optimization',
      data: { positions, target_return: targetReturn, risk_tolerance: riskTolerance }
    });
  }

  public async predictPrice(marketData: any[], horizon: number = 24): Promise<PythonAnalysisResult> {
    return this.requestAnalysis({
      type: 'price_prediction',
      data: { market_data: marketData, horizon }
    });
  }

  public async detectPatterns(marketData: any[]): Promise<PythonAnalysisResult> {
    return this.requestAnalysis({
      type: 'pattern_detection',
      data: { market_data: marketData }
    });
  }

  public async backtestStrategy(strategy: any, marketData: any[]): Promise<PythonAnalysisResult> {
    return this.requestAnalysis({
      type: 'strategy_backtest',
      data: { strategy, market_data: marketData }
    });
  }

  private async requestAnalysis(request: PythonAnalysisRequest): Promise<PythonAnalysisResult> {
    if (!this.isServerAvailable) {
      throw new Error('Python Brain server is not available. Please ensure the server is running on port 5000.');
    }

    if (!this.isConnected) {
      throw new Error('Python Brain not connected. Please wait for connection to be established.');
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(`${this.baseUrl}/api/analyze/${request.type.replace('_analysis', '').replace('_', '/')}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request.data),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Analysis request failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      return result as PythonAnalysisResult;
    } catch (error) {
      console.error('🐍 Analysis request error:', error);
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Analysis request timed out. The Python Brain server may be overloaded.');
        }
        throw error;
      }
      throw new Error('Unknown error occurred during analysis request');
    }
  }

  public async getStatus(): Promise<PythonBrainStatus> {
    if (!this.isServerAvailable) {
      throw new Error('Python Brain server is not available. Please ensure it is running on port 5000.');
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${this.baseUrl}/health`, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Status request failed: ${response.status} ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('🐍 Status request error:', error);
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Status request timed out. The Python Brain server may not be responding.');
        }
        throw error;
      }
      throw new Error('Python Brain server is not accessible. Please ensure it is running on port 5000.');
    }
  }

  public subscribe(eventType: string, callback: Function): () => void {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, []);
    }
    this.subscribers.get(eventType)!.push(callback);

    // Return unsubscribe function
    return () => {
      const subscribers = this.subscribers.get(eventType);
      if (subscribers) {
        const index = subscribers.indexOf(callback);
        if (index > -1) {
          subscribers.splice(index, 1);
        }
      }
    };
  }

  public subscribeToDataStream(dataTypes: string[]): void {
    if (this.websocket && this.isConnected) {
      this.websocket.send(JSON.stringify({
        type: 'subscribe',
        dataTypes: dataTypes
      }));
    }
  }

  public distributeData(data: any): void {
    if (!this.isServerAvailable) {
      console.warn('🐍 Cannot distribute data: Python Brain server not available');
      return;
    }

    if (!this.isConnected) {
      console.warn('🐍 Cannot distribute data: Python Brain not connected');
      return;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    fetch(`${this.baseUrl}/api/data/distribute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
      signal: controller.signal
    }).then(() => {
      clearTimeout(timeoutId);
    }).catch(error => {
      clearTimeout(timeoutId);
      console.error('🐍 Data distribution error:', error);
    });
  }

  public getConnectionStatus(): boolean {
    return this.isConnected;
  }

  public getServerAvailability(): boolean {
    return this.isServerAvailable;
  }

  public getCachedAnalysis(analysisType: string): PythonAnalysisResult | null {
    // Find the most recent analysis of the specified type
    const entries = Array.from(this.analysisCache.entries());
    const filtered = entries.filter(([key]) => key.startsWith(analysisType));
    
    if (filtered.length === 0) return null;
    
    // Sort by timestamp (embedded in key) and return the most recent
    const sorted = filtered.sort(([a], [b]) => {
      const timeA = parseInt(a.split('_').pop() || '0');
      const timeB = parseInt(b.split('_').pop() || '0');
      return timeB - timeA;
    });
    
    return sorted[0][1];
  }

  public clearCache(): void {
    this.analysisCache.clear();
  }

  public disconnect(): void {
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }
    if (this.serverCheckInterval) {
      clearInterval(this.serverCheckInterval);
      this.serverCheckInterval = null;
    }
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }
    this.isConnected = false;
    this.isServerAvailable = false;
  }
}

// Export singleton instance
export const pythonBrainClient = PythonBrainClient.getInstance();