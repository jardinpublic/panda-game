"""Draw a cast member as a fictional illustrated character in several styles.

The shapes (face outline, hairline, glasses, eyes, nose, mouth, stubble) were
traced by hand from a blend of the person's photos, so every style keeps the
likeness. No photo pixel is used: everything is vector drawing.

Usage:
    python tools/art/portrait_styles.py <out.html>

Writes an HTML page with one SVG per style, side by side, for choosing.
"""
import sys

# --- Panda's traced geometry (canvas 512 x 680, eyes at y 300) --------------
# Each path: list of (command, points). Commands: M, L, C, Q, Z.
HEAD = [("M", [(120, 252)]), ("C", [(114, 182), (162, 140), (232, 138)]),
        ("C", [(302, 136), (348, 172), (349, 242)]), ("C", [(351, 302), (346, 352), (334, 394)]),
        ("C", [(321, 440), (288, 472), (250, 478)]), ("C", [(210, 482), (160, 456), (139, 410)]),
        ("C", [(123, 374), (120, 320), (120, 252)]), ("Z", [])]
EAR_L = [("M", [(124, 300)]), ("C", [(102, 292), (96, 320), (101, 342)]),
         ("C", [(105, 362), (116, 372), (128, 366)]), ("Z", [])]
EAR_R = [("M", [(345, 298)]), ("C", [(363, 291), (367, 318), (362, 339)]),
         ("C", [(358, 358), (350, 365), (340, 361)]), ("Z", [])]
NECK = [("M", [(178, 430)]), ("L", [(174, 522)]), ("C", [(212, 544), (288, 544), (318, 516)]),
        ("L", [(312, 424)]), ("Z", [])]
SHIRT = [("M", [(48, 680)]), ("C", [(62, 586), (118, 534), (174, 516)]),
         ("C", [(212, 548), (288, 548), (318, 512)]), ("C", [(384, 530), (444, 584), (462, 680)]), ("Z", [])]
COLLAR = [("M", [(174, 516)]), ("C", [(212, 548), (288, 548), (318, 512)])]
HAIR = [("M", [(124, 292)]), ("C", [(115, 248), (118, 198), (150, 164)]),
        ("C", [(180, 137), (214, 129), (240, 129)]), ("C", [(286, 129), (331, 148), (345, 190)]),
        ("C", [(352, 216), (352, 252), (348, 290)]), ("L", [(339, 290)]),
        ("C", [(339, 262), (335, 240), (326, 225)]), ("C", [(316, 213), (300, 206), (285, 203)]),
        ("C", [(262, 198), (245, 199), (228, 200)]), ("C", [(205, 201), (185, 206), (168, 214)]),
        ("C", [(154, 222), (146, 236), (141, 252)]), ("C", [(137, 265), (135, 278), (134, 292)]), ("Z", [])]
# Short crop texture: little strokes combed forward on the top of the head.
HAIR_STROKES = [((160 + i * 13, 175 + abs(i - 7) * 2), (166 + i * 13, 160 + abs(i - 7) * 2)) for i in range(14)] +                [((172 + i * 13, 200 - (i % 3) * 3), (176 + i * 13, 188 - (i % 3) * 3)) for i in range(11)]
BROW_L = [("M", [(165, 276)]), ("Q", [(200, 265), (233, 272)])]
BROW_R = [("M", [(268, 271)]), ("Q", [(302, 263), (336, 271)])]
NOSE = [("M", [(247, 318)]), ("C", [(246, 344), (240, 368), (232, 381)]),
        ("C", [(238, 393), (254, 395), (266, 388)])]
NOSTRILS = [("M", [(232, 381)]), ("Q", [(226, 389), (234, 393)]), ("M", [(266, 388)]), ("Q", [(273, 386), (270, 380)])]
MOUTH = [("M", [(213, 421)]), ("C", [(235, 427), (262, 427), (289, 418)])]
UPPER_LIP = [("M", [(213, 421)]), ("C", [(232, 412), (244, 415), (251, 418)]),
             ("C", [(260, 414), (274, 412), (289, 418)])]
LOWER_LIP = [("M", [(222, 426)]), ("C", [(240, 438), (266, 437), (281, 424)])]
STUBBLE = [("M", [(146, 394)]), ("C", [(160, 448), (204, 478), (250, 478)]),
           ("C", [(298, 476), (326, 444), (336, 394)]), ("C", [(326, 404), (312, 410), (300, 408)]),
           ("C", [(296, 400), (285, 395), (270, 397)]), ("C", [(262, 399), (255, 401), (250, 401)]),
           ("C", [(244, 401), (236, 398), (228, 397)]), ("C", [(214, 395), (204, 399), (200, 408)]),
           ("C", [(186, 410), (160, 406), (146, 394)]), ("Z", [])]
FACE_SHADOW = [("M", [(318, 205)]), ("C", [(342, 235), (350, 290), (345, 340)]),
               ("C", [(340, 385), (325, 425), (300, 452)]), ("C", [(316, 410), (326, 360), (327, 310)]),
               ("C", [(328, 265), (325, 232), (318, 205)]), ("Z", [])]
JAW_SHADOW = [("M", [(178, 452)]), ("C", [(210, 486), (290, 486), (312, 446)]),
              ("L", [(312, 476)]), ("C", [(280, 500), (210, 500), (178, 480)]), ("Z", [])]
LENS_L = (143, 283, 94, 52)
LENS_R = (255, 281, 92, 52)
EYE_L = (206, 306)
EYE_R = (304, 305)
SKIN = "#efc3a2"
SKIN_SHADE = "#d99f80"
SKIN_DEEP = "#c08467"
HAIR_C = "#6e553d"
HAIR_DARK = "#4a3828"
STUBBLE_C = "#9a7458"
SHIRT_C = "#1f2026"
IRIS = "#7189a3"
FRAME = "#18181c"
INK = "#1a1416"


def warp_identity(p):
    return p


def warp_caricature(p):
    """Editorial caricature: bigger cranium and glasses, small chin, small body."""
    x, y = p
    cx = 238.0
    if y < 360:
        k = 1.2
        return (cx + (x - cx) * k, 360 - (360 - y) * k - 10)
    if y < 520:
        t = (y - 360) / 160.0
        k = 1.0 - 0.22 * t
        return (cx + (x - cx) * (1.1 - 0.2 * t), 350 + (y - 360) * 0.78)
    return (cx + (x - cx) * 0.82, 350 + 160 * 0.78 + (y - 520) * 0.9)


def path(cmds, warp=warp_identity):
    out = []
    for cmd, pts in cmds:
        wp = [warp(p) for p in pts]
        out.append(cmd + " " + " ".join(f"{x:.1f},{y:.1f}" for x, y in wp))
    return " ".join(out)


def rect_path(r, warp=warp_identity, radius=10):
    x, y, w, h = r
    pts = [(x + radius, y), (x + w - radius, y), (x + w, y + radius), (x + w, y + h - radius),
           (x + w - radius, y + h), (x + radius, y + h), (x, y + h - radius), (x, y + radius)]
    pts = [warp(p) for p in pts]
    corners = [warp(c) for c in [(x + w, y), (x + w, y + h), (x, y + h), (x, y)]]
    d = f"M {pts[0][0]:.1f},{pts[0][1]:.1f} L {pts[1][0]:.1f},{pts[1][1]:.1f} "
    d += f"Q {corners[0][0]:.1f},{corners[0][1]:.1f} {pts[2][0]:.1f},{pts[2][1]:.1f} L {pts[3][0]:.1f},{pts[3][1]:.1f} "
    d += f"Q {corners[1][0]:.1f},{corners[1][1]:.1f} {pts[4][0]:.1f},{pts[4][1]:.1f} L {pts[5][0]:.1f},{pts[5][1]:.1f} "
    d += f"Q {corners[2][0]:.1f},{corners[2][1]:.1f} {pts[6][0]:.1f},{pts[6][1]:.1f} L {pts[7][0]:.1f},{pts[7][1]:.1f} "
    d += f"Q {corners[3][0]:.1f},{corners[3][1]:.1f} {pts[0][0]:.1f},{pts[0][1]:.1f} Z"
    return d


def eye(center, warp, iris=IRIS, detail=True, ink=INK, scale=1.0):
    cx, cy = warp(center)
    s = scale
    parts = []
    if detail:
        parts.append(f'<ellipse cx="{cx}" cy="{cy}" rx="{15*s}" ry="{8*s}" fill="#fbf7f2"/>')
        parts.append(f'<circle cx="{cx+1}" cy="{cy}" r="{7*s}" fill="{iris}"/>')
        parts.append(f'<circle cx="{cx+1}" cy="{cy}" r="{3.2*s}" fill="#14161a"/>')
        parts.append(f'<circle cx="{cx+3*s}" cy="{cy-2.5*s}" r="{1.6*s}" fill="#fff"/>')
        parts.append(f'<path d="M {cx-17*s},{cy-1*s} Q {cx},{cy-12*s} {cx+17*s},{cy-2*s}" fill="none" stroke="{ink}" stroke-width="{3*s}" stroke-linecap="round"/>')
    else:
        parts.append(f'<ellipse cx="{cx+1}" cy="{cy}" rx="{4*s}" ry="{5*s}" fill="{ink}"/>')
        parts.append(f'<path d="M {cx-13*s},{cy-4*s} Q {cx},{cy-11*s} {cx+13*s},{cy-5*s}" fill="none" stroke="{ink}" stroke-width="{2.5*s}" stroke-linecap="round"/>')
    return "".join(parts)


def glasses(warp, frame=FRAME, width=7, lens="rgba(220,235,245,0.18)", glint=True):
    s = []
    for r in (LENS_L, LENS_R):
        s.append(f'<path d="{rect_path(r, warp)}" fill="{lens}" stroke="{frame}" stroke-width="{width}" stroke-linejoin="round"/>')
        if glint:
            x, y, w, h = r
            a, b = warp((x + w * 0.62, y + 9)), warp((x + w * 0.85, y + 9))
            s.append(f'<line x1="{a[0]}" y1="{a[1]}" x2="{b[0]}" y2="{b[1]}" stroke="rgba(255,255,255,0.7)" stroke-width="3" stroke-linecap="round"/>')
    br = path([("M", [(237, 295)]), ("Q", [(246, 287), (255, 294)])], warp)
    s.append(f'<path d="{br}" fill="none" stroke="{frame}" stroke-width="{width}"/>')
    al = path([("M", [(143, 293)]), ("L", [(118, 290)])], warp)
    ar = path([("M", [(347, 291)]), ("L", [(352, 289)])], warp)
    s.append(f'<path d="{al}" stroke="{frame}" stroke-width="{width}"/><path d="{ar}" stroke="{frame}" stroke-width="{width}"/>')
    return "".join(s)


def hair_strokes(color, width=2.2, warp=warp_identity, opacity=0.7):
    out = []
    for a, b in HAIR_STROKES:
        a, b = warp(a), warp(b)
        out.append(f'<line x1="{a[0]:.1f}" y1="{a[1]:.1f}" x2="{b[0]:.1f}" y2="{b[1]:.1f}" '
                   f'stroke="{color}" stroke-width="{width}" stroke-linecap="round" opacity="{opacity}"/>')
    return "".join(out)


def svg(body, bg):
    return (f'<svg viewBox="0 0 512 680" xmlns="http://www.w3.org/2000/svg" width="300" height="398">'
            f'{bg}{body}</svg>')


# --- Styles ----------------------------------------------------------------

def ligne_claire():
    """Clean European comic line: even black outline, flat colours, no shading."""
    w = warp_identity
    st = f'stroke="{INK}" stroke-width="3.5" stroke-linejoin="round"'
    b = [f'<path d="{path(SHIRT,w)}" fill="#2b3a55" {st}/>', f'<path d="{path(NECK,w)}" fill="{SKIN}" {st}/>',
         f'<path d="{path(COLLAR,w)}" fill="none" {st}/>',
         f'<path d="{path(EAR_L,w)}" fill="{SKIN}" {st}/>', f'<path d="{path(EAR_R,w)}" fill="{SKIN}" {st}/>',
         f'<path d="{path(HEAD,w)}" fill="{SKIN}" {st}/>',
         f'<path d="{path(STUBBLE,w)}" fill="#c99a7d" opacity="0.35" stroke="none"/>',
         f'<path d="{path(HAIR,w)}" fill="#7a5a3c" {st}/>', hair_strokes(HAIR_DARK, 2.5),
         eye(EYE_L, w, detail=False), eye(EYE_R, w, detail=False),
         f'<path d="{path(BROW_L,w)}" fill="none" stroke="{HAIR_DARK}" stroke-width="4.5" stroke-linecap="round"/>',
         f'<path d="{path(BROW_R,w)}" fill="none" stroke="{HAIR_DARK}" stroke-width="4.5" stroke-linecap="round"/>',
         f'<path d="{path(NOSE,w)}" fill="none" {st} stroke-linecap="round"/>',
         f'<path d="{path(MOUTH,w)}" fill="none" {st} stroke-linecap="round"/>',
         glasses(w, width=6, lens="none", glint=False)]
    return svg("".join(b), '<rect width="512" height="680" fill="#f4e7c6"/><circle cx="256" cy="330" r="230" fill="#e9d2a0"/>')


def comic_book():
    """Bold American comic: heavy outline, hard cel shadows, hatching, halftone."""
    w = warp_identity
    st = f'stroke="{INK}" stroke-width="6" stroke-linejoin="round"'
    hatch = "".join(f'<line x1="{310+i*7}" y1="{240+i*14}" x2="{330+i*7}" y2="{230+i*14}" stroke="{INK}" stroke-width="1.6"/>' for i in range(8))
    b = [f'<path d="{path(SHIRT,w)}" fill="{SHIRT_C}" {st}/>', f'<path d="{path(NECK,w)}" fill="{SKIN_SHADE}" {st}/>',
         f'<path d="{path(JAW_SHADOW,w)}" fill="{SKIN_DEEP}"/>',
         f'<path d="{path(EAR_L,w)}" fill="{SKIN}" {st}/>', f'<path d="{path(EAR_R,w)}" fill="{SKIN_SHADE}" {st}/>',
         f'<path d="{path(HEAD,w)}" fill="{SKIN}" {st}/>',
         f'<path d="{path(FACE_SHADOW,w)}" fill="{SKIN_SHADE}"/>', hatch,
         f'<path d="{path(STUBBLE,w)}" fill="{STUBBLE_C}" opacity="0.35"/>',
         f'<path d="{path(HAIR,w)}" fill="{HAIR_C}" {st}/>', hair_strokes(HAIR_DARK, 3),
         '<path d="M 175,160 Q 235,138 305,160" fill="none" stroke="#a88866" stroke-width="5" stroke-linecap="round"/>',
         eye(EYE_L, w), eye(EYE_R, w),
         f'<path d="{path(BROW_L,w)}" fill="none" stroke="{HAIR_DARK}" stroke-width="7" stroke-linecap="round"/>',
         f'<path d="{path(BROW_R,w)}" fill="none" stroke="{HAIR_DARK}" stroke-width="7" stroke-linecap="round"/>',
         f'<path d="M 250,330 C 262,350 268,372 266,388 L 252,392 Z" fill="{SKIN_SHADE}"/>',
         f'<path d="{path(NOSE,w)}" fill="none" stroke="{INK}" stroke-width="3.5" stroke-linecap="round"/>',
         f'<path d="{path(NOSTRILS,w)}" fill="none" stroke="{INK}" stroke-width="2.5"/>',
         f'<path d="{path(UPPER_LIP,w)}" fill="none" stroke="{INK}" stroke-width="3.5" stroke-linecap="round"/>',
         f'<path d="{path(LOWER_LIP,w)}" fill="none" stroke="{SKIN_DEEP}" stroke-width="3" stroke-linecap="round"/>',
         glasses(w, width=8)]
    bg = ('<defs><pattern id="dots" width="14" height="14" patternUnits="userSpaceOnUse">'
          '<circle cx="7" cy="7" r="3" fill="#f2b632"/></pattern></defs>'
          '<rect width="512" height="680" fill="#f7d35c"/><rect width="512" height="680" fill="url(#dots)" opacity="0.55"/>')
    return svg("".join(b), bg)


def painted():
    """Semi-realistic painted portrait: soft gradients, no outlines."""
    w = warp_identity
    defs = ('<defs>'
            '<radialGradient id="skin" cx="0.42" cy="0.42" r="0.7"><stop offset="0" stop-color="#f6d2b6"/>'
            '<stop offset="0.6" stop-color="#e8b593"/><stop offset="1" stop-color="#c88a6c"/></radialGradient>'
            '<linearGradient id="hair" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8a6b4c"/>'
            '<stop offset="1" stop-color="#4f3b2a"/></linearGradient>'
            '<radialGradient id="bgp" cx="0.5" cy="0.4" r="0.8"><stop offset="0" stop-color="#3d6f8f"/>'
            '<stop offset="1" stop-color="#16263a"/></radialGradient>'
            '<filter id="soft"><feGaussianBlur stdDeviation="9"/></filter>'
            '<filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="1.6" numOctaves="2" result="n"/>'
            '<feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="linear" slope="0.5"/></feComponentTransfer>'
            '<feComposite in2="SourceGraphic" operator="in"/></filter>'
            '<clipPath id="headclip"><path d="' + path(HEAD, w) + '"/></clipPath>'
            '</defs>')
    b = [defs, f'<path d="{path(SHIRT,w)}" fill="#202128"/>',
         '<path d="M 120,600 Q 256,560 400,600" fill="none" stroke="#34363f" stroke-width="10" opacity="0.6"/>',
         f'<path d="{path(NECK,w)}" fill="#d49b7c"/>',
         f'<path d="{path(EAR_L,w)}" fill="#e3ab8b"/>', f'<path d="{path(EAR_R,w)}" fill="#c98d6f"/>',
         f'<path d="{path(HEAD,w)}" fill="url(#skin)"/>',
         '<g clip-path="url(#headclip)">',
         f'<path d="{path(FACE_SHADOW,w)}" fill="#b97b5f" opacity="0.55" filter="url(#soft)"/>',
         f'<path d="{path(STUBBLE,w)}" fill="#8f6a52" opacity="0.32" filter="url(#soft)"/>',
         f'<path d="{path(STUBBLE,w)}" fill="#6d4f3c" filter="url(#grain)" opacity="0.6"/>',
         '<ellipse cx="200" cy="230" rx="60" ry="35" fill="#fff" opacity="0.18" filter="url(#soft)"/>',
         '<ellipse cx="250" cy="372" rx="14" ry="22" fill="#b97b5f" opacity="0.45" filter="url(#soft)"/>',
         '</g>',
         f'<path d="{path(HAIR,w)}" fill="url(#hair)"/>',
         f'<path d="{path(HAIR,w)}" fill="#3a2b1f" filter="url(#grain)" opacity="0.5"/>', hair_strokes("#a3845f", 2, opacity=0.5),
         eye(EYE_L, w, ink="#3b2a22"), eye(EYE_R, w, ink="#3b2a22"),
         f'<path d="{path(BROW_L,w)}" fill="none" stroke="#5a4330" stroke-width="5" stroke-linecap="round" opacity="0.9"/>',
         f'<path d="{path(BROW_R,w)}" fill="none" stroke="#5a4330" stroke-width="5" stroke-linecap="round" opacity="0.9"/>',
         f'<path d="{path(NOSE,w)}" fill="none" stroke="#a96e54" stroke-width="3" stroke-linecap="round" opacity="0.8"/>',
         f'<path d="{path(NOSTRILS,w)}" fill="none" stroke="#7d4b38" stroke-width="2.5"/>',
         f'<path d="{path(UPPER_LIP,w)}" fill="none" stroke="#8a4f43" stroke-width="3.5" stroke-linecap="round"/>',
         f'<path d="{path(LOWER_LIP,w)}" fill="none" stroke="#c9826f" stroke-width="5" stroke-linecap="round" opacity="0.7"/>',
         glasses(w, frame="#141418", width=7, lens="rgba(200,225,240,0.15)")]
    return svg("".join(b), '<rect width="512" height="680" fill="url(#bgp)"/>')


def caricature():
    """Editorial caricature: big cranium and glasses, small chin and body."""
    w = warp_caricature
    st = f'stroke="{INK}" stroke-width="4" stroke-linejoin="round"'
    b = [f'<path d="{path(SHIRT,w)}" fill="{SHIRT_C}" {st}/>', f'<path d="{path(NECK,w)}" fill="{SKIN_SHADE}" {st}/>',
         f'<path d="{path(EAR_L,w)}" fill="{SKIN}" {st}/>', f'<path d="{path(EAR_R,w)}" fill="{SKIN}" {st}/>',
         f'<path d="{path(HEAD,w)}" fill="{SKIN}" {st}/>',
         f'<path d="{path(FACE_SHADOW,w)}" fill="{SKIN_SHADE}" opacity="0.8"/>',
         f'<path d="{path(STUBBLE,w)}" fill="{STUBBLE_C}" opacity="0.4"/>',
         f'<path d="{path(HAIR,w)}" fill="{HAIR_C}" {st}/>', hair_strokes(HAIR_DARK, 3, w),
         eye(EYE_L, w, scale=1.25), eye(EYE_R, w, scale=1.25),
         f'<path d="{path(BROW_L,w)}" fill="none" stroke="{HAIR_DARK}" stroke-width="6" stroke-linecap="round"/>',
         f'<path d="{path(BROW_R,w)}" fill="none" stroke="{HAIR_DARK}" stroke-width="6" stroke-linecap="round"/>',
         f'<path d="{path(NOSE,w)}" fill="none" stroke="{INK}" stroke-width="4" stroke-linecap="round"/>',
         f'<path d="{path(MOUTH,w)}" fill="none" stroke="{INK}" stroke-width="4" stroke-linecap="round"/>',
         glasses(w, width=9)]
    return svg("".join(b), '<rect width="512" height="680" fill="#e9eef2"/><text x="256" y="660" text-anchor="middle" font-family="Georgia" font-size="34" fill="#9aa5ae">PANDA</text>')


def flat_vector():
    """Modern flat vector: no outlines, geometric shapes, limited palette."""
    w = warp_identity
    b = [f'<path d="{path(SHIRT,w)}" fill="#26324a"/>', f'<path d="{path(NECK,w)}" fill="#d9967a"/>',
         f'<path d="{path(EAR_L,w)}" fill="#eaa98b"/>', f'<path d="{path(EAR_R,w)}" fill="#d9967a"/>',
         f'<path d="{path(HEAD,w)}" fill="#f0b898"/>',
         f'<path d="{path(FACE_SHADOW,w)}" fill="#dd9d7f"/>',
         f'<path d="{path(STUBBLE,w)}" fill="#c99178" opacity="0.7"/>',
         f'<path d="{path(HAIR,w)}" fill="#3f3a40"/>',
         '<circle cx="207" cy="306" r="5.5" fill="#26324a"/><circle cx="305" cy="305" r="5.5" fill="#26324a"/>',
         f'<path d="{path(BROW_L,w)}" fill="none" stroke="#3f3a40" stroke-width="6" stroke-linecap="round"/>',
         f'<path d="{path(BROW_R,w)}" fill="none" stroke="#3f3a40" stroke-width="6" stroke-linecap="round"/>',
         '<path d="M 247,320 L 232,382 L 264,388 Z" fill="#dd9d7f"/>',
         f'<path d="{path(MOUTH,w)}" fill="none" stroke="#a65b4d" stroke-width="5" stroke-linecap="round"/>',
         glasses(w, frame="#26324a", width=8, lens="none", glint=False)]
    bg = '<rect width="512" height="680" fill="#ffcf6e"/><circle cx="410" cy="120" r="70" fill="#ff8f5e"/><rect x="0" y="520" width="512" height="160" fill="#3fa58f"/>'
    return svg("".join(b), bg)


def animated_sitcom():
    """Grown-up animated series: thin warm lines, natural proportions, one shadow tone."""
    w = warp_identity
    line = "#4a2f25"
    st = f'stroke="{line}" stroke-width="2.5" stroke-linejoin="round"'
    b = [f'<path d="{path(SHIRT,w)}" fill="#2a2c33" {st}/>', f'<path d="{path(NECK,w)}" fill="#e3a98a" {st}/>',
         f'<path d="{path(EAR_L,w)}" fill="#f1c0a0" {st}/>', f'<path d="{path(EAR_R,w)}" fill="#f1c0a0" {st}/>',
         f'<path d="{path(HEAD,w)}" fill="#f1c0a0" {st}/>',
         f'<path d="{path(FACE_SHADOW,w)}" fill="#e2a585"/>',
         f'<path d="{path(STUBBLE,w)}" fill="#c99a7d" opacity="0.45"/>',
         f'<path d="{path(HAIR,w)}" fill="#76593f" {st}/>', hair_strokes("#5b432f", 2),
         eye(EYE_L, w, ink=line, scale=0.9), eye(EYE_R, w, ink=line, scale=0.9),
         f'<path d="{path(BROW_L,w)}" fill="none" stroke="#5b432f" stroke-width="4" stroke-linecap="round"/>',
         f'<path d="{path(BROW_R,w)}" fill="none" stroke="#5b432f" stroke-width="4" stroke-linecap="round"/>',
         f'<path d="{path(NOSE,w)}" fill="none" stroke="{line}" stroke-width="2.5" stroke-linecap="round"/>',
         f'<path d="{path(MOUTH,w)}" fill="none" stroke="{line}" stroke-width="2.8" stroke-linecap="round"/>',
         glasses(w, frame="#1d1c20", width=6, glint=False)]
    return svg("".join(b), '<rect width="512" height="680" fill="#9fd3e6"/><rect y="470" width="512" height="210" fill="#c9e7f0"/>')


STYLES = [
    ("A", "Ligne claire", "Clean European comic: even black line, flat colours.", ligne_claire),
    ("B", "Comic book", "Bold lines, hard shadows, hatching, halftone.", comic_book),
    ("C", "Painted", "Semi-realistic painted portrait, soft light, no outlines.", painted),
    ("D", "Caricature", "Editorial caricature: big head and glasses, small chin.", caricature),
    ("E", "Flat vector", "Modern flat shapes, no outlines, bright palette.", flat_vector),
    ("F", "Animated series", "Grown-up TV animation: thin warm lines, natural proportions.", animated_sitcom),
]


def main():
    cards = []
    for key, name, desc, fn in STYLES:
        cards.append(f'<figure><div class="art">{fn()}</div><figcaption><b>{key}. {name}</b><span>{desc}</span></figcaption></figure>')
    html = ("<!doctype html><html><head><meta charset='utf-8'><title>Panda styles</title><style>"
            "body{margin:0;padding:24px;background:#ece7de;font-family:system-ui,sans-serif;color:#222}"
            "h1{font-size:22px;margin:0 0 16px}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:20px}"
            "figure{margin:0;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px #0002}"
            ".art svg{display:block;width:100%;height:auto}figcaption{padding:10px 14px;display:flex;flex-direction:column;gap:4px;font-size:14px}"
            "</style></head><body><h1>Panda — pick a style</h1><div class='grid'>" + "".join(cards) + "</div></body></html>")
    with open(sys.argv[1], "w", encoding="utf-8") as f:
        f.write(html)


if __name__ == "__main__":
    main()
