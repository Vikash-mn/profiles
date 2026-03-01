/**
 * neural-quantum.js
 * ============================================================================
 * Quantum Simulation Engine (renamed from "Quantum" - uses Math.random())
 * ============================================================================
 */

(function(global) {
    'use strict';

    /**
     * QuantumSimulationEngine - Classical simulation of quantum-like behavior
     * Note: This is NOT actual quantum computing - uses classical randomness
     */
    class QuantumSimulationEngine {
        constructor(qubits = 16) {
            this.qubits = qubits;
            this.stateSize = 2 ** qubits;
            this.waveFunction = new Float64Array(this.stateSize);
            this.entanglementMatrix = this.createEntanglementMatrix();
            this.superpositionDepth = 0;
            this.decoherence = 0;
            this.coherenceTime = 5000;
            
            this.initializeQuantumState();
            console.log(`%c[QUANTUM] ${this.qubits}-Qubit Simulation Engine | ${this.stateSize.toLocaleString()} States`, "color: #9d00ff");
        }

        initializeQuantumState() {
            this.waveFunction.fill(0);
            this.waveFunction[0] = 1.0;
            this.decoherence = 0;
            this.superpositionDepth = 0;
        }

        createEntanglementMatrix() {
            const matrix = new Array(this.qubits);
            for (let i = 0; i < this.qubits; i++) {
                matrix[i] = new Array(this.qubits).fill(0);
                if (i > 0) matrix[i][i-1] = 0.5;
                if (i < this.qubits - 1) matrix[i][i+1] = 0.5;
            }
            return matrix;
        }

        async quantumProcess(input) {
            const startTime = performance.now();
            
            // Encode input into quantum-like state
            const encoded = this.encodeToQuantumState(input);
            
            // Use input characteristics to drive quantum operations
            const inputHash = this.hashInput(input);
            
            // Initialize quantum state based on input
            this.initializeFromInput(encoded, inputHash);
            
            // Apply quantum operations driven by input hash
            const operations = Math.min(15, Math.floor(input.length / 5) + 3);
            
            for (let i = 0; i < operations; i++) {
                // Use input-derived values to select gates
                const qubitIndex = inputHash[i % inputHash.length] % this.qubits;
                const gateType = inputHash[(i + 3) % inputHash.length] % 3;
                const phase = (inputHash[(i + 7) % inputHash.length] % 360) * Math.PI / 180;
                
                switch(gateType) {
                    case 0: this.applyHadamard(qubitIndex); break;
                    case 1: this.applyPhase(qubitIndex, phase); break;
                    case 2: if (qubitIndex < this.qubits - 1) this.applyCNOT(qubitIndex, qubitIndex + 1); break;
                }
            }
            
            // Measure result
            const result = this.measure();
            const duration = performance.now() - startTime;
            
            return {
                ...result,
                processingTime: duration,
                operations: operations,
                coherence: 1 - (this.decoherence / this.coherenceTime),
                inputInfluence: { hash: inputHash.slice(0, 8), encodedAmplitudes: encoded.slice(0, 4) }
            };
        }

        hashInput(input) {
            const bytes = new TextEncoder().encode(input);
            const hash = new Array(16).fill(0);
            for (let i = 0; i < bytes.length; i++) {
                hash[i % 16] = (hash[i % 16] + bytes[i] * (i + 1)) % 256;
            }
            return hash;
        }

        initializeFromInput(encodedAmplitudes, inputHash) {
            this.waveFunction.fill(0);
            
            // Set initial state based on encoded input
            for (let i = 0; i < Math.min(encodedAmplitudes.length, this.qubits); i++) {
                const amplitude = encodedAmplitudes[i];
                const targetState = 1 << i;
                this.waveFunction[0] *= (1 - amplitude);
                this.waveFunction[targetState] = amplitude;
            }
            
            // Add input hash influence
            for (let i = 0; i < inputHash.length; i++) {
                const stateIndex = inputHash[i] % this.stateSize;
                this.waveFunction[stateIndex] += inputHash[i] / 2560;
            }
            
            // Normalize
            let norm = 0;
            for (let i = 0; i < this.waveFunction.length; i++) {
                norm += this.waveFunction[i] * this.waveFunction[i];
            }
            norm = Math.sqrt(norm);
            if (norm > 0) {
                for (let i = 0; i < this.waveFunction.length; i++) {
                    this.waveFunction[i] /= norm;
                }
            }
            
            this.decoherence = 0;
        }

        encodeToQuantumState(text) {
            const encoder = new TextEncoder();
            const bytes = encoder.encode(text);
            const quantumState = new Array(this.qubits).fill(0);
            
            for (let i = 0; i < Math.min(bytes.length, this.qubits); i++) {
                quantumState[i] = bytes[i] / 255;
            }
            
            return quantumState;
        }

        applyQuantumOperation(qubit, inputChar = 0) {
            // Use input-derived value instead of random for deterministic processing
            const operation = ['HADAMARD', 'PHASE', 'CNOT'][inputChar % 3];
            
            switch(operation) {
                case 'HADAMARD':
                    this.applyHadamard(qubit);
                    break;
                case 'PHASE':
                    this.applyPhase(qubit, Math.PI / 4);
                    break;
                case 'CNOT':
                    if (qubit < this.qubits - 1) {
                        this.applyCNOT(qubit, qubit + 1);
                    }
                    break;
            }
            
            this.decoherence += 0.01;
            this.superpositionDepth = Math.min(10, this.superpositionDepth + 0.1);
        }

        applyHadamard(qubit) {
            const amplitude = 1 / Math.sqrt(2);
            for (let i = 0; i < this.stateSize; i++) {
                this.waveFunction[i] *= amplitude;
            }
        }

        applyPhase(qubit, phase) {
            // Simplified phase shift (ignoring complex numbers for browser compatibility)
            for (let i = 0; i < this.stateSize; i++) {
                if ((i >> qubit) & 1) {
                    this.waveFunction[i] *= Math.cos(phase) + Math.sin(phase) * 0.5;
                }
            }
        }

        applyCNOT(control, target) {
            const size = this.stateSize;
            for (let i = 0; i < size; i += 2) {
                [this.waveFunction[i], this.waveFunction[i+1]] = 
                [this.waveFunction[i+1], this.waveFunction[i]];
            }
            
            // Update entanglement
            this.entanglementMatrix[control][target] = Math.min(1, 
                this.entanglementMatrix[control][target] + 0.3);
            this.entanglementMatrix[target][control] = this.entanglementMatrix[control][target];
        }

        measure() {
            const probabilities = new Array(this.stateSize);
            let total = 0;
            
            for (let i = 0; i < this.stateSize; i++) {
                probabilities[i] = this.waveFunction[i] * this.waveFunction[i];
                total += probabilities[i];
            }
            
            let random = Math.random() * total;
            let cumulative = 0;
            let collapsedState = 0;
            
            for (let i = 0; i < this.stateSize; i++) {
                cumulative += probabilities[i];
                if (random <= cumulative) {
                    collapsedState = i;
                    break;
                }
            }
            
            // Reset after measurement
            this.initializeQuantumState();
            
            return {
                state: collapsedState,
                binary: collapsedState.toString(2).padStart(this.qubits, '0'),
                probability: probabilities[collapsedState] / total,
                superposition: this.superpositionDepth,
                entanglement: this.calculateEntanglement()
            };
        }

        calculateEntanglement() {
            let total = 0;
            let count = 0;
            
            for (let i = 0; i < this.qubits; i++) {
                for (let j = i + 1; j < this.qubits; j++) {
                    total += this.entanglementMatrix[i][j];
                    count++;
                }
            }
            
            return count > 0 ? total / count : 0;
        }

        getQuantumMetrics() {
            return {
                qubits: this.qubits,
                states: this.stateSize,
                superpositionDepth: this.superpositionDepth.toFixed(2),
                decoherence: this.decoherence.toFixed(2),
                entanglement: this.calculateEntanglement().toFixed(2),
                coherence: (1 - (this.decoherence / this.coherenceTime)).toFixed(2)
            };
        }

        reset() {
            this.initializeQuantumState();
            console.log("%c[QUANTUM] Quantum state reset", "color: #9d00ff");
        }
    }

    /**
     * AdvancedQuantumCircuit - More detailed quantum circuit simulation
     */
    class AdvancedQuantumCircuit {
        constructor(qubits = 16) {
            this.numQubit = qubits;
            this.stateVector = new Array(2 ** qubits).fill(0);
            this.stateVector[0] = 1; // Start in |0> state
            this.gateHistory = [];
        }

        applyHadamard(qubit) {
            const newState = new Array(this.stateVector.length).fill(0);
            const factor = 1 / Math.sqrt(2);
            
            for (let i = 0; i < this.stateVector.length; i++) {
                const bit = (i >> qubit) & 1;
                if (bit === 0) {
                    newState[i] += this.stateVector[i] * factor;
                    newState[i | (1 << qubit)] += this.stateVector[i] * factor;
                } else {
                    newState[i] += this.stateVector[i] * factor;
                    newState[i & ~(1 << qubit)] += this.stateVector[i] * factor;
                }
            }
            
            this.stateVector = newState;
            this.gateHistory.push({ gate: 'H', qubit, time: Date.now() });
        }

        applyCNOT(control, target) {
            const newState = [...this.stateVector];
            
            for (let i = 0; i < this.stateVector.length; i++) {
                if ((i >> control) & 1) {
                    const targetBit = (i >> target) & 1;
                    const flipped = i ^ (1 << target);
                    newState[i] = this.stateVector[flipped];
                }
            }
            
            this.stateVector = newState;
            this.gateHistory.push({ gate: 'CNOT', control, target, time: Date.now() });
        }

        applyPauliX(qubit) {
            const newState = new Array(this.stateVector.length).fill(0);
            
            for (let i = 0; i < this.stateVector.length; i++) {
                const flipped = i ^ (1 << qubit);
                newState[flipped] = this.stateVector[i];
            }
            
            this.stateVector = newState;
            this.gateHistory.push({ gate: 'X', qubit, time: Date.now() });
        }

        measure() {
            const probabilities = this.stateVector.map(x => x * x);
            const random = Math.random();
            let cumulative = 0;
            
            for (let i = 0; i < probabilities.length; i++) {
                cumulative += probabilities[i];
                if (random <= cumulative) {
                    return {
                        state: i,
                        binary: i.toString(2).padStart(this.numQubit, '0'),
                        probability: probabilities[i]
                    };
                }
            }
            
            return { state: 0, binary: '0'.repeat(this.numQubit), probability: probabilities[0] };
        }

        runEntanglementProtocol() {
            this.applyHadamard(0);
            for (let i = 0; i < this.numQubit - 1; i++) {
                this.applyCNOT(i, i + 1);
            }
            return this.measure();
        }
    }

    // Export
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { QuantumSimulationEngine, AdvancedQuantumCircuit };
    } else {
        global.QuantumSimulationEngine = QuantumSimulationEngine;
        global.AdvancedQuantumCircuit = AdvancedQuantumCircuit;
    }

})(typeof window !== 'undefined' ? window : this);
