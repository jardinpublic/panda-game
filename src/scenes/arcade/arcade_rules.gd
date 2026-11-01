class_name ArcadeRules
extends RefCounted
## Score, combo, HOHO meter, hearts and the day clock for the office arcade.
## No node dependencies, so it is testable without a scene tree.
##
## Example:
##     var rules := ArcadeRules.new(tuning)
##     rules.register_hit()          # a paper ball connected
##     var gained := rules.collect_coin()
##     if rules.hurt(): game_over()

var elapsed := 0.0
var money := 0
var hearts := 0
var combo := 0
var best_combo := 0
var hoho := 0.0
var _combo_left := 0.0
var _invulnerable_left := 0.0
var _t: ArcadeTuning


func _init(tuning: ArcadeTuning) -> void:
	_t = tuning
	hearts = tuning.hearts


func tick(delta: float) -> void:
	elapsed += delta
	_invulnerable_left = maxf(0.0, _invulnerable_left - delta)
	if combo > 0:
		_combo_left -= delta
		if _combo_left <= 0.0:
			combo = 0


## In-game hour as a whole number (8..15).
func hour() -> int:
	return mini(_t.start_hour + int(elapsed / _t.seconds_per_hour), _t.end_hour)


func clock_text() -> String:
	var total_minutes := int(elapsed / _t.seconds_per_hour * 60.0)
	var h := mini(_t.start_hour + total_minutes / 60, _t.end_hour)
	var m := 0 if h == _t.end_hour else total_minutes % 60
	return "%02d:%02d" % [h, m]


## Index into the per-hour tables (0 at 8h).
func hour_index() -> int:
	return clampi(hour() - _t.start_hour, 0, _t.spawn_interval.size() - 1)


func is_day_over() -> bool:
	return elapsed >= _t.seconds_per_hour * (_t.end_hour - _t.start_hour)


func multiplier() -> int:
	return mini(1 + combo / _t.combo_step, _t.combo_max_multiplier)


## A paper ball (or HOHO, or the guinea pig) hit an enemy.
func register_hit() -> void:
	combo += 1
	best_combo = maxi(best_combo, combo)
	_combo_left = _t.combo_window
	hoho = minf(1.0, hoho + _t.hoho_per_hit)


## Picks up a coin; returns the euros gained (value times multiplier).
func collect_coin() -> int:
	var gained := _t.coin_value * multiplier()
	money += gained
	return gained


func hoho_ready() -> bool:
	return hoho >= 1.0


## Spends the HOHO meter. Returns false if it was not full.
func use_hoho() -> bool:
	if not hoho_ready():
		return false
	hoho = 0.0
	return true


func is_invulnerable() -> bool:
	return _invulnerable_left > 0.0


## Panda takes a file. Returns true when that was the last heart.
func hurt() -> bool:
	if is_invulnerable() or hearts <= 0:
		return false
	hearts -= 1
	combo = 0
	_invulnerable_left = _t.invulnerable_seconds
	return hearts <= 0


func heal() -> void:
	hearts = mini(hearts + 1, _t.hearts)


func result(success: bool) -> Dictionary:
	return {"success": success, "money": money, "promotions": best_combo / 10, "best_combo": best_combo}
