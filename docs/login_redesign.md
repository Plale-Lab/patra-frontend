# Patra Embedded Tapis Login

Patra supports two authentication modes:

- **Embedded mode:** Patra reuses a short-lived Tapis access token supplied by
  its trusted ICICLE/Tapis parent portal.
- **Standalone mode:** the existing Patra Tapis username/password login remains
  available and preserves its current remember-me behavior.

Embedded authentication is disabled by default. Top-level Patra deployments
retain standalone login. When embedded authentication is explicitly enabled,
a failed or invalid portal handoff never exposes a second Patra login prompt or
reuses a stale standalone identity. Public content remains available with a
controlled message directing the user back to the parent ICICLE/Tapis portal.

## Implementation Status

- Patra frontend embedded-auth support is implemented on the
  `login_redesign` branch.
- The ICICLE/Tapis parent portal must still implement the protocol-v1 response
  handler described below.
- The companion Patra backend follow-up adds server-side JWT signature and
  claims validation when its JWKS configuration is supplied.
- Frontend JWT parsing exists only to avoid stale sessions and display the
  expected username. It is a usability sanity check, not a security boundary.

## Runtime configuration

The Docker entrypoint writes these values into `/env.js`, so they can be changed
without rebuilding the frontend image:

| Variable | Default | Description |
| --- | --- | --- |
| `EMBEDDED_AUTH_ENABLED` | `false` | Enables the parent-portal handshake when Patra is inside an iframe. |
| `PORTAL_AUTH_ORIGINS` | empty | Comma-separated exact portal origins, such as `https://portal.example.org`. Entries with paths, credentials, query strings, fragments, or non-HTTP(S) schemes are rejected. |
| `PORTAL_AUTH_TIMEOUT_MS` | `3000` | Positive handshake timeout in milliseconds. |

Production portal example:

```json
{
  "EMBEDDED_AUTH_ENABLED": "true",
  "PORTAL_AUTH_ORIGINS": "https://icicleai.tapis.io",
  "PORTAL_AUTH_TIMEOUT_MS": "3000"
}
```

For local Vite development, use the equivalent `VITE_` variables documented in
`app/.env.example`.

## Protocol version 1

After startup, embedded Patra sends this message to each configured exact parent
origin:

```js
{
  type: "patra:portal-auth:request",
  version: 1,
  requestId
}
```

The parent responds:

```js
{
  type: "patra:portal-auth:response",
  version: 1,
  requestId,
  accessToken,
  tokenType: "Bearer"
}
```

Patra accepts the response only when:

- `event.source` is the current `window.parent`;
- `event.origin` exactly matches a configured portal origin;
- the protocol type and version match;
- `requestId` matches the active, unused request nonce;
- `tokenType` is `Bearer`;
- `accessToken` is a well-formed JWT with at least 60 seconds remaining;
- the token contains `tapis/username`, or a usable username in `sub`.

Patra derives the displayed username and expiration from the JWT. This parsing
is only a client-side sanity check; it is not cryptographic token validation.

## Parent portal implementation

The parent portal must independently allowlist Patra's exact origin before
responding. A minimal message handler looks like:

```js
const PATRA_ORIGINS = new Set([
  "https://patra.pods.icicleai.tapis.io",
])
const patraFrame = document.querySelector("#patra-service-frame")

window.addEventListener("message", async (event) => {
  if (!PATRA_ORIGINS.has(event.origin)) return
  if (!patraFrame || event.source !== patraFrame.contentWindow) return
  if (!event.data || event.data.type !== "patra:portal-auth:request") return
  if (event.data.version !== 1 || typeof event.data.requestId !== "string") return

  // Obtain a current short-lived token from the portal's existing Tapis
  // session. Do not read it from a URL or persist a handoff copy.
  const accessToken = await getCurrentShortLivedTapisAccessToken()
  const response = {
    type: "patra:portal-auth:response",
    version: 1,
    requestId: event.data.requestId,
    accessToken,
    tokenType: "Bearer",
  }

  event.source.postMessage(response, event.origin)
})
```

The parent must:

- respond only to exact approved Patra origins;
- verify `event.source` is the expected Patra iframe's `contentWindow`;
- use `event.source.postMessage(response, event.origin)`, never `"*"`;
- provide a current short-lived Tapis access token;
- never put the token in a URL, query string, fragment, referrer, or browser
  history;
- never persist the handoff token in `localStorage`, `sessionStorage`, or
  another durable browser store;
- never log the raw token or the full authorization response.

## Token lifecycle and API behavior

Portal tokens exist only in JavaScript memory. They are never written to
`localStorage` or `sessionStorage`.

Patra requests a new portal token two minutes before the current token expires.
If refresh fails, the portal identity and token are cleared immediately. In
embedded mode Patra enters the controlled parent-session-unavailable state; it
does not expose standalone credentials or reuse a persisted standalone user.
Top-level standalone behavior is unchanged.

While portal authentication is resolving, Patra displays a neutral connection
screen and does not render user-dependent routes or a `Guest` identity. When
authenticated, API requests use the active portal token in the existing
`Authorization: Bearer` header. `X-Tapis-Token` is also sent temporarily for
compatibility with older Patra services. Browser-derived username and role
headers are not sent and are not authoritative.

Logout for an embedded session is managed by the parent ICICLE/Tapis portal.
Patra does not clear or revoke the parent portal's session. Standalone logout is
unchanged.

## Automated verification

From `app/`:

```bash
npm test
npm run build
```

The tests cover the handshake, exact source/origin/nonce checks, malformed and
expired tokens, timeout fallback, memory-only storage, API header selection,
refresh behavior, standalone persistence/logout, and the no-Guest resolving UI.

## Manual integration checklist

- Standalone Patra login still works.
- Embedded Patra sends the protocol-v1 authentication request.
- The parent responds only to the exact Patra origin and expected iframe
  window.
- Patra displays the portal username rather than `Guest`.
- The portal token is absent from `localStorage` and `sessionStorage`.
- Patra API requests include the active `Authorization: Bearer` token.
- The sidebar explains that logout for embedded users is managed by the parent
  ICICLE/Tapis portal.

## Manual embedded checklist

1. Configure an exact test portal origin and enable embedded auth.
2. Open Patra in the portal iframe while signed into Tapis.
3. Confirm the connection screen is shown briefly and `Guest` is never shown.
4. Confirm the sidebar displays the JWT username and `ICICLE/Tapis session`.
5. Confirm authenticated routes such as Submit Records are available.
6. Inspect browser storage and confirm the portal token is absent from both
   local and session storage.
7. Inspect a Patra API request and confirm it uses the current portal token.
8. Send a response from another origin, window, or request ID and confirm it is
   ignored.
9. Return a malformed, expired, or near-expiry token and confirm embedded Patra
   shows the controlled parent-session-unavailable message without a second
   login prompt.
10. Allow the token to approach expiry and confirm a new request is sent.
11. Fail that refresh and confirm portal identity is cleared without breaking
    the public UI.

## Manual standalone checklist

1. Open Patra directly in a top-level browser window.
2. Confirm no portal handshake is attempted.
3. Sign in through the existing Tapis login modal.
4. Reload and confirm remember-me and session-only choices behave as before.
5. Confirm authenticated API requests contain the standalone Tapis token.
6. Sign out and confirm the persisted standalone session is removed.

## Backend Auth Hardening

The companion FastAPI backend now:

- prefers `Authorization: Bearer <token>`;
- accepts `X-Tapis-Token` only as a compatibility fallback;
- verifies the JWT signature using a configured JWKS endpoint;
- validates `exp`, `nbf`, and `iat`, rejects near-expiry tokens, and validates
  issuer and audience when configured;
- derives username from `TAPIS_USERNAME_CLAIM` (default `tapis/username`) and
  falls back to `sub`;
- derives admin status from the backend's configured admin username list;
- ignores browser-supplied `X-Patra-Username` and `X-Patra-Role` values;
- caches JWKS metadata and signing keys through PyJWT's `PyJWKClient`;
- does not log raw tokens.

Required backend settings:

| Variable | Default | Description |
| --- | --- | --- |
| `TAPIS_AUTH_VALIDATION_ENABLED` | `true` | Enables cryptographic validation. |
| `TAPIS_JWKS_URL` | empty | Required JWKS endpoint supplied by the Tapis tenant/operator. |
| `TAPIS_ISSUER` | empty | Expected issuer. Strongly recommended for production. |
| `TAPIS_AUDIENCE` | empty | Expected audience, or a comma-separated set of accepted audiences. Strongly recommended for production. |
| `TAPIS_USERNAME_CLAIM` | `tapis/username` | Claim used for the normalized username. |
| `TAPIS_TOKEN_LEEWAY_SECONDS` | `60` | Clock tolerance and minimum remaining lifetime. |
| `ALLOW_UNVERIFIED_TAPIS_TOKEN_DEV_ONLY` | `false` | Explicit development-only payload validation without signature verification. Requires `TAPIS_AUTH_VALIDATION_ENABLED=false`. Never enable in production. |

Example production placeholders:

```env
TAPIS_AUTH_VALIDATION_ENABLED=true
TAPIS_JWKS_URL=https://<tenant-host>/<operator-provided-jwks-path>
TAPIS_ISSUER=https://<operator-provided-issuer>
TAPIS_AUDIENCE=<operator-provided-audience>
TAPIS_USERNAME_CLAIM=tapis/username
TAPIS_TOKEN_LEEWAY_SECONDS=60
ALLOW_UNVERIFIED_TAPIS_TOKEN_DEV_ONLY=false
```

The public TACC tenant did not expose a standard OpenID discovery document or a
confirmed JWKS endpoint during this implementation. The Tapis operator must
provide the authoritative `TAPIS_JWKS_URL`, issuer, and audience values before
authenticated production traffic can succeed. With validation enabled and
those values missing or unusable, authenticated/private routes fail closed;
anonymous public routes remain available.

### Remaining limitations

- JWKS verification confirms token integrity, but deployment operators must
  supply the authoritative tenant issuer and audience values for tenant-bound
  validation.
- This patch does not add token revocation or introspection. A correctly signed
  token remains usable until its short expiration unless the Tapis signing key
  is withdrawn.
- Tenant/base-URL semantics beyond issuer and audience are not assumed because
  no authoritative claim contract was available in this repository. Configure
  issuer and audience from the Tapis operator and add any tenant-specific claim
  checks before relying on them for sensitive authorization.
- Application permissions remain username/admin-list based; this patch does
  not introduce a finer-grained Tapis role or scope authorization model.

### Backend verification checklist

1. Configure the operator-provided JWKS URL, issuer, and audience.
2. Call a protected endpoint with a valid tenant-signed token in
   `Authorization: Bearer`; confirm it succeeds as the token username.
3. Repeat without a token; confirm `401 Authentication required`.
4. Repeat with a malformed, expired, wrongly signed, wrong-issuer, or
   wrong-audience token; confirm `401 Invalid Tapis access token`.
5. Send a valid token for `alice` together with
   `X-Patra-Username: williamq96` and `X-Patra-Role: admin`; confirm the request
   remains attributed to `alice` without admin privileges.
6. Confirm application logs contain only sanitized validation codes and never
   the raw token.

Never log raw access tokens, refresh tokens, cookies, or authorization headers.
