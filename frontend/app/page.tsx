'use client';

import { FormEvent, useEffect, useState } from 'react';
import { LineChart } from '../components/line-chart';
import { ErrorBlock } from '../components/error';
import { LoadingBlock } from '../components/loading';
import {
  API_BASE,
  getDatabaseCharts,
  getDatabaseOverview,
  loginUser,
  registerUser,
} from '../lib/api';
import { AuthUser, DatabaseChart, DatabaseOverview } from '../lib/types';

const SESSION_KEY = 'macro-monitor-session';

type SessionState = {
  token: string;
  user: AuthUser;
};

function formatDate(value: string | null | undefined) {
  if (!value) return '未提供';
  return value.replace('T', ' ').slice(0, 19);
}

function loadSession(): SessionState | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SessionState;
  } catch {
    return null;
  }
}

function saveSession(session: SessionState | null) {
  if (typeof window === 'undefined') return;
  if (!session) {
    window.localStorage.removeItem(SESSION_KEY);
    return;
  }
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export default function HomePage() {
  const [session, setSession] = useState<SessionState | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [overview, setOverview] = useState<DatabaseOverview | null>(null);
  const [activeSheet, setActiveSheet] = useState('');
  const [chartsBySheet, setChartsBySheet] = useState<Record<string, DatabaseChart[]>>({});
  const [chartsLoading, setChartsLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [query, setQuery] = useState('');
  const [authError, setAuthError] = useState('');
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    const stored = loadSession();
    if (stored) setSession(stored);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!session) {
      setOverview(null);
      setChartsBySheet({});
      setActiveSheet('');
      return;
    }

    let cancelled = false;
    const sessionToken = session.token;

    async function loadOverview() {
      try {
        setLoadError('');
        const data = await getDatabaseOverview(sessionToken);
        if (cancelled) return;
        setOverview(data);
        const firstSheet = data.sheets.find((item) => item.chart_count > 0)?.name || data.sheets[0]?.name || '';
        setActiveSheet((current) => current || firstSheet);
      } catch {
        if (cancelled) return;
        setLoadError('概览数据加载失败，请确认后端 API 已启动，且当前账号具备访问权限。');
      }
    }

    loadOverview();

    return () => {
      cancelled = true;
    };
  }, [session]);

  useEffect(() => {
    if (!session || !activeSheet || chartsBySheet[activeSheet]) return;

    let cancelled = false;
    const sessionToken = session.token;

    async function loadCharts() {
      try {
        setChartsLoading(true);
        const data = await getDatabaseCharts(sessionToken, activeSheet, 160);
        if (cancelled) return;
        setChartsBySheet((current) => ({ ...current, [activeSheet]: data.charts }));
      } catch {
        if (cancelled) return;
        setLoadError('图表数据加载失败，请检查认证状态或 Excel 数据路径。');
      } finally {
        if (!cancelled) setChartsLoading(false);
      }
    }

    loadCharts();

    return () => {
      cancelled = true;
    };
  }, [activeSheet, chartsBySheet, session]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setAuthError('');

    try {
      const response =
        authMode === 'login'
          ? await loginUser(username, password)
          : await registerUser(username, password);

      const nextSession = { token: response.access_token, user: response.user };
      setSession(nextSession);
      saveSession(nextSession);
      setPassword('');
    } catch {
      setAuthError(authMode === 'login' ? '登录失败，请检查用户名或密码。' : '注册失败，用户名可能已存在。');
    } finally {
      setBusy(false);
    }
  }

  function handleLogout() {
    setSession(null);
    saveSession(null);
    setUsername('');
    setPassword('');
    setQuery('');
    setAuthError('');
    setLoadError('');
  }

  if (!hydrated) return <LoadingBlock label="正在初始化页面..." />;

  if (!session) {
    return (
      <div className="grid">
        <section className="card span-7 auth-hero">
          <div className="badge">Excel 图表在线展示 + 受保护 API</div>
          <h1>ExceltoWeb</h1>
          <p className="muted">
            当前站点会从附件里的 Excel 工作簿解析图表区块，在网页端按行业展示，并要求用户先注册用户名和密码后才能访问 API。
          </p>
          <div className="auth-feature-list">
            <div className="item">支持注册与登录</div>
            <div className="item">登录后按行业浏览图表</div>
            <div className="item">API 支持 Bearer Token 和 Basic Auth</div>
          </div>
        </section>

        <section className="card span-5 auth-card">
          <div className="row-between">
            <h2 className="section-title">{authMode === 'login' ? '登录' : '注册'}</h2>
            <div className="row-gap">
              <button
                type="button"
                className={authMode === 'login' ? 'tab-button active' : 'tab-button'}
                onClick={() => setAuthMode('login')}
              >
                登录
              </button>
              <button
                type="button"
                className={authMode === 'register' ? 'tab-button active' : 'tab-button'}
                onClick={() => setAuthMode('register')}
              >
                注册
              </button>
            </div>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <label className="field">
              <span>用户名</span>
              <input value={username} onChange={(event) => setUsername(event.target.value)} placeholder="请输入用户名" />
            </label>
            <label className="field">
              <span>密码</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="至少 6 位"
              />
            </label>
            {authError ? <div className="error-inline">{authError}</div> : null}
            <button className="primary-button" type="submit" disabled={busy}>
              {busy ? '提交中...' : authMode === 'login' ? '登录并进入看板' : '注册并进入看板'}
            </button>
          </form>
        </section>
      </div>
    );
  }

  if (loadError && !overview) return <ErrorBlock label={loadError} />;
  if (!overview) return <LoadingBlock label="正在读取中观数据库..." />;

  const charts = chartsBySheet[activeSheet] || [];
  const filteredCharts = charts.filter((item) => item.title.toLowerCase().includes(query.trim().toLowerCase()));
  const apiSheet = encodeURIComponent(activeSheet || overview.sheets[0]?.name || '');

  return (
    <div className="grid">
      <section className="card span-12 hero">
        <div>
          <div className="badge">当前用户 {session.user.username}</div>
          <h1>{overview.workbook_name}</h1>
          <p className="muted">
            最近更新 {formatDate(overview.updated_at)}，共 {overview.indicator_count} 个指标、{overview.sheet_count} 个行业页。
          </p>
        </div>
        <div className="hero-risk">
          <div className="muted">数据文件路径</div>
          <div className="path-chip">{overview.workbook_path}</div>
          <button className="secondary-button" onClick={handleLogout} type="button">
            退出登录
          </button>
        </div>
      </section>

      <section className="card span-12 stats-grid">
        <div className="metric-card">
          <div className="muted">行业页</div>
          <div className="kpi">{overview.sheet_count}</div>
        </div>
        <div className="metric-card">
          <div className="muted">指标总数</div>
          <div className="kpi">{overview.indicator_count}</div>
        </div>
        <div className="metric-card">
          <div className="muted">行业分类</div>
          <div className="kpi">{overview.industry_count}</div>
        </div>
        <div className="metric-card">
          <div className="muted">当前查看</div>
          <div className="kpi sheet-name">{activeSheet}</div>
        </div>
      </section>

      <section className="card span-7">
        <div className="section-head">
          <div>
            <h2 className="section-title">行业图表</h2>
            <p className="muted">按 Excel 工作表自动解析，前端统一重绘，适合继续替换为每周新文件。</p>
          </div>
          <input
            className="search-input"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="按图表标题搜索"
          />
        </div>

        <div className="pill-row">
          {overview.sheets
            .filter((item) => item.chart_count > 0)
            .map((item) => (
              <button
                key={item.name}
                type="button"
                className={item.name === activeSheet ? 'pill active' : 'pill'}
                onClick={() => setActiveSheet(item.name)}
              >
                {item.name} · {item.chart_count}
              </button>
            ))}
        </div>

        {chartsLoading && !charts.length ? <LoadingBlock label="正在加载图表..." /> : null}
        {loadError ? <div className="error-inline">{loadError}</div> : null}

        <div className="chart-grid">
          {filteredCharts.map((chart) => (
            <article className="chart-card" key={chart.id}>
              <div className="row-between">
                <div>
                  <h3>{chart.title}</h3>
                  <p className="muted chart-meta">
                    {chart.series_count} 条序列 · 最近展示 {chart.x_values.length} 个点 · 共 {chart.point_count_total || chart.point_count} 个点
                  </p>
                </div>
                <div className="badge">{chart.x_axis_label}</div>
              </div>
              <LineChart chart={chart} />
              {chart.source ? <div className="chart-source">{chart.source}</div> : null}
            </article>
          ))}
        </div>
      </section>

      <section className="card span-5" id="api-access">
        <h2 className="section-title">API 访问方式</h2>
        <p className="muted">
          你可以先登录拿到 Bearer Token，也可以直接用用户名密码走 Basic Auth。下面给出当前看板对应的调用示例。
        </p>

        <div className="code-title">Basic Auth</div>
        <pre className="code-block">{`curl -u ${session.user.username}:你的密码 "${API_BASE}/api/database/charts?sheet=${apiSheet}&point_limit=160"`}</pre>

        <div className="code-title">Bearer Token</div>
        <pre className="code-block">{`curl -H "Authorization: Bearer ${session.token.slice(0, 24)}..." "${API_BASE}/api/database/overview"`}</pre>
      </section>

      <section className="card span-12">
        <h2 className="section-title">指标摘要</h2>
        <div className="list compact">
          {overview.highlights.map((item) => (
            <div className="item" key={`${item.industry}-${item.name}`}>
              <div className="row-between">
                <strong>{item.name}</strong>
                <span className="badge">{item.industry}</span>
              </div>
              <div className="muted">{item.latest_status || '暂无最新描述'}</div>
              <div className="chart-source">
                {item.latest_window || '时间窗口未提供'} · {item.frequency || '频率未提供'} · {formatDate(item.latest_date)}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
