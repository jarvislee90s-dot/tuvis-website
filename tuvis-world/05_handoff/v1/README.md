# Tuvis World 云端执行资源包 v1

本包与已批准的《网站专区与工坊需求说明书》及配套 implementation plan 一起使用。目标是先搭建图文专题页，再接入一个斜俯视工坊体验。云端 Agent 可以识图，但本流程不要求生成图片或模型。

## 路径基准
正文文件路径均从项目根目录 tuvis-website 解析，所有命令从该目录执行。manifest.assets[].path、scenePath、contentPath 在 JSON 中相对本包根目录；项目文件路径为 tuvis-world/05_handoff/v1/ + 该相对值，发布文件路径为 public/world/v1/ + 该相对值。网页 /zh/world 等为路由，不是文件路径。

## 开始方式
1. 若上传完整项目目录，直接以 tuvis-website 为项目根开始；若使用交接 ZIP，则在已有网站仓库根目录解包，保留相对目录结构。
2. 阅读 docs/superpowers/specs/2026-10-19-tuvis-world-website-requirements.md。
3. 阅读 docs/superpowers/plans/2026-10-19-tuvis-world-website-workshop.md。
4. 执行 node tuvis-world/05_handoff/v1/tools/verify-pack.mjs 和 node tuvis-world/05_handoff/v1/tools/audit-handoff.mjs。
5. 查看 tuvis-world/05_handoff/v1/qa/contact-sheet.jpg、tuvis-world/05_handoff/v1/qa/navigation-overlay.jpg、tuvis-world/05_handoff/v1/qa/workshop-occlusion-behind.jpg、tuvis-world/05_handoff/v1/qa/workshop-occlusion-front.jpg。
6. 用户审阅计划后，由已指定的云端 Agent 按 superpowers:executing-plans 逐任务实施。

资源包不是网站源代码仓库的替代品；它以现有 tuvis-website 项目为基础。Node 与 pnpm 准备、资源导入和构建均已列入 Task 1，不需要访客安装这些开发工具。

## 文件用途
下表列出项目根目录相对位置：
- tuvis-world/05_handoff/v1/manifest.json：17 张运行/展示图片，15 个角色/家具/装备裁切帧，以及核心资源组。
- tuvis-world/05_handoff/v1/scene.json：1536×1024 场景、12 个热点、18 个连通导航节点、家具碰撞与摆放、动作停靠和装备特写坐标。
- tuvis-world/05_handoff/v1/content/world.zh.json：人物、四装备、世界介绍、故事简介、门去向、任务与操作提示文案。
- tuvis-world/05_handoff/v1/assets/：实际需要的 PNG 文件，含本次补齐的落地住宅工坊、两扇门、修正四向角色、日常姿态和独立家具。
- tuvis-world/05_handoff/v1/prompts/：本次新增图片的生成工具、来源参考与完整提示词。
- tuvis-world/05_handoff/v1/qa/：按本包数据绘制的静态摆放、姿态、遮挡、导航和组装预览。
- tuvis-world/05_handoff/v1/checksums.json：包内文件 SHA-256 清单。
- tuvis-world/05_handoff/v1/tools/verify-pack.mjs：只依赖 Node 标准库的资源校验器。
- tuvis-world/05_handoff/v1/tools/audit-handoff.mjs：需求/计划的素材映射、关键约定和路径复核。

读取职责：需求书规定产品行为，计划规定代码接口和检查，manifest/scene规定素材定位；tuvis-world/05_handoff/v1/prompts/只记录图片生成过程，不作为新的交互需求。

## 图片与坐标契约
manifest.assets 中的 path 相对本包根目录；发布时保持结构导入到 public/world/v1。运行 URL 通过现站 BASE_URL + world/v1/ + path 生成。

frames.sourceRect 为 [x,y,width,height]，单位是原图像素；anchor 为裁切范围内0～1坐标。实际图集并非严格等分，必须使用给定裁切。用 SVG viewBox 或等价 CSS 方式显示，不需要云端额外切图软件。

所有场景位置是1536×1024图片坐标。角色 position 表示脚底锚点，家具 position 对齐其给定锚点；按地面 depth 排序。坐姿把 scene.actions.sit.seatAnchorSource 转成裁切后的归一化锚点并对齐 seatPosition，绘制深度取 scene.actions.sit.depth；导航脚底保留在椅子靠近点，起身后从该点继续走。保持头部、躯干、腿方向一致。

walkable 已为脚底中心留出外围安全余量；内部 obstacles 额外考虑 footRadius=12。nav.edges 连接已核对的通道节点；产品实现还应对临时起终点连接和每次移动进行几何检查，不能直接直线穿过家具。

两门的 nextSceneId 是后续连接位。本期点击门显示 content.doors 中的说明，留在工坊。房间属于落地住宅，外部庭院与家中走廊用于呈现空间延续。

## 表现与实现分界
四向和日常姿态为静态图片，移动用位置更新与轻微起伏表现；不承诺逐帧步态。装备模块为独立生成的平面素材，归位后切换完整成品图。维修示意、高亮、脚下投影、按钮和面板由代码绘制。

资源文件、引用和静态摆放已检查；真正的点击移动、碰撞推进、任务状态、存档、浏览器兼容与部署结果仍由计划中的任务实现和验收。新渲染可用于本轮审阅，不代表已经发布网站。

## 参考画面
静态专题首页使用 tuvis-world/05_handoff/v1/assets/landing/ 素材与 tuvis-world/05_handoff/v1/content/world.zh.json，按需求的 W-01～W-06 组织。
场内人物使用 tuvis-world/05_handoff/v1/assets/characters/ 中图集的裁切帧；tuvis-world/05_handoff/v1/assets/landing/hero.png 用于首页与档案。17张图片的逐项位置与用法在计划的 Material Locations and Usage 表中。
本包已处理用户指出的头部与躯干朝向不一致问题：四向保持整体朝向，坐姿为头身同向的背侧面。
