# Tuvis 官网建站规格（SPEC）

> 版本：v1.5（2026-10-21 用户裁决：正式 tag 冻结 main 发布、关闭普通 main 自动部署、最新 tag 串行恢复，见决策记录 #29）· 状态：部署策略已定，后续按正式 tag 发布
> 本文档是官网建设的单一事实源；品牌侧（命名/吉祥物/域名）见 `brand/BRAND.md`。
> 参考对象：[cc-switch-website](https://github.com/farion1231/cc-switch-website)（线上 [ccswitch.io](https://ccswitch.io)）；文档形态另参考 [ZCode 文档](https://zcode.z.ai/cn/docs/) 与 [Kimi Code 文档](https://www.kimi.com/code/docs/)。

---

## 1. 背景与目标

- **产品**：兔维斯（Tuvis）——你的桌面多 Agent 指挥台。一站式监控、通知、跳转、管理 8 种 AI 编程工具会话（Claude Code / Codex CLI·APP / OpenCode / OpenClaw / Kimi Code / WorkBuddy / ZCode / dsh）的 Tauri 桌面应用（macOS + Windows），GitHub Releases 分发，MIT 开源，local-first 无遥测。
- **现状**：仓库 `jarvislee90s-dot/tuvis` 几乎零曝光（无 topics、无 homepage 字段、下载个位数）；本仓库现有一版零依赖静态单页草稿（`index.html`，深色单语）。
- **官网目标**：
  1. 让访客 30 秒内理解产品是什么、解决什么痛点；
  2. **用高交互 Demo 替代产品截图**传达"操作性极强"的产品气质（本站最大差异化）；
  3. 把下载转化到 GitHub Releases；
  4. 沉淀品牌资产（吉祥物、配色、文案）的官方展示位。

---

## 2. 决策记录（2026-10-10 五轮 grilling 全部裁决）

| # | 决策点 | 裁决 |
|---|---|---|
| 1 | 交付流程 | 先落本文档 → 用户确认 → 动工实现 |
| 2 | 网站规模 | cc-switch 完整度：首页 + /demo + /docs + /changelog 多页站 |
| 3 | 技术栈 | Vite + React + TypeScript + Tailwind CSS（与主项目前端栈一致；动效用 Framer Motion） |
| 4 | 语言 | 中英双语，`/zh/` `/en/` 路径制（ccswitch 同款） |
| 5 | 主题 | 亮暗双主题（跟随系统 + 手动切换） |
| 6 | 截图策略 | **官网不放真实软件截图**；所有软件界面用交互 Demo 表达；桌宠素材由用户单独提供 |
| 7 | Demo 场景 | 4 组：桌面看板（红绿灯）/ 远程操控（手机视角）/ 资源管理 / 桌宠+用量账本（合体展示） |
| 8 | Demo 交互深度 | 引导剧本自动演示 + 用户随时接管自由探索 |
| 9 | Demo 呈现 | 首页 Hero 下内嵌精简看板 + 独立 `/demo` 页承载全场景 |
| 10 | 评价区 | 不放用户评价（零用户不造假）；用「场景故事」三卡替代，明确非证言 |
| 11 | FAQ / 赞助商 | 都不做 |
| 12 | 文档页 | 只要「快速上手」单篇（双语），其余链接回 GitHub README |
| 13 | 更新日志页 | 做；构建时从 CHANGELOG.md 自动切分 |
| 14 | 部署 | GitHub Pages 项目站先行（`jarvislee90s-dot.github.io/tuvis-website`）；tuvis.app 购买后绑自定义域平滑切换 |
| 15 | 访问统计 | 不加（与产品「无遥测」品牌形象一致，官网零追踪器） |
| 16 | Logo / favicon | **上线前硬门槛**：logo-flat-candidate 拍板 → 手写参数化 SVG → 顶栏与 favicon 同步替换 |
| 17 | 吉祥物素材 | **上线前硬门槛**：锁定 candidate-34 底图派生透明底 PNG（亮暗主题共用），替换现白底图 |
| 18 | 首页区块 | 精简 7 区块（无版本公告条、无视频区） |
| 19 | 推广视频 | 首页不放；完成后嵌入 /demo 页对应场景或 /docs |
| 20 | Demo 剧本 | 参考 `E:\LLMproject\Github\VideoMaker\projects\tuvis\scenes.md` 四支视频分镜浓缩为 Web 版 |
| 21 | 文档落点 | `tuvis-website/SPEC.md`（本文件） |
| 22 | 素材-任务强挂钩 | 用户素材设两道素材门：**Gate A**（logo 拍板 + 透明底吉祥物）、**Gate B**（Foxbell 素材）；到点未交付 → 挂钩任务阻塞顺延，不用占位素材硬上（详见 §9/§10） |
| 23 | 风险处置 | §11 风险全部落定为「已裁决」，不留开放项；需要后做的事项一律进二期计划 §12 |
| 24 | 二期边界 | 域名绑定 / CHANGELOG 自动同步 / 视频嵌入 / FAQ / 评价区 / 英文全翻 = 二期（§12） |
| 25 | 视觉依据换代 | `brand/final/`（「少年兔科技管家」角色设定图 + 《Tuvis Mascot & Brand System v1.0》 + 赛博兔侠全身立绘）为**最终视觉唯一依据**（矢量/图标/造型）；candidate-34 全线降级为历史稿归档至 `brand/archive/`（zip + 散件） |
| 26 | Gate A 解除 | final 素材到位，裁切/抠图工作版已产出（`brand/final/extracted/`，清单见其 README）：logo SVG 按设定图手写重建（01/19/20 为基准，不自动描摹）、**Hero 用 21-hero-cutout.png 透明立绘**、favicon/应用图标/托盘三态用 13–17 裁切版；更高清多状态立绘降为可选增强（§12 E8） |
| 27 | 图标定稿路线 | 用户裁决弃手绘 SVG 观感，改走**生图 API**（agnes-image i2i）+ 程序化修正；定稿 = `extracted/13（深）/14（浅）`——无框、整块渐变玻璃目镜（深版蓝渐变三段，浅版白→浅灰）；配色规格单一事实源 = `brand/final/logo/versions/05-aigen/COLOR-SPEC.md`；SVG 母版与全部迭代过程归档于 `brand/final/logo/versions/`（决策 26 的 SVG 路线降为矢量备用） |
| 28 | **文档页升级（2026-10-12 用户裁决，覆写 #12「文档单篇」）** | `/docs` 升级为**完整使用手册**（13 页 5 组，参照 ZCode/Kimi Code 文档形态）：真值 = 兔维斯仓 `docs/user-manual/{zh,en}/\*.md`（GitHub 可读可编辑），本仓 `sync:manual` 脚本复制到 `public/manual/`（生成物不入库、dev/build 自动前置）；`react-markdown + remark-gfm` 渲染 + 侧栏 + 上一页/下一页 pager + 「编辑本页」；目录表 `src/content/manual.ts`；EN 手册骨架先行（正文回落 zh 兜底不白屏）。**同时覆写 #6（官网不放真实截图）**：手册页启用真实软件截图（图文并茂），Demo 交互页保留互补 |
| 29 | **正式发布与部署（2026-10-21 用户裁决）** | 正式网站发布只由稳定 `vMAJOR.MINOR.PATCH` tag 触发；发版命令只允许从干净且与 `origin/main` 同 SHA 的 `main` 创建 tag，且 Tuvis 主仓必须已有同名 tag。普通 `main` push、checkpoint、定时任务和 Tuvis dispatch 不部署。每次正式 tag 的网站源码与内容都按触发 tag 冻结，事件 SHA 必须与 tag 对齐；内容缺失或校验失败时关闭发布。两仓正式 tag 均由服务端 ruleset 禁止更新和删除。相同版本重发只允许最新稳定 tag，通过专用 workflow 创建唯一 marker；marker 与正式 tag 的文件树相同、以正式 tag 为父提交。旧 tag 若没有同树 marker 协议则拒绝恢复。部署事件先在队列外校验，发布 job 使用单 pending 并发锁。迟到的旧事件或构建期间 tag 前进时，不会跨 tag 构建，而是重新排队最新 tag 的同树 marker，确保最终线上是最新版本；过期部署只异步排队后继恢复并退出，不等待恢复 workflow，避免与其编排锁形成等待环。人工恢复 workflow 仍等待它派发的具体部署完成。 |

**连带修正项**：现有草稿 `index.html` 中所有 GitHub 链接指向旧仓 `jarvislee90s/MultiAgents-Manager`，新站统一改指 `https://github.com/jarvislee90s-dot/tuvis`（旧地址虽 301，但直接用新址）。

---

## 3. 信息架构

### 3.1 站点地图

```
jarvislee90s-dot.github.io/tuvis-website/     （后续绑 tuvis.app）
├── /zh/…  /en/…                    语言前缀二选一；根路径按 Accept-Language 重定向
├── /{lang}/            首页：7 区块单页（§4）
├── /{lang}/demo        交互 Demo 全场景页（§5）
├── /{lang}/docs        快速上手单篇（§6.1）
└── /{lang}/changelog   更新日志（§6.2）
```

### 3.2 路由与托管要点

- React Router 路径制路由；i18n 前缀段 `/:lang`（`zh` | `en`）。
- GitHub Pages 项目站是子路径托管（base = `/tuvis-website/`），Vite `base` 与 Router `basename` 相应配置。
- GH Pages 无原生 SPA fallback：采用标准 `404.html` 复制 `index.html` + 会话存储重定向方案。
- 部署：GitHub Pages 使用 GitHub Actions 部署源。正式稳定 tag `vMAJOR.MINOR.PATCH` 才触发 build + deploy；tag 固定当时 `main` 的 commit，且要求 Tuvis 主仓存在同名 tag。普通 `main` push、checkpoint、定时任务和 Tuvis dispatch 不部署。通过 `pnpm release:website <tag>` 从干净且与 `origin/main` 同步的 `main` 创建发布 tag；网站和 Tuvis 两仓均禁止正式 tag 更新、删除。同版本重发只允许恢复最新稳定 tag，并创建与 release tree 相同的唯一 marker。旧 tag 若不含 marker 协议则拒绝恢复。构建内容始终来自触发 tag；迟到的旧触发或构建期间 tag 前进时，通过最新 tag 的同树 marker 重新排队部署，不跨 tag 构建。过期部署的重排只异步派发并退出；人工恢复仍等待其具体 Pages 部署，避免恢复编排锁与部署之间互相等待。 |
- 自定义域切换（后期）：仓库加 `CNAME` 文件 + DNS 配置，文档化两步操作，不动代码。

### 3.3 通用页面元素

- 顶栏：logo（待定稿 SVG）+ 兔维斯 Tuvis 文字标 / 功能 · Demo · 文档 · 更新日志 · GitHub / 语言切换器（中/EN）/ 主下载按钮。移动端折叠菜单。
- Footer：slogan「人离开桌面，Agent 不停工」+ GitHub · MIT License · 免责声明（与 Anthropic/OpenAI/月之暗面等无关联，摘自 README）· 语言切换。
- 全站零追踪脚本（决策 15）。

---

## 4. 首页规格（精简 7 区块）

| # | 区块 | 内容要点 |
|---|---|---|
| ① | **Hero** | 徽章（开源 · 桌面端 · 移动端远程）+ H1「兔维斯 Tuvis」+ 标语「你的桌面多 Agent 指挥台」+ 副文案（一块看板看清并掌控所有 AI Agent，从桌面到手机）+ CTA 双按钮（免费下载 → 平台检测直链；GitHub）+ 右侧吉祥物定稿图（透明底，暗色模式不露白） |
| ② | **交互看板精简版** | 内嵌 Demo 引擎的桌面看板场景（D1 的精简态）：8 工具筛选 chips + 红绿灯会话卡自动流转，可点击拖动；底部入口「在完整 Demo 里亲手玩 →」进 /demo |
| ③ | **状态灯三态** | 吉祥物三态卡（绿·运行 / 黄·等待批准 / 红·中断）+ 一句「它的灯，就是 Agent 的状态」；小屏纵向排列 |
| ④ | **场景故事三卡**（替代评价区） | 明确标注「使用场景，非用户证言」：a) 深夜多 Agent 并跑，红灯亮起托盘+手机同步知道；b) 出门在外手机一键批准计划，Agent 不停工；c) 周末打开用量账本，看清钱花在哪个模型。每卡配 Demo 场景缩略示意（组件复用，非截图） |
| ⑤ | **四大功能组卡** | 与 Demo 四场景一一对应：会话看板（红绿灯）/ 远程操控（发消息·审批·问答）/ Skill·MCP·预设统一管理 / 桌宠 Foxbell + 用量账本。每卡「查看演示 →」链到 /demo 对应场景锚点 |
| ⑥ | **开源理念区** | MIT 开源 · local-first 数据在 `~/.tuvis/` · 无遥测（PRIVACY.md）· 欢迎 Issue/PR；GitHub 按钮直达仓库 |
| ⑦ | **下载 CTA + Footer** | 平台检测按钮（UA 判 macOS → `Tuvis-<ver>-macOS.dmg`，Windows → `Tuvis-<ver>-Windows-x64-setup.exe`，直链 `releases/latest/download/`）+ 备用「前往 Releases 页」；支持系统标注 macOS 14+ / Windows 10+；Footer 见 §3.3 |

> 排除项（已裁决）：版本公告条、视频区、FAQ、用户评价跑马灯、赞助商、真实截图。

---

## 5. 交互 Demo 规格（全站核心）

### 5.1 目标与原则

- 用户要求：**做成"可展示的 demo"程度，交互性显著超过 cc-switch 的模拟面板**。
- 三原则：① 状态真实感（红绿灯流转、双端同框联动与真品逻辑一致）；② 可玩（所有可见控件可点，操作有真实反馈）；③ 可懂（剧本字幕逐步解说，访客不看文档也能懂）。
- Demo 内的"跳转终端 / APP 深链 / 通知"一律以动效模拟（如弹出模拟通知卡、终端窗口示意动画），**不真实拉起外部应用**。
- 数据为前端 mock 种子（参考主仓 tauri-mock fixtures 口径），密码等敏感值按分镜口径打码（演示值 `1234`）。

### 5.2 引擎架构

```
src/components/demo/
├── engine/
│   ├── store.ts        # zustand：sessions[]、resources、usage、pet 状态、事件队列
│   ├── player.ts       # 剧本引擎：steps[]（动作/高亮/字幕/时长），自动播放、暂停、
│   │                   # 用户接管检测（任何真实点击 → 暂停剧本进入自由模式，可重播）
│   └── mock-seed.ts    # 种子数据（8 工具会话、技能/预设、用量记录）
├── scenes/
│   ├── BoardScene.tsx        # D1 桌面看板
│   ├── RemoteScene.tsx       # D2 远程操控（桌面 + 手机框双端同框）
│   ├── ResourcesScene.tsx    # D3 资源管理
│   └── PetUsageScene.tsx     # D4 桌宠 + 用量账本（合体）
├── Chrome.tsx          # 桌面窗框 / 手机框（420×900 比例）外壳
└── Caption.tsx         # 剧本字幕条（i18n）
```

### 5.3 四场景剧本（自 scenes.md 四支分镜浓缩）

**D1 桌面看板**（源：S2 消息提醒篇）
- 剧本：看板全景（5 卡，4 绿 1 黄）→ Claude Code 黄转红 + 模拟桌面通知浮窗 + 提示音 → 点浮窗「查看会话」→ 终端跳转模拟动画 → Codex APP 卡深链跳转模拟。
- 自由探索：卡片 hover 预览最新消息、工具筛选 chips 点选、卡片点击展开详情抽屉。
- 验证点：通知浮窗与卡片状态联动；筛选 chips 与卡片过滤实时一致。

**D2 远程操控**（源：S1 远程连接篇，全片情绪点）
- 剧本：桌面看板 Claude 红 → 右侧手机框「扫码绑定」（简化为按钮，密码已含链接口径）→ 手机看板出现同款红卡 → 手机横幅 + 振动感动画 → 点横幅进会话详情展开 markdown 计划 → 点「允许」绿钮（涟漪）→ **桌面端红转绿，双端同框闭环**。
- 自由探索：手机端发消息输入框（入队列显示"已排队"）、问答多选题、权限模式切换；子 Agent chips、文件面板预览着色（已改写/只读）。
- 验证点：手机批准后 3 秒内桌面卡变绿；双端状态始终一致。

**D3 资源管理**（源：S3 技能管理篇）
- 剧本：痛点对比条（散落目录/版本不一/手写混杂，快切三标签）→「重新扫描」数量徽标上涨 → 勾选矩阵开关某技能×某工具（tooltip：不勾=不加载=干净上下文，技能仍留主仓库）→ 展开「Full Stack Dev」预设组 → 一键切到「Code Review」批量启用变化 → 托盘切换示意 → 一致性体检卡变绿。
- 自由探索：任意技能勾选组合、预设组详情滚动、新增/移除映射。
- 验证点：取消勾选后对应工具启用标记即时消失；预设切换批量变化可见。

**D4 桌宠 + 用量账本（合体）**（源：S4，出圈向）
- 剧本：看板点 🦊 唤出 Foxbell（用户素材）落右下角 → 拖拽抛掷落地压扁回弹（简单刚体感）→ Claude 转红头顶状态卡同步变红 →（可选开声）待审批真实语音（主仓 `public/pet/voice` m4a，默认静音按钮开启）→ hover 狐狸出 token 迷你浮窗（五行：请求/命中率/缓存/分工具/详情）→ 点「详情」进用量大看板（hero 大数字 + SVG 趋势线）→ 切供应商/模型归因维度 → 导出分享图动效（自定义评语 + 撒花）。
- 自由探索：反复拖拽宠物、悬浮浮窗、维度切换、分享图评语输入。
- 验证点：宠物状态与看板联动；维度切换出非空分组；浏览器自动播放策略不翻车（语音默认静音、用户手势后才出声）。

### 5.4 素材来源

| 素材 | 来源 | 处理 |
|---|---|---|
| **吉祥物 / Logo / 应用图标 / 托盘图标** | 本仓库 `brand/final/`（设定图 + 品牌系统 v1.0 文档 + 赛博兔侠立绘）；工作素材在 `final/extracted/` | 唯一造型依据；SVG 一律手写重建（不自动描摹 3D 渲染） |
| 8 工具品牌图标 | 主仓 `src/components/icons/BrandIcons.tsx`（内联 SVG path，currentColor） | 拷贝复用 |
| 工具识别色 | 主仓 `docs/design/tool-color-ledger.md`（唯一权威表，见 §7.3） | 直引 |
| Foxbell 精灵图/语音 | 主仓 `public/pet/spritesheet.webp` + `voice/`（用户已确认由其提供） | 拷入 `public/pet/`；精灵图帧参数照 `manifest.json` |
| 手机 UI 形态参考 | 主仓 `docs/design/remote-ui/*.html` 三份定稿原型 | 视觉还原基准 |
| 剧本/字幕文案 | `VideoMaker/projects/tuvis/scenes.md` + `narration.md` | 浓缩改写为 Web 字幕（中英） |

---

## 6. 其余页面

### 6.1 /docs 快速上手（单篇）

- 内容：环境要求 → 下载安装（按平台）→ 首次启动（信任门提示）→ 把工具接入看板 → 下一步（链接 /demo 与 GitHub README）。
- 素材：主仓 `docs/guides/{zh,en}/getting-started.md` 精编；页面右侧锚点目录。
- 明确写：更详细文档见 GitHub README（中/英链接）。

### 6.2 /changelog 更新日志

- 实现：`scripts/split-changelog.mjs` 构建时**按中英双文件**解析主仓 `CHANGELOG.md`（→ `src/content/changelog.json`，条目键 `zh`）与 `CHANGELOG.en.md`（→ `src/content/changelog.en.json`，条目键 `en`），产物入 git 作离线兜底；页面按 URL 语言各读各的产物（版本锚点、分区渲染），无跨语言回落。
- 同步方式：构建时经 `api.github.com` contents 通道拉取（`pnpm sync:changelog`），另有 `--in` / `--in-en` 本地回退与 `--offline` 全离线；失败语义 = 警告 + 保留上次产物 + 退出 0。英文产物另设语言纯度闸门（出现 Han / 中文排版字符即拒绝落盘，页面宁可旧也不冒充英文）。
- 语言（2026-10-17 用户裁决，主仓据此拆分双文件）：/zh/changelog 只显示中文、/en/changelog 只显示英文——英文页仅列已完成翻译的版本，未译版本不出现也不留占位，页首说明给出中文版入口（说明里的「vX.Y.Z 起」锚点随数据自动跟随，不写死）。

---

## 7. 设计系统

### 7.1 主题令牌（亮暗双套，CSS variables + Tailwind）

| 令牌 | 亮色（对齐产品 UI，tool-color-ledger） | 暗色（现有草稿底子） |
|---|---|---|
| 页面底 | `#F7F6F4` | `#0b1220` |
| 卡片底 / 边 | `#FFFFFF` / `#ECEAE4` | `#131e30` / `#22304a` |
| 主文字 / 次 | `#1A1915` / 灰阶 | `#e7eef7` / `#94a6bd` |
| 状态·绿 | 底 `#E3F2E7` 字 `#1E7B34` | `#34d399` |
| 状态·黄 | 底 `#FBF3D9` 字 `#8A6D00` | `#fbbf24` |
| 状态·红 | 底 `#FEE9E5` 字 `#B3261E` | `#f87171` |
| 品牌点缀·青蓝（HUD 同源） | `#1787A8`（亮底可读加深） | `#72D8EF` |

- 主 CTA 用状态绿（呼应红绿灯核心概念）：品牌冻结色 `#36BB7B`，亮底配深字 `#1E7B34`。
- **暖铜退役**（品牌系统 v1.0 明确不再作装饰色）：旧草稿的 `--copper` 不带入新站。
- 品牌物料（吉祥物/徽章/三态展示）状态色用冻结品牌色：绿 `#36BB7B` / 黄 `#EAB53D` / 红 `#DE5656`；Demo 内产品卡面沿用主仓 tool-color-ledger 软色（§7.3 之外的产品语义，见 `docs/design/tool-color-ledger.md`）。
- 字体：正文 Inter + PingFang SC/微软雅黑栈；代码 Fira Code。数字（账本 hero）用 tabular-nums。

### 7.2 动效

- Framer Motion：区块入场淡入上移、Demo 卡片状态过渡、批准涟漪、撒花；尊重 `prefers-reduced-motion`。

### 7.3 工具识别色（官网/ Demo 通用，出自主仓台账）

Claude `#D97757` · Codex `#10A37F` · ZCode `#141413` · Kimi `#0B0E1A` · OpenCode `#6B6B6B` · OpenClaw `#D2453C` · WorkBuddy `#4AD06A` · dsh/DeepSeek `#4D6BFE`。
注意：`#141413`/`#0B0E1A` 近黑，暗色模式下加浅描边或提亮变体保证可辨识。

---

## 8. 技术方案

- **栈**：Vite + React 19 + TypeScript + Tailwind CSS v4 + Framer Motion + Zustand + react-router + i18next。不引入 UI 组件库（页面简单，手写组件 + 少量 Radix 原语按需）。
- **目录**：

```
tuvis-website/
├── SPEC.md  README.md
├── brand/
│   ├── BRAND.md               # 品牌决策记录（§3 candidate-34 章节为历史稿）
│   ├── final/                 # ★ 最终视觉唯一依据（决策 25）
│   │   ├── Tuvis Mascot & Brand System v1.0.txt
│   │   ├── Tuvis 科技兔角色设定图.png     # 含应用图标/托盘三态/三视图/表情
│   │   ├── 赛博兔侠：蓝光护盾与能量核心.png  # Hero 立绘源图
│   │   └── extracted/         # 裁切与抠图工作素材（21 号为 Hero 透明立绘）
│   └── archive/               # 旧方案归档（mascot-gen 全量、旧 logo/线稿、提示词录 + zip）
├── assets/                    # 旧草稿图片（candidate-34 遗留，P1 换 final 素材后归档）
├── legacy/index.html          # 现草稿归档（不删除，留参照）
├── index.html  package.json  vite.config.ts  tsconfig.json
├── scripts/split-changelog.mjs
├── public/
│   ├── mascot/                # 来自 brand/final/extracted（透明底立绘、托盘、图标）
│   ├── pet/                   # Foxbell 精灵图 + 语音（Gate B 后拷入）
│   ├── favicon.svg  og.png    # og 1200×630（hero-cutout 制作）
│   └── llms.txt               # 可选，低成本（cc-switch 有）
└── src/
    ├── main.tsx  App.tsx
    ├── pages/   (Home / Demo / Docs / Changelog)
    ├── components/ (demo/§5.2 · layout/ · home/)
    ├── i18n/    (zh.json / en.json)
    └── styles/
```

- **SEO**：每页 title/description 双语、hreflang alternate、og/twitter card、sitemap.xml、`llms.txt`（可选）。SPA 对 SEO 的弱势用准确的 meta + 语义化 HTML 缓解；不做 SSG/预渲染（早期流量下不值）。
- **质量门槛**：桌面/移动响应式；亮暗切换即时生效；中英切换全覆盖（含 Demo 字幕）；`pnpm build` 零 TS 错误；Lighthouse Performance ≥ 90 / a11y ≥ 95（本地跑分验证）。

---

## 9. 素材依赖与交付计划（素材与任务强挂钩）

> 规则：下表「必须到位时点」即素材门（Gate）。**到点未交付，挂钩任务不得开工、计划顺延**，不用占位素材硬上（实现方自产的 I 系素材除外）。素材门验收 = 实现方检查格式/尺寸可用后在本表打勾。
> **✅ Gate A 已于 2026-10-10 解除**（决策 25/26）：`brand/final/` 素材到位，裁切/抠图工作版已产出并目检通过（`final/extracted/`，清单见其 README）。仅剩 U3/U4 两项用户交付。

### 9.1 用户交付清单（需要你给的，单独列出）

| # | 素材 | 必须到位时点 | 挂钩任务（缺失即阻塞） | 说明 |
|---|---|---|---|---|
| U1 | ~~logo 拍板~~ ✅ **已解决**（2026-10-10） | ~~Gate A~~ 已过 | — | 终版依据 = `brand/final/` 设定图兔头标志；实现方按 `extracted/01-logo-lockup` + `19-mono-rabbit` 手写参数化 SVG（I1），不自动描摹 |
| U2 | ~~吉祥物透明底 PNG~~ ✅ **主体已解决**（2026-10-10） | ~~Gate A~~ 已过 | — | Hero 用 `extracted/21-hero-cutout.png`（赛博兔侠抠图透明版，亮暗通用）；三态卡用 `10–12` 裁切版；favicon/应用图标用 `13–14`；托盘用 `15–17`；更高清/黄红全身态 → 二期 E8 可选 |
| U3 | ~~Foxbell 素材打包~~ ✅ **已核实全部齐备**（2026-10-10） | ~~Gate B~~ 仅剩两项一句话确认 | P4 的 D4 桌宠+账本场景 | 素材全在主仓：`public/pet/`（spritesheet.webp 8×11 帧 192×208、manifest.json 31 条语音、voice/ 四组 m4a）+ 帧表 `src/components/pet/petAnimations.ts`，实现期直接拷贝移植。**待确认**：① 形象+语音可用于公开官网的授权；② 演示选句（默认按分镜 S4：approval「审批通过就允许你请贝贝吃鸡腿~」+ done「成功啦！贝贝是不是超厉害~」） |
| U4 | Petdex 第二只宠物（**可选**彩蛋） | Gate B（可选） | D4 的「在线仓库换宠」彩蛋镜头 | 不给则 D4 砍彩蛋段，主流程不受影响 |

### 9.2 实现方自产素材（不阻塞计划，但有时点）

| # | 素材 | 产出时点 | 依赖 |
|---|---|---|---|
| I1 | favicon.svg + 各尺寸图标（从定稿深色图标 13 裁切/重构；手写 SVG 母版已归档备用，见决策 27） | P1 期间 | `extracted/13-appicon-dark.png`（生图路线定稿） |
| I2 | og.png 主视觉 1200×630 | P5 | `extracted/13-appicon-dark.png` + `21-hero-cutout.png` |
| I3 | llms.txt / sitemap.xml / hreflang 标签 | P5 | 无 |

---

## 10. 实施计划（一期，分期方案用户已确认）

> 执行顺序已按素材门调整：**P0 期间用户并行备料 → Gate A 验料 → 首页用真素材 → Demo 按素材依赖排序（D3 无素材依赖，可提前）→ Gate B 验料 → D4**。

| 阶段 | 内容 | 素材门 / 验收 | 估时* |
|---|---|---|---|
| P0 | 脚手架 + 设计令牌（亮暗）+ i18n 框架 + 路由（/zh /en + 404 fallback）；**开工同时给用户发 U3/U4 备料单**（U1/U2 已解决） | 双语双主题骨架可切换 | 0.5d |
| — | ~~🔴 Gate A~~ ✅ **已解除**（2026-10-10，`brand/final/` 到位，决策 25/26） | P1 直接按 `final/extracted/` 工作版开工 | — |
| P1 | 首页 7 区块（Hero 用 21-hero-cutout，logo 手写 SVG）+ favicon（I1）+ 下载平台检测 | 桌面/移动两端还原设计；用户抽查英文版（R5） | 1.5d |
| P2 | Demo 引擎（剧本/接管/mock 种子）+ D1 看板场景（首页内嵌 + /demo 壳） | 剧本自动播 + 接管自由点 | 2d |
| P3 | D2 远程操控场景（双端同框联动） | 手机批准 3s 内桌面变绿 | 1.5d |
| P4 | **D3 资源管理 → D4 桌宠+账本**。D3 无素材依赖：**若 Gate B 未到，D3 提前与 P3 对调先做** | **🔴 Gate B：验收 U3 后 D4 才开工**；D3/D4 各自验证点通过 | 2.5d |
| P5 | /changelog（切分脚本）+ /docs 快速上手 + SEO/og/llms.txt（I2/I3） | 构建零错误、meta 全 | 1d |
| P6 | 全路由冒烟（含 404 fallback，R6 清单）+ Lighthouse 评分 + 上线检查单（含「CHANGELOG 已同步」，R4）+ GH Pages 部署 | 线上可访问、Perf≥90 / a11y≥95 | 0.5d |

\* 主观估计供排期参考，非承诺。
\*\* R1 超期预案：D1+D2 完成即构成「可上线最小站」，若整体超期则 P5/P6 提前带 D1/D2 上线，D3/D4 转二期回补（§12 E7）。

---

## 11. 风险登记（处置已裁决，不留开放项）

| # | 风险 | 影响 | 处置（已定，不再开放） |
|---|---|---|---|
| R1 | Demo 是全站工作量大头（约 6/9.5d），可能超期 | 上线推迟 | 顺序铁律 D1→D2→D3→D4；**D1+D2 完成即可按 §10\*\* 预案先上线最小站**，D3/D4 转二期 E7 回补 |
| R2 | 浏览器语音自动播放限制 | D4 语音不出声 | 全站音频仅存在于 D4 场景；默认静音，用户点开声按钮（手势解锁）后才播放，字幕始终显示台词原文 |
| R3 | 吉祥物派生走样（AI 图生图漂移） | 品牌形象不一致 | 以 `brand/final/` + 品牌系统 v1.0 冻结规范为唯一依据：立绘只做技术性处理（抠图/缩放/裁切），状态变体只允许胡萝卜主体换色且沿用绿母版构图，SVG 手写重建不自动描摹；**禁止重新图生图重塑角色** |
| R4 | CHANGELOG 手动同步可能忘记 | 日志页内容过期 | v1 用 `sync:changelog` 脚本 + P6 上线检查单固定项；二期 E2 换 GitHub Action 自动拉取 |
| R5 | 英文文案需新写（Demo 字幕、场景故事） | 国际观感 | i18n 文件头部维护术语表（产品词/工具名固定译法）；P1/P2 验收时用户抽查英文版 |
| R6 | GH Pages 子路径 + SPA fallback（404.html）失效 | 深链接 404 | 采用标准 404.html 重定向方案；P6 验收含全路由冒烟清单（zh/en × 首页/demo/docs/changelog） |
| R7 | 与 cc-switch 视觉趋同 | 差异化不足 | 差异化武器就是「可玩的交互 Demo + 吉祥物品牌线」；配色走本站自有设计令牌（§7），不搬 cc-switch |

---

## 12. 二期计划（v1 上线后 backlog，按优先级）

| # | 项 | 触发条件 | 说明 |
|---|---|---|---|
| E1 | tuvis.app 购买 + 绑定自定义域 | 用户拍板购买 | BRAND.md §4 推荐组合（tuvis.app + tuvisai.cn）；绑定两步操作见 §3.2 |
| E2 | CHANGELOG 自动同步 GitHub Action | 二期启动 | 替代 v1 手动脚本（R4 的根治方案） |
| E3 | 四支推广视频嵌入 | VideoMaker 出片 | 按决策 19：嵌 /demo 对应场景与 /docs，首页不放 |
| E4 | FAQ 区 | Issues/Discussions 问题积累后 | 决策 11 的回补通道 |
| E5 | 用户评价区 | 真实用户反馈出现（经授权） | 决策 10 的回补通道 |
| E6 | ~~英文 changelog 全文翻译~~ ✅ **已落地**（2026-10-17：主仓拆分出纯英文 `CHANGELOG.en.md`，网站 /en 只读英文版、未译版本不出现） | — | 替代 v1「中文原文 + 每版英文摘要」方案：中英两版彻底分家，不回落中文（契约见 §6.2） |
| E7 | D3/D4 回补（仅当 R1 触发过压缩） | 一期超期走了最小站上线 | 补全 Demo 四场景 |
| E8 | 高清多状态吉祥物立绘（黄/红全身透明版、≥2x 分辨率） | 需要更大展示位/印刷物料，或对裁切版观感不满意时 | 依据品牌系统 v1.0 冻结规范生成；当前网页展示尺寸下 `extracted/` 裁切版已够用 |
