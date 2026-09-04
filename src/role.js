window.RoleSpec = {
	"" : {
		name : "PLAYER",
		emoji : "😀",
		hp : 10,
		backpack : 3,
		desc : { ko : "보드판에서 부동산을 사고 통행료를 모읍니다.", en : "Buy property and collect tolls on the board." }
	},
	"PLAYER" : {
		name : "PLAYER",
		emoji : "😀",
		hp : 10,
		backpack : 3,
		desc : { ko : "보드판에서 부동산을 사고 통행료를 모읍니다.", en : "Buy property and collect tolls on the board." }
	},
	"PMC" : {
		name : "PMC",
		emoji : "⚔",
		hp : 8,
		backpack : 1,
		desc : { ko : "파밍 구역에 난입해 부자 유저를 사냥합니다.", en : "Raid the farming zone and hunt wealthy players." }
	},
	"SCAV" : {
		name : "SCAV",
		emoji : "🗡",
		hp : 5,
		backpack : 1,
		desc : { ko : "희귀 아이템을 모아 탈출구로 빠져나갑니다.", en : "Gather rare items and extract through a port." }
	},
	"UCAV" : {
		name : "UCAV",
		emoji : "🛩",
		hp : 8,
		backpack : 0,
		desc : { ko : "부동산 3개 이상 보유 시 자동 소환되는 방어 드론입니다.", en : "A defense drone summoned by owning 3+ properties." }
	}
}

window.RolePanel = function(){
	var cookies = window.cookies

	if(!cookies){
		return
	}

	var role = cookies.role ? cookies.role : ""
	var spec = window.RoleSpec[role] ? window.RoleSpec[role] : window.RoleSpec[""]

	var maxHp = spec.hp
	var hp = typeof cookies.hp != "undefined" ? cookies.hp * 1 : maxHp
	var balance = cookies.balance ? cookies.balance * 1 : 0
	var property = cookies.property ? cookies.property * 1 : 0

	var equipment = []

	try{
		equipment = JSON.parse(cookies.equipment)
	}catch(err){
		equipment = []
	}

	var slots = ""

	for(var s = 0; s < spec.backpack; s++){
		var icon = equipment[s] ? equipment[s] : ""

		slots += '<li class="slot '+(icon ? "on" : "")+'" index="'+s+'" emoji="'+icon+'">\
			<a class="emoji color">'+icon+'</a>\
		</li>'
	}

	if(!slots){
		slots = '<li class="slot empty"><a class="emoji color"></a></li>'
	}

	var ucav = Math.min(Math.floor(property / 3), 2)

	var enlistable = (role == "" || role == "PLAYER") && property == 0 && balance >= 500

	var body = '<div class="role_head">\
		<div class="role_icon"><a class="emoji color">'+spec.emoji+'</a></div>\
		<div class="role_meta">\
			<strong class="role_name">'+spec.name+'</strong>\
			<p class="role_desc">\
				<span class="ko">'+spec.desc.ko+'</span>\
				<span class="en">'+spec.desc.en+'</span>\
			</p>\
		</div>\
	</div>\
	<ul class="role_stat">\
		<li class="stat hp"><i class="emoji color">❤️</i><span>'+hp+' / '+maxHp+'</span></li>\
		<li class="stat balance"><i class="emoji color">🪙</i><span>'+balance+'</span></li>\
		<li class="stat property"><i class="emoji color">🏠</i><span>'+property+'</span></li>\
		<li class="stat ucav"><i class="emoji color">🛩</i><span>'+ucav+'</span></li>\
	</ul>\
	<div class="role_loadout">\
		<strong class="label">\
			<span class="ko">장비</span>\
			<span class="en">Loadout</span>\
		</strong>\
		<ul class="slots">'+slots+'</ul>\
	</div>\
	<div class="role_action">\
		<a class="btn continue">\
			<span class="ko">'+(cookies.damage ? "부활" : "시작")+'</span>\
			<span class="en">'+(cookies.damage ? "Respawn" : "Start")+'</span>\
		</a>\
		'+(enlistable ? '<a class="btn enlist">\
			<span class="ko">자원 입대 (🪙500)</span>\
			<span class="en">Enlist (🪙500)</span>\
		</a>' : '')+'\
	</div>'

	var $panel = $("#role")

	if(!$panel.length){
		$("body").append('<div id="role"><div class="tb"><div class="tc"></div></div></div>')

		$panel = $("#role")
	}

	var $tc = $panel.find(".tc")

	var before_body = $tc.html()

	if(before_body){
		before_body = before_body.replace(/\t/gi,"").replace(/\n/gi,"").trim()
	}

	var after_body = body.replace(/\t/gi,"").replace(/\n/gi,"").trim()

	if(before_body != after_body){
		$tc.html(after_body)
	}

	$("body").attr("role", role)

	return $panel
}

window.RolePanel.open = function(){
	window.RolePanel()

	$("#role").addClass("on")
	$("body").attr("panel", "role")
}

window.RolePanel.close = function(){
	$("#role").removeClass("on")
	$("body").removeAttr("panel")
}
/*
	개발 Part 17 (출격)
	보드에서 🎲 를 눌렀을 때 뜨는 역할 선택 레이어.
	기존 .layer / form.popup 마크업 규약을 그대로 쓰므로
	index.html 수정 없이 동작하고, back.close 클릭 시
	BoardInit 의 ".layer .close" 위임 핸들러가 닫아 준다.
	슬롯 판정은 stage.js 의 RaidSlots() 를 그대로 재사용한다.
	  aborted  UCAV 만 남는다
	  PMC 사용 UCAV 만 남는다
	  raidBlocked 서버가 거절한 상태면 둘 다 잠근다
	역할별 규칙(안내 문구와 실제 서버 동작이 일치해야 한다)
	  PMC   링(EDGE)에서 시작. 주사위 이동. 링 위에서는 폭탄/피격 무효
	  UCAV  내륙에서 시작. 자유 이동. 주사위 금지. 링 진입 금지
*/
window.RolePick = function(){
	var cookies = window.cookies
	if(!cookies){
		return null
	}
	if(cookies.damage || cookies.dead){
		if(window.Dead){
			window.Dead()
		}
		return null
	}
	var slots = window.RaidSlots ? window.RaidSlots() : { pmc : true, ucav : true, any : true }
	var blocked = cookies.raidBlocked ? true : false
	var pmcOk = slots.pmc && !blocked
	var ucavOk = slots.ucav && !blocked
	/*
		개발 Part 18 (문구 / 위치 인식)
		Part 17 의 UCAV 설명 "주사위를 굴릴 수 없습니다" 가
		"지금 이 칸에서는 주사위를 못 굴린다" 로 읽혀 오해를 만들었다.
		실제 의미는 "UCAV 라는 역할이 주사위를 쓰지 않는다" 이다.
		또한 현재 서 있는 칸이 링(EDGE)인지 내륙인지를 머리말에 명시해
		"이 팝업이 왜 떴는지" 를 즉시 알 수 있게 한다.
		판정은 전부 프론트 window.fields 기준(EdgeField)이다.
	*/
	var _here = null
	try{
		var _me = window.players.self()
		_here = window.EdgeField ? window.EdgeField(_me.x, _me.z) : null
	}catch(err){
		_here = null
	}
	var onEdge = _here ? true : false
	var whereBody = '<p class="role_pick_where">\
		<span class="ko">현재 위치 : ' + (onEdge ? "주사위 경로(EDGE)" : "내륙 필드") + '</span>\
		<span class="en">You are on : ' + (onEdge ? "the dice path (EDGE)" : "the inland field") + '</span>\
	</p>'
	var body = '<div class="role_pick_head">\
		<strong class="title">\
			<span class="ko">출격 역할 선택</span>\
			<span class="en">Choose your role</span>\
		</strong>\
		' + whereBody + '\
	</div>\
	<div class="role_pick_body">\
		<a class="btn role ' + (pmcOk ? "" : "disabled") + '" data-role="PMC">\
			<i class="emoji color">⚔</i>\
			<strong>PMC</strong>\
			<span class="ko">주사위 경로(EDGE)에 배치됩니다. 주사위로 전진합니다.</span>\
			<span class="en">Deploys on the dice path. Moves by dice.</span>\
		</a>\
		<a class="btn role ' + (ucavOk ? "" : "disabled") + '" data-role="UCAV">\
			<i class="emoji color">🛩</i>\
			<strong>UCAV</strong>\
			<span class="ko">내륙 필드에 배치됩니다. 전투와 파밍 전용이며 주사위는 PMC 전용입니다.</span>\
			<span class="en">Deploys inland. Combat and farming only. Dice is PMC only.</span>\
		</a>\
	</div>'
	if(!pmcOk && !ucavOk){
		body += '<p class="reason">\
			<span class="ko">이번 매치의 출격 슬롯을 모두 사용했습니다.</span>\
			<span class="en">No deploy slot left this match.</span>\
		</p>'
	}
	var $form = $('form[name="RolePick"]')
	if(!$form.length){
		$(".layer").append('<form name="RolePick" class="popup"><back class="close">❌</back></form>')
		$form = $('form[name="RolePick"]')
	}
	/*
		개발 Part 18
		머리말에 위치 안내(.role_pick_where)가 추가되었으므로
		재렌더 시 함께 지운다. 남겨두면 팝업을 열 때마다 누적된다.
	*/
	$form.find(".role_pick_head, .role_pick_body, .role_pick_where, .reason").remove()
	$form.prepend(body)
	$(".layer").addClass("on")
	$form.addClass("on")
	return $form
}
$(document).on("click", 'form[name="RolePick"] .btn.role', function(e){
	e.preventDefault()
	var $t = $(this)
	if($t.hasClass("disabled")){
		return
	}
	var role = $t.attr("data-role") ? $t.attr("data-role") : ""
	/*
		stage.js 의 Raid() 가 sessionStorage.raidRole 을 읽어
		Action({ cc : "start", role : _role }) 로 보낸다.
		읽은 뒤 즉시 지우므로 다음 출격에 새지 않는다.
	*/
	try{
		sessionStorage.raidRole = role
	}catch(err){
	}
	$(".layer, .layer form.popup").removeClass("on")
	if(window.Raid){
		window.Raid()
	}
})

window.Enlist = function(){
	var bool = window.confirm("Enlist as PMC? 500 coins will be burned.")

	if(!bool){
		return
	}

	window.RolePanel.close()

	if(window.Action){
		window.Action({
			cc : "enlist"
		})
	}
}

window.Exit = function(){
	var cookies = window.cookies

	if(!cookies || !cookies.exitable){
		return
	}

	if(window.Action){
		window.Action({
			cc : "exit"
		})
	}
}

$(document).on("click", "#role .btn.enlist", function(e){
	e.preventDefault()

	window.Enlist()
})

$(document).on("click", "#role .role_loadout .slot", function(e){
	e.preventDefault()

	var emoji = $(this).attr("emoji")

	if(emoji){
		if(window.Equipment){
			window.Equipment([], [emoji])
		}
	}else{
		$(".aside").attr("sort", "sticker").addClass("more")
	}
})

$(document).on("click", ".btn.exit, .hashType.Exit", function(e){
	e.preventDefault()

	window.Exit()
})