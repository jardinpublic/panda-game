class_name Watcher
extends Node2D
## A colleague or the boss walking a loop of stops in the office. At each stop
## it pauses and looks around. Its view cone is a floor-plane cone; see
## [method sees].
##
## Example:
##     var w := Watcher.new()
##     w.setup(CastLooks.ROMAIN, stops, speed, view_range, half_angle, weight, pause)

## Emitted on arrival at a stop.
signal stop_reached(index: int)

var figure: Caricature
var stops: PackedVector2Array = []
var speed := 90.0
var view_range := 220.0
var half_angle := deg_to_rad(32.0)
var weight := 1.0
var pause := 2.0
## Current look direction on the floor plane.
var facing := Vector2.DOWN
## True while this watcher currently sees Panda slacking (drawn brighter).
var alarmed := false

var _target := 0
var _pause_left := 0.0
var _base_facing := Vector2.DOWN
var _sweep_time := 0.0


## Configures the watcher. Call before adding it to the tree.
func setup(look_id: StringName, p_stops: PackedVector2Array, p_speed: float,
		p_range: float, p_half_angle: float, p_weight: float, p_pause: float) -> void:
	stops = p_stops
	speed = p_speed
	view_range = p_range
	half_angle = p_half_angle
	weight = p_weight
	pause = p_pause
	position = stops[0]
	_target = 1 % stops.size()
	figure = Caricature.new()
	figure.look = CastLooks.get_look(look_id)
	add_child(figure)


## True when [param point] is inside this watcher's view cone.
func sees(point: Vector2) -> bool:
	return SuspicionModel.can_see(position, facing, point, view_range, half_angle)


func _process(delta: float) -> void:
	if _pause_left > 0.0:
		_pause_left -= delta
		_sweep_time += delta
		facing = _base_facing.rotated(sin(_sweep_time * 1.6) * 0.8)
		figure.walking = false
		if _pause_left <= 0.0:
			_target = (_target + 1) % stops.size()
		return
	var goal := stops[_target]
	var to_goal := goal - position
	if to_goal.length() < 2.0:
		_pause_left = pause
		_sweep_time = 0.0
		_base_facing = facing
		stop_reached.emit(_target)
		return
	facing = facing.slerp(to_goal.normalized(), minf(1.0, delta * 8.0))
	position = position.move_toward(goal, speed * delta)
	figure.walking = true
	if absf(facing.x) > 0.2:
		figure.facing_left = facing.x < 0.0
