/**
 * Bundle Analyzer Configuration
 * Use this config when you want to analyze bundle size
 * Run with: ANALYZE=true npm run build
 */

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

const nextConfig = require('./next.config')

module.exports = withBundleAnalyzer(nextConfig)
