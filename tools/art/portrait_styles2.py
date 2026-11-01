"""Second batch of portrait styles: genuinely different drawing techniques.

Same traced geometry as portrait_styles.py (from a blend of the person's
photos), with a thinner, more receding hairline. Some styles are drawn as
SVG, others are rasterised from the geometry and processed (pixel art,
woodcut, stencil, low-poly). No photo pixel is used anywhere.

Usage:
    python tools/art/portrait_styles2.py <out.html>
"""
import base64
import io
import math
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy.spatial import Delaunay

import portrait_styles as g

W, H = 512, 680

# Thinner, more receding hair than batch 1.
HAIR = [("M", [(126, 290)]), ("C", [(118, 250), (122, 205), (152, 172)]),
        ("C", [(182, 142), (214, 134), (240, 134)]), ("C", [(284, 134), (328, 150), (342, 188)]),
        ("C", [(350, 212), (350, 250), (347, 290)]), ("L", [(339, 290)]),
        ("C", [(338, 268), (336, 252), (330, 240)]), ("C", [(322, 226), (312, 222), (302, 222)]),
        ("C", [(288, 213), (262, 208), (240, 209)]), ("C", [(220, 209), (200, 213), (186, 220)]),
        ("C", [(172, 225), (160, 231), (152, 241)]), ("C", [(144, 253), (138, 270), (136, 290)]), ("Z", [])]
HAIR_STROKES = [((176 + i * 14, 186 + abs(i - 5) * 2), (181 + i * 14, 172 + abs(i - 5) * 2)) for i in range(11)]
P = g.path


# --- Geometry helpers -------------------------------------------------------

def flatten(cmds, warp=g.warp_identity, steps=14):
    """Bezier path -> list of polygons (one per M)."""
    polys, cur, pos = [], [], None
    for cmd, pts in cmds:
        pts = [warp(p) for p in pts]
        if cmd == "M":
            if cur:
                polys.append(cur)
            cur, pos = [pts[0]], pts[0]
        elif cmd == "L":
            cur.append(pts[0]); pos = pts[0]
        elif cmd == "Q":
            c, e = pts
            for i in range(1, steps + 1):
                t = i / steps
                cur.append(((1 - t) ** 2 * pos[0] + 2 * (1 - t) * t * c[0] + t * t * e[0],
                            (1 - t) ** 2 * pos[1] + 2 * (1 - t) * t * c[1] + t * t * e[1]))
            pos = e
        elif cmd == "C":
            c1, c2, e = pts
            for i in range(1, steps + 1):
                t = i / steps
                u = 1 - t
                cur.append((u ** 3 * pos[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t ** 3 * e[0],
                            u ** 3 * pos[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t ** 3 * e[1]))
            pos = e
    if cur:
        polys.append(cur)
    return polys


def base_image(scale=2, palette=None, lines=True):
    """Rasterises the portrait in flat colours with simple shading."""
    pal = {"bg": (0, 0, 0, 0), "shirt": (31, 32, 38), "skin": (239, 195, 162), "skin2": (217, 159, 128),
           "skin3": (192, 132, 103), "stubble": (208, 160, 128), "hair": (110, 85, 61), "ink": (26, 20, 22),
           "iris": (113, 137, 163), "white": (251, 247, 242)}
    if palette:
        pal.update(palette)
    im = Image.new("RGBA", (W * scale, H * scale), pal["bg"])
    d = ImageDraw.Draw(im, "RGBA")
    s = lambda poly: [(x * scale, y * scale) for x, y in poly]
    fill = lambda cmds, col: [d.polygon(s(p), fill=col) for p in flatten(cmds)]
    stroke = lambda cmds, col, w: [d.line(s(p), fill=col, width=int(w * scale), joint="curve") for p in flatten(cmds)]
    fill(g.SHIRT, pal["shirt"]); fill(g.NECK, pal["skin2"]); fill(g.JAW_SHADOW, pal["skin3"])
    fill(g.EAR_L, pal["skin"]); fill(g.EAR_R, pal["skin2"]); fill(g.HEAD, pal["skin"])
    fill(g.FACE_SHADOW, pal["skin2"]); fill(g.STUBBLE, pal["stubble"]); fill(HAIR, pal["hair"])
    if lines:
        for e in (g.EYE_L, g.EYE_R):
            x, y = e
            d.ellipse([(x - 15) * scale, (y - 8) * scale, (x + 15) * scale, (y + 8) * scale], fill=pal["white"])
            d.ellipse([(x - 6) * scale, (y - 7) * scale, (x + 8) * scale, (y + 7) * scale], fill=pal["iris"])
            d.ellipse([(x - 2) * scale, (y - 3) * scale, (x + 4) * scale, (y + 3) * scale], fill=pal["ink"])
        stroke(g.BROW_L, pal["hair"], 5); stroke(g.BROW_R, pal["hair"], 5)
        stroke(g.NOSE, pal["skin3"], 3); stroke(g.MOUTH, (120, 70, 60), 4)
        for r in (g.LENS_L, g.LENS_R):
            x, y, w, h = r
            d.rounded_rectangle([x * scale, y * scale, (x + w) * scale, (y + h) * scale], radius=10 * scale,
                                outline=pal["ink"], width=7 * scale)
        d.line([(237 * scale, 295 * scale), (255 * scale, 295 * scale)], fill=pal["ink"], width=6 * scale)
    return im.resize((W, H), Image.LANCZOS)


def data_uri(image):
    buf = io.BytesIO()
    image.save(buf, "PNG")
    return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()


def svg(body, bg="", defs=""):
    return f'<svg viewBox="0 0 {W} {H}" xmlns="http://www.w3.org/2000/svg"><defs>{defs}</defs>{bg}{body}</svg>'


def raster_svg(image, bg=""):
    return svg(f'<image href="{data_uri(image)}" width="{W}" height="{H}" style="image-rendering:pixelated"/>', bg)


def hair_strokes(color, width=2.0, warp=g.warp_identity, opacity=0.7):
    out = []
    for a, b in HAIR_STROKES:
        a, b = warp(a), warp(b)
        out.append(f'<line x1="{a[0]:.0f}" y1="{a[1]:.0f}" x2="{b[0]:.0f}" y2="{b[1]:.0f}" stroke="{color}" '
                   f'stroke-width="{width}" stroke-linecap="round" opacity="{opacity}"/>')
    return "".join(out)


INK = g.INK


# --- Styles -----------------------------------------------------------------

def pen_and_ink():
    """Editorial pen drawing: black line only, crosshatched shadows."""
    hatch = ('<pattern id="hx" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">'
             '<line x1="0" y1="0" x2="0" y2="7" stroke="#111" stroke-width="1.6"/></pattern>'
             '<pattern id="hx2" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(-40)">'
             '<line x1="0" y1="0" x2="0" y2="7" stroke="#111" stroke-width="1.2"/></pattern>'
             '<pattern id="st" width="5" height="5" patternUnits="userSpaceOnUse">'
             '<circle cx="2" cy="2" r="0.9" fill="#111"/></pattern>')
    l = 'fill="none" stroke="#111" stroke-linecap="round" stroke-linejoin="round"'
    b = [f'<path d="{P(g.SHIRT)}" fill="url(#hx)" stroke="#111" stroke-width="2.5"/>',
         f'<path d="{P(g.SHIRT)}" fill="url(#hx2)"/>',
         f'<path d="{P(g.NECK)}" fill="#fbf8f1" stroke="#111" stroke-width="2.5"/>',
         f'<path d="{P(g.JAW_SHADOW)}" fill="url(#hx)"/>',
         f'<path d="{P(g.EAR_L)}" fill="#fbf8f1" {l} stroke-width="2.5"/>', f'<path d="{P(g.EAR_R)}" fill="#fbf8f1" {l} stroke-width="2.5"/>',
         f'<path d="{P(g.HEAD)}" fill="#fbf8f1" {l} stroke-width="2.8"/>',
         f'<path d="{P(g.FACE_SHADOW)}" fill="url(#hx)"/>', f'<path d="{P(g.STUBBLE)}" fill="url(#st)" opacity="0.7"/>',
         f'<path d="{P(HAIR)}" fill="url(#hx2)" {l} stroke-width="2"/>', hair_strokes("#111", 1.6, opacity=0.9),
         g.eye(g.EYE_L, g.warp_identity, iris="#fff", ink="#111"), g.eye(g.EYE_R, g.warp_identity, iris="#fff", ink="#111"),
         f'<path d="{P(g.BROW_L)}" {l} stroke-width="3.5"/>', f'<path d="{P(g.BROW_R)}" {l} stroke-width="3.5"/>',
         f'<path d="{P(g.NOSE)}" {l} stroke-width="2.4"/>', f'<path d="{P(g.NOSTRILS)}" {l} stroke-width="2"/>',
         f'<path d="{P(g.UPPER_LIP)}" {l} stroke-width="2.6"/>', f'<path d="{P(g.LOWER_LIP)}" {l} stroke-width="1.5"/>',
         g.glasses(g.warp_identity, frame="#111", width=5, lens="none", glint=False)]
    return svg("".join(b), '<rect width="512" height="680" fill="#fbf8f1"/>', hatch)


def woodcut():
    """Linocut print: carved black shapes on cream, one red accent."""
    base = np.asarray(base_image().convert("L"), np.float32) / 255.0
    alpha = np.asarray(base_image().getchannel("A"), np.float32) / 255.0
    ys, xs = np.mgrid[0:H, 0:W]
    carve = 0.5 + 0.5 * np.sin((ys + 0.35 * xs) / 3.2)  # carved stripes for mid tones
    from scipy import ndimage
    edges = np.hypot(ndimage.sobel(base, 0), ndimage.sobel(base, 1)) > 0.35
    ink = (base < 0.35) | ((base < 0.8) & (carve > base * 1.15)) | edges
    out = np.zeros((H, W, 4), np.uint8)
    out[..., :3] = np.where(ink[..., None], [28, 22, 22], [243, 233, 210])
    out[..., 3] = (alpha > 0.5) * 255
    img = Image.fromarray(out, "RGBA").filter(ImageFilter.ModeFilter(3))
    return raster_svg(img, '<rect width="512" height="680" fill="#c8402d"/><circle cx="256" cy="330" r="235" fill="#f3e9d2"/>'
                           '<circle cx="256" cy="330" r="235" fill="none" stroke="#1c1616" stroke-width="10"/>')


def pixel_art():
    """16-bit game sprite: 64x85 pixels, small palette."""
    small = base_image(scale=1).resize((64, 85), Image.BOX)
    q = small.convert("RGB").quantize(colors=14, method=Image.Quantize.MEDIANCUT).convert("RGB")
    rgba = np.dstack([np.asarray(q), (np.asarray(small.getchannel("A")) > 128) * 255]).astype(np.uint8)
    img = Image.fromarray(rgba, "RGBA")
    # 1-pixel dark outline around the sprite
    a = np.asarray(img.getchannel("A")) > 0
    from scipy import ndimage
    ring = ndimage.binary_dilation(a) & ~a
    arr = np.asarray(img).copy()
    arr[ring] = [20, 16, 24, 255]
    img = Image.fromarray(arr, "RGBA").resize((W, H), Image.NEAREST)
    return raster_svg(img, '<rect width="512" height="680" fill="#5b6ee1"/><rect y="520" width="512" height="160" fill="#3f4fbf"/>')


def watercolour():
    """Loose watercolour washes over a light pencil drawing."""
    defs = ('<filter id="wc" x="-10%" y="-10%" width="120%" height="120%">'
            '<feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="3" seed="4"/>'
            '<feDisplacementMap in="SourceGraphic" scale="16"/><feGaussianBlur stdDeviation="1.6"/></filter>'
            '<filter id="paper"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2"/>'
            '<feColorMatrix values="0 0 0 0 0.45  0 0 0 0 0.4  0 0 0 0 0.35  0 0 0 0.08 0"/></filter>')
    pen = 'fill="none" stroke="#6b5a50" stroke-width="1.6" stroke-linecap="round" opacity="0.85"'
    b = [f'<g filter="url(#wc)" opacity="0.88">',
         f'<path d="{P(g.SHIRT)}" fill="#3e5c86" opacity="0.75"/>', f'<path d="{P(g.NECK)}" fill="#e7a98a" opacity="0.7"/>',
         f'<path d="{P(g.HEAD)}" fill="#f1bf9d" opacity="0.7"/>', f'<path d="{P(g.EAR_L)}" fill="#eeb090" opacity="0.7"/>',
         f'<path d="{P(g.EAR_R)}" fill="#e3a283" opacity="0.7"/>',
         f'<path d="{P(g.FACE_SHADOW)}" fill="#cf8a6c" opacity="0.5"/>', f'<path d="{P(g.STUBBLE)}" fill="#9c7860" opacity="0.35"/>',
         f'<path d="{P(HAIR)}" fill="#7a5c40" opacity="0.65"/>', '<ellipse cx="200" cy="225" rx="50" ry="22" fill="#fff" opacity="0.4"/>',
         '</g>',
         f'<path d="{P(g.HEAD)}" {pen}/>', f'<path d="{P(HAIR)}" {pen}/>', f'<path d="{P(g.SHIRT)}" {pen}/>',
         g.eye(g.EYE_L, g.warp_identity, ink="#5a4a40"), g.eye(g.EYE_R, g.warp_identity, ink="#5a4a40"),
         f'<path d="{P(g.BROW_L)}" {pen} stroke-width="3"/>', f'<path d="{P(g.BROW_R)}" {pen} stroke-width="3"/>',
         f'<path d="{P(g.NOSE)}" {pen}/>', f'<path d="{P(g.MOUTH)}" fill="none" stroke="#a5584a" stroke-width="2.5"/>',
         g.glasses(g.warp_identity, frame="#2b2b33", width=4.5, lens="none", glint=False),
         '<rect width="512" height="680" filter="url(#paper)"/>']
    return svg("".join(b), '<rect width="512" height="680" fill="#fbf6ec"/>', defs)


def low_poly():
    """Faceted low-poly: triangles coloured from the shaded drawing."""
    base = base_image()
    arr = np.asarray(base, np.float32)
    rng = np.random.default_rng(3)
    pts = [(x, y) for x in range(0, W + 1, 32) for y in range(0, H + 1, 32)]
    pts += [tuple(p) for p in rng.uniform([0, 0], [W, H], (260, 2))]
    for cmds in (g.HEAD, HAIR, g.SHIRT, g.NECK, g.STUBBLE, g.FACE_SHADOW):
        for poly in flatten(cmds, steps=4):
            pts += poly[::2]
    for e in (g.EYE_L, g.EYE_R):
        pts += [(e[0] + dx, e[1] + dy) for dx, dy in ((-18, 0), (18, 0), (0, -10), (0, 10))]
    pts = np.array(pts)
    tri = Delaunay(pts)
    polys = []
    for simplex in tri.simplices:
        p = pts[simplex]
        cx, cy = p.mean(0)
        r, gg, b, a = arr[int(min(max(cy, 0), H - 1)), int(min(max(cx, 0), W - 1))]
        if a < 100:
            continue
        shade = 0.92 + 0.16 * ((p[0][0] + p[1][1]) % 7) / 7.0
        col = f"rgb({min(255,int(r*shade))},{min(255,int(gg*shade))},{min(255,int(b*shade))})"
        polys.append(f'<polygon points="{" ".join(f"{x:.0f},{y:.0f}" for x, y in p)}" fill="{col}" stroke="{col}" stroke-width="0.6"/>')
    body = "".join(polys) + g.glasses(g.warp_identity, frame="#16161a", width=4, lens="none", glint=False)
    return svg(body, '<rect width="512" height="680" fill="#203040"/>')


def pop_art():
    """Roy-Lichtenstein-like pop art: thick lines, Ben-Day dots, speech balloon."""
    defs = ('<pattern id="bd" width="10" height="10" patternUnits="userSpaceOnUse"><circle cx="5" cy="5" r="3" fill="#e9776a"/></pattern>'
            '<pattern id="bd2" width="12" height="12" patternUnits="userSpaceOnUse"><circle cx="6" cy="6" r="4.2" fill="#2e6fd1"/></pattern>')
    st = 'stroke="#000" stroke-width="7" stroke-linejoin="round"'
    b = [f'<path d="{P(g.SHIRT)}" fill="#1b4fb5" {st}/>', f'<path d="{P(g.NECK)}" fill="#f8d9b8" {st}/>',
         f'<path d="{P(g.EAR_L)}" fill="#f8d9b8" {st}/>', f'<path d="{P(g.EAR_R)}" fill="#f8d9b8" {st}/>',
         f'<path d="{P(g.HEAD)}" fill="#f8d9b8" {st}/>', f'<path d="{P(g.HEAD)}" fill="url(#bd)" opacity="0.65"/>',
         f'<path d="{P(g.FACE_SHADOW)}" fill="#000" opacity="0.85"/>',
         f'<path d="{P(HAIR)}" fill="#f2c200" {st}/>', hair_strokes("#000", 3, opacity=1),
         g.eye(g.EYE_L, g.warp_identity, iris="#2e6fd1", ink="#000"), g.eye(g.EYE_R, g.warp_identity, iris="#2e6fd1", ink="#000"),
         f'<path d="{P(g.BROW_L)}" fill="none" stroke="#000" stroke-width="7" stroke-linecap="round"/>',
         f'<path d="{P(g.BROW_R)}" fill="none" stroke="#000" stroke-width="7" stroke-linecap="round"/>',
         f'<path d="{P(g.NOSE)}" fill="none" stroke="#000" stroke-width="5" stroke-linecap="round"/>',
         f'<path d="{P(g.UPPER_LIP)}" fill="none" stroke="#000" stroke-width="5"/>',
         f'<path d="{P(g.LOWER_LIP)}" fill="#e2231a" stroke="#000" stroke-width="3"/>',
         g.glasses(g.warp_identity, frame="#000", width=10, lens="rgba(255,255,255,0.35)"),
         '<path d="M 300,40 h 190 a 20 20 0 0 1 20 20 v 70 a 20 20 0 0 1 -20 20 h -120 l -40 40 l 5 -40 h -35 a 20 20 0 0 1 -20 -20 v -70 a 20 20 0 0 1 20 -20 z" fill="#fff" stroke="#000" stroke-width="6"/>',
         '<text x="395" y="115" text-anchor="middle" font-family="Impact, Arial Black, sans-serif" font-size="48" fill="#000">HOHO!</text>']
    return svg("".join(b), '<rect width="512" height="680" fill="#e2231a"/><rect width="512" height="680" fill="url(#bd2)" opacity="0.35"/>', defs)


def stencil():
    """Street-art stencil: three sprayed tones on a wall."""
    base = base_image()
    gray = np.asarray(base.convert("L"), np.float32)
    alpha = np.asarray(base.getchannel("A")) > 128
    tones = np.digitize(gray, [70, 170])
    colors = np.array([[22, 22, 26], [212, 47, 74], [246, 240, 228]], np.uint8)
    rgb = colors[tones]
    rng = np.random.default_rng(11)
    spray = rng.random((H, W)) < 0.05
    out = np.dstack([rgb, alpha * 255]).astype(np.uint8)
    out[spray & alpha, 3] = 0  # overspray holes
    img = Image.fromarray(out, "RGBA").filter(ImageFilter.ModeFilter(5))
    wall = ''.join(f'<rect x="{(j % 2) * -40 + i * 80}" y="{j * 40}" width="76" height="36" fill="#8f8a84"/>'
                   for j in range(18) for i in range(8))
    return raster_svg(img, f'<rect width="512" height="680" fill="#6f6a66"/>{wall}')


def clay_3d():
    """Clay / 3D render look: soft volumes, gradients, specular, no lines."""
    defs = ('<radialGradient id="ck" cx="0.38" cy="0.35" r="0.75"><stop offset="0" stop-color="#ffdcc4"/>'
            '<stop offset="0.55" stop-color="#eeb28f"/><stop offset="1" stop-color="#b8735a"/></radialGradient>'
            '<radialGradient id="ch" cx="0.4" cy="0.25" r="0.9"><stop offset="0" stop-color="#9a7a58"/><stop offset="1" stop-color="#4b3624"/></radialGradient>'
            '<radialGradient id="cs" cx="0.4" cy="0.2" r="1"><stop offset="0" stop-color="#4a4e5c"/><stop offset="1" stop-color="#16171d"/></radialGradient>'
            '<filter id="sh"><feDropShadow dx="0" dy="10" stdDeviation="10" flood-opacity="0.35"/></filter>'
            '<filter id="bl"><feGaussianBlur stdDeviation="6"/></filter>')
    b = [f'<path d="{P(g.SHIRT)}" fill="url(#cs)" filter="url(#sh)"/>', f'<path d="{P(g.NECK)}" fill="#c98466"/>',
         f'<path d="{P(g.EAR_L)}" fill="url(#ck)"/>', f'<path d="{P(g.EAR_R)}" fill="url(#ck)"/>',
         f'<path d="{P(g.HEAD)}" fill="url(#ck)" filter="url(#sh)"/>',
         f'<path d="{P(g.STUBBLE)}" fill="#8c6450" opacity="0.28" filter="url(#bl)"/>',
         f'<path d="{P(HAIR)}" fill="url(#ch)" filter="url(#sh)"/>',
         '<ellipse cx="195" cy="205" rx="30" ry="12" fill="#fff" opacity="0.35" filter="url(#bl)"/>',
         '<ellipse cx="175" cy="352" rx="22" ry="14" fill="#f28d7a" opacity="0.35" filter="url(#bl)"/>',
         '<ellipse cx="318" cy="352" rx="18" ry="12" fill="#f28d7a" opacity="0.3" filter="url(#bl)"/>',
         g.eye(g.EYE_L, g.warp_identity, ink="#3a2a22", scale=1.1), g.eye(g.EYE_R, g.warp_identity, ink="#3a2a22", scale=1.1),
         f'<path d="{P(g.BROW_L)}" fill="none" stroke="#4b3624" stroke-width="7" stroke-linecap="round"/>',
         f'<path d="{P(g.BROW_R)}" fill="none" stroke="#4b3624" stroke-width="7" stroke-linecap="round"/>',
         '<ellipse cx="252" cy="372" rx="16" ry="22" fill="#e8a283"/><ellipse cx="247" cy="362" rx="5" ry="8" fill="#fff" opacity="0.45"/>',
         f'<path d="{P(g.MOUTH)}" fill="none" stroke="#8b4a3d" stroke-width="5" stroke-linecap="round"/>',
         g.glasses(g.warp_identity, frame="#1d1d22", width=9, lens="rgba(220,235,245,0.2)")]
    return svg("".join(b), '<rect width="512" height="680" fill="#cfe3dc"/><ellipse cx="256" cy="690" rx="260" ry="40" fill="#b5ccc4"/>', defs)


def manga():
    """Manga / anime: fine lines, sharp chin, big glossy eyes, screentone."""
    def warp(p):
        x, y = p
        if y > 380:
            t = min((y - 380) / 100.0, 1.0)
            return (250 + (x - 250) * (1 - 0.18 * t), y - 8 * t)
        return p
    defs = ('<pattern id="tone" width="6" height="6" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="1.2" fill="#555"/></pattern>'
            '<linearGradient id="sp" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity="0.9"/></linearGradient>')
    st = 'stroke="#222" stroke-width="2.4" stroke-linejoin="round"'
    b = [f'<path d="{P(g.SHIRT, warp)}" fill="#2a2d3a" {st}/>', f'<path d="{P(g.NECK, warp)}" fill="#fbe3d3" {st}/>',
         f'<path d="{P(g.EAR_L, warp)}" fill="#fbe3d3" {st}/>', f'<path d="{P(g.EAR_R, warp)}" fill="#fbe3d3" {st}/>',
         f'<path d="{P(g.HEAD, warp)}" fill="#fbe3d3" {st}/>', f'<path d="{P(g.FACE_SHADOW, warp)}" fill="url(#tone)" opacity="0.6"/>',
         f'<path d="{P(HAIR, warp)}" fill="#7b5b45" {st}/>', hair_strokes("#4a3426", 2),
         g.eye(g.EYE_L, warp, iris="#5c86c4", ink="#222", scale=1.45), g.eye(g.EYE_R, warp, iris="#5c86c4", ink="#222", scale=1.45),
         f'<path d="{P(g.BROW_L, warp)}" fill="none" stroke="#4a3426" stroke-width="3" stroke-linecap="round"/>',
         f'<path d="{P(g.BROW_R, warp)}" fill="none" stroke="#4a3426" stroke-width="3" stroke-linecap="round"/>',
         '<path d="M 254,372 L 248,384" stroke="#222" stroke-width="2" stroke-linecap="round"/>',
         '<path d="M 230,422 Q 250,428 270,421" fill="none" stroke="#222" stroke-width="2.4" stroke-linecap="round"/>',
         '<ellipse cx="180" cy="360" rx="18" ry="6" fill="#f4a6a0" opacity="0.6"/><ellipse cx="322" cy="360" rx="16" ry="6" fill="#f4a6a0" opacity="0.6"/>',
         g.glasses(warp, frame="#222", width=4, lens="rgba(255,255,255,0.12)"),
         '<path d="M 0,0 L 512,0 L 512,90 L 0,160 Z" fill="url(#sp)" opacity="0.4"/>']
    lines = "".join(f'<line x1="256" y1="330" x2="{256 + 600 * math.cos(a)}" y2="{330 + 600 * math.sin(a)}" stroke="#dfe6f3" stroke-width="3"/>'
                    for a in np.linspace(0, 2 * math.pi, 48, endpoint=False))
    return svg("".join(b), f'<rect width="512" height="680" fill="#f4f7fd"/>{lines}', defs)


def noir():
    """Film-noir graphic novel: pure black and white, hard shadows, one red accent."""
    st = 'stroke="#000" stroke-width="3"'
    b = [f'<path d="{P(g.SHIRT)}" fill="#000"/>', f'<path d="{P(g.NECK)}" fill="#fff" {st}/>',
         f'<path d="{P(g.JAW_SHADOW)}" fill="#000"/>',
         f'<path d="{P(g.EAR_L)}" fill="#fff" {st}/>', f'<path d="{P(g.EAR_R)}" fill="#000"/>',
         f'<path d="{P(g.HEAD)}" fill="#fff" {st}/>',
         '<path d="M 250,140 C 300,150 352,200 350,290 C 348,370 320,450 252,478 C 290,430 300,370 292,320 C 284,260 270,190 250,140 Z" fill="#000"/>',
         f'<path d="{P(HAIR)}" fill="#000"/>',
         g.eye(g.EYE_L, g.warp_identity, iris="#000", ink="#000"),
         f'<path d="{P(g.BROW_L)}" fill="none" stroke="#000" stroke-width="6" stroke-linecap="round"/>',
         f'<path d="{P(g.NOSE)}" fill="none" stroke="#000" stroke-width="4"/>',
         '<path d="M 213,421 C 230,425 245,425 252,423" fill="none" stroke="#000" stroke-width="4"/>',
         f'<path d="{g.rect_path(g.LENS_L)}" fill="none" stroke="#000" stroke-width="7"/>',
         f'<path d="{g.rect_path(g.LENS_R)}" fill="none" stroke="#fff" stroke-width="5"/>',
         '<line x1="237" y1="295" x2="255" y2="295" stroke="#000" stroke-width="6"/>',
         '<path d="M 248,180 L 262,196" stroke="#fff" stroke-width="2"/>',
         '<circle cx="410" cy="560" r="12" fill="#d0021b"/><text x="430" y="568" font-family="Georgia" font-size="22" fill="#fff" font-style="italic">rhum</text>']
    rain = "".join(f'<line x1="{x}" y1="{y}" x2="{x - 8}" y2="{y + 30}" stroke="#555" stroke-width="1.5"/>'
                   for x, y in zip(range(10, 512, 23), [((i * 97) % 640) for i in range(23)]))
    return svg("".join(b), f'<rect width="512" height="680" fill="#9a9a9a"/>{rain}')


def paper_cutout():
    """Layered paper cut-out collage with drop shadows and paper grain."""
    defs = ('<filter id="pc"><feDropShadow dx="3" dy="5" stdDeviation="3" flood-opacity="0.4"/></filter>'
            '<filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="1.2" numOctaves="2" result="n"/>'
            '<feColorMatrix in="n" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.12 0"/><feComposite in2="SourceGraphic" operator="in"/></filter>')
    def layer(d, col, rot=0, dx=0, dy=0):
        return (f'<g transform="translate({dx},{dy}) rotate({rot} 256 330)" filter="url(#pc)"><path d="{d}" fill="{col}"/>'
                f'<path d="{d}" fill="#000" filter="url(#grain)"/></g>')
    b = [layer(P(g.SHIRT), "#2f6f6a", 1), layer(P(g.NECK), "#e2a284"),
         layer(P(g.EAR_L), "#efb898"), layer(P(g.EAR_R), "#e2a284"), layer(P(g.HEAD), "#f2c4a4", -1),
         layer(P(g.STUBBLE), "#c8957a", -1, 0, 2), layer(P(HAIR), "#6c5038", 2, 0, -3),
         layer(g.rect_path(g.LENS_L), "#1c1c22", -2), layer(g.rect_path(g.LENS_R), "#1c1c22", 2),
         f'<path d="{g.rect_path((151,291,78,36))}" fill="#f6efe2" transform="rotate(-2 256 330)"/>',
         f'<path d="{g.rect_path((263,289,76,36))}" fill="#f6efe2" transform="rotate(2 256 330)"/>',
         '<circle cx="207" cy="308" r="7" fill="#3c5a80"/><circle cx="305" cy="306" r="7" fill="#3c5a80"/>',
         layer('M 240,330 L 228,384 L 266,390 Z', "#e2a284"), layer('M 214,416 Q 250,430 290,415 Q 250,424 214,416 Z', "#b5584b"),
         '<rect x="232" y="291" width="30" height="8" fill="#1c1c22"/>']
    return svg("".join(b), '<rect width="512" height="680" fill="#f3d9a7"/><rect x="30" y="40" width="452" height="600" fill="#e7c48a" transform="rotate(-3 256 340)"/>', defs)


def single_line():
    """Minimal single-line drawing over one soft colour blob."""
    l = 'fill="none" stroke="#1d1d1f" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"'
    b = ['<ellipse cx="270" cy="350" rx="170" ry="210" fill="#f6b8a0" opacity="0.7"/>',
         '<circle cx="190" cy="300" r="70" fill="#a8d5e2" opacity="0.6"/>',
         f'<path d="{P(g.HEAD)}" {l}/>', f'<path d="{P(HAIR)}" {l}/>', f'<path d="{P(g.EAR_L)}" {l}/>',
         f'<path d="{P(g.COLLAR)}" {l}/>', '<path d="M 178,440 L 174,520 M 312,430 L 318,512" ' + l + '/>',
         f'<path d="{P(g.BROW_L)}" {l}/>', f'<path d="{P(g.BROW_R)}" {l}/>', f'<path d="{P(g.NOSE)}" {l}/>',
         f'<path d="{P(g.MOUTH)}" {l}/>', '<circle cx="207" cy="306" r="3" fill="#1d1d1f"/><circle cx="305" cy="305" r="3" fill="#1d1d1f"/>',
         g.glasses(g.warp_identity, frame="#1d1d1f", width=3, lens="none", glint=False)]
    return svg("".join(b), '<rect width="512" height="680" fill="#fffdf8"/>')


STYLES = [
    ("1", "Pen and ink", "Editorial drawing, crosshatched shadows", pen_and_ink),
    ("2", "Woodcut", "Carved linocut print, black on cream", woodcut),
    ("3", "Pixel art", "16-bit game sprite", pixel_art),
    ("4", "Watercolour", "Loose washes over a pencil drawing", watercolour),
    ("5", "Low-poly", "Faceted geometric triangles", low_poly),
    ("6", "Pop art", "Thick lines, Ben-Day dots, speech balloon", pop_art),
    ("7", "Street stencil", "Three sprayed tones on a wall", stencil),
    ("8", "Clay / 3D", "Soft volumes like a toy figure or 3D render", clay_3d),
    ("9", "Manga", "Fine lines, big glossy eyes, screentone", manga),
    ("10", "Film noir", "Black and white, hard shadows, one red accent", noir),
    ("11", "Paper cut-out", "Layered paper collage with shadows", paper_cutout),
    ("12", "Single line", "Minimal continuous line over a colour blob", single_line),
]


def main():
    cards = [f'<figure><div class="art">{fn()}</div><figcaption><b>{k}. {n}</b><span>{d}</span></figcaption></figure>'
             for k, n, d, fn in STYLES]
    html = ("<!doctype html><html><head><meta charset='utf-8'><title>Panda styles 2</title><style>"
            "body{margin:0;padding:20px;background:#ece7de;font-family:system-ui,sans-serif;color:#222}"
            "h1{font-size:22px;margin:0 0 14px}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:16px}"
            "figure{margin:0;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px #0002}"
            ".art svg{display:block;width:100%;height:auto}figcaption{padding:8px 12px;display:flex;flex-direction:column;gap:2px;font-size:13px}"
            "</style></head><body><h1>Panda — 12 drawing styles (thinner hair)</h1><div class='grid'>" + "".join(cards) + "</div></body></html>")
    with open(sys.argv[1], "w", encoding="utf-8") as f:
        f.write(html)


if __name__ == "__main__":
    main()
