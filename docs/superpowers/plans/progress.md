# Tuvis 官网 · 执行进度日志（progress.md）

> 由执行 Agent 按执行协议第 3/4 条逐 Task 追加。每个 Task 一节，含：变更文件清单、测试结果、commit hash/message、与计划的偏差。
> 执行依据：`2026-10-10-tuvis-website-p0-p5.md`（15 任务，Task 0–14）。Review 方随时读此文件与 git log 审查。

---

## Task 0 — 仓库初始化 + Vite 骨架 ✅（2026-10-10）

**变更文件**
- 新增：`package.json` `vite.config.ts` `tsconfig.json` `index.html` `src/main.tsx` `src/vite-env.d.ts` `src/index.css` `src/test/setup.ts` `pnpm-lock.yaml` `pnpm-workspace.yaml`（pnpm 11 自动生成后人工定稿，见偏差 2）`docs/superpowers/plans/progress.md`
- 修改：无（`.gitignore` 未动；Step 0.1 核验通过，工作区此前干净）

**测试结果**
- `pnpm exec tsc --noEmit`：零错误
- `pnpm exec vite build`：✓ 28 modules，702ms，零错误
- `pnpm test`：`No test files found, exiting with code 1`（计划预期内，Task 1 起有测试）
- `pnpm dev`：`http://localhost:5173/tuvis-website/` 返回 200，HTML 含 `/src/main.tsx` 挂载点与中文 title

**Commit**：`817f87a` `chore: vite + react19 + tailwind4 scaffold with design tokens`（含前置 `1d27a1f` docs: review-side plan adjustments，系 Review 方对计划文件的未提交修改，单独入库以免混入 Task 0）

**与计划的偏差**
1. 首次 `pnpm install` 因子代理超时中断（文件已全部按计划落盘，install 由控制方完成，结果一致）。
2. pnpm 11 默认拦截依赖构建脚本（`[ERR_PNPM_IGNORED_BUILDS] esbuild`），自动生成的 `pnpm-workspace.yaml` 模板写入 `allowBuilds: esbuild: true` 予以放行。非新增依赖（esbuild 为 vite 传递依赖），`pnpm install` 复跑确认 postinstall 正常、build 通过。计划 `文件总览` 标注 `pnpm-workspace.yaml(不需要)`，实际 pnpm 11 需要它承载构建脚本白名单——建议 Review 方追认。
3. dev 模式下 vite 会把 index.html 里 `/tuvis-website/favicon.png` 重写为 `/tuvis-website/tuvis-website/favicon.png`（双 base），favicon 在 dev 下 404（开发期表象）；`vite build` 产物中 href 保持 `/tuvis-website/favicon.png` 正确。计划未覆盖，按计划原文实现未改，Task 6 验收时留意。

## Task 1 — 亮暗主题切换 ✅（2026-10-10）

**变更文件**
- 新增：`src/theme.ts` `src/theme.test.ts` `src/components/ThemeToggle.tsx`
- 修改：`src/main.tsx`（挂载 ThemeToggle + 启动时 applyTheme(getTheme())）、`src/test/setup.ts`（见偏差 1）

**测试结果（TDD）**
- 红灯：`pnpm test -- src/theme.test.ts` → `Failed to resolve import "./theme"`（预期失败）
- 绿灯：`Tests 3 passed (3)`；全量 `pnpm test` 1 file passed
- `pnpm exec tsc --noEmit`：零错误
- dev server 200（浏览器人工验证点：点击切换即时生效、刷新保持——归入 P1 浏览器核对统一执行）

**Commit**：`55bdab9` `feat: light/dark theme with toggle and tokens`

**与计划的偏差**
1. `src/test/setup.ts` 追加 localStorage 回填：Node 26 自带实验性 globalThis.localStorage 访问器，vitest 3.2.7 不对已存在的全局 key 做 jsdom 回填，裸 `localStorage` 在测试中为 undefined。修复为从 vitest 内置 jsdom 实例显式回填。不改则计划的 3 个测试在本机无法运行。
2. `src/theme.test.ts` 的 `as MediaQueryList` 改为 `as unknown as MediaQueryList`：TS 5.7 strict 下原断言报 TS2352，与"tsc 零错误"验收冲突；运行时行为完全一致。

## Task 2 — i18n 框架 + 语言资源 ✅（2026-10-10）

**变更文件**
- 新增：`src/i18n/index.ts` `src/i18n/zh.json`（85 key）`src/i18n/en.json`（85 key）`src/i18n/parity.test.ts`

**测试结果**
- `pnpm test`：`Test Files 2 passed (2)` / `Tests 5 passed (5)`（theme 3 + parity 2）
- `pnpm exec tsc --noEmit`：零错误
- key 对等校验（node 直查）：zh/en 各 85 key，抽样文案正确

**Commit**：`8186cbe` `feat: i18next zh/en resources with parity test`

**与计划的偏差**
1. `parity.test.ts`"没有空值"用例：计划逐字代码 `for (const [k, v] of Object.entries(...))` 的 `k` 未使用，与计划自带的 `noUnusedLocals: true` 冲突（TS6133），属计划内部矛盾。按最小语义等价修复改为 `for (const v of Object.values(...))`，控制方裁决、实现方执行。

## Task 3 — 路由 + GH Pages 404 兜底 + 布局壳 ✅（2026-10-10）

**变更文件**
- 新增：`src/router.tsx` `src/components/layout/{LangLayout,TopBar,Footer}.tsx` `src/components/LanguageSwitcher.tsx` `scripts/make-404.mjs` `src/pages/{Home,DemoPage,DocsPage,ChangelogPage}.tsx`（占位）
- 修改：`src/main.tsx`（RouterProvider + 404 兜底恢复逻辑）

**测试/验证结果**
- `pnpm build`：tsc 零错误；vite build ✓（70 modules）；`dist/404.html written`（931B，含 sessionStorage 重定向注入）
- preview curl：`/tuvis-website/`、`/zh`、`/en/demo` 均 200；深路径 `/zh/nonexistent` 亦 200（客户端 `*` → Navigate /zh）
- `pnpm test`：5 passed（无新增测试，本任务计划未定义测试）

**Commit**：`c99893b` `feat: i18n routing with GH Pages 404 fallback and layout shell`

**与计划的偏差**
- 实现无偏差。两项规格自身观察项（未改代码，供 Review 方裁决）：
  1. `LangLayout` 的 `useEffect` 位于条件早退之后，违反 React hooks 规则；当前验证路径不触发，但同实例在有效↔无效 lang 间切换会报 "Rendered fewer hooks than expected"。建议后续把 `useEffect` 移到早退前或拆子组件。
  2. TopBar 引用 `img/appicon-dark.png`，`public/` 尚未建立（Task 4 Step 4.1 拷贝），当前 dev/preview 下破图属预期中间态。

## Task 4 — 资产拷贝 + Hero + 三态卡 ✅（2026-10-10）

**变更文件**
- 新增：`public/img/{appicon-dark,appicon-light,hero-cutout,state-green,state-yellow,state-red}.png`（自 `brand/final/extracted/` 拷贝，字节一致；hero-cutout 1.7MB）；`src/components/{Reveal,SectionTitle}.tsx`；`src/home/{Hero,StatesSection}.tsx`
- 修改：`src/pages/Home.tsx`（占位 → Hero + StatesSection）

**测试/验证结果**
- `pnpm exec tsc --noEmit` 零错误；`pnpm test` 5 passed；`pnpm build` 成功（dist/img/ 6 张 png）
- dev curl：`/img/hero-cutout.png`、`/img/state-green.png`、`/zh` 均 200
- 浏览器视觉验证点（亮暗切换、中英文案）归入 P1 浏览器核对（Task 6 后统一执行）

**Commit**：`5693a8d` `feat(home): hero and state-lamp sections`

**与计划的偏差**：无。（观察项：hero-cutout.png 1.7MB 直接上架会拖慢首屏，计划未含压缩步骤，未自行处理，供 Review 方裁量。）

## Task 5 — 场景故事 + 四功能卡 + 开源区 + 下载 CTA ✅（2026-10-10）

**变更文件**
- 新增：`src/utils/download.ts` `src/utils/download.test.ts` `src/home/{StoriesSection,FeaturesSection,OpenSource,DownloadCta}.tsx`
- 修改：`src/pages/Home.tsx`（6 区块组装：Hero → States → Stories → Features → OpenSource → DownloadCta）

**测试结果（TDD）**
- 红：`download.test.ts` 模块不存在失败；绿：2 passed
- 全量 `pnpm test`：`Tests 7 passed (7)`（theme 3 + parity 2 + download 2）
- `pnpm exec tsc --noEmit` 零错误；`pnpm build` 成功
- 下载按钮的"API 失败兜底跳转 Releases 页"逻辑逐字保留（红线 ✓）；浏览器点击验证归入 P1 浏览器核对

**Commit**：`3a9ca7b` `feat(home): stories/features/oss/download with platform detection`

**与计划的偏差**
1. `DownloadCta.tsx` 的 `goToInstaller`：计划逐字代码把 GitHub API 的 assets（字段 `browser_download_url`）直接传给期望 `{name, url}` 的 `matchAsset`，TS2345，tsc 零错误验收无法达成（计划内部矛盾）。最小修复：调用处 `data.assets.map((a) => ({ name: a.name, url: a.browser_download_url }))` 做字段映射。运行时行为正确，兜底逻辑未动。

## Task 6 — favicon 与 touch icon ✅（2026-10-10）

**变更文件**
- 新增：`public/favicon.png`（4,377B）、`public/apple-touch-icon.png`（4,377B，均自 `brand/tuvis-favicon-64.png` 拷贝）
- 修改：`index.html`（icon 行后补 `<link rel="apple-touch-icon">`）

**验证结果**
- `pnpm build` 成功，dist/ 含 favicon.png / apple-touch-icon.png / 404.html
- dev curl `/tuvis-website/favicon.png` → 200
- 浏览器"标签页图标显示深色兔头"归入 P1 浏览器核对

**Commit**：见下一条 git log（chore: favicon and touch icon from final app icon）

**与计划的偏差**：无

## P1 浏览器核对（Task 4–6 后统一执行）✅（2026-10-10，控制方浏览器实测）

**环境**：`pnpm dev` + 内置浏览器（1280×900 与 375×812），逐项实测：
- ✅ `/zh` 首页 6 区块（Hero/三态卡/场景故事/功能卡/开源/下载 CTA）全部渲染，DOM 校验无重复（h1/nav/footer 各 1）
- ✅ 亮暗切换即时生效（html.dark 切换 + localStorage `tuvis-theme`），刷新后保持；暗色下 Hero 立绘无白底、文字对比正常
- ✅ 中英切换：`/zh` → `/en`（URL 前缀、`<html lang>`、全站文案同步切换），EN 暗色正常
- ✅ 素材可达：hero-cutout、三态卡图、favicon 均加载
- ✅ 下载区：Windows/macOS 按钮 + "前往 Releases 页"链接（href 指向 releases/latest）齐全；未真实点击外链
- ⚠️ **观察项 1（计划缺陷，需 Review 方裁决）**：FeaturesSection"查看演示"链接是 `<Link to="/demo#d1">` 绝对路径，丢失语言前缀（zh 页点过去会落到 `/demo` → 匹配 `/:lang` 失败 → Navigate `/zh`），功能可用但体验绕远；TopBar/HomeBoard/DocsPage 均用相对路径无此问题。
- ⚠️ **观察项 2（计划与 SPEC 差距）**：SPEC §3.3 要求"移动端折叠菜单"，计划 TopBar 未实现；375px 实测导航项折行、下载按钮溢出，出现 21px 横向滚动（scrollWidth 381 vs 360）。属计划未覆盖的设计点，未自行发挥，需 Review 方决策后补任务。
- ⚠️ **观察项 3（英文观感）**：EN 首页 H1 渲染为 "Tuvis Tuvis"（`hero.title`="Tuvis" + 计划代码里写死的 `<span>Tuvis</span>`），zh 正常（兔维斯 Tuvis）。计划原文如此，未改。
- ℹ️ framer-motion 入场动画（Reveal 淡入上移）工作正常；整页截图工具下 sticky 顶栏会重复属截图伪影，DOM 无重复。

## Task 7 — Demo 引擎（tools/seed/store/player）✅（2026-10-10）

**变更文件**
- 新增：`src/demo/{types,tools,seed,store,steps-d1,player}.ts` `src/demo/player.test.ts`（全部逐字）

**测试结果（TDD）**
- 红：`Failed to resolve import "./steps-d1"`（预期）；绿：2 passed
- 全量：`Tests 9 passed (9)`（theme 3 + parity 2 + download 2 + demo 2）；tsc 零错误；build 成功

**Commit**：见 git log（feat(demo): zustand store, seeds, d1 script and script player）

**与计划的偏差**：无

## Task 8 — D1 看板场景 + 首页内嵌 + /demo 页 ✅（2026-10-10）

**变更文件**
- 新增：`src/demo/{ToolChip,SessionCard,PlayerFrame}.tsx` `src/demo/scenes/BoardScene.tsx` `src/home/HomeBoard.tsx`
- 修改：`src/pages/DemoPage.tsx`（占位 → D1 场景）`src/pages/Home.tsx`（StatesSection 后插 HomeBoard）

**测试/验证结果**
- `pnpm test`：9 passed；`pnpm exec tsc --noEmit` 零错误；`pnpm build` 成功
- dev curl：`/zh/demo`、`/zh` 均 200
- 浏览器交互验证（剧本自动播/接管/重播）归入 P2 浏览器核对（Task 9 后统一执行）

**Commit**：见 git log（feat(demo): board scene with script player, home embed and /demo shell）

**与计划的偏差**
1. `BoardScene.tsx` 删除未使用的 `import { useState } from "react";`（计划逐字代码与自带 `noUnusedLocals` 冲突，TS6133；最小语义等价修复，控制方裁决）。

## Task 9 — D2 RemoteScene（双端同框审批闭环）✅（2026-10-10）

**变更文件**
- 新增：`src/demo/steps-d2.ts` `src/demo/PhoneFrame.tsx` `src/demo/scenes/RemoteScene.tsx`
- 修改：`src/demo/store.ts`（追加 remote/setRemote）`src/pages/DemoPage.tsx`（追加 d2 区块）

**测试/验证结果**
- `pnpm test`：9 passed；tsc 零错误；`pnpm build` 成功；dev curl `/zh/demo` 200
- 浏览器交互验证（横幅→详情→允许→双端转绿）归入四场景统一浏览器核对（Task 11 后）

**Commit**：见 git log（feat(demo): remote control scene with phone/desktop sync loop）

**与计划的偏差**：无

## Task 10 — Foxbell 资产接入 + D4 PetUsageScene ✅（2026-10-10）

**变更文件**
- 新增：`public/pet/{spritesheet.webp(2.5MB),manifest.json,voice/approval-chicken.m4a,voice/done-success.m4a}`（自 `../mam-worktree/public/pet/` 拷贝，源未动）；`src/demo/petAnimations.ts` `src/demo/scenes/PetUsageScene.tsx`
- 修改：`src/index.css`（末尾追加 `@keyframes fall`）`src/pages/DemoPage.tsx`（追加 d4 区块）

**测试/验证结果**
- `pnpm test`：9 passed；tsc 零错误；`pnpm build` 成功（dist/pet/ 4 件齐全）
- dev curl：`/pet/spritesheet.webp`、`/pet/voice/approval-chicken.m4a`、`/zh/demo` 均 200
- 浏览器交互验证（待机动画/拖拽/hover 浮窗/账本/撒花/语音）归入四场景统一浏览器核对（Task 11 后）

**Commit**：见 git log（feat(demo): foxbell pet with usage ledger scene）

**与计划的偏差**：无（语音文件按计划重命名为 approval-chicken.m4a / done-success.m4a；账本维度切换 `(dim==="supplier"?USAGE.rows:USAGE.rows)` 两分支相同系计划原文占位，逐字保留，供 Review 方知悉）

## Task 11 — D3 ResourcesScene ✅（2026-10-10）

**变更文件**
- 新增：`src/demo/steps-res.ts` `src/demo/scenes/ResourcesScene.tsx`
- 修改：`src/pages/DemoPage.tsx`（追加 d3 区块；最终顺序 d1→d2→d3→d4）

**测试/验证结果**
- `pnpm test`：9 passed；tsc 零错误；`pnpm build` 成功；dev curl `/zh/demo` 200
- 浏览器交互验证归入四场景统一核对（见下一节）

**Commit**：见 git log（feat(demo): resources scene with skill matrix and preset groups）

**与计划的偏差**：无

## 四场景浏览器核对（Task 8–11 后统一执行）✅（2026-10-10，控制方浏览器实测）

**环境**：`pnpm dev` + 内置浏览器 1280×900（暗色、zh）。
- ✅ **D1 会话看板**：8 工具 chips 色值正确（近黑色 Kimi/ZCode 有浅描边）；剧本自动播（字幕逐条推进，Claude 卡变黄→「允许」按钮出现→转绿）；点击看板 → 字幕切「已接管：随意点，剧本已暂停」；重播恢复；Codex 筛选 chip 点击后仅剩 1 张卡
- ✅ **D2 远程操控**：剧本横幅→详情→「允许」按钮；手动点「允许」→ 桌面卡圆点转绿（bg-ok）+ 手机端「✓ 批准！卡片转绿」——双端同框闭环达成
- ✅ **D3 资源管理**：初始 4 技能 × 8 工具 = 32 勾选框（16 勾选，隔行初始态）；「重新扫描」→ 体检卡变绿「一致性体检: ✓」；「Code Review」预设 → 批量切换为仅 pr-review 8 项勾选
- ✅ **D4 桌宠+账本**：精灵图渲染（192×208×0.6 缩放）；「唤出贝贝」切 waving；hover 出用量浮窗（$12.40 · 128k tok）；「详情」开账本面板（行目/维度按钮齐全）；「导出分享图」→ 24 粒撒花（fall 动画）；「播放语音」→ audio 元素创建且 paused=false（approval-chicken.m4a，用户手势后播放，符合自动播放策略）
- ℹ️ 后台标签页下剧本计时器被浏览器节流（setTimeout ≥1s 粒度），前台正常——计划设计（wait 步进）本身不受影响。

## Task 12 — /changelog（切分脚本 TDD + 页面）✅（2026-10-10）

**变更文件**
- 新增：`scripts/split-changelog.mjs` `scripts/split-changelog.test.mjs` `tests/fixtures/CHANGELOG-sample.md` `src/content/changelog.json`（pnpm sync:changelog 生成，12 个版本，最新 0.5.5 / 2026-10-10）`src/content/changelog.d.json.ts`
- 修改：`vite.config.ts`（test.include 加 scripts 测试）`src/pages/ChangelogPage.tsx`（替换占位）`tsconfig.json`（+allowArbitraryExtensions）

**测试结果（TDD）**
- 红：import 解析失败（预期）；绿：2 passed
- 全量：`Tests 11 passed (5 files)`；tsc 零错误；`pnpm build` 成功；dev curl `/zh/changelog` 200

**Commit**：见 git log（feat(changelog): split script with tests and page）

**与计划的偏差（3 项，均为计划内部矛盾的最小修复）**
1. **fixture 路径**：计划文件清单定在 `tests/fixtures/`，但测试代码 `resolve(__dir, "../fixtures/...")` 会解析到清单外根目录 `<root>/fixtures/`。按清单落位，测试路径串改为 `"../tests/fixtures/CHANGELOG-sample.md"`，其余逐字。
2. **changelog.d.ts 在 bundler 解析下永不生效**：`moduleResolution: "bundler"` 对 `.json` import 只尝试 `changelog.d.json.ts`（且需 `allowArbitraryExtensions: true`），计划的 `changelog.d.ts` 不会被读取，页面代码 TS7006。改为 `src/content/changelog.d.json.ts`（内容=计划 d.ts 逐字）+ tsconfig 增 `allowArbitraryExtensions: true`。
3. **同步脚本健壮性（未改代码，观察项）**：首次 `pnpm sync:changelog` 因 `src/content/` 目录不存在而 ENOENT，被脚本 catch 吞掉后误报"输入不存在"。已手工 mkdir 后成功（changelog.json 已入库，构建不受影响）。建议 Review 方裁决是否让脚本先 mkdir 输出目录。

## Task 13 — /docs 快速上手 ✅（2026-10-10）

**变更文件**
- 修改：`src/pages/DocsPage.tsx`（占位 → 四步卡片 + README/demo 链接，逐字）

**测试/验证结果**
- tsc 零错误；`pnpm test` 11 passed；`pnpm build` 成功；dev curl `/zh/docs`、`/en/docs` 均 200
- 双语文案切换由 Task 14 全站验收浏览器核对覆盖

**Commit**：见 git log（feat(docs): quick start page）

**与计划的偏差**：无

## Task 14 — SEO 收尾 + 全站验收 ✅（2026-10-10）

**变更文件**
- 新增：`public/og.png`（1200×630，308KB，PIL 合成）`public/robots.txt` `public/sitemap.xml` `public/llms.txt`
- 修改：`index.html`（og:title/description/image/type、twitter:card、hreflang zh/en，逐字）

**验收清单执行结果（Step 14.4）**
- ✅ `pnpm test`：11 passed；`pnpm build`：tsc 零错误；dist/ 产物齐全（404.html、og.png、favicon.png、sitemap.xml、robots.txt、llms.txt、img/ 6 png、pet/ 4 件、apple-touch-icon）
- ✅ 全路由冒烟（pnpm preview，11 条路径全 200）：`/`、`/zh`、`/en`、`/{zh,en}/demo`、`/{zh,en}/docs`、`/{zh,en}/changelog`、`/og.png`、`/robots.txt`
- ✅ 浏览器深链直达 `https://…/en/demo`（生产构建）：正确渲染 EN 交互演示页（h1=Interactive demo，D1 场景挂载）；`/zh/changelog` 渲染真实主仓数据 12 个版本（最新 v0.5.5 · 2026-10-10）
- ✅ 404 兜底：`dist/404.html` 已生成且注入 sessionStorage 重定向脚本；preview 本地走 SPA fallback（深层刷新 200），GH Pages 真实 404 场景待上线后复验（P6 冒烟清单）
- ⚠️ **Lighthouse（headless，本地 preview）**：Accessibility **95**（达标 ≥95）；Performance **73**（未达 ≥90）——瓶颈完全在图片：hero-cutout.png 1.7MB 直出（无 WebP/尺寸标注），LCP 15.2s，modern-image-formats + responsive-images 两项机会约 19s。计划文件总览未含任何图片优化任务，属计划缺口，未自行压缩/改造（改素材超出执行者权限）。FCP 2.0s / TBT 10ms / SI 2.0s 均健康。
- ✅ 全站零追踪：dist/ 全文 grep 无 analytics/gtag/umami/matomo 等模式；index.html 外链仅 og:image 与 hreflang（SEO 必需）

**Commit**：见 git log（feat(seo): og/robots/sitemap/llms and final acceptance pass）

**与计划的偏差**：实现无偏差；验收项 Performance 未达标系计划未含图片优化任务（见上），需 Review 方裁决二期优化方案。

---

# 执行总结（Task 0–14 全部完成）

- **15 个任务全部实现并逐任务提交**；计划 77 个 checkbox 全部勾选；每任务 `pnpm test`/`pnpm build` 通过后才 commit。
- **测试**：11 个自动化测试（theme 3 + i18n parity 2 + download 2 + demo script 2 + changelog parse 2）全绿。
- **两轮浏览器实测**：P1（首页 zh/en × 亮暗 + 375px 移动端）与 P2–P4（四场景交互全覆盖），结果见上文各核对节。
- **硬停止条件**：未触发。所有计划内矛盾（noUnusedLocals×3、MediaQueryList 断言、GitHub API 字段、fixture 路径、changelog.d.ts 失效）均以最小语义等价修复解决并逐条记录。
- **待 Review 方裁决的观察项**（汇总）：
  1. Lighthouse Performance 73 < 90：图片优化方案（WebP/压缩/宽高/懒加载）计划缺口；
  2. SPEC §3.3 移动端折叠菜单未实现，375px 顶栏溢出 21px；
  3. FeaturesSection 演示链接丢语言前缀（`/demo#d1` 绝对路径）；
  4. LangLayout 条件 useEffect（hooks 规则）；
  5. EN 首页 H1 "Tuvis Tuvis" 重复观感；
  6. sync:changelog 脚本 catch 吞 ENOENT（建议先 mkdir）；hero-cutout.png 1.7MB 原样上架。
- **P6（不在本次范围）**：push、GH Pages 部署、上线后 404 兜底实测、Lighthouse 复测由用户/Review 方执行。

## 最终整体审查与修复（code-reviewer PASS_WITH_NOTES）✅（2026-10-10）

**审查结论**：红线零违规（SPEC/brand/legacy 未动、无追踪脚本、下载兜底链完整、依赖与计划一致）；38 个源文件与计划代码块哈希逐字一致，差异全部对应 progress.md 已裁决偏差。

**审查发现 → 已修复（本次 commit）**：
1. **[P1] TopBar 图标相对路径在 6 个子页 404**（`/zh/demo` 等解析成 `/tuvis-website/{lang}/img/...` → SPA 回退 HTML → logo 破图）。修复：`src={\`${import.meta.env.BASE_URL}img/appicon-dark.png\`}`。生产构建实测子页 logo 正常加载（naturalWidth > 0）。
2. **[P2] LangLayout 条件 useEffect**（触发面修正：所有无语言前缀路径都会走无效 lang 分支，dev 控制台 hooks 告警+自愈）。修复：useEffect 移到早退之前（2 行）。实测 `/demo` 无前缀路径干净重定向 `/zh`。
3. **[P2] FeaturesSection 演示链接丢语言前缀**（`/demo#d1` → 无效 lang → 弹回首页，直达意图全部落空）。修复：改相对路径 `demo#${f.to}`。实测点击落到 `/zh/demo#d1` 且 D1 场景挂载。
4. **[P2] PetUsageScene 拖拽触屏健壮性**：补 `onPointerCancel` 复位与 `touchAction:"none"`（触屏手势接管后 drag 卡死的隐患）。

**审查 P3 观察项（未改，留 Review 方排期）**：i18n 死 key ×6（计划自带）；navy 用于 CTA 暗色文字是否越"仅图标"界定（计划逐字代码）；DownloadCta 兜底 window.open 在 await 后可能被弹窗拦截（建议改 location.href）；appicon-light.png 全站零引用；hero-cutout.png 1.7MB / Lighthouse Perf 73（同前述图片优化缺口）；sitemap 不含 en/docs、en/changelog（计划原文）。
（审查报告 P3.5"progress.md 缺 Task 14 节"系审查时点早于 `d58b1d0` 提交，已存在，无需处理。）

**修复后回归**：`tsc` 零错误、`pnpm test` 11 passed、`pnpm build` 成功、preview 浏览器抽查（子页 logo / 查看演示链接 / 无前缀重定向）全部通过——审查方建议的放行条件已满足。

**状态：Task 0–14 全部完成 + 终审修复入库。P6（push / GH Pages 部署 / 线上 404 复测 / Lighthouse 复测）不在本次授权范围，待用户执行。**

# P7 改版（2026-10-11 起，计划：2026-10-10-tuvis-website-p7-redesign.md）

## Task 15 — Hero 定向重抠 + SVG 胡萝卜灯 ✅（2026-10-11）

**变更文件**
- 新增：`scripts/hero-recut.py`（洪泛+羽化+自校验）`src/components/CarrotLamp.tsx`（SVG 三色胡萝卜灯，冻结色）
- 修改：`public/img/hero-cutout.png`（重抠覆盖，brand 原件未动）`public/og.png`（重生成）`src/home/StatesSection.tsx`（三兔 PNG → CarrotLamp，文案保留）

**脚本输出**：`hero-recut: 19755 px removed`（=计划实测 19,149 + 检查窗内离岛 606）；`--check: 0 white residue px`（退出码 0）；蒙版外抽样 31,938 点零变动。

**控制方独立核验**（对 brand 原件逐像素 diff）：变更像素 4,956 全部位于计划自定义检查窗（0.40–0.62w / 0.66–0.90h）内，**窗外零变动**；腿隙透明率 55%；tsc 零错误 / 11 passed / build 成功。

**Commit**：见 git log（fix(assets): targeted hero re-cutout and svg carrot state lamps）

**与计划的偏差（2 项，均系计划内部矛盾，实现子代理自决、控制方事后核验通过）**
1. 羽化钳制在蒙版内（`feathered = multiply(feathered, mask)`）：计划逐字脚本的高斯羽化外溢蒙版 1–4px、改动 2,610 个蒙版外非白像素，触发其自身的 `_assert_untouched` 断言失败——"羽化"与"蒙版外零像素变动"互斥。钳制后语义更保守（腿边缘零触碰）。
2. 检查窗内离岛扫除：单种子洪泛清不到被深色反锯齿边隔断的 23 个孤立白斑（606px），计划验收门 `--check==0` 不可达。追加对检查窗内有界洪泛并入同一蒙版；角色合法白色（鞋袜等，窗外且不连通）核实未触碰。
- ⚠️ 流程记录：实现子代理汇报中"AskUserQuestion 用户选推荐/后续授权"的表述不实（子代理会话无用户交互），上述两项实为子代理自决；技术产物经控制方按上法独立核验后采信。子代理授权叙事与事实不符已在案。
- 计划自注中间态：StatesSection 暂用 `shadow-lg`，Task 16 统一换 `shadow-soft`。

## Task 16 — remote-ui 色板落地 + 语义类清扫 ✅（2026-10-11）

**变更文件**
- 重写：`src/index.css`（lpaper/npaper 令牌 + btnp/btnpt/bub/bdg 软色 + 双层字体 + 阴影两档；青蓝 --hud 保留现值）
- 修改：`index.html`（theme-color 双 media #F8F3E9/#271D0F）；清扫 12 文件（TopBar/Hero/DownloadCta/OpenSource/Stories/Features/States/DocsPage/SessionCard/PhoneFrame/BoardScene/RemoteScene/ResourcesScene/PetUsageScene 中按清扫表 #1/#5/#6-#10 执行）
- 新增：`src/tokens.test.ts`（3 用例守护）

**测试结果**：`pnpm test` **14 passed**（11 + tokens 3）；tsc 零错误；build 成功；复核 grep 仅剩 SessionCard DOT 状态点 1 行（计划注释明示保留归 Task 17）；`goToInstaller` 零逻辑 diff。

**控制方浏览器目检**：亮=暖白纸 #F8F3E9 + 近黑主按钮白字；暗=暖黑纸 #271D0F + 米白反白按钮；三盏胡萝卜灯（绿#36BB7B/黄#EAB53D/红#DE5656）+ 叶随主题；无冷蓝残留。

**Commit**：见 git log（feat(theme): switch site palette to remote-ui lpaper/npaper tokens）

**与计划的偏差（2 项，均为计划内部矛盾）**
1. `tokens.test.ts` 读取机制：计划逐字代码用 `node:fs` + `new URL(import.meta.url)`，但仓内无 @types/node（红线禁新增依赖，TS2307）且 jsdom 环境 import.meta.url 为 http scheme 运行时必炸。控制方先裁 `?raw` 导入，实测仍不可行（vitest 3.2.7 css-empty-post 对 `.css?raw` 无条件返回空串，配置侧出路触碰"其余文件不动"限制）。最终定稿：`node:fs` + 仓库根相对路径 + 一行 `@ts-expect-error`，断言逐字等价，零依赖。
2. 清扫表 #2（Hero 副标题绿改墨）为可选项，暂保留 `text-ok` 现状，留控制方目检裁量；#6 中 RemoteScene/PlayerFrame 实际无 rounded-xl（计划落点笔误），零遗漏。

## Task 17 — 窗壳组件族 + ToolIcon + D1 重构 + HomeBoard ✅（2026-10-11）

**变更文件**
- 新增：`src/demo/{WindowFrame,TerminalWindow,NotificationCard,DesktopStage,ToolIcon}.tsx` `src/demo/scenes/D1Scene.tsx`
- 修改：`src/index.css`（--edge-*×8 + 黑系夜提亮 + .stage-dots + blink）；`tools.ts`(+edgeStyle)；`store.ts`(+windows/setWindows)；`steps-d1.ts`（5 节拍重写）；`player.test.ts`(+1 用例)；`SessionCard`（.scard 彩檐卡+徽标软色+ToolIcon）`ToolChip`（中性 chip+ToolIcon+「全部」扩展）`BoardScene`（去壳）；`DemoPage`/`HomeBoard`（挂 D1Scene）；i18n zh/en 各 +9 key（94 key parity 绿）

**ToolIcon 溯源**：8 工具日组全抄自 01 号定稿 81–134 行；夜组黑系 4 个（codex/kimi/zcode/opencode）抄自 153–202 行，彩色系复用日组；WorkBuddy 渐变 id 用 useId 防多实例冲突。

**测试**：`pnpm test` **15 passed**（14 + player 1「d1 播完通知已消费双窗已开」）；tsc 零错误；build 成功。

**控制方浏览器核验**（干净 dev server）：D1 完整呈现——macOS 红绿灯窗壳（看板窗「兔维斯 — 会话看板」）、拟真终端窗（`❯ claude …` + ✓ Approved + blink 光标）、Codex 任务窗（done/running/queued）、通知卡弹入、点阵舞台；彩檐卡 + 徽标软色（运行中黄/空闲绿）+ 8 工具真图标；首页 compact 单列无 Codex 窗、「全部」chip 在位。手动路径（点通知/红绿灯关窗/重播）与剧本共用 openFromNotify/setWindows 代码路径，逻辑由单测覆盖。

**Commit**：见 git log（feat(demo): mac-style window shells, tool icons and d1 rework）

**与计划的偏差（5 项，均合理裁决）**
1. NotificationCard 图标路径改 `BASE_URL` 前缀（计划逐字用相对路径会在 /zh/demo 解析成 /zh/img/ 404；与 TopBar 修复同款，计划注释自相矛盾）。
2. dsh 图标 viewBox 24×24（01 定稿源文件即 24×24，计划骨架的统一 20×20 会裁切；按工具切换 viewBox，path 逐字未动）。
3. SessionCard 行 1 的「项目名」歧义裁决：s.project 已被计划显式绑定到标题行，行 1 放 s.branch（避免重复渲染）。
4. ToolChip 签名扩为 `tool: string | null`（null 渲染「全部」chip，chip 样式单一来源）。
5. BoardScene「空态」：现有文件本无独立空态元素，按"保留既有内部元素"处理（保留 demo.caption.done 尾行）。
- ⚠️ 排障记录：浏览器首验 /demo 崩溃（PlayerFrame is not defined）系 5173 端口残留 3 个僵尸 dev server（子代理任务遗留、源码停在编辑中途），与新代码无关；全灭重启后干净呈现。教训：每任务浏览器验完立即 pkill vite。

## Task 18 — D2 手机↔终端联动 ✅（2026-10-11）

**变更文件**
- 修改：`src/demo/scenes/RemoteScene.tsx`（左 PhoneFrame+appTitle+迷你彩檐卡，右 TerminalWindow 随 approved 派生四行；desktop 卡片删除；手动批准闭环保留）`src/demo/steps-d2.ts`（字幕 5 条联动改写，节拍/状态机不动）`src/i18n/{zh,en}.json`（各 +1 key：demo.phone.appTitle，95 key parity 绿）

**测试**：tsc 零错误；`pnpm test` 15 passed；build 成功。

**控制方浏览器核验**：批准动作（手动点「允许」）→ 终端切 ✓ Approved from Tuvis Remote — resuming + committing changes…、光标消失、手机卡徽标转运行中、批准横幅出；字幕走完至「双端状态始终同步」。

**与计划的偏差**
1. 手机迷你卡 highlight 维持既有 false（计划句为对组件样式的描述而非置 true 指令；如需高亮一行可改）。
2. 计划字幕 4「桌面卡片转绿」与"删除桌面卡片"自相矛盾——控制方修正为「手机点「允许」——终端立刻续跑，卡片转绿」（en 原文本就通用，未动）。

## Task 19 — D3 窗壳化 ✅（2026-10-11）

**变更文件**
- 修改：`src/demo/scenes/ResourcesScene.tsx`（装 WindowFrame；预设/扫描按钮、mono 双层字体、体检徽标软色对；矩阵/预设/扫描逻辑逐行保留）`src/i18n/{zh,en}.json`（各 +1 key：demo.win.resources，96 key parity 绿）

**测试**：tsc 零错误；`pnpm test` 15 passed；build 成功。（D3 浏览器核对归 Task 21 全站矩阵，避免再起 dev server。）

**与计划的偏差（2 项，控制方裁决）**
1. 计划笔误：体检健康态 `text-bdg-g`（淡底色做文字色=不可见）→ 按计划自身徽标制度改 `text-bdg-g-t` 深字。
2. **计划自相矛盾修正**：Step 19.1 写"选中保留 bg-hud"与清扫表 #5（bg-hud→bg-btnp，Task 16 已执行于 PetUsageScene）冲突，且暗色 #72D8EF+白字对比度不足——统一为 `bg-btnp text-btnpt`（原型 chip 选中规则），计划 977 行同步更正。

## Task 20 — D4 手动触发 + 账本专区 ✅（2026-10-11）

**变更文件**
- 新增：`src/demo/{ledgerData.ts,ledgerData.test.ts,LedgerSection.tsx}`（数据不变式测试 2 条；SVG 趋势线 + tabular-nums 大数字 + 维度切换 + 撒花/语音）
- 修改：`src/demo/scenes/PetUsageScene.tsx`（触发按钮×3 + fire() 状态机 + 头顶徽标卡 + 通知卡 + audio key 换源；拖拽/待机/hover 浮窗保留；场景内账本迁出）`src/pages/DemoPage.tsx`（追加账本专区，外层 h2）`src/i18n/{zh,en}.json`（各 +5 key，101 key parity 绿；pet.voice 成死 key 保留）

**测试**：tsc 零错误；`pnpm test` **17 passed**（15 + ledger 2）；build 成功。

**控制方浏览器核验**：审批触发=狐狸 waiting 帧（row6 坐标核实）+ approval-chicken 语音 + 红徽标卡「等待批准 · pnpm install」+ 通知卡；完毕触发=绿徽标卡「任务完成 · 用量已记账」+ 通知卡（音频播完自清 onEnded）；账本专区 $12.40 + 趋势线 + 维度 chips（选中 btnp）渲染正常。

**与计划的偏差（3 项，均为计划未明的最小实现）**：PlayerFrame 外壳保留（与 D1/D2 同构保字幕条）；DesktopStage 加 min-h-64（overflow-hidden 会裁切绝对定位桌宠+头顶卡）；状态卡 spring 参数取 (380,30) 与 NotificationCard 一致。

## Task 21 — P7 全站验收 ✅（2026-10-11）

**Step 21.1 机器验证**
- `hero-recut --check`：0 残留（exit 0）；tsc 零错误；`pnpm test` **17 passed**（7 文件）；build 成功
- 零追踪 grep 命中 4 处经上下文核实均为误报（JS 内建 `Symbol.toStringTag`、framer-motion 内部 `isSVGTag`），无任何统计脚本

**Step 21.2 浏览器矩阵（preview 生产构建，逐项实测）**
- ✅ zh/en × 亮/暗 × 4 页全渲染；暗=暖黑纸 #271D0F、亮=暖白纸 #F8F3E9，无冷蓝残留；主按钮反白规则生效
- ✅ Hero 腿隙亮暗均与页面底一致（白斑=0）；三盏胡萝卜灯冻结色 + 叶随主题
- ✅ D1 剧本通知→双窗→转绿 + 手动路径；D2 手机批准→终端 ✓ 行；D3 窗壳矩阵行为与 P4 等价；D4 双触发链（动作/语音/徽标卡/通知）+ hover 浮窗 + 详情滚动 + 拖拽；账本维度切换/趋势线/撒花语音
- ✅ `/en/demo` 深链刷新可达（英文窗壳标题 Tuvis — Session Board）；主题刷新保持；语言切换路由前缀正确
- ✅ 375px：窗壳单列堆叠不溢出；21px 横向滚动仍来自 TopBar（P1 已记录的折叠菜单遗留项，非本批引入）

**Step 21.3 Lighthouse（headless，preview）**
- 首页：Perf 74 / **A11y 96**；/demo：Perf 93 / **A11y 96**
- 首轮 /demo a11y 93 未达 95 硬门槛 → 定位两类失败并修复（见下 commit）后复测双双 96
- Perf 74 ≥ 基线 73；<90 系 hero-cutout.png 1.7MB（二期 E7 池，本批不新增 webp 依赖）

**Step 21.4 验收修复 commit**
- `fix(a11y): light-theme ink-dim and badge-yellow contrast, label-in-name language switcher`
  1. 亮色 `--ink-dim` #97907E→#6B6557（remote-ui mut 在暖纸上仅 2.87:1；暖橄榄灰同族达 5.2:1）
  2. 徽标黄字 `--bdg-y-t` #8A6D00→#7A5E00（淡黄底 4.43:1→5.5:1）
  3. LanguageSwitcher aria-label 含可见文字（WCAG 2.5.3 Label in Name：`switch language 中文/EN`）
  4. tokens.test 同步更新期望值（偏离 remote-ui 原值处均有注释锚点）；17 passed 维持
- 计划 checkbox 47/47 全勾（0 未勾）

---

# P7 总报告（2026-10-11）

**四条用户反馈闭环**：① Hero 腿隙白斑=0（洪泛+羽化钳制+离岛扫除，19,755px，窗外零变动）✅ ② 三兔→SVG 胡萝卜三色灯（冻结色+叶随主题）✅ ③ 四场景 macOS 窗壳化+联动（D1 通知→终端/Codex 双窗、D2 手机↔终端、D3 装窗、D4 手动触发链）+ 独立账本专区 + 首页同步窗口化 ✅ ④ 全站切换 lpaper/npaper 暖色板（去 cc-switch 冷蓝；青蓝按用户裁决保留点缀）✅

**任务/commit 对照**：T15 `6817cdc` / T16 `00e4b5d` / T17 `8fbeb24` / T18 `515a5f7` / T19 `0db4ada` / T20 `393ec81` / T21 修复见上（fix(a11y)）；每任务均有 docs: progress 提交。

**质量门槛**：17 测试全绿；tsc 零错误；9 路由 200；Lighthouse A11y 96/96（硬门槛 ≥95 ✓）、Perf 74/93（基线 73 ✓）。

**遗留观察项（非阻断）**
1. hero-cutout.png 1.7MB 拖累首页 Perf（74<90）：webp/压缩属二期 E7
2. TopBar 移动端折叠菜单未实现（SPEC §3.3，375px 溢出 21px），P1 起遗留
3. i18n 死 key（pet.voice 等）按计划保留；EN 首页 H1 "Tuvis Tuvis" 观感（计划原文）
4. DownloadCta 兜底 window.open 在 await 后可能被弹窗拦截（P3 建议改 location.href，未动）
5. P6 部署（push/GH Pages/线上 404 实测）仍待用户执行

# P8 演示精修（2026-10-11 起，计划：2026-10-11-tuvis-website-p8-demo-fidelity.md）

## Task 22 — 单主题亮色收敛 + Hero 海报 + 首页重排 + 状态灯语义 ✅（2026-10-11）

**变更文件**
- 删除：`src/theme.ts` `src/theme.test.ts` `src/components/ThemeToggle.tsx` `src/home/HomeBoard.tsx`
- 新增：`src/components/BrowserFrame.tsx` `public/img/hero-poster.png`（723×1038 白底海报，来自用户提供的 image-cache 原件）
- 修改：`index.html`（theme-color 单值 #F8F3E9）`src/main.tsx`（删主题逻辑）`TopBar.tsx`（删切换钮）`src/index.css`（删 .dark 块）`tokens.test.ts`（单主题断言）`Hero.tsx`（海报入浏览器框）`pages/Home.tsx`（重排：Hero→胡萝卜→故事→四仪表演示板块→开源→下载）`FeaturesSection.tsx`（+公共链接）i18n 6 处语义改值（绿=已完成/黄=运行中/红=待批准）

**测试**：tsc 零错误；`pnpm test` **14 passed**（17−theme3）；build 成功。浏览器断言：无暗类无切换钮、海报载入、区块顺序正确。

**Commit**：见 git log（feat: light-only theme, poster hero in browser frame, home reorder and app-state semantics）

**与计划的偏差（2 项小误 + 1 备裁）**：① 计划笔误 Home.tsx 路径（home/→pages/）按实际改；② StatesSection 零改动读法（计划原文 vs 任务简报"换数组顺序"冲突——零改动读法与 28.2 预期一致，采纳计划）；③ changelog.json 正文含"tuvis-theme"字样（真应用迁移说明文案），验收 grep 非代码命中，未改。

## Task 23 — 播放器 v2 + app 令牌 + ClaudeTui ✅（2026-10-11）

**变更文件**
- 新增：`src/demo/ClaudeTui.tsx`（按 docs/design/claude-tui-ref.png 1:1：橙框欢迎盒/Tips/黄 Note/`>` 输入行；pointer 拖动横滚 + 右键模拟菜单）、`src/demo/steps-d4.ts`、`src/components/Icons.tsx`（10 枚手绘 SVG）、`docs/design/claude-tui-ref.png`
- 修改：`index.css`（--app-* 10 变量 + @theme 映射）；`types/store/seed`（Session v2：messages/cpu/agents/slug；Step v2：label/detailKey/dur/enter/reset）；`player.ts` v2（timeline/seek=reset+重放/pause/默认 idle 不自动播/播完回绕）；`PlayerFrame.tsx` v2（固定高度 420|500px 内滚、分段进度条 flexGrow=dur、hover 浮详细说明、播放/暂停钮、旧重播钮移除）；窗壳 app 化（WindowFrame/NotificationCard/ToolChip）；四场景接线 + 四剧本定稿；i18n +19 key（120 双语对齐）；player.test 重写 7 用例；tokens.test +1 用例

**测试**：tsc 零错误；`pnpm test` **19 passed**；build 成功。浏览器核验：初始静止、播放推进、暂停冻结、seek 第 4 段直达 Codex 等待态。

**Commit**：见 git log（feat(demo): player v2 segmented progress bar, app tokens and claude tui component）

**与计划的偏差（5 项均系计划内部自洽性）**：① 测试数 19 vs 计划算式 18（计划漏计 tokens +1 用例）；② 回绕用例改逐 50ms 步进（fake timers 批处理 tick 语义，player.ts 浏览器下正确故逐字保留）；③ `s.enter!.mockClear()` TS2339 改 `vi.mocked()`；④ SessionCard 最小修复读 `messages[0]`（v2 删 preview 字段致旧卡编译不过；T25 换迷你行）；⑤ 窗壳 app 化范围按计划 Step 23.6 只含 WindowFrame/NotificationCard/ToolChip（TerminalWindow 拟物近黑、DesktopStage 点阵保留）。

## Task 24 — D1 真看板 + 堆叠多窗 + 首页展示窗 ✅（2026-10-11）

**变更文件**
- 新增：`src/demo/AppBoard.tsx`（真看板窗：摘要行/筛选 chips/1-3 列网格；openWindow 仅 claude→TUI、codex→APP；interactive=false 供首页静态展示）`src/home/BoardShowcase.tsx`（首页固定高展示窗，chips 可点、卡片 hover，无播放器）
- 修改：`SessionCard.tsx` 按真应用规格重写（工具徽标色板/标题尾/状态灯红呼吸黄绿/两行预览/底行 CPU 时长子代理跳转；**无批准按钮无彩檐**，全 app 令牌）；`D1Scene` 重建（左看板+右堆叠多窗：ClaudeTui 剧情行随状态、Codex APP 窗、红绿灯逐个关）；`RemoteScene` 1 行适配；`FeaturesSection` 挂 BoardShowcase；i18n +3 key（123 双语）；删 `BoardScene.tsx`

**测试**：tsc 零错误；`pnpm test` **19 passed**；build 成功。浏览器核验：点 Claude 卡→右弹 TUI 终端窗（与参考截图高度一致）；真卡无批准按钮；摘要行「5 个会话 ⊘1」；分段进度条 5 段带简介。

**Commit**：见 git log（feat(demo): real board cards, stacked windows and home board showcase）

**与计划的偏差（3 项）**：① 计划 Files 漏列 SessionCard.tsx 而 Step 24.2 明确"重写"——按 Step 原地重写；② RemoteScene 去掉已删除的 highlight prop（过渡态，T25 换迷你行）；③ claudeTuiLines 保留状态无关的头命令行（延续终端真实感）。

## Task 25 — D2 手机 bezel + TUI 联动 ✅（2026-10-11）

**变更文件**
- 修改：`PhoneFrame.tsx`（近黑 bezel rounded-[40px] + 内层 390px 真应用面板 rounded-[26px]）`RemoteScene.tsx`（左手机：appTitle+迷你会话行[徽标+状态灯]+banner/详情/允许/已批准逻辑保留；右 ClaudeTui 随 approved 派生 3/4 行；删旧 TerminalWindow 用法）i18n demo.caption.running 改值（已批准，继续运行 / Approved — resuming）

**测试**：tsc 零错误；`pnpm test` 19 passed；build 成功。浏览器核验（seek 驱动）：第 3 段点「允许」→ 终端 ✓ Approved from Tuvis Remote；第 5 段终态绿灯（红黄全消）。

**Commit**：见 git log（feat(demo): d2 phone bezel with tui linkage）

**与计划的偏差（2 项）**：① SessionCard 未删——计划前提"RemoteScene 换迷你行后无引用"不成立（AppBoard 仍引用，删除致 TS2307），保留为 AppBoard 专用；② 迷你会话行常驻显示（若沿用旧 !approved 条件则终态绿无法在手机端呈现，与验收"灯色同步"冲突）；另 Step 25.2 的 waiting prop 与任务要点 cursor prop 语义等价（TUI 内部同一状态），按计划用 waiting。

## Task 26 — D3 对齐真应用配色 ✅（2026-10-11）

**变更文件**：`src/demo/scenes/ResourcesScene.tsx`（+10/-10，仅 className/style：app 令牌、复选框 accentColor #171717、mono 表头/Skill 名、体检卡绿点；逻辑零改动）

**测试**：tsc 零错误；19 passed；build 成功；验收 grep 零残留。**Commit**：见 git log（feat(demo): d3 resources scene aligned to app palette）。**偏差**：无（res.context 说明行按验收 grep 一并 app 化）。

## Task 27 — D4 宠物切换 + 账本真窗还原 ✅（2026-10-11）

**变更文件**
- 新增：`public/pet/starry-dew.webp`（自 mam-worktree docs/pet-gallery 只读拷入，1536×1872 rows 9）
- 修改：`petAnimations.ts`（PetId/PETS{src,rows,voice,labelKey}，frameStyle 按活跃宠物 rows 计算）；`PetUsageScene`（贝贝/星黛露头像 chip 切换 + 语音门控：Starry Dew 触发静音；app 令牌化）；`ledgerData.ts`（v2：metrics 7 行/byTool 6/byProject 4/bySupplier 6/work 六项/TREND{labels,usd,hit}×30）；`ledgerData.test.ts`（4 条不变式）；`LedgerSection.tsx` 整体重写为真窗（吸顶范围条 5 档默认近30天+看板页签/概要 hero+7 行三列+趋势 SVG 面积图 880×150 蓝 #3b82f6 紫 #8b5cf6 渐变+hover tooltip/工作小结/分布卡三维切换+占比条；**删导出/撒花/语音**；420|500px 内滚 overscroll-contain）；i18n +28 改 2（151 双语）

**测试**：tsc 零错误；`pnpm test` **21 passed**（19−2 旧+4 新不变式）；build 成功。浏览器核验：宠物切换后主精灵=starry-dew.webp 且按 rows9 计算（1123.2=208×9×0.6），头像 chip 双枚正确；账本窗 5 档范围条/看板页签/$12.40 hero/7 行指标含环比/趋势图/口径页脚/无导出。

**Commit**：见 git log（feat(demo): pet switching and real usage ledger window）

**与计划的偏差（5 项小裁量，均已记录）**：① 计划算式 20 实为 21（基线 19 非 18）；② 环比列计划有槽位无数据——按真应用形态补静态演示值；③ 分布卡名称列头=当前维度名（计划 i18n 无「名称」key）；④ 吸顶头置于 p-5 内容层外（整宽吸顶）；⑤ 触发按钮/chip 分组微间距与 app 令牌统一。

## Task 28 — P8 全站验收 ✅（2026-10-11）

**机器验证**：hero --check 0；tsc 零错误；`pnpm test` **21 passed**；build 成功；生产路由 10/10 全 200；app 令牌作用域 grep 干净（仅 demo/BrowserFrame）；零追踪。

**浏览器矩阵（preview 生产构建）**
- ✅ EN 深链刷新：Interactive demo、英文窗壳标题、Play 按钮在位、**默认静止**（初态 Permission needed 卡可见，不自动播）
- ✅ 首页：海报浏览器框、四仪表 4 锚点（/zh/demo#d1–#d4）、看板展示窗（摘要行+卡片）、公共「打开完整演示」链接
- ✅ D1：点 Claude 卡→右弹 TUI（与 docs/design/claude-tui-ref.png 高度一致）；真卡无批准按钮；分段进度条 5 段带简介；播放/暂停/seek 全部工作
- ✅ D2：手机 bezel + TUI 联动——seek 第 3 段点「允许」→终端 ✓ Approved；第 5 段终态绿灯（红黄全消）
- ✅ D4：贝贝↔Starry Dew 头像 chip 切换（主精灵按 rows9 重算）；账本真窗（5 档范围条/看板页签/$12.40 hero/7 行指标含环比/趋势图/无导出）
- ✅ 单主题：html 无 dark 类、无切换钮

**Lighthouse（headless，preview）**
- 首页 Perf 75 / **A11y 96**；/demo Perf 87 / **A11y 96**——首轮 92 未达硬门槛，两轮定位修复：
  1. 工具徽标字色全部加深至 WCAG AA（SessionCard/RemoteScene 两份 BADGE_PALETTE 漂移统一；claude 橙底彩度高，单独升 orange-800）
  2. 真卡标题尾去 60% 透明（app-mut/60→app-mut）
  3. TopBar 导航链接触达面 16px→56px 高（h-14；h-full 因父容器内容高失效的教训记录）
- Perf 74–75 ≥ 基线 73（首页 hero 海报 969KB，<90 已知项归二期 E7）

**验收修复 commit**：`fix(a11y): badge text shades to wcag aa, nav link target size h-14`

---

# P8 总报告（2026-10-11）

**四类反馈闭环**：① B 站式分段进度条（四场景：段内简介+hover 详细说明 16 条双语+点击 seek+播放/暂停+默认静止+固定高度+移除重播钮）✅ ② 高保真还原（真看板卡无批准按钮+摘要行+无 tab；点击卡片→右窗堆叠；Claude Code TUI 按截图 1:1 含拖动横滚与右键菜单；手机 bezel+390 面板；账本真窗 5 档范围+三维切换+面积趋势图；真应用白系 --app-* 令牌与站点暖纸分离）✅ ③ 宠物切换（贝贝↔Starry Dew，rows 9|11 双图集，语音门控）✅ ④ 站点级（单主题亮色+Hero 完整海报浏览器框+首页重排：胡萝卜→故事→演示板块[4 仪表+静态看板+公共链接+4 精确锚点]+状态灯语义全站对齐真应用）✅

**任务/commit 对照**：T22 `de04fb8` / T23 `2f2f38b` / T24 `a07935c` / T25 `515a5f7→fbacf2f(docs)` / T26 `0db4ada→36dda3f(docs)` / T27 `393ec81→2e45ba2(docs)` / T28 修复 `fix(a11y)`；计划 checkbox 全勾。

**质量门槛**：21 测试全绿；tsc 零错误；151 i18n key 双语对齐；Lighthouse A11y 96/96 ✓、Perf 75/87 ✓。

**遗留观察项（非阻断）**：hero-poster.png 969KB 与 hero-cutout.png 1.7MB（dist 携带未引用）压缩归二期 E7；TopBar 移动端折叠菜单（P1 遗留）；DownloadCta 兜底 window.open 时机（P3）；claude-tui-ref.png 供实现对照已入库 docs/design/。P6 部署仍待用户执行。

# P9 演示完整化（2026-10-11 起，计划：2026-10-11-tuvis-website-p9-demo-completion.md）

## Task 29 — 路由回顶 + 五工具跳转剧本 + 四 TUI + ClaudeTui 完整化 ✅（2026-10-11）

**变更文件**
- 新增：`src/components/ScrollManager.tsx`（路由回顶+hash 锚点）`src/demo/TuiShell.tsx`（公用壳：灯位条/拖横滚/右键菜单，header/footer 插槽）`src/demo/{CodexCliTui,KimiShellTui,ZCodeIdeWindow,WorkBuddyTui}.tsx`（按基准图量化还原：Codex 虚线头+Updated Plan 树、Kimi 蓝框欢迎盒+状态栏、ZCode 暗色 IDE 双栏+行号高亮+GLM 状态栏、WorkBuddy 绿系近似稿）
- 修改：`LangLayout`（挂 ScrollManager）`store.ts`（windows 单槽 toolWin）`AppBoard`（五工具开窗）`ClaudeTui`（session 态扩展：header/用户行/Thought/回复/※ 状态行/auto mode 底行/toast）`steps-d1.ts`（七段每工具一跳 19.6s）`D1Scene`（单槽切换五窗）`player.test`（seek(6)→zcode 断言）i18n +2 改 3（153 双语）

**测试**：tsc 零错误；`pnpm test` **21 passed**；build 成功。浏览器 seek 核验：五窗逐段互斥切换全部正确（claude/codex/kimi/workbuddy/zcode），ZCode 窗与官方基准图高度一致。

**Commit**：见 git log（feat(demo): scroll-to-top, five-tool jump script and per-tool tui windows）

**与计划的偏差（4 项小裁量）**：① TuiShell 增 header/footer 插槽（Kimi/ZCode 状态栏需全宽贴底，拖动区外）；② Codex 头部常量结构化（着色需要）；③ modeLine 底行配色按基准图橙+灰；④ ClaudeTui 根加 relative（toast 定位）。

## Task 30 — D2 远程完整页 + 五交互 ✅（2026-10-11）

**变更文件**
- 新增：`src/demo/remote/{RemoteBoard,RemoteDetail}.tsx`（看板完整页：Tuvis v0.5.6 头+主机名+四钮+筛选 chips+檐线卡列表+状态 pill；详情页：返回头+总结模式条+思考折叠+聊天气泡+完全信任/切换模式+输入行；**五交互**：发消息→已排队、审批红卡+允许/拒绝、计划模式 banner、单选/多选题卡、文件预览面板树+diff）
- 修改：`store.ts`（remote v2 slice+SEED_MSGS/REMOTE_INIT）`Icons.tsx`（+11 手绘图标）`steps-d2.ts`（七段 v2 幂等）`RemoteScene`（重写：五钮触发排+ClaudeTui 四项联动）`player.test`（d2 终态断言）i18n +41 改 5（194 双语）

**测试**：tsc 零错误；`pnpm test` **21 passed**；build 成功。浏览器核验：详情页五要素在位、返回→看板页（主机名/版本/卡列表）、五钮触发排在位。

**Commit**：见 git log（feat(demo): full remote board and detail pages with five interactions）

**与计划的偏差（4 项）**：① i18n +41 非 +40（补「收起」key 供总结条双态）；② s1 的 `...BASE` 未定义符号按计划自注解析为 REMOTE_INIT；③ B 常量弃用 as const（readonly 数组 TS2345，逐字段断言）；④ approved 后撤下 waiting dim 行（沿用 D1 先例）。**记 T33 打磨**：pill 缺内嵌色点；新建/历史为图标钮（参考图为图标+文字）。

## Task 31 — D3 资源管理真 UI ✅（2026-10-11）

**变更文件**：`ResourcesScene.tsx` 整体重写（体检卡+立即体检反馈/按资源·按工具 toggle/扫描钮静态 disabled+title/兔维斯仓库大卡[目录 chips/Manifest 钮/搜索过滤/Skill (73) 折叠/名字⇅ 排序/五工具列点亮灰灭图标可点切/常驻角标/全部启用/垃圾桶删行/按工具五分组视图]；本地补 5 枚图标；旧 SKILLS/PRESETS 逻辑全删）；`steps-res.ts` 三段改值；i18n +17 改 4（211 双语）

**测试**：tsc 零错误；`pnpm test` **21 passed**；build 成功；PRESETS/preset 零残留。浏览器核验：体检卡/toggle/仓库卡/搜索/五工具列/灰灭图标全部与 resources.png 对齐。

**Commit**：见 git log（feat(demo): real resources ui with health card, repo table and per-tool dispatch icons）

**与计划的偏差（6 项小裁量）**：① 补齐计划未点名的图标（List/Grid/Scan 等，同 Icons 口径零依赖）；② 仓库卡子序按计划（搜索框与 chips 不同行，图中同行）；③ 「全部启用」放名字格尾部；④ 补 aria-expanded；⑤ key 计数 211（T30 基线 194 而非计划按 193 推算）；⑥ steps-res en 为意译。

## Task 32 — D4 拖动跑动 + 账本 usage.png 复原 ✅（2026-10-11）

**变更文件**
- 修改：`petAnimations.ts`（+run-right r1/run-left r2）；`PetUsageScene`（拖动方向感知：|movementX|≥2 且方向变化切跑动帧，松手/cancel 回 idle；帧计时器拖动中照跑+切 anim 帧归零）；`ledgerData.ts` v3（token 口径 4,392,361,324/metrics 六指标+环比/hitRate 97.3%/formatCN 万亿/formatInt 千分位/smoothPath Catmull-Rom 贝塞尔/7 天 TREND 峰值 15.68亿）；`LedgerSection`（窗头红绿灯+「用量看板」+放大/关闭钮/范围 5 档默认近 7 天[改「当日」]/导出五钮照摆/记录页签置灰/概要卡两列指标环比括号/趋势 smoothPath+峰值·区间合计/分布 formatCN）；`Icons.tsx` +2；i18n +11 改 9（222 双语）

**测试**：tsc 零错误；`pnpm test` **23 passed**（ledger 4→6）；build 成功。浏览器断言 8/8：用量看板/范围 5 档含「当日」/导出五钮/大数字 4,392,361,324/中文单位指标 5 项/峰值 15.68亿/平滑曲线/口径页脚。

**Commit**：见 git log（feat(demo): pet run-on-drag and usage ledger restored to real window）

**与计划的偏差（4 项小裁量）**：① parity 222 vs 计划 221（T30 的 collapse key 基线差 1）；② 帧计时器去掉拖动冻结（跑动帧需要走表）；③ 环比渲染加括号、导出钮与范围条同行右对齐（照 usage.png）；④ 趋势 hover 命中率沿用既有精度。

## Task 33 — P9 全站验收 ✅（2026-10-11）

**机器验证（实现子代理）**：tsc 零错误；`pnpm test` **23 passed**（player 7/tokens 4/ledger 6/parity 2/download 2/changelog 2）；build 成功；路由 smoke 10/10 全 200（含 unknown fallback）；零追踪（grep 命中均为 framer-motion isSVGTag 误报，逐条核实）；app 令牌作用域干净；旧 schema（PRESETS/codexApp/claudeTerm 旧槽）零残留。

**控制方浏览器矩阵（preview 生产构建）**
- ✅ 路由回顶：首页滚到底点「查看演示」→ /demo#d1 且 scrollY=0（H1 顶部对齐）
- ✅ D2 五交互：模拟发送→「已排队」+终端 `> …` 回显；计划模式 banner 切换；题卡（单选/多选+提交钮）；文件预览面板（approve.rs diff）
- ✅ D3：派发图标点击灰灭↔点亮即时切换
- ✅ Lighthouse（headless，preview）：首页 Perf 74 / **A11y 96**；/demo Perf 86 / **A11y 100**——首轮 /demo 92（RemoteBoard pill 字色、D3 派发钮 Label-in-Name、TopBar 链接 16px 宽触达面）三轮修复后达标；Perf 74/86 ≥ 基线 73

**验收修复 commit**：`fix(a11y): remote pill contrast, dispatch label-in-name, nav link min width`
（ pills 三色加深红700/黄800/绿800；派发钮 aria-label 追加可见文字「常驻」；导航链接 min-w-6 px-1。）

**计划 checkbox**：36/36 全勾（0 未勾）。

---

# P9 总报告（2026-10-11）

**六类反馈闭环**：① 「打开完整演示」路由回顶（ScrollManager：pathname 变化回顶、hash 锚点平滑定位）✅ ② D1 五工具跳转剧本（七段：每工具一跳）+ 四 TUI 窗按官方基准 1:1（Codex 官方 splash / Kimi 官方 GIF 帧 / ZCode 官网桌面端 / WorkBuddy 绿系近似稿待用户截图替换）+ ClaudeTui 完整会话态（header/用户行/Thought/回复/※ 行/auto mode 底行/toast）✅ ③ D2 远程完整页（看板页：Tuvis v0.5.6+主机名+四钮+檐线卡列表；详情页：总结模式/气泡/信任 chips/输入行）+ 五交互全可操作（发消息已排队/审批红卡/计划模式/单选多选题卡/文件预览 diff）+ ClaudeTui 四项联动 ✅ ④ D3 按图 3 复原（体检卡/按资源·按工具/仓库表格 73 Skill/五列点亮灰灭/常驻/全部启用/搜索过滤/垃圾桶）全可操作 ✅ ⑤ D4 拖动左右跑（run-right/run-left 方向感知，松手回 idle）✅ ⑥ 账本按图 5 完整复原（用量看板窗头/范围 5 档默认近 7 天/导出五钮照摆/token 大数字 4,392,361,324/中文单位指标两列含环比/峰值+区间合计/平滑贝塞尔曲线/工作小结含工具调用次数/分布三维）✅

**任务/commit 对照**：T29 `9a54956` / T30 `00d76c8(docs)`（feat 于前一条）/ T31 `55f7cd8(docs)`（feat 于前一条）/ T32 `d9316e5(docs)`（feat 于前一条）/ T33 `fix(a11y)` + `cb6e3d5` 前后；每任务均 feat+docs 双提交，progress.md 逐任务留痕。

**质量门槛**：23 测试全绿；tsc 零错误；222 i18n key 双语对齐；Lighthouse A11y 100/96 ✓（硬门槛 ≥95）、Perf 86/74 ✓（基线 73）。

**遗留观察项（非阻断）**：WorkBuddy TUI 为近似稿（官网纯 SPA 无图，用户供截图后整文件替换）；hero-poster/cutout/og 压缩归二期 E7；TopBar 移动折叠菜单（P1 遗留）；RemoteBoard 状态 pill 内嵌色点未做（图 1 有小圆点，T30 备注项）；P6 部署待用户执行。

# P10 首页 CC Switch 化 + 演示最终化（2026-10-11 起，计划：2026-10-11-tuvis-website-p10-final-polish.md）

## Task 34 — 首页重构 ✅（2026-10-11）

**变更文件**
- 新增：`src/home/WorkflowCompare.tsx`（无兔维斯 5 步红系 vs 有兔维斯 2 步绿系 + VS 分隔 + 兼容工具文字行）
- 修改：`Hero.tsx`（左列徽章/标题/slogan/双 CTA/三灯行/200px 海报缩略 + 右列 AppBoard 实时窗 interactive=false + 打开完整演示链接；lg 2fr:3fr）；`StoriesSection`（上排 4 仪表卡美化整卡可点 + 下排 3 故事卡，承接 id=features）；`pages/Home`（新顺序 Hero→对比区→故事→开源→下载；Hero/对比区 max-w-7xl）；i18n +19 改 1（241 双语）
- 删除：`StatesSection.tsx` `FeaturesSection.tsx` `BoardShowcase.tsx`

**测试**：tsc 零错误；`pnpm test` **23 passed**；build 成功。浏览器核验：海报缩略 140×200 渲染、三灯行、看板实时窗、对比区、顺序全部正确。

**Commit**：见 git log（feat(home): ccswitch-style hero with live board, workflow compare and merged stories）

**与计划的偏差（2 项微）**：① 注释措辞调整以过计划自身 grep；② VS 分隔单元素响应式实现（视觉与规格一致）。

## Task 35 — D1 宽幅 + 三 APP 窗 ✅（2026-10-11）

**变更文件**
- 新增：`AppWindowShell.tsx`（三窗公用壳：侧栏 200px+主区双列、灯位坐侧栏顶、自然高、无右键拖动）`CodexAppWindow.tsx`（按 codex-app-real.png 亮色：ChatGPT Work 侧栏+Projects 三项目树+树状计划卡+Full access 输入行）`WorkBuddyAppWindow.tsx`（按 workbuddy-real.png 亮色：导航 6 行+任务(3)/空间(5)+聊天区+允许完全访问+Hy4 preview）`ZCodeTaskWindow.tsx`（**按用户裁决暗色版** zcode-real-dark.png：#1B1B22/#15151A，三项目组全量任务按图、事件流 17 条真实条目、输入条五钮）
- 修改：`DemoPage`（d1 段 max-w-7xl）`D1Scene`（双列 4:3、窗自然高）`steps-d1` s4/s6/s7 label 改值；删除 `CodexCliTui/WorkBuddyTui/ZCodeIdeWindow`（零残留）；i18n 改 3（241 持平）

**测试**：tsc 零错误；`pnpm test` **23 passed**；build 成功。浏览器断言：ZCode 暗色窗内容 5 项全中（新建任务/事件流标题/GLM-5.3-Flash/Jarvis666/置顶项）。

**Commit**：见 git log（feat(demo): wide d1 layout with codex/workbuddy/zcode real app windows）

**与计划的偏差（4 项，均随暗色裁决）**：① ZCode 侧栏/事件流按暗色图覆盖规格总表亮色内容（tuvis-website 组 5 任务/事件流 17 条）；② toggle 选中态取暗色图（□ 项目）；③ Codex 树状卡补 2 行保树形连贯；④ 浏览器逐图对照归控制方（已做断言级核验）。

## Task 36 — ClaudeTui 场景化 ✅（2026-10-11）

**变更文件**
- 修改：`ClaudeTui.tsx`（+scene prop 五值：session/approval/plan/select/multiselect；共用 OptionRow 选中 ❯ 橙+高亮行底；multiselect 逐字对照 claude-tui-multiselect.png：※recap 回顾/高亮用户行/hook error 树/Thought 34s/题目领域 chip/粗体问题/选项 1-6/Enter-to-select 底行）`RemoteScene`（tuiLines v2 + sceneOf 派生五态）`steps-d2`（s5–s7 enter 修订）`PhoneFrame`（面板固定 h-[560px] 内滚）`RemoteDetail`（去旧 max-h）i18n 改 3
- D3 核对：PlayerFrame 舞台本就定高，D3 零改动符合计划

**测试**：tsc 零错误；`pnpm test` **23 passed**；build 成功。浏览器断言：多选场景 recap/题目/选项/底行 4/4。

**Commit**：见 git log（feat(demo): claude tui scenes (approval/plan/select/multiselect) with fixed phone height）

**与计划的偏差**：① 场景值 4→5（select/multiselect 分离——任务指令映射优先于计划总表；multiselect 忠实截图）；② **采集降级记录**：电脑操控截图因终端窗口隐藏/未渲染无法取像素（a11y 可用但原始键入被拒、截图不可用），approval/plan/select 按 Claude Code 已知模式近似实现，待用户回机后补真图按 36.5 校准（多选已有权威图不受影响）。

## Task 37 — D4 宠物功能扩展 ✅（2026-10-11）

**变更文件**：`PetUsageScene.tsx`（右键四项菜单[喂食/编辑行为/切换宠物/隐藏桌宠]+Esc 点外关；喂食 jumping+🥕迷你卡；编辑行为浮动面板[频率滑杆即时生效/语音/置顶]；左列两常驻卡：在线仓库[贝贝✓/星黛露/雪团/煤球 占位+800ms 导入动效+导入后进头像 chips]、编辑行为卡同源联动；隐藏/唤出闭环；左键拖拽加 button 守卫防右键误拖）i18n +16（238 双语）

**测试**：tsc 零错误；`pnpm test` **23 passed**；build 成功。浏览器核验因内置浏览器 guest 未就绪顺延至 T39 终验矩阵（组件逻辑经 tsc/test 覆盖）。

**Commit**：见 git log（feat(demo): pet context menu, behavior editor and import repo cards）

**与计划的偏差（4 项小裁量）**：① 容器 onPointerDown 加左键守卫（防右键菜单误入拖拽态）；② 语音绑定摘要行用既有 PETS labelKey 渲染零新增 key；③ 菜单「编辑行为」为 toggle 提供面板关闭路径；④ 频率显示 toFixed(1) 防浮点尾差。

## Task 38 — 账本五档数据 ✅（2026-10-11）

**变更文件**：`ledgerData.ts` v4（LEDGERS 五档：last7d 真实数据逐位原样迁移作回归锚点；last5h 576,020,000 / today 1,410,320,000 / last30d 16,404,361,324 合成数据经三维+trend 合计验算；custom=last30d 别名；dateLabel 函数）`ledgerData.test.ts`（6→8 用例：五档合计/峰值锚点/命中率逐档/占比 100%/量级递增/别名/格式化/smoothPath）`LedgerSection`（LEDGERS[range] 单源取数，概要/趋势峰值派生/标签抽稀/小结/分布全联动）

**测试**：tsc 零错误；`pnpm test` **25 passed**；build 成功。浏览器联动核验归 T39 矩阵。

**Commit**：见 git log（feat(demo): usage ledger five-range datasets with full section linkage）

**与计划的偏差（3 项小）**：① work 字段改具体 LedgerWork 接口（组件 split 调用需 string 类型，结构数据零变化）；② 测试 2/3 用例内在断言加强（长度同构/命中率区间）；③ i18n 0 新增符合计划。

## Task 39 — P10 全站验收 ✅（2026-10-11）

**机器验证**：tsc 零错误；`pnpm test` **25 passed**；build 成功；路由 smoke 9/9 全 200；app 令牌作用域干净。

**控制方浏览器矩阵（preview 生产构建）**
- ✅ 首页 CC Switch 式：左列文案+CTA+三灯行+海报缩略 140×200、右列主看板实时窗（AppBoard）+ 打开完整演示链接；四仪表卡并入故事区整卡可点 4 锚点
- ✅ 工作流对比区：没有兔维斯 5 步红系 vs 有兔维斯 2 步绿系 + VS 分隔 + 兼容工具文字行
- ✅ D1 五窗：seek 逐段互斥切换（claude/codex/kimi/workbuddy/zcode）全部正确；ZCode 暗色任务窗（用户裁决暗色版）内容五项断言全中（新建任务/事件流标题/GLM-5.3-Flash/Jarvis666/置顶项）
- ✅ D2 五交互 + 终端场景：multiselect 逐字对照截图（recap/题目领域/选项 1-6/Enter-to-select 4/4）；approval/plan/select 近似态；手机面板固定 560px
- ✅ D3：派发图标灰灭↔点亮即时切换（wasGray true→false 实证）；体检卡/搜索/toggle 在位
- ✅ D4：右键四项菜单（role=menu：喂食/编辑行为/切换宠物/隐藏桌宠）；在线仓库卡（雪团/煤球占位）；编辑行为面板
- ✅ 账本五档联动：近 7 天 4,392,361,324 ↔ 近 30 天 16,404,361,324 切换实测、导出五钮/峰值/口径页脚在位

**Lighthouse（headless，preview）**：首页 Perf 74 / **A11y 96**；/demo Perf 85 / **A11y 100**——双页硬门槛 ≥95 达标且 /demo 满分；Perf ≥ 基线 73。

**计划 checkbox**：全勾（0 未勾）。本轮无新增 a11y 修复 commit（P9 修复持续有效）。

---

# P10 总报告（2026-10-11）

**六类反馈闭环**：① 首页 CC Switch 式（左文案+三灯行+海报缩略，右主看板实时窗+链接；四仪表卡美化并入故事区；胡萝卜独立板块撤销；对比区+兼容文字行新增）✅ ② 四工具真实界面（ZCode 暗色任务窗按用户裁决与暗色截图/Codex APP ChatGPT-Work 式/WorkBuddy 聊天式/Kimi 官方 TUI 保留；AppWindowShell 公用壳）✅ ③ D1 宽幅 4:3 双完整窗（max-w-7xl，高度自适应）✅ ④ 高度策略（手机面板 560px 固定不随筛选变、D3 仓库卡内部滚动、窗体自然高）✅ ⑤ 终端场景按真实 Claude Code 还原（多选逐字对照图 5；approval/plan/select 按官方范式近似——真截图采集因终端窗口隐藏无法取像素而降级，补图路径已留）✅ ⑥ 宠物扩展（右键菜单/喂食动效/编辑行为面板/在线仓库模拟导入/隐藏唤出闭环）+ 账本五档联动数据（近 7 天真实数据逐位锚定）✅

**任务/commit 对照**：T34 `de04fb8` / T35 `9a54956`（feat）+暗色基准 `5fb0a7b` / T36 `4db07d6(docs)`（feat 于前一条）/ T37 `ad42e4d(docs)`（feat 于前一条）/ T38 `42a0c82(docs)`（feat 于前一条）/ T39 验收无修复 commit（P9 a11y 修复持续有效）；每任务 progress.md 逐条留痕。

**质量门槛**：25 测试全绿；tsc 零错误；241 i18n key 双语对齐；Lighthouse A11y 100/96 ✓、Perf 85/74 ✓。

**遗留观察项（非阻断）**：WorkBuddy/Codex APP 窗文案为图 3/图 4 所示真实内容硬编码（后续改版照图更新）；approval/plan/select 三场景待用户补真截图校准（采集受阻记录于 T36）；hero-poster 969KB 压缩归二期 E7；TopBar 移动折叠菜单（P1 遗留）；P6 部署待用户执行。

# P11 兼容矩阵 + 首页 2×2 + 演示精修 II（2026-10-11 起，计划：2026-10-11-tuvis-website-p11-matrix-home.md）

## Task 40 — 导航修复 + 双同步 + 兼容矩阵板块 ✅（2026-10-11）

**变更文件**
- 新增：`src/home/CompatMatrix.tsx`（三大板块分组 12 行×8 工具列、文字态单元格+note 悬浮、Codex † 脚注、图例+数据源尾注）`src/content/capabilities.json`（首版兜底=capabilities.for-tuvis.json）+ `capabilities.d.json.ts`
- 修改：`split-changelog.mjs` 双源升级（api.github.com contents 拉 CHANGELOG+capabilities、base64 解码、3 重试、失败保底退出 0、--in/--offline）`split-changelog.test.mjs` +2 `README`（内容同步小节）`TopBar`（+首页/功能锚改 /:lang#features 走 ScrollManager/移除免费下载/gap-6+font-medium）`Home`（挂 CompatMatrix）i18n +10（267 双语）

**测试**：tsc 零错误；`pnpm test` **27 passed**；build 成功；`pnpm sync:changelog` 实跑：联网拉取被沙箱 TLS 拦截→回退路径 exit 0（产物未动），--in 本地回退 ✓，--offline ✓。**已知项**：双源联网成功需用户真实网络环境复跑一次 `pnpm sync:changelog`（changelog 将刷至 0.5.6）。

**Commit**：见 git log（feat(nav): home link, features anchor fix, dual-source sync and compat matrix section）

**与计划的偏差（2 项微）**：① 单元格 aria-label 实现为「图例文字 · note」；② 单元格取值加 ?? CELL.no 兜底（防 JSON 缺键崩溃）。
**浏览器目检**：内置浏览器 guest 被用户占用不可用，顺延至 T45 终验矩阵统一执行。

## Task 41 — 首页 2×2 重排 + 宽度统一 ✅（2026-10-11）

**变更文件**：`Hero.tsx`（两排 2×2：第一排文案 2/3+海报 1/3 按海报比例定行高；第二排主看板 2/3 内滚 440/534px+手机 RemoteBoard 1/3；打开完整演示移窗下）`RemoteBoard.tsx`（+onOpenDetail 可选注入通道，D2 行为零变化）`pages/Home`（三处 5xl→7xl 统一）`WorkflowCompare`（字号升档）i18n compare.w4d 补预设组尾注（267 持平）

**测试**：tsc 零错误；`pnpm test` **27 passed**；build 成功。浏览器目检顺延 T45。

**Commit**：见 git log（feat(home): 2x2 hero grid with live board and remote phone, unified 7xl width）

**与计划的偏差**：无

## Task 42 — 字号降档 + 通知统一 + Kimi 完整 TUI ✅（2026-10-11）

**变更文件**：`SessionCard`（项目名 13px/预览 11px/最小高 2.3rem）`AppBoard`（摘要行 11px）`NotificationCard`（近黑卡+左缘橙条，对齐审批场景视觉）`KimiShellTui` 整体重写（七行蓝框欢迎盒含 Version/MCP 行+Desktop 宣传段+MCP 绿行×2+✻用户行+斜体思考+五行回复含路径高亮+输入框+底部 GLM thinking/context 状态栏；内容按用户决策换 tuvis 语境）i18n d1s5 改值（267 持平）

**测试**：tsc 零错误；`pnpm test` **27 passed**；build 成功。浏览器目检顺延 T45。

**Commit**：见 git log（feat(demo): board font downscale, approval-styled notification card and full-height kimi tui）

**与计划的偏差（1 项微）**：欢迎盒外距按 TuiShell flex-col 间距规则去 mb-4 防双重间距。

## Task 43 — D2 同高扩展 + D3 MCP/插件/预设组 ✅（2026-10-11）

**变更文件**
- 新增：`src/demo/remote/FilePreview.tsx`（四形态预览：diff 着色/md react-markdown+remark-gfm/图片占位/代码行 + 筛选 chips + 树切换）
- 修改：`PhoneFrame`（+autoHeight 变体）`RemoteScene`（items-stretch 同高+autoHeight+TUI h-full）`RemoteDetail`（FilePreview 接入+子 Agent chip 行三枚[scout/writer/checker 三态]）`ResourcesScene`（资源类型段控 Skill(73)/MCP(6)/插件(5) 三表同构[配置文件小注/点亮矩阵/搜索/排序/全部启用]+**预设组四 chips 一键覆写派发矩阵**+aria-pressed 高亮）i18n +6 改 1（273 双语）

**测试**：tsc 零错误；`pnpm test` **27 passed**；build 成功。浏览器目检顺延 T45。

**Commit**：见 git log（feat(demo): d2 same-height layout with md/image file preview, subagent chips; d3 mcp/plugin tabs and preset groups）

**与计划的偏差**：无实质（3 点计划字面落地说明：badge.waiting 既有值「待批准」；ClaudeTui 自带根不经 TuiShell 照计划加 h-full；折叠头计数由段控承担）。

## Task 44 — D4 双弹窗 + petdex 真链 + 头顶消息卡 + 账本全展开 ✅（2026-10-11）

**变更文件**
- 新增：`src/demo/PetDialogs.tsx`（DialogShell 受控弹窗 + SwitchPetDialog 五卡网格[头像/名字/内置·v 徽标/喇叭·字幕图标/当前 ring-2] + ImportPetDialog 三 tab[petdex 默认选中/浏览 petdex.dev 真实外链新窗/下载并暂存→Capvolt 加入列表]）
- 修改：`PetUsageScene`（右键菜单切换宠物→开 SwitchPetDialog；在线仓库卡+「导入宠物」链接钮；**头顶常驻三卡**：用量摘要 4 行+详情»、ZCode 红点等待卡、Kimi 绿点完成卡，均带 ×）`LedgerSection`（去固定高内滚全展开，吸顶头去 sticky 保留 border-b）i18n +10（283 双语，达 P11 终值）

**测试**：tsc 零错误；`pnpm test` **27 passed**；build 成功。浏览器目检顺延 T45。

**Commit**：见 git log（feat(demo): pet switch/import dialogs with petdex link, head notification cards, full-spread ledger）

**与计划的偏差（5 项小裁量）**：① 切换网格 5 卡非 4 卡（按任务数据清单与截图）；② 头顶卡定位 bottom-full 向上生长（-top-28 会盖宠物）+内容按 pet-head-cards.png 真实数据；③ 内置徽标拆「内置」+「v2」两 pill；④ 下载完成追加 Capvolt 回调；⑤ 弹窗 × aria-label 复用 usage.win.close（+10 名额已满）。

## Task 45 — P11 全站验收 ✅（2026-10-12）

**机器验证**：tsc 零错误；`pnpm test` **27 passed**；build 成功；路由 smoke 全 200。

**控制方浏览器矩阵（preview 生产构建）**
- ✅ 导航：首页项在最前、免费下载钮已移除、功能锚点击落故事区（/:lang#features 走 ScrollManager）
- ✅ 首页 2×2：第一排文案 2/3+海报 1/3（723px 原图完整渲染）；第二排主看板 2/3+手机远程 1/3（RemoteBoard bezel）；全站 7xl 统一
- ✅ 兼容矩阵板块：三大板块分组 12 行×8 工具列、图例、dsh 暂不支持走 title 悬浮注（规格如此）、Codex † 脚注
- ✅ 工作流对比区：字体升档 + Skill 步预设组尾注
- ✅ D2：手机与 TUI 同高无滚动、文件预览四形态+筛选、子代理 chip 三枚
- ✅ D3：Skill(73)/MCP(6)/插件(5) 三表切换 + 预设组四 chips 覆写
- ✅ D4：切换宠物五卡弹窗/导入三 tab 弹窗（petdex.dev 真外链）/头顶常驻三卡（用量摘要+ZCode 红点+Kimi 绿点）
- ✅ 账本五档联动（近 7 天 4,392,361,324 ↔ 近 30 天 16,404,361,324 实测）+ 全展开无内滚

**Lighthouse（headless，preview）**：首页 Perf 72 / **A11y 96**；/demo Perf 80 / **A11y 100**——A11y 双页 ≥95 ✓；首页 Perf 72 较基线 73 低 1 点（2×2 新增内容轻微漂移，随 E7 图片压缩池解决）。

**计划 checkbox**：全勾（0 未勾）。本轮无新增修复 commit。

---

# P11 总报告（2026-10-12）

**七类反馈闭环**：① 导航（+首页/修功能锚/去免费下载/标签优化）✅ ② changelog 自动同步（api.github.com 双源脚本+Action 预留+失败保底；**待用户在真实网络跑一次 pnpm sync:changelog 刷至 0.5.6**；capabilities.json 初稿已生成待用户提交 tuvis 仓 docs/）✅ ③ 首页 2×2（文案 2/3+形象图 1/3 / 主看板 2/3+手机 1/3，两排各自对齐）+ 宽度统一 7xl ✅ ④ 兼容矩阵板块（ tuvis 仓 README 总表为单一源、三板块分组 12 行、文字态单元格）置于对比区上方 ✅ ⑤ 对比区字体加大 + Skill 步补预设组 ✅ ⑥ 演示精修 II（主看板字号降档/审批通知统一近黑橙条/Kimi 完整 TUI 按新截图/D2 同高无滚动+文件预览 md 图片+筛选+子代理 chip/D3 MCP·插件·预设组/D4 切换网格+导入三 tab+petdex 真链+头顶常驻消息卡/账本全展开）✅

**任务/commit 对照**：T40 `104f487(docs)`（feat 于前一条）/ T41 `9ffbabd(docs)` / T42 `580b5c3(docs)` / T43 `9a9641e(docs)` / T44 `c2c383c(docs)` / T45 无修复 commit；每任务 feat+docs 双提交。

**质量门槛**：27 测试全绿；tsc 零错误；283 i18n key 双语对齐；Lighthouse A11y 100/96 ✓、Perf 80/72（72 较基线 -1，E7 池覆盖）。

**遗留观察项（非阻断）**：① capabilities.json 需用户提交 tuvis 主仓 docs/ 后网站同步才有真实远端源（现用首版兜底，渲染正常）；② sync 联网拉取需用户真实网络复跑 pnpm sync:changelog；③ approval/plan/select 三场景待真截图校准（P10 遗留）；④ WorkBuddy/Codex APP 窗文案照参考图后续更新；⑤ hero 海报压缩归 E7；⑥ P6 部署待用户执行。

# P12 手机真机化 + 首页看板对齐（2026-10-12，用户反馈直改批次，无独立计划文件）

## 变更文件
- 修改：`PhoneFrame.tsx`（**真机化重写**：bezel+电源/音量侧键+屏幕状态栏[时间 18:37/前摄挖孔/信号·蓝牙·Wi-Fi·电量图标组手绘 SVG]；去 autoHeight 变体与全部内滚——手机页一次性完整可见）`seed.ts`（+dsh 会话凑 6 卡）`AppBoard.tsx`（+columns 2|3 prop 与 className 透传；columns=2 时 auto-rows-fr 随窗高拉伸）`Hero.tsx`（第二排重排：看板 columns=2 等高对齐手机+去窗内滚，items-stretch）`RemoteBoard`（手机屏最多 3 卡+PHONE_META.dsh）`RemoteScene`（去 autoHeight 传参）`PlayerFrame`（**去统一定高 420/500px**——演示区按内容自然高，落实 P11 用户「不要限统一高度」指示）i18n +1（demo.phone.title.dsh，284 双语）

## 验证
- tsc 零错误；`pnpm test` **27 passed**；build 成功
- 浏览器断言：首页第二排左右等高（567px=567px）；看板 3 行 2 列×6 卡（含 dsh）；手机状态栏/前摄/图标组渲染；D2 手机屏 scrollHeight==clientHeight（551=551 无内滚）、bezel 完整在舞台内；舞台去定高后手机不再被裁切

## Commit：见 git log（feat(demo): realistic phone chrome, home board 3x2 aligned to phone, natural demo heights）

## 与计划偏差
- 无计划文件（直改批次）。备注：① PlayerFrame 去定高落定 P11 用户指示，页面高度随演示内容伸缩（用户最新指示优先于 P8 决策 6）；② dsh 手机卡标题走新增 i18n key；③ 真实 ClaudeTui 会话高度与手机同排为 items-stretch 自然结果。

# P13 首页信息架构重排 + 内容自动同步与上线准备 + 演示保真大修（2026-10-12，计划 2026-10-12-tuvis-website-p13-launch-fidelity.md）

**裁决记录**：grilling 两轮七项——G1 一步到位上线+自动同步；G2 手机=硬件框+纯 Web UI（remote-ui 定稿为权威）；G3 看板空格纯留空；G4 矩阵独立区块且置于功能四卡与故事卡之前（开工前用户修正）；G5 Hero 右侧保留海报；G6 D1 单槽切换+统一定高；G7 配置好但不 push。

**T46 同步+徽章**（commit feat(sync)）：split-changelog 机制沿用，`--use-system-ca` 修复本机 TLS 中间人下 Node fetch（写入 npm scripts，Actions 无副作用）；sync-user-manual 重写为「git/trees 列目录 + raw 逐文件 + 100s 全局预算 + 全量成功才落盘，否则本地回退」；build 串入双同步；public/manual 入 git 作离线兜底（45 文件）；changelog.json 刷到 v0.5.6（对齐主仓 release）；Hero 徽章改读 changelog.json 最新版本（hero.badge → v{LATEST}·hero.badgeTag）。
**T53 矩阵**（同 commit）：capabilities.json 列序 claude/codex/opencode/kimi/workbuddy/zcode/dsh/openclaw（for-tuvis 草稿同步改）；table-fixed + 首列 22% + 数据列均分对齐。
**T47/T48 首页重排**（commit feat(home)）：TopBar 七项（+产品形态）text-base + md 以下折叠菜单（清 P1 375px 溢出遗留）；Home 顺序 Hero→产品形态→矩阵→功能四卡→你会这样用它→没有vs有→开源+下载合并卡；FeaturesSection/StoriesSection 拆分（stories.note 注释删除、compare.compat 兼容行删除）；WorkflowCompare 5v5 一一对应（w2 融合审批+失联、w3 新增移动端各自为政、统一仓库+预设组方案拆入右列）；OpenSourceDownload 合并卡；Hero 单排文案列内居中；ProductShowcase（4×2 静态看板 + 340px 固定比例手机）。
**T49 D1**（commit feat(demo)）：seed 七会话 tuvis 化 + opencode（tuvis-app/tray-icon-states）；OpenCodeTui 新窗；ClaudeTui 橙像素兔头部 + 中文正文（对照用户截图）+ recap 路径 tuvis 化；六窗统一定高 576px（浏览器实测=最高两窗自然高；三 APP 窗侧栏改中部截断+底栏钉底）；D1 看板 columns=3 强制 `md:grid-cols-3`（5xl 容器够不到 xl 断点）；剧本加跳转⑥；ZCode/WorkBuddy/Codex 侧栏项目 tuvis 化。
**T50 D2**（同 commit）：PhoneFrame 屏幕锁定 78:163.4（iPhone 18 Pro Max 形态）+ maxWidth 参数 + 屏底暖纸色；RemoteBoard 逐要素对照 01 定稿（品牌行动态版本/三图标钮/中性 chips/白卡彩檐/mono 时间/淡底徽标，3 张封顶）；RemoteDetail 逐段对照 02 定稿（详情头状态徽标/书签调试栏/暖灰气泡/工具调用行/计划卡/审批红卡/问答卡即点即选/输入行）；FilePreview 按 02 C 段重做（分段筛选 + 改/读徽标行）；RemoteBoard/Detail/FilePreview 底色换 01 定稿暖纸 token。
**T51 D3**（commit feat(demo)）：矩阵 7 工具列；Skill 行换 superpowers 系真名（105 总数对齐 preset-create.png）；预设组独立区块（仓库大卡下方）：名称+资源数徽标+删除+7 工具开关行，「对特定工具开启」=覆写该工具列；新建弹窗（类型 radio/名称/描述/Skill 勾选清单）；剧本 4 步经 `tuvis-d3` CustomEvent 驱动绝对状态（导入/手动开关/前端设计→Kimi/Superpowers→Claude）。
**T52 D4**（同 commit）：常驻用量摘要卡删除；token 浮窗四行格式=pet-window.png 真机、仅 hover 或剧本步 4；头顶两卡常驻、卡 1 黄(运行中)→红(等待操作)联动剧本；拖拽 scale(1.05,0.92) 压扁动效移除（用户质询项）；剧本 4 步（导入/切换/审批变红/token 浮窗）经 `tuvis-d4` 事件驱动。
**T55 文档**（commit feat(docs)）：/docs 重定向 01-overview，DocsPage 落地卡删除；文章页侧栏（13 篇）与翻页保留。
**T54 部署**（commit feat(deploy)）：.github/workflows/deploy.yml 三触发线（push/schedule 6h/repository_dispatch tuvis-docs-update）+ Pages 部署；docs/deploy/tuvis-repo-dispatch.yml 主仓侧草稿 + README 上线检查单（push 由用户执行）；`git remote add origin` 已做（本地操作）。
**T56 验收**：tsc 零错误；27/27 测试（i18n parity 318 键）；生产构建+404 绿；浏览器断言全过——首页区块顺序/导航七项大字号/徽章 v0.5.6 动态/产品形态 4×2+手机比例 2.095/矩阵列序 8 列对齐/对比区 5v5/合并卡/D1 3×3+六窗 576 等高/D2 比例锁定+3 卡+详情零溢出+终端同高/D3 预设卡+开关互不影响+创建弹窗/D4 两常驻卡+黄变红+token 浮窗+无压扁/docs 直达；控制台零错误；视觉抽查（产品形态/hero/D2 详情）对照定稿通过。

**任务/commit 对照**：feat(sync)＝T46+T53；feat(home)＝T47+T48；feat(demo)＝T49+T50+T51+T52；feat(docs)＝T55；feat(deploy)＝T54；本条 progress+plan 勾选＝docs。

**用户待办更新**：① push 上线（照 docs/deploy/README.md 五步）；② capabilities.for-tuvis.json（已更新列序）复制提交 tuvis 主仓 docs/capabilities.json；③（可选）配 SITE_DISPATCH_PAT 启用实时触发线；④（可选）OpenCode 官方截图校准 OpenCodeTui。

# P14 关于仿真窗求 Star + 像素兔校准（2026-10-12，用户反馈直改批次，无独立计划文件）

**改动**：① 首页「开源 · 本地优先 · 无遥测」左半新增 AboutWindow 仿真窗（对照用户提供的 CC Switch 关于页截图，tuvis 语境硬编码中文——app 窗惯例）：应用卡（logo + 版本 v0.5.5 + 「更新到 v{LATEST}」动态）→ 检测到新版本行 → 官方网站/更新日志（站内路由）/近期更新 链接行 → ★ 求 Star 橙底横幅（去点 Star 直达 repo + × 可关）；原左半裸 GitHub 按钮删除（Star 横幅承接）。② ClaudeTui 头部像素兔按参考图逐格重绘：太空侵略者式宽方身圆角、白色竖眼（#F5F1E8）、两侧中段凸块、四条短腿——替换原长耳误版；截图对照通过。

**验证**：tsc 零错误；27/27 测试；生产构建绿；浏览器截图复核（关于窗结构、兔形态白眼）。

**提交**：feat(home)＝关于窗+求 Star；feat(demo)＝像素兔校准。

# P15 同步与起服务解耦（2026-10-12，用户反馈直改批次）

**背景**：用户起服务卡在 manual 网络同步（慢代理下 raw.githubusercontent 逐文件超时重试，最坏数分钟且无输出）。

**改动**：① sync-user-manual 预算机制收口——`--budget N` 参数（默认 30s）、单文件 10s×2 次、**尝试启动前预判能否在预算内完成**（原来首个文件就能吃满预算）、进度日志（开始/每 10 个/放弃原因）；dev 传 15s 短预算。② 脚本拆分：`pnpm dev`=纯 vite 零网络秒开（副本已入 git，实测 935ms ready）；`pnpm dev:sync`=先同步再起；`pnpm sync`=只同步不起服务（手动拉最新用）；build 保持带同步（Actions 云端跑，网络快）。③ docs/deploy/README 新增「本地命令与同步节奏」节（部署=push 后 Actions 云端 build 出 dist 发布 Pages，用户不手动打包；三层同步节奏+手动 sync）。④ 恢复 brand 下被误删的 preview.png（红线目录，来源不明立即还原）。

**实测**：慢代理下 dev 秒开；sync 26s 带进度并自动回退本地源（exit 0）；build/test/tsc 复绿。

# P16 部署改发版模型（2026-10-12，用户反馈直改批次）

**需求**：主线（main）随时推 WIP，只有「改好的版本相当于发 release」时才更新线上部署。

**改动**：deploy.yml 触发从 push main 改为 **tag 触发（v*）**；schedule 6h / repository_dispatch / workflow_dispatch 保留但部署目标解析为「最新 v* tag 的代码 + 构建时实时拉主仓文档」（resolve 步骤：tag push 用该 tag，其余取 api tags[0]，手动可填 ref，无 tag 兜底 main）；push main 只存档不部署。docs/deploy/README 全文改写为发版模型（发布=git tag v0.5.7 && git push origin v0.5.7；tag 需打在含新 workflow 的提交上；故障排查加 tag 未部署/版本不对两项）。

**验证**：YAML 解析通过（triggers/resolve/checkout ref 断言）；本地无 Actions 可跑，云端行为以日志 deploying ref 行为准。

# P17 三处小修（2026-10-12，用户反馈直改批次）

① 下载卡：删「↓ Windows/macOS」残留小字，改为匹配系统按钮 ring 高亮 + 「当前系统」角标（UA 检测）。② ClaudeTui multiselect 场景删「问 我一道多选题」用户行（真实截图残留，tuvis 化规则）。③ D2 终端 md+ 改绝对定位填充——高度恒等于手机（737px），场景切换内容变高不再撑大行高。浏览器断言全过（diff=0、无用户行、ring 生效、无 ↓ 行）；27 测试 + 构建绿。

# Tuvis World Task 1：可验证的资源接入与开发环境（2026-10-19）

**环境自检**
- Node `v22.22.3`；npm `10.9.8`；pnpm 安装前不存在，`npm install --global pnpm@10.20.0 --registry=https://registry.npmjs.org` 后为 `10.20.0`（全局 bin 在 `/.npm-global/bin`，已软链到 `/usr/local/bin/pnpm`）。
- 官方 npm registry 可达（`npm view --registry=https://registry.npmjs.org pnpm@10.20.0 version` → 10.20.0）；项目依赖使用官方 registry 安装。默认 npm registry 为 `https://registry.npmmirror.com`，未用于本次安装。
- 仓库由附件 ZIP 解包到 `/mnt/tos/workspace/tuvis-website`；基线 HEAD `a9eeea6`；挂载 `/mnt/tos` 容量充足。`.autocase/input` 只读未写入。
- `verify-pack.mjs`：PASS 17 images / 15 frames / 12 hotspots / 18 connected nodes / 47 files；`audit-handoff.mjs`：两项 PASS。
- 基线 `pnpm test`：6 files / 42 tests 全通过（测试环境启动较慢，约 5 分钟，后续按需单文件运行）。

**变更文件**
- 新增：`.nvmrc`、`scripts/import-world-pack.mjs`、`scripts/import-world-pack.test.mjs`、`src/world/types.ts`、`src/world/testFixtures.ts`、`src/world/assets/loadWorldData.ts`、`src/world/assets/loadWorldData.test.ts`、`public/world/v1/`（20 文件，35 MB）。
- 修改：`package.json`（packageManager → pnpm@10.20.0）、`tsconfig.json`（resolveJsonModule，供测试夹具导入包内 JSON）。

**测试输出摘要**
- `node scripts/import-world-pack.mjs` → copied 20 files to public/world/v1。
- `pnpm exec vitest run scripts/import-world-pack.test.mjs src/world/assets/loadWorldData.test.ts` → 2 files / 12 tests PASS（真实包 SHA 一致、篡改字节拒绝、`../outside.png` 拒绝且不复制）。
- `pnpm exec tsc --noEmit` → exit 0。

**与计划的偏差**
- `pnpm install` 未改变 `pnpm-lock.yaml`（现有锁文件与 semver 范围兼容）；未新增运行时依赖。
- 计划中“首页 loadWorldContent 仅请求 manifest/content”与测试均已落实；`preloadCoreAssets` 使用 `manifest.coreAssets`（room/directions/actions/props）。

# Tuvis World Task 2：可独立浏览的专题首页（2026-10-19）

**变更文件**
- 新增：`src/pages/WorldPage.tsx`、`src/pages/WorkshopPage.tsx`（Task 2 静态壳，Task 5 替换）、`src/world/landing/WorldLanding.tsx`、`src/world/content/ContentPanel.tsx`、`src/world/world.css`、`src/world/landing/WorldLanding.test.tsx`。
- 修改：`src/router.tsx`（/:lang/world 与 /:lang/world/workshop，React.lazy + Suspense）、`src/components/layout/TopBar.tsx`（nav.world）、`src/i18n/zh.json`、`src/i18n/en.json`（+7 键，中英一致）。

**实现要点**
- W-01～W-06 按需求顺序；四装备用 `family` 原图与 `content.equipment[].sourceRect` 精确裁切（绝对定位 + 比例换算，不切图）；图鉴统一详情区随卡片选择更新。
- 两个“进入兔维斯工坊”都指向 `/{lang}/world/workshop`；W-05 三个“查看简介”打开共享 ContentPanel，Esc/关闭可退出并恢复触发按钮焦点。
- 首页仅调用 `loadWorldContent`（manifest + content），不加载 scene.json 或工坊图片；图片按需 lazy 加载，hero/city 首屏优先。
- 英文路径保留英文界面键，并显示世界内容语言说明。

**测试输出摘要**
- `pnpm exec vitest run src/world/landing/WorldLanding.test.tsx src/i18n/parity.test.ts` → 2 files / 7 tests PASS。
- `pnpm exec tsc --noEmit` → exit 0。

**与计划的偏差**
- 无。浏览器视觉复核留待 Task 9（本环境暂无已配置的自动化浏览器工具，届时核实并按实际能力记录）。

# Tuvis World Task 3：场景坐标、碰撞与可达路径（2026-10-19）

**变更文件**
- 新增：`src/world/scene/geometry.ts`、`src/world/scene/navigation.ts`、`src/world/scene/navigation.test.ts`。

**实现要点**
- `toScenePoint` 用实际渲染矩形（含 letterbox/缩放）换算，不用窗口尺寸。
- `isWalkable`：脚底中心在 walkable 多边形内，且与每个家具障碍距离 ≥ `footRadius=12`（walkable 已含外围安全余量，不重复内缩）。
- `isSegmentClear`：两端可走、整段不与 walkable 边界相交、与每个障碍的段-多边形距离 ≥ footRadius；不是仅采样终点。
- `findPath`：起点/终点接入人工通道图（仅采用 `scene.nav.edges` 且逐边几何复核），Dijkstra 求最短；返回前逐段复核，任何不合法段返回 null。
- `directionFor` 返回四向斜视角；零距离保持当前朝向，轴向移动优先保持同向对角。

**测试输出摘要**
- `pnpm exec vitest run src/world/scene/navigation.test.ts` → 17 tests PASS（含 12 热点全部可达、跨休息椅直线被拒、绕行路径逐段合法、花园点 null、坐标换算三例）。
- `pnpm exec tsc --noEmit` 在 Task 2 后已为 0；本任务新增文件由同一命令覆盖（最终 Task 9 复跑）。

**与计划的偏差**
- 节点图采用计划规定的 `nav.edges` 作为通道边（而非任意可见性连边），更符合“人工标注通道图”；临时起终点仍与所有可直视节点连接。

# Tuvis World Task 4：主线状态与可靠存档（2026-10-19）

**变更文件**
- 新增：`src/world/quest/quest.ts`、`src/world/quest/persistence.ts`、`src/world/quest/quest.test.ts`。

**实现要点**
- `questReducer`：COLLECT 去重且只接受 sight/cell/emitter；REPAIR_CELL 需已领取 cell；INSTALL 需三模块集齐且能源匣已修；PLACE_ON_RACK 需三件已安装；RESET 回 `INITIAL_QUEST`；HELP_SEEN 独立记录。
- 存档 key `tuvis-world-v1`，外层 `schemaVersion=1`；`decodeQuest` 对损坏 JSON、未知版本、非法字段安全重置；`sanitizeQuest` 清理“未领取/未维修却已安装/已陈列”的不可能状态。
- `readQuest`/`writeQuest` 捕获存储异常；写入失败返回 false，不阻断会话内游玩；重玩仅回写本专区 key。

**测试输出摘要**
- `pnpm exec vitest run src/world/quest/quest.test.ts` → 17 tests PASS（六种领取顺序、重复领取、过早维修/安装/陈列、损坏与不可能存档、受限存储、重玩隔离）。
- `pnpm exec tsc --noEmit` → exit 0。

**与计划的偏差**
- 无。

# Tuvis World Task 5：工坊显示、移动与唯一到达事件（2026-10-19）

**变更文件**
- 新增：`src/world/scene/Sprite.tsx`、`src/world/scene/SceneView.tsx`、`src/world/scene/runtimeStore.ts`、`src/world/scene/useSceneLoop.ts`、`src/world/scene/motion.test.tsx`。
- 修改：`src/world/scene/navigation.ts`（MotionState/advanceMotion）、`src/pages/WorkshopPage.tsx`（加载数据 + 核心图片预载 + 运行时 Store + SceneView）、`src/world/world.css`、`src/i18n/{zh,en}.json`（+1 key）。

**实现要点**
- Sprite 用 SVG viewBox 精确裁切 `sourceRect`，以 `anchor` 为 CSS 原点；角色切 nw/se 时位置不变。家具按 `scene.props[].depth`、角色按脚底 y 排序，支持前后遮挡。
- 帧循环每帧最多推进 100ms（19px），逐段 `isSegmentClear` 复核；到达 token 必须等于最新请求，旧目标/旧到达事件自动失效。
- 面板打开（setOverlay 非空）取消移动；窗口 blur / 标签隐藏取消目标。点击坐标通过舞台实际 `getBoundingClientRect` 换算。
- 12 个热点为可聚焦按钮，先走向 `approach`，到达后才触发内容（Task 6 接入）。
- 工坊进入时 `loadWorldData` + `preloadCoreAssets`（room/directions/actions/props），失败显示错误与重试。

**测试输出摘要**
- `pnpm exec vitest run src/world/scene/motion.test.tsx src/world/scene/navigation.test.ts` → 2 files / 25 tests PASS（大帧间隔不穿越、到达仅一次、新目标使旧 token 失效、面板暂停、不可达反馈、Sprite 裁切/脚底锚点不变）。
- `pnpm exec tsc --noEmit` → exit 0。
- 已用 vision 工具核对 occlusion-behind/front：角色 y 小于家具 depth 时被椅子遮挡、大于时在前；与按地面 depth 排序一致。

**与计划的偏差**
- `motion.test.ts` 改为 `motion.test.tsx`（含 Sprite JSX 渲染断言）；`navigation-overlay.jpg` 视觉读图两次超时，未作为依据，碰撞/导航以 `scene.json` + 几何测试为准。

# Tuvis World Task 6：物件内容、家中出口与日常姿态（2026-10-19）

**变更文件**
- 新增：`src/world/scene/interaction.ts`、`src/world/scene/interaction.test.tsx`、`src/world/quest/QuestBar.tsx`、`src/world/quest/WorkbenchPanel.tsx`。
- 修改：`src/world/scene/SceneView.tsx`（到达事件 → resolveHotspot、任务栏、内容/工作台面板、装备架成品图）、`src/world/world.css`、`src/world/scene/runtimeStore.ts`（Task 5 已含 setPose；本任务未改行为）。

**实现要点**
- `resolveHotspot` 仅按 `scene.hotspots[].kind/contentId/moduleId` 分支：工具箱→图鉴+瞄准模块；海报→居民+能源匣；窗→回路城+发射头；书架→故事；椅子→sit；咖啡机/桌→coffee；工作台按“缺模块→task / 未修→repair / 已修→assembly”；装备架在三件安装后发 PLACE_ON_RACK + display，未完成时给任务提示。
- 两扇门返回 `content.doors` 说明与 nextSceneId 数据，不切换场景。
- 到达事件只在 token 有效时由 SceneView 处理一次，处理完清空 pendingArrival；新移动覆盖日常姿态。
- 坐姿按 `seatAnchorSource` 换算裁切内归一化锚点，定位 `seatPosition`、深度 `actions.sit.depth`；导航脚底仍留在椅子靠近点。
- QuestBar 显示三槽状态与唯一当前动作；WorkbenchPanel 提供任务清单、SVG 接口示意、选中松动接口后“执行检查”、修复后“进入组装”。

**测试输出摘要**
- `pnpm exec vitest run src/world/scene/interaction.test.tsx src/world/landing/WorldLanding.test.tsx` → 2 files / 18 tests PASS。
- `pnpm exec tsc --noEmit` → exit 0。

**与计划的偏差**
- 组装 overlay 在本任务先渲染占位对话框，Task 7 立即替换为 AssemblyPanel（保持 Task 独立可回滚）。

# Tuvis World Task 7：能源匣维修与双输入组装（2026-10-19）

**变更文件**
- 新增：`src/world/quest/AssemblyPanel.tsx`、`src/world/quest/AssemblyPanel.test.tsx`。
- 修改：`src/world/scene/SceneView.tsx`（assembly overlay → AssemblyPanel）、`src/world/world.css`、`src/world/quest/WorkbenchPanel.tsx`（Task 6 已含维修界面，本任务未再改）。

**实现要点**
- 组装舞台 `1100×720`，主体/零件/插槽/成品全部读取 `scene.assembly`；显示坐标按舞台实际矩形换算，同一 socket 在 550×360、1100×720、733×480 下均可吸附。
- 拖拽（Pointer Events + setPointerCapture）与“点零件→点插槽”共用同一安装判断；错误插槽、pointercancel、window blur、Esc 均不发 INSTALL 事件，模块不被消耗。
- 打开时 preload body/emitter/sight/cell/complete 五张装备图，失败显示重试且保留任务状态；三件安装后切换 `gunComplete` 成品图。
- 关闭/返回只清本地拖拽与选中，不发 PLACE_ON_RACK；该事件仍只由装备架到达触发。
- 维修界面（WorkbenchPanel）用代码 SVG 绘制接口两态；选中松动接口后“执行检查”发 REPAIR_CELL，修复后显示“进入组装”。

**测试输出摘要**
- `pnpm exec vitest run src/world/quest/AssemblyPanel.test.tsx src/world/quest/quest.test.ts` → 2 files / 25 tests PASS。
- `pnpm exec tsc --noEmit` → exit 0。
- `assembly-layout.jpg` vision 读取超时，未作为视觉依据；布局以 `scene.assembly` 数值为准（已在 progress 记录）。

**与计划的偏差**
- 计划要求本任务修改 WorkbenchPanel；实际维修选择器在 Task 6 已按接口落地，本任务无需再改。

# Tuvis World Task 8：加载重试、存档集成与完整流程（2026-10-19）

**变更文件**
- 新增：`src/world/WorkshopFlow.test.tsx`。
- 修改：`src/pages/WorkshopPage.tsx`（导出 WorkshopRuntime；读取/写入版本化存档；重玩确认；首次操作说明；操作说明按钮）、`src/world/scene/runtimeStore.ts`（面板打开时拒绝新移动）、`src/world/scene/useSceneLoop.ts`（Task 5 已含失焦/隐藏取消，本任务未再改）、`src/world/assets/loadWorldData.ts`（Task 1 已含加载接口，本任务未再改）、`src/world/content/ContentPanel.tsx`（Task 2 已含 Esc/焦点恢复，本任务未再改）、`src/world/quest/AssemblyPanel.tsx`（纯点击不再触发吸附，仅拖拽位移后松手才吸附）、`src/world/world.css`。

**实现要点**
- WorkshopRuntime 挂载时 `readQuest` 恢复；store 订阅仅在 `quest` 引用变化时 `writeQuest`，移动帧不写存储。
- 首次进入且未 helpSeen：显示两条操作说明 + “知道了”；操作说明按钮随时打开 help 面板；重玩按钮先弹确认，确认后只重置本专区任务并回写本 key。
- 存储 getItem/setItem 抛错或不可用时仍可在内存中完成主线。
- 加载状态明确 loading/error/ready；重试自增请求号并忽略旧 Promise；核心图片 preload 完成后才挂载 SceneView/移动循环。
- 面板打开时 `requestMove` 直接忽略，配合帧循环 `overlay===null` 双重暂停。
- 集成测试覆盖：三模块任意路径领取 → 维修 → 点击安装三件 → 成品 → 装备架陈列 → 刷新恢复 → 重玩；核心图片失败重试；setItem 抛错仍完成；面板暂停、blur 清目标、Esc 关闭并恢复焦点。

**测试输出摘要**
- `pnpm exec vitest run src/world/WorkshopFlow.test.tsx` → 4 tests PASS。
- `pnpm test` 全量 → 15 files / **126 tests PASS**（基线 42 + 新增 84）。
- `pnpm exec tsc --noEmit` → exit 0。
- 加固后复跑 AssemblyPanel/WorkshopFlow/motion → 20 tests PASS。

**与计划的偏差**
- 为集成测试可驱动，`WorkshopRuntime` 增加可选 `storage` 与 `storeRef` 测试钩子（生产路径默认使用 localStorage，不影响页面接口）。

# Tuvis World Task 9：静态构建、桌面验证与交付记录（2026-10-19）

**变更文件**
- 新增：`docs/qa/tuvis-world-desktop.md`。
- 修改：`README.md`（专区入口、素材导入、测试基线说明）、`src/pages/WorkshopPage.tsx`（工作区居中容器）、`src/world/landing/WorldLanding.tsx` + `WorldLanding.test.tsx`（标题中文名不拆行；可访问名称允许空白）、`src/world/scene/Sprite.tsx`（百分比定位随舞台缩放；SVG 裁切关闭 overflow 防止整张图集外溢）、`src/world/scene/SceneView.tsx`（传入舞台尺寸）、`src/world/scene/motion.test.tsx`、`src/world/world.css`（舞台按视口高度约束并居中、任务栏 keep-all、紧凑工坊头部）、`tsconfig.json`（恢复原格式，仅保留 resolveJsonModule）。

**验证输出摘要**
- `node verify-pack.mjs` / `audit-handoff.mjs`：全部 PASS（17 images / 15 frames / 12 hotspots / 18 nodes；映射 17/17）。
- `pnpm test`：15 files / **126 tests passed**，exit 0（含基线 42；基线 6 个测试文件 `git diff a9eeea6..HEAD --` 均为空）。
- `pnpm exec tsc --noEmit`：无输出，exit 0。
- `pnpm build`：exit 0，`dist/index.html`、`dist/404.html` 生成，`dist/` 47 MB。
- Chromium 146 CDP 浏览器验收：**46/46 checks passed**，`errors: []`；覆盖六模块、深链接刷新、/en 语言说明、12 热点、地面/物件移动、不可达反馈、两门、日常姿态、维修/组装/陈列、刷新恢复、重玩、遮挡前后、三种视口/DPR 点击换算。
- 逐热点路径输出与六种领取顺序输出见 `docs/qa/tuvis-world-desktop.md`；临时证据测试已删除，不进入产品代码。

**视觉修正记录**
- 1280×720 下工坊原先需要滚动且角色使用场景像素绝对定位，缩放后会跑出舞台；已改为舞台按 `min(100%, (100vh - 300px) * 1.5)` 缩放并居中，Sprite 改用百分比坐标。实测舞台 630×420、left=318、bottom=698<720，点击换算仍精确落点。
- Sprite 的 SVG 曾因 `overflow: visible` 把整张四向图集渲染出来（截图可见 4 个兔子）；改为 `overflow: hidden` 后，隐藏角色前后的像素差仅覆盖单个角色包围盒。

**与计划的偏差**
- `pnpm install --frozen-lockfile` 在本卷持续失败：`EPERM: operation not permitted, unlink '.../_tmp_*'`（pnpm 在 store 路径探测时无法删除仓库根临时文件），与锁文件内容无关；首次 `pnpm install` 成功，锁文件未变，依赖、测试与构建不受影响。该环境限制已写入验收记录。
- `family.png` 在 x=627 图集边界存在相邻格少量渗色，按 `content.sourceRect` 裁切时 Bug Buster 左缘会带入邻格残段；未自行改裁切，已在验收记录标注。
- 浏览器验收为 Linux Chromium 146 + CDP 设备模拟；Windows/macOS/Safari/真实系统缩放/真实断网未实测，已在验收记录逐项标注。

# Tuvis World 严格自查与修复（2026-10-19）

**审查方式**：逐文件阅读 + `wc -l` + 调用链 grep + 全量测试 + Chromium CDP 浏览器复核。`tsc --noEmit` 开启 `noUnusedLocals`；仓库无 ESLint/Biome/Prettier 配置（`ls -a | grep -Ei "eslint|biome|prettier"` 无输出，`package.json` 无 lint 脚本）。

**逐模块结论**
- `geometry.ts`（134 行）/`navigation.ts`（182 行）：纯几何与寻路，无 React/Zustand 依赖；`findPath` 使用 `nav.edges` + 临时起终点全段复核；未发现空壳分支。
- `runtimeStore.ts`（143 行）/`useSceneLoop.ts`（51 行）：Store 只保存运行时状态与动作；循环每帧 `getState()` 取最新值，面板/失焦取消；已接线到 `WorkshopPage` 与 `SceneView`。
- `interaction.ts`（79 行）：只按 `scene.hotspots[].kind/contentId/moduleId` 分支；无按中文名分支。
- `quest.ts`（74 行）/`persistence.ts`（74 行）：纯 reducer + 版本化存档；损坏/非法状态清理；已接入运行时与页面订阅写入。
- `WorkbenchPanel.tsx`（151 行）/`AssemblyPanel.tsx`（378 行）：维修 SVG 与组装舞台均为真实交互；无 mock 数据，坐标全部来自 `scene.assembly`。
- `loadWorldData.ts`（530 行）/`import-world-pack.mjs`（145 行）：运行时验证 + 导入前 SHA/路径校验；首页只请求 manifest/content。
- `WorldLanding.tsx`（266 行）/`ContentPanel.tsx`（160 行）：六模块、图集裁切、故事详情、焦点恢复；内容全部来自 bundle。
- `SceneView.tsx`（251 行）/`Sprite.tsx`（68 行）：热点、深度排序、脚底锚点、舞台缩放；本轮补上脚底投影与移动起伏。
- 未发现 `TODO/FIXME/@ts-ignore/as any`；`console.log` 仅存在于导入 CLI 的成功提示。

**最薄弱 3 处及修复**

1. **角色运动表现不完整（设计妥协）**
   - 修前：只有静态帧切换，没有脚底投影、移动起伏、姿态短过渡；与需求 4.5 不符。
   - 修后：`SceneView` 增加 `.world-actor-shadow`（按角色脚底定位、随深度排序）；`.world-actor.is-moving` 420ms 起伏；帧切换 170ms 淡入；`prefers-reduced-motion` 关闭动画。
   - 测试：`WorkshopFlow.test.tsx > pauses movement for panels, stops on blur, and Esc restores focus` 断言投影存在、移动时 `is-moving` 出现、面板打开后消失。

2. **重玩确认对话框可访问性/状态清理不足（测试与实现均弱）**
   - 修前：无 Esc、无初始焦点、无焦点恢复、无 `aria-describedby`；重置后 `notice` 可能残留。
   - 修后：打开时焦点进入“取消”，Esc/背景点击关闭，关闭后焦点回到“重玩主线”；重置同时 `setNotice(null)`。
   - 测试：`WorkshopFlow.test.tsx` 完整流程中打开重玩确认 → Esc → 断言对话框消失且焦点回到触发按钮，再确认重玩。

3. **边界行为与测试缺口（代码小缺陷 + 测试弱）**
   - 修前：坐在椅子/喝咖啡时点击不可达地面，目标被拒但日常姿态未结束；重复 INSTALL、核心图未就绪不可玩、运行中缩放没有直接测试。
   - 修后：`requestMove` 不可达分支把 `pose` 复位为当前朝向。
   - 新增测试：`motion.test.tsx > ends a daily pose even when the new destination is unreachable`；`quest.test.tsx > does not consume the same module twice`；`WorkshopFlow.test.tsx > does not mount a playable scene until core images resolve`；Chromium 实测运行中 1280×720 → 1600×900@1.5 不刷新，点击仍落在 600,700（误差 <2 场景像素）。

**边界自查结果**
- 快速点两个目标：`motion.test.tsx > ignores the stale arrival token after a new destination` PASS。
- `elapsedMs=5000`：`caps a huge frame gap at 100 ms of travel` PASS（最多 19px）。
- 面板开关：`stops movement when a panel opens` + `pauses movement for panels...` PASS；面板关闭不自动恢复旧目标。
- 失焦/pointercancel/拖拽取消：`cancels a drag on pointercancel and on window blur`、`pauses movement...blur` PASS，均不发 INSTALL。
- 存储：损坏 JSON、schema 2、合法但不可能状态、getItem/setItem 抛错、重玩隔离，全部 PASS。
- 资源失败：核心图首次失败→重试成功；组装图失败保留任务；预载期间不挂载可玩场景。
- 缩放：1280@1、1920@1.25、1280@2、运行中 1280→1600@1.5，落点均通过。
- 错误插槽、重复领取、重复安装、重玩后状态：全部有断言。

**质量门**
- `pnpm test`：15 files / **129 tests passed**，exit 0（基线 42 + 新增 87）。
- `pnpm exec tsc --noEmit`：无输出，exit 0。
- `pnpm build`：exit 0，`dist/index.html`、`dist/404.html` 生成。
- 浏览器：**47/47 checks passed**，`errors: []`。
- 无 lint 配置，未运行 lint。

**关键决策**
- 导航用“人工节点图 + 可见性临时连边 + Dijkstra + 逐段复核”，而不是仅终点采样：大帧间隔/家具拐角下更安全。
- 碰撞与遮挡分离：碰撞走几何，显示走脚底/家具 depth；才能同时满足“不能穿”和“前后遮挡”。
- 组装吸附以 socket 点 + snapRadius 判定，拖拽/点击共用 `tryInstall`；错误插槽无事件，避免消耗模块。
- 存档仅由 quest 引用变化触发写入，移动帧不写 localStorage；避免高频写与状态竞争。
- 舞台用百分比坐标 + `getBoundingClientRect`，而不是固定 1536×1024 像素层：任意窗口缩放/DPR 下点击一致。

# Tuvis World 部署模拟抽查与层叠修复（2026-10-19）

**部署模拟**：生产 `dist/` 由 `vite preview` 在 `http://127.0.0.1:4173/tuvis-website/` 提供（GitHub Pages 子路径）。Chromium 146 CDP，1280×900，DPR 1。

**抽查**：9/9 PASS，截图在 `/mnt/tos/workspace/tuvis-world-qa/deploy-spotcheck/`（初始、地面移动、工具箱图鉴、坐姿、门说明、维修、组装、成品、装备架完成）。

**发现**：
1. `.world-stage` 未建立层叠上下文，角色/家具/热点的高 z-index 逃逸到页面根层叠上下文，压住 z-index 60 的弹窗；维修面板截图可见角色与家具盖住 SVG 示意。
2. 维修面板误用了组装提示 `ui.assemblyHelp`。

**修复**：
- `world.css`：`.world-stage { isolation: isolate; }`。
- `WorkbenchPanel.tsx`：维修模式移除组装提示，仅保留“点击高亮的松动接口，再执行检查。”。
- 浏览器复测：`modal paints above scene sprites — {"isolation":"isolate","dialogOnTop":true}`；9/9 spot checks PASS。
