class_name ArcadeEnemy
extends Node2D
## A colleague rushing Panda with a file. Kinds differ in speed and toughness;
## the boss (Romain) keeps his distance and throws files.
##
## Example:
##     var e := ArcadeEnemy.new()
##     e.setup(CastLooks.MAMAR, ArcadeEnemy.Kind.TANK, 6.0, 85.0, 0.55)

enum Kind { WALKER, RUNNER, TANK, BOSS }

const HIT_RADIUS := 36.0

var kind := Kind.WALKER
var hp := 1.0
var max_hp := 1.0
var speed := 100.0
var figure: Caricature
## Knockback velocity, decays every frame.
var push := Vector2.ZERO
var stun_left := 0.0
var throw_left := 0.0
var pig_cooldown := 0.0
var dying := false
var _flash_left := 0.0
var _die_left := 0.0


func setup(look_id: StringName, p_kind: Kind, p_hp: float, p_speed: float, p_scale: float) -> void:
	kind = p_kind
	hp = p_hp
	max_hp = p_hp
	speed = p_speed
	figure = Caricature.new()
	figure.look = CastLooks.get_look(look_id)
	figure.scale = Vector2(p_scale, p_scale)
	add_child(figure)


## Applies damage and knockback. Returns true when this hit kills it.
func hit(damage: float, direction: Vector2, knock: float) -> bool:
	if dying:
		return false
	hp -= damage
	push += direction.normalized() * knock * (0.35 if kind == Kind.BOSS else 1.0)
	_flash_left = 0.09
	if hp <= 0.0:
		dying = true
		_die_left = 0.28
		return true
	return false


## True once the death animation finished and the node can be freed.
func finished_dying() -> bool:
	return dying and _die_left <= 0.0


## Moves towards [param target]; the boss orbits at a distance instead.
func step(delta: float, target: Vector2, speed_multiplier: float) -> void:
	pig_cooldown = maxf(0.0, pig_cooldown - delta)
	if dying:
		_die_left -= delta
		var t := clampf(_die_left / 0.28, 0.0, 1.0)
		scale = Vector2(1.0 + (1.0 - t) * 0.6, t)
		modulate.a = t
		return
	if _flash_left > 0.0:
		_flash_left -= delta
	figure.modulate = Color(2.2, 2.2, 2.2) if _flash_left > 0.0 else Color.WHITE
	position += push * delta
	push = push.move_toward(Vector2.ZERO, 900.0 * delta)
	if stun_left > 0.0:
		stun_left -= delta
		figure.walking = false
		figure.rotation = sin(stun_left * 30.0) * 0.12
		return
	figure.rotation = 0.0
	var to_target := target - position
	var move := to_target.normalized()
	if kind == Kind.BOSS:
		var distance := to_target.length()
		move = move * (1.0 if distance > 300.0 else -0.6) + move.orthogonal() * 0.7
	position += move.normalized() * speed * speed_multiplier * delta
	figure.walking = true
	if absf(move.x) > 0.15:
		figure.facing_left = move.x < 0.0


func _process(_delta: float) -> void:
	if kind == Kind.BOSS:
		queue_redraw()


func _draw() -> void:
	if kind != Kind.BOSS or dying:
		return
	var w := 120.0
	draw_rect(Rect2(-w * 0.5, 14, w, 12), Color(0, 0, 0, 0.6))
	draw_rect(Rect2(-w * 0.5 + 2, 16, (w - 4) * clampf(hp / max_hp, 0, 1), 8), Color(0.95, 0.25, 0.2))
