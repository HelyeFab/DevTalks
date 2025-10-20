#!/usr/bin/env node

/**
 * Custom server startup to fix Node.js v20 SSL/TLS decoder issues with Firebase/gRPC
 * This file applies SSL/TLS workarounds before Next.js starts
 */

// Apply gRPC SSL configuration before any Firebase imports
if (process.env.NODE_ENV === 'production') {
  console.log('🔧 Applying Node.js v20 SSL/TLS compatibility fixes...');

  // Set gRPC SSL cipher suites to avoid decoder issues
  process.env.GRPC_SSL_CIPHER_SUITES = 'HIGH:!aNULL:!eNULL:!EXPORT:!DES:!RC4:!MD5:!PSK:!SRP:!CAMELLIA';
  process.env.GRPC_VERBOSITY = 'ERROR';
  process.env.GRPC_TRACE = '';

  // Apply Node.js TLS options for better compatibility
  const crypto = require('crypto');
  const tls = require('tls');

  // Set TLS cipher preferences
  crypto.constants.defaultCipherList = 'HIGH:!aNULL:!eNULL:!EXPORT:!DES:!RC4:!MD5:!PSK:!SRP:!CAMELLIA';

  // Override TLS options
  const originalCreateSecureContext = tls.createSecureContext;
  tls.createSecureContext = function(options = {}) {
    const opts = {
      ...options,
      // Use more compatible ciphers
      ciphers: 'HIGH:!aNULL:!eNULL:!EXPORT:!DES:!RC4:!MD5:!PSK:!SRP:!CAMELLIA',
      secureProtocol: 'TLSv1_2_method',
    };
    return originalCreateSecureContext.call(this, opts);
  };

  console.log('✅ SSL/TLS compatibility fixes applied');
}

// Start Next.js server (standalone mode uses server.js)
require('./server.js');