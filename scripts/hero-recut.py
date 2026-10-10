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
CHECK_WIN = (0.40, 0.62, 0.66, 0.90)  # 离岛扫除窗 = white_count 审计窗；窗内近白皆残留，窗外合法白色（鞋袜等）不碰


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
    # 离岛扫除（裁决 2026-10-10）：单种子洪泛覆盖不了被深色反锯齿边隔断的孤立白斑（实测 23 块 606px），
    # 在 CHECK_WIN 窗内对每个剩余近白像素做窗口有界洪泛，并入同一蒙版统一羽化。
    wx0, wx1, wy0, wy1 = (int(w * CHECK_WIN[0]), int(w * CHECK_WIN[1]),
                          int(h * CHECK_WIN[2]), int(h * CHECK_WIN[3]))
    for sy in range(wy0, wy1):
        for sx in range(wx0, wx1):
            if (sx, sy) in seen or not near_white(px[sx, sy]):
                continue
            stack = [(sx, sy)]
            while stack:
                x, y = stack.pop()
                if (x, y) in seen or not (wx0 <= x < wx1 and wy0 <= y < wy1):
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
    from PIL import ImageChops
    feathered = ImageChops.multiply(feathered, mask)         # 羽化钳制在蒙版内：蒙版外零像素改动（计划冲突裁决 2026-10-10）
    alpha = im.getchannel("A")
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
