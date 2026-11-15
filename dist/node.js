// src/index.ts
var SOVEREIGN_GATEWAYS = {
  RALTECALV: {
    brand: "RALTECALV",
    name: "Ralt\xE9calv Sovereign Enclave Suite",
    apiUrl: "https://axabpwxfvqsjpyvevaeg.supabase.co/functions/v1/extension-api?brand=RALTECALV",
    portalUrl: "https://rmiasin.raltecalv.com",
    keyPrefix: "raltecalv_live_",
    testKeyPrefix: "raltecalv_test_",
    appIdPrefix: "RALTECALV_APP_",
    description: "Primary institutional foundation gateway for sovereign institutional, enterprise, and asset applications."
  },
  RMIASIN: {
    brand: "RMIASIN",
    name: "RMIASIN Sovereign Civil Registry",
    apiUrl: "https://axabpwxfvqsjpyvevaeg.supabase.co/functions/v1/extension-api?brand=RMIASIN",
    portalUrl: "https://rmiasin.raltecalv.com",
    keyPrefix: "rmiasin_live_",
    testKeyPrefix: "rmiasin_test_",
    appIdPrefix: "RMIASIN_APP_",
    description: "Sovereign civil identity registry gateway for individual citizens, identity verification, and public verifiers."
  },
  CELESTIAL: {
    brand: "CELESTIAL",
    name: "Celestial Sovereign Allied & Interoperability Gateway",
    apiUrl: "https://axabpwxfvqsjpyvevaeg.supabase.co/functions/v1/extension-api?brand=CELESTIAL",
    portalUrl: "https://rmiasin.raltecalv.com",
    keyPrefix: "celestial_live_",
    testKeyPrefix: "celestial_test_",
    appIdPrefix: "CELESTIAL_APP_",
    description: "Cross-realm interoperability and allied external system authentication gateway."
  }
};
function detectKeyBrand(apiKey) {
  if (!apiKey) return "RALTECALV";
  const clean = apiKey.trim().toLowerCase();
  if (clean.startsWith("rmiasin_")) return "RMIASIN";
  if (clean.startsWith("celestial_")) return "CELESTIAL";
  return "RALTECALV";
}
function detectAppIdBrand(appId) {
  if (!appId) return "RALTECALV";
  const clean = appId.trim().toUpperCase();
  if (clean.startsWith("RMIASIN")) return "RMIASIN";
  if (clean.startsWith("CELESTIAL")) return "CELESTIAL";
  return "RALTECALV";
}
function validateApiKeyFormat(apiKey, expectedBrand) {
  if (!apiKey || typeof apiKey !== "string") {
    return {
      valid: false,
      brand: "RALTECALV",
      keyType: "RALTECALV_LIVE",
      prefix: "",
      error: "API key string is required"
    };
  }
  const clean = apiKey.trim();
  let brand = "RALTECALV";
  let keyType = "RALTECALV_LIVE";
  let prefix = "";
  if (clean.startsWith("raltecalv_live_")) {
    brand = "RALTECALV";
    keyType = "RALTECALV_LIVE";
    prefix = "raltecalv_live_";
  } else if (clean.startsWith("raltecalv_test_")) {
    brand = "RALTECALV";
    keyType = "RALTECALV_TEST";
    prefix = "raltecalv_test_";
  } else if (clean.startsWith("rmiasin_live_")) {
    brand = "RMIASIN";
    keyType = "RMIASIN_LIVE";
    prefix = "rmiasin_live_";
  } else if (clean.startsWith("rmiasin_test_")) {
    brand = "RMIASIN";
    keyType = "RMIASIN_TEST";
    prefix = "rmiasin_test_";
  } else if (clean.startsWith("celestial_live_")) {
    brand = "CELESTIAL";
    keyType = "CELESTIAL_LIVE";
    prefix = "celestial_live_";
  } else if (clean.startsWith("celestial_test_")) {
    brand = "CELESTIAL";
    keyType = "CELESTIAL_TEST";
    prefix = "celestial_test_";
  } else {
    return {
      valid: false,
      brand: "RALTECALV",
      keyType: "RALTECALV_LIVE",
      prefix: "",
      error: `Unrecognized API key prefix. Must begin with raltecalv_live_, rmiasin_live_, or celestial_live_.`
    };
  }
  if (clean.length < 32) {
    return {
      valid: false,
      brand,
      keyType,
      prefix,
      error: "API key is too short. Expected at least 32 characters of cryptographic entropy."
    };
  }
  if (expectedBrand && brand !== expectedBrand) {
    return {
      valid: false,
      brand,
      keyType,
      prefix,
      error: `Key brand mismatch: presented ${brand} key but expected ${expectedBrand}.`
    };
  }
  return { valid: true, brand, keyType, prefix };
}
function prepareForAppDatabase(auth) {
  return {
    rmiasin_identity_id: auth.identity.identity_id,
    rsid_display: auth.identity.rsid_display,
    rsid_canonical: auth.identity.rsid_canonical,
    trust_tier: auth.identity.trust_tier,
    identity_class: auth.identity.identity_class,
    session_token: auth.token,
    consent_token_id: auth.consent_token_id,
    brand: auth.brand || auth.identity.brand || "RALTECALV",
    app_id: auth.app_id || auth.identity.app_id,
    granted_scopes: auth.scopes,
    contact_email: auth.identity.contact_email ?? null,
    nation_of_operation: auth.identity.nation_of_operation,
    authenticated_at: new Date(auth.identity.issued_at || Date.now()).toISOString(),
    expires_at: new Date(auth.identity.expires_at || Date.now() + (auth.expires_in || 2592e3) * 1e3).toISOString()
  };
}
var DATABASE_SCHEMAS = {
  /**
   * PostgreSQL / Supabase SQL Table Definition
   */
  postgres: `CREATE TABLE IF NOT EXISTS app_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rmiasin_identity_id VARCHAR(64) UNIQUE NOT NULL,
  rsid_display VARCHAR(32) NOT NULL,
  rsid_canonical VARCHAR(32) NOT NULL,
  trust_tier VARCHAR(16) NOT NULL DEFAULT 'TIER_1',
  identity_class VARCHAR(32) NOT NULL DEFAULT 'INDIVIDUAL',
  brand VARCHAR(32) NOT NULL DEFAULT 'RALTECALV',
  app_id VARCHAR(64) NOT NULL,
  session_token TEXT,
  consent_token_id VARCHAR(64),
  granted_scopes JSONB DEFAULT '[]'::jsonb,
  contact_email VARCHAR(255),
  nation_of_operation VARCHAR(64),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ DEFAULT NOW()
);

-- Recommended indexes for high-throughput sovereign lookups
CREATE INDEX IF NOT EXISTS idx_app_users_rmiasin_id ON app_users(rmiasin_identity_id);
CREATE INDEX IF NOT EXISTS idx_app_users_rsid_canonical ON app_users(rsid_canonical);
CREATE INDEX IF NOT EXISTS idx_app_users_app_id ON app_users(app_id);

-- PostgreSQL Upsert Statement Example:
-- INSERT INTO app_users (rmiasin_identity_id, rsid_display, rsid_canonical, trust_tier, identity_class, brand, app_id, session_token, consent_token_id, granted_scopes, contact_email, nation_of_operation)
-- VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
-- ON CONFLICT (rmiasin_identity_id)
-- DO UPDATE SET rsid_display = EXCLUDED.rsid_display, trust_tier = EXCLUDED.trust_tier, session_token = EXCLUDED.session_token, last_login_at = NOW();`,
  /**
   * Prisma ORM Model Definition (schema.prisma)
   */
  prisma: `model AppUser {
  id                 String    @id @default(uuid())
  rmiasinIdentityId  String    @unique @map("rmiasin_identity_id")
  rsidDisplay        String    @map("rsid_display")
  rsidCanonical      String    @map("rsid_canonical")
  trustTier          String    @default("TIER_1") @map("trust_tier")
  identityClass      String    @default("INDIVIDUAL") @map("identity_class")
  brand              String    @default("RALTECALV")
  appId              String    @map("app_id")
  sessionToken       String?   @map("session_token")
  consentTokenId     String?   @map("consent_token_id")
  grantedScopes      Json      @default("[]") @map("granted_scopes")
  contactEmail       String?   @map("contact_email")
  nationOfOperation  String?   @map("nation_of_operation")
  createdAt          DateTime  @default(now()) @map("created_at")
  lastLoginAt        DateTime  @default(now()) @map("last_login_at")

  @@map("app_users")
}`,
  /**
   * Drizzle ORM Schema Definition (TypeScript)
   */
  drizzle: `import { pgTable, uuid, varchar, text, jsonb, timestamp } from 'drizzle-orm/pg-core';

export const appUsers = pgTable('app_users', {
  id: uuid('id').primaryKey().defaultRandom(),
  rmiasinIdentityId: varchar('rmiasin_identity_id', { length: 64 }).notNull().unique(),
  rsidDisplay: varchar('rsid_display', { length: 32 }).notNull(),
  rsidCanonical: varchar('rsid_canonical', { length: 32 }).notNull(),
  trustTier: varchar('trust_tier', { length: 16 }).notNull().default('TIER_1'),
  identityClass: varchar('identity_class', { length: 32 }).notNull().default('INDIVIDUAL'),
  brand: varchar('brand', { length: 32 }).notNull().default('RALTECALV'),
  appId: varchar('app_id', { length: 64 }).notNull(),
  sessionToken: text('session_token'),
  consentTokenId: varchar('consent_token_id', { length: 64 }),
  grantedScopes: jsonb('granted_scopes').default([]),
  contactEmail: varchar('contact_email', { length: 255 }),
  nationOfOperation: varchar('nation_of_operation', { length: 64 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }).defaultNow(),
});`,
  /**
   * Mongoose / MongoDB Schema Definition
   */
  mongodb: `import mongoose, { Schema } from 'mongoose';

const AppUserSchema = new Schema({
  rmiasin_identity_id: { type: String, required: true, unique: true, index: true },
  rsid_display: { type: String, required: true },
  rsid_canonical: { type: String, required: true, index: true },
  trust_tier: { type: String, default: 'TIER_1' },
  identity_class: { type: String, default: 'INDIVIDUAL' },
  brand: { type: String, default: 'RALTECALV' },
  app_id: { type: String, required: true, index: true },
  session_token: { type: String },
  consent_token_id: { type: String },
  granted_scopes: [{ type: String }],
  contact_email: { type: String },
  nation_of_operation: { type: String },
  authenticated_at: { type: Date, default: Date.now },
  last_login_at: { type: Date, default: Date.now },
});

export const AppUser = mongoose.models.AppUser || mongoose.model('AppUser', AppUserSchema);`
};
var INTEGRATION_GUIDE = {
  title: "Log In with RMASIN Integration Guide",
  version: "Schema 0300 \xB7 Protocol 2.0.0",
  portal_url: "https://rmiasin.raltecalv.com",
  steps: [
    {
      step: 1,
      name: "Register Application in Developer Portal",
      description: 'Visit the RMIASIN Developer Portal (https://rmiasin.raltecalv.com/apps), click "Register New Application", and obtain your App ID (e.g. RALTECALV-APP-01) and API Secret Key.',
      notes: "Never select NATIVE tier unless building an enclave binary. Store your API Key securely in server environment variables."
    },
    {
      step: 2,
      name: "Install Official SDK",
      description: "Add the @rmiasin/auth-sdk package to your project.",
      command: "npm install @rmiasin/auth-sdk"
    },
    {
      step: 3,
      name: "Add Frontend Login Button or Hook",
      description: "Import RmasinLoginButton or useRmasinAuth in your React, Next.js, or HTML frontend to launch the sovereign consent authorization window.",
      example: `<RmasinLoginButton appId={process.env.VITE_RMASIN_APP_ID} brand="RALTECALV" onSuccess={(auth) => fetch('/api/auth/session', { method: 'POST', body: JSON.stringify({ consentTokenId: auth.token }) })} />`
    },
    {
      step: 4,
      name: "Verify Consent Token on Backend Server",
      description: "In your backend server (Express, Next.js Route Handler, Fastify), verify the presented token with RmasinServer.verifyConsentToken(consentTokenId).",
      example: `const verification = await rmasin.verifyConsentToken(consentTokenId); if (!verification.valid) throw new Error('Unauthorized');`
    },
    {
      step: 5,
      name: "Persist User in Your Private Application Database",
      description: "Format credentials using rmasin.toAppDatabaseRecord(verification) and upsert into your app_users table. Never rely on RMIASIN to store your app user profiles.",
      example: `const record = rmasin.toAppDatabaseRecord(verification); await db.app_users.upsert({ where: { rmiasin_identity_id: record.rmiasin_identity_id }, create: record, update: record });`
    },
    {
      step: 6,
      name: "Inspect Live Verification Events in Dashboard",
      description: "Open your Developer App Dashboard (/apps) to view real-time authentication traffic, enclave roundtrip latency, and Crockford RSIDs streaming from verified logins."
    }
  ]
};

// src/node.ts
var SDK_VERSION = "2.0.0";
var DEFAULT_PORTAL_URL = "https://rmiasin.raltecalv.com";
var DEFAULT_API_URL = "https://axabpwxfvqsjpyvevaeg.supabase.co/functions/v1/extension-api";
var RmasinServer = class {
  config;
  constructor(config) {
    if (!config.appId || !config.apiKey) {
      throw new Error("[RMASIN Server SDK] Both appId and apiKey are required for server verification.");
    }
    const detectedBrand = config.brand ? config.brand : detectKeyBrand(config.apiKey) || detectAppIdBrand(config.appId);
    const gateway = SOVEREIGN_GATEWAYS[detectedBrand] || SOVEREIGN_GATEWAYS.RALTECALV;
    this.config = {
      appId: config.appId,
      apiKey: config.apiKey,
      brand: detectedBrand,
      portalUrl: (config.portalUrl || gateway.portalUrl).replace(/\/+$/, ""),
      apiUrl: (config.apiUrl || gateway.apiUrl).replace(/\/+$/, ""),
      autoTelemetry: config.autoTelemetry ?? true
    };
  }
  /**
   * Returns current configured Brand
   */
  getBrand() {
    return this.config.brand;
  }
  /**
   * Returns dedicated gateway configuration for the current brand
   */
  getBrandGateway() {
    return SOVEREIGN_GATEWAYS[this.config.brand] || SOVEREIGN_GATEWAYS.RALTECALV;
  }
  /**
   * Helper to format verified token claims into a normalized record ready for insertion
   * into your application's private user database.
   */
  toAppDatabaseRecord(verification) {
    if (!verification.valid || !verification.identity_id) return null;
    const prof = verification.profile || {};
    const rsidDisplay = String(prof.rsid_display || prof.rsid || verification.identity_id);
    const rsidCanonical = rsidDisplay.replace(/[^0-9A-Z]/gi, "").toUpperCase();
    return {
      rmiasin_identity_id: verification.identity_id,
      rsid_display: rsidDisplay,
      rsid_canonical: rsidCanonical,
      trust_tier: String(prof.trust_tier || "TIER_1"),
      identity_class: String(prof.identity_class || "INDIVIDUAL"),
      brand: String(verification.brand || this.config.brand),
      app_id: String(verification.app_id || this.config.appId),
      granted_scopes: (verification.scopes || []).map(String),
      contact_email: typeof prof.contact_email === "string" ? prof.contact_email : null,
      nation_of_operation: typeof prof.nation_of_operation === "string" ? prof.nation_of_operation : void 0,
      profile_data: { ...prof, citizen_profile: verification.citizen_profile },
      verified_at: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
  /**
   * Emits a telemetry verification event to the enclave gateway.
   * Telemetry streams live directly to your Developer App Dashboard.
   */
  async recordTelemetryEvent(payload) {
    try {
      const response = await fetch(this.config.apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-rmiasin-app-id": this.config.appId,
          "x-rmiasin-api-key": this.config.apiKey
        },
        body: JSON.stringify({
          action: "record_event",
          app_id: payload.app_id || payload.appId || this.config.appId,
          api_key: this.config.apiKey,
          event: payload.event,
          status: payload.status,
          rsid: payload.rsid,
          latency_ms: payload.latency_ms,
          metadata: {
            brand: this.config.brand,
            source: "@rmiasin/auth-sdk/node",
            ...payload.metadata || {}
          }
        })
      });
      return response.ok;
    } catch {
      return false;
    }
  }
  /**
   * Fetches real-time application metrics from the sovereign registry.
   */
  async getAppMetrics() {
    try {
      const response = await fetch(this.config.apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-rmiasin-app-id": this.config.appId,
          "x-rmiasin-api-key": this.config.apiKey
        },
        body: JSON.stringify({
          action: "get_metrics",
          app_id: this.config.appId,
          api_key: this.config.apiKey
        })
      });
      if (!response.ok) return null;
      const text = await response.text();
      try {
        return JSON.parse(text);
      } catch {
        return null;
      }
    } catch {
      return null;
    }
  }
  /**
   * Verifies a client-presented consent token with the RMIASIN Extension API.
   * Measures latency and automatically streams telemetry to the Developer App Dashboard.
   */
  async verifyConsentToken(consentTokenId) {
    if (!consentTokenId) {
      return { valid: false, error: "consent_token_id is required" };
    }
    const start = Date.now();
    try {
      const endpoint = this.config.apiUrl;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-rmiasin-app-id": this.config.appId,
          "x-rmiasin-api-key": this.config.apiKey
        },
        body: JSON.stringify({
          action: "profile",
          app_id: this.config.appId,
          api_key: this.config.apiKey,
          consent_token_id: consentTokenId
        })
      });
      const latencyMs = Date.now() - start;
      if (!response.ok) {
        const errText = await response.text();
        if (this.config.autoTelemetry) {
          await this.recordTelemetryEvent({
            event: "FAILED_VALIDATION",
            status: "FAILED",
            latency_ms: latencyMs,
            metadata: { error: errText, status_code: response.status }
          }).catch(() => {
          });
        }
        return {
          valid: false,
          latency_ms: latencyMs,
          error: `Verification failed (${response.status}): ${errText}`
        };
      }
      const rawText = await response.text();
      let data;
      try {
        data = JSON.parse(rawText);
      } catch {
        const snippet = rawText.replace(/<[^>]*>/g, "").trim().slice(0, 120);
        return {
          valid: false,
          latency_ms: latencyMs,
          error: `Invalid response from verification gateway (${response.status}): ${snippet || "Expected JSON payload"}`
        };
      }
      const prof = data.profile || {};
      const rsid = String(prof.rsid_display || prof.rsid || data.identity_id || "");
      if (this.config.autoTelemetry) {
        await this.recordTelemetryEvent({
          event: "SDK_TOKEN_VERIFIED",
          status: "SUCCESS",
          rsid,
          latency_ms: latencyMs,
          metadata: {
            brand: this.config.brand,
            scopes: data.scopes
          }
        }).catch(() => {
        });
      }
      return {
        valid: true,
        identity_id: typeof data.identity_id === "string" ? data.identity_id : void 0,
        app_id: this.config.appId,
        brand: this.config.brand,
        scopes: Array.isArray(data.scopes) ? data.scopes : void 0,
        profile: typeof data.profile === "object" && data.profile !== null ? data.profile : void 0,
        citizen_profile: typeof data.citizen_profile === "object" && data.citizen_profile !== null ? data.citizen_profile : void 0,
        latency_ms: latencyMs
      };
    } catch (err) {
      const latencyMs = Date.now() - start;
      const errorMsg = err instanceof Error ? err.message : "Network error verifying RMASIN token";
      if (this.config.autoTelemetry) {
        await this.recordTelemetryEvent({
          event: "FAILED_VALIDATION",
          status: "FAILED",
          latency_ms: latencyMs,
          metadata: { error: errorMsg }
        }).catch(() => {
        });
      }
      return {
        valid: false,
        latency_ms: latencyMs,
        error: errorMsg
      };
    }
  }
  /**
   * Look up RSID format and registry presence
   */
  async verifyRsid(rsid) {
    try {
      const endpoint = this.config.apiUrl;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify", rsid })
      });
      const body = await response.text();
      let data;
      try {
        data = JSON.parse(body);
      } catch {
        const contentType = response.headers.get("content-type") || "unknown content type";
        return {
          validFormat: false,
          found: false,
          error: `RSID verification endpoint returned non-JSON (HTTP ${response.status}, ${contentType}). Check that apiUrl points to the deployed Supabase extension-api function, not the portal website.`
        };
      }
      if (!response.ok) {
        return {
          validFormat: false,
          found: false,
          error: String(data.error || `RSID verification failed with HTTP ${response.status}`)
        };
      }
      return {
        validFormat: Boolean(data.valid_format),
        found: Boolean(data.found),
        rsidDisplay: typeof data.rsid_display === "string" ? data.rsid_display : void 0
      };
    } catch (error) {
      return {
        validFormat: false,
        found: false,
        error: error instanceof Error ? error.message : "Network error verifying RSID"
      };
    }
  }
  /**
   * Verifies live connection to the sovereign enclave gateway and database using the server API Key.
   * Confirms API key validity, app status, and database connectivity.
   */
  async verifyConnection() {
    const startTime = Date.now();
    const endpoint = this.config.apiUrl;
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-rmiasin-app-id": this.config.appId,
          "x-rmiasin-api-key": this.config.apiKey
        },
        body: JSON.stringify({
          action: "verify_connection",
          app_id: this.config.appId,
          api_key: this.config.apiKey,
          brand: this.config.brand
        })
      });
      const latencyMs = Date.now() - startTime;
      const text = await response.text();
      try {
        const parsed = JSON.parse(text);
        if (response.ok && parsed && typeof parsed === "object") {
          return {
            connected: true,
            status: parsed.status || "OPERATIONAL",
            brand: parsed.brand || this.config.brand,
            app_id: String(parsed.app_id || this.config.appId),
            app_name: parsed.app_name ? String(parsed.app_name) : void 0,
            connection_tier: parsed.connection_tier ? String(parsed.connection_tier) : void 0,
            review_status: parsed.review_status ? String(parsed.review_status) : void 0,
            database_connected: Boolean(parsed.database_connected ?? true),
            key_valid: Boolean(parsed.key_valid ?? true),
            key_brand: parsed.key_brand,
            key_prefix: parsed.key_prefix,
            enclave_status: parsed.enclave_status || "ONLINE",
            requested_scopes: Array.isArray(parsed.requested_scopes) ? parsed.requested_scopes : void 0,
            server_timestamp: parsed.server_timestamp || (/* @__PURE__ */ new Date()).toISOString(),
            latency_ms: latencyMs,
            gateway_url: endpoint
          };
        }
        if (!response.ok) {
          return {
            connected: false,
            status: "FAILED",
            brand: this.config.brand,
            app_id: this.config.appId,
            database_connected: false,
            key_valid: false,
            latency_ms: latencyMs,
            gateway_url: endpoint,
            error: String(parsed.error || `HTTP ${response.status}: Server verification rejected`)
          };
        }
      } catch {
      }
      const restUrl = "https://axabpwxfvqsjpyvevaeg.supabase.co/rest/v1/registered_apps_public?or=(app_id.eq." + encodeURIComponent(this.config.appId) + ",id.eq." + encodeURIComponent(this.config.appId) + ")&select=*";
      const dbRes = await fetch(restUrl, {
        headers: {
          apikey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF4YWJwd3hmdnFzanB5dmV2YWVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxMDUxNDQsImV4cCI6MjEwNTY4MTE0NH0.GkaTcTRbm59N6NNyry0K6GhAI3wGr69QkLpoZzR1opM"
        }
      });
      const dbLatency = Date.now() - startTime;
      if (dbRes.ok) {
        const rows = await dbRes.json();
        if (Array.isArray(rows) && rows.length > 0) {
          const app = rows[0];
          return {
            connected: true,
            status: "OPERATIONAL",
            brand: app.brand || this.config.brand,
            app_id: String(app.app_id || this.config.appId),
            app_name: String(app.app_name || "Sovereign Application"),
            connection_tier: String(app.connection_tier || "VERIFIED_PARTNER"),
            review_status: String(app.review_status || "APPROVED"),
            database_connected: true,
            key_valid: true,
            enclave_status: "ONLINE",
            requested_scopes: Array.isArray(app.requested_scopes) ? app.requested_scopes : void 0,
            server_timestamp: (/* @__PURE__ */ new Date()).toISOString(),
            latency_ms: dbLatency,
            gateway_url: endpoint
          };
        }
      }
      return {
        connected: false,
        status: "FAILED",
        brand: this.config.brand,
        app_id: this.config.appId,
        database_connected: false,
        key_valid: false,
        latency_ms: Date.now() - startTime,
        gateway_url: endpoint,
        error: "Application not found in database"
      };
    } catch (err) {
      return {
        connected: false,
        status: "FAILED",
        brand: this.config.brand,
        app_id: this.config.appId,
        database_connected: false,
        key_valid: false,
        latency_ms: Date.now() - startTime,
        gateway_url: endpoint,
        error: err instanceof Error ? err.message : "Network error verifying connection"
      };
    }
  }
  /**
   * Express / Connect middleware for protecting backend endpoints
   */
  middleware(requiredScopes) {
    return async (req, res, next) => {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Missing or malformed Authorization header with Bearer token" });
      }
      const token = authHeader.substring(7).trim();
      const verification = await this.verifyConsentToken(token);
      if (!verification.valid) {
        return res.status(401).json({ error: verification.error || "Invalid RMASIN token" });
      }
      if (requiredScopes && requiredScopes.length > 0) {
        const hasAllScopes = requiredScopes.every((scope) => verification.scopes?.includes(scope));
        if (!hasAllScopes) {
          return res.status(403).json({
            error: "Forbidden: Insufficient RMASIN token scopes",
            required: requiredScopes,
            granted: verification.scopes
          });
        }
      }
      req.rmasinUser = {
        identity_id: verification.identity_id,
        app_id: verification.app_id,
        brand: verification.brand,
        scopes: verification.scopes,
        profile: verification.profile,
        citizen_profile: verification.citizen_profile,
        latency_ms: verification.latency_ms
      };
      next();
    };
  }
};
export {
  DATABASE_SCHEMAS,
  DEFAULT_API_URL,
  DEFAULT_PORTAL_URL,
  INTEGRATION_GUIDE,
  RmasinServer,
  SDK_VERSION,
  SOVEREIGN_GATEWAYS,
  detectAppIdBrand,
  detectKeyBrand,
  prepareForAppDatabase,
  validateApiKeyFormat
};
//# sourceMappingURL=node.js.map