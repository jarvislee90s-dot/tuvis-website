# Tuvis 官网 P10 计划（首页 CC Switch 化 + 演示最终化 · 三 APP 窗 · TUI 场景 · 桌宠扩展 · 账本五档）

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 基于 P9 成品（main @ 11e2459，23 测试全绿，222 i18n key，工作区干净）落地六条主线：① 首页 CC Switch 式重构——Hero 重排（左列版本徽章 + 大标题 + slogan + 描述 + 双 CTA + 三色小灯行 + 200px 级海报缩略，右列主看板实时窗复用 AppBoard + 窗下「打开完整演示」链接，整体放宽 max-w-7xl）、StatesSection 删除（三灯并入 Hero，state-*.png 保留 public）、新增「没有兔维斯 vs 有兔维斯」工作流对比区（左 5 步红系痛点 / 右 2 步绿系 + VS 分隔 + 底部兼容工具纯文字行，纯 CSS/图标零图表库）、故事区改造为上排 4 仪表卡美化版（仍链 demo#d1–d4）+ 下排 3 故事卡、首页新顺序 Hero → 对比区 → 你会这样用它 → 开源 → 下载；② D1 宽幅与工具窗 APP 化——演示区容器 max-w-7xl、左右两窗各约 4:3 双完整 macOS 壳窗（外层舞台定高防跳动、窗体自然高、移动端单列）、删 CodexCliTui/WorkBuddyTui/ZCodeIdeWindow，新建 CodexAppWindow（ChatGPT Work 侧栏 + 聊天主区）、WorkBuddyAppWindow（任务/空间双列表 + 对话区）、ZCodeTaskWindow（项目分组任务侧栏 + 事件流主面板）按 p10-ref 真截图 1:1 量化还原（左栏任务文案真实中文硬编码）、Kimi 保持 KimiShellTui、d1 剧本映射更新；③ D2 终端场景按真截图还原——控制方电脑操控采集 4 张 claude TUI 截图入 p10-ref，ClaudeTui 场景组件化（审批选项列表 / Ready to code? 计划选项 / 编号选项+描述+底行提示三场景，对照 claude-tui-multiselect.png），d2 剧本 s5–s7 节拍适配逐拍聚焦，D2 手机端固定高度内滚、D3 固定宽高核对；④ D4 宠物功能扩展——右键菜单（喂食/编辑行为/切换宠物/隐藏桌宠）+ 模拟配置面板（频率滑杆/语音开关/置顶开关，纯前端状态）+ 左侧两张常驻卡（在线仓库卡：贝贝✓/星黛露/雪团/煤球占位 + 一键导入动效；编辑行为卡），导入纯模拟不解析 zip；⑤ 账本范围数据——ledgerData 升 v4 五档数据集（近 7 天=现有真实数据不动，近 5 小时/当日/近 30 天合成自洽数据，自定义=近 30 天别名），范围 chips 切换概要/趋势/小结/分布全联动；⑥ 全站验收（A11y ≥ 95 + 交互矩阵 + Lighthouse + 总报告）。i18n 新增 35 key 双语同步、改值 7 处。

**Architecture:** 不改技术栈与路由结构。站点层：首页与 DemoPage 从「单一定宽 main」改为 per-section 容器（Hero/对比区/D1 用 max-w-7xl，其余保持 max-w-5xl，TopBar/Footer 与其他页面零改动）；StatesSection/FeaturesSection/BoardShowcase 三个 home 组件删除（三灯入 Hero、四仪表并入故事区、实时窗入 Hero）。演示层：新 `AppWindowShell`（三 APP 窗共用壳：红绿灯置于侧栏顶行 + 侧栏/主区双列，自然高度，无右键菜单/拖动——APP 语义非终端），CodexCliTui/WorkBuddyTui/ZCodeIdeWindow 三文件删除、由三个 APP 窗替换，D1Scene 双列网格 + 窗映射更新；ClaudeTui 增加 `scene` prop（session 默认 / approval / plan / select），场景块替换 Thought+Reply 区、extraLines 保留，RemoteScene 由 remote 态派生 scene，d2 s5–s7 enter 修订为逐拍聚焦；PhoneFrame 面板固定高度内滚；PetUsageScene 提升三控件本地 state 到场景级（右键面板与左侧卡共享）、右键菜单仿 TuiShell 模式；ledgerData v4：`LEDGERS: Record<RangeKey, LedgerDataset>`（metrics/deltas/三维/trend 全量 ×4 实体 + custom 别名），RangeKey 类型移入 ledgerData，LedgerSection 全卡片按 range 取数、峰值改派生、趋势标签 >14 点抽稀。

**Tech Stack:** 不变：pnpm · Vite 6 · React 19 · TypeScript 5.7 · Tailwind CSS v4 · react-router 7 · i18next · zustand 5 · framer-motion 12 · vitest + @testing-library/react（零新增包；对比区/宠物占位/五档数据纯手写）

**规格来源（还原唯一权威，已入本仓 `docs/design/p10-ref/`，当前 untracked 随 T34 首个 commit 一并纳入）：**
- `ccswitch-hero.png`（CC Switch 官网 hero 布局基准）：暖白底双列（左:右 ≈ 2:3）——左列上→下：细边框版本徽章胶囊、大标题（~48px 级粗体）、单行 slogan、两行描述、双 CTA 钮（深色实心主钮 + 描边次钮）、小尺寸指示灯行、竖版海报缩略（~200px 高、非大图）；右列：大幅应用窗（红绿灯 + 大窗身，占列宽 ~100%、高 ~520px 级、内部列表可滚），窗下引导链接；整段容器 max-w-7xl 级
- `codex-app-real.png`（Codex/ChatGPT Work 桌面端真截图）：亮色双列——侧栏（浅灰 `#F9F9F9`、约 200px）上→下：账户胶囊 `ChatGPT Work ▾`、搜索行、`New chat`、`Scheduled`、`Plugins`、`Projects` 组（tuvis-website：`$agnes-image…`/`测试`/`…任务树`；deepseek-harness：`帮我看一下…`/`帮我鉴定…`/`测试一下`/`你好`/`Show more`；Travel：`现在这个…`/`总结我项目…`/`…`）、`ApiMonitor`、footer `zhipu_glm`；主区：任务标题条（`这个项目的作用是什么来着？…` + ⋯ + 侧栏切换）、内容区 markdown 树状清单卡 + `几个说明` bullets、底部输入行（`Work with ChatGPT` + ＋ + 红字 `⚠ Full access` + `GLM-5.3-Flash High ▾` + 黑色 ↑ 圆钮）
- `workbuddy-real.png`（WorkBuddy 5.7.6 真截图）：亮色双列——侧栏：`WorkBuddy 5.7.6` 标题、`发现应用 ▾` 绿胶囊、导航 6 项（新建任务/助理 BETA/专家·技能·连接器/定时任务/资料库/更多·灵感）、`任务(3)` 组（规划信评报告更新工作流 9月6日 / 询问模型身份 9月6日 / 询问模型身份与种类 9月4日）、`空间(5)` 组（Test2·你是什么模型 10月4日 / 扬州新材料投资集…·终稿md最后一段加 9月10日 / CodexPlusPlus-VL… / 0807）、footer（李佳卫 + 铃铛 + headset）、`Buddy加油站 100 积分` 浮动卡；主区：标题条（`你是什么模型` + 搜索/分享/时钟/文档/侧栏五图标）、灰底右靠用户气泡、WorkBuddy 头像 + `已完成 15s ›` + 三段回复、操作图标排（复制/赞/踩/喇叭/重试/分享/⋯ + `共消耗 ◇3.08/Hy4 preview`）、输入行（`今天帮你做些什么？@ 添加上下文，/调用技能与指令` + ＋ + 红字 `⚠允许完全访问` + `Hy4 preview ▾` + 🎤 + 绿色 ↑ 圆钮）、页脚 `内容由 AI 生成，请核实重要信息`
- `zcode-real.png`（ZCode 任务窗真截图）：暗色双列——侧栏（`#1B1B22` 级、约 210px）：Z 蓝标 + ←/→、`新建任务 Ctrl+N`、`搜索 Ctrl+K`、自动化、插件市场、`# 分组/□项目` toggle、置顶任务（`Fork of 分析PR1550-继续追问 44天`）、三项目组（MultiAgents-Manager 5 任务 + mam-worktree2 4 任务 + tuvis-website 2 任务 + `显示更多`）、footer `Jarvis666 Pro` + 设置；主面板：任务标题栏（`📁 执行 tuvis-website executor-prompt 计划` + ⋯ + 📁▾ + 上传 + ? + 布局 + —□×）、事件流（🧠思考·持续了几秒 / ▢终端 curl 真实命令 / 🔍阅读 codex-cli-splash.png / 渲染 CodeBuddy 官网找 WorkBuddy 图·已完成 + 状态胶囊 + ↙执行 tuvis-website P7 重构计划）、底部输入（＋/🛡完全访问 ▾/🖥电脑操作/GLM-5.3-Flash ▾/🧠最高 ▾/↑ 黑圆钮）
- `claude-tui-multiselect.png`（Claude Code TUI 多选真截图）：※ 斜体回顾段 + 灰底高亮用户行 + hook error 树 + `Thought for 34s` + 高亮 chip（题目领域）+ 粗体问题 + 编号选项（选中行 `❯ 1. 金融/信用评级` 高亮 + 描述缩进）+ 底行 `Enter to select · ↑/↓ to navigate · Esc to cancel`
- 待采集（控制方 T36.0）：`claude-approval.png`（Yes/no 选项列表）、`claude-plan.png`（Ready to code? / plan 呈现）、`claude-single.png`（Enter to select 单选列表）、`claude-file.png`（文件预览）
- 现状代码（已核实）：`src/home/{Hero,StatesSection,StoriesSection,FeaturesSection,BoardShowcase,OpenSource,DownloadCta}.tsx`、`src/pages/Home.tsx`（max-w-5xl main，顺序 Hero→States→Stories→Features→OSS→Download）、`src/pages/DemoPage.tsx:11`（max-w-5xl）、`src/demo/{AppBoard,ClaudeTui,TuiShell,CodexCliTui,KimiShellTui,WorkBuddyTui,ZCodeIdeWindow,PhoneFrame,WindowFrame,DesktopStage}.tsx`、`src/demo/scenes/{D1Scene,RemoteScene,PetUsageScene}.tsx`、`src/demo/{store,seed,steps-d1,steps-d2,steps-d4,player,ledgerData}.ts`、`src/demo/remote/{RemoteBoard,RemoteDetail}.tsx`、`src/i18n/{zh,en}.json`（222 key）；AppBoard `interactive` prop（AppBoard.tsx:18）= 首页静态展示窗既有通道

**全局约定:**
- 工作目录：`E:\LLMproject\Github\tuvis-website`（Shell: Git Bash）；基线 main @ 11e2459，工作区干净（仅 `docs/design/p10-ref/` untracked，随 T34 首个 commit 纳入，无拷贝步骤）；23 测试全绿
- 红线（不可越）：`brand/`、`mam-worktree/`、`legacy/`、`SPEC.md` 只读；不新增任何 npm 依赖；`DownloadCta.goToInstaller` 逻辑一行不动；`public/img/state-*.png` 不删（决策 2）；全站零追踪
- 收尾三件套：每个任务末尾 `pnpm exec tsc --noEmit` + `pnpm test` + `pnpm build` 全绿 → **commit / 勾选本计划 checkbox / `docs/superpowers/plans/progress.md` 追加报告由控制方收口执行**，实现子代理跑到三条命令全绿 + 浏览器核对即止；**不 commit（控制方收口）**
- i18n：本计划新增 35 key（见增量总表）+ 7 处改值，**zh.json 与 en.json 必须同步**（parity 测试强制，终值 257 key）；三个 APP 窗的侧栏任务/会话/事件流文案 = 真实内容硬编码（中文照截图原文、英文 UI 词照原 app），**不入 i18n**（与 P9 TUI 口径一致）；ClaudeTui 场景文本硬编码（终端真实感）；窗 chrome/按钮 aria 走 i18n 或复用既有 key
- 测试基线演进：23（现状）→ T36 d2 断言适配（23）→ T38 ledger 扩档（**25**）；parity 随各任务递增
- 范围外：P6 部署、hero-poster 压缩（二期 E7）、账本「记录」页签与真实导出、APP 窗内部交互（静态拟真，见 B24）

---

## APP 窗组件规格总表（三窗 1:1 量化，实现与验收的唯一对照）

**公用壳 `AppWindowShell`（T35 新建 `src/demo/AppWindowShell.tsx`）**——三 APP 窗共用的 macOS 侧栏窗壳：

```
外层:   flex overflow-hidden rounded-lg border shadow-soft（边色/底色由各窗 className 给）
布局:   左右双列——sidebar 列 w-[200px] shrink-0 border-r + main 列 flex-1 min-w-0
灯位:   sidebar 顶部 h-8 行内（真实 macOS 侧栏窗：红绿灯坐在侧栏上，#FF5F57/#FEBC2E/#28C840
        11px 圆点；有 onClose 时红灯可点关窗，无则装饰性 aria-hidden——同 TuiShell 语义）
高度:   窗体自然高（不设固定高）；无右键菜单、无拖动横滚（APP 语义非终端，内容 wrap/truncate）
接口:   { onClose?, sidebar: ReactNode, sidebarClassName?: string, mainClassName?: string, children }
```

| 组件 | 主题 | 侧栏 | 主区（上→下） |
|---|---|---|---|
| **CodexAppWindow** | 亮色：窗底 `#FFFFFF` 边 `#E5E5E5`；侧栏底 `#F9F9F9` 边 `#ECECEC`；正文 `#18181B` 次 `#71717A`；警示红 `#D92D20`；发钮黑 `#000` | text-[11px]：① 灯位行 ② 账户胶囊 `ChatGPT Work ▾`（rounded-full border `#E5E5E5` bg-white px-2.5 py-1）③ 搜索行（🔍 自绘 12px + `搜索` 次）④ `New chat`（font-medium）⑤ `Scheduled` ⑥ `Plugins` ⑦ `Projects` 组头（`#A1A1AA`）+ 三项目（名 semibold + 子任务行 indent 两空格 truncate 次；tuvis-website：`$agnes-image 生成参考图`/`测试`/`…任务树`；deepseek-harness：`帮我看一下…`/`帮我鉴定…`/`测试一下`/`你好`/`Show more`；Travel：`现在这个…`/`总结我项目…`/`…`）⑧ `ApiMonitor` ⑨ footer `zhipu_glm`（mt-auto border-t 次） | ① 标题条 h-10 flex border-b：`这个项目的作用是什么来着？…` text-xs font-medium truncate + ⋯ 钮 + 侧栏切换 icon（ml-auto，自绘 panel 图标）② 内容区 p-4 space-y-3：树状清单卡（rounded-lg border `#E5E5E5` p-3：`项目结构` text-xs font-semibold + `├─/└─` 树行 font-mono text-[11px] 次，8 行：`├─ docs/ 计划与参考图`、`├─ src/ 站点与演示`、`│  ├─ home/ 首页区块`、`│  └─ demo/ 四场景+账本`、`├─ public/img`、`└─ package.json`…）+ `几个说明` text-xs font-semibold + 3 条 `•` bullets text-[11px]（`这个仓库是兔维斯官网（Vite + React）`/`演示数据全部本地模拟，无网络请求`/`计划文档在 docs/superpowers/plans/`）③ 底部输入行 p-3 border-t `#F0F0F0`：输入容器 rounded-2xl border `#E5E5E5` px-3 py-2 shadow-sm——行 1 `Work with ChatGPT`（次 11px）；行 2 flex items-center gap-2：＋ 自绘钮 · `⚠ Full access`（`#D92D20` text-[11px]）· `GLM-5.3-Flash High ▾`（ml-auto text-[11px] 次）· ↑ 黑圆钮（h-6 w-6 rounded-full bg-black text-white flex center） |
| **WorkBuddyAppWindow** | 亮色：窗底 `#FFFFFF` 边 `#E5E5E5`；侧栏底 `#F6F8F5` 边 `#E7EBE6`；正文 `#1F2321` 次 `#6B7280`；绿 `#4AD06A`（tools.ts:11 识别色）；用户气泡 `#F2F3F5` | text-[11px]：① 灯位行 ② `WorkBuddy 5.7.6`（text-xs font-semibold，版本号次）③ `发现应用 ▾` 绿胶囊（border `#4AD06A`/40 bg `#4AD06A`/10 text `#2E9E52` rounded-full px-2.5 py-1）④ 导航 6 行（新建任务 / 助理 BETA（BETA 小角标）/ 专家·技能·连接器 / 定时任务 / 资料库 / 更多·灵感；每行自绘 12px 图标位）⑤ `任务(3)` 组头 + 3 行（`规划信评报告更新工作流` 9月6日 / `询问模型身份` 9月6日 / `询问模型身份与种类` 9月4日；行 = truncate 名 + ml-auto 日期 text-[10px] `#9CA3AF`）⑥ `空间(5)` 组头 + 4 行（`Test2·你是什么模型` 10月4日 / `扬州新材料投资集…·终稿md最后一段加` 9月10日 / `CodexPlusPlus-VL…` / `0807`）⑦ footer（mt-auto border-t：李佳卫 + 头像圆点 + 铃铛 + headset 自绘图标）⑧ 浮动卡 absolute bottom-10 left-2 right-2：`Buddy加油站` + `100 积分`（rounded-lg border-amber-200 bg-amber-50 p-2 text-[10px]，绝对定位于侧栏 relative 内） | ① 标题条 h-10 flex border-b：`你是什么模型` text-xs font-medium + 右侧五图标（搜索/分享/时钟/文档/侧栏，自绘 13px 次）② 聊天区 p-4 space-y-3：用户气泡（ml-auto max-w-[75%] rounded-2xl rounded-tr-md bg-[#F2F3F5] px-3 py-2 text-xs `你是什么模型`）；助手块 flex gap-2：头像（h-6 w-6 rounded-full bg-[#4AD06A] 白色 W text-[10px] font-bold）+ 内容列——`已完成 15s ›` text-[10px] `#9CA3AF` + 三段正文 text-xs leading-relaxed（`我是 WorkBuddy 内置的助手 Hy4（Hybrid-4 preview）。` / `由 Z.ai 训练的大语言模型驱动，当前以 preview 档位运行，上下文 128k。` / `需要我继续处理「终稿 md 最后一段」吗？`）+ 操作排（复制/赞/踩/喇叭/重试/分享/⋯ 自绘 12px `#9CA3AF` + ml-auto `共消耗 ◇3.08 · Hy4 preview` text-[10px]）③ 输入区 p-3 border-t：容器 rounded-2xl border p-2——行 1 `今天帮你做些什么？@ 添加上下文，/调用技能与指令`（次 11px）；行 2 flex gap-2：＋ · `⚠允许完全访问`（红）· `Hy4 preview ▾`（ml-auto）· 🎤 · ↑ 绿圆钮（bg-[#4AD06A]）④ 页脚 `内容由 AI 生成，请核实重要信息` text-[10px] `#9CA3AF` text-center py-1.5 |
| **ZCodeTaskWindow** | 暗色：侧栏底 `#1B1B22` / 主区底 `#15151A`；边 `#2E2E33`；正文 `#D4D4D8` 次 `#8B8F98`；蓝 `#3B82F6`；终端块 `#101014`；输入条 `#1E1E26`；发钮黑 | text-[11px]：① 灯位行 ② 顶行：Z 蓝 logo（h-5 w-5 rounded bg-[#3B82F6] 白 Z font-bold）+ ← + →（自绘 12px 次）③ `新建任务` 钮（rounded-md bg-[#26262E] px-2 py-1.5）+ 右 `Ctrl+N`（mono text-[10px] 次）④ 搜索框（🔍 + `搜索` + 右 `Ctrl+K`；rounded-md border `#2E2E33` px-2 py-1）⑤ `自动化` / `插件市场` 两行 ⑥ toggle：`# 分组`（text-white 选中）/ `□ 项目`（次）⑦ 置顶行：📌 `Fork of 分析PR1550-继续追问` + `44天` ⑧ 三项目组（组名 font-semibold + 任务行 truncate + ml-auto 时间 text-[10px] 次 + `显示更多` 次）：MultiAgents-Manager（`PR #139 合并监控→自动 rebase` 16小时 / `Windows Tailscale 安装与 Funnel 探测` 4天 / `probe-lock [mam2]` 6天 / `DSH探测` 8天 / `清理feat/m2分支并拉取feat/m3及查p` 25天 / `显示更多`）；mam-worktree2（`codex修复任务执行` 3小时 / `每30分钟检查 PR #139 CI，通过` 21小时 / `仓库MIT协议商业化保护调研` 21小时 / `codex会话持续设计` 2天 / `显示更多`）；tuvis-website（`执行 tuvis-website executor-prompt` 1小时 / `参考CC Switch…` 1天）⑨ footer：`Jarvis666 Pro`（text-[#E5C07B]）+ ⚙ 设置图标 | ① 任务标题栏 h-9 flex border-b `#2E2E33`：`📁 执行 tuvis-website executor-prompt 计划` text-xs truncate + ⋯ + 📁▾ + 上传 + ? + 布局（自绘/文字小钮 12px 次）+ ml-auto `— □ ×` 窗口控制（text-[10px] 次）② 事件流 p-3 space-y-2.5 text-[11px]：`🧠 思考` + `持续了几秒` 胶囊（rounded-full bg-[#24242C] px-1.5 text-[10px] 次）；`▢ 终端` 块（rounded-md bg-[#101014] px-2 py-1 font-mono space-y-0.5：`curl -s --max-time 10 https://codebuddy.tencent.com/` / `curl -s --max-time 10 https://www.workbuddy.cn/ | head -50`）；`🔍 阅读 codex-cli-splash.png`；`渲染 CodeBuddy 官网找 WorkBuddy 图` + `已完成` 胶囊；`展开` 胶囊 + `↙ 执行 tuvis-website P7 重构计划`（缩进行 次）③ 底部输入 p-3：rounded-full bg-[#1E1E26] px-3 py-2 flex items-center gap-2 text-[11px]：＋ · `🛡完全访问 ▾` · `🖥电脑操作` · `GLM-5.3-Flash ▾`（ml-auto）· `🧠最高 ▾` · ↑ 黑圆钮（h-6 w-6 rounded-full bg-black text-white flex center） |

三窗统一：导出签名 `{ className?: string; onClose?: () => void }`；内容文案全部硬编码（侧栏任务/会话/事件 = 截图真实内容，中文照原文）；所需小图标按 P9 ResourcesScene 先例在窗文件内 `svgProps` 自绘（不入 `components/Icons.tsx`，不引入图标库）；emoji/文字符号（📁🧠▢🔍⚠🛡🖥🧠🎤📌↑⋯）按截图直接使用。

---

## ClaudeTui 场景规格总表（T36，对照真截图；文本硬编码）

ClaudeTui 新增 `scene?: "session" | "approval" | "plan" | "select"`（默认 `"session"`，向后兼容）。场景块**替换** session 态的 ③Thought + ⑤Reply 两块；header 三行 / ②用户消息行 / ④extraLines / ⑥※ 状态行 / ⑦分隔线 / ⑧输入行 / ⑨modeLine 底行 / ⑩toast 全部保留（D2 联动不受影响）。底色/字号/色值沿用 ClaudeTui 现状（`#0E0D0B` 底 / 正文 `#D8D3C8` / 次 `#8B857A` / 橙 `#D97757` / 黄 `#EAB53D`）。

| scene | 结构（上→下，替换 ③⑤ 位置） | 对照 |
|---|---|---|
| **approval**（审批） | ① 任务行 `❯ git commit -m 'feat: remote approve'`（`❯` 橙，命令正文）② `⏸ Permission needed`（黄，font-medium）③ 选项列表三行——选中行 `❯ 1. Yes`（`❯` 橙 + 行底 `#1F1D18` rounded px-1.5）、未选行 `  2. Yes, and don't ask again` / `  3. No`（两空格缩进，次色编号） | claude-approval.png（采集后校对） |
| **plan**（计划模式） | ① `Planning:  src/remote/approve.rs · src/remote/mod.rs`（`Planning:` 次、路径正文）② `Ready to code?`（font-bold 正文色）③ 选项三行——`❯ 1. Yes, and auto-accept edits`（选中态同上）/ `  2. Yes, and manually approve edits` / `  3. No, keep planning` | claude-plan.png（采集后校对）；选项文案为 Claude Code 真实 plan-mode 选项 |
| **select**（单选/多选题域） | ① ※ 斜体回顾段 `※ 上次会话回顾：信评流水线已完成调卷与特征工程，报告框架待你确认……`（italic 次）② 用户行 `> 帮我把这道题归到题目领域`（灰底 `#2A2824`，② 块位置内容替换）③ hook error 树：`⎿ [Hook Error] pre-tool-use hook exited 1`（黄）+ `  ⎿ 已忽略，继续执行`（次）④ `✻ Thought for 34s (ctrl+o to expand)`（次）⑤ 高亮 chip `题目领域`（rounded bg-[#2A2824] text-[#D97757] px-1.5）+ `这道题属于哪个领域？`（font-bold，同行或紧邻行）⑥ 编号选项（选中行高亮同上）：`❯ 1. 金融/信用评级` + 缩进描述 `宏观利率、行业景气与企业信用`（次，缩进 5 空格）/ `  2. 产业/供应链` + `上中下游产能、库存与价格传导` / `  3. 方法论/工程` + `因子构造、回测框架与数据管道` ⑦ 底行 `Enter to select · ↑/↓ to navigate · Esc to cancel`（次） | claude-tui-multiselect.png（已入库，唯一权威） |
| **session**（默认，不变） | 现状 ①–⑩ 完整会话态（P9 已验收，零改动） | remote-detail-tui.png 右半 |

选中态高亮行统一规格：`❯`（橙 `#D97757`）+ 编号正文色 + 整行底 `#1F1D18` rounded px-1.5；未选行两空格缩进、编号次色。文件预览场景**不做**（决策 13：保持手机面板侧实现）。select 场景为静态选中态（`❯ 1. 金融/信用评级`），与手机题卡 picked 不做逐项映射（TUI 为持仓/信评另一会话语境，忠实截图内容优先）。

**d2 剧本 s5–s7 enter 修订（逐拍聚焦一个场景，B28）：**

| # | 现 enter 关键值 | 改后 enter 关键值 | TUI 呈现 |
|---|---|---|---|
| s5 计划模式 | planMode:true + question:single 已提交 | **question:null** + planMode:true | scene=plan（`Ready to code?` 选项）；手机端仅 banner |
| s6 题卡 | planMode:true + question:multi 已提交 | **planMode:false** + question:multi 已提交 | scene=select（编号选项+底行提示）；手机端多选题卡已提交 |
| s7 文件预览 | planMode:true + question:multi 已提交 + files:true | **planMode:false + question:null** + files:true | scene=session + toast（claude idle 收尾）；手机端文件树+diff |

s1–s4 不动。单选题「已提交」终态退出剧本（手动触发排 `出一道题` single 未提交→可自行点选提交覆盖），记为裁量项。RemoteScene 场景派生：`approval==="pending" ? "approval" : question ? "select" : planMode ? "plan" : "session"`；`tuiLines` 删 pending 分支（场景块自含 ⏸ 行），保留 ✓ Approved 与 queued 行。

---

## 工作流对比区规格（T34，`src/home/WorkflowCompare.tsx` 新建）

容器 `mx-auto max-w-7xl`（与 Hero 同宽带）；`SectionTitle tKey="compare.title"`；主体 `grid items-stretch gap-6 md:grid-cols-[1fr_auto_1fr]`（移动端单列堆叠，VS 行转横排）。纯 CSS + emoji 图标 + 自绘序号章，零图表库（决策 4）。

- **左列卡「没有兔维斯」**：`rounded-[14px] border border-red-500/20 bg-red-500/[0.03] p-6`；列头 = `compare.without`（text-sm font-semibold text-red-700 + 🚦前缀）；步骤 5 行 `space-y-4`，每行 flex gap-3——序号章（h-6 w-6 rounded-full border border-red-500/40 text-red-600 text-[11px] flex center）+ 内容列（标题行 `text-sm font-semibold` = emoji + title；描述 `text-xs text-inkdim mt-0.5`）
- **中间 VS 分隔**：`hidden md:flex w-10 flex-col items-center`——上竖线 `w-px flex-1 bg-line` + VS 圆章（h-10 w-10 rounded-full border-2 border-line bg-card font-bold text-sm flex center，文字 `VS` 硬编码）+ 下竖线；移动端替换为横排分隔行（w-full h-10 flex-row + 横线）
- **右列卡「有兔维斯」**：`rounded-[14px] border border-green-500/25 bg-green-500/[0.04] p-6`；列头 = `compare.with`（text-green-700 + ✅前缀）；步骤 2 行同构（序号章 border-green-500/50 text-green-700），行高配平（`md:min-h-[120px]` 量级，视觉平衡 5:2 行数差——两步卡内容行距放宽）
- **底部兼容行**：`mt-6 text-center text-xs text-inkdim` = `compare.compat`（纯文字，不用各家 logo——避免商标问题，决策 4）

**步骤文案（zh / en，即 i18n 增量总表 T34 部分的最终文案）：**

| 步骤 | 图标 | 标题 zh / en | 描述 zh / en |
|---|---|---|---|
| 无 · 1 | 🖥️ | 逐个终端巡检 / Terminals one by one | 开五个窗口挨个看，谁在跑、谁在等全靠人肉刷新。/ Five windows, manual refreshing — you are the monitor. |
| 无 · 2 | ⏸ | 错过审批就卡死 / Missed approvals stall work | 批准请求躺在终端里没人看见，任务一停一整晚。/ Approval prompts sit unseen in a terminal; tasks stall overnight. |
| 无 · 3 | 📵 | 出门就失联 / Blind on the go | 人在外面，桌面上的 Agent 一个也管不着。/ Away from the desk, every agent is out of reach. |
| 无 · 4 | 🧩 | Skill 散落各处 / Skills scattered | 同一份 Skill 复制八份，改一处漏七处。/ The same skill copied eight times — fix one, miss seven. |
| 无 · 5 | 🧾 | 用量一笔糊涂账 / Usage is a guessing game | 钱花在哪个模型、哪个项目，月底才猜一次。/ Which model burned the budget? You find out when the month ends. |
| 有 · 1 | 📊 | 一块看板全局掌握 / One board, full control | 八个工具的红绿灯在一块屏上，谁等待、谁在跑一眼扫清。/ Eight tools' status lights on one screen — scan the whole field at a glance. |
| 有 · 2 | 📱 | 手机批准 + 自动记账 / Approve anywhere, auto-ledgered | 出门点一下「允许」继续跑；花销按工具/项目/供应商自动入账。/ Tap Allow from your phone; spend is booked by tool / project / supplier automatically. |

与故事卡职责区分（决策 4）：故事 = 何时用（叙事场景），对比 = 没它多麻烦（痛点流程可视化）。

---

## ledgerData v4 数据总表（T38，五档自洽数据；测试守护合计一致）

结构：`export type RangeKey = "last5h" | "today" | "last7d" | "last30d" | "custom"`（自 LedgerSection 移入）；`export interface LedgerDataset { metrics; deltas; byTool/byProject/bySupplier: DistRow[]; work; trend: { labels; tokens; hit } }`；`export const LEDGERS: Record<RangeKey, LedgerDataset>`。旧 `LEDGER`/`TREND` 导出删除（last7d 数据原样迁入 `LEDGERS.last7d`，一行不改）；`LEDGERS.custom = LEDGERS.last30d`（别名引用，B30）；`totalTokens/hitRate/formatInt/formatCN/smoothPath` 纯函数不动。

| 档 | totalTokens（=reqInput+output） | metrics | 三维/trend 合计锚点 | trend 形状（峰值） |
|---|---|---|---|---|
| last5h | **576,020,000** | output 2,410,000 · reqInput 573,610,000 · cacheHit 558,900,000（hit 97.4%）· inputEst 214 · requests 2,742 | 全部 = 576,020,000（dsh/landing/others 尾行挂余数精确补齐） | 5 点小时标签 `11:00`–`15:00`：[96,400,000, 142,850,000, 88,120,000, 165,240,000, 83,410,000]（峰 165,240,000） |
| today | **1,410,320,000** | output 5,905,000 · reqInput 1,404,415,000 · cacheHit 1,370,220,000（97.6%）· inputEst 386 · requests 6,730 | 全部 = 1,410,320,000 | 8 点两小时桶 `00:00`–`14:00`：[37,600,000, 20,100,000, 15,300,000, 24,800,000, 121,400,000, 268,900,000, 512,400,000, 409,820,000]（峰 512,400,000，午后高峰 + 末桶部分时段） |
| last7d | **4,392,361,324**（现有真实数据，原样迁入） | 现状 metrics/deltas/三维/work 不动 | 现状（已测） | 7 点日标签 `10/5`–`10/11`（峰 1,568,000,000） |
| last30d | **16,404,361,324** | output 68,241,324 · reqInput 16,336,120,000 · cacheHit 15,942,800,000（97.6%）· inputEst 2,486 · requests 81,640 | 全部 = 16,404,361,324（dsh=821,361,324 / landing=1,609,061,324 / others=1,176,261,324 尾行挂余数） | 30 点日标签 `9/12`–`10/11`（由 2026-09-12 起连续生成，纯函数 `dateLabel`）：W1 [412.6, 538.2, 605.4, 448.9, 596.1, 705.8, 349.4]M · W2 [458.4, 512.7, 664.3, 470.8, 611.5, 784.2, 390.9]M · W3 [502.6, 568.4, 622.1, 486.3, 655.2, 806.4, 379.2]M · W4（低谷周）[386.4, 422.8, 510.6, 402.5, 478.9, 425.4, 255.0]M · 末两日 [1,568,000,000, 385,361,324]（峰 1,568,000,000 与 7d 档同日尖峰自洽） |

三维明细（合成档，行名沿用 last7d 口径；单位 token）：

- **last5h** byTool [236,020,000 / 128,410,000 / 88,340,000 / 76,890,000 / 34,120,000 / 12,240,000]（Claude Code/Codex/Kimi Code/ZCode/WorkBuddy/dsh）；byProject [284,150,000 / 132,660,000 / 108,530,000 / 50,680,000]；bySupplier [208,640,000 / 128,410,000 / 88,340,000 / 76,890,000 / 43,120,000 / 30,620,000]
- **today** byTool [586,420,000 / 316,240,000 / 212,680,000 / 184,310,000 / 76,940,000 / 33,730,000]；byProject [684,260,000 / 338,410,000 / 252,730,000 / 134,920,000]；bySupplier [518,240,000 / 316,240,000 / 212,680,000 / 184,310,000 / 92,460,000 / 86,390,000]
- **last30d** byTool [6,842,600,000 / 3,412,400,000 / 2,316,800,000 / 1,984,300,000 / 1,026,900,000 / 821,361,324]；byProject [7,684,200,000 / 4,126,400,000 / 2,984,700,000 / 1,609,061,324]；bySupplier [5,826,400,000 / 3,412,400,000 / 2,316,800,000 / 1,984,300,000 / 1,688,200,000 / 1,176,261,324]

deltas（环比数据值，硬编码字符串）：last5h `+12.4% / +86.2% / +91.7% / +92.0% / -0.4 pt / +88.5% / +74.6%`（inputEst/output/reqInput/cacheHit/hitRate/requests/trend）；today `+218.6% / +112.4% / +121.8% / +120.3% / -0.5 pt / +138.2% / +115.9%`；last30d `+412.6% / +38.4% / +52.8% / +51.2% / -0.8 pt / +64.7% / +46.1%`。work：last5h `"4 active · 1 queued"/41/"claude 96 · codex 37 · kimi 15"/"0 fatal · 1 retry · 0 timeout · 0 abort"/"p50 38s · max 212s"/"Read 68 · Edit 31 | Bash 19 · Grep 12"`；today `"5 active · 2 queued"/74/"claude 186 · codex 71 · kimi 28"/"0 fatal · 2 retry · 1 timeout · 0 abort"/"p50 41s · max 284s"/"Read 132 · Edit 58 | Bash 36 · Grep 22"`；last30d `"6 active · 2 queued"/512/"claude 1,342 · codex 516 · kimi 204"/"1 fatal · 6 retry · 3 timeout · 2 abort"/"p50 44s · max 582s"/"Read 8,240 · Edit 3,610 | Bash 2,180 · Grep 1,320"`。hit 数组：last5h [0.972,0.976,0.969,0.978,0.974]；today [0.961,0.958,0.955,0.963,0.969,0.974,0.979,0.976]；last30d 30 值在 0.955–0.978 逐日给定（W4 低谷周偏低、末两日 0.978/0.973）。asOf 四档同 `2026-10-11 15:43:01`。数字自检（实现者复核）：各档三维合计 = totalTokens（尾行挂余数）；trend 合计 = totalTokens；hitRate = cacheHit/reqInput ∈ 0.974–0.976；量级 last5h < today < last7d < last30d。

LedgerSection 联动改造：`const data = LEDGERS[range]` 单源取数——概要卡 metrics/deltas/asOf、趋势卡 `data.trend`（峰值改 `Math.max(...data.trend.tokens)` 派生，替换硬编码 1_568_000_000；面积/曲线/点/hover 沿用）、工作小结 `data.work`、分布三维 `data.byTool/byProject/bySupplier`（占比分母 `totalTokens(data.metrics)`）；趋势 x 轴标签抽稀（B30）：`n ≤ 14` 全显（现状），`n > 14` 时 `step = Math.ceil(n/10)`（30 点 → 每 3 个出一个 + 末点必出）。范围 chips/导出排/页签 UI 不动。

---

**i18n 增量总表（35 key，zh / en；终值 222 → 257）：**

T34（新增 19）：

| key | zh | en |
|---|---|---|
| `hero.lamps` | 红 = 待批准 · 黄 = 运行中 · 绿 = 已完成 | Red = awaiting approval · Amber = running · Green = done |
| `compare.title` | 没有兔维斯 vs 有兔维斯 | Without Tuvis vs with Tuvis |
| `compare.without` | 没有兔维斯 | Without Tuvis |
| `compare.with` | 有兔维斯 | With Tuvis |
| `compare.w1t` | 逐个终端巡检 | Terminals one by one |
| `compare.w1d` | 开五个窗口挨个看，谁在跑、谁在等全靠人肉刷新。 | Five windows, manual refreshing — you are the monitor. |
| `compare.w2t` | 错过审批就卡死 | Missed approvals stall work |
| `compare.w2d` | 批准请求躺在终端里没人看见，任务一停一整晚。 | Approval prompts sit unseen in a terminal; tasks stall overnight. |
| `compare.w3t` | 出门就失联 | Blind on the go |
| `compare.w3d` | 人在外面，桌面上的 Agent 一个也管不着。 | Away from the desk, every agent is out of reach. |
| `compare.w4t` | Skill 散落各处 | Skills scattered |
| `compare.w4d` | 同一份 Skill 复制八份，改一处漏七处。 | The same skill copied eight times — fix one, miss seven. |
| `compare.w5t` | 用量一笔糊涂账 | Usage is a guessing game |
| `compare.w5d` | 钱花在哪个模型、哪个项目，月底才猜一次。 | Which model burned the budget? You find out when the month ends. |
| `compare.t1t` | 一块看板全局掌握 | One board, full control |
| `compare.t1d` | 八个工具的红绿灯在一块屏上，谁等待、谁在跑一眼扫清。 | Eight tools' status lights on one screen — scan the whole field at a glance. |
| `compare.t2t` | 手机批准 + 自动记账 | Approve anywhere, auto-ledgered |
| `compare.t2d` | 出门点一下「允许」继续跑；花销按工具/项目/供应商自动入账。 | Tap Allow from your phone; spend is booked by tool / project / supplier automatically. |
| `compare.compat` | 兼容 Claude Code · Codex · OpenCode · OpenClaw · Kimi Code · WorkBuddy · ZCode · dsh | Works with Claude Code · Codex · OpenCode · OpenClaw · Kimi Code · WorkBuddy · ZCode · dsh |

T37（新增 16）：

| key | zh | en |
|---|---|---|
| `pet.menu.open` | 宠物菜单 | Pet menu |
| `pet.menu.feed` | 喂食 | Feed |
| `pet.menu.behavior` | 编辑行为 | Edit behavior |
| `pet.menu.switch` | 切换宠物 | Switch pet |
| `pet.menu.hide` | 隐藏桌宠 | Hide pet |
| `pet.repo.title` | 在线仓库 | Pet repository |
| `pet.repo.desc` | 云仓库共有 4 只宠物，导入后本机可见 | Four pets in the cloud repo — import to see them locally |
| `pet.repo.import` | 一键导入 | Import all |
| `pet.repo.imported` | 已导入 | Imported |
| `pet.repo.snowy` | 雪团 Snowy | Snowy |
| `pet.repo.coal` | 煤球 Coal | Coal |
| `pet.behavior.title` | 编辑行为 | Behavior |
| `pet.behavior.freq` | 动作频率 | Animation frequency |
| `pet.behavior.voice` | 语音 | Voice |
| `pet.behavior.pin` | 置顶 | Always on top |
| `pet.fed` | 🥕 开饭啦 | 🥕 Yum! |

T35/T36/T38：新增 0（APP 窗/场景/账本内容全硬编码；「打开完整演示」复用 `demo.open`）。

**i18n 改值表（7 处）：**

| key | zh 旧→新 | en 旧→新 | 落点 |
|---|---|---|---|
| `hero.badge` | 开源 · 桌面端 · 移动端远程 → **v0.5.6 · 开源** | Open source · desktop + mobile remote → **v0.5.6 · Open source** | T34 |
| `demo.detail.d1s4` | …切到 Codex CLI 窗：虚线信息头… → **Codex APP 任务窗：ChatGPT Work 侧栏列着 tuvis-website / deepseek-harness 的任务树，右侧内容区停在「这个项目的作用是什么来时？」的计划卡上。** | → **The Codex app window: a ChatGPT Work sidebar with task trees for tuvis-website / deepseek-harness, and the content area resting on the "What does this project do again?" plan card.** | T35 |
| `demo.detail.d1s6` | …WorkBuddy 结对窗与 Kimi 同构… → **WorkBuddy APP 窗：任务与空间双列表、Buddy 加油站积分卡，右侧「你是什么模型」对话、操作图标排与 Hy4 preview 输入行——真实界面观感。** | → **The WorkBuddy app window: task & space lists, the Buddy station card, and the "What model are you" chat with the action row and Hy4 preview input — the real app's look.** | T35 |
| `demo.detail.d1s7` | …ZCode 桌面端：聊天面板 + 代码编辑器… → **ZCode 任务窗：左侧项目分组任务列表（MultiAgents-Manager / mam-worktree2 / tuvis-website），右侧事件流——思考、终端命令、阅读截图一路排到完成。** | → **The ZCode task window: projects grouped on the left (MultiAgents-Manager / mam-worktree2 / tuvis-website), the event stream on the right — thinking, terminal commands, reading screenshots, down to done.** | T35 |
| `demo.detail.d2s3` | …审批红卡带命令全文，「允许」一点——终端立刻 ✓ Approved 续跑… → **审批红卡带命令全文，「允许」一点——终端的 Yes/No 选项列表收起、✓ Approved 续跑，全程没碰电脑。** | → **The red approval card shows the exact command; tap Allow — the terminal's option list collapses, ✓ Approved prints, work resumes. Computer untouched.** | T36 |
| `demo.detail.d2s5` | …计划模式一键切换：banner 亮起，终端底行换成 plan mode… → **计划模式一键切换：banner 亮起，终端切到「Ready to code?」三选项——只读规划，不动文件。** | → **Plan mode in one tap: the banner lights up and the terminal switches to the "Ready to code?" options — read-only planning, no file changes.** | T36 |
| `demo.detail.d2s6` | …题卡不打断：单选点一项、多选勾几项，提交即回填给终端。 → **题卡不打断：终端停在带描述的编号选项（Enter to select），手机点选提交即回填。** | → **Question cards don't interrupt: the terminal holds numbered options with descriptions (Enter to select); pick and submit from the phone.** | T36 |

**死 key 处置（保留 json 不删，parity 只查键集合与空值）：** 本期新死 `states.title/states.desc/states.green/states.yellow/states.red`（StatesSection 删除）、`features.title`（四仪表并入故事区，节标题换 stories.title）共 6 个；`features.board/remote/res/pet(+.desc)/watch`、`stories.*`、`demo.open` 均被新代码继续引用。P8/P9 遗留死 key 照旧。

**文件总览：**

新增（6 个源文件）：
```
src/home/WorkflowCompare.tsx       # T34 工作流对比区
src/demo/AppWindowShell.tsx        # T35 APP 窗公用壳（灯位坐侧栏顶行）
src/demo/CodexAppWindow.tsx        # T35 Codex APP 窗（codex-app-real.png）
src/demo/WorkBuddyAppWindow.tsx    # T35 WorkBuddy APP 窗（workbuddy-real.png）
src/demo/ZCodeTaskWindow.tsx       # T35 ZCode 任务窗（zcode-real.png）
```
（`docs/design/p10-ref/` 五图已在工作区，随 T34 commit 纳入；T36.0 控制方补采 4 图随 T36 commit 纳入）

删除（6 个源文件）：
```
src/home/StatesSection.tsx src/home/FeaturesSection.tsx src/home/BoardShowcase.tsx   # T34
src/demo/CodexCliTui.tsx  src/demo/WorkBuddyTui.tsx  src/demo/ZCodeIdeWindow.tsx    # T35
```
（连带成为死资产但不删：`src/components/BrowserFrame.tsx`、`src/components/CarrotLamp.tsx`——仅被删除组件引用；`public/img/state-*.png` 决策 2 明确保留）

修改（约 16 个既有文件）：
```
src/pages/Home.tsx                  # T34 per-section 容器 + 新顺序
src/home/Hero.tsx                   # T34 重排（左列文案列 + 右列实时窗）
src/home/StoriesSection.tsx         # T34 上排 4 仪表卡美化 + 下排 3 故事卡 + id="features"
src/pages/DemoPage.tsx              # T35 per-section 容器（D1 max-w-7xl）
src/demo/scenes/D1Scene.tsx         # T35 双列网格 + 三 APP 窗映射
src/demo/steps-d1.ts                # T35 s4/s6/s7 label 改值
src/demo/ClaudeTui.tsx              # T36 scene prop + 三场景块
src/demo/scenes/RemoteScene.tsx     # T36 scene 派生 + tuiLines v2
src/demo/steps-d2.ts                # T36 s5–s7 enter 修订
src/demo/player.test.ts             # T36 d2 断言适配（question null）
src/demo/PhoneFrame.tsx             # T36 面板固定高度内滚
src/demo/scenes/PetUsageScene.tsx   # T37 右键菜单/配置面板/左侧双卡
src/demo/ledgerData.ts              # T38 v4 LEDGERS + RangeKey/dateLabel
src/demo/ledgerData.test.ts         # T38 数据矩阵（6 → 8 用例）
src/demo/LedgerSection.tsx          # T38 五档联动 + 峰值派生 + 标签抽稀
src/i18n/{zh,en}.json               # 各任务分批 +35 key / 改值 7
docs/superpowers/plans/progress.md  # 每任务控制方追加
```

---

## 关键设计权衡（B21–B30，评审时对照）

- **B21 首页/DemoPage per-section 容器**：Hero/对比区/D1 用 `mx-auto max-w-7xl`，其余区块保持 `max-w-5xl`；Home/DemoPage 的 `<main>` 退为 `px-5` 定位容器。对比方案「全站放宽 TopBar/Footer」会波及 docs/changelog 等所有页对齐——per-section 只动两个页面文件，页面节奏 CC Switch 式（hero 宽、内容收窄）。代价：每 section 多一层容器 div。
- **B22 Hero 实时窗 `interactive={false}`**：复用 AppBoard 既有 prop（AppBoard.tsx:18）——chips 可点（共享 store.filter）、卡片 hover 反馈保留、不可开窗（首页无窗容器承接）+「打开完整演示 →」（`demo.open`）承接转化。代价：首页点卡片无反应，用链接引导（预期行为）。
- **B23 三组件删除、死资产保留**：StatesSection/FeaturesSection/BoardShowcase 删除（git 可溯），但 `state-*.png`（决策 2）、`BrowserFrame`/`CarrotLamp` 组件保留为死资产——删公共组件风险大于收益，下期可复用（hero 若需浏览器壳）。
- **B24 APP 窗静态拟真 + AppWindowShell**：三窗内容为纯静态 DOM（侧栏任务/聊天/事件流不可点），仅红灯关窗交互保留——与 P9 TUI 窗同口径（真实感优先），且 APP 语义本无终端右键菜单/拖动横滚，AppWindowShell 不带这两件。代价：演示「看着能点其实不能点」，detail 文案与下方说明已管理预期。
- **B25 三窗主题各异（Codex/WorkBuddy 亮、ZCode 暗）**：各自忠实原 app 观感，D1 切窗时底色跳变 = 真实差异，不做统一调和平滑。验收按「结构 + 元素 + 配色」逐项对照，不按像素构图（P9 B15 先例）。
- **B26 ClaudeTui `scene` prop 化而非新组件**：ClaudeTui 被 D1/D2 两处共用，场景块内聚在 ClaudeTui.tsx（常量区 + 渲染分支），调用方只加一个 prop，零迁移成本。代价：ClaudeTui.tsx 增长约 150 行（P9 session 态扩展先例可接受）。
- **B27 截图采集两段式**：T36.0 为控制方电脑操控前置（开真 claude 会话截 4 场景），实现不阻塞——approval/plan 两场景先按 Claude Code 真实交互范式（选项文案为官方真实文案）+ 已入库 multiselect 图实现，T36.5 截图到位后逐项「字对字、色对色」校对修正。
- **B28 d2 s5–s7 逐拍聚焦**：planMode/question 在 s5–s7 互斥呈现（见修订表），每拍 TUI 场景与手机端焦点一一对应；单选「已提交」终态退出剧本（触发排手动可复现）。代价：剧本不再同时叠加两种交互态——叙事更清晰，语义无损。
- **B29 D4 模拟宠物零资产**：雪团/煤球用现有精灵表 idle 首帧 + CSS filter（`hue-rotate(180deg)` / `brightness(0.25) saturate(0.6)`）换色占位，一键导入为按钮文案/动效模拟（不解析 zip、不切换真宠物）。代价：导入后仅列表态变化，无真新宠物——决策 16/17 明确纯模拟。
- **B30 custom = last30d 别名 + 标签抽稀**：决策 18 指定自定义复用近 30 天（数据模块内 `LEDGERS.custom = LEDGERS.last30d` 引用同对象，测试可断言同 identity）；30 点趋势标签 >14 时每 `ceil(n/10)` 个出一个（30 → 每 3 出 1 + 末点），≤14 维持现状全显。

---

## P10-A · 首页 CC Switch 化

### Task 34: Hero 重排 + 工作流对比区 + 故事区改造 + StatesSection 删除

**Files:**
- Create: `src/home/WorkflowCompare.tsx`
- Modify: `src/pages/Home.tsx` `src/home/Hero.tsx` `src/home/StoriesSection.tsx` `src/i18n/{zh,en}.json`（+19 key、改值 1 处）
- Delete: `src/home/StatesSection.tsx` `src/home/FeaturesSection.tsx` `src/home/BoardShowcase.tsx`

- [x] **Step 34.1: Hero 重排（对照 ccswitch-hero.png）**

```tsx
// src/home/Hero.tsx 结构（新）
<Reveal>
  <section className="grid items-center gap-10 py-14 md:py-20 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
    <div>
      <span className="inline-block rounded-full border border-line px-3.5 py-1 text-[13px] text-hud">{t("hero.badge")}</span>   {/* 改值后 v0.5.6 · 开源 */}
      <h1 className="mt-5 text-4xl font-bold tracking-tight md:text-5xl">{t("hero.title")} <span className="text-inkdim">Tuvis</span></h1>
      <p className="mt-3 text-xl font-semibold text-ok">{t("hero.subtitle")}</p>
      <p className="mt-3 max-w-lg text-inkdim">{t("hero.desc")}</p>
      <div className="mt-6 flex gap-3">{/* 免费下载（滚 #download）+ GitHub 两钮，逻辑照旧 */}</div>
      {/* 三色小灯行（替代 StatesSection，决策 1/2）：t("hero.lamps") 按 " · " 拆三段渲染，
          色点顺序固定红/黄/绿（zh/en 文案均按 "A · B · C" 约定书写，见增量总表） */}
      <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-inkdim">
        {t("hero.lamps").split(" · ").map((label, i) => (
          <span key={i} className="flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${["bg-red-500", "bg-yellow-500", "bg-green-500"][i]}`} />
            {label}
          </span>
        ))}
      </div>
      {/* 海报缩略：竖版 200px 级，非大图 */}
      <img src="img/hero-poster.png" alt={t("hero.title")} className="mt-6 h-[200px] w-auto rounded-xl border border-line shadow-soft" />
    </div>
    {/* 右列：主看板实时窗（复用 AppBoard，站点内可交互：chips 筛选/卡片 hover，无播放器） */}
    <div>
      <DesktopStage>
        <div className="h-[440px] overflow-y-auto overscroll-contain md:h-[560px]">
          <AppBoard interactive={false} />
        </div>
      </DesktopStage>
      <p className="mt-3 text-center">
        <Link to="demo" className="text-sm font-semibold text-hud hover:underline">{t("demo.open")} →</Link>
      </p>
    </div>
  </section>
</Reveal>
```

三灯行实现裁定：**不加独立 key**——`t("hero.lamps").split(" · ")` 拆三段渲染（见代码内注释），色点顺序固定红/黄/绿；两语文案已按 `A · B · C` 三段约定书写（增量表），双语序天然一致。BrowserFrame 引用移除（死资产，B23）。验证点：三灯与看板卡状态灯同色系（red-500/yellow-500/green-500）；`hero-poster.png` 以 h-200px 缩略呈现；右列窗内 chips 可点、卡片 hover 变色、点卡片无反应（interactive=false 预期）。

- [x] **Step 34.2: WorkflowCompare 新组件（规格见前文专节）**

按「工作流对比区规格」实现：左 5 步红系卡 / VS 分隔 / 右 2 步绿系卡 / 底部兼容行；步骤数据本地常量（icon + t/w-t/w-d key），全部 i18n。验证点：md 双列 + VS 竖排、375px 单列 + VS 横排；红绿两卡仅边框/底色着色（`red-500/20`、`green-500/25` 透明度级，勿高饱和——A11y 对比）；兼容行纯文字无 logo。

- [x] **Step 34.3: StoriesSection 改造（4 仪表卡美化版 + 3 故事卡）**

```tsx
// 上排：四仪表卡（features.* key 复用，视觉升级——决策 3「写好看一点」）
<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
  {GAUGES.map((g) => (   // { icon, t, d, to } —— 沿用 FeaturesSection FEATURES 数据
    <Link to={`demo#${g.to}`} key={g.to}
      className="group rounded-[14px] border border-line bg-card p-5 transition hover:-translate-y-0.5 hover:border-hud/50 hover:shadow-soft">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-hud/10 text-xl">{g.icon}</div>
      <h3 className="mt-3 font-semibold">{t(g.t)}</h3>
      <p className="mt-1.5 text-xs leading-relaxed text-inkdim">{t(g.d)}</p>
      <span className="mt-3 inline-block text-xs text-hud group-hover:underline">{t("features.watch")} →</span>
    </Link>
  ))}
</div>
{/* 下排：3 故事卡（现状卡样式不变） */}
<div className="mt-6 grid gap-5 md:grid-cols-3">{/* STORIES 现状三卡 */}</div>
```

节标题沿用 `stories.title` + `stories.note`；section 承接 `id="features"`（TopBar「功能」锚点不断链，Home.tsx 内唯一 #features 挂点）+ `className="scroll-mt-20"`。整卡可点（Link 包裹，无嵌套交互元素——a11y 安全）。

- [x] **Step 34.4: Home.tsx 重排 + 三组件删除**

```tsx
// src/pages/Home.tsx（新）
<main className="px-5">   {/* 退为定位容器（B21）；各 section 自带 max-w */}
  <div className="mx-auto max-w-7xl"><Hero /></div>
  <div className="mx-auto max-w-7xl"><WorkflowCompare /></div>
  <div className="mx-auto max-w-5xl"><StoriesSection /></div>
  <div className="mx-auto max-w-5xl"><OpenSource /></div>
  <div className="mx-auto max-w-5xl"><DownloadCta /></div>
</main>
```

删除 StatesSection/FeaturesSection/BoardShowcase 三文件及全部 import（`grep -rn "StatesSection\|FeaturesSection\|BoardShowcase" src/` 零命中）。DownloadCta/OpenSource 内容不动。

- [x] **Step 34.5: i18n + 机器验证**

i18n +19（hero.lamps + compare.* 18）/ 改值 hero.badge。

```bash
pnpm exec tsc --noEmit && pnpm test    # Expected: 23 passed（parity 241 key）
pnpm build && pnpm dev
# 浏览器核对（zh/en 各一遍）：
# 首页 = Hero（徽章 v0.5.6·开源 / 大标题 / slogan / 描述 / 双 CTA / 三灯行 / 200px 海报缩略 / 右列大窗）
#   → 对比区（5 红 / VS / 2 绿 / 兼容行）→ 你会这样用它（4 仪表卡 → 点卡跳 demo#d1..#d4 落位正确
#   + 3 故事卡）→ 开源 → 下载；
# Hero 窗：chips 筛选即时生效、卡片 hover 反馈、摘要行等待数红色、窗内滚动；
# 「打开完整演示 →」→ /demo 顶部；TopBar「功能」→ 滚到四仪表卡（#features 落位）；
# 375px：Hero 单列（左列在上）、对比区单列 + VS 横排、仪表卡 1 列；max-w-7xl 在 1440px 下两边距对称
```

**验收标准：** Hero 与 ccswitch-hero.png 布局逐项对上（徽章/标题/slogan/描述/双钮/三灯/缩略海报/右列大窗+链接）；对比区 5+VS+2+兼容行齐全且 zh/en 文案即增量表原文；四仪表卡四链路 demo#d1–d4 落位正确；三删除组件零残留；state-*.png 仍在 public；23 测试绿；parity 绿（241 key）。

---

## P10-B · D1 宽幅与三 APP 窗

### Task 35: D1 宽幅双列 + CodexAppWindow / WorkBuddyAppWindow / ZCodeTaskWindow + 剧本映射

**Files:**
- Create: `src/demo/AppWindowShell.tsx` `src/demo/CodexAppWindow.tsx` `src/demo/WorkBuddyAppWindow.tsx` `src/demo/ZCodeTaskWindow.tsx`
- Modify: `src/pages/DemoPage.tsx` `src/demo/scenes/D1Scene.tsx` `src/demo/steps-d1.ts` `src/i18n/{zh,en}.json`（+0 key、改值 3 处）
- Delete: `src/demo/CodexCliTui.tsx` `src/demo/WorkBuddyTui.tsx` `src/demo/ZCodeIdeWindow.tsx`

- [x] **Step 35.1: AppWindowShell（公用壳，规格见总表）**

灯位语义/关闭行为逐行对照 TuiShell.tsx:29-39（红灯 = onClose，无则装饰性 aria-hidden）；差异：无 header/footer 插槽、无拖动/右键菜单（B24）；sidebar 边框 `border-r` 色由 `sidebarClassName` 给。

- [x] **Step 35.2: 三个 APP 窗组件（按规格总表逐项实现）**

每文件结构：文件头注释（对照图路径）→ 文案常量区（侧栏/聊天/事件流全部真实内容，集中声明）→ 组件（AppWindowShell 包 sidebar + main）。要点：

- `CodexAppWindow.tsx`：侧栏 Projects 三项目的子任务为**独立数据常量**（数组渲染 + truncate），不写死 JSX 重复块；主区树状清单卡行首 `├─/└─` 字符 mono 渲染（同 P9 CodexCliTui 树行先例）
- `WorkBuddyAppWindow.tsx`：任务/空间两组列表数据常量（名 + 日期两列）；Buddy 加油站浮动卡置于侧栏 `relative` 内 `absolute`；操作图标排 7 个自绘 12px 图标 + 右侧消耗文案
- `ZCodeTaskWindow.tsx`：三项目组数据常量（组名 + [{title, time}] + more 标志）；事件流块间 `space-y-2.5`，终端命令块 `#101014` mono；窗口控制 `— □ ×` 为纯文字 span（装饰 aria-hidden）

三窗统一 `{ className?: string; onClose?: () => void }`；所需图标窗内 `svgProps` 自绘（P9 ResourcesScene 先例）。

- [x] **Step 35.3: DemoPage per-section 容器 + D1Scene 双列与映射**

`DemoPage.tsx`：`<main className="px-5 py-14">`；标题区与 d2/d3/d4/ledger 各 section 内容包 `mx-auto max-w-5xl`；**d1 section 用 `mx-auto max-w-7xl`**（B21）。`D1Scene.tsx`：

```tsx
<div className="grid items-start gap-6 p-1 md:grid-cols-2">   {/* 左右两窗各约 4:3，移动端单列（决策 6） */}
  <AppBoard />
  <div className="flex flex-col gap-3">
    <AnimatePresence mode="wait">
      {/* claude → ClaudeTui（不变）/ kimi → KimiShellTui（不变） */}
      {windows.toolWin === "codex" && (<motion.div key="codex" {...SPRING}><CodexAppWindow onClose={closeWin} /></motion.div>)}
      {windows.toolWin === "workbuddy" && (<motion.div key="workbuddy" {...SPRING}><WorkBuddyAppWindow onClose={closeWin} /></motion.div>)}
      {windows.toolWin === "zcode" && (<motion.div key="zcode" {...SPRING}><ZCodeTaskWindow onClose={closeWin} /></motion.div>)}
    </AnimatePresence>
  </div>
</div>
```

窗体自然高（不设固定高）；PlayerFrame 外层舞台维持 h-[420px]/md:h-[500px] 定高内滚（防页面跳动，决策 6 策略现状已满足——本步仅确认不新增内层定高）。删除三旧窗文件及 import（`grep -rn "CodexCliTui\|WorkBuddyTui\|ZCodeIdeWindow" src/` 零命中）。

- [x] **Step 35.4: steps-d1 label 改值（enter 不动）+ i18n 改值 3 处**

s4 label → `{ zh: "跳转②：Codex APP 任务窗（ChatGPT Work）", en: "Jump 2: the Codex app window (ChatGPT Work)" }`；s6 → `{ zh: "跳转④：WorkBuddy APP 任务窗", en: "Jump 4: the WorkBuddy app window" }`；s7 → `{ zh: "跳转⑤：ZCode 任务窗——事件流全程可溯", en: "Jump 5: the ZCode task window — the full event stream" }`；s3/s5（Claude/Kimi）label 不动。enter/dur/detailKey 结构不动（d1s4/d1s6/d1s7 为 i18n 改值，见改值表）。

- [x] **Step 35.5: 机器验证 + 浏览器核对**

```bash
pnpm exec tsc --noEmit && pnpm test    # Expected: 23 passed（d1 断言 toolWin 值不变，零适配）
pnpm build && pnpm dev
# 核对：/demo D1 容器 7xl、两窗双列 4:3 级、窗体自然高 + 舞台内滚、375px 单列堆叠；
# 剧本七段：s4 Codex APP 窗（ChatGPT Work 胶囊/Projects 三组/标题条/树状卡/输入行黑↑）→
#   s6 WorkBuddy 窗（任务3/空间5/Buddy加油站/你是什么模型对话/绿↑）→ s7 ZCode 窗（三项目组/
#   事件流/黑↑）；对照 p10-ref 三图逐项过（结构+元素+配色，不按像素）；
# 手动点 codex/workbuddy/zcode 三卡开窗互斥切换 + 红灯关窗；claude/kimi 两窗不回归；
# d2/d3/d4/ledger 四节仍 5xl 对齐、锚点 demo#d1..#d4 落位
```

**验收标准：** 三 APP 窗与规格总表逐项对上（Codex：账户胶囊/Projects 三组/计划卡/黑↑输入行；WorkBuddy：双列表/加油站浮卡/气泡+操作排/绿↑+页脚；ZCode：置顶+三项目组/标题栏七件/事件流四类块/黑↑输入条）；D1 宽幅双列 + 移动端堆叠 + 舞台定高内滚；三旧窗零残留；23 测试绿；parity 绿（241 key）。

---

## P10-C · D2 终端场景组件化

### Task 36: 截图采集（控制方前置）+ ClaudeTui 四场景 + d2 节拍适配 + D2/D3 固定高度

**Files:**
- Modify: `src/demo/ClaudeTui.tsx` `src/demo/scenes/RemoteScene.tsx` `src/demo/steps-d2.ts` `src/demo/player.test.ts` `src/demo/PhoneFrame.tsx` `src/i18n/{zh,en}.json`（+0 key、改值 3 处）
- 采集（控制方，非代码）：`docs/design/p10-ref/claude-{approval,plan,single,file}.png`

- [x] **Step 36.0: 截图采集（控制方电脑操控执行，T36 前置）**

控制方开真 claude 会话采集四场景截图入 `docs/design/p10-ref/`：① `claude-approval.png` 审批确认（Yes/no 选项列表）② `claude-plan.png` 计划模式（Ready to code? / plan 呈现）③ `claude-single.png` 单选题（Enter to select 列表）④ `claude-file.png` 文件预览。**实现不阻塞**（B27）：36.2 先按场景规格总表实现（approval/plan 选项文案为 Claude Code 官方真实文案、select 对照已入库 multiselect 图），36.5 截图到位后逐项校对。截图随 T36 commit 入库。

- [x] **Step 36.1: ClaudeTui scene prop + 三场景块（规格见场景总表）**

`scene?: "session" | "approval" | "plan" | "select"` 默认 `"session"`；场景常量区集中在文件头（选项文案/回顾段/hook 树/题域选项三组带描述）；选中态高亮行统一 `❯` 橙 + `#1F1D18` 行底（approval/plan/select 三处复用同一行组件 `OptionRow`）；select 场景含 ② 用户行内容替换（`帮我把这道题归到题目领域`）——场景块接管用户行时透传覆盖。session 分支与 welcome 分支零改动；extraLines/toast/modeLine/waiting 全部照旧。

- [x] **Step 36.2: RemoteScene 场景派生 + tuiLines v2 + steps-d2 s5–s7 修订**

```tsx
// RemoteScene.tsx
const scene = remote.approval === "pending" ? "approval"
  : remote.question ? "select"
  : remote.planMode ? "plan" : "session";
<ClaudeTui mode="session" scene={scene} ... />

// tuiLines v2：删 pending 分支（场景块自含 ⏸/选项），保留 approved 与 queued 行
function tuiLines(approval, messages): TuiLine[] {
  const lines = approval === "approved"
    ? [{ text: "✓ Approved from Tuvis Remote — resuming", tone: "ok" },
       { text: "  committing changes…", tone: "dim" }]
    : [];
  /* queued 消息行照旧 */
}
```

`steps-d2.ts` s5/s6/s7 enter 按修订表改（s5 question:null + planMode:true；s6 planMode:false + question multi 已提交；s7 question:null + planMode:false + files:true）；label 不动；detailKey d2s3/d2s5/d2s6 走 i18n 改值。`player.test.ts:74` 断言适配：`expect(r.question).toBe(null)`（s7 终态），files/queued 断言保留。

- [x] **Step 36.3: D2 手机端固定高度（决策 14）**

`PhoneFrame.tsx` 面板（内层 `rounded-[26px]` div）加 `flex h-[560px] flex-col overflow-y-auto overscroll-contain`——看板页筛选后卡数变化不再改变手机高度；`RemoteDetail.tsx` 根元素去掉 `max-h-[380px] overflow-y-auto`（改为自然内容，滚动交给 PhoneFrame）。bezel/padding 不动。

- [x] **Step 36.4: D3 固定宽高核对（P9 已做则核对，预计零改动）**

核对项：ResourcesScene 处于 PlayerFrame 定高舞台（h-[420px]/md:h-[500px]）内、仓库表格长时窗内自然滚动、窗宽随 D1 改造不受影响（D3 仍 5xl）→ 满足即勾选，不满足才最小修复。

- [x] **Step 36.5: 机器验证 + 截图校对 + 浏览器核对**

```bash
pnpm exec tsc --noEmit && pnpm test    # Expected: 23 passed（d2 断言适配后计数不变）
pnpm build && pnpm dev
# 核对（截图到位后逐项「字对字、色对色」校对四场景；未到位按规格总表核对）：
# 触发排「发起审批」→ TUI ⏸ Permission needed + ❯1. Yes 高亮三选项；「允许」→ 选项收起
#   + ✓ Approved 续跑（session 态）；
# 「切计划模式」→ TUI Ready to code? 三选项 + plan mode 底行 + 手机 banner；
# 「出一道题」→ TUI 题目领域 chip + 粗体问题 + ❯1. 金融/信用评级 + 描述缩进 +
#   Enter to select 底行；手机单选/多选点选提交照旧；
# 剧本七段：s2 审批场景 / s3 ✓ Approved / s5 plan / s6 select / s7 session+toast 逐拍对应；
# 手机高度恒定（筛选 ZCode 只剩一卡、删除多卡后 PhoneFrame 不缩）；
# D1 两处 ClaudeTui（D1 场景/RemoteScene）不回归（默认 session）
```

**验收标准：** 四场景与规格总表/截图逐项对上（选中态 ❯+行底、选项文案原文、底行提示）；剧本 s2/s3/s5/s6/s7 与场景一一对应且 seek 幂等（任意段重放视觉确定）；tuiLines 无重复 ⏸ 行；手机端高度恒定内滚；23 测试绿；parity 绿（241 key）。

---

## P10-D · D4 宠物功能扩展

### Task 37: 右键菜单 + 模拟配置面板 + 左侧功能卡 + 模拟导入

**Files:**
- Modify: `src/demo/scenes/PetUsageScene.tsx` `src/i18n/{zh,en}.json`（+16 key）

- [x] **Step 37.1: 场景级三控件 state + 右键菜单**

PetUsageScene 顶部提升 state：`freq`（0.5–2 滑杆，默认 1——帧计时器 `ANIM[anim].d[i] * freq` 即时生效，纯前端）、`voice`（默认 true——叠加 PETS[pet].voice 既有门控）、`pinned`（默认 true——宠物容器加 `ring-2 ring-app-btnp/40 + shadow-pop` 视觉）。宠物元素 `onContextMenu`（preventDefault）弹菜单（TuiShell 菜单模式：`role="menu"` + Esc/点外关 + `fixed` 定位）：`pet.menu.feed` / `pet.menu.behavior` / `pet.menu.switch` / `pet.menu.hide` 四项。行为：喂食 → `setAnim("jumping")` 2.6s + 头顶迷你卡 `pet.fed`（复用 petRun 卡动效样式）；编辑行为 → 打开 Step 37.2 面板；切换宠物 → bell↔starry 循环；隐藏桌宠 → `hidden=true`（Step 37.4 唤出）。触发排加「宠物菜单」按钮（`pet.menu.open`，键盘可达同一菜单——右键为增强）。

- [x] **Step 37.2: 模拟配置面板（编辑行为）**

宠物旁浮动面板（同 hover 浮窗样式 `rounded-[14px] border border-app-line bg-app-bg p-3 shadow-soft`，`absolute` 于宠物容器上方）：标题 `pet.behavior.title` + 三控件——频率滑杆（`<input type="range" min="0.5" max="2" step="0.1">` + `aria-label=pet.behavior.freq` + 当前值显示 `×{freq}`）、语音开关（`aria-pressed` chip）、置顶开关（`aria-pressed` chip）。与左侧「编辑行为」卡共享同一组 state（同一组件或同源 props）。

- [x] **Step 37.3: 左侧两张常驻功能卡（决策 16）**

PetUsageScene 布局改 `grid gap-4 md:grid-cols-[240px_minmax(0,1fr)]`（左列 + 现有宠物区；宠物 absolute 定位在舞台内不变）：

```tsx
{/* 卡 1：在线仓库 */}
<div className="rounded-[14px] border border-app-line bg-app-bg p-3">
  <div className="text-xs font-semibold text-app-ink">{t("pet.repo.title")}</div>
  <p className="mt-0.5 text-[10px] text-app-mut">{t("pet.repo.desc")}</p>
  <ul className="mt-2 space-y-1.5">   {/* 每行：缩略 + 名 + 状态 */}
    <PetRepoRow pet="bell"   label={t("pet.bell")}   ok />          {/* 现有图集 idle 首帧 */}
    <PetRepoRow pet="starry" label={t("pet.starry")} ok />
    <PetRepoRow pet="snowy"  label={t("pet.repo.snowy")} ok={imported}   {/* hue-rotate(180deg) 占位 */}
    <PetRepoRow pet="coal"   label={t("pet.repo.coal")}  ok={imported}   {/* brightness(.25) saturate(.6) */}
  </ul>
  <button onClick={importAll} className="mt-2 w-full rounded-lg border border-app-line px-2 py-1 text-[11px] ...">
    {phase === "done" ? t("pet.repo.imported") : t("pet.repo.import")}
  </button>
</div>
{/* 卡 2：编辑行为（37.2 三控件常驻版 + 语音绑定摘要行） */}
```

一键导入动效（纯模拟，B29）：点击 → 按钮进入 `导入中…`？**不新增 key**：按钮 disabled + `animate-pulse` 800ms → `pet.repo.imported` + 雪团/煤球两行打 ✓（仅列表态变化，不切真宠物）。占位缩略：`frameStyle("idle", 0, 0.12, "bell")` + 行内 `style={{ filter }}`（snowy `hue-rotate(180deg)` / coal `brightness(0.25) saturate(0.6)`）。

- [x] **Step 37.4: 隐藏/唤出 + 机器验证**

`hidden` state：true 时宠物元素不渲染，「唤出桌宠」按钮（既有 `pet.call`）兼作恢复入口（hidden 时按钮高亮提示）。d4Steps/d4Reset 不动（剧本不触新功能）。

```bash
pnpm exec tsc --noEmit && pnpm test    # Expected: 23 passed
pnpm build && pnpm dev
# 核对：右键宠物弹四项菜单（Esc/点外关）+ 触发排「宠物菜单」键盘可达；
# 喂食 → 跳跃 + 🥕 开饭啦迷你卡；编辑行为 → 面板开、滑杆动帧率即时变（拖动跑动也变）；
# 语音开关关掉贝贝审批不再出声；置顶开关切换光环；
# 左列两卡常驻（375px 折叠为上卡下舞台）；一键导入 800ms 动效 → 两行 ✓；隐藏 → 唤出恢复；
# 既有链路不回归：拖动跑动/三段剧本/宠物切换/hover 浮窗/语音门控/通知卡
```

**验收标准：** 右键菜单四项 + 键盘替代入口全通；三控件即时生效且面板/左卡状态同步；在线仓库卡四行（两真两占位换色）+ 导入动效；隐藏/唤出闭环；既有 D4 交互零回归；23 测试绿；parity 绿（257 key）。

---

## P10-E · 账本范围数据

### Task 38: ledgerData v4 五档数据集 + LedgerSection 全联动

**Files:**
- Modify: `src/demo/ledgerData.ts` `src/demo/ledgerData.test.ts` `src/demo/LedgerSection.tsx`（i18n 0 变更）

- [x] **Step 38.1: ledgerData v4（数据按 v4 数据总表实现）**

`RangeKey` 类型移入并导出；`LedgerDataset` 接口；`LEDGERS` 四实体 + custom 别名（`LEDGERS.custom = LEDGERS.last30d`）；last7d 数据自旧 `LEDGER`/`TREND` 原样迁入（一行不改）；`dateLabel(start, i)` 纯函数生成 30 天标签（`9/12`…`10/11`，`new Date(2026, 8, 12 + i)` 取 `getMonth()+1/getDate()`）；删旧 `LEDGER`/`TREND` 导出。实现者按总表末尾「数字自检」逐档复核合计。

- [x] **Step 38.2: ledgerData.test.ts（6 → 8 用例）**

```ts
describe("ledger v4 invariants", () => {
  const KEYS = ["last5h", "today", "last7d", "last30d", "custom"] as const;
  it("每档三个维度合计都等于该档 totalTokens", () => {
    for (const k of KEYS) { const d = LEDGERS[k];
      for (const dim of [d.byTool, d.byProject, d.bySupplier])
        expect(sum(dim.map((r) => r.tokens))).toBe(totalTokens(d.metrics)); }
  });
  it("每档趋势合计等于 totalTokens、长度 = 5/8/7/30、峰值 = 数据最大值", () => { /* 同构断言 */ });
  it("每档命中率 = cacheHit/reqInput ∈ [0.95, 0.99]", () => { /* 循环 hitRate 断言 */ });
  it("占比合计 ≈ 100%（每档三维）", () => { /* 循环 */ });
  it("formatCN 三档 + formatInt 千分位（不变）", () => { /* 原用例 */ });
  it("smoothPath：M 开头、n-1 段 C、无 NaN（不变）", () => { /* 原用例 */ });
  it("量级递增：last5h < today < last7d < last30d", () => {
    const T = (k: RangeKey) => totalTokens(LEDGERS[k].metrics);
    expect(T("last5h")).toBeLessThan(T("today"));
    expect(T("today")).toBeLessThan(T("last7d"));
    expect(T("last7d")).toBeLessThan(T("last30d"));
  });
  it("custom 为 last30d 别名 + 30 天标签首尾正确", () => {
    expect(LEDGERS.custom).toBe(LEDGERS.last30d);
    expect(LEDGERS.last30d.trend.labels[0]).toBe("9/12");
    expect(LEDGERS.last30d.trend.labels.at(-1)).toBe("10/11");
  });
});
```

- [x] **Step 38.3: LedgerSection 五档联动**

`const data = LEDGERS[range]` 单源取数：概要卡 metricCells/deltas/asOf、趋势卡 `data.trend` + 峰值 `Math.max(...data.trend.tokens)` 派生（右上峰值行替换硬编码 1_568_000_000）、hover tooltip、工作小结 `data.work`、分布三维与占比分母 `totalTokens(data.metrics)`。标签抽稀（B30）：`labelIdx = n <= 14 ? all : labels.map((_,i)=>i).filter(i => i % Math.ceil(n/10) === 0 || i === n-1)`。范围 chips/导出排/页签/窗头不动；默认 `last7d` 不变。

- [x] **Step 38.4: 机器验证 + 浏览器核对**

```bash
pnpm exec tsc --noEmit && pnpm test    # Expected: 25 passed（23 - 6 + 8）
pnpm build && pnpm dev
# 核对：五档 chips 逐一点过——大数字/六指标环比/数据截止/asOf 行、趋势（点数 5/8/7/30、
#   峰值行随档变、30 天档标签抽稀每 3 出 1 + 末点、hover 值正确）、工作小结、分布三维全联动；
# 近 7 天档与 P9 版逐位一致（真实数据回归锚点）；自定义 = 近 30 天同值；
# 窗高恒定内滚不随档变化；375px 单列
```

**验收标准：** 五档数据全部通过 8 条不变式（合计/命中率/量级/别名/标签）；近 7 天档与改造前逐位一致；全卡片随 chips 即时联动；25 测试绿；parity 绿（257 key）。

---

## P10-F · 全站验收

### Task 39: 全站验收（A11y ≥ 95 + 交互矩阵 + Lighthouse + 总报告）

**Files:**
- Modify: `docs/superpowers/plans/progress.md`（最终验收报告，控制方写）；发现缺陷最小修复另起 commit

- [x] **Step 39.1: 机器验证全绿**

```bash
pnpm exec tsc --noEmit && pnpm test    # Expected: 25 passed
pnpm build                             # tsc 零错误 + dist/404.html 生成
grep -riE "analytics|gtag|hotjar|plausible|umami" dist/ || echo "zero-tracking ok"
grep -rn "StatesSection\|FeaturesSection\|BoardShowcase\|CodexCliTui\|WorkBuddyTui\|ZCodeIdeWindow" src/ || echo "p9-p10 schema cleanup ok"
ls public/img/state-*.png              # 三图仍在（决策 2）
grep -rn "app-bg\|app-ink\|app-line" src/home/ | grep -v "WorkflowCompare\|Hero" || echo "app-tokens scoped ok"
```

（Hero/WorkflowCompare 内经 AppBoard/DesktopStage 间接使用 app 令牌属预期——AppBoard 本身全 app 令牌，与 P8-P9 BoardShowcase 先例一致；grep 白名单按命中实情核对，不允许 home 直接新写 app-* 工具类。）

- [x] **Step 39.2: 滚动与导航回归（zh/en 各一遍）**

- [x] 首页 TopBar「功能」→ 滚到四仪表卡；「免费下载」→ #download；Hero「打开完整演示 →」→ /demo 顶部
- [x] 四仪表卡 → demo#d1–d4 锚点落位；`demo#d1..#d4` 直达；语言切换回顶；五页（/zh /en /docs /changelog /demo）正常渲染

- [x] **Step 39.3: 交互矩阵（pnpm preview 逐项勾）**

- [x] 通用（每场景）：播放/暂停/续播；seek+重放；hover 说明（zh/en）；播完回绕；固定高度内滚；交互即暂停
- [x] 首页：Hero 窗 chips 筛选/卡片 hover/摘要行等待数；三灯行；对比区 5+VS+2+兼容行；4 仪表卡链接落位；375px 宽度矩阵（Hero 单列/对比区单列/仪表 1 列）
- [x] D1：七段剧本（s4/s6/s7 三 APP 窗对照三图逐项）；三卡开窗互斥 + 红灯关窗；claude/kimi 窗不回归；双列 4:3 + 移动端堆叠 + 舞台定高内滚
- [x] D2：四场景 TUI（审批选项/Ready to code?/题目领域选项/✓ Approved）+ 手机五交互 + 高度恒定；seek 幂等（s2↔s3↔s5↔s6↔s7 往返视觉确定）
- [x] D3：全交互回归（P9 清单）+ 固定宽高核对项
- [x] D4：右键菜单四项 + 宠物菜单按钮；配置面板三控件即时生效；左列两卡；导入动效；隐藏/唤出；拖动跑动/三段剧本回归
- [x] 账本：五档全联动 + 近 7 天回归锚点 + 30 天标签抽稀 + 导出/记录 disabled+title
- [x] 键盘：Tab 可达全部新控件（仪表卡 Link/APP 窗红灯/场景派生下的既有控件/D4 菜单与滑杆/账本 chips）；Enter/Space 触发；Focus 出说明

- [x] **Step 39.4: Lighthouse 复测（Chrome DevTools，/zh/ 与 /zh/demo）**

- 记录 Performance / Accessibility 分数进 progress.md
- **硬门槛：Accessibility ≥ 95**（不达标必须修；重点复查：三 APP 窗 11px 小字对比、对比区红绿次文字对比、Hero 三灯行文字、D4 滑杆可聚焦、账本 30 点图表标签）
- Performance ≥ P9 基线（首页 74 / 演示 86）；新组件纯静态 DOM、hero-poster 复用既有图（200px 缩略反而减负）

- [x] **Step 39.5: 终验收 + 总报告（控制方）**

```bash
git add -A && git commit -m "chore: p10 acceptance pass"
# progress.md 追加 P10 总报告：任务/commit 对照表、测试计数（25）、i18n 终值（257 key）、
# Lighthouse 分数、四张采集截图对照结论、遗留观察项
```

**验收标准（P10 完成的定义）：** 机器验证五条全绿（25 测试 / build / 零追踪 / 删除组件零残留 / state 图保留）；39.2 滚动回归全勾；39.3 交互矩阵 7 组全勾；A11y ≥ 95；六条主线逐一闭环（首页 CC Switch 化 / D1 宽幅三 APP 窗 / D2 四场景 + 手机恒定高 / D4 菜单面板双卡 / 账本五档 / 验收）；progress.md 有 P10 总报告。

---

## 交接备注（P11 及以后候选池）

- `BrowserFrame` / `CarrotLamp` 本期成为死组件（保留未删）——下期首页若引入浏览器壳/胡萝卜灯元素可复用，否则随下期大扫除删除
- APP 窗内部交互（侧栏任务切换/聊天输入/事件流展开）均为静态拟真——需求复活时从三张真截图反推交互态
- 账本「记录」页签、真实导出（复制文本/CSV）仍 disabled；五档数据为合成自洽（近 7 天为唯一真实档），接真实数据源时替换 LEDGERS 合成三档
- D4 雪团/煤球为 CSS filter 占位——真宠物素材（新精灵表）到位后在 PETS 注册并扩 `PetId`
- hero-poster.png 压缩（二期 E7）继续挂账；首页 Hero 实时窗与 /demo D1 共享全局 store（筛选/收卡状态跨页保留），若需隔离再议 store 分片
