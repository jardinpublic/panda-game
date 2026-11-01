class_name ParallaxBackdrop
extends Node2D
## Tropical background that scrolls slower than the level: sky gradient,
## sun with rays, drifting clouds, Mount Pelée, the sea, distant Creole houses
## and palm trees. Also draws the office interior wall where the level begins.
## Lives in world space; call follow(camera_center) every frame.

const VIEW := Vector2(1280, 720)

## Level x where the office building ends (interior wall drawn before it).
var office_end := 1450.0
var _cam := Vector2.ZERO
var _time := 0.0


func follow(camera_center: Vector2) -> void:
	_cam = camera_center
	queue_redraw()


func _process(delta: float) -> void:
	_time += delta


func _draw() -> void:
	var left := _cam.x - VIEW.x
	var top := _cam.y - VIEW.y
	var w := VIEW.x * 2.0
	var h := VIEW.y * 2.0
	# Sky gradient
	draw_polygon(PackedVector2Array([Vector2(left, top), Vector2(left + w, top), Vector2(left + w, top + h), Vector2(left, top + h)]),
		PackedColorArray([Color(0.2, 0.55, 0.95), Color(0.2, 0.55, 0.95), Color(0.75, 0.93, 1.0), Color(0.75, 0.93, 1.0)]))
	# Sun with rotating rays
	var sun := Vector2(_cam.x * 0.95 + 300, 120)
	for i in 12:
		var a := _time * 0.2 + i * TAU / 12.0
		draw_colored_polygon(PackedVector2Array([sun, sun + Vector2.from_angle(a - 0.08) * 240, sun + Vector2.from_angle(a + 0.08) * 240]),
			Color(1, 0.95, 0.6, 0.18))
	draw_circle(sun, 70, Color(1, 0.93, 0.55, 0.5))
	draw_circle(sun, 54, Color(1, 0.9, 0.4))
	# Clouds (slow parallax, drifting)
	for i in 8:
		var y := 90.0 + (i * 53) % 140
		_cloud(Vector2(_cam.x * 0.15 + fposmod(i * 420.0 + _time * 12.0, 3400.0) - 600.0, y), 1.0 + (i % 3) * 0.25)
	# Mount Pelée far away
	var mx := _cam.x * 0.85 + 500.0
	draw_colored_polygon(PackedVector2Array([Vector2(mx - 700, 520), Vector2(mx - 260, 250), Vector2(mx - 160, 215),
		Vector2(mx - 60, 240), Vector2(mx + 420, 520)]), Color(0.36, 0.62, 0.55))
	draw_colored_polygon(PackedVector2Array([Vector2(mx - 260, 250), Vector2(mx - 160, 215), Vector2(mx - 60, 240),
		Vector2(mx - 120, 262), Vector2(mx - 200, 258)]), Color(0.55, 0.75, 0.68))
	# Sea
	var sea_y := 470.0
	draw_rect(Rect2(left, sea_y, w, h), Color(0.1, 0.62, 0.78))
	for i in 18:
		var wx := _cam.x * 0.7 + fposmod(i * 150.0 - _cam.x * 0.3 + _time * 20.0, 2700.0) - 1350.0
		draw_line(Vector2(wx, sea_y + 18 + (i % 4) * 14), Vector2(wx + 40, sea_y + 18 + (i % 4) * 14), Color(1, 1, 1, 0.5), 3.0)
	# Distant Creole houses and palms (mid parallax)
	for i in 30:
		var hx := _cam.x * 0.55 + (i * 260.0) - fposmod(_cam.x * 0.45, 260.0) - 1300.0
		var seed := int(floor((hx - _cam.x * 0.55) / 260.0)) + 1000
		var colors := [Color(0.98, 0.65, 0.7), Color(1, 0.85, 0.45), Color(0.55, 0.8, 0.98), Color(0.6, 0.9, 0.7)]
		var col: Color = colors[seed % 4]
		draw_rect(Rect2(hx, 430, 120, 80), col.darkened(0.1))
		draw_colored_polygon(PackedVector2Array([Vector2(hx - 8, 432), Vector2(hx + 60, 400), Vector2(hx + 128, 432)]), Color(0.8, 0.3, 0.25))
		_palm(Vector2(hx + 190, 510), 0.8 + (seed % 3) * 0.15)
	# Office interior wall at the start of the level (moves with the level)
	if _cam.x - VIEW.x < office_end:
		var r := Rect2(-400, 0, office_end + 400, 820)
		draw_rect(r, Color(0.86, 0.9, 0.88))
		draw_rect(Rect2(-400, 470, office_end + 400, 130), Color(0.78, 0.84, 0.82))
		for x in range(-200, int(office_end) - 100, 420):
			draw_rect(Rect2(x, 130, 240, 170), Color(0.95, 0.95, 0.93))
			draw_rect(Rect2(x + 12, 142, 216, 146), Color(0.55, 0.82, 0.95))
			draw_rect(Rect2(x + 12, 230, 216, 58), Color(0.12, 0.55, 0.7))
		draw_rect(Rect2(office_end - 20, 0, 30, 820), Color(0.5, 0.42, 0.38))


func _cloud(at: Vector2, size: float) -> void:
	for p: Vector2 in [Vector2(0, 0), Vector2(40, -18), Vector2(80, 0), Vector2(40, 10)]:
		draw_circle(at + p * size, 34 * size, Color(1, 1, 1, 0.92))


func _palm(base: Vector2, size: float) -> void:
	var top := base + Vector2(16, -150) * size
	draw_line(base, top, Color(0.45, 0.3, 0.18), 9 * size)
	for i in 7:
		var a := deg_to_rad(-200.0 + i * 36.0)
		draw_line(top, top + Vector2(cos(a), sin(a) + 0.45) * 70 * size, Color(0.15, 0.55, 0.28), 8 * size)
