'use client';

import { useEffect, useState } from 'react';
import { ErrorBlock } from '../../components/error';
import { LoadingBlock } from '../../components/loading';
import { getBriefing } from '../../lib/api';
import { BriefingResponse } from '../../lib/types';

export default function BriefingPage() {
  const [data, setData] = useState<BriefingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const result = await getBriefing();
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
    const timer = window.setInterval(load, 60000);
    return () => {
      mounted = false;
      window.clearInterval(timer);
    };
  }, []);

  if (loading) return <LoadingBlock label="正在加载每日简报..." />;
  if (error || !data) return <ErrorBlock />;

  return (
    <div className="grid">
      <section className="card span-12">
        <div className="badge">更新时间 {data.updated_at}</div>
        <h1>{data.title}</h1>
        <p className="muted">{data.summary}</p>
      </section>
      <section className="card span-4"><h2 className="section-title">核心结论</h2><div className="list">{data.bullets.map((text) => <div className="item" key={text}>{text}</div>)}</div></section>
      <section className="card span-4"><h2 className="section-title">关键时间线</h2><div className="list">{data.timeline.map((text) => <div className="item" key={text}>{text}</div>)}</div></section>
      <section className="card span-4"><h2 className="section-title">资产影响</h2><div className="list">{data.market_impacts.map((text) => <div className="item" key={text}>{text}</div>)}</div></section>
      <section className="card span-12"><h2 className="section-title">未来 24 小时关注点</h2><div className="list compact">{data.watchlist.map((text) => <div className="item" key={text}>{text}</div>)}</div></section>
    </div>
  );
}
