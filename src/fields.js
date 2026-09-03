window.FieldsBoard = {
	side : 100,
	width : 400,
	height : 400,
	islandShape : "radial",
	islandFactor : 1.07,
	lakeThreshold : 0.3,
	riverChance : 120
}
window.FieldsSerpentine = function(){
	var minX = -49.5
	var minZ = -99.5
	var cols = 100
	var rows = 100
	var out = []
	for(var r = 0; r < rows; r++){
		var z = minZ + r
		for(var c = 0; c < cols; c++){
			var x = (r % 2 === 0) ? (minX + c) : (minX + (cols - 1 - c))
			out.push({ x : x, z : z })
		}
	}
	return out
}
window.FieldsCoastRing = function(tiles){
	var key, t
	var pool = {}
	var list = []
	for(key in tiles){
		if(tiles.hasOwnProperty(key)){
			t = tiles[key]
			if(t.coast && !t.ocean){
				pool[key] = t
				list.push(t)
			}
		}
	}
	if(!list.length){
		return []
	}
	list.sort(function(a, b){
		var da = a.x * a.x + (a.z + 50) * (a.z + 50)
		var db = b.x * b.x + (b.z + 50) * (b.z + 50)
		if(da !== db){ return db - da }
		if(a.x !== b.x){ return a.x - b.x }
		return a.z - b.z
	})
	var ring = []
	var current = list[0]
	delete pool[current.x + ":" + current.z]
	ring.push(current)
	var dirs = [
		[1, 0], [1, 1], [0, 1], [-1, 1],
		[-1, 0], [-1, -1], [0, -1], [1, -1]
	]
	while(true){
		var next = null
		var d, k
		for(d = 0; d < dirs.length; d++){
			k = (current.x + dirs[d][0]) + ":" + (current.z + dirs[d][1])
			if(pool[k]){
				next = pool[k]
				break
			}
		}
		if(!next){
			var best = null
			var bestDist = Infinity
			for(k in pool){
				if(pool.hasOwnProperty(k)){
					var p = pool[k]
					var dist = (p.x - current.x) * (p.x - current.x) +
						(p.z - current.z) * (p.z - current.z)
					if(dist < bestDist ||
						(dist === bestDist && best &&
							(p.x < best.x || (p.x === best.x && p.z < best.z)))){
						bestDist = dist
						best = p
					}
				}
			}
			if(!best){ break }
			next = best
		}
		delete pool[next.x + ":" + next.z]
		ring.push(next)
		current = next
	}
	return ring
}
window.FieldsCache = {
	hash : "",
	fields : null,
	tiles : null
}
window.Fields = function(hash){
	if(typeof hash == "undefined"){
		hash = window.FieldsCache.hash
	}
	if(!hash){
		return window.FieldsSerpentine()
	}
	if(window.FieldsCache.hash == hash && window.FieldsCache.fields){
		var cached = []
		for(var c = 0; c < window.FieldsCache.fields.length; c++){
			cached.push({
				x : window.FieldsCache.fields[c].x,
				z : window.FieldsCache.fields[c].z
			})
		}
		cached.tiles = window.FieldsCache.tiles
		return cached
	}
	var result
	try{
		result = window.VoronoiCore.build({
			hash : hash,
			side : window.FieldsBoard.side,
			width : window.FieldsBoard.width,
			height : window.FieldsBoard.height,
			islandShape : window.FieldsBoard.islandShape,
			islandFactor : window.FieldsBoard.islandFactor,
			lakeThreshold : window.FieldsBoard.lakeThreshold,
			riverChance : window.FieldsBoard.riverChance
		})
	}catch(err){
		console.log("Fields build err", err)
		return window.FieldsSerpentine()
	}
	if(!result){
		return window.FieldsSerpentine()
	}
	var ring = window.FieldsCoastRing(result.tiles)
	if(ring.length < 12){
		return window.FieldsSerpentine()
	}
	var out = []
	for(var i = 0; i < ring.length; i++){
		out.push({ x : ring[i].x, z : ring[i].z })
	}
	out.tiles = result.tiles
	out.seed = result.seed
	out.shapeSeed = result.shapeSeed
	out.side = result.side
	window.FieldsCache.hash = hash
	window.FieldsCache.fields = out
	window.FieldsCache.tiles = result.tiles
	return out
}