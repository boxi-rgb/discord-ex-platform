const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs').promises;

class DatabaseManager {
    constructor() {
        this.dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../../data/discord-ex.db');
        this.db = null;
        this.isInitialized = false;
    }

    async initialize() {
        try {
            // Ensure data directory exists
            const dataDir = path.dirname(this.dbPath);
            await fs.mkdir(dataDir, { recursive: true });

            // Initialize database
            this.db = new sqlite3.Database(this.dbPath);
            
            await this.createTables();
            await this.seedData();
            
            this.isInitialized = true;
            console.log('✅ Database initialized successfully');
        } catch (error) {
            console.error('❌ Database initialization failed:', error);
            throw error;
        }
    }

    createTables() {
        return new Promise((resolve, reject) => {
            const queries = [
                // Bot statistics table
                `CREATE TABLE IF NOT EXISTS bot_stats (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                    messages_processed INTEGER DEFAULT 0,
                    commands_executed INTEGER DEFAULT 0,
                    servers_connected INTEGER DEFAULT 0,
                    uptime_seconds INTEGER DEFAULT 0
                )`,
                
                // MCP connections table
                `CREATE TABLE IF NOT EXISTS mcp_connections (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    url TEXT,
                    status TEXT DEFAULT 'disconnected',
                    capabilities TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    last_active DATETIME
                )`,
                
                // Activity logs table
                `CREATE TABLE IF NOT EXISTS activity_logs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                    type TEXT NOT NULL,
                    source TEXT,
                    message TEXT,
                    data TEXT
                )`,
                
                // User sessions table
                `CREATE TABLE IF NOT EXISTS user_sessions (
                    id TEXT PRIMARY KEY,
                    ip_address TEXT,
                    user_agent TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
                    is_active BOOLEAN DEFAULT 1
                )`,
                
                // Configuration table
                `CREATE TABLE IF NOT EXISTS configurations (
                    key TEXT PRIMARY KEY,
                    value TEXT,
                    type TEXT DEFAULT 'string',
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )`
            ];

            let completed = 0;
            queries.forEach((query, index) => {
                this.db.run(query, (err) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    completed++;
                    if (completed === queries.length) {
                        resolve();
                    }
                });
            });
        });
    }

    async seedData() {
        return new Promise((resolve, reject) => {
            // Insert initial configuration
            const configs = [
                ['demo_mode', 'true', 'boolean'],
                ['platform_name', 'Discord EX Platform', 'string'],
                ['version', '1.0.0', 'string'],
                ['max_connections', '10', 'number'],
                ['auto_reconnect', 'true', 'boolean']
            ];

            let completed = 0;
            configs.forEach(([key, value, type]) => {
                this.db.run(
                    'INSERT OR IGNORE INTO configurations (key, value, type) VALUES (?, ?, ?)',
                    [key, value, type],
                    (err) => {
                        if (err) {
                            reject(err);
                            return;
                        }
                        completed++;
                        if (completed === configs.length) {
                            resolve();
                        }
                    }
                );
            });
        });
    }

    // Bot statistics methods
    async saveBotStats(stats) {
        return new Promise((resolve, reject) => {
            const { messagesProcessed, commandsExecuted, serversConnected, uptime } = stats;
            this.db.run(
                'INSERT INTO bot_stats (messages_processed, commands_executed, servers_connected, uptime_seconds) VALUES (?, ?, ?, ?)',
                [messagesProcessed, commandsExecuted, serversConnected, uptime],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                }
            );
        });
    }

    async getBotStats(limit = 100) {
        return new Promise((resolve, reject) => {
            this.db.all(
                'SELECT * FROM bot_stats ORDER BY timestamp DESC LIMIT ?',
                [limit],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                }
            );
        });
    }

    // MCP connection methods
    async saveMCPConnection(connection) {
        return new Promise((resolve, reject) => {
            const { id, name, url, status, capabilities } = connection;
            this.db.run(
                'INSERT OR REPLACE INTO mcp_connections (id, name, url, status, capabilities, last_active) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)',
                [id, name, url, status, JSON.stringify(capabilities)],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.changes);
                }
            );
        });
    }

    async getMCPConnections() {
        return new Promise((resolve, reject) => {
            this.db.all(
                'SELECT * FROM mcp_connections ORDER BY created_at DESC',
                (err, rows) => {
                    if (err) reject(err);
                    else {
                        const connections = rows.map(row => ({
                            ...row,
                            capabilities: JSON.parse(row.capabilities || '[]')
                        }));
                        resolve(connections);
                    }
                }
            );
        });
    }

    // Activity logging
    async logActivity(type, source, message, data = null) {
        return new Promise((resolve, reject) => {
            this.db.run(
                'INSERT INTO activity_logs (type, source, message, data) VALUES (?, ?, ?, ?)',
                [type, source, message, data ? JSON.stringify(data) : null],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                }
            );
        });
    }

    async getActivityLogs(limit = 100, type = null) {
        return new Promise((resolve, reject) => {
            let query = 'SELECT * FROM activity_logs';
            let params = [];
            
            if (type) {
                query += ' WHERE type = ?';
                params.push(type);
            }
            
            query += ' ORDER BY timestamp DESC LIMIT ?';
            params.push(limit);

            this.db.all(query, params, (err, rows) => {
                if (err) reject(err);
                else {
                    const logs = rows.map(row => ({
                        ...row,
                        data: row.data ? JSON.parse(row.data) : null
                    }));
                    resolve(logs);
                }
            });
        });
    }

    // Configuration methods
    async getConfig(key) {
        return new Promise((resolve, reject) => {
            this.db.get(
                'SELECT value, type FROM configurations WHERE key = ?',
                [key],
                (err, row) => {
                    if (err) reject(err);
                    else if (row) {
                        let value = row.value;
                        if (row.type === 'boolean') value = value === 'true';
                        else if (row.type === 'number') value = parseFloat(value);
                        resolve(value);
                    } else {
                        resolve(null);
                    }
                }
            );
        });
    }

    async setConfig(key, value, type = 'string') {
        return new Promise((resolve, reject) => {
            const stringValue = String(value);
            this.db.run(
                'INSERT OR REPLACE INTO configurations (key, value, type, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)',
                [key, stringValue, type],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.changes);
                }
            );
        });
    }

    // User session methods
    async createSession(sessionId, ipAddress, userAgent) {
        return new Promise((resolve, reject) => {
            this.db.run(
                'INSERT OR REPLACE INTO user_sessions (id, ip_address, user_agent, last_activity) VALUES (?, ?, ?, CURRENT_TIMESTAMP)',
                [sessionId, ipAddress, userAgent],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.changes);
                }
            );
        });
    }

    async updateSessionActivity(sessionId) {
        return new Promise((resolve, reject) => {
            this.db.run(
                'UPDATE user_sessions SET last_activity = CURRENT_TIMESTAMP WHERE id = ?',
                [sessionId],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.changes);
                }
            );
        });
    }

    async getActiveSessions() {
        return new Promise((resolve, reject) => {
            this.db.all(
                'SELECT * FROM user_sessions WHERE is_active = 1 AND last_activity > datetime("now", "-1 hour") ORDER BY last_activity DESC',
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                }
            );
        });
    }

    // Cleanup and maintenance
    async cleanup() {
        const queries = [
            'DELETE FROM activity_logs WHERE timestamp < datetime("now", "-7 days")',
            'DELETE FROM bot_stats WHERE timestamp < datetime("now", "-30 days")',
            'UPDATE user_sessions SET is_active = 0 WHERE last_activity < datetime("now", "-1 hour")'
        ];

        for (const query of queries) {
            await new Promise((resolve, reject) => {
                this.db.run(query, (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
        }
    }

    async close() {
        if (this.db) {
            return new Promise((resolve) => {
                this.db.close((err) => {
                    if (err) console.error('Error closing database:', err);
                    else console.log('🗃️ Database connection closed');
                    resolve();
                });
            });
        }
    }
}

module.exports = DatabaseManager;