export type MarketItem = {
  symbol: string;
  price: number;
  pct_change: number;
  history: number[];
};

export type OverviewData = {
  title: string;
  subtitle: string;
  updated_at: string;
  risk_level: string;
  risk_note: string;
  kpis: { label: string; value: string; change: string }[];
  map_notes: string[];
  country_cards: { name: string; reserve: string; output: string; export: string }[];
  routes: { name: string; capacity: string; status: string }[];
  disclaimer: string;
};

export type MarketsResponse = {
  updated_at: string;
  source?: string;
  is_live?: boolean;
  error?: string;
  items: MarketItem[];
};

export type BriefingResponse = {
  title: string;
  updated_at: string;
  summary: string;
  bullets: string[];
  timeline: string[];
  market_impacts: string[];
  watchlist: string[];
};

export type TrackingResponse = {
  updated_at: string;
  status: string;
  transit_count: number;
  waiting_vessels: number;
  insurance: string;
  last_48h: string[];
  companies: string[];
  history: number[];
};

export type LiveItem = { time: string; tag: string; text: string };
export type LiveResponse = { updated_at: string; items: LiveItem[] };
