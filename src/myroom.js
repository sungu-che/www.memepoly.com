window.MyRoomEnter = function(cookies){
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
	if(window.MyRoom.busy){
		try{
			var _echo = (resp && resp.body) ? resp.body.body : null
			if(_echo && _echo.cc === "deposit"){
				window.MyRoom.busy = false
			}
		}catch(err){
		}
		if(window.MyRoom.busy && window.MyRoom.busyAt){
			if(Date.now() - window.MyRoom.busyAt > 12000){
				window.MyRoom.busy = false
				console.log("[myroom] deposit timed out. releasing lock")
			}
		}
	}
	var player_hash = cookies.address ? cookies.address : cookies.hash
	var hash = window.location.hash.replace("#","").toLowerCase()
	var owner = player_hash.replace("0x","").toLowerCase()
	if(!hash || hash != owner){
		$("#myroom").removeClass("on")
		$("body").removeAttr("myroom")
		/*
			개발 Part 69 (닫음 상태)
			남의 방 / 보드로 나갔다.
			다시 내 방으로 돌아오면 패널을 한 번은 보여주는 것이 맞으므로
			닫음 표식을 해제한다.
		*/
		window.MyRoom.closed = ""
		return
	}
	/*
		개발 Part 69 (닫음 상태)
		현행 문제
		  RoomCallback 이 폴링마다(600ms) MyRoom(resp) 을 부르고,
		  MyRoom 은 마지막에 무조건 $panel.addClass("on") 을 한다.
		    $panel.addClass("on")
		    $("body").attr("myroom", "on")
		  닫기 위임은 클래스만 떼므로 닫은 상태를 기억하는 곳이 없다.
		    $("#myroom").removeClass("on")
		  그래서 닫아도 600ms 뒤 다시 열리고, 필드를 클릭해도 다시 열린다.
		  게다가 #myroom 은 전체 화면을 덮는 fixed 레이어라
		  열려 있는 동안 3D 클릭이 통째로 삼켜져 캐릭터가 움직이지 않는다.
		조치
		  방(owner) 단위로 닫음 표식을 남긴다.
		  같은 방에 머무는 동안은 다시 열지 않는다.
		  방을 옮기거나(RoomHashChange) 판이 바뀌면 표식이 지워져
		  다음 진입에서 한 번 다시 열린다.
		다시 여는 방법
		  마이룸 진입 경로가 두 가지 남아 있다.
		    lobby 의 .btn.stash
		    dead 패널의 .btn.myroom
		  둘 다 window.MyRoomOpen() 을 거치도록 아래에서 배선한다.
		예외
		  보관 요청 중(busy)에는 결과를 보여줘야 하므로 닫음 표식을 무시한다.
	*/
	if(window.MyRoom.closed === owner && !window.MyRoom.busy){
		return
	}

	var rows = []

	try{
		rows = resp.body.rows
	}catch(err){
		rows = []
	}
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
		items_body += '<li class="item locked" emoji="'+emoji+'" cnt="'+group.length+'" type="'+(equip ? equip.subgroup : "material")+'">\
			<a class="emoji color">'+emoji+'</a>\
			<span class="cnt">'+group.length+'</span>\
			<span class="name">'+label+'</span>\
			<span class="state">\
				<span class="ko">보관 중</span>\
				<span class="en">Secured</span>\
			</span>\
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
	var held_body = ""
	for(var h = 0; h < held.length; h++){
		var _he = held[h]
		var _hg = held[_he]
		var _heq = window.typeof_equipment(_he)
		var _hlabel = _heq ? _heq.name : (window.typeof_item(_he) ? window.typeof_item(_he) : "")
		held_body += '<li class="item pick" emoji="' + _he + '" cnt="' + _hg.length + '">\
			<label class="check">\
				<input type="checkbox" class="sel">\
				<span class="box"></span>\
			</label>\
			<a class="emoji color">' + _he + '</a>\
			<span class="cnt">' + _hg.length + '</span>\
			<span class="name">' + _hlabel + '</span>\
			<span class="qty">\
				<a class="step minus">-</a>\
				<input type="number" class="num" value="1" min="1" max="' + _hg.length + '" step="1">\
				<a class="step plus">+</a>\
			</span>\
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
		<p class="hint">\
			<span class="ko">전사해도 사라지지 않습니다. 다음 매치가 시작되면 소지품으로 자동 반환됩니다.</span>\
			<span class="en">Safe from death. Returns to your carried items when the next match begins.</span>\
		</p>\
		<ul class="stash">'+items_body+'</ul>\
		<strong class="label">\
			<span class="ko">소지품</span>\
			<span class="en">Carried</span>\
		</strong>\
		<p class="hint">\
			<span class="ko">탈출하지 못하거나 전사하면 전부 잃습니다. 지키려면 보관함에 넣으세요.</span>\
			<span class="en">Lost entirely on MIA or death. Store them to keep them.</span>\
		</p>\
		<ul class="stash carried">'+held_body+'</ul>\
		'+(held.length ? '<div class="bulk">\
			<label class="check all">\
				<input type="checkbox" class="sel-all">\
				<span class="box"></span>\
				<span class="ko">전체 선택</span>\
				<span class="en">Select all</span>\
			</label>\
			<a class="btn deposit-all disabled">\
				<span class="label">\
					<span class="ko">선택 <b class="n">0</b>개 넣기</span>\
					<span class="en">Store <b class="n">0</b></span>\
				</span>\
				<span class="loading-label">\
					<span class="ko">처리 중...</span>\
					<span class="en">Loading...</span>\
				</span>\
			</a>\
		</div>' : '')+'\
	</section>\
	<footer class="myroom_foot">'+window.MyRoomEnter(cookies)+'</footer>'

	var $panel = $("#myroom")

	if(!$panel.length){
		$("body").append('<div id="myroom"><div class="tb"><div class="tc"></div></div></div>')

		$panel = $("#myroom")
	}

	var $tc = $panel.find(".tc")
	if(window.MyRoom.busy){
		$panel.addClass("on")
		$("body").attr("myroom", "on")
		return $panel
	}
	var before_body = $tc.html()
	if(before_body){
		before_body = before_body.replace(/\t/gi,"").replace(/\n/gi,"").trim()
	}
	var after_body = body.replace(/\t/gi,"").replace(/\n/gi,"").trim()
	if(before_body != after_body){
		$tc.html(after_body)
		try{
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
window.MyRoom.busy = false
window.MyRoom.busyAt = 0
/*
	개발 Part 69 (닫음 상태)
	닫은 방의 owner 해시.
	빈 문자열이면 "닫은 적 없음" 이다.
	페이지를 새로 열면 초기화되므로 첫 진입에서는 항상 보인다.
*/
window.MyRoom.closed = ""
/*
	패널을 강제로 연다.
	닫음 표식을 지우고 즉시 그린다.
	버튼(lobby / dead)에서 명시적으로 부를 때만 쓴다.
	resp 가 없으면 마지막 응답(window.response)으로 그린다.
*/
window.MyRoomOpen = function(resp){
	window.MyRoom.closed = ""
	var r = resp
	if(!r){
		r = window.response ? window.response : null
	}
	if(!r){
		/*
			응답이 아직 없다.
			다음 폴링이 MyRoom 을 부르면 닫음 표식이 비어 있으므로 열린다.
		*/
		return null
	}
	return window.MyRoom(r)
}
/*
	패널을 닫고 닫음 표식을 남긴다.
	닫기 버튼 / 출격 버튼 / 해시 변경이 공용으로 쓴다.
*/
window.MyRoomClose = function(){
	var cookies = window.cookies
	var owner = ""
	try{
		var _h = cookies.address ? cookies.address : cookies.hash
		owner = String(_h ? _h : "").replace("0x","").toLowerCase()
	}catch(err){
		owner = ""
	}
	window.MyRoom.closed = owner ? owner : "*"
	$("#myroom").removeClass("on")
	$("body").removeAttr("myroom")
	/*
		닫는 순간 3D 클릭이 다시 살아나야 한다.
		frameloop 가 demand 로 내려가 있으면 첫 클릭이 한 프레임 늦는다.
	*/
	try{
		if(window.setFrameloop){
			window.setFrameloop("always")
		}
	}catch(err){
	}
	return true
}
window.MyRoomSync = function(){
	var $list = $("#myroom .stash.carried")
	var $bulk = $("#myroom .myroom_body .bulk")
	if(!$list.length || !$bulk.length){
		return 0
	}
	var total = 0
	var picked = 0
	$list.find("li.item.pick").each(function(){
		var $li = $(this)
		var max = $li.attr("cnt") * 1
		if(isNaN(max) || max < 1){
			max = 1
		}
		var $num = $li.find(".qty .num")
		var n = $num.val() * 1
		if(isNaN(n) || n < 1){
			n = 1
		}
		if(n > max){
			n = max
		}
		$num.val(n)
		if($li.find(".check .sel").prop("checked")){
			$li.addClass("on")
			total += n
			picked++
		}else{
			$li.removeClass("on")
		}
	})
	$bulk.find(".n").text(total)
	var $btn = $bulk.find(".btn.deposit-all")
	if($btn.hasClass("loading")){
		return total
	}
	if(total > 0){
		$btn.removeClass("disabled")
	}else{
		$btn.addClass("disabled")
	}
	var all = $list.find("li.item.pick").length
	$bulk.find(".sel-all").prop("checked", all > 0 && picked === all)
	return total
}
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
	/*
		개발 Part 69 (닫음 상태)
		보드로 나가므로 닫음 표식을 남긴다.
		해시가 비면 MyRoom 초입의 hash != owner 분기가
		표식을 스스로 해제하므로, 다음에 방으로 돌아오면 한 번 열린다.
	*/
	if(window.MyRoomClose){
		window.MyRoomClose()
	}else{
		$("#myroom").removeClass("on")
		$("body").removeAttr("myroom")
	}
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
	/*
		개발 Part 69 (닫음 상태)
		클래스만 떼면 다음 폴링이 다시 연다.
		MyRoomClose 가 닫음 표식까지 남긴다.
	*/
	if(window.MyRoomClose){
		window.MyRoomClose()
	}else{
		$("#myroom").removeClass("on")
		$("body").removeAttr("myroom")
	}
})
/*
	개발 Part 69 (바깥 클릭으로 닫기)
	현행에는 닫기 버튼 하나뿐이었다.
	패널이 전체 화면을 덮으므로 바깥을 눌러도 닫히지 않으면
	"눌러도 아무 반응 없는 화면" 이 된다.
	본문(.tc) 밖을 누르면 닫는다.
	.tc 안쪽은 목록 / 스테퍼 / 출격 버튼이므로 그대로 둔다.
*/
$(document).on("click", "#myroom", function(e){
	if(e.target !== this){
		return
	}
	e.preventDefault()
	if(window.MyRoomClose){
		window.MyRoomClose()
	}
})

$(document).on("change", "#myroom .stash.carried li.item .check .sel", function(){
	window.MyRoomSync()
})
$(document).on("change", "#myroom .myroom_body .bulk .sel-all", function(){
	var on = $(this).prop("checked") ? true : false
	$("#myroom .stash.carried li.item.pick .check .sel").prop("checked", on)
	window.MyRoomSync()
})
$(document).on("click", "#myroom .stash.carried li.item .qty .step", function(e){
	e.preventDefault()
	var $li = $(this).closest("li.item")
	var $num = $li.find(".qty .num")
	var max = $li.attr("cnt") * 1
	if(isNaN(max) || max < 1){
		max = 1
	}
	var n = $num.val() * 1
	if(isNaN(n)){
		n = 1
	}
	n = $(this).hasClass("plus") ? (n + 1) : (n - 1)
	if(n < 1){
		n = 1
	}
	if(n > max){
		n = max
	}
	$num.val(n)
	$li.find(".check .sel").prop("checked", true)
	window.MyRoomSync()
})
$(document).on("input change", "#myroom .stash.carried li.item .qty .num", function(){
	window.MyRoomSync()
})
$(document).on("click", "#myroom .myroom_body .bulk .btn.deposit-all", function(e){
	e.preventDefault()
	var $btn = $(this)
	if($btn.hasClass("disabled") || $btn.hasClass("loading")){
		return
	}
	if(window.MyRoom.busy){
		return
	}
	if(!window.Action){
		return
	}
	var items = []
	$("#myroom .stash.carried li.item.pick").each(function(){
		var $li = $(this)
		if(!$li.find(".check .sel").prop("checked")){
			return
		}
		var emoji = $li.attr("emoji")
		if(!emoji){
			return
		}
		var max = $li.attr("cnt") * 1
		if(isNaN(max) || max < 1){
			max = 1
		}
		var n = $li.find(".qty .num").val() * 1
		if(isNaN(n) || n < 1){
			n = 1
		}
		if(n > max){
			n = max
		}
		items.push({ emoji : emoji, count : n })
	})
	if(!items.length){
		return
	}
	window.MyRoom.busy = true
	window.MyRoom.busyAt = Date.now()
	$btn.addClass("loading").removeClass("disabled")
	$("#myroom .stash.carried li.item .check .sel").prop("disabled", true)
	$("#myroom .stash.carried li.item .qty .num").prop("disabled", true)
	try{
		if(window.Sfx){
			window.Sfx.play("click")
		}
	}catch(err){
	}
	window.Action({
		cc : "deposit",
		direction : "deposit",
		items : JSON.stringify(items),
		item : items[0].emoji
	})
})