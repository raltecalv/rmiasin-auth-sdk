# Brand gateways and API reference

SDK 2.0.0 and protocol 2.0.0 work with RMIASIN identity schema 0300. These are distinct versions.

## Brand gateway map

| Brand | Live API key prefix | Test API key prefix | App ID prefix | Gateway |
|---|---|---|---|---|
| `RALTECALV` | `raltecalv_live_` | `raltecalv_test_` | `RALTECALV_APP_` | `https://axabpwxfvqsjpyvevaeg.supabase.co/functions/v1/extension-api?brand=RALTECALV` |
| `RMIASIN` | `rmiasin_live_` | `rmiasin_test_` | `RMIASIN_APP_` | `https://axabpwxfvqsjpyvevaeg.supabase.co/functions/v1/extension-api?brand=RMIASIN` |
| `CELESTIAL` | `celestial_live_` | `celestial_test_` | `CELESTIAL_APP_` | `https://axabpwxfvqsjpyvevaeg.supabase.co/functions/v1/extension-api?brand=CELESTIAL` |

The default portal URL is <https://rmiasin.raltecalv.com>. Brand-specific portal and gateway settings are exported in `SOVEREIGN_GATEWAYS`. The SDK detects a browser client’s default brand from its app ID and a server client’s default brand from its API-key prefix. You can set `brand`, `portalUrl`, or `apiUrl` explicitly in the client configuration.

## Key format helpers

```ts
import {
  detectAppIdBrand,
  detectKeyBrand,
  validateApiKeyFormat,
} from '@rmiasin/auth-sdk';

const brand = detectKeyBrand(process.env.RMASIN_API_KEY ?? '');
const result = validateApiKeyFormat(process.env.RMASIN_API_KEY ?? '', brand);

if (!result.valid) {
  throw new Error(result.error ?? 'Invalid API key format');
}

console.log(detectAppIdBrand('RALTECALV_APP_EXAMPLE'));
console.log(result.keyType);
```

The supported key types are `RALTECALV_LIVE`, `RMIASIN_LIVE`, `CELESTIAL_LIVE`, and their `_TEST` variants. Format validation is not a substitute for gateway verification. Do not commit real keys or expose them in frontend code.

## Package entry points

### `@rmiasin/auth-sdk`

Exports `RmasinClient`, configuration and response types, consent scope types, `SOVEREIGN_GATEWAYS`, brand/key helpers, connection verification types, database schemas, and `prepareForAppDatabase`.

Common client methods include:

- `loginWithPopup(options?)`
- `loginWithRedirect(options?)`
- `handleRedirectCallback()`
- `getAuthUrl(options?)`
- `getBrand()` / `getBrandGateway()` / `getAppId()`
- `verifyConnection(apiKey?)`
- `recordEvent(payload)` / `getMetrics()`
- `getSession()` / `saveSession(response)` / `logout()`

### `@rmiasin/auth-sdk/react`

Exports `RmasinLoginButton`, `useRmasinAuth`, and related React types. The hook includes the client, session, user, authentication/loading state, errors, popup/redirect login, logout, connection verification, telemetry, and metrics helpers.

### `@rmiasin/auth-sdk/node`

Exports `RmasinServer`, server config/result types, and the shared database helpers. `RmasinServer` provides consent-token verification, scope middleware, RSID verification, connection checks, telemetry/metrics methods, and app database record formatting.

## Consent scopes

Standard scope names exported by the package:

- `identity.rsid_only`
- `trust_tier.read`
- `geography.country_only`
- `contact.email_only`
- `citizen_profile.read`
- `rchain.address.derive`
- `telemetry.events.write`
- `enclave.proof.verify`

Request only scopes needed by your application and authorize only the scopes returned as granted.
