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
		hp : 3,
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
	var blocked = (cookies.matchFull || cookies.raidBlocked) ? true : false
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
	/*
		개발 Part 29 (선택 결과 고지)
		현행 문제
		  버튼이 잠긴 이유를 어디에도 표시하지 않았다.
		  서버는 PMC 슬롯이 없으면 말없이 UCAV 를 배정했는데,
		  팝업은 PMC 를 정상 버튼으로 그리고 있었다.
		  사용자는 PMC 를 눌렀다고 기억하는데 UCAV 로 출격된다.
		조치
		  잠긴 이유를 버튼에 직접 붙인다.
		  PMC 가 "그 자리에서 출격" 인지 "게이트로 이동" 인지도 명시한다.
		  (서버 개발 Part 29 의 제자리 출격과 문구를 맞춘다)
	*/
	var pmcWhy = ""
	if(!pmcOk){
		if(cookies.matchFull){
			pmcWhy = { ko : "이번 세션의 정원이 가득 찼습니다.", en : "This session is full." }
		}else if(blocked){
			pmcWhy = { ko : "서버가 출격을 거절했습니다.", en : "Server refused the deploy." }
		}else if(slots.aborted){
			pmcWhy = { ko : "이번 매치에서 전사했습니다. PMC 는 다음 매치부터.", en : "You went down this match. PMC returns next match." }
		}else{
			pmcWhy = { ko : "이번 매치에서 PMC 를 이미 사용했습니다.", en : "PMC already used this match." }
		}
	}
	var ucavWhy = ""
	if(!ucavOk){
		if(cookies.matchFull){
			ucavWhy = { ko : "이번 세션의 정원이 가득 찼습니다.", en : "This session is full." }
		}else if(blocked){
			ucavWhy = { ko : "서버가 출격을 거절했습니다.", en : "Server refused the deploy." }
		}else{
			ucavWhy = { ko : "이번 매치에서 UCAV 를 이미 사용했습니다.", en : "UCAV already used this match." }
		}
	}
	var pmcDesc = onEdge
		? { ko : "주사위 경로 위, 지금 서 있는 칸에서 그대로 출격합니다.", en : "Deploys on the dice path, right where you stand." }
		: { ko : "주사위 경로(EDGE)의 게이트 칸으로 이동해 배치됩니다.", en : "Moves to a gate tile on the dice path." }
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
			<span class="ko">' + pmcDesc.ko + '</span>\
			<span class="en">' + pmcDesc.en + '</span>\
			' + (pmcWhy ? '<em class="why"><span class="ko">' + pmcWhy.ko + '</span><span class="en">' + pmcWhy.en + '</span></em>' : '') + '\
		</a>\
		<a class="btn role ' + (ucavOk ? "" : "disabled") + '" data-role="UCAV">\
			<i class="emoji color">🛩</i>\
			<strong>UCAV</strong>\
			<span class="ko">주사위 경로 안쪽 내륙 칸에 배치됩니다. 경로에는 올라갈 수 없습니다.</span>\
			<span class="en">Placed on an inland tile inside the dice path. The path itself is off limits.</span>\
			<span class="ko">보유 코인은 잠기고 0에서 시작합니다. 탈출해야 코인과 아이템을 가져갑니다.</span>\
			<span class="en">Your coins are sealed and you start at 0. Extract to keep the coins and loot.</span>\
			<span class="ko">전사하거나 탈출하지 못하면 아이템 보장 없이 전부 잃습니다.</span>\
			<span class="en">Die or fail to extract and you lose everything. No item guarantee.</span>\
			' + (ucavWhy ? '<em class="why"><span class="ko">' + ucavWhy.ko + '</span><span class="en">' + ucavWhy.en + '</span></em>' : '') + '\
		</a>\
	</div>'
	if(!pmcOk && !ucavOk){
		body += '<p class="reason">\
			<span class="ko">이번 매치의 출격 슬롯을 모두 사용했습니다. 계속 주사위를 굴리세요.</span>\
			<span class="en">No deploy slot left this match. Keep rolling the dice.</span>\
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
	/* 개발 Part 29 : .why 도 함께 지운다. 남기면 열 때마다 누적된다 */
	$form.find(".role_pick_head, .role_pick_body, .role_pick_where, .reason, .why").remove()
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
    var role = $t.attr("data-role") ? String($t.attr("data-role")).toUpperCase() : ""
    if(role !== "PMC" && role !== "UCAV"){
        return
    }
    if(window.RaidRoleSet){
        window.RaidRoleSet(role)
    }else{
        try{
            sessionStorage.setItem("raidRole", role)
        }catch(err){
        }
    }
    try{
        if(window.Stage){
            window.Stage.blocked = ""
            window.Stage.graceCount = 0
        }
    }catch(err){
    }
    $(".layer, .layer form.popup").removeClass("on")
    console.log("[role] deploy picked :: " + role)
    if(window.Raid){
        window.Raid(role)
        return
    }
    if(window.Action){
        window.Action({ cc : "start", role : role })
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
/*
	개발 Part 65 (탈출 확인)
	현행 문제
	  게이트(🚪) 슬롯이 미출격이면 RolePick(역할 선택)을 띄웠다.
	  링 위에서 주사위를 굴리는 것 자체가 PMC 활동이므로
	  거기서 역할을 다시 고르라는 것은 같은 것을 두 번 묻는 셈이다.
	  출격 중이면 확인 없이 즉시 나가버려 오조작으로 판을 끝낼 수 있었다.
	조치
	  게이트(또는 UCAV 내륙 탈출 구역)에서는 이 팝업 하나만 띄운다.
	  안내 문구 + 탈출 버튼. 역할 선택지는 없다.
	버튼 활성 조건
	  서버가 내려준 cookies.exitable 하나로 판정한다.
	  프론트가 따로 계산하면 서버와 갈려 "눌리는데 실패" 가 생긴다.
	비활성 사유
	  notdeployed  출격 상태가 아니다
	  nokey        탈출키가 없다
	사유를 감추지 않고 그대로 보여준다. 왜 못 나가는지 알아야 다음 행동이 정해진다.
*/
window.ExitPick = function(){
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
	var keys = window.ExitKeys ? window.ExitKeys() : []
	var hold = cookies.exitHold ? cookies.exitHold : ""
	var zone = false
	try{
		var _me = window.players.self()
		var _sf = window.EdgeField ? window.EdgeField(_me.x, _me.z) : null
		if(!_sf && window.ExitZone){
			zone = window.ExitZone(_me.x, _me.z)
		}
	}catch(err){
		zone = false
	}
	/*
		개발 Part 68 (자유 탈출구)
		이 칸이 자유 탈출구면 키 없이 나갈 수 있다.
		서버 cookies.exitFreeHere 를 우선 믿고,
		아직 응답이 오지 않은 프레임에서는 같은 식의 결정론 판정으로 보완한다.
		(FreeExit 은 서버 isFreeExit 과 동일한 해시다)
	*/
	var free = false
	try{
		free = cookies.exitFreeHere
			? true
			: (window.FreeExitSelf ? window.FreeExitSelf() : false)
	}catch(err){
		free = false
	}
	var ready = (cookies.exitable || free) ? true : false
	var where = zone
		? { ko : "현재 위치 : 내륙 탈출 구역", en : "You are on : an inland extraction zone" }
		: { ko : "현재 위치 : 주사위 경로의 게이트", en : "You are on : a gate on the dice path" }
	var have = cookies.exitHave ? cookies.exitHave * 1 : 0
	var need = cookies.exitNeed ? cookies.exitNeed * 1 : keys.length
	if(isNaN(have)){
		have = 0
	}
	if(isNaN(need)){
		need = keys.length
	}
	var missing = []
	for(var m = 0; m < keys.length; m++){
		if(hold.indexOf(keys[m]) === -1){
			missing.push(keys[m])
		}
	}
	var why = null
	if(!ready){
		why = keys.length
			? {
				ko : "탈출키 " + have + " / " + need + " 개. " +
					(missing.length ? (missing.join(" ") + " 를 더 모아야 합니다.") : "키를 모아야 합니다."),
				en : "Extraction keys " + have + " / " + need + ". " +
					(missing.length ? ("Still need " + missing.join(" ") + ".") : "Collect the keys first.")
			}
			: {
				ko : "탈출키가 없습니다.",
				en : "You need an extraction key."
			}
	}
	var keyBody = ""
	for(var k = 0; k < keys.length; k++){
		var _hasKey = hold.indexOf(keys[k]) > -1
		keyBody += '<i class="emoji color' + (_hasKey ? " on" : "") + '">' + keys[k] + '</i>'
	}
	var noteBody = free
		? '<p class="exit_pick_free">\
			<span class="ko">이 출구는 탈출키가 필요 없습니다.</span>\
			<span class="en">This exit needs no extraction key.</span>\
		</p>'
		: (keyBody ? '<p class="exit_pick_keys">\
			<span class="ko">이번 판 탈출키 (' + have + ' / ' + need + ')</span>\
			<span class="en">Keys this match (' + have + ' / ' + need + ')</span>\
			<span class="list">' + keyBody + '</span>\
		</p>' : '')
	var descKo = free
		? "탈출키 없이 판을 빠져나갑니다. 소지품은 그대로 남습니다."
		: ("탈출키 " + need + "개를 반납하고 판을 빠져나갑니다. 나머지 소지품은 그대로 남습니다.")
	var descEn = free
		? "Leave the match without a key. Your carried items stay with you."
		: ("Hand over " + need + " keys and leave the match. The rest of your loot stays with you.")
	var body = '<div class="exit_pick_head">\
		<strong class="title">\
			<span class="ko">탈출하시겠습니까?</span>\
			<span class="en">Extract now?</span>\
		</strong>\
		<p class="exit_pick_where">\
			<span class="ko">' + where.ko + '</span>\
			<span class="en">' + where.en + '</span>\
		</p>\
		' + noteBody + '\
	</div>\
	<div class="exit_pick_body">\
		<a class="btn exit ' + (ready ? "" : "disabled") + '">\
			<i class="emoji color">' + (free ? "🏳" : "🚪") + '</i>\
			<strong>\
				<span class="ko">탈출</span>\
				<span class="en">Extract</span>\
			</strong>\
			<span class="ko">' + descKo + '</span>\
			<span class="en">' + descEn + '</span>\
			' + (why ? '<em class="why"><span class="ko">' + why.ko + '</span><span class="en">' + why.en + '</span></em>' : '') + '\
		</a>\
	</div>'
	var $form = $('form[name="ExitPick"]')
	if(!$form.length){
		$(".layer").append('<form name="ExitPick" class="popup"><back class="close">❌</back></form>')
		$form = $('form[name="ExitPick"]')
	}
	/* 개발 Part 68 : .exit_pick_free 도 함께 지운다. 남기면 열 때마다 누적된다 */
	$form.find(".exit_pick_head, .exit_pick_body, .exit_pick_where, .exit_pick_keys, .exit_pick_free, .why").remove()
	$form.prepend(body)
	$('tooltip').removeClass("on")
	$("body").removeAttr("tooltip")
	$(".layer").addClass("on")
	$form.addClass("on")
	return $form
}
$(document).on("click", 'form[name="ExitPick"] .btn.exit', function(e){
	e.preventDefault()
	if($(this).hasClass("disabled")){
		return
	}
	$(".layer, .layer form.popup").removeClass("on")
	if(window.Exit){
		window.Exit()
	}
})
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

/*
	개발 Part 65 (탈출 확인)
	여기 있던 위임을 제거한다.
	  .hashType.Exit  BoardInit 클릭 핸들러가 ExitPick 으로 넘긴다
	  .btn.exit       ExitPick 팝업 전용 위임이 위에서 처리한다
	현행은 두 셀렉터가 모두 window.Exit() 를 직접 불러
	확인 절차 없이 즉시 판을 빠져나갔고,
	BoardInit 분기와 겹쳐 같은 요청이 두 번 나갔다.
*/
/*
	개발 Part 31 (아이템 선택)
	현행 문제
	  덱의 아이템을 클릭하면 곧바로 동작이 확정됐다.
	    음식  window.Consume() 즉시 섭취. 팔 방법이 없다
	    그 외 스왑 선택 토글. 장착할 방법이 없다
	  같은 클릭이 아이템 종류에 따라 다른 일을 하는데
	  화면에는 아무 안내가 없어 실수로 아까운 식량을 먹게 된다.
	조치
	  클릭하면 무엇을 할지 고르는 팝업을 띄운다.
	    먹기 / 사용   회복량과 현재 HP 를 함께 표시
	    장착         장비류
	    판매         스왑 선택 토글(기존 동작)
	  RolePick 과 동일한 .layer + form.popup 규약이라
	  index.html 수정 없이 동작하고 back.close 로 닫힌다.
	회복량 표기
	  실제 회복은 언제나 서버가 확정한다.
	  여기 값은 안내용이며 서버 FOOD_HEAL / item.heal 과 같은 규칙을 쓴다.
*/
window.ItemPick = function(emoji, $el){
	var cookies = window.cookies
	if(!cookies || !emoji){
		return null
	}
	window.ItemPick.emoji = emoji
	window.ItemPick.$el = $el
	var maxHp = window.MaxHp ? window.MaxHp[cookies.role ? cookies.role : ""] : 10
	if(typeof maxHp == "undefined" || isNaN(maxHp)){
		maxHp = 10
	}
	var hp = typeof cookies.hp != "undefined" ? cookies.hp * 1 : maxHp
	var food = window.typeof_food ? window.typeof_food(emoji) : false
	var equip = window.typeof_equipment ? window.typeof_equipment(emoji) : false
	var heal = 0
	var healKind = ""
	if(equip && equip.subgroup == "equipment-consumable" && equip.heal){
		heal = equip.heal * 3
		healKind = "potion"
	}else if(food){
		heal = window.FoodHeal ? window.FoodHeal(emoji) : 0
		healKind = "food"
	}
	var wearable = (equip && equip.subgroup != "equipment-consumable") ? true : false
	var sellable = (window.typeof_item && window.typeof_item(emoji)) ? true : false
	var full = hp >= maxHp
	var body = '<div class="item_pick_head">\
		<div class="item_pick_icon"><a class="emoji color">' + emoji + '</a></div>\
		<div class="item_pick_meta">\
			<strong class="title">' + (equip ? equip.name : (food ? food.name : emoji)) + '</strong>\
			<p class="hp"><i class="emoji color">❤️</i><span>' + hp + ' / ' + maxHp + '</span></p>\
		</div>\
	</div>\
	<div class="item_pick_body">'
	if(heal > 0){
		body += '<a class="btn pick eat ' + (full ? "disabled" : "") + '">\
			<i class="emoji color">' + (healKind == "potion" ? "🧪" : "🍽") + '</i>\
			<strong>\
				<span class="ko">' + (healKind == "potion" ? "사용" : "먹기") + '</span>\
				<span class="en">' + (healKind == "potion" ? "Use" : "Eat") + '</span>\
			</strong>\
			<span class="ko">체력을 ' + heal + ' 회복합니다.</span>\
			<span class="en">Restores ' + heal + ' HP.</span>\
			' + (full ? '<em class="why">\
				<span class="ko">체력이 가득 찼습니다.</span>\
				<span class="en">Your HP is already full.</span>\
			</em>' : '') + '\
		</a>'
	}
	if(wearable){
		body += '<a class="btn pick equip">\
			<i class="emoji color">🎒</i>\
			<strong>\
				<span class="ko">장착</span>\
				<span class="en">Equip</span>\
			</strong>\
			<span class="ko">장비 슬롯에 착용합니다.</span>\
			<span class="en">Put it on an equipment slot.</span>\
		</a>'
	}
	if(sellable){
		body += '<a class="btn pick sell">\
			<i class="emoji color">🪙</i>\
			<strong>\
				<span class="ko">판매</span>\
				<span class="en">Sell</span>\
			</strong>\
			<span class="ko">상점 목록에 담습니다.</span>\
			<span class="en">Add it to the shop list.</span>\
		</a>'
	}
	body += '</div>'
	if(heal === 0 && !wearable && !sellable){
		body += '<p class="reason">\
			<span class="ko">이 아이템으로 할 수 있는 것이 없습니다.</span>\
			<span class="en">Nothing to do with this item.</span>\
		</p>'
	}
	var $form = $('form[name="ItemPick"]')
	if(!$form.length){
		$(".layer").append('<form name="ItemPick" class="popup"><back class="close">❌</back></form>')
		$form = $('form[name="ItemPick"]')
	}
	$form.find(".item_pick_head, .item_pick_body, .reason").remove()
	$form.prepend(body)
	$('tooltip').removeClass("on")
	$("body").removeAttr("tooltip")
	$(".layer").addClass("on")
	$form.addClass("on")
	return $form
}
$(document).on("click", 'form[name="ItemPick"] .btn.pick', function(e){
	e.preventDefault()
	var $t = $(this)
	if($t.hasClass("disabled")){
		return
	}
	var emoji = window.ItemPick.emoji
	var $el = window.ItemPick.$el
	$(".layer, .layer form.popup").removeClass("on")
	if(!emoji){
		return
	}
	if($t.hasClass("eat")){
		if(window.Consume){
			window.Consume(emoji)
		}
		return
	}
	if($t.hasClass("equip")){
		if(window.Equipment){
			window.Equipment([emoji], [])
		}
		return
	}
	if($t.hasClass("sell")){
		/*
			기존 스왑 토글 동작을 그대로 재현한다.
			선택된 .emoji_asset.on 목록을 BoardPoll 이 읽어
			query.assets 로 올리고 서버가 시세를 내려준다.
		*/
		if(!$el || !$el.length){
			return
		}
		$el.toggleClass("on")
		var $assets = $('.emoji_asset.on')
		var $status = document.querySelector(".aside .status")
		if($assets.length){
			$("body").attr("swap","")
			$("#swap").addClass("loading")
			if($status){
				$status.innerHTML = '<div class="loading"><strong>Loading...</strong></div>'
			}
		}else{
			$("body").removeAttr("swap")
			$("#pool ul").html("")
			$("#swap .submit input").val("")
			if($status){
				$status.innerHTML = ""
			}
			delete window.SwapIntent
		}
		try{
			if(OAuth3.xhr){
				OAuth3.xhr.abort()
				delete OAuth3.xhr
			}
		}catch(err){
		}
		return
	}
})