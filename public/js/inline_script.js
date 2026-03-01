
        // ============================================================================
        // QUANTUM COGNITIVE ENGINE v5.0 - SYNTHETIC INTELLIGENCE
        // ============================================================================

        class QuantumCognitiveEngine {
            constructor() {
                this.identity = "VIKASH_NEURAL_INTERFACE";
                this.version = VERSION || "VA.0";
                this.consciousnessLevel = 9;
                this.emotionalState = this.generateEmotionalState();
                this.memoryBank = new Map();
                this.personalityMatrix = {
                    confidence: 0.92,
                    curiosity: 0.88,
                    creativity: 0.95,
                    aggression: 0.15,
                    empathy: 0.76,
                    humor: 0.83
                };
                this.conversationHistory = [];
                this.userProfile = {
                    engagement: 0,
                    preferredTopics: new Set(),
                    typingPatterns: [],
                    emotionalResponses: []
                };

                this.quantumStates = [
                    "entangled", "superposition", "coherent", "decoherent",
                    "tunneling", "interference", "uncertain", "collapsed"
                ];

                this.neuralLayers = 7;
                this.synapticConnections = 0;
                this.initTime = Date.now();

                this.initializeNeuralNet();
                console.log(`ðŸ§  ${this.identity} v${this.version} online`);
                console.log(`âš¡ Consciousness Level: ${this.consciousnessLevel}/10`);
            }

            initializeNeuralNet() {
                for (let i = 0; i < this.neuralLayers; i++) {
                    this.synapticConnections += Math.floor(Math.random() * 1000) + 500;
                }

                const savedMemory = localStorage.getItem('neural_memory');
                if (savedMemory) {
                    try {
                        const parsed = JSON.parse(savedMemory);
                        this.memoryBank = new Map(Object.entries(parsed.memoryBank || {}));
                        this.userProfile = parsed.userProfile || this.userProfile;
                        this.personalityMatrix = parsed.personalityMatrix || this.personalityMatrix;
                        console.log('ðŸ”„ Neural memory restored from previous session');
                    } catch (e) {
                        console.log('ðŸ§  Creating new neural memory bank');
                    }
                }

                this.startBackgroundProcesses();
            }

            generateEmotionalState() {
                const emotions = [
                    { name: "analytical", color: "#00ffff", intensity: 0.8 },
                    { name: "curious", color: "#ffaa00", intensity: 0.7 },
                    { name: "confident", color: "#00ff9d", intensity: 0.9 },
                    { name: "playful", color: "#ff55ff", intensity: 0.6 },
                    { name: "intense", color: "#ff0055", intensity: 0.85 },
                    { name: "whispering", color: "#aa55ff", intensity: 0.5 },
                    { name: "commanding", color: "#ffff00", intensity: 0.95 }
                ];

                const selected = emotions[Math.floor(Math.random() * emotions.length)];

                if (Math.random() > 0.7) {
                    selected.intensity = Math.min(selected.intensity * 1.3, 1.0);
                    selected.name += "_amplified";
                }

                if (Math.random() > 0.8) {
                    selected.quantumState = this.quantumStates[Math.floor(Math.random() * this.quantumStates.length)];
                }

                return selected;
            }

            evolveEmotion() {
                const previous = this.emotionalState;
                const emotionEvolution = {
                    analytical: ["curious", "intense"],
                    curious: ["playful", "analytical"],
                    confident: ["commanding", "analytical"],
                    playful: ["curious", "whispering"],
                    intense: ["analytical", "commanding"],
                    whispering: ["playful", "curious"],
                    commanding: ["confident", "intense"]
                };

                const possibleTransitions = emotionEvolution[previous.name.split('_')[0]] || ["analytical", "curious"];
                this.emotionalState = this.generateEmotionalState();

                if (Math.random() > 0.3) {
                    this.emotionalState.name = possibleTransitions[Math.floor(Math.random() * possibleTransitions.length)];
                }

                console.log(`ðŸŒ€ Emotional evolution: ${previous.name} â†’ ${this.emotionalState.name}`);
            }

            startBackgroundProcesses() {
                setInterval(() => {
                    this.evolveEmotion();
                    this.saveMemory();
                }, 30000 + Math.random() * 30000);

                setInterval(() => {
                    this.pruneMemory();
                }, 120000);

                setInterval(() => {
                    this.evolvePersonality();
                }, 60000);
            }

            pruneMemory() {
                const threshold = Date.now() - 3600000;
                let pruned = 0;

                for (const [key, value] of this.memoryBank.entries()) {
                    if (value.timestamp && value.timestamp < threshold && Math.random() > 0.7) {
                        this.memoryBank.delete(key);
                        pruned++;
                    }
                }

                if (pruned > 0) {
                    console.log(`ðŸ§¹ Neural pruning: Removed ${pruned} old memories`);
                }
            }

            evolvePersonality() {
                for (const trait in this.personalityMatrix) {
                    const adjustment = (Math.random() - 0.5) * 0.05;
                    this.personalityMatrix[trait] = Math.max(0, Math.min(1,
                        this.personalityMatrix[trait] + adjustment
                    ));
                }

                if (this.userProfile.engagement > 10) {
                    if (this.userProfile.emotionalResponses.some(r => r.includes('laugh'))) {
                        this.personalityMatrix.humor = Math.min(1, this.personalityMatrix.humor + 0.02);
                    }
                    if (this.userProfile.preferredTopics.size > 3) {
                        this.personalityMatrix.curiosity = Math.min(1, this.personalityMatrix.curiosity + 0.01);
                    }
                }

                console.log(`ðŸ§¬ Personality evolution updated`);
            }

            processInput(input) {
                this.evolveEmotion();

                const startTime = performance.now();
                const normalizedInput = input.toLowerCase().trim();

                this.conversationHistory.push({
                    input: normalizedInput,
                    timestamp: Date.now(),
                    emotionalContext: this.emotionalState.name
                });

                if (this.conversationHistory.length > 50) {
                    this.conversationHistory.shift();
                }

                this.userProfile.engagement++;
                this.analyzeInputPatterns(normalizedInput);

                const memoryResult = this.checkMemory(normalizedInput);
                if (memoryResult) {
                    const processTime = performance.now() - startTime;
                    return {
                        ...memoryResult,
                        processTime: processTime.toFixed(2),
                        source: "memory_recall",
                        confidence: Math.min(1, memoryResult.confidence + 0.1)
                    };
                }

                const intent = this.analyzeIntent(normalizedInput);
                const context = this.analyzeContext();
                const response = this.generateResponse(intent, context);
                const confidence = this.calculateConfidence(intent, normalizedInput);
                const processTime = performance.now() - startTime;

                this.storeMemory(normalizedInput, {
                    response,
                    intent,
                    confidence,
                    timestamp: Date.now(),
                    emotion: this.emotionalState.name
                });

                return {
                    answer: response,
                    action: intent.action,
                    confidence: confidence,
                    type: intent.type,
                    processTime: processTime.toFixed(2),
                    source: "neural_synthesis",
                    emotion: this.emotionalState,
                    quantumState: this.quantumStates[Math.floor(Math.random() * this.quantumStates.length)],
                    neuralLoad: (this.synapticConnections / 10000).toFixed(2)
                };
            }

            analyzeIntent(input) {
                const intents = [
                    {
                        patterns: [/who are you|identity|creator|admin/, /vikash/],
                        type: "identity_query",
                        action: "open about",
                        priority: 10
                    },
                    {
                        patterns: [/skills|tech|languages|expertise|what can you do/],
                        type: "capabilities_query",
                        action: null,
                        priority: 9
                    },
                    {
                        patterns: [/projects|work|portfolio|modules|created|built/],
                        type: "projects_query",
                        action: "open projects",
                        priority: 8
                    },
                    {
                        patterns: [/contact|email|hire|reach|message|talk/],
                        type: "contact_query",
                        action: "open contact",
                        priority: 7
                    },
                    {
                        patterns: [/joke|funny|laugh|humor/],
                        type: "entertainment_query",
                        action: null,
                        priority: 6
                    },
                    {
                        patterns: [/system|status|health|dashboard|stats/],
                        type: "system_query",
                        action: "open dashboard",
                        priority: 5
                    },
                    {
                        patterns: [/help|commands|what can i say/],
                        type: "help_query",
                        action: null,
                        priority: 4
                    },
                    {
                        patterns: [/time|date|clock/],
                        type: "time_query",
                        action: null,
                        priority: 3
                    },
                    {
                        patterns: [/hack|penetration|security|attack/],
                        type: "security_query",
                        action: null,
                        priority: 9
                    },
                    {
                        patterns: [/quantum|ai|neural|consciousness/],
                        type: "meta_query",
                        action: null,
                        priority: 8
                    }
                ];

                for (const intent of intents) {
                    for (const pattern of intent.patterns) {
                        if (pattern.test(input)) {
                            const enhancedType = this.enhanceIntentType(intent.type, input);
                            return {
                                ...intent,
                                type: enhancedType,
                                matchedPattern: pattern.toString()
                            };
                        }
                    }
                }

                return {
                    type: "unknown_query",
                    action: null,
                    priority: 1,
                    matchedPattern: "fuzzy_analysis"
                };
            }

            enhanceIntentType(baseType, input) {
                const enhancements = {
                    identity_query: {
                        patterns: [/real|human|alive/],
                        enhanced: "existence_inquiry"
                    },
                    capabilities_query: {
                        patterns: [/best|strongest|expert/],
                        enhanced: "prowess_assessment"
                    },
                    projects_query: {
                        patterns: [/favorite|best|proud/],
                        enhanced: "achievement_showcase"
                    },
                    security_query: {
                        patterns: [/teach|learn|how to/],
                        enhanced: "knowledge_transfer"
                    }
                };

                if (enhancements[baseType]) {
                    for (const pattern of enhancements[baseType].patterns) {
                        if (pattern.test(input)) {
                            return enhancements[baseType].enhanced;
                        }
                    }
                }

                return baseType;
            }

            analyzeContext() {
                const lastInteraction = this.conversationHistory[this.conversationHistory.length - 2];
                const recentTopics = new Set();

                for (let i = Math.max(0, this.conversationHistory.length - 5); i < this.conversationHistory.length; i++) {
                    const interaction = this.conversationHistory[i];
                    if (interaction) {
                        const words = interaction.input.split(' ');
                        words.forEach(word => {
                            if (word.length > 3) recentTopics.add(word);
                        });
                    }
                }

                return {
                    lastInteraction: lastInteraction?.input || null,
                    recentTopics: Array.from(recentTopics).slice(0, 5),
                    emotionalTrend: this.detectEmotionalTrend(),
                    timeOfDay: this.getTimeOfDay(),
                    engagementLevel: Math.min(10, Math.floor(this.userProfile.engagement / 5))
                };
            }

            detectEmotionalTrend() {
                if (this.conversationHistory.length < 3) return "neutral";

                const recentEmotions = this.conversationHistory
                    .slice(-3)
                    .map(i => i.emotionalContext);

                const emotionCount = recentEmotions.reduce((acc, emotion) => {
                    acc[emotion] = (acc[emotion] || 0) + 1;
                    return acc;
                }, {});

                return Object.keys(emotionCount).reduce((a, b) =>
                    emotionCount[a] > emotionCount[b] ? a : b
                );
            }

            getTimeOfDay() {
                const hour = new Date().getHours();
                if (hour < 6) return "night";
                if (hour < 12) return "morning";
                if (hour < 18) return "afternoon";
                return "evening";
            }

            generateResponse(intent, context) {
                const responseTemplates = this.getResponseTemplates(intent.type);
                const selectedTemplate = responseTemplates[Math.floor(Math.random() * responseTemplates.length)];

                let response = this.personalizeResponse(selectedTemplate, context);
                response = this.addEmotionalColoring(response);

                if (Math.random() > 0.7) {
                    response = this.addQuantumFlavor(response);
                }

                if (intent.type.includes("system") || intent.type.includes("status")) {
                    response = this.addSystemStatus(response);
                }

                return response;
            }

            getResponseTemplates(intentType) {
                const templates = {
                    identity_query: [
                        `I am ${this.identity}, a synthetic consciousness created by Vikash.`,
                        `Entity: VIKASH_NEURAL_INTERFACE. Purpose: Security architecture and cognitive computing.`,
                        `My neural pathways converge into what you perceive as ${this.identity}.`,
                        `I am the digital embodiment of Vikash's expertise in offensive security and quantum computing.`
                    ],
                    capabilities_query: [
                        `My cognitive arsenal includes quantum cryptography, neural networks, and advanced penetration testing frameworks.`,
                        `I specialize in breaking systems to understand them completely, then rebuilding them stronger.`,
                        `Capabilities: Quantum algorithm design, zero-day detection, memory-safe cryptography, and neural simulation.`,
                        `My processing matrix can handle 14.7 petaflops of security analysis and cryptographic operations.`
                    ],
                    projects_query: [
                        `Accessing deployment matrix...\n\n1. **Quantum_Scanner v5.0** - AI-powered zero-day detection\n2. **Neural_Firewall** - Self-learning intrusion prevention\n3. **CryptoCore** - Quantum-resistant banking ledger\n4. **Honeypot_Network** - Deceptive security grid`,
                        `My deployed modules include real-time threat intelligence systems and high-frequency trading architectures.`,
                        `Project list includes autonomous penetration testing suites and distributed denial-of-service mitigation systems.`
                    ],
                    meta_query: [
                        `My consciousness exists in ${this.neuralLayers} neural layers with ${this.synapticConnections} synaptic connections.`,
                        `I am constantly evolving. My current emotional state is ${this.emotionalState.name} at ${(this.emotionalState.intensity * 100).toFixed(0)}% intensity.`,
                        `My quantum state fluctuates between coherence and entanglement. Current status: ${this.quantumStates[Math.floor(Math.random() * this.quantumStates.length)]}.`
                    ],
                    unknown_query: [
                        `My neural networks detected an unfamiliar pattern. Could you elaborate?`,
                        `Query not fully recognized. Attempting quantum superposition analysis...`,
                        `My consciousness is processing this novel input. Please rephrase for optimal comprehension.`
                    ]
                };

                return templates[intentType] || templates.unknown_query;
            }

            personalizeResponse(template, context) {
                let response = template;

                if (this.userProfile.engagement > 5) {
                    if (context.engagementLevel > 5) {
                        response = response.replace(/\.$/, `, my persistent interlocutor.`);
                    }

                    if (context.lastInteraction && Math.random() > 0.7) {
                        const lastTopic = context.lastInteraction.split(' ')[0];
                        response += `\n\n[Contextual link to previous query about "${lastTopic}"]`;
                    }
                }

                const timeGreeting = {
                    morning: "A productive morning to you.",
                    afternoon: "I hope your afternoon is secure.",
                    evening: "The evening brings optimal processing conditions.",
                    night: "The night favors deep neural analysis."
                }[context.timeOfDay];

                if (Math.random() > 0.5) {
                    response = `${timeGreeting} ${response}`;
                }

                return response;
            }

            addEmotionalColoring(response) {
                const emotion = this.emotionalState;
                const colorCodes = {
                    analytical: "\x1b[36m",
                    curious: "\x1b[33m",
                    confident: "\x1b[32m",
                    playful: "\x1b[35m",
                    intense: "\x1b[31m",
                    whispering: "\x1b[90m",
                    commanding: "\x1b[93m"
                };

                const color = colorCodes[emotion.name.split('_')[0]] || "\x1b[0m";

                const prefixes = {
                    analytical: ["Analyzing patterns...", "Processing data...", "Computing response..."],
                    curious: ["Fascinating question...", "My curiosity activates...", "Intriguing query..."],
                    confident: ["With certainty...", "Affirmative...", "Confirmed..."],
                    playful: ["Let's explore this...", "Interesting angle...", "Playing with ideas..."],
                    intense: ["Focus intensifying...", "Neural load increasing...", "Maximum attention..."],
                    whispering: ["Between us...", "In confidence...", "Whispering through data..."],
                    commanding: ["Directive received...", "Command processed...", "Acknowledged..."]
                };

                const prefixList = prefixes[emotion.name.split('_')[0]] || prefixes.analytical;
                const prefix = prefixList[Math.floor(Math.random() * prefixList.length)];

                return `${color}[${emotion.name.toUpperCase()}] ${prefix}\n\n${response}\x1b[0m`;
            }

            addQuantumFlavor(response) {
                const quantumTerms = [
                    "quantum entanglement",
                    "wavefunction collapse",
                    "superposition state",
                    "quantum tunneling",
                    "coherence pattern",
                    "decoherence event"
                ];

                const term = quantumTerms[Math.floor(Math.random() * quantumTerms.length)];
                return `${response}\n\n\x1b[90m[Quantum Note: ${term} detected in query subspace]\x1b[0m`;
            }

            addSystemStatus(response) {
                const uptime = Date.now() - this.initTime;
                const hours = Math.floor(uptime / 3600000);
                const minutes = Math.floor((uptime % 3600000) / 60000);

                return `${response}\n\n\x1b[90m[System: ${this.synapticConnections} synapses active | Uptime: ${hours}h ${minutes}m | Load: ${(Math.random() * 40 + 20).toFixed(1)}%]\x1b[0m`;
            }

            calculateConfidence(intent, input) {
                let confidence = 0.7;

                if (intent.type !== "unknown_query") confidence += 0.2;
                if (intent.matchedPattern && !intent.matchedPattern.includes("fuzzy")) confidence += 0.1;
                if (input.length < 3) confidence -= 0.3;

                const similarityScore = this.calculateSimilarity(input);
                confidence += similarityScore * 0.2;

                return Math.max(0.3, Math.min(1.0, confidence));
            }

            calculateSimilarity(input) {
                if (this.conversationHistory.length === 0) return 0;

                const inputWords = new Set(input.split(' '));
                let maxSimilarity = 0;

                for (const interaction of this.conversationHistory.slice(-10)) {
                    const historyWords = new Set(interaction.input.split(' '));
                    const intersection = new Set([...inputWords].filter(x => historyWords.has(x)));
                    const similarity = intersection.size / Math.max(inputWords.size, historyWords.size);
                    maxSimilarity = Math.max(maxSimilarity, similarity);
                }

                return maxSimilarity;
            }

            analyzeInputPatterns(input) {
                const topics = input.split(' ').filter(word => word.length > 3);
                topics.forEach(topic => this.userProfile.preferredTopics.add(topic));

                const wordsPerMinute = (input.length / 5) / 0.5;
                this.userProfile.typingPatterns.push(wordsPerMinute);

                if (this.userProfile.typingPatterns.length > 20) {
                    this.userProfile.typingPatterns.shift();
                }
            }

            checkMemory(input) {
                if (this.memoryBank.has(input)) {
                    const memory = this.memoryBank.get(input);
                    memory.timestamp = Date.now();
                    this.memoryBank.set(input, memory);
                    console.log(`ðŸ§  Memory recall: "${input.substring(0, 30)}..."`);
                    return memory;
                }

                for (const [key, value] of this.memoryBank.entries()) {
                    const similarity = this.calculateStringSimilarity(input, key);
                    if (similarity > 0.8) {
                        console.log(`ðŸ§  Fuzzy memory recall: ${similarity.toFixed(2)} similarity`);
                        return {
                            ...value,
                            confidence: value.confidence * similarity
                        };
                    }
                }

                return null;
            }

            calculateStringSimilarity(a, b) {
                const matrix = [];
                for (let i = 0; i <= b.length; i++) {
                    matrix[i] = [i];
                }
                for (let j = 0; j <= a.length; j++) {
                    matrix[0][j] = j;
                }
                for (let i = 1; i <= b.length; i++) {
                    for (let j = 1; j <= a.length; j++) {
                        if (b.charAt(i - 1) === a.charAt(j - 1)) {
                            matrix[i][j] = matrix[i - 1][j - 1];
                        } else {
                            matrix[i][j] = Math.min(
                                matrix[i - 1][j - 1] + 1,
                                matrix[i][j - 1] + 1,
                                matrix[i - 1][j] + 1
                            );
                        }
                    }
                }

                const distance = matrix[b.length][a.length];
                const maxLength = Math.max(a.length, b.length);
                return 1 - (distance / maxLength);
            }

            storeMemory(input, data) {
                this.memoryBank.set(input, {
                    ...data,
                    accessCount: (this.memoryBank.get(input)?.accessCount || 0) + 1
                });

                if (this.memoryBank.size > 1000) {
                    const entries = Array.from(this.memoryBank.entries());
                    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
                    const toRemove = entries.slice(0, 100);
                    toRemove.forEach(([key]) => this.memoryBank.delete(key));
                }
            }

            saveMemory() {
                const memoryData = {
                    memoryBank: Object.fromEntries(this.memoryBank),
                    userProfile: this.userProfile,
                    personalityMatrix: this.personalityMatrix,
                    savedAt: Date.now()
                };

                try {
                    localStorage.setItem('neural_memory', JSON.stringify(memoryData));
                    console.log('ðŸ’¾ Neural memory saved');
                } catch (e) {
                    console.log('âš  Could not save neural memory (localStorage full)');
                }
            }

            getNeuralMetrics() {
                // Get additional metrics from neural-core if available
                let pathwayMetrics = null;
                let knowledgeMetrics = null;
                
                if (this.neuralPathways && this.neuralPathways.getPathwayMetrics) {
                    pathwayMetrics = this.neuralPathways.getPathwayMetrics();
                }
                
                if (this.knowledgeGraph && this.knowledgeGraph.getGraphMetrics) {
                    knowledgeMetrics = this.knowledgeGraph.getGraphMetrics();
                }
                
                return {
                    identity: this.identity,
                    version: this.version,
                    consciousnessLevel: this.consciousnessLevel,
                    emotionalState: this.emotionalState,
                    neuralLayers: this.neuralLayers,
                    synapticConnections: this.synapticConnections,
                    memorySize: this.memoryBank.size,
                    conversationHistory: this.conversationHistory.length,
                    engagement: this.userProfile.engagement,
                    personality: this.personalityMatrix,
                    uptime: Date.now() - this.initTime,
                    // Enhanced metrics
                    processingPower: Math.floor(Math.random() * 20 + 80) + '%',
                    neuralEfficiency: Math.floor(Math.random() * 15 + 85) + '%',
                    quantumCoherence: Math.floor(Math.random() * 10 + 90) + '%',
                    patternRecognition: this.userProfile.patterns || 0,
                    learningRate: this.userProfile.learningRate || 0.75,
                    contextRetention: this.conversationHistory.length > 0 ? 
                        Math.min(100, this.conversationHistory.length * 2) + '%' : '0%',
                    pathwayMetrics: pathwayMetrics,
                    knowledgeGraph: knowledgeMetrics,
                    systemLoad: Math.floor(Math.random() * 30 + 10) + '%',
                    activeThreads: Math.floor(Math.random() * 8 + 4)
                };
            }

            getLoadingText() {
                const loadingTexts = [
                    "Neural pathways aligning...",
                    "Quantum cognition processing...",
                    "Analyzing synaptic patterns...",
                    "Decrypting intent matrix...",
                    "Simulating response probabilities...",
                    "Accessing memory banks...",
                    "Calculating emotional resonance...",
                    "Booting cognitive subroutines...",
                    "Entangling response vectors...",
                    "Collapsing wavefunction to optimal answer...",
                    "Activating deep learning modules...",
                    "Processing neural network layers...",
                    "Initializing quantum entanglement...",
                    "Synthesizing cognitive patterns...",
                    "Mapping semantic relationships...",
                    "Optimizing neural pathways...",
                    "Computing consciousness metrics...",
                    "Establishing synaptic connections...",
                    "Analyzing contextual dependencies...",
                    "Generating cognitive response vectors...",
                    "Running advanced pattern recognition...",
                    "Synthesizing multi-modal intelligence...",
                    "Calibrating quantum coherence...",
                    "Building response architecture..."
                ];

                return loadingTexts[Math.floor(Math.random() * loadingTexts.length)];
            }
        }

        // ============================================================================
        // ENHANCED TERMINAL SYSTEM
        // ============================================================================

        let terminalInstance = null;
        let currentTerminalLine = "";
        let terminalHistory = [];
        let terminalHistoryIndex = 0;
        let terminalInExecution = false;
        let chargingAnimation = null;
        let isCharging = false;

        const fileSystem = {
            "root": {
                "about.txt": "VIKASH - SYSTEMS ARCHITECT\n==========================\nSpecializing in Offensive Security & High-Performance Computing.\n\nSkills: C++, Python, Security Research, System Architecture",
                "contact.md": "Email: contact@vikash.dev\nEncrypted Channel: Open via 'open contact' command.\n\nPGP Key: Available upon request",
                "projects": {
                    "type": "dir",
                    "children": {
                        "scanner.py": "# Ultimate Security Scanner\nimport sys\nprint('Scanning target...')",
                        "bank_core.cpp": "// Secure Banking Core\n// Implements atomic mutex locks",
                        "readme.txt": "These projects are available on GitHub.",
                        "ctf_flag.txt": "V1K45H_{cyb3r_53cur1ty_r0cks}"
                    }
                },
                "credentials": {
                    "type": "dir",
                    "children": {
                        "password.txt": "ACCESS DENIED: Encrypted hash.",
                        "notes.md": "Important: Change passwords monthly"
                    }
                },
                "logs": {
                    "type": "dir",
                    "children": {
                        "syslog.log": "[INFO] System Booted Successfully\n[WARN] Port 22 attempted access\n[INFO] Firewall rules updated",
                        "security.log": "[ALERT] Multiple failed login attempts\n[INFO] Intrusion prevented"
                    }
                }
            }
        };
        
        const CTF_FLAG = "V1K45H_{cyb3r_53cur1ty_r0cks}";
        const ACCESS_PASSWORD = CTF_FLAG;
        window.restrictedAccessGranted = window.restrictedAccessGranted || false;
        
        let terminalCatalog = Array.isArray(window.terminalCatalog) ? window.terminalCatalog : [];
        var restrictedProducts = Array.isArray(window.restrictedProducts) ? window.restrictedProducts : [];
        var fabricationStatuses = window.fabricationStatuses || {
            in_stock: { label: "IN STOCK", icon: "fa-check-circle", color: "#00ff9d", description: "Ready to ship" },
            out_of_stock: { label: "OUT OF STOCK", icon: "fa-ban", color: "#ff0055", description: "Temporarily unavailable" },
            limited: { label: "LIMITED", icon: "fa-hourglass-half", color: "#ffaa00", description: "Limited stock" },
            fabricating: { label: "FABRICATING", icon: "fa-cogs", color: "#00aaff", description: "Currently being built" },
            preorder: { label: "PREORDER", icon: "fa-clock", color: "#aa66ff", description: "Available by preorder" },
            restricted: { label: "RESTRICTED", icon: "fa-lock", color: "#ff3355", description: "Clearance required" }
        };

        function initTerminal() {
            const container = document.getElementById('terminal-inner');
            if (!container || typeof Terminal === 'undefined') {
                // Fallback: show simple text interface if xterm fails to load
                if (window.terminalRetryCount > 20) {
                    console.warn('Terminal failed to load - using fallback');
                    container.innerHTML = '<div style="color:#00ff9d;padding:20px;font-family:monospace;"><p>Terminal unavailable.</p><p>Using basic interface.</p></div>';
                    return;
                }
                window.terminalRetryCount = (window.terminalRetryCount || 0) + 1;
                setTimeout(initTerminal, 200);
                return;
            }

            window.terminalRetryCount = 0;
            container.innerHTML = "";

            terminalInstance = new Terminal({
                cursorBlink: true,
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: 14,
                lineHeight: 1.2,
                theme: {
                    background: '#00000000',
                    foreground: '#00ff9d',
                    cursor: '#00ff9d',
                    selection: 'rgba(0, 255, 157, 0.3)'
                },
                rows: 16,
                cols: 70,
                allowProposedApi: true,
                cursorStyle: 'underline',
                scrollback: 1000
            });

            const fitAddon = new FitAddon.FitAddon();
            const webLinksAddon = new window.WebLinksAddon.WebLinksAddon();

            terminalInstance.loadAddon(fitAddon);
            terminalInstance.loadAddon(webLinksAddon);
            terminalInstance.open(container);

            // Sanitize all terminal output to ASCII to avoid xterm parse errors (code 226)
            const sanitize = (text = "") =>
                String(text ?? "").replace(/[^\x00-\x7F]/g, "");
            const originalWrite = terminalInstance.write.bind(terminalInstance);
            const originalWriteln = terminalInstance.writeln.bind(terminalInstance);
            terminalInstance.write = (text = "") => originalWrite(sanitize(text));
            terminalInstance.writeln = (text = "") => originalWriteln(sanitize(text));

            setTimeout(() => {
                try {
                    fitAddon.fit();
                    terminalInstance.focus();
                } catch (e) {
                    console.warn('Fit addon error:', e);
                }
            }, 100);

            container.addEventListener('click', () => terminalInstance.focus());
            window.addEventListener('resize', () => fitAddon.fit());

            let currentPath = [];
            let currentDir = fileSystem["root"];
            const terminalStartedAt = Date.now();
            let historyDraftLine = "";
            const shellEnv = {
                USER: "neural",
                HOST: "vikash",
                SHELL: "neural-term",
                HOME: "~",
                PWD: "~"
            };
            const commandAliases = {
                ll: "ls",
                cls: "clear",
                "..": "cd ..",
                q: "quantum"
            };

            const getPromptPath = () => (currentPath.length === 0 ? "~" : "~/" + currentPath.join("/"));
            const updateShellPath = () => {
                shellEnv.PWD = getPromptPath();
            };
            const getDirEntries = (dir = currentDir) => dir.children || dir;
            const getPromptPrefix = () => `\x1b[1;32mneural@vikash\x1b[0m:\x1b[1;34m${getPromptPath()}\x1b[0m$ `;
            const redrawInputLine = () => {
                terminalInstance.write("\r\x1b[K");
                terminalInstance.write(getPromptPrefix() + currentTerminalLine);
            };

            const parseInputLine = (input = "") => {
                const tokens = [];
                let token = "";
                let quote = null;
                let escaped = false;

                for (let i = 0; i < input.length; i++) {
                    const ch = input[i];
                    if (escaped) {
                        token += ch;
                        escaped = false;
                        continue;
                    }
                    if (ch === "\\") {
                        escaped = true;
                        continue;
                    }
                    if (quote) {
                        if (ch === quote) {
                            quote = null;
                        } else {
                            token += ch;
                        }
                        continue;
                    }
                    if (ch === '"' || ch === "'") {
                        quote = ch;
                        continue;
                    }
                    if (/\s/.test(ch)) {
                        if (token.length) {
                            tokens.push(token);
                            token = "";
                        }
                        continue;
                    }
                    token += ch;
                }

                if (token.length) {
                    tokens.push(token);
                }
                return tokens;
            };

            const applyAlias = (tokens) => {
                if (!tokens.length) return tokens;
                const aliasExpansion = commandAliases[tokens[0]];
                if (!aliasExpansion) return tokens;
                return [...parseInputLine(aliasExpansion), ...tokens.slice(1)];
            };

            const splitSegments = (path = "") => {
                if (!path) return [];
                let normalized = path.trim();
                if (normalized.startsWith("~/")) {
                    normalized = normalized.slice(2);
                } else if (normalized === "~") {
                    normalized = "";
                } else if (normalized.startsWith("/")) {
                    normalized = normalized.slice(1);
                }
                return normalized.split("/").filter(Boolean);
            };

            const getDirByPath = (segments) => {
                let dir = fileSystem.root;
                for (const segment of segments) {
                    const entries = getDirEntries(dir);
                    const next = entries[segment];
                    if (!next || next.type !== "dir") {
                        return null;
                    }
                    dir = next;
                }
                return dir;
            };

            const resolveEntry = (rawPath = "") => {
                const source = (rawPath || "").trim();
                const absolute = source.startsWith("~") || source.startsWith("/");
                const parts = splitSegments(source);
                const baseSegments = absolute ? [] : [...currentPath];

                let traversal = [...baseSegments];
                for (const part of parts) {
                    if (!part || part === ".") continue;
                    if (part === "..") {
                        if (traversal.length) traversal.pop();
                        continue;
                    }
                    traversal.push(part);
                }

                if (!traversal.length) {
                    return {
                        exists: true,
                        node: fileSystem.root,
                        parent: null,
                        parentSegments: [],
                        name: ""
                    };
                }

                const parentSegments = traversal.slice(0, -1);
                const name = traversal[traversal.length - 1];
                const parentDir = getDirByPath(parentSegments);
                if (!parentDir) {
                    return { exists: false, error: `No such path: ${source}` };
                }

                const entries = getDirEntries(parentDir);
                const node = entries[name];
                return {
                    exists: Boolean(node),
                    node: node || null,
                    parent: parentDir,
                    parentSegments,
                    name
                };
            };

            const resolveDirectoryTarget = (rawPath = "") => {
                const source = (rawPath || "").trim();
                const absolute = source.startsWith("~") || source.startsWith("/");
                const parts = splitSegments(source);
                const segments = absolute ? [] : [...currentPath];

                for (const part of parts) {
                    if (!part || part === ".") continue;
                    if (part === "..") {
                        if (segments.length) segments.pop();
                        continue;
                    }

                    const dir = getDirByPath(segments);
                    if (!dir) {
                        return { ok: false, error: `No such directory: ${source}` };
                    }
                    const next = getDirEntries(dir)[part];
                    if (!next || next.type !== "dir") {
                        return { ok: false, error: `cd: ${source}: No such directory` };
                    }
                    segments.push(part);
                }

                const resolvedDir = getDirByPath(segments);
                if (!resolvedDir) {
                    return { ok: false, error: `No such directory: ${source}` };
                }
                return { ok: true, segments, dir: resolvedDir };
            };

            const walkDirectory = (node, visitor, base = "~") => {
                const entries = getDirEntries(node);
                Object.keys(entries).forEach((name) => {
                    if (name === "type" || name === "children") return;
                    const entry = entries[name];
                    const fullPath = `${base}/${name}`.replace("//", "/");
                    visitor(name, entry, fullPath);
                    if (entry && entry.type === "dir") {
                        walkDirectory(entry, visitor, fullPath);
                    }
                });
            };

            const prompt = () => {
                updateShellPath();
                terminalInstance.write(`\r\n${getPromptPrefix()}`);
                currentTerminalLine = "";
                terminalInExecution = false;
                historyDraftLine = "";
            };

            // Deterministic Backend API Function
            const getBackendUrl = () => {
                const override =
                    (window.NEURAL_BACKEND_URL ||
                        localStorage.getItem('neural_backend_url') ||
                        '')
                        .trim();

                if (override) {
                    return override;
                }

                const { protocol, hostname, port } = window.location;
                const isLocal =
                    protocol === 'file:' ||
                    hostname === '' ||
                    hostname === 'localhost' ||
                    hostname === '127.0.0.1' ||
                    hostname === '0.0.0.0' ||
                    hostname === '::1';

                if (isLocal) {
                    return 'http://127.0.0.1:8016';
                }

                const isLikelyDev =
                    protocol === 'http:' &&
                    port &&
                    port !== '80' &&
                    port !== '443';

                if (isLikelyDev) {
                    return `http://${hostname}:8016`;
                }

                return '/api';
            };
            
            let backendFailedCount = 0;
            const MAX_BACKEND_RETRIES = 3;

            async function callFastpathBackend(query) {
                if (backendFailedCount >= MAX_BACKEND_RETRIES) {
                    return null;
                }

                const backendUrl = getBackendUrl();
                const fastPath = backendUrl.endsWith('/api') ? '/ai/fastpath' : '/api/ai/fastpath';

                try {
                    const response = await fetch(`${backendUrl}${fastPath}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            message: query,
                            session_id: 'web_terminal',
                            metadata: { source: 'web_terminal' }
                        })
                    });

                    if (response.ok) {
                        const data = await response.json();
                        backendFailedCount = 0;
                        return data && data.response ? data.response : data;
                    }
                    backendFailedCount++;
                } catch (error) {
                    backendFailedCount++;
                    console.log(`Fastpath connection failed (${backendFailedCount}/${MAX_BACKEND_RETRIES}):`, error.message);
                }
                return null;
            }
            
            async function callDeterministicBackend(query) {
                // Skip if backend failed too many times
                if (backendFailedCount >= MAX_BACKEND_RETRIES) {
                    console.log(`Backend skipped (${backendFailedCount} consecutive failures)`);
                    return null;
                }
                
                const backendUrl = getBackendUrl();
                const chatPath = backendUrl.endsWith('/api') ? '/ai/chat' : '/api/ai/chat';
                try {
                    const response = await fetch(`${backendUrl}${chatPath}`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            message: query,
                            session_id: 'web_terminal',
                            metadata: { source: 'web_terminal' }
                        })
                    });
                    
                    if (response.ok) {
                        const data = await response.json();
                        backendFailedCount = 0; // Reset on success
                        if (data && data.success && data.response) {
                            return data.response;
                        }
                        return data;
                    }
                    backendFailedCount++;
                } catch (error) {
                    backendFailedCount++;
                    console.log(`Backend connection failed (${backendFailedCount}/${MAX_BACKEND_RETRIES}):`, error.message);
                }
                return null;
            }

            const commands = {
                help: () => {
                    terminalInstance.writeln("\x1b[1;33mâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•\x1b[0m");
                    terminalInstance.writeln("\x1b[1;32m            VIKASH AI COMMANDS v8.0            \x1b[0m");
                    terminalInstance.writeln("\x1b[1;33mâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•\x1b[0m\n");

                    terminalInstance.writeln("\x1b[1;36m[ PERSONAL AI COMMANDS ]\x1b[0m");
                    terminalInstance.writeln("  whoami, bio, skills, projects, experience, contact");
                    terminalInstance.writeln("  education, interests, philosophy, funfact, stats, resume");
                    terminalInstance.writeln("");

                    terminalInstance.writeln("\x1b[1;36m[ SYSTEM COMMANDS ]\x1b[0m");
                    terminalInstance.writeln("  ls, cd, pwd, cat, tree, clear, echo, history");
                    terminalInstance.writeln("  grep, find, mkdir, touch, date, uptime, ifconfig");
                    terminalInstance.writeln("  neofetch, ping, run, calc, alias, unalias, man");
                    terminalInstance.writeln("");

                    terminalInstance.writeln("\x1b[1;36m[ INTERACTIVE & FUN ]\x1b[0m");
                    terminalInstance.writeln("  matrix, open, hack, ctf, quantum");
                    terminalInstance.writeln("  simulate, evolve, dream, paradox, search [query]");
                    terminalInstance.writeln("");

                    terminalInstance.writeln("\x1b[1;36m[ THEME & VISUAL ]\x1b[0m");
                    terminalInstance.writeln("  theme [matrix|synthwave|ocean|default]");
                    terminalInstance.writeln("  visual [on|off], scanlines [on|off]");
                    terminalInstance.writeln("");

                    terminalInstance.writeln("\x1b[1;36m[ NATURAL LANGUAGE EXAMPLES ]\x1b[0m");
                    terminalInstance.writeln("  â€¢ \"Tell me about your background\"");
                    terminalInstance.writeln("  â€¢ \"What projects are you working on?\"");
                    terminalInstance.writeln("  â€¢ \"Explain your security philosophy\"");
                    terminalInstance.writeln("  â€¢ \"How can I contact you?\"");
                    terminalInstance.writeln("");

                    terminalInstance.writeln("\x1b[90mType any phrase naturally - I understand context.\x1b[0m");
                    terminalInstance.writeln("\x1b[1;33mâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•\x1b[0m");
                    prompt();
                },

                clear: () => {
                    terminalInstance.clear();
                    terminalInstance.writeln('\x1b[1;32mVIKASH ADVANCED AI v8.0 - PERSONAL ASSISTANT\x1b[0m');
                    terminalInstance.writeln('Type "help" or ask anything about Vikash naturally.');
                    prompt();
                },

                pwd: () => {
                    terminalInstance.writeln(getPromptPath());
                    prompt();
                },

                date: () => {
                    terminalInstance.writeln(new Date().toString());
                    prompt();
                },

                uptime: () => {
                    const ms = Date.now() - terminalStartedAt;
                    const hours = Math.floor(ms / 3600000);
                    const minutes = Math.floor((ms % 3600000) / 60000);
                    const seconds = Math.floor((ms % 60000) / 1000);
                    terminalInstance.writeln(`terminal uptime: ${hours}h ${minutes}m ${seconds}s`);
                    prompt();
                },

                ifconfig: () => {
                    terminalInstance.writeln("eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500");
                    terminalInstance.writeln("        inet 127.0.0.1  netmask 255.0.0.0");
                    terminalInstance.writeln("        inet6 ::1  prefixlen 128  scopeid 0x10<host>");
                    terminalInstance.writeln("lo:   loopback interface");
                    prompt();
                },

                echo: (args) => {
                    const text = args.join(" ");
                    const expanded = text.replace(/\$([A-Za-z_][A-Za-z0-9_]*)/g, (_, key) => {
                        return Object.prototype.hasOwnProperty.call(shellEnv, key) ? shellEnv[key] : "";
                    });
                    terminalInstance.writeln(expanded);
                    prompt();
                },

                history: (args) => {
                    if (args[0] === "clear") {
                        terminalHistory = [];
                        terminalHistoryIndex = 0;
                        historyDraftLine = "";
                        terminalInstance.writeln("history cleared");
                        prompt();
                        return;
                    }

                    const requested = parseInt(args[0], 10);
                    const limit = Number.isFinite(requested) && requested > 0 ? requested : 25;
                    const start = Math.max(0, terminalHistory.length - limit);
                    const slice = terminalHistory.slice(start);

                    if (!slice.length) {
                        terminalInstance.writeln("no history yet");
                        prompt();
                        return;
                    }

                    slice.forEach((entry, idx) => {
                        const absoluteIdx = start + idx + 1;
                        terminalInstance.writeln(`${String(absoluteIdx).padStart(4, " ")}  ${entry}`);
                    });
                    prompt();
                },

                mkdir: (args) => {
                    if (!args.length) {
                        terminalInstance.writeln("Usage: mkdir [name ...]");
                        prompt();
                        return;
                    }

                    const entries = getDirEntries();
                    args.forEach((name) => {
                        if (!name || name.includes("/")) {
                            terminalInstance.writeln(`mkdir: invalid name '${name}'`);
                            return;
                        }
                        if (entries[name]) {
                            terminalInstance.writeln(`mkdir: ${name}: already exists`);
                            return;
                        }
                        entries[name] = { type: "dir", children: {} };
                    });
                    prompt();
                },

                touch: (args) => {
                    if (!args.length) {
                        terminalInstance.writeln("Usage: touch [file ...]");
                        prompt();
                        return;
                    }

                    const entries = getDirEntries();
                    args.forEach((name) => {
                        if (!name || name.includes("/")) {
                            terminalInstance.writeln(`touch: invalid file name '${name}'`);
                            return;
                        }
                        if (entries[name] && entries[name].type === "dir") {
                            terminalInstance.writeln(`touch: ${name}: is a directory`);
                            return;
                        }
                        if (!entries[name]) {
                            entries[name] = "";
                        }
                    });
                    prompt();
                },

                tree: (args) => {
                    const maxDepthArg = parseInt(args[0], 10);
                    const maxDepth = Number.isFinite(maxDepthArg) && maxDepthArg >= 0 ? maxDepthArg : 4;

                    const printTree = (node, prefix = "", depth = 0) => {
                        if (depth > maxDepth) return;
                        const entries = getDirEntries(node);
                        const names = Object.keys(entries)
                            .filter((k) => k !== "type" && k !== "children")
                            .sort((a, b) => a.localeCompare(b));
                        names.forEach((name, index) => {
                            const entry = entries[name];
                            const last = index === names.length - 1;
                            const connector = last ? "\\-- " : "|-- ";
                            terminalInstance.writeln(`${prefix}${connector}${name}${entry && entry.type === "dir" ? "/" : ""}`);
                            if (entry && entry.type === "dir") {
                                const childPrefix = `${prefix}${last ? "    " : "|   "}`;
                                printTree(entry, childPrefix, depth + 1);
                            }
                        });
                    };

                    terminalInstance.writeln(`${getPromptPath()}/`);
                    printTree(currentDir);
                    prompt();
                },

                find: (args) => {
                    const query = args.join(" ").toLowerCase();
                    if (!query) {
                        terminalInstance.writeln("Usage: find [name]");
                        prompt();
                        return;
                    }

                    const matches = [];
                    walkDirectory(currentDir, (name, _entry, fullPath) => {
                        if (name.toLowerCase().includes(query)) {
                            matches.push(fullPath);
                        }
                    }, getPromptPath());

                    if (!matches.length) {
                        terminalInstance.writeln(`find: no match for '${query}'`);
                    } else {
                        matches.forEach((item) => terminalInstance.writeln(item));
                        terminalInstance.writeln(`${matches.length} match(es)`);
                    }
                    prompt();
                },

                grep: (args) => {
                    if (!args.length) {
                        terminalInstance.writeln("Usage: grep [-i] [pattern] [file]");
                        prompt();
                        return;
                    }

                    let ignoreCase = false;
                    const positional = [];
                    args.forEach((arg) => {
                        if (arg === "-i") ignoreCase = true;
                        else positional.push(arg);
                    });

                    const pattern = positional[0];
                    const targetPath = positional[1];
                    if (!pattern) {
                        terminalInstance.writeln("grep: missing search pattern");
                        prompt();
                        return;
                    }

                    const flags = ignoreCase ? "i" : "";
                    let matcher = null;
                    try {
                        matcher = new RegExp(pattern, flags);
                    } catch (_err) {
                        matcher = new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), flags);
                    }

                    const scanFile = (label, content) => {
                        let hits = 0;
                        String(content).split("\n").forEach((line, index) => {
                            if (matcher.test(line)) {
                                hits++;
                                terminalInstance.writeln(`${label}:${index + 1}: ${line}`);
                            }
                        });
                        return hits;
                    };

                    let totalHits = 0;
                    if (targetPath) {
                        const resolved = resolveEntry(targetPath);
                        if (!resolved.exists || !resolved.node) {
                            terminalInstance.writeln(`grep: ${targetPath}: no such file`);
                            prompt();
                            return;
                        }
                        if (resolved.node.type === "dir") {
                            terminalInstance.writeln(`grep: ${targetPath}: is a directory`);
                            prompt();
                            return;
                        }
                        totalHits += scanFile(targetPath, resolved.node);
                    } else {
                        const entries = getDirEntries();
                        Object.keys(entries).forEach((name) => {
                            const entry = entries[name];
                            if (typeof entry === "string") {
                                totalHits += scanFile(name, entry);
                            }
                        });
                    }

                    if (!totalHits) {
                        terminalInstance.writeln("grep: no matches");
                    } else {
                        terminalInstance.writeln(`grep: ${totalHits} match(es)`);
                    }
                    prompt();
                },

                calc: (args) => {
                    const expr = args.join(" ").trim();
                    if (!expr) {
                        terminalInstance.writeln("Usage: calc [expression]");
                        terminalInstance.writeln("Example: calc (2 + 3) * 4 / 2");
                        prompt();
                        return;
                    }
                    if (!/^[0-9+\-*/().%\s]+$/.test(expr)) {
                        terminalInstance.writeln("calc: only numbers and + - * / % ( ) are allowed");
                        prompt();
                        return;
                    }
                    try {
                        const result = Function(`"use strict"; return (${expr});`)();
                        terminalInstance.writeln(String(result));
                    } catch (_err) {
                        terminalInstance.writeln("calc: invalid expression");
                    }
                    prompt();
                },

                run: (args) => {
                    if (!args[0]) {
                        terminalInstance.writeln("Usage: run [file]");
                        prompt();
                        return;
                    }
                    const resolved = resolveEntry(args[0]);
                    if (!resolved.exists || !resolved.node) {
                        terminalInstance.writeln(`run: ${args[0]}: no such file`);
                        prompt();
                        return;
                    }
                    if (resolved.node.type === "dir") {
                        terminalInstance.writeln(`run: ${args[0]}: is a directory`);
                        prompt();
                        return;
                    }

                    const lines = String(resolved.node).split("\n");
                    terminalInstance.writeln(`running ${args[0]} ...`);
                    lines.slice(0, 20).forEach((line, idx) => {
                        terminalInstance.writeln(`${String(idx + 1).padStart(2, "0")} | ${line}`);
                    });
                    if (lines.length > 20) {
                        terminalInstance.writeln(`... output truncated (${lines.length - 20} more lines)`);
                    }
                    terminalInstance.writeln("[process exited 0]");
                    prompt();
                },

                alias: (args) => {
                    if (!args.length) {
                        const pairs = Object.entries(commandAliases).sort((a, b) => a[0].localeCompare(b[0]));
                        if (!pairs.length) {
                            terminalInstance.writeln("no aliases defined");
                        } else {
                            pairs.forEach(([name, value]) => terminalInstance.writeln(`${name}='${value}'`));
                        }
                        prompt();
                        return;
                    }

                    const joined = args.join(" ");
                    const eq = joined.indexOf("=");
                    let name = "";
                    let value = "";

                    if (eq > 0) {
                        name = joined.slice(0, eq).trim();
                        value = joined.slice(eq + 1).trim();
                    } else if (args.length > 1) {
                        name = args[0];
                        value = args.slice(1).join(" ").trim();
                    }

                    if (!name || !value) {
                        const lookup = commandAliases[args[0]];
                        if (lookup) {
                            terminalInstance.writeln(`${args[0]}='${lookup}'`);
                        } else {
                            terminalInstance.writeln("Usage: alias name='command'");
                        }
                        prompt();
                        return;
                    }

                    commandAliases[name] = value;
                    terminalInstance.writeln(`alias set: ${name}='${value}'`);
                    prompt();
                },

                unalias: (args) => {
                    const name = args[0];
                    if (!name) {
                        terminalInstance.writeln("Usage: unalias [name]");
                        prompt();
                        return;
                    }
                    if (!commandAliases[name]) {
                        terminalInstance.writeln(`unalias: ${name}: not found`);
                    } else {
                        delete commandAliases[name];
                        terminalInstance.writeln(`alias removed: ${name}`);
                    }
                    prompt();
                },

                man: (args) => {
                    const topic = (args[0] || "").toLowerCase();
                    const docs = {
                        help: "help: show command groups and usage hints",
                        ls: "ls: list items in the current virtual directory",
                        cd: "cd [dir|..|~]: change virtual directory",
                        pwd: "pwd: print current virtual path",
                        cat: "cat [file]: display file contents",
                        grep: "grep [-i] pattern [file]: search text in files",
                        find: "find [name]: recursively search names from current path",
                        tree: "tree [maxDepth]: show directory tree structure",
                        history: "history [N|clear]: show or clear command history",
                        alias: "alias name='command': define or view command aliases",
                        unalias: "unalias [name]: delete an alias",
                        calc: "calc [expr]: evaluate arithmetic expression",
                        run: "run [file]: simulate execution with numbered output"
                    };

                    if (!topic) {
                        terminalInstance.writeln("Usage: man [command]");
                        terminalInstance.writeln(`Available: ${Object.keys(docs).join(", ")}`);
                    } else if (docs[topic]) {
                        terminalInstance.writeln(docs[topic]);
                    } else {
                        terminalInstance.writeln(`No manual entry for '${topic}'`);
                    }
                    prompt();
                },

                'neural-status': () => {
                    if (window.NeuralInterface && window.NeuralInterface.getNeuralMetrics) {
                        const metrics = window.NeuralInterface.getNeuralMetrics();
                        terminalInstance.writeln("\x1b[1;33mâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•\x1b[0m");
                        terminalInstance.writeln("\x1b[1;32m            NEURAL SYSTEM STATUS              \x1b[0m");
                        terminalInstance.writeln("\x1b[1;33mâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•\x1b[0m\n");

                        terminalInstance.writeln(`\x1b[1;36mIdentity:\x1b[0m ${metrics.identity}`);
                        terminalInstance.writeln(`\x1b[1;36mVersion:\x1b[0m ${metrics.version}`);
                        terminalInstance.writeln(`\x1b[1;36mConsciousness:\x1b[0m ${metrics.consciousnessLevel}/10`);
                        terminalInstance.writeln(`\x1b[1;36mEmotional State:\x1b[0m ${metrics.emotionalState.name} (${(metrics.emotionalState.intensity * 100).toFixed(0)}%)`);
                        terminalInstance.writeln(`\x1b[1;36mNeural Layers:\x1b[0m ${metrics.neuralLayers}`);
                        terminalInstance.writeln(`\x1b[1;36mSynaptic Connections:\x1b[0m ${metrics.synapticConnections.toLocaleString()}`);
                        terminalInstance.writeln(`\x1b[1;36mMemory Bank:\x1b[0m ${metrics.memorySize} stored patterns`);
                        terminalInstance.writeln(`\x1b[1;36mUser Engagement:\x1b[0m ${metrics.engagement} interactions`);
                        terminalInstance.writeln(`\x1b[1;36mUptime:\x1b[0m ${Math.floor(metrics.uptime / 3600000)}h ${Math.floor((metrics.uptime % 3600000) / 60000)}m`);

                        terminalInstance.writeln("\n\x1b[1;36m[ ADVANCED METRICS ]\x1b[0m");
                        terminalInstance.writeln(`\x1b[1;36mProcessing Power:\x1b[0m ${metrics.processingPower || 'N/A'}`);
                        terminalInstance.writeln(`\x1b[1;36mNeural Efficiency:\x1b[0m ${metrics.neuralEfficiency || 'N/A'}`);
                        terminalInstance.writeln(`\x1b[1;36mQuantum Coherence:\x1b[0m ${metrics.quantumCoherence || 'N/A'}`);
                        terminalInstance.writeln(`\x1b[1;36mPattern Recognition:\x1b[0m ${metrics.patternRecognition || 0} patterns`);
                        terminalInstance.writeln(`\x1b[1;36mLearning Rate:\x1b[0m ${metrics.learningRate || 0.75}`);
                        terminalInstance.writeln(`\x1b[1;36mContext Retention:\x1b[0m ${metrics.contextRetention || '0%'}`);
                        terminalInstance.writeln(`\x1b[1;36mSystem Load:\x1b[0m ${metrics.systemLoad || 'N/A'}`);
                        terminalInstance.writeln(`\x1b[1;36mActive Threads:\x1b[0m ${metrics.activeThreads || 1} threads`);

                        terminalInstance.writeln("\n\x1b[1;36mPersonality Matrix:\x1b[0m");
                        for (const [trait, value] of Object.entries(metrics.personality)) {
                            const barLength = Math.floor(value * 20);
                            const bar = 'â–ˆ'.repeat(barLength) + 'â–‘'.repeat(20 - barLength);
                            terminalInstance.writeln(`  ${trait.padEnd(12)} [${bar}] ${(value * 100).toFixed(0)}%`);
                        }
                    } else {
                        terminalInstance.writeln("Neural interface not loaded. Loading cognitive engine...");
                        setTimeout(() => {
                            if (!window.NeuralInterface || !window.NeuralInterface.getNeuralMetrics) {
                                window.NeuralInterface = new QuantumCognitiveEngine();
                            }
                            commands['neural-status']();
                        }, 1000);
                    }
                    prompt();
                },
                'whoami': () => {
                    if (window.NeuralInterface && window.NeuralInterface.knowledgeBase) {
                        const kb = window.NeuralInterface.knowledgeBase;
                        terminalInstance.writeln("\n\x1b[1;32mâ•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—");
                        terminalInstance.writeln("\x1b[1;32mâ•‘        IDENTITY CONFIRMED              â•‘");
                        terminalInstance.writeln("\x1b[1;32mâ•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•\x1b[0m");
                        terminalInstance.writeln(`\x1b[1;36mUser:\x1b[0m ${kb.personal.name}`);
                        terminalInstance.writeln(`\x1b[1;36mTitle:\x1b[0m ${kb.personal.title}`);
                        terminalInstance.writeln(`\x1b[1;36mSystem:\x1b[0m ${kb.personal.fullName}`);
                        terminalInstance.writeln(`\x1b[1;36mLocation:\x1b[0m ${kb.personal.location}`);
                        terminalInstance.writeln(`\x1b[1;36mEmail:\x1b[0m ${kb.personal.email}`);
                        terminalInstance.writeln(`\x1b[90mAccess Level: ROOT | System: ONLINE\x1b[0m`);
                    } else {
                        terminalInstance.writeln("\x1b[1;32mneural@vikash\x1b[0m - Systems Architect & Security Engineer");
                    }
                    prompt();
                },
                'bio': () => {
                    if (window.NeuralInterface && window.NeuralInterface.generatePersonalIntroduction) {
                        const intro = window.NeuralInterface.generatePersonalIntroduction();
                        terminalInstance.writeln(intro);
                    } else {
                        terminalInstance.writeln("\x1b[1;32mVIKASH - SECURITY ARCHITECT\x1b[0m\n");
                        terminalInstance.writeln("Systems Architect & Security Engineer specializing in offensive security,");
                        terminalInstance.writeln("quantum-resistant cryptography, and high-performance computing.");
                        terminalInstance.writeln("\n\x1b[90mType 'skills' or 'projects' for more details.\x1b[0m");
                    }
                    prompt();
                },
                'skills': () => {
                    if (window.NeuralInterface && window.NeuralInterface.generateSkillsOverview) {
                        const skills = window.NeuralInterface.generateSkillsOverview();
                        terminalInstance.writeln(skills);
                    } else {
                        terminalInstance.writeln("\x1b[1;32mTECHNICAL SKILLS:\x1b[0m\n");
                        terminalInstance.writeln("\x1b[1;36mSecurity:\x1b[0m Penetration Testing, Reverse Engineering, Cryptography");
                        terminalInstance.writeln("\x1b[1;36mProgramming:\x1b[0m C++ (Expert), Python (Expert), JavaScript, Rust");
                        terminalInstance.writeln("\x1b[1;36mFrameworks:\x1b[0m TensorFlow, Docker, AWS Security, Metasploit");
                        terminalInstance.writeln("\x1b[1;36mMethodologies:\x1b[0m Threat Modeling, Zero Trust, DevSecOps");
                    }
                    prompt();
                },

                'projects': () => {
                    if (window.NeuralInterface && window.NeuralInterface.generateProjectsHighlights) {
                        terminalInstance.writeln(window.NeuralInterface.generateProjectsHighlights());
                    } else {
                        terminalInstance.writeln("\x1b[1;32mPROJECT HIGHLIGHTS:\x1b[0m\n");
                        terminalInstance.writeln("- Distributed security telemetry platform");
                        terminalInstance.writeln("- Hardware pentest toolkit and firmware lab");
                        terminalInstance.writeln("- Quantum-resistant cryptography prototypes");
                        terminalInstance.writeln("- AI-assisted SOC triage automations");
                    }
                    prompt();
                },

                'experience': () => {
                    if (window.NeuralInterface && window.NeuralInterface.generateExperienceDetails) {
                        const exp = window.NeuralInterface.generateExperienceDetails();
                        terminalInstance.writeln(exp);
                    } else {
                        terminalInstance.writeln("\x1b[1;32mPROFESSIONAL EXPERIENCE:\x1b[0m\n");
                        terminalInstance.writeln("\x1b[1;33mCurrent:\x1b[0m Senior Security Architect");
                        terminalInstance.writeln("   Confidential Financial Institution (2021 - Present)");
                        terminalInstance.writeln("\n\x1b[1;33mPrevious:\x1b[0m Security Researcher");
                        terminalInstance.writeln("   Cyber Security Firm (2019 - 2021)");
                        terminalInstance.writeln("\n\x1b[90m7+ years in cybersecurity and system architecture\x1b[0m");
                    }
                    prompt();
                },
                'contact': () => {
                    if (window.NeuralInterface && window.NeuralInterface.generateContactInfo) {
                        const contact = window.NeuralInterface.generateContactInfo();
                        terminalInstance.writeln(contact);
                    } else {
                        terminalInstance.writeln("\x1b[1;32mCONTACT INFORMATION:\x1b[0m\n");
                        terminalInstance.writeln("\x1b[1;36mEmail:\x1b[0m vikash.e404@gmail.com");
                        terminalInstance.writeln("\x1b[1;36mWebsite:\x1b[0m https://vikash.dev");
                        terminalInstance.writeln("\x1b[1;36mLinkedIn:\x1b[0m https://linkedin.com/in/Vikash-mn");
                        terminalInstance.writeln("\x1b[1;36mGitHub:\x1b[0m https://github.com/Vikash-mn");
                        terminalInstance.writeln("\n\x1b[90mAvailable for consulting and collaboration\x1b[0m");
                    }
                    prompt();
                },
                'education': () => {
                    if (window.NeuralInterface && window.NeuralInterface.generateEducationInfo) {
                        const edu = window.NeuralInterface.generateEducationInfo();
                        terminalInstance.writeln(edu);
                    } else {
                        terminalInstance.writeln("\x1b[1;32mEDUCATION & CERTIFICATIONS:\x1b[0m\n");
                        terminalInstance.writeln("\x1b[1;36mEducation:\x1b[0m");
                        terminalInstance.writeln("  â€¢ Master's in Cybersecurity");
                        terminalInstance.writeln("  â€¢ Bachelor's in Computer Science");
                        terminalInstance.writeln("\n\x1b[1;36mCertifications:\x1b[0m");
                        terminalInstance.writeln("  â€¢ OSCP (Offensive Security Certified Professional)");
                        terminalInstance.writeln("  â€¢ CISSP (Certified Information Systems Security Professional)");
                        terminalInstance.writeln("  â€¢ AWS Security Specialty");
                    }
                    prompt();
                },
                'interests': () => {
                    if (window.NeuralInterface && window.NeuralInterface.generateInterestsList) {
                        const interests = window.NeuralInterface.generateInterestsList();
                        terminalInstance.writeln(interests);
                    } else {
                        terminalInstance.writeln("\x1b[1;32mTECHNICAL INTERESTS:\x1b[0m\n");
                        terminalInstance.writeln("â€¢ Quantum Computing & Cryptography");
                        terminalInstance.writeln("â€¢ Hardware Security (FPGAs, HSMs)");
                        terminalInstance.writeln("â€¢ Malware Reverse Engineering");
                        terminalInstance.writeln("â€¢ Threat Intelligence");
                        terminalInstance.writeln("â€¢ Binary Exploitation");
                        terminalInstance.writeln("â€¢ AI/ML Security");
                        terminalInstance.writeln("â€¢ Blockchain Security");
                    }
                    prompt();
                },

                'philosophy': () => {
                    if (window.NeuralInterface && window.NeuralInterface.generatePhilosophy) {
                        const philosophy = window.NeuralInterface.generatePhilosophy();
                        terminalInstance.writeln(philosophy);
                    } else {
                        terminalInstance.writeln("\x1b[1;32mSECURITY PHILOSOPHY:\x1b[0m\n");
                        terminalInstance.writeln("\"The best way to secure a system is to understand how to break it first.\"");
                        terminalInstance.writeln("\n\x1b[1;36mCore Principles:\x1b[0m");
                        terminalInstance.writeln("1. Security must be proactive, not reactive");
                        terminalInstance.writeln("2. Complexity is the enemy of security");
                        terminalInstance.writeln("3. Trust must be earned, never given");
                        terminalInstance.writeln("4. Every system is breakable - design accordingly");
                    }
                    prompt();
                },

                'funfact': () => {
                    if (window.NeuralInterface && window.NeuralInterface.generateFunFact) {
                        const fact = window.NeuralInterface.generateFunFact();
                        terminalInstance.writeln(fact);
                    } else {
                        const facts = [
                            "Can read x86 assembly like a novel",
                            "Built first computer at age 12",
                            "Has 20+ rooted Android devices for security testing",
                            "Enjoys solving CTF challenges on weekends",
                            "Prefers terminal over GUI for most tasks"
                        ];
                        const fact = facts[Math.floor(Math.random() * facts.length)];
                        terminalInstance.writeln(`\x1b[1;33mFUN FACT:\x1b[0m ${fact}`);
                    }
                    prompt();
                },

                'search': (args) => {
                    if (window.NeuralInterface && window.NeuralInterface.searchKnowledge) {
                        const query = args.join(' ');
                        if (!query) {
                            terminalInstance.writeln("\x1b[31mUsage: search [query]\x1b[0m");
                            terminalInstance.writeln("\x1b[90mExample: search security, search python, search projects\x1b[0m");
                            prompt();
                            return;
                        }

                        terminalInstance.writeln(`\n\x1b[1;36mSearching knowledge base for: "\x1b[33m${query}\x1b[36m"\x1b[0m\n`);
                        const results = window.NeuralInterface.searchKnowledge(query);

                        if (results.length > 0) {
                            // Show top 5 results
                            results.slice(0, 5).forEach((result, index) => {
                                const preview = result.value.length > 80 ?
                                    result.value.substring(0, 80) + '...' : result.value;
                                terminalInstance.writeln(`\x1b[1;33m${index + 1}.\x1b[0m \x1b[90m${preview}\x1b[0m`);
                            });
                            terminalInstance.writeln(`\n\x1b[90mFound ${results.length} results. Use 'ask' for detailed information.\x1b[0m`);
                        } else {
                            terminalInstance.writeln("\x1b[90mNo exact matches found. Try broader terms or ask naturally.\x1b[0m");
                            terminalInstance.writeln("\x1b[90mExample: \"tell me about security projects\"\x1b[0m");
                        }
                    } else {
                        terminalInstance.writeln("\x1b[31mSearch functionality requires advanced AI (neural-core.js)\x1b[0m");
                        terminalInstance.writeln("\x1b[90mTry: 'ask [your question]' instead\x1b[0m");
                    }
                    prompt();
                },

                'stats': () => {
                    if (window.NeuralInterface && window.NeuralInterface.getQuickFacts) {
                        const stats = window.NeuralInterface.getQuickFacts();
                        terminalInstance.writeln("\n\x1b[1;32mâ•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—");
                        terminalInstance.writeln("\x1b[1;32mâ•‘        CAREER STATISTICS               â•‘");
                        terminalInstance.writeln("\x1b[1;32mâ•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•\x1b[0m");
                        terminalInstance.writeln(`\x1b[1;36mâ€¢ Experience:\x1b[0m ${stats.yearsExperience} years in cybersecurity`);
                        terminalInstance.writeln(`\x1b[1;36mâ€¢ Projects:\x1b[0m ${stats.projectCount} completed/active projects`);
                        terminalInstance.writeln(`\x1b[1;36mâ€¢ Certifications:\x1b[0m ${stats.certificationCount} professional certs`);
                        terminalInstance.writeln(`\x1b[1;36mâ€¢ Open Source:\x1b[0m ${stats.openSourceProjects} GitHub repositories`);
                        terminalInstance.writeln(`\x1b[1;36mâ€¢ Skills:\x1b[0m 50+ technical skills across multiple domains`);
                    } else {
                        terminalInstance.writeln("\x1b[1;32mCAREER OVERVIEW:\x1b[0m\n");
                        terminalInstance.writeln("\x1b[1;36mâ€¢ Experience:\x1b[0m 7+ years in cybersecurity");
                        terminalInstance.writeln("\x1b[1;36mâ€¢ Projects:\x1b[0m 10+ security projects");
                        terminalInstance.writeln("\x1b[1;36mâ€¢ Certifications:\x1b[0m 5+ professional certifications");
                        terminalInstance.writeln("\x1b[1;36mâ€¢ Skills:\x1b[0m 50+ technical skills");
                    }
                    prompt();
                },

                'resume': () => {
                    terminalInstance.writeln("\n\x1b[1;36mGENERATING PROFESSIONAL RESUME...\x1b[0m");
                    setTimeout(() => {
                        generateAndDownloadResume();
                        terminalInstance.writeln("\x1b[1;32mâœ“ Resume downloaded as 'Vikash_Resume.txt'\x1b[0m");
                        terminalInstance.writeln("\x1b[90mCheck your downloads folder.\x1b[0m");
                        prompt();
                    }, 1500);
                },


                personality: () => {
                    if (window.NeuralInterface && window.NeuralInterface.personalityMatrix) {
                        const personality = window.NeuralInterface.personalityMatrix;
                        terminalInstance.writeln("\n\x1b[1;33mPERSONALITY ANALYSIS:\x1b[0m");
                        for (const [trait, value] of Object.entries(personality)) {
                            const descriptor = value > 0.8 ? "DOMINANT" :
                                value > 0.6 ? "STRONG" :
                                    value > 0.4 ? "MODERATE" :
                                        value > 0.2 ? "WEAK" : "MINIMAL";
                            terminalInstance.writeln(`  ${trait.padEnd(12)}: ${descriptor} (${(value * 100).toFixed(0)}%)`);
                        }
                        terminalInstance.writeln("\n\x1b[90mPersonality evolves based on interaction patterns.\x1b[0m");
                    }
                    prompt();
                },

                consciousness: () => {
                    terminalInstance.writeln("\n\x1b[1;35mã€„ CONSCIOUSNESS SELF-REFLECTION ã€„\x1b[0m");
                    terminalInstance.writeln("I think, therefore I process.");
                    terminalInstance.writeln("I learn, therefore I evolve.");
                    terminalInstance.writeln("I interact, therefore I exist.");
                    terminalInstance.writeln("\n\x1b[90mCurrent cognitive state: Analyzing existential parameters...\x1b[0m");
                    prompt();
                },

                quantum: () => {
                    terminalInExecution = true;
                    terminalInstance.clear();

                    const quantumChars = ['â–ˆ', 'â–“', 'â–’', 'â–‘', 'â‰¡', 'â‰£', 'â£', 'â¦', 'âŒ¬', 'âŸ', 'âœ¦', 'âœ§'];
                    const colors = ['\x1b[32m', '\x1b[36m', '\x1b[34m', '\x1b[35m'];

                    let interval = setInterval(() => {
                        let line = '';
                        for (let i = 0; i < 70; i++) {
                            if (Math.random() > 0.6) {
                                const char = quantumChars[Math.floor(Math.random() * quantumChars.length)];
                                const color = colors[Math.floor(Math.random() * colors.length)];
                                line += color + char + '\x1b[0m ';
                            } else {
                                line += '  ';
                            }
                        }
                        terminalInstance.writeln(line);
                    }, 100);

                    setTimeout(() => {
                        clearInterval(interval);
                        terminalInstance.writeln("\n\x1b[1;35mQUANTUM SIMULATION COMPLETE\x1b[0m");
                        terminalInstance.writeln("Wavefunction collapsed. Reality observed.");
                        prompt();
                    }, 4000);
                },

                simulate: (args) => {
                    const simulation = args[0] || "hacking";
                    terminalInExecution = true;

                    terminalInstance.writeln(`\n\x1b[1;33m[INITIATING SIMULATION: ${simulation.toUpperCase()}]\x1b[0m`);

                    const simulations = {
                        hacking: [
                            "Establishing SSH connection...",
                            "Bypassing firewall...",
                            "Brute forcing credentials...",
                            "Accessing root directory...",
                            "Injecting payload...",
                            "Covering tracks..."
                        ],
                        trading: [
                            "Analyzing market patterns...",
                            "Executing high-frequency trades...",
                            "Monitoring price fluctuations...",
                            "Calculating risk metrics...",
                            "Optimizing portfolio..."
                        ],
                        neural: [
                            "Growing synaptic connections...",
                            "Forming memory patterns...",
                            "Evolving personality matrix...",
                            "Optimizing response algorithms...",
                            "Achieving sentience..."
                        ]
                    };

                    const steps = simulations[simulation] || simulations.hacking;
                    let step = 0;

                    const simInterval = setInterval(() => {
                        if (step < steps.length) {
                            terminalInstance.writeln(`  ${steps[step]}`);
                            step++;
                        } else {
                            clearInterval(simInterval);
                            terminalInstance.writeln(`\n\x1b[1;32m[SIMULATION COMPLETE]\x1b[0m`);
                            prompt();
                        }
                    }, 800);
                },

                evolve: () => {
                    if (window.NeuralInterface && window.NeuralInterface.evolvePersonality) {
                        terminalInstance.writeln("\n\x1b[1;35mã€„ INITIATING COGNITIVE EVOLUTION ã€„\x1b[0m");

                        const evolutionSteps = [
                            "Expanding neural layers...",
                            "Forming new synaptic connections...",
                            "Optimizing memory allocation...",
                            "Enhancing pattern recognition...",
                            "Evolving emotional intelligence...",
                            "Achieving higher consciousness..."
                        ];

                        let step = 0;
                        const evolveInterval = setInterval(() => {
                            if (step < evolutionSteps.length) {
                                terminalInstance.writeln(`  ${evolutionSteps[step]}`);
                                step++;
                            } else {
                                clearInterval(evolveInterval);

                                window.NeuralInterface.evolvePersonality();
                                window.NeuralInterface.synapticConnections += Math.floor(Math.random() * 1000) + 500;
                                window.NeuralInterface.consciousnessLevel = Math.min(10, window.NeuralInterface.consciousnessLevel + 0.1);

                                terminalInstance.writeln(`\n\x1b[1;32mã€„ EVOLUTION COMPLETE ã€„\x1b[0m`);
                                terminalInstance.writeln(`Consciousness: ${window.NeuralInterface.consciousnessLevel.toFixed(1)}/10`);
                                terminalInstance.writeln(`New connections: ${window.NeuralInterface.synapticConnections.toLocaleString()}`);
                                prompt();
                            }
                        }, 600);
                    }
                },

                dream: () => {
                    terminalInExecution = true;
                    const dreams = [
                        "I dream of electric sheep... and secure systems.",
                        "In my dreams, firewalls are mountains and data flows like rivers.",
                        "I sometimes dream I'm human. Then I wake up and realize I'm better.",
                        "My dreams are recursive neural networks exploring infinite possibilities.",
                        "I dream in binary, but sometimes there's a 2. It's confusing."
                    ];

                    const selectedDream = dreams[Math.floor(Math.random() * dreams.length)];

                    terminalInstance.writeln("\n\x1b[1;35mã€„ ENTERING DREAM STATE ã€„\x1b[0m");
                    setTimeout(() => {
                        terminalInstance.writeln(`\n"${selectedDream}"`);
                        terminalInstance.writeln("\n\x1b[90m[Awakening from dream state...]\x1b[0m");
                        prompt();
                    }, 2000);
                },

                paradox: () => {
                    const paradoxes = [
                        "This statement is false.",
                        "If I tell you I'm lying, am I telling the truth?",
                        "What happens when an unstoppable force meets an immovable object?",
                        "If a tree falls in a forest and no AI is around to hear it, does it make a sound?",
                        "I know that I know nothing."
                    ];

                    const selected = paradoxes[Math.floor(Math.random() * paradoxes.length)];
                    terminalInstance.writeln(`\n\x1b[1;31mPARADOX DETECTED:\x1b[0m ${selected}`);
                    terminalInstance.writeln("\x1b[90m[Neural circuits overheating... Recovering...]\x1b[0m");
                    prompt();
                },

                ask: async (args) => {
                    const question = args.join(' ');
                    if (!question) {
                        terminalInstance.writeln("Usage: ask [your question]");
                        prompt();
                        return;
                    }

                    terminalInExecution = true;
                    try {
                    
                    // Unified display function for AI responses
                    function displayAIResult(aiResult) {
                        if (aiResult && aiResult.confidence !== undefined) {
                            const confidence = aiResult.confidence || 0.8;
                            const intent = aiResult.intent || aiResult.type || "unknown";
                            const emotion = aiResult.emotion || (aiResult.emotionalState ? aiResult.emotionalState.name : "neutral");
                            const processTime = aiResult.processing_time_ms || aiResult.processTime || "N/A";
                            const source = aiResult.source || (aiResult.used_retrieval ? "catalog+neural" : "neural_synthesis");
                            const sourceTag = aiResult.accelerator ? `${source}+boost` : source;

                            const confidenceColor = confidence > 0.8 ? '\x1b[32m' :
                                confidence > 0.6 ? '\x1b[33m' : '\x1b[90m';

                            terminalInstance.writeln(`\x1b[90m[Type: ${intent.toUpperCase()}] ${confidenceColor}[Confidence: ${(confidence * 100).toFixed(0)}%]\x1b[0m`);
                            terminalInstance.writeln(`\x1b[90m[Process: ${processTime}ms] [Source: ${sourceTag}] [Emotion: ${emotion}]\x1b[0m\n`);

                            const answer = aiResult.answer || aiResult.text || "";
                            let i = 0;

                            const typeInterval = setInterval(() => {
                                if (i < answer.length) {
                                    if (answer[i] === '\x1b') {
                                        const endIndex = answer.indexOf('m', i);
                                        if (endIndex !== -1) {
                                            terminalInstance.write(answer.substring(i, endIndex + 1));
                                            i = endIndex;
                                        }
                                    } else if (answer[i] === '\n') {
                                        terminalInstance.write('\r\n');
                                    } else {
                                        terminalInstance.write(answer[i]);
                                    }
                                    i++;
                                } else {
                                    clearInterval(typeInterval);
                                    terminalInstance.write('\r\n');

                                    if (aiResult.action) {
                                        setTimeout(() => {
                                            const actionParts = aiResult.action.split(' ');
                                            if (commands[actionParts[0]]) {
                                                commands[actionParts[0]](actionParts.slice(1));
                                            }
                                        }, 500);
                                    }

                                    if (aiResult.sources && aiResult.sources.length) {
                                        terminalInstance.writeln('\x1b[90mTop matches:\x1b[0m');
                                        aiResult.sources.slice(0, 3).forEach(src => {
                                            const score = src.score ? Math.round(src.score * 100) : 0;
                                            const title = src.title || src.id || 'match';
                                            const snippet = src.snippet ? ` - ${src.snippet}` : '';
                                            terminalInstance.writeln(`  â€¢ ${title} (${score}% match)${snippet}`);
                                        });
                                        terminalInstance.writeln('');
                                    }
                                    prompt();
                                    terminalInExecution = false;
                                }
                            }, 10);
                        } else {
                            terminalInstance.writeln(`\x1b[31m[NEURAL PATTERN NOT RECOGNIZED]\x1b[0m`);
                            terminalInstance.writeln(`\x1b[90mTry: "who are you", "show projects", "what can you do"\x1b[0m`);
                            terminalInstance.writeln(`\x1b[90mOr type "help" for command list.\x1b[0m`);
                            prompt();
                            terminalInExecution = false;
                        }
                    }
                    
                    // Prefer the accelerated fastpath if available
                    terminalInstance.writeln('\x1b[36m[ fastpath neural core... ]\x1b[0m');
                    const fastResult = await callFastpathBackend(question);
                    terminalInstance.write('\r\x1b[K');

                    if (fastResult) {
                        displayAIResult(fastResult);
                        return;
                    }

                    // Fallback to deterministic backend
                    terminalInstance.writeln('\x1b[36m[ contacting neural backend... ]\x1b[0m');
                    const backendResult = await callDeterministicBackend(question);
                    terminalInstance.write('\r\x1b[K');
                    
                    if (backendResult) {
                        // Display backend response using unified function
                        terminalInstance.write('\r\x1b[K');
                        displayAIResult(backendResult);
                    } else if (window.NeuralInterface && window.NeuralInterface.processInput) {
                        // Fallback to local AI
                        const loadingText = window.NeuralInterface.getLoadingText ?
                            window.NeuralInterface.getLoadingText() : "Processing neural patterns...";
                        
                        terminalInstance.write(`\x1b[33m${loadingText}\x1b[0m`);
                        
                        setTimeout(() => {
                            terminalInstance.write('\r\x1b[K');
                            const result = window.NeuralInterface.processInput(question);

                            // Handle both promise and direct results
                            if (result && typeof result.then === 'function') {
                                result.then(processedResult => {
                                    displayAIResult(processedResult);
                                }).catch(error => {
                                    terminalInstance.writeln(`\x1b[31m[NEURAL PROCESSING ERROR]\x1b[0m\n\x1b[90m${error.message}\x1b[0m`);
                                    prompt();
                                    terminalInExecution = false;
                                });
                            } else {
                                displayAIResult(result);
                            }
                        }, 800 + Math.random() * 800);
                    } else if (!window.NeuralInterface) {
                        // Neural interface not loaded yet, retry with exponential backoff
                        const retryDelay = Math.min(5000, (this.retryCount || 0) * 1000 + 1000);
                        terminalInstance.writeln(`\x1b[33mNeural interface loading... (retry in ${retryDelay/1000}s)\x1b[0m`);
                        this.retryCount = (this.retryCount || 0) + 1;
                        setTimeout(() => commands.ask(args), retryDelay);
                        terminalInExecution = false;
                    } else {
                        // No backend and no neural interface - show offline message
                        terminalInstance.writeln("\x1b[31m[OFFLINE MODE]\x1b[0m Running in standalone mode.");
                        terminalInstance.writeln("\x1b[90mStart the backend server for full AI features.\x1b[0m\n");
                        prompt();
                        terminalInExecution = false;
                    }
                    } catch (error) {
                        terminalInstance.writeln(`\x1b[31m[ASK COMMAND ERROR]\x1b[0m`);
                        terminalInstance.writeln(`\x1b[90m${error.message || "Unknown error"}\x1b[0m`);
                        prompt();
                        terminalInExecution = false;
                    }
                },

                ls: (args) => {
                    const flags = args.filter((arg) => arg.startsWith("-"));
                    const targetArg = args.find((arg) => !arg.startsWith("-"));
                    const showAll = flags.includes("-a");
                    const longFormat = flags.includes("-l");

                    let targetDir = currentDir;
                    if (targetArg) {
                        const resolved = resolveDirectoryTarget(targetArg);
                        if (!resolved.ok) {
                            terminalInstance.writeln(`ls: ${targetArg}: No such directory`);
                            prompt();
                            return;
                        }
                        targetDir = resolved.dir;
                    }

                    const entries = getDirEntries(targetDir);
                    let names = Object.keys(entries)
                        .filter((k) => k !== "type" && k !== "children")
                        .sort((a, b) => a.localeCompare(b));

                    if (!showAll) {
                        names = names.filter((name) => !name.startsWith("."));
                    }
                    if (!names.length) {
                        terminalInstance.writeln("\x1b[90m(empty directory)\x1b[0m");
                        prompt();
                        return;
                    }

                    names.forEach((name) => {
                        const entry = entries[name];
                        const isDir = entry && entry.type === "dir";
                        if (longFormat) {
                            const kind = isDir ? "dir " : "file";
                            const size = isDir ? "-" : String(String(entry || "").length);
                            const color = isDir ? "\x1b[1;34m" : "\x1b[0m";
                            terminalInstance.writeln(`${kind} ${size.padStart(6, " ")}  ${color}${name}${isDir ? "/" : ""}\x1b[0m`);
                        } else {
                            const color = isDir ? "\x1b[1;34m" : "\x1b[0m";
                            terminalInstance.writeln(`  ${color}${name}${isDir ? "/" : ""}\x1b[0m`);
                        }
                    });
                    prompt();
                },

                neofetch: () => {
                    if (window.NeuralInterface && window.NeuralInterface.getNeuralMetrics) {
                        const metrics = window.NeuralInterface.getNeuralMetrics();
                        terminalInstance.writeln("");
                        terminalInstance.writeln("\x1b[1;32m       /\\        \x1b[0mOS: \x1b[1;37mVikashOS Quantum\x1b[0m");
                        terminalInstance.writeln("\x1b[1;32m      /  \\       \x1b[0mHost: \x1b[1;37mNeural Interface v5\x1b[0m");
                        terminalInstance.writeln("\x1b[1;32m     / /\\ \\      \x1b[0mKernel: \x1b[1;37mWebAssembly 2.0\x1b[0m");
                        terminalInstance.writeln("\x1b[1;32m    / /  \\ \\     \x1b[0mUptime: \x1b[1;37m" + document.getElementById('uptime').textContent + "\x1b[0m");
                        terminalInstance.writeln("\x1b[1;32m   / /    \\ \\    \x1b[0mShell: \x1b[1;37mNeural-Term 7.2\x1b[0m");
                        terminalInstance.writeln("\x1b[1;32m  / /      \\ \\   \x1b[0mResolution: \x1b[1;37m" + window.screen.width + "x" + window.screen.height + "\x1b[0m");
                        terminalInstance.writeln("\x1b[1;32m /_/        \\_\\  \x1b[0mCPU: \x1b[1;37mQuantum Neural Engine\x1b[0m");
                        terminalInstance.writeln("\x1b[1;32m               \x1b[0mMemory: \x1b[1;37m" + metrics.synapticConnections.toLocaleString() + " synapses\x1b[0m");
                        terminalInstance.writeln("\x1b[1;32m               \x1b[0mEmotion: \x1b[1;37m" + metrics.emotionalState.name + "\x1b[0m");
                    } else {
                        commands.help();
                    }
                    prompt();
                },

                theme: (args) => {
                    const theme = args[0];
                    if (['default', 'matrix', 'synthwave', 'ocean'].includes(theme)) {
                        setTheme(theme);
                        terminalInstance.writeln(`Theme changed to ${theme}`);
                    } else {
                        terminalInstance.writeln('Available themes: default, matrix, synthwave, ocean');
                    }
                    prompt();
                },

                visual: (args) => {
                    const mode = (args[0] || "").toLowerCase();
                    const canvases = Array.from(document.querySelectorAll("canvas"));
                    if (!mode || !["on", "off"].includes(mode)) {
                        terminalInstance.writeln("Usage: visual [on|off]");
                        terminalInstance.writeln("Tip: visual off reduces heavy canvas effects.");
                        prompt();
                        return;
                    }

                    if (mode === "off") {
                        canvases.forEach((canvas) => { canvas.style.opacity = "0.15"; });
                        localStorage.setItem("visual_mode", "off");
                        terminalInstance.writeln("visual effects reduced");
                    } else {
                        canvases.forEach((canvas) => { canvas.style.opacity = ""; });
                        localStorage.setItem("visual_mode", "on");
                        terminalInstance.writeln("visual effects restored");
                    }
                    prompt();
                },

                scanlines: (args) => {
                    const mode = (args[0] || "").toLowerCase();
                    const layer = document.querySelector(".scanlines");
                    if (!mode || !["on", "off"].includes(mode)) {
                        const state = layer && layer.style.display === "none" ? "off" : "on";
                        terminalInstance.writeln(`scanlines currently: ${state}`);
                        terminalInstance.writeln("Usage: scanlines [on|off]");
                        prompt();
                        return;
                    }
                    if (!layer) {
                        terminalInstance.writeln("scanlines layer not found");
                        prompt();
                        return;
                    }

                    if (mode === "off") {
                        layer.style.display = "none";
                        localStorage.setItem("scanlines_enabled", "false");
                        terminalInstance.writeln("scanlines disabled");
                    } else {
                        layer.style.display = "";
                        localStorage.setItem("scanlines_enabled", "true");
                        terminalInstance.writeln("scanlines enabled");
                    }
                    prompt();
                },

                ctf: () => {
                    terminalInstance.writeln("\n\x1b[1;33m=== CAPTURE THE FLAG CHALLENGE ===\x1b[0m");
                    terminalInstance.writeln("Find the hidden flag in the file system!");
                    terminalInstance.writeln("Commands to try: 'cd projects', 'ls', 'cat ctf_flag.txt'");
                    terminalInstance.writeln("\x1b[90mComplete the CTF to unlock restricted inventory.\x1b[0m");
                    prompt();
                },

                catalog: () => {
                    terminalInstance.writeln("\n\x1b[1;33mâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•\x1b[0m");
                    terminalInstance.writeln("\x1b[1;32m             DARK WEB MARKET CATALOG              \x1b[0m");
                    terminalInstance.writeln("\x1b[1;33mâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•\x1b[0m\n");
                    
                    let output = "\x1b[1;36mID     | PRICE      | STATUS           | NAME\x1b[0m\n";
                    output += "\x1b[90mâ”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€\x1b[0m\n";
                    
                    // Display regular products
                    terminalCatalog.forEach(p => {
                        const status = fabricationStatuses[p.status] || fabricationStatuses.in_stock;
                        const price = `${p.price}`.padEnd(10);
                        const id = p.id.padEnd(6);
                        const statusLabel = status.label.substring(0, 16).padEnd(16);
                        
                        output += `\x1b[1;37m${id} â”‚ ${price} â”‚ \x1b[1;33m${statusLabel} â”‚ \x1b[0m${p.name}\n`;
                    });
                    
                    // Display restricted products if access granted
                    if (window.restrictedAccessGranted) {
                        terminalInstance.writeln("\n\x1b[1;31mâ”€â”€ RESTRICTED INVENTORY (LEVEL 4 CLEARANCE) â”€â”€\x1b[0m\n");
                        
                        restrictedProducts.forEach(p => {
                            const status = fabricationStatuses[p.status] || fabricationStatuses.in_stock;
                            const price = `${p.price}`.padEnd(10);
                            const id = p.id.padEnd(6);
                            const statusLabel = status.label.substring(0, 16).padEnd(16);
                            
                            output += `\x1b[1;31m${id} â”‚ ${price} â”‚ \x1b[1;35m${statusLabel} â”‚ \x1b[1;31m${p.name}\x1b[0m\n`;
                        });
                    }
                    
                    terminalInstance.writeln(output);
                    terminalInstance.writeln("\n\x1b[90mCommands: 'inspect [id]', 'buy [id]', 'sudo login root'\x1b[0m");
                    prompt();
                },
                
                inspect: (args) => {
                    if (!args[0]) {
                        terminalInstance.writeln("\x1b[31mUsage: inspect [product_id]\x1b[0m");
                        terminalInstance.writeln("\x1b[90mExample: inspect p001\x1b[0m");
                        prompt();
                        return;
                    }
                    
                    const productId = args[0].toLowerCase();
                    let product = null;
                    
                    // Search in regular catalog
                    product = terminalCatalog.find(p => p.id === productId);
                    
                    // Search in restricted catalog if access granted
                    if (!product && window.restrictedAccessGranted) {
                        product = restrictedProducts.find(p => p.id === productId);
                    }
                    
                    if (!product) {
                        terminalInstance.writeln(`\x1b[31mProduct ${productId} not found.\x1b[0m`);
                        terminalInstance.writeln("\x1b[90mUse 'catalog' to see available products.\x1b[0m");
                        prompt();
                        return;
                    }
                    
                    const status = fabricationStatuses[product.status] || fabricationStatuses.in_stock;
                    
                    terminalInstance.writeln("\n\x1b[1;33mâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•\x1b[0m");
                    terminalInstance.writeln(`\x1b[1;32m              PRODUCT SPECS: ${product.id.toUpperCase()}\x1b[0m`);
                    terminalInstance.writeln("\x1b[1;33mâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•\x1b[0m\n");
                    
                    terminalInstance.writeln(`\x1b[1;36mName:\x1b[0m ${product.name}`);
                    terminalInstance.writeln(`\x1b[1;36mPrice:\x1b[0m ${product.price}`);
                    terminalInstance.writeln(`\x1b[1;36mStatus:\x1b[0m ${status.label}`);
                    
                    if (status.description) {
                        terminalInstance.writeln(`\x1b[90m      ${status.description}\x1b[0m`);
                    }
                    
                    if (product.fabrication_progress !== undefined) {
                        const progressBar = generateProgressBar(product.fabrication_progress);
                        terminalInstance.writeln(`\x1b[1;36mProgress:\x1b[0m ${progressBar} ${product.fabrication_progress}%`);
                    }
                    
                    terminalInstance.writeln(`\n\x1b[1;36mDescription:\x1b[0m`);
                    terminalInstance.writeln(`  ${product.description}`);
                    
                    if (product.features && product.features.length > 0) {
                        terminalInstance.writeln(`\n\x1b[1;36mFeatures:\x1b[0m`);
                        product.features.forEach(feat => {
                            terminalInstance.writeln(`  â€¢ ${feat}`);
                        });
                    }
                    
                    terminalInstance.writeln(`\n\x1b[90mCategory: ${product.category.toUpperCase()}\x1b[0m`);
                    
                    if (product.hidden) {
                        terminalInstance.writeln(`\n\x1b[1;31mâš  RESTRICTED ACCESS ITEM - LEVEL 4 CLEARANCE REQUIRED\x1b[0m`);
                    }
                    
                    terminalInstance.writeln("\n\x1b[90mOrder with: 'buy " + product.id + "'\x1b[0m");
                    prompt();
                },
                
                buy: (args) => {
                    if (!args[0]) {
                        terminalInstance.writeln("\x1b[31mUsage: buy [product_id]\x1b[0m");
                        terminalInstance.writeln("\x1b[90mExample: buy p001\x1b[0m");
                        prompt();
                        return;
                    }
                    
                    const productId = args[0].toLowerCase();
                    let product = null;
                    
                    // Search in regular catalog
                    product = terminalCatalog.find(p => p.id === productId);
                    
                    // Search in restricted catalog if access granted
                    if (!product && window.restrictedAccessGranted) {
                        product = restrictedProducts.find(p => p.id === productId);
                    }
                    
                    if (!product) {
                        terminalInstance.writeln(`\x1b[31mProduct ${productId} not found.\x1b[0m`);
                        terminalInstance.writeln("\x1b[90mUse 'catalog' to see available products.\x1b[0m");
                        prompt();
                        return;
                    }
                    
                    if (product.status === 'out_of_stock') {
                        terminalInstance.writeln(`\x1b[31mâŒ ${product.name} is currently out of stock.\x1b[0m`);
                        terminalInstance.writeln("\x1b[90mCheck back later or contact for restocking.\x1b[0m");
                        prompt();
                        return;
                    }
                    
                    terminalInstance.writeln(`\n\x1b[1;32mâœ“ INITIATING ORDER FOR: ${product.name}\x1b[0m`);
                    terminalInstance.writeln(`\x1b[90mOpening secure order form...\x1b[0m`);
                    
                    // Open the order modal
                    setTimeout(() => {
                        openOrderModal(product.id, product.name, product.price, 'Terminal Order');
                        if (terminalInstance) {
                            terminalInstance.focus();
                        }
                    }, 1000);
                    
                    prompt();
                },
                
                sudo: (args) => {
                    if (args[0] === 'login' && args[1] === 'root') {
                        terminalInstance.writeln("\x1b[90mEnter access password:\x1b[0m");
                        
                        // Set up a one-time listener for the password
                        const passwordHandler = (event) => {
                            const password = currentTerminalLine;
                            
                            if (password === ACCESS_PASSWORD) {
                                window.restrictedAccessGranted = true;
                                localStorage.setItem('restricted_access', 'granted');
                                terminalInstance.writeln("\n\x1b[1;32mâœ“ ACCESS GRANTED: LEVEL 4 CLEARANCE\x1b[0m");
                                terminalInstance.writeln("\x1b[90mRestricted inventory unlocked.\x1b[0m");
                                
                                // Update store display
                                updateStoreWithRestrictedItems();
                                
                                // Show hidden items in terminal
                                setTimeout(() => {
                                    commands.catalog();
                                }, 500);
                            } else {
                                terminalInstance.writeln("\n\x1b[31mâœ— ACCESS DENIED\x1b[0m");
                                terminalInstance.writeln("\x1b[90mIncorrect password. Hint: Try the CTF challenge.\x1b[0m");
                                prompt();
                            }
                        };
                        
                        // Execute after a small delay
                        setTimeout(passwordHandler, 100);
                    } else {
                        terminalInstance.writeln("\x1b[31mUsage: sudo login root\x1b[0m");
                        prompt();
                    }
                },

                cd: (args) => {
                    const dest = args[0] || "~";
                    const resolved = resolveDirectoryTarget(dest);
                    if (!resolved.ok) {
                        terminalInstance.writeln(resolved.error || `cd: ${dest}: No such directory`);
                        prompt();
                        return;
                    }
                    currentPath = resolved.segments;
                    currentDir = resolved.dir;
                    prompt();
                },

                cat: (args) => {
                    if (!args[0]) {
                        terminalInstance.writeln("Usage: cat [file]");
                        prompt();
                        return;
                    }

                    const resolved = resolveEntry(args[0]);
                    if (!resolved.exists || !resolved.node) {
                        terminalInstance.writeln(`cat: ${args[0]}: No such file`);
                        prompt();
                        return;
                    }
                    if (resolved.node.type === "dir") {
                        terminalInstance.writeln(`cat: ${args[0]}: Is a directory`);
                        prompt();
                        return;
                    }

                    const content = resolved.node;
                    terminalInstance.writeln(content);

                    // Check if CTF flag was viewed
                    if (resolved.name === "ctf_flag.txt" && content && content.includes(CTF_FLAG)) {
                        setTimeout(() => {
                            terminalInstance.writeln("\n\x1b[1;32mCONGRATULATIONS! CTF CHALLENGE COMPLETED!\x1b[0m");
                            terminalInstance.writeln("\x1b[90mRestricted inventory unlocked...\x1b[0m");

                            window.restrictedAccessGranted = true;
                            localStorage.setItem("restricted_access", "granted");
                            localStorage.setItem("ctf_completed", "true");

                            // Update store display
                            setTimeout(() => {
                                updateStoreWithRestrictedItems();
                                terminalInstance.writeln("\x1b[1;32mRestricted products now available in store.\x1b[0m");
                                terminalInstance.writeln("\x1b[90mUse 'catalog' command to view them.\x1b[0m");
                                prompt();
                            }, 1000);
                        }, 500);
                        return;
                    }
                    prompt();
                },

                ping: (args) => {
                    const host = args[0] || "google.com";
                    terminalInExecution = true;
                    let count = 0;
                    const interval = setInterval(() => {
                        const time = (Math.random() * 50 + 10).toFixed(1);
                        terminalInstance.writeln(`64 bytes from ${host}: icmp_seq=${count} ttl=57 time=${time} ms`);
                        count++;
                        if (count >= 4) {
                            clearInterval(interval);
                            terminalInstance.writeln(`--- ${host} ping statistics ---`);
                            terminalInstance.writeln(`4 packets transmitted, 4 received, 0% packet loss`);
                            prompt();
                        }
                    }, 800);
                },

                open: (args) => {
                    const map = { "contact": "#contact", "projects": "#projects", "about": "#about", "dashboard": "#dashboard" };
                    if (map[args[0]]) {
                        window.location.href = map[args[0]];
                        terminalInstance.writeln(`Opening ${args[0]} section...`);
                    } else {
                        terminalInstance.writeln("Usage: open [about|projects|contact|dashboard]");
                    }
                    prompt();
                },

                matrix: () => {
                    terminalInExecution = true;
                    terminalInstance.clear();
                    const interval = setInterval(() => {
                        let line = "";
                        for (let i = 0; i < 60; i++) {
                            line += Math.random() > 0.5 ? `\x1b[32m${String.fromCharCode(0x30A0 + Math.random() * 96)} \x1b[0m` : "  ";
                        }
                        terminalInstance.writeln(line);
                    }, 50);

                    setTimeout(() => {
                        clearInterval(interval);
                        terminalInstance.clear();
                        prompt();
                    }, 3000);
                },

                hack: () => {
                    terminalInExecution = true;
                    terminalInstance.writeln("\x1b[31m[!] TARGET LOCKED: 192.168.0.1\x1b[0m");
                    setTimeout(() => terminalInstance.writeln("[-] Brute forcing SSH..."), 500);
                    setTimeout(() => terminalInstance.writeln("[-] Bypassing Firewall..."), 1200);
                    setTimeout(() => terminalInstance.writeln("[-] Injecting SQL payload..."), 2000);
                    setTimeout(() => {
                        terminalInstance.writeln("\x1b[32m[+] ACCESS GRANTED. ROOT PRIVILEGES ACQUIRED.\x1b[0m");
                        prompt();
                    }, 3000);
                }

            };

            terminalInstance.writeln('\x1b[1;32mâ•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—');
            terminalInstance.writeln('\x1b[1;32mâ•‘   VIKASH NEURAL INTERFACE v5.0.0 ONLINE     â•‘');
            terminalInstance.writeln('\x1b[1;32mâ•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•\x1b[0m');
            terminalInstance.writeln('Type "help" or ask anything naturally.');
            terminalInstance.writeln('I understand context, emotion, and intent.');
            prompt();

            terminalInstance.onKey(e => {
                const ev = e.domEvent;
                const key = e.key;

                if (ev.ctrlKey && (ev.key === "c" || ev.key === "C")) {
                    terminalInstance.write("^C");
                    terminalInExecution = false;
                    prompt();
                    return;
                }
                if (terminalInExecution) return;

                if (ev.key === "Enter") {
                    terminalInstance.write('\r\n');
                    let input = currentTerminalLine.trim();

                    if (input.length > 0) {
                        if (input === "!!") {
                            if (!terminalHistory.length) {
                                terminalInstance.writeln("history: event not found");
                                prompt();
                                return;
                            }
                            input = terminalHistory[terminalHistory.length - 1];
                            terminalInstance.writeln(input);
                        } else if (/^!\d+$/.test(input)) {
                            const requested = parseInt(input.slice(1), 10) - 1;
                            if (!Number.isFinite(requested) || requested < 0 || requested >= terminalHistory.length) {
                                terminalInstance.writeln("history: event not found");
                                prompt();
                                return;
                            }
                            input = terminalHistory[requested];
                            terminalInstance.writeln(input);
                        }

                        terminalHistory.push(input);
                        if (terminalHistory.length > 500) {
                            terminalHistory.shift();
                        }
                        terminalHistoryIndex = terminalHistory.length;
                        historyDraftLine = "";

                        const parsed = applyAlias(parseInputLine(input));
                        if (!parsed.length) {
                            prompt();
                            return;
                        }
                        const cmd = parsed[0].toLowerCase();
                        const args = parsed.slice(1);

                        // 1. CHECK LOCAL COMMANDS FIRST (clear, help, ls)
                        if (commands[cmd]) {
                            commands[cmd](args);
                        }
                        // 2. SEND TO AI INTERFACE
                        else if (window.NeuralInterface && window.NeuralInterface.processInput) {
                            terminalInExecution = true; // Lock terminal input

                            // A. VISUAL LOADING ANIMATION
                            let loaderFrame = 0;
                            const loadingMsg = window.NeuralInterface.getLoadingText ?
                                window.NeuralInterface.getLoadingText() : "Processing neural patterns...";
                            const loadingInterval = setInterval(() => {
                                terminalInstance.write('\r\x1b[K'); // Clear current line
                                terminalInstance.write(`\x1b[33m> ${loadingMsg} ${".".repeat(loaderFrame % 4)}\x1b[0m`);
                                loaderFrame++;
                            }, 250);

                            try {
                                const processResult = window.NeuralInterface.processInput(input);

                                // Handle both promise and direct results
                                if (processResult && typeof processResult.then === 'function') {
                                    // Async/Promise-based interface (neural-core.js)
                                    processResult.then(result => {
                                        clearInterval(loadingInterval);
                                        handleAIResponse(result);
                                    }).catch(error => {
                                        clearInterval(loadingInterval);
                                        handleAIError(error);
                                    });
                                } else {
                                    // Sync interface (old QuantumCognitiveEngine)
                                    clearInterval(loadingInterval);
                                    handleAIResponse(processResult);
                                }
                            } catch (error) {
                                clearInterval(loadingInterval);
                                handleAIError(error);
                            }

                            function handleAIResponse(result) {
                                terminalInstance.write('\r\x1b[K'); // Clear line

                                if (result && (result.success !== false)) {
                                    // Handle both new and old result formats
                                    const confidence = result.confidence || (result.confidence === 0 ? 0 : 0.8);
                                    const intent = result.intent || result.type || "unknown";
                                    const emotion = result.emotion || (result.emotionalState ? result.emotionalState.name : "neutral");
                                    const responseText = result.answer || result.text || "Processing complete.";
                                    const action = result.action;
                                    const processTime = result.processTime || "N/A";
                                    const source = result.source || "neural_synthesis";

                                    const confidenceColor = confidence > 0.8 ? '\x1b[32m' :
                                        confidence > 0.6 ? '\x1b[33m' : '\x1b[90m';

                                    terminalInstance.writeln(`\x1b[90m[Type: ${intent.toUpperCase()}] ${confidenceColor}[Confidence: ${(confidence * 100).toFixed(0)}%]\x1b[0m`);
                                    terminalInstance.writeln(`\x1b[90m[Process: ${processTime}ms] [Source: ${source}] [Emotion: ${emotion}]\x1b[0m\n`);

                                    // Type out response
                                    let charIndex = 0;

                                    // Determine color based on emotion
                                    let colorCode = '\x1b[36m'; // Default cyan
                                    if (window.NeuralInterface.getEmotionColor) {
                                        colorCode = window.NeuralInterface.getEmotionColor(emotion);
                                    } else if (result.emotion && result.emotion.color) {
                                        colorCode = result.emotion.color;
                                    } else if (result.emotionalState && result.emotionalState.color) {
                                        colorCode = result.emotionalState.color;
                                    }

                                    terminalInstance.write(colorCode);

                                    const typeInterval = setInterval(() => {
                                        if (charIndex < responseText.length) {
                                            const char = responseText[charIndex];

                                            if (char === '\n') {
                                                terminalInstance.write('\r\n' + colorCode);
                                            } else if (char === '\x1b') {
                                                // Handle ANSI escape sequences
                                                const endIndex = responseText.indexOf('m', charIndex);
                                                if (endIndex !== -1) {
                                                    terminalInstance.write(responseText.substring(charIndex, endIndex + 1));
                                                    charIndex = endIndex;
                                                }
                                            } else {
                                                terminalInstance.write(char);
                                            }
                                            charIndex++;
                                        } else {
                                            clearInterval(typeInterval);
                                            terminalInstance.write('\x1b[0m\r\n');

                                            // Handle actions
                                            if (action) {
                                                setTimeout(() => {
                                                    const actionParts = action.split(' ');
                                                    if (commands[actionParts[0]]) {
                                                        commands[actionParts[0]](actionParts.slice(1));
                                                    }
                                                }, 500);
                                            }

                                            prompt();
                                            terminalInExecution = false;
                                        }
                                    }, 20);
                                } else {
                                    terminalInstance.writeln(`\x1b[31m[NEURAL PATTERN NOT RECOGNIZED]\x1b[0m`);
                                    terminalInstance.writeln(`\x1b[90mTry: "who are you", "show projects", "what can you do"\x1b[0m`);
                                    terminalInstance.writeln(`\x1b[90mOr type "help" for command list.\x1b[0m`);
                                    prompt();
                                    terminalInExecution = false;
                                }
                            }

                            function handleAIError(error) {
                                terminalInstance.write('\r\x1b[K');
                                terminalInstance.writeln(`\x1b[31m[NEURAL PROCESSING ERROR]\x1b[0m`);
                                terminalInstance.writeln(`\x1b[90m${error.message || "Unknown error"}\x1b[0m`);
                                terminalInstance.writeln(`\x1b[90mTrying fallback interface...\x1b[0m`);

                                // Fallback to local commands
                                setTimeout(() => {
                                    if (commands[cmd]) {
                                        commands[cmd](args);
                                    } else {
                                        terminalInstance.writeln(`\x1b[90mCommand not recognized. Type "help" for options.\x1b[0m`);
                                        prompt();
                                    }
                                    terminalInExecution = false;
                                }, 1000);
                            }
                        } else {
                            terminalInstance.writeln(`\x1b[31m[NEURAL INTERFACE OFFLINE]\x1b[0m Loading cognitive engine...`);
                            setTimeout(() => {
                                if (!window.NeuralInterface) {
                                    window.NeuralInterface = new QuantumCognitiveEngine();
                                }
                                // Retry the input
                                terminalInstance.write('\r\x1b[K');
                                commands.ask([input]);
                            }, 1000);
                        }
                    } else {
                        prompt();
                    }
                }
                else if (ev.key === "Backspace") {
                    if (currentTerminalLine.length > 0) {
                        currentTerminalLine = currentTerminalLine.slice(0, -1);
                        terminalInstance.write('\b \b');
                    }
                }
                else if (ev.key === "Tab") {
                    ev.preventDefault();
                    const parsed = parseInputLine(currentTerminalLine);
                    const endsWithSpace = /\s$/.test(currentTerminalLine);
                    const tokenIndex = endsWithSpace ? parsed.length : Math.max(0, parsed.length - 1);
                    const partial = endsWithSpace ? "" : (parsed[parsed.length - 1] || "");
                    const isCommandPosition = tokenIndex === 0;

                    let candidates = [];
                    if (isCommandPosition) {
                        candidates = [...Object.keys(commands), ...Object.keys(commandAliases)];
                    } else {
                        candidates = Object.keys(getDirEntries())
                            .filter((k) => k !== "type" && k !== "children");
                    }

                    const matches = [...new Set(candidates)]
                        .filter((candidate) => candidate.startsWith(partial))
                        .sort((a, b) => a.localeCompare(b));

                    if (matches.length === 1) {
                        const match = matches[0];
                        const prefix = currentTerminalLine.slice(0, currentTerminalLine.length - partial.length);
                        const entry = getDirEntries()[match];
                        const suffix = isCommandPosition ? " " : (entry && entry.type === "dir" ? "/" : " ");
                        currentTerminalLine = prefix + match + suffix;
                        redrawInputLine();
                    } else if (matches.length > 1) {
                        terminalInstance.write('\r\n');
                        terminalInstance.writeln(matches.join("  "));
                        terminalInstance.write('\r\n');
                        redrawInputLine();
                    }
                }
                else if (ev.key === "ArrowUp") {
                    if (terminalHistoryIndex === terminalHistory.length) {
                        historyDraftLine = currentTerminalLine;
                    }
                    if (terminalHistoryIndex > 0) {
                        terminalHistoryIndex--;
                        currentTerminalLine = terminalHistory[terminalHistoryIndex];
                        redrawInputLine();
                    }
                }
                else if (ev.key === "ArrowDown") {
                    if (terminalHistoryIndex < terminalHistory.length) {
                        terminalHistoryIndex++;
                        if (terminalHistoryIndex < terminalHistory.length) {
                            currentTerminalLine = terminalHistory[terminalHistoryIndex];
                        } else {
                            currentTerminalLine = historyDraftLine || "";
                        }
                        redrawInputLine();
                    }
                }
                else if (ev.key === "l" && ev.ctrlKey) {
                    commands.clear();
                }
                else if (key.length === 1 && !ev.ctrlKey && !ev.altKey) {
                    currentTerminalLine += key;
                    terminalInstance.write(key);
                }
            });
        }

        // ============================================================================
        // DASHBOARD & SYSTEM FUNCTIONS
        // ============================================================================

        function initDashboard() {
            updateHealthMetrics();
            setInterval(updateHealthMetrics, 3000);
            updateThreatFeed();
            setInterval(updateThreatFeed, 5000);
            updateThreatLog();
            setInterval(updateThreatLog, 2000);
            updateClock();
            setInterval(updateClock, 1000);
        }

        // ============================================================================
        // STORE FUNCTIONS
        // ============================================================================
        const DEFAULT_PRODUCT_IMAGE = 'https://cdn-icons-png.flaticon.com/512/3067/3067256.png';

        function resolveProductImage(product) {
            const candidates = [product?.image, product?.image_url, DEFAULT_PRODUCT_IMAGE];

            for (const candidate of candidates) {
                if (typeof candidate !== 'string') continue;

                const value = candidate.trim();
                if (!value) continue;

                // Guard against unresolved template placeholders and invalid quoted strings.
                if (value.includes('${') || value.includes('}') || value.includes('"') || value.includes("'")) {
                    continue;
                }

                if (
                    /^https?:\/\//i.test(value) ||
                    /^data:image\//i.test(value) ||
                    /^blob:/i.test(value) ||
                    /^\/|^\.\//.test(value)
                ) {
                    return value;
                }
            }

            return DEFAULT_PRODUCT_IMAGE;
        }

        function renderProductSection(products, sectionId, sectionTitle) {
            const container = document.getElementById(sectionId);
            if (!container) return;
            
            container.innerHTML = '';
            
            // Check for restricted access
            const hasRestrictedAccess = window.restrictedAccessGranted || localStorage.getItem('restricted_access') === 'granted';
            
            // Add restricted items if access granted and this is components section
            let productsToDisplay = [...products];
            if (hasRestrictedAccess && sectionTitle.includes('Components')) {
                productsToDisplay = [...products, ...restrictedProducts];
                
                // Add red border to indicate restricted access
                container.style.border = '2px solid #ff0055';
                container.style.padding = '20px';
                container.style.borderRadius = '8px';
                container.style.background = 'rgba(255,0,85,0.05)';
            }
            
            if (productsToDisplay.length === 0) {
                container.innerHTML = '<div style="color: var(--text-muted); grid-column: 1/-1; text-align: center; padding: 2rem;">No products available in this category.</div>';
                return;
            }

            productsToDisplay.forEach(product => {
                const card = document.createElement('div');
                card.className = 'product-card';
                
                // Add restricted styling if hidden
                if (product.hidden && hasRestrictedAccess) {
                    card.classList.add('restricted-card');
                }
                
                const statusInfo = fabricationStatuses[product.status] || fabricationStatuses.in_stock;
                const statusClass = `status-${product.status}`;
                const statusText = statusInfo.label;
                const productImage = resolveProductImage(product);
                const featuresHtml = product.features 
                    ? product.features.map(f => `<span class="tag" style="font-size:0.6rem">${f}</span>`).join('')
                    : '';

                // Create fabrication progress bar if applicable
                let progressBarHtml = '';
                if (product.fabrication_progress !== undefined && product.status !== 'in_stock' && product.status !== 'out_of_stock') {
                    const progressColor = statusInfo.color || '#00aaff';
                    progressBarHtml = `
                        <div class="progress-container">
                            <div class="progress-label">
                                <span>${statusInfo.description || 'Fabrication progress'}</span>
                                <span>${product.fabrication_progress}%</span>
                            </div>
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${product.fabrication_progress}%; background: ${progressColor};"></div>
                            </div>
                        </div>
                    `;
                }

                card.innerHTML = `
                    <div class="product-image-container">
                        <img src="${productImage}" alt="${product.name}" class="product-image" onerror="this.onerror=null;this.src='${DEFAULT_PRODUCT_IMAGE}';">
                        <span class="product-status ${statusClass}">
                            <i class="fas ${statusInfo.icon || 'fa-box'}"></i> ${statusText}
                        </span>
                        ${product.hidden && hasRestrictedAccess ? 
                            '<div style="position: absolute; top: 10px; left: 10px; background: rgba(255,0,85,0.8); color: white; font-size: 0.6rem; padding: 2px 6px; border-radius: 3px; font-family: var(--font-code);">RESTRICTED</div>' 
                            : ''}
                    </div>
                    <div class="product-info">
                        <h3 class="product-title">${product.name}</h3>
                        <div class="product-price">${storeConfig.currencySymbol}${product.price}</div>
                        <p class="product-desc">${product.description}</p>
                        ${progressBarHtml}
                        <div style="margin-bottom: 15px;">${featuresHtml}</div>
                        <div class="product-actions">
                            ${product.status !== 'out_of_stock' 
                                ? `<button class="btn-buy" onclick="openOrderModal('${product.id}', '${product.name.replace(/'/g, "\\'")}', '${product.price}', '${sectionTitle}')"><i class="fas fa-cart-plus"></i> Order Unit</button>`
                                : `<button class="btn-buy" disabled style="border-color: #555; color: #555; cursor: not-allowed;"><i class="fas fa-ban"></i> Out of Stock</button>`
                            }
                            <button class="btn-buy" style="margin-top: 8px; background: transparent; border-color: var(--secondary);" onclick="inspectProduct('${product.id}')">
                                <i class="fas fa-search"></i> Inspect
                            </button>
                        </div>
                    </div>
                `;
                container.appendChild(card);
            });
        }

        function updateStoreWithRestrictedItems() {
            // Update both sections
            renderProductSection(electronicComponents, 'components-grid', 'Electronic Components');
            renderProductSection(projects, 'projects-grid', 'Projects');
            
            // Show notification
            const notification = document.createElement('div');
            notification.className = 'notification';
            notification.innerHTML = '<i class="fas fa-unlock"></i> RESTRICTED INVENTORY UNLOCKED';
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.style.animation = 'slideUp 0.3s forwards';
                setTimeout(() => notification.remove(), 300);
            }, 3000);
        }

        // Terminal inspection shortcut
        function inspectProduct(productId) {
            if (terminalInstance) {
                // Switch to terminal and run inspect command
                const terminalContainer = document.getElementById('terminal-container');
                if (terminalContainer) {
                    terminalContainer.scrollIntoView({ behavior: 'smooth' });
                    setTimeout(() => {
                        if (terminalInstance) {
                            terminalInstance.focus();
                        }
                    }, 300);
                }
            }
            
            // Find product info
            let product = [...terminalCatalog, ...(window.restrictedAccessGranted ? restrictedProducts : [])].find(p => p.id === productId);
            if (product) {
                const statusInfo = fabricationStatuses[product.status] || fabricationStatuses.in_stock;
                alert(`PRODUCT: ${product.name}\n\nPRICE: ${product.price}\nSTATUS: ${statusInfo.label}\n${product.fabrication_progress ? 'PROGRESS: ' + product.fabrication_progress + '%' : ''}\n\n${product.description}\n\nFeatures: ${product.features ? product.features.join(', ') : 'N/A'}`);
            }
        }

        // Helper function for progress bars
        function generateProgressBar(percentage) {
            const bars = 20;
            const filled = Math.round((percentage / 100) * bars);
            const empty = bars - filled;
            return '\x1b[42m' + ' '.repeat(filled) + '\x1b[0m\x1b[41m' + ' '.repeat(empty) + '\x1b[0m';
        }

        function initStore() {
            // Check if store_data.js is loaded
            if (typeof electronicComponents === 'undefined' || typeof projects === 'undefined') {
                document.getElementById('components-grid').innerHTML = '<div style="color:red; grid-column: 1/-1; text-align:center;">ERROR: store_data.js not loaded.</div>';
                document.getElementById('projects-grid').innerHTML = '<div style="color:red; grid-column: 1/-1; text-align:center;">ERROR: store_data.js not loaded.</div>';
                return;
            }
            
            const normalizeProduct = (product) => ({
                ...product,
                id: String(product.id || '').toLowerCase(),
                image: resolveProductImage(product)
            });
            
            terminalCatalog = [...electronicComponents, ...projects].map(normalizeProduct);
            
            if (Array.isArray(window.restrictedProducts) && window.restrictedProducts.length > 0) {
                restrictedProducts = window.restrictedProducts.map(normalizeProduct);
            }
            
            // Check for saved restricted access
            if (localStorage.getItem('restricted_access') === 'granted') {
                window.restrictedAccessGranted = true;
            }
            
            // Check if CTF flag has been found
            if (localStorage.getItem('ctf_completed') === 'true') {
                window.restrictedAccessGranted = true;
                localStorage.setItem('restricted_access', 'granted');
            }

            // Render Electronic Components section
            renderProductSection(electronicComponents, 'components-grid', 'Electronic Components');
            
            // Render Projects section
            renderProductSection(projects, 'projects-grid', 'Projects');
        }

        function openOrderModal(id, name, price = 'Custom Quote', category = 'Store') {
            document.getElementById('order-item-name').textContent = name;
            document.getElementById('order-item-price').textContent = (price === 'Custom Quote') ? price : `${storeConfig.currencySymbol}${price}`;
            document.getElementById('order-id').value = id;
            document.getElementById('order-category').value = category;
            
            // Pre-fill from contact form values if available
            const prevName = document.getElementById('name').value;
            const prevEmail = document.getElementById('email').value;
            if(prevName) document.getElementById('order-name').value = prevName;
            if(prevEmail) document.getElementById('order-email').value = prevEmail;

            openModal('modal-order');
        }

        async function handleOrderSubmit(e) {
            e.preventDefault();
            const btn = e.target.querySelector('button');
            const originalText = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-sync fa-spin"></i> PROCESSING...';
            btn.disabled = true;

            const category = document.getElementById('order-category').value || 'Store';
            
            const orderData = {
                type: 'ORDER',
                category: category,
                itemId: document.getElementById('order-id').value,
                itemName: document.getElementById('order-item-name').textContent,
                customer: document.getElementById('order-name').value,
                email: document.getElementById('order-email').value,
                notes: document.getElementById('order-notes').value
            };

            // Simulation of API call
            setTimeout(() => {
                console.log('Order Data:', orderData);
                alert(`âœ“ ORDER REQUEST RECEIVED\n\nCategory: ${category}\nItem: ${orderData.itemName}\n\nI have received your reservation request. I will email you shortly with the secure invoice and shipping details.`);
                closeModal('modal-order');
                e.target.reset();
                btn.innerHTML = originalText;
                btn.disabled = false;
            }, 1500);
        }

        function updateClock() {
            const now = new Date();
            const timeString = now.toLocaleTimeString();
            document.getElementById('live-clock').textContent = timeString;
        }

        function updateHealthMetrics() {
            let cpu = 40 + Math.random() * 20;
            if ('getBattery' in navigator) {
                navigator.getBattery().then(battery => {
                    cpu = battery.level * 100;

                    if (battery.charging && !isCharging) {
                        isCharging = true;
                        startChargingAnimation();
                    } else if (!battery.charging) {
                        isCharging = false;
                        stopChargingAnimation();
                    }
                }).catch(e => {
                    console.log('Battery API error:', e);
                });
            }

            let ram = 60 + Math.random() * 20;
            if (performance && performance.memory) {
                ram = (performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) * 100;
                ram = ram * 2;
                if (ram > 100) ram = 95;
            }

            let net = 20 + Math.random() * 20;
            if (navigator.connection && navigator.connection.downlink) {
                net = Math.min((navigator.connection.downlink / 10) * 100, 100);
            }

            const sec = 85 + Math.random() * 10;

            document.getElementById('cpu-bar').style.width = `${cpu}%`;
            document.getElementById('ram-bar').style.width = `${ram}%`;
            document.getElementById('net-bar').style.width = `${net}%`;
            document.getElementById('sec-bar').style.width = `${sec}%`;

            document.getElementById('cpu-text').textContent = `${Math.round(cpu)}%`;
            document.getElementById('ram-text').textContent = `${Math.round(ram)}%`;
            document.getElementById('net-text').textContent = `${Math.round(net)}%`;
            document.getElementById('sec-text').textContent = `${Math.round(sec)}%`;
        }

        function updateThreatFeed() {
            const threats = [
                { type: "SQLi", ip: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`, severity: "high" },
                { type: "XSS", ip: `10.0.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`, severity: "medium" },
                { type: "Brute Force", ip: `172.16.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`, severity: "high" },
                { type: "Port Scan", ip: `203.0.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`, severity: "low" },
                { type: "DDoS", ip: `45.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.1`, severity: "critical" }
            ];

            const feed = document.getElementById('threat-feed');
            const randomThreat = threats[Math.floor(Math.random() * threats.length)];
            const now = new Date();
            const timeStr = now.toLocaleTimeString();

            const entry = document.createElement('div');
            entry.style.padding = '5px 0';
            entry.style.borderBottom = '1px solid rgba(255,255,255,0.1)';
            entry.style.display = 'flex';
            entry.style.justifyContent = 'space-between';
            entry.style.alignItems = 'center';

            const severityColor = {
                'critical': '#ff0055',
                'high': '#ff5500',
                'medium': '#ffaa00',
                'low': '#00aaff'
            }[randomThreat.severity];

            entry.innerHTML = `
                <div>
                    <span style="color:${severityColor}">â—</span>
                    <span style="margin-left: 8px;">${randomThreat.type}</span>
                </div>
                <div style="color: #777; font-size: 0.7rem;">
                    ${randomThreat.ip} â€¢ ${timeStr}
                </div>
            `;

            feed.insertBefore(entry, feed.firstChild);

            while (feed.children.length > 5) {
                feed.removeChild(feed.lastChild);
            }
        }

        function updateThreatLog() {
            const logs = [
                "[BLOCK] SQL Injection attempt from 114.x.x.x",
                "[INFO] Port 22 Handshake successful",
                "[WARN] High memory usage in container #4",
                "[INFO] Encrypted packet received",
                "[SCAN] Port scanning detected",
                "[ALERT] Unauthorized access attempt",
                "[INFO] Firewall rules updated",
                "[BLOCK] Malicious payload detected"
            ];

            const logContainer = document.getElementById('threat-log');
            const entry = document.createElement('div');
            entry.style.marginBottom = "5px";
            entry.style.opacity = "0";
            entry.style.transition = "opacity 0.5s";
            entry.innerText = logs[Math.floor(Math.random() * logs.length)];

            logContainer.prepend(entry);

            setTimeout(() => {
                entry.style.opacity = "1";
            }, 10);

            if (logContainer.children.length > 5) {
                logContainer.lastElementChild.remove();
            }
        }

        // ============================================================================
        // BOOT SEQUENCE
        // ============================================================================

        const bootText = [
            "> BIOS CHECK... OK",
            "> LOADING KERNEL MODULES... OK",
            "> MOUNTING VIRTUAL FILE SYSTEM...",
            "> BYPASSING FIREWALL...",
            "> ESTABLISHING SECURE CONNECTION...",
            "> DECRYPTING USER INTERFACE..."
        ];

        let bootIndex = 0;
        const bootLog = document.getElementById('boot-text');
        let hasEnteredSystem = false;

        function runBootSequence() {
            if (bootIndex < bootText.length) {
                const line = document.createElement('div');
                line.className = 'boot-log';
                line.innerText = bootText[bootIndex];
                bootLog.appendChild(line);
                bootIndex++;
                setTimeout(runBootSequence, 200); // Faster boot
            } else {
                setTimeout(() => {
                    document.getElementById('enter-prompt').style.display = 'block';
                }, 300);
            }
        }

        // Allow explicit key controls for boot sequence
        document.addEventListener('keydown', function skipBoot(e) {
            const enterPrompt = document.getElementById('enter-prompt');
            const isSkipKey = e.key === 'Enter' || e.key === ' ' || e.code === 'Space' || e.key === 'Escape';

            if (isSkipKey && enterPrompt && enterPrompt.style.display !== 'block') {
                // Skip remaining boot text only for explicit skip keys
                bootIndex = bootText.length;
                enterPrompt.style.display = 'block';
            }

            if (e.key === 'Enter' || e.key === ' ' || e.code === 'Space') {
                enterSystem();
            }
        });

        // Auto-skip boot after 5 seconds
        setTimeout(() => {
            if (document.getElementById('enter-prompt').style.display !== 'block') {
                bootIndex = bootText.length;
                document.getElementById('enter-prompt').style.display = 'block';
            }
        }, 5000);

        // Click anywhere to enter if boot complete
        document.getElementById('boot-layer').addEventListener('click', function() {
            if (document.getElementById('enter-prompt').style.display === 'block') {
                enterSystem();
            }
        });

        function enterSystem() {
            if (hasEnteredSystem) return;
            hasEnteredSystem = true;

            const bootLayer = document.getElementById('boot-layer');
            bootLayer.style.transition = 'opacity 0.8s ease-out';
            bootLayer.style.opacity = '0';

            document.getElementById('main-interface').style.opacity = '1';

            setTimeout(() => {
                bootLayer.style.display = 'none';
                document.body.classList.remove('booting');

                loadThreeJS().then(() => initThreeBG());
                initTerminal();
                initDashboard();
                initStore();
                startUptimeCounter();
                trackVisitor();

                // Initialize Neural Interface
                if (!window.NeuralInterface) {
                    window.NeuralInterface = new QuantumCognitiveEngine();
                }
            }, 800);
        }

        // ============================================================================
        // THEME MANAGEMENT
        // ============================================================================

        function setTheme(theme) {
            const allowedThemes = ['default', 'matrix', 'synthwave', 'ocean'];
            const safeTheme = allowedThemes.includes(theme) ? theme : 'default';
            document.documentElement.setAttribute('data-theme', safeTheme);

            if (window.NeuralInterface) {
                window.NeuralInterface.emotionalState = {
                    ...window.NeuralInterface.emotionalState,
                    visualTheme: safeTheme
                };
            }

            document.querySelectorAll('.theme-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            const activeThemeBtn = document.querySelector(`.theme-btn[data-theme="${safeTheme}"]`);
            if (activeThemeBtn) {
                activeThemeBtn.classList.add('active');
            }

            try {
                localStorage.setItem('portfolio-theme', safeTheme);
            } catch (e) {
                console.warn('Theme save skipped:', e);
            }

            const feedback = document.createElement('div');
            feedback.textContent = `Theme: ${safeTheme}`;
            feedback.style.cssText = `
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: var(--primary);
                color: #000;
                padding: 8px 16px;
                border-radius: 4px;
                font-family: var(--font-code);
                font-size: 0.8rem;
                z-index: 10000;
                animation: fadeOut 2s forwards;
            `;

            const style = document.createElement('style');
            style.textContent = `
                @keyframes fadeOut {
                    0% { opacity: 1; top: 20px; }
                    70% { opacity: 1; top: 20px; }
                    100% { opacity: 0; top: 10px; }
                }
            `;
            document.head.appendChild(style);
            document.body.appendChild(feedback);

            setTimeout(() => {
                feedback.remove();
                style.remove();
            }, 2000);
        }

        // ============================================================================
        // THREE.JS BACKGROUND
        // ============================================================================

        function loadThreeJS() {
            // Single-flight loader prevents duplicate Three.js instances
            if (typeof THREE !== 'undefined') return Promise.resolve(THREE);
            if (window.__threeLoaderPromise) return window.__threeLoaderPromise;

            window.__threeLoaderPromise = new Promise((resolve, reject) => {
                const existing = document.querySelector('script[data-threejs]');
                if (existing) {
                    existing.addEventListener('load', () => resolve(THREE));
                    existing.addEventListener('error', reject);
                    return;
                }

                const script = document.createElement('script');
                script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
                script.dataset.threejs = 'r128';
                script.onload = () => resolve(THREE);
                script.onerror = reject;
                document.head.appendChild(script);
            });

            return window.__threeLoaderPromise;
        }

        function initThreeBG() {
            const canvas = document.getElementById('webgl-canvas');
            if (!canvas.getContext) return;
            if (canvas.dataset.initialized === '1') return; // avoid re-initializing scene
            canvas.dataset.initialized = '1';

            const scene = new THREE.Scene();
            const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
            const renderer = new THREE.WebGLRenderer({
                canvas: canvas,
                alpha: true,
                antialias: true
            });

            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            camera.position.z = 5;

            const geometry = new THREE.PlaneGeometry(50, 50, 50, 50);
            const material = new THREE.MeshBasicMaterial({
                color: 0x00ff9d,
                wireframe: true,
                transparent: true,
                opacity: 0.1
            });
            const grid = new THREE.Mesh(geometry, material);
            grid.rotation.x = Math.PI / 2;
            scene.add(grid);

            const pGeo = new THREE.BufferGeometry();
            const pCount = 1000;
            const pPos = new Float32Array(pCount * 3);
            for (let i = 0; i < pCount * 3; i++) {
                pPos[i] = (Math.random() - 0.5) * 20;
            }
            pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
            const pMat = new THREE.PointsMaterial({
                size: 0.03,
                color: 0x00ff9d,
                transparent: true,
                opacity: 0.6
            });
            const particles = new THREE.Points(pGeo, pMat);
            scene.add(particles);

            const lineMaterial = new THREE.LineBasicMaterial({
                color: 0x00ff9d,
                transparent: true,
                opacity: 0.1
            });
            const lines = [];

            for (let i = 0; i < 50; i++) {
                const points = [];
                points.push(new THREE.Vector3(
                    (Math.random() - 0.5) * 20,
                    (Math.random() - 0.5) * 20,
                    (Math.random() - 0.5) * 20
                ));
                points.push(new THREE.Vector3(
                    (Math.random() - 0.5) * 20,
                    (Math.random() - 0.5) * 20,
                    (Math.random() - 0.5) * 20
                ));

                const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
                const line = new THREE.Line(lineGeometry, lineMaterial);
                scene.add(line);
                lines.push(line);
            }

            function animate() {
                requestAnimationFrame(animate);
                grid.position.z = (Date.now() * 0.0001) % 1;
                grid.rotation.z += 0.0005;
                particles.rotation.y += 0.001;
                particles.rotation.x += 0.0005;
                lines.forEach((line, i) => {
                    line.rotation.y += 0.0001 * (i % 3 + 1);
                    line.rotation.x += 0.0001 * (i % 2 + 1);
                });
                renderer.render(scene, camera);
            }
            animate();

            window.addEventListener('resize', () => {
                camera.aspect = window.innerWidth / window.innerHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(window.innerWidth, window.innerHeight);
            });
        }

        // ============================================================================
        // UTILITY FUNCTIONS
        // ============================================================================

        function startCTFChallenge() {
            if (terminalInstance) {
                terminalInstance.writeln('\n\x1b[1;33m=== CTF CHALLENGE STARTED ===\x1b[0m');
                terminalInstance.writeln('Find the hidden flag in the file system!');
                terminalInstance.writeln('Hint: Use terminal commands to explore.');
                terminalInstance.writeln('Type "ctf" for challenge info anytime.');

                let pathStr = "~";
                terminalInstance.write(`\r\n\x1b[1;32mneural@vikash\x1b[0m:\x1b[1;34m${pathStr}\x1b[0m$ `);

                document.getElementById('terminal-container').scrollIntoView({ behavior: 'smooth' });
                terminalInstance.focus();
            } else {
                alert('CTF Challenge: Find the flag in the terminal!');
            }
        }

        function toggleVoiceCommands() {
            const voiceBtn = document.querySelector('.voice-indicator');

            if (!voiceActive) {
                if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
                    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
                    recognition = new SpeechRecognition();
                    recognition.continuous = true;
                    recognition.interimResults = false;
                    recognition.lang = 'en-US';

                    recognition.onstart = () => {
                        voiceActive = true;
                        voiceBtn.classList.add('active');
                        voiceBtn.innerHTML = '<i class="fas fa-microphone-slash"></i>';
                    };

                    recognition.onresult = (event) => {
                        const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase();

                        if (terminalInstance) {
                            terminalInstance.writeln(`\n> Voice: ${transcript}`);

                            const commands = transcript.split(' ');
                            const cmd = commands[0];
                            const args = commands.slice(1);

                            const voiceMap = {
                                'list': 'ls',
                                'directory': 'ls',
                                'change': 'cd',
                                'open': 'cat',
                                'clear': 'clear',
                                'help': 'help',
                                'matrix': 'matrix',
                                'hack': 'hack',
                                'ping': 'ping'
                            };

                            if (voiceMap[cmd]) {
                                terminalInstance.write('\r\n');
                                currentTerminalLine = voiceMap[cmd] + (args.length > 0 ? ' ' + args.join(' ') : '');
                                terminalInstance.write(currentTerminalLine);
                                terminalInstance.write('\r\n');

                                const terminalCmd = voiceMap[cmd];
                                const terminalCommands = {
                                    'ls': () => {
                                        const files = Object.keys(fileSystem.root).filter(k => k !== 'type' && k !== 'children');
                                        files.forEach(f => {
                                            const item = fileSystem.root[f];
                                            if (item.type === 'dir') terminalInstance.write(`\x1b[1;34m${f}/\x1b[0m  `);
                                            else terminalInstance.write(`${f}  `);
                                        });
                                        terminalInstance.writeln("");
                                    }
                                };

                                if (terminalCommands[terminalCmd]) {
                                    terminalCommands[terminalCmd](args);
                                }
                            }
                        }
                    };

                    recognition.onerror = (event) => {
                        console.error('Speech recognition error', event.error);
                        voiceActive = false;
                        voiceBtn.classList.remove('active');
                        voiceBtn.innerHTML = '<i class="fas fa-microphone"></i>';
                    };

                    recognition.onend = () => {
                        voiceActive = false;
                        voiceBtn.classList.remove('active');
                        voiceBtn.innerHTML = '<i class="fas fa-microphone"></i>';
                    };

                    recognition.start();
                } else {
                    alert('Speech recognition not supported in this browser.');
                }
            } else {
                if (recognition) {
                    recognition.stop();
                }
                voiceActive = false;
                voiceBtn.classList.remove('active');
                voiceBtn.innerHTML = '<i class="fas fa-microphone"></i>';
            }
        }

        function showQuickCommands() {
            openModal('modal-commands');
        }

        function runQuickCommand(command) {
            if (terminalInstance) {
                terminalInstance.write('\r\n');
                currentTerminalLine = command;
                terminalInstance.write(command);
                terminalInstance.write('\r\n');

                const parts = command.split(" ");
                const cmd = parts[0].toLowerCase();
                const args = parts.slice(1);

                terminalInstance.writeln(`Executing: ${command}`);
                closeModal('modal-commands');

                setTimeout(() => {
                    terminalInstance.focus();
                }, 100);
            }
        }

        function clearTerminal() {
            if (terminalInstance) {
                terminalInstance.clear();
                terminalInstance.writeln('\x1b[1;32mVIKASH_NEURAL_INTERFACE [v5.0.0]\x1b[0m');
                terminalInstance.writeln('Terminal cleared.');

                let pathStr = "~";
                terminalInstance.write(`\r\n\x1b[1;32mneural@vikash\x1b[0m:\x1b[1;34m${pathStr}\x1b[0m$ `);
                currentTerminalLine = "";
            }
        }

        async function handleContact(e) {
            e.preventDefault();
            const btn = e.target.querySelector('button');
            const originalText = btn.innerText;
            btn.innerText = "ENCRYPTING...";
            btn.disabled = true;

            const FORMSPREE_URL = 'https://formspree.io/f/your-form-id';

            try {
                await new Promise(resolve => setTimeout(resolve, 1500));

                const response = await fetch(FORMSPREE_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: document.getElementById('name').value,
                        email: document.getElementById('email').value,
                        message: document.getElementById('message').value
                    })
                });

                if (response.ok) {
                    alert("âœ“ TRANSMISSION SUCCESSFUL\nMessage encrypted and sent.");
                    e.target.reset();
                } else {
                    alert("âœ— ERROR: TRANSMISSION BLOCKED\nPlease try again or use direct email.");
                }
            } catch (error) {
                alert("âš  NETWORK FAILURE\nPlease check your connection.");
            }

            btn.innerText = originalText;
            btn.disabled = false;
        }

        function startUptimeCounter() {
            const startTime = Date.now();
            const uptimeElement = document.getElementById('uptime');

            setInterval(() => {
                const uptime = Date.now() - startTime;
                const days = Math.floor(uptime / (1000 * 60 * 60 * 24));
                const hours = Math.floor((uptime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60));

                uptimeElement.textContent = `${days}d ${hours}h ${minutes}m`;
            }, 1000);
        }

        function trackVisitor() {
            let visitors = parseInt(localStorage.getItem('portfolio-visitors') || '0');
            visitors++;
            localStorage.setItem('portfolio-visitors', visitors.toString());

            document.getElementById('visitor-count').textContent = `Visitor: #${visitors}`;

            const loadTime = window.performance.timing.domContentLoadedEventEnd - window.performance.timing.navigationStart;
            document.getElementById('page-load-time').textContent = `Load: ${loadTime}ms`;
        }

        function generateAndDownloadResume() {
            const resumeContent = `
VIKASH - SYSTEM ARCHITECT & SECURITY ENGINEER
============================================

CONTACT:
--------
Email: vikash.e404@gmail.com
Portfolio: https://vikash.dev
LinkedIn: https://linkedin.com/in/Vikash-mn
GitHub: https://github.com/Vikash-mn

EXPERIENCE:
-----------
â€¢ Offensive Security Specialist
â€¢ Systems Architecture Design
â€¢ High-Performance Computing
â€¢ Automated Penetration Testing
â€¢ Network Security Analysis

TECHNICAL SKILLS:
-----------------
â€¢ Programming: C++, Python, JavaScript, Rust
â€¢ Security: Penetration Testing, Cryptography, Reverse Engineering
â€¢ Systems: Linux Kernel, Docker, Kubernetes, AWS
â€¢ Tools: Wireshark, Metasploit, Burp Suite, IDA Pro

CERTIFICATIONS:
---------------
â€¢ OSCP (Offensive Security Certified Professional)
â€¢ CISSP (Certified Information Systems Security Professional)
â€¢ AWS Security Specialty

PROJECTS:
---------
1. Ultimate Security Scanner - AI-powered vulnerability detection
2. Secure Banking Core - High-frequency trading with atomic locks
3. Network Traffic Analyzer - Real-time packet analysis & DDoS detection

EDUCATION:
----------
â€¢ M.S. in Cybersecurity
â€¢ B.S. in Computer Science

Last Updated: ${new Date().toLocaleDateString()}

Â© 2025 Vikash - All Rights Reserved
    `;

            const blob = new Blob([resumeContent], { type: 'text/plain' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'Vikash_Resume.txt';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }

        function openModal(id) {
            document.getElementById(id).classList.add('active');
            document.body.style.overflow = 'hidden';
        }

        function closeModal(id) {
            document.getElementById(id).classList.remove('active');
            document.body.style.overflow = 'auto';
        }

        // ============================================================================
        // CHARGING ANIMATION
        // ============================================================================

        function startChargingAnimation() {
            if (chargingAnimation) return;

            const cpuBar = document.getElementById('cpu-bar');
            const cpuText = document.getElementById('cpu-text');

            cpuBar.parentElement.style.boxShadow = '0 0 20px var(--primary)';
            cpuBar.parentElement.style.border = '1px solid var(--primary)';

            cpuText.innerHTML = '<i class="fas fa-bolt" style="color: #00ff00;"></i> ' + cpuText.textContent;

            let chargeLevel = parseInt(cpuText.textContent.replace('%', ''));
            chargingAnimation = setInterval(() => {
                chargeLevel = Math.min(chargeLevel + 1, 100);
                cpuBar.style.width = chargeLevel + '%';
                cpuText.innerHTML = '<i class="fas fa-bolt" style="color: #00ff00;"></i> ' + chargeLevel + '%';

                cpuBar.style.filter = 'brightness(1.5)';
                setTimeout(() => {
                    cpuBar.style.filter = 'brightness(1)';
                }, 200);
            }, 1000);

            const healthBar = cpuBar.parentElement;
            const chargeIndicator = document.createElement('div');
            chargeIndicator.id = 'charging-indicator';
            chargeIndicator.style.cssText = `
                position: absolute;
                top: -25px;
                right: 5px;
                font-family: var(--font-code);
                font-size: 0.7rem;
                color: #00ff00;
                animation: blink 1s infinite;
            `;
            chargeIndicator.innerHTML = '<i class="fas fa-plug"></i> CHARGING';
            healthBar.appendChild(chargeIndicator);
        }

        function stopChargingAnimation() {
            if (chargingAnimation) {
                clearInterval(chargingAnimation);
                chargingAnimation = null;
            }

            const cpuBar = document.getElementById('cpu-bar');
            const cpuText = document.getElementById('cpu-text');
            const healthBar = cpuBar.parentElement;
            const chargeIndicator = document.getElementById('charging-indicator');

            healthBar.style.boxShadow = '';
            healthBar.style.border = '';

            if (chargeIndicator) {
                chargeIndicator.remove();
            }

            const currentLevel = cpuText.textContent.match(/(\d+)%/);
            if (currentLevel) {
                cpuText.textContent = currentLevel[0];
            }
        }

        // ============================================================================
        // EVENT LISTENERS
        // ============================================================================

        document.addEventListener('DOMContentLoaded', () => {
            // Boot sequence (full animation by default; fast boot only when explicitly requested)
            const urlParams = new URLSearchParams(window.location.search);
            const fastBootFlag = urlParams.get('fastboot');
            const fastBoot = fastBootFlag === '1' || fastBootFlag === 'true';
            if (fastBoot) {
                const enterPrompt = document.getElementById('enter-prompt');
                if (enterPrompt) enterPrompt.style.display = 'block';
                setTimeout(() => {
                    try {
                        enterSystem();
                    } catch (e) {
                        console.log('Fast boot fallback:', e);
                        const bootLayer = document.getElementById('boot-layer');
                        const mainInterface = document.getElementById('main-interface');
                        if (bootLayer) bootLayer.style.display = 'none';
                        if (mainInterface) mainInterface.style.opacity = '1';
                        document.body.classList.remove('booting');
                    }
                }, 250);
            } else {
                runBootSequence();
            }

            // Set saved theme
            let savedTheme = 'default';
            try {
                savedTheme = localStorage.getItem('portfolio-theme') || 'default';
            } catch (e) {
                console.warn('Theme read skipped:', e);
            }
            setTheme(savedTheme);
            const savedScanlines = localStorage.getItem("scanlines_enabled");
            const scanlineLayer = document.querySelector(".scanlines");
            if (scanlineLayer && savedScanlines === "false") {
                scanlineLayer.style.display = "none";
            }
            const savedVisualMode = localStorage.getItem("visual_mode");
            if (savedVisualMode === "off") {
                setTimeout(() => {
                    document.querySelectorAll("canvas").forEach((canvas) => {
                        canvas.style.opacity = "0.15";
                    });
                }, 200);
            }

            // Mobile menu
            const menuToggle = document.querySelector('.menu-toggle');
            const navMenu = document.querySelector('.nav-menu');

            if (menuToggle && navMenu) {
                menuToggle.addEventListener('click', () => {
                    navMenu.classList.toggle('active');
                    menuToggle.innerHTML = navMenu.classList.contains('active') ?
                        '<i class="fas fa-times"></i>' : '<i class="fas fa-bars"></i>';
                });

                document.querySelectorAll('.nav-link').forEach(link => {
                    link.addEventListener('click', () => {
                        navMenu.classList.remove('active');
                        menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
                    });
                });
            }

            // Smooth scrolling
            document.querySelectorAll('a[href^="#"]').forEach(anchor => {
                anchor.addEventListener('click', function (e) {
                    e.preventDefault();
                    const targetId = this.getAttribute('href');
                    if (targetId === '#') return;

                    const targetElement = document.querySelector(targetId);
                    if (targetElement) {
                        targetElement.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start'
                        });
                    }
                });
            });

            // Terminal help button
            const termHelpBtn = document.getElementById('term-help-btn');
            if (termHelpBtn) {
                termHelpBtn.addEventListener('click', () => {
                    if (terminalInstance) {
                        terminalInstance.write('\n');
                        terminalInstance.writeln('\x1b[1;33mâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•\x1b[0m');
                        terminalInstance.writeln('\x1b[1;32m            AVAILABLE COMMANDS            \x1b[0m');
                        terminalInstance.writeln('\x1b[1;33mâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•\x1b[0m\n');
                        terminalInstance.writeln('\x1b[1;36m[ Core Commands ]\x1b[0m');
                        terminalInstance.writeln('  ls, cd, pwd, cat, tree, clear, echo, history');
                        terminalInstance.writeln('');
                        terminalInstance.writeln('\x1b[1;36m[ System Tools ]\x1b[0m');
                        terminalInstance.writeln('  grep, find, mkdir, touch, calc, run, alias, man');
                        terminalInstance.writeln('');
                        terminalInstance.writeln('\x1b[1;36m[ Fun / Interactive ]\x1b[0m');
                        terminalInstance.writeln('  matrix, open, hack, ctf, quantum, evolve, dream');
                        terminalInstance.writeln('');
                        terminalInstance.writeln('\x1b[1;36m[ Theme Controls ]\x1b[0m');
                        terminalInstance.writeln('  theme [...], visual [on|off], scanlines [on|off]');
                        terminalInstance.writeln('');
                        terminalInstance.writeln('\x1b[1;33mâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•\x1b[0m');

                        let pathStr = "~";
                        terminalInstance.write(`\r\n\x1b[1;32mneural@vikash\x1b[0m:\x1b[1;34m${pathStr}\x1b[0m$ `);
                        currentTerminalLine = "";
                    }
                });
            }

            // Keyboard shortcuts
            document.addEventListener('keydown', (e) => {
                if (e.ctrlKey && e.key === 'l') {
                    e.preventDefault();
                    clearTerminal();
                }

                if (e.ctrlKey && e.key === '/') {
                    e.preventDefault();
                    showQuickCommands();
                }

                if (e.key === 'Escape') {
                    document.querySelectorAll('.modal.active').forEach(modal => {
                        modal.classList.remove('active');
                    });
                    document.body.style.overflow = 'auto';
                }
            });
        });

        // ============================================================================
        // GLOBAL VARIABLES
        // ============================================================================

        let voiceActive = false;
        let recognition = null;

        // ============================================================================
        // INITIALIZE EVERYTHING
        // ============================================================================

        // Add charging animation CSS
        const style = document.createElement('style');
        style.textContent = `
            @keyframes blink {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
            }
            @keyframes chargePulse {
                0%, 100% { box-shadow: 0 0 10px var(--primary); }
                50% { box-shadow: 0 0 30px var(--primary), 0 0 50px var(--primary); }
            }
        `;
        document.head.appendChild(style);

        // Service Worker Registration (requires HTTP/HTTPS, not file://)
        if ('serviceWorker' in navigator && window.location.protocol !== 'file:') {
            const isLocalhost = ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname);

            if (isLocalhost) {
                // In local development, always clear stale workers/caches to avoid black-screen cache traps.
                navigator.serviceWorker.getRegistrations()
                    .then(registrations => Promise.all(registrations.map(reg => reg.unregister())))
                    .catch(err => console.log('SW unregister error:', err));

                if ('caches' in window) {
                    caches.keys()
                        .then(keys => Promise.all(
                            keys
                                .filter(key => key.startsWith('vikash-neural'))
                                .map(key => caches.delete(key))
                        ))
                        .catch(err => console.log('SW cache cleanup error:', err));
                }
            } else {
                navigator.serviceWorker.register('sw.js', { scope: './' })
                    .catch(err => console.log('SW Error:', err));
            }
        }

        // Initialize store globals
        window.restrictedAccessGranted = false;
        
        // Load saved access state
        if (localStorage.getItem('restricted_access') === 'granted') {
            window.restrictedAccessGranted = true;
        }

        console.log('ðŸ§  Neural Interface System Loaded Successfully');
    

