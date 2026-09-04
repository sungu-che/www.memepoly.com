var plant
var time = {
	balance : 600,
	zone : new Date().getTimezoneOffset()
}
var offset = -540

window.Snap = 0
if(typeof window.setFrameloop == "undefined"){
	window.frameloop = "never"
	window.setFrameloop = function(value){
		window.frameloop = value
	}
}

if(offset + 60 <= time.zone || offset - 60 >= time.zone || OAuth3.localhost){
	time.balance = 0
}

time.offset = time.zone * 60 * 1000

if(!OAuth3.isMobile){
	document.querySelector(".react .three").className = "three pc";
}

window.bingo = {}
window.sticker = {}

window.com = {}

window.Mode = function(cookies){
	cookies = cookies ? cookies : window.cookies

	if(!cookies){
		return "board"
	}

	var hash = window.location.hash.replace("#","").toLowerCase()

	if(!hash){
		return "board"
	}

	var owner = (cookies.address ? cookies.address : cookies.hash) + ""
		owner = owner.replace("0x","").toLowerCase()

	if(owner && hash == owner){
		return "room"
	}

	if(cookies.mode){
		return cookies.mode
	}

	return "board"
}

window.MapReset = function(){
	var biomes = (window.map && window.map.biomes) ? window.map.biomes : {}
	var dissolve = (window.map && window.map.dissolve) ? window.map.dissolve : {}
	window.map = {
		nonces : [],
		biomes : biomes,
		dissolve : dissolve,
		quest : {},
		score : {},
		open : {},
		item : {},
		thread : {},
		puzzle : {},
		follow : {},
		report : {},
		/* 개발 Part 8 : 차단 목록 */
		block : {},
		reward : {}
	}
	return window.map
}
/*
	개발 Part 14 (검수) - E6
	window.map 하위 컨테이너를 보장한다.
	현행 문제
	  MapGen.apply() 는 window.map 이 없을 때만 MapReset() 을 호출하고
	  그 뒤 biomes / dissolve 만 새 객체로 교체한다.
	  타깃 없음 / Fields 실패 / 이미 ready 인 경로에서는 return false 로
	  조기 이탈하므로 window.map 이 만들어지지 않거나 일부만 남는다.
	  그 상태로 BoardCallback 이
	    window.map.biomes[crc32키] = {...}
	    window.map.nonces[crc32키] = {...}
	  를 실행하면
	    TypeError: Cannot set properties of undefined (setting '2TPHPJV')
	  가 발생한다(2TPHPJV 는 crc32(...).toString(32).toUpperCase() 형식).
	  이 예외는 biomes.forEach 안에서 터지므로 그 뒤의
	  players.set / assets.set / setFrameloop 이 전부 실행되지 않고
	  화면이 갱신을 멈춘다.
	MapReset 을 쓰지 않는 이유
	  MapReset 은 open / puzzle / score / reward 등 진행 상태를 전부 비운다.
	  폴링마다 호출하면 방금 받은 데이터가 사라진다.
	  여기서는 "없는 것만 만든다".
*/
window.MapGuard = function(){
	if(!window.map){
		return window.MapReset()
	}
	var m = window.map
	if(!m.nonces){
		m.nonces = []
	}
	var keys = [
		"biomes", "dissolve", "quest", "score", "open",
		"item", "thread", "puzzle", "follow", "report",
		"block", "reward"
	]
	for(var i = 0; i < keys.length; i++){
		if(!m[keys[i]]){
			m[keys[i]] = {}
		}
	}
	return m
}

window.CanFreeMove = function(){
	var cookies = window.cookies
	if(!cookies){
		return false
	}
	/*
		개발 Part 15 (규칙 R3)
		개발 Part 14 (검수) - G3 의 판정을 원복한다.
		G3 에서 "!enter 는 자유 이동" 으로 바꿨으나
		규칙상 그것이 잘못이었다.
		확정 규칙
		  레이드 미참가(enter 없음)
		    보드게임 모드. 링(edge) 위를 주사위로만 전진한다.
		    클릭/터치 자유 이동은 금지한다.
		  레이드 참가(enter 있음)
		    링 밖 내륙 탐색. 자유 이동을 허용한다.
		  감옥(jail / onJail)
		    안전지대. 어느 모드든 자유 이동을 허용한다.
		  사망(damage / dead)
		    이동 금지.
		  주사위 진행 중(dice > 0)
		    자동 이동에 맡기고 수동 이동을 막는다.
	*/
	if(cookies.damage || cookies.dead){
		return false
	}
	var _dice = cookies.dice * 1
	if(!isNaN(_dice) && _dice > 0){
		return false
	}
	/*
		개발 Part 30 (역할별 이동)
		현행 문제 두 가지.
		1) cookies.jail 을 무조건 통과시켰다.
		   jail 은 participation 의 is_jailed 이며 #start / 탈출 / MIA 전까지
		   꺼지지 않는 영구 플래그다.
		   감옥 칸을 한 번 밟으면 그 판 내내 어디서든 자유 이동이 되어
		   "링은 주사위 전용" 규칙이 무너졌다.
		   위치 판정은 onJail(지금 서 있는 칸이 감옥) 하나로 충분하다.
		   jail 은 "이번 판에 감옥을 거쳤다" 는 기록으로만 남긴다.
		2) 마지막 판정 근거가 enter 였다.
		   enter 는 UCAV 를 위해 붙인 조건인데 PMC 에도 그대로 적용되어
		   출격한 PMC 가 링 위에서 조이스틱으로 걸어 다녔다.
		확정 규칙
		  onJail   감옥 칸. 안전지대이자 필드 진입점. 자유 이동 허용.
		  UCAV     내륙 전용 유닛. 출격 중이면 자유 이동.
		  PMC      링 위면 주사위 전용. 내륙이면 자유 이동.
		  그 외    미출격이면 보드게임 모드(주사위 전용).
	*/
	if(cookies.onJail){
		return true
	}
	var _role = cookies.role ? cookies.role : ""
	if(_role == "UCAV"){
		return cookies.enter ? true : false
	}
	if(!cookies.enter){
		/* 보드게임 모드. 주사위 전용 */
		return false
	}
	if(_role == "PMC"){
		/*
			링이 확정되기 전에는 판정할 수 없다.
			이때 허용하면 로딩 중 자유 이동으로 링을 벗어나
			서버가 좌표를 되돌리며 캐릭터가 튄다. 보수적으로 막는다.
		*/
		if(!window.EdgeReady || !window.EdgeReady()){
			return false
		}
		try{
			var _me = window.players.self()
			return window.IsEdge(_me.x, _me.z) ? false : true
		}catch(err){
			return false
		}
	}
	return true
}
/*
	개발 Part 15 (규칙 R3)
	현재 좌표가 링(edge) 위인지 판정한다.
	window.fields 는 Experience.jsx 의 FieldsSync() 가 채우는
	해안 링 배열이며, 좌표 키("x:z")로도 접근된다.
	서버 isEdgeField 와 같은 기준이다.
*/
/*
	개발 Part 18 (Edge 판정)
	주사위 경로(링) 판정의 단일 원천을 프론트로 확정한다.
	근거
	  링 회전(progress splice), 다음 칸 계산(window.Roll), 이동 허용(CanFreeMove),
	  주사위 노출(CanRollDice) 이 전부 프론트의 window.fields 를 본다.
	  서버 fields 는 board_tiles(ring_index) 기반이라 같은 값이어야 하지만,
	  판정 주체가 둘이면 한쪽만 어긋나도 "굴릴 수 있는데 못 굴리는" 상태가 된다.
	  그래서 프론트가 판정하고, 그 결과를 query.edge 로 서버에 실어 보낸다.
	EdgeReady()
	  window.fields 가 진짜 링(coastRing)인지 확인한다.
	  최초 진입에는 FieldsSerpentine(전 좌표 격자)이 들어오므로
	  이때 IsEdge 가 true 를 남발하면 "어디서나 주사위" 가 된다.
	EdgeField()
	  링 칸 객체를 그대로 돌려준다. gate / jail / item 판정에 쓴다.
*/
window.EdgeReady = function(){
	try{
		var f = window.fields
		if(!f || !f.length){
			return false
		}
		return f.ring ? true : false
	}catch(err){
		return false
	}
}
window.EdgeField = function(_x, _z){
	try{
		if(!window.EdgeReady()){
			return null
		}
		var f = window.fields[(_x * 1) + ":" + (_z * 1)]
		return f ? f : null
	}catch(err){
		return null
	}
}
window.IsEdge = function(_x, _z){
	return window.EdgeField(_x, _z) ? true : false
}
/*
	개발 Part 15 (규칙 R3)
	주사위를 굴릴 수 있는 상태인가.
	링 위 + 레이드 미참가 + 미사망 + 진행 중 아님.
*/
window.CanRollDice = function(){
	var cookies = window.cookies
	if(!cookies){
		return false
	}
	if(cookies.damage || cookies.dead){
		return false
	}
	var _dice = cookies.dice * 1
	if(!isNaN(_dice) && _dice > 0){
		return false
	}
	var player = null
	try{
		player = window.players.self()
	}catch(err){
		return false
	}
	if(!player){
		return false
	}
	/*
		개발 Part 30 (역할)
		UCAV 는 어떤 칸에서도 주사위를 굴리지 않는다.
		서버 index.js 의 diceBlocked="UCAV" 와 같은 판정이다.
		(이 함수는 현재 호출부가 없지만, 판정 기준이 갈리면
		 나중에 붙일 때 그대로 버그가 된다)
	*/
	if(cookies.role == "UCAV" && cookies.enter){
		return false
	}
	return window.IsEdge(player.x, player.z)
}

window.BiomeAt = function(_x, _z){
	try{
		var b = window.map.biomes[_x+":"+_z]
		if(b){
			if(b.biome){
				return "#"+b.biome
			}
		}
	}catch(err){
	}
	return ""
}
/*
	개발 Part 17 (규칙 R6)
	목표 좌표로 들어갈 수 있는가.
	CanFreeMove() 는 "지금 자유 이동이 가능한가"(상태 판정)이고
	CanMoveTo() 는 "그 칸에 들어가도 되는가"(좌표 판정)이다. 둘은 다르다.
	규칙
	  UCAV  링(edge) 진입 금지. 내륙 전용 유닛이다.
	        링은 주사위 경로이자 안전지대이므로 드론이 올라오면
	        서버가 되돌려 보내 좌표가 튄다. 애초에 못 들어가게 막는다.
	  그 외 제한 없음.
*/
window.CanMoveTo = function(_x, _z){
	var cookies = window.cookies
	if(!cookies){
		return false
	}
	if(cookies.role == "UCAV" && cookies.enter){
		if(window.IsEdge(_x, _z)){
			return false
		}
	}
	return true
}
/*
	개발 Part 17 (식량)
	파밍한 음식 / 음료를 먹을 수 있는지 판정한다.
	장비 소모품(🧪)은 typeof_equipment 가 담당하므로 여기서는 제외한다.
	회복량은 서버 index.js 의 FOOD_HEAL 과 동일한 표를 쓴다.
	(프론트는 "먹을 수 있는가 / 만피인가" 만 보고, 실제 회복은 서버가 확정한다)
*/
window.FoodSubgroups = [
	"food-fruit", "food-vegetable", "food-marine",
	"drink", "food-sweet",
	"food-prepared", "food-asian"
]
window.typeof_food = function(icon){
	if(!icon){
		return false
	}
	var _items = window.items ? window.items : (typeof items != "undefined" ? items : [])
	for(var i = 0; i < _items.length; i++){
		var item = _items[i]
		if(item.char == icon){
			if(window.FoodSubgroups.indexOf(item.subgroup) > -1){
				return item
			}
			return false
		}
	}
	return false
}
window.FoodHeal = function(icon){
	var item = window.typeof_food(icon)
	if(!item){
		return 0
	}
	if(item.subgroup == "food-prepared" || item.subgroup == "food-asian"){
		return 3
	}
	if(item.subgroup == "drink" || item.subgroup == "food-sweet"){
		return 2
	}
	return 1
}
/*
	개발 Part 14 (검수) - G2
	cookies.axis 를 파싱한다.
	서버는 axis 의 y 에 캐릭터 높이 오프셋(+1)을 더해 저장한다.
	  state.tile.y   0.010820952412578966   실제 지형 높이
	  cookies.axis   "-5.5,1.0108209524125789,-39.5"
	  차이가 정확히 1 이다.
	프론트는 이 값을 지형 높이로 그대로 써서
	바이옴 테이블에 좌표가 없는 순간(MapGen 미적용 / 매치 전환 직후)
	캐릭터가 1 유닛 공중에 떠 보였다.
	우선순위
	  1) window.map.biomes 의 실측 높이
	  2) window.State.tile.y (서버 DTO. 오프셋 없는 원본)
	  3) axis y - 1 (오프셋 보정)
	  4) 0
	반환값 y 는 항상 "지형 표면 높이" 다.
	카메라/캐릭터 오프셋은 호출부가 더한다.
*/
window.AxisParse = function(raw){
	var out = { x : null, y : 0, z : null, ok : false }
	if(!raw){
		return out
	}
	var parts = String(raw).split(",")
	if(parts.length < 3){
		return out
	}
	var x = parts[0] * 1
	var z = parts[2] * 1
	if(isNaN(x) || isNaN(z)){
		return out
	}
	out.x = x
	out.z = z
	out.ok = true
	var b = null
	try{
		b = (window.map && window.map.biomes) ? window.map.biomes[x + ":" + z] : null
	}catch(err){
		b = null
	}
	if(b && typeof b.y !== "undefined"){
		out.y = b.y * 1
		out.source = "biome"
		return out
	}
	try{
		if(window.State && window.State.tile){
			var t = window.State.tile
			if(t.x === x && t.z === z && typeof t.y !== "undefined"){
				out.y = t.y * 1
				out.source = "state"
				return out
			}
		}
	}catch(err){
	}
	var raw_y = parts[1] * 1
	if(!isNaN(raw_y)){
		/*
			서버 오프셋 보정.
			raw_y 가 1 이상이면 오프셋이 더해진 값으로 본다.
			섬 최고 표고가 1 을 넘지 않는 현행 지형 스케일을 전제로 한다.
		*/
		out.y = raw_y >= 1 ? (raw_y - 1) : raw_y
		out.source = "axis"
		return out
	}
	out.source = "zero"
	return out
}

window.far = {
	x : 4.5,
	y : 5.5,
	z : 4.5
}
window.far.set = function(){}

window.grid = []
window.grid.size = 40
window.grid.edge = 10 - 1
window.grid.x = window.grid.size
window.grid.z = window.grid.size
window.grid.center = "#000"
window.grid.line = "#000"
window.grid.set = function(){}

window.selector = {}
window.selector.set = function(){}

window.dpr = 1
window.setDpr = function(){}

window.effect = true
window.setEffect = function(){}

window.Zoom = function(){
	var $zoom = $(".zoom_toggle a.zoom")

	if(!$zoom.length){
		return
	}

	if(!$zoom.hasClass("color")){
		return
	}

	$zoom.removeClass("color")

	var _far = window.far

	_far.x = 4.5
	_far.y = 5.5
	_far.z = 4.5

	window.speed = 0.1

	if(window.far.set){
		window.far.set(_far)
	}

	if(window.setDpr){
		window.setDpr(OAuth3.isMobile ? 0.8 : 1)
	}

	$("body").removeAttr("zoom")
	$("body").removeAttr("class")
}

window.Callback = async function(resp){
	/*
		개발 Part 22 (룩어헤드 격리)
		window.response 가 더 이상 저장되지 않으므로
		null/undefined 가 들어올 수 있다.
	*/
	if(!resp || !resp.body || !resp.body.cookies){
		return
	}
	var _cookies
	try{
		_cookies = JSON.parse(resp.body.cookies)
	}catch(err){
		_cookies = window.cookies
	}
	/*
		개발 Part 12
		서버가 rows[] 와 함께 도메인 DTO(state)를 보낸다.
		여기서 흡수해 window.State 에 보관한다.
		화면 로직은 아직 rows[] 를 쓰지만, 전환된 부분부터
		window.State 를 읽는다.
	*/
	try{
		if(window.StateApply){
			window.StateApply(resp)
		}
	}catch(err){
		console.log("state apply err", err)
	}
	var mode = window.Mode(_cookies)
	$("body").attr("world", mode)
	/*
		개발 Part 18 (HUD)
		#flag(레드/블루 깃발 카운터)는 보드게임 전용 지표다.
		현행 문제
		  BoardCallback 만 $("#flag ."+team).addClass("on") 을 하고
		  룸으로 넘어갈 때 해제하는 코드가 어디에도 없었다.
		  그래서 마이룸에서도 카운터가 그대로 떠 있었다.
		display 를 빈 문자열로 되돌리는 이유
		  .show() 는 display:block 을 강제해 CSS 의 flex 레이아웃을 깬다.
		  인라인 스타일만 지워 원래 CSS 값으로 복귀시킨다.
	*/
	try{
		if(mode == "room"){
			$("#flag").removeClass("on").css("display", "none")
			$("#flag .red, #flag .blue").removeClass("on")
		}else{
			$("#flag").css("display", "")
		}
	}catch(err){
	}
	try{
		if(window.setEffect){
			if(window.effect != (mode == "room")){
				window.setEffect(mode == "room")
			}
		}
	}catch(err){
	}
	if(mode == "room"){
		if(window.RoomCallback){
			return await window.RoomCallback(resp)
		}
		return
	}

	if(window.BoardCallback){
		return await window.BoardCallback(resp)
	}
}

window.Poll = async function(){
	var mode = window.Mode()

	if(mode == "room"){
		if(window.RoomPoll){
			return await window.RoomPoll()
		}

		return
	}

	if(window.BoardPoll){
		return await window.BoardPoll()
	}
}

window.Init = function(cookies){
	var mode = window.Mode(cookies)

	if(!window.Init.done){
		window.Init.done = {}
	}

	window.Init.mode = mode

	if(window.Init.done[mode]){
		return
	}

	window.Init.done[mode] = true

	if(mode == "room"){
		if(window.RoomInit){
			window.RoomInit(cookies)
		}

		return
	}

	if(window.BoardInit){
		window.BoardInit(cookies)
	}
}

window.Init.done = {}

window.Chat = function(flow, date){
	if(window.Mode() == "room"){
		if(window.RoomChat){
			return window.RoomChat(flow, date)
		}

		return
	}

	if(window.BoardChat){
		return window.BoardChat(flow, date)
	}
}

window.onhashchange = function(e){
	var mode = window.Mode()
	$("body").attr("world", mode)
	/*
		개발 Part 17 (스폰)
		보드 <-> 마이룸 / 포털 이동은 좌표가 통째로 바뀐다.
		lerp 로 기어가면 지도를 가로질러 날아가는 연출이 된다.
	*/
	window.Snap = 8
	try{
		if(window.RolePanel){
			window.RolePanel.close()
		}
	}catch(err){
	}

	$("#myroom").removeClass("on")
	$("body").removeAttr("myroom")

	if(mode == "room"){
		if(window.RoomHashChange){
			window.RoomHashChange(e)
		}
	}else{
		if(window.BoardHashChange){
			window.BoardHashChange(e)
		}
	}

	try{
		window.Init(window.cookies)
	}catch(err){
		console.log("init err",err);
	}
}

function Respawn(){
	var cookies = window.cookies
	if(window.MapGen && !window.MapGen.ready){
		window.MapGen.apply()
	}
	var position
	/*
		개발 Part 14 (검수) - E11
		Fields() 를 맨몸으로 호출하면
		src/fields.js 보다 먼저 실행되는 경로에서 ReferenceError 가 난다.
		Respawn 은 players.self() 가 부르고, players.self() 는
		BoardInit 클릭 핸들러 등 이른 시점에도 호출된다.
		window.Fields 존재를 확인하고, 없으면 빈 배열로 진행한다.
		(아래 루프가 fields[0] 폴백을 갖고 있어 안전하다)
	*/
	var fields = window.fields
	if(!fields || !fields.length){
		fields = (typeof window.Fields === "function") ? window.Fields() : []
	}
	if(cookies.axis){
		/*
			개발 Part 14 (검수) - G2
			현행은 window.map.biomes 에 좌표가 없으면
			position 을 아예 만들지 않아 저장된 좌표를 버리고
			랜덤 스폰으로 빠졌다.
			매치 전환 직후 / MapGen 미적용 시점에 매번 발생해
			캐릭터가 엉뚱한 곳에서 시작했다.
			AxisParse 는 바이옴이 없어도 State DTO 나 오프셋 보정으로
			항상 좌표를 돌려준다.
		*/
		var _ax = window.AxisParse(cookies.axis)
		if(_ax.ok){
			position = {
				x : _ax.x,
				y : _ax.y,
				z : _ax.z
			}
		}
	}
	if(!position){
		var r, b
		for(var i = 0; i < fields.length; i++){
			r = fields[Math.floor(Math.random() * fields.length)]
			b = window.map.biomes[`${r.x}:${r.z}`]

			if(b){
				if(!b.water){
					break
				}
			}
		}

		if(!r){
			r = fields[0]
		}

		if(!b){
			b = { y : 0.5 }
		}

		position = {
			x : r.x,
			y : b.y,
			z : r.z
		}
	}

	return position
}

function nFormatter(num, digits) {
	const lookup = [
		{ value: 1, symbol: "" },
		{ value: 1e3, symbol: "k" },
		{ value: 1e6, symbol: "M" },
		{ value: 1e9, symbol: "G" },
		{ value: 1e12, symbol: "T" },
		{ value: 1e15, symbol: "P" },
		{ value: 1e18, symbol: "E" }
	];
	const regexp = /\.0+$|(?<=\.[0-9]*[1-9])0+$/;
	const item = lookup.findLast(item => num >= item.value);
	return item ? (num / item.value).toFixed(digits).replace(regexp, "").concat(item.symbol) : "0";
}


window.emojiUnicode = function(input) {
	return emojiUnicode.raw(input).split(' ').map(val => parseInt(val).toString(16)).join('_')
}

window.emojiUnicode.raw = function (input) {
	if (input.length === 1) {
		return input.charCodeAt(0).toString();
	}
	else if (input.length > 1) {
		const pairs = [];
		for (var i = 0; i < input.length; i++) {
			if (
				// high surrogate
				input.charCodeAt(i) >= 0xd800 && input.charCodeAt(i) <= 0xdbff
			) {
				if (
					input.charCodeAt(i + 1) >= 0xdc00 && input.charCodeAt(i + 1) <= 0xdfff
				) {
					// low surrogate
					pairs.push(
						(input.charCodeAt(i) - 0xd800) * 0x400
					  + (input.charCodeAt(i + 1) - 0xdc00) + 0x10000
					);
				}
			} else if (input.charCodeAt(i) < 0xd800 || input.charCodeAt(i) > 0xdfff) {
				// modifiers and joiners
				pairs.push(input.charCodeAt(i))
			}
		}
		return pairs.join(' ');
	}

	return '';
};

window.emojis.self = "😀"

window.Subscribe = function(){
	var $form = document.querySelector('form[name="memepoly.com"]');

	if(OAuth3.xhr){
		OAuth3.xhr.abort()
		delete OAuth3.xhr
	}

	var vapid = $form.vapid.value

	var body = {
		emoji : window.emojis.self,
		cc : "vapid",
		vapid : vapid
	}

	var query = {
		href : window.location.href,
		hash : window.cookies.hash,
		token : window.cookies.token,
		x : window.current.current.position.x,
		y : window.Mode() == "room" ? 0 : window.current.current.position.y,
		z : window.current.current.position.z
	}

	var url = "https://memepoly.com";

	if(OAuth3.localhost){
		url = "http://localhost:3001"
	}

	OAuth3.xhr = OAuth3.fetch({
		method : "POST",
		url : url,
		query : query,
		body : body
	}, function(res){
		if(OAuth3.xhr){
			OAuth3.xhr.abort()
			delete OAuth3.xhr
		}

		var cookies = JSON.parse(res.body.cookies)

		if(cookies.vapid){
			var $submit = $form.querySelector('input[type="submit"]')

			$submit.setAttribute('readonly','readonly')
			$submit.value = "close"
		}
	});
}

window.listToBiomes = function(){
	/* MapGen.apply() 가 window.map.biomes 를 채운다.
	   호출부 호환을 위해 현재 타일 배열만 돌려준다. */
	/*
		개발 Part 14 (검수) - E10
		window.map.biomes 에는 이질적인 두 종류가 섞여 있다.
		  좌표 키   "-5.5:-39.5"
		            { biome, elevation, water, ocean, coast, x, y, z }
		            MapGen.apply() 가 생산. 실제 지형 타일.
		  crc32 키  "2TPHPJV"
		            { id, hash, name, value, color, x, y, z }
		            BoardCallback 장식 블록이 생산. 바이옴 장식 마커.
		현행은 둘을 구분하지 않고 전부 배열에 담았다.
		장식 항목은 item.biome 이 없고 item.name 이 "#BEACH" 형식이라
		렌더 루프의
		  window.Biomes["#" + b.biome]
		가 "#undefined" 를 조회해 색상이 undefined 가 되고,
		Experience.jsx 의 Asset 이 window.Biomes[props.name] 미존재로
		빈 group 을 렌더해 맵에 구멍이 생겼다.
		또한 biomes.x / y / z (카메라 기준점)가 장식 항목 좌표로 잡힐 수 있어
		시야 범위 계산이 어긋났다.
		여기서는 biome 속성을 가진 좌표 타일만 반환한다.
		장식은 window.map.biomes 에 그대로 남아
		BoardCallback 의 isBiome 중복 판정에 계속 쓰인다.
	*/
	var biomes = []
	if(!window.map || !window.map.biomes){
		return biomes
	}
	for(var key in window.map.biomes){
		if(window.map.biomes.hasOwnProperty(key)){
			var item = window.map.biomes[key]
			if(!item || typeof item.x == "undefined"){
				continue
			}
			if(typeof item.z == "undefined"){
				continue
			}
			/* 장식 마커 제외. 지형 타일만 통과시킨다 */
			if(!item.biome){
				continue
			}
			if(typeof biomes.x == "undefined" && !item.water){
				biomes.x = item.x
				biomes.y = item.y
				biomes.z = item.z
			}
			biomes.push(item)
		}
	}
	return biomes
}

/*
	개발 Part 3
	PropertyCost / PropertyToll / PropertyType / PropertyLevelEmoji /
	PropertyMaterials / Recipes / MaxHp / Biomes 정의를 제거한다.

	이유
	  src/recipe.js 가 이미 동일 값을 정의하고 있어 로드 순서에 따라
	  서로를 덮어쓰는 구조였다. 단일 진실 원천은 서버 DB 룰셋이며,
	  src/ruleset.js 가 /ruleset 응답으로 window 전역을 채운다.

	폴백
	  서버 룰셋 로드에 실패하면 src/recipe.js 의 정적 정의가 남아 동작한다.
	  Biomes 색상 맵도 src/ruleset.js 가 biomeColors 로 덮어쓴다.
	  로드 실패 시를 대비해 색상 맵만 최소 기본값으로 남긴다.
*/
if(typeof window.Biomes == "undefined"){
	window.Biomes = {
		"#OCEAN": "#44447a",
		"#44447a" : "",
		"#COAST": "#33335a",
		"#33335a" : "",
		"#LAKESHORE": "#225588",
		"#225588" : "",
		"#LAKE": "#336699",
		"#336699" : "",
		"#RIVER": "#225588",
		"#MARSH": "#2f6666",
		"#2f6666" : "",
		"#ICE": "#99ffff",
		"#99ffff" : "❄",
		"#BEACH": "#a09077",
		"#a09077" : "🌴",
		"#ROAD1": "#442211",
		"#442211" : "📦",
		"#ROAD2": "#553322",
		"#553322" : "📦",
		"#ROAD3": "#664433",
		"#664433" : "📦",
		"#BRIDGE": "#686860",
		"#686860" : "📦",
		"#LAVA": "#cc3333",
		"#cc3333" : "🪨",
		"#SNOW": "#ffffff",
		"#ffffff" : "❄",
		"#TUNDRA": "#bbbbaa",
		"#bbbbaa" : "🪨",
		"#BARE": "#888888",
		"#888888" : "🪨",
		"#SCORCHED": "#555555",
		"#555555" : "🪨",
		"#TAIGA": "#99aa77",
		"#99aa77" : "🎄",
		"#SHRUBLAND": "#889977",
		"#889977" : "🌾",
		"#TEMPERATE_DESERT": "#c9d29b",
		"#c9d29b" : "🌵",
		"#TEMPERATE_RAIN_FOREST": "#448855",
		"#448855" : "🌳",
		"#TEMPERATE_DECIDUOUS_FOREST": "#679459",
		"#679459" : "🌾",
		"#GRASSLAND": "#88aa55",
		"#88aa55" : "🌾",
		"#SUBTROPICAL_DESERT": "#d2b98b",
		"#d2b98b" : "🛢",
		"#TROPICAL_RAIN_FOREST": "#337755",
		"#337755" : "🌳",
		"#TROPICAL_SEASONAL_FOREST": "#559944",
		"#559944" : "🌳"
	}
}

/*
	개발 Part 4
	match 가 null 일 때 .length 접근으로 TypeError 를 던지던 버그를 해소한다.
	서버가 rows[].Cc 를 컬럼에서 "조립"해 내려주므로 포맷은 안정적이다.
	개발 Part 12 에서 프론트가 DTO 를 직접 읽게 되면 이 함수를 제거한다.
*/
function getHashtag(str){
	if(!str){
		return ""
	}
	var hashtags = String(str).match(/\B#[A-Za-z0-9\-\.\_]+\b/g)
	if(!hashtags || !hashtags.length){
		return ""
	}
	return hashtags[0]
}


/*
	개발 Part 4
	youtu.be 분기가 id 에 "/watch?v=" 를 넣어 썸네일 URL 이 깨지던 버그를 해소한다.
	서버 services/oembedService.js 와 동일 규칙으로 맞춘다.
*/
window.oembed = function(url){
	var id = ""
	var provider = ""
	var src = ""
	if(!url || !url.host){
		return { id : "", host : "", provider : "", src : "" }
	}
	if(url.host.indexOf("youtube.com") > -1){
		provider = "youtube"
		if(url.pathname.indexOf("/shorts/") > -1){
			id = url.pathname.replace("/shorts/","")
		}else{
			id = url.searchParams.get("v") || ""
		}
		if(id){
			src = 'https://i.ytimg.com/vi/'+id+'/default.jpg'
		}
	}
	if(url.host.indexOf("youtu.be") > -1){
		provider = "youtube"
		id = url.pathname.replace("/shorts/","").replace("/","")
		if(id){
			src = 'https://i.ytimg.com/vi/'+id+'/default.jpg'
		}
	}
	return {
		id : id,
		host : url.host,
		provider : provider,
		src : src
	}
}

window.typeof_emoji = function(icon){
	for(var i = 0; i < window.emojis.length; i++){
		var emoji = window.emojis[i];

		if(emoji.icon == icon){
			if(emoji.webp){
				return emoji.type
			}else{
				return false
			}
		}
	}

	return false
}

window.typeof_shield = function(icon){
	for(var i = 0; i < items.length; i++){
		var item = items[i];
		if(item.char == icon && item.subgroup == "equipment-consumable" && item.shield){
			return item
		}
	}
	return false
}
window.typeof_item = function(icon){
	if(window.typeof_shield(icon)){
		return false
	}
	for(var i = 0; i < items.length; i++){
		var item = items[i];
		if(item.char == icon){
			return item.name
		}
	}
	return false
}
window.typeof_equipment = function(icon){
	for(var i = 0; i < items.length; i++){
		var item = items[i];
		if(item.char == icon && (item.subgroup == "equipment-armor" || item.subgroup == "equipment-weapon" || item.subgroup == "equipment-tool" || item.subgroup == "equipment-consumable")){
			return item
		}
	}
	return false
}
window.typeof_role = function(icon, role){
	if(icon == "⚔"){
		return "PMC"
	}
	if(icon == "🗡"){
		return "SCAV"
	}
	if(icon == "🛩"){
		return "UCAV"
	}
	return role ? role : ""
}
window.isItem = function(icon){
	for(var i = 0; i < window.items.length; i++){
		var item = window.items[i];

		if(item.char == icon){
			return emoji.type
		}
	}

	return false
}

function padToBytes32 (n) {
	while (n.length < 40) {
		n = "0" + n;
	}
	return "0x" + n;
}

window.numStringToBytes32 = function(num) { 
	var bn = new BN(num).toTwos(256);
	return padToBytes32(bn.toString(16));
}

window.bytes32ToNumString = function(bytes32str) {
	bytes32str = bytes32str.replace(/^0x/, '');
	var bn = new BN(bytes32str, 16).fromTwos(256);
	return bn.toString();
}

window.randomHash = function(){
	var account = ethers.Wallet.createRandom()
	return account.address.toLowerCase()
}
/*
	개발 Part 14 (검수) - E7
	blockies.create() 는 시드가 비었거나 형식이 어긋나면 null 을 반환한다.
	현행은 반환값을 검증하지 않고 바로 .toDataURL() 을 호출해
	  TypeError: Cannot read properties of null (reading 'toDataURL')
	로 BoardCallback 이 중단됐다.
	시드 정규화
	  0x 접두를 강제로 붙인다. 서버가 내려주는 식별자가
	  hash(40자) / address(0x+40자) / nonce(0x+40자) 로 섞여 있다.
	  40자 hex 가 아니면 결정론 폴백 시드를 만들어 최소한 그림은 나오게 한다.
*/
window.BlockieSeed = function(seed){
	var s = (typeof seed === "undefined" || seed === null) ? "" : String(seed)
	s = s.trim().toLowerCase()
	if(s.indexOf("0x") === 0){
		s = s.substr(2)
	}
	s = s.replace(/[^0-9a-f]/g, "")
	if(!s.length){
		/*
			개발 Part 14 (검수) - E7'
			시드를 특정할 수 없어도 null 을 돌려주지 않는다.
			null 을 돌려주면 호출부가 .toDataURL() 로 다시 터진다.
			고정 폴백 시드로 회색 계열 아이콘을 만들어 넘긴다.
		*/
		return "0x0000000000000000000000000000000000000000"
	}
	while(s.length < 40){
		s += s
	}
	return "0x" + s.substr(0, 40)
}
/*
	개발 Part 14 (검수) - E7'
	blockies 전역을 래핑한다.
	Part 26-2 에서 헬퍼를 만들고 3 곳을 치환했으나
	  index.js:2844:91  Cannot read properties of null (reading 'toDataURL')
	가 계속 발생했다. 치환하지 못한 blockies.create() 직접 호출이
	BoardCallback 안에 남아 있다는 뜻이다.
	후보가 #link / #portal / _players 아이콘 루프 / follow 목록 /
	score_board 랭킹 / capture 아이콘 등 10 곳 이상이고
	일부는 한 줄 인라인 + .toDataURL() 체인이라
	호출부를 하나씩 찾는 방식으로는 다음 폴링에서 또 터진다.
	원본 create 를 감싸 아래를 보장한다.
	  1) 시드를 BlockieSeed 로 정규화한다.
	  2) 절대 null 을 반환하지 않는다.
	     실패 시 toDataURL 을 가진 대체 캔버스를 돌려준다.
	이렇게 하면 남은 직접 호출도 전부 안전해진다.
*/
if(typeof blockies !== "undefined" && blockies && !blockies.__wrapped){
	var _blockiesCreate = blockies.create
	var _blockieFallback = null
	var _blockieFallbackCanvas = function(){
		if(_blockieFallback){
			return _blockieFallback
		}
		try{
			var c = document.createElement("canvas")
			c.width = 8
			c.height = 8
			var g = c.getContext("2d")
			g.fillStyle = "#333"
			g.fillRect(0, 0, 8, 8)
			_blockieFallback = c
		}catch(err){
			/*
				canvas 조차 만들 수 없는 환경.
				toDataURL 을 가진 최소 객체를 돌려준다.
			*/
			_blockieFallback = {
				width : 8,
				height : 8,
				toDataURL : function(){ return "" }
			}
		}
		return _blockieFallback
	}
	blockies.create = function(opts){
		var o = opts ? opts : {}
		var next = {}
		for(var k in o){
			if(o.hasOwnProperty(k)){
				next[k] = o[k]
			}
		}
		next.seed = window.BlockieSeed(o.seed)
		var out = null
		try{
			out = _blockiesCreate.call(blockies, next)
		}catch(err){
			out = null
		}
		if(!out){
			return _blockieFallbackCanvas()
		}
		if(typeof out.toDataURL !== "function"){
			return _blockieFallbackCanvas()
		}
		return out
	}
	blockies.__wrapped = true
}
window.Blockie = function(seed){
	try{
		return blockies.create({ seed : seed })
	}catch(err){
		return null
	}
}
window.BlockieUrl = function(seed){
	var canvas = window.Blockie(seed)
	if(!canvas){
		return ""
	}
	try{
		return canvas.toDataURL()
	}catch(err){
		return ""
	}
}

window.assets = []
window.assets.set = function(){}

window.camera = {}
window.camera.set = function(){}

window.players = []
window.players.set = function(){}
window.players.self = function(){
	if(window.Mode() == "room"){
		var _position = {
			x : 1.5,
			y : 0.5,
			z : 1.5
		}
		if(window.current){
			_position.x = window.current.current.position.x
			_position.z = window.current.current.position.z
			try{
				var _pb = window.map.biomes[_position.x + ":" + _position.z]
				if(_pb){
					_position.y = _pb.y
				}
			}catch(err){
			}
		}
		return {
			follow : false,
			self : true,
			type : "player",
			hash : window.cookies.address ? window.cookies.address : window.cookies.hash,
			emoji : window.emojis.self ? window.emojis.self : "😀",
			x : _position.x,
			y : _position.y,
			z : _position.z
		}
	}

	var respawn = Respawn()

	if(window.current){
		respawn.x = window.current.current.position.x
		respawn.y = window.current.current.position.y
		respawn.z = window.current.current.position.z
	}

	return  {
		follow : false,
		self : true,
		hash : window.cookies.address ? window.cookies.address : window.cookies.hash,
		emoji : "😀",
		x : respawn.x,
		y : respawn.y,
		z : respawn.z
	}
}

var startSeqs = {};
var startNum = 0;

// jQuery FN
$.fn.playSpin = function (options) {
	if (this.length) {
		if ($(this).is(':animated')) return; // Return false if this element is animating
		startSeqs['mainSeq' + (++startNum)] = {};
		$(this).attr('data-playslot', startNum);

		var total = this.length;
		var thisSeq = 0;

		// Initialize options
		if (typeof options == 'undefined') {
			options = new Object();
		}

		// Pre-define end nums
		var endNums = [];
		if (typeof options.endNum != 'undefined') {
			if ($.isArray(options.endNum)) {
				endNums = options.endNum;
			} else {
				endNums = [options.endNum];
			}
		}

		for (var i = 0; i < this.length; i++) {
			if (typeof endNums[i] == 'undefined') {
				endNums.push(0);
			}
		}

		startSeqs['mainSeq' + startNum]['totalSpinning'] = total;
		
		this.each(function () {
			options.endNum = endNums[thisSeq];
			startSeqs['mainSeq' + startNum]['subSeq' + (++thisSeq)] = {};
			startSeqs['mainSeq' + startNum]['subSeq' + thisSeq]['spinning'] = true;
			var track = {
				total: total,
				mainSeq: startNum,
				subSeq: thisSeq
			};

			new slotMachine(this, options, track)
		});
	}
};

$.fn.stopSpin = function () {
	if (this.length) {
		if (!$(this).is(':animated')) return; // Return false if this element is not animating
		if ($(this)[0].hasAttribute('data-playslot')) {
			$.each(startSeqs['mainSeq' + $(this).attr('data-playslot')], function(index, obj) {
				obj['spinning'] = false;
			});
		}
	}
};

var slotMachine = function (el, options, track) {
	var slot = this;
	slot.$el = $(el);
	window.Roll.back = slot

	slot.defaultOptions = {
		easing: 'swing',        // String: easing type for final spin
		time: 1000,             // Number: total time of spin animation
		manualStop: false,      // Boolean: spin until user manually click to stop
		useStopTime: true,     // Boolean: use stop time        
		stopTime: 0,         // Number: total time of stop aniation
		loops : 6,
		stopSeq: 'random',      // String: sequence of slot machine end animation, random, leftToRight, rightToLeft
		endNum: 0,              // Number: animation end at which number/ sequence of list
		onEnd : $.noop,         // Function: run on each element spin end, it is passed endNum
		onFinish: $.noop,       // Function: run on all element spin end, it is passed endNum
	};

	slot.spinSpeed = 0;
	slot.loopCount = 0;

	slot.init = function () {
		slot.options = $.extend({}, slot.defaultOptions, options);
		slot.setup();
		slot.startSpin();
	};

	slot.setup = function () {
		var $li = slot.$el.find('li').first();
		slot.liHeight = $li.innerHeight();
		slot.liCount = slot.$el.children().length;
		slot.listHeight = slot.liHeight * slot.liCount;
		slot.spinSpeed = slot.options.time / slot.options.loops;

		$li.clone().appendTo(slot.$el); // Clone to last row for smooth animation

		// Configure stopSeq
		if (slot.options.stopSeq == 'leftToRight') {
			if (track.subSeq != 1) {
				slot.options.manualStop = true;
			}
		} else if (slot.options.stopSeq == 'rightToLeft') {
			if (track.total != track.subSeq) {
				slot.options.manualStop = true;
			}
		}
	};

	slot.startSpin = function () {
		slot.$el
			.css('top', -slot.listHeight)
			.animate({'top': '0px'}, slot.spinSpeed, 'linear',function () {
				slot.lowerSpeed();
			});
	};

	slot.lowerSpeed = function () {
		if (slot.loopCount < slot.options.loops ||
			(slot.options.manualStop && startSeqs['mainSeq' + track.mainSeq]['subSeq' + track.subSeq]['spinning'])) {
			slot.startSpin();
		} else {
			slot.endSpin();
		}
	};


	slot.endSpin = function () {
		if (slot.options.endNum == 0) {
			slot.options.endNum = slot.randomRange(1, slot.liCount);
		}

		// Error handling if endNum is out of range
		if (slot.options.endNum < 0 || slot.options.endNum > slot.liCount) {
			slot.options.endNum = 1;
		}

		var finalPos = -((slot.liHeight * slot.options.endNum) - slot.liHeight);
		var finalTime = ((slot.spinSpeed * 1.5) * (slot.liCount)) / slot.options.endNum;
		if (slot.options.useStopTime) {
			finalTime = slot.options.stopTime;
		}

		slot.$el
			.css('top', -slot.listHeight)
			.animate({'top': finalPos}, 500, slot.options.easing, function () {
				slot.$el.find('li').last().remove(); // Remove the cloned row

				slot.endAnimation(slot.options.endNum);
				if ($.isFunction(slot.options.onEnd)) {
					slot.options.onEnd(slot.options.endNum);
				}

				// onFinish is every element is finished animation
				if (startSeqs['mainSeq' + track.mainSeq]['totalSpinning'] == 0) {
					var totalNum = '';
					$.each(startSeqs['mainSeq' + track.mainSeq], function(index, subSeqs) {
						if (typeof subSeqs == 'object') {
							totalNum += subSeqs['endNum'].toString();
						}
					});
					if ($.isFunction(slot.options.onFinish)) {
						slot.options.onFinish(totalNum);
					}
				}
			});
	}

	slot.endAnimation = function(endNum) {
		if (slot.options.stopSeq == 'leftToRight' && track.total != track.subSeq) {
			startSeqs['mainSeq' + track.mainSeq]['subSeq' + (track.subSeq + 1)]['spinning'] = false;
		} else if (slot.options.stopSeq == 'rightToLeft' && track.subSeq != 1) {
			startSeqs['mainSeq' + track.mainSeq]['subSeq' + (track.subSeq - 1)]['spinning'] = false;
		}
		startSeqs['mainSeq' + track.mainSeq]['totalSpinning']--;
		startSeqs['mainSeq' + track.mainSeq]['subSeq' + track.subSeq]['endNum'] = endNum;
	}

	slot.randomRange = function (low, high) {
		return Math.floor(Math.random() * (1 + high - low)) + low;
	};

	this.init();
};



OAuth3.on("ready", function(e){
	var random = function(min, max) {
		return Math.floor(Math.random() * (max - min + 1)) + min;
	}

	var rowsTrim = function(rows, key, value){
		if(typeof key != "undefined" && typeof value != "undefined"){
			for(var r = 0; r < rows.length; r++){
				if(rows[r][key] == value){
					rows[r] = undefined
				}
			}
		}

		return rows.filter(function( row ) {
			return row !== undefined;
		})
	}

	var lang = navigator.language || navigator.userLanguage;

			
	if(Intl){
		lang = Intl.DateTimeFormat().resolvedOptions().locale;

		if(lang != "ko"){
			lang = "en";
		}
	}else{
		if(time.offset == -32400000){
			lang = "ko";
		}else{
			lang = "en";
		}
	}

	document.querySelector("html").setAttribute("lang",lang);

	var form_template = ""

	var flow_template = ""

	var $root = $('html,body')
	var $body = $("body")
	var $nav = $('input[id="nav"]')

	var $aside = $(".aside")
	var $status = document.querySelector(".aside .status")

	var $messages = $("messages")

	var $swap = $("#swap")
	var $pool = $("#pool ul")

	var $meme = $("#meme")

	$meme.src = `https://music.popup.link`;

	if(OAuth3.localhost){
		$meme.src = `http://localhost:3002`
	}
	
	$meme.html(`<iframe name="music.popup.link" src="${$meme.src}/"></iframe>`)

	$meme.poly = document.querySelector('iframe[name="music.popup.link"]')
	$meme.poly.onload = function(){
		if($meme.poly.ready){
			$meme.poly.ready()
		}else{
			$meme.poly.ready = true
		}

	}



	var url = new URL(window.location.href)

	var host_address = ethers.hashMessage((url.host+"/"))
		host_address = ethers.computeAddress(host_address).toLowerCase()

	if(window.flutter_inappwebview){
		$body.attr("app", OAuth3.isMobile)
	}

	$body.attr("mobile", OAuth3.isMobile)

	try{
		var style = ["style1", "style2", "style3", "style4"];
		var tam = ["tam1", "tam1", "tam1", "tam2", "tam3"];
		var opacity = ["opacity1", "opacity1", "opacity1", "opacity2", "opacity2", "opacity3"];

		function getRandomArbitrary(min, max) {
			return Math.floor(Math.random() * (max - min)) + min;
		}

		var estrela = "";
		var qtdeEstrelas = 350;
		var noite = document.querySelector(".constelacao");

		for (var i = 0; i < qtdeEstrelas; i++) {
			estrela += "<span class='estrela " + style[getRandomArbitrary(0, 4)] + " " + opacity[getRandomArbitrary(0, 6)] + " "
			+ tam[getRandomArbitrary(0, 5)] + "' style='animation-delay: ." +getRandomArbitrary(0, 9)+ "s; left: "
			+ getRandomArbitrary(0, 100) + "%; top: " + getRandomArbitrary(0, 100) + "%;'></span>";
		}

		noite.innerHTML = estrela;

		window.resize(Starry)
	}catch(err){

	}

	if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
		// Firefox 38+ seems having support of enumerateDevicesx
		navigator.enumerateDevices = function(callback) {
			navigator.mediaDevices.enumerateDevices().then(callback);
		};
	}

	// window.step = localStorage.tutorial ? localStorage.tutorial * 1 : 1

	$body.addClass("loading")

	if(window.location.hash){
		$("#nav").prop("checked",false)
		var address = window.location.hash.replace("#","0x")
		$("#intro .title .emoji").html("")
		/*
			개발 Part 14 (검수) - E13
			location.hash 가 40자 hex 가 아니면(예: "#a")
			blockies 가 null 을 반환해 append(null) 이 됐다.
			jQuery append 는 null 을 무시하므로 예외는 없었지만
			아이콘이 조용히 사라졌다. Blockie 로 통일한다.
		*/
		var _introIcon = window.Blockie(address)
		if(_introIcon){
			$("#intro .title .emoji").append(_introIcon)
		}
		if(host_address.indexOf(address) == -1){
			$("#intro .coptyright p").html(`<span class="address">
				<address>
					<span>${address}</span>
					<span dir="rtl">${address}</span>
				</address>
			</span>`)
		}
	}

	window.Withdrawal = function(){
		var player = window.players.self()

		if(player){
			var bool = window.confirm('Withdrawal Confirm')

			if(bool){
				var $form = document.forms.feedback
				var hash = $form.hash.value
				var token = $form.token.value

				var body = {}

				var url = "https://memepoly.com/withdrawal"

				if(OAuth3.localhost){
					url = "http://localhost:3001"
				}

				if(window.tutorial){
					document.forms.Tutorial.index.value = ""
					$body.removeAttr("tutorial")
					$body.removeAttr("step")
					$(".layer, .layer form.popup").removeClass("on")

					delete window.tutorial
					if(window.location.href == window.response.body.query.href){
						window.Callback(window.response)
					}else{
						delete window.response
					}
					window.Poll.ing = setInterval(window.Poll, time.balance)
				}else{
					clearInterval(window.Poll.ing)

					if(OAuth3.xhr){
						OAuth3.xhr.abort()
						delete OAuth3.xhr
					}

					var _x = player.x ? player.x : 1.5
					var _y = player.y ? player.y : 0
					var _z = player.z ? player.z : 1.5

					if(window.Mode() == "board"){
						var respawn = Respawn()

						_x = player.x ? player.x : respawn.x
						_y = player.y ? player.y : respawn.y
						_z = player.z ? player.z : respawn.z
					}

					OAuth3.fetch({
						method : "GET",
						url : url,
						body : body,
						query : {
							method : "DELETE",
							href : window.location.href,
							hash : hash,
							token : token,
							x : _x,
							y : _y,
							z : _z
						}
					}, function(res){
						window.location.href = OAuth3.host+"/logout"
					});
				}
			}
		}
	}

	window.Feedback = function(){
		var player = window.players.self()
		if(player){
			var $form = document.forms.feedback
			var hash = $form.hash.value
			var token = $form.token.value
			var body = {
				cc : "feedback",
				subject : $form.subject.value,
				emoji : $form.emoji.value
			}
			if(body.subject){
				var _url = "https://memepoly.com"

				if(OAuth3.localhost){
					_url = "http://localhost:3001"
				}

				$(".layer, .layer form.popup").removeClass("on")

				if(window.Mode() == "room"){
					window.RoomEmoji("🫥")
				}else{
					emojiChanged("🫥", true)
				}

				OAuth3.fetch({
					method : "POST",
					url : _url,
					body : body,
					query : {
						href : window.location.href,
						hash : hash,
						token : token,
						x : player.x ? player.x : "1.5",
						y : player.y ? player.y : "0",
						z : player.z ? player.z : "1.5"
					}
				}, window.Callback);
			}
		}
	}

	window.Tutorial = function(value, step){
		if(window.Mode() != "board"){
			return
		}

		if(Object.keys(window.com).length){
			return
		}

		var $form = document.forms.Tutorial
		var $index = $form.index

		$index.selectedIndex = value = value ? value : $index.selectedIndex

		if(typeof step == "undefined"){
			step = 0
		}

		value = $($form).find("option").eq(value).val()

		if(!window.tutorial){
			window.tutorial = {
				mines : {},
				opens : {},
				flags : {}
			}
		}

		window.tutorial.name = value
		window.tutorial.step = step

		$body.attr("tutorial", value)
		$body.attr("step", step)

		window.Callback(window.response)
	}

	window.Swap = function(){
		var player = window.players.self()

		if(player){
			var cookies = window.cookies

			if(OAuth3.xhr){
				OAuth3.xhr.abort()
				delete OAuth3.xhr
			}

			var url = "https://memepoly.com"

			if(OAuth3.localhost){
				url = "http://localhost:3001"
			}

			var body = {
				emoji : player.emoji,
				assets : []
			}

			var dice = cookies.dice * 1

			var query = {
				assets : [],
				dice : dice != 0 ? dice : 0,
				href : window.location.href,
				hash : cookies.hash,
				token : cookies.token,
				x : player.x,
				y : player.y,
				z : player.z
			}

			var $assets = $('#pool li')

			$assets.each(function(index, el){
				var $el = $(el)

				var asset = {
					emoji : $el.attr("emoji"),
					count : $el.attr("cnt"),
					type : $el.attr("type")
				}

				if(typeof_item(asset.emoji)){
					asset.address = ethers.hashMessage(asset.emoji)
					asset.address = ethers.computeAddress(asset.address).toLowerCase()

					if(asset.type == "sell"){
						asset.address = asset.address.toUpperCase()
					}

					query.assets.push(asset.address.toLowerCase())
					body.assets.push(asset.address)
				}
			})

			$swap.addClass("loading")

			$status.innerHTML = `<div class="loading">
				<strong>Loading...</strong>
			</div>`


			OAuth3.xhr = OAuth3.fetch({
				method : "POST",
				url : url,
				body : body,
				query : query
			}, window.Callback);
		}
	}

	window.Action = function(body){
		var player = window.players.self()
		if(!player){
			return
		}
		var cookies = window.cookies
		/*
			개발 Part 11
			요청 단위 멱등성 키를 붙인다.
			네트워크 재시도나 더블클릭으로 같은 액션이 두 번 실행되는 것을 막는다.
			서버가 (계정, 액션, 좌표, 이 키)로 중복을 판정한다.
		*/
		if(!body.idempotency){
			body.idempotency = window.randomHash()
		}
		if(OAuth3.xhr){
			OAuth3.xhr.abort()
			delete OAuth3.xhr
		}

		var url = "https://memepoly.com"

		if(OAuth3.localhost){
			url = "http://localhost:3001"
		}

		var dice = cookies.dice * 1
		var query = {
			dice : dice != 0 ? dice : 0,
			href : window.location.href,
			hash : cookies.hash,
			token : cookies.token,
			x : player.x,
			y : player.y,
			z : player.z
		}
		var _biome = window.BiomeAt(player.x, player.z)
		if(_biome){
			query.biome = _biome
		}
		/*
			개발 Part 18 (Edge 판정)
			링 판정 주체를 프론트로 통일한다.
			서버는 본인 좌표(query.x / query.z)와 일치할 때만 이 값을 채택하고,
			그 외 좌표는 자기 fields(board_tiles ring)로 판정한다.
			링이 아직 확정되지 않았으면 아예 보내지 않아 서버 판정에 맡긴다.
		*/
		if(window.EdgeReady && window.EdgeReady()){
			query.edge = window.IsEdge(player.x, player.z) ? 1 : 0
		}
		if(!body.emoji){
			body.emoji = window.emojis.self
		}

		OAuth3.xhr = OAuth3.fetch({
			method : "POST",
			url : url,
			body : body,
			query : query
		}, window.Callback);
	}

	window.Equipment = function(equip, unequip){
		window.Action({
			cc : "equip",
			equip : equip ? equip : [],
			unequip : unequip ? unequip : []
		})
	}

	window.Craft = function(recipe){
		window.Action({
			cc : "craft",
			recipe : recipe
		})
	}

	window.Consume = function(item){
		window.Action({
			cc : "consume",
			item : item ? item : "🧪"
		})
	}

	window.Property = function(level, _x, _z){
		var player = window.players.self()

		window.Action({
			cc : "property",
			level : level,
			x : typeof _x != "undefined" ? _x : player.x,
			z : typeof _z != "undefined" ? _z : player.z
		})
	}

	window.Auction = function(bid, _x, _z){
		var player = window.players.self()

		window.Action({
			cc : "auction",
			bid : bid,
			x : typeof _x != "undefined" ? _x : player.x,
			z : typeof _z != "undefined" ? _z : player.z
		})
	}

	function emojiChanged(emoji, local, bomb){
		var player = window.players.self()
		if(player){
			/*
				개발 Part 14 (검수) - E12
				현행은 이 스코프에 없는 cookies 를 참조했다.
				OAuth3.on("ready") 스코프에는 cookies 지역 변수가 없고,
				response() 안의 var cookies 는 다른 함수 스코프다.
				전역 window.cookies 가 아직 세팅되지 않은 시점에는
				  ReferenceError: cookies is not defined
				로 emojiChanged 가 통째로 실패했다.
				(hashType 클릭 / Report / Feedback 경로가 전부 여기를 통과한다)
				window.cookies 를 명시적으로 잡아 쓴다.
			*/
			var cookies = window.cookies ? window.cookies : {}
			var _players = window.players
			var len = _players.length
			var query = {
				dice : cookies.dice ? cookies.dice : 0,
				href : window.location.href,
				hash : cookies.hash,
				token : cookies.token,
				x : player.x,
				y : player.y,
				z : player.z
			}
			/*
				개발 Part 14 (검수) - E12
				window[player.hash] 가 아직 없으면(R3F Player 미마운트)
				.group.current.position 에서 TypeError 가 났다.
				player 좌표로 폴백한다.
			*/
			var position = { x : player.x, y : player.y, z : player.z }
			try{
				if(window[player.hash] && window[player.hash].group && window[player.hash].group.current){
					position = window[player.hash].group.current.position
				}
			}catch(err){
			}
			for(var i = 0; i < len; i++){
				if(_players[i].hash == cookies.hash || _players[i].hash == cookies.address){
					_players[i].self = true
					_players[i].emoji = emoji
					_players[i].x = position.x
					_players[i].y = position.y
					_players[i].z = position.z
				}
			}
			if(bomb){
				/*
					개발 Part 14 (검수) - E12
					해당 좌표의 바이옴이 없으면 b.y 에서 TypeError 가 났다.
					player.y 로 폴백한다.
				*/
				var b = window.map && window.map.biomes
					? window.map.biomes[player.x+":"+player.z] : null
				plant = {
					team : "#bomb",
					follow : false,
					self : false,
					hash : ethers.ZeroAddress,
					dice : 0,
					x : player.x + "",
					y : (b ? b.y : (player.y ? player.y : 0)) + 0.5,
					z : player.z + "",
					emoji : "💣"
				}
				_players.push(plant)
			}
			if(emoji.length){
				delete window.emojis.message

				var body = {
					emoji : emoji
				}

				if(OAuth3.nonces){
					if(OAuth3.nonces.length){
						body.nonces = []

						for(var i = 0; i < OAuth3.nonces.length; i++){
							var nonce = OAuth3.nonces[i]

							if(nonce){
								body.nonces.push(nonce)
							}
						}

						body.nonces = JSON.stringify(body.nonces)
					}
				}
				

				var url = "https://memepoly.com"

				if(OAuth3.localhost){
					url = "http://localhost:3001"
				}

				var type = window.typeof_emoji(emoji)

				if(type == "emoji"){
					$body.attr("emoji",emoji)
					if(!local){

						if(plant){
							body.cc = "bomb"
							
							body.x = plant.x
							body.z = plant.z
						}

						OAuth3.xhr = OAuth3.fetch({
							method : "POST",
							query : query,
							body : body,
							url : url
						}, window.Callback);
					}
				}

				var players_ = JSON.stringify(_players)

				window.players.set(JSON.parse(players_))

				$aside.removeClass("more")

				if(type){
					$('[id="'+player.hash+'"][alt="player"]').attr("type","image")
				}else{
					$('[id="'+player.hash+'"][alt="player"]').attr("type","text")
				}
			}
		}
	}

	var Origin = typeof OAuth3.Origin != "undefined" ? OAuth3.Origin : window.location.origin;

	if(OAuth3.localhost){
		Origin = "http://"+OAuth3.localhost;
	}

	var $balance = $("#header .balance span");
	
	if(Origin){
		// 메뉴 & 멤버 조회
		var request = {
			method : "GET",
			query : {
				cc : Origin
			}
		}

		/*
			개발 Part 28 (주사위 상태 정리)
			snap / snapKeys / prevX / prevZ 에 더해
			path / pathKeys / pathIdx 까지 한 곳에서 비운다.
			정리 지점이 4곳으로 흩어져 있어 한 곳만 빠져도
			이전 매치의 경로 커서가 남아 첫 스텝이 엉뚱한 칸으로 튀었다.
		*/
		window.RollReset = function(){
			clearInterval(window.Roll.ing)
			delete window.Roll.ing
			window.Roll.snap = null
			window.Roll.snapKeys = null
			window.Roll.path = null
			window.Roll.pathKeys = null
			window.Roll.pathIdx = -1
			window.Roll.prevX = null
			window.Roll.prevZ = null
		}
		window.Roll = function(biomes){
			try{
				var dice = window.cookies.dice * 1
				if(dice > 0){
					if(typeof OAuth3.interval == "undefined"){
						/*
							개발 Part 22 (룩어헤드 격리)
							스냅샷이 없으면 주사위를 즉시 소진하고 폴링 재개.
							(링 미확정 / FieldsSerpentine 폴백 상태)
						*/
						if(!window.Roll.snap || !window.Roll.snap.length || !window.Roll.snap.ring){
							window.cookies.dice = 0
							window.RollReset()
							window.setFrameloop("always")
							if(typeof window.Poll.ing == "undefined"){
								window.Poll.ing = setInterval(window.Poll, 600)
							}
							return
						}

						var _cx = window.current.current.position.x * 1
						var _cz = window.current.current.position.z * 1

						/*
							부동소수점 오차 흡수: 0.5 그리드 스냅.
							좌표가 항상 x.5 단위이므로 *2 후 round 후 /2.
						*/
						_cx = Math.round(_cx * 2) / 2
						_cz = Math.round(_cz * 2) / 2

						var _px = window.Roll.prevX
						var _pz = window.Roll.prevZ

						/*
							룩어헤드 기반으로 다음 칸 결정.
							window.RollNext 는 Part 1 에서 정의됨.
							파라미터로 이전 위치를 전달해 전역 오염 방지.
						*/
						var _next = window.RollNext(_cx, _cz, _px, _pz)

						if(_next){
							/*
								개발 Part 28 (높이 폴백)
								경로 스냅샷 항목에는 y 가 없다.
								바이옴 조회까지 실패하면 undefined 가 그대로 좌표에 들어가
								캐릭터가 NaN 위치로 사라졌다.
								현재 지형 높이를 기준값으로 둔다.
								(window.current.position.y 에는 이미 +0.01 이 더해져 있다)
							*/
							var _ny = (window.current.current.position.y * 1) - 0.01
							if(typeof _next.y !== "undefined" && !isNaN(_next.y * 1)){
								_ny = _next.y * 1
							}
							try{
								var _nb = window.map.biomes[_next.x + ":" + _next.z]
								if(_nb && typeof _nb.y !== "undefined"){
									_ny = _nb.y * 1
								}
							}catch(err){}

							/* 이전 위치 갱신 (전역이 아니라 window.Roll 하위) */
							window.Roll.prevX = _cx
							window.Roll.prevZ = _cz

							window.current.current.position.x = window.cursor.current.position.x = biomes.x = _next.x
							window.current.current.position.y = window.cursor.current.position.y = biomes.y = _ny + 0.01
							window.current.current.position.z = window.cursor.current.position.z = biomes.z = _next.z

							var _selfHash = window.cookies.address ? window.cookies.address : window.cookies.hash
							if(window[_selfHash] && window[_selfHash].position){
								window[_selfHash].position.x = _next.x
								window[_selfHash].position.y = _ny + 0.5
								window[_selfHash].position.z = _next.z
							}
						}

						window.cookies.dice = dice - 1
						window.setFrameloop("always")
						return
					}
				}else{
					/*
						개발 Part 22 (룩어헤드 격리)
						주사위 소진 시:
						1) 인터벌 정리
						2) 스냅샷 해제
						3) window.Callback(window.response) 재호출 금지
						4) 폴링 재개 → 서버 확정 좌표 수신
						개발 Part 28 : 경로 커서까지 함께 비운다.
					*/
					window.RollReset()
					window.cookies.dice = 0
					window.setFrameloop("always")
					if(typeof window.Poll.ing == "undefined"){
						window.Poll.ing = setInterval(window.Poll, 600)
					}
				}
			}catch(err){
				console.log("Roll err",err);
				window.RollReset()
			}
		}
		window.BoardCallback = async function(resp){
			var url = new URL(window.location.href)
			var _dice = window.cookies.dice * 1
			var cookies = window.cookies = JSON.parse(resp.body.cookies)
			var dice = cookies.dice * 1

			try{
				if(window.MatchVerify){
					window.MatchVerify(cookies)
				}
			}catch(err){
				console.log("match err",err);
			}

			try{
				if(window.StageSync){
					window.StageSync(cookies)
				}
			}catch(err){
				console.log("stage err",err);
			}
			try{
				if(window.MapGen){
					window.MapGen.apply()
				}
			}catch(err){
				console.log("mapgen err",err);
			}
			/*
				개발 Part 14 (검수) - E6
				MapGen.apply() 가 어떤 경로로 이탈했든
				이 지점 이후 window.map 하위 컨테이너가 전부 존재함을 보장한다.
				apply() 뒤에 두어야 biomes 교체 이후 상태를 보정할 수 있다.
			*/
			if(window.MapGuard){
				window.MapGuard()
			}
			if(!isNaN(cookies.speed) && cookies.speed){
				window.speed = 0.1 * (cookies.speed * 1)
			}
			if(cookies.axis){
				try{
					OAuth3.nonces = []

					if(resp.body.nonces.length){
						var _nonces = resp.body.body.nonces
							
						for(var i = 0; i < resp.body.nonces.length; i++){
							var nonce = resp.body.nonces[i]

							var skip = true

							if(_nonces){
								if(_nonces.length){
									if(_nonces.indexOf(nonce) > -1){
										continue;
									}
								}
							}

							OAuth3.nonces.push(nonce)
						}
					}

					var cc_address = ethers.hashMessage(url.href.replace(window.location.protocol+"//",""))
						cc_address = ethers.computeAddress(cc_address).toLowerCase()


					window.map.report = {}

					var seed = cc_address+""

					if(window.location.hash){
						cc_address = window.location.hash.replace("#","")

						seed = window.location.hash.replace("#","0x")
					}

					cc_address = cc_address.replace("0x","")

					var rows = JSON.stringify(resp.body.rows)
						rows = JSON.parse(rows)

					var size = 4
					var biomes = listToBiomes()
					var isDice = Math.sqrt(Math.pow(cookies.dice, 2)) > 0 && cookies.dice != -10

					var self_player

					try{
						self_player = window.players.self()
					}catch(err){
						window.response = resp
					}

					var flag_players = []

					var _players = []
						_players.cnt = 0

					var _assets = []

					var _messages = []

					var frameloop = false

					var stickers = []

					var bombs = []

					var bingo_body = ""

					var score_board = []

					var isBiome = false
					/*
						개발 Part 14 (검수) - E7
						blockies.create() 직접 호출을 Blockie() 로 바꾼다.
						seed 는 hash 유무에 따라 "0x..." 또는 해시 조각이 되므로
						BlockieSeed 가 형식을 정규화한다.
					*/
					var canvas = window.Blockie(seed)
					var self = false
					var diff = false

					var meme = {
						poly : "",
						play : ""
					}

					var player_hash = cookies.address ? cookies.address : cookies.hash

					var $player = $('player[id="'+player_hash+'"][alt="player"]')

					var cc_player = {
						type : "player",
						self : false,
						hash : cc_address,
						x : 0.5,
						y : 0.5,
						z : 0.5,
						/*
							개발 Part 14 (검수) - E7
							canvas 가 null 이면 여기서 TypeError 로 중단됐다.
							BlockieUrl 은 실패 시 "" 를 반환하고,
							Player.jsx 는 emoji 가 "" 면 type="text" 로 렌더하므로
							화면이 깨지지 않는다.
						*/
						emoji : window.BlockieUrl(seed)
					}

					var progress = []
					/*
						개발 Part 14 (검수) - G2
						현행 문제
						  1) b 가 없으면 y 에 _axis[1] 을 그대로 썼다.
						     서버가 +1 오프셋을 더해 저장하므로
						     캐릭터가 1 유닛 공중에 떴다.
						  2) b 가 없으면 Respawn() 으로 좌표를 통째로 버렸다.
						     매치 전환 직후 매번 랜덤 스폰이 됐다.
						  3) cookies.axis 를 덮어쓰면서 오프셋 없는 y 를 넣어
						     서버와 프론트의 axis 형식이 어긋났다.
						AxisParse 가 오프셋 보정과 폴백을 담당한다.
						좌표 자체를 못 읽을 때만 Respawn 으로 넘어간다.
					*/
					var _ax = window.AxisParse(cookies.axis)
					var b = (window.map && window.map.biomes)
						? window.map.biomes[_ax.x + ":" + _ax.z] : null
					var axis = {
						x : _ax.x,
						y : _ax.y,
						z : _ax.z
					}
					if(!_ax.ok){
						var _respawn = Respawn()
						axis.x = _respawn.x
						axis.y = _respawn.y
						axis.z = _respawn.z
						/*
							서버 형식과 맞추려면 y 에 오프셋을 다시 더해야 한다.
							다음 폴링의 query.y 로 그대로 올라가기 때문이다.
						*/
						cookies.axis = [axis.x, axis.y + 1, axis.z].toString()
					}
					if(window.current){
						var _cur = window.current.current.position
						var _cur_biome = window.map.biomes[`${_cur.x}:${_cur.z}`]
						/*
							개발 Part 29 (서버 텔레포트 반영)
							현행 문제
							  window.current.axis 는 한 번 true 가 되면
							  BoardHashChange 전까지 절대 꺼지지 않는다.
							  그래서 두 번째 폴링부터는 언제나 else 로 들어가
							    axis.x = _cur.x
							  즉 클라이언트 좌표가 서버 좌표를 덮어쓴다.
							  서버가 확정한 좌표 이동이 화면에 한 번도 반영되지 않았다.
							    출격 스폰(#start 커밋)  게이트에서 역할을 골라도 제자리
							    부활 / 감옥
							    UCAV 링 반출(edgeBlocked)
							  게다가 다음 폴링에서 프론트가 다시 옛 좌표를 보고하므로
							  서버가 또 되돌리려 하는 핑퐁이 끝나지 않는다.
							조치
							  서버가 "내가 좌표를 옮겼다" 고 명시한 경우에만 강제 반영한다.
							  추측이 아니라 서버가 내려준 플래그로 판정한다.
							    spawned      #start 가 스폰을 확정했다
							    edgeBlocked  UCAV 가 링에서 내륙으로 반출됐다
							  일반 폴링에서는 기존대로 클라이언트 좌표를 유지한다.
							  (주사위 애니메이션 / 조이스틱 이동이 서버 지연에 끊기지 않게)
						*/
						var _teleport = ""
						try{
							/*
								개발 Part 30 (판 전환)
								서버는 판이 넘어가면 axis 를 버리고 리스폰시킨 뒤
								matchRolled 로 알린다.
								이 신호가 없으면 current.axis 잠금 때문에
								새 판 스폰 좌표가 화면에 반영되지 않고
								캐릭터가 옛 판 좌표에 남는다.
							*/
							if(cookies.spawned || cookies.edgeBlocked || cookies.matchRolled){
								_teleport = cookies.matchRolled ? "match"
									: (cookies.spawned ? "spawn" : "edge")
								if(_cur.x === axis.x && _cur.z === axis.z){
									/* 이미 같은 칸이면 스냅이 필요 없다 */
									_teleport = ""
								}else{
									var _tb = window.map.biomes[axis.x + ":" + axis.z]
									if(_tb && typeof _tb.y !== "undefined"){
										axis.y = _tb.y * 1
									}
								}
							}
						}catch(err){
							_teleport = ""
						}
						if(!window.current.axis || !_cur_biome || _teleport){
							window.current.axis = true
							/*
								개발 Part 17 (스폰)
								여기가 "서버가 준 좌표를 처음 반영하는 지점" 이다.
								이 순간 캐릭터와 카메라를 lerp 없이 즉시 붙인다.
							*/
							window.Snap = 8
							biomes.x = window.current.current.position.x = window.cursor.current.position.x = axis.x
							biomes.z = window.current.current.position.z = window.cursor.current.position.z = axis.z

							window.current.current.position.y = axis.y + 0.01
							window.cursor.current.position.y = axis.y + 0.01

							var _self_hash = cookies.address ? cookies.address : cookies.hash

							if(window[_self_hash]){
								if(window[_self_hash].position){
									window[_self_hash].position.x = axis.x
									window[_self_hash].position.y = axis.y + 0.5
									window[_self_hash].position.z = axis.z
								}
							}
						}else{
							biomes.x = axis.x = _cur.x
							biomes.z = axis.z = _cur.z
						}
					}else{
						biomes.x = axis.x
						biomes.z = axis.z
					}

					biomes.forEach(function(b, i){
						if(
							(biomes.x - size < b.x && biomes.x + size > b.x) &&
							(biomes.z - size < b.z && biomes.z + size > b.z)
						){
							biomes[b.x+":"+b.z] = b
						}
					})

					// var $assets = $('#pool li')
					var $assets = $('.emoji_asset.on')

					var uri = new URL(url.href)

					var balanceAddress = ethers.computeAddress(ethers.hashMessage(uri.host)).toLowerCase()
				
					var assets = []

					$swap.removeClass("loading")

					if($assets.length){
						var after_body = ""

						$assets.each(function(index, el){
							var $el = $(el)
										
							var asset = {
								emoji : $el.attr("emoji"),
								count : $el.attr("cnt"),
								type : $el.attr("type")
							}

							if(typeof_item(asset.emoji)){
								asset.address = ethers.hashMessage(asset.emoji)
								asset.address = ethers.computeAddress(asset.address).toLowerCase()
								var amm = cookies[asset.address]
								
								asset.balance = amm.x - amm.y
								var type = ""
								var $asset = $(`#${asset.address}`)
								if($asset.length){
									type = $asset.attr("type")
								}
								/*
									개발 Part 17 (상점)
									잔액 버튼(a.hashType.Balance)으로 연 경우
									window.SwapIntent = "sell" 이 설정된다.
									행이 처음 그려질 때 기본값을 매도로 둔다.
									(현행은 항상 "" 라 매번 sell 컬럼을 눌러야 했다)
								*/
								if(!type && window.SwapIntent){
									type = window.SwapIntent
								}

								after_body += `<li class="item" type="${type}" cnt="${asset.count}" emoji="${asset.emoji}" id="${asset.address}">
									<div class="asset">
										<div class="col x buy">
											<div class="icon">
												<div class="emoji color">${asset.emoji}</div>
											</div>
											<div class="amount">
												<span>${asset.count}</span>
											</div>
										</div>
									</div>
									<div class="asset">
										<div class="col y sell transaction">
											<div class="icon">
												<div class="emoji color">🪙</div>
											</div>
											<div class="amount">
												<span>${asset.balance}</span>
											</div>
										</div>
									</div>
								</li>`

								assets.push(asset)	
							}
						})

						var $before = $($pool.html())
							$before.find(".item").removeAttr("type")

						var before_body = $before.html()

						if(before_body){
							before_body = before_body.replace(/\t/gi,"").replace(/\n/gi,"").trim()
						}

						after_body = after_body.replace(/\t/gi,"").replace(/\n/gi,"").trim()

						if(before_body != after_body){
							$pool.html(after_body)
						}
					}else{
						$pool.html("")
						$("#swap .submit input").val("")
					}

					/*
						개발 Part 17 (미니맵)
						하드코딩 오프셋(-100 / -0)을 MapFocus 로 대체한다.
						MapFocus 는 renderFlat 이 쓴 minX / minZ 와 scale 을 그대로 읽어
						뷰포트 정중앙에 현재 좌표를 맞춘다.
						MapGen 이 아직 준비되지 않은 첫 프레임에서는 레거시 식으로 폴백한다.
					*/
					if(!(window.MapFocus && window.MapFocus(biomes.x, biomes.z))){
						$(".voronoi .map").css({top : - ((biomes.z * 2) + 100) , left : - ((biomes.x * 2) + 0) })
					}
					$(".xyz").text(`${Math.floor(biomes.x)} : ${Math.floor(biomes.z)}`)


					if(rows.length){
						for(var r = 0; r < rows.length; r++){
							var row = rows[r];

							try{
								var hashtag = getHashtag(row.Cc)

								var position = row.Cc.split(` ${hashtag}`)[0]
									position = JSON.parse(`[${position}]`)

								row.x = position[0]
								row.z = position[1]
								row.dice = position[2]

								var _nonce = row.Cc.split(` ${hashtag}`)[1]
									_nonce = _nonce.split("@")[0].trim()

								if(row.Cc.indexOf("#dice") > -1 && isDice){
									progress[`${row.x}:${row.z}`] = true

									progress.push(row)

									progress.nonce = _nonce

									if(OAuth3.nonces.indexOf(_nonce) == -1){
										OAuth3.nonces.push(_nonce)
									}
								}

								if(row.Cc.indexOf("#report") > -1){
									/*
										개발 Part 8
										서버가 reports / blocks 를 함께 내려보낸다.
										__blocked 인 상대는 신고와 동일하게 화면에서 제외한다.
									*/
									if(!window.map.report[row.To]){
										window.map.report[row.To] = []
									}
									window.map.report[row.To].push(row)
									if(row.__blocked){
										if(!window.map.block){
											window.map.block = {}
										}
										window.map.block[row.To] = true
									}
								}
							}catch(err){
								// console.log('err',err);
							}
						}
					}

					/*
						개발 Part 14 (검수) - E11
						여기도 Fields() 맨몸 호출이었다.
						window.fields 는 Experience.jsx 의 FieldsSync() 가 채우므로
						R3F 마운트 전 첫 폴링에서는 비어 있을 수 있다.
					*/
					var fields = window.fields
					if(!fields || !fields.length){
						fields = (typeof window.Fields === "function") ? window.Fields() : []
					}
					if(isDice){
						if(progress.length){
							progress.before = progress[1]
							progress.start = progress[progress.length - 1]
							progress.end = progress[0]
							var div = fields[`${progress.start.x}:${progress.start.z}`]
							if(div && typeof div.index !== "undefined" && fields.length){
								/*
									개발 Part 28 (링 회전 비파괴화)
									현행 문제
									  fields 는 window.fields 를 그대로 가리킨다.
									  splice 는 원본을 잘라내므로
									    div.index 가 0 이면 window.fields.length 가 0 이 되고
									    EdgeReady() 가 false 로 떨어져 주사위를 굴릴 수 없다.
									  concat 결과에는 좌표 문자열 키가 복사되지 않아
									  바로 아래의 fields["x:z"] 조회가 전부 undefined 가 된다.
									  delete fields["x:z"] 도 원본 키를 지워
									  다음 폴링의 IsEdge 판정을 망가뜨렸다.
									조치
									  회전본을 새 배열로 만들고 문자열 키만 얕게 옮긴다.
									  window.fields 는 손대지 않는다.
								*/
								var _len = fields.length
								var _rot = []
								for(var _fi = 0; _fi < _len; _fi++){
									_rot.push(fields[(div.index + _fi) % _len])
								}
								for(var _fk in fields){
									if(fields.hasOwnProperty(_fk)){
										if(isNaN(_fk * 1)){
											_rot[_fk] = fields[_fk]
										}
									}
								}
								fields = _rot
								var start
								var end
								fields.forEach(function(field, index){
									if(progress.start.x == field.x && progress.start.z == field.z){
										start = true
									}
									if(biomes.x == field.x && biomes.z == field.z){
										end = true
									}
									if(start && !end){
										progress[`${field.x}:${field.z}`] = true
									}
								})
								if(progress.before){
									if(progress.before.index > progress.end.index){
										fields.forEach(function(field, index){
											delete fields[`${field.x}:${field.z}`]
										})
									}
								}
							}
						}
					}

					if(cookies.subscription){
						$('.emoji_asset[method="notify"]').addClass("on")
					}else{
						$('.emoji_asset[method="notify"]').removeClass("on")
					}
					
					/*
						개발 Part 14 (검수) - E15
						서버는 flags 를 배열로 만들면서 문자열 키(#red / #blue / hash)를 붙인다.
						JSON.stringify 는 배열의 문자열 키를 버리므로
						클라이언트에는 빈 배열 [] 로 도착한다.
						서버가 객체로 바꿔 내려보내면 flags.forEach 가
						  TypeError: flags.forEach is not a function
						이 된다. 형태를 배열로 정규화한다.
					*/
					var flags = []
					var _rawFlags = resp.body.flags
					if(_rawFlags){
						if(Array.isArray(_rawFlags)){
							flags = _rawFlags
						}else if(typeof _rawFlags === "object"){
							for(var _fk in _rawFlags){
								if(_rawFlags.hasOwnProperty(_fk)){
									var _fv = _rawFlags[_fk]
									/* 카운터(숫자)는 제외하고 행 객체만 담는다 */
									if(_fv && typeof _fv === "object"){
										flags.push(_fv)
									}
								}
							}
						}
					}
					flags.temp = 0
					flags[player_hash] = 0
					flags['#red'] = 0
					flags['#blue'] = 0
					flags['#black'] = 0

					var _balance = $balance.text()

					$balance
						.removeClass("on")
						.text(cookies.balance)
					
					if(_balance){
						if(_balance != cookies.balance){
							$balance.addClass("on")
						}
					}
		
					if(rows.length){
						for(var r = 0; r < rows.length; r++){
							var row = rows[r];

							var hashtag = getHashtag(row.Cc)

							var position = row.Cc.split(` ${hashtag}`)[0]

							try{
								position = JSON.parse(`[${position}]`)
							}catch(err){
								position = []
							}

							var emoji = row.Cc.split("@")[1]

							row.x = position[0]
							row.z = position[1]
							row.dice = position[2] * 1

							var b = biomes[row.x+":"+row.z]
							/*
								개발 Part 14 (검수) - G2
								바이옴이 없으면 y 가 0 으로 떨어져
								플레이어가 지면 아래로 파묻혔다.
								서버 DTO(state.positions) 에 y 가 있으면 그것을 쓴다.
								서버 y 는 오프셋(+1)이 더해진 값이므로 보정한다.
							*/
							var y = 0
							if(window.map.biomes && window.map.biomes[row.x+":"+row.z]){
								y = window.map.biomes[row.x+":"+row.z].y
							}else if(typeof row.y !== "undefined"){
								var _ry = row.y * 1
								if(!isNaN(_ry)){
									y = _ry >= 1 ? (_ry - 1) : _ry
								}
							}
							try{
								var _nonce = row.Cc.split(` ${hashtag}`)[1]
									_nonce = _nonce.split("@")[0].trim()

								if(progress.nonce != _nonce && _nonce.indexOf(cc_address) == -1 && ((!row.Flag && window.Biomes[hashtag]) || row.Flag && !window.Biomes[hashtag]) ){
									var _index = OAuth3.nonces.indexOf(_nonce)

									if(_index > -1){
										OAuth3.nonces.splice(_index, 1)
									}
								}
							}catch(err){

							}

							if(window.Biomes[hashtag] && b){
								if(row.Flag && hashtag != "#dice"){
									delete window.map.biomes[row.Id]
									
									var $clipped = $(`.clipped .emoji[x="${row.x}"][z="${row.z}"]`)

									if($clipped.length && !window.bingo[row.Id]){
										window.bingo[row.Id] = true
										if(b){
											bingo_body += $clipped.closest('[style*="transform-origin"]')[0].outerHTML
										}
									}
								}else{
									var _asset = {
										id : row.Id,
										hash : cc_address,
										name : hashtag,
										value : "",
										color: "",
										x : row.x,
										y : y,
										/*
											개발 Part 14 (검수) - E9
											현행은 z 에 row.y 를 넣었다.
											row 는 서버가 Cc 에서 조립한 행이라 y 속성이 없어
											z 가 항상 undefined 였다.
											이 객체는 window.map.biomes[row.Id] 로 들어가고
											listToBiomes() 가 다시 읽으므로
											바이옴 장식이 좌표 없는 유령 항목이 됐다.
										*/
										z : row.z
									}
									if(window.map.nonces[row.Id]){
										delete window.map.nonces[row.Id]
									}
									window.map.biomes[row.Id] = _asset
								}
							}else if(row.Subject == "#position"){
								var player = {
									follow : false	
								}

								var typeof_emoji = window.typeof_emoji(emoji)

								if(row.Flag){
									if(b){
										var $clipped = $(`.clipped .emoji[x="${row.x}"][z="${row.z}"]`)

										if($clipped.length && !window.bingo[row.Id]){
											window.bingo[row.Id] = true
											bingo_body += $clipped.closest('[style*="transform-origin"]')[0].outerHTML
										}
									}
								}else if(row.From){
									var _from = row.From

									var _nonce = row.Cc.split(` ${hashtag}`)[1]
										_nonce = _nonce.split("@")[0].trim()

									if(_nonce.indexOf(cc_address) == -1){
										_from = _nonce
									}

									if(typeof_emoji && (cookies.address == _from || cookies.hash == _from)){
										self = true

										player.self = true

										if(cookies.address){
											if(cookies.hash == _from){
												continue
											}
										}

										if(!self_player){
											self_player = {
												team : cookies.team ? cookies.team : "",
												follow : false,
												self : true,
												hash : cookies.address ? cookies.address : cookies.hash,
												emoji : "😀",
												x : row.x,
												y : y,
												z : row.z
											}
										}

										player.x = self_player.x
										player.y = y
										player.z = self_player.z
										player.emoji = window.emojis.self
									}else{
										if(!typeof_emoji && window.map.biomes[row.Id]){
											delete window.map.biomes[row.Id]
										}

										player.x = row.x
										player.y = y
										player.z = row.z
										player.emoji = emoji
									}

									if(!row.Flag){
										/*
											개발 Part 12
											신고/차단 판정을 window.State 로 전환한다.
											DTO 가 없으면 기존 window.map.report 로 폴백한다.
										*/
										var _hidden = window.StateReady()
											? window.StateHidden(_from)
											: (window.map.report[_from] ? true : false)
										if(!_hidden && (b || player.self)){
											if(!rows[_from]){
												rows[_from] = true

												_players.push({
													team : hashtag,
													follow : player.follow,
													self : player.self,
													hash : _from,
													dice : row.dice,
													x : player.x,
													y : player.y + 0.5,
													z : player.z,
													emoji : player.emoji,
													role : window.typeof_role(player.emoji, player.self ? cookies.role : "")
												})
											}

											if(_from == row.From){
												if(!_players[row.From]){
													_players.cnt += 1
												}
											}
											

											_players[_from] = {
												x : player.x,
												z : player.z,
												emoji : player.emoji,
												dice : row.dice
											}
										}

										if(typeof_emoji){
											flag_players.push({
												team : hashtag,
												follow : player.follow,
												self : player.self,
												hash : _from,
												dice : row.dice,
												x : player.x,
												y : player.y,
												z : player.z,
												emoji : player.emoji
											})
										}
									}
								}
							}else if(row.Subject == "#property"){
								/*
									개발 Part 12
									서버가 __propertyId / __level / __toll 을 실어 보낸다.
									DTO 가 있으면 그쪽을 우선 쓴다.
								*/
								var propertyField = window.fields ? window.fields[`${row.x}:${row.z}`] : null
								if(propertyField && propertyField.property){
									var _dtoProp = window.StateReady()
										? window.StateProperty(row.x, row.z) : null
									if(_dtoProp){
										propertyField.property.level = _dtoProp.level
										propertyField.property.owner = _dtoProp.hash
										propertyField.property.ownerId = _dtoProp.ownerId
										propertyField.property.toll = _dtoProp.toll
									}else{
										propertyField.property.level = typeof row.__level != "undefined"
											? row.__level : row.dice
										propertyField.property.owner = row.Flag ? row.Flag : row.From
										propertyField.property.toll = typeof row.__toll != "undefined"
											? row.__toll
											: (propertyField.property.tollTable ? propertyField.property.tollTable[row.dice] : 0)
									}
								}
							}else if(row.Cc.indexOf("#message") > -1){
								_messages.push(row)
							}else if(row.Cc.indexOf("#bomb") > -1 || row.Subject == "#bomb"){
								if(row.From.indexOf(player_hash) > -1 && !row.Flag){
									plant = false
								}

								bombs.push(row)	

								if(ethers.isAddress(row.Flag)){
									if(row.To == player_hash){
										var provider = ""

										if(hashtag != "#bomb"){
											if(isNaN(hashtag)){
												provider = "youtube"
											}else{
												provider = "tiktok"
											}
										}

										if(provider){
											meme.id = row.Id
											meme.provider = provider
											meme.poly = hashtag.replace("#","")
										}
									}

									if(row.Subject == "#bomb"){
										var $clipped = $(`.clipped .emoji[x="${row.x}"][z="${row.z}"]`)

										if($clipped.length && !window.bingo[row.Id]){
											window.bingo[row.Id] = true
											bingo_body += $clipped.closest('[style*="transform-origin"]')[0].outerHTML
										}
									}

									delete window.map.biomes[`${row.x}:${row.z}`].bomb
								}else if(!row.Flag && b){
									var _from = row.From

									var _nonce = row.Cc.split(` ${hashtag}`)[1]
										_nonce = _nonce.split("@")[0].trim()

									if(_nonce.indexOf(cc_address) == -1){
										_from = _nonce
									}

									var player = {
										team : hashtag,
										follow : false,
										self : false,
										hash : _from,
										dice : 0,
										x : row.x,
										y : y,
										z : row.z,
										emoji : "💣"
									}

									_players.push(player)
								}
							}else if(row.Cc.indexOf("#asset") > -1){
								var emoji = row.Cc.split("@")[1]

								if(row.Flag){
									if(window[row.Flag]){
										window[row.Flag].emoji = ""

										var $clipped = $(`.clipped .emoji[x="${row.x}"][z="${row.z}"]`)

										if($clipped.length && !window.bingo[row.Id]){
											window.bingo[row.Id] = true
											bingo_body += $clipped.closest('[style*="transform-origin"]')[0].outerHTML
										}
									}
								}else if(row.To == player_hash){
									if(!stickers[emoji]){
										stickers[emoji] = []
									}

									row.Emoji = emoji

									row.index = stickers[emoji].length

									if(row.dice == 0){
										row.color = true
									}

									stickers.push(row)
									stickers[emoji].push(row)
								}
							}	
						}

						var x = self_player.x
						var z = self_player.z

						var b = biomes[x+":"+z]

						if(b){
							$body.attr("biome", b.biome)
						}

						var field = fields[`${x}:${z}`]

						if(field){
							$body.attr("field", (field.item || field.drop) ? (field.item || field.drop) : "")	
						}else{
							$body.attr("field", "")
						}

						var type = window.typeof_emoji(self_player.emoji)

						if(type == "emoji"){
							$body.attr("emoji",self_player.emoji)
						}

						if(bombs.length){
							for(var i = 0; i < bombs.length; i++){
								var bomb = bombs[i]

								if(bomb){
									for(var _x = -2; _x < 3; _x++){
										for(var _z = -2; _z < 3; _z++){
											if(window.map.biomes[`${bomb.x+_x}:${bomb.z+_z}`]){
												if(bomb.Flag){
													delete window.map.biomes[`${bomb.x+_x}:${bomb.z+_z}`].bomb
												}else{
													window.map.biomes[`${bomb.x+_x}:${bomb.z+_z}`].bomb = true
												}
											}
										}
									}	
								}
							}
						}

						biomes.forEach(function(b, i){
							if(
								(biomes.x - size < b.x && biomes.x + size > b.x) &&
								(biomes.z - size < b.z && biomes.z + size > b.z)
							){
								var color = window.Biomes["#"+b.biome]

								var _id = crc32(cc_address+"#"+b.biome+b.x+b.z).toString(32).toUpperCase()

								if(window.map.biomes[_id]){
									isBiome = true
								}

								if(progress[`${b.x}:${b.z}`]){
									color = "black"
								}

								_assets.push({
									id : _id,
									hash : cc_address,
									name : "#"+b.biome,
									value : color,
									color: color,
									x : b.x,
									y : b.y - (b.water ? 0.8 : 0.5),
									z : b.z
								})	
							}
						})

						if(window.assets && !isBiome){
							/*
								개발 Part 14 (검수) - E6
								forEach 내부는 try/catch 밖이라 예외가 나면
								이후 players.set / assets.set 이 전부 건너뛰어진다.
								MapGuard 로 이미 보장되지만, 이 블록이 예외의
								실제 발생 지점이었으므로 진입 직전에 한 번 더 확인한다.
							*/
							if(!window.map.biomes){
								window.map.biomes = {}
							}
							if(!window.map.nonces){
								window.map.nonces = []
							}
							biomes.forEach(function(b, i){
								var _id = crc32(cc_address+"#"+b.biome+b.x+b.z).toString(32).toUpperCase()
								if(
									(biomes.x - size < b.x && biomes.x + size > b.x) &&
									(biomes.z - size < b.z && biomes.z + size > b.z) &&
									!window.map.biomes[_id]
								){
									if(Math.random() < 0.1){
										var _date = new Date(new Date() - time.offset)
											_date = _date.toISOString()
												.replace(/T/, ' ')
												.replace(/\..+/, '')

										var color = window.Biomes["#"+b.biome]

										var emoji = window.Biomes[color]

										if(emoji){
											window.map.biomes[_id] = {
												id : _id,
												hash : cc_address,
												name : "#"+b.biome,
												value : "",
												color: "",
												x : b.x,
												y : b.y - 0.5,
												z : b.z
											}

											var _row = {
												Id : _id,
												Cc : b.x+','+b.z+" #"+b.biome+" 0x"+cc_address
											}

											window.map.nonces[_id] = _row
										}
									}
								}
							})
						}
					}

					if(plant){
						_players.push(plant)
					}
					/*
						개발 Part 14 (검수) - G1
						React 중복 key 경고를 차단한다.
						  Warning: Encountered two children with the same key, `42df07...`
						Experience.jsx 는 <Player key={player.hash} /> 로 렌더하므로
						_players 안에 같은 hash 가 두 번 들어가면 경고가 난다.
						중복이 생기는 경로가 여러 개다.
						  1) 서버가 같은 계정을 #position 과 #start(#nonce) 로 두 행에 담는다.
						  2) 익명 계정(cookies.address == "")에서는
						     if(cookies.address){ if(cookies.hash == _from){ continue } }
						     가 실행되지 않아 자기 자신이 걸러지지 않는다.
						  3) rows[_from] = true 가드는 _from 이 nonce 로 치환되는 경로에서
						     서로 다른 키를 쓰게 되어 같은 hash 를 두 번 통과시킨다.
						  4) plant(폭탄)는 hash 가 ZeroAddress 로 고정이라
						     두 번 심으면 중복이 된다.
						개별 분기를 고치면 남은 경로가 또 터지므로
						set 직전에 해시 기준으로 한 번 정리한다.
						뒤에 온 항목이 최신이므로 뒤를 남긴다.
						cnt 는 배열의 커스텀 속성이라 새 배열로 옮겨 준다.
					*/
					var _uniq = []
					var _seenHash = {}
					for(var _pi = _players.length - 1; _pi >= 0; _pi--){
						var _p = _players[_pi]
						if(!_p || typeof _p !== "object"){
							continue
						}
						var _pk = (_p.hash === null || typeof _p.hash === "undefined")
							? "" : String(_p.hash)
						if(!_pk){
							continue
						}
						if(_seenHash[_pk]){
							continue
						}
						_seenHash[_pk] = true
						_uniq.unshift(_p)
					}
					_uniq.cnt = _players.cnt ? _players.cnt : 0
					/* 문자열 키(좌표 조회용)를 새 배열로 옮긴다 */
					for(var _pkey in _players){
						if(_players.hasOwnProperty(_pkey) && isNaN(_pkey * 1)){
							if(_pkey !== "cnt"){
								_uniq[_pkey] = _players[_pkey]
							}
						}
					}
					_players = _uniq
					try{
						if(window.players){
							/*
								개발 Part 16 (미니맵)
								현행 문제
								  1) 조건이 !window.players.length 라
								     플레이어가 한 명이라도 렌더된 뒤에는
								     썸네일이 영구히 갱신되지 않았다.
								     첫 폴링에는 아직 캔버스가 비어 있어
								     결국 빈 이미지가 고정됐다.
								  2) canvas.toDataURL() 을 직접 불러
								     캔버스 부재 시 TypeError 로 아래 전부가 건너뛰어졌다.
								조치
								  MapGen.sync() 가
								    타일 확보 -> 2D 평면화 -> base64 -> #map img[src]
								  를 한 번에 처리한다.
								  이미 만들어져 있으면 문자열 비교 1 회로 끝나므로
								  폴링마다 호출해도 비용이 없다.
								  실패해도 자체 try/catch 안에서 삼켜
								  3D 렌더 갱신을 막지 않는다.
							*/
							try{
								if(window.MapGen && window.MapGen.sync){
									window.MapGen.sync()
								}
							}catch(err){
								console.log("map thumb err", err)
							}
							if(JSON.stringify(window.players) != JSON.stringify(_players)){
								diff = true
								window.players.set(_players)
							}
						}
						if(window.assets){
							if(JSON.stringify(window.assets) != JSON.stringify(_assets)){
								diff = true
								window.assets.set(_assets)
							}
						}
						window.setFrameloop("always")

						if(bingo_body){
							$("#bingo").html(bingo_body)

							var $bingo = $("#bingo").find('[style*="transform-origin"]')

							$bingo.each(function(){
								var $t = $(this);

								var amount = 4;

								if($bingo.length > 5){
									amount = 2
								}
								
								var totalSquares = Math.pow(amount, 2);
								
								var $clipped = $t.find('.clipped')
									$clipped.addClass("on")
								var width = $clipped.width() / amount;
								var height = $clipped.height() / amount;
								
								var y = 0;

								var body = ""
								
								for(var z = 0; z <= (amount*width); z = z+width) { 
									body += `<clipped style="clip: rect(${y}px, ${(z+width)}px, ${(y+height)}px, ${z}px)"></clipped>`

									if(z === (amount*width)-width) {
									
										y = y + height;
										z = -width;
									
									}
									
									if(y === (amount*height)) {
										z = 9999999;
									}
									
								}

								$t.append(body)
							})

							$('clipped').each(function() {
								var v = random(120, 90),
									angle = random(89, 80),
									theta = (angle * Math.PI) / 180,
									g = -9.8;

								var $self = $(this);

								var t = 0,
									z, r, nx, ny,
									totalt =  15;

								var negate = [1, -1, 0],
									direction = negate[ Math.floor(Math.random() * negate.length) ];

								var randDeg = random(-5, 10), 
									randScale = random(0.9, 1.1),
									randDeg2 = random(30, 5);

								$(this).css({
									'transform' : 'scale('+randScale+') skew('+randDeg+'deg) rotateZ('+randDeg2+'deg)'
								});

								z = setInterval(function(index) { 	
									var ux = ( Math.cos(theta) * v ) * direction;
									
									var uy = ( Math.sin(theta) * v ) - ( (-g) * t);
									
									nx = (ux * t);		
									ny = (uy * t) + (0.5 * (g) * Math.pow(t, 2));
									
									$self.css({'bottom' : (ny)+'px', 'left' : (nx)+'px'});
									
									t = t + 0.5;
									
									if(t > totalt) {
										$self.closest('[style*="transform-origin"]').remove()
										clearInterval(z);
									}
								},50);
							});

						}

						var after_body = ''

						var afterSticker = []
						
						if(stickers.length){
							for(var i = 0; i < stickers.length; i++){
								var row = stickers[i]
								var emoji = row.Emoji
		
								var cnt = stickers[emoji].length
								var len = cnt - 1

								var _el = $('[id="'+row.Id+'"]')

								if(!window.sticker[row.Id]){
									window.sticker[row.Id] = true
									stickers[len].new = true
								}

								var isToggle = false

								if(_el.length){
									isToggle = _el.hasClass("on")
								}

								if(len == row.index){
									if(row.new){
										afterSticker.push(row)
									}
									after_body += `<div id="${row.Id}" draggable="false" class="emoji_asset ${(isToggle ? "on" : "")} ${(row.new ? "new" : "")}" emoji="${emoji}" cnt="${cnt}" type="item"><a color="${row.color ? "color" : ""}" class="emoji color">${emoji}</a><span class="cnt">${cnt}</span></div>`	
								}
							}
						}

						$('[id="'+player_hash+'"] items ul').html(after_body)

						
						var before_body = $("emojis .items").html()
						if(before_body){
							before_body = before_body.replace(/\t/gi,"").replace(/\n/gi,"").trim()
						}

						after_body = after_body.replace(/\t/gi,"").replace(/\n/gi,"").trim()

						if(before_body != after_body){
							$("emojis .items").html(after_body)
						}

						var $player = $('player[self="true"]')

						if(afterSticker.length && $player.length){
							var beforeOffset = $player.offset()

							var $size = $player.find('img[alt="player"]')

							var w = $size.width()
							var h = $size.height()

							try{
								for(var i = 0; i < afterSticker.length; i++){
									setTimeout(function(row){
										var $sticker = $('[id="'+row.Id+'"]')

										if($sticker.length){
											var afterOffset = $sticker.offset()

											$sticker
												.animate({path : new $.path.bezier({
													start: { 
														x: (beforeOffset.left- (w/4)), 
														y: (beforeOffset.top - h), 
														angle: 90
													},	
													end: { 
														x: (beforeOffset.left- w), 
														y: (beforeOffset.top - (h*2)), 
														angle: 90
													}
												})}, 400)
												.animate({path : new $.path.bezier({
													start: { 
														x: (beforeOffset.left - w), 
														y: (beforeOffset.top - (h*2)), 
														angle: 90
													},	
													end: { 
														x: afterOffset.left - 30, 
														y: afterOffset.top - 35,
														angle: 90
													}
												})}, 100, function(){
													setTimeout(function($el){
														$el
															.removeClass("new")
															.attr("style", "")

														$root.scrollTop(0)
													},100, $(this))
												})
										}
									}, 100*i, afterSticker[i])
								}
							}catch(err){

							}							
						}

					}catch(err){
						console.log("err",err);
					}

					var after_body = ""
					flags.forEach(function(flag){
						/*
							개발 Part 4
							서버가 rows[] 에 x / z / dice / emoji / __team 을 함께 실어 보낸다.
							Cc 파싱은 값이 없을 때만 폴백으로 수행한다.
							개발 Part 14 (검수) - E15
							  flag 가 null 이거나 Cc 가 없는 항목이 섞일 수 있어
							  진입 직전에 걸러낸다.
						*/
						if(!flag || typeof flag !== "object"){
							return
						}
						var hashtag = getHashtag(flag.Cc)
						try{
							if(typeof flag.x == "undefined"){
								var position = flag.Cc.split(` ${hashtag}`)[0]
									position = JSON.parse(`[${position}]`)
								flag.x = position[0] * 1
								flag.z = position[1] * 1
								flag.dice = position[2] * 1
							}else{
								flag.x = flag.x * 1
								flag.z = flag.z * 1
								flag.dice = flag.dice * 1
							}
							var color = flag.__team ? flag.__team : hashtag.replace("#","")
							var emoji = typeof flag.emoji != "undefined" ? flag.emoji : flag.Cc.split("@")[1]
							flag_players.forEach(function(player, i){
								var typeof_emoji = window.typeof_emoji(player.emoji)
								if(
									((flag.x - size < player.x && flag.x + size > player.x) &&
									(flag.z - size < player.z && flag.z + size > player.z) &&
									!player.self && typeof_emoji) || (!player.self && player.team == self_player.team)
								){
									var _color = player.team.replace("#","")
									after_body += `<div style="top:${((player.z * 2))}px;left:${((player.x * 2))}px;" class="flag ${_color}"><div class="tb"><div class="tc"><i class="${_color} emoji color">${player.emoji}</i></div></div></div>`
								}
							})
							after_body += `<div style="top:${((flag.z * 2))}px;left:${((flag.x * 2))}px;" class="flag ${color}"><div class="tb"><div class="tc"><i class="${color} emoji color">${emoji}</i></div></div></div>`
							if(flag.dice == 0){
								var _teamTag = "#" + color
								if(typeof flags[_teamTag] == "undefined"){
									flags[_teamTag] = 0
								}
								flags[_teamTag]++
								if(flag.From.indexOf(self_player.hash) > -1){
									if(_teamTag == self_player.team){
										flags[flag.From]++
									}
								}else{
									flags[flag.From]++
								}
							}else{
								flags.temp++
							}
						}catch(err){
							console.log("flag",flag);
						}	
					})

					var $flags = $('#map flags')
					var before_body = $flags.html()
					if(before_body){
						before_body = before_body.replace(/\t/gi,"").replace(/\n/gi,"").trim()
					}

					after_body = after_body.replace(/\t/gi,"").replace(/\n/gi,"").trim()

					if(before_body != after_body){
						$flags.html(after_body)
					}

					if(meme.poly && meme.provider){
						if(!$meme[meme.id]){
							var ready = function(){
								$meme.addClass("poly")

								$meme[meme.id] = true
								$meme.poly.contentWindow.postMessage( JSON.stringify(meme), $meme.src );

								window.onmessage = function(resp){
									if($meme.src.indexOf(resp.origin) > -1){
										window.onmessage = null
										$meme.removeClass("poly")
									}
									
								}
							}

							if(!$meme.poly.ready){
								$meme.poly.ready = ready
							}else{
								ready()
							}
						}
					}

				
					if(cookies.team){
						var _team = cookies.team.replace("#","")

						$("#flag .red .cnt").text(flags["#red"] ? flags["#red"] : 0)
						$("#flag .blue .cnt").text(flags["#blue"] ? flags["#blue"] : 0)
						$("#flag ."+_team+" .temp").text(flags.temp ? flags.temp : "")
						$("#flag ."+_team).addClass("on")
					}

					
					try{
						if(resp.body.body.cc == "dice"){
							throw true
						}

						setTimeout(function(){
							for(var i = 0; i < window.players.length; i++){
								var _player = window.players[i]

								try{
									var $player = $('player[id="'+_player.hash+'"]')
									var $tooltip = $player.find("tooltip ul");
										$tooltip.removeClass("open")

									var _player_hash = _player.hash.indexOf("0x") == 0 ? _player.hash.replace("0x", "") : _player.hash
										_player_hash = _player_hash.toLowerCase()

									var tooltip_body = ""

									var cnt = 0

									if(flags[_player_hash]){
										cnt = flags[_player_hash]
									}

									var hex = window.emojiUnicode("🔥")
										
									var src = `/src/fonts/emoji/animated/${hex}.webp`

									if(_player.emoji == "🔥"){
										// tooltip_body = `<li>
										// 	<a class="hashType"></a>
										// </li>
										// <li>
										// 	<a class="hashType">🏗</a>
										// </li>
										// <li>
										// 	<a class="hashType"></a>
										// </li>`
									}else if(player_hash.indexOf(_player_hash) > -1){
										var _maxHp = window.MaxHp[cookies.role ? cookies.role : ""]
										var _hp = typeof cookies.hp != "undefined" ? cookies.hp : _maxHp
										/*
											개발 Part 17 (HUD)
											HP li 를 툴팁에서 제거하고 #capture .rank_toggle 로 옮긴다.
											a.hashType.Hp 클래스는 그대로이므로
											아래 BoardInit 의 $this.hasClass("Hp") 위임 핸들러가
											위치와 무관하게 계속 동작한다.
										*/
										if(window.HpBadge){
											window.HpBadge(_hp, _maxHp)
										}
										/*
											개발 Part 29 (게이트 출격)
											게이트 칸 + 미출격일 때만 첫 슬롯을 출격 버튼으로 바꾼다.
											슬롯 수가 3개로 고정이므로 Fire 자리를 빌린다.
											(보드게임 모드에서는 깃발이 의미가 없다)
											그 외에는 기존 Fire 버튼 그대로다.
										*/
										var _slotBody = `<a class="hashType Fire"><img src="${src}"><span class="cnt">${cnt}</span></a>`
										try{
											if(!cookies.enter && window.EdgeField){
												var _gf = window.EdgeField(self_player.x, self_player.z)
												if(_gf && _gf.gate){
													_slotBody = `<a class="hashType Deploy emoji color"><i class="emoji color">🚪</i></a>`
												}
											}
										}catch(err){
										}
										tooltip_body = `<li>
											${_slotBody}
										</li>
										<li>
											<a class="hashType Meta emoji color">
												<i></i>
												<div id="dice" class="slot-machine">
													<div class="slotwrapper">
														<ul>
															<li>1</li>
															<li>2</li>
															<li>3</li>
															<li>4</li>
															<li>5</li>
															<li>6</li>
														</ul>
														<div class="num">${Math.ceil(Math.sqrt(Math.pow(dice, 2)))}</div>
													</div>
												</div>
											</a>
										</li>
										<li>
											<a class="hashType Balance emoji color"><i class="emoji color"></i><span class="cnt">${nFormatter(cookies.balance,1)}</span></a>
										</li>`
									}else{
										var typeDice = false
										if(_players[_player_hash]){
											typeDice = _players[_player_hash].dice
										}
										/*
											개발 Part 15 (규칙 R4)
											내가 링(edge) 위에 있으면 상대(플레이어 / NPC)에 대한
											공격 선택지를 노출하지 않는다.
											서버도 링에서는 자동 교전과 폭발을 막으므로
											버튼만 보이고 아무 일도 일어나지 않는 상태를 없앤다.
											신고(Report)는 전투가 아니므로 항상 노출한다.
										*/
										var _meOnEdge = false
										try{
											var _me = window.players.self()
											_meOnEdge = window.IsEdge(_me.x, _me.z)
										}catch(err){
											_meOnEdge = false
										}
										if(_meOnEdge){
											tooltip_body = `<li>
												<a class="hashType"></a>
											</li>
											<li>
												<a class="hashType"></a>
											</li>
											<li>
												<a class="hashType Report">Report</a>\
											</li>`
										}else{
											tooltip_body = `<li>
												<a class="hashType Fire"><img src="${src}"><span class="cnt">${cnt}</span></a>
											</li>
											<li>
												<a class="hashType Meta emoji color">${typeDice ? `<i></i>` : ""}</a>
											</li>
											<li>
												<a class="hashType Report">Report</a>\
											</li>`
										}
									}

									var before_body = $tooltip.html()
									if(before_body){
										before_body = before_body.replace(/\t/gi,"").replace(/\n/gi,"").trim()
									}

									var after_body = tooltip_body.replace(/\t/gi,"").replace(/\n/gi,"").trim()

									if(before_body != after_body){
										$tooltip.html(after_body)
									}
								}catch(err){
									console.log("err",err);
								}
							}
						},300)
					}catch(err){
						// console.log("Err",err);
					}

					var plyrs = []

					var $talk = $("talks."+player_hash)

					var $form = document.querySelector('form[name="oauth.network"]')

					if(_messages.length){
						var notify_body = ""
						var message_body = ""
						var onMessage = false

						var talks_selector = ""

						var flows = []

						for(var m = 0; m < _messages.length; m++){
							var row = _messages[m];

							var isMessage = row.Cc.indexOf("#open") == -1 && row.Cc.indexOf("#reward") == -1

							var duplication = !document.querySelector('messages ul li[id="'+row.Id+'"]')

							if(isMessage && duplication){
								var Idx

								var $items = document.createElement("items");

								onMessage = true

								var text = `<span>${row.Subject}</span>`

								var $talks = $("talks."+row.From+" ul")

								if($talks.length && !resp.body.query.date){
									if(talks_selector){
										talks_selector += ", "
									}

									talks_selector += "talks."+row.From

									if(!document.querySelector(`talks ul li[id="${row.Id}"]`)){
										$talks.append(`<li class="item" id="${row.Id}">
											<div class="text">
												<span class="icon" data-from="${row.From}"></span>
												${text}
											</div>
										</li>`)
									}
								}

								message_body += `<li id="${row.Id}" class="${(player_hash == row.From ? "self" : "")} item message">
									<div class="text">
										<span class="icon" data-from="${row.From}"></span>
										<text>${text}</text>
									</div>
									<input type="hidden" name="date" value="${row.Date}">\
								</li>`

							}else if(row.Cc.indexOf("#reward") > -1 && duplication){
								// var position = row.Cc.split(" #reward")[0]

								// var asset = JSON.parse("["+position+"]")

								// notify_body += '<li id="'+row.Id+'" class="item notify open '+(player_hash == row.From ? "self" : "")+'">\
								// 	<div class="text">\
								// 		<span class="icon" data-from="'+row.From+'"></span>\
								// 		<text><span class="xyz">['+Math.floor(asset[0])+','+Math.floor(asset[1])+'] Reward</span></text>\
								// 	</div>\
								// </li>'
							}
						}

						var $messages_ul = $("messages ul")

						var scrollBottom = $messages_ul.html() ? false : true

						if(message_body){
							if(resp.body.query.date){
								$messages_ul.prepend(message_body)
							}else{
								$messages_ul.append(message_body)
							}
						}

						for(var m = 0; m < _messages.length; m++){
							var row = _messages[m];

							var isMessage = row.Cc.indexOf("#open") == -1 && row.Cc.indexOf("#reward") == -1

							var duplication = $('messages ul>li[id="'+row.Id+'"]')

							try{
								if(isMessage && duplication.length && row.Flag){
									try{
										var flag = ""

										var flags = row.Flag.split(" ")
										
										for(var f = 0; f < flags.length; f++){
											if(isNaN(flags[f])){
												flag = flags[f]
											}
										}

										var _row = _messages[m-1];
										var _id = ""
										if(_row){
											var el = $('messages li[id="'+_row.Id+'"]').find('item[id="'+flag+'"]')
											if(el.length){
												duplication.html("")
												/*
													개발 Part 14 (검수) - E14
													blockies.create + canvas.toDataURL() 2 회 호출을
													BlockieUrl 1 회로 바꾼다.
													row.From 이 "0x" 접두 유무로 갈리던 분기도 흡수된다.
												*/
												var _flowUrl = window.BlockieUrl(row.From)
												if(row.Flag.indexOf(" ") == -1){
													var _date = new Date(row.Subject)
													if(isNaN(_date)){
														el.attr("checked","checked").css("background-image", "url("+_flowUrl+")")
													}else{
														var $item = $(document.createElement("item"))
															$item.css("background","none").attr({
																"checked":"checked",
																"disabled" : "disabled"
															}).text(row.Subject)
														var $bg = $(document.createElement("span"))
															$bg.css("background-image", "url("+_flowUrl+")")
														
														$item.append($bg)
														el.closest("items").html("").append($item)
													}
												}
											}
										}
									}catch(err){
										console.log("err",err);
									}
								}
							}catch(err){
								console.log("Err",err);
							}
						}

						var scrollHeight = document.documentElement.scrollHeight - (window.innerHeight / 10)

						var currentScrollHeight = Math.ceil((window.innerHeight + window.scrollY) / 10) * 10

						if (
							(typeof window.Poll.ing == "undefined") || 
							(resp.body.body.cc == "message") || 
							(scrollHeight - currentScrollHeight < 0 && window.scrollY > 0)) 
						{
							scrollBottom = true
						}

						if(scrollBottom){
							var h = document.documentElement.scrollHeight

							$root.scrollTop(h)
						}

						if(notify_body){
							$("notify ol").append(notify_body)
						}

						/*
							개발 Part 14 (검수) - E7
							"0x"+hash 는 hash 가 빈 문자열일 때 "0x" 가 되어
							blockies 가 null 을 반환했다.
							BlockieUrl 이 형식 정규화와 null 방어를 함께 처리한다.
							빈 결과면 배경을 건드리지 않는다.
						*/
						var $icons = $("messages li .icon")
						if($icons.length){
							$icons.each(function(i, el){
								var _url = window.BlockieUrl(el.dataset.from)
								if(_url){
									$icons.eq(i).css("background-image", "url("+_url+")")
								}
							})
						}
						var $icons = $("talks li .icon")
						if($icons.length){
							$icons.each(function(i, el){
								var _url = window.BlockieUrl(el.dataset.from)
								if(_url){
									$icons.eq(i).css("background-image", "url("+_url+")")
								}
							})
						}

						if(onMessage){
							$messages.addClass("on")

							$(talks_selector).addClass("on")
						}
					}

					if(cookies.damage || cookies.dead){
						/*
							개발 Part 15 (규칙 R1 / R2)
							사망 시 보드 폴링을 멈추되, 마이룸 이동 경로는 열어 둔다.
							window.onhashchange 가 RoomHashChange 를 호출하며
							거기서 Poll.ing 을 다시 세팅하므로
							여기서 멈춘 인터벌이 마이룸 진입을 막지는 않는다.
							dead 속성은 CSS 가 보드 UI(주사위 / 이모지 덱 / 조이스틱)를
							숨기는 데 쓴다.
						*/
						$body.attr('game',"over")
						$body.attr('dead',"true")
						clearInterval(window.Poll.ing)
						delete window.Poll.ing
						try{
							if(window.StageSync){
								window.StageSync(cookies)
							}
						}catch(err){
						}
					}else{
						$body.removeAttr('game')
						$body.removeAttr('dead')
					}

					var $loading = $('messages ul li.loading, messages ul li[id=""], talks ul li[id=""]')
					
					if($loading.length){
						$loading.remove()
					}

					if(typeof OAuth3.timeout != "undefined"){
						delete OAuth3.timeout
					}else{
						OAuth3.timeout = setTimeout(function(){
							if(!$aside.hasClass("on")){
								$messages.removeClass("on")
								$("talks").removeClass("on")
							}
						},3000)
					}

					if(cookies.email){
						$status.innerHTML = ''
					}else{
						$status.innerHTML = '<a href="/login/">Sign In</a>'
					}

					if($body.hasClass("loading") && (window.frameloop == "demand" || window.frameloop == "never" || window.tutorial)){
						try{
							var _address = ethers.hashMessage(resp.query.href.replace(window.location.protocol+"//",""))
								_address = ethers.computeAddress(cc_address).toLowerCase()

							if(window.location.hash){
								_address = window.location.hash.replace("#", "0x")
							}

							if(_address.indexOf(cc_address) > -1){
								$body.removeAttr("class")
							}
						}catch(err){
							$body.removeAttr("class")
						}
					}

					// var dice = 1

					if(!isNaN(_dice)){
						if(!_dice){
							_dice = dice

							if(Math.ceil(dice) > 0){
								dice = Math.ceil(dice)
							}
						}else if(Math.sqrt(Math.pow(dice, 2)) == Math.sqrt(Math.pow(_dice, 2))){
							dice = Math.ceil(Math.sqrt(Math.pow(dice, 2))) * -1
						}else{
							dice = Math.ceil(Math.sqrt(Math.pow(dice, 2)))
						}
					}

					$body
						.removeAttr("bingo")
						.attr("dice",dice)
						.attr("team",cookies.team ? cookies.team : "")
						.attr("balance",cookies.balance)
						.attr("role",cookies.role ? cookies.role : "")
						.attr("hp",typeof cookies.hp != "undefined" ? cookies.hp : "")
						.attr("maxhp",window.MaxHp[cookies.role ? cookies.role : ""])

					try{
						if($('emojis .items .emoji_asset[emoji="🧪"]').length){
							$body.attr("potion", "on")
						}else{
							$body.removeAttr("potion")
						}
					}catch(err){

					}

					try{
						if(cookies.onJail && !window.BoardCallback.jailed){
							window.BoardCallback.jailed = true
							/*
								개발 Part 30 (감옥 = 필드 진입점)
								감옥 칸은 안전지대이자 링을 벗어나는 유일한 지점이다.
								기존 문구 "You can move freely here" 는
								"이 칸 안에서 자유롭다" 로 읽혀 진입점이라는 사실이 전달되지 않았다.
								칸을 벗어나면 다시 주사위 전용으로 돌아간다는 것도 함께 알린다.
							*/
							window.Notice("SAFE ZONE",
								"Step off the path into the field. Leave this tile and it's dice only again",
								3200)
						}else if(!cookies.onJail){
							delete window.BoardCallback.jailed
						}
					}catch(err){
					}

					// $root.scrollTop(0)

					if(!window.Init.done["board"]){
						window.Init(cookies)
						window.cookies.dice = 0
					}

					if(window.Poll.ing){
						if(OAuth3.xhr){
							OAuth3.xhr.abort()
							delete OAuth3.xhr

							window.response = resp
						}
					}

					if(typeof window.Poll.ing == "undefined" && !cookies.damage){
						if(cookies.hash){
							clearInterval(window.Roll.ing)
							delete window.Roll.ing

							window.Poll.ing = setInterval(window.Poll, time.balance)
						}else{
							window.location.href = OAuth3.host+"/logout"
						}
					}else if(dice > 0 && typeof window.Roll.ing == "undefined"){
						clearInterval(window.Poll.ing)
						delete window.Poll.ing
						/*
							개발 Part 22 (룩어헤드 격리)
							이전 주사위 인터벌이 남아 있으면 정리한다.
							window.response 에 원본 응답을 저장하지 않는다.
							저장하면 dice 소진 후 재처리 경로에서
							원본 cookies.dice 가 복원되어 링 회전이 반복된다.
						*/
						if(typeof window.Roll.ing !== "undefined"){
							clearInterval(window.Roll.ing)
							delete window.Roll.ing
							window.Roll.snap = null
							window.Roll.prevX = null
							window.Roll.prevZ = null
						}
						if(window.Roll.back){
							window.Roll.back.options.endNum = dice
							window.Roll.back.loopCount = 6
						}
						setTimeout(function(){
							$('#root player tooltip .slotwrapper ul').removeAttr("style")
							$('#root player tooltip #dice .num').text(dice)

							/*
								개발 Part 22 (룩어헤드 격리)
								주사위 시작 시점에 window.fields 를 통째로 복사한다.
								요소는 얕은 복사가 아니라 좌표만 복사한 새 객체다.
								BoardCallback 이 원본을 회전시키거나 좌표 키를 지워도
								window.Roll.snap 은 변하지 않는다.
								좌표 키를 문자열로 다시 부여한다.
							*/
							var _src = window.fields
							var _snap = []
							var _snapKeys = {}
							if(_src && _src.length){
								for(var _si = 0; _si < _src.length; _si++){
									var _orig = _src[_si]
									if(!_orig){ continue }
									var _copy = {
										x : _orig.x * 1,
										z : _orig.z * 1,
										y : typeof _orig.y !== "undefined" ? _orig.y * 1 : 0,
										i : _si
									}
									_snap.push(_copy)
									_snapKeys[_copy.x + ":" + _copy.z] = _si
								}
								_snap.ring = true
							}
							window.Roll.snap = _snap
							window.Roll.snapKeys = _snapKeys
							/*
								개발 Part 28 (순회 경로 스냅샷)
								ring 스냅샷과 별개로 "왕복이 살아 있는 경로" 를 복사한다.
								두 배열의 역할이 다르다.
								  snap / snapKeys  좌표 -> 링 인덱스 1:1. Edge 판정과 폴백용.
								  path / pathKeys  좌표 -> 경로 인덱스 1:N. 실제 전진용.
								                   스퍼 왕복 칸은 같은 좌표가 2회 이상 등장하므로
								                   값이 배열이다.
								pathIdx 는 현재 경로 커서다. -1 은 미확정을 뜻하며
								RollNext 가 좌표로 복원한다.
							*/
							var _pathSrc = (typeof window.RollPath === "function") ? window.RollPath() : null
							var _path = []
							var _pathKeys = {}
							if(_pathSrc && _pathSrc.length){
								for(var _pi = 0; _pi < _pathSrc.length; _pi++){
									var _porig = _pathSrc[_pi]
									if(!_porig){ continue }
									var _pcopy = {
										x : _porig.x * 1,
										z : _porig.z * 1,
										i : _path.length
									}
									var _pkey = _pcopy.x + ":" + _pcopy.z
									if(!_pathKeys[_pkey]){
										_pathKeys[_pkey] = []
									}
									_pathKeys[_pkey].push(_pcopy.i)
									_path.push(_pcopy)
								}
								_path.closed = _pathSrc.closed ? true : false
							}
							window.Roll.path = _path.length ? _path : null
							window.Roll.pathKeys = _pathKeys
							window.Roll.pathIdx = -1

							/*
								개발 Part 28 (다층 전진 결정)
								계층 구조. 위층이 성공하면 아래층은 실행되지 않는다.
								  1층 경로 커서
								      path[i] -> path[i+1].
								      Moore 경계추적 결과라 항상 8방향 인접이며
								      스퍼(머리카락)는 실제로 되돌아 나온다.
								      각도 계산이 개입하지 않으므로 뒤로 회귀할 수 없다.
								  2층 좌표 -> 경로 인덱스 복원
								      서버 좌표 동기화 등으로 커서를 잃었을 때만 동작.
								      왕복 구간은 같은 좌표가 2회 이상 등장하므로
								      (a) 직전 칸 일치 (b) 진행 방향 코사인
								      (c) 마지막 커서와의 전방 근접도 로 후보를 가른다.
								  3층 인접 + 룩어헤드 벡터 유사도
								      경로 자체를 확보하지 못한 경우(Serpentine 폴백)만 동작.
								      막다른 칸에서는 강제 점프가 아니라 U턴을 돌려준다.
								      Part 23 / 25 / 27 의 점프 보너스는 전부 제거한다.
								      그것이 스퍼 끝에서 좌표를 멀리 던지고
								      직후 prev 를 오염시켜 "뒤로 회귀" 를 만든 원인이다.
								  4층 링 순서
								      마지막 안전장치.
								반환값은 { x, z, y } 이며 y 는 조회 실패 시 undefined 다.
								호출부(window.Roll)가 현재 높이로 폴백한다.
							*/
							window.RollNext = function(_cx, _cz, _px, _pz){
								var dirs8 = [[-1,0],[-1,-1],[0,-1],[1,-1],[1,0],[1,1],[0,1],[-1,1]]
								var _snapArr = window.Roll.snap
								var _keys = window.Roll.snapKeys ? window.Roll.snapKeys : {}
								var _snapLen = _snapArr ? _snapArr.length : 0
								var _path = window.Roll.path
								var _pathKeys = window.Roll.pathKeys ? window.Roll.pathKeys : {}
								var _pathLen = _path ? _path.length : 0
								_cx = _cx * 1
								_cz = _cz * 1
								if(isNaN(_cx) || isNaN(_cz)){
									return null
								}
								var _hasPrev = false
								if(_px !== null && typeof _px !== "undefined" && _pz !== null && typeof _pz !== "undefined"){
									_px = _px * 1
									_pz = _pz * 1
									_hasPrev = (!isNaN(_px) && !isNaN(_pz))
								}
								var _ck = _cx + ":" + _cz
								/* 진행 방향. 이전 좌표가 없으면 +x 를 기준으로 둔다 */
								var dirX = 1
								var dirZ = 0
								if(_hasPrev && (_px !== _cx || _pz !== _cz)){
									var _vx = _cx - _px
									var _vz = _cz - _pz
									var _vm = Math.sqrt((_vx * _vx) + (_vz * _vz))
									if(_vm > 0){
										dirX = _vx / _vm
										dirZ = _vz / _vm
									}
								}
								var _tileY = function(x, z){
									var k = x + ":" + z
									try{
										var b = window.map.biomes[k]
										if(b && typeof b.y !== "undefined"){
											return b.y * 1
										}
									}catch(err){
									}
									var i = _keys[k]
									if(typeof i !== "undefined" && _snapArr && _snapArr[i]){
										if(typeof _snapArr[i].y !== "undefined"){
											return _snapArr[i].y * 1
										}
									}
									return undefined
								}
								var _out = function(x, z){
									return {
										x : x,
										z : z,
										y : _tileY(x, z)
									}
								}
								var _adj = function(ax, az, bx, bz){
									var dx = Math.abs(ax - bx)
									var dz = Math.abs(az - bz)
									if(dx > 1 || dz > 1){
										return false
									}
									return (dx + dz) > 0
								}
								/* ---------- 1층 / 2층 : 순회 경로 커서 ---------- */
								if(_pathLen >= 3){
									var _ci = -1
									var _cur = -1
									if(typeof window.Roll.pathIdx === "number"){
										if(window.Roll.pathIdx >= 0 && window.Roll.pathIdx < _pathLen){
											_cur = window.Roll.pathIdx
										}
									}
									if(_cur >= 0 && _path[_cur].x === _cx && _path[_cur].z === _cz){
										/* 1층 : 커서가 현재 좌표와 일치한다 */
										_ci = _cur
									}else{
										/* 2층 : 좌표로 커서를 복원한다 */
										var _cand = _pathKeys[_ck]
										if(_cand && _cand.length){
											if(_cand.length === 1){
												_ci = _cand[0]
											}else{
												var _bestScore = -Infinity
												for(var _q = 0; _q < _cand.length; _q++){
													var _idx = _cand[_q]
													var _score = 0
													var _pv = _path[(_idx - 1 + _pathLen) % _pathLen]
													var _nt = _path[(_idx + 1) % _pathLen]
													/* (a) 직전 칸 일치. 가장 강한 근거다 */
													if(_hasPrev && _pv.x === _px && _pv.z === _pz){
														_score += 100
													}
													/* (b) 진행 방향 코사인 */
													var _ddx = _nt.x - _cx
													var _ddz = _nt.z - _cz
													var _dm = Math.sqrt((_ddx * _ddx) + (_ddz * _ddz))
													if(_dm > 0){
														_score += ((dirX * (_ddx / _dm)) + (dirZ * (_ddz / _dm))) * 10
													}
													/* (c) 마지막 커서와의 전방 근접도 */
													if(_cur >= 0){
														var _fwd = (_idx - _cur + _pathLen) % _pathLen
														if(_fwd === 0){
															_fwd = _pathLen
														}
														if(_fwd < 20){
															_score += (20 - _fwd)
														}
													}
													if(_score > _bestScore){
														_bestScore = _score
														_ci = _idx
													}
												}
											}
										}
									}
									if(_ci >= 0){
										var _ni = _ci + 1
										if(_ni >= _pathLen){
											_ni = 0
										}
										var _nx = _path[_ni]
										/*
											폐합되지 않은 경로에서 끝 -> 처음 으로 감을 때만
											인접이 깨진다. 그때는 커서를 버리고 아래 계층으로 내려간다.
										*/
										if(_nx && _adj(_cx, _cz, _nx.x, _nx.z)){
											window.Roll.pathIdx = _ni
											return _out(_nx.x, _nx.z)
										}
									}
									window.Roll.pathIdx = -1
								}
								/* ---------- 3층 : 인접 + 룩어헤드 벡터 유사도 ---------- */
								var LOOKAHEAD = (typeof window.RollLookahead === "number" && window.RollLookahead > 0)
									? window.RollLookahead : 4
								var _curIdx = (typeof _keys[_ck] !== "undefined") ? _keys[_ck] : -1
								var _step = function(sx, sz, sdx, sdz, spx, spz){
									var pick = null
									var pickCos = -Infinity
									for(var d = 0; d < dirs8.length; d++){
										var tx = sx + dirs8[d][0]
										var tz = sz + dirs8[d][1]
										if(tx === spx && tz === spz){
											continue
										}
										if(typeof _keys[tx + ":" + tz] === "undefined"){
											continue
										}
										var m = Math.sqrt((dirs8[d][0] * dirs8[d][0]) + (dirs8[d][1] * dirs8[d][1]))
										var ux = dirs8[d][0] / m
										var uz = dirs8[d][1] / m
										var cos = (sdx * ux) + (sdz * uz)
										if(cos > pickCos){
											pickCos = cos
											pick = {
												x : tx,
												z : tz,
												dx : ux,
												dz : uz,
												cos : cos
											}
										}
									}
									return pick
								}
								var _best = null
								var _bestTotal = -Infinity
								var _hasNeighbor = false
								for(var d0 = 0; d0 < dirs8.length; d0++){
									var fx = _cx + dirs8[d0][0]
									var fz = _cz + dirs8[d0][1]
									var fk = fx + ":" + fz
									if(typeof _keys[fk] === "undefined"){
										continue
									}
									_hasNeighbor = true
									if(_hasPrev && fx === _px && fz === _pz){
										continue
									}
									var fm = Math.sqrt((dirs8[d0][0] * dirs8[d0][0]) + (dirs8[d0][1] * dirs8[d0][1]))
									var fdx = dirs8[d0][0] / fm
									var fdz = dirs8[d0][1] / fm
									var total = (dirX * fdx) + (dirZ * fdz)
									/*
										링 순서 전방 보너스.
										동점 해소용이므로 코사인 항(최대 1.0)을 넘지 않는 크기로 둔다.
										값을 키우면 링 순서가 각도를 이겨 순간이동이 된다.
									*/
									if(_curIdx >= 0 && _snapLen > 0){
										var fwd0 = (_keys[fk] - _curIdx + _snapLen) % _snapLen
										if(fwd0 === 1){
											total += 0.30
										}else if(fwd0 === 2){
											total += 0.15
										}
									}
									var sx = fx
									var sz = fz
									var spx = _cx
									var spz = _cz
									var sdx = fdx
									var sdz = fdz
									for(var st = 0; st < LOOKAHEAD; st++){
										var nxt = _step(sx, sz, sdx, sdz, spx, spz)
										if(!nxt){
											break
										}
										total += nxt.cos * Math.pow(0.8, st + 1)
										spx = sx
										spz = sz
										sx = nxt.x
										sz = nxt.z
										sdx = nxt.dx
										sdz = nxt.dz
									}
									if(total > _bestTotal){
										_bestTotal = total
										_best = { x : fx, z : fz }
									}
								}
								if(_best){
									return _out(_best.x, _best.z)
								}
								/*
									전진 후보가 하나도 없다.
									스퍼 끝(머리카락 끝)이라는 뜻이므로 되돌아 나오는 것이 정상이다.
									여기서 링 인덱스로 점프하면 좌표가 멀리 튀고
									다음 스텝의 방향벡터가 뒤집혀 회귀가 시작된다.
								*/
								if(_hasPrev && _hasNeighbor){
									if(typeof _keys[_px + ":" + _pz] !== "undefined"){
										if(_adj(_cx, _cz, _px, _pz)){
											return _out(_px, _pz)
										}
									}
								}
								/* ---------- 4층 : 링 순서 ---------- */
								if(_curIdx >= 0 && _snapLen > 0){
									var li = _curIdx + 1
									if(li >= _snapLen){
										li = 0
									}
									var lt = _snapArr[li]
									if(lt){
										return _out(lt.x, lt.z)
									}
								}
								return null
							}

							window.Roll.prevX = null
							window.Roll.prevZ = null
							window.Roll.ing = setInterval(window.Roll, 500, biomes)
						}, 500)
					}
				}catch(err){
					console.log("err",err);
				}
			}
		}

		var response = function(res){
			var rows = res.body.rows
			var cookies = window.cookies = JSON.parse(res.body.cookies)

			$body.attr("address", cookies.address)

			var len = rows.length;

			var teams = {};

			var table = {};

			if(!rows.length){
				rows.push({
					Id : " ", // 게시글 아이디
					From : "", // 보낸 client kakao email
					To : "", // 받는 개인
					Cc : "", // 그룹 레퍼러
					Subject :"", // 제목
					Flag : "", //
					Date : new Date()
				})
			}

			var len = rows.length

			for(var f = 0; f < len; f++){
				var row = rows[f]

				teams[row.From] = row;
			}

			OAuth3.teams = teams;
			
			var contenteditable = false;

			
			document.querySelector("html").setAttribute("user-agent",res.body["user-agent"]);

			var url = new URL(window.location.href)

			var address = cookies.address ? cookies.address : ""

			var email = cookies.email ? cookies.email : ""

			if(cookies.email){
				if(OAuth3.teams){
					if(OAuth3.teams[address]){
						contenteditable = true;
						address = "";
					}
				}
			}

			var href = url.protocol+"//"+url.host+"/address/#"+(address ? address.replace("0x","") : cookies.hash)

			$('.inventory').attr("href", href+"/inventory")
			$('.exchange').attr("href", href)

			var query = {
				href : window.location.href,
				hash : cookies.hash,
				token : cookies.token
			}

			var mode = window.Mode(cookies)

			$body.attr("world", mode)

			if(mode == "room"){
				query.x = 1.5
				query.y = 0
				query.z = 1.5
			}else if(cookies.axis){
				if(window.MapGen){
					window.MapGen.apply()
				}
				var position = Respawn()

				query.x = position.x
				query.y = position.y
				query.z = position.z
			}


			var url = "https://memepoly.com";

			if(OAuth3.localhost){
				url = "http://localhost:3001"
			}

			OAuth3.fetch({
				method : "POST",
				query : query,
				url : url
			}, window.Callback)

			window.Report = function(){
				var player = window.players.self()

				if(player){
					var $form = document.forms.report
					var hash = $form.hash.value
					var token = $form.token.value

					/*
						개발 Part 8
						reason 을 함께 보낸다. 서버가 ENUM 으로 정규화하며
						미지정/미지원 값은 'other' 로 떨어진다.
						block 체크 시 차단까지 함께 수행한다.
					*/
					var body = {
						cc : "report",
						to : $form.to.value,
						emoji : $form.emoji.value,
						subject : $form.subject ? $form.subject.value : "",
						reason : $form.reason ? $form.reason.value : "other",
						block : ($form.block && $form.block.checked) ? true : false
					}
					if(body.to && body.emoji){
						$(".layer, .layer form.popup").removeClass("on")

						if(window.Mode() == "room"){
							window.RoomEmoji("🫥")
						}else{
							emojiChanged("🫥", true)
						}

						var query = {
							href : window.location.href,
							hash : hash,
							token : token,
							x : player.x,
							y : player.y,
							z : player.z
						}

						if(window.Mode() == "board"){
							var respawn = Respawn()

							query.x = player.x ? player.x : respawn.x
							query.y = player.y ? player.y : respawn.y
							query.z = player.z ? player.z : respawn.z
						}

						OAuth3.xhr = OAuth3.fetch({
							method : "POST",
							url : url,
							body : body,
							query : query
						}, window.Callback);
					}
				}
			}

			window.BoardPoll = async function(){
				try{
					var self_player = window.players.self()

					var cookies = window.cookies

					if(typeof self_player != "undefined"){
						if(cookies.hash && !OAuth3.xhr){
							var url = "https://memepoly.com"

							if(OAuth3.localhost){
								url = "http://localhost:3001"
							}

							var body = {
								emoji : window.emojis.message ? window.emojis.message : self_player.emoji
							}

							var dice = cookies.dice * 1

							var assets = []

							var $assets = $('.emoji_asset.on')

							$assets.each(function(index, el){
								var asset = {
									emoji : $(el).attr("emoji"),
									count : $(el).attr("cnt")
								}

								if(typeof_item(asset.emoji)){
									asset.address = ethers.hashMessage(asset.emoji)
									asset.address = ethers.computeAddress(asset.address).toLowerCase()

									assets.push(asset.address)
								}
							})

							var query = {
								dice : dice != 0 ? dice : 0,
								href : window.location.href,
								hash : cookies.hash,
								token : cookies.token,
								x : self_player.x,
								y : self_player.y,
								z : self_player.z
							}
							var _biome = window.BiomeAt(self_player.x, self_player.z)
							if(_biome){
								query.biome = _biome
							}
							/* 개발 Part 18 (Edge 판정) : 폴링에도 프론트 링 판정을 실어 보낸다 */
							if(window.EdgeReady && window.EdgeReady()){
								query.edge = window.IsEdge(self_player.x, self_player.z) ? 1 : 0
							}

							if(assets.length){
								query.assets = assets
							}

							if(OAuth3.nonces){
								if(OAuth3.nonces.length){
									body.nonces = []

									for(var i = 0; i < OAuth3.nonces.length; i++){
										var nonce = OAuth3.nonces[i]

										if(nonce){
											body.nonces.push(nonce)	
										}
									}

									body.nonces = JSON.stringify(body.nonces)
								}
							}

							if(window.Poll.date){
								query.date = window.Poll.date+""
								delete window.Poll.date
							}

							if(plant){
								body.cc = "bomb"
								
								body.x = plant.x
								body.z = plant.z
							}

							if(Object.keys(window.map.nonces).length){
								var rows = []

								for(var row in window.map.nonces){
									if(window.map.nonces.hasOwnProperty(row)) {
										if(!window.map.nonces[row].nonce && !window.map.biomes[row.Id]){
											rows.push(window.map.nonces[row])
										}
									}
								}

								if(rows.length){
									body.rows = rows
								}
							}

							OAuth3.xhr = OAuth3.fetch({
								method : "POST",
								url : url,
								body : body,
								query : query
							}, window.Callback);
						}
					}else if(window.response){
						window.setFrameloop("always")
						window.Callback(window.response)
					}
				}catch(err){
					console.log("err",err);

					if(OAuth3.xhr){
						OAuth3.xhr.abort()
						delete OAuth3.xhr
					}
				}
			}
		}

		window.BoardInit = function(cookies){
			var player_hash = cookies.address ? cookies.address : cookies.hash

			var tutorials = [
				"Move",
				"MineSweeper",
				"Puzzle",
				"Sticker",
				"Mine",
				"Portal",
				"Withdrawal"
			]

			var tutorial_body = '<option value="">Tutorial</option>';


			var len = tutorials.length

			for(var i = 0; i < len; i++){
				var value = tutorials[i]

				tutorial_body += `<option ${(i == len-1 ? "" : "disabled")} value="${value}">${value}</option>`

			}

			$('form[name="Tutorial"] .index select').html(tutorial_body)


			document.querySelector("#header nav").innerHTML = `<ul class="gnb">
				<li>
					<a href="/#${player_hash.replace("0x", "")}">
						<span class="address">
							<address>
								<span>#${player_hash.replace("0x", "")}</span>
								<span dir="rtl">${player_hash}</span>
							</address>
						</span>
					</a>
				</li>
				${(cookies.address ? `<li><a class="feedback">Feedback</a></li><li><a href="${OAuth3.host}/logout">Logout</a></li>` : '<li><a href="/login/">Login</a></li>')}
			</ul>`;

			$('#header label[for="nav"] canvas').remove()
			/*
				개발 Part 14 (검수) - E13
				blockies.create() 직접 호출을 Blockie() 로 바꾼다.
				appendChild 대상이 null 이면 TypeError 로 BoardInit 이 중단되고
				이후 클릭 핸들러 / joystick / emojis 목록이 전부 바인딩되지 않는다.
				라벨 엘리먼트 자체가 없을 수도 있어 함께 확인한다.
			*/
			var icon = window.Blockie(player_hash)
			var $navLabel = document.querySelector('#header label[for="nav"]')
			if(icon && $navLabel){
				$navLabel.appendChild(icon)
			}
			window.addEventListener('focus', function(){
				window.setFrameloop("always")
			})

			window.addEventListener('blur', function(){
				window.setFrameloop("demand")
			})

			$body.on({
				click : async function(e){
					if(window.Mode() != "board"){
						return
					}

					var $this = $(e.target)

					var cookies = window.cookies

					try{
						if($this.hasClass("continue")){
							if(cookies.team){
								if(cookies.pathname){
									if(cookies.pathname == window.location.pathname){
										$body.attr("mode", "third")
									}else{

									}	
								}else{
									$body.attr("mode", "third")
								}
							}else{
								var url = "https://memepoly.com/";

								if(OAuth3.localhost){
									url = "http://localhost:3001/"
								}

								if(time.out){
									clearTimeout(time.out)
									delete time.out
								}

								clearInterval(window.Poll.ing)
								delete window.Poll.ing

								if(OAuth3.xhr){
									OAuth3.xhr.abort()
									delete OAuth3.xhr
								}

								OAuth3.xhr = OAuth3.fetch({
									method : "POST",
									query : {
										href : window.location.href,
										hash : cookies.hash,
										token : cookies.token
									},
									body : {
										cc : "start"
									},
									url : url
								}, function(resp){
									OAuth3.nonces = []

									if(resp.body.nonces.length){
										var _nonces = resp.body.body.nonces

											
										for(var i = 0; i < resp.body.nonces.length; i++){
											var nonce = resp.body.nonces[i]

											var skip = true

											if(_nonces){
												if(_nonces.length){
													if(_nonces.indexOf(nonce) > -1){
														continue;
													}
												}
											}

											OAuth3.nonces.push(nonce)
										}

										if(OAuth3.nonces){
											var body = {}

											if(OAuth3.nonces.length){
												body.nonces = []

												for(var i = 0; i < OAuth3.nonces.length; i++){
													var nonce = OAuth3.nonces[i]

													if(nonce){
														body.nonces.push(nonce)
													}
												}

												body.nonces = JSON.stringify(body.nonces)
											}

											OAuth3.xhr = OAuth3.fetch({
												method : "POST",
												query : {
													href : window.location.href,
													hash : cookies.hash,
													token : cookies.token
												},
												body : body,
												url : url
											}, function(_resp){
												window.cookies = JSON.parse(_resp.body.cookies)

												$body.attr("team",cookies.team ? cookies.team : "")

												if(OAuth3.xhr){
													OAuth3.xhr.abort()
													delete OAuth3.xhr
												}

												window.response = _resp

												window.Callback(_resp)

												$root.scrollTop(0)
											})
										}
									}
								})

								return
							}
						}

						/*
							개발 Part 17 (미니맵)
							현행은 e.target 이 정확히 .voronoi 일 때만 토글됐다.
							실제로는 안쪽 img / flags 가 클릭되므로 대부분 먹지 않았다.
							closest 로 올려 잡고, 줌 후에는 컨테이너 크기가 바뀌므로
							다음 프레임에 MapFocus 로 다시 중앙 정렬한다.
						*/
						var $voronoi = $this.closest(".voronoi")
						if($voronoi.length){
							if($voronoi.hasClass("zoom")){
								$voronoi.removeClass("zoom")
							}else{
								$voronoi.addClass("zoom")
							}
							setTimeout(function(){
								if(window.MapFocus){
									window.MapFocus()
								}
							}, 0)
							return
						}

						if($this.hasClass("buy") || $this.hasClass("sell")){
							var $item =  $this.closest(".item")
							var type = $item.attr("type") ? $item.attr("type") : ""
							
							var total = 0

							if($this.hasClass("buy")){
								if(type == "buy"){
									type = ""
								}else{
									type = "buy"
								}								
							}

							if($this.hasClass("sell")){
								if(type == "sell"){
									type = ""
								}else{
									type = "sell"
								}
							}

							$body.attr("swap", type)
							$item.attr("type", type)

							var $assets = $('#pool li')

							if($assets.length){
								var after_body = ""

								$assets.each(function(index, el){
									var $el = $(el)
									
									var asset = {
										emoji : $el.attr("emoji"),
										count : $el.attr("cnt"),
										type : $el.attr("type")
									}

									asset.address = ethers.hashMessage(asset.emoji)
									asset.address = ethers.computeAddress(asset.address).toLowerCase()


									var amm = cookies[asset.address]

									if(amm){
										asset.balance = amm.x - amm.y

										if(asset.type == "sell"){
											total += asset.balance
										}else if(asset.type == "buy"){
											total -= asset.balance
										}
									}
								})
							}

							var _total = Math.sqrt(Math.pow(total, 2))

							$("#swap .submit input").val(cookies.balance + ( total >= 0 ? ` + ${_total}` : ` - ${_total}` ) + ` = ${cookies.balance + total}` )

							
							
							return
						}

						if(window.players){
							if(window.players.length){
								if(cookies.hash){
									var $pending = document.querySelector('player[self="true"] picture img[src*="1fae5.webp"]')

									if($pending){
										return
									}
									
									var player

									try{
										player = window.players.self()
									}catch(err){
										var axis = cookies.axis

										if(axis){
											axis = axis.split(",")

											player = {
												team : cookies.team ? cookies.team : "",
												follow : false,
												self : true,
												hash : cookies.address ? cookies.address : cookies.hash,
												emoji : "😀",
												x : axis[0] * 1,
												y : axis[1] * 1,
												z : axis[2] * 1
											}
										}
									}

									var $player = $('player[id="'+player.hash+'"][alt="player"]')

									var url = "https://memepoly.com";

									if(OAuth3.localhost){
										url = "http://localhost:3001"
									}

									if($this.hasClass("chat_message")){
										$aside.addClass("focus")
									}else{
										$aside.removeClass("focus")
									}

									if($this.hasClass("skip")){
										localStorage.tutorial = "complete"
										if(isNaN(localStorage.tutorial)){
											document.forms.Tutorial.index.value = ""
											$body.removeAttr("tutorial")
											$body.removeAttr("step")
											$(".layer, .layer form.popup").removeClass("on")

											if(window.location.href == window.response.body.query.href){
												window.Callback(window.response)
											}else{
												delete window.response
											}
											window.Poll.ing = setInterval(window.Poll, time.balance)
										}else{
											window.location.href = "/"
										}
									}

									if($this.closest("#header").length){
										var href = $this[0].href

										if(href){
											if(href.indexOf("/logout") > -1){
												e.preventDefault()
												
												clearInterval(window.Poll.ing)

												if(OAuth3.xhr){
													OAuth3.xhr.abort()
													delete OAuth3.xhr
												}

												OAuth3.xhr = OAuth3.fetch({
													method : "POST",
													query : {
														href : window.location.href,
														hash : cookies.hash,
														token : cookies.token
													},
													body : {},
													url : href
												}, function(){
													window.location.reload()
												})

												return
											}
										}
									}

									if($this.closest("emoji").length){
										var $emoji = $this.closest("emoji")

										var focus = $emoji.attr("selector");

										if(focus){
											$player = $('player[id="'+focus+'"]')

											var $tooltip = $player.find("tooltip");

											var $emojis = $("emojis")

											var _far = window.far;

											if($tooltip.hasClass("on")){
												$tooltip.removeClass("on")
												$body.removeAttr("tooltip")

											}else{
												$('tooltip').removeClass("on")
												$tooltip.addClass("on")
												$body.attr("tooltip", true)
											}
										}
									}

									if($this.hasClass("feedback")){
										var $form = document.forms.feedback
										$form.emoji.value = player.emoji
										$form.hash.value = cookies.hash
										$form.token.value = cookies.token

										$(".layer").addClass("on")
										$($form).addClass("on")
									}

									if($this.hasClass("back")){
										if($body.hasClass("select_emoji")){
											var $player = $('player[id="'+player.hash+'"][alt="player"]')

											$player.find("tooltip").addClass("on")
											$player.removeAttr("class")
											$body
												.removeAttr("class")
												.removeAttr("bingo")

											$("form.portal").val("")

											if(OAuth3.xhr){
												OAuth3.xhr.abort()
												delete OAuth3.xhr
											}

											emojiChanged(window.emojis.self)
										}else if(typeof $body.attr("swap") != "undefined"){
											$body.removeAttr("swap")
											$pool.html("")
											$("#swap .submit input").val("")
											$('.emoji_asset').removeClass("on")
											/*
												개발 Part 17 (상점)
												잔액 버튼으로 지정한 기본 매도 의도를 해제한다.
											*/
											delete window.SwapIntent
										}
										// 인벤토리
									}
									
									if($this.hasClass("message")){
										if($this.hasClass("close")){
											if($body.attr("bingo") == "notify"){
												$form.className = ""
												$body
													.removeAttr("class")
													.removeAttr("bingo")
											}

											$aside.removeClass("on")
											$("form.message").val("")

											var $talk = $("talks")

											$messages.removeClass("on")

											$talk.removeClass("on")
										}
									}

									if(e.target.name == "message"){
										$body.removeAttr("tooltip")
										$("tooltip").removeClass("on")
									}

									if($this.hasClass("hashType")){
										e.preventDefault()

										var isBomb = false

										try{
											var body = {
												emoji : window.emojis.self
											}

											var dice = cookies.dice * 1

											var query = {
												dice : dice != 0 ? dice : 0,
												href : window.location.href,
												hash : cookies.hash,
												token : cookies.token,
												x : player.x,
												y : player.y,
												z : player.z
											}
											var _biome = window.BiomeAt(player.x, player.z)
											if(_biome){
												query.biome = _biome
											}
											/* 개발 Part 18 (Edge 판정) : 주사위 / 폭탄 요청에 링 판정 동봉 */
											if(window.EdgeReady && window.EdgeReady()){
												query.edge = window.IsEdge(player.x, player.z) ? 1 : 0
											}

											if(OAuth3.nonces){
												if(OAuth3.nonces.length){
													body.nonces = []
													for(var i = 0; i < OAuth3.nonces.length; i++){
														var nonce = OAuth3.nonces[i]
														if(nonce){
															body.nonces.push(nonce)
														}
													}
													body.nonces = JSON.stringify(body.nonces)
												}
											}

											var b = window.map.biomes[player.x+":"+player.z]

											var $player = $('player[id="'+player.hash+'"][alt="player"]')

											var $$player = $this.closest("player")

											var player_hash = $$player.attr("id")

											var cc_address = ethers.hashMessage(window.location.href.replace(window.location.protocol+"//",""))
												cc_address = ethers.computeAddress(cc_address).toLowerCase()

											if(window.location.hash){
												cc_address = window.location.hash.replace("#", "0x")
											}

											if($this.hasClass("Deploy")){
												/*
													개발 Part 29 (게이트 출격)
													게이트(🚪) 칸 전용 출격 진입점.
													주사위(🎲)와 완전히 분리한다.
													여기서만 RolePick 이 뜬다.
												*/
												if(window.cookies.enter){
													return
												}
												if(window.EdgeReady && !window.EdgeReady()){
													window.Notice("MAP LOADING", "Board path is not ready", 1800)
													return
												}
												var _gateField = window.EdgeField
													? window.EdgeField(player.x, player.z) : null
												if(!_gateField || !_gateField.gate){
													window.Notice("NO GATE", "Deploy only from a gate tile", 2000)
													return
												}
												if(window.CanRaid && !window.CanRaid()){
													window.Notice("NO SLOTS", "Wait for the next match", 2200)
													return
												}
												if(window.RolePick){
													window.RolePick()
												}
												return
											}else if($this.hasClass("Meta")){
												var _dice = $body.attr("dice") * 1
												if(!isNaN(_dice)){
													if(_dice > 0){
														return
													}
												}
												/*
													개발 Part 18 (주사위 게이트 재작성)
													개발 Part 17 의 오수정을 되돌린다.
													Part 17 은 !cookies.enter 를 "아직 출격 안 함" 으로만 보고
													무조건 RolePick() 을 띄웠다.
													그런데 이 프로젝트의 확정 규칙(CanFreeMove 주석)은
													  enter 없음 = 보드게임 모드 = 링 위를 주사위로 전진
													이다. 즉 !enter 는 "주사위를 굴리는 정상 상태" 다.
													그래서 링 위에서 주사위를 굴리려는 순간마다
													UCAV 설명 팝업이 떠 버렸다.
													확정 판정 순서 (전부 프론트 window.fields 기준)
													  0) 링이 아직 확정되지 않음 -> 아무 것도 하지 않는다
													  1) 링 위(EDGE)
													       UCAV 로 출격 중 -> 주사위 불가 안내
													       게이트(🚪) + 미출격 -> 역할 선택(출격 진입점)
													       그 외 -> 주사위
													  2) 링 밖(내륙)
													       출격 중 -> 폭탄
													       미출격 -> 역할 선택
												*/
												if(window.EdgeReady && !window.EdgeReady()){
													window.Notice("MAP LOADING", "Board path is not ready", 1800)
													return
												}
												var _edgeField = window.EdgeField
													? window.EdgeField(player.x, player.z) : null
												var _isEdgeHere = _edgeField ? true : false
												if(_isEdgeHere && window.cookies.enter && window.cookies.role == "UCAV"){
													window.Notice("UCAV", "Drones fight in the field, not on the path", 2200)
													return
												}
												/*
													개발 Part 29 (게이트)
													현행 문제
													  게이트 칸에서는 !enter 인 동안 무조건 RolePick 을 띄우고
													  return 했다. 그래서 주사위가 영원히 굴러가지 않았다.
													  링 393칸 중 index % 9 == 0 이 게이트이므로
													  9칸에 한 번은 반드시 멈춘다.
													확정 규칙
													  게이트는 "출격할 수 있는 칸" 일 뿐
													  "출격해야 하는 칸" 이 아니다.
													  주사위 버튼은 언제나 주사위다.
													  출격은 a.hashType.Deploy 로만 한다.
													링 밖(내륙) + 미출격은 정상 상태가 아니므로
													복구 경로로 RolePick 을 유지한다.
												*/
												if(!_isEdgeHere && !window.cookies.enter){
													if(window.RolePick){
														window.RolePick()
														return
													}
													window.Notice("NOT ON PATH", "Return to the board path", 2200)
													return
												}
												window.cookies.dice = 0
												
												/*
													개발 Part 15 (규칙 R3 / R5)
													링 위   주사위 이동
													링 밖   폭탄 투척
													규칙 R5 에 따라 링에서는 폭탄을 놓지 않는다.
												*/
												body.cc = ""
												if(_isEdgeHere){
													query.dice = 10
													body.cc = "dice"
													/*
														개발 Part 18 (Edge 판정)
														프론트 판정을 서버가 그대로 채택하도록 실어 보낸다.
													*/
													query.edge = 1
												}else if(window.Biomes[`#${b.biome}`]){
													isBomb = true
													body.cc = "bomb"
													query.edge = 0
													if(plant){
														return
													}
												}
												if(!body.cc){
													return
												}
												$body.attr(body.cc,query.dice)
												$('#dice ul').playSpin();
											}else if($this.hasClass("Fire")){
												body.cc = "flag"
											}else if($this.hasClass("Flag")){
												return
											}else if($this.hasClass("Hp")){
												var _maxHp = window.MaxHp[cookies.role ? cookies.role : ""]
												var _hp = typeof cookies.hp != "undefined" ? cookies.hp * 1 : _maxHp

												if(_hp >= _maxHp){
													window.Notice("FULL HP", "No damage to heal", 1800)

													return
												}

												var _potion = $('emojis .items .emoji_asset[emoji="🧪"]')

												if(!_potion.length){
													window.Notice("NO POTION", "Craft 🧪 with 🐟 🐟 ❄", 2600)

													return
												}

												if(window.Consume){
													window.Consume("🧪")
												}

												return
											}else if($this.hasClass("Balance")){
												var $sellables = $('emojis .items .emoji_asset[type="item"]')
												if(!$sellables.length){
													window.Notice("NO ITEMS", "Nothing to sell", 2000)
													return
												}
												$('tooltip').removeClass("on")
												$body.removeAttr("tooltip")
												window.SwapIntent = "sell"
												$sellables.addClass("on")
												$body.attr("swap","")
												$swap.addClass("loading")
												$status.innerHTML = `<div class="loading">
													<strong>Loading...</strong>
												</div>`
												if(OAuth3.xhr){
													OAuth3.xhr.abort()
													delete OAuth3.xhr
												}
												return
											}else if($this.hasClass("Report")){
												var $form = document.forms.report
												$form.to.value = $$player.attr("id")
												$form.emoji.value = player.emoji
												$form.hash.value = cookies.hash
												$form.token.value = cookies.token

												$(".layer").addClass("on")
												$($form).addClass("on")

												return
											}else if($this.hasClass("Withdrawal")){
												if(cookies.email || window.tutorial){
													var $form = document.forms.Withdrawal
													$form.hash.value = cookies.hash
													$form.token.value = cookies.token

													$(".layer").addClass("on")
													$($form).addClass("on")
												}

												return
											}
										}catch(err){
											console.log("err",err);
										}

										var id = cookies.hash+"["+player.x+","+player.z+"]"
										var _assets = window.assets;
										var diff = false
										if(body.cc == "flag"){
											diff = true
											_assets.push({
												id : id,
												hash : player.hash,
												name : "fire",
												value : "",
												color: "orange",
												x : player.x,
												y : -0.08,
												z : player.z
											})
										}

										emojiChanged("🫥", true, isBomb)

										if(diff){
											window.assets.set(_assets)
										}

										if(time.out){
											clearTimeout(time.out)
											delete time.out
										}

										if(OAuth3.xhr){
											OAuth3.xhr.abort()
											delete OAuth3.xhr
										}

										OAuth3.xhr = {
											abort : function(){}
										}

										time.out = setTimeout(function(){
											if(window.tutorial){
												setTimeout(function(){
													var res = JSON.stringify(window.response)
														res = JSON.parse(res)

													res.body.query = query
													res.body.body = body
													
													window.Callback(res)
												},1500)
											}else{
												OAuth3.xhr = OAuth3.fetch({
													method : "POST",
													query : query,
													body : body,
													url : url
												}, window.Callback)
											}
										}, time.balance * (body.cc == "dice" ? 2 : 1))
										
									}

									if($this.hasClass("emoji_asset")){
										e.preventDefault()

										var type = $this.attr("type")
										var emoji = $this.attr("emoji")
										var method = $this.attr("method")

										var player_emoji = player.emoji + ""

										var body = {
											emoji : window.typeof_emoji(emoji) ? emoji : window.emojis.self
										}

										var $talk = $("talks")

										if(method == "search"){
											console.log("검색 진입");

											return
										}

										if(type == "player"){
											var hash = $this.attr("hash")

											if(player.hash != hash){
												var $target = $('player#'+hash+" emoji")

												if($target.length){
													var camera = JSON.stringify({
														hash : hash
													})

													$target.click()
													window.camera.set(JSON.parse(camera))
												}
											}else{
												var $target = $('player#'+player.hash+" emoji")

												if($target.length){
													$target.click()
													window.camera.set({})
												}
											}

											return
										}

										

										if(type == "item"){
											if($this.find(".emoji.color").attr("color") == ""){
												return
											}
											/*
												개발 Part 17 (식량)
												필드에서 나무 / 돌 / 얼음을 폭파해 파밍한 결과물 중
												음식 계열은 클릭 즉시 섭취해 체력을 회복한다.
												상점(스왑) 선택 토글보다 먼저 판정해야 한다.
												그렇지 않으면 먹으려던 클릭이 매도 선택으로 먹힌다.
											*/
											if(window.typeof_food && window.typeof_food(emoji)){
												var _maxHpFood = window.MaxHp[cookies.role ? cookies.role : ""]
												var _hpFood = typeof cookies.hp != "undefined" ? cookies.hp * 1 : _maxHpFood
												if(_hpFood >= _maxHpFood){
													window.Notice("FULL HP", "No damage to heal", 1800)
													return
												}
												$('tooltip').removeClass("on")
												$body.removeAttr("tooltip")
												if(window.Consume){
													window.Consume(emoji)
												}
												return
											}
											$('tooltip').removeClass("on")
											$body.removeAttr("tooltip")
											$this.toggleClass("on")
											
											var $assets = $('.emoji_asset.on')
											if($assets.length){
												$body.attr("swap","")
												$swap.addClass("loading")
												$status.innerHTML = `<div class="loading">
													<strong>Loading...</strong>
												</div>`
											}else{
												$body.removeAttr("swap")
												$pool.html("")
												$("#swap .submit input").val("")
												$status.innerHTML = ""
												delete window.SwapIntent
											}
											if(OAuth3.xhr){
												OAuth3.xhr.abort()
												delete OAuth3.xhr
											}
											
											return
										}else{
											$body.removeAttr("swap")
										}

										if(type == "emoji"){
											if(method){
												if(type == "emoji"){
													emoji = player_emoji
												}

												if(method == "notify"){
													$status.innerHTML = `<div class="loading">
														<strong>Loading...</strong>
													</div>`


													if(document.querySelector("notify")){
														document.querySelector("notify").remove()
													}

													$('notify input[type="checkbox"]').prop("checked",false)

													try{
														var host = window.location.host

														if(OAuth3.localhost){
															host = OAuth3.localhost
														}

														var url = "https://memepoly.com/";

														if(OAuth3.localhost){
															url = "http://localhost:3001/"
														}

														var href = window.location.href

														var referer = new URL(href)

														var respawn = Respawn()

														var request = {
															method : "POST",
															url : url,
															body : {
																cc : "vapid"
															},
															query : {
																host : referer.host,
																href : href,
																hash : cookies.hash,
																token : cookies.token,
																x : player.x ? player.x : respawn.x,
																y : player.y ? player.y : respawn.y,
																z : player.z ? player.z : respawn.z
															}
														}

														var response = function(res){
															var cookies = JSON.parse(res.body.cookies);

															if(cookies.email){
																$status.innerHTML = ''
															}else{
																$status.innerHTML = '<a href="/login/">Sign In</a>'
															}

															if(OAuth3.xhr){
																OAuth3.xhr.abort()
																delete OAuth3.xhr
															}

															var _href = "https://memepoly.com/"+cookies.vapid

															if(!cookies.vapid){
																$('.emoji_asset[method="notify"]').removeClass("on")
															}

															if(OAuth3.isMobile){
																if(cookies.vapid){
																	window.open(_href+"?referer="+encodeURIComponent(href),'_top','noreferrer')
																}
															}else if(cookies.vapid){
																if(!document.querySelector("notify")){
																	$body.append('<notify><input type="checkbox" id="notify"><div class="tb"><div class="tc"></div></div></notify>')
																}

																/*
																	개발 Part 10
																	현행은 템플릿 리터럴 안에 '+cookies.vapid+' 를 그대로 써서
																	문자열 "'+cookies.vapid+'" 가 value 에 들어갔다.
																	페어링 토큰이 전달되지 않아 구독이 항상 실패했다.
																*/
																document.querySelector("notify .tc").innerHTML = `<form name="memepoly.com" action="javascript:Subscribe()">
																	<qr>
																		<a class="qr-code"></a>
																		<label for="notify">
																			<span class="ko">알림 동의</span>
																			<span class="en">notification agree</span>
																		</label>
																	</qr>
																	<input name="vapid" type="hidden" value="${cookies.vapid}">
																	<div class="area">
																		<input disabled type="submit">
																	</div>
																</form>`

																var $qrcode = document.querySelector(".qr-code")

																new QRCode($qrcode, {
																	text: _href,
																	width: 300,
																	height: 300,
																	colorDark : "#000000",
																	colorLight : "#ffffff",
																	correctLevel : QRCode.CorrectLevel.H
																})
															}
														}

														if(OAuth3.xhr){
															OAuth3.xhr.abort()
															delete OAuth3.xhr
														}

														OAuth3.xhr = OAuth3.fetch(request, response);
													}catch(err){
														console.log("Err",err);
													}

													return

												}else if(method == "chat"){
													$aside.addClass("on")
													if(!$messages.hasClass("on")){
														$messages.addClass("on")
														$talk.addClass("on")
													}
													$('form.message input[name="message"]').focus()
													return
												}else if(method == "property"){
													if(window.PropertyPanel){
														window.PropertyPanel()
													}
													return
												}else if(method == "craft"){
													if(window.CraftPanel){
														window.CraftPanel()
													}
													return
												}else if(method != "open"){										
													return
												}
											}
										}

										if($messages.hasClass("on")){
											$messages.removeClass("on")

											$talk.removeClass("on")
										}

										if(emoji == "💣"){
											if(plant){
												return
											}
											/*
												개발 Part 15 (규칙 R5)
												링(edge) 칸에서는 폭탄을 놓을 수 없다.
												서버가 bombBlocked="edge" 로 거절하므로
												요청 자체를 보내지 않는다.
											*/
											if(window.IsEdge(player.x, player.z)){
												window.Notice("NO BOMBS", "Bombs do not work on the path", 2200)
												return
											}
											if(!cookies.enter){
												window.Notice("NOT IN RAID", "Deploy first to use bombs", 2200)
												return
											}
											emojiChanged("🫥", true, true)
											
											var query = {
												href : window.location.href,
												hash : cookies.hash,
												token : cookies.token,
												x : player.x,
												y : player.y,
												z : player.z
											}

											body.cc = "bomb"
											body.emoji = player_emoji

											if(time.out){
												clearTimeout(time.out)
												delete time.out
											}

											if(OAuth3.xhr){
												OAuth3.xhr.abort()
												delete OAuth3.xhr
											}

											OAuth3.xhr = true

											time.out = setTimeout(function(){
												OAuth3.xhr = OAuth3.fetch({
													method : "POST",
													query : query,
													body : body,
													url : url
												}, window.Callback);
											}, time.balance)

											return

										}else{
											if(type == "emoji"){
												if(OAuth3.xhr){
													OAuth3.xhr.abort()
													delete OAuth3.xhr
												}

												window.emojis.self = emoji
												
												emojiChanged(emoji)
											}
										}
									}

									if($this.closest(".layer").length){
										if($this.hasClass("close")){
											$(".layer, .layer form.popup").removeClass("on")
										}
									}
								}
							}
						}
					}catch(err){
						console.log("Err",err);
					}
				}
			})

			if(!OAuth3.isMobile){
				var $scrollContainer = $("emojis .scroll")

				$scrollContainer.on({
					wheel : function(e){
						if(!$aside.hasClass("more")){
							e.preventDefault();
							this.scrollLeft += e.originalEvent.deltaY;
						}
					}
				})
			}

			var joystick = {
				start : {
					x : 0,
					y : 0
				},
				end : {
					x : 0,
					y : 0
				},
				set : function(e){
					if(window.Mode() != "board"){
						return
					}

					var cookies = window.cookies

					var $el = $(e.target)

					var isJoystick = ($el.closest("emojis").length) == 0

					if(e.target.tagName == "SELECT"){
						isJoystick = false
					}


					if(isJoystick && cookies.axis && cookies.dice == 0 && !cookies.damage && window.CanFreeMove()){
						var position = {
							x : 0,
							z : 0
						}

						var limit = 10

						if(joystick.start.y-joystick.end.y>limit){
							position.z += 1
						}else if(joystick.end.y-joystick.start.y>limit){
							position.z -= 1
						}else if(joystick.start.y-joystick.end.y<limit || joystick.end.y-joystick.start.y<limit ){
							position.z = 0
						}

						if(joystick.start.x-joystick.end.x>limit){
							position.x += 1
						}else if(joystick.end.x-joystick.start.x>limit){
							position.x -= 1
						}else if(joystick.start.x-joystick.end.x<limit || joystick.end.x-joystick.start.x<limit ){
							position.x = 0
						}

						if(position.x == 0 && position.z == 0){
						}else{
							if(position.x > 0 && position.z < 0){
								position.x--
							}else if(position.x < 0 && position.z > 0){
								position.x++
							}else if(position.x < 0 && position.z < 0){
								position.x = -1
								position.z = 0
							}else if(position.x > 0 && position.z > 0){
								position.x = 1
								position.z = 0
							}else if(position.x == 0 && position.z > 0){
								position.x = 1
								position.z = 1
							}else if(position.x > 0 && position.z == 0){
								position.x = 1
								position.z = -1
							}else if(position.x < 0 && position.z == 0){
								position.x = -1
								position.z = 1
							}else if(position.x == 0 && position.z < 0){
								position.x = -1
								position.z = -1
							}

							window.setFrameloop("always")
							var players = window.players
							var player = window.players.self()
								player.x = window.current.current.position.x + position.x
								player.z = window.current.current.position.z + position.z
							var b = window.map.biomes[player.x+":"+player.z]
							if(!b){
								return
							}
							if(b.water){
								return
							}
							/*
								개발 Part 17 (규칙 R6)
								UCAV 는 링(edge) 위로 올라올 수 없다.
								조이스틱은 클릭 경로와 별개이므로 여기서도 막는다.
							*/
							if(window.CanMoveTo && !window.CanMoveTo(player.x, player.z)){
								window.Notice("FIELD ONLY", "UCAV cannot enter the board path", 2200)
								return
							}

							var edge = (1000000000000000000 / 2) + 1
							
							if(player.x < edge && player.x > -edge && player.z < edge && player.z > -edge){
								if(window.camera){
									if(window.camera.hash){
										if(window.camera.hash != player.hash){
											window.camera.set({})
										}
									}
								}

								window[player.hash].position.y = window.current.current.position.y = window.cursor.current.position.y = b.y + 0.01

								window[player.hash].position.x = window.current.current.position.x = window.cursor.current.position.x = player.x								
								window[player.hash].position.z = window.current.current.position.z = window.cursor.current.position.z = player.z
							}

							window.Callback(window.response)
						}
					}
				}
			}
			
			$body.on('mousedown',function(event){
				joystick.start.x = event.pageX;
				joystick.start.y = event.pageY;
			});

			$body.on('mouseup',function(event){
				joystick.end.x = event.pageX;
				joystick.end.y = event.pageY;

				try{
					joystick.set(event)
				}catch(err){

				}
			});

			$body.on('touchstart',function(event){
				joystick.start.x = event.originalEvent.changedTouches[0].screenX;
				joystick.start.y = event.originalEvent.changedTouches[0].screenY;
			});

			$body.on('touchend',function(event){
				joystick.end.x = event.originalEvent.changedTouches[0].screenX;
				joystick.end.y = event.originalEvent.changedTouches[0].screenY;

				try{
					joystick.set(event)
				}catch(err){

				}
			});

			var onscroll = function(){
				if(window.Mode() != "board"){
					return
				}

				var t = document.scrollingElement.scrollTop

				if(t){
					$body.attr("scrolling",true)
				}else{
					$body.removeAttr("scrolling")

					var $date = document.querySelector('messages li input[name="date"]')

					if($date){
						window.Poll.date = $date.value

						var $loading = $('messages ul li.loading, messages ul li[id=""], talks ul li[id=""]')
					
						if($loading.length){
							$loading.remove()
						}

						$('messages ul').prepend(`<li class="loading">
							<div class="lds-ring">
								<div></div>
								<div></div>
								<div></div>
								<div></div>
							</div>
						</li>`)

						if(OAuth3.xhr){
							OAuth3.xhr.abort()
							delete OAuth3.xhr
						}
					}
				}
			}

			window.addEventListener("scroll", onscroll)

			var $chat = $(document.forms.chat)

			window.BoardChat = function(flow, date){
				var player = window.players.self()
				var len = players.length

				var $form = document.forms.chat

				var message = $form.message.value

				$body.removeAttr("tooltip")

				$("tooltip").removeClass("on")

				var talks = ""

				var query = {
					href : window.location.href,
					hash : cookies.hash,
					token : cookies.token,
					x : player.x,
					y : player.y,
					z : player.z
				}

				var body = {
					cc : "message",
					subject : message,
					emoji : player.emoji
				}

				if(OAuth3.nonces){
					if(OAuth3.nonces.length){
						body.nonces = []

						for(var i = 0; i < OAuth3.nonces.length; i++){
							var nonce = OAuth3.nonces[i]

							if(nonce){
								body.nonces.push(nonce)
							}
						}

						body.nonces = JSON.stringify(body.nonces)
					}
				}
				

				var flows = []

				if(flow){
					message = body.subject = date ? date : flow.Subject
				}

				var text = ""

				try{
					var _url = new URL(message)

					var oembed = window.oembed(_url)

					if(!oembed.provider){
						text = `<a target="_blank" href="${_url.href}">\
							<img src="${_url.protocol}//${_url.host}/favicon.ico"> Link\
						</a>`
					}
				}catch(err){
					text = `<span>${message}</span>`
				}

				if(text && !flow){
					$('messages ul').append(`<li id="" class="self item message">
						<div class="text">
							<span class="icon" data-from="${player.hash}"></span>
							<text>${text}</text>\
						</div>\
					</li>`)

					var $talk = $("talks."+player.hash)

					$talk.find('ul').append(`<li id="" class="item">\
						<div class="text">\
							<span class="icon" data-from="${player.hash}"></span>\
							<text>${text}</text>\
						</div>\
					</li>`)
					/*
						개발 Part 14 (검수) - E14
						개발 Part 26 에서 BoardCallback 쪽만 치환했고
						BoardChat 에 같은 패턴 2 곳이 남아 있었다.
						try/catch 로 감싸져 있어 예외는 삼켜지지만
						아이콘이 조용히 빠졌다. BlockieUrl 로 통일한다.
					*/
					var $icons = $("messages li .icon")
					if($icons.length){
						$icons.each(function(i, el){
							var _url = window.BlockieUrl(el.dataset.from)
							if(_url){
								$icons.eq(i).css("background-image", "url("+_url+")")
							}
						})
					}
					var $icons = $("talks li .icon")
					if($icons.length){
						$icons.each(function(i, el){
							var _url = window.BlockieUrl(el.dataset.from)
							if(_url){
								$icons.eq(i).css("background-image", "url("+_url+")")
							}
						})
					}
					$("messages").addClass("on")
					$("talks."+player.hash).addClass("on")

					var h = document.documentElement.scrollHeight

					$root.scrollTop(h)

					OAuth3.timeout = true
				}

				if(message.length){
					$status.innerHTML = `<div class="loading">
						<strong>Loading...</strong>
					</div>`

					if(body.emoji){
						window.emojis.message = body.emoji
						window.emojis.self = body.emoji
					}

					var url = "https://memepoly.com";

					if(OAuth3.localhost){
						url = "http://localhost:3001"
					}

					if(OAuth3.xhr){
						OAuth3.xhr.abort()
						delete OAuth3.xhr
					}

					OAuth3.xhr = OAuth3.fetch({
						method : "POST",
						query : query,
						body : body,
						url : url
					}, window.Callback);
				}

				$form.message.value = "";
			}

			window.emojis.unshift({
				method : "chat",
				icon : "chat",
				type : "emoji"
			})
			window.emojis.unshift({
				method : "craft",
				icon : "construction",
				type : "emoji"
			})
			window.emojis.unshift({
				method : "property",
				icon : "home",
				type : "emoji"
			})
			window.emojis.unshift({
				method : "notify",
				icon : "notifications",
				type : "emoji"
			})

			

			var li = ""
			var emojis = []
			var assets = []
			var player_hash = cookies.hash
			/*
				개발 Part 17 (덱)
				mic / videocam(getUserMedia), cast(getDisplayMedia), recommand 는
				마이룸 전용 기능이다.
				현행 문제
				  src/room.js 는 모듈 로드 시점(모드와 무관)에 checkDeviceSupport() 를 돌려
				  window.emojis 로 mic / videocam 을 unshift 한다.
				  window.emojis 는 보드/룸 공용 배열이므로
				  보드 덱에도 그대로 흘러들어와 빈 버튼 3개가 노출됐다.
				  recommand 는 skip 처리라 <a> 없이 빈 div 만 남아 더 눈에 띄었다.
				조치
				  보드 덱 렌더 루프에서 이 method 들을 건너뛴다.
				  window.emojis 자체는 건드리지 않으므로 마이룸 덱은 그대로다.
			*/
			var roomOnly = ["getUserMedia", "getDisplayMedia", "recommand"]
			for(var i = 0; i < window.emojis.length; i++){
				var item = window.emojis[i]
				var type = item.type
				var method = item.method ? item.method : ""
				var icon = item.icon
				var className = "emoji color"
				if(roomOnly.indexOf(method) > -1){
					continue
				}
				if(type == "emoji" && icon == "💣"){
					li += '<div draggable="false" class="emoji_asset items"></div>'
				}

				if(type == "emoji"){
					emojis.push(item)

					var skip = false

					if(method){
						className = ""

						if(method == "getDisplayMedia"){
							icon = "cast"
						}else if(method == "getUserMedia"){
							icon = item.icon
						}else if(method == "chat"){
							icon = "sms"
						}else if(method == "recommand"){
							skip = true
						}
					}

					var $a = ""

					if(!skip){
						$a = `<a class="${className}">${icon}</a>`
					}

					li += `<div draggable="false" class="emoji_asset" emoji="${icon}" type="${type}" method="${method}">${$a}</div>`
				}
			}

			$("emojis .emojis").html(li)
			$('.emoji[type="emoji"] cnt').text(emojis.length)

			var $emojis_filter = $(".emojis_filter .emoji")
				$emojis_filter.on({
					click : function(e){
						var $this = $(this)
						var filter = $this.attr("type")

						$aside.attr("sort",filter)

						if($this.hasClass("on")){
							if($this.hasClass("more")){
								$aside.removeClass("more")
								$this.removeClass("more")
							}else{
								$aside.addClass("more")
								$this.addClass("more")
							}
						}else{
							$aside.removeClass("more")
							$emojis_filter.removeClass("on")
							$emojis_filter.removeClass("more")
							$this.addClass("on")
						}
					}
				})

			var $emojis = document.querySelector("emojis .scroll")
			var x = 0, y = 0, top = 0, left = 0

			var isTouch = false

			var draggingFunction = function(e){
				if(isTouch){
					$emojis.scrollLeft = left - e.pageX + x
					$emojis.scrollTop = top - e.pageY + y
				}
			};

			$emojis.addEventListener('mousedown', function(e){
				e.preventDefault()
				isTouch = true
				y = e.pageY
				x = e.pageX
				top = $emojis.scrollTop
				left = $emojis.scrollLeft
				document.addEventListener('mousemove', draggingFunction)
			})
			window.addEventListener('mouseup', function() {
				isTouch = false
			})

			window.BoardHashChange = function(e){
				var cookies = window.cookies
				document.scrollingElement.scrollTop = 0
				window.MapReset()
				if(window.MapGen){
					window.MapGen.ready = false
					/*
						개발 Part 16 (미니맵)
						보드가 바뀌면 이전 매치의 base64 는 무효다.
						캐시를 비워야 apply(true) 이후 sync() 가 새 맵을 그린다.
					*/
					window.MapGen.tiles = null
					window.MapGen.dataURL = ""
					window.MapGen.paintedKey = ""
					window.MapGen.colorKey = -1
					window.MapGen.apply(true)
					if(window.MapGen.sync){
						window.MapGen.sync()
					}
				}
				try{
					delete window.current.axis
				}catch(err){
				}

				delete window.dialog

				$body
					.removeAttr("class")
					.removeAttr("bingo")
					.removeAttr("chat")
					.addClass("loading")

				$('form[name="oauth.network"]').removeClass("on")

				$nav.prop("checked",false)
				$('messages ul, #rank ol, #capture>.rank_toggle, talks ul').html("")
				var address = window.location.hash.replace("#","0x")
				if(address.length > 2){
					$("#intro .title .emoji").html("")
					/*
						개발 Part 14 (검수) - E13
						BoardHashChange 의 같은 패턴. Blockie 로 통일한다.
					*/
					var _hashIcon = window.Blockie(address)
					if(_hashIcon){
						$("#intro .title .emoji").append(_hashIcon)
					}
					$("#intro .coptyright p").html(`<span class="address">
						<address>
							<span>${address}</span>
							<span dir="rtl">${address}</span>
						</address>
					</span>`)
				}

				if(OAuth3.xhr){
					OAuth3.xhr.abort()
					delete OAuth3.xhr
				}

				clearInterval(window.Roll.ing)
				delete window.Roll.ing

				clearInterval(window.Poll.ing)
				delete window.Poll.ing

				$status.innerHTML = `<div class="loading">
					<strong>Loading...</strong>
				</div>`

				setTimeout(function(){
					window.speed = 0.1

					window.camera.set({})
					window.assets.set([])

					window.setFrameloop("always")

					window.Poll.ing = setInterval(window.Poll, time.balance)

					delete window.response
				}, 1000)
			}
		}
		OAuth3.fetch(request, response);
	}
})