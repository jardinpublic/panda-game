class_name WorkTuning
extends Resource
## All tuning values for the work scene (story 004). Edit `work_tuning.tres`,
## never the numbers in code.

@export_group("Day")
## Real seconds for the in-game day from 8:00 to 15:00.
@export var day_seconds := 150.0
@export var start_hour := 8.0
@export var end_hour := 15.0

@export_group("Panda")
@export var panda_speed := 330.0
## Seconds Panda is frozen after one of Babar's gags.
@export var flinch_seconds := 1.2

@export_group("Suspicion")
@export var suspicion_max := 100.0
## Gain per second while a watcher of weight 1 sees Panda slacking.
@export var suspicion_gain_per_second := 42.0
## Decay per second while nobody sees him slacking.
@export var suspicion_decay_per_second := 5.0
## Faster decay while he sits at his desk.
@export var suspicion_desk_decay_per_second := 12.0
## Added when the boss finds Panda's desk empty on his rounds.
@export var empty_desk_penalty := 22.0

@export_group("Watchers")
@export var view_half_angle_deg := 32.0
@export var boss_speed := 125.0
@export var boss_view_range := 300.0
## Suspicion weight while the boss sees Panda (colleagues count less).
@export var boss_weight := 1.5
@export var colleague_speed := 90.0
@export var colleague_view_range := 220.0
@export var colleague_weight := 0.65
## Seconds a watcher stays at each stop, looking around.
@export var boss_pause := 1.5
@export var colleague_pause := 3.0

@export_group("Fake busy")
@export var fake_busy_seconds := 2.5
@export var fake_busy_cooldown := 8.0
## Suspicion removed the moment he starts faking.
@export var fake_busy_drop := 12.0

@export_group("Babar")
@export var babar_min_interval := 16.0
@export var babar_max_interval := 28.0
## Suspicion added for each watcher within the radius of Panda's yelp.
@export var babar_noise_suspicion := 10.0
@export var babar_noise_radius := 380.0
@export var babar_speed := 520.0

@export_group("Pay and promotions")
@export var base_pay_per_hour := 25.0
## Each promotion multiplies the hourly pay by this.
@export var pay_multiplier_per_rank := 1.6
## In-game hours when a promotion review happens.
@export var promotion_hours: PackedFloat32Array = [10.0, 12.0, 14.0]
## A review succeeds only if suspicion is at or below this.
@export var promotion_max_suspicion := 50.0

@export_group("Laziness")
## Farniente points per second while slacking somewhere neutral.
@export var laziness_per_second := 10.0
@export var coffee_multiplier := 2.0
@export var nap_multiplier := 3.0
@export var hide_multiplier := 1.0
