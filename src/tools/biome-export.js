window.BiomeExport = function(full){
	if(!window.map || !window.map.biomes){
		console.log("voronoi map is not ready")

		return
	}

	window.listToBiomes(window.map.biomes, 100)

	var out = {}

	if(full){
		var list = window.map.biomes

		for(var i = 0; i < list.length; i++){
			var b = list[i]

			if(!b){
				continue
			}

			out[b.x+":"+b.z] = {
				biome : "#"+b.biome,
				elevation : b.y,
				water : b.water ? true : false
			}
		}
	}else{
		var fields = window.Fields()

		for(var i = 0; i < fields.length; i++){
			var f = fields[i]
			var b = window.map.biomes[f.x+":"+f.z]

			if(!b){
				continue
			}

			out[f.x+":"+f.z] = {
				biome : "#"+b.biome,
				elevation : b.y,
				water : b.water ? true : false
			}
		}
	}

	var body = "module.exports = function () {\n\treturn " + JSON.stringify(out, null, "\t").replace(/\n/g, "\n\t") + "\n}\n"

	console.log("fields :", Object.keys(out).length)

	try{
		copy(body)

		console.log("clipboard copied. paste into memepoly.com/biomes.js")
	}catch(err){
		console.log(body)
	}

	return body
}