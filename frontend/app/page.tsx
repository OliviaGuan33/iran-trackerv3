'use client';

import { useEffect, useState } from 'react';
import { ErrorBlock } from '../components/error';
import { LoadingBlock } from '../components/loading';
import { Sparkline } from '../components/sparkline';
import { getMarkets, getOverview } from '../lib/api';
import { pctClass } from '../lib/format';
import { MarketsResponse, OverviewData } from '../lib/types';

function marketSourceLabel(markets: MarketsResponse) {
  if (!markets.source) return '示例数据';
  if (markets.source === 'yahoo_finance') return 'Yahoo Finance';
  return markets.source;
}

export default function HomePage() {
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [markets, setMarkets] = useState<MarketsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const [overviewData, marketsData] = await Promise.all([getOverview(), getMarkets()]);
        if (!mounted) return;
        setOverview(overviewData);
        setMarkets(marketsData);
        setError(false);
      } catch {
        if (!mounted) return;
        setError(true);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    const timer = window.setInterval(load, 30000);
    return () => {
      mounted = false;
      window.clearInterval(timer);
    };
  }, []);

  if (loading) return <LoadingBlock label="正在加载总览与行情..." />;
  if (error || !overview || !markets) return <ErrorBlock />;

  return (
    <div className="grid">
      <section className="card span-12 hero">
        <div>
          <div className="badge">更新时间 {overview.updated_at}</div>
          <h1>{overview.title}</h1>
          <p className="muted">{overview.subtitle}</p>
        </div>
        <div className="hero-risk">
          <div className="muted">当前风险等级</div>
          <div className="risk-pill">{overview.risk_level}</div>
          <div className="muted">{overview.risk_note}</div>
        </div>
      </section>

      <section className="card span-12">
        <div className="row-between">
          <div>
            <h2 className="section-title">实时行情</h2>
            <p className="muted">最新刷新 {markets.updated_at || '—'} · 数据源 {marketSourceLabel(markets)}{markets.is_live === false ? '（回退）' : ''}</p>
          </div>
          {markets.error ? <div className="badge">外部接口异常，已回退</div> : <div className="badge">30 秒自动刷新</div>}
        </div>
      </section>

      {markets.items.map((item) => (
        <section className="card span-3" key={item.symbol}>
          <div className="row-between">
            <div className="muted">{item.symbol}</div>
            <div className={`delta ${pctClass(item.pct_change)}`}>{item.pct_change > 0 ? '+' : ''}{item.pct_change}%</div>
          </div>
          <div className="kpi">{item.price}</div>
          <Sparkline values={item.history} />
        </section>
      ))}

      <section className="card span-7">
        <h2 className="section-title">原油图谱</h2>
        <p className="muted">这里已接总览数据，后续替换成地图、热区和路线图即可。</p>
        <div className="list">{overview.map_notes.map((note) => <div className="item" key={note}>{note}</div>)}</div>
      </section>

      <section className="card span-5">
        <h2 className="section-title">替代路线</h2>
        <div className="list compact">
          {overview.routes.map((route) => (
            <div className="item" key={route.name}>
              <div className="row-between"><strong>{route.name}</strong><span className="badge">{route.status}</span></div>
              <div className="muted">{route.capacity}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="card span-12">
        <h2 className="section-title">重点国家概览</h2>
        <div className="country-grid">
          {overview.country_cards.map((country) => (
            <div className="country-card" key={country.name}>
              <h3>{country.name}</h3>
              <div className="muted">储量：{country.reserve}</div>
              <div className="muted">产量：{country.output}</div>
              <div className="muted">出口：{country.export}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="card span-12 disclaimer">{overview.disclaimer}</section>
    </div>
  );
}
