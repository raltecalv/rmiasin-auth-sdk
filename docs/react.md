# React and browser integration

The React entry point is `@rmiasin/auth-sdk/react`. It exports `RmasinLoginButton` and `useRmasinAuth`.

## Login button

```tsx
import { RmasinLoginButton } from '@rmiasin/auth-sdk/react';

export function LoginPage() {
  return (
    <RmasinLoginButton
      appId={import.meta.env.VITE_RMASIN_APP_ID}
      brand="RALTECALV"
      scopes={['identity.rsid_only', 'trust_tier.read']}
      mode="popup"
      onSuccess={async (auth) => {
        const response = await fetch('/api/auth/rmasin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            consentTokenId: auth.consent_token_id || auth.token,
          }),
        });

        if (!response.ok) {
          throw new Error('Could not establish an application session');
        }
      }}
      onError={(error) => console.error(error.message)}
    />
  );
}
```

Available button options:

- `mode`: `popup` or `redirect` (default: `popup`)
- `size`: `sm`, `md`, or `lg`
- `theme`: `sovereign-dark`, `terracotta`, `verdigris`, `minimal-light`, `raltecalv-gold`, or `celestial-blue`
- `scopes`: consent scopes requested for this login
- `brand`, `portalUrl`, and `apiUrl`: optional configuration overrides
- `onSuccess` and `onError`: callbacks for the login result

The browser callback is for client UI flow; it does not replace server-side token verification.

## Custom UI with the hook

```tsx
import { useRmasinAuth } from '@rmiasin/auth-sdk/react';

export function AccountControl() {
  const {
    isAuthenticated,
    user,
    isLoading,
    error,
    loginWithPopup,
    logout,
  } = useRmasinAuth({
    appId: import.meta.env.VITE_RMASIN_APP_ID,
    brand: 'RALTECALV',
    scopes: ['identity.rsid_only', 'trust_tier.read'],
  });

  if (isLoading) return <p>Connecting…</p>;

  if (isAuthenticated && user) {
    return (
      <div>
        <span>{user.rsid_display} · {user.trust_tier}</span>
        <button onClick={logout}>Sign out</button>
      </div>
    );
  }

  return (
    <>
      {error && <p role="alert">{error}</p>}
      <button onClick={() => loginWithPopup()}>Log in with RMIASIN</button>
    </>
  );
}
```

The hook also exposes `client`, `session`, `brand`, `loginWithRedirect`, `verifyConnection`, `recordTelemetryEvent`, and `getMetrics`.

## Framework-agnostic browser client

```ts
import { RmasinClient } from '@rmiasin/auth-sdk';

const client = new RmasinClient({
  appId: import.meta.env.VITE_RMASIN_APP_ID,
  brand: 'RALTECALV',
  scopes: ['identity.rsid_only', 'trust_tier.read'],
});

const auth = await client.loginWithPopup();
console.log(auth.identity.rsid_display);

// Send the consent token reference to your backend for verification.
```

`RmasinClient` also supports `loginWithRedirect`, `handleRedirectCallback`, `getSession`, `saveSession`, and `logout`.

## Connection checks

`client.verifyConnection()` and the hook’s `verifyConnection()` return connection status information. Use this for gateway diagnostics, not authentication. Never pass a server API key from browser code.
