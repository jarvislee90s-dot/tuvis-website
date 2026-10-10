# Tuvis 官网 P11 计划（兼容矩阵 + 首页 2×2 + 演示精修 II · 双源同步 · T40–T45）

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 基于 P10 成品（main @ d0c8fa9，25 测试全绿，i18n 257 key——任务简报中的「241」为旧值，实测 zh/en 各 257）落地六条主线：① 导航与双源同步——TopBar 最前加「首页」、修「功能」伪链（`to="?#"` 改真正的 `/:lang#features` 走 ScrollManager 锚点）、移除「免费下载」钮、标签间距字重微调；`scripts/split-changelog.mjs` 升级为双源同步（默认走 `api.github.com/repos/jarvislee90s-dot/tuvis/contents` 通道拉 `CHANGELOG.md`（base64 解码 + schannel 失败重试）与 `docs/capabilities.json`，`--in` 本地回退、失败保底退出 0）；② 新增「八款工具兼容矩阵」首页板块（置于工作流对比区上方，数据 = 同步的 `src/content/capabilities.json`，三组 × 12 行 × 8 工具列，文字态 + 图例 + Codex CLI/APP 脚注 + 数据源尾注）；③ 首页 2×2 重排——第一排左 2/3 文案列 + 右 1/3 hero-poster 完整海报（圆角 26px 卡片，行高随海报比例），第二排左 2/3 AppBoard 实时窗（原右列移入）+ 右 1/3 手机远程窗（RemoteBoard bezel 版静态可交互，点卡回 /demo#d2），「你会这样用它」及以下全部板块 max-w-7xl；④ 演示精修 II——主看板字号降档、NotificationCard 统一近黑/橙强调审批视觉、KimiShellTui 重做为完整高度 TUI（对照 kimi-code-full-tui.png，tuvis 语境文案）；D2 手机详情与 ClaudeTui 同高全展开 + 文件预览升级（markdown 渲染 + 图片占位 + 筛选 chips）+ 子 Agent chip 行；D3 资源管理加 MCP/插件页签与 Skill 预设组一键矩阵；D4 切换宠物/导入宠物弹窗按真应用 UI 还原（petdex 真实外链）+ 头顶常驻用量/消息卡；⑤ 用量看板全展开（去固定高与内滚，页面随内容延长）；⑥ 全站验收（A11y ≥ 95 + 矩阵渲染 + 五场景回归 + 总报告）。i18n 新增 26 key 双语同步、改值 3 处。

**Architecture:** 不改技术栈与路由结构。同步层：`split-changelog.mjs` 保持单文件双职责（changelog 解析 + capabilities 结构闸门），dev/build 既有挂钩不变（在途「用户手册」工作已让 dev/build 先跑 sync 脚本——P11 沿用该挂钩，失败语义 = 警告 + 保底 + 退出 0，网络不可用不打断构建）；产物 `changelog.json` / `capabilities.json` 均入 git 作离线兜底，`capabilities.d.json.ts` 仿 changelog 先例做 JSON 模块类型声明（tsconfig `allowArbitraryExtensions` 已开）。站点层：新增 `src/home/CompatMatrix.tsx`（纯展示，读 capabilities.json 单一源，行名/组名取 JSON 原文并前向兼容 `nameEn` 字段）；Home.tsx 六个 section 统一 max-w-7xl 包裹，Hero 重排为「文案 | 海报」+「看板窗 | 手机窗」两排 grid。演示层：`NotificationCard` 换 ClaudeTui 视觉语言（近黑卡片 + 左缘橙条）；`KimiShellTui` 内容整体重写（TuiShell 壳不动，footer 状态栏改三段式）；`PhoneFrame` 加 `autoHeight` 变体供 D2 全展开；`RemoteBoard` 加 `onOpenDetail` 注入通道供首页复用；D2 新增 `remote/FilePreview.tsx`（react-markdown + remark-gfm，复用在途用户手册工作已就位的依赖，零新增包）；D3 `ResourcesScene` 资源类型三态（Skill/MCP/插件）共用矩阵渲染路径 + 预设组快照；D4 新增 `PetDialogs.tsx`（两个 role=dialog 受控弹窗）+ 头顶常驻卡组；`LedgerSection` 去固定高容器与 sticky。

**Tech Stack:** 不变：pnpm · Vite 6 · React 19 · TypeScript 5.7 · Tailwind CSS v4 · react-router 7 · i18next · zustand 5 · framer-motion 12 · vitest + @testing-library/react。**零新增依赖**（react-markdown / remark-gfm 已由在途用户手册工作引入 package.json，本计划只复用）。

**规格来源（还原唯一权威，已入本仓 `docs/design/p11-ref/`，当前 untracked 随 T40 首个 commit 一并纳入）：**
- `capabilities.for-tuvis.json`（865 行级结构稿，将作为 tuvis 仓库 `docs/capabilities.json` 的内容）：`updated` + `legend{yes/partial/experimental/no}` + `tools[8]`（claude/codex/opencode/openclaw/kimi/workbuddy/zcode/dsh，顺序与 `src/demo/tools.ts` TOOLS 完全一致）+ `groups[3]`（desktop「桌面提醒」2 行 / skillmcp「Skill · MCP 管理」4 行 / remote「远程操控」6 行），每行 `{name, key, support{8 工具: yes|partial|experimental|no}, note?}`——note 为行级悬浮注（如「dsh 为只读」「Kimi 为文件型」「四家试验性：OpenClaw/WorkBuddy 黑盒无外部写通道…」）。inject 行四家试验性含 opencode，与 P9 事实一致；矩阵渲染一律以该 JSON 为准。
- `kimi-code-full-tui.png`（1304×1593）：近黑底终端全高会话——蓝框欢迎盒（标题 + help + Directory/Session/Model/Version/MCP 共 7 行）、`✦ Kimi Code Desktop is here` 宣传段 + `Run /desktop` 行、MCP connected 绿行 ×2、`✻` 用户消息行、斜体思考行、回复正文（路径高亮 + 圆点列表）、底部输入框 `> █`、底部状态栏（模型 · thinking 档位 + 路径 + `context: 4% (33k/977k)`）。
- `pet-switch-grid.png`（865×796）：亮色弹窗「切换宠物」+ 宠物网格卡（大头像 / 名字 / 「内置 · v2」徽标 / 喇叭·字幕小图标），当前宠物高亮。
- `pet-import-dialog.png`（866×415）：弹窗「导入宠物」+ 三 tab（从 codex 导入 / 文件夹或压缩包 / petdex 在线导入·选中态）+ 说明行（含示例链接 `https://petdex.dev/pets/capvolt`）+ 链接输入框 + 「浏览 petdex.dev」「下载并暂存」两钮。
- `pet-head-cards.png`（443×646）：宠物头顶常驻卡组——用量摘要卡 + 消息提醒卡（「ZCode…等待操作」红、「✓ 已释放 0.5GB」「Kimi Code zh 你好 · 已完成」灰），纵向堆叠带小偏移。
- 现状代码（已核实）：`src/components/layout/TopBar.tsx`（功能 = `to="?#"` 伪链 + preventDefault scrollIntoView，仅首页在视口内有 #features 时有效）、`src/components/ScrollManager.tsx`（hash → scrollIntoView，demo#d1–d4 已验证可靠）、`src/home/{Hero,WorkflowCompare,StoriesSection,OpenSource,DownloadCta}.tsx`、`src/pages/Home.tsx`（Hero/对比区 7xl，其余 5xl）、`src/demo/{AppBoard,SessionCard,NotificationCard,KimiShellTui,TuiShell,PhoneFrame}.tsx`、`src/demo/remote/{RemoteBoard,RemoteDetail}.tsx`、`src/demo/scenes/{RemoteScene,ResourcesScene,PetUsageScene}.tsx`、`src/demo/LedgerSection.tsx`、`scripts/split-changelog.mjs`（本地 `--in ../mam-worktree/CHANGELOG.md` 默认）+ `scripts/split-changelog.test.mjs`（2 用例）、`package.json`（dev/build 已挂 sync 脚本；react-markdown/remark-gfm 已在 dependencies）、`src/content/changelog.d.json.ts`（`allowArbitraryExtensions` JSON 声明先例）。

**全局约定:**
- 工作目录：`E:\LLMproject\Github\tuvis-website`（Shell: Git Bash）；基线 main @ d0c8fa9 + **工作区在途未提交变更（「用户手册」功能：package.json 挂 sync 脚本 + react-markdown/remark-gfm + scripts/sync-user-manual.mjs + src/content/manual.ts + src/pages/DocsArticlePage.tsx + router docs/:slug + docs.* key 调整，25 测试全绿）**。P11 实施前该在途工作须先由控制方落地提交（或明确共存），P11 各任务不得回退其任何接线（尤其 package.json dev/build 里的 sync 调用）。
- 红线（不可越）：`brand/`、`mam-worktree/`、`legacy/`、`SPEC.md` 只读；**不新增任何 npm 依赖**（react-markdown/remark-gfm 视为已就位）；`DownloadCta.goToInstaller` 逻辑一行不动；`public/img/state-*.png` 不删；全站零追踪；`scripts/split-changelog.mjs` 的 `parseChangelog` 导出与现有 2 用例语义不变（测试只增不改）。
- 收尾三件套：每个任务末尾 `pnpm exec tsc --noEmit` + `pnpm test` + `pnpm build` 全绿 → **commit / 勾选本计划 checkbox / `docs/superpowers/plans/progress.md` 追加报告由控制方收口执行**，实现子代理跑到三条命令全绿 + 浏览器核对即止；**不 commit（控制方收口）**。
- i18n：本计划新增 26 key（见增量总表）+ 3 处改值，zh.json 与 en.json 必须同步（parity 测试强制，终值 **283 key**）；终端/弹窗内的会话内容、MCP server 名、插件名、预设组名、宠物消息卡文案 = 硬编码（真实感优先，P9/P10 口径）；矩阵行名/组名取 JSON 原文（中文维护，同 changelog「内容以中文维护」口径；渲染器读 `nameEn ?? name` 前向兼容双语）。
- 测试基线演进：25（现状）→ T40 split-changelog.test.mjs +2 用例（**27**）；ledger 8 用例不因展开变化（LedgerSection 改动为纯样式类，数据与逻辑零改动）；player.test.ts 预计零适配（d2 断言 files/question/messages 均不受高度/文件预览升级影响，T43 末尾跑测核对）。
- 范围外：矩阵交互筛选/按工具切视图（纯静态表）、D2 手机面板「新建会话」真功能、D3 扫描原生资源真扫描、D4 petdex 真下载解析、账本「记录」页签与真实导出、hero-poster 压缩（二期 E7 挂账）。

---

## 兼容矩阵板块规格（T40，`src/home/CompatMatrix.tsx` 新建）

数据源 = `src/content/capabilities.json`（T40 由同步脚本从 tuvis 仓库 `docs/capabilities.json` 拉取生成；首版兜底内容 = `docs/design/p11-ref/capabilities.for-tuvis.json` 原样拷入并随 T40 commit）。列序取 JSON `tools` 数组（与 tools.ts TOOLS 一致），**渲染一律以 JSON 为准**（JSON 增删工具/行时矩阵自动跟随）。

结构（上→下）：

1. **节头**：`SectionTitle tKey="matrix.title"` + 副述行（`-mt-6 mb-8 text-center text-xs text-inkdim`，`matrix.desc`）。
2. **图例行**：`flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs`——四态图例（左）+ 更新日期（右 `ml-auto`）：
   - 图例项 = 色点（h-2 w-2 rounded-full）+ `t("matrix.legend.yes|partial|experimental|no")`；色点色：yes `bg-green-500` / partial `bg-amber-500` / experimental `bg-violet-500` / no `bg-zinc-400`。
   - 更新日期：`matrix.updated` 插值 `{{ date: cap.updated }}`。
3. **三组卡**（每组一张）：`rounded-[14px] border border-line bg-card p-5` + 组名 `text-sm font-semibold`（`group.nameEn ?? group.name`）+ 表格：

```
外层:   <div className="overflow-x-auto"> <table className="w-full min-w-[780px] border-collapse text-xs">
表头:   首列 <th className="sticky left-0 z-10 bg-card py-2 text-left font-medium text-inkdim">能力</th>
        + cap.tools 8 列：每列 <th className="py-2 text-center font-medium">
          竖排 <ToolIcon tool={key} size={14}/> + <span className="text-[10px]">{toolOf(key).label}</span>
          codex 列头加 <sup>†</sup>（text-[9px] text-hud）+ th title={t("matrix.codexNote")}
行:     每行 <tr className="border-t border-line">：
          首列 <td className="sticky left-0 z-10 bg-card py-2 pr-3 text-inkdim">{row.nameEn ?? row.name}</td>
          8 格 <td className="py-2 text-center">（见单元格态）
单元格: 文字态（决策 8）——按 row.support[tool] 映射：
          yes          → <span className="text-[11px] font-medium text-green-700">✓ {t("matrix.legend.yes")}</span>
          partial      → <span className="text-[11px] font-medium text-amber-700">✓ {t("matrix.legend.partial")}</span>
          experimental → <span className="text-[11px] font-medium text-violet-700">🧪 {t("matrix.legend.experimental")}</span>
          no           → <span className="text-[11px] text-inkdim">✕ {t("matrix.legend.no")}</span>
          行有 note 时：单元格加 title={row.note} + aria-label（视觉同上，悬浮出注）
```

4. **尾注区**（三组卡之后，`mt-4 space-y-1 text-[11px] text-inkdim`）：`matrix.codexNote`（† 脚注，codex 列头同文）+ `matrix.source`（数据源声明）。

移动端（<lg）：表格随 `overflow-x-auto` 横滚，首列 `sticky left-0 bg-card` 锁定；375px 核对 8 列可滚且行名可见。桌面（lg+）：7xl 容器内 `min-w-[780px]` 自然铺满无横滚。

类型声明 `src/content/capabilities.d.json.ts`（仿 changelog.d.json.ts 先例）：

```ts
declare const data: {
  updated: string;
  legend: Record<string, string>;
  tools: string[];
  groups: {
    key: string; name: string; nameEn?: string;
    rows: { name: string; nameEn?: string; key: string; support: Record<string, string>; note?: string }[];
  }[];
};
export default data;
```

---

## 双源同步脚本（T40，`scripts/split-changelog.mjs` 升级 · 完整代码）

设计要点：默认源 = `api.github.com` contents 通道（raw 域被间歇拦截不可用）；base64 content 解码（带换行先剥）；Windows schannel 吊销检查偶发失败 → 3 次重试（600/1200ms 退避）+ 单次 5s 超时；403/429 限流不重试直接保底；**任一源失败 → 警告 + 保留上次同步产物 + 退出 0**（dev/build 挂钩不打断，产物入 git 作离线兜底）；`--in` = changelog 本地回退通道（给出即跳过 changelog 网络拉取）；`--offline` = 全跳网络（频繁重启/CI 离线场景）；双源并发拉取（离线最坏 ~17s，在线 ~0.5s）；`parseChangelog` 与现有 2 测试用例零改动。

```js
// scripts/split-changelog.mjs —— 双源同步：CHANGELOG.md + docs/capabilities.json
//   → src/content/{changelog,capabilities}.json（产物入 git 作离线兜底）。
// 用法：
//   node scripts/split-changelog.mjs                  # 默认：api.github.com contents 通道拉双源
//   node scripts/split-changelog.mjs --in <本地md>     # changelog 走本地文件（capabilities 仍走网络）
//   node scripts/split-changelog.mjs --offline         # 全离线：跳过网络，保留现有产物
// 失败语义：任一源失败 → 警告并保留上次同步产物，退出码 0（dev / build 不被打断）。
import { readFileSync, writeFileSync } from "node:fs";

export function parseChangelog(md) {
  // ……原实现一字不动（版本/日期/分区/条目解析，测试基线）……
}

/** api.github.com contents 响应 → utf8 文本（content 为带换行的 base64） */
export function decodeContent(payload) {
  if (!payload || typeof payload.content !== "string") {
    throw new Error("unexpected contents payload: missing .content");
  }
  return Buffer.from(payload.content.replace(/\n/g, ""), "base64").toString("utf8");
}

/** capabilities 结构闸门：通过才允许落盘（半拉取/HTML 错误页防混入） */
export function validateCapabilities(data) {
  const ok = data !== null && typeof data === "object"
    && Array.isArray(data.tools) && data.tools.length === 8
    && Array.isArray(data.groups) && data.groups.length >= 1
    && data.groups.every((g) => Array.isArray(g.rows) && g.rows.every(
      (r) => r && typeof r.name === "string" && r.support && typeof r.support === "object"));
  return ok ? data : null;
}

const API_BASE = "https://api.github.com/repos/jarvislee90s-dot/tuvis/contents";
const SOURCES = [
  { key: "changelog", path: "CHANGELOG.md", out: "src/content/changelog.json" },
  { key: "capabilities", path: "docs/capabilities.json", out: "src/content/capabilities.json" },
];

/** contents 拉取：3 次重试（schannel 吊销检查偶发失败）；403/429 限流直接放弃重试 */
async function fetchSource(src, { attempts = 3, timeoutMs = 5000 } = {}) {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    if (i > 0) await new Promise((r) => setTimeout(r, i * 600));
    try {
      const res = await fetch(`${API_BASE}/${src.path}`, {
        headers: { "User-Agent": "tuvis-website-sync", Accept: "application/vnd.github+json" },
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (res.status === 403 || res.status === 429) {
        throw Object.assign(new Error(`rate-limited (HTTP ${res.status})`), { noRetry: true });
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return decodeContent(await res.json());
    } catch (err) {
      lastErr = err;
      if (err?.noRetry) break;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

// CLI 入口
if (process.argv[1]?.endsWith("split-changelog.mjs")) {
  const arg = (k, d) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : d; };
  const inp = arg("--in", null);
  const offline = process.argv.includes("--offline");
  const jobs = offline ? [] : SOURCES.filter((s) => !(s.key === "changelog" && inp));
  const results = await Promise.allSettled(jobs.map(async (s) => ({ s, text: await fetchSource(s) })));
  for (const r of results) {
    if (r.status === "rejected") { console.warn(`[sync] ${r.reason.message}：保留上次同步的产物`); continue; }
    const { s, text } = r.value;
    try {
      if (s.key === "changelog") {
        writeFileSync(arg("--out", s.out), JSON.stringify(parseChangelog(text), null, 2));
      } else {
        const data = validateCapabilities(JSON.parse(text));
        if (!data) { console.warn("[sync] capabilities 结构校验未过：保留上次同步的产物"); continue; }
        writeFileSync(s.out, JSON.stringify(data, null, 2));
      }
      console.log(`[sync] ${s.path} -> ${s.out}`);
    } catch (e) {
      console.warn(`[sync] ${s.key} 写入失败（${e.message}），保留上次同步的产物`);
    }
  }
  if (inp) {   // 本地回退通道：离线改稿/链路排查用（网络 changelog 已被跳过，不双写）
    try {
      const md = readFileSync(inp, "utf8");
      writeFileSync(arg("--out", "src/content/changelog.json"), JSON.stringify(parseChangelog(md), null, 2));
      console.log(`[sync] changelog(local) ${inp} -> src/content/changelog.json`);
    } catch {
      console.warn(`[sync] --in 输入不存在（${inp}），保留现有 src/content/changelog.json`);
    }
  }
}
```

配套：`scripts/split-changelog.test.mjs` 追加 2 用例（`decodeContent` 对带换行 base64 往返解码；`validateCapabilities` 合法结构通过 / 缺 tools、rows 非数组、null 三例拒绝）；README.md 增「内容同步」小节（命令、两数据源、`--in` / `--offline`、失败保底语义、60 次/小时限流提示）。tuvis 仓库侧由用户提交 `docs/capabilities.json`（内容 = `capabilities.for-tuvis.json`）；官网侧不依赖其即时存在——产物首版随 T40 commit。

---

## 首页 2×2 与宽度统一规格（T41）

`src/home/Hero.tsx` 重排（单 `<section className="py-14 md:py-20">` 内两排 grid；Reveal 包裹不变）：

```
第一排（行高随海报比例，矮侧居中）：
  <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
    左：现状左列内容原样（徽章/大标题/slogan/描述/双 CTA 钮/三色小灯行）——
        删 200px 海报缩略 <img>（海报移右列放大）
    右：<img src="img/hero-poster.png" alt={t("hero.title")}
         className="w-full rounded-[26px] border border-line shadow-soft"
         loading="eager" decoding="async" />
        （723×1038 竖版，高 = 列宽 × 1.436 自然撑出行高；7xl 下右列 ~410px → 海报 ~590px 高）

第二排（行高按手机高度对齐，左窗内滚）：
  <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
    左：<div>
          <DesktopStage>
            <div className="h-[440px] overflow-y-auto overscroll-contain lg:h-[534px]">
              <AppBoard interactive={false} />
            </div>
          </DesktopStage>
          <p className="mt-3 text-center">…「打开完整演示 →」（demo.open，现链接移此）</p>
        </div>
        （lg:h-[534px] = 手机 bezel 总高 582 − 舞台上下 padding 48，两列底缘对齐；
          md 以下自然高度，舞台内滚）
    右：<div className="flex justify-center lg:justify-start">
          <PhoneFrame><RemoteBoard onOpenDetail={goDemoD2} /></PhoneFrame>
        </div>
        （bezel 版静态可交互：chips 筛选/删卡/声音·月亮 toggle 均可用；
          点卡不开手机详情，改跳 /:lang/demo#d2——RemoteBoard 新 onOpenDetail 注入通道）
```

- `RemoteBoard` 改动（唯一）：`export function RemoteBoard({ onOpenDetail }: { onOpenDetail?: () => void })`——卡 onClick 改 `onOpenDetail ? onOpenDetail() : setRemote({ page: "detail" })`；D2 场景不传 prop，行为不变。
- `Hero` 内导航回调：`const navigate = useNavigate(); const { lang } = useParams();` → `goDemoD2 = () => navigate(\`/${lang ?? "zh"}/demo#d2\`)`（ScrollManager 锚点落位，复用 demo#d1–d4 已验证链路）。
- 移动端（<lg）：两排各单列堆叠——文案列 → 海报 → 看板窗 → 手机窗。
- `Home.tsx` 宽度统一：六个 section 包裹全部 `max-w-5xl` → `max-w-7xl`（StoriesSection/OpenSource/DownloadCta 自身无 max-w 容器，包裹层改即全宽；OpenSource 内 `max-w-xl` 文本限宽保留）。TopBar 内层 `max-w-5xl` **不动**（决策 1 只涉标签微调；对齐问题记交接备注）。
- `WorkflowCompare.tsx`：步骤标题 `text-sm` → `text-base`、描述 `text-xs` → `text-sm`（左右两列同升一档）；`compare.w4d` 走 i18n 改值补「+预设组一键对某工具切换常用组合」解法尾注（见改值表）；其余不动。

---

## Kimi 完整 TUI 规格（T42，`KimiShellTui.tsx` 内容重写）

对照 `kimi-code-full-tui.png` 结构 1:1，会话内容换 tuvis 语境（决策 12「结构同图文案换」）；TuiShell 壳 / 拖动横滚 / 右键菜单 / 灯位全保留；色值沿用组件现有 Kimi 板（底 `#2B2B2B` / 正文 `#D7D7DB` / 蓝 `#4C7CFF` / 次 `#9EA0A6` / 边 `#3A3A3E`；绿行 `#4EC98A` 同 TONE.ok）。

```
① 蓝框欢迎盒（w-fit rounded-md border border-[#4C7CFF] p-3，扩为 7 行）：
   Welcome to Kimi CLI!                        text-white font-semibold
   Send /help for help information.            #9EA0A6
   Directory: ~/code/tuvis-app                 前缀 label 灰（slice 手法沿用现状）+ 值正文
   Session: 4d244680
   Model: kimi-k2-thinking-turbo
   Version: 2.1.1
   MCP: 2 connected
② 宣传段（mt-3 两行）：
   ✦ Kimi Code Desktop is here                text-white font-semibold
     Run /desktop to try the desktop app now.  #9EA0A6，其中 /desktop 用 #4C7CFF
③ MCP 绿行 ×2（mt-3，#4EC98A）：
   ● filesystem MCP server connected
   ● tuvis-remote MCP server connected
④ 用户消息行（mt-3）：✻ 帮我规划看板的远程审批卡      （✻ #9EA0A6 + 正文 #D7D7DB）
⑤ 斜体思考行（mt-2，italic #9EA0A6）：
   Thinking… 先看现有卡片与审批流，再定文案与状态色
⑥ 回复正文（mt-2，5 行；路径 #4C7CFF）：
   好的，远程审批卡这样规划——审批通道已有基础（src/remote/approve.rs）：
   • 红卡 = 待批准，命令全文 mono 展示
   • 「允许」→ ✓ Approved 续跑，全程留痕
   • 结果自动记入用量账本
   要先把卡面草稿写进 docs/remote-card.md 吗？
⑦ 底部输入框（mt-3 rounded-md border border-[#3A3A3E] px-3 py-2）：
   > █                                        （> 正文色；█ #D7D7DB blink 1.1s，同现状光标）
⑧ 底部状态栏（TuiShell footer，替换现快捷键栏；bg-[#232326] border-t border-[#3A3A3E]
   px-3 py-1.5 text-[10.5px] #9EA0A6，三段 flex justify-between）：
   左  GLM-5.3-Flash · thinking: high         （模型名 #D7D7DB，档位灰）
   中  ~/code/tuvis-app                        （hidden md:inline，窄屏让位）
   右  context: 4% (33k/977k)
```

文案常量集中文件头（WELCOME / PROMO / MCP / SESSION / STATUS 五组），全部硬编码不入 i18n。旧「moonshot@kimi-cli 提示符 + 18:37 快捷键状态栏」删除（被 ④⑦⑧ 取代）。

**主看板字号降档（决策 10，精确类名）：**
- `SessionCard.tsx`：项目名 `text-sm` → `text-[13px]`；两行消息预览 `text-xs` → `text-[11px]`（`min-h-[2.5rem]` 同步 `min-h-[2.3rem]`）；slug/branch/badge/底行 `text-[10px]` 不动。
- `AppBoard.tsx`：摘要行 `text-xs` → `text-[11px]`（Activity/会话数/等待数继承）。

**NotificationCard 统一审批视觉（决策 11，对照 ClaudeTui 近黑/橙语言）：**
- 卡底 `bg-app-bg border-app-line` → `bg-[#1A1A1A] border-[#333]`，**左缘橙条** `style={{ borderLeft: "2px solid #D97757" }}`；
- 标题 `text-app-ink` → `text-[#D8D3C8]`，正文 `text-app-mut` → `text-[#8B857A]`，关闭 × `text-app-mut hover:text-app-ink` → `text-[#8B857A] hover:text-[#D8D3C8]`；
- app 图标 / 动效 / role=button / 键盘激活不动；D1（点开 TUI 审批场景）与 D4（宠物通知）两处调用零改动——统一样式自动生效（决策「审批通知弹窗统一」）。

---

## D2 同高全展开 + 文件预览 + 子 Agent chip（T43）

**同高全展开（决策 13）：**
- `PhoneFrame.tsx` 加变体：`{ children, autoHeight = false }`——`autoHeight` 时面板 `flex flex-col rounded-[26px] border border-app-line bg-app-bg p-4`（**去 `h-[560px]` 与 `overflow-y-auto`**，内容自然高）；默认 false，首页（T41）与其余调用零影响。
- `RemoteScene.tsx`：grid `items-start` → `md:items-stretch`，`<PhoneFrame autoHeight>`；ClaudeTui 根加 `className="h-full"`（TuiShell 为 flex-col + body `min-h-0 flex-1`，随行高自然撑满，内容顶对齐 = 真终端观感）；删 `md:mt-6`。滚动转移到 PlayerFrame 舞台（h-[420px]/md:h-[500px] 定高内滚不变，页面不跳）。
- `RemoteDetail` 本体已无 max-h/内滚（P10 T36 已去），核对即可。

**文件预览升级（`remote/FilePreview.tsx` 新建，替换 RemoteDetail 内现面板）：**

```
数据 FILES = [
  { path: "src/remote/approve.rs",  kind: "diff",  diff: 现有 DIFF_LINES 8 行原样迁入 },
  { path: "docs/remote-card.md",    kind: "md",    md: "# 远程审批卡\n\n## 卡面\n- 命令全文 mono 展示\n- 允许 / 拒绝双钮\n\n## 状态流转\n`pending → approved`，全程留痕。\n" },
  { path: "public/pet/bell.png",    kind: "image", meta: "512 × 512 · 38 KB" },
  { path: "src/main.rs",            kind: "code",  lines: ["fn main() {", "    tuvis::run()", "}"] },
]
结构（面板头 FolderIcon + t("demo.remote.files") + 关闭钮，沿用现状）：
  ① 筛选 chips 行（新增，面板头下）：全部（demo.filter.all 复用）/ 仅改动（f.changed）/ 文档（f.docs）/ 图片（f.images）
     —— 点击过滤左树列表（隐藏不匹配项）；chips 样式沿用 RemoteDetail chip()
  ② 左文件树（w-1/2）：点击切 active 文件（本地 state，默认 approve.rs），active 高亮沿用
  ③ 右预览（w-1/2，按 active.kind 分支）：
     diff  → 现有着色行（DIFF_CLS 原样）
     md    → <ReactMarkdown remarkPlugins={[remarkGfm]}>{file.md}</ReactMarkdown>
              包 text-[11px] leading-relaxed text-app-ink 容器；标题/代码/列表用默认样式 +
              少量 components 覆写（h1/h2 → text-xs text-app-ink font-semibold；code → font-mono
              rounded bg-app-accent px-1）——与 DocsArticlePage 渲染口径一致
     image → 占位块：aspect-[4/3] rounded-lg border border-dashed border-app-line bg-app-accent
              flex flex-col items-center justify-center（🖼 emoji + 文件名 mono text-[10px] + meta text-[10px] text-app-mut）
     code  → font-mono text-[10px] leading-relaxed 纯行渲染（app-mut）
```

react-markdown / remark-gfm 为已就位依赖（在途用户手册工作引入），FilePreview 直接 import，**不新增包**。

**子 Agent chip 预览（RemoteDetail 内新增，置于头部行与计划 banner 之间）：**

```
<div className="flex flex-wrap items-center gap-1.5">
  <span className="text-[10px] text-app-mut">{t("usage.ws.agents")}</span>   ← 复用「子代理」
  3 枚 chip（静态 + title 悬浮说明）：
  <span className="flex items-center gap-1.5 rounded-full border border-app-line bg-app-card px-2 py-0.5">
    <span className="h-3.5 w-3.5 rounded-full bg-{色} text-[8px] font-bold leading-[14px] text-center text-white">S</span>
    <span className="font-mono text-[10px] text-app-ink">scout</span>
    <span className="text-[9px] text-green-600">✓ {t("badge.idle")}</span>
  </span>
  · scout    ✓ 已完成（badge.idle，绿）   头像 bg-amber-500「S」
  · writer   ▶ 运行中（badge.running，黄） 头像 bg-sky-500「W」
  · checker  ⏸ 等待操作（badge.waiting，红）头像 bg-violet-500「C」
</div>
```

**D3 资源管理扩展（`ResourcesScene.tsx`，三类资源 + 预设组）：**

- 仓库大卡头部新增资源类型段控（样式同「按资源/按工具」段控）：`Skill (73)` / `MCP (6)` / `插件 (5)`——state `type: "skill" | "mcp" | "plugin"`，切换换表体；「按资源/按工具」toggle 保留且对三类通用（按工具 = 各工具 lit 行 chips，现渲染路径复用）。
- **MCP 表**（6 行，矩阵同构）：行 = server 名（filesystem / context7 / desktop-commander / tuvis-remote / playwright / sequential-thinking）；列 = 现有五工具列，**列表头在工具名下加配置文件小注**（text-[9px] font-mono text-app-mut：claude `.mcp.json` / codex `config.toml` / opencode `opencode.json` / kimi `mcp.json` / zcode `settings.json`）；单元格点亮 = 已写入该工具配置文件（toggle/allOn 交互同 Skill）；pinned 列不渲染。
  初始点亮：filesystem{claude,codex,opencode,kimi}、context7{claude,kimi}、desktop-commander{codex}、tuvis-remote{claude,codex,kimi,zcode}、playwright{}、sequential-thinking{zcode}。
- **插件表**（5 行，同构）：代码导航{claude,codex} / 表格引擎{claude,kimi} / 图表渲染{claude,codex,opencode} / 语音批注{} / petdex 桥{kimi}；pinned 列不渲染。
- **Skill 预设组（决策 14）**：搜索行下新增一行——label `t("res.preset")` + 4 枚 chips（硬编码名）：`Full Stack Dev` / `Code Review` / `数据分析` / `写作助手`。预设 = 行×工具点亮快照，点击整组覆写 `rows.on`：

| 预设 | 点亮矩阵（未列出行 = 全灭） |
|---|---|
| Full Stack Dev | ts-sdk-author{claude,codex,zcode} · ui-ux-pro-max{claude} · contribute{claude,codex} · quant-chart{claude,codex,kimi,zcode} · doc-writer{zcode} |
| Code Review | pr-review{五列全亮} · ts-sdk-author{claude,zcode} · doc-writer{claude} |
| 数据分析 | quant-chart{五列全亮} · 信评-调卷流水线{claude,kimi} |
| 写作助手 | doc-writer{五列全亮} · contribute{claude} |

  当前矩阵与某预设深相等 → 该 chip `aria-pressed` 高亮（active 态样式沿用 petChip 选中口径）。

---

## D4 弹窗 + petdex + 头顶常驻卡（T44，`src/demo/PetDialogs.tsx` 新建）

弹窗壳（两弹窗共用）：受控 `{ open, onClose }`；`fixed inset-0 z-50` 背景层 `bg-black/40`（点击关）+ 居中 `w-[min(92vw,520px)] rounded-[14px] border border-app-line bg-app-bg p-4 shadow-pop`；`role="dialog" aria-modal="true" aria-label={标题}`；Esc 关（useEffect keydown）；容器 `tabIndex={-1}` + open 时 focus。

**SwitchPetDialog（对照 pet-switch-grid.png）：** 标题 `t("pet.menu.switch")`（复用「切换宠物」）+ `grid grid-cols-2 gap-3` 四卡：
- 卡 = 头像（`frameStyle("idle", 0, 0.5, pet)` 大图，雪团/煤球沿用 B29 filter 换色）+ 名字 text-xs font-medium + 徽标 `rounded-full border border-app-line px-1.5 text-[9px] text-app-mut`「`{t("pet.badge.builtin")} · v2`」（v2 硬编码）+ 底行两小图标（有语音 → VolumeIcon `title={t("pet.behavior.voice")}`；有气泡 → 自绘 CC 图标 `title={t("pet.subtitle")}`）。
- 当前宠物卡 `ring-2 ring-app-btnp`；未导入（雪团/煤球且 `importPhase !== "done"`）卡 `opacity-60 cursor-not-allowed` + `title={t("demo.na")}`；可点卡 → `onPick(pet)` + 关弹窗。
- 入口：右键菜单「切换宠物」由 bell↔starry 循环改为开本弹窗（`pet.menu.switch` 文案不变）。

**ImportPetDialog（对照 pet-import-dialog.png）：** 标题 `t("pet.import.title")` + 三 tab（`flex border-b border-app-line`，选中 `border-b-2 border-app-btnp font-semibold text-app-ink`，未选中 `text-app-mut`）：
- tab1 `从 codex 导入` / tab2 `文件夹或压缩包`：静态说明区（虚线框 + `title={t("demo.na")}` + 灰字一行「演示版未开放」——文案取 demo.na 值），不可操作。
- tab3 `petdex 在线导入`（默认选中态）：
  - 说明行（text-xs text-app-mut leading-relaxed）：`t("pet.import.hint")`——zh 文案即决策原文「先去 petdex.dev 画廊挑选，把宠物页链接粘贴到下面（如 https://petdex.dev/pets/capvolt）」；
  - 输入框（rounded-lg border border-app-line bg-app-card px-3 py-1.5 text-xs，placeholder `t("pet.import.placeholder")`）；
  - 按钮排：`浏览 petdex.dev` = **真实外链** `<a href="https://petdex.dev/" target="_blank" rel="noopener noreferrer">`（次级描边钮 + 自绘外链图标）；`下载并暂存` = 主钮（输入为空 disabled；点击 → pulse 800ms → `✓ {t("pet.repo.imported")}` disabled 态——模拟导入语义复用「已导入」）。
- 入口：在线仓库卡头部新增「导入宠物」链接钮（`t("pet.import.title")`，触发排不加）。

**头顶常驻卡组（对照 pet-head-cards.png，PetUsageScene 宠物容器内、瞬时状态卡上方）：**

```
<div className="pointer-events-none absolute -top-28 left-1/2 w-56 -translate-x-1/2 space-y-1.5">
  用量摘要卡（pointer-events-auto，onPointerEnter/Leave 复用现有 hover 浮窗 state）：
    rounded-xl border border-app-line bg-app-bg px-2.5 py-1.5 shadow-soft
    行1：text-[10px] font-semibold text-app-ink {t("pet.usage")}
    行2：font-mono text-[10px] text-app-mut $12.40 · 128k tok
  消息卡 1：行「ZCode · 执行 P11 计划」text-[10px] text-app-ink + 右侧 pill
    「等待操作」text-[9px] text-red-600（⏸ 前缀）
  消息卡 2（两行）：「✓ 已释放 0.5GB」text-[10px] text-green-600
                  「Kimi Code zh 你好 · 已完成」text-[10px] text-app-mut
</div>
（消息卡文案硬编码；卡组常驻不随剧本进出；与瞬时 petRun.card/fed 迷你卡纵向错开 -top-28 层位）
```

既有 hover 用量浮窗保留（触发源从宠物本体扩展为「宠物本体 + 用量摘要卡」双入口）；在线仓库卡/编辑行为卡（P10）保留不动。

**账本全展开（决策 16，`LedgerSection.tsx`）：** 看板窗滚动容器 `<div className="h-[420px] overflow-y-auto overscroll-contain md:h-[500px]">` → `<div>`（自然高，页面随内容延长）；吸顶头 `sticky top-0 z-10 … bg-app-bg/95 backdrop-blur` → 去 sticky/z/backdrop（保留 `border-b border-app-line px-4 py-2.5`）。**吸顶去留已裁定：去掉**——展开后无内滚容器 sticky 失效语义，且相对页面滚动会与 TopBar（sticky top-0 z-20）层叠争位；chips 常驻页流内更稳。窗头/五档联动/趋势/小结/分布逻辑零改动。

---

**i18n 增量总表（26 key，zh / en；终值 257 → 283）：**

T40（新增 10）：

| key | zh | en |
|---|---|---|
| `nav.home` | 首页 | Home |
| `matrix.title` | 八款工具兼容矩阵 | Compatibility matrix |
| `matrix.desc` | 会话监控、Skill·MCP 管理、远程操控——兔维斯在各工具上的支持程度一表看清。 | Session monitoring, skill & MCP management, remote control — what Tuvis supports on each tool, at a glance. |
| `matrix.legend.yes` | 支持 | Supported |
| `matrix.legend.partial` | 部分 | Partial |
| `matrix.legend.experimental` | 试验性 | Experimental |
| `matrix.legend.no` | 不支持 | Not supported |
| `matrix.updated` | 更新于 {{date}} | Updated {{date}} |
| `matrix.codexNote` | † Codex 分 CLI 与 APP：CLI 支持完整远程（L4），APP 仅查看。 | † Codex ships as CLI and APP: the CLI supports full remote control (L4); the APP is view-only. |
| `matrix.source` | 矩阵随版本更新，数据源为 tuvis 仓库 docs/capabilities.json。 | The matrix updates with each release; sourced from docs/capabilities.json in the tuvis repo. |

T43（新增 6）：

| key | zh | en |
|---|---|---|
| `demo.remote.f.changed` | 仅改动 | Changed |
| `demo.remote.f.docs` | 文档 | Docs |
| `demo.remote.f.images` | 图片 | Images |
| `res.tab.skill` | Skill | Skill |
| `res.tab.mcp` | MCP | MCP |
| `res.tab.plugin` | 插件 | Plugins |

T44（新增 10）：

| key | zh | en |
|---|---|---|
| `pet.badge.builtin` | 内置 | Built-in |
| `pet.subtitle` | 字幕 | Subtitles |
| `pet.import.title` | 导入宠物 | Import pet |
| `pet.import.codex` | 从 codex 导入 | Import from Codex |
| `pet.import.folder` | 文件夹或压缩包 | Folder or archive |
| `pet.import.petdex` | petdex 在线导入 | Import from petdex |
| `pet.import.hint` | 先去 petdex.dev 画廊挑选，把宠物页链接粘贴到下面（如 https://petdex.dev/pets/capvolt） | Pick a pet in the petdex.dev gallery first, then paste its page link below (e.g. https://petdex.dev/pets/capvolt) |
| `pet.import.browse` | 浏览 petdex.dev | Browse petdex.dev |
| `pet.import.download` | 下载并暂存 | Download & stage |
| `pet.import.placeholder` | 粘贴宠物页链接… | Paste a pet page link… |

T41/T42：新增 0（Hero 复用 demo.open/hero.*；Kimi/通知卡内容硬编码）。

**i18n 改值表（3 处）：**

| key | zh 旧→新 | en 旧→新 | 落点 |
|---|---|---|---|
| `compare.w4d` | 同一份 Skill 复制八份，改一处漏七处。 → **同一份 Skill 复制八份，改一处漏七处——兔维斯统一仓库，预设组一键对某工具切换常用组合。** | The same skill copied eight times — fix one, miss seven. → **The same skill copied eight times — fix one, miss seven. Tuvis keeps one repo, and preset groups switch a tool's favorite combos in one click.** | T41 |
| `demo.detail.d1s5` | Kimi CLI 窗：蓝框欢迎盒、moonshot@kimi-cli 提示符与底部快捷键状态栏，一一对应官方 GIF 帧。 → **Kimi Code 完整 TUI：七行欢迎盒（Version / MCP 已连接）、Kimi Code Desktop 宣传段与 /desktop 入口、两条 MCP 绿行、思考与带路径高亮的回复，底部是 GLM-5.3-Flash 状态栏与 context 余量。** | → **The full Kimi Code TUI: a seven-line welcome box (Version / MCP connected), the Kimi Code Desktop promo with /desktop, two green MCP lines, thinking and a path-highlighted reply, and a GLM-5.3-Flash status bar with context headroom at the bottom.** | T42 |
| `demo.detail.d3s1` | Skill 与 MCP 统一收进「兔维斯仓库」… → **Skill、MCP 与插件三类资源统一收进「兔维斯仓库」，一处修改、处处生效；Skill 预设组一键切换五工具的派发矩阵；~/.agents 目录与 Manifest 安装都是入口。** | → **Skills, MCP servers and plugins live in one Tuvis repo — change once, effective everywhere. Skill preset groups re-dispatch the five-tool matrix in one click; the ~/.agents directory and Manifest install are also entry points.** | T43 |

**死 key 处置（保留 json 不删，parity 只查键集合与空值）：** 本期新死 `nav.download`（TopBar 移除免费下载钮；Hero CTA 与 DownloadCta 不受影响）；P8–P10 遗留死 key 照旧。

**文件总览：**

新增（4 个源文件 + 2 个内容/声明文件）：
```
src/home/CompatMatrix.tsx            # T40 兼容矩阵板块（数据 = content/capabilities.json）
src/content/capabilities.json         # T40 同步产物（首版 = capabilities.for-tuvis.json 拷入，入 git 兜底）
src/content/capabilities.d.json.ts    # T40 JSON 模块类型声明（仿 changelog.d.json.ts）
src/demo/remote/FilePreview.tsx       # T43 文件预览升级（md 渲染 + 图片占位 + 筛选）
src/demo/PetDialogs.tsx               # T44 SwitchPetDialog + ImportPetDialog
```

删除：无。

修改（约 18 个既有文件）：
```
scripts/split-changelog.mjs           # T40 双源同步（默认 api.github.com + 重试 + 保底）
scripts/split-changelog.test.mjs      # T40 +2 用例（decodeContent / validateCapabilities）
README.md                             # T40「内容同步」小节（命令/源/flags/失败语义/限流提示）
src/components/layout/TopBar.tsx      # T40 首页钮 + 功能锚修复 + 移除下载钮 + 间距字重
src/pages/Home.tsx                    # T40 插矩阵；T41 六 section 统一 7xl
src/home/Hero.tsx                     # T41 两排 2×2 重排
src/home/WorkflowCompare.tsx          # T41 字号升档（w4d 走改值）
src/demo/remote/RemoteBoard.tsx       # T41 onOpenDetail 注入通道
src/demo/AppBoard.tsx                 # T42 摘要行字号降档
src/demo/SessionCard.tsx              # T42 卡片字号降档
src/demo/NotificationCard.tsx         # T42 近黑/橙统一视觉
src/demo/KimiShellTui.tsx             # T42 完整 TUI 重写（壳不动）
src/demo/PhoneFrame.tsx               # T43 autoHeight 变体
src/demo/scenes/RemoteScene.tsx       # T43 items-stretch + autoHeight + h-full
src/demo/remote/RemoteDetail.tsx      # T43 SubAgentChips + FilePreview 替换
src/demo/scenes/ResourcesScene.tsx    # T43 三类资源 + MCP/插件 + 预设组
src/demo/scenes/PetUsageScene.tsx     # T44 弹窗接线 + 头顶常驻卡 + 菜单改开弹窗
src/demo/LedgerSection.tsx            # T44 全展开（去定高与 sticky）
src/i18n/{zh,en}.json                 # 各任务分批 +26 key / 改值 3
docs/superpowers/plans/progress.md    # 每任务控制方追加
```

---

## 关键设计权衡（B31–B40，评审时对照）

- **B31 TopBar 锚点 = hash 路由链接而非命令式滚动**：「功能」改为 `<Link to={`/${lang}#features`}>`（lang 取 useParams），滚动交既有 ScrollManager（demo#d1–d4 已验证：LangLayout 子先挂载、父 effect 后跑，#features 必已存在）。对比「首页 scrollIntoView / 非首页先导航再滚」的双分支方案：无状态机、任何页面一致、语言切换后仍正确。代价：已在锚点再点不重滚（可接受）；Home 链接需一次 useParams。
- **B32 双源同步走 api.github.com contents 通道**：raw 域间歇被拦（决策 2 事实），contents 通道稳定且带 base64 结构；失败保底（产物入 git）+ 退出 0 使 dev/build 永不被网络打断——比「构建期强依赖网络」与「git submodule」都轻。代价：未认证限流 60 次/小时（每次 dev/build 消耗 2 次），README 提示频繁重启用 `--offline`；base64 多一步解码与结构闸门。
- **B33 矩阵文字态 + JSON 单一源 + nameEn 前向兼容**：单元格用「✓/✓/🧪/✕ + 文字」而非图标色块——可读性与 A11y（文字自带语义）优于纯 emoji（JSON legend 的 ✅◐❌ 仅是仓库侧 README 口径，站点态文案走 i18n 双语）。行名/组名直接用 JSON 中文（同 changelog「内容以中文维护」先例），渲染器读 `nameEn ?? name`，tuvis 仓库未来补英文名零改动跟进。代价：en 页行名暂为中文（与 changelog 页一致的产品口径）。
- **B34 Hero 两排各自对齐策略**：第一排不设固定高——海报 `w-full` 高 = 列宽 × 1.436 自然撑行，文案列 `items-center` 垂直居中（最稳，无 magic number）；第二排以手机为高度锚——左窗内滚区 `lg:h-[534px]`（= 手机 bezel 总高 582 − 舞台 padding 48）显式对齐，md 以下回退 h-[440px] 自然堆叠。对比「grid items-stretch 自适应」：stretch 行高取两列自然高最大值（AppBoard 全内容 ~700px 会反客为主），定高锚 + 内滚才满足「高度按手机对齐」。
- **B35 RemoteBoard `onOpenDetail` 注入而非首页包 Link**：整卡 Link 会与卡内删卡钮/筛选 chips 构成嵌套交互（a11y 违例）；prop 注入让 D2 行为零分支不变、首页只接管「点卡」这一个动作 → navigate /:lang/demo#d2。代价：RemoteBoard 多一个可选 prop。
- **B36 NotificationCard 统一近黑视觉波及 D4**：决策 11 要求「统一」，宠物通知也换近黑卡——语义一致性优先（都是「系统级通知」拟真）；暖纸站点上深色通知卡 = 真实系统通知观感（对照真实审批 UI 截图语言）。代价：D4 通知与场景浅色调形成反差（预期效果，非回归）。
- **B37 Kimi 完整 TUI 硬编码 tuvis 语境**：结构逐行对照参考图、会话内容换 tuvis 语境（决策 12），状态栏模型名照决策写 GLM-5.3-Flash（用户实测配置）——真实感优先，P9 TUI 口径延续。代价：文案与截图不同源（结构 1:1、内容重写，验收按结构+元素+配色对照而非逐字）。
- **B38 D2 同高 = PhoneFrame autoHeight + ClaudeTui h-full**：手机去定高去内滚、内容全展开；ClaudeTui 借 TuiShell flex-col 特性 `h-full` 撑满行高（终端留白即真实）。滚动上移到 PlayerFrame 舞台（页面仍不因演示伸缩）。对比「双侧都定高」：违背「内容全展开无滚动」决策。代价：D2 详情态舞台内滚变长（预期）。
- **B39 D3 三类资源共用矩阵渲染 + 预设组快照**：MCP/插件复用 Skill 表格与 toggle/allOn 路径（仅换数据与列表头小注），代码增量最小；预设组 = 行×工具点亮快照，点击整组覆写（「一键切换派发矩阵」字面实现），深相等高亮当前预设。代价：预设覆写不可撤销（无 undo，再点其他预设或手动改回——演示语义足够）。
- **B40 D4 弹窗受控对话框 + 账本去 sticky**：两弹窗统一 role=dialog/Esc/背景关/focus（a11y 达标）；petdex 为真实外链（rel=noopener + 新窗）。账本展开后 sticky 相对页面滚动会与 TopBar 争位（z-20 已占），裁定去 sticky 保留普通头——展开后 chips 不吸顶是可接受代价（页面滚动天然可达）。

---

## P11-A · 导航 + 双源同步 + 兼容矩阵

### Task 40: TopBar 导航修正 + split-changelog 双源升级 + CompatMatrix 板块

**Files:**
- Create: `src/home/CompatMatrix.tsx` `src/content/capabilities.json` `src/content/capabilities.d.json.ts`
- Modify: `scripts/split-changelog.mjs` `scripts/split-changelog.test.mjs` `README.md` `src/components/layout/TopBar.tsx` `src/pages/Home.tsx` `src/i18n/{zh,en}.json`（+10 key）

- [x] **Step 40.1: split-changelog.mjs 双源升级（完整代码见前文专节）**

`parseChangelog` 原样保留；新增 `decodeContent` / `validateCapabilities` 导出与 CLI 双源逻辑；行为核对：联网时两产物刷新、断网/限流时警告 + 产物不动 + 退出 0、`--in` 给出时 changelog 走本地且网络 changelog 被跳过、`--offline` 全跳。手工验证：

```bash
node scripts/split-changelog.mjs                 # 期望：两条 [sync] … -> … 日志，changelog.json 首版变 0.5.6、capabilities.json 生成
node scripts/split-changelog.mjs --offline       # 期望：无网络请求，产物不动，退出 0
node scripts/split-changelog.mjs --in ../mam-worktree/CHANGELOG.md   # 本地回退通道（源存在则走本地）
git status                                       # capabilities.json 为新文件；changelog.json 如有更新随本任务 commit
```

（tuvis 仓库尚未提交 docs/capabilities.json 时，capabilities 拉取失败 → 保底；此时手工 `cp docs/design/p11-ref/capabilities.for-tuvis.json src/content/capabilities.json` 作为首版入 git，后续同步自动覆盖。）

- [x] **Step 40.2: 测试 +2 与 README「内容同步」小节**

`split-changelog.test.mjs` 追加：`decodeContent`（`{content: Buffer.from("## [x] – 2026-01-01\n- a\n").toString("base64") + "\n"}` 带换行 base64 → 正确解码）与 `validateCapabilities`（合法最小结构通过；tools 缺失 / rows 非数组 / null 拒绝）。README 小节内容：两数据源（CHANGELOG.md / docs/capabilities.json）、命令 `pnpm sync:changelog`、`--in` / `--offline` flags、失败保底语义、api.github.com 未认证 60 次/小时限流提示。

- [x] **Step 40.3: TopBar 修正**

```tsx
const { t } = useTranslation();
const { lang } = useParams();                       // ← /:lang 布局内必得
{/* 标签列（最前加首页，间距 gap-5→gap-6，字重 font-medium）： */}
<Link to={`/${lang ?? "zh"}`}            className="flex h-14 min-w-6 items-center justify-center px-1 font-medium hover:text-ink">{t("nav.home")}</Link>
<Link to={`/${lang ?? "zh"}#features`}   className="flex h-14 min-w-6 items-center justify-center px-1 font-medium hover:text-ink">{t("nav.features")}</Link>
{/* demo/docs/changelog 三链照旧（补 font-medium）；移除「免费下载」钮及 onClick 滚动 hack；LanguageSwitcher 保留 */}
```

`to="?#"` 伪链与 `document.getElementById("download")` 滚动 hack 一并删除；#download 锚仍由 Hero CTA 与 DownloadCta id 承接。验证：任意页（/zh/docs、/en/demo）点「功能」→ 回首页滚到 #features；点「首页」→ 回语言根。

- [x] **Step 40.4: CompatMatrix 组件 + 类型声明 + Home 插位**

按「兼容矩阵板块规格」实现；`capabilities.json` 首版与 `.d.json.ts` 声明落盘；Home.tsx 在 Hero 与 WorkflowCompare 之间插 `<div className="mx-auto max-w-7xl"><CompatMatrix /></div>`（T41 再统一其余宽度）。

- [x] **Step 40.5: i18n + 机器验证**

i18n +10（增量总表 T40 部分）。

```bash
pnpm exec tsc --noEmit && pnpm test    # Expected: 27 passed（25 + 2；parity 267 key）
pnpm build && pnpm dev
# 浏览器核对（zh/en 各一遍）：
# 首页 = Hero → 兼容矩阵（三组卡：桌面提醒 2 行 / Skill·MCP 4 行 / 远程操控 6 行；8 列工具头带图标；
#   单元格四态文字 + 图例行 + 更新日期；Codex 列头 † 悬浮出 CLI/APP 脚注；尾注两行）→ 对比区 → …；
# TopBar：首页/功能两新链路 + 免费下载已移除 + 间距字重；矩阵部分格悬浮出 note（如「dsh 为只读」）；
# 375px：矩阵表格横滚 + 首列 sticky 可见；/changelog 页数据正常（同步产物消费回归）
```

**验收标准：** 双源脚本三态（联网刷新 / 断网保底退出 0 / --in 本地）全通且 dev/build 不因断网失败；27 测试绿（新 2 用例覆盖解码与闸门）；矩阵三组 12 行 × 8 列与 capabilities.json 逐格一致、四态图例与尾注齐全、移动端横滚 + 首列锁定；TopBar 首页/功能全页面正确、下载钮零残留；parity 绿（267 key）。

---

## P11-B · 首页 2×2 与宽度统一

### Task 41: Hero 两排 2×2 + 全板块 7xl + 对比区升档

**Files:**
- Modify: `src/home/Hero.tsx` `src/pages/Home.tsx` `src/home/WorkflowCompare.tsx` `src/demo/remote/RemoteBoard.tsx` `src/i18n/{zh,en}.json`（+0 key、改值 1 处）

- [x] **Step 41.1: Hero 重排（规格见前文专节）**

左列去 200px 海报缩略；海报右列满格圆角 26px；AppBoard 窗移第二排左（`interactive={false}` + 内滚 `lg:h-[534px]`）；「打开完整演示 →」移看板窗下；右列 PhoneFrame + RemoteBoard（onOpenDetail → navigate /:lang/demo#d2）。DesktopStage/Reveal 复用不动。

- [x] **Step 41.2: Home 六 section 统一 max-w-7xl**

`max-w-5xl` 包裹全改 `max-w-7xl`（Stories/OpenSource/DownloadCta 三处 + 确认 Hero/对比区/矩阵已 7xl）。

- [x] **Step 41.3: WorkflowCompare 字号升档 + w4d 尾注**

步骤标题 `text-sm`→`text-base`、描述 `text-xs`→`text-sm`（两列同升）；`compare.w4d` 按改值表更新（zh/en）。

- [x] **Step 41.4: 机器验证 + 浏览器核对**

```bash
pnpm exec tsc --noEmit && pnpm test    # Expected: 27 passed（parity 267 key）
pnpm build && pnpm dev
# 核对（zh/en）：第一排文案列居中 + 海报右列满格圆角 26（行高随海报）；第二排看板窗与手机底缘对齐
#   （窗内滚动可用）+ 点手机卡 → /demo#d2 落位；手机 chips 筛选/删卡/声音·月亮可用且不开详情；
# 「你会这样用它」及以下全板块 7xl（1440px 两边距与 Hero 对称）；对比区字号升档 + w4d 带预设组尾注；
# 375px：两排各单列（文案→海报→看板→手机）；TopBar「功能」仍落 #features；/demo D2 手机行为不变（零 prop 传参）
```

**验收标准：** 两排 2×2 与规格逐项对上（海报比例行高 / 手机锚定行高 / 底缘对齐）；全板块 7xl 无 5xl 残留（`grep -n "max-w-5xl" src/pages/Home.tsx` 零命中）；RemoteBoard 在 D2 零行为变化；对比区字号与 w4d 尾注落地；27 测试绿；parity 绿。

---

## P11-C · 演示精修 II（批 A）

### Task 42: 主看板字号降档 + 通知统一 + Kimi 完整 TUI

**Files:**
- Modify: `src/demo/AppBoard.tsx` `src/demo/SessionCard.tsx` `src/demo/NotificationCard.tsx` `src/demo/KimiShellTui.tsx` `src/i18n/{zh,en}.json`（+0 key、改值 1 处）

- [x] **Step 42.1: AppBoard / SessionCard 字号降档（精确类名见专节）**

- [x] **Step 42.2: NotificationCard 近黑/橙统一（精确类名见专节）**

- [x] **Step 42.3: KimiShellTui 完整 TUI 重写（规格总表见专节）**

文件头五组文案常量（WELCOME/PROMO/MCP/SESSION/STATUS）+ TuiShell 组装；footer 状态栏三段式；删旧提示符与快捷键栏常量。`d1s5` 走 i18n 改值。

- [x] **Step 42.4: 机器验证 + 浏览器核对**

```bash
pnpm exec tsc --noEmit && pnpm test    # Expected: 27 passed
pnpm build && pnpm dev
# 核对：D1 看板卡与摘要行字号收窄（不挤、10px 底行可读）；d1 s2 通知卡 = 近黑底 + 左缘橙条 + ClaudeTui 字色，
#   点击仍开 Claude 审批场景；D4 宠物通知同款；点 kimi 卡开完整 TUI——七行欢迎盒（Version 2.1.1 / MCP: 2 connected）、
#   ✦ 宣传段 + Run /desktop 蓝字、两条 MCP 绿行、✻ 用户行、斜体思考、回复路径蓝高亮、圆点列表、
#   > █ 输入框、底部 GLM-5.3-Flash · thinking: high | ~/code/tuvis-app | context: 4% (33k/977k)；
#   宽行拖动横滚 / 右键菜单 / 红灯关窗不回归；首页 Hero 看板窗（同 AppBoard）字号同步变化
```

**验收标准：** 字号降档后卡片信息密度改善且 A11y 对比不降；通知卡两调用点统一近黑/橙视觉且点击行为不回归；Kimi TUI 与规格逐行对上（7+2+2+1+1+5+1+状态栏）；27 测试绿；parity 绿（267 key）。

---

## P11-D · 演示精修 II（批 B）

### Task 43: D2 同高全展开 + 文件预览/筛选/子代理 chip + D3 三类资源与预设组

**Files:**
- Create: `src/demo/remote/FilePreview.tsx`
- Modify: `src/demo/PhoneFrame.tsx` `src/demo/scenes/RemoteScene.tsx` `src/demo/remote/RemoteDetail.tsx` `src/demo/scenes/ResourcesScene.tsx` `src/i18n/{zh,en}.json`（+6 key、改值 1 处）

- [x] **Step 43.1: PhoneFrame autoHeight + RemoteScene 同高**

`autoHeight` 变体（去 h-[560px]/overflow）；RemoteScene `md:items-stretch` + `<PhoneFrame autoHeight>` + ClaudeTui `className="h-full"`（去 md:mt-6）。

- [x] **Step 43.2: FilePreview 新组件（规格见专节）+ RemoteDetail 接线**

RemoteDetail 现文件面板 JSX 整体替换为 `<FilePreview />`（DIFF_LINES/TREE 数据迁入新文件）；面板头/关闭行为不变（`remote.files` 开关与剧本 s7 不动）。

- [x] **Step 43.3: 子 Agent chip 行（规格见专节，置于头部行下）**

- [x] **Step 43.4: ResourcesScene 三类资源 + MCP/插件表 + 预设组（规格与预设矩阵见专节）**

- [x] **Step 43.5: 机器验证 + 浏览器核对**

```bash
pnpm exec tsc --noEmit && pnpm test    # Expected: 27 passed（player.test 零适配即过；parity 273 key）
pnpm build && pnpm dev
# 核对：D2 详情态手机全展开（无内滚）与右侧 ClaudeTui 同高（终端留白自然）；
#   文件预览：四 chips 筛选过滤左树；approve.rs 着色 diff / remote-card.md markdown 渲染（标题·代码·列表）
#   / bell.png 占位块（虚线框+meta）/ main.rs 代码行；点树切文件；剧本 s7 与触发排「打开文件预览」不回归；
#   子代理三 chip（scout✓/writer▶/checker⏸）悬浮有说明；首页 Hero 手机窗不受 autoHeight 影响（默认定高）；
# D3：Skill(73)/MCP(6)/插件(5) 三页签切换；MCP 列头配置文件小注、点亮=写入配置；预设组四 chips
#   点击整组覆写矩阵、当前组高亮；「按工具」视图对三类可用；体检卡/搜索/折叠头/排序/删除/全部启用不回归
```

**验收标准：** D2 手机与 TUI 同高全展开且 seek 幂等不回归（player.test 原断言全绿）；文件预览四形态（diff/md/image/code）+ 筛选 + 树切换全通；D3 三类资源表与预设组矩阵快照与规格逐项一致；既有 D2 五交互与 D3 全交互零回归；27 测试绿；parity 绿（273 key）。

---

## P11-E · 演示精修 II（批 C）

### Task 44: D4 双弹窗 + petdex 外链 + 头顶常驻卡 + 账本全展开

**Files:**
- Create: `src/demo/PetDialogs.tsx`
- Modify: `src/demo/scenes/PetUsageScene.tsx` `src/demo/LedgerSection.tsx` `src/i18n/{zh,en}.json`（+10 key）

- [x] **Step 44.1: PetDialogs 两弹窗（规格见专节）**

弹窗壳（role=dialog/Esc/背景关/focus）+ SwitchPetDialog（四卡网格/内置·v2 徽标/喇叭·字幕图标/当前高亮/未导入禁点）+ ImportPetDialog（三 tab/petdex 说明行/输入框/真实外链浏览钮/下载并暂存模拟）。

- [x] **Step 44.2: PetUsageScene 接线 + 头顶常驻卡**

右键菜单「切换宠物」改开 SwitchPetDialog；在线仓库卡头部加「导入宠物」入口；宠物容器加头顶常驻卡组（用量卡 + 两条消息卡，用量卡并入 hover 浮窗触发源）；瞬时状态卡/喂食卡/编辑面板/拖动跑动零改动。

- [x] **Step 44.3: LedgerSection 全展开（规格见专节）**

- [x] **Step 44.4: 机器验证 + 浏览器核对**

```bash
pnpm exec tsc --noEmit && pnpm test    # Expected: 27 passed（ledger 8 用例不动；parity 283 key）
pnpm build && pnpm dev
# 核对：右键「切换宠物」→ 弹窗四卡（当前 ring 高亮、未导入灰禁、点卡切换生效并关窗、Esc/背景关）；
#   「导入宠物」→ 三 tab（petdex 默认选中）+ 说明行含示例链接 + 输入空时下载钮 disabled + 填入后
#   pulse 800ms → ✓；「浏览 petdex.dev」新窗打开 https://petdex.dev/（真实外链）；
#   头顶常驻三卡（用量/ZCode 等待操作红/✓0.5GB+Kimi 完成灰）+ 悬浮用量卡出既有浮窗；
#   拖动跑动/三段剧本/喂食/隐藏唤出/语音门控零回归；
# 账本：五档全展开无内滚、页面随内容延长、吸顶不再悬浮；五档 chips 联动与 30 天标签抽稀不回归
```

**验收标准：** 两弹窗与参考图逐项对上（网格卡元素三件套 / 三 tab 与说明行原文 / 双钮语义）；petdex 为真实外链且 noopener；头顶常驻卡常驻且 hover 浮窗保留；账本全展开且数据联动零回归（ledger 8 用例不动全绿）；27 测试绿；parity 绿（**283 key 终值**）。

---

## P11-F · 全站验收

### Task 45: 全站验收（A11y ≥ 95 + 矩阵渲染 + 五场景回归 + 总报告）

**Files:**
- Modify: `docs/superpowers/plans/progress.md`（最终验收报告，控制方写）；发现缺陷最小修复另起 commit

- [x] **Step 45.1: 机器验证全绿**

```bash
pnpm exec tsc --noEmit && pnpm test    # Expected: 27 passed
pnpm build                             # tsc 零错误 + dist/404.html 生成
grep -riE "analytics|gtag|hotjar|plausible|umami" dist/ || echo "zero-tracking ok"
grep -rn "nav.download" src/components/layout/TopBar.tsx || echo "topbar download removed ok"
grep -n "max-w-5xl" src/pages/Home.tsx || echo "home 7xl unified ok"
node scripts/split-changelog.mjs --offline && echo "offline fallback ok"
```

（`grep app-bg\|app-ink\|app-line src/home/` 白名单口径同 P10：CompatMatrix 经 ToolIcon 间接使用的 app 令牌属预期，home 源码不得直接新写 app-* 工具类。）

- [x] **Step 45.2: 滚动与导航回归（zh/en 各一遍）**

- [x] TopBar「首页」（任意页 → 语言根）、「功能」（任意页 → /:lang#features 落 StoriesSection）；「免费下载」钮已移除
- [x] 首页手机卡 → /demo#d2；四仪表卡 → demo#d1–d4；五页 + docs/:slug（在途手册页）正常渲染

- [x] **Step 45.3: 交互矩阵（pnpm preview 逐项勾）**

- [x] 通用（每场景）：播放/暂停/续播；seek+重放；hover 说明；播完回绕；交互即暂停
- [x] 首页：2×2 两排对齐（海报行高/手机行高）；Hero 窗 chips 筛选 + 手机窗四控件 + 点卡跳转；三灯行；矩阵四态/图例/note 悬浮/† 脚注/375px 横滚；对比区 7xl + 升档字号
- [x] D1：七段剧本（s5 Kimi 完整 TUI 逐行对照）；五卡开窗互斥 + 红灯关窗；通知卡近黑点击开审批场景
- [x] D2：同高全展开；五交互 + 文件预览四形态/筛选/树切换 + 子代理 chips；seek 幂等
- [x] D3：三页签 + MCP/插件矩阵 + 预设组覆写与高亮 + 按资源/按工具 + 体检/搜索/折叠/排序
- [x] D4：双弹窗（元素/交互/Esc/背景关）+ petdex 外链 + 头顶常驻卡 + 右键菜单/配置面板/拖动跑动回归
- [x] 账本：全展开 + 五档联动 + 近 7 天回归锚点 + 导出/记录 disabled+title
- [x] 键盘：Tab 可达全部新控件（首页两窗/矩阵表格/预设 chips/文件预览筛选与树/双弹窗内 tab·输入·按钮）；Enter/Space 触发；Focus 出说明

- [x] **Step 45.4: Lighthouse 复测（Chrome DevTools，/zh/ 与 /zh/demo）**

- 记录 Performance / Accessibility 分数进 progress.md
- **硬门槛：Accessibility ≥ 95**（重点复查：矩阵 11px 单元格与图例对比、通知卡近黑底 11px 正文对比、Kimi TUI 10.5px 状态栏、预设/筛选 chips 可聚焦、头顶常驻卡文字对比）
- Performance ≥ P10 基线（首页 74 / 演示 86）；留意 react-markdown 进入 demo chunk 的体积（FilePreview 单文件引入，若跌分明显记 progress 并评估懒加载——本期不作硬门槛）

- [x] **Step 45.5: 终验收 + 总报告（控制方）**

```bash
git add -A && git commit -m "chore: p11 acceptance pass"
# progress.md 追加 P11 总报告：任务/commit 对照表、测试计数（27）、i18n 终值（283 key）、
# Lighthouse 分数、矩阵与四张参考图对照结论、同步脚本三态验证结论、遗留观察项
```

**验收标准（P11 完成的定义）：** 机器验证五条全绿（27 测试 / build / 零追踪 / TopBar 与 7xl 检查 / 离线保底）；45.2 滚动回归全勾；45.3 交互矩阵 8 组全勾；A11y ≥ 95；六条主线逐一闭环（导航与双源同步 / 兼容矩阵 / 首页 2×2 与 7xl / 演示精修 II 三批 / 账本全展开 / 验收）；progress.md 有 P11 总报告。

---

## 交接备注（P12 及以后候选池）

- TopBar 内层仍 `max-w-5xl`，与 7xl 板块左右边缘不齐——若视觉评审要求对齐，下期统一 TopBar/Footer 容器宽度（连带 docs/changelog 页）
- 矩阵行名/组名 en 页暂为中文（JSON 单一源 + nameEn 前向兼容）；tuvis 仓库补 `nameEn` 后官网零改动双语化
- api.github.com 未认证限流 60 次/小时（dev/build 每次耗 2）：CI 或高频重启场景用 `--offline`；如需自动缓存可下期加 ETag 条件请求
- 预设组覆写无 undo；矩阵无按工具切视图/筛选（纯静态表）——需求复活时在 CompatMatrix 加列头点击
- react-markdown 进 demo chunk 的体积影响本期观察（45.4）；如跌分明显，FilePreview 改 React.lazy 懒加载
- 雪团/煤球仍为 CSS filter 占位（弹窗网格同口径）；真精灵表到位后 PETS 注册 + PetId 扩展 + 弹窗卡直切
- hero-poster.png 压缩（二期 E7）继续挂账；首页与 /demo 共享 store 的隔离问题维持 P10 结论
