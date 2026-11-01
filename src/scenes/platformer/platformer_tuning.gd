class_name PlatformerTuning
extends Resource
## Every number of the platformer. Edit platformer_tuning.tres, never the code.

@export_group("Run")
@export var run_speed := 400.0
@export var ground_accel := 2600.0
@export var ground_decel := 3200.0
@export var air_accel := 1800.0
@export var air_decel := 900.0

@export_group("Jump")
@export var gravity := 2300.0
## Extra gravity when falling, for snappy arcs.
@export var fall_gravity_multiplier := 1.35
@export var jump_velocity := 920.0
## Fraction of upward speed kept when the jump button is released early.
@export var jump_cut := 0.45
@export var max_fall_speed := 1500.0
## Seconds after leaving a ledge during which a jump still works.
@export var coyote_time := 0.1
## Seconds a jump press is remembered before landing.
@export var jump_buffer := 0.13
@export var stomp_bounce := 720.0
@export var spring_velocity := 1450.0

@export_group("Life")
@export var hearts := 5
@export var invulnerable_seconds := 1.4
@export var hurt_knockback := Vector2(560, -560)
@export var fall_limit_y := 900.0

@export_group("Enemies")
@export var walker_speed := 90.0
@export var runner_speed := 230.0
@export var crab_speed := 110.0
@export var spit_interval := 1.7
@export var spit_speed := 430.0

@export_group("Pickups")
@export var coin_value := 1
@export var rum_seconds := 7.0
@export var rum_speed_multiplier := 1.4
