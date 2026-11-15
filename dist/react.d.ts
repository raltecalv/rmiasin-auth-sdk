import React from 'react';
import { RmasinClient, type RmasinConfig, type RmasinAuthResponse, type LoginOptions, type ConsentScope, type SovereignBrand, type TelemetryEventPayload, type AppTelemetryMetrics, type ConnectionVerificationResult } from './index';
export interface UseRmasinAuthOptions extends RmasinConfig {
}
export interface UseRmasinAuthReturn {
    client: RmasinClient;
    session: RmasinAuthResponse | null;
    user: RmasinAuthResponse['identity'] | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
    brand: SovereignBrand;
    loginWithPopup: (options?: LoginOptions) => Promise<RmasinAuthResponse>;
    loginWithRedirect: (options?: LoginOptions) => void;
    logout: () => void;
    verifyConnection: (apiKey?: string) => Promise<ConnectionVerificationResult>;
    recordTelemetryEvent: (payload: TelemetryEventPayload) => Promise<boolean>;
    getMetrics: () => Promise<AppTelemetryMetrics | null>;
}
export declare function useRmasinAuth(config: UseRmasinAuthOptions): UseRmasinAuthReturn;
export interface RmasinLoginButtonProps {
    appId: string;
    brand?: SovereignBrand;
    portalUrl?: string;
    apiUrl?: string;
    scopes?: ConsentScope[];
    onSuccess?: (auth: RmasinAuthResponse) => void;
    onError?: (error: Error) => void;
    theme?: 'sovereign-dark' | 'terracotta' | 'verdigris' | 'minimal-light' | 'raltecalv-gold' | 'celestial-blue';
    size?: 'sm' | 'md' | 'lg';
    mode?: 'popup' | 'redirect';
    className?: string;
    label?: string;
    showIcon?: boolean;
}
export declare const RmasinLoginButton: React.FC<RmasinLoginButtonProps>;
export { DATABASE_SCHEMAS, INTEGRATION_GUIDE, prepareForAppDatabase } from './index';
//# sourceMappingURL=react.d.ts.map