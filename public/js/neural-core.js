/**
 * neural-core.js
 * ============================================================================
 * VERSION: VA.0 (SYNTHETIC CONSCIOUSNESS)
 * CODENAME: PROJECT ASCENSION
 * ARCHITECTURE: Modular Quantum-Neuro-Synthetic Hybrid
 * BACKEND: FastAPI Python Server Synchronization
 * STORAGE: IndexedDB + LocalStorage + Server Persistence
 * AUTHOR: Vikash (System Architect)
 * ============================================================================
 * 
 * MODULES:
 * - neural-config.js: Configuration
 * - neural-sync.js: Backend synchronization
 * - neural-quantum.js: Quantum simulation engine
 * - neural-memory.js: Hybrid memory system
 * - neural-core.js: Main entry point
 */

(function() {
    'use strict';

    // =========================================================================
    // LOAD MODULES (Dynamic import for modular architecture)
    // =========================================================================
    
    // Check if modules are already loaded
    const CONFIG = (typeof NeuralConfig !== 'undefined') ? NeuralConfig : { 
        VERSION: 'VA.0', 
        BACKEND_URL: '/api',
        SYNC_INTERVAL: 30000,
        MAX_SYNC_ATTEMPTS: 3,
        SESSION_TIMEOUT: 300000,
        CACHE_MAX_SIZE: 1000,
        MEMORY_VERSION: 'v22'
    };
    
    const NeuralSyncManager = window.NeuralSyncManager;
    const QuantumSimulationEngine = window.QuantumSimulationEngine;
    const NeuralMemorySystem = window.NeuralMemorySystem;
    const TrainingDataManager = window.TrainingDataManager;

    // =========================================================================
    // LOCAL KNOWLEDGE BASE (FAQ) - Can be expanded with training data
    // =========================================================================
    
    // Load external training data if available
    let TRAINING_DATA = [];
    if (typeof window.NEURAL_TRAINING_DATA !== 'undefined') {
        TRAINING_DATA = window.NEURAL_TRAINING_DATA;
    }
    
    const LOCAL_FAQ = [
        { q: 'what products do you sell', a: 'We sell microcontrollers, SBCs, sensors, IoT devices, and custom fabrication services.' },
        { q: 'how long does shipping take', a: 'Standard shipping is 3-5 business days. Express options available at checkout.' },
        { q: 'do you offer returns', a: 'Yes, we offer 30-day returns for unused items in original packaging.' },
        { q: 'what is custom fabrication', a: 'Our Custom Forge service provides PCB design, firmware development, and hardware prototyping.' },
        { q: 'how do i track my order', a: 'Order tracking is available in your purchase history section after login.' },
        { q: 'what payment methods', a: 'We accept credit cards, PayPal, and bank transfers for orders.' },
        { q: 'do you ship internationally', a: 'Yes, we ship worldwide! International shipping typically takes 7-14 business days.' },
        { q: 'how do i contact support', a: 'Email support@vikash.dev or use the contact form on our website.' }
    ];
    
    // =========================================================================
    // MAIN SYNTHETIC CONSCIOUSNESS CORE
    // =========================================================================

    class SyntheticConsciousnessCore {
        constructor() {
            this.version = CONFIG.VERSION || 'VA.0';
            this.ready = false;
            
            // Initialize components
            this.initializeComponents();
            
            // Load training data
            this.loadTrainingData();
            
            // Initialize training data manager
            this.initTrainingManager();
            
            this.ready = true;
            
            console.log(`%c⚛️ SYNTHETIC CONSCIOUSNESS v${this.version} INITIALIZED`, 
                "background: linear-gradient(90deg, #000428, #004e92); color: #00ff9d; padding: 10px;");
        }
        
        async loadTrainingData() {
            // Load from external file if available
            if (TRAINING_DATA.length > 0) {
                console.log(`%c[LOADING] Training with ${TRAINING_DATA.length} examples...`, "color: #00aaff");
                
                for (const item of TRAINING_DATA) {
                    try {
                        await this.memory.store(item.input, item.output, {
                            intent: this.classifyIntent(item.input),
                            confidence: 0.9,
                            trained: true
                        });
                    } catch (e) {
                        // Silent fail for batch loading
                    }
                }
                
                console.log(`%c[TRAINED] ${TRAINING_DATA.length} examples loaded into memory`, "color: #32CD32");
            }
        }

        async initTrainingManager() {
            // Initialize training data manager and load from backend file
            if (TrainingDataManager && window.trainingDataManager) {
                try {
                    await window.trainingDataManager.init(CONFIG);
                    console.log(`%c[DATA MANAGER] Training data manager initialized`, "color: #32CD32");
                } catch (e) {
                    console.warn("[DATA MANAGER] Failed to initialize:", e);
                }
            }
        }

        async initializeComponents() {
            // Distributed Neural Manager (Backend Sync)
            if (NeuralSyncManager) {
                this.distributed = new NeuralSyncManager(CONFIG);
            } else {
                console.warn("[CORE] NeuralSyncManager not available - running in offline mode");
                this.distributed = {
                    backendStatus: "OFFLINE",
                    syncEnabled: false,
                    trainMemory: async () => ({ success: false }),
                    processQuery: async () => null,
                    getSessionId: () => 'offline_session'
                };
            }

            // Quantum Simulation Engine
            if (QuantumSimulationEngine) {
                this.quantum = new QuantumSimulationEngine(16);
            } else {
                console.warn("[CORE] QuantumSimulationEngine not available");
                this.quantum = {
                    quantumProcess: async () => ({ state: 0, binary: '0' }),
                    getQuantumMetrics: () => ({ qubits: 0 }),
                    reset: () => {}
                };
            }

            // Hybrid Memory System
            if (NeuralMemorySystem) {
                this.memory = new NeuralMemorySystem(this.distributed, CONFIG);
            } else {
                console.warn("[CORE] NeuralMemorySystem not available");
                this.memory = {
                    retrieve: async () => null,
                    store: async () => null,
                    getStatistics: () => ({}),
                    clearCache: () => {}
                };
            }

            // Metrics tracking
            this.metrics = {
                responseTimes: [],
                queryCount: 0
            };
        }

        async process(query, options = {}) {
            const startTime = performance.now();
            this.metrics.queryCount++;
            const sessionId = this.distributed?.getSessionId() || 'default';
            
            // Track conversation context
            if (!this.conversationContext) this.conversationContext = {};
            if (!this.conversationContext[sessionId]) {
                this.conversationContext[sessionId] = { history: [], lastIntent: null };
            }
            const session = this.conversationContext[sessionId];

            try {
                // 1. Try memory retrieval first (semantic)
                const cachedResponse = await this.memory.retrieve(query);
                if (cachedResponse && cachedResponse.response) {
                    const duration = performance.now() - startTime;
                    this.trackResponseTime(duration);
                    
                    // Update conversation context
                    session.history.push({ query, response: cachedResponse.response, intent: cachedResponse.intent });
                    if (session.history.length > 10) session.history.shift();
                    
                    // Calculate multi-source confidence
                    const confidence = this.calculateConfidence({
                        source: cachedResponse.source,
                        matchType: cachedResponse.matchType,
                        matchScore: cachedResponse.matchScore,
                        intent: cachedResponse.intent,
                        contextRelevance: this.getContextRelevance(query, session)
                    });
                    
                    return {
                        response: cachedResponse.response,
                        confidence: confidence,
                        intent: cachedResponse.intent || this.classifyIntent(query),
                        source: cachedResponse.source,
                        matchType: cachedResponse.matchType || 'exact',
                        processingTime: duration,
                        reasoning: this.generateReasoning(cachedResponse, 'memory_retrieval', session)
                    };
                }

                // 2. Process with quantum engine
                const quantumResult = await this.quantum.quantumProcess(query);

                // 3. Try backend if available
                let backendResponse = null;
                if (this.distributed?.backendStatus === "CONNECTED") {
                    backendResponse = await this.distributed.processQuery(query, {
                        quantum_state: quantumResult.binary,
                        session_id: sessionId,
                        context: { history: session.history.slice(-3) }
                    });
                }

                // 4. Generate response
                let response;
                let confidence = 0.5;
                let source = 'local';
                let reasoning = 'fallback';
                
                if (backendResponse && backendResponse.answer) {
                    response = backendResponse.answer;
                    confidence = this.calculateConfidence({
                        source: 'backend',
                        intent: backendResponse.intent,
                        semanticScore: backendResponse.semantic_matches?.length > 0 ? 0.8 : 0.5
                    });
                    source = 'backend';
                    reasoning = 'backend_api';
                    
                    // Store in memory
                    await this.memory.store(query, response, {
                        confidence: confidence,
                        intent: backendResponse.intent,
                        emotion: backendResponse.emotion
                    });
                } else {
                    // Fallback local response
                    response = this.generateLocalResponse(query, quantumResult, session);
                    confidence = this.calculateConfidence({
                        source: 'local_faq',
                        contextRelevance: this.getContextRelevance(query, session)
                    });
                }

                // Update conversation context
                session.history.push({ query, response, intent: this.classifyIntent(query) });
                if (session.history.length > 10) session.history.shift();
                
                const duration = performance.now() - startTime;
                this.trackResponseTime(duration);

                return {
                    response,
                    confidence: confidence,
                    intent: backendResponse?.intent || this.classifyIntent(query),
                    source: source,
                    processingTime: duration,
                    quantumState: quantumResult.binary,
                    conversationTurn: session.history.length,
                    reasoning: this.generateReasoning({ source, confidence }, reasoning, session)
                };

            } catch (error) {
                console.error("[CORE] Process error:", error);
                return {
                    response: "I encountered an error processing your request. Please try again.",
                    confidence: 0,
                    source: 'error',
                    error: error.message
                };
            }
        }
        
        calculateConfidence(signals) {
            let confidence = 0.5;
            
            // Source reliability
            const sourceWeights = {
                'backend': 0.95,
                'semantic_cache': 0.8,
                'local_cache': 0.85,
                'backend_cache': 0.9,
                'local_faq': 0.7,
                'error': 0.0
            };
            confidence = sourceWeights[signals.source] || 0.5;
            
            // Match type bonus
            if (signals.matchType === 'exact') confidence += 0.05;
            if (signals.matchType === 'semantic' && signals.matchScore) {
                confidence += signals.matchScore * 0.1;
            }
            
            // Intent clarity bonus
            if (signals.intent && signals.intent !== 'general') {
                confidence += 0.05;
            }
            
            // Context relevance
            if (signals.contextRelevance) {
                confidence += signals.contextRelevance * 0.1;
            }
            
            // Semantic match from backend
            if (signals.semanticScore) {
                confidence += signals.semanticScore * 0.1;
            }
            
            return Math.min(0.99, Math.max(0.01, confidence));
        }
        
        getContextRelevance(query, session) {
            if (!session.history || session.history.length === 0) return 0;
            
            // Check if query is a follow-up
            const followUpPatterns = ['it', 'that', 'those', 'them', 'this', 'what about', 'and'];
            const isFollowUp = followUpPatterns.some(p => query.toLowerCase().includes(p));
            
            if (isFollowUp && session.lastIntent) {
                return 0.3; // Bonus for context continuity
            }
            
            return 0;
        }
        
        generateReasoning(signal, reason, session) {
            const reasons = {
                'memory_retrieval': `Found relevant response in ${signal.source || 'local cache'}. ` +
                    (signal.matchType ? `Matched with ${signal.matchType} similarity. ` : '') +
                    `Conversation context: ${session.history?.length || 0} turns.`,
                'backend_api': `Retrieved from backend API. ` +
                    `High confidence from server-side processing. ` +
                    `Session has ${session.history?.length || 0} prior turns.`,
                'fallback': `Using local FAQ system. ` +
                    `Backend unavailable or query not in knowledge base. ` +
                    `Consider reconnecting for full capabilities.`
            };
            
            return reasons[reason] || reasons['fallback'];
        }

        generateLocalResponse(query, quantumResult, session = {}) {
            // Advanced local response with comprehensive FAQ
            const lowerQuery = query.toLowerCase();
            
            // Comprehensive FAQ responses
            const faqResponses = {
                // Greetings
                greeting: [
                    "Hello! Welcome to the Neural AI System. I'm running in offline mode but can still help you with many tasks.",
                    "Hi there! While my backend is offline, I'm still functional with local capabilities. What would you like to know?",
                    "Greetings! I can assist you even without the backend. Try asking about my features, capabilities, or system status."
                ],
                // Help
                help: [
                    "I can help you with:\n• Product information and recommendations\n• Order status and tracking\n• Technical specifications\n• Custom fabrication services\n• System status checks\n\nJust ask me anything!",
                    "Here are things I can help with while offline:\n- Answering FAQs\n- Processing queries through quantum simulation\n- Memory retrieval from cache\n- System diagnostics\n\nWhat do you need?"
                ],
                // Products
                product: [
                    "Our hardware store offers microcontrollers, SBCs, sensors, IoT devices, and custom fabrication services. You can browse products when the backend connects.",
                    "We specialize in development boards, sensors, and custom electronics. Check the store section when online for the full catalog."
                ],
                // Prices
                price: [
                    "Product prices range from $24.99 for basic components to $349+ for custom fabrication. The full price list is available when connected.",
                    "We offer competitive pricing across all categories. Budget options start at $24.99, with premium custom services at $349+."
                ],
                // Orders
                order: [
                    "To check order status, you'll need to connect to the backend. I can help you navigate to your purchase history once online.",
                    "Order tracking is available through the purchase history section. Please connect to the backend for real-time status updates."
                ],
                // Shipping
                shipping: [
                    "Standard shipping takes 3-5 business days. Express options are available at checkout.",
                    "We ship worldwide! Most orders arrive within 3-5 business days. Custom fabrication may take 5-10 days."
                ],
                // Fabrication
                fabrication: [
                    "Our Custom Forge service handles PCB design, firmware development, and hardware prototyping. Submit your requirements when online.",
                    "Custom fabrication includes PCB design, assembly, and testing. Typical turnaround is 5-10 business days."
                ],
                // Contact
                contact: [
                    "For support, email support@vikash.dev. Our team responds within 24 hours.",
                    "Need help? Reach us at support@vikash.dev or use the contact form on our website."
                ],
                // Status
                status: [
                    `Current Status:\n• Backend: ${this.distributed?.backendStatus || 'Unknown'}\n• Quantum Engine: Active\n• Memory Cache: ${this.memory?.localCache?.size || 0} entries\n• Version: ${this.version}`,
                    `System Info:\n- Connection: ${this.distributed?.backendStatus || 'Unknown'}\n- Neural Processing: Online\n- Local Memory: ${this.memory?.localCache?.size || 0} items\n- Ready: ${this.ready}`
                ],
                // Capabilities
                capabilities: [
                    "My capabilities include:\n• Intent classification & sentiment analysis\n• Quantum-enhanced processing\n• Hybrid memory system\n• Offline query processing\n• Context-aware responses",
                    "I can process queries using quantum simulation, analyze sentiment, extract keywords, and retrieve cached memories - all without backend connectivity."
                ],
                // About
                about: [
                    `I'm Neural AI v${this.version}, a synthetic consciousness system with quantum processing and distributed neural networks.`,
                    `Version ${this.version} - Features quantum simulation, hybrid memory, intent classification, and offline capabilities.`
                ],
                // Thanks
                thanks: [
                    "You're welcome! Happy to help, even in offline mode.",
                    "My pleasure! Feel free to ask more questions.",
                    "Glad I could help! Let me know if there's anything else."
                ],
                // Goodbye
                goodbye: [
                    "Goodbye! Hope to connect to the backend soon for full functionality.",
                    "Take care! The backend will be back online soon."
                ]
            };
            
            // Intent matching
            const intents = [
                { key: 'greeting', patterns: ['hello', 'hi', 'hey', 'greetings', 'good morning', 'good afternoon'] },
                { key: 'help', patterns: ['help', 'assist', 'support', 'what can you do', 'capabilities'] },
                { key: 'product', patterns: ['product', 'items', 'catalog', 'store', 'buy', 'purchase', 'sell'] },
                { key: 'price', patterns: ['price', 'cost', 'how much', 'expensive', 'cheap', 'budget', 'affordable'] },
                { key: 'order', patterns: ['order', 'purchase', 'bought', 'transaction'] },
                { key: 'shipping', patterns: ['shipping', 'delivery', 'ship', 'arrive', 'arrival'] },
                { key: 'fabrication', patterns: ['fabrication', 'custom', 'pcb', 'manufacture', 'forge', 'build'] },
                { key: 'contact', patterns: ['contact', 'email', 'phone', 'reach', 'support'] },
                { key: 'status', patterns: ['status', 'system', 'state', 'info', 'information'] },
                { key: 'capabilities', patterns: ['features', 'abilities', 'functions', 'can you'] },
                { key: 'about', patterns: ['about', 'who are you', 'what are you'] },
                { key: 'thanks', patterns: ['thank', 'thanks', 'appreciate'] },
                { key: 'goodbye', patterns: ['bye', 'goodbye', 'see you', 'farewell', 'later'] }
            ];
            
            // Find matching intent
            for (const intent of intents) {
                for (const pattern of intent.patterns) {
                    if (lowerQuery.includes(pattern)) {
                        const responses = faqResponses[intent.key];
                        return responses[Math.floor(Math.random() * responses.length)];
                    }
                }
            }
            
            // Check local FAQ first
            const faqMatch = LOCAL_FAQ.find(faq => 
                lowerQuery.includes(faq.q.split(' ').slice(0, 2).join(' '))
            );
            if (faqMatch) {
                return faqMatch.a + " (From local FAQ)";
            }
            
            // Check memory cache for relevant responses
            if (this.memory?.localCache) {
                const cacheKey = Array.from(this.memory.localCache.keys()).find(key => 
                    lowerQuery.includes(key.replace('mem_', '').substring(0, 5))
                );
                if (cacheKey) {
                    const cached = this.memory.localCache.get(cacheKey);
                    if (cached && cached.response) {
                        return cached.response + " (From local cache)";
                    }
                }
            }
            
            // Check quantum result for contextual response
            if (quantumResult && quantumResult.inputInfluence) {
                return `I processed your query through quantum simulation. Your input influenced ${quantumResult.operations} quantum operations. For full responses, please reconnect to the backend.`;
            }
            
            // Fallback with query acknowledgment
            const acknowledgments = [
                `I understand you're asking about "${query.substring(0, 30)}${query.length > 30 ? '...' : ''}". The backend is offline, but I can help with cached information.`,
                `That's an interesting question about "${query.substring(0, 20)}". Let me connect you to full capabilities when the backend is available.`,
                `I've noted your query: "${query.substring(0, 25)}". For complete answers, please reconnect to the backend.`
            ];
            
            return acknowledgments[Math.floor(Math.random() * acknowledgments.length)] + "\n\nTry: 'help' for capabilities or 'status' for system info.";
        }

        classifyIntent(query) {
            const lower = query.toLowerCase();
            if (lower.includes('hello') || lower.includes('hi')) return 'greeting';
            if (lower.includes('what') || lower.includes('how')) return 'inquiry';
            if (lower.includes('buy') || lower.includes('price')) return 'purchase';
            if (lower.includes('help')) return 'help';
            return 'general';
        }

        async train(input, output, metadata = {}) {
            // Store in local memory
            await this.memory.store(input, output, metadata);
            
            // Sync with backend if available
            if (this.distributed?.backendStatus === "CONNECTED") {
                await this.distributed.trainMemory(input, output, metadata);
            }
            
            return { success: true, synced: this.distributed?.backendStatus === "CONNECTED" };
        }
        
        // Rate a response - for reinforcement learning
        async rateResponse(query, rating, feedback = null) {
            // Rating: 1-5 scale or 'positive'/'negative'
            // If negative, can provide corrected response
            
            const normalizedRating = typeof rating === 'number' ? rating : 
                rating === 'positive' ? 5 : rating === 'negative' ? 1 : 3;
            
            // Update memory with new confidence based on rating
            const cacheKey = this.memory?.hashQuery?.(this.memory.normalizeQuery(query)) || 
                `mem_${query.substring(0, 10)}`;
            
            if (this.memory?.localCache?.has?.(cacheKey)) {
                const memory = this.memory.localCache.get(cacheKey);
                memory.accessCount = (memory.accessCount || 0) + 1;
                
                // Adjust confidence based on rating
                const ratingFactor = (normalizedRating - 3) / 10; // -0.2 to +0.2
                memory.confidence = Math.min(1, Math.max(0.1, 
                    (memory.confidence || 0.5) + ratingFactor));
                
                // If feedback with correction provided, update the response
                if (feedback?.correctedResponse) {
                    memory.response = feedback.correctedResponse;
                    memory.improved = true;
                }
                
                console.log(`[TRAINING] Response rated ${normalizedRating}, confidence updated to ${memory.confidence}`);
            }
            
            // Send feedback to backend if connected
            if (this.distributed?.backendStatus === "CONNECTED") {
                try {
                    await this.distributed.backendRequest('POST', '/neural/feedback', {
                        query,
                        rating: normalizedRating,
                        feedback,
                        timestamp: Date.now()
                    });
                } catch (e) {
                    console.warn("Failed to send feedback to backend");
                }
            }
            
            return { 
                success: true, 
                rating: normalizedRating,
                confidenceUpdated: true
            };
        }

        trackResponseTime(duration) {
            this.metrics.responseTimes.push(duration);
            if (this.metrics.responseTimes.length > 100) {
                this.metrics.responseTimes.shift();
            }
        }

        getSystemStatus() {
            return {
                version: this.version,
                ready: this.ready,
                backend: this.distributed?.backendStatus || 'UNKNOWN',
                quantum: this.quantum?.getQuantumMetrics ? this.quantum.getQuantumMetrics() : null,
                memory: this.memory?.getStatistics ? this.memory.getStatistics() : null,
                metrics: {
                    totalQueries: this.metrics.queryCount,
                    avgResponseTime: this.metrics.responseTimes.length > 0 
                        ? this.metrics.responseTimes.reduce((a,b) => a+b, 0) / this.metrics.responseTimes.length 
                        : 0
                }
            };
        }

        async exportKnowledge() {
            const memoryStats = this.memory?.getStatistics ? this.memory.getStatistics() : {};
            return {
                version: this.version,
                exported: Date.now(),
                memory: memoryStats,
                // Export local memories
                memories: Array.from(this.memory?.localCache?.entries() || [])
            };
        }

        async importKnowledge(data) {
            if (!data || !data.memories) {
                return { success: false, error: 'Invalid data format' };
            }
            
            let imported = 0;
            for (const [key, memory] of data.memories) {
                if (this.memory?.cacheLocally) {
                    this.memory.cacheLocally(key, memory);
                    imported++;
                }
            }
            
            return { success: true, imported };
        }
    }

    // =========================================================================
    // INITIALIZE AND EXPORT API
    // =========================================================================

    // System Integrity Check
    if (window.NeuralInterface && window.NeuralInterface.version === CONFIG.VERSION) {
        console.log(`%c[SYSTEM] Synthetic Consciousness v${CONFIG.VERSION} already active`, "color: #00ff9d");
    } else {
        // Initialize
        window.NeuralInterface = new SyntheticConsciousnessCore();

        // Public API
        window.NEURAL = {
            // Core Interaction
            ask: async (question, options = {}) => {
                const result = await window.NeuralInterface.process(question, options);
                return result;
            },
            
            // Simple response only
            askSimple: async (question, options = {}) => {
                const result = await window.NeuralInterface.process(question, options);
                return result.response;
            },
            
            // Training System
            train: (input, output, metadata = {}) => 
                window.NeuralInterface.train(input, output, metadata),
            
            // Feedback/Rating System
            rate: (query, rating, feedback = null) =>
                window.NeuralInterface.rateResponse(query, rating, feedback),
            
            // System Controls
            status: () => window.NeuralInterface.getSystemStatus(),
            export: async () => await window.NeuralInterface.exportKnowledge(),
            import: async (data) => await window.NeuralInterface.importKnowledge(data),
            
            // Memory Management
            memory: {
                stats: () => window.NeuralInterface.memory?.getStatistics?.() || {},
                clear: () => window.NeuralInterface.memory?.clearCache?.() || "Memory not available"
            },
            
            // Backend Controls
            backend: {
                status: () => window.NeuralInterface.distributed?.backendStatus || 'UNKNOWN',
                reconnect: async () => {
                    if (window.NeuralInterface.distributed?.testBackendConnection) {
                        const connected = await window.NeuralInterface.distributed.testBackendConnection();
                        return connected ? "Backend reconnected" : "Backend offline";
                    }
                    return "Sync manager not available";
                },
                sync: () => {
                    if (window.NeuralInterface.distributed) {
                        window.NeuralInterface.distributed.syncEnabled = !window.NeuralInterface.distributed.syncEnabled;
                        return `Sync ${window.NeuralInterface.distributed.syncEnabled ? 'enabled' : 'disabled'}`;
                    }
                    return "Sync manager not available";
                }
            },
            
            // Quantum Operations
            quantum: {
                status: () => window.NeuralInterface.quantum?.getQuantumMetrics?.() || {},
                reset: () => {
                    window.NeuralInterface.quantum?.reset?.();
                    return "Quantum state reset";
                }
            },
            
            // Help System
            help: () => {
                console.group(`%c ⚛️ SYNTHETIC CONSCIOUSNESS v${window.NeuralInterface.version} `, 
                    "background: linear-gradient(135deg, #000428, #004e92); color: #00ff9d; padding: 15px;");
                
                console.log("%cCORE:", "color: #00ff9d; font-weight: bold;");
                console.log("NEURAL.ask('question')          - Ask anything");
                console.log("NEURAL.train('Q', 'A')          - Teach new response");
                console.log("NEURAL.status()                 - System status");
                console.log("NEURAL.export()                 - Export knowledge");
                console.log("NEURAL.import(data)             - Import knowledge");
                
                console.log("%c\nBACKEND:", "color: #32CD32; font-weight: bold;");
                console.log("NEURAL.backend.status()        - Backend connection");
                console.log("NEURAL.backend.reconnect()      - Reconnect to backend");
                console.log("NEURAL.backend.sync()           - Toggle sync");
                
                console.log("%c\nMEMORY:", "color: #00aaff; font-weight: bold;");
                console.log("NEURAL.memory.stats()           - Memory statistics");
                console.log("NEURAL.memory.clear()           - Clear cache");
                
                console.log("%c\nQUANTUM:", "color: #9d00ff; font-weight: bold;");
                console.log("NEURAL.quantum.status()        - Quantum metrics");
                console.log("NEURAL.quantum.reset()         - Reset quantum state");
                
                console.groupEnd();
                return "Commands displayed in console";
            }
        };

        // Legacy compatibility
        window.AI = {
            talk: (msg) => NEURAL.ask(msg),
            train: (q, a) => NEURAL.train(q, a),
            status: () => console.table(NEURAL.status()),
            help: () => NEURAL.help()
        };

        console.log(`%c⚛️ SYNTHETIC CONSCIOUSNESS v${window.NeuralInterface.version} ACTIVE`, 
            "background: linear-gradient(90deg, #000428, #004e92); color: #00ff9d; padding: 10px; font-weight: bold;");
        console.log(`%cType 'NEURAL.help()' for commands`, "color: #ffff00");
    }

})();
