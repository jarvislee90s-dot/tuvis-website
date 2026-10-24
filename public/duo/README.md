# /duo/ — iPhone Duo 开合演示（iframe 发布副本）

`index.html` 是 `docs/design/duo-unfold-lab-frame-study.html` 的**逐字节副本**，
由首页「产品形态」区以 iframe 嵌入（`src="/duo/index.html?embed=1&lang=zh|en"`；
**必须用显式文件路径**——Vite dev 不把目录式 `/duo/` 解析到本文件，会落进 SPA
回退渲染成首页）。

- 唯一编辑源是 `docs/design/` 里的原文件；改完原文件后必须重新复制到本目录，
  两个文件不允许各自演化。
- 模式由查询参数驱动，无需单独维护分支：
  - `?embed=1` — iframe 变体：拆 lab 外壳，状态 chip 与铰链提示合并一行，去分辨率小字。
  - `?video=1` — 离线渲染变体（`scripts/render-duo-unfold.mjs`）：再拆交互控件，
    顶部出标题、底部出商标注记，用于生成宣传视频/动图。
  - 两者都可与 `?lang=zh|en`、`?state=open`、`?freeze=<0..1>` 组合。
