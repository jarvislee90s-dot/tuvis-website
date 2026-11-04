---
name: tuvis-release
description: Tuvis 官网（tuvis-website 仓库）发版技能：当用户表达「发版」「上线」「release」「部署一下」「更新线上站点」「打个 tag 发布」时使用；用户问「线上怎么还没更新」时也走本技能排查发版链路。流程：收尾改动 → 推 main 存档 → pnpm release:website 打 vX.Y.Z 稳定 tag → 盯 Cloudflare Pages 构建 → 验证 tuvis.app 可访问。不在 tuvis-website 仓库里时不要使用。
---

# Tuvis 官网发版

> 本文只写「现在做什么」。发布机制、命令契约、一次性配置与故障归因见 [docs/deploy/README.md](../../../docs/deploy/README.md)；项目入口见 [README](../../../README.md)。
>
> last-verified: 2026-11-04 · 事实锚点：`.github/workflows/deploy.yml`、`scripts/release-website.mjs`、`scripts/release-policy.mjs`

发版模型：**push main 只存档不上线，`v*` 稳定 tag 才触发部署**（`deploy.yml` → Cloudflare Pages → <https://tuvis.app>）。

## 0. 守卫（不满足就停）

1. 仓库判定：`package.json` 的 `name` 为 `tuvis-website`，且存在 `.github/workflows/deploy.yml` 与 `scripts/release-website.mjs`——否则告知用户本技能仅适用于 tuvis-website 仓库，停止。
2. `git remote get-url origin` 指向 `jarvislee90s-dot/tuvis-website`。
3. 当前分支为 `main`（不是则切回或询问）。
4. `gh auth status` 可用（盯构建要用；不可用则改用 API 轮询，见第 7 节）。

## 1. 收尾未提交改动

`git status --short` 非空时，用 AskUserQuestion 问用户：这些改动**进本版**（逐文件提交，message 按改动内容推断，约定式前缀 feat/fix/docs/chore）还是**不发**（stash 或留给下版）。不要不问就直接全提交——用户可能有半成品。

发布命令要求工作树干净，收尾必须在第 6 节发版前完成。

## 2. CHANGELOG 中英对齐检查

主仓契约：`CHANGELOG.md` 纯中文、`CHANGELOG.en.md` 纯英文，未译条目不写、不留占位（契约正文以 Tuvis 主仓 CHANGELOG 头注释为准；本站 `scripts/split-changelog.mjs` 会对残留的旧式 `EN:` 行告警）。

逐条检查本版将包含的中文新增条目在 `CHANGELOG.en.md` 是否有对应条目：缺失不阻断构建，但 `/en/changelog` 只列已译版本——提醒用户本版英文是否滞后，接受则继续。不要往任何一边补占位行。

## 3. 推送 main（存档）

```
git push origin main
```

main 推送不触发部署，这步只是把 WIP 存档。

## 4. 定版本号

```
git fetch --tags origin
node scripts/latest-stable-tag.mjs
```

用 AskUserQuestion 给用户选（默认 patch+1）：

- **patch+1**：如 v0.6.4 → v0.6.5（常规内容更新）
- **minor+1 / major+1**：按用户对改动规模的说明
- **网站修复版（第 4 段 +1）**：如 v0.6.4 → v0.6.4.1——仅网站侧热修，内容仍取主仓 v0.6.4（第 4 段 tag 自动映射回主仓 3 段 tag）

不要用 `git tag --sort=-v:refname | head -1` 直接取最新（会把 `v0.6.0-deploy.1` 这类辅助 tag 混进来），用上面的脚本。

## 5. 确认 Tuvis 主仓前置 tag（硬前置）

发布命令要求主仓已有对应内容 tag（网站第 4 段 tag 对应主仓 3 段 tag）：

```
git ls-remote --tags https://github.com/jarvislee90s-dot/tuvis.git "refs/tags/vX.Y.Z"
```

无输出则**停止**：告知用户先在 Tuvis 主仓发同名 tag，再回来发网站版（否则第 6 节必然报错）。

## 6. 发版（这一步触发部署）

```
pnpm release:website vX.Y.Z
```

**唯一入口，禁止手动 `git tag` / `git push origin <tag>`。** 命令会依次校验：tag 语法、main 分支、工作树干净、本地 main 与 `origin/main` 同 SHA、版本比现有最新稳定 tag 更新、SHA 不与上一版重复、主仓已有同名内容 tag；全部通过后在 `origin/main` SHA 上打注释 tag 并推送，触发 `deploy.yml`。

失败时按报错对照第 9 节修复后重跑；校验规则摘要见 docs/deploy「发布命令契约」。

## 7. 盯构建（约 3–5 分钟）

```
gh run list --repo jarvislee90s-dot/tuvis-website --workflow deploy.yml --limit 3
gh run view <run-id> --repo jarvislee90s-dot/tuvis-website --json status,conclusion,headBranch
```

- 轮询上条命令（20–30s 一次，上限 10–15 分钟）直到 `status` 为 `completed`：`conclusion` = `success` / `failure`。
- **不要用 `gh run watch`**：fine-grained PAT 下会失败（原因见 docs/deploy「同版本恢复机制」）；仅确认本机是经典/OAuth token 时才可用。
- 观察点：`resolve` job 的 `should_deploy`；`deploy` job 的 `Deploy to Cloudflare Pages` step。

失败取日志：`gh run view <run-id> --log-failed`。

没有 gh CLI 时轮询 API（20s 一次，最多 10 分钟）：`https://api.github.com/repos/jarvislee90s-dot/tuvis-website/actions/runs?per_page=3`，看 `status`（queued/in_progress → completed）与 `head_branch`（应等于 tag 名）。

## 8. 验证线上

```
curl -s -o /dev/null -w "%{http_code}" https://tuvis.app/zh
curl -s -o /dev/null -w "%{http_code}" https://tuvis.app/en
```

期望均 200。再核对：`https://tuvis.app/zh` 页面 Hero 徽章版本号为本版 `vX.Y.Z`；`https://tuvis.app/zh/changelog` 首条为本版。英文未译时 `/en/changelog` 缺本版属正常，不算失败。

## 9. 失败处置（症状 → 先做什么）

| 症状 | 先做什么 |
|---|---|
| 构建红在内容同步（checkout Tuvis tag / 同步步骤） | 查主仓同名 tag 是否存在、CHANGELOG / capabilities / 手册文件是否齐全。**发布构建不回退仓内副本，缺失即阻断**；归因细节见 docs/deploy「故障归因」 |
| 构建红在 wrangler / Cloudflare step | 多为 `CLOUDFLARE_API_TOKEN` 过期或 `CLOUDFLARE_ACCOUNT_ID` 错误；归因见 docs/deploy，更新 secret 后走第 9 行「同版本重发」 |
| 命令报 `must be newer than` / `already exists` | 版本号选错，回第 4 节重选 |
| 命令报 `matching Tuvis tag … is required` | 回第 5 节，先发主仓 tag |
| 命令报 `clean working tree` / `main must match` | 回第 1、3 节收尾并推 main |
| 同版本需要重发 | Actions 跑 **Redeploy latest website release**（只允许最新稳定 tag）；机制与前置检查见 docs/deploy「同版本恢复机制」 |
| 其他 | 按 docs/deploy「故障归因」定位责任环节，处置动作回本表 |

## 10. 报告

成功报告：版本号、tag、本次内容对应的 Tuvis tag、构建时长、run 链接、线上地址 <https://tuvis.app/>。

发版后自检：本次是否暴露文档与实际的偏差？有则立即修 docs/deploy 机制节或本技能，不要留到下版。

## 注意事项

- 发布构建从**主仓同名 release tag** 同步 CHANGELOG / capabilities.json / 用户手册；缺失或校验失败**即阻断**，不回退网站仓副本（回退只存在于本地预览与普通 CI 路径）。
- 只部署**最新**稳定 tag：构建或排队期间出现更新的 tag，旧事件会被自动重排队到最新 tag，不会部署旧内容。
- 同版本恢复依赖 `RELEASE_RECOVERY_PAT`（未配置时恢复在 marker 步骤失败）；创建与权限见 docs/deploy「一次性配置」。
- 不要直接重跑旧 tag 的部署 run——同版本重发只走恢复入口。
