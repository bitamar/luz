import pino, { type Logger, type LoggerOptions } from 'pino';

const defaultLevel =
  process.env.LOG_LEVEL ??
  (process.env.NODE_ENV === 'test' ? 'warn' : process.env.NODE_ENV === 'development' ? 'debug' : 'info');

export function createLogger(options: LoggerOptions = {}): Logger {
  return pino({
    level: options.level ?? defaultLevel,
    base: options.base ?? undefined,
    timestamp: options.timestamp ?? pino.stdTimeFunctions.isoTime,
    formatters: {
      level(label) {
        return { level: label };
      },
      bindings(bindings) {
        return { ...bindings };
      },
    },
    ...options,
  });
}
