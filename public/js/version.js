/**
 * Central Version Configuration
 * Change VERSION here to update all files at once
 */
const VERSION = "VA.0";
const BUILD = "VA.0.001";
const APP_NAME = "Vikash Portfolio";
const APP_DESCRIPTION = "Synthetic Consciousness System";

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { VERSION, BUILD, APP_NAME, APP_DESCRIPTION };
}
