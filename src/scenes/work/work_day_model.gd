class_name WorkDayModel
extends RefCounted
## Clock, pay, promotions and laziness for the work scene. No node
## dependencies, so it can be tested without a scene tree.
##
## Example:
##     var day := WorkDayModel.new(tuning)
##     if day.tick(delta, slack_multiplier, suspicion.value):
##         show_promotion(day.rank)

const MAX_RANK := 3

var elapsed := 0.0
var rank := 0
var money := 0.0
var laziness := 0.0
var _next_review := 0
var _tuning: WorkTuning


func _init(tuning: WorkTuning) -> void:
	_tuning = tuning


## In-game hour as a decimal (8.5 = 8:30).
func hour() -> float:
	var span := _tuning.end_hour - _tuning.start_hour
	return _tuning.start_hour + span * minf(elapsed / _tuning.day_seconds, 1.0)


func clock_text() -> String:
	var h := hour()
	return "%02d:%02d" % [int(h), int(fmod(h, 1.0) * 60.0)]


func pay_per_hour() -> float:
	return _tuning.base_pay_per_hour * pow(_tuning.pay_multiplier_per_rank, rank)


## Advances the day. [param slack_multiplier] is 0 while working at the desk.
## Returns true when a promotion happened this frame.
func tick(delta: float, slack_multiplier: float, suspicion: float) -> bool:
	if is_over():
		return false
	var hours_before := hour()
	elapsed = minf(elapsed + delta, _tuning.day_seconds)
	money += pay_per_hour() * (hour() - hours_before)
	laziness += _tuning.laziness_per_second * slack_multiplier * delta
	return _review_promotion(suspicion)


## How many promotion reviews have happened so far (passed or missed).
func reviews_done() -> int:
	return _next_review


func is_over() -> bool:
	return elapsed >= _tuning.day_seconds


## The scene result handed to the day shell (story 005).
func result(success: bool) -> Dictionary:
	return {
		"success": success,
		"money": roundi(money),
		"promotions": rank,
		"laziness": roundi(laziness),
	}


func _review_promotion(suspicion: float) -> bool:
	if _next_review >= _tuning.promotion_hours.size():
		return false
	if hour() < _tuning.promotion_hours[_next_review]:
		return false
	_next_review += 1
	if suspicion <= _tuning.promotion_max_suspicion and rank < MAX_RANK:
		rank += 1
		return true
	return false
