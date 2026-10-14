import { ConsoleLogger, ConsoleLoggerOptions, LogLevel } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const LEVELS: LogLevel[] = [
  'fatal',
  'error',
  'warn',
  'log',
  'debug',
  'verbose',
];

// framework bootstrap noise is not worth persisting
const IGNORED_CONTEXTS = new Set([
  'InstanceLoader',
  'RoutesResolver',
  'RouterExplorer',
  'NestFactory',
  'NestApplication',
  'GraphQLModule',
  'ScheduleModule',
]);

const FLUSH_INTERVAL_MS = 2000;
const BATCH_SIZE = 100;
const MAX_BUFFER = 5000;
const MAX_MESSAGE = 5000;
const MAX_STACK = 10000;

interface LogRow {
  level: string;
  context: string | null;
  message: string;
  stack: string | null;
  meta: object | undefined;
  createdAt: Date;
}

/**
 * ConsoleLogger that also persists logs to the `AppLogs` table.
 * Writes are buffered and batched, never awaited by callers, and a database
 * failure can never break the app or recurse into the logger.
 */
export class DatabaseLogger extends ConsoleLogger {
  private prisma?: PrismaService;
  private buffer: LogRow[] = [];
  private flushing = false;
  private timer?: NodeJS.Timeout;
  private readonly dbLevels: LogLevel[];

  constructor(options: ConsoleLoggerOptions, dbMinLevel: LogLevel) {
    super(options);
    this.dbLevels = LEVELS.slice(0, LEVELS.indexOf(dbMinLevel) + 1);
  }

  attach(prisma: PrismaService) {
    this.prisma = prisma;
    this.timer = setInterval(() => void this.flush(), FLUSH_INTERVAL_MS);
    this.timer.unref();
  }

  async flush() {
    if (!this.prisma || this.flushing || this.buffer.length === 0) return;
    this.flushing = true;
    try {
      while (this.buffer.length > 0) {
        const batch = this.buffer.splice(0, BATCH_SIZE);
        try {
          await this.prisma.appLog.createMany({ data: batch as never });
        } catch (error) {
          // write straight to stderr: using the logger here would loop
          process.stderr.write(
            `[DatabaseLogger] dropped ${batch.length} log rows: ${
              error instanceof Error ? error.message : String(error)
            }\n`,
          );
          break;
        }
      }
    } finally {
      this.flushing = false;
    }
  }

  protected printMessages(
    messages: unknown[],
    context?: string,
    logLevel: LogLevel = 'log',
    writeStreamType?: 'stdout' | 'stderr',
    errorStack?: unknown,
    params?: Record<string, any>,
  ) {
    super.printMessages(
      messages,
      context,
      logLevel,
      writeStreamType,
      errorStack,
      params,
    );
    this.enqueue(messages, context, logLevel, errorStack, params);
  }

  private enqueue(
    messages: unknown[],
    context: string | undefined,
    level: LogLevel,
    stack: unknown,
    params?: Record<string, any>,
  ) {
    if (!this.dbLevels.includes(level)) return;
    if (context && IGNORED_CONTEXTS.has(context)) return;

    if (this.buffer.length >= MAX_BUFFER) this.buffer.shift();

    this.buffer.push({
      level,
      context: context?.slice(0, 100) ?? null,
      message: messages
        .map((m) => this.toText(m))
        .join(' ')
        .slice(0, MAX_MESSAGE),
      stack: typeof stack === 'string' ? stack.slice(0, MAX_STACK) : null,
      meta:
        params && Object.keys(params).length ? this.toJson(params) : undefined,
      createdAt: new Date(),
    });

    if (this.buffer.length >= BATCH_SIZE) void this.flush();
  }

  private toText(value: unknown): string {
    if (typeof value === 'string') return value;
    if (value instanceof Error) return value.message;
    try {
      return JSON.stringify(value) ?? String(value);
    } catch {
      return String(value);
    }
  }

  private toJson(value: object): object | undefined {
    try {
      return JSON.parse(JSON.stringify(value));
    } catch {
      return undefined;
    }
  }
}
