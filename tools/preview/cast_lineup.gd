extends Node2D
## Dev preview: the whole cast side by side, to check the caricatures.
## Run: godot --path . res://tools/preview/cast_lineup.tscn

const IDS: Array[StringName] = [
	CastLooks.PANDA, CastLooks.ROMAIN, CastLooks.MAMAR,
	CastLooks.VICTOR, CastLooks.COUS, CastLooks.BABAR,
	CastLooks.ALINE, CastLooks.EUGENIE, CastLooks.VIOLAINE]


func _ready() -> void:
	RenderingServer.set_default_clear_color(Color(0.86, 0.84, 0.78))
	for i in IDS.size():
		var figure := Caricature.new()
		figure.look = CastLooks.get_look(IDS[i])
		figure.position = Vector2(75 + i * 140, 640)
		figure.scale = Vector2(0.95, 0.95)
		add_child(figure)
		var label := Label.new()
		label.text = String(IDS[i]).capitalize()
		label.add_theme_font_size_override("font_size", 28)
		label.add_theme_color_override("font_color", Color(0.15, 0.15, 0.2))
		label.position = Vector2(35 + i * 140, 660)
		add_child(label)
