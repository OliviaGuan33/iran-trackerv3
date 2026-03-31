'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

type Endpoint = {
  method: 'GET' | 'POST';
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

const endpoints: Endpoint[] = [
  {
    method: 'POST',
    path: '/api/auth/register',
    auth: '无需鉴权',
    description: '注册用户名和密码，成功后直接返回 Bearer Token。',
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
    description: '获取工作簿概览、行业页列表、指标摘要。',
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

export default function DocsPage() {
  const [origin, setOrigin] = useState('https://www.shuozhongdian.cn');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
  }, []);

  const apiBase = `${origin}/api`;
  const examples = useMemo(() => buildExamples(apiBase), [apiBase]);

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

  return (
    <div className="grid docs-grid">
      <section className="card span-12 docs-hero">
        <div className="docs-hero-copy">
          <div className="badge">在线 API 文档</div>
          <h1>ExceltoWeb API 接入说明</h1>
          <p className="muted">
            这套接口已经部署在你自己的域名下。注册后可以用 Bearer Token 或 Basic Auth 提取 Excel
            图表与指标数据。
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
            <a href="#examples" className="secondary-link">
              直接看示例
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
            <p className="muted">`POST /api/auth/register` 或 `POST /api/auth/login`，返回 `access_token`。</p>
          </div>
          <div className="item docs-step">
            <div className="badge">Step 2</div>
            <strong>读取概览</strong>
            <p className="muted">调用 `GET /api/database/overview`，拿到 `sheets`、`highlights` 和工作簿信息。</p>
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
            <p className="muted">下面这些接口已经全部可用，且都挂在你的正式域名下。</p>
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

      <section className="card span-6">
        <h2 className="section-title">鉴权规则</h2>
        <div className="list compact">
          <div className="item">
            <strong>Bearer Token</strong>
            <p className="muted">适合网页登录后复用，也适合服务端脚本先登录再取数。</p>
          </div>
          <div className="item">
            <strong>Basic Auth</strong>
            <p className="muted">适合命令行快速拉取。把用户名密码写进 `Authorization: Basic ...` 即可。</p>
          </div>
          <div className="item">
            <strong>建议做法</strong>
            <p className="muted">正式系统更推荐用登录换 Token，再用 Bearer 调受保护数据接口。</p>
          </div>
        </div>
      </section>

      <section className="card span-6">
        <h2 className="section-title">返回结构重点</h2>
        <div className="list compact">
          <div className="item">
            <strong>`overview.sheets`</strong>
            <p className="muted">可用工作表列表，每项包含 `name` 和 `chart_count`。</p>
          </div>
          <div className="item">
            <strong>`charts[].series`</strong>
            <p className="muted">每张图的序列数组，里面是可以直接画图的数值点。</p>
          </div>
          <div className="item">
            <strong>`highlights`</strong>
            <p className="muted">指标摘要列表，适合做看板摘要、日报摘要或二次检索。</p>
          </div>
        </div>
      </section>
    </div>
  );
}
