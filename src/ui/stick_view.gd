class_name StickView
extends Control
## The on-screen joystick shown where the player touches and drags.

## Knob offset from the centre, in pixels.
var knob := Vector2.ZERO:
	set(value):
		knob = value
		queue_redraw()


func _draw() -> void:
	draw_circle(Vector2.ZERO, 72, Color(1, 1, 1, 0.12))
	draw_arc(Vector2.ZERO, 72, 0, TAU, 40, Color(1, 1, 1, 0.45), 3.0)
	draw_circle(knob, 30, Color(1, 1, 1, 0.55))
