class_name Sfx
extends Node
## Small synthesised sound effects (no audio files needed): blips for shooting,
## hits, coins, hurt, power-ups and the HOHO shockwave.
##
## Example: sfx.play(&"coin")

const RATE := 22050

var _streams := {}
var _players: Array[AudioStreamPlayer] = []
var _next := 0


func _ready() -> void:
	_streams[&"shoot"] = _tone(900.0, 500.0, 0.06, 0.25, 0.0)
	_streams[&"hit"] = _tone(260.0, 120.0, 0.08, 0.5, 0.6)
	_streams[&"coin"] = _tone(1200.0, 1800.0, 0.09, 0.3, 0.0)
	_streams[&"hurt"] = _tone(180.0, 60.0, 0.25, 0.7, 0.4)
	_streams[&"power"] = _tone(500.0, 1400.0, 0.3, 0.4, 0.0)
	_streams[&"hoho"] = _tone(120.0, 40.0, 0.5, 0.9, 0.7)
	_streams[&"boss"] = _tone(90.0, 70.0, 0.6, 0.6, 0.3)
	for i in 10:
		var p := AudioStreamPlayer.new()
		add_child(p)
		_players.append(p)


## Plays a named effect; overlapping sounds share a small pool of players.
func play(id: StringName, pitch_jitter := 0.08) -> void:
	if not _streams.has(id):
		return
	var p := _players[_next]
	_next = (_next + 1) % _players.size()
	p.stream = _streams[id]
	p.pitch_scale = 1.0 + randf_range(-pitch_jitter, pitch_jitter)
	p.play()


## A frequency sweep with a decaying envelope, optionally mixed with noise.
func _tone(from_hz: float, to_hz: float, seconds: float, volume: float, noise: float) -> AudioStreamWAV:
	var count := int(RATE * seconds)
	var data := PackedByteArray()
	data.resize(count * 2)
	var phase := 0.0
	for i in count:
		var t := float(i) / count
		phase += TAU * lerpf(from_hz, to_hz, t) / RATE
		var sample := sin(phase) * (1.0 - noise) + randf_range(-1.0, 1.0) * noise
		data.encode_s16(i * 2, int(sample * (1.0 - t) * volume * 30000.0))
	var wav := AudioStreamWAV.new()
	wav.format = AudioStreamWAV.FORMAT_16_BITS
	wav.mix_rate = RATE
	wav.data = data
	return wav
