const express = require('express');
const WebSocket = require('ws');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

class NexusNT8Bridge {
    constructor() {
        this.app = express();
        this.server = null;
        this.wss = null;
        this.port = 4000;
        
        // Data storage
        this.latestData = null;
        this.dataHistory = [];
        this.maxHistorySize = 1000;
        
        // Connection tracking
        this.connectedClients = new Set();
        this.nt8Connected = false;
        this.lastNT8Heartbeat = null;
        
        this.setupMiddleware();
        this.setupRoutes();
        this.setupWebSocket();
    }

    setupMiddleware() {
        this.app.use(cors({
            origin: ['http://localhost:3000', 'http://localhost:5173'],
            credentials: true
        }));
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true }));
        
        // Request logging
        this.app.use((req, res, next) => {
            console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
            next();
        });
    }

    setupRoutes() {
        // Health check endpoint
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                nt8Connected: this.nt8Connected,
                connectedClients: this.connectedClients.size,
                lastDataReceived: this.latestData?.timestamp || null
            });
        });

        // Main data endpoint for NinjaTrader
        this.app.post('/api/dashboard-data', (req, res) => {
            try {
                const data = req.body;
                
                // Validate required fields
                if (!data.timestamp) {
                    return res.status(400).json({ error: 'Missing timestamp' });
                }

                // Update connection status
                this.nt8Connected = true;
                this.lastNT8Heartbeat = Date.now();

                // Store latest data
                this.latestData = {
                    ...data,
                    receivedAt: new Date().toISOString(),
                    source: 'NinjaTrader8'
                };

                // Add to history
                this.dataHistory.push(this.latestData);
                if (this.dataHistory.length > this.maxHistorySize) {
                    this.dataHistory.shift();
                }

                // Broadcast to all WebSocket clients
                this.broadcastToClients(this.latestData);

                // Log key metrics
                console.log(`NT8 Data: Price=${data.market?.currentPrice}, Volume=${data.market?.volume}, Signals=${data.signals?.activeCount}`);

                res.json({ 
                    status: 'success',
                    timestamp: new Date().toISOString(),
                    clientsBroadcast: this.connectedClients.size
                });

            } catch (error) {
                console.error('Error processing NT8 data:', error);
                res.status(500).json({ error: 'Internal server error' });
            }
        });

        // Get latest data endpoint for dashboard
        this.app.get('/api/dashboard-data', (req, res) => {
            if (!this.latestData) {
                return res.json({
                    message: 'No data available',
                    nt8Connected: this.nt8Connected
                });
            }

            res.json(this.latestData);
        });

        // Historical data endpoint
        this.app.get('/api/dashboard-data/history', (req, res) => {
            const limit = parseInt(req.query.limit) || 100;
            const offset = parseInt(req.query.offset) || 0;
            
            const historySlice = this.dataHistory
                .slice(-limit - offset, -offset || undefined)
                .reverse();

            res.json({
                data: historySlice,
                total: this.dataHistory.length,
                limit,
                offset
            });
        });

        // Strategy control endpoints
        this.app.post('/api/strategies/:strategyName/toggle', (req, res) => {
            const { strategyName } = req.params;
            const { enabled } = req.body;

            // This would typically send a command back to NT8
            // For now, we'll just acknowledge the request
            console.log(`Strategy ${strategyName} ${enabled ? 'enabled' : 'disabled'}`);
            
            res.json({
                strategy: strategyName,
                enabled,
                timestamp: new Date().toISOString()
            });
        });

        // Export data endpoint
        this.app.get('/api/export/csv', (req, res) => {
            try {
                const csvData = this.generateCSV();
                res.setHeader('Content-Type', 'text/csv');
                res.setHeader('Content-Disposition', 'attachment; filename=nexus_data.csv');
                res.send(csvData);
            } catch (error) {
                console.error('Error generating CSV:', error);
                res.status(500).json({ error: 'Failed to generate CSV' });
            }
        });

        // Configuration endpoints
        this.app.get('/api/config', (req, res) => {
            res.json({
                maxHistorySize: this.maxHistorySize,
                port: this.port,
                version: '5.0.1'
            });
        });

        this.app.post('/api/config', (req, res) => {
            const { maxHistorySize } = req.body;
            
            if (maxHistorySize && maxHistorySize > 0) {
                this.maxHistorySize = maxHistorySize;
                
                // Trim history if needed
                if (this.dataHistory.length > this.maxHistorySize) {
                    this.dataHistory = this.dataHistory.slice(-this.maxHistorySize);
                }
            }

            res.json({ message: 'Configuration updated' });
        });
    }

    setupWebSocket() {
        this.server = require('http').createServer(this.app);
        this.wss = new WebSocket.Server({ server: this.server });

        this.wss.on('connection', (ws, req) => {
            const clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            this.connectedClients.add(clientId);
            
            console.log(`WebSocket client connected: ${clientId} (Total: ${this.connectedClients.size})`);

            // Send latest data immediately
            if (this.latestData) {
                ws.send(JSON.stringify(this.latestData));
            }

            // Send connection status
            ws.send(JSON.stringify({
                type: 'connection_status',
                clientId,
                nt8Connected: this.nt8Connected,
                timestamp: new Date().toISOString()
            }));

            ws.on('message', (message) => {
                try {
                    const data = JSON.parse(message);
                    this.handleWebSocketMessage(ws, data, clientId);
                } catch (error) {
                    console.error('Invalid WebSocket message:', error);
                }
            });

            ws.on('close', () => {
                this.connectedClients.delete(clientId);
                console.log(`WebSocket client disconnected: ${clientId} (Total: ${this.connectedClients.size})`);
            });

            ws.on('error', (error) => {
                console.error(`WebSocket error for ${clientId}:`, error);
                this.connectedClients.delete(clientId);
            });
        });
    }

    handleWebSocketMessage(ws, data, clientId) {
        switch (data.type) {
            case 'ping':
                ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
                break;
                
            case 'subscribe':
                // Handle subscription to specific data streams
                console.log(`Client ${clientId} subscribed to: ${data.streams}`);
                break;
                
            case 'strategy_command':
                // Forward strategy commands to NT8 (if connected)
                console.log(`Strategy command from ${clientId}:`, data);
                break;
                
            default:
                console.log(`Unknown message type from ${clientId}:`, data.type);
        }
    }

    broadcastToClients(data) {
        const message = JSON.stringify(data);
        let successCount = 0;
        let errorCount = 0;

        this.wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                try {
                    client.send(message);
                    successCount++;
                } catch (error) {
                    console.error('Error broadcasting to client:', error);
                    errorCount++;
                }
            }
        });

        if (errorCount > 0) {
            console.log(`Broadcast complete: ${successCount} success, ${errorCount} errors`);
        }
    }

    generateCSV() {
        if (this.dataHistory.length === 0) {
            return 'No data available';
        }

        const headers = [
            'timestamp',
            'currentPrice',
            'volume',
            'cumulativeDelta',
            'bidVolume',
            'askVolume',
            'dailyPnL',
            'portfolioHeat',
            'activeSignals',
            'longSignals',
            'shortSignals',
            'totalConfidence',
            'mqScore',
            'marketRegime'
        ];

        const rows = this.dataHistory.map(data => [
            data.timestamp,
            data.market?.currentPrice || '',
            data.market?.volume || '',
            data.market?.cumulativeDelta || '',
            data.orderFlow?.bidVolume || '',
            data.orderFlow?.askVolume || '',
            data.performance?.dailyPnL || '',
            data.performance?.portfolioHeat || '',
            data.signals?.activeCount || '',
            data.signals?.longSignals || '',
            data.signals?.shortSignals || '',
            data.signals?.totalConfidence || '',
            data.mqscore?.OverallScore || '',
            data.mqscore?.Regime || ''
        ]);

        return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    }

    startConnectionMonitor() {
        setInterval(() => {
            const now = Date.now();
            
            // Check NT8 connection (consider disconnected if no data for 30 seconds)
            if (this.lastNT8Heartbeat && (now - this.lastNT8Heartbeat) > 30000) {
                if (this.nt8Connected) {
                    console.log('NinjaTrader 8 connection lost');
                    this.nt8Connected = false;
                    
                    // Notify all clients
                    this.broadcastToClients({
                        type: 'connection_status',
                        nt8Connected: false,
                        timestamp: new Date().toISOString()
                    });
                }
            }
        }, 5000); // Check every 5 seconds
    }

    start() {
        this.server.listen(this.port, () => {
            console.log(`
╔══════════════════════════════════════════════════════════════╗
║                    NEXUS V5.0 NT8 Bridge                    ║
║                                                              ║
║  🚀 Server running on http://localhost:${this.port}                ║
║  📡 WebSocket server active                                  ║
║  🔗 Ready for NinjaTrader 8 connection                      ║
║                                                              ║
║  Endpoints:                                                  ║
║  • POST /api/dashboard-data (NT8 data input)               ║
║  • GET  /api/dashboard-data (Latest data)                  ║
║  • GET  /health (Health check)                             ║
║  • WS   / (WebSocket connection)                            ║
╚══════════════════════════════════════════════════════════════╝
            `);
            
            this.startConnectionMonitor();
        });

        // Graceful shutdown
        process.on('SIGINT', () => {
            console.log('\nShutting down NEXUS NT8 Bridge...');
            this.server.close(() => {
                console.log('Server closed');
                process.exit(0);
            });
        });
    }
}

// Start the bridge
const bridge = new NexusNT8Bridge();
bridge.start();

module.exports = NexusNT8Bridge;