# Logs API — Frontend Guide

Admin-only endpoint for viewing application logs stored in the database. Use it to build a log viewer page.

## Access

- Requires a logged-in user with the `ADMIN` role.
- Auth works like every other endpoint: `Authorization: Bearer <token>` or the `token` cookie.
- Non-admin users get `403 Forbidden`; no/invalid session gets `401 Unauthorized`.
- `GET` requests need no CSRF token.

## Endpoint

`GET /api/logs`

### Query parameters (all optional)

| Param | Type | Description |
|---|---|---|
| `level` | `fatal` \| `error` \| `warn` \| `log` \| `debug` \| `verbose` | Exact level |
| `context` | string (max 100) | Exact source name, e.g. `AuthService`, `HTTP` |
| `search` | string (max 200) | Case-insensitive text search in the message |
| `from` | ISO date/time | Logs created at or after |
| `to` | ISO date/time | Logs created at or before |
| `limit` | int 1–200 | Page size, default `50` |
| `cursor` | numeric string | Value of `nextCursor` from the previous response |

Invalid values return `400` with a validation message.

### Response `200`

```json
{
  "data": [
    {
      "id": "1042",
      "level": "error",
      "context": "NotificationsService",
      "message": "Failed to send notification",
      "stack": "Error: ...\n    at ...",
      "meta": { "userId": 7 },
      "createdAt": "2026-10-14T03:21:09.123Z"
    }
  ],
  "nextCursor": "1001"
}
```

| Field | Notes |
|---|---|
| `id` | **String** (database BigInt). Do not parse it as a JS number. |
| `level` | One of the levels above |
| `context` | Source name, may be `null` |
| `message` | Log text |
| `stack` | Stack trace, only on errors, otherwise `null` |
| `meta` | Free-form JSON object, may be `null` |
| `createdAt` | ISO timestamp (UTC) |
| `nextCursor` | `null` when there are no more rows |

## Pagination

Results are newest first and use cursor pagination (not page numbers):

1. Request without `cursor`.
2. If `nextCursor` is not `null`, request again with `?cursor=<nextCursor>` and the **same filters**.
3. Stop when `nextCursor` is `null`.

This suits an "infinite scroll" / "Load more" UI. New logs arriving meanwhile do not shift the pages. To refresh, drop the cursor and start over.

## Example

```ts
async function fetchLogs(params: {
  level?: string;
  context?: string;
  search?: string;
  from?: string;
  to?: string;
  cursor?: string;
  limit?: number;
}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '') qs.set(k, String(v));
  });

  const res = await fetch(`/api/logs?${qs}`, { credentials: 'include' });
  if (res.status === 401) throw new Error('Session expired');
  if (res.status === 403) throw new Error('Admins only');
  if (!res.ok) throw new Error('Failed to load logs');
  return res.json() as Promise<{ data: LogRow[]; nextCursor: string | null }>;
}

interface LogRow {
  id: string;
  level: 'fatal' | 'error' | 'warn' | 'log' | 'debug' | 'verbose';
  context: string | null;
  message: string;
  stack: string | null;
  meta: Record<string, unknown> | null;
  createdAt: string;
}
```

## UI suggestions

- Hide the Logs menu for users without the `ADMIN` role (the server enforces it anyway).
- Filters: level dropdown, context input, text search (debounce ~300 ms), date range.
- Color-code levels: `fatal`/`error` red, `warn` amber, `log` neutral, `debug`/`verbose` grey.
- Show `stack` and `meta` in an expandable row; render `stack` in a monospace block.
- Show times in the user's local timezone (`createdAt` is UTC).
- Changing any filter must reset the list and the cursor.

## Good to know

- By default the database stores `log` level and above, including one `HTTP` line per request, so the list can be busy. Filter by `level` or `context` to narrow it down.
- Logs older than 30 days are deleted automatically (the retention is configurable on the server).
- Logs are saved in batches every ~2 seconds, so a very recent event may take a moment to appear.
- Passwords, 2FA codes, tokens, cookies, and request bodies are never logged.
