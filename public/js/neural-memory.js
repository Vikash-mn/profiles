/**
 * neural-memory.js
 * ============================================================================
 * Hybrid Memory System - Local + Backend Sync
 * ============================================================================
 */

(function(global) {
    'use strict';

    class NeuralMemorySystem {
        constructor(syncManager, config) {
            this.distributed = syncManager;
            this.config = config || {};
            this.localCache = new Map();
            this.pendingWrites = new Map();
            this.stats = {
                localHits: 0,
                backendHits: 0,
                misses: 0,
                writes: 0
            };
            
            this.loadLocalCache();
            console.log(`%c[MEMORY] Hybrid Memory System Active | Cache: ${this.localCache.size}`, "color: #00aaff");
        }

        async retrieve(query) {
            const normalized = this.normalizeQuery(query);
            const cacheKey = this.hashQuery(normalized);
            
            // Check local cache first - exact match
            if (this.localCache.has(cacheKey)) {
                const memory = this.localCache.get(cacheKey);
                memory.accessCount = (memory.accessCount || 0) + 1;
                memory.lastAccessed = Date.now();
                this.stats.localHits++;
                
                // Update LRU position
                this.localCache.delete(cacheKey);
                this.localCache.set(cacheKey, memory);
                
                return {
                    ...memory,
                    source: 'local_cache',
                    matchType: 'exact',
                    confidence: this.calculateConfidence(memory)
                };
            }
            
            // Try semantic similarity search
            const semanticMatch = this.findSemanticMatch(normalized);
            if (semanticMatch) {
                this.stats.localHits++;
                return {
                    ...semanticMatch.memory,
                    source: 'semantic_cache',
                    matchType: 'semantic',
                    matchScore: semanticMatch.score,
                    confidence: this.calculateConfidence(semanticMatch.memory) * semanticMatch.score
                };
            }
            
            // Try backend if available
            if (this.distributed && this.distributed.backendStatus === "CONNECTED") {
                try {
                    const backendResponse = await this.distributed.processQuery(query);
                    
                    if (backendResponse && backendResponse.answer) {
                        // Cache the response locally
                        this.cacheLocally(cacheKey, {
                            query: normalized,
                            response: backendResponse.answer,
                            confidence: backendResponse.confidence || 0.8,
                            intent: backendResponse.intent,
                            emotion: backendResponse.emotion,
                            source: 'backend',
                            timestamp: Date.now(),
                            accessCount: 1
                        });
                        
                        this.stats.backendHits++;
                        return {
                            response: backendResponse.answer,
                            confidence: backendResponse.confidence,
                            intent: backendResponse.intent,
                            emotion: backendResponse.emotion,
                            source: 'backend'
                        };
                    }
                } catch (error) {
                    console.log("%c[MEMORY] Backend retrieval failed, using local processing", "color: #ffaa00");
                }
            }
            
            this.stats.misses++;
            return null;
        }

        async store(input, response, metadata = {}) {
            const normalized = this.normalizeQuery(input);
            const cacheKey = this.hashQuery(normalized);
            const timestamp = Date.now();
            
            const memory = {
                query: normalized,
                response: response,
                confidence: metadata.confidence || 0.8,
                intent: metadata.intent || 'general',
                emotion: metadata.emotion || 'neutral',
                context: metadata.context || {},
                tags: metadata.tags || [],
                timestamp: timestamp,
                lastAccessed: timestamp,
                accessCount: 1,
                version: this.config.VERSION
            };
            
            // Store locally
            this.cacheLocally(cacheKey, memory);
            
            // Queue for backend sync if connected
            if (this.distributed && this.distributed.backendStatus === "CONNECTED" && this.distributed.syncEnabled) {
                this.queueBackendWrite(cacheKey, memory);
            }
            
            this.stats.writes++;
            return cacheKey;
        }

        cacheLocally(key, memory) {
            this.localCache.set(key, memory);
            
            // Enforce cache limits
            if (this.localCache.size > (this.config.CACHE_MAX_SIZE || 1000)) {
                const oldestKey = this.localCache.keys().next().value;
                this.localCache.delete(oldestKey);
            }
            
            // Persist to localStorage
            this.saveToLocalStorage();
        }

        queueBackendWrite(key, memory) {
            this.pendingWrites.set(key, {
                ...memory,
                queuedAt: Date.now(),
                attempts: 0
            });
        }

        async processPendingWrites() {
            if (!this.distributed || this.pendingWrites.size === 0 || 
                this.distributed.backendStatus !== "CONNECTED") return;
            
            const writes = Array.from(this.pendingWrites.entries());
            
            for (const [key, memory] of writes) {
                try {
                    await this.distributed.trainMemory(memory.query, memory.response, {
                        confidence: memory.confidence,
                        intent: memory.intent,
                        emotion: memory.emotion,
                        context: memory.context
                    });
                    
                    this.pendingWrites.delete(key);
                    console.log(`%c[SYNC] Memory ${key} synced with backend`, "color: #32CD32");
                    
                } catch (error) {
                    memory.attempts++;
                    
                    if (memory.attempts >= (this.config.MAX_SYNC_ATTEMPTS || 3)) {
                        console.log(`%c[SYNC] Failed to sync memory ${key} after ${memory.attempts} attempts`, "color: #ff5555");
                        this.pendingWrites.delete(key);
                    }
                }
            }
        }

        normalizeQuery(query) {
            return query.toLowerCase()
                .replace(/[^\w\s]/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
        }

        hashQuery(query) {
            let hash = 0;
            for (let i = 0; i < query.length; i++) {
                hash = ((hash << 5) - hash) + query.charCodeAt(i);
                hash = hash & hash;
            }
            return `mem_${Math.abs(hash).toString(36)}`;
        }

        calculateConfidence(memory) {
            let confidence = memory.confidence || 0.5;
            
            // Boost confidence for frequently accessed memories
            if (memory.accessCount > 5) {
                confidence = Math.min(1, confidence + 0.1);
            }
            
            // Age factor - newer memories are slightly more confident
            const ageHours = (Date.now() - memory.timestamp) / (1000 * 60 * 60);
            if (ageHours < 24) {
                confidence = Math.min(1, confidence + 0.05);
            }
            
            return confidence;
        }

        // TF-IDF style semantic similarity search
        findSemanticMatch(query) {
            if (this.localCache.size === 0) return null;
            
            const queryWords = this.getWords(query);
            if (queryWords.length === 0) return null;
            
            // Calculate IDF for query terms
            const queryIdf = this.calculateIdf(queryWords);
            
            let bestMatch = null;
            let bestScore = 0;
            const threshold = 0.3; // Minimum similarity threshold
            
            for (const [key, memory] of this.localCache) {
                const memoryWords = this.getWords(memory.query || '');
                
                if (memoryWords.length === 0) continue;
                
                // Calculate TF-IDF vectors and cosine similarity
                const score = this.cosineSimilarity(queryWords, memoryWords, queryIdf);
                
                if (score > bestScore && score >= threshold) {
                    bestScore = score;
                    bestMatch = { memory, score };
                }
            }
            
            return bestMatch;
        }

        getWords(text) {
            // Tokenize and remove stopwords
            const stopwords = new Set([
                'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
                'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
                'should', 'may', 'might', 'must', 'can', 'need', 'to', 'of', 'in',
                'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through',
                'during', 'before', 'after', 'above', 'below', 'between', 'under',
                'and', 'or', 'but', 'if', 'because', 'what', 'which', 'who',
                'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it'
            ]);
            
            return text.toLowerCase()
                .replace(/[^a-z0-9\s]/g, ' ')
                .split(/\s+/)
                .filter(w => w.length > 2 && !stopwords.has(w));
        }

        calculateIdf(words) {
            // Calculate IDF for words across all memories
            const idf = {};
            const N = this.localCache.size || 1;
            
            for (const word of words) {
                let docCount = 0;
                for (const [key, memory] of this.localCache) {
                    const memWords = this.getWords(memory.query || '');
                    if (memWords.includes(word)) docCount++;
                }
                idf[word] = Math.log(N / (1 + docCount)) + 1;
            }
            
            return idf;
        }

        cosineSimilarity(words1, words2, idf) {
            // Calculate term frequency
            const tf1 = {};
            const tf2 = {};
            
            for (const w of words1) tf1[w] = (tf1[w] || 0) + 1;
            for (const w of words2) tf2[w] = (tf2[w] || 0) + 1;
            
            // Normalize by length
            for (const w in tf1) tf1[w] /= words1.length;
            for (const w in tf2) tf2[w] /= words2.length;
            
            // Calculate TF-IDF weighted dot product
            let dotProduct = 0;
            let norm1 = 0;
            let norm2 = 0;
            
            for (const w in tf1) {
                const weight1 = tf1[w] * (idf[w] || 1);
                norm1 += weight1 * weight1;
                
                if (tf2[w]) {
                    const weight2 = tf2[w] * (idf[w] || 1);
                    dotProduct += weight1 * weight2;
                }
            }
            
            for (const w in tf2) {
                const weight2 = tf2[w] * (idf[w] || 1);
                norm2 += weight2 * weight2;
            }
            
            norm1 = Math.sqrt(norm1);
            norm2 = Math.sqrt(norm2);
            
            if (norm1 === 0 || norm2 === 0) return 0;
            
            return dotProduct / (norm1 * norm2);
        }

        loadLocalCache() {
            try {
                const cached = localStorage.getItem(`neural_cache_${this.config.MEMORY_VERSION || 'v22'}`);
                if (cached) {
                    const data = JSON.parse(cached);
                    for (const [key, value] of Object.entries(data)) {
                        this.localCache.set(key, value);
                    }
                }
            } catch (e) {
                console.warn("[MEMORY] Failed to load cache from localStorage");
            }
        }

        saveToLocalStorage() {
            try {
                const data = Object.fromEntries(this.localCache);
                localStorage.setItem(`neural_cache_${this.config.MEMORY_VERSION || 'v22'}`, JSON.stringify(data));
                localStorage.setItem('neural_last_update', Date.now().toString());
            } catch (e) {
                console.warn("[MEMORY] Failed to save cache to localStorage");
            }
        }

        getStatistics() {
            const totalHits = this.stats.localHits + this.stats.backendHits;
            const total = totalHits + this.stats.misses;
            return {
                ...this.stats,
                cacheSize: this.localCache.size,
                pendingWrites: this.pendingWrites.size,
                hitRate: total > 0 ? totalHits / total : 0
            };
        }

        clearCache() {
            this.localCache.clear();
            this.pendingWrites.clear();
            localStorage.removeItem(`neural_cache_${this.config.MEMORY_VERSION || 'v22'}`);
            console.log("%c[MEMORY] Cache cleared", "color: #ffaa00");
        }
    }

    // Export
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = NeuralMemorySystem;
    } else {
        global.NeuralMemorySystem = NeuralMemorySystem;
    }

})(typeof window !== 'undefined' ? window : this);
