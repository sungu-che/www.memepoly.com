window.Stage = {
	current : "",
	raidTimer : null,
	miaTimer : null,
	graceLimit : 5,
	graceCount : 0,
	blocked : ""
}
window.Stage.set = function(name){
	window.Stage.current = name
	if(name && name !== "playing"){
		$("body").attr("stage", name)
	}else{
		$("body").removeAttr("stage")
	}
}

window.Notice = function(head, body, ms){
	var $n = $("#notice")
	if(!$n.length){
		return
	}
	try{
		if(window.Sfx){
			var h = String(head ? head : "").toUpperCase()
			var skip = ["TOLL", "STATE TOLL", "TREASURY RAID", "BANKRUPT",
				"EXTRACTED", "MIA", "SAFE ZONE"]
			if(skip.indexOf(h) === -1){
				var denyWords = ["FAILED", "BLOCKED", "NO ", "NOT ", "CANNOT",
					"RESERVED", "GATE", "SUPPLY", "OWNED", "FULL", "TIMED"]
				var isDeny = false
				for(var _di = 0; _di < denyWords.length; _di++){
					if(h.indexOf(denyWords[_di]) > -1){
						isDeny = true
						break
					}
				}
				window.Sfx.play(isDeny ? "deny" : "blip")
			}
		}
	}catch(err){
	}
	$n.find(".head").text(head ? head : "")
	$n.find(".body").html(body ? body : "")
	$n.addClass("on")
	if(window.Notice.timer){
		clearTimeout(window.Notice.timer)
	}
	window.Notice.timer = setTimeout(function(){
		$n.removeClass("on")
	}, ms ? ms : 2600)
}

window.MatchLeft = function(){
	var expired = 0
	try{
		if(window.match && window.match.expired){
			expired = window.match.expired * 1
		}
		var cookies = window.cookies
		if((!expired || isNaN(expired)) && cookies && cookies.expired){
			expired = cookies.expired * 1
		}
		if((!expired || isNaN(expired)) && cookies && cookies.started && cookies.raidLimit){
			expired = (cookies.started * 1) + (cookies.raidLimit * 1)
		}
	}catch(err){
		return -1
	}
	if(!expired || isNaN(expired)){
		return -1
	}
	var offset = 0
	try{
		offset = window.MatchOffset ? window.MatchOffset() : 0
	}catch(err){
		offset = 0
	}
	var ms = expired - (Date.now() + offset)
	if(ms < 0){
		ms = 0
	}
	return ms
}

window.MatchClockText = function(ms){
	if(typeof ms == "undefined"){
		ms = window.MatchLeft()
	}
	if(ms < 0){
		return ""
	}
	var total = Math.floor(ms / 1000)
	var m = Math.floor(total / 60)
	var s = total % 60
	return m + ":" + (s < 10 ? ("0" + s) : s)
}

window.MatchClock = function(){
	var $left = $("#capture .rank_toggle a.hashType.Hp .cnt .left")
	if(!$left.length){
		return ""
	}
	var ms = window.MatchLeft()
	var text = window.MatchClockText(ms)
	if(!text){
		if($left.text() !== ""){
			$left.text("").removeClass("soon").removeClass("warn")
		}
		return ""
	}
	var body = "(" + text + ")"
	if($left.text() !== body){
		$left.text(body)
	}
	if(ms <= 10000){
		$left.addClass("soon").addClass("warn")
	}else if(ms <= 60000){
		$left.addClass("soon").removeClass("warn")
	}else{
		$left.removeClass("soon").removeClass("warn")
	}
	return body
}

window.MatchClockStart = function(){
	if(window.MatchClock.timer){
		return window.MatchClock.timer
	}
	window.MatchClock.timer = setInterval(function(){
		try{
			window.MatchClock()
		}catch(err){
		}
	}, 1000)
	return window.MatchClock.timer
}
window.HpBadge = function(hp, maxHp){
	var $capture = $("#capture")
	if(!$capture.length){
		return null
	}
	var $slot = $capture.find(".rank_toggle")
	if(!$slot.length){
		$capture.append('<div class="rank_toggle"></div>')
		$slot = $capture.find(".rank_toggle")
	}
	var sig = hp + "/" + maxHp
	var body = '<a class="hashType Hp"><i class="emoji color">❤️</i>'
		+ '<span class="cnt"><b class="hp">' + sig + '</b><b class="left"></b></span></a>'
	if($slot.attr("data-hp") !== sig || !$slot.find("a.hashType.Hp .cnt .left").length){
		$slot.html(body)
		$slot.attr("data-hp", sig)
	}
	$capture.attr("hp", hp)
	$capture.attr("maxhp", maxHp)
	try{
		window.MatchClock()
		window.MatchClockStart()
	}catch(err){
	}
	return $slot
}

window.ExitKeys = function(){
	var cookies = window.cookies
	if(!cookies){
		return []
	}
	if(!cookies.exitKeys){
		return []
	}
	return cookies.exitKeys.split(",").filter(function(v){
		return v.length > 0
	})
}

window.RaidSlots = function(){
	var out = {
		used : [],
		aborted : false,
		pmc : false,
		ucav : false,
		any : false
	}
	var cookies = window.cookies
	if(!cookies){
		return out
	}

	out.used = []
	try{
		var _raw = cookies.raidUsed
		if(Array.isArray(_raw)){
			out.used = _raw
		}else if(_raw){
			var _str = String(_raw).trim()
			out.used = (_str.indexOf("[") === 0) ? JSON.parse(_str) : _str.split(",")
		}
	}catch(err){
		out.used = []
	}
	if(!Array.isArray(out.used)){
		out.used = []
	}
	out.used = out.used.filter(function(v){
		return v && String(v).length > 0
	}).map(function(v){
		return String(v).toUpperCase()
	})
	out.aborted = cookies.raidAborted ? true : false
	out.ucav = out.used.indexOf("UCAV") == -1
	out.pmc = out.aborted ? false : (out.used.indexOf("PMC") == -1)
	out.any = out.pmc || out.ucav
	return out
}

window.CanRaid = function(){
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
	if(cookies.raidBlocked){
		return false
	}
	return window.RaidSlots().any
}
window.RaidPending = function(){
	try{
		var v = sessionStorage.getItem("raidRole")
		return v ? String(v).toUpperCase() : ""
	}catch(err){
		return ""
	}
}
window.RaidPendingClear = function(){
	try{
		sessionStorage.removeItem("raidRole")
	}catch(err){
	}
	return true
}

window.Dead = function(){
	var cookies = window.cookies
	if(!cookies){
		return
	}
	/*
		개발 Part 80 (사망 패널 모드 가드)
		이 함수는 body[dead] 와 body[stage="dead"] 를 세운다.
		둘 다 Experience.jsx 개발 Part 69 의 클릭 게이트가 보는 속성이라
		룸 모드에서 켜지면 마이룸 3D 클릭이 통째로 막힌다.
		#dead 는 전체 화면 레이어이므로 마이룸 패널 위에도 겹친다.
		StageSync 에 모드 가드를 넣었지만 Lobby() 안에도 직접 호출이 있다.
		  if(cookies.damage || cookies.dead){ return window.Dead() }
		진입점 자체를 막아 어느 경로로 불려도 안전하게 한다.
		사망 사실을 잃지 않는다
		  진실 원천은 서버 cookies.damage / cookies.dead 다.
		  보드로 돌아오면 StageSync 가 같은 자리에서 다시 띄운다.
	*/
	try{
		if(window.Mode && window.Mode() != "board"){
			return null
		}
	}catch(err){
	}
	var hash = cookies.address ? cookies.address : cookies.hash
	var deadBy = cookies.deadBy ? cookies.deadBy : ""
	var deadAt = cookies.deadAt ? cookies.deadAt : ""
	var role = cookies.deadRole ? cookies.deadRole : (cookies.role ? cookies.role : "")
	var $d = $("#dead")
	if(!$d.length){
		$("body").append('<div id="dead"><div class="tb"><div class="tc"></div></div></div>')
		$d = $("#dead")
	}
	var killerBody = ""
	if(deadBy){
		var _k = deadBy.replace("0x","")
		killerBody = '<div class="killer">\
			<span class="icon" data-from="'+_k+'"></span>\
			<span class="address">\
				<address>\
					<span>'+_k+'</span>\
					<span dir="rtl">'+_k+'</span>\
				</address>\
			</span>\
		</div>'
	}
	var body = '<div class="dead_head">\
		<strong class="title">\
			<span class="ko">전사</span>\
			<span class="en">You are dead</span>\
		</strong>\
		<p class="desc">\
			<span class="ko">소지품을 모두 잃었습니다.</span>\
			<span class="en">All carried items are lost.</span>\
		</p>\
	</div>\
	<ul class="dead_stat">\
		<li class="role"><i class="emoji color">💀</i><span>'+(role ? role : "PLAYER")+'</span></li>\
		<li class="axis"><i class="emoji color">📍</i><span>'+(deadAt ? deadAt : "-")+'</span></li>\
		<li class="balance"><i class="emoji color">🪙</i><span>'+(cookies.balance ? cookies.balance : 0)+'</span></li>\
	</ul>'
	+ killerBody +
	'<div class="dead_action">\
		<a class="btn myroom">\
			<i class="emoji color">🏠</i>\
			<span class="ko">마이룸으로</span>\
			<span class="en">Go to My Room</span>\
		</a>\
	</div>'
	var $tc = $d.find(".tc")
	var before_body = $tc.html()
	if(before_body){
		before_body = before_body.replace(/\t/gi,"").replace(/\n/gi,"").trim()
	}
	var after_body = body.replace(/\t/gi,"").replace(/\n/gi,"").trim()
	if(before_body != after_body){
		$tc.html(after_body)
		try{
			var _icon = window.Blockie ? window.Blockie(hash) : null
			if(_icon){
				$d.find(".dead_head").prepend($('<div class="icon"></div>').append(_icon))
			}
			if(deadBy){
				var _kurl = window.BlockieUrl ? window.BlockieUrl(deadBy) : ""
				if(_kurl){
					$d.find(".killer .icon").css("background-image", "url("+_kurl+")")
				}
			}
		}catch(err){
		}
	}
	$d.addClass("on")
	$("body").attr("dead", "true")
	window.Stage.set("dead")
	return $d
}
window.DeadClose = function(){
	$("#dead").removeClass("on")
	$("body").removeAttr("dead")
	/*
		개발 Part 80 (사망 패널 정리)
		현행 문제
		  Dead() 는 두 가지를 세웠다.
		    $("body").attr("dead", "true")
		    window.Stage.set("dead")   -> body[stage="dead"]
		  그런데 DeadClose 는 dead 만 내렸다.
		  body[stage] 가 남으면 Experience.jsx 개발 Part 69 의
		  클릭 게이트가 계속 막는다.
		    body[myroom/panel/dead/stage] 중 하나라도 있으면 클릭 무시
		  "패널은 닫았는데 여전히 안 움직인다" 의 원인이다.
		조치
		  세운 것을 짝맞춰 내린다.
		  다른 스테이지(lobby / raid)를 지우지 않도록
		  현재 값이 dead 일 때만 비운다.
	*/
	try{
		if(window.Stage && window.Stage.current === "dead"){
			window.Stage.set("")
		}
	}catch(err){
	}
}
$(document).on("click", "#dead .btn.myroom", function(e){
	e.preventDefault()
	var cookies = window.cookies
	if(!cookies){
		return
	}
	window.DeadClose()
	window.Stage.graceCount = 0
	window.Stage.set("")
	/*
		개발 Part 69 (닫음 상태)
		사용자가 마이룸을 명시적으로 요청했다.
		이전에 닫아 둔 표식을 해제해 도착 즉시 패널이 열리게 한다.
	*/
	try{
		if(window.MyRoom){
			window.MyRoom.closed = ""
		}
	}catch(err){
	}
	/*
		개발 Part 80 (동일 해시 진입)
		현행 문제
		  location.hash 에 현재와 같은 값을 대입하면
		  브라우저는 hashchange 를 발화하지 않는다.
		  그러면 아래가 전부 실행되지 않는다.
		    window.onhashchange -> RoomHashChange
		      폴링 재시작(Poll.ing)
		      body[world] 갱신
		      좌표 / 카메라 리셋
		  사망 시 BoardCallback 이 폴링을 끊어 두므로
		    clearInterval(window.Poll.ing)
		    delete window.Poll.ing
		  폴링이 영영 돌아오지 않는다.
		  화면에서는 마이룸인데 서버와 통신이 없는 상태가 된다.
		이 상황이 실제로 생기는 경로
		  개발 Part 80 가드 이전에는 늦게 도착한 보드 응답이
		  룸 모드에서 Dead() 를 다시 띄웠다.
		  이미 마이룸에 있으므로 해시가 같고, 버튼을 눌러도 무반응이었다.
		  "마이룸으로 갔는데 아무것도 안 된다" 가 이것이다.
		조치
		  해시가 이미 목적지면 대입 대신 직접 호출한다.
		  window.onhashchange 는 src/index.js 가 정의하며
		  내부에서 Mode() 를 다시 읽으므로 인자 없이 불러도 안전하다.
	*/
	var _target = (cookies.address ? cookies.address : cookies.hash).replace("0x", "")
	var _now = ""
	try{
		_now = String(window.location.hash || "").replace("#", "")
	}catch(err){
		_now = ""
	}
	if(_now.toLowerCase() === String(_target).toLowerCase()){
		console.log("[stage] already in my room. syncing without hashchange")
		try{
			if(window.onhashchange){
				window.onhashchange()
			}
		}catch(err){
		}
		try{
			if(window.MyRoomOpen){
				window.MyRoomOpen()
			}
		}catch(err){
		}
		return
	}
	window.location.hash = _target
})
window.Lobby = function(){
	var cookies = window.cookies
	if(!cookies){
		return
	}

	if(cookies.damage || cookies.dead){
		return window.Dead()
	}
	var hash = cookies.address ? cookies.address : cookies.hash
	var role = cookies.role ? cookies.role : "PLAYER"

	var _maxHpTable = window.MaxHp ? window.MaxHp : {}
	var maxHp = _maxHpTable[cookies.role ? cookies.role : ""]
	if(typeof maxHp == "undefined" || isNaN(maxHp)){
		maxHp = 10
	}
	var hp = typeof cookies.hp != "undefined" ? cookies.hp : maxHp
	var backpack = cookies.backpack ? cookies.backpack : 3
	var $l = $("#lobby")
	if(!$l.length){
		console.log("[stage] '#lobby' not found. lobby skipped.")
		return
	}

	var property = cookies.property ? cookies.property * 1 : 0

	$l.find(".stat .role span").text(role)
	$l.find(".stat .balance span").text(cookies.balance ? cookies.balance : 0)
	$l.find(".stat .hp span").text(hp + " / " + maxHp)
	$l.find(".stat .backpack span").text(backpack + (property >= 3 ? " ↑" : ""))

	if(!$l.find(".stat .property").length){
		$l.find(".stat").append('<li class="property"><i class="emoji color">🏠</i><span></span></li>')
	}

	$l.find(".stat .property span").text(property)

	if(!$l.find(".profile .icon canvas").length){
		try{
			var _icon = window.Blockie ? window.Blockie(hash) : null
			if(_icon){
				$l.find(".profile .icon").append(_icon)
			}
		}catch(err){
		}
	}

	var keys = window.ExitKeys()
	var body = ""
	for(var i = 0; i < keys.length; i++){
		body += '<li><i class="emoji color">' + keys[i] + '</i></li>'
	}
	if(!body){
		body = '<li><i class="emoji color">❔</i></li>'
	}
	$l.find(".keys .list").html(body)
	var $actions = $l.find(".actions")
	if($actions.length){
		var $raid = $actions.find(".btn.raid")
		var $stash = $actions.find(".btn.stash")
		if(!$stash.length){
			$actions.append('<a class="btn stash">\
				<span class="ko">마이룸으로</span>\
				<span class="en">Go to My Room</span>\
			</a>')
			$stash = $actions.find(".btn.stash")
		}
		var $reason = $actions.find(".reason")
		if(!$reason.length){
			$actions.prepend('<p class="reason"></p>')
			$reason = $actions.find(".reason")
		}
		var slots = window.RaidSlots()
		var blocked = window.Stage.blocked ? window.Stage.blocked : ""
		var noSlot = !window.CanRaid()
		/*
			개발 Part 72 (보드 고립)
			링 밖에 있는데 출격 상태도 감옥도 아니면 잘못된 상태다.
			  주사위는 링 위에서만 굴린다
			  자유 이동은 출격 / 감옥에서만 된다
			서버가 좌표를 교정해 내려주지만
			  링이 아직 확정되지 않았거나
			  응답이 늦거나
			  구버전 서버와 붙은 경우
			교정이 오지 않을 수 있다.
			그때는 사용자에게 "어떻게 빠져나가는지" 를 알려야 한다.
		*/
		var stranded = false
		try{
			if(!cookies.enter && !cookies.jail && !cookies.onJail &&
				!cookies.damage && !cookies.dead &&
				window.EdgeReady && window.EdgeReady()){
				var _lp = window.players.self()
				stranded = !window.IsEdge(_lp.x, _lp.z)
			}
		}catch(err){
			stranded = false
		}
		if(!blocked && noSlot){
			blocked = cookies.matchFull
				? ("This session is full (max " +
					(cookies.matchCapacity ? cookies.matchCapacity : 20) + " players)")
				: "No slots left this match"
		}
		if(blocked){
			$raid.addClass("disabled").hide()
			/*
				개발 Part 70 (슬롯 소진 안내)
				현행 문제
				  사유가 영문 한 줄이었고, 다음에 무엇을 해야 하는지 말하지 않았다.
				  브라우저 뒤로가기로 보드에 떨어진 경우
				  PMC / UCAV 를 이미 둘 다 써서 나갈 수도 들어갈 수도 없는데
				  화면에는 "DEPLOY FAILED" 만 남는다.
				조치
				  왜 막혔는지 + 지금 할 수 있는 것을 함께 말한다.
				  슬롯이 둘 다 소진된 경우에는 마이룸을 주 동선으로 강조한다.
				  다음 판이 시작되면 슬롯이 회복되므로
				  그때까지 보관함을 정리하는 것이 유일하게 의미 있는 행동이다.
			*/
			var _head = "DEPLOY FAILED"
			var _tip = ""
			if(noSlot){
				_head = cookies.matchFull ? "MATCH FULL" : "NO DEPLOY SLOT"
				if(cookies.matchFull){
					_tip = '<span class="ko">이번 세션의 정원(' +
						(cookies.matchCapacity ? cookies.matchCapacity : 20) +
						'명)이 가득 찼습니다.</span>\
						<span class="en">This session has reached its player limit (' +
						(cookies.matchCapacity ? cookies.matchCapacity : 20) + ').</span>'
				}else if(slots.aborted){
					_tip = '<span class="ko">이번 매치에서 전사했습니다. 다음 매치를 기다리세요.</span>\
						<span class="en">You went down this match. Wait for the next match.</span>'
				}else{
					_tip = '<span class="ko">이번 매치의 PMC / UCAV 출격을 모두 사용했습니다.</span>\
						<span class="en">Both PMC and UCAV are used this match.</span>'
				}
				_tip += '<span class="ko">마이룸에서 보관함을 정리하고 다음 매치를 준비하세요.</span>\
					<span class="en">Sort your stash in My Room and wait for the next match.</span>'
			}
			$reason.show().html('<strong class="head">' + _head + '</strong>\
				<span class="body">' + blocked + '</span>' + _tip)
		}else{
			$raid.removeClass("disabled").show()
			$reason.hide().html("")
		}
		/*
			슬롯이 없으면 마이룸이 유일한 선택지다.
			주 버튼처럼 보이게 클래스를 붙인다(CSS 가 색을 바꾼다).
		*/
		if(noSlot){
			$stash.addClass("primary")
		}else{
			$stash.removeClass("primary")
		}
		$stash.show()
		/*
			개발 Part 72 (보드 고립)
			링 밖 고립 상태면 복귀 버튼을 띄운다.
			누르면 앵커(또는 링 아무 칸)로 되돌려 폴링을 다시 돌린다.
			서버 교정과 같은 결과를 프론트에서도 만들 수 있는 이유는
			앵커와 링(window.fields)이 전부 결정론 데이터이기 때문이다.
		*/
		var $back = $actions.find(".btn.reboard")
		if(stranded){
			if(!$back.length){
				$actions.append('<a class="btn reboard primary">\
					<span class="ko">보드 경로로 복귀</span>\
					<span class="en">Return to the board path</span>\
				</a>')
				$back = $actions.find(".btn.reboard")
			}
			$back.show()
		}else if($back.length){
			$back.hide()
		}
	}
	window.Stage.set("lobby")
}

window.Raid = function(){
	if(window.Stage.current == "raid" || window.Stage.current == "raid_done"){
		return
	}
	window.Stage.set("raid")
	window.Stage.graceCount = 0
	var $bar = $("#raid .progress .bar")
	var $tip = $("#raid .tip")
	var keys = window.ExitKeys()
	if(keys.length){
		$tip.html("Find one of " + keys.join(" ") + " to extract")
	}else{
		$tip.html("Preparing the board")
	}
	var pct = 0
	if(window.Stage.raidTimer){
		clearInterval(window.Stage.raidTimer)
	}
	window.Stage.raidTimer = setInterval(function(){
		pct += 7
		if(pct > 92){
			pct = 92
		}
		$bar.css("width", pct + "%")
	}, 120)
	var _role = ""
	try{
		_role = sessionStorage.getItem("raidRole")
		_role = _role ? _role : ""
		sessionStorage.removeItem("raidRole")
	}catch(err){
		_role = ""
	}
	window.Stage.wanted = _role
	if(!window.Action){
		console.log("[stage] window.Action missing. abort raid.")
		window.RaidAbort("Cannot reach the server")
		return
	}
	var _sent = false
	try{
		window.Action({
			cc : "start",
			role : _role
		})
		_sent = true
	}catch(err){
		console.log("[stage] raid action err", err)
	}
	if(!_sent){
		window.RaidAbort("Cannot start the raid")
		return
	}
	if(window.Stage.timeoutTimer){
		clearTimeout(window.Stage.timeoutTimer)
	}
}
window.RaidAbort = function(message){
	if(window.Stage.raidTimer){
		clearInterval(window.Stage.raidTimer)
		delete window.Stage.raidTimer
	}
	if(window.Stage.doneTimer){
		clearTimeout(window.Stage.doneTimer)
		delete window.Stage.doneTimer
	}
	if(window.Stage.timeoutTimer){
		clearTimeout(window.Stage.timeoutTimer)
		delete window.Stage.timeoutTimer
	}
	$("#raid .progress .bar").css("width", "0")
	window.Stage.graceCount = 0
	window.Stage.set("")
	if(window.CanRaid()){
		window.Stage.blocked = ""
	}else{
		window.Stage.blocked = message ? message : "No slots left this match"
	}
	if(message){
		window.Notice("DEPLOY FAILED", message, 2600)
	}
	if(window.Mode() == "board"){
		window.Lobby()
	}
}
window.RaidDone = function(){
	if(window.Stage.current != "raid"){
		return
	}
	if(window.Stage.raidTimer){
		clearInterval(window.Stage.raidTimer)
		delete window.Stage.raidTimer
	}
	if(window.Stage.doneTimer){
		clearTimeout(window.Stage.doneTimer)
		delete window.Stage.doneTimer
	}
	/*
		개발 Part 14 (검수) - H3
		진입에 성공했으므로 실패 타임아웃을 해제한다.
	*/
	if(window.Stage.timeoutTimer){
		clearTimeout(window.Stage.timeoutTimer)
		delete window.Stage.timeoutTimer
	}
	window.Stage.current = "raid_done"
	$("#raid .progress .bar").css("width", "100%")
	window.Stage.doneTimer = setTimeout(function(){
		delete window.Stage.doneTimer
		window.Stage.set("playing")
		$("#raid .progress .bar").css("width", "0")
		var _c = window.cookies ? window.cookies : {}
		var _zone = _c.spawnZone ? String(_c.spawnZone) : ""
		var _deployed = _c.role ? String(_c.role).toUpperCase() : ""
		if(_deployed === "UCAV" || _zone === "inland"){
			window.Notice("UCAV DEPLOYED",
				"Dropped inside the island. Move freely, the dice path is off limits", 3200)
		}else if(_zone === "gate"){
			window.Notice("PMC DEPLOYED",
				"Landed on a gate. Roll the dice to advance", 3000)
		}else if(_zone === "inplace"){
			window.Notice("PMC DEPLOYED",
				"Deployed where you stood. Roll the dice to advance", 2800)
		}else{
			window.Notice("RAID START", "Roll the dice to move", 2200)
		}
	}, 400)
}

window.StageSync = function(cookies){
	if(!cookies){
		return
	}

	if(cookies.recipeSignature && window.RecipeSignature){
		if(cookies.recipeSignature != window.RecipeSignature && !window.StageSync.warned){
			window.StageSync.warned = true
			console.log("ruleset mismatch", window.RecipeSignature, cookies.recipeSignature)
			if(window.RulesetLoad){
				try{
					localStorage.removeItem("memepoly.ruleset")
				}catch(err){
				}
				window.RulesetLoad(function(ok){
					if(ok){
						console.log("ruleset reloaded :", window.RecipeSignature)
					}else{
						window.Notice("RULESET SYNC", "Using local fallback data", 3000)
					}
				})
			}else{
				window.Notice("VERSION MISMATCH", "Recipe data differs from server", 4000)
			}
		}
	}
	/*
		개발 Part 80 (스테이지 모드 가드)
		현행 문제
		  StageSync 는 보드 전용 상태 머신인데 모드를 보지 않는다.
		  호출부는 BoardCallback 뿐이지만,
		  "호출 시점의 모드" 와 "응답 도착 시점의 모드" 가 다를 수 있다.
		    1) 보드 폴링이 나간다 (아직 응답 전)
		    2) 사망 응답이 먼저 도착 -> Dead() -> body[dead] / body[stage="dead"]
		    3) 사용자가 마이룸으로 이동 -> 룸 모드
		    4) 1번 응답이 뒤늦게 도착
		       Callback 은 Mode() 로 라우팅하지만
		       이미 실행 중이던 BoardCallback 은 끝까지 돈다
		       -> StageSync 재실행 -> cookies.damage 가 여전히 true
		       -> Dead() 가 룸 화면에서 body[dead] 를 다시 세운다
		  그러면 Experience.jsx 개발 Part 69 의 클릭 게이트가
		  마이룸에서 3D 클릭을 통째로 막는다.
		  개발 Part 78 의 룸 측 재확인이 지워도 다음 응답이 다시 세우는
		  싸움이 되므로 근본에서 막는다.
		조치
		  룸 모드에서는 스테이지 판정을 하지 않는다.
		  잃는 것이 없다.
		    진실 원천은 서버 쿠키(damage / dead / enter / mia)이고
		    보드로 돌아오면 다음 폴링이 같은 자리에서 다시 판정한다.
		  대신 룸에서 남아 있을 수 있는 보드 오버레이를 여기서 내린다.
		룰셋 서명 비교보다 뒤에 두는 이유
		  그 검사는 모드와 무관한 버전 확인이라 룸에서도 유효하다.
	*/
	try{
		if(window.Mode && window.Mode() != "board"){
			if(window.Stage.raidTimer){
				clearInterval(window.Stage.raidTimer)
				delete window.Stage.raidTimer
			}
			if(window.Stage.timeoutTimer){
				clearTimeout(window.Stage.timeoutTimer)
				delete window.Stage.timeoutTimer
			}
			if(window.Stage.miaTimer){
				clearTimeout(window.Stage.miaTimer)
				delete window.Stage.miaTimer
			}
			window.Stage.graceCount = 0
			if(window.Stage.current){
				window.Stage.set("")
			}
			window.DeadClose()
			$("body").removeAttr("game").removeAttr("jail")
			$("#lobby, #raid").removeClass("on")
			$("#raid .progress .bar").css("width", "0")
			return
		}
	}catch(err){
	}
	if(window.Stage.blocked && window.CanRaid()){
		window.Stage.blocked = ""
	}
	if(cookies.damage || cookies.dead){
		if(window.Stage.raidTimer){
			clearInterval(window.Stage.raidTimer)
			delete window.Stage.raidTimer
		}
		if(window.Stage.timeoutTimer){
			clearTimeout(window.Stage.timeoutTimer)
			delete window.Stage.timeoutTimer
		}
		if(window.Stage.miaTimer){
			clearTimeout(window.Stage.miaTimer)
			delete window.Stage.miaTimer
		}
		$("#lobby").removeClass("on")
		$("#raid .progress .bar").css("width", "0")
		window.Stage.graceCount = 0
		$("body")
			.removeAttr("jail")
			.removeAttr("edge")
			.removeAttr("diceable")
			.removeAttr("dicehome")
			.removeAttr("bombable")
		if(window.Stage.current != "dead"){
			window.Dead()
		}
		return
	}
	window.DeadClose()
	if(cookies.jail){
		$("body").attr("jail", "true")
	}else{
		$("body").removeAttr("jail")
	}
	if(cookies.raidBlocked){
		var _denyBody = "No slots left this match"
		if(cookies.raidDeny == "match_full"){
			_denyBody = "This session is full (max " +
				(cookies.matchCapacity ? cookies.matchCapacity : 20) + " players)"
		}else if(cookies.raidDeny == "no_inland"){
			_denyBody = "No inland ground on this island. UCAV cannot deploy"
		}else if(cookies.raidDeny == "no_gate"){
			_denyBody = "No gate on this board path. PMC cannot deploy"
		}else if(cookies.raidDeny == "pmc_used"){
			_denyBody = "PMC already deployed this match"
		}else if(cookies.raidDeny == "ucav_used"){
			_denyBody = "UCAV already deployed this match"
		}else if(cookies.raidDeny == "aborted"){
			_denyBody = "You went down. Only UCAV is left this match"
		}
		window.RaidAbort(_denyBody)
		return
	}
	if(cookies.exitBlocked){
		var keys = window.ExitKeys()
		window.Notice("EXTRACTION FAILED", "You need " + keys.join(" "), 3200)
	}
	if(cookies.exited){
		window.Notice("EXTRACTED", "Loot moved to My Room", 2600)
		window.Stage.graceCount = 0
		window.Stage.set("")
		/*
			개발 Part 69 (닫음 상태)
			탈출 전리품을 확인해야 하므로 도착 시 한 번은 열어야 한다.
			직전에 마이룸을 닫아 둔 상태였다면 표식을 해제한다.
		*/
		try{
			if(window.MyRoom){
				window.MyRoom.closed = ""
			}
		}catch(err){
		}
		setTimeout(function(){
			window.location.hash = (cookies.address ? cookies.address : cookies.hash).replace("0x", "")
		}, 1200)
		return
	}
	if(cookies.exited && !window.StageSync.exited){
		window.StageSync.exited = true
		var _exBody = "You made it out"
		if(cookies.exitKey){
			_exBody = "Extracted with " + cookies.exitKey
		}
		if(cookies.extracted){
			_exBody += ". " + cookies.extracted + " item(s) secured"
		}
		window.Notice("EXTRACTED", _exBody, 3200)
		try{
			if(window.Sfx){
				window.Sfx.play("extract")
			}
		}catch(err){
		}
		window.Stage.graceCount = 0
		window.Stage.blocked = ""
		window.Stage.set("")
	}else if(!cookies.exited){
		delete window.StageSync.exited
	}
	if(cookies.exitBlocked && !window.StageSync.exitWarned){
		window.StageSync.exitWarned = cookies.exitBlocked
		var _exTip = { head : "EXIT", body : "You cannot extract here" }
		if(cookies.exitBlocked === "nokey"){
			var _k = window.ExitKeys ? window.ExitKeys() : []
			_exTip = {
				head : "NO EXIT KEY",
				body : _k.length
					? ("Carry one of " + _k.join(" ") + " to extract")
					: "You need an extraction key"
			}
		}else if(cookies.exitBlocked === "nogate"){
			_exTip = { head : "NO GATE", body : "Extract only from a gate tile" }
		}else if(cookies.exitBlocked === "notdeployed"){
			_exTip = { head : "EXIT", body : "You are not deployed" }
		}
		window.Notice(_exTip.head, _exTip.body, 2800)
	}else if(!cookies.exitBlocked){
		delete window.StageSync.exitWarned
	}
	if(cookies.miaRolled){
		var _burned = cookies.miaBurned ? cookies.miaBurned * 1 : 0
		/*
			개발 Part 70 (MIA 전량 소각)
			miaSaved 는 항상 0 이다. 분기를 없애고 소실만 알린다.
			"보관함에 넣었어야 한다" 를 함께 말해
			다음 판에서 어떻게 해야 하는지 알려준다.
		*/
		var _miaBody = "The match ended while you were deployed."
		if(_burned > 0){
			_miaBody += " " + _burned + " item(s) lost."
		}
		if(cookies.miaRole === "UCAV"){
			_miaBody += " UCAV has no item guarantee. Extract next time."
		}else{
			_miaBody += " Store loot in My Room before the match ends."
		}
		window.Notice("MIA", _miaBody, 3200)
		window.Stage.graceCount = 0
		window.Stage.blocked = ""
		window.Stage.set("")
		setTimeout(function(){
			window.location.hash = (cookies.address ? cookies.address : cookies.hash).replace("0x", "")
		}, 1600)
		return
	}
	if(cookies.mia){
		window.Notice("MIA", "You failed to extract in time", 3000)
		/*
			개발 Part 14 (검수) - H4
			exited 와 동일 사유로 Stage 를 비운다.
		*/
		window.Stage.graceCount = 0
		window.Stage.set("")
		if(window.Action){
			window.Action({
				cc : "mia"
			})
		}
		setTimeout(function(){
			window.location.hash = (cookies.address ? cookies.address : cookies.hash).replace("0x", "")
		}, 1600)
		return
	}
	if(cookies.bankrupt){
		try{
			if(window.Notice){
				window.Notice("BANKRUPT",
					"You could not pay the toll. Your holdings were seized", 2600)
			}
		}catch(err){
		}
		setTimeout(function(){
			window.location.hash = (cookies.address ? cookies.address : cookies.hash).replace("0x", "")
		}, 1600)
		return
	}
	if(cookies.enter){
		window.Stage.graceCount = 0
		var limit = cookies.raidLimit ? cookies.raidLimit * 1 : 60 * 60 * 1000
		var left = (cookies.enter * 1) + limit - Date.now()
		if(left > 0){
			if(window.Stage.miaTimer){
				clearTimeout(window.Stage.miaTimer)
			}
			window.Stage.miaTimer = setTimeout(function(){
				if(window.Poll){
					window.Poll()
				}
			}, left + 500)
		}
		if(window.Stage.current == "raid"){
			window.RaidDone()
		}else if(window.Stage.current == "lobby" || window.Stage.current == ""){
			window.Stage.set("playing")
		}
	}else{
		if(window.Stage.current == "playing"){
			window.Stage.graceCount++
			if(window.Stage.graceCount <= window.Stage.graceLimit){
				return
			}
			console.log("[stage] enter lost for " + window.Stage.graceCount +
				" polls. returning to lobby.")
			window.Stage.graceCount = 0
			window.Stage.set("")
		}
		var _pendingRole = window.RaidPending ? window.RaidPending() : ""
		if(_pendingRole && window.Stage.current != "raid" && window.Stage.current != "raid_done"){
			if(window.CanRaid()){
				console.log("[stage] pending deploy consumed :: " + _pendingRole)
				window.Raid()
				return
			}
			if(window.RaidPendingClear){
				window.RaidPendingClear()
			}
		}
		var _onRing = false
		try{
			if(window.EdgeReady && window.EdgeReady()){
				var _me = window.players.self()
				_onRing = window.IsEdge(_me.x, _me.z)
			}
		}catch(err){
			_onRing = false
		}
		var _onBoard = _onRing
		if(!_onBoard){
			try{
				if(cookies.onJail){
					_onBoard = true
				}else if(window.RingAnchor && window.RingAnchor()){
					_onBoard = true
				}
			}catch(err){
			}
		}
		if(window.Stage.current == "lobby" && _onBoard && !window.Stage.blocked){
			/*
				개발 Part 70 (슬롯 소진)
				보드 위(링/감옥/앵커)에 있으면 로비를 닫는 것이 기본이다.
				다만 출격 슬롯이 하나도 없으면 이야기가 다르다.
				  주사위는 굴릴 수 있지만 필드로 나갈 수 없고
				  탈출도 출격 상태가 아니면 의미가 없다
				이 상태에서 로비를 닫으면
				"왜 아무 것도 안 되는지" 를 알려줄 화면이 사라진다.
				슬롯이 있을 때만 닫는다.
			*/
			if(window.CanRaid()){
				window.Stage.set("")
				return
			}
		}
		if(window.Stage.current != "lobby" && window.Stage.current != "raid"){
			/*
				개발 Part 70 (뒤로가기 진입)
				현행 문제
				  브라우저 뒤로가기로 마이룸에서 보드로 나오면
				  해시만 비고 좌표는 링 위에 남는 경우가 많다.
				  그러면 _onBoard 가 true 라 로비가 뜨지 않고,
				  PMC / UCAV 를 둘 다 쓴 상태여도 아무 안내가 없다.
				  사용자는 "게임이 멈췄다" 고 느낀다.
				조치
				  슬롯이 하나도 없으면 위치와 무관하게 로비를 띄운다.
				  로비가 사유와 마이룸 이동 버튼을 보여준다.
				사망 / MIA 는 위쪽 분기가 이미 각각 처리한다.
			*/
			if(window.Mode() == "board" && (!_onBoard || !window.CanRaid())){
				window.Lobby()
			}
		}
	}
}

$(document).on("click", "#lobby .btn.raid", function(e){
	e.preventDefault()
	if($(this).hasClass("disabled")){
		return
	}
	if(!window.CanRaid()){
		window.Stage.blocked = "No slots left this match"
		window.Notice("NO SLOTS", "Wait for the next match", 2600)
		window.Lobby()
		return
	}
	if(window.RaidPending && window.RaidPending()){
		window.Raid()
		return
	}
	if(window.RolePick){
		window.RolePick()
		return
	}
	window.Raid()
})

$(document).on("click", "#lobby .btn.stash", function(e){
	e.preventDefault()
	var cookies = window.cookies
	if(!cookies){
		return
	}
	window.Stage.graceCount = 0
	window.Stage.set("")
	/* 개발 Part 69 : 명시적 진입이므로 닫음 표식을 해제한다 */
	try{
		if(window.MyRoom){
			window.MyRoom.closed = ""
		}
	}catch(err){
	}
	/*
		개발 Part 80 (동일 해시 진입)
		dead 패널의 .btn.myroom 과 같은 구조다.
		로비가 룸 모드에서 떠 있는 경우는 없어야 하지만,
		개발 Part 80 가드 이전 버전이 캐시에 남아 있거나
		뒤로가기 복원으로 그 상태가 재현될 수 있다.
		두 진입점의 동작을 같게 맞춘다.
	*/
	var _stashTarget = (cookies.address ? cookies.address : cookies.hash).replace("0x", "")
	var _stashNow = ""
	try{
		_stashNow = String(window.location.hash || "").replace("#", "")
	}catch(err){
		_stashNow = ""
	}
	if(_stashNow.toLowerCase() === String(_stashTarget).toLowerCase()){
		console.log("[stage] already in my room. syncing without hashchange")
		try{
			if(window.onhashchange){
				window.onhashchange()
			}
		}catch(err){
		}
		try{
			if(window.MyRoomOpen){
				window.MyRoomOpen()
			}
		}catch(err){
		}
		return
	}
	window.location.hash = _stashTarget
})
/*
	개발 Part 72 (보드 고립 복구)
	링 밖에 고립된 상태에서 보드 경로로 되돌린다.
	  1) 앵커가 있으면 그 칸
	  2) 없으면 window.fields 에서 육지 링 칸을 무작위로
	RingReturn 이 메시 / 커서 / 플레이어 좌표를 한 번에 맞추고
	Snap 을 세워 보간 없이 즉시 이동시킨다.
	그 뒤 폴링을 즉시 한 번 돌려 서버 좌표를 확정한다.
*/
$(document).on("click", "#lobby .btn.reboard", function(e){
	e.preventDefault()
	var target = null
	try{
		target = window.RingAnchor ? window.RingAnchor() : null
	}catch(err){
		target = null
	}
	if(!target){
		try{
			var f = window.fields
			if(f && f.length){
				for(var i = 0; i < 64; i++){
					var r = f[Math.floor(Math.random() * f.length)]
					if(!r){
						continue
					}
					var b = window.map.biomes[r.x + ":" + r.z]
					if(b && !b.water){
						target = { x : r.x, z : r.z }
						break
					}
				}
				if(!target && f[0]){
					target = { x : f[0].x, z : f[0].z }
				}
			}
		}catch(err){
			target = null
		}
	}
	if(!target){
		window.Notice("MAP LOADING", "Board path is not ready", 2000)
		return
	}
	window.Stage.graceCount = 0
	window.Stage.set("")
	if(window.RingReturn){
		window.RingReturn(target)
	}
	window.Notice("BACK ON PATH",
		"Returned to " + Math.floor(target.x) + ", " + Math.floor(target.z), 2400)
	try{
		if(window.Sfx){
			window.Sfx.play("step")
		}
	}catch(err){
	}
	try{
		if(OAuth3.xhr){
			OAuth3.xhr.abort()
			delete OAuth3.xhr
		}
		if(window.Poll){
			window.Poll()
		}
	}catch(err){
	}
})
window.addEventListener("hashchange", function(){
	if(window.Stage.raidTimer){
		clearInterval(window.Stage.raidTimer)
		delete window.Stage.raidTimer
	}
	if(window.Stage.doneTimer){
		clearTimeout(window.Stage.doneTimer)
		delete window.Stage.doneTimer
	}
	if(window.Stage.timeoutTimer){
		clearTimeout(window.Stage.timeoutTimer)
		delete window.Stage.timeoutTimer
	}
	if(window.Stage.miaTimer){
		clearTimeout(window.Stage.miaTimer)
		delete window.Stage.miaTimer
	}
	$("#raid .progress .bar").css("width", "0")
	window.Stage.graceCount = 0
	window.Stage.set("")
	/*
		개발 Part 80 (오버레이 정리)
		현행 문제
		  이 리스너는 타이머와 Stage.current 만 정리하고
		  DOM 에 남은 보드 전용 오버레이는 그대로 뒀다.
		    body[dead]   Dead() 가 세운다. else 분기가 없는 룸에서는 안 지워진다
		    body[game]   BoardCallback 이 세운다. 같은 이유로 남는다
		    body[jail]   StageSync 가 세운다
		    #dead        전체 화면 레이어
		  전부 Experience.jsx 개발 Part 69 의 클릭 게이트에 걸리거나
		  화면을 덮어 마이룸 입력을 봉쇄한다.
		조치
		  룸으로 넘어갈 때 함께 내린다.
		  보드로 나갈 때는 건드리지 않는다.
		  거기서는 다음 폴링이 서버 쿠키로 정확히 다시 세운다.
		  여기서 지우면 사망 상태가 한 프레임 깜빡인다.
	*/
	try{
		if(window.Mode && window.Mode() == "room"){
			window.DeadClose()
			$("body")
				.removeAttr("game")
				.removeAttr("jail")
				.removeAttr("edge")
				.removeAttr("diceable")
				.removeAttr("dicehome")
				.removeAttr("bombable")
			$("#lobby, #raid").removeClass("on")
		}
	}catch(err){
	}
})