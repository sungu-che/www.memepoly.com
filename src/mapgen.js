window.MapGen = {
	key : "",
	ready : false,
	mode : "",
	tiles : null
}
window.MapGen.target = function(){
	var cookies = window.cookies ? window.cookies : {}
	var mode = window.Mode ? window.Mode(cookies) : "board"
	if(mode == "room"){
		var owner = (window.location.hash + "").replace("#","").toLowerCase()
		if(!owner){
			owner = ((cookies.address ? cookies.address : cookies.hash) || "") + ""
		}
		owner = owner.replace("0x","").toLowerCase()
		if(!owner){
			return null
		}
		return { mode : "room", key : "room:" + owner, hash : owner }
	}
	var m = window.match ? window.match : null
	var hash = cookies.match ? cookies.match : (m ? m.hash : "")
	if(!hash){
		return null
	}
	return { mode : "board", key : "board:" + hash, hash : hash }
}
window.MapGen.apply = function(force){
	var t = window.MapGen.target()
	if(!t){
		return false
	}
	if(!force && window.MapGen.ready && window.MapGen.key == t.key){
		return false
	}
	var fields
	try{
		fields = window.Fields(t.hash)
	}catch(err){
		console.log("MapGen fields err", err)
		return false
	}
	if(!fields || !fields.tiles){
		return false
	}
	if(!window.map){
		window.MapReset()
	}
	window.map.biomes = {}
	window.map.dissolve = {}
	var list = []
	for(var key in fields.tiles){
		if(fields.tiles.hasOwnProperty(key)){
			var t0 = fields.tiles[key]
			var item = {
				biome : t0.biome,
				elevation : t0.elevation,
				moisture : t0.moisture,
				water : t0.water,
				ocean : t0.ocean,
				coast : t0.coast,
				x : t0.x,
				y : t0.y,
				z : t0.z
			}
			window.map.biomes[item.x + ":" + item.z] = item
			list.push(item)
		}
	}
	window.MapGen.tiles = fields.tiles
	window.MapGen.mode = t.mode
	window.MapGen.key = t.key
	window.MapGen.ready = true
	window.MapGen.paint(list)
	return true
}
window.MapGen.paint = function(list){
	try{
		var canvas = document.querySelector(".map canvas")
		if(!canvas){
			return
		}
		var side = 100
		canvas.width = side
		canvas.height = side
		var ctx = canvas.getContext("2d")
		ctx.clearRect(0, 0, side, side)
		var minX = Infinity, minZ = Infinity
		for(var m = 0; m < list.length; m++){
			if(list[m].x < minX){ minX = list[m].x }
			if(list[m].z < minZ){ minZ = list[m].z }
		}
		for(var i = 0; i < list.length; i++){
			var b = list[i]
			var color = window.Biomes["#" + b.biome]
			if(!color){
				continue
			}
			ctx.fillStyle = color
			ctx.fillRect(b.x - minX, b.z - minZ, 1, 1)
		}
		var img = document.querySelector(".map .canvas")
		if(img){
			img.src = canvas.toDataURL()
		}
	}catch(err){
		console.log("MapGen paint err", err)
	}
}
window.MapGen.assets = function(address, center, size){
	var out = []
	if(!window.map || !window.map.biomes){
		return out
	}
	size = size ? size : 4
	var hash = (address + "").replace("0x","")
	for(var _x = -size; _x <= size; _x++){
		for(var _z = -size; _z <= size; _z++){
			var bx = center.x + _x
			var bz = center.z + _z
			var b = window.map.biomes[bx + ":" + bz]
			if(!b){
				continue
			}
			var color = window.Biomes["#" + b.biome]
			var id = ""
			try{
				id = crc32(hash + "#" + b.biome + bx + bz).toString(32).toUpperCase()
			}catch(err){
				id = hash + ":" + bx + ":" + bz
			}
			out.push({
				id : id,
				hash : hash,
				name : "#" + b.biome,
				value : color,
				color : color,
				x : bx,
				y : b.y - (b.water ? 0.8 : 0.5),
				z : bz
			})
		}
	}
	return out
}