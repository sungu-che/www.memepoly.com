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
window.EmojiDeck = function(method, icon, type){
	if(!window.emojis || !window.emojis.length){
		return false
	}
	var _m = method ? String(method) : ""
	var _i = icon ? String(icon) : ""
	if(!_m && !_i){
		return false
	}
	for(var i = 0; i < window.emojis.length; i++){
		var e = window.emojis[i]
		if(!e){
			continue
		}
		var em = e.method ? String(e.method) : ""
		var ei = e.icon ? String(e.icon) : ""
		if(em === _m && ei === _i){
			return false
		}
	}
	window.emojis.unshift({
		method : _m,
		icon : _i,
		type : type ? type : "emoji"
	})
	return true
}
window.ItemsDeck = function(){
	return $("emojis .items").not(".emoji_asset")
}
window.ItemStock = function(rows, selfHash){
	var out = {
		order : [],
		map : {},
		total : 0
	}
	if(!rows || !rows.length){
		return out
	}
	for(var i = 0; i < rows.length; i++){
		var row = rows[i]
		if(!row){
			continue
		}
		var kind = row.__kind ? row.__kind : ""
		var state = row.__state ? row.__state : ""
		var isHeld = false
		if(kind === "inventory"){
			isHeld = (state === "held") || (!state && row.Subject === "#asset")
		}else if(row.Subject === "#asset" && !row.Flag){
			isHeld = true
		}
		if(!isHeld){
			continue
		}
		if(selfHash && row.To !== selfHash){
			continue
		}
		var emoji = row.emoji ? row.emoji : row.Emoji
		if(!emoji){
			try{
				emoji = row.Cc.split("@")[1]
			}catch(err){
				emoji = ""
			}
		}
		if(!emoji){
			continue
		}
		if(!out.map[emoji]){
			out.map[emoji] = {
				emoji : emoji,
				count : 0,
				id : "",
				rows : []
			}
			out.order.push(emoji)
		}
		out.map[emoji].count++
		out.map[emoji].rows.push(row)
		if(row.Id){
			out.map[emoji].id = row.Id
		}
		out.total++
	}
	return out
}
window.ItemDeckBody = function(stock, seen){
	var body = ""
	var fresh = []
	if(!stock || !stock.order.length){
		return { body : body, fresh : fresh }
	}
	for(var i = 0; i < stock.order.length; i++){
		var emoji = stock.order[i]
		var item = stock.map[emoji]
		if(!item || !item.count){
			continue
		}
		var id = item.id
		if(!id){
			continue
		}
		var isNew = false
		if(seen && !seen[id]){
			seen[id] = true
			var _known = false
			try{
				_known = $('.emoji_asset[type="item"][emoji="' + emoji + '"]').length > 0
			}catch(err){
				_known = false
			}
			if(!_known){
				isNew = true
				fresh.push({ Id : id, emoji : emoji })
			}
		}
		var isToggle = false
		try{
			isToggle = $('.emoji_asset[type="item"][emoji="' + emoji + '"].on').length > 0
		}catch(err){
			isToggle = false
		}
		body += `<div id="${id}" draggable="false" class="emoji_asset ${(isToggle ? "on" : "")} ${(isNew ? "new" : "")}" emoji="${emoji}" cnt="${item.count}" type="item"><a color="color" class="emoji color">${emoji}</a><span class="cnt">${item.count}</span></div>`
	}
	return { body : body, fresh : fresh }
}
window.ItemStockSync = function(stock){
	if(!stock){
		return 0
	}
	var dropped = 0
	try{
		$('.emoji_asset[type="item"].on').each(function(){
			var $el = $(this)
			var emoji = $el.attr("emoji")
			if(!emoji){
				return
			}
			if(!stock.map[emoji] || !stock.map[emoji].count){
				$el.removeClass("on")
				dropped++
			}
		})
	}catch(err){
	}
	return dropped
}
window.ItemStockLast = null
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
	if(cookies.damage || cookies.dead){
		return false
	}
	var _dice = cookies.dice * 1
	if(!isNaN(_dice) && _dice > 0){
		return false
	}
	if(cookies.onJail){
		return true
	}
	var _role = cookies.role ? cookies.role : ""
	if(_role == "UCAV"){
		return cookies.enter ? true : false
	}
	if(!cookies.enter){
		if(cookies.jail){
			if(!window.EdgeReady || !window.EdgeReady()){
				return false
			}
			try{
				var _me = window.players.self()
				if(!window.IsEdge(_me.x, _me.z)){
					return true
				}
				var _anc = window.RingAnchor ? window.RingAnchor() : null
				if(!_anc){
					return false
				}
				var _mgx = window.Grid(_me.x)
				var _mgz = window.Grid(_me.z)
				return !(_anc.x === _mgx && _anc.z === _mgz)
			}catch(err){
				return false
			}
		}
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
		var _gx = window.Grid ? window.Grid(_x) : (_x * 1)
		var _gz = window.Grid ? window.Grid(_z) : (_z * 1)
		if(isNaN(_gx) || isNaN(_gz)){
			return null
		}
		var f = window.fields[_gx + ":" + _gz]
		return f ? f : null
	}catch(err){
		return null
	}
}
window.IsEdge = function(_x, _z){
	return window.EdgeField(_x, _z) ? true : false
}
window.EdgeSelf = function(){
	try{
		var p = window.players.self()
		return window.EdgeField(p.x, p.z)
	}catch(err){
		return null
	}
}
window.TrailMap = function(){
	var out = {}
	var cookies = window.cookies
	if(!cookies){
		return out
	}
	try{
		var s = window.State
		if(s && s.trail && s.trail.length &&
			String(s.trailMatch) === String(cookies.match)){
			for(var i = 0; i < s.trail.length; i++){
				if(s.trail[i]){
					out[s.trail[i]] = true
				}
			}
		}
	}catch(err){
	}
	try{
		if(window.Roll.trail && String(window.Roll.trailMatch) === String(cookies.match)){
			for(var k in window.Roll.trail){
				if(window.Roll.trail.hasOwnProperty(k)){
					out[k] = true
				}
			}
		}
	}catch(err){
	}
	return out
}
window.TrailFill = function(){
	return 0
}
window.CanDiceNow = function(){
	var cookies = window.cookies
	if(!cookies){
		return false
	}
	if(cookies.matchFull){
		return false
	}
	if(cookies.damage || cookies.dead){
		return false
	}
	var _d = cookies.dice * 1
	if(!isNaN(_d) && _d > 0){
		return false
	}
	if(cookies.role == "UCAV" && cookies.enter){
		return false
	}
	if(!window.EdgeReady || !window.EdgeReady()){
		return false
	}
	if(!(window.EdgeSelf && window.EdgeSelf())){
		return false
	}
	var _anc = window.RingAnchor ? window.RingAnchor() : null
	if(!_anc){
		return true
	}
	try{
		var _p = window.players.self()
		return (_anc.x === window.Grid(_p.x) && _anc.z === window.Grid(_p.z))
	}catch(err){
		return false
	}
}
window.DiceHome = function(){
	var cookies = window.cookies
	if(!cookies || cookies.enter){
		return null
	}
	if(cookies.damage || cookies.dead){
		return null
	}
	try{
		var _d = cookies.dice * 1
		if(!isNaN(_d) && _d > 0){
			return null
		}
	}catch(err){
	}
	/*
		개발 Part 67 (커밋 대기 가드)
		굴림이 끝난 직후에는 서버 커밋이 아직 도착하지 않았다.
		  화면 좌표  새 도착 칸 (window.Roll 이 이미 옮겼다)
		  앵커       옛 출발 칸 (커밋에서만 갱신된다)
		이 한 왕복 동안 앵커가 다르다는 이유로 📍 를 띄우면
		"굴려서 앞으로 갔는데 돌아가라" 는 신호가 되어 흐름이 끊긴다.
		미정산 nonce 가 남아 있는 동안은 판정을 유보한다.
		커밋 응답이 오면 OAuth3.nonces 가 비워지므로 자동으로 풀린다.
		응답이 유실돼도 다음 폴링이 replay 로 정리해 한 왕복 뒤 풀린다.
	*/
	try{
		if(typeof OAuth3 != "undefined" && OAuth3.nonces && OAuth3.nonces.length){
			return null
		}
	}catch(err){
	}
	var _anc = window.RingAnchor ? window.RingAnchor() : null
	if(!_anc){
		return null
	}
	try{
		var _p = window.players.self()
		var _gx = window.Grid(_p.x)
		var _gz = window.Grid(_p.z)
		if(_anc.x === _gx && _anc.z === _gz){
			return null
		}
	}catch(err){
		return null
	}
	return _anc
}
window.RingSync = function(){
    var cookies = window.cookies
    if(!cookies){
        return false
    }
    try{
        if(window.Mode && window.Mode() != "board"){
            return false
        }
    }catch(err){
        return false
    }
    if(cookies.enter){
        return false
    }
	if(cookies.damage || cookies.dead){
		return false
	}
	if(window.RollBusy && window.RollBusy()){
		return false
	}
	try{
		if(typeof OAuth3 != "undefined" && OAuth3.nonces && OAuth3.nonces.length){
			return false
		}
	}catch(err){
	}
	var _anc = window.RingAnchor ? window.RingAnchor() : null
	if(!_anc){
		return false
	}
	var _me = null
	try{
		_me = window.players.self()
	}catch(err){
		return false
	}
	if(!_me){
		return false
	}
	var _mx = window.Grid(_me.x)
	var _mz = window.Grid(_me.z)
	if(isNaN(_mx) || isNaN(_mz)){
		return false
	}
	if(_anc.x === _mx && _anc.z === _mz){
		return false
	}
	if(cookies.jail || cookies.onJail){
		if(!window.EdgeReady || !window.EdgeReady()){
			return false
		}
		if(!window.IsEdge(_mx, _mz)){
			return false
		}
	}
	if(!window.RingReturn){
		return false
	}
	var _ok = window.RingReturn(_anc)
	if(_ok){
		console.log("[dice] resynced to server anchor :: " +
			_mx + "," + _mz + " -> " + _anc.x + "," + _anc.z)
	}
	return _ok
}
window.ReservedTile = function(_x, _z){
	try{
		var c = window.cookies
		if(c && c.tile){
			var t = c.tile
			if((t.x * 1) === (_x * 1) && (t.z * 1) === (_z * 1)){
				if(typeof t.reserved !== "undefined"){
					return t.reserved ? t.reserved : ""
				}
			}
		}
	}catch(err){
	}
	var f = window.EdgeField ? window.EdgeField(_x, _z) : null
	if(!f){
		return ""
	}
	if(f.jail){
		return "jail"
	}
	if(f.gate || f.drop){
		return "gate"
	}
	if(f.item){
		return "item"
	}
	return ""
}
window.ReservedNotice = function(kind){
	if(kind === "jail"){
		return { head : "SAFE ZONE", body : "You cannot build on a safe zone tile" }
	}
	if(kind === "gate"){
		return { head : "GATE", body : "Deploy gates stay open. No building here" }
	}
	if(kind === "item"){
		return { head : "SUPPLY TILE", body : "This tile drops items. No building here" }
	}
	return { head : "RESERVED", body : "You cannot build here" }
}
/*
	개발 Part 65 (UCAV 탈출 구역)
	현행 문제
	  탈출구는 링(주사위 경로)의 게이트뿐이다.
	  그런데 UCAV 는 CanMoveTo 가 링 진입을 막으므로
	  게이트를 밟을 방법이 없다. 즉 UCAV 는 탈출이 불가능하고
	  시간이 지나면 MIA 로 소지품을 잃는 것 외에 선택지가 없었다.
	조치
	  해안 링 "안쪽" 내륙 육지 칸 중 일부를 탈출 구역으로 정한다.
	  UCAV 는 그 칸에서 나간다.
	결정 방식
	  후보 목록을 만들어 k개를 뽑으면 서버와 클라이언트의
	  객체 순회 순서가 달라 결과가 갈릴 수 있다.
	  그래서 목록을 만들지 않고 좌표마다 순수 해시로 판정한다.
	    hash(match.hash + ":" + x + ":" + z) % MOD === 0
	  같은 판, 같은 좌표면 서버와 프론트가 반드시 같은 답을 낸다.
	  캐시도 필요 없고 좌표당 O(1) 이다.
	서버 memepoly.com/index.js 의 isExitZone 과 반드시 같은 식이어야 한다.
	MOD 를 바꾸면 양쪽을 함께 바꿔야 한다.
*/
window.EXIT_ZONE_MOD = 250
window.ExitZoneHash = function(hash, x, z){
	var s = String(hash ? hash : "") + ":" + (x * 1) + ":" + (z * 1)
	var h = 5381
	for(var i = 0; i < s.length; i++){
		h = (Math.imul(h, 33) ^ s.charCodeAt(i)) | 0
	}
	return h >>> 0
}
window.ExitZone = function(x, z){
	var cookies = window.cookies
	if(!cookies || !cookies.match){
		return false
	}
	/*
		개발 Part 66 (역할 일치)
		서버 index.js 는 내륙 탈출을 UCAV 에만 허용한다.
		  if(!_exitOnGate && req.cookies.role == "UCAV"){ _exitOnZone = isExitZone(x, z) }
		프론트가 역할을 보지 않으면
		  내륙을 자유 이동하는 PMC 에게도 EXIT 타일과 슬롯이 보이고
		  눌렀을 때 서버가 nogate 로 거절한다.
		"보이는데 안 되는 버튼" 이 되므로 판정 기준을 맞춘다.
		PMC 는 9칸마다 있는 게이트로 나간다.
	*/
	if(cookies.role != "UCAV"){
		return false
	}
	var gx = window.Grid ? window.Grid(x) : (x * 1)
	var gz = window.Grid ? window.Grid(z) : (z * 1)
	if(isNaN(gx) || isNaN(gz)){
		return false
	}
	/* 링 위는 게이트가 담당한다. 내륙만 탈출 구역이 된다 */
	try{
		if(window.EdgeReady && window.EdgeReady()){
			if(window.IsEdge(gx, gz)){
				return false
			}
		}else{
			/* 링이 확정되기 전에는 판정 근거가 없다 */
			return false
		}
	}catch(err){
		return false
	}
	var b = null
	try{
		b = (window.map && window.map.biomes) ? window.map.biomes[gx + ":" + gz] : null
	}catch(err){
		b = null
	}
	if(!b){
		return false
	}
	if(b.water || b.ocean){
		return false
	}
	return (window.ExitZoneHash(cookies.match, gx, gz) % window.EXIT_ZONE_MOD) === 0
}
/*
	내 발밑이 탈출 구역인가.
	슬롯 렌더 / 팝업이 함께 쓴다.
*/
window.ExitZoneSelf = function(){
	try{
		var p = window.players.self()
		return window.ExitZone(p.x, p.z)
	}catch(err){
		return false
	}
}
/*
	개발 Part 68 (자유 탈출구)
	탈출구 중 일부는 키 없이 나갈 수 있다.
	현행 문제
	  모든 탈출구가 exitKeys 5종 중 하나를 요구했다.
	  키는 대부분 크래프트를 거쳐야 얻으므로
	  자원을 못 모은 플레이어는 판이 끝날 때까지 나갈 수 없고
	  MIA 로 소지품을 잃는 것 외에 선택지가 없었다.
	조치
	  게이트 / 내륙 탈출 구역 중 일부를 자유 탈출구로 표시한다.
	판정
	  서버 memepoly.com/index.js 의 isFreeExit 과 완전히 같은 식이다.
	  솔트 "free" 를 섞어 ExitZone 판정과 독립적으로 흩어진다.
	  FREE_EXIT_MOD 를 바꾸면 양쪽을 함께 바꿔야 한다.
	주의
	  이 함수는 "이 칸이 자유 탈출구인가" 만 답한다.
	  장소 자격(게이트인가 / 탈출 구역인가)은 호출부가 따로 확인한다.
*/
window.FREE_EXIT_MOD = 4
window.FreeExit = function(x, z){
	var cookies = window.cookies
	if(!cookies || !cookies.match){
		return false
	}
	var gx = window.Grid ? window.Grid(x) : (x * 1)
	var gz = window.Grid ? window.Grid(z) : (z * 1)
	if(isNaN(gx) || isNaN(gz)){
		return false
	}
	var s = String(cookies.match) + ":free:" + gx + ":" + gz
	var h = 5381
	for(var i = 0; i < s.length; i++){
		h = (Math.imul(h, 33) ^ s.charCodeAt(i)) | 0
	}
	return ((h >>> 0) % window.FREE_EXIT_MOD) === 0
}
/*
	내 발밑이 자유 탈출구인가.
	장소 자격까지 함께 본다. 슬롯 / 팝업이 공용으로 쓴다.
*/
window.FreeExitSelf = function(){
	try{
		var p = window.players.self()
		var f = window.EdgeField ? window.EdgeField(p.x, p.z) : null
		var ok = (f && (f.gate || f.drop)) ? true : false
		if(!ok && window.ExitZone){
			ok = window.ExitZone(p.x, p.z)
		}
		if(!ok){
			return false
		}
		return window.FreeExit(p.x, p.z)
	}catch(err){
		return false
	}
}
/*
	개발 Part 67 (커밋 보존)
	미정산 nonce 를 요청 본문 형식(JSON 문자열)으로 만든다.
	BoardPoll 이 쓰던 조립 코드를 그대로 옮겨 온 것이며,
	window.Action 도 같은 것을 실어야 커밋이 유실되지 않는다.
	비어 있으면 "" 를 돌려준다. 호출부가 그때는 body 에 넣지 않는다.
*/
window.Nonces = function(){
	try{
		if(typeof OAuth3 == "undefined" || !OAuth3.nonces || !OAuth3.nonces.length){
			return ""
		}
		var out = []
		for(var i = 0; i < OAuth3.nonces.length; i++){
			var nonce = OAuth3.nonces[i]
			if(nonce){
				out.push(nonce)
			}
		}
		if(!out.length){
			return ""
		}
		return JSON.stringify(out)
	}catch(err){
		return ""
	}
}
/*
	개발 Part 67 (폴링 중단 억제)
	현행 문제
	  여러 버튼이 "즉시 새 폴링을 띄우려고" 진행 중인 요청을 abort 한다.
	    if(OAuth3.xhr){ OAuth3.xhr.abort(); delete OAuth3.xhr }
	  그런데 그 요청이 주사위 커밋을 실어 나르는 폴링일 수 있다.
	  abort 는 클라이언트만 끊으므로 서버는 커밋을 마치지만,
	  응답 헤더 도착 전에 끊기면 브라우저가 새 anchor 쿠키를 못 받는다.
	  다음 폴링은 같은 nonce 를 replay 로 거절당해 앵커가 영구히 옛 칸에 남고
	  📍 복귀 버튼이 계속 뜬다.
	조치
	  미정산 nonce 가 있으면 끊지 않는다.
	  그 요청이 끝나야 커밋과 앵커가 확정된다.
	  UI 갱신은 600ms 뒤 다음 폴링에서 따라온다.
	반환 : 실제로 끊었는가
*/
window.PollBreak = function(){
	try{
		if(!OAuth3.xhr){
			return false
		}
		if(OAuth3.nonces && OAuth3.nonces.length){
			return false
		}
		if(window.SwapPending){
			return false
		}
		OAuth3.xhr.abort()
		delete OAuth3.xhr
		return true
	}catch(err){
		return false
	}
}
/*
	개발 Part 73 (백그라운드 굴림 보호)
	현행 문제
	  window.Roll 은 500ms setInterval 로 한 칸씩 전진한다.
	  탭이 백그라운드로 가면 브라우저가 타이머를 1초 이상으로 클램프하고,
	  시간이 지나면 더 크게 늦춘다. 즉 진행이 느려진다.
	  그 사이 BoardCallback 이 아래 분기로 들어가면
	    if(typeof window.Poll.ing == "undefined" && !cookies.damage){
	        clearInterval(window.Roll.ing)
	        delete window.Roll.ing
	        window.Poll.ing = setInterval(window.Poll, time.balance)
	  진행 중인 굴림이 통째로 끊긴다.
	  그 상태로 폴링이 나가면 좌표가 중간 칸이라
	  서버 RingPathReach 가 클레임을 거절하고
	  서버 계산 도착 또는 직전 앵커로 되돌아간다.
	  사용자에게는 "탭 갔다 오니 굴리기 전 자리로 돌아갔다" 로 보인다.
	조치
	  굴림이 살아 있는지 한 곳에서 판정하고,
	  살아 있으면 폴링 전환을 하지 않는다.
	판정 근거
	  Roll.ing        인터벌이 살아 있다
	  cookies.dice    아직 걸을 칸이 남았다
	  둘 중 하나라도 참이면 굴림 중이다.
	  타이머가 늦어져 dice 만 남은 프레임도 굴림 중으로 본다.
*/
window.RollBusy = function(){
	try{
		if(typeof window.Roll === "undefined"){
			return false
		}
		if(typeof window.Roll.ing !== "undefined"){
			return true
		}
		var d = window.cookies ? (window.cookies.dice * 1) : 0
		if(!isNaN(d) && d > 0){
			return true
		}
	}catch(err){
	}
	return false
}
/*
	개발 Part 67 (툴팁 첫 슬롯)
	현행 문제
	  첫 슬롯(Build / Exit / Reserved / Fire) 조립이
	  BoardCallback 안쪽 300ms setTimeout 루프에 갇혀 있었다.
	  그래서 서버 응답이 와야만 갱신된다.
	  주사위 이동 중에는 폴링이 멈춰 있으므로
	  4칸(약 2초) + 폴링 주기 + RTT 동안 출발 칸 기준 슬롯이 남는다.
	  게이트에 도착했는데 🏗 가 떠 있거나,
	  일반 칸으로 왔는데 🚪 가 남아 있는 상태가 그것이다.
	조치
	  조립을 순수 함수로 꺼내 두 곳이 같은 결과를 쓰게 한다.
	    BoardCallback  서버 응답 시
	    TileSync       좌표가 바뀌는 즉시
	판정 근거
	  링/예약 칸  window.fields (match.hash 결정론. 서버와 동일)
	  탈출 구역   window.ExitZone (match.hash 결정론. 서버와 동일)
	  부동산      cookies.tile 이 현재 좌표와 일치할 때만 채택,
	              아니면 window.fields[].property 폴백
	  탈출 가능   cookies.exitable (서버 최종 판정)
	즉 좌표 의존 정보는 전부 클라이언트가 스스로 계산할 수 있고,
	서버 확정값이 필요한 것만 쿠키를 좌표 일치 조건으로 읽는다.
	opts.fireCount 를 주지 않으면 현재 DOM 의 깃발 수를 그대로 유지한다.
*/
window.SlotBody = function(opts){
	var o = opts ? opts : {}
	var cookies = window.cookies
	if(!cookies){
		return `<a class="hashType"></a>`
	}
	var player = null
	try{
		player = window.players.self()
	}catch(err){
		player = null
	}
	if(!player){
		return `<a class="hashType"></a>`
	}
	var cnt = 0
	if(typeof o.fireCount !== "undefined" && !isNaN(o.fireCount * 1)){
		cnt = o.fireCount * 1
	}else{
		try{
			var _prev = $('#root player[self="true"] tooltip a.hashType.Fire .cnt').text()
			cnt = (_prev && !isNaN(_prev * 1)) ? (_prev * 1) : 0
		}catch(err){
			cnt = 0
		}
	}
	var src = ""
	try{
		src = "/src/fonts/emoji/animated/" + window.emojiUnicode("🔥") + ".webp"
	}catch(err){
		src = ""
	}
	/*
		개발 Part 75 (필드 슬롯)
		현행 문제
		  조건이 cookies.enter 하나뿐이었다.
		  감옥 칸에서 걸어 나온 상태는 jail 만 서 있고 enter 가 없으므로
		  빈 <a class="hashType"></a> 가 나갔다.
		  그런데 서버 flag 핸들러는 출격 여부를 보지 않는다.
		    else if (req.body.cc == "flag" && req.cookies.team)
		  team 은 모든 플레이어에게 배정되므로 감옥 외출 중에도
		  깃발은 이미 허용되고 있었다. 프론트만 버튼을 감춘 상태였다.
		확정 규칙
		  개발 Part 30 이 감옥을 필드 진입점으로 확정했다.
		  필드에 나와 있으면(enter 또는 jail) 첫 슬롯은 깃발이다.
		  링 위에서는 아래 Exit / Reserved / Build 분기가 덮어쓰므로
		  이 값은 "링 밖" 에서만 최종값이 된다.
		폭탄과의 차이
		  폭탄은 개발 Part 47 규칙으로 enter 를 요구한다.
		  깃발은 서버가 team 만 본다. 두 자격은 다르므로 분리한다.
	*/
	var _inField = (cookies.enter || cookies.jail) ? true : false
	var out = _inField
		? `<a class="hashType Fire" ready="${cookies.enter ? "1" : "0"}"><img src="${src}"><span class="cnt">${cnt}</span></a>`
		: `<a class="hashType"></a>`
	try{
		var _sf = window.EdgeSelf ? window.EdgeSelf() : null
		var _rk = (_sf && window.ReservedTile)
			? window.ReservedTile(_sf.x, _sf.z) : ""
		var _zone = false
		try{
			if(!_sf && window.ExitZone){
				_zone = window.ExitZone(player.x, player.z)
			}
		}catch(err){
			_zone = false
		}
		if((_sf && (_sf.gate || _sf.drop)) || _zone){
			var _free = false
			try{
				_free = cookies.exitFreeHere
					? true
					: (window.FreeExit ? window.FreeExit(player.x, player.z) : false)
			}catch(err){
				_free = false
			}
			var _exitOk = (cookies.exitable || _free) ? true : false
			var _exitHave = cookies.exitHave ? cookies.exitHave * 1 : 0
			var _exitNeed = cookies.exitNeed ? cookies.exitNeed * 1 : 0
			if(isNaN(_exitHave)){
				_exitHave = 0
			}
			if(isNaN(_exitNeed)){
				_exitNeed = 0
			}
			var _exitCnt = ""
			if(!_free && _exitNeed > 0){
				_exitCnt = _exitHave + "/" + _exitNeed
			}
			out = `<a class="hashType Exit emoji color" ready="${_exitOk ? "1" : "0"}" zone="${_zone ? "1" : "0"}" free="${_free ? "1" : "0"}"><i class="emoji color">🚪</i><span class="cnt">${_exitCnt}</span></a>`
		}else if(_sf && _rk){
			if(_rk === "item"){
				out = `<a class="hashType"></a>`
			}else{
				out = `<a class="hashType Reserved emoji color" tile="${_rk}"><i class="emoji color">🔒</i></a>`
			}
		}else if(_sf){
			var _prop = null
			try{
				if(cookies.tile &&
					(cookies.tile.x * 1) === (player.x * 1) &&
					(cookies.tile.z * 1) === (player.z * 1)){
					_prop = {
						level : cookies.tile.level * 1,
						owner : cookies.tile.owner ? cookies.tile.owner : "",
						toll : cookies.tile.toll ? cookies.tile.toll * 1 : 0
					}
				}
			}catch(err){
				_prop = null
			}
			if(!_prop && _sf.property){
				_prop = {
					level : _sf.property.level * 1,
					owner : _sf.property.owner ? _sf.property.owner : "",
					toll : _sf.property.toll ? _sf.property.toll * 1 : 0
				}
			}
			if(!_prop){
				_prop = { level : 0, owner : "", toll : 0 }
			}
			if(isNaN(_prop.level)){
				_prop.level = 0
			}
			if(isNaN(_prop.toll)){
				_prop.toll = 0
			}
			var _lvEmoji = "🏗"
			try{
				if(_prop.level > 0 && window.PropertyLevelEmoji){
					if(window.PropertyLevelEmoji[_prop.level]){
						_lvEmoji = window.PropertyLevelEmoji[_prop.level]
					}
				}
			}catch(err){
			}
			var _own = ""
			var _cnt = _prop.toll > 0 ? _prop.toll : ""
			var _nation = false
			try{
				if(cookies.tile &&
					(cookies.tile.x * 1) === (player.x * 1) &&
					(cookies.tile.z * 1) === (player.z * 1)){
					_nation = cookies.tile.nation ? true : false
					if(_nation){
						var _pot = cookies.tile.treasury ? cookies.tile.treasury * 1 : 0
						_cnt = (isNaN(_pot) || _pot <= 0) ? "" : _pot
					}
				}
			}catch(err){
				_nation = false
			}
			if(_nation){
				_own = "nation"
				_lvEmoji = "🏛"
			}else if(_prop.owner){
				var _me = cookies.address ? cookies.address : cookies.hash
				var _oa = String(_prop.owner).replace("0x","").toLowerCase()
				var _ma = String(_me ? _me : "").replace("0x","").toLowerCase()
				var _zero = "0000000000000000000000000000000000000000"
				if(_oa === _zero){
					_own = ""
				}else{
					_own = (_oa === _ma) ? "self" : "other"
				}
			}
			/*
				개발 Part 71 (매수 제안)
				남의 땅이면 건설이 아니라 제안이다.
				아이콘을 🤝 로 바꿔 "지을 수 없지만 살 수는 있다" 를 알린다.
				금액은 서버가 계산한 offerPrice 를 그대로 보여준다.
			*/
			if(_own === "other"){
				try{
					if(cookies.tile &&
						(cookies.tile.x * 1) === (player.x * 1) &&
						(cookies.tile.z * 1) === (player.z * 1) &&
						cookies.tile.offerPrice){
						_lvEmoji = "🤝"
						_cnt = cookies.tile.offerOpen ? "…" : (cookies.tile.offerPrice * 1)
					}
				}catch(err){
				}
			}
			out = `<a class="hashType Build emoji color" lv="${_prop.level}" own="${_own}"><i class="emoji color">${_lvEmoji}</i><span class="cnt">${_cnt}</span></a>`
		}
	}catch(err){
	}
	return out
}
/*
	개발 Part 74 (두 번째 슬롯 아이콘)
	현행 문제
	  툴팁 두 번째 슬롯(Meta)은 자리에 따라 역할이 바뀐다.
	    링 위    주사위
	    링 밖    폭탄
	  그런데 붙어 있는 것은 빈 <i></i> 하나뿐이고,
	  이 노드를 채우는 코드가 어디에도 없다.
	    BoardCallback  템플릿에 <i></i> 로 고정
	    TileSync       children("li").first() 즉 첫 슬롯만 갱신
	  그래서 내륙으로 걸어 들어가도 폭탄 아이콘이 뜨지 않는다.
	조치
	  첫 슬롯의 SlotBody 와 같은 방식으로 아이콘을 순수 함수로 만든다.
	  링 위에서는 빈 문자열을 돌려준다.
	  거기서는 #dice 슬롯머신이 아이콘 역할을 하므로
	  <i> 에 무언가를 넣으면 두 개가 겹친다.
	반환
	  { icon, act, ready }
	    icon   <i> 에 넣을 문자
	    act    "dice" | "bomb" | ""   CSS 분기용
	    ready  "1" | "0"              지금 실행 가능한가
	ready 를 나누는 이유
	  감옥에서 걸어 나온 미출격 플레이어는 내륙에 서 있지만
	  개발 Part 47 규칙으로 폭탄을 던질 수 없다.
	  아이콘을 감추면 "왜 아무것도 없지" 가 되고,
	  똑같이 보이면 "눌러도 안 되는 버튼" 이 된다.
	  Exit 슬롯의 ready 속성과 같은 방식으로 상태를 드러낸다.
*/
window.MetaIcon = function(){
	var out = { icon : "", act : "", ready : "0" }
	var cookies = window.cookies
	if(!cookies){
		return out
	}
	try{
		if(!window.EdgeReady || !window.EdgeReady()){
			return out
		}
		if(window.EdgeSelf && window.EdgeSelf()){
			out.act = "dice"
			out.ready = (window.CanDiceNow && window.CanDiceNow()) ? "1" : "0"
			return out
		}
		var _p = window.players.self()
		var _b = null
		try{
			_b = (window.map && window.map.biomes)
				? window.map.biomes[_p.x + ":" + _p.z] : null
		}catch(err){
			_b = null
		}
		if(!_b || !_b.biome){
			return out
		}
		if(!window.Biomes["#" + _b.biome]){
			return out
		}
		out.icon = "💣"
		out.act = "bomb"
		out.ready = cookies.enter ? "1" : "0"
	}catch(err){
		return { icon : "", act : "", ready : "0" }
	}
	return out
}
/*
	개발 Part 75 (두 번째 슬롯 분리)
	개발 Part 74 의 오판
	  Meta 노드 안의 <i> 에 문자만 꽂으면 될 줄 알았다.
	  실제로는 두 가지에 막힌다.
	    1) <i> 에 emoji color 클래스가 없다.
	       보이는 슬롯(Build / Exit / Reserved / Balance)은 전부
	         <i class="emoji color">이모지</i>
	       형태다. Meta 만 <i></i> 로 비어 있는데, 그 자리는
	       원래 CSS 가 아이콘을 그리도록 설계된 곳이다.
	    2) .hashType.Meta 는 #dice 를 품는 컨테이너로 스타일링돼 있고
	       표시 자체가 body[edge="true"] 로 게이트된다.
	         body[edge="true"] ... ul[style]{opacity: 1}
	       내륙에서는 TileSync 가 body[edge] 를 지우므로
	       Meta 슬롯 내부가 통째로 감춰진다.
	       그래서 DOM 에 💣 가 있어도 화면에 뜨지 않았다.
	확정 규칙
	  Exit / Build / Reserved 가 각자 클래스를 갖는 것처럼
	  폭탄도 자기 클래스(Bomb)를 가진 별도 앵커로 그린다.
	  마크업 모양을 Build 와 동일하게 맞추면
	  이미 검증된 .hashType + .emoji.color 스타일을 그대로 탄다.
	  개발 Part 46 이 지적한 "폭탄 오인" 도
	  Meta 하나가 두 역할을 겸한 데서 온 문제였다.
	두 벌 조립 금지
	  BoardCallback 과 TileSync 가 각자 조립하면
	  결과가 갈려 슬롯이 깜빡인다(개발 Part 67).
	  SlotBody 와 같이 순수 함수 하나로 모은다.
	dice 값
	  opts.dice 를 주지 않으면 현재 DOM 의 .num 을 그대로 유지한다.
	  SlotBody 의 fireCount 폴백과 같은 방식이다.
	공백
	  개행 / 탭 없이 한 줄로 만든다.
	  호출부가 정규화 후 문자열 비교를 하므로 형태가 어긋나면
	  매 프레임 교체가 일어난다.
*/
window.MetaBody = function(opts){
	var o = opts ? opts : {}
	var _num = 0
	if(typeof o.dice !== "undefined" && !isNaN(o.dice * 1)){
		_num = Math.ceil(Math.sqrt(Math.pow(o.dice * 1, 2)))
	}else{
		try{
			var _prev = $('#root player[self="true"] tooltip #dice .num').text()
			_num = (_prev && !isNaN(_prev * 1)) ? (_prev * 1) : 0
		}catch(err){
			_num = 0
		}
	}
	var _meta = window.MetaIcon
		? window.MetaIcon()
		: { icon : "", act : "", ready : "0" }
	if(_meta.act === "bomb"){
		return `<a class="hashType Bomb emoji color" ready="${_meta.ready}"><i class="emoji color">💣</i></a>`
	}
	return `<a class="hashType Meta emoji color" act="${_meta.act}" ready="${_meta.ready}"><i></i><div id="dice" class="slot-machine"><div class="slotwrapper"><ul><li>1</li><li>2</li><li>3</li><li>4</li><li>5</li><li>6</li></ul><div class="num">${_num}</div></div></div></a>`
}
window.TileSync = function(){
	try{
		if(window.Mode() != "board"){
			return false
		}
		var cookies = window.cookies
		if(!cookies){
			return false
		}
		var $body = $("body")
		var player = null
		try{
			player = window.players.self()
		}catch(err){
			player = null
		}
		if(!player){
			return false
		}
		try{
			var b = window.map.biomes[player.x + ":" + player.z]
			if(b && b.biome){
				$body.attr("biome", b.biome)
			}
		}catch(err){
		}
		try{
			var f = window.EdgeField ? window.EdgeField(player.x, player.z) : null
			$body.attr("field", (f && (f.item || f.drop)) ? (f.item || f.drop) : "")
			if(f){
				$body.attr("edge", "true")
			}else{
				$body.removeAttr("edge")
			}
		}catch(err){
			$body.removeAttr("edge")
		}
		try{
			if(window.CanDiceNow && window.CanDiceNow()){
				$body.attr("diceable", "true")
			}else{
				$body.removeAttr("diceable")
			}
		}catch(err){
			$body.removeAttr("diceable")
		}
		try{
			if(window.RingSync){
				window.RingSync()
			}
		}catch(err){
		}
		try{
			if(window.DiceHome && window.DiceHome()){
				$body.attr("dicehome", "true")
			}else{
				$body.removeAttr("dicehome")
			}
		}catch(err){
			$body.removeAttr("dicehome")
		}
		try{
			var _mb = window.MetaIcon ? window.MetaIcon() : null
			if(_mb && _mb.act === "bomb" && _mb.ready === "1"){
				$body.attr("bombable", "true")
			}else{
				$body.removeAttr("bombable")
			}
		}catch(err){
			$body.removeAttr("bombable")
		}
		try{
			if(window.DiceSpinBusy && window.DiceSpinBusy()){
				return true
			}
		}catch(err){
		}
		var $li = $('#root player[self="true"] tooltip ul').children("li").first()
		if(!$li.length){
			return true
		}
		var body = window.SlotBody({})
		var before = $li.html()
		if(before){
			before = before.replace(/\t/gi,"").replace(/\n/gi,"").trim()
		}
		var after = body.replace(/\t/gi,"").replace(/\n/gi,"").trim()
		if(before !== after){
			$li.html(after)
		}
		try{
			var _meta = window.MetaIcon ? window.MetaIcon() : null
			if(_meta){
				var $li2 = $('#root player[self="true"] tooltip ul').children("li").eq(1)
				if($li2.length){
					var $slot = $li2.children("a").first()
					var _isBomb = $slot.length ? $slot.hasClass("Bomb") : false
					var _wantBomb = (_meta.act === "bomb")
					if(!$slot.length || _isBomb !== _wantBomb){
						$li2.html(window.MetaBody({}))
					}else{
						if($slot.attr("ready") !== _meta.ready){
							$slot.attr("ready", _meta.ready)
						}
						if(!_wantBomb && $slot.attr("act") !== _meta.act){
							$slot.attr("act", _meta.act)
						}
					}
				}
			}
		}catch(err){
		}
		try{
			var $bal = $('#root player[self="true"] tooltip a.hashType.Balance .cnt')
			if($bal.length){
				var _bv = cookies.balance ? cookies.balance * 1 : 0
				if(isNaN(_bv)){
					_bv = 0
				}
				var _bt = nFormatter(_bv, 1)
				if($bal.text() !== _bt){
					$bal.text(_bt)
				}
			}
		}catch(err){
		}
		return true
	}catch(err){
		return false
	}
}
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
window.NATION = "0x0000000000000000000000000000000000000000"
window.TileLift = 0.02
window.CursorLift = 0.06
window.Grid = function(v){
	var n = v * 1
	if(isNaN(n)){
		return n
	}
	return Math.round(n * 2) / 2
}
window.RingAnchor = function(){
    try{
        if(window.Mode && window.Mode() != "board"){
            return null
        }
        var raw = window.cookies ? window.cookies.anchor : ""
        if(!raw){
            return null
        }
        var p = String(raw).split(",")
		if(p.length < 2){
			return null
		}
		var ax = p[0] * 1
		var az = p[1] * 1
		if(isNaN(ax) || isNaN(az)){
			return null
		}
		if(window.EdgeReady && window.EdgeReady()){
			if(!window.IsEdge(ax, az)){
				return null
			}
		}
		return { x : ax, z : az }
	}catch(err){
		return null
	}
}
window.RingReturn = function(anchor){
    if(!anchor){
        return false
    }
    try{
        if(window.Mode && window.Mode() != "board"){
            console.log("[dice] anchor return skipped :: not board mode")
            return false
        }
    }catch(err){
        return false
    }
    try{
        var _y = 0
        var b = window.map.biomes[anchor.x + ":" + anchor.z]
		if(b && typeof b.y !== "undefined"){
			_y = b.y * 1
		}
		/* 개발 Part 63 (표시 높이 통일) */
		var _aTile = window.TileLift ? window.TileLift * 1 : 0.02
		var _aCur = window.CursorLift ? window.CursorLift * 1 : 0.06
		if(isNaN(_aTile)){ _aTile = 0.02 }
		if(isNaN(_aCur)){ _aCur = 0.06 }
		window.Snap = 8
		window.current.current.position.x = window.cursor.current.position.x = anchor.x
		window.current.current.position.y = _y + _aTile
		window.cursor.current.position.y = _y + _aCur
		window.current.current.position.z = window.cursor.current.position.z = anchor.z
		var _h = window.cookies.address ? window.cookies.address : window.cookies.hash
		if(window[_h] && window[_h].position){
			window[_h].position.x = anchor.x
			window[_h].position.y = _y + 0.5
			window[_h].position.z = anchor.z
		}
		window.setFrameloop("always")
		return true
	}catch(err){
		return false
	}
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
window.FieldView = function(_x, _z){
	try{
		if(!window.assets || !window.assets.set){
			return false
		}
		if(!window.map || !window.map.biomes){
			return false
		}
		var size = 4
		var cx = window.Grid ? window.Grid(_x) : (_x * 1)
		var cz = window.Grid ? window.Grid(_z) : (_z * 1)
		if(isNaN(cx) || isNaN(cz)){
			return false
		}
		var _url = new URL(window.location.href)
		var cc = ethers.hashMessage(_url.href.replace(window.location.protocol+"//",""))
			cc = ethers.computeAddress(cc).toLowerCase().replace("0x","")
		if(window.location.hash){
			cc = window.location.hash.replace("#","")
		}
		var trail = window.TrailMap ? window.TrailMap() : {}
		var seen = {}
		var out = []
		for(var dx = -size + 1; dx < size; dx++){
			for(var dz = -size + 1; dz < size; dz++){
				var bx = cx + dx
				var bz = cz + dz
				var key = bx + ":" + bz
				var b = window.map.biomes[key]
				if(!b || !b.biome){
					continue
				}
				var color = window.Biomes["#" + b.biome]
				if(trail[key]){
					var _reserved = ""
					try{
						_reserved = window.ReservedTile ? window.ReservedTile(bx, bz) : ""
					}catch(err){
						_reserved = ""
					}
					if(!_reserved){
						color = "black"
					}
				}
				seen[key] = true
				out.push({
					id : crc32(cc + "#" + b.biome + bx + bz).toString(32).toUpperCase(),
					hash : cc,
					name : "#" + b.biome,
					value : color,
					color : color,
					x : bx,
					y : b.y - (b.water ? 0.8 : 0.5),
					z : bz
				})
			}
		}
		/*
			개발 Part 65 (시야 밖 궤적 제거)
			여기 있던 TrailFill 호출을 제거한다.
			창 안 좌표는 위 이중 루프가 이미 담았고,
			창 밖 좌표는 그리지 않는다.
		*/
		if(!out.length){
			return false
		}
		var sig = ""
		for(var s = 0; s < out.length; s++){
			sig += out[s].id + out[s].color + "|"
		}
		if(window.FieldView.sig === sig){
			return false
		}
		window.FieldView.sig = sig
		window.assets.set(out)
		window.setFrameloop("always")
		return true
	}catch(err){
		return false
	}
}
window.FieldView.sig = ""
window.CanMoveTo = function(_x, _z){
	var cookies = window.cookies
	if(!cookies){
		window.CanMoveTo.reason = ""
		return false
	}
	if(cookies.role == "UCAV" && cookies.enter){
		if(window.IsEdge(_x, _z)){
			window.CanMoveTo.reason = "ucav"
			return false
		}
	}
	if(!cookies.enter && cookies.jail){
		try{
			if(window.EdgeReady && window.EdgeReady() && window.IsEdge(_x, _z)){
				var _a = window.RingAnchor ? window.RingAnchor() : null
				if(!_a){
					window.CanMoveTo.reason = "noanchor"
					return false
				}
				var _tx = window.Grid(_x)
				var _tz = window.Grid(_z)
				if(_a.x !== _tx || _a.z !== _tz){
					window.CanMoveTo.reason = "anchor"
					return false
				}
			}
		}catch(err){
		}
	}
	window.CanMoveTo.reason = ""
	return true
}
window.CanMoveTo.reason = ""
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

/*
	개발 Part 76 (쿠키 파싱 방어)
	현행 문제
	  응답의 cookies 는 JSON 문자열이고, 그 안에 또 JSON 문자열이 들어 있다.
	    "tile":"{\"x\":-21.5,\"z\":-75.5,…}"
	  이스케이프가 한 번이라도 빠지면 다음 형태가 되어
	    "tile":"{"x":3.5,"z":-19.5,…}"
	  JSON.parse 가 통째로 실패한다.
	    Uncaught SyntaxError: Expected ',' or '}' after property value
	  그러면 tile 하나 때문에
	    dice / axis / match / team / balance
	  를 전부 잃고 BoardCallback 이 첫 줄에서 중단된다.
	  화면이 멈추고, 폴링은 계속 돌면서 매번 같은 예외를 던진다.
	조치
	  파싱을 3단계로 나눈다.
	    1) 그대로 파싱한다. 정상 응답은 여기서 끝난다.
	    2) 실패하면 이스케이프가 빠진 중첩 JSON 값을 복구한다.
	       "key":"{…}"  ->  "key":{…}
	       따옴표를 벗기면 그 자리가 유효한 객체가 되어 전체가 살아난다.
	    3) 그래도 실패하면 문제 있는 값을 잘라내고 다시 시도한다.
	  전부 실패하면 null 을 돌려준다. 호출부가 직전 쿠키를 유지한다.
	2단계를 정상 응답에 적용하지 않는 이유
	  정상 응답에는 "key":"{\"x\":…}" 처럼 이스케이프가 살아 있다.
	  거기에 같은 치환을 걸면 멀쩡한 값을 깨뜨린다.
	  1단계가 성공하면 아예 도달하지 않으므로 안전하다.
*/
window.CookiesParse = function(raw){
	if(!raw){
		return null
	}
	if(typeof raw === "object"){
		return raw
	}
	var text = String(raw)
	try{
		return JSON.parse(text)
	}catch(err){
	}
	/* 2) 이스케이프가 빠진 중첩 JSON 복구 */
	try{
		var _fixed = text.replace(
			/"([A-Za-z0-9_]+)"\s*:\s*"(\{[\s\S]*?\}|\[[\s\S]*?\])"(?=\s*[,}])/g,
			'"$1":$2'
		)
		var _out = JSON.parse(_fixed)
		console.log("[cookie] repaired nested json")
		return _out
	}catch(err){
	}
	/* 3) 문제 있는 값을 잘라낸다 */
	try{
		var _stripped = text.replace(
			/,?\s*"([A-Za-z0-9_]+)"\s*:\s*"\{[\s\S]*?\}"(?=\s*[,}])/g,
			""
		)
		/* 첫 키가 잘려 "{," 가 된 경우를 정리한다 */
		_stripped = _stripped.replace(/\{\s*,/, "{")
		var _out2 = JSON.parse(_stripped)
		console.log("[cookie] dropped malformed value(s) to recover")
		return _out2
	}catch(err){
	}
	console.log("[cookie] parse failed. keeping previous cookies")
	return null
}
window.Callback = async function(resp){
	if(!resp || !resp.body || !resp.body.cookies){
		return
	}
	var _cookies = window.CookiesParse(resp.body.cookies)
	if(!_cookies){
		_cookies = window.cookies
	}
	try{
		if(window.StateApply){
			window.StateApply(resp)
		}
	}catch(err){
		console.log("state apply err", err)
	}
	var mode = window.Mode(_cookies)
	$("body").attr("world", mode)
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
	/*
		개발 Part 78 (사망 후 마이룸)
		현행 문제
		  사망하면 BoardCallback 이 아래를 세운다.
		    $body.attr('game',"over")
		    $body.attr('dead',"true")
		  지우는 곳은 같은 if 의 else 분기 하나뿐이고,
		  그건 보드 모드에서만 실행된다.
		  마이룸으로 넘어가는 경로 어디에도 해제가 없다.
		    onhashchange   myroom 속성만 제거
		    RoomHashChange removeAttr("class") 뿐. dead / game 은 속성이라 남는다
		    RoomCallback   스테이지 상태를 건드리지 않는다
		                   (StageSync 는 BoardCallback 에서만 호출된다)
		  그 결과 마이룸에서 두 가지가 동시에 걸린다.
		    1) Experience.jsx 개발 Part 69 의 클릭 게이트가 막는다.
		       body[myroom] / body[panel] / body[dead] / body[stage]
		       중 하나라도 서 있으면 3D 클릭을 무시한다.
		       마이룸 패널을 닫아 body[myroom] 을 지워도
		       body[dead] 가 남아 계속 막힌다.
		    2) #dead 전체 화면 레이어가 마이룸 위에 겹쳐 클릭을 먹는다.
		  "사망 후 마이룸에서 필드를 클릭해도 안 움직인다" 의 직접 원인이다.
		확정 규칙
		  사망은 보드 매치에 속한 상태다.
		  진실 원천은 서버의 cookies.damage / cookies.dead 이고,
		  보드로 돌아오면 BoardCallback 이 같은 자리에서 다시 세운다.
		  마이룸은 개발 Part 15 (규칙 R1 / R2) 가
		  "사망 시에도 열어 두는 경로" 로 확정한 목적지이므로
		  거기서 표시만 내리는 것은 규칙과 어긋나지 않는다.
		  슬롯 소모 / 소지품 소각 같은 실제 정산은 서버가 이미 마쳤다.
		좌표 파생 속성
		  edge / diceable / dicehome / bombable 은 보드 링 기준이다.
		  룸 좌표계에서는 의미가 없고, TileSync 는
		  Mode() != "board" 이면 즉시 반환하므로 스스로 지우지 못한다.
		  여기서 함께 내린다.
	*/
	if(mode == "room"){
		try{
			$("body")
				.removeAttr("dead")
				.removeAttr("game")
				.removeAttr("stage")
				.removeAttr("panel")
				.removeAttr("jail")
				.removeAttr("edge")
				.removeAttr("diceable")
				.removeAttr("dicehome")
				.removeAttr("bombable")
			if(window.DeadClose){
				window.DeadClose()
			}
			if(window.Panel && window.Panel.close){
				window.Panel.close()
			}
			if(window.Stage && window.Stage.set){
				window.Stage.set("")
			}
			$("#dead, #lobby, #raid").removeClass("on")
		}catch(err){
		}
	}
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
			/*
				개발 Part 45 (바다 스폰)
				저장된 axis 가 바다면 쓰지 않는다.
				판 전환 직후에는 섬이 통째로 바뀌므로
				이전 판의 육지 좌표가 이번 판에서는 바다일 수 있다.
				position 을 만들지 않으면 아래 랜덤 스폰 루프가
				물이 아닌 칸을 골라 준다.
				바이옴 테이블이 아직 비어 있는 프레임에서는
				판정 근거가 없으므로 그대로 채택한다(기존 동작 유지).
			*/
			var _axWater = false
			try{
				var _axBiome = window.map.biomes[_ax.x + ":" + _ax.z]
				if(_axBiome && _axBiome.water){
					_axWater = true
				}
			}catch(err){
				_axWater = false
			}
			if(!_axWater){
				position = {
					x : _ax.x,
					y : _ax.y,
					z : _ax.z
				}
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
		/* 개발 Part 94 : 쿠키 파싱은 CookiesParse 로 일원화한다 */
		var cookies = window.CookiesParse
			? window.CookiesParse(res.body.cookies)
			: null
		if(!cookies){
			console.log("[push] subscribe response :: cookies unreadable")
			return
		}
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
/*
	개발 Part 50 (애니메이션 이모지)
	현행 문제
	  Player.jsx 가 판정과 경로 조립을 직접 했다.
	    var _animated = ["🔥", "🎃", "👻", "🛩", "⚔", "🗡"]
	    if(props.emoji == "💣"){
	    }else if(window.typeof_emoji(props.emoji) || _animated.indexOf(...) > -1){
	        type = "image"
	        hex = window.emojiUnicode(props.emoji)
	        src = `/src/fonts/emoji/animated/${hex}.webp`
	  세 가지가 걸린다.
	    1) _animated 하드코딩이 이미 "emojis 에 없지만 webp 는 있는" 것을
	       메우는 임시방편이다. 🫥 / 🤯 도 같은 처지인데 빠져 있었다.
	    2) webp 파일이 없으면 img 가 404 로 깨지는데
	       #root player[type="image"] i{display: none;} 때문에
	       텍스트 폴백도 감춰져 캐릭터가 화면에서 통째로 사라진다.
	    3) 같은 판정이 RoomAsset / 스티커 등 다른 곳에도 흩어져 있다.
	조치
	  판정과 경로를 한 곳으로 모으고, 실패한 파일을 기억해 재시도를 막는다.
	반환
	  webp 경로 문자열, 또는 "" (텍스트로 그려야 함)
*/
/*
	개발 Part 62 (이모지 이미지 3단계 폴백)
	현행 문제
	  애니메이션 webp 만 시도하고 없으면 곧장 텍스트로 떨어뜨렸다.
	  그런데 애니메이션 세트(Noto Animated Emoji)는
	  얼굴 / 손짓 / 하트 / 일부 사물 약 200여 개뿐이고 무기류가 없다.
	    🔥 1f525  있음
	    🎃 1f383  있음
	    👻 1f47b  있음
	    ⚔  2694   없음
	    🗡 1f5e1  없음
	    🛩 1f6e9  없음
	  그래서 NPC 세 종류(PMC ⚔ / SCAV 🗡 / UCAV 🛩)가 전부
	  OS 폰트 글리프로 그려졌다.
	    <player type="text"><picture><img src=""></picture><i>⚔</i>
	  운영체제마다 모양이 달라지고 색도 없다.
	조치
	  정적 PNG 세트로 한 단계 더 떨어뜨린다.
	  프로젝트가 3D 타일 텍스처로 이미 전체 Noto PNG 를 쓴다.
	    map={useLoader(THREE.TextureLoader, `/src/fonts/emoji/emoji_u${...}.png`)}
	  즉 /src/fonts/emoji/emoji_u2694.png 는 존재한다.
	폴백 순서
	  1) /src/fonts/emoji/animated/{hex}.webp   움직인다
	  2) /src/fonts/emoji/emoji_u{hex}.png      정지 이미지. 색과 모양이 일정하다
	  3) 텍스트                                  둘 다 없을 때만
	크기
	  #root .emoji picture * 가 width 18vh 를 주므로
	  webp 든 png 든 같은 크기로 그려진다. CSS 수정이 필요 없다.
	실패 기억
	  파일이 없는 것은 세션 내내 변하지 않는다.
	  한 번 404 가 나면 기록해 두고 다시 요청하지 않는다.
*/
window.EmojiFail = { webp : {}, png : {} }
window.EmojiSrc = function(icon){
	if(!icon){
		return ""
	}
	/*
		💣 는 의도적으로 제외한다.
		폭탄은 3D 자산 / 마커로 따로 그리며 플레이어 본체로는 쓰지 않는다.
		(Player.jsx 의 기존 예외를 그대로 유지한다)
	*/
	if(icon === "💣"){
		return ""
	}
	/*
		이미지로 그릴 대상인지 판정한다.
		  typeof_emoji  window.emojis 에 있는 것(룰셋 이모지 덱)
		  typeof_item   window.items 에 있는 것(⚔ 🗡 🛩 등 장비 / 사물)
		  _extra        어느 쪽에도 없지만 게임이 쓰는 것(🎃 👻 등 NPC)
		셋 중 하나라도 맞으면 Noto PNG 가 존재한다고 본다.
		없으면 onError 가 텍스트로 되돌린다.
	*/
	var _extra = ["🔥", "🎃", "👻", "🛩", "⚔", "🗡", "🫥", "🤯"]
	var known = false
	try{
		known = window.typeof_emoji(icon) ? true : false
	}catch(err){
		known = false
	}
	if(!known){
		try{
			known = window.typeof_item(icon) ? true : false
		}catch(err){
			known = false
		}
	}
	if(!known && _extra.indexOf(icon) === -1){
		return ""
	}
	var hex = ""
	try{
		hex = window.emojiUnicode(icon)
	}catch(err){
		return ""
	}
	if(!hex){
		return ""
	}
	if(!window.EmojiFail.webp[hex]){
		return "/src/fonts/emoji/animated/" + hex + ".webp"
	}
	if(!window.EmojiFail.png[hex]){
		return "/src/fonts/emoji/emoji_u" + hex + ".png"
	}
	return ""
}
/*
	개발 Part 62 (폴백 진행)
	img 로드가 실패하면 다음 단계로 넘긴다.
	  webp 실패  같은 자리에서 png 로 즉시 교체한다.
	             React 재렌더를 기다리면 한 프레임 캐릭터가 사라진다.
	  png 실패   src 를 지우고 type 을 text 로 되돌린다.
	재렌더 안전성
	  EmojiSrc 가 EmojiFail 을 먼저 보므로
	  React 가 다시 그려도 같은 단계로 돌아오지 않는다.
	호출부는 Player.jsx 의 <img onError> 다.
*/
window.EmojiSrcError = function(el){
	if(!el){
		return
	}
	try{
		var src = el.getAttribute("src")
		if(!src){
			return
		}
		var file = String(src).split("/").pop()
		if(src.indexOf("/animated/") > -1){
			var whex = file.replace(".webp", "")
			if(whex){
				window.EmojiFail.webp[whex] = true
				/* 같은 자리에서 정적 PNG 로 갈아탄다 */
				el.setAttribute("src", "/src/fonts/emoji/emoji_u" + whex + ".png")
				return
			}
		}
		if(file.indexOf("emoji_u") === 0){
			var phex = file.replace("emoji_u", "").replace(".png", "")
			if(phex){
				window.EmojiFail.png[phex] = true
				console.log("[emoji] no image for " + phex + ". falling back to text")
			}
		}
		el.removeAttribute("src")
		var _emoji = el.closest ? el.closest("emoji") : null
		if(_emoji){
			_emoji.setAttribute("type", "text")
		}
		var _player = el.closest ? el.closest("player") : null
		if(_player){
			_player.setAttribute("type", "text")
		}
	}catch(err){
	}
}
/*
	개발 Part 50 호환.
	기존 호출부가 남아 있어도 동작하도록 이름만 이어 둔다.
*/
window.AnimatedEmoji = function(icon){
	return window.EmojiSrc(icon)
}
window.EmojiWebpError = function(el){
	return window.EmojiSrcError(el)
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
/*
	개발 Part 64 (NPC 얼굴)
	현행 문제
	  NPC 의 본체 이모지가 무기였다.
	    <player team="#pmc"><i>⚔</i>
	  플레이어는 얼굴(😀)인데 NPC 만 칼이라 사람으로 보이지 않는다.
	  게다가 역할을 본체 이모지에서 역추론하고 있어
	    role : window.typeof_role(player.emoji, ...)
	  얼굴로 바꾸면 역할 정보를 잃는다.
	조치
	  역할은 행의 해시태그에서 가져온다.
	    Cc: "5.5,-40.5,0 #pmc {주소} @⚔"  ->  hashtag "#pmc"
	  이미 team 으로 화면까지 전달되고 있으므로 서버 수정이 필요 없다.
	  본체는 역할별 얼굴 풀에서 고른다.
	사람 팀과의 구분
	  teams = ["#red", "#blue", "#black", "#white"] 는 사람 플레이어 팀이다.
	  #pmc / #scav / #ucav 만 NPC 로 본다.
*/
window.NpcRole = function(tag){
	if(!tag){
		return ""
	}
	var t = String(tag).replace("#", "").toUpperCase()
	if(t === "PMC" || t === "SCAV" || t === "UCAV"){
		return t
	}
	return ""
}
/*
	개발 Part 64 (NPC 얼굴)
	역할별 얼굴 풀.
	전부 src/emojis.js 에 webp:true 로 등록돼 있어
	애니메이션 webp 가 존재한다(개발 Part 62 의 1단계에서 잡힌다).
	성격을 나눠 역할이 한눈에 읽히게 한다.
	  PMC   적대 전투     화난 얼굴
	  SCAV  은밀 파밍     엿보는 얼굴
	  UCAV  기계 드론     무표정
*/
window.NpcFace = {
	PMC : ["😠", "😡", "🤬", "😤", "😬"],
	SCAV : ["😏", "🤫", "🫣", "🧐", "😶"],
	UCAV : ["🫡", "😐", "😑", "🤨"],
	"" : ["🙂", "😐"]
}
/*
	개발 Part 64 (NPC 얼굴)
	주소로 얼굴을 결정론적으로 고른다.
	랜덤을 쓰면 폴링마다 얼굴이 바뀌어
	  1) 같은 NPC 가 다른 개체처럼 보이고
	  2) Player.jsx 의 props 가 매번 달라져 불필요한 재렌더가 난다
	NPC 주소는 서버가 매치 시드로 만들므로 판 안에서 고정이다.
*/
window.NpcEmoji = function(hash, role){
	var pool = window.NpcFace[role] ? window.NpcFace[role] : window.NpcFace[""]
	if(!pool || !pool.length){
		return "🙂"
	}
	var seed = 0
	try{
		var s = String(hash ? hash : "")
		for(var i = 0; i < s.length; i++){
			seed = (seed + s.charCodeAt(i) * (i + 1)) % 100003
		}
	}catch(err){
		seed = 0
	}
	return pool[seed % pool.length]
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
/*
	개발 Part 52 (주사위 스핀 수명 관리)
	현행 문제
	  1) 툴팁은 폴링마다 템플릿에서 통째로 다시 그려진다.
	       if(before_body != after_body){ $tooltip.html(after_body) }
	     스핀 중 DOM 은 템플릿과 반드시 다르다.
	       data-playslot 속성 / style="top:..." / 클론된 7번째 li / .num 값
	     그래서 응답이 오는 즉시 <ul> 노드가 교체된다.
	     jQuery .animate() 는 떨어져 나간 옛 노드를 계속 돌리므로
	     화면에서는 애니메이션이 통째로 사라진다.
	     연타하면 클릭마다 응답이 오므로 그만큼 자주 끊긴다.
	  2) playSpin 의 재진입 가드가 무력하다.
	       if ($(this).is(':animated')) return;
	     $(this) 는 클릭할 때 새로 조회한 노드다.
	     교체된 새 노드는 애니메이션 중이 아니라 그냥 통과한다.
	  3) 정지 경로가 BoardCallback 의 dice > 0 분기 안에만 있다.
	       window.Roll.back.loopCount = 6
	     loopCount 는 플러그인이 증가시키지 않으므로
	     이 대입이 없으면 릴이 영원히 돈다.
	     서버가 굴림을 거절하면(diceBlocked) dice 가 0 이라
	     그 분기를 타지 않아 멈출 방법이 없었다.
	  4) window.Roll.back 이 전역 단일 참조다.
	     노드가 교체되면 detached 슬롯을 가리켜
	     endNum 주입이 화면에 반영되지 않는다.
	조치
	  스핀의 수명을 하나의 상태로 관리한다.
	    busy    스핀이 살아 있는가
	    at      시작 시각. 응답이 영영 안 와도 강제 종료한다
	    result  착지할 눈
	  이 상태를 툴팁 재렌더 가드와 클릭 재진입 차단에 함께 쓴다.
*/
window.DiceSpin = {
	busy : false,
	at : 0,
	result : 0,
	/*
		강제 종료 한계.
		서버 응답이 끊기거나 요청이 abort 되면 정지 신호가 오지 않는다.
		(window.Action 은 새 요청 전에 이전 xhr 를 abort 한다)
		릴이 영원히 도는 것을 막는다.
	*/
	max : 6000
}
/*
	현재 화면의 릴 노드.
	본인 툴팁을 우선 찾는다. #dice 는 본인에게만 렌더되지만
	재렌더 직후 프레임에서 중복 매칭을 피하려고 self 로 좁힌다.
*/
window.DiceSpinNode = function(){
	var $ul = $('#root player[self="true"] tooltip #dice ul')
	if(!$ul.length){
		$ul = $('#root player tooltip #dice ul')
	}
	if(!$ul.length){
		$ul = $('#dice ul')
	}
	return $ul
}
/*
	window.Roll.back 이 아직 살아 있는 노드를 가리키는지 확인한다.
	document 에서 떨어져 나갔으면 그 스핀은 이미 무효다.
*/
window.DiceSpinLive = function(){
	try{
		var slot = window.Roll ? window.Roll.back : null
		if(!slot || !slot.$el || !slot.$el.length){
			return null
		}
		var el = slot.$el[0]
		if(!el || !document.body.contains(el)){
			return null
		}
		return slot
	}catch(err){
		return null
	}
}
window.DiceSpinBusy = function(){
	if(!window.DiceSpin.busy){
		return false
	}
	if(!window.DiceSpinLive()){
		/* 노드가 이미 교체됐다면 그 스핀은 없는 것으로 본다 */
		window.DiceSpin.busy = false
		return false
	}
	if(Date.now() - window.DiceSpin.at > window.DiceSpin.max){
		window.DiceSpin.busy = false
		try{
			window.DiceSpinNode().stop(true, false).removeAttr("style")
		}catch(err){
		}
		console.log("[dice] spin timed out. releasing")
		return false
	}
	return true
}
/*
	릴을 초기 상태로 되돌린다.
	클론 정리가 필요한 이유
	  setup() 이 매번 li 를 하나 복제해 붙이고
	    $li.clone().appendTo(slot.$el)
	  endSpin() 완료 콜백에서만 제거한다.
	    slot.$el.find('li').last().remove()
	  스핀이 중간에 끊기면 클론이 남아 liCount 가 7, 8 로 늘어난다.
	  그러면 listHeight 와 finalPos 계산이 어긋나 착지 위치가 틀어진다.
*/
window.DiceSpinReset = function($ul){
	if(!$ul || !$ul.length){
		return
	}
	try{
		var $li = $ul.children("li")
		if($li.length > 6){
			$li.slice(6).remove()
		}
		$ul.stop(true, false).removeAttr("style").removeAttr("data-playslot")
	}catch(err){
	}
}
/*
	스핀 시작. 이미 돌고 있으면 false 를 돌려준다.
	호출부는 이 반환값으로 요청 전송 여부를 정한다.
*/
window.DiceSpinStart = function(){
	if(window.DiceSpinBusy()){
		return false
	}
	var $ul = window.DiceSpinNode()
	if(!$ul.length){
		return false
	}
	window.DiceSpinReset($ul)
	window.DiceSpin.busy = true
	window.DiceSpin.at = Date.now()
	window.DiceSpin.result = 0
	$ul.playSpin({
		onFinish : function(){
			/*
				착지 완료.
				여기서 style 을 지워 릴을 감추고 .num 으로 넘긴다.
				CSS 가 ul[style] 유무로 릴과 .num 을 맞바꾸므로
				이 순서를 지켜야 깜빡이지 않는다.
				  body[edge="true"] ... ul[style]{opacity: 1}
				  body[edge="true"] ... ul[style]+.num{opacity: 0}
				현행은 이 정리를 스핀이 도는 도중에 했다.
			*/
			window.DiceSpin.busy = false
			try{
				window.DiceSpinNode().removeAttr("style")
				$('#root player tooltip #dice .num').text(window.DiceSpin.result)
			}catch(err){
			}
		}
	})
	return true
}
/*
	착지 지시.
	loopCount 를 loops 까지 올리면 다음 루프 끝에서 endSpin 으로 넘어간다.
	busy 는 여기서 내리지 않는다.
	  착지 애니메이션이 500ms 더 남아 있고,
	  그 동안 툴팁이 재렌더되면 착지가 다시 끊긴다.
	  onFinish 가 내린다.
*/
window.DiceSpinStop = function(dice){
	var slot = window.DiceSpinLive()
	if(!slot){
		window.DiceSpin.busy = false
		return false
	}
	var n = Math.ceil(Math.sqrt(Math.pow(dice * 1, 2)))
	if(isNaN(n) || n < 0){
		n = 0
	}
	if(n > 6){
		n = 6
	}
	window.DiceSpin.result = n
	/* endNum 0 이면 slotMachine 이 무작위 눈으로 착지한다 */
	slot.options.endNum = n
	slot.loopCount = slot.options.loops
	return true
}
/*
	응답이 도착했을 때 호출한다.
	250ms 유예를 두는 이유
	  굴림 요청을 보내기 직전에 이미 나가 있던 폴링 응답이
	  먼저 도착해 방금 시작한 스핀을 즉시 멈추는 경우가 있다.
	  그 창을 넘긴 응답만 정지 신호로 받아들인다.
	dice 가 0 이어도 멈춘다.
	  서버가 거절(diceBlocked)했거나 굴릴 수 없는 상태다.
	  현행은 이 경로가 없어 릴이 계속 돌았다.
*/
window.DiceSpinSync = function(dice){
	if(!window.DiceSpin.busy){
		return false
	}
	if(Date.now() - window.DiceSpin.at < 250){
		return false
	}
	return window.DiceSpinStop(dice)
}

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
		if(!player){
			return
		}
		var cookies = window.cookies
		if(window.SwapPending){
			if(Date.now() - window.SwapPending.at < 12000){
				return
			}
			delete window.SwapPending
		}
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
		var _swapNonces = window.Nonces ? window.Nonces() : ""
		if(_swapNonces){
			body.nonces = _swapNonces
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
		var picked = []
		var $assets = $('#pool li')
		$assets.each(function(index, el){
			var $el = $(el)
			var asset = {
				emoji : $el.attr("emoji"),
				count : $el.attr("cnt"),
				type : $el.attr("type")
			}
			if(asset.type !== "buy" && asset.type !== "sell"){
				return
			}
			if(!typeof_item(asset.emoji)){
				return
			}
			asset.address = ethers.hashMessage(asset.emoji)
			asset.address = ethers.computeAddress(asset.address).toLowerCase()
			query.assets.push(asset.address)
			if(asset.type == "sell"){
				body.assets.push(asset.address.toUpperCase())
			}else{
				body.assets.push(asset.address)
			}
			picked.push(asset.type + ":" + asset.emoji)
		})
		if(!body.assets.length){
			window.Notice("NOTHING PICKED", "Choose buy or sell first", 2200)
			return
		}
		window.SwapPending = {
			at : Date.now(),
			count : body.assets.length,
			stage : "stage",
			picked : picked,
			query : query,
			url : url,
			emoji : player.emoji
		}
		window.SwapPending.timer = setTimeout(function(){
			if(window.SwapPending){
				console.log("[swap] watchdog released")
				window.SwapRelease()
			}
		}, 12000)
		console.log("[swap] staging :: " + picked.join(", "))
		$swap.addClass("loading")
		if(window.StatusLoading){
			window.StatusLoading()
		}
		OAuth3.xhr = OAuth3.fetch({
			method : "POST",
			url : url,
			body : body,
			query : query
		}, window.Callback);
	}
	window.SwapPending = null
	window.SwapCommit = function(){
		var p = window.SwapPending
		if(!p || p.stage !== "commit"){
			return false
		}
		var _n = window.Nonces ? window.Nonces() : ""
		if(!_n){
			return false
		}
		if(p.sent){
			return false
		}
		p.sent = true
		var body = {
			emoji : p.emoji ? p.emoji : window.emojis.self,
			nonces : _n
		}
		console.log("[swap] committing :: " + p.picked.join(", "))
		if(window.StatusLoading){
			window.StatusLoading()
		}
		if(OAuth3.xhr){
			OAuth3.xhr.abort()
			delete OAuth3.xhr
		}
		OAuth3.xhr = OAuth3.fetch({
			method : "POST",
			url : p.url,
			body : body,
			query : p.query
		}, window.Callback)
		return true
	}
	window.SwapSettled = function(rows){
		var p = window.SwapPending
		if(!p){
			return false
		}
		if(Date.now() - p.at > 12000){
			console.log("[swap] timed out. releasing")
			window.SwapRelease()
			return true
		}
		var traded = false
		if(rows && rows.length){
			for(var i = 0; i < rows.length; i++){
				if(rows[i] && rows[i].__kind === "trade"){
					traded = true
					break
				}
			}
		}
		if(!traded){
			try{
				if(window.cookies && window.cookies.swapTraded){
					var _st = window.cookies.swapTraded * 1
					if(!isNaN(_st) && _st > 0){
						traded = true
					}
				}
			}catch(err){
			}
		}
		if(traded){
			if(window.SwapClearPick){
				window.SwapClearPick()
			}
			window.SwapRelease()
			return true
		}
		try{
			if(window.cookies && window.cookies.swapError){
				if(window.SwapClearPick){
					window.SwapClearPick()
				}
				window.SwapRelease()
				return true
			}
		}catch(err){
		}
		if(p.stage === "stage"){
			var staged = false
			if(rows && rows.length){
				for(var s = 0; s < rows.length; s++){
					if(rows[s] && rows[s].__intent === "trade"){
						staged = true
						break
					}
				}
			}
			if(staged){
				p.stage = "commit"
				p.sent = false
				if(window.StatusLoading){
					window.StatusLoading()
				}
			}
		}
		return false
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
		/*
			개발 Part 67 (커밋 보존)
			현행 문제
			  Action 은 진행 중인 폴링을 abort 하면서 nonce 를 싣지 않았다.
			  그 폴링이 주사위 커밋을 나르던 요청이면
			  커밋 기회가 통째로 사라지고 앵커가 옛 칸에 굳는다.
			  (equip / craft / consume / property / auction / exit / deposit 전부 해당)
			조치
			  BoardPoll 과 동일하게 미정산 nonce 를 함께 보낸다.
			  이 요청이 폴링을 대신해 정산까지 마친다.
		*/
		if(!body.nonces){
			var _an = window.Nonces ? window.Nonces() : ""
			if(_an){
				body.nonces = _an
			}
		}
		OAuth3.xhr = OAuth3.fetch({
			method : "POST",
			url : url,
			body : body,
			query : query
		}, window.Callback);
	}
	window.StatusEl = function(){
		try{
			return document.querySelector(".aside .status")
		}catch(err){
			return null
		}
	}
	window.StatusLoading = function(){
		var el = window.StatusEl()
		if(!el){
			return false
		}
		if(el.querySelector(".loading")){
			return true
		}
		el.innerHTML = `<div class="loading">
			<strong>Loading...</strong>
		</div>`
		return true
	}
	window.StatusSync = function(cookies){
		var el = window.StatusEl()
		if(!el){
			return false
		}
		if(window.SwapPending){
			return window.StatusLoading()
		}
		var c = cookies ? cookies : window.cookies
		if(c && c.email){
			if(el.innerHTML !== ""){
				el.innerHTML = ""
			}
		}else{
			var _login = '<a href="/login/">Sign In</a>'
			if(el.innerHTML !== _login){
				el.innerHTML = _login
			}
		}
		return true
	}
	window.SwapRelease = function(){
		try{
			if(window.SwapPending && window.SwapPending.timer){
				clearTimeout(window.SwapPending.timer)
			}
		}catch(err){
		}
		delete window.SwapPending
		try{
			$("#swap").removeClass("loading")
		}catch(err){
		}
		if(window.StatusSync){
			window.StatusSync()
		}
		return true
	}
	window.SwapClearPick = function(){
		try{
			$('#pool li.item').removeAttr("type")
			$("#swap .submit input").val("")
			$("body").attr("swap", "")
		}catch(err){
		}
		return true
	}
	window.SwapOpen = function(){
		try{
			return typeof $("body").attr("swap") !== "undefined"
		}catch(err){
			return false
		}
	}
	window.SwapRender = function(stock, settled){
		var cookies = window.cookies
		var $pool = $("#pool ul")
		if(!cookies || !$pool.length){
			return 0
		}
		var $picked = $('.emoji_asset[type="item"].on')
		if(!$picked.length){
			$pool.html("")
			$("#swap .submit input").val("")
			if(typeof $("body").attr("swap") !== "undefined" && !window.SwapPending){
				$("body").removeAttr("swap")
				if(window.StatusSync){
					window.StatusSync()
				}
				delete window.SwapIntent
			}
			return 0
		}
		var body = ""
		var count = 0
		$picked.each(function(index, el){
			var $el = $(el)
			var emoji = $el.attr("emoji")
			if(!emoji){
				return
			}
			if(!window.typeof_item(emoji)){
				return
			}
			var cnt = $el.attr("cnt") ? $el.attr("cnt") * 1 : 0
			if(stock && stock.map && stock.map[emoji]){
				cnt = stock.map[emoji].count
			}
			if(isNaN(cnt) || cnt < 1){
				return
			}
			var address = ""
			try{
				address = ethers.hashMessage(emoji)
				address = ethers.computeAddress(address).toLowerCase()
			}catch(err){
				return
			}
			var $prev = $("#" + address)
			var type = ""
			if(!settled && $prev.length){
				type = $prev.attr("type")
			}
			if(!type || type === "undefined"){
				type = ""
			}
			if(type !== "buy" && type !== "sell"){
				type = ""
			}
			var balance = "-"
			var amm = cookies[address]
			if(amm){
				balance = amm.x - amm.y
			}else if($prev.length){
				var _pb = $prev.find(".col.y .amount span").text()
				if(_pb && !isNaN(_pb * 1)){
					balance = _pb * 1
				}
			}
			count++
			body += `<li class="item" type="${type}" cnt="${cnt}" emoji="${emoji}" id="${address}">
				<div class="asset">
					<div class="col x buy">
						<div class="icon">
							<div class="emoji color">${emoji}</div>
						</div>
						<div class="amount">
							<span>${cnt}</span>
						</div>
					</div>
				</div>
				<div class="asset">
					<div class="col y sell transaction">
						<div class="icon">
							<div class="emoji color">🪙</div>
						</div>
						<div class="amount">
							<span>${balance}</span>
						</div>
					</div>
				</div>
			</li>`
		})
		if(!count){
			$pool.html("")
			$("#swap .submit input").val("")
			return 0
		}
		var before_body = $pool.html()
		if(before_body){
			before_body = before_body.replace(/\t/gi,"").replace(/\n/gi,"").trim()
		}
		var after_body = body.replace(/\t/gi,"").replace(/\n/gi,"").trim()
		if(before_body !== after_body){
			$pool.html(after_body)
		}
		if(settled){
			$pool.find("li.item").removeAttr("type")
			$("#swap .submit input").val("")
		}
		if(window.SwapTotal){
			window.SwapTotal()
		}
		return count
	}
	window.SwapTotal = function(){
		var cookies = window.cookies
		var $pool = $("#pool ul")
		var $submit = $("#swap .submit input")
		if(!cookies || !$submit.length){
			return 0
		}
		if(!window.SwapOpen()){
			return 0
		}
		var total = 0
		var picked = 0
		var $assets = $('#pool li')
		if($assets.length){
			$assets.each(function(index, el){
				var $el = $(el)
				var asset = {
					emoji : $el.attr("emoji"),
					type : $el.attr("type")
				}
				if(!asset.emoji){
					return
				}
				if(asset.type !== "buy" && asset.type !== "sell"){
					return
				}
				var address = ""
				try{
					address = ethers.hashMessage(asset.emoji)
					address = ethers.computeAddress(address).toLowerCase()
				}catch(err){
					return
				}
				var amm = cookies[address]
				if(!amm){
					return
				}
				var balance = amm.x - amm.y
				if(isNaN(balance)){
					return
				}
				picked++
				if(asset.type === "sell"){
					total += balance
				}else{
					total -= balance
				}
			})
		}
		if(!picked){
			$submit.val("")
			return 0
		}
		var _total = Math.sqrt(Math.pow(total, 2))
		$submit.val(cookies.balance + ( total >= 0 ? ` + ${_total}` : ` - ${_total}` ) + ` = ${cookies.balance + total}` )
		return total
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
			/*
				개발 Part 73 (백그라운드 캐치업)
				따라잡기 상태도 함께 비운다.
				정리 지점이 흩어지면 한 곳만 빠져도
				다음 굴림이 이전 상태를 물려받는다.
			*/
			window.Roll.catchup = 0
			window.Roll.at = 0
		}
		window.Roll = function(biomes){
			try{
				var dice = window.cookies.dice * 1
				/*
					개발 Part 73 (백그라운드 캐치업)
					현행 문제
					  이 함수는 호출 1회당 정확히 한 칸만 전진한다.
					  전제는 "500ms 마다 호출된다" 인데
					  백그라운드 탭에서는 브라우저가 타이머를 클램프해
					  1초, 몇 초 간격으로 늘어난다.
					  그래서 탭을 벗어난 동안 진행이 사실상 멈추고,
					  돌아오면 남은 칸을 다시 걷기 시작한다.
					  그 사이 폴링이 나가면 중간 좌표가 서버에 올라가
					  클레임이 거절되고 앵커로 되돌아간다.
					조치
					  마지막 호출 시각을 기억해 밀린 만큼 따라잡는다.
					  500ms 마다 한 칸이므로
					    경과 1200ms  ->  2칸
					    경과 3000ms  ->  6칸(남은 만큼만)
					  캐치업 중에는 소리와 시야 갱신을 건너뛴다.
					  발소리가 한꺼번에 겹치면 클리핑이 나고,
					  FieldView 를 칸마다 부르면 프레임이 튄다.
					  마지막 칸에서만 정상 처리한다.
					상한
					  한 번에 6칸을 넘지 않는다. 주사위 최댓값이 6이다.
				*/
				var _now = Date.now()
				var _catch = 0
				try{
					if(window.Roll.at){
						var _gap = _now - window.Roll.at
						if(_gap > 900){
							_catch = Math.floor(_gap / 500) - 1
							if(_catch < 0){
								_catch = 0
							}
							if(_catch > 6){
								_catch = 6
							}
						}
					}
				}catch(err){
					_catch = 0
				}
				window.Roll.at = _now
				if(_catch > 0 && dice > 1){
					var _steps = _catch
					if(_steps > (dice - 1)){
						_steps = dice - 1
					}
					if(_steps > 0){
						console.log("[dice] catching up " + _steps + " step(s) after background")
						window.Roll.catchup = _steps
					}
				}
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

							/*
								개발 Part 63 (표시 높이 통일)
								주사위 이동 중에는 커서도 플레이어를 따라간다.
								다만 두 판이 겹치지 않도록 띄움 값을 나눈다.
								0.01 하나로 통일하면 커서가 current 에 묻혀 보이지 않는다.
							*/
							var _rTile = window.TileLift ? window.TileLift * 1 : 0.02
							var _rCur = window.CursorLift ? window.CursorLift * 1 : 0.06
							if(isNaN(_rTile)){ _rTile = 0.02 }
							if(isNaN(_rCur)){ _rCur = 0.06 }
							window.current.current.position.x = window.cursor.current.position.x = biomes.x = _next.x
							window.current.current.position.y = biomes.y = _ny + _rTile
							window.cursor.current.position.y = _ny + _rCur
							window.current.current.position.z = window.cursor.current.position.z = biomes.z = _next.z

							var _selfHash = window.cookies.address ? window.cookies.address : window.cookies.hash
							if(window[_selfHash] && window[_selfHash].position){
								window[_selfHash].position.x = _next.x
								window[_selfHash].position.y = _ny + 0.5
								window[_selfHash].position.z = _next.z
							}
						}

						/*
							개발 Part 43 (효과음)
							한 칸 전진할 때마다 발소리를 낸다.
							_next 가 없으면(경로 끝 / 스냅샷 실패) 소리도 내지 않는다.
							Roll 은 500ms 간격이라 겹치지 않는다.
							개발 Part 73 (백그라운드 캐치업)
							  밀린 칸을 따라잡는 중에는 소리를 내지 않는다.
							  한꺼번에 겹치면 클리핑이 나고,
							  Sfx.limit(10) 을 넘으면 그 뒤 소리가 통째로 막힌다.
						*/
						if(_next && window.Sfx && !window.Roll.catchup){
							window.Sfx.play("step")
						}
						/*
							개발 Part 47 (전장의 안개 / 이동 궤적)
							한 칸 전진할 때마다
							  1) 밟은 칸을 궤적에 기록한다
							  2) 새 좌표 기준으로 시야를 다시 만든다
							_next 가 없으면(경로 끝 / 스냅샷 실패) 좌표가 안 바뀌었으므로
							아무것도 하지 않는다.
						*/
						if(_next){
							try{
								if(!window.Roll.trail){
									window.Roll.trail = {}
								}
								window.Roll.trail[_next.x + ":" + _next.z] = true
								window.Roll.trailMatch = window.cookies.match
							}catch(err){
							}
							/*
								개발 Part 73 (백그라운드 캐치업)
								따라잡는 중에는 시야 / 툴팁 갱신을 건너뛴다.
								  FieldView   assets.set 을 부르므로 R3F 리렌더가 난다
								  TileSync    DOM 을 만진다
								칸마다 부르면 복귀 프레임에 한꺼번에 몰려 화면이 멈춘다.
								마지막 칸에서 한 번만 하면 결과는 같다.
							*/
							if(!window.Roll.catchup){
								try{
									if(window.FieldView){
										window.FieldView(_next.x, _next.z)
									}
								}catch(err){
								}
								/*
									개발 Part 67 (좌표 즉시 반영)
									현행은 여기서 메시 좌표만 옮기고 화면 상태를 갱신하지 않았다.
									굴리는 동안 폴링이 멈춰 있으므로
									  4칸 이동(약 2초) + 폴링 주기 + RTT
									동안 출발 칸 기준 툴팁과 body 속성이 그대로 남았다.
									한 칸마다 맞춰 준다.
								*/
								try{
									if(window.TileSync){
										window.TileSync()
									}
								}catch(err){
								}
							}
						}
						window.cookies.dice = dice - 1
						/*
							개발 Part 73 (백그라운드 캐치업)
							따라잡을 칸이 남았으면 다음 인터벌을 기다리지 않고
							그 자리에서 이어서 전진한다.
							재귀가 아니라 반복 호출이므로 스택이 쌓이지 않는다.
							dice 는 방금 1 줄었으므로 종료 조건이 반드시 성립한다.
						*/
						if(window.Roll.catchup > 0){
							window.Roll.catchup--
							if(window.cookies.dice > 0){
								return window.Roll(biomes)
							}
						}
						window.Roll.catchup = 0
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
					/*
						개발 Part 73 (백그라운드 캐치업)
						따라잡기 상태를 비운다.
						남겨두면 다음 굴림의 첫 칸이 소리 없이 지나간다.
					*/
					window.Roll.catchup = 0
					window.Roll.at = 0
					window.setFrameloop("always")
					/*
						개발 Part 73 (캐치업 종료 시 시야 복구)
						따라잡는 동안 FieldView 를 건너뛰었으므로
						도착 칸 기준으로 한 번 다시 만든다.
						건너뛴 적이 없어도 같은 서명이면 내부에서 조기 반환한다.
					*/
					try{
						if(window.FieldView && window.current){
							window.FieldView(
								window.current.current.position.x,
								window.current.current.position.z
							)
						}
					}catch(err){
					}
					/*
						개발 Part 67 (좌표 즉시 반영)
						도착 직후 상태를 맞춘다.
						  dice 가 0 이 되었으므로 CanDiceNow / DiceHome 판정이 바뀐다
						  도착 칸이 게이트면 슬롯이 🚪 로 바뀌어야 한다
						서버 커밋 응답까지 기다리면 최대 한 왕복이 비어 보인다.
						DiceHome 은 미정산 nonce 가 있는 동안 null 을 돌려주므로
						여기서 📍 가 잘못 켜지지 않는다.
					*/
					try{
						if(window.TileSync){
							window.TileSync()
						}
					}catch(err){
					}
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
			var cookies = window.CookiesParse(resp.body.cookies)
			if(!cookies){
				console.log("[board] callback skipped :: cookies unreadable")
				return
			}
			window.cookies = cookies
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
						cookies.axis = [axis.x, axis.y + 1, axis.z].toString()
					}
					if(window.current){
						var _cur = window.current.current.position
						var _cur_biome = window.map.biomes[`${_cur.x}:${_cur.z}`]
						if(_cur_biome && _cur_biome.water){
							_cur_biome = null
						}
						var _teleport = ""
						try{
							/*
								개발 Part 66 (도착 좌표 확정)
								현행 문제
								  주사위 커밋 응답에는 서버가 확정한 도착 칸이
								    cookies.arrive / cookies.arriveBy / cookies.axis
								  로 실려 온다. 그런데 이 블록은 arrive 를 보지 않아
								  클라이언트가 자기 좌표(_cur)를 그대로 유지했다.
								  서버가 클레임을 거절하고 경로 주행(arriveBy="path")이나
								  링 인덱스(arriveBy="ring")로 도착을 정한 경우
								  화면 위치와 서버 앵커가 갈린다.
								  그 결과 DiceHome() 이 참이 되어 📍 가 뜨고
								  누르면 서버 앵커로 걸어 돌아간다.
								조치
								  커밋이 일어난 프레임에서는 서버 도착을 최종으로 채택한다.
								  arrive 는 브라우저 쿠키로 직렬화되지 않으므로
								  커밋 응답 한 번에만 실린다. 매 폴링마다 튀지 않는다.
								  클레임이 받아들여진 정상 경우에는 _cur 과 axis 가 같아
								  아래 비교에서 _teleport 가 스스로 해제된다.
							*/
							if(cookies.spawned || cookies.edgeBlocked || cookies.matchRolled || cookies.anchorReturn || cookies.arrive || cookies.recovered){
								/*
									개발 Part 74 (서버 교정 채택)
									현행 문제
									  개발 Part 72 가 서버에 "off-ring 복구" 를 넣고
									  cookies.recovered 로 알리기까지 했는데,
									  이 스냅 조건 목록에는 recovered 를 넣지 않았다.
									  그래서 서버는 좌표를 링으로 되돌리고 앵커도 그 칸으로
									  확정했는데, 클라이언트는 옛 좌표에 그대로 서 있었다.
									  화면 좌표 != 앵커 이므로 DiceHome() 이 참이 되고
									  📍 가 뜬다. 눌러야만 좌표가 맞춰지는 상태였다.
									조치
									  서버가 좌표를 교정한 응답은 무조건 따라간다.
									  recovered 는 브라우저 쿠키로 직렬화되지 않으므로
									  교정이 일어난 응답 한 번에만 실린다.
								*/
								_teleport = cookies.matchRolled ? "match"
									: (cookies.spawned ? "spawn"
									: (cookies.anchorReturn ? "anchor"
									: (cookies.recovered ? "recover"
									: (cookies.edgeBlocked ? "edge" : "arrive"))))
								if(_cur.x === axis.x && _cur.z === axis.z){
									/* 이미 같은 칸이면 스냅이 필요 없다 */
									_teleport = ""
								}else{
									if(_teleport === "arrive"){
										console.log("[board] arrival adopted :: client " +
											_cur.x + "," + _cur.z +
											" -> server " + axis.x + "," + axis.z +
											" by=" + (cookies.arriveBy ? cookies.arriveBy : ""))
									}
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

					var swapSettled = false
					try{
						swapSettled = window.SwapSettled ? window.SwapSettled(rows) : false
					}catch(err){
						swapSettled = false
					}
					if(swapSettled){
						try{
							var _sold = 0
							var _gain = 0
							for(var _tr = 0; _tr < rows.length; _tr++){
								var _trow = rows[_tr]
								if(!_trow || _trow.__kind !== "trade"){
									continue
								}
								_sold++
								var _tp = _trow.__price ? _trow.__price * 1 : 0
								if(isNaN(_tp)){
									_tp = 0
								}
								if(_trow.Subject === "#sell"){
									_gain += _tp
								}else{
									_gain -= _tp
								}
							}
							if(window.SwapClearPick && window.SwapOpen && window.SwapOpen()){
								window.SwapClearPick()
							}
							if(_sold){
								console.log("[swap] settled :: " + _sold + " item(s), " +
									(_gain >= 0 ? "+" : "") + _gain)
								window.Notice("TRADE DONE",
									_sold + " item(s) traded. " +
									(_gain >= 0 ? "+" : "") + _gain + " 🪙", 2600)
								try{
									if(window.Sfx){
										window.Sfx.play("coin")
									}
								}catch(err){
								}
							}
						}catch(err){
						}
					}
					var uri = new URL(url.href)
					var balanceAddress = ethers.computeAddress(ethers.hashMessage(uri.host)).toLowerCase()
					var _swapBusy = false
					try{
						_swapBusy = (window.SwapPending && window.SwapPending.stage === "commit" && !window.SwapPending.sent)
							? true : false
					}catch(err){
						_swapBusy = false
					}
					if(_swapBusy){
						$swap.addClass("loading")
					}else{
						$swap.removeClass("loading")
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
					try{
						var $balSlot = $('#root player[self="true"] tooltip a.hashType.Balance .cnt')
						if($balSlot.length){
							var _bsv = cookies.balance ? cookies.balance * 1 : 0
							if(isNaN(_bsv)){
								_bsv = 0
							}
							var _bst = nFormatter(_bsv, 1)
							if($balSlot.text() !== _bst){
								$balSlot.text(_bst)
							}
						}
					}catch(err){
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
							if(isNaN(row.dice)){
								row.dice = 0
							}
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
								if(row.Subject == "#nonce"){
									if(_nonce && OAuth3.nonces.indexOf(_nonce) == -1){
										OAuth3.nonces.push(_nonce)
									}
								}else if(progress.nonce != _nonce && _nonce.indexOf(cc_address) == -1 && ((!row.Flag && window.Biomes[hashtag]) || row.Flag && !window.Biomes[hashtag]) ){
									var _index = OAuth3.nonces.indexOf(_nonce)
									if(_index > -1){
										OAuth3.nonces.splice(_index, 1)
									}
								}
							}catch(err){
							}

							if(window.Biomes[hashtag] && b){
								var _decoId = row.Id
								try{
									_decoId = crc32(cc_address + hashtag + row.x + row.z)
										.toString(32).toUpperCase()
								}catch(err){
									_decoId = row.Id
								}
								if(row.Flag && hashtag != "#dice"){
									delete window.map.biomes[_decoId]
									
									var $clipped = $(`.clipped .emoji[x="${row.x}"][z="${row.z}"]`)
									if($clipped.length && !window.bingo[row.Id]){
										window.bingo[row.Id] = true
										if(b){
											bingo_body += $clipped.closest('[style*="transform-origin"]')[0].outerHTML
										}
									}
								}else{
									var _asset = {
										id : _decoId,
										hash : cc_address,
										name : hashtag,
										value : "",
										color: "",
										x : row.x,
										y : y,
										z : row.z,
										emoji : row.emoji ? row.emoji : ""
									}
									if(window.map.nonces[_decoId]){
										delete window.map.nonces[_decoId]
									}
									window.map.biomes[_decoId] = _asset
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
										var _npcRole = window.NpcRole ? window.NpcRole(hashtag) : ""
										if(_npcRole){
											player.npc = _npcRole
											player.emoji = window.NpcEmoji
												? window.NpcEmoji(_from, _npcRole)
												: player.emoji
										}
									}

									if(!row.Flag){
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
													role : player.npc
														? player.npc
														: window.typeof_role(player.emoji, player.self ? cookies.role : ""),
													npc : player.npc ? true : false
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
										propertyField.property.ownerId = typeof row.__ownerId != "undefined"
											? row.__ownerId : propertyField.property.ownerId
										propertyField.property.toll = typeof row.__toll != "undefined"
											? row.__toll
											: (propertyField.property.tollTable ? propertyField.property.tollTable[row.dice] : 0)
									}
									if(typeof row.__nation != "undefined"){
										propertyField.property.nation = row.__nation ? true : false
									}
									if(typeof row.__treasury != "undefined"){
										propertyField.property.treasury = row.__treasury * 1
										if(isNaN(propertyField.property.treasury)){
											propertyField.property.treasury = 0
										}
									}
									if(propertyField.property.nation){
										propertyField.property.ownerId = null
										propertyField.property.owner = NATION
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
						try{
							if(window.EdgeSelf && window.EdgeSelf()){
								$body.attr("edge", "true")
							}else{
								$body.removeAttr("edge")
							}
						}catch(err){
							$body.removeAttr("edge")
						}
						try{
							if(window.CanDiceNow && window.CanDiceNow()){
								$body.attr("diceable", "true")
							}else{
								$body.removeAttr("diceable")
							}
							if(window.RingSync){
								window.RingSync()
							}
							if(window.DiceHome && window.DiceHome()){
								$body.attr("dicehome", "true")
							}else{
								$body.removeAttr("dicehome")
							}
							if(window.EdgeReady && window.EdgeReady() &&
								!(window.EdgeSelf && window.EdgeSelf()) &&
								!(window.RingAnchor && window.RingAnchor()) &&
								!cookies.enter){
								if(!window.BoardCallback.offRingWarned){
									window.BoardCallback.offRingWarned = true
									console.log("[board] off-ring while board mode :: " +
										x + "," + z +
										" ring=" + (window.fields ? window.fields.length : 0) +
										" match=" + cookies.match)
								}
							}
						}catch(err){
							$body.removeAttr("diceable")
						}

						var type = window.typeof_emoji(self_player.emoji)

						if(type == "emoji"){
							$body.attr("emoji",self_player.emoji)
						}
						try{
							if(!window.map.bombMarks){
								window.map.bombMarks = []
							}
							for(var _bm = 0; _bm < window.map.bombMarks.length; _bm++){
								var _bk = window.map.bombMarks[_bm]
								if(window.map.biomes[_bk]){
									delete window.map.biomes[_bk].bomb
								}
							}
							window.map.bombMarks = []
							if(bombs.length){
								for(var i = 0; i < bombs.length; i++){
									var bomb = bombs[i]
									if(!bomb){
										continue
									}
									/* 이미 해소된 폭탄은 칠하지 않는다 */
									if(bomb.Flag){
										continue
									}
									for(var _x = -2; _x < 3; _x++){
										for(var _z = -2; _z < 3; _z++){
											var _key = (bomb.x + _x) + ":" + (bomb.z + _z)
											if(!window.map.biomes[_key]){
												continue
											}
											window.map.biomes[_key].bomb = true
											window.map.bombMarks.push(_key)
										}
									}
								}
							}
						}catch(err){
							console.log("[board] bomb mark err", err)
						}
						var _trail = window.TrailMap ? window.TrailMap() : {}
						var _seen = {}
						var _trailPaint = function(bx, bz){
							if(!progress[bx + ":" + bz] && !_trail[bx + ":" + bz]){
								return false
							}
							try{
								if(window.ReservedTile && window.ReservedTile(bx, bz)){
									return false
								}
							}catch(err){
							}
							return true
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
								if(_trailPaint(b.x, b.z)){
									color = "black"
								}
								_seen[b.x + ":" + b.z] = true
								var _ownSig = ""
								try{
									var _of = window.fields ? window.fields[b.x + ":" + b.z] : null
									if(_of && _of.property &&
										((_of.property.level * 1) > 0 || _of.property.ownerId)){
										var _oh = window.TileOwner ? window.TileOwner(_of) : ""
										_ownSig = (_of.property.level * 1) + ":" +
											(_of.property.nation ? "n" : (_oh ? _oh.substr(0, 8) : ""))
									}
								}catch(err){
									_ownSig = ""
								}
								var _decoSig = ""
								try{
									var _dm = window.map.biomes[_id]
									if(_dm && _dm.name && !_dm.biome){
										_decoSig = _dm.emoji ? _dm.emoji : "1"
									}
								}catch(err){
									_decoSig = ""
								}
								_assets.push({
									id : _id,
									hash : cc_address,
									name : "#"+b.biome,
									value : color,
									color: color,
									own : _ownSig,
									deco : _decoSig,
									x : b.x,
									y : b.y - (b.water ? 0.8 : 0.5),
									z : b.z
								})	
							}
						})
					}

					if(plant){
						_players.push(plant)
					}
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
						var itemStock = window.ItemStock
							? window.ItemStock(rows, player_hash)
							: { order : [], map : {}, total : 0 }
						window.ItemStockLast = itemStock
						if(window.ItemDeckBody){
							var _deckOut = window.ItemDeckBody(itemStock, window.sticker)
							after_body = _deckOut.body
							afterSticker = _deckOut.fresh
						}
						$('[id="'+player_hash+'"] items ul').html(after_body)
						var $itemsDeck = window.ItemsDeck
							? window.ItemsDeck()
							: $("emojis .items").not(".emoji_asset")
						var before_body = $itemsDeck.html()
						if(before_body){
							before_body = before_body.replace(/\t/gi,"").replace(/\n/gi,"").trim()
						}
						after_body = after_body.replace(/\t/gi,"").replace(/\n/gi,"").trim()
						if(before_body != after_body){
							$itemsDeck.html(after_body)
						}
						try{
							$('.emoji[type="sticker"] cnt').text(itemStock.order.length)
						}catch(err){
						}
						if(window.ItemStockSync){
							var _dropped = window.ItemStockSync(itemStock)
							if(_dropped){
								console.log("[deck] " + _dropped + " sold-out item(s) unselected")
							}
						}
						try{
							if(window.SwapRender && window.SwapOpen && window.SwapOpen()){
								var _poolSettled = swapSettled
								if(!_poolSettled && cookies.swapTraded){
									var _pt = cookies.swapTraded * 1
									if(!isNaN(_pt) && _pt > 0){
										_poolSettled = true
									}
								}
								window.SwapRender(itemStock, _poolSettled)
							}
						}catch(err){
							console.log("[swap] pool render err", err)
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
									}else if(player_hash.indexOf(_player_hash) > -1){
										var _maxHp = window.MaxHp[cookies.role ? cookies.role : ""]
										var _hp = typeof cookies.hp != "undefined" ? cookies.hp : _maxHp
										if(window.HpBadge){
											window.HpBadge(_hp, _maxHp)
										}
										/*
											개발 Part 67 (툴팁 첫 슬롯)
											여기 있던 조립을 window.SlotBody 로 옮긴다.
											같은 조립이 두 벌이면
											  BoardCallback  서버 응답 때만
											  TileSync       좌표가 바뀔 때마다
											두 경로의 결과가 갈려 슬롯이 깜빡인다.
											판정 근거(fields / ExitZone / cookies.tile)는 동일하므로
											한 함수로 합쳐도 결과가 바뀌지 않는다.
											깃발 수(cnt)는 이 응답의 flags 집계를 그대로 넘긴다.
										*/
										var _slotBody = window.SlotBody({ fireCount : cnt })
										/*
											개발 Part 75 (두 번째 슬롯 분리)
											개발 Part 74 는 Meta 템플릿을 그대로 두고
											<i> 안에만 이모지를 넣었다.
											그 노드는 링 위 전용 스타일이라 내륙에서 감춰진다.
											이제 MetaBody 가 슬롯 마크업 전체를 만든다.
											  링 위    Meta + #dice
											  링 밖    Bomb
											TileSync 도 같은 함수를 쓰므로 결과가 갈리지 않는다.
											dice 를 넘기는 이유
											  이 응답의 확정 눈을 .num 에 반영해야 한다.
											  넘기지 않으면 MetaBody 가 현재 DOM 값을 유지한다.
										*/
										var _metaBody = window.MetaBody
											? window.MetaBody({ dice : dice })
											: ""
										tooltip_body = `<li>
											${_slotBody}
										</li>
										<li>
											${_metaBody}
										</li>
										<li>
											<a class="hashType Balance emoji color"><i class="emoji color"></i><span class="cnt">${nFormatter(cookies.balance,1)}</span></a>
										</li>`
									}else{
										var typeDice = false
										if(_players[_player_hash]){
											typeDice = _players[_player_hash].dice
										}
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
									var _spinning = false
									try{
										_spinning = (window.DiceSpinBusy && window.DiceSpinBusy() &&
											$tooltip.find("#dice ul").length) ? true : false
									}catch(err){
										_spinning = false
									}
									var before_body = $tooltip.html()
									if(before_body){
										before_body = before_body.replace(/\t/gi,"").replace(/\n/gi,"").trim()
									}
									var after_body = tooltip_body.replace(/\t/gi,"").replace(/\n/gi,"").trim()
									if(!_spinning && before_body != after_body){
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

					if(window.StatusSync){
						window.StatusSync(cookies)
					}else if(cookies.email){
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

					/*
						개발 Part 43 (효과음)
						서버가 내려준 결과 신호를 소리로 바꾼다.
						Notice 보다 먼저 부르는 이유
						  Notice 는 2 초 넘게 떠 있지만 소리는 즉발이다.
						  화면보다 소리가 먼저 나야 반응이 빨라 보인다.
						SfxSync 내부에서 서명 비교로 중복을 막으므로
						폴링마다 불러도 같은 소리가 반복되지 않는다.
					*/
					try{
						if(window.SfxSync){
							window.SfxSync(cookies)
						}
					}catch(err){
					}
					try{
						if(cookies.treasuryLoot){
							window.Notice("TREASURY RAID",
								"Looted " + cookies.treasuryLoot + " 🪙 from the state", 2600)
						}else if(cookies.tollNation){
							window.Notice("STATE TOLL",
								"Paid " + cookies.tollPaid + " 🪙 into the treasury", 2400)
						}else if(cookies.tollPaid){
							window.Notice("TOLL", "Paid " + cookies.tollPaid + " 🪙", 2200)
						}else if(cookies.tollFailed){
							window.Notice("BANKRUPT",
								"You could not pay " + cookies.tollFailed + " 🪙. Properties seized", 3200)
						}
					}catch(err){
					}
					try{
						if(cookies.raidForfeited && window.BoardCallback.raidForfeited !== cookies.raidForfeited){
							window.BoardCallback.raidForfeited = cookies.raidForfeited
							window.Notice("RUN LOST",
								cookies.raidForfeited + " 🪙 lost. UCAV keeps nothing without extraction", 3400)
						}else if(!cookies.raidForfeited){
							delete window.BoardCallback.raidForfeited
						}
						if(cookies.raidReleased && window.BoardCallback.raidReleased !== cookies.raidReleased){
							window.BoardCallback.raidReleased = cookies.raidReleased
							window.Notice("RUN BANKED",
								cookies.raidReleased + " 🪙 returned. Everything you earned is yours", 3200)
						}else if(!cookies.raidReleased){
							delete window.BoardCallback.raidReleased
						}
						if(typeof cookies.raidEscrow != "undefined" &&
							window.BoardCallback.raidEscrow !== cookies.raidEscrow){
							window.BoardCallback.raidEscrow = cookies.raidEscrow
							window.Notice("UCAV RUN",
								"Balance sealed (" + cookies.raidEscrow + " 🪙). Extract to get it back", 3400)
						}else if(typeof cookies.raidEscrow == "undefined"){
							delete window.BoardCallback.raidEscrow
						}
					}catch(err){
					}
					try{
						if(window.OfferSync){
							window.OfferSync(cookies)
						}
					}catch(err){
					}
					try{
						if(cookies.swapError && window.BoardCallback.swapError !== cookies.swapError){
							window.BoardCallback.swapError = cookies.swapError
							var _se = String(cookies.swapError)
							var _seBody = "Could not complete the trade"
							if(_se === "insufficient_balance"){
								_seBody = "Not enough coins"
							}else if(_se === "no_item"){
								_seBody = "You no longer carry that item"
							}else if(_se === "no_pool" || _se === "lock_failed"){
								_seBody = "Market is busy. Try again"
							}else if(_se === "schema"){
								_seBody = "Trading is temporarily unavailable"
							}
							var _sf = cookies.swapFailed ? cookies.swapFailed * 1 : 0
							if(!isNaN(_sf) && _sf > 1){
								_seBody = _sf + " item(s) failed. " + _seBody
							}
							window.Notice("TRADE FAILED", _seBody, 2800)
							try{
								if(window.SwapClearPick && window.SwapOpen && window.SwapOpen()){
									window.SwapClearPick()
								}
								if(window.SwapTotal){
									window.SwapTotal()
								}
							}catch(err){
							}
						}else if(!cookies.swapError){
							delete window.BoardCallback.swapError
						}
					}catch(err){
					}
					try{
						if(cookies.bought){
							window.Notice("TILE CLAIMED",
								"Paid " + cookies.bought + " 🪙. This land is yours", 2600)
						}else if(cookies.bidError){
							var _be = String(cookies.bidError)
							var _beHead = "CLAIM FAILED"
							var _beBody = "Could not claim this tile"
							if(_be === "insufficient_balance"){
								_beBody = "Not enough coins"
							}else if(_be === "owned"){
								_beBody = "Someone claimed it first"
							}else if(_be === "self"){
								_beBody = "You already own this tile"
							}else if(_be === "nation_property"){
								_beBody = "State property cannot be bought"
							}else if(_be === "auction"){
								_beBody = "An auction is closing here. Try again shortly"
							}else if(_be === "no_property" || _be === "lock_failed"){
								_beBody = "Tile is busy. Try again"
							}else if(_be === "schema"){
								/*
									개발 Part 87 (스키마 오류)
									재시도해도 낫지 않는 종류다.
									"다시 해보라" 고 안내하면 사용자가 계속 누르게 되므로
									서버 문제임을 분명히 말한다.
								*/
								_beHead = "SERVER UPDATING"
								_beBody = "Land purchase is temporarily unavailable"
								console.log("[board] property schema is out of date on the server")
							}else if(_be.indexOf("reserved_") === 0){
								_beBody = "This tile is reserved"
							}
							window.Notice(_beHead, _beBody, 2800)
						}
					}catch(err){
					}
					try{
						if(cookies.offerError){
							var _oe = String(cookies.offerError)
							var _oeBody = "Could not send the offer"
							if(_oe === "offer_pending"){
								_oeBody = "An offer is already pending on this tile"
							}else if(_oe === "offer_balance"){
								_oeBody = "Not enough coins to escrow"
							}else if(_oe === "offer_self"){
								_oeBody = "You already own this tile"
							}else if(_oe === "offer_unowned"){
								_oeBody = "This tile has no owner. Use the auction"
							}else if(_oe === "notowner"){
								_oeBody = "You are not the owner of this offer"
							}else if(_oe === "resolved"){
								_oeBody = "This offer was already answered"
							}
							window.Notice("OFFER FAILED", _oeBody, 3000)
						}
					}catch(err){
					}

					/*
						개발 Part 72 (보드 고립 복구)
						서버가 좌표를 링으로 되돌렸다.
						아무 설명 없이 캐릭터가 순간이동하면 버그로 보인다.
						왜 옮겨졌는지 알린다.
						recovered 는 브라우저 쿠키로 직렬화되지 않으므로
						교정이 일어난 응답 한 번에만 실린다.
					*/
					try{
						if(cookies.recovered && window.BoardCallback.recovered !== cookies.recovered){
							window.BoardCallback.recovered = cookies.recovered
							var _rc = String(cookies.recovered).split(",")
							window.Notice("BACK ON PATH",
								"You were off the board path. Moved to " +
								Math.floor(_rc[0] * 1) + ", " + Math.floor(_rc[1] * 1),
								2800)
							try{
								if(window.Sfx){
									window.Sfx.play("step")
								}
							}catch(err){
							}
						}else if(!cookies.recovered){
							delete window.BoardCallback.recovered
						}
					}catch(err){
					}
					try{
						if(cookies.onJail && !window.BoardCallback.jailed){
							window.BoardCallback.jailed = true
							window.Notice("SAFE ZONE",
								"Step off the path into the field. Leave this tile and it's dice only again",
								3200)
						}else if(!cookies.onJail){
							delete window.BoardCallback.jailed
						}
					}catch(err){
					}
					try{
						if(cookies.matchFull && !window.BoardCallback.matchFull){
							window.BoardCallback.matchFull = true
							window.Notice("MATCH FULL",
								"This session is full (max " +
								(cookies.matchCapacity ? cookies.matchCapacity : 20) +
								" players). Wait for the next match", 3600)
						}else if(!cookies.matchFull){
							delete window.BoardCallback.matchFull
						}
					}catch(err){
					}

					// $root.scrollTop(0)

					if(!window.Init.done["board"]){
						window.Init(cookies)
						window.cookies.dice = 0
					}

					try{
						if(window.SwapPending && window.SwapPending.stage === "commit"){
							if(OAuth3.xhr){
								OAuth3.xhr.abort()
								delete OAuth3.xhr
							}
							if(window.SwapCommit && window.SwapCommit()){
								return
							}
						}
					}catch(err){
					}
					if(window.Poll.ing){
						if(OAuth3.xhr){
							OAuth3.xhr.abort()
							delete OAuth3.xhr
						window.response = resp
						}
					}
					if(typeof window.Poll.ing == "undefined" && !cookies.damage &&
						!(window.RollBusy && window.RollBusy())){
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
						if(typeof window.Roll.ing !== "undefined"){
							clearInterval(window.Roll.ing)
							delete window.Roll.ing
							window.Roll.snap = null
							window.Roll.prevX = null
							window.Roll.prevZ = null
						}
						if(window.DiceSpinSync){
							window.DiceSpinSync(dice)
						}else if(window.Roll.back){
							window.Roll.back.options.endNum = dice
							window.Roll.back.loopCount = 6
						}
						setTimeout(function(){
							if(!(window.DiceSpinBusy && window.DiceSpinBusy())){
								$('#root player tooltip .slotwrapper ul').removeAttr("style")
								$('#root player tooltip #dice .num').text(dice)
							}
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
							window.Roll.trail = {}
							window.Roll.trailMatch = window.cookies.match
							try{
								var _t0x = window.Grid(window.current.current.position.x)
								var _t0z = window.Grid(window.current.current.position.z)
								if(!isNaN(_t0x) && !isNaN(_t0z)){
									window.Roll.trail[_t0x + ":" + _t0z] = true
								}
							}catch(err){
							}
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
			var cookies = window.CookiesParse(res.body.cookies)
			if(!cookies){
				cookies = window.cookies ? window.cookies : {}
			}
			window.cookies = cookies
			try{
				var _bootHash = String(window.location.hash || "").replace("#","").toLowerCase()
				if(_bootHash){
					var _selfKey = String(cookies.address ? cookies.address : cookies.hash)
						.replace("0x","").toLowerCase()
					if(_selfKey && _bootHash === _selfKey){
						console.log("[board] my room direct entry blocked :: " + _bootHash)
						if(window.history && window.history.replaceState){
							window.history.replaceState(null, "",
								window.location.pathname + window.location.search)
						}else{
							window.location.hash = ""
						}
						try{
							if(window.Notice){
								window.Notice("BOARD MODE",
									"My Room opens from the board", 2600)
							}
						}catch(err){
						}
					}
				}
			}catch(err){
			}
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
					if(window.RollBusy && window.RollBusy()){
						return
					}
					if(window.SwapPending && window.SwapPending.stage === "commit"){
						if(window.SwapCommit && window.SwapCommit()){
							return
						}
					}
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
							var $assets = $('.emoji_asset[type="item"].on')
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
                try{
                    if(window.Mode() != "board"){
                        return
                    }
                    if(window.TileSync){
                        window.TileSync()
                    }
                }catch(err){
                }
            })
			window.addEventListener('blur', function(){
				/*
					개발 Part 73 (굴림 중 렌더 유지)
					현행 문제
					  탭을 벗어나면 무조건 demand 로 내렸다.
					  굴리는 중이면 window.Roll 이 좌표를 옮겨도 그려지지 않고,
					  Player.jsx 의 lerp 보간이 멈춘 채 목표 좌표만 앞서 나간다.
					  복귀 시 always 로 돌아오는 순간
					  캐릭터가 여러 칸을 한 번에 미끄러지거나,
					  그 사이 폴링이 개입하면 앵커로 되돌아간다.
					조치
					  굴림이 살아 있으면 렌더를 끄지 않는다.
					  주사위는 길어야 3초(6칸)이므로 비용이 크지 않다.
					  다 걷고 나면 Roll 의 소진 분기가 always 로 두므로
					  다음 blur 에서 정상적으로 내려간다.
				*/
				if(window.RollBusy && window.RollBusy()){
					return
				}
				window.setFrameloop("demand")
			})
            document.addEventListener("visibilitychange", function(){
                try{
                    if(document.hidden){
                        if(window.RollBusy && window.RollBusy()){
                            return
                        }
                        window.setFrameloop("demand")
                        return
                    }
                    window.setFrameloop("always")
                    if(window.Mode() != "board"){
                        return
                    }
                    try{
                        if(window.RollBusy && window.RollBusy() && window.Roll){
                            window.Roll.at = Date.now() - 4000
                        }
                    }catch(err){
                    }
                    if(window.RingSync){
                        window.RingSync()
                    }
                    if(window.TileSync){
                        window.TileSync()
                    }
                }catch(err){
                }
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
												var _startCookies = window.CookiesParse
													? window.CookiesParse(_resp.body.cookies)
													: null
												if(!_startCookies){
													console.log("[board] start response :: cookies unreadable")
													_startCookies = window.cookies ? window.cookies : {}
												}
												window.cookies = _startCookies
												$body.attr("team", _startCookies.team ? _startCookies.team : "")
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
							if(window.SwapTotal){
								window.SwapTotal()
							}
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

											if($this.hasClass("Exit") || $this.hasClass("Deploy")){
												/*
													개발 Part 65 (게이트 = 탈출구)
													Deploy 분기를 흡수한다.
													  링 위 주사위 이동 = PMC 활동
													  게이트 = 나가는 문
													이므로 여기서 역할을 다시 고르게 하지 않는다.
													판정은 프론트가 먼저 하고 사유를 팝업이 알린다.
													  게이트 아님 / 탈출 구역 아님  Notice 로 즉시 거절
													  그 외                          ExitPick 팝업
													서버 exitable 이 최종 판정이며,
													팝업의 탈출 버튼은 exitable 일 때만 활성된다.
												*/
												if(window.EdgeReady && !window.EdgeReady()){
													window.Notice("MAP LOADING", "Board path is not ready", 1800)
													return
												}
												var _gateField = window.EdgeField
													? window.EdgeField(player.x, player.z) : null
												var _onGate = (_gateField && (_gateField.gate || _gateField.drop))
													? true : false
												var _onZone = false
												try{
													if(!_gateField && window.ExitZone){
														_onZone = window.ExitZone(player.x, player.z)
													}
												}catch(err){
													_onZone = false
												}
												if(!_onGate && !_onZone){
													window.Notice("NO GATE",
														"Extract from a gate on the board path", 2400)
													return
												}
												if(window.ExitPick){
													window.ExitPick()
												}
												return
											}else if($this.hasClass("Bomb")){
												/*
													개발 Part 75 (폭탄 슬롯)
													현행 문제
													  폭탄이 Meta 분기 안쪽 세 번째 else 에 있었다.
													    if(_isEdgeHere){ … }
													    else if(_anc){ …BACK ON PATH… return }
													    else if(window.Biomes[…]){ …isBomb… }
													  그런데 개발 Part 35 가 PMC 게이트 스폰에서
													    RingAnchorSet(x, z)
													  를 부르므로 출격한 PMC 는 항상 앵커를 가진 채
													  내륙에 있다. 두 번째 분기에 걸려
													  폭탄 분기가 한 번도 실행되지 않았다.
													  개발 Part 74 가 그 조건에 !cookies.enter 를 붙여
													  통과는 시켰지만, 슬롯 자체가 화면에 없어
													  누를 방법이 없었다.
													조치
													  폭탄을 독립 슬롯으로 올린다.
													  앵커는 링으로 돌아왔을 때의 굴림 기준점이지
													  필드 행동을 막는 값이 아니므로 여기서는 보지 않는다.
													판정 순서
													  1) 링 미확정      판정 근거 없음
													  2) 링 위          규칙 R5. 폭탄 무효
													  3) 미출격         개발 Part 47. 자격 없음
													  4) 이미 설치 중   중복 금지
													  5) 지형 없음      놓을 자리가 아니다
												*/
												if(window.EdgeReady && !window.EdgeReady()){
													window.Notice("MAP LOADING", "Board path is not ready", 1800)
													return
												}
												if(window.EdgeSelf && window.EdgeSelf()){
													window.Notice("NO BOMBS", "Bombs do not work on the path", 2200)
													return
												}
												/*
													개발 Part 92 (감옥 외출 폭탄 허용)
													서버 cc == "bomb" 은 링 여부만 본다. enter 를 요구하지 않는다.
													감옥 외출 중에도 NPC 는 붙으므로 반격 수단을 준다.
												*/
												if(!cookies.enter && !cookies.jail){
													window.Notice("NOT IN RAID", "Deploy first to use bombs", 2200)
													return
												}
												if(plant){
													return
												}
												if(!b || !window.Biomes[`#${b.biome}`]){
													window.Notice("NO GROUND", "You cannot place a bomb here", 2000)
													return
												}
												window.cookies.dice = 0
												isBomb = true
												body.cc = "bomb"
												query.edge = 0
											}else if($this.hasClass("Meta")){
												var _dice = $body.attr("dice") * 1
												if(!isNaN(_dice)){
													if(_dice > 0){
														return
													}
												}
												if(window.DiceSpinBusy && window.DiceSpinBusy()){
													return
												}
												if(cookies.matchFull){
													window.Notice("MATCH FULL",
														"This session is full (max " +
														(cookies.matchCapacity ? cookies.matchCapacity : 20) +
														" players). Wait for the next match", 3000)
													return
												}
												if(window.EdgeReady && !window.EdgeReady()){
													window.Notice("MAP LOADING", "Board path is not ready", 1800)
													return
												}
												var _edgeField = window.EdgeSelf
													? window.EdgeSelf() : null
												var _isEdgeHere = _edgeField ? true : false
												if(_isEdgeHere && window.cookies.enter && window.cookies.role == "UCAV"){
													window.Notice("UCAV", "Drones fight in the field, not on the path", 2200)
													return
												}
												if(!_isEdgeHere && !window.cookies.enter && !window.cookies.jail){
													if(window.RolePick){
														window.RolePick()
														return
													}
													window.Notice("NOT ON PATH", "Return to the board path", 2200)
													return
												}
												window.cookies.dice = 0
												body.cc = ""
												var _anc = window.RingAnchor ? window.RingAnchor() : null
												var _pgx = window.Grid ? window.Grid(player.x) : player.x
												var _pgz = window.Grid ? window.Grid(player.z) : player.z
												if(_isEdgeHere){
													if(_anc && (_anc.x !== _pgx || _anc.z !== _pgz)){
														window.RingReturn(_anc)
														try{
															if(window.Sfx){
																window.Sfx.play("step")
															}
														}catch(err){
														}
														window.Notice("BACK ON PATH",
															"Returned to your last board tile", 1800)
														return
													}
													query.dice = 10
													body.cc = "dice"
													query.edge = 1
												}else if(_anc && !cookies.enter){
													window.Notice("BACK ON PATH",
														"Walk back to " +
														Math.floor(_anc.x) + ", " + Math.floor(_anc.z) +
														" to roll again", 2600)
													return
												}else if(window.Biomes[`#${b.biome}`]){
													/* 개발 Part 92 : 감옥 외출 중에도 허용한다 */
													if(!cookies.enter && !cookies.jail){
														window.Notice("NOT IN RAID",
															"Deploy first to use bombs", 2200)
														return
													}
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
												if(body.cc == "dice"){
													if(window.DiceSpinStart && window.DiceSpinStart()){
														try{
															if(window.Sfx){
																window.Sfx.play("dice")
															}
														}catch(err){
														}
													}
												}
											}else if($this.hasClass("Reserved")){
												var _rkind = $this.attr("tile") ? $this.attr("tile") : ""
												var _rmsg = window.ReservedNotice
													? window.ReservedNotice(_rkind)
													: { head : "RESERVED", body : "You cannot build here" }
												window.Notice(_rmsg.head, _rmsg.body, 2400)
												return
											}else if($this.hasClass("Build")){
												if(window.EdgeReady && !window.EdgeReady()){
													window.Notice("MAP LOADING", "Board path is not ready", 1800)
													return
												}
												if(!window.IsEdge(player.x, player.z)){
													window.Notice("NOT ON PATH", "Build only on the board path", 2200)
													return
												}
												var _bk = window.ReservedTile
													? window.ReservedTile(player.x, player.z) : ""
												if(_bk){
													var _bmsg = window.ReservedNotice(_bk)
													window.Notice(_bmsg.head, _bmsg.body, 2400)
													return
												}
												$('tooltip').removeClass("on")
												$body.removeAttr("tooltip")
												if(window.PropertyPanel){
													window.PropertyPanel()
												}else{
													window.Notice("BUILD", "Property panel is not ready", 1800)
												}
												return
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
												$pool.html("")
												$("#swap .submit input").val("")
												$('#pool li.item').removeAttr("type")
												$sellables.addClass("on")
												$body.attr("swap","")
												$swap.addClass("loading")
												if(window.StatusLoading){
													window.StatusLoading()
												}
												if(window.PollBreak){
													window.PollBreak()
												}else if(OAuth3.xhr){
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
											if(window.ItemPick && !window.SwapIntent){
												window.ItemPick(emoji, $this)
												return
											}
											$('tooltip').removeClass("on")
											$body.removeAttr("tooltip")
											$this.toggleClass("on")
											
											var $assets = $('.emoji_asset[type="item"].on')
											if($assets.length){
												$body.attr("swap","")
												$swap.addClass("loading")
												if(window.StatusLoading){
													window.StatusLoading()
												}
											}else if(!window.SwapPending){
												$body.removeAttr("swap")
												$pool.html("")
												$("#swap .submit input").val("")
												if(window.StatusSync){
													window.StatusSync()
												}
												delete window.SwapIntent
											}
											/* 개발 Part 67 : 커밋 폴링은 끊지 않는다 */
											if(window.PollBreak){
												window.PollBreak()
											}else if(OAuth3.xhr){
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
															/* 개발 Part 94 : 쿠키 파싱은 CookiesParse 로 일원화한다 */
															var cookies = window.CookiesParse
																? window.CookiesParse(res.body.cookies)
																: null
															if(!cookies){
																console.log("[auth] response :: cookies unreadable")
																cookies = window.cookies ? window.cookies : {}
															}
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
											if(window.IsEdge(player.x, player.z)){
												window.Notice("NO BOMBS", "Bombs do not work on the path", 2200)
												return
											}
											/* 개발 Part 92 : 감옥 외출 중에도 허용한다 */
											if(!cookies.enter && !cookies.jail){
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
								/* 개발 Part 47 (거부 사유 분기) */
								var _jr = window.CanMoveTo.reason
								if(_jr === "anchor" || _jr === "noanchor"){
									var _ja = window.RingAnchor ? window.RingAnchor() : null
									window.Notice("BOARD PATH",
										_ja
											? ("Return through " + Math.floor(_ja.x) + ", " + Math.floor(_ja.z))
											: "You cannot step onto the board path here",
										2600)
								}else{
									window.Notice("FIELD ONLY", "UCAV cannot enter the board path", 2200)
								}
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

			/*
				개발 Part 81 (덱 중복 등록)
				unshift 직접 호출을 EmojiDeck 으로 바꾼다.
				RoomInit 도 chat / notify 를 등록하므로
				보드와 룸을 모두 거치면 같은 버튼이 두 번 생겼다.
				EmojiDeck 이 (method, icon) 로 중복을 막는다.
			*/
			window.EmojiDeck("chat", "chat", "emoji")
			window.EmojiDeck("craft", "wand_stars", "emoji")
			/*
				개발 Part 32 (첫 슬롯 재배치)
				건설 버튼(method="property", icon="home")을 여기서 제거한다.
				플레이어 툴팁의 첫 슬롯(a.hashType.Build)으로 옮겼다.
				제거하는 이유
				  덱은 위치와 무관하게 항상 떠 있는 목록이다.
				  그런데 부동산은 링 위에서만 지을 수 있어
				  내륙에서 누르면 요청만 나가고 아무 반응이 없었다.
				  "눌러도 안 되는 버튼" 이 상시 노출되는 상태였다.
				아래 클릭 핸들러의 method == "property" 분기는 그대로 둔다.
				도달하지 않는 경로가 되지만, 덱 항목을 다시 넣을 때
				바로 동작하도록 남겨 둔다.
				craft(제작)는 위치 제한이 없으므로 덱에 그대로 둔다.
			*/
			window.EmojiDeck("notify", "notifications", "emoji")

			

			var li = ""
			var emojis = []
			var assets = []
			var player_hash = cookies.hash
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
				try{
					delete window.current.axis
				}catch(err){
				}
				try{
					if(cookies){
						delete cookies.axis
						cookies.dice = 0
					}
				}catch(err){
				}
				window.Snap = 8
				window.MapReset()
				if(window.MapGen){
					window.MapGen.ready = false
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
					try{
						if(window.RaidPending && window.RaidPending()){
							console.log("[board] pending deploy carried into board mode :: " +
								window.RaidPending())
						}
					}catch(err){
					}
				}, 1000)
			}
		}
		OAuth3.fetch(request, response);
	}
})