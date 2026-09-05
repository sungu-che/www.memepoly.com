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
			<span class="ko">탈출에 실패하면 마지막에 얻은 3개만 남습니다. 전사하면 전부 잃습니다.</span>\
			<span class="en">On MIA only your last 3 pickups survive. On death you lose everything.</span>\
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