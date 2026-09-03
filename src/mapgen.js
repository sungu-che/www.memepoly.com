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
	/*
		개발 Part 14 (검수) - E8
		paint 직전에 캔버스를 보장한다.
		.map 컨테이너는 있으나 canvas 엘리먼트만 없는 경우가 있어
		paint 가 조용히 빠져나가고 BoardCallback 이 null.toDataURL() 로 터졌다.
	*/
	window.MapGen.ensureCanvas()
	window.MapGen.paint(list)
	return true
}
/*
	개발 Part 14 (검수) - E8
	미니맵 캔버스와 썸네일 img 를 보장한다.
	.map 컨테이너가 없으면 아무것도 하지 않는다(레이아웃을 임의로 만들지 않는다).
	canvas / img.canvas 만 없을 때 채워 넣는다.
	BoardCallback 은
	  document.querySelector('.map canvas').toDataURL()
	  document.querySelector('.map .canvas').src
	두 셀렉터를 쓰므로 태그명과 클래스명을 그대로 맞춘다.
*/
window.MapGen.ensureCanvas = function(){
	try{
		var wrap = document.querySelector(".map")
		if(!wrap){
			return null
		}
		var canvas = wrap.querySelector("canvas")
		if(!canvas){
			canvas = document.createElement("canvas")
			canvas.width = 100
			canvas.height = 100
			wrap.appendChild(canvas)
		}
		var img = wrap.querySelector("img.canvas")
		if(!img){
			img = wrap.querySelector(".canvas")
		}
		if(!img || img.tagName !== "IMG"){
			img = document.createElement("img")
			img.className = "canvas"
			img.alt = "map"
			wrap.appendChild(img)
		}
		return canvas
	}catch(err){
		console.log("[mapgen] ensureCanvas err", err)
		return null
	}
}
window.MapGen.paint = function(list){
	try{
		var canvas = document.querySelector(".map canvas")
		if(!canvas){
			/*
				개발 Part 14 (검수) - E8
				현행은 조용히 return 해서 "캔버스가 없다" 는 사실이
				전혀 드러나지 않았다.
				같은 셀렉터를 BoardCallback 이 .toDataURL() 로 직접 호출하므로
				여기서 빠져나간다는 것은 곧 그쪽에서 TypeError 가 난다는 뜻이다.
				1 회만 경고를 남긴다(폴링마다 찍히면 콘솔이 묻힌다).
			*/
			if(!window.MapGen.__noCanvasWarned){
				window.MapGen.__noCanvasWarned = true
				console.log("[mapgen] '.map canvas' not found. minimap disabled.")
			}
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