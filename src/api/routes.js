const express = require('express');
const router = express.Router();

// Middleware to add request logging
router.use((req, res, next) => {
    console.log(`🌐 API ${req.method} ${req.path}`);
    next();
});

// Health check
router.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage()
    });
});

// Platform info
router.get('/info', (req, res) => {
    res.json({
        name: 'Discord EX Platform',
        version: '1.0.0',
        description: 'Advanced Discord MCP Integration Platform',
        features: [
            'Discord Bot Integration',
            'MCP Bridge',
            'Web Interface',
            'Real-time Monitoring',
            'Database Logging'
        ],
        endpoints: {
            health: '/api/health',
            info: '/api/info',
            bot: '/api/bot',
            mcp: '/api/mcp',
            logs: '/api/logs'
        }
    });
});

// Bot status and stats
router.get('/bot/status', (req, res) => {
    try {
        const bot = req.app.locals.discordBot;
        if (!bot) {
            return res.status(503).json({ error: 'Bot not available' });
        }

        res.json({
            connected: bot.isConnected(),
            demoMode: bot.demoMode,
            stats: bot.getStats()
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/bot/stats', async (req, res) => {
    try {
        const bot = req.app.locals.discordBot;
        const db = req.app.locals.database;
        
        if (!bot || !db) {
            return res.status(503).json({ error: 'Services not available' });
        }

        const currentStats = bot.getStats();
        const historicalStats = await db.getBotStats(100);
        
        res.json({
            current: currentStats,
            historical: historicalStats
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// MCP Bridge status
router.get('/mcp/status', (req, res) => {
    try {
        const mcpBridge = req.app.locals.mcpBridge;
        if (!mcpBridge) {
            return res.status(503).json({ error: 'MCP Bridge not available' });
        }

        res.json({
            connections: mcpBridge.getConnections(),
            stats: mcpBridge.getStats()
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/mcp/connections', async (req, res) => {
    try {
        const mcpBridge = req.app.locals.mcpBridge;
        const db = req.app.locals.database;
        
        if (!mcpBridge || !db) {
            return res.status(503).json({ error: 'Services not available' });
        }

        const liveConnections = mcpBridge.getConnections();
        const storedConnections = await db.getMCPConnections();
        
        res.json({
            live: liveConnections,
            stored: storedConnections
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Execute MCP call
router.post('/mcp/call', async (req, res) => {
    try {
        const mcpBridge = req.app.locals.mcpBridge;
        const db = req.app.locals.database;
        
        if (!mcpBridge) {
            return res.status(503).json({ error: 'MCP Bridge not available' });
        }

        const { serverId, method, params = {} } = req.body;
        
        if (!serverId || !method) {
            return res.status(400).json({ error: 'serverId and method are required' });
        }

        const result = await mcpBridge.sendMessage(serverId, { method, params });
        
        // Log the call
        if (db) {
            await db.logActivity(
                'mcp-call',
                'api',
                `MCP call: ${method}`,
                { serverId, method, params, result }
            );
        }
        
        res.json({ result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Activity logs
router.get('/logs', async (req, res) => {
    try {
        const db = req.app.locals.database;
        if (!db) {
            return res.status(503).json({ error: 'Database not available' });
        }

        const { limit = 50, type } = req.query;
        const logs = await db.getActivityLogs(parseInt(limit), type || null);
        
        res.json({ logs });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// System information
router.get('/system', (req, res) => {
    res.json({
        platform: process.platform,
        arch: process.arch,
        nodeVersion: process.version,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        pid: process.pid,
        environment: process.env.NODE_ENV || 'development'
    });
});

// Configuration
router.get('/config', async (req, res) => {
    try {
        const db = req.app.locals.database;
        if (!db) {
            return res.status(503).json({ error: 'Database not available' });
        }

        const configs = {
            demoMode: await db.getConfig('demo_mode'),
            platformName: await db.getConfig('platform_name'),
            version: await db.getConfig('version'),
            maxConnections: await db.getConfig('max_connections'),
            autoReconnect: await db.getConfig('auto_reconnect')
        };
        
        res.json(configs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/config/:key', async (req, res) => {
    try {
        const db = req.app.locals.database;
        if (!db) {
            return res.status(503).json({ error: 'Database not available' });
        }

        const { key } = req.params;
        const { value, type = 'string' } = req.body;
        
        if (value === undefined) {
            return res.status(400).json({ error: 'value is required' });
        }

        await db.setConfig(key, value, type);
        
        res.json({ success: true, key, value, type });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Demo data endpoints
router.get('/demo/activity', (req, res) => {
    const demoData = {
        realtimeStats: {
            botMessages: Math.floor(Math.random() * 1000) + 500,
            mcpCalls: Math.floor(Math.random() * 200) + 100,
            webClients: Math.floor(Math.random() * 10) + 1,
            serverUptime: process.uptime()
        },
        chartData: Array.from({ length: 24 }, (_, i) => ({
            hour: i,
            messages: Math.floor(Math.random() * 100) + 20,
            commands: Math.floor(Math.random() * 20) + 5,
            mcpCalls: Math.floor(Math.random() * 30) + 10
        }))
    };
    
    res.json(demoData);
});

module.exports = router;