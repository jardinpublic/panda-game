class_name SuspicionModel
extends RefCounted
## Suspicion rules for the work scene. No node dependencies, so it can be
## tested without a scene tree.
##
## Example:
##     var model := SuspicionModel.new(tuning)
##     model.tick(delta, seen_weight, at_desk, faking)
##     if model.is_caught(): ...

var value := 0.0
var _tuning: WorkTuning


func _init(tuning: WorkTuning) -> void:
	_tuning = tuning


## Advances suspicion by one frame.
## [param seen_weight] is the summed weight of watchers that see Panda now.
## Being seen counts only while he slacks: not at his desk and not faking.
func tick(delta: float, seen_weight: float, at_desk: bool, faking: bool) -> void:
	if seen_weight > 0.0 and not at_desk and not faking:
		value += _tuning.suspicion_gain_per_second * seen_weight * delta
	else:
		var decay := _tuning.suspicion_desk_decay_per_second if at_desk \
			else _tuning.suspicion_decay_per_second
		value -= decay * delta
	value = clampf(value, 0.0, _tuning.suspicion_max)


## Adds or removes a fixed amount (Babar's noise, the empty-desk check).
func add(amount: float) -> void:
	value = clampf(value + amount, 0.0, _tuning.suspicion_max)


func ratio() -> float:
	return value / _tuning.suspicion_max


func is_caught() -> bool:
	return value >= _tuning.suspicion_max


## True when [param target] is inside a watcher's view cone.
## [param facing] does not need to be normalised.
static func can_see(watcher: Vector2, facing: Vector2, target: Vector2,
		view_range: float, half_angle: float) -> bool:
	var to_target := target - watcher
	var distance := to_target.length()
	if distance > view_range:
		return false
	if distance < 1.0:
		return true
	return absf(facing.angle_to(to_target)) <= half_angle
