extends SceneTree
## Story 004 logic tests: suspicion, detection cone, clock, pay, promotions.
## Runs without gdUnit4 (not installed yet):
##   godot --headless --path . -s res://tests/unit/work-scene/work_scene_detection_test.gd
## Exits 1 on any failure.

var _failures := 0
var _checks := 0


func _init() -> void:
	_test_seen_while_slacking_raises_suspicion()
	_test_desk_and_faking_block_gain()
	_test_suspicion_is_clamped_and_caught()
	_test_cone_range_and_angle()
	_test_clock_runs_from_start_to_end()
	_test_promotion_needs_low_suspicion()
	_test_pay_grows_with_rank()
	_test_laziness_only_while_slacking()
	print("%d checks, %d failures" % [_checks, _failures])
	quit(1 if _failures > 0 else 0)


## Fixture: a tuning with round numbers so expectations are easy to read.
func _make_tuning() -> WorkTuning:
	var t := WorkTuning.new()
	t.day_seconds = 70.0          # 10 real seconds per in-game hour
	t.start_hour = 8.0
	t.end_hour = 15.0
	t.suspicion_max = 100.0
	t.suspicion_gain_per_second = 40.0
	t.suspicion_decay_per_second = 5.0
	t.suspicion_desk_decay_per_second = 10.0
	t.base_pay_per_hour = 20.0
	t.pay_multiplier_per_rank = 2.0
	t.promotion_hours = PackedFloat32Array([10.0, 12.0, 14.0])
	t.promotion_max_suspicion = 50.0
	t.laziness_per_second = 10.0
	return t


func _test_seen_while_slacking_raises_suspicion() -> void:
	var s := SuspicionModel.new(_make_tuning())
	s.tick(1.0, 1.0, false, false)
	_check(is_equal_approx(s.value, 40.0), "seen 1s at weight 1 -> 40")
	s.tick(1.0, 0.5, false, false)
	_check(is_equal_approx(s.value, 60.0), "weight 0.5 adds half")
	s.tick(2.0, 0.0, false, false)
	_check(is_equal_approx(s.value, 50.0), "unseen decays at 5/s")


func _test_desk_and_faking_block_gain() -> void:
	var s := SuspicionModel.new(_make_tuning())
	s.add(30.0)
	s.tick(1.0, 1.0, true, false)
	_check(is_equal_approx(s.value, 20.0), "seen at desk: no gain, desk decay")
	s.tick(1.0, 1.0, false, true)
	_check(is_equal_approx(s.value, 15.0), "seen while faking: no gain")


func _test_suspicion_is_clamped_and_caught() -> void:
	var s := SuspicionModel.new(_make_tuning())
	s.tick(10.0, 2.0, false, false)
	_check(is_equal_approx(s.value, 100.0), "clamped at max")
	_check(s.is_caught(), "max means caught")
	s.add(-500.0)
	_check(is_zero_approx(s.value), "never below zero")


func _test_cone_range_and_angle() -> void:
	var half := deg_to_rad(30.0)
	_check(SuspicionModel.can_see(Vector2.ZERO, Vector2.RIGHT, Vector2(100, 0), 200.0, half), "straight ahead")
	_check(not SuspicionModel.can_see(Vector2.ZERO, Vector2.RIGHT, Vector2(300, 0), 200.0, half), "out of range")
	_check(not SuspicionModel.can_see(Vector2.ZERO, Vector2.RIGHT, Vector2(-100, 0), 200.0, half), "behind")
	_check(SuspicionModel.can_see(Vector2.ZERO, Vector2.RIGHT, Vector2(100, 50), 200.0, half), "inside 30 deg (26.6)")
	_check(not SuspicionModel.can_see(Vector2.ZERO, Vector2.RIGHT, Vector2(100, 70), 200.0, half), "outside 30 deg (35)")


func _test_clock_runs_from_start_to_end() -> void:
	var d := WorkDayModel.new(_make_tuning())
	_check(d.clock_text() == "08:00", "starts at 08:00")
	d.tick(15.0, 0.0, 0.0)
	_check(d.clock_text() == "09:30", "15s later is 09:30")
	d.tick(100.0, 0.0, 0.0)
	_check(d.clock_text() == "15:00" and d.is_over(), "ends at 15:00")


func _test_promotion_needs_low_suspicion() -> void:
	var d := WorkDayModel.new(_make_tuning())
	_check(not d.tick(19.0, 1.0, 0.0), "no review before 10:00")
	_check(d.tick(1.0, 1.0, 50.0), "review at 10:00, suspicion at limit -> promoted")
	_check(d.rank == 1, "rank 1")
	_check(not d.tick(20.0, 1.0, 80.0), "12:00 review fails when suspicious")
	_check(d.rank == 1, "still rank 1, review consumed")
	_check(d.tick(20.0, 1.0, 0.0), "14:00 review passes")
	_check(d.rank == 2, "rank 2")


func _test_pay_grows_with_rank() -> void:
	var d := WorkDayModel.new(_make_tuning())
	d.tick(10.0, 0.0, 100.0)
	_check(is_equal_approx(d.money, 20.0), "one hour at rank 0 pays 20")
	d.rank = 1
	d.tick(10.0, 0.0, 100.0)
	_check(is_equal_approx(d.money, 60.0), "next hour at rank 1 pays 40")


func _test_laziness_only_while_slacking() -> void:
	var d := WorkDayModel.new(_make_tuning())
	d.tick(2.0, 0.0, 0.0)
	_check(is_zero_approx(d.laziness), "working earns no laziness")
	d.tick(2.0, 3.0, 0.0)
	_check(is_equal_approx(d.laziness, 60.0), "nap x3 for 2s -> 60")
	var r := d.result(true)
	_check(r["success"] and r["laziness"] == 60 and r.has("money") and r.has("promotions"), "result contract")


func _check(condition: bool, label: String) -> void:
	_checks += 1
	if not condition:
		_failures += 1
		printerr("FAIL: " + label)
