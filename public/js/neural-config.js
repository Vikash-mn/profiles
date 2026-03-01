/**
 * neural-config.js
 * ============================================================================
 * VERSION: VA.0
 * CONFIGURATION
 * ============================================================================
 */

(function(global) {
    'use strict';

    const NeuralConfig = {
        VERSION: 'VA.0',
        BACKEND_URL: (() => {
            const override = 
                (global.NEURAL_BACKEND_URL || 
                    localStorage.getItem('neural_backend_url') || 
                    '').trim();

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
                return "http://127.0.0.1:8016";
            }

            const isLikelyDev = 
                protocol === 'http:' && 
                port && 
                port !== '80' && 
                port !== '443';

            if (isLikelyDev) {
                return `http://${hostname}:8016`;
            }

            return "/api";
        })(),
        SYNC_INTERVAL: 30000,
        MAX_SYNC_ATTEMPTS: 3,
        SESSION_TIMEOUT: 300000,
        CACHE_MAX_SIZE: 1000,
        MEMORY_VERSION: 'v22'
    };

    // Export
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = NeuralConfig;
    } else {
        global.NeuralConfig = NeuralConfig;
    }

})(typeof window !== 'undefined' ? window : this);
