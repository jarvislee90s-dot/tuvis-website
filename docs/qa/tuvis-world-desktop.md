# 兔维斯世界 · 桌面验收记录（2026-10-19）

对照需求说明书 9.1–9.3 与实施计划 Task 1–9。以下结果均为本仓库的实际命令或浏览器自动化输出；未实际执行的平台逐项列在末尾，不按通过计。

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

后续区块门槛以本次实测的 15 个文件 / 129 条测试为基线。

## 0. 执行环境（历史记录：云端沙箱）

| 项 | 实际值 |
|---|---|
| OS | Linux 6.6.95.bck.2-rc1-amd64（云端沙箱） |
| Node / npm / pnpm | v22.22.3 / 10.9.8 / 10.20.0 |
| 浏览器 | Chromium `146.0.7680.31`（`/usr/local/bin/chromium`，通过 CDP `127.0.0.1:9222` 驱动） |
| 预览服务 | `pnpm preview --host 127.0.0.1 --port 4173`（构建产物 `dist/`） |
| 视口 / DPR | 1280×720 DPR1；1920×1080 DPR1.25；1280×720 DPR2（Chrome 设备模拟，不是 Windows/macOS 实机缩放） |
| 浏览器自动化脚本 | `/tmp/qa-browser.mjs`（非产品代码；证据见 `/mnt/tos/workspace/tuvis-world-qa/`） |
| 截图 | `/mnt/tos/workspace/tuvis-world-qa/landing-zh-1280.png`、`workshop-zh-1280.png`、`workshop-zh-1920.png`、`landing-zh-1920.png` 等 |

## 1. 资源校验

```text
$ node tuvis-world/05_handoff/v1/tools/verify-pack.mjs
PASS: 17 images, 15 frames, 12 hotspots, 18 connected nodes, 47 checked files.
Static resource verification only; website implementation and browser acceptance remain in the plan.

$ node tuvis-world/05_handoff/v1/tools/audit-handoff.mjs
PASS: spec/plan material mappings 17/17; 9 root-relative task file lists; loader, state-event and pose contracts aligned.
PASS: document links, provenance prompts and portable active-package paths.
```

导入命令实际输出：

```text
$ node scripts/import-world-pack.mjs
import-world-pack: copied 20 files to public/world/v1
```

导入器在写入前逐文件校验 SHA-256 与包内相对路径；测试覆盖真实包 SHA 一致、篡改字节拒绝、`../outside.png` 拒绝且不写目标目录。

## 2. 专题首页（9.1）

### 2.1 六模块与内容来源

| 模块 | 页面呈现 | 数据来源 |
|---|---|---|
| W-01 主视觉 | 标题、导语、hero 角色、回路城氛围、两个入口 | `content.title/intro`、`content.heroAsset`（`assets/landing/hero.png`）、`content.cityAsset`（`assets/landing/city.png`） |
| W-02 认识兔维斯 | 角色图、姓名/副标题/简介、三个性格标签、HUD 护目镜/胡萝卜核心/工坊装甲 | `content.character.*`，图同 `heroAsset` |
| W-03 装备图鉴 | 四装备图、名称、英文名、身份色、说明、代码编辑类比 | `content.equipment[]`；图片按 `sourceRect` 从 `family` 图集裁切 |
| W-04 世界设定 | 回路城、工坊、居民三类图文 | `content.world[]` + `content.cityAsset/workshopPreviewAsset/residents` |
| W-05 故事档案 | 三张封面、标题、状态、简介、“查看简介”展开 | `content.stories[]` + `storyPerfect/storyMissing/storyWeapon` |
| W-06 工坊体验 | 工坊预览、任务四步、两条操作提示、桌面提示、入口 | `content.workshopPreviewAsset`（`room`）、`content.quest.*`、`content.ui.helpLines` |

浏览器逐段检查（`/tmp/qa-sections.mjs`，1280×900）：

```text
{"id":"hero","imgs":2,"broken":0}
{"id":"character","imgs":1,"broken":0}
{"id":"equipment","imgs":4,"broken":0}
{"id":"world","imgs":3,"broken":0}
{"id":"stories","imgs":3,"broken":0}
{"id":"workshop","imgs":1,"broken":0}
```

六段均含真实标题/正文；每段图片 `naturalWidth > 0`，坏图数 0。

### 2.2 入口、裁切、故事展开

浏览器验收（47/47 通过）中的相关输出：

```text
PASS landing: title — "Tuvis World｜兔维斯世界 · Tuvis"
PASS landing: six sections — 6
PASS landing: four equipment — ["差异探测雷达","Bug 清除脉冲炮","代码编织终端","代码融合棱镜"]
PASS landing: three stories — ["完美的一天，差一点","谁动了我的零件？","最厉害的武器"]
PASS landing: two workshop links — ["/tuvis-website/zh/world/workshop","/tuvis-website/zh/world/workshop"]
PASS landing: images loaded — []
PASS landing: family sourceRect crops — {"w":"200%","h":"200%","left":"0%","top":"0%"}
PASS landing: story dialog opens — "×\n完美的一天，差一点\n故事简介\n\n兔维斯试图用一整套自动化系统让今天变得完美无"
PASS landing: deep-link reload
```

- 两个入口（W-01、W-06）均为同一路径 `/tuvis-website/zh/world/workshop`。
- W-03 四张图使用 `content.equipment[].sourceRect`（`family.png` 1254×1254 的四格）以 SVG/CSS 裁切，未使用等分替代。
- “查看简介”打开对话框展示完整 `summary`，Esc/关闭可用，关闭后焦点回到触发按钮（`WorldLanding.test.tsx`）。
- 素材层已记录：`family.png` 在 x=627 边界处有相邻格少量渗色，Bug Buster 裁切左缘会带入邻格残段；这是提供素材本身，页面严格使用给定 `sourceRect`，未自行改裁切。

### 2.3 `/en` 与内容语言

```text
PASS en landing: language note — "World content is currently provided in Chinese."
PASS en landing: workshop links stay en — ["/tuvis-website/en/world/workshop","/tuvis-website/en/world/workshop"]
PASS en landing: nav world entry
PASS en workshop: language note and scene — {"note":"World content is currently provided in Chinese.","hotspots":12,"controls":["操作说明","重玩主线"]}
```

英文路径保留英文导航（`Tuvis World`）与语言切换；世界正文按中文内容交付并显示语言说明。

### 2.4 路由与深链接

```text
$ for p in zh/world zh/world/workshop en/world en/world/workshop; do code=$(curl -s -o /tmp/route.html -w "%{http_code}" "http://127.0.0.1:4173/tuvis-website/$p"); echo "$p -> HTTP $code"; done
zh/world -> HTTP 200
zh/world/workshop -> HTTP 200
en/world -> HTTP 200
en/world/workshop -> HTTP 200
```

直接访问与刷新：浏览器脚本对 `/zh/world` 执行了 `Page.navigate` 后再刷新；对 `/zh/world/workshop` 执行 `Page.reload` 两次（刷新恢复存档与缩放复测），均重新渲染成功。服务端静态壳 `<title>` 为全站标题，运行时由页面设置：专题 `Tuvis World｜兔维斯世界 · Tuvis`，工坊 `让 Bug Buster 重新上线 · Tuvis Workshop`（浏览器读取 `document.title` 实际值）。

## 3. 工坊（9.2）

### 3.1 12 个热点与可达性

热点 id、标签、靠近点（来自 `scene.json`），以及 `findPath(spawn, approach)` 测试结果：

| # | id | 标签 | approach | 最短路径点数 | 结果 |
|---|---|---|---|---|---|
| 1 | `workbench` | 工作台 | 600,570 | 2 | PASS |
| 2 | `toolbox` | 工具箱 | 415,650 | 3 | PASS |
| 3 | `window` | 回路城 | 650,530 | 2 | PASS |
| 4 | `posters` | 居民海报 | 920,550 | 2 | PASS |
| 5 | `coffee` | 咖啡机 | 750,490 | 2 | PASS |
| 6 | `books` | 故事书架 | 925,565 | 2 | PASS |
| 7 | `rack` | 装备架 | 1190,650 | 2 | PASS |
| 8 | `chair` | 坐一会儿 | 480,680 | 2 | PASS |
| 9 | `lounge` | 休息角 | 1180,710 | 3 | PASS |
| 10 | `table` | 休息桌 | 870,785 | 3 | PASS |
| 11 | `door-hall` | 家中走廊 | 1080,585 | 2 | PASS |
| 12 | `door-side` | 家中其他房间 | 1280,675 | 2 | PASS |

逐项实测输出（临时证据测试，运行后删除，不进入产品代码）：

```text
HOTSPOT workbench approach=600,570 path=2 ok=true
HOTSPOT toolbox approach=415,650 path=3 ok=true
HOTSPOT window approach=650,530 path=2 ok=true
HOTSPOT posters approach=920,550 path=2 ok=true
HOTSPOT coffee approach=750,490 path=2 ok=true
HOTSPOT books approach=925,565 path=2 ok=true
HOTSPOT rack approach=1190,650 path=2 ok=true
HOTSPOT chair approach=480,680 path=2 ok=true
HOTSPOT lounge approach=1180,710 path=3 ok=true
HOTSPOT table approach=870,785 path=3 ok=true
HOTSPOT door-hall approach=1080,585 path=2 ok=true
HOTSPOT door-side approach=1280,675 path=2 ok=true
```

同时 `src/world/scene/navigation.test.ts` 的 `reaches every hotspot approach point from spawn` 对 12 个热点逐项断言 `findPath !== null`，测试通过。路径每一段都经 `isSegmentClear` 复核；跨休息椅的直线 `[950,714]→[1190,714]` 被拒绝，绕行路径逐段验证。

### 3.2 操作与导航（9.2 对应项）

浏览器实测（真实 Chromium）：

```text
PASS workshop: 12 hotspots — ["工作台","工具箱","回路城","居民海报","咖啡机","故事书架","装备架","坐一会儿","休息角","休息桌","家中走廊","家中其他房间"]
PASS workshop: ground click moves actor — {"left":698.514,"top":618.933,...}
PASS workshop: unreachable keeps position and warns — "这里暂时过不去，换个位置试试。"
PASS workshop: toolbox approaches then opens content
PASS workshop: posters approaches then opens content
PASS workshop: window approaches then opens content
PASS workshop: books share story content
PASS workshop: hall door explains destination
PASS workshop: side door explains destination
PASS workshop: coffee pose — "coffee"
PASS workshop: sitting pose and depth — {"left":510,"top":520,"frame":"sit","z":626,"height":"190px"}
PASS workshop: click cancels daily pose
```

- **点击地面移动**：点击后角色位置从出生点到目标点；点击坐标通过舞台实际 `getBoundingClientRect` 换算。
- **点击物件先走近再触发**：工具箱/海报/窗均先移动到 `approach`，到达后由唯一 token 触发内容；测试与浏览器均验证。
- **新目标取消旧事件**：`runtimeStore` 中旧 token 到达被忽略；`motion.test.tsx` 断言旧到达不写入 `pendingArrival`。
- **跨障碍拒绝**：`navigation.test.ts` 拒绝穿过休息椅的直线，且绕行路径每段合法；`advanceMotion` 大帧间隔（5000ms）被钳制为 100ms/19px，不会穿模。
- **面板暂停**：`setOverlay` 取消当前目标，`requestMove` 在面板打开时直接忽略；帧循环仅在 `overlay === null` 时推进。
- **失焦停止**：`useSceneLoop` 监听 `window.blur` 与 `visibilitychange`，浏览器/集成测试验证 target 清空；组装面板在 blur 时取消拖拽。
- **角色表现**：角色脚底有独立 SVG/CSS 投影；移动时 `.world-actor.is-moving` 触发 420ms 起伏，姿态切换有 170ms 淡入；`prefers-reduced-motion` 下关闭动画。
- **重玩确认**：对话框支持 Esc/背景点击关闭，打开时焦点进入“取消”，关闭后回到“重玩主线”按钮；确认重玩同时清空 notice。
- **缩放换算**：日志显示同一场景点在 1280×720@1、1920×1080@1.25、1280×720@2，以及运行中从 1280×720 直接改到 1600×900@1.5（不刷新）后点击均落在目标坐标：

```text
PASS workshop: click mapping 1280x720@1x — {"left":698.514,"top":618.933,...}
PASS workshop: click mapping 1920x1080@1.25x — {"left":698.743,"top":619.423,...}
PASS workshop: click mapping 1280x720@2x — {"left":698.514,"top":618.933,...}
```

### 3.3 遮挡、脚底、日常动作

```text
PASS workshop: actor behind lounge when farther — {"actor":618,"prop":745}
PASS workshop: actor in front of lounge when nearer — {"actor":769,"prop":745}
```

角色按脚底 y 深度渲染，家具按 `scene.props[].depth` 渲染；`620 < 745` 时被休闲椅遮挡，`769 > 745` 时位于椅前。坐姿使用 `seatAnchorSource` 换算裁切内归一化锚点并落在 `seatPosition`，深度 626。咖啡/展示姿态使用独立帧，脚底保持在当前靠近点。与 `workshop-occlusion-behind/front.jpg` 描述的前后关系一致。

场景在 1280×720 下按高度约束缩放并居中（实测舞台 630×420，`left=318`，底部 698 < 720），窗口更大时等比放大；点击换算始终使用实际显示矩形。

## 4. 主线（9.2）

浏览器端完整跑通（真实 Chromium，非 mock）：

```text
PASS workshop: three module slots collected
PASS workshop: workbench repair panel
PASS workshop: repair succeeds
PASS workshop: assembly opens
PASS workshop: assembly assets preloaded
PASS workshop: three modules install and show complete
PASS workshop: rack displays and completes quest — "主线完成 · Bug Buster 已陈列"
PASS workshop: display pose at rack — "display"
PASS workshop: versioned save — {"schemaVersion":1,"quest":{"collected":["sight","cell","emitter"],"cellRepaired":true,"installed":["sight","cell","emitter"],"displayedOnRack":true,"helpSeen":false}}
PASS workshop: refresh restores completed quest — {"action":"主线完成 · Bug Buster 已陈列","rack":true}
PASS workshop: replay clears quest — "还需寻找：..."
PASS workshop: replay clears only this save — {"schemaVersion":1,"quest":{"collected":[],"cellRepaired":false,"installed":[],"displayedOnRack":false,"helpSeen":false}}
```

自动化测试证据：

| 验收项 | 测试 / 结果 |
|---|---|
| 三模块任意顺序（6 种） | 实测输出见下；`quest.test.ts` → `completes the quest for all six collection orders` PASS |

```text
ORDER sight -> cell -> emitter complete=true
ORDER sight -> emitter -> cell complete=true
ORDER cell -> sight -> emitter complete=true
ORDER cell -> emitter -> sight complete=true
ORDER emitter -> sight -> cell complete=true
ORDER emitter -> cell -> sight complete=true
```
| 重复领取不增加 | `does not duplicate a module` PASS |
| 未领取能源匣不能维修 | `ignores repair before the cell is collected` PASS |
| 未集齐/未维修不能安装 | `ignores install until all modules are collected and the cell is repaired` PASS |
| 三件安装后才能陈列 | `only places the finished weapon on the rack` PASS |
| 拖拽组装 | `AssemblyPanel.test.tsx` → `drags a piece into the matching socket` PASS |
| 点击零件→插槽组装 | `installs a module by selecting the piece and then its socket` PASS |
| 不同显示尺寸吸附 | `succeeds at the same socket under different display sizes` PASS（550×360 / 1100×720 / 733×480） |
| 错误插槽不消耗 | `does not consume a module when dropped on the wrong socket` PASS |
| pointercancel/失焦回托盘 | `cancels a drag on pointercancel and on window blur` PASS |
| 关闭不发 PLACE_ON_RACK | `never emits PLACE_ON_RACK when closed` PASS（该事件仅由装备架到达触发） |
| 刷新恢复 | `WorkshopFlow.test.tsx` → 完整流程 + 卸载重挂载，恢复 `displayedOnRack=true` PASS |
| 重复安装不消耗 | `quest.test.ts` → `does not consume the same module twice` PASS |
| 不可达点击结束日常姿态 | `motion.test.tsx` → `ends a daily pose even when the new destination is unreachable` PASS |
| 核心图未就绪不可玩 | `WorkshopFlow.test.tsx` → `does not mount a playable scene until core images resolve` PASS |
| 重玩对话框 Esc/焦点 | `WorkshopFlow.test.tsx` → 完整流程中 Esc 关闭并断言焦点回到触发按钮 PASS |
| 运行中缩放 | Chromium 实测 1280×720 → 1600×900@1.5 不刷新，点击落点误差 < 2 场景像素 PASS |
| 重玩清主线 | 完整流程测试点击“重玩主线”→确认，`INITIAL_QUEST` 且存储回到新局 PASS |
| 损坏/不可能存档 | `quest.test.ts` → 损坏 JSON、schema 2、未领取却已安装/陈列均安全重置 PASS |
| 存储不可用 | `readQuest` getItem 抛错、`writeQuest` setItem 抛错；`completes even when storage.setItem throws` PASS |
| 核心图片失败重试 | `workshop loading` → 首次 preload 失败显示错误，重试后进入场景，旧请求被忽略 PASS |
| 组装素材失败重试 | `AssemblyPanel.test.tsx` → `retries preload failures and keeps the quest` PASS |

## 5. 工程与发布（9.3）

- 既有 6 个测试文件/42 条测试零回归；`git diff a9eeea6..HEAD -- <六个基线测试文件>` 均为空。
- 新增测试文件：`scripts/import-world-pack.test.mjs`、`src/world/assets/loadWorldData.test.ts`、`src/world/landing/WorldLanding.test.tsx`、`src/world/scene/navigation.test.ts`、`src/world/scene/motion.test.tsx`、`src/world/scene/interaction.test.tsx`、`src/world/quest/quest.test.ts`、`src/world/quest/AssemblyPanel.test.tsx`、`src/world/WorkshopFlow.test.tsx`。
- `pnpm test`：15 个测试文件、129 条测试全部通过（42 基线 + 87 新增）。
- `pnpm exec tsc --noEmit`：无输出，exit 0。
- `pnpm build`：exit 0，生成 `dist/`（含 `dist/404.html`）；构建中的既有网络同步曾改写 `src/content/*.json` 与 `public/manual/`，已 `git checkout` 还原，未进入任何功能提交。
- 路由：`/tuvis-website/{zh,en}/world`、`/tuvis-website/{zh,en}/world/workshop` 静态服务均 HTTP 200；浏览器直接导航与刷新通过。
- 运行依赖：页面只加载 `public/world/v1/` 下由资源包导入的 20 个文件与站点构建产物；无生图、模型/图像 API、游戏引擎或新增外部服务。未新增运行时依赖。
- 无控制台异常：最终浏览器脚本 `errors: []`。

## 6. 未实测项（不得计为通过）

| 项 | 状态 / 原因 |
|---|---|
| Windows Chrome / Edge 实机 | 未实测。沙箱为 Linux，仅用 Chromium 146 设备模拟。 |
| macOS Chrome / Safari 实机 | 未实测。无 macOS/Safari 环境。 |
| Windows 125%/150% 系统显示缩放 | 未在真实 Windows 上验证；仅以 DPR 1.25 与视口缩放做浏览器模拟（点击换算通过）。 |
| Mac Retina 硬件 | 未实测；仅 DPR 2 模拟截图/点击换算。 |
| 真实网络资源失败/慢网 | 未实测真实断网；核心图与组装图失败通过注入失败的 loader 测试重试路径。 |
| 触屏 / 移动端 | 需求面向电脑浏览器，未做触屏手势验收。 |
| 键盘完整通关 | 面板按钮、热点、Esc、焦点恢复有测试；未做纯键盘从进入到完成的完整贯通验收。 |
| 长时运行性能 / 内存 | 未做长时压测。 |

## 7. 结论边界

以上“通过”仅指列出的命令、自动化测试与 Chromium 模拟结果。Windows/macOS 实机、Safari、真实系统缩放与真实网络故障仍需按需求 8/9.3 在目标机器复核。

## 8. 部署模拟与工坊交互抽查（2026-10-19）

**部署方式**：生产构建 `dist/` 由 `vite preview` 在 `http://127.0.0.1:4173/tuvis-website/` 提供，使用与 GitHub Pages 相同的 `/tuvis-website/` 子路径。浏览器 Chromium `146.0.7680.31`（CDP），视口 1280×900，DPR 1。

**抽查结果：9/9 PASS**

| # | 交互 | 实际结果 | 截图 |
|---|---|---|---|
| 1 | 初始工坊 | 12 个热点，场景/角色/家具正常 | `01-initial.png` |
| 2 | 点击地面 | 角色 (790,630) → (699,619) | `02-ground-move.png` |
| 3 | 点击工具箱 | 走近后打开装备图鉴，瞄准模块变为已领取 | `03-toolbox-codex.png` |
| 4 | 点击椅子 | 坐姿帧，深度 626 | `04-chair-sit.png` |
| 5 | 点击家中走廊门 | 展示“家中走廊”去向，不切换场景 | `05-door-destination.png` |
| 6 | 工作台维修 | 三模块集齐后打开能源匣维修面板 | `06-repair.png` |
| 7 | 组装特写 | 主体、三零件、三插槽可见 | `07-assembly.png` |
| 8 | 组装完成 | 三件安装后显示完整成品图 | `08-assembly-complete.png` |
| 9 | 装备架陈列 | “主线完成 · Bug Buster 已陈列” | `09-rack-complete.png` |

截图与汇总图：

```text
/mnt/tos/workspace/tuvis-world-qa/deploy-spotcheck/01-initial.png
/mnt/tos/workspace/tuvis-world-qa/deploy-spotcheck/02-ground-move.png
/mnt/tos/workspace/tuvis-world-qa/deploy-spotcheck/03-toolbox-codex.png
/mnt/tos/workspace/tuvis-world-qa/deploy-spotcheck/04-chair-sit.png
/mnt/tos/workspace/tuvis-world-qa/deploy-spotcheck/05-door-destination.png
/mnt/tos/workspace/tuvis-world-qa/deploy-spotcheck/06-repair.png
/mnt/tos/workspace/tuvis-world-qa/deploy-spotcheck/07-assembly.png
/mnt/tos/workspace/tuvis-world-qa/deploy-spotcheck/08-assembly-complete.png
/mnt/tos/workspace/tuvis-world-qa/deploy-spotcheck/09-rack-complete.png
/mnt/tos/workspace/tuvis-world-qa/deploy-spotcheck/contact-sheet.png
```

**抽查发现并修复的缺陷**：舞台未建立层叠上下文，角色/家具/热点的 z-index（最高到 1000）盖在 z-index 60 的弹窗上；维修面板截图里出现角色与家具压住 SVG 示意。修复：`.world-stage { isolation: isolate; }`。复测：

```text
PASS modal paints above scene sprites — {"isolation":"isolate","dialogOnTop":true}
```

同时移除维修面板里误用的组装提示文案（`ui.assemblyHelp`），维修模式只保留“点击高亮的松动接口，再执行检查。”
