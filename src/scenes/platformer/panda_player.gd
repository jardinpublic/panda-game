class_name PandaPlayer
extends CharacterBody2D
## Panda as a platformer hero: runs, jumps, squashes and stretches.
## Movement maths live in [JumpModel]; this body applies them and animates.
## Origin at the feet.

const BODY_SIZE := Vector2(44, 96)
const FIGURE_SCALE := 0.48

var model: JumpModel
var figure: Caricature
var facing := 1.0
## Set on the frame Panda lands, for dust effects.
var landed := false
var _squash := Vector2.ONE
var _was_on_floor := true


func setup(tuning: PlatformerTuning) -> void:
	model = JumpModel.new(tuning)
	var shape := CollisionShape2D.new()
	var box := RectangleShape2D.new()
	box.size = BODY_SIZE
	shape.shape = box
	shape.position = Vector2(0, -BODY_SIZE.y * 0.5)
	add_child(shape)
	figure = Caricature.new()
	figure.look = CastLooks.get_look(CastLooks.PANDA)
	figure.scale = Vector2(FIGURE_SCALE, FIGURE_SCALE)
	add_child(figure)
	floor_snap_length = 12.0


## One physics step. Returns true if a jump started.
func run(delta: float, input_x: float, jump_pressed: bool, jump_held: bool) -> bool:
	velocity = model.step(delta, velocity, input_x, is_on_floor(), jump_pressed, jump_held)
	var jumped := model.jumped
	move_and_slide()
	landed = is_on_floor() and not _was_on_floor
	_was_on_floor = is_on_floor()
	if jumped:
		_squash = Vector2(0.78, 1.25)
	elif landed:
		_squash = Vector2(1.3, 0.75)
	_squash = _squash.lerp(Vector2.ONE, minf(1.0, delta * 12.0))
	if absf(input_x) > 0.1:
		facing = signf(input_x)
	figure.facing_left = facing < 0.0
	figure.walking = is_on_floor() and absf(velocity.x) > 30.0
	var s := FIGURE_SCALE
	figure.scale = Vector2(s * _squash.x * (-1.0 if facing < 0.0 else 1.0), s * _squash.y)
	figure.rotation = 0.0 if is_on_floor() else clampf(velocity.x / 4000.0, -0.12, 0.12)
	return jumped


## Bounces upwards (stomp or spring).
func launch(strength: float) -> void:
	velocity = model.launch(velocity, strength)
	_squash = Vector2(0.75, 1.3)


## Body rectangle in world space.
func body_rect() -> Rect2:
	return Rect2(global_position - Vector2(BODY_SIZE.x * 0.5, BODY_SIZE.y), BODY_SIZE)
