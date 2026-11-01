extends Node2D
## Story 004: the work scene, 8:00 to 15:00. Panda does as little as possible
## while Romain (boss), Mamar and Victor patrol with view cones. Cous naps on
## the sofa, Babar pops up with his lighter and his spit.
##
## Rules live in [SuspicionModel] and [WorkDayModel]; tuning in work_tuning.tres.
## Emits [signal finished] with the scene result for the day shell (story 005).

signal finished(result: Dictionary)

enum State { INTRO, PLAYING, CAUGHT, DONE }
enum Zone { OPEN, DESK, COFFEE, SOFA, HIDDEN }
enum BabarState { WAITING, APPROACH, GAG, LEAVE }

const TUNING: WorkTuning = preload("res://src/scenes/work/work_tuning.tres")
const DESIGN := Vector2(1280, 720)
const WALK := Rect2(40, 350, 1200, 345)
const DESK_ZONE := Rect2(270, 468, 180, 84)
const COFFEE_ZONE := Rect2(965, 372, 200, 80)
const SOFA_ZONE := Rect2(545, 345, 230, 72)
const TOILET_ZONE := Rect2(40, 345, 140, 75)
const PLANT_ZONE := Rect2(1135, 600, 120, 100)
const CHAR_SCALE := 0.62
const DESK_CHECK_STOP := 1

## Skips the intro card after a retry.
static var skip_intro := false

var _state := State.INTRO
var _tuning: WorkTuning = TUNING
var _suspicion: SuspicionModel
var _day: WorkDayModel
var _rng := RandomNumberGenerator.new()

var _world: Node2D
var _backdrop: OfficeBackdrop
var _actors: Node2D
var _cones: ConeLayer
var _bubbles: SpeechBubbles
var _panda: Caricature
var _cous: Caricature
var _babar: Caricature
var _romain: Watcher
var _watchers: Array[Watcher] = []

var _target := Vector2.ZERO
var _has_target := false
var _zone := Zone.DESK
var _fake_left := 0.0
var _fake_cooldown := 0.0
var _flinch_left := 0.0
var _babar_state := BabarState.WAITING
var _babar_timer := 0.0
var _babar_gag_left := 0.0
var _babar_spit := false
var _last_seen_line := {}

var _hud: Dictionary = {}


func _ready() -> void:
	_rng.randomize()
	_suspicion = SuspicionModel.new(_tuning)
	_day = WorkDayModel.new(_tuning)
	_build_world()
	_build_hud()
	GameInput.pointer_tapped.connect(_on_pointer_tapped)
	get_viewport().size_changed.connect(_layout)
	_layout()
	_babar_timer = _rng.randf_range(_tuning.babar_min_interval, _tuning.babar_max_interval)
	if skip_intro or "--skip-intro" in OS.get_cmdline_user_args():
		_start()
	else:
		_set_paused(true)
		_hud["intro"].visible = true


# --- World -------------------------------------------------------------------

func _build_world() -> void:
	_world = Node2D.new()
	add_child(_world)
	_backdrop = OfficeBackdrop.new()
	_world.add_child(_backdrop)
	var sign := Label.new()
	sign.text = "OFFICE_SIGN"
	sign.position = Vector2(205, 162)
	sign.size = Vector2(300, 34)
	sign.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	sign.add_theme_font_size_override("font_size", 22)
	sign.add_theme_color_override("font_color", Color(0.95, 0.9, 0.75))
	_backdrop.add_child(sign)
	var wc := Label.new()
	wc.text = "WC"
	wc.position = Vector2(85, 140)
	wc.size = Vector2(50, 30)
	wc.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	wc.auto_translate_mode = Node.AUTO_TRANSLATE_MODE_DISABLED
	wc.add_theme_color_override("font_color", Color(0.2, 0.2, 0.25))
	_backdrop.add_child(wc)

	_cones = ConeLayer.new()
	_world.add_child(_cones)
	_actors = Node2D.new()
	_actors.y_sort_enabled = true
	_world.add_child(_actors)
	_bubbles = SpeechBubbles.new()
	_world.add_child(_bubbles)

	_add_prop(OfficeProp.Kind.DESK, Vector2(360, 562), Color(0.95, 0.75, 0.3))
	_add_prop(OfficeProp.Kind.DESK, Vector2(700, 690), Color(0.47, 0.73, 0.93))
	_add_prop(OfficeProp.Kind.DESK, Vector2(1000, 572), Color(0.5, 0.8, 0.6))
	_add_prop(OfficeProp.Kind.COFFEE, Vector2(1065, 352))
	_add_prop(OfficeProp.Kind.SOFA, Vector2(660, 420))
	_add_prop(OfficeProp.Kind.PLANT, Vector2(1200, 700))
	_add_prop(OfficeProp.Kind.CABINET, Vector2(95, 660))
	_add_prop(OfficeProp.Kind.WATER, Vector2(880, 372))

	_panda = _add_character(CastLooks.PANDA, Vector2(318, 522))
	_cous = _add_character(CastLooks.COUS, Vector2(600, 405))
	_cous.sleeping = true
	_add_character(CastLooks.ALINE, Vector2(930, 410))
	_add_character(CastLooks.EUGENIE, Vector2(170, 655)).facing_left = true
	_babar = _add_character(CastLooks.BABAR, Vector2(-200, 500))
	_babar.visible = false

	var t := _tuning
	var half := deg_to_rad(t.view_half_angle_deg)
	_romain = _add_watcher(CastLooks.ROMAIN, [Vector2(1230, 420), Vector2(360, 610), Vector2(700, 470),
		Vector2(1050, 455), Vector2(220, 430), Vector2(560, 655)],
		t.boss_speed, t.boss_view_range, half, t.boss_weight, t.boss_pause)
	_romain.stop_reached.connect(_on_romain_stop)
	_add_watcher(CastLooks.MAMAR, [Vector2(700, 645), Vector2(1050, 445), Vector2(700, 645)],
		t.colleague_speed, t.colleague_view_range, half, t.colleague_weight, t.colleague_pause)
	_add_watcher(CastLooks.VICTOR, [Vector2(1000, 527), Vector2(880, 445), Vector2(470, 462), Vector2(1000, 527)],
		t.colleague_speed, t.colleague_view_range, half, t.colleague_weight, t.colleague_pause)
	_cones.watchers = _watchers
	_cones.boss = _romain


func _add_prop(kind: OfficeProp.Kind, at: Vector2, accent := Color(0.3, 0.5, 0.8)) -> void:
	var prop := OfficeProp.new(kind, accent)
	prop.position = at
	_actors.add_child(prop)


func _add_character(id: StringName, at: Vector2) -> Caricature:
	var c := Caricature.new()
	c.look = CastLooks.get_look(id)
	c.position = at
	c.scale = Vector2(CHAR_SCALE, CHAR_SCALE)
	_actors.add_child(c)
	return c


func _add_watcher(id: StringName, stops: Array, speed: float, view_range: float, half: float,
		weight: float, pause: float) -> Watcher:
	var w := Watcher.new()
	w.setup(id, PackedVector2Array(stops), speed, view_range, half, weight, pause)
	w.figure.scale = Vector2(CHAR_SCALE, CHAR_SCALE)
	_actors.add_child(w)
	_watchers.append(w)
	return w


func _layout() -> void:
	var visible := get_viewport().get_visible_rect().size
	var fit := minf(visible.y / DESIGN.y, visible.x / DESIGN.x)
	_world.scale = Vector2(fit, fit)
	_world.position = Vector2((visible.x - DESIGN.x * fit) * 0.5, (visible.y - DESIGN.y * fit) * 0.5)


# --- Flow --------------------------------------------------------------------

func _start() -> void:
	_state = State.PLAYING
	_hud["intro"].visible = false
	_set_paused(false)


func _set_paused(paused: bool) -> void:
	_actors.process_mode = Node.PROCESS_MODE_DISABLED if paused else Node.PROCESS_MODE_INHERIT
	_cones.visible = not paused or _state == State.INTRO


func _retry() -> void:
	skip_intro = true
	get_tree().reload_current_scene()


func _process(delta: float) -> void:
	if _state != State.PLAYING:
		return
	_move_panda(delta)
	_zone = _zone_at(_panda.position)
	var hidden := _zone == Zone.HIDDEN
	var at_desk := _zone == Zone.DESK
	var faking := _fake_left > 0.0

	var seen_weight := 0.0
	for w in _watchers:
		var sees := not hidden and not at_desk and not faking and w.sees(_panda.position)
		if sees and not w.alarmed:
			_watcher_reacts(w)
		w.alarmed = sees
		if sees:
			seen_weight += w.weight
	_suspicion.tick(delta, seen_weight, at_desk, faking)

	var promoted := false
	var reviews_before := _day.reviews_done()
	promoted = _day.tick(delta, _slack_multiplier(), _suspicion.value)
	if promoted:
		_banner(tr("PROMO") % tr("RANK_%d" % _day.rank), Color(0.98, 0.8, 0.2))
		_bubbles.say(_panda, tr("LINE_HOHO_1"), 1.6, _head(_panda))
	elif _day.reviews_done() > reviews_before:
		_banner(tr("PROMO_MISSED"), Color(0.95, 0.45, 0.4))

	_tick_fake(delta)
	_tick_babar(delta)
	_tick_sofa()
	_backdrop.hour = _day.hour()
	_update_hud()

	if _suspicion.is_caught():
		_caught()
	elif _day.is_over():
		_finish()


func _move_panda(delta: float) -> void:
	if _flinch_left > 0.0:
		_flinch_left -= delta
		_panda.walking = false
		return
	if _fake_left > 0.0:
		_panda.walking = false
		return
	var direction := GameInput.get_move_vector()
	var before := _panda.position
	if direction != Vector2.ZERO:
		_has_target = false
		_panda.position += direction * _tuning.panda_speed * delta
	elif _has_target:
		_panda.position = _panda.position.move_toward(_target, _tuning.panda_speed * delta)
		_has_target = _panda.position.distance_to(_target) > 2.0
	_panda.position = _clamp_walk(_panda.position)
	var moved := _panda.position - before
	_panda.walking = moved.length() > 0.1
	if absf(moved.x) > 0.1:
		_panda.facing_left = moved.x < 0.0
	_panda.sleeping = _zone == Zone.SOFA and not _panda.walking


func _clamp_walk(p: Vector2) -> Vector2:
	return Vector2(clampf(p.x, WALK.position.x, WALK.end.x), clampf(p.y, WALK.position.y, WALK.end.y))


func _zone_at(p: Vector2) -> Zone:
	if DESK_ZONE.has_point(p):
		return Zone.DESK
	if COFFEE_ZONE.has_point(p):
		return Zone.COFFEE
	if SOFA_ZONE.has_point(p):
		return Zone.SOFA
	if TOILET_ZONE.has_point(p) or PLANT_ZONE.has_point(p):
		return Zone.HIDDEN
	return Zone.OPEN


func _slack_multiplier() -> float:
	match _zone:
		Zone.DESK:
			return 0.0
		Zone.COFFEE:
			return _tuning.coffee_multiplier
		Zone.SOFA:
			return _tuning.nap_multiplier
		Zone.HIDDEN:
			return _tuning.hide_multiplier
	return 1.0


func _head(c: Caricature) -> float:
	return c.head_top() * c.scale.y + 6.0


func _watcher_reacts(w: Watcher) -> void:
	var now := Time.get_ticks_msec()
	if now - int(_last_seen_line.get(w, -99999)) < 5000:
		return
	_last_seen_line[w] = now
	var key := "ROMAIN_SEEN" if w == _romain else ("MAMAR_SEEN" if w.figure.look.beard == CharacterLook.Beard.FULL else "VICTOR_SEEN")
	_bubbles.say(w, tr(key), 1.8, _head(w.figure))


func _on_romain_stop(index: int) -> void:
	if _state != State.PLAYING or index != DESK_CHECK_STOP:
		return
	if _zone != Zone.DESK and _fake_left <= 0.0:
		_suspicion.add(_tuning.empty_desk_penalty)
		_bubbles.say(_romain, tr("ROMAIN_DESK"), 2.2, _head(_romain.figure))


func _tick_fake(delta: float) -> void:
	_fake_left = maxf(0.0, _fake_left - delta)
	_fake_cooldown = maxf(0.0, _fake_cooldown - delta)


func _fake_busy() -> void:
	if _state != State.PLAYING or _fake_cooldown > 0.0:
		return
	_fake_left = _tuning.fake_busy_seconds
	_fake_cooldown = _tuning.fake_busy_cooldown
	_suspicion.add(-_tuning.fake_busy_drop)
	_bubbles.say(_panda, tr("LINE_FAKE_%d" % _rng.randi_range(1, 3)), _tuning.fake_busy_seconds, _head(_panda))


func _hoho() -> void:
	if _state == State.PLAYING:
		_bubbles.say(_panda, tr("LINE_HOHO_%d" % _rng.randi_range(1, 3)), 2.2, _head(_panda))


var _was_on_sofa := false


func _tick_sofa() -> void:
	var on_sofa := _zone == Zone.SOFA
	if on_sofa and not _was_on_sofa:
		_bubbles.say(_cous, tr("COUS_SOFA"), 2.2, _head(_cous))
	elif not on_sofa and _rng.randf() < 0.002:
		_bubbles.say(_cous, tr("ZZZ"), 1.5, _head(_cous))
	_was_on_sofa = on_sofa


# --- Babar ---------------------------------------------------------------------

func _tick_babar(delta: float) -> void:
	match _babar_state:
		BabarState.WAITING:
			_babar_timer -= delta
			if _babar_timer <= 0.0:
				_babar_state = BabarState.APPROACH
				var from_left := _panda.position.x > DESIGN.x * 0.5
				_babar.position = Vector2(-60.0 if from_left else DESIGN.x + 60.0, _panda.position.y)
				_babar.visible = true
		BabarState.APPROACH:
			if _zone == Zone.HIDDEN:
				_bubbles.say(_babar, tr("BABAR_SEARCH"), 1.8, _head(_babar))
				_babar_state = BabarState.LEAVE
				return
			var goal := _panda.position + Vector2(-48.0 if _babar.position.x < _panda.position.x else 48.0, 4.0)
			_walk(_babar, goal, _tuning.babar_speed * delta)
			if _babar.position.distance_to(goal) < 6.0:
				_babar_gag()
		BabarState.GAG:
			_babar_gag_left -= delta
			_babar.walking = false
			if _babar_gag_left <= 0.0:
				_babar_state = BabarState.LEAVE
		BabarState.LEAVE:
			var exit_x := -80.0 if _babar.position.x < DESIGN.x * 0.5 else DESIGN.x + 80.0
			_walk(_babar, Vector2(exit_x, _babar.position.y), _tuning.babar_speed * delta)
			if absf(_babar.position.x - exit_x) < 4.0:
				_babar.visible = false
				_babar_state = BabarState.WAITING
				_babar_timer = _rng.randf_range(_tuning.babar_min_interval, _tuning.babar_max_interval)


func _walk(c: Caricature, goal: Vector2, step: float) -> void:
	var before := c.position
	c.position = c.position.move_toward(goal, step)
	c.walking = c.position != before
	if absf(c.position.x - before.x) > 0.05:
		c.facing_left = c.position.x < before.x


func _babar_gag() -> void:
	_babar_state = BabarState.GAG
	_babar_gag_left = 1.4
	_babar_spit = not _babar_spit
	_babar.facing_left = _babar.position.x > _panda.position.x
	_bubbles.say(_babar, tr("BABAR_SPIT" if _babar_spit else "BABAR_LIGHTER"), 1.6, _head(_babar))
	_bubbles.say(_panda, tr("LINE_OUCH"), 1.6, _head(_panda))
	_panda.flinch(_tuning.flinch_seconds)
	_flinch_left = _tuning.flinch_seconds
	_fake_left = 0.0
	for w in _watchers:
		if w.position.distance_to(_panda.position) < _tuning.babar_noise_radius:
			_suspicion.add(_tuning.babar_noise_suspicion)


# --- End states ------------------------------------------------------------------

func _caught() -> void:
	_state = State.CAUGHT
	_set_paused(true)
	_bubbles.say(_romain, tr("CAUGHT_LINE"), 99.0, _head(_romain.figure))
	_hud["caught"].visible = true


func _finish() -> void:
	_state = State.DONE
	_set_paused(true)
	var r := _day.result(true)
	(_hud["win_summary"] as Label).text = tr("WIN_SUMMARY") % [r["money"], r["promotions"], r["laziness"]]
	_hud["win"].visible = true
	finished.emit(r)


func _on_pointer_tapped(_pos: Vector2) -> void:
	if _state != State.PLAYING:
		return
	_target = _clamp_walk(_world.get_local_mouse_position())
	_has_target = true


func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed(GameInput.ACTION_PRIMARY):
		if _state == State.INTRO:
			_start()
		else:
			_fake_busy()
	elif event.is_action_pressed(GameInput.ACTION_SECONDARY):
		_hoho()


# --- HUD ---------------------------------------------------------------------------

func _build_hud() -> void:
	var layer := CanvasLayer.new()
	add_child(layer)
	var root := Control.new()
	root.set_anchors_preset(Control.PRESET_FULL_RECT)
	root.mouse_filter = Control.MOUSE_FILTER_IGNORE
	layer.add_child(root)

	var band := ColorRect.new()
	band.color = Color(0.05, 0.07, 0.12, 0.55)
	band.set_anchors_and_offsets_preset(Control.PRESET_TOP_WIDE)
	band.offset_bottom = 112
	band.mouse_filter = Control.MOUSE_FILTER_IGNORE
	root.add_child(band)
	var top := HBoxContainer.new()
	top.set_anchors_and_offsets_preset(Control.PRESET_TOP_WIDE)
	top.offset_left = 16
	top.offset_right = -16
	top.offset_top = 10
	top.add_theme_constant_override("separation", 24)
	top.mouse_filter = Control.MOUSE_FILTER_IGNORE
	root.add_child(top)

	var left := VBoxContainer.new()
	left.mouse_filter = Control.MOUSE_FILTER_IGNORE
	top.add_child(left)
	_hud["clock"] = _label("08:00", 44, false)
	left.add_child(_hud["clock"])
	_hud["rank"] = _label("RANK_0", 22)
	left.add_child(_hud["rank"])

	var middle := VBoxContainer.new()
	middle.size_flags_horizontal = Control.SIZE_EXPAND | Control.SIZE_SHRINK_CENTER
	middle.custom_minimum_size = Vector2(380, 0)
	middle.mouse_filter = Control.MOUSE_FILTER_IGNORE
	top.add_child(middle)
	middle.add_child(_label("HUD_SUSPICION", 20))
	var bar := ProgressBar.new()
	bar.custom_minimum_size = Vector2(260, 22)
	bar.max_value = 1.0
	bar.show_percentage = false
	var fill := StyleBoxFlat.new()
	fill.bg_color = Color(0.9, 0.25, 0.2)
	fill.set_corner_radius_all(6)
	var back := StyleBoxFlat.new()
	back.bg_color = Color(0, 0, 0, 0.45)
	back.set_corner_radius_all(6)
	bar.add_theme_stylebox_override("fill", fill)
	bar.add_theme_stylebox_override("background", back)
	middle.add_child(bar)
	_hud["suspicion"] = bar
	_hud["laziness"] = _label("", 20, false)
	middle.add_child(_hud["laziness"])

	var right := VBoxContainer.new()
	right.alignment = BoxContainer.ALIGNMENT_END
	right.mouse_filter = Control.MOUSE_FILTER_IGNORE
	top.add_child(right)
	_hud["money"] = _label("0 €", 36, false)
	_hud["money"].horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	right.add_child(_hud["money"])
	var lang := _button("BTN_LANG", Vector2(150, 50))
	lang.pressed.connect(Lang.toggle_locale)
	right.add_child(lang)

	_hud["zone"] = _label("", 22, false)
	_hud["zone"].set_anchors_and_offsets_preset(Control.PRESET_BOTTOM_LEFT)
	_hud["zone"].position += Vector2(18, -50)
	root.add_child(_hud["zone"])

	var buttons := HBoxContainer.new()
	buttons.add_theme_constant_override("separation", 14)
	buttons.set_anchors_and_offsets_preset(Control.PRESET_BOTTOM_RIGHT)
	buttons.grow_horizontal = Control.GROW_DIRECTION_BEGIN
	buttons.grow_vertical = Control.GROW_DIRECTION_BEGIN
	buttons.offset_right = -18
	buttons.offset_bottom = -18
	root.add_child(buttons)
	var hoho := _button("BTN_HOHO", Vector2(170, 96))
	hoho.pressed.connect(_hoho)
	buttons.add_child(hoho)
	var fake := _button("BTN_FAKE", Vector2(230, 96))
	fake.pressed.connect(_fake_busy)
	buttons.add_child(fake)
	_hud["fake"] = fake

	_hud["banner"] = _label("", 40, false)
	_hud["banner"].set_anchors_and_offsets_preset(Control.PRESET_CENTER)
	_hud["banner"].grow_horizontal = Control.GROW_DIRECTION_BOTH
	_hud["banner"].horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_hud["banner"].visible = false
	root.add_child(_hud["banner"])

	_hud["intro"] = _overlay(root, "WORK_TITLE", ["WORK_INTRO", "WORK_HOWTO"], "BTN_START", _start)
	_hud["caught"] = _overlay(root, "CAUGHT_TITLE", ["CAUGHT_LINE"], "BTN_RETRY", _retry)
	var win := _overlay(root, "WIN_TITLE", [], "BTN_REPLAY", _retry)
	var summary := _label("", 28, false)
	summary.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	win.get_child(0).get_child(0).add_child(summary)
	win.get_child(0).get_child(0).move_child(summary, 1)
	_hud["win"] = win
	_hud["win_summary"] = summary


func _overlay(root: Control, title: String, lines: Array, button: String, action: Callable) -> Control:
	var shade := ColorRect.new()
	shade.color = Color(0.05, 0.06, 0.1, 0.78)
	shade.set_anchors_preset(Control.PRESET_FULL_RECT)
	shade.visible = false
	root.add_child(shade)
	var center := CenterContainer.new()
	center.set_anchors_preset(Control.PRESET_FULL_RECT)
	shade.add_child(center)
	var box := VBoxContainer.new()
	box.add_theme_constant_override("separation", 18)
	box.custom_minimum_size = Vector2(640, 0)
	center.add_child(box)
	var t := _label(title, 56)
	t.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	box.add_child(t)
	for key: String in lines:
		var l := _label(key, 26)
		l.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		l.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		box.add_child(l)
	var b := _button(button, Vector2(320, 84))
	b.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
	b.pressed.connect(action)
	box.add_child(b)
	return shade


func _label(text: String, size: int, translate := true) -> Label:
	var l := Label.new()
	l.text = text
	l.auto_translate_mode = Node.AUTO_TRANSLATE_MODE_INHERIT if translate else Node.AUTO_TRANSLATE_MODE_DISABLED
	l.add_theme_font_size_override("font_size", size)
	l.add_theme_color_override("font_color", Color.WHITE)
	l.add_theme_color_override("font_outline_color", Color(0.05, 0.05, 0.1))
	l.add_theme_constant_override("outline_size", 9)
	l.mouse_filter = Control.MOUSE_FILTER_IGNORE
	return l


func _button(key: String, min_size: Vector2) -> Button:
	var b := Button.new()
	b.text = key
	b.custom_minimum_size = min_size
	b.add_theme_font_size_override("font_size", 28)
	b.focus_mode = Control.FOCUS_NONE
	return b


var _banner_left := 0.0


func _banner(text: String, color: Color) -> void:
	var b: Label = _hud["banner"]
	b.text = text
	b.add_theme_color_override("font_color", color)
	b.visible = true
	_banner_left = 2.4


func _update_hud() -> void:
	(_hud["clock"] as Label).text = _day.clock_text()
	(_hud["rank"] as Label).text = "RANK_%d" % _day.rank
	(_hud["money"] as Label).text = "%d €" % roundi(_day.money)
	(_hud["suspicion"] as ProgressBar).value = _suspicion.ratio()
	(_hud["laziness"] as Label).text = "%s : %d" % [tr("HUD_LAZINESS"), roundi(_day.laziness)]
	var zone_key: String = ["ZONE_OPEN", "ZONE_DESK", "ZONE_COFFEE", "ZONE_SOFA", "ZONE_HIDDEN"][_zone]
	(_hud["zone"] as Label).text = tr(zone_key)
	var fake: Button = _hud["fake"]
	fake.disabled = _fake_cooldown > 0.0
	fake.text = tr("BTN_FAKE") + ("" if _fake_cooldown <= 0.0 else " (%d)" % ceili(_fake_cooldown))
	if _banner_left > 0.0:
		_banner_left -= get_process_delta_time()
		(_hud["banner"] as Label).visible = _banner_left > 0.0
