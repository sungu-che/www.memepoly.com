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