class_name PlatformBlock
extends StaticBody2D
## A solid platform, drawn in code in one of several styles (office floor,
## desk, cabinet, street, Creole house roof, sand, wooden pontoon).
## Thin styles are one-way: Panda can jump up through them.
##
## Example: PlatformBlock.make(Rect2(300, 500, 160, 20), "desk")

const INK := Color(0.12, 0.09, 0.1)
const HOUSE_COLORS := {"house_pink": Color(0.98, 0.55, 0.62), "house_yellow": Color(1.0, 0.82, 0.32),
	"house_blue": Color(0.38, 0.72, 0.95), "house_green": Color(0.45, 0.85, 0.6)}

var rect := Rect2()
var style := "street"


static func make(r: Rect2, p_style: String) -> PlatformBlock:
	var b := PlatformBlock.new()
	b.rect = r
	b.style = p_style
	b.position = r.position
	var shape := CollisionShape2D.new()
	var box := RectangleShape2D.new()
	box.size = r.size
	shape.shape = box
	shape.position = r.size * 0.5
	shape.one_way_collision = p_style in ["desk", "wood", "shelf"]
	b.add_child(shape)
	return b


func _draw() -> void:
	var s := rect.size
	draw_rect(Rect2(Vector2(8, 10), s), Color(0, 0, 0, 0.18))
	match style:
		"office":
			_body(s, Color(0.72, 0.6, 0.5), Color(0.6, 0.48, 0.38))
			draw_rect(Rect2(0, 0, s.x, 10), Color(0.45, 0.36, 0.3))
			for x in range(0, int(s.x), 80):
				draw_line(Vector2(x, 10), Vector2(x, s.y), Color(0.62, 0.5, 0.4), 2.0)
		"desk", "shelf":
			draw_rect(Rect2(0, 0, s.x, s.y), Color(0.78, 0.55, 0.32))
			draw_rect(Rect2(0, 0, s.x, 6), Color(0.92, 0.7, 0.45))
			draw_rect(Rect2(10, s.y, 12, 90), Color(0.55, 0.38, 0.22))
			draw_rect(Rect2(s.x - 22, s.y, 12, 90), Color(0.55, 0.38, 0.22))
			if style == "desk":
				draw_rect(Rect2(s.x * 0.5 - 30, -44, 60, 40), Color(0.15, 0.16, 0.2))
				draw_rect(Rect2(s.x * 0.5 - 25, -39, 50, 30), Color(0.55, 0.85, 0.95))
				draw_rect(Rect2(s.x * 0.5 - 6, -6, 12, 6), Color(0.15, 0.16, 0.2))
			draw_rect(Rect2(0, 0, s.x, s.y), INK, false, 3.0)
		"cabinet":
			_body(s, Color(0.62, 0.66, 0.72), Color(0.5, 0.54, 0.6))
			for y in range(14, int(s.y) - 20, 52):
				draw_rect(Rect2(10, y, s.x - 20, 42), Color(0.7, 0.74, 0.8))
				draw_rect(Rect2(s.x * 0.5 - 12, y + 16, 24, 6), Color(0.3, 0.3, 0.34))
		"street":
			_body(s, Color(0.42, 0.44, 0.5), Color(0.32, 0.33, 0.38))
			draw_rect(Rect2(0, 0, s.x, 14), Color(0.8, 0.8, 0.78))
			for x in range(30, int(s.x), 120):
				draw_rect(Rect2(x, 50, 60, 8), Color(0.95, 0.85, 0.3))
		"sand":
			_body(s, Color(0.98, 0.86, 0.6), Color(0.92, 0.74, 0.46))
			for i in int(s.x / 40):
				draw_circle(Vector2(20 + i * 40, 30 + (i * 37) % 60), 3, Color(0.85, 0.68, 0.42))
			draw_rect(Rect2(0, 0, s.x, 8), Color(1, 0.94, 0.75))
		"wood":
			draw_rect(Rect2(0, 0, s.x, s.y), Color(0.72, 0.48, 0.28))
			for x in range(0, int(s.x), 32):
				draw_line(Vector2(x, 0), Vector2(x, s.y), Color(0.5, 0.32, 0.18), 2.0)
			draw_rect(Rect2(0, 0, s.x, s.y), INK, false, 3.0)
			draw_rect(Rect2(14, s.y, 10, 260), Color(0.45, 0.3, 0.18))
			draw_rect(Rect2(s.x - 24, s.y, 10, 260), Color(0.45, 0.3, 0.18))
		_:
			if HOUSE_COLORS.has(style):
				_house(s, HOUSE_COLORS[style])


func _body(s: Vector2, top: Color, bottom: Color) -> void:
	draw_polygon(PackedVector2Array([Vector2.ZERO, Vector2(s.x, 0), s, Vector2(0, s.y)]),
		PackedColorArray([top, top, bottom, bottom]))
	draw_rect(Rect2(Vector2.ZERO, s), INK, false, 3.0)


func _house(s: Vector2, wall: Color) -> void:
	# Creole house: coloured walls, shutters, a red tin roof that is the platform.
	draw_polygon(PackedVector2Array([Vector2(0, 18), Vector2(s.x, 18), Vector2(s.x, s.y), Vector2(0, s.y)]),
		PackedColorArray([wall.lightened(0.15), wall.lightened(0.15), wall.darkened(0.15), wall.darkened(0.15)]))
	for row in range(0, int((s.y - 60) / 110)):
		for col in range(0, int((s.x - 40) / 100)):
			var p := Vector2(30 + col * 100, 60 + row * 110)
			draw_rect(Rect2(p, Vector2(56, 70)), Color(0.98, 0.98, 0.95))
			draw_rect(Rect2(p + Vector2(4, 4), Vector2(22, 62)), wall.darkened(0.35))
			draw_rect(Rect2(p + Vector2(30, 4), Vector2(22, 62)), wall.darkened(0.35))
			for k in 5:
				draw_line(p + Vector2(4, 12 + k * 12), p + Vector2(26, 12 + k * 12), wall.darkened(0.5), 1.5)
				draw_line(p + Vector2(30, 12 + k * 12), p + Vector2(52, 12 + k * 12), wall.darkened(0.5), 1.5)
	draw_rect(Rect2(Vector2(0, 18), s - Vector2(0, 18)), INK, false, 3.0)
	draw_polygon(PackedVector2Array([Vector2(-14, 20), Vector2(s.x + 14, 20), Vector2(s.x, -2), Vector2(0, -2)]),
		PackedColorArray([Color(0.75, 0.2, 0.18), Color(0.75, 0.2, 0.18), Color(0.92, 0.32, 0.25), Color(0.92, 0.32, 0.25)]))
	for x in range(0, int(s.x), 18):
		draw_line(Vector2(x, 0), Vector2(x - 4, 18), Color(0.6, 0.15, 0.12), 2.0)
	draw_polyline(PackedVector2Array([Vector2(-14, 20), Vector2(0, -2), Vector2(s.x, -2), Vector2(s.x + 14, 20), Vector2(-14, 20)]), INK, 3.0)
