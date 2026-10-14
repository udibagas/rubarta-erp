import { Logger } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

const logger = new Logger('HTTP');
const SLOW_REQUEST_MS = 1000;
const IGNORED_PATHS = ['/uploads', '/css', '/favicon.ico'];

/**
 * Logs one line per completed request. Only metadata is logged: never
 * bodies, cookies, headers or query strings, which may hold credentials.
 */
export function httpLogger(req: Request, res: Response, next: NextFunction) {
  const start = process.hrtime.bigint();

  res.on('finish', () => {
    const path = req.originalUrl.split('?')[0];
    if (IGNORED_PATHS.some((p) => path.startsWith(p))) return;

    const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
    const status = res.statusCode;
    const userId = (req as Request & { user?: { id: number } }).user?.id;
    const message = `${req.method} ${path} ${status} ${durationMs.toFixed(0)}ms`;
    const meta = {
      method: req.method,
      path,
      status,
      durationMs: Math.round(durationMs),
      userId,
      ip: req.ip,
    };

    if (status >= 500) logger.error(message, meta);
    else if (status >= 400 || durationMs >= SLOW_REQUEST_MS)
      logger.warn(message, meta);
    else logger.log(message, meta);
  });

  next();
}
