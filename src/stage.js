/*
	개발 Part 14 (검수) - H1
	현행 상태는 "" / "lobby" / "raid" 3 가지뿐이고
	"" 가 "아직 로비를 안 띄웠음" 과 "레이드 진행 중" 을 동시에 뜻했다.
	StageSync 의 else 분기가
	  if(current != "lobby" && current != "raid") -> Lobby()
	이므로, RaidDone 이 Stage.set("") 을 한 직후
	cookies.enter 가 한 번이라도 비면 즉시 로비가 다시 떴다.
	("Start Raid 를 눌러 맵이 보였는데 다시 Start Raid 가 나온다" 의 정체)
	playing 상태를 추가해 "레이드에 들어갔다" 를 명시적으로 표현한다.
	body[stage] 는 화면 전환용이므로 playing 일 때는 속성을 붙이지 않는다
	(현행 CSS 가 stage 속성 부재를 게임 화면으로 취급한다).
*/
window.Stage = {
	current : "",
	raidTimer : null,
	miaTimer : null,
	/* enter 가 비어 보이는 폴링을 몇 번까지 견딜지 */
	graceLimit : 5,
	graceCount : 0
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

/*
	개발 Part 15 (규칙 R1 / R2)
	사망 패널.
	현행은 cookies.damage 가 오면 BoardCallback 이
	  $body.attr('game', "over")
	만 하고 폴링을 멈췄다. 화면에 아무 안내가 없어
	"멈춘 건지 죽은 건지" 구분되지 않았다.
	규칙
	  R1  폭탄 등으로 HP 가 0 이 되면 dead 표시를 띄운다.
	  R2  선택지는 마이룸 하나만 노출한다.
	      부활(Start Raid)은 마이룸에서 다시 출격하는 흐름으로 통일한다.
	#dead 패널은 #lobby 와 별도 엘리먼트다.
	없으면 body 에 직접 만든다(HTML 수정 없이 동작하게 한다).
*/
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
	/*
		개발 Part 15 (규칙 R2)
		사망 중에는 로비를 띄우지 않는다.
		Start Raid 가 노출되면 규칙 R2("마이룸만") 를 위반한다.
	*/
	if(cookies.damage || cookies.dead){
		return window.Dead()
	}
	var hash = cookies.address ? cookies.address : cookies.hash
	var role = cookies.role ? cookies.role : "PLAYER"
	/*
		개발 Part 14 (검수) - H6
		window.MaxHp 는 룰셋(src/ruleset.js) 또는 src/recipe.js 가 채운다.
		/ruleset 이 503 이고 recipe.js 로드보다 먼저 이 함수가 불리면
		window.MaxHp 가 undefined 라 인덱스 접근에서 TypeError 가 났다.
		그러면 Lobby 가 중단되어 Start Raid 버튼 자체가 렌더되지 않는다.
	*/
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
			/*
				개발 Part 14 (검수) - H6
				개발 Part 27 의 Blockie 헬퍼로 통일한다.
				hash 가 비어 있으면 "0x" 가 시드가 되어 null 이 반환됐다.
			*/
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

	window.Stage.set("lobby")
}

window.Raid = function(){
	/*
		개발 Part 14 (검수) - H3
		중복 클릭 방지.
		진행 중에 다시 누르면 raidTimer 만 갈아끼워지고
		cc:"start" 가 한 번 더 나가 raidUsed 슬롯을 낭비했다.
	*/
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
		_role = sessionStorage.raidRole ? sessionStorage.raidRole : ""
		delete sessionStorage.raidRole
	}catch(err){
	}
	/*
		개발 Part 14 (검수) - H3
		window.Action 은 players.self() 가 없으면 조용히 return 한다.
		그 경우 Stage 가 "raid" 로 고정되고 진행바가 92% 에서 멈춘다.
		StageSync 는 current == "raid" 라 Lobby() 도 띄우지 않아
		화면이 완전히 정지했다.
		Action 이 없거나 요청이 나가지 않으면 즉시 되돌린다.
		요청이 나갔더라도 응답이 오지 않으면 타임아웃으로 복구한다.
	*/
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
	window.Stage.timeoutTimer = setTimeout(function(){
		delete window.Stage.timeoutTimer
		if(window.Stage.current == "raid"){
			console.log("[stage] raid timed out. no enter in response.")
			window.RaidAbort("Deploy timed out")
		}
	}, 8000)
}
/*
	개발 Part 14 (검수) - H3
	레이드 진입 실패를 되돌린다.
	진행바를 접고 로비를 다시 띄운다.
*/
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
	/*
		개발 Part 14 (검수) - H2
		현행은 setTimeout(400) 안에서 Stage.set("") 을 했다.
		그 400ms 동안 Stage.current 가 여전히 "raid" 라
		폴링마다 RaidDone 이 다시 호출되어 타이머가 쌓였다.
		localhost 는 time.balance 가 0 이라
		  setInterval(window.Poll, 0)
		으로 폴링이 연속 발생한다. 400ms 사이에 수십 회가 들어와
		Notice("RAID START") 가 그만큼 예약되고
		Stage.set("") 도 반복 실행됐다.
		상태를 즉시 playing 으로 넘겨 재진입을 원천 차단한다.
		연출(진행바 / 알림)만 지연시킨다.
	*/
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

	/*
		개발 Part 3
		룰셋은 서버 DB 가 단일 원천이며 src/ruleset.js 가 /ruleset 으로 받아온다.
		서명 불일치는 "정적 파일 폴백 중" 또는 "룰셋 캐시가 낡음" 을 의미하므로
		경고 후 룰셋을 재로드한다.
	*/
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
		개발 Part 15 (규칙 R1 / R2)
		사망 판정을 최우선으로 둔다.
		이 아래의 raidBlocked / exitBlocked / enter 판정보다 앞서야
		죽은 뒤에 Start Raid 나 탈출 안내가 겹쳐 뜨지 않는다.
		서버는 damage(레거시) 와 dead(개발 Part 15) 를 함께 내려보낸다.
	*/
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
		/*
			개발 Part 14 (검수) - H4
			현행은 Stage.set("") 만 했다.
			Raid() 가 띄운 진행바(raidTimer)가 계속 돌고 있어
			로비가 다시 떠도 진행바가 겹쳐 보였다.
			RaidAbort 로 타이머까지 정리한다.
		*/
		window.RaidAbort("No slots left this match")
		return
	}
	if(cookies.exitBlocked){
		var keys = window.ExitKeys()
		window.Notice("EXTRACTION FAILED", "You need " + keys.join(" "), 3200)
	}
	if(cookies.exited){
		window.Notice("EXTRACTED", "Loot moved to My Room", 2600)
		/*
			개발 Part 14 (검수) - H4
			현행은 return 만 해서 Stage 가 정리되지 않았다.
			마이룸으로 이동한 뒤 보드로 돌아오면
			playing 상태가 남아 로비가 뜨지 않았다.
		*/
		window.Stage.graceCount = 0
		window.Stage.set("")
		setTimeout(function(){
			window.location.hash = (cookies.address ? cookies.address : cookies.hash).replace("0x", "")
		}, 1200)
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
			/*
				개발 Part 14 (검수) - H1
				이미 참가 중인데 로비가 떠 있거나 상태가 비어 있으면
				곧바로 playing 으로 넘긴다.
				새로고침 후 첫 폴링에서 로비가 한 번 깜빡이던 문제를 없앤다.
			*/
			window.Stage.set("playing")
		}
	}else{
		/*
			개발 Part 14 (검수) - H1
			현행은 enter 가 없으면 조건 없이 Lobby() 를 띄웠다.
			문제
			  1) #start 는 staged_writes 에 스테이징만 되고
			     커밋 분기가 죽어 있어(개발 Part 30 대상)
			     참가 상태가 영속되지 않는다.
			     Start Raid 를 누른 그 응답에만 enter 가 실리고
			     다음 폴링부터 사라져 로비로 되돌아갔다.
			  2) 커밋을 고쳐도 요청 실패 / 매치 전환 경계에서
			     enter 가 한 프레임 비는 순간이 생긴다.
			     그때마다 화면이 로비로 튀면 조작이 끊긴다.
			playing 상태에서는 graceLimit 회까지 견딘다.
			그 이상 비면 레이드가 실제로 끝난 것으로 보고 로비로 돌린다.
		*/
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
		if(window.Stage.current != "lobby" && window.Stage.current != "raid"){
			if(window.Mode() == "board"){
				window.Lobby()
			}
		}
	}
}

$(document).on("click", "#lobby .btn.raid", function(e){
	e.preventDefault()

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
/*
	개발 Part 14 (검수) - H5
	보드 <-> 마이룸 전환 시 Stage 를 초기화한다.
	현행은 상태가 남아
	  마이룸 -> 보드 : playing 이 남아 로비가 뜨지 않음
	  보드   -> 마이룸 : lobby 가 남아 룸 화면 위에 로비가 겹침
	가 발생했다.
	src/index.js 의 window.onhashchange 가 RolePanel / myroom 을 닫는 것과
	같은 시점에 동작하도록 hashchange 이벤트에 직접 붙인다.
*/
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