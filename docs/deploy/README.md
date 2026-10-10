# 上线与自动同步检查单（P15：主线随便推，发版才上线；push 由用户执行）

> 网站远端仓：`https://github.com/jarvislee90s-dot/tuvis-website`（公开）
> 线上地址（Pages 默认）：`https://jarvislee90s-dot.github.io/tuvis-website/`
> 内容真值：更新日志 / 兼容矩阵 / 用户手册全部来自 tuvis 主仓（`jarvislee90s-dot/tuvis`），构建时经 GitHub API 拉取，失败用仓内副本兜底（`src/content/*.json` 与 `public/manual/` 均入 git）。

## 一、首次上线（5 步，约 5 分钟）

1. **推送主线**（WIP 随便推，不会触发部署）：
   ```bash
   git push -u origin main
   ```
2. **开 Pages**：网站仓 → Settings → Pages → Build and deployment → Source 选 **GitHub Actions**。
3. **打首个发版 tag 并推送**（这一步才触发部署）：
   ```bash
   git tag v0.5.6 && git push origin v0.5.6
   ```
   Actions 绿了即线上可访问。以后每次「改好的版本」照此打新 tag（如 v0.5.7）。
4. **冒烟**：访问线上地址，过一遍 首页 / demo / docs / changelog 中英双语 + 深链接刷新（404.html fallback）。
5. **（可选，延后）** 按第三节配 repository_dispatch，让主仓文档更新自动重建线上（代码仍钉最新 tag）。

## 二、部署触发（deploy.yml 已按「发版模型」配好）

| 触发 | 部署的代码 | 用途 |
|---|---|---|
| `git tag vX.Y.Z` 并推送 | 该 tag | **正式发版**——唯一让「版本」升级的方式 |
| 每 6 小时定时 | 最新 v\* tag | 兜底：代码不变，构建时重新拉主仓最新文档 |
| 主仓 repository_dispatch | 最新 v\* tag | 主仓文档一提交就重建（需第三节 PAT） |
| Actions 页手动 Run | 可填 ref，默认最新 v\* tag | 想立刻重发/重拉时的手动按钮 |
| ~~push main~~ | **不部署** | 主线随便推 WIP，只存档 |

**发布 = 两条命令**：
```bash
git push origin main        # 平时：随便推，不上线
git tag v0.5.7 && git push origin v0.5.7   # 发版：才更新线上
```
注意：tag 要打在「部署 workflow 已存在的提交」上（workflow 文件随 tag 走）——先把本次的 workflow 改动推上 main，再打 tag。

## 三、主仓实时触发（一次性配置，约 3 分钟）

1. 造 PAT：GitHub → Settings → Developer settings → Fine-grained tokens → Generate：
   - Repository access：**only select** `jarvislee90s-dot/tuvis-website`
   - Permissions → Actions：**Read and write**（其余全空）
2. 存进主仓：`jarvislee90s-dot/tuvis` → Settings → Secrets and variables → Actions → New secret：
   - Name：`SITE_DISPATCH_PAT`，Value：刚才的 token
3. 装触发器：把本仓 `docs/deploy/tuvis-repo-dispatch.yml` 复制到主仓 `.github/workflows/notify-website.yml`，提交。

之后：主仓 main 的 `docs/user-manual/**`、`CHANGELOG.md`、`docs/capabilities.json` 一有推送 → 网站仓用「最新 tag 代码 + 最新主仓文档」自动重建部署。

## 四、内容维护口径（只需维护主仓一处）

| 内容 | 主仓真值 | 网站消费 |
|---|---|---|
| 更新日志 | `CHANGELOG.md` | 构建时切分为 `src/content/changelog.json`；Hero 徽章版本号同源 |
| 兼容矩阵 | `docs/capabilities.json`（网站仓内副本已落盘：`src/content/capabilities.json`，含 2026-10-12 列序与 OpenClaw 修正；主仓侧以 `docs/design/p11-ref/capabilities.for-tuvis.json` 为准复制提交后，构建同步自动切换主仓真值） | 构建时拉取覆写 `src/content/capabilities.json` |
| 用户手册 | `docs/user-manual/{zh,en,img}` | 构建时整棵同步到 `public/manual/` |

## 五、本地命令与同步节奏（同步与起服务解耦）

| 命令 | 网络 | 用途 |
|---|---|---|
| `pnpm dev`（local-dev.bat） | **零网络，秒开** | 日常起服务：直接用仓内已提交的副本（manual / changelog / 矩阵都在 git 里） |
| `pnpm dev:sync` | 先同步（15s 预算）再起 | 想带着主仓最新文档起服务时用 |
| `pnpm sync` | 手动同步，不起服务 | 「我现在就想拉最新」——失败自动用仓内副本，不报错 |
| `pnpm build` | 同步 + 构建 | 与 Actions 云端构建同一条命令，本地仅预览/验证 |

**部署的是哪个包？** 你不需要手动打包。触发部署后，GitHub Actions 在云端执行 `pnpm build`（云端网络快，同步顺带完成）产出 `dist/`，自动发布到 GitHub Pages——`dist/` 永远只在云端生成，本地 build 仅作预览/验证。

**同步节奏（三层）：**

1. **发版 tag** → 部署时自动拉主仓最新文档；
2. **每 6 小时定时** → 不发版文档也保鲜（代码钉在最新 tag）；
3. **（可选）主仓实时触发** → 主仓文档一提交约两分钟重建（代码仍钉最新 tag）。

本地想手动拉一次：`pnpm sync`（或单独 `pnpm sync:changelog` / `pnpm sync:manual`）。

## 六、故障排查

- **打了 tag 没部署**：确认 tag 推上去了（`git ls-remote --tags origin`）、tag 指向的提交里包含 deploy.yml、Actions 页有对应 run。
- **Actions 构建红在 sync**：不会——同步脚本失败语义是「警告 + 保留仓内副本 + exit 0」；若整条 build 红，先看 `pnpm build` 的 tsc/vite 段。
- **定时线没跑**：GitHub 的 schedule 在仓库 60 天无活动后会自动暂停；push 一次即恢复。
- **dispatch 没触发**：查主仓 Actions 里 notify-website 是否红（多半是 PAT 过期/权限不够）。
- **线上代码版本不对**：看部署日志第一行 `deploying ref: vX.Y.Z`；想强制升版就打新 tag，或手动 Run 填指定 ref。
