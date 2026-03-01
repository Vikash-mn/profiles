/**
 * neural-sync.js
 * ============================================================================
 * Distributed Neural Network Manager - Backend Synchronization
 * ============================================================================
 */

(function(global) {
    'use strict';

    class NeuralSyncManager {
        constructor(config) {
            this.config = config || {};
            this.backendStatus = "UNKNOWN";
            this.syncEnabled = true;
            this.syncQueue = [];
            this.lastSync = 0;
            this.retryCount = 0;
            this.pendingRequests = new Map();
            
            this.testBackendConnection();
            this.startSyncEngine();
        }

        async testBackendConnection() {
            try {
                const response = await this.backendRequest('GET', '/neural/system_status', null, 5000);
                if (response && response.status === "operational") {
                    this.backendStatus = "CONNECTED";
                    console.log(`%c[BACKEND] Python Server Connected v${response.version || "VA.0"}`, "color: #32CD32");
                    
                    // Sync local knowledge
                    await this.syncKnowledge();
                    return true;
                }
            } catch (error) {
                this.backendStatus = "DISCONNECTED";
                console.log("%c[BACKEND] Python Server Offline - Running in Hybrid Mode", "color: #ffaa00");
            }
            return false;
        }

        async backendRequest(method, endpoint, data = null, timeout = 10000) {
            const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
            
            return new Promise(async (resolve, reject) => {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), timeout);
                
                try {
                    const url = `${this.config.BACKEND_URL}${endpoint}`;
                    const options = {
                        method: method,
                        headers: {
                            'Content-Type': 'application/json',
                            'X-Neural-Version': this.config.VERSION,
                            'X-Session-ID': this.getSessionId()
                        },
                        signal: controller.signal
                    };
                    
                    if (data) {
                        options.body = JSON.stringify(data);
                    }
                    
                    const response = await fetch(url, options);
                    clearTimeout(timeoutId);
                    
                    if (!response.ok) {
                        throw new Error(`Backend error: ${response.status}`);
                    }
                    
                    const result = await response.json();
                    resolve(result);
                    
                } catch (error) {
                    clearTimeout(timeoutId);
                    
                    // Queue for retry if sync enabled
                    if (this.syncEnabled && method === 'POST' && endpoint === '/neural/process') {
                        this.queueForSync(requestId, { method, endpoint, data });
                    }
                    
                    reject(error);
                }
            });
        }

        queueForSync(id, request) {
            this.syncQueue.push({
                id,
                ...request,
                timestamp: Date.now(),
                attempts: 0
            });
            
            // Keep queue manageable
            if (this.syncQueue.length > 100) {
                this.syncQueue.shift();
            }
            
            console.log(`%c[SYNC] Request queued: ${this.syncQueue.length} pending`, "color: #ffaa00");
        }

        async processSyncQueue() {
            if (this.syncQueue.length === 0 || this.backendStatus !== "CONNECTED") return;
            
            const toProcess = [...this.syncQueue];
            const successful = [];
            
            for (const item of toProcess) {
                if (item.attempts >= this.config.MAX_SYNC_ATTEMPTS) {
                    console.log(`%c[SYNC] Dropping failed request after ${item.attempts} attempts`, "color: #ff5555");
                    continue;
                }
                
                try {
                    await this.backendRequest(item.method, item.endpoint, item.data);
                    successful.push(item.id);
                    console.log(`%c[SYNC] Successfully synced request ${item.id}`, "color: #32CD32");
                } catch (error) {
                    item.attempts++;
                    item.lastAttempt = Date.now();
                    console.log(`%c[SYNC] Failed to sync ${item.id} (attempt ${item.attempts})`, "color: #ffaa00");
                }
            }
            
            // Remove successful items
            this.syncQueue = this.syncQueue.filter(item => !successful.includes(item.id));
        }

        async syncKnowledge() {
            try {
                const localStats = {
                    synapses: this.getLocalSynapseCount(),
                    patterns: this.getLocalPatternCount(),
                    lastUpdate: this.getLastUpdateTime()
                };
                
                const response = await this.backendRequest('POST', '/neural/sync', {
                    session_id: this.getSessionId(),
                    client_version: this.config.VERSION,
                    local_stats: localStats,
                    pending_memories: []
                });
                
                if (response && response.synced) {
                    console.log(`%c[SYNC] Knowledge synchronized with backend`, "color: #32CD32");
                    return true;
                }
            } catch (error) {
                console.log("%c[SYNC] Knowledge sync failed", "color: #ffaa00");
            }
            return false;
        }

        startSyncEngine() {
            setInterval(() => {
                if (this.syncEnabled && this.backendStatus === "CONNECTED") {
                    this.processSyncQueue();
                }
            }, this.config.SYNC_INTERVAL);
            
            setInterval(() => {
                this.testBackendConnection();
            }, 60000);
        }

        getSessionId() {
            if (!window.sessionStorage.getItem('neural_session_id')) {
                const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                window.sessionStorage.setItem('neural_session_id', sessionId);
            }
            return window.sessionStorage.getItem('neural_session_id');
        }

        getLocalSynapseCount() {
            try {
                const data = localStorage.getItem(`neural_synapses_${this.config.MEMORY_VERSION}`);
                return data ? JSON.parse(data).length : 0;
            } catch (e) {
                return 0;
            }
        }

        getLocalPatternCount() {
            try {
                const data = localStorage.getItem(`neural_patterns_${this.config.MEMORY_VERSION}`);
                return data ? JSON.parse(data).length : 0;
            } catch (e) {
                return 0;
            }
        }

        getLastUpdateTime() {
            return parseInt(localStorage.getItem('neural_last_update') || '0');
        }

        // Training methods
        async trainMemory(input, output, metadata = {}) {
            try {
                const response = await this.backendRequest('POST', '/neural/train', {
                    input,
                    output,
                    metadata,
                    session_id: this.getSessionId()
                });
                return response;
            } catch (error) {
                console.error("Train memory failed:", error);
                return { success: false, error: error.message };
            }
        }

        // Query processing
        async processQuery(query, context = {}) {
            try {
                const response = await this.backendRequest('POST', '/neural/process', {
                    query,
                    context,
                    session_id: this.getSessionId()
                });
                return response;
            } catch (error) {
                console.error("Process query failed:", error);
                return null;
            }
        }

        // Get neural metrics from backend
        async getNeuralMetrics() {
            try {
                const response = await this.backendRequest('GET', '/neural/metrics', null, 5000);
                return response;
            } catch (error) {
                return null;
            }
        }

        // ==================== ADMIN FUNCTIONS ====================

        // Bulk delete knowledge entries
        async bulkDeleteKnowledge(queryHashes) {
            try {
                const response = await this.backendRequest('POST', '/neural/admin/bulk-delete', {
                    query_hashes: queryHashes
                }, 10000);
                return response;
            } catch (error) {
                console.error('Bulk delete error:', error);
                return { success: false, error: error.message };
            }
        }

        // Export neural data
        async exportNeuralData(format = 'json', includeSessions = false) {
            try {
                const response = await this.backendRequest('POST', '/neural/admin/export', {
                    format: format,
                    include_sessions: includeSessions
                }, 15000);
                return response;
            } catch (error) {
                console.error('Export error:', error);
                return { success: false, error: error.message };
            }
        }

        // Import neural data
        async importNeuralData(data, merge = true) {
            try {
                const response = await this.backendRequest('POST', '/neural/admin/import', {
                    data: data,
                    merge: merge
                }, 15000);
                return response;
            } catch (error) {
                console.error('Import error:', error);
                return { success: false, error: error.message };
            }
        }

        // List all sessions
        async listSessions() {
            try {
                const response = await this.backendRequest('GET', '/neural/admin/sessions', null, 5000);
                return response;
            } catch (error) {
                console.error('List sessions error:', error);
                return null;
            }
        }

        // Manage session (view, export, clear)
        async manageSession(sessionId, action) {
            try {
                const response = await this.backendRequest('POST', '/neural/admin/session/manage', {
                    session_id: sessionId,
                    action: action
                }, 10000);
                return response;
            } catch (error) {
                console.error('Session manage error:', error);
                return { success: false, error: error.message };
            }
        }

        // Get analytics
        async getAnalytics() {
            try {
                const response = await this.backendRequest('GET', '/neural/admin/analytics', null, 5000);
                return response;
            } catch (error) {
                console.error('Analytics error:', error);
                return null;
            }
        }

        // Optimize knowledge base
        async optimizeKnowledgeBase() {
            try {
                const response = await this.backendRequest('POST', '/neural/admin/optimize', {}, 10000);
                return response;
            } catch (error) {
                console.error('Optimize error:', error);
                return { success: false, error: error.message };
            }
        }

        // Get neural config
        async getNeuralConfig() {
            try {
                const response = await this.backendRequest('GET', '/neural/admin/config', null, 5000);
                return response;
            } catch (error) {
                console.error('Config error:', error);
                return null;
            }
        }

        // Create backup
        async createBackup() {
            try {
                const response = await this.backendRequest('POST', '/neural/admin/backup', {}, 15000);
                return response;
            } catch (error) {
                console.error('Backup error:', error);
                return { success: false, error: error.message };
            }
        }

        // Restore from backup
        async restoreBackup(backupFile) {
            try {
                const response = await this.backendRequest('POST', '/neural/admin/restore', {
                    file: backupFile
                }, 15000);
                return response;
            } catch (error) {
                console.error('Restore error:', error);
                return { success: false, error: error.message };
            }
        }
    }

    // Export
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = NeuralSyncManager;
    } else {
        global.NeuralSyncManager = NeuralSyncManager;
    }

})(typeof window !== 'undefined' ? window : this);
