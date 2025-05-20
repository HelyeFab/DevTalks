/**
 * Centralized logger for the application
 * Provides consistent logging format and severity levels
 */

// Log levels
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

// Current minimum log level - can be set based on environment
const currentLogLevel = process.env.NODE_ENV === 'production'
  ? LogLevel.INFO
  : LogLevel.DEBUG;

// Map log levels to numeric values for comparison
const logLevelValues = {
  [LogLevel.DEBUG]: 0,
  [LogLevel.INFO]: 1,
  [LogLevel.WARN]: 2,
  [LogLevel.ERROR]: 3,
};

/**
 * Checks if a log level should be displayed based on the current minimum level
 */
function shouldLog(level: LogLevel): boolean {
  return logLevelValues[level] >= logLevelValues[currentLogLevel];
}

/**
 * Format a log message with timestamp, level, and context
 */
function formatLogMessage(
  level: LogLevel,
  message: string,
  context?: Record<string, any>
): string {
  const timestamp = new Date().toISOString();
  let formatted = `[${timestamp}] ${level}: ${message}`;

  if (context && Object.keys(context).length > 0) {
    try {
      // Format the context object, with special handling for errors
      const formattedContext = Object.entries(context).reduce((acc, [key, value]) => {
        if (value instanceof Error) {
          acc[key] = {
            message: value.message,
            stack: value.stack,
            ...(value as any),
          };
        } else {
          acc[key] = value;
        }
        return acc;
      }, {} as Record<string, any>);

      formatted += `\nContext: ${JSON.stringify(formattedContext, null, 2)}`;
    } catch (err) {
      formatted += `\nContext: [Could not stringify context: ${err}]`;
    }
  }

  return formatted;
}

/**
 * Debug level logging - for development details
 */
export function debug(message: string, context?: Record<string, any>): void {
  if (!shouldLog(LogLevel.DEBUG)) return;

  const formattedMessage = formatLogMessage(LogLevel.DEBUG, message, context);
  console.debug(formattedMessage);
}

/**
 * Info level logging - for operational information
 */
export function info(message: string, context?: Record<string, any>): void {
  if (!shouldLog(LogLevel.INFO)) return;

  const formattedMessage = formatLogMessage(LogLevel.INFO, message, context);
  console.info(formattedMessage);
}

/**
 * Warning level logging - for potential issues
 */
export function warn(message: string, context?: Record<string, any>): void {
  if (!shouldLog(LogLevel.WARN)) return;

  const formattedMessage = formatLogMessage(LogLevel.WARN, message, context);
  console.warn(formattedMessage);
}

/**
 * Error level logging - for actual errors
 */
export function error(message: string, context?: Record<string, any>): void {
  if (!shouldLog(LogLevel.ERROR)) return;

  const formattedMessage = formatLogMessage(LogLevel.ERROR, message, context);
  console.error(formattedMessage);
}

/**
 * Log route request in a standardized format
 */
export function logRouteRequest(
  method: string,
  path: string,
  params?: Record<string, any>,
  userId?: string
): void {
  info(`API Request: ${method} ${path}`, {
    method,
    path,
    params,
    userId,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Log route error in a standardized format
 */
export function logRouteError(
  method: string,
  path: string,
  err: unknown,
  userId?: string
): void {
  error(`API Error: ${method} ${path}`, {
    method,
    path,
    error: err,
    userId,
    timestamp: new Date().toISOString(),
  });
}

// Default export for convenience
export default {
  debug,
  info,
  warn,
  error,
  logRouteRequest,
  logRouteError,
};
