# Logging

The app uses NestJS's built-in `Logger` / `ConsoleLogger` (no extra dependencies). Logs go to stdout/stderr so the process manager or container runtime can collect them.

## Configuration

| Variable | Values | Default |
| --- | --- | --- |
| `LOG_LEVEL` | `fatal`, `error`, `warn`, `log`, `debug`, `verbose` (minimum level printed) | `log` in production, `debug` otherwise |
| `LOG_FORMAT` | `json`, `text` | `json` in production (`NODE_ENV=production`), `text` otherwise |

Setup lives in [`src/logging/logger.config.ts`](../src/logging/logger.config.ts) and is applied in `main.ts` with `bufferLogs: true` + `app.useLogger(...)`, so startup logs use the same format.

## HTTP request logging

[`src/logging/http-logger.middleware.ts`](../src/logging/http-logger.middleware.ts) logs one line per completed request (method, path, status, duration, user id, IP):

- `5xx` → `error`
- `4xx` or slower than 1s → `warn`
- otherwise → `log`

Query strings, headers, cookies and bodies are **never** logged. Static paths (`/uploads`, `/css`) are skipped.

## Writing logs in code

```ts
@Injectable()
export class FooService {
  private readonly logger = new Logger(FooService.name);

  doWork() {
    this.logger.log('Something happened');
    this.logger.warn('Recoverable problem');
    this.logger.error('Failed', error instanceof Error ? error.stack : String(error));
  }
}
```

Do not use `console.*`. Never log passwords, tokens, 2FA codes, or full request bodies.

## Auth audit events

`AuthService` logs sign-in success/failure (by user id), 2FA code sent/failed, 2FA enabled/disabled, session revocation, and 2FA email delivery errors.

## Database logging

Every log line is also persisted to the `AppLogs` table by `DatabaseLogger` (`src/logging/database-logger.ts`), which extends Nest's `ConsoleLogger`.

| Env var | Default | Meaning |
|---|---|---|
| `DB_LOG_LEVEL` | `log` | Minimum level saved to the DB (`fatal`, `error`, `warn`, `log`, `debug`, `verbose`), or `off` to disable |
| `LOG_RETENTION_DAYS` | `30` | Rows older than this are deleted daily at 02:00 |

Table columns: `id`, `level`, `context`, `message`, `stack`, `meta` (JSON), `createdAt`.

Notes:
- Writes are buffered and flushed in batches every ~2s (or 100 rows). An abrupt process kill can lose up to ~2s of logs.
- If the DB write fails, the error goes to stderr and the batch is dropped, so logging never breaks requests.
- Nest bootstrap noise (InstanceLoader, RoutesResolver, RouterExplorer) is not stored.
- The HTTP request log is high-volume. Set `DB_LOG_LEVEL=warn` to store only warnings and errors.
- Run `npm run db:push` to create the table.

## Viewing logs (admin only)

`GET /api/logs` — requires the `ADMIN` role. Newest first, cursor-paginated.

Query params (all optional): `level`, `context`, `search` (message, case-insensitive), `from`, `to` (ISO dates), `limit` (1-200, default 50), `cursor`.

Response: `{ "data": [{ id, level, context, message, stack, meta, createdAt }], "nextCursor": "123" | null }`. Pass `nextCursor` as `cursor` to get the next page. `id` is a string.
