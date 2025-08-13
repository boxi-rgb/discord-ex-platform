// Discord EX Platform Web Interface
class DiscordEXApp {
    constructor() {
        this.socket = null;
        this.chart = null;
        this.isConnected = false;
        this.data = {
            platform: null,
            bot: null,
            mcp: null,
            system: null
        };
        
        this.init();
    }
    
    init() {
        console.log('🚀 Initializing Discord EX Platform interface...');
        this.connectSocket();
        this.setupChart();
        
        // Update time displays every second
        setInterval(() => this.updateTimeDisplays(), 1000);
    }
    
    connectSocket() {
        this.socket = io();
        
        this.socket.on('connect', () => {
            console.log('✅ Connected to Discord EX Platform');
            this.isConnected = true;
            this.updateConnectionStatus('Connected', 'running');
        });
        
        this.socket.on('disconnect', () => {
            console.log('❌ Disconnected from Discord EX Platform');
            this.isConnected = false;
            this.updateConnectionStatus('Disconnected', 'error');
        });
        
        this.socket.on('initial-data', (data) => {
            console.log('📊 Received initial data:', data);
            this.data = data;
            this.updateInterface();
            this.hideLoading();
        });
        
        this.socket.on('live-update', (data) => {
            this.updateLiveData(data);
        });
        
        this.socket.on('bot-stats', (data) => {
            this.updateBotStats(data);
        });
        
        this.socket.on('mcp-status', (data) => {
            this.updateMCPStatus(data);
        });
        
        this.socket.on('activity-logs', (data) => {
            this.updateActivityLogs(data.logs);
        });
        
        this.socket.on('command-result', (data) => {
            this.handleCommandResult(data);
        });
        
        this.socket.on('error', (error) => {
            console.error('❌ Socket error:', error);
            this.showNotification('Error: ' + error.message, 'error');
        });
    }
    
    hideLoading() {
        document.getElementById('loading').style.display = 'none';
        document.getElementById('main-content').style.display = 'block';
    }
    
    updateConnectionStatus(status, type) {
        const statusElement = document.getElementById('platform-status');
        const indicator = statusElement.querySelector('.status-indicator');
        
        statusElement.childNodes[0].textContent = status;
        indicator.className = `status-indicator status-${type}`;
    }
    
    updateInterface() {
        if (!this.data) return;
        
        // Update platform info
        if (this.data.platform) {
            this.updateConnectionStatus(
                `${this.data.platform.name} v${this.data.platform.version}`,
                this.data.platform.status === 'running' ? 'running' : 'error'
            );
        }
        
        // Update bot stats
        if (this.data.bot) {
            this.updateBotDisplay(this.data.bot);
        }
        
        // Update MCP status
        if (this.data.mcp) {
            this.updateMCPDisplay(this.data.mcp);
        }
        
        // Update system stats
        this.updateSystemStats({
            uptime: this.data.platform?.uptime || 0,
            connectedClients: this.data.clients || 0
        });
    }
    
    updateLiveData(data) {
        if (data.bot) {
            this.updateBotDisplay(data.bot);
        }
        
        if (data.mcp) {
            this.updateMCPStatsOnly(data.mcp.stats);
        }
        
        if (data.system) {
            this.updateSystemStats(data.system);
        }
        
        // Update chart with new data
        this.updateChart(data);
    }
    
    updateBotDisplay(botData) {
        document.getElementById('bot-status').textContent = 
            botData.connected ? (botData.demoMode ? 'Demo Mode' : 'Connected') : 'Disconnected';
        document.getElementById('bot-messages').textContent = 
            botData.stats?.messagesProcessed || 0;
        document.getElementById('bot-commands').textContent = 
            botData.stats?.commandsExecuted || 0;
        document.getElementById('bot-servers').textContent = 
            botData.stats?.serversConnected || 0;
    }
    
    updateMCPDisplay(mcpData) {
        this.updateMCPStatsOnly(mcpData.stats);
        
        // Update connections list
        const connectionList = document.getElementById('mcp-connection-list');
        connectionList.innerHTML = '';
        
        if (mcpData.connections && mcpData.connections.length > 0) {
            mcpData.connections.forEach(conn => {
                const li = document.createElement('li');
                li.className = 'connection-item';
                li.innerHTML = `
                    <span>${conn.name}</span>
                    <div>
                        <span style="font-size: 0.8em; margin-right: 10px;">${conn.messageCount || 0} msgs</span>
                        <span class="connection-status ${conn.status}"></span>
                    </div>
                `;
                connectionList.appendChild(li);
            });
        } else {
            connectionList.innerHTML = '<li>No MCP connections</li>';
        }
    }
    
    updateMCPStatsOnly(stats) {
        if (!stats) return;
        
        document.getElementById('mcp-connections').textContent = stats.activeConnections || 0;
        document.getElementById('mcp-messages').textContent = stats.messagesProcessed || 0;
        document.getElementById('mcp-activity').textContent = 
            stats.lastActivity ? new Date(stats.lastActivity).toLocaleTimeString() : 'Never';
    }
    
    updateSystemStats(systemData) {
        document.getElementById('system-uptime').textContent = this.formatUptime(systemData.uptime);
        document.getElementById('system-clients').textContent = systemData.connectedClients || 0;
        
        if (systemData.memory) {
            const memoryMB = Math.round(systemData.memory.rss / 1024 / 1024);
            document.getElementById('system-memory').textContent = `${memoryMB} MB`;
        }
        
        if (systemData.platform || process?.platform) {
            document.getElementById('system-platform').textContent = 
                systemData.platform || process.platform || 'Unknown';
        }
    }
    
    formatUptime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        return `${hours}h ${minutes}m ${secs}s`;
    }
    
    setupChart() {
        const ctx = document.getElementById('activityChart').getContext('2d');
        
        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: Array.from({ length: 20 }, (_, i) => `-${19-i}m`),
                datasets: [
                    {
                        label: 'Bot Messages',
                        data: new Array(20).fill(0),
                        borderColor: '#00ff88',
                        backgroundColor: 'rgba(0, 255, 136, 0.1)',
                        tension: 0.4
                    },
                    {
                        label: 'Bot Commands',
                        data: new Array(20).fill(0),
                        borderColor: '#FFD700',
                        backgroundColor: 'rgba(255, 215, 0, 0.1)',
                        tension: 0.4
                    },
                    {
                        label: 'MCP Calls',
                        data: new Array(20).fill(0),
                        borderColor: '#FF6B35',
                        backgroundColor: 'rgba(255, 107, 53, 0.1)',
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: '#fff'
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            color: '#fff'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    },
                    y: {
                        ticks: {
                            color: '#fff'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    }
                }
            }
        });
    }
    
    updateChart(data) {
        if (!this.chart || !data.bot?.stats) return;
        
        // Shift data and add new point
        this.chart.data.datasets[0].data.shift();
        this.chart.data.datasets[0].data.push(data.bot.stats.messagesProcessed || 0);
        
        this.chart.data.datasets[1].data.shift();
        this.chart.data.datasets[1].data.push(data.bot.stats.commandsExecuted || 0);
        
        this.chart.data.datasets[2].data.shift();
        this.chart.data.datasets[2].data.push(data.mcp?.stats?.messagesProcessed || 0);
        
        this.chart.update('none');
    }
    
    updateActivityLogs(logs) {
        const logsContainer = document.getElementById('activity-logs');
        logsContainer.innerHTML = '';
        
        if (!logs || logs.length === 0) {
            logsContainer.innerHTML = '<div class="log-entry">No activity logs available</div>';
            return;
        }
        
        logs.slice(0, 50).forEach(log => {
            const entry = document.createElement('div');
            entry.className = 'log-entry';
            
            const timestamp = new Date(log.timestamp).toLocaleTimeString();
            entry.innerHTML = `
                <span class="log-timestamp">${timestamp}</span>
                <span class="log-type">[${log.type}]</span>
                <span>${log.message}</span>
            `;
            
            logsContainer.appendChild(entry);
        });
        
        logsContainer.scrollTop = 0;
    }
    
    updateTimeDisplays() {
        // Update any time-based displays that need real-time updates
        const activityElement = document.getElementById('mcp-activity');
        if (activityElement && this.data.mcp?.stats?.lastActivity) {
            const lastActivity = new Date(this.data.mcp.stats.lastActivity);
            const now = new Date();
            const diffMinutes = Math.floor((now - lastActivity) / 60000);
            
            if (diffMinutes < 1) {
                activityElement.textContent = 'Just now';
            } else if (diffMinutes < 60) {
                activityElement.textContent = `${diffMinutes}m ago`;
            } else {
                activityElement.textContent = lastActivity.toLocaleTimeString();
            }
        }
    }
    
    handleCommandResult(data) {
        console.log('Command result:', data);
        const message = data.result.message || 'Command executed';
        const type = data.result.success ? 'success' : 'error';
        this.showNotification(message, type);
        
        // Refresh relevant data
        if (data.command === 'system-stats') {
            this.requestSystemStats();
        }
    }
    
    showNotification(message, type = 'info') {
        // Simple notification - could be enhanced with a proper notification system
        const colors = {
            success: '#00ff88',
            error: '#ff4444',
            info: '#FFD700'
        };
        
        console.log(`%c[${type.toUpperCase()}] ${message}`, `color: ${colors[type] || colors.info}`);
        
        // You could also show a toast notification here
        alert(`${type.toUpperCase()}: ${message}`);
    }
}

// Global functions for button clicks
function requestBotStats() {
    if (window.app && window.app.socket) {
        window.app.socket.emit('request-bot-stats');
    }
}

function requestMCPStatus() {
    if (window.app && window.app.socket) {
        window.app.socket.emit('request-mcp-status');
    }
}

function requestActivityLogs() {
    if (window.app && window.app.socket) {
        window.app.socket.emit('request-activity-logs', { limit: 50 });
    }
}

function executeCommand(command, args = []) {
    if (window.app && window.app.socket) {
        window.app.socket.emit('execute-command', { command, args });
    }
}

function requestSystemStats() {
    executeCommand('system-stats');
}

// Initialize the application
window.addEventListener('DOMContentLoaded', () => {
    window.app = new DiscordEXApp();
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && window.app) {
        // Refresh data when page becomes visible
        setTimeout(() => {
            requestBotStats();
            requestMCPStatus();
            requestActivityLogs();
        }, 1000);
    }
});