const { Client, Events, GatewayIntentBits, Collection, EmbedBuilder } = require('discord.js');

class DiscordBot {
    constructor(token, demoMode = false) {
        this.token = token;
        this.demoMode = demoMode;
        this.isReady = false;
        this.stats = {
            messagesProcessed: 0,
            commandsExecuted: 0,
            serversConnected: 0,
            startTime: new Date()
        };

        if (!demoMode && token) {
            this.client = new Client({
                intents: [
                    GatewayIntentBits.Guilds,
                    GatewayIntentBits.GuildMessages,
                    GatewayIntentBits.MessageContent,
                    GatewayIntentBits.GuildMembers
                ]
            });
            this.commands = new Collection();
            this.setupEventHandlers();
        } else {
            console.log('🎭 Discord bot running in DEMO mode');
            this.setupDemoMode();
        }
    }

    setupDemoMode() {
        this.isReady = true;
        this.stats.serversConnected = 1; // Simulate connection
        
        // Simulate periodic activity
        setInterval(() => {
            this.stats.messagesProcessed += Math.floor(Math.random() * 5);
            if (Math.random() > 0.7) {
                this.stats.commandsExecuted++;
            }
        }, 10000);
    }

    setupEventHandlers() {
        this.client.once(Events.ClientReady, (readyClient) => {
            console.log(`✅ Discord bot ready! Logged in as ${readyClient.user.tag}`);
            this.isReady = true;
            this.stats.serversConnected = readyClient.guilds.cache.size;
        });

        this.client.on(Events.MessageCreate, async (message) => {
            if (message.author.bot) return;
            
            this.stats.messagesProcessed++;
            
            if (message.content.startsWith('!')) {
                await this.handleCommand(message);
            }
        });

        this.client.on(Events.GuildCreate, (guild) => {
            this.stats.serversConnected++;
            console.log(`🎉 Joined new server: ${guild.name}`);
        });

        this.client.on(Events.GuildDelete, (guild) => {
            this.stats.serversConnected--;
            console.log(`👋 Left server: ${guild.name}`);
        });
    }

    async handleCommand(message) {
        const args = message.content.slice(1).split(' ');
        const command = args.shift().toLowerCase();
        
        this.stats.commandsExecuted++;

        switch (command) {
            case 'ping':
                await this.handlePing(message);
                break;
            case 'help':
                await this.handleHelp(message);
                break;
            case 'stats':
                await this.handleStats(message);
                break;
            case 'mcp':
                await this.handleMCP(message, args);
                break;
            case 'ex':
                await this.handleEX(message, args);
                break;
            default:
                await this.handleUnknown(message, command);
        }
    }

    async handlePing(message) {
        const ping = this.demoMode ? Math.floor(Math.random() * 100) + 20 : 
                     Date.now() - message.createdTimestamp;
        await message.reply(`🏓 Pong! Latency: ${ping}ms`);
    }

    async handleHelp(message) {
        const embed = new EmbedBuilder()
            .setColor(0x00AE86)
            .setTitle('🚀 Discord EX Bot Commands')
            .setDescription('Advanced Discord MCP Integration Platform')
            .addFields(
                { name: '!ping', value: 'Check bot latency', inline: true },
                { name: '!help', value: 'Show this help message', inline: true },
                { name: '!stats', value: 'Display bot statistics', inline: true },
                { name: '!mcp <action>', value: 'MCP Bridge operations', inline: true },
                { name: '!ex <feature>', value: 'Discord EX features', inline: true }
            )
            .setTimestamp()
            .setFooter({ text: 'Discord EX Platform' });

        await message.reply({ embeds: [embed] });
    }

    async handleStats(message) {
        const uptime = Math.floor((Date.now() - this.stats.startTime) / 1000);
        const embed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle('📊 Bot Statistics')
            .addFields(
                { name: '🔢 Messages Processed', value: this.stats.messagesProcessed.toString(), inline: true },
                { name: '⚡ Commands Executed', value: this.stats.commandsExecuted.toString(), inline: true },
                { name: '🌐 Servers Connected', value: this.stats.serversConnected.toString(), inline: true },
                { name: '⏱️ Uptime', value: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${uptime % 60}s`, inline: true },
                { name: '🎭 Mode', value: this.demoMode ? 'DEMO' : 'PRODUCTION', inline: true }
            )
            .setTimestamp();

        await message.reply({ embeds: [embed] });
    }

    async handleMCP(message, args) {
        const action = args[0] || 'status';
        const embed = new EmbedBuilder()
            .setColor(0xFF6B35)
            .setTitle('🔗 MCP Bridge Status')
            .setDescription('Model Context Protocol Integration')
            .addFields(
                { name: 'Status', value: '🟢 Active', inline: true },
                { name: 'Connections', value: '3', inline: true },
                { name: 'Action', value: action, inline: true }
            )
            .setTimestamp();

        await message.reply({ embeds: [embed] });
    }

    async handleEX(message, args) {
        const feature = args[0] || 'overview';
        const embed = new EmbedBuilder()
            .setColor(0x9B59B6)
            .setTitle('⚡ Discord EX Features')
            .setDescription('Advanced automation and integration platform')
            .addFields(
                { name: '🤖 Smart Bot', value: 'AI-powered responses', inline: true },
                { name: '🔧 Auto Tools', value: 'Automated workflows', inline: true },
                { name: '👨‍💻 Dev Assistant', value: 'Development support', inline: true },
                { name: '🌐 Web Interface', value: 'Control panel access', inline: true }
            )
            .setTimestamp();

        await message.reply({ embeds: [embed] });
    }

    async handleUnknown(message, command) {
        await message.reply(`❓ Unknown command: ${command}. Type !help for available commands.`);
    }

    async start() {
        if (this.demoMode || !this.token) {
            console.log('🎭 Bot started in demo mode');
            return;
        }
        
        try {
            await this.client.login(this.token);
        } catch (error) {
            console.error('❌ Failed to login:', error);
            throw error;
        }
    }

    async stop() {
        if (this.client && !this.demoMode) {
            this.client.destroy();
        }
        console.log('🛑 Discord bot stopped');
    }

    getStats() {
        return this.stats;
    }

    isConnected() {
        return this.isReady;
    }
}

module.exports = DiscordBot;