'use client';

import { useEffect, useState } from 'react';
import { ErrorBlock } from '../../components/error';
import { LoadingBlock } from '../../components/loading';
import { Sparkline } from '../../components/sparkline';
import { getTracking } from '../../lib/api';
import { TrackingResponse } from '../../lib/types';

export default function TrackingPage() {
  const [data, setData] = useState<TrackingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const result = await getTracking();
        if (!mounted) return;
        setData(result);
        setError(false);
      } catch {
        if (!mounted) return;
        setError(true);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    const timer = window.setInterval(load, 45000);
    return () => {
      mounted = false;
      window.clearInterval(timer);
    };
  }, []);

  if (loading) return <LoadingBlock label="正在加载海峡跟踪..." />;
  if (error || !data) return <ErrorBlock />;

  return (
    <div className="grid">
      <section className="card span-12"><div className="badge">更新时间 {data.updated_at}</div><h1>海峡跟踪</h1></section>
      <section className="card span-3"><div className="muted">当前状态</div><div className="kpi">{data.status}</div></section>
      <section className="card span-3"><div className="muted">当日通行量</div><div className="kpi">{data.transit_count}</div></section>
      <section className="card span-3"><div className="muted">滞留船舶</div><div className="kpi">{data.waiting_vessels}</div></section>
      <section className="card span-3"><div className="muted">保险状态</div><div className="kpi">{data.insurance}</div></section>
      <section className="card span-7"><h2 className="section-title">过去 48 小时</h2><div className="list compact">{data.last_48h.map((text) => <div className="item" key={text}>{text}</div>)}</div></section>
      <section className="card span-5"><h2 className="section-title">近 7 日通行趋势</h2><Sparkline values={data.history} /></section>
      <section className="card span-12"><h2 className="section-title">主要航运公司状态</h2><div className="list">{data.companies.map((text) => <div className="item" key={text}>{text}</div>)}</div></section>
    </div>
  );
}
