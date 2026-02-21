/**
 * Logging Utility
 * VIP-10705: Logging & Monitoring
 */

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  error?: Error;
}

class Logger {
  private level: LogLevel;

  constructor() {
    this.level = (process.env.LOG_LEVEL as LogLevel) || LogLevel.INFO;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
    return levels.indexOf(level) >= levels.indexOf(this.level);
  }

  private formatLog(entry: LogEntry): string {
    const { timestamp, level, message, context, error } = entry;

    let log = `[${timestamp}] [${level.toUpperCase()}] ${message}`;

    if (context && Object.keys(context).length > 0) {
      log += `\nContext: ${JSON.stringify(context, null, 2)}`;
    }

    if (error) {
      log += `\nError: ${error.message}`;
      if (error.stack) {
        log += `\nStack: ${error.stack}`;
      }
    }

    return log;
  }

  private log(level: LogLevel, message: string, context?: Record<string, any>, error?: Error) {
    if (!this.shouldLog(level)) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      error
    };

    const formattedLog = this.formatLog(entry);

    // Console output
    switch (level) {
      case LogLevel.DEBUG:
        console.debug(formattedLog);
        break;
      case LogLevel.INFO:
        console.info(formattedLog);
        break;
      case LogLevel.WARN:
        console.warn(formattedLog);
        break;
      case LogLevel.ERROR:
        console.error(formattedLog);
        break;
    }

    // In production, send to logging service (Sentry, LogRocket, DataDog, etc.)
    if (process.env.NODE_ENV === 'production') {
      this.sendToLoggingService(entry);
    }
  }

  private sendToLoggingService(entry: LogEntry) {
    // Placeholder for production logging service
    // Examples:
    //
    // Sentry:
    // if (entry.level === LogLevel.ERROR && entry.error) {
    //   Sentry.captureException(entry.error, {
    //     contexts: { custom: entry.context }
    //   });
    // }
    //
    // DataDog:
    // datadogLogger.log(entry.message, {
    //   level: entry.level,
    //   ...entry.context
    // });
    //
    // LogRocket:
    // LogRocket.captureMessage(entry.message, {
    //   tags: { level: entry.level },
    //   extra: entry.context
    // });
  }

  debug(message: string, context?: Record<string, any>) {
    this.log(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: Record<string, any>) {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: Record<string, any>) {
    this.log(LogLevel.WARN, message, context);
  }

  error(message: string, error?: Error, context?: Record<string, any>) {
    this.log(LogLevel.ERROR, message, context, error);
  }

  // API request logging
  logRequest(method: string, path: string, userId?: string, duration?: number) {
    this.info(`API Request: ${method} ${path}`, {
      method,
      path,
      userId,
      duration
    });
  }

  // Database operation logging
  logDbOperation(operation: string, collection: string, duration?: number, error?: Error) {
    if (error) {
      this.error(`DB Operation Failed: ${operation} on ${collection}`, error, {
        operation,
        collection,
        duration
      });
    } else {
      this.debug(`DB Operation: ${operation} on ${collection}`, {
        operation,
        collection,
        duration
      });
    }
  }

  // AI operation logging
  logAiOperation(
    operation: string,
    model: string,
    duration?: number,
    tokensUsed?: number,
    error?: Error
  ) {
    if (error) {
      this.error(`AI Operation Failed: ${operation} with ${model}`, error, {
        operation,
        model,
        duration,
        tokensUsed
      });
    } else {
      this.info(`AI Operation: ${operation} with ${model}`, {
        operation,
        model,
        duration,
        tokensUsed
      });
    }
  }

  // Security event logging
  logSecurityEvent(
    event: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    details?: Record<string, any>
  ) {
    const level = severity === 'critical' || severity === 'high' ? LogLevel.ERROR : LogLevel.WARN;

    this.log(level, `Security Event: ${event}`, {
      event,
      severity,
      ...details
    });

    // In production, alert security team for critical events
    if (process.env.NODE_ENV === 'production' && severity === 'critical') {
      this.alertSecurityTeam(event, details);
    }
  }

  private alertSecurityTeam(event: string, details?: Record<string, any>) {
    // Placeholder for security alerting
    // Examples:
    // - Send to Slack webhook
    // - Send email to security team
    // - Create PagerDuty incident
    console.error(`🚨 CRITICAL SECURITY EVENT: ${event}`, details);
  }
}

// Export singleton instance
export const logger = new Logger();
