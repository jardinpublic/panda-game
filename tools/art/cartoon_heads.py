"""Cartoon heads for the gang: rounder, bigger eyes, soft shading, coloured outlines.

Each friend is a list of traits (head shape, hair, eyes, glasses, nose, mouth,
beard) chosen to keep them recognisable; the drawing code is shared, so the
gang looks like one family. Same frame as the old heads (viewBox 20 20 360 440,
neck at the bottom), so the game uses them unchanged.

    python tools/art/cartoon_heads.py              # preview: web/public/cast-new/
    python tools/art/cartoon_heads.py --install    # game: web/public/cast/ + assets/
Prints the eye table used by web/src/marathon/games/sofa.js.
"""
import json
import os
import sys

CX = 200.0
# The face is drawn at full size, then scaled and lowered into the frame.
SCALE = 0.86
SHIFT = 26


def smooth(points, closed=True, tension=0.55):
    """Catmull-Rom through points -> SVG cubic path."""
    n = len(points)
    pts = points + points[:2] if closed else [points[0]] + points + [points[-1]]
    start = pts[0] if closed else pts[1]
    d = f"M {start[0]:.1f},{start[1]:.1f}"
    rng = range(n) if closed else range(1, n)
    for i in rng:
        p0, p1, p2 = pts[i - 1], pts[i], pts[i + 1]
        p3 = pts[i + 2] if i + 2 < len(pts) else p2
        c1 = (p1[0] + (p2[0] - p0[0]) * tension / 3, p1[1] + (p2[1] - p0[1]) * tension / 3)
        c2 = (p2[0] - (p3[0] - p1[0]) * tension / 3, p2[1] - (p3[1] - p1[1]) * tension / 3)
        d += f" C {c1[0]:.1f},{c1[1]:.1f} {c2[0]:.1f},{c2[1]:.1f} {p2[0]:.1f},{p2[1]:.1f}"
    return d + (" Z" if closed else "")


def mirror(half):
    """Right half points (x >= CX, top to bottom) -> full closed outline."""
    right = [(CX + dx, y) for dx, y in half]
    left = [(CX - dx, y) for dx, y in reversed(half) if dx > 0.5]
    return right + left


def path(d, fill="none", stroke="none", sw=0, extra=""):
    s = f' stroke="{stroke}" stroke-width="{sw}" stroke-linecap="round" stroke-linejoin="round"' if stroke != "none" else ""
    return f'<path d="{d}" fill="{fill}"{s} {extra}/>'


def darker(hex_color, k=0.75):
    r, g, b = (int(hex_color[i:i + 2], 16) for i in (1, 3, 5))
    return "#%02x%02x%02x" % (int(r * k), int(g * k), int(b * k))


def lighter(hex_color, k=0.35):
    r, g, b = (int(hex_color[i:i + 2], 16) for i in (1, 3, 5))
    return "#%02x%02x%02x" % (int(r + (255 - r) * k), int(g + (255 - g) * k), int(b + (255 - b) * k))


# --- the face -------------------------------------------------------------------

def head_shape(h):
    """Half outline from the crown down to the chin, mirrored."""
    top, chin, w, jaw, cw, cy = h["top"], h["chin"], h["w"], h["jaw"], h["chin_w"], h["cheek_y"]
    half = [(0, top), (w * 0.62, top + 10), (w * 0.92, top + 55), (w, cy - 40), (w * 0.99, cy),
            (jaw + (w - jaw) * 0.45, cy + (chin - cy) * 0.5), (jaw, chin - 38), (cw, chin - 6), (0, chin)]
    return mirror(half)


def ears(p, line):
    h = p["head"]
    out = []
    y = h["ear_y"]
    k = p.get("ears", 1.0)
    for side in (-1, 1):
        x = CX + side * (h["w"] - 4)
        d = (f"M {x},{y - 26 * k} C {x + side * 30 * k},{y - 36 * k} {x + side * 34 * k},{y + 18 * k} {x + side * 4},{y + 26 * k}")
        out.append(path(d + " Z", p["skin"], line, 4))
        out.append(path(f"M {x + side * 6},{y - 12} C {x + side * 20},{y - 14} {x + side * 20},{y + 8} {x + side * 8},{y + 12}", "none", darker(p["skin"], 0.7), 3))
    return "".join(out)


def eye(p, side):
    e = p["eyes"]
    x = CX + side * e["dx"]
    y = e["y"]
    s = e.get("size", 1.0)
    rx, ry = 17 * s, 20 * s
    kind = e.get("kind", "open")
    line = "#2a1a14"
    out = []
    if kind == "happy":
        # Closed smiling eyes: just a thick arch.
        return path(f"M {x - rx},{y + 4} Q {x},{y - ry * 1.1} {x + rx},{y + 4}", "none", line, 6), (x, y, rx, ry * 0.5)
    out.append(f'<ellipse cx="{x}" cy="{y}" rx="{rx}" ry="{ry}" fill="#ffffff"/>')
    look = e.get("look", 0)
    ix, iy = x + look * 4 + side * -1, y + 2
    out.append(f'<circle cx="{ix}" cy="{iy}" r="{11 * s}" fill="{e.get("iris", "#5b3a29")}"/>')
    out.append(f'<circle cx="{ix}" cy="{iy}" r="{6 * s}" fill="#120c0a"/>')
    out.append(f'<circle cx="{ix + 4 * s}" cy="{iy - 5 * s}" r="{3.6 * s}" fill="#ffffff"/>')
    out.append(f'<circle cx="{ix - 3 * s}" cy="{iy + 4 * s}" r="{1.6 * s}" fill="#ffffff" opacity="0.8"/>')
    lid_y = y - ry
    if kind in ("lidded", "grumpy"):
        # Heavy upper lid covering the top of the eye.
        cover = 0.42 if kind == "lidded" else 0.5
        ly = y - ry + ry * 2 * cover
        tilt = side * 5 if kind == "grumpy" else 0
        out.append(path(f"M {x - rx - 2},{y - ry - 4} L {x + rx + 2},{y - ry - 4} L {x + rx + 2},{ly - tilt} Q {x},{ly + 3} {x - rx - 2},{ly + tilt} Z", p["skin"]))
        out.append(path(f"M {x - rx - 1},{ly + tilt} Q {x},{ly + 3} {x + rx + 1},{ly - tilt}", "none", line, 5))
        lid_y = ly
    else:
        out.append(path(f"M {x - rx - 1},{y - 2} Q {x - rx * 0.6},{y - ry - 2} {x},{y - ry - 1} Q {x + rx * 0.7},{y - ry} {x + rx + 2},{y - 4}", "none", line, 5))
    if kind == "smiley":
        # Cheeks push the lower lid up.
        out.append(path(f"M {x - rx - 2},{y + ry * 0.75} Q {x},{y + ry * 0.2} {x + rx + 2},{y + ry * 0.75} L {x + rx + 2},{y + ry + 4} L {x - rx - 2},{y + ry + 4} Z", p["skin"]))
        out.append(path(f"M {x - rx * 0.8},{y + ry * 0.62} Q {x},{y + ry * 0.25} {x + rx * 0.8},{y + ry * 0.62}", "none", darker(p["skin"], 0.6), 2.5))
    if e.get("lashes"):
        for k in range(2):
            ox = x + side * (rx * 0.75 + k * 3)
            out.append(path(f"M {ox},{y - ry * 0.75 + k * 6} l {side * 9},{-7 + k * 2}", "none", line, 3.5))
    return "".join(out), (x, (y + lid_y) / 2 if kind in ("lidded", "grumpy") else y, rx, ry)


def brows(p):
    b = p["brows"]
    e = p["eyes"]
    out = []
    for side in (-1, 1):
        x = CX + side * e["dx"]
        y = e["y"] - 20 * e.get("size", 1.0) - b.get("gap", 14)
        inner = b.get("inner", 0)  # + raises the inner end (worried), - lowers it (grumpy)
        outer = b.get("outer", 0)
        w = b.get("w", 22)
        x0, x1 = x - side * w, x + side * w
        d = f"M {x0},{y - inner} Q {x},{y - b.get('arch', 8)} {x1},{y - outer}"
        out.append(path(d, "none", b["color"], b.get("sw", 9)))
    return "".join(out)


def glasses(p):
    g = p.get("glasses")
    if not g:
        return ""
    e = p["eyes"]
    col = g["color"]
    sw = g.get("sw", 6)
    out = []
    for side in (-1, 1):
        x = CX + side * e["dx"]
        y = e["y"] + 1
        if g["kind"] == "round":
            r = g.get("r", 28)
            out.append(f'<circle cx="{x}" cy="{y}" r="{r}" fill="#ffffff" fill-opacity="0.14" stroke="{col}" stroke-width="{sw}"/>')
            edge = r
        else:
            w, h = g.get("w", 31), g.get("h", 24)
            out.append(f'<rect x="{x - w}" y="{y - h}" width="{2 * w}" height="{2 * h}" rx="{g.get("rx", 9)}" fill="#ffffff" fill-opacity="0.14" stroke="{col}" stroke-width="{sw}"/>')
            edge = w
        out.append(path(f"M {x - edge * 0.55},{y - 12} l 12,-8", "none", "#ffffff", 3.5, 'opacity="0.7"'))
        # Arm to the ear.
        ex = CX + side * (p["head"]["w"] - 2)
        out.append(path(f"M {x + side * edge},{y - 6} L {ex},{y - 2}", "none", col, sw - 1.5))
    bridge = e["dx"] - (g.get("r", 28) if g["kind"] == "round" else g.get("w", 31))
    out.append(path(f"M {CX - bridge},{e['y'] - 4} Q {CX},{e['y'] - 12} {CX + bridge},{e['y'] - 4}", "none", col, sw - 1))
    return "".join(out)


def nose(p, line):
    n = p["nose"]
    y0 = p["eyes"]["y"] + 8
    y1 = y0 + n.get("len", 62)
    w = n.get("w", 18)
    shade = darker(p["skin"], 0.82)
    out = []
    # Side shadow along the bridge, then a rounded tip with nostrils.
    out.append(path(f"M {CX + 8},{y0} Q {CX + w * 0.6},{(y0 + y1) / 2} {CX + w},{y1 - 6}", "none", shade, 5))
    tip = f"M {CX - w},{y1 - 4} Q {CX - w - 6},{y1 + 10} {CX - w * 0.35},{y1 + 9} Q {CX},{y1 + 16} {CX + w * 0.35},{y1 + 9} Q {CX + w + 6},{y1 + 10} {CX + w},{y1 - 4}"
    out.append(path(f"M {CX - w},{y1 - 6} Q {CX},{y1 - 22} {CX + w},{y1 - 6} Q {CX + w + 6},{y1 + 10} {CX + w * 0.35},{y1 + 9} Q {CX},{y1 + 16} {CX - w * 0.35},{y1 + 9} Q {CX - w - 6},{y1 + 10} {CX - w},{y1 - 6} Z", p["skin"]))
    out.append(path(tip, "none", line, 4))
    out.append(f'<ellipse cx="{CX - 5}" cy="{y1 - 8}" rx="{w * 0.35}" ry="5" fill="#ffffff" opacity="0.35"/>')
    return "".join(out), y1 + 14


def mouth(p, y, line):
    m = p["mouth"]
    w = m.get("w", 40)
    kind = m["kind"]
    y += m.get("dy", 18)
    dark, tongue = "#6e2424", "#e0747a"
    lips = m.get("lips")
    out = []
    if kind == "grin":
        d = f"M {CX - w},{y} Q {CX},{y + 8} {CX + w},{y} Q {CX + w * 0.7},{y + 42} {CX},{y + 44} Q {CX - w * 0.7},{y + 42} {CX - w},{y} Z"
        out.append(path(d, dark, line, 4.5))
        out.append(path(f"M {CX - w + 6},{y + 3} Q {CX},{y + 12} {CX + w - 6},{y + 3} L {CX + w * 0.75},{y + 14} Q {CX},{y + 20} {CX - w * 0.75},{y + 14} Z", "#ffffff"))
        out.append(f'<ellipse cx="{CX + 4}" cy="{y + 34}" rx="{w * 0.45}" ry="9" fill="{tongue}"/>')
    elif kind == "smile":
        out.append(path(f"M {CX - w},{y} Q {CX},{y + 28} {CX + w},{y - 2}", "none", line, 5.5))
        out.append(path(f"M {CX - w - 4},{y - 6} Q {CX - w},{y} {CX - w + 2},{y + 6}", "none", line, 3.5))
        out.append(path(f"M {CX + w + 4},{y - 8} Q {CX + w},{y - 2} {CX + w - 2},{y + 4}", "none", line, 3.5))
    elif kind == "smirk":
        out.append(path(f"M {CX - w},{y + 6} Q {CX - 4},{y + 16} {CX + w},{y - 8}", "none", line, 5.5))
        out.append(path(f"M {CX + w + 2},{y - 13} Q {CX + w + 2},{y - 6} {CX + w - 4},{y - 3}", "none", line, 3.5))
    elif kind == "pout":
        out.append(path(f"M {CX - w},{y + 10} Q {CX},{y - 4} {CX + w},{y + 10}", "none", line, 5.5))
        out.append(path(f"M {CX - w * 0.5},{y + 13} Q {CX},{y + 22} {CX + w * 0.5},{y + 13}", "none", darker(p["skin"], 0.7), 3.5))
    elif kind == "open_smile":
        d = f"M {CX - w},{y} Q {CX},{y + 6} {CX + w},{y} Q {CX + w * 0.6},{y + 30} {CX},{y + 31} Q {CX - w * 0.6},{y + 30} {CX - w},{y} Z"
        out.append(path(d, dark, lips or line, 5 if lips else 4))
        out.append(path(f"M {CX - w + 7},{y + 3} Q {CX},{y + 10} {CX + w - 7},{y + 3} L {CX + w * 0.7},{y + 11} Q {CX},{y + 15} {CX - w * 0.7},{y + 11} Z", "#ffffff"))
        out.append(f'<ellipse cx="{CX}" cy="{y + 24}" rx="{w * 0.4}" ry="6" fill="{tongue}"/>')
    return "".join(out)


def beard(p, mouth_y, line, front):
    b = p.get("beard")
    if not b:
        return ""
    h = p["head"]
    col = b["color"]
    kind = b["kind"]
    out = []
    if kind in ("stubble", "short_stubble"):
        if front:
            return ""
        # A soft tinted area plus dots along the jaw and upper lip.
        dens = b.get("density", 1.0)
        region = mirror([(0, mouth_y - 26), (b.get("mw", 44), mouth_y - 24), (h["w"] * 0.86, h["cheek_y"] + 18),
                         (h["jaw"], h["chin"] - 40), (h["chin_w"] + 6, h["chin"] - 4), (0, h["chin"] + 2)])
        out.append(path(smooth(region), col, extra=f'opacity="{0.12 * dens}"'))
        import random
        rnd = random.Random(sum(ord(ch) * (i + 1) for i, ch in enumerate(p["id"])))  # same dots every run
        for _ in range(int(55 * dens)):
            u = rnd.uniform(-1, 1)
            v = rnd.uniform(0, 1)
            x = CX + u * (h["jaw"] + (h["w"] * 0.86 - h["jaw"]) * (1 - v))
            y = (h["cheek_y"] + 40) + v * (h["chin"] - h["cheek_y"] - 52)
            if abs(x - CX) < 38 and abs(y - mouth_y - 16) < 20:
                continue
            out.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="1.5" fill="{darker(col, 0.8)}" opacity="0.55"/>')
        return "".join(out)
    # Full or short beard: a solid shape around the jaw, a gap for the mouth, a moustache.
    drop = b.get("drop", 40)
    side_w = h["w"] * 0.97
    top = h["cheek_y"] - b.get("rise", 10)
    shape = mirror([(0, mouth_y - 20), (b.get("mw", 40), mouth_y - 24), (side_w * 0.86, top), (side_w, top - 4),
                    (h["w"] * 0.98, h["cheek_y"] + 30), (h["jaw"] + 8, h["chin"] - 30 + drop * 0.3),
                    (h["chin_w"] + 18, h["chin"] + drop * 0.85), (0, h["chin"] + drop)])
    if not front:
        out.append(path(smooth(shape), col, darker(col, 0.7), 4))
        # Fluffy texture strokes.
        for i in range(-3, 4):
            x = CX + i * 22
            out.append(path(f"M {x},{h['chin'] - 20} q {i * 2},18 {i * 3},{drop * 0.6}", "none", lighter(col, 0.25), 3, 'opacity="0.6"'))
        # Mouth hole, skin coloured, the mouth is drawn on top.
        hole = b.get("hole", 22)
        out.append(f'<ellipse cx="{CX}" cy="{mouth_y + 26}" rx="{p["mouth"].get("w", 40) + 4}" ry="{hole}" fill="{darker(p["skin"], 0.92)}"/>')
    else:
        # Moustache over the top lip.
        mw = p["mouth"].get("w", 40) + 12
        d = (f"M {CX},{mouth_y + 10} Q {CX - mw * 0.5},{mouth_y - 4} {CX - mw},{mouth_y + 18} "
             f"Q {CX - mw * 0.6},{mouth_y + 8} {CX},{mouth_y + 20} Q {CX + mw * 0.6},{mouth_y + 8} {CX + mw},{mouth_y + 18} "
             f"Q {CX + mw * 0.5},{mouth_y - 4} {CX},{mouth_y + 10} Z")
        out.append(path(d, col, darker(col, 0.7), 3))
    return "".join(out)


# --- hair -----------------------------------------------------------------------

def hair(p, line, layer):
    """layer 'back' is drawn before the head, 'front' after the face."""
    hs = p["hair"]
    col = hs["color"]
    edge = darker(col, 0.65)
    shine = lighter(col, 0.3)
    h = p["head"]
    top, w = h["top"], h["w"]
    style = hs["style"]
    out = []
    if style == "bald":
        if layer == "front":
            # Shine on the dome and short sides above the ears.
            out.append(f'<ellipse cx="{CX - 30}" cy="{top + 40}" rx="38" ry="18" fill="#ffffff" opacity="0.35" transform="rotate(-18 {CX - 30} {top + 40})"/>')
            for side in (-1, 1):
                x = CX + side * (w - 6)
                d = f"M {x},{h['ear_y'] - 70} Q {x + side * 10},{h['ear_y'] - 30} {x - side * 2},{h['ear_y'] - 14} Q {x - side * 16},{h['ear_y'] - 40} {x - side * 12},{h['ear_y'] - 72} Z"
                out.append(path(d, col, edge, 3))
        return "".join(out)
    if style == "long":
        if layer == "back":
            d = smooth(mirror([(0, top - 16), (w * 0.8, top - 4), (w + 22, top + 70), (w + 30, 330), (w + 26, 448), (w - 30, 456), (w - 40, 300)]))
            out.append(path(d, col, edge, 4))
            return "".join(out)
        # Centre parting falling down both sides of the face.
        for side in (-1, 1):
            pts = [(CX + side * 2, top - 12), (CX + side * w * 0.6, top - 2), (CX + side * (w + 12), top + 70), (CX + side * (w + 16), 300),
                   (CX + side * (w + 4), 420), (CX + side * (w - 28), 400), (CX + side * (w - 22), 250), (CX + side * w * 0.6, top + 50), (CX + side * 6, top + 22)]
            out.append(path(smooth(pts), col, edge, 4))
            out.append(path(f"M {CX + side * w * 0.5},{top + 10} Q {CX + side * (w + 6)},{top + 90} {CX + side * (w + 2)},{310}", "none", shine, 4, 'opacity="0.7"'))
        return "".join(out)
    if style == "ponytail":
        if layer == "back":
            d = smooth([(CX + w * 0.6, top + 40), (CX + w + 40, top + 60), (CX + w + 62, top + 150), (CX + w + 40, top + 250), (CX + w + 22, top + 170), (CX + w * 0.9, top + 90)])
            out.append(path(d, col, edge, 4))
            return "".join(out)
        d = smooth(mirror([(0, top - 12), (w * 0.75, top - 2), (w + 6, top + 60), (w + 2, h["ear_y"] - 20), (w - 14, h["ear_y"] - 30), (w - 18, top + 70), (w * 0.55, top + 34), (w * 0.1, top + 42)]))
        out.append(path(d, col, edge, 4))
        out.append(path(f"M {CX - w * 0.55},{top + 18} Q {CX - 10},{top - 2} {CX + w * 0.6},{top + 20}", "none", shine, 4, 'opacity="0.7"'))
        out.append(f'<circle cx="{CX + w + 26}" cy="{top + 52}" r="9" fill="#e85d75"/>')
        return "".join(out)
    if style == "bob":
        if layer == "back":
            d = smooth(mirror([(0, top - 16), (w * 0.8, top - 6), (w + 20, top + 70), (w + 24, 320), (w + 6, 352), (w - 30, 330)]))
            out.append(path(d, col, edge, 4))
            return "".join(out)
        # Side-swept fringe.
        pts = [(CX - w - 12, top + 120), (CX - w - 8, top + 30), (CX - w * 0.4, top - 14), (CX + w * 0.5, top - 10), (CX + w + 14, top + 50),
               (CX + w + 16, top + 150), (CX + w - 6, top + 100), (CX + w * 0.6, top + 52), (CX + 10, top + 70), (CX - w * 0.5, top + 50), (CX - w + 4, top + 110)]
        out.append(path(smooth(pts), col, edge, 4))
        out.append(path(f"M {CX - w * 0.6},{top + 16} Q {CX},{top - 6} {CX + w * 0.7},{top + 26}", "none", shine, 5, 'opacity="0.7"'))
        return "".join(out)
    if layer == "back":
        return ""
    if style == "messy":
        # Blond mop with strands falling over the forehead.
        pts = [(CX - w - 10, h["ear_y"] - 10), (CX - w - 16, top + 40), (CX - w * 0.6, top - 20), (CX - 10, top - 30), (CX + w * 0.6, top - 22),
               (CX + w + 18, top + 30), (CX + w + 12, h["ear_y"] - 10), (CX + w - 8, top + 80),
               (CX + w * 0.62, top + 92), (CX + w * 0.4, top + 70), (CX + w * 0.2, top + 98), (CX, top + 78), (CX - w * 0.22, top + 100),
               (CX - w * 0.42, top + 74), (CX - w * 0.62, top + 96), (CX - w + 6, top + 80)]
        out.append(path(smooth(pts, tension=0.35), col, edge, 4))
        for i in range(-3, 4):
            x = CX + i * 24
            out.append(path(f"M {x},{top - 10} Q {x + 10},{top + 30} {x + i * 3},{top + 70}", "none", shine, 3.5, 'opacity="0.75"'))
        for sx in (-1, 1):
            out.append(path(f"M {CX + sx * 20},{top - 26} q {sx * 10},-20 {sx * 26},-18", "none", col, 6))
        return "".join(out)
    if style == "curly":
        import math
        for row, (ry, n, rr) in enumerate(((top - 2, 9, 16), (top + 18, 10, 15), (top + 40, 2, 15))):
            for i in range(n):
                if row == 2:
                    x = CX + (-1 if i == 0 else 1) * (w - 10)
                else:
                    x = CX - w * 0.95 + (2 * w * 0.95) * i / (n - 1)
                y = ry - (math.cos((x - CX) / w * 1.3) * 18 if row == 0 else 0)
                out.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{rr}" fill="{col}" stroke="{edge}" stroke-width="3.5"/>')
                out.append(path(f"M {x - 8:.1f},{y - 4:.1f} q 6,-8 13,-2", "none", shine, 3, 'opacity="0.8"'))
        return "".join(out)
    if style == "cap":
        # Snapback cap, peak to the side, shaved sides below.
        cap = hs.get("cap", "#1c1c22")
        for side in (-1, 1):
            out.append(path(f"M {CX + side * (w - 2)},{top + 70} L {CX + side * (w + 2)},{h['ear_y'] - 28}", "none", darker(p["skin"], 0.75), 10, 'opacity="0.55"'))
        d = smooth(mirror([(0, top - 26), (w * 0.7, top - 18), (w + 6, top + 40), (w + 8, top + 78), (0, top + 70)]))
        out.append(path(d, cap, darker(cap, 0.5), 4))
        out.append(path(f"M {CX - w - 6},{top + 74} Q {CX},{top + 60} {CX + w + 6},{top + 74} L {CX + w + 70},{top + 86} Q {CX + w + 40},{top + 104} {CX + w - 10},{top + 92} Q {CX},{top + 84} {CX - w - 6},{top + 92} Z", cap, darker(cap, 0.5), 4))
        out.append(f'<circle cx="{CX}" cy="{top - 22}" r="6" fill="{lighter(cap, 0.3)}"/>')
        out.append(path(f"M {CX - w * 0.5},{top - 4} Q {CX},{top - 20} {CX + w * 0.5},{top - 2}", "none", lighter(cap, 0.25), 4, 'opacity="0.8"'))
        return "".join(out)
    if style == "crop":
        # Short cropped hair close to the skull, receding at the temples (M line),
        # short spiky fringe, faded sides.
        bay = hs.get("bay", 50)
        pts = [(CX - w + 2, h["ear_y"] - 34), (CX - w - 2, top + 44), (CX - w * 0.55, top - 6), (CX, top - 12), (CX + w * 0.55, top - 6),
               (CX + w + 2, top + 44), (CX + w - 2, h["ear_y"] - 34), (CX + w - 14, top + 74),
               (CX + w * 0.6, top + bay), (CX + w * 0.4, top + bay * 0.5), (CX + w * 0.2, top + bay * 0.45),
               (CX, top + bay * 0.55), (CX - w * 0.2, top + bay * 0.45), (CX - w * 0.4, top + bay * 0.5),
               (CX - w * 0.6, top + bay), (CX - w + 14, top + 74)]
        out.append(path(smooth(pts), col, edge, 3.5))
        # Short spikes along the front line.
        for dx in (-34, -17, 0, 17, 34):
            y0 = top + bay * 0.5 + (2 if dx == 0 else 0)
            out.append(path(f"M {CX + dx - 7},{y0 - 2} L {CX + dx},{y0 + 9} L {CX + dx + 7},{y0 - 2} Z", col, edge, 2.5))
        # Faded sides: the skin shows through.
        for side in (-1, 1):
            out.append(f'<ellipse cx="{CX + side * (w - 6)}" cy="{h["ear_y"] - 50}" rx="9" ry="22" fill="{p["skin"]}" opacity="0.45"/>')
        out.append(path(f"M {CX - w * 0.5},{top + 8} Q {CX},{top - 8} {CX + w * 0.5},{top + 8}", "none", shine, 3.5, 'opacity="0.55"'))
        return "".join(out)
    if style == "temples":
        # Hair on top, but receding: deep bays at the temples, a higher front line.
        bay = hs.get("bay", 56)
        pts = [(CX - w - 4, h["ear_y"] - 30), (CX - w - 10, top + 40), (CX - w * 0.55, top - 18), (CX, top - 24), (CX + w * 0.55, top - 18),
               (CX + w + 10, top + 40), (CX + w + 4, h["ear_y"] - 30), (CX + w - 12, top + 72),
               (CX + w * 0.62, top + bay), (CX + w * 0.42, top + bay * 0.55), (CX + w * 0.18, top + bay * 0.5),
               (CX, top + bay * 0.62), (CX - w * 0.18, top + bay * 0.5), (CX - w * 0.42, top + bay * 0.55),
               (CX - w * 0.62, top + bay), (CX - w + 12, top + 72)]
        out.append(path(smooth(pts), col, edge, 4))
        out.append(path(f"M {CX - w * 0.5},{top + 6} Q {CX},{top - 14} {CX + w * 0.5},{top + 6}", "none", shine, 4, 'opacity="0.6"'))
        for side in (-1, 1):
            out.append(f'<ellipse cx="{CX + side * w * 0.55}" cy="{top + bay + 8}" rx="16" ry="9" fill="#ffffff" opacity="0.2"/>')
        return "".join(out)
    if style == "thinning":
        # Front dégarni: bare forehead up to the crown, hair on the sides and
        # a thin band at the back, a few wispy strands on top.
        out.append(f'<ellipse cx="{CX - 26}" cy="{top + 40}" rx="34" ry="14" fill="#ffffff" opacity="0.28" transform="rotate(-14 {CX - 26} {top + 40})"/>')
        back = smooth([(CX - w * 0.75, top + 16), (CX - w * 0.3, top - 6), (CX + w * 0.3, top - 6), (CX + w * 0.75, top + 16),
                       (CX + w * 0.5, top + 6), (CX, top + 2), (CX - w * 0.5, top + 6)])
        out.append(path(back, col, edge, 3))
        for side in (-1, 1):
            pts = [(CX + side * (w * 0.7), top + 14), (CX + side * (w + 10), top + 46), (CX + side * (w + 6), h["ear_y"] - 22),
                   (CX + side * (w - 12), h["ear_y"] - 26), (CX + side * (w - 16), top + 74), (CX + side * (w * 0.78), top + 40)]
            out.append(path(smooth(pts), col, edge, 4))
            out.append(path(f"M {CX + side * (w - 2)},{top + 50} Q {CX + side * (w + 4)},{top + 80} {CX + side * (w - 4)},{h['ear_y'] - 34}", "none", shine, 3, 'opacity="0.6"'))
        for dx, bend in ((-26, -8), (-6, 6), (14, -5), (30, 7)):
            out.append(path(f"M {CX + dx},{top + 2} q {bend},14 {bend * 0.4},28", "none", col, 3.5))
        return "".join(out)
    if style in ("short", "wavy", "receding"):
        rec = hs.get("recede", 0)
        pts = [(CX - w - 4, h["ear_y"] - 30), (CX - w - 10, top + 40), (CX - w * 0.55, top - 18), (CX, top - 26), (CX + w * 0.6, top - 16),
               (CX + w + 10, top + 40), (CX + w + 4, h["ear_y"] - 30), (CX + w - 12, top + 70 + rec * 0.5),
               (CX + w * 0.6, top + 50 + rec), (CX + w * 0.3, top + 44 + rec * 0.3), (CX - w * 0.1, top + 52), (CX - w * 0.5, top + 40 + rec), (CX - w + 12, top + 70 + rec * 0.5)]
        out.append(path(smooth(pts), col, edge, 4))
        if style == "wavy":
            for i in range(-2, 3):
                x = CX + i * 30
                out.append(path(f"M {x - 14},{top + 4} q 14,-16 28,0 q 14,16 28,0", "none", shine, 3.5, 'opacity="0.7"'))
        else:
            out.append(path(f"M {CX - w * 0.6},{top + 10} Q {CX - 10},{top - 14} {CX + w * 0.6},{top + 8}", "none", shine, 4, 'opacity="0.6"'))
        if hs.get("grey"):
            for side in (-1, 1):
                out.append(f'<ellipse cx="{CX + side * (w - 2)}" cy="{h["ear_y"] - 44}" rx="9" ry="20" fill="#bdb7b0"/>')
        if hs.get("part"):
            out.append(path(f"M {CX - w * 0.35},{top - 12} Q {CX - w * 0.3},{top + 14} {CX - w * 0.45},{top + 40}", "none", edge, 3))
        return "".join(out)
    return ""


# --- the friends ----------------------------------------------------------------

BASE_HEAD = {"top": 72, "chin": 372, "w": 118, "jaw": 82, "chin_w": 34, "cheek_y": 256, "ear_y": 236}


def friend(id, skin, head=None, **traits):
    h = dict(BASE_HEAD)
    h.update(head or {})
    p = {"id": id, "skin": skin, "head": h}
    p.update(traits)
    return p


CAST = [
    friend("panda", "#f3b8a0", head={"w": 124, "chin": 368, "jaw": 98, "chin_w": 46, "cheek_y": 262},
           hair={"style": "crop", "color": "#5a3e2c", "bay": 54},
           eyes={"y": 222, "dx": 50, "kind": "open", "iris": "#86a0b6", "size": 0.92},
           brows={"color": "#4a3324", "inner": 0, "outer": 2, "arch": 3, "sw": 9, "w": 21},
           glasses={"kind": "rect", "color": "#141414", "w": 34, "h": 23, "sw": 8.5, "rx": 6},
           nose={"len": 60, "w": 18}, mouth={"kind": "smirk", "w": 34, "dy": 20},
           beard={"kind": "stubble", "color": "#6b4a36", "density": 0.9}, ears=1.25),
    friend("cous", "#f4cbb0", head={"w": 106, "chin": 392, "jaw": 74, "chin_w": 30, "cheek_y": 258},
           hair={"style": "messy", "color": "#d9b866"},
           eyes={"y": 226, "dx": 46, "kind": "lidded", "iris": "#6d8a6a"},
           brows={"color": "#b8964f", "inner": 6, "outer": 0},
           nose={"len": 72, "w": 16}, mouth={"kind": "smile", "w": 34, "dy": 22},
           beard={"kind": "stubble", "color": "#b8853f", "density": 2.4}),
    friend("mamar", "#eec19c", head={"w": 120, "jaw": 88, "top": 64},
           hair={"style": "bald", "color": "#a0623a"},
           eyes={"y": 214, "dx": 48, "kind": "smiley", "iris": "#4f6f4a"},
           brows={"color": "#8a5232", "inner": 2, "arch": 10},
           nose={"len": 62, "w": 19}, mouth={"kind": "grin", "w": 40, "dy": 22},
           beard={"kind": "full", "color": "#9c5a34", "drop": 46, "rise": 6}),
    friend("babar", "#efc4a2", head={"w": 122, "jaw": 92, "chin_w": 40},
           hair={"style": "cap", "color": "#3a3330", "cap": "#1d1d24"},
           eyes={"y": 222, "dx": 48, "kind": "grumpy", "iris": "#5a6b7c"},
           brows={"color": "#3e322c", "inner": -10, "outer": 4, "arch": 2, "sw": 10},
           glasses={"kind": "rect", "color": "#2b2b35", "w": 31, "h": 22, "sw": 6},
           nose={"len": 58, "w": 20}, mouth={"kind": "pout", "w": 30},
           beard={"kind": "stubble", "color": "#4a3c34", "density": 1.2}),
    friend("victor", "#dca27c", head={"w": 114, "jaw": 84},
           hair={"style": "curly", "color": "#5b3d28"},
           eyes={"y": 220, "dx": 48, "kind": "smiley", "iris": "#4c6a3f"},
           brows={"color": "#4a311f", "inner": 2},
           nose={"len": 60, "w": 18}, mouth={"kind": "grin", "w": 42},
           beard={"kind": "stubble", "color": "#4a311f", "density": 1.0}),
    friend("romain", "#e2b08c", head={"w": 114, "chin": 382, "jaw": 80},
           hair={"style": "wavy", "color": "#2a201b", "grey": True, "recede": 6},
           eyes={"y": 222, "dx": 48, "kind": "smiley", "iris": "#4a2f22"},
           brows={"color": "#1f1713", "inner": 4, "sw": 11, "arch": 10},
           nose={"len": 76, "w": 23}, mouth={"kind": "grin", "w": 46},
           beard={"kind": "stubble", "color": "#2a201b", "density": 1.3}),
    friend("eugenie", "#f8d5bf", head={"w": 110, "chin": 366, "jaw": 76, "chin_w": 28},
           hair={"style": "bob", "color": "#e3c072"},
           eyes={"y": 220, "dx": 46, "kind": "open", "iris": "#5e88a8", "lashes": True},
           brows={"color": "#b89552", "sw": 7, "arch": 10},
           glasses={"kind": "round", "color": "#d6304a", "r": 27, "sw": 6},
           nose={"len": 48, "w": 14}, mouth={"kind": "open_smile", "w": 34, "lips": "#c94d5a"}),
    friend("violaine", "#e9b993", head={"w": 108, "chin": 368, "jaw": 74, "chin_w": 28},
           hair={"style": "long", "color": "#1d1716"},
           eyes={"y": 220, "dx": 46, "kind": "smiley", "iris": "#3b2418", "lashes": True},
           brows={"color": "#1d1716", "sw": 8, "arch": 12},
           nose={"len": 50, "w": 15}, mouth={"kind": "open_smile", "w": 36, "lips": "#b84a4f"},
           earring=True),
    friend("aline", "#f6cfb6", head={"w": 108, "chin": 370, "jaw": 76, "chin_w": 28},
           hair={"style": "ponytail", "color": "#6e4a33"},
           eyes={"y": 220, "dx": 46, "kind": "open", "iris": "#6a7f55", "lashes": True},
           brows={"color": "#5b3d2a", "sw": 7, "arch": 9},
           glasses={"kind": "rect", "color": "#7d8590", "w": 29, "h": 21, "sw": 4.5, "rx": 11},
           nose={"len": 50, "w": 15}, mouth={"kind": "smile", "w": 34}),
    friend("greg", "#ecbf9e", head={"w": 114, "jaw": 82},
           hair={"style": "receding", "color": "#2f2420", "recede": 26},
           eyes={"y": 220, "dx": 48, "kind": "smiley", "iris": "#5a4030"},
           brows={"color": "#2b211d", "sw": 9},
           nose={"len": 62, "w": 18}, mouth={"kind": "open_smile", "w": 34, "dy": 22},
           beard={"kind": "short", "color": "#2f2420", "drop": 16, "rise": -38, "mw": 34, "hole": 17}),
]


def neck(p, line):
    shade = darker(p["skin"], 0.8)
    d = f"M {CX - 46},{330} L {CX - 50},{458} Q {CX},{470} {CX + 50},{458} L {CX + 46},{330} Z"
    return path(d, p["skin"], line, 4) + path(f"M {CX - 46},{372} Q {CX},{408} {CX + 46},{372} L {CX + 46},{340} L {CX - 46},{340} Z", shade, extra='opacity="0.8"')


def render(p):
    line = darker(p["skin"], 0.48)
    h = p["head"]
    outline = smooth(head_shape(h))
    parts = [neck(p, line), f'<g transform="translate(0 {SHIFT}) translate(200 236) scale({SCALE}) translate(-200 -236)">', hair(p, line, "back"), ears(p, line)]
    # Face with soft shading clipped inside it.
    parts.append(f'<clipPath id="f-{p["id"]}"><path d="{outline}"/></clipPath>')
    parts.append(path(outline, p["skin"]))
    shade = darker(p["skin"], 0.86)
    parts.append(f'<g clip-path="url(#f-{p["id"]})">'
                 f'<ellipse cx="{CX + h["w"] * 0.95}" cy="{h["cheek_y"]}" rx="{h["w"] * 0.5}" ry="{(h["chin"] - h["top"]) * 0.7}" fill="{shade}" opacity="0.38"/>'
                 f'<ellipse cx="{CX}" cy="{h["chin"] + 10}" rx="{h["w"] * 0.9}" ry="34" fill="{shade}" opacity="0.45"/>'
                 f'<ellipse cx="{CX - h["w"] * 0.45}" cy="{h["top"] + 60}" rx="{h["w"] * 0.4}" ry="40" fill="#ffffff" opacity="0.18"/>'
                 + (beard(p, 0, line, False) if p.get("beard", {}).get("kind") in ("stubble", "short_stubble") else "")
                 + f'</g>')
    parts.append(path(outline, "none", line, 5))
    # Blush.
    for side in (-1, 1):
        parts.append(f'<ellipse cx="{CX + side * (p["eyes"]["dx"] + 16)}" cy="{p["eyes"]["y"] + 62}" rx="22" ry="12" fill="#f07a7a" opacity="0.28"/>')
    eye_boxes = []
    for side in (-1, 1):
        svg, box = eye(p, side)
        parts.append(svg)
        eye_boxes.append(box)
    parts.append(brows(p))
    n_svg, mouth_top = nose(p, line)
    if p.get("beard") and p["beard"]["kind"] not in ("stubble", "short_stubble"):
        parts.append(beard(p, mouth_top, line, False))
    parts.append(n_svg)
    parts.append(mouth(p, mouth_top, line))
    if p.get("beard") and p["beard"]["kind"] not in ("stubble", "short_stubble"):
        parts.append(beard(p, mouth_top, line, True))
    parts.append(hair(p, line, "front"))
    parts.append(glasses(p))
    if p.get("earring"):
        y = h["ear_y"] + 30
        parts.append(f'<circle cx="{CX - h["w"] - 12}" cy="{y}" r="7" fill="#f4c542" stroke="{darker("#f4c542", 0.6)}" stroke-width="2"/>')
    parts.append('</g>')
    svg = f'<svg viewBox="20 20 360 440" width="360" height="440" xmlns="http://www.w3.org/2000/svg">{"".join(parts)}</svg>'
    return svg, eye_boxes


def main():
    install = "--install" in sys.argv
    root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    out_dir = os.path.join(root, "web", "public", "cast" if install else "cast-new")
    os.makedirs(out_dir, exist_ok=True)
    eyes_table = {}
    for p in CAST:
        svg, boxes = render(p)
        with open(os.path.join(out_dir, f"{p['id']}.svg"), "w", encoding="utf-8") as fh:
            fh.write(svg)
        if install:
            folder = os.path.join(root, "assets", "art", "characters", p["id"])
            os.makedirs(folder, exist_ok=True)
            with open(os.path.join(folder, "head.svg"), "w", encoding="utf-8") as fh:
                fh.write(svg)
        eyes_table[p["id"]] = [[round(CX + (x - CX) * SCALE, 1), round(236 + (y - 236) * SCALE + SHIFT, 1), round(rx * SCALE, 1), round(ry * SCALE, 1)]
                               for x, y, rx, ry in boxes]
    print(json.dumps(eyes_table))


if __name__ == "__main__":
    main()
