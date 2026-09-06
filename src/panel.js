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
	/*
		개발 Part 81 (아이템 이중 집계)
		현행 문제
		  "emojis .items .emoji_asset[emoji]" 는 후손 선택자다.
		  문서에 .items 가 두 개 있으므로
		    .deck > .items                        진짜 아이템 목록
		    .deck > .emojis > .emoji_asset.items  덱 안 자리표시자
		  같은 아이템이 두 번 매칭됐다.
		  out[emoji] = cnt 는 덮어쓰기라 개수 자체는 같지만,
		  두 컨테이너의 cnt 가 어긋난 프레임에서는 값이 갈린다.
		  더 큰 문제는 이 함수를 쓰는 HasMaterials 다.
		  중복 주입으로 한쪽이 갱신되지 않은 순간에
		  옛 개수를 채택해 "재료가 있다" 고 오판한다.
		  그러면 크래프트 / 건설 버튼이 활성화되는데
		  서버는 insufficient_material 로 거절한다.
		  "눌리는데 안 되는 버튼" 이 된다.
		조치
		  진짜 목록 하나만 센다.
		  ItemsDeck() 은 src/index.js 가 정의한다.
	*/
	var $deck = window.ItemsDeck
		? window.ItemsDeck()
		: $("emojis .items").not(".emoji_asset")
	$deck.find(".emoji_asset[emoji]").each(function(){
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
	var isNation = tile.nation ? true : false
	var treasury = tile.treasury ? tile.treasury * 1 : 0
	if(isNaN(treasury)){
		treasury = 0
	}
	if(owner && owner != me && !isNation && owner != ZERO){
		var offerPrice = tile.offerPrice ? tile.offerPrice * 1 : 0
		var offerBase = tile.offerBase ? tile.offerBase * 1 : 0
		if(!offerPrice || isNaN(offerPrice)){
			if((level * 1) <= 0){
				window.Notice("OWNED LAND", "Someone already claimed this tile", 2200)
			}else{
				window.Notice("OWNED", "Toll " + tile.toll + " 🪙", 2200)
			}
			return
		}
		var offerBody = '<div class="row owned disabled">\
			<span class="name">' + (window.PropertyLevelEmoji[level] ? window.PropertyLevelEmoji[level] : "🏠") + ' ' + (window.PropertyType[level] ? window.PropertyType[level] : "") + '</span>\
			<span class="cost">toll ' + tile.toll + ' 🪙 · value ' + offerBase + ' 🪙</span>\
		</div>'
		if(tile.offerOpen){
			offerBody += '<div class="row hint disabled">\
				<span class="name">\
					<span class="ko">이미 진행 중인 제안이 있습니다.</span>\
					<span class="en">An offer is already pending here.</span>\
				</span>\
				<span class="cost">\
					<span class="ko">소유자가 응답할 때까지 기다리세요.</span>\
					<span class="en">Wait for the owner to respond.</span>\
				</span>\
			</div>'
		}else{
			var canOffer = balance >= offerPrice
			offerBody += '<div class="row offer ' + (canOffer ? "" : "disabled") + '" data-offer="' + offerPrice + '">\
				<span class="name">🤝 Offer ' + offerPrice + ' 🪙</span>\
				<span class="cost">' + (canOffer ? "owner must accept" : "not enough coins") + '</span>\
			</div>\
			<div class="row hint disabled">\
				<span class="name">\
					<span class="ko">제안 금액은 즉시 예치됩니다.</span>\
					<span class="en">The amount is escrowed immediately.</span>\
				</span>\
				<span class="cost">\
					<span class="ko">거부되거나 응답이 없으면 전액 돌려받습니다.</span>\
					<span class="en">Refunded in full if rejected or unanswered.</span>\
				</span>\
			</div>'
		}
		window.Panel.open("property", "Owned (" + Math.floor(tile.x) + ", " + Math.floor(tile.z) + ")", offerBody)
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
		var _landPrice = (window.PropertyCost && window.PropertyCost[1])
			? window.PropertyCost[1] * 1 : 200
		if(isNaN(_landPrice) || _landPrice <= 0){
			_landPrice = 200
		}
		var _canBuy = balance >= _landPrice
		body += '<div class="row bid ' + (_canBuy ? "" : "disabled") + '" data-bid="' + _landPrice + '">\
			<span class="name">🔨 Buy ' + _landPrice + ' 🪙</span>\
			<span class="cost">' + (_canBuy ? "claim this tile" : "not enough coins") + '</span>\
			<span class="mat">\
				<span class="ko">즉시 소유합니다. 이후 건설할 수 있습니다.</span>\
				<span class="en">You own it instantly. Build afterwards.</span>\
			</span>\
		</div>'
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

/*
	개발 Part 71 (매수 제안 수신)
	내가 받은 제안을 보여주고 승낙 / 거부를 받는다.
	  cookies.offerInbox  서버가 폴링마다 내려준다
	자동 노출
	  제안은 시한이 있다(기본 3분). 사용자가 패널을 열 때까지 기다리면
	  대부분 만료되어 거래 자체가 성립하지 않는다.
	  새 제안이 도착하면 자동으로 띄운다.
	중복 노출 방지
	  같은 제안으로 반복해서 뜨면 조작이 불가능해진다.
	  본 제안 id 를 기억한다.
*/
window.OfferSeen = {}
window.OfferPanel = function(list){
	var cookies = window.cookies
	if(!cookies){
		return null
	}
	var items = list
	if(!items){
		items = cookies.offerInbox ? cookies.offerInbox : []
	}
	if(typeof items === "string"){
		try{
			items = JSON.parse(items)
		}catch(err){
			items = []
		}
	}
	if(!items || !items.length){
		return null
	}
	var body = ""
	for(var i = 0; i < items.length; i++){
		var o = items[i]
		if(!o || !o.id){
			continue
		}
		var left = o.expires ? Math.max(0, Math.ceil((o.expires - Date.now()) / 1000)) : 0
		var from = o.from ? String(o.from).replace("0x","") : ""
		var lvEmoji = "🏠"
		try{
			if(window.PropertyLevelEmoji && window.PropertyLevelEmoji[o.level]){
				lvEmoji = window.PropertyLevelEmoji[o.level]
			}
		}catch(err){
		}
		body += '<div class="row offer_item disabled" data-offer="' + o.id + '">\
			<span class="name">' + lvEmoji + ' (' + Math.floor(o.x) + ', ' + Math.floor(o.z) + ')</span>\
			<span class="cost">' + o.amount + ' 🪙 · value ' + o.base + ' 🪙' + (left > 0 ? (' · ' + left + 's') : '') + '</span>\
			<span class="mat">\
				<span class="from">' + (from ? from.substr(0, 10) : "unknown") + '</span>\
			</span>\
		</div>\
		<div class="row offer_act disabled" data-offer="' + o.id + '">\
			<a class="act accept" data-offer="' + o.id + '">\
				<span class="ko">승낙</span>\
				<span class="en">Accept</span>\
			</a>\
			<a class="act reject" data-offer="' + o.id + '">\
				<span class="ko">거부</span>\
				<span class="en">Reject</span>\
			</a>\
		</div>'
	}
	if(!body){
		return null
	}
	window.Panel.open("offer", "Property Offers", body)
	/*
		시한을 초 단위로 갱신한다.
		만료되면 서버가 환불하고 목록에서 사라지므로
		여기서는 표시만 갱신하고 닫지 않는다.
	*/
	if(window.Panel.timer){
		clearInterval(window.Panel.timer)
	}
	window.Panel.timer = setInterval(function(){
		if(window.Panel.kind != "offer"){
			clearInterval(window.Panel.timer)
			delete window.Panel.timer
			return
		}
		try{
			var cur = window.cookies.offerInbox ? window.cookies.offerInbox : []
			for(var c = 0; c < cur.length; c++){
				var o = cur[c]
				if(!o || !o.expires){
					continue
				}
				var s = Math.max(0, Math.ceil((o.expires - Date.now()) / 1000))
				var $row = $('#panel .row.offer_item[data-offer="' + o.id + '"] .cost')
				if($row.length){
					$row.text(o.amount + " 🪙 · value " + o.base + " 🪙 · " + s + "s")
				}
			}
		}catch(err){
		}
	}, 1000)
	return $("#panel")
}
/*
	폴링마다 호출한다.
	  새 제안이 있으면 자동으로 띄운다
	  내가 건 제안의 결과가 확정되면 알린다
*/
window.OfferSync = function(cookies){
	if(!cookies){
		return
	}
	try{
		var inbox = cookies.offerInbox ? cookies.offerInbox : []
		var fresh = []
		for(var i = 0; i < inbox.length; i++){
			var o = inbox[i]
			if(!o || !o.id){
				continue
			}
			if(window.OfferSeen[o.id]){
				continue
			}
			window.OfferSeen[o.id] = true
			fresh.push(o)
		}
		if(fresh.length && window.Panel.kind !== "offer"){
			window.Notice("OFFER RECEIVED",
				fresh[0].amount + " 🪙 for your property", 2600)
			try{
				if(window.Sfx){
					window.Sfx.play("coin")
				}
			}catch(err){
			}
			window.OfferPanel(inbox)
		}
	}catch(err){
	}
	try{
		var outbox = cookies.offerOutbox ? cookies.offerOutbox : []
		if(!window.OfferSync.answered){
			window.OfferSync.answered = {}
		}
		for(var b = 0; b < outbox.length; b++){
			var q = outbox[b]
			if(!q || !q.id){
				continue
			}
			if(q.state === "pending"){
				continue
			}
			if(window.OfferSync.answered[q.id]){
				continue
			}
			window.OfferSync.answered[q.id] = true
			/*
				개발 Part 71 (결과 알림)
				거부 / 만료는 환불이 함께 일어난다.
				얼마가 돌아왔는지 알려야 잔액 변동이 납득된다.
			*/
			if(q.state === "accepted"){
				window.Notice("OFFER ACCEPTED",
					"(" + Math.floor(q.x) + ", " + Math.floor(q.z) + ") is yours for " + q.amount + " 🪙",
					3200)
				try{
					if(window.Sfx){
						window.Sfx.play("build")
					}
				}catch(err){
				}
			}else if(q.state === "rejected"){
				window.Notice("OFFER REJECTED",
					"The owner declined. " + q.amount + " 🪙 refunded", 3200)
				try{
					if(window.Sfx){
						window.Sfx.play("deny")
					}
				}catch(err){
				}
			}else if(q.state === "expired"){
				window.Notice("OFFER EXPIRED",
					"No answer in time. " + q.amount + " 🪙 refunded", 3200)
			}
		}
	}catch(err){
	}
}
window.OfferSync.answered = {}
/*
	승낙 / 거부 전송.
	응답 즉시 행을 비활성화해 두 번 눌리지 않게 한다.
	결과는 다음 폴링의 cookies.offerAnswered 로 확인된다.
*/
window.OfferAnswer = function(offerId, accept){
	if(!offerId){
		return
	}
	if(!window.Action){
		return
	}
	window.Action({
		cc : "offer",
		offer : offerId,
		accept : accept ? 1 : 0
	})
}
$(document).on("click", "#panel .row.offer_act .act", function(e){
	e.preventDefault()
	var $t = $(this)
	if($t.hasClass("busy")){
		return
	}
	var id = $t.attr("data-offer") * 1
	if(!id || isNaN(id)){
		return
	}
	var accept = $t.hasClass("accept")
	$('#panel .row.offer_act[data-offer="' + id + '"] .act').addClass("busy")
	$('#panel .row.offer_item[data-offer="' + id + '"]').addClass("done")
	window.OfferAnswer(id, accept)
	window.Notice(accept ? "OFFER ACCEPTED" : "OFFER REJECTED",
		accept ? "Transferring ownership" : "Refunding the bidder", 2200)
	setTimeout(function(){
		window.Panel.close()
	}, 600)
})
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
		if($t.hasClass("offer")){
			var offer = $t.attr("data-offer") * 1
			if(window.Auction){
				window.Auction(offer)
			}
			window.Notice("OFFER SENT",
				offer + " 🪙 escrowed. Waiting for the owner", 2600)
		}else if($t.hasClass("bid")){
			var bid = $t.attr("data-bid") * 1
			if(window.Auction){
				window.Auction(bid)
			}
			window.Notice("PURCHASING", bid + " 🪙 · claiming the tile", 2000)
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