class_name Critter
extends Node2D
## A level enemy. Colleagues patrol a stretch of platform with a file in hand;
## Romain needs three stomps; Babar stands on a roof spitting; crabs scuttle
## on the sand; mosquitoes hover. Feet (or body centre for flyers) at origin.
##
## Example: Critter.make("walker", CastLooks.ALINE, Vector2(400, 600), 250.0, 650.0, 90.0)

const INK := Color(0.12, 0.09, 0.1)

var kind := "walker"
var hp := 1
var min_x := 0.0
var max_x := 0.0
var speed := 90.0
var dir := -1.0
var base_y := 0.0
var throw_left := 1.0
var figure: Caricature
var squashed := 0.0
var hurt_flash := 0.0
var _t := 0.0


static func make(p_kind: String, look_id: StringName, at: Vector2, p_min_x: float, p_max_x: float,
		p_speed: float) -> Critter:
	var c := Critter.new()
	c.kind = p_kind
	c.position = at
	c.base_y = at.y
	c.min_x = p_min_x
	c.max_x = p_max_x
	c.speed = p_speed
	c.hp = 3 if p_kind == "boss" else (2 if look_id == CastLooks.MAMAR else 1)
	if look_id != &"":
		c.figure = Caricature.new()
		c.figure.look = CastLooks.get_look(look_id)
		var s := 0.62 if p_kind == "boss" else 0.46
		c.figure.scale = Vector2(s, s)
		c.add_child(c.figure)
	return c


## Hit box in world space (feet at the bottom middle).
func hitbox() -> Rect2:
	match kind:
		"crab":
			return Rect2(position + Vector2(-30, -34), Vector2(60, 34))
		"mosquito":
			return Rect2(position + Vector2(-24, -20), Vector2(48, 40))
		"boss":
			return Rect2(position + Vector2(-34, -150), Vector2(68, 150))
	return Rect2(position + Vector2(-26, -110), Vector2(52, 110))


func is_dead() -> bool:
	return squashed > 0.0 and hp <= 0


## Stomped from above. Returns true when this stomp finishes it.
func stomp() -> bool:
	hp -= 1
	hurt_flash = 0.15
	if hp <= 0:
		squashed = 0.01
		return true
	return false


## Advances patrol and animation. Returns true when it wants to spit (Babar).
func step(delta: float) -> bool:
	_t += delta
	hurt_flash = maxf(0.0, hurt_flash - delta)
	if squashed > 0.0:
		squashed += delta
		scale = Vector2(1.0 + squashed * 2.0, maxf(0.05, 1.0 - squashed * 4.0))
		modulate.a = maxf(0.0, 1.0 - squashed * 2.5)
		return false
	if figure:
		figure.modulate = Color(2.2, 2.2, 2.2) if hurt_flash > 0.0 else Color.WHITE
	if kind == "babar":
		throw_left -= delta
		if figure:
			figure.walking = false
		if throw_left <= 0.0:
			return true
		return false
	position.x += dir * speed * delta
	if position.x < min_x:
		position.x = min_x
		dir = 1.0
	elif position.x > max_x:
		position.x = max_x
		dir = -1.0
	if kind == "mosquito":
		position.y = base_y + sin(_t * 3.0) * 40.0
	if figure:
		figure.walking = true
		figure.facing_left = dir < 0.0
	queue_redraw()
	return false


func _draw() -> void:
	match kind:
		"crab":
			var wob := sin(_t * 18.0) * 3.0
			for side: float in [-1.0, 1.0]:
				for k in 3:
					draw_line(Vector2(side * (12 + k * 6), -12), Vector2(side * (24 + k * 7), wob * side), INK, 4.0)
				draw_circle(Vector2(side * 36, -26 + wob), 11, Color(0.95, 0.3, 0.2))
				draw_arc(Vector2(side * 36, -26 + wob), 11, 0, TAU, 16, INK, 3.0)
			draw_circle(Vector2(0, -16), 24, Color(0.95, 0.35, 0.22))
			draw_arc(Vector2(0, -16), 24, 0, TAU, 24, INK, 3.0)
			for side: float in [-1.0, 1.0]:
				draw_line(Vector2(side * 8, -36), Vector2(side * 10, -48), INK, 3.0)
				draw_circle(Vector2(side * 10, -50), 6, Color.WHITE)
				draw_circle(Vector2(side * 11, -50), 3, INK)
		"mosquito":
			var flap := absf(sin(_t * 40.0))
			draw_colored_polygon(PackedVector2Array([Vector2(-4, -6), Vector2(-26, -26 * flap - 6), Vector2(-10, -4)]), Color(0.85, 0.95, 1, 0.8))
			draw_colored_polygon(PackedVector2Array([Vector2(4, -6), Vector2(26, -26 * flap - 6), Vector2(10, -4)]), Color(0.85, 0.95, 1, 0.8))
			draw_circle(Vector2.ZERO, 12, Color(0.3, 0.3, 0.35))
			draw_circle(Vector2(dir * 12, -4), 8, Color(0.3, 0.3, 0.35))
			draw_line(Vector2(dir * 18, -2), Vector2(dir * 34, 6), INK, 3.0)
			draw_circle(Vector2(dir * 14, -7), 3, Color(1, 0.3, 0.3))
			for k in 3:
				draw_line(Vector2(-6 + k * 6, 8), Vector2(-10 + k * 8, 20), INK, 2.0)
		"walker", "runner", "boss":
			if squashed <= 0.0:
				var hand := Vector2(-dir * -34, -70) if figure else Vector2.ZERO
				draw_rect(Rect2(hand + Vector2(-14, -10), Vector2(28, 20)), Color(0.98, 0.96, 0.85))
				draw_rect(Rect2(hand + Vector2(-14, -10), Vector2(28, 20)), INK, false, 2.5)
				draw_line(hand + Vector2(-8, -2), hand + Vector2(8, -2), Color(0.5, 0.5, 0.6), 2.0)
				if kind == "boss":
					for i in 3:
						var col := Color(0.95, 0.25, 0.25) if i < hp else Color(0.3, 0.3, 0.3, 0.5)
						draw_circle(Vector2(-24 + i * 24, -185), 8, col)


func _process(_delta: float) -> void:
	if kind == "crab" or kind == "mosquito" or kind == "boss":
		queue_redraw()
