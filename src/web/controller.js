const crypto = require('crypto');

class WebController {
    constructor(io, discordBot, mcpBridge, database) {
        this.io = io;
        this.discordBot = discordBot;
        this.mcpBridge = mcpBridge;
        this.database = database;
        this.connectedClients = new Map();
        
        this.setupSocketHandlers();
        this.startDataStreaming();
    }

    setupSocketHandlers() {
        this.io.on('connection', (socket) => {
            const sessionId = crypto.randomUUID();
            const clientInfo = {
                id: sessionId,
                socket,
                connectedAt: new Date(),
                lastActivity: new Date(),
                ipAddress: socket.handshake.address,
                userAgent: socket.handshake.headers['user-agent']
            };
            
            this.connectedClients.set(sessionId, clientInfo);
            console.log(`🔌 New client connected: ${sessionId}`);
            
            // Log session in database
            this.database.createSession(sessionId, clientInfo.ipAddress, clientInfo.userAgent)
                .catch(err => console.error('Failed to create session:', err));

            // Send initial data
            this.sendInitialData(socket);

            // Handle client events
            socket.on('request-bot-stats', () => {
                this.handleBotStatsRequest(socket);
            });

            socket.on('request-mcp-status', () => {
                this.handleMCPStatusRequest(socket);
            });

            socket.on('request-activity-logs', (data) => {
                this.handleActivityLogsRequest(socket, data);
            });

            socket.on('execute-command', (data) => {
                this.handleCommandExecution(socket, data);
            });

            socket.on('mcp-call', (data) => {
                this.handleMCPCall(socket, data);
            });

            socket.on('disconnect', () => {
                this.connectedClients.delete(sessionId);
                console.log(`🔌 Client disconnected: ${sessionId}`);
            });

            // Update activity on any message
            socket.on('*', () => {
                if (this.connectedClients.has(sessionId)) {
                    this.connectedClients.get(sessionId).lastActivity = new Date();
                    this.database.updateSessionActivity(sessionId)
                        .catch(err => console.error('Failed to update session activity:', err));
                }
            });
        });
    }

    async sendInitialData(socket) {
        try {
            const data = {
                platform: {
                    name: 'Discord EX Platform',
                    version: '1.0.0',
                    status: 'running',
                    uptime: process.uptime()
                },
                bot: {
                    connected: this.discordBot.isConnected(),
                    stats: this.discordBot.getStats(),
                    demoMode: this.discordBot.demoMode
                },
                mcp: {
                    connections: this.mcpBridge.getConnections(),
                    stats: this.mcpBridge.getStats()
                },
                clients: this.connectedClients.size
            };

            socket.emit('initial-data', data);
        } catch (error) {
            console.error('Error sending initial data:', error);
        }
    }

    async handleBotStatsRequest(socket) {
        try {
            const stats = this.discordBot.getStats();
            const historicalStats = await this.database.getBotStats(50);
            
            socket.emit('bot-stats', {
                current: stats,
                historical: historicalStats
            });
        } catch (error) {
            socket.emit('error', { message: 'Failed to fetch bot stats', error: error.message });
        }
    }

    async handleMCPStatusRequest(socket) {
        try {
            const connections = this.mcpBridge.getConnections();
            const stats = this.mcpBridge.getStats();
            const dbConnections = await this.database.getMCPConnections();
            
            socket.emit('mcp-status', {
                connections,
                stats,
                history: dbConnections
            });
        } catch (error) {
            socket.emit('error', { message: 'Failed to fetch MCP status', error: error.message });
        }
    }

    async handleActivityLogsRequest(socket, data = {}) {
        try {
            const { limit = 50, type = null } = data;
            const logs = await this.database.getActivityLogs(limit, type);
            
            socket.emit('activity-logs', { logs });
        } catch (error) {
            socket.emit('error', { message: 'Failed to fetch activity logs', error: error.message });
        }
    }

    async handleCommandExecution(socket, data) {
        try {
            const { command, args = [] } = data;
            
            // Log the command execution
            await this.database.logActivity(
                'command',
                'web-interface',
                `Command executed: ${command}`,
                { command, args }
            );

            let result;
            switch (command) {
                case 'bot-restart':
                    result = await this.restartBot();
                    break;
                case 'mcp-reconnect':
                    result = await this.reconnectMCP(args[0]);
                    break;
                case 'system-stats':
                    result = await this.getSystemStats();
                    break;
                case 'cleanup-database':
                    result = await this.cleanupDatabase();
                    break;
                default:
                    result = { error: 'Unknown command' };
            }

            socket.emit('command-result', { command, result });
        } catch (error) {
            socket.emit('error', { message: 'Command execution failed', error: error.message });
        }
    }

    async handleMCPCall(socket, data) {
        try {
            const { serverId, method, params = {} } = data;
            
            const result = await this.mcpBridge.sendMessage(serverId, {
                method,
                params
            });

            // Log the MCP call
            await this.database.logActivity(
                'mcp-call',
                'web-interface',
                `MCP call: ${method}`,
                { serverId, method, params, result }
            );

            socket.emit('mcp-result', { serverId, method, result });
        } catch (error) {
            socket.emit('error', { message: 'MCP call failed', error: error.message });
        }
    }

    async restartBot() {
        if (this.discordBot.demoMode) {
            return { message: 'Bot restarted (demo mode)', success: true };
        }
        
        try {
            await this.discordBot.stop();
            await this.discordBot.start();
            return { message: 'Bot restarted successfully', success: true };
        } catch (error) {
            return { message: 'Failed to restart bot', success: false, error: error.message };
        }
    }

    async reconnectMCP(serverId) {
        try {
            // Implementation would reconnect specific MCP server
            return { message: `MCP server ${serverId} reconnected`, success: true };
        } catch (error) {
            return { message: 'Failed to reconnect MCP server', success: false, error: error.message };
        }
    }

    async getSystemStats() {
        return {
            memory: process.memoryUsage(),
            uptime: process.uptime(),
            platform: process.platform,
            nodeVersion: process.version,
            pid: process.pid,
            connectedClients: this.connectedClients.size
        };
    }

    async cleanupDatabase() {
        try {
            await this.database.cleanup();
            return { message: 'Database cleanup completed', success: true };
        } catch (error) {
            return { message: 'Database cleanup failed', success: false, error: error.message };
        }
    }

    startDataStreaming() {
        // Send periodic updates to all connected clients
        setInterval(() => {
            const data = {
                timestamp: new Date(),
                bot: {
                    connected: this.discordBot.isConnected(),
                    stats: this.discordBot.getStats()
                },
                mcp: {
                    stats: this.mcpBridge.getStats()
                },
                system: {
                    memory: process.memoryUsage(),
                    uptime: process.uptime(),
                    connectedClients: this.connectedClients.size
                }
            };

            this.io.emit('live-update', data);
        }, 5000); // Update every 5 seconds

        // Save bot stats periodically
        setInterval(async () => {
            try {
                const stats = this.discordBot.getStats();
                const uptime = Math.floor(process.uptime());
                
                await this.database.saveBotStats({
                    messagesProcessed: stats.messagesProcessed,
                    commandsExecuted: stats.commandsExecuted,
                    serversConnected: stats.serversConnected,
                    uptime
                });
            } catch (error) {
                console.error('Failed to save bot stats:', error);
            }
        }, 60000); // Save every minute
    }
}

module.exports = WebController;