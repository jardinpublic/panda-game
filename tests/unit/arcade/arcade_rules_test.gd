extends SceneTree
## Office arcade rules: clock, combo, multiplier, coins, HOHO meter, hearts.
## Run: godot --headless --path . -s res://tests/unit/arcade/arcade_rules_test.gd

var _failures := 0
var _checks := 0


func _init() -> void:
	_test_clock_runs_8_to_15()
	_test_combo_builds_multiplier_and_expires()
	_test_coins_use_multiplier()
	_test_hoho_fills_and_spends()
	_test_hurt_has_invulnerability_and_game_over()
	_test_heal_caps_at_max()
	print("%d checks, %d failures" % [_checks, _failures])
	quit(1 if _failures > 0 else 0)


func _make_tuning() -> ArcadeTuning:
	var t := ArcadeTuning.new()
	t.seconds_per_hour = 10.0
	t.start_hour = 8
	t.end_hour = 15
	t.combo_window = 1.0
	t.combo_step = 5
	t.combo_max_multiplier = 3
	t.coin_value = 5
	t.hoho_per_hit = 0.25
	t.hearts = 3
	t.invulnerable_seconds = 1.0
	return t


func _test_clock_runs_8_to_15() -> void:
	var r := ArcadeRules.new(_make_tuning())
	_check(r.clock_text() == "08:00" and r.hour() == 8, "starts 08:00")
	r.tick(25.0)
	_check(r.clock_text() == "10:30" and r.hour_index() == 2, "25 s later is 10:30, index 2")
	r.tick(45.0)
	_check(r.is_day_over() and r.clock_text() == "15:00", "ends at 15:00")


func _test_combo_builds_multiplier_and_expires() -> void:
	var r := ArcadeRules.new(_make_tuning())
	for i in 5:
		r.register_hit()
	_check(r.combo == 5 and r.multiplier() == 2, "5 hits -> x2")
	for i in 20:
		r.register_hit()
	_check(r.multiplier() == 3, "multiplier capped at 3")
	r.tick(1.1)
	_check(r.combo == 0 and r.multiplier() == 1, "combo expires after the window")
	_check(r.best_combo == 25, "best combo kept")


func _test_coins_use_multiplier() -> void:
	var r := ArcadeRules.new(_make_tuning())
	_check(r.collect_coin() == 5, "coin worth 5 at x1")
	for i in 5:
		r.register_hit()
	_check(r.collect_coin() == 10 and r.money == 15, "coin worth 10 at x2, total 15")


func _test_hoho_fills_and_spends() -> void:
	var r := ArcadeRules.new(_make_tuning())
	_check(not r.use_hoho(), "cannot use empty meter")
	for i in 4:
		r.register_hit()
	_check(r.hoho_ready() and r.use_hoho() and is_zero_approx(r.hoho), "4 hits fill it, using empties it")


func _test_hurt_has_invulnerability_and_game_over() -> void:
	var r := ArcadeRules.new(_make_tuning())
	r.register_hit()
	_check(not r.hurt() and r.hearts == 2 and r.combo == 0, "first hit: 2 hearts left, combo reset")
	_check(not r.hurt() and r.hearts == 2, "invulnerable right after")
	r.tick(1.1)
	r.hurt()
	r.tick(1.1)
	_check(r.hurt() and r.hearts == 0, "third hit ends the game")


func _test_heal_caps_at_max() -> void:
	var r := ArcadeRules.new(_make_tuning())
	r.heal()
	_check(r.hearts == 3, "heal never exceeds max")
	r.hurt()
	r.heal()
	_check(r.hearts == 3, "heal restores one")


func _check(condition: bool, label: String) -> void:
	_checks += 1
	if not condition:
		_failures += 1
		printerr("FAIL: " + label)
