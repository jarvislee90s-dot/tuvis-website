# 发布与部署机制（Cloudflare Pages）

> 本文定位：发布与部署的**机制说明书**——什么事件会发布、为什么这样设计、命令契约、一次性配置、故障归因。
> 逐步操作走查（收尾 → 推 main → 选版本 → 打 tag → 盯构建 → 验证）见 [`.agents/skills/tuvis-release/SKILL.md`](../../.agents/skills/tuvis-release/SKILL.md)；项目入口见 [`README.md`](../../README.md)。
> 发布策略的决策记录见 `SPEC.md`；本文描述现行实现，冲突时以本文与 workflow 文件为准。

网站只在推送正式稳定 tag `vX.Y.Z` 时发布。tag 冻结网站 `main` 的具体 commit；之后 `main` 前进不会改变该版本的代码或文档。普通 `main` push、半月 checkpoint、定时任务和 Tuvis 文档 dispatch 都不会部署。

> 网站远端仓：`https://github.com/jarvislee90s-dot/tuvis-website`（公开）
> 线上地址：<https://tuvis.app/>（Cloudflare Pages 自定义域名，2026-10 起托管）
> 内容真值：更新日志 / 兼容矩阵 / 用户手册来自 Tuvis 主仓的**同名 release tag**，构建时校验拉取，缺失或失败即阻断（不回退网站仓副本或 Tuvis `main`）。

## 1. 发布模型（为什么）

- **tag 才发布**：让「上线」成为显式动作，main 上的任何 WIP 存档、checkpoint、文档同步都不会意外改变线上。
- **只发最新**：网站 Actions 仅部署当前最新正式稳定 tag；旧 tag 事件不部署是保护行为，不是故障。
- **内容钉双 tag**：网站 tag 与 Tuvis content tag 一一对应（4 段修复版 `vX.Y.Z.N` 映射回主仓 `vX.Y.Z`，见 `scripts/release-policy.mjs` 的 `tuvisContentTag()`）。发布命令要求后者已存在——保证每次发布的内容来源可追溯、可复现。

## 2. 发布链路（deploy.yml 做了什么）

`deploy.yml`（Deploy to Cloudflare Pages）监听 `v*` tag push，以及仅由恢复 workflow 创建的 marker branch 触发的内部 `workflow_dispatch`：

1. 校验触发 tag 是稳定 `vMAJOR.MINOR.PATCH[.N]`，并确认事件 SHA 与 tag 一致；构建仍绑定触发的 tag。
2. 若旧 tag 事件迟到，或新 tag 在排队／构建期间出现，workflow 通过最新正式 tag 的同树 marker 重新排队，不会在旧事件 SHA 下构建别的 tag 内容。
3. 更新日志、用户手册和能力矩阵均从同名 Tuvis tag 拉取。任一 tag 或文件缺失、内容校验失败、网络请求失败都会使构建失败，不使用网站仓旧副本或 Tuvis `main` 回退。
4. 先在部署 job 入队前校验 release 事件；实际发布 job 使用单 pending 并发锁。取得锁后重新核对 tag 是否仍为最新。若该事件已过期则只排队最新 tag 的同树 marker；构建期间若 tag 再前进，部署前复查会放弃旧部署并重新排队最新 marker。过期部署只异步派发后继恢复并立即退出，不能等待恢复 workflow；否则恢复 workflow 等待部署、部署又等待恢复时，会与恢复编排锁形成循环等待。人工恢复 workflow 自身仍等待它派发的具体部署结束（轮询 Actions REST API 获取 run 状态——`gh run watch` 不支持 fine-grained PAT）。

## 3. 发布命令契约（`pnpm release:website`）

最终真值是 `scripts/release-website.mjs`；命令通过全部前置校验后，在 `origin/main` SHA 上创建注释 tag 并推送（推送失败会自动删除本地 tag）。校验项与其报错片段：

| 校验项 | 报错片段（`release-website.mjs`） |
|---|---|
| tag 语法为精确稳定版 | `version must be an exact stable tag` |
| 当前分支是 `main` | `release must be created from the main branch` |
| 工作树干净 | `release requires a clean working tree` |
| 本地 `main` 与刚 fetch 的 `origin/main` 同 SHA | `local main must match the freshly fetched origin/main SHA` |
| tag 本地/远端均不存在 | `already exists locally` / `already exists in the website repository` |
| 版本高于现有最新稳定 tag | `must be newer than` |
| 源码 SHA 不与上一正式 tag 重复 | `reuse the same SHA as` |
| Tuvis 仓已有对应内容 tag | `matching Tuvis tag` … `is required before website release` |
| 预检期间 `origin/main` 未前进 | `origin/main advanced during release preflight; fetch and retry` |

tag 语法与保护：稳定 tag 为 `vMAJOR.MINOR.PATCH[.N]`（第 4 段为网站修复版）；网站仓和 Tuvis 仓均配置 active ruleset `Protect v* release tags`，匹配 `refs/tags/v*`，禁止更新与删除且没有 bypass actor，不阻止创建新 release tag。旧辅助 tag `v0.6.0-deploy.1` 也在保护范围内因此保留，版本解析器会忽略它。

## 4. 一次性配置

- **Cloudflare 部署 secrets**：Cloudflare 控制台 → My Profile → API Tokens → Create Token，自定义权限一行 `Account | Cloudflare Pages | Edit`；然后到网站仓 → Settings → Secrets and variables → Actions，存入 `CLOUDFLARE_API_TOKEN` 与 `CLOUDFLARE_ACCOUNT_ID`（后者在控制台首页右侧复制）。
- **Pages 项目与自定义域名**：Pages 项目 `tuvis` 由部署 workflow 的 ensure 步骤幂等创建（CI 下 wrangler 不会自动建项目；已存在则跳过）；随后在 Cloudflare 控制台 Workers & Pages → `tuvis` → Custom domains 绑定 `tuvis.app`（域名与项目同账号，DNS 自动配置）。
- **恢复 PAT**：`RELEASE_RECOVERY_PAT` 是 fine-grained PAT（仅限本仓库，Contents / Actions / Workflows 均为 read & write），供恢复编排创建 marker 分支；未配置时回退 GITHUB_TOKEN，此时恢复会在 marker 步骤失败。
- **部署的是哪个包？** 无需手动打包：GitHub Actions 云端执行 `pnpm build`（内容钉网站 + Tuvis 双 tag）产出 `site/dist`，经 wrangler 直传 Cloudflare Pages；本地 build 仅作预览/验证。
- **旧 GitHub Pages 关停**（若尚未处理）：托管迁至 Cloudflare 后，`github-pages` Environment 不再参与发布；验证新站后在仓库 Settings → Pages 关停旧站。

## 5. 同版本恢复机制

恢复只允许**最新**稳定 tag；旧版本回滚应作为单独、明确的操作处理。操作入口与前置检查见 skill 的「失败处置」节。

恢复 workflow（`redeploy-latest.yml`）会创建 `vX.Y.Z-redeploy-<run-id>-<attempt>` 临时分支。marker commit 是正式 tag 的子提交，只有 SHA 不同，tree 与正式 tag 完全一致（同树 marker 协议，`# recovery-marker-protocol: v1`）。该分支通过 GitHub Git 数据 API（`POST /git/commits` + `POST /git/refs`）创建而不是 `git push`：GITHUB_TOKEN 推送树里含 workflow 文件的新分支会被 GitHub 拒绝，而 `workflows: write` 又不是 GITHUB_TOKEN 的合法 scope（issue #7）。实测（2026-10-23，run 39978121538）：Git 数据 API 放行了 commit 对象创建，但 ref 创建被 403 拒绝（`Resource not accessible by integration` 只表明权限不足；与 push 路径明确的 workflow 门禁报错一致，具体缺失的权限项可由响应 `X-Accepted-GitHub-Permissions` 头定论）。因此编排各步骤使用 `RELEASE_RECOVERY_PAT`，未配置时回退 GITHUB_TOKEN——此时恢复会在 marker 步骤失败。恢复构建和工作流都来自正式 tag。恢复前会验证该 tag 自带的 `deploy.yml` 声明了同树 marker 协议；不支持该协议的旧 tag（包括现有 `v0.6.0`）会被拒绝，安全恢复从下一个按新流程创建的正式 tag 开始。恢复完成或失败后，workflow 自动删除 marker 分支。不要直接重跑旧 tag 的部署 run；同版本重发请使用这个恢复入口。

## 6. 故障归因（症状 → 原因 → 责任环节）

- **发布命令拒绝执行**：按报错片段对照第 3 节校验表定位——分支、工作树、`origin/main` 同步状态、版本递增、SHA 重复或同名 Tuvis tag 缺失。
- **正式构建失败**：检查日志中的 `TUVIS_RELEASE_REF` 与三类内容来源（CHANGELOG / capabilities / 手册）；正式发布不允许从 `main` 或网站快照回退。
- **用户手册章节或配图缺失**：构建会对照 `src/content/manual.ts` 检查中英文 13 篇章节及其相对图片引用；需补齐 Tuvis 对应 tag 后重新发版。
- **旧 tag 没有部署**：这是保护行为；只部署最新正式稳定 tag。
- **恢复在 marker 步骤 403（Resource not accessible by integration）**：`RELEASE_RECOVERY_PAT` 未配置（回退到 GITHUB_TOKEN 会再次 403）或权限不足；若权限配齐仍 403，依据该 403 响应的 `X-Accepted-GitHub-Permissions` 头确认缺失项。
- **恢复后 marker 分支残留**：`Redeploy latest website release` 的清理步骤异常；残留分支名为 `v*-redeploy-*`。
- **CF 部署红在 wrangler 步骤**：多为 `CLOUDFLARE_API_TOKEN` 过期/权限不足（需 `Account | Cloudflare Pages | Edit`）或 `CLOUDFLARE_ACCOUNT_ID` 填错。

以上各项的处置动作（重跑什么、更新 secret 后如何重发）见 skill「失败处置」节。

## 7. 其他与已退役工作流

| workflow | 触发 | 是否发布 |
|---|---|---|
| `ci.yml` | PR 与 `main` push | 否，只跑测试与类型检查 |
| `sync-checkpoint.yml` | 每月 1 日和 15 日 | 否，同步快照存档到 `main` |
| `deploy.yml` | 正式稳定 tag push；恢复 marker branch | 是 |
| `redeploy-latest.yml` | 人工触发 | 间接：创建 marker branch 触发 `deploy.yml` |

已退役：从 Tuvis 仓触发的网站 `repository_dispatch` 与每日兜底部署不再影响网站发布；`SITE_DISPATCH_PAT` secret 与旧 notify workflow 可从 Tuvis 仓清理；`github-pages` Environment 不再参与发布。
