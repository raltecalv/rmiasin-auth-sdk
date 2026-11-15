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
import type { ConsentScope, SovereignBrand, TelemetryEventPayload, AppTelemetryMetrics, ConnectionVerificationResult, BrandGatewayConfig } from './index';
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
export declare const SDK_VERSION = "2.0.0";
export declare const DEFAULT_PORTAL_URL = "https://rmiasin.raltecalv.com";
export declare const DEFAULT_API_URL = "https://axabpwxfvqsjpyvevaeg.supabase.co/functions/v1/extension-api";
export declare class RmasinServer {
    private config;
    constructor(config: RmasinServerConfig);
    /**
     * Returns current configured Brand
     */
    getBrand(): SovereignBrand;
    /**
     * Returns dedicated gateway configuration for the current brand
     */
    getBrandGateway(): BrandGatewayConfig;
    /**
     * Helper to format verified token claims into a normalized record ready for insertion
     * into your application's private user database.
     */
    toAppDatabaseRecord(verification: VerifyTokenResult): {
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
    } | null;
    /**
     * Emits a telemetry verification event to the enclave gateway.
     * Telemetry streams live directly to your Developer App Dashboard.
     */
    recordTelemetryEvent(payload: TelemetryEventPayload): Promise<boolean>;
    /**
     * Fetches real-time application metrics from the sovereign registry.
     */
    getAppMetrics(): Promise<AppTelemetryMetrics | null>;
    /**
     * Verifies a client-presented consent token with the RMIASIN Extension API.
     * Measures latency and automatically streams telemetry to the Developer App Dashboard.
     */
    verifyConsentToken(consentTokenId: string): Promise<VerifyTokenResult>;
    /**
     * Look up RSID format and registry presence
     */
    verifyRsid(rsid: string): Promise<{
        validFormat: boolean;
        found: boolean;
        rsidDisplay?: string;
        error?: string;
    }>;
    /**
     * Verifies live connection to the sovereign enclave gateway and database using the server API Key.
     * Confirms API key validity, app status, and database connectivity.
     */
    verifyConnection(): Promise<ConnectionVerificationResult>;
    /**
     * Express / Connect middleware for protecting backend endpoints
     */
    middleware(requiredScopes?: ConsentScope[]): (req: any, res: any, next: any) => Promise<any>;
}
export { DATABASE_SCHEMAS, INTEGRATION_GUIDE, prepareForAppDatabase, SOVEREIGN_GATEWAYS, detectKeyBrand, detectAppIdBrand, validateApiKeyFormat, } from './index';
export type { ConnectionVerificationResult, BrandGatewayConfig, SovereignApiKeyType } from './index';
//# sourceMappingURL=node.d.ts.map