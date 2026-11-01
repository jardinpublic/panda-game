class_name OfficeProp
extends Node2D
## Office furniture drawn in code, floor contact at the node origin so it
## y-sorts with the characters. Placeholder art until story 003.

enum Kind { DESK, COFFEE, PLANT, SOFA, CABINET, WATER }

var kind := Kind.DESK
## Desk accent (monitor sticker colour) to tell desks apart.
var accent := Color(0.3, 0.5, 0.8)


func _init(p_kind: Kind = Kind.DESK, p_accent := Color(0.3, 0.5, 0.8)) -> void:
	kind = p_kind
	accent = p_accent


func _draw() -> void:
	match kind:
		Kind.DESK:
			_shadow(90.0)
			var wood := Color(0.62, 0.45, 0.3)
			draw_rect(Rect2(-90, -70, 180, 18), wood.lightened(0.1))
			draw_rect(Rect2(-90, -52, 180, 52), wood)
			draw_rect(Rect2(-84, -46, 50, 40), wood.darkened(0.12))
			draw_rect(Rect2(-28, -122, 70, 48), Color(0.15, 0.16, 0.2))
			draw_rect(Rect2(-23, -117, 60, 38), accent.lightened(0.35))
			draw_rect(Rect2(0, -74, 14, 6), Color(0.15, 0.16, 0.2))
			draw_rect(Rect2(50, -84, 30, 14), Color(0.95, 0.95, 0.92))
			draw_rect(Rect2(52, -90, 26, 6), Color(0.9, 0.9, 0.85))
			draw_circle(Vector2(-60, -76), 7.0, Color(0.85, 0.3, 0.25))
		Kind.COFFEE:
			_shadow(45.0)
			var body := Color(0.22, 0.22, 0.25)
			draw_rect(Rect2(-40, -150, 80, 150), body)
			draw_rect(Rect2(-32, -140, 64, 40), Color(0.75, 0.25, 0.2))
			draw_rect(Rect2(-18, -80, 36, 34), Color(0.08, 0.08, 0.1))
			draw_rect(Rect2(-8, -58, 16, 12), Color(0.95, 0.93, 0.88))
			for i in 3:
				draw_circle(Vector2(-18 + i * 18, -20), 5.0, Color(0.6, 0.6, 0.65))
		Kind.PLANT:
			_shadow(40.0)
			draw_rect(Rect2(-28, -50, 56, 50), Color(0.72, 0.4, 0.25))
			var leaf := Color(0.2, 0.55, 0.3)
			for i in 9:
				var a := deg_to_rad(200.0 + i * 17.0)
				var tip := Vector2(cos(a), sin(a)) * (80.0 + (i % 3) * 25.0) + Vector2(0, -50)
				draw_colored_polygon(PackedVector2Array([Vector2(-8, -50), tip, Vector2(8, -50)]),
					leaf.lightened((i % 3) * 0.1))
		Kind.SOFA:
			_shadow(110.0)
			var fabric := Color(0.55, 0.32, 0.38)
			draw_rect(Rect2(-110, -95, 220, 50), fabric.darkened(0.1))
			draw_rect(Rect2(-110, -50, 220, 40), fabric)
			draw_rect(Rect2(-126, -75, 26, 70), fabric.darkened(0.2))
			draw_rect(Rect2(100, -75, 26, 70), fabric.darkened(0.2))
		Kind.CABINET:
			_shadow(40.0)
			draw_rect(Rect2(-36, -130, 72, 130), Color(0.55, 0.58, 0.62))
			for i in 3:
				draw_rect(Rect2(-30, -124 + i * 42, 60, 36), Color(0.62, 0.65, 0.7))
				draw_rect(Rect2(-10, -110 + i * 42, 20, 5), Color(0.3, 0.3, 0.32))
		Kind.WATER:
			_shadow(30.0)
			draw_rect(Rect2(-24, -90, 48, 90), Color(0.9, 0.9, 0.92))
			draw_circle(Vector2(0, -112), 24.0, Color(0.5, 0.75, 0.95, 0.8))


func _shadow(half_width: float) -> void:
	draw_set_transform(Vector2(0, 2), 0.0, Vector2(1.0, 0.18))
	draw_circle(Vector2.ZERO, half_width, Color(0, 0, 0, 0.18))
	draw_set_transform(Vector2.ZERO)
