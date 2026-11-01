class_name SpeechBubbles
extends Node2D
## Comic speech bubbles that follow characters. One bubble per speaker; a new
## line replaces the old one.
##
## Example:
##     bubbles.say(romain_watcher, tr("ROMAIN_DESK"), 2.0)

var _active := {}  # Node2D -> {panel, label, time, height}


## Shows [param text] above [param speaker] for [param seconds].
## [param height] is how far above the speaker's origin the bubble sits.
func say(speaker: Node2D, text: String, seconds: float, height: float) -> void:
	var entry: Dictionary = _active.get(speaker, {})
	if entry.is_empty():
		var panel := PanelContainer.new()
		var style := StyleBoxFlat.new()
		style.bg_color = Color(1, 0.99, 0.95)
		style.border_color = Color(0.1, 0.08, 0.08)
		style.set_border_width_all(3)
		style.set_corner_radius_all(14)
		style.content_margin_left = 12
		style.content_margin_right = 12
		style.content_margin_top = 6
		style.content_margin_bottom = 6
		panel.add_theme_stylebox_override("panel", style)
		var label := Label.new()
		label.add_theme_font_size_override("font_size", 22)
		label.add_theme_color_override("font_color", Color(0.1, 0.08, 0.08))
		label.auto_translate_mode = Node.AUTO_TRANSLATE_MODE_DISABLED
		panel.add_child(label)
		add_child(panel)
		entry = {"panel": panel, "label": label}
		_active[speaker] = entry
	var label: Label = entry["label"]
	label.text = text
	var panel: PanelContainer = entry["panel"]
	panel.size = Vector2.ZERO
	panel.reset_size()
	entry["time"] = seconds
	entry["height"] = height
	panel.visible = true


## Removes every bubble (scene reset).
func clear() -> void:
	for entry: Dictionary in _active.values():
		(entry["panel"] as Node).queue_free()
	_active.clear()


func _process(delta: float) -> void:
	for key: Variant in _active.keys():
		var entry: Dictionary = _active[key]
		var panel: PanelContainer = entry["panel"]
		if not is_instance_valid(key):
			panel.queue_free()
			_active.erase(key)
			continue
		var speaker: Node2D = key
		if not speaker.is_visible_in_tree():
			panel.visible = false
			continue
		entry["time"] = float(entry["time"]) - delta
		panel.visible = float(entry["time"]) > 0.0
		panel.position = speaker.position - Vector2(panel.size.x * 0.5, float(entry["height"]) + panel.size.y)
