# 兔维斯世界：专题页与可玩工坊

## 概要

在现有官网中新增 `/zh/world`、`/en/world` 专题页与 `/zh/world/workshop`、`/en/world/workshop` 可玩工坊：六段图文、四装备图鉴、三篇故事档案、固定斜俯视房间、12 个热点、点击/拖拽组装与 Bug Buster 主线。所有素材来自 `tuvis-world/05_handoff/v1/` 资源包，运行时不依赖生图或模型 API。

本 PR 在既有实现上完成融合收口：修复组装插槽点击 P0、补齐浏览器验收管道与边界测试、把界面文案迁入 i18n，并更新验收记录与 PR 说明。

## 提交区块

| 区块 | 内容 |
|---|---|
| C0 基线 | 复测安装、测试（15 文件 / 129 测试）、tsc、build、资源包校验，记录融合基线 |
| C1 点击 P0 | 选中零件时给组装舞台加 `has-selection`，插槽 z-index 25 高于零件 20；新增错插槽与类名代理测试 |
| C2a 只读探针 | `scripts/qa-cdp.mjs`：四路由 DOM 探针、失败请求/console error/外部请求收集；ws 优先 `.pnpm`，Node 22 全局 WebSocket 兜底 |
| C2b 交互驱动 | `scripts/qa-world-interactions.mjs`：轮询到达、真实鼠标事件、`elementFromPoint`、localStorage 重置、双视口、截图；覆盖主链路/取消/双输入/缩放/深链接 |
| C3 i18n | 面板标题、状态、按钮、错误、帮助与专题区块标签迁入 i18n；`/en` 界面英文，世界正文保持中文；中英 parity |
| C4 边界测试 | 取消≠到达、方向帧与脚底锚点、actorHeight、焦点归还、舞台缩放接线；组装点击语义已在 C1 覆盖 |
| C5 收口 | 验收记录、截图索引、README、偏差记录、PR 说明、全仓命名/沙箱路径清理 |
| C6 终验 | 英文界面剩余任务栏动作/工作台任务说明/标题/CTA/重玩对话框/组装帮助迁入 i18n；只读探针补 CTA、hero tag、H2、返回链接与重玩按钮断言；QA 截图改为面板关闭、角色到达、完成文案出现后捕获；取消探针按预计到达时间轮询 |
| 本地启停 | `start-dev.command` / `stop-dev.command` 双击启停；`scripts/dev-start.sh` / `dev-stop.sh` 命令行等价；自动打开 `/zh/world`，PID/日志写 `.dev-server.pid` / `.dev-server.log` |
| 背景音乐 | 工坊背景音乐（Sappheiros – Universe，CC BY 3.0，经 BreakingCopyright）+ 右上角开关 + 帮助面板署名；静音状态持久化 |

## 行为承诺

- 点击地面移动；点击物件先走到 approach 再互动；新目标取消旧到达事件。
- 12 个热点全部可达；路径逐段校验，不穿墙/家具；角色按脚底 y 排序并带投影。
- 面板打开暂停移动，关闭后焦点回到触发按钮；窗口失焦停止且不误触互动。
- Bug Buster 主线三模块任意顺序；维修后可拖拽或点击组装；错误插槽不消耗；装备架陈列；存档可恢复、可重玩、损坏安全。
- 组装特写中，选中零件后插槽位于零件之上，点击命中由真实浏览器 `elementFromPoint` 验证。
- `/zh`、`/en` 四条深链接直接打开与刷新均可用；英文界面按实际探针覆盖章节角标、H2、CTA、hero tag、返回链接、重玩按钮与任务栏/帮助标签，世界正文与模块名保持中文并显示语言说明。

## 测试对比

| 项 | 基线 `a9eeea6` / `3ba6e65` | 本 PR |
|---|---|---|
| 测试文件 | 15 | 15 |
| 测试数 | 129（42 基线 + 87 世界） | 136（42 基线 + 94 世界） |
| `tsc --noEmit` | exit 0 | exit 0 |
| `pnpm build` | exit 0 | exit 0 |
| 资源包校验 | PASS | PASS |
| 浏览器只读探针 | 无 | 56/56 检查通过 |
| 浏览器交互驱动 | 无 | 54/54 probe 通过 |

基线 6 个测试文件零改动：

```text
git diff --stat a9eeea6..HEAD -- \
  scripts/split-changelog.test.mjs src/demo/ledgerData.test.ts \
  src/demo/player.test.ts src/i18n/parity.test.ts \
  src/tokens.test.ts src/utils/download.test.ts
（空输出）
```

## 评审要点

1. **C1 点击 P0**：`.world-assembly-stage.has-selection .world-assembly-socket { z-index: 25; }` 与零件 20、拖拽 40 的层级关系；jsdom 只守类名，真实命中由 C2b 的 `elementFromPoint` 守。
2. **i18n 边界**：界面 chrome 走 i18n，任务/剧情正文留内容包；组件不再读取 `content.ui.help/helpLines`；`en` 探针实际断言 CTA、hero tag、H2、返回链接与重玩按钮，工作台任务说明、组装帮助等面板内文案由交互 QA 与人工检查覆盖；`i18n/parity.test.ts` 保持中英键集一致（397 键）。
3. **测试判别性**：新增用例分别针对“取消后旧 token 仍到达”“固定朝向帧/脚底漂移”“动作姿态复用站立高度”“面板关闭不还焦点”“场景使用固定 rect”等错误实现。
4. **浏览器证据**：截图在 `docs/qa/screenshots/`，验收细节与偏差在 `docs/qa/tuvis-world-desktop.md`。

## 未实测项

Windows Chrome/Edge、macOS 有头 Chrome、Safari、真实系统显示缩放、真实 OS 失焦、真实断网、触屏、纯键盘完整通关、长时性能。详见验收文档第 6 节。

## 复验

```bash
pnpm install --frozen-lockfile
pnpm test && pnpm exec tsc --noEmit && pnpm build
pnpm preview --host 127.0.0.1 --port 4173
# 另起带 --remote-debugging-port=9222 的 Chrome 后：
node scripts/qa-cdp.mjs
node scripts/qa-world-interactions.mjs
```

macOS 人工验收也可直接双击 `start-dev.command` 启动、`stop-dev.command` 关闭；启动后自动打开 `http://127.0.0.1:5173/tuvis-website/zh/world`。
