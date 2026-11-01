class_name LevelData
extends RefCounted
## Level layouts as data. Ground top is y = 600. A level is a Dictionary:
##   platforms: [[x, y, w, h, style]], coins: [Vector2], critters: [[kind, look, x, y, min_x, max_x]],
##   cars: [Vector2], checkpoints: [Vector2], powerups: [[kind, Vector2]], start, goal_x, office_end.


## "15h pétantes !": escape the office, cross the rooftops, reach the beach.
static func level_1() -> Dictionary:
	var coins: Array[Vector2] = []
	coins.append_array(_arc(330, 480, 5, 34, 60))
	coins.append_array(_row(520, 390, 3, 32))
	coins.append_array(_arc(700, 440, 5, 34, 50))
	coins.append_array(_row(920, 340, 5, 34))
	coins.append_array(_arc(1150, 450, 5, 34, 60))
	coins.append_array(_arc(1380, 360, 5, 40, 90))
	coins.append_array(_row(1560, 420, 7, 44))
	coins.append_array(_arc(1880, 360, 4, 36, 70))
	coins.append_array(_row(2000, 350, 6, 40))
	coins.append_array(_row(2420, 560, 8, 40))
	coins.append_array(_arc(2440, 250, 6, 40, 120))
	coins.append_array(_row(2900, 310, 6, 42))
	coins.append_array(_arc(3260, 380, 4, 34, 60))
	coins.append_array(_row(3500, 420, 6, 42))
	coins.append_array(_row(3950, 560, 10, 46))
	coins.append_array(_arc(4800, 470, 5, 40, 80))
	coins.append_array(_arc(5040, 410, 5, 40, 80))
	coins.append_array(_arc(5280, 350, 5, 40, 80))
	coins.append_array(_row(5520, 470, 5, 40))
	coins.append_array(_row(5850, 560, 8, 46))
	return {
		"name": "LEVEL_1",
		"start": Vector2(120, 600),
		"office_end": 1450.0,
		"goal_x": 6300.0,
		"platforms": [
			[-300, 600, 1700, 220, "office"],
			[300, 500, 160, 20, "desk"],
			[520, 430, 90, 170, "cabinet"],
			[700, 470, 160, 20, "desk"],
			[900, 380, 200, 20, "shelf"],
			[1150, 480, 160, 20, "desk"],
			[1330, 410, 110, 20, "shelf"],
			[1520, 470, 380, 360, "house_pink"],
			[1980, 400, 300, 430, "house_yellow"],
			[2300, 600, 520, 220, "street"],
			[2880, 360, 330, 470, "house_blue"],
			[3260, 440, 150, 20, "wood"],
			[3460, 470, 330, 360, "house_green"],
			[3860, 600, 900, 220, "sand"],
			[4820, 540, 160, 20, "wood"],
			[5060, 480, 160, 20, "wood"],
			[5300, 420, 160, 20, "wood"],
			[5520, 520, 200, 20, "wood"],
			[5780, 600, 1100, 220, "sand"],
		],
		"coins": coins,
		"critters": [
			["walker", CastLooks.ALINE, 600, 600, 330, 880],
			["walker", CastLooks.EUGENIE, 1000, 600, 880, 1300],
			["walker", CastLooks.MAMAR, 420, 600, 300, 500],
			["boss", CastLooks.ROMAIN, 1250, 600, 1150, 1380],
			["walker", CastLooks.VIOLAINE, 1700, 470, 1560, 1860],
			["runner", CastLooks.VICTOR, 2600, 600, 2320, 2800],
			["babar", CastLooks.BABAR, 3120, 360, 3120, 3120],
			["walker", CastLooks.MAMAR, 3600, 470, 3490, 3760],
			["crab", &"", 4100, 600, 3900, 4400],
			["crab", &"", 4500, 600, 4300, 4720],
			["mosquito", &"", 5000, 380, 4900, 5200],
			["mosquito", &"", 5420, 330, 5320, 5600],
			["crab", &"", 6000, 600, 5850, 6200],
		],
		"cars": [Vector2(2470, 600)],
		"checkpoints": [Vector2(1600, 470), Vector2(3920, 600)],
		"powerups": [["rum", Vector2(2130, 300)], ["sandwich", Vector2(3640, 380)], ["rum", Vector2(5380, 300)]],
	}


static func _row(x: float, y: float, count: int, spacing: float) -> Array[Vector2]:
	var out: Array[Vector2] = []
	for i in count:
		out.append(Vector2(x + i * spacing, y))
	return out


static func _arc(x: float, y: float, count: int, spacing: float, height: float) -> Array[Vector2]:
	var out: Array[Vector2] = []
	for i in count:
		var t := float(i) / maxf(1.0, count - 1.0)
		out.append(Vector2(x + i * spacing, y - sin(t * PI) * height))
	return out
