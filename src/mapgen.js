window.MapGen = {
	key : "",
	ready : false,
	cols : 100,
	points : 10000,
	size : { width : 400, height : 400 },
	offset : { x : 0, z : 0 }
}
window.MapGen.hashSeed = function(hash){
	hash = (hash + "").replace("0x","").toLowerCase()
	if(!hash){
		return null
	}
	while(hash.length < 16){
		hash += hash
	}
	return {
		seed : hash.substr(0, 8),
		shapeSeed : hash.substr(8, 8)
	}
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
		var s = window.MapGen.hashSeed(owner)
		if(!s){
			return null
		}
		return {
			mode : "room",
			key : "room:" + owner,
			seed : s.seed,
			shapeSeed : s.shapeSeed,
			offset : { x : 0, z : 50 }
		}
	}
	var m = window.match ? window.match : null
	var seed = cookies.seed ? cookies.seed : (m ? m.seed : "")
	var shapeSeed = cookies.shapeSeed ? cookies.shapeSeed : (m ? m.shapeSeed : "")
	var index = typeof cookies.matchIndex != "undefined" ? cookies.matchIndex : (m ? m.index : "")
	if(!seed){
		return null
	}
	return {
		mode : "board",
		key : "board:" + index + ":" + seed,
		seed : seed,
		shapeSeed : shapeSeed,
		offset : { x : 0, z : 0 }
	}
}
window.MapGen.set = function(id, value){
	var el = document.getElementById(id)
	if(!el){
		return
	}
	if(el.tagName == "SELECT"){
		for(var i = 0; i < el.options.length; i++){
			if(el.options[i].value == value){
				el.selectedIndex = i
				return
			}
		}
		return
	}
	if(el.type == "checkbox"){
		el.checked = value ? true : false
		return
	}
	el.value = value
	el.setAttribute("value", value)
}
window.MapGen.commit = function(t){
	try{
		var centers = window.map ? window.map.biomes : null
		if(!centers || !centers.length){
			return false
		}
		window.map.dissolve = {}
		window.MapGen.offset = t.offset
		window.listToBiomes(centers, window.MapGen.cols, t.offset)
		window.MapGen.key = t.key
		window.MapGen.ready = true
		return true
	}catch(err){
		console.log("MapGen commit err", err)
		return false
	}
}
window.MapGen.apply = function(force){
	var t = window.MapGen.target()
	if(!t){
		return false
	}
	if(!force && window.MapGen.ready && window.MapGen.key == t.key){
		return false
	}
	var $gen = document.getElementById("generate")
	if(!$gen){
		return false
	}
	var set = window.MapGen.set
	/* 결정성 확보: 아래 값들이 바뀌면 같은 해시라도 다른 섬이 나온다 */
	set("pointSelection", "square")
	set("numberOfPoints", window.MapGen.points)
	set("numberOfLands", "")
	set("islandShape", "radial")
	set("islandFactor", "1.07")
	set("lakeThreshold", "0.3")
	set("riverChance", "120")
	set("edgeNoise", "0.5")
	set("lloydIterations", "2")
	set("roadElevationThresholds", "0,0.05,0.37,0.64")
	set("width", window.MapGen.size.width)
	set("height", window.MapGen.size.height)
	set("renderer", "canvas")
	set("view", "smooth")
	set("seed", t.seed)
	set("shapeSeed", t.shapeSeed)
	window.MapGen.ready = false
	try{
		$($gen).click()
	}catch(err){
		console.log("MapGen apply err", err)
		return false
	}
	return window.MapGen.commit(t)
}
window.MapGen.assets = function(address, center, size){
	/* 보드/룸 공용 : 플레이어 주변 biome 타일을 3D 에셋 배열로 만든다 */
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