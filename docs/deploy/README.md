# 正式发布与 GitHub Pages 部署

网站只在推送正式稳定 tag `vX.Y.Z` 时发布。tag 冻结网站 `main` 的具体 commit；之后 `main` 前进不会改变该版本的代码或文档。普通 `main` push、半月 checkpoint、定时任务和 Tuvis 文档 dispatch 都不会部署。

## 正式发布

先在 Tuvis 主仓发布同名稳定 tag，再在网站仓本地 `main` 运行发布命令：

```bash
pnpm release:website v0.7.0
```

命令会 fetch `origin/main` 并要求当前分支为 `main`、工作树干净、本地 `HEAD` 与 `origin/main` 同 SHA；同时验证版本高于现有网站稳定 tag、该版本尚不存在、网站源码 SHA 不与上一正式 tag 重复，并且 Tuvis 仓已有同名 tag。全部通过后，命令在当前 `origin/main` SHA 创建并推送注释 tag。检查失败时不会创建 tag。

网站 Actions 收到正式 tag 后：

1. 校验触发 tag 是稳定 `vMAJOR.MINOR.PATCH`，再解析当前最新正式版本；迟到的旧 tag 事件会转而构建最新 tag。
2. 网站代码从该网站 tag 构建。
3. 更新日志、用户手册和能力矩阵均从同名 Tuvis tag 拉取。任一 tag 或文件缺失、内容校验失败、网络请求失败都会使构建失败，不使用网站仓旧副本或 Tuvis `main` 回退。
4. 先在部署 job 入队前校验 release 事件；实际发布 job 使用单 pending 并发锁。取得锁后重新解析最新稳定 tag，再从该 tag 构建。若构建期间出现新 tag，部署前复查会丢弃旧构建；被新任务替换的等待任务不会覆盖更新版本，因为取得锁后还会重新选择最新 tag。

网站仓和 Tuvis 仓的正式 tag 必须一一对应。通常流程是先发布 Tuvis `vX.Y.Z`，再运行网站发布命令创建网站 `vX.Y.Z`。

## 同版本人工恢复

在网站仓 Actions 运行 **Redeploy latest website release**，输入最新稳定网站 tag。恢复只允许最新 tag；旧版本回滚应作为单独、明确的操作处理。

恢复 workflow 会创建 `vX.Y.Z-redeploy-<run-id>-<attempt>` 临时分支。marker commit 是正式 tag 的子提交，只有 SHA 不同，tree 与正式 tag 完全一致。恢复构建和工作流都来自正式 tag。恢复前会验证该 tag 自带的 `deploy.yml` 声明了同树 marker 协议；不支持该协议的旧 tag（包括现有 `v0.6.0`）会被拒绝，安全恢复从下一个按新流程创建的正式 tag 开始。恢复完成或失败后，workflow 自动删除 marker 分支。不要直接重跑旧 tag 的部署 run；同版本重发请使用这个恢复入口。

GitHub 仓库的 `github-pages` Environment 必须允许正式 `v*` tag 和 `v*-redeploy-*` marker branch 部署。网站仓与 Tuvis 仓均配置了 active ruleset `Protect v* release tags`，匹配 `refs/tags/v*`，禁止更新与删除且没有 bypass actor；它不阻止创建新 release tag。旧辅助 tag `v0.6.0-deploy.1` 也在保护范围内，因此保留不删。

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
- **Pages 拒绝部署**：确认 `github-pages` Environment 的分支/tag 规则包含 marker 分支；检查部署日志使用的 Pages build SHA 是否唯一。

首次启用永久流程时，先合并本次 workflow 更新到网站 `main`，确认 `github-pages` Environment 规则包含 marker 分支，再通过后续正式 tag 验收发布链。旧辅助 tag `v0.6.0-deploy.1` 会被稳定 tag 保护规则保留，版本解析器会忽略它。
