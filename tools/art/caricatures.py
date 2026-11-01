"""Goofy editorial caricatures of the whole cast: ink lines over watercolour
washes, three-quarter view, each with a personal prop and punchline.

Every face is authored by hand from the person's reference photos and the
private cast sheet. Shapes are given in "head units": u from -1 (back of the
head, left) to +1 (face side, right), v from 0 (top of skull) to 1 (chin).

Usage:
    python tools/art/caricatures.py <out.html> [--assets]

--assets also writes assets/art/characters/<id>/caricature.svg for the game.
"""
import math
import os
import sys

INK = "#2a1d18"
CX, TOP = 200.0, 48.0
# Game mode: head and neck only, transparent, no SVG filters (the engine ignores them).
GAME = False


def prop(svg):
    return "" if GAME else svg


class Face:
    """Maps head units to canvas coordinates for one character."""

    def __init__(self, w, h, cx=CX - 8, top=TOP + 10):
        # Wider, slightly shorter than the raw numbers: reads better small.
        self.w, self.h, self.cx, self.top = w * 1.22, h * 0.9, cx, top

    def p(self, u, v):
        return (self.cx + u * self.w, self.top + v * self.h)


def smooth(points, closed=True, tension=0.5):
    """Catmull-Rom through points -> SVG cubic path."""
    n = len(points)
    if n < 2:
        return ""
    pts = points + points[:2] if closed else [points[0]] + points + [points[-1]]
    d = f"M {pts[0 if closed else 1][0]:.1f},{pts[0 if closed else 1][1]:.1f}"
    rng = range(n) if closed else range(1, n)
    for i in rng:
        p0 = pts[i - 1] if (closed or i > 0) else pts[i]
        p1, p2 = pts[i], pts[i + 1]
        p3 = pts[i + 2] if i + 2 < len(pts) else p2
        if not closed:
            p0, p1, p2, p3 = pts[i - 1], pts[i], pts[i + 1], pts[min(i + 2, len(pts) - 1)]
        c1 = (p1[0] + (p2[0] - p0[0]) * tension / 3, p1[1] + (p2[1] - p0[1]) * tension / 3)
        c2 = (p2[0] - (p3[0] - p1[0]) * tension / 3, p2[1] - (p3[1] - p1[1]) * tension / 3)
        d += f" C {c1[0]:.1f},{c1[1]:.1f} {c2[0]:.1f},{c2[1]:.1f} {p2[0]:.1f},{p2[1]:.1f}"
    return d + (" Z" if closed else "")


def shape(f, uv, fill="none", stroke=INK, sw=3.0, closed=True, extra=""):
    d = smooth([f.p(u, v) for u, v in uv], closed)
    return f'<path d="{d}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}" stroke-linecap="round" stroke-linejoin="round" {extra}/>'


def wash(f, uv, color, opacity=0.8):
    d = smooth([f.p(u, v) for u, v in uv], True)
    return f'<path d="{d}" fill="{color}" opacity="{opacity}"/>'


def head_outline(jaw=0.55, chin_u=0.15, cheek=0.78, back=1.02):
    """Three-quarter egg: rounder skull at the back, narrower jaw at the front."""
    return [(-back, 0.42), (-0.9, 0.14), (-0.5, 0.0), (0.05, -0.02), (0.6, 0.04), (0.92, 0.2),
            (1.0, 0.38), (0.96, 0.56), (cheek, 0.76), (chin_u + 0.25, 0.94), (chin_u, 1.0),
            (chin_u - 0.3, 0.97), (-jaw, 0.86), (-0.85, 0.66)]


# --- Feature helpers --------------------------------------------------------

def eyes(f, kind="lidded", iris="#6b8299", scale=1.0, lashes=False, v=0.45, near=0.62, far=-0.14):
    out = []
    for u, s in ((far, 0.82 * scale), (near, 1.0 * scale)):
        x, y = f.p(u, v)
        rx, ry = 15 * s, 9 * s
        if kind == "squint":
            out.append(f'<path d="M {x-rx},{y+2} Q {x},{y-ry*1.4} {x+rx},{y+2}" fill="none" stroke="{INK}" stroke-width="3.5" stroke-linecap="round"/>')
            continue
        if kind == "mischief":
            ry *= 0.55
        if kind == "wide":
            rx, ry = rx * 1.05, ry * 1.35
        out.append(f'<ellipse cx="{x}" cy="{y}" rx="{rx}" ry="{ry}" fill="#fffaf2" stroke="{INK}" stroke-width="2"/>')
        out.append(f'<circle cx="{x+2*s}" cy="{y+1}" r="{min(6.5*s, ry*0.95)}" fill="{iris}"/>')
        out.append(f'<circle cx="{x+2*s}" cy="{y+1}" r="{min(3*s, ry*0.5)}" fill="#120d0b"/>')
        out.append(f'<circle cx="{x+4*s}" cy="{y-2}" r="{1.4*s}" fill="#fff"/>')
        if kind == "lidded":
            out.append(f'<path d="M {x-rx-1},{y} Q {x},{y-ry-6} {x+rx+1},{y} Z" fill="#efbf9d" stroke="none"/>')
            out.append(f'<path d="M {x-rx-2},{y+0.5} Q {x},{y-3} {x+rx+2},{y-0.5}" fill="none" stroke="{INK}" stroke-width="3.6" stroke-linecap="round"/>')
        elif kind == "mischief":
            out.append(f'<path d="M {x-rx-2},{y-ry+1} L {x+rx+2},{y-ry-3}" stroke="{INK}" stroke-width="3.5" stroke-linecap="round"/>')
        else:
            out.append(f'<path d="M {x-rx-1},{y-1} Q {x},{y-ry-5} {x+rx+1},{y-2}" fill="none" stroke="{INK}" stroke-width="3" stroke-linecap="round"/>')
        if lashes:
            for k in range(3):
                lx = x + rx * (0.2 + 0.35 * k)
                out.append(f'<path d="M {lx},{y-ry*0.9} l {4+k},{-6-k}" stroke="{INK}" stroke-width="2.2" stroke-linecap="round"/>')
    return "".join(out)


def glasses(f, kind="rect", color="#111", sw=6.5, v=0.45, near=0.62, far=-0.14, size=1.0, tint="#ffffff"):
    out = []
    for u, s in ((far, 0.85 * size), (near, 1.0 * size)):
        x, y = f.p(u, v)
        if kind == "round":
            out.append(f'<circle cx="{x}" cy="{y}" r="{23*s}" fill="{tint}" fill-opacity="0.15" stroke="{color}" stroke-width="{sw}"/>')
        else:
            out.append(f'<rect x="{x-27*s}" y="{y-19*s}" width="{54*s}" height="{37*s}" rx="{8*s}" fill="{tint}" fill-opacity="0.15" stroke="{color}" stroke-width="{sw}"/>')
    a, b = f.p(far, v), f.p(near, v)
    out.append(f'<path d="M {a[0]+23*size},{a[1]-6} Q {(a[0]+b[0])/2+2},{a[1]-14} {b[0]-26*size},{b[1]-6}" fill="none" stroke="{color}" stroke-width="{sw-1}"/>')
    ear = f.p(-0.7, v + 0.02)
    out.append(f'<path d="M {a[0]-23*size},{a[1]-4} L {ear[0]},{ear[1]}" stroke="{color}" stroke-width="{sw-1}"/>')
    return "".join(out)


def brows(f, specs, color=INK, sw=5.0):
    """specs: list of (u0, v0, u1, v1, bend)."""
    out = []
    for i, (u0, v0, u1, v1, bend) in enumerate(specs):
        if i == 0:  # far brow follows the far eye
            u0, u1 = u0 - 0.24, u1 - 0.24
        a, b = f.p(u0, v0), f.p(u1, v1)
        mx, my = (a[0] + b[0]) / 2, (a[1] + b[1]) / 2 - bend
        out.append(f'<path d="M {a[0]},{a[1]} Q {mx},{my} {b[0]},{b[1]}" fill="none" stroke="{color}" stroke-width="{sw}" stroke-linecap="round"/>')
    return "".join(out)


def ear(f, u=-0.78, v=0.5, size=1.0, skin="#efbf9d"):
    x, y = f.p(u, v)
    s = size
    return (f'<path d="M {x+8},{y-26*s} C {x-24*s},{y-34*s} {x-30*s},{y+10*s} {x-14*s},{y+28*s} C {x-6*s},{y+36*s} {x+8},{y+30*s} {x+10},{y+18*s}" '
            f'fill="{skin}" stroke="{INK}" stroke-width="3"/>'
            f'<path d="M {x-2},{y-14*s} C {x-16*s},{y-14*s} {x-16*s},{y+8*s} {x-6*s},{y+14*s}" fill="none" stroke="{INK}" stroke-width="2"/>')


def stubble(f, region, density=1.0, color=INK):
    """Dots spread over a unit-space bounding region (u0, v0, u1, v1), shaped to the jaw."""
    u0, v0, u1, v1 = region
    out = []
    i = 0
    for row in range(9):
        for col in range(14):
            i += 1
            if (i * 37) % 10 > 6 * density:
                continue
            u = u0 + (u1 - u0) * (col + 0.5 * (row % 2)) / 13.5
            v = v0 + (v1 - v0) * row / 8.0
            jaw_limit = 1.0 - 0.9 * abs(u - 0.2) ** 2.2
            if v > jaw_limit:
                continue
            x, y = f.p(u, v)
            out.append(f'<path d="M {x:.1f},{y:.1f} l 1.8,1.8" stroke="{color}" stroke-width="2" stroke-linecap="round"/>')
    return "".join(out)


def mouth(f, kind, v=0.79, left=0.18, right=0.74, lips="#c0614f"):
    a, b = f.p(left, v), f.p(right, v)
    mx = (a[0] + b[0]) / 2
    if kind == "smirk":
        return (f'<path d="M {a[0]},{a[1]+2} Q {mx},{a[1]+8} {b[0]-6},{b[1]-3} Q {b[0]},{b[1]-6} {b[0]+5},{b[1]-12}" fill="none" stroke="{INK}" stroke-width="3.6" stroke-linecap="round"/>'
                f'<path d="M {mx-10},{a[1]+14} Q {mx},{a[1]+18} {mx+10},{a[1]+13}" fill="none" stroke="{INK}" stroke-width="2"/>')
    if kind in ("grin", "big_grin"):
        drop = 34 if kind == "big_grin" else 22
        d = f'M {a[0]},{a[1]-4} Q {mx},{a[1]+6} {b[0]},{b[1]-8} Q {mx+6},{b[1]+drop} {a[0]},{a[1]-4} Z'
        teeth = f'<path d="M {a[0]+6},{a[1]} Q {mx},{a[1]+9} {b[0]-6},{b[1]-4} L {b[0]-10},{b[1]+6} Q {mx},{a[1]+16} {a[0]+8},{a[1]+6} Z" fill="#fffdf6" stroke="{INK}" stroke-width="1.6"/>'
        lines = "".join(f'<path d="M {a[0]+(b[0]-a[0])*t},{a[1]+2+6*math.sin(t*math.pi)} l 0,8" stroke="{INK}" stroke-width="1.4"/>' for t in (0.3, 0.45, 0.6, 0.75))
        return f'<path d="{d}" fill="#7a2b26" stroke="{INK}" stroke-width="3.2" stroke-linejoin="round"/>{teeth}{lines}'
    if kind == "pout":
        return (f'<path d="M {mx-16},{a[1]+2} Q {mx},{a[1]-8} {mx+18},{a[1]+1}" fill="none" stroke="{INK}" stroke-width="3.4" stroke-linecap="round"/>'
                f'<path d="M {mx-12},{a[1]+6} Q {mx+2},{a[1]+18} {mx+14},{a[1]+6}" fill="#d98a7a" stroke="{INK}" stroke-width="2.4"/>')
    if kind == "smile":
        return f'<path d="M {a[0]},{a[1]-2} Q {mx},{a[1]+18} {b[0]},{b[1]-6}" fill="none" stroke="{INK}" stroke-width="3.6" stroke-linecap="round"/>'
    if kind == "lips_smile":
        return (f'<path d="M {a[0]},{a[1]-2} Q {mx},{a[1]+22} {b[0]},{b[1]-6} Q {mx},{a[1]+6} {a[0]},{a[1]-2} Z" fill="{lips}" stroke="{INK}" stroke-width="2.6"/>'
                f'<path d="M {a[0]+6},{a[1]+1} Q {mx},{a[1]+10} {b[0]-6},{b[1]-4}" fill="none" stroke="#fffdf6" stroke-width="3"/>')
    if kind == "lips_grin":
        return mouth(f, "big_grin", v, left, right).replace("#7a2b26", lips)
    return ""


def nose(f, skin, uv, sw=3.2):
    """Nose filled with skin so it sticks out past the cheek line."""
    return shape(f, uv, fill=skin, closed=False, sw=sw)


# --- Bodies and props ---------------------------------------------------------

def bust(color, pattern="plain", neck_skin="#e3a886", f=None):
    y0 = f.top + f.h * 0.9
    nx0, ny0 = f.p(-0.32, 0.86)
    nx1, _ = f.p(0.3, 0.86)
    neck = (f'<path d="M {nx0},{ny0} L {nx0-4},{y0+50} Q {CX},{y0+70} {nx1+6},{y0+46} L {nx1},{ny0+6} Z" '
            f'fill="{neck_skin}" stroke="{INK}" stroke-width="3"/>')
    body_d = (f"M 20,520 C 30,{y0+90} 90,{y0+56} 150,{y0+46} Q {CX},{y0+86} 255,{y0+44} "
              f"C 320,{y0+56} 372,{y0+90} 385,520 Z")
    if GAME:
        return "", neck + "<!--/body-->"
    out = [neck, f'<path d="{body_d}" fill="{color}" stroke="{INK}" stroke-width="3.2"/>']
    clip = f'<clipPath id="bodyclip"><path d="{body_d}"/></clipPath>'
    if pattern == "argentina":
        out.append(f'<g clip-path="url(#bodyclip)">' + "".join(
            f'<rect x="{x}" y="{y0}" width="34" height="200" fill="#75b7e8"/>' for x in range(40, 400, 68)) + "</g>")
        out.append(f'<circle cx="250" cy="{y0+110}" r="9" fill="#1d3b78"/>')
    elif pattern == "hawaiian":
        blobs = []
        for i in range(16):
            x, y = 40 + (i * 53) % 330, y0 + 70 + (i * 37) % 120
            blobs.append(f'<ellipse cx="{x}" cy="{y}" rx="13" ry="9" fill="#f4a24a"/><ellipse cx="{x-7}" cy="{y-5}" rx="5" ry="4" fill="#fff"/>'
                         f'<circle cx="{x+6}" cy="{y-2}" r="1.8" fill="#111"/><path d="M {x+18},{y+12} q 8,-10 18,-4" stroke="#2f8f4e" stroke-width="5" fill="none"/>')
        out.append(f'<g clip-path="url(#bodyclip)">{"".join(blobs)}</g>')
        out.append(f'<path d="M {CX},{y0+70} L {CX+4},520" stroke="{INK}" stroke-width="2"/>')
    elif pattern == "panda_logo":
        x, y = CX + 40, y0 + 120
        out.append(f'<circle cx="{x-12}" cy="{y-12}" r="8" fill="#eee"/><circle cx="{x+12}" cy="{y-12}" r="8" fill="#eee"/>'
                   f'<circle cx="{x}" cy="{y}" r="15" fill="#eee"/><circle cx="{x-6}" cy="{y-2}" r="4" fill="#222"/><circle cx="{x+6}" cy="{y-2}" r="4" fill="#222"/>')
    elif pattern == "shirt_tie":
        out.append(f'<path d="M {CX-6},{y0+76} L {CX+14},{y0+76} L {CX+22},{y0+170} L {CX+4},{y0+196} L {CX-12},{y0+168} Z" fill="#c8202b" stroke="{INK}" stroke-width="3"/>'
                   f'<path d="M 150,{y0+48} L {CX-8},{y0+100} L {CX-20},{y0+60} Z M 255,{y0+46} L {CX+16},{y0+100} L {CX+30},{y0+58} Z" fill="#fff" stroke="{INK}" stroke-width="2.5"/>')
    elif pattern == "hoodie":
        out.append(f'<path d="M 120,{y0+60} Q {CX},{y0+150} 290,{y0+56}" fill="none" stroke="{INK}" stroke-width="3"/>'
                   f'<path d="M {CX-14},{y0+100} l -4,60 M {CX+20},{y0+100} l 4,58" stroke="#ddd" stroke-width="3"/>')
    elif pattern == "blouse":
        out.append(f'<path d="M 160,{y0+52} Q {CX},{y0+110} 250,{y0+50}" fill="none" stroke="{INK}" stroke-width="2.4"/>'
                   f'<circle cx="{CX+2}" cy="{y0+130}" r="3.5" fill="#fff"/><circle cx="{CX+4}" cy="{y0+160}" r="3.5" fill="#fff"/>')
    return clip, "".join(out) + "<!--/body-->"


def rum_glass(x=318, y=330):
    return (f'<path d="M {x},{y} L {x+48},{y} L {x+44},{y+72} L {x+4},{y+72} Z" fill="#f1d0a6" fill-opacity="0.55" stroke="{INK}" stroke-width="3"/>'
            f'<rect x="{x+4}" y="{y+30}" width="40" height="40" fill="#d98c3a" opacity="0.75"/>'
            f'<rect x="{x+12}" y="{y+26}" width="13" height="13" fill="#fff" opacity="0.8" transform="rotate(15 {x+18} {y+32})"/>'
            f'<circle cx="{x+46}" cy="{y+2}" r="12" fill="#9ccc4a" stroke="{INK}" stroke-width="2.5"/>'
            f'<path d="M {x+30},{y-30} L {x+22},{y+60}" stroke="#e94f37" stroke-width="4"/>')


def prop_text(text, size=21):
    if GAME:
        return ""
    width = len(text) * size * 0.5 + 40
    return (f'<rect x="12" y="10" width="{min(width, 376):.0f}" height="{size + 16}" rx="8" fill="#fffdf7" stroke="{INK}" stroke-width="2"/>'
            f'<text x="24" y="{size + 20}" font-family="Georgia, serif" font-style="italic" font-size="{size}" fill="{INK}">« {text} »</text>')


# --- Characters --------------------------------------------------------------

def card(f, layers, bg="#f7f1e6"):
    defs = ('<filter id="wash" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="3" seed="3"/>'
            '<feDisplacementMap in="SourceGraphic" scale="10"/><feGaussianBlur stdDeviation="0.9"/></filter>'
            '<filter id="paper"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2"/>'
            '<feColorMatrix values="0 0 0 0 0.4  0 0 0 0 0.33  0 0 0 0 0.25  0 0 0 0.07 0"/></filter>')
    clip, washes, inks = layers
    if GAME:
        body, inks = inks.split("<!--/body-->", 1) if "<!--/body-->" in inks else ("", inks)
        return (f'<svg viewBox="20 20 360 440" width="360" height="440" xmlns="http://www.w3.org/2000/svg">'
                f'<defs>{clip}</defs>{body}{washes}{inks}</svg>')
    body, inks = inks.split("<!--/body-->", 1) if "<!--/body-->" in inks else ("", inks)
    return (f'<svg viewBox="0 0 400 520" xmlns="http://www.w3.org/2000/svg"><defs>{defs}{clip}</defs>'
            f'<rect width="400" height="520" fill="{bg}"/>{body}<g filter="url(#wash)">{washes}</g>{inks}'
            f'<rect width="400" height="520" filter="url(#paper)"/></svg>')


def face_wash(f, skin, shade, outline):
    return wash(f, outline, skin, 1.0) + wash(f, [(0.55, 0.12), (0.95, 0.3), (0.98, 0.55), (0.75, 0.8), (0.55, 0.93), (0.78, 0.55), (0.72, 0.3)], shade, 0.55)


def panda():
    f = Face(80, 382)
    skin, shade = "#f2c09c", "#d48f6e"
    out = head_outline(jaw=0.5, chin_u=0.2, cheek=0.74)
    hair = [(-1.0, 0.44), (-1.04, 0.24), (-0.88, 0.07), (-0.55, -0.02), (-0.15, -0.04), (0.2, -0.03), (0.45, 0.02),
            (0.35, 0.07), (0.12, 0.08), (-0.15, 0.11), (-0.42, 0.16), (-0.66, 0.26), (-0.8, 0.4)]
    clip, body = bust("#22232a", "panda_logo", f=f)
    washes = (face_wash(f, skin, shade, out) + wash(f, hair, "#7a5c42", 0.85)
              + wash(f, [(-0.35, 0.78), (0.1, 0.9), (0.45, 0.97), (0.75, 0.78), (0.6, 0.72), (0.3, 0.8), (0.0, 0.82)], "#a88066", 0.35)
              + wash(f, [(0.0, 0.62), (0.15, 0.58), (0.2, 0.66)], "#f29a8a", 0.4) + wash(f, [(0.7, 0.62), (0.85, 0.6), (0.85, 0.68)], "#f29a8a", 0.4))
    tufts = "".join(shape(f, [(u, v), (u + 0.04, v - 0.07)], closed=False, sw=2.4) for u, v in
                    ((-0.7, 0.2), (-0.55, 0.12), (-0.38, 0.08), (-0.2, 0.05), (0.0, 0.03), (0.18, 0.02), (0.32, 0.03)))
    inks = (body + ear(f, -0.8, 0.5, 1.35, skin) + shape(f, out, sw=3.4) + shape(f, hair, sw=2.2) + tufts
            + stubble(f, (-0.4, 0.72, 0.85, 1.0), 0.9)
            + brows(f, [(-0.08, 0.31, 0.24, 0.27, 9), (0.48, 0.34, 0.86, 0.35, 5)], "#4a3828", 5)
            + eyes(f, "lidded", "#7590ad", 1.0) + glasses(f, size=1.22, sw=7.5)
            + nose(f, skin, [(0.62, 0.52), (0.74, 0.6), (0.98, 0.68), (0.94, 0.73), (0.78, 0.72)])
            + mouth(f, "smirk", 0.8, 0.0, 0.7) + prop(rum_glass(312, 330)) + prop_text("Hoho ! Un pot à 11h30…"))
    return card(f, (clip, washes, inks), "#f4ecd9")


def romain():
    f = Face(74, 396)
    skin, shade = "#e2b08c", "#c48563"
    out = head_outline(jaw=0.5, chin_u=0.24, cheek=0.72)
    hair = [(-1.0, 0.42), (-1.02, 0.2), (-0.8, 0.04), (-0.4, -0.06), (0.1, -0.08), (0.5, -0.03), (0.78, 0.08),
            (0.62, 0.12), (0.4, 0.06), (0.25, 0.12), (0.05, 0.08), (-0.2, 0.14), (-0.45, 0.16), (-0.7, 0.26), (-0.82, 0.4)]
    grey = [(-1.0, 0.42), (-0.98, 0.3), (-0.82, 0.32), (-0.8, 0.42)]
    clip, body = bust("#bcd6ee", "shirt_tie", f=f)
    washes = (face_wash(f, skin, shade, out) + wash(f, hair, "#2b211c", 0.92) + wash(f, grey, "#b9b4ae", 0.9)
              + wash(f, [(-0.3, 0.8), (0.2, 0.94), (0.6, 0.86), (0.75, 0.74), (0.4, 0.8)], "#6a5244", 0.3))
    waves = "".join(shape(f, [(u, -0.02 + 0.03 * (i % 2)), (u + 0.12, 0.02), (u + 0.22, -0.01)], closed=False, sw=2.2, stroke="#7d6a5d")
                    for i, u in enumerate((-0.6, -0.35, -0.1, 0.15)))
    inks = (body + ear(f, -0.8, 0.52, 1.15, skin) + shape(f, out, sw=3.4) + shape(f, hair, sw=2.4) + waves
            + stubble(f, (-0.35, 0.74, 0.8, 1.0), 1.0)
            + brows(f, [(-0.1, 0.32, 0.26, 0.31, 10), (0.46, 0.33, 0.9, 0.34, 9)], "#1d1714", 7)
            + eyes(f, "wide", "#5a3e2c", 0.95)
            + nose(f, skin, [(0.6, 0.48), (0.76, 0.58), (1.06, 0.7), (1.02, 0.76), (0.8, 0.75)], 3.4)
            + mouth(f, "big_grin", 0.82, 0.1, 0.84)
            + prop('<path d="M 300,380 l 30,-20 l 20,25 l 30,-45" fill="none" stroke="#2f8f4e" stroke-width="6" stroke-linecap="round"/><path d="M 372,334 l 10,6 l -2,-12 z" fill="#2f8f4e"/>')
            + prop_text("Ah, te veux voir du travail ?"))
    return card(f, (clip, washes, inks), "#eef3f6")


def mamar():
    f = Face(72, 372)
    skin, shade = "#ebbd98", "#c88a68"
    out = head_outline(jaw=0.48, chin_u=0.2, cheek=0.76)
    beard = [(-0.62, 0.55), (-0.4, 0.66), (0.1, 0.68), (0.5, 0.68), (0.82, 0.6), (0.9, 0.78), (0.65, 1.02),
             (0.25, 1.16), (-0.15, 1.08), (-0.5, 0.88)]
    clip, body = bust("#ffffff", "argentina", f=f)
    washes = (face_wash(f, skin, shade, out) + wash(f, beard, "#5e3f27", 0.95)
              + wash(f, [(-0.7, 0.05), (-0.3, -0.01), (0.1, 0.0), (-0.2, 0.08)], "#fff6ea", 0.6))
    curls = "".join(f'<path d="M {x:.0f},{y:.0f} q 4,-6 8,0" fill="none" stroke="#2c1d12" stroke-width="2"/>'
                    for x, y in (f.p(u, v) for u in (-0.3, -0.05, 0.2, 0.45, 0.65) for v in (0.8, 0.92, 1.04) if not (v > 1.0 and abs(u - 0.2) > 0.4)))
    sandwich = ('<g transform="translate(300 360) rotate(-12)">'
                f'<path d="M 0,0 Q 45,-22 90,0 L 90,14 Q 45,-8 0,14 Z" fill="#e8b866" stroke="{INK}" stroke-width="3"/>'
                f'<path d="M -4,14 Q 45,6 94,14 L 94,22 Q 45,14 -4,22 Z" fill="#6cb84a" stroke="{INK}" stroke-width="2"/>'
                f'<path d="M -2,22 Q 45,16 92,22 L 92,32 Q 45,26 -2,32 Z" fill="#c9433b" stroke="{INK}" stroke-width="2"/>'
                f'<path d="M 0,32 Q 45,28 90,32 L 90,44 Q 45,52 0,44 Z" fill="#e8b866" stroke="{INK}" stroke-width="3"/></g>')
    inks = (body + ear(f, -0.78, 0.5, 1.3, skin) + shape(f, out, sw=3.4)
            + shape(f, [(-0.65, 0.12), (-0.45, 0.06)], closed=False, sw=4, stroke="#fff")
            + shape(f, beard, fill="none", sw=3) + curls
            + brows(f, [(-0.1, 0.36, 0.26, 0.4, -4), (0.46, 0.41, 0.88, 0.36, -4)], "#3b2818", 6)
            + eyes(f, "mischief", "#4b3420", 1.0)
            + nose(f, skin, [(0.6, 0.48), (0.72, 0.58), (0.96, 0.66), (0.9, 0.71), (0.74, 0.7)])
            + f'<path d="M {f.p(0.2,0.8)[0]},{f.p(0.2,0.8)[1]} Q {f.p(0.45,0.84)[0]},{f.p(0.45,0.84)[1]} {f.p(0.72,0.76)[0]},{f.p(0.72,0.76)[1]}" fill="none" stroke="#f0d6c8" stroke-width="4" stroke-linecap="round"/>'
            + prop(sandwich) + prop_text("Aïe aïe aïe aïe… Olé !"))
    return card(f, (clip, washes, inks), "#eef6fb")


def victor():
    f = Face(78, 362)
    skin, shade = "#d9a07a", "#b77854"
    out = head_outline(jaw=0.52, chin_u=0.18, cheek=0.76)
    curls = [(u, v) for u, v in ((-1.0, 0.36), (-1.05, 0.2), (-0.92, 0.05), (-0.72, -0.06), (-0.45, -0.1), (-0.15, -0.12),
                                 (0.15, -0.1), (0.42, -0.06), (0.68, 0.02), (0.86, 0.14), (0.8, 0.24), (0.55, 0.18), (0.3, 0.22),
                                 (0.05, 0.18), (-0.25, 0.22), (-0.55, 0.26), (-0.8, 0.38))]
    clip, body = bust("#1c2a4a", "plain", f=f)
    washes = (face_wash(f, skin, shade, out) + wash(f, curls, "#7b5a3a", 0.9)
              + wash(f, [(-0.3, 0.8), (0.2, 0.95), (0.6, 0.86), (0.75, 0.72), (0.4, 0.8)], "#5a4030", 0.3))
    loops = "".join(f'<circle cx="{x:.0f}" cy="{y:.0f}" r="9" fill="none" stroke="#3b2a1c" stroke-width="2.2"/>'
                    for x, y in (f.p(u, v) for u, v in ((-0.85, 0.12), (-0.6, 0.0), (-0.3, -0.05), (0.0, -0.04), (0.3, 0.0),
                                                       (0.58, 0.08), (-0.75, 0.28), (-0.45, 0.14), (-0.15, 0.1), (0.15, 0.12), (0.42, 0.14))))
    squash = (f'<ellipse cx="335" cy="420" rx="52" ry="40" fill="#f08a2c" stroke="{INK}" stroke-width="3"/>'
              f'<path d="M 300,420 q 35,-30 70,0 M 310,440 q 25,-25 50,0" fill="none" stroke="#c96a1a" stroke-width="2.5"/>'
              f'<path d="M 335,382 q -4,-14 8,-22" stroke="#4d7a2c" stroke-width="6" fill="none" stroke-linecap="round"/>'
              '<text x="335" y="428" text-anchor="middle" font-family="Arial" font-size="13" fill="#5b2c08">13,6 kg</text>')
    inks = (body + ear(f, -0.8, 0.5, 1.15, skin) + shape(f, out, sw=3.4) + shape(f, curls, sw=2.6) + loops
            + stubble(f, (-0.4, 0.74, 0.82, 1.0), 0.95)
            + brows(f, [(-0.1, 0.33, 0.24, 0.29, 8), (0.46, 0.31, 0.86, 0.32, 8)], "#4a3220", 5)
            + eyes(f, "squint")
            + nose(f, skin, [(0.6, 0.48), (0.72, 0.58), (0.93, 0.66), (0.88, 0.71), (0.72, 0.7)])
            + mouth(f, "big_grin", 0.79, 0.08, 0.82) + prop(squash) + prop_text("Bosse don', Panda !"))
    return card(f, (clip, washes, inks), "#eaf5ef")


def cous():
    f = Face(72, 404)
    skin, shade = "#f4cbb0", "#d99a7c"
    out = head_outline(jaw=0.48, chin_u=0.2, cheek=0.72)
    hair = [(-1.08, 0.62), (-1.12, 0.3), (-0.95, 0.06), (-0.6, -0.08), (-0.1, -0.1), (0.4, -0.06), (0.8, 0.06),
            (0.98, 0.22), (0.86, 0.3), (0.72, 0.2), (0.6, 0.3), (0.42, 0.22), (0.24, 0.3), (0.06, 0.2), (-0.12, 0.28),
            (-0.3, 0.2), (-0.55, 0.28), (-0.75, 0.38), (-0.85, 0.56)]
    beard = [(-0.55, 0.66), (-0.2, 0.74), (0.3, 0.74), (0.78, 0.68), (0.8, 0.8), (0.55, 0.98), (0.2, 1.04), (-0.2, 0.96), (-0.48, 0.82)]
    clip, body = bust("#1f7a4d", "hawaiian", f=f)
    washes = (face_wash(f, skin, shade, out) + wash(f, hair, "#c3a067", 0.92) + wash(f, beard, "#b5643a", 0.55))
    strands = "".join(shape(f, [(u, 0.0), (u + 0.08, 0.14), (u + 0.04, 0.26)], closed=False, sw=2, stroke="#7d6237")
                      for u in (-0.7, -0.45, -0.2, 0.05, 0.3, 0.55))
    pig = (f'<ellipse cx="330" cy="400" rx="44" ry="30" fill="#f2a65a" stroke="{INK}" stroke-width="3"/>'
           f'<path d="M 300,392 q 18,-26 40,-10 q 14,10 30,-2 q 6,26 -20,36 q -30,6 -50,-24 z" fill="#fff" stroke="none" opacity="0.9"/>'
           f'<circle cx="360" cy="392" r="4" fill="#111"/><circle cx="372" cy="404" r="3" fill="#d77"/>'
           f'<path d="M 344,376 q 4,-10 12,-4" fill="#d98a5a" stroke="{INK}" stroke-width="2"/>')
    inks = (body + ear(f, -0.82, 0.52, 1.1, skin) + shape(f, out, sw=3.4) + shape(f, hair, sw=2.6) + strands
            + shape(f, beard, sw=1.6, extra='stroke-dasharray="3 5"') + stubble(f, (-0.4, 0.74, 0.82, 1.0), 1.0, "#7a3a1c")
            + brows(f, [(-0.08, 0.36, 0.24, 0.36, 4), (0.46, 0.37, 0.86, 0.38, 4)], "#7d6237", 4.5)
            + eyes(f, "lidded", "#6f8a6a", 0.95)
            + nose(f, skin, [(0.6, 0.5), (0.72, 0.6), (0.96, 0.69), (0.9, 0.74), (0.72, 0.73)])
            + mouth(f, "smirk", 0.83, 0.26, 0.72) + prop(pig) + prop_text("Mais bondieu, y a pas de New Cous !", 19))
    return card(f, (clip, washes, inks), "#f6efe0")


def babar():
    f = Face(86, 350)
    skin, shade = "#efc19f", "#cf8f6d"
    out = head_outline(jaw=0.6, chin_u=0.16, cheek=0.8, back=1.0)
    cap = [(-1.04, 0.36), (-0.98, 0.1), (-0.6, -0.06), (0.0, -0.1), (0.6, -0.04), (0.92, 0.14), (0.95, 0.3),
           (0.4, 0.26), (-0.2, 0.26), (-0.7, 0.3)]
    brim = [(0.4, 0.26), (0.95, 0.28), (1.45, 0.34), (1.4, 0.4), (0.9, 0.38), (0.4, 0.33)]
    clip, body = bust("#33363c", "hoodie", f=f)
    washes = (face_wash(f, skin, shade, out) + wash(f, cap, "#1d2026", 0.95) + wash(f, brim, "#111318", 0.95)
              + wash(f, [(-0.3, 0.78), (0.2, 0.92), (0.6, 0.86), (0.78, 0.72), (0.4, 0.8)], "#8a6a54", 0.3))
    lighter = (f'<rect x="318" y="372" width="34" height="58" rx="6" fill="#e94f37" stroke="{INK}" stroke-width="3"/>'
               f'<rect x="322" y="362" width="26" height="12" fill="#c9c9cf" stroke="{INK}" stroke-width="2"/>'
               f'<path d="M 336,360 q -12,-20 0,-38 q 4,14 10,10 q 6,16 -10,28 z" fill="#ffb627" stroke="{INK}" stroke-width="2"/>'
               '<path d="M 336,356 q -5,-10 1,-18 q 3,8 5,6 q 2,8 -6,12 z" fill="#fff3a0"/>'
               f'<path d="M 280,300 q 6,-6 10,0 q -4,10 -10,0" fill="#bfe6ff" stroke="{INK}" stroke-width="1.6"/>')
    inks = (body + ear(f, -0.78, 0.5, 1.1, skin) + shape(f, out, sw=3.4) + shape(f, cap, sw=3) + shape(f, brim, sw=3)
            + stubble(f, (-0.45, 0.7, 0.85, 1.0), 1.0)
            + brows(f, [(-0.08, 0.38, 0.24, 0.39, 2), (0.46, 0.3, 0.86, 0.27, 16)], "#5a4636", 6)
            + eyes(f, "mischief", "#5d7a96", 1.0) + glasses(f, color="#27407a", size=1.05, sw=6)
            + nose(f, skin, [(0.62, 0.5), (0.74, 0.58), (0.92, 0.66), (0.88, 0.71), (0.72, 0.7)])
            + mouth(f, "pout", 0.82, 0.22, 0.7) + prop(lighter) + prop_text("Rase z'y tout !"))
    return card(f, (clip, washes, inks), "#efeeea")


def greg():
    f = Face(78, 364)
    skin, shade = "#ebbd9b", "#c98a69"
    out = head_outline(jaw=0.52, chin_u=0.18, cheek=0.76)
    hair = [(-1.0, 0.42), (-1.02, 0.18), (-0.8, 0.02), (-0.4, -0.05), (0.1, -0.06), (0.55, -0.01), (0.85, 0.14),
            (0.7, 0.18), (0.4, 0.12), (0.1, 0.14), (-0.25, 0.16), (-0.6, 0.24), (-0.82, 0.4)]
    beard = [(-0.6, 0.58), (-0.4, 0.7), (0.0, 0.74), (0.45, 0.72), (0.84, 0.62), (0.86, 0.8), (0.6, 0.98),
             (0.2, 1.06), (-0.2, 1.0), (-0.52, 0.82)]
    clip, body = bust("#9fc3e3", "blouse", f=f)
    washes = face_wash(f, skin, shade, out) + wash(f, hair, "#2e231c", 0.92) + wash(f, beard, "#3a2a20", 0.85)
    cake = (f'<path d="M 296,380 L 384,380 L 384,436 L 296,436 Z" fill="#c98a4a" stroke="{INK}" stroke-width="3"/>'
            f'<path d="M 294,380 q 22,-20 46,-4 q 22,-16 46,4" fill="#fff4e2" stroke="{INK}" stroke-width="3"/>'
            '<circle cx="320" cy="368" r="6" fill="#d63a3a"/><circle cx="356" cy="366" r="6" fill="#d63a3a"/>')
    inks = (body + ear(f, -0.8, 0.5, 1.1, skin) + shape(f, out, sw=3.4) + shape(f, hair, sw=2.4) + shape(f, beard, sw=2.6)
            + brows(f, [(-0.1, 0.33, 0.24, 0.31, 6), (0.46, 0.32, 0.86, 0.33, 6)], "#211812", 5.5)
            + eyes(f, "squint")
            + nose(f, skin, [(0.6, 0.48), (0.72, 0.58), (0.92, 0.66), (0.88, 0.71), (0.72, 0.7)])
            + mouth(f, "smile", 0.8, 0.22, 0.74).replace(INK, "#f2e2d6") + prop(cake) + prop_text("Le crapa !"))
    return card(f, (clip, washes, inks), "#f2f2ec")


def aline():
    f = Face(70, 360)
    skin, shade = "#f5ccb2", "#dc9d80"
    out = head_outline(jaw=0.48, chin_u=0.18, cheek=0.74)
    hair = [(-1.04, 0.5), (-1.08, 0.2), (-0.85, 0.0), (-0.4, -0.08), (0.15, -0.08), (0.6, 0.0), (0.9, 0.18),
            (0.75, 0.2), (0.45, 0.12), (0.1, 0.16), (-0.3, 0.2), (-0.7, 0.32), (-0.85, 0.5)]
    tail = [(-1.0, 0.3), (-1.4, 0.36), (-1.55, 0.6), (-1.45, 0.88), (-1.25, 0.7), (-1.2, 0.48), (-1.02, 0.42)]
    clip, body = bust("#2f8c96", "blouse", f=f)
    washes = face_wash(f, skin, shade, out) + wash(f, hair, "#6b4528", 0.92) + wash(f, tail, "#6b4528", 0.92)
    tea = (f'<path d="M 306,392 h 52 l -6,48 h -40 z" fill="#fff" stroke="{INK}" stroke-width="3"/>'
           f'<path d="M 358,402 q 18,4 0,22" fill="none" stroke="{INK}" stroke-width="3"/>'
           '<path d="M 320,384 q -6,-12 4,-20 M 338,382 q -6,-12 4,-20" fill="none" stroke="#9aa" stroke-width="2.4"/>')
    inks = (body + shape(f, tail, sw=2.8) + ear(f, -0.8, 0.5, 1.0, skin) + shape(f, out, sw=3.2) + shape(f, hair, sw=2.6)
            + f'<circle cx="{f.p(-1.05,0.36)[0]}" cy="{f.p(-1.05,0.36)[1]}" r="8" fill="#e94f6a" stroke="{INK}" stroke-width="2.4"/>'
            + brows(f, [(-0.08, 0.33, 0.24, 0.31, 6), (0.46, 0.32, 0.84, 0.33, 6)], "#4a2f1c", 4)
            + eyes(f, "wide", "#6b4a2c", 0.92, lashes=True) + glasses(f, color="#6a3f2a", size=1.0, sw=5)
            + nose(f, skin, [(0.62, 0.5), (0.72, 0.58), (0.86, 0.65), (0.82, 0.69), (0.7, 0.69)])
            + mouth(f, "lips_smile", 0.8, 0.28, 0.74, "#c45a5e") + prop(tea) + prop_text("On t'aime quand même !"))
    return card(f, (clip, washes, inks), "#f7eef0")


def eugenie():
    f = Face(80, 346)
    skin, shade = "#f8d3bd", "#e0a487"
    out = head_outline(jaw=0.58, chin_u=0.16, cheek=0.82)
    hair = [(-1.2, 0.95), (-1.2, 0.3), (-0.95, 0.02), (-0.5, -0.1), (0.1, -0.1), (0.65, 0.0), (0.98, 0.2),
            (1.02, 0.4), (0.9, 0.3), (0.7, 0.18), (0.4, 0.2), (0.1, 0.16), (-0.25, 0.2), (-0.6, 0.3), (-0.85, 0.55), (-0.9, 0.95)]
    clip, body = bust("#1d1d24", "blouse", f=f)
    washes = face_wash(f, skin, shade, out) + wash(f, hair, "#dcb56e", 0.92)
    phone = (f'<rect x="318" y="350" width="46" height="84" rx="8" fill="#26262c" stroke="{INK}" stroke-width="3"/>'
             '<rect x="323" y="358" width="36" height="66" fill="#ffd166"/>'
             '<text x="341" y="396" text-anchor="middle" font-family="Arial Black" font-size="14" fill="#c43">GIF</text>')
    inks = (body + shape(f, hair, sw=2.6) + ear(f, -0.8, 0.5, 1.0, skin) + shape(f, out, sw=3.2)
            + shape(f, [(-0.9, 0.02), (-0.5, -0.08), (0.1, -0.08), (0.65, 0.02), (0.9, 0.2), (0.6, 0.16), (0.2, 0.14),
                        (-0.3, 0.18), (-0.7, 0.3)], fill="#dcb56e", sw=2.6)
            + f'<circle cx="{f.p(-0.75,0.64)[0]}" cy="{f.p(-0.75,0.64)[1]}" r="6" fill="#f2c94c" stroke="{INK}" stroke-width="2"/>'
            + brows(f, [(-0.08, 0.31, 0.24, 0.29, 7), (0.46, 0.3, 0.86, 0.31, 7)], "#a4824a", 4)
            + eyes(f, "wide", "#5f86b4", 0.95, lashes=True) + glasses(f, "round", "#c3242b", size=1.05, sw=5.5)
            + nose(f, skin, [(0.62, 0.5), (0.72, 0.58), (0.84, 0.64), (0.8, 0.68), (0.7, 0.68)])
            + mouth(f, "lips_grin", 0.79, 0.14, 0.8, "#c84b56") + prop(phone) + prop_text("Mais qu'est-ce que c'est que ce slip ?!", 18))
    return card(f, (clip, washes, inks), "#f9f0e6")


def violaine():
    f = Face(72, 366)
    skin, shade = "#ecb994", "#c98563"
    out = head_outline(jaw=0.5, chin_u=0.18, cheek=0.76)
    hair = [(-1.3, 1.25), (-1.3, 0.3), (-1.0, 0.0), (-0.45, -0.12), (0.2, -0.11), (0.75, 0.0), (1.02, 0.22),
            (1.0, 0.5), (0.9, 0.34), (0.6, 0.16), (0.2, 0.14), (-0.2, 0.16), (-0.6, 0.28), (-0.88, 0.55), (-0.95, 1.25)]
    clip, body = bust("#e8664e", "blouse", f=f)
    washes = face_wash(f, skin, shade, out) + wash(f, hair, "#1b1412", 0.95)
    violin = ('<g transform="translate(330 400) rotate(-25)">'
              f'<path d="M -14,-40 C -30,-36 -30,-10 -14,-6 C -26,0 -28,30 -10,36 L 10,36 C 28,30 26,0 14,-6 C 30,-10 30,-36 14,-40 Z" fill="#b5632d" stroke="{INK}" stroke-width="3"/>'
              f'<rect x="-4" y="-80" width="8" height="44" fill="#3a2414" stroke="{INK}" stroke-width="2"/>'
              f'<path d="M -6,-10 q 6,4 0,10 M 6,-10 q -6,4 0,10" fill="none" stroke="{INK}" stroke-width="2"/></g>')
    inks = (body + shape(f, hair, sw=2.6) + ear(f, -0.8, 0.5, 1.0, skin) + shape(f, out, sw=3.2)
            + shape(f, [(-1.0, 0.02), (-0.45, -0.1), (0.2, -0.09), (0.75, 0.02), (0.95, 0.2), (0.6, 0.14), (0.2, 0.12),
                        (-0.2, 0.14), (-0.6, 0.26), (-0.9, 0.42)], fill="#1b1412", sw=2.4)
            + f'<circle cx="{f.p(-0.76,0.66)[0]}" cy="{f.p(-0.76,0.66)[1]}" r="7" fill="#f2c94c" stroke="{INK}" stroke-width="2"/>'
            + brows(f, [(-0.1, 0.32, 0.26, 0.29, 7), (0.44, 0.3, 0.88, 0.31, 8)], "#120d0b", 7)
            + eyes(f, "wide", "#3b2618", 0.95, lashes=True)
            + nose(f, skin, [(0.6, 0.5), (0.72, 0.58), (0.86, 0.65), (0.82, 0.69), (0.7, 0.69)])
            + mouth(f, "lips_grin", 0.79, 0.1, 0.84, "#c5544e") + prop(violin) + prop_text("Malaisant !"))
    return card(f, (clip, washes, inks), "#f2f1ea")


CAST = [("panda", "Panda", panda), ("romain", "Romain", romain), ("mamar", "Mamar", mamar),
        ("victor", "Victor", victor), ("cous", "Cous", cous), ("babar", "Babar", babar), ("greg", "Greg", greg),
        ("aline", "Aline", aline), ("eugenie", "Eugénie", eugenie), ("violaine", "Violaine", violaine)]


def main():
    global GAME
    out_html = sys.argv[1]
    only = [a for a in sys.argv[2:] if not a.startswith("--")]
    cast = [c for c in CAST if not only or c[0] in only]
    cards = []
    for cid, name, fn in cast:
        svg = fn()
        cards.append(f'<figure><div class="art">{svg}</div><figcaption><b>{name}</b></figcaption></figure>')
        if "--heads" in sys.argv:
            GAME = True
            folder = os.path.join("assets", "art", "characters", cid)
            os.makedirs(folder, exist_ok=True)
            with open(os.path.join(folder, "head.svg"), "w", encoding="utf-8") as fh:
                fh.write(fn())
            GAME = False
        if "--assets" in sys.argv:
            folder = os.path.join("assets", "art", "characters", cid)
            os.makedirs(folder, exist_ok=True)
            with open(os.path.join(folder, "caricature.svg"), "w", encoding="utf-8") as fh:
                fh.write(svg)
    html = ("<!doctype html><html><head><meta charset='utf-8'><title>Cast caricatures</title><style>"
            "body{margin:0;padding:12px;background:#e9e3d8;font-family:system-ui,sans-serif}"
            ".grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:14px}"
            "figure{margin:0;background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 2px 8px #0002}"
            ".art svg{display:block;width:100%;height:auto}figcaption{padding:6px 12px;font-size:15px}"
            "</style></head><body><div class='grid'>" + "".join(cards) + "</div></body></html>")
    with open(out_html, "w", encoding="utf-8") as fh:
        fh.write(html)


if __name__ == "__main__":
    main()
