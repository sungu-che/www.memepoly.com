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

	out.ring = false
	return out
}

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
	/*
		개발 Part 28 (순회 경로 보존)
		현행 문제
		  trace 는 Moore 경계추적 결과라 연속 두 항목이 항상 8방향 인접이다.
		  스퍼(1칸 폭 반도)에서는 A→B→C→D(끝)→C→B→A 처럼
		  나갔다가 되돌아 나오는 왕복이 들어 있고, 그것이 실제로 걸어야 할 길이다.
		  그런데 아래 "재방문 제거" 가 왕복 구간을 지워버려
		  ring 은 좌표 집합으로는 맞지만 순서 배열로는 인접이 끊긴다.
		  ring[i]=스퍼 끝, ring[i+1]=뿌리 너머 새 칸 이 되어 수 칸이 떨어진다.
		  주사위 이동이 그 지점에서 강제 점프하고, 점프 직후 prev 가
		  멀리 떨어진 좌표로 남아 방향벡터가 뒤집혀 "뒤로 회귀" 한다.
		조치
		  왕복이 살아 있는 순회 경로(path)를 따로 보존한다.
		  ring 은 지금처럼 Edge 판정 / 표시 순서 용도로 유지한다.
		  주사위 전진은 path 커서로만 한다(src/index.js RollNext).
		주의
		  회전 방향을 뒤집을 때 ring 과 path 를 함께 뒤집어야
		  두 배열의 진행 방향이 어긋나지 않는다.
	*/
	/* 3-0) 순회 경로 확정. 재방문을 지우지 않는다 */
	var path = []
	for(var pi = 0; pi < trace.length; pi++){
		path.push(trace[pi])
	}
	/*
		Jacob 정지조건 때문에 시작 타일이 배열 끝에 한 번 더 들어간다.
		순환 이동에서 제자리걸음이 되므로 꼬리의 중복만 잘라낸다.
	*/
	while(path.length > 1){
		var _pf = path[0]
		var _pl = path[path.length - 1]
		if(_pf.x === _pl.x && _pf.z === _pl.z){
			path.pop()
		}else{
			break
		}
	}
	/* 3) 재방문 제거 */
	var ring = []
	var used = {}
	for(var ti = 0; ti < path.length; ti++){
		var tk = keyOf(path[ti].x, path[ti].z)
		if(used[tk]){ continue }
		used[tk] = true
		ring.push(path[ti])
	}
	if(ring.length < 3){
		ring.path = path
		ring.closed = false
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
		path.reverse()
	}
	/*
		5) 폐합 여부.
		마지막 칸과 첫 칸이 8방향 인접이면 순환 이동이 가능하다.
		추적이 중간에 끊긴(found < 0) 경우에는 false 가 되며
		RollNext 가 인접 검사로 걸러 폴백 계층으로 내려간다.
	*/
	var closed = false
	if(path.length > 2){
		var _c0 = path[0]
		var _cn = path[path.length - 1]
		var _cdx = Math.abs(_c0.x - _cn.x)
		var _cdz = Math.abs(_c0.z - _cn.z)
		if(_cdx <= 1 && _cdz <= 1 && (_cdx + _cdz) > 0){
			closed = true
		}
	}
	ring.path = path
	ring.closed = closed
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
		/*
			개발 Part 28 (순회 경로 보존)
			path 는 읽기 전용으로만 쓰므로 참조를 그대로 넘긴다.
			(주사위 시작 시 window.Roll 이 좌표만 다시 복사해 스냅샷을 뜬다)
		*/
		cached.path = window.FieldsCache.fields.path
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
	/*
		개발 Part 28 (순회 경로 보존)
		주사위 전진에 쓸 경로를 좌표만 복사해 함께 싣는다.
		out(=window.fields) 는 BoardCallback 의 링 회전 대상이므로
		경로는 반드시 별도 배열이어야 한다.
		path.length 는 스퍼 왕복 칸 수만큼 ring.length 보다 크다.
	*/
	var path = []
	var srcPath = ring.path ? ring.path : ring
	for(var p = 0; p < srcPath.length; p++){
		path.push({ x : srcPath[p].x, z : srcPath[p].z, i : p })
	}
	path.closed = ring.closed ? true : false
	out.path = path
	out.tiles = result.tiles
	out.seed = result.seed
	out.shapeSeed = result.shapeSeed
	out.side = result.side
	out.ring = true
	window.FieldsCache.hash = hash
	window.FieldsCache.fields = out
	window.FieldsCache.tiles = result.tiles
	return out
}
/*
	개발 Part 28 (순회 경로 조회)
	주사위 전진용 경로를 돌려준다.
	조회 순서
	  1) window.fields.path
	     Experience.jsx 의 FieldsSync() 가 Fields() 결과를 그대로 쓰는 경우.
	  2) window.FieldsCache.fields.path
	     FieldsSync 가 배열을 새로 만들어 문자열 속성이 날아간 경우.
	     캐시는 회전(splice) 대상이 아니므로 항상 원본 순서다.
	  3) window.Fields()
	     위 둘이 모두 비었을 때 캐시 해시로 즉시 재생성.
	링이 아직 확정되지 않았으면(Serpentine 폴백) null 을 돌려준다.
*/
window.RollPath = function(){
	var p = null
	try{
		if(window.fields && window.fields.path && window.fields.path.length){
			p = window.fields.path
		}
	}catch(err){
		p = null
	}
	if(!p){
		try{
			if(window.FieldsCache.fields && window.FieldsCache.fields.path && window.FieldsCache.fields.path.length){
				p = window.FieldsCache.fields.path
			}
		}catch(err){
			p = null
		}
	}
	if(!p){
		try{
			var f = window.Fields()
			if(f && f.path && f.path.length){
				p = f.path
			}
		}catch(err){
			p = null
		}
	}
	return (p && p.length) ? p : null
}