window.PropertyCost = [100, 200, 500, 1000, 2500]
window.PropertyToll = [0, 20, 50, 120, 300]
window.PropertyType = ["empty", "fence", "house", "shop", "landmark"]
window.PropertyLevelEmoji = ["", "🪵", "🏠", "🏪", "🏰"]
window.PropertyMaterials = [
	[],
	["🪵", "🪵"],
	["🪵", "🪵", "🪵", "🪨", "🪨"],
	["🪵", "🪵", "🪵", "🪵", "🪵", "🪨", "🪨", "🪨", "🛢"],
	["🪵", "🪵", "🪵", "🪵", "🪵", "🪵", "🪵", "🪵", "🪨", "🪨", "🪨", "🪨", "🪨", "🛢", "🛢", "🛢", "❄"]
]

window.Recipes = [
	{ index: 0,  result: "🛡", name: "방패",        grade: "rare",    cost: 100, materials: ["🪵", "🪵", "🪵"] },
	{ index: 1,  result: "⛏", name: "곡괭이",      grade: "common",  cost: 100, materials: ["🪨", "🪨", "🪵"] },
	{ index: 2,  result: "🪓", name: "도끼",        grade: "common",  cost: 100, materials: ["🪵", "🪵", "🪨"] },
	{ index: 3,  result: "🪖", name: "군용 헬멧",   grade: "common",  cost: 100, materials: ["🪨", "🪨", "🪨", "🛢"] },
	{ index: 4,  result: "🏹", name: "활",          grade: "rare",    cost: 100, materials: ["🪵", "🪵", "🪵", "🪵"] },
	{ index: 5,  result: "🦺", name: "안전 조끼",   grade: "common",  cost: 100, materials: ["🪵", "🪵", "🛢", "🛢"] },
	{ index: 6,  result: "🧤", name: "작업 장갑",   grade: "common",  cost: 100, materials: ["🪵", "🪵", "🛢"] },
	{ index: 7,  result: "👢", name: "장화",        grade: "common",  cost: 100, materials: ["🪵", "🪵", "🪵", "🛢"] },
	{ index: 8,  result: "🔫", name: "물총",        grade: "common",  cost: 100, materials: ["🪨", "🛢", "🛢"] },
	{ index: 9,  result: "🗡", name: "단검",        grade: "common",  cost: 100, materials: ["🪨", "🪨", "🛢"] },
	{ index: 10, result: "🎣", name: "낚싯대",      grade: "rare",    cost: 250, materials: ["🪵", "🪵", "🪵", "🪨"] },
	{ index: 11, result: "⛑", name: "구조 헬멧",   grade: "rare",    cost: 250, materials: ["🪨", "🪨", "🪨", "🪨", "🛢", "🛢", "❄"] },
	{ index: 12, result: "🥋", name: "도복",        grade: "rare",    cost: 250, materials: ["🪵", "🪵", "🪵", "🪵", "❄", "❄"] },
	{ index: 13, result: "🥾", name: "등산화",      grade: "rare",    cost: 250, materials: ["🪵", "🪵", "🪵", "🪵", "🪨", "🪨", "🛢"] },
	{ index: 14, result: "🥊", name: "복싱 글러브", grade: "rare",    cost: 250, materials: ["🪵", "🪵", "🪨", "🪨", "🛢", "🛢"] },
	{ index: 15, result: "⚔", name: "검",          grade: "rare",    cost: 250, materials: ["🪨", "🪨", "🪨", "🪨", "🪨", "🛢", "🛢"] },
	{ index: 16, result: "💣", name: "폭탄",        grade: "special", cost: 500, materials: ["🛢", "🛢", "🛢", "🪨", "🪨"] },
	{ index: 17, result: "🧪", name: "물약",        grade: "consume", cost: 50,  materials: ["🐟", "🐟", "❄"] }
]

window.Recipes.forEach(function(row){
	window.Recipes[row.result] = row
})

window.MaxHp = { "" : 10, "PLAYER" : 10, "PMC" : 8, "SCAV" : 5, "UCAV" : 8 }

window.PropertyInit = function(fields){
	if(!fields){
		return fields
	}

	fields.forEach(function(field, index){
		field.index = index

		field.property = {
			level : 0,
			owner : "",
			type : window.PropertyType[0],
			toll : 0,
			cost : window.PropertyCost,
			tollTable : window.PropertyToll,
			materials : window.PropertyMaterials
		}

		fields[`${field.x}:${field.z}`] = field
	})

	window.fields = fields

	return fields
}