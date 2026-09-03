/*
	MEMEPOLY - src/state.js
	개발 Part 12 - 도메인 DTO 어댑터

	서버가 postMessage 로 rows[] 와 state 를 함께 보낸다.
	이 파일은 state 를 window.State 에 보관하고,
	기존 코드가 쓰던 조회 헬퍼를 DTO 기반으로 제공한다.

	전환 순서
	  1) state 를 저장만 한다(이번 단계).
	  2) 화면 로직을 window.State 조회로 하나씩 옮긴다.
	  3) rows[] 파싱 블록을 제거한다.

	rows[] 가 없어도 동작하도록 모든 헬퍼는 state 미존재 시 빈 값을 반환한다.
*/
window.State = {
	version : 0,
	mode : "",
	account : null,
	self : null,
	match : null,
	tile : null,
	positions : [],
	npcs : [],
	bombs : [],
	flags : [],
	decorations : [],
	properties : [],
	auctions : [],
	damages : [],
	threads : [],
	messages : [],
	inventory : { held : [], pending : [], stash : [], counts : {} },
	moderation : { reports : [], blocks : [] },
	rtc : { signals : [], sessions : [] },
	follows : [],
	tiles : [],
	bingos : [],
	media : [],
	turn : null,
	/* 인덱스 */
	byPos : {},
	blockedIds : {},
	reportedIds : {}
}

/*
	응답에서 state 를 흡수한다.
	window.Callback 초입에서 호출한다.
*/
window.StateApply = function(resp){
	var s = null
	try{
		s = resp && resp.body ? resp.body.state : null
	}catch(err){
		s = null
	}
	if(!s){
		return window.State
	}
	var keys = Object.keys(s)
	for(var i = 0; i < keys.length; i++){
		window.State[keys[i]] = s[keys[i]]
	}
	/* 좌표 인덱스 재구성 */
	window.State.byPos = {}
	var lists = ["positions", "npcs", "bombs", "flags", "decorations", "tiles", "media"]
	for(var l = 0; l < lists.length; l++){
		var arr = window.State[lists[l]]
		if(!arr || !arr.length){
			continue
		}
		for(var a = 0; a < arr.length; a++){
			var item = arr[a]
			if(typeof item.x === "undefined"){
				continue
			}
			var key = item.x + ":" + item.z
			if(!window.State.byPos[key]){
				window.State.byPos[key] = {}
			}
			window.State.byPos[key][lists[l]] = item
		}
	}
	/* 모더레이션 인덱스 */
	window.State.blockedIds = {}
	window.State.reportedIds = {}
	if(window.State.moderation){
		var b = window.State.moderation.blocks || []
		for(var bi = 0; bi < b.length; bi++){
			if(b[bi].hash){
				window.State.blockedIds[b[bi].hash] = true
			}
		}
		var r = window.State.moderation.reports || []
		for(var ri = 0; ri < r.length; ri++){
			if(r[ri].hash){
				window.State.reportedIds[r[ri].hash] = r[ri].reason
			}
		}
	}
	return window.State
}

/*
	좌표 조회. rows 순회를 대체한다.
*/
window.StateAt = function(x, z){
	var key = (x * 1) + ":" + (z * 1)
	return window.State.byPos[key] ? window.State.byPos[key] : {}
}

/*
	화면에서 숨겨야 하는 상대인가.
	현행 window.map.report[hash] 판정을 대체한다.
*/
window.StateHidden = function(hash){
	if(!hash){
		return false
	}
	if(window.State.blockedIds[hash]){
		return true
	}
	if(window.State.reportedIds[hash]){
		return true
	}
	return false
}

/*
	인벤토리 이모지별 개수.
	현행 stickers[emoji].length 집계를 대체한다.
*/
window.StateItemCount = function(emoji){
	if(!window.State.inventory || !window.State.inventory.counts){
		return 0
	}
	return window.State.inventory.counts[emoji]
		? window.State.inventory.counts[emoji] : 0
}

/*
	부동산 조회.
*/
window.StateProperty = function(x, z){
	var list = window.State.properties || []
	for(var i = 0; i < list.length; i++){
		if(list[i].x === (x * 1) && list[i].z === (z * 1)){
			return list[i]
		}
	}
	return null
}

/*
	DTO 가 도착했는가. 전환 중 폴백 판정에 쓴다.
*/
window.StateReady = function(){
	return window.State.version > 0
}