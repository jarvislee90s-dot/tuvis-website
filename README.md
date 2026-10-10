# tuvis-website

兔维斯（Tuvis）官网与品牌资产仓库。

## 结构

```
tuvis-website/
├── SPEC.md           # 建站规格（v1.3：需求/决策记录/配色/实施 plan）
├── legacy/           # 旧草稿归档（index.html 单页草稿 + assets，candidate-34 时期产物）
└── brand/
    ├── BRAND.md      # 品牌决策记录（命名/四关/域名；§3 candidate-34 章节为历史稿）
    ├── final/        # ★ 最终视觉唯一依据：角色设定图 / 品牌系统 v1.0 / 赛博兔侠立绘
    │   ├── extracted/  # 工作素材 + **定稿应用图标 13（深）/14（浅）**
    │   └── logo/       # 图标定稿说明 + 配色规格 COLOR-SPEC + versions/ 全迭代归档（01~06）
    └── archive/      # 旧方案素材归档（mascot-gen 全量、旧 logo/线稿、生成提示词录 + zip）
```

## 内容同步

官网两份内容数据在 dev / build 启动时由 `scripts/split-changelog.mjs` 自动同步（也可手动 `pnpm sync:changelog`）：

| 数据源（tuvis 仓库） | 产物 |
|---|---|
| `CHANGELOG.md` | `src/content/changelog.json`（/changelog 页） |
| `docs/capabilities.json` | `src/content/capabilities.json`（首页兼容矩阵，过结构闸门后落盘） |

- 默认走 `api.github.com` contents 通道拉双源（base64 解码，Windows schannel 偶发失败自动重试 3 次）。
- `pnpm sync:changelog -- --in <本地 CHANGELOG.md>`：changelog 走本地文件（离线改稿/链路排查），capabilities 仍走网络。
- `pnpm sync:changelog -- --offline`：全跳网络，保留现有产物（频繁重启 / CI 离线场景）。
- 失败保底语义：任一源拉取或校验失败 → 仅警告并保留上次同步产物，退出码 0，dev / build 不被打断（产物均入 git 作离线兜底）。
- 限流提示：api.github.com 未认证限额 60 次/小时，每次 dev / build 消耗 2 次；高频重启请用 `--offline`。

## 预览旧草稿（可选）

```bash
cd tuvis-website/legacy
python -m http.server 8080
# 打开 http://localhost:8080
```

## 上线计划

- 渠道：GitHub Pages 先行（`jarvislee90s-dot.github.io/tuvis-website`），tuvis.app 购买后绑自定义域
- 详细规格与分期：见 `SPEC.md`（v1.2）

## 主形象速览（2026-10-10 定稿：生图路线 v3，无框整块渐变玻璃目镜）

| 形态 | 文件 |
|---|---|
| 应用图标 · 深色（定稿） | `brand/final/extracted/13-appicon-dark.png` @837 |
| 应用图标 · 浅色（定稿） | `brand/final/extracted/14-appicon-light.png` @874 |
| Hero 主立绘（透明底） | `brand/final/extracted/21-hero-cutout.png` |
| 状态三态立绘（绿/黄/红） | `brand/final/extracted/10~12-state-*.png` |
| 托盘胡萝卜三态 | `brand/final/extracted/15~17-tray-*.png` |
| 品牌系统规范 | `brand/final/Tuvis Mascot & Brand System v1.0.txt` |
| 图标配色规格 | `brand/final/logo/versions/05-aigen/COLOR-SPEC.md` |
