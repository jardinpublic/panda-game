extends Node2D
## The office arcade (story 004, reworked): Panda auto-fires paper balls at
## colleagues rushing him with files, from 8h to 15h. Romain is the boss,
## Babar charges across spitting, Cous throws power-ups from the sofa.
## Rules: [ArcadeRules]. Numbers: arcade_tuning.tres.

signal finished(result: Dictionary)

enum State { INTRO, PLAYING, OVER, WON }

const TUNING: ArcadeTuning = preload("res://src/scenes/arcade/arcade_tuning.tres")
const DESIGN := Vector2(1280, 720)
const ARENA := Rect2(60, 360, 1160, 335)
const CHAR_SCALE := 0.55
const SHOT_HEIGHT := 70.0
const STICK_RADIUS := 70.0
const CONFETTI: PackedColorArray = [Color(0.98, 0.85, 0.3), Color(0.95, 0.4, 0.45), Color(0.4, 0.75, 0.95),
	Color(0.55, 0.9, 0.5), Color(1, 1, 1)]
const WALKER_IDS: Array[StringName] = [CastLooks.ALINE, CastLooks.EUGENIE, CastLooks.VIOLAINE]

static var skip_intro := false

var _t: ArcadeTuning = TUNING
var _rules: ArcadeRules
var _state := State.INTRO
var _rng := RandomNumberGenerator.new()

var _world: Node2D
var _actors: Node2D
var _fx: FxCanvas
var _bubbles: SpeechBubbles
var _sfx: Sfx
var _panda: Caricature
var _cous: Caricature
var _babar: Caricature
var _enemies: Array[ArcadeEnemy] = []

var _balls: Array[Dictionary] = []       # {pos, vel, life}
var _hostile: Array[Dictionary] = []     # {pos, vel, kind: "file"/"spit", spin}
var _pickups: Array[Dictionary] = []     # {pos, vel, kind: "coin"/"rum"/"sandwich"/"pig", life}
var _particles: Array[Dictionary] = []   # {pos, vel, life, color, size}
var _texts: Array[Dictionary] = []       # {pos, text, life, color, size}
var _rings: Array[Dictionary] = []       # {pos, radius, life}

var _spawn_left := 1.0
var _fire_left := 0.0
var _last_hour := 8
var _bosses_spawned := {}
var _babar_left := 0.0
var _babar_dir := 1.0
var _babar_spit_left := 0.0
var _cous_left := 0.0
var _rum_left := 0.0
var _pig_left := 0.0
var _pig_angle := 0.0
var _shake := 0.0
var _stick_active := false
var _stick_origin := Vector2.ZERO
var _stick_vector := Vector2.ZERO
var _hud := {}
var _banner_left := 0.0


func _ready() -> void:
	_rng.randomize()
	_rules = ArcadeRules.new(_t)
	_babar_left = _t.babar_interval
	_cous_left = _t.cous_interval * 0.5
	_build_world()
	_build_hud()
	get_viewport().size_changed.connect(_layout)
	_layout()
	if skip_intro or "--skip-intro" in OS.get_cmdline_user_args():
		_start()
	else:
		_hud["intro"].visible = true


# --- World -------------------------------------------------------------------

func _build_world() -> void:
	_world = Node2D.new()
	add_child(_world)
	var backdrop := OfficeBackdrop.new()
	_world.add_child(backdrop)
	var sign := Label.new()
	sign.text = "OFFICE_SIGN"
	sign.position = Vector2(205, 162)
	sign.size = Vector2(300, 34)
	sign.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	sign.add_theme_font_size_override("font_size", 22)
	sign.add_theme_color_override("font_color", Color(0.95, 0.9, 0.75))
	backdrop.add_child(sign)
	_actors = Node2D.new()
	_actors.y_sort_enabled = true
	_world.add_child(_actors)
	for spec: Array in [[OfficeProp.Kind.COFFEE, Vector2(1065, 352)], [OfficeProp.Kind.SOFA, Vector2(660, 400)],
			[OfficeProp.Kind.WATER, Vector2(880, 362)], [OfficeProp.Kind.CABINET, Vector2(330, 352)]]:
		var prop := OfficeProp.new(spec[0])
		prop.position = spec[1]
		_actors.add_child(prop)
	_cous = _character(CastLooks.COUS, Vector2(610, 388))
	_cous.sleeping = true
	_panda = _character(CastLooks.PANDA, ARENA.get_center() + Vector2(0, 40))
	_babar = _character(CastLooks.BABAR, Vector2(-300, 500))
	_babar.visible = false
	_fx = FxCanvas.new()
	_fx.painter = _paint_fx
	_world.add_child(_fx)
	_bubbles = SpeechBubbles.new()
	_world.add_child(_bubbles)
	_sfx = Sfx.new()
	add_child(_sfx)


func _character(id: StringName, at: Vector2) -> Caricature:
	var c := Caricature.new()
	c.look = CastLooks.get_look(id)
	c.position = at
	c.scale = Vector2(CHAR_SCALE, CHAR_SCALE)
	_actors.add_child(c)
	return c


func _layout() -> void:
	var visible := get_viewport().get_visible_rect().size
	var fit := minf(visible.y / DESIGN.y, visible.x / DESIGN.x)
	_world.scale = Vector2(fit, fit)
	_world.position = Vector2((visible.x - DESIGN.x * fit) * 0.5, (visible.y - DESIGN.y * fit) * 0.5)


# --- Flow --------------------------------------------------------------------

func _start() -> void:
	_state = State.PLAYING
	_hud["intro"].visible = false
	_banner(tr("ARC_WAVE") % "08:00", Color(1, 0.95, 0.6))
	_bubbles.say(_panda, tr("LINE_HOHO_2"), 2.5, _head(_panda))


func _retry() -> void:
	skip_intro = true
	get_tree().reload_current_scene()


func _process(delta: float) -> void:
	_tick_shake(delta)
	_tick_effects(delta)
	_update_hud(delta)
	if _state != State.PLAYING:
		return
	_rules.tick(delta)
	_tick_hour()
	_move_panda(delta)
	_tick_spawning(delta)
	_tick_enemies(delta)
	_tick_firing(delta)
	_tick_balls(delta)
	_tick_hostile(delta)
	_tick_pickups(delta)
	_tick_babar(delta)
	_tick_cous(delta)
	_tick_powerups(delta)
	if _rules.is_day_over():
		_win()


func _tick_hour() -> void:
	var hour := _rules.hour()
	if hour == _last_hour:
		return
	_last_hour = hour
	_banner(tr("ARC_WAVE") % ("%02d:00" % hour), Color(1, 0.95, 0.6))
	if hour in _t.boss_hours and not _bosses_spawned.has(hour):
		_bosses_spawned[hour] = true
		_spawn_enemy(ArcadeEnemy.Kind.BOSS)
		_banner(tr("ARC_BOSS"), Color(1, 0.4, 0.35))
		_sfx.play(&"boss", 0.0)
		_shake = 14.0


# --- Panda ---------------------------------------------------------------------

func _move_panda(delta: float) -> void:
	var input := GameInput.get_move_vector()
	if _stick_active:
		input = _stick_vector
	var speed := _t.player_speed * (_t.rum_speed_multiplier if _rum_left > 0.0 else 1.0)
	var before := _panda.position
	_panda.position = _clamp(_panda.position + input * speed * delta)
	var moved := _panda.position - before
	_panda.walking = moved.length() > 0.2
	if absf(moved.x) > 0.2:
		_panda.facing_left = moved.x < 0.0
	_panda.visible = not _rules.is_invulnerable() or int(_rules.elapsed * 14.0) % 2 == 0
	_panda.modulate = Color(1.25, 0.95, 0.7) if _rum_left > 0.0 else Color.WHITE


func _clamp(p: Vector2) -> Vector2:
	return Vector2(clampf(p.x, ARENA.position.x, ARENA.end.x), clampf(p.y, ARENA.position.y, ARENA.end.y))


func _hurt_panda(from: Vector2) -> void:
	if _rules.is_invulnerable():
		return
	var last := _rules.hurt()
	_sfx.play(&"hurt", 0.0)
	_shake = 16.0
	_panda.flinch(0.5)
	_panda.position = _clamp(_panda.position + (_panda.position - from).normalized() * 60.0)
	_burst(_panda.position + Vector2(0, -SHOT_HEIGHT), 14, Color(0.95, 0.95, 0.9))
	_bubbles.say(_panda, tr("ARC_OUCH_%d" % _rng.randi_range(1, 3)), 1.2, _head(_panda))
	if last:
		_game_over()


func _head(c: Node2D) -> float:
	var fig: Caricature = c if c is Caricature else (c as ArcadeEnemy).figure
	return fig.head_top() * fig.scale.y + 6.0


# --- Enemies ---------------------------------------------------------------------

func _tick_spawning(delta: float) -> void:
	_spawn_left -= delta
	if _spawn_left > 0.0:
		return
	_spawn_left = _t.spawn_interval[_rules.hour_index()]
	if _enemies.size() >= _t.max_enemies:
		return
	var roll := _rng.randf()
	var hour := _rules.hour()
	var kind := ArcadeEnemy.Kind.WALKER
	if hour >= 9 and roll < 0.35:
		kind = ArcadeEnemy.Kind.RUNNER
	elif hour >= 10 and roll > 0.8:
		kind = ArcadeEnemy.Kind.TANK
	_spawn_enemy(kind)


func _spawn_enemy(kind: ArcadeEnemy.Kind) -> void:
	var e := ArcadeEnemy.new()
	match kind:
		ArcadeEnemy.Kind.RUNNER:
			e.setup(CastLooks.VICTOR, kind, _t.runner_hp, _t.runner_speed, CHAR_SCALE)
		ArcadeEnemy.Kind.TANK:
			e.setup(CastLooks.MAMAR, kind, _t.tank_hp, _t.tank_speed, CHAR_SCALE * 1.15)
		ArcadeEnemy.Kind.BOSS:
			e.setup(CastLooks.ROMAIN, kind, _t.boss_hp, _t.boss_speed, CHAR_SCALE * 1.5)
			e.throw_left = _t.boss_throw_interval
		_:
			e.setup(WALKER_IDS[_rng.randi() % WALKER_IDS.size()], kind, _t.walker_hp, _t.walker_speed, CHAR_SCALE)
	var side := -1.0 if _rng.randf() < 0.5 else 1.0
	e.position = Vector2(DESIGN.x * 0.5 + side * (DESIGN.x * 0.5 + 60.0), _rng.randf_range(ARENA.position.y, ARENA.end.y))
	_actors.add_child(e)
	_enemies.append(e)
	if kind == ArcadeEnemy.Kind.BOSS:
		_bubbles.say(e, tr("CAUGHT_LINE"), 3.0, _head(e))


func _tick_enemies(delta: float) -> void:
	var speed_mult := _t.speed_by_hour[_rules.hour_index()]
	for e: ArcadeEnemy in _enemies.duplicate():
		e.step(delta, _panda.position, speed_mult)
		if e.finished_dying():
			_enemies.erase(e)
			e.queue_free()
			continue
		if e.dying:
			continue
		# Keep a little personal space so they do not stack
		for other in _enemies:
			if other != e and not other.dying:
				var gap := e.position - other.position
				if gap.length() < 46.0 and gap.length() > 0.01:
					e.position += gap.normalized() * (46.0 - gap.length()) * 0.5
		if e.kind == ArcadeEnemy.Kind.BOSS:
			e.throw_left -= delta
			if e.throw_left <= 0.0:
				e.throw_left = _t.boss_throw_interval
				var dir := (_panda.position - e.position).normalized()
				for spread: float in [-0.25, 0.0, 0.25]:
					_hostile.append({"pos": e.position, "vel": dir.rotated(spread) * _t.file_speed, "kind": "file", "spin": 0.0})
		elif e.position.distance_to(_panda.position) < _t.touch_radius + 10.0:
			_hurt_panda(e.position)
			if _rng.randf() < 0.5:
				_bubbles.say(e, tr("ARC_FILE"), 1.2, _head(e))


func _damage(e: ArcadeEnemy, amount: float, direction: Vector2, knock: float) -> void:
	_rules.register_hit()
	_sfx.play(&"hit")
	_burst(e.position + Vector2(0, -SHOT_HEIGHT), 6, CONFETTI[_rng.randi() % CONFETTI.size()])
	if e.hit(amount, direction, knock):
		_shake = maxf(_shake, 5.0 if e.kind != ArcadeEnemy.Kind.BOSS else 20.0)
		var coins := _t.coins_per_kill * (12 if e.kind == ArcadeEnemy.Kind.BOSS else (2 if e.kind == ArcadeEnemy.Kind.TANK else 1))
		for i in coins:
			_drop(e.position, "coin")
		if e.kind == ArcadeEnemy.Kind.BOSS:
			_burst(e.position + Vector2(0, -SHOT_HEIGHT), 60, Color(1, 0.85, 0.3))
			_banner(tr("ARC_BOSS_DOWN"), Color(0.6, 1, 0.6))
			_bubbles.say(e, tr("ARC_BOSS_LOSE"), 2.0, _head(e))
		elif _rng.randf() < _t.powerup_chance:
			_drop(e.position, ["rum", "sandwich", "pig"][_rng.randi() % 3])
		if _rng.randf() < 0.25:
			_bubbles.say(e, tr("ARC_ENEMY_HIT_%d" % _rng.randi_range(1, 4)), 1.0, _head(e))
	if _rules.multiplier() > 1 and _rules.combo % _t.combo_step == 0:
		_float_text(_panda.position + Vector2(0, -150), tr("ARC_COMBO") % _rules.multiplier(), Color(1, 0.85, 0.2), 34)


# --- Shooting ------------------------------------------------------------------------

func _tick_firing(delta: float) -> void:
	_fire_left -= delta
	if _fire_left > 0.0:
		return
	var target: ArcadeEnemy = null
	var best := _t.ball_range
	for e in _enemies:
		if e.dying:
			continue
		var d := e.position.distance_to(_panda.position)
		if d < best:
			best = d
			target = e
	if target == null:
		return
	_fire_left = _t.fire_interval / (_t.rum_fire_multiplier if _rum_left > 0.0 else 1.0)
	var lead := target.position + target.push * 0.1
	var dir := (lead - _panda.position).normalized()
	_balls.append({"pos": _panda.position, "vel": dir * _t.ball_speed, "life": _t.ball_range / _t.ball_speed})
	_panda.facing_left = dir.x < 0.0
	_sfx.play(&"shoot", 0.15)


func _tick_balls(delta: float) -> void:
	for b in _balls.duplicate():
		b["pos"] += b["vel"] * delta
		b["life"] -= delta
		var hit := false
		for e in _enemies:
			if not e.dying and (b["pos"] as Vector2).distance_to(e.position) < ArcadeEnemy.HIT_RADIUS:
				_damage(e, _t.ball_damage, b["vel"], _t.knockback)
				hit = true
				break
		if hit or b["life"] <= 0.0:
			_balls.erase(b)


func _tick_hostile(delta: float) -> void:
	for h in _hostile.duplicate():
		h["pos"] += h["vel"] * delta
		h["spin"] = float(h["spin"]) + delta * 9.0
		var p: Vector2 = h["pos"]
		if p.distance_to(_panda.position) < _t.touch_radius:
			_hurt_panda(p - (h["vel"] as Vector2))
			_hostile.erase(h)
		elif not Rect2(-200, 200, DESIGN.x + 400, 700).has_point(p):
			_hostile.erase(h)


# --- Pickups and power-ups -------------------------------------------------------------

func _drop(at: Vector2, kind: String) -> void:
	var vel := Vector2.from_angle(_rng.randf() * TAU) * _rng.randf_range(80.0, 220.0)
	_pickups.append({"pos": at, "vel": vel, "kind": kind, "life": 12.0})


func _tick_pickups(delta: float) -> void:
	for p in _pickups.duplicate():
		var pos: Vector2 = p["pos"]
		p["vel"] = (p["vel"] as Vector2).move_toward(Vector2.ZERO, 400.0 * delta)
		var d := pos.distance_to(_panda.position)
		if d < _t.coin_magnet:
			p["vel"] = (_panda.position - pos).normalized() * (700.0 - d * 2.0)
		p["pos"] = _clamp(pos + (p["vel"] as Vector2) * delta)
		p["life"] = float(p["life"]) - delta
		if d < 28.0:
			_collect(p)
			_pickups.erase(p)
		elif float(p["life"]) <= 0.0:
			_pickups.erase(p)


func _collect(p: Dictionary) -> void:
	match p["kind"]:
		"coin":
			var gained := _rules.collect_coin()
			_sfx.play(&"coin", 0.12)
			_float_text(_panda.position + Vector2(_rng.randf_range(-20, 20), -120), "+%d €" % gained, Color(1, 0.9, 0.3), 24)
		"rum":
			_rum_left = _t.rum_seconds
			_powerup_feedback(tr("ARC_RUM"))
		"sandwich":
			_rules.heal()
			_powerup_feedback(tr("ARC_SANDWICH"))
		"pig":
			_pig_left = _t.pig_seconds
			_powerup_feedback(tr("ARC_PIG"))


func _powerup_feedback(text: String) -> void:
	_sfx.play(&"power", 0.0)
	_burst(_panda.position + Vector2(0, -SHOT_HEIGHT), 20, Color(0.5, 1, 0.6))
	_bubbles.say(_panda, text, 1.6, _head(_panda))


func _tick_powerups(delta: float) -> void:
	_rum_left = maxf(0.0, _rum_left - delta)
	_pig_left = maxf(0.0, _pig_left - delta)
	if _pig_left <= 0.0:
		return
	_pig_angle += delta * 5.0
	var pig := _panda.position + Vector2.from_angle(_pig_angle) * _t.pig_radius
	for e in _enemies:
		if not e.dying and e.pig_cooldown <= 0.0 and e.position.distance_to(pig) < 46.0:
			e.pig_cooldown = 0.45
			_damage(e, _t.pig_damage, e.position - _panda.position, _t.knockback * 1.4)


func _tick_cous(delta: float) -> void:
	_cous_left -= delta
	if _cous_left > 0.0:
		return
	_cous_left = _t.cous_interval
	_cous.sleeping = false
	_bubbles.say(_cous, tr("ARC_COUS"), 2.0, _head(_cous))
	var kind: String = ["rum", "sandwich", "pig"][_rng.randi() % 3]
	_pickups.append({"pos": _cous.position + Vector2(0, 30), "vel": (_panda.position - _cous.position).normalized() * 420.0,
		"kind": kind, "life": 14.0})
	get_tree().create_timer(2.0).timeout.connect(func() -> void: _cous.sleeping = true)


# --- Babar ---------------------------------------------------------------------------

func _tick_babar(delta: float) -> void:
	if not _babar.visible:
		_babar_left -= delta
		if _babar_left <= 0.0:
			_babar_dir = 1.0 if _rng.randf() < 0.5 else -1.0
			_babar.position = Vector2(-80.0 if _babar_dir > 0.0 else DESIGN.x + 80.0, _panda.position.y + _rng.randf_range(-60, 60))
			_babar.position.y = clampf(_babar.position.y, ARENA.position.y, ARENA.end.y)
			_babar.visible = true
			_babar.facing_left = _babar_dir < 0.0
			_babar.walking = true
			_babar_spit_left = 0.5
			_bubbles.say(_babar, tr("ARC_BABAR"), 2.0, _head(_babar))
		return
	_babar.position.x += _babar_dir * _t.babar_speed * delta
	_babar_spit_left -= delta
	if _babar_spit_left <= 0.0:
		_babar_spit_left = 0.55
		var dir := (_panda.position - _babar.position).normalized()
		_hostile.append({"pos": _babar.position, "vel": dir * _t.spit_speed, "kind": "spit", "spin": 0.0})
	if _babar.position.x < -120.0 or _babar.position.x > DESIGN.x + 120.0:
		_babar.visible = false
		_babar_left = _t.babar_interval * _rng.randf_range(0.8, 1.3)


# --- HOHO ---------------------------------------------------------------------------

func _hoho() -> void:
	if _state != State.PLAYING or not _rules.use_hoho():
		return
	_sfx.play(&"hoho", 0.0)
	_shake = 26.0
	_rings.append({"pos": _panda.position, "radius": 10.0, "life": 0.5})
	_float_text(_panda.position + Vector2(0, -190), "HOHO !", Color(1, 1, 1), 64)
	_bubbles.say(_panda, "HOHO !", 1.4, _head(_panda))
	for e in _enemies:
		if not e.dying and e.position.distance_to(_panda.position) < _t.hoho_radius:
			e.stun_left = 1.4
			_damage(e, _t.hoho_damage, e.position - _panda.position, _t.knockback * 3.0)
	_hostile.clear()


# --- Effects ---------------------------------------------------------------------------

func _burst(at: Vector2, count: int, color: Color) -> void:
	for i in count:
		_particles.append({"pos": at, "vel": Vector2.from_angle(_rng.randf() * TAU) * _rng.randf_range(120, 420),
			"life": _rng.randf_range(0.35, 0.8), "color": CONFETTI[_rng.randi() % CONFETTI.size()] if i % 2 else color,
			"size": _rng.randf_range(3.0, 7.0)})


func _float_text(at: Vector2, text: String, color: Color, size: int) -> void:
	_texts.append({"pos": at, "text": text, "life": 1.0, "color": color, "size": size})


func _tick_effects(delta: float) -> void:
	for p in _particles.duplicate():
		p["vel"] = (p["vel"] as Vector2) * 0.9 + Vector2(0, 600) * delta
		p["pos"] += p["vel"] * delta
		p["life"] = float(p["life"]) - delta
		if float(p["life"]) <= 0.0:
			_particles.erase(p)
	for t in _texts.duplicate():
		t["pos"] += Vector2(0, -60) * delta
		t["life"] = float(t["life"]) - delta
		if float(t["life"]) <= 0.0:
			_texts.erase(t)
	for r in _rings.duplicate():
		r["radius"] = float(r["radius"]) + _t.hoho_radius * 2.0 * delta
		r["life"] = float(r["life"]) - delta
		if float(r["life"]) <= 0.0:
			_rings.erase(r)


func _tick_shake(delta: float) -> void:
	_shake = maxf(0.0, _shake - 60.0 * delta)
	_layout()
	if _shake > 0.0:
		_world.position += Vector2(_rng.randf_range(-_shake, _shake), _rng.randf_range(-_shake, _shake)) * _world.scale.x


func _paint_fx(c: CanvasItem) -> void:
	var ink := Color(0.12, 0.09, 0.08)
	var font := ThemeDB.fallback_font
	for p in _pickups:
		var pos: Vector2 = p["pos"]
		var bob := sin(_rules.elapsed * 6.0 + pos.x) * 4.0
		match p["kind"]:
			"coin":
				c.draw_circle(pos + Vector2(0, -14 + bob), 11, ink)
				c.draw_circle(pos + Vector2(0, -14 + bob), 9, Color(1, 0.82, 0.25))
				c.draw_string(font, pos + Vector2(-5, -9 + bob), "€", HORIZONTAL_ALIGNMENT_LEFT, -1, 14, Color(0.6, 0.4, 0.05))
			"rum":
				c.draw_rect(Rect2(pos + Vector2(-11, -40 + bob), Vector2(22, 30)), Color(0.85, 0.55, 0.2))
				c.draw_rect(Rect2(pos + Vector2(-11, -40 + bob), Vector2(22, 30)), ink, false, 3.0)
				c.draw_circle(pos + Vector2(11, -40 + bob), 7, Color(0.6, 0.85, 0.3))
			"sandwich":
				c.draw_rect(Rect2(pos + Vector2(-20, -30 + bob), Vector2(40, 8)), Color(0.9, 0.72, 0.4))
				c.draw_rect(Rect2(pos + Vector2(-20, -22 + bob), Vector2(40, 5)), Color(0.4, 0.75, 0.3))
				c.draw_rect(Rect2(pos + Vector2(-20, -17 + bob), Vector2(40, 8)), Color(0.9, 0.72, 0.4))
			"pig":
				c.draw_circle(pos + Vector2(0, -20 + bob), 15, ink)
				c.draw_circle(pos + Vector2(0, -20 + bob), 13, Color(0.95, 0.65, 0.35))
				c.draw_circle(pos + Vector2(-5, -24 + bob), 6, Color.WHITE)
	if _pig_left > 0.0:
		var pig := _panda.position + Vector2.from_angle(_pig_angle) * _t.pig_radius
		c.draw_circle(pig + Vector2(0, -30), 19, ink)
		c.draw_circle(pig + Vector2(0, -30), 17, Color(0.95, 0.65, 0.35))
		c.draw_circle(pig + Vector2(-6, -35), 7, Color.WHITE)
		c.draw_circle(pig + Vector2(8, -32), 2.5, ink)
	for b in _balls:
		var pos: Vector2 = b["pos"] + Vector2(0, -SHOT_HEIGHT)
		c.draw_circle(pos, 9, ink)
		c.draw_circle(pos, 7, Color(0.97, 0.97, 0.95))
		c.draw_line(pos + Vector2(-4, -2), pos + Vector2(3, 2), Color(0.6, 0.6, 0.65), 1.5)
	for h in _hostile:
		var pos: Vector2 = h["pos"] + Vector2(0, -SHOT_HEIGHT)
		if h["kind"] == "file":
			c.draw_set_transform(pos, float(h["spin"]))
			c.draw_rect(Rect2(-16, -11, 32, 22), Color(0.98, 0.96, 0.85))
			c.draw_rect(Rect2(-16, -11, 32, 22), ink, false, 2.5)
			c.draw_line(Vector2(-10, -3), Vector2(10, -3), Color(0.5, 0.5, 0.6), 2.0)
			c.draw_line(Vector2(-10, 3), Vector2(6, 3), Color(0.5, 0.5, 0.6), 2.0)
			c.draw_set_transform(Vector2.ZERO)
		else:
			c.draw_circle(pos, 9, Color(0.75, 0.9, 1.0, 0.9))
			c.draw_circle(pos + Vector2(-3, -3), 3, Color.WHITE)
	for r in _rings:
		var alpha := clampf(float(r["life"]) / 0.5, 0, 1)
		c.draw_arc(r["pos"], float(r["radius"]), 0, TAU, 48, Color(1, 0.95, 0.6, alpha), 10.0 * alpha + 2.0)
	for p in _particles:
		c.draw_rect(Rect2(p["pos"], Vector2.ONE * float(p["size"])), p["color"])
	for t in _texts:
		var size: int = t["size"]
		var col: Color = t["color"]
		col.a = clampf(float(t["life"]) * 1.5, 0, 1)
		var width := font.get_string_size(t["text"], HORIZONTAL_ALIGNMENT_LEFT, -1, size).x
		var at: Vector2 = t["pos"] - Vector2(width * 0.5, 0)
		c.draw_string_outline(font, at, t["text"], HORIZONTAL_ALIGNMENT_LEFT, -1, size, 8, Color(0, 0, 0, col.a))
		c.draw_string(font, at, t["text"], HORIZONTAL_ALIGNMENT_LEFT, -1, size, col)


# --- Input ----------------------------------------------------------------------------

func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed(GameInput.ACTION_PRIMARY):
		if _state == State.INTRO:
			_start()
		else:
			_hoho()
		return
	var button := event as InputEventMouseButton
	if button and button.button_index == MOUSE_BUTTON_LEFT:
		_stick_active = button.pressed and _state == State.PLAYING
		_stick_origin = button.position
		_stick_vector = Vector2.ZERO
		_hud["stick"].visible = _stick_active
		_hud["stick"].position = _stick_origin
		return
	var motion := event as InputEventMouseMotion
	if motion and _stick_active:
		var offset := motion.position - _stick_origin
		_stick_vector = offset.limit_length(STICK_RADIUS) / STICK_RADIUS
		(_hud["stick"] as StickView).knob = _stick_vector * STICK_RADIUS


# --- End states ----------------------------------------------------------------------

func _game_over() -> void:
	_state = State.OVER
	_panda.sleeping = true
	(_hud["over_text"] as Label).text = tr("ARC_OVER_TEXT") % [_rules.clock_text(), _rules.money, _rules.best_combo]
	_hud["over"].visible = true
	finished.emit(_rules.result(false))


func _win() -> void:
	_state = State.WON
	(_hud["win_text"] as Label).text = tr("ARC_WIN_TEXT") % [_rules.money, _rules.best_combo]
	_hud["win"].visible = true
	_burst(_panda.position + Vector2(0, -SHOT_HEIGHT), 80, Color(1, 0.9, 0.3))
	finished.emit(_rules.result(true))


# --- HUD ------------------------------------------------------------------------------

func _build_hud() -> void:
	var layer := CanvasLayer.new()
	add_child(layer)
	var root := Control.new()
	root.set_anchors_preset(Control.PRESET_FULL_RECT)
	root.mouse_filter = Control.MOUSE_FILTER_IGNORE
	layer.add_child(root)
	var band := ColorRect.new()
	band.color = Color(0.05, 0.07, 0.12, 0.6)
	band.set_anchors_and_offsets_preset(Control.PRESET_TOP_WIDE)
	band.offset_bottom = 96
	band.mouse_filter = Control.MOUSE_FILTER_IGNORE
	root.add_child(band)
	var top := HBoxContainer.new()
	top.set_anchors_and_offsets_preset(Control.PRESET_TOP_WIDE)
	top.offset_left = 16
	top.offset_right = -16
	top.offset_top = 8
	top.add_theme_constant_override("separation", 22)
	top.mouse_filter = Control.MOUSE_FILTER_IGNORE
	root.add_child(top)
	var left := VBoxContainer.new()
	left.mouse_filter = Control.MOUSE_FILTER_IGNORE
	top.add_child(left)
	_hud["clock"] = _label("08:00", 40, false)
	left.add_child(_hud["clock"])
	var hearts := HeartsBar.new()
	hearts.total = _t.hearts
	hearts.mouse_filter = Control.MOUSE_FILTER_IGNORE
	left.add_child(hearts)
	_hud["hearts"] = hearts
	var middle := VBoxContainer.new()
	middle.size_flags_horizontal = Control.SIZE_EXPAND | Control.SIZE_SHRINK_CENTER
	middle.custom_minimum_size = Vector2(360, 0)
	middle.mouse_filter = Control.MOUSE_FILTER_IGNORE
	top.add_child(middle)
	_hud["combo"] = _label("", 30, false)
	_hud["combo"].horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	middle.add_child(_hud["combo"])
	var meter := ProgressBar.new()
	meter.custom_minimum_size = Vector2(320, 20)
	meter.max_value = 1.0
	meter.show_percentage = false
	var fill := StyleBoxFlat.new()
	fill.bg_color = Color(1, 0.8, 0.2)
	fill.set_corner_radius_all(6)
	var back := StyleBoxFlat.new()
	back.bg_color = Color(0, 0, 0, 0.5)
	back.set_corner_radius_all(6)
	meter.add_theme_stylebox_override("fill", fill)
	meter.add_theme_stylebox_override("background", back)
	middle.add_child(meter)
	_hud["meter"] = meter
	var right := VBoxContainer.new()
	right.mouse_filter = Control.MOUSE_FILTER_IGNORE
	top.add_child(right)
	_hud["money"] = _label("0 €", 38, false)
	_hud["money"].horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	right.add_child(_hud["money"])
	var lang := _button("BTN_LANG", Vector2(140, 44), 22)
	lang.pressed.connect(Lang.toggle_locale)
	right.add_child(lang)

	var hoho := _button("ARC_HOHO_BTN", Vector2(220, 110), 40)
	hoho.set_anchors_and_offsets_preset(Control.PRESET_BOTTOM_RIGHT)
	hoho.grow_horizontal = Control.GROW_DIRECTION_BEGIN
	hoho.grow_vertical = Control.GROW_DIRECTION_BEGIN
	hoho.offset_right = -20
	hoho.offset_bottom = -20
	hoho.pressed.connect(_hoho)
	root.add_child(hoho)
	_hud["hoho"] = hoho

	_hud["hint"] = _label("ARC_HINT", 20)
	_hud["hint"].set_anchors_and_offsets_preset(Control.PRESET_BOTTOM_LEFT)
	_hud["hint"].position += Vector2(16, -40)
	root.add_child(_hud["hint"])

	_hud["banner"] = _label("", 52, false)
	_hud["banner"].set_anchors_and_offsets_preset(Control.PRESET_CENTER_TOP)
	_hud["banner"].grow_horizontal = Control.GROW_DIRECTION_BOTH
	_hud["banner"].horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	_hud["banner"].position.y += 120
	_hud["banner"].visible = false
	root.add_child(_hud["banner"])

	var stick := StickView.new()
	stick.visible = false
	stick.mouse_filter = Control.MOUSE_FILTER_IGNORE
	root.add_child(stick)
	_hud["stick"] = stick

	_hud["intro"] = _overlay(root, "ARC_TITLE", ["ARC_INTRO", "ARC_HOWTO"], "BTN_START", _start)
	var over := _overlay(root, "CAUGHT_TITLE", [], "BTN_RETRY", _retry)
	_hud["over_text"] = _insert_text(over)
	_hud["over"] = over
	var win := _overlay(root, "WIN_TITLE", [], "BTN_REPLAY", _retry)
	_hud["win_text"] = _insert_text(win)
	_hud["win"] = win


func _insert_text(overlay: Control) -> Label:
	var box: VBoxContainer = overlay.get_child(0).get_child(0)
	var text := _label("", 28, false)
	text.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	box.add_child(text)
	box.move_child(text, 1)
	return text


func _overlay(root: Control, title: String, lines: Array, button: String, action: Callable) -> Control:
	var shade := ColorRect.new()
	shade.color = Color(0.05, 0.06, 0.1, 0.8)
	shade.set_anchors_preset(Control.PRESET_FULL_RECT)
	shade.visible = false
	root.add_child(shade)
	var center := CenterContainer.new()
	center.set_anchors_preset(Control.PRESET_FULL_RECT)
	shade.add_child(center)
	var box := VBoxContainer.new()
	box.add_theme_constant_override("separation", 16)
	box.custom_minimum_size = Vector2(680, 0)
	center.add_child(box)
	var t := _label(title, 60)
	t.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	box.add_child(t)
	for key: String in lines:
		var l := _label(key, 25)
		l.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		l.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		box.add_child(l)
	var b := _button(button, Vector2(340, 86), 32)
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
	l.add_theme_constant_override("outline_size", 10)
	l.mouse_filter = Control.MOUSE_FILTER_IGNORE
	return l


func _button(key: String, min_size: Vector2, font_size: int) -> Button:
	var b := Button.new()
	b.text = key
	b.custom_minimum_size = min_size
	b.add_theme_font_size_override("font_size", font_size)
	b.focus_mode = Control.FOCUS_NONE
	return b


func _banner(text: String, color: Color) -> void:
	var b: Label = _hud["banner"]
	b.text = text
	b.add_theme_color_override("font_color", color)
	b.visible = true
	_banner_left = 2.2


func _update_hud(delta: float) -> void:
	(_hud["clock"] as Label).text = _rules.clock_text()
	(_hud["hearts"] as HeartsBar).filled = _rules.hearts
	(_hud["money"] as Label).text = "%d €" % _rules.money
	(_hud["meter"] as ProgressBar).value = _rules.hoho
	var combo: Label = _hud["combo"]
	combo.text = (tr("ARC_COMBO") % _rules.multiplier()) + "  (%d)" % _rules.combo if _rules.combo > 1 else ""
	var hoho: Button = _hud["hoho"]
	hoho.disabled = not _rules.hoho_ready()
	hoho.modulate = Color(1, 1, 1) if _rules.hoho_ready() else Color(1, 1, 1, 0.5)
	if _rules.hoho_ready():
		hoho.scale = Vector2.ONE * (1.0 + sin(_rules.elapsed * 10.0) * 0.04)
	_hud["hint"].visible = _rules.elapsed < 8.0
	if _banner_left > 0.0:
		_banner_left -= delta
		(_hud["banner"] as Label).visible = _banner_left > 0.0
