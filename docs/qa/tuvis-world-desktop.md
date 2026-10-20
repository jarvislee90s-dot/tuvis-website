# 兔维斯世界 · 桌面验收记录（2026-10-19）

对照需求说明书 9.1–9.3 与实施计划 Task 1–9。以下“通过”仅指本文列出的命令、自动化测试与本机浏览器结果；未实测项逐条列出，不按通过计。

## 融合基线

融合分支 `feat/tuvis-world` 在 `3ba6e65`（父 `a9eeea6`）上的基线复测（2026-10-19）：

| 项 | 实际值 |
|---|---|
| 执行环境 | macOS 27.0.1 (26A434)，arm64 |
| Node / pnpm | v22.23.2 / 10.20.0（`npx pnpm@10.20.0`） |
| 安装 | `pnpm install --frozen-lockfile` exit 0 |
| 测试 | `pnpm test`：15 个测试文件、129 条测试全部通过 |
| 类型检查 | `pnpm exec tsc --noEmit` 无输出，exit 0 |
| 构建 | `pnpm build` exit 0，生成 `dist/`（含 `dist/404.html`）；构建中的同步脚本改写 `src/content/capabilities.json`、`src/content/changelog.json`，已用 `git checkout` 复位，未进入提交 |
| 资源校验 | `verify-pack.mjs` PASS：17 images, 15 frames, 12 hotspots, 18 connected nodes, 47 checked files |
| 交接审计 | `audit-handoff.mjs` PASS：17/17 mappings; 9 root-relative task file lists; 链接与路径检查通过 |

## 1. 验收环境与复验方式

| 项 | 实际值 |
|---|---|
| 分支 / HEAD | `feat/tuvis-world`；C0–C4 提交为 `4d3affd`、`04c8159`、`c9cf605`、`418c8f2`、`c6a6a4d`、`563a0aa`；C5 收口为 `a834812`；英文界面收口为 `0a23b8c`；终审为 `fix(world): localize remaining english chrome strings`；工作台任务文案收口为 `fix(world): localize workbench task copy` |
| 浏览器 | Google Chrome `155.0.8059.80`，`--headless=new`，CDP `127.0.0.1:9222`，独立 profile `/tmp/tuvis-qa-profile` |
| 预览服务 | `pnpm preview --host 127.0.0.1 --port 4173`，构建产物 `dist/`，子路径 `/tuvis-website/` |
| 视口 / DPR | 1280×800、1600×900，DPR 1（无真实系统缩放） |
| 自动化脚本 | `scripts/qa-cdp.mjs`（只读四路由探针）、`scripts/qa-world-interactions.mjs`（真实鼠标交互） |
| 截图 | `docs/qa/screenshots/`（`Page.captureScreenshot`） |
| 背景音乐 | Sappheiros – Universe（CC BY 3.0，经 BreakingCopyright）；工坊右上角「音乐：开/关」，默认开启、循环播放；来源与署名见 `public/world/audio/README.md` |

复验命令：

```bash
cd /Users/jarvis/Documents/tuvis-website
export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; nvm use 22.23.2
export npm_config_manage_package_manager_versions=false CI=true
npx --yes pnpm@10.20.0 install --frozen-lockfile
npx --yes pnpm@10.20.0 test
npx --yes pnpm@10.20.0 exec tsc --noEmit
npx --yes pnpm@10.20.0 build
npx --yes pnpm@10.20.0 preview --host 127.0.0.1 --port 4173

# 另一个终端：启动带调试端口的 Chrome
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless=new --remote-debugging-port=9222 \
  --user-data-dir=/tmp/tuvis-qa-profile --no-first-run \
  --no-default-browser-check about:blank

node scripts/qa-cdp.mjs
node scripts/qa-world-interactions.mjs
```

## 2. 自动化结果汇总

| 检查 | 结果 |
|---|---|
| 单元 / 集成测试 | 15 个测试文件、136 条测试全部通过（42 条基线和 94 条世界新增） |
| 类型检查 | `pnpm exec tsc --noEmit` 无输出，exit 0 |
| 构建 | `pnpm build` exit 0，生成 `dist/` 与 `dist/404.html` |
| 资源包校验 | `verify-pack.mjs` PASS；`audit-handoff.mjs` PASS |
| 只读四路由探针 | 56/56 检查通过；失败请求 0、console error 0、外部请求 0 |
| 真实交互驱动 | 54/54 probe 通过（主链路、取消、双输入、缩放、四条深链接） |

六个基线测试文件与 `a9eeea6` 对比无改动：

```text
$ git diff --stat a9eeea6..HEAD -- \
    scripts/split-changelog.test.mjs src/demo/ledgerData.test.ts \
    src/demo/player.test.ts src/i18n/parity.test.ts \
    src/tokens.test.ts src/utils/download.test.ts
（空输出）
```

## 3. 专题首页（9.1）

| 验收项 | 结果 | 证据 |
|---|---|---|
| 导航可进入“兔维斯世界” | PASS | `nav.world`；`/zh/world`、`/en/world` HTTP 200，`qa-cdp.mjs` 导航成功 |
| 独立标题、主视觉、内容层级 | PASS | `landing-zh-1280.png`；`WorldLanding.test.tsx` 的 W-01–W-06 用例 |
| W-01–W-06 六模块真实图文 | PASS | `qa-cdp.mjs` 检查 `sections=6`、四装备卡、三故事卡、双工坊链接；六段图片均 `naturalWidth > 0` |
| 四装备图鉴（`sourceRect` 裁切、身份色） | PASS | `WorldLanding.test.tsx`；`CropImage` 按 `sourceRect` 裁切，不使用等分替代 |
| 三张故事卡与简介展开 | PASS | 对话框展示 `summary`；Esc/关闭后焦点回到触发按钮（`WorldLanding.test.tsx`） |
| 两个工坊入口指向同一路径 | PASS | 两处链接均为 `/{lang}/world/workshop`（`qa-cdp.mjs` 与单测） |
| `/zh/world`、`/en/world` 可访问 | PASS | 四路由探针；深链接直接打开与刷新均无失败请求/console error |
| 英文界面 + 世界正文中文 + 语言说明 | PASS | `qa-cdp.mjs` 的 `en` 探针断言：角标 `W-02 · Meet Tuvis` … `W-06 · Workshop Experience`；H2 `Tuvis` / `Tuvis's Four Tools` / `Circuitown and the Invention Workshop` / `Stories from the Workshop`；两处 CTA `Enter Tuvis Workshop`；hero tag `Circuitown · Invention Workshop`；工坊返回链接 `Back to Tuvis World`、`Help`、`Quest progress`、`Replay story`、`Got it`；并显示 `World content is currently provided in Chinese.` |
| 首屏与 W-06 进入同一 `/zh/world/workshop` | PASS | 两处 `href` 相同，单测逐项断言 |

说明：英文页的章节正文、装备名、故事名与工坊任务文本来自中文内容包，按“世界正文中文 + 内容语言说明”交付；界面标签（章节标题与角标、CTA、按钮、状态、帮助）走 i18n。

## 4. 工坊（9.2）

| 验收项 | 结果 | 证据 |
|---|---|---|
| 固定斜俯视；房间与庭院/住宅外围连续；两处门/门洞 | 实现可见，人工走查 | `workshop-zh-1280.png`；场景含 `door-hall`、`door-side` 两个热点；连续性见人工验收清单 |
| 点击地面移动 | PASS | `qa-world-interactions.mjs` 在两个视口点击场景点 `[650,720]`，角色到达 `[649.22,718.56]` / `[648.53,719.63]` |
| 点击物件先走到 approach 再互动 | PASS | 两轮完整流程分别点击工具箱/海报/窗/工作台/装备架，均在到达后打开对应内容或完成事件 |
| 新目标取消旧到达事件 | PASS | `motion.test.tsx` 断言旧 token 到达被忽略；`WorkshopFlow.test.tsx` 新增 blur 取消后旧 token 不触达 |
| 12 个热点全部可达 | PASS | `navigation.test.ts` 的 `reaches every hotspot approach point from spawn`；`qa-cdp.mjs` 读到 12 个 `data-hotspot` |
| 整条路径与每段移动不穿墙/家具 | PASS（单测） | `findPath` 逐段 `isSegmentClear`；绕行休息椅用例；`advanceMotion` 5000ms 帧间隔被钳制为 100ms/19px |
| 角色不越界 | PASS（单测） | `isWalkable` 拒绝庭院/障碍点；不可达点击保留位置并提示 |
| 脚底锚点深度排序、前后遮挡、投影 | 实现 + 人工验收 | 角色 `zIndex = position[1]`，家具 `zIndex = depth`；角色下方有独立 `.world-actor-shadow`；判据见人工清单 |
| 面板打开暂停移动 | PASS | `runtimeStore.setOverlay` 清空 target；`WorkshopFlow.test.tsx` 断言 `.world-actor.is-moving` 消失 |
| 关闭面板回到原状态 | PASS | 面板关闭只清 `overlay`，不重置位置/任务；焦点回到触发热点（C4 新增用例） |
| 窗口失焦停止 | PASS | `useSceneLoop` 监听 `blur`/`visibilitychange`；`qa-world-interactions.mjs` 在工具箱移动途中触发 blur，断言无对话框、任务不变、角色停止 |
| 缩放后点击换算正确 | PASS | 1280 视口舞台 750px、1600 视口舞台 900px；同一场景点在两视口落点差 `dx=0.68`、`dy=1.07` 场景像素（<2） |
| 日常姿态（坐/持杯/展示） | PASS（单测） | `motion.test.tsx` 断言 sit/coffee/display 帧与高度；可见反馈列入人工清单 |
| 切换新目标结束日常姿态 | PASS | `motion.test.tsx` 的 unreachable 用例同时断言 pose 回到朝向 |
| Bug Buster 三模块任意顺序 | PASS | 单测覆盖全部 6 种顺序；浏览器两轮分别用 `sight→cell→emitter` 与 `cell→emitter→sight` |
| 维修能源匣 | PASS | 浏览器点击“松动接口”→“执行检查”→“进入组装”；单测覆盖未领取不可维修 |
| 拖拽与点击两种组装 | PASS | 第一轮点击三件，第二轮拖拽三件，均完成并陈列 |
| 点击命中不被零件遮挡（P0） | PASS | 每件安装前 `elementFromPoint(socket 中心)` 均返回 `BUTTON.world-assembly-socket`；C1 单测守护 `has-selection` 类 |
| 错误插槽不消耗 | PASS（单测） | `AssemblyPanel.test.tsx` 断言错误插槽不触发 `INSTALL`、零件回到托盘 |
| 装备架陈列 | PASS | 浏览器到达装备架后 `.world-rack-display` 出现、任务栏显示“主线完成 · Bug Buster 已陈列”、pose=`display`；`rack-complete.png` 在关闭组装面板并到达装备架后捕获 |
| 刷新恢复 | PASS（单测） | `WorkshopFlow.test.tsx` 卸载重挂载后 `displayedOnRack=true`；本轮浏览器未复测刷新恢复，列入人工清单 |
| 重玩清主线 | PASS（单测） | 完整流程测试确认后回到 `INITIAL_QUEST` 且只清本功能存档键 |
| 损坏/不可用存储安全 | PASS（单测） | 损坏 JSON、schema 2、不可能组合安全重置；`getItem`/`setItem` 抛错仍可完成 |
| 加载失败可重试 | PASS（单测） | 工坊 preload 失败显示错误并重试成功；组装素材失败重试保留任务 |
| 核心图未就绪不可玩 | PASS（单测） | preload 完成前不挂载可玩场景，完成后出现“工坊场景” |

真实浏览器主链路输出（节选）：

```text
PASS assembly click sight: elementFromPoint hits socket — {"hitSocket":true,"tag":"BUTTON","className":"world-assembly-socket","aria":"插槽：瞄准模块"}
PASS assembly click cell: elementFromPoint hits socket — {"hitSocket":true,"tag":"BUTTON","className":"world-assembly-socket","aria":"插槽：能源匣"}
PASS assembly click emitter: elementFromPoint hits socket — {"hitSocket":true,"tag":"BUTTON","className":"world-assembly-socket","aria":"插槽：脉冲发射头"}
PASS assembly: all three installed — ["sight","cell","emitter"]
PASS rack: quest completes — "… 主线完成 · Bug Buster 已陈列"
PASS rack: persisted completion — {"schemaVersion":1,"quest":{"collected":["sight","cell","emitter"],"cellRepaired":true,"installed":["sight","cell","emitter"],"displayedOnRack":true,"helpSeen":true}}
PASS cancel: no dialog after blur — 0
PASS cancel: quest unchanged — {"schemaVersion":1,"quest":{"collected":[],"cellRepaired":false,"installed":[],"displayedOnRack":false,"helpSeen":true}}
PASS zoom: same scene point maps identically — {"dx":0.6835,"dy":1.066,"at1280":[649.2165,718.5603],"at1600":[648.533,719.6262]}
PASS deep link zh/world: direct load + reload — {"failures":[],"errors":[]}
PASS deep link zh/world/workshop: direct load + reload — {"failures":[],"errors":[]}
PASS deep link en/world: direct load + reload — {"failures":[],"errors":[]}
PASS deep link en/world/workshop: direct load + reload — {"failures":[],"errors":[]}
```

第二轮拖拽流程：

```text
PASS collect cell / emitter / sight: stored — ["cell","emitter","sight"]
PASS assembly drag cell / sight / emitter: installed count — 1 / 2 / 3
PASS rack: quest completes — "… 主线完成 · Bug Buster 已陈列"
PASS rack: display pose — "display"
```

## 5. 工程与发布（9.3）

- **基线 42 测试零改动**：见第 2 节空 diff。
- **全量测试 / tsc / build**：15 文件 136 测试通过；tsc exit 0；build exit 0。
- **`/tuvis-website/` 子路径与四条深链接刷新可开**：`qa-cdp.mjs` 直接导航四条路由；`qa-world-interactions.mjs` 对每条路由再执行 `Page.reload`，均无失败请求、无 console error、无外部请求。
- **所有图片来自包内**：`verify-pack.mjs` PASS；`src/world/` 与 `public/world/v1/` 未发现 `http(s)://` 资源引用；浏览器四条路由外部请求为 0。
- **运行时不依赖生图/模型 API/新服务**：同上；世界素材由 `scripts/import-world-pack.mjs` 校验 SHA-256 后复制到 `public/world/v1/`。
- **验收记录**：本文档记录 HEAD、真实浏览器/视口、命令、未实测项与偏差。

## 6. 未实测项（不得计为通过）

| 项 | 状态 / 原因 |
|---|---|
| Windows Chrome / Edge 实机 | 未实测；本次为 macOS 上的 headless Chrome。 |
| macOS Chrome 有头模式 / Safari 实机 | 未实测；仅 headless Chrome 155。 |
| Windows 125%/150% 系统显示缩放、Mac Retina 实机 | 未实测；仅 DPR 1 的两个视口，无真实系统缩放。 |
| 真实 OS 失焦（切换应用/最小化） | 未实测；自动化用页面内 `window.dispatchEvent(new Event("blur"))` 触发同一处理路径。 |
| 真实断网/慢网 | 未实测；加载失败与重试通过注入失败的 loader 单测覆盖。 |
| 触屏 / 移动端 | 需求面向电脑浏览器，未做触屏手势验收。 |
| 纯键盘完整通关 | 面板 Esc、热点与焦点恢复有测试；未做纯键盘从进入到完成的贯通验收。 |
| 长时运行性能 / 内存 | 未压测。 |
| 刷新恢复、重玩清主线、日常姿态的浏览器复测 | 本轮以单测覆盖；列入人工验收清单。 |
| 遮挡前后对照、庭院连续性、两扇门走查 | 本轮无自动化判据；列入人工验收清单，参照 blueprint QA 图。 |

## 7. 人工验收清单

在 `http://127.0.0.1:4173/tuvis-website/zh/world` 与 `/zh/world/workshop`（以及 `/en` 对应路径）执行：

1. **专题首页**：六段顺序与层级；四装备卡切换详情；三张故事卡“查看简介”打开/关闭后焦点回到按钮；首屏与 W-06 两个入口都进入同一工坊。
2. **英文界面**：`/en/world` 的章节角标、`Read summary`、语言说明；`/en/world/workshop` 的 `Help`、`Quest progress`、`Got it`、维修/组装按钮为英文；世界正文保持中文。
3. **移动与热点**：点击地面；依次点击 12 个热点，确认先走近再互动；途中点击新目标，旧目标不触发。
4. **遮挡与锚点**：把角色走到休息椅/休息桌/装备架前后，对照
   `tuvis-world/05_handoff/v1/qa/workshop-occlusion-behind.jpg` 与
   `workshop-occlusion-front.jpg` 检查前后遮挡、脚底与投影；对照
   `tuvis-world/05_handoff/v1/qa/navigation-overlay.jpg` 走查可行走区域，
   `contact-sheet.jpg` 核对角色/家具/热点对齐。
5. **日常姿态**：点击椅子、咖啡机、休息桌，确认坐下/持杯可见反馈；再点地面或热点，确认姿态结束并继续移动。
6. **两扇门**：点击“家中走廊”和“家中其他房间”，确认显示去向说明、不切换场景；走查房间与庭院/住宅外围的连续关系。
7. **主线（点击组装）**：工具箱→海报→窗收集三件；工作台选中松动接口→执行检查→进入组装；选中零件后点击对应插槽，确认插槽在零件之上可点；三件完成→返回工坊→装备架陈列。
8. **主线（拖拽组装）**：重玩后换领取顺序，拖拽三件到插槽完成；错误插槽/错误顺序不消耗零件。
9. **失焦与恢复（I-07）**：移动途中切换应用/最小化，确认停止且不误触互动；回到页面后继续点击可正常游玩。
10. **刷新与重玩**：完成后刷新，确认装备架成品与任务状态恢复；“重玩主线”→取消不改变进度，确认后清主线且只清本功能存档。
11. **缩放**：在 1280 与 1600 宽度、以及浏览器运行中调整窗口后点击同一场景点，角色落点一致（自动化已覆盖两视口，人工复核运行中缩放）。
12. **加载失败**：断网或拦截核心图，确认错误提示与重试；核心图未就绪时不应出现可玩场景。
13. **背景音乐**：进入工坊后音乐自动循环播放；点击「音乐：开/关」切换，刷新后状态保持；帮助面板内可见音乐署名（Sappheiros – Universe，CC BY 3.0）。

## 8. 决策 / 偏差

1. **i18n 键集补充**：计划键集缺少若干已列入替换点的界面文案，C3 实际额外新增 8 个键：`world.help`（操作说明）、`world.gotIt`（知道了）、`world.looseInterface`（松动接口）、`world.assemblyPiece`（零件）、`world.assemblySocket`（插槽）、`world.rackNeedModules`、`world.rackNeedAssembly`、`world.rackPlaced`（装备架三种提示）。中文值均取自现行界面文案，英文为对应译文。英文 chrome 收口新增 14 个键：`world.questComplete`、`world.questRack`、`world.questReturnWorkbench`、`world.questGoWorkbench`、`world.enterWorkshop`、`world.heroTag`、`world.badgeIsometric`、`world.equipmentHeading`、`world.worldHeading`、`world.storiesHeading`、`world.reset`、`world.resetConfirm`、`world.unreachable`、`world.assemblyCompleteHint`。终审再新增 4 个键：`world.questRepairNeeded`、`world.questFind`、`world.assemblyHelp`、`world.characterHeading`；工作台任务文案收口新增 2 个键：`world.taskIntro`、`world.taskFindAt`。当前中英各 397 键，由 `i18n/parity.test.ts` 守护。
2. **`world.assemblyClose` 合并两处按钮**：计划只给一个键，而原界面有“返回工坊”（完成态）与“稍后再装”（未完成态）。统一使用 `world.assemblyClose`，中文取“返回工坊”，英文 “Back to workshop”；未完成态不再出现“稍后再装”。
3. **`world.repairDone` 的用途**：计划未说明。用作维修完成后的面板标题“能源匣已修复”；`world.cellFixed` 仍为状态句“接口已复位，供能检查通过。”。
4. **未迁移的内容型中文**：模块名/来源（作为 `world.questFind`/`world.taskFindAt` 的插值）、内容面板正文、故事/装备名、`alt` 文本与场景 `aria-label` 仍来自内容包或固定内容，按“世界正文中文”处理；任务栏当前动作、工作台任务说明、重玩对话框、装备/世界/故事标题、两处 CTA、hero tag/badge、组装帮助与完成提示已走 i18n。
5. **`content.ui.help/helpLines`**：组件已停止读取；`loadWorldData` 仍校验这两个字段以保持内容包契约，content JSON 未改。
6. **C4 测试数量**：计划列 6 个边界领域；其中“点击组装语义”已在 C1 落地 2 条测试，C4 新增 5 条（取消≠到达、方向帧与脚底锚点、actorHeight、焦点归还、舞台缩放接线）。总数 129 → 136（C1 +2，C4 +5）。
7. **取消用例的触发方式**：浏览器自动化使用页面内 `blur` 事件，覆盖 `useSceneLoop` 的取消路径；真实 OS 级失焦切换未自动化。
8. **交互脚本范围**：`qa-world-interactions.mjs` 的中文路径跑完整点击/拖拽主链路；英文路径由 `qa-cdp.mjs` 只读断言界面语言、CTA、H2、返回链接与重玩按钮。工作台任务说明与组装帮助位于面板之后，只读探针不打开面板；本轮以英文路径手工走查确认工作台任务文案显示 `The Bug Buster body is on the workbench...` / `Look for it at ...`，组装面板显示 `Assemble the Bug Buster` 与英文帮助文案，交互脚本本身仍只跑中文主链路。
9. **QA 脚本不入 `pnpm test`**：两个脚本依赖 preview 服务与带调试端口的 Chrome，需按第 1 节命令单独运行；`pnpm test` 保持零外部依赖。
10. **选中态插槽边缘取舍**：选中零件后，插槽圆区（44px 直径）会压住零件边缘；从该边缘开始拖拽会命中插槽并得到“不匹配”提示。这是保证插槽在零件之上可点的已知交互取舍，零件主体区域仍可正常拖拽。

## 9. 截图索引

| 文件 | 内容 |
|---|---|
| `docs/qa/screenshots/landing-zh-1280.png` | 中文专题首页首屏（1280×800） |
| `docs/qa/screenshots/landing-en-1280.png` | 英文专题首页首屏（英文章节角标与按钮） |
| `docs/qa/screenshots/workshop-zh-1280.png` | 工坊初始场景（12 热点、任务栏） |
| `docs/qa/screenshots/workshop-zh-1600.png` | 1600×900 视口下的工坊 |
| `docs/qa/screenshots/workbench-repair.png` | 能源匣维修完成、进入组装前 |
| `docs/qa/screenshots/assembly-selected.png` | 选中瞄准模块，插槽高亮且可命中 |
| `docs/qa/screenshots/assembly-complete.png` | 组装面板完成态：成品特写、完成提示与“返回工坊”按钮 |
| `docs/qa/screenshots/rack-complete.png` | 关闭组装面板后到达装备架：架上 Bug Buster、任务栏“主线完成 · Bug Buster 已陈列” |
| `docs/qa/screenshots/workshop-drag-complete.png` | 第二轮拖拽安装并完成装备架陈列后的房间状态 |

重跑脚本后，4 张内容有更新（`landing-zh-1280.png`、`landing-en-1280.png`、`workbench-repair.png`、`workshop-zh-1280.png`）；其余 5 张与上轮字节一致（MD5 见下）。`rack-complete.png` 与 `workshop-drag-complete.png` 在关闭组装面板、角色到达装备架、完成文案出现后捕获。三张关键图的 MD5：

```text
assembly-complete.png       fd4545b4ded7fe1d824282c575556def
rack-complete.png           9731bc8384403e6ff8e24fe0e2d55b87
workshop-drag-complete.png  7657ab92edec9e6bda25408c5f3c7fc3
```

headless Chrome 的字体栅格与有头浏览器可能略有差异。

## 9. 玩法迭代验收（2026-10-19）：2.5D 动画 / 九宫格组装 / 主动拾取

在 `0a23b8c` 系收口之后按《tuvis-world-改动清单》实施的三项玩法（外部清单，不再重复正文），本节记录增量验证。

### 9.1 素材审计（实施前）

`Tuvis_Isometric_Sprite_Strips_v0_1` 实为两代混合：v0.1 原版 256×320 单元 4 张（walk-sw 旧版、jump/pickup/celebrate SE）+ 再生成版 362×724 单元 10 张。逐张目检结论：`tuvis-walk-se.png `（尾随空格）内容实为 SW；`facing SW (front-right) .png` 是挥手 4 帧；UUID 命名文件是 REVIEW 姿态；walk-ne 是 walk-nw 的镜像生成（头朝相反侧，文件不同）。入库 8 张（idle-sw、walk 四向、jump/pickup/celebrate SE），FIRE/WAVE/CODE/REVIEW 留在下载目录未启用；对照表见 `public/world/v1/assets/characters/2.5d/README.md`。

### 9.2 实现与评审修复

- 实现：`petFrames.ts`（steps(N-1) 帧动画 + ACTION_DURATIONS）、`TuvisSprite.tsx`（background-position 百分比帧动画）、九宫格 `AssemblyPanel.tsx`（grid cells + 托盘 + converge→flash→reveal）、主动拾取（interaction pickup 分支 + PickupPanel + 浮动零件）、`scene.json assembly.grid`、i18n 404 键。
- 独立评审（对照清单逐条）发现并已修复：
  - P0 镜像精灵整体偏移一个身位（`translate(...) scaleX(-1)` 在 origin 0 0 下矩阵顺序错误）→ 改为 `scaleX(-1) translate(...)`，并在只读 QA 增加「actor sprite centered over shadow」几何断言（|dx|<8px）防回归；
  - P1 托盘零件仅指针可选（键盘 Enter/Space 无法组装）→ 恢复 click 选中通道（ref 抑制拖拽后二次 click）；
  - P1 2.5D 条带绕过 manifest 管线 → 8 张注册进 `manifest.assets`（sha256/尺寸/alpha），idle 进 `coreAssets`，其余工坊进入后后台预热；同步交接包（25 images / 56 checked files）、`asset-provenance.json`（+prompt 文件）、spec/plan 材料映射表（25/25）；
  - P2 拖拽 ghost 参考系错位（cardRef→layoutRef）、celebrate 在全屏遮罩后不可见（延迟到关闭组装面板时触发）、reduced-motion 未关白闪（已补 `opacity:0`）。
- 已知限制（记录不修）：NW/NE 无 idle 素材（walk 首帧静止兜底）、NE 行走为镜像（耳朵左右反转）、「零件飞入任务栏」无飞入动效、converge 收敛中心有 padding/gap 级 ≤20px 误差。

### 9.3 增量验证（HEAD=本轮提交前工作区）

| 项 | 结果 |
|---|---|
| 单元测试 | `pnpm test`：15 文件 / 146 条全过（连跑 3 次稳定；含九宫格变绿/放错静默/成功序列、拾取 6 分支、动画状态机等新用例） |
| 类型 / 构建 | `tsc --noEmit` 零输出；`pnpm build` exit 0 |
| 只读 QA | `qa-cdp.mjs` PASS 4 routes（新增 sprite/shadow 对位断言，zh/en 双路由通过） |
| 交互 QA | `qa-world-interactions.mjs` PASS 79/79 ×2（点零件拾取→九宫格点击/拖拽/错格弹回→成功特效→装备架→持久化→缩放→深链） |
| 资源校验 | `verify-pack.mjs` PASS：25 images, 15 frames, 12 hotspots, 18 connected nodes, 56 checked files |
| 交接审计 | `audit-handoff.mjs` PASS：25/25 mappings；grid 契约检查通过 |

截图重拍 8 张（`docs/qa/screenshots/`），关键变化：工坊首景为 2.5D 角色 + 三个发光浮动零件；`assembly-selected.png` 为九宫格 + 托盘；`assembly-complete.png` 为成品揭示面板。`rack-complete.png` 与 `workshop-drag-complete.png` 为同一最终陈列画面（两条链路终点一致），属预期。

### 9.4 人工验收反馈修复（2026-10-20）

人工验收（截图反馈）发现四个问题，逐项实测定位后修复：

1. **浮动零件过大、悬空位置不合理** → 零件盒从 220×150 缩到 110×76 场景像素，并从「热点顶部上方」改为锚定热点底沿上方 24px——即工具箱箱体、窗台、海报下收纳盒所在位置（零件归属地见任务文案：工具箱 / 窗边储物 / 海报旁收纳盒）。热点上部仍可点击打开原始内容面板（交互 QA 探针同步改为点热点上部）。
2. **组装面板托盘同时显示两个零件** → 拖拽 ghost 泄漏：pointerup 丢失时拖影残留，零件安装后从托盘移除而拖影仍在。三层修复：ghost 渲染前校验零件仍在托盘（守卫）、安装发生即清空 ghost（effect）、pointerdown 时挂全局一次性 pointerup 兜底。
3. **行走与静止大小不一致（仅 SE 正常）** → 用 PNG 透明度包围盒实测各条带：SE/idle 角色占单元高 ~90%，而重生成的 SW/NW/NE 条带仅 54%–58%，脚底线也从 0.95 变为 0.80–0.84。修复：petFrames 按实测逐条带归一化 displayHeight（角色统一 ~184 场景像素）与脚底锚点（anchor 进 transform translate）。
4. **向左走时角色倒着走** → 逐帧裁剪目检实锤：以 `tuvis-walk-se.png `（尾空格）入库的条带实为**另一张 SE 朝向**素材（此前审计误判为 SW）。修复：SW 改由大尺寸 SE 条带运行时镜像承担，该文件从包/manifest/文档材料表移除（24 images / 24 mappings）。

修复后验证：146/146 测试、tsc/build 绿、只读 QA 4 路（含 sprite/阴影对位断言）、交互 QA 79/79、verify-pack/audit-handoff/import-world-pack 全过；四方向行走截图（SW/NW/SE/NE）目检朝向正确、大小与 idle 一致。

### 9.5 人工验收反馈修复 · 第二轮（2026-10-20）

1. **重玩主线确认框透明** → 根因：确认框渲染在 `.world-page` 作用域外，`--world-soft`/`--world-line` 变量解析失败使卡片失去底色。移回作用域内，并给 `.world-modal-card` 补 fallback 底色防御。
2. **零件按据点重分布**（机身预置在工作台）：能源匣→沙发、脉冲发射头→书架（浮动零件锚定物件上，点零件拾取、点区域其他部分开原始内容）、瞄准模块→工具箱内（新增 `pickupHidden`：不外显浮动零件，走到工具箱"开箱"即获得并弹说明面板）。interaction 的 equipment/world/**stories** 三类热点统一支持 pickup 语义；任务文案同步为「工具箱里 / 沙发上 / 书架上」。
3. **组装完成揭示图成品机枪过大** → 缩至 ~1/5（118px 小图 + 名称 + 描述 + 类比 + 返回工坊）。
4. **完成文案** → 组装完成关闭面板后，场景显示绿色横幅「主线任务已完成，请继续探索兔维斯世界。」（`world.questDone`，zh/en）。

验证：150/150 测试（test-engineer 同步拾取语义，+4 用例）、tsc/build、只读 QA 4 路 ×2、交互 QA 81/81 ×2（新增箱内零件、完成横幅探针）、verify-pack/audit-handoff 全过。

### 9.6 人工验收反馈修复 · 第三轮（2026-10-20）

**右上（NE）行走朝向左上** → 逐帧目检实锤：两张背面行走条带的内容朝向在生成交付时就放反了（`tuvis-walk-ne.png` 实际头朝左后、`tuvis-walk-nw.png` 实际头朝右后），此前两轮目检均未识别（背面视角朝向差异细微）。修复：对调两张文件内容使文件名与朝向一致（manifest sha256 / checksums / README 对照表同步），petFrames 的实测归一化参数随内容对调。答案备忘：方向错误用镜像/换素材修正，2.5D 立绘不可旋转。

验证：150/150 测试、tsc/build、交互 QA 81/81、verify-pack/audit-handoff/import 全过；NE/NW 行走截图目检朝向正确。

### 9.7 玩法迭代 · 第四轮（2026-10-20，grilling 对齐后实施）

1. **主画幅满宽**：与顶部工具栏同宽（1120），画布随 3:2 比例增大。
2. **维修步骤删除**：集齐三件后工作台直达组装面板；`canAssemble` 不再依赖
   `cellRepaired`；任务指引与 `quest.instructions` 同步。修复连带回归：
   `sanitizeQuest` 原要求 cellRepaired 才保留 installed，无维修流程下存档会丢
   installed——已改为只要求集齐三件。
3. **零件锚点数据化**（`pickupAnchor`，场景坐标）：能源匣→沙发座位、脉冲发射头→
   货架顶（moduleId 移至装备架热点，rack case 支持 pickup），瞄准模块→工具箱内
   （pickupHidden 保持隐藏）。绿框位置按验收截图目测落点。
4. **完成态工作台**：桌面渲染成品小图（`workbenchDisplay`），点桌面弹「桌面上的成品」
   面板；场景浮动「试用 Bug Buster」按钮与面板内按钮均触发 fire 开火动画（fire 条带
   入库，4×543×724，实测 charH 0.939/feetY 0.960）。再次走进工作台不弹组装面板。
5. **HUD 收编**：右上角半透明任务目标卡（可收起）承载模块槽 + 当前目标 + 操作说明 +
   完成文案；顶栏移除 questbar、help 横幅与操作说明按钮，只留 音乐 + 重玩主线。

修复过程记录：货架顶浮动零件曾与任务卡（z 1200）重叠导致点击被吞——anchor 下移至
货架中格；「桌面成品」陈列与装备架陈列的位置回归以自动化探针守护（displays anchored
on furniture）。验证：163 测试（+14，QuestCard 新组件 8 条）、tsc/build、只读 QA
4 路、交互 QA 86/86 ×2、verify-pack 25 图 / audit-handoff 25 mappings、截图目检。

### 9.8 玩法迭代 · 第五轮（2026-10-20）

1. **机身可拾取**：ModuleId 增加 body，窗下柜子浮动零件，收集即落座工作台
   （COLLECT body → installed）。组装门槛变为四件齐。
2. **浮动零件缩小 30%**（110×76→77×53）并微移至验收绿框（发射头货架绿框位、
   能源匣沙发座绿框位）。
3. **试用开火**：站位 scene.trySpot=[430,635]（工作椅左侧，接入 nav）；fire 循环 2 秒。
   定位教训：首版目测点距椅子碰撞菱形仅 3.1px（footRadius 12）不可达，须按
   obstacle 距离实测选点。
4. **到站转正面**：advanceMotion 到达时 nw→sw、ne→se（背面 idle 无动画）。
5. **表情菜单**：点击兔维斯（独立命中层 data-actor-hit，z 1100——修复角色站进
   热点后点击被截胡）弹出 跳一跳/庆祝一下/试一炮（fire 仅组装后），任务卡
   操作说明同步新增提示。
6. **任务卡紧凑化**：尺寸/字体缩 ~30%、背景透明度提高。

验证：170 测试（+7）、tsc/build、只读 QA 4 路、交互 QA 97/97 ×2、
verify-pack（Content counts 4 / grid 去重）/ audit-handoff、截图目检。
