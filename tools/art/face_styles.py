"""Render a composite face (see composite_face.py) in several illustration styles.

Usage:
    python tools/art/face_styles.py <composite.png> <out_dir> [--height 420]

Writes one PNG per style plus styles_sheet.jpg, a labelled comparison.
"""
import argparse
import os

import numpy as np
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageOps
from scipy import ndimage
from skimage import color, feature, morphology, restoration

INK = np.array([28, 22, 26], dtype=np.float32)


def _split(image):
    rgb = np.asarray(image.convert("RGB"), dtype=np.float32) / 255.0
    alpha = np.asarray(image.getchannel("A"), dtype=np.float32) / 255.0
    return rgb, alpha


def _join(rgb255, alpha):
    return Image.fromarray(np.dstack([np.clip(rgb255, 0, 255), np.clip(alpha, 0, 1) * 255]).astype(np.uint8), "RGBA")


def _lines(rgb, alpha, sigma, low, high, width, min_size=8):
    edges = feature.canny(color.rgb2gray(rgb), sigma=sigma, low_threshold=low, high_threshold=high)
    edges &= ndimage.binary_erosion(alpha > 0.5, iterations=3)
    edges = morphology.remove_small_objects(edges, max_size=min_size)
    return morphology.dilation(edges, morphology.disk(width)).astype(bool) if width else edges


def _outline(paint, alpha, width, strength=1.0):
    mask = alpha > 0.5
    ring = morphology.dilation(mask, morphology.disk(width)).astype(bool) & ~ndimage.binary_erosion(mask, iterations=1)
    paint[ring] = paint[ring] * (1 - strength) + INK * strength
    return np.where(ring, np.maximum(alpha, strength), alpha)


def _quantize(rgb, colors, mode_size=0):
    image = Image.fromarray((rgb * 255).astype(np.uint8)).quantize(colors=colors, method=Image.Quantize.MEDIANCUT)
    image = image.convert("RGB")
    if mode_size:
        image = image.filter(ImageFilter.ModeFilter(mode_size))
    return np.asarray(image, dtype=np.float32)


def comic_ink(image):
    rgb, alpha = _split(image)
    smooth = restoration.denoise_bilateral(rgb, sigma_color=0.07, sigma_spatial=3, channel_axis=-1)
    paint = _quantize(smooth, 18, 3)
    lines = _lines(smooth, alpha, 1.4, 0.05, 0.13, 1)
    paint[lines] = paint[lines] * 0.25 + INK * 0.75
    alpha = _outline(paint, alpha, 3)
    return _join(paint, alpha)


def oil_painting(image):
    rgb, alpha = _split(image)
    smooth = restoration.denoise_bilateral(rgb, sigma_color=0.09, sigma_spatial=5, channel_axis=-1)
    paint = _quantize(smooth, 40, 7)
    paint = np.asarray(ImageEnhance.Color(Image.fromarray(paint.astype(np.uint8))).enhance(1.25), np.float32)
    # Warm glaze
    paint = paint * np.array([1.04, 1.0, 0.94])
    alpha = _outline(paint, alpha, 2, 0.6)
    return _join(paint, alpha)


def pencil(image):
    rgb, alpha = _split(image)
    gray = color.rgb2gray(rgb)
    blur = ndimage.gaussian_filter(1.0 - gray, 6)
    sketch = np.clip(gray / np.maximum(1.0 - blur, 0.05), 0, 1) ** 2.2
    lines = _lines(rgb, alpha, 1.2, 0.04, 0.1, 0)
    sketch[lines] *= 0.35
    paper = np.array([246, 238, 222], np.float32)
    paint = sketch[..., None] * paper + (1 - sketch[..., None]) * np.array([60, 52, 50], np.float32)
    return _join(paint, alpha)


def pop_art(image):
    rgb, alpha = _split(image)
    smooth = restoration.denoise_bilateral(rgb, sigma_color=0.1, sigma_spatial=4, channel_axis=-1)
    base = Image.fromarray((smooth * 255).astype(np.uint8))
    base = ImageEnhance.Color(ImageEnhance.Contrast(base).enhance(1.3)).enhance(1.8)
    paint = np.asarray(ImageOps.posterize(base, 2).filter(ImageFilter.ModeFilter(5)), np.float32)
    # Halftone dots in the shadows
    gray = color.rgb2gray(smooth)
    ys, xs = np.mgrid[0:gray.shape[0], 0:gray.shape[1]]
    dots = ((xs % 8 - 4) ** 2 + (ys % 8 - 4) ** 2) < (1.0 - gray) * 14
    shade = dots & (gray < 0.45)
    paint[shade] = paint[shade] * 0.55
    lines = _lines(smooth, alpha, 2.0, 0.08, 0.18, 2, 20)
    paint[lines] = INK
    alpha = _outline(paint, alpha, 5)
    return _join(paint, alpha)


def watercolor(image):
    rgb, alpha = _split(image)
    smooth = restoration.denoise_bilateral(rgb, sigma_color=0.12, sigma_spatial=6, channel_axis=-1)
    paint = _quantize(smooth, 12, 7)
    # Wet edges: darken the borders between colour areas, softly
    labels = paint.sum(-1)
    borders = (ndimage.maximum_filter(labels, 3) != ndimage.minimum_filter(labels, 3)).astype(np.float32)
    borders = ndimage.gaussian_filter(borders, 1.2)
    paint = paint * (1 - 0.18 * borders[..., None])
    # Light, transparent wash towards paper white
    paint = paint * 0.82 + 255 * 0.18
    rng = np.random.default_rng(7)
    grain = ndimage.gaussian_filter(rng.normal(0, 1, alpha.shape), 1.5)
    paint = paint * (1 + 0.04 * grain[..., None])
    lines = _lines(smooth, alpha, 1.8, 0.07, 0.16, 0, 14)
    paint[lines] = paint[lines] * 0.55
    alpha = ndimage.gaussian_filter(alpha, 1.5)
    return _join(paint, alpha)


def graphic_novel(image):
    rgb, alpha = _split(image)
    smooth = restoration.denoise_bilateral(rgb, sigma_color=0.08, sigma_spatial=4, channel_axis=-1)
    flat = _quantize(smooth, 8, 5) / 255.0
    lum = color.rgb2gray(smooth)
    tone = np.select([lum < 0.33, lum < 0.62], [0.62, 0.9], 1.08)
    paint = np.clip(flat * tone[..., None], 0, 1) * 255
    paint = np.asarray(ImageEnhance.Color(Image.fromarray(paint.astype(np.uint8))).enhance(0.85), np.float32)
    lines = _lines(smooth, alpha, 1.3, 0.05, 0.12, 1)
    paint[lines] = INK
    alpha = _outline(paint, alpha, 4)
    return _join(paint, alpha)


def digital_painting(image):
    rgb, alpha = _split(image)
    smooth = restoration.denoise_bilateral(rgb, sigma_color=0.05, sigma_spatial=2, channel_axis=-1)
    paint = _quantize(smooth, 64, 3)
    img = Image.fromarray(paint.astype(np.uint8)).filter(ImageFilter.UnsharpMask(2, 60, 2))
    paint = np.asarray(ImageEnhance.Color(img).enhance(1.1), np.float32)
    alpha = _outline(paint, alpha, 2, 0.8)
    return _join(paint, alpha)


STYLES = [
    ("1 Comic ink", comic_ink),
    ("2 Oil painting", oil_painting),
    ("3 Pencil sketch", pencil),
    ("4 Pop art", pop_art),
    ("5 Watercolour", watercolor),
    ("6 Graphic novel", graphic_novel),
    ("7 Digital painting", digital_painting),
]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("composite")
    parser.add_argument("out_dir")
    parser.add_argument("--height", type=int, default=420)
    args = parser.parse_args()
    os.makedirs(args.out_dir, exist_ok=True)
    src = Image.open(args.composite).convert("RGBA")
    box = src.getchannel("A").getbbox()
    src = src.crop(box)
    src = src.resize((round(src.width * args.height / src.height), args.height), Image.LANCZOS)
    results = []
    for label, style in STYLES:
        out = style(src)
        name = label.split(" ", 1)[1].lower().replace(" ", "_")
        out.save(os.path.join(args.out_dir, f"{name}.png"))
        results.append((label, out))
    cols = 4
    cell_w, cell_h = src.width + 30, src.height + 60
    rows = (len(results) + cols - 1) // cols
    sheet = Image.new("RGBA", (cell_w * cols + 10, cell_h * rows + 10), (226, 220, 206, 255))
    draw = ImageDraw.Draw(sheet)
    for i, (label, out) in enumerate(results):
        x, y = 10 + (i % cols) * cell_w, 10 + (i // cols) * cell_h
        sheet.alpha_composite(out, (x + 10, y + 10))
        draw.text((x + 12, y + src.height + 22), label, fill=(30, 30, 40), font_size=26)
    sheet.convert("RGB").save(os.path.join(args.out_dir, "styles_sheet.jpg"), quality=90)


if __name__ == "__main__":
    main()
