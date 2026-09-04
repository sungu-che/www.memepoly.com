window.MapGen = {
	key : "",
	ready : false,
	mode : "",
	tiles : null,
	/*
		개발 Part 16 (미니맵)
		voronoi 타일을 2D 로 평면화해 base64 로 만들고
		#map 안의 img[src] 에 넣기 위한 캐시.
		  dataURL    평면화 결과 base64
		  paintedKey dataURL 을 만든 시점의 매치/룸 키
		  colorKey   그릴 때 사용한 window.Biomes 의 키 개수
		             룰셋이 늦게 로드되면 값이 바뀌므로 그때 다시 그린다
		  side       한 변의 타일 수 (voronoi side 와 동일)
		  scale      타일 1 칸을 몇 px 로 찍을지
		             #map .map 이 200px 이고 side 가 100 이므로 2 가 1:1 이다
	*/
	dataURL : "",
	paintedKey : "",
	colorKey : -1,
	side : 100,
	scale : 2,
	/*
		개발 Part 17 (미니맵)
		좌표 -> 픽셀 변환에 쓰는 타일 경계 캐시.
		tilesOf() 는 1만 항목을 순회하므로 폴링마다 부르면 비싸다.
		매치(또는 룸) 키가 바뀔 때만 다시 계산한다.
	*/
	bounds : null,
	boundsKey : "",
	focus : null
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
		개발 Part 16 (미니맵)
		매치(또는 룸)가 바뀌면 이전 base64 는 무효다.
		캐시를 비워 다음 sync() 가 새로 그리게 한다.
	*/
	window.MapGen.dataURL = ""
	window.MapGen.paintedKey = ""
	window.MapGen.colorKey = -1
	/*
		개발 Part 17 (미니맵)
		섬이 바뀌면 minX / minZ 도 바뀐다. 경계 캐시를 함께 비운다.
	*/
	window.MapGen.bounds = null
	window.MapGen.boundsKey = ""
	window.MapGen.focus = null
	window.MapGen.__noCanvasWarned = false
	/*
		개발 Part 14 (검수) - E8
		paint 직전에 캔버스를 보장한다.
		.map 컨테이너는 있으나 canvas 엘리먼트만 없는 경우가 있어
		paint 가 조용히 빠져나가고 BoardCallback 이 null.toDataURL() 로 터졌다.
	*/
	window.MapGen.ensureCanvas()
	window.MapGen.sync()
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
/*
	개발 Part 16 (미니맵)
	평면화 결과를 담을 컨테이너를 찾는다.
	우선순위
	  1) #map .map      실제 미니맵 영역(CSS 가 200x200 으로 잡아둔 곳)
	  2) #map           .map 래퍼가 없는 마크업 대비
	  3) .map           최후 폴백
	document.querySelector(".map") 만 쓰면
	문서에 .map 이 여러 개일 때 엉뚱한 노드를 잡는다.
*/
window.MapGen.wrap = function(){
	var wrap = document.querySelector("#map .map")
	if(!wrap){
		wrap = document.querySelector("#map")
	}
	if(!wrap){
		wrap = document.querySelector(".map")
	}
	return wrap
}
/*
	개발 Part 16 (미니맵)
	base64 를 넣을 img 를 찾는다. 없으면 만들어 붙인다.
	클래스명을 "canvas" 로 두는 이유
	  기존 index.js 가 '.map .canvas' 셀렉터로 이 노드를 참조했고
	  CSS 도 '#map .map img' 로 크기를 잡고 있다.
*/
window.MapGen.image = function(){
	var wrap = window.MapGen.wrap()
	if(!wrap){
		return null
	}
	var img = wrap.querySelector("img.canvas")
	if(!img){
		img = wrap.querySelector("img")
	}
	if(!img){
		img = document.createElement("img")
		img.className = "canvas"
		img.alt = "map"
		img.setAttribute("draggable", "false")
		wrap.appendChild(img)
	}
	if(img.className.indexOf("canvas") === -1){
		img.className = (img.className + " canvas").trim()
	}
	return img
}
/*
	개발 Part 16 (미니맵)
	평면화용 2D 캔버스를 보장한다.
	이 캔버스는 화면에 보이지 않는다(CSS 가 #map .map canvas 를 display:none 한다).
	오직 toDataURL() 로 base64 를 뽑기 위한 오프스크린 버퍼다.
	react-three-fiber 캔버스와는 무관하다.
*/
window.MapGen.ensureCanvas = function(){
	try{
		var wrap = window.MapGen.wrap()
		if(!wrap){
			return null
		}
		var canvas = wrap.querySelector("canvas")
		if(!canvas){
			canvas = document.createElement("canvas")
			canvas.style.display = "none"
			wrap.appendChild(canvas)
		}
		var side = window.MapGen.side
		var scale = window.MapGen.scale
		if(canvas.width !== side * scale){
			canvas.width = side * scale
		}
		if(canvas.height !== side * scale){
			canvas.height = side * scale
		}
		window.MapGen.image()
		return canvas
	}catch(err){
		console.log("[mapgen] ensureCanvas err", err)
		return null
	}
}
/*
	개발 Part 16 (미니맵)
	평면화에 쓸 타일 목록을 확보한다.
	react-three-fiber 가 그리는 타일과 완전히 같은 원본을 쓰므로
	2D 결과와 3D 화면이 항상 일치한다.
	소스 우선순위
	  1) MapGen.tiles      apply() 가 window.Fields(hash).tiles 를 보관한 것
	  2) window.map.biomes apply() 가 좌표 키로 펼쳐 넣은 것
	                       (crc32 키로 들어간 바이옴 장식 마커는 biome 속성이 없어 걸러진다)
	  3) VoronoiCore.build 위 둘이 모두 비면 해시로 직접 재생성
	3) 이 있으므로 window.Fields 가 실패해도 미니맵은 그려진다.
	반환 : [{ x, z, biome, water }]
*/
window.MapGen.tilesOf = function(){
	var out = []
	var key, t
	var push = function(t){
		if(!t){
			return
		}
		if(typeof t.x == "undefined" || typeof t.z == "undefined"){
			return
		}
		if(!t.biome){
			return
		}
		out.push({
			x : t.x * 1,
			z : t.z * 1,
			biome : String(t.biome).replace("#", ""),
			water : t.water ? true : false
		})
	}
	var src = window.MapGen.tiles
	if(src){
		for(key in src){
			if(src.hasOwnProperty(key)){
				push(src[key])
			}
		}
	}
	if(out.length){
		return out
	}
	try{
		src = (window.map && window.map.biomes) ? window.map.biomes : null
	}catch(err){
		src = null
	}
	if(src){
		for(key in src){
			if(src.hasOwnProperty(key)){
				push(src[key])
			}
		}
	}
	if(out.length){
		return out
	}
	var target = null
	try{
		target = window.MapGen.target()
	}catch(err){
		target = null
	}
	if(!target || !target.hash){
		return out
	}
	if(typeof window.VoronoiCore == "undefined" || !window.VoronoiCore){
		if(!window.MapGen.__noCoreWarned){
			window.MapGen.__noCoreWarned = true
			console.log("[mapgen] window.VoronoiCore not found. minimap needs it.")
		}
		return out
	}
	try{
		var board = window.FieldsBoard ? window.FieldsBoard : {
			side : 100,
			width : 400,
			height : 400,
			islandShape : "radial",
			islandFactor : 1.07,
			lakeThreshold : 0.3,
			riverChance : 120
		}
		var result = window.VoronoiCore.build({
			hash : target.hash,
			side : board.side,
			width : board.width,
			height : board.height,
			islandShape : board.islandShape,
			islandFactor : board.islandFactor,
			lakeThreshold : board.lakeThreshold,
			riverChance : board.riverChance
		})
		if(result && result.tiles){
			window.MapGen.tiles = result.tiles
			for(key in result.tiles){
				if(result.tiles.hasOwnProperty(key)){
					push(result.tiles[key])
				}
			}
		}
	}catch(err){
		console.log("[mapgen] voronoi rebuild err", err)
	}
	return out
}
/*
	개발 Part 16 (미니맵)
	타일을 2D 로 평면화해 base64 문자열을 만든다.
	반환 : "data:image/png;base64,..." 또는 "" (실패)
	실패해도 예외를 밖으로 던지지 않는다. 미니맵은 부가 기능이므로
	여기서 터져 BoardCallback 의 3D 렌더 갱신을 막으면 안 된다.
*/
window.MapGen.paint = function(list){
	try{
		var tiles = (list && list.length) ? list : window.MapGen.tilesOf()
		if(!tiles || !tiles.length){
			return ""
		}
		if(typeof window.VoronoiCore === "undefined" || !window.VoronoiCore){
			return ""
		}
		var colors = window.Biomes ? window.Biomes : {}
		var scale = window.MapGen.scale
		return window.VoronoiCore.renderFlat(tiles, {
			scale : scale,
			colors : colors,
			waterColor : "#2a2a4a",
			landColor : "#6a6a6a"
		})
	}catch(err){
		console.log("[mapgen] paint err", err)
		return ""
	}
}
/*
	개발 Part 17 (미니맵)
	평면화 이미지의 타일 경계를 구한다.
	renderFlat 은 minX / minZ 를 원점으로 잡고 그리므로
	  픽셀 = ((x - minX) * scale, (z - minZ) * scale)
	가 된다. 이 값을 모르면 좌표 -> 화면 변환이 불가능하다.
	현행 문제
	  index.js 가 top : -((z*2)+100), left : -((x*2)+0) 이라는
	  하드코딩 상수를 썼다. 섬 크기 / side / scale 이 바뀌면 즉시 어긋난다.
*/
window.MapGen.boundsOf = function(){
	var key = window.MapGen.paintedKey ? window.MapGen.paintedKey : window.MapGen.key
	if(window.MapGen.bounds && window.MapGen.boundsKey === key){
		return window.MapGen.bounds
	}
	var tiles = window.MapGen.tilesOf()
	if(!tiles || !tiles.length){
		return null
	}
	var minX = Infinity
	var minZ = Infinity
	var maxX = -Infinity
	var maxZ = -Infinity
	for(var i = 0; i < tiles.length; i++){
		var t = tiles[i]
		if(t.x < minX){ minX = t.x }
		if(t.x > maxX){ maxX = t.x }
		if(t.z < minZ){ minZ = t.z }
		if(t.z > maxZ){ maxZ = t.z }
	}
	if(minX === Infinity){
		return null
	}
	var out = {
		minX : minX,
		minZ : minZ,
		maxX : maxX,
		maxZ : maxZ,
		width : (maxX - minX + 1) * window.MapGen.scale,
		height : (maxZ - minZ + 1) * window.MapGen.scale
	}
	window.MapGen.bounds = out
	window.MapGen.boundsKey = key
	return out
}
/*
	개발 Part 17 (미니맵)
	현재 좌표가 미니맵 뷰포트 정중앙에 오도록 .map 을 이동시킨다.
	인자를 생략하면 players.self() 좌표를 쓴다.
	보드 / 마이룸 양쪽에서 동일하게 쓴다.
	  보드   BoardCallback 이 폴링마다 호출
	  마이룸 RoomCallback 이 폴링마다 호출 (현행은 한 번도 호출하지 않았다)
	  클릭   Experience.onClick / RoomClick
	  줌     .voronoi 토글 직후 (컨테이너 크기가 바뀌므로 재계산)
*/
window.MapFocus = function(x, z){
	try{
		var wrap = window.MapGen.wrap()
		if(!wrap){
			return false
		}
		var bounds = window.MapGen.boundsOf()
		if(!bounds){
			return false
		}
		var _x = x
		var _z = z
		if(typeof _x == "undefined" || typeof _z == "undefined" || isNaN(_x) || isNaN(_z)){
			try{
				var p = window.players.self()
				_x = p.x
				_z = p.z
			}catch(err){
				return false
			}
		}
		_x = _x * 1
		_z = _z * 1
		if(isNaN(_x) || isNaN(_z)){
			return false
		}
		var scale = window.MapGen.scale
		var view = wrap.parentNode ? wrap.parentNode : wrap
		var vw = view.clientWidth ? view.clientWidth : 200
		var vh = view.clientHeight ? view.clientHeight : 200
		var left = Math.round((vw / 2) - ((_x - bounds.minX) * scale))
		var top = Math.round((vh / 2) - ((_z - bounds.minZ) * scale))
		wrap.style.left = left + "px"
		wrap.style.top = top + "px"
		window.MapGen.focus = { x : _x, z : _z, left : left, top : top }
		return true
	}catch(err){
		console.log("[mapgen] focus err", err)
		return false
	}
}
/*
	개발 Part 16 (미니맵)
	폴링마다 호출해도 안전한 동기화 진입점.
	  1) 이미 같은 키 / 같은 색상표로 만든 base64 가 있으면 문자열 비교만 하고 끝낸다.
	  2) 없으면 평면화해 만들고 #map 안 img[src] 에 넣는다.
	재그리기 조건
	  paintedKey  매치(또는 룸)가 바뀌었다
	  colorKey    window.Biomes 가 늦게 로드되어 색상표가 바뀌었다
	이 두 가지 덕분에 캔버스나 룰셋이 늦게 준비돼도 반드시 복구된다.
	반환 : base64 문자열 또는 ""
*/
window.MapGen.sync = function(){
	try{
		var target = window.MapGen.target()
		var key = target ? target.key : ""
		var colorKey = 0
		try{
			colorKey = window.Biomes ? Object.keys(window.Biomes).length : 0
		}catch(err){
			colorKey = 0
		}
		if(!window.MapGen.dataURL ||
			window.MapGen.paintedKey !== key ||
			window.MapGen.colorKey !== colorKey){
			var url = window.MapGen.paint(null)
			if(!url){
				return ""
			}
			window.MapGen.dataURL = url
			window.MapGen.paintedKey = key
			window.MapGen.colorKey = colorKey
		}
		var img = window.MapGen.image()
		if(img && img.src !== window.MapGen.dataURL){
			img.src = window.MapGen.dataURL
		}
		/*
			개발 Part 17 (미니맵)
			이미지가 새로 붙은 직후에는 위치가 초기값(0,0)이다.
			최초 진입 시 "지도가 현재 위치와 맞지 않는" 원인이 여기였다.
			base64 를 넣은 그 자리에서 바로 현재 좌표로 맞춘다.
		*/
		if(window.MapFocus){
			window.MapFocus()
		}
		return window.MapGen.dataURL
	}catch(err){
		console.log("[mapgen] sync err", err)
		return ""
	}
}
/*
	개발 Part 16 (미니맵)
	기존 호출부 호환. 캐시된 base64 를 돌려주고 없으면 만든다.
	호출부가 canvas.toDataURL() 을 직접 부르지 않게 해
	null.toDataURL() 예외 경로를 원천 제거한다.
*/
window.MapGen.toDataURL = function(){
	if(window.MapGen.dataURL){
		return window.MapGen.dataURL
	}
	return window.MapGen.sync()
}
/*
	개발 Part 16 (미니맵)
	콘솔 진단용.
	  window.MapGen.debug()
*/
window.MapGen.debug = function(){
	var t = null
	try{
		t = window.MapGen.target()
	}catch(err){
	}
	var tiles = window.MapGen.tilesOf()
	var out = {
		target : t,
		ready : window.MapGen.ready,
		core : (typeof window.VoronoiCore != "undefined" && window.VoronoiCore) ? true : false,
		tiles : tiles.length,
		colors : window.Biomes ? Object.keys(window.Biomes).length : 0,
		wrap : window.MapGen.wrap() ? true : false,
		img : window.MapGen.image() ? true : false,
		dataURL : window.MapGen.dataURL ? window.MapGen.dataURL.substr(0, 32) : ""
	}
	console.log("[mapgen] debug", out)
	return out
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