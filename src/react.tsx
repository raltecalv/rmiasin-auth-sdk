import React, { useState, useEffect, useCallback } from 'react';
import {
  RmasinClient,
  type RmasinConfig,
  type RmasinAuthResponse,
  type LoginOptions,
  type ConsentScope,
  type SovereignBrand,
  type TelemetryEventPayload,
  type AppTelemetryMetrics,
  type ConnectionVerificationResult,
} from './index';

export interface UseRmasinAuthOptions extends RmasinConfig {}

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

export function useRmasinAuth(config: UseRmasinAuthOptions): UseRmasinAuthReturn {
  const [client] = useState(() => new RmasinClient(config));
  const [session, setSession] = useState<RmasinAuthResponse | null>(() => client.getSession());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const current = client.getSession();
    setSession(current);
  }, [client]);

  const loginWithPopup = useCallback(
    async (options?: LoginOptions) => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await client.loginWithPopup(options);
        setSession(result);
        return result;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Login failed';
        setError(msg);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [client]
  );

  const loginWithRedirect = useCallback(
    (options?: LoginOptions) => {
      client.loginWithRedirect(options);
    },
    [client]
  );

  const logout = useCallback(() => {
    client.logout();
    setSession(null);
    setError(null);
  }, [client]);

  const recordTelemetryEvent = useCallback(
    (payload: TelemetryEventPayload) => {
      return client.recordEvent(payload);
    },
    [client]
  );

  const getMetrics = useCallback(() => {
    return client.getMetrics();
  }, [client]);

  const verifyConnection = useCallback(
    (apiKey?: string) => {
      return client.verifyConnection(apiKey);
    },
    [client]
  );

  return {
    client,
    session,
    user: session?.identity ?? null,
    isAuthenticated: Boolean(session),
    isLoading,
    error,
    brand: client.getBrand(),
    loginWithPopup,
    loginWithRedirect,
    logout,
    verifyConnection,
    recordTelemetryEvent,
    getMetrics,
  };
}

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

export const RmasinLoginButton: React.FC<RmasinLoginButtonProps> = ({
  appId,
  brand,
  portalUrl,
  apiUrl,
  scopes = ['identity.rsid_only', 'trust_tier.read'],
  onSuccess,
  onError,
  theme = 'sovereign-dark',
  size = 'md',
  mode = 'popup',
  className = '',
  label,
  showIcon = true,
}) => {
  const { loginWithPopup, loginWithRedirect, isLoading } = useRmasinAuth({
    appId,
    brand,
    portalUrl,
    apiUrl,
    scopes,
  });

  const handleClick = async () => {
    if (isLoading) return;
    try {
      if (mode === 'popup') {
        const result = await loginWithPopup();
        onSuccess?.(result);
      } else {
        loginWithRedirect();
      }
    } catch (err) {
      onError?.(err instanceof Error ? err : new Error(String(err)));
    }
  };

  const themeStyles = {
    'sovereign-dark': {
      backgroundColor: '#0a0d0c',
      color: '#e4ebe6',
      border: '1px solid #23352b',
      boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
    },
    terracotta: {
      backgroundColor: '#cf5a36',
      color: '#ffffff',
      border: '1px solid #b34a29',
      boxShadow: '0 2px 6px rgba(207, 90, 54, 0.3)',
    },
    verdigris: {
      backgroundColor: '#1c7c64',
      color: '#ffffff',
      border: '1px solid #135d4a',
      boxShadow: '0 2px 6px rgba(28, 124, 100, 0.3)',
    },
    'minimal-light': {
      backgroundColor: '#f5f7f6',
      color: '#131c17',
      border: '1px solid #cbd5cf',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    },
    'raltecalv-gold': {
      backgroundColor: '#18140c',
      color: '#fbbf24',
      border: '1px solid #92400e',
      boxShadow: '0 2px 6px rgba(217, 119, 6, 0.2)',
    },
    'celestial-blue': {
      backgroundColor: '#0c1726',
      color: '#60a5fa',
      border: '1px solid #1e3a8a',
      boxShadow: '0 2px 6px rgba(37, 99, 235, 0.2)',
    },
  }[theme];

  const sizeStyles = {
    sm: { padding: '6px 12px', fontSize: '11px', height: '32px' },
    md: { padding: '10px 18px', fontSize: '13px', height: '42px' },
    lg: { padding: '14px 24px', fontSize: '15px', height: '50px' },
  }[size];

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isLoading}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        fontWeight: 600,
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
        borderRadius: '2px',
        cursor: isLoading ? 'wait' : 'pointer',
        transition: 'all 0.15s ease-in-out',
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        opacity: isLoading ? 0.7 : 1,
        ...themeStyles,
        ...sizeStyles,
      }}
      className={`rmasin-login-btn ${className}`}
    >
      {showIcon && (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ flexShrink: 0 }}
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      )}
      <span>{isLoading ? 'Verifying Key…' : label || 'Log in with RMASIN'}</span>
    </button>
  );
};

export { DATABASE_SCHEMAS, INTEGRATION_GUIDE, prepareForAppDatabase } from './index';
