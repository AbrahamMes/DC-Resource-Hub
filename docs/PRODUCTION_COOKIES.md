# Production cookies and reverse proxies

Production sessions use cookies with these protections:

- `Secure`: enabled automatically whenever `NODE_ENV=production`, so browsers only send the session cookie over HTTPS.
- `HttpOnly`: always enabled, so frontend JavaScript and `document.cookie` cannot read the session cookie.
- `SameSite=Lax`: permits the top-level GET redirect from Autodesk OAuth while still limiting cross-site cookie delivery.

The Render deployment trusts one reverse-proxy hop (`TRUST_PROXY=1`). This lets Express recognize Render's forwarded HTTPS request and issue the `Secure` cookie even though TLS terminates at the proxy.

## Environment settings

```env
NODE_ENV=production
TRUST_PROXY=1
SESSION_COOKIE_SECURE=true
SESSION_COOKIE_SAME_SITE=lax
```

Local HTTP development uses `SESSION_COOKIE_SECURE=false`. A controlled production-mode HTTP deployment must explicitly set both `ALLOW_INSECURE_HTTP=true` and `SESSION_COOKIE_SECURE=false`; otherwise production uses secure cookies.

Use `SESSION_COOKIE_SAME_SITE=none` only if the frontend and backend are truly cross-site rather than same-site subdomains. Browsers require `SameSite=None` cookies to also be `Secure`, and the application rejects an insecure combination at startup.

## Verification

After deploying over HTTPS:

1. Sign in through Autodesk and inspect the backend response in browser developer tools.
2. Confirm the session cookie has `Secure`, `HttpOnly`, and `SameSite=Lax` attributes.
3. Confirm `document.cookie` in the frontend console does not contain the session cookie.
4. Confirm login, callback, session restoration, and logout work through the public HTTPS domain.
5. Confirm the session cookie is not sent by the browser to an `http://` version of the backend.
