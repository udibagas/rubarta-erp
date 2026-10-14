# Authentication & Two-Factor Authentication (Frontend Guide)

Base path: `/api/auth`. All requests must send cookies (`credentials: 'include'` / `withCredentials: true`).

## Overview

- Sessions are server-tracked. A token can be invalidated by the server (logout), and it expires after **1 hour**.
- 2FA is **opt-in per user** (off by default) and uses a **6-digit code sent by email**.
- The code expires after **5 minutes**, is **single use**, and allows **5 attempts**.
- On successful sign-in the server sets the `token` cookie (also returned in the body). Use either the cookie or `Authorization: Bearer <token>`.

## CSRF

Mutating requests (POST/PUT/PATCH/DELETE) need a CSRF token.

1. Call `GET /api/auth/csrf` first (public). It sets the `_csrf` cookie and returns `{ "token": "..." }`.
2. Send that token on every mutating request. Check the existing FE CSRF setup for the header name expected by `ncsrf` (the login flow already relies on this).

Login and 2FA verify are POSTs, so fetch the CSRF token before showing the login form.

## Sign-in flow

```
POST /login ──► twoFactorRequired?
                 ├─ no  ──► { token, user }  (logged in)
                 └─ yes ──► { twoFactorRequired: true, challengeId }
                              └─► show code input
                                  POST /2fa/verify ──► { token, user } (logged in)
```

### 1. `POST /api/auth/login` (public)

Request:

```json
{ "email": "admin@mail.com", "password": "admin123" }
```

Response `200` — 2FA **not** enabled:

```json
{
  "token": "<jwt>",
  "user": { "id": 1, "name": "Admin", "email": "admin@mail.com", "roles": ["ADMIN"] }
}
```

Response `200` — 2FA enabled (no token, no `token` cookie yet):

```json
{ "twoFactorRequired": true, "challengeId": "0b9f6c1e-3f1e-4c0a-8c6a-2f6f6f0d9a11" }
```

The FE must branch on `twoFactorRequired`.

Errors: `401 { "message": "Invalid email or password" }` (same message for unknown email, wrong password, and inactive account).

### 2. `POST /api/auth/2fa/verify` (public)

Request:

```json
{ "challengeId": "0b9f6c1e-3f1e-4c0a-8c6a-2f6f6f0d9a11", "code": "123456" }
```

- `challengeId`: value returned by login (UUID).
- `code`: exactly 6 digits, as a **string** (keep leading zeros, e.g. `"004521"`).

Response `200`: same shape as a normal login (`{ token, user }`) and the `token` cookie is set.

Errors:

| Status | Message | Meaning / UI action |
| --- | --- | --- |
| 400 | `Code must be 6 digits` (or UUID validation) | Client-side format error |
| 401 | `Invalid or expired code` | Wrong code, expired, already used, or attempts exhausted |

After a 401, you cannot distinguish "wrong code" from "expired/locked". Allow the user to retry, and offer **"Back to login"** so they can restart and get a new code.

### Resend code

There is no separate resend endpoint. Call `POST /login` again with the same credentials; a new code is emailed and the previous challenge is invalidated (use the new `challengeId`).

If the email cannot be sent, login returns a `5xx` error and no challenge is created.

## Enable / disable 2FA

### `POST /api/auth/2fa` (authenticated)

Request:

```json
{ "enabled": true, "password": "current-password" }
```

Response `200`:

```json
{ "twoFactorEnabled": true }
```

Errors: `401 Invalid password`.

The user's current password is required for both enabling and disabling. Suggested UI: a toggle in profile/security settings that prompts for the password.

> `GET /api/auth/me` returns the user record; it includes `twoFactorEnabled` so the toggle can reflect the current state.

## Logout

`POST /api/auth/logout` (authenticated, CSRF required). Revokes the current session on the server and clears the `token` cookie. Other devices stay signed in. After logout, the old token is rejected with `401` even if it has not expired.

## Handling `401` on protected endpoints

Tokens can become invalid before their expiry (logout, 1-hour TTL, deactivated account). On any `401`, clear client auth state and redirect to login.

## Example (fetch)

```ts
const api = (path: string, init: RequestInit = {}) =>
  fetch(`/api/auth${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(init.headers ?? {}) },
    ...init,
  });

async function signIn(email: string, password: string) {
  const res = await api('/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error((await res.json()).message);
  const data = await res.json();

  if (data.twoFactorRequired) {
    return { step: 'code' as const, challengeId: data.challengeId };
  }
  return { step: 'done' as const, user: data.user };
}

async function verifyCode(challengeId: string, code: string) {
  const res = await api('/2fa/verify', {
    method: 'POST',
    body: JSON.stringify({ challengeId, code }),
  });
  if (!res.ok) throw new Error((await res.json()).message);
  return (await res.json()).user;
}
```

(Add your CSRF header to the mutating calls as per the project's existing convention.)

## UI checklist

- [ ] Fetch CSRF token before login.
- [ ] After login, branch on `twoFactorRequired`.
- [ ] Code input: 6 digits, numeric keypad, keep value as string, auto-submit optional.
- [ ] Show "code sent to your email, valid for 5 minutes".
- [ ] "Resend code" re-submits credentials to `/login` (store them in memory only for the duration of this step, never persist).
- [ ] "Back to login" on repeated failures.
- [ ] Security settings toggle calling `POST /2fa` with password confirmation.
- [ ] Global `401` handler redirects to login.

## Notes for backend deployment

- Run `npm run db:push` to add `twoFactorEnabled` and the `TwoFactorChallenges` table.
- Tokens issued before the session-tracking release are no longer valid; users must sign in again.
