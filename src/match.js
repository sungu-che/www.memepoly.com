(function(){
	var MATCH_INTERVAL = 20 * 60 * 1000

	var mix = function(n){
		n = n | 0
		n = (n ^ 61) ^ (n >>> 16)
		n = (n + (n << 3)) | 0
		n = n ^ (n >>> 4)
		n = Math.imul(n, 0x27d4eb2d)
		n = n ^ (n >>> 15)

		return n >>> 0
	}

	var hex = function(n){
		return ("0000000" + n.toString(16)).substr(-8)
	}

	window.MatchOffset = function(){
		try{
			if(localStorage.matchOffset){
				var v = localStorage.matchOffset * 1

				if(!isNaN(v)){
					return v
				}
			}
		}catch(err){

		}

		return 0
	}

	window.Match = function(ms){
		var _now = typeof ms != "undefined" ? ms : (Date.now() + window.MatchOffset())
		var _index = Math.floor(_now / MATCH_INTERVAL)
		var _start = _index * MATCH_INTERVAL

		var _hash = hex(mix(_index))
			+ hex(mix(_index ^ 0x9e3779b9))
			+ hex(mix((_index + 0x85ebca6b) | 0))
			+ hex(mix(_index ^ 0xc2b2ae35))

		return {
			interval : MATCH_INTERVAL,
			index : _index,
			hash : _hash,
			seed : _hash.substr(0, 8),
			shapeSeed : _hash.substr(8, 8),
			started : _start,
			expired : _start + MATCH_INTERVAL
		}
	}

	window.MatchApply = function(match){
		match = match ? match : window.Match()
		window.match = match
		return match
	}

	window.MatchReload = function(){
		try{
			var n = sessionStorage.matchReload ? sessionStorage.matchReload * 1 : 0

			if(isNaN(n)){
				n = 0
			}

			if(n > 3){
				return
			}

			sessionStorage.matchReload = n + 1
		}catch(err){

		}

		window.location.reload()
	}

	window.MatchRefresh = function(){
		window.MatchApply()
		/*
			개발 Part 30 (판 전환 리셋)
			현행 문제
			  마지막 try 블록이 window.response 를 Callback 으로 재생했다.
			  window.response 는 "전환 직전 판" 의 rows 다.
			  그걸 새 판에 다시 흘리면
			    옛 부동산 레벨 / 소유주
			    옛 팀 깃발
			    옛 플레이어 좌표
			  가 그대로 다시 그려진다.
			  "판이 넘어갔는데 부동산과 깃발이 초기화되지 않는다" 의 직접 원인이다.
			  또한 window.map 하위 컨테이너 / bingo / sticker / nonces /
			  주사위 상태 / current.axis 중 어느 것도 비우지 않아
			  옛 판 잔재가 계속 누적됐다.
			조치
			  옛 응답 재생을 중단하고, 상태를 비운 뒤 즉시 새로 폴링한다.
			  다음 응답은 서버가 새 matchId 로 조회한 결과이므로
			  거기서부터 화면이 새 판으로 정리된다.
		*/
		/* 1) 진행 중이던 주사위를 끊는다. 옛 판 경로 스냅샷이 남으면 좌표가 튄다 */
		try{
			if(window.RollReset){
				window.RollReset()
			}else{
				clearInterval(window.Roll.ing)
				delete window.Roll.ing
				window.Roll.snap = null
				window.Roll.snapKeys = null
				window.Roll.path = null
				window.Roll.pathKeys = null
				window.Roll.pathIdx = -1
				window.Roll.prevX = null
				window.Roll.prevZ = null
			}
			if(window.cookies){
				window.cookies.dice = 0
			}
		}catch(err){
		}
		/* 2) 도메인 상태를 비운다. biomes 는 MapGen.apply 가 다시 채운다 */
		try{
			if(window.MapReset){
				window.MapReset()
			}
		}catch(err){
		}
		try{
			window.bingo = {}
			window.sticker = {}
		}catch(err){
		}
		try{
			if(typeof OAuth3 != "undefined"){
				OAuth3.nonces = []
			}
		}catch(err){
		}
		/* 3) 서버가 주는 새 스폰 좌표를 받도록 좌표 잠금을 푼다 */
		try{
			delete window.current.axis
		}catch(err){
		}
		window.Snap = 8
		/* 4) 출격 상태를 비운다. 새 판은 슬롯이 회복된다 */
		try{
			if(window.Stage){
				window.Stage.blocked = ""
				window.Stage.graceCount = 0
				if(window.Stage.set){
					window.Stage.set("")
				}
			}
			if(window.DeadClose){
				window.DeadClose()
			}
			$(".layer, .layer form.popup").removeClass("on")
			$("body").removeAttr("dead").removeAttr("game").removeAttr("jail")
			$("#flag .red, #flag .blue").removeClass("on")
			$("#flag .red .cnt, #flag .blue .cnt").text(0)
			$("#map flags").html("")
		}catch(err){
		}
		if(window.MapGen){
			window.MapGen.ready = false
			/*
				개발 Part 16 (미니맵)
				매치가 바뀌면 섬 형태가 바뀐다.
				평면화 base64 캐시를 비워 새 맵으로 다시 그린다.
			*/
			window.MapGen.tiles = null
			window.MapGen.dataURL = ""
			window.MapGen.paintedKey = ""
			window.MapGen.colorKey = -1
			window.MapGen.apply(true)
			if(window.MapGen.sync){
				window.MapGen.sync()
			}
		}
		try{
			if(window.FieldsCache){
				window.FieldsCache.hash = ""
				window.FieldsCache.fields = null
				window.FieldsCache.tiles = null
			}
		}catch(err){
		}
		try{
			if(window.FieldsSync){
				window.FieldsSync(true)
			}
		}catch(err){
		}
		/*
			5) 옛 응답은 버리고 새로 받는다.
			   window.response 를 지우지 않으면
			   BoardPoll 의 else 분기(players.self() 실패 시)가
			   다시 옛 응답을 재생할 수 있다.
		*/
		try{
			delete window.response
			if(window.assets && window.assets.set){
				window.assets.set([])
			}
			window.setFrameloop("always")
		}catch(err){
		}
		try{
			if(OAuth3.xhr){
				OAuth3.xhr.abort()
				delete OAuth3.xhr
			}
			if(window.Poll){
				window.Poll()
			}
		}catch(err){
		}
	}
	window.MatchVerify = function(cookies){
		if(!cookies){
			return
		}
		if(typeof cookies.matchIndex == "undefined"){
			return
		}
		var serverIndex = cookies.matchIndex * 1
		if(isNaN(serverIndex)){
			return
		}
		var current = window.match ? window.match : window.MatchApply()
		if(current.index == serverIndex){
			try{
				delete sessionStorage.matchReload
			}catch(err){
			}
			if(!current.timer){
				var left = current.expired - (Date.now() + window.MatchOffset())
				if(left < 1000){
					left = 1000
				}
				current.timer = setTimeout(function(){
					delete current.timer
					window.MatchRefresh()
				}, left)
			}
			return
		}
		try{
			var delta = (serverIndex - current.index) * MATCH_INTERVAL
			localStorage.matchOffset = window.MatchOffset() + delta
		}catch(err){
		}
		window.MatchRefresh()
	}

	window.MatchApply()
})()