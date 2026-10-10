# P13 计划：首页信息架构重排 · 内容自动同步与上线准备 · 演示保真大修 · 文档直达

> 日期：2026-10-12 · 状态：**已执行（2026-10-12 T46–T56 全部完成，矩阵位置修正已并入）**
> 来源：用户 2026-10-12 反馈批次（两轮 grilling 已裁决完毕，裁决记录见 §0）
> 前序：P0–P12 已完成（见 progress.md）；本计划任务编号从 T46 续起

---

## 0. 本轮裁决记录（grilling 两轮，全部已拍板）

| # | 决策点 | 裁决 |
|---|---|---|
| G1 | 上线与自动同步范围 | **一步到位**：deploy.yml 三触发线（push + 每 6 小时定时兜底 + repository_dispatch）全配；三类内容（更新日志/兼容矩阵/用户手册）构建时从 tuvis 主仓 API 拉取，失败用仓内副本兜底；tuvis 仓侧触发 workflow 草稿一并写好，PAT 用户之后配置即生效 |
| G2 | 手机 UI 真机化基准 | **硬件框 + 纯 Web UI**：保留黑色手机硬件框（信号/电量/挖孔），内部严格按 tuvis 主仓 `docs/design/remote-ui/` 定稿原型（01 看板、02 详情层）重做，**不画浏览器地址栏** |
| G3 | 看板空格处理 | **纯留空**：首页 4×2、演示 3×3，7 张工具卡自然排列，空格露桌面背景，不放占位卡 |
| G4 | 兼容矩阵位置 | **保持独立区块**，且放在**功能四卡和「你会这样用它」之前**（产品形态之后、功能四卡之前）——2026-10-12 开工前用户修正 |
| G5 | Hero 右侧 1/3 | **保留现有 hero-poster 海报图**；文案块在左 2/3 内稍居中 |
| G6 | D1 右侧窗口排列 | **单槽互斥切换 + 统一定高**（以 Kimi 窗为基准：高的缩略、矮的补齐）；不做多窗平铺 |
| G7 | 首次 push 时机 | **配置好但不 push**：deploy.yml、同步脚本、Pages 配置文档全部就绪并本地验证；push 由用户执行（或下轮明确授权后执行） |

**用户两个直接提问的回答（写入实现依据）**：
- 「v0.5.6 · 开源 是写死的还是动态的？」→ 现状**写死**（`zh.json` 的 `hero.badge`）；本轮改为**动态**：从构建时同步的 `changelog.json` 取最新版本号拼接，「开源」二字保留静态。tuvis 主仓最新 release 实为 **v0.5.6**（2026-10-11 发布），仓内 `changelog.json` 还是 0.5.5，首轮同步后对齐。
- 「宠物卡按下为什么变扁？」→ `PetUsageScene.tsx:231` 拖拽时叠加 `scale(1.05, 0.92)` 的"橡皮压扁"拟物动效；按本轮反馈**移除**（拖拽只位移，不变形）。

**参考图盘点结论（用户问「还缺什么参考图」）**：**不缺**。
- D2 手机端：权威 = tuvis 主仓 `docs/design/remote-ui/01-看板-定稿.html`、`02-详情层-定稿.html`（README 自声明「唯一视觉权威」，02 已覆盖问答卡/文件面板/审批红卡）；实现前拉取存入 `docs/design/p13-ref/`。真机参照 `public/manual/img/mobile-board.png`、`subagent-mobile.png`。
- D3 预设组：`public/manual/img/presets.png`（预设组区块真实 UI）+ `preset-create.png`（新建弹窗真实 UI）。
- D4 桌宠：`docs/design/p11-ref/pet-head-cards.png`、`pet-switch-grid.png`、`pet-import-dialog.png` + 真机 `public/manual/img/pet-window.png`（token 浮窗 + 两张常驻通知卡的真实形态）。
- 唯一无基准项：**OpenCode 桌面窗口**（站内新做）——按 OpenCode 官方 TUI 风格近似模拟并如实标注；用户如要求精确可后补截图（不阻塞）。

---

## 1. 首页信息架构重排

### 1.1 顶栏导航（TopBar.tsx）

- 导航项变为：**首页 · 产品形态 · 功能 · 演示 · 文档 · 更新日志 · EN**（EN = 现语言切换器，保持最右；不放 GitHub 链接，GitHub 入口保留在 Hero 按钮/Footer）。
- 映射：首页→`/{lang}`；产品形态→`/{lang}#product`（新）；功能→`/{lang}#features`；演示→`demo`（独立页）；文档→`docs`；更新日志→`changelog`。
- **字号加大**：容器 `text-sm` → `text-base`，链接高度/hover 态相应调整（保持 Lighthouse a11y 达标的点击区）。
- 移动端：新增导航项后 375px 必然溢出（P1 遗留 21px 溢出会恶化）——本轮补一个**md 以下折叠菜单**（简版汉堡展开），顺带清掉遗留项。

### 1.2 Hero（Hero.tsx）

- 删除第二排（桌面看板 + 手机整体迁出至「产品形态」区）。
- 第一排保留：左 2/3 文案块**整体靠右一点、在该列内稍居中**（列内 `justify-center`/水平留白，不再贴最左）；右 1/3 保留 hero-poster 海报图（G5）。
- **徽章动态化**：`hero.badge` 拆为 `v{LATEST_VERSION} · 开源`；`LATEST_VERSION` 从 `src/content/changelog.json` 的最新版本号读取（同步脚本产出，构建时已对齐主仓）；`hero.badge` i18n 只保留「开源」语义段。本轮先把仓内 `changelog.json` 同步到 v0.5.6。
- 双 CTA（免费下载 + GitHub）与三色小灯行不动。

### 1.3 产品形态（新独立区块，id=`product`）

- 区块标题「产品形态」+ 一句副文案；导航「产品形态」锚定此处。
- 布局沿用 2fr/1fr：左 = `DesktopStage` 内 `AppBoard interactive={false} columns={2}`；右 = `PhoneFrame` 内 `RemoteBoard`（静态，点卡仍跳 `/demo#d2`）。
- **看板 4 行 2 列**：种子扩到 7 个会话（见 §5），2 列网格自然形成 4 行（末行 1 卡 1 空位，G3 纯留空）。
- 底部保留「在完整 Demo 里亲手玩 →」链到 `/demo`。

### 1.4 功能区（四功能卡）+ 兼容矩阵（独立区块，G4）

- 四大功能卡维持现状（features.board/remote/res/pet → demo#d1–d4），锚点 `#features` 不变。
- **兼容矩阵修正**（`src/content/capabilities.json` + CompatMatrix.tsx）：
  - 列序改为用户指定：**Claude Code · Codex · OpenCode · Kimi Code · WorkBuddy · ZCode · dsh · OpenClaw**（现 JSON 为 claude/codex/opencode/openclaw/kimi/…，需调整顺序，OpenClaw 移至末列）。
  - OpenClaw 列**全部按「不支持 ✕」写上**（为了列对齐，不留空列）。
  - 表格改 `table-fixed` + 数据列均分列宽，保证每列严格对齐（现状 auto 布局列宽随内容漂移）；sticky 首列与横向滚动保持。

### 1.5 你会这样用它（三故事卡独立成区）

- 从 StoriesSection 拆出：上排四功能卡归「功能」区，下排三故事卡（night/out/billing）独立成「你会这样用它」区块。
- **移到「没有兔维斯 vs 有兔维斯」上方**。
- **删掉**「使用场景示意，非用户证言」注释行（SPEC 决策 10 由用户本轮裁决修订：不再展示该标注；SPEC.md 文件本身仍不改，修订记录落在本计划与 progress.md）。
- 三个故事卡的演示缩略示意组件保留。

### 1.6 没有兔维斯 vs 有兔维斯（WorkflowCompare 重构）

原则：**问题与解决方案一一对应**（左 5 右 5）；「兔维斯统一仓库，预设组一键对某工具切换常用组合」从左列 w4 描述里拆出，归入右列；w2+w3 融合为一条；新增「工具移动端割裂」一条。删除底部「兼容 Claude Code · …」兼容行（被矩阵替代）。文案草案（zh 源，en 实现时对译）：

| # | 没有兔维斯（问题） | 有兔维斯（方案） |
|---|---|---|
| 1 | **逐个终端巡检**——开五个窗口挨个看，谁在跑、谁在等全靠人肉刷新。 | **一块看板全局掌握**——八个工具的红绿灯在一块屏上，谁等待、谁在跑一眼扫清。 |
| 2 | **错过审批就卡死，出门就失联**——批准请求躺在终端里没人看见，任务一停一整晚；人在外面，桌面上的 Agent 一个也管不着。 | **手机上随时批准**——出门点一下「允许」就继续跑，状态同步到手机，Agent 不停工。 |
| 3 | **Skill 散落各处**——同一份 Skill 复制八份，改一处漏七处，版本各不相同。 | **统一仓库 + 预设组**——一份 Skill 全工具共享，预设组一键对某个工具切换常用组合。 |
| 4 | **移动端各自为政**（新增）——有的工具根本没有移动端；有移动端的也只连自家桌面端，每换一个工具重新学一套。 | **一个手机入口控所有工具**——兔维斯远程端统一操控八种工具，操作方式只有一套，学习成本只花一次。 |
| 5 | **用量一笔糊涂账**——钱花在哪个模型、哪个项目，月底才猜一次。 | **用量自动记账**——花销按工具/项目/供应商自动入账，随时打开账本看清。 |

### 1.7 开源 + 免费下载合并卡（收尾区块）

- 「开源 · 本地优先 · 无遥测」理念区与「免费下载」CTA 合并为**一张卡**（id=`download` 保留）：左半开源理念（MIT · `~/.tuvis/` · 无遥测 · GitHub 按钮），右半下载（平台检测按钮 + 前往 Releases + 系统标注 macOS 14+ / Windows 10+）。
- 原 OpenSource.tsx 与 DownloadCta.tsx 合并为单组件（如 `OpenSourceDownload.tsx`），卡片样式与全站 `bg-card border-line` 体系一致。

**首页最终区块顺序**（G4 修正版）：Hero → 产品形态 → 兼容矩阵（独立）→ 功能（四卡）→ 你会这样用它 → 没有 vs 有 → 开源+下载合并卡 → Footer。

---

## 2. 内容自动同步与上线准备（G1 + G7：配置齐全，**不 push**）

### 2.1 同步脚本统一升级（scripts/split-changelog.mjs 扩展）

- 现有机制保留：api.github.com contents API（base64 解码、3 次重试、403/429 不重试、失败保留上次产物 + exit 0）、`--in` 本地回退、`--offline`。
- **扩展两类源**：
  1. `docs/capabilities.json`（tuvis 主仓）→ 校验（复用已导出的 validateCapabilities）→ 覆写 `src/content/capabilities.json`；
  2. `docs/user-manual/{zh,en,img}`（tuvis 主仓）→ 覆写 `public/manual/`（现 `sync-user-manual.mjs` 是本地路径拷贝，升级为先试 API、失败回退本地路径）。
- 目录获取用 contents API 的目录列举（一次调用列 dir，逐文件拉取）；img 二进制走 download_url 流式下载。
- `package.json`：`prebuild` 串行跑三类同步（任一失败不阻塞构建，exit 0 兜底）；保留独立 `sync:changelog` / `sync:manual` 命令供手动跑。

### 2.2 deploy.yml（网站仓 `.github/workflows/deploy.yml`）

- 三触发线：`push`（main）、`schedule`（`cron: '0 */6 * * *'` 兜底）、`repository_dispatch`（type: `tuvis-docs-update`，PAT 配置后即生效）。
- 流程：checkout → pnpm + Node 20 → `pnpm build`（内含同步）→ actions/configure-pages + upload-pages-artifact + deploy-pages；加 `concurrency: pages` 防并发覆盖。
- 公开仓用默认 `GITHUB_TOKEN` 即可完成拉取与部署，**零 secret 即可上线**；PAT 仅 repository_dispatch 需要。
- base 路径已是 `/tuvis-website/`、404.html 已有，无需改。

### 2.3 tuvis 仓侧触发 workflow（草稿，用户复制）

- 产出 `docs/deploy/tuvis-repo-dispatch.yml` 草稿：tuvis 仓 push main 且 `docs/user-manual/**`、`CHANGELOG.md`、`docs/capabilities.json` 有变更 → `repository_dispatch` 通知网站仓。
- 附 `docs/deploy/README.md`：一次性配置清单（① 网站仓 Pages 开 GitHub Actions 模式；② fine-grained PAT（网站仓 actions:write）→ 存 tuvis 仓 secret；③ 复制 workflow 到 tuvis 仓）。

### 2.4 本轮交付边界（G7）

- `git remote add origin https://github.com/jarvislee90s-dot/tuvis-website.git` 可以做（本地操作）；**push 不执行**，把首次上线步骤写进 `docs/deploy/README.md` 检查单，用户照单执行或下轮授权后代跑。

---

## 3. 演示 D1 会话看板（保真 + tuvis 化）

- **看板 3 行 3 列**（演示页 `AppBoard columns={3}`）：7 张工具卡（3+3+1 排列，末行 2 空位纯留空，G3）。
- **新增 OpenCode**：种子会话 + SessionCard 支持品牌色 `#6B6B6B` + `OpenCodeTui` 窗口组件（深色终端壳、OpenCode 头部，内容近似模拟——无真实截图基准，如用户后补截图再校准）；`WINDOW_TOOLS` 加入 `opencode`（7 工具全可点开窗，openclaw 仍无卡）。
- **右侧窗口统一定高**（G6）：单槽互斥切换保持；定高常量 = Kimi 窗（KimiShellTui）自然高，Codex/WorkBuddy/ZCode/Claude/OpenCode 各窗内容按此高度裁剪或补齐（`overflow-hidden` + 内部 flex 吸底），六窗视觉完全等高。
- **ClaudeTui 中文化 + 头部吉祥物**（按用户 2026-10-12 截图）：头部加**橙色像素兔**位 + 三行头（`Claude Code v2.1.287 / glm-5.3-flash[1M] with max effort · API Usage Billing / cwd: …\tuvis-app`）；session 正文改中文（「你好！👋 我已就绪…」风格的 tuvis 主题对话），select/multiselect 场景本已中文、保持；字体风格对齐截图（等宽 + 中文行距）。
- **项目信息全部 tuvis 化**：seed 与各窗口/通知卡里的 `portfolio`、`quant-chart`、`landing`、`持仓`、`组合监控` 等外部项目信息 → tuvis 生态主题（`tuvis-app` 桌面端、`tuvis-website` 官网、`tuvis-docs` 手册、`tuvis-ledger` 账本等），消息文案随之改写。

## 4. 演示 D2 远程操控（固定比例 + 按 02 定稿重做）

- **手机固定比例**（首页 + 演示统一）：`PhoneFrame` 屏幕区锁定 **163.4 : 78.0**（iPhone 18 Pro Max 形态，高 ≈ 宽 × 2.095）；基准宽演示页 360px、首页 340px，窄屏等比缩放；**大小不随筛选卡片/内容变化**；内容用 flex 排布、条数封顶，**依旧零内滚**（P12 红线延续）。
- **RemoteBoard 按 01-看板-定稿.html**：品牌行（Tuvis v{LATEST} · MateBook16s）+ 标题行（SVG 图标）+ 中性筛选 chips + 白卡彩檐会话卡（8 工具真图标、状态徽标）——对照定稿逐状态重做。
- **RemoteDetail 按 02-详情层-定稿.html**：头部（返回 + 会话名 + 「Claude · id8」+ 绿点 + 缩放下拉 + 刷新）；「文件 / 子 Agent」**胶囊切换行**（紫 pill）；子 Agent 列表行（圆点 + 名 + 描述 + 时间 + token 数）；消息流；审批红卡；**单选/多选问答卡按定稿样式重做**；**文件面板按定稿重做**（文件树 + 预览形态）；底部「完全信任 / 切换模式」chips + 「+ / 输入 / 发送」输入行。现有实现里与定稿不符的（自研 chip 行、自研题卡样式、FilePreview 形态）全部对齐替换。
- **右侧终端定高**：ClaudeTui 高度固定，与手机等高对齐（双端同框底线齐平）；终端内容用 §3 的中文版 ClaudeTui。

## 5. 演示 D3 资源管理（预设组真实 UI + 新剧本）

- **预设组区块移到 Skill/MCP/插件区下方**，按 `presets.png` 重做：
  - 区块头「预设组 (n)」+「+ 创建」按钮；「通用预设」分组标签；
  - 每张预设卡 = 名称 + 资源数徽标 + 删除按钮 + **7 个工具开关行**（Claude Code / Codex / OpenCode / Kimi Code / WorkBuddy / ZCode / DSH，现 UI 只有 5 列需补齐）；
  - 开关某工具 = 仅对该工具生效、不影响其他工具（真实机制，现有 toggleCell 语义保留并接入预设卡）。
- **「新建预设组」弹窗**按 `preset-create.png`：类型（通用 / 工具私有 radio）+ 名称输入 + 描述 textarea + Skill 勾选列表（真名：brainstorming、executing-plans、test-driven-development 等 superpowers 系）+ 创建按钮。
- **剧本改 4 步**（用户指定）：① 从各工具集中导入 skill 等资源（扫描/导入动效）→ ② 手动给某工具开启/禁用某 skill 或 MCP（矩阵单元格 toggle 特写）→ ③ 新建「前端开发」预设组并给 **Kimi Code** 开启 → ④ 新建「superpowers 标准开发」预设组并给 **Claude Code** 开启；字幕与 hover 详情同步改写（双语）。

## 6. 演示 D4 桌宠与账本（真实 UI + 新剧本）

- **头顶布局对齐真机 `pet-window.png`**：
  - 两张**常驻**通知卡（红点「ZCode … 等待操作」/ 绿点「Kimi Code … 已完成」格式，带 × 关闭，内容 tuvis 化）——常驻机制保留；
  - **删除常驻用量摘要卡**；token 详情浮窗改为**仅悬浮（hover）或剧本步 4 触发**出现，浮窗四行格式对齐真机：`请求输入 · 命中率 / 缓存命中 · 产出 / 按工具… / 本会话…` + 「详情 »」入口。
- **切换宠物 / 导入宠物两张卡**：现有 SwitchPetDialog、ImportPetDialog 已按 p11-ref 定稿实现，本轮对照真机截图复核细节（间距/文案/选中态），不改大结构。
- **剧本改 4 步**（用户指定）：① 导入宠物（ImportPetDialog 演示）→ ② 切换宠物（SwitchPetDialog 演示）→ ③ 审批到达，头顶卡**黄变红**（状态灯联动）→ ④ 头顶出现 token 浮窗。
- **移除按压变扁**：删掉拖拽时 `scale(1.05, 0.92)` 形变，拖拽仅位移（含落地回弹动效保留与否以视觉自然为准，不再压扁）。

## 7. 文档页直达（DocsPage）

- **删除「总体导航卡片」落地页**：`/{lang}/docs` 直接渲染 **01-overview** 文章内容（路由重定向或直接以 slug=01-overview 渲染 DocsArticlePage）。
- 文章页导航保持可用（侧栏/上一篇下一篇，13 篇手册结构不变；实现时检查 DocsArticlePage 若无侧栏则补简洁目录，不重做）。

---

## 8. 任务拆解（编号续接 P11 的 T45）

| # | 任务 | 内容摘要 | 依赖 |
|---|---|---|---|
| ✅ T46 | 同步脚本扩展 + badge 动态化 | §2.1 三源同步；changelog.json 刷到 v0.5.6；Hero 徽章读 LATEST_VERSION | — |
| ✅ T47 | 导航与首页骨架重排 | §1.1 TopBar（字号/新项/移动折叠）+ §1 区块顺序 + §1.7 合并卡 + §1.5 故事卡拆分上移 | — |
| ✅ T48 | Hero 与产品形态区 | §1.2 文案居中位 + §1.3 新区块（4×2 看板 + 固定比例手机） | T46, T49(种子) |
| ✅ T49 | D1 保真 tuvis 化 | §3 全部：种子 tuvis 化 + opencode + 窗口等高 + ClaudeTui 中文兔头 | — |
| ✅ T50 | D2 重做 | §4：PhoneFrame 固定比例 + RemoteBoard/RemoteDetail 按 01/02 定稿 + 终端定高 | T49(ClaudeTui) |
| ✅ T51 | D3 预设组 | §5：真实预设 UI + 新建弹窗 + 4 步剧本 | — |
| ✅ T52 | D4 桌宠 | §6：头顶卡/浮窗机制 + 4 步剧本 + 移除压扁 | — |
| ✅ T53 | 矩阵列序与对齐 | §1.4：capabilities.json 列序 + OpenClaw 全 ✕ + table-fixed | — |
| ✅ T54 | 部署准备 | §2.2 deploy.yml + §2.3 tuvis 仓 workflow 草稿 + docs/deploy/README 检查单（**不 push**） | T46 |
| ✅ T55 | 文档页直达 | §7 | — |
| ✅ T56 | 对照验收（controller） | 全量测试/tsc/build、浏览器断言（区块顺序、4×2/3×3、手机比例与零内滚、窗口等高、矩阵列序）、Lighthouse a11y≥95、i18n parity | 全部 |

执行纪律沿用：每任务 test/build 绿 → commit → 勾计划框 → progress.md 追加；红线不动（SPEC.md/brand//legacy/ 不改、不加 npm 依赖、下载 API 回退保留、零追踪、**本轮不 push**）。

## 9. 验收标准

1. `pnpm test`、`tsc --noEmit`、`pnpm build` 全绿；i18n 中英 key parity 通过。
2. 浏览器断言：首页区块顺序符合 §1；导航七项与字号；产品形态区看板 4×2（7 卡 1 空位）+ 手机比例 163.4:78.0 且不随内容变化；演示看板 3×3（7 卡 2 空位）；D1 六窗切换等高（Kimi 基准）；手机全场景零内滚；矩阵 8 列等宽对齐且列序正确；文档 /docs 直达 01-overview。
3. 同步脚本：`--offline` 与正常模式均通过；拉取失败时构建不阻塞、用仓内副本。
4. `deploy.yml` 语法有效（actionlint 或等价校验）；`docs/deploy/README.md` 检查单完整可照做。
5. Lighthouse a11y ≥ 95（现水平不回退）；Performance 不低于 70。

## 10. 用户待办（本轮新增/延续）

| # | 事项 | 时点 |
|---|---|---|
| 1 | 把 `docs/design/p11-ref/capabilities.for-tuvis.json` 提交到 tuvis 主仓 `docs/capabilities.json`（本轮同步脚本已就位，提交后矩阵即自动跟进；未提交前用仓内副本，功能不受影响） | 任意 |
| 2 | 首次 push：照 `docs/deploy/README.md` 检查单执行（或下轮授权后代跑）；Pages 面板选 GitHub Actions 模式 | T54 完成后 |
| 3 | （可选）配 fine-grained PAT → tuvis 仓 secret，启用 repository_dispatch 实时触发 | 上线后任意 |
| 4 | （可选）提供 OpenCode 桌面界面截图，校准 OpenCodeTui 窗口 | 任意，不阻塞 |
