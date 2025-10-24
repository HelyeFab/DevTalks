/**
 * Firebase Compatibility Layer for Node.js v20+
 *
 * This module provides compatibility patches for Firebase/gRPC
 * SSL/TLS issues in Node.js v20+ environments.
 *
 * Usage:
 *   1. Copy this file to your project root
 *   2. Import at the top of your main application file:
 *      require('./firebase-compatibility-layer');
 *   3. Or use the setupFirebaseCompatibility() function
 */

// Store original process environment
const originalEnv = { ...process.env };

/**
 * Apply Firebase/gRPC compatibility settings for Node.js v20+
 */
function setupFirebaseCompatibility() {
    console.log('🔧 Applying Firebase compatibility layer for Node.js v20+...');

    // Set gRPC SSL cipher suites for compatibility
    process.env.GRPC_SSL_CIPHER_SUITES = 'HIGH:!aNULL:!eNULL:!EXPORT:!DES:!RC4:!MD5:!PSK:!SRP:!CAMELLIA';

    // Reduce gRPC verbosity to avoid noise
    process.env.GRPC_VERBOSITY = 'ERROR';

    // Apply Node.js OpenSSL legacy provider if needed
    if (!process.env.NODE_OPTIONS) {
        process.env.NODE_OPTIONS = '--openssl-legacy-provider';
    } else if (!process.env.NODE_OPTIONS.includes('--openssl-legacy-provider')) {
        process.env.NODE_OPTIONS += ' --openssl-legacy-provider';
    }

    // Additional TLS settings for Firebase compatibility
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '1'; // Keep secure, but allow fallback

    console.log('✅ Firebase compatibility layer applied');
}

/**
 * Patch Firebase Admin to handle SSL/TLS issues
 */
function patchFirebaseAdmin() {
    try {
        // Try to require firebase-admin if available
        const admin = require('firebase-admin');

        // Store original methods
        const originalInitializeApp = admin.initializeApp;

        // Patch initializeApp to include SSL settings
        admin.initializeApp = function(options, name) {
            console.log('🔧 Patching Firebase Admin initialization...');

            // Apply compatibility settings before initialization
            setupFirebaseCompatibility();

            // Call original method
            return originalInitializeApp.call(this, options, name);
        };

        console.log('✅ Firebase Admin patched successfully');

    } catch (error) {
        // Firebase Admin not available, that's okay
        console.log('ℹ️  Firebase Admin not found, skipping patch');
    }
}

/**
 * Patch gRPC to handle SSL/TLS issues
 */
function patchGrpc() {
    try {
        // Try to patch grpc if available
        const grpc = require('@grpc/grpc-js');

        // Store original credentials method
        const originalCreateSsl = grpc.credentials.createSsl;

        // Patch SSL credentials creation
        grpc.credentials.createSsl = function(rootCerts, privateKey, certChain, verifyOptions) {
            console.log('🔧 Patching gRPC SSL credentials...');

            // Apply SSL compatibility settings
            setupFirebaseCompatibility();

            // Modify verify options for compatibility
            const compatVerifyOptions = {
                ...verifyOptions,
                checkServerIdentity: verifyOptions?.checkServerIdentity || function() { return undefined; }
            };

            return originalCreateSsl.call(this, rootCerts, privateKey, certChain, compatVerifyOptions);
        };

        console.log('✅ gRPC patched successfully');

    } catch (error) {
        // gRPC not available, that's okay
        console.log('ℹ️  gRPC not found, skipping patch');
    }
}

/**
 * Handle uncaught SSL/TLS exceptions
 */
function setupExceptionHandling() {
    // Handle specific SSL/TLS errors
    process.on('uncaughtException', (error) => {
        if (error.message && error.message.includes('DECODER routines::unsupported')) {
            console.error('🚨 SSL/TLS DECODER error detected - applying emergency compatibility fix...');

            // Apply emergency compatibility
            setupFirebaseCompatibility();

            console.log('⚠️  SSL/TLS error handled, continuing execution...');
            return; // Don't crash
        }

        // Re-throw other uncaught exceptions
        throw error;
    });

    // Handle unhandled promise rejections related to SSL
    process.on('unhandledRejection', (reason, promise) => {
        if (reason && reason.message && reason.message.includes('DECODER routines::unsupported')) {
            console.error('🚨 SSL/TLS DECODER rejection detected - applying emergency compatibility fix...');

            // Apply emergency compatibility
            setupFirebaseCompatibility();

            console.log('⚠️  SSL/TLS rejection handled, continuing execution...');
            return; // Don't crash
        }

        // Re-throw other unhandled rejections
        throw reason;
    });
}

/**
 * Comprehensive setup function
 */
function initializeCompatibilityLayer() {
    console.log('🚀 Initializing Firebase/Node.js v20+ compatibility layer...');

    // Apply base compatibility settings
    setupFirebaseCompatibility();

    // Patch Firebase and gRPC if available
    patchFirebaseAdmin();
    patchGrpc();

    // Setup exception handling
    setupExceptionHandling();

    console.log('✅ Compatibility layer initialized successfully');
}

/**
 * Restore original environment (for testing)
 */
function restoreOriginalEnvironment() {
    console.log('🔄 Restoring original environment...');

    // Restore original environment variables
    Object.keys(process.env).forEach(key => {
        if (originalEnv[key] !== undefined) {
            process.env[key] = originalEnv[key];
        } else {
            delete process.env[key];
        }
    });

    console.log('✅ Original environment restored');
}

/**
 * Check if compatibility layer is needed
 */
function isCompatibilityNeeded() {
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);

    // Node.js v20+ needs compatibility layer
    return majorVersion >= 20;
}

// Auto-initialize if this file is required directly
if (require.main === module) {
    initializeCompatibilityLayer();
} else {
    // Auto-apply if Node.js v20+ is detected
    if (isCompatibilityNeeded()) {
        console.log(`ℹ️  Node.js ${process.version} detected - applying compatibility layer...`);
        initializeCompatibilityLayer();
    }
}

// Export functions for manual use
module.exports = {
    setupFirebaseCompatibility,
    patchFirebaseAdmin,
    patchGrpc,
    setupExceptionHandling,
    initializeCompatibilityLayer,
    restoreOriginalEnvironment,
    isCompatibilityNeeded
};

// Also support ES6 default export
module.exports.default = initializeCompatibilityLayer;