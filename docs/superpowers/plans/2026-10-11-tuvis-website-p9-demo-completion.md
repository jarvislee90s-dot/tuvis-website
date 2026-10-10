# Tuvis 官网 P9 计划（演示完整化 · 五工具原生窗 · 远程完整页 · 真资源 UI · 账本真窗复原）

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 基于 P8 成品（main @ cb6e3d5，21 测试全绿，工作区干净）落地演示完整化六条主线：① 路由切换回顶 + hash 锚点精确落位（修「查看演示/打开完整演示」落点停在页中）；② D1 剧本重排为五工具各一次跳转——Claude→TUI 终端、Codex→Codex CLI 窗、Kimi→Kimi CLI 窗、WorkBuddy→WorkBuddy 窗、ZCode→ZCode IDE 窗，右侧堆叠窗按工具切换对应原生 UI 组件（四个新组件按 `docs/design/tool-ui/` 基准图 1:1 量化还原），ClaudeTui 扩展「完整会话态」（三行头部 + 灰底用户消息行 + 思考折叠 + 回复 + 状态行 + auto mode 底行 + 右下 toast）；③ D2 手机侧从单卡升级为完整远程看板页（页头/四钮/筛选 chips/带檐线卡列表/状态 pill）+ 详情页（总结模式条/思考折叠/聊天气泡/底部信任与模式 chips/输入栏），五种交互全做且剧本自动串演 + 手动可触发（发消息、审批红卡、计划模式、单选/多选题卡、文件预览面板），右侧 TUI 与手机操作实时联动；④ D3 按 `resources.png` 重写为真资源 UI（体检卡 + 按资源/按工具 toggle + 扫描原生资源 + 兔维斯仓库大卡：搜索/目录 chips/Manifest 安装/Skill (73) 折叠头/派发图标矩阵，旧勾选矩阵与预设组逻辑废弃）；⑤ D4 宠物水平拖动按方向切 run-right(row1)/run-left(row2) 跑动动画、松手回 idle（Codex Pet/shimeji 机制），waiting/jumping 触发保留；⑥ 账本按 `usage.png` 完整复原（窗头标题+放大/关闭、范围 chips 默认近 7 天 + 五钮导出排、看板/记录页签记录置灰、概要卡大数字 4,392,361,324 千分位 + 两列指标网格 + 口径页脚、趋势卡平滑贝塞尔曲线 + 峰值/区间合计、中文单位万/亿格式化）。i18n 全部新增 key 双语同步。

**Architecture:** 不改技术栈与路由结构。站点层新增全局 `ScrollManager`（LangLayout 内挂载，pathname/hash 变化 → 回顶或锚点滚动，修复 SPA 滚动残留）。演示层三处结构性扩展：store `windows` 收敛为单槽 `{ notify, toolWin }`（五工具窗互斥切换，AnimatePresence mode="wait" 交叉过渡）；store `remote` 升 v2（page/approval/planMode/question/files/messages/thinkingExpanded/手机端独立 filter 与 deleted），剧本 enter 全部写绝对值保证 seek 幂等；ledgerData 升 v3（token 口径：metrics + deltas + 三维 tokens 行 + hitRate=cacheHit/reqInput ≈ 97.3% + 7 天 TREND + formatCN 中文单位 / formatInt 千分位 / smoothPath Catmull-Rom→贝塞尔 平滑曲线纯函数）。四个新 TUI 窗组件自含 `TuiShell`（灯位条 + 近黑底 + 拖动横滚 + 右键菜单，ClaudeTui 的既有实现抽公用），窗内容硬编码英文（真实感，P8 先例）；WorkBuddy 为家族风格近似稿（内容集中在文件头部常量区，用户截图到位后整文件替换）。D3 场景整体重写（本地 state，无全局联动需求，与现状一致）。

**Tech Stack:** 不变：pnpm · Vite 6 · React 19 · TypeScript 5.7 · Tailwind CSS v4 · react-router 7 · i18next · zustand 5 · framer-motion 12 · vitest + @testing-library/react（零新增包；平滑曲线/拖动跑动/文件 diff 纯手写）

**规格来源（还原唯一权威，已入库本仓 + 已核实文件:行号）：**
- `docs/design/tool-ui/codex-cli-splash.png`（OpenAI Codex CLI 官方启动帧）：近黑底 `#1E1F24`、顶部虚线框 header（`>_ OpenAI Codex (v0.0.0)` / `model: gpt-5.2-codex medium /model to change` / `directory: ~/code/codex/codex-rs`）、`Tip:` 行、**灰底高亮用户输入行** `Explain this code base to me`（底 `#2E2E32`）、灰 bullet 思考段、**Updated Plan** 粗体 + `└` 树 + `☐` 复选清单（首项青底高亮：底 `#0E3A47` 字 `#22D3EE`）、Explored 段
- `docs/design/tool-ui/kimi-shell-frame.png`（自 `kimi-shell-mode.gif` 提取的官方帧）：暗灰底 `#2B2B2B`、**蓝框欢迎盒**（蓝方块 logo + `Welcome to Kimi CLI!` / `Send /help for help information.` / `Directory:` / `Session:` / `Model: kimi-k2-thinking-turbo`）、提示符行 `moonshot@kimi-cli✨ █`、**底部状态栏**（`18:37 agent ctrl-x: switch mode ctrl-j: newline ctrl-v: paste ctrl-d: exit | context: 0.0%`，底 `#232326` 边 `#3A3A3E`）
- `docs/design/tool-ui/zcode-site-imgbot.png`（ZCode 官网桌面端）：暗色 IDE——顶部标签页（`Streaming` 激活）+ 左 agent 聊天面板（markdown + 表格）+ 右代码编辑器（TypeScript 高亮、行号）+ 底部状态栏（左 `⎇ dev · ✓ TypeScript`，右模型选择 `GLM-5.2 · Max ▾`）
- WorkBuddy：官网 SPA 拿不到官方截图——按 Kimi/ZCode TUI 家族风格近似（识别色 `#4AD06A`，tools.ts:11），**用户后续提供截图可整文件替换**
- `docs/design/p9-ref/remote-detail-tui.png` 右半（真实 Claude Code TUI 会话态）：header 三行（`Claude Code v2.1.287` / `glm-5.3-flash[1M] with max effort · API Usage Billing` / `cwd: ~/code/...`，全 `#8B857A` 10px）+ 用户消息行（`> HI` 高亮灰底 `#2A2824`）+ `✻ Thought for 8s (ctrl+o to expand)` + 助手回复（emoji 行 + 要点列表）+ 状态行 `※ Sautéed for 10s · done 15:48` + 横线 + 输入行 + 底行 `» auto mode on (shift+tab to cycle) · < for agents`；右下 toast 通知卡（`Claude` / `持仓 · 空闲`）
- `docs/design/p9-ref/phone-board.png`（手机看板完整页）：页头 Tuvis logo + `v0.5.6` + `MateBook16s`、标题「会话看板」+ 新建/历史/声音/月亮四钮、筛选 chips（全部/ZCode）、卡列表（顶部深色檐线 `#1A1915`、工具图标+名+项目+时间+垃圾桶、粗标题、两行摘要、状态 pill：等待操作红 / 运行中黄 / 空闲·未读绿）
- `docs/design/p9-ref/remote-detail-tui.png` 左半（手机详情页）：返回箭头 + 标题「持仓」+ `Claude · 4d244680` + 绿点 + `100%` + 刷新、总结模式条（已折叠 1 条过程消息 / 展开全部）、思考过程折叠卡、聊天气泡（用户右靠 HI / 助手白卡要点列表）、底部 完全信任/切换模式 chips + 输入框「输入消息发送到终端…」+ 发送钮
- `docs/design/p9-ref/resources.png`（资源管理真 UI）：一致性体检卡（♥ 图标 + `一切正常，未发现漂移或异常` + `立即体检`）、按资源/按工具 toggle、`扫描原生资源`、「兔维斯 仓库」大卡（搜索 skill 框 + `兔维斯仓库`/`~/.agents` chips + `从 Manifest 安装` + 说明行「点亮的工具图标 = 已派发到该工具；常驻 = 独占清扫豁免 + 停用保护；点击表头工具名可打开对应 skill 目录 / MCP 插件配置文件」+ `Skill (73)` 折叠头 + 表格：`名字⇅` + 每行名字右侧红色垃圾桶 + 行内「全部启用」小标签 + Claude Code/Codex/OpenCode/Kimi Code/ZCode 五列（点亮=工具图标带「常驻」小字，灰=未派发））
- `docs/design/p9-ref/usage.png`（账本真窗）：标题「用量看板」+ 右上放大/关闭、范围 chips（近 5 小时/当日/近 7 天/近 30 天/自定义，**默认近 7 天选中**）+ 导出按钮排（复制文本/导出图片/复制图片/导出设置/导出 CSV）+ 看板/记录页签（记录置灰）+ 概要卡（**4,392,361,324 千分位大数字** + 副标「请求输入 + 产出（不含缓存写入与用户输入估算）」+ 两列指标：用户输入(估)·含子代理 `~608 (+337.4%)` / 产出 `1795.10万 (+103.6%)` / 请求输入(全文累计) `43.74亿 (+136.5%)` / 缓存命中 `42.58亿 (+135.1%)` / 命中率 `97.3% (-0.6 pt)` / 请求次数 `20,515 (+166.3%)` / 数据截止时间 `2026-10-11 15:43:01` + 页脚「纯 token·含子代理·本地聚合·环比基准：上一等长周期·90 天前无明细」）+ 趋势卡（右上 `峰值 15.68亿/区间合计 (+136.3%)`、**圆滑贝塞尔**非折线、数据点、x 轴 `10/5`–`10/11`、蓝线渐变面积）+ 工作小结 + 分布三维
- 宠物跑动行位（mam-worktree 只读核实）：`src/components/pet/petAnimations.ts:22-23` —— `run-right` row 1 / `run-left` row 2，`d: [120×7, 220]`；两宠物 r0–r8 行映射一致
- 现状代码：`src/demo/{store,seed,types,tools,player,PlayerFrame}.ts(x)`、`src/demo/ClaudeTui.tsx`（灯位条/拖动/右键菜单实现所在）、`src/demo/scenes/*.tsx`、`src/demo/{ledgerData,LedgerSection}.ts(x)`、`src/i18n/{zh,en}.json`（151 key）

**全局约定:**
- 工作目录：`E:\LLMproject\Github\tuvis-website`（Shell: Git Bash）；基线 main @ cb6e3d5，工作区干净，21 测试全绿；参考图 `docs/design/p9-ref/`、`docs/design/tool-ui/` 已入库（当前 untracked，随 T29 首个 commit 一并纳入，**无需拷贝步骤**）
- 红线（不可越）：`brand/`、`mam-worktree/`、`legacy/`、`SPEC.md` 只读；不新增任何 npm 依赖；`DownloadCta.goToInstaller` 逻辑一行不动；全站零追踪
- 收尾四件套：每个任务末尾 `pnpm exec tsc --noEmit` + `pnpm test` + `pnpm build` 全绿 → **commit / 勾选本计划 checkbox / `docs/superpowers/plans/progress.md` 追加报告（变更文件/测试结果/commit hash/与计划偏差）由控制方收口执行**，实现子代理跑到三条命令全绿 + 浏览器核对即止；**不 commit（控制方收口）**
- i18n：本计划新增 70 个 key（见增量总表）+ 21 处既有 key 改值（见改值表），**zh.json 与 en.json 必须同步**（parity 测试强制）；TUI 窗内容 / 终端文本 / 账本 mono 数据值 / 会话数据（标题除外）硬编码（真实感优先，P8 先例）；会话标题 5 个走 i18n（en 对应翻译），会话摘要与助手回复为会话数据保留中文（真实会话内容不翻译——决策 7 的「手机端文案照图 1 中文为准」按 UI chrome 理解，en 侧数据保留中文属预期行为，验收不按缺陷计）
- 范围外：P6 部署、hero-poster 压缩（二期 E7）、真实导出功能、记录页签数据

---

## TUI 组件规格总表（从基准图量化，实现与验收的唯一对照）

通用 TUI 窗壳 `TuiShell`（T29 新建 `src/demo/TuiShell.tsx`，从 ClaudeTui.tsx:36-70 抽出，逻辑零改动）：

```
外层: overflow-hidden rounded-lg border border-[#2A2824] shadow-soft + className
灯位条: h-8 border-b px-3，红 #FF5F57 / 黄 #FEBC2E / 绿 #28C840（11px 圆点；
        有 onClose 时红灯可点关窗，无则装饰性 aria-hidden —— 同 ClaudeTui 现状）
主体:   px-4 py-3 font-mono text-[12px] leading-relaxed + 内容底色（由调用方 bodyClassName 给）
拖动横滚: pointerdown 记录 + setPointerCapture + scrollLeft -= movementX（cursor-grab/grabbing）
右键菜单: contextmenu 弹 Copy/Paste/Clear/Settings（#1A1A1A 底 #333 边），点外/Esc 关
```

| 组件 | 底色 | 正文 | 次文 | 强调色 | 结构（上→下） |
|---|---|---|---|---|---|
| **CodexCliTui** | `#1E1F24` | `#E6E6E6` | `#8B8F98` | 绿 `#10A37F`（`>_`）/ 青 `#22D3EE` 底 `#0E3A47` | ① 虚线框头（`border-dashed border-[#555A66]` 圆角 p-3）：`>_ OpenAI Codex (v0.0.0)`（>_ 绿）· `model: gpt-5.2-codex medium /model to change` · `directory: ~/code/codex/codex-rs` ② `Tip: Here are a few suggested prompts to get you started:` ③ **灰底输入行**（`bg-[#2E2E32]` rounded px-2 py-1）：`Explain this code base to me` ④ 灰 bullet 思考段（2-3 行 `•` 前缀）⑤ `⋁ Updated Plan`（**粗体**）+ `└─` 树行 + `☐` 复选清单 3 项（**首项青底高亮**）⑥ `Explored` 段（dim，罗列文件） |
| **KimiShellTui** | `#2B2B2B` | `#D7D7DB` | `#9EA0A6` | 蓝 `#4C7CFF`（框/logo/提示符） | ① 蓝框欢迎盒（`border-[#4C7CFF]` rounded-md p-3）：蓝方块 logo（h-3.5 w-3.5 rounded-[3px] bg-蓝）+ `Welcome to Kimi CLI!`（白）· `Send /help for help information.` · `Directory: ~/code/tuvis-app` · `Session: 4d244680` · `Model: kimi-k2-thinking-turbo` ② 提示符行 `moonshot@kimi-cli✨ █`（提示符蓝、方块光标 blink）③ **底部状态栏**（`border-t border-[#3A3A3E] bg-[#232326]` px-3 py-1.5 text-[10.5px] text-#9EA0A6 flex justify-between）：左 `18:37  agent  ctrl-x: switch mode  ctrl-j: newline  ctrl-v: paste  ctrl-d: exit` 右 `context: 0.0%` |
| **ZCodeIdeWindow** | 窗 `#1E1E22` / 编辑区 `#16161A` | `#D4D4D8` | 行号 `#5A5A63` / 边 `#2E2E33` | tab 指示 `#3B82F6`；代码 Dark+ 色板：keyword `#C586C7` / string `#CE9178` / type `#4EC9B0` / func `#DCDCAA` / comment `#6A9955` | TuiShell（底 `#1E1E22`）内：① tab 条（h-8 border-b px-3 flex gap-3 text-[11px]）：`Streaming` 激活（白字 + 顶部 2px `#3B82F6` 指示 + × 关闭符）+ `tuvis-agent` 暗 tab ② 双面板 **纵排**（右列 360px 放不下并排，B15）：上=聊天面板（markdown：`## Candle tooltip refactor` + 2×2 迷你表格 + `•` 列表 + 底部 `> Ask ZCode…` 输入行带 blink 光标），下=代码面板（行号 01-08 + TypeScript 8 行 `candle-tooltip.tsx`，语法着色如上）③ 状态栏（`border-t border-[#2E2E33] bg-[#16161A]` px-3 py-1.5 text-[10.5px] text-#9EA0A6 flex justify-between）：左 `⎇ dev  ✓ TypeScript` 右 **`GLM-5.2 · Max ▾`**（白字） |
| **WorkBuddyTui**（近似稿） | `#232624` | `#D7DBD8` | `#8F968F` | 绿 `#4AD06A`（框/logo/提示符） | Kimi 同构：① 绿框欢迎盒：绿方块 logo + `Welcome to WorkBuddy!`（白）· `Send /help for help information.` · `Workspace: ~/projects/landing` · `Mode: pair · Model: glm-5.2-flash` ② 提示符行 `workbuddy@cli ▶ █`（提示符绿）③ 状态栏（`border-t border-[#343A36] bg-[#1D201E]` 同 Kimi 布局）：左 `17:52  pair  ctrl-x: switch mode  ctrl-j: newline  ctrl-d: exit` 右 `context: 1.2%`。**全部文案集中在文件头部 `WELCOME/STATUS/PROMPT` 常量，用户截图到位后整文件替换** |
| **ClaudeTui session 态**（扩展既有组件） | `#0E0D0B`（不变） | `#D8D3C8` | `#8B857A` | 橙 `#D97757` / 绿 `#4EC98A` / 黄 `#EAB53D`（不变）；高亮行底 `#2A2824` | 新增 `mode` prop（`"welcome" | "session"`，默认 `"session"`）：session 态渲染 ① header 三行 `text-[10px] leading-tight text-[#8B857A]`：`Claude Code v2.1.287` · `glm-5.3-flash[1M] with max effort · API Usage Billing` · `cwd: ~/code/portfolio` ② 用户消息行：`> {userMsg}`（默认 `HI`）`bg-[#2A2824]` rounded px-1.5 py-0.5 全宽行 ③ `✻ Thought for 8s (ctrl+o to expand)`（#8B857A）④ `extraLines`（D2 联动行，既有）⑤ 助手回复块：`reply.headline`（默认 `🐰 The holdings dashboard is up:`）+ `reply.bullets[]`（默认 3 条 `•` 前缀）⑥ `※ Sautéed for 10s · done 15:48`（#8B857A）⑦ `h-px bg-[#2A2824]` 分隔线 ⑧ 既有输入行（`>` + blink 光标，waiting 停闪）⑨ 底行替换为 `» auto mode on (shift+tab to cycle) · < for agents`（planMode 时经 `modeLine` prop 换 `» plan mode on …`）⑩ `toast` prop 非空时：窗内 `absolute bottom-3 right-3` 迷你通知卡（`bg-[#1A1A1A] border-[#333]` rounded-md p-2 text-[10px]：绿点 + `Claude` / `持仓 · 空闲`）。welcome 态（欢迎盒/Tips/Note/Tip）整块保留为 mode 分支（当前无调用方，属组件 API 预留） |

---

## 剧本节拍表（v3 定稿）

**d1Steps（7 段，合计 19,600ms）：**

| # | dur | enter（绝对值，seek 幂等） | label.zh | detailKey |
|---|---|---|---|---|
| 1 | 3000 | `setStateOf("claude","waiting")` | 看板即全局：红灯呼吸，等你拍板 | demo.detail.d1s1（不改） |
| 2 | 2800 | `W()({ notify: true })` | 桌面通知弹出，点一下直达终端 | demo.detail.d1s2（不改） |
| 3 | 3000 | `W()({ notify:false, toolWin:"claude" }); setStateOf("claude","running")` | 跳转①：Claude Code 完整会话窗 | demo.detail.d1s3（改值） |
| 4 | 2600 | `W()({ toolWin:"codex" }); setStateOf("codex","waiting")` | 跳转②：Codex CLI 停在计划步 | demo.detail.d1s4（改值） |
| 5 | 2600 | `W()({ toolWin:"kimi" })` | 跳转③：Kimi CLI 欢迎盒与状态栏 | demo.detail.d1s5（改值） |
| 6 | 2600 | `W()({ toolWin:"workbuddy" })` | 跳转④：WorkBuddy 结对窗 | demo.detail.d1s6（新增） |
| 7 | 3000 | `W()({ toolWin:"zcode" })` | 跳转⑤：ZCode 桌面端——点卡片可随时切窗 | demo.detail.d1s7（新增） |

**d2Steps（7 段，合计 18,400ms，enter 全部写绝对值）：**

| # | dur | enter | label.zh | detailKey |
|---|---|---|---|---|
| 1 | 2600 | `R()({ page:"board", approval:"none", question:null, files:false, planMode:false, messages:SEED, filter:null })` | 远程看板页：状态 pill 总览，等待操作红 | demo.detail.d2s1（改值） |
| 2 | 2400 | `R()({ page:"detail", thinkingExpanded:false })` | 点卡进详情：总结模式条 + 思考折叠 | demo.detail.d2s2（改值） |
| 3 | 2800 | `R()({ approval:"approved", messages:SEED }); setStateOf("claude","running")` | 审批红卡→允许→终端 ✓ Approved | demo.detail.d2s3（改值） |
| 4 | 2800 | `R()({ messages:[...SEED, QUEUED] })` | 发消息：气泡上屏「已排队」，终端回显 | demo.detail.d2s4（改值） |
| 5 | 2600 | `R()({ planMode:true })` | 计划模式：banner 亮起，模式行切换 | demo.detail.d2s5（改值） |
| 6 | 2600 | `R()({ question:{ kind:"multi", picked:["摘要","用量"], submitted:true } })` | 题卡：单选/多选点选提交 | demo.detail.d2s6（新增） |
| 7 | 2600 | `R()({ files:true }); setStateOf("claude","idle")` | 文件预览：文件树 + 着色 diff；任务完成 | demo.detail.d2s7（新增） |

> SEED = 初始 messages（`HI` + 助手回复），QUEUED = `{role:"user", text:"把止盈线统一上调 15%", queued:true}`。幂等路径：s2 enter 置 `approval:"pending"`（红卡就位）→ s3 置 `"approved"`（允许生效）；s5 置单选题已提交终态、s6 置多选题已提交终态、s7 开文件预览并收尾 claude→idle——任意 seek(i) 重放 0..i 路径确定。单选/多选的「点选提交」过程态由题卡按钮手动驱动，剧本覆盖终态与文案（label/detailKey 兼指两者）。精确 enter 见 Step 30.4 代码。

**resSteps（3 段，3000×3，无 enter——D3 本地态）：** ① 统一仓库与 ~/.agents / Manifest 入口（d3s1 改值）② 点亮=已派发 / 灰=不注入，点图标切换、整行全部启用（d3s2 改值）③ 一致性体检 + 按资源/按工具双视图（d3s3 改值）。

**d4Steps（3 段，不动）** + `demo.detail.d4s1` 改值补「拖动跑动」。

---

**i18n 增量总表（70 key，zh / en）：**

T29（新增 2）：

| key | zh | en |
|---|---|---|
| `demo.detail.d1s6` | 五个工具五扇原生窗：WorkBuddy 结对窗与 Kimi 同构——绿框欢迎盒、提示符与快捷键状态栏。 | Five tools, five native windows: the WorkBuddy pairing window mirrors Kimi's structure — green welcome box, prompt line, shortcut status bar. |
| `demo.detail.d1s7` | ZCode 桌面端：聊天面板 + 代码编辑器 + GLM-5.2 · Max 模型条。剧本之外随时点卡片切窗、筛选、红绿灯关窗。 | The ZCode desktop: chat panel + code editor + the GLM-5.2 · Max model bar. Off-script, click any card to switch windows, filter, or close via the traffic lights. |

T30（新增 40）：

| key | zh | en |
|---|---|---|
| `demo.na` | 演示版未开放 | Not available in the demo |
| `demo.phone.boardTitle` | 会话看板 | Sessions |
| `demo.phone.new` | 新建会话 | New session |
| `demo.phone.history` | 历史记录 | History |
| `demo.phone.sound` | 声音 | Sound |
| `demo.phone.moon` | 夜间模式 | Night mode |
| `demo.phone.delete` | 删除会话 | Delete session |
| `demo.pill.waiting` | 等待操作 | Awaiting action |
| `demo.pill.running` | 运行中 | Running |
| `demo.pill.idle` | 空闲 · 未读 | Idle · unread |
| `demo.phone.title.claude` | 持仓 | Holdings |
| `demo.phone.title.codex` | 重构导航 | Nav refactor |
| `demo.phone.title.kimi` | 修复信任弹窗 | Fix trust dialog |
| `demo.phone.title.workbuddy` | 首页文案 | Hero copy |
| `demo.phone.title.zcode` | 蜡烛图提示 | Candle tooltip |
| `demo.phone.back` | 返回 | Back |
| `demo.phone.refresh` | 刷新 | Refresh |
| `demo.phone.collapsed` | 已折叠 {{count}} 条过程消息 | {{count}} process messages collapsed |
| `demo.phone.expandAll` | 展开全部 | Expand all |
| `demo.phone.thinking` | 思考过程 | Thinking |
| `demo.phone.trust` | 完全信任 | Full trust |
| `demo.phone.switchMode` | 切换模式 | Switch mode |
| `demo.phone.inputPlaceholder` | 输入消息发送到终端… | Type a message to send to the terminal… |
| `demo.phone.send` | 发送 | Send |
| `demo.remote.planBadge` | 计划模式 | Plan mode |
| `demo.remote.planDesc` | 只读规划，不动文件 | Read-only planning — no file changes |
| `demo.remote.deny` | 拒绝 | Deny |
| `demo.remote.singleQ` | 这次发布走哪条通道？ | Which channel should this release ship through? |
| `demo.remote.multiQ` | 复盘要包含哪些段落？ | Which sections should the retro include? |
| `demo.remote.submit` | 提交 | Submit |
| `demo.remote.submitted` | 已提交 | Submitted |
| `demo.remote.files` | 文件预览 | File preview |
| `demo.remote.close` | 关闭 | Close |
| `demo.remote.t.approval` | 发起审批 | Trigger approval |
| `demo.remote.t.send` | 模拟发送 | Simulate send |
| `demo.remote.t.plan` | 切计划模式 | Toggle plan mode |
| `demo.remote.t.question` | 出一道题 | Ask a question |
| `demo.remote.t.files` | 打开文件预览 | Open file preview |
| `demo.detail.d2s6` | 题卡不打断：单选点一项、多选勾几项，提交即回填给终端。 | Question cards don't interrupt: pick one option or check a few, submit, and the answer flows back to the terminal. |
| `demo.detail.d2s7` | 文件预览面板：左侧文件树、右侧着色 diff，改动一目了然，手机上也能审。 | The file preview panel: file tree on the left, colored diff on the right — review changes even from your phone. |

T31（新增 17）：

| key | zh | en |
|---|---|---|
| `res.healthOk` | 一切正常，未发现漂移或异常 | All clear — no drift or anomalies found |
| `res.checking` | 体检中… | Checking… |
| `res.checkNow` | 立即体检 | Run check |
| `res.byResource` | 按资源 | By resource |
| `res.byTool` | 按工具 | By tool |
| `res.repo` | 兔维斯 仓库 | Tuvis repository |
| `res.searchPlaceholder` | 搜索 skill | Search skills |
| `res.dir.repo` | 兔维斯仓库 | Tuvis repo |
| `res.dir.agents` | ~/.agents 目录 | ~/.agents directory |
| `res.installManifest` | 从 Manifest 安装 | Install from Manifest |
| `res.repoDesc` | 点亮的工具图标 = 已派发到该工具；常驻 = 独占清扫豁免 + 停用保护；点击表头工具名可打开对应 skill 目录 / MCP 插件配置文件 | A lit tool icon = dispatched to that tool; always-on = exempt from cleanup sweeps and disable protection; click a tool header to open its skill directory / MCP config. |
| `res.skillCount` | Skill ({{count}}) | Skills ({{count}}) |
| `res.colName` | 名字 | Name |
| `res.allOn` | 全部启用 | Enable all |
| `res.pinned` | 常驻 | Always on |
| `res.deleteSkill` | 删除 | Delete |
| `res.sortByName` | 按名字排序 | Sort by name |

T32（新增 11）：

| key | zh | en |
|---|---|---|
| `usage.win.max` | 放大 | Zoom |
| `usage.win.close` | 关闭 | Close |
| `usage.tab.record` | 记录 | Records |
| `usage.export.copyText` | 复制文本 | Copy text |
| `usage.export.image` | 导出图片 | Export image |
| `usage.export.copyImage` | 复制图片 | Copy image |
| `usage.export.settings` | 导出设置 | Export settings |
| `usage.export.csv` | 导出 CSV | Export CSV |
| `usage.summary.subtitle` | 请求输入 + 产出（不含缓存写入与用户输入估算） | Request input + output (excl. cache writes & user-input estimates) |
| `usage.peak` | 峰值 | Peak |
| `usage.rangeTotal` | 区间合计 | Period total |

**i18n 改值表（21 处）：**

| key | zh 旧→新 | en 旧→新 | 落点 |
|---|---|---|---|
| `demo.detail.d1s3` | 点通知直达对应窗口：Claude 打开 TUI 终端窗… → **点开 Claude Code 的完整会话态：三行头部、灰底用户消息、思考折叠行、回复与 auto mode 输入行，右下还有一条桌面通知。** | … → **Claude Code opens in full session form: three-line header, highlighted user message, collapsible thinking, the reply, the auto-mode input line — plus a desktop toast bottom-right.** | T29 |
| `demo.detail.d1s4` | 多 Agent 并发时互不干扰… → **切到 Codex CLI 窗：虚线信息头、灰底输入行、Updated Plan 复选清单与 Explored 段——原版观感原样搬进窗里。** | → **Switch to the Codex CLI window: dashed info header, highlighted input line, the Updated Plan checklist and Explored section — the original look, moved into a window.** | T29 |
| `demo.detail.d1s5` | 筛选 chips 按工具过滤… → **Kimi CLI 窗：蓝框欢迎盒、moonshot@kimi-cli 提示符与底部快捷键状态栏，一一对应官方 GIF 帧。** | → **The Kimi CLI window: blue-framed welcome box, moonshot@kimi-cli prompt, and the bottom shortcut status bar — matched to the official GIF frame.** | T29 |
| `demo.detail.d2s1` | Claude 停在 git commit… → **远程看板页：页头连着 MateBook16s，状态 pill 一眼分区——等待操作红、运行中黄、空闲绿。** | → **The remote board page: header linked to MateBook16s, status pills sort the field at a glance — red awaiting, amber running, green idle.** | T30 |
| `demo.detail.d2s2` | 远程通道秒级推送… → **点卡进详情：总结模式条折叠过程消息，思考过程单独收起，聊天记录完整保留。** | → **Tap a card for the detail page: the summary bar collapses process messages, thinking folds separately, the chat stays complete.** | T30 |
| `demo.detail.d2s3` | 详情层给出计划全文… → **审批红卡带命令全文，「允许」一点——终端立刻 ✓ Approved 续跑，全程没碰电脑。** | → **The red approval card shows the exact command; one tap on Allow — the terminal prints ✓ Approved and resumes, computer untouched.** | T30 |
| `demo.detail.d2s4` | 「允许」一点即放行… → **发消息即排队：气泡上屏标「已排队」，终端出现用户输入行，终端空闲立刻执行。** | → **Messages queue instantly: the bubble lands marked "queued", the terminal shows your input line, and it runs the moment the terminal is free.** | T30 |
| `demo.detail.d2s5` | 任务收尾灯转绿… → **计划模式一键切换：banner 亮起，终端底行换成 plan mode——只读规划，不动文件。** | → **Plan mode in one tap: the banner lights up and the terminal's mode line switches — read-only planning, no file changes.** | T30 |
| `demo.detail.d3s1` | Skill 与 MCP 不再散落… → **Skill 与 MCP 统一收进「兔维斯仓库」，一处修改、处处生效；~/.agents 目录与 Manifest 安装都是入口。** | → **Skills and MCP live in one Tuvis repository — change once, apply everywhere; the ~/.agents directory and Manifest install are both entry points.** | T31 |
| `demo.detail.d3s2` | 勾选矩阵决定… → **点亮的图标 = 已派发到该工具；灰色 = 未派发 = 不注入 = 上下文干净。点图标切换，整行「全部启用」一键点亮。** | → **A lit icon means dispatched to that tool; gray means not dispatched — nothing injected, clean context. Click to toggle, or light the whole row with "Enable all".** | T31 |
| `demo.detail.d3s3` | 预设组把… → **一致性体检随时校验仓库与各工具目录是否漂移；按资源看全景、按工具看单个工具的装备清单。** | → **The consistency check catches drift between the repository and tool folders; view by resource for the big picture, by tool for one loadout.** | T31 |
| `res.scan` | 重新扫描 → **扫描原生资源** | Rescan → **Scan native resources** | T31 |
| `usage.title` | Token 用量账本 → **用量看板** | Token usage ledger → **Usage dashboard** | T32 |
| `usage.range.today` | 今天 → **当日** | Today（不变） | T32 |
| `usage.trend` | 近 30 天走势 → **用量趋势** | 30-day trend → **Usage trend** | T32 |
| `usage.metric.input` | 用户输入 → **用户输入（估）· 含子代理** | User input → **User input (est.) · incl. subagents** | T32 |
| `usage.metric.output` | 模型产出 → **产出** | Model output → **Output** | T32 |
| `usage.metric.reqInput` | 请求输入 → **请求输入（全文累计）** | Request input → **Request input (cumulative)** | T32 |
| `usage.metric.asOf` | 统计截至 → **数据截止时间** | As of → **Data as of** | T32 |
| `usage.note` | 口径：token 折算 USD · 演示数据 → **纯 token · 含子代理 · 本地聚合 · 环比基准：上一等长周期 · 90 天前无明细** | Basis: tokens → USD · demo data → **Tokens only · incl. subagents · local aggregation · comparison base: previous equal-length period · no details before 90 days ago** | T32 |
| `demo.detail.d4s1` | 桌宠按精灵帧动画呈现待机/奔跑/等待；贝贝带 31 条语音… → **桌宠按精灵帧动画呈现待机/奔跑/等待——水平拖动会朝拖动方向撒腿就跑，松手回到待机；贝贝带 31 条语音，Starry Dew 静音上场。** | → **The pet renders idle/run/wait from sprite frames — drag it sideways and it sprints that way, release to settle back. Foxbell ships 31 voice clips; Starry Dew plays silent.** | T32 |

**死 key 处置（保留 json 不删，parity 只查键集合与空值）：** 本期新死 `demo.win.codexApp`（Codex 窗换 CodexCliTui 自含壳）、`demo.phone.appTitle`（页头重做）、`demo.phone.detail`（卡点击直达详情）、`res.context`/`res.preset`（D3 重写）、`usage.total`（大数字换 subtitle）；P8 遗留死 key 照旧。新代码引用的 key 必须真实存在。

**文件总览：**

新增（7 个源文件）：
```
src/components/ScrollManager.tsx      # T29 路由回顶 + hash 锚点
src/demo/TuiShell.tsx                 # T29 TUI 公用窗壳（灯位条/拖动/右键菜单，自 ClaudeTui 抽出）
src/demo/CodexCliTui.tsx              # T29 Codex CLI 窗（codex-cli-splash.png）
src/demo/KimiShellTui.tsx             # T29 Kimi CLI 窗（kimi-shell-frame.png）
src/demo/WorkBuddyTui.tsx             # T29 WorkBuddy 近似窗（家族风格，可整文件替换）
src/demo/ZCodeIdeWindow.tsx           # T29 ZCode IDE 窗（zcode-site-imgbot.png）
src/demo/remote/RemoteBoard.tsx       # T30 手机看板页
src/demo/remote/RemoteDetail.tsx      # T30 手机详情页（五交互）
```

修改（约 16 个既有文件）：
```
src/components/layout/LangLayout.tsx     # T29 挂 ScrollManager
src/demo/ClaudeTui.tsx                   # T29 session 态扩展
src/demo/store.ts                        # T29 windows 单槽 / T30 remote v2
src/demo/AppBoard.tsx                    # T29 openWindow 五工具
src/demo/steps-d1.ts                     # T29 七段
src/demo/scenes/D1Scene.tsx              # T29 右窗按工具切换
src/demo/player.test.ts                  # T29 d1 终态断言 / T30 d2 终态断言
src/demo/steps-d2.ts                     # T30 七段
src/demo/scenes/RemoteScene.tsx          # T30 重写（看板+详情+联动+触发排）
src/demo/scenes/ResourcesScene.tsx       # T31 整体重写
src/demo/steps-res.ts                    # T31 文案
src/demo/petAnimations.ts                # T32 +run-right/run-left
src/demo/scenes/PetUsageScene.tsx        # T32 拖动方向跑动
src/demo/ledgerData.ts                   # T32 v3（token 口径 + formatCN/formatInt/smoothPath）
src/demo/ledgerData.test.ts              # T32 v3 不变式（4→6 测试）
src/demo/LedgerSection.tsx               # T32 五处复原
src/i18n/{zh,en}.json                    # 各任务分批 +70 key +21 改值
docs/superpowers/plans/progress.md       # 每任务控制方追加
```

删除：无。

---

## 关键设计权衡（B11–B20，评审时对照）

- **B11 ScrollManager 全局 effect**：LangLayout 挂空组件，pathname 变 → 回顶、hash 变 → 锚点 scrollIntoView；比逐页 scrollTo 一处收口，且修好 `demo#d1..#d4` 锚点落位（现状 pushState 不滚动的隐性缺陷）。代价：LangLayout 多一个子组件（零 UI）。
- **B12 五窗单槽切换（AnimatePresence mode="wait"）**：决策指定「堆叠窗按工具切换」；单槽实现 = 窗互斥顶替 + 交叉过渡，状态简单（`toolWin: string | null`）。代价：不能同屏对比两工具窗——剧本语义本就是「跳转」，可接受。
- **B13 新组件走 TuiShell、ClaudeTui 不回迁**：TuiShell 从 ClaudeTui 抽出公用（三个新窗 + WorkBuddy 替换期共用），但 ClaudeTui 既有内联实现不动（P8 已验收代码零回归风险）。代价：ClaudeTui 与 TuiShell 约 40 行重复，接受。
- **B14 WorkBuddy 近似稿**：无官方截图，按 Kimi/ZCode TUI 家族近似（绿识别色），文案全集中在文件头部常量；用户提供截图后整文件替换。风险=风格偏差，已在组件头注释与计划中双注明。
- **B15 ZCode 窄列纵排双面板**：右列 360px 放不下并排 IDE；纵排保留结构语义（tab/聊天/代码/状态栏四件套 + Dark+ 着色）。验收按「结构 + 元素 + 配色」对照，不按像素构图。
- **B16 D2 剧本 enter 全绝对值**：messages 用固定数组 set 不 append（seek 重放安全）；手动发送走 append 路径（无重放问题）。两条写入路径在 store 层同一 API，语义清晰。
- **B17 hitRate 口径改 cacheHit/reqInput（97.3%）**：对齐真图（42.58亿/43.74亿=97.3%）；P8 的 cacheHit/(cacheHit+reqInput)≈42% 口径与测试废弃。数字全部可被不变式测试守护。
- **B18 中文单位万/亿双语同格式**：保真真图（1795.10万 / 43.74亿）；en 侧同样输出万/亿（口径页脚已解释），避免维护两套格式化与两套数据展示。
- **B19 静态按钮用 disabled + title**：导出五钮/放大/关闭/记录页签——`disabled` 属性 + `title={t("demo.na")}`，对屏幕阅读器诚实（假可点更糟）；代价：与真窗「可点」手感略差。
- **B20 D3 派发数据本地 state**：D3 无跨场景联动（现状亦然），播完回绕不清本地态与 P8 行为一致；「立即体检/扫描」的瞬时反馈用本地 loading state，1s 后回落。

---

## P9-A · 站点级 + D1 五工具窗

### Task 29: 路由回顶 + D1 四工具跳转剧本 + 四 TUI 工具窗组件 + ClaudeTui 完整化

**Files:**
- Create: `src/components/ScrollManager.tsx` `src/demo/TuiShell.tsx` `src/demo/CodexCliTui.tsx` `src/demo/KimiShellTui.tsx` `src/demo/WorkBuddyTui.tsx` `src/demo/ZCodeIdeWindow.tsx`
- Modify: `src/components/layout/LangLayout.tsx` `src/demo/ClaudeTui.tsx` `src/demo/store.ts` `src/demo/AppBoard.tsx` `src/demo/steps-d1.ts` `src/demo/scenes/D1Scene.tsx` `src/demo/player.test.ts` `src/i18n/{zh,en}.json`（+2 key、改值 3 处）

- [x] **Step 29.1: ScrollManager（完整代码）+ LangLayout 挂载**

```tsx
// src/components/ScrollManager.tsx
import { useEffect } from "react";
import { useLocation } from "react-router";

/** SPA 路由切换回顶（B11）；带 hash 时滚动到锚点（修 demo#d1..#d4 落位）。 */
export function ScrollManager() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const el = document.getElementById(hash.slice(1));
      if (el) { requestAnimationFrame(() => el.scrollIntoView({ behavior: "smooth" })); return; }
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}
```

`LangLayout.tsx`：`<TopBar />` 之前插 `<ScrollManager />`。验证点：首页中部点「查看演示」→ /demo 顶部；`demo#d3` → 滚到 d3 标题；语言切换（pathname 变 `/en/...`）也回顶。

- [x] **Step 29.2: store windows 单槽 + AppBoard 五工具开窗**

`store.ts` windows slice 替换：

```ts
  windows: { notify: boolean; toolWin: string | null };   // toolWin = tools key（五窗互斥，B12）
```

`AppBoard.tsx` 的 `openWindow` 替换：

```ts
const WINDOW_TOOLS = new Set(["claude", "codex", "kimi", "workbuddy", "zcode"]);
function openWindow(s: Session): (() => void) | undefined {
  return WINDOW_TOOLS.has(s.tool) ? () => useDemo.getState().setWindows({ toolWin: s.tool }) : undefined;
}
```

（opencode/openclaw/dsh 卡片 inert 不变——无对应窗。）

- [x] **Step 29.3: TuiShell.tsx（公用壳，完整逻辑搬移）**

从 `ClaudeTui.tsx:36-70,108-121` 原样抽出（灯位条 + 拖动横滚 + 右键菜单 + Esc/点外关闭），接口：

```tsx
export function TuiShell({ bodyClassName = "", className = "", onClose, children }: {
  bodyClassName?: string; className?: string; onClose?: () => void; children: ReactNode;
})
```

行为与 ClaudeTui 现状逐行一致（menu 状态、pointer capture、`cursor-grab/grabbing`、菜单项 Copy/Paste/Clear/Settings 硬编码英文）。ClaudeTui **不改用** TuiShell（B13）。

- [x] **Step 29.4: 四个工具窗组件（按 TUI 规格总表逐项实现）**

每个文件结构：头部常量区（全部文案/色值集中，WorkBuddy 尤甚）→ 组件（TuiShell 包内容）。关键实现点：

`CodexCliTui.tsx`（对照 `docs/design/tool-ui/codex-cli-splash.png`）：

```tsx
const HEADER = [">_ OpenAI Codex (v0.0.0)", "model: gpt-5.2-codex medium /model to change", "directory: ~/code/codex/codex-rs"];
const PLAN_ITEMS = ["Read workspace Cargo.toml", "Bump versions in 12 member crates", "cargo check --workspace"];
// 虚线头: rounded-md border border-dashed border-[#555A66] p-3 mb-3 space-y-0.5，首行 ">_" 用 text-[#10A37F]
// 输入行: bg-[#2E2E32] rounded px-2 py-1 mb-3（全宽行）
// 思考段: • 前缀 text-[#8B8F98] 2-3 行
// Updated Plan: <div className="font-bold">⋁ Updated Plan</div> + "  └─ codex-rs/Cargo.toml" + PLAN_ITEMS.map:
//   <div className={`rounded px-1.5 ${i===0 ? "bg-[#0E3A47] text-[#22D3EE]" : "text-[#E6E6E8]"}`}>☐ {item}</div>（首项青底高亮）
// Explored: text-[#8B8F98]（"Explored codex-rs/Cargo.toml · core/src/lib.rs · tui/src/app.rs"）
export function CodexCliTui({ className = "", onClose }: { className?: string; onClose?: () => void })
```

`KimiShellTui.tsx`（对照 `kimi-shell-frame.png`）：欢迎盒（`border-[#4C7CFF]` rounded-md p-3 mb-4：蓝方块 logo + 5 行）、提示符行（`moonshot@kimi-cli` 蓝 + `✨` + blink 方块光标）、状态栏（`border-t border-[#3A3A3E] bg-[#232326]` flex justify-between px-3 py-1.5 text-[10.5px]）。色值见规格总表。

`ZCodeIdeWindow.tsx`（对照 `zcode-site-imgbot.png`）：TuiShell（底 `#1E1E22`）内 tab 条 → 双面板纵排（`flex-1 min-h-0`：上聊天面板 `border-b border-[#2E2E33]`，内含 `## Candle tooltip refactor` 标题 + 2×2 表格（`<table>` text-[10px]，边 `#2E2E33`）+ 2 条 bullet + `> Ask ZCode…` 输入行；下代码面板：`flex` 行号列（`text-[#5A5A63]` select-none）+ `<pre>` 8 行 TS，用 `<span className="text-[#C586C7]">` 等手工着色——**禁止**引入高亮库）→ 状态栏。TS 片段：

```ts
// candle-tooltip.tsx
export function CandleTooltip({ candle }: Props) {
  const delta = candle.close - candle.open;
  const tone = delta >= 0 ? "up" : "down";
  return <div className={`tip ${tone}`}>{fmt(delta)}</div>;
}
```

`WorkBuddyTui.tsx`（近似稿，B14）：文件头注释「近似稿：用户提供官方截图后整文件替换（docs/design/tool-ui/ 待补）」+ `WELCOME/PROMPT/STATUS` 常量 + Kimi 同构渲染（绿色系，见规格总表）。

四个组件统一导出签名 `{ className?: string; onClose?: () => void }`，内容硬编码英文、`whitespace-pre` 行 + 窗内 `overflow-x-auto`（拖动由 TuiShell 提供）。

- [x] **Step 29.5: ClaudeTui session 态扩展（对照 remote-detail-tui.png 右半）**

新 props：`mode?: "welcome" | "session"`（默认改 `"session"`）、`userMsg?: string`（默认 `"HI"`）、`reply?: { headline: string; bullets: string[] }`、`modeLine?: string`（默认 `"» auto mode on (shift+tab to cycle) · < for agents"`）、`toast?: { title: string; body: string } | null`。session 分支按规格总表 ①–⑩ 渲染（header 三行 10px、`> {userMsg}` 灰底行、Thought 行、extraLines、reply 块、※ 状态行、分隔线、既有输入行、modeLine 底行、toast 右下角）。默认 reply：

```ts
const DEFAULT_REPLY = {
  headline: "🐰 The holdings dashboard is up:",
  bullets: ["• 3 agent sessions online, 1 awaiting approval", "• Remote channel linked (MateBook16s · v0.5.6)", "• Ledger booked 12.4M tokens today"],
};
```

welcome 分支整块保留（当前无调用方，组件 API 预留）。既有 TONE/拖动/右键菜单零改动。

- [x] **Step 29.6: steps-d1 v2（七段，见节拍表）+ D1Scene 重写右列**

`steps-d1.ts` 按节拍表逐行实现；`d1Reset` 改 `windows: { notify: false, toolWin: null }`。`D1Scene.tsx` 右列替换为单槽切换：

```tsx
<div className="flex flex-col gap-3">
  <AnimatePresence mode="wait">
    {windows.toolWin === "claude" && (
      <motion.div key="claude" {...SPRING}>
        <ClaudeTui mode="session" waiting={claude.state === "waiting"}
          toast={{ title: "Claude", body: "持仓 · 空闲" }}
          onClose={() => setWindows({ toolWin: null })} />
      </motion.div>
    )}
    {windows.toolWin === "codex" && (<motion.div key="codex" {...SPRING}><CodexCliTui onClose={() => setWindows({ toolWin: null })} /></motion.div>)}
    {windows.toolWin === "kimi" && (<motion.div key="kimi" {...SPRING}><KimiShellTui onClose={…} /></motion.div>)}
    {windows.toolWin === "workbuddy" && (<motion.div key="workbuddy" {...SPRING}><WorkBuddyTui onClose={…} /></motion.div>)}
    {windows.toolWin === "zcode" && (<motion.div key="zcode" {...SPRING}><ZCodeIdeWindow onClose={…} /></motion.div>)}
  </AnimatePresence>
</div>
```

外层 grid 改 `md:grid-cols-[minmax(0,1fr)_360px]`（ZCode 窗需要宽度，B15）；`SPRING` = 既有 spring 参数（`opacity/scale/y` 进出）；`openFromNotify` 改 `setWindows({ notify: false, toolWin: "claude" })` + claude running。旧 codexApp 任务列表（done ✓/running/queued 三行）删除。`NotificationCard` 链路保留。

- [x] **Step 29.7: player.test.ts d1 断言适配 + i18n + 验证**

seek 用例内 d1 断言替换：`d1.result.current.seek(6)` → `expect(useDemo.getState().windows.toolWin).toBe("zcode")`、`notify === false`、`sessions.claude.state === "running"`。i18n 按总表 +2/改值 3。

```bash
pnpm exec tsc --noEmit && pnpm test   # Expected: 21 passed
pnpm build
pnpm dev
# 浏览器核对：首页中部点「查看演示/打开完整演示」→ /demo 顶部；demo#d1..#d4 锚点落位；
# /demo D1：播放七段——s3 Claude 窗（header 三行/> HI 灰底/Thought/回复/※ 状态行/auto mode 底行/右下 toast），
# s4-s7 依次切 Codex（虚线头/灰底输入行/Updated Plan 首项青底）/Kimi（蓝框盒/状态栏）/WorkBuddy（绿框盒）/ZCode（Streaming tab/TS 着色/GLM-5.2 · Max）；
# 手动点五张卡各自开窗互斥切换；红灯关窗；四新窗拖动横滚 + 右键菜单；对照 docs/design/tool-ui/ 三张基准图逐项过；
# 通知→Claude 窗链路；播完回绕（toolWin=null）
```

**验收标准：** 滚动两项（回顶/锚点）全过；五窗组件与规格总表逐项对上（Codex 虚线头+青底首项、Kimi 蓝框+状态栏文本、ZCode 四件套+Dark+ 五色、WorkBuddy 绿系近似、Claude session ①–⑩）；D1 七段剧本与进度条严格对应；player.test 21 绿；parity 绿（153 key）。

---

## P9-B · D2 远程完整页

### Task 30: D2 远程看板页 + 详情页 + 五交互 + TUI 联动

**Files:**
- Create: `src/demo/remote/RemoteBoard.tsx` `src/demo/remote/RemoteDetail.tsx`
- Modify: `src/demo/store.ts`（remote v2）`src/demo/steps-d2.ts` `src/demo/scenes/RemoteScene.tsx` `src/demo/player.test.ts`（追加 d2 终态断言）`src/i18n/{zh,en}.json`（+40 key、改值 5 处）

- [x] **Step 30.1: store remote v2（完整 slice）**

```ts
export interface RemoteMsg { role: "user" | "assistant"; text: string; queued?: boolean }
export type QuestionState =
  | { kind: "single"; picked: string | null; submitted: boolean }
  | { kind: "multi"; picked: string[]; submitted: boolean }
  | null;
interface RemoteState {
  page: "board" | "detail";
  filter: string | null;                 // 手机端独立筛选（不与桌面 store.filter 互扰）
  deleted: string[];                     // 垃圾桶移除的会话 id
  approval: "none" | "pending" | "approved";
  planMode: boolean;
  question: QuestionState;
  files: boolean;
  thinkingExpanded: boolean;
  messages: RemoteMsg[];
}
const SEED_MSGS: RemoteMsg[] = [
  { role: "user", text: "HI" },
  { role: "assistant", text: "你好——持仓面板在线：3 个会话，1 个等待批准。\n• 桌面端 Claude / Codex / Kimi 并跑中\n• 远程通道已连接（MateBook16s）" },
];
export const QUEUED_MSG: RemoteMsg = { role: "user", text: "把止盈线统一上调 15%", queued: true };
```

初始值：`{ page:"board", filter:null, deleted:[], approval:"none", planMode:false, question:null, files:false, thinkingExpanded:false, messages: SEED_MSGS }`；`setRemote(patch)` 合并语义不变。SEED_MSGS/QUEUED_MSG 从 store.ts 导出（steps-d2 引用，绝对值幂等，B16）。

- [x] **Step 30.2: RemoteBoard.tsx（看板页，对照 phone-board.png）**

PhoneFrame 内容整体替换为此组件。结构（app 令牌，全 i18n chrome）：

1. 页头：`flex items-center gap-1.5`——`img appicon-dark.png` h-4 w-4 + `Tuvis` text-xs font-semibold text-app-ink + `v0.5.6` font-mono text-[10px] text-app-mut + `ml-auto` `MateBook16s` text-[10px] text-app-mut（logo/版本/主机名硬编码数据）
2. 标题行：`会话看板`（demo.phone.boardTitle）text-base font-semibold + 右侧四钮（`h-7 w-7 rounded-full border border-app-line flex items-center justify-center text-app-mut hover:bg-app-accent/50`）：新建（PlusIcon aria=demo.phone.new，**disabled** + title=demo.na）、历史（HistoryIcon 同上 disabled）、声音（VolumeIcon aria-pressed 本地 toggle）、月亮（MoonIcon aria-pressed 本地 toggle）
3. 筛选 chips：`demo.filter.all`（全部）+ 会话所涉工具 chip（由 sessions 推导 `[...new Set(list.map(s=>s.tool))]` 全量渲染——图中示意为 ZCode）——选中 `bg-app-btnp text-white`
4. 卡列表 `space-y-2.5`：每卡 `overflow-hidden rounded-xl border border-app-line bg-app-card cursor-pointer active:bg-app-accent/50`：
   - 檐线 `h-1.5 w-full bg-[#1A1915]`
   - 元信息行 `px-2.5 pt-2 flex items-center gap-1.5`：ToolIcon size14 + 工具名 text-[10px] text-app-mut + 项目名 mono text-[10px] text-app-mut + `ml-auto` 时间 mono（`14:32` 等，PHONE_META 数据）+ 垃圾桶（TrashIcon 按钮小号，aria=demo.phone.delete，`stopPropagation` → `setRemote({ deleted:[...deleted, id] })`）
   - 粗标题 `px-2.5 mt-1 text-sm font-semibold text-app-ink`（i18n `demo.phone.title.{id}`）
   - 两行摘要 `px-2.5 mt-0.5 line-clamp-2 text-[11px] leading-snug text-app-mut`（`s.messages.join("\n")`）
   - 状态 pill `m-2.5 mt-1.5 inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium`：waiting→`bg-red-500/10 text-red-600` demo.pill.waiting；running→`bg-yellow-500/15 text-yellow-700` demo.pill.running；idle→`bg-green-500/10 text-green-700` demo.pill.idle
   - `onClick` → `setRemote({ page: "detail" })`
5. 列表 = `Object.values(sessions).filter(未 deleted && (!filter || tool===filter))`

`PHONE_META: Record<string, { time: string }>` 本文件常量（claude 14:32 / codex 13:05 / kimi 11:47 / workbuddy 14:10 / zcode 09:58）。新图标（Plus/History/Volume/Moon/Trash/ArrowLeft/RefreshCw/Send/Paperclip/FileText）加进 `src/components/Icons.tsx`（手绘线性风格与既有一致）。

- [x] **Step 30.3: RemoteDetail.tsx（详情页 + 五交互，对照 remote-detail-tui.png 左半）**

结构（PhoneFrame 内容；空间不足整体 `overflow-y-auto`）：

1. 头部 `flex items-center gap-2`：← 钮（aria=demo.phone.back → `setRemote({ page:"board" })`）+ 标题（`demo.phone.title.claude`=持仓）text-sm font-semibold + meta `Claude · 4d244680` mono text-[10px] text-app-mut + 绿点 `h-1.5 w-1.5 bg-green-500` + `100%` text-[10px] text-app-mut + `ml-auto` 刷新钮（RefreshCwIcon aria=demo.phone.refresh，点击图标转一圈动画反馈）
2. **计划模式 banner**（planMode 时，置于头部下）：`rounded-lg bg-bdg-y px-2.5 py-1.5 text-[11px] text-bdg-y-t`：`{t("demo.remote.planBadge")} · {t("demo.remote.planDesc")}`
3. 总结模式条：`rounded-lg bg-app-accent px-2.5 py-1.5 text-[11px] text-app-mut`：`{t("demo.phone.collapsed",{count:1})}` + 右侧「展开全部/收起」按钮（demo.phone.expandAll ↔ toggle thinkingExpanded）
4. 思考折叠卡：折叠态 `✻ {t("demo.phone.thinking")}（已折叠）` text-[11px] text-app-mut；展开态 3 行 dim 过程文本（硬编码：`读取持仓快照… / 计算止盈线偏移… / 生成调整方案`）
5. 聊天区 `space-y-2`：用户气泡 `ml-auto max-w-[80%] rounded-2xl rounded-br-md bg-app-btnp px-3 py-1.5 text-xs text-white` + queued 时气泡下 `已排队`（demo.phone.queued）text-[10px] text-app-mut text-right；助手气泡 `mr-auto max-w-[85%] rounded-2xl rounded-bl-md border border-app-line bg-app-card px-3 py-2 text-xs text-app-ink whitespace-pre-line`（text 含 `\n•` 列表）
6. **审批红卡**（approval==="pending"）：`rounded-xl border border-red-500/40 bg-red-500/5 p-2.5`：标题（demo.phone.banner）text-xs font-semibold text-red-600 + 命令 mono `git commit -m 'feat: remote approve'` text-[11px] text-app-mut + 按钮排：允许（`flex-1 rounded-lg bg-app-btnp py-1.5 text-xs font-semibold text-white` → `setRemote({approval:"approved"})` + `setStateOf("claude","running")`）/ 拒绝（`flex-1 rounded-lg border border-app-line py-1.5 text-xs text-app-ink` → 仅收卡 `approval:"none"`）。approved 后原位换 `✓ {t("demo.phone.approve")} — {t("demo.caption.running")}` 绿字行
7. **题卡**（question 非空且未 submitted；submitted 后折叠为一行「已提交：xxx」demo.remote.submitted）：`rounded-xl border border-app-line bg-app-card p-2.5`：题干（demo.remote.singleQ/multiQ）text-xs font-medium + 选项（single：radio 语义按钮排，`aria-pressed`，选中 `border-app-btnp bg-app-accent/50`；multi：checkbox 语义，方框图标）+ 提交钮（demo.remote.submit，picked 非空才可用）。选项数据硬编码：single `["npm","pnpm","GitHub Release"]`、multi `["摘要","风险","用量","待办"]`
8. **文件预览面板**（files 时，聊天区上方插入）：`rounded-xl border border-app-line bg-app-card overflow-hidden`：头行（FolderIcon + demo.remote.files + 右侧关闭钮 demo.remote.close → `files:false`）+ `flex`：左迷你文件树（`src/remote/approve.rs` 高亮 `bg-app-accent text-app-ink font-medium`，另有 `src/remote/mod.rs` / `src/main.rs` / `Cargo.toml` dim，w-1/2 text-[10px] mono p-2）+ 右着色 diff（`w-1/2 p-2 font-mono text-[10px] leading-relaxed`：`+` 行 `text-emerald-700 bg-emerald-500/10`、`-` 行 `text-red-600 bg-red-500/10`、上下文行 text-app-mut；内容硬编码 6-8 行 approve.rs 改动）
9. 底部：chips 排 `flex gap-1.5`：完全信任（toggle chip，aria-pressed，本地 state）+ 切换模式（→ `setRemote({ planMode: !planMode })`）；输入行 `flex gap-1.5`：`flex-1 rounded-full border border-app-line bg-app-card px-3 py-1.5 text-xs` input（placeholder=demo.phone.inputPlaceholder，Enter 提交）+ 发送钮 `h-7 w-7 shrink-0 rounded-full bg-app-btnp text-white flex items-center justify-center`（SendIcon aria=demo.phone.send）。提交：`setRemote({ messages:[...messages, {role:"user", text, queued:true}] })` 后清空输入

- [x] **Step 30.4: steps-d2 v2 + RemoteScene 重写 + 触发排**

`steps-d2.ts`（enter 全绝对值；`R()`/`S()` 取 getState）：

```ts
const B = { page:"detail", thinkingExpanded:false, deleted:[], filter:null } as const;
export const d2Steps: Step[] = [
  { dur: 2600, enter: () => { R()({ ...BASE, messages: SEED_MSGS, approval:"none", question:null, files:false, planMode:false }); setStateOf("claude","waiting"); },
    label:{ zh:"远程看板页：状态 pill 一眼分区", en:"Remote board: pills sort the field at a glance" }, detailKey:"demo.detail.d2s1" },
  { dur: 2400, enter: () => R()({ ...B, messages: SEED_MSGS, approval:"pending", question:null, files:false, planMode:false }),
    label:{ zh:"点卡进详情——审批红卡已就位", en:"Tap in — the red approval card is waiting" }, detailKey:"demo.detail.d2s2" },
  { dur: 2800, enter: () => { R()({ ...B, messages: SEED_MSGS, approval:"approved", question:null, files:false, planMode:false }); setStateOf("claude","running"); },
    label:{ zh:"「允许」——终端 ✓ Approved 续跑", en:"Allow — the terminal prints ✓ Approved" }, detailKey:"demo.detail.d2s3" },
  { dur: 2800, enter: () => R()({ ...B, messages:[...SEED_MSGS, QUEUED_MSG], approval:"approved", question:null, files:false, planMode:false }),
    label:{ zh:"发消息：气泡「已排队」，终端回显输入行", en:"Send: bubble queued, terminal echoes the input line" }, detailKey:"demo.detail.d2s4" },
  { dur: 2600, enter: () => R()({ ...B, messages:[...SEED_MSGS, QUEUED_MSG], approval:"approved", question:{kind:"single",picked:"pnpm",submitted:true}, files:false, planMode:true }),
    label:{ zh:"计划模式：banner 亮起，底行切换", en:"Plan mode: banner on, mode line switches" }, detailKey:"demo.detail.d2s5" },
  { dur: 2600, enter: () => R()({ ...B, messages:[...SEED_MSGS, QUEUED_MSG], approval:"approved", question:{kind:"multi",picked:["摘要","用量"],submitted:true}, files:false, planMode:true }),
    label:{ zh:"题卡：单选/多选点选提交", en:"Question cards: pick and submit" }, detailKey:"demo.detail.d2s6" },
  { dur: 2600, enter: () => { R()({ ...B, messages:[...SEED_MSGS, QUEUED_MSG], approval:"approved", question:{kind:"multi",picked:["摘要","用量"],submitted:true}, files:true, planMode:true }); setStateOf("claude","idle"); },
    label:{ zh:"文件预览：文件树 + 着色 diff", en:"File preview: tree + colored diff" }, detailKey:"demo.detail.d2s7" },
];
export const d2Reset = () => { useDemo.setState({ remote: { page:"board", filter:null, deleted:[], approval:"none", planMode:false, question:null, files:false, thinkingExpanded:false, messages: SEED_MSGS } }); setStateOf("claude","waiting"); };
```

（`B` 为 detail 页公共底值常量，每个 enter 显式补全 approval/question/files/planMode/messages 全键，防止 patch 漏键；实现时以 store 初始值为准导出。）

`RemoteScene.tsx` 重写：

```tsx
<DesktopStage>
  {/* 手动触发排（D4 先例）：五个小按钮 */}
  <div className="mb-3 flex flex-wrap gap-2">
    {TRIGGERS.map(…)}   // app 令牌小按钮：t.approval/t.send/t.plan/t.question/t.files
  </div>
  <div className="grid items-start gap-6 p-2 md:grid-cols-[360px_minmax(0,1fr)]">
    <PhoneFrame>{remote.page === "board" ? <RemoteBoard /> : <RemoteDetail />}</PhoneFrame>
    <ClaudeTui mode="session" className="md:mt-6"
      userMsg={[...remote.messages].reverse().find(m => m.role === "user")?.text ?? "HI"}
      extraLines={tuiLines(remote, claude.state)}
      waiting={remote.approval === "pending"}
      modeLine={remote.planMode ? "» plan mode on (shift+tab to cycle) · < for agents" : undefined}
      toast={claude.state === "idle" ? { title: "Claude", body: "持仓 · 空闲" } : null} />
  </div>
</DesktopStage>
```

`tuiLines`（联动，硬编码英文）：approval pending → `[warn "⏸ Permission needed: git commit -m 'feat: remote approve'", dim "  waiting for approval…"]`；approved → 追加 `[ok "✓ Approved from Tuvis Remote — resuming", dim "  committing changes…"]`；每条 queued 消息 → `[cmd "> 把止盈线统一上调 15%", dim "  queued — terminal busy"]`。触发排行为：t.approval → `R()({page:"detail",approval:"pending"})` + claude waiting；t.send → append QUEUED_MSG；t.plan → toggle planMode；t.question → 循环 single(未答)→multi(未答)→null；t.files → toggle files。`md:grid-cols-[360px_…]`（看板页比旧单卡宽）。

- [x] **Step 30.5: player.test 追加 d2 终态断言 + i18n + 验证**

seek 用例追加：`d2 = renderHook(() => useScriptPlayer(d2Steps, d2Reset)); act(() => d2.result.current.seek(6))` → `expect(useDemo.getState().remote.files).toBe(true)`、`remote.question?.submitted === true`、`remote.messages` 含 queued 项。i18n +40/改值 5。

```bash
pnpm exec tsc --noEmit && pnpm test   # Expected: 21 passed（断言追加不新增用例）
pnpm build && pnpm dev
# 核对：看板页对照 phone-board.png（页头 v0.5.6/MateBook16s、四钮、chips、檐线卡、三种 pill 色）；
# 点卡→详情；审批 pending 红卡→允许→TUI ✓ Approved + 灯转黄；拒绝只收卡；
# 发消息：气泡上屏+已排队，TUI 出现 "> 把止盈线统一上调 15%" 输入行；
# 计划模式 banner + TUI 底行切 plan mode on；单选（选 pnpm 提交）/多选（勾两项提交）折叠为已提交行；
# 文件预览：树高亮 approve.rs + diff 绿增红删；五触发排手动全可走；播完回绕回看板页；claude 终态 idle + TUI toast 出现
```

**验收标准：** 看板页/详情页结构与两张基准图逐项对上（页头三件套/四钮/檐线/pill 三色；返回/总结条/气泡方向/底部 chips+输入）；五交互剧本 + 手动双通道全通；TUI 联动四项（输入行/✓ Approved/plan mode 底行/toast）验证；21 测试绿；parity 绿（193 key）。

---

## P9-C · D3 真资源 UI

### Task 31: D3 资源管理真 UI 重写（勾选矩阵/预设组废弃）

**Files:**
- Modify: `src/demo/scenes/ResourcesScene.tsx`（整体重写）`src/demo/steps-res.ts`（label 三段）`src/i18n/{zh,en}.json`（+17 key、改值 4 处）

- [x] **Step 31.1: ResourcesScene 重写（对照 resources.png）**

数据模型（本文件顶部常量，本地 state）：

```ts
const MATRIX_TOOLS = ["claude", "codex", "opencode", "kimi", "zcode"] as const;   // 图中五列
interface SkillRow { id: string; on: Record<string, boolean>; pinned: Record<string, boolean> }
const SKILL_ROWS: SkillRow[] = [   // 名字取自用户真实仓库（resources.png 可见项），8 行
  { id: "ts-sdk-author",     on: { claude: true,  codex: true,  opencode: false, kimi: false, zcode: true  }, pinned: { claude: true, zcode: true } },
  { id: "ui-ux-pro-max",     on: { claude: true,  codex: false, opencode: false, kimi: false, zcode: false }, pinned: { claude: true } },
  { id: "信评-调卷流水线",    on: { claude: true,  codex: true,  opencode: false, kimi: true,  zcode: false }, pinned: {} },
  { id: "python-design",     on: { claude: false, codex: false, opencode: true,  kimi: false, zcode: false }, pinned: {} },
  { id: "contribute",        on: { claude: true,  codex: false, opencode: false, kimi: false, zcode: false }, pinned: { claude: true } },
  { id: "pr-review",         on: { claude: false, codex: true,  opencode: false, kimi: true,  zcode: true  }, pinned: {} },
  { id: "quant-chart",       on: { claude: true,  codex: true,  opencode: true,  kimi: true,  zcode: true  }, pinned: { kimi: true } },
  { id: "doc-writer",        on: { claude: false, codex: false, opencode: false, kimi: false, zcode: true  }, pinned: {} },
];
const SKILL_TOTAL = 73;   // 图中计数（demo 只陈列 8 行，折叠头照显 73）
```

结构（WindowFrame 标题 `demo.win.resources` 不变，窗内 `p-4 space-y-4`）：

1. **体检卡** `flex items-center gap-3 rounded-xl border border-app-line bg-app-card p-3`：♥ 图标（HeartIcon 手绘，`text-green-500`）+ `{t("res.health")} / {状态文案}`（idle=`res.healthOk` text-app-ink、checking=`res.checking` text-app-mut）+ `ml-auto` 立即体检钮（`rounded-lg border border-app-line px-3 py-1 text-xs hover:bg-app-accent/50`，aria；点击 → checking 1s → healthOk，B20）
2. **工具行** `flex items-center justify-between`：左 segmented toggle 按资源/按工具（两枚连体钮 `rounded-lg border border-app-line overflow-hidden flex`，选中 `bg-app-btnp text-white`，`aria-pressed`，view 本地 state `"resource" | "tool"`）；右 扫描原生资源钮（`res.scan` 改值后文案，点击 → 按钮文案闪 `扫描中…`？**用 title=demo.na + disabled 静态**——决策把「扫描原生资源」列为存在元素、操作清单未含，B19 处理：静态 disabled + title）
3. **兔维斯仓库大卡** `rounded-xl border border-app-line bg-app-card p-4 space-y-3`：
   - 卡头 `flex flex-wrap items-center gap-2`：`{t("res.repo")}` text-sm font-semibold text-app-ink + 目录 chips（`兔维斯仓库` 选中态 / `~/.agents` 未选中，样式同 ToolChip app 版，本地 state 可切换选中样式）+ `ml-auto` 从 Manifest 安装钮（静态 disabled + title=demo.na，B19）
   - 说明行 `text-[11px] leading-relaxed text-app-mut`：`res.repoDesc`
   - 搜索框 `flex items-center gap-2 rounded-lg border border-app-line px-2.5 py-1.5`：SearchIcon size13 + input（placeholder=`res.searchPlaceholder`，本地 query state，`aria-label` 同 placeholder）
   - **Skill (73) 折叠头** `flex items-center gap-1.5 text-xs font-medium text-app-ink cursor-pointer select-none`：PackageIcon（手绘）+ `{t("res.skillCount",{count:SKILL_TOTAL})}` + ChevronDown（collapsed 时 -rotate-90；点击 toggle 折叠，折叠时表格不渲染）
   - **表格**（view==="resource"）：`w-full text-xs`，表头行 `border-b border-app-line text-app-mut`：`{t("res.colName")}` + ⇅ 排序钮（aria=`res.sortByName`，本地 `"asc"|"desc"` 切换，名字列按 id localeCompare 排）+ 5 工具列头（ToolIcon size13 + toolOf label，`text-center`）；数据行 `border-b border-app-line last:border-0`：
     - 名字单元格 `flex items-center gap-1.5 py-1.5 font-mono text-[11px] text-app-ink`：skill id + TrashIcon 红色小钮（`text-red-500/70 hover:text-red-600`，aria=`res.deleteSkill`，点击行删除——本地 rows state 移除）
     - 行内「全部启用」标签（紧跟名字格尾部）：小文字钮 `text-[10px] text-app-mut hover:text-app-ink underline underline-offset-2`，点击该行五工具全 on（`aria-label={t("res.allOn")}`）
     - 每工具格 `py-1.5 text-center`：按钮内 ToolIcon size15——on：原色（ToolIcon 天然彩色）+（pinned[tool] 时图标下方 `常驻` text-[9px] text-app-mut）；off：`opacity-30 grayscale`；点击 toggle `on[tool]`，`aria-pressed` + `aria-label={`${skill}:${tool}`}`（同 P4 矩阵 a11y 口径）
   - **按工具视图**（view==="tool"）：五个分组，每组头（ToolIcon + 工具名 + 该工具已派发数 `text-app-mut`）+ 该工具 on 的 skill 名 chip 列表（`font-mono text-[11px]`，pinned 的带 `常驻` 角标）；与表格共用同一 rows state（切视图不丢数据）
4. `PlayerFrame` 包裹不变（`resSteps` 无 enter/reset 语义不变）

旧 SKILLS/PRESETS/checked 体检阈值逻辑整体删除（决策 4 废弃）。

- [x] **Step 31.2: steps-res label 三段 + i18n + 验证**

label 改为：①「统一仓库：兔维斯仓库 + ~/.agents + Manifest」②「点亮 = 已派发；灰 = 不注入；点图标切换」③「体检 + 按资源/按工具双视图」（en 对应），detailKey 走改值后的 d3s1-3。i18n +17/改值 4。

```bash
pnpm exec tsc --noEmit && pnpm test && pnpm build
pnpm dev
# 核对：对照 resources.png 逐项——体检卡（♥+一切正常+立即体检+点击反馈）、toggle、扫描钮（静态）、
# 仓库卡（搜索/两 chips/Manifest 钮/说明行/Skill (73) 折叠/表头 名字⇅+五工具/行内红色垃圾桶+全部启用/
# 点亮图标带常驻、灰图标可点亮）；搜索过滤、排序切换、折叠展开、按工具视图分组；旧勾选矩阵/预设组无残留
```

**验收标准：** 与 resources.png 结构逐项对上（六要素齐：体检卡/toggle/扫描/仓库卡/折叠头/矩阵表）；全部可操作项（图标点切、搜索、排序、全部启用、垃圾桶、折叠、视图切换、立即体检、目录 chips）行为正确；`grep -n "PRESETS\|preset" src/demo/scenes/ResourcesScene.tsx` 零命中；21 测试绿；parity 绿（210 key）。

---

## P9-D · D4 拖动跑动 + 账本复原

### Task 32: D4 拖动方向跑动动画 + 账本 usage.png 完整复原（ledgerData v3）

**Files:**
- Modify: `src/demo/petAnimations.ts` `src/demo/scenes/PetUsageScene.tsx` `src/demo/ledgerData.ts` `src/demo/ledgerData.test.ts` `src/demo/LedgerSection.tsx` `src/i18n/{zh,en}.json`（+11 key、改值 9 处）

- [x] **Step 32.1: petAnimations 加跑动行（mam-worktree petAnimations.ts:22-23 同源）**

```ts
export type PetAnim = "idle" | "run-right" | "run-left" | "waving" | "jumping" | "failed" | "waiting";
export const ANIM: Record<PetAnim, { row: number; d: number[] }> = {
  idle:       { row: 0, d: [280, 110, 110, 140, 140, 320] },
  "run-right": { row: 1, d: [120, 120, 120, 120, 120, 120, 120, 220] },
  "run-left":  { row: 2, d: [120, 120, 120, 120, 120, 120, 120, 220] },
  waving: { row: 3, d: [140, 140, 140, 280] },        // 其余不变
  jumping: { row: 4, d: [140, 140, 140, 140, 280] },
  failed: { row: 5, d: [140, 140, 140, 140, 140, 140, 140, 240] },
  waiting: { row: 6, d: [150, 150, 150, 150, 150, 260] },
};
```

（两宠物 r0–r8 行映射一致，rows 9/11 均含 r1/r2，不越界。）

- [x] **Step 32.2: PetUsageScene 拖动跑动（方向感知）**

`onPointerMove` 扩展（拖动中才判）：记录 `lastX`，`dx = e.movementX`；`|dx| >= 2` 且方向变化时 `setAnim(dx > 0 ? "run-right" : "run-left")`（避免每帧 setState：仅当目标动画 ≠ 当前才切）。`onPointerUp/Cancel`：若 `anim` 为跑动则 `setAnim("idle")`（松手回 idle，决策 5）；waiting/jumping 触发链路不动。帧计时器沿用 `def[frame.current]` 节拍（跑动帧 120ms 自然快放）。

- [x] **Step 32.3: ledgerData v3（完整替换，token 口径）**

```ts
export interface DistRow { name: string; tokens: number }

export const LEDGER = {
  metrics: {
    inputEst: 608,                 // 用户输入（估）· 含子代理（渲染加 "~" 前缀）
    output: 17_951_000,            // 1795.10万
    reqInput: 4_374_410_324,       // 43.74亿
    cacheHit: 4_258_000_000,       // 42.58亿
    requests: 20_515,
    asOf: "2026-10-11 15:43:01",
  },
  deltas: {   // 环比（数据值，硬编码）
    inputEst: "+337.4%", output: "+103.6%", reqInput: "+136.5%",
    cacheHit: "+135.1%", hitRate: "-0.6 pt", requests: "+166.3%", trend: "+136.3%",
  },
  byTool: [   // 三维合计 === totalTokens（不变式守护）
    { name: "Claude Code", tokens: 1_860_000_000 }, { name: "Codex", tokens: 920_000_000 },
    { name: "Kimi Code", tokens: 640_000_000 }, { name: "ZCode", tokens: 530_000_000 },
    { name: "WorkBuddy", tokens: 290_000_000 }, { name: "dsh", tokens: 152_361_324 },
  ],
  byProject: [
    { name: "tuvis-app", tokens: 2_140_000_000 }, { name: "tuvis-site", tokens: 1_120_000_000 },
    { name: "quant-chart", tokens: 780_000_000 }, { name: "landing", tokens: 352_361_324 },
  ],
  bySupplier: [
    { name: "Anthropic · claude-sonnet-4.5", tokens: 1_620_000_000 },
    { name: "OpenAI · gpt-5.2-codex", tokens: 920_000_000 },
    { name: "Moonshot · kimi-k2-thinking-turbo", tokens: 640_000_000 },
    { name: "Zhipu · glm-5.2", tokens: 530_000_000 },
    { name: "Anthropic · claude-opus-4.1", tokens: 310_000_000 },
    { name: "others", tokens: 372_361_324 },
  ],
  work: {   // 不变（mono 数据硬编码英文）
    agents: "6 active · 2 queued", sessions: 128,
    turns: "claude 342 · codex 118 · kimi 47",
    errors: "0 fatal · 2 retry · 1 timeout · 1 abort",
    longest: "p50 42s · max 316s",
    calls: "Read 210 · Edit 96 | Bash 54 · Grep 38",
  },
} satisfies {
  metrics: { inputEst: number; output: number; reqInput: number; cacheHit: number; requests: number; asOf: string };
  deltas: Record<string, string>;
  byTool: DistRow[]; byProject: DistRow[]; bySupplier: DistRow[];
  work: Record<string, string | number>;
};

/** 大数字口径 = 请求输入 + 产出（usage.png 副标）：4,392,361,324 */
export const totalTokens = (m: typeof LEDGER.metrics) => m.reqInput + m.output;
/** 命中率口径 v3 = cacheHit / reqInput（对齐真图 97.3%，B17） */
export const hitRate = (m: typeof LEDGER.metrics) => m.cacheHit / m.reqInput;

/** 千分位：4392361324 → "4,392,361,324" */
export const formatInt = (v: number) => v.toLocaleString("en-US");
/** 中文单位（B18）：≥1亿 → "43.74亿"（两位小数）；≥1万 → "1795.10万"；否则原数 */
export function formatCN(v: number): string {
  if (v >= 1e8) return `${(v / 1e8).toFixed(2)}亿`;
  if (v >= 1e4) return `${(v / 1e4).toFixed(2)}万`;
  return String(Math.round(v));
}

/** Catmull-Rom → 三次贝塞尔平滑路径（零依赖，真图圆滑曲线） */
export function smoothPath(pts: { x: number; y: number }[]): string {
  if (pts.length < 2) return "";
  let d = `M${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] ?? p2;
    d += ` C${(p1.x + (p2.x - p0.x) / 6).toFixed(1)},${(p1.y + (p2.y - p0.y) / 6).toFixed(1)}`
       + ` ${(p2.x - (p3.x - p1.x) / 6).toFixed(1)},${(p2.y - (p3.y - p1.y) / 6).toFixed(1)}`
       + ` ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
  }
  return d;
}

/** 近 7 天（默认范围）日 token 量 + 命中率 + 日期标签（合计 === totalTokens，峰值 15.68亿） */
export const TREND: { labels: string[]; tokens: number[]; hit: number[] } = {
  labels: ["10/5", "10/6", "10/7", "10/8", "10/9", "10/10", "10/11"],
  tokens: [412_000_000, 486_000_000, 524_000_000, 455_000_000, 562_000_000, 1_568_000_000, 385_361_324],
  hit: [0.968, 0.971, 0.966, 0.970, 0.974, 0.978, 0.973],
};
```

数字自检（实现者复核）：output+reqInput = 4,392,361,324 ✓；cacheHit/reqInput = 0.9734 → "97.3%" ✓；TREND 合计 = 4,392,361,324 ✓、max = 1,568,000,000 = 15.68亿 ✓；三维各自合计 = 4,392,361,324 ✓（余数挂在尾行）。

- [x] **Step 32.4: ledgerData.test.ts v3（4 → 6 用例）**

```ts
describe("ledger v3 invariants", () => {
  const T = totalTokens(LEDGER.metrics);
  it("三个维度合计都等于 totalTokens", () => {
    for (const dim of [LEDGER.byTool, LEDGER.byProject, LEDGER.bySupplier])
      expect(sum(dim.map((r) => r.tokens))).toBe(T);
  });
  it("趋势 7 天且合计等于 totalTokens，峰值 = 15.68亿", () => {
    expect(TREND.tokens).toHaveLength(7);
    expect(sum(TREND.tokens)).toBe(T);
    expect(Math.max(...TREND.tokens)).toBe(1_568_000_000);
    for (const h of TREND.hit) { expect(h).toBeGreaterThan(0.95); expect(h).toBeLessThan(0.99); }
  });
  it("命中率口径 = cacheHit / reqInput ≈ 97.3%", () => {
    expect(hitRate(LEDGER.metrics)).toBeCloseTo(0.973, 2);
  });
  it("占比合计 ≈ 100%", () => {
    for (const dim of [LEDGER.byTool, LEDGER.byProject, LEDGER.bySupplier])
      expect(sum(dim.map((r) => (r.tokens / T) * 100))).toBeCloseTo(100, 3);
  });
  it("formatCN 三档 + formatInt 千分位", () => {
    expect(formatCN(4_374_410_324)).toBe("43.74亿");
    expect(formatCN(17_951_000)).toBe("1795.10万");
    expect(formatCN(608)).toBe("608");
    expect(formatInt(4_392_361_324)).toBe("4,392,361,324");
  });
  it("smoothPath：M 开头、n-1 段 C、无 NaN", () => {
    const d = smoothPath([{ x: 0, y: 0 }, { x: 10, y: 5 }, { x: 20, y: 3 }]);
    expect(d.startsWith("M0.0,0.0")).toBe(true);
    expect((d.match(/ C/g) ?? [])).toHaveLength(2);
    expect(d).not.toContain("NaN");
  });
});
```

- [x] **Step 32.5: LedgerSection 五处复原（usage.png）**

保持「真窗 + 固定高度内滚 + 吸顶」骨架，改动五处：

1. **窗头**：吸顶头之上加标题条 `flex h-9 items-center border-b border-app-line bg-app-bg px-3`：左红绿灯（装饰 aria-hidden，同 WindowFrame 灯位）+ 居中 `{t("usage.title")}`（改值=用量看板）text-[11px] font-medium text-app-mut + 右侧两钮（Maximize2Icon/CloseIcon 手绘 12px，`aria-label=usage.win.max/close`，**disabled + title=demo.na** 静态，B19）
2. **吸顶头**：范围 chips 五档**默认 `last7d`**（`useState<RangeKey>("last7d")`）+ chips 下一行导出排：五钮 `usage.export.*`（`rounded-md border border-app-line px-2 py-0.5 text-[11px] text-app-mut`，全部 disabled + title=demo.na 照图排布）+ 页签行改两枚：看板（选中 `border-b-2 border-app-ink`）+ 记录（`text-app-mut/50 cursor-not-allowed` disabled + title=demo.na）
3. **概要卡**：大数字 `formatInt(totalTokens(M))` `text-[32px] font-semibold tabular-nums text-app-ink leading-tight` + 副标 `usage.summary.subtitle` text-xs text-app-mut + **两列指标网格** `grid grid-cols-2 gap-x-6 gap-y-2.5`（每格：标签 `text-[11px] text-app-mut` / 值 `text-sm font-semibold tabular-nums text-app-ink` / 环比 `text-[10px]`——deltas 以 `+` 开头 `text-green-600`、`-` 开头 `text-red-600`；值渲染：inputEst `~{formatCN(608)}`、output/reqInput/cacheHit `formatCN`、hitRate `{(hitRate*100).toFixed(1)}%`、requests `formatInt`）+ 数据截止时间整行（标签 + mono 值）+ 页脚 `usage.note`（改值后口径行）`text-[10px] text-app-mut`
4. **趋势卡**：卡头 `flex items-baseline justify-between`——左 `{t("usage.trend")}`（改值=用量趋势）text-sm font-semibold；右 `text-[10px] text-app-mut`：`{t("usage.peak")} {formatCN(1_568_000_000)} / {t("usage.rangeTotal")} {formatCN(totalTokens(M))} ({LEDGER.deltas.trend})`。SVG：线 `d={smoothPath(pts)}`（**替换 linePath 折线**，B17 同任务落地）；面积 `smoothPath + 底边闭合`；数据点/渐变/参考线/x 轴 7 标签全显（7≤14 不抽稀）沿用现有实现；hover tooltip 值改 `formatCN(TREND.tokens[i])` + 命中率
5. **分布卡 + 工作小结**：结构不动，值列 `$${usd}` 改 `formatCN(tokens)`；占比条分母改 totalTokens

`DemoPage.tsx` 外层 h2 用 `usage.title`（改值自动生效），`#ledger` 锚点链路不动。删除 `tok()` 辅助（被 formatCN 取代）。

- [x] **Step 32.6: i18n + 验证**

```bash
pnpm exec tsc --noEmit && pnpm test   # Expected: 21 - 4(旧 ledger) + 6(v3) = 23 passed
pnpm build && pnpm dev
# 核对：D4 水平拖动宠物朝拖动方向跑（右拖 run-right/左拖 run-left，帧率流畅）、松手回 idle、
# waiting/jumping 按钮链路不回归；账本对照 usage.png——窗头标题+右上两钮、范围默认近 7 天、导出五钮照排、
# 记录置灰、大数字 4,392,361,324 千分位、副标、两列六指标（~608/1795.10万/43.74亿/42.58亿/97.3%/20,515）
# 环比红绿、数据截止时间行、口径页脚、趋势卡右上 峰值 15.68亿/区间合计 43.92亿 (+136.3%)、
# 曲线圆滑无折角、数据点、x 轴 10/5–10/11、蓝渐变面积、hover 出中文单位 tooltip；三维分布值列万/亿
```

**验收标准：** 拖动跑动两方向 + 回 idle + 既有触发不回归；账本五处与 usage.png 逐项对上（数字逐一命中规格表）；六条不变式测试绿（23 测试）；parity 绿（221 key）。

---

## P9-E · 全站验收

### Task 33: 全站验收（A11y ≥ 95 + 五窗/五交互/资源矩阵 + 回归）

**Files:**
- Modify: `docs/superpowers/plans/progress.md`（最终验收报告，控制方写）；发现缺陷最小修复另起 commit

- [x] **Step 33.1: 机器验证全绿**

```bash
pnpm exec tsc --noEmit && pnpm test    # Expected: 23 passed
pnpm build                             # tsc 零错误 + dist/404.html 生成
grep -riE "analytics|gtag|hotjar|plausible|umami" dist/ || echo "zero-tracking ok"
grep -rn "app-bg\|app-ink\|app-line" src/home/ src/components/ | grep -vE "BrowserFrame|ScrollManager" || echo "app-tokens scoped ok"
grep -rn "dark:" src/ | grep -vE "ToolIcon" || echo "no new dark: utilities"
grep -rn "PRESETS\|claudeTerm\|codexApp" src/demo/ || echo "p8-p9 schema cleanup ok"
```

- [x] **Step 33.2: 滚动与导航回归（zh/en 各一遍）**

- [x] 首页各滚动深度点「查看演示」（4 卡）/「打开完整演示」→ /demo 顶部到达
- [x] `demo#d1..#d4` 直达对应场景；顶栏/页脚路由切换回顶；语言切换回顶；后退前进行为正常（无报错）
- [x] `/zh /en /docs /changelog /demo` 五页正常渲染

- [x] **Step 33.3: 交互矩阵（pnpm preview 逐项勾）**

- [x] 通用（每场景）：初始静止；播放/暂停/续播；seek+重放；hover 说明（zh/en）；播完回绕；固定高度内滚；交互即暂停
- [x] D1 五窗：剧本七段逐窗核对（Claude session 态/Codex/Kimi/WorkBuddy/ZCode 对照 tool-ui 三图）；手动五卡开窗互斥切换；红灯关窗；通知链路；X 收起；chips 筛选；四新窗拖动横滚 + 右键菜单
- [x] D2 五交互：剧本七段 + 触发排五钮手动双通道；审批→TUI ✓ Approved；发消息→终端输入行；计划模式→底行切换；单选/多选提交折叠；文件预览树+diff；垃圾桶移卡；看板↔详情往返；claude 终态 idle + TUI toast
- [x] D3：图标点切（灰↔亮）、搜索过滤、名字排序、全部启用、垃圾桶删行、折叠 Skill (73)、按资源/按工具视图、立即体检反馈、目录 chips 切换
- [x] D4：拖动方向跑动/回 idle；宠物切换（动画/静音）；三段剧本；hover 浮窗→#ledger
- [x] 账本：默认近 7 天；范围五档；导出五钮/放大关闭/记录 disabled+title；大数字与六指标值逐一命中；趋势平滑曲线+hover；三维切换中文单位
- [x] 375px：四场景+账本单列不溢出；D2 详情页内滚；tooltip 不出界
- [x] 键盘：Tab 可达播放钮/每段/五窗红灯/五交互全部控件；Enter/Space 触发；Focus 出详细说明

- [x] **Step 33.4: Lighthouse 复测（Chrome DevTools，/zh/ 与 /zh/demo）**

- 记录 Performance / Accessibility 分数进 progress.md
- **硬门槛：Accessibility ≥ 95**（不达标必须修；重点复查：新四窗 mono 小字对比度、disabled 按钮可读性、pill 色对比（红/黄/绿三 pill 已按 P8 修正色板）、toast/状态栏文字）
- Performance ≥ P8 基线；四个新组件为纯静态 DOM，无新增大资产

- [x] **Step 33.5: 终验收 + 总报告（控制方）**

```bash
git add -A && git commit -m "chore: p9 acceptance pass"
# progress.md 追加 P9 总报告：任务/commit 对照表、测试计数（23）、i18n 终值（221 key）、
# Lighthouse 分数、WorkBuddy 近似稿状态（待用户截图替换）、遗留观察项
```

**验收标准（P9 完成的定义）：** 机器验证五条全绿（23 测试 / build / 零追踪 / app 令牌作用域 / 旧 schema 清零）；33.2 滚动回归 3 项全勾；33.3 交互矩阵 7 组全勾；A11y ≥ 95；六条主线逐一闭环（路由回顶 / D1 五原生窗+ClaudeTui 完整态 / D2 完整页五交互联动 / D3 真资源 UI / D4 拖动跑动 / 账本真窗复原）；progress.md 有 P9 总报告。

---

## 交接备注（P10 及以后候选池）

- WorkBuddyTui 为近似稿：用户提供官方截图后整文件替换（文案已集中在常量区），届时 T33 验收项补一条对照
- 账本「记录」页签、真实导出（复制文本/CSV）仍为静态 disabled——需求复活时从 usage.png 反推数据结构
- Codex 窗可扩展 Updated Plan 交互态（勾选推进），当前静态清单即止
- D2 远程看板页四钮中「新建/历史」为演示占位，真产品语义接入时再设计
- hero-poster.png 压缩（二期 E7）继续挂账
