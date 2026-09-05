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
	if(cookies.damage || cookies.dead){
		return false
	}
	if(cookies.raidBlocked){
		return false
	}
	return window.RaidSlots().any
}

window.Dead = function(){
	var cookies = window.cookies
	if(!cookies){
		return
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
	window.location.hash = (cookies.address ? cookies.address : cookies.hash).replace("0x", "")
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
		var blocked = window.Stage.blocked ? window.Stage.blocked : ""
		if(!blocked && !window.CanRaid()){
			blocked = "No slots left this match"
		}
		if(blocked){
			$raid.addClass("disabled").hide()
			$reason.show().html('<strong class="head">DEPLOY FAILED</strong>\
				<span class="body">' + blocked + '</span>')
		}else{
			$raid.removeClass("disabled").show()
			$reason.hide().html("")
		}
		$stash.show()
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
		window.Notice("RAID START", "Roll the dice to move", 2200)
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
		if(cookies.raidDeny == "pmc_used"){
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
		var _saved = cookies.miaSaved ? cookies.miaSaved * 1 : 0
		var _burned = cookies.miaBurned ? cookies.miaBurned * 1 : 0
		var _miaBody = "The match ended while you were deployed."
		if(_saved > 0){
			_miaBody += " " + _saved + " kept in your stash"
			if(_burned > 0){
				_miaBody += ", " + _burned + " lost"
			}
		}else if(_burned > 0){
			_miaBody += " " + _burned + " lost"
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
	if(cookies.enter){
		/*
			개발 Part 14 (검수) - H1
			enter 가 확인되면 유예 카운터를 초기화한다.
		*/
		window.Stage.graceCount = 0
		var limit = cookies.raidLimit ? cookies.raidLimit * 1 : 20 * 60 * 1000
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
			window.Stage.set("")
			return
		}
		if(window.Stage.current != "lobby" && window.Stage.current != "raid"){
			if(window.Mode() == "board" && !_onBoard){
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
	window.location.hash = (cookies.address ? cookies.address : cookies.hash).replace("0x", "")
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
})