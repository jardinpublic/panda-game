class_name OfficeBackdrop
extends Node2D
## The office's wall, window, toilet door, clock and wooden floor, drawn in
## code. Extends sideways past the design width so wide screens stay filled.

const WALL_BOTTOM := 330.0
const DESIGN := Vector2(1280, 720)
const SPREAD := 700.0  # extra drawn width on each side

## In-game hour shown on the wall clock.
var hour := 8.0:
	set(value):
		hour = value
		queue_redraw()


func _draw() -> void:
	var left := -SPREAD
	var right := DESIGN.x + SPREAD
	# Wall
	draw_rect(Rect2(left, 0, right - left, WALL_BOTTOM), Color(0.86, 0.9, 0.88))
	draw_rect(Rect2(left, WALL_BOTTOM - 70, right - left, 70), Color(0.78, 0.84, 0.82))
	draw_rect(Rect2(left, WALL_BOTTOM - 8, right - left, 14), Color(0.45, 0.36, 0.3))
	# Floor planks
	draw_rect(Rect2(left, WALL_BOTTOM, right - left, DESIGN.y - WALL_BOTTOM + 200), Color(0.74, 0.58, 0.42))
	var y := WALL_BOTTOM + 30.0
	var row := 0
	while y < DESIGN.y + 200:
		draw_line(Vector2(left, y), Vector2(right, y), Color(0.62, 0.47, 0.33), 2.0)
		var x := left + (row % 2) * 90.0
		while x < right:
			draw_line(Vector2(x, y - 30 - row * 2), Vector2(x, y), Color(0.62, 0.47, 0.33), 1.5)
			x += 180.0
		y += 30.0 + row * 4.0
		row += 1
	# Window onto the Martinique sea
	var win := Rect2(560, 40, 300, 200)
	draw_rect(win.grow(10), Color(0.95, 0.95, 0.93))
	draw_rect(Rect2(win.position, Vector2(win.size.x, 120)), Color(0.55, 0.82, 0.95))
	draw_rect(Rect2(win.position + Vector2(0, 120), Vector2(win.size.x, 80)), Color(0.12, 0.55, 0.7))
	draw_circle(win.position + Vector2(240, 45), 22, Color(1.0, 0.92, 0.6))
	var trunk := win.position + Vector2(70, 200)
	draw_line(trunk, trunk + Vector2(18, -120), Color(0.45, 0.3, 0.18), 8.0)
	for i in 6:
		var a := deg_to_rad(-170.0 + i * 32.0)
		var top := trunk + Vector2(18, -120)
		draw_line(top, top + Vector2(cos(a), sin(a) + 0.4) * 60, Color(0.18, 0.55, 0.28), 7.0)
	draw_rect(win, Color(0.95, 0.95, 0.93), false, 8.0)
	draw_line(win.position + Vector2(150, 0), win.position + Vector2(150, 200), Color(0.95, 0.95, 0.93), 6.0)
	# Light patch from the window
	draw_colored_polygon(PackedVector2Array([Vector2(560, WALL_BOTTOM), Vector2(860, WALL_BOTTOM),
		Vector2(980, 520), Vector2(600, 520)]), Color(1, 1, 0.85, 0.12))
	# Toilet door
	draw_rect(Rect2(55, 110, 110, 220), Color(0.55, 0.4, 0.3))
	draw_rect(Rect2(55, 110, 110, 220), Color(0.3, 0.22, 0.18), false, 4.0)
	draw_circle(Vector2(148, 230), 6, Color(0.85, 0.75, 0.4))
	draw_rect(Rect2(85, 140, 50, 30), Color(0.95, 0.95, 0.93))
	# Wall clock
	var c := Vector2(1190, 190)
	draw_circle(c, 42, Color(0.2, 0.2, 0.22))
	draw_circle(c, 36, Color(0.98, 0.98, 0.95))
	var h_angle := TAU * fmod(hour, 12.0) / 12.0 - PI / 2
	var m_angle := TAU * fmod(hour, 1.0) - PI / 2
	draw_line(c, c + Vector2(cos(h_angle), sin(h_angle)) * 20, Color(0.1, 0.1, 0.1), 5.0)
	draw_line(c, c + Vector2(cos(m_angle), sin(m_angle)) * 30, Color(0.1, 0.1, 0.1), 3.0)
	# Sign plaque frame (text is a Label child, translated)
	draw_rect(Rect2(205, 150, 300, 56), Color(0.18, 0.3, 0.45))
	draw_rect(Rect2(205, 150, 300, 56), Color(0.85, 0.75, 0.4), false, 3.0)
