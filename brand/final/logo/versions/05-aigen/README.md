# 05 · 生图 API 路线（2026-10-10 用户定稿）

> 用户裁决放弃手绘 SVG 造型（「太丑」），改用 agnes-image-2.5-flash 以参考图 i2i 生成。
> 参考图：`../04-lockup-measured/reference.png`。

| 文件 | 说明 |
|---|---|
| `candidate-A-dark.png` | 深色原始生成（蓝框在上、深镜片） |
| `candidate-A-swap.png` | ~~深色定稿~~（已被 F 取代：程序化对调后镜片像"深槽上贴蓝片"，不是整块玻璃） |
| ~~candidate-F-final~~ | F 重新生成版：镜片对了但护目镜形状/嘴漂移，用户否（风格漂移过大） |
| ~~candidate-A-merge~~ | 矩形盖色版：目镜镂空非矩形（含鼻托），矩形没盖全、鼻托两侧露底色，用户否 |
| **`final-dark-v3.png` / `final-light-v3.png`** | **✅ 最终定稿（2026-10-10 用户裁决）**：无框、整块渐变玻璃（连通域泛洪，含鼻托），深=蓝渐变三段、浅=白→浅灰 @837/@874 |
| `candidate-H-recolor.png` / `candidate-H-final.png` | 以用户 mock 为参考的 API 改色版：仍漂移（目镜变形+斜高光），落选 |
| `candidate-G-swap.png` | F 同提示词候选：带阴影和斜向高光，落选 |
| `candidate-C-light.png` | 浅色原始生成 |
| `candidate-C-light-final.png` | **浅色定稿**（完整验收，仅切边+圆角透明化） |
| `candidate-B-dark.png` / `candidate-D-dark-noshadow.png` / `candidate-E-flat.png` | 落选候选 |

已导出：`../../extracted/13-appicon-dark.png`（←final-dark-v3 @837）、`../../extracted/14-appicon-light.png`（←final-light-v3 @874）、`../../extracted/14-appicon-light.png`（←C-final @874）。

## 最终裁决（2026-10-10）

- ✅ 定稿：**final-dark-v3 / final-light-v3**（无框、整块渐变玻璃）
- ❌ v4（藏蓝顶条）：像骑行防风镜，否
- ❌ 06-frame-candidates（半包框/竖框 + 指示灯）：要素过多，否
- 配色规格见 `COLOR-SPEC.md`（v3 版：目镜=整块渐变玻璃，不随底牌）
