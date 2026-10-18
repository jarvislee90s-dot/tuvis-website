# Tuvis World｜云端执行交接

本包是现有 tuvis-website 仓库的资料与资源补充。请在仓库根目录解包，保留目录结构；现有网站代码是执行基础。

阅读顺序：
1. docs/superpowers/specs/2026-10-19-tuvis-world-website-requirements.md — 已批准需求。
2. docs/superpowers/specs/2026-10-19-tuvis-world-readiness.md — 素材缺口关闭情况与剩余执行工作。
3. docs/superpowers/plans/2026-10-19-tuvis-world-website-workshop.md — 9个任务，含接口、测试与检查。
4. tuvis-world/05_handoff/v1/README.md — 图片/数据契约与静态QA。

先执行：
~~~bash
node tuvis-world/05_handoff/v1/tools/verify-pack.mjs
~~~
预期输出PASS；随后打开tuvis-world/05_handoff/v1/qa/index.html或查看其中PNG。

执行要求：
- 用户已选择由云端Agent实施；能识图即可，不要求生图/建模。
- 使用superpowers:executing-plans按任务顺序推进；计划审阅后再开始产品代码。
- 先专题图文页，再工坊互动。后者是家中的落地房间，两个门保留未来扩展。
- 当前包内已有所需图片、文案、图集裁切、坐标、碰撞、导航与组装布局。
- Task1统一Node22与可用pnpm版本，再导入素材。不要使用原先11.13.0错误pin直接反复安装。
- 资源验证通过不等于网页验收通过；运行测试、构建并记录实际桌面浏览器验证。
- 发布由用户按既有v*流程触发；不要自行推送或打发布tag。

两张额外参考图放在tuvis-world根与03_exploration，供需求中的图片链接使用。实际运行资源只以05_handoff/v1内的manifest与scene数据为准。
