const stripTrailingSlash = (value?: string) => {
  if (!value) return '';
  return value.replace(/\/+$/, '');
};

const DEFAULT_HTTP_BASE = 'http://localhost:3001';
const DEFAULT_WS_BASE = 'ws://localhost:3001';

const getBrowserProtocol = () => {
  if (typeof window === 'undefined') return { http: 'http:', ws: 'ws:' };
  const isSecure = window.location.protocol === 'https:';
  return {
    http: isSecure ? 'https:' : 'http:',
    ws: isSecure ? 'wss:' : 'ws:',
  };
};

const getBrowserHost = () => {
  if (typeof window === 'undefined') return 'localhost';
  return window.location.hostname || 'localhost';
};

const { http: browserHttpProtocol, ws: browserWsProtocol } = getBrowserProtocol();
const browserHost = getBrowserHost();

const envHttpBase = stripTrailingSlash(import.meta.env.VITE_BACKEND_HTTP_BASE);
const envApiBase = stripTrailingSlash(import.meta.env.VITE_API_BASE_URL);
const envRealtimeWsBase = stripTrailingSlash(import.meta.env.VITE_REALTIME_WS_BASE);
const envCollabServer = stripTrailingSlash(import.meta.env.VITE_COLLAB_SERVER_URL);

const httpBase = envHttpBase || `${browserHttpProtocol}//${browserHost}:3001` || DEFAULT_HTTP_BASE;
const apiBase = envApiBase || `${httpBase}/api`;

const fallbackWsBases = [
  `${browserWsProtocol}//${browserHost}:3001`,
  `${browserWsProtocol}//localhost:3001`,
  `${browserWsProtocol}//127.0.0.1:3001`,
  DEFAULT_WS_BASE,
];

const realtimeWsBases = Array.from(
  new Set([
    ...(envRealtimeWsBase ? [envRealtimeWsBase] : []),
    ...fallbackWsBases.map(stripTrailingSlash),
  ])
).filter(Boolean);

const primaryWsBase = realtimeWsBases[0] || DEFAULT_WS_BASE;

const withPath = (base: string, path: string) => {
  const normalizedBase = stripTrailingSlash(base);
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
};

const withQuery = (url: string, query?: string) => {
  if (!query) return url;
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}${query}`;
};

export const API_BASE_URL = apiBase;
export const REALTIME_WS_BASE = primaryWsBase;
export const COLLAB_SERVER_URL = envCollabServer || withPath(primaryWsBase, '/collab');

export const buildRealtimeWsCandidates = (path: string, query?: string): string[] => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const suffix = query ? `?${query}` : '';

  return Array.from(
    new Set(
      realtimeWsBases.map((base) => `${stripTrailingSlash(base)}${normalizedPath}${suffix}`)
    )
  );
};

export const buildApiUrl = (path: string) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${apiBase}${normalizedPath}`;
};
