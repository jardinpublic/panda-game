extends Node2D
## The platformer level: Panda escapes the office at 15h, crosses the rooftops
## of Fort-de-France and reaches his beach hammock. Stomp colleagues, grab
## coins, bounce on the Fiat Panda, dodge Babar's spit.
## Physics: [JumpModel]; numbers: platformer_tuning.tres; layout: [LevelData].

signal finished(result: Dictionary)

enum State { INTRO, PLAYING, OVER, WON }

const TUNING: PlatformerTuning = preload("res://src/scenes/platformer/platformer_tuning.tres")
const SPARKLE := [Color(1, 0.95, 0.5), Color(1, 1, 1), Color(0.6, 0.95, 1.0), Color(1, 0.6, 0.8)]

static var skip_intro := false

var _t: PlatformerTuning = TUNING
var _level: Dictionary
var _state := State.INTRO
var _rng := RandomNumberGenerator.new()

var _world: Node2D
var _backdrop: ParallaxBackdrop
var _camera: Camera2D
var _player: PandaPlayer
var _fx: FxCanvas
var _bubbles: SpeechBubbles
var _sfx: Sfx
var _critters: Array[Critter] = []
var _cars: Array[LevelProp] = []
var _checkpoints: Array[LevelProp] = []
var _goal: LevelProp

var _coins: Array[Vector2] = []
var _coin_total := 0
var _collected := 0
var _powerups: Array[Dictionary] = []   # {kind, pos}
var _spits: Array[Dictionary] = []      # {pos, vel}
var _particles: Array[Dictionary] = []
var _texts: Array[Dictionary] = []

var _hearts := 3
var _invulnerable := 0.0
var _rum_left := 0.0
var _respawn := Vector2.ZERO
var _time := 0.0
var _jump_was_held := false
var _hud := {}
var _touch_buttons: Array[TouchScreenButton] = []


func _ready() -> void:
	_rng.randomize()
	_hearts = _t.hearts
	_level = LevelData.level_1()
	_build_level()
	_build_hud()
	get_viewport().size_changed.connect(_layout_touch)
	_layout_touch()
	if skip_intro or "--skip-intro" in OS.get_cmdline_user_args():
		_start()
	else:
		_hud["intro"].visible = true


# --- Build ---------------------------------------------------------------------

func _build_level() -> void:
	_world = Node2D.new()
	add_child(_world)
	_backdrop = ParallaxBackdrop.new()
	_backdrop.office_end = _level["office_end"]
	_world.add_child(_backdrop)
	for p: Array in _level["platforms"]:
		_world.add_child(PlatformBlock.make(Rect2(p[0], p[1], p[2], p[3]), p[4]))
	_goal = LevelProp.make("goal", Vector2(_level["goal_x"], 600))
	_world.add_child(_goal)
	for at: Vector2 in _level["checkpoints"]:
		var cp := LevelProp.make("checkpoint", at)
		_world.add_child(cp)
		_checkpoints.append(cp)
	for at: Vector2 in _level["cars"]:
		var car := LevelProp.make("car", at)
		_world.add_child(car)
		_cars.append(car)
	for c: Array in _level["critters"]:
		var speed: float = {"runner": _t.runner_speed, "crab": _t.crab_speed}.get(c[0], _t.walker_speed)
		var critter := Critter.make(c[0], c[1], Vector2(c[2], c[3]), c[4], c[5], speed)
		critter.throw_left = _t.spit_interval
		_world.add_child(critter)
		_critters.append(critter)
	_coins = (_level["coins"] as Array).duplicate()
	_coin_total = _coins.size()
	for pu: Array in _level["powerups"]:
		_powerups.append({"kind": pu[0], "pos": pu[1]})

	_player = PandaPlayer.new()
	_player.setup(_t)
	_respawn = _level["start"]
	for arg in OS.get_cmdline_user_args():
		if arg.begins_with("--start-x="):  # debug: start further in the level
			_respawn = Vector2(float(arg.get_slice("=", 1)), 300)
	_player.position = _respawn
	_world.add_child(_player)
	_fx = FxCanvas.new()
	_fx.painter = _paint_fx
	_world.add_child(_fx)
	_bubbles = SpeechBubbles.new()
	_world.add_child(_bubbles)
	_sfx = Sfx.new()
	add_child(_sfx)

	_camera = Camera2D.new()
	_camera.position_smoothing_enabled = true
	_camera.position_smoothing_speed = 7.0
	_camera.limit_left = -200
	_camera.limit_right = int(_level["goal_x"]) + 500
	_camera.limit_bottom = 780
	_camera.limit_top = -400
	_world.add_child(_camera)
	_camera.position = _player.position + Vector2(200, -160)
	_camera.make_current()


# --- Flow ------------------------------------------------------------------------

func _start() -> void:
	_state = State.PLAYING
	_hud["intro"].visible = false
	_bubbles.say(_player, tr("PF_START"), 2.6, 130.0)


func _retry() -> void:
	skip_intro = true
	get_tree().reload_current_scene()


func _physics_process(delta: float) -> void:
	_time += delta
	_tick_effects(delta)
	_update_camera(delta)
	_update_hud()
	if _state != State.PLAYING:
		return
	var input_x := Input.get_axis(GameInput.ACTION_MOVE_LEFT, GameInput.ACTION_MOVE_RIGHT)
	var held := Input.is_action_pressed(GameInput.ACTION_PRIMARY) or Input.is_action_pressed(GameInput.ACTION_MOVE_UP)
	var pressed := held and not _jump_was_held
	_jump_was_held = held
	_player.model.speed_multiplier = _t.rum_speed_multiplier if _rum_left > 0.0 else 1.0
	if _player.run(delta, input_x, pressed, held):
		_sfx.play(&"shoot", 0.1)
		_dust(_player.position, 6)
	if _player.landed:
		_dust(_player.position, 10)
	if _player.is_on_floor() and absf(_player.velocity.x) > 200.0 and _rng.randf() < 0.25:
		_dust(_player.position, 1)

	_invulnerable = maxf(0.0, _invulnerable - delta)
	_rum_left = maxf(0.0, _rum_left - delta)
	_player.figure.visible = _invulnerable <= 0.0 or int(_time * 16.0) % 2 == 0
	_player.figure.modulate = Color.from_hsv(fmod(_time * 1.5, 1.0), 0.45, 1.3) if _rum_left > 0.0 else Color.WHITE
	if _rum_left > 0.0 and _rng.randf() < 0.6:
		_particles.append({"pos": _player.position + Vector2(_rng.randf_range(-20, 20), -_rng.randf_range(10, 90)),
			"vel": Vector2(-_player.velocity.x * 0.2, -40), "life": 0.5, "color": SPARKLE[_rng.randi() % 4], "size": 6.0})

	_tick_coins()
	_tick_powerups()
	_tick_critters(delta)
	_tick_spits(delta)
	_tick_cars()
	_tick_checkpoints()
	if _player.position.y > _t.fall_limit_y:
		_fall()
	elif _player.position.x > _goal.position.x - 60.0:
		_win()


func _update_camera(delta: float) -> void:
	var look_ahead := Vector2(clampf(_player.velocity.x * 0.35, -220, 220), -150)
	_camera.position = _camera.position.lerp(_player.position + look_ahead, minf(1.0, delta * 4.0))
	_backdrop.follow(_camera.get_screen_center_position())


# --- Gameplay ------------------------------------------------------------------------

func _tick_coins() -> void:
	var center := _player.position + Vector2(0, -48)
	for c: Vector2 in _coins.duplicate():
		if c.distance_to(center) < 46.0:
			_coins.erase(c)
			_collected += 1
			_sfx.play(&"coin", 0.1)
			for i in 5:
				_particles.append({"pos": c, "vel": Vector2.from_angle(_rng.randf() * TAU) * 160.0, "life": 0.4,
					"color": SPARKLE[i % 4], "size": 5.0})


func _tick_powerups() -> void:
	var center := _player.position + Vector2(0, -48)
	for p in _powerups.duplicate():
		if (p["pos"] as Vector2).distance_to(center) < 54.0:
			_powerups.erase(p)
			_sfx.play(&"power", 0.0)
			_burst(p["pos"], 24)
			if p["kind"] == "rum":
				_rum_left = _t.rum_seconds
				_bubbles.say(_player, tr("ARC_RUM"), 1.8, 130.0)
			else:
				_hearts = mini(_hearts + 1, _t.hearts)
				_bubbles.say(_player, tr("ARC_SANDWICH"), 1.8, 130.0)


func _tick_critters(delta: float) -> void:
	var body := _player.body_rect()
	for c: Critter in _critters.duplicate():
		if c.step(delta):
			c.throw_left = _t.spit_interval
			var dir := (_player.position + Vector2(0, -50) - (c.position + Vector2(0, -80))).normalized()
			_spits.append({"pos": c.position + Vector2(0, -80), "vel": dir * _t.spit_speed})
			if _rng.randf() < 0.3:
				_bubbles.say(c, tr("ARC_BABAR"), 1.5, 120.0)
		if c.squashed > 0.0:
			if c.modulate.a <= 0.0:
				_critters.erase(c)
				c.queue_free()
			continue
		var box := c.hitbox()
		if not body.intersects(box):
			continue
		var falling_onto := _player.velocity.y > 50.0 and body.end.y < box.position.y + 26.0
		if falling_onto:
			var killed := c.stomp()
			_player.launch(_t.stomp_bounce)
			_sfx.play(&"hit", 0.05)
			_burst(c.position + Vector2(0, -40), 14)
			_float_text(c.position + Vector2(0, -150), "+%d" % (5 if killed else 2), Color(1, 0.9, 0.3))
			_collected += 5 if killed else 2
			if c.figure and _rng.randf() < 0.6:
				_bubbles.say(c, tr("ARC_ENEMY_HIT_%d" % _rng.randi_range(1, 4)), 1.0, 120.0)
		elif _rum_left > 0.0:
			c.stomp()
			c.hp = 0
			c.squashed = 0.01
			_burst(c.position + Vector2(0, -40), 14)
		else:
			_hurt(c.position)
			c.dir = signf(c.position.x - _player.position.x) if c.position.x != _player.position.x else -c.dir


func _tick_spits(delta: float) -> void:
	var body := _player.body_rect()
	for s in _spits.duplicate():
		s["pos"] += s["vel"] * delta
		if body.has_point(s["pos"]):
			_spits.erase(s)
			_hurt(s["pos"])
		elif (s["pos"] as Vector2).distance_to(_player.position) > 1600.0:
			_spits.erase(s)


func _tick_cars() -> void:
	var body := _player.body_rect()
	for car in _cars:
		var top := car.spring_rect()
		if _player.velocity.y > 0.0 and body.intersects(top) and body.end.y < top.end.y:
			_player.launch(_t.spring_velocity)
			car.boing()
			_sfx.play(&"power", 0.0)
			_burst(top.get_center(), 18)
			_bubbles.say(_player, tr("LINE_BAGNOLE"), 1.8, 130.0)


func _tick_checkpoints() -> void:
	for cp in _checkpoints:
		if not cp.raised and _player.position.x > cp.position.x:
			cp.raised = true
			_respawn = cp.position
			_sfx.play(&"coin", 0.0)
			_burst(cp.position + Vector2(30, -150), 20)
			_float_text(cp.position + Vector2(0, -200), tr("PF_CHECKPOINT"), Color(0.6, 1, 0.6))


func _hurt(from: Vector2) -> void:
	if _invulnerable > 0.0 or _rum_left > 0.0:
		return
	_hearts -= 1
	_invulnerable = _t.invulnerable_seconds
	_sfx.play(&"hurt", 0.0)
	var away := signf(_player.position.x - from.x)
	_player.velocity = Vector2(_t.hurt_knockback.x * (away if away != 0.0 else -1.0), _t.hurt_knockback.y)
	_bubbles.say(_player, tr("ARC_OUCH_%d" % _rng.randi_range(1, 3)), 1.2, 130.0)
	if _hearts <= 0:
		_game_over()


func _fall() -> void:
	_hearts -= 1
	_sfx.play(&"hurt", 0.0)
	if _hearts <= 0:
		_game_over()
		return
	_player.position = _respawn + Vector2(0, -10)
	_player.velocity = Vector2.ZERO
	_invulnerable = _t.invulnerable_seconds
	_bubbles.say(_player, tr("PF_FALL"), 1.6, 130.0)


func _game_over() -> void:
	_state = State.OVER
	(_hud["over_text"] as Label).text = tr("PF_OVER_TEXT") % [_collected, _coin_total]
	_hud["over"].visible = true
	finished.emit({"success": false, "money": _collected})


func _win() -> void:
	_state = State.WON
	_sfx.play(&"power", 0.0)
	for i in 6:
		_burst(_goal.position + Vector2(_rng.randf_range(-200, 200), -_rng.randf_range(50, 250)), 20)
	(_hud["win_text"] as Label).text = tr("PF_WIN_TEXT") % [_collected, _coin_total, _time]
	_hud["win"].visible = true
	finished.emit({"success": true, "money": _collected})


# --- Effects ---------------------------------------------------------------------------

func _dust(at: Vector2, count: int) -> void:
	for i in count:
		_particles.append({"pos": at + Vector2(_rng.randf_range(-20, 20), -4), "vel": Vector2(_rng.randf_range(-120, 120), -_rng.randf_range(20, 120)),
			"life": 0.35, "color": Color(1, 1, 1, 0.7), "size": _rng.randf_range(5, 10)})


func _burst(at: Vector2, count: int) -> void:
	for i in count:
		_particles.append({"pos": at, "vel": Vector2.from_angle(_rng.randf() * TAU) * _rng.randf_range(150, 420),
			"life": _rng.randf_range(0.35, 0.7), "color": SPARKLE[_rng.randi() % 4], "size": _rng.randf_range(4, 8)})


func _float_text(at: Vector2, text: String, color: Color) -> void:
	_texts.append({"pos": at, "text": text, "life": 1.0, "color": color})


func _tick_effects(delta: float) -> void:
	for p in _particles.duplicate():
		p["vel"] = (p["vel"] as Vector2) * 0.92 + Vector2(0, 500) * delta
		p["pos"] += p["vel"] * delta
		p["life"] = float(p["life"]) - delta
		if float(p["life"]) <= 0.0:
			_particles.erase(p)
	for t in _texts.duplicate():
		t["pos"] += Vector2(0, -70) * delta
		t["life"] = float(t["life"]) - delta
		if float(t["life"]) <= 0.0:
			_texts.erase(t)


func _paint_fx(c: CanvasItem) -> void:
	var ink := Color(0.12, 0.09, 0.1)
	var font := ThemeDB.fallback_font
	for coin in _coins:
		var spin := absf(cos(_time * 4.0 + coin.x * 0.01))
		var bob := sin(_time * 3.0 + coin.x * 0.02) * 4.0
		var p := coin + Vector2(0, bob)
		c.draw_set_transform(p, 0.0, Vector2(maxf(0.15, spin), 1.0))
		c.draw_circle(Vector2.ZERO, 15, ink)
		c.draw_circle(Vector2.ZERO, 13, Color(1, 0.78, 0.15))
		c.draw_circle(Vector2.ZERO, 9, Color(1, 0.88, 0.35))
		c.draw_string(font, Vector2(-5, 6), "€", HORIZONTAL_ALIGNMENT_LEFT, -1, 16, Color(0.75, 0.5, 0.05))
		c.draw_set_transform(Vector2.ZERO)
		if fmod(_time * 2.0 + coin.x * 0.013, 3.0) < 0.12:
			c.draw_line(p + Vector2(-14, -14), p + Vector2(-4, -4), Color(1, 1, 1, 0.9), 2.0)
	for pu in _powerups:
		var p: Vector2 = pu["pos"] + Vector2(0, sin(_time * 3.0) * 8.0)
		c.draw_circle(p, 34, Color(1, 1, 1, 0.25 + 0.1 * sin(_time * 6.0)))
		if pu["kind"] == "rum":
			c.draw_rect(Rect2(p + Vector2(-14, -22), Vector2(28, 40)), Color(0.9, 0.6, 0.25))
			c.draw_rect(Rect2(p + Vector2(-14, -22), Vector2(28, 40)), ink, false, 3.0)
			c.draw_circle(p + Vector2(14, -22), 9, Color(0.6, 0.85, 0.3))
			c.draw_line(p + Vector2(4, -34), p + Vector2(-2, 10), Color(0.95, 0.3, 0.3), 3.0)
		else:
			c.draw_rect(Rect2(p + Vector2(-24, -12), Vector2(48, 10)), Color(0.92, 0.74, 0.42))
			c.draw_rect(Rect2(p + Vector2(-24, -2), Vector2(48, 6)), Color(0.4, 0.75, 0.3))
			c.draw_rect(Rect2(p + Vector2(-24, 4), Vector2(48, 10)), Color(0.92, 0.74, 0.42))
	for s in _spits:
		c.draw_circle(s["pos"], 10, Color(0.75, 0.9, 1.0, 0.95))
		c.draw_circle(s["pos"] + Vector2(-3, -3), 3.5, Color.WHITE)
	for p in _particles:
		var col: Color = p["color"]
		col.a *= clampf(float(p["life"]) * 2.5, 0.0, 1.0)
		c.draw_circle(p["pos"], float(p["size"]) * 0.6, col)
	for t in _texts:
		var col: Color = t["color"]
		col.a = clampf(float(t["life"]) * 1.5, 0, 1)
		var w := font.get_string_size(t["text"], HORIZONTAL_ALIGNMENT_LEFT, -1, 34).x
		var at: Vector2 = t["pos"] - Vector2(w * 0.5, 0)
		c.draw_string_outline(font, at, t["text"], HORIZONTAL_ALIGNMENT_LEFT, -1, 34, 8, Color(0, 0, 0, col.a))
		c.draw_string(font, at, t["text"], HORIZONTAL_ALIGNMENT_LEFT, -1, 34, col)


# --- HUD and touch controls -----------------------------------------------------------------

func _build_hud() -> void:
	var layer := CanvasLayer.new()
	add_child(layer)
	var root := Control.new()
	root.set_anchors_preset(Control.PRESET_FULL_RECT)
	root.mouse_filter = Control.MOUSE_FILTER_IGNORE
	layer.add_child(root)
	var top := HBoxContainer.new()
	top.set_anchors_and_offsets_preset(Control.PRESET_TOP_WIDE)
	top.offset_left = 18
	top.offset_right = -18
	top.offset_top = 12
	top.add_theme_constant_override("separation", 26)
	top.mouse_filter = Control.MOUSE_FILTER_IGNORE
	root.add_child(top)
	var hearts := HeartsBar.new()
	hearts.total = _t.hearts
	hearts.mouse_filter = Control.MOUSE_FILTER_IGNORE
	top.add_child(hearts)
	_hud["hearts"] = hearts
	_hud["coins"] = _label("", 36, false)
	top.add_child(_hud["coins"])
	var spacer := Control.new()
	spacer.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	spacer.mouse_filter = Control.MOUSE_FILTER_IGNORE
	top.add_child(spacer)
	_hud["level"] = _label("PF_LEVEL_1", 28)
	top.add_child(_hud["level"])
	var lang := Button.new()
	lang.text = "BTN_LANG"
	lang.focus_mode = Control.FOCUS_NONE
	lang.add_theme_font_size_override("font_size", 22)
	lang.pressed.connect(Lang.toggle_locale)
	top.add_child(lang)

	for spec: Array in [["left", GameInput.ACTION_MOVE_LEFT], ["right", GameInput.ACTION_MOVE_RIGHT], ["jump", GameInput.ACTION_PRIMARY]]:
		var b := TouchScreenButton.new()
		b.texture_normal = _button_texture(spec[0], false)
		b.texture_pressed = _button_texture(spec[0], true)
		b.action = spec[1]
		b.visibility_mode = TouchScreenButton.VISIBILITY_TOUCHSCREEN_ONLY
		var shape := CircleShape2D.new()
		shape.radius = 78.0
		b.shape = shape
		b.shape_centered = true
		layer.add_child(b)
		_touch_buttons.append(b)

	_hud["intro"] = _overlay(root, "PF_TITLE", ["PF_INTRO", "PF_HOWTO"], "BTN_START", _start)
	var over := _overlay(root, "PF_OVER_TITLE", [], "BTN_RETRY", _retry)
	_hud["over_text"] = _insert_text(over)
	_hud["over"] = over
	var win := _overlay(root, "WIN_TITLE", [], "BTN_REPLAY", _retry)
	_hud["win_text"] = _insert_text(win)
	_hud["win"] = win


func _layout_touch() -> void:
	var size := get_viewport().get_visible_rect().size
	var positions := [Vector2(40, size.y - 190), Vector2(220, size.y - 190), Vector2(size.x - 210, size.y - 200)]
	for i in _touch_buttons.size():
		_touch_buttons[i].position = positions[i]


## Round button texture with an arrow or a jump symbol, drawn into an image.
func _button_texture(kind: String, pressed: bool) -> Texture2D:
	var size := 156
	var img := Image.create(size, size, false, Image.FORMAT_RGBA8)
	var c := Vector2(size, size) * 0.5
	for y in size:
		for x in size:
			var d := Vector2(x, y).distance_to(c)
			if d < 76:
				var a := 0.55 if pressed else 0.32
				img.set_pixel(x, y, Color(1, 1, 1, a) if d < 72 else Color(1, 1, 1, 0.8))
	var arrow := Color(0.1, 0.1, 0.15, 0.8)
	for y in size:
		for x in size:
			var p := Vector2(x, y) - c
			var inside := false
			match kind:
				"left":
					inside = p.x > -30 and p.x < 22 and absf(p.y) < (p.x + 30) * 0.75
				"right":
					inside = p.x < 30 and p.x > -22 and absf(p.y) < (30 - p.x) * 0.75
				"jump":
					inside = p.y < 26 and p.y > -34 and absf(p.x) < (p.y + 34) * 0.62
			if inside:
				img.set_pixel(x, y, arrow)
	return ImageTexture.create_from_image(img)


func _insert_text(overlay: Control) -> Label:
	var box: VBoxContainer = overlay.get_child(0).get_child(0)
	var text := _label("", 30, false)
	text.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	box.add_child(text)
	box.move_child(text, 1)
	return text


func _overlay(root: Control, title: String, lines: Array, button: String, action: Callable) -> Control:
	var shade := ColorRect.new()
	shade.color = Color(0.03, 0.15, 0.3, 0.78)
	shade.set_anchors_preset(Control.PRESET_FULL_RECT)
	shade.visible = false
	root.add_child(shade)
	var center := CenterContainer.new()
	center.set_anchors_preset(Control.PRESET_FULL_RECT)
	shade.add_child(center)
	var box := VBoxContainer.new()
	box.add_theme_constant_override("separation", 16)
	box.custom_minimum_size = Vector2(700, 0)
	center.add_child(box)
	var t := _label(title, 66)
	t.add_theme_color_override("font_color", Color(1, 0.88, 0.35))
	t.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	box.add_child(t)
	for key: String in lines:
		var l := _label(key, 26)
		l.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		l.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		box.add_child(l)
	var b := Button.new()
	b.text = button
	b.custom_minimum_size = Vector2(360, 90)
	b.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
	b.focus_mode = Control.FOCUS_NONE
	b.add_theme_font_size_override("font_size", 34)
	b.pressed.connect(action)
	box.add_child(b)
	return shade


func _label(text: String, size: int, translate := true) -> Label:
	var l := Label.new()
	l.text = text
	l.auto_translate_mode = Node.AUTO_TRANSLATE_MODE_INHERIT if translate else Node.AUTO_TRANSLATE_MODE_DISABLED
	l.add_theme_font_size_override("font_size", size)
	l.add_theme_color_override("font_color", Color.WHITE)
	l.add_theme_color_override("font_outline_color", Color(0.05, 0.08, 0.2))
	l.add_theme_constant_override("outline_size", 10)
	l.mouse_filter = Control.MOUSE_FILTER_IGNORE
	return l


func _update_hud() -> void:
	(_hud["hearts"] as HeartsBar).filled = _hearts
	(_hud["coins"] as Label).text = "€ %d" % _collected


func _unhandled_input(event: InputEvent) -> void:
	if _state == State.INTRO and event.is_action_pressed(GameInput.ACTION_PRIMARY):
		_start()
