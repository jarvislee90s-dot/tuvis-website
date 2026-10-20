# Tuvis World Website and Workshop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在现有官网交付兔维斯世界图文专题页，以及一个可移动、可互动、可完成 Bug Buster 主线的斜俯视工坊。

**Architecture:** 两页复用同一资源包、图文数据与内容面板；先交付专题首页，再接入工坊。场景采用 HTML/SVG 图片层、脚底坐标导航和纯任务状态机；所有图片由资源包提供。构建结果仍为现站静态 dist。

**Tech Stack:** React 19、TypeScript 5.7、Vite 6、Tailwind CSS 4、Framer Motion 12、Zustand 5、React Router 7、i18next 24；Node.js 22；pnpm 10.20.0。

**Spec:** [网站专区与工坊需求说明书](../specs/2026-10-19-tuvis-world-website-requirements.md)。

**Execution:** 用户已指定由能识图、无生图工具的云端 Agent 执行。资源准备已在本地完成；云端按 superpowers:executing-plans 顺序实施。本计划审阅前不启动产品代码实现。

## Path Convention

正文中的文件路径和命令参数均相对项目根目录 tuvis-website，所有命令从该目录运行。Markdown 链接按所在文档解析；以 / 开头的应用路由和浏览器 URL 不作为文件路径。JSON 内 path、scenePath、contentPath 是包内相对路径，按下方素材表映射到项目文件；不得硬编码开发机路径。

## Global Constraints

- 建设顺序为“专题展示页 → 工坊互动页 → 两页集成与部署验收”。
- /zh/world；/zh/world/workshop；/en/world、/en/world/workshop；部署 base 为 /tuvis-website/。
- “点击地面移动”“点击物件，兔维斯会走近并互动”。
- 采用人工标注的通道图与最短路径计算。
- 准备四个匹配斜俯视镜头的角色朝向图，移动时切换朝向并配合轻微起伏及脚下投影。
- 工坊是兔维斯家中的一个房间，建筑与周围地面、庭院和住宅结构相连。
- 本期点击门时展示去向说明，活动范围保持在工坊内。
- 部署后通过正常网站 URL 访问，访客无需安装客户端、插件、开发工具或配置 API Key。
- 所有图像从 tuvis-world/05_handoff/v1 获取；云端不增加生图、建模、外部运行服务或游戏引擎。
- 不修改 brand/、根 SPEC.md、legacy/；不手改同步生成的 src/content/*.json 和 public/manual/。
- 代码提交可在云端工作分支进行；生产发布沿用用户控制的 v* 流程，本计划不自行 push/tag。

## Review Focus

1. 快速点两件物件、随即打开面板或失焦：只触发最新到达目标，面板操作不带动角色（Task 5、8）。
2. 场景留边、Windows 缩放、组装放大：地面与插槽均按实际显示矩形换算，落点一致（Task 3、7）。
3. 终点合法但中途横穿家具、大帧间隔：整条路线和每次移动段合法，不能穿过障碍（Task 3、5）。
4. 存档 JSON 合法但状态不可能、存储抛错：恢复有效主线或新局，仍可完整游玩（Task 4、8）。
5. 核心图片首次失败、重试与语言入口切换：错误可恢复，不能出现透明角色游玩或失效深链接（Task 1、8、9）。

---

## File Structure and Contracts

资源包入口：tuvis-world/05_handoff/v1/README.md。
校验命令：node tuvis-world/05_handoff/v1/tools/verify-pack.mjs；node tuvis-world/05_handoff/v1/tools/audit-handoff.mjs。
对照图：tuvis-world/05_handoff/v1/qa/contact-sheet.jpg、tuvis-world/05_handoff/v1/qa/navigation-overlay.jpg、tuvis-world/05_handoff/v1/qa/workshop-occlusion-behind.jpg、tuvis-world/05_handoff/v1/qa/workshop-occlusion-front.jpg。
数据入口：tuvis-world/05_handoff/v1/manifest.json、tuvis-world/05_handoff/v1/scene.json、tuvis-world/05_handoff/v1/content/world.zh.json。不要用等分图集替代 sourceRect。

### Material Locations and Usage

| 资源 ID | 项目根目录相对路径 | 使用位置 |
|---|---|---|
| room | tuvis-world/05_handoff/v1/assets/scene/workshop-base.png | W-06 工坊入口预览；Task 5 背景层（scene.background） |
| directions | tuvis-world/05_handoff/v1/assets/characters/tuvis-directions.png | Task 5 场内四向站姿与移动；帧 nw、ne、sw、se |
| tuvis2dIdleSw | tuvis-world/05_handoff/v1/assets/characters/2.5d/tuvis2d-idle-sw.png | Task 11 角色 2.5D 动画；idle SW 六帧条（含眨眼），SE 运行时镜像，coreAssets 首帧 |
| tuvis2dWalkSe | tuvis-world/05_handoff/v1/assets/characters/2.5d/tuvis2d-walk-se.png | Task 11 角色 2.5D 动画；walk SE 六帧行走条 |
| tuvis2dWalkNw | tuvis-world/05_handoff/v1/assets/characters/2.5d/tuvis2d-walk-nw.png | Task 11 角色 2.5D 动画；walk NW 六帧行走条，兼作背面 idle 兜底 |
| tuvis2dWalkNe | tuvis-world/05_handoff/v1/assets/characters/2.5d/tuvis2d-walk-ne.png | Task 11 角色 2.5D 动画；walk NE 六帧行走条（NW 镜像生成），兼作背面 idle 兜底 |
| tuvis2dJumpSe | tuvis-world/05_handoff/v1/assets/characters/2.5d/tuvis2d-jump-se.png | Task 11 角色 2.5D 动画；点击角色跳跃四帧条 |
| tuvis2dPickupSe | tuvis-world/05_handoff/v1/assets/characters/2.5d/tuvis2d-pickup-se.png | Task 11 角色 2.5D 动画；拾取零件四帧条 |
| tuvis2dCelebrateSe | tuvis-world/05_handoff/v1/assets/characters/2.5d/tuvis2d-celebrate-se.png | Task 11 角色 2.5D 动画；组装完成庆祝四帧条 |
| actions | tuvis-world/05_handoff/v1/assets/characters/tuvis-actions.png | Task 6 日常动作；帧 sit、coffee、display |
| props | tuvis-world/05_handoff/v1/assets/props/workshop-props.png | Task 5/6 家具与深度遮挡；帧 deskChair、loungeChair、lowTable |
| hero | tuvis-world/05_handoff/v1/assets/landing/hero.png | W-01 首屏、W-02 角色介绍（Task 2） |
| city | tuvis-world/05_handoff/v1/assets/landing/city.png | W-01 城市氛围、W-04 回路城；窗景面板（Task 2/6） |
| workshop | tuvis-world/05_handoff/v1/assets/landing/workshop-overview.png | W-04 工坊图文介绍（Task 2） |
| residents | tuvis-world/05_handoff/v1/assets/landing/residents.png | W-04 居民类型；海报详情面板（Task 2/6） |
| family | tuvis-world/05_handoff/v1/assets/equipment/family.png | W-03 四装备图鉴；按 content.equipment[].sourceRect 裁切（Task 2/6） |
| storyPerfect | tuvis-world/05_handoff/v1/assets/landing/story-perfect-day.png | W-05《完美的一天，差一点》故事卡片（Task 2） |
| storyMissing | tuvis-world/05_handoff/v1/assets/landing/story-missing-parts.png | W-05《谁动了我的零件？》故事卡片（Task 2） |
| storyWeapon | tuvis-world/05_handoff/v1/assets/landing/story-best-weapon.png | W-05《最厉害的武器》故事卡片（Task 2） |
| gunBody | tuvis-world/05_handoff/v1/assets/equipment/bug-buster-body.png | Task 7 组装主体；scene.assembly.body |
| gunEmitter | tuvis-world/05_handoff/v1/assets/equipment/bug-buster-emitter.png | Task 7 发射头；模块 emitter |
| gunSight | tuvis-world/05_handoff/v1/assets/equipment/bug-buster-sight.png | Task 7 瞄准模块；模块 sight |
| gunCell | tuvis-world/05_handoff/v1/assets/equipment/bug-buster-cell.png | Task 7 能源匣；模块 cell |
| gunComplete | tuvis-world/05_handoff/v1/assets/equipment/bug-buster-complete.png | Task 7 完成成品；Task 6 装备架陈列（scene.rackDisplay） |

场内角色仅使用 nw/ne/sw/se 和 sit/coffee/display 帧；家具使用 deskChair/loungeChair/lowTable。角色、家具与装备均按 manifest.frames[id].asset 找原图，再按 sourceRect 裁切。family 图鉴用 content.equipment[].sourceRect；首页图片直接用资源 ID 找 path。任何原图位置均可从本表直接定位。


~~~text
scripts/import-world-pack.mjs           复制并验证资源
scripts/import-world-pack.test.mjs      校验损坏资源/路径与复制结果
public/world/v1/                        导入后的 manifest、scene、content、assets
src/pages/WorldPage.tsx                 图文专题入口
src/pages/WorkshopPage.tsx              工坊入口与返回导航
src/world/types.ts                     与包 JSON 一致的类型
src/world/assets/loadWorldData.ts       静态 JSON 与核心图片加载
src/world/content/ContentPanel.tsx      角色/图鉴/世界/故事/门/说明面板
src/world/landing/WorldLanding.tsx      六展示模块
src/world/scene/geometry.ts             点、线段、障碍与坐标换算
src/world/scene/navigation.ts           路径、朝向与移动推进
src/world/scene/SceneView.tsx           背景/物件/角色与深度
src/world/scene/Sprite.tsx              sourceRect、锚点与尺寸
src/world/scene/runtimeStore.ts        当前目标、位置、姿态、面板
src/world/scene/useSceneLoop.ts        帧循环与失焦清理
src/world/scene/interaction.ts         到达后的唯一物件事件
src/world/quest/quest.ts               任务 reducer 与合法性
src/world/quest/persistence.ts         版本化存档
src/world/quest/QuestBar.tsx           三模块任务提示
src/world/quest/WorkbenchPanel.tsx     工作台任务/维修/组装选择
src/world/quest/AssemblyPanel.tsx      拖拽/点击组装与成品
src/world/world.css                    专区局部样式
~~~

Task 1 建立 JSON 对应类型；后续统一使用这些名称：
~~~ts
type Point = readonly [number, number];
type Rect = readonly [number, number, number, number];
type Direction = "nw" | "ne" | "sw" | "se";
type ModuleId = "sight" | "cell" | "emitter";
type ContentOverlay = { kind: "equipment" | "world" | "stories" | "door" | "help"; id?: string };
type Overlay = null | ContentOverlay | { kind: "task" | "repair" | "assembly" };
type WorldContentBundle = { manifest: WorldManifest; content: WorldContent };
type WorldBundle = WorldContentBundle & { scene: SceneDefinition };
~~~
WorldManifest、SceneDefinition、WorldContent 的字段分别对应 tuvis-world/05_handoff/v1/manifest.json、tuvis-world/05_handoff/v1/scene.json、tuvis-world/05_handoff/v1/content/world.zh.json：包含 schemaVersion、assets/frames、size/walkable/obstacles/nav/hotspots/props/actions/assembly 和中文内容。解析时验证 schemaVersion=1、引用存在、数字有限与必需数组，不把类型断言当验证。
测试夹具由 Task 1 创建的 src/world/testFixtures.ts 提供：bundle 从包内三份 JSON 读取；fixtureFetch(overrides?: Partial<Record<"manifest" | "scene" | "content", unknown>>): typeof fetch 返回静态 JSON 响应。测试中的 mockSchemaVersion2 明确定义为 fixtureFetch({manifest: {schemaVersion: 2}})。

### Task 1: 可验证的资源接入与开发环境

**Files:** Create scripts/import-world-pack.mjs、scripts/import-world-pack.test.mjs、src/world/types.ts、src/world/testFixtures.ts、src/world/assets/loadWorldData.ts、src/world/assets/loadWorldData.test.ts、.nvmrc；Modify package.json、pnpm-lock.yaml。
**Interfaces:** Consumes 资源包及其校验器；Produces copyWorldPack(sourceDir: string, targetDir: string): Promise<void>、assetUrl(path: string, base?: string): string、loadWorldContent(fetcher?: typeof fetch): Promise<WorldContentBundle>、loadWorldData(fetcher?: typeof fetch): Promise<WorldBundle>、preloadAssets(bundle: WorldBundle,ids: string[],loader?: (url: string) => Promise<void>): Promise<void>、preloadCoreAssets(bundle: WorldBundle,loader?: (url: string) => Promise<void>): Promise<void>。

- [x] **Step 1: 固定开发工具配置。** 使用 Node22；package.json 的 packageManager 改为 pnpm@10.20.0，.nvmrc 写22。该版本已由 npm registry 核实存在且 engines.node >=18.12；现有11.13.0 pin启动报错。
- [x] **Step 2: 安装指定包管理器。** Run npm install --global pnpm@10.20.0；检查 pnpm --version 输出10.20.0。若云端限制全局安装，可用 npx --yes pnpm@10.20.0 执行本任务相同命令。
- [x] **Step 3: 安装项目依赖并更新锁文件。** Run pnpm install；审阅只包含版本兼容所需的锁文件变化。
- [x] **Step 4: 验证锁定安装。** Run pnpm install --frozen-lockfile；Expected exit0。
- [x] **Step 5: 写资源与加载失败测试。** 创建测试夹具并添加断言：
~~~ts
expect(assetUrl("assets/scene/workshop-base.png", "/tuvis-website/")).toBe("/tuvis-website/world/v1/assets/scene/workshop-base.png");
await expect(loadWorldData(mockSchemaVersion2)).rejects.toThrow(/schema/i);
await expect(preloadCoreAssets(bundle, async () => { throw Error("offline"); })).rejects.toThrow("offline");
~~~
补充断言：首页 loadWorldContent 仅请求 manifest.json 和 content/world.zh.json；即使 scene.json 请求会失败，首页仍能取得内容，fetcher 不应收到该请求。loadWorldData 在读取工坊时才请求 scene.json。
另在 Node 文件测试中复制到临时目录，断言 SHA 匹配；篡改一个字节或将资源路径改为 ../outside.png 时拒绝，不复制包外文件。
- [x] **Step 6: Run** pnpm exec vitest run scripts/import-world-pack.test.mjs src/world/assets/loadWorldData.test.ts；Expected FAIL，缺实现。
- [x] **Step 7: 实现接口。** import 脚本从 tuvis-world/05_handoff/v1/ 读取 assets/、content/、manifest.json、scene.json，导入 public/world/v1/ 下同名位置，先校验后复制；CLI 为 node scripts/import-world-pack.mjs。assetUrl 拼接 base + world/v1/ + 包相对路径。loadWorldContent 读取并验证 manifest 与 content；loadWorldData 复用内容加载后追加 scene，不在首页加载场景 JSON 或工坊图片；preloadCoreAssets 拒绝任一必需图片失败。导入后用类型检查确认 JSON 类型与脚本结果一致。
- [x] **Step 8: Run** node tuvis-world/05_handoff/v1/tools/verify-pack.mjs；node tuvis-world/05_handoff/v1/tools/audit-handoff.mjs；node scripts/import-world-pack.mjs；pnpm exec vitest run scripts/import-world-pack.test.mjs src/world/assets/loadWorldData.test.ts；Expected 验证 PASS、测试 PASS。
- [x] **Step 9: Commit** 上述明确文件和 public/world/v1，message: chore(world): prepare environment and verified assets。

### Task 2: 可独立浏览的专题首页

**Files:** Create src/pages/WorldPage.tsx、src/pages/WorkshopPage.tsx、src/world/landing/WorldLanding.tsx、src/world/content/ContentPanel.tsx、src/world/world.css、src/world/landing/WorldLanding.test.tsx；Modify src/router.tsx、src/components/layout/TopBar.tsx、src/i18n/zh.json、src/i18n/en.json。
**Interfaces:** Consumes WorldContentBundle、loadWorldContent、assetUrl；Produces WorldLanding({bundle}: {bundle: WorldContentBundle})、ContentPanel({overlay,bundle,onClose}: {overlay: ContentOverlay | null;bundle: WorldContentBundle;onClose(): void})，返回 React.JSX.Element | null。ContentPanel只渲染内容与说明，不导入维修/组装模块。

- [x] **Step 1: 写失败测试。** 在 MemoryRouter 渲染内容 bundle（不要求 scene）；断言“Tuvis World｜兔维斯世界”、四装备名、三个故事标题均出现；点“查看简介”看到完整 summary；两个“进入兔维斯工坊”都指向 /zh/world/workshop。点关闭后对话框消失，触发按钮恢复焦点。
- [x] **Step 2: Run** pnpm exec vitest run src/world/landing/WorldLanding.test.tsx；Expected FAIL。
- [x] **Step 3: 实现页面。** W-01～W-06 按需求顺序渲染，图鉴按 content.equipment.sourceRect 显示 family 图集；长文在 ContentPanel 中读取包内原文。首屏主图优先加载，其余图卡按需加载；router 在 /:lang 下加入 world，并通过 React.lazy 加载 world/workshop。此任务的 WorkshopPage 展示工坊介绍、静态预览与返回链接，Task 5 接入实际场景。中英添加同名 nav.world 与必要 world 界面键，英文页显示内容语言说明。
- [x] **Step 4: Run** pnpm exec vitest run src/world/landing/WorldLanding.test.tsx src/i18n/parity.test.ts；pnpm exec tsc --noEmit；Expected PASS。浏览器检查六模块与设定板的视觉层级一致。
- [x] **Step 5: Commit** 本任务页面、样式、路由与语言文件，message: feat(world): add character-world landing page。

### Task 3: 场景坐标、碰撞与可达路径

**Files:** Create src/world/scene/geometry.ts、src/world/scene/navigation.ts、src/world/scene/navigation.test.ts。
**Interfaces:** Consumes SceneDefinition、Point、Rect、Direction；Produces isWalkable(p: Point, scene: SceneDefinition): boolean、isSegmentClear(a: Point,b: Point,scene: SceneDefinition): boolean、toScenePoint(client: Point,rendered: Rect,sceneSize: Point): Point | null、findPath(from: Point,to: Point,scene: SceneDefinition): Point[] | null、directionFor(from: Point,to: Point,current: Direction): Direction。
**Algorithm decision:** 点/线段在可走多边形内部，且与障碍边的距离至少 footRadius；不能只测终点或仅采样。把起终点以合法线段连接人工节点图，再用 Dijkstra 取最短路径；无路径返回 null。
walkable 已是考虑外围安全余量的脚底中心区域；footRadius=12 用于内部家具的足迹避让，不对已内缩的外围重复收缩。

- [x] **Step 1: 写失败测试。**
~~~ts
expect(toScenePoint([868,562],[100,50,1536,1024],[1536,1024])).toEqual([768,512]);
expect(toScenePoint([484,306],[100,50,768,512],[1536,1024])).toEqual([768,512]);
expect(toScenePoint([99,50],[100,50,768,512],[1536,1024])).toBeNull();
expect(isSegmentClear([950,714],[1190,714],scene)).toBe(false);
expect(isWalkable([1070,714],scene)).toBe(false);
for (const h of scene.hotspots) expect(findPath(scene.spawn,h.approach,scene)).not.toBeNull();
~~~
另断言绕过休息椅障碍（中心 [1070,714]）的路径每段均合法；外部花园点 [40,40] 返回 null；四个方向与零距离保持 current 的结果准确。
- [x] **Step 2: Run** pnpm exec vitest run src/world/scene/navigation.test.ts；Expected FAIL。
- [x] **Step 3: 实现上列签名。** rendered 是图片等比包含后实际显示矩形，不是整个窗口；场景 size=[1536,1024]，footRadius=12、速度读取 scene.speed=190。
- [x] **Step 4: Run** pnpm exec vitest run src/world/scene/navigation.test.ts；Expected PASS，全部 hotspot 可达、跨障碍直线被拒绝。
- [x] **Step 5: Commit** 三个文件，message: feat(world): add safe workshop navigation。

### Task 4: 主线状态与可靠存档

**Files:** Create src/world/quest/quest.ts、src/world/quest/persistence.ts、src/world/quest/quest.test.ts。
**Interfaces:** Produces QuestState={collected: ModuleId[];cellRepaired: boolean;installed: ModuleId[];displayedOnRack: boolean;helpSeen: boolean}、INITIAL_QUEST、questReducer(state: QuestState,event: QuestEvent): QuestState、canAssemble(state: QuestState): boolean、isComplete(state: QuestState): boolean、decodeQuest(raw: string | null): QuestState、readQuest(storage: Pick<Storage,"getItem">): QuestState、writeQuest(storage: Pick<Storage,"setItem">,state: QuestState): boolean。
QuestEvent={type: "COLLECT" | "INSTALL";moduleId: ModuleId} | {type: "REPAIR_CELL" | "PLACE_ON_RACK" | "HELP_SEEN" | "RESET"}。存档 key=tuvis-world-v1，JSON 外层 schemaVersion=1、quest。

- [x] **Step 1: 写失败测试。** 三种模块的六种领取顺序都可完成流程；重复领取长度不变；未领取能源匣时 REPAIR_CELL 无效；未集齐/未维修时 INSTALL 无效；三件安装后 PLACE_ON_RACK 才完成。断言：
~~~ts
expect(isComplete(INITIAL_QUEST)).toBe(false);
expect(questReducer(INITIAL_QUEST,{type:"INSTALL",moduleId:"cell"})).toEqual(INITIAL_QUEST);
expect(decodeQuest("{bad")).toEqual(INITIAL_QUEST);
expect(readQuest({getItem(){throw Error("denied");}})).toEqual(INITIAL_QUEST);
~~~
构造格式正确但未领取模块就 installed/placed 的存档，断言清理非法安装与陈列状态；RESET 恢复新局且不删除其他站点存储。
- [x] **Step 2: Run** pnpm exec vitest run src/world/quest/quest.test.ts；Expected FAIL。
- [x] **Step 3: 实现接口与事件。** 去重且只接受已知 ModuleId；canAssemble 为集齐三件且能源匣修好；isComplete 为三件安装且已陈列。read/write 捕获存储异常；write 失败返回 false，不阻断游戏。
- [x] **Step 4: Run** pnpm exec vitest run src/world/quest/quest.test.ts；Expected PASS，六领取顺序、非法状态、损坏数据、受限存储均覆盖。
- [x] **Step 5: Commit** 本任务文件，message: feat(world): add assembly quest and resilient saves。

### Task 5: 工坊显示、移动与唯一到达事件

**Files:** Create src/world/scene/Sprite.tsx、src/world/scene/SceneView.tsx、src/world/scene/runtimeStore.ts、src/world/scene/useSceneLoop.ts、src/world/scene/motion.test.ts；Modify src/world/scene/navigation.ts、src/pages/WorkshopPage.tsx、src/world/world.css。
**Interfaces:** Consumes 前面任务的导航与 QuestState；Produces Sprite(props: SpriteProps): React.JSX.Element、SceneView({bundle}: {bundle: WorldBundle}): React.JSX.Element、createRuntimeStore(scene: SceneDefinition,initialQuest?: QuestState): StoreApi<RuntimeState>、advanceMotion(motion: MotionState,elapsedMs: number,scene: SceneDefinition): {motion: MotionState;arrived?: {token:number;hotspotId?:string}}。
SpriteProps={manifest: WorldManifest;frameId: string;position: Point;width?: number;height?: number;anchor?: Point;zIndex: number}。RuntimeState 包含 motion: MotionState、quest: QuestState、overlay: Overlay、pose: Direction | "sit" | "coffee" | "display"、latestRequestId: number，以及下列 store 方法；initialQuest默认INITIAL_QUEST，StoreApi来自Zustand。
MotionState={position: Point;direction: Direction;target: null | {token:number;path: Point[];hotspotId?:string}}。store 提供 requestMove(point: Point,hotspotId?: string): void、cancelMovement(): void、setOverlay(overlay: Overlay): void、arrive(token:number,hotspotId?:string): void、dispatchQuest(event: QuestEvent): void；dispatchQuest仅通过questReducer更新任务。

- [x] **Step 1: 写失败测试。** A 目标被 B 替换后 arrive(A.token) 不触发物件；setOverlay 后移动停止；大 elapsedMs=5000 不越过合法路径；最后一帧仅触发一次 arrived。Sprite 用包内 sw 的 sourceRect，脚底锚点在切换 nw/se 时保持给定位置。
- [x] **Step 2: Run** pnpm exec vitest run src/world/scene/motion.test.ts；Expected FAIL。
- [x] **Step 3: 实现帧循环与图层。** elapsedMs 最高按100ms推进，速度190px/s；每一段检查合法性。到达 token 必须等于当前请求才执行。Sprite 用 SVG viewBox + image 显示 sourceRect，按 anchor 定位；家具与角色按地面 depth 稳定排序。只用 v1 包中当前四向/动作帧；脚下投影由 CSS/SVG 绘制。页面进入时调用 core preload，资源就绪再显示可操作场景。
- [x] **Step 4: Run** pnpm exec vitest run src/world/scene/motion.test.ts src/world/scene/navigation.test.ts；Expected PASS。与包内 standing、occlusion 预览对照：脚底、朝向、家具前后正确。
- [x] **Step 5: Commit** 本任务明确文件，message: feat(world): render workshop and move to clicked targets。

### Task 6: 物件内容、家中出口与日常姿态

**Files:** Create src/world/scene/interaction.ts、src/world/scene/interaction.test.ts、src/world/quest/QuestBar.tsx、src/world/quest/WorkbenchPanel.tsx；Modify src/world/scene/runtimeStore.ts、src/world/scene/SceneView.tsx、src/world/content/ContentPanel.tsx。
**Interfaces:** Produces resolveHotspot(id: string,bundle: WorldBundle,quest: QuestState): InteractionResult。
InteractionResult={overlay: Overlay;questEvent?: QuestEvent;pose?: "sit"|"coffee"|"display";message?: string}。使用 scene.hotspots.id/kind/contentId/moduleId，不能根据中文名称分支。
WorkbenchPanel({bundle,quest,mode,onEvent,onOpenAssembly,onClose}: {bundle: WorldBundle;quest: QuestState;mode: "task" | "repair";onEvent(event: QuestEvent): void;onOpenAssembly(): void;onClose(): void}): React.JSX.Element。SceneView将内容类overlay交给ContentPanel，将task/repair交给WorkbenchPanel，将assembly交给Task7的AssemblyPanel；开始组装回调只切换overlay。

- [x] **Step 1: 写失败测试。** toolbox 返回 sight 领取事件与图鉴；posters/window 分别返回 cell/emitter 与正确世界内容；door-hall/door-side 返回门说明，nextSceneId 不启动新场景。chair 选择 sit；新移动取消日常姿态；书架与首页使用同一 stories 数据。工作台缺模块显示 task，集齐未维修显示 repair，维修后显示 assembly。
- [x] **Step 2: Run** pnpm exec vitest run src/world/scene/interaction.test.ts；Expected FAIL。
- [x] **Step 3: 实现上列结果。** 只有合法到达事件调用 resolveHotspot。日常姿态帧与高度取 scene.actions；持杯/展示的脚底保持当前 hotspot.approach。坐姿按 sourceRect 把 seatAnchorSource 转成归一化 anchor，绘制于 seatPosition，深度取 scene.actions.sit.depth；导航脚底仍保持椅子靠近点，起身后从该点移动。归一化公式为 [(sx-cropX)/cropWidth,(sy-cropY)/cropHeight]，不增加头部旋转。重玩、说明和长文使用可聚焦按钮；面板关闭还原触发焦点。QuestBar 显示三个模块与当前操作。
装备架在三模块安装完成后发出 PLACE_ON_RACK，并进入 display 姿态；完成后仍可再次展示。任务未完成时显示任务提示。
- [x] **Step 4: Run** pnpm exec vitest run src/world/scene/interaction.test.ts src/world/landing/WorldLanding.test.tsx；Expected PASS；静态预览对照 sit、coffee、display，确认头/身体朝向一致。
- [x] **Step 5: Commit** 本任务文件，message: feat(world): connect workshop objects and daily actions。

### Task 7: 能源匣维修与双输入组装

**Files:** Create src/world/quest/AssemblyPanel.tsx、src/world/quest/AssemblyPanel.test.tsx；Modify src/world/quest/WorkbenchPanel.tsx、src/world/scene/runtimeStore.ts、src/world/world.css。
**Interfaces:** AssemblyPanel({bundle,quest,onEvent,onClose}: {bundle: WorldBundle;quest: QuestState;onEvent(event: QuestEvent): void;onClose(): void})；WorkbenchPanel 使用同一 QuestEvent。组装 stage=[1100,720]，插槽和 snapRadius 读取 scene.assembly。

- [x] **Step 1: 写失败测试。** 点击松动接口并执行“检查”发出 REPAIR_CELL；依次选择零件与对应插槽发出 INSTALL；错误插槽不发事件。模拟不同显示尺寸下拖到同一 socket 坐标均成功；pointercancel/失焦回托盘、不消耗模块。三个安装后显示 complete 图片；关闭/返回房间不发 PLACE_ON_RACK，该事件仅由 Task 6 到达装备架触发。
- [x] **Step 2: Run** pnpm exec vitest run src/world/quest/AssemblyPanel.test.tsx；Expected FAIL。
- [x] **Step 3: 实现面板。** 维修示意用SVG画接口和两种状态；打开组装时先调用preloadAssets加载gunBody、gunEmitter、gunSight、gunCell、gunComplete，失败可重试且保留任务。组装用Sprite与实际stage矩形坐标换算，Pointer Events/setPointerCapture，拖拽与点击走同一安装判断。归位后过渡至gunComplete；放大舞台时重新取得显示矩形。Esc/关闭保留已安装状态、取消拖拽。
- [x] **Step 4: Run** pnpm exec vitest run src/world/quest/AssemblyPanel.test.tsx src/world/quest/quest.test.ts；Expected PASS；对照 tuvis-world/05_handoff/v1/qa/assembly-layout.jpg，最终成品使用完整图。
- [x] **Step 5: Commit** 本任务文件，message: feat(world): complete repair and Bug Buster assembly flow。

### Task 8: 加载重试、存档集成与完整流程

**Files:** Create src/world/WorkshopFlow.test.tsx；Modify src/pages/WorkshopPage.tsx、src/world/scene/runtimeStore.ts、src/world/scene/useSceneLoop.ts、src/world/assets/loadWorldData.ts、src/world/content/ContentPanel.tsx。
**Interfaces:** 延续前任务接口；页面保存/恢复通过 readQuest/writeQuest；运行 store 使用 getState 的当前目标与 quest，不在动画回调缓存旧状态。

- [x] **Step 1: 写集成失败测试。** mocked bundle 和图片加载器下跑一次“领取三件→维修→安装→陈列→刷新恢复→重玩”。再覆盖一次图片失败后重试成功、storage.setItem 抛错仍可完成、打开面板后点背景不移动、blur 后 target 清空、Esc 关闭并回焦点。
- [x] **Step 2: Run** pnpm exec vitest run src/world/WorkshopFlow.test.tsx；Expected FAIL。
- [x] **Step 3: 集成加载/运行/恢复状态。** 页面明确loading/error/ready，错误重试创建新请求并忽略旧结果；核心图片未就绪时不启动循环。首次ready显示两条操作说明，helpSeen与主线一起保存；仅quest状态变更时写存储，不在移动帧中写入。重玩先确认，只清本专区存档。英语路径保留英文控件与中文内容说明。
- [x] **Step 4: Run** pnpm exec vitest run src/world/WorkshopFlow.test.tsx；pnpm test；pnpm exec tsc --noEmit；Expected PASS。
- [x] **Step 5: Commit** 集成与测试文件，message: feat(world): harden workshop loading and progression。

### Task 9: 静态构建、桌面验证与交付记录

**Files:** Create docs/qa/tuvis-world-desktop.md；Modify README.md 的专区入口说明。
**Interfaces:** Consumes 完成的两页、所有测试与导入资源；Produces dist、验收记录、未覆盖平台清单；保持现站发布规则。

- [x] **Step 1: 写验收记录框架。** 按需求9.1～9.3列出主页六模块、四条路由刷新、导航、12物件、两扇门、碰撞绕行、遮挡、三模块任意顺序、拖/点击、存档/重玩、失败重试与返回主页。记录真实 OS、浏览器版本、窗口、DPR/缩放和结果；未实测的系统明确标注。
- [x] **Step 2: Run** node tuvis-world/05_handoff/v1/tools/verify-pack.mjs；node tuvis-world/05_handoff/v1/tools/audit-handoff.mjs；pnpm test；pnpm exec tsc --noEmit；pnpm build；Expected 全部 exit0、生成 dist。注意 build 包含站点既有同步，检查同步产生的差异，不把无关同步数据混入功能提交。
- [x] **Step 3: Run** pnpm preview --host 0.0.0.0；浏览器访问 /tuvis-website/zh/world 与 /tuvis-website/zh/world/workshop，刷新并切换 /en 对应路径。检查1280×720与较大桌面、Windows125%/150%和Mac Retina。云端可验证可用浏览器引擎；真实 OS 未覆盖项保留给实机验收，不写成已通过。
- [x] **Step 4: 填写实际验证结果。** 确认所有游戏资源来自站点，过程中无生图/模型 API 或新运行服务；图集裁切、头身朝向、两门落地住宅、家具遮挡与 QA 图一致。构建/导航失败先修复再继续。
- [x] **Step 5: Commit** README.md 和验收记录，message: docs(world): record desktop acceptance and deployment readiness。提交可评审结果；用户按既有 v* 流程发布，发布后复核两条深链接与资源状态。

## Coverage and Handoff

| 需求 | 负责任务 |
|---|---|
| 专题六模块、同一工坊入口、图文与语言 | 1、2 |
| 落地住宅、门、斜俯视与外围 | 1 的资源，5、6、9 |
| 点击操作、导航、碰撞、缩放 | 3、5、8 |
| 日常姿态、前后遮挡、长文面板 | 5、6 |
| 三模块、维修、组装、陈列、重玩 | 4、6、7、8 |
| 加载、存档、失焦、失败恢复 | 1、4、5、8 |
| 静态发布、桌面浏览器、运行依赖 | 1、9 |

本计划自查覆盖了需求全部章节、五类 Review Focus、跨任务类型/事件名和输入数值。资源包校验不等于网页通过验收；本地静态摆放检查不等于云端实现或双系统运行已完成。
请先审阅计划；保持用户已指定的云端执行方式，批准后按任务推进，不重新要求选择本地实现方式。
