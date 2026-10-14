import { ConsoleLogger, LogLevel } from '@nestjs/common';
import { DatabaseLogger } from './database-logger';

const LEVELS: LogLevel[] = [
  'fatal',
  'error',
  'warn',
  'log',
  'debug',
  'verbose',
];

function parseLevel(value: string | undefined): LogLevel | undefined {
  const level = value?.toLowerCase() as LogLevel | undefined;
  return level && LEVELS.includes(level) ? level : undefined;
}

/**
 * LOG_LEVEL: minimum level to print (fatal | error | warn | log | debug | verbose).
 * Defaults to `log` in production and `debug` otherwise.
 * LOG_FORMAT: `json` or `text`. Defaults to `json` in production and `text` otherwise.
 * DB_LOG_LEVEL: minimum level persisted to the database, or `off` to disable.
 * Defaults to `log`.
 */
export function createLogger(): ConsoleLogger | DatabaseLogger {
  const isProd = process.env.NODE_ENV === 'production';
  const minLevel =
    parseLevel(process.env.LOG_LEVEL) ?? (isProd ? 'log' : 'debug');
  const json =
    (process.env.LOG_FORMAT ?? (isProd ? 'json' : 'text')) === 'json';

  const options = {
    logLevels: LEVELS.slice(0, LEVELS.indexOf(minLevel) + 1),
    json,
    colors: !json,
    timestamp: !json,
  };

  if (process.env.DB_LOG_LEVEL?.toLowerCase() === 'off') {
    return new ConsoleLogger(options);
  }
  return new DatabaseLogger(
    options,
    parseLevel(process.env.DB_LOG_LEVEL) ?? 'log',
  );
}
