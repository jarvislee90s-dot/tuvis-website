# 兔维斯 · Logo/图标替换文件清单

> 扫描时间：2026-10-10。文本层改名（productName/identifier/package.json/Cargo.toml/i18n/窗口标题）✅ 已全部完成，本清单只覆盖图标与视觉层。
> 状态：☐ 待办 / ✅ 已完成

## A. 应用图标（桌面端，一次生成全套）

- ☐ **`src-tauri/icons/`**（16 个文件：32x32.png、128x128@2x.png、icon.icns、icon.ico、Square*Logo.png 等）
  - 现状：全部是 Tauri 默认图标
  - 替换法：准备一张 1024×1024 的**扁平 logo** 源图（注意：不要直接用 3D 渲染图，32px 下会糊），然后 `pnpm tauri icon 源图.png` 一条命令自动生成全套
  - 替换后自动生效的下游（无需单独改）：安装包/exe/dmg 图标、**系统托盘图标**（`system_tray.rs:253` 用的是 `default_window_icon()`）

## B. 桌面端 Web 层

- ✅ **`index.html:5`**：favicon 已从 `/vite.svg`（原文件根本不存在，一直 404 的死链）改为 **`/tuvis-icon.png`**（64px 深砖定稿版，`public/tuvis-icon.png`）
  - （第 7 行 `<title>Tuvis</title>` 已正确，不用动）
- ✅ **`mobile.html`**：标题改 **`Tuvis 远程`**，补了 favicon 逻辑（经 PWA manifest 承载）
- ✅ **`public-mobile/manifest.json`**（原 manifest-mam.json 已改名，mobile.html 引用同步）：`name`="Tuvis 远程"、`short_name`="Tuvis"、`icons` 换成 **512px 深砖定稿版**（`public-mobile/icon-mobile.png` 已替换）
  - ℹ️ 对外文案注意："兔维斯"仍保留为中文口语名（i18n 文案里继续用），凡是"软件名"字段一律 Tuvis

## C. 官网（tuvis-website 仓库）

- ☐ **`tuvis-website/assets/favicon.svg`**：现在是旧线稿徽章占位 → 替换为 `brand/tuvis-logo-flat.svg`
- ✅ hero/状态灯三态图：已换成最终形象（candidate-34 系列）
- ✅ 视频位讲解图：已就位（style-7-uscartoon-b）

## D. 应用内组件

- ✅ **`src/components/icons/BrandIcons.tsx`**：`TuvisLogoMark` 组件已加入（未提交，随品牌提交一起）
- ☐ **渲染位（新增而非替换）**：目前 UI 没有任何地方渲染产品 logo——建议接：侧边栏顶部（原 `<TuvisLogoMark className="w-6 h-6" />`）、关于页、更新对话框
- ℹ️ `src/lib/agentBadge.tsx`（Claude/OpenAI/OpenCode/Kimi 图标）是**别家产品的图标，不要动**

## E. 一并提交的遗留

- ☐ `docs/brand/` 5 个文件的删除（品牌资产已迁 `tuvis-website/brand/`）——`git add -A` 随品牌提交收口
- ☐ `src/assets/` 的 react.svg/tauri.svg/vite.svg：脚手架残留，确认无引用后可删

## 红线（不要动）

- `~/.mam/` 数据目录、`mam.db`：改名后继续沿用，用户数据不失联
- Tauri updater 签名密钥：换 key 会断存量用户升级
