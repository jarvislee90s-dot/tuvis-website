# Tuvis World｜素材缺口与云端交接核对清单

- 日期：2026-10-19（Asia/Shanghai）
- 需求：[已批准的需求说明书](2026-10-19-tuvis-world-website-requirements.md)
- 计划：[云端执行计划](../plans/2026-10-19-tuvis-world-website-workshop.md)
- 资源目录：tuvis-world/05_handoff/v1
- 当前状态：本期所需图片与初始场景数据已备入资源包；计划和新资源交接稿待用户审阅，产品代码尚未实现。

## 路径约定
正文文件路径均相对项目根目录；JSON资源字段仍相对资源包根目录，二者的完整映射见执行计划的 Material Locations and Usage 表。Markdown跳转链接按所在文档解析。

## 1. 素材缺口关闭情况

| 原缺口 | 本包提供 | 当前状态 |
|---|---|---|
| 干净工坊与外围延伸 | tuvis-world/05_handoff/v1/assets/scene/workshop-base.png | 已补齐：家中落地房间、庭院/住宅连接、两处扩展门、无内嵌主角 |
| 四向斜俯视角色 | tuvis-world/05_handoff/v1/assets/characters/tuvis-directions.png | 已补齐：四向图集；头部、躯干和脚同向 |
| 坐姿、持杯、展示装备 | tuvis-world/05_handoff/v1/assets/characters/tuvis-actions.png | 已补齐：修正坐姿头身朝向，图集坐标已标注 |
| 独立家具与遮挡 | tuvis-world/05_handoff/v1/assets/props/workshop-props.png | 已补齐：工作椅、休息椅、矮桌；可分层排序 |
| 场景位置与碰撞/导航 | tuvis-world/05_handoff/v1/scene.json | 已标注：12热点、18连通节点、家具障碍、出生/靠近/动作位置、两门后续连接位 |
| 图片裁切与锚点 | tuvis-world/05_handoff/v1/manifest.json | 已提供：17图片、15裁切帧，图像尺寸、透明通道与哈希 |
| 装备组装资源 | tuvis-world/05_handoff/v1/assets/equipment/ 中主体、三模块、完整图 | 已复用并校验；结束时切换完整图 |
| 专题首页图片 | tuvis-world/05_handoff/v1/assets/landing/ 与 tuvis-world/05_handoff/v1/assets/equipment/family.png | 已复用角色、城市、工坊、居民、两封面和橙色持装备图 |
| 图文与任务文案 | tuvis-world/05_handoff/v1/content/world.zh.json | 已提供人物、装备、世界、故事简介、门去向和操作提示 |
| 云端识图对照 | tuvis-world/05_handoff/v1/qa/ 下摆放、遮挡、导航与组装预览 | 已提供静态检查图 |
| 工具与校验 | tuvis-world/05_handoff/v1/tools/verify-pack.mjs、tuvis-world/05_handoff/v1/checksums.json、tuvis-world/05_handoff/v1/prompts/ | Node标准库即可验证，附完整新增图片提示词与来源 |
| 执行依据 | 已批准需求＋9任务计划 | 文档随交接 ZIP 交付 |

本期没有需要云端 Agent 生成的关键图片或模型。新素材为本轮交接资源，可与计划一起审阅；网页的实际移动、交互与发布效果仍需实现后验证。

## 2. 已完成的检查与其边界

- 图片文件存在、PNG尺寸与manifest一致、透明资源带alpha、SHA-256匹配。
- 图集裁切范围及锚点有效，按实际sourceRect使用。
- 导航节点有效、每条预设边避开家具足迹、全部12个互动点连通。
- 静态摆放检查包含站立、修正坐姿、持杯、持装备、前后遮挡与组装。
- 内容包含四装备、三故事卡片、三任务模块和两门说明。
- 核验脚本不安装依赖，不调用外部服务。
- 这些是资源与数据检查，不等于网页、浏览器或双系统验收已经通过。

## 3. 剩余工作属于执行计划

1. 修复并统一开发工具：Node22、pnpm10.20.0；安装并验证锁文件与既有依赖。
2. 按计划把资源导入public/world/v1，完成类型与加载校验。
3. 先搭图文专题页，再完成工坊导航、碰撞、任务、日常动作与存档。
4. 依据实际渲染结果微调数据中的靠近点、足迹余量与动作停靠；保留同一套已准备图片。
5. 完成静态构建、深链接刷新、资源失败恢复、桌面浏览器和真实系统验收记录。

pnpm10.20.0 已通过 npm registry 元数据核实存在，engines.node >=18.12；原仓库11.13.0 pin在本机报错。版本调整和安装属于计划Task1，本阶段未修改package.json或安装站点依赖。

## 4. 交接方式

交接ZIP在现有tuvis-website仓库根目录解包，包含需求、计划、当前清单、资源包和两张需求参考图。START_HERE.md给出阅读顺序。
资源与文档使用相对路径；执行Agent无需此前聊天或本机目录。复制到站点后的路径继续兼容/tuvis-website/。
已指定由云端Agent按executing-plans实施；先审阅计划，不重新要求选择本地执行方式。
