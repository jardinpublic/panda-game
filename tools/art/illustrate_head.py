"""Turn a reference photo into an illustrated head for the game.

The photo is only a reference: the output is a painted illustration (flat
colour areas, smoothed skin, inked lines, outlined silhouette), not the photo.
Reference photos stay in the private reference/ folder and never ship.

Usage:
    python tools/art/illustrate_head.py <photo> <left> <top> <right> <bottom> <out.png>
        [--colors 16] [--height 360] [--neck-fade 40]

The crop box is in the photo's pixel coordinates (after EXIF rotation) and
should frame the head, hair and a little neck.
"""
import argparse

import numpy as np
from PIL import Image, ImageEnhance, ImageOps
from rembg import new_session, remove
from scipy import ndimage
from skimage import color, feature, measure, morphology, restoration

INK = np.array([28, 22, 26], dtype=np.float32)


def illustrate(photo, box, out, colors, height, neck_fade):
    image = ImageOps.exif_transpose(Image.open(photo)).convert("RGB").crop(box)
    cutout = remove(image, session=new_session("birefnet-general"))
    scale = height / cutout.height
    cutout = cutout.resize((round(cutout.width * scale), height), Image.LANCZOS)

    rgb = np.asarray(cutout.convert("RGB"), dtype=np.float32) / 255.0
    alpha = np.asarray(cutout.getchannel("A"), dtype=np.float32) / 255.0

    # Keep only the largest silhouette: drops background scraps the cut-out left.
    labels = measure.label(alpha > 0.5)
    if labels.max() > 1:
        largest = np.argmax(np.bincount(labels.ravel())[1:]) + 1
        keep = ndimage.binary_fill_holes(labels == largest)
        alpha = np.where(keep, alpha, 0.0)

    # 1. Smooth into painted areas: keeps edges, removes skin texture and noise.
    smooth = restoration.denoise_bilateral(rgb, sigma_color=0.07, sigma_spatial=3, channel_axis=-1)

    # 2. Flatten to a small palette, like cel or poster painting.
    flat = Image.fromarray((smooth * 255).astype(np.uint8)).quantize(
        colors=colors, method=Image.Quantize.MEDIANCUT)
    # Remove speckles: each pixel takes the most common palette index around it.
    flat = Image.fromarray(ndimage.median_filter(np.asarray(flat), size=3), "P")
    flat.putpalette(Image.fromarray((smooth * 255).astype(np.uint8)).quantize(
        colors=colors, method=Image.Quantize.MEDIANCUT).getpalette())
    flat = flat.convert("RGB")
    flat = ImageEnhance.Color(flat).enhance(1.15)
    paint = np.asarray(flat, dtype=np.float32)

    # 3. Ink lines on the features (eyes, glasses, brows, mouth, hair strands).
    gray = color.rgb2gray(smooth)
    edges = feature.canny(gray, sigma=1.4, low_threshold=0.05, high_threshold=0.13)
    edges &= ndimage.binary_erosion(alpha > 0.5, iterations=3)
    edges = morphology.remove_small_objects(edges, max_size=8)
    lines = morphology.dilation(edges, morphology.disk(1)).astype(bool)
    paint[lines] = paint[lines] * 0.25 + INK * 0.75

    # 4. Thick outline around the silhouette.
    mask = alpha > 0.5
    ring = morphology.dilation(mask, morphology.disk(3)).astype(bool) & ~ndimage.binary_erosion(mask, iterations=1)
    paint[ring] = INK
    out_alpha = np.where(ring, 1.0, alpha)

    # 5. Fade the neck out at the bottom so it sits on a drawn body.
    if neck_fade > 0:
        ramp = np.ones(out_alpha.shape[0], dtype=np.float32)
        ramp[-neck_fade:] = np.linspace(1.0, 0.0, neck_fade)
        out_alpha = out_alpha * ramp[:, None]

    rgba = np.dstack([paint, out_alpha * 255.0]).clip(0, 255).astype(np.uint8)
    Image.fromarray(rgba, "RGBA").save(out)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("photo")
    parser.add_argument("box", nargs=4, type=int)
    parser.add_argument("out")
    parser.add_argument("--colors", type=int, default=16)
    parser.add_argument("--height", type=int, default=360)
    parser.add_argument("--neck-fade", type=int, default=40)
    args = parser.parse_args()
    illustrate(args.photo, tuple(args.box), args.out, args.colors, args.height, args.neck_fade)


if __name__ == "__main__":
    main()
