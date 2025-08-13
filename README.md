# Discord EX Platform

🚀 **Advanced Discord MCP Integration Platform with Web Interface**

A comprehensive platform that bridges Discord bots with Model Context Protocol (MCP) servers, featuring a real-time web dashboard for monitoring and control.

## ✨ Features

- **🤖 Discord Bot Integration**: Full-featured Discord bot with command handling
- **🔗 MCP Bridge**: Connect to multiple Model Context Protocol servers
- **🌐 Web Dashboard**: Real-time monitoring and control interface
- **📊 Analytics**: Comprehensive logging and statistics
- **🔄 Auto-Reconnect**: Robust connection management
- **🎯 Demo Mode**: Works without Discord token for testing
- **📱 Responsive Design**: Mobile-friendly web interface
- **🐳 Docker Ready**: Containerized deployment
- **☁️ Cloud Deploy**: Ready for Vercel, Render, Heroku

## 🚀 Quick Start

### Option 1: Demo Mode (No Setup Required)

```bash
npm install
npm start
```

Open http://localhost:3000 - the platform runs in demo mode without Discord token!

### Option 2: Full Discord Integration

1. **Clone the repository**
   ```bash
   git clone https://github.com/boxi-rgb/discord-ex-platform.git
   cd discord-ex-platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your Discord bot token
   ```

4. **Start the platform**
   ```bash
   npm start
   ```

5. **Access the dashboard**
   - Web Interface: http://localhost:3000
   - Health Check: http://localhost:3000/health
   - API: http://localhost:3000/api

## 🎮 Discord Bot Commands

- `!ping` - Check bot latency
- `!help` - Show available commands
- `!stats` - Display bot statistics
- `!mcp <action>` - MCP Bridge operations
- `!ex <feature>` - Discord EX features

## 🔧 Configuration

### Environment Variables

```env
# Discord Configuration
DISCORD_TOKEN=your_discord_bot_token_here

# Server Configuration
PORT=3000
NODE_ENV=production

# Database Configuration
DATABASE_PATH=./data/discord-ex.db
```

### MCP Servers

Configure MCP servers in `src/core/mcp-bridge.js` or through the web interface.

## 🐳 Docker Deployment

### Using Docker Compose

```bash
docker-compose up -d
```

### Using Docker

```bash
docker build -t discord-ex-platform .
docker run -p 3000:3000 -e DISCORD_TOKEN=your_token discord-ex-platform
```

## ☁️ Cloud Deployment

### Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/boxi-rgb/discord-ex-platform)

1. Click the deploy button above
2. Set environment variables in Vercel dashboard
3. Deploy!

### Render

1. Connect your GitHub repository
2. Use `render.yaml` configuration
3. Set environment variables
4. Deploy!

### Heroku

```bash
heroku create your-app-name
heroku config:set DISCORD_TOKEN=your_token
git push heroku main
```

## 📊 Web Dashboard Features

- **Real-time Stats**: Live bot and MCP statistics
- **Connection Monitor**: Track MCP server connections
- **Activity Logs**: Comprehensive logging system
- **System Info**: Server performance metrics
- **Interactive Charts**: Visual data representation
- **Command Execution**: Remote bot control

## 🔌 MCP Integration

The platform supports Model Context Protocol servers for:

- **AI Tools**: ChatGPT, Claude, Gemini integrations
- **File Management**: Remote file operations
- **Data Processing**: Advanced analytics
- **Custom Extensions**: Your own MCP servers

## 📁 Project Structure

```
src/
├── server.js          # Main application server
├── bot/
│   └── discord-bot.js  # Discord bot implementation
├── core/
│   └── mcp-bridge.js   # MCP protocol bridge
├── web/
│   └── controller.js   # Web interface controller
├── api/
│   └── routes.js       # REST API endpoints
└── database/
    └── manager.js      # Database management

public/
├── index.html         # Web dashboard
├── app.js            # Frontend JavaScript
└── assets/           # Static files
```

## 🛡️ Security Features

- **Helmet.js**: Security headers
- **CORS**: Cross-origin protection
- **Rate Limiting**: API protection
- **Input Validation**: Secure data handling
- **Session Management**: User tracking

## 🔧 Development

### Prerequisites

- Node.js 18+
- npm or yarn
- Discord Bot Token (optional for demo)

### Development Mode

```bash
npm run dev
```

### Testing

```bash
npm test
```

### API Documentation

- `GET /api/health` - Platform health check
- `GET /api/bot/status` - Discord bot status
- `GET /api/mcp/status` - MCP bridge status
- `POST /api/mcp/call` - Execute MCP commands
- `GET /api/logs` - Activity logs

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🔗 Links

- **GitHub**: https://github.com/boxi-rgb/discord-ex-platform
- **Demo**: [Live Demo](https://your-demo-url.vercel.app)
- **Documentation**: [Wiki](https://github.com/boxi-rgb/discord-ex-platform/wiki)

## 💡 Support

- **Issues**: [GitHub Issues](https://github.com/boxi-rgb/discord-ex-platform/issues)
- **Discussions**: [GitHub Discussions](https://github.com/boxi-rgb/discord-ex-platform/discussions)
- **Discord**: [Join our Discord](https://discord.gg/your-server)

---

**Built with ❤️ by the Discord EX Team**

*Bridging Discord and AI with advanced MCP integration*