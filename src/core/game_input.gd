extends Node
## Shared input layer (autoload "GameInput").
##
## Scenes read game actions from here, never raw devices. Keyboard, mouse and
## touch all map to the same actions; touch is first-class. A touch also emits
## an emulated mouse click (project setting emulate_mouse_from_touch), so taps
## and clicks share one code path.

## Emitted on a tap or left click that no UI control consumed.
signal pointer_tapped(screen_position: Vector2)
## Emitted once, on the first key, click or tap. Browsers only allow audio
## after a user gesture, so sound starts from here.
signal first_interaction

const ACTION_MOVE_LEFT := &"move_left"
const ACTION_MOVE_RIGHT := &"move_right"
const ACTION_MOVE_UP := &"move_up"
const ACTION_MOVE_DOWN := &"move_down"
const ACTION_PRIMARY := &"action_primary"
const ACTION_SECONDARY := &"action_secondary"
const ACTION_PAUSE := &"pause"

## Default bindings by physical key position, so WASD lands on ZQSD on a
## French AZERTY keyboard without a separate layout.
const DEFAULT_KEYS := {
	ACTION_MOVE_LEFT: [KEY_A, KEY_LEFT],
	ACTION_MOVE_RIGHT: [KEY_D, KEY_RIGHT],
	ACTION_MOVE_UP: [KEY_W, KEY_UP],
	ACTION_MOVE_DOWN: [KEY_S, KEY_DOWN],
	ACTION_PRIMARY: [KEY_SPACE, KEY_ENTER],
	ACTION_SECONDARY: [KEY_E, KEY_SHIFT],
	ACTION_PAUSE: [KEY_ESCAPE],
}

var _had_interaction := false


func _ready() -> void:
	register_default_actions()


## Adds the default bindings to the InputMap. Safe to call twice.
static func register_default_actions() -> void:
	for action: StringName in DEFAULT_KEYS:
		if not InputMap.has_action(action):
			InputMap.add_action(action)
		for keycode: Key in DEFAULT_KEYS[action]:
			var event := build_key_event(keycode)
			if not InputMap.action_has_event(action, event):
				InputMap.action_add_event(action, event)


## Returns a key event bound by physical position.
static func build_key_event(keycode: Key) -> InputEventKey:
	var event := InputEventKey.new()
	event.physical_keycode = keycode
	return event


## Movement from the keyboard as a vector of length 0..1.
func get_move_vector() -> Vector2:
	return Input.get_vector(ACTION_MOVE_LEFT, ACTION_MOVE_RIGHT, ACTION_MOVE_UP, ACTION_MOVE_DOWN)


## True once the player has pressed, clicked or tapped anything.
func has_had_interaction() -> bool:
	return _had_interaction


func _input(event: InputEvent) -> void:
	if _had_interaction:
		return
	var is_gesture: bool = (event is InputEventKey and event.pressed) \
		or (event is InputEventMouseButton and event.pressed) \
		or (event is InputEventScreenTouch and event.pressed)
	if is_gesture:
		_had_interaction = true
		first_interaction.emit()


func _unhandled_input(event: InputEvent) -> void:
	var mouse_event := event as InputEventMouseButton
	if mouse_event and mouse_event.pressed and mouse_event.button_index == MOUSE_BUTTON_LEFT:
		pointer_tapped.emit(mouse_event.position)
