"""Six different drawings of Panda, each its own composition, pose and technique.

Every drawing is authored by hand (vector), keeping his recognisable traits:
receding short light-brown hair, thick black rectangular glasses, deadpan
half-closed eyes, long nose, light stubble, slim and sporty.

Usage:
    python tools/art/panda_drawings.py <out.html>
"""
import base64
import io
import sys

from PIL import Image, ImageDraw

SKIN, SHADE, HAIR, STUB, TEE, INK, GLS = "#f0c3a3", "#d9a283", "#6e553d", "#a98063", "#1f2026", "#1a1416", "#16161a"


def card(svg_body, viewbox="0 0 400 520", bg=""):
    return f'<svg viewBox="{viewbox}" xmlns="http://www.w3.org/2000/svg">{bg}{svg_body}</svg>'


# A. Chibi game hero: full body, giant head, waving, flip-flops (Martinique).
def chibi():
    o = f'stroke="{INK}" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"'
    return card(f'''
<ellipse cx="200" cy="498" rx="95" ry="14" fill="#0002"/>
<path d="M164 438 L170 486 M236 438 L230 486" stroke="{SKIN}" stroke-width="20" stroke-linecap="round"/>
<path d="M164 438 L170 486 M236 438 L230 486" fill="none" {o} stroke-width="0"/>
<ellipse cx="166" cy="492" rx="22" ry="8" fill="#e94f37" {o}/><ellipse cx="234" cy="492" rx="22" ry="8" fill="#e94f37" {o}/>
<path d="M148 395 L252 395 L246 445 L206 445 L200 425 L194 445 L154 445 Z" fill="#2f5f9e" {o}/>
<path d="M146 336 Q200 318 254 336 L262 402 Q200 414 138 402 Z" fill="{TEE}" {o}/>
<circle cx="188" cy="360" r="6" fill="#eee"/><circle cx="212" cy="360" r="6" fill="#eee"/><circle cx="200" cy="372" r="11" fill="#eee"/>
<circle cx="195" cy="370" r="3" fill="{TEE}"/><circle cx="205" cy="370" r="3" fill="{TEE}"/>
<path d="M150 345 L126 402" stroke="{TEE}" stroke-width="26" stroke-linecap="round"/><circle cx="124" cy="410" r="14" fill="{SKIN}" {o}/>
<path d="M252 342 L292 300" stroke="{TEE}" stroke-width="26" stroke-linecap="round"/>
<path d="M292 300 L300 245" stroke="{SKIN}" stroke-width="20" stroke-linecap="round"/>
<path d="M300 210 l-14 10 M300 205 l0 22 M312 210 l-4 14 M320 220 l-10 10" stroke="{INK}" stroke-width="5" stroke-linecap="round"/>
<circle cx="301" cy="232" r="17" fill="{SKIN}" {o}/>
<circle cx="88" cy="205" r="19" fill="{SKIN}" {o}/><circle cx="312" cy="205" r="19" fill="{SKIN}" {o}/>
<ellipse cx="200" cy="190" rx="112" ry="120" fill="{SKIN}" {o}/>
<path d="M200 74 C270 74 306 110 308 170 L294 168 C290 146 276 134 258 130 C238 120 218 122 200 124 C182 122 162 120 142 130 C124 134 110 146 106 168 L92 170 C94 110 130 74 200 74 Z" fill="{HAIR}" {o}/>
<path d="M150 98 l6 -14 M172 90 l5 -14 M196 86 l4 -14 M220 88 l3 -14 M244 92 l2 -14" stroke="#4a3828" stroke-width="4" stroke-linecap="round"/>
<ellipse cx="200" cy="268" rx="72" ry="44" fill="{STUB}" opacity="0.35"/>
<path d="M120 162 Q148 154 178 160 M222 160 Q252 154 280 162" stroke="#4a3828" stroke-width="7" fill="none" stroke-linecap="round"/>
<ellipse cx="150" cy="208" rx="22" ry="14" fill="#fff"/><ellipse cx="250" cy="208" rx="22" ry="14" fill="#fff"/>
<circle cx="152" cy="212" r="8" fill="#5f7d99"/><circle cx="252" cy="212" r="8" fill="#5f7d99"/>
<circle cx="152" cy="213" r="3.5" fill="{INK}"/><circle cx="252" cy="213" r="3.5" fill="{INK}"/>
<path d="M127 206 Q150 192 173 206 L173 196 Q150 186 127 196 Z" fill="{SKIN}"/><path d="M227 206 Q250 192 273 206 L273 196 Q250 186 227 196 Z" fill="{SKIN}"/>
<path d="M127 205 Q150 197 173 205 M227 205 Q250 197 273 205" stroke="{INK}" stroke-width="4" fill="none"/>
<rect x="106" y="176" width="88" height="62" rx="13" fill="none" stroke="{GLS}" stroke-width="10"/>
<rect x="206" y="176" width="88" height="62" rx="13" fill="none" stroke="{GLS}" stroke-width="10"/>
<path d="M194 196 L206 196 M106 190 L88 186 M294 190 L312 186" stroke="{GLS}" stroke-width="9"/>
<path d="M200 232 Q190 252 202 258" fill="none" stroke="{INK}" stroke-width="4" stroke-linecap="round"/>
<path d="M172 276 Q200 282 230 270" fill="none" stroke="{INK}" stroke-width="5" stroke-linecap="round"/>
<path d="M300 40 h86 a14 14 0 0 1 14 14 v38 a14 14 0 0 1 -14 14 h-50 l-22 20 l4 -20 h-18 a14 14 0 0 1 -14 -14 v-38 a14 14 0 0 1 14 -14 z" fill="#fff" stroke="{INK}" stroke-width="4"/>
<text x="343" y="85" text-anchor="middle" font-family="Arial Black, sans-serif" font-size="28" fill="{INK}">Hoho!</text>
''', bg='<rect width="400" height="520" fill="#8fd3c7"/><circle cx="60" cy="70" r="40" fill="#ffe08a"/>')


# B. Editorial caricature, three-quarter view, long face, huge glasses, rum glass. Ink + washes.
def caricature():
    ink = 'fill="none" stroke="#2a1d18" stroke-linecap="round" stroke-linejoin="round"'
    return card(f'''
<defs><filter id="wash"><feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" seed="2"/>
<feDisplacementMap in="SourceGraphic" scale="12"/><feGaussianBlur stdDeviation="1.2"/></filter></defs>
<g filter="url(#wash)" opacity="0.85">
<path d="M150 470 C160 430 200 418 240 420 C290 422 330 440 350 520 L120 520 Z" fill="#2e3440"/>
<path d="M142 118 C150 40 290 30 302 110 C312 170 306 240 292 300 C280 360 252 410 226 414 C200 418 180 400 172 372 C160 330 136 250 142 118 Z" fill="#f1bd98"/>
<path d="M240 160 C290 170 306 230 292 300 C282 350 262 390 240 405 C262 340 270 260 240 160 Z" fill="#d48f6e" opacity="0.7"/>
<path d="M176 360 C190 410 236 418 262 380 C258 350 230 336 200 340 Z" fill="#a27a62" opacity="0.45"/>
<path d="M148 150 C142 82 200 48 252 56 C282 60 300 82 302 106 L292 112 C282 96 262 92 246 100 C216 96 190 104 172 118 C160 128 152 146 152 166 Z" fill="#6e553d"/>
<rect x="318" y="300" width="46" height="70" rx="6" fill="#d98c3a" opacity="0.7"/>
</g>
<path d="M142 118 C150 40 290 30 302 110 C312 170 306 240 292 300 C280 360 252 410 226 414 C200 418 180 400 172 372 C160 330 136 250 142 118 Z" {ink} stroke-width="3"/>
<path d="M148 150 C142 82 200 48 252 56 C282 60 300 82 302 106 M150 160 L156 120 M168 110 L172 90 M190 96 L196 76 M214 92 L220 72 M240 92 L246 74 M262 92 L270 76" {ink} stroke-width="2.4"/>
<path d="M146 230 C126 222 122 252 132 270 C140 282 152 280 154 270" {ink} stroke-width="3"/>
<path d="M188 182 Q206 172 228 178 M258 176 Q276 170 292 178" {ink} stroke-width="4"/>
<rect x="176" y="190" width="64" height="50" rx="9" fill="#ffffff22" stroke="#111" stroke-width="7"/>
<rect x="252" y="187" width="56" height="50" rx="9" fill="#ffffff22" stroke="#111" stroke-width="7"/>
<path d="M240 206 L252 204 M176 200 L148 206" stroke="#111" stroke-width="6"/>
<path d="M192 214 Q208 206 224 214 M266 211 Q280 203 294 211" {ink} stroke-width="3.5"/>
<circle cx="210" cy="217" r="4" fill="#2a1d18"/><circle cx="282" cy="214" r="4" fill="#2a1d18"/>
<path d="M258 228 C266 268 292 296 286 312 C280 322 260 320 254 312" {ink} stroke-width="3"/>
<path d="M222 350 Q252 360 284 342" {ink} stroke-width="3.5"/>
<path d="M200 380 l2 2 M212 388 l2 2 M226 392 l2 2 M240 390 l2 2 M252 384 l2 2 M196 366 l2 2 M262 372 l2 2 M232 376 l2 2" stroke="#2a1d18" stroke-width="2"/>
<path d="M200 412 L196 452 M250 410 L262 440" {ink} stroke-width="3"/>
<path d="M150 470 C160 430 200 418 240 420 C290 422 330 440 350 520" {ink} stroke-width="3"/>
<path d="M318 300 L364 300 L360 372 L322 372 Z" {ink} stroke-width="3"/><path d="M326 330 h30" stroke="#fff" stroke-width="4" opacity="0.7"/>
<rect x="330" y="312" width="12" height="12" fill="#fff" opacity="0.8" transform="rotate(15 336 318)"/>
<path d="M300 380 C320 380 334 372 340 372" {ink} stroke-width="3"/>
<text x="30" y="500" font-family="Georgia, serif" font-style="italic" font-size="22" fill="#2a1d18">« Un pot à 11h30… »</text>
''', bg='<rect width="400" height="520" fill="#f7f1e6"/>')


# C. Doing nothing at work: full body, side view, feet on the desk, coffee, asleep.
def lazy_desk():
    l = 'stroke="#3b2a24" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"'
    return card(f'''
<rect width="400" height="360" fill="#e8f0f2"/><rect y="360" width="400" height="160" fill="#c9b79c"/>
<rect x="250" y="40" width="120" height="90" fill="#9fd3e6" {l}/><path d="M270 130 q20 -40 30 -60 q10 30 40 60" fill="#5fa86b"/>
<text x="20" y="40" font-family="Arial" font-size="15" fill="#6b7b83">ADMINISTRATION PUBLIQUE</text>
<rect x="20" y="300" width="200" height="16" fill="#a8774f" {l}/><path d="M36 316 V420 M204 316 V420" {l} stroke-width="8"/>
<rect x="40" y="228" width="92" height="66" rx="4" fill="#2b2d33" {l}/><rect x="48" y="236" width="76" height="50" fill="#7ad0a7"/>
<text x="86" y="266" text-anchor="middle" font-family="Courier New, monospace" font-size="11" fill="#1d3b2c">Solitaire</text>
<path d="M78 294 L94 294 L98 300 L74 300 Z" fill="#2b2d33"/>
<path d="M150 284 h22 v16 h-22 z" fill="#fff" {l}/><path d="M172 288 q10 0 0 10" fill="none" {l}/>
<path d="M156 278 q-4 -10 4 -16 M166 276 q-4 -10 4 -16" fill="none" stroke="#9aa" stroke-width="2"/>
<path d="M300 300 L360 300 L356 330 L296 330 Z" fill="#3c4250" {l}/><path d="M330 330 V400 M300 420 L360 420 M330 400 L300 420 M330 400 L360 420" {l} stroke-width="6"/>
<path d="M352 300 L380 200 L392 204 L366 304 Z" fill="#3c4250" {l}/>
<path d="M300 300 C280 296 220 296 196 292" stroke="#2f5f9e" stroke-width="26" stroke-linecap="round"/>
<path d="M200 292 L186 294" stroke="{SKIN}" stroke-width="16" stroke-linecap="round"/>
<path d="M176 286 l16 -2 l4 12 l-24 2 z" fill="#e94f37" {l}/>
<path d="M300 300 C320 260 340 230 360 210" stroke="{TEE}" stroke-width="44" stroke-linecap="round"/>
<path d="M345 222 C320 200 330 170 352 168" stroke="{TEE}" stroke-width="16" stroke-linecap="round"/>
<path d="M352 168 C360 166 368 168 370 172" stroke="{SKIN}" stroke-width="14" stroke-linecap="round"/>
<ellipse cx="368" cy="168" rx="28" ry="32" fill="{SKIN}" {l} transform="rotate(30 368 168)"/>
<path d="M346 150 C350 134 372 128 388 138 L382 146 C372 140 360 142 352 152 Z" fill="{HAIR}" {l}/>
<path d="M392 176 C394 186 388 196 380 198" fill="{STUB}" opacity="0.5"/>
<rect x="364" y="156" width="20" height="14" rx="3" fill="none" stroke="{GLS}" stroke-width="5" transform="rotate(30 374 163)"/>
<path d="M370 158 l-14 -6" stroke="{GLS}" stroke-width="4"/>
<path d="M368 163 q5 3 10 1" stroke="{INK}" stroke-width="2.5" fill="none"/>
<text x="300" y="110" font-family="Arial Black, sans-serif" font-size="30" fill="#5c6b8a" opacity="0.7">Z</text>
<text x="330" y="86" font-family="Arial Black, sans-serif" font-size="22" fill="#5c6b8a" opacity="0.6">z</text>
<text x="352" y="68" font-family="Arial Black, sans-serif" font-size="16" fill="#5c6b8a" opacity="0.5">z</text>
<text x="200" y="490" text-anchor="middle" font-family="Arial" font-size="18" fill="#5b4a3a">8h–15h</text>
''')


# D. Gym flex, comic book: shirtless, both biceps up, tiny smug head, action burst.
def gym_flex():
    o = f'stroke="#000" stroke-width="5" stroke-linejoin="round"'
    rays = "".join(f'<path d="M200 260 L{200 + 400 * __import__("math").cos(a / 10):.0f} {260 + 400 * __import__("math").sin(a / 10):.0f} '
                   f'L{200 + 400 * __import__("math").cos(a / 10 + 0.15):.0f} {260 + 400 * __import__("math").sin(a / 10 + 0.15):.0f} Z" fill="#ffd23f"/>'
                   for a in range(0, 63, 3))
    return card(f'''
<rect width="400" height="520" fill="#f4442e"/>{rays}
<path d="M110 520 C110 430 150 380 200 378 C250 380 290 430 290 520 Z" fill="{SKIN}" {o}/>
<path d="M150 410 Q200 440 250 410 M200 420 V480 M170 470 Q200 480 230 470" fill="none" stroke="#b5765a" stroke-width="4"/>
<path d="M150 395 C100 390 70 360 60 320 C52 290 60 250 80 230" fill="none" stroke="{SKIN}" stroke-width="44" stroke-linecap="round"/>
<path d="M250 395 C300 390 330 360 340 320 C348 290 340 250 320 230" fill="none" stroke="{SKIN}" stroke-width="44" stroke-linecap="round"/>
<ellipse cx="88" cy="318" rx="34" ry="28" fill="{SKIN}" {o}/><ellipse cx="312" cy="318" rx="34" ry="28" fill="{SKIN}" {o}/>
<path d="M70 300 q12 -10 30 -4 M300 296 q18 -6 30 4" stroke="#fff" stroke-width="4" fill="none" opacity="0.8"/>
<circle cx="80" cy="222" r="26" fill="{SKIN}" {o}/><circle cx="320" cy="222" r="26" fill="{SKIN}" {o}/>
<path d="M66 214 h28 M306 214 h28 M66 224 h28 M306 224 h28" stroke="#b5765a" stroke-width="3"/>
<path d="M176 380 L176 352 L224 352 L224 380" fill="{SKIN}" {o}/>
<ellipse cx="200" cy="312" rx="50" ry="56" fill="{SKIN}" {o}/>
<path d="M152 300 C150 262 172 250 200 250 C230 250 252 262 250 300 L242 298 C240 282 232 276 222 276 C210 270 190 270 178 276 C168 276 160 282 158 298 Z" fill="{HAIR}" {o} stroke-width="4"/>
<ellipse cx="200" cy="346" rx="36" ry="20" fill="{STUB}" opacity="0.35"/>
<rect x="160" y="298" width="36" height="26" rx="6" fill="#fff8" stroke="#000" stroke-width="6"/><rect x="204" y="298" width="36" height="26" rx="6" fill="#fff8" stroke="#000" stroke-width="6"/>
<path d="M168 312 h20 M212 312 h20" stroke="#000" stroke-width="4"/>
<path d="M182 352 Q200 360 220 346" fill="none" stroke="#000" stroke-width="4" stroke-linecap="round"/>
<path d="M262 280 q6 12 0 18 q-6 -6 0 -18 M138 286 q6 12 0 18 q-6 -6 0 -18" fill="#9fdcff" stroke="#000" stroke-width="2"/>
<text x="200" y="90" text-anchor="middle" font-family="Impact, Arial Black, sans-serif" font-size="70" fill="#fff" stroke="#000" stroke-width="5">HOHO!</text>
''')


# E. Profile poster: side view, two flat colours, big sun.
def profile_poster():
    return card(f'''
<rect width="400" height="520" fill="#14505c"/><circle cx="230" cy="240" r="150" fill="#f08a4b"/>
<path d="M120 520 C130 430 170 400 205 395 L210 340 C190 330 180 300 182 270 L178 250 C176 240 170 236 168 228 C176 224 182 220 182 210
C180 196 176 186 168 176 C176 170 186 168 190 160 C188 120 210 90 250 84 C290 80 320 100 330 140 C338 180 330 230 312 270 C304 300 300 330 302 360
C330 380 360 420 370 520 Z" fill="#0d2f36"/>
<path d="M190 160 C196 120 220 96 254 92 C276 90 296 100 308 116" fill="none" stroke="#f3d3b5" stroke-width="5" opacity="0.9"/>
<path d="M250 92 C280 86 316 104 326 140 C330 156 330 170 328 180" fill="none" stroke="#7a5c44" stroke-width="10" stroke-linecap="round"/>
<rect x="176" y="182" width="30" height="20" rx="4" fill="none" stroke="#f3d3b5" stroke-width="5"/>
<path d="M206 190 L272 196" stroke="#f3d3b5" stroke-width="5"/>
<path d="M188 300 l3 3 M196 306 l3 3 M184 290 l3 3 M204 312 l3 3 M192 284 l3 3" stroke="#f3d3b5" stroke-width="2.5"/>
<text x="40" y="470" font-family="Georgia, serif" font-size="56" fill="#f3d3b5" letter-spacing="6">PANDA</text>
<text x="44" y="498" font-family="Georgia, serif" font-style="italic" font-size="18" fill="#f3d3b5">Martinique · 8h–15h</text>
''')


# F. Pixel-art game sprite, full body, drawn pixel by pixel.
SPRITE = [
    "........kkkkkkkk........",
    "......kkhhhhhhhhkk......",
    ".....khhhhhhhhhhhhk.....",
    ".....khhsssssssshhk.....",
    "....kkhssssssssssshk....",
    "....kshhhhsssshhhhsk....",
    "...kgggggggssggggggk....",
    "...kgwwbwgggggwbwwgk....",
    "...kgwwwwgsssgwwwwgk....",
    "....kgggggsddsgggggk....",
    "....ksssssssdssssssk....",
    "....ksssssssssssssk.....",
    ".....kccccmmmmccck......",
    ".....kcccccccccccck.....",
    "......kccccccccck.......",
    "........kssssk..........",
    "....kkttttttttttttkk....",
    "...ktttttttwwtttttttk...",
    "..ksktttttwkkwtttttksk..",
    "..ksktttttwwwwtttttksk..",
    "..ksktttttttttttttksk...",
    "..kskttttttttttttttksk..",
    "...kk.kttttttttttk.kk...",
    "......knnnnnnnnnnk......",
    "......knnnnkknnnnk......",
    "......knnnk..knnnk......",
    ".......kssk..kssk.......",
    ".......kssk..kssk.......",
    "......krrrk..krrrk......",
    "......kkkkk..kkkkk......",
]
PALETTE = {"k": (26, 20, 22), "h": (110, 85, 61), "s": (240, 195, 163), "d": (217, 162, 131), "g": (22, 22, 26),
           "w": (250, 250, 250), "b": (80, 110, 140), "c": (196, 152, 122), "m": (150, 80, 70), "t": (31, 32, 38),
           "n": (47, 95, 158), "r": (233, 79, 55)}


def pixel_sprite():
    w, h = len(SPRITE[0]), len(SPRITE)
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    for y, row in enumerate(SPRITE):
        for x, ch in enumerate(row.ljust(w, ".")[:w]):
            if ch in PALETTE:
                img.putpixel((x, y), PALETTE[ch] + (255,))
    big = img.resize((w * 12, h * 12), Image.NEAREST)
    buf = io.BytesIO()
    big.save(buf, "PNG")
    uri = "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()
    return card(f'<image href="{uri}" x="56" y="70" width="{w * 12}" height="{h * 12}" style="image-rendering:pixelated"/>'
                '<text x="200" y="46" text-anchor="middle" font-family="Courier New, monospace" font-weight="bold" font-size="22" fill="#fff">PANDA  LV.1</text>',
                bg='<rect width="400" height="520" fill="#3a3f8f"/><rect y="440" width="400" height="80" fill="#2a8c5a"/>'
                   + "".join(f'<rect x="{x}" y="440" width="20" height="10" fill="#36a86d"/>' for x in range(0, 400, 40)))


DRAWINGS = [
    ("A", "Chibi game hero", "Full body, big head, waving \"Hoho!\" in flip-flops", chibi),
    ("B", "Editorial caricature", "Three-quarter view, long face, huge glasses, rum in hand; ink and wash", caricature),
    ("C", "Doing nothing", "Full body, side view, feet on the desk, asleep; flat cartoon", lazy_desk),
    ("D", "Gym comic", "Shirtless double-biceps flex, tiny smug head; comic-book burst", gym_flex),
    ("E", "Profile poster", "Side view in two flat colours, big sun; travel-poster look", profile_poster),
    ("F", "Pixel sprite", "Full-body game sprite drawn pixel by pixel", pixel_sprite),
]


def main():
    cards = [f'<figure><div class="art">{fn()}</div><figcaption><b>{k}. {n}</b><span>{d}</span></figcaption></figure>'
             for k, n, d, fn in DRAWINGS]
    html = ("<!doctype html><html><head><meta charset='utf-8'><title>Panda drawings</title><style>"
            "body{margin:0;padding:16px;background:#ece7de;font-family:system-ui,sans-serif;color:#222}"
            "h1{font-size:22px;margin:0 0 12px}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:16px}"
            "figure{margin:0;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px #0002}"
            ".art svg{display:block;width:100%;height:auto}figcaption{padding:8px 12px;display:flex;flex-direction:column;gap:2px;font-size:13px}"
            "</style></head><body><h1>Panda: six different drawings</h1><div class='grid'>" + "".join(cards) + "</div></body></html>")
    with open(sys.argv[1], "w", encoding="utf-8") as f:
        f.write(html)


if __name__ == "__main__":
    main()
