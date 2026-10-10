# Tuvis 官网 P0–P5 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为兔维斯（Tuvis）构建中英双语、亮暗双主题的官网：首页（7 区块）+ 交互 Demo（4 场景）+ 快速上手文档页 + 更新日志页，可构建部署到 GitHub Pages。

**Architecture:** Vite SPA（GH Pages 子路径托管，`base=/tuvis-website/`，404.html 兜底路由）。React 19 + Tailwind v4（CSS 变量双主题令牌）。i18next 按路径段 `/:lang` 切换 zh/en。Demo 为纯前端模拟：zustand 状态 + 剧本播放器（自动播放、用户接管）。更新日志由脚本从主仓 CHANGELOG.md 切分为 JSON。

**Tech Stack:** pnpm · Vite 6 · React 19 · TypeScript 5.7 · Tailwind CSS v4 · react-router 7 · i18next · zustand 5 · framer-motion 12 · vitest 3 + @testing-library/react

**规格来源:** `SPEC.md` v1.3（决策 1–27）。配色事实源：`brand/final/logo/versions/05-aigen/COLOR-SPEC.md`。

**全局约定:**
- 工作目录：`E:\LLMproject\Github\tuvis-website`（Shell: Git Bash）
- 包管理：pnpm ≥9；Node ≥20
- 每个任务以一次 commit 收尾，消息格式 `type: 描述`（type = feat/test/chore/fix）
- 主仓素材路径（只读引用）：`E:\LLMproject\Github\mam-worktree`
- 测试文件与源码同目录，命名 `*.test.ts(x)`；运行 `pnpm test`

**文件总览（本计划创建的全部源文件）:**

```
tuvis-website/
├── .gitignore  package.json  pnpm-workspace.yaml(不需要)  vite.config.ts
├── tsconfig.json  index.html  public/404.html(构建产物)  public/robots.txt
├── public/llms.txt  public/sitemap.xml  public/img/*(P1 拷贝)  public/pet/*(P4 拷贝)
├── scripts/make-404.mjs  scripts/split-changelog.mjs  scripts/generate-assets.py
├── src/
│   ├── main.tsx  vite-env.d.ts  index.css
│   ├── theme.ts  theme.test.ts
│   ├── i18n/index.ts  i18n/zh.json  i18n/en.json  i18n/parity.test.ts
│   ├── router.tsx  test/setup.ts
│   ├── utils/download.ts  download.test.ts
│   ├── seo.ts
│   ├── components/layout/{TopBar,Footer,Layout,LangLayout}.tsx
│   ├── components/{Reveal,ThemeToggle,LanguageSwitcher,SectionTitle}.tsx
│   ├── pages/{Home,DemoPage,DocsPage,ChangelogPage}.tsx
│   ├── home/{Hero,StatesSection,StoriesSection,FeaturesSection,OpenSource,DownloadCta,HomeBoard}.tsx
│   ├── demo/{types,tools,seed,store,steps-d1,steps-d2,steps-res,steps-pet}.ts
│   ├── demo/player.ts  player.test.ts
│   ├── demo/{PlayerFrame,ToolChip,SessionCard,PhoneFrame}.tsx
│   ├── demo/scenes/{BoardScene,RemoteScene,ResourcesScene,PetUsageScene}.tsx
│   ├── demo/petAnimations.ts
│   └── content/changelog.json (构建生成)
└── tests/fixtures/CHANGELOG-sample.md
```

---

## P0 · 脚手架与基础设施

### Task 0: 仓库初始化 + Vite 骨架

**Files:**
- Create: `.gitignore` `package.json` `vite.config.ts` `tsconfig.json` `index.html`
- Create: `src/main.tsx` `src/vite-env.d.ts` `src/index.css` `src/test/setup.ts`

- [x] **Step 0.1: .gitignore 核验（git 仓库已初始化）**

> 2026-10-10 已由 Review 方完成：`git init -b main` + 首次提交 `611a58e`（51 文件），`.gitignore` 已生效——`brand/archive/` 不在跟踪范围。执行者只需运行 `git status` 确认工作区干净，不要重新 init。

`.gitignore` 内容（已存在，勿改动）：

```gitignore
node_modules/
dist/
brand/archive/
*.local
.DS_Store
```

- [x] **Step 0.2: 写 package.json**

```json
{
  "name": "tuvis-website",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build && node scripts/make-404.mjs",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "sync:changelog": "node scripts/split-changelog.mjs"
  },
  "dependencies": {
    "framer-motion": "^12.0.0",
    "i18next": "^24.2.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-i18next": "^15.2.0",
    "react-router": "^7.1.1",
    "zustand": "^5.0.3"
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4.0.6",
    "@testing-library/dom": "^10.4.0",
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.2.0",
    "@types/react": "^19.0.8",
    "@types/react-dom": "^19.0.3",
    "@vitejs/plugin-react": "^4.3.4",
    "jsdom": "^26.0.0",
    "tailwindcss": "^4.0.6",
    "typescript": "~5.7.3",
    "vite": "^6.1.0",
    "vitest": "^3.0.5"
  }
}
```

- [x] **Step 0.3: 写 vite.config.ts**

```ts
/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "node:path";

export default defineConfig({
  base: "/tuvis-website/",
  plugins: [react(), tailwindcss()],
  resolve: { alias: { "@": resolve(__dirname, "src") } },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["src/test/setup.ts"],
  },
});
```

- [x] **Step 0.4: 写 tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "skipLibCheck": true,
    "noEmit": true,
    "types": ["vite/client"],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["src"]
}
```

- [x] **Step 0.5: 写 index.html**

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="icon" type="image/png" href="/tuvis-website/favicon.png" />
    <meta name="theme-color" content="#2C3347" />
    <title>兔维斯 Tuvis —— 你的桌面多 Agent 指挥台</title>
    <meta
      name="description"
      content="兔维斯（Tuvis）：一块看板看清并掌控所有 AI Agent——会话状态、远程消息注入、Skill/MCP/预设管理、用量账本，从桌面到手机。"
    />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [x] **Step 0.6: 写 src/index.css（设计令牌，双主题）**

```css
@import "tailwindcss";

@custom-variant dark (&:where(.dark, .dark *));

@theme inline {
  --color-surface: var(--surface);
  --color-card: var(--card);
  --color-line: var(--line);
  --color-ink: var(--ink);
  --color-inkdim: var(--ink-dim);
  --color-ok: var(--status-ok);
  --color-warn: var(--status-warn);
  --color-bad: var(--status-bad);
  --color-hud: var(--hud);
  --color-navy: #2c3347;
}

:root {
  --surface: #f7f6f4;
  --card: #ffffff;
  --line: #eceae4;
  --ink: #1a1915;
  --ink-dim: #6f6f68;
  --status-ok: #1e7b34;
  --status-warn: #8a6d00;
  --status-bad: #b3261e;
  --hud: #1787a8;
}

.dark {
  --surface: #0b1220;
  --card: #131e30;
  --line: #22304a;
  --ink: #e7eef7;
  --ink-dim: #94a6bd;
  --status-ok: #36bb7b;
  --status-warn: #eab53d;
  --status-bad: #de5656;
  --hud: #72d8ef;
}

html {
  scroll-behavior: smooth;
}

body {
  @apply bg-surface text-ink;
  font-family:
    Inter,
    "PingFang SC",
    "Microsoft YaHei",
    system-ui,
    sans-serif;
}
```

> 藏蓝 `#2C3347` 只用于图标/深色底牌图像，不作为站点令牌；品牌点缀青蓝 `--hud` 深版 `#1787A8` / 浅版 `#72D8EF`。

- [x] **Step 0.7: 写 src/main.tsx、src/vite-env.d.ts、src/test/setup.ts**

`src/vite-env.d.ts`:

```ts
/// <reference types="vite/client" />
```

`src/test/setup.ts`:

```ts
import "@testing-library/jest-dom/vitest";
```

`src/main.tsx`（先最小化，路由在 Task 3 接入）：

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <div className="p-8">Tuvis website bootstrap ok</div>
  </StrictMode>,
);
```

- [x] **Step 0.8: 安装依赖并验证**

```bash
pnpm install
pnpm dev
# 浏览器打开 http://localhost:5173/tuvis-website/，看到 "Tuvis website bootstrap ok"
pnpm test   # Expected: "No test files found"（exit code 1 属正常，Task 1 会加测试）
```

- [x] **Step 0.9: Commit**

```bash
git add -A
git commit -m "chore: vite + react19 + tailwind4 scaffold with design tokens"
```

---

### Task 1: 亮暗主题切换

**Files:**
- Create: `src/theme.ts` `src/theme.test.ts`
- Create: `src/components/ThemeToggle.tsx`
- Modify: `src/main.tsx`

- [x] **Step 1.1: 写失败测试 src/theme.test.ts**

```ts
import { describe, expect, it, beforeEach } from "vitest";
import { applyTheme, getTheme, setTheme } from "./theme";

describe("theme", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = "";
  });

  it("setTheme 写入 localStorage 并给 html 加 dark 类", () => {
    setTheme("dark");
    expect(localStorage.getItem("tuvis-theme")).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("getTheme 无存档时跟随 prefers-color-scheme", () => {
    localStorage.removeItem("tuvis-theme");
    window.matchMedia = (q: string) =>
      ({ matches: q.includes("dark"), media: q, addEventListener() {}, removeEventListener() {} }) as MediaQueryList;
    expect(getTheme()).toBe("dark");
  });

  it("applyTheme 切换类名", () => {
    applyTheme("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    applyTheme("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });
});
```

- [x] **Step 1.2: 运行验证失败**

```bash
pnpm test -- src/theme.test.ts
# Expected: FAIL（theme.ts 不存在）
```

- [x] **Step 1.3: 实现 src/theme.ts**

```ts
export type Theme = "light" | "dark";
const KEY = "tuvis-theme";

export function applyTheme(t: Theme): void {
  document.documentElement.classList.toggle("dark", t === "dark");
}

export function getTheme(): Theme {
  const saved = localStorage.getItem(KEY) as Theme | null;
  if (saved === "light" || saved === "dark") return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function setTheme(t: Theme): void {
  localStorage.setItem(KEY, t);
  applyTheme(t);
}
```

- [x] **Step 1.4: 运行验证通过**

```bash
pnpm test -- src/theme.test.ts
# Expected: 3 passed
```

- [x] **Step 1.5: 写 src/components/ThemeToggle.tsx 并挂到 main.tsx**

```tsx
import { useEffect, useState } from "react";
import { getTheme, setTheme, type Theme } from "@/theme";

export function ThemeToggle() {
  const [t, setT] = useState<Theme>("light");
  useEffect(() => setT(getTheme()), []);
  return (
    <button
      aria-label="toggle theme"
      className="rounded-lg border border-line px-2.5 py-1.5 text-sm hover:opacity-70"
      onClick={() => {
        const next: Theme = t === "dark" ? "light" : "dark";
        setT(next);
        setTheme(next);
      }}
    >
      {t === "dark" ? "🌙" : "☀️"}
    </button>
  );
}
```

`src/main.tsx` 改为：

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { applyTheme, getTheme } from "@/theme";
import { ThemeToggle } from "@/components/ThemeToggle";
import "./index.css";

applyTheme(getTheme());

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <div className="flex items-center justify-between p-8">
      <span>Tuvis website bootstrap ok</span>
      <ThemeToggle />
    </div>
  </StrictMode>,
);
```

- [x] **Step 1.6: 手动验证 + Commit**

```bash
pnpm dev   # 点击按钮：整站明暗即时切换，刷新后保持
pnpm test
git add -A && git commit -m "feat: light/dark theme with toggle and tokens"
```

---

### Task 2: i18n 框架 + 语言资源

**Files:**
- Create: `src/i18n/index.ts` `src/i18n/zh.json` `src/i18n/en.json` `src/i18n/parity.test.ts`

- [x] **Step 2.1: 写 src/i18n/zh.json（全站中文文案，单层 key）**

```json
{
  "nav.features": "功能",
  "nav.demo": "演示",
  "nav.docs": "文档",
  "nav.changelog": "更新日志",
  "nav.download": "免费下载",
  "hero.badge": "开源 · 桌面端 · 移动端远程",
  "hero.title": "兔维斯",
  "hero.subtitle": "你的桌面多 Agent 指挥台",
  "hero.desc": "一块看板看清并掌控所有 AI Agent——会话状态、远程消息注入、Skill/MCP/预设管理、用量账本，从桌面到手机。",
  "hero.cta": "免费下载",
  "hero.github": "GitHub 仓库",
  "states.title": "它的灯，就是 Agent 的状态",
  "states.desc": "胸口的胡萝卜灯跟着会话卡面实时变色，隔着一米也能看清全局。",
  "states.green": "运行中——任务正常推进",
  "states.yellow": "等待批准——需要你拍板",
  "states.red": "已中断——值得过去看一眼",
  "stories.title": "你会这样用它",
  "stories.note": "使用场景示意，非用户证言",
  "stories.night": "深夜并跑",
  "stories.night.desc": "三个 Agent 同时干活，谁卡住了托盘和手机同时知道，不用挨个终端巡检。",
  "stories.out": "出门在外",
  "stories.out.desc": "地铁上手机点一下「允许」，家里的 Agent 继续跑，人离开桌面不停工。",
  "stories.billing": "周末复盘",
  "stories.billing.desc": "打开用量账本，这个月钱花在哪个模型、哪个项目，一目了然。",
  "features.title": "指挥台的四块仪表",
  "features.board": "会话看板",
  "features.board.desc": "8 种 AI 编程工具的红绿灯看板：运行、等待、中断，卡片直达终端或 App。",
  "features.remote": "远程操控",
  "features.remote.desc": "手机上看状态、发消息、排队、远程审批、切换权限模式。",
  "features.res": "Skill · MCP · 预设",
  "features.res.desc": "统一仓库管理，一键映射到各家工具，预设组按任务快速切换。",
  "features.pet": "桌宠 + 用量账本",
  "features.pet.desc": "Foxbell 盯状态、催审批，账本按供应商和模型记账，支持导出分享图。",
  "features.watch": "查看演示",
  "oss.title": "开源 · 本地优先 · 无遥测",
  "oss.desc": "MIT 开源，数据全部留在本机 ~/.tuvis/，不打点不上传。欢迎 Issue 与 PR。",
  "oss.repo": "GitHub 仓库",
  "dl.title": "免费下载",
  "dl.desc": "Windows 10+ 与 macOS 14+。安装包与自动更新随 GitHub Releases 发布。",
  "dl.win": "Windows 安装包",
  "dl.mac": "macOS 镜像",
  "dl.all": "前往 Releases 页",
  "demo.title": "交互演示",
  "demo.desc": "下面的一切都是可交互的模拟——点一点，感受兔维斯的操作方式。",
  "demo.replay": "重播剧本",
  "demo.takeover": "已接管：随意点，剧本已暂停",
  "demo.open": "打开完整演示",
  "demo.d1": "会话看板",
  "demo.d2": "远程操控",
  "demo.d3": "资源管理",
  "demo.d4": "桌宠与账本",
  "demo.caption.waiting": "Claude Code 停下来等你批准——看板变黄",
  "demo.caption.notify": "桌面通知弹出，点一下直达终端",
  "demo.caption.running": "批准！卡片转绿，任务继续",
  "demo.caption.done": "试试点别的卡片和筛选器",
  "demo.phone.banner": "Claude Code 计划待批准",
  "demo.phone.approve": "允许",
  "demo.phone.queued": "已排队",
  "demo.phone.detail": "查看会话",
  "res.scan": "重新扫描",
  "res.context": "不勾选 = 不加载 = 干净上下文；技能仍保留在主仓库",
  "res.preset": "预设组",
  "res.health": "一致性体检",
  "pet.call": "唤出贝贝",
  "pet.voice": "播放语音",
  "pet.usage": "用量",
  "pet.detail": "详情",
  "pet.share": "导出分享图",
  "usage.title": "Token 用量账本",
  "usage.total": "本月消耗",
  "usage.bySupplier": "按供应商",
  "usage.byModel": "按模型",
  "docs.title": "快速上手",
  "docs.step1": "下载并安装（见首页下载按钮，Windows 10+ / macOS 14+）",
  "docs.step2": "首次启动：在终端工具里信任兔维斯的 hook 条目",
  "docs.step3": "打开兔维斯，勾选你要监控的编程工具",
  "docs.step4": "手机连上远程看板（设置 → 远程接入 → 扫码）",
  "docs.next": "更多细节见 GitHub README，或先去",
  "docs.nextDemo": "交互演示",
  "docs.play": "玩一玩",
  "log.title": "更新日志",
  "log.enNote": "内容以中文维护，以下为原文。",
  "footer.slogan": "人离开桌面，Agent 不停工",
  "footer.right": "MIT License · 与 Anthropic / OpenAI / 月之暗面等无关联",
  "footer.lang": "语言"
}
```

- [x] **Step 2.2: 写 src/i18n/en.json（key 与 zh 完全一致）**

```json
{
  "nav.features": "Features",
  "nav.demo": "Demo",
  "nav.docs": "Docs",
  "nav.changelog": "Changelog",
  "nav.download": "Download",
  "hero.badge": "Open source · Desktop · Mobile remote",
  "hero.title": "Tuvis",
  "hero.subtitle": "Your desktop multi-agent command deck",
  "hero.desc": "See and steer every AI agent from one board — session states, remote message injection, Skill/MCP/preset management, and a usage ledger, from desktop to phone.",
  "hero.cta": "Download free",
  "hero.github": "GitHub repo",
  "states.title": "Its lamp is your agent's state",
  "states.desc": "The carrot lamp on the chest mirrors session state in real time — readable from a meter away.",
  "states.green": "Running — making progress",
  "states.yellow": "Waiting approval — needs your call",
  "states.red": "Interrupted — worth a look",
  "stories.title": "How you'd use it",
  "stories.note": "Illustrative scenarios, not testimonials",
  "stories.night": "Night shift",
  "stories.night.desc": "Three agents working in parallel; the tray and your phone know the moment one stalls — no terminal hopping.",
  "stories.out": "Out and about",
  "stories.out.desc": "Tap Allow on your phone on the subway; the agent at home keeps running.",
  "stories.billing": "Weekend review",
  "stories.billing.desc": "Open the ledger: which model, which project consumed this month's budget.",
  "features.title": "Four gauges on the deck",
  "features.board": "Session board",
  "features.board.desc": "A red/green board for 8 AI coding tools: running, waiting, interrupted. Cards jump to the terminal or app.",
  "features.remote": "Remote control",
  "features.remote.desc": "Check states, send messages, queue, approve remotely, switch permission modes from your phone.",
  "features.res": "Skill · MCP · Presets",
  "features.res.desc": "One repository mapped onto every tool; preset groups switch per task.",
  "features.pet": "Pet + usage ledger",
  "features.pet.desc": "Foxbell watches states and nudges approvals; the ledger tracks spend by supplier and model with shareable exports.",
  "features.watch": "Watch demo",
  "oss.title": "Open source · Local first · No telemetry",
  "oss.desc": "MIT licensed. All data stays in ~/.tuvis/ on your machine. Issues and PRs welcome.",
  "oss.repo": "GitHub repo",
  "dl.title": "Download free",
  "dl.desc": "Windows 10+ and macOS 14+. Installers and auto-updates ship via GitHub Releases.",
  "dl.win": "Windows installer",
  "dl.mac": "macOS image",
  "dl.all": "All releases",
  "demo.title": "Interactive demo",
  "demo.desc": "Everything below is a clickable simulation — poke around to feel how Tuvis works.",
  "demo.replay": "Replay script",
  "demo.takeover": "Taken over: script paused, click freely",
  "demo.open": "Open full demo",
  "demo.d1": "Session board",
  "demo.d2": "Remote control",
  "demo.d3": "Resources",
  "demo.d4": "Pet & ledger",
  "demo.caption.waiting": "Claude Code pauses for approval — card turns amber",
  "demo.caption.notify": "A desktop notification pops — click to jump to the terminal",
  "demo.caption.running": "Approved! Card turns green, work resumes",
  "demo.caption.done": "Try other cards and the filter chips",
  "demo.phone.banner": "Claude Code plan awaiting approval",
  "demo.phone.approve": "Allow",
  "demo.phone.queued": "Queued",
  "demo.phone.detail": "Open session",
  "res.scan": "Rescan",
  "res.context": "Unchecked = not loaded = clean context; skills stay in the main repo",
  "res.preset": "Preset groups",
  "res.health": "Consistency check",
  "pet.call": "Call Foxbell",
  "pet.voice": "Play voice",
  "pet.usage": "Usage",
  "pet.detail": "Details",
  "pet.share": "Export share card",
  "usage.title": "Token usage ledger",
  "usage.total": "This month",
  "usage.bySupplier": "By supplier",
  "usage.byModel": "By model",
  "docs.title": "Quick start",
  "docs.step1": "Download and install (buttons on the home page; Windows 10+ / macOS 14+)",
  "docs.step2": "First launch: trust the Tuvis hook entry inside your terminal tool",
  "docs.step3": "Open Tuvis and tick the coding tools you want to monitor",
  "docs.step4": "Pair your phone (Settings → Remote access → scan QR)",
  "docs.next": "More details in the GitHub README, or first play with the",
  "docs.nextDemo": "interactive demo",
  "docs.play": "here",
  "log.title": "Changelog",
  "log.enNote": "Entries are maintained in Chinese; shown verbatim below.",
  "footer.slogan": "Humans leave the desk; agents keep working",
  "footer.right": "MIT License · Not affiliated with Anthropic / OpenAI / Moonshot AI",
  "footer.lang": "Language"
}
```

- [x] **Step 2.3: 写 src/i18n/index.ts**

```ts
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import zh from "./zh.json";
import en from "./en.json";

export const LANGS = ["zh", "en"] as const;
export type Lang = (typeof LANGS)[number];

i18n.use(initReactI18next).init({
  resources: { zh: { translation: zh }, en: { translation: en } },
  lng: "zh",
  fallbackLng: "zh",
  interpolation: { escapeValue: false },
});

export function applyLang(l: Lang): void {
  i18n.changeLanguage(l);
  document.documentElement.lang = l === "zh" ? "zh-CN" : "en";
}
```

- [x] **Step 2.4: 写 src/i18n/parity.test.ts**

```ts
import { describe, expect, it } from "vitest";
import zh from "./zh.json";
import en from "./en.json";

describe("i18n parity", () => {
  it("en 的 key 集合与 zh 完全一致", () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(zh).sort());
  });
  it("没有空值", () => {
    for (const [k, v] of Object.entries(zh)) expect(v.trim()).not.toBe("");
    for (const [k, v] of Object.entries(en)) expect(v.trim()).not.toBe("");
  });
});
```

- [x] **Step 2.5: 运行 + Commit**

```bash
pnpm test   # Expected: theme 3 + parity 2 = 5 passed
git add -A && git commit -m "feat: i18next zh/en resources with parity test"
```

---

### Task 3: 路由 + GH Pages 404 兜底 + 布局壳

**Files:**
- Create: `src/router.tsx` `src/components/layout/LangLayout.tsx` `src/components/layout/TopBar.tsx` `src/components/layout/Footer.tsx` `src/components/LanguageSwitcher.tsx` `scripts/make-404.mjs`
- Modify: `src/main.tsx`

- [x] **Step 3.1: 写 src/router.tsx**

```tsx
import { createBrowserRouter, Navigate } from "react-router";
import { LangLayout } from "@/components/layout/LangLayout";
import Home from "@/pages/Home";
import DemoPage from "@/pages/DemoPage";
import DocsPage from "@/pages/DocsPage";
import ChangelogPage from "@/pages/ChangelogPage";

export const BASE = import.meta.env.BASE_URL.replace(/\/$/, ""); // "/tuvis-website"

export const router = createBrowserRouter(
  [
    { path: "/", element: <Navigate to="/zh" replace /> },
    {
      path: "/:lang",
      element: <LangLayout />,
      children: [
        { index: true, element: <Home /> },
        { path: "demo", element: <DemoPage /> },
        { path: "docs", element: <DocsPage /> },
        { path: "changelog", element: <ChangelogPage /> },
      ],
    },
    { path: "*", element: <Navigate to="/zh" replace /> },
  ],
  { basename: BASE },
);
```

- [x] **Step 3.2: 写 LangLayout（校验 lang、应用语言）**

```tsx
import { useEffect } from "react";
import { Navigate, Outlet, useParams } from "react-router";
import { applyLang, LANGS, type Lang } from "@/i18n";
import { TopBar } from "./TopBar";
import { Footer } from "./Footer";

export function LangLayout() {
  const { lang } = useParams();
  if (!LANGS.includes(lang as Lang)) return <Navigate to="/zh" replace />;
  useEffect(() => applyLang(lang as Lang), [lang]);
  return (
    <div className="min-h-screen">
      <TopBar />
      <Outlet />
      <Footer />
    </div>
  );
}
```

- [x] **Step 3.3: 写 TopBar / LanguageSwitcher / Footer**

`src/components/layout/TopBar.tsx`:

```tsx
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export function TopBar() {
  const { t } = useTranslation();
  return (
    <nav className="sticky top-0 z-20 border-b border-line bg-surface/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-5">
        <Link to="/zh" className="flex items-center gap-2 font-bold">
          <img src="img/appicon-dark.png" alt="Tuvis" className="h-7 w-7 rounded-lg" />
          兔维斯 <span className="text-inkdim">Tuvis</span>
        </Link>
        <div className="flex items-center gap-5 text-sm text-inkdim">
          <Link to="?#" onClick={(e) => { e.preventDefault(); document.getElementById("features")?.scrollIntoView({ behavior: "smooth" }); }} className="hover:text-ink">{t("nav.features")}</Link>
          <Link to="demo" className="hover:text-ink">{t("nav.demo")}</Link>
          <Link to="docs" className="hover:text-ink">{t("nav.docs")}</Link>
          <Link to="changelog" className="hover:text-ink">{t("nav.changelog")}</Link>
          <LanguageSwitcher />
          <ThemeToggle />
          <Link to="#download" onClick={(e) => { e.preventDefault(); document.getElementById("download")?.scrollIntoView({ behavior: "smooth" }); }}
            className="rounded-lg bg-ok px-3 py-1.5 font-semibold text-white dark:text-navy">
            {t("nav.download")}
          </Link>
        </div>
      </div>
    </nav>
  );
}
```

`src/components/LanguageSwitcher.tsx`:

```tsx
import { useLocation, useNavigate, useParams } from "react-router";
import { LANGS, type Lang } from "@/i18n";

export function LanguageSwitcher() {
  const { lang } = useParams();
  const nav = useNavigate();
  const loc = useLocation();
  const cur = (LANGS.includes(lang as Lang) ? lang : "zh") as Lang;
  const other: Lang = cur === "zh" ? "en" : "zh";
  return (
    <button
      aria-label="switch language"
      className="rounded-lg border border-line px-2 py-1 text-xs uppercase hover:opacity-70"
      onClick={() => nav(loc.pathname.replace(`/${cur}`, `/${other}`) + loc.search)}
    >
      {other === "zh" ? "中文" : "EN"}
    </button>
  );
}
```

`src/components/layout/Footer.tsx`:

```tsx
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="border-t border-line py-8 text-sm text-inkdim">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-5">
        <span>🥕 {t("footer.slogan")} · © 2026 Tuvis</span>
        <span className="flex items-center gap-4">
          <a href="https://github.com/jarvislee90s-dot/tuvis" target="_blank" rel="noopener noreferrer" className="hover:text-ink">GitHub</a>
          <span>{t("footer.right")}</span>
          <LanguageSwitcher />
        </span>
      </div>
    </footer>
  );
}
```

- [x] **Step 3.4: 占位页面 ×4（P1/P2/P5 逐个替换）**

`src/pages/Home.tsx`:

```tsx
export default function Home() {
  return <main className="mx-auto max-w-5xl px-5 py-16">Home — P1</main>;
}
```

`src/pages/DemoPage.tsx` / `DocsPage.tsx` / `ChangelogPage.tsx`: 同构，把文案换成 `Demo — P2` / `Docs — P5` / `Changelog — P5`，均为 `export default function X()`。

- [x] **Step 3.5: main.tsx 接路由 + 404 重定向恢复**

`src/main.tsx` 最终形态：

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router";
import { applyTheme, getTheme } from "@/theme";
import { router, BASE } from "@/router";
import "./index.css";

applyTheme(getTheme());

// GH Pages 404 兜底：404.html 把原始地址存进 sessionStorage 再跳回根
const redirected = sessionStorage.getItem("tuvis-redirect");
if (redirected) {
  sessionStorage.removeItem("tuvis-redirect");
  const u = new URL(redirected);
  const route = u.pathname.startsWith(BASE) ? u.pathname.slice(BASE.length) || "/" : u.pathname;
  history.replaceState(null, "", route + u.search + u.hash);
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
```

`scripts/make-404.mjs`:

```js
import { readFileSync, writeFileSync } from "node:fs";
let html = readFileSync("dist/index.html", "utf8");
const inject = `<script>sessionStorage.setItem("tuvis-redirect", location.href);location.replace("${import.meta?.env?.BASE_URL ?? "/tuvis-website/"}");</script>`;
html = html.replace("<head>", "<head>" + inject);
writeFileSync("dist/404.html", html);
console.log("dist/404.html written");
```

> 注意：make-404.mjs 是纯 node 脚本，没有 import.meta.env，BASE 写死 `/tuvis-website/`（与仓库/部署名绑定；改名需同步）。

- [x] **Step 3.6: 验证 + Commit**

```bash
pnpm build   # Expected: tsc 无错、dist/404.html 生成
pnpm preview # http://localhost:4173/tuvis-website/ → 重定向 /zh；顶栏/页脚/语言/主题可用；直接访问 /tuvis-website/en/demo 可达
git add -A && git commit -m "feat: i18n routing with GH Pages 404 fallback and layout shell"
```

---

## P1 · 首页七区块

### Task 4: 资产拷贝 + Hero + 三态卡

**Files:**
- Create: `public/img/*`（拷贝）`src/components/Reveal.tsx` `src/components/SectionTitle.tsx`
- Create: `src/home/Hero.tsx` `src/home/StatesSection.tsx`
- Modify: `src/pages/Home.tsx`

- [x] **Step 4.1: 拷贝定稿素材到 public/**

```bash
mkdir -p public/img
cp "brand/final/extracted/13-appicon-dark.png" public/img/appicon-dark.png
cp "brand/final/extracted/14-appicon-light.png" public/img/appicon-light.png
cp "brand/final/extracted/21-hero-cutout.png"  public/img/hero-cutout.png
cp "brand/final/extracted/10-state-green.png"  public/img/state-green.png
cp "brand/final/extracted/11-state-yellow.png" public/img/state-yellow.png
cp "brand/final/extracted/12-state-red.png"    public/img/state-red.png
```

- [x] **Step 4.2: 写 Reveal 与 SectionTitle**

`src/components/Reveal.tsx`:

```tsx
import { motion } from "framer-motion";
import type { ReactNode } from "react";

export function Reveal({ children }: { children: ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
      {children}
    </motion.div>
  );
}
```

`src/components/SectionTitle.tsx`:

```tsx
import { useTranslation } from "react-i18next";

export function SectionTitle({ tKey, sub }: { tKey: string; sub?: string }) {
  const { t } = useTranslation();
  return (
    <div className="mb-10 text-center">
      <h2 className="text-2xl font-bold md:text-3xl">{t(tKey)}</h2>
      {sub && <p className="mt-2 text-inkdim">{t(sub)}</p>}
    </div>
  );
}
```

- [x] **Step 4.3: 写 src/home/Hero.tsx**

```tsx
import { useTranslation } from "react-i18next";
import { Reveal } from "@/components/Reveal";

export function Hero() {
  const { t } = useTranslation();
  return (
    <Reveal>
      <section className="grid items-center gap-10 py-16 md:grid-cols-[1.15fr_1fr] md:py-24">
        <div>
          <span className="inline-block rounded-full border border-line px-4 py-1 text-sm text-hud">{t("hero.badge")}</span>
          <h1 className="mt-5 text-4xl font-bold tracking-tight md:text-5xl">
            {t("hero.title")} <span className="text-inkdim">Tuvis</span>
          </h1>
          <p className="mt-3 text-xl font-semibold text-ok">{t("hero.subtitle")}</p>
          <p className="mt-3 max-w-lg text-inkdim">{t("hero.desc")}</p>
          <div className="mt-7 flex gap-3">
            <a href="#download" onClick={(e) => { e.preventDefault(); document.getElementById("download")?.scrollIntoView({ behavior: "smooth" }); }}
              className="rounded-xl bg-ok px-5 py-2.5 font-semibold text-white dark:text-navy">{t("hero.cta")}</a>
            <a href="https://github.com/jarvislee90s-dot/tuvis" target="_blank" rel="noopener noreferrer"
              className="rounded-xl border border-line px-5 py-2.5 font-semibold hover:border-hud">{t("hero.github")}</a>
          </div>
        </div>
        <img src="img/hero-cutout.png" alt="Tuvis mascot" className="mx-auto max-h-[420px] rounded-3xl bg-card p-4 shadow-2xl" />
      </section>
    </Reveal>
  );
}
```

- [x] **Step 4.4: 写 src/home/StatesSection.tsx**

```tsx
import { useTranslation } from "react-i18next";
import { Reveal } from "@/components/Reveal";
import { SectionTitle } from "@/components/SectionTitle";

const STATES = [
  { img: "img/state-green.png", dot: "bg-ok", k: "states.green" },
  { img: "img/state-yellow.png", dot: "bg-warn", k: "states.yellow" },
  { img: "img/state-red.png", dot: "bg-bad", k: "states.red" },
] as const;

export function StatesSection() {
  const { t } = useTranslation();
  return (
    <Reveal>
      <section className="py-16">
        <SectionTitle tKey="states.title" sub="states.desc" />
        <div className="grid gap-5 md:grid-cols-3">
          {STATES.map((s) => (
            <figure key={s.k} className="overflow-hidden rounded-2xl border border-line bg-card text-center">
              <img src={s.img} alt={t(s.k)} className="w-full bg-white" />
              <figcaption className="p-4 text-sm">
                <span className={`mr-2 inline-block h-2.5 w-2.5 rounded-full ${s.dot}`} />
                {t(s.k)}
              </figcaption>
            </figure>
          ))}
        </div>
      </section>
    </Reveal>
  );
}
```

- [x] **Step 4.5: 接入 Home 并验证**

`src/pages/Home.tsx`:

```tsx
import { Hero } from "@/home/Hero";
import { StatesSection } from "@/home/StatesSection";

export default function Home() {
  return (
    <main className="mx-auto max-w-5xl px-5">
      <Hero />
      <StatesSection />
    </main>
  );
}
```

```bash
pnpm dev   # 验证：hero 图、三态卡渲染；亮暗切换正常；中英切换文案变化
git add -A && git commit -m "feat(home): hero and state-lamp sections"
```

---

### Task 5: 场景故事 + 四功能卡 + 开源区 + 下载 CTA（平台检测 TDD）

**Files:**
- Create: `src/utils/download.ts` `src/utils/download.test.ts`
- Create: `src/home/{StoriesSection,FeaturesSection,OpenSource,DownloadCta}.tsx`
- Modify: `src/pages/Home.tsx`

- [x] **Step 5.1: 写失败测试 src/utils/download.test.ts**

```ts
import { describe, expect, it } from "vitest";
import { detectOS, matchAsset } from "./download";

const ASSETS = [
  { name: "Tuvis-0.5.5-macOS.dmg", url: "https://x/Tuvis-0.5.5-macOS.dmg" },
  { name: "Tuvis-0.5.5-Windows-x64-setup.exe", url: "https://x/Tuvis-0.5.5-Windows-x64-setup.exe" },
  { name: "latest.json", url: "https://x/latest.json" },
];

describe("download", () => {
  it("detectOS 识别三大平台 UA", () => {
    expect(detectOS("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15)")).toBe("macos");
    expect(detectOS("Mozilla/5.0 (Windows NT 10.0)")).toBe("windows");
    expect(detectOS("Mozilla/5.0 (X11; Linux)")).toBe("other");
  });
  it("matchAsset 按平台匹配安装包", () => {
    expect(matchAsset(ASSETS, "macos")).toBe(ASSETS[0].url);
    expect(matchAsset(ASSETS, "windows")).toBe(ASSETS[1].url);
    expect(matchAsset(ASSETS, "other")).toBeNull();
  });
});
```

- [x] **Step 5.2: 运行验证失败 → 实现 src/utils/download.ts → 验证通过**

```ts
export type OS = "macos" | "windows" | "other";

export function detectOS(ua: string = navigator.userAgent): OS {
  if (/Mac OS X/i.test(ua)) return "macos";
  if (/Windows/i.test(ua)) return "windows";
  return "other";
}

export function matchAsset(
  assets: { name: string; url: string }[],
  os: OS,
): string | null {
  const pat = os === "macos" ? /\.dmg$/i : os === "windows" ? /setup\.exe$/i : null;
  if (!pat) return null;
  return assets.find((a) => pat.test(a.name))?.url ?? null;
}
```

```bash
pnpm test -- src/utils/download.test.ts   # Expected: 2 passed
```

- [x] **Step 5.3: 写三个静态区块组件**

`src/home/StoriesSection.tsx`:

```tsx
import { useTranslation } from "react-i18next";
import { Reveal } from "@/components/Reveal";
import { SectionTitle } from "@/components/SectionTitle";

const STORIES = [
  { icon: "🌙", t: "stories.night", d: "stories.night.desc" },
  { icon: "🚇", t: "stories.out", d: "stories.out.desc" },
  { icon: "📊", t: "stories.billing", d: "stories.billing.desc" },
] as const;

export function StoriesSection() {
  const { t } = useTranslation();
  return (
    <Reveal>
      <section className="py-16">
        <SectionTitle tKey="stories.title" />
        <p className="-mt-6 mb-8 text-center text-xs text-inkdim">{t("stories.note")}</p>
        <div className="grid gap-5 md:grid-cols-3">
          {STORIES.map((s) => (
            <div key={s.t} className="rounded-2xl border border-line bg-card p-6">
              <div className="text-2xl">{s.icon}</div>
              <h3 className="mt-3 font-semibold">{t(s.t)}</h3>
              <p className="mt-2 text-sm text-inkdim">{t(s.d)}</p>
            </div>
          ))}
        </div>
      </section>
    </Reveal>
  );
}
```

`src/home/FeaturesSection.tsx`:

```tsx
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { Reveal } from "@/components/Reveal";
import { SectionTitle } from "@/components/SectionTitle";

const FEATURES = [
  { icon: "📋", t: "features.board", d: "features.board.desc", to: "d1" },
  { icon: "🛰️", t: "features.remote", d: "features.remote.desc", to: "d2" },
  { icon: "🧩", t: "features.res", d: "features.res.desc", to: "d3" },
  { icon: "🦊", t: "features.pet", d: "features.pet.desc", to: "d4" },
] as const;

export function FeaturesSection() {
  const { t } = useTranslation();
  return (
    <Reveal>
      <section id="features" className="py-16">
        <SectionTitle tKey="features.title" />
        <div className="grid gap-5 md:grid-cols-2">
          {FEATURES.map((f) => (
            <div key={f.to} className="rounded-2xl border border-line bg-card p-6">
              <div className="text-2xl">{f.icon}</div>
              <h3 className="mt-3 font-semibold">{t(f.t)}</h3>
              <p className="mt-2 text-sm text-inkdim">{t(f.d)}</p>
              <Link to={`/demo#${f.to}`} className="mt-4 inline-block text-sm text-hud hover:underline">
                {t("features.watch")} →
              </Link>
            </div>
          ))}
        </div>
      </section>
    </Reveal>
  );
}
```

`src/home/OpenSource.tsx`:

```tsx
import { useTranslation } from "react-i18next";
import { Reveal } from "@/components/Reveal";

export function OpenSource() {
  const { t } = useTranslation();
  return (
    <Reveal>
      <section className="py-16">
        <div className="flex flex-wrap items-center justify-between gap-6 rounded-2xl border border-line bg-card p-8">
          <div>
            <h2 className="text-xl font-bold">{t("oss.title")}</h2>
            <p className="mt-2 max-w-xl text-sm text-inkdim">{t("oss.desc")}</p>
          </div>
          <a href="https://github.com/jarvislee90s-dot/tuvis" target="_blank" rel="noopener noreferrer"
            className="rounded-xl border border-line px-5 py-2.5 font-semibold hover:border-hud">{t("oss.repo")}</a>
        </div>
      </section>
    </Reveal>
  );
}
```

- [x] **Step 5.4: 写 src/home/DownloadCta.tsx（平台检测直链 + 兜底）**

```tsx
import { useTranslation } from "react-i18next";
import { Reveal } from "@/components/Reveal";
import { detectOS, matchAsset, type OS } from "@/utils/download";

const REPO = "https://github.com/jarvislee90s-dot/tuvis";
const LATEST = `${REPO}/releases/latest`;
const API = "https://api.github.com/repos/jarvislee90s-dot/tuvis/releases/latest";

async function goToInstaller(os: OS): Promise<void> {
  try {
    const res = await fetch(API, { headers: { Accept: "application/vnd.github+json" } });
    if (!res.ok) throw new Error(String(res.status));
    const data = (await res.json()) as { assets: { name: string; browser_download_url: string }[] };
    const url = matchAsset(data.assets, os);
    if (!url) throw new Error("asset not found");
    location.href = url;
  } catch {
    window.open(LATEST, "_blank", "noopener");
  }
}

export function DownloadCta() {
  const { t } = useTranslation();
  const os: OS = detectOS();
  return (
    <Reveal>
      <section id="download" className="py-16">
        <div className="rounded-3xl border border-line bg-card p-10 text-center">
          <h2 className="text-2xl font-bold">{t("dl.title")}</h2>
          <p className="mt-2 text-inkdim">{t("dl.desc")}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button onClick={() => goToInstaller("windows")}
              className="rounded-xl bg-ok px-6 py-3 font-semibold text-white dark:text-navy">{t("dl.win")}</button>
            <button onClick={() => goToInstaller("macos")}
              className="rounded-xl bg-ok px-6 py-3 font-semibold text-white dark:text-navy">{t("dl.mac")}</button>
            <a href={LATEST} target="_blank" rel="noopener noreferrer"
              className="rounded-xl border border-line px-6 py-3 font-semibold hover:border-hud">{t("dl.all")}</a>
          </div>
          <p className="mt-4 text-xs text-inkdim">
            {os === "other" ? "" : os === "macos" ? "↓ macOS" : "↓ Windows"}
          </p>
        </div>
      </section>
    </Reveal>
  );
}
```

- [x] **Step 5.5: Home 组装全部 + 验证 + Commit**

`src/pages/Home.tsx`:

```tsx
import { Hero } from "@/home/Hero";
import { StatesSection } from "@/home/StatesSection";
import { StoriesSection } from "@/home/StoriesSection";
import { FeaturesSection } from "@/home/FeaturesSection";
import { OpenSource } from "@/home/OpenSource";
import { DownloadCta } from "@/home/DownloadCta";

export default function Home() {
  return (
    <main className="mx-auto max-w-5xl px-5">
      <Hero />
      <StatesSection />
      <StoriesSection />
      <FeaturesSection />
      <OpenSource />
      <DownloadCta />
    </main>
  );
}
```

```bash
pnpm test   # Expected: 全部通过
pnpm dev    # 验证：六区块渲染；下载按钮点击打开 GitHub Latest（API 失败时兜底也走 Latest）
git add -A && git commit -m "feat(home): stories/features/oss/download with platform detection"
```

---

### Task 6: favicon 与 og 底图生成

**Files:**
- Create: `public/favicon.png` `public/apple-touch-icon.png`
- Modify: `index.html`（head 补 link）

- [x] **Step 6.1: 拷贝现成 favicon（已存在于 brand/）**

```bash
cp "brand/tuvis-favicon-64.png" public/favicon.png
cp "brand/tuvis-favicon-64.png" public/apple-touch-icon.png
```

> `brand/tuvis-favicon-64.png` 为 64px 定稿版（主仓 ICON-CHECKLIST B 节同源）。apple-touch 用 64px 上采样即可接受；如需更清晰，可改用 `brand/final/extracted/13-appicon-dark.png` 缩放：
> ```bash
> python -c "from PIL import Image; Image.open('brand/final/extracted/13-appicon-dark.png').convert('RGBA').resize((180,180), Image.LANCZOS).save('public/apple-touch-icon.png')"
> ```

- [x] **Step 6.2: index.html head 补齐**

在 `<link rel="icon" ...>` 之后加：

```html
    <link rel="apple-touch-icon" href="/tuvis-website/apple-touch-icon.png" />
```

- [x] **Step 6.3: 验证 + Commit**

```bash
pnpm build && pnpm preview   # 标签页图标显示深色兔头
git add -A && git commit -m "chore: favicon and touch icon from final app icon"
```

---

## P2 · Demo 引擎与会话看板

### Task 7: Demo 引擎（tools/seed/store/player，TDD）

**Files:**
- Create: `src/demo/{types.ts,tools.ts,seed.ts,store.ts,player.ts}` `src/demo/player.test.ts`

- [x] **Step 7.1: 写 src/demo/types.ts 与 tools.ts**

```ts
// types.ts
export type SessionState = "running" | "waiting" | "idle";
export interface Session {
  id: string;
  tool: string;      // tools.ts 的 key
  project: string;
  branch: string;
  preview: string;
  minutes: number;
  state: SessionState;
}
export interface Step {
  wait: number;                       // 距上一步的毫秒数
  caption?: { zh: string; en: string };
  run?: () => void;                   // 对 store 的副作用
}
```

```ts
// tools.ts —— 色值来自主仓 docs/design/tool-color-ledger.md（唯一权威表）
export interface ToolMeta { key: string; label: string; color: string; ringInDark?: boolean }
export const TOOLS: ToolMeta[] = [
  { key: "claude", label: "Claude Code", color: "#D97757" },
  { key: "codex", label: "Codex", color: "#10A37F" },
  { key: "opencode", label: "OpenCode", color: "#6B6B6B" },
  { key: "openclaw", label: "OpenClaw", color: "#D2453C" },
  { key: "kimi", label: "Kimi Code", color: "#0B0E1A", ringInDark: true },
  { key: "workbuddy", label: "WorkBuddy", color: "#4AD06A" },
  { key: "zcode", label: "ZCode", color: "#141413", ringInDark: true },
  { key: "dsh", label: "dsh", color: "#4D6BFE" },
];
export const toolOf = (key: string): ToolMeta => TOOLS.find((t) => t.key === key)!;
```

- [x] **Step 7.2: 写 src/demo/seed.ts**

```ts
import type { Session } from "./types";

export function seedSessions(): Record<string, Session> {
  const list: Session[] = [
    { id: "claude", tool: "claude", project: "tuvis-app", branch: "feat/remote-approve", preview: "plan: add remote approve flow…", minutes: 32, state: "running" },
    { id: "codex", tool: "codex", project: "tuvis-site", branch: "main", preview: "refactor: nav layout", minutes: 12, state: "running" },
    { id: "kimi", tool: "kimi", project: "tuvis-app", branch: "fix/hook-trust", preview: "fix: trust dialog flake", minutes: 47, state: "idle" },
    { id: "workbuddy", tool: "workbuddy", project: "landing", branch: "main", preview: "copy: hero section", minutes: 5, state: "running" },
    { id: "zcode", tool: "zcode", project: "quant-chart", branch: "dev", preview: "feat: candle tooltip", minutes: 21, state: "idle" },
  ];
  return Object.fromEntries(list.map((s) => [s.id, s]));
}
```

- [x] **Step 7.3: 写 src/demo/store.ts**

```ts
import { create } from "zustand";
import type { Session, SessionState } from "./types";
import { seedSessions } from "./seed";

interface DemoState {
  sessions: Record<string, Session>;
  filter: string | null;                 // null = 全部
  setFilter: (tool: string | null) => void;
  setSession: (id: string, patch: Partial<Pick<Session, "state" | "preview" | "minutes">>) => void;
}

export const useDemo = create<DemoState>((set) => ({
  sessions: seedSessions(),
  filter: null,
  setFilter: (tool) => set({ filter: tool }),
  setSession: (id, patch) =>
    set((s) => ({ sessions: { ...s.sessions, [id]: { ...s.sessions[id], ...patch } } })),
}));

export const setStateOf = (id: string, state: SessionState) =>
  useDemo.getState().setSession(id, { state });
```

- [x] **Step 7.4: 写失败测试 src/demo/player.test.ts**

```ts
import { describe, expect, it } from "vitest";
import { useDemo, setStateOf } from "./store";
import { d1Steps } from "./steps-d1";

describe("d1 script", () => {
  it("整条剧本跑完：claude 最终 running，字幕条数与步骤一致", () => {
    useDemo.setState({ sessions: seedSessionsOf() });
    for (const s of d1Steps) s.run?.();
    expect(useDemo.getState().sessions.claude.state).toBe("running");
    expect(d1Steps.filter((s) => s.caption).length).toBeGreaterThanOrEqual(3);
  });
  it("setStateOf 更新 store", () => {
    useDemo.setState({ sessions: seedSessionsOf() });
    setStateOf("codex", "waiting");
    expect(useDemo.getState().sessions.codex.state).toBe("waiting");
  });
});

function seedSessionsOf() {
  // 直接复用 seed，避免测试间状态泄漏
  return seedSessions();
}
import { seedSessions } from "./seed";
```

> 顶部 import 放文件底部不符合惯例——把 `import { seedSessions } from "./seed";` 与其他 import 合并放到文件顶部，`seedSessionsOf` 仅做 `return seedSessions()`。

- [x] **Step 7.5: 运行验证失败 → 写 src/demo/steps-d1.ts → 通过**

```ts
// steps-d1.ts
import type { Step } from "./types";
import { setStateOf, useDemo } from "./store";

export const d1Steps: Step[] = [
  { wait: 800, caption: { zh: "多工具看板：谁在干活一眼全清", en: "One board for every tool" } },
  { wait: 1800, run: () => setStateOf("claude", "waiting"),
    caption: { zh: "Claude Code 停下来等你批准——看板变黄", en: "Claude Code pauses for approval — card turns amber" } },
  { wait: 2000, caption: { zh: "桌面通知弹出，点一下直达终端", en: "Desktop notification pops — click to jump to the terminal" } },
  { wait: 2000, run: () => setStateOf("claude", "running"),
    caption: { zh: "批准！卡片转绿，任务继续", en: "Approved! Card turns green, work resumes" } },
  { wait: 1800, run: () => setStateOf("codex", "waiting"),
    caption: { zh: "Codex 也进入等待——手机上同样看得到", en: "Codex waits too — visible on your phone" } },
  { wait: 2000, run: () => setStateOf("codex", "running"),
    caption: { zh: "试试点别的卡片和筛选器", en: "Try other cards and the filter chips" } },
];

export function d1Captions(): { zh: string; en: string }[] {
  void useDemo; // 保持 store 引用（剧本运行依赖 store 单例）
  return d1Steps.filter((s) => s.caption).map((s) => s.caption!);
}
```

```bash
pnpm test -- src/demo/player.test.ts   # Expected: 2 passed
```

- [x] **Step 7.6: 写 src/demo/player.ts（自动播放 Hook）**

```ts
import { useEffect, useState } from "react";
import type { Step } from "./types";

export function useScriptPlayer(steps: Step[], active = true) {
  const [i, setI] = useState(-1);
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    if (!active || !playing) return;
    if (i >= steps.length - 1) {
      const t = setTimeout(() => { setI(-1); setPlaying(true); }, 3000);
      return () => clearTimeout(t);
    }
    const next = i + 1;
    const t = setTimeout(() => { steps[next].run?.(); setI(next); }, next === 0 ? 800 : steps[next].wait);
    return () => clearTimeout(t);
  }, [i, playing, active, steps]);

  return {
    step: i,
    playing,
    caption: i >= 0 ? (steps[i]?.caption ?? null) : null,
    takeOver: () => setPlaying(false),
    replay: () => { setI(-1); setPlaying(true); },
  };
}
```

```bash
pnpm test && git add -A && git commit -m "feat(demo): zustand store, seeds, d1 script and script player"
```

---

### Task 8: D1 看板场景 + 首页内嵌 + /demo 页

**Files:**
- Create: `src/demo/{ToolChip,SessionCard,PlayerFrame}.tsx` `src/demo/scenes/BoardScene.tsx`
- Create: `src/pages/DemoPage.tsx`（替换占位） `src/home/HomeBoard.tsx`
- Modify: `src/pages/Home.tsx`

- [x] **Step 8.1: 写 ToolChip / SessionCard / PlayerFrame**

`src/demo/ToolChip.tsx`:

```tsx
import { toolOf } from "./tools";

export function ToolChip({ tool, active, onClick }: { tool: string; active: boolean; onClick: () => void }) {
  const meta = toolOf(tool);
  return (
    <button onClick={onClick}
      className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition ${
        active ? "border-hud text-ink" : "border-line text-inkdim hover:text-ink"}`}>
      <span className="inline-block h-2.5 w-2.5 rounded-full"
        style={{ background: meta.color, boxShadow: meta.ringInDark ? "0 0 0 1px rgba(255,255,255,.35)" : undefined }} />
      {meta.label}
    </button>
  );
}
```

`src/demo/SessionCard.tsx`:

```tsx
import { useTranslation } from "react-i18next";
import type { Session } from "./types";
import { toolOf } from "./tools";

const DOT = { running: "bg-ok", waiting: "bg-warn", idle: "bg-inkdim" } as const;

export function SessionCard({ s, highlight }: { s: Session; highlight: boolean }) {
  const { t } = useTranslation();
  const meta = toolOf(s.tool);
  return (
    <div className={`rounded-xl border bg-card p-3 transition ${highlight ? "border-hud shadow-lg" : "border-line"}`}>
      <div className="flex items-center gap-2">
        <span className={`h-2.5 w-2.5 rounded-full ${DOT[s.state]}`} />
        <span className="text-xs font-semibold" style={{ color: meta.color }}>{meta.label}</span>
        <span className="ml-auto text-[10px] text-inkdim">{s.minutes}m</span>
      </div>
      <div className="mt-1.5 text-sm font-medium">{s.project}</div>
      <div className="text-[10px] text-inkdim">{s.branch}</div>
      <div className="mt-1.5 truncate rounded bg-surface px-2 py-1 text-[11px] text-inkdim">{s.preview}</div>
      {s.state === "waiting" && (
        <button className="mt-2 w-full rounded-lg bg-ok py-1 text-xs font-semibold text-white dark:text-navy">
          {t("demo.phone.approve")}
        </button>
      )}
    </div>
  );
}
```

`src/demo/PlayerFrame.tsx`（剧本容器：接管检测 + 字幕 + 重播）:

```tsx
import { type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useScriptPlayer } from "./player";
import type { Step } from "./types";

export function PlayerFrame({ steps, children, id }: { steps: Step[]; children: ReactNode; id: string }) {
  const { t, i18n } = useTranslation();
  const p = useScriptPlayer(steps, true);
  return (
    <div id={id} className="scroll-mt-20"
      onPointerDown={() => p.takeOver()}>
      <div className="relative">{children}</div>
      <div className="mt-3 flex items-center justify-between gap-3 text-xs text-inkdim">
        <span data-caption>
          {p.playing ? (p.caption ? (i18n.language === "zh" ? p.caption.zh : p.caption.en) : "…") : t("demo.takeover")}
        </span>
        <button onClick={(e) => { e.stopPropagation(); p.replay(); }}
          className="rounded-lg border border-line px-2 py-1 hover:border-hud">{t("demo.replay")}</button>
      </div>
    </div>
  );
}
```

- [x] **Step 8.2: 写 src/demo/scenes/BoardScene.tsx**

```tsx
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useDemo } from "../store";
import { TOOLS } from "../tools";
import { ToolChip } from "../ToolChip";
import { SessionCard } from "../SessionCard";

export function BoardScene({ compact = false }: { compact?: boolean }) {
  const { t } = useTranslation();
  const sessions = useDemo((s) => s.sessions);
  const filter = useDemo((s) => s.filter);
  const setFilter = useDemo((s) => s.setFilter);
  const list = Object.values(sessions).filter((s) => !filter || s.tool === filter);
  const shown = compact ? list.slice(0, 3) : list;
  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <div className="mb-3 flex flex-wrap gap-2">
        {TOOLS.map((tool) => (
          <ToolChip key={tool.key} tool={tool.key} active={filter === tool.key}
            onClick={() => setFilter(filter === tool.key ? null : tool.key)} />
        ))}
      </div>
      <div className={`grid gap-3 ${compact ? "grid-cols-2 md:grid-cols-3" : "grid-cols-1 md:grid-cols-3"}`}>
        {shown.map((s) => <SessionCard key={s.id} s={s} highlight={s.state === "waiting"} />)}
      </div>
      {!compact && <p className="mt-3 text-center text-[11px] text-inkdim">{t("demo.caption.done")}</p>}
    </div>
  );
}
```

- [x] **Step 8.3: 首页内嵌（HomeBoard）与 /demo 页**

`src/home/HomeBoard.tsx`:

```tsx
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { Reveal } from "@/components/Reveal";
import { PlayerFrame } from "@/demo/PlayerFrame";
import { BoardScene } from "@/demo/scenes/BoardScene";
import { d1Steps } from "@/demo/steps-d1";

export function HomeBoard() {
  const { t } = useTranslation();
  return (
    <Reveal>
      <section className="py-16">
        <PlayerFrame steps={d1Steps} id="home-board">
          <BoardScene compact />
        </PlayerFrame>
        <p className="mt-4 text-center">
          <Link to="demo" className="text-sm text-hud hover:underline">{t("demo.open")} →</Link>
        </p>
      </section>
    </Reveal>
  );
}
```

`src/pages/DemoPage.tsx`:

```tsx
import { useTranslation } from "react-i18next";
import { PlayerFrame } from "@/demo/PlayerFrame";
import { BoardScene } from "@/demo/scenes/BoardScene";
import { d1Steps } from "@/demo/steps-d1";

export default function DemoPage() {
  const { t } = useTranslation();
  return (
    <main className="mx-auto max-w-5xl px-5 py-14">
      <h1 className="text-3xl font-bold">{t("demo.title")}</h1>
      <p className="mt-2 text-inkdim">{t("demo.desc")}</p>
      <section id="d1" className="mt-10 scroll-mt-20">
        <h2 className="mb-4 text-xl font-semibold">{t("demo.d1")}</h2>
        <PlayerFrame steps={d1Steps} id="d1-player">
          <BoardScene />
        </PlayerFrame>
      </section>
    </main>
  );
}
```

Home.tsx 在 `<StatesSection />` 后加 `<HomeBoard />`。

- [x] **Step 8.4: 验证 + Commit**

```bash
pnpm dev   # 首页内嵌看板自动播放：黄→通知→绿→Codex→绿；点击看板即接管，字幕切换"已接管"；重播恢复
pnpm test && git add -A && git commit -m "feat(demo): board scene with script player, home embed and /demo shell"
```

---

## P3 · 远程操控场景

### Task 9: D2 RemoteScene（双端同框审批闭环）

**Files:**
- Create: `src/demo/{steps-d2,PhoneFrame}.tsx` `src/demo/scenes/RemoteScene.tsx`
- Modify: `src/pages/DemoPage.tsx` `src/demo/store.ts`

- [x] **Step 9.1: store 增加远程状态**

`src/demo/store.ts` 的 `DemoState` 追加：

```ts
  remote: { banner: boolean; detail: boolean; approved: boolean };
  setRemote: (patch: Partial<DemoState["remote"]>) => void;
```

create 里追加：

```ts
  remote: { banner: false, detail: false, approved: false },
  setRemote: (patch) => set((s) => ({ remote: { ...s.remote, ...patch } })),
```

- [x] **Step 9.2: 写 src/demo/steps-d2.ts**

```ts
import type { Step } from "./types";
import { setStateOf, useDemo } from "./store";

const R = () => useDemo.getState().setRemote;

export const d2Steps: Step[] = [
  { wait: 800, run: () => { R()({ banner: false, detail: false, approved: false }); setStateOf("claude", "waiting"); },
    caption: { zh: "Claude Code 红灯：计划等你批准", en: "Claude Code waits: plan needs approval" } },
  { wait: 2200, run: () => R()({ banner: true }),
    caption: { zh: "手机弹出横幅——人不在电脑前也看得到", en: "Banner pops on your phone" } },
  { wait: 2200, run: () => R()({ detail: true }),
    caption: { zh: "点开横幅：计划全文与批准按钮", en: "Open the banner: full plan and the Allow button" } },
  { wait: 2600, run: () => { R()({ approved: true, banner: false }); setStateOf("claude", "running"); },
    caption: { zh: "手机点「允许」——桌面红灯转绿，任务继续", en: "Allow on the phone — desktop turns green" } },
  { wait: 2000, caption: { zh: "双端状态始终同步（2 秒级推送）", en: "Both ends stay in sync (~2s push)" } },
];
```

- [x] **Step 9.3: 写 src/demo/PhoneFrame.tsx 与 scenes/RemoteScene.tsx**

`src/demo/PhoneFrame.tsx`:

```tsx
import type { ReactNode } from "react";

export function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-[220px] rounded-[32px] border-2 border-line bg-card p-2 shadow-xl">
      <div className="rounded-[24px] bg-surface p-3">{children}</div>
    </div>
  );
}
```

`src/demo/scenes/RemoteScene.tsx`:

```tsx
import { useTranslation } from "react-i18next";
import { useDemo } from "../store";
import { PlayerFrame } from "../PlayerFrame";
import { PhoneFrame } from "../PhoneFrame";
import { SessionCard } from "../SessionCard";
import { d2Steps } from "../steps-d2";

export function RemoteScene() {
  const { t } = useTranslation();
  const sessions = useDemo((s) => s.sessions);
  const remote = useDemo((s) => s.remote);
  return (
    <PlayerFrame steps={d2Steps} id="d2-player">
      <div className="grid gap-6 md:grid-cols-[1fr_220px]">
        <div className="rounded-2xl border border-line bg-surface p-4">
          <div className="mb-3 text-xs font-semibold text-inkdim">Desktop</div>
          <SessionCard s={sessions.claude} highlight />
        </div>
        <PhoneFrame>
          <div className="text-[10px] font-semibold text-inkdim">Tuvis 远程</div>
          {remote.banner && !remote.detail && (
            <div className="mt-2 rounded-lg bg-warn/20 p-2 text-[11px]">{t("demo.phone.banner")}</div>
          )}
          {remote.detail && !remote.approved && (
            <div className="mt-2 space-y-2">
              <div className="rounded-lg border border-line bg-card p-2 text-[11px]">{t("demo.phone.detail")}</div>
              <button className="w-full rounded-lg bg-ok py-1.5 text-xs font-semibold text-white dark:text-navy"
                onClick={() => d2Steps[3].run?.()}>
                {t("demo.phone.approve")}
              </button>
            </div>
          )}
          {remote.approved && (
            <div className="mt-2 rounded-lg bg-ok/15 p-2 text-[11px] text-ok">✓ {t("demo.caption.running")}</div>
          )}
          {!remote.approved && <SessionCard s={sessions.claude} highlight={false} />}
        </PhoneFrame>
      </div>
    </PlayerFrame>
  );
}
```

- [x] **Step 9.4: DemoPage 挂载 + 验证 + Commit**

DemoPage 在 d1 区块后追加：

```tsx
      <section id="d2" className="mt-10 scroll-mt-20">
        <h2 className="mb-4 text-xl font-semibold">{t("demo.d2")}</h2>
        <RemoteScene />
      </section>
```

```bash
pnpm dev   # 验证：剧本走完 横幅→详情→允许→双端转绿；手动点"允许"可跳剧本直接完成闭环
git add -A && git commit -m "feat(demo): remote control scene with phone/desktop sync loop"
```

---

## P4 · 桌宠+账本 与 资源管理

### Task 10: Foxbell 资产接入 + D4 PetUsageScene

**Files:**
- Create: `public/pet/*`（拷贝）`src/demo/petAnimations.ts` `src/demo/scenes/PetUsageScene.tsx`
- Modify: `src/pages/DemoPage.tsx`

- [x] **Step 10.1: 从主仓拷贝素材（含 U3 授权前提，用户已默认放行）**

```bash
mkdir -p public/pet/voice
cp "../mam-worktree/public/pet/spritesheet.webp" public/pet/
cp "../mam-worktree/public/pet/manifest.json" public/pet/
cp "../mam-worktree/public/pet/voice/approval/审批通过就允许你请贝贝吃鸡腿~.m4a" public/pet/voice/approval-chicken.m4a
cp "../mam-worktree/public/pet/voice/done/成功啦！贝贝是不是超厉害~.m4a" public/pet/voice/done-success.m4a
```

- [x] **Step 10.2: 写 src/demo/petAnimations.ts（从主仓移植）**

```ts
export const FRAME_W = 192;
export const FRAME_H = 208;
export const SHEET_COLS = 8;
export const SHEET_ROWS = 11;

export type PetAnim = "idle" | "waving" | "jumping" | "failed" | "waiting";
export const ANIM: Record<PetAnim, { row: number; d: number[] }> = {
  idle: { row: 0, d: [280, 110, 110, 140, 140, 320] },
  waving: { row: 3, d: [140, 140, 140, 280] },
  jumping: { row: 4, d: [140, 140, 140, 140, 280] },
  failed: { row: 5, d: [140, 140, 140, 140, 140, 140, 140, 240] },
  waiting: { row: 6, d: [150, 150, 150, 150, 150, 260] },
};

export function frameStyle(anim: PetAnim, frame: number, scale: number) {
  const def = ANIM[anim];
  const f = ((frame % def.d.length) + def.d.length) % def.d.length;
  const w = FRAME_W * scale;
  const h = FRAME_H * scale;
  return {
    backgroundImage: `url(${import.meta.env.BASE_URL}pet/spritesheet.webp)`,
    backgroundSize: `${w * SHEET_COLS}px ${h * SHEET_ROWS}px`,
    backgroundPosition: `${-f * w}px ${-def.row * h}px`,
    width: w,
    height: h,
  };
}
```

- [x] **Step 10.3: 写 src/demo/scenes/PetUsageScene.tsx**

```tsx
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { PlayerFrame } from "../PlayerFrame";
import { frameStyle, type PetAnim } from "../petAnimations";

const USAGE = {
  total: "$12.40",
  rows: [
    { k: "Claude · sonnet-4.5", v: "$6.20" },
    { k: "Claude · opus-4.1", v: "$3.10" },
    { k: "Codex · gpt-5-codex", v: "$2.10" },
    { k: "Kimi · k2", v: "$1.00" },
  ],
};

export function PetUsageScene() {
  const { t } = useTranslation();
  const [anim, setAnim] = useState<PetAnim>("idle");
  const frame = useRef(0);
  const [, tick] = useState(0);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [drag, setDrag] = useState(false);
  const [hover, setHover] = useState(false);
  const [panel, setPanel] = useState(false);
  const [dim, setDim] = useState<"supplier" | "model">("supplier");
  const [voice, setVoice] = useState(false);
  const [party, setParty] = useState(false);

  useEffect(() => {
    if (drag) return;
    const def = [280, 110, 110, 140, 140, 320];
    const t = setTimeout(() => { frame.current = (frame.current + 1) % def.length; tick((n) => n + 1); }, def[frame.current]);
    return () => clearTimeout(t);
  }, [frame.current, drag, anim]);

  return (
    <PlayerFrame steps={[]} id="d4-player">
      <div className="relative rounded-2xl border border-line bg-surface p-6">
        <button onClick={() => { setAnim(anim === "idle" ? "waving" : "idle"); }}
          className="mb-4 rounded-lg border border-line px-3 py-1.5 text-xs hover:border-hud">{t("pet.call")}</button>
        {/* 玻璃桌宠：可拖拽 */}
        <div
          className="absolute bottom-16 right-10 cursor-grab select-none active:cursor-grabbing"
          style={{ transform: `translate(${pos.x}px, ${pos.y}px) ${drag ? "scale(1.05,0.92)" : ""}`, transition: drag ? "none" : "transform .25s" }}
          onPointerDown={(e) => { setDrag(true); (e.target as HTMLElement).setPointerCapture(e.pointerId); }}
          onPointerMove={(e) => { if (drag) setPos((p) => ({ x: p.x + e.movementX, y: p.y + e.movementY })); }}
          onPointerUp={() => setDrag(false)}
          onPointerEnter={() => setHover(true)}
          onPointerLeave={() => setHover(false)}
        >
          <div style={frameStyle(anim, frame.current, 0.6)} />
          {hover && (
            <div className="absolute -top-2 left-full ml-2 w-40 rounded-xl border border-line bg-card p-2 text-[11px] shadow-lg">
              <div className="font-semibold">{t("pet.usage")}</div>
              <div className="text-inkdim">$12.40 · 128k tok</div>
              <button className="mt-1 text-hud hover:underline" onClick={() => setPanel(true)}>{t("pet.detail")} »</button>
            </div>
          )}
        </div>
        {/* 声音开关 */}
        <div className="mt-4">
          <button onClick={() => setVoice(!voice)} className="rounded-lg border border-line px-3 py-1.5 text-xs hover:border-hud">
            {voice ? "🔊" : "🔇"} {t("pet.voice")}
          </button>
          {voice && <audio autoPlay src={`${import.meta.env.BASE_URL}pet/voice/approval-chicken.m4a`} onEnded={() => setVoice(false)} />}
        </div>
        {/* 账本面板 */}
        {panel && (
          <div className="mt-6 rounded-2xl border border-line bg-card p-5">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{t("usage.title")}</h3>
              <div className="flex gap-2 text-xs">
                {(["supplier", "model"] as const).map((d) => (
                  <button key={d} onClick={() => setDim(d)}
                    className={`rounded-full px-3 py-1 ${dim === d ? "bg-hud text-white" : "border border-line text-inkdim"}`}>
                    {t(d === "supplier" ? "usage.bySupplier" : "usage.byModel")}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-3 text-3xl font-bold tabular-nums">{USAGE.total}</div>
            <ul className="mt-3 space-y-1 text-sm text-inkdim">
              {(dim === "supplier" ? USAGE.rows : USAGE.rows).map((r) => (
                <li key={r.k} className="flex justify-between border-b border-line py-1"><span>{r.k}</span><span>{r.v}</span></li>
              ))}
            </ul>
            <button onClick={() => { setParty(true); setTimeout(() => setParty(false), 1800); }}
              className="mt-4 rounded-xl bg-ok px-4 py-2 text-sm font-semibold text-white dark:text-navy">{t("pet.share")}</button>
            {party && (
              <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
                {Array.from({ length: 24 }).map((_, i) => (
                  <span key={i} className="absolute h-2 w-2 rounded-full"
                    style={{ left: `${(i * 41) % 100}%`, top: "-8px", background: STOMP[i % 4], animation: "fall 1.4s linear forwards" }} />
                ))}
              </div>
            )}
          </div>
        )}
        {voice && panel && party && (
          <audio autoPlay src={`${import.meta.env.BASE_URL}pet/voice/done-success.m4a`} onEnded={() => setVoice(false)} />
        )}
      </div>
    </PlayerFrame>
  );
}

const STOMP = ["#4FC3E8", "#61D2E7", "#36BB7B", "#EAB53D"];
```

> `animation: fall` 需要在 `src/index.css` 追加 keyframes：
> ```css
> @keyframes fall { to { transform: translateY(320px) rotate(240deg); opacity: 0; } }
> ```

- [x] **Step 10.4: DemoPage 挂载（id="d4"） + 验证 + Commit**

DemoPage 追加 d4 区块（模式同 d2：`<section id="d4" ...><PetUsageScene /></section>`）。

```bash
pnpm dev   # 验证：贝贝待机动画、可拖拽、hover 出浮窗、详情面板维度切换、导出撒花、开声播放语音
git add -A && git commit -m "feat(demo): foxbell pet with usage ledger scene"
```

### Task 11: D3 ResourcesScene

**Files:**
- Create: `src/demo/steps-res.ts` `src/demo/scenes/ResourcesScene.tsx`
- Modify: `src/pages/DemoPage.tsx`

- [x] **Step 11.1: 写 steps-res.ts 与 ResourcesScene.tsx**

`src/demo/steps-res.ts`:

```ts
import type { Step } from "./types";

export const resSteps: Step[] = [
  { wait: 900, caption: { zh: "8 个工具 8 套目录？收编进一个仓库", en: "8 tools, 8 skill folders — into one repo" } },
  { wait: 2000, caption: { zh: "不勾选 = 不加载 = 干净上下文（技能永不丢失）", en: "Unchecked = not loaded = clean context (never deleted)" } },
  { wait: 2000, caption: { zh: "预设组：干一类活，换一套装备", en: "Preset groups: one task, one loadout" } },
];
```

`src/demo/scenes/ResourcesScene.tsx`:

```tsx
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { TOOLS } from "../tools";
import { PlayerFrame } from "../PlayerFrame";
import { resSteps } from "../steps-res";

interface Skill { id: string; name: string; enabled: Record<string, boolean> }
const SKILLS: Skill[] = ["commit-format", "pr-review", "quant-chart", "doc-writer"].map((id, i) => ({
  id,
  name: id,
  enabled: Object.fromEntries(TOOLS.map((t) => [t.key, i % 2 === 0])),
}));
const PRESETS: Record<string, string[]> = {
  "Full Stack Dev": ["commit-format", "doc-writer"],
  "Code Review": ["pr-review"],
};

export function ResourcesScene() {
  const { t } = useTranslation();
  const [skills, setSkills] = useState(SKILLS);
  const [preset, setPreset] = useState<string | null>(null);
  const [checked, setChecked] = useState(0);
  const healthy = checked >= 2;
  return (
    <PlayerFrame steps={resSteps} id="d3-player">
      <div className="rounded-2xl border border-line bg-surface p-4">
        <div className="mb-3 flex items-center justify-between">
          <button onClick={() => setChecked((c) => c + 7)}
            className="rounded-lg border border-line px-3 py-1 text-xs hover:border-hud">{t("res.scan")}</button>
          <div className="flex gap-2">
            {Object.keys(PRESETS).map((p) => (
              <button key={p} onClick={() => {
                setPreset(p);
                setSkills((ss) => ss.map((s) => ({ ...s, enabled: Object.fromEntries(TOOLS.map((t2) => [t2.key, PRESETS[p].includes(s.id)])) })));
                setChecked(PRESETS[p].length * TOOLS.length);
              }} className={`rounded-full px-3 py-1 text-xs ${preset === p ? "bg-hud text-white" : "border border-line text-inkdim hover:text-ink"}`}>{p}</button>
            ))}
          </div>
        </div>
        <table className="w-full text-sm">
          <thead><tr className="text-left text-xs text-inkdim">
            <th className="py-1">Skill</th>
            {TOOLS.map((t2) => <th key={t2.key} className="py-1 text-center">{t2.label}</th>)}
          </tr></thead>
          <tbody>
            {skills.map((s) => (
              <tr key={s.id} className="border-t border-line">
                <td className="py-1.5 font-medium">{s.name}</td>
                {TOOLS.map((t2) => (
                  <td key={t2.key} className="py-1.5 text-center">
                    <input type="checkbox" checked={s.enabled[t2.key]} aria-label={`${s.name}:${t2.label}`}
                      onChange={() => setSkills((ss) => ss.map((x) => x.id === s.id ? { ...x, enabled: { ...x.enabled, [t2.key]: !x.enabled[t2.key] } } : x))} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-2 text-[11px] text-inkdim">{t("res.context")}</p>
        <div className={`mt-3 rounded-xl border p-3 text-sm ${healthy ? "border-ok text-ok" : "border-line text-inkdim"}`}>
          {t("res.health")}: {healthy ? "✓" : "…"}
        </div>
      </div>
    </PlayerFrame>
  );
}
```

- [x] **Step 11.2: DemoPage 挂载（id="d3"，置于 d2 与 d4 之间）+ 验证 + Commit**

```bash
pnpm dev   # 勾选矩阵即时生效；预设组切换批量变化；勾选≥2 组体检卡变绿
git add -A && git commit -m "feat(demo): resources scene with skill matrix and preset groups"
```

---

## P5 · 更新日志 / 文档 / SEO

### Task 12: /changelog（切分脚本 TDD + 页面）

**Files:**
- Create: `scripts/split-changelog.mjs` `tests/fixtures/CHANGELOG-sample.md` `scripts/split-changelog.test.mjs`
- Create: `src/content/changelog.json`（生成）`src/pages/ChangelogPage.tsx`（替换占位）
- Modify: `package.json`（sync:changelog 已在 Task 0 定义）

- [x] **Step 12.1: 写 fixtures 与失败测试**

`tests/fixtures/CHANGELOG-sample.md`:

```markdown
# Changelog

## [0.5.5] - 2026-10-10

### Added

- 子 Agent 运行 chip 与观察台
- 远程审批支持排队

### Fixed

- 完成识别修复：teammate 完成后 chip 永挂
```

`scripts/split-changelog.test.mjs`:

```js
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parseChangelog } from "./split-changelog.mjs";

const __dir = dirname(fileURLToPath(import.meta.url));
const md = readFileSync(resolve(__dir, "../fixtures/CHANGELOG-sample.md"), "utf8");

describe("parseChangelog", () => {
  it("解析版本、日期、分区与条目", () => {
    const out = parseChangelog(md);
    expect(out).toHaveLength(1);
    expect(out[0].version).toBe("0.5.5");
    expect(out[0].date).toBe("2026-10-10");
    expect(out[0].sections.Added).toEqual(["子 Agent 运行 chip 与观察台", "远程审批支持排队"]);
    expect(out[0].sections.Fixed).toEqual(["完成识别修复：teammate 完成后 chip 永挂"]);
  });
  it("非版本行不产生新条目", () => {
    expect(parseChangelog("# Changelog\n随便写写\n")).toEqual([]);
  });
});
```

- [x] **Step 12.2: 配置 vitest 包含 scripts 测试**

`vite.config.ts` 的 `test` 块追加：

```ts
    include: ["src/**/*.test.{ts,tsx}", "scripts/**/*.test.mjs"],
```

- [x] **Step 12.3: 运行验证失败 → 实现 scripts/split-changelog.mjs → 通过**

```js
export function parseChangelog(md) {
  const out = [];
  let cur = null;
  let sec = null;
  for (const line of md.split(/\r?\n/)) {
    const v = line.match(/^## \[([^\]]+)\]\s*-\s*(\d{4}-\d{2}-\d{2})/);
    if (v) { cur = { version: v[1], date: v[2], sections: {} }; out.push(cur); sec = null; continue; }
    if (!cur) continue;
    const h = line.match(/^###\s+(.+)/);
    if (h) { sec = h[1].trim(); cur.sections[sec] = cur.sections[sec] ?? []; continue; }
    if (!sec) continue;
    if (/^- /.test(line)) cur.sections[sec].push(line.replace(/^- /, "").trim());
    else if (line.trim() && cur.sections[sec].length) {
      cur.sections[sec][cur.sections[sec].length - 1] += " " + line.trim();
    }
  }
  return out;
}

// CLI 入口
if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, "/")}` || process.argv[1]?.endsWith("split-changelog.mjs")) {
  const arg = (k, d) => {
    const i = process.argv.indexOf(k);
    return i > -1 ? process.argv[i + 1] : d;
  };
  const inp = arg("--in", "../mam-worktree/CHANGELOG.md");
  const outp = arg("--out", "src/content/changelog.json");
  try {
    const md = readFileSync(inp, "utf8");
    writeFileSync(outp, JSON.stringify(parseChangelog(md), null, 2));
    console.log(`changelog: ${inp} -> ${outp}`);
  } catch {
    console.warn(`[sync:changelog] 输入不存在（${inp}），保留现有 ${outp}`);
  }
}
```

> 文件顶部需 `import { readFileSync, writeFileSync } from "node:fs";`。

```bash
pnpm test -- scripts/split-changelog.test.mjs   # Expected: 2 passed
pnpm sync:changelog                             # Expected: src/content/changelog.json 生成（真实主仓数据）
```

- [x] **Step 12.4: 写 src/pages/ChangelogPage.tsx**

```tsx
import { useTranslation } from "react-i18next";
import data from "@/content/changelog.json";

export default function ChangelogPage() {
  const { t, i18n } = useTranslation();
  return (
    <main className="mx-auto max-w-3xl px-5 py-14">
      <h1 className="text-3xl font-bold">{t("log.title")}</h1>
      {i18n.language !== "zh" && <p className="mt-2 text-sm text-inkdim">{t("log.enNote")}</p>}
      <div className="mt-8 space-y-10">
        {data.map((rel) => (
          <section key={rel.version}>
            <h2 className="text-xl font-bold">
              <span className="tabular-nums">v{rel.version}</span>
              <span className="ml-3 text-sm font-normal text-inkdim">{rel.date}</span>
            </h2>
            {Object.entries(rel.sections).map(([sec, items]) => (
              <div key={sec} className="mt-3">
                <h3 className="text-sm font-semibold text-hud">{sec}</h3>
                <ul className="mt-1 list-disc space-y-1 pl-5 text-sm">
                  {items.map((it, i) => <li key={i}>{it}</li>)}
                </ul>
              </div>
            ))}
          </section>
        ))}
      </div>
    </main>
  );
}
```

> TS 侧新建 `src/content/changelog.d.ts`：`declare const data: { version: string; date: string; sections: Record<string, string[]> }[]; export default data;`

- [x] **Step 12.5: 验证 + Commit**

```bash
pnpm build && pnpm preview   # /tuvis-website/zh/changelog 渲染真实主仓日志
git add -A && git commit -m "feat(changelog): split script with tests and page"
```

### Task 13: /docs 快速上手

**Files:**
- Create: `src/pages/DocsPage.tsx`（替换占位）

- [x] **Step 13.1: 实现（i18n 文案已在 Task 2 定义 docs.* key）**

```tsx
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

export default function DocsPage() {
  const { t } = useTranslation();
  const steps = ["docs.step1", "docs.step2", "docs.step3", "docs.step4"] as const;
  return (
    <main className="mx-auto max-w-3xl px-5 py-14">
      <h1 className="text-3xl font-bold">{t("docs.title")}</h1>
      <ol className="mt-8 space-y-4">
        {steps.map((k, i) => (
          <li key={k} className="flex gap-4 rounded-2xl border border-line bg-card p-5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ok font-bold text-white dark:text-navy">{i + 1}</span>
            <p className="pt-1.5">{t(k)}</p>
          </li>
        ))}
      </ol>
      <p className="mt-8 text-inkdim">
        {t("docs.next")} <Link to="demo" className="text-hud hover:underline">{t("docs.nextDemo")}</Link> {t("docs.play")}；
        <a className="ml-1 text-hud hover:underline" href="https://github.com/jarvislee90s-dot/tuvis#readme" target="_blank" rel="noopener noreferrer">GitHub README →</a>
      </p>
    </main>
  );
}
```

- [x] **Step 13.2: 验证 + Commit**

```bash
pnpm dev   # /zh/docs 与 /en/docs 文案切换正常；四个步骤卡片渲染
git add -A && git commit -m "feat(docs): quick start page"
```

### Task 14: SEO 收尾（og / robots / sitemap / llms.txt）+ 全站验收

**Files:**
- Create: `public/og.png`（生成）`public/robots.txt` `public/sitemap.xml` `public/llms.txt`
- Modify: `index.html`（og/twitter meta）

- [x] **Step 14.1: 生成 og.png（1200×630，一次性 PIL）**

```bash
python - <<'EOF'
from PIL import Image
tile = Image.open("public/img/appicon-dark.png").convert("RGBA").resize((460, 460), Image.LANCZOS)
hero = Image.open("public/img/hero-cutout.png").convert("RGBA")
hero.thumbnail((560, 620), Image.LANCZOS)
og = Image.new("RGBA", (1200, 630), (44, 51, 71, 255))
og.paste(hero, (700, 630 - hero.height), hero)
og.paste(tile, (90, 85), tile)
og.convert("RGB").save("public/og.png")
print("og.png ok")
EOF
```

- [x] **Step 14.2: index.html head 追加社交与 SEO meta**

```html
    <meta property="og:title" content="兔维斯 Tuvis —— 你的桌面多 Agent 指挥台" />
    <meta property="og:description" content="一块看板看清并掌控所有 AI Agent，从桌面到手机。" />
    <meta property="og:image" content="https://jarvislee90s-dot.github.io/tuvis-website/og.png" />
    <meta property="og:type" content="website" />
    <meta name="twitter:card" content="summary_large_image" />
    <link rel="alternate" hreflang="zh" href="https://jarvislee90s-dot.github.io/tuvis-website/zh/" />
    <link rel="alternate" hreflang="en" href="https://jarvislee90s-dot.github.io/tuvis-website/en/" />
```

- [x] **Step 14.3: 写 robots.txt / sitemap.xml / llms.txt**

`public/robots.txt`:

```
User-agent: *
Allow: /
Sitemap: https://jarvislee90s-dot.github.io/tuvis-website/sitemap.xml
```

`public/sitemap.xml`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://jarvislee90s-dot.github.io/tuvis-website/zh/</loc><changefreq>weekly</changefreq></url>
  <url><loc>https://jarvislee90s-dot.github.io/tuvis-website/en/</loc><changefreq>weekly</changefreq></url>
  <url><loc>https://jarvislee90s-dot.github.io/tuvis-website/zh/demo</loc></url>
  <url><loc>https://jarvislee90s-dot.github.io/tuvis-website/en/demo</loc></url>
  <url><loc>https://jarvislee90s-dot.github.io/tuvis-website/zh/docs</loc></url>
  <url><loc>https://jarvislee90s-dot.github.io/tuvis-website/zh/changelog</loc></url>
</urlset>
```

`public/llms.txt`:

```
# Tuvis (兔维斯)

Desktop multi-agent command deck: monitor, notify, and remotely control 8 AI coding
tools (Claude Code, Codex, OpenCode, OpenClaw, Kimi Code, WorkBuddy, ZCode, dsh)
from one board, with a Foxbell desktop pet and a token usage ledger.
MIT licensed, local-first, no telemetry. Windows 10+ / macOS 14+.

- GitHub: https://github.com/jarvislee90s-dot/tuvis
- Docs: https://jarvislee90s-dot.github.io/tuvis-website/zh/docs
- Changelog: https://jarvislee90s-dot.github.io/tuvis-website/zh/changelog
```

- [x] **Step 14.4: 全站验收清单（逐项跑）**

```bash
pnpm test          # 全部通过
pnpm build         # tsc 零错误；dist/ 含 404.html、og.png、favicon.png、sitemap.xml
pnpm preview       # 清单：
```

- [x] `/zh/` 与 `/en/` 首页 7 区块渲染，亮暗切换即时
- [x] `/zh/demo` 四场景全部可玩：D1 剧本+接管；D2 手机批准闭环；D3 勾选矩阵+预设；D4 拖拽+浮窗+账本+撒花
- [x] `/zh/docs`、`/zh/changelog`（真实主仓数据）正常
- [x] 直接刷新 `/tuvis-website/en/demo`（preview 对 SPA 刷新返回 404 页时走 404 兜底逻辑回正确路由）
- [x] Lighthouse（Chrome DevTools）Performance ≥ 90 / Accessibility ≥ 95
- [x] 全站无任何统计/追踪脚本

- [x] **Step 14.5: 最终 Commit**

```bash
git add -A && git commit -m "feat(seo): og/robots/sitemap/llms and final acceptance pass"
```

---

## 交接备注（P6 及以后）

- P6 上线：创建 GitHub 仓库 `tuvis-website` → push → Settings/Pages 选 GitHub Actions → 建议工作流 `pnpm build` + `actions/deploy-pages`。此步需要网络与仓库权限，由用户执行或另行授权。
- 上线检查单：`CHANGELOG 已同步`、全路由冒烟（zh/en × 4 页）、Lighthouse 复测。
- 二期池：E1 域名、E2 CHANGELOG 自动 Action、E3 视频嵌入、E4 FAQ、E5 评价区、E6 英文全翻、E7 压缩回补、E8 高清立绘。
