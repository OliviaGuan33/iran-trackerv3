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

export type AuthUser = {
  username: string;
  created_at: string;
};

export type AuthResponse = {
  user: AuthUser;
  access_token: string;
  token_type: string;
};

export type DatabaseSheet = {
  name: string;
  chart_count: number;
};

export type IndicatorItem = {
  industry: string;
  sequence: string | number | null;
  name: string;
  indicator_id: string | number | null;
  latest_status: string | null;
  latest_window: string | null;
  frequency: string | null;
  direction: string | null;
  previous_date: string | null;
  magnitude: string | null;
  threshold: string | number | null;
  latest_date: string | null;
  source: string | null;
};

export type DatabaseOverview = {
  workbook_name: string;
  workbook_path: string;
  updated_at: string;
  indicator_count: number;
  industry_count: number;
  sheet_count: number;
  sheets: DatabaseSheet[];
  highlights: IndicatorItem[];
};

export type ChartSeries = {
  name: string;
  values: Array<number | null>;
  last_value: number;
  min: number;
  max: number;
};

export type DatabaseChart = {
  id: string;
  sheet: string;
  title: string;
  source?: string | null;
  x_axis_label: string;
  series_count: number;
  point_count: number;
  point_count_total?: number;
  x_values: Array<string | null>;
  series: ChartSeries[];
  latest_values: Record<string, number>;
};

export type DatabaseChartsResponse = {
  sheet: string | null;
  charts: DatabaseChart[];
};
