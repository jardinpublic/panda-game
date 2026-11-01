class_name ArcadeTuning
extends Resource
## Every number of the office arcade. Edit arcade_tuning.tres, never the code.

@export_group("Day and waves")
## Real seconds per in-game hour; the day runs 8h to 15h (7 hours).
@export var seconds_per_hour := 30.0
@export var start_hour := 8
@export var end_hour := 15
## Seconds between spawns, one entry per hour from 8h.
@export var spawn_interval: PackedFloat32Array = [1.5, 1.25, 1.05, 0.9, 0.78, 0.66, 0.55]
## Enemy speed multiplier per hour from 8h.
@export var speed_by_hour: PackedFloat32Array = [1.0, 1.05, 1.12, 1.2, 1.28, 1.36, 1.45]
## Hours when Romain shows up as the boss.
@export var boss_hours: PackedInt32Array = [11, 14]
@export var max_enemies := 26

@export_group("Panda")
@export var player_speed := 340.0
@export var hearts := 4
@export var invulnerable_seconds := 1.3
@export var fire_interval := 0.3
@export var ball_speed := 760.0
@export var ball_range := 560.0
@export var ball_damage := 1.0
@export var touch_radius := 34.0

@export_group("Enemies")
@export var runner_hp := 2.0
@export var runner_speed := 175.0
@export var tank_hp := 6.0
@export var tank_speed := 85.0
@export var walker_hp := 3.0
@export var walker_speed := 120.0
@export var boss_hp := 70.0
@export var boss_speed := 70.0
@export var boss_throw_interval := 1.6
@export var file_speed := 300.0
@export var knockback := 320.0
@export var coins_per_kill := 2

@export_group("Babar")
@export var babar_interval := 14.0
@export var babar_speed := 520.0
@export var spit_speed := 520.0

@export_group("Combo and HOHO")
## Seconds a combo survives without a new hit.
@export var combo_window := 1.6
## Hits per +1 to the multiplier.
@export var combo_step := 6
@export var combo_max_multiplier := 5
## HOHO meter gained per hit (1.0 = full).
@export var hoho_per_hit := 0.035
@export var hoho_radius := 420.0
@export var hoho_damage := 4.0

@export_group("Pickups")
@export var coin_value := 5
@export var coin_magnet := 140.0
## Chance an enemy drops a power-up.
@export var powerup_chance := 0.07
## Seconds between Cous's power-up throws.
@export var cous_interval := 22.0
@export var rum_seconds := 8.0
@export var rum_speed_multiplier := 1.45
@export var rum_fire_multiplier := 2.2
@export var pig_seconds := 10.0
@export var pig_radius := 95.0
@export var pig_damage := 2.0
