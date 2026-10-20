# 兔维斯 2.5D 帧动画条（v0.1 概念素材）

来源：`Tuvis_Isometric_Sprite_Strips_v0_1`（AI 生成概念稿，未逐帧人工校正）。
每张为横向等宽条带；单元内角色脚底贴近单元底部。

| 本目录文件 | 动画 | 帧数 × 单元(px) | 原始文件名（注意：部分命名与内容不符） |
|---|---|---|---|
| tuvis2d-idle-sw.png | idle SW（含眨眼） | 6 × 362×724 | ` facing SW (front-left)..png` |
| tuvis2d-walk-se.png | walk SE | 6 × 362×724 | `WALK cycle, facing SE (front-right). .png` |
| tuvis2d-walk-nw.png | walk NW（头朝左后） | 6 × 362×724 | `tuvis-walk-ne.png`（**原文件内容朝向对调**） |
| tuvis2d-walk-ne.png | walk NE（头朝右后） | 6 × 362×724 | `tuvis-walk-nw.png`（**原文件内容朝向对调**） |
| tuvis2d-jump-se.png | jump SE | 4 × 256×320 | `tuvis-jump-se.png` |
| tuvis2d-pickup-se.png | pickup SE | 4 × 256×320 | `tuvis-pickup-se.png` |
| tuvis2d-celebrate-se.png | celebrate SE | 4 × 256×320 | `tuvis-celebrate-se.png` |
| tuvis2d-fire-se.png | fire SE（试用开火） | 4 × 543×724 | `FIRE, facing SE (front-right).png` |

WAVE SW（4×543×724）、
CODE SW（4×543×724，打字坐姿）、REVIEW SW（6×362×724，UUID 命名文件）。

弃用：`tuvis-walk-se.png `（尾随空格）经逐帧实测为**另一张 SE 朝向**条带（角色仅 58% 大小），SW 由 SE 大条带运行时镜像承担，该文件不入库。

衍生方向：idle SE = idle SW 水平镜像（CSS）；idle NW/NE 无素材，用 walk 首帧静止兜底。
已知限制：NE 行走为 NW 镜像，耳朵/护目镜左右关系反转；jump/pickup/celebrate 仅 SE，
其余方向复用或镜像 SE 帧。
