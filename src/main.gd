extends Node2D
## Story 001 placeholder scene: proves the browser build, the shared input
## layer (keyboard, mouse, touch) and live English/French switching.
## Story 005 replaces it with the day shell.

## Walking speed in pixels per second.
@export var move_speed := 420.0
## How long a speech bubble stays on screen, in seconds.
@export var speech_seconds := 1.4
## Margin that keeps Panda inside the visible area, in pixels.
@export var edge_margin := 70.0

const SKY_TOP := Color(0.13, 0.55, 0.72)
const SKY_BOTTOM := Color(0.55, 0.83, 0.88)
const SEA := Color(0.05, 0.42, 0.55)
const SAND := Color(0.93, 0.83, 0.62)
const TOUCH_BUTTON_SIZE := Vector2(240, 110)

var _panda: PlaceholderPanda
var _speech: Label
var _speech_timer := 0.0
var _target := Vector2.ZERO
var _has_target := false
var _fps_label: Label
var _rotate_overlay: Control
var _blip: AudioStreamPlayer


func _ready() -> void:
	_build_world()
	_build_ui()
	_blip = AudioStreamPlayer.new()
	_blip.stream = _make_blip()
	add_child(_blip)
	GameInput.pointer_tapped.connect(_on_pointer_tapped)
	GameInput.first_interaction.connect(_blip.play)
	get_viewport().size_changed.connect(_on_viewport_resized)
	_on_viewport_resized()


func _process(delta: float) -> void:
	var direction := GameInput.get_move_vector()
	if direction != Vector2.ZERO:
		_has_target = false
		_panda.position += direction * move_speed * delta
	elif _has_target:
		_panda.position = _panda.position.move_toward(_target, move_speed * delta)
		_has_target = _panda.position.distance_to(_target) > 1.0
	_panda.position = _clamp_to_walkable(_panda.position)

	if Input.is_action_just_pressed(GameInput.ACTION_PRIMARY):
		_say("LINE_HOHO")
	if Input.is_action_just_pressed(GameInput.ACTION_SECONDARY):
		_say("LINE_BAGNOLE")

	if _speech_timer > 0.0:
		_speech_timer -= delta
		_speech.visible = _speech_timer > 0.0
		_speech.position = _panda.position + Vector2(-_speech.size.x * 0.5, -170)
	_fps_label.text = "%s %d" % [tr("FPS_LABEL"), Engine.get_frames_per_second()]


func _visible_rect() -> Rect2:
	return get_viewport().get_visible_rect()


func _clamp_to_walkable(point: Vector2) -> Vector2:
	var rect := _visible_rect()
	var top := rect.position.y + rect.size.y * 0.58
	return Vector2(
		clampf(point.x, rect.position.x + edge_margin, rect.end.x - edge_margin),
		clampf(point.y, top, rect.end.y - edge_margin))


func _on_pointer_tapped(_screen_position: Vector2) -> void:
	_target = _clamp_to_walkable(get_global_mouse_position())
	_has_target = true


func _say(key: String) -> void:
	_speech.text = tr(key)
	_speech.reset_size()
	_speech_timer = speech_seconds
	_speech.visible = true


func _on_viewport_resized() -> void:
	var rect := _visible_rect()
	_rotate_overlay.visible = rect.size.x < rect.size.y
	queue_redraw()
	if _panda.position == Vector2.ZERO:
		_panda.position = rect.get_center() + Vector2(0, rect.size.y * 0.22)
	_panda.position = _clamp_to_walkable(_panda.position)


func _draw() -> void:
	var rect := _visible_rect()
	var horizon := rect.position.y + rect.size.y * 0.42
	var shore := rect.position.y + rect.size.y * 0.55
	draw_polygon(
		PackedVector2Array([rect.position, Vector2(rect.end.x, rect.position.y),
			Vector2(rect.end.x, horizon), Vector2(rect.position.x, horizon)]),
		PackedColorArray([SKY_TOP, SKY_TOP, SKY_BOTTOM, SKY_BOTTOM]))
	draw_rect(Rect2(rect.position.x, horizon, rect.size.x, shore - horizon), SEA)
	draw_rect(Rect2(rect.position.x, shore, rect.size.x, rect.end.y - shore), SAND)
	draw_circle(Vector2(rect.end.x - rect.size.x * 0.18, horizon - rect.size.y * 0.16),
		rect.size.y * 0.07, Color(1.0, 0.93, 0.7))


func _build_world() -> void:
	_panda = PlaceholderPanda.new()
	add_child(_panda)
	_speech = Label.new()
	_speech.add_theme_font_size_override("font_size", 40)
	_speech.add_theme_color_override("font_color", Color.WHITE)
	_speech.add_theme_color_override("font_outline_color", Color(0.05, 0.05, 0.08))
	_speech.add_theme_constant_override("outline_size", 12)
	_speech.visible = false
	add_child(_speech)


func _build_ui() -> void:
	var layer := CanvasLayer.new()
	add_child(layer)
	var root := Control.new()
	root.set_anchors_preset(Control.PRESET_FULL_RECT)
	root.mouse_filter = Control.MOUSE_FILTER_IGNORE
	layer.add_child(root)

	var title := _make_label("TITLE", 56)
	title.position = Vector2(32, 24)
	root.add_child(title)
	var subtitle := _make_label("SUBTITLE", 26)
	subtitle.position = Vector2(34, 96)
	root.add_child(subtitle)

	_fps_label = _make_label("", 18)
	_fps_label.auto_translate_mode = Node.AUTO_TRANSLATE_MODE_DISABLED
	_fps_label.set_anchors_and_offsets_preset(Control.PRESET_BOTTOM_LEFT)
	_fps_label.position += Vector2(16, -36)
	root.add_child(_fps_label)

	var hint := _make_label("HINT_MOVE", 24)
	hint.set_anchors_and_offsets_preset(Control.PRESET_CENTER_BOTTOM)
	hint.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	hint.grow_horizontal = Control.GROW_DIRECTION_BOTH
	hint.position.y -= 48
	root.add_child(hint)

	var lang := _make_button("BTN_LANG", Vector2(170, 64))
	lang.set_anchors_and_offsets_preset(Control.PRESET_TOP_RIGHT)
	lang.position += Vector2(-190, 24)
	lang.pressed.connect(Lang.toggle_locale)
	root.add_child(lang)

	var buttons := VBoxContainer.new()
	buttons.add_theme_constant_override("separation", 16)
	buttons.set_anchors_and_offsets_preset(Control.PRESET_CENTER_RIGHT)
	buttons.grow_horizontal = Control.GROW_DIRECTION_BEGIN
	buttons.grow_vertical = Control.GROW_DIRECTION_BOTH
	buttons.position.x -= 24
	root.add_child(buttons)
	var primary := _make_button("BTN_PRIMARY", TOUCH_BUTTON_SIZE)
	primary.pressed.connect(_say.bind("LINE_HOHO"))
	buttons.add_child(primary)
	var secondary := _make_button("BTN_SECONDARY", TOUCH_BUTTON_SIZE)
	secondary.pressed.connect(_say.bind("LINE_BAGNOLE"))
	buttons.add_child(secondary)

	_rotate_overlay = ColorRect.new()
	(_rotate_overlay as ColorRect).color = Color(0.03, 0.05, 0.08, 0.92)
	_rotate_overlay.set_anchors_preset(Control.PRESET_FULL_RECT)
	var rotate_label := _make_label("ROTATE_HINT", 44)
	rotate_label.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	rotate_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	rotate_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	rotate_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	_rotate_overlay.add_child(rotate_label)
	root.add_child(_rotate_overlay)


func _make_label(key: String, font_size: int) -> Label:
	var label := Label.new()
	label.text = key
	label.add_theme_font_size_override("font_size", font_size)
	label.add_theme_color_override("font_color", Color.WHITE)
	label.add_theme_color_override("font_outline_color", Color(0.04, 0.12, 0.18))
	label.add_theme_constant_override("outline_size", 10)
	label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	return label


func _make_button(key: String, min_size: Vector2) -> Button:
	var button := Button.new()
	button.text = key
	button.custom_minimum_size = min_size
	button.add_theme_font_size_override("font_size", 30)
	button.focus_mode = Control.FOCUS_NONE
	return button


## A short generated tone, so audio can be checked without any asset.
func _make_blip() -> AudioStreamWAV:
	var rate := 22050
	var samples := int(rate * 0.12)
	var data := PackedByteArray()
	data.resize(samples * 2)
	for i in samples:
		var envelope := 1.0 - float(i) / samples
		var value := int(sin(TAU * 880.0 * i / rate) * envelope * 9000.0)
		data.encode_s16(i * 2, value)
	var wav := AudioStreamWAV.new()
	wav.format = AudioStreamWAV.FORMAT_16_BITS
	wav.mix_rate = rate
	wav.data = data
	return wav
