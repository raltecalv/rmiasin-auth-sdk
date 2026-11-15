# @rmiasin/auth-sdk

Official TypeScript & Universal SDK for **"Log In with RMASIN"** — Sovereign Identity Single Sign-On (SSO), cryptographic consent token exchange, real-time telemetry streaming, and application database persistence.

Operates on **RMIASIN Schema 0300 · Protocol 2.0.0** and cryptographic Crockford Base32 Sovereign Identity IDs (RSID), issued under the authority of the **Raltécalv Sovereign Foundation**.

[![npm version](https://img.shields.io/badge/npm-v2.0.0-emerald.svg)](https://www.npmjs.com/package/@rmiasin/auth-sdk)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![Dual ESM/CJS](https://img.shields.io/badge/Module-Dual%20ESM%2FCJS-green.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-Apache--2.0-orange.svg)](LICENSE)
[![Sovereign Protocol](https://img.shields.io/badge/Protocol-Schema%200300-purple.svg)](https://rmiasin.raltecalv.com)
[![Domain](https://img.shields.io/badge/Domain-rmiasin.raltecalv.com-indigo.svg)](https://rmiasin.raltecalv.com)

---

## 📑 Table of Contents

1. [Quick Overview](#-quick-overview)
2. [The 3 Sovereign API Secret Key Types & Dedicated Gateways](#-the-3-sovereign-api-secret-key-types--dedicated-gateways)
3. [Core Protocol Invariants & Mandatory Rules](#-core-protocol-invariants--mandatory-rules)
4. [Installation](#-installation)
5. [Step-by-Step Integration Guide](#-step-by-step-integration-guide)
   - [Step 1: Register Application in Sovereign Portal](#step-1-register-application-in-sovereign-portal)
   - [Step 2: Environment Configuration](#step-2-environment-configuration)
   - [Step 3: Client Integration (React / Next.js / Vanilla)](#step-3-client-integration)
   - [Step 4: Backend Token Verification (Node.js / Express / Next.js)](#step-4-backend-token-verification)
   - [Step 5: Separate Application Database Persistence](#step-5-separate-application-database-persistence)
   - [Step 6: Live Enclave Gateway Verification (`verifyConnection`)](#step-6-live-enclave-gateway-verification)
6. [Supported Database Schemas (Prisma, Supabase, Drizzle, SQL, Mongoose)](#-supported-database-schemas)
7. [Full Framework Recipes](#-full-framework-recipes)
   - [Next.js 14 / 15 App Router Full-Stack Recipe](#nextjs-14--15-app-router-full-stack-recipe)
   - [React SPA (Vite / CRA) Recipe](#react-spa-vite--cra-recipe)
   - [Node.js Express API Recipe](#nodejs-express-api-recipe)
   - [Vanilla JavaScript / HTML Recipe](#vanilla-javascript--html-recipe)
8. [Permission Scopes Reference](#-permission-scopes-reference)
9. [TypeScript API Reference](#-typescript-api-reference)
10. [Troubleshooting & FAQ](#-troubleshooting--faq)
11. [License & Governance](#-license--governance)

---

## ⚡ Quick Overview

"Log In with RMASIN" eliminates passwords, credential stuffing, and insecure social logins by utilizing cryptographically verifiable Crockford Base32 Sovereign Identity IDs (RSID).

- **Zero Passwords**: Users authenticate via sovereign enclave credentials or hardware-attested devices.
- **Granular OAuth Consent**: Applications request strictly scoped permissions (e.g., `identity.rsid_only`, `trust_tier.read`).
- **Enclave Cryptography**: Tokens are issued and validated against the sovereign foundation enclave at `https://rmiasin.raltecalv.com`.
- **Automatic Telemetry**: Live verification events stream directly to your Developer App Dashboard.

---

## 🏛️ The 3 Sovereign API Secret Key Types & Dedicated Gateways

The RMIASIN Sovereign Enclave architecture supports **3 distinct API Secret Key types**, each operating within its own brand namespace, strict key prefix, and dedicated extension gateway URL:

| Key Type | Key Prefix | App ID Prefix | Dedicated Gateway URL | Role & Target Workloads |
| :--- | :--- | :--- | :--- | :--- |
| **`RALTECALV`** | `raltecalv_live_...`<br/>`raltecalv_test_...` | `RALTECALV_APP_...` | `https://axabpwxfvqsjpyvevaeg.supabase.co/functions/v1/extension-api?brand=RALTECALV` | **Institutional Enclave:** Enterprise systems, institutional platforms, foundation infrastructure, and asset registry apps. |
| **`RMIASIN`** | `rmiasin_live_...`<br/>`rmiasin_test_...` | `RMIASIN_APP_...` | `https://axabpwxfvqsjpyvevaeg.supabase.co/functions/v1/extension-api?brand=RMIASIN` | **Civil Registry:** Citizen single sign-on, identity verification, public registry queries, and profile reading. |
| **`CELESTIAL`** | `celestial_live_...`<br/>`celestial_test_...` | `CELESTIAL_APP_...` | `https://axabpwxfvqsjpyvevaeg.supabase.co/functions/v1/extension-api?brand=CELESTIAL` | **Allied Interoperability:** Cross-realm federation, astronomical coordinates, and allied external system platforms. |

> **Automatic Brand & Gateway Detection:** The SDK automatically detects the brand from your presented API key prefix or App ID and configures the correct dedicated gateway URL out of the box. You never need to hardcode URLs manually.

---

## 🔒 Core Protocol Invariants & Mandatory Rules

1. **Authentication & Authorization Only (SSO):**
   This SDK can **ONLY** authenticate users, grant consent tokens, and verify identity claims. It **CANNOT** create, mint, forge, issue, or register RMIASIN identity records. Identity creation is exclusively governed by sovereign foundation adjudicators.
2. **Application Database Isolation (Mandatory):**
   The sovereign RMIASIN registry does **NOT** store or host consumer application user tables. Applications integrating this SDK are responsible for storing fetched user credentials (`identity_id`, `rsid_display`, `trust_tier`, session token) in their **OWN separate database** (PostgreSQL, Supabase, MySQL, MongoDB, SQLite).
3. **Single Active Consent Policy:**
   Under sovereign protocol rules, an application cannot receive duplicate active consent grants for the same citizen while an active grant is valid. Once established, users return with the existing active token or must revoke it before granting new scopes.
4. **Native App Registration Rule:**
   When registering applications in the portal, **never select NATIVE** unless your application is a verified first-party desktop/mobile binary with enclave hardware attestation. Non-native apps falsely selecting Native will be immediately rejected during adjudication.

---

## 📦 Installation

```bash
# npm
npm install @rmiasin/auth-sdk

# pnpm
pnpm add @rmiasin/auth-sdk

# yarn
yarn add @rmiasin/auth-sdk

# bun
bun add @rmiasin/auth-sdk
```

---

## 📖 Step-by-Step Integration Guide

```
┌────────────────────────────────────────────────────────────────────────┐
│                        RMIASIN AUTHENTICATION FLOW                      │
│                                                                        │
│  [1. User clicks]       [2. Sovereign Portal]      [3. Backend Verify] │
│   RmasinLoginButton ──►  Consent Window (/consent) ──►  RmasinServer   │
│         ▲                         │                         │          │
│         │                         ▼                         ▼          │
│  [React / Next.js]       [Token Granted & Redirect] [4. Save User]     │
│   Client Application ◄──── Auth Response Payload ──► Your App Database │
└────────────────────────────────────────────────────────────────────────┘
```

### Step 1: Register Application in Sovereign Portal

1. Log in to the sovereign portal at [https://rmiasin.raltecalv.com](https://rmiasin.raltecalv.com) with your RSID.
2. Navigate to **Developer Apps Dashboard** (`/apps`).
3. Click **Register New Application**.
4. Configure application details:
   - **Application Name**: Your app name (e.g., `Acme Sovereign Portal`).
   - **Brand Ecosystem**: `RALTECALV`, `RMIASIN`, or `CELESTIAL`.
   - **Purpose String**: A concise explanation of why you require user identity (e.g., `Account authentication and profile verification`).
   - **Requested Scopes**: Select minimum required scopes (e.g., `identity.rsid_only`, `trust_tier.read`).
   - **Connection Tier**: Select `VERIFIED_PARTNER` (or `EXTERNAL_DEVELOPER`). **Never select NATIVE**.
5. Save your **App ID** (e.g., `RALTECALV_APP_ACME_5E8D`) and **API Secret Key** (`raltecalv_live_...`).
6. In **OAuth & Redirect URIs**, register your callback URLs (e.g., `http://localhost:3000/oauth/callback`, `https://myapp.com/api/auth/callback`).

---

### Step 2: Environment Configuration

Create or update your `.env` configuration:

```bash
# Frontend (.env or .env.local)
VITE_RMASIN_APP_ID=RALTECALV_APP_ACME_5E8D
# For Next.js:
NEXT_PUBLIC_RMASIN_APP_ID=RALTECALV_APP_ACME_5E8D

# Backend (.env)
RMASIN_APP_ID=RALTECALV_APP_ACME_5E8D
RMASIN_API_KEY=your-server-issued-api-key
RMASIN_PORTAL_URL=https://rmiasin.raltecalv.com
RMASIN_API_URL=https://axabpwxfvqsjpyvevaeg.supabase.co/functions/v1/extension-api
```

---

### Step 3: Client Integration

#### Option A: Using the React Login Button (`RmasinLoginButton`)

```tsx
import React from 'react';
import { RmasinLoginButton } from '@rmiasin/auth-sdk/react';

export function LoginPage() {
  return (
    <div className="login-card">
      <h2>Sign in to Acme Portal</h2>
      <p>Zero passwords · Sovereign Identity Verified</p>

      <RmasinLoginButton
        appId={process.env.VITE_RMASIN_APP_ID || 'RALTECALV_APP_ACME_5E8D'}
        brand="RALTECALV" // 'RALTECALV' | 'RMIASIN' | 'CELESTIAL'
        theme="raltecalv-gold" // 'sovereign-dark' | 'raltecalv-gold' | 'terracotta' | 'verdigris' | 'celestial-blue' | 'minimal-light'
        size="md" // 'sm' | 'md' | 'lg'
        mode="popup" // 'popup' (recommended) | 'redirect'
        scopes={['identity.rsid_only', 'trust_tier.read']}
        onSuccess={async (auth) => {
          console.log('Verified Citizen RSID:', auth.identity.rsid_display);
          console.log('Consent Token:', auth.consent_token_id || auth.token);

          // Transmit token to your backend API to verify and store session
          const response = await fetch('/api/auth/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ consentTokenId: auth.consent_token_id || auth.token }),
          });

          if (response.ok) {
            window.location.href = '/dashboard';
          }
        }}
        onError={(err) => {
          console.error('Authentication failed:', err.message);
        }}
      />
    </div>
  );
}
```

#### Option B: Custom UI with the `useRmasinAuth` Hook

```tsx
import React from 'react';
import { useRmasinAuth } from '@rmiasin/auth-sdk/react';

export function Navbar() {
  const { isAuthenticated, user, loginWithPopup, logout, isLoading } = useRmasinAuth({
    appId: process.env.VITE_RMASIN_APP_ID || 'RALTECALV_APP_ACME_5E8D',
    brand: 'RALTECALV',
    scopes: ['identity.rsid_only', 'trust_tier.read'],
  });

  if (isLoading) {
    return <span>Connecting to Sovereign Enclave…</span>;
  }

  if (isAuthenticated && user) {
    return (
      <div className="flex items-center gap-3">
        <span className="font-mono text-emerald-400">
          {user.rsid_display} · {user.trust_tier}
        </span>
        <button onClick={logout} className="text-xs text-neutral-400 hover:text-white">
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => loginWithPopup()}
      className="px-4 py-2 bg-amber-600 text-white rounded font-medium hover:bg-amber-500"
    >
      Log In with RMASIN
    </button>
  );
}
```

#### Option C: Vanilla JavaScript & TypeScript

```typescript
import { RmasinClient } from '@rmiasin/auth-sdk';

const rmasin = new RmasinClient({
  appId: 'RALTECALV_APP_ACME_5E8D',
  brand: 'RALTECALV',
  scopes: ['identity.rsid_only', 'trust_tier.read'],
});

document.getElementById('login-btn')?.addEventListener('click', async () => {
  try {
    const auth = await rmasin.loginWithPopup();
    console.log('Authenticated citizen:', auth.identity.rsid_display);

    // Send token to backend
    await fetch('/api/auth/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ consentTokenId: auth.consent_token_id || auth.token }),
    });
  } catch (err: any) {
    console.error('Login failed:', err.message);
  }
});
```

---

### Step 4: Backend Token Verification

When your frontend receives a token, your backend server **must verify it** against the sovereign gateway using `RmasinServer`:

```typescript
import express from 'express';
import { RmasinServer } from '@rmiasin/auth-sdk/node';

const app = express();
app.use(express.json());

const rmasin = new RmasinServer({
  appId: process.env.RMASIN_APP_ID!,
  apiKey: process.env.RMASIN_API_KEY!, // e.g. raltecalv_live_...
  autoTelemetry: true, // Automatically logs latency and live events to dashboard
});

// Middleware protects endpoints & validates consent tokens automatically
app.get(
  '/api/sovereign-resource',
  rmasin.middleware(['identity.rsid_only', 'trust_tier.read']),
  (req, res) => {
    // req.rmasinUser populated automatically!
    res.json({
      status: 'AUTHORIZED',
      rsid: req.rmasinUser.profile.rsid_display,
      trustTier: req.rmasinUser.profile.trust_tier,
    });
  }
);

// Manual verification handler
app.post('/api/auth/session', async (req, res) => {
  const { consentTokenId } = req.body;
  const verification = await rmasin.verifyConsentToken(consentTokenId);

  if (!verification.valid) {
    return res.status(401).json({ error: verification.error });
  }

  // Format credentials for your private database
  const record = rmasin.toAppDatabaseRecord(verification);

  // Upsert into your application's user table:
  // await db.users.upsert(record);

  res.json({ success: true, user: record });
});

app.listen(3000, () => console.log('Server running with RMASIN Auth'));
```

---

### Step 5: Separate Application Database Persistence

The sovereign enclave does not store your application's users. Use `rmasin.toAppDatabaseRecord(verification)` to format verified credentials for your database:

```typescript
import { rmasin } from './rmasin';
import { db } from './db';

export async function handleUserSession(consentTokenId: string) {
  const verification = await rmasin.verifyConsentToken(consentTokenId);
  if (!verification.valid) {
    throw new Error(verification.error || 'Invalid consent token');
  }

  // Convert verified claims into clean DB record:
  const appUser = rmasin.toAppDatabaseRecord(verification);

  // Save to your database (Prisma example):
  return await db.user.upsert({
    where: { rmiasin_identity_id: appUser.rmiasin_identity_id },
    update: {
      rsid_display: appUser.rsid_display,
      trust_tier: appUser.trust_tier,
      granted_scopes: appUser.granted_scopes,
      last_login_at: new Date(),
    },
    create: {
      ...appUser,
      last_login_at: new Date(),
    },
  });
}
```

---

### Step 6: Live Enclave Gateway Verification (`verifyConnection`)

Test gateway connectivity, brand detection, and database status at startup:

```typescript
import { RmasinServer } from '@rmiasin/auth-sdk/node';

const rmasin = new RmasinServer({
  appId: process.env.RMASIN_APP_ID!,
  apiKey: process.env.RMASIN_API_KEY!,
});

const status = await rmasin.verifyConnection();
console.log('Gateway status:', status.status);              // "OPERATIONAL"
console.log('Database connected:', status.database_connected); // true
console.log('Enclave latency:', status.latency_ms + 'ms');     // 12ms
console.log('Active brand:', status.brand);                // "RALTECALV"
console.log('Enclave status:', status.enclave_status);      // "ONLINE"
```

---

## 💾 Supported Database Schemas

### 1. Prisma ORM (`schema.prisma`)
```prisma
model AppUser {
  id                 String   @id @default(uuid())
  rmiasinIdentityId  String   @unique @map("rmiasin_identity_id")
  rsidDisplay        String   @map("rsid_display")
  rsidCanonical      String   @map("rsid_canonical")
  trustTier          String   @map("trust_tier")
  identityClass      String   @map("identity_class")
  brand              String   @default("RALTECALV")
  appId              String   @map("app_id")
  grantedScopes      String[] @map("granted_scopes")
  contactEmail       String?  @map("contact_email")
  nationOfOperation  String?  @map("nation_of_operation")
  createdAt          DateTime @default(now()) @map("created_at")
  lastLoginAt        DateTime @default(now()) @map("last_login_at")

  @@map("app_users")
}
```

### 2. PostgreSQL / Supabase SQL Table
```sql
CREATE TABLE IF NOT EXISTS app_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rmiasin_identity_id TEXT UNIQUE NOT NULL,
  rsid_display TEXT NOT NULL,
  rsid_canonical TEXT NOT NULL,
  trust_tier TEXT NOT NULL,
  identity_class TEXT NOT NULL,
  brand TEXT NOT NULL DEFAULT 'RALTECALV',
  app_id TEXT NOT NULL,
  granted_scopes JSONB NOT NULL DEFAULT '[]'::jsonb,
  contact_email TEXT,
  nation_of_operation TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_app_users_rsid ON app_users(rsid_display);
CREATE INDEX IF NOT EXISTS idx_app_users_identity ON app_users(rmiasin_identity_id);
```

### 3. Drizzle ORM (`schema.ts`)
```typescript
import { pgTable, text, timestamp, jsonb } from 'drizzle-orm/pg-core';

export const appUsers = pgTable('app_users', {
  id: text('id').primaryKey(),
  rmiasinIdentityId: text('rmiasin_identity_id').unique().notNull(),
  rsidDisplay: text('rsid_display').notNull(),
  rsidCanonical: text('rsid_canonical').notNull(),
  trustTier: text('trust_tier').notNull(),
  identityClass: text('identity_class').notNull(),
  brand: text('brand').notNull().default('RALTECALV'),
  appId: text('app_id').notNull(),
  grantedScopes: jsonb('granted_scopes').$type<string[]>().notNull(),
  contactEmail: text('contact_email'),
  nationOfOperation: text('nation_of_operation'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  lastLoginAt: timestamp('last_login_at').defaultNow().notNull(),
});
```

---

## 🚀 Full Framework Recipes

### Next.js 14 / 15 App Router Full-Stack Recipe

#### 1. Route Handler: `app/api/auth/rmasin/route.ts`
```typescript
import { NextResponse } from 'next/server';
import { RmasinServer } from '@rmiasin/auth-sdk/node';

const rmasin = new RmasinServer({
  appId: process.env.RMASIN_APP_ID!,
  apiKey: process.env.RMASIN_API_KEY!,
});

export async function POST(request: Request) {
  try {
    const { token } = await request.json();
    const verification = await rmasin.verifyConsentToken(token);

    if (!verification.valid) {
      return NextResponse.json({ error: verification.error }, { status: 401 });
    }

    const record = rmasin.toAppDatabaseRecord(verification);

    // Save record to your database (e.g. Prisma / Supabase / Drizzle)
    // const user = await db.user.upsert({ ... });

    return NextResponse.json({ success: true, user: record });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
```

#### 2. Client Page: `app/login/page.tsx`
```tsx
'use client';

import React from 'react';
import { RmasinLoginButton } from '@rmiasin/auth-sdk/react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();

  return (
    <main className="flex min-h-screen items-center justify-center p-6 bg-neutral-950">
      <div className="w-full max-w-md p-8 border border-neutral-800 bg-neutral-900 rounded-lg">
        <h1 className="text-xl font-bold text-white mb-2">Sign in to App</h1>
        <p className="text-sm text-neutral-400 mb-6">Zero passwords · Sovereign identity verified</p>

        <RmasinLoginButton
          appId={process.env.NEXT_PUBLIC_RMASIN_APP_ID!}
          brand="RALTECALV"
          theme="raltecalv-gold"
          onSuccess={async (auth) => {
            const res = await fetch('/api/auth/rmasin', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ token: auth.consent_token_id || auth.token }),
            });
            if (res.ok) router.push('/dashboard');
          }}
        />
      </div>
    </main>
  );
}
```

---

## 🛡️ Permission Scopes Reference

| Scope Code | Category | Description |
| :--- | :--- | :--- |
| `identity.rsid_only` | Identity | Read citizen's formatted and canonical Crockford Base32 RSID. |
| `trust_tier.read` | Security | Access verified sovereign trust tier (`TIER_1` through `TIER_4`). |
| `entity.status` | Security | Inspect revocation status and adjudication standing. |
| `contact.email_only` | Profile | Read verified contact email address (if consented by citizen). |
| `profile.origin.read` | Identity | Access nation of operation, jurisdiction, and genesis timestamp. |
| `profile.affiliations.read` | Institutional | Read sovereign affiliations, corporate entities, or guilds. |
| `profile.pearlmind.read` | Advanced | Read cryptographic cognitive and memory lattice assertions. |

---

## 📚 TypeScript API Reference

### Exported Modules

- **Universal / Browser Core**: `@rmiasin/auth-sdk`
- **React Components & Hooks**: `@rmiasin/auth-sdk/react`
- **Server-Side Node.js / APIs**: `@rmiasin/auth-sdk/node`

### `RmasinClient` (Universal / Browser)
- `new RmasinClient(config: RmasinConfig)`
- `client.loginWithPopup(options?: LoginOptions): Promise<RmasinAuthResponse>`
- `client.loginWithRedirect(options?: LoginOptions): void`
- `client.handleRedirectCallback(): Promise<RmasinAuthResponse | null>`
- `client.logout(): void`
- `client.getSession(): RmasinAuthResponse | null`
- `client.verifyConnection(apiKey?: string): Promise<ConnectionVerificationResult>`
- `client.getBrandGateway(): BrandGatewayConfig`

### `RmasinServer` (Node.js / Backend)
- `new RmasinServer(config: RmasinServerConfig)`
- `server.verifyConsentToken(consentTokenId: string): Promise<VerifyTokenResult>`
- `server.middleware(requiredScopes?: ConsentScope[]): RequestHandler`
- `server.verifyConnection(): Promise<ConnectionVerificationResult>`
- `server.toAppDatabaseRecord(result: VerifyTokenResult): RmasinAppStoredUser | null`
- `server.getAppMetrics(): Promise<AppTelemetryMetrics | null>`

---

## ❓ Troubleshooting & FAQ

### 1. `Popup blocked by browser`
- **Cause**: Browser blocked window opening because it was not triggered by a direct user click event.
- **Solution**: Always call `loginWithPopup()` directly inside a button `onClick` handler, or use `mode="redirect"`.

### 2. `Invalid API Key prefix for brand`
- **Cause**: Presenting an API key that starts with `raltecalv_live_` to a `RMIASIN` brand application, or vice versa.
- **Solution**: Use the matching key prefix:
  - `RALTECALV` -> `raltecalv_live_...`
  - `RMIASIN` -> `rmiasin_live_...`
  - `CELESTIAL` -> `celestial_live_...`

### 3. `APPLICATION_NOT_APPROVED`
- **Cause**: Application is queued for adjudication review in the portal.
- **Solution**: Applications in `PENDING` review status have keys locked until a sovereign Tier Four Adjudicator approves the application at `https://rmiasin.raltecalv.com/adjudicator`.

### 4. `CONSENT_ALREADY_ACTIVE`
- **Cause**: The citizen already has an active, unexpired consent grant for this application.
- **Solution**: The SDK returns the active token automatically. Citizens can revoke grants at `/consent` if needed.

---

## 📜 License & Governance

Licensed under the **Apache License, Version 2.0**.
Copyright © 2026 **Raltécalv Sovereign Identity Foundation**. All rights reserved.

- **Official Sovereign Portal**: [https://rmiasin.raltecalv.com](https://rmiasin.raltecalv.com)
- **Developer Documentation**: [GitHub documentation](https://github.com/raltecalv/rmiasin-auth-sdk/tree/main/docs)
- **Source Code**: [https://github.com/raltecalv/rmiasin-auth-sdk](https://github.com/raltecalv/rmiasin-auth-sdk)
