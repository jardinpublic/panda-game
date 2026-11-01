"""Blend several photos of one person into a single composite face.

Each photo is aligned on the person's two eye centres (given by hand), cut
out from its background, then all are averaged. The composite keeps what is
consistently that person's face and smooths out each photo's lighting, angle
and expression quirks. It is a reference for the illustration styles, never
shipped as is.

Usage:
    python tools/art/composite_face.py <out.png> <photo>:<lx>,<ly>,<rx>,<ry>[:<weight>] ...

The first photo gives the head's outline, so list the cleanest one first.
"""
import sys

import numpy as np
from PIL import Image, ImageFilter, ImageOps
from rembg import new_session, remove

CANVAS = (512, 680)
LEFT_EYE = np.array([206.0, 300.0])
RIGHT_EYE = np.array([306.0, 300.0])


def align(photo, left, right):
    """Returns the photo warped so its eyes land on LEFT_EYE and RIGHT_EYE."""
    image = ImageOps.exif_transpose(Image.open(photo)).convert("RGB")
    src = np.array(right, float) - np.array(left, float)
    dst = RIGHT_EYE - LEFT_EYE
    scale = np.linalg.norm(src) / np.linalg.norm(dst)
    angle = np.arctan2(src[1], src[0]) - np.arctan2(dst[1], dst[0])
    cos, sin = np.cos(angle) * scale, np.sin(angle) * scale
    # Inverse map: canvas point p -> photo point = R * (p - LEFT_EYE) + left
    a, b = cos, -sin
    d, e = sin, cos
    c = left[0] - a * LEFT_EYE[0] - b * LEFT_EYE[1]
    f = left[1] - d * LEFT_EYE[0] - e * LEFT_EYE[1]
    return image.transform(CANVAS, Image.AFFINE, (a, b, c, d, e, f), Image.BICUBIC)


def neck_limit():
    """Keeps head, hair and neck; drops shoulders and anything below."""
    ys, xs = np.mgrid[0:CANVAS[1], 0:CANVAS[0]]
    cx = (LEFT_EYE[0] + RIGHT_EYE[0]) / 2
    # Below the cheekbones the allowed width narrows along the jaw to the neck.
    half_width = np.interp(ys, [0, 470, 520, 700], [400, 400, 75, 75])
    keep = np.abs(xs - cx) < half_width
    fade = np.clip((570.0 - ys) / 50.0, 0, 1)
    return keep * fade


def below_chin_skin(rgb):
    """Below the mouth, keeps skin-coloured pixels only: the jaw and neck stay,
    shirts, hands-off props and pets go. Above, everything is kept (hair)."""
    from scipy import ndimage
    from skimage import color
    ycbcr = color.rgb2ycbcr(np.clip(rgb, 0, 255) / 255.0)
    cb, cr = ycbcr[..., 1], ycbcr[..., 2]
    skin = (cr > 133) & (cr < 180) & (cb > 77) & (cb < 135)
    skin = ndimage.binary_opening(skin, iterations=2)
    skin = ndimage.binary_closing(skin, iterations=3)
    ys = np.arange(CANVAS[1])[:, None]
    keep = np.where(ys < 380, True, skin)
    labels, count = ndimage.label(keep)
    if count > 1:
        sizes = ndimage.sum(keep, labels, range(1, count + 1))
        keep = labels == (np.argmax(sizes) + 1)
    keep = ndimage.binary_fill_holes(keep)
    return ndimage.gaussian_filter(keep.astype(float), 1.5)


def main():
    out = sys.argv[1]
    session = new_session("birefnet-general")
    stack, alphas, weights = [], [], []
    for spec in sys.argv[2:]:
        parts = spec.rsplit(":", 2) if spec.count(":") >= 2 and not spec[1:3] == ":\\" else spec.rsplit(":", 1)
        photo, coords = parts[0], parts[1]
        weights.append(float(parts[2]) if len(parts) > 2 else 1.0)
        lx, ly, rx, ry = (float(v) for v in coords.split(","))
        aligned = align(photo, (lx, ly), (rx, ry))
        cut = remove(aligned, session=session)
        alpha = np.asarray(cut.getchannel("A"), float) / 255.0
        rgb = np.asarray(aligned, float)
        # Even out each photo's exposure before blending.
        face = rgb[260:420, 170:342]
        rgb = rgb * (np.array([205.0, 160.0, 140.0]) / np.maximum(face.reshape(-1, 3).mean(0), 1.0)) ** 0.5
        stack.append(rgb)
        alphas.append(alpha)
    stack = np.array(stack)
    alphas = np.array(alphas)
    weights = np.array(weights)
    # Per-pixel median over the photos that show the person there: anything only
    # one photo has (a parrot, a hand, a shadow) is voted out.
    masked = np.where(alphas[..., None] > 0.5, stack, np.nan)
    with np.errstate(all="ignore"):
        median = np.nanmedian(masked, axis=0)
    mean = (stack * alphas[..., None] * weights[:, None, None, None]).sum(0) / np.maximum(
        (alphas[..., None] * weights[:, None, None, None]).sum(0), 1e-6)
    rgb = np.where(np.isnan(median), mean, 0.65 * median + 0.35 * mean)
    # The outline comes from the first photo (pick the cleanest one first);
    # the face inside it blends all photos.
    alpha = alphas[0] * neck_limit()
    alpha = alpha * below_chin_skin(np.nan_to_num(rgb))
    image = Image.fromarray(np.dstack([np.nan_to_num(rgb).clip(0, 255), alpha * 255]).astype(np.uint8), "RGBA")
    image = image.filter(ImageFilter.UnsharpMask(radius=2, percent=90, threshold=2))
    image.save(out)


if __name__ == "__main__":
    main()
