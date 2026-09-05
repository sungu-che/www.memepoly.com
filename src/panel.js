window.Panel = {
	kind : ""
}

window.Panel.close = function(){
	window.Panel.kind = ""

	if(window.Panel.timer){
		clearInterval(window.Panel.timer)

		delete window.Panel.timer
	}

	$("body").removeAttr("panel")
	$("#panel").remove()
}

window.Panel.open = function(kind, head, body){
	window.Panel.kind = kind

	var $p = $("#panel")

	if(!$p.length){
		$("body").append('<div id="panel"><div class="tb"><div class="tc"></div></div></div>')

		$p = $("#panel")
	}

	$p.find(".tc").html('<strong class="head">' + head + '</strong>' + body + '<a class="close">Close</a>')

	$("body").attr("panel", kind)
}

window.CountAssets = function(){
	var out = {}

	$("emojis .items .emoji_asset[emoji]").each(function(){
		var $t = $(this)
		var emoji = $t.attr("emoji")
		var cnt = $t.attr("cnt") ? $t.attr("cnt") * 1 : 1

		if(emoji){
			out[emoji] = cnt
		}
	})

	return out
}

window.HasMaterials = function(list){
	if(!list){
		return true
	}

	var owned = window.CountAssets()
	var need = {}

	for(var i = 0; i < list.length; i++){
		need[list[i]] = (need[list[i]] ? need[list[i]] : 0) + 1
	}

	for(var k in need){
		if(need.hasOwnProperty(k)){
			if(!owned[k] || owned[k] < need[k]){
				return false
			}
		}
	}

	return true
}

window.Tile = function(){
	var cookies = window.cookies

	if(!cookies){
		return null
	}

	if(!cookies.tile){
		return null
	}

	if(typeof cookies.tile == "string"){
		try{
			return JSON.parse(cookies.tile)
		}catch(err){
			return null
		}
	}

	return cookies.tile
}

window.PropertyPanel = function(){
	var cookies = window.cookies

	if(!cookies){
		return
	}

	var ZERO = "0x0000000000000000000000000000000000000000"

	var tile = window.Tile()
	if(!tile){
		window.Notice("NO LAND", "This tile cannot be owned", 2000)
		return
	}
	/*
		개발 Part 37 (예약 칸)
		감옥 / 게이트 / 아이템 칸이면 패널 자체를 열지 않는다.
		열어두면 입찰 / 건설 행이 그려지고, 눌러야 서버가 거절한다.
		reserved 가 없는 구버전 응답에서는 jail / gate / item 으로 폴백한다.
		이미 건물이 선 예약 칸(이 수정 이전 데이터)은 통행료를 계속 걷으므로
		소유 정보만 알리고 증축은 막는다.
	*/
	var reserved = tile.reserved ? tile.reserved : ""
	if(!reserved){
		if(tile.jail){
			reserved = "jail"
		}else if(tile.gate || tile.drop){
			reserved = "gate"
		}else if(tile.item){
			reserved = "item"
		}
	}
	if(reserved){
		var msg = window.ReservedNotice
			? window.ReservedNotice(reserved)
			: { head : "RESERVED", body : "You cannot build here" }
		var extra = ""
		if((tile.level * 1) > 0){
			extra = " (toll " + (tile.toll ? tile.toll : 0) + " 🪙)"
		}
		window.Notice(msg.head, msg.body + extra, 2600)
		return
	}

	var me = cookies.address ? cookies.address : cookies.hash
	var owner = tile.owner ? tile.owner : ""
	var level = tile.level ? tile.level * 1 : 0
	var balance = cookies.balance ? cookies.balance * 1 : 0
	/*
		개발 Part 33 (국가 소유)
		현행은 owner == ZERO 를 전부 "경매 땅" 으로 봤다.
		개발 Part 33 부터 ZERO 에는 두 가지가 섞인다.
		  nation true   건물이 선 국가 부동산. 국고가 쌓인다
		  nation false  건물 없는 몰수지. 기존대로 경매 대상
		국가 부동산은 밟는 방식에 따라 결과가 다르므로 안내만 한다.
		  주사위로 도착  통행료를 국고에 낸다
		  걸어서 도착    국고를 수금한다
		둘 다 서버가 도착 시점에 자동 처리한다.
		여기서 버튼을 두면 "패널을 열어야만 수금" 이 되어
		이미 지나간 칸을 소급 수금하는 구멍이 생긴다.
	*/
	var isNation = tile.nation ? true : false
	var treasury = tile.treasury ? tile.treasury * 1 : 0
	if(isNaN(treasury)){
		treasury = 0
	}
	if(owner && owner != me && !isNation && owner != ZERO){
		window.Notice("OWNED", "Toll " + tile.toll + " 🪙", 2200)
		return
	}
	if(isNation){
		var _nationBody = '<div class="row nation disabled">\
			<span class="name">' + (window.PropertyLevelEmoji[level] ? window.PropertyLevelEmoji[level] : "🏛") + ' State property</span>\
			<span class="cost">toll ' + tile.toll + ' 🪙</span>\
		</div>\
		<div class="row treasury disabled">\
			<span class="name">🏦 Treasury ' + treasury + ' 🪙</span>\
			<span class="cost">' + (treasury > 0 ? "walk in to loot it" : "empty for now") + '</span>\
		</div>\
		<div class="row hint disabled">\
			<span class="name">\
				<span class="ko">주사위로 밟으면 국고에 통행료를 냅니다.</span>\
				<span class="en">Arrive by dice and you pay into the treasury.</span>\
			</span>\
			<span class="cost">\
				<span class="ko">걸어서 오면 국고를 수금합니다.</span>\
				<span class="en">Walk in and you collect it.</span>\
			</span>\
		</div>'
		window.Panel.open("property", "State (" + Math.floor(tile.x) + ", " + Math.floor(tile.z) + ")", _nationBody)
		return
	}
	var isAuctionLand = (owner == ZERO)
	var body = ""

	if(tile.auction){
		var left = Math.max(0, Math.ceil((tile.auction.endTime - Date.now()) / 1000))
		var mine = tile.auction.bidder == me

		body += '<div class="row auction disabled">\
			<span class="name">Highest bid ' + tile.auction.bid + ' 🪙 ' + (mine ? "(you)" : "") + '</span>\
			<span class="cost">closes in ' + left + 's</span>\
		</div>'
	}

	if(!owner || isAuctionLand){
		var steps = [1.0, 1.5, 2.0]

		for(var s = 0; s < steps.length; s++){
			var base = tile.auction ? tile.auction.bid : window.PropertyCost[1]
			var bid = Math.round(base * steps[s]) + (tile.auction ? 10 : 0)
			var canBid = balance >= bid

			body += '<div class="row bid ' + (canBid ? "" : "disabled") + '" data-bid="' + bid + '">\
				<span class="name">🔨 Bid ' + bid + ' 🪙</span>\
				<span class="cost">' + (tile.auction ? "outbid current" : "open auction") + '</span>\
			</div>'
		}
	}

	for(var lv = level + 1; lv <= 4; lv++){
		var cost = window.PropertyCost[lv]

		if(isAuctionLand){
			cost = Math.round(cost * 1.5)
		}

		var mats = window.PropertyMaterials[lv]
		var ok = balance >= cost && window.HasMaterials(mats)

		if(tile.auction){
			ok = false
		}

		body += '<div class="row build ' + (ok ? "" : "disabled") + '" data-level="' + lv + '">\
			<span class="name">' + window.PropertyLevelEmoji[lv] + ' ' + window.PropertyType[lv] + '</span>\
			<span class="cost">' + cost + ' 🪙 · toll ' + window.PropertyToll[lv] + (isAuctionLand ? " · seized +50%" : "") + '</span>\
			<span class="mat">' + (mats.length ? mats.join(" ") : "-") + '</span>\
		</div>'
	}

	if(!body){
		body = '<div class="row disabled"><span class="name">Max level</span></div>'
	}

	window.Panel.open("property", "Tile (" + Math.floor(tile.x) + ", " + Math.floor(tile.z) + ")", body)

	if(tile.auction){
		if(window.Panel.timer){
			clearInterval(window.Panel.timer)
		}

		window.Panel.timer = setInterval(function(){
			if(window.Panel.kind != "property"){
				clearInterval(window.Panel.timer)

				delete window.Panel.timer

				return
			}

			var _left = Math.max(0, Math.ceil((tile.auction.endTime - Date.now()) / 1000))

			$("#panel .row.auction .cost").text("closes in " + _left + "s")

			if(_left <= 0){
				clearInterval(window.Panel.timer)

				delete window.Panel.timer

				window.Panel.close()

				window.Notice("AUCTION CLOSED", "Result will settle shortly", 2400)
			}
		}, 1000)
	}
}

window.CraftPanel = function(){
	var cookies = window.cookies

	if(!cookies){
		return
	}

	var body = ""

	for(var i = 0; i < window.Recipes.length; i++){
		var r = window.Recipes[i]
		var ok = (cookies.balance * 1) >= r.cost && window.HasMaterials(r.materials)

		body += '<div class="row ' + (ok ? "" : "disabled") + '" data-recipe="' + r.result + '">\
			<span class="name">' + r.result + ' ' + r.name + '</span>\
			<span class="cost">' + r.cost + ' 🪙 · ' + r.grade + '</span>\
			<span class="mat">' + r.materials.join(" ") + '</span>\
		</div>'
	}

	window.Panel.open("craft", "Crafting Bench", body)
}

$(document).on("click", "#panel .close", function(e){
	e.preventDefault()

	window.Panel.close()
})

$(document).on("click", "#panel .row", function(e){
	e.preventDefault()

	var $t = $(this)

	if($t.hasClass("disabled")){
		return
	}

	if(window.Panel.kind == "property"){
		if($t.hasClass("bid")){
			var bid = $t.attr("data-bid") * 1

			if(window.Auction){
				window.Auction(bid)
			}

			window.Notice("BID PLACED", bid + " 🪙", 2000)
		}else{
			var lv = $t.attr("data-level") * 1

			if(window.Property){
				window.Property(lv)
			}
		}
	}else if(window.Panel.kind == "craft"){
		var rc = $t.attr("data-recipe")

		if(window.Craft){
			window.Craft(rc)
		}
	}

	window.Panel.close()
})