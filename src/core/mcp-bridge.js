const EventEmitter = require('events');
const WebSocket = require('ws');

class MCPBridge extends EventEmitter {
    constructor() {
        super();
        this.connections = new Map();
        this.servers = new Map();
        this.isInitialized = false;
        this.stats = {
            totalConnections: 0,
            activeConnections: 0,
            messagesProcessed: 0,
            lastActivity: new Date()
        };
        
        this.setupDefaultServers();
    }

    setupDefaultServers() {
        // Demo MCP servers for showcase
        this.servers.set('demo-server', {
            name: 'Demo Server',
            url: 'ws://localhost:3001/mcp',
            status: 'simulated',
            capabilities: ['tools', 'resources', 'prompts'],
            tools: [
                { name: 'calculate', description: 'Perform calculations' },
                { name: 'weather', description: 'Get weather information' },
                { name: 'translate', description: 'Translate text' }
            ]
        });

        this.servers.set('ai-assistant', {
            name: 'AI Assistant',
            url: 'ws://localhost:3002/mcp',
            status: 'simulated',
            capabilities: ['prompts', 'completion'],
            tools: [
                { name: 'chat', description: 'AI chat interface' },
                { name: 'analyze', description: 'Text analysis' }
            ]
        });

        this.servers.set('file-manager', {
            name: 'File Manager',
            url: 'ws://localhost:3003/mcp',
            status: 'simulated',
            capabilities: ['resources', 'file-operations'],
            tools: [
                { name: 'read-file', description: 'Read file contents' },
                { name: 'write-file', description: 'Write file contents' },
                { name: 'list-files', description: 'List directory contents' }
            ]
        });
    }

    async initialize() {
        console.log('🔗 Initializing MCP Bridge...');
        
        // Simulate connections to demo servers
        for (const [id, server] of this.servers) {
            try {
                await this.connectToServer(id, server);
                this.stats.totalConnections++;
                this.stats.activeConnections++;
            } catch (error) {
                console.warn(`⚠️ Could not connect to ${server.name}:`, error.message);
            }
        }

        this.isInitialized = true;
        this.startPeriodicTasks();
        console.log(`✅ MCP Bridge initialized with ${this.stats.activeConnections} connections`);
    }

    async connectToServer(id, server) {
        // Simulate connection for demo purposes
        if (server.status === 'simulated') {
            this.connections.set(id, {
                id,
                server,
                status: 'connected',
                lastPing: new Date(),
                messageCount: 0
            });
            
            console.log(`📡 Connected to ${server.name} (simulated)`);
            this.emit('server-connected', { id, server });
            return;
        }

        // Real WebSocket connection (for actual MCP servers)
        try {
            const ws = new WebSocket(server.url);
            
            ws.on('open', () => {
                this.connections.set(id, {
                    id,
                    server,
                    ws,
                    status: 'connected',
                    lastPing: new Date(),
                    messageCount: 0
                });
                
                console.log(`📡 Connected to ${server.name}`);
                this.emit('server-connected', { id, server });
            });

            ws.on('message', (data) => {
                this.handleMessage(id, data);
            });

            ws.on('close', () => {
                this.handleDisconnect(id);
            });

            ws.on('error', (error) => {
                console.error(`❌ Error with ${server.name}:`, error);
                this.handleDisconnect(id);
            });

        } catch (error) {
            throw new Error(`Failed to connect to ${server.name}: ${error.message}`);
        }
    }

    handleMessage(serverId, data) {
        try {
            const message = JSON.parse(data);
            const connection = this.connections.get(serverId);
            
            if (connection) {
                connection.messageCount++;
                connection.lastPing = new Date();
                this.stats.messagesProcessed++;
                this.stats.lastActivity = new Date();
            }

            this.emit('message', { serverId, message });
        } catch (error) {
            console.error(`❌ Error parsing message from ${serverId}:`, error);
        }
    }

    handleDisconnect(serverId) {
        const connection = this.connections.get(serverId);
        if (connection) {
            connection.status = 'disconnected';
            this.stats.activeConnections--;
            console.log(`🔌 Disconnected from ${connection.server.name}`);
            this.emit('server-disconnected', { id: serverId, server: connection.server });
        }
    }

    async sendMessage(serverId, message) {
        const connection = this.connections.get(serverId);
        if (!connection) {
            throw new Error(`No connection to server: ${serverId}`);
        }

        if (connection.status !== 'connected') {
            throw new Error(`Server ${serverId} is not connected`);
        }

        // Simulate response for demo servers
        if (connection.server.status === 'simulated') {
            return this.simulateResponse(message);
        }

        // Send to real WebSocket
        if (connection.ws) {
            connection.ws.send(JSON.stringify(message));
            return { status: 'sent', timestamp: new Date() };
        }
    }

    simulateResponse(message) {
        // Simulate MCP responses based on message type
        const responses = {
            'tools/list': {
                result: {
                    tools: [
                        { name: 'calculate', description: 'Perform mathematical calculations' },
                        { name: 'weather', description: 'Get current weather information' },
                        { name: 'translate', description: 'Translate text between languages' }
                    ]
                }
            },
            'tools/call': {
                result: {
                    content: [
                        {
                            type: 'text',
                            text: `Tool executed successfully: ${message.params?.name || 'unknown'}`
                        }
                    ]
                }
            },
            'resources/list': {
                result: {
                    resources: [
                        { uri: 'file://demo.txt', name: 'Demo File', mimeType: 'text/plain' },
                        { uri: 'http://example.com', name: 'Example Website', mimeType: 'text/html' }
                    ]
                }
            }
        };

        return responses[message.method] || {
            result: { message: 'Demo response', status: 'success' }
        };
    }

    startPeriodicTasks() {
        // Ping servers every 30 seconds
        setInterval(() => {
            this.pingServers();
        }, 30000);

        // Update stats every 10 seconds
        setInterval(() => {
            this.updateStats();
        }, 10000);
    }

    async pingServers() {
        for (const [id, connection] of this.connections) {
            if (connection.status === 'connected') {
                try {
                    await this.sendMessage(id, { method: 'ping' });
                } catch (error) {
                    console.warn(`⚠️ Ping failed for ${connection.server.name}`);
                }
            }
        }
    }

    updateStats() {
        // Simulate some activity for demo
        if (Math.random() > 0.7) {
            this.stats.messagesProcessed += Math.floor(Math.random() * 3);
            this.stats.lastActivity = new Date();
        }
    }

    getConnections() {
        return Array.from(this.connections.values()).map(conn => ({
            id: conn.id,
            name: conn.server.name,
            status: conn.status,
            capabilities: conn.server.capabilities,
            messageCount: conn.messageCount,
            lastPing: conn.lastPing
        }));
    }

    getStats() {
        return this.stats;
    }

    async close() {
        for (const connection of this.connections.values()) {
            if (connection.ws && connection.status === 'connected') {
                connection.ws.close();
            }
        }
        this.connections.clear();
        console.log('🔌 MCP Bridge closed');
    }
}

module.exports = MCPBridge;