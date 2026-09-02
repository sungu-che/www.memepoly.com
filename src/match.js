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

		var $seed = document.getElementById("seed")
		var $shapeSeed = document.getElementById("shapeSeed")

		if($seed){
			$seed.value = match.seed
			$seed.setAttribute("value", match.seed)
		}

		if($shapeSeed){
			$shapeSeed.value = match.shapeSeed
			$shapeSeed.setAttribute("value", match.shapeSeed)
		}

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
					window.MatchReload()
				}, left)
			}

			return
		}

		try{
			var delta = (serverIndex - current.index) * MATCH_INTERVAL

			localStorage.matchOffset = window.MatchOffset() + delta
		}catch(err){

		}

		window.MatchReload()
	}

	window.MatchApply()
})()