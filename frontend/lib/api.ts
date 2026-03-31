import {
  AuthResponse,
  BriefingResponse,
  DatabaseChartsResponse,
  DatabaseOverview,
  LiveResponse,
  MarketsResponse,
  OverviewData,
  TrackingResponse,
} from './types';

export const API_BASE = (process.env.NEXT_PUBLIC_API_BASE || 'http://127.0.0.1:8000')
  .trim()
  .replace(/\/+$/, '');

type RequestOptions = RequestInit & {
  token?: string | null;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { token, headers, ...init } = options;
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers || {}),
    },
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${path}`);
  }

  return response.json() as Promise<T>;
}

export const getOverview = () => request<OverviewData>('/api/overview');
export const getMarkets = () => request<MarketsResponse>('/api/markets/latest');
export const getBriefing = () => request<BriefingResponse>('/api/briefing/today');
export const getTracking = () => request<TrackingResponse>('/api/tracking/status');
export const getLive = () => request<LiveResponse>('/api/live/latest');
export const liveStreamUrl = `${API_BASE}/api/live/stream`;

export const registerUser = (username: string, password: string) =>
  request<AuthResponse>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });

export const loginUser = (username: string, password: string) =>
  request<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });

export const getDatabaseOverview = (token: string) =>
  request<DatabaseOverview>('/api/database/overview', { token });

export const getDatabaseCharts = (token: string, sheet: string, pointLimit = 160) =>
  request<DatabaseChartsResponse>(
    `/api/database/charts?sheet=${encodeURIComponent(sheet)}&point_limit=${pointLimit}`,
    { token },
  );
