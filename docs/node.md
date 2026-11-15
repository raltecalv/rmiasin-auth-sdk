# Node.js server integration

Use `@rmiasin/auth-sdk/node` on a trusted server to verify consent tokens and protect endpoints.

## Configure the server client

```ts
import { RmasinServer } from '@rmiasin/auth-sdk/node';

export const rmasin = new RmasinServer({
  appId: process.env.RMASIN_APP_ID!,
  apiKey: process.env.RMASIN_API_KEY!,
  autoTelemetry: true,
});
```

`appId` and `apiKey` are required. If `brand` is omitted, the SDK detects it from the API-key prefix, then uses the corresponding brand gateway. The API key must be stored in a server-side secret manager or environment configuration.

## Verify a consent token

```ts
app.post('/api/auth/rmasin', async (req, res) => {
  const consentTokenId = req.body?.consentTokenId;

  if (typeof consentTokenId !== 'string' || !consentTokenId) {
    return res.status(400).json({ error: 'consentTokenId is required' });
  }

  const verification = await rmasin.verifyConsentToken(consentTokenId);
  if (!verification.valid) {
    return res.status(401).json({
      error: verification.error ?? 'Token verification failed',
    });
  }

  const record = rmasin.toAppDatabaseRecord(verification);
  if (!record) {
    return res.status(401).json({ error: 'Verified identity is unavailable' });
  }

  // Persist the minimum required claims in your own database.
  const user = await db.appUsers.upsert({
    where: { rmiasinIdentityId: record.rmiasin_identity_id },
    update: {
      rsidDisplay: record.rsid_display,
      trustTier: record.trust_tier,
      grantedScopes: record.granted_scopes,
    },
    create: {
      rmiasinIdentityId: record.rmiasin_identity_id,
      rsidDisplay: record.rsid_display,
      rsidCanonical: record.rsid_canonical,
      trustTier: record.trust_tier,
      identityClass: record.identity_class,
      brand: record.brand,
      appId: record.app_id,
      grantedScopes: record.granted_scopes,
    },
  });

  // Establish your own application session using your session mechanism.
  return res.json({ user });
});
```

Validate request bodies, apply your application's CSRF/rate-limit protections as appropriate, and never trust identity claims supplied directly by the browser.

## Protect a route with scopes

```ts
app.get(
  '/api/private',
  rmasin.middleware(['identity.rsid_only', 'trust_tier.read']),
  (req, res) => {
    res.json({
      profile: req.rmasinUser.profile,
      scopes: req.rmasinUser.scopes,
    });
  },
);
```

The middleware expects a bearer token in the `Authorization` header. It verifies the token, checks all requested scopes, and makes verified claims available on `req.rmasinUser`.

## Connection verification

```ts
const status = await rmasin.verifyConnection();

console.log(status.status);
console.log(status.database_connected);
console.log(status.key_valid);
console.log(status.brand);
console.log(status.latency_ms);
```

`verifyConnection()` is a gateway diagnostic, not an end-user authentication step.

## Other server methods

- `verifyRsid(rsid)` — check RSID format and registry presence.
- `recordTelemetryEvent(payload)` — send an app telemetry event.
- `getAppMetrics()` — read available app metrics.
- `getBrand()` and `getBrandGateway()` — inspect configured brand and gateway.
- `toAppDatabaseRecord(result)` — format verified claims for your app’s storage.

Your application is responsible for its user database, session lifecycle, and authorization policy.
