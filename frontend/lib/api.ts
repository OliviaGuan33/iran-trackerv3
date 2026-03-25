import {
  BriefingResponse,
  LiveResponse,
  MarketsResponse,
  OverviewData,
  TrackingResponse,
} from './types';

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE || 'http://127.0.0.1:8000')
  .trim()
  .replace(/\/+$/, '');

async function request<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Request failed: ${path}`);
  return response.json() as Promise<T>;
}

export const getOverview = () => request<OverviewData>('/api/overview');
export const getMarkets = () => request<MarketsResponse>('/api/markets/latest');
export const getBriefing = () => request<BriefingResponse>('/api/briefing/today');
export const getTracking = () => request<TrackingResponse>('/api/tracking/status');
export const getLive = () => request<LiveResponse>('/api/live/latest');
export const liveStreamUrl = `${API_BASE}/api/live/stream`;
