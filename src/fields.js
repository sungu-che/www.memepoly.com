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
	/*
		개발 Part 18 (Edge 판정)
		이 폴백은 링(해안 393칸)이 아니라 보드 전 좌표(10000칸)다.
		그런데 FieldsSync 가 이것을 window.fields 에 넣으면
		window.IsEdge() 가 "모든 칸이 링" 이라고 답하게 된다.
		최초 진입(MapGen.target() 이 아직 null)에서 반드시 이 경로를 타므로
		링 확정 여부를 플래그로 구분해 판정을 보류시킨다.
	*/
	out.ring = false
	return out
}
/*
	개발 Part 19 (링 정렬)
	서버 fields.js 의 coastRing 과 같은 알고리즘이다. 반드시 함께 바꾼다.
	  서버   board_tiles.ring_index
	  프론트 window.fields[].index (FieldsSync 가 이 배열 순서로 index 를 부여)
	  둘이 어긋나면 서버 도착 판정과 프론트 이동 애니메이션이 다른 칸으로 간다.
	방향
	  RING_CCW = true  (x,z) 평면 반시계
	                   = 카메라 쪽(가까운 쪽) 해안에서 화면 왼쪽으로 진행
	  바꾸려면 서버와 함께 바꾼다.
*/
window.RING_CCW = true
window.FieldsCoastRing = function(tiles){
	var key, t
	var land = {}
	var landList = []
	for(key in tiles){
		if(!tiles.hasOwnProperty(key)){ continue }
		t = tiles[key]
		if(!t || t.water){ continue }
		land[key] = t
		landList.push(t)
	}
	if(!landList.length){
		return []
	}
	var keyOf = function(x, z){ return x + ":" + z }
	/* 서(W)에서 출발해 시계방향 : W, NW, N, NE, E, SE, S, SW */
	var dirs8 = [[-1, 0], [-1, -1], [0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1]]
	/* 1) 가장 큰 육지 성분 */
	var seen = {}
	var bestComp = null
	for(var li = 0; li < landList.length; li++){
		var seed = landList[li]
		var sk = keyOf(seed.x, seed.z)
		if(seen[sk]){ continue }
		var comp = []
		var stack = [seed]
		seen[sk] = true
		while(stack.length){
			var cur = stack.pop()
			comp.push(cur)
			for(var d = 0; d < 8; d++){
				var nk = keyOf(cur.x + dirs8[d][0], cur.z + dirs8[d][1])
				if(land[nk] && !seen[nk]){
					seen[nk] = true
					stack.push(land[nk])
				}
			}
		}
		if(!bestComp || comp.length > bestComp.length){ bestComp = comp }
	}
	/* 2) 시작점 = 가장 위(z 최소), 같으면 가장 왼쪽(x 최소). 그 서쪽은 항상 바다다 */
	var region = {}
	var start = null
	for(var ci = 0; ci < bestComp.length; ci++){
		var c = bestComp[ci]
		region[keyOf(c.x, c.z)] = c
		if(!start || c.z < start.z || (c.z === start.z && c.x < start.x)){ start = c }
	}
	var inRegion = function(x, z){ return region[keyOf(x, z)] ? true : false }
	var trace = [start]
	var p = start
	var backIdx = 0
	var second = null
	var guard = 0
	var limit = bestComp.length * 8 + 16
	while(guard++ < limit){
		var found = -1
		for(var k = 1; k <= 8; k++){
			var idx = (backIdx + k) % 8
			if(inRegion(p.x + dirs8[idx][0], p.z + dirs8[idx][1])){ found = idx; break }
		}
		if(found < 0){ break }
		var q = region[keyOf(p.x + dirs8[found][0], p.z + dirs8[found][1])]
		if(p === start){
			if(second === null){ second = q }
			else if(q === second && trace.length > 1){ break }
		}
		var bx = p.x + dirs8[(found + 7) % 8][0]
		var bz = p.z + dirs8[(found + 7) % 8][1]
		var nb = 0
		for(var bd = 0; bd < 8; bd++){
			if(q.x + dirs8[bd][0] === bx && q.z + dirs8[bd][1] === bz){ nb = bd; break }
		}
		trace.push(q)
		p = q
		backIdx = nb
	}
	/* 3) 재방문 제거 */
	var ring = []
	var used = {}
	for(var ti = 0; ti < trace.length; ti++){
		var tk = keyOf(trace[ti].x, trace[ti].z)
		if(used[tk]){ continue }
		used[tk] = true
		ring.push(trace[ti])
	}
	if(ring.length < 3){
		return ring
	}
	/* 4) 회전 방향 확정 */
	var area = 0
	for(var ai = 0; ai < ring.length; ai++){
		var a1 = ring[ai]
		var a2 = ring[(ai + 1) % ring.length]
		area += (a1.x * a2.z) - (a2.x * a1.z)
	}
	if((area > 0) !== window.RING_CCW){
		ring.reverse()
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
		/*
			개발 Part 18 (Edge 판정)
			FieldsCache 에는 coastRing 이 성공한 결과만 저장된다.
			따라서 캐시 히트는 항상 링 확정 상태다.
		*/
		cached.ring = true
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
	/*
		개발 Part 18 (Edge 판정)
		coastRing 이 성립한 진짜 링이다. IsEdge 가 이때만 판정을 낸다.
	*/
	out.ring = true
	window.FieldsCache.hash = hash
	window.FieldsCache.fields = out
	window.FieldsCache.tiles = result.tiles
	return out
}