# RMIASIN Auth SDK — Developer Documentation

Public developer documentation for [`@rmiasin/auth-sdk`](https://www.npmjs.com/package/@rmiasin/auth-sdk) v2.0.0.

The SDK provides RMIASIN authentication, consent handling, and verification helpers. It does **not** create or register identities. Identity holders should use the [official RMIASIN portal](https://rmiasin.raltecalv.com/).

## Guides

- [Quickstart](quickstart.md) — register an application, install the package, and configure credentials.
- [React integration](react.md) — login button, hook, and browser client.
- [Node.js integration](node.md) — verify consent tokens, protect routes, and persist app users.
- [Brand gateways and API reference](gateways-and-api.md) — gateway mapping, key formats, and public exports.
- [RMIASIN Schema 0300](schema-0300.md) — 40-segment protocol reference.

## Package entry points

```text
@rmiasin/auth-sdk         Universal and browser client
@rmiasin/auth-sdk/react   React component and hook
@rmiasin/auth-sdk/node    Node.js server verification
```

SDK/Protocol version 2.0.0 and RMIASIN identity schema version 0300 are separate version numbers.

## Public repository boundary

This folder contains static Markdown documentation only. It is not imported by the SDK, included in the npm package allowlist, or used by the build. Do not put credentials, private portal source, user records, or deployment secrets here.
