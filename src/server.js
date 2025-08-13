const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const DiscordBot = require('./bot/discord-bot');
const MCPBridge = require('./core/mcp-bridge');
const WebController = require('./web/controller');
const DatabaseManager = require('./database/manager');

class DiscordEXServer {
    constructor() {
        this.app = express();
        this.server = http.createServer(this.app);
        this.io = socketIo(this.server, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"]
            }
        });
        
        this.port = process.env.PORT || 3000;
        this.isDemo = !process.env.DISCORD_TOKEN;
        
        this.setupMiddleware();
        this.setupRoutes();
        this.initializeComponents();
    }

    setupMiddleware() {
        this.app.use(helmet({
            contentSecurityPolicy: false,
            crossOriginEmbedderPolicy: false
        }));
        this.app.use(cors());
        this.app.use(morgan('combined'));
        this.app.use(express.json());
        this.app.use(express.static(path.join(__dirname, '../public')));
    }

    setupRoutes() {
        // Health check endpoint
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                mode: this.isDemo ? 'demo' : 'production',
                uptime: process.uptime()
            });
        });

        // Make services available to routes
        this.app.use((req, res, next) => {
            req.app.locals.discordBot = this.bot;
            req.app.locals.mcpBridge = this.mcpBridge;
            req.app.locals.database = this.db;
            next();
        });

        // API routes
        this.app.use('/api', require('./api/routes'));
        
        // Serve web interface
        this.app.get('*', (req, res) => {
            res.sendFile(path.join(__dirname, '../public/index.html'));
        });
    }

    async initializeComponents() {
        try {
            // Initialize database
            this.db = new DatabaseManager();
            await this.db.initialize();

            // Initialize MCP Bridge
            this.mcpBridge = new MCPBridge();
            await this.mcpBridge.initialize();

            // Initialize Discord Bot (demo or real)
            if (this.isDemo) {
                console.log('🚀 Starting in DEMO mode (no Discord token provided)');
                this.bot = new DiscordBot(null, true); // Demo mode
            } else {
                console.log('🤖 Starting with Discord integration');
                this.bot = new DiscordBot(process.env.DISCORD_TOKEN);
                await this.bot.start();
            }

            // Initialize Web Controller
            this.webController = new WebController(this.io, this.bot, this.mcpBridge, this.db);
            
            console.log('✅ All components initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize components:', error);
        }
    }

    start() {
        this.server.listen(this.port, () => {
            console.log(`
🚀 Discord EX Platform is running!
📡 Server: http://localhost:${this.port}
🌐 Mode: ${this.isDemo ? 'DEMO' : 'PRODUCTION'}
🎯 Features: Discord Bot + MCP Bridge + Web Interface

${this.isDemo ? '💡 Demo mode: Set DISCORD_TOKEN environment variable for Discord integration' : '🤖 Discord bot is connected and ready!'}

🌍 Deploy to web:
- Vercel: https://vercel.com/new/clone?repository-url=https://github.com/boxi-rgb/discord-ex-platform
- Render: https://render.com/
- Heroku: heroku create your-app-name

📖 Documentation: https://github.com/boxi-rgb/discord-ex-platform
            `);
        });
    }

    async stop() {
        if (this.bot) {
            await this.bot.stop();
        }
        if (this.mcpBridge) {
            await this.mcpBridge.close();
        }
        if (this.db) {
            await this.db.close();
        }
        this.server.close();
    }
}

// Create and start server
const server = new DiscordEXServer();
server.start();

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('Received SIGTERM, shutting down gracefully...');
    await server.stop();
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('Received SIGINT, shutting down gracefully...');
    await server.stop();
    process.exit(0);
});

module.exports = DiscordEXServer;