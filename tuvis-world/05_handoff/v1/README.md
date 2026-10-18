# Tuvis World 云端执行资源包 v1

本包与已批准的《网站专区与工坊需求说明书》及配套 implementation plan 一起使用。目标是先搭建图文专题页，再接入一个斜俯视工坊体验。云端 Agent 可以识图，但本流程不要求生成图片或模型。

## 开始方式
1. 在 tuvis-website 仓库根目录解包交接 ZIP，保留相对目录结构。
2. 阅读 docs/superpowers/specs/2026-10-19-tuvis-world-website-requirements.md。
3. 阅读 docs/superpowers/plans/2026-10-19-tuvis-world-website-workshop.md。
4. 执行 node tuvis-world/05_handoff/v1/tools/verify-pack.mjs。
5. 查看 qa/contact-sheet.jpg、qa/navigation-overlay.jpg、qa/workshop-occlusion-behind.jpg、qa/workshop-occlusion-front.jpg。
6. 用户审阅计划后，由已指定的云端 Agent 按 superpowers:executing-plans 逐任务实施。

资源包不是网站源代码仓库的替代品；它以现有 tuvis-website 项目为基础。Node 与 pnpm 准备、资源导入和构建均已列入 Task 1，不需要访客安装这些开发工具。

## 文件用途
- manifest.json：17 张运行/展示图片，15 个角色/家具/装备裁切帧，以及核心资源组。
- scene.json：1536×1024 场景、12 个热点、18 个连通导航节点、家具碰撞与摆放、动作停靠和装备特写坐标。
- content/world.zh.json：人物、四装备、世界介绍、故事简介、门去向、任务与操作提示文案。
- assets/：实际需要的 PNG 文件，含本次补齐的落地住宅工坊、两扇门、修正四向角色、日常姿态和独立家具。
- prompts/：本次新增图片的生成工具、来源参考与完整提示词。
- qa/：按本包数据绘制的静态摆放、姿态、遮挡、导航和组装预览。
- checksums.json：包内文件 SHA-256 清单。
- tools/verify-pack.mjs：只依赖 Node 标准库的校验器。

## 图片与坐标契约
manifest.assets 中的 path 相对本包根目录；发布时保持结构导入到 public/world/v1。运行 URL 通过现站 BASE_URL + world/v1/ + path 生成。

frames.sourceRect 为 [x,y,width,height]，单位是原图像素；anchor 为裁切范围内0～1坐标。实际图集并非严格等分，必须使用给定裁切。用 SVG viewBox 或等价 CSS 方式显示，不需要云端额外切图软件。

所有场景位置是1536×1024图片坐标。角色 position 表示脚底锚点，家具 position 对齐其给定锚点；按地面 depth 排序。坐姿按 scene.actions.sit.seatAnchorSource 与 seatPosition 对齐，保持头部、躯干、腿方向一致。

walkable 已为脚底中心留出外围安全余量；内部 obstacles 额外考虑 footRadius=12。nav.edges 连接已核对的通道节点；产品实现还应对临时起终点连接和每次移动进行几何检查，不能直接直线穿过家具。

两门的 nextSceneId 是后续连接位。本期点击门显示 content.doors 中的说明，留在工坊。房间属于落地住宅，外部庭院与家中走廊用于呈现空间延续。

## 表现与实现分界
四向和日常姿态为静态图片，移动用位置更新与轻微起伏表现；不承诺逐帧步态。装备模块为独立生成的平面素材，归位后切换完整成品图。维修示意、高亮、脚下投影、按钮和面板由代码绘制。

资源文件、引用和静态摆放已检查；真正的点击移动、碰撞推进、任务状态、存档、浏览器兼容与部署结果仍由计划中的任务实现和验收。新渲染可用于本轮审阅，不代表已经发布网站。

## 参考画面
静态专题首页使用 landing/ 素材与中文数据，按需求的 W-01～W-06 组织。
场内人物优先使用 characters/ 中图集的裁切帧；不要拿 landing/hero.png 的正面立绘代替斜俯视角色。
本包已处理用户指出的头部与躯干朝向不一致问题：四向保持整体朝向，坐姿为头身同向的背侧面。
