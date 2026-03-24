'use client';

import { useEffect, useMemo, useState } from 'react';
import { ErrorBlock } from '../../components/error';
import { LoadingBlock } from '../../components/loading';
import { getLive, liveStreamUrl } from '../../lib/api';
import { LiveItem, MarketItem } from '../../lib/types';

type StreamPayload = {
  ts: string;
  live: LiveItem[];
  markets: MarketItem[];
};

export default function LivePage() {
  const [items, setItems] = useState<LiveItem[]>([]);
  const [markets, setMarkets] = useState<MarketItem[]>([]);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    const source = new EventSource(liveStreamUrl);
    source.onopen = () => {
      if (!active) return;
      setConnected(true);
      setError(false);
      setLoading(false);
    };
    source.onmessage = (event) => {
      if (!active) return;
      const payload = JSON.parse(event.data) as StreamPayload;
      setItems(payload.live);
      setMarkets(payload.markets);
    };
    source.onerror = async () => {
      if (!active) return;
      setConnected(false);
      try {
        const fallback = await getLive();
        if (!active) return;
        setItems(fallback.items);
        setError(false);
      } catch {
        if (active) setError(true);
      } finally {
        if (active) setLoading(false);
      }
    };
    return () => { active = false; source.close(); };
  }, []);

  const topLine = useMemo(() => {
    if (!markets.length) return '等待行情流...';
    return markets.map((item) => `${item.symbol} ${item.price} (${item.pct_change > 0 ? '+' : ''}${item.pct_change}%)`).join(' · ');
  }, [markets]);

  if (loading) return <LoadingBlock label="正在连接实时流..." />;
  if (error) return <ErrorBlock label="实时流连接失败，请检查后端 SSE 是否启动。" />;

  return (
    <div className="grid">
      <section className="card span-12"><div className="row-between"><h1>实时更新</h1><div className={connected ? 'badge status-ok' : 'badge'}>{connected ? 'SSE 已连接' : '轮询模式'}</div></div><p className="muted">{topLine}</p></section>
      <section className="card span-12"><div className="list">{items.map((item) => <div className="item live-item" key={`${item.time}-${item.tag}-${item.text}`}><div className="row-gap"><strong>{item.time}</strong><span className="badge">{item.tag}</span></div><div style={{ marginTop: 10 }}>{item.text}</div></div>)}</div></section>
    </div>
  );
}
