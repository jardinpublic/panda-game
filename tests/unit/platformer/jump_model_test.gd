extends SceneTree
## Platformer movement: acceleration, coyote time, jump buffer, jump cut, fall cap.
## Run: godot --headless --path . -s res://tests/unit/platformer/jump_model_test.gd

var _failures := 0
var _checks := 0
const DT := 1.0 / 60.0


func _init() -> void:
	_test_accelerates_to_run_speed()
	_test_jump_from_floor()
	_test_coyote_time_allows_late_jump()
	_test_coyote_time_expires()
	_test_jump_buffer_fires_on_landing()
	_test_releasing_cuts_the_jump()
	_test_fall_speed_is_capped()
	print("%d checks, %d failures" % [_checks, _failures])
	quit(1 if _failures > 0 else 0)


func _make() -> JumpModel:
	var t := PlatformerTuning.new()
	t.run_speed = 400.0
	t.ground_accel = 2400.0
	t.gravity = 2400.0
	t.fall_gravity_multiplier = 1.0
	t.jump_velocity = 900.0
	t.jump_cut = 0.5
	t.max_fall_speed = 1000.0
	t.coyote_time = 0.1
	t.jump_buffer = 0.1
	return JumpModel.new(t)


func _test_accelerates_to_run_speed() -> void:
	var m := _make()
	var v := Vector2.ZERO
	v = m.step(DT, v, 1.0, true, false, false)
	_check(is_equal_approx(v.x, 40.0), "one frame at 2400/s^2 gives 40")
	for i in 30:
		v = m.step(DT, v, 1.0, true, false, false)
	_check(is_equal_approx(v.x, 400.0), "caps at run speed")


func _test_jump_from_floor() -> void:
	var m := _make()
	var v := m.step(DT, Vector2.ZERO, 0.0, true, true, true)
	_check(is_equal_approx(v.y, -900.0) and m.jumped, "jump sets -900 and flags it")


func _test_coyote_time_allows_late_jump() -> void:
	var m := _make()
	m.step(DT, Vector2.ZERO, 0.0, true, false, false)
	var v := m.step(DT * 3, Vector2.ZERO, 0.0, false, false, false)   # 0.05 s off the ledge
	v = m.step(DT, v, 0.0, false, true, true)
	_check(m.jumped, "jump 0.05 s after leaving the ledge still works")


func _test_coyote_time_expires() -> void:
	var m := _make()
	m.step(DT, Vector2.ZERO, 0.0, true, false, false)
	m.step(0.15, Vector2.ZERO, 0.0, false, false, false)
	m.step(DT, Vector2.ZERO, 0.0, false, true, true)
	_check(not m.jumped, "no jump 0.15 s after leaving the ledge")


func _test_jump_buffer_fires_on_landing() -> void:
	var m := _make()
	m.step(DT, Vector2(0, 300), 0.0, false, true, true)    # pressed in the air
	m.step(DT * 2, Vector2(0, 300), 0.0, false, false, true)
	var v := m.step(DT, Vector2.ZERO, 0.0, true, false, true)  # lands 0.05 s later
	_check(m.jumped and v.y < 0.0, "buffered jump fires on landing")


func _test_releasing_cuts_the_jump() -> void:
	var m := _make()
	var v := m.step(DT, Vector2.ZERO, 0.0, true, true, true)        # jump: -900
	v = m.step(DT, v, 0.0, false, false, false)                       # release
	_check(v.y > -900.0 * 0.5 and v.y < 0.0, "release halves the rise speed (then gravity)")
	var before := v.y
	v = m.step(DT, v, 0.0, false, false, false)
	_check(v.y > before and v.y < before * 0.6, "cut applies once, not every frame (a second cut would halve it again)")
	var b := _make()
	var w := b.launch(Vector2.ZERO, 1400.0)
	w = b.step(DT, w, 0.0, true, false, false)
	_check(w.y < -1300.0, "spring launch survives the next step, no cut")


func _test_fall_speed_is_capped() -> void:
	var m := _make()
	var v := Vector2(0, 990)
	for i in 30:
		v = m.step(DT, v, 0.0, false, false, false)
	_check(is_equal_approx(v.y, 1000.0), "fall capped at 1000")


func _check(condition: bool, label: String) -> void:
	_checks += 1
	if not condition:
		_failures += 1
		printerr("FAIL: " + label)
