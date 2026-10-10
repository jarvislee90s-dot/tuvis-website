# Tuvis 官网 P7 改版补充计划（素材修复 · 配色切换 · Demo 窗口化 · 账本专区）

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 基于 P0–P5 成品（main @ 5281cf8，11 测试全绿）落地四条用户反馈：① Hero 图两腿间白底定向重抠；② 首页三只状态兔替换为手绘内联 SVG 胡萝卜三色灯（品牌冻结色）；③ 全站配色从旧草稿冷海军蓝切换到主仓 remote-ui 定稿色板（暖白纸感 / 暖黑纸感）；④ Demo 四场景全部装进 macOS 风格窗壳并增强场景联动（D1 通知→开窗、D2 手机↔终端联动、D3 窗壳化、D4 手动触发+独立账本专区），首页 HomeBoard 同步窗口化。

**Architecture:** 不改技术栈与路由结构。令牌层换值不换名（语义类 `text-ink`/`bg-card`/`border-line`/`text-inkdim`/`text-hud` 全部保留，只换 `:root`/`.dark` 底层变量）；新增令牌 `btnp/btnpt`（主控色对）、`bub`（气泡）、三对状态徽标软色（亮暗恒定）、双层字体（`--font-ui` 系统 UI 栈 / `--font-mono` 内容等宽）。Demo 新增纯 CSS 窗壳组件族（WindowFrame / TerminalWindow / NotificationCard / DesktopStage）+ ToolIcon（remote-ui 重绘 8 工具 SVG 日夜双形态），D1 抽出可复用 D1Scene 供 /demo 与首页共用。账本从 D4 弹层升格为 /demo 独立 section（ledgerData 静态数据 + 不变式测试 + SVG 趋势线）。

**Tech Stack:** 不变：pnpm · Vite 6 · React 19 · TypeScript 5.7 · Tailwind CSS v4 · react-router 7 · i18next · zustand 5 · framer-motion 12（仅用既有依赖，零新增包）· Python PIL（一次性素材脚本，非运行时依赖）

**规格来源（配色唯一权威，实现必须 1:1 对齐）：**
- `E:\LLMproject\Github\mam-worktree\docs\design\remote-ui\01-看板-定稿.html`（board-day/board-night 完整令牌、.scard 彩檐卡、chip、徽标、ibtn、8 工具 SVG 图标日夜双形态、夜间黑系檐色提亮）
- `E:\LLMproject\Github\mam-worktree\docs\design\remote-ui\02-详情层-定稿.html`（消息流气泡、审批红卡、输入区、问答卡、文件面板、按钮规格）
- `E:\LLMproject\Github\mam-worktree\docs\design\remote-ui\04-外观配置-设置节-定稿.html`（SKINS 六皮肤全表——本计划取默认 lpaper/npaper；FONTS 四档；圆角档；品牌点缀四模式）
- `E:\LLMproject\Github\mam-worktree\docs\design\tool-color-ledger.md`（8 工具识别色、全局保留色、夜间皮肤三条规则、双层字体制度）
- `brand/final/logo/versions/05-aigen/COLOR-SPEC.md`（藏蓝 `#2C3347` 全站唯一值、仅图标用途——新色板不得引入第二藏蓝）
- 状态色双层规则（用户已拍板）：**品牌物料**（SVG 胡萝卜灯）用冻结色 绿`#36BB7B`/黄`#EAB53D`/红`#DE5656`；**Demo 产品卡**用台账软色徽标（淡底+深字，亮暗恒定）+ 夜间提亮规则。

**全局约定:**
- 工作目录：`E:\LLMproject\Github\tuvis-website`（Shell: Git Bash）；基线 main @ 5281cf8，工作区干净
- 每个任务收尾四件套：`pnpm exec tsc --noEmit` + `pnpm test` + `pnpm build` 全绿 → `git commit -m "type: 描述"`（type = feat/fix/test/chore/docs）→ 勾选本计划 checkbox → `docs/superpowers/plans/progress.md` 末尾追加该任务报告（变更文件/测试结果/commit hash/与计划偏差）
- 红线（不可越）：`SPEC.md` / `brand/` 既有文件 / `legacy/` 不改（例外仅：`public/` 素材拷贝与 hero 重抠产物覆盖 `public/img/hero-cutout.png`、`public/og.png` 重生成）；不新增任何 npm 依赖；`DownloadCta` 的 `goToInstaller` 兜底逻辑一行不动（只允许改 className）；全站零追踪（不加任何统计脚本）
- i18n 增量：本计划新增 16 个 key（见下表），**zh.json 与 en.json 必须同步**（parity 测试强制）；终端/APP 窗口内的模拟代码/任务内容**硬编码英文**（真实感优先），但窗口标题、通知文案、按钮、字幕、徽标一律走 i18n
- P6（部署）仍不在范围

**i18n 增量总表（16 key，zh / en）：**

| key | zh | en | 落点任务 |
|---|---|---|---|
| `demo.filter.all` | 全部 | All | Task 17 |
| `badge.running` | 运行中 | Running | Task 17 |
| `badge.waiting` | 等待批准 | Awaiting approval | Task 17 |
| `badge.idle` | 空闲 | Idle | Task 17 |
| `demo.win.board` | 兔维斯 — 会话看板 | Tuvis — Session Board | Task 17 |
| `demo.win.claudeTerm` | Claude Code — 终端 | Claude Code — Terminal | Task 17 |
| `demo.win.codexApp` | Codex — 任务 | Codex — Tasks | Task 17 |
| `demo.notify.title` | Claude Code 需要批准 | Claude Code needs approval | Task 17 |
| `demo.notify.body` | 计划待批准：pnpm install（点击直达终端） | Plan awaiting approval: pnpm install (click to open the terminal) | Task 17 |
| `demo.phone.appTitle` | Tuvis 远程 | Tuvis Remote | Task 18 |
| `demo.win.resources` | 兔维斯 — 资源管理 | Tuvis — Resources | Task 19 |
| `pet.trigger.approval` | Claude 需要审批 | Claude needs approval | Task 20 |
| `pet.trigger.done` | 任务运行完毕 | Task finished | Task 20 |
| `pet.card.approval` | 等待批准 · pnpm install | Awaiting approval · pnpm install | Task 20 |
| `pet.card.done` | 任务完成 · 用量已记账 | Task done · usage logged | Task 20 |
| `usage.trend` | 近 30 天走势 | 30-day trend | Task 20 |

> `pet.voice` 按钮在 Task 20 被手动触发按钮取代后成为死 key（保留在 json 中不删，避免无谓 churn；parity 测试只查键集合与空值，不受影响）。

**文件总览：**

新增（12 个源/脚本文件）：
```
scripts/hero-recut.py                     # T15 定向重抠脚本（自校验）
src/components/CarrotLamp.tsx             # T15 SVG 胡萝卜三色灯
src/tokens.test.ts                        # T16 令牌守护测试
src/demo/WindowFrame.tsx                  # T17 macOS 窗壳
src/demo/TerminalWindow.tsx               # T17 终端窗壳
src/demo/NotificationCard.tsx             # T17 模拟系统通知卡
src/demo/DesktopStage.tsx                 # T17 桌面舞台（点阵底）
src/demo/ToolIcon.tsx                     # T17 8 工具 SVG 日/夜双形态
src/demo/scenes/D1Scene.tsx               # T17 D1 场景（含 PlayerFrame）
src/demo/ledgerData.ts                    # T20 账本静态数据
src/demo/ledgerData.test.ts               # T20 数据不变式测试
src/demo/LedgerSection.tsx                # T20 账本专区
```

修改（22 个既有文件）：
```
public/img/hero-cutout.png                 # T15 重抠覆盖（brand/ 原件不动）
public/og.png                              # T15 用新 hero 重生成（配方同 Task 14）
src/home/StatesSection.tsx                 # T15 PNG→CarrotLamp
src/index.css                              # T16 令牌/字体/阴影；T17 追加 --edge-*/stage/blink
index.html                                 # T16 theme-color 双 media
src/components/layout/TopBar.tsx           # T16 类名清扫
src/home/{Hero,DownloadCta,OpenSource,StoriesSection,FeaturesSection,HomeBoard}.tsx  # T16 清扫 + T17 HomeBoard 窗口化
src/pages/{DocsPage,DemoPage}.tsx          # T16 清扫 + T17/20 挂载
src/i18n/{zh,en}.json                      # T17/18/19/20 分批 +16 key
src/demo/tools.ts                          # T17 edgeVar 助手
src/demo/store.ts                          # T17 windows 状态
src/demo/steps-d1.ts                       # T17 新剧本节拍
src/demo/steps-d2.ts                       # T18 字幕联动改写
src/demo/player.test.ts                    # T17 追加窗口断言
src/demo/{SessionCard,ToolChip,PhoneFrame,PlayerFrame}.tsx  # T16 清扫 + T17 scard/chip 重绘
src/demo/scenes/{BoardScene,RemoteScene,ResourcesScene,PetUsageScene}.tsx  # T17/18/19/20 重构
docs/superpowers/plans/progress.md         # 每任务追加报告
```

---

## 新设计令牌总表（Task 16 落地，全站唯一事实源）

来源：`01-看板-定稿.html` `.board-day` / `.board-night`（= `04` SKINS `lpaper`/`npaper` 默认皮肤）+ 台账「全局保留色/夜间规则」。

| 令牌 | 亮（lpaper 暖白纸感） | 暗（npaper 暖黑纸感） | 语义与出处 |
|---|---|---|---|
| `--surface`（页面底） | `#F8F3E9` | `#271D0F` | 皮肤 pg |
| `--card`（卡片底） | `#FFFDF8` | `#3A2C1A` | 皮肤 cbg |
| `--line`（边框） | `#EAE2CF` | `#6E5836` | 皮肤 cb；暗=台账夜间卡片亮边规则 |
| `--ink`（正文） | `#2B2417` | `#F0E9DC` | 皮肤 tx |
| `--ink-dim`（弱文字） | `#97907E` | `#B0A896` | 皮肤 mut |
| `--bub`（用户气泡底）新增 | `#EFE8D8` | `#564427` | 皮肤 bub（02 详情层用户消息气泡色） |
| `--btnp` / `--btnpt`（主控色对）新增 | `#1A1915` / `#FFFFFF` | `#EFE9DC` / `#241B0E` | 台账主控色 + 夜间主按钮反白规则（chip 选中/主按钮/发送键同源） |
| `--hud`（青蓝强调，**保留现值**） | `#1787A8` | `#72D8EF` | 用户裁决（2026-10-10）：配色自由，青蓝作为品牌点缀保留（HUD 同源），不随 remote-ui 退役；见权衡 A2 |
| `--status-ok` | `#1E7B34` | `#36BB7B` | 亮=台账徽标绿字；暗=品牌冻结绿（暗底可读） |
| `--status-warn` | `#8A6D00` | `#EAB53D` | 同上（黄） |
| `--status-bad` | `#B3261E` | `#DE5656` | 同上（红） |
| 徽标软色（亮暗恒定，不换肤）新增 | `--bdg-r:#FEE9E5/#B3261E` · `--bdg-y:#FBF3D9/#8A6D00` · `--bdg-g:#E3F2E7/#1E7B34` | 同左 | 台账状态徽标「淡底+深字」，原型日夜两板同值 |
| `--sh-soft`（卡片阴影）新增 | `0 1px 2px rgba(80,60,20,.06), 0 3px 10px rgba(80,60,20,.05)` | `0 1px 3px rgba(0,0,0,.35)` | 皮肤 sh |
| `--sh-pop`（浮层阴影，派生档）新增 | `0 2px 10px rgba(80,60,20,.08), 0 8px 30px rgba(80,60,20,.08)` | `0 2px 8px rgba(0,0,0,.45), 0 12px 40px rgba(0,0,0,.4)` | 原型只有 soft 一档；窗壳/通知浮层需要更强层级，用同色相中性 rgba 派生（见权衡 A6） |
| `--font-ui` 新增 | `-apple-system,"SF Pro Text","PingFang SC","Microsoft YaHei",system-ui,sans-serif` | 同左 | 原型 `-apple-system,"PingFang SC",sans-serif`；站点跑在 Windows 补 YaHei/system-ui 回落（见权衡 A5） |
| `--font-mono` 新增 | `ui-monospace,"SF Mono",Menlo,Consolas,"Courier New",monospace` | 同左 | 台账双层制度：内容字体恒等宽；补 Windows Consolas 回落 |

工具识别檐色（Task 17 随窗壳接入，CSS 变量实现夜间提亮零 JS）：

| 令牌 | 亮 | 暗（台账夜间提亮） |
|---|---|---|
| `--edge-claude` | `#D97757` | 不变 |
| `--edge-codex` | `#10A37F` | 不变 |
| `--edge-openclaw` | `#D2453C` | 不变 |
| `--edge-workbuddy` | `#4AD06A` | 不变 |
| `--edge-dsh` | `#4D6BFE` | 不变 |
| `--edge-opencode` | `#6B6B6B` | `#8C8C88` |
| `--edge-kimi` | `#0B0E1A` | `#8A94A6` |
| `--edge-zcode` | `#141413` | `#A39C8C` |

**圆角档（硬变更，全站统一映射）**：8px（小件：小按钮/图标钮/输入/内嵌行）= `rounded-lg`；14px（卡片/窗壳/徽标容器）= `rounded-[14px]`；26px（大容器：舞台/手机壳/Hero 图框/下载大卡/账本专区）= `rounded-[26px]`；999px（chip/徽标）= `rounded-full`。替换规则：`rounded-xl`(12)→`rounded-[14px]`、`rounded-2xl`(16)→`rounded-[14px]`、`rounded-3xl`(24)→`rounded-[26px]`、`rounded-lg` 保留。出处：原型 board 26 / scard 14 / ibtn 8 / chip·徽标 999。

**关键设计权衡（A 系列，评审时对照）：**
- **A1 令牌换值不换名**：`text-ink`/`bg-card`/`border-line`/`text-inkdim`/`text-hud` 全部语义类保留，波及面从「全站改类名」降为「改 2 个 CSS 变量块 + 少量成对类替换」。
- **A2 青蓝 `--hud` 保留现值（用户裁决 2026-10-10）**：remote-ui 定稿虽无青蓝强调色，但用户明确「配色自由，参考软件已有颜色不代表软件里没有的颜色不能用」——青蓝（HUD 同源、与目镜渐变呼应）作为品牌点缀全站保留：链接 `text-hud`、选中态 `bg-hud`、hover 边 `hover:border-hud` 等现有用法**零改动**（令牌值不变自动生效）。主控色对 `btnp/btnpt` 只用于原型明确的主按钮/chip 选中场景。
- **A3 暗色状态色=品牌冻结三色**：暗底 `#271D0F` 上台账徽标深字（`#1E7B34` 等）不可读；冻结三色恰好是暗底可读的高亮版，且与胡萝卜灯同源，一箭双雕。徽标**成对**使用时（软底+深字）亮暗恒定，与原型一致。
- **A4 皮肤取默认对 lpaper/npaper**：04 号定稿有六皮肤，但站点不是皮肤配置器，只取默认日/夜对。台账 §三 的桌面浅色值（`#F7F6F4` 底）被 04 号 SKINS 定稿（2026-10-05 同日更终）覆盖，以 SKINS 为准。
- **A5 字体栈补 Windows 回落**：原型 `--font-mono` 只有 macOS 栈；官网大量 Windows 访客，SF Mono/Menlo 缺失会跌到浏览器默认衬线。追加 Consolas/"Courier New"；`--font-ui` 同理追加 "Microsoft YaHei"。不引入任何 webfont（零包体、零追踪）。
- **A6 `--sh-pop` 派生档**：原型阴影只有 soft 一档（看板卡用）；窗壳/通知需要"浮在桌面上"的层级。用与 soft 同色相的中性 rgba 加深派生，不引入新色相。若评审认为过度，可降级为 soft 两层叠加。
- **A7 窗壳红绿灯/终端底色不随主题**：`#FF5F57/#FEBC2E/#28C840` 是 macOS 系统拟物色、终端 `#0E0D0B` 是真实终端观感，日夜恒定（亮暗下都是"真窗口"），符合"真实程序窗口"诉求，也不占用品牌色。
- **A8 Hero 徽章/副标题保持现状**：徽章维持 `text-hud` 青蓝（A2 裁决的直接推论）；副标题 `text-ok` 绿是否改墨交由实现时目检亮暗对比度再定，计划不强制。

---

## P7-A · 素材修复

### Task 15: Hero 定向重抠 + SVG 胡萝卜灯替换状态兔

**背景事实（已实测核实）**：`public/img/hero-cutout.png`（1024×1536 RGBA）两腿间隙区约 px x 440–602 / y 1044–1325（比例 x 0.43–0.59 / y 0.68–0.86）有纯白不透明残留（exact-white 2391 px；near-white≥232 约 19.5k px）；头部对照区 exact-white 0。种子点 `(0.51w, 0.77h)` 做 4 邻域洪泛、容差「alpha>240 且 rgb≥232」、走廊约束 `y ≥ 0.60h` 时，洪泛域 19149 px，**不触碰图像四边、不上爬过 0.65h**——不会吃进角色本体（角色为深色调，白肚风险已被走廊约束隔离）。品牌红线「立绘只做技术性处理」：仅删白底+羽化，不动任何非白像素。

**Files:**
- Create: `scripts/hero-recut.py` `src/components/CarrotLamp.tsx`
- Modify: `public/img/hero-cutout.png`（脚本产物覆盖） `public/og.png`（重生成） `src/home/StatesSection.tsx`

- [x] **Step 15.1: 写 scripts/hero-recut.py（洪泛去白 + 边缘羽化 + 自校验，失败不落盘）**

```python
"""Hero 立绘定向重抠：仅删除两腿间隙的白色残留（品牌红线：立绘只做技术性处理）。

用法：
  python scripts/hero-recut.py          # 处理并覆盖 public/img/hero-cutout.png + 重生成 public/og.png
  python scripts/hero-recut.py --check  # 只校验当前文件是否已清理（0 白残留则退出码 0）
"""
import sys
from PIL import Image, ImageFilter

HERO = "public/img/hero-cutout.png"
OG = "public/og.png"
SEED = (0.51, 0.77)          # 比例坐标，落在两腿间隙白斑中心
CORRIDOR_Y = 0.60            # 只允许向下/横向扩散（角色躯干在上方，保护带）
MAX_MASK = 40_000            # 洪泛域 sanity 上限（实测 19,149）
NEAR = (240, 232, 232, 232)  # alpha>240 且 rgb>=232 视为白残留


def near_white(p):
    return p[3] > NEAR[0] and p[0] >= NEAR[1] and p[1] >= NEAR[2] and p[2] >= NEAR[3]


def flood_mask(im):
    px = im.load()
    w, h = im.size
    y0 = int(h * CORRIDOR_Y)
    seed = (int(w * SEED[0]), int(h * SEED[1]))
    assert y0 <= seed[1] < h, "seed must be inside corridor"
    assert near_white(px[seed[0], seed[1]]), "seed is not on white residue — abort"
    seen, stack = set(), [seed]
    while stack:
        x, y = stack.pop()
        if (x, y) in seen or not (0 <= x < w and y0 <= y < h):
            continue
        if not near_white(px[x, y]):
            continue
        seen.add((x, y))
        stack += [(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)]
    return seen


def recut():
    im = Image.open(HERO).convert("RGBA")
    orig = im.copy()
    mask_px = flood_mask(im)
    assert len(mask_px) <= MAX_MASK, f"mask too big ({len(mask_px)}px) — abort, no write"
    w, h = im.size
    mask = Image.new("L", (w, h), 0)
    for x, y in mask_px:
        mask.putpixel((x, y), 255)
    feathered = mask.filter(ImageFilter.GaussianBlur(1.5))   # 边缘羽化：硬边→渐隐
    alpha = im.getchannel("A")
    from PIL import ImageChops
    alpha = ImageChops.subtract(alpha, feathered)            # 新 alpha = 原 alpha - 羽化蒙版
    im.putalpha(alpha)
    _assert_clean(im, mask_px)
    _assert_untouched(orig, im, mask_px)
    im.save(HERO, optimize=True)
    print(f"hero-recut: {len(mask_px)} px removed, saved {HERO}")
    make_og(im)


def _assert_clean(im, mask_px):
    px = im.load(); w, h = im.size
    left = sum(1 for x, y in mask_px if near_white(px[x, y]))
    assert left == 0, f"{left} white pixels remain in mask region"


def _assert_untouched(orig, im, mask_px):
    op, np_ = orig.load(), im.load()
    w, h = orig.size
    checked = 0
    for y in range(0, h, 7):          # 抽样 1/7 行，控制耗时
        for x in range(0, w, 7):
            if (x, y) in mask_px:
                continue
            assert op[x, y] == np_[x, y], f"pixel changed outside mask at {x},{y}"
            checked += 1
    print(f"hero-recut: {checked} sampled pixels outside mask unchanged")


def white_count(path=HERO):
    im = Image.open(path).convert("RGBA")
    px = im.load(); w, h = im.size
    y0, y1 = int(h * 0.66), int(h * 0.90)
    return sum(1 for y in range(y0, y1) for x in range(int(w * 0.40), int(w * 0.62)) if near_white(px[x, y]))


def make_og(hero):
    tile = Image.open("public/img/appicon-dark.png").convert("RGBA").resize((460, 460), Image.LANCZOS)
    h2 = hero.copy(); h2.thumbnail((560, 620), Image.LANCZOS)
    og = Image.new("RGBA", (1200, 630), (44, 51, 71, 255))   # 藏蓝底 = 图标用途，COLOR-SPEC 唯一值
    og.paste(h2, (700, 630 - h2.height), h2)
    og.paste(tile, (90, 85), tile)
    og.convert("RGB").save(OG)
    print(f"hero-recut: og.png regenerated ({OG})")


if __name__ == "__main__":
    if "--check" in sys.argv:
        n = white_count()
        print(f"hero-recut --check: {n} white residue px in legs corridor")
        sys.exit(0 if n == 0 else 1)
    recut()
```

> 覆盖链：`brand/final/extracted/21-hero-cutout.png` 原件不动；只覆盖 `public/` 拷贝。og.png 用重抠后 hero 重生成（Task 14 同配方），两产物一次提交。

- [x] **Step 15.2: 运行脚本并核验**

```bash
python scripts/hero-recut.py          # Expected: "hero-recut: 19xxx px removed" + 抽样不变断言通过 + og.png regenerated
python scripts/hero-recut.py --check  # Expected: 0 white residue px（退出码 0）
```

- [x] **Step 15.3: 写 src/components/CarrotLamp.tsx（手绘内联 SVG 胡萝卜三色灯，冻结色）**

```tsx
import type { CSSProperties } from "react";

export type LampState = "green" | "yellow" | "red";

/** 品牌冻结色——仅品牌物料使用；Demo 产品卡状态色走台账软色（见 P7 令牌表）。 */
export const LAMP_FROZEN: Record<LampState, string> = {
  green: "#36BB7B",
  yellow: "#EAB53D",
  red: "#DE5656",
};

/**
 * 胡萝卜状态灯：主体换色（品牌规则），叶随主题弱色（currentColor），高光刻线为中性白。
 * 简洁现代扁平风：无描边、无渐变、圆头刻线。
 */
export function CarrotLamp({ state, size = 120, className = "", style }: {
  state: LampState; size?: number; className?: string; style?: CSSProperties;
}) {
  return (
    <svg viewBox="0 0 120 170" width={size} height={Math.round((size * 170) / 120)}
      role="img" aria-hidden="true" className={className} style={style}>
      <g fill="none" stroke="currentColor" strokeWidth={5} strokeLinecap="round">
        <path d="M53 50 C50 36 44 29 36 25" />
        <path d="M60 48 C60 33 60 26 60 17" />
        <path d="M67 50 C70 36 76 29 84 25" />
      </g>
      <path d="M60 52 C76 52 84 62 82 76 C80 96 70 132 62 152 C61.2 154.5 58.8 154.5 58 152 C50 132 40 96 38 76 C36 62 44 52 60 52 Z"
        fill={LAMP_FROZEN[state]} />
      <g fill="none" stroke="rgba(255,255,255,.45)" strokeWidth={3.5} strokeLinecap="round">
        <path d="M50 84 C56 88 64 88 70 84" />
        <path d="M52 108 C58 112 62 112 68 108" />
      </g>
    </svg>
  );
}
```

- [x] **Step 15.4: 改造 src/home/StatesSection.tsx（PNG 撤下，states.* 文案保留）**

```tsx
import { useTranslation } from "react-i18next";
import { Reveal } from "@/components/Reveal";
import { SectionTitle } from "@/components/SectionTitle";
import { CarrotLamp, LAMP_FROZEN, type LampState } from "@/components/CarrotLamp";

const STATES: { state: LampState; k: string }[] = [
  { state: "green", k: "states.green" },
  { state: "yellow", k: "states.yellow" },
  { state: "red", k: "states.red" },
];

export function StatesSection() {
  const { t } = useTranslation();
  return (
    <Reveal>
      <section className="py-16">
        <SectionTitle tKey="states.title" sub="states.desc" />
        <div className="grid gap-5 md:grid-cols-3">
          {STATES.map((s) => (
            <figure key={s.k} className="rounded-[14px] border-[1.5px] border-line bg-card p-6 text-center text-inkdim shadow-soft">
              <CarrotLamp state={s.state} size={110} className="mx-auto" />
              <figcaption className="mt-4 flex items-center justify-center gap-2 text-sm">
                <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: LAMP_FROZEN[s.state] }} />
                {t(s.k)}
              </figcaption>
            </figure>
          ))}
        </div>
      </section>
    </Reveal>
  );
}
```

> `public/img/state-{green,yellow,red}.png` 三张兔 PNG 从此不再被引用，文件保留在 public/（brand 资产不做删除，避免误伤其他引用排查）。`shadow-soft` 工具类在 Task 16 才定义——本任务先以 `shadow-lg` 过渡，Task 16 全站清扫时统一换为 `shadow-soft`（两任务相邻，允许中间态）。

- [x] **Step 15.5: 验证 + Commit + progress**

```bash
pnpm exec tsc --noEmit && pnpm test && pnpm build   # 全绿（11 passed 不变）
pnpm dev   # 浏览器核对：首页状态区三盏胡萝卜灯（绿/黄/红冻结色、叶随亮暗换色）；hero 两腿间隙透出底色（亮=米白纸面、暗=暖黑），无白斑
git add -A && git commit -m "fix(assets): targeted hero re-cutout and svg carrot state lamps"
# progress.md 追加 Task 15 报告（脚本输出两行数字 + 浏览器结论 + commit hash）
```

**验收标准：** `hero-recut.py --check` 退出码 0；抽样断言证明蒙版外零像素变动；三盏灯渲染正确且亮暗两模式下叶子颜色跟随主题；states.* 文案未变。

---

## P7-B · 全站配色令牌切换

### Task 16: remote-ui 定稿色板落地 + 语义类清扫 + 字体/圆角/阴影硬变更

**Files:**
- Create: `src/tokens.test.ts`
- Modify: `src/index.css` `index.html` `src/components/layout/TopBar.tsx` `src/home/{Hero,DownloadCta,OpenSource,StoriesSection,FeaturesSection}.tsx` `src/pages/DocsPage.tsx` `src/pages/ChangelogPage.tsx`（仅当用到清扫项） `src/demo/{SessionCard,ToolChip,PhoneFrame,PlayerFrame}.tsx` `src/demo/scenes/{BoardScene,RemoteScene,ResourcesScene,PetUsageScene}.tsx`（本任务只做类名替换，不动结构——结构性重构归 Task 17–20）

- [x] **Step 16.1: 重写 src/index.css（令牌表完整落地）**

```css
@import "tailwindcss";

@custom-variant dark (&:where(.dark, .dark *));

@theme inline {
  --color-surface: var(--surface);
  --color-card: var(--card);
  --color-line: var(--line);
  --color-ink: var(--ink);
  --color-inkdim: var(--ink-dim);
  --color-ok: var(--status-ok);
  --color-warn: var(--status-warn);
  --color-bad: var(--status-bad);
  --color-hud: var(--hud);
  --color-navy: #2c3347;
  --color-btnp: var(--btnp);
  --color-btnpt: var(--btnpt);
  --color-bub: var(--bub);
  --color-bdg-r: #FEE9E5;
  --color-bdg-r-t: #B3261E;
  --color-bdg-y: #FBF3D9;
  --color-bdg-y-t: #8A6D00;
  --color-bdg-g: #E3F2E7;
  --color-bdg-g-t: #1E7B34;
  --font-ui: -apple-system, "SF Pro Text", "PingFang SC", "Microsoft YaHei", system-ui, sans-serif;
  --font-mono: ui-monospace, "SF Mono", Menlo, Consolas, "Courier New", monospace;
}

/* 皮肤：主仓 remote-ui 定稿默认对 —— lpaper 暖白纸感 / npaper 暖黑纸感（01/04 号定稿 HTML） */
:root {
  --surface: #F8F3E9;
  --card: #FFFDF8;
  --line: #EAE2CF;
  --ink: #2B2417;
  --ink-dim: #97907E;
  --status-ok: #1E7B34;
  --status-warn: #8A6D00;
  --status-bad: #B3261E;
  --hud: #1787A8;   /* 青蓝品牌点缀保留（用户裁决，权衡 A2）；亮底加深保对比 */
  --btnp: #1A1915;
  --btnpt: #FFFFFF;
  --bub: #EFE8D8;
  --sh-soft: 0 1px 2px rgba(80, 60, 20, 0.06), 0 3px 10px rgba(80, 60, 20, 0.05);
  --sh-pop: 0 2px 10px rgba(80, 60, 20, 0.08), 0 8px 30px rgba(80, 60, 20, 0.08);
}

.dark {
  --surface: #271D0F;
  --card: #3A2C1A;
  --line: #6E5836;
  --ink: #F0E9DC;
  --ink-dim: #B0A896;
  --status-ok: #36BB7B;   /* 品牌冻结三色（暗底可读，A3） */
  --status-warn: #EAB53D;
  --status-bad: #DE5656;
  --hud: #72D8EF;
  --btnp: #EFE9DC;
  --btnpt: #241B0E;
  --bub: #564427;
  --sh-soft: 0 1px 3px rgba(0, 0, 0, 0.35);
  --sh-pop: 0 2px 8px rgba(0, 0, 0, 0.45), 0 12px 40px rgba(0, 0, 0, 0.4);
}

@utility shadow-soft { box-shadow: var(--sh-soft); }
@utility shadow-pop { box-shadow: var(--sh-pop); }

html {
  scroll-behavior: smooth;
}

body {
  @apply bg-surface text-ink;
  font-family: var(--font-ui);
}

@keyframes fall { to { transform: translateY(320px) rotate(240deg); opacity: 0; } }
```

> Inter 全站退役（不再加载任何 webfont 栈；`--font-ui` 纯系统栈，见台账字体制度"零包体成本"）。

- [x] **Step 16.2: index.html theme-color 双 media**

```html
    <meta name="theme-color" media="(prefers-color-scheme: light)" content="#F8F3E9" />
    <meta name="theme-color" media="(prefers-color-scheme: dark)" content="#271D0F" />
```

（替换原单条 `content="#2C3347"`。）

- [x] **Step 16.3: 写 src/tokens.test.ts（令牌守护，防漂移）**

```ts
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const css = readFileSync(new URL("./index.css", import.meta.url), "utf8").toLowerCase();

const LIGHT = [
  "--surface: #f8f3e9", "--card: #fffdf8", "--line: #eae2cf", "--ink: #2b2417",
  "--ink-dim: #97907e", "--bub: #efe8d8", "--btnp: #1a1915", "--btnpt: #ffffff",
];
const DARK = [
  "--surface: #271d0f", "--card: #3a2c1a", "--line: #6e5836", "--ink: #f0e9dc",
  "--ink-dim: #b0a896", "--bub: #564427", "--btnp: #efe9dc", "--btnpt: #241b0e",
];

describe("design tokens vs remote-ui final prototypes", () => {
  it("亮暗两套令牌与定稿一致", () => {
    for (const s of [...LIGHT, ...DARK]) expect(css).toContain(s);
  });
  it("旧草稿冷海军蓝已退役，青蓝点缀保留", () => {
    for (const old of ["#0b1220", "#131e30", "#22304a", "#e7eef7", "#94a6bd", "#f7f6f4"])
      expect(css).not.toContain(old);
    for (const kept of ["--hud: #1787a8", "--hud: #72d8ef"])
      expect(css).toContain(kept);
  });
  it("徽标软色对与双层字体栈存在", () => {
    for (const s of ["--color-bdg-r: #fee9e5", "--color-bdg-y-t: #8a6d00", "--color-bdg-g: #e3f2e7",
      "--font-ui:", "--font-mono:", "sf mono", "consolas", "pingfang sc"])
      expect(css).toContain(s);
  });
});
```

- [x] **Step 16.4: 全站语义类清扫（逐文件替换表；grep 复核零残留）**

| # | 旧（现状） | 新 | 落点（文件:位置） |
|---|---|---|---|
| 1 | `bg-ok … text-white dark:text-navy` | `bg-btnp text-btnpt` | TopBar(nav.download)、Hero(hero.cta)、DownloadCta(dl.win/dl.mac)、SessionCard(approve)、RemoteScene(approve)、PetUsageScene(share)、DocsPage(步骤序号圆) —— 共 8 处；`goToInstaller` 逻辑一行不动 |
| 2 | Hero 副标题 `text-ok` | 可选改 `text-ink`（实现时目检亮暗对比度再定，A8，不强制） | Hero.tsx |
| 3 | ~~Hero 徽章~~ | **零改动**：徽章维持 `border-line … text-hud` 青蓝（A2 用户裁决） | Hero.tsx |
| 4 | ~~hover:border-hud~~ | **零改动**：青蓝 hover 边保留（A2） | Hero(github)、DownloadCta(all)、OpenSource(repo)、PlayerFrame(replay) |
| 5 | `bg-hud text-white` | `bg-btnp text-btnpt`（原型 chip 选中规则，A2：btnp 用于主按钮/chip 选中） | PetUsageScene(维度切换)、ResourcesScene(预设组) —— 2 处 |
| 6 | `rounded-xl` | `rounded-[14px]` | Hero(cta/github)、DownloadCta(按钮)、SessionCard(卡片)、RemoteScene、PetUsageScene、ResourcesScene、PlayerFrame(replay) 等 |
| 7 | `rounded-2xl` | `rounded-[14px]` | Stories/Features/OpenSource/DownloadCta(大卡→改 `rounded-[26px]`)/StatesSection/BoardScene/RemoteScene/ResourcesScene/PetUsageScene/DocsPage 等（DownloadCta 外层大卡与 Hero 图框用 `rounded-[26px]`） |
| 8 | `rounded-3xl` | `rounded-[26px]` | Hero 图框、DownloadCta 大卡 |
| 9 | `shadow-xl` / `shadow-2xl` / `shadow-lg` | `shadow-soft`（Hero 图框/PhoneFrame 等大浮件可 `shadow-pop`） | PhoneFrame、Hero、SessionCard(highlight)、PetUsageScene(hover 浮窗) |
| 10 | PhoneFrame 内圆角 `rounded-[32px]`/`rounded-[24px]` | `rounded-[26px]` / `rounded-[18px]` | PhoneFrame.tsx |
| 11 | `text-hud` | 不改（令牌值不变，自动生效：亮 #1787A8 / 暗 #72D8EF） | FeaturesSection/HomeBoard/DocsPage×2/ChangelogPage 共 7 处零改动 |

复核命令（应零输出，#11 与青蓝相关项除外）：

```bash
grep -rn "bg-ok\b\|text-white dark:text-navy\|bg-hud\|rounded-2xl\|rounded-3xl" src/ | grep -v "bg-ok/"
```

> 状态语义类保留不动：`bg-ok/15 text-ok`（RemoteScene 已批准横幅）、`border-ok text-ok`（ResourcesScene 体检，Task 19 会再改徽标软色对）、`bg-warn/20`（RemoteScene 横幅）、`bg-bad`、`bg-inkdim`（SessionCard idle 点——Task 17 重绘时统一换徽标软色对）。

- [x] **Step 16.5: 验证 + 亮暗回归点清单 + Commit**

```bash
pnpm exec tsc --noEmit && pnpm test   # Expected: 11 + tokens 3 = 14 passed
pnpm build
pnpm dev
git add -A && git commit -m "feat(theme): switch site palette to remote-ui lpaper/npaper tokens"
```

亮暗回归点清单（浏览器逐项过，zh/en 各一遍）：
- [x] 首页七区块：暖白纸面（亮）/ 暖黑纸面（暗），无任何冷蓝残留；主按钮亮=近黑底白字、暗=米白底深字
- [x] Hero 图框内两腿间隙颜色与页面底一致（T15 产物）
- [x] /demo 四场景 + /docs + /changelog + /changelog 解析正常；对比度：inkdim 弱文字在两模式下均可读（暗 mut #B0A896 on #271D0F）
- [x] 中英切换、主题刷新保持（localStorage）、404 兜底刷新 `/en/demo` 仍可达
- [x] 徽标软色对在亮暗下同值（RemoteScene 横幅黄、体检绿）

**验收标准：** tokens.test 3 项绿；清扫复核 grep 零残留；上列回归点全部通过；`goToInstaller` 与 dist 产物逻辑无 diff（`git diff src/home/DownloadCta.tsx` 仅 className 行变化）。

---

## P7-C · Demo 窗口化

### Task 17: 窗壳组件族（WindowFrame/TerminalWindow/NotificationCard/DesktopStage）+ ToolIcon + D1 重构 + HomeBoard 窗口化

**Files:**
- Create: `src/demo/WindowFrame.tsx` `src/demo/TerminalWindow.tsx` `src/demo/NotificationCard.tsx` `src/demo/DesktopStage.tsx` `src/demo/ToolIcon.tsx` `src/demo/scenes/D1Scene.tsx`
- Modify: `src/index.css`（追加 --edge-*/--stage-dot/blink） `src/demo/tools.ts` `src/demo/store.ts` `src/demo/steps-d1.ts` `src/demo/player.test.ts` `src/demo/SessionCard.tsx` `src/demo/ToolChip.tsx` `src/demo/scenes/BoardScene.tsx` `src/pages/DemoPage.tsx` `src/home/HomeBoard.tsx` `src/i18n/{zh,en}.json`（+9 key：demo.filter.all / badge.*×3 / demo.win.board / demo.win.claudeTerm / demo.win.codexApp / demo.notify.title / demo.notify.body）

- [x] **Step 17.1: index.css 追加檐色/舞台点阵/光标动画**

```css
/* 8 工具识别檐色（tool-color-ledger；黑系夜间提亮，CSS 变量实现零 JS 换肤） */
:root {
  --edge-claude: #D97757; --edge-codex: #10A37F; --edge-opencode: #6B6B6B;
  --edge-openclaw: #D2453C; --edge-kimi: #0B0E1A; --edge-workbuddy: #4AD06A;
  --edge-zcode: #141413; --edge-dsh: #4D6BFE;
  --stage-dot: rgba(80, 60, 20, 0.1);
}
.dark {
  --edge-opencode: #8C8C88; --edge-kimi: #8A94A6; --edge-zcode: #A39C8C;
  --stage-dot: rgba(240, 233, 220, 0.07);
}

.stage-dots {
  background-color: var(--surface);
  background-image: radial-gradient(var(--stage-dot) 1px, transparent 1px);
  background-size: 18px 18px;
}

@keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
```

- [x] **Step 17.2: 写四个窗壳组件（完整代码）**

`src/demo/WindowFrame.tsx`：

```tsx
import type { ReactNode } from "react";

/** macOS 系统红绿灯为拟物固定色，不随站点主题（A7） */
const LIGHTS = ["#FF5F57", "#FEBC2E", "#28C840"];

export function WindowFrame({ title, children, className = "", bodyClassName = "", onClose }: {
  title: string; children: ReactNode; className?: string; bodyClassName?: string; onClose?: () => void;
}) {
  return (
    <div className={`overflow-hidden rounded-[14px] border-[1.5px] border-line bg-card shadow-soft ${className}`}>
      <div className="relative flex h-9 items-center border-b border-line/60 bg-surface/70 px-3.5 backdrop-blur">
        <span className="flex gap-2" aria-hidden="true">
          {LIGHTS.map((c, i) => (
            <button key={c} type="button" tabIndex={-1} aria-hidden="true"
              onClick={i === 0 && onClose ? onClose : undefined}
              className="h-[11px] w-[11px] rounded-full transition hover:brightness-95"
              style={{ background: c }} />
          ))}
        </span>
        <span className="pointer-events-none absolute inset-x-10 truncate text-center text-[11px] font-semibold text-inkdim">
          {title}
        </span>
      </div>
      <div className={bodyClassName}>{children}</div>
    </div>
  );
}
```

`src/demo/TerminalWindow.tsx`：

```tsx
import { useTranslation } from "react-i18next";
import { WindowFrame } from "./WindowFrame";

export interface TermLine { text: string; tone?: "cmd" | "ok" | "warn" | "dim" }
const TONE = {
  cmd: "text-[#D97757]",
  ok: "text-[#4EC98A]",
  warn: "text-[#EAB53D]",
  dim: "text-[#8B857A]",
} as const;

/** 终端窗壳：底色/提示符为拟物固定色（真实终端观感，日夜恒定）；行内容由调用方给（模拟代码可硬编码英文）。 */
export function TerminalWindow({ lines, titleKey = "demo.win.claudeTerm", className = "", cursor = true, onClose }: {
  lines: TermLine[]; titleKey?: string; className?: string; cursor?: boolean; onClose?: () => void;
}) {
  const { t } = useTranslation();
  return (
    <WindowFrame title={t(titleKey)} className={className} onClose={onClose}
      bodyClassName="bg-[#0E0D0B] px-4 py-3 font-mono text-[12px] leading-relaxed text-[#D8D3C8]">
      {lines.map((l, i) => (
        <div key={i} className={`whitespace-pre-wrap ${l.tone ? TONE[l.tone] : ""}`}>
          {l.tone === "cmd" ? `❯ ${l.text}` : l.text}
        </div>
      ))}
      {cursor && (
        <span className="inline-block h-[14px] w-[7px] translate-y-[2px] bg-[#D8D3C8]"
          style={{ animation: "blink 1.1s steps(1) infinite" }} />
      )}
    </WindowFrame>
  );
}
```

`src/demo/NotificationCard.tsx`：

```tsx
import { motion } from "framer-motion";

/** 模拟桌面通知：title/body 由调用方传入已翻译文案（i18n 在调用侧）。 */
export function NotificationCard({ title, body, onClick, onClose }: {
  title: string; body: string; onClick: () => void; onClose: () => void;
}) {
  return (
    <motion.div role="button" tabIndex={0} onClick={onClick}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onClick(); }}
      initial={{ opacity: 0, x: 32, scale: 0.96 }} animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 32, scale: 0.96 }} transition={{ type: "spring", stiffness: 380, damping: 30 }}
      className="absolute right-4 top-4 z-20 w-64 cursor-pointer rounded-[14px] border border-line bg-card/95 p-3 shadow-pop backdrop-blur">
      <div className="flex items-start gap-2.5">
        <img src="img/appicon-light.png" alt="" className="mt-0.5 hidden h-7 w-7 rounded-lg dark:block" />
        <img src="img/appicon-dark.png" alt="" className="mt-0.5 h-7 w-7 rounded-lg dark:hidden" />
        <div className="min-w-0 flex-1">
          <div className="text-xs font-semibold text-ink">{title}</div>
          <div className="mt-0.5 text-[11px] leading-snug text-inkdim">{body}</div>
        </div>
        <button type="button" aria-label="close" onClick={(e) => { e.stopPropagation(); onClose(); }}
          className="-mr-1 -mt-1 px-1 text-inkdim hover:text-ink">×</button>
      </div>
    </motion.div>
  );
}
```

> 图标路径沿用站点既有相对路径写法（`img/appicon-*.png`，与 TopBar 同源），暗色用 light 图标反转可见性。

`src/demo/DesktopStage.tsx`：

```tsx
import type { ReactNode } from "react";

/** 桌面舞台：点阵底衬托浮窗层级（多窗场景容器） */
export function DesktopStage({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`stage-dots relative overflow-hidden rounded-[26px] border border-line p-4 md:p-6 ${className}`}>
      {children}
    </div>
  );
}
```

- [x] **Step 17.3: 写 src/demo/ToolIcon.tsx（8 工具 SVG，日/夜双形态 1:1 取自 01-看板-定稿.html）**

结构规格（实现子代理直接从 `E:\LLMproject\Github\mam-worktree\docs\design\remote-ui\01-看板-定稿.html` 抄 SVG path，日夜两个版本各一组）：

```tsx
export function ToolIcon({ tool, size = 19 }: { tool: string; size?: number }) {
  return (
    <svg viewBox="0 0 20 20" width={size} height={size} aria-hidden="true" className="shrink-0">
      {/* 日间形态 */}
      <g className="dark:hidden">{DAY_PATHS[tool]}</g>
      {/* 夜间形态（黑系反转：kimi 反白、zcode/opencode 亮描边、codex 深底白符；彩色系日夜同图，夜组直接复用日组） */}
      <g className="hidden dark:block">{NIGHT_PATHS[tool] ?? DAY_PATHS[tool]}</g>
    </svg>
  );
}
```

- 图标内容对照表（01 号定稿第 81–134 行 day / 153–202 行 night）：codex（白底黑框 `›_` 绿下划线 / 夜：深底白符）、claude（橙底白 C，日夜同）、kimi（蓝黑底白月 / 夜：浅底 `#E8EDF8` 深月）、zcode（纯黑底白 Z 折线 / 夜：黑底 + `#ECE9E2` 亮描边）、openclaw（猩红钳爪，日夜同）、opencode（白底黑框 `‹›` / 夜：深底白括号）、workbuddy（绿渐变白猫头，日夜同，渐变 id 加 `useId()` 前缀防多实例重复 id）、dsh（蓝底白鲸鱼，日夜同）
- 夜间仅黑系 4 个需要独立形态；WorkBuddy 渐变必须用 `useId` 处理 `<linearGradient id>`（页面会同时渲染多个图标实例）

- [x] **Step 17.4: tools.ts 加檐色助手 + store 加 windows 状态**

`src/demo/tools.ts` 追加：

```ts
import type { CSSProperties } from "react";

/** 卡片彩檐样式：走 CSS 变量，暗色自动应用台账夜间提亮 */
export function edgeStyle(key: string): CSSProperties {
  return { "--ec": `var(--edge-${key})` } as CSSProperties;
}
```

`src/demo/store.ts` 的 `DemoState` 追加并实现：

```ts
  windows: { notify: boolean; claudeTerm: boolean; codexApp: boolean };
  setWindows: (patch: Partial<DemoState["windows"]>) => void;
  // create 内：
  windows: { notify: false, claudeTerm: false, codexApp: false },
  setWindows: (patch) => set((s) => ({ windows: { ...s.windows, ...patch } })),
```

- [x] **Step 17.5: 重写 steps-d1.ts（通知→开窗节拍）+ player.test.ts 追加断言**

```ts
// steps-d1.ts
import type { Step } from "./types";
import { setStateOf, useDemo } from "./store";

const W = () => useDemo.getState().setWindows;

export const d1Steps: Step[] = [
  { wait: 900,
    run: () => { W()({ notify: false, claudeTerm: false, codexApp: false }); setStateOf("claude", "waiting"); },
    caption: { zh: "Claude Code 停下来等你批准——看板变黄", en: "Claude Code pauses for approval — card turns amber" } },
  { wait: 1600, run: () => W()({ notify: true }),
    caption: { zh: "桌面通知弹出，点一下直达终端", en: "A desktop notification pops — click to jump to the terminal" } },
  { wait: 2600,
    run: () => { W()({ notify: false, claudeTerm: true, codexApp: true }); setStateOf("claude", "running"); },
    caption: { zh: "通知一点：终端窗口和 Codex 任务窗同时弹出", en: "One click: the terminal and Codex task window pop open" } },
  { wait: 2600, run: () => setStateOf("codex", "waiting"),
    caption: { zh: "Codex 也进入等待——手机上同样看得到", en: "Codex waits too — visible on your phone" } },
  { wait: 2200, run: () => setStateOf("codex", "running"),
    caption: { zh: "试试点别的卡片、筛选器和窗口", en: "Try other cards, filters and windows" } },
];

export function d1Captions(): { zh: string; en: string }[] {
  void useDemo;
  return d1Steps.filter((s) => s.caption).map((s) => s.caption!);
}
```

`src/demo/player.test.ts` 追加一个用例（既有两条不动）：

```ts
  it("d1 剧本播完：通知已消费、两个窗口已打开", () => {
    useDemo.setState({ sessions: seedSessions() });
    for (const s of d1Steps) s.run?.();
    const w = useDemo.getState().windows;
    expect(w.notify).toBe(false);
    expect(w.claudeTerm).toBe(true);
    expect(w.codexApp).toBe(true);
  });
```

- [x] **Step 17.6: SessionCard 重绘（.scard 彩檐卡 1:1）+ ToolChip 重绘（中性 chip）+ BoardScene 去壳**

结构规格（对照 01 号定稿 `.scard/.chip/.bdg` 精确样式）：

`SessionCard`（scard）：
- 外层 `relative overflow-hidden rounded-[14px] border-[1.5px] border-line bg-card p-3 pl-4 shadow-soft` + `style={edgeStyle(s.tool)}`；左檐 `<span className="absolute inset-y-0 left-0 w-1 bg-[var(--ec)]" />`
- 行 1：`ToolIcon` + 工具名（`text-[12.5px] font-semibold text-ink`）+ 项目名（`text-[11px] text-inkdim truncate`）+ 时间（`ml-auto font-mono text-[10px] text-inkdim`，沿用 `s.minutes`）
- 标题行 `s.project`（`mt-1 text-[13.5px] font-semibold`）、预览行 `s.preview`（`text-[11.5px] text-inkdim truncate`）
- 状态徽标（替换原色点）：`rounded-full px-2.5 py-0.5 text-[10.5px] font-medium 内嵌 5px 圆点`，running=`bg-bdg-y text-bdg-y-t` + t("badge.running")，waiting=`bg-bdg-r text-bdg-r-t` + t("badge.waiting")，idle=`bg-bdg-g text-bdg-g-t` + t("badge.idle")
- waiting 时批准按钮：`mt-2 w-full rounded-lg bg-btnp py-1 text-xs font-semibold text-btnpt` + t("demo.phone.approve")
- highlight 态：`border-hud shadow-pop`（不再用绿色边）

`ToolChip`（chip）：默认 `rounded-full border border-line bg-card px-3 py-1 text-[11.5px] font-medium text-inkdim hover:text-ink`；选中 `border-btnp bg-btnp font-semibold text-btnpt`；内嵌 14px `ToolIcon`（彩色圆点退役——工具身份由图标+檐色表达）。BoardScene chips 行首位加「全部」chip（`filter===null` 选中态，t("demo.filter.all")）。

`BoardScene`：外层盒子删除（窗壳由 D1Scene 提供），根节点改 `div.p-3.md:p-4`，内部保留 chips 行 + 卡片网格 + 空态；`compact` 行为保留（slice 3）。

- [x] **Step 17.7: 写 src/demo/scenes/D1Scene.tsx（舞台 + 三窗 + 通知联动）**

```tsx
import { AnimatePresence } from "framer-motion";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useDemo, setStateOf } from "../store";
import { PlayerFrame } from "../PlayerFrame";
import { DesktopStage } from "../DesktopStage";
import { WindowFrame } from "../WindowFrame";
import { TerminalWindow, type TermLine } from "../TerminalWindow";
import { NotificationCard } from "../NotificationCard";
import { BoardScene } from "./BoardScene";
import { d1Steps } from "../steps-d1";

function claudeTermLines(state: string): TermLine[] {
  const head: TermLine[] = [{ text: 'claude "add remote approve flow"', tone: "cmd" }];
  if (state === "waiting")
    return [...head, { text: "⏸ Permission needed: pnpm install", tone: "warn" }, { text: "  waiting for approval…", tone: "dim" }];
  return [...head, { text: "✓ Approved — resuming task", tone: "ok" }, { text: "  editing src/remote/approve.rs", tone: "dim" }];
}

export function D1Scene({ compact = false }: { compact?: boolean }) {
  const { t } = useTranslation();
  const windows = useDemo((s) => s.windows);
  const setWindows = useDemo((s) => s.setWindows);
  const claude = useDemo((s) => s.sessions.claude);

  const openFromNotify = () => {
    setWindows({ notify: false, claudeTerm: true, codexApp: true });
    setStateOf("claude", "running");
  };

  return (
    <PlayerFrame steps={d1Steps} id={compact ? "home-board" : "d1-player"}>
      <DesktopStage>
        <div className={`grid items-start gap-4 ${compact ? "" : "md:grid-cols-[minmax(0,1fr)_280px]"}`}>
          <WindowFrame title={t("demo.win.board")} className="mx-auto w-full max-w-xl">
            <BoardScene compact={compact} />
          </WindowFrame>
          <div className="flex flex-col gap-3 md:pt-8">
            <AnimatePresence>
              {windows.claudeTerm && (
                <motion.div key="term" initial={{ opacity: 0, scale: 0.96, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ type: "spring", stiffness: 320, damping: 26 }}>
                  <TerminalWindow lines={claudeTermLines(claude.state)} cursor={claude.state === "running"}
                    onClose={() => setWindows({ claudeTerm: false })} />
                </motion.div>
              )}
            </AnimatePresence>
            <AnimatePresence>
              {windows.codexApp && !compact && (
                <motion.div key="app" initial={{ opacity: 0, scale: 0.96, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ type: "spring", stiffness: 320, damping: 26 }}>
                  <WindowFrame title={t("demo.win.codexApp")} onClose={() => setWindows({ codexApp: false })}>
                    <ul className="space-y-1.5 p-3 font-mono text-[11px] text-inkdim">
                      <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-[#10A37F]" />refactor: nav layout <span className="ml-auto text-ink">done ✓</span></li>
                      <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#EAB53D]" />update design tokens <span className="ml-auto">running…</span></li>
                      <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-inkdim" />write tests for Board <span className="ml-auto">queued</span></li>
                    </ul>
                  </WindowFrame>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        <AnimatePresence>
          {windows.notify && (
            <NotificationCard title={t("demo.notify.title")} body={t("demo.notify.body")}
              onClick={openFromNotify} onClose={() => setWindows({ notify: false })} />
          )}
        </AnimatePresence>
      </DesktopStage>
    </PlayerFrame>
  );
}
```

> 联动语义：通知点击（自动剧本或手动）= 关通知 + 开终端窗 + 开 Codex 窗 + claude 转绿。终端窗内容随 claude.state 切换（waiting→批准提示 / running→继续输出）。红绿灯第一个圆点 = 关窗。compact（首页）不渲染 Codex 窗、单列布局。

- [x] **Step 17.8: DemoPage / HomeBoard 挂载**

`src/pages/DemoPage.tsx`：d1 区块替换为 `<D1Scene />`（去掉外层 PlayerFrame/BoardScene 组合，import 相应调整）；`src/home/HomeBoard.tsx` 整体替换：

```tsx
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { Reveal } from "@/components/Reveal";
import { D1Scene } from "@/demo/scenes/D1Scene";

export function HomeBoard() {
  const { t } = useTranslation();
  return (
    <Reveal>
      <section className="py-16">
        <D1Scene compact />
        <p className="mt-4 text-center">
          <Link to="demo" className="text-sm text-hud hover:underline">{t("demo.open")} →</Link>
        </p>
      </section>
    </Reveal>
  );
}
```

- [x] **Step 17.9: i18n 双语同步（9 key，值见增量总表）+ 验证 + Commit**

```bash
pnpm exec tsc --noEmit && pnpm test   # Expected: 14 + player 1 = 15 passed
pnpm build && pnpm dev
# 浏览器核对：/zh/demo d1 剧本 通知→双窗弹出→claude 转绿；手动点通知/关窗/重播可用；首页 HomeBoard 同款窗壳（单列、无 Codex 窗）；暗色下黑系檐色提亮（kimi/zcode/opencode 卡檐变灰阶）、徽标软色日夜同值
git add -A && git commit -m "feat(demo): mac-style window shells, tool icons and d1 rework"
```

**验收标准：** 剧本自动路径与手动路径都达成「通知→终端窗+Codex 窗→转绿」；重播重置三窗状态；暗色檐色提亮生效；HomeBoard 与 /demo 窗壳视觉一致；parity 测试绿（94 key 两语言）。

---

### Task 18: D2 重构（手机窗口 ↔ Claude Code 终端窗联动）

**Files:**
- Modify: `src/demo/scenes/RemoteScene.tsx` `src/demo/steps-d2.ts` `src/i18n/{zh,en}.json`（+1 key：demo.phone.appTitle）

- [x] **Step 18.1: 改写 RemoteScene（左手机 / 右终端，替换桌面卡片）**

结构规格：
- 根：`<PlayerFrame steps={d2Steps} id="d2-player">` → `<DesktopStage>` → `grid items-center gap-6 md:grid-cols-[240px_minmax(0,1fr)]`
- 左：`PhoneFrame`，头部一行 `t("demo.phone.appTitle")`（`text-[10px] font-semibold text-inkdim`）+ claude 迷你卡（重绘后的 SessionCard，`highlight` 态用檐色+shadow-pop）；banner/detail/approve/approved 逻辑**全部保留**，仅样式对齐：banner → `rounded-[14px] bg-bdg-y px-2.5 py-2 text-[11px] text-bdg-y-t`；detail 卡 → `rounded-[14px] border-[1.5px] border-line bg-card p-2 text-[11px]`（附 `font-mono` 计划摘要 `pnpm install · feat/remote-approve`）；批准按钮 → `w-full rounded-lg bg-btnp py-1.5 text-xs font-semibold text-btnpt`（保留 `onClick={() => d2Steps[3].run?.()}` 手动闭环）；approved 横幅保留 `bg-ok/15 text-ok`
- 右：`TerminalWindow`（`mx-auto w-full max-w-xl`），行内容随 `remote` 状态派生：

```ts
function termLines(remote: { approved: boolean }): TermLine[] {
  return remote.approved
    ? [
        { text: 'claude "refactor remote approve flow"', tone: "cmd" },
        { text: "⏸ Permission needed: git commit -m 'refactor approve'", tone: "warn" },
        { text: "✓ Approved from Tuvis Remote — resuming", tone: "ok" },
        { text: "  committing changes…", tone: "dim" },
      ]
    : [
        { text: 'claude "refactor remote approve flow"', tone: "cmd" },
        { text: "⏸ Permission needed: git commit -m 'refactor approve'", tone: "warn" },
        { text: "  waiting for approval…", tone: "dim" },
      ];
}
```

> 光标 `cursor={!remote.approved}`：批准后光标消失=命令在跑。终端行硬编码英文（约束允许），手机端全部 i18n。

- [x] **Step 18.2: 改写 steps-d2.ts 字幕（节拍与 remote 状态机不动，只换文案表达联动）**

```ts
export const d2Steps: Step[] = [
  { wait: 800, run: () => { R()({ banner: false, detail: false, approved: false }); setStateOf("claude", "waiting"); },
    caption: { zh: "Claude Code 停在批准步——终端在等，手机同步收到", en: "Claude Code halts at approval — the terminal waits, your phone knows" } },
  { wait: 2200, run: () => R()({ banner: true }),
    caption: { zh: "手机弹出横幅——人不在电脑前也看得到", en: "A banner pops on your phone" } },
  { wait: 2200, run: () => R()({ detail: true }),
    caption: { zh: "点开横幅：计划全文与批准按钮", en: "Open the banner: full plan and the Allow button" } },
  { wait: 2600, run: () => { R()({ approved: true, banner: false }); setStateOf("claude", "running"); },
    caption: { zh: "手机点「允许」——终端立刻续跑，桌面卡片转绿", en: "Allow on the phone — the terminal resumes, the card turns green" } },
  { wait: 2000, caption: { zh: "双端状态始终同步（2 秒级推送）", en: "Both ends stay in sync (~2s push)" } },
];
```

- [x] **Step 18.3: i18n +1 key + 验证 + Commit**

```bash
pnpm exec tsc --noEmit && pnpm test && pnpm build
pnpm dev   # 核对：右终端窗随批准变 ✓ 绿行；手机手动「允许」同样联动；重播复位
git add -A && git commit -m "feat(demo): d2 phone-terminal linked scene"
```

**验收标准：** 「桌面卡片」已消失，右侧为终端窗壳；批准动作（剧本/手动两路）使终端内容与卡片状态同步翻转；zh/en 字幕正确；亮暗下手机壳与终端窗均正常。

---

### Task 19: D3 窗壳化（资源矩阵装同款窗壳）

**Files:**
- Modify: `src/demo/scenes/ResourcesScene.tsx` `src/i18n/{zh,en}.json`（+1 key：demo.win.resources）

- [x] **Step 19.1: ResourcesScene 装窗（内容与交互全保留）**

结构规格：
- 外层 `rounded-2xl … bg-surface p-4` 盒子替换为 `<WindowFrame title={t("demo.win.resources")}>`，内部 `p-4` 容器承载既有内容
- 预设组按钮对齐 chip 选中态：选中 `bg-btnp text-btnpt`（与 Task 16 清扫表 #5 及 PetUsageScene 维度切换统一），未选中 `border border-line bg-card text-inkdim hover:text-ink`
- 扫描按钮 `rounded-lg`；Skill 名/preset 名与表头工具名用 `font-mono text-[12px]`（双层字体制度：路径/类代码内容恒等宽）
- 一致性体检：健康 `rounded-[14px] bg-bdg-g px-3 py-2.5 text-bdg-g`（含 5px 点），未达标 `border border-line bg-card text-inkdim`
- 勾选矩阵、预设批量切换、重新扫描计数逻辑**逐行保留**（仅 className 变化）

- [x] **Step 19.2: i18n +1 key + 验证 + Commit**

```bash
pnpm exec tsc --noEmit && pnpm test && pnpm build
pnpm dev   # 核对：窗壳标题、勾选/预设/扫描行为与 P4 一致；暗色窗壳正常
git add -A && git commit -m "feat(demo): wrap resources scene in window frame"
```

**验收标准：** D3 内容零行为回归（勾选≥2 体检变绿等既有验收点全过）；窗壳与 D1/D2 同款；parity 绿（96 key）。

---

### Task 20: D4 重构（手动触发 + 通知 + 语音）+ 账本专区

**Files:**
- Create: `src/demo/ledgerData.ts` `src/demo/ledgerData.test.ts` `src/demo/LedgerSection.tsx`
- Modify: `src/demo/scenes/PetUsageScene.tsx` `src/pages/DemoPage.tsx` `src/i18n/{zh,en}.json`（+5 key：pet.trigger.approval / pet.trigger.done / pet.card.approval / pet.card.done / usage.trend；pet.share 为既有 key 迁位复用，不新增）

- [x] **Step 20.1: 写 ledgerData.ts + ledgerData.test.ts（完整代码）**

`src/demo/ledgerData.ts`：

```ts
export interface LedgerRow { name: string; usd: number }

export const LEDGER = {
  total: 12.4,
  bySupplier: [
    { name: "Anthropic", usd: 6.2 },
    { name: "OpenAI", usd: 2.1 },
    { name: "Moonshot", usd: 1.0 },
    { name: "DeepSeek", usd: 0.8 },
    { name: "others", usd: 2.3 },
  ],
  byModel: [
    { name: "claude-sonnet-4.5", usd: 6.2 },
    { name: "claude-opus-4.1", usd: 3.1 },
    { name: "gpt-5-codex", usd: 2.1 },
    { name: "kimi-k2", usd: 1.0 },
  ],
} satisfies { total: number; bySupplier: LedgerRow[]; byModel: LedgerRow[] };

/** 近 30 天日消耗（USD），合计 === total（测试守护） */
export const TREND: number[] = [
  0.15, 0.19, 0.13, 0.25, 0.35, 0.46, 0.32, 0.21, 0.26, 0.41,
  0.52, 0.37, 0.30, 0.43, 0.49, 0.34, 0.28, 0.40, 0.56, 0.44,
  0.38, 0.52, 0.63, 0.49, 0.41, 0.53, 0.60, 0.46, 0.69, 0.83,
];
```

`src/demo/ledgerData.test.ts`：

```ts
import { describe, expect, it } from "vitest";
import { LEDGER, TREND } from "./ledgerData";

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

describe("ledger data invariants", () => {
  it("供应商与模型两个维度合计一致且等于总额", () => {
    expect(sum(LEDGER.bySupplier.map((r) => r.usd))).toBeCloseTo(LEDGER.total, 5);
    expect(sum(LEDGER.byModel.map((r) => r.usd))).toBeCloseTo(LEDGER.total, 5);
  });
  it("趋势线为 30 天且合计等于总额", () => {
    expect(TREND).toHaveLength(30);
    expect(sum(TREND)).toBeCloseTo(LEDGER.total, 5);
  });
});
```

- [x] **Step 20.2: 写 src/demo/LedgerSection.tsx（完整代码）**

```tsx
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Reveal } from "@/components/Reveal";
import { LEDGER, TREND } from "./ledgerData";

const W = 640, H = 180, PAD = 10;

function trendPath(values: number[]): string {
  const max = Math.max(...values) * 1.15;
  const step = (W - PAD * 2) / (values.length - 1);
  return values
    .map((v, i) => `${i === 0 ? "M" : "L"}${(PAD + i * step).toFixed(1)},${(H - PAD - (v / max) * (H - PAD * 2)).toFixed(1)}`)
    .join(" ");
}

export function LedgerSection() {
  const { t } = useTranslation();
  const [dim, setDim] = useState<"supplier" | "model">("supplier");
  const [party, setParty] = useState(false);
  const [voice, setVoice] = useState(false);
  const rows = dim === "supplier" ? LEDGER.bySupplier : LEDGER.byModel;

  return (
    <Reveal>
      <section id="ledger" className="relative scroll-mt-20 rounded-[26px] border-[1.5px] border-line bg-card p-6 shadow-soft md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-bold">{t("usage.title")}</h2>
          <div className="flex gap-2">
            {(["supplier", "model"] as const).map((d) => (
              <button key={d} onClick={() => setDim(d)}
                className={`rounded-full px-3.5 py-1 text-xs transition ${
                  dim === d ? "bg-btnp font-semibold text-btnpt" : "border border-line bg-card text-inkdim hover:text-ink"}`}>
                {t(d === "supplier" ? "usage.bySupplier" : "usage.byModel")}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-baseline gap-3">
          <span className="text-4xl font-bold tracking-tight tabular-nums">${LEDGER.total.toFixed(2)}</span>
          <span className="text-sm text-inkdim">{t("usage.total")} · {t("usage.trend")}</span>
        </div>

        <svg viewBox={`0 0 ${W} ${H}`} className="mt-4 w-full" role="img" aria-label={t("usage.trend")}>
          {[0.25, 0.5, 0.75].map((r) => (
            <line key={r} x1={PAD} x2={W - PAD} y1={PAD + r * (H - PAD * 2)} y2={PAD + r * (H - PAD * 2)}
              stroke="var(--line)" strokeDasharray="3 5" strokeWidth="1" />
          ))}
          <path d={`${trendPath(TREND)} L${W - PAD},${H - PAD} L${PAD},${H - PAD} Z`} fill="var(--status-ok)" fillOpacity="0.08" />
          <path d={trendPath(TREND)} fill="none" stroke="var(--status-ok)" strokeWidth="2.5"
            strokeLinejoin="round" strokeLinecap="round" />
        </svg>

        <ul className="mt-4 space-y-1.5">
          {rows.map((r) => (
            <li key={r.name} className="flex items-center justify-between gap-3 border-b border-line py-1.5">
              <span className="truncate font-mono text-[13px] text-ink">{r.name}</span>
              <span className="text-sm text-inkdim tabular-nums">${r.usd.toFixed(2)}</span>
            </li>
          ))}
        </ul>

        <button
          onClick={() => {
            setParty(true);
            setVoice(true);
            window.setTimeout(() => setParty(false), 1800);
          }}
          className="mt-5 rounded-[14px] bg-btnp px-4 py-2 text-sm font-semibold text-btnpt">
          {t("pet.share")}
        </button>
        {party && (
          <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[26px]">
            {Array.from({ length: 24 }).map((_, i) => (
              <span key={i} className="absolute h-2 w-2 rounded-full"
                style={{ left: `${(i * 41) % 100}%`, top: "-8px", background: STOMP[i % 4], animation: "fall 1.4s linear forwards" }} />
            ))}
          </div>
        )}
        {voice && (
          <audio autoPlay src={`${import.meta.env.BASE_URL}pet/voice/done-success.m4a`} onEnded={() => setVoice(false)} />
        )}
      </section>
    </Reveal>
  );
}

const STOMP = ["#4FC3E8", "#61D2E7", "#36BB7B", "#EAB53D"];
```

> 撒花配色沿用 P4 冻结组；section 已带 `relative` 作为撒花绝对定位上下文。数字全部 `tabular-nums`。

- [x] **Step 20.3: 重构 PetUsageScene（结构规格）**

保留：拖拽（含 pointercancel/touchAction）、待机帧动画、hover 浮窗、`pet.call` 唤出贝贝。
删除：场景内账本 panel、维度切换、USAGE 常量、独立 `pet.voice` 按钮（key 保留成死 key）、场景内撒花（迁至 LedgerSection）。
新增：

```tsx
const [statusCard, setStatusCard] = useState<null | "approval" | "done">(null);
const [notify, setNotify] = useState(false);

function fire(kind: "approval" | "done") {
  setStatusCard(kind);
  setNotify(true);
  setAnim(kind === "approval" ? "waiting" : "jumping");
  setVoiceSrc(kind === "approval" ? "approval-chicken.m4a" : "done-success.m4a");
  window.setTimeout(() => { if (kind === "done") setAnim("idle"); }, 2600);
}
```

- 场景容器改 `DesktopStage`（点阵桌面）；`<audio key={voiceSrc} autoPlay src={…} onEnded={…}>`（key 换源重播）
- 触发按钮排（替换原 call/voice 两按钮区，call 保留在首位）：
  `rounded-lg border border-line bg-card px-3 py-1.5 text-xs hover:border-btnp` ×3：t("pet.call") / t("pet.trigger.approval") / t("pet.trigger.done")
- 头顶状态卡（statusCard 非空时，framer 弹入）：狐狸 div 内 `absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-[14px] px-3 py-1.5 text-[11px] font-semibold`，approval=`bg-bdg-r text-bdg-r-t` + t("pet.card.approval")，done=`bg-bdg-g text-bdg-g-t` + t("pet.card.done")
- 通知卡（notify 时）：`NotificationCard`，title=t("pet.trigger.approval"/"pet.trigger.done")，body=t("pet.card.approval"/"pet.card.done")，点击=关通知并把 `setStatusCard` 保持、`setAnim` 维持当前（模拟「已读」）；onClose=关通知
- hover 浮窗：保留用量摘要（`$12.40 · 128k tok` + `font-mono`）+ 「详情」按钮改为滚动：`onClick={() => document.getElementById("ledger")?.scrollIntoView({ behavior: "smooth" })}`（html 已有 scroll-behavior:smooth，双保险）

- [x] **Step 20.4: DemoPage 挂账本专区**

d4 区块之后追加：

```tsx
      <section className="mt-10">
        <h2 className="mb-4 text-xl font-semibold">{t("usage.title")}</h2>
        <LedgerSection />
      </section>
```

（`LedgerSection` 内部自带 `id="ledger"` 供 D4 详情滚动定位；h2 与 section 标题二选一——**采用外层 h2 方案时去掉 LedgerSection 内部 h2**，避免双标题，实现时以 DemoPage h2 为准、LedgerSection 的标题行仅保留维度切换按钮。）

- [x] **Step 20.5: i18n +5 key（pet.trigger×2 / pet.card×2 / usage.trend）+ 验证 + Commit**

```bash
pnpm exec tsc --noEmit && pnpm test   # Expected: 15 + ledger 2 = 17 passed；parity 101 key
pnpm build && pnpm dev
# 核对：两个触发按钮 → 狐狸 waiting/jumping + 对应语音 + 头顶徽标卡 + 通知卡；hover 浮窗「详情」平滑滚到账本专区；专区维度切换/趋势线/大数字 tabular-nums/导出撒花+语音；触发按钮连点不死（timeout 清理或幂等）
git add -A && git commit -m "feat(demo): d4 manual triggers and standalone ledger section"
```

**验收标准：** 审批触发=waiting 动作+approval-chicken 语音+红徽标卡+通知；完毕触发=jumping+done-success+绿徽标卡+通知；详情滚动落在 #ledger；账本两维度切换行内重渲染、趋势线渲染无 NaN；数据不变式测试绿。

---

## P7-D · 全站验收

### Task 21: 全站验收（浏览器矩阵 + Lighthouse 复测 + 零追踪复查）

**Files:**
- Modify: `docs/superpowers/plans/progress.md`（最终验收报告）；如验收发现 P1/P2 缺陷，最小修复另起 commit

- [x] **Step 21.1: 机器验证全绿**

```bash
python scripts/hero-recut.py --check   # Expected: 0 residue, exit 0
pnpm exec tsc --noEmit && pnpm test    # Expected: 17 passed
pnpm build                             # tsc 零错误 + dist/404.html 生成
grep -riE "analytics|gtag|hotjar|plausible|umami" dist/ || echo "zero-tracking ok"
```

- [x] **Step 21.2: 浏览器矩阵（pnpm preview，逐项勾）**

- [x] zh × 亮 / zh × 暗 / en × 亮 / en × 暗 × {首页, /demo, /docs, /changelog} 全渲染，无冷蓝残留、无低对比文字（重点暗色 mut）
- [x] 首页：hero 腿隙无白斑（亮暗各看一遍）；三盏胡萝卜灯冻结色、叶随主题；HomeBoard 窗壳与 /demo D1 一致
- [x] D1：剧本 通知→双窗→转绿；手动点通知；红绿灯关窗；重播重置；chips 筛选
- [x] D2：手机批准（剧本+手动）→ 终端 ✓ 行 + 卡片转绿
- [x] D3：窗壳内勾选矩阵/预设/扫描行为与 P4 等价
- [x] D4：双触发（动作/语音/徽标卡/通知）、hover 浮窗、详情滚动、拖拽（含触屏 pointercancel）
- [x] 账本：维度切换、趋势线、大数字 tabular-nums、导出撒花+语音
- [x] 主题刷新保持、语言切换路由前缀正确、`/en/demo` 直接刷新走 404 兜底
- [x] 移动端 375px：窗壳单列堆叠不溢出、通知卡不遮关键内容、终端窗横向滚动可读

- [x] **Step 21.3: Lighthouse 复测（Chrome DevTools，/zh/ 与 /zh/demo）**

- 记录 Performance / Accessibility 分数进 progress.md
- 硬门槛：Accessibility ≥ 95（不达标必须修：标签/对比度/aria）
- Performance：不低于 P5 基线 73；≥ 90 为目标，未达 90 记录为已知待办（图片压缩属二期池 E7，本批不新增 webp 依赖）

- [x] **Step 21.4: 终 Commit + 总报告**

```bash
git add -A && git commit -m "chore: p7 acceptance pass"
# progress.md 追加 P7 总报告：任务/commit 对照表、测试计数（17）、Lighthouse 分数、遗留观察项
```

**验收标准（P7 完成的定义）：** 机器验证三项全绿；21.2 矩阵 9 大项全勾；A11y ≥ 95；四条用户反馈逐一闭环（hero 白斑=0 / 三色胡萝卜灯上线 / lpaper+npaper 全站 / 四场景窗壳化+联动+账本专区）；progress.md 有 P7 总报告。

---

## 交接备注（P8 及以后候选池）

- hero-cutout.png 1.7MB 无损重存后仍偏大：webp/压缩回补（二期 E7 池）
- 窗壳族可进一步抽 DesktopWindowLayout（多窗拖拽/z-index），当前静态定位够用，不预制
- Lighthouse Performance 若 < 90：图片 `width/height` 属性、`loading="lazy"`（首页非首屏图）、字体 FOUC 复查
- Demo 皮肤若要演示 04 号配置器的六皮肤/四字体档，可在 /demo 加"外观"开关（当前刻意不做，控制粒度）
