window.MyRoomEnter = function(cookies){
	var used = cookies.raidUsed ? cookies.raidUsed.split(",") : []
	var aborted = cookies.raidAborted ? true : false
	var pmcOk = used.indexOf("PMC") == -1 && !aborted
	var ucavOk = used.indexOf("UCAV") == -1
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
		body += '<p class="tip">\
			<span class="ko">이번 세션은 종료되었습니다. 다음 매치를 기다리세요.</span>\
			<span class="en">This session is over. Wait for the next match.</span>\
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

	var stored = []

	for(var r = 0; r < rows.length; r++){
		var row = rows[r]

		if(row.Subject != "#myroom"){
			continue
		}

		var emoji = ""

		try{
			emoji = row.Cc.split("@")[1]
		}catch(err){
			continue
		}

		if(!emoji){
			continue
		}

		if(!stored[emoji]){
			stored[emoji] = []
			stored.push(emoji)
		}

		stored[emoji].push(row)
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
			var canvas = blockies.create({seed: "0x"+owner})

			$panel.find(".myroom_head .icon").html("").append(canvas)
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