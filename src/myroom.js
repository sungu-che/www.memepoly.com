window.MyRoomEnter = function(cookies){
	/*
		개발 Part 42 (슬롯 판정 통일)
		현행 문제
		  cookies.raidUsed.split(",") 로 직접 파싱했다.
		  participation 은 raids_used 를 JSON 배열로 저장하므로
		  '["PMC"]' 형식이 오면 split(",") 이 ['["PMC"]'] 를 만들고
		  indexOf("PMC") 가 -1 이 된다.
		  PMC 를 이미 썼는데 버튼이 활성으로 보이고,
		  눌러도 서버가 raidBlocked 로 거절한다.
		  개발 Part 29 에서 stage.js 의 RaidSlots() 는 두 형식을 모두
		  받아들이도록 고쳤는데 여기만 남아 규칙이 두 벌이 됐다.
		  raidBlocked / 사망 판정도 빠져 있었다.
		조치
		  RaidSlots() 하나로 통일한다.
		  CanRaid() 는 사망 / raidBlocked / 슬롯 소진을 한 번에 본다.
		stage.js 는 index.html 에서 myroom.js 보다 뒤에 로드되지만
		이 함수는 런타임에 호출되므로 그때는 이미 준비돼 있다.
		그래도 폴백을 둔다.
	*/
	var slots = window.RaidSlots ? window.RaidSlots() : null
	if(!slots){
		var _used = []
		try{
			var _raw = cookies.raidUsed
			if(Array.isArray(_raw)){
				_used = _raw
			}else if(_raw){
				var _str = String(_raw).trim()
				_used = (_str.indexOf("[") === 0) ? JSON.parse(_str) : _str.split(",")
			}
		}catch(err){
			_used = []
		}
		_used = _used.filter(function(v){ return v && String(v).length > 0 })
			.map(function(v){ return String(v).toUpperCase() })
		slots = {
			aborted : cookies.raidAborted ? true : false,
			pmc : _used.indexOf("PMC") == -1 && !cookies.raidAborted,
			ucav : _used.indexOf("UCAV") == -1
		}
	}
	var blocked = (cookies.raidBlocked || cookies.damage || cookies.dead) ? true : false
	var pmcOk = slots.pmc && !blocked
	var ucavOk = slots.ucav && !blocked
	var body = ""
	body += '<a class="btn board '+(pmcOk ? "" : "disabled")+'" data-role="PMC">\
		<i class="emoji color">⚔</i>\
		<span class="ko">'+(pmcOk ? "PMC 출격" : "PMC 사용됨")+'</span>\
		<span class="en">'+(pmcOk ? "Deploy PMC" : "PMC used")+'</span>\
	</a>'
	body += '<a class="btn board '+(ucavOk ? "" : "disabled")+'" data-role="UCAV">\
		<i class="emoji color">🛩</i>\
		<span class="ko">'+(ucavOk ? "UCAV 출격" : "UCAV 사용됨")+'</span>\
		<span class="en">'+(ucavOk ? "Deploy UCAV" : "UCAV used")+'</span>\
	</a>'
	if(!pmcOk && !ucavOk){
		/*
			개발 Part 42 (사유 구분)
			"세션 종료" 하나로 뭉뚱그리면 왜 못 나가는지 알 수 없다.
			사망 중이면 다음 매치가 아니라 부활이 먼저다.
		*/
		var tip = { ko : "이번 세션은 종료되었습니다. 다음 매치를 기다리세요.",
			en : "This session is over. Wait for the next match." }
		if(cookies.damage || cookies.dead){
			tip = { ko : "전사 상태입니다. 다음 매치에 다시 출격할 수 있습니다.",
				en : "You are down. Deploy again next match." }
		}else if(slots.aborted){
			tip = { ko : "이번 매치에서 전사했습니다. PMC 는 다음 매치부터.",
				en : "You went down this match. PMC returns next match." }
		}
		body += '<p class="tip">\
			<span class="ko">' + tip.ko + '</span>\
			<span class="en">' + tip.en + '</span>\
		</p>'
	}
	return body
}
window.MyRoom = function(resp){
	var cookies = window.cookies

	if(!cookies || !cookies.hash){
		return
	}

	var player_hash = cookies.address ? cookies.address : cookies.hash

	var hash = window.location.hash.replace("#","").toLowerCase()

	var owner = player_hash.replace("0x","").toLowerCase()

	if(!hash || hash != owner){
		$("#myroom").removeClass("on")
		$("body").removeAttr("myroom")

		return
	}

	var rows = []

	try{
		rows = resp.body.rows
	}catch(err){
		rows = []
	}

	/*
		개발 Part 42 (보관품 판정)
		현행 문제
		  row.Subject != "#myroom" 하나로만 걸렀다.
		  개발 Part 5 에서 보관품이 stash_items 로 이관되면서
		  inventoryService.toLegacyRows 가 __state / __kind 를 실어 보낸다.
		  Subject 표기가 조금이라도 달라지면 목록이 통째로 비어
		  "보관된 아이템이 없습니다" 만 뜬다.
		  실제로 전리품이 DB 에 있는데 화면에는 없는 상태가 된다.
		조치
		  세 가지 신호 중 하나라도 맞으면 보관품으로 본다.
		    __state === "stash"      개발 Part 5 이후 정식 경로
		    __kind === "stash"       어댑터가 kind 로 표기하는 경우
		    Subject === "#myroom"    레거시
		이모지도 컬럼을 우선 쓰고 없을 때만 Cc 를 파싱한다.
	*/
	var emojiOf = function(row){
		if(row.emoji){
			return row.emoji
		}
		if(row.Emoji){
			return row.Emoji
		}
		try{
			return row.Cc.split("@")[1]
		}catch(err){
			return ""
		}
	}
	var isStash = function(row){
		if(row.__state === "stash"){
			return true
		}
		if(row.__kind === "stash"){
			return true
		}
		return row.Subject === "#myroom"
	}
	/*
		소지품(held)도 함께 모은다.
		현행은 보관품만 그려서 "꺼내기" 만 가능했고,
		넣는 방향은 .hashType.Deposit 핸들러만 있고
		그 클래스를 만드는 곳이 없어 도달 불가였다.
		즉 소지품을 창고에 넣을 수단이 아예 없었다.
		판정 기준은 room.js 의 sticker 수집과 같다.
		  #asset 이고 수신자가 나이며 Flag 가 비어 있다
	*/
	var stored = []
	var held = []
	for(var r = 0; r < rows.length; r++){
		var row = rows[r]
		if(!row){
			continue
		}
		var emoji = emojiOf(row)
		if(!emoji){
			continue
		}
		if(isStash(row)){
			if(!stored[emoji]){
				stored[emoji] = []
				stored.push(emoji)
			}
			stored[emoji].push(row)
			continue
		}
		var _isHeld = false
		if(row.__state === "held"){
			_isHeld = true
		}else if(row.Subject === "#asset" && row.To == player_hash && !row.Flag){
			_isHeld = true
		}
		if(_isHeld){
			if(!held[emoji]){
				held[emoji] = []
				held.push(emoji)
			}
			held[emoji].push(row)
		}
	}

	var items_body = ""

	for(var i = 0; i < stored.length; i++){
		var emoji = stored[i]
		var group = stored[emoji]
		var equip = window.typeof_equipment(emoji)
		var label = equip ? equip.name : (window.typeof_item(emoji) ? window.typeof_item(emoji) : "")

		items_body += '<li class="item" emoji="'+emoji+'" cnt="'+group.length+'" type="'+(equip ? equip.subgroup : "material")+'">\
			<a class="emoji color">'+emoji+'</a>\
			<span class="cnt">'+group.length+'</span>\
			<span class="name">'+label+'</span>\
			<a class="btn withdraw">\
				<span class="ko">꺼내기</span>\
				<span class="en">Take</span>\
			</a>\
		</li>'
	}

	if(!items_body){
		items_body = '<li class="item empty">\
			<p>\
				<span class="ko">보관된 아이템이 없습니다.</span>\
				<span class="en">Nothing stored yet.</span>\
			</p>\
		</li>'
	}
	/*
		개발 Part 42 (넣기)
		소지품을 창고로 넣는 목록.
		버튼 클래스를 hashType Deposit 으로 두어
		이 파일 하단의 기존 위임 핸들러가 그대로 받게 한다.
		(핸들러는 있었으나 이 클래스를 만드는 곳이 없어 죽어 있었다)
	*/
	var held_body = ""
	for(var h = 0; h < held.length; h++){
		var _he = held[h]
		var _hg = held[_he]
		var _heq = window.typeof_equipment(_he)
		var _hlabel = _heq ? _heq.name : (window.typeof_item(_he) ? window.typeof_item(_he) : "")
		held_body += '<li class="item" emoji="' + _he + '" cnt="' + _hg.length + '">\
			<a class="emoji color">' + _he + '</a>\
			<span class="cnt">' + _hg.length + '</span>\
			<span class="name">' + _hlabel + '</span>\
			<a class="btn hashType Deposit" emoji="' + _he + '">\
				<span class="ko">넣기</span>\
				<span class="en">Store</span>\
			</a>\
		</li>'
	}
	if(!held_body){
		held_body = '<li class="item empty">\
			<p>\
				<span class="ko">가지고 있는 아이템이 없습니다.</span>\
				<span class="en">You are carrying nothing.</span>\
			</p>\
		</li>'
	}

	var role = cookies.role ? cookies.role : ""
	var spec = window.RoleSpec[role] ? window.RoleSpec[role] : window.RoleSpec[""]

	var body = '<header class="myroom_head">\
		<div class="icon"></div>\
		<div class="meta">\
			<span class="address">\
				<address>\
					<span>#'+owner+'</span>\
					<span dir="rtl">'+owner+'</span>\
				</address>\
			</span>\
			<ul class="summary">\
				<li><i class="emoji color">'+spec.emoji+'</i><span>'+spec.name+'</span></li>\
				<li><i class="emoji color">🪙</i><span>'+(cookies.balance ? cookies.balance : 0)+'</span></li>\
				<li><i class="emoji color">🏠</i><span>'+(cookies.property ? cookies.property : 0)+'</span></li>\
				<li><i class="emoji color">🎒</i><span>'+stored.length+'</span></li>\
			</ul>\
		</div>\
		<a class="btn close myroom_close">\
			<span class="ko">닫기</span>\
			<span class="en">Close</span>\
		</a>\
	</header>\
	<section class="myroom_body">\
		<strong class="label">\
			<span class="ko">마이룸 보관함</span>\
			<span class="en">Stash</span>\
		</strong>\
		<ul class="stash">'+items_body+'</ul>\
		<strong class="label">\
			<span class="ko">소지품</span>\
			<span class="en">Carried</span>\
		</strong>\
		<ul class="stash carried">'+held_body+'</ul>\
	</section>\
	<footer class="myroom_foot">'+window.MyRoomEnter(cookies)+'</footer>'

	var $panel = $("#myroom")

	if(!$panel.length){
		$("body").append('<div id="myroom"><div class="tb"><div class="tc"></div></div></div>')

		$panel = $("#myroom")
	}

	var $tc = $panel.find(".tc")

	var before_body = $tc.html()

	if(before_body){
		before_body = before_body.replace(/\t/gi,"").replace(/\n/gi,"").trim()
	}

	var after_body = body.replace(/\t/gi,"").replace(/\n/gi,"").trim()

	if(before_body != after_body){
		$tc.html(after_body)
		try{
			/*
				개발 Part 14 (검수) - E7'
				"0x"+owner 는 owner 가 빈 문자열일 때 "0x" 가 된다.
				Blockie 가 시드를 정규화하고 null 대신 폴백 캔버스를 돌려준다.
			*/
			var canvas = window.Blockie(owner)
			if(canvas){
				$panel.find(".myroom_head .icon").html("").append(canvas)
			}
		}catch(err){
		}
	}

	$panel.addClass("on")
	$("body").attr("myroom", "on")

	return $panel
}

$(document).on("click", "#myroom .stash .item .btn.withdraw", function(e){
	e.preventDefault()

	var emoji = $(this).closest(".item").attr("emoji")

	if(!emoji || !window.Action){
		return
	}

	window.Action({
		cc : "deposit",
		direction : "withdraw",
		item : emoji
	})
})

$(document).on("click", "#myroom .myroom_foot .btn.board", function(e){
	e.preventDefault()
	var $t = $(this)
	if($t.hasClass("disabled")){
		return
	}
	try{
		sessionStorage.raidRole = $t.attr("data-role") ? $t.attr("data-role") : ""
	}catch(err){
	}
	$("#myroom").removeClass("on")
	$("body").removeAttr("myroom")
	if(window.history && window.history.replaceState){
		window.history.replaceState(null, "", window.location.pathname)
	}
	window.location.hash = ""
	if(window.onhashchange){
		window.onhashchange()
	}
})
$(document).on("click", "#myroom .myroom_close", function(e){
	e.preventDefault()

	$("#myroom").removeClass("on")
	$("body").removeAttr("myroom")
})

$(document).on("click", ".hashType.Deposit", function(e){
	e.preventDefault()

	if(!window.Action){
		return
	}

	var emoji = $(this).attr("emoji")

	window.Action({
		cc : "deposit",
		direction : "deposit",
		item : emoji ? emoji : ""
	})
})