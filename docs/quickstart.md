# Quickstart

Add “Log in with RMASIN” to an application using the official TypeScript SDK.

## 1. Register your application

Register an application through the [official RMIASIN portal](https://rmiasin.raltecalv.com/). Configure its approved redirect origins, brand, purpose, and the minimum consent scopes your app needs. Use a public or verified-partner connection tier where applicable. Do not select `NATIVE` unless the app is an eligible first-party native binary.

The SDK does not register people or issue identity strings. People who need an identity should use the official portal.

## 2. Install

```bash
npm install @rmiasin/auth-sdk
```

The package supports Node.js 18 and newer, and provides ESM and CommonJS builds. React is an optional peer dependency (React 18+).

## 3. Configure environment variables

The application ID may be used in frontend configuration. The API key is a server-side secret and must never be embedded in browser code.

```dotenv
# Frontend example
VITE_RMASIN_APP_ID=your-registered-app-id

# Server only
RMASIN_APP_ID=your-registered-app-id
RMASIN_API_KEY=your-server-issued-api-key
```

Use the public environment-variable prefix for your framework (for example `NEXT_PUBLIC_` in Next.js) only for the app ID, never for the API key.

## 4. Request consent in the browser

Use [`RmasinLoginButton`](react.md) or `RmasinClient` to start the consent flow. Send the returned consent token reference to your backend over HTTPS.

## 5. Verify the grant on your server

Use [`RmasinServer`](node.md) to verify the consent token before relying on identity claims or granting access.

## 6. Store your app’s own user record

The RMIASIN registry does not host your application’s user table. After successful server verification, persist only the claims your product needs in your own database and create your application’s own session. Treat tokens as credentials and protect them accordingly.

## Security checklist

- Keep `RMASIN_API_KEY` on the server.
- Verify consent tokens on the server; do not authorize actions from unverified browser claims.
- Ask for the minimum scopes and honor the scopes granted.
- Do not use the SDK to create or register identities.
- Use your own session lifecycle and authorization rules.
