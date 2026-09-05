window.RulesetState = {
	loaded : false,
	version : "",
	signature : "",
	raw : null
}

window.RulesetUrl = function(){
	if(typeof OAuth3 != "undefined" && OAuth3.localhost){
		return "http://localhost:3001/ruleset"
	}
	return "https://memepoly.com/ruleset"
}

window.RulesetApply = function(payload){
	if(!payload){
		return false
	}
	try{
		window.RulesetState.raw = payload
		window.RulesetState.version = payload.version ? payload.version : ""
		window.RulesetState.signature = payload.signature ? payload.signature : ""

		/* items */
		if(payload.items && payload.items.length){
			var items = []
			items.natural = []
			items.processed = []
			items.equipment = []
			items.fish = []
			for(var i = 0; i < payload.items.length; i++){
				var it = payload.items[i]
				items.push(it)
				items[it.char] = it
			}
			window.items = items
		}

		/* emojis - method 항목(chat/notify 등)은 런타임에 unshift 되므로 보존한다 */
		if(payload.emojis && payload.emojis.length){
			var keepSelf = window.emojis && window.emojis.self ? window.emojis.self : "😀"
			var methods = []
			var serverIcons = {}
			for(var s = 0; s < payload.emojis.length; s++){
				if(payload.emojis[s] && payload.emojis[s].icon){
					serverIcons[payload.emojis[s].icon] = true
				}
			}
			var localOnly = []
			if(window.emojis && window.emojis.length){
				for(var m = 0; m < window.emojis.length; m++){
					var cur = window.emojis[m]
					if(!cur){
						continue
					}
					if(cur.method){
						methods.push(cur)
						continue
					}
					if(!cur.icon){
						continue
					}
					if(serverIcons[cur.icon]){
						continue
					}
					/* index 는 로컬 배열에서의 원래 위치다 */
					localOnly.push({ index : m, item : cur })
				}
			}
			var next = []
			for(var e = 0; e < payload.emojis.length; e++){
				next.push(payload.emojis[e])
			}
			var offset = 0
			for(var lo = 0; lo < localOnly.length; lo++){
				var at = localOnly[lo].index - methods.length
				if(at < 0){
					at = 0
				}
				if(at > next.length){
					at = next.length
				}
				next.splice(at, 0, localOnly[lo].item)
				offset++
			}
			for(var mm = methods.length - 1; mm >= 0; mm--){
				next.unshift(methods[mm])
			}
			next.self = keepSelf
			window.emojis = next
			if(offset > 0){
				console.log("[ruleset] kept " + offset +
					" local-only emoji(s). add them to server emojis.js and reseed")
			}
		}

		/* recipes */
		if(payload.recipes && payload.recipes.length){
			var recipes = []
			for(var r = 0; r < payload.recipes.length; r++){
				var rc = payload.recipes[r]
				recipes.push(rc)
				recipes[rc.result] = rc
			}
			window.Recipes = recipes
		}

		/* property */
		if(payload.property){
			if(payload.property.cost){ window.PropertyCost = payload.property.cost }
			if(payload.property.toll){ window.PropertyToll = payload.property.toll }
			if(payload.property.type){ window.PropertyType = payload.property.type }
			if(payload.property.emoji){ window.PropertyLevelEmoji = payload.property.emoji }
			if(payload.property.materials){ window.PropertyMaterials = payload.property.materials }
		}

		/* roles */
		if(payload.roles){
			var maxHp = {}
			var spec = {}
			for(var role in payload.roles){
				if(payload.roles.hasOwnProperty(role)){
					var rr = payload.roles[role]
					maxHp[role] = rr.hp
					spec[role] = {
						name : rr.name,
						emoji : rr.emoji,
						hp : rr.hp,
						backpack : rr.backpack,
						desc : rr.desc
					}
				}
			}
			window.MaxHp = maxHp
			window.RoleSpec = spec
		}

		/* biome colors */
		if(payload.biomeColors){
			window.Biomes = payload.biomeColors
		}
		if(payload.biomeEffects){
			window.BiomeEffects = payload.biomeEffects
		}
		if(payload.matchups){
			window.RoleMatchups = payload.matchups
		}

		/* 서명 재계산 없이 서버 값을 그대로 채택한다 */
		window.RecipeSignature = window.RulesetState.signature
		window.RulesetState.loaded = true
		return true
	}catch(err){
		console.log("ruleset apply err", err)
		return false
	}
}

window.RulesetLoad = function(callback){
	var cacheKey = "memepoly.ruleset"
	var cached = null
	try{
		var raw = localStorage.getItem(cacheKey)
		if(raw){
			cached = JSON.parse(raw)
		}
	}catch(err){
		cached = null
	}
	if(cached){
		window.RulesetApply(cached)
	}

	var url = window.RulesetUrl()
	var headers = {}
	if(cached && cached.signature){
		headers["If-None-Match"] = '"' + cached.signature + '"'
	}

	fetch(url, { headers : headers, cache : "no-cache" })
		.then(function(res){
			if(res.status == 304){
				if(callback){ callback(true) }
				return null
			}
			if(!res.ok){
				throw new Error("ruleset http " + res.status)
			}
			return res.json()
		})
		.then(function(payload){
			if(!payload){
				return
			}
			var ok = window.RulesetApply(payload)
			if(ok){
				try{
					localStorage.setItem(cacheKey, JSON.stringify(payload))
				}catch(err){
				}
			}
			if(callback){ callback(ok) }
		})
		.catch(function(err){
			console.log("ruleset load err", err)
			if(callback){ callback(false) }
		})
}

window.RulesetLoad()