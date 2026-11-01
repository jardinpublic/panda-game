class_name FxCanvas
extends Node2D
## Drawing surface for projectiles, pickups, particles and floating text.
## The arcade scene owns the data and draws through [member painter].

## Called as painter.call(self) during this node's draw.
var painter: Callable


func _process(_delta: float) -> void:
	queue_redraw()


func _draw() -> void:
	if painter.is_valid():
		painter.call(self)
