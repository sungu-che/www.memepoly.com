var plant
var time = {
	balance : 600,
	zone : new Date().getTimezoneOffset()
}
var offset = -540

if(offset + 60 <= time.zone || offset - 60 >= time.zone || OAuth3.localhost){
	time.balance = 0
}

time.offset = time.zone * 60 * 1000

if(!OAuth3.isMobile){
	document.querySelector(".react .three").className = "three pc";
}

window.bingo = {}
window.sticker = {}

function Respawn(){
	var r = fields[Math.round(Math.random() * fields.length)]

	var b = window.map.biomes[`${r.x}:${r.z}`]

	return {
		x : r.x,
		y : b.y,
		z : r.z
	}
}

function nFormatter(num, digits) {
	const lookup = [
		{ value: 1, symbol: "" },
		{ value: 1e3, symbol: "k" },
		{ value: 1e6, symbol: "M" },
		{ value: 1e9, symbol: "G" },
		{ value: 1e12, symbol: "T" },
		{ value: 1e15, symbol: "P" },
		{ value: 1e18, symbol: "E" }
	];
	const regexp = /\.0+$|(?<=\.[0-9]*[1-9])0+$/;
	const item = lookup.findLast(item => num >= item.value);
	return item ? (num / item.value).toFixed(digits).replace(regexp, "").concat(item.symbol) : "0";
}


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
	var $form = document.querySelector('form[name="memepoly.com"]');

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
		x : window.current.current.position.x,
		y : window.current.current.position.y,
		z : window.current.current.position.z
	}

	var url = "https://memepoly.com";

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

window.listToBiomes = function(list, elementsPerSubArray) {
	var matrix = [], i, k;

	for (i = 0, k = -1; i < list.length; i++) {
		if (i % elementsPerSubArray === 0) {
			k++;
			matrix[k] = [];
		}

		matrix[k].push(list[i]);
	}

	var area = 100
	var index = - (area / 2)

	var biomes = []

	matrix.forEach(function(list, k){
		list.forEach(function(item, i){
			if(item){
				item.x = index + 0.5
				item.y = item.elevation * 1
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
	"#442211" : "📦",
	"#ROAD2": "#553322",
	"#553322" : "📦",
	"#ROAD3": "#664433",
	"#664433" : "📦",
	"#BRIDGE": "#686860",
	"#686860" : "📦",
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
	"#889977" : "🌾",
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
			return item.name
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
window.players.set = function(){}
window.players.self = function(){
	return  {
		follow : false,
		self : true,
		hash : window.cookies.address ? window.cookies.address : window.cookies.hash,
		emoji : "😀",
		x : window.current.current.position.x,
		y : window.current.current.position.y,
		z : window.current.current.position.z
	}
}

var startSeqs = {};
var startNum = 0;

// jQuery FN
$.fn.playSpin = function (options) {
	if (this.length) {
		if ($(this).is(':animated')) return; // Return false if this element is animating
		startSeqs['mainSeq' + (++startNum)] = {};
		$(this).attr('data-playslot', startNum);

		var total = this.length;
		var thisSeq = 0;

		// Initialize options
		if (typeof options == 'undefined') {
			options = new Object();
		}

		// Pre-define end nums
		var endNums = [];
		if (typeof options.endNum != 'undefined') {
			if ($.isArray(options.endNum)) {
				endNums = options.endNum;
			} else {
				endNums = [options.endNum];
			}
		}

		for (var i = 0; i < this.length; i++) {
			if (typeof endNums[i] == 'undefined') {
				endNums.push(0);
			}
		}

		startSeqs['mainSeq' + startNum]['totalSpinning'] = total;
		
		this.each(function () {
			options.endNum = endNums[thisSeq];
			startSeqs['mainSeq' + startNum]['subSeq' + (++thisSeq)] = {};
			startSeqs['mainSeq' + startNum]['subSeq' + thisSeq]['spinning'] = true;
			var track = {
				total: total,
				mainSeq: startNum,
				subSeq: thisSeq
			};

			new slotMachine(this, options, track)
		});
	}
};

$.fn.stopSpin = function () {
	if (this.length) {
		if (!$(this).is(':animated')) return; // Return false if this element is not animating
		if ($(this)[0].hasAttribute('data-playslot')) {
			$.each(startSeqs['mainSeq' + $(this).attr('data-playslot')], function(index, obj) {
				obj['spinning'] = false;
			});
		}
	}
};

var slotMachine = function (el, options, track) {
	var slot = this;
	slot.$el = $(el);
	window.Roll.back = slot

	slot.defaultOptions = {
		easing: 'swing',        // String: easing type for final spin
		time: 1000,             // Number: total time of spin animation
		manualStop: false,      // Boolean: spin until user manually click to stop
		useStopTime: true,     // Boolean: use stop time        
		stopTime: 0,         // Number: total time of stop aniation
		loops : 6,
		stopSeq: 'random',      // String: sequence of slot machine end animation, random, leftToRight, rightToLeft
		endNum: 0,              // Number: animation end at which number/ sequence of list
		onEnd : $.noop,         // Function: run on each element spin end, it is passed endNum
		onFinish: $.noop,       // Function: run on all element spin end, it is passed endNum
	};

	slot.spinSpeed = 0;
	slot.loopCount = 0;

	slot.init = function () {
		slot.options = $.extend({}, slot.defaultOptions, options);
		slot.setup();
		slot.startSpin();
	};

	slot.setup = function () {
		var $li = slot.$el.find('li').first();
		slot.liHeight = $li.innerHeight();
		slot.liCount = slot.$el.children().length;
		slot.listHeight = slot.liHeight * slot.liCount;
		slot.spinSpeed = slot.options.time / slot.options.loops;

		$li.clone().appendTo(slot.$el); // Clone to last row for smooth animation

		// Configure stopSeq
		if (slot.options.stopSeq == 'leftToRight') {
			if (track.subSeq != 1) {
				slot.options.manualStop = true;
			}
		} else if (slot.options.stopSeq == 'rightToLeft') {
			if (track.total != track.subSeq) {
				slot.options.manualStop = true;
			}
		}
	};

	slot.startSpin = function () {
		slot.$el
			.css('top', -slot.listHeight)
			.animate({'top': '0px'}, slot.spinSpeed, 'linear',function () {
				slot.lowerSpeed();
			});
	};

	slot.lowerSpeed = function () {
		if (slot.loopCount < slot.options.loops ||
			(slot.options.manualStop && startSeqs['mainSeq' + track.mainSeq]['subSeq' + track.subSeq]['spinning'])) {
			slot.startSpin();
		} else {
			slot.endSpin();
		}
	};


	slot.endSpin = function () {
		if (slot.options.endNum == 0) {
			slot.options.endNum = slot.randomRange(1, slot.liCount);
		}

		// Error handling if endNum is out of range
		if (slot.options.endNum < 0 || slot.options.endNum > slot.liCount) {
			slot.options.endNum = 1;
		}

		var finalPos = -((slot.liHeight * slot.options.endNum) - slot.liHeight);
		var finalTime = ((slot.spinSpeed * 1.5) * (slot.liCount)) / slot.options.endNum;
		if (slot.options.useStopTime) {
			finalTime = slot.options.stopTime;
		}

		slot.$el
			.css('top', -slot.listHeight)
			.animate({'top': finalPos}, 500, slot.options.easing, function () {
				slot.$el.find('li').last().remove(); // Remove the cloned row

				slot.endAnimation(slot.options.endNum);
				if ($.isFunction(slot.options.onEnd)) {
					slot.options.onEnd(slot.options.endNum);
				}

				// onFinish is every element is finished animation
				if (startSeqs['mainSeq' + track.mainSeq]['totalSpinning'] == 0) {
					var totalNum = '';
					$.each(startSeqs['mainSeq' + track.mainSeq], function(index, subSeqs) {
						if (typeof subSeqs == 'object') {
							totalNum += subSeqs['endNum'].toString();
						}
					});
					if ($.isFunction(slot.options.onFinish)) {
						slot.options.onFinish(totalNum);
					}
				}
			});
	}

	slot.endAnimation = function(endNum) {
		if (slot.options.stopSeq == 'leftToRight' && track.total != track.subSeq) {
			startSeqs['mainSeq' + track.mainSeq]['subSeq' + (track.subSeq + 1)]['spinning'] = false;
		} else if (slot.options.stopSeq == 'rightToLeft' && track.subSeq != 1) {
			startSeqs['mainSeq' + track.mainSeq]['subSeq' + (track.subSeq - 1)]['spinning'] = false;
		}
		startSeqs['mainSeq' + track.mainSeq]['totalSpinning']--;
		startSeqs['mainSeq' + track.mainSeq]['subSeq' + track.subSeq]['endNum'] = endNum;
	}

	slot.randomRange = function (low, high) {
		return Math.floor(Math.random() * (1 + high - low)) + low;
	};

	this.init();
};



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
		if(time.offset == -32400000){
			lang = "ko";
		}else{
			lang = "en";
		}
	}

	document.querySelector("html").setAttribute("lang",lang);

	var form_template = ""

	var flow_template = ""

	var $body = $("body")
	var $nav = $('input[id="nav"]')

	var $aside = $(".aside")
	var $status = document.querySelector(".aside .status")

	var $messages = $("messages")

	var $swap = $("#swap")
	var $pool = $("#pool ul")

	var $meme = $("#meme")

	$meme.src = `https://music.popup.link`;

	if(OAuth3.localhost){
		$meme.src = `http://localhost:3002`
	}
	
	$meme.html(`<iframe name="music.popup.link" src="${$meme.src}/"></iframe>`)

	$meme.poly = document.querySelector('iframe[name="music.popup.link"]')
	$meme.poly.onload = function(){
		if($meme.poly.ready){
			$meme.poly.ready()
		}else{
			$meme.poly.ready = true
		}

	}



	var url = new URL(window.location.href)

	var host_address = ethers.hashMessage((url.host+"/"))
		host_address = ethers.computeAddress(host_address).toLowerCase()

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

	if(window.location.hash){
		$("#nav").prop("checked",false)

		var address = window.location.hash.replace("#","0x")

		$("#intro .title .emoji").html("")
		$("#intro .title .emoji").append(blockies.create({seed: address}))

		if(host_address.indexOf(address) == -1){
			$("#intro .coptyright p").html(`<span class="address">
				<address>
					<span>${address}</span>
					<span dir="rtl">${address}</span>
				</address>
			</span>`)
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

				var url = "https://memepoly.com/withdrawal"

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
					window.Poll.ing = setInterval(window.Poll, time.balance)
				}else{
					clearInterval(window.Poll.ing)

					if(OAuth3.xhr){
						OAuth3.xhr.abort()
						delete OAuth3.xhr
					}

					var respawn = Respawn()
					
					OAuth3.fetch({
						method : "GET",
						url : url,
						body : body,
						query : {
							method : "DELETE",
							href : window.location.href,
							hash : hash,
							token : token,
							x : player.x ? player.x : respawn.x,
							y : player.y ? player.y : respawn.y,
							z : player.z ? player.z : respawn.z
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
				emojiChanged("🫥", true)

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

	window.Swap = function(){
		var player = window.players.self()

		if(player){
			var cookies = window.cookies

			if(OAuth3.xhr){
				OAuth3.xhr.abort()
				delete OAuth3.xhr
			}

			var url = "https://memepoly.com"

			if(OAuth3.localhost){
				url = "http://localhost:3001"
			}

			var body = {
				emoji : player.emoji,
				assets : []
			}

			var dice = cookies.dice * 1

			var query = {
				assets : [],
				dice : dice != 0 ? dice : 0,
				href : window.location.href,
				hash : cookies.hash,
				token : cookies.token,
				x : player.x,
				y : player.y,
				z : player.z
			}

			var $assets = $('#pool li')

			$assets.each(function(index, el){
				var $el = $(el)

				var asset = {
					emoji : $el.attr("emoji"),
					count : $el.attr("cnt"),
					type : $el.attr("type")
				}

				if(typeof_item(asset.emoji)){
					asset.address = ethers.hashMessage(asset.emoji)
					asset.address = ethers.computeAddress(asset.address).toLowerCase()

					if(asset.type == "sell"){
						asset.address = asset.address.toUpperCase()
					}

					query.assets.push(asset.address.toLowerCase())
					body.assets.push(asset.address)
				}
			})

			$swap.addClass("loading")

			$status.innerHTML = `<div class="loading">
				<strong>Loading...</strong>
			</div>`


			OAuth3.xhr = OAuth3.fetch({
				method : "POST",
				url : url,
				body : body,
				query : query
			}, window.Callback);
		}
	}

	function emojiChanged(emoji, local, bomb){
		var player = window.players.self()

		if(player){
			var _players = window.players
			var len = players.length

			var query = {
				dice : window.cookies.dice ? window.cookies.dice : 0,
				href : window.location.href,
				hash : cookies.hash,
				token : cookies.token,
				x : player.x,
				y : player.y,
				z : player.z
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

			if(bomb){
				var biome = window.map.biomes[player.x+":"+player.z]

				plant = {
					team : "#bomb",
					follow : false,
					self : false,
					hash : ethers.ZeroAddress,
					dice : 0,
					x : player.x + "",
					y : (biome ? biome.y : 0) + 0.5,
					z : player.z + "",
					emoji : "💣"
				}

				_players.push(plant)
			}

			if(emoji.length){
				delete window.emojis.message

				var body = {
					emoji : emoji
				}

				if(OAuth3.nonces){
					if(OAuth3.nonces.length){
						body.nonces = []

						for(var i = 0; i < OAuth3.nonces.length; i++){
							var nonce = OAuth3.nonces[i]

							if(nonce){
								body.nonces.push(nonce)
							}
						}

						body.nonces = JSON.stringify(body.nonces)
					}
				}
				

				var url = "https://memepoly.com"

				if(OAuth3.localhost){
					url = "http://localhost:3001"
				}

				var type = window.typeof_emoji(emoji)

				if(type == "emoji"){
					$body.attr("emoji",emoji)
					if(!local){

						if(plant){
							body.cc = "bomb"
							
							body.x = plant.x
							body.z = plant.z
						}

						OAuth3.xhr = OAuth3.fetch({
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

		window.Roll = function(biomes){
			try{
				var dice = window.cookies.dice  * 1

				if(dice > 0){
					if(typeof OAuth3.interval == "undefined"){
						var _size = 2
						var _fields = []

						var reverse = false

						biomes.forEach(function(b, i){
							if(
								(biomes.x - _size < b.x && biomes.x + _size > b.x) &&
								(biomes.z - _size < b.z && biomes.z + _size > b.z)
							){
								if(b.biome == "BEACH"){
									_fields.push(b)

									if(biomes.x == b.x && biomes.z == b.z){
										_fields.current = b
									}
								}
							}
						})

						_fields.sort(function (a, b) {
							return b.x - a.x || a.z - b.z;
						});

						if(_fields.current){
							_fields.forEach(function(b,i){
								if(_fields.current.x == b.x && _fields.current.z == b.z){
									_fields.index = i
								}
							})

							_fields.next = _fields[_fields.index+1]

							if(!_fields.next){
								_fields.next = _fields[_fields.index-1]
							}

							if(_fields.next){
								var corners_coast_left = false
								var corners_coast_right = false
								var corners_coast = 0
								var next_coast = 0

								var current_ocean = 0
								var next_ocean = 0

								var currentIdx, nextIdx = 0

								_fields.next.neighbors.forEach(function(field, i){
									if(field.ocean){
										next_ocean++
									}
									
									if(field.index == _fields.current.index){
										currentIdx = i
									}
								})



								_fields.next.corners.forEach(function(field, i){
									if(field.coast){
										next_coast++
									}
								})

								_fields.current.neighbors.forEach(function(field, i){
									if(field.ocean){
										current_ocean++
									}
									if(field.index == _fields.next.index){
										nextIdx = i
									}
								})

								if(_fields.current.corners[0].coast){
									corners_coast_left = true
								}

								if(_fields.current.corners[1].coast){
									corners_coast_right = true
								}

								_fields.current.corners.forEach(function(field, i){
									if(field.coast){
										corners_coast++
									}
								})

								if(typeof currentIdx != "undefined" || typeof nextIdx != "undefined"){
									var diff = currentIdx - nextIdx

									if(diff == 1){
										if(_fields.next.neighbors[nextIdx]){
											if(_fields.next.neighbors[nextIdx+1]){
												if(_fields.next.neighbors[nextIdx+1].ocean){
													reverse = true
												}
											}
										}

										if(_fields.current.neighbors[currentIdx]){
											if(_fields.current.neighbors[currentIdx+1]){
												if(_fields.current.neighbors[currentIdx+1].ocean){
													reverse = true
												}
											}
										}
									}else{
										var _idx = Math.sqrt(Math.pow(diff, 2))

										if(_fields.next.neighbors[_idx]){
											if(_fields.next.neighbors[_idx].coast && _fields.next.neighbors[_idx].ocean){
												reverse = true
											}else if(!_fields.next.neighbors[_idx].coast && !_fields.next.neighbors[_idx].ocean){
												reverse = true
											}else if(!_fields.next.neighbors[_idx].coast && _fields.current.neighbors[_idx].coast && !_fields.next.neighbors[_idx].ocean && !_fields.current.neighbors[_idx].ocean){
												reverse = true
											}
										}

										if(_fields.current.neighbors[_idx]){
											if((_fields.next.neighbors[_idx].coast && _fields.next.neighbors[_idx].ocean && _fields.current.neighbors[_idx].coast && _fields.current.neighbors[_idx].ocean) || (_fields.next.neighbors[_idx].coast && !_fields.next.neighbors[_idx].ocean && _fields.current.neighbors[_idx].coast && _fields.current.neighbors[_idx].ocean)){
												reverse = true

											}else{
												if(next_ocean == current_ocean){
													reverse = false
												}else if((corners_coast < 2 && _fields.length <= 3) || (corners_coast >= 2 && _fields.length > 3)){
													reverse = false
												}

												if(current_ocean >= 2 && next_ocean >= 2){
													if((corners_coast >= _fields.length || _fields.current.x > 0) && _fields.next.neighbors[_idx].coast && _fields.next.neighbors[_idx].ocean && _fields.current.neighbors[_idx].coast && !_fields.current.neighbors[_idx].ocean){
														reverse = true
													}else{
														reverse = false
													}
												}else if(corners_coast < 2 && _fields.next.neighbors[_idx].coast && _fields.next.neighbors[_idx].ocean && _fields.current.neighbors[_idx].coast && !_fields.current.neighbors[_idx].ocean){
													reverse = false
												}
												if(!_fields.next.neighbors[_idx].coast && !_fields.next.neighbors[_idx].ocean && !_fields.current.neighbors[_idx].coast && !_fields.current.neighbors[_idx].ocean){
													if(_fields.current.z < 0){
														reverse = false
													}
												}else if(_fields.next.neighbors[_idx].coast && _fields.current.neighbors[_idx].coast && !_fields.next.neighbors[_idx].ocean && !_fields.current.neighbors[_idx].ocean){
													if(corners_coast == current_ocean){
														if(corners_coast_left && corners_coast_right){
															reverse = false
														}else if(corners_coast_right || (!corners_coast_left && !corners_coast_right)){
															reverse = true
														}
													}else if(corners_coast > current_ocean){
														if(corners_coast_left && corners_coast_right){
															reverse = false
															var last = _fields.splice(_fields.length - 1, 1)
															_fields.splice(_fields.index + 1, 0, last[0])
														}
													}
													
												}else if(!_fields.next.neighbors[_idx].coast && _fields.current.neighbors[_idx].coast && !_fields.next.neighbors[_idx].ocean && !_fields.current.neighbors[_idx].ocean){
													if(corners_coast_left && corners_coast_right){
														reverse = false
													}else if(corners_coast_right || (!corners_coast_left && !corners_coast_right)){
														reverse = true
													}else{
														reverse = false
													}
												}

												if(corners_coast == current_ocean && _fields.next.neighbors[_idx].coast && _fields.next.neighbors[_idx].ocean && _fields.current.neighbors[_idx].coast && !_fields.current.neighbors[_idx].ocean){
													if(corners_coast_left && corners_coast_right){
														reverse = false
													}else if(corners_coast_right || (!corners_coast_left && !corners_coast_right)){
														reverse = true
													}else{
														reverse = false
													}
												}
											}
										}

									}
								}else{
									reverse = true
								}
							}else{
								reverse = true
							}

							_fields.forEach(function(b,i){
								if(biomes.x == b.x && biomes.z == b.z){
									_fields.index = i
								}
								
							})

							if(_fields.index == 0){
								if((_fields.next.neighbors[_idx].coast && _fields.current.neighbors[_idx].coast && !_fields.next.neighbors[_idx].ocean && !_fields.current.neighbors[_idx].ocean)){
									if(current_ocean >= 2){
										reverse = true
									}else{
										reverse = false
									}
								}else if(reverse && _fields.next.neighbors[_idx].coast && _fields.current.neighbors[_idx].coast && _fields.next.neighbors[_idx].ocean && !_fields.current.neighbors[_idx].ocean){
									reverse = false
								}

								if(corners_coast_left && corners_coast_right){
									reverse = true
								}else if(corners_coast_right || (!corners_coast_left && !corners_coast_right)){
									reverse = true
								}

								_fields.splice(_fields.index, 0, _fields.current)
								_fields.splice(0, 1)
								var last = _fields.splice(_fields.index - 1, 1)
								_fields.unshift(last[0])
							}else if(_fields.index == (_fields.length - 1)){
								if(_fields.next){
									if(!_fields.next.neighbors[_idx].coast && _fields.current.neighbors[_idx].coast && !_fields.next.neighbors[_idx].ocean && !_fields.current.neighbors[_idx].ocean){	
										reverse = true
									}

									_fields.splice(_fields.index - 1, 0, _fields.current)
									_fields.splice((_fields.length - 1), 1)
								}else{
									_fields.splice(_fields.index - 2, 0, _fields.current)
									_fields.splice((_fields.length - 2), 1)
								}

							}else if(reverse){
								try{
									if(corners_coast < next_coast && _fields.next.neighbors[_idx].coast && !_fields.next.neighbors[_idx].ocean && _fields.current.neighbors[_idx].coast && _fields.current.neighbors[_idx].ocean){
										var last = _fields.splice(_fields.index - 1, 1)
										_fields.splice(_fields.index + 1, 0, last[0])
									}
								}catch(err){

								}
							}
						}

						if(reverse){
							_fields = _fields.reverse()	
						}

						_fields.forEach(function(b,i){
							if(biomes.x == b.x && biomes.z == b.z){
								_fields.index = i
							}
						})

						if(typeof _fields.index != "undefined"){
							var field = _fields[_fields.index+1]

							if(!field){
								var field = _fields[_fields.index]

								if(_fields.index == 0){
									if(current_ocean >= 2 && (_fields.next.neighbors[_idx].coast && _fields.current.neighbors[_idx].coast && !_fields.next.neighbors[_idx].ocean && !_fields.current.neighbors[_idx].ocean)){
										reverse = true
									}
									_fields.splice(_fields.index, 0, _fields.current)
									_fields.splice(0, 1)
									var last = _fields.splice(_fields.index - 1, 1)
									_fields.splice(0, 0, last[0])
								}else if(_fields.index == (_fields.length - 1)){
									if(_fields.next){
										_fields.splice(1, 1, _fields.current)
										_fields.splice((_fields.length + 1), 1)
									}else{
										_fields.splice(_fields.index - 1, 0, _fields.current)
										_fields.splice((_fields.length - 1), 1)
									}

									_fields.forEach(function(b,i){
										if(biomes.x == b.x && biomes.z == b.z){
											_fields.index = i
										}
									})

									field = _fields[_fields.index+1]
								}
							}
							
							window.current.current.position.x = window.cursor.current.position.x = biomes.x = field.x
							window.current.current.position.y = window.cursor.current.position.y = biomes.y = field.y + 0.01
							window.current.current.position.z = window.cursor.current.position.z = biomes.z = field.z
						}

						window.cookies.dice = dice - 1
					}
				}else{
					window.Callback(window.response)
				}
			}catch(err){
				console.log("err",err);
			}
		}

		window.Callback = async function(resp){
			var url = new URL(window.location.href)

			var _dice = window.cookies.dice * 1

			var cookies = window.cookies = JSON.parse(resp.body.cookies)

			var dice = cookies.dice * 1

			if(cookies.axis){
				try{
					OAuth3.nonces = []

					if(resp.body.nonces.length){
						var _nonces = resp.body.body.nonces
							
						for(var i = 0; i < resp.body.nonces.length; i++){
							var nonce = resp.body.nonces[i]

							var skip = true

							if(_nonces){
								if(_nonces.length){
									if(_nonces.indexOf(nonce) > -1){
										continue;
									}
								}
							}

							OAuth3.nonces.push(nonce)
						}
					}

					var cc_address = ethers.hashMessage(url.href.replace(window.location.protocol+"//",""))
						cc_address = ethers.computeAddress(cc_address).toLowerCase()


					window.map.report = {}

					var seed = cc_address+""

					if(window.location.hash){
						cc_address = window.location.hash.replace("#","")

						seed = window.location.hash.replace("#","0x")
					}

					cc_address = cc_address.replace("0x","")

					var rows = JSON.stringify(resp.body.rows)
						rows = JSON.parse(rows)

					var biomes = listToBiomes(window.map.biomes, 100)

					var isDice = Math.sqrt(Math.pow(cookies.dice, 2)) > 0 && cookies.dice != -10

					var self_player

					try{
						self_player = window.players.self()
					}catch(err){
						window.response = resp
					}

					var flag_players = []

					var _players = []
						_players.cnt = 0

					var _assets = []

					var _messages = []

					var frameloop = false

					var stickers = []

					var bombs = []

					var bingo_body = ""

					var score_board = []

					var size = 4

					var isBiome = false

					var canvas = blockies.create({seed: seed.toLowerCase()})

					var self = false

					var diff = false

					var meme = {
						poly : "",
						play : ""
					}

					var player_hash = cookies.address ? cookies.address : cookies.hash

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

					var _axis = cookies.axis
						_axis = _axis.split(",")
	
					var b = window.map.biomes[`${_axis[0]}:${_axis[2]}`]

					var axis = {
						x : _axis[0] * 1,
						y : b.y,
						z : _axis[2] * 1
					}
				
					var b = window.map.biomes[`${axis.x}:${axis.z}`]

					if(window.current){
						if(window.current.current.position.x == 0.5 && window.current.current.position.z == 0.5){
							biomes.x = window.current.current.position.x = window.cursor.current.position.x = axis.x
							biomes.z = window.current.current.position.z = window.cursor.current.position.z = axis.z
						}else{
							biomes.x = axis.x = window.current.current.position.x
							biomes.z = axis.z = window.current.current.position.z
						}
					}else{
						biomes.x = axis.x
						biomes.z = axis.z
					}

					// var $assets = $('#pool li')
					var $assets = $('.emoji_asset.on')

					var uri = new URL(url.href)

					var balanceAddress = ethers.computeAddress(ethers.hashMessage(uri.host)).toLowerCase()
				
					var assets = []

					$swap.removeClass("loading")

					if($assets.length){
						var after_body = ""

						$assets.each(function(index, el){
							var $el = $(el)
										
							var asset = {
								emoji : $el.attr("emoji"),
								count : $el.attr("cnt"),
								type : $el.attr("type")
							}

							if(typeof_item(asset.emoji)){
								asset.address = ethers.hashMessage(asset.emoji)
								asset.address = ethers.computeAddress(asset.address).toLowerCase()

								var amm = cookies[asset.address]
								
								asset.balance = amm.x - amm.y

								var type = ""

								var $asset = $(`#${asset.address}`)

								if($asset.length){
									type = $asset.attr("type")
								}

								after_body += `<li class="item" type="${type}" cnt="${asset.count}" emoji="${asset.emoji}" id="${asset.address}">
									<div class="asset">
										<div class="col x buy">
											<div class="icon">
												<div class="emoji color">${asset.emoji}</div>
											</div>
											<div class="amount">
												<span>${asset.count}</span>
											</div>
										</div>
									</div>
									<div class="asset">
										<div class="col y sell transaction">
											<div class="icon">
												<div class="emoji color">🪙</div>
											</div>
											<div class="amount">
												<span>${asset.balance}</span>
											</div>
										</div>
									</div>
								</li>`

								assets.push(asset)	
							}
						})

						var $before = $($pool.html())
							$before.find(".item").removeAttr("type")

						var before_body = $before.html()

						if(before_body){
							before_body = before_body.replace(/\t/gi,"").replace(/\n/gi,"").trim()
						}

						after_body = after_body.replace(/\t/gi,"").replace(/\n/gi,"").trim()

						if(before_body != after_body){
							$pool.html(after_body)
						}
					}else{
						$pool.html("")
						$("#swap .submit input").val("")
					}

					$(".voronoi .map").css({top : - ((biomes.z * 2) + 100) , left : - ((biomes.x * 2) + 0) })
					$(".xyz").text(`${biomes.x} : ${biomes.z}`)
					
					var progress = []

					if(rows.length){
						for(var r = 0; r < rows.length; r++){
							var row = rows[r];

							try{
								var hashtag = getHashtag(row.Cc)

								var position = row.Cc.split(` ${hashtag}`)[0]
									position = JSON.parse(`[${position}]`)

								row.x = position[0]
								row.z = position[1]
								row.dice = position[2]

								var _nonce = row.Cc.split(` ${hashtag}`)[1]
									_nonce = _nonce.split("@")[0].trim()

								var biome 

								if(window.Biomes[hashtag]){
									biome = window.map.biomes[row.x+":"+row.z]
								}

								if(row.Cc.indexOf("#dice") > -1 && isDice){
									progress[`${row.x}:${row.z}`] = true

									progress.push(row)

									progress.nonce = _nonce

									if(OAuth3.nonces.indexOf(_nonce) == -1){
										OAuth3.nonces.push(_nonce)
									}
								}

								if(row.Cc.indexOf("#report") > -1){
									if(!window.map.report[row.To]){
										window.map.report[row.To] = []
									}

									window.map.report[row.To].push(row)

								}
							}catch(err){
								// console.log('err',err);
							}
						}
					}

					var fields = Fields()

					fields.forEach(function(field, index){
						if(index % 9 == 0){
							field.drop = "❓"
						}else if(index % 3 == 0){
							field.item = "❔"
						}

						field.index = index

						fields[`${field.x}:${field.z}`] = field
					})

					if(isDice){
						if(progress.length){
							progress.before = progress[1]
							progress.start = progress[progress.length - 1]
							progress.end = progress[0]

							var div = fields[`${progress.start.x}:${progress.start.z}`]

							if(div){
								var _fields = fields.splice(div.index, fields.length)

								if(_fields.length){
									fields = _fields.concat(fields)

									var start
									var end

									fields.forEach(function(field, index){
										if(progress.start.x == field.x && progress.start.z == field.z){
											start = true
										}

										if(biomes.x == field.x && biomes.z == field.z){
											end = true
										}

										if(start && !end){
											progress[`${field.x}:${field.z}`] = true
										}
									})

									if(progress.before){
										if(progress.before.index > progress.end.index){
											fields.forEach(function(field, index){
												delete fields[`${field.x}:${field.z}`]
											})
										}
									}
								}
							}
						}
					}

					biomes.forEach(function(b, i){
						if(
							(biomes.x - size < b.x && biomes.x + size > b.x) &&
							(biomes.z - size < b.z && biomes.z + size > b.z)
						){
							var color = window.Biomes["#"+b.biome]

							var _id = crc32(cc_address+"#"+b.biome+b.x+b.z).toString(32).toUpperCase()

							if(window.map.biomes[_id]){
								isBiome = true
							}

							if(progress[`${b.x}:${b.z}`]){
								color = "black"
							}

							biomes[b.x+":"+b.z] = b

							_assets.push({
								id : _id,
								hash : cc_address,
								name : "#"+b.biome,
								value : color,
								color: color,
								x : b.x,
								y : b.y - (b.water ? 0.8 : 0.5),
								z : b.z
							})
						}
					})


					if(cookies.subscription){
						$('.emoji_asset[method="notify"]').addClass("on")
					}else{
						$('.emoji_asset[method="notify"]').removeClass("on")
					}

					
					var flags = resp.body.flags ? resp.body.flags : []
					flags.temp = 0

					flags[player_hash] = 0
					flags['#red'] = 0
					flags['#blue'] = 0
					flags['#black'] = 0


					var _balance = $balance.text()

					$balance
						.removeClass("on")
						.text(cookies.balance)
					
					if(_balance){
						if(_balance != cookies.balance){
							$balance.addClass("on")
						}
					}

					
		
					if(rows.length){
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

							row.x = position[0]
							row.z = position[1]
							row.dice = position[2] * 1

							var biome = biomes[row.x+":"+row.z]

							var isRender = biomes[row.x+":"+row.z]

							try{
								var _nonce = row.Cc.split(` ${hashtag}`)[1]
									_nonce = _nonce.split("@")[0].trim()

								if(progress.nonce != _nonce && _nonce.indexOf(cc_address) == -1 && ((!row.Flag && window.Biomes[hashtag]) || row.Flag && !window.Biomes[hashtag]) ){
									var _index = OAuth3.nonces.indexOf(_nonce)

									if(_index > -1){
										OAuth3.nonces.splice(_index, 1)
									}
								}
							}catch(err){

							}

							if(window.Biomes[hashtag] && isRender){
								if(row.Flag && hashtag != "#dice"){
									delete window.map.biomes[row.Id]
									
									var $clipped = $(`.clipped .emoji[x="${row.x}"][z="${row.z}"]`)

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
										x : row.x,
										y : biome.y,
										z : row.y
									}

									if(window.map.nonces[row.Id]){
										delete window.map.nonces[row.Id]
									}

									window.map.biomes[row.Id] = _asset
								}
							}else if(row.Subject == "#position"){
								var player = {
									follow : false	
								}

								var typeof_emoji = window.typeof_emoji(emoji)


								if(row.Flag){
									if(isRender){
										var $clipped = $(`.clipped .emoji[x="${row.x}"][z="${row.z}"]`)

										if($clipped.length && !window.bingo[row.Id]){
											window.bingo[row.Id] = true
											bingo_body += $clipped.closest('[style*="transform-origin"]')[0].outerHTML
										}
									}
								}else if(row.From){
									var _from = row.From

									var _nonce = row.Cc.split(` ${hashtag}`)[1]
										_nonce = _nonce.split("@")[0].trim()

									if(_nonce.indexOf(cc_address) == -1){
										_from = _nonce
									}

									if(typeof_emoji && (cookies.address == _from || cookies.hash == _from)){
										self = true

										player.self = true

										if(cookies.address){
											if(cookies.hash == _from){
												continue
											}
										}

										if(!self_player){
											self_player = {
												team : cookies.team ? cookies.team : "",
												follow : false,
												self : true,
												hash : cookies.address ? cookies.address : cookies.hash,
												emoji : "😀",
												x : row.x,
												y : (biome ? biome.y : 0) + 0.5,
												z : row.z
											}
										}

										player.x = self_player.x
										player.y = (biome ? biome.y : 0) + 0.5
										player.z = self_player.z
										player.emoji = window.emojis.self
									}else{
										if(!typeof_emoji && window.map.biomes[row.Id]){
											delete window.map.biomes[row.Id]
										}

										player.x = row.x
										player.y = (biome ? biome.y : 0) + 0.5
										player.z = row.z
										player.emoji = emoji
									}

									if(!row.Flag){
										if(!window.map.report[_from] && (isRender || player.self)){
											if(!rows[_from]){
												rows[_from] = true

												_players.push({
													team : hashtag,
													follow : player.follow,
													self : player.self,
													hash : _from,
													dice : row.dice,
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
												emoji : player.emoji,
												dice : row.dice
											}
										}

										if(typeof_emoji){
											flag_players.push({
												team : hashtag,
												follow : player.follow,
												self : player.self,
												hash : _from,
												dice : row.dice,
												x : player.x,
												y : player.y,
												z : player.z,
												emoji : player.emoji
											})
										}
									}
								}
							}else if(row.Cc.indexOf("#message") > -1){
								_messages.push(row)


							}else if(row.Cc.indexOf("#bomb") > -1 || row.Subject == "#bomb"){
								if(row.From.indexOf(player_hash) > -1 && !row.Flag){
									plant = false
								}

								
								bombs.push(row)	

								if(ethers.isAddress(row.Flag)){
									if(row.To == player_hash){
										var provider = ""

										if(hashtag != "#bomb"){
											if(isNaN(hashtag)){
												provider = "youtube"
											}else{
												provider = "tiktok"
											}
										}

										if(provider){
											meme.id = row.Id
											meme.provider = provider
											meme.poly = hashtag.replace("#","")
										}
									}

									if(row.Subject == "#bomb"){
										var $clipped = $(`.clipped .emoji[x="${row.x}"][z="${row.z}"]`)

										if($clipped.length && !window.bingo[row.Id]){
											window.bingo[row.Id] = true
											bingo_body += $clipped.closest('[style*="transform-origin"]')[0].outerHTML
										}
									}

									delete window.map.biomes[`${row.x}:${row.z}`].bomb
								}else if(!row.Flag && isRender){
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
										dice : 0,
										x : row.x,
										y : (biome ? biome.y : 0) + 0.5,
										z : row.z,
										emoji : "💣"
									}

									_players.push(player)
								}
							}else if(row.Cc.indexOf("#asset") > -1){
								var emoji = row.Cc.split("@")[1]

								if(row.Flag){
									if(window[row.Flag]){
										window[row.Flag].emoji = ""

										var $clipped = $(`.clipped .emoji[x="${row.x}"][z="${row.z}"]`)

										if($clipped.length && !window.bingo[row.Id]){
											window.bingo[row.Id] = true
											bingo_body += $clipped.closest('[style*="transform-origin"]')[0].outerHTML
										}
									}
								}else if(row.To == player_hash){
									if(!stickers[emoji]){
										stickers[emoji] = []
									}

									row.Emoji = emoji

									row.index = stickers[emoji].length

									if(row.dice == 0){
										row.color = true
									}

									stickers.push(row)
									stickers[emoji].push(row)
								}
							}	
						}
					}

					if(plant){
						_players.push(plant)
					}

					if(self_player){
						var x = self_player.x
						var z = self_player.z

						var biome = window.map.biomes[x+":"+z]

						if(biome){
							$body.attr("biome", biome.biome)

							var field = fields[`${x}:${z}`]

							if(field){
								$body.attr("field", (field.item || field.drop) ? (field.item || field.drop) : "")	
							}else{
								$body.attr("field", "")
							}

							var type = window.typeof_emoji(self_player.emoji)

							if(type == "emoji"){
								$body.attr("emoji",self_player.emoji)
							}
						}

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
										var _date = new Date(new Date() - time.offset)
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

											window.map.nonces[_id] = _row
										}
									}
								}
							})
						}
					}

					try{
						if(window.players){
							if(!window.players.length){
								document.querySelector('.map .canvas').src = document.querySelector('.map canvas').toDataURL()
							}

							if(JSON.stringify(window.players) != JSON.stringify(_players)){
								diff = true

								window.players.set(_players)
							}
						}

						if(window.assets){
							if(JSON.stringify(window.assets) != JSON.stringify(_assets)){
								diff = true
								window.assets.set(_assets)
							}
						}

						if(diff || frameloop){
							window.setFrameloop("always")
						}else{
							if(window.current.current.position.x == window.cursor.current.position.x && window.current.current.position.z == window.cursor.current.position.z && window[self_player.hash].position.x == window.current.current.position.x && window[self_player.hash].position.z == window.current.current.position.z){
								window.setFrameloop("demand")
							}else{
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
									body += `<clipped style="clip: rect(${y}px, ${(z+width)}px, ${(y+height)}px, ${z}px)"></clipped>`

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

								var $self = $(this);

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
									
									$self.css({'bottom' : (ny)+'px', 'left' : (nx)+'px'});
									
									t = t + 0.5;
									
									if(t > totalt) {
										$self.closest('[style*="transform-origin"]').remove()
										clearInterval(z);
									}
								},50);
							});

						}

						var li = ''

						var afterSticker = []
						
						if(stickers.length){
							for(var i = 0; i < stickers.length; i++){
								var row = stickers[i]
								var emoji = row.Emoji
		
								var cnt = stickers[emoji].length
								var len = cnt - 1

								var _el = $('[id="'+row.Id+'"]')

								if(!window.sticker[row.Id]){
									window.sticker[row.Id] = true
									stickers[len].new = true
								}

								var isToggle = false

								if(_el.length){
									isToggle = _el.hasClass("on")
								}

								if(len == row.index){
									if(row.new){
										afterSticker.push(row)
									}
									li += `<div id="${row.Id}" draggable="false" class="emoji_asset ${(isToggle ? "on" : "")} ${(row.new ? "new" : "")}" emoji="${emoji}" cnt="${cnt}" type="item"><a class="emoji ${row.color ? "color" : ""}">${emoji}</a><span class="cnt">${cnt}</span></div>`	
								}
							}
						}

						$('[id="'+player_hash+'"] items ul').html(li)

						$("emojis .items").html(li)

						var $player = $('player[self="true"]')

						if(afterSticker.length && $player.length){
							var beforeOffset = $player.offset()

							var $size = $player.find('img[alt="player"]')

							var w = $size.width()
							var h = $size.height()

							try{
								for(var i = 0; i < afterSticker.length; i++){
									setTimeout(function(row){
										var $sticker = $('[id="'+row.Id+'"]')

										if($sticker.length){
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
										}
									}, 100*i, afterSticker[i])
								}
							}catch(err){

							}							
						}

					}catch(err){
						console.log("err",err);
					}

					var after_body = ""
					flags.forEach(function(flag){
						var hashtag = getHashtag(flag.Cc)

						try{
							var position = flag.Cc.split(` ${hashtag}`)[0]
								position = JSON.parse(`[${position}]`)

							var color = hashtag.replace("#","")

							var emoji = flag.Cc.split("@")[1]

							flag.x = position[0] * 1
							flag.z = position[1] * 1
							flag.dice = position[2] * 1

							flag_players.forEach(function(player, i){
								var typeof_emoji = window.typeof_emoji(player.emoji)

								if(
									((flag.x - size < player.x && flag.x + size > player.x) &&
									(flag.z - size < player.z && flag.z + size > player.z) &&
									!player.self && typeof_emoji) || (!player.self && player.team == self_player.team)
								){
									var _color = player.team.replace("#","")

									after_body += `<div style="top:${((player.z * 2))}px;left:${((player.x * 2))}px;" class="flag ${_color}"><div class="tb"><div class="tc"><i class="${_color} emoji color">${player.emoji}</i></div></div></div>`
								}
							})

							after_body += `<div style="top:${((flag.z * 2))}px;left:${((flag.x * 2))}px;" class="flag ${color}"><div class="tb"><div class="tc"><i class="${color} emoji color">${emoji}</i></div></div></div>`

							if(flag.dice == 0){
								flags[hashtag]++

								if(flag.From.indexOf(self_player.hash) > -1){
									if(flag.Cc.indexOf(self_player.team) > -1){
										flags[flag.From]++
									}
								}else{
									flags[flag.From]++
								}
							}else{
								flags.temp++
							}
						}catch(err){
							console.log("flag",flag);
						}	
					})

					var $flags = $('#map flags')
					var before_body = $flags.html()
					if(before_body){
						before_body = before_body.replace(/\t/gi,"").replace(/\n/gi,"").trim()
					}

					after_body = after_body.replace(/\t/gi,"").replace(/\n/gi,"").trim()

					if(before_body != after_body){
						$flags.html(after_body)
					}

					if(meme.poly && meme.provider){
						if(!$meme[meme.id]){
							var ready = function(){
								$meme.addClass("poly")

								$meme[meme.id] = true
								$meme.poly.contentWindow.postMessage( JSON.stringify(meme), $meme.src );

								window.onmessage = function(resp){
									if($meme.src.indexOf(resp.origin) > -1){
										window.onmessage = null
										$meme.removeClass("poly")
									}
									
								}
							}

							if(!$meme.poly.ready){
								$meme.poly.ready = ready
							}else{
								ready()
							}
						}
					}

				
					if(cookies.team){
						var _team = cookies.team.replace("#","")

						$("#flag .red .cnt").text(flags["#red"] ? flags["#red"] : 0)
						$("#flag .blue .cnt").text(flags["#blue"] ? flags["#blue"] : 0)
						$("#flag ."+_team+" .temp").text(flags.temp ? flags.temp : "")
						$("#flag ."+_team).addClass("on")
					}

					
					try{
						if(resp.body.body.cc == "dice"){
							throw true
						}

						setTimeout(function(){
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

									var hex = window.emojiUnicode("🔥")
										
									var src = `/src/fonts/emoji/animated/${hex}.webp`

									if(_player.emoji == "🔥"){
										// tooltip_body = `<li>
										// 	<a class="hashType"></a>
										// </li>
										// <li>
										// 	<a class="hashType">🏗</a>
										// </li>
										// <li>
										// 	<a class="hashType"></a>
										// </li>`
									}else if(player_hash.indexOf(_player_hash) > -1){
										tooltip_body = `<li>
											<a class="hashType Flag"><img src="${src}"><span class="cnt">${cnt}</span></a>
										</li>
										<li>
											<a class="hashType Meta emoji color">
												<i></i>
												<div id="dice" class="slot-machine">
													<div class="slotwrapper">
														<ul>
															<li>1</li>
															<li>2</li>
															<li>3</li>
															<li>4</li>
															<li>5</li>
															<li>6</li>
														</ul>
														<div class="num">${Math.ceil(Math.sqrt(Math.pow(dice, 2)))}</div>
													</div>
												</div>
											</a>
										</li>
										<li>
											<a class="hashType Balance emoji color">🪙<span class="cnt">${nFormatter(cookies.balance,1)}</span></a>
										</li>`
									}else{
										var typeDice = false

										if(_players[_player_hash]){
											typeDice = _players[_player_hash].dice
										}

										tooltip_body = `<li>
											<a class="hashType Flag"><img src="${src}"><span class="cnt">${cnt}</span></a>
										</li>
										<li>
											<a class="hashType Meta emoji color">${typeDice ? `<i></i>` : ""}</a>
										</li>
										<li>
											<a class="hashType Report">Report</a>\
										</li>`
									}

									var before_body = $tooltip.html()
									if(before_body){
										before_body = before_body.replace(/\t/gi,"").replace(/\n/gi,"").trim()
									}

									var after_body = tooltip_body.replace(/\t/gi,"").replace(/\n/gi,"").trim()

									if(before_body != after_body){
										$tooltip.html(after_body)
									}
								}catch(err){
									console.log("err",err);
								}
							}
						},300)
					}catch(err){
						// console.log("Err",err);
					}

					var plyrs = []

					var $talk = $("talks."+player_hash)

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

							if(isMessage && duplication){
								var Idx

								var $items = document.createElement("items");

								onMessage = true

								var text = `<span>${row.Subject}</span>`

								var $talks = $("talks."+row.From+" ul")

								if($talks.length && !resp.body.query.date){
									if(talks_selector){
										talks_selector += ", "
									}

									talks_selector += "talks."+row.From

									if(!document.querySelector(`talks ul li[id="${row.Id}"]`)){
										$talks.append(`<li class="item" id="${row.Id}">
											<div class="text">
												<span class="icon" data-from="${row.From}"></span>
												${text}
											</div>
										</li>`)
									}
								}

								message_body += `<li id="${row.Id}" class="self item message">
									<div class="text">
										<span class="icon" data-from="${row.From}"></span>
										<text>${text}</text>
									</div>
								</li>`

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
							(typeof window.Poll.ing == "undefined") || 
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

					if(cookies.damage){
						$body.attr('game',"over")
					}else{
						$body.removeAttr('game')
					}

					var $loading = $('messages ul li.loading, messages ul li[id=""], talks ul li[id=""]')
					
					if($loading.length){
						$loading.remove()
					}

					if(typeof OAuth3.timeout != "undefined"){
						delete OAuth3.timeout
					}else{
						OAuth3.timeout = setTimeout(function(){
							if(!$aside.hasClass("on")){
								$messages.removeClass("on")
								$("talks").removeClass("on")
							}
						},3000)
					}

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

					// var dice = 1

					if(!isNaN(_dice)){
						if(!_dice){
							_dice = dice

							if(Math.ceil(dice) > 0){
								dice = Math.ceil(dice)
							}
						}else if(Math.sqrt(Math.pow(dice, 2)) == Math.sqrt(Math.pow(_dice, 2))){
							dice = Math.ceil(Math.sqrt(Math.pow(dice, 2))) * -1
						}else{
							dice = Math.ceil(Math.sqrt(Math.pow(dice, 2)))
						}
					}

					$body
						.removeAttr("bingo")
						.attr("dice",dice)
						.attr("team",cookies.team ? cookies.team : "")
						.attr("balance",cookies.balance)
				

					if(typeof window.Chat == "undefined"){
						window.Init(cookies)
						window.cookies.dice = 0
					}

					if(window.Poll.ing){
						if(OAuth3.xhr){
							OAuth3.xhr.abort()
							delete OAuth3.xhr

							window.response = resp
						}
					}

					if(typeof window.Poll.ing == "undefined"){
						if(cookies.hash){
							clearInterval(window.Roll.ing)
							delete window.Roll.ing

							window.Poll.ing = setInterval(window.Poll, time.balance)
						}else{
							window.location.href = OAuth3.host+"/logout"
						}
					}else if(dice > 0 && typeof window.Roll.ing == "undefined"){
						window.response = resp

						clearInterval(window.Poll.ing)
						delete window.Poll.ing

						window.response = resp

						if(window.Roll.back){
							window.Roll.back.options.endNum = dice
							window.Roll.back.loopCount = 6
						}

						setTimeout(function(){
							$('#root player tooltip .slotwrapper ul').removeAttr("style")
							$('#root player tooltip #dice .num').text(dice)

							window.Roll.ing = setInterval(window.Roll, 500, biomes)
						}, 500)
					}
				}catch(err){
					console.log("err",err);
				}
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

			var query = {
				href : window.location.href,
				hash : cookies.hash,
				token : cookies.token
			}

			var url = "https://memepoly.com";

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
						emojiChanged("🫥", true)

						var respawn = Respawn()

						var query = {
							href : window.location.href,
							hash : hash,
							token : token,
							x : player.x ? player.x : respawn.x,
							y : player.y ? player.y : respawn.y,
							z : player.z ? player.z : respawn.z
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
					var self_player = window.players.self()

					var cookies = window.cookies

					if(typeof self_player != "undefined"){
						if(cookies.hash && !OAuth3.xhr){
							var url = "https://memepoly.com"

							if(OAuth3.localhost){
								url = "http://localhost:3001"
							}

							var body = {
								emoji : window.emojis.message ? window.emojis.message : self_player.emoji
							}

							var dice = cookies.dice * 1

							var assets = []

							var $assets = $('.emoji_asset.on')

							$assets.each(function(index, el){
								var asset = {
									emoji : $(el).attr("emoji"),
									count : $(el).attr("cnt")
								}

								if(typeof_item(asset.emoji)){
									asset.address = ethers.hashMessage(asset.emoji)
									asset.address = ethers.computeAddress(asset.address).toLowerCase()

									assets.push(asset.address)
								}
							})

							var query = {
								dice : dice != 0 ? dice : 0,
								href : window.location.href,
								hash : cookies.hash,
								token : cookies.token,
								x : self_player.x,
								y : self_player.y,
								z : self_player.z
							}

							if(assets.length){
								query.assets = assets
							}

							if(OAuth3.nonces){
								if(OAuth3.nonces.length){
									body.nonces = []

									for(var i = 0; i < OAuth3.nonces.length; i++){
										var nonce = OAuth3.nonces[i]

										if(nonce){
											body.nonces.push(nonce)	
										}
									}

									body.nonces = JSON.stringify(body.nonces)
								}
							}

							if(window.Poll.date){
								query.date = window.Poll.date+""
								delete window.Poll.date
							}

							if(plant){
								body.cc = "bomb"
								
								body.x = plant.x
								body.z = plant.z
							}

							if(Object.keys(window.map.nonces).length){
								var rows = []

								for(var row in window.map.nonces){
									if(window.map.nonces.hasOwnProperty(row)) {
										if(!window.map.nonces[row].nonce && !window.map.biomes[row.Id]){
											rows.push(window.map.nonces[row])
										}
									}
								}

								if(rows.length){
									body.rows = rows
								}
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

					if(OAuth3.xhr){
						OAuth3.xhr.abort()
						delete OAuth3.xhr
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

				tutorial_body += `<option ${(i == len-1 ? "" : "disabled")} value="${value}">${value}</option>`

			}

			$('form[name="Tutorial"] .index select').html(tutorial_body)


			document.querySelector("#header nav").innerHTML = `<ul class="gnb">
				<li>
					<a href="/#${player_hash.replace("0x", "")}">
						<span class="address">
							<address>
								<span>#${player_hash.replace("0x", "")}</span>
								<span dir="rtl">${player_hash}</span>
							</address>
						</span>
					</a>
				</li>
				${(cookies.address ? `<li><a class="feedback">Feedback</a></li><li><a href="${OAuth3.host}/logout">Logout</a></li>` : '<li><a href="/login/">Login</a></li>')}
			</ul>`;

			var icon = blockies.create({seed: player_hash.indexOf("0x") > -1 ? player_hash : "0x"+player_hash});

			document.querySelector('#header label[for="nav"]').appendChild(icon);

			window.addEventListener('focus', function(){
				if(window.current.current.position.x == 0.5 && window.current.current.position.z == 0.5){
					window.setFrameloop("demand")
				}else{
					window.setFrameloop("always")
				}
			})

			window.addEventListener('blur', function(){
				window.setFrameloop("demand")
			})

			$body.on({
				click : async function(e){
					var $this = $(e.target)

					var cookies = window.cookies

					try{
						if($this.hasClass("continue")){
							if(cookies.team){
								if(cookies.pathname){
									if(cookies.pathname == window.location.pathname){
										$body.attr("mode", "third")
									}else{

									}	
								}else{
									$body.attr("mode", "third")
								}
							}else{
								var url = "https://memepoly.com/";

								if(OAuth3.localhost){
									url = "http://localhost:3001/"
								}

								if(time.out){
									clearTimeout(time.out)
									delete time.out
								}

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
									body : {
										cc : "start"
									},
									url : url
								}, function(resp){
									OAuth3.nonces = []

									if(resp.body.nonces.length){
										var _nonces = resp.body.body.nonces

											
										for(var i = 0; i < resp.body.nonces.length; i++){
											var nonce = resp.body.nonces[i]

											var skip = true

											if(_nonces){
												if(_nonces.length){
													if(_nonces.indexOf(nonce) > -1){
														continue;
													}
												}
											}

											OAuth3.nonces.push(nonce)
										}

										if(OAuth3.nonces){
											var body = {}

											if(OAuth3.nonces.length){
												body.nonces = []

												for(var i = 0; i < OAuth3.nonces.length; i++){
													var nonce = OAuth3.nonces[i]

													if(nonce){
														body.nonces.push(nonce)
													}
												}

												body.nonces = JSON.stringify(body.nonces)
											}

											OAuth3.xhr = OAuth3.fetch({
												method : "POST",
												query : {
													href : window.location.href,
													hash : cookies.hash,
													token : cookies.token
												},
												body : body,
												url : url
											}, function(_resp){
												window.cookies = JSON.parse(_resp.body.cookies)

												$body.attr("team",cookies.team ? cookies.team : "")

												window.Callback(_resp)
											})
										}

									}
								})

								return
							}
						}

						if($this.hasClass("voronoi")){
							if($this.hasClass("zoom")){
								$this.removeClass("zoom")
							}else{
								$this.addClass("zoom")
							}

							return
						}

						if($this.hasClass("buy") || $this.hasClass("sell")){
							var $item =  $this.closest(".item")
							var type = $item.attr("type") ? $item.attr("type") : ""
							
							var total = 0

							if($this.hasClass("buy")){
								if(type == "buy"){
									type = ""
								}else{
									type = "buy"
								}								
							}

							if($this.hasClass("sell")){
								if(type == "sell"){
									type = ""
								}else{
									type = "sell"
								}
							}

							$body.attr("swap", type)
							$item.attr("type", type)

							var $assets = $('#pool li')

							if($assets.length){
								var after_body = ""

								$assets.each(function(index, el){
									var $el = $(el)
									
									var asset = {
										emoji : $el.attr("emoji"),
										count : $el.attr("cnt"),
										type : $el.attr("type")
									}

									asset.address = ethers.hashMessage(asset.emoji)
									asset.address = ethers.computeAddress(asset.address).toLowerCase()


									var amm = cookies[asset.address]

									if(amm){
										asset.balance = amm.x - amm.y

										if(asset.type == "sell"){
											total += asset.balance
										}else if(asset.type == "buy"){
											total -= asset.balance
										}
									}
								})
							}

							var _total = Math.sqrt(Math.pow(total, 2))

							$("#swap .submit input").val(cookies.balance + ( total >= 0 ? ` + ${_total}` : ` - ${_total}` ) + ` = ${cookies.balance + total}` )

							
							
							return
						}

						if(window.players){
							if(window.players.length){
								if(cookies.hash){
									var player

									try{
										player = window.players.self()
									}catch(err){
										var axis = cookies.axis

										if(axis){
											axis = axis.split(",")

											player = {
												team : cookies.team ? cookies.team : "",
												follow : false,
												self : true,
												hash : cookies.address ? cookies.address : cookies.hash,
												emoji : "😀",
												x : axis[0] * 1,
												y : axis[1] * 1,
												z : axis[2] * 1
											}
										}
									}

									var $player = $('player[id="'+player.hash+'"][alt="player"]')

									var url = "https://memepoly.com";

									if(OAuth3.localhost){
										url = "http://localhost:3001"
									}

									if($this.hasClass("chat_message")){
										$aside.addClass("focus")
									}else{
										$aside.removeClass("focus")
									}

									if($this.hasClass("skip")){
										localStorage.tutorial = "complete"
										if(isNaN(localStorage.tutorial)){
											document.forms.Tutorial.index.value = ""
											$body.removeAttr("tutorial")
											$body.removeAttr("step")
											$(".layer, .layer form.popup").removeClass("on")

											if(window.location.href == window.response.body.query.href){
												window.Callback(window.response)
											}else{
												delete window.response
											}
											window.Poll.ing = setInterval(window.Poll, time.balance)
										}else{
											window.location.href = "/"
										}
									}

									if($this.closest("#header").length){
										var href = $this[0].href

										if(href){
											if(href.indexOf("/logout") > -1){
												e.preventDefault()
												
												clearInterval(window.Poll.ing)

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
										}else if(typeof $body.attr("swap") != "undefined"){
											$body.removeAttr("swap")
											$pool.html("")
											$("#swap .submit input").val("")
											$('.emoji_asset').removeClass("on")
											
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

										var isBomb = false

										try{
											var body = {
												emoji : window.emojis.self
											}

											var dice = cookies.dice * 1

											var query = {
												dice : dice != 0 ? dice : 0,
												href : window.location.href,
												hash : cookies.hash,
												token : cookies.token,
												x : player.x,
												y : player.y,
												z : player.z
											}

											if(OAuth3.nonces){
												if(OAuth3.nonces.length){
													body.nonces = []

													for(var i = 0; i < OAuth3.nonces.length; i++){
														var nonce = OAuth3.nonces[i]

														if(nonce){
															body.nonces.push(nonce)
														}
													}

													body.nonces = JSON.stringify(body.nonces)
												}
											}

											var b = window.map.biomes[player.x+":"+player.z]

											var $player = $('player[id="'+player.hash+'"][alt="player"]')

											var $$player = $this.closest("player")

											var player_hash = $$player.attr("id")

											var cc_address = ethers.hashMessage(window.location.href.replace(window.location.protocol+"//",""))
												cc_address = ethers.computeAddress(cc_address).toLowerCase()

											if(window.location.hash){
												cc_address = window.location.hash.replace("#", "0x")
											}

											if($this.hasClass("Meta")){
												window.cookies.dice = 0
												
												body.cc = "bomb"

												if(window.Biomes[`#${b.biome}`]){
													if(b.biome == "BEACH"){
														query.dice = 10
														body.cc = "dice"
													}else{
														isBomb = true

														if(plant){
															return
														}
													}
												}
											

												$body.attr(body.cc,query.dice)

												$('#dice ul').playSpin();

											}else if($this.hasClass("Flag")){
												body.cc = "flag"

											}else if($this.hasClass("Balance")){


												return

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
											}
										}catch(err){
											console.log("err",err);
										}

										var id = cookies.hash+"["+player.x+","+player.z+"]"

										var _assets = window.assets;

										var diff = false

										if(body.cc == "flag"){
											diff = true

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

										emojiChanged("🫥", true, isBomb)

										if(diff){
											window.assets.set(_assets)
										}

										if(time.out){
											clearTimeout(time.out)
											delete time.out
										}

										if(OAuth3.xhr){
											OAuth3.xhr.abort()
											delete OAuth3.xhr
										}

										OAuth3.xhr = true

										time.out = setTimeout(function(){
											if(window.tutorial){
												setTimeout(function(){
													var res = JSON.stringify(window.response)
														res = JSON.parse(res)

													res.body.query = query
													res.body.body = body
													
													window.Callback(res)
												},1500)
											}else{
												OAuth3.xhr = OAuth3.fetch({
													method : "POST",
													query : query,
													body : body,
													url : url
												}, window.Callback)
											}
										}, body.cc == "dice" ? time.balance * 3 : 0)
										
									}

									if($this.hasClass("emoji_asset")){
										e.preventDefault()

										var type = $this.attr("type")
										var emoji = $this.attr("emoji")
										var method = $this.attr("method")

										var player_emoji = player.emoji + ""

										var body = {
											emoji : window.typeof_emoji(emoji) ? emoji : window.emojis.self
										}

										var $talk = $("talks")

										if(method == "search"){
											console.log("검색 진입");

											return
										}

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

											return
										}

										

										if(type == "item"){
											$('tooltip').removeClass("on")
											$body.removeAttr("tooltip")
											$this.toggleClass("on")
											
											var $assets = $('.emoji_asset.on')

											if($assets.length){
												$body.attr("swap","")

												$swap.addClass("loading")

												$status.innerHTML = `<div class="loading">
													<strong>Loading...</strong>
												</div>`
											}else{
												$body.removeAttr("swap")
												$pool.html("")
												$("#swap .submit input").val("")
												$status.innerHTML = ""
											}

											if(OAuth3.xhr){
												OAuth3.xhr.abort()
												delete OAuth3.xhr
											}
											
											return
										}else{
											$body.removeAttr("swap")
										}

										if(type == "emoji"){
											if(method){
												if(type == "emoji"){
													emoji = player_emoji
												}

												if(method == "notify"){
													$status.innerHTML = `<div class="loading">
														<strong>Loading...</strong>
													</div>`


													if(document.querySelector("notify")){
														document.querySelector("notify").remove()
													}

													$('notify input[type="checkbox"]').prop("checked",false)

													try{
														var host = window.location.host

														if(OAuth3.localhost){
															host = OAuth3.localhost
														}

														var url = "https://memepoly.com/";

														if(OAuth3.localhost){
															url = "http://localhost:3001/"
														}

														var href = window.location.href

														var referer = new URL(href)

														var respawn = Respawn()

														var request = {
															method : "POST",
															url : url,
															body : {
																cc : "vapid"
															},
															query : {
																host : referer.host,
																href : href,
																hash : cookies.hash,
																token : cookies.token,
																x : player.x ? player.x : respawn.x,
																y : player.y ? player.y : respawn.y,
																z : player.z ? player.z : respawn.z
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

															var _href = "https://memepoly.com/"+cookies.vapid

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

																document.querySelector("notify .tc").innerHTML = `<form name="memepoly.com" action="javascript:Subscribe()">
																	<qr>
																		<a class="qr-code"></a>
																		<label for="notify">
																			<span class="ko">알림 동의</span>
																			<span class="en">notification agree</span>
																		</label>
																	</qr>
																	<input name="vapid" type="hidden" value="'+cookies.vapid+'">
																	<div class="area">
																		<input disabled type="submit">
																	</div>
																</form>`

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

										if(emoji == "💣"){
											if(plant){
												return
											}

											emojiChanged("🫥", true, true)
											
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

											if(time.out){
												clearTimeout(time.out)
												delete time.out
											}

											if(OAuth3.xhr){
												OAuth3.xhr.abort()
												delete OAuth3.xhr
											}

											OAuth3.xhr = true

											time.out = setTimeout(function(){
												OAuth3.xhr = OAuth3.fetch({
													method : "POST",
													query : query,
													body : body,
													url : url
												}, window.Callback);
											}, time.balance)

											return

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
					var cookies = window.cookies

					var $el = $(e.target)

					var isJoystick = ($el.closest("emojis").length) == 0

					if(e.target.tagName == "SELECT"){
						isJoystick = false
					}


					if(isJoystick && cookies.axis && cookies.dice == 0){
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

							if(biome.water){
								return
							}

							// player.y = biome.y

							var edge = (1000000000000000000 / 2) + 1
							
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

				try{
					joystick.set(event)
				}catch(err){

				}
			});

			$body.on('touchstart',function(event){
				joystick.start.x = event.originalEvent.changedTouches[0].screenX;
				joystick.start.y = event.originalEvent.changedTouches[0].screenY;
			});

			$body.on('touchend',function(event){
				joystick.end.x = event.originalEvent.changedTouches[0].screenX;
				joystick.end.y = event.originalEvent.changedTouches[0].screenY;

				try{
					joystick.set(event)
				}catch(err){

				}
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

						$('messages ul').prepend(`<li class="loading">
							<div class="lds-ring">
								<div></div>
								<div></div>
								<div></div>
								<div></div>
							</div>
						</li>`)

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

				if(OAuth3.nonces){
					if(OAuth3.nonces.length){
						body.nonces = []

						for(var i = 0; i < OAuth3.nonces.length; i++){
							var nonce = OAuth3.nonces[i]

							if(nonce){
								body.nonces.push(nonce)
							}
						}

						body.nonces = JSON.stringify(body.nonces)
					}
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
						text = `<a target="_blank" href="${_url.href}">\
							<img src="${_url.protocol}//${_url.host}/favicon.ico"> Link\
						</a>`
					}
				}catch(err){
					text = `<span>${message}</span>`
				}

				if(text && !flow){
					$('messages ul').append(`<li id="" class="self item message">
						<div class="text">
							<span class="icon" data-from="${player.hash}"></span>
							<text>${text}</text>\
						</div>\
					</li>`)

					var $talk = $("talks."+player.hash)

					$talk.find('ul').append(`<li id="" class="item">\
						<div class="text">\
							<span class="icon" data-from="${player.hash}"></span>\
							<text>${text}</text>\
						</div>\
					</li>`)

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

				if(message.length){
					$status.innerHTML = `<div class="loading">
						<strong>Loading...</strong>
					</div>`

					if(body.emoji){
						window.emojis.message = body.emoji
						window.emojis.self = body.emoji
					}

					var url = "https://memepoly.com";

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

				if(type == "emoji" && icon == "💣"){
					li += '<div draggable="false" class="emoji_asset items"></div>'
				}

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
						$a = `<a class="${className}">${icon}</a>`
					}

					li += `<div draggable="false" class="emoji_asset" emoji="${icon}" type="${type}" method="${method}">${$a}</div>`
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
					
					$('messages ul, talks ul').html("")

					var address = window.location.hash.replace("#","0x")

					var player = window.players.self()

					var default_img = '' //'<img src="https://fonts.gstatic.com/s/e/notoemoji/latest/1f600/512.gif" alt="">'

					
					if(host_address.indexOf(address) == -1){
						$("#nav").prop("checked",false)

						$("#intro .title .emoji").html("")
						$("#intro .title .emoji").append(blockies.create({seed: address}))

						$("#intro .coptyright p").html(`<span class="address">
							<address>
								<span>${address}</span>
								<span dir="rtl">${address}</span>
							</address>
						</span>`)
					}else{
						$("#intro .title .emoji").html('<img src="https://fonts.gstatic.com/s/e/notoemoji/latest/1f600/512.gif" alt="">')
						$("#intro .coptyright p").html('memepoly.com')
					}

					if(OAuth3.xhr){
						OAuth3.xhr.abort()
						delete OAuth3.xhr
					}

					clearInterval(window.Poll.ing)
					window.Poll.ing = setInterval(window.Poll, time.balance)

					$status.innerHTML = `<div class="loading">
						<strong>Loading...</strong>
					</div>`

					setTimeout(function(){
						$('player[self="true"] emoji').click()

						window.speed = 0.2

						window.camera.set({})

						// window.players.set([{
						// 	follow : false,
						// 	self : true,
						// 	hash : cookies.address ? cookies.address : cookies.hash,
						// 	emoji : "😀",
						// 	x : 1.5,
						// 	y : 0.5,
						// 	z : 1.5
						// }])

						// window.assets.set([])
						// window.setFrameloop("always")

						// window[player.hash].position.x = window.current.current.position.x = window.cursor.current.position.x = 1.5
						// window[player.hash].position.z = window.current.current.position.z = window.cursor.current.position.z = 1.5

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