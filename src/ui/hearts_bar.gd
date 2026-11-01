class_name HeartsBar
extends Control
## Draws Panda's hearts (filled and empty), no font glyphs needed.

var total := 4:
	set(value):
		total = value
		custom_minimum_size = Vector2(total * 40, 36)
		queue_redraw()
var filled := 4:
	set(value):
		filled = value
		queue_redraw()


func _draw() -> void:
	for i in total:
		var c := Vector2(18 + i * 40, 18)
		var col := Color(0.95, 0.2, 0.3) if i < filled else Color(0.2, 0.2, 0.25, 0.7)
		draw_circle(c + Vector2(-7, -4), 9, col)
		draw_circle(c + Vector2(7, -4), 9, col)
		draw_colored_polygon(PackedVector2Array([c + Vector2(-15.5, -1), c + Vector2(15.5, -1), c + Vector2(0, 16)]), col)
