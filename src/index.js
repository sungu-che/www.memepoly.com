var timezoneOffset = new Date().getTimezoneOffset() * 60 * 1000

if(!OAuth3.isMobile){
	document.querySelector(".react .three").className = "three pc";
}

window.bingo = {}


window.emojiUnicode = function(input) {
	return emojiUnicode.raw(input).split(' ').map(val => parseInt(val).toString(16)).join('_')
}

window.emojiUnicode.raw = function (input) {
	if (input.length === 1) {
		return input.charCodeAt(0).toString();
	}
	else if (input.length > 1) {
		const pairs = [];
		for (var i = 0; i < input.length; i++) {
			if (
				// high surrogate
				input.charCodeAt(i) >= 0xd800 && input.charCodeAt(i) <= 0xdbff
			) {
				if (
					input.charCodeAt(i + 1) >= 0xdc00 && input.charCodeAt(i + 1) <= 0xdfff
				) {
					// low surrogate
					pairs.push(
						(input.charCodeAt(i) - 0xd800) * 0x400
					  + (input.charCodeAt(i + 1) - 0xdc00) + 0x10000
					);
				}
			} else if (input.charCodeAt(i) < 0xd800 || input.charCodeAt(i) > 0xdfff) {
				// modifiers and joiners
				pairs.push(input.charCodeAt(i))
			}
		}
		return pairs.join(' ');
	}

	return '';
};

window.emojis.self = "😀"

window.Subscribe = function(){
	var $form = document.querySelector('form[name="xim.city"]');

	if(OAuth3.xhr){
		OAuth3.xhr.abort()
		delete OAuth3.xhr
	}

	var vapid = $form.vapid.value

	var body = {
		emoji : window.emojis.self,
		cc : "vapid",
		vapid : vapid
	}

	var query = {
		href : window.location.href,
		hash : window.cookies.hash,
		token : window.cookies.token,
		x : window.cursor.current.position.x,
		y : window.cursor.current.position.y,
		z : window.cursor.current.position.z
	}

	var url = "https://xim.city";

	if(OAuth3.localhost){
		url = "http://localhost:3001"
	}

	OAuth3.xhr = OAuth3.fetch({
		method : "POST",
		url : url,
		query : query,
		body : body
	}, function(res){
		if(OAuth3.xhr){
			OAuth3.xhr.abort()
			delete OAuth3.xhr
		}

		var cookies = JSON.parse(res.body.cookies)

		if(cookies.vapid){
			var $submit = $form.querySelector('input[type="submit"]')

			$submit.setAttribute('readonly','readonly')
			$submit.value = "close"
		}
	});
}

function listToBiomes(list, elementsPerSubArray) {
	var matrix = [], i, k;

	for (i = 0, k = -1; i < list.length; i++) {
		if (i % elementsPerSubArray === 0) {
			k++;
			matrix[k] = [];
		}

		matrix[k].push(list[i]);
	}

	var area = (window.grid ? window.grid.area : 100)
	var index = - (area / 2)

	var biomes = []

	matrix.forEach(function(list, k){
		list.forEach(function(item, i){
			if(item){
				item.x = index + 0.5
				item.y = item.elevation * 5
				item.z = (i - area) + 0.5

				window.map.biomes[item.x+":"+item.z] = item
				
				if(window.players.length){

				}else if(!item.water){
					if(Math.random() < 0.1){
						biomes.x = item.x
						biomes.y = item.y
						biomes.z = item.z
					}
				}

				biomes.push(item)
			}
		})

		index += 1
	})

	return biomes;
}

window.Biomes = {
	// biomes
	"#OCEAN": "#44447a",
	"#44447a" : "",
	"#COAST": "#33335a",
	"#33335a" : "",
	"#LAKESHORE": "#225588",
	"#225588" : "",
	"#LAKE": "#336699",
	"#336699" : "",
	"#RIVER": "#225588",
	"#225588" : "",
	"#MARSH": "#2f6666",
	"#2f6666" : "",
	"#ICE": "#99ffff",
	"#99ffff" : "❄️",
	"#BEACH": "#a09077",
	"#a09077" : "🌴",
	"#ROAD1": "#442211",
	"#442211" : "🌲",
	"#ROAD2": "#553322",
	"#553322" : "🌲",
	"#ROAD3": "#664433",
	"#664433" : "🌲",
	"#BRIDGE": "#686860",
	"#686860" : "🌲",
	"#LAVA": "#cc3333",
	"#cc3333" : "🪨",

	// Terrain
	"#SNOW": "#ffffff",
	"#ffffff" : "❄️",
	"#TUNDRA": "#bbbbaa",
	"#bbbbaa" : "🪨",
	"#BARE": "#888888",
	"#888888" : "🪨",
	"#SCORCHED": "#555555",
	"#555555" : "🪨",
	"#TAIGA": "#99aa77",
	"#99aa77" : "🎄",
	"#SHRUBLAND": "#889977",
	"#889977" : "🌵",
	"#TEMPERATE_DESERT": "#c9d29b",
	"#c9d29b" : "🌵",
	"#TEMPERATE_RAIN_FOREST": "#448855",
	"#448855" : "🌳",
	"#TEMPERATE_DECIDUOUS_FOREST": "#679459",
	"#679459" : "🌾",
	"#GRASSLAND": "#88aa55",
	"#88aa55" : "🌾",
	"#SUBTROPICAL_DESERT": "#d2b98b",
	"#d2b98b" : "🛢",
	"#TROPICAL_RAIN_FOREST": "#337755",
	"#337755" : "🌳",
	"#TROPICAL_SEASONAL_FOREST": "#559944",
	"#559944" : "🌳"
}

function getHashtag(str){
	var hashtag = ""
	var hashtags = str.match(/\B#[A-Za-z0-9\-\.\_]+\b/g)

	if(hashtags.length){
		hashtags.forEach(function(h, i){
			if(!hashtag){
				hashtag = h
			}
		})
	}

	return hashtag
}


window.oembed = function(url){
	var id = ""
	var provider = ""
	var src = ""

	if(url.host.indexOf("youtube.com") > -1){
		provider = "youtube"
		if(url.pathname.indexOf("/shorts/") > -1){
			id = url.pathname.replace("/shorts/","")
		}else{
			id = url.searchParams.get("v")
		}

		src = 'https://i.ytimg.com/vi/'+id+'/default.jpg'
	}

	if(url.host.indexOf("youtu.be") > -1){
		provider = "youtube"

		id = url.pathname.replace("/shorts/","/watch?v=")
	}

	return {
		id : id,
		host : url.host,
		provider : provider,
		src : src
	}
}

window.typeof_emoji = function(icon){
	for(var i = 0; i < window.emojis.length; i++){
		var emoji = window.emojis[i];

		if(emoji.icon == icon){
			if(emoji.webp){
				return emoji.type
			}else{
				return false
			}
		}
	}

	return false
}

window.typeof_item = function(icon){
	for(var i = 0; i < items.length; i++){
		var item = items[i];

		if(item.char == icon){
			return true
		}
	}

	return false
}

window.isItem = function(icon){
	for(var i = 0; i < window.items.length; i++){
		var item = window.items[i];

		if(item.char == icon){
			return emoji.type
		}
	}

	return false
}

function padToBytes32 (n) {
	while (n.length < 40) {
		n = "0" + n;
	}
	return "0x" + n;
}

window.numStringToBytes32 = function(num) { 
	var bn = new BN(num).toTwos(256);
	return padToBytes32(bn.toString(16));
}

window.bytes32ToNumString = function(bytes32str) {
	bytes32str = bytes32str.replace(/^0x/, '');
	var bn = new BN(bytes32str, 16).fromTwos(256);
	return bn.toString();
}

window.randomHash = function(){
	var account = ethers.Wallet.createRandom()

	return account.address.toLowerCase()
}

window.players = []
window.players.set = function(){

}

window.players.self = function(){
	return  {
		follow : false,
		self : true,
		hash : window.cookies.address ? window.cookies.address : window.cookies.hash,
		emoji : "😀",
		x : 1.5,
		y : 0.5,
		z : 1.5
	}
}


OAuth3.on("ready", function(e){
	var random = function(min, max) {
		return Math.floor(Math.random() * (max - min + 1)) + min;
	}

	var rowsTrim = function(rows, key, value){
		if(typeof key != "undefined" && typeof value != "undefined"){
			for(var r = 0; r < rows.length; r++){
				if(rows[r][key] == value){
					rows[r] = undefined
				}
			}
		}

		return rows.filter(function( row ) {
			return row !== undefined;
		})
	}

	var lang = navigator.language || navigator.userLanguage;

			
	if(Intl){
		lang = Intl.DateTimeFormat().resolvedOptions().locale;

		if(lang != "ko"){
			lang = "en";
		}
	}else{
		if(timezoneOffset == -32400000){
			lang = "ko";
		}else{
			lang = "en";
		}
	}

	document.querySelector("html").setAttribute("lang",lang);

	var dialogFlow = []
	var form_template = ""

	var flow_template = ""

	var $body = $("body")
	var $nav = $('input[id="nav"]')

	var $aside = $(".aside")
	var $status = document.querySelector(".aside .status")

	var url = new URL(window.location.href)

	var host_address = ethers.hashMessage((url.host+"/"))
		host_address = ethers.computeAddress(host_address).toLowerCase()

	var $mode = $('input[name="mode"]:checked')
	var mode = $mode.val()

	var $root = $('#root.fiber')

	$root
		.removeAttr("nth")
		.removeAttr("count")

	$('#root.fiber>div>div').removeClass("flex")

	var w = document.documentElement.scrollWidth
	var h = document.documentElement.scrollHeight

	$body.attr("axis", (w > h ? "x" : "y"))

	if(window.flutter_inappwebview){
		$body.attr("app", OAuth3.isMobile)
	}

	try{
		var style = ["style1", "style2", "style3", "style4"];
		var tam = ["tam1", "tam1", "tam1", "tam2", "tam3"];
		var opacity = ["opacity1", "opacity1", "opacity1", "opacity2", "opacity2", "opacity3"];

		function getRandomArbitrary(min, max) {
			return Math.floor(Math.random() * (max - min)) + min;
		}

		var estrela = "";
		var qtdeEstrelas = 350;
		var noite = document.querySelector(".constelacao");

		for (var i = 0; i < qtdeEstrelas; i++) {
			estrela += "<span class='estrela " + style[getRandomArbitrary(0, 4)] + " " + opacity[getRandomArbitrary(0, 6)] + " "
			+ tam[getRandomArbitrary(0, 5)] + "' style='animation-delay: ." +getRandomArbitrary(0, 9)+ "s; left: "
			+ getRandomArbitrary(0, 100) + "%; top: " + getRandomArbitrary(0, 100) + "%;'></span>";
		}

		noite.innerHTML = estrela;

		window.resize(Starry)
	}catch(err){

	}

	if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
		// Firefox 38+ seems having support of enumerateDevicesx
		navigator.enumerateDevices = function(callback) {
			navigator.mediaDevices.enumerateDevices().then(callback);
		};
	}

	// window.step = localStorage.tutorial ? localStorage.tutorial * 1 : 1

	$body.addClass("loading")

	var $go = $("#go")

	if(window.location.hash){		
		$go.removeAttr("href")
		
		$("#nav").prop("checked",false)

		var address = window.location.hash.replace("#","0x")

		$("#intro .title .emoji").html("")
		$("#intro .title .emoji").append(blockies.create({seed: address}))

		if(host_address.indexOf(address) == -1){
			$("#intro .coptyright p").html('<span class="address">\
				<address>\
					<span>'+address+'</span>\
					<span dir="rtl">'+address+'</span>\
				</address>\
			</span>')
		}
	}


	function Zoom(){
		var $zoom = $(".zoom_toggle a.zoom")

		if($zoom.hasClass("color")){
			$zoom.removeClass("color")

			var _far = window.far
			
			_far.x = 4.5
			_far.y = 4.5
			_far.z = 4.5

			window.speed = 0.1

			window.far.set(_far)
			

			$body.removeAttr("zoom")
			$body.removeAttr("class")
		}
	}


	window.Withdrawal = function(){
		var player = window.players.self()

		if(player){
			var bool = window.confirm('Withdrawal Confirm')

			if(bool){
				var $form = document.forms.feedback
				var hash = $form.hash.value
				var token = $form.token.value

				var body = {}

				var url = "https://xim.city/withdrawal"

				if(OAuth3.localhost){
					url = "http://localhost:3001"
				}

				if(window.tutorial){
					document.forms.Tutorial.index.value = ""
					$body.removeAttr("tutorial")
					$body.removeAttr("step")
					$(".layer, .layer form.popup").removeClass("on")

					delete window.tutorial
					if(window.location.href == window.response.body.query.href){
						window.Callback(window.response)
					}else{
						delete window.response
					}
					window.Polling = setInterval(window.Poll)
				}else{
					clearInterval(window.Polling)

					if(OAuth3.xhr){
						OAuth3.xhr.abort()
						delete OAuth3.xhr
					}
					
					OAuth3.fetch({
						method : "GET",
						url : url,
						body : body,
						query : {
							method : "DELETE",
							href : window.location.href,
							hash : hash,
							token : token,
							x : player.x ? player.x : "1.5",
							y : player.y ? player.y : "0",
							z : player.z ? player.z : "1.5"
						}
					}, function(res){
						window.location.href = OAuth3.host+"/logout"
					});
				}
			}
		}
	}

	window.Feedback = function(){
		var player = window.players.self()

		if(player){
			var $form = document.forms.feedback
			var hash = $form.hash.value
			var token = $form.token.value

			var body = {
				cc : "feedback",
				subject : $form.subject.value,
				emoji : $form.emoji.value
			}

			if(body.subject){
				$(".layer, .layer form.popup").removeClass("on")
				emojiChanged("🫥")

				OAuth3.fetch({
					method : "POST",
					url : url,
					body : body,
					query : {
						href : window.location.href,
						hash : hash,
						token : token,
						x : player.x ? player.x : "1.5",
						y : player.y ? player.y : "0",
						z : player.z ? player.z : "1.5"
					}
				}, window.Callback);
			}
		}
	}

	window.Tutorial = function(value, step){
		var $form = document.forms.Tutorial
		var $index = $form.index

		$index.selectedIndex = value = value ? value : $index.selectedIndex

		if(typeof step == "undefined"){
			step = 0
		}

		value = $($form).find("option").eq(value).val()

		if(!window.tutorial){
			window.tutorial = {
				mines : {},
				opens : {},
				flags : {}
			}
		}

		window.tutorial.name = value
		window.tutorial.step = step

		$body.attr("tutorial", value)
		$body.attr("step", step)

		window.Callback(window.response)
	}

	function emojiChanged(emoji, local){
		var player = window.players.self()

		if(player){
			var _players = window.players
			var len = players.length

			var query = {
				href : window.location.href,
				hash : cookies.hash,
				token : cookies.token,
				x : player.x,
				y : player.y,
				z : player.z
			}

			var _to = ""

			if($body.attr("bingo") == "dialog"){
				if(window.dialog){
					_to = window.dialog.to
					if(window.cookies.to){
						_to = window.cookies.to
					}else{
						_to = window.dialog.to
					}

					_to = (_to.indexOf("0x") == 0 ? _to : "0x"+_to) * 1									

				}else if(window.location.hash){
					_to = window.location.hash.replace("#","0x") * 1
				}
			}

			if(_to){
				var _from = (window.cookies.address ? window.cookies.address : "0x"+window.cookies.hash) * 1

				var _address

				if(_from > _to){
					_address = ethers.hashMessage(_from.toString() + _to.toString())
					_address = ethers.computeAddress(_address).toLowerCase()
				}else{
					_address = ethers.hashMessage(_to.toString() + _from.toString())
					_address = ethers.computeAddress(_address).toLowerCase()
				}

				if(OAuth3.localhost){
					query.href = "http://" + OAuth3.localhost +"/"+ _address.replace("0x","#")
				}else{
					query.href = window.location.origin +"/"+ _address.replace("0x","#")
				}
				query.to = _address
			}

			var position = window[player.hash].group.current.position

			for(var i = 0; i < len; i++){
				if(_players[i].hash == cookies.hash || _players[i].hash == cookies.address){
					_players[i].self = true
					_players[i].emoji = emoji
					_players[i].x = position.x
					_players[i].y = position.y
					_players[i].z = position.z
				}
			}

			if(emoji.length){
				delete window.emojis.message

				var body = {
					emoji : emoji
				}

				var url = "https://xim.city"

				if(OAuth3.localhost){
					url = "http://localhost:3001"
				}

				var type = window.typeof_emoji(emoji)

				if(type == "emoji"){
					if(!local){
						OAuth3.fetch({
							method : "POST",
							query : query,
							body : body,
							url : url
						}, window.Callback);
					}
				}

				var players_ = JSON.stringify(_players)

				window.players.set(JSON.parse(players_))

				$aside.removeClass("more")

				if(type){
					$('[id="'+player.hash+'"][alt="player"]').attr("type","image")
				}else{
					$('[id="'+player.hash+'"][alt="player"]').attr("type","text")
				}
			}
		}
	}

	window.getFlow = function(){
		// 메뉴 & 멤버 조회
		var Cc = window.location.origin;

		if(OAuth3.localhost){
			Cc = "http://"+OAuth3.localhost;
		}

		var url = new URL(window.location.href)

		var cc_address = url.hash.replace("#","0x")

		// var hash = "#"+crc32(window.location.hash).toString(32).toUpperCase();

		var username = "";
		var search = window.location.search.split("@");

		if(search[1]){
			username = decodeURIComponent(search[1])+"@";
		}

		var hash = ""

		if(window.dialog){
			hash = window.dialog.to.replace("0x", "#")
		}else{
			hash = window.location.hash
		}

		Cc += window.location.pathname+search[0]+hash;

		var request = {
			method : "GET",
			url : OAuth3.host,
			query : {
				href : Cc,
				to : "form",
				cc : Cc
			}
		}

		// 값 받기
		var response = function(res){
			if(OAuth3.xhr && res.timeStamp){
				OAuth3.xhr.abort()
				delete OAuth3.xhr
			}

			try{
				var $form = document.querySelector('form[name="oauth.network"]');

				var cookies = JSON.parse(res.body.cookies);

				sessionStorage["form"+cc_address] = JSON.stringify(res)

				var rows = res.body.rows;

				var date = new Date();
				var len = rows.length;

				var limit = rows.limit;
				var To = "";
				var table = {};

				if(len){
					var tooltip = document.querySelector('field[draggable="false"]');
					var $flows = tooltip.querySelector('flows');

					for(var f = 0; f < len; f++){
						var row = rows[f];
						var team = false;

						if(row.To == "field"){
							var $flow = document.createElement("flow");
								$flow.setAttribute("id", row.Id);
								$flow.setAttribute("from", row.From);
								$flow.setAttribute("to", row.To);
								$flow.setAttribute("cc", row.Cc);
								$flow.setAttribute("subject", row.Subject);
								$flow.setAttribute("flag", row.Flag);
								$flow.setAttribute("date", row.Date);

							$flow.textContent = row.Subject;


							$flows.appendChild($flow);
						}

						var clientAddress = ethers.hashMessage(row.From)
							clientAddress = ethers.computeAddress(clientAddress).toLowerCase()

						if(cc_address == clientAddress){
							team = true
						}

						var index = row.Id.split(" ");

						var formId = "";
						var fieldId = "";
						var fieldIndex = "";
						var inputId = "";
						var inputIndex = "";
						var contentIndex = "";

						for(var i = 0; i < index.length; i++){
							var idx = index[i];

							var num = idx*1;

							if(num > 0){
								if(contentIndex){
									if(!table[formId].Content[contentIndex]){
										table[formId].Content[contentIndex] = row;
									}

									if(table[formId].Content.Length <= num){
										table[formId].Content.Length = num;
									}

									if(row.To == "file"){
										table[formId].Content[contentIndex].data = row.data;
									}

									if(row.To == "link"){
										table[formId].Content[contentIndex].link = row.Subject;
									}

									if(row.To == "count"){
										table[formId].Content[contentIndex].count = row.Subject;
									}
								}else{
									if(typeof table[formId][fieldIndex] == "undefined"){
										table[formId][fieldIndex] = {
											Idx : fieldId,
											Th : {Length : 0},
											Td : {Length : 0}
										}
									}

									if(!inputId){
										if(row.To == "field"){
											inputIndex = 0;
											inputId = fieldId;
											table[formId].Length += 1;
										}

										if(row.To == "file"){
											table[formId][fieldIndex].Th.data = row.data;
										}

										if(row.To == "link"){
											table[formId][fieldIndex].Th.link = row.Subject;
										}
									}

									if(team){
										if(table[formId][fieldIndex].Th.Length <= num){
											table[formId][fieldIndex].Th.Length = num;
										}

										if(!table[formId][fieldIndex].Th[inputIndex]){
											table[formId][fieldIndex].Th[inputIndex] = row;
											table[formId][fieldIndex].Th[inputIndex].Idx = inputId;
										}

										if(row.To == "file"){
											table[formId][fieldIndex].Th[inputIndex].data = row.data;
										}

										if(row.To == "link"){
											table[formId][fieldIndex].Th[inputIndex].link = row.Subject;
										}

										if(row.To == "field"){
											table[formId][fieldIndex].Subject = row.Subject;
										}

									}else{
										table[formId][fieldIndex].Td[inputIndex] = row;
										table[formId][fieldIndex].Td[inputIndex].Idx = inputId;
									}
								}
							}else if(!formId){
								formId = idx+"";
								var nextIndex = index[i+1];

								if(typeof table[idx] == "undefined"){
									table[idx] = {
										Idx : idx,
										Length : 0
									};
								}

								if(typeof nextIndex == "undefined"){
									if(row.To == "count"){
										if(row.Subject){
											table[idx].Count = row.Subject * 1;
										}
									}

									if(row.To == "created"){
										if(row.Subject){
											table[idx].Created = row.Subject;
										}
									}
									
									if(row.To == "guest"){
										table[idx].Guest = row.Id;
									}

									if(row.To == "started"){
										if(row.Subject){
											table[idx].Started = row.Subject;
										}
									}

									if(row.To == "expired"){
										if(row.Subject){
											table[idx].Expired = row.Subject;
										}
									}

									if(row.To == "file"){
										if(row.data){
											table[idx].data = row.data;
										}
									}

									if(row.To == "link"){
										if(row.data){
											table[idx].link = row.Subject;
										}
									}
								}else if((nextIndex*1) > 0){
									contentIndex = nextIndex;
								}

								if(row.To == "content"){
									if(typeof table[idx].Content == "undefined"){
										table[idx].Content = [];
										table[idx].Content.Length = 0;
									}
								}
							}else if(!fieldId){
								fieldId = idx;
								fieldIndex = index[i+1];
							}else if(!inputId){
								inputId = idx;
								if(row.To != "field"){
									fieldIndex = index[i+1];
									inputIndex = index[i+2];

									if(typeof table[formId][fieldIndex] == "undefined"){
										table[formId][fieldIndex] = {
											Idx : fieldId,
											Th : {Length : 0},
											Td : {Length : 0}
										}
									}
								}
							}
						}
					}
				}

				if(Object.keys(table).length){
					window.dialog.flow = table
					window.dialog.flow.id = rows[0].Id

					var address = ethers.hashMessage(rows[0].From)
						address = ethers.computeAddress(address).toLowerCase()

					window.dialog.flow.to = address
					window.dialog.flow.cc = rows[0].Cc
					window.dialog.flow.subject = rows[0].Subject
					window.dialog.flow.flag = rows[0].Flag
					window.dialog.flow.date = rows[0].Date

					var _from = (cookies.address ? cookies.address : "0x"+cookies.hash) * 1
					var _to = (window.dialog.flow.to.indexOf("0x") == 0 ? window.dialog.flow.to : "0x"+window.dialog.flow.to) * 1
					var _address

					if(cookies.to == _from && cookies.from){
						_from = (cookies.from.indexOf("0x") == 0 ? cookies.from : "0x"+cookies.from) * 1
					}

					if(_from > _to){
						_address = ethers.hashMessage(_from.toString() + _to.toString())
						_address = ethers.computeAddress(_address).toLowerCase()
					}else{
						_address = ethers.hashMessage(_to.toString() + _from.toString())
						_address = ethers.computeAddress(_address).toLowerCase()
					}

					window.dialog.flow.from = _address
					window.dialog.flow.response = res
				}
			}catch(err){
				console.log("err",err);
			}

				

			if(typeof window.Polling == "undefined"){
				window.Polling = setInterval(window.Poll)
			}
		}

		if(sessionStorage["form"+cc_address]){
			response(JSON.parse(sessionStorage["form"+cc_address]))
		}else if(OAuth3.xhr){
			OAuth3.xhr.abort()
			delete OAuth3.xhr
		}

		OAuth3.xhr = OAuth3.fetch(request, response);
	}

	window.getTable = function(intent, mode, resp, flows, hash){
		var player

		try{
			player = window.players.self()
		}catch(err){
			var _hash = ""
			player = {
				follow : false,
				self : true,
				hash : window.cookies.address ? window.cookies.address : window.cookies.hash,
				emoji : "😀",
				x : 1.5,
				y : 0.5,
				z : 1.5
			}
		}

		$(".aside, messages").removeClass("on")

		$body.attr("bingo", "dialog")
		$nav.prop("checked",false)

		if(!window.dialog){
			dialogFlow = []
			flow_template = ""

			$("messages ul").html("")
		}

		var $form = document.querySelector('form[name="oauth.network"]')

		var flow

		if(flows){
			try{
				var _flow = flows[window.dialog.index-1]

				if(_flow){
					if(_flow.link){
						var flags = _flow.link.split(" ")

						var field = $form.querySelector('[id="'+flags[1]+'"]')

						if(field){
							dialogFlow.push(field.outerHTML)
						}
					}
				}
			}catch(err){
				console.log("err",err);
			}

			try{
				flow = flows[window.dialog.index]
			}catch(err){

			}
		}

		if(form_template.length > 0){
			$form.outerHTML = form_template
			$form = document.querySelector('form[name="oauth.network"]');
		}else{
			form_template = $form.outerHTML

			OAuth3.on("submit", function(e){
				var $form = e.target

				if($form.name == "oauth.network"){
					e.preventDefault()
					var contenteditable = $form.getAttribute("contenteditable")
					
					OAuth3.submit($form)
					
					return
				}
			})
		}

		var tooltip = document.querySelector('field[draggable="false"]');

		if(intent == "flows"){
			var $radio = tooltip.querySelector('items item.radio')
				$radio.className = "flow"
				$radio.setAttribute("type","flow")

			var $checkbox = tooltip.querySelector('items item.checkbox')
				$checkbox.className = "item"
				$checkbox.setAttribute("type","item")
		}

		if(mode){
			$body.addClass("contenteditable")	
		}

		
		$form.className = (mode ? "on" : "on dialog")+" "+intent
		$form.setAttribute("intent",intent)
		
		var Cc = window.location.origin

		if(OAuth3.localhost){
			Cc = "http://"+OAuth3.localhost
		}

		var url = new URL(window.location.href)

		var cc_address = url.hash.replace("#","0x")

		if(hash && !window.dialog){
			if(hash.indexOf("0x") == 0){
				hash = hash.replace("0x", "#")
			}else{
				hash = "#"+hash
			}

			window.dialog = {
				to : hash.replace("#","0x")
			}
		}else if(window.dialog){
			cc_address = window.dialog.to.indexOf("0x") == 0 ? window.dialog.to : player.hash

			hash = cc_address.replace("0x", "#")
		}else{
			hash = window.location.hash
		}


		var username = ""
		var search = window.location.search.split("@")

		if(search[1]){
			username = decodeURIComponent(search[1])+"@"
		}

		Cc += hash

		if(Cc && $form){
			$form.setAttribute("cc", Cc)

			var request = {
				method : "GET",
				url : OAuth3.host,
				query : {
					href : Cc,
					to : intent,
					cc : Cc
				}
			}
			
			// 값 받기
			var response = function(res){
				if(OAuth3.xhr && res.timeStamp){
					OAuth3.xhr.abort()
					delete OAuth3.xhr
				}

				var isSessionStorage = sessionStorage[intent+cc_address]

				sessionStorage[intent+cc_address] = JSON.stringify(res)

				if(isSessionStorage && $form.getAttribute("to")){
					return
				}

				var contenteditable = false
				var draggable = false

				var cookies = JSON.parse(res.body.cookies)

				if(cookies.address){
					if(cc_address == cookies.address){
						contenteditable = true
					}
				}

				var rows = res.body.rows

				var date = new Date()
				var len = rows.length

				if(contenteditable){
					try{
						document.querySelector('[id="oauth.network.guest"]').checked = true

						draggable = true

						if(window.location.search.length > 0){
							draggable = false
						}

						if(!len){
							var salt = date.getTime() + window.location.host
							var formId = crc32(salt+res.body.query.to).toString(32).toUpperCase()
							var fieldId = crc32(salt+"field").toString(32).toUpperCase()
							var inputId = crc32(salt+"input").toString(32).toUpperCase()

							rows = [
								{
									Id : formId, // 게시글 아이디
									From : cookies.email, // 보낸 client kakao email
									To : res.body.query.to, // 받는 개인
									Cc : Cc, // 그룹 레퍼러
									Subject : "", // 제목
									Flag : "", //
									Date : date
								},
								{
									Id : formId+" "+fieldId+" "+1, // 게시글 아이디
									From : cookies.email, // 보낸 client kakao email
									To : "field", // 받는 개인
									Cc : Cc, // 그룹 레퍼러
									Subject : "", // 제목
									Flag : formId, //
									Date : date
								},
								{
									Id : formId+" "+fieldId+" "+inputId+" "+1+" "+1, // 게시글 아이디
									From : cookies.email, // 보낸 client kakao email
									To : intent == "flows" ? "flow" : "radio", // 받는 개인
									Cc : Cc, // 그룹 레퍼러
									Subject : "", // 제목
									Flag : fieldId, //
									Date : date
								}
							]

							len = rows.length;
						}
					}catch(err){
						console.log("err",err);
					}
				}

				var limit = rows.limit;
				var To = "";
				var table = {};

				try{
					if(len){
						for(var f = 0; f < len; f++){
							var row = rows[f];
							var team = false;

							var clientAddress = ethers.hashMessage(row.From)
								clientAddress = ethers.computeAddress(clientAddress).toLowerCase()

							if(cc_address == clientAddress){
								team = true
							}

							var index = row.Id.split(" ");

							var formId = ""
							var fieldId = ""
							var fieldIndex = ""
							var inputId = ""
							var inputIndex = ""
							var contentIndex = ""

							for(var i = 0; i < index.length; i++){
								var idx = index[i]

								var num = idx*1

								if(num > 0){
									if(contentIndex){
										if(!table[formId].Content[contentIndex]){
											table[formId].Content[contentIndex] = row;
										}

										if(table[formId].Content.Length <= num){
											table[formId].Content.Length = num;
										}

										if(row.To == "file"){
											table[formId].Content[contentIndex].data = row.data;
										}

										if(row.To == "link"){
											table[formId].Content[contentIndex].link = row.Subject;
										}

										if(row.To == "count"){
											table[formId].Content[contentIndex].count = row.Subject;
										}
									}else{
										if(typeof table[formId][fieldIndex] == "undefined"){
											table[formId][fieldIndex] = {
												Idx : fieldId,
												Th : {Length : 0},
												Td : {Length : 0}
											}
										}

										if(!inputId){
											if(row.To == "field"){
												inputIndex = 0
												inputId = fieldId
												table[formId].Length += 1
											}

											if(row.To == "file"){
												table[formId][fieldIndex].Th.data = row.data
											}

											if(row.To == "link"){
												table[formId][fieldIndex].Th.link = row.Subject
											}
										}

										if(team){
											if(flow){
												try{
													var flags = flow.link.split(" ")

													if(row.Id == flags[0]){

													}else if(row.Id.indexOf(flags[1]) == -1){
														continue
													}
												}catch(err){

												}
											}

											if(table[formId][fieldIndex].Th.Length <= num){
												table[formId][fieldIndex].Th.Length = num
											}

											if(!table[formId][fieldIndex].Th[inputIndex]){
												table[formId][fieldIndex].Th[inputIndex] = row
												table[formId][fieldIndex].Th[inputIndex].Idx = inputId
											}

											if(row.To == "file"){
												table[formId][fieldIndex].Th[inputIndex].data = row.data
											}

											if(row.To == "link"){
												table[formId][fieldIndex].Th[inputIndex].link = row.Subject
											}

											if(row.To == "field"){
												table[formId][fieldIndex].Subject = row.Subject
											}

										}else{
											table[formId][fieldIndex].Td[inputIndex] = row
											table[formId][fieldIndex].Td[inputIndex].Idx = inputId
										}
									}
								}else if(!formId){
									formId = idx+""
									var nextIndex = index[i+1]

									if(typeof table[idx] == "undefined"){
										table[idx] = {
											Idx : idx,
											Length : 0
										}
									}

									if(!To){
										// if(OAuth3.teams[row.To]){
										// 	if(OAuth3.teams[cookies.email]){
										// 		To = row.From;
										// 	}else{
										// 		To = row.To;
										// 	}
											
										// 	table[formId].Subject = row.Subject;
										// }else if(row.To == res.body.query.to){
											To = row.From ? row.From : cookies.email
											table[formId].Subject = row.Subject ? row.Subject : ""
										// }
									}

									if(typeof nextIndex == "undefined"){
										if(row.To == "count"){
											if(row.Subject){
												table[idx].Count = row.Subject * 1
											}
										}

										if(row.To == "created"){
											if(row.Subject){
												table[idx].Created = row.Subject
											}
										}
										
										if(row.To == "guest"){
											table[idx].Guest = row.Id
										}

										if(row.To == "started"){
											if(row.Subject){
												table[idx].Started = row.Subject
											}
										}

										if(row.To == "expired"){
											if(row.Subject){
												table[idx].Expired = row.Subject
											}
										}

										if(row.To == "file"){
											if(row.data){
												table[idx].data = row.data
											}
										}

										if(row.To == "link"){
											if(row.data){
												table[idx].link = row.Subject
											}
										}
									}else if((nextIndex*1) > 0){
										contentIndex = nextIndex
									}

									if(row.To == "content"){
										if(typeof table[idx].Content == "undefined"){
											table[idx].Content = []
											table[idx].Content.Length = 0
										}
									}
								}else if(!fieldId){
									fieldId = idx
									fieldIndex = index[i+1]
								}else if(!inputId){
									inputId = idx
									if(row.To != "field"){
										fieldIndex = index[i+1]
										inputIndex = index[i+2]

										if(typeof table[formId][fieldIndex] == "undefined"){
											table[formId][fieldIndex] = {
												Idx : fieldId,
												Th : {Length : 0},
												Td : {Length : 0}
											}
										}
									}
								}
							}
						}
						
						if(To){
							$form.setAttribute("to", To)
						}else if(contenteditable){
							$form.setAttribute("to", cookies.email)
						}

						if(cookies.email){
							$form.setAttribute("client", cookies.email)
						}
						
						$form.setAttribute("draggable", draggable)
						
						var $fields = $form.querySelector("fields");
						var tooltip = document.querySelector('field[draggable="false"]');
						var beforeElement;

						if(Object.keys(table).length){
							if(!resp && $form.className.indexOf("dialog") > -1){
								if(rows[0].To == "flows"){
									window.dialog = table
									window.dialog.id = rows[0].Id

									var address = ethers.hashMessage(rows[0].From)
										address = ethers.computeAddress(address).toLowerCase()

									window.dialog.to = address
									window.dialog.cc = rows[0].Cc
									window.dialog.subject = rows[0].Subject
									window.dialog.flag = rows[0].Flag
									window.dialog.date = rows[0].Date

									var _from = (cookies.address ? cookies.address : "0x"+cookies.hash) * 1
									var _to = (window.dialog.to.indexOf("0x") == 0 ? window.dialog.to : "0x"+window.dialog.to) * 1
									var _address

									if(cookies.to == _from && cookies.from){
										_from = (cookies.from.indexOf("0x") == 0 ? cookies.from : "0x"+cookies.from) * 1
									}

									if(_from > _to){
										_address = ethers.hashMessage(_from.toString() + _to.toString())
										_address = ethers.computeAddress(_address).toLowerCase()
									}else{
										_address = ethers.hashMessage(_to.toString() + _from.toString())
										_address = ethers.computeAddress(_address).toLowerCase()
									}

									window.dialog.from = _address
								}
							}

							for(var prop in table) {
								if(table.hasOwnProperty(prop)) {
									var group = table[prop];
									
									if(group.Length){
										$form.id = group.Idx;

										for(var s = 1; s <= group.Length; s++){
											var tr = group[s];

											// team 콘텐츠
											if(tr.Th.Length){
												var $field = document.createElement("field");
													$field.innerHTML = tooltip.innerHTML;
													$field.id = tr.Idx;

												if($field.querySelector("toolbar")){
													$field.querySelector("toolbar").outerHTML = "";
												}

												if(contenteditable && mode){
													$field.setAttribute("contenteditable", "true");
													if(draggable){
														$field.setAttribute("draggable", draggable);
													}
												}

												var $items = $field.querySelector("items");
													$items.innerHTML = "";

												for(var h = 0; h <= tr.Th.Length; h++){
													var item = tr.Th[h];

													var th = tr.Th[""];

													if(h){
														if(item){
															var type = $field.getAttribute("type");
															if(!type && item.To){
																$field.setAttribute("type", item.To);
															}

															var index = item.Id.split(" ");

															var $item = document.createElement("item");
																$item.id = item.Idx;
																$item.setAttribute("type", item.To);
																$item.textContent = item.Subject ? item.Subject : "";

															if(item.data){
																$item.style["background-image"] = 'url('+item.data+')';
															}

															if(item.link){
																$item.setAttribute("link", item.link);
															}

															if(contenteditable && mode){
																if(draggable){
																	$item.setAttribute("draggable", draggable);
																	$item.setAttribute("contenteditable", true);
																}
															}else if(!item.Subject){
																$item.setAttribute("contenteditable", true);
															}
															
															$items.appendChild($item);
														}
													}else{
														var $h0 = $field.querySelector("h0");
															$h0.textContent = item.Subject;
														
														if(th){
															if(th.data){
																$h0.style["background-image"] = 'url('+th.data+')'; // 수정필요
															}
															
															if(th.link){
																$h0.setAttribute("link", th.link);

																try{
																	var th_url = new URL(th.link)

																	var media = ""
																	var oembed = window.oembed(th_url)

																	if(oembed.provider){
																		media = '<div class="media"><img src="'+oembed.src+'"></div>'
																	}else{
																		media = '<div class="media"><img src="https://'+oembed.host+'/favicon.ico"></div>'
																	}

																	$h0.outerHTML = media+$h0.outerHTML
																}catch(err){

																}
															}
														}
													}
												}
												
												$fields.insertBefore($field, tooltip);
												
												if(!beforeElement){
													beforeElement = $field;
												}
											}
											
											// client 콘텐츠
											tr.Td.Length = Object.keys(tr.Td).length;
											if(tr.Td.Length){
												for(var index in tr.Td){
													if(tr.Td.hasOwnProperty(index)) {
														var item = tr.Td[index];

														if(item){
															var $item = document.getElementById(item.Idx);

															if($item){
																$item.setAttribute("checked", "checked");

																if(item.Subject){
																	$item.textContent = decodeURIComponent(item.Subject);
																}
															}
														}
													}
												}
											}
										}

										var headingField = document.createElement("field");
											headingField.id = group.Idx;
											headingField.innerHTML = tooltip.innerHTML;
											headingField.className = "heading";

										var $h0 = headingField.querySelector("h0");

										if(group.Subject){
											$h0.textContent = group.Subject;
										}

										if(group.data){
											$h0.style["background-image"] = 'url('+group.data+')';
										}

										if(group.link){
											$h0.setAttribute("link", group.link);
										}

										if(group.Content){
											var body = "";
											var $items = headingField.querySelector("items");
												$items.innerHTML = "";

											for(var c = 1; c <= group.Content.Length; c++){
												var content = group.Content[c];
												var $item = document.createElement("item");
													$item.id = content.Id;
													$item.setAttribute("type", content.To);
													$item.textContent = content.Subject ? content.Subject : "";

												if(content.link){
													$item.setAttribute("link", content.link);
												}

												if(content.data){
													$item.style["background-image"] = 'url('+content.data+')';
												}

												$items.appendChild($item);
											}
										}

										var $toolbar = headingField.querySelector("toolbar");

										if($toolbar){
											var $count = $toolbar.querySelector('[name="count"]');

											if(typeof group.Count != "undefined"){
												$count.value = group.Count;
											}

											var $guest = $toolbar.querySelector('[name="guest"]');
											var $created = $toolbar.querySelector('[name="created"]');
											var $started = $toolbar.querySelector('[name="started"]');
											var $expired = $toolbar.querySelector('[name="expired"]');

											if(group.Created){
												if($created){
													$created.value = group.Created;
												}
											}
											
											if(group.Guest){
												if($guest){
													$guest.checked = true;
													
													$form.setAttribute("guest", group.Guest);
												}
											}

											if(typeof group.Started != "undefined" && typeof group.Expired != "undefined"){
												if($started && $expired){
													$started.value = group.Started;
													$expired.value = group.Expired;
													
													if(!contenteditable){
														$started.setAttribute("readonly", true);
														$expired.setAttribute("readonly", true);
													}
												}
											}
										}
										
										if(contenteditable && mode){
											$form.setAttribute("contenteditable", true);
											tooltip.setAttribute("contenteditable", false);
										}
										
										if(contenteditable && mode){
											headingField.setAttribute("contenteditable", true);
										}

										$fields.insertBefore(headingField, beforeElement);
									}
								}
							}
						}

						if(!mode){
							var $heading = $form.querySelector('field.heading');

							var dialogFlowBody = ''

							if(dialogFlow.length){
								for(var d = 0; d < dialogFlow.length; d++){
									dialogFlowBody += dialogFlow[d]
								}
							}

							if(flow_template){
								$heading.outerHTML = flow_template + dialogFlowBody
							}

							if(flow){
								try{
									window.Chat(flows[window.dialog.index])
								}catch(err){
									console.log("err",err);
								}
							}
						}
					}
				}catch(err){
					console.log("err",err);

				}

				if(intent == "flows"){
					if(len){
						if(!mode && flow_template.length == 0){
							var $fields = $form.querySelector('fields');

							var $temp = document.createElement("div")
								$temp.innerHTML = $fields.innerHTML
								$($temp).find('field[type="flow"] items, field[type="flow"] tooltip, field[draggable="false"]').remove()

							flow_template += $temp.innerHTML
						}
					}
				}else{
					var tooltip = document.querySelector('field[draggable="false"]');
					var $flows = tooltip.querySelector('flows');
					$flows.innerHTML = ""
				}

				try{
					var query = {};

					var to = $form.getAttribute("to");
					var client = $form.getAttribute("client");
					var cc = $form.getAttribute("cc");
					var $details = $form.querySelector('details');

					if(client){
						var _from = contenteditable ? to : client
						var _to = contenteditable ? client : to

						_from = _from.indexOf("0x") == 0 ? _from.replace("0x","#") : "#"+_from
						_to = _to.indexOf("0x") == 0 ? _to.replace("0x","#") : "#"+_to

						var query = {
							href : Cc,
							from : _from,
							to : _to,
							cc : "#message"
						}

						if(query.from == query.to && contenteditable){
							delete query.from;
						}

						if(res.timeStamp){
							OAuth3.xhr = OAuth3.fetch({
								method : "GET",
								url : OAuth3.host,
								query : query
							}, function(res){
								if(OAuth3.xhr){
									OAuth3.xhr.abort()
									delete OAuth3.xhr
								}

								var $cable = $details.querySelector("cable");
								var $tbody = $details.querySelector("tbody");

								$cable.rows = [];

								var tbody = "";

								if(res.body){
									if(res.body.rows){
										var cookies = JSON.parse(res.body.cookies);
										var email = cookies.email;
										var len = res.body.rows.length;

										for(var i = 0; i < len; i++){
											var row = res.body.rows[i];

											var created_date = row.Date.split("T");
											var created_time = created_date[1];
												created_time = created_time.split(".")[0];
												created_date = created_date[0];


											var created = new Date(row.Date).getTime();
											var booking = (i+"")*1;
											

											var attr = row.Flow ? 'flow="'+row.Flow+'"' : "";

											var href = row.Cc+"";

											var booking_date = "";

											if(row.Flag.indexOf(row.Cc) > -1){
												href = row.Cc+row.Flag.split(row.Cc)[1];

												try{
													var url = new URL(window.location.origin + row.Cc);

													if(url.searchParams.get("id")){
														var d = new Date(url.searchParams.get("id").split("@")[0]);

														if(d instanceof Date){
															var isoDate = d.toISOString();

															booking = d.getTime();

															booking_date = isoDate.split("T");
															var time = booking_date[1];
																time = time.split(".")[0];
																booking_date = booking_date[0];
														}
													}
												}catch(err){
													console.log("Err",err);
												}
											}

											tbody += '<tr id="'+row.Cc+'">\
												<td class="col_flow"><a href="'+href+'" cc="'+row.Cc+'" '+attr+'></a></td>\
												<td class="col_email"><a href="'+href+'" cc="'+row.Cc+'" '+attr+'>'+row.From+'</a></td>\
												<td class="col_subject"><a href="'+href+'" cc="'+row.Cc+'" '+attr+'>'+decodeURIComponent(row.Subject)+'</a></td>\
												<td class="col_booking"><a href="'+href+'" cc="'+row.Cc+'" '+attr+'><time datetime="'+row.Date+'">'+booking_date+'</time></a></td>\
												<td class="col_created"><a href="'+href+'" cc="'+row.Cc+'" '+attr+'><time datetime="'+row.Date+'">'+created_date+'</time></a></td>\
											</tr>';


											$cable.rows.push({
												Flow : row.Flow,
												From : row.From,
												To : row.To,
												Cc : row.Cc,
												Flag : row.Flag,
												Subject : row.Subject,
												Date : row.Date,
												Created : created,
												Booking : booking
											});
										}

										$tbody.innerHTML = tbody;
									}
								}

								if(intent == "flows"){
									getFlow()

									return
								}

								if(typeof window.Polling == "undefined"){
									window.Polling = setInterval(window.Poll)
								}
							});
						}else{
							getFlow()
						}
					}else{
						if(intent == "flows"){
							getFlow()

							return
						}

						if(typeof window.Polling == "undefined"){
							window.Polling = setInterval(window.Poll)
						}
					}
				}catch(err){
					console.log("err",err)
				}
			}

			if(resp){
				response(resp)
			}else{
				if(OAuth3.xhr){
					OAuth3.xhr.abort()
					delete OAuth3.xhr
				}

				if(sessionStorage[intent+cc_address]){
					response(JSON.parse(sessionStorage[intent+cc_address]))
				}

				OAuth3.xhr = OAuth3.fetch(request, response);
			}
		}
	}

	var Origin = typeof OAuth3.Origin != "undefined" ? OAuth3.Origin : window.location.origin;

	if(OAuth3.localhost){
		Origin = "http://"+OAuth3.localhost;
	}

	var $balance = $("#header .balance span");
	
	if(Origin){
		// 메뉴 & 멤버 조회
		var request = {
			method : "GET",
			query : {
				cc : Origin
			}
		}

		window.Callback = async function(resp){
			try{
				var url = new URL(window.location.href)

				var cookies = window.cookies = JSON.parse(resp.body.cookies)

				var cc_address = ethers.hashMessage(url.href.replace(window.location.protocol+"//",""))
					cc_address = ethers.computeAddress(cc_address).toLowerCase()

				if(OAuth3.xhr){
					OAuth3.xhr.abort()
					delete OAuth3.xhr

					var _address = cc_address

					if(window.dialog){
						var _to = url.hash.replace("#","0x") * 1

						if(_to){
							var _from = (window.cookies.address ? window.cookies.address : "0x"+window.cookies.hash) * 1

							if(_from > _to){
								_address = ethers.hashMessage(_from.toString() + _to.toString())
								_address = ethers.computeAddress(_address).toLowerCase()
							}else{
								_address = ethers.hashMessage(_to.toString() + _from.toString())
								_address = ethers.computeAddress(_address).toLowerCase()
							}
						}
					}

					if(Object.keys(resp.body.body).length == 1 && resp.body.body.emoji){
						sessionStorage[_address] = JSON.stringify(resp)
					}

					window.response = resp
				}

				if(window.players){
					if($go.referer){
						window.speed = 0.1
						delete $go.referer
						$go.removeAttr("href")
					}

					window.map.item = {}
					window.map.thread = {}
					window.map.follow = {}
					window.map.report = {}
					window.map.reward = {}

					var seed = cc_address+""

					if(window.location.hash){
						cc_address = window.location.hash.replace("#","")

						seed = window.location.hash.replace("#","0x")
					}

					var rows = JSON.stringify(resp.body.rows)
						rows = JSON.parse(rows)

					var self_player

					if(window.players.length){
						self_player = window.players.self()
					}else{
						var x = 1.5
						var z = 1.5

						var xyz = cookies.xyz
						if(xyz){
							xyz = xyz.split(",")

							x = xyz[0] * 1
							// y = xyz[1]
							z = xyz[2] * 1
						}

						var b = window.map.biomes[`${x}:${z}`]
						var y = b ? b.y : 0.5

						self_player = {
							team : cookies.team ? cookies.team : "",
							follow : false,
							self : true,
							hash : cookies.address ? cookies.address : cookies.hash,
							emoji : "😀",
							x : x,
							y : y,
							z : z
						}

					}

					console.log('rows',rows);

					if(rows.length){
						var thread

						for(var r = 0; r < rows.length; r++){
							var row = rows[r];

							var hashtag = getHashtag(row.Cc)

							var position = row.Cc.split(` ${hashtag}`)[0]

							try{
								position = JSON.parse(`[${position}]`)

								var _x = position[0]
								var _z = position[1]

								var biome 

								if(window.Biomes[hashtag]){
									biome = window.map.biomes[_x+":"+_z]
								}

								if(row.Cc.indexOf("#follow") > -1){
									if(!window.map.follow[row.From]){
										window.map.follow[row.From] = []
									}

									window.map.follow[row.From].push(row.To)
								}else if(row.Cc.indexOf("#report") > -1){
									if(!window.map.report[row.To]){
										window.map.report[row.To] = []
									}

									window.map.report[row.To].push(row)

								}else if(row.Cc == "#thread"){
									if(row.Flag.indexOf(cc_address) > -1){
										thread = row
									}
								}else if(row.Cc == "#message"){
									if(thread){
										if(!window.dialog && row.Flag && row.To == thread.Flag){
											if(cookies.from == row.From){
												window.dialog = {
													to : cookies.to
												}

												seed = cc_address = window.dialog.to
											}else if(cookies.to == row.From){
												window.dialog = {
													to : cookies.from
												}

												seed = cc_address = window.dialog.to
											}
										}
									}
								}
							}catch(err){
							}
						}
					}

					if(cookies.to && !window.dialog){
						window.dialog = {
							to : cookies.to
						}

						seed = cc_address = window.dialog.to
					}

					if(cookies.subscription){
						$('.emoji_asset[method="notify"]').addClass("on")
					}else{
						$('.emoji_asset[method="notify"]').removeClass("on")
					}

					cc_address = cc_address.replace("0x","")

					var canvas = blockies.create({seed: seed.toLowerCase()})

					var self = false

					var diff = false

					var selector = window.selector

					var player_hash = self_player.hash

					var $player = $('player[id="'+player_hash+'"][alt="player"]')

					var cc_player = {
						type : "player",
						self : false,
						hash : cc_address,
						x : 0.5,
						y : 0.5,
						z : 0.5,
						emoji : canvas.toDataURL()
					}


					var flags = resp.body.flags ? resp.body.flags : []

					flags[player_hash] = 0
					flags['#doge'] = 0
					flags['#pepe'] = 0


					var _balance = $balance.text()

					$balance
						.removeClass("on")
						.text(cookies.balance)
					
					if(_balance){
						if(_balance != cookies.balance){
							$balance.addClass("on")
						}
					}

					var _players = []
						_players.cnt = 0

					var _assets = []

					var _messages = []

					var _threads = []

					var frameloop = false


					var sticker = []

					var bombs = []

					var bingo_body = ""

					var score_board = []

					var biomes = listToBiomes(window.map.biomes, 100)

					var pending = []

					var damage = []

					var size = 5

					var isBiome = false

					if(!window.players.length){
						if(window.current){
							if(window.current.current.position){
								var xyz = cookies.xyz

								if(xyz){
									xyz = xyz.split(",")

									biomes.x = xyz[0] * 1
									biomes.z = xyz[2] * 1
								}

								window.current.current.position.x = self_player.x = biomes.x
								window.current.current.position.z = self_player.z = biomes.z

								$(".map canvas").css({top : -((biomes.z * 1.5) + 70) , left : -((biomes.x * 1.5) + 15 )})
							}
						}
					}else{
						biomes.x = window.current.current.position.x
						biomes.z = window.current.current.position.z
					}

					biomes.forEach(function(b, i){
						if(
							(biomes.x - size < b.x && biomes.x + size > b.x) &&
							(biomes.z - size < b.z && biomes.z + size > b.z)
						){
							biomes[b.x+":"+b.z] = b
						}
					})
					
					if(rows.length){
						if(!window.map.follow[self_player.hash]){
							window.map.follow[self_player.hash] = []
						}

						if(host_address.indexOf(cc_address) > -1){
							window.map.follow[self_player.hash].push(cc_address)
						}

						if(window.map.follow[self_player.hash]){
							cc_player.follow = window.map.follow[self_player.hash].indexOf(cc_address) > -1 ? true : false
						}

						if(self_player.hash.indexOf(cc_player.hash) > -1){
							cc_player.self = true
						}

						if(cc_player.hash == cc_address){
							cc_player.hash = cc_address.toUpperCase()
						}

						for(var r = 0; r < rows.length; r++){
							var row = rows[r];

							var hashtag = getHashtag(row.Cc)

							var position = row.Cc.split(` ${hashtag}`)[0]

							try{
								position = JSON.parse(`[${position}]`)
							}catch(err){
								position = []
							}

							var emoji = row.Cc.split("@")[1]

							var x = position[0]
							var z = position[1]

							var biome = biomes[x+":"+z]

							var isRender = biomes[x+":"+z]


							if(window.Biomes[hashtag] && isRender){
								if(row.Flag){
									delete window.map.biomes[row.Id]
									
									var $clipped = $('.clipped .emoji[x="'+x+'"][z="'+z+'"]')

									if($clipped.length && !window.bingo[row.Id]){
										window.bingo[row.Id] = true
										bingo_body += $clipped.closest('[style*="transform-origin"]')[0].outerHTML
									}
								}else{
									var _asset = {
										id : row.Id,
										hash : cc_address,
										name : hashtag,
										value : "",
										color: "",
										x : x,
										y : biome.y,
										z : y
									}

									window.map.biomes[row.Id] = _asset
								}
							}else if(row.Subject == "#position"){
								var player = {
									follow : false	
								}

								var type = window.typeof_emoji(emoji)


								if(row.Flag && isRender){
									var $clipped = $('.clipped .emoji[x="'+x+'"][z="'+z+'"]')

									if($clipped.length && !window.bingo[row.Id]){
										window.bingo[row.Id] = true
										bingo_body += $clipped.closest('[style*="transform-origin"]')[0].outerHTML
									}
								}else{
									var _from = row.From

									var _nonce = row.Cc.split(` ${hashtag}`)[1]
										_nonce = _nonce.split("@")[0].trim()

									if(_nonce.indexOf(cc_address) == -1){
										_from = _nonce
									}


									if(type && (cookies.address == _from || cookies.hash == _from)){
										self = true

										player.self = true

										if(cookies.address){
											if(cookies.hash == _from){
												continue
											}
										}

										if(self_player){
											try{
												if(window.current){
													if(window.current.current.position){
														self_player.x = window.current.current.position.x
														self_player.y = window.current.current.position.y
														self_player.z = window.current.current.position.z
													}
												}
											}catch(err){

											}

											player.x = self_player.x
											player.y = (biome ? biome.y : 0) + 0.5
											player.z = self_player.z
											player.emoji = window.emojis.self
										}
									}else{
										if(!type && window.map.biomes[row.Id]){
											delete window.map.biomes[row.Id]
										}

										player.x = x
										player.y = (biome ? biome.y : 0) + 0.5
										player.z = z
										player.emoji = emoji

										if(window.map.follow[self_player.hash] && self_player.hash != _from){
											player.follow = window.map.follow[self_player.hash].indexOf(_from) > -1 ? true : false
										}
									}

									if(!window.map.report[_from] && (isRender || player.self)){
										console.log('isRender',isRender, emoji);
										if(!rows[_from]){
											rows[_from] = true

											_players.push({
												team : hashtag,
												follow : player.follow,
												self : player.self,
												hash : _from,
												x : player.x,
												y : player.y,
												z : player.z,
												emoji : player.emoji
											})
										}

										if(_from == row.From){
											if(!_players[row.From]){
												_players.cnt += 1
											}
										}

										_players[_from] = {
											x : player.x,
											z : player.z,
											emoji : player.emoji
										}
									}
								}
							}else if(row.Cc.indexOf("#thread") > -1){
								_threads.push(row)
							}else if(row.Cc.indexOf("#message") > -1){
								_messages.push(row)
							}else if(row.Cc.indexOf("#reward") > -1){
								window.map.reward[row.Id] = row

								if(row.To == player_hash){
									_messages.push(row)
								}

							}else if((row.Cc.indexOf("#bomb") > -1 || row.Subject == "#bomb") && isRender){
								bombs.push(row)

								if(row.Flag){
									if(row.To == player_hash){
										damage.push(row)
									}

									if(row.Subject == "#bomb"){
										var $clipped = $('.clipped .emoji[x="'+x+'"][z="'+z+'"]')

										if($clipped.length && !window.bingo[row.Id]){
											window.bingo[row.Id] = true
											bingo_body += $clipped.closest('[style*="transform-origin"]')[0].outerHTML
										}
									}
								}else{
									var _from = row.From

									var _nonce = row.Cc.split(` ${hashtag}`)[1]
										_nonce = _nonce.split("@")[0].trim()

									if(_nonce.indexOf(cc_address) == -1){
										_from = _nonce
									}

									var player = {
										team : hashtag,
										follow : false,
										self : false,
										hash : _from,
										x : x,
										y : (biome ? biome.y : 0) + 0.5,
										z : z,
										emoji : "💣"
									}

									_players.push(player)
								}

							}else if(row.Cc.indexOf("#asset") > -1){
								var emoji = row.Cc.split("@")[1]

								if(row.Flag){
									if(window[row.Flag]){
										window[row.Flag].emoji = ""

										var $clipped = $('.clipped .emoji[x="'+x+'"][z="'+z+'"]')

										if($clipped.length && !window.bingo[row.Id]){
											window.bingo[row.Id] = true
											bingo_body += $clipped.closest('[style*="transform-origin"]')[0].outerHTML
										}	
									}
								}

								if(row.To == player_hash){
									if(!sticker[emoji]){
										sticker[emoji] = []
										window.map.item[emoji] = []
									}

									row.Emoji = emoji

									sticker.push(row)
									sticker[emoji].push(row)
									window.map.item[emoji].push(row)
								}
							}	
						}


						if(!damage.length){
							$(".enter")
							// 결과 페이지로 자동 이동되게
						}

						
						var x = self_player.x
						var z = self_player.z

						if(Object.keys(window.map.follow).length){
							var follow_body = ''

							var follows = window.map.follow[self_player.hash]

							var followsCnt = host_address.indexOf(cc_address) > -1 ? follows.length : follows.length+1;

							for(var i = 0; i < follows.length; i++){
								var follow = follows[i]

								var addressBody = '<address>\
									<span>'+follow+'</span>\
									<span dir="rtl">'+follow+'</span>\
								</address>'

								if(cc_address == follow){
									addressBody = '<address>\
										<strong>playground</strong>\
									</address>'
								}else if(self_player.hash == follow){
									addressBody = '<strong>me</strong>'
								}

								follow_body += '<li>\
									<div draggable="false" class="emoji_asset" type="player" method="" hash="'+follow+'">\
										<span class="address">'+addressBody+'</span>\
									</div>\
								</li>'
							}

							$(".deck .follows").html('<ul>'+follow_body+'</ul>')

							$('.emoji[type="follows"] cnt').text(followsCnt)

							for(var i = 0; i < follows.length; i++){
								var follow = follows[i]

								try{
									$('.deck .follows .emoji_asset[hash="'+follow+'"] canvas').remove()
									$('.deck .follows .emoji_asset[hash="'+follow+'"]').append(blockies.create({seed: (follow.indexOf("0x") == 0 ? follow : "0x"+follow).toLowerCase() }))
								}catch(err){

								}
							}
						}


						biomes.forEach(function(b, i){
							var _id = crc32(cc_address+i).toString(32).toUpperCase()

							var color = window.Biomes["#"+b.biome]
							
							if(
								(biomes.x - size < b.x && biomes.x + size > b.x) &&
								(biomes.z - size < b.z && biomes.z + size > b.z)
							){
								var _id = crc32(cc_address+"#"+b.biome+b.x+b.z).toString(32).toUpperCase()

								if(window.map.biomes[_id]){
									isBiome = true
								}

								_assets.push({
									id : _id,
									hash : cc_address,
									name : "#"+b.biome,
									value : color,
									color: color,
									x : b.x,
									y : b.y - 0.5,
									z : b.z
								})
							}
						})

						if(bombs.length){
							for(var i = 0; i < bombs.length; i++){
								var bomb = bombs[i]

								if(bomb){
									for(var _x = -2; _x < 3; _x++){
										for(var _z = -2; _z < 3; _z++){
											if(window.map.biomes[`${bomb.x+_x}:${bomb.z+_z}`]){
												if(bomb.Flag){
													delete window.map.biomes[`${bomb.x+_x}:${bomb.z+_z}`].bomb
												}else{
													window.map.biomes[`${bomb.x+_x}:${bomb.z+_z}`].bomb = true
												}
											}
										}
									}	
								}
							}
						}

						if(window.assets && !isBiome){
							biomes.forEach(function(b, i){
								var _id = crc32(cc_address+"#"+b.biome+b.x+b.z).toString(32).toUpperCase()

								if(
									(biomes.x - size < b.x && biomes.x + size > b.x) &&
									(biomes.z - size < b.z && biomes.z + size > b.z) &&
									!window.map.biomes[_id]
								){
									if(Math.random() < 0.1){
										var _date = new Date(new Date() - timezoneOffset)
											_date = _date.toISOString()
												.replace(/T/, ' ')
												.replace(/\..+/, '')

										var color = window.Biomes["#"+b.biome]

										var emoji = window.Biomes[color]

										if(emoji){
											window.map.biomes[_id] = {
												id : _id,
												hash : cc_address,
												name : "#"+b.biome,
												value : "",
												color: "",
												x : b.x,
												y : b.y - 0.5,
												z : b.z
											}

											var _row = {
												Id : _id,
												Cc : b.x+','+b.z+" #"+b.biome+" 0x"+cc_address
											}

											window.map.pending.push(_row)
										}
									}
								}
							})
						}
					}

					try{
						var diff = false
						if(window.players){
							if(JSON.stringify(window.players) != JSON.stringify(_players)){
								diff = true
								window.players.set(_players)

								var _li = ''

								for(var a = 0; a < _players.length; a++){
									var _player = _players[a]

									var type = _player.type

									var method = _player.method ? _player.method : ""

									var icon = _player.icon

									var className = "emoji color"

									var addressBody = '<span class="address">\
										<address>\
											<span>'+_player.hash+'</span>\
											<span dir="rtl">'+_player.hash+'</span>\
										</address>\
									</span>';

									if(_player.hash == self_player.hash){
										addressBody = '<span class="address self">\
											<address>\
												<strong>me</strong>\
											</address>\
										</span>'
									}else if(_player.hash == cc_address){
										addressBody = '<span class="address playground">\
											<address>\
												<strong>playground</strong>\
											</address>\
										</span>'
									}else{
										try{
											var url = new URL(_player.emoji)
											var oembed = window.oembed(url)

											if(oembed.src){
												if(_player.emoji.indexOf("https://") > -1){
													// addressBody = '<span class="address playlist">\
													// 	<address>\
													// 		<img src="https://'+oembed.host+'/favicon.ico">\
													// 	</address>\
													// </span>'
													addressBody = ""
												}
											}
										}catch(err){
										}
									}

									if(type == "emoji"){
										_li += '<li><div draggable="false" class="emoji_asset" type="'+type+'" method="'+method+'"><a class="'+className+'"></a></div></li>'
									}else if(type == "player"){
										_li += '<li><div draggable="false" class="emoji_asset" type="'+type+'" method="'+method+'" hash="'+_player.hash+'">'+addressBody+'</div></li>'
									}
								}

								$("emojis .deck .players").html('<ul>'+_li+'</ul>')

								for(var a = 0; a < _players.length; a++){
									var _player = _players[a]

									$('emojis .deck .players .emoji_asset[hash="'+_player.hash+'"]>canvas, emojis .deck .players .emoji_asset[hash="'+_player.hash+'"]>img').remove()

									var src = ""

									try{
										var url = new URL(_player.emoji)
										var oembed = window.oembed(url)

										if(oembed.src){
											src = oembed.src
										}
									}catch(err){
										
									}

									if(_player.emoji.indexOf("https://") > -1){
										$('emojis .deck .players .emoji_asset[hash="'+_player.hash+'"]').append('<img src="'+src+'">')
									}else{
										$('emojis .deck .players .emoji_asset[hash="'+_player.hash+'"]').append(blockies.create({seed: (_player.hash.indexOf("0x") == 0 ? _player.hash : "0x"+_player.hash).toLowerCase() }))
									}
								}

								$('emojis .deck .players .emoji_asset[hash="'+cc_address+'"] canvas').remove()
								$('emojis .deck .players .emoji_asset[hash="'+cc_address+'"]').append(blockies.create({seed: "0x"+cc_address.toLowerCase()}))
							}

							var $mode = $('input[name="mode"]:checked')
							var mode = $mode.val()

							$root
								.removeAttr("nth")
								.removeAttr("count")

							$('#root.fiber>div>div').removeClass("flex")

							var w = document.documentElement.scrollWidth
							var h = document.documentElement.scrollHeight

							$body.attr("axis", (w > h ? "x" : "y"))

							if(mode == "first"){
								try{
									var $players = $('player[alt="player"][self="true"], player[alt="player"][self=""]')
									$players.parent().parent().addClass("flex")

									var len = $players.length

									var nth = ""

									if(len % 2){
										nth = "odd"
									}else{
										nth = "even"
									}

									$root
										.attr("nth", nth)
										.attr("count",$players.length)
								}catch(err){
									console.log("Err",err);
								}
							}
						}

						if(window.assets){
							if(JSON.stringify(window.assets) != JSON.stringify(_assets)){
								console.log("window.assets 진입여부", _assets);
								diff = true
								window.assets.set(_assets)
							}
						}


						if(diff || frameloop){
							window.setFrameloop("always")
						}else{
							
							try{
								if(window.current.current.position.x == window.cursor.current.position.x && window.current.current.position.z == window.cursor.current.position.z && self_player.x == window.current.current.position.x && self_player.z == window.current.current.position.z){
									window.setFrameloop("demand")
								}else{
									window.setFrameloop("always")
								}
							}catch(err){
								window.setFrameloop("always")
							}
						}

						if(bingo_body){
							$("#bingo").html(bingo_body)

							var $bingo = $("#bingo").find('[style*="transform-origin"]')

							$bingo.each(function(){
								var $t = $(this);

								var amount = 4;

								if($bingo.length > 5){
									amount = 2
								}
								
								var totalSquares = Math.pow(amount, 2);
								
								var $clipped = $t.find('.clipped')
									$clipped.addClass("on")
								var width = $clipped.width() / amount;
								var height = $clipped.height() / amount;
								
								var y = 0;

								var body = ""
								
								for(var z = 0; z <= (amount*width); z = z+width) { 
									body += '<clipped style="clip: rect('+y+'px, '+(z+width)+'px, '+(y+height)+'px, '+z+'px)"></clipped>'

									if(z === (amount*width)-width) {
									
										y = y + height;
										z = -width;
									
									}
									
									if(y === (amount*height)) {
										z = 9999999;
									}
									
								}

								$t.append(body)
							})

							$('clipped').each(function() {
								var v = random(120, 90),
									angle = random(89, 80),
									theta = (angle * Math.PI) / 180,
									g = -9.8;

								var self = $(this);

								var t = 0,
									z, r, nx, ny,
									totalt =  15;

								var negate = [1, -1, 0],
									direction = negate[ Math.floor(Math.random() * negate.length) ];

								var randDeg = random(-5, 10), 
									randScale = random(0.9, 1.1),
									randDeg2 = random(30, 5);

								$(this).css({
									'transform' : 'scale('+randScale+') skew('+randDeg+'deg) rotateZ('+randDeg2+'deg)'
								});

								z = setInterval(function(index) { 	
									var ux = ( Math.cos(theta) * v ) * direction;
									
									var uy = ( Math.sin(theta) * v ) - ( (-g) * t);
									
									nx = (ux * t);		
									ny = (uy * t) + (0.5 * (g) * Math.pow(t, 2));
									
									self.css({'bottom' : (ny)+'px', 'left' : (nx)+'px'});
									
									t = t + 0.5;
									
									if(t > totalt) {
										self.closest('[style*="transform-origin"]').remove()
										clearInterval(z);
									}
								},50);
							});

						}

						var stickerCnt = 0
						var rewardLength = Object.keys(window.map.reward).length

						var li = ''

						var afterSticker = []
						
						if(sticker.length){
							var beforeSticker = $("emojis .items").html()

							for(var i = 0; i < sticker.length; i++){
								var row = sticker[i]
								var emoji = row.Emoji

								if(sticker[emoji]){
									stickerCnt++
									var cnt = sticker[emoji].length
									delete sticker[emoji]

									var isNew = false

									if(!$('#'+row.Id).length && beforeSticker){
										isNew = true
										afterSticker.push(row)
									}

									li += '<div id="'+row.Id+'" draggable="false" class="emoji_asset '+(isNew ? "new" : "")+'" emoji="'+emoji+'" type="item"><a class="emoji color">'+emoji+'</a><span class="cnt">'+cnt+'</span></div>'
								}
							}
						}

						$('[id="'+player_hash+'"] items ul').html(li)

						$("emojis .items").html(li)
						$('.emoji[type="sticker"] cnt').text(stickerCnt+(rewardLength ? 1 : 0))
						$('.emoji[type="players"] cnt').text(_players.cnt+1)

						if(afterSticker.length){
							var $player = $('player[self="true"]')
							var beforeOffset = $player.offset()

							var $size = $player.find('img[alt="player"]')

							var w = $size.width()
							var h = $size.height()

							for(var i = 0; i < afterSticker.length; i++){
								setTimeout(function(row){
									var $sticker = $('#'+row.Id)

									var afterOffset = $sticker.offset()

									$sticker
										.animate({path : new $.path.bezier({
											start: { 
												x: (beforeOffset.left- (w/4)), 
												y: (beforeOffset.top - h), 
												angle: 90
											},	
											end: { 
												x: (beforeOffset.left- w), 
												y: (beforeOffset.top - (h*2)), 
												angle: 90
											}
										})}, 400)
										.animate({path : new $.path.bezier({
											start: { 
												x: (beforeOffset.left - w), 
												y: (beforeOffset.top - (h*2)), 
												angle: 90
											},	
											end: { 
												x: afterOffset.left - 30, 
												y: afterOffset.top - 35,
												angle: 90
											}
										})}, 100, function(){
											setTimeout(function($el){
												$el
													.removeClass("new")
													.attr("style", "")
											},100, $(this))
										})
								}, 100*i, afterSticker[i])
							}
						}

					}catch(err){
						console.log("err",err);
					}

					if(flags.length){
						flags.forEach(function(flag){
							var hashtag = getHashtag(flag.Cc)

							if(flag.From == player_hash){
								flags.self =0
							}

							flags[hashtag]++
						})
					}


					console.log('flags',flags);
					

					setTimeout(function(){
						if(cookies.to){
							if(!$body.attr("bingo")){
								getTable("flows")

								$body.attr("chat",true)
							}
						}
						
						try{
							if(window.players.length){
								for(var i = 0; i < window.players.length; i++){
									var _player = window.players[i]

									try{
										var $player = $('player[id="'+_player.hash+'"]')
										var $tooltip = $player.find("tooltip ul");
											$tooltip.removeClass("open")

										var _player_hash = _player.hash.indexOf("0x") == 0 ? _player.hash.replace("0x", "") : _player.hash
											_player_hash = _player_hash.toLowerCase()

										var tooltip_body = ""

										var cnt = 0

										if(flags[_player_hash]){
											cnt = flags[_player_hash]
										}

										if(player_hash.indexOf(_player_hash) > -1){
											var className = {
												team : "",
												escape : "disabled"
											}

											tooltip_body = '<li>\
												<a class="hashType Flag">Flag</a>\
											</li>\
											<li>\
												<a class="hashType Crafting">Crafting</a>\
											</li>\
											<li>\
												<a class="hashType Escape '+className.escape+'"><strong>Escape</strong><span>'+cnt+'</span></a>\
											</li>'	
										}else{
											tooltip_body = '<li>\
												<a class="hashType Dialog">Talk</a>\
											</li>\
											<li>\
												<a class="hashType Follow">Follow</a>\
											</li>\
											<li>\
												<a class="hashType Report">Report</a>\
											</li>'
										}

										var before_body = $tooltip.html()
											before_body = before_body.replace(/\t/gi,"").trim()

										var after_body = tooltip_body.replace(/\t/gi,"").trim()

										if(before_body != after_body){
											$tooltip.html(tooltip_body)
										}
									}catch(err){

									}
								}
							}
						}catch(err){

						}

						var plyrs = []

						$('.emoji[type="threads"] cnt').text(_threads.length)

						if(_threads.length){
							var thread_body = ""

							for(var t = 0; t < _threads.length; t++){
								var row = _threads[t];

								var _new = row.Id ? "new" : ""

								var href = row.Flag.indexOf("0x") == 0 ? row.Flag.replace("0x", "#") : "#"+href

								var _from = row.From

								thread_body += '<li id="'+row.Id+'" from="'+row.From+'" to="'+row.To+'" idx="'+row.Flag+'" class="item thread '+_new+'">\
									<a href="'+href+'" class="text">\
										<span class="icon" data-from="'+_from+'"></span>\
										<text>'+row.Subject+'</text>\
									</a>\
									<input type="hidden" name="date" value="'+row.Date+'">\
								</li>'
							}

							$(".deck .threads").html('<ul>'+thread_body+'</ul>')

							var $icons = $(".deck .threads .icon")

							if($icons.length){
								$icons.each(function(i, el){
									var hash = el.dataset.from

									var $icon = $icons.eq(i)

									try{
										var canvas = blockies.create({seed: "0x"+hash})
										$icon.css("background-image", "url("+canvas.toDataURL()+")")
									}catch(err){

									}
								})
							}
						}

						var $messages = $("messages")

						var $talk = $("talks."+player_hash)

						if($body.attr("bingo") == "dialog" && !window.dialog){
							_messages = []
						}

						var $form = document.querySelector('form[name="oauth.network"]')

						if(_messages.length){
							var notify_body = ""
							var message_body = ""
							var onMessage = false

							var talks_selector = ""

							var flows = []

							for(var m = 0; m < _messages.length; m++){
								var row = _messages[m];

								var isMessage = row.Cc.indexOf("#open") == -1 && row.Cc.indexOf("#reward") == -1

								var duplication = !document.querySelector('messages ul li[id="'+row.Id+'"]')

								if(row.Cc.indexOf("#link") > -1){
									onMessage = true

									var position = row.Cc.split(" #link")[0]

									var link = row.Cc.split(cc_address+" ")[1]

									var asset = JSON.parse("["+position+"]")

									try{
										var url = new URL(link)

										var oembed = window.oembed(url)

										_players.push({
											team : "",
											self : row.From,
											hash : row.Id,
											x : asset[0],
											y : 0.5,
											z : asset[1],
											emoji : link
										})

										_players.cnt += 1

										row.hash = row.Id
										row.oembed = oembed
										row.emoji = link
										row.x = assets[0]
										row.z = assets[1]


										$(".item.playlist").remove()

										message_body += '<li id="'+row.Id+'" class="item playlist self">\
											<div class="thumb"><img src="'+oembed.src+'"></div>\
											<div class="text">\
												<span class="icon" data-from="'+row.From+'"></span>\
											</div>\
										</li>'
									}catch(err){
										// console.log("err",err);
									}

								
								}else if(isMessage && duplication){
									var dialog

									var Idx

									var $items = document.createElement("items");

									onMessage = true

									var text = ""

									try{
										var _url = new URL(row.Subject)

										text = '<a target="_blank" href="'+_url.href+'">\
											<img src="'+_url.protocol+'//'+_url.host+'/favicon.ico"> Link\
										</a>'
									}catch(err){
										text = '<span>'+row.Subject+'</span>'
									}

									var self = player_hash == row.From

									var dialog_self = ""

									if($form.querySelector('field[id="'+row.Flag+'"]')){

									}

									if(self){
										dialog_self = "self"
									}

									var dialog_li = $('<li id="'+row.Id+'" idx="'+row.Flag+'" class="'+(self && row.Flag ? "_dialog" : "")+' item message '+dialog_self+'">\
										<div class="text">\
											<span class="icon" data-from="'+row.From+'"></span>\
											<text>'+text+'</text>\
										</div>\
										<input type="hidden" name="date" value="'+row.Date+'">\
									</li>')

									var flow_li = $('<li id="'+row.Id+'" class="_flow item message self"><input type="hidden" name="date" value="'+row.Date+'"></li>')

									try{
										if(window.dialog && row.Flag != null){
											var flag = ""

											var flags = row.Flag.split(" ")
											
											for(var f = 0; f < flags.length; f++){
												if(isNaN(flags[f])){
													if(flag){
														flag += " "
													}

													flag += flags[f]
												}
											}

											var table = window.dialog.flow

											if(table && flag){
												for(var prop in table) {
													if(table.hasOwnProperty(prop)) {
														var group = table[prop];
														
														if(group.Length){
															for(var s = 1; s <= group.Length; s++){
																var tr = group[s];

																// team 콘텐츠
																if(tr.Th.Length){
																	for(var h = 0; h <= tr.Th.Length; h++){
																		var item = tr.Th[h];

																		var th = tr.Th[""];

																		var Id = ""

																		try{
																			if(th){
																				if(!Idx && th.Id.indexOf(flag) > -1){
																					Idx = th.Flag
																				}

																				Id = th.Id
																			}

																			if(item){
																				if(!Idx && item.Id.indexOf(flag) > -1){
																					Idx = item.Flag
																				}

																				Id = item.Id
																			}
																			
																			if(Idx && Id.indexOf(flag) > -1){
																				if(h){
																					if(item){
																						var index = item.Id.split(" ");

																						var $item = document.createElement("item");
																							$item.id = item.Idx;
																							$item.setAttribute("type", item.To);
																							$item.textContent = item.Subject ? item.Subject : "";

																						if(item.data){
																							$item.style["background-image"] = 'url('+item.data+')';
																						}

																						if(item.link){
																							$item.setAttribute("link", item.link);
																						}

																						if(!item.Subject){
																							if(item.To == "checkbox"){
																								var id = randomHash()
																								$item.setAttribute("type","date")
																								$item.innerHTML = '<label class="dateresult" for="'+id+'"></label><input class="datepicker" id="'+id+'" type="date">'
																							}else{
																								$item.setAttribute("contenteditable", true);
																							}
																						}

																						$items.appendChild($item);
																					}
																				}else{
																					var $h0 = dialog_li[0].querySelector("text");
																					// 	$h0.innerHTML = '<span>'+item.Subject+'</span>';

																					if(th){
																						if(th.data){
																							$h0.style["background-image"] = 'url('+th.data+')'; // 수정필요
																						}
																						
																						if(th.link){
																							$h0.setAttribute("link", th.link);

																							try{
																								var th_url = new URL(th.link)

																								var media = ""
																								var oembed = window.oembed(th_url)

																								if(oembed.provider){
																									media = '<div class="media"><img src="'+oembed.src+'"></div>'
																								}else{
																									media = '<div class="media"><img src="https://'+oembed.host+'/favicon.ico"></div>'
																								}

																								var $text = dialog_li[0].querySelector(".text")

																								$text.outerHTML = media+$text.outerHTML
																							}catch(err){

																							}
																						}
																					}
																				}
																			}
																		}catch(err){
																			console.log("err",err);
																		}
																	}
																}
															}
														}
													}
												}

												flows = []

												window.dialog.index = 0

												var Ref = ""

												// 답변 배열 생성
												var table = window.dialog

												for(var prop in table) {
													if(table.hasOwnProperty(prop)) {
														var group = table[prop];
														
														if(group.Length){
															for(var s = 1; s <= group.Length; s++){
																var tr = group[s];

																// team 콘텐츠
																if(tr.Th.Length){
																	for(var h = 0; h <= tr.Th.Length; h++){
																		var item = tr.Th[h];

																		if(item){
																			if(item.link){
																				if(item.link.indexOf(flag) > -1){
																					Ref = item.Flag
																				}
																			}
																		}
																	}
																}
															}
														}
													}
												}

												if(Ref){
													for(var prop in table) {
														if(table.hasOwnProperty(prop)) {
															var group = table[prop];
															
															if(group.Length){
																for(var s = 1; s <= group.Length; s++){
																	var tr = group[s];

																	// team 콘텐츠
																	if(tr.Th.Length){
																		for(var h = 0; h <= tr.Th.Length; h++){
																			var item = tr.Th[h];

																			if(item){
																				if(item.Id.indexOf(Ref) > -1){
																					flows.push(item)
																				}	
																			}
																		}
																	}
																}
															}
														}
													}
												}

												window.flows = flows

												if(flows.length){
													for(var f = 0; f < flows.length; f++){
														var flow = flows[f]

														if(flow.link){
															if(flow.link.indexOf(flag) > -1){
																window.dialog.index = f
															}
														}
													}
												}
											}

											// if(!window.dialog.flow){
											// 	// dialog_li = false
											// }
										}
									}catch(err){
										console.log("err",err);
									}

									var $talks = $("talks."+row.From+" ul")

									if($talks.length && !window.dialog && !resp.body.query.date){
										if(talks_selector){
											talks_selector += ", "
										}

										talks_selector += "talks."+row.From

										if(!document.querySelector('talks ul li[id="'+row.Id+'"]')){
											$talks.append('<li class="item" id="'+row.Id+'">\
												<div class="text">\
													<span class="icon" data-from="'+row.From+'"></span>\
													'+text+'\
												</div>\
											</li>')
										}
									}


									if(dialog_li){
										message_body += dialog_li[0].outerHTML

										try{
											if($items.innerHTML){
												$items.id = dialog_li.attr("idx")
												$items.setAttribute("link", row.Flag)
												flow_li.append($items)

												message_body += flow_li[0].outerHTML
											}
										}catch(err){
											console.log("err",err);
										}
									}
								
								}else if(row.Cc.indexOf("#open") > -1 && duplication){
									onMessage = true

									var position = row.Cc.split(" #open")[0]

									var emoji = row.Cc.split("@")[1]

									var asset = JSON.parse("["+position+"]")

									var _player = _players[row.From]

									if(_player){
										if(_player.x == asset[0] && _player.z == asset[1]){
											message_body += '<li id="'+row.Id+'" class="item notify open '+(player_hash == row.From ? "self" : "")+'">\
												<div class="text">\
													<span class="icon" data-from="'+row.From+'"></span>\
													<text><span class="xyz">['+Math.floor(_player.x)+','+Math.floor(_player.z)+'] Open</span></text>\
												</div>\
											</li>'
										}
									}
								}else if(row.Cc.indexOf("#reward") > -1 && duplication){
									// var position = row.Cc.split(" #reward")[0]

									// var asset = JSON.parse("["+position+"]")

									// notify_body += '<li id="'+row.Id+'" class="item notify open '+(player_hash == row.From ? "self" : "")+'">\
									// 	<div class="text">\
									// 		<span class="icon" data-from="'+row.From+'"></span>\
									// 		<text><span class="xyz">['+Math.floor(asset[0])+','+Math.floor(asset[1])+'] Reward</span></text>\
									// 	</div>\
									// </li>'
								}
							}

							var $messages_ul = $("messages ul")

							var scrollBottom = $messages_ul.html() ? false : true

							if(message_body){
								if(resp.body.query.date){
									$messages_ul.prepend(message_body)
								}else{
									$messages_ul.append(message_body)
								}
							}

							for(var m = 0; m < _messages.length; m++){
								var row = _messages[m];

								var isMessage = row.Cc.indexOf("#open") == -1 && row.Cc.indexOf("#reward") == -1

								var duplication = $('messages ul>li[id="'+row.Id+'"]')

								try{
									if(isMessage && duplication.length && row.Flag){
										try{
											var flag = ""

											var flags = row.Flag.split(" ")
											
											for(var f = 0; f < flags.length; f++){
												if(isNaN(flags[f])){
													flag = flags[f]
												}
											}

											var _row = _messages[m-1];

											var _id = ""

											if(_row){
												var el = $('messages li[id="'+_row.Id+'"]').find('item[id="'+flag+'"]')

												if(el.length){
													duplication.html("")

													var seed = row.From.indexOf("0x") == 0 ? row.From : "0x"+row.From
													var canvas = blockies.create({seed: seed})

													if(row.Flag.indexOf(" ") == -1){
														var _date = new Date(row.Subject)

														if(isNaN(_date)){
															el.attr("checked","checked").css("background-image", "url("+canvas.toDataURL()+")")
														}else{
															var $item = $(document.createElement("item"))
																$item.css("background","none").attr({
																	"checked":"checked",
																	"disabled" : "disabled"
																}).text(row.Subject)

															var $bg = $(document.createElement("span"))
																$bg.css("background-image", "url("+canvas.toDataURL()+")")
															
															$item.append($bg)

															el.closest("items").html("").append($item)
														}
													}
												}
											}
										}catch(err){
											console.log("err",err);
										}
									}
								}catch(err){
									console.log("Err",err);
								}
							}

							var scrollHeight = document.documentElement.scrollHeight - (window.innerHeight / 10)

							var currentScrollHeight = Math.ceil((window.innerHeight + window.scrollY) / 10) * 10

							if (
								(typeof window.Polling == "undefined") || 
								(resp.body.body.cc == "message") || 
								(scrollHeight - currentScrollHeight < 0 && window.scrollY > 0)) 
							{
								scrollBottom = true
							}

							if(scrollBottom){
								var h = document.documentElement.scrollHeight

								$("html,body").scrollTop(h)
							}

							if(notify_body){
								$("notify ol").append(notify_body)
							}

							var $icons = $("messages li .icon")

							if($icons.length){
								$icons.each(function(i, el){
									var hash = el.dataset.from

									var $icon = $icons.eq(i)

									try{
										var canvas = blockies.create({seed: "0x"+hash})
										$icon.css("background-image", "url("+canvas.toDataURL()+")")
									}catch(err){

									}
								})
							}

							var $icons = $("talks li .icon")

							if($icons.length){
								$icons.each(function(i, el){
									var hash = el.dataset.from

									var $icon = $icons.eq(i)

									try{
										var canvas = blockies.create({seed: "0x"+hash})
										$icon.css("background-image", "url("+canvas.toDataURL()+")")
									}catch(err){

									}
								})						
							}

							if(onMessage){
								$messages.addClass("on")

								$(talks_selector).addClass("on")
							}
						}

						var $loading = $('messages ul li.loading, messages ul li[id=""], talks ul li[id=""]')
						
						if($loading.length){
							$loading.remove()
						}

						if(OAuth3.timeout){
							delete OAuth3.timeout
						}else{
							OAuth3.timeout = setTimeout(function(){
								if(!$aside.hasClass("on")){
									$messages.removeClass("on")
									$("talks").removeClass("on")
								}
							},3000)
						}
					}, 100)

					if(cookies.email){
						$status.innerHTML = ''
					}else{
						$status.innerHTML = '<a href="/login/">Sign In</a>'
					}

					if($body.hasClass("loading") && (window.frameloop == "demand" || window.frameloop == "never" || window.tutorial)){
						try{
							var _address = ethers.hashMessage(resp.query.href.replace(window.location.protocol+"//",""))
								_address = ethers.computeAddress(cc_address).toLowerCase()

							if(window.location.hash){
								_address = window.location.hash.replace("#", "0x")
							}

							if(_address.indexOf(cc_address) > -1){
								$body.removeAttr("class")
							}
						}catch(err){
							$body.removeAttr("class")
						}
					}

					var isDialog = $body.attr("bingo")

					if(isDialog == "notify"){
						if(cookies.subscription){
							var $form = document.querySelector('form[name="xim.city"]')

							if(cookies.vapid == true){
								// 인증 완료되었다는 메세지 보여주고 닫기 버튼 보여주기
								console.log("완료");
							}else{
								var $submit = $form.querySelector('input[type="submit"]')

								$submit.removeAttribute('disabled')

								// submit 버튼 보여주기
								// 클릭시 sync 확인 누르면 vapid 키 확성화 하고
								// 모바일 vapid 페이지 인증 페이지로 이동
							}
						}
					}else if(isDialog != "dialog"){
						$body.removeAttr("bingo")
					}
				}

				if(typeof window.Chat == "undefined"){
					window.Init(cookies)
				}

				if(typeof window.Polling == "undefined"){
					if(cookies.hash){
						window.Polling = setInterval(window.Poll)
					}else{
						window.location.href = OAuth3.host+"/logout"
					}
				}
			}catch(err){
				console.log("err",err);
			}
		}

		var response = function(res){
			var rows = res.body.rows
			var cookies = window.cookies = JSON.parse(res.body.cookies)

			$body.attr("address", cookies.address)

			var len = rows.length;

			var teams = {};

			var table = {};

			if(!rows.length){
				rows.push({
					Id : " ", // 게시글 아이디
					From : "", // 보낸 client kakao email
					To : "", // 받는 개인
					Cc : "", // 그룹 레퍼러
					Subject :"", // 제목
					Flag : "", //
					Date : new Date()
				})
			}

			var len = rows.length

			for(var f = 0; f < len; f++){
				var row = rows[f]

				teams[row.From] = row;
			}

			OAuth3.teams = teams;
			
			var contenteditable = false;

			
			document.querySelector("html").setAttribute("user-agent",res.body["user-agent"]);

			var url = new URL(window.location.href)

			var address = cookies.address ? cookies.address : ""

			var email = cookies.email ? cookies.email : ""

			if(cookies.email){
				if(OAuth3.teams){
					if(OAuth3.teams[address]){
						contenteditable = true;
						address = "";
					}
				}
			}

			var href = url.protocol+"//"+url.host+"/address/#"+(address ? address.replace("0x","") : cookies.hash)

			$('.inventory').attr("href", href+"/inventory")
			$('.exchange').attr("href", href)

			var x = 1.5
			var y = 0.5
			var z = 1.5

			var xyz = cookies.xyz
			if(xyz){
				xyz = xyz.split(",")

				x = xyz[0] * 1
				y = xyz[1] * 1
				z = xyz[2] * 1
			}

			

			var query = {
				href : window.location.href,
				hash : cookies.hash,
				token : cookies.token,
				x : x,
				y : y,
				z : z
			}

			var url = "https://xim.city";

			if(OAuth3.localhost){
				url = "http://localhost:3001"
			}

			OAuth3.fetch({
				method : "POST",
				query : query,
				url : url
			}, window.Callback)

			window.Report = function(){
				var player = window.players.self()

				if(player){
					var $form = document.forms.report
					var hash = $form.hash.value
					var token = $form.token.value

					var body = {
						cc : "report",
						to : $form.to.value,
						emoji : $form.emoji.value
					}

					if(body.to && body.emoji){
						$(".layer, .layer form.popup").removeClass("on")
						emojiChanged("🫥")

						var query = {
							href : window.location.href,
							hash : hash,
							token : token,
							x : player.x ? player.x : "1.5",
							y : player.y ? player.y : "0",
							z : player.z ? player.z : "1.5"
						}

						if(window.dialog){
							var _to = window.dialog.to

							if(window.cookies.to){
								_to = window.cookies.to
							}
							// query.href = window.location.origin +"/"+ (_to.indexOf("0x") == 0 ? _to : "0x"+_to).replace("0x","#")
						}

						OAuth3.xhr = OAuth3.fetch({
							method : "POST",
							url : url,
							body : body,
							query : query
						}, window.Callback);
					}
				}
			}

			window.Poll = async function(){
				try{
					var self_player

					try{
						if(window.players){
							if(window.players.self){
								self_player = window.players.self()
							}
						}
					}catch(err){
						var player_hash = cookies.address ? cookies.address : cookies.hash

						try{
							self_player = window.players.self()
						}catch(err){
							// console.log("err",err);
						}
					}

					if(typeof self_player != "undefined"){
						if(cookies.hash && !OAuth3.xhr){
							var url = "https://xim.city"

							if(OAuth3.localhost){
								url = "http://localhost:3001"
							}

							try{
								var _url = new URL(document.URL)

								if(_url.username && _url.password){
									cookies.hash = _url.username
									cookies.token = _url.password
								}
							}catch(err){

							}

							var body = {
								emoji : window.emojis.message ? window.emojis.message : self_player.emoji
							}

							var query = {
								href : window.location.href,
								hash : cookies.hash,
								token : cookies.token,
								x : self_player.x,
								y : self_player.y,
								z : self_player.z
							}

							if(window.cookies){
								if(window.cookies.nonce){
									query.nonce = window.cookies.nonce

									delete window.cookies.nonce
								}
							}

							if(window.Poll.date){
								query.date = window.Poll.date+""
								delete window.Poll.date
							}

							if($body.attr("bingo") == "dialog"){
								var _to = ""

								if(window.dialog){
									_to = window.dialog.to

									if(window.cookies.to){
										_to = window.cookies.to
									}

									_to = (_to.indexOf("0x") == 0 ? _to : "0x"+_to) * 1

								}else if(window.location.hash){
									_to = window.location.hash.replace("#","0x") * 1
								}

								if(_to){
									var _from = (cookies.address ? cookies.address : "0x"+cookies.hash) * 1
									
									if(window.cookies.to == (cookies.address ? cookies.address : "0x"+cookies.hash) && window.cookies.from){
										_from = (window.cookies.from.indexOf("0x") == 0 ? window.cookies.from : "0x"+window.cookies.from) * 1
									}

									var _address

									if(_from > _to){
										_address = ethers.hashMessage(_from.toString() + _to.toString())
										_address = ethers.computeAddress(_address).toLowerCase()
									}else{
										_address = ethers.hashMessage(_to.toString() + _from.toString())
										_address = ethers.computeAddress(_address).toLowerCase()
									}

									if(OAuth3.localhost){
										query.href = "http://" + OAuth3.localhost +"/"+ _address.replace("0x","#")
									}else{
										query.href = window.location.origin +"/"+ _address.replace("0x","#")
									}

									query.to = _address
								}else{
									return
								}
							}

							if(window.map.pending){
								body.rows = window.map.pending

								window.map.pending = []
							}

							OAuth3.xhr = OAuth3.fetch({
								method : "POST",
								url : url,
								body : body,
								query : query
							}, window.Callback);
						}
					}else if(window.response){
						window.setFrameloop("always")

						window.Callback(window.response)
					}
				}catch(err){
					console.log("err",err);
				}
			}

			OAuth3.submit = function($form, callback){
				var host = window.location.host;

				if(OAuth3.localhost){
					host = OAuth3.localhost;
				}
				
				var host_flag = "#tag "+host;
				var pathname = window.location.pathname;
				var search = window.location.search;
				var hash = window.location.hash; //"#"+crc32(window.location.hash).toString(32).toUpperCase();

				var team = false

				var player = window.players.self()

				if(window.dialog){
					cc_address = window.dialog.to.indexOf("0x") == 0 ? window.dialog.to : player.hash
			
					hash = cc_address.replace("0x", "#")
				}

				if(hash){
					var cc_address = hash.replace("#","0x")

					var clientAddress = cookies.address ? cookies.address : cookies.hash

					if(clientAddress == cc_address){
						team = true 
					}else{
						var _hash = "#"+crc32(clientAddress).toString(32).toUpperCase();
						host_flag = host_flag.replace("#tag", _hash);
					}

					host_flag = host_flag+hash;
				}

				var draggable = $form.getAttribute("draggable") ? JSON.parse($form.getAttribute("draggable")) : false;
				var contenteditable = $form.getAttribute("contenteditable") ? true : false;

				$status.innerHTML = '<div class="loading">\
					<strong>Loading...</strong>\
				</div>'

				if(contenteditable){
					var url = new URL($form.getAttribute("cc"));
					var Cc = url.pathname+hash;
					var To = $form.getAttribute("to");

					var Client = $form.getAttribute("client");

					var files = {};
					var links = {};
					
					var $fields = document.querySelectorAll('field[contenteditable="true"]');
					var $heading = $form.querySelector('field.heading h0');
					
					if($heading.getAttribute("link")){
						links[$form.id] = $heading.getAttribute("link");
					}

					var intent = $form.getAttribute("intent")

					var rows = [];
					var form_file;
					var form_row = {
						id : $form.id,
						to : To == Client ? intent : To,
						cc : Cc,
						flag : To == Client ? host_flag : host_flag.replace("#tag", "#"+$form.id), // 
						subject : $heading.textContent
					}

					if($heading.Blob){
						form_row.blob = {
							key : $form.id,
							type: $heading.Blob.type,
							success_action_redirect : OAuth3.host
						};

						files[$form.id] = $heading.Blob;
					}else if($heading.style["background-image"]){
						form_file = {
							id : $form.id,
							to : "file",
							cc : Cc,
							subject : To+"/"+$form.id,
							flag : host
						}
					}

					rows.push(form_row);

					if(form_file){
						rows.push(form_file);
					}

					if($heading.getAttribute("link")){
						rows.push({
							id : $form.id,
							to : "link",
							cc : Cc,
							subject : $heading.getAttribute("link"),
							flag : host
						})
					}

					var len = $fields.length;


					for(var i = 0; i < len; i++){
						var $field = $fields[i];
							$field.h0 = $field.querySelector("h0");
						var type = $field.getAttribute("type");

						var id = $form.id+" "+$field.id;

						if(i){
							var field_row = {
								id : id+" "+i,
								to : "field",
								cc : Cc,
								flag : $form.id,
								subject : $field.h0.textContent
							}

							var field_file = null;

							if($field.h0.Blob){
								field_row.blob = {
									key : id+" "+i,
									type: $field.h0.Blob.type,
									success_action_redirect : OAuth3.host
								};

								files[id+" "+i] = $field.h0.Blob;
							}else if($field.style["background-image"]){
								field_file = {
									id : id+" "+i,
									to : "file",
									cc : Cc,
									subject : To+"/"+id+" "+i,
									flag : host
								}
							}

							rows.push(field_row);

							if(field_file){
								rows.push(field_file);
							}

							if($field.h0.getAttribute("link")){
								rows.push({
									id : id+" "+i,
									to : "link",
									cc : Cc,
									subject : $field.h0.getAttribute("link"),
									flag : $field.id
								})
							}

							var $item = $field.querySelectorAll("item");

							for(var o = 0; o < $item.length; o++){
								var inputId = id+" "+$item[o].id+" "+i+" "+(o+1);

								var input_row = {
									id : inputId,
									to : type,
									cc : Cc,
									flag : $field.id,
									subject : $item[o].textContent
								};

								var input_file = null;

								if($item[o].Blob){
									input_row.blob = {
										key : inputId,
										type: $item[o].Blob.type,
										success_action_redirect : OAuth3.host
									};

									files[inputId] = $item[o].Blob;
								}else if($item[o].style["background-image"]){
									input_file = {
										id : inputId,
										to : "file",
										cc : Cc,
										subject : To+"/"+inputId,
										flag : host
									}
								}

								if($item[o].getAttribute("checked") || draggable){
									rows.push(input_row);
								}


								if($item[o].getAttribute("link")){
									rows.push({
										id : inputId,
										to : "link",
										cc : Cc,
										subject : $item[o].getAttribute("link"),
										flag : $item[o].id
									})
								}

								if(input_file){
									rows.push(input_file);
								}
							}
						}
					}

					var $count = document.querySelector('field.heading toolbar input[name="count"]');
					if($count){
						rows.push({
							id : $form.id,
							to : "count",
							cc : Cc,
							subject : $count.value,
							flag : host
						})
					}



					var $started = document.querySelector('field.heading toolbar input[name="started"]');
					var $expired = document.querySelector('field.heading toolbar input[name="expired"]');

					var $guest = document.querySelector('field.heading toolbar input[name="guest"]');

					var $created = document.querySelector('field.heading toolbar input[name="created"]');

					if($guest){
						if($guest.checked){
							rows.push({
								id : $form.id,
								to : "guest",
								cc : Cc,
								subject : "",
								flag : host
							})
						}
					}

					if($created){
						var created = $created.value;

						if(!created){
							created = new Date().toISOString()
								.replace(/T/, ' ')
								.replace(/\..+/, '')
						}

						rows.push({
							id : $form.id,
							to : "created",
							cc : Cc,
							subject : created,
							flag : $form.id
						})

						rows.push({
							id : $form.id,
							to : "created",
							cc : Cc,
							subject : Cc,
							flag : host,
							date : created
						})
					}

					if($started.value && $expired.value){
						var started = new Date($started.value).toISOString()
							.replace(/T/, ' ')
							.replace(/\..+/, '')

						rows.push({
							id : $form.id,
							to : "started",
							cc : Cc,
							subject : started,
							flag : $form.id
						})

						rows.push({
							id : $form.id,
							to : "started",
							cc : Cc,
							subject : Cc,
							flag : host,
							date : started
						})

						var expired = new Date($expired.value).toISOString()
							.replace(/T/, ' ')
							.replace(/\..+/, '')

						rows.push({
							id : $form.id,
							to : "expired",
							cc : Cc,
							subject : expired,
							flag : $form.id
						})

						rows.push({
							id : $form.id,
							to : "expired",
							cc : Cc,
							subject : Cc,
							flag : host,
							date : expired
						})
					}

					var $content = document.querySelectorAll('field.heading item');

					if($content.length){
						for(var d = 0; d < $content.length; d++){
							var $desc = $content[d];

							var $desc_id = $form.id+" "+(d+1);
							var desc_row = {
								id : $desc_id,
								to : "content",
								cc : Cc,
								subject : $desc.textContent,
								flag : $form.id
							}

							var desc_file;

							if($desc.Blob){
								desc_row.blob = {
									key : $desc_id,
									type: $desc.Blob.type,
									success_action_redirect : OAuth3.host
								};

								files[$desc_id] = $desc.Blob;
							}else if($desc.style["background-image"]){
								desc_file = {
									id : $desc_id,
									to : "file",
									cc : Cc,
									subject : To+"/"+$desc_id,
									flag : host
								}
							}

							rows.push(desc_row);

							if($desc.getAttribute("link")){
								rows.push({
									id : $desc_id,
									to : "link",
									cc : Cc,
									subject : $desc.getAttribute("link"),
									flag : $form.id
								})
							}

							if(desc_file){
								rows.push(desc_file);
							}
						}
					}


					var cc_url = window.location.href;

					var href = window.location.href;

					if(OAuth3.localhost){
						cc_url = "http://"+OAuth3.localhost+window.location.pathname+hash;
						href = "http://"+OAuth3.localhost+window.location.pathname+hash;
					}

					if(!contenteditable){
						var _to = ""

						if(window.dialog){
							_to = window.dialog.to

							if(window.cookies.to){
								_to = window.cookies.to
							}

							_to = (_to.indexOf("0x") == 0 ? _to : "0x"+_to) * 1									

						}else if(window.location.hash){
							_to = window.location.hash.replace("#","0x") * 1
						}

						if(_to){
							var _from = (window.cookies.address ? window.cookies.address : "0x"+window.cookies.hash) * 1
							
							if(window.cookies.to == (window.cookies.address ? window.cookies.address : "0x"+window.cookies.hash) && window.cookies.from){
								_from = (window.cookies.from.indexOf("0x") == 0 ? window.cookies.from : "0x"+window.cookies.from) * 1
							}

							var _address

							if(_from > _to){
								_address = ethers.hashMessage(_from.toString() + _to.toString())
								_address = ethers.computeAddress(_address).toLowerCase()
							}else{
								_address = ethers.hashMessage(_to.toString() + _from.toString())
								_address = ethers.computeAddress(_address).toLowerCase()
							}

							if(OAuth3.localhost){
								href = "http://" + OAuth3.localhost +"/"+ _address.replace("0x","#")
							}else{
								href = window.location.origin +"/"+ _address.replace("0x","#")
							}
						}
					}

					// 값 전송
					var request = {
						method : "POST",
						url : OAuth3.host,
						query : {
							href : href,
							to : "form",
							cc : cc_url
						},
						body : {
							rows : rows
						}
					}

					var response = function(res){
						var contenteditable = false;

						var cookies = JSON.parse(res.body.cookies);

						if(cookies.email){
							if(OAuth3.teams){
								if(OAuth3.teams[cookies.email]){
									contenteditable = true;
								}
							}
						}

						if(cookies.email){
							$status.innerHTML = ''
						}else{
							$status.innerHTML = '<a href="/login/">Sign In</a>'
						}

						var rows = res.body.rows;

						var date = new Date();
						var len = rows.length;

						for(var r = 0; r < len; r++){
							var row = rows[r];
							var blob = files[row.Id];

							if(blob && row.Blob){
								row.Blob.fields["Content-Type"] = blob.type;
								OAuth3.fetch({
									method : "POST",
									url : row.Blob.url,
									formData : row.Blob.fields,
									blob : blob
								}, function(resp){
									// console.log(resp);
								});
							}
						}

						if(callback){
							callback(response);
						}
					}

					try{
						if(OAuth3.xhr){
							OAuth3.xhr.abort()
							delete OAuth3.xhr
						}

						OAuth3.xhr = OAuth3.fetch(request, response);
					}catch(err){
						// console.log("저장 에러 err",err);
					}
				}else{
					var url = new URL($form.getAttribute("cc"));
					
					var Flag = "";

					var $guest = document.querySelector('[name="guest"]');
					var body = {};

					var $fields = document.querySelectorAll('field[id]');

					var Subject = "";

					if(url.username){
						Subject = url.username;
					}

					if(url.password){
						Subject += "@"+url.password;
					}


					if($form.getAttribute("cc")){
						var _url = new URL($form.getAttribute("cc"));

						var _hash = "#"+$form.id

						host_flag = _hash+" "+host+_url.hash;
					}

					var Cc = url.pathname+hash;

					var to = $form.getAttribute("to")

					var rows = [{
						id : $form.id,
						to : to,
						cc : Cc,
						subject : Subject,
						flag : host_flag
					}];

					var len = $fields.length;

					if($guest && !cookies.email){
						var id = $form.getAttribute("guest");

						if($guest.checked && id){
							var $from = document.querySelector('field[id="'+id+'"] h0');

							if($from){
								body.from = $from.textContent;
							}

							body.to = $form.getAttribute("to");
						}
					}


					var isAgree = true

					var isEmail = false
					var isPhone = false

					var regex = {
						phone : /^[+]*[(]{0,1}[0-9]{1,3}[)]{0,1}[-\s\./0-9]*$/g,
						email : /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
					}

					for(var i = 0; i < len; i++){
						var $field = $fields[i];

						var type = $field.getAttribute("type");

						var id = $form.id+" "+$field.id;

						if(i){
							var $item = $field.querySelectorAll("item");

							for(var o = 0; o < $item.length; o++){
								var privacy = $item[o].getAttribute("privacy")

								if($item[o].getAttribute("checked") || $item[o].getAttribute("readonly") || $item[o].getAttribute("check")){
									var subject = "";

									if(privacy){
										isAgree = false
									}else{
										if(contenteditable){
											subject = $item[o].textContent;
										}else{
											subject = $item[o].getAttribute("contenteditable") ? $item[o].textContent : "";
										}

										if(subject.toLowerCase().match(regex.email)){
											isEmail = true
										}

										if(subject.toLowerCase().match(regex.phone)){
											isPhone = true
										}

										rows.push({
											id : id+" "+$item[o].id+" "+i+" "+(o+1),
											to : type,
											cc : Cc,
											flag : $field.id,
											subject : subject
										})
									}
								}
							}
						}
					}

					var cc_url = window.location.href;

					var href = window.location.href;

					if(OAuth3.localhost){
						cc_url = "http://"+OAuth3.localhost+window.location.pathname+hash;
						href = "http://"+OAuth3.localhost+window.location.pathname+hash;
					}

					// 값 전송
					var request = {
						method : "POST",
						url : OAuth3.host+"/",
						query : {
							href : href,
							to : "form",
							cc : cc_url
						},
						body : {
							rows : rows,
							to : $form.getAttribute("to")
						}
					}

					if(Object.keys(body).length){
						for(var prop in body){
							if(body.hasOwnProperty(prop)) {
								request.body[prop] = body[prop];
							}
						}
					}

					if(!isAgree && (isEmail || isPhone)){
						var $field = $form.querySelector('field[draggable="false"]')

						var privacyBody = '<field class="privacy">\
							<h0>Do you agree on the provision of personal information to a third party?</h0>\
							<items>\
								<item class="checkbox privacy" type="checkbox">agree</item>\
							</items>\
						</field>'

						$field.outerHTML = privacyBody+$field.outerHTML

						return
					}

					var response = function(res){
						if(callback){
							callback(res);
						}
					}

					try{
						if(OAuth3.xhr){
							OAuth3.xhr.abort()
							delete OAuth3.xhr
						}

						OAuth3.xhr = OAuth3.fetch(request, response);
					}catch(err){
						// console.log("저장 에러 err",err);
					}
				}
			}
		}

		window.Init = function(cookies){
			var player_hash = cookies.address ? cookies.address : cookies.hash

			var tutorials = [
				"Move",
				"MineSweeper",
				"Puzzle",
				"Sticker",
				"Mine",
				"Portal",
				"Withdrawal"
			]

			var tutorial_body = '<option value="">Tutorial</option>';


			var len = tutorials.length

			for(var i = 0; i < len; i++){
				var value = tutorials[i]

				tutorial_body += '<option '+(i == len-1 ? "" : "disabled")+' value="'+value+'">'+value+'</option>'

			}

			$('form[name="Tutorial"] .index select').html(tutorial_body)


			document.querySelector("#header nav").innerHTML = '<ul class="gnb">\
				<li>\
					<a href="/#'+player_hash.replace("0x", "")+'">\
						<span class="address">\
							<address>\
								<span>#'+player_hash.replace("0x", "")+'</span>\
								<span dir="rtl">'+player_hash+'</span>\
							</address>\
						</span>\
					</a>\
				</li>\
				'+(cookies.address ? '<li><a class="feedback">Feedback</a></li><li><a href="'+OAuth3.host+'/logout">Logout</a></li>' : '<li><a href="/login/">Login</a></li>')+'\
			</ul>';

			var icon = blockies.create({seed: player_hash.indexOf("0x") > -1 ? player_hash : "0x"+player_hash});

			document.querySelector('#header label[for="nav"]').appendChild(icon);

			window.addEventListener('focus', function(){
				window.setFrameloop("always")
			})

			window.addEventListener('blur', function(){
				window.setFrameloop("demand")
			})

			window.addEventListener('change', function(e){
				try{
					var $this = $(e.target)

					var $item = $this.closest("item")

					if($item.length){
						var value = $this.val()
						$item.find("label").text(value);
						$item.attr("checked","checked")
						$this.val("")

						window.Chat(flows[window.dialog.index], value)
					}
				}catch(err){

				}
			})

			$body.on({
				click : async function(e){
					var $this = $(e.target)

					try{
						if($this.hasClass("enter")){
							if(typeof window.cookies.damage == "undefined"){
								if(cookies.pathname){
									if(cookies.pathname == window.location.pathname){
										$body.attr("mode", "third")
									}else{

									}	
								}else{
									$body.attr("mode", "third")
								}
							}
						}

						if(window.players){
							if(window.players.length){
								if(window.cookies.hash){
									var player = window.players.self()

									var $player = $('player[id="'+player.hash+'"][alt="player"]')

									var url = "https://xim.city";

									if(OAuth3.localhost){
										url = "http://localhost:3001"
									}

									if($this.hasClass("chat_message")){
										$aside.addClass("focus")
									}else{
										$aside.removeClass("focus")
									}


									if($this.closest("#rank").length){
										if($this.hasClass("item")){
											var hash = $this.attr("hash")

											if(hash){
												window.selector.set({hash : hash})

												$go.attr("href","/#"+hash)
												$go.text("visit")
												$go.removeAttr("way")

												window.assets.set(window.assets)
											}
										}

										return
									}
									
									if($this.hasClass("skip")){
										localStorage.tutorial = "complete"
										if(isNaN(localStorage.tutorial)){
											document.forms.Tutorial.index.value = ""
											$body.removeAttr("tutorial")
											$body.removeAttr("step")
											$(".layer, .layer form.popup").removeClass("on")

											delete window.tutorial

											if(window.location.href == window.response.body.query.href){
												window.Callback(window.response)
											}else{
												delete window.response
											}
											window.Polling = setInterval(window.Poll)
										}else{
											window.location.href = "/"
										}
									}

									if($this.hasClass("tutorial")){
										e.preventDefault()

										var $form = document.forms.Tutorial

										var isTutorial = $body.attr("tutorial")

										if(typeof isTutorial != "undefined"){
											document.forms.Tutorial.index.value = ""
											$body.removeAttr("tutorial")
											$body.removeAttr("step")
											$(".layer, .layer form.popup").removeClass("on")

											delete window.tutorial
											if(window.location.href == window.response.body.query.href){
												if(window.response){
													window.Callback(window.response)
												}
											}else{
												delete window.response
											}
											window.Polling = setInterval(window.Poll)
										}else{
											$('#header #nav').prop("checked", false)

											$(".layer").addClass("on")
											$($form).addClass("on")

											clearInterval(window.Polling)

											if(OAuth3.xhr){
												OAuth3.xhr.abort()
												delete OAuth3.xhr
											}

											if(window.tutorial){
												window.tutorial.name = ""
												window.tutorial.step = 0
											}

											window.Tutorial(0)
										}

										return
									}


									if($this.closest("#header").length){
										var href = $this[0].href

										if(href){
											if(href.indexOf("/logout") > -1){
												e.preventDefault()
												
												clearInterval(window.Polling)

												if(OAuth3.xhr){
													OAuth3.xhr.abort()
													delete OAuth3.xhr
												}

												OAuth3.xhr = OAuth3.fetch({
													method : "POST",
													query : {
														href : window.location.href,
														hash : cookies.hash,
														token : cookies.token
													},
													body : {},
													url : href
												}, function(){
													window.location.reload()
												})

												return
											}
										}
									}

									if($this.closest("dialog")){
										var $form = document.querySelector('form[name="oauth.network"]')

										if($form.className.indexOf("contenteditable") == -1 && ($this.attr("type") == "flow" || $this[0].tagName == "ITEM" || $this.hasClass("datepicker")) && window.dialog){
											if(window.dialog.flow){
												if(window.dialog.flow.response){													
													var $items = $this.closest("items")

													var $checked

													var Idx = ""
													var link = ""

													if($this.attr("type") == "flow"){
														Idx = $this.attr("id")

														window.dialog.index = 0
													}

													$('messages li').removeClass("on")
													$('messages li item[type="date"]').removeAttr("checked")
													$this.closest("li").addClass("on")

													if($this.hasClass("datepicker")){
														var date = $this.val()

														if(date){
															
														}else{
															return
														}
													}

													if($items.length){
														link = $items.attr("id")

														if($checked){
															return
														}
													}

													if($this.attr("contenteditable") || $this.attr("disabled")){
														return
													}

													var flows = []

													try{
														var group = window.dialog[window.dialog.id]

														if(group.Length){
															if(!Idx){
																for(var s = 1; s <= group.Length; s++){
																	var tr = group[s]

																	if(tr.Th.Length){
																		for(var h = 0; h <= tr.Th.Length; h++){
																			var item = tr.Th[h];

																			if(item){
																				if(item.link == link){
																					Idx = item.Flag
																					window.dialog.index = h
																				}
																			}
																		}
																	}
																}
															}

															for(var s = 1; s <= group.Length; s++){
																var tr = group[s]

																if(tr.Idx == Idx){
																	if(tr.Th.Length){
																		for(var h = 0; h <= tr.Th.Length; h++){
																			var item = tr.Th[h];

																			if(item.Id == link){
																				window.dialog.index = h
																			}
																			
																			flows.push(item)
																		}
																	}
																}
															}
														}
													}catch(err){
														console.log("err",err);
													}
													// checked 처리해야함

													if(!window.dialog.index){
														window.dialog.index = 0
													}

													window.flows = flows

													if(window.dialog.index < flows.length){
														getTable('form', false, window.dialog.flow.response, flows)
													}
												}
											}
										}
									}

									if($this.closest("emoji").length){
										var $emoji = $this.closest("emoji")

										var focus = $emoji.attr("selector");

										if(focus){
											$player = $('player[id="'+focus+'"]')

											var $tooltip = $player.find("tooltip");

											var $emojis = $("emojis")

											var _far = window.far;

											if($tooltip.hasClass("on")){
												$tooltip.removeClass("on")
												$body.removeAttr("tooltip")

											}else{
												$('tooltip').removeClass("on")
												$tooltip.addClass("on")
												$body.attr("tooltip", true)

												Zoom()
											}
										}
									}

									if($this.hasClass("feedback")){
										var $form = document.forms.feedback
										$form.emoji.value = player.emoji
										$form.hash.value = cookies.hash
										$form.token.value = cookies.token

										$(".layer").addClass("on")
										$($form).addClass("on")
									}

									if($this.hasClass("zoom")){
										e.preventDefault()

										var _far = window.far

										if($this.hasClass("up")){
											_far.x += 1
											_far.y += 1
											_far.z += 1
										}

										if($this.hasClass("down")){
											_far.x -= 1
											_far.y -= 1
											_far.z -= 1									
										}

										if($this.hasClass("map")){
											$("tooltip").removeClass("on")

											if(_far.x == 10){
												_far.x = 4.5
												_far.y = 4.5
												_far.z = 4.5

												window.speed = 0.1
												$this.removeClass("color")
											}else{
												_far.x = 10
												_far.y = 10
												_far.z = 10

												window.speed = 0.2
												$this.addClass("color")
											}
										}


										if(_far.x <= 10){
											$body.attr("zoom", _far.x)

											if(_far.x == 10){
												
											}else{
												
											}

											window.far.set(_far)
										}

										if($body.hasClass("select_emoji")){
											var $player = $('player[id="'+player.hash+'"][alt="player"]')

											$player.removeAttr("class")
											$body.removeAttr("class")
										}
									}

									if($this.hasClass("back")){
										if($body.hasClass("select_emoji")){
											var $player = $('player[id="'+player.hash+'"][alt="player"]')

											$player.find("tooltip").addClass("on")
											$player.removeAttr("class")
											$body
												.removeAttr("class")
												.removeAttr("bingo")

											$("form.portal").val("")

											if(OAuth3.xhr){
												OAuth3.xhr.abort()
												delete OAuth3.xhr
											}

											emojiChanged(window.emojis.self)
										}
										// 인벤토리
									}
									
									if($this.hasClass("message")){
										if($this.hasClass("close")){
											if($body.attr("bingo") == "notify"){
												$form.className = ""
												$body
													.removeAttr("class")
													.removeAttr("bingo")
											}

											$aside.removeClass("on")
											$("form.message").val("")

											var $messages = $("messages")
											var $talk = $("talks")

											$messages.removeClass("on")

											$talk.removeClass("on")
										}
									}

									if(e.target.name == "message"){
										$body.removeAttr("tooltip")
										$("tooltip").removeClass("on")
									}

									if($this.hasClass("hashType")){
										e.preventDefault()

										try{
											var body = {
												emoji : window.emojis.self
											}

											var query = {
												href : window.location.href,
												hash : cookies.hash,
												token : cookies.token,
												x : player.x,
												y : player.y,
												z : player.z
											}

											var $player = $('player[id="'+player.hash+'"][alt="player"]')

											var $$player = $this.closest("player")

											var player_hash = $$player.attr("id")

											var cc_address = ethers.hashMessage(window.location.href.replace(window.location.protocol+"//",""))
												cc_address = ethers.computeAddress(cc_address).toLowerCase()

											if(window.location.hash){
												cc_address = window.location.hash.replace("#", "0x")
											}

											if(window.dialog){
												if(window.cookies.to){
													cc_address = window.cookies.to
												}else{
													cc_address = window.dialog.to
												}
												// cc_address = window.dialog.to.indexOf("0x") == 0 ? window.dialog.to : "0x"+window.dialog.to
											}

											if($this.hasClass("Crafting")){
												$aside.addClass("more")
												$body
													.addClass("Crafting")
													.removeAttr('tooltip')

												$('.emoji[type="sticker"]')
													.addClass('on')
													.addClass('more')

												return
											}else if($this.hasClass("Portal")){
												var alt = $$player.attr("alt")

												if(alt == "playground"){
													player_hash = player_hash.toLowerCase().replace("0x","")
												}

												if(alt == "playground" || player.hash.indexOf(player_hash) > -1){
													var hash = cc_address.replace("0x","").toLowerCase()

													var skip = false

													if(window.tutorial){
														if(window.tutorial.step){
															window.onhashchange()
															player_hash = player.hash		
														}else{
															skip = true
															window.Tutorial(6)
															body.emoji = player.emoji
															body.cc = "portal"
														}
													}

													if(!skip){
														window.location.hash = player_hash.replace("0x","").toLowerCase()

														setTimeout(function(){
															window[player.hash].position.x = window.current.current.position.x = window.cursor.current.position.x = 1.5
															window[player.hash].position.z = window.current.current.position.z = window.cursor.current.position.z = 1.5

															if(window.tutorial){
																window.tutorial.rows = []	
																setTimeout(function(){
																	window.Tutorial(7)
																},1000)
															}
														}, 500)
														
														return
													}
												}

											}else if($this.hasClass("Chord")){
												body.cc = "chord"

											}else if($this.hasClass("Flag")){
												body.cc = "flag"

											}else if($this.hasClass("Open")){
												body.cc = "open"

											}else if($this.hasClass("Follow")){
												if(body.to != player.hash){
													body.cc = "follow"
													body.to = $$player.attr("id")
												}

											}else if($this.hasClass("Report")){
												var $form = document.forms.report
												$form.to.value = $$player.attr("id")
												$form.emoji.value = player.emoji
												$form.hash.value = cookies.hash
												$form.token.value = cookies.token

												$(".layer").addClass("on")
												$($form).addClass("on")

												return
											}else if($this.hasClass("Withdrawal")){
												if(cookies.email || window.tutorial){
													var $form = document.forms.Withdrawal
													$form.hash.value = cookies.hash
													$form.token.value = cookies.token

													$(".layer").addClass("on")
													$($form).addClass("on")
												}

												return
											}else if($this.hasClass("Dialog")){
												delete window.dialog

												window.dialog = {
													to : player_hash
												}

												if(cc_address == window.cookies.address){
													getTable("form",true)
												}else{
													getTable("flows")
												}

												return
											}else if($this.hasClass("Flow")){
												delete window.dialog

												if(cc_address == window.cookies.address){
													getTable("flows",true)
												}

												return
											}
										}catch(err){
											// console.log("err",err);
										}

										var id = cookies.hash+"["+player.x+","+player.z+"]"

										var _assets = window.assets;

										var diff = false

										if(body.cc == "flag"){
											diff = true

											if(window.assets[id]){
												var len = window.assets.length

												var index

												for(var a = 0; a < len; a++){
													if(window.assets[a].x == player.x && window.assets[a].z == player.z){
														index = a
													}
												}

												if(typeof index != "undefined"){
													window.assets.splice(1, index)
												}
											}else{
												_assets.push({
													id : id,
													hash : player.hash,
													name : "flag",
													value : "",
													color: "orange",
													x : player.x,
													y : -0.08,
													z : player.z
												})
											}
										}

										emojiChanged("🫥")

										if(diff){
											window.assets.set(_assets)
										}

										if(OAuth3.xhr){
											OAuth3.xhr.abort()
											delete OAuth3.xhr
										}



										if(window.tutorial){
											setTimeout(function(){
												var res = JSON.stringify(window.response)
													res = JSON.parse(res)

												res.body.query = query
												res.body.body = body
												
												window.Callback(res)
											},1500)
										}else{
											var _to = ""

											if($body.attr("bingo") == "dialog"){
												if(window.dialog){
													_to = window.dialog.to
													if(window.cookies.to){
														_to = window.cookies.to
													}else{
														_to = window.dialog.to
													}

													_to = (_to.indexOf("0x") == 0 ? _to : "0x"+_to) * 1									

												}else if(window.location.hash){
													_to = window.location.hash.replace("#","0x") * 1
												}
											}

											if(_to){
												var _from = (window.cookies.address ? window.cookies.address : "0x"+window.cookies.hash) * 1

												var _address

												if(_from > _to){
													_address = ethers.hashMessage(_from.toString() + _to.toString())
													_address = ethers.computeAddress(_address).toLowerCase()
												}else{
													_address = ethers.hashMessage(_to.toString() + _from.toString())
													_address = ethers.computeAddress(_address).toLowerCase()
												}

												
												if(OAuth3.localhost){
													query.href = "http://" + OAuth3.localhost +"/"+ _address.replace("0x","#")
												}else{
													query.href = window.location.origin +"/"+ _address.replace("0x","#")
												}
												query.to = _address
											}


											OAuth3.xhr = OAuth3.fetch({
												method : "POST",
												query : query,
												body : body,
												url : url
											}, window.Callback)
										}
									}

									if($this.hasClass("emoji_asset")){
										e.preventDefault()

										var type = $this.attr("type")
										var emoji = $this.attr("emoji")
										var method = $this.attr("method")

										var player_emoji = player.emoji + ""

										Zoom()


										var body = {
											emoji : window.typeof_emoji(emoji) ? emoji : window.emojis.self
										}

										var $talk = $("talks")
										var $messages = $("messages")

										console.log('method',method);

										if(type == "player"){
											var hash = $this.attr("hash")

											if(player.hash != hash){
												var $target = $('player#'+hash+" emoji")

												if($target.length){
													var camera = JSON.stringify({
														hash : hash
													})

													$target.click()
													window.camera.set(JSON.parse(camera))
												}
											}else{
												var $target = $('player#'+player.hash+" emoji")

												if($target.length){
													$target.click()
													window.camera.set({})
												}
											}

											if($this.closest(".follows").length){
												window.location.hash = hash.replace("0x","").toLowerCase()
											}

											return
										}

										if(type == "emoji" || type == "item"){
											if(method){
												if(type == "emoji"){
													emoji = player_emoji
												}else if(emoji == "💣"){
													
												}

												if(method == "notify"){
													$status.innerHTML = '<div class="loading">\
														<strong>Loading...</strong>\
													</div>'


													if(document.querySelector("notify")){
														document.querySelector("notify").remove()
													}

													$('notify input[type="checkbox"]').prop("checked",false)

													try{
														var host = window.location.host

														if(OAuth3.localhost){
															host = OAuth3.localhost
														}

														var url = "https://xim.city/";

														if(OAuth3.localhost){
															url = "http://localhost:3001/"
														}

														var href = window.location.href

														var referer = new URL(href)

														var request = {
															method : "POST",
															url : url,
															body : {
																cc : "vapid"
															},
															query : {
																host : referer.host,
																href : window.location.href,
																hash : cookies.hash,
																token : cookies.token,
																x : player.x ? player.x : "1.5",
																y : player.y ? player.y : "0",
																z : player.z ? player.z : "1.5"
															}
														}

														var response = function(res){
															var cookies = JSON.parse(res.body.cookies);

															if(cookies.email){
																$status.innerHTML = ''
															}else{
																$status.innerHTML = '<a href="/login/">Sign In</a>'
															}

															if(OAuth3.xhr){
																OAuth3.xhr.abort()
																delete OAuth3.xhr
															}

															var _href = "https://xim.city/"+cookies.vapid

															if(!cookies.vapid){
																$('.emoji_asset[method="notify"]').removeClass("on")
															}

															if(OAuth3.isMobile){
																if(cookies.vapid){
																	window.open(_href+"?referer="+encodeURIComponent(href),'_top','noreferrer')
																}
															}else if(cookies.vapid){
																if(!document.querySelector("notify")){
																	$body.append('<notify><input type="checkbox" id="notify"><div class="tb"><div class="tc"></div></div></notify>')
																}

																document.querySelector("notify .tc").innerHTML = '<form name="xim.city" action="javascript:Subscribe()">\
																	<qr>\
																		<a class="qr-code"></a>\
																		<label for="notify">\
																			<span class="ko">알림 동의</span>\
																			<span class="en">notification agree</span>\
																		</label>\
																	</qr>\
																	<input name="vapid" type="hidden" value="'+cookies.vapid+'">\
																	<div class="area">\
																		<input disabled type="submit">\
																	</div>\
																</form>'

																var $qrcode = document.querySelector(".qr-code")

																new QRCode($qrcode, {
																	text: _href,
																	width: 300,
																	height: 300,
																	colorDark : "#000000",
																	colorLight : "#ffffff",
																	correctLevel : QRCode.CorrectLevel.H
																})
															}
														}

														if(OAuth3.xhr){
															OAuth3.xhr.abort()
															delete OAuth3.xhr
														}

														OAuth3.xhr = OAuth3.fetch(request, response);
													}catch(err){
														console.log("Err",err);
													}

													return

												}else if(method == "chat"){
													$aside.addClass("on")

													if(!$messages.hasClass("on")){
														$messages.addClass("on")

														$talk.addClass("on")
													}

													$('form.message input[name="message"]').focus()

													return

												}else if(method != "open"){										

													return
												}
											}
										}

										if($messages.hasClass("on")){
											$messages.removeClass("on")

											$talk.removeClass("on")
										}

										if(type == "reward"){
											var balance = $this.attr("balance")

											if(!isNaN(balance)){
												balance = balance * 1

												if(balance > 0){
													emojiChanged("🫥")
													
													OAuth3.fetch({
														method : "POST",
														url : url,
														body : {
															cc : "reward"
														},
														query : {
															href : window.location.href,
															hash : cookies.hash,
															token : cookies.token,
															x : player.x ? player.x : "1.5",
															y : player.y ? player.y : "0",
															z : player.z ? player.z : "1.5"
														}
													}, window.Callback);
												}
											}
										}else if(emoji == "💣"){
											emojiChanged("🫥")
											
											var query = {
												href : window.location.href,
												hash : cookies.hash,
												token : cookies.token,
												x : player.x,
												y : player.y,
												z : player.z
											}

											body.cc = "bomb"
											body.emoji = player_emoji

											var _assets = window.assets;

											// {
											// 	id : row.Id,
											// 	hash : cc_address,
											// 	name : hashtag,
											// 	value : "",
											// 	color: "",
											// 	x : b.x,
											// 	y : b.y,
											// 	z : b.z
											// }

											// var biome = window.map.biomes[player.x+":"+player.z]

											// _assets.push({
											// 	id : "",
											// 	hash : randomHash(),
											// 	name : "bomb",
											// 	value : emoji,
											// 	color: player_emoji,
											// 	x : player.x,
											// 	y : biome.y,
											// 	z : player.z
											// })

											// var assets_ = JSON.stringify(_assets)

											// window.assets.set(_assets)

											if(OAuth3.xhr){
												OAuth3.xhr.abort()
												delete OAuth3.xhr
											}

											OAuth3.xhr = OAuth3.fetch({
												method : "POST",
												query : query,
												body : body,
												url : url
											}, window.Callback);

											return

										}else{
											if(method == "open"){
												body.open = "true"

												emojiChanged("🫥")

												if(OAuth3.xhr){
													OAuth3.xhr.abort()
													delete OAuth3.xhr
												}

												if(window.tutorial){
													var res = JSON.stringify(window.response)
														res = JSON.parse(res)

													res.body.query = query
													res.body.body = body
													
													window.Callback(res)
												}else{
													OAuth3.xhr = OAuth3.fetch({
														method : "POST",
														url : url,
														body : body,
														query : {
															href : window.location.href,
															hash : cookies.hash,
															token : cookies.token,
															x : player.x ? player.x : "1.5",
															y : player.y ? player.y : "0",
															z : player.z ? player.z : "1.5"
														}
													}, window.Callback);
												}
											}else{
												if(type == "emoji"){
													if(OAuth3.xhr){
														OAuth3.xhr.abort()
														delete OAuth3.xhr
													}

													window.emojis.self = emoji
													
													emojiChanged(emoji)
												}
											}
										}
									}

									if($this.attr("id") == "capture"){
										if($this.hasClass("open_rank")){
											$this.removeClass("open_rank")

											$go.removeAttr("href")
											$go.removeAttr("way")

											window.selector.set({hash : ""})
											
											window.assets.set(window.assets)
										}else{
											$this.addClass("open_rank")
										}
									}

									if($this.closest(".layer").length){
										if($this.hasClass("close")){
											$(".layer, .layer form.popup").removeClass("on")
										}
									}
								}
							}
						}
					}catch(err){
						console.log("Err",err);
					}
				}
			})

			if(!OAuth3.isMobile){
				var $scrollContainer = $("emojis .scroll")

				$scrollContainer.on({
					wheel : function(e){
						if(!$aside.hasClass("more")){
							e.preventDefault();
							this.scrollLeft += e.originalEvent.deltaY;
						}
					}
				})
			}

			var joystick = {
				start : {
					x : 0,
					y : 0
				},
				end : {
					x : 0,
					y : 0
				},
				set : function(e){
					var $el = $(e.target)

					var isJoystick = ($el.closest("emojis").length + $el.closest("#rank").length) == 0

					if(e.target.tagName == "SELECT"){
						isJoystick = false
					}

					if(isJoystick){
						var position = {
							x : 0,
							z : 0
						}

						var limit = 10

						if(joystick.start.y-joystick.end.y>limit){
							position.z += 1
						}else if(joystick.end.y-joystick.start.y>limit){
							position.z -= 1
						}else if(joystick.start.y-joystick.end.y<limit || joystick.end.y-joystick.start.y<limit ){
							position.z = 0
						}

						if(joystick.start.x-joystick.end.x>limit){
							position.x += 1
						}else if(joystick.end.x-joystick.start.x>limit){
							position.x -= 1
						}else if(joystick.start.x-joystick.end.x<limit || joystick.end.x-joystick.start.x<limit ){
							position.x = 0
						}

						if(position.x == 0 && position.z == 0){
						}else{
							if(position.x > 0 && position.z < 0){
								position.x--
							}else if(position.x < 0 && position.z > 0){
								position.x++
							}else if(position.x < 0 && position.z < 0){
								position.x = -1
								position.z = 0
							}else if(position.x > 0 && position.z > 0){
								position.x = 1
								position.z = 0
							}else if(position.x == 0 && position.z > 0){
								position.x = 1
								position.z = 1
							}else if(position.x > 0 && position.z == 0){
								position.x = 1
								position.z = -1
							}else if(position.x < 0 && position.z == 0){
								position.x = -1
								position.z = 1
							}else if(position.x == 0 && position.z < 0){
								position.x = -1
								position.z = -1
							}

							window.setFrameloop("always")

							

							var players = window.players

							var player = window.players.self()
								player.x = window.current.current.position.x + position.x
								
								player.z = window.current.current.position.z + position.z

							var biome = window.map.biomes[player.x+":"+player.z]

							// player.y = biome.y

							var edge = (window.grid.edge / 2) + 1

							var $go = $("#go")
							
							if(player.x < edge && player.x > -edge && player.z < edge && player.z > -edge){
								if(window.camera){
									if(window.camera.hash){
										if(window.camera.hash != player.hash){
											window.camera.set({})
										}
									}
								}

								window[player.hash].position.y = window.current.current.position.y = window.cursor.current.position.y = biome.y + 0.01

								window[player.hash].position.x = window.current.current.position.x = window.cursor.current.position.x = player.x								
								window[player.hash].position.z = window.current.current.position.z = window.cursor.current.position.z = player.z

								if(window.tutorial){
									if(window.tutorial.name == "Move" && window.tutorial.step == 1){
										window.Tutorial(2)
									}
								}
							}

							var _edge = ( window.grid.edge / 2 ) - 1

							if(player.x < -_edge || player.z < -_edge || player.x > _edge || player.z > _edge){
								var alpha = 0

								if(player.x > _edge || player.z < -_edge){
									alpha = 1
								}else if(player.x < -_edge || player.z > _edge){
									alpha = -1
								}

								var cc_address = ethers.hashMessage(window.location.href.replace(window.location.protocol+"//",""))
									cc_address = ethers.computeAddress(cc_address).toLowerCase()

								if(window.location.hash){
									cc_address = window.location.hash.replace("#","")
								}

								if(window.dialog){
									cc_address = (window.dialog.to.indexOf("0x") == 0 ? window.dialog.to : "0x"+window.dialog.to).replace("0x","")
								}

								var href = window.numStringToBytes32(
									(BigInt(window.bytes32ToNumString(cc_address))+BigInt(alpha)).toString()
								).replace("0x","#")

								$go.attr("href",href)
								$go.text(alpha > 0 ? "east" : "west")
								$go.attr("way", (alpha > 0 ? "east" : "west"))
							}else{
								$go.removeAttr("href")
								$go.removeAttr("way")
							}

							window.Callback(window.response)
						}
					}
				}
			}
			
			$body.on('mousedown',function(event){
				joystick.start.x = event.pageX;
				joystick.start.y = event.pageY;
			});

			$body.on('mouseup',function(event){
				joystick.end.x = event.pageX;
				joystick.end.y = event.pageY;

				joystick.set(event)
			});

			$body.on('touchstart',function(event){
				joystick.start.x = event.originalEvent.changedTouches[0].screenX;
				joystick.start.y = event.originalEvent.changedTouches[0].screenY;
			});

			$body.on('touchend',function(event){
				joystick.end.x = event.originalEvent.changedTouches[0].screenX;
				joystick.end.y = event.originalEvent.changedTouches[0].screenY;

				joystick.set(event)
			});

			var onscroll = function(){
				var t = document.scrollingElement.scrollTop

				if(t){
					$body.attr("scrolling",true)
				}else{
					$body.removeAttr("scrolling")

					var $date = document.querySelector('messages li input[name="date"]')

					if($date){
						window.Poll.date = $date.value

						var $loading = $('messages ul li.loading, messages ul li[id=""], talks ul li[id=""]')
					
						if($loading.length){
							$loading.remove()
						}

						$('messages ul').prepend('<li class="loading">\
							<div class="lds-ring">\
								<div></div>\
								<div></div>\
								<div></div>\
								<div></div>\
							</div>\
						</li>')

						if(OAuth3.xhr){
							OAuth3.xhr.abort()
							delete OAuth3.xhr
						}
					}
				}
			}

			window.addEventListener("scroll", onscroll)

			var $chat = $(document.forms.chat)

			window.Chat = function(flow, date){
				var player = window.players.self()
				var len = players.length

				var $form = document.forms.chat

				var message = $form.message.value

				$body.removeAttr("tooltip")

				$("tooltip").removeClass("on")

				var talks = ""

				var query = {
					href : window.location.href,
					hash : cookies.hash,
					token : cookies.token,
					x : player.x,
					y : player.y,
					z : player.z
				}

				var body = {
					cc : "message",
					subject : message,
					emoji : player.emoji
				}

				var flows = []

				if(flow){
					message = body.subject = date ? date : flow.Subject
				}

				var text = ""

				try{
					var _url = new URL(message)

					var oembed = window.oembed(_url)

					if(!oembed.provider){
						text = '<a target="_blank" href="'+_url.href+'">\
							<img src="'+_url.protocol+'//'+_url.host+'/favicon.ico"> Link\
						</a>'
					}
				}catch(err){
					text = '<span>'+message+'</span>'
				}

				if(text && !flow){
					$('messages ul').append('<li id="" class="self item message">\
						<div class="text">\
							<span class="icon" data-from="'+player.hash+'"></span>\
							<text>'+text+'</text>\
						</div>\
					</li>')

					var $talk = $("talks."+player.hash)

					$talk.find('ul').append('<li id="" class="item">\
						<div class="text">\
							<span class="icon" data-from="'+player.hash+'"></span>\
							<text>'+text+'</text>\
						</div>\
					</li>')

					var $icons = $("messages li .icon")

					if($icons.length){
						$icons.each(function(i, el){
							var hash = el.dataset.from

							var $icon = $icons.eq(i)

							try{
								var canvas = blockies.create({seed: "0x"+hash})
								$icon.css("background-image", "url("+canvas.toDataURL()+")")
							}catch(err){

							}
						})
					}

					var $icons = $("talks li .icon")

					if($icons.length){
						$icons.each(function(i, el){
							var hash = el.dataset.from

							var $icon = $icons.eq(i)

							try{
								var canvas = blockies.create({seed: "0x"+hash})
								$icon.css("background-image", "url("+canvas.toDataURL()+")")
							}catch(err){

							}
						})						
					}

					$("messages").addClass("on")
					$("talks."+player.hash).addClass("on")

					var h = document.documentElement.scrollHeight

					$("html,body").scrollTop(h)

					OAuth3.timeout = true
				}

				if($body.attr("bingo") == "dialog"){
					try{
						var _to = ""

						if(window.dialog){
							_to = window.dialog.to
							if(window.cookies.to){
								_to = window.cookies.to
							}else{
								_to = window.dialog.to
							}

							// query.href = window.location.origin +"/"+ (_to.indexOf("0x") == 0 ? _to : "0x"+_to).replace("0x","#")
							_to = (_to.indexOf("0x") == 0 ? _to : "0x"+_to) * 1

						}

						if(_to){
							if(flow){
								var $item

								var _dialog

								try{
									$item = document.querySelector('messages li.on item[checked="checked"]')
									flow.Idx = $item.id
									message = body.subject = flow.Subject = $item.textContent
								}catch(err){
									// $item = document.querySelector('form[name="oauth.network"] [type="flow"][checked="checked"]')
								}
								
								if(window.flows[window.dialog.index+1]){
									body.flow = JSON.stringify(window.flows[window.dialog.index+1])
									_dialog = JSON.stringify(flow)
									_dialog = JSON.parse(_dialog)
								}else{
									_dialog = JSON.stringify(window.flows[window.dialog.index])
									_dialog = JSON.parse(_dialog)
								}

								if(date){
									_dialog.Subject = date
								}

								body.dialog = JSON.stringify(_dialog)
							}

							var _from = (cookies.address ? cookies.address : "0x"+cookies.hash) * 1
							
							var _address

							if(_from > _to){
								_address = ethers.hashMessage(_from.toString() + _to.toString())
								_address = ethers.computeAddress(_address).toLowerCase()
							}else{
								_address = ethers.hashMessage(_to.toString() + _from.toString())
								_address = ethers.computeAddress(_address).toLowerCase()
							}

							// query.href = window.location.origin +"/"+ _address.replace("0x","#")
							
							// body.to = _address

							if(!flow){
								query.to = _address
							}

							if(OAuth3.localhost){
								query.href = "http://" + OAuth3.localhost +"/"+ _address.replace("0x","#")
							}else{
								query.href = window.location.origin +"/"+ _address.replace("0x","#")
							}

							try{
								if(window.cookies.to){
									body.to = window.cookies.to
								}else{
									body.to = window.dialog.to
								}
							}catch(err){
								body.to = window.dialog.to
							}
						}
					}catch(err){
						console.log("err", err);
					}
				}

				if(message.length){
					$status.innerHTML = '<div class="loading">\
						<strong>Loading...</strong>\
					</div>'

					if(body.emoji){
						window.emojis.message = body.emoji
						window.emojis.self = body.emoji
					}

					var url = "https://xim.city";

					if(OAuth3.localhost){
						url = "http://localhost:3001"
					}

					if(OAuth3.xhr){
						OAuth3.xhr.abort()
						delete OAuth3.xhr
					}

					OAuth3.xhr = OAuth3.fetch({
						method : "POST",
						query : query,
						body : body,
						url : url
					}, window.Callback);
				}

				$form.message.value = "";
			}

			window.emojis.unshift({
				method : "chat",
				icon : "chat",
				type : "emoji"
			})

			window.emojis.unshift({
				method : "notify",
				icon : "notifications",
				type : "emoji"
			})

			var li = ""

			var emojis = []

			var assets = []

			var player_hash = cookies.hash

			for(var i = 0; i < window.emojis.length; i++){
				var item = window.emojis[i]

				var type = item.type

				var method = item.method ? item.method : ""

				var icon = item.icon

				var className = "emoji color"

				if(type == "emoji"){
					emojis.push(item)

					var skip = false

					if(method){
						className = ""

						if(method == "getDisplayMedia"){
							icon = "cast"
						}else if(method == "getUserMedia"){
							icon = item.icon
						}else if(method == "chat"){
							icon = "sms"
						}else if(method == "recommand"){
							skip = true
						}
					}

					var $a = ""

					if(!skip){
						$a = '<a class="'+className+'">'+icon+'</a>'
					}

					li += '<div draggable="false" class="emoji_asset" emoji="'+icon+'" type="'+type+'" method="'+method+'">'+$a+'</div>'
				}
			}

			$("emojis .emojis").html(li)
			$('.emoji[type="emoji"] cnt').text(emojis.length)

			var $emojis_filter = $(".emojis_filter .emoji")
				$emojis_filter.on({
					click : function(e){
						var $this = $(this)
						var filter = $this.attr("type")

						$aside.attr("sort",filter)

						if($this.hasClass("on")){
							if($this.hasClass("more")){
								$aside.removeClass("more")
								$this.removeClass("more")
							}else{
								$aside.addClass("more")
								$this.addClass("more")
							}
						}else{
							$aside.removeClass("more")
							$emojis_filter.removeClass("on")
							$emojis_filter.removeClass("more")
							$this.addClass("on")
						}
					}
				})

			var $emojis = document.querySelector("emojis .scroll")
			var x = 0, y = 0, top = 0, left = 0

			var isTouch = false

			var draggingFunction = function(e){
				if(isTouch){
					$emojis.scrollLeft = left - e.pageX + x
					$emojis.scrollTop = top - e.pageY + y
				}
			};

			$emojis.addEventListener('mousedown', function(e){
				e.preventDefault()

				isTouch = true

				y = e.pageY
				x = e.pageX
				top = $emojis.scrollTop
				left = $emojis.scrollLeft

				document.addEventListener('mousemove', draggingFunction)
			})

			window.addEventListener('mouseup', function() {
				isTouch = false
			})

			if(!window.onhashchange){
				window.onhashchange = function(e){
					document.scrollingElement.scrollTop = 0

					window.map = {}

					delete window.dialog

					$body
						.removeAttr("class")
						.removeAttr("bingo")
						.removeAttr("chat")
						.addClass("loading")

					var $form = $('form[name="oauth.network"]')
					$form.removeClass("on")

					if(form_template.length > 0){
						$form[0].outerHTML = form_template
					}

					$nav.prop("checked",false)
					
					$('messages ul, #rank ol, #capture>.rank_toggle, talks ul').html("")

					var address = window.location.hash.replace("#","0x")

					var player = window.players.self()

					var default_img = '' //'<img src="https://fonts.gstatic.com/s/e/notoemoji/latest/1f600/512.gif" alt="">'

					
					if(host_address.indexOf(address) == -1){
						$("#nav").prop("checked",false)

						$("#intro .title .emoji").html("")
						$("#intro .title .emoji").append(blockies.create({seed: address}))

						$("#intro .coptyright p").html('<span class="address">\
							<address>\
								<span>'+address+'</span>\
								<span dir="rtl">'+address+'</span>\
							</address>\
						</span>')
					}else{
						$("#intro .title .emoji").html('<img src="https://fonts.gstatic.com/s/e/notoemoji/latest/1f600/512.gif" alt="">')
						$("#intro .coptyright p").html('XIM.CITY')
					}

					if(OAuth3.xhr){
						OAuth3.xhr.abort()
						delete OAuth3.xhr
					}

					clearInterval(window.Polling)
					window.Polling = setInterval(window.Poll)

					$go.referer = true


					$status.innerHTML = '<div class="loading">\
						<strong>Loading...</strong>\
					</div>'

					setTimeout(function(){
						$('player[self="true"] emoji').click()

						window.speed = 0.2

						window.camera.set({})

						window.players.set([{
							follow : false,
							self : true,
							hash : cookies.address ? cookies.address : cookies.hash,
							emoji : "😀",
							x : 1.5,
							y : 0.5,
							z : 1.5
						}])

						window.assets.set([])
						window.setFrameloop("always")

						window[player.hash].position.x = window.current.current.position.x = window.cursor.current.position.x = 1.5
						window[player.hash].position.z = window.current.current.position.z = window.cursor.current.position.z = 1.5

						if(!window.tutorial){
							delete window.response
						}
					}, 2000)
				}
			}
		}

		OAuth3.fetch(request, response);
	}
})