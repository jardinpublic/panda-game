class_name PlaceholderPanda
extends Node2D
## Temporary stand-in for Panda until story 003 brings the real character.
## Drawn in code: no assets needed.

const BODY_RADIUS := 46.0
const HEAD_RADIUS := 38.0
const INK := Color(0.08, 0.08, 0.1)
const FUR := Color(0.97, 0.96, 0.93)


func _draw() -> void:
	# Shadow
	draw_set_transform(Vector2(0, 52), 0.0, Vector2(1.0, 0.28))
	draw_circle(Vector2.ZERO, 48.0, Color(0, 0, 0, 0.25))
	draw_set_transform(Vector2.ZERO)
	# Body and arms
	draw_circle(Vector2(0, 8), BODY_RADIUS, FUR)
	draw_circle(Vector2(-40, 10), 16.0, INK)
	draw_circle(Vector2(40, 10), 16.0, INK)
	# Head, ears, eye patches
	var head := Vector2(0, -58)
	draw_circle(head + Vector2(-28, -28), 14.0, INK)
	draw_circle(head + Vector2(28, -28), 14.0, INK)
	draw_circle(head, HEAD_RADIUS, FUR)
	draw_circle(head + Vector2(-14, -2), 10.0, INK)
	draw_circle(head + Vector2(14, -2), 10.0, INK)
	# Rectangular glasses, his trademark
	var frame := Color(0.02, 0.02, 0.02)
	draw_rect(Rect2(head + Vector2(-27, -11), Vector2(22, 16)), frame, false, 3.0)
	draw_rect(Rect2(head + Vector2(5, -11), Vector2(22, 16)), frame, false, 3.0)
	draw_line(head + Vector2(-5, -4), head + Vector2(5, -4), frame, 3.0)
	# Deadpan mouth
	draw_line(head + Vector2(-8, 20), head + Vector2(8, 20), INK, 3.0)
	draw_circle(head + Vector2(0, 10), 5.0, INK)
