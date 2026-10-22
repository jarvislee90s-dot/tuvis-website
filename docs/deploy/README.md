# 正式发布与 Cloudflare Pages 部署

网站只在推送正式稳定 tag `vX.Y.Z` 时发布。tag 冻结网站 `main` 的具体 commit；之后 `main` 前进不会改变该版本的代码或文档。普通 `main` push、半月 checkpoint、定时任务和 Tuvis 文档 dispatch 都不会部署。

> 网站远端仓：`https://github.com/jarvislee90s-dot/tuvis-website`（公开）
> 线上地址：<https://tuvis.app/>（Cloudflare Pages 自定义域名，2026-10 起托管；旧 GitHub Pages 地址已停更，验证新站后在仓库 Settings → Pages 关停）
> 内容真值：更新日志 / 兼容矩阵 / 用户手册来自 Tuvis 主仓的**同名 release tag**，构建时校验拉取，缺失或失败即阻断（不回退网站仓副本或 Tuvis `main`）。

## 正式发布

先在 Tuvis 主仓发布同名稳定 tag，再在网站仓本地 `main` 运行发布命令：

```bash
pnpm release:website v0.7.0
```

命令会 fetch `origin/main` 并要求当前分支为 `main`、工作树干净、本地 `HEAD` 与 `origin/main` 同 SHA；同时验证版本高于现有网站稳定 tag、该版本尚不存在、网站源码 SHA 不与上一正式 tag 重复，并且 Tuvis 仓已有同名 tag。全部通过后，命令在当前 `origin/main` SHA 创建并推送注释 tag。检查失败时不会创建 tag。

网站 Actions 收到正式 tag 后：

1. 校验触发 tag 是稳定 `vMAJOR.MINOR.PATCH`，并确认事件 SHA 与 tag 一致；构建仍绑定触发的 tag。
2. 若旧 tag 事件迟到，或新 tag 在排队／构建期间出现，workflow 通过最新正式 tag 的同树 marker 重新排队，不会在旧事件 SHA 下构建别的 tag 内容。
3. 更新日志、用户手册和能力矩阵均从同名 Tuvis tag 拉取。任一 tag 或文件缺失、内容校验失败、网络请求失败都会使构建失败，不使用网站仓旧副本或 Tuvis `main` 回退。
4. 先在部署 job 入队前校验 release 事件；实际发布 job 使用单 pending 并发锁。取得锁后重新核对 tag 是否仍为最新。若该事件已过期则只排队最新 tag 的同树 marker；构建期间若 tag 再前进，部署前复查会放弃旧部署并重新排队最新 marker。过期部署只异步派发后继恢复并立即退出，不能等待恢复 workflow；否则恢复 workflow 等待部署、部署又等待恢复时，会与恢复编排锁形成循环等待。人工恢复 workflow 自身仍等待它派发的具体部署结束。

网站仓和 Tuvis 仓的正式 tag 必须一一对应。通常流程是先发布 Tuvis `vX.Y.Z`，再运行网站发布命令创建网站 `vX.Y.Z`。

## 托管配置（Cloudflare Pages，一次性）

- **部署 secrets**：Cloudflare 控制台 → My Profile → API Tokens → Create Token，自定义权限一行 `Account | Cloudflare Pages | Edit`；然后到网站仓 → Settings → Secrets and variables → Actions，存入 `CLOUDFLARE_API_TOKEN` 与 `CLOUDFLARE_ACCOUNT_ID`（后者在控制台首页右侧复制）。
- **自定义域名**：Pages 项目 `tuvis` 由部署 workflow 的 ensure 步骤幂等创建（CI 下 wrangler 不会自动建项目；已存在则跳过）；随后在 Cloudflare 控制台 Workers & Pages → `tuvis` → Custom domains 绑定 `tuvis.app`（域名与项目同账号，DNS 自动配置）。
- **部署的是哪个包？** 你不需要手动打包：GitHub Actions 云端执行 `pnpm build`（内容钉网站 + Tuvis 双 tag）产出 `site/dist`，经 wrangler 直传 Cloudflare Pages；本地 build 仅作预览/验证。

## 同版本人工恢复

在网站仓 Actions 运行 **Redeploy latest website release**，输入最新稳定网站 tag。恢复只允许最新 tag；旧版本回滚应作为单独、明确的操作处理。

恢复 workflow 会创建 `vX.Y.Z-redeploy-<run-id>-<attempt>` 临时分支。marker commit 是正式 tag 的子提交，只有 SHA 不同，tree 与正式 tag 完全一致。恢复构建和工作流都来自正式 tag。恢复前会验证该 tag 自带的 `deploy.yml` 声明了同树 marker 协议；不支持该协议的旧 tag（包括现有 `v0.6.0`）会被拒绝，安全恢复从下一个按新流程创建的正式 tag 开始。恢复完成或失败后，workflow 自动删除 marker 分支。不要直接重跑旧 tag 的部署 run；同版本重发请使用这个恢复入口。

网站仓与 Tuvis 仓均配置了 active ruleset `Protect v* release tags`，匹配 `refs/tags/v*`，禁止更新与删除且没有 bypass actor；它不阻止创建新 release tag。旧辅助 tag `v0.6.0-deploy.1` 也在保护范围内，因此保留不删。托管迁至 Cloudflare Pages 后，`github-pages` Environment 不再参与发布，无需维护其部署规则。

## 其他工作流

- `ci.yml`：PR 与 `main` push 运行测试和类型检查，不发布。
- `sync-checkpoint.yml`：每月 1 日和 15 日将同步快照存档到 `main`，不发布。
- `deploy.yml`：正式稳定 tag 发布；仅接受恢复 workflow 创建的 marker branch 作为内部 `workflow_dispatch` 来源。
- `redeploy-latest.yml`：人工恢复最新稳定 tag，自动创建、等待并清理 marker branch。

以前从 Tuvis 仓触发的网站 `repository_dispatch` 和每日兜底部署已退役。Tuvis 仓若仍安装 `notify-website.yml`，它不再影响网站发布，但可删除该通知 workflow 及专用 `SITE_DISPATCH_PAT` secret。

## 故障排查

- **发布命令拒绝执行**：按错误检查分支、工作树、`origin/main` 同步状态、版本递增、SHA 是否重复及同名 Tuvis tag。
- **正式构建失败**：检查日志中的 `TUVIS_RELEASE_REF` 与三类内容来源；正式发布不允许从 `main` 或网站快照回退。
- **用户手册章节或配图缺失**：构建会对照 `src/content/manual.ts` 检查中英文 13 篇章节及其相对图片引用；补齐 Tuvis 对应 tag 后重新发版。
- **旧 tag 没有部署**：这是保护行为；只部署最新正式稳定 tag。
- **恢复后 marker 分支残留**：检查 `Redeploy latest website release` 的清理步骤，再手动删除 `v*-redeploy-*` 分支。
- **CF 部署红在 wrangler 步骤**：多为 `CLOUDFLARE_API_TOKEN` 过期/权限不足（需 `Account | Cloudflare Pages | Edit`）或 `CLOUDFLARE_ACCOUNT_ID` 填错；更新 secret 后对最新 tag 运行「Redeploy latest website release」重发。

首次启用永久流程时，先把本 workflow 更新合并到网站 `main`（含上节 Cloudflare secrets），再通过后续正式 tag 验收发布链。旧辅助 tag `v0.6.0-deploy.1` 会被稳定 tag 保护规则保留，版本解析器会忽略它。
