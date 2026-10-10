# Tuvis 官网 P8 计划（演示高保真精修 · 单主题 · 演示引擎 v2 · 真应用还原）

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 基于 P7 成品（main @ 4d61fa8，17 测试全绿，工作区干净）落地演示高保真精修五条主线：① 站点收敛为单主题亮色（移除 ThemeToggle/theme.ts 全链路），Hero 弃用抠图立绘改用完整版白底海报装进「浏览器窗口框」；② 首页重排为 Hero → 三胡萝卜状态区 → 你会这样用它 → 演示环节板块（四仪表卡 + 主看板静态展示窗 + 打开完整演示链接）→ 开源区 → 下载 CTA，取消内嵌 D1 实时剧本的 HomeBoard；③ 状态灯语义全站对齐真应用（红=待批准·呼吸闪烁 / 黄=运行中 / 绿=已完成）；④ 演示引擎 v2：B 站式分段进度条（段内嵌简介 + hover 详细说明 + 点击段 seek 暂停 + 播放/暂停按钮 + 播完回绕）、默认不自动演示、每演示区固定高度内部滚动、演示窗用真应用白系配色（`--app-*` 令牌组与站点暖纸分离）；⑤ 四场景按真应用事实包还原：D1 真看板（状态摘要行 + SessionGrid + 真卡结构无批准按钮 + 右侧可堆叠多窗）、Claude Code TUI 终端窗（按用户截图 1:1 还原 + 拖动横滚 + 右键菜单）、D2 手机 bezel + TUI 联动、D3 窗壳对齐、D4 宠物切换（贝贝 ↔ Starry Dew）+ 账本窗口按真窗口还原（吸顶范围条 + 概要 7 指标 + SVG 趋势卡 + 工作小结 + 三维分布）。

**Architecture:** 不改技术栈与路由。站点层收敛单主题（`.dark` 变量块删除，`@custom-variant dark` 保留供既有 `dark:` 工具类编译——html 永不加 dark 类，属无害死代码）。演示层引入两套互不污染的配色作用域：站点暖纸令牌（`--surface/--card/--ink…`）照旧承载页面 chrome；新增 `--app-*` 真应用令牌组仅在 demo 窗壳内使用。播放器重写为分段时间轴模型（`Step { dur, enter, label, detailKey }` + `useScriptPlayer v2`：idle/playing/paed 分相、seek(i)=reset+重放 0..i、rAF→setInterval 50ms 步进、播完回绕初始态），PlayerFrame v2 输出固定高度滚动舞台 + 分段进度条 + 播放/暂停钮 + hover 详细说明浮层。四场景剧本（steps-d1/d2/res/d4）全部迁入 v2 接口并定稿节拍文案。看板/卡片/TUI 终端/手机壳/账本按主仓真应用事实包新建或重写组件。

**Tech Stack:** 不变：pnpm · Vite 6 · React 19 · TypeScript 5.7 · Tailwind CSS v4 · react-router 7 · i18next · zustand 5 · framer-motion 12 · vitest + @testing-library/react（renderHook 可用，零新增包；TUI 拖动横滚/右键菜单纯手写 JS/CSS）

**规格来源（还原唯一权威，已核实文件:行号）：**
- 主仓真应用（`E:\LLMproject\Github\mam-worktree\` 只读）：`home.tsx:94-110`（状态摘要行 Activity/N 会话/AlertCircle 红数）、`SessionGrid.tsx:24`（`grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3`）、`SessionCard.tsx:125-243`（真卡结构与 `p-3 hover:bg-accent/50`、waiting `border-red-500/40`）、`agentBadge.tsx:41-85`（8 工具徽标 tailwind 色板，codex 分 Codex APP/CLI）、`StatusLight.tsx`（waiting=红 + `shadow-[0_0_8px_2px_rgba(239,68,68,0.6)]` + animate-pulse；running=黄 + 光晕 0.5 无动画；idle/finished=绿无光晕）、`index.css:61-74`（`--usage-accent-a #3b82f6 / b #8b5cf6 / track #e5e5e5`、`--tool-claude-bg #d97757` 等）、`usage-dashboard.tsx:172-241`（账本五卡结构）、`range.ts:33`（范围五档 last5h/today/last7d/last30d/custom）、`petRuntime.ts:18-29`（ActivePet 机制）
- 真应用亮色令牌：bg `#ffffff` · fg `#252525` · border `#e5e5e5` · muted-fg `#737373` · primary `#171717` · accent≈`#f5f5f5` · 真窗 1px 边 + 8px 圆角 · 卡片 rounded-xl=14px
- 手机面板：remote-ui `01-看板-定稿.html`（max-width 390px、radius 26px、padding 16px、1px 边）+ `02-详情层-定稿.html`（详情壳 padding 14px、审批主按钮 `#1A1915` 近黑/次按钮白底描边）；demo 额外加手机轮廓 bezel（无刘海无状态栏）
- Claude Code TUI 真实截图（用户提供，已存 `C:\Users\bunny\.zcode\cli\image-cache\sess_03bd681f-1995-4173-889c-4659cdd5351a\image-ab58d988bfb55c7221f42797bd42e83d.png`，1484×711）——拷入本仓 `docs/design/claude-tui-ref.png` 供实现者对照
- Hero 完整版白底海报（用户提供，`…\image-d2125f1f1ef1481df5ff9abda836b4fe.png`，实测 723×1038 竖版，含 Tuvis logo/简介/四特性列表）——拷入 `public/img/hero-poster.png`
- Starry Dew 精灵表 `E:\LLMproject\Github\mam-worktree\docs\pet-gallery\starry-dew\spritesheet.webp`（1536×1872，rows 9，无语音）——拷入 `public/pet/starry-dew.webp`；贝贝 `public/pet/spritesheet.webp`（1536×2288，rows 11，31 条语音）不动

**全局约定:**
- 工作目录：`E:\LLMproject\Github\tuvis-website`（Shell: Git Bash）；基线 main @ 4d61fa8，工作区干净，17 测试全绿
- 红线（不可越）：`brand/`、`mam-worktree/`、`legacy/`、`SPEC.md` 只读（例外仅三笔拷入本仓：hero-poster.png / claude-tui-ref.png / starry-dew.webp）；不新增任何 npm 依赖；`DownloadCta.goToInstaller` 逻辑一行不动；全站零追踪
- 收尾四件套：每个任务末尾 `pnpm exec tsc --noEmit` + `pnpm test` + `pnpm build` 全绿 → **commit / 勾选本计划 checkbox / `docs/superpowers/plans/progress.md` 追加报告（变更文件/测试结果/commit hash/与计划偏差）由控制方收口执行**，实现子代理跑到三条命令全绿 + 浏览器核对即止
- i18n：本计划新增 50 个 key（见增量总表）+ 10 处既有 key 改值（见改值表），**zh.json 与 en.json 必须同步**（parity 测试强制）；TUI 终端/Codex 任务窗内的模拟代码与任务内容、账本 mono 数据值**硬编码英文**（真实感优先），窗标题/按钮/标签/详细说明一律走 i18n
- 单主题收敛说明：`src/index.css` 删除全部 `.dark { … }` 变量块（含 stage-dot/edge 提亮覆盖）；既有 `dark:` 前缀工具类（ToolIcon 日夜双形态、NotificationCard 图标对等处）**不逐一清扫**——html 永远不会获得 `dark` 类，它们是不可达的死代码且无害；`@custom-variant dark` 声明保留（否则这些类编译报错）。后续任务新写代码禁止再引入 `dark:`
- P6（部署）仍不在范围

**i18n 增量总表（50 key，zh / en）：**

| key | zh | en | 落点任务 |
|---|---|---|---|
| `demo.play` | 播放 | Play | Task 23 |
| `demo.pause` | 暂停 | Pause | Task 23 |
| `demo.progress` | 演示进度 | Demo progress | Task 23 |
| `demo.detail.d1s1` | 看板即全局：每张卡一盏状态灯——红=待批准（呼吸闪烁）、黄=运行中、绿=已完成；摘要行实时汇总会话数与等待数。 | The board is the overview: one light per card — red = awaiting approval (breathing), yellow = running, green = done; the summary row totals sessions and waits live. | Task 23 |
| `demo.detail.d1s2` | 等待会触发系统级桌面通知，Claude 的批准请求不会落在终端里没人看见。 | Waiting triggers a system-level desktop notification, so Claude's approval request never sits unseen in a terminal. | Task 23 |
| `demo.detail.d1s3` | 点通知直达对应窗口：Claude 打开 TUI 终端窗，Codex 打开任务窗；看板卡本身也可点击开窗。 | Clicking the notification focuses the right window: Claude opens its TUI terminal, Codex its task app; board cards open windows too. | Task 23 |
| `demo.detail.d1s4` | 多 Agent 并发时互不干扰——谁在等、谁在跑，扫一眼灯色即知。 | With multiple agents in parallel there's no cross-talk — one glance at the lights tells you who waits and who runs. | Task 23 |
| `demo.detail.d1s5` | 筛选 chips 按工具过滤；右侧窗口红绿灯可逐个关闭，卡片上的 X 可暂时收起会话。 | Filter chips narrow by tool; traffic lights close the stacked windows one by one, and a card's X dismisses it for now. | Task 23 |
| `demo.detail.d2s1` | Claude 停在 git commit 的权限确认步，终端挂起；同一秒手机远程端已看到「等待批准」。 | Claude halts on the git commit permission step and the terminal suspends; the same second, your phone shows "awaiting approval". | Task 23 |
| `demo.detail.d2s2` | 远程通道秒级推送，锁屏横幅也看得见——人不在电脑前的第一现场。 | The remote channel pushes in seconds — the banner shows even on the lock screen. Front row to "away from the desk". | Task 23 |
| `demo.detail.d2s3` | 详情层给出计划全文与涉及命令，信息量与桌面终端完全一致，批得有依据。 | The detail layer shows the full plan and the exact command — identical to the desktop terminal, so you approve with context. | Task 23 |
| `demo.detail.d2s4` | 「允许」一点即放行：终端恢复输出，会话灯红转黄，全程没碰电脑。 | One tap on Allow releases it: the terminal resumes and the light goes red→yellow — the computer was never touched. | Task 23 |
| `demo.detail.d2s5` | 任务收尾灯转绿，用量自动入账——回到电脑前，账本已经记好这一笔。 | On finish the light turns green and usage is booked — by the time you're back at the desk, the ledger already has the entry. | Task 23 |
| `demo.detail.d3s1` | Skill 与 MCP 不再散落各家目录：统一收进本地主仓库，一处修改、处处生效。 | Skills and MCP configs stop scattering across tool folders: one local repository — change once, apply everywhere. | Task 23 |
| `demo.detail.d3s2` | 勾选矩阵决定每个工具真正加载什么：不勾=不注入=上下文干净，技能永不丢失。 | The matrix decides what each tool actually loads: unchecked = not injected = clean context, and skills are never lost. | Task 23 |
| `demo.detail.d3s3` | 预设组把「一类任务一套装备」固化：换任务点一下，八个工具同时换装。 | Preset groups freeze "one task, one loadout": one click re-equips all eight tools at once. | Task 23 |
| `demo.detail.d4s1` | 桌宠按精灵帧动画呈现待机/奔跑/等待；贝贝带 31 条语音，Starry Dew 静音上场，两枚头像 chip 随时切换。 | The pet renders idle/run/wait from sprite frames; Beibei ships 31 voice clips, Starry Dew plays silent — switch anytime via the avatar chips. | Task 23 |
| `demo.detail.d4s2` | 审批请求到达时切等待动作并弹通知；批准后跳一下庆祝，再回到巡逻。 | On an approval request it switches to the waiting pose and pops a notification; once approved, a celebratory hop, then back to patrol. | Task 23 |
| `demo.detail.d4s3` | 任务收尾即记账：下方账本窗按工具/项目/供应商三维更新花销与缓存命中率。 | Finished tasks are booked instantly: the ledger window below updates spend and cache hit-rate by tool, project and supplier. | Task 23 |
| `demo.board.sessions` | {{count}} 个会话 | {{count}} sessions | Task 24 |
| `demo.board.waiting` | {{count}} 个待批准 | {{count}} awaiting approval | Task 24 |
| `demo.card.open` | 在电脑上打开 | Open on desktop | Task 24 |
| `pet.bell` | 贝贝 | Foxbell | Task 27 |
| `pet.starry` | Starry Dew | Starry Dew | Task 27 |
| `usage.tab.board` | 看板 | Board | Task 27 |
| `usage.range.last5h` | 近 5 小时 | Last 5 hours | Task 27 |
| `usage.range.today` | 今天 | Today | Task 27 |
| `usage.range.last7d` | 近 7 天 | Last 7 days | Task 27 |
| `usage.range.last30d` | 近 30 天 | Last 30 days | Task 27 |
| `usage.range.custom` | 自定义 | Custom | Task 27 |
| `usage.metric.input` | 用户输入 | User input | Task 27 |
| `usage.metric.output` | 模型产出 | Model output | Task 27 |
| `usage.metric.reqInput` | 请求输入 | Request input | Task 27 |
| `usage.metric.cacheHit` | 缓存命中 | Cache hits | Task 27 |
| `usage.metric.hitRate` | 命中率 | Hit rate | Task 27 |
| `usage.metric.requests` | 请求次数 | Requests | Task 27 |
| `usage.metric.asOf` | 统计截至 | As of | Task 27 |
| `usage.note` | 口径：token 折算 USD · 演示数据 | Basis: tokens → USD · demo data | Task 27 |
| `usage.work` | 工作小结 | Work summary | Task 27 |
| `usage.ws.agents` | 子代理 | Subagents | Task 27 |
| `usage.ws.sessions` | 会话数 | Sessions | Task 27 |
| `usage.ws.turns` | Turn（按工具） | Turns (by tool) | Task 27 |
| `usage.ws.errors` | 报错（4 类） | Errors (4 kinds) | Task 27 |
| `usage.ws.longest` | 最长 turn | Longest turn | Task 27 |
| `usage.ws.calls` | 工具调用 | Tool calls | Task 27 |
| `usage.dist` | 分布 | Breakdown | Task 27 |
| `usage.share` | 占比 | Share | Task 27 |
| `usage.dim.tool` | 工具 | Tool | Task 27 |
| `usage.dim.project` | 项目 | Project | Task 27 |
| `usage.dim.supplier` | 供应商 · 模型 | Supplier · Model | Task 27 |

**i18n 改值表（既有 key 换文案，语义对齐「红=待批准 / 黄=运行中 / 绿=已完成」，不新增 key）：**

| key | zh 旧→新 | en 旧→新 | 落点 |
|---|---|---|---|
| `states.green` | 运行中——任务正常推进 → **已完成——任务顺利收尾** | Running — making progress → **Done — task finished cleanly** | Task 22 |
| `states.yellow` | 等待批准——需要你拍板 → **运行中——任务正常推进** | Waiting approval — needs your call → **Running — making progress** | Task 22 |
| `states.red` | 已中断——值得过去看一眼 → **待批准——呼吸闪烁，喊你来拍板** | Interrupted — worth a look → **Awaiting approval — breathing glow calls you over** | Task 22 |
| `badge.waiting` | 等待批准 → **待批准** | Awaiting approval → **Awaiting approval**（微调，保持短徽标） | Task 22 |
| `badge.idle` | 空闲 → **已完成** | Idle → **Done** | Task 22 |
| `features.board.desc` | …运行、等待、中断… → …运行、待批准、已完成… | …running, waiting, interrupted… → …running, awaiting approval, done… | Task 22 |
| `features.pet.desc` | …账本按供应商和模型记账，支持导出分享图 → …贝贝与 Starry Dew 盯状态、催审批，账本按工具/项目/供应商三维记账 | …ledger tracks spend by supplier and model with shareable exports → …Beibei and Starry Dew watch states and nudge approvals; the ledger tracks spend by tool, project and supplier | Task 27 |
| `pet.call` | 唤出贝贝 → **唤出桌宠** | Call Foxbell → **Call the pet** | Task 27 |
| `demo.desc` | 下面的一切都是可交互的模拟——点一点，感受兔维斯的操作方式。 → 点「播放」看剧本走一遍，或直接上手点一点——以下是可交互的模拟。 | Everything below is a clickable simulation… → Press Play to watch the script, or click around — it's all an interactive simulation. | Task 23 |
| `demo.caption.running` | 批准！卡片转绿，任务继续 → **已批准，继续运行** | Approved! Card turns green… → **Approved — resuming** | Task 25 |

**死 key 处置（保留 json 不删，避免 churn；parity 只查键集合与空值）：** `demo.replay`、`demo.takeover`（v2 进度条取代重播按钮/接管提示）、`pet.voice`（P7 已死）、`pet.share`、`usage.bySupplier`、`usage.byModel`（账本 v2 改三维 key）；`demo.caption.waiting/notify/done` 视引用情况自然死亡。新增死 key 不允许（新代码引用的 key 必须真实存在）。

**文件总览：**

新增（10 个源文件 + 3 个拷贝资产）：
```
src/components/BrowserFrame.tsx             # T22 Hero 浏览器窗口框
src/components/Icons.tsx                    # T23 手绘线性 SVG 图标（Play/Pause/Activity/AlertCircle/Cpu/Clock/Bot/ExternalLink/ChevronRight/Lock）
src/demo/ClaudeTui.tsx                      # T23 Claude Code TUI 终端（截图还原 + 拖动横滚 + 右键菜单）
src/demo/steps-d4.ts                        # T23 D4 剧本（3 段）
src/demo/AppBoard.tsx                       # T24 真应用看板窗（摘要行 + chips + SessionGrid）
src/home/BoardShowcase.tsx                  # T24 首页主看板静态展示窗（复用 AppBoard）
src/i18n/{zh,en}.json 增量                  # 50 key（见上表）
public/img/hero-poster.png                  # T22 拷入（用户提供海报）
public/pet/starry-dew.webp                  # T27 拷入（mam-worktree 只读拷出）
docs/design/claude-tui-ref.png              # T23 拷入（用户截图，实现者对照）
```

修改（约 25 个既有文件）：
```
src/index.css                    # T22 删 .dark 块；T23 加 --app-* 令牌组
index.html                       # T22 theme-color 双 media → 单值 #F8F3E9
src/main.tsx                     # T22 移除 applyTheme/getTheme
src/components/layout/TopBar.tsx # T22 移除 ThemeToggle
src/home/Hero.tsx                # T22 BrowserFrame + hero-poster
src/home/Home.tsx                # T22 顺序重排
src/home/FeaturesSection.tsx     # T22 扩为演示环节板块；T24 挂 BoardShowcase
src/demo/{player.ts,PlayerFrame.tsx,types.ts,store.ts,seed.ts}   # T23 引擎 v2
src/demo/steps-{d1,d2,res}.ts    # T23 迁 v2 接口 + 节拍定稿
src/demo/{WindowFrame,NotificationCard,ToolChip}.tsx  # T23 窗壳族 app 化
src/demo/scenes/{D1Scene,RemoteScene,ResourcesScene,PetUsageScene}.tsx  # T23 接线 / T24-27 重建
src/demo/petAnimations.ts        # T27 多宠物（rows 9|11）
src/demo/{ledgerData.ts,LedgerSection.tsx}  # T27 真窗还原
src/pages/DemoPage.tsx           # T27 视挂载微调
src/{tokens.test.ts}             # T22 单主题化；T23 加 app 断言
src/demo/player.test.ts          # T23 按 seek/pause 重写
src/demo/ledgerData.test.ts      # T27 扩三维不变式
src/i18n/{zh,en}.json            # 各任务分批 +50 key + 10 改值
docs/superpowers/plans/progress.md  # 每任务控制方追加
```

删除（6 个文件）：
```
src/theme.ts  src/theme.test.ts  src/components/ThemeToggle.tsx        # T22
src/home/HomeBoard.tsx  src/demo/scenes/BoardScene.tsx                # T22 / T24
src/demo/SessionCard.tsx                                                # T25（RemoteScene 改迷你行后）
```

---

## 新设计令牌：真应用白系 `--app-*`（Task 23 落地，仅 demo 窗壳作用域）

来源：真应用亮色令牌 + usage 图表色（主仓 index.css:61-74）。与站点暖纸令牌（`--surface` 系）**互不引用**：demo 窗壳内一律 `bg-app-bg/border-app-line/text-app-ink`，窗壳外（页面 chrome、进度条、板块标题）一律站点令牌。

| 令牌 | 值 | 语义 |
|---|---|---|
| `--app-bg` | `#ffffff` | 真应用窗底 |
| `--app-card` | `#ffffff` | 卡底（与窗同白，靠 1px 边分层） |
| `--app-line` | `#e5e5e5` | 窗/卡边框、分隔线 |
| `--app-ink` | `#252525` | 真应用正文 |
| `--app-mut` | `#737373` | 真应用次文字 |
| `--app-btnp` / `--app-btnpt` | `#171717` / `#ffffff` | 主按钮近黑 / 反白字（chip 选中同源） |
| `--app-accent` | `#f5f5f5` | hover 底（`hover:bg-app-accent/50`） |
| `--app-track` | `#e5e5e5` | 占比条轨道 |
| `--app-chart-a` / `--app-chart-b` | `#3b82f6` / `#8b5cf6` | 趋势线 / 面积渐变末色 |

`@theme inline` 注册为 `--color-app-*`，工具类即 `bg-app-bg`、`text-app-mut` 等。真窗规格：**1px 边 + 8px 圆角（`rounded-lg`）**（P7 的 14px 窗壳圆角被真应用规格覆盖，仅影响 demo 窗）；卡内元素 14px（`rounded-xl`）照旧。工具徽标不走令牌，直接 tailwind 色板（见 Task 24）。

**关键设计权衡（B 系列，评审时对照）：**
- **B1 单主题硬收敛**：html 永不加 `dark` 类 → 所有 `dark:` 前缀类不可达；比逐类清扫便宜且零风险（编译产物多几条死规则）。`@custom-variant dark` 必须保留，否则现存类编译失败。
- **B2 分段进度条替代字幕行**：分段=剧本结构可视化且可寻址（点击跳段）；代价是 Step 接口重写、四场景剧本一次性重写——但剧本本就要按新交互重排，成本合并。
- **B3 默认不自动播放**：尊重注意力 + 减少prefers-reduced-motion 冲突（呼吸灯已加 `motion-reduce:animate-none`）；代价是演示曝光率下降，用全宽常驻播放钮 + 分段条自身的「简介文字」弥补（不播放也能读懂剧本）。
- **B4 seek 语义 = reset + 重放 enter(0..i)**：每步 enter 必须幂等（对 store set 绝对值，不做增量）；比差量回滚确定性强，n≤5 段无性能问题。
- **B5 固定高度 + 内部滚动**：`h-[420px] md:h-[500px]`（本计划定值），页面布局不因演示状态伸缩；代价是小屏内容需滚动，T28 验收加入 375px 检查项。首页展示窗同规格。
- **B6 `--app-*` 独立令牌组**：真应用白系与站点暖纸是两套视觉语言，混用即失真；代价是令牌翻倍，但作用域限定 demo 窗壳（grep 复核：`app-` 类不出现在 demo 窗壳外）。
- **B7 TUI 拖动横滚/右键菜纯洁手写**：零依赖红线下 ~60 行 JS（pointer capture + scrollLeft / contextmenu + 浮层）；不写单测，进 T28 手工矩阵。
- **B8 账本静态三维**：三维切换是真实卖点且数据量小；不变式测试守护三维度合计=总额。
- **B9 Hero 整版海报**：白底海报在浏览器框内自洽，免除抠图维护；代价是 PNG 体积（首屏 LCP 压力），记录进 T28 已知项，压缩归二期池 E7。
- **B10 宠物切换在 D4 场景内**：demo 粒度控制、无持久化（刷新回贝贝）；Starry Dew 无语音=触发时静音（无独立语音按钮可禁用，P7 已移除该按钮）。

---

## P8-A · 站点级（单主题 + Hero 海报 + 首页重排 + 状态灯语义）

### Task 22: 单主题亮色收敛 + Hero 浏览器框海报 + 首页重排 + 状态灯语义文案

**Files:**
- Delete: `src/theme.ts` `src/theme.test.ts` `src/components/ThemeToggle.tsx` `src/home/HomeBoard.tsx`
- Create: `src/components/BrowserFrame.tsx` `public/img/hero-poster.png`（拷贝）
- Modify: `index.html` `src/main.tsx` `src/components/layout/TopBar.tsx` `src/home/Hero.tsx` `src/home/Home.tsx` `src/home/FeaturesSection.tsx` `src/index.css` `src/tokens.test.ts` `src/i18n/{zh,en}.json`（改值 6 处：states.*×3 / badge.waiting / badge.idle / features.board.desc）

- [x] **Step 22.1: 素材拷贝 + 单主题移除（机械删除链）**

```bash
mkdir -p public/img
cp "C:/Users/bunny/.zcode/cli/image-cache/sess_03bd681f-1995-4173-889c-4659cdd5351a/image-d2125f1f1ef1481df5ff9abda836b4fe.png" public/img/hero-poster.png
git rm src/theme.ts src/theme.test.ts src/components/ThemeToggle.tsx src/home/HomeBoard.tsx
```

随后逐文件：
- `src/main.tsx`：删除 `import { applyTheme, getTheme } from "@/theme"` 与 `applyTheme(getTheme())` 行（404 兜底逻辑不动）
- `src/components/layout/TopBar.tsx`：删除 ThemeToggle import 与 `<ThemeToggle />`（Footer 经核实无引用，无需改）
- `index.html`：两条 theme-color media 合并为单条 `<meta name="theme-color" content="#F8F3E9" />`
- `src/index.css`：删除两个 `.dark { … }` 变量块（主令牌块 + edge/stage-dot 覆盖块）；`@custom-variant dark` 声明保留；其余不动
- `src/tokens.test.ts`：删除 `DARK` 数组及其断言；新增两条：`expect(css).not.toContain("--surface: #271d0f")`、`expect(css).not.toContain(".dark {")`

> 说明（决策 1 落地口径）：`dark:` 工具类（ToolIcon 双形态、NotificationCard 图标对）不清扫——html 永不加 dark 类，属不可达死代码；新代码禁止再引入 `dark:`。`public/img/hero-cutout.png` 与 `state-*.png` 成为无引用资产，保留 public/ 不删（P7 先例）；`public/og.png` 与 `scripts/hero-recut.py` 不动（og 构图仍是有效品牌物料）。

- [x] **Step 22.2: 写 src/components/BrowserFrame.tsx（浏览器窗口框，站点令牌）**

```tsx
import type { ReactNode } from "react";

/** 浏览器窗口拟物：顶部地址栏条 + 内容区（非 macOS 红绿灯框）——站点令牌承载 chrome。 */
export function BrowserFrame({ url = "tuvis.local", children, className = "" }: {
  url?: string; children: ReactNode; className?: string;
}) {
  return (
    <div className={`overflow-hidden rounded-[14px] border-[1.5px] border-line bg-card shadow-pop ${className}`}>
      <div className="flex h-10 items-center gap-3 border-b border-line/60 bg-surface/70 px-3.5 backdrop-blur">
        <span className="flex gap-1.5" aria-hidden="true">
          <span className="h-[9px] w-[9px] rounded-full bg-line" />
          <span className="h-[9px] w-[9px] rounded-full bg-line" />
        </span>
        <div className="mx-auto flex h-6 max-w-[70%] flex-1 items-center justify-center gap-1.5 rounded-full border border-line bg-card px-3">
          <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2"
            className="shrink-0 text-inkdim" aria-hidden="true">
            <rect x="4" y="10" width="16" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" />
          </svg>
          <span className="truncate font-mono text-[10px] text-inkdim">{url}</span>
        </div>
        <span className="w-[26px]" aria-hidden="true" />
      </div>
      <div className="bg-white">{children}</div>
    </div>
  );
}
```

> 内容区 `bg-white`：海报为白底，纯白内容区让海报「就是网页内容」自然融入（B9）。左侧两颗中性圆点是浏览器「返回/前进」示意，刻意不用红绿灯三色（决策 2）。

- [x] **Step 22.3: 改造 Hero.tsx（抠图 → 海报浏览器框）**

右列整块替换为：

```tsx
<BrowserFrame className="mx-auto w-full max-w-[420px]">
  <img src="img/hero-poster.png" alt={t("hero.title")} width={723} height={1038}
    className="mx-auto w-full max-w-[380px]" loading="eager" decoding="async" />
</BrowserFrame>
```

`hero-cutout.png` 引用即消失。`width/height` 属性防 CLS（实测 723×1038）。文案区（badge/title/subtitle/desc/CTA）不动。

- [x] **Step 22.4: 首页重排（Home.tsx + FeaturesSection 扩为演示环节板块）**

`src/home/Home.tsx` 新顺序（删 HomeBoard import）：

```tsx
<Hero />
<StatesSection />
<StoriesSection />
<FeaturesSection />
<OpenSource />
<DownloadCta />
```

`src/home/FeaturesSection.tsx`：保留 `id="features"`（TopBar 锚点依赖）与 4 卡（链接 `demo#d1…#d4` 精确锚已在位，不动），在卡网格之后追加板块尾部公共链接：

```tsx
<p className="mt-8 text-center">
  <Link to="demo" className="text-sm font-semibold text-hud hover:underline">{t("demo.open")} →</Link>
</p>
```

主看板静态展示窗（BoardShowcase）依赖 T24 的 AppBoard 组件，本任务不挂载，T24 补齐（计划内两段式，避免用旧 BoardScene 做一次性过渡）。

- [x] **Step 22.5: 状态灯语义改值 + StatesSection 核对**

按「i18n 改值表」更新 6 处（states.green/yellow/red、badge.waiting/idle、features.board.desc）。`StatesSection.tsx` 组件本身**零改动**：STATES 映射 green→「已完成」、yellow→「运行中」、red→「待批准」由文案值驱动，胡萝卜灯冻结色不变（红萝卜=待批准、黄萝卜=运行中、绿萝卜=已完成）。Demo 区文案随 T23-25 各自任务同步（badge.* 本任务已改，场景引用自动生效）。

- [x] **Step 22.6: 验证（控制方收口 commit/checkbox/progress）**

```bash
pnpm exec tsc --noEmit && pnpm test   # Expected: 17 - 3(theme) = 14 passed
pnpm build
pnpm dev
# 浏览器核对：右上无主题切换钮；强制 prefers-color-scheme: dark 刷新仍为亮色（无闪黑）；
# Hero 右列为浏览器框海报（地址栏 tuvis.local、海报白底融入）；首页顺序 Hero→状态区→你会这样用它→四仪表卡(+打开完整演示链接)→开源→下载；
# 状态区三卡文案=已完成/运行中/待批准；demo#d1..d4 四链接可达且滚动到位；/demo /docs /changelog 正常
```

**验收标准：** 全仓 grep `ThemeToggle|applyTheme|getTheme|tuvis-theme` 零命中；`grep -c "\.dark {" src/index.css` 为 0；tokens.test 单主题断言绿；14 测试全绿；上列浏览器项全过；zh/en 改值同步（parity 绿，101 key 不变）。

---

## P8-B · 演示引擎 v2 + TUI 终端组件

### Task 23: 播放器 v2（分段进度条/seek/pause/默认静止/固定高度）+ `--app-*` 令牌 + 窗壳族 app 化 + ClaudeTui + 四场景接线 + 剧本定稿

**Files:**
- Create: `src/components/Icons.tsx` `src/demo/ClaudeTui.tsx` `src/demo/steps-d4.ts` `docs/design/claude-tui-ref.png`（拷贝）
- Modify: `src/index.css` `src/tokens.test.ts` `src/demo/types.ts` `src/demo/player.ts` `src/demo/PlayerFrame.tsx` `src/demo/player.test.ts` `src/demo/store.ts` `src/demo/seed.ts` `src/demo/steps-d1.ts` `src/demo/steps-d2.ts` `src/demo/steps-res.ts` `src/demo/WindowFrame.tsx` `src/demo/NotificationCard.tsx` `src/demo/ToolChip.tsx` `src/demo/scenes/{D1Scene,RemoteScene,ResourcesScene,PetUsageScene}.tsx`（仅接线，视觉重建归 T24-27）`src/i18n/{zh,en}.json`（+19 key：demo.play/pause/progress + demo.detail.*×16；改值 demo.desc）

- [x] **Step 23.1: index.css 追加 app 令牌组 + tokens.test 加断言**

```css
/* 真应用白系令牌（P8 决策 7）：仅在 demo 窗壳内使用，与站点暖纸互不引用 */
:root {
  --app-bg: #ffffff;
  --app-card: #ffffff;
  --app-line: #e5e5e5;
  --app-ink: #252525;
  --app-mut: #737373;
  --app-btnp: #171717;
  --app-accent: #f5f5f5;
  --app-track: #e5e5e5;
  --app-chart-a: #3b82f6;
  --app-chart-b: #8b5cf6;
}
```

`@theme inline` 追加 `--color-app-bg: var(--app-bg)` 等 11 条映射（btnpt 直接 `#ffffff`）。`tokens.test.ts` 新增用例：上表 10 个变量串逐一 `toContain`。

- [x] **Step 23.2: types.ts v2 + store/seed 扩展**

`types.ts`：

```ts
export type SessionState = "running" | "waiting" | "idle";
export interface Session {
  id: string;
  tool: string;        // tools.ts 的 key
  project: string;
  slug: string;        // 灰色 mono 标题尾（真卡顶行）
  branch: string;
  messages: [string, string];   // 中部两行消息预览（真卡）
  minutes: number;     // 时长
  cpu: number;         // CPU%
  agents: number;      // 子代理数
  state: SessionState;
}
export interface Step {
  dur: number;                    // 段时长 ms；进度条段宽 = dur/总时长（归一化）
  enter?: () => void;             // 段开始副作用——必须幂等（seek 会 reset+重放 0..i）
  label: { zh: string; en: string };   // 段内嵌简介（原 caption 文案迁入）
  detailKey: string;              // hover 详细说明 i18n key
}
```

`store.ts` 追加两个 slice（其余不动）：

```ts
  dismissed: string[];                       // 被卡片 X 收起的会话 id
  setDismissed: (ids: string[]) => void;
  petRun: { card: null | "approval" | "done"; notify: boolean };   // D4 剧本/按钮共驱
  setPetRun: (patch: Partial<DemoState["petRun"]>) => void;
```

`seed.ts`：每条会话补 `slug/cpu/agents`，`preview` 改 `messages: [两行]`；**claude 初始态改 `"waiting"`**（D1 静止态即展示红灯呼吸），其余不变。参考值：claude `{ slug: "add-remote-approve", cpu: 12, agents: 3 }`、codex `{ slug: "refactor-nav", cpu: 8, agents: 1 }` 等（mono 数据自由拟，英文）。

- [x] **Step 23.3: 重写 player.ts（v2 核心，完整代码）**

```ts
import { useCallback, useEffect, useState } from "react";
import type { Step } from "./types";

export type Phase = "idle" | "playing" | "paused";
const TICK = 50;

/** 纯函数时间轴：各段起始偏移与总时长（进度条归一化 + 单测） */
export function timeline(steps: Step[]): { offsets: number[]; total: number } {
  const offsets: number[] = [];
  let acc = 0;
  for (const s of steps) { offsets.push(acc); acc += s.dur; }
  return { offsets, total: acc };
}

/** 整体进度 0..1（已完成段偏移 + 段内比例） */
export function overallProgress(steps: Step[], seg: number, frac: number): number {
  const { offsets, total } = timeline(steps);
  if (total === 0 || seg < 0) return 0;
  return Math.min(1, (offsets[seg] + frac * steps[seg].dur) / total);
}

export function useScriptPlayer(steps: Step[], reset?: () => void) {
  const [phase, setPhase] = useState<Phase>("idle");   // 默认不自动演示（决策 5）
  const [seg, setSeg] = useState(-1);
  const [frac, setFrac] = useState(0);

  useEffect(() => {
    if (phase !== "playing" || seg < 0) return;
    const t = window.setInterval(() => setFrac((f) => f + TICK), TICK);
    return () => window.clearInterval(t);
  }, [phase, seg]);

  useEffect(() => {
    if (phase !== "playing" || seg < 0 || frac < steps[seg].dur) return;
    if (seg >= steps.length - 1) {                 // 整条播完 → 回绕初始态
      reset?.();
      setPhase("idle"); setSeg(-1); setFrac(0);
    } else {
      const next = seg + 1;
      steps[next].enter?.();
      setSeg(next); setFrac(0);
    }
  }, [frac, seg, phase, steps, reset]);

  const play = useCallback(() => {
    if (phase === "playing") return;
    if (seg < 0) { reset?.(); steps[0].enter?.(); setSeg(0); setFrac(0); }
    setPhase("playing");
  }, [phase, seg, steps, reset]);

  const pause = useCallback(() => setPhase((p) => (p === "playing" ? "paused" : p)), []);

  /** seek(i)：跳到第 i 段起点并暂停——reset 后重放 enter(0..i)，保证视觉确定（B4） */
  const seek = useCallback((i: number) => {
    reset?.();
    for (let k = 0; k <= i; k++) steps[k].enter?.();
    setSeg(i); setFrac(0); setPhase("paused");
  }, [steps, reset]);

  const stop = useCallback(() => {
    reset?.(); setPhase("idle"); setSeg(-1); setFrac(0);
  }, [reset]);

  return { phase, seg, frac, progress: overallProgress(steps, seg, frac),
    play, pause, seek, stop, toggle: () => (phase === "playing" ? pause() : play()) };
}
```

- [x] **Step 23.4: 重写 PlayerFrame.tsx（固定高度舞台 + 分段进度条 + 播放控制）**

结构规格（完整骨架，样式可微调）：

```tsx
export function PlayerFrame({ steps, children, id, reset }: {
  steps: Step[]; children: ReactNode; id: string; reset?: () => void;
}) {
  const { t, i18n } = useTranslation();
  const p = useScriptPlayer(steps, reset);
  const [hover, setHover] = useState<number | null>(null);
  const { offsets, total } = timeline(steps);
  const lang = i18n.language === "zh" ? "zh" : "en";

  return (
    <div id={id} className="scroll-mt-20">
      {/* 固定高度演示区（决策 6 定值）：内部滚动，页面不因演示伸缩；交互即暂停（接管精神保留） */}
      <div className="relative h-[420px] overflow-y-auto overscroll-contain rounded-[14px] border border-line bg-surface/40"
        onPointerDown={() => p.pause()}>
        {children}
      </div>

      {/* 分段进度条 + 播放/暂停（常驻 chrome，站点令牌） */}
      <div className="mt-3 flex items-center gap-3">
        <button type="button" onClick={() => p.toggle()}
          aria-label={t(p.phase === "playing" ? "demo.pause" : "demo.play")}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-btnp text-btnpt transition hover:opacity-90">
          {p.phase === "playing" ? <PauseIcon /> : <PlayIcon />}
        </button>
        <div className="relative flex min-w-0 flex-1 gap-1" role="group" aria-label={t("demo.progress")}>
          {steps.map((s, i) => {
            const fill = i < p.seg ? 1 : i === p.seg ? Math.min(1, p.frac / s.dur) : 0;
            return (
              <button key={i} type="button" style={{ flexGrow: s.dur }}
                onClick={() => p.seek(i)}
                onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(i)} onBlur={() => setHover(null)}
                aria-current={i === p.seg ? "step" : undefined}
                aria-label={`${i + 1}/${steps.length} ${s.label[lang]}`}
                className={`relative h-8 min-w-0 overflow-hidden rounded-lg border bg-card text-left transition
                  ${i === p.seg ? "border-inkdim" : "border-line"}`}>
                <span aria-hidden="true" className="absolute inset-y-0 left-0 bg-hud/30"
                  style={{ width: `${fill * 100}%` }} />
                <span className="relative z-10 block truncate px-1.5 text-[10px] leading-8 text-inkdim">
                  {s.label[lang]}
                </span>
              </button>
            );
          })}
          {hover != null && (
            <div role="tooltip"
              className="pointer-events-none absolute bottom-full z-20 mb-2 w-64 -translate-x-1/2 rounded-lg border border-line bg-card p-2.5 text-xs leading-relaxed text-ink shadow-pop"
              style={{ left: `${Math.min(88, Math.max(12, ((offsets[hover] + steps[hover].dur / 2) / total) * 100))}%` }}>
              {t(steps[hover].detailKey)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

要点：段宽 `flexGrow: dur`（时长归一化）；填充色 `bg-hud/30` 半透明保证段内文字任何填充度下可读；tooltip 水平夹 12%–88%；键盘 Focus 也触发说明（a11y）；`demo.replay/demo.takeover` 不再引用（死 key）。

- [x] **Step 23.5: Icons.tsx + 拷贝 TUI 参考图 + 写 ClaudeTui.tsx**

```bash
mkdir -p docs/design
cp "C:/Users/bunny/.zcode/cli/image-cache/sess_03bd681f-1995-4173-889c-4659cdd5351a/image-ab58d988bfb55c7221f42797bd42e83d.png" docs/design/claude-tui-ref.png
```

`src/components/Icons.tsx`：手绘线性 SVG（`fill=none stroke=currentColor strokeWidth=2 viewBox="0 0 24 24"`，lucide 风格简化版）：`PlayIcon`（三角形 fill currentColor）、`PauseIcon`（双竖条）、`ActivityIcon`、`AlertCircleIcon`、`CpuIcon`、`ClockIcon`、`BotIcon`、`ExternalLinkIcon`、`ChevronRightIcon`、`LockIcon`。统一 `size` prop 默认 14。不引入图标库（红线）。

`src/demo/ClaudeTui.tsx` 结构规格（视觉 1:1 对照 `docs/design/claude-tui-ref.png`）：

```tsx
export interface TuiLine { text: string; tone?: "cmd" | "ok" | "warn" | "dim" }
/** Claude Code TUI 终端窗（D1 右区 / D2 右侧共用）。窗体近黑、内容硬编码英文（真实感）。 */
export function ClaudeTui({ extraLines = [], waiting = false, className = "", onClose }: {
  extraLines?: TuiLine[]; waiting?: boolean; className?: string; onClose?: () => void;
})
```

- 窗壳：外层 macOS 红绿灯条（沿用 WindowFrame 灯位，供 D1 关窗）+ 主体 `bg-[#0E0D0B]`、圆角、近黑边
- 内容（对照截图逐块还原，宽行不折行靠横滚）：
  1. 橙框欢迎盒：`border border-[#D97757] rounded-md p-3 mb-3` 内含——`✻ Welcome to Claude Code!`（✻ 橙）、斜体灰 `/help for help`、`cwd: ~/projects/tuvis-app`、横向分隔线、`Overrides: API Base URL (https://api…)` 行
  2. `Tips for getting started:` + 编号 1–3 三行（真实文案风格自拟英文）
  3. 黄色 `Note:` 行（`text-[#EAB53D]`）
  4. 灰色 `※ Tip:` 行（`text-[#8B857A]`）
  5. `extraLines`（D1/D2 剧情行：cmd 橙 / ok 绿 / warn 黄 / dim 灰，色值沿用 TerminalWindow 的 TONE）
  6. 底部输入行：`>` 前缀 + 方块光标（blink 动画，`waiting=false` 时才闪）+ 右对齐 `? for shortcuts`（`text-[#8B857A]`）
- **拖动横向滚动**（纯 JS）：容器 `overflow-x-auto cursor-grab select-none`；`onPointerDown` 记录起点并 `setPointerCapture`，`onPointerMove` 中 `el.scrollLeft -= e.movementX`，`onPointerUp/Cancel` 复位；拖动中临时加 `cursor-grabbing`（state 控制）。不 preventDefault 点击（卡片级点击不受影响）
- **右键模拟配置菜单**：`onContextMenu={(e) => { e.preventDefault(); setMenu({ x: e.clientX, y: e.clientY }); }}`；菜单项硬编码英文 `Copy / Paste / Clear / Settings`（`role="menu"` / `menuitem`，点击即关闭=模拟生效）；`fixed` 定位按视口夹取；点击外部（backdrop div）或 Esc 关闭；菜单样式近黑系（`bg-[#1A1A1A] border-[#333] text-[#DDD] rounded-md text-xs py-1`，终端原生观感）

- [x] **Step 23.6: 窗壳族 app 化（WindowFrame/NotificationCard/ToolChip）**

- `WindowFrame.tsx`：容器改 `rounded-lg border border-app-line bg-app-bg shadow-soft`（真窗 1px 边 + 8px 圆角）；标题条 `h-8 border-b border-app-line bg-app-bg px-3`，标题 `text-[11px] font-medium text-app-mut`；红绿灯保留（D1 右区关窗需要；无 onClose 时装饰性 `aria-hidden`）。
- `NotificationCard.tsx`：卡底改 app 令牌（`border-app-line bg-app-bg`、标题 `text-app-ink`、正文 `text-app-mut`）；图标对简化为单 `appicon-dark.png`（白底用深图标；原 `dark:` 对随单主题自然死亡，顺手删除这两行）。
- `ToolChip.tsx`：默认 `rounded-full border border-app-line bg-app-bg px-3 py-1 text-[11.5px] text-app-mut hover:text-app-ink hover:bg-app-accent/50`；选中 `border-app-btnp bg-app-btnp font-semibold text-white`；内嵌 14px ToolIcon 保留（日间形态恒显）。

- [x] **Step 23.7: 四场景剧本定稿（v2 接口）+ i18n +19 key**

steps-d1.ts（5 段，新节拍）：

```ts
import type { Step } from "./types";
import { setStateOf, useDemo } from "./store";

const W = () => useDemo.getState().setWindows;

export const d1Steps: Step[] = [
  { dur: 3000, enter: () => setStateOf("claude", "waiting"),
    label: { zh: "Claude Code 请求批准——红灯呼吸", en: "Claude Code asks for approval — red light breathing" },
    detailKey: "demo.detail.d1s1" },
  { dur: 2800, enter: () => W()({ notify: true }),
    label: { zh: "桌面通知弹出，点一下直达终端", en: "A desktop notification pops — click to jump to the terminal" },
    detailKey: "demo.detail.d1s2" },
  { dur: 3000, enter: () => { W()({ notify: false, claudeTerm: true, codexApp: true }); setStateOf("claude", "running"); },
    label: { zh: "点通知：终端窗与 Codex 任务窗同时打开", en: "Click it: the TUI terminal and Codex task window pop open" },
    detailKey: "demo.detail.d1s3" },
  { dur: 2800, enter: () => setStateOf("codex", "waiting"),
    label: { zh: "Codex 也停下等待——第二盏红灯", en: "Codex waits too — a second red light" },
    detailKey: "demo.detail.d1s4" },
  { dur: 3200, enter: () => setStateOf("codex", "running"),
    label: { zh: "放行继续：试点卡片、筛选器，红绿灯可以关窗", en: "Released — try cards, filters; traffic lights close windows" },
    detailKey: "demo.detail.d1s5" },
];

export const d1Reset = () => useDemo.setState({
  sessions: seedSessions(), filter: null, dismissed: [],
  windows: { notify: false, claudeTerm: false, codexApp: false },
});
```

steps-d2.ts（5 段，节拍保留、文案修色、终段转绿）：

```ts
export const d2Steps: Step[] = [
  { dur: 2600, enter: () => { R()({ banner: false, detail: false, approved: false }); setStateOf("claude", "waiting"); },
    label: { zh: "Claude 停在批准步——终端在等，手机同步收到", en: "Claude halts at approval — the terminal waits, your phone knows" },
    detailKey: "demo.detail.d2s1" },
  { dur: 2400, enter: () => R()({ banner: true }),
    label: { zh: "手机弹出横幅——人不在电脑前也看得到", en: "A banner pops on your phone" },
    detailKey: "demo.detail.d2s2" },
  { dur: 2400, enter: () => R()({ detail: true }),
    label: { zh: "点开横幅：计划全文与「允许」按钮", en: "Open the banner: full plan and the Allow button" },
    detailKey: "demo.detail.d2s3" },
  { dur: 2800, enter: () => { R()({ approved: true, banner: false }); setStateOf("claude", "running"); },
    label: { zh: "手机点「允许」——终端立刻续跑，灯转黄", en: "Allow on the phone — the terminal resumes, light turns amber" },
    detailKey: "demo.detail.d2s4" },
  { dur: 2600, enter: () => setStateOf("claude", "idle"),
    label: { zh: "任务完成灯转绿——用量已写入账本", en: "Done — light turns green, usage logged" },
    detailKey: "demo.detail.d2s5" },
];
export const d2Reset = () => { useDemo.setState({ remote: { banner: false, detail: false, approved: false } }); /* + claude 回 seed */ };
```

steps-res.ts（3 段，节拍与文案保留，补 dur/detailKey）：`3000/3000/3000`，detailKey `demo.detail.d3s1/s2/s3`，无 enter（场景本地态，reset 传 undefined）。

steps-d4.ts（新，3 段）：

```ts
const P = () => useDemo.getState().setPetRun;
export const d4Steps: Step[] = [
  { dur: 3000, enter: () => P()({ card: null, notify: false }),
    label: { zh: "桌宠值班：贝贝巡逻待机，可切换 Starry Dew", en: "Pet on duty: Foxbell patrols — switch to Starry Dew anytime" },
    detailKey: "demo.detail.d4s1" },
  { dur: 3000, enter: () => P()({ card: "approval", notify: true }),
    label: { zh: "审批请求来了——桌宠切等待动作，头顶红卡", en: "An approval lands — waiting pose, red card above" },
    detailKey: "demo.detail.d4s2" },
  { dur: 3000, enter: () => P()({ card: "done", notify: true }),
    label: { zh: "任务完成——跳跃庆祝，用量已记账", en: "Task done — a celebratory hop, usage logged" },
    detailKey: "demo.detail.d4s3" },
];
export const d4Reset = () => useDemo.setState({ petRun: { card: null, notify: false } });
```

i18n：按增量总表加 19 key（demo.play/pause/progress + 16 条 detail）+ demo.desc 改值，zh/en 同步。

- [x] **Step 23.8: 四场景最小接线（不动视觉，只接 v2）**

- `D1Scene.tsx`：`<PlayerFrame steps={d1Steps} id="d1-player" reset={d1Reset}>`；其余本任务不动（T24 重建）
- `RemoteScene.tsx`：`reset={d2Reset}`；旧 SessionCard 照用（新 messages 字段它不读，编译通过；T25 换迷你行）
- `ResourcesScene.tsx`：`reset` 不传；窗体随 WindowFrame app 化自动生效
- `PetUsageScene.tsx`：`steps={d4Steps}` + `reset={d4Reset}`；本地 `statusCard/notify` state 改读 store `petRun`（`useDemo((s) => s.petRun)`），fire() 改为 `setPetRun`；hover/拖拽/语音逻辑不动
- 所有场景删掉对 `demo.takeover/demo.replay` 的依赖（PlayerFrame v2 已无此 UI）

- [x] **Step 23.9: player.test.ts 重写（seek/pause 单测）+ 验证**

```ts
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useScriptPlayer, timeline, overallProgress } from "./player";
import type { Step } from "./types";

const steps: Step[] = [
  { dur: 100, enter: vi.fn(), label: { zh: "a", en: "a" }, detailKey: "x" },
  { dur: 300, enter: vi.fn(), label: { zh: "b", en: "b" }, detailKey: "x" },
  { dur: 200, enter: vi.fn(), label: { zh: "c", en: "c" }, detailKey: "x" },
];

describe("timeline（纯函数）", () => {
  it("偏移与总时长", () => {
    expect(timeline(steps)).toEqual({ offsets: [0, 100, 400], total: 600 });
  });
  it("整体进度边界", () => {
    expect(overallProgress(steps, -1, 0)).toBe(0);
    expect(overallProgress(steps, 1, 0.5)).toBeCloseTo((100 + 150) / 600);
    expect(overallProgress(steps, 2, 1)).toBe(1);
  });
});

describe("useScriptPlayer v2", () => {
  beforeEach(() => { vi.useFakeTimers(); steps.forEach((s) => s.enter!.mockClear()); });
  afterEach(() => vi.useRealTimers());

  it("初始 idle：不触发任何 enter（默认不自动演示）", () => {
    renderHook(() => useScriptPlayer(steps));
    expect(steps[0].enter).not.toHaveBeenCalled();
  });
  it("play 从第 0 段起播并随时间推进段落", () => {
    const { result } = renderHook(() => useScriptPlayer(steps));
    act(() => result.current.play());
    expect(steps[0].enter).toHaveBeenCalledTimes(1);
    act(() => { vi.advanceTimersByTime(150); });     // 越过段 0
    expect(steps[1].enter).toHaveBeenCalledTimes(1);
    expect(result.current.seg).toBe(1);
  });
  it("pause 停住，play 从当前位置续播", () => {
    const { result } = renderHook(() => useScriptPlayer(steps));
    act(() => result.current.play());
    act(() => { vi.advanceTimersByTime(150); });
    act(() => result.current.pause());
    const frac = result.current.frac;
    act(() => { vi.advanceTimersByTime(200); });     // 暂停中不走表
    expect(result.current.frac).toBe(frac);
    act(() => result.current.play());
    act(() => { vi.advanceTimersByTime(50); });
    expect(result.current.seg).toBe(1);
  });
  it("seek(i)：reset+重放 enter(0..i) 并处于 paused", () => {
    const reset = vi.fn();
    const { result } = renderHook(() => useScriptPlayer(steps, reset));
    act(() => result.current.seek(2));
    expect(reset).toHaveBeenCalledTimes(1);
    expect(steps[2].enter).toHaveBeenCalledTimes(1);
    expect(result.current.phase).toBe("paused");
    expect(result.current.seg).toBe(2);
  });
  it("整条播完回绕初始态（reset + idle + 进度归零）", () => {
    const reset = vi.fn();
    const { result } = renderHook(() => useScriptPlayer(steps, reset));
    act(() => result.current.play());
    act(() => { vi.advanceTimersByTime(700); });
    expect(reset).toHaveBeenCalled();
    expect(result.current.phase).toBe("idle");
    expect(result.current.progress).toBe(0);
  });
});
```

（d1 终态断言并入本文件：seek(4) 后 `windows.claudeTerm/codexApp === true`、`notify === false`。）

```bash
pnpm exec tsc --noEmit && pnpm test   # Expected: 14 - 3(旧 player) + 7(v2) = 18 passed
pnpm build && pnpm dev
# 浏览器核对：四场景初始静止（无自动播放）；播放钮起播；分段条推进/已看段填满；hover 出详细说明（zh/en）；
# 点任意段=跳段暂停、续播从该段走；播完自动回到初始态；演示区高度恒定不推挤页面；场景内点击即暂停；
# TUI 对照 docs/design/claude-tui-ref.png：欢迎盒/黄 Note/灰 Tip/底部 > 光标；宽行可拖横滚；右键出菜单、Esc/点外关闭
```

**验收标准：** player v2 六项单测全绿（idle 不自动/推进/pause 续播/seek 重放/回绕/timeline）；四场景在 v2 下功能等价（D1 通知-开窗链路、D2 批准联动、D4 触发链路可走通）；`--app-*` 断言绿；固定高度 420/500 生效；parity 绿（101+19=120 key）。

---

## P8-C · 四场景重构

### Task 24: D1 重构（真看板窗 + 真卡 + 右侧堆叠多窗）+ 首页主看板展示窗

**Files:**
- Create: `src/demo/AppBoard.tsx` `src/home/BoardShowcase.tsx`
- Delete: `src/demo/scenes/BoardScene.tsx`
- Modify: `src/demo/scenes/D1Scene.tsx` `src/home/FeaturesSection.tsx`（挂 BoardShowcase）`src/i18n/{zh,en}.json`（+3 key：demo.board.sessions / demo.board.waiting / demo.card.open）

- [x] **Step 24.1: 写 AppBoard.tsx（真看板窗，D1 与首页共用）**

结构规格（对照主仓 home.tsx:94-110 + SessionGrid.tsx:24，全部 app 令牌）：

```tsx
export function AppBoard({ interactive = true }: { interactive?: boolean }) {
  const { t } = useTranslation();
  const sessions = useDemo((s) => s.sessions);
  const filter = useDemo((s) => s.filter);
  const dismissed = useDemo((s) => s.dismissed);
  const list = Object.values(sessions).filter((s) => !dismissed.includes(s.id) && (!filter || s.tool === filter));
  const waiting = list.filter((s) => s.state === "waiting").length;

  return (
    <WindowFrame title={t("demo.win.board")}>
      {/* 状态摘要行（无 tab） */}
      <div className="flex items-center gap-2 border-b border-app-line px-3 py-2 text-xs text-app-mut">
        <ActivityIcon size={14} />
        <span>{t("demo.board.sessions", { count: list.length })}</span>
        {waiting > 0 && (
          <span className="flex items-center gap-1 text-red-500" title={t("demo.board.waiting", { count: waiting })}>
            <AlertCircleIcon size={14} />{waiting}
          </span>
        )}
      </div>
      {/* 筛选 chips */}
      <div className="flex flex-wrap gap-1.5 px-3 pt-2.5">
        <ToolChip tool={null} active={filter === null} onClick={() => setFilter(null)} />
        {TOOLS.map((tool) => <ToolChip key={tool.key} … />)}
      </div>
      {/* SessionGrid */}
      <div className="grid grid-cols-1 gap-2 p-3 md:grid-cols-2 xl:grid-cols-3">
        {list.map((s) => <SessionCard key={s.id} s={s} onOpen={interactive ? openWindow(s) : undefined} onDismiss={…} />)}
      </div>
    </WindowFrame>
  );
}
```

`openWindow`：claude → `setWindows({ claudeTerm: true })`；codex → `setWindows({ codexApp: true })`；**其余工具卡片 inert**（`cursor-default`、不响应点击——demo 只做两窗内容，避免造六个假窗）。

- [x] **Step 24.2: 重写 SessionCard.tsx（真卡结构，无批准按钮）**

对照 SessionCard.tsx:125-243 逐行还原（app 令牌）：

```tsx
const BADGE_PALETTE: Record<string, string> = {       // agentBadge.tsx:41-85 tailwind 色板
  claude:    "border-orange-500/30 bg-orange-500/15 text-orange-600",
  codex:     "border-purple-500/30 bg-purple-500/15 text-purple-600",
  opencode:  "border-zinc-500/30 bg-zinc-500/15 text-zinc-600",
  openclaw:  "border-gray-500/30 bg-gray-500/15 text-gray-600",
  kimi:      "border-sky-500/30 bg-sky-500/15 text-sky-600",
  workbuddy: "border-emerald-500/30 bg-emerald-500/15 text-emerald-600",
  zcode:     "border-indigo-500/30 bg-indigo-500/15 text-indigo-600",
  dsh:       "border-blue-500/30 bg-blue-500/15 text-blue-600",
};
const DISPLAY_NAME: Record<string, string> = { codex: "Codex APP" };   // 其余用 TOOLS label
```

- 容器：`group cursor-pointer rounded-xl border p-3 text-app-ink transition hover:bg-app-accent/50 ${waiting ? "border-red-500/40" : "border-app-line"} bg-app-card`，`onClick={onOpen}`；无 onOpen 时 `cursor-default`
- 顶行（`flex items-center gap-1.5`）：工具徽标 `rounded border px-1.5 py-0.5 text-[10px] font-semibold ${BADGE_PALETTE[tool]}` + 项目名 `truncate text-sm font-medium` + 标题尾 `truncate font-mono text-[10px] text-app-mut/60`（`s.slug`）+ 分支 `hidden truncate font-mono text-[10px] text-app-mut sm:block`（`s.branch`）+ 右侧 `ml-auto flex items-center gap-1.5`：状态灯 + X
- **状态灯**（StatusLight 还原，`h-2 w-2 rounded-full` + `role="img"` + `aria-label={t(badge key)}`）：
  - waiting：`bg-red-500 shadow-[0_0_8px_2px_rgba(239,68,68,0.6)] animate-pulse motion-reduce:animate-none`
  - running：`bg-yellow-500 shadow-[0_0_8px_2px_rgba(234,179,61,0.5)]`
  - idle：`bg-green-500`
- X 关闭：`h-3 w-3 text-app-mut/50 hover:text-app-ink`（内联 X svg），`stopPropagation` + `onDismiss(s.id)`（store `dismissed` 追加）
- 中部：`line-clamp-2 min-h-[2.5rem] mb-2 text-xs text-app-mut`——两行消息预览（`s.messages.join("\n")`，whitespace-pre-line）
- 底行（`flex items-center gap-3 text-[10px] text-app-mut`）：`Cpu {cpu}%` · `Clock {minutes}m` · `Bot {agents}` · ExternalLink 钮（`aria-label={t("demo.card.open")}`，点击 `stopPropagation` + onOpen）· `ChevronRight`（`opacity-0 transition group-hover:opacity-100`）
- **无批准按钮**（决策 8 明确）

- [x] **Step 24.3: 重建 D1Scene.tsx（左看板窗约 4:3 + 右侧堆叠多窗）**

```tsx
export function D1Scene() {
  return (
    <PlayerFrame steps={d1Steps} id="d1-player" reset={d1Reset}>
      <DesktopStage className="h-full">
        <div className="grid items-start gap-4 p-1 md:grid-cols-[minmax(0,1fr)_320px]">
          <AppBoard />                     {/* 左：桌面看板窗（列宽 ~640px 级 → 约 4:3 观感） */}
          <div className="flex flex-col gap-3">
            <AnimatePresence>{windows.claudeTerm && (
              <motion.div key="term" …spring…>
                <ClaudeTui waiting={claude.state === "waiting"}
                  extraLines={claudeTuiLines(claude.state)} onClose={() => setWindows({ claudeTerm: false })} />
              </motion.div>)}
            </AnimatePresence>
            <AnimatePresence>{windows.codexApp && (
              <motion.div key="app" …spring…>
                <WindowFrame title={t("demo.win.codexApp")} onClose={() => setWindows({ codexApp: false })}>
                  {/* Codex 任务列表：app 令牌重绘既有三行（done ✓ / running… / queued），硬编码英文 */}
                </WindowFrame>
              </motion.div>)}
            </AnimatePresence>
          </div>
        </div>
        <AnimatePresence>{windows.notify && (
          <NotificationCard … onClick={openFromNotify} onClose={…} />)}
        </AnimatePresence>
      </DesktopStage>
    </PlayerFrame>
  );
}
```

联动语义：通知点击 = 关通知 + 开 TUI 窗 + 开 Codex APP 窗 + claude 转黄运行；卡片点击（claude/codex）= 直接开对应窗；红绿灯 = 逐个关窗；`claudeTuiLines(state)` 输出剧情行（waiting→`⏸ Permission needed: pnpm install` warn + 等待 dim；running→`✓ Approved — resuming` ok + `editing src/remote/approve.rs` dim）。删除旧 BoardScene.tsx（已无引用）。

- [x] **Step 24.4: 首页 BoardShowcase.tsx + FeaturesSection 挂载**

```tsx
export function BoardShowcase() {
  return (
    <div className="mt-8">
      <div className="h-[420px] overflow-y-auto overscroll-contain rounded-[14px] border border-line bg-surface/40 md:h-[500px]">
        <DesktopStage className="min-h-full">
          <div className="mx-auto max-w-3xl"><AppBoard interactive={false} /></div>
        </DesktopStage>
      </div>
    </div>
  );
}
```

`interactive={false}`：卡片无 onOpen（hover 反馈保留 `hover:bg-app-accent/50`）、X 不渲染；**chips 仍可点筛选**（共享 store.filter）——满足「静态展示窗 + 内部一定程度可点击」。`FeaturesSection.tsx` 在 4 卡网格后插入 `<BoardShowcase />`，「打开完整演示」链接保持在板块尾部（showcase 之下）。

- [x] **Step 24.5: i18n +3 key + 验证**

```bash
pnpm exec tsc --noEmit && pnpm test && pnpm build
pnpm dev
# 核对：/demo D1 摘要行「N 个会话」+ 红色等待数；5 张真卡（徽标色板/两行预览/底行指标）；
# waiting 卡红边+红灯呼吸；点 claude/codex 卡开右窗、其余卡 inert；X 收起卡片、重播后复位；
# 通知→双窗链路（剧本+手动）；红绿灯逐个关窗；首页展示窗 chips 筛选生效、卡片 hover、窗口高度恒定
```

**验收标准：** 真卡结构与事实包逐项对上（徽标/标题尾/分支/灯/两行预览/底行五件套/无批准按钮）；红灯呼吸+光晕、黄灯光晕、绿灯素点；D1 五段剧本与进度条严格对应；首页展示窗可筛选不推挤布局；parity 绿（123 key）。

---

### Task 25: D2 重构（手机 bezel + 390 面板 + TUI 联动 + 终态绿）

**Files:**
- Delete: `src/demo/SessionCard.tsx`（RemoteScene 换迷你行后无引用）
- Modify: `src/demo/PhoneFrame.tsx` `src/demo/scenes/RemoteScene.tsx` `src/i18n/{zh,en}.json`（改值 1 处：demo.caption.running）

- [x] **Step 25.1: 重写 PhoneFrame.tsx（手机轮廓 bezel + 真应用 390 面板）**

```tsx
export function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-[390px]">
      {/* 手机轮廓 bezel（决策 10 新增；无刘海无状态栏） */}
      <div className="rounded-[40px] bg-btnp p-[10px] shadow-pop">
        {/* 真应用面板：01 定稿 max-w 390 / radius 26 / padding 16 / 1px 边 */}
        <div className="rounded-[26px] border border-app-line bg-app-bg p-4">{children}</div>
      </div>
    </div>
  );
}
```

（bezel 用 `bg-btnp`=#1A1915 近黑，与 02 审批主按钮同色源。）

- [x] **Step 25.2: 重建 RemoteScene.tsx**

- 布局：`grid items-start gap-6 p-2 md:grid-cols-[340px_minmax(0,1fr)]`；左 PhoneFrame、右 `ClaudeTui`（`md:mt-6`，无 onClose）
- 手机内容（逻辑全保留：banner→detail→approve→approved）：
  - 头部：`text-[10px] font-semibold text-app-mut` + t("demo.phone.appTitle")
  - claude 迷你行（替换旧 SessionCard）：`flex items-center gap-2 rounded-lg border border-app-line bg-app-card p-2`——工具徽标（BADGE_PALETTE）+ `project` truncate + 状态灯（同 Task 24 规格）+ `aria-label={t(badge key)}`
  - banner：`rounded-xl px-2.5 py-2 text-[11px]`（沿用黄系软底或 02 横幅样式，主按钮 `#1A1915` 用 `bg-app-btnp text-white`）
  - 详情壳：`rounded-xl border border-app-line bg-app-card p-[14px] text-[11px] text-app-ink`（02 padding 14px）+ `font-mono text-app-mut` 计划摘要
  - 批准按钮：`w-full rounded-lg bg-app-btnp py-1.5 text-xs font-semibold text-white`，保留 `onClick={() => d2Steps[3].enter?.()}` 手动闭环
  - approved 横幅：`rounded-lg bg-app-card p-2 text-[11px] text-app-ink` + ✓ + t("demo.caption.running")（改值后=「已批准，继续运行」）
- 右侧 TUI：`extraLines={termLines(remote.approved)}`（cmd/warn/ok/dim 行沿用 P7 文案）、`waiting={!remote.approved}`（等待时光标停闪、批准后闪烁=在跑）
- 删除 `src/demo/SessionCard.tsx`

- [x] **Step 25.3: 验证**

```bash
pnpm exec tsc --noEmit && pnpm test && pnpm build
pnpm dev
# 核对：手机 bezel 轮廓 + 390 面板；剧本 5 段走完终段 claude 绿灯；手动「允许」同样联动 TUI 续跑；
# 播完回绕（banner/detail/approved 全复位）；375px 视口单列不溢出
```

**验收标准：** 手机端样式按 remote-ui 定稿（390/26/16/1px、详情 14px、主按钮近黑）；bezel 呈现手机轮廓；批准两路（剧本/手动）均使 TUI 与灯色同步；终态绿=已完成；parity 绿（123 key 不变，仅改值）。

---

### Task 26: D3 对齐（真应用窗壳精修）

**Files:**
- Modify: `src/demo/scenes/ResourcesScene.tsx`

- [x] **Step 26.1: ResourcesScene 内容对齐 app 令牌**

- 外层已随 T23 WindowFrame app 化；本任务精修内部：
  - 扫描按钮：`rounded-lg border border-app-line px-3 py-1 text-xs text-app-ink hover:bg-app-accent/50`
  - 预设组 chips 选中态：`bg-app-btnp text-white`（未选中 `border-app-line bg-app-bg text-app-mut hover:text-app-ink`）
  - 复选框 `style={{ accentColor: "#171717" }}`；表头/Skill 名 `font-mono text-[12px] text-app-mut`；表格行边 `border-app-line`
  - 一致性体检：健康 `rounded-xl bg-app-card p-3 text-app-ink`（绿点 `bg-green-500`），未达标 `text-app-mut`
  - 勾选矩阵、预设批量、重新扫描计数逻辑**逐行保留**
- [x] **Step 26.2: 验证**

```bash
pnpm exec tsc --noEmit && pnpm test && pnpm build
pnpm dev   # 核对：勾选≥2 体检变绿等 P4 既有验收点全过；窗壳/底色/选中态全为真应用白系；固定高度内滚动
```

**验收标准：** D3 行为零回归；窗内无站点暖纸令牌残留（`grep -n "text-inkdim\|bg-card\b" src/demo/scenes/ResourcesScene.tsx` 零命中）。

---

### Task 27: D4 重构（宠物切换 + 剧本）+ 账本真窗还原

**Files:**
- Create: `public/pet/starry-dew.webp`（拷贝）
- Modify: `src/demo/petAnimations.ts` `src/demo/scenes/PetUsageScene.tsx` `src/demo/ledgerData.ts` `src/demo/ledgerData.test.ts` `src/demo/LedgerSection.tsx` `src/i18n/{zh,en}.json`（+28 key：pet.bell/starry + 账本 26；改值 2 处：features.pet.desc / pet.call）

- [x] **Step 27.1: 素材拷贝 + petAnimations 多宠物**

```bash
cp "E:/LLMproject/Github/mam-worktree/docs/pet-gallery/starry-dew/spritesheet.webp" public/pet/starry-dew.webp
```

`petAnimations.ts` 改造（FRAME 192×208 / COLS 8 不变；ANIM 行表不变——两表 r0–r8 行映射一致，starry 无 r9–10 look 行且本站未用）：

```ts
export type PetId = "bell" | "starry";
/** 两只宠物差异仅在精灵表行数与语音；行映射 r0–r8 完全一致。 */
export const PETS: Record<PetId, { src: string; rows: number; voice: boolean; labelKey: string }> = {
  bell:   { src: "pet/spritesheet.webp", rows: 11, voice: true,  labelKey: "pet.bell" },
  starry: { src: "pet/starry-dew.webp",  rows: 9,  voice: false, labelKey: "pet.starry" },
};

export function frameStyle(anim: PetAnim, frame: number, scale: number, pet: PetId = "bell") {
  const def = ANIM[anim];
  const f = ((frame % def.d.length) + def.d.length) % def.d.length;
  const w = FRAME_W * scale, h = FRAME_H * scale;
  const meta = PETS[pet];
  return {
    backgroundImage: `url(${import.meta.env.BASE_URL}${meta.src})`,
    backgroundSize: `${w * SHEET_COLS}px ${h * meta.rows}px`,
    backgroundPosition: `${-f * w}px ${-def.row * h}px`,
    width: w, height: h,
  };
}
```

- [x] **Step 27.2: PetUsageScene 加宠物切换（+ 剧本驱动已在 T23 接线）**

- 场景顶部触发按钮排**之前**加切换行（两枚头像 chip）：`useState<PetId>("bell")`；chip = `flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px]` + 头像缩略图（`frameStyle("idle", 0, 0.15, pet)` 的 div 裁圆 `rounded-full overflow-hidden`）；选中 `border-app-btnp bg-app-accent/50 font-semibold text-app-ink`（场景 chrome 用 app 令牌）+ `aria-pressed`；标签 `t(PETS[pet].labelKey)`
- 宠物渲染传 `pet`：`frameStyle(anim, frame.current, 0.6, pet)`
- **语音门控（B10）**：`fire()`/剧本 enter 触发的 `<audio>` 仅当 `PETS[pet].voice === true` 播放（Starry Dew 静音上场——切换后无任何语音，等效「语音禁用」）；无独立语音按钮需要隐藏（P7 已移除）
- `pet.call` 改值「唤出桌宠」；状态卡/通知/hover 浮窗逻辑不动（浮窗改 app 令牌）；d4Steps 三段驱动已就位（T23），按钮与剧本共写 `petRun`

- [x] **Step 27.3: ledgerData.ts 扩展（三维 + 指标 + 趋势命中率）**

```ts
export interface DistRow { name: string; usd: number }
export const LEDGER = {
  total: 12.4,
  metrics: {
    input: 412_000, output: 1_900_000,     // token 数（显示时格式化 k/M）
    reqInput: 3_317_000, cacheHit: 2_400_000,
    requests: 318, asOf: "10-11 14:05",
  },
  byTool: [      // 合计 12.4（6 行）
    { name: "Claude Code", usd: 7.3 }, { name: "Codex", usd: 2.1 }, { name: "Kimi Code", usd: 1.0 },
    { name: "ZCode", usd: 0.8 }, { name: "WorkBuddy", usd: 0.6 }, { name: "dsh", usd: 0.6 },
  ],
  byProject: [   // 合计 12.4（4 行）
    { name: "tuvis-app", usd: 6.8 }, { name: "tuvis-site", usd: 2.4 },
    { name: "landing", usd: 1.6 }, { name: "quant-chart", usd: 1.6 },
  ],
  bySupplier: [  // 供应商 · 模型（6 行，合计 12.4）
    { name: "Anthropic · claude-sonnet-4.5", usd: 6.2 }, { name: "Anthropic · claude-opus-4.1", usd: 1.1 },
    { name: "OpenAI · gpt-5-codex", usd: 2.1 }, { name: "Moonshot · kimi-k2", usd: 1.0 },
    { name: "DeepSeek · deepseek-v3", usd: 0.8 }, { name: "others", usd: 1.2 },
  ],
  work: { agents: "6 active · 2 queued", sessions: 128,
    turns: "claude 342 · codex 118 · kimi 47",
    errors: "0 fatal · 2 retry · 1 timeout · 1 abort",
    longest: "p50 42s · max 316s",
    calls: "Read 210 · Edit 96 | Bash 54 · Grep 38" },     // 2×2（mono 数据硬编码英文）
} satisfies { total: number; metrics: { input: number; output: number; reqInput: number; cacheHit: number; requests: number; asOf: string }; byTool: DistRow[]; byProject: DistRow[]; bySupplier: DistRow[]; work: Record<string, string | number> };

export const hitRate = (m: typeof LEDGER.metrics) => m.cacheHit / (m.cacheHit + m.reqInput);   // ≈ 0.42

/** 近 30 天：日消耗（USD，合计===total）+ 缓存命中率 + 日期标签 */
export const TREND: { labels: string[]; usd: number[]; hit: number[] } = {
  labels: [/* 09-12 … 10-11 共 30 个 */],
  usd: [0.15, 0.19, … ],        // 沿用现有 30 值（合计 12.4）
  hit: [/* 30 个 0.30–0.55 */],
};
```

- [x] **Step 27.4: ledgerData.test.ts 扩三维不变式**

```ts
describe("ledger v2 invariants", () => {
  it("三个维度合计都等于总额", () => {
    for (const dim of [LEDGER.byTool, LEDGER.byProject, LEDGER.bySupplier])
      expect(sum(dim.map((r) => r.usd))).toBeCloseTo(LEDGER.total, 5);
  });
  it("趋势线 30 天且合计等于总额，命中率落在 0–1", () => {
    expect(TREND.usd).toHaveLength(30);
    expect(sum(TREND.usd)).toBeCloseTo(LEDGER.total, 5);
    expect(TREND.labels).toHaveLength(30);
    for (const h of TREND.hit) expect(h).toBeGreaterThan(0.29), expect(h).toBeLessThan(0.56);
  });
  it("命中率口径 = cacheHit / (cacheHit + reqInput) ≈ 42%", () => {
    expect(hitRate(LEDGER.metrics)).toBeCloseTo(0.42, 1);
  });
  it("占比条口径：维度内 share 合计 ≈ 100%", () => {
    for (const dim of [LEDGER.byTool, LEDGER.byProject, LEDGER.bySupplier])
      expect(sum(dim.map((r) => (r.usd / LEDGER.total) * 100))).toBeCloseTo(100, 3);
  });
});
```

- [x] **Step 27.5: LedgerSection 真窗重写（替换自创设计）**

整体：`<section id="ledger" className="scroll-mt-20">` 内一个真窗（`rounded-lg border border-app-line bg-app-bg shadow-soft overflow-hidden`）+ 内层 `h-[420px] md:h-[500px] overflow-y-auto`；**删除**导出分享图/撒花/语音（`pet.share` 成死 key、`fall` keyframes 保留无害）。结构（对照 usage-dashboard.tsx:172-241，`space-y-4 p-5`）：

1. **吸顶头**：`sticky top-0 z-10 border-b border-app-line bg-app-bg/95 px-4 py-2.5 backdrop-blur`——左：范围条 5 档 chips（`usage.range.*`，默认 `last30d`；可点选但数据静态=B8 演示数据，chip 样式同 ToolChip app 版）；右：页签条仅「看板」（`usage.tab.board`，选中下划线 `border-b-2 border-app-ink`）；**无导出**
2. **概要卡**：hero `text-3xl font-semibold tabular-nums`（`${total.toFixed(2)}`）+ 副行 `t("usage.total") · t("usage.trend")`；7 行三列指标网格 `grid grid-cols-[minmax(0,1fr)_auto_4.75rem] gap-y-1 text-xs`（标签 `text-app-mut` / 值 `text-right font-medium tabular-nums text-app-ink` / 环比 `text-right text-app-mut`）——行序：用户输入/模型产出/请求输入/缓存命中/命中率（`Math.round(hitRate*100)%`）/请求次数/统计截至（asOf mono）；页脚 `t("usage.note")` `text-[10px] text-app-mut`
3. **趋势卡**（`usage.trend` 为卡题）：SVG `viewBox="0 0 880 150"`——线 `#3b82f6`（`var(--app-chart-a)`）`strokeWidth 1.5` round；面积 `<linearGradient>` 垂直 `#3b82f6@0.35 → #8b5cf6@0.04`（`var(--app-chart-a/b)` + stopOpacity）；数据点 `r 2.5` 全点；三条水平参考线 `opacity 0.25` `stroke var(--app-line)`；**无 y 轴刻度**；x 轴标签 `fontSize 9 text-app-mut`，≤14 个全出、超出抽稀（首末必显）；hover：`onMouseMove` 取最近点 → 浮层 `${label} · $${usd} · ${t("usage.metric.hitRate")} ${Math.round(hit*100)}%`，水平夹 12%–88%
4. **工作小结卡**（`usage.work`）：行式 `flex justify-between text-xs`（标签 `text-app-mut` / 值 `font-mono text-app-ink`）六行——`usage.ws.agents/sessions/turns/errors/longest/calls` → `LEDGER.work.*`（calls 行 2×2 网格）
5. **分布卡**：卡头（`usage.dist`）右槽三维切换 `usage.dim.tool/project/supplier`（Button sm，选中 `bg-app-btnp text-white`）；整表 `grid grid-cols-[minmax(0,auto)_auto_minmax(80px,1fr)] items-center gap-x-3 gap-y-1.5 text-xs`——名称 `truncate text-app-ink` / 值 `text-right tabular-nums text-app-ink` / 占比条 `h-1.5 rounded-full bg-app-track` 内条 `bg-app-chart-a` 宽 `max(4%, share%)`；表头行三列 `text-app-mut`（名称/`usage.share` 对应值列头留空）

`DemoPage.tsx`：外层 h2（`usage.title`）保留，LedgerSection 内不再有标题行；`#ledger` 锚点与 D4 hover「详情」滚动链路保持。

- [x] **Step 27.6: i18n +28 key + 2 改值 + 验证**

```bash
pnpm exec tsc --noEmit && pnpm test   # Expected: 18 - 2(旧 ledger) + 4(v2) = 20 passed；parity 151 key
pnpm build && pnpm dev
# 核对：宠物切换 chip——贝贝（11 行 idle/waving/waiting 动画 + 语音）↔ Starry Dew（9 行、动画正常、触发无声音）；
# D4 三段剧本（值班/审批红卡/完成跳跃）+ 手动按钮同效；拖拽/hover 浮窗→#ledger 滚动；
# 账本窗：吸顶头滚动吸顶、范围 5 档可选（数据不变）、7 指标 + hero 大数字 tabular-nums、
# 趋势卡悬停出「日期·金额·命中率」、三维切换行内重渲、占比条蓝色内条；无导出/撒花/语音；
# 窗口高度恒定 420/500、整窗上下滚动
```

**验收标准：** 两宠物动画行映射正确（Starry Dew 9 行不越界、无 look 行引用）；Starry Dew 全程静音；账本五区结构与事实包一致（吸顶/概要 7 行/趋势 880×150/小结/三维分布）；四条不变式测试绿；死代码清除（LedgerSection 无 party/voice/STOMP）；parity 绿（151 key）。

---

## P8-D · 全站验收

### Task 28: 全站验收（Lighthouse A11y≥95 硬门槛 + 四场景交互矩阵 + 单主题回归）

**Files:**
- Modify: `docs/superpowers/plans/progress.md`（最终验收报告，控制方写）；发现缺陷最小修复另起 commit

- [x] **Step 28.1: 机器验证全绿**

```bash
pnpm exec tsc --noEmit && pnpm test    # Expected: 20 passed
pnpm build                             # tsc 零错误 + dist/404.html 生成
grep -riE "analytics|gtag|hotjar|plausible|umami" dist/ || echo "zero-tracking ok"
grep -rn "app-bg\|app-ink\|app-line\|app-mut\|app-btnp" src/home/ src/components/ | grep -v BrowserFrame || echo "app-tokens scoped ok"
grep -rn "dark:" src/ | grep -vE "ToolIcon|NotificationCard" || echo "no new dark: utilities"
```

- [x] **Step 28.2: 单主题回归（zh/en 各一遍）**

- [x] 顶栏/页脚无主题切换；DevTools 模拟 `prefers-color-scheme: dark` 刷新任意页仍为亮色、无闪黑；`localStorage` 无 `tuvis-theme` 残留影响
- [x] Hero：浏览器框（地址栏 tuvis.local）+ 海报白底融入；文案/CTA/GitHub 不变
- [x] 首页顺序：Hero → 状态区（已完成/运行中/待批准 + 胡萝卜冻结色）→ 你会这样用它 → 演示环节板块（4 卡 + 展示窗 + 打开完整演示）→ 开源 → 下载
- [x] 四仪表卡「查看演示」→ `/demo#d1…#d4` 精确锚点滚动到位

- [x] **Step 28.3: 四场景交互矩阵（pnpm preview 逐项勾）**

- [x] 通用（每场景）：初始静止不自动播；播放/暂停/续播；点段 seek+暂停、从该段续播；hover 详细说明（zh/en）；播完回绕初始态；演示区高度恒定、内部滚动；场景内交互即暂停
- [x] D1：摘要行红数随 waiting 变化；卡片点击开窗（claude→TUI、codex→APP、其余 inert）；TUI 拖动横滚、右键菜单开/关；红绿灯逐个关窗；卡片 X 收起、重播复位；chips 筛选
- [x] D2：bezel 手机 + 390 面板；banner→详情→允许（剧本+手动两路）→ TUI 续跑灯转黄；终段灯转绿
- [x] D3：勾选矩阵/预设/扫描行为与 P4 等价（体检绿阈值等）
- [x] D4：宠物切换两 chip（动画/静音差异）；三段剧本；拖拽（含触屏 pointercancel）；hover 浮窗滚到 #ledger
- [x] 账本：吸顶头 sticky；范围 5 档；三维切换；趋势 hover tooltip；占比条
- [x] 375px 移动端：四场景 + 账本单列不溢出、进度条段文字截断可读、tooltip 不出界
- [x] 键盘：Tab 可达播放钮与每一段（Focus 出详细说明）、Enter 触发

- [x] **Step 28.4: Lighthouse 复测（Chrome DevTools，/zh/ 与 /zh/demo）**

- 记录 Performance / Accessibility 分数进 progress.md
- **硬门槛：Accessibility ≥ 95**（不达标必须修：标签/对比度/aria——重点复查 `--app-mut #737373` 在 `#ffffff` 上 4.74:1 ✓、段内 10px 文字、tooltip 可读性）
- Performance ≥ P7 基线；hero-poster.png 体积与 LCP 记录为已知项（压缩归二期池 E7，本批不新增依赖）

- [x] **Step 28.5: 终验收 + 总报告（控制方）**

```bash
git add -A && git commit -m "chore: p8 acceptance pass"
# progress.md 追加 P8 总报告：任务/commit 对照表、测试计数（20）、i18n 终值（151 key）、Lighthouse 分数、遗留观察项
```

**验收标准（P8 完成的定义）：** 机器验证四条全绿（20 测试 / build / 零追踪 / app 令牌作用域 / 无新 dark:）；28.2 单主题回归 4 项全勾；28.3 交互矩阵 7 组全勾；A11y ≥ 95；五条主线逐一闭环（单主题+海报 Hero+首页重排 / 状态灯语义 / 引擎 v2+固定高度+app 配色 / 四场景真应用还原 / 宠物切换+账本真窗）；progress.md 有 P8 总报告。

---

## 交接备注（P9 及以后候选池）

- hero-poster.png 无损体积偏大：webp 化/压缩（二期 E7 池）；`hero-cutout.png`/`state-*.png` 无引用资产清理可随 E7 一并做
- 进度条 v2 可加「段落循环播放」开关与音效提示（当前刻意不做）
- 账本「记录」页签、真实范围切换数据、导出分享（P7/P8 连续两期移除，需求复活时从 git 历史捞 P7 版实现）
- TUI 右键菜单可接真实剪贴板（navigator.clipboard，需用户手势与权限，当前模拟即可）
- 宠物切换可升全局设置 + localStorage 持久化（当前 demo 粒度，刷新回贝贝）
