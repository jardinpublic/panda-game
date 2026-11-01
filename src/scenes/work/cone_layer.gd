class_name ConeLayer
extends Node2D
## Draws every watcher's view cone on the floor, under the characters.
## Boss cones are red, colleagues orange; brighter while they see Panda.

const BOSS_COLOR := Color(0.95, 0.2, 0.2)
const COLLEAGUE_COLOR := Color(1.0, 0.6, 0.15)
const STEPS := 14

var watchers: Array[Watcher] = []
var boss: Watcher
var _points := PackedVector2Array()


func _ready() -> void:
	_points.resize(STEPS + 2)


func _process(_delta: float) -> void:
	queue_redraw()


func _draw() -> void:
	for w in watchers:
		var base := BOSS_COLOR if w == boss else COLLEAGUE_COLOR
		var color := base
		color.a = 0.34 if w.alarmed else 0.15
		var from := w.facing.angle() - w.half_angle
		_points[0] = w.position
		for i in STEPS + 1:
			var a := from + 2.0 * w.half_angle * float(i) / STEPS
			_points[i + 1] = w.position + Vector2(cos(a), sin(a)) * w.view_range
		draw_colored_polygon(_points, color)
