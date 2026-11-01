class_name JumpModel
extends RefCounted
## Platformer movement maths: acceleration, gravity, coyote time, jump buffer
## and variable jump height. Pure functions of input and state, so they are
## unit-testable; the player body just applies the result.
##
## Example:
##     velocity = model.step(delta, velocity, input_x, on_floor, jump_pressed, jump_held)

var _t: PlatformerTuning
var _coyote_left := 0.0
var _buffer_left := 0.0
## A jump started by the player can be cut once by releasing the button.
var _can_cut := false
## Speed multiplier (rum power-up).
var speed_multiplier := 1.0
## True on the frame a jump starts.
var jumped := false


func _init(tuning: PlatformerTuning) -> void:
	_t = tuning


func step(delta: float, velocity: Vector2, input_x: float, on_floor: bool,
		jump_pressed: bool, jump_held: bool) -> Vector2:
	jumped = false
	# Horizontal: accelerate towards the target speed, brake faster than you speed up.
	var target := input_x * _t.run_speed * speed_multiplier
	var accel: float
	if on_floor:
		accel = _t.ground_accel if absf(target) > 1.0 else _t.ground_decel
	else:
		accel = _t.air_accel if absf(target) > 1.0 else _t.air_decel
	velocity.x = move_toward(velocity.x, target, accel * delta)

	# Coyote time and jump buffer.
	_coyote_left = _t.coyote_time if on_floor else maxf(0.0, _coyote_left - delta)
	_buffer_left = _t.jump_buffer if jump_pressed else maxf(0.0, _buffer_left - delta)
	if _buffer_left > 0.0 and _coyote_left > 0.0:
		velocity.y = -_t.jump_velocity
		_buffer_left = 0.0
		_coyote_left = 0.0
		_can_cut = true
		jumped = true
	elif on_floor and velocity.y >= 0.0:
		velocity.y = 40.0  # small push keeps the body snapped to the floor
		_can_cut = false
	else:
		# Variable height: releasing early cuts the rise, once.
		if velocity.y < 0.0 and not jump_held and _can_cut:
			velocity.y *= _t.jump_cut
			_can_cut = false
		var g := _t.gravity * (_t.fall_gravity_multiplier if velocity.y > 0.0 else 1.0)
		velocity.y = minf(velocity.y + g * delta, _t.max_fall_speed)
	return velocity


## Launches upwards (stomp bounce or spring) and cancels any pending jump.
func launch(velocity: Vector2, strength: float) -> Vector2:
	_coyote_left = 0.0
	_buffer_left = 0.0
	_can_cut = false
	velocity.y = -strength
	return velocity
