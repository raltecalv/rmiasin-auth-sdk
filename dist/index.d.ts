/**
 * @rmiasin/auth-sdk — Core Browser & Universal SDK
 * Official SDK for "Log In with RMASIN" sovereign identity authentication.
 * Schema Version 0300 · Raltécalv Sovereign Foundation
 *
 * ⚠️ PROTOCOL INVARIANT & SECURITY ENFORCEMENT:
 * This SDK is strictly an Authentication and Authorization (Single Sign-On / SSO) client.
 * By protocol design, this SDK CANNOT create, mint, forge, issue, or register RMIASIN identities.
 * Identity registration is exclusively governed by the sovereign enclave and foundation adjudicators.
 *
 * 💾 APPLICATION DATABASE SEPARATION:
 * The sovereign RMIASIN registry does NOT store or manage consumer application user tables.
 * Applications integrating this SDK are responsible for storing fetched user credentials
 * (identity_id, rsid_display, trust_tier, session token) in their OWN separate database
 * (e.g. PostgreSQL, Supabase, MySQL, MongoDB, SQLite).
 */
export declare const SDK_VERSION = "2.0.0";
export declare const PROTOCOL_VERSION = "2.0.0";
export declare const OFFICIAL_PORTAL_URL = "https://rmiasin.raltecalv.com";
export type SovereignBrand = 'RALTECALV' | 'RMIASIN' | 'CELESTIAL';
export type SovereignApiKeyType = 'RALTECALV_LIVE' | 'RMIASIN_LIVE' | 'CELESTIAL_LIVE' | 'RALTECALV_TEST' | 'RMIASIN_TEST' | 'CELESTIAL_TEST';
/**
 * Dedicated Gateway and URL configuration per Sovereign Brand.
 * Each of the 3 API Secret Key types operates with its own brand namespace,
 * key prefix, and dedicated extension API gateway endpoint.
 */
export interface BrandGatewayConfig {
    brand: SovereignBrand;
    name: string;
    apiUrl: string;
    portalUrl: string;
    keyPrefix: string;
    testKeyPrefix: string;
    appIdPrefix: string;
    description: string;
}
export declare const SOVEREIGN_GATEWAYS: Record<SovereignBrand, BrandGatewayConfig>;
/**
 * Automatically detects the Sovereign Brand from an API Secret Key's prefix.
 */
export declare function detectKeyBrand(apiKey: string): SovereignBrand;
/**
 * Automatically detects the Sovereign Brand from an App ID prefix.
 */
export declare function detectAppIdBrand(appId: string): SovereignBrand;
/**
 * Validates the format and brand namespace of any presented sovereign API key.
 */
export declare function validateApiKeyFormat(apiKey: string, expectedBrand?: SovereignBrand): {
    valid: boolean;
    brand: SovereignBrand;
    keyType: SovereignApiKeyType;
    prefix: string;
    error?: string;
};
/**
 * Result returned when verifying gateway and database connection.
 */
export interface ConnectionVerificationResult {
    connected: boolean;
    status: 'OPERATIONAL' | 'DEGRADED' | 'FAILED' | string;
    brand: SovereignBrand;
    app_id: string;
    app_name?: string;
    connection_tier?: string;
    review_status?: string;
    database_connected: boolean;
    key_valid: boolean;
    key_brand?: SovereignBrand;
    key_prefix?: string;
    enclave_status?: string;
    requested_scopes?: string[];
    server_timestamp?: string;
    latency_ms: number;
    gateway_url: string;
    error?: string;
}
export type StandardConsentScope = 'identity.rsid_only' | 'trust_tier.read' | 'geography.country_only' | 'contact.email_only' | 'citizen_profile.read' | 'rchain.address.derive' | 'telemetry.events.write' | 'enclave.proof.verify';
export type ConsentScope = StandardConsentScope | string;
export interface RmasinConfig {
    /** Registered App ID (UUID or branded string e.g. RALTECALV-APP-IDEAROT-5e8d) */
    appId: string;
    /** Sovereign Brand ecosystem ('RALTECALV' | 'RMIASIN' | 'CELESTIAL') */
    brand?: SovereignBrand;
    /** Optional Portal Origin (defaults to official sovereign portal: https://rmiasin.raltecalv.com) */
    portalUrl?: string;
    /** Optional API Gateway Origin (defaults to brand's specific gateway URL) */
    apiUrl?: string;
    /** Redirect URI registered for the application */
    redirectUri?: string;
    /** Default requested scopes */
    scopes?: ConsentScope[];
    /** Storage key prefix for sessions */
    storagePrefix?: string;
}
export interface RmasinIdentityClaims {
    /** Immutable sovereign identity identifier */
    identity_id: string;
    /** Formatted Crockford Base32 RSID display string (e.g. RAL-7K2M-9XQP-4481) */
    rsid_display: string;
    /** Canonical Crockford Base32 RSID string (e.g. RAL7K2M9XQP4481) */
    rsid_canonical: string;
    /** Sovereign Identity Class */
    identity_class: 'INDIVIDUAL' | 'INSTITUTION' | 'ASSET' | 'DEVICE' | 'NPC' | 'AI_AGENT' | 'CITIZEN' | string;
    /** Verified Trust Tier */
    trust_tier: 'TIER_1' | 'TIER_2' | 'TIER_3' | 'TIER_4' | string;
    /** Brand authority associated with the verification */
    brand?: SovereignBrand;
    /** Application ID authenticated against */
    app_id?: string;
    /** Optional sovereign country or nation of operation */
    nation_of_operation?: string;
    /** Primary contact email if requested and consented */
    contact_email?: string | null;
    /** Public profile claims if citizen_profile.read consented */
    citizen_profile?: Record<string, unknown>;
    /** Whether the Crockford Base32 checksum was verified by the enclave */
    checksum_verified: boolean;
    /** Unix timestamp in milliseconds when verification was issued */
    issued_at: number;
    /** Unix timestamp in milliseconds when verification expires */
    expires_at: number;
}
export interface RmasinAuthResponse {
    /** Sovereign Bearer authentication token */
    token: string;
    /** Unique reference ID of the active consent grant */
    consent_token_id?: string;
    /** Cryptographic sovereign identity claims */
    identity: RmasinIdentityClaims;
    /** List of scopes granted by the user */
    scopes: ConsentScope[];
    /** Ecosystem brand */
    brand?: SovereignBrand;
    /** Authenticated application ID */
    app_id?: string;
    /** Token lifespan in seconds */
    expires_in: number;
}
/**
 * Standard user model for storage in external application databases.
 * Application developers must store fetched user credentials in their OWN
 * database (PostgreSQL, Supabase, SQLite, MongoDB, etc.), isolated from the
 * sovereign RMIASIN registry.
 */
export interface RmasinAppStoredUser {
    /** Sovereign RMIASIN internal identity ID */
    rmiasin_identity_id: string;
    /** Formatted Crockford Base32 RSID display string (e.g. RAL-7K2M-9XQP-4481) */
    rsid_display: string;
    /** Canonical Crockford Base32 RSID string (e.g. RAL7K2M9XQP4481) */
    rsid_canonical: string;
    /** Verified Trust Tier (TIER_1 | TIER_2 | TIER_3 | TIER_4) */
    trust_tier: string;
    /** Identity class (INDIVIDUAL | INSTITUTION | ASSET | CITIZEN | etc.) */
    identity_class: string;
    /** Active session/consent token issued for the app */
    session_token: string;
    /** Consent token reference ID */
    consent_token_id?: string;
    /** Brand ecosystem */
    brand?: string;
    /** Application ID */
    app_id?: string;
    /** Scopes granted by the user to this application */
    granted_scopes: string[];
    /** Optional email if requested and consented */
    contact_email?: string | null;
    /** Optional sovereign country/nation of operation */
    nation_of_operation?: string;
    /** Timestamp when user credentials were authenticated and stored */
    authenticated_at: string;
    /** Expiration timestamp of the authentication grant */
    expires_at: string;
}
export interface TelemetryEventPayload {
    app_id?: string;
    appId?: string;
    event: 'SDK_TOKEN_VERIFIED' | 'CONSENT_GRANTED' | 'APP_SESSION_REFRESHED' | 'FAILED_VALIDATION' | 'API_RATE_LIMIT_CHECK' | 'SDK_PLAYGROUND_AUTH_TEST' | string;
    status: 'SUCCESS' | 'FAILED' | 'CHALLENGE' | 'RATE_LIMITED' | string;
    rsid?: string;
    latency_ms?: number;
    metadata?: Record<string, unknown>;
}
export interface AppTelemetryMetrics {
    app_id: string;
    brand?: string;
    total_authentications: number;
    active_grants: number;
    avg_response_time_ms: number;
    failed_validations: number;
    verified_integrity_rate: number;
    recent_events?: Array<{
        event: string;
        status: string;
        rsid: string;
        time: string;
        timestamp?: number;
        latency_ms?: number;
        metadata?: Record<string, unknown>;
    }>;
    events?: Array<Record<string, unknown>>;
}
/**
 * Helper to prepare credentials fetched from RMASIN for persistence in your application's database.
 * The sovereign RMIASIN registry does not host your app's user records; you must save this payload
 * to your application's user table (e.g. db.users.upsert(...)).
 */
export declare function prepareForAppDatabase(auth: RmasinAuthResponse): RmasinAppStoredUser;
export interface LoginOptions {
    scopes?: ConsentScope[];
    redirectUri?: string;
    state?: string;
    brand?: SovereignBrand;
    prompt?: 'consent' | 'select_account';
    popup?: boolean;
    popupWidth?: number;
    popupHeight?: number;
}
export declare const DEFAULT_PORTAL_URL = "https://rmiasin.raltecalv.com";
export declare const DEFAULT_API_URL = "https://axabpwxfvqsjpyvevaeg.supabase.co/functions/v1/extension-api";
export declare class RmasinClient {
    private config;
    constructor(config: RmasinConfig);
    /**
     * Returns the dedicated gateway configuration for the current brand
     */
    getBrandGateway(): BrandGatewayConfig;
    /**
     * Returns current configured Brand
     */
    getBrand(): SovereignBrand;
    /**
     * Returns current configured App ID
     */
    getAppId(): string;
    /**
     * Generates a cryptographic state and PKCE verifier for secure OAuth flow
     */
    generatePkcePair(): {
        verifier: string;
        challenge: string;
    };
    /**
     * Constructs the Sovereign Authentication URL for RMASIN
     */
    getAuthUrl(options?: LoginOptions): {
        url: string;
        state: string;
        verifier: string;
    };
    /**
     * Initiate "Log In with RMASIN" via a secure browser popup window
     */
    loginWithPopup(options?: LoginOptions): Promise<RmasinAuthResponse>;
    /**
     * Redirect user to RMASIN Sovereign Consent Portal
     */
    loginWithRedirect(options?: LoginOptions): void;
    /**
     * Parse code and state from redirect URL callback
     */
    handleRedirectCallback(): {
        code: string | null;
        state: string | null;
        error: string | null;
    };
    /**
     * Emits a telemetry or verification event directly to the app dashboard stream
     */
    recordEvent(event: TelemetryEventPayload): Promise<boolean>;
    /**
     * Fetches real-time telemetry metrics for this registered application directly from the database
     */
    getMetrics(): Promise<AppTelemetryMetrics | null>;
    /**
     * Verifies live connection to the sovereign enclave gateway and database.
     * Tests API key validity, database connectivity, and registered app status.
     */
    verifyConnection(apiKey?: string): Promise<ConnectionVerificationResult>;
    /**
     * Save session to localStorage
     */
    saveSession(response: RmasinAuthResponse): void;
    /**
     * Get active authenticated session if present and not expired
     */
    getSession(): RmasinAuthResponse | null;
    /**
     * Clear local session
     */
    logout(): void;
}
/**
 * Universal RSID validator helper (Crockford Base32 16-character format)
 */
export declare function validateRsidFormat(rsid: string): boolean;
/**
 * Authoritative Application Database Schemas for persisting authenticated RMIASIN users.
 * The RMIASIN sovereign network enforces strict application database separation:
 * applications must store citizen credentials in their OWN private database.
 */
export declare const DATABASE_SCHEMAS: {
    /**
     * PostgreSQL / Supabase SQL Table Definition
     */
    postgres: string;
    /**
     * Prisma ORM Model Definition (schema.prisma)
     */
    prisma: string;
    /**
     * Drizzle ORM Schema Definition (TypeScript)
     */
    drizzle: string;
    /**
     * Mongoose / MongoDB Schema Definition
     */
    mongodb: string;
};
/**
 * Step-by-Step Developer Integration Guide for adding Log In with RMASIN into external apps
 */
export declare const INTEGRATION_GUIDE: {
    title: string;
    version: string;
    portal_url: string;
    steps: ({
        step: number;
        name: string;
        description: string;
        notes: string;
        command?: undefined;
        example?: undefined;
    } | {
        step: number;
        name: string;
        description: string;
        command: string;
        notes?: undefined;
        example?: undefined;
    } | {
        step: number;
        name: string;
        description: string;
        example: string;
        notes?: undefined;
        command?: undefined;
    } | {
        step: number;
        name: string;
        description: string;
        notes?: undefined;
        command?: undefined;
        example?: undefined;
    })[];
};
//# sourceMappingURL=index.d.ts.map