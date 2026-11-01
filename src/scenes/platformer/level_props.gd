class_name LevelProp
extends Node2D
## Non-enemy level objects drawn in code: the Fiat Panda spring, checkpoint
## flags and the finish hammock between two palm trees. Origin on the ground.

const INK := Color(0.12, 0.09, 0.1)

var kind := "car"
## Checkpoint: raised once Panda passed it.
var raised := false
var _bounce := 0.0
var _t := 0.0


static func make(p_kind: String, at: Vector2) -> LevelProp:
	var p := LevelProp.new()
	p.kind = p_kind
	p.position = at
	return p


## Top surface that launches Panda (car roof), in world space.
func spring_rect() -> Rect2:
	return Rect2(position + Vector2(-70, -118), Vector2(140, 30))


func boing() -> void:
	_bounce = 0.35


func _process(delta: float) -> void:
	_t += delta
	_bounce = maxf(0.0, _bounce - delta)
	queue_redraw()


func _draw() -> void:
	match kind:
		"car":
			var squish := sin(_bounce * 40.0) * _bounce * 30.0
			draw_set_transform(Vector2(0, 0), 0.0, Vector2(1.0 + squish * 0.01, 1.0 - squish * 0.012))
			# Boxy little city car
			draw_rect(Rect2(-110, -70, 220, 50), Color(0.85, 0.12, 0.18))
			draw_rect(Rect2(-70, -118, 140, 52), Color(0.85, 0.12, 0.18))
			draw_rect(Rect2(-60, -110, 56, 38), Color(0.65, 0.88, 0.98))
			draw_rect(Rect2(4, -110, 56, 38), Color(0.65, 0.88, 0.98))
			draw_rect(Rect2(-110, -70, 220, 50), INK, false, 3.0)
			draw_rect(Rect2(-70, -118, 140, 52), INK, false, 3.0)
			draw_rect(Rect2(-112, -40, 224, 10), Color(0.3, 0.3, 0.32))
			draw_circle(Vector2(100, -55), 8, Color(1, 0.95, 0.6))
			for wx: float in [-62.0, 62.0]:
				draw_circle(Vector2(wx, -18), 22, INK)
				draw_circle(Vector2(wx, -18), 10, Color(0.75, 0.75, 0.78))
			draw_string(ThemeDB.fallback_font, Vector2(-34, -46), "PANDA", HORIZONTAL_ALIGNMENT_LEFT, -1, 18, Color.WHITE)
			draw_set_transform(Vector2.ZERO)
		"checkpoint":
			draw_line(Vector2(0, 0), Vector2(0, -170), Color(0.85, 0.85, 0.9), 6.0)
			var y := -160.0 if raised else -40.0
			var wave := sin(_t * 6.0) * 6.0
			draw_colored_polygon(PackedVector2Array([Vector2(3, y), Vector2(70, y + 18 + wave), Vector2(3, y + 40)]),
				Color(0.25, 0.8, 0.45) if raised else Color(0.8, 0.8, 0.8))
			draw_circle(Vector2(0, -172), 7, Color(1, 0.85, 0.3))
		"goal":
			for px: float in [-130.0, 130.0]:
				var top := Vector2(px + 20, -260)
				draw_line(Vector2(px, 0), top, Color(0.45, 0.3, 0.18), 14.0)
				for i in 7:
					var a := deg_to_rad(-200.0 + i * 36.0)
					draw_line(top, top + Vector2(cos(a), sin(a) + 0.45) * 100, Color(0.15, 0.6, 0.3), 12.0)
			var sway := sin(_t * 2.0) * 10.0
			draw_polyline(PackedVector2Array([Vector2(-110, -150), Vector2(-50, -80 + sway), Vector2(50, -80 + sway), Vector2(110, -150)]),
				Color(0.95, 0.45, 0.35), 16.0, true)
			draw_polyline(PackedVector2Array([Vector2(-110, -150), Vector2(-50, -86 + sway), Vector2(50, -86 + sway), Vector2(110, -150)]),
				Color(1, 0.85, 0.4), 5.0, true)
			draw_rect(Rect2(-30, -40, 60, 40), Color(0.6, 0.4, 0.22))
			draw_rect(Rect2(-14, -70, 22, 30), Color(0.95, 0.65, 0.3, 0.8))
			draw_circle(Vector2(10, -70), 8, Color(0.6, 0.85, 0.3))
