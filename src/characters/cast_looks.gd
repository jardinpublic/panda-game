class_name CastLooks
extends RefCounted
## Caricature traits for each cast member, taken from the reference photos and
## the private cast sheet. Placeholder art until story 003.
##
## Example: figure.look = CastLooks.get_look(CastLooks.ROMAIN)

const PANDA := &"panda"
const ROMAIN := &"romain"
const MAMAR := &"mamar"
const VICTOR := &"victor"
const COUS := &"cous"
const BABAR := &"babar"
const ALINE := &"aline"
const EUGENIE := &"eugenie"
const VIOLAINE := &"violaine"

const ALL: Array[StringName] = [PANDA, ROMAIN, MAMAR, VICTOR, COUS, BABAR, ALINE, EUGENIE, VIOLAINE]


static func get_look(id: StringName) -> CharacterLook:
	var l := CharacterLook.new()
	var head := "res://assets/art/characters/%s/head.svg" % id
	if ResourceLoader.exists(head):
		l.head_path = head
	match id:
		PANDA:
			# Slim athletic, narrow longish face, short cropped light-brown hair,
			# light stubble, thick black rectangular glasses, deadpan half-lidded stare.
			l.skin = Color(0.96, 0.8, 0.68)
			l.hair = CharacterLook.Hair.CROPPED
			l.hair_color = Color(0.52, 0.37, 0.22)
			l.beard = CharacterLook.Beard.STUBBLE
			l.beard_color = Color(0.5, 0.36, 0.24)
			l.glasses = true
			l.mouth = CharacterLook.Mouth.DEADPAN
			l.sleepy_eyes = true
			l.head_width = 23.0
			l.head_height = 34.0
			l.jaw_length = 1.12
			l.shirt = CharacterLook.Shirt.PANDA
			l.shirt_color = Color(0.97, 0.97, 0.95)
			l.trousers_color = Color(0.25, 0.3, 0.42)
			l.width = 0.92
		ROMAIN:
			# Dark swept wavy hair receding at the temples, greying sides, long face,
			# long nose, huge toothy grin, stubble. The boss: shirt and tie.
			l.skin = Color(0.88, 0.7, 0.56)
			l.hair = CharacterLook.Hair.SWEPT
			l.hair_color = Color(0.17, 0.13, 0.11)
			l.grey_temples = true
			l.beard = CharacterLook.Beard.STUBBLE
			l.beard_color = Color(0.22, 0.17, 0.15)
			l.mouth = CharacterLook.Mouth.BIG_GRIN
			l.thick_brows = true
			l.head_width = 24.0
			l.head_height = 35.0
			l.jaw_length = 1.15
			l.nose_size = 1.3
			l.shirt = CharacterLook.Shirt.SHIRT_AND_TIE
			l.shirt_color = Color(0.72, 0.84, 0.95)
			l.trousers_color = Color(0.16, 0.18, 0.26)
		MAMAR:
			# Shaved head, slim face, full brown beard, mischievous squint,
			# Argentina shirt.
			l.skin = Color(0.93, 0.76, 0.62)
			l.hair = CharacterLook.Hair.SHAVED
			l.beard = CharacterLook.Beard.FULL
			l.beard_color = Color(0.38, 0.25, 0.14)
			l.mouth = CharacterLook.Mouth.SMIRK
			l.angry_brows = true
			l.head_width = 24.0
			l.head_height = 35.0
			l.nose_size = 1.15
			l.shirt = CharacterLook.Shirt.ARGENTINA
			l.trousers_color = Color(0.12, 0.14, 0.2)
			l.width = 0.88
		VICTOR:
			# Tanned sailor, tousled curly light-brown hair, stubble, wide toothy smile.
			l.skin = Color(0.86, 0.66, 0.5)
			l.hair = CharacterLook.Hair.CURLY
			l.hair_color = Color(0.5, 0.36, 0.22)
			l.beard = CharacterLook.Beard.STUBBLE
			l.beard_color = Color(0.4, 0.28, 0.18)
			l.mouth = CharacterLook.Mouth.BIG_GRIN
			l.head_width = 24.0
			l.jaw_length = 1.08
			l.shirt = CharacterLook.Shirt.PLAIN
			l.shirt_color = Color(0.12, 0.16, 0.3)
			l.trousers_color = Color(0.85, 0.42, 0.3)
			l.width = 0.9
		COUS:
			# Tall and lanky, long face, shaggy dirty-blond hair over the forehead,
			# reddish beard, Hawaiian shirt.
			l.skin = Color(0.97, 0.82, 0.72)
			l.hair = CharacterLook.Hair.SHAGGY
			l.hair_color = Color(0.74, 0.58, 0.34)
			l.beard = CharacterLook.Beard.STUBBLE
			l.beard_color = Color(0.72, 0.4, 0.2)
			l.mouth = CharacterLook.Mouth.DEADPAN
			l.sleepy_eyes = true
			l.head_width = 23.0
			l.head_height = 36.0
			l.jaw_length = 1.2
			l.nose_size = 1.1
			l.shirt = CharacterLook.Shirt.HAWAIIAN
			l.shirt_color = Color(0.1, 0.5, 0.32)
			l.trousers_color = Color(0.3, 0.32, 0.36)
			l.height = 1.15
			l.width = 0.82
		BABAR:
			# Shaved head, stubble, rectangular glasses, sceptical pout with one
			# eyebrow up, cap screwed on, dark hoodie.
			l.skin = Color(0.95, 0.78, 0.66)
			l.hair = CharacterLook.Hair.SHAVED
			l.beard = CharacterLook.Beard.STUBBLE
			l.beard_color = Color(0.5, 0.38, 0.26)
			l.glasses = true
			l.glasses_color = Color(0.15, 0.2, 0.45)
			l.cap = true
			l.cap_color = Color(0.1, 0.12, 0.16)
			l.mouth = CharacterLook.Mouth.POUT
			l.one_brow_raised = true
			l.head_width = 27.0
			l.head_height = 34.0
			l.shirt = CharacterLook.Shirt.HOODIE
			l.shirt_color = Color(0.2, 0.22, 0.24)
			l.trousers_color = Color(0.22, 0.3, 0.45)
			l.width = 1.05
		ALINE:
			# Brown hair tied back, rectangular glasses, slim face, warm smile.
			l.skin = Color(0.97, 0.83, 0.74)
			l.hair = CharacterLook.Hair.PONYTAIL
			l.hair_color = Color(0.42, 0.28, 0.18)
			l.beard = CharacterLook.Beard.NONE
			l.glasses = true
			l.glasses_color = Color(0.35, 0.22, 0.16)
			l.lashes = true
			l.mouth = CharacterLook.Mouth.SMILE
			l.head_width = 23.0
			l.jaw_length = 1.08
			l.shirt = CharacterLook.Shirt.BLOUSE
			l.shirt_color = Color(0.2, 0.55, 0.6)
			l.trousers_color = Color(0.2, 0.22, 0.3)
			l.height = 0.95
			l.width = 0.84
		EUGENIE:
			# Fair loose hair, red glasses, round face, big playful grin.
			l.skin = Color(0.98, 0.85, 0.77)
			l.hair = CharacterLook.Hair.BOB
			l.hair_color = Color(0.86, 0.72, 0.45)
			l.beard = CharacterLook.Beard.NONE
			l.glasses = true
			l.glasses_color = Color(0.72, 0.12, 0.16)
			l.round_glasses = true
			l.lashes = true
			l.earrings = true
			l.mouth = CharacterLook.Mouth.BIG_GRIN
			l.head_width = 27.0
			l.head_height = 32.0
			l.shirt = CharacterLook.Shirt.BLOUSE
			l.shirt_color = Color(0.12, 0.12, 0.16)
			l.skirt = true
			l.trousers_color = Color(0.78, 0.2, 0.25)
			l.height = 0.93
			l.width = 0.9
		VIOLAINE:
			# Long dark hair, strong dark brows, big bright smile, outdoorsy.
			l.skin = Color(0.94, 0.77, 0.64)
			l.hair = CharacterLook.Hair.LONG
			l.hair_color = Color(0.11, 0.08, 0.07)
			l.beard = CharacterLook.Beard.NONE
			l.lashes = true
			l.earrings = true
			l.thick_brows = true
			l.mouth = CharacterLook.Mouth.BIG_GRIN
			l.head_width = 24.0
			l.jaw_length = 1.08
			l.shirt = CharacterLook.Shirt.BLOUSE
			l.shirt_color = Color(0.9, 0.4, 0.32)
			l.trousers_color = Color(0.25, 0.35, 0.55)
			l.height = 0.95
			l.width = 0.84
	return l
