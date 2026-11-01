class_name CharacterLook
extends Resource
## Visual traits of one caricature, drawn by [Caricature].
## The cast's looks live in [CastLooks]; real art (story 003) may replace them.

enum Hair { SHORT, WAVY, CURLY, SHAVED, MESSY, LONG, PONYTAIL, BOB, CROPPED, SWEPT, SHAGGY }
enum Beard { NONE, STUBBLE, FULL }
enum Mouth { DEADPAN, GRIN, SMIRK, FROWN, SMILE, BIG_GRIN, POUT }
enum Shirt { PLAIN, ARGENTINA, HAWAIIAN, PANDA, SHIRT_AND_TIE, HOODIE, BLOUSE }

## Illustrated caricature head (SVG from tools/art/caricatures.py --heads).
## When set it replaces the code-drawn head.
@export_file("*.svg", "*.png") var head_path := ""
## Drawn height of the head (with neck), in pixels at scale 1.
@export var head_draw_height := 150.0
@export var skin := Color(0.96, 0.8, 0.68)
@export var hair := Hair.SHORT
@export var hair_color := Color(0.45, 0.3, 0.18)
## Grey at the temples (Romain).
@export var grey_temples := false
@export var beard := Beard.STUBBLE
@export var beard_color := Color(0.4, 0.28, 0.18)
@export var glasses := false
@export var sunglasses := false
@export var cap := false
@export var cap_color := Color(0.15, 0.15, 0.2)
@export var mouth := Mouth.DEADPAN
## Half-closed eyelids (Panda's selfie face).
@export var sleepy_eyes := false
## Brows angled down (Babar's frown, Mamar's mischief).
@export var angry_brows := false
## Eyelashes and coloured lips.
@export var lashes := false
@export var lips_color := Color(0.75, 0.3, 0.35)
@export var earrings := false
@export var shirt := Shirt.PLAIN
@export var shirt_color := Color(0.3, 0.45, 0.7)
@export var trousers_color := Color(0.2, 0.22, 0.3)
## A skirt instead of trousers.
@export var skirt := false
@export_group("Face shape")
## Half-width and half-height of the head, in pixels at scale 1.
@export var head_width := 26.0
@export var head_height := 34.0
## Stretches the jaw down (above 1.0) for long faces.
@export var jaw_length := 1.0
@export var nose_size := 1.0
## Raises one eyebrow (Babar's sceptical look).
@export var one_brow_raised := false
## Draws thick eyebrows.
@export var thick_brows := false
@export var glasses_color := Color(0.08, 0.07, 0.09)
@export var round_glasses := false
@export_group("")
## 1.0 = average height; Cous is taller and thinner.
@export var height := 1.0
@export var width := 1.0
