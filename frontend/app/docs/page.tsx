'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

type HttpMethod = 'GET' | 'POST';
type AuthMode = 'none' | 'bearer' | 'basic';

type Endpoint = {
  method: HttpMethod;
  path: string;
  auth: string;
  description: string;
};

type Example = {
  id: string;
  title: string;
  description: string;
  code: string;
};

type RequestPreset = {
  id: string;
  label: string;
  method: HttpMethod;
  path: string;
  authMode: AuthMode;
  body?: string;
  note: string;
};

type SchemaField = {
  name: string;
  type: string;
  description: string;
};

type SchemaGroup = {
  id: string;
  title: string;
  description: string;
  fields: SchemaField[];
};

const endpoints: Endpoint[] = [
  {
    method: 'POST',
    path: '/api/auth/register',
    auth: '无需鉴权',
    description: '注册用户名和密码，成功后会直接返回 Bearer Token。',
  },
  {
    method: 'POST',
    path: '/api/auth/login',
    auth: '无需鉴权',
    description: '用户名密码登录，返回 Bearer Token。',
  },
  {
    method: 'GET',
    path: '/api/auth/me',
    auth: 'Bearer',
    description: '检查当前 Token 对应的登录用户。',
  },
  {
    method: 'GET',
    path: '/api/database/overview',
    auth: 'Bearer / Basic',
    description: '获取工作簿概览、行业页列表和指标摘要。',
  },
  {
    method: 'GET',
    path: '/api/database/indicators?industry=房地产&limit=50',
    auth: 'Bearer / Basic',
    description: '按行业或关键词筛选指标摘要。',
  },
  {
    method: 'GET',
    path: '/api/database/charts?sheet=房地产&point_limit=160',
    auth: 'Bearer / Basic',
    description: '按工作表读取图表列表，适合网页展示或批量取数。',
  },
  {
    method: 'GET',
    path: '/api/database/charts/{chart_id}',
    auth: 'Bearer / Basic',
    description: '读取单张图表详情，适合按图表 ID 精确取数。',
  },
];

const requestPresets: RequestPreset[] = [
  {
    id: 'overview',
    label: '概览 overview',
    method: 'GET',
    path: '/api/database/overview',
    authMode: 'bearer',
    note: '推荐登录后先调这个接口，拿到 sheets 和 highlights。',
  },
  {
    id: 'indicators',
    label: '指标 indicators',
    method: 'GET',
    path: '/api/database/indicators?industry=房地产&limit=20',
    authMode: 'bearer',
    note: '适合做摘要列表、检索和二次筛选。',
  },
  {
    id: 'charts',
    label: '图表 charts',
    method: 'GET',
    path: '/api/database/charts?sheet=%E6%88%BF%E5%9C%B0%E4%BA%A7&point_limit=60',
    authMode: 'basic',
    note: '适合按工作表直接取图表数据。',
  },
  {
    id: 'me',
    label: '当前用户 me',
    method: 'GET',
    path: '/api/auth/me',
    authMode: 'bearer',
    note: '快速确认当前 Token 是否有效。',
  },
  {
    id: 'login',
    label: '登录 login',
    method: 'POST',
    path: '/api/auth/login',
    authMode: 'none',
    body: JSON.stringify({ username: 'demo_user', password: 'pass1234' }, null, 2),
    note: '直接用请求区模拟登录。',
  },
];

const schemaGroups: SchemaGroup[] = [
  {
    id: 'overview',
    title: 'GET /api/database/overview',
    description: '适合先取工作簿概览，再决定要拉哪些 sheet 或哪些指标。',
    fields: [
      { name: 'workbook_name', type: 'string', description: '当前解析的 Excel 文件名。' },
      { name: 'workbook_path', type: 'string', description: '源文件路径或快照来源路径。' },
      { name: 'updated_at', type: 'string', description: '工作簿对应的数据更新时间。' },
      { name: 'indicator_count', type: 'number', description: '指标总数。' },
      { name: 'industry_count', type: 'number', description: '行业分类数量。' },
      { name: 'sheet_count', type: 'number', description: '工作表数量。' },
      { name: 'sheets[].name', type: 'string', description: '工作表名称，可直接传给 charts 接口。' },
      { name: 'sheets[].chart_count', type: 'number', description: '该工作表可解析出的图表数量。' },
      { name: 'highlights[]', type: 'array', description: '指标摘要列表，适合做简报或卡片。' },
    ],
  },
  {
    id: 'charts',
    title: 'GET /api/database/charts',
    description: '适合前端画图、批量拉图表或做数据导出。',
    fields: [
      { name: 'sheet', type: 'string | null', description: '当前返回对应的工作表名。' },
      { name: 'charts[].id', type: 'string', description: '图表唯一 ID，可继续查单张图详情。' },
      { name: 'charts[].title', type: 'string', description: '图表标题。' },
      { name: 'charts[].x_axis_label', type: 'string', description: '横轴标签说明。' },
      { name: 'charts[].series_count', type: 'number', description: '图中序列数量。' },
      { name: 'charts[].x_values[]', type: 'array', description: '横轴刻度值，通常是日期。' },
      { name: 'charts[].series[].name', type: 'string', description: '单条序列名称。' },
      { name: 'charts[].series[].values[]', type: 'array<number|null>', description: '序列数值点，可直接画线图。' },
      { name: 'charts[].latest_values', type: 'object', description: '每条序列最新值的键值对。' },
    ],
  },
  {
    id: 'indicators',
    title: 'GET /api/database/indicators',
    description: '适合按行业、关键词或最近状态做筛选检索。',
    fields: [
      { name: 'items[].industry', type: 'string', description: '指标所属行业。' },
      { name: 'items[].name', type: 'string', description: '指标名称。' },
      { name: 'items[].indicator_id', type: 'string | number | null', description: '指标编号。' },
      { name: 'items[].latest_status', type: 'string | null', description: '最新状态描述。' },
      { name: 'items[].latest_window', type: 'string | null', description: '最新观测时间窗口。' },
      { name: 'items[].frequency', type: 'string | null', description: '频率，如日度、周度、旬度。' },
      { name: 'items[].direction', type: 'string | null', description: '方向，如上行、下行、持平。' },
      { name: 'items[].latest_date', type: 'string | null', description: '最新日期。' },
      { name: 'items[].source', type: 'string | null', description: '来源说明。' },
    ],
  },
];

function buildExamples(apiBase: string): Example[] {
  const registerCommand = [
    `curl -X POST "${apiBase}/auth/register" \\`,
    '  -H "Content-Type: application/json" \\',
    '  -d "{\\"username\\":\\"demo_user\\",\\"password\\":\\"pass1234\\"}"',
  ].join('\n');

  const loginCommand = [
    `curl -X POST "${apiBase}/auth/login" \\`,
    '  -H "Content-Type: application/json" \\',
    '  -d "{\\"username\\":\\"demo_user\\",\\"password\\":\\"pass1234\\"}"',
  ].join('\n');

  const bearerCommand = [
    'curl -H "Authorization: Bearer 你的_token" \\',
    `  "${apiBase}/database/overview"`,
  ].join('\n');

  const basicCommand = [
    'curl -u demo_user:pass1234 \\',
    `  "${apiBase}/database/charts?sheet=%E6%88%BF%E5%9C%B0%E4%BA%A7&point_limit=160"`,
  ].join('\n');

  const fetchCommand = [
    `const apiBase = '${apiBase}';`,
    '',
    'const loginResponse = await fetch(`${apiBase}/auth/login`, {',
    "  method: 'POST',",
    "  headers: { 'Content-Type': 'application/json' },",
    "  body: JSON.stringify({ username: 'demo_user', password: 'pass1234' }),",
    '});',
    '',
    'const { access_token } = await loginResponse.json();',
    '',
    'const chartsResponse = await fetch(',
    "  `${apiBase}/database/charts?sheet=${encodeURIComponent('房地产')}&point_limit=160`,",
    '  {',
    "    headers: { Authorization: `Bearer ${access_token}` },",
    '  },',
    ');',
    '',
    'const charts = await chartsResponse.json();',
    'console.log(charts);',
  ].join('\n');

  return [
    {
      id: 'register',
      title: '1. 注册',
      description: '首次使用时创建用户名和密码，接口会顺手返回 Bearer Token。',
      code: registerCommand,
    },
    {
      id: 'login',
      title: '2. 登录',
      description: '使用用户名密码换取 Bearer Token，适合服务端脚本或前端登录流程。',
      code: loginCommand,
    },
    {
      id: 'bearer',
      title: '3. Bearer Token 取概览',
      description: '登录后把 Token 放进 Authorization 头，就能读取受保护接口。',
      code: bearerCommand,
    },
    {
      id: 'basic',
      title: '4. Basic Auth 直接取图表',
      description: '如果你更习惯命令行，可以直接用用户名密码访问取数接口。',
      code: basicCommand,
    },
    {
      id: 'fetch',
      title: '5. JavaScript fetch 示例',
      description: '适合接到你自己的网页、Node 服务或自动化脚本里。',
      code: fetchCommand,
    },
  ];
}

function prettifyBody(text: string, contentType: string) {
  if (!text) return '';
  if (!contentType.includes('application/json')) return text;

  try {
    return JSON.stringify(JSON.parse(text), null, 2);
  } catch {
    return text;
  }
}

export default function DocsPage() {
  const [origin, setOrigin] = useState('https://www.shuozhongdian.cn');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [authUsername, setAuthUsername] = useState('demo_user');
  const [authPassword, setAuthPassword] = useState('pass1234');
  const [authToken, setAuthToken] = useState('');
  const [authStatus, setAuthStatus] = useState('先注册或登录一次，页面会自动帮你填充 Bearer Token。');
  const [authBusy, setAuthBusy] = useState<'register' | 'login' | null>(null);
  const [selectedPreset, setSelectedPreset] = useState('overview');
  const [requestMethod, setRequestMethod] = useState<HttpMethod>('GET');
  const [requestPath, setRequestPath] = useState('/api/database/overview');
  const [requestAuthMode, setRequestAuthMode] = useState<AuthMode>('bearer');
  const [requestBody, setRequestBody] = useState('');
  const [requestBusy, setRequestBusy] = useState(false);
  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [responseContentType, setResponseContentType] = useState('');
  const [responseDuration, setResponseDuration] = useState<number | null>(null);
  const [responseText, setResponseText] = useState('// 点击“发送请求”后，这里会显示接口返回结果');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
  }, []);

  useEffect(() => {
    const preset = requestPresets.find((item) => item.id === selectedPreset);
    if (!preset) return;

    setRequestMethod(preset.method);
    setRequestPath(preset.path);
    setRequestAuthMode(preset.authMode);
    setRequestBody(preset.body || '');
  }, [selectedPreset]);

  const apiBase = `${origin}/api`;
  const examples = useMemo(() => buildExamples(apiBase), [apiBase]);
  const activePreset = requestPresets.find((item) => item.id === selectedPreset) || requestPresets[0];

  async function handleCopy(id: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      window.setTimeout(() => {
        setCopiedId((current) => (current === id ? null : current));
      }, 1600);
    } catch {
      setCopiedId(null);
    }
  }

  async function handleAuth(action: 'register' | 'login') {
    if (!authUsername.trim() || !authPassword.trim()) {
      setAuthStatus('请先输入用户名和密码。');
      return;
    }

    setAuthBusy(action);
    try {
      const response = await fetch(`${origin}/api/auth/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: authUsername.trim(),
          password: authPassword,
        }),
      });

      const contentType = response.headers.get('content-type') || '';
      const raw = await response.text();
      const formatted = prettifyBody(raw, contentType);

      if (!response.ok) {
        setAuthStatus(`${action === 'register' ? '注册' : '登录'}失败：${formatted || response.statusText}`);
        return;
      }

      const payload = JSON.parse(raw) as { access_token: string; user: { username: string } };
      setAuthToken(payload.access_token);
      setRequestAuthMode('bearer');
      setResponseStatus(response.status);
      setResponseContentType(contentType);
      setResponseDuration(null);
      setResponseText(formatted);
      setAuthStatus(`${action === 'register' ? '注册' : '登录'}成功：${payload.user.username}，Token 已自动填充。`);
    } catch (error) {
      const detail = error instanceof Error ? error.message : '未知错误';
      setAuthStatus(`${action === 'register' ? '注册' : '登录'}失败：${detail}`);
    } finally {
      setAuthBusy(null);
    }
  }

  async function handleSendRequest() {
    const normalizedPath = requestPath.trim().startsWith('/') ? requestPath.trim() : `/${requestPath.trim()}`;
    if (!normalizedPath) {
      setResponseText('请输入请求路径。');
      return;
    }

    if (requestAuthMode === 'bearer' && !authToken.trim()) {
      setResponseText('当前鉴权模式是 Bearer，请先在上方登录或手动填入 Token。');
      return;
    }

    if (requestAuthMode === 'basic' && (!authUsername.trim() || !authPassword.trim())) {
      setResponseText('当前鉴权模式是 Basic，请先填入用户名和密码。');
      return;
    }

    setRequestBusy(true);
    const headers: Record<string, string> = {};

    if (requestAuthMode === 'bearer') {
      headers.Authorization = `Bearer ${authToken.trim()}`;
    }

    if (requestAuthMode === 'basic') {
      const encoded = btoa(unescape(encodeURIComponent(`${authUsername.trim()}:${authPassword}`)));
      headers.Authorization = `Basic ${encoded}`;
    }

    let body: string | undefined;
    if (requestMethod === 'POST' && requestBody.trim()) {
      headers['Content-Type'] = 'application/json';
      body = requestBody;
    }

    const startedAt = performance.now();
    try {
      const response = await fetch(`${origin}${normalizedPath}`, {
        method: requestMethod,
        headers,
        body,
      });

      const contentType = response.headers.get('content-type') || '';
      const raw = await response.text();
      const elapsed = Math.round(performance.now() - startedAt);

      setResponseStatus(response.status);
      setResponseContentType(contentType || 'unknown');
      setResponseDuration(elapsed);
      setResponseText(prettifyBody(raw, contentType) || '// 响应体为空');
    } catch (error) {
      const elapsed = Math.round(performance.now() - startedAt);
      const detail = error instanceof Error ? error.message : '未知错误';

      setResponseStatus(null);
      setResponseContentType('network-error');
      setResponseDuration(elapsed);
      setResponseText(`请求失败：${detail}`);
    } finally {
      setRequestBusy(false);
    }
  }

  return (
    <div className="grid docs-grid">
      <section className="card span-12 docs-hero">
        <div className="docs-hero-copy">
          <div className="badge">在线 API 文档</div>
          <h1>ExceltoWeb API 接入说明</h1>
          <p className="muted">
            这套接口已经部署在你自己的域名下。现在文档页不仅能看示例，还可以直接在线注册、登录、调接口和查看返回结构。
          </p>
          <div className="docs-meta">
            <div className="docs-meta-card">
              <span className="docs-meta-label">文档域名</span>
              <strong>{origin}</strong>
            </div>
            <div className="docs-meta-card">
              <span className="docs-meta-label">API Base</span>
              <strong>{apiBase}</strong>
            </div>
            <div className="docs-meta-card">
              <span className="docs-meta-label">鉴权方式</span>
              <strong>Bearer / Basic</strong>
            </div>
          </div>
        </div>
        <div className="docs-hero-side">
          <div className="item docs-callout">
            <strong>推荐接入顺序</strong>
            <p className="muted">先注册或登录，再调用 `/api/database/overview` 拿到可用的工作表名称，最后按 sheet 取图表。</p>
          </div>
          <div className="docs-actions">
            <Link href="/" className="primary-link">
              打开看板
            </Link>
            <a href="#playground" className="secondary-link">
              在线调试
            </a>
          </div>
        </div>
      </section>

      <section className="card span-12">
        <h2 className="section-title">快速开始</h2>
        <div className="docs-steps">
          <div className="item docs-step">
            <div className="badge">Step 1</div>
            <strong>注册或登录</strong>
            <p className="muted">调用 `POST /api/auth/register` 或 `POST /api/auth/login`，拿到 `access_token`。</p>
          </div>
          <div className="item docs-step">
            <div className="badge">Step 2</div>
            <strong>读取概览</strong>
            <p className="muted">调用 `GET /api/database/overview`，获取 `sheets`、`highlights` 和工作簿元信息。</p>
          </div>
          <div className="item docs-step">
            <div className="badge">Step 3</div>
            <strong>按 sheet 取图表</strong>
            <p className="muted">把 `sheets[].name` 作为 `sheet` 参数传给 `GET /api/database/charts`。</p>
          </div>
        </div>
      </section>

      <section className="card span-12">
        <div className="section-head docs-head">
          <div>
            <h2 className="section-title">接口清单</h2>
            <p className="muted">下面这些接口都已经挂在正式域名下，可以直接从浏览器、命令行或脚本中调用。</p>
          </div>
        </div>
        <div className="docs-endpoint-list">
          {endpoints.map((endpoint) => (
            <article className="docs-endpoint-card" key={`${endpoint.method}-${endpoint.path}`}>
              <div className="docs-endpoint-top">
                <span className={`method-pill ${endpoint.method === 'GET' ? 'get' : 'post'}`}>{endpoint.method}</span>
                <code className="endpoint-path">{endpoint.path}</code>
              </div>
              <div className="docs-endpoint-auth">{endpoint.auth}</div>
              <p className="muted">{endpoint.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="card span-12" id="playground">
        <div className="section-head docs-head">
          <div>
            <h2 className="section-title">在线调试接口</h2>
            <p className="muted">你可以直接在页面里注册、登录、填 Token，并向正式环境发送测试请求。</p>
          </div>
        </div>

        <div className="docs-playground-grid">
          <article className="docs-panel">
            <div className="docs-panel-head">
              <h3>登录辅助</h3>
              <p className="muted">先在这里输入用户名和密码，点击注册或登录后会自动填充 Bearer Token。</p>
            </div>

            <div className="docs-form-grid">
              <label className="field">
                <span>用户名</span>
                <input value={authUsername} onChange={(event) => setAuthUsername(event.target.value)} placeholder="例如 demo_user" />
              </label>
              <label className="field">
                <span>密码</span>
                <input
                  type="password"
                  value={authPassword}
                  onChange={(event) => setAuthPassword(event.target.value)}
                  placeholder="至少 6 位"
                />
              </label>
            </div>

            <label className="field">
              <span>Bearer Token</span>
              <textarea
                className="docs-textarea docs-token-box"
                value={authToken}
                onChange={(event) => setAuthToken(event.target.value)}
                placeholder="登录成功后会自动填充，也可以手动粘贴"
              />
            </label>

            <div className="docs-helper-row">
              <button
                type="button"
                className="primary-button"
                disabled={authBusy !== null}
                onClick={() => handleAuth('register')}
              >
                {authBusy === 'register' ? '注册中...' : '注册并填充 Token'}
              </button>
              <button
                type="button"
                className="secondary-button docs-inline-button"
                disabled={authBusy !== null}
                onClick={() => handleAuth('login')}
              >
                {authBusy === 'login' ? '登录中...' : '登录并填充 Token'}
              </button>
              <button
                type="button"
                className={copiedId === 'token' ? 'copy-button copied' : 'copy-button'}
                onClick={() => handleCopy('token', authToken)}
              >
                {copiedId === 'token' ? 'Token 已复制' : '复制 Token'}
              </button>
            </div>

            <div className="item docs-status-box">
              <strong>当前状态</strong>
              <p className="muted">{authStatus}</p>
            </div>
          </article>

          <article className="docs-panel">
            <div className="docs-panel-head">
              <h3>请求调试器</h3>
              <p className="muted">这里会向正式环境发送真实请求。你可以用预设，也可以自行改路径、方法和鉴权方式。</p>
            </div>

            <div className="docs-form-grid">
              <label className="field">
                <span>预设接口</span>
                <select className="docs-select" value={selectedPreset} onChange={(event) => setSelectedPreset(event.target.value)}>
                  {requestPresets.map((preset) => (
                    <option key={preset.id} value={preset.id}>
                      {preset.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>鉴权模式</span>
                <select className="docs-select" value={requestAuthMode} onChange={(event) => setRequestAuthMode(event.target.value as AuthMode)}>
                  <option value="none">无需鉴权</option>
                  <option value="bearer">Bearer Token</option>
                  <option value="basic">Basic Auth</option>
                </select>
              </label>
            </div>

            <div className="docs-form-grid docs-form-grid-tight">
              <label className="field docs-method-field">
                <span>方法</span>
                <select className="docs-select" value={requestMethod} onChange={(event) => setRequestMethod(event.target.value as HttpMethod)}>
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                </select>
              </label>
              <label className="field docs-path-field">
                <span>请求路径</span>
                <input value={requestPath} onChange={(event) => setRequestPath(event.target.value)} placeholder="/api/database/overview" />
              </label>
            </div>

            <label className="field">
              <span>请求体</span>
              <textarea
                className="docs-textarea"
                value={requestBody}
                onChange={(event) => setRequestBody(event.target.value)}
                placeholder="POST 请求时填写 JSON；GET 请求可留空"
              />
            </label>

            <div className="item docs-status-box">
              <strong>当前预设说明</strong>
              <p className="muted">{activePreset.note}</p>
            </div>

            <div className="docs-helper-row">
              <button type="button" className="primary-button" disabled={requestBusy} onClick={handleSendRequest}>
                {requestBusy ? '请求发送中...' : '发送请求'}
              </button>
              <button
                type="button"
                className={copiedId === 'response' ? 'copy-button copied' : 'copy-button'}
                onClick={() => handleCopy('response', responseText)}
              >
                {copiedId === 'response' ? '响应已复制' : '复制响应'}
              </button>
            </div>
          </article>
        </div>

        <div className="docs-response-panel">
          <div className="docs-response-meta">
            <span className={responseStatus && responseStatus < 300 ? 'response-status ok' : 'response-status fail'}>
              {responseStatus === null ? '未发送' : `HTTP ${responseStatus}`}
            </span>
            <span className="response-chip">{responseContentType || 'content-type 未知'}</span>
            <span className="response-chip">{responseDuration === null ? '尚无耗时' : `${responseDuration} ms`}</span>
          </div>
          <pre className="code-block docs-response-block">{responseText}</pre>
        </div>
      </section>

      <section className="card span-12">
        <div className="section-head docs-head">
          <div>
            <h2 className="section-title">字段说明表</h2>
            <p className="muted">下面把 `overview`、`charts`、`indicators` 这三类核心返回结构拆开说明，方便你二次开发。</p>
          </div>
        </div>

        <div className="docs-schema-grid">
          {schemaGroups.map((group) => (
            <article className="docs-schema-card" key={group.id}>
              <div className="docs-schema-head">
                <h3>{group.title}</h3>
                <p className="muted">{group.description}</p>
              </div>

              <div className="docs-schema-table">
                <div className="docs-schema-row docs-schema-header">
                  <span>字段</span>
                  <span>类型</span>
                  <span>说明</span>
                </div>
                {group.fields.map((field) => (
                  <div className="docs-schema-row" key={`${group.id}-${field.name}`}>
                    <code>{field.name}</code>
                    <span>{field.type}</span>
                    <span>{field.description}</span>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="card span-12" id="examples">
        <h2 className="section-title">可复制示例</h2>
        <div className="docs-example-grid">
          {examples.map((example) => (
            <article className="docs-example-card" key={example.id}>
              <div className="docs-example-head">
                <div>
                  <h3>{example.title}</h3>
                  <p className="muted">{example.description}</p>
                </div>
                <button
                  type="button"
                  className={copiedId === example.id ? 'copy-button copied' : 'copy-button'}
                  onClick={() => handleCopy(example.id, example.code)}
                >
                  {copiedId === example.id ? '已复制' : '复制'}
                </button>
              </div>
              <pre className="code-block">{example.code}</pre>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
