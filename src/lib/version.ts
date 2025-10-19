/**
 * Version and Git Information Utilities
 *
 * Provides utilities to get the current git commit hash and version information
 * for deployment tracking and debugging purposes.
 */

import { execSync } from 'child_process'

/**
 * Get the current git commit hash
 * @param short - Whether to return short hash (7 chars) or full hash
 * @returns The git commit hash or fallback message
 */
export function getGitCommitHash(short: boolean = true): string {
  try {
    // Try to get commit hash from git
    const command = short ? 'git rev-parse --short HEAD' : 'git rev-parse HEAD'
    const hash = execSync(command, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'] // Suppress stderr
    }).trim()

    return hash
  } catch (error) {
    // Fallback if git is not available or not in a git repo
    return 'unknown'
  }
}

/**
 * Get git branch name
 * @returns Current git branch name
 */
export function getGitBranch(): string {
  try {
    const branch = execSync('git rev-parse --abbrev-ref HEAD', {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore']
    }).trim()

    return branch
  } catch (error) {
    return 'unknown'
  }
}

/**
 * Get git commit date
 * @returns Date of the current commit
 */
export function getGitCommitDate(): string {
  try {
    const date = execSync('git log -1 --format=%cd --date=iso', {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore']
    }).trim()

    return date
  } catch (error) {
    return 'unknown'
  }
}

/**
 * Get comprehensive version information
 * @returns Object with version details
 */
export function getVersionInfo() {
  const commitHash = getGitCommitHash(true)
  const fullHash = getGitCommitHash(false)
  const branch = getGitBranch()
  const commitDate = getGitCommitDate()
  const buildTime = new Date().toISOString()

  return {
    commitHash,
    fullHash,
    branch,
    commitDate,
    buildTime,
    nodeEnv: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || 'unknown'
  }
}

/**
 * Log version information to console
 * Useful for debugging deployments and tracking versions
 */
export function logVersionInfo(): void {
  const info = getVersionInfo()

  console.log('🚀 ===================================')
  console.log('🔖 APPLICATION VERSION INFORMATION')
  console.log('🚀 ===================================')
  console.log(`📦 Commit: ${info.commitHash} (${info.branch})`)
  console.log(`⏰ Built: ${info.buildTime}`)
  console.log(`🌍 Environment: ${info.nodeEnv}`)

  if (info.nodeEnv === 'development') {
    console.log(`🔍 Full Hash: ${info.fullHash}`)
    console.log(`📅 Commit Date: ${info.commitDate}`)
    console.log(`💻 Dev Mode: Hot reload enabled`)
  }

  if (info.nodeEnv === 'production') {
    console.log(`🚀 Production Mode: Optimized build`)
  }

  console.log('🚀 ===================================')
}

/**
 * Get a simple version string for headers or API responses
 */
export function getVersionString(): string {
  const { commitHash, branch, nodeEnv } = getVersionInfo()
  return `${commitHash}-${branch}-${nodeEnv}`
}