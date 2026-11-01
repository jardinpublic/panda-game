class_name Caricature
extends Node2D
## A cast member drawn in code from a [CharacterLook]. Classic TV-cartoon
## style: thick ink outlines, flat colours, big bulging eyes, long nose and a
## stubble "muzzle". Front view, feet at the node's origin. Walks, blinks,
## flinches and sleeps. Placeholder art until story 003.
##
## Example:
##     var figure := Caricature.new()
##     figure.look = CastLooks.get_look(CastLooks.ROMAIN)
##     figure.walking = true

const INK := Color(0.08, 0.07, 0.09)
const WHITE := Color(1.0, 1.0, 0.98)
const LINE := 3.0
const EYE_R := 10.0
const ARG_BLUE := Color(0.47, 0.73, 0.93)
const FLOWER_COLORS: PackedColorArray = [
	Color(0.98, 0.55, 0.3), Color(0.98, 0.85, 0.35), Color(0.95, 0.45, 0.6), Color(0.85, 0.65, 0.45)]
const FLOWER_SPOTS: PackedVector2Array = [
	Vector2(-14, 12), Vector2(10, 22), Vector2(-4, 40), Vector2(14, 48), Vector2(-16, 52), Vector2(6, 8)]

## Traits to draw.
@export var look: CharacterLook:
	set(value):
		look = value
		_head_tex = load(value.head_path) if value and value.head_path != "" else null
		queue_redraw()
## True while moving: legs swing and the body bobs.
var walking := false
## True while asleep: eyes closed.
var sleeping := false:
	set(value):
		sleeping = value
		queue_redraw()
## Facing left mirrors the drawing.
var facing_left := false:
	set(value):
		facing_left = value
		scale.x = -absf(scale.x) if value else absf(scale.x)

## Where the neck sits in the head SVG, as a fraction of its size.
const HEAD_NECK_X := 0.478
const HEAD_NECK_Y := 0.905

var _head_tex: Texture2D
var _phase := 0.0
var _rx := 26.0
var _ry := 34.0
var _blink_timer := 3.0
var _blinking := false
var _flinch_timer := 0.0


func _ready() -> void:
	if look == null:
		look = CharacterLook.new()
	_blink_timer = randf_range(2.0, 5.0)


## Shakes and grimaces for [param seconds] (Babar's lighter or spit).
func flinch(seconds: float) -> void:
	_flinch_timer = seconds


func is_flinching() -> bool:
	return _flinch_timer > 0.0


## Height of the top of the head above the feet, for placing speech bubbles.
func head_top() -> float:
	if _head_tex:
		return (42.0 + 62.0) * look.height + look.head_draw_height * HEAD_NECK_Y
	return (42.0 + 62.0) * look.height + look.head_height * 2.0 + 10.0


func _process(delta: float) -> void:
	var changed := false
	if walking:
		_phase += delta * 10.0
		changed = true
	elif _phase != 0.0:
		_phase = 0.0
		changed = true
	_blink_timer -= delta
	if _blink_timer <= 0.0:
		_blinking = not _blinking
		_blink_timer = 0.12 if _blinking else randf_range(2.5, 5.0)
		changed = true
	if _flinch_timer > 0.0:
		_flinch_timer -= delta
		changed = true
	if changed:
		queue_redraw()


func _draw() -> void:
	_rx = look.head_width
	_ry = look.head_height
	var h := look.height
	var w := look.width
	var bob := -absf(sin(_phase)) * 3.0 if walking else 0.0
	var shake := Vector2(sin(_flinch_timer * 60.0) * 3.0, 0.0) if _flinch_timer > 0.0 else Vector2.ZERO
	var leg_len := 42.0 * h
	var torso_h := 62.0 * h
	var torso_w := 54.0 * w
	var hip_y := -leg_len + bob
	var shoulder_y := hip_y - torso_h
	var head := Vector2(2, shoulder_y - _ry + 6.0) + shake

	_draw_shadow()
	_draw_legs(leg_len, bob, w)
	if _head_tex:
		_draw_arms(shoulder_y, torso_w, h)
		_draw_torso(hip_y, shoulder_y, torso_w)
		_draw_head_texture(shoulder_y + 10.0, shake)
		return
	_draw_back_hair(head)
	if look.shirt == CharacterLook.Shirt.HOODIE:
		_disc(head + Vector2(0, 10), _rx + 12.0, look.shirt_color.darkened(0.15))
	_draw_arms(shoulder_y, torso_w, h)
	_draw_torso(hip_y, shoulder_y, torso_w)
	_draw_head(head)


## Draws the illustrated head so its neck lands on the shoulders.
func _draw_head_texture(neck_y: float, shake: Vector2) -> void:
	var height := look.head_draw_height
	var size := Vector2(height * _head_tex.get_width() / _head_tex.get_height(), height)
	var tilt := sin(_phase * 0.5) * 0.04 if walking else 0.0
	var origin := Vector2(-size.x * HEAD_NECK_X, neck_y - size.y * HEAD_NECK_Y) + shake
	draw_set_transform(Vector2(0, neck_y), tilt, Vector2.ONE)
	draw_texture_rect(_head_tex, Rect2(origin - Vector2(0, neck_y), size), false)
	draw_set_transform(Vector2.ZERO)


# --- Drawing helpers -------------------------------------------------------

## Filled polygon with an ink outline.
func _shape(points: PackedVector2Array, fill: Color) -> void:
	draw_colored_polygon(points, fill)
	var closed := points.duplicate()
	closed.append(points[0])
	draw_polyline(closed, INK, LINE, true)


## Filled disc with an ink outline.
func _disc(c: Vector2, r: float, fill: Color) -> void:
	draw_circle(c, r + LINE * 0.5, INK)
	draw_circle(c, r - LINE * 0.5, fill)


func _ellipse(c: Vector2, rx: float, ry: float, from_deg := 0.0, to_deg := 360.0,
		steps := 28) -> PackedVector2Array:
	var points := PackedVector2Array()
	var full := is_equal_approx(to_deg - from_deg, 360.0)
	var count := steps if full else steps + 1
	for i in count:
		var a := deg_to_rad(lerpf(from_deg, to_deg, float(i) / steps))
		points.append(c + Vector2(cos(a) * rx, sin(a) * ry))
	return points


## Draws several discs as one merged blob with a single outline.
func _blob(centers: PackedVector2Array, radii: PackedFloat32Array, fill: Color) -> void:
	for i in centers.size():
		draw_circle(centers[i], radii[i] + LINE * 0.5, INK)
	for i in centers.size():
		draw_circle(centers[i], radii[i] - LINE * 0.5, fill)


# --- Body ------------------------------------------------------------------

func _draw_shadow() -> void:
	draw_set_transform(Vector2(0, 2), 0.0, Vector2(1.0, 0.3))
	draw_circle(Vector2.ZERO, 32.0 * look.width, Color(0, 0, 0, 0.22))
	draw_set_transform(Vector2.ZERO)


func _draw_legs(leg_len: float, bob: float, w: float) -> void:
	var swing := sin(_phase) * 5.0
	var leg_color := look.skin if look.skirt else look.trousers_color
	for side: float in [-1.0, 1.0]:
		var lift := maxf(0.0, swing * side)
		var x := 10.0 * w * side
		var top := -leg_len + bob
		_shape(PackedVector2Array([Vector2(x - 7.0 * w, top), Vector2(x + 7.0 * w, top),
			Vector2(x + 6.0 * w, -lift - 4.0), Vector2(x - 6.0 * w, -lift - 4.0)]), leg_color)
		_shape(_ellipse(Vector2(x + 4.0 * side, -lift - 4.0), 11.0, 6.0), INK.lightened(0.15))


func _draw_arms(shoulder_y: float, torso_w: float, h: float) -> void:
	var swing := sin(_phase) * 8.0
	var sleeve := look.shirt_color.darkened(0.1)
	if look.shirt == CharacterLook.Shirt.ARGENTINA:
		sleeve = WHITE.darkened(0.04)
	for side: float in [-1.0, 1.0]:
		var shoulder := Vector2((torso_w * 0.5 - 2.0) * side, shoulder_y + 10.0)
		var hand := shoulder + Vector2(6.0 * side, 48.0 * h + swing * side)
		if _flinch_timer > 0.0:
			hand = shoulder + Vector2(22.0 * side, -22.0)
		draw_line(shoulder, hand, INK, 14.0 + LINE * 2.0)
		draw_line(shoulder, hand, sleeve, 14.0)
		_disc(hand, 7.5, look.skin)


func _draw_torso(hip_y: float, shoulder_y: float, torso_w: float) -> void:
	var half := torso_w * 0.5
	var bottom := hip_y + 6.0
	var body := PackedVector2Array([
		Vector2(-half + 6, shoulder_y), Vector2(half - 6, shoulder_y),
		Vector2(half + 1, shoulder_y + 10), Vector2(half + 3, bottom),
		Vector2(-half - 3, bottom), Vector2(-half - 1, shoulder_y + 10)])
	var base := WHITE if look.shirt == CharacterLook.Shirt.ARGENTINA else look.shirt_color
	draw_colored_polygon(body, base)
	var top := Vector2(0, shoulder_y)
	match look.shirt:
		CharacterLook.Shirt.ARGENTINA:
			var stripe := torso_w / 5.0
			for i: int in [1, 3]:
				draw_rect(Rect2(-half + stripe * i, shoulder_y + 1, stripe, bottom - shoulder_y - 1), ARG_BLUE)
			draw_circle(top + Vector2(11, 16), 3.5, Color(0.1, 0.15, 0.35))
		CharacterLook.Shirt.HAWAIIAN:
			for i in FLOWER_SPOTS.size():
				var spot := top + Vector2(FLOWER_SPOTS[i].x * torso_w / 54.0, FLOWER_SPOTS[i].y)
				if spot.y < bottom - 4.0:
					draw_circle(spot, 5.0, FLOWER_COLORS[i % FLOWER_COLORS.size()])
					draw_circle(spot, 2.0, Color(0.98, 0.95, 0.85))
			draw_line(top + Vector2(0, 6), Vector2(0, bottom), INK, 2.0)
		CharacterLook.Shirt.PANDA:
			var c := top + Vector2(0, 30)
			draw_circle(c + Vector2(-10, -10), 6.0, INK)
			draw_circle(c + Vector2(10, -10), 6.0, INK)
			draw_circle(c, 12.0, WHITE.darkened(0.05))
			draw_circle(c + Vector2(-5, -1), 3.5, INK)
			draw_circle(c + Vector2(5, -1), 3.5, INK)
			draw_circle(c + Vector2(0, 5), 2.0, INK)
		CharacterLook.Shirt.SHIRT_AND_TIE:
			_shape(PackedVector2Array([top + Vector2(-4, 6), top + Vector2(4, 6),
				top + Vector2(6, 40), top + Vector2(0, 48), top + Vector2(-6, 40)]), Color(0.8, 0.15, 0.18))
			_shape(PackedVector2Array([top + Vector2(-14, 0), top + Vector2(0, 0), top + Vector2(-4, 10)]), WHITE)
			_shape(PackedVector2Array([top + Vector2(14, 0), top + Vector2(0, 0), top + Vector2(4, 10)]), WHITE)
		CharacterLook.Shirt.HOODIE:
			draw_line(top + Vector2(-6, 4), top + Vector2(-6, 26), WHITE.darkened(0.2), 2.0)
			draw_line(top + Vector2(6, 4), top + Vector2(6, 26), WHITE.darkened(0.2), 2.0)
			_shape(PackedVector2Array([top + Vector2(-17, 36), top + Vector2(17, 36),
				top + Vector2(17, 50), top + Vector2(-17, 50)]), look.shirt_color.darkened(0.2))
		CharacterLook.Shirt.BLOUSE:
			draw_arc(top, 12.0, deg_to_rad(10), deg_to_rad(170), 10, INK, 2.0)
			draw_circle(top + Vector2(0, 26), 2.2, WHITE)
			draw_circle(top + Vector2(0, 38), 2.2, WHITE)
	var closed := body.duplicate()
	closed.append(body[0])
	draw_polyline(closed, INK, LINE, true)
	if look.skirt:
		_shape(PackedVector2Array([Vector2(-half - 3, bottom - 10), Vector2(half + 3, bottom - 10),
			Vector2(half + 10, bottom + 22), Vector2(-half - 10, bottom + 22)]), look.trousers_color)
	else:
		draw_line(Vector2(-half - 2, bottom - 2), Vector2(half + 2, bottom - 2), look.trousers_color.darkened(0.3), 4.0)


# --- Head ------------------------------------------------------------------

func _draw_back_hair(c: Vector2) -> void:
	var col := look.hair_color
	match look.hair:
		CharacterLook.Hair.LONG:
			_shape(PackedVector2Array([c + Vector2(-_rx - 6, -16), c + Vector2(_rx + 6, -16),
				c + Vector2(_rx + 12, 72), c + Vector2(-_rx - 12, 72)]), col)
		CharacterLook.Hair.BOB:
			_shape(PackedVector2Array([c + Vector2(-_rx - 8, -16), c + Vector2(_rx + 8, -16),
				c + Vector2(_rx + 12, 34), c + Vector2(-_rx - 12, 34)]), col)
		CharacterLook.Hair.PONYTAIL:
			_shape(_ellipse(c + Vector2(_rx + 6, 12), 10.0, 28.0), col)


func _draw_head(c: Vector2) -> void:
	var skin := look.skin
	for side: float in [-1.0, 1.0]:
		_disc(c + Vector2((_rx - 1.0) * side, 4), 7.0, skin.darkened(0.04))
		if look.earrings:
			_disc(c + Vector2((_rx + 1.0) * side, 14), 3.0, Color(0.95, 0.8, 0.3))
	_shape(_head_shape(c), skin)
	_draw_hair_top(c)
	_draw_muzzle(c)
	_draw_mouth(c + Vector2(2, 20 * look.jaw_length))
	_shape(_ellipse(c + Vector2(3, 6), 6.0 * look.nose_size, 7.5 * look.nose_size), skin)
	_draw_eyes(c)
	if look.cap:
		_draw_cap(c)


## Head outline: an ellipse whose lower half is stretched by jaw_length.
func _head_shape(c: Vector2) -> PackedVector2Array:
	var points := _ellipse(c, _rx, _ry, 0.0, 360.0, 32)
	for i in points.size():
		var p := points[i] - c
		if p.y > 0.0:
			p = Vector2(p.x * lerpf(1.0, 0.86, p.y / _ry * (look.jaw_length - 1.0) * 4.0), p.y * look.jaw_length)
		points[i] = c + p
	return points


func _draw_muzzle(c: Vector2) -> void:
	var center := c + Vector2(2, 19 * look.jaw_length)
	match look.beard:
		CharacterLook.Beard.STUBBLE:
			_shape(_ellipse(center, 17.0, 12.5), look.skin.lerp(look.beard_color, 0.4))
		CharacterLook.Beard.FULL:
			_blob(PackedVector2Array([center, c + Vector2(2, 34), c + Vector2(-14, 18), c + Vector2(18, 18)]),
				PackedFloat32Array([17.0, 13.0, 9.0, 9.0]), look.beard_color)
		CharacterLook.Beard.NONE:
			draw_arc(center + Vector2(0, -2), 16.0, deg_to_rad(20), deg_to_rad(160), 12, look.skin.darkened(0.12), 2.0)


func _draw_hair_top(c: Vector2) -> void:
	var col := look.hair_color
	var top := c + Vector2(0, -_ry + 6)
	match look.hair:
		CharacterLook.Hair.SHAVED:
			draw_arc(c + Vector2(-9, -20), 10.0, deg_to_rad(200), deg_to_rad(260), 8, Color(1, 1, 1, 0.55), 4.0)
		CharacterLook.Hair.SHORT:
			_shape(_ellipse(c + Vector2(0, -12), _rx + 2.0, _ry - 10.0, 190.0, 350.0, 16), col)
		CharacterLook.Hair.WAVY:
			_blob(PackedVector2Array([top + Vector2(-16, 2), top + Vector2(-5, -6), top + Vector2(8, -5),
				top + Vector2(18, 3), top + Vector2(-22, 12), top + Vector2(23, 12)]),
				PackedFloat32Array([10, 11, 11, 10, 7, 7]), col)
		CharacterLook.Hair.CURLY:
			var centers := PackedVector2Array()
			var radii := PackedFloat32Array()
			for i in 11:
				var a := deg_to_rad(170.0 + i * 20.0)
				centers.append(c + Vector2(cos(a) * (_rx + 3.0), sin(a) * (_ry - 2.0) - 2.0))
				radii.append(9.0)
			centers.append(top + Vector2(0, 2))
			radii.append(14.0)
			_blob(centers, radii, col)
		CharacterLook.Hair.MESSY:
			for i in 7:
				var a := deg_to_rad(195.0 + i * 25.0)
				var base := c + Vector2(cos(a) * _rx * 0.8, sin(a) * _ry * 0.8 - 4.0)
				var tip := c + Vector2(cos(a + 0.2) * (_rx + 12.0), sin(a + 0.2) * (_ry + 12.0) - 4.0)
				_shape(PackedVector2Array([base + Vector2(-8, 4), tip, base + Vector2(8, 4)]), col)
			_shape(_ellipse(c + Vector2(0, -12), _rx + 1.0, _ry - 12.0, 190.0, 350.0, 16), col)
		CharacterLook.Hair.LONG, CharacterLook.Hair.BOB:
			_shape(PackedVector2Array([c + Vector2(-_rx - 6, -12), c + Vector2(-_rx + 2, -_ry + 2),
				c + Vector2(0, -_ry - 6), c + Vector2(_rx - 2, -_ry + 2),
				c + Vector2(_rx + 6, -12), c + Vector2(_rx - 4, -18), c + Vector2(4, -26),
				c + Vector2(-_rx + 4, -18)]), col)
		CharacterLook.Hair.CROPPED:
			_shape(PackedVector2Array([c + Vector2(-_rx - 1, -6), c + Vector2(-_rx + 2, -_ry + 6),
				c + Vector2(-8, -_ry - 3), c + Vector2(10, -_ry - 3), c + Vector2(_rx - 2, -_ry + 6),
				c + Vector2(_rx + 1, -6), c + Vector2(_rx - 6, -16), c + Vector2(6, -_ry + 9),
				c + Vector2(0, -_ry + 14), c + Vector2(-6, -_ry + 9), c + Vector2(-_rx + 6, -16)]), col)
		CharacterLook.Hair.SWEPT:
			_shape(PackedVector2Array([c + Vector2(-_rx - 1, -4), c + Vector2(-_rx, -_ry + 8),
				c + Vector2(-14, -_ry - 5), c + Vector2(4, -_ry - 9), c + Vector2(20, -_ry - 4),
				c + Vector2(_rx + 1, -_ry + 10), c + Vector2(_rx + 1, -4), c + Vector2(_rx - 5, -14),
				c + Vector2(_rx - 8, -_ry + 13), c + Vector2(10, -_ry + 6), c + Vector2(-4, -_ry + 10),
				c + Vector2(-_rx + 9, -_ry + 13), c + Vector2(-_rx + 5, -14)]), col)
			draw_polyline(PackedVector2Array([c + Vector2(-12, -_ry - 1), c + Vector2(2, -_ry - 4),
				c + Vector2(16, -_ry)]), col.lightened(0.3), 2.0, true)
		CharacterLook.Hair.SHAGGY:
			_shape(PackedVector2Array([c + Vector2(-_rx - 8, 16), c + Vector2(-_rx - 9, -6),
				c + Vector2(-_rx - 4, -_ry + 2), c + Vector2(-12, -_ry - 9), c + Vector2(6, -_ry - 11),
				c + Vector2(_rx, -_ry - 2), c + Vector2(_rx + 9, -8), c + Vector2(_rx + 8, 14),
				c + Vector2(_rx + 1, 2), c + Vector2(_rx - 3, -10), c + Vector2(_rx - 6, -16),
				c + Vector2(13, -11), c + Vector2(9, -19), c + Vector2(3, -12), c + Vector2(-3, -21),
				c + Vector2(-8, -12), c + Vector2(-14, -19), c + Vector2(-_rx + 4, -13),
				c + Vector2(-_rx + 1, 0), c + Vector2(-_rx - 2, 12)]), col)
			draw_line(c + Vector2(-6, -_ry - 4), c + Vector2(-12, -_ry + 10), col.darkened(0.25), 2.0)
			draw_line(c + Vector2(10, -_ry - 3), c + Vector2(16, -_ry + 12), col.darkened(0.25), 2.0)
		CharacterLook.Hair.PONYTAIL:
			_shape(_ellipse(c + Vector2(0, -12), _rx + 2.0, _ry - 10.0, 185.0, 355.0, 16), col)
			_disc(c + Vector2(_rx + 2, -6), 5.0, Color(0.85, 0.3, 0.4))
	if look.grey_temples:
		var grey := Color(0.78, 0.78, 0.78)
		_disc(c + Vector2(-_rx + 3, -6), 4.0, grey)
		_disc(c + Vector2(_rx - 3, -6), 4.0, grey)


func _draw_cap(c: Vector2) -> void:
	_shape(_ellipse(c + Vector2(0, -21), _rx + 3.0, _ry - 12.0, 180.0, 360.0, 16), look.cap_color)
	_shape(PackedVector2Array([c + Vector2(-_rx - 2, -21), c + Vector2(_rx + 2, -21),
		c + Vector2(_rx + 22, -16), c + Vector2(-_rx + 8, -16)]), look.cap_color.darkened(0.25))


func _draw_eyes(c: Vector2) -> void:
	var eye_y := c.y - 8.0
	var flinching := _flinch_timer > 0.0
	var closed := sleeping or _blinking
	for side: float in [-1.0, 1.0]:
		var e := Vector2(c.x + 1.0 + 10.0 * side, eye_y)
		_disc(e, EYE_R, WHITE)
		if flinching:
			draw_line(e + Vector2(-5, -4), e + Vector2(5, 4), INK, 2.5)
			draw_line(e + Vector2(-5, 4), e + Vector2(5, -4), INK, 2.5)
		elif closed:
			draw_colored_polygon(_ellipse(e, EYE_R - 1.0, EYE_R - 1.0, 180.0, 360.0, 12), look.skin)
			draw_line(e + Vector2(-EYE_R, 0), e + Vector2(EYE_R, 0), INK, LINE)
		else:
			draw_circle(e + Vector2(1.5, 1.0), 2.6, INK)
			if look.sleepy_eyes:
				var lid := _ellipse(e, EYE_R - 1.0, EYE_R - 1.0, 205.0, 335.0, 10)
				draw_colored_polygon(lid, look.skin.darkened(0.04))
				draw_line(lid[0], lid[lid.size() - 1], INK, LINE)
		if look.lashes:
			for k in 3:
				var a := deg_to_rad(235.0 + k * 35.0) if side > 0.0 else deg_to_rad(305.0 - k * 35.0)
				var root := e + Vector2(cos(a), sin(a)) * EYE_R
				draw_line(root, root + Vector2(cos(a), sin(a)) * 5.0, INK, 2.0)
		var brow_w := 5.0 if look.thick_brows else 3.5
		var brow_col := INK if look.hair == CharacterLook.Hair.SHAVED else look.hair_color.darkened(0.35)
		if look.one_brow_raised and side > 0.0 and not flinching:
			draw_line(Vector2(e.x - 7.0, eye_y - 16.0), Vector2(e.x + 8.0, eye_y - 19.0), brow_col, brow_w)
		elif look.angry_brows or flinching:
			draw_line(Vector2(e.x - 8.0 * side, eye_y - 9.0), Vector2(e.x + 8.0 * side, eye_y - 15.0), brow_col, brow_w)
		elif look.thick_brows:
			draw_line(Vector2(e.x - 8.0, eye_y - 13.0), Vector2(e.x + 8.0, eye_y - 13.0), brow_col, brow_w)
	if look.sunglasses:
		_disc(Vector2(c.x - 9, eye_y), EYE_R + 1.0, INK)
		_disc(Vector2(c.x + 11, eye_y), EYE_R + 1.0, INK)
	if look.glasses:
		var frame := look.glasses_color
		for side: float in [-1.0, 1.0]:
			var e := Vector2(c.x + 1.0 + 10.0 * side, eye_y)
			if look.round_glasses:
				draw_arc(e, EYE_R + 2.0, 0.0, TAU, 20, frame, 3.0)
			else:
				draw_rect(Rect2(e - Vector2(EYE_R + 2, EYE_R - 2), Vector2(EYE_R * 2 + 4, EYE_R * 2 - 3)), frame, false, 3.2)
		draw_line(Vector2(c.x - 1, eye_y - 3), Vector2(c.x + 3, eye_y - 3), frame, 3.0)


func _draw_mouth(m: Vector2) -> void:
	if _flinch_timer > 0.0:
		_shape(_ellipse(m + Vector2(0, 1), 7.0, 6.0), Color(0.45, 0.1, 0.12))
		return
	if sleeping:
		_shape(_ellipse(m, 4.0, 3.0), Color(0.45, 0.1, 0.12))
		return
	var ink := look.lips_color if look.lashes else INK
	match look.mouth:
		CharacterLook.Mouth.DEADPAN:
			draw_line(m + Vector2(-8, 0), m + Vector2(8, 0), ink, LINE)
		CharacterLook.Mouth.GRIN:
			_shape(PackedVector2Array([m + Vector2(-12, -3), m + Vector2(12, -3),
				m + Vector2(6, 7), m + Vector2(-6, 7)]), Color(0.45, 0.1, 0.12))
			draw_rect(Rect2(m + Vector2(-10, -2), Vector2(20, 3.5)), WHITE)
		CharacterLook.Mouth.SMIRK:
			draw_line(m + Vector2(-8, 1), m + Vector2(4, 1), ink, LINE)
			draw_line(m + Vector2(4, 1), m + Vector2(10, -4), ink, LINE)
		CharacterLook.Mouth.FROWN:
			draw_arc(m + Vector2(0, 8), 9.0, deg_to_rad(215), deg_to_rad(325), 8, ink, LINE)
		CharacterLook.Mouth.SMILE:
			draw_arc(m + Vector2(0, -6), 10.0, deg_to_rad(30), deg_to_rad(150), 8, ink, LINE)
		CharacterLook.Mouth.BIG_GRIN:
			var grin := _ellipse(m + Vector2(0, -2), 14.0, 10.0, 0.0, 180.0, 12)
			grin.append(m + Vector2(-14, -2))
			_shape(grin, Color(0.45, 0.1, 0.12))
			draw_colored_polygon(PackedVector2Array([m + Vector2(-13, -1), m + Vector2(13, -1),
				m + Vector2(11, 3), m + Vector2(-11, 3)]), WHITE)
		CharacterLook.Mouth.POUT:
			_shape(_ellipse(m + Vector2(1, 0), 7.0, 4.0), look.skin.darkened(0.25))
			draw_line(m + Vector2(-6, 0), m + Vector2(8, 0), INK, 2.0)
