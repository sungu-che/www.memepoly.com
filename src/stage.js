window.Stage = {
	current : "",
	raidTimer : null,
	miaTimer : null
}

window.Stage.set = function(name){
	window.Stage.current = name

	if(name){
		$("body").attr("stage", name)
	}else{
		$("body").removeAttr("stage")
	}
}

window.Notice = function(head, body, ms){
	var $n = $("#notice")

	if(!$n.length){
		return
	}

	$n.find(".head").text(head ? head : "")
	$n.find(".body").html(body ? body : "")
	$n.addClass("on")

	if(window.Notice.timer){
		clearTimeout(window.Notice.timer)
	}

	window.Notice.timer = setTimeout(function(){
		$n.removeClass("on")
	}, ms ? ms : 2600)
}

window.ExitKeys = function(){
	var cookies = window.cookies

	if(!cookies){
		return []
	}

	if(!cookies.exitKeys){
		return []
	}

	return cookies.exitKeys.split(",").filter(function(v){
		return v.length > 0
	})
}

window.Lobby = function(){
	var cookies = window.cookies

	if(!cookies){
		return
	}

	var hash = cookies.address ? cookies.address : cookies.hash
	var role = cookies.role ? cookies.role : "PLAYER"
	var maxHp = window.MaxHp[cookies.role ? cookies.role : ""]
	var hp = typeof cookies.hp != "undefined" ? cookies.hp : maxHp
	var backpack = cookies.backpack ? cookies.backpack : 3

	var $l = $("#lobby")

	if(!$l.length){
		return
	}

	var property = cookies.property ? cookies.property * 1 : 0

	$l.find(".stat .role span").text(role)
	$l.find(".stat .balance span").text(cookies.balance ? cookies.balance : 0)
	$l.find(".stat .hp span").text(hp + " / " + maxHp)
	$l.find(".stat .backpack span").text(backpack + (property >= 3 ? " ↑" : ""))

	if(!$l.find(".stat .property").length){
		$l.find(".stat").append('<li class="property"><i class="emoji color">🏠</i><span></span></li>')
	}

	$l.find(".stat .property span").text(property)

	if(!$l.find(".profile .icon canvas").length){
		try{
			$l.find(".profile .icon").append(blockies.create({
				seed : hash.indexOf("0x") == 0 ? hash : "0x" + hash
			}))
		}catch(err){

		}
	}

	var keys = window.ExitKeys()
	var body = ""

	for(var i = 0; i < keys.length; i++){
		body += '<li><i class="emoji color">' + keys[i] + '</i></li>'
	}

	if(!body){
		body = '<li><i class="emoji color">❔</i></li>'
	}

	$l.find(".keys .list").html(body)

	window.Stage.set("lobby")
}

window.Raid = function(){
	window.Stage.set("raid")

	var $bar = $("#raid .progress .bar")
	var $tip = $("#raid .tip")

	var keys = window.ExitKeys()

	if(keys.length){
		$tip.html("Find one of " + keys.join(" ") + " to extract")
	}else{
		$tip.html("Preparing the board")
	}

	var pct = 0

	if(window.Stage.raidTimer){
		clearInterval(window.Stage.raidTimer)
	}

	window.Stage.raidTimer = setInterval(function(){
		pct += 7

		if(pct > 92){
			pct = 92
		}

		$bar.css("width", pct + "%")
	}, 120)

	var _role = ""
	try{
		_role = sessionStorage.raidRole ? sessionStorage.raidRole : ""
		delete sessionStorage.raidRole
	}catch(err){
	}
	if(window.Action){
		window.Action({
			cc : "start",
			role : _role
		})
	}
}
window.RaidDone = function(){
	if(window.Stage.current != "raid"){
		return
	}

	if(window.Stage.raidTimer){
		clearInterval(window.Stage.raidTimer)

		delete window.Stage.raidTimer
	}

	$("#raid .progress .bar").css("width", "100%")

	setTimeout(function(){
		window.Stage.set("")

		$("#raid .progress .bar").css("width", "0")

		window.Notice("RAID START", "Roll the dice to move", 2200)
	}, 400)
}

window.StageSync = function(cookies){
	if(!cookies){
		return
	}

	/*
		개발 Part 3
		룰셋은 서버 DB 가 단일 원천이며 src/ruleset.js 가 /ruleset 으로 받아온다.
		서명 불일치는 "정적 파일 폴백 중" 또는 "룰셋 캐시가 낡음" 을 의미하므로
		경고 후 룰셋을 재로드한다.
	*/
	if(cookies.recipeSignature && window.RecipeSignature){
		if(cookies.recipeSignature != window.RecipeSignature && !window.StageSync.warned){
			window.StageSync.warned = true
			console.log("ruleset mismatch", window.RecipeSignature, cookies.recipeSignature)
			if(window.RulesetLoad){
				try{
					localStorage.removeItem("memepoly.ruleset")
				}catch(err){
				}
				window.RulesetLoad(function(ok){
					if(ok){
						console.log("ruleset reloaded :", window.RecipeSignature)
					}else{
						window.Notice("RULESET SYNC", "Using local fallback data", 3000)
					}
				})
			}else{
				window.Notice("VERSION MISMATCH", "Recipe data differs from server", 4000)
			}
		}
	}

	if(cookies.jail){
		$("body").attr("jail", "true")
	}else{
		$("body").removeAttr("jail")
	}

	if(cookies.raidBlocked){
		window.Notice("DEPLOY BLOCKED", "No slots left this match", 3000)
		window.Stage.set("")
	}
	if(cookies.exitBlocked){
		var keys = window.ExitKeys()

		window.Notice("EXTRACTION FAILED", "You need " + keys.join(" "), 3200)
	}

	if(cookies.exited){
		window.Notice("EXTRACTED", "Loot moved to My Room", 2600)

		setTimeout(function(){
			window.location.hash = (cookies.address ? cookies.address : cookies.hash).replace("0x", "")
		}, 1200)

		return
	}

	if(cookies.mia){
		window.Notice("MIA", "You failed to extract in time", 3000)

		if(window.Action){
			window.Action({
				cc : "mia"
			})
		}

		setTimeout(function(){
			window.location.hash = (cookies.address ? cookies.address : cookies.hash).replace("0x", "")
		}, 1600)

		return
	}

	if(cookies.enter){
		var limit = cookies.raidLimit ? cookies.raidLimit * 1 : 20 * 60 * 1000
		var left = (cookies.enter * 1) + limit - Date.now()

		if(left > 0){
			if(window.Stage.miaTimer){
				clearTimeout(window.Stage.miaTimer)
			}

			window.Stage.miaTimer = setTimeout(function(){
				if(window.Poll){
					window.Poll()
				}
			}, left + 500)
		}

		if(window.Stage.current == "raid"){
			window.RaidDone()
		}
	}else{
		if(window.Stage.current != "lobby" && window.Stage.current != "raid"){
			if(window.Mode() == "board"){
				window.Lobby()
			}
		}
	}
}

$(document).on("click", "#lobby .btn.raid", function(e){
	e.preventDefault()

	window.Raid()
})

$(document).on("click", "#lobby .btn.stash", function(e){
	e.preventDefault()

	var cookies = window.cookies

	if(!cookies){
		return
	}

	window.Stage.set("")

	window.location.hash = (cookies.address ? cookies.address : cookies.hash).replace("0x", "")
})