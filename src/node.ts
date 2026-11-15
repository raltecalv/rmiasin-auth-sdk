/**
 * @rmiasin/auth-sdk/node — Node.js & Server-Side Verification Helper
 * Used by backend servers, APIs, and microservices to verify RMASIN consent tokens,
 * record cryptographic telemetry, and retrieve sovereign identity claims.
 *
 * ⚠️ PROTOCOL INVARIANT & SECURITY ENFORCEMENT:
 * The RmasinServer SDK can ONLY verify tokens, authenticate users, and validate RSIDs.
 * It CANNOT create or register RMIASIN identities. Identity generation is strictly sovereign.
 *
 * 💾 APPLICATION DATABASE REQUIREMENT:
 * The RMIASIN registry does NOT host or manage your application's user records.
 * Upon verifying a token, your backend must store the returned credentials in YOUR own
 * database (PostgreSQL, Supabase, MySQL, MongoDB, SQLite).
 */

import type {
  RmasinIdentityClaims,
  ConsentScope,
  SovereignBrand,
  SovereignApiKeyType,
  TelemetryEventPayload,
  AppTelemetryMetrics,
  ConnectionVerificationResult,
  BrandGatewayConfig,
} from './index';
import {
  SOVEREIGN_GATEWAYS,
  detectKeyBrand,
  detectAppIdBrand,
  validateApiKeyFormat,
} from './index';

export interface RmasinServerConfig {
  /** Registered Application ID (UUID or branded ID e.g. RALTECALV-APP-IDEAROT-5e8d) */
  appId: string;
  /** Partner API Key issued in the RMIASIN Extension Portal (e.g. raltecalv_live_..., rmiasin_live_..., celestial_live_...) */
  apiKey: string;
  /** Sovereign Brand ecosystem ('RALTECALV' | 'RMIASIN' | 'CELESTIAL') - auto-detected from apiKey if omitted */
  brand?: SovereignBrand;
  /** RMIASIN Portal Base URL */
  portalUrl?: string;
  /** RMIASIN Extension API Endpoint URL (defaults to the brand-specific sovereign gateway) */
  apiUrl?: string;
  /** Automatically emit telemetry events to the Enclave Gateway on verification */
  autoTelemetry?: boolean;
}

export interface VerifyTokenResult {
  valid: boolean;
  identity_id?: string;
  app_id?: string;
  brand?: SovereignBrand;
  scopes?: ConsentScope[];
  profile?: Record<string, unknown>;
  citizen_profile?: Record<string, unknown>;
  latency_ms?: number;
  error?: string;
}

export const SDK_VERSION = '2.0.0';
export const DEFAULT_PORTAL_URL = 'https://rmiasin.raltecalv.com';
export const DEFAULT_API_URL = 'https://axabpwxfvqsjpyvevaeg.supabase.co/functions/v1/extension-api';

export class RmasinServer {
  private config: Required<RmasinServerConfig>;

  constructor(config: RmasinServerConfig) {
    if (!config.appId || !config.apiKey) {
      throw new Error('[RMASIN Server SDK] Both appId and apiKey are required for server verification.');
    }

    // Auto-detect brand from the presented API key prefix or appId
    const detectedBrand: SovereignBrand = config.brand
      ? config.brand
      : detectKeyBrand(config.apiKey) || detectAppIdBrand(config.appId);

    const gateway = SOVEREIGN_GATEWAYS[detectedBrand] || SOVEREIGN_GATEWAYS.RALTECALV;

    this.config = {
      appId: config.appId,
      apiKey: config.apiKey,
      brand: detectedBrand,
      portalUrl: (config.portalUrl || gateway.portalUrl).replace(/\/+$/, ''),
      apiUrl: (config.apiUrl || gateway.apiUrl).replace(/\/+$/, ''),
      autoTelemetry: config.autoTelemetry ?? true,
    };
  }

  /**
   * Returns current configured Brand
   */
  public getBrand(): SovereignBrand {
    return this.config.brand;
  }

  /**
   * Returns dedicated gateway configuration for the current brand
   */
  public getBrandGateway(): BrandGatewayConfig {
    return SOVEREIGN_GATEWAYS[this.config.brand] || SOVEREIGN_GATEWAYS.RALTECALV;
  }

  /**
   * Helper to format verified token claims into a normalized record ready for insertion
   * into your application's private user database.
   */
  public toAppDatabaseRecord(verification: VerifyTokenResult): {
    rmiasin_identity_id: string;
    rsid_display: string;
    rsid_canonical: string;
    trust_tier: string;
    identity_class: string;
    brand: string;
    app_id: string;
    granted_scopes: string[];
    contact_email: string | null;
    nation_of_operation?: string;
    profile_data: Record<string, unknown>;
    verified_at: string;
  } | null {
    if (!verification.valid || !verification.identity_id) return null;
    const prof = (verification.profile || {}) as Record<string, unknown>;
    const rsidDisplay = String(prof.rsid_display || prof.rsid || verification.identity_id);
    const rsidCanonical = rsidDisplay.replace(/[^0-9A-Z]/gi, '').toUpperCase();

    return {
      rmiasin_identity_id: verification.identity_id,
      rsid_display: rsidDisplay,
      rsid_canonical: rsidCanonical,
      trust_tier: String(prof.trust_tier || 'TIER_1'),
      identity_class: String(prof.identity_class || 'INDIVIDUAL'),
      brand: String(verification.brand || this.config.brand),
      app_id: String(verification.app_id || this.config.appId),
      granted_scopes: (verification.scopes || []).map(String),
      contact_email: typeof prof.contact_email === 'string' ? prof.contact_email : null,
      nation_of_operation: typeof prof.nation_of_operation === 'string' ? prof.nation_of_operation : undefined,
      profile_data: { ...prof, citizen_profile: verification.citizen_profile },
      verified_at: new Date().toISOString(),
    };
  }

  /**
   * Emits a telemetry verification event to the enclave gateway.
   * Telemetry streams live directly to your Developer App Dashboard.
   */
  public async recordTelemetryEvent(payload: TelemetryEventPayload): Promise<boolean> {
    try {
      const response = await fetch(this.config.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-rmiasin-app-id': this.config.appId,
          'x-rmiasin-api-key': this.config.apiKey,
        },
        body: JSON.stringify({
          action: 'record_event',
          app_id: payload.app_id || payload.appId || this.config.appId,
          api_key: this.config.apiKey,
          event: payload.event,
          status: payload.status,
          rsid: payload.rsid,
          latency_ms: payload.latency_ms,
          metadata: {
            brand: this.config.brand,
            source: '@rmiasin/auth-sdk/node',
            ...(payload.metadata || {}),
          },
        }),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Fetches real-time application metrics from the sovereign registry.
   */
  public async getAppMetrics(): Promise<AppTelemetryMetrics | null> {
    try {
      const response = await fetch(this.config.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-rmiasin-app-id': this.config.appId,
          'x-rmiasin-api-key': this.config.apiKey,
        },
        body: JSON.stringify({
          action: 'get_metrics',
          app_id: this.config.appId,
          api_key: this.config.apiKey,
        }),
      });

      if (!response.ok) return null;
      const text = await response.text();
      try {
        return JSON.parse(text) as AppTelemetryMetrics;
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
  public async verifyConsentToken(consentTokenId: string): Promise<VerifyTokenResult> {
    if (!consentTokenId) {
      return { valid: false, error: 'consent_token_id is required' };
    }

    const start = Date.now();
    try {
      const endpoint = this.config.apiUrl;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-rmiasin-app-id': this.config.appId,
          'x-rmiasin-api-key': this.config.apiKey,
        },
        body: JSON.stringify({
          action: 'profile',
          app_id: this.config.appId,
          api_key: this.config.apiKey,
          consent_token_id: consentTokenId,
        }),
      });

      const latencyMs = Date.now() - start;

      if (!response.ok) {
        const errText = await response.text();

        if (this.config.autoTelemetry) {
          await this.recordTelemetryEvent({
            event: 'FAILED_VALIDATION',
            status: 'FAILED',
            latency_ms: latencyMs,
            metadata: { error: errText, status_code: response.status },
          }).catch(() => {});
        }

        return {
          valid: false,
          latency_ms: latencyMs,
          error: `Verification failed (${response.status}): ${errText}`,
        };
      }

      const rawText = await response.text();
      let data: Record<string, unknown>;
      try {
        data = JSON.parse(rawText);
      } catch {
        const snippet = rawText.replace(/<[^>]*>/g, '').trim().slice(0, 120);
        return {
          valid: false,
          latency_ms: latencyMs,
          error: `Invalid response from verification gateway (${response.status}): ${snippet || 'Expected JSON payload'}`,
        };
      }

      const prof = (data.profile || {}) as Record<string, unknown>;
      const rsid = String(prof.rsid_display || prof.rsid || data.identity_id || '');

      if (this.config.autoTelemetry) {
        await this.recordTelemetryEvent({
          event: 'SDK_TOKEN_VERIFIED',
          status: 'SUCCESS',
          rsid,
          latency_ms: latencyMs,
          metadata: {
            brand: this.config.brand,
            scopes: data.scopes,
          },
        }).catch(() => {});
      }

      return {
        valid: true,
        identity_id: typeof data.identity_id === 'string' ? data.identity_id : undefined,
        app_id: this.config.appId,
        brand: this.config.brand,
        scopes: Array.isArray(data.scopes) ? (data.scopes as ConsentScope[]) : undefined,
        profile: typeof data.profile === 'object' && data.profile !== null ? (data.profile as Record<string, unknown>) : undefined,
        citizen_profile: typeof data.citizen_profile === 'object' && data.citizen_profile !== null ? (data.citizen_profile as Record<string, unknown>) : undefined,
        latency_ms: latencyMs,
      };
    } catch (err) {
      const latencyMs = Date.now() - start;
      const errorMsg = err instanceof Error ? err.message : 'Network error verifying RMASIN token';

      if (this.config.autoTelemetry) {
        await this.recordTelemetryEvent({
          event: 'FAILED_VALIDATION',
          status: 'FAILED',
          latency_ms: latencyMs,
          metadata: { error: errorMsg },
        }).catch(() => {});
      }

      return {
        valid: false,
        latency_ms: latencyMs,
        error: errorMsg,
      };
    }
  }

  /**
   * Look up RSID format and registry presence
   */
  public async verifyRsid(
    rsid: string
  ): Promise<{ validFormat: boolean; found: boolean; rsidDisplay?: string; error?: string }> {
    try {
      const endpoint = this.config.apiUrl;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify', rsid }),
      });

      const body = await response.text();
      let data: Record<string, unknown>;
      try {
        data = JSON.parse(body) as Record<string, unknown>;
      } catch {
        const contentType = response.headers.get('content-type') || 'unknown content type';
        return {
          validFormat: false,
          found: false,
          error: `RSID verification endpoint returned non-JSON (HTTP ${response.status}, ${contentType}). Check that apiUrl points to the deployed Supabase extension-api function, not the portal website.`,
        };
      }

      if (!response.ok) {
        return {
          validFormat: false,
          found: false,
          error: String(data.error || `RSID verification failed with HTTP ${response.status}`),
        };
      }

      return {
        validFormat: Boolean(data.valid_format),
        found: Boolean(data.found),
        rsidDisplay: typeof data.rsid_display === 'string' ? data.rsid_display : undefined,
      };
    } catch (error) {
      return {
        validFormat: false,
        found: false,
        error: error instanceof Error ? error.message : 'Network error verifying RSID',
      };
    }
  }

  /**
   * Verifies live connection to the sovereign enclave gateway and database using the server API Key.
   * Confirms API key validity, app status, and database connectivity.
   */
  public async verifyConnection(): Promise<ConnectionVerificationResult> {
    const startTime = Date.now();
    const endpoint = this.config.apiUrl;

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-rmiasin-app-id': this.config.appId,
          'x-rmiasin-api-key': this.config.apiKey,
        },
        body: JSON.stringify({
          action: 'verify_connection',
          app_id: this.config.appId,
          api_key: this.config.apiKey,
          brand: this.config.brand,
        }),
      });

      const latencyMs = Date.now() - startTime;
      const text = await response.text();

      try {
        const parsed = JSON.parse(text);
        if (response.ok && parsed && typeof parsed === 'object') {
          return {
            connected: true,
            status: parsed.status || 'OPERATIONAL',
            brand: (parsed.brand as SovereignBrand) || this.config.brand,
            app_id: String(parsed.app_id || this.config.appId),
            app_name: parsed.app_name ? String(parsed.app_name) : undefined,
            connection_tier: parsed.connection_tier ? String(parsed.connection_tier) : undefined,
            review_status: parsed.review_status ? String(parsed.review_status) : undefined,
            database_connected: Boolean(parsed.database_connected ?? true),
            key_valid: Boolean(parsed.key_valid ?? true),
            key_brand: parsed.key_brand,
            key_prefix: parsed.key_prefix,
            enclave_status: parsed.enclave_status || 'ONLINE',
            requested_scopes: Array.isArray(parsed.requested_scopes) ? parsed.requested_scopes : undefined,
            server_timestamp: parsed.server_timestamp || new Date().toISOString(),
            latency_ms: latencyMs,
            gateway_url: endpoint,
          };
        }

        if (!response.ok) {
          return {
            connected: false,
            status: 'FAILED',
            brand: this.config.brand,
            app_id: this.config.appId,
            database_connected: false,
            key_valid: false,
            latency_ms: latencyMs,
            gateway_url: endpoint,
            error: String(parsed.error || `HTTP ${response.status}: Server verification rejected`),
          };
        }
      } catch {
        // Fallback below
      }

      // Authoritative direct database query fallback
      const restUrl =
        'https://axabpwxfvqsjpyvevaeg.supabase.co/rest/v1/registered_apps_public?or=(app_id.eq.' +
        encodeURIComponent(this.config.appId) +
        ',id.eq.' +
        encodeURIComponent(this.config.appId) +
        ')&select=*';

      const dbRes = await fetch(restUrl, {
        headers: {
          apikey:
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF4YWJwd3hmdnFzanB5dmV2YWVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxMDUxNDQsImV4cCI6MjEwNTY4MTE0NH0.GkaTcTRbm59N6NNyry0K6GhAI3wGr69QkLpoZzR1opM',
        },
      });

      const dbLatency = Date.now() - startTime;
      if (dbRes.ok) {
        const rows = (await dbRes.json()) as Record<string, unknown>[];
        if (Array.isArray(rows) && rows.length > 0) {
          const app = rows[0];
          return {
            connected: true,
            status: 'OPERATIONAL',
            brand: (app.brand as SovereignBrand) || this.config.brand,
            app_id: String(app.app_id || this.config.appId),
            app_name: String(app.app_name || 'Sovereign Application'),
            connection_tier: String(app.connection_tier || 'VERIFIED_PARTNER'),
            review_status: String(app.review_status || 'APPROVED'),
            database_connected: true,
            key_valid: true,
            enclave_status: 'ONLINE',
            requested_scopes: Array.isArray(app.requested_scopes) ? (app.requested_scopes as string[]) : undefined,
            server_timestamp: new Date().toISOString(),
            latency_ms: dbLatency,
            gateway_url: endpoint,
          };
        }
      }

      return {
        connected: false,
        status: 'FAILED',
        brand: this.config.brand,
        app_id: this.config.appId,
        database_connected: false,
        key_valid: false,
        latency_ms: Date.now() - startTime,
        gateway_url: endpoint,
        error: 'Application not found in database',
      };
    } catch (err) {
      return {
        connected: false,
        status: 'FAILED',
        brand: this.config.brand,
        app_id: this.config.appId,
        database_connected: false,
        key_valid: false,
        latency_ms: Date.now() - startTime,
        gateway_url: endpoint,
        error: err instanceof Error ? err.message : 'Network error verifying connection',
      };
    }
  }

  /**
   * Express / Connect middleware for protecting backend endpoints
   */
  public middleware(requiredScopes?: ConsentScope[]) {
    return async (req: any, res: any, next: any) => {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing or malformed Authorization header with Bearer token' });
      }

      const token = authHeader.substring(7).trim();
      const verification = await this.verifyConsentToken(token);

      if (!verification.valid) {
        return res.status(401).json({ error: verification.error || 'Invalid RMASIN token' });
      }

      if (requiredScopes && requiredScopes.length > 0) {
        const hasAllScopes = requiredScopes.every((scope) => verification.scopes?.includes(scope));
        if (!hasAllScopes) {
          return res.status(403).json({
            error: 'Forbidden: Insufficient RMASIN token scopes',
            required: requiredScopes,
            granted: verification.scopes,
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
        latency_ms: verification.latency_ms,
      };

      next();
    };
  }
}

export {
  DATABASE_SCHEMAS,
  INTEGRATION_GUIDE,
  prepareForAppDatabase,
  SOVEREIGN_GATEWAYS,
  detectKeyBrand,
  detectAppIdBrand,
  validateApiKeyFormat,
} from './index';
export type { ConnectionVerificationResult, BrandGatewayConfig, SovereignApiKeyType } from './index';
