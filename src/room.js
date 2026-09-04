window.RoomState = {
	dialogFlow : [],
	form_template : "",
	flow_template : "",
	flows : [],
	peers : {},
	localstream : {},
	iceServers : [{ urls: "stun:stun.l.google.com:19302" }],
	hasMicrophone : false,
	hasWebcam : false,
	MediaDevices : []
}

var peers = window.RoomState.peers
var localstream = window.RoomState.localstream
var iceServers = window.RoomState.iceServers
var MediaDevices = window.RoomState.MediaDevices

var hasMicrophone = false
var hasSpeakers = false
var hasWebcam = false
var isMicrophoneAlreadyCaptured = false
var isWebcamAlreadyCaptured = false

var isHTTPs = location.protocol === 'https:'
var canEnumerate = false

if (typeof MediaStreamTrack !== 'undefined' && 'getSources' in MediaStreamTrack) {
	canEnumerate = true
} else if (navigator.mediaDevices && !!navigator.mediaDevices.enumerateDevices) {
	canEnumerate = true
}

if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
	navigator.enumerateDevices = function(callback) {
		navigator.mediaDevices.enumerateDevices().then(callback);
	};
}

function checkDeviceSupport(callback) {
	if (!canEnumerate) {
		return;
	}

	if (!navigator.enumerateDevices && window.MediaStreamTrack && window.MediaStreamTrack.getSources) {
		navigator.enumerateDevices = window.MediaStreamTrack.getSources.bind(window.MediaStreamTrack);
	}

	if (!navigator.enumerateDevices && navigator.enumerateDevices) {
		navigator.enumerateDevices = navigator.enumerateDevices.bind(navigator);
	}

	if (!navigator.enumerateDevices) {
		if (callback) {
			callback();
		}
		return;
	}

	MediaDevices = window.RoomState.MediaDevices = [];

	navigator.enumerateDevices(function(devices) {
		devices.forEach(function(_device) {
			var device = {};

			for (var d in _device) {
				device[d] = _device[d];
			}

			if (device.kind === 'audio') {
				device.kind = 'audioinput';
			}

			if (device.kind === 'video') {
				device.kind = 'videoinput';
			}

			var skip;

			MediaDevices.forEach(function(d) {
				if (d.id === device.id && d.kind === device.kind) {
					skip = true;
				}
			});

			if (skip) {
				return;
			}

			if (!device.deviceId) {
				device.deviceId = device.id;
			}

			if (!device.id) {
				device.id = device.deviceId;
			}

			if (!device.label) {
				device.label = 'Please invoke getUserMedia once.';

				if (!isHTTPs) {
					device.label = 'HTTPs is required to get label of this ' + device.kind + ' device.';
				}
			} else {
				if (device.kind === 'videoinput' && !isWebcamAlreadyCaptured) {
					isWebcamAlreadyCaptured = true;
				}
				if (device.kind === 'audioinput' && !isMicrophoneAlreadyCaptured) {
					isMicrophoneAlreadyCaptured = true;
				}
			}

			if (device.kind === 'audioinput') {
				hasMicrophone = true;
			}

			if (device.kind === 'audiooutput') {
				hasSpeakers = true;
			}

			if (device.kind === 'videoinput') {
				hasWebcam = true;
			}

			MediaDevices.push(device);
		});

		window.RoomState.hasMicrophone = hasMicrophone
		window.RoomState.hasWebcam = hasWebcam

		if (callback) {
			callback();
		}
	});
}

var localStream = function(id){
	var obj = {}

	if(Object.keys(localstream).length){
		for(var method in localstream){
			if(localstream.hasOwnProperty(method)) {
				if(typeof localstream[method].enabled != "undefined"){
					var enabled = ""

					if(localstream[method]){
						if(localstream[method].enabled){
							if(peers[id]){
								if(peers[id][method]){
									if(peers[id][method].method){
										enabled = peers[id][method].method
									}else if(peers[id][method]._method){
										enabled = peers[id][method]._method
									}
								}
							}
						}
					}

					obj[method] = {
						enabled : enabled
					}
				}
			}
		}
	}

	return obj
}

function addStream(peerId, method){
	var cookies = window.cookies

	var connection = new RTCPeerConnection({ iceServers: iceServers })

	connection.hash = peerId
	connection.method = peers[peerId].method ? peers[peerId].method : method
	connection._method = peers[peerId].method ? peers[peerId].method : method

	var _method = ""

	if(connection.method == "getDisplayMedia"){
		_method = "getUserMedia"
	}else if(connection.method == "getUserMedia"){
		_method = "getDisplayMedia"
	}

	var created

	try{
		if(peers[peerId][_method].method == method){
			created = peers[peerId][_method].track
		}
	}catch(err){

	}

	if(created){
		delete connection.method
	}

	if(peers[peerId].reverse){
		connection.reverse = peers[peerId].reverse
	}

	peers[peerId][method] = connection
	connection.root = peers[peerId]

	if(peerId.indexOf("0x") == 0){
		connection.index = peerId * 1
	}else{
		connection.index = ("0x"+peerId) * 1
	}

	var hash = ""
	var index = ""

	if(cookies.address){
		hash = cookies.address
		index = cookies.address * 1
	}else{
		hash = cookies.hash
		index = ("0x"+cookies.hash) * 1
	}

	var stream = localstream[method]

	connection.addStream(stream)

	connection.ontrack = function(event) {
		var root_connection = event.target.root
		var peerId = root_connection.hash

		if(!event.target.track){
			$("body").removeAttr("tooltip")
			$("tooltip").removeClass("on")

			event.target.track = event.streams[0]

			var _method = event.target.method

			if(peers[peerId].reverse){
				if(peers[peerId].method == "getDisplayMedia"){
					connection.method = root_connection.method = _method = "getUserMedia"
					connection.reverse ="getDisplayMedia"
				}else if(peers[peerId].method == "getUserMedia"){
					connection.method = root_connection.method = _method = "getDisplayMedia"
					connection.reverse ="getUserMedia"
				}
			}

			setStream({
				track : event.streams[0],
				hash : peerId,
				method : _method
			})
		}
	}

	connection.onicecandidate = (event) => {
		var root_connection = event.target.root

		if (event.candidate && typeof event.target.signal == "undefined") {
			var data = {
				'method' : event.target.method,
				localstream : localStream(peerId),
				'candidate': {
					'sdpMLineIndex': event.candidate.sdpMLineIndex,
					'candidate': event.candidate.candidate
				}
			}

			if(peers[peerId].reverse){
				data.reverse = peers[peerId].reverse
			}

			root_connection.channel.send(JSON.stringify(data))
		}else{
			var data = JSON.stringify(event.target.localDescription)
				data = JSON.parse(data)
				data.method = event.target.method
				data.localstream = localStream(peerId)

			if(peers[peerId].reverse){
				data.reverse = peers[peerId].reverse
			}

			root_connection.channel.send(JSON.stringify(data))
		}
	}

	var json = {method : method}

	if(!OAuth3.isMobile){
		json.tab = true
	}

	if(hasMicrophone){
		json.audio = true
	}

	if(hasWebcam){
		json.video = true
	}

	json.localstream = localStream(peerId)
	json.localstream[method] = {
		enabled : method
	}

	if(!peers[peerId].method && peers[peerId].connectionState == "connected" && peers[peerId].signalingState == "stable"){
		peers[peerId].channel.send(JSON.stringify(json))
	}

	delete peers[peerId].method
}

async function getMedia(method, video, audio){
	try{
		var player = window.players.self()

		var stream = await navigator.mediaDevices[method]({
			video: video,
			audio: audio
		})

		if(stream){
			localstream[method] = stream

			var _video = false

			if(stream.getVideoTracks().length){
				_video = true
			}

			if(_video){
				$("body").attr("media", "video")
			}else{
				$("body").attr("media", "audio")
			}

			if(Object.keys(peers).length){
				for(var peer in peers){
					if(peers.hasOwnProperty(peer)) {
						var root_connection = peers[peer]

						if(root_connection){
							if(!root_connection.oembed){
								delete root_connection.method
								delete root_connection.reverse

								var peerId = root_connection.hash

								if(peerId){
									addStream(peerId, method)
								}
							}
						}
					}
				}
			}

			setStream({
				track : stream,
				hash : player.hash,
				method : method
			})

			return true
		}
	}catch(err){

	}
}

function setStream(connection, method, self) {
	var player = window.players.self()

	if(method){
		var peerId = connection.hash
		var video = true
		var className = ""

		if(method == "getDisplayMedia"){
			className = "cast"
		}else if(method == "getUserMedia"){
			className = "videocam"
		}

		if(peerId){
			if(peers[peerId]){
				delete peers[peerId].signal
				delete peers[peerId].pendingOfferDescription
				delete peers[peerId].pendingAnswerDescription

				if(peers[peerId][method]){
					var _method = peers[peerId][method].method

					if(_method == "getDisplayMedia"){
						className = "cast"
					}else if(_method == "getUserMedia"){
						className = "videocam"
					}

					if(peers[peerId][method].track){
						if(typeof peers[peerId][method].track.getTracks != "undefined"){
							if(peers[peerId][method].track.getVideoTracks().length == 0){
								video = false
							}

							var tracks = peers[peerId][method].track.getTracks()

							for(var t = 0; t < tracks.length; t++){
								tracks[t].stop();
							}
						}
					}

					if(_method){
						$('player[id="'+peerId+'"][alt="player"] .emoji').removeClass(_method)

						if(!video){
							if(_method == "getDisplayMedia"){
								className = "cast"
							}else if(_method == "getUserMedia"){
								className = "mic"
							}
						}

						try{
							peers[peerId].channel.send(JSON.stringify({
								method : _method,
								localstream : localStream(peerId),
								signal : false
							}))
						}catch(err){

						}

						try{
							peers[peerId].localstream[_method] = {
								enabled : _method
							}
						}catch(err){

						}
					}else{
						try{
							delete peers[peerId].localstream[_method]
						}catch(err){

						}
					}

					if(peers[peerId].live != _method || peers[peerId].reverse != _method || Object.keys(localstream).length == 0){
						delete peers[peerId].live
						delete peers[peerId].method
						delete peers[peerId].reverse
					}

					try{
						peers[peerId][method].close()
						delete peers[peerId][method]

						$('[id="'+peerId+'"][alt="player"] stream.'+className).remove()
						$('[id="'+peerId+'"][alt="player"]').attr("type",video ? "video" : "image")

						if(localstream[method]){
							addStream(peerId,method)
						}
					}catch(err){

					}
				}
			}
		}

		if(self){
			$('player[id="'+player.hash+'"][alt="player"] .emoji').removeClass(method)

			if(localstream[method]){
				if(localstream[method].getVideoTracks){
					if(localstream[method].getVideoTracks().length == 0){
						video = false
					}
				}
			}

			if(!video){
				if(method == "getDisplayMedia"){
					className = "cast"
				}else if(method == "getUserMedia"){
					className = "mic"
				}
			}

			try{
				localstream[method].getTracks().forEach(track => track.stop())
			}catch(err){

			}

			delete localstream[method]

			$('[id="'+player.hash+'"][alt="player"] stream.'+className).remove()

			try{
				$('emojis .deck .emoji_asset[method="'+method+'"]').removeClass("on")

				if(!localstream['getUserMedia']){
					$('[id="'+player.hash+'"][alt="player"]').attr("type","image")
				}
			}catch(err){

			}

			try{
				if(Object.keys(peers).length){
					for(var peer in peers){
						if(peers.hasOwnProperty(peer)) {
							if(peers[peer]){
								if(!peers[peer].oembed){
									if(Object.keys(localstream).length == 0){
										delete peers[peer]['getUserMedia']
										delete peers[peer]['getDisplayMedia']

										if(peers[peer].localstream){
											peers[peer].localstream = {}
										}

										delete peers[peer].live
										delete peers[peer].method
										delete peers[peer].reverse

										$('[id="'+peer+'"][alt="player"] stream').remove()
									}
								}
							}
						}
					}
				}
			}catch(err){

			}
		}
	}else if(connection.track){
		var peerId = connection.hash

		method = connection.method
		connection.track.enabled = true

		var video = true
		var type = ""

		if(connection.track.getVideoTracks().length == 0){
			video = false
		}

		var $stream = document.createElement('stream')
		var $video = document.createElement('video')

		if('srcObject' in $video){
			$video.srcObject = connection.track
		}else{
			var windowURL = window.URL || window.webkitURL || window.mozURL || window.msURL;

			$video.src = windowURL.createObjectURL(connection.track)
		}
		
		$video.playsInline = true
		$video.addEventListener('loadedmetadata', () => {
			$video.play()
		})

		var className = ""

		if(player.hash == peerId){
			className = "self"
		}

		if(method == "getDisplayMedia"){
			type = "cast"
			className += " "+type
		}else if(method == "getUserMedia"){
			type = video ? "videocam" : "mic"
			className += " "+type
		}

		$stream.className = className

		if(type == "cast"){
			var $pip = document.createElement('a');
				$pip.className = "screen pip"
				$pip.textContent = "branding_watermark"

			var $full = document.createElement('a');
				$full.className = "screen full"
				$full.textContent = "fullscreen"

			var $close = document.createElement('a');
				$close.className = "screen close"
				$close.textContent = "close"

			var $volume = document.createElement('a');
				$volume.className = "screen volume"
				$volume.textContent = "volume_up"

			$stream.appendChild($pip)
			$stream.appendChild($full)
			$stream.appendChild($close)
			$stream.appendChild($volume)
		}

		try{
			$('[id="'+peerId+'"][alt="player"] stream.'+type).remove()
		}catch(err){

		}

		$stream.appendChild($video)

		var $target = $('[id="'+peerId+'"][alt="player"] [data-plyr-provider]');
			$target.append($stream)

		if(!$('[id="'+peerId+'"][alt="player"] .emoji').hasClass(method)){
			$('[id="'+peerId+'"][alt="player"] .emoji').addClass(method)
		}

		var $selector = $('[id="'+peerId+'"][alt="player"]')

		if(video){
			$selector.attr("type","video")
		}else{
			$selector.attr("type","image")
		}

		if(Object.keys(peers).length){
			for(var peer in peers){
				if(peers.hasOwnProperty(peer)) {
					if(peers[peer]){
						if(!peers[peer].oembed && !peers[peer].reverse){
							delete peers[peer].method

							var json = {
								method : method
							}

							if(!OAuth3.isMobile){
								json.tab = true
							}

							if(hasMicrophone){
								json.audio = true
							}

							if(hasWebcam){
								json.video = true
							}

							json.localstream = localStream(peer)
							json.localstream[method] = {enabled : method}

							if(peers[peer].connectionState == "connected" && peers[peer].signalingState == "stable"){
								peers[peer].channel.send(JSON.stringify(json))
							}
						}
					}
				}
			}
		}
	}
}

checkDeviceSupport(function() {
	if(hasMicrophone){
		window.emojis.unshift({
			method : "getUserMedia",
			icon : "mic",
			type : "emoji"
		})
	}

	if(hasWebcam){
		window.emojis.unshift({
			method : "getUserMedia",
			icon : "videocam",
			type : "emoji"
		})
	}
})

window.RoomUrl = function(){
	if(OAuth3.localhost){
		return "http://localhost:3001"
	}
	return "https://memepoly.com"
}

window.RoomRandom = function(min, max){
	return Math.floor(Math.random() * (max - min + 1)) + min
}

window.RoomTrim = function(rows, key, value){
	if(typeof key != "undefined" && typeof value != "undefined"){
		for(var r = 0; r < rows.length; r++){
			if(rows[r]){
				if(rows[r][key] == value){
					rows[r] = undefined
				}
			}
		}
	}
	return rows.filter(function( row ) {
		return row !== undefined;
	})
}
/*
	개발 Part 16 (마이룸 퍼즐)
	서버 room.js 의 puzzle 분기는 항목을 JSON 문자열로 기대한다.
	OAuth3.fetch 가 form-encoded 로 보내면
	객체는 "[object Object]" 로 뭉개져 파싱이 실패한다.
	여기서 미리 문자열로 만들어 전송 방식과 무관하게 통과시킨다.
	서버도 객체/문자열 양쪽을 받도록 고쳤으므로 이중 안전장치다.
	  입력 : [{ id, emoji, hash, x, z }, ...]
	  출력 : ['{"id":"", ...}', ...]
*/
window.RoomPuzzlePayload = function(list){
	var out = []
	if(!list || !list.length){
		return out
	}
	for(var i = 0; i < list.length; i++){
		var item = list[i]
		if(!item){
			continue
		}
		if(typeof item === "string"){
			out.push(item)
			continue
		}
		try{
			out.push(JSON.stringify(item))
		}catch(err){
		}
	}
	return out
}

window.RoomEmoji = function(emoji, local){
	var player = window.players.self()

	if(!player){
		return
	}

	var cookies = window.cookies

	var _players = window.players
	var len = _players.length

	var query = {
		href : window.location.href,
		hash : cookies.hash,
		token : cookies.token,
		x : player.x,
		z : player.z
	}

	var position = player

	try{
		position = window[player.hash].group.current.position
	}catch(err){

	}

	for(var i = 0; i < len; i++){
		if(_players[i].hash == cookies.hash || _players[i].hash == cookies.address){
			_players[i].self = true
			_players[i].emoji = emoji
			_players[i].x = position.x
			_players[i].y = position.y
			_players[i].z = position.z
		}
	}

	if(!emoji.length){
		return
	}

	delete window.emojis.message

	var body = {
		emoji : emoji
	}

	var type = window.typeof_emoji(emoji)

	if(type == "emoji"){
		if(!local){
			OAuth3.fetch({
				method : "POST",
				query : query,
				body : body,
				url : window.RoomUrl()
			}, window.Callback);
		}
	}

	var players_ = JSON.stringify(_players)

	window.players.set(JSON.parse(players_))

	$(".aside").removeClass("more")

	if(type){
		$('[id="'+player.hash+'"][alt="player"]').attr("type","image")
	}else{
		$('[id="'+player.hash+'"][alt="player"]').attr("type","text")
	}
}

window.RoomCallback = async function(resp){
	var $body = $("body")
	var $aside = $(".aside")
	var $status = document.querySelector(".aside .status")
	var $go = $("#go")
	var $nav = $('input[id="nav"]')

	var peers = window.RoomState.peers
	var localstream = window.RoomState.localstream

	var random = window.RoomRandom
	var rowsTrim = window.RoomTrim

	var $root = $('#root.fiber')
	var $balance = $("#header .balance span")

	var _host_url = new URL(window.location.href)
	var host_address = ethers.hashMessage((_host_url.host+"/"))
		host_address = ethers.computeAddress(host_address).toLowerCase()
	var url = new URL(window.location.href)
	var cookies = window.cookies = JSON.parse(resp.body.cookies)
	var cc_address = ethers.hashMessage(url.href.replace(window.location.protocol+"//",""))
		cc_address = ethers.computeAddress(cc_address).toLowerCase()
	var iceServers = window.RoomState.iceServers
	try{
		if(window.MatchVerify){ window.MatchVerify(cookies) }
	}catch(err){
		console.log("match err",err);
	}
	try{
		if(window.MapGen){ window.MapGen.apply() }
	}catch(err){
		console.log("mapgen err",err);
	}
	/*
		개발 Part 16 (미니맵)
		마이룸도 보드와 동일하게
		voronoi 타일을 2D 로 평면화한 base64 를 #map img[src] 에 넣는다.
		룸은 MapGen.target() 이 room:{owner} 키를 돌려주므로
		소유자 해시로 생성된 섬이 그려진다.
		이미 만들어져 있으면 문자열 비교 1 회로 끝난다.
	*/
	try{
		if(window.MapGen && window.MapGen.sync){
			window.MapGen.sync()
		}
		/*
			개발 Part 17 (미니맵)
			현행 마이룸은 .voronoi .map 의 위치를 한 번도 갱신하지 않았다.
			(BoardCallback 에만 css 이동이 있었다)
			인자를 생략하면 players.self() 좌표를 쓴다.
		*/
		if(window.MapFocus){
			window.MapFocus()
		}
	}catch(err){
		console.log("map thumb err", err);
	}
	/*
		개발 Part 14 (검수) - E6
		룸도 window.map.open / puzzle / item / follow / report / reward 를
		무검증으로 쓴다. 같은 방어를 적용한다.
	*/
	if(window.MapGuard){
		window.MapGuard()
	}
	try{
		if(window.FieldsSync){ window.FieldsSync() }
	}catch(err){
	}
	try{
		if(window.MapGen && window.MapGen.ready && window.current && window.fields && window.fields.length){
			var _cp = window.current.current.position
			var _cb = window.map.biomes[_cp.x + ":" + _cp.z]
			if(!_cb || _cb.water){
				var _sr, _sb
				for(var _si = 0; _si < window.fields.length; _si++){
					_sr = window.fields[Math.floor(Math.random() * window.fields.length)]
					_sb = window.map.biomes[_sr.x + ":" + _sr.z]
					if(_sb && !_sb.water){ break }
				}
				if(_sr && _sb){
					var _sh = cookies.address ? cookies.address : cookies.hash
					/*
						개발 Part 18 (스폰)
						물 위 / 좌표 미확정 상태에서 육지로 재배치하는 지점이다.
						보간으로 기어가면 룸 전체를 가로지르는 연출이 된다.
					*/
					window.Snap = 8
					window.current.current.position.x = window.cursor.current.position.x = _sr.x
					window.current.current.position.y = window.cursor.current.position.y = _sb.y + 0.01
					window.current.current.position.z = window.cursor.current.position.z = _sr.z
					if(window[_sh] && window[_sh].position){
						window[_sh].position.x = _sr.x
						window[_sh].position.y = _sb.y + 0.5
						window[_sh].position.z = _sr.z
					}
					if(window[_sh] && window[_sh].group && window[_sh].group.current){
						window[_sh].group.current.position = window[_sh].position
					}
				}
			}
		}
	}catch(err){
		console.log("room spawn err",err);
	}

	


	if(OAuth3.xhr && resp.timeStamp){
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

	try{
		if(window.players){
			if($go.referer){
				window.speed = 0.1
				delete $go.referer
				$go.removeAttr("href")
			}

			var _dissolve = window.map.dissolve ? window.map.dissolve : {}

			window.MapReset()

			window.map.dissolve = _dissolve

			var seed = cc_address+""

			if(window.location.hash){
				cc_address = window.location.hash.replace("#","")

				seed = window.location.hash.replace("#","0x")
			}

			var rows = JSON.stringify(resp.body.rows)
				rows = JSON.parse(rows)

			var self_player

			try{
				self_player = window.players.self()
			}catch(err){
				window.response = resp
			}

			if(!self_player){
				self_player = {
					follow : false,
					self : true,
					type : "player",
					hash : cookies.address ? cookies.address : cookies.hash,
					emoji : window.emojis.self ? window.emojis.self : "😀",
					x : 1.5,
					y : 0.5,
					z : 1.5
				}
			}

			if(rows.length){
				var thread

				for(var r = 0; r < rows.length; r++){
					var row = rows[r];

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
			/*
				개발 Part 14 (검수) - E7'
				blockies.create() 직접 호출을 Blockie() 로 바꾼다.
				seed 는 location.hash 유무에 따라 "0x..." 또는
				cc_address(40자 hex) 가 되므로 형식 정규화가 필요하다.
			*/
			var canvas = window.Blockie(seed)
			var self = false
			var diff = false
			var selector = window.selector

			if(Object.keys(window.com).length){
				var $form = $(document.forms.Tutorial)

				if($form.hasClass("on")){
					localStorage.tutorial = "complete"

					$form.removeClass("on")
					$body
						.attr("referer", window.com.href)
						.removeAttr("tutorial")
						.removeAttr("step")

					delete window.tutorial
				}
			}

			if(false){
				clearInterval(window.Poll.ing)
				var timezoneOffset = new Date().getTimezoneOffset() * 60 * 1000
				var _date = new Date(new Date() - timezoneOffset) // 10s ago
					_date = _date.toISOString()
						.replace(/T/, ' ')
						.replace(/\..+/, '')

				var x = self_player.x
				var z = self_player.z

				rows = [{
					Id : randomHash(), 
					From : self_player.hash, 
					To : cc_address, 
					Cc : 1.5+','+1.5+' #position '+cc_address,
					Subject : "", 
					Flag : "",
					Date : _date
				}]

				if(window.tutorial.name){
					var _rows = window.tutorial.rows ? window.tutorial.rows : []

					if(window.tutorial.name == "Move"){
						
					}else if(window.tutorial.name == "MineSweeper"){
						if(window.tutorial.step == 0){
							if(resp.body.body.cc == "open"){
								window.tutorial.step = 1
								$body.attr("step", 1)

								var _row = {}

								for(var _x = -1; _x < 2; _x++){
									for(var _z = -1; _z < 2; _z++){
										var open = false
										if(
											(x == (x+_x) && z == (z+_z)) ||
											_x == _z
										){
											open = true
										}

										if(open){
											var open_row = {
												Id : randomHash(), 
												From : self_player.hash, 
												To : cc_address, 
												Cc : (x+_x)+','+(z+_z)+' #open '+cc_address,
												Subject : "", 
												Flag : "",
												Date : _date
											}

											window.tutorial.opens[(x+_x)+':'+(z+_z)] = open_row
											_rows.push(open_row)
										}else{
											var mine_row = {
												Id : randomHash(), 
												From : self_player.hash, 
												To : self_player.hash, 
												Cc : (x+_x)+','+(z+_z)+' #asset '+cc_address+' @💣',
												Subject : "", 
												Flag : "",
												Date : _date
											}
											
											window.tutorial.mines[(x+_x)+':'+(z+_z)] = mine_row
											_rows.push(mine_row)

											_row = {
												Id : randomHash(), 
												From : self_player.hash, 
												To : cc_address, 
												Cc : (x+_x)+','+(z+_z)+' #asset '+cc_address,
												Subject : "", 
												Flag : cc_address,
												Date : _date,
												Name : "tutorial",
												Color : "green",
												y : -0.08
											}

											window.tutorial.x = x+_x
											window.tutorial.z = z+_z
										}
									}
								}

								_rows.push(_row)
							}
						}else if(window.tutorial.step == 2){
							if(resp.body.body.cc == "flag"){
								window.tutorial.step = 3
								$body.attr("step", 3)

								var open_row

								for(var i = 0;  i < _rows.length; i++){
									var _row = _rows[i]
									if(_row.Cc.indexOf("#open") > -1){
										open_row = _row
									}
								}

								var position = open_row.Cc.split(" #open")[0]

								var asset = JSON.parse("["+position+"]")

								var _x = asset[0]
								var _z = asset[1]

								window.tutorial.x = _x
								window.tutorial.z = _z

								_rows.push({
									Id : randomHash(), 
									From : self_player.hash, 
									To : cc_address, 
									Cc : open_row.Cc.replace("open", "asset"),
									Subject : "", 
									Flag : cc_address,
									Date : _date,
									Name : "tutorial",
									Color : "green",
									y : -0.08
								})

								var flag_row = {
									Id : randomHash(), 
									From : self_player.hash, 
									To : cc_address, 
									Cc : x+','+z+' #flag '+cc_address,
									Subject : "", 
									Flag : "",
									Date : _date
								}
								_rows.push(flag_row)
								window.tutorial.flags[x+':'+z] = flag_row
							}else{
								_rows.splice(_rows.length-1, 1)	
							}
						}else if(window.tutorial.step == 4){
							if(resp.body.body.cc == "chord"){
								var index

								for(var _x = -1; _x < 2; _x++){
									for(var _z = -1; _z < 2; _z++){
										var mine_row = window.tutorial.mines[(x+_x)+':'+(z+_z)]
										var mine_cc = mine_row ? mine_row.Cc : ""

										var flag_row = window.tutorial.flags[(x+_x)+':'+(z+_z)]
										var flag_cc = flag_row ? flag_row.Cc : ""
										
										for(var i = 0;  i < _rows.length; i++){
											if(_rows[i].Name){
												index = i
											}else if(_rows[i].Cc == flag_cc){

												_rows[i].Cc = _rows[i].Cc.replace('#flag',"#open")

												window.tutorial.opens[(x+_x)+':'+(z+_z)] = _rows[i]
											}else if(_rows[i].Cc == mine_cc){
												_rows[i].Flag = cc_address
												_rows[i].Cc = _rows[i].Cc
													.replace("#asset", "#open")
													.replace(" @💣", "")

												window.tutorial.opens[(x+_x)+':'+(z+_z)] = _rows[i]
											}
										}

										delete window.tutorial.flags[(x+_x)+':'+(z+_z)]
										delete window.tutorial.mines[(x+_x)+':'+(z+_z)]
									}
								}

								if(typeof index != "undefined"){
									_rows.splice(index, 1)
									window.tutorial.x -= 1
									window.tutorial.z -= 1
									setTimeout(function(){
										$('.aside').attr("sort","emoji")
										window.Tutorial(3)
									},100)
								}
							}
						}
					}else if(window.tutorial.name == "Puzzle"){
						if(window.tutorial.step == 0){
							_rows.push({
								Id : randomHash(), 
								From : self_player.hash, 
								To : cc_address, 
								Cc : window.tutorial.x+','+window.tutorial.z+' #asset '+cc_address,
								Subject : "", 
								Flag : cc_address,
								Date : _date,
								Name : "tutorial",
								Color : "green",
								y : -0.08
							})

							for(var i = 0; i < _rows.length; i++){
								var _row = _rows[i]

								if(_row.Cc.indexOf("#open") > -1){
									var position = _row.Cc.split(" #open")[0]

									var asset = JSON.parse("["+position+"]")

									var _x = asset[0]
									var _z = asset[1]

									if(_x == window.tutorial.x && _z == window.tutorial.z){

									}else{
										var puzzle_row = {
											Id : randomHash(), 
											From : self_player.hash, 
											To : cc_address, 
											Cc : _x+','+_z+' #puzzle '+cc_address+' @😄',
											Subject : "#puzzle", 
											Flag : cc_address,
											Date : _date
										}

										_rows.push(puzzle_row)
									}
								}
							}
						}else if(window.tutorial.step == 1){
							var puzzle_rows = []

							if(resp.body.body.cc == "puzzle"){
								for(var i = 0; i < _rows.length; i++){
									var _row = _rows[i]

									if(_row.Cc.indexOf("#puzzle") > -1){
										var position = _row.Cc.split(" #puzzle")[0]

										var asset = JSON.parse("["+position+"]")

										var _x = asset[0]
										var _z = asset[1]

										var emoji = window.emojis[random(4, window.emojis.length-1)]

										if(_x == window.tutorial.x && _z == window.tutorial.z){
											
										}else{
											_rows[i].Cc = _rows[i].Cc.replace("#puzzle","#bingo")
										}

										var puzzle_row = {
											Id : randomHash(), 
											From : self_player.hash, 
											To : cc_address, 
											Cc : _x+','+_z+' #puzzle '+cc_address+' @'+emoji.icon,
											Subject : "#puzzle", 
											Flag : cc_address,
											Date : _date
										}

										puzzle_rows.push(puzzle_row)
									}
								}

								_rows = _rows.concat(puzzle_rows)

								window.tutorial.step = 2
								$body.attr("step", 2)
							}	
						}else if(window.tutorial.step == 2){
							if(resp.body.body.cc == "puzzle"){
								for(var i = 0; i < _rows.length; i++){
									var _row = _rows[i]

									delete window.bingo[_row.Id]

									if(_row.Cc.indexOf("#puzzle") > -1){
										var position = _row.Cc.split(" #puzzle")[0]

										var asset = JSON.parse("["+position+"]")

										var _x = asset[0]
										var _z = asset[1]

										if(_x == window.tutorial.x && _z == window.tutorial.z){
											var puzzle_row = {
												Id : randomHash(), 
												From : self_player.hash, 
												To : cc_address, 
												Cc : _x+','+_z+' #bingo '+cc_address+' @😄',
												Subject : "#bingo", 
												Flag : cc_address,
												Date : _date
											}

											_rows.push(puzzle_row)
										}else{
											_rows[i].Cc = _rows[i].Cc.replace("#puzzle","#bingo")
										}
									}
								}

								setTimeout(function(){
									window.Tutorial(4)

									$('.aside').attr("sort","sticker")
								},100)
							}
						}
					}else if(window.tutorial.name == "Sticker"){
						if(window.tutorial.step == 0){
							if(resp.body.body.cc == "puzzle"){
								var item = window.items[[random(1, window.items.length-1)]]

								_rows.push({
									Id : randomHash(), 
									From : cc_address, 
									To : self_player.hash, 
									Cc : x+','+z+' #asset '+cc_address+' @'+item.char,
									Subject : "#asset", 
									Flag : "",
									Date : _date
								})

								window.tutorial.step = 1
								$body.attr("step", 1)
							}
						}else if(window.tutorial.step == 1){
							if(resp.body.body.puzzles){
								if(resp.body.body.puzzles.length){
									var emoji = resp.body.body.puzzles[0].emoji

									_rows.splice(_rows.length-1, 1)	

									_rows.push({
										Id : randomHash(), 
										From : self_player.hash, 
										To : cc_address, 
										Cc : x+','+z+' #puzzle '+cc_address+' @'+emoji,
										Subject : "#puzzle", 
										Flag : "",
										Date : _date
									})

									window.tutorial.step = 2
									$body.attr("step", 2)

									window.tutorial.x -= 1
									window.tutorial.z -= 1

									for(var i = 0; i < _rows.length; i++){
										if(_rows[i].Name){
											_rows[i].Cc = window.tutorial.x+','+window.tutorial.z+' #asset '+cc_address
										}
									}
								}
							}
						}
					}else if(window.tutorial.name == "Mine"){
						if(window.tutorial.step == 0){
							var isMine = false

							try{
								if(resp.body.body.puzzles[0].emoji == "💣"){
									isMine = true
								}
							}catch(err){
								console.log("Err",err);
							}
							if(isMine){
								var index

								for(var i = 0;  i < _rows.length; i++){
									if(_rows[i].Name){
										_rows[i] = undefined
									}else if(_rows[i].Cc == (x+','+z+' #open '+cc_address)){
										_rows[i] = undefined
									}
								}

								var mine_row = {
									Id : randomHash(),
									From : self_player.hash, 
									To : cc_address,
									Cc : x+','+z+' #mine '+cc_address,
									Subject : "", 
									Flag : "",
									Date : _date
								}

								_rows.push(mine_row)

								window.tutorial.x += 1
								window.tutorial.z += 1

								_rows.push({
									Id : randomHash(), 
									From : self_player.hash, 
									To : cc_address, 
									Cc : window.tutorial.x+','+window.tutorial.z+' #asset '+cc_address,
									Subject : "", 
									Flag : cc_address,
									Date : _date,
									Name : "tutorial",
									Color : "green",
									y : -0.08
								})

								window.tutorial.step = 1
								$body.attr("step", 1)
							}
						}
					}else if(window.tutorial.name == "Portal"){
						if(window.tutorial.step == 0){
							var isPortal = false

							if(resp.body.body.cc == "portal"){
								isPortal = true
							}

							if(isPortal){
								_rows.splice(_rows.length-1, 1)	

								window.tutorial.portal = randomHash()

								_rows.push({
									Id : window.tutorial.portal, 
									From : (self_player.hash.indexOf("0x") > -1 ? self_player.hash : "0x"+self_player.hash), 
									To : cc_address, 
									Cc : x+','+z+' #portal 0x'+cc_address,
									Subject : "", 
									Flag : "",
									Date : date
								})

								window.tutorial.x -= 1

								_rows.push({
									Id : randomHash(), 
									From : self_player.hash, 
									To : cc_address, 
									Cc : window.tutorial.x+','+window.tutorial.z+' #asset '+cc_address,
									Subject : "", 
									Flag : cc_address,
									Date : _date,
									Name : "tutorial",
									Color : "green",
									y : -0.08
								})

								window.tutorial.step = 1
								$body.attr("step", 1)

								localStorage.tutorial = "complete"
							}
						}
					}else if(window.tutorial.name == "Withdrawal"){
						window.location.hash = self_player.hash.replace("0x","")

						if(window.tutorial.step == 0){
							$body.attr("tutorial", "Withdrawal")
							$body.attr("step", 0)
						}
					}

					if(!window.tutorial.rows && _rows.length > 0){
						window.tutorial.rows = _rows
					}

					_rows = rowsTrim(_rows)

					rows = rows.concat(_rows);
				}else{
					window.tutorial.rows = []
					window.tutorial.opens = {}
					window.tutorial.mines = {}
					window.tutorial.flags = {}
					window.tutorial.z = window.tutorial.x = 1.5
					window[self_player.hash].position.x = window.current.current.position.x = window.cursor.current.position.x = 1.5
					window[self_player.hash].position.z = window.current.current.position.z = window.cursor.current.position.z = 1.5

					rows.push({
						Id : randomHash(), 
						From : self_player.hash, 
						To : cc_address, 
						Cc : 1.5+','+1.5+' #asset '+cc_address,
						Subject : "", 
						Flag : cc_address,
						Date : _date,
						Name : "tutorial",
						Color : "green",
						y : -0.08
					})
				}
			}

			var player_hash = self_player.hash

			var $player = $('player[id="'+player_hash+'"][alt="player"]')

			var cc_player = {
				type : "player",
				self : false,
				hash : cc_address,
				x : 0.5,
				y : 0.5,
				z : 0.5,
				/*
					개발 Part 14 (검수) - E7'
					canvas 가 null 이면 여기서 TypeError 로 중단됐다.
					BlockieUrl 은 실패 시 "" 를 반환하고
					Player.jsx 가 type="text" 로 렌더하므로 화면이 깨지지 않는다.
				*/
				emoji : window.BlockieUrl(seed)
			}

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

			var connecting = []

			var signaling = false

			var props = []

			var open = ""

			var sticker = []

			var bingo_body = ""

			var score_board = []

			// if(socket){
			// 	if(socket.hash){
			// 		try{
			// 			var hash = socket.hash.replace("#","")

			// 			if(cc_address.indexOf(hash) == -1){
			// 				var canvas = blockies.create({seed: socket.hash.replace("#","0x")})

			// 				_players.push({
			// 					self : false,
			// 					hash : hash,
			// 					x : -1.5,
			// 					y : 0.5,
			// 					z : -1.5,
			// 					emoji : canvas.toDataURL()
			// 				})
			// 			}
			// 		}catch(err){

			// 		}
			// 	}
			// }

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

				_players.push(cc_player)

				if(window.com){
					if(window.com.rows){
						for(var i = 0; i < window.com.rows.length; i++){
							var row = window.com.rows[i]

							var _id = ethers.hashMessage(row.From+row.To+row.Cc+row.Subject)
								_id = ethers.computeAddress(_id).toLowerCase()

							row.Id = _id

							rows.push(row)
						}
					}
				}

				for(var r = 0; r < rows.length; r++){
					var row = rows[r];

					var peerId = row.From

					if(row.Cc.indexOf("#position") > -1){
						/* 개발 Part 4 : 좌표/이모지를 컬럼에서 읽는다 */
						var player
						var emoji
						if(typeof row.x != "undefined"){
							player = [row.x * 1, row.z * 1]
							emoji = row.emoji
						}else{
							var position = row.Cc.split(" #position")[0]
							emoji = row.Cc.split("@")[1]
							player = JSON.parse("["+position+"]")
						}
							player.follow = false

						if(cookies.address == row.From || cookies.hash == row.From){
							self = true

							player.self = true

							if(cookies.address){
								if(cookies.hash == row.From){
									continue
								}
							}

							var type = window.typeof_emoji(emoji)

							if(self_player){
								try{
									if(window.current){
										if(window.current.current.position){
											self_player.x = window.current.current.position.x
											self_player.z = window.current.current.position.z
										}
									}
								}catch(err){

								}
									

								player.x = self_player.x
								player.y = self_player.y
								player.z = self_player.z
								player.emoji = window.emojis.self
							}
						}else{
							player.x = player[0]
							player.y = 0.5
							player.z = player[1]
							player.emoji = emoji

							if(window.map.follow[self_player.hash]){
								player.follow = window.map.follow[self_player.hash].indexOf(row.From) > -1 ? true : false
							}
						}

						if(!window.map.report[row.From]){
							if(!rows[row.From]){
								rows[row.From] = true

								_players.push({
									type : "player",
									follow : player.follow,
									self : player.self,
									hash : row.From,
									x : player.x,
									y : player.y,
									z : player.z,
									emoji : player.emoji
								})
							}

							if(!_players[row.From]){
								_players.cnt += 1
							}

							_players[row.From] = {
								x : player.x,
								z : player.z,
								emoji : player.emoji
							}


							if(cookies.address == row.From || cookies.hash == row.From){

							}else{
								
							}

							try{
								var connection = peers[peerId]
								if(connection){
									connecting.push(peerId)
								}
								
								if(cookies.address == row.From || cookies.hash == row.From){
									// 시그널 값 추가
								}else if(!connection){
									// console.log("진입",peers);
									connection = new RTCPeerConnection({ iceServers: iceServers })
									connection.hash = peerId

									if(peerId.indexOf("0x") == 0){
										// 인증 사용자
										connection.index = peerId * 1
									}else{
										// 미인증 사용자
										connection.index = ("0x"+peerId) * 1
									}

									var hash = ""
									var index = ""

									if(cookies.address){
										// 인증 사용자
										hash = cookies.address
										index = cookies.address * 1
									}else{
										// 미인증 사용자
										hash = cookies.hash
										index = ("0x"+cookies.hash) * 1
									}

									var channel = connection.createDataChannel('data');

									connection.channel = channel

									channel.connection = connection

									var onopen = function(event){
										// console.log('event', event);
									}

									var onmessage = async function(event){
										try{
											var data = JSON.parse(event.data)

											var peerId = event.target.connection.hash

											try{
												if(data.localstream){
													event.target.connection.localstream = data.localstream
												}
											}catch(err){

											}


											if(typeof data.signal != "undefined"){
												if(data.signal){

												}else{
													var connected
													try{
														connected = peers[peerId][data.method].track
													}catch(err){

													}

													if(connected){
														setStream(event.target.connection, data.method)	
													}
												}

												if(Object.keys(localstream).length == 0){
													delete peers[peerId].live
													delete peers[peerId].method
													delete peers[peerId].reverse

													peers[peerId].localstream = {}

													delete peers[peerId]['getUserMedia']
													delete peers[peerId]['getDisplayMedia']

													$('[id="'+peerId+'"][alt="player"] stream').remove()
												}
											}else if(event.target.connection && Object.keys(localstream).length){
												var peerIndex

												if(peerId.indexOf("0x") == 0){
													// 인증 사용자
													peerIndex = peerId * 1
												}else{
													// 미인증 사용자
													peerIndex = ("0x"+peerId) * 1
												}

												var hash = ""
												var index = ""

												if(cookies.address){
													// 인증 사용자
													hash = cookies.address
													index = cookies.address * 1
												}else{
													// 미인증 사용자
													hash = cookies.hash
													index = ("0x"+cookies.hash) * 1
												}
												
												var reverse = data.reverse ? data.reverse : ""
												var _method = reverse ? reverse : data.method

												// // 
												var peerstream = data.localstream

												var _localstream = localstream[_method]


												var peer_enabled = ""

												if(typeof peerstream[_method] != "undefined"){
													peer_enabled = peerstream[_method].enabled
												}

												var peer_enabled = ""
												var _peer_enabled = ""

												var method_ = ""

												if(_method == "getDisplayMedia"){
													method_ = "getUserMedia"
												}else if(_method == "getUserMedia"){
													method_ = "getDisplayMedia"
												}

												if(peerstream){
													if(peerstream[_method]){
														peer_enabled = peerstream[_method].enabled
													}
													if(peerstream[method_]){
														_peer_enabled = peerstream[method_].enabled
													}
												}


												// console.log("onmessage data",data);

												var connected_
												try{
													connected_ = peers[peerId][method_].track
												}catch(err){

												}

												// var skip

												// console.log("peerstream",peerstream);

												// console.log("method_",method_);
												// console.log("connected_",connected_);

												// console.log("_peer_enabled",_peer_enabled);

												var _local_method = ""
												if(event.target.connection[_method]){
													_local_method = event.target.connection[_method].method
												}

												if(_peer_enabled && _local_method && _local_method == _peer_enabled){
													reverse = true
												}else if((!connected_ && !_localstream && event.target.connection[method_])){
													reverse = true
												}

												if(reverse){
													// console.log("리버스 진입");

													if(_method == "getDisplayMedia"){
														_method = "getUserMedia"
													}else if(_method == "getUserMedia"){
														_method = "getDisplayMedia"
													}

													reverse = _method
												}else{
													if(Object.keys(localstream).length == Object.keys(data.localstream).length){
														delete peers[peerId].method
														delete peers[peerId].reverse
													}
												}

												var stream_connection = event.target.connection[_method]

												if(!stream_connection && data.reverse){
													stream_connection = event.target.connection[data.reverse]
												}

												if(!stream_connection){
													stream_connection = {}
												}

												if(reverse && !peers[peerId].reverse){
													stream_connection.signal = true

													peers[peerId].live = peers[peerId].method = peers[peerId].reverse = reverse
												}

												var created = stream_connection.method

												if(peers[peerId].reverse){
													// console.log("signal 리버스 진입")

													reverse = peers[peerId].live = peers[peerId].method = peers[peerId].reverse
												}

												// console.log("stream_connection",stream_connection);
												// console.log("created ,_method",created ,_method);

												if(peers[peerId].reverse || (!reverse && created == _method && Object.keys(stream_connection).length)){
													if(typeof data.tab != "undefined"){
														peers[peerId].tab = true
													}
													
													if(typeof data.video != "undefined"){
														peers[peerId].video = true
													}

													if(typeof data.audio != "undefined"){
														peers[peerId].audio = true
													}

													setTimeout(async function(event, stream_connection, data){
														clearTimeout(stream_connection.timeout)

														if(data.candidate && !event.target.connection.signal && !stream_connection.iceCandidate){
															stream_connection.iceCandidate = data.candidate
															peers[peerId].addIceCandidate(new RTCIceCandidate(data.candidate))

															stream_connection.timeout = setTimeout(function(){
																delete event.target.connection.signal
															},10000)

														}else if(data.type == "offer"){
															var desc = new RTCSessionDescription(data)
															var stuff = stream_connection.setRemoteDescription(desc)

															var answer = stream_connection.createAnswer()
															stream_connection.setLocalDescription(answer)

														}else if(data.type == "answer"){
															var desc = new RTCSessionDescription(data)
															var stuff = stream_connection.setRemoteDescription(desc)

														}else{
															// console.log("stream_connection.signal",stream_connection.signal);
															// console.log("_method",_method);


															var json = {
																method : data.method
															}

															if(!OAuth3.isMobile){
																json.tab = true
															}

															if(hasMicrophone){
																json.audio = true
															}

															if(hasWebcam){
																json.video = true
															}

															if(reverse){
																json.reverse = reverse
															}


															json.localstream = localStream(peerId)

															if(typeof stream_connection.signal == "undefined"){
																stream_connection.signal = true

																event.target.connection.channel.send(JSON.stringify(json))

																// console.log("진입체크");

															}else{
																if(stream_connection.signal){
																	stream_connection.signal = false

																	event.target.connection.channel.send(JSON.stringify(json))

																	if(reverse){
																		if(_method == "getDisplayMedia"){
																			peers[peerId].method = "getDisplayMedia"
																			peers[peerId].reverse = "getDisplayMedia"
																			peers[peerId].live = "getDisplayMedia"
																		}else if(_method == "getUserMedia"){
																			peers[peerId].method = "getUserMedia"
																			peers[peerId].reverse = "getUserMedia"
																			peers[peerId].live = "getUserMedia"
																		}
																	}

																	// console.log("시그널 리버스");

																	
																	// console.log('peers[peerId].method',peers[peerId].method);
																	// console.log('peers[peerId].reverse',peers[peerId].reverse);

																}else if(stream_connection.signal != null){
																	if(peerIndex < index){
																		stream_connection.signal = null

																		// console.log("완료");

																		var _description = stream_connection.createOffer()
																		stream_connection.setLocalDescription(_description)
																	}else{
																		event.target.connection.channel.send(JSON.stringify(json))

																		// console.log("완료");
																	}
																}
															}

															stream_connection.timeout = setTimeout(function(){
																delete event.target.connection.signal
															},10000)
														}
													}, Math.random() * 400, event, stream_connection, data)
												}else{
													var live = false

													try{
														// console.log("peers[peerId].live",peers[peerId].live);

														var live_method = ""

														if(peers[peerId].live && !peers[peerId].reverse){
															if(peers[peerId].live == "getDisplayMedia"){
																live_method = "getUserMedia"
															}else if(peers[peerId].live == "getUserMedia"){
																live_method = "getDisplayMedia"
															}
														}

														if(live_method){
															var _live_method = event.target.connection[live_method].method

															// console.log("live_method",live_method);

															if(typeof _live_method == "undefined" && event.target.connection[live_method].track){
																live = true
															}
														}else{
															if(event.target.connection[_method].track){
																live = true
															}
														}
													}catch(err){
														if(!localstream[_method]){
															live = true
														}
													}

													// console.log("addStream _method",_method)
													// console.log("!live",!live);
													
													if(!live){
														addStream(peerId, _method)
													}
												}
											}

											if(Object.keys(localstream).length != Object.keys(data.localstream).length){
												delete peers[peerId].method
												delete peers[peerId].reverse
											}
										}catch(err){
											// console.log("onmessage err",err);
										}
									}

									channel.onopen = onopen
									channel.onmessage = onmessage

									connection.ondatachannel = (event) => {
										// console.log("ondatachannel event",event)

										var connection = event.target

										channel.onopen = onopen
										channel.onmessage = onmessage
										connection.channel = event.channel

										var json = {}

										if(!OAuth3.isMobile){
											json.tab = true
										}

										if(hasMicrophone){
											json.audio = true
										}

										if(hasWebcam){
											json.video = true
										}

										json.localstream = localStream(peerId)

										if(connection['getDisplayMedia']){
											// json.init  = true
											json.method = 'getDisplayMedia'
											connection.channel.send(JSON.stringify(json))
										}

										if(connection['getUserMedia']){
											// json.init  = true
											json.method = 'getUserMedia'
											connection.channel.send(JSON.stringify(json))
										}
									}


									connection.onicecandidate = (event) => {
										var connection = event.target
										/*
											개발 Part 9
											candidate 를 즉시 큐에 넣어 다음 폴링에 실어 보낸다.
											현행은 SDP 교환이 끝나야만 전달돼 연결 수립이 느렸다.
										*/
										if(event.candidate){
											if(!window.rtcQueue){
												window.rtcQueue = []
											}
											window.rtcQueue.push({
												hash : connection.hash,
												type : "candidate",
												candidates : [{
													candidate : event.candidate.candidate,
													sdpMid : event.candidate.sdpMid,
													sdpMLineIndex : event.candidate.sdpMLineIndex,
													usernameFragment : event.candidate.usernameFragment
												}]
											})
										}
										if(connection.index < index){
											connection.pendingOfferDescription = connection.localDescription
											connection.pendingOfferDescription.hash = connection.hash
										}else{
											connection.pendingAnswerDescription = connection.localDescription
											connection.pendingAnswerDescription.hash = connection.hash
										}
									}

									if(connection.index < index){
										var _description = await connection.createOffer()
										connection.setLocalDescription(_description)
									}
									
									peers[peerId] = connection
								}
							}catch(err){
								// console.log("Err",err);
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
					}else if(row.Cc.indexOf("#emojis") > -1){
						if(row.Subject){
							$('.emojis .emoji_asset[emoji="'+row.Subject+'"]').addClass("on")
						}else{
							$('.emojis .emoji_asset').removeClass("on")
						}
					}else if(row.Cc.indexOf("#description") > -1){
						/*
							개발 Part 9
							서버가 rtc_signals 에서 __sdp / __kind / __candidates 를 실어 보낸다.
							현행은 Subject 를 JSON.parse 했는데, SDP 가 varchar 한계로
							잘리면 파싱 자체가 실패해 연결이 조용히 끊겼다.
							row.__rtc 가 있으면 컬럼을 쓰고, 없으면 레거시 파싱으로 폴백한다.
						*/
						var _rtcPeer = row.__rtc ? (row.__fromHash ? row.__fromHash : row.From) : peerId
						var connection = peers[_rtcPeer]
						if(connection){
							if(cookies.address == row.From || cookies.hash == row.From){
								if(connection.pendingOfferDescription){
									connection.pendingOfferDescription.flag = row.Flag
									
								}else if(connection.pendingAnswerDescription){
									connection.pendingAnswerDescription.flag = row.Flag
								}
							}else if(ethers.isAddress(_rtcPeer)){
								var date = new Date(row.Date).getTime()
								var remote_description = ""
								if(row.__rtc){
									if(row.__sdp){
										remote_description = {
											type : row.__kind,
											sdp : row.__sdp
										}
									}
								}else{
									try{
										remote_description = JSON.parse(row.Subject)
									}catch(err){
									}
								}
								try{
									if(connection.connectionState == "connected" && connection.signalingState == "stable"){
									}else{
										if(remote_description && remote_description.type && typeof sessionStorage[row.Id] == "undefined"){
											if(remote_description.type == "offer" && row.To == player_hash){
												sessionStorage[row.Id] = true
												connection.hash = _rtcPeer
												var desc = new RTCSessionDescription(remote_description)
												var stuff = connection.setRemoteDescription(desc)
												var answer = await connection.createAnswer()
												await connection.setLocalDescription(answer)
											}else if(remote_description.type == "answer" && connection.pendingOfferDescription){
												if(connection.pendingOfferDescription.hash == _rtcPeer){
													sessionStorage[row.Id] = true
													var desc = new RTCSessionDescription(remote_description)
													var stuff = connection.setRemoteDescription(desc)
													delete connection.pendingOfferDescription
												}
											}
										}
									}
									/*
										개발 Part 9
										trickle ICE. SDP 교환을 기다리지 않고 즉시 추가한다.
										remoteDescription 이 아직 없으면 큐에 담아 두었다가
										setRemoteDescription 이후에 흘려 넣는다.
									*/
									if(row.__candidates && row.__candidates.length){
										if(!connection.pendingRemoteCandidates){
											connection.pendingRemoteCandidates = []
										}
										for(var _ci = 0; _ci < row.__candidates.length; _ci++){
											var _cand = row.__candidates[_ci]
											if(connection.remoteDescription){
												try{
													await connection.addIceCandidate(new RTCIceCandidate(_cand))
												}catch(err){
												}
											}else{
												connection.pendingRemoteCandidates.push(_cand)
											}
										}
									}
									if(connection.remoteDescription && connection.pendingRemoteCandidates){
										for(var _pi = 0; _pi < connection.pendingRemoteCandidates.length; _pi++){
											try{
												await connection.addIceCandidate(
													new RTCIceCandidate(connection.pendingRemoteCandidates[_pi])
												)
											}catch(err){
											}
										}
										delete connection.pendingRemoteCandidates
									}
								}catch(err){
									// console.log("Err",err);
								}
							}
						}
					}else if(row.Cc.indexOf("#link") > -1){
						/*
							개발 Part 4
							서버가 __url / __provider / __thumbUrl 을 함께 보낸다.
							Cc.split("https://")[1] 로 자르던 방식은 URL 안에
							https:// 가 두 번 나오면 깨졌다.
						*/
						var asset
						var link
						if(typeof row.x != "undefined" && row.__url){
							asset = [row.x * 1, row.z * 1]
							link = row.__url
						}else{
							var position = row.Cc.split(" #link")[0]
							link = "https://" + row.Cc.split("https://")[1]
							asset = JSON.parse("["+position+"]")
						}
						try{
							var url = new URL(link)
							link = url.href
							var oembed = row.__provider ? {
								id : row.__providerId,
								host : row.__host ? row.__host : url.host,
								provider : row.__provider,
								src : row.__thumbUrl
							} : window.oembed(url)

							_players.push({
								type : "player",
								self : row.From,
								hash : row.Id,
								x : asset[0],
								y : 0.5,
								z : asset[1],
								emoji : link
							})

							var playerProp = peers[row.Id]

							_players.cnt += 1

							if(!peers[row.Id]){
								peers[row.Id] = {
									hash : row.Id,
									id : oembed.id,
									provider : oembed.provider,
									emoji : link
								}
							}

							row.hash = row.Id
							row.oembed = oembed
							row.emoji = link

							if(playerProp){
								if(!playerProp.index && playerProp.emoji != self_player.emoji){
									props.push(row)
								}
							}else{
								props.push(row)
							}
						}catch(err){
							console.log("err",err);
						}
					}else if(row.Cc.indexOf("#portal") > -1){
						/* 개발 Part 4 : 좌표를 컬럼에서 읽는다 */
						var asset
						if(typeof row.x != "undefined"){
							asset = [row.x * 1, row.z * 1]
						}else{
							var position = row.Cc.split(" #portal")[0]
							asset = JSON.parse("["+position+"]")
						}
						/*
							개발 Part 14 (검수) - E7'
							현행은 row.From 이 없을 때 "0x0" 을 시드로 넘겼다.
							blockies 는 40자 hex 가 아닌 시드에 null 을 반환하므로
							바로 다음 줄의 canvas.toDataURL() 이 예외를 던졌다.
							폴백 시드도 row.Id 로 바꿔 포털마다 다른 아이콘이 나오게 한다.
						*/
						_players.push({
							self : row.From,
							hash : row.Id,
							x : asset[0],
							y : 0.5,
							z : asset[1],
							emoji : window.BlockieUrl(row.From ? row.From : row.Id)
						})
					}else if(row.Cc.indexOf("#bingo") > -1){
						/* 개발 Part 4 : 좌표를 컬럼에서 읽는다 */
						var asset
						if(typeof row.x != "undefined"){
							asset = [row.x * 1, row.z * 1]
						}else{
							var position = row.Cc.split(" #bingo")[0]
							asset = JSON.parse("["+position+"]")
						}
						var $clipped = $('.clipped .emoji[x="'+asset[0]+'"][z="'+asset[1]+'"]')
						if($clipped.length && !window.bingo[row.Id]){
							window.bingo[row.Id] = true
							bingo_body += $clipped.closest('[style*="transform-origin"]')[0].outerHTML
						}
					}else if(row.Cc.indexOf("#puzzle") > -1){
						/*
							개발 Part 4
							서버가 x / z / emoji 를 컬럼에서 실어 보낸다.
							값이 없을 때만 Cc 를 파싱한다(레거시 폴백).
						*/
						var asset
						var emoji
						if(typeof row.x != "undefined"){
							asset = [row.x * 1, row.z * 1]
							emoji = row.emoji
						}else{
							var position = row.Cc.split(" #puzzle")[0]
							emoji = row.Cc.split("@")[1]
							asset = JSON.parse("["+position+"]")
						}
						window.map.puzzle[(asset[0]+":"+asset[1])] = {
							id : row.Id,
							hash : row.From,
							name : "puzzle",
							value : emoji,
							color: "",
							x : asset[0],
							y : -0.04,
							z : asset[1]
						}
						_assets.push({
							id : row.Id,
							hash : row.From,
							name : "puzzle",
							value : emoji,
							color: row.Flag ? true : false,
							x : asset[0],
							y : 0,
							z : asset[1]
						})
					}else if(row.Cc.indexOf("#asset") > -1){
						/*
							개발 Part 4
							#asset 은 아직 레거시 테이블(개발 Part 5 에서 이관)이므로
							Cc 파싱을 유지하되, 컬럼이 있으면 우선 사용한다.
						*/
						var asset
						var emoji
						if(typeof row.x != "undefined"){
							asset = [row.x * 1, row.z * 1]
							emoji = row.emoji ? row.emoji : row.Cc.split("@")[1]
						}else{
							var position = row.Cc.split(" #asset")[0]
							emoji = row.Cc.split("@")[1]
							asset = JSON.parse("["+position+"]")
						}
						if(row.Flag){
							_assets.push({
								id : row.Id,
								hash : row.From,
								name : row.Name ? row.Name : "asset",
								value : "",
								color: row.Color ? row.Color : "#000",
								x : asset[0],
								y : row.y ? row.y : 0,
								z : asset[1]
							})
						}else{
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
					}else if(row.Cc.indexOf("#mine") > -1){
						/* 개발 Part 4 : 좌표를 컬럼에서 읽는다 */
						var asset
						if(typeof row.x != "undefined"){
							asset = [row.x * 1, row.z * 1]
						}else{
							var position = row.Cc.split(" #mine")[0]
							asset = JSON.parse("["+position+"]")
						}
						_assets.push({
							id : row.Id,
							hash : row.From,
							name : "mine",
							value : "💣",
							color: "#000",
							x : asset[0],
							y : 0,
							z : asset[1]
						})
					}else if(row.Cc.indexOf("#flag") > -1){
						/* 개발 Part 4 : 좌표를 컬럼에서 읽는다 */
						var asset
						if(typeof row.x != "undefined"){
							asset = [row.x * 1, row.z * 1]
						}else{
							var position = row.Cc.split(" #flag")[0]
							asset = JSON.parse("["+position+"]")
						}
						_assets.push({
							id : row.Id,
							hash : row.From,
							name : "flag",
							value : "",
							color: "orange",
							x : asset[0],
							y : -0.08,
							z : asset[1]
						})
					}else if(row.Cc.indexOf("#chord") > -1){
						/* 개발 Part 4 : 좌표를 컬럼에서 읽는다 */
						var asset
						if(typeof row.x != "undefined"){
							asset = [row.x * 1, row.z * 1]
						}else{
							var position = row.Cc.split(" #chord")[0]
							asset = JSON.parse("["+position+"]")
						}
						window.map.open[(asset[0]+":"+asset[1])] = {
							id : row.Id,
							hash : row.From,
							name : "chord",
							value : "",
							color: "yellow",
							x : asset[0],
							y : -0.04,
							z : asset[1]
						}

						_assets.push({
							id : row.Id,
							hash : row.From,
							name : "chord",
							value : "",
							color: "yellow",
							x : asset[0],
							y : -0.04,
							z : asset[1]
						})
					}else if(row.Cc.indexOf("#open") > -1){
						/* 개발 Part 4 : 좌표를 컬럼에서 읽는다 */
						var asset
						if(typeof row.x != "undefined"){
							asset = [row.x * 1, row.z * 1]
						}else{
							var position = row.Cc.split(" #open")[0]
							asset = JSON.parse("["+position+"]")
						}
						var color = "black"
						if(!score_board[row.From]){
							score_board[row.From] = 0
						}
						score_board[row.From]++
						if(self_player.x == asset[0] && self_player.z == asset[1]){
							open = row
						}

						var y = -0.08

						var name = ""

						if(selector){
							if(selector.hash){
								if(selector.hash == row.From){
									name = "open"
								}
							}else{
								name = "open"
							}
						}

						var uProgress = 1

						if(!window.map.dissolve){
							window.map.dissolve = {}
						}

						if(window.players){
							if(!window.map.dissolve[(asset[0]+":"+asset[1])] && window.players.length){
								window.setDpr(0.8)
								frameloop = true
								name += " dissolve"

								uProgress = 0

								if(asset[0] == resp.body.query.x && asset[1] == resp.body.query.z){
									_messages.push(row)

									if(row.Flag){
										if(resp.body.body.cc == "chord" || resp.body.body.cc == "open"){
											window.emojis.self = "🤯"
										}
									}
								}
							}
						}

						if(uProgress){
							window.map.dissolve[(asset[0]+":"+asset[1])] = uProgress
						}

						if(name){
							window.map.open[(asset[0]+":"+asset[1])] = {
								id : row.Id,
								hash : row.From,
								name : name,
								value : "",
								color: color,
								x : asset[0],
								y : y,
								z : asset[1]
							}

							_assets.push({
								id : row.Id,
								hash : row.From,
								name : name,
								value : "",
								color: color,
								x : asset[0],
								y : y,
								z : asset[1]
							})
						}
					}
				}

				var $recommand = $('.deck .emojis .emoji_asset[method="recommand"]')

				if($recommand.length){
					$recommand.removeAttr("emoji")
				}


				var x = self_player.x
				var z = self_player.z

				if(Object.keys(window.map.follow).length){
					var follow_body = ''

					if(host_address.indexOf(cc_address) == -1){
						follow_body = '<li>\
							<div class="emoji_asset lounge" type="player" method="" hash="'+host_address.replace("0x","")+'">\
								<span class="address">\
									<address>\
										<strong>Lounge</strong>\
									</address>\
								</span>\
							</div>\
						</li>'
					}
						

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
					// $('.deck .follows .emoji_asset[hash="'+host_address+'"] canvas').remove()
					// $('.deck .follows .emoji_asset[hash="'+host_address+'"]').append(blockies.create({seed: host_address}))
				}

				if(Object.keys(score_board).length){
					var ranking = []

					for(var address in score_board){
						if(score_board.hasOwnProperty(address)) {
							var score = score_board[address]

							ranking.push({
								hash : address,
								score : score ? score : 0
							})
						}
					}

					ranking.sort(function (a, b) {return a.score - b.score});
					ranking.reverse()

					var score_body = ""

					for(var p = 0; p < ranking.length; p++){
						var rank = ranking[p]

						window.map.score[rank.hash] = {
							rank : (p+1),
							score: rank.score
						}

						var _hash = rank.hash.indexOf("0x") == 0 ? rank.hash.replace("0x","") : rank.hash

						score_body += '<li>\
							<div class="item" hash="'+rank.hash+'">\
								<div class="icon"></div>\
								<div class="address">\
									<address>\
										<span>'+_hash+'</span>\
										<span dir="rtl">'+_hash+'</span>\
										<rank>'+(p+1)+'</rank>\
										<score>'+rank.score+'</score>\
									</address>\
								</div>\
							</div>\
						</li>'
					}

					$("#rank ol").html(score_body)

					for(var p = 0; p < ranking.length; p++){
						var rank = ranking[p]

						var _hash = rank.hash.indexOf("0x") == 0 ? rank.hash.replace("0x","") : rank.hash

						$('#rank .item[hash="'+rank.hash+'"] .icon').append(blockies.create({seed: "0x"+_hash}))
					}
				}

				if(_players.length){
					var $capture = $("#capture")

					$("#capture .xyz .x").html(Math.floor(self_player.x))
					$("#capture .xyz .z").html(Math.floor(self_player.z))

					if(open){
						$capture.addClass("on")
						$("#capture>.icon").html(window.Blockie(open.From))
						/*
							개발 Part 14 (검수) - E7'
							scoreboard 가 없으면 scoreboard.rank 에서 TypeError 가 났다.
							window.map.score 는 랭킹 블록이 채우는데,
							open.From 이 랭킹에 없을 수 있다(자기 타일이 0개인 경우).
							기본값 0 으로 방어한다.
						*/
						var scoreboard = window.map.score[open.From]
						if(!scoreboard){
							scoreboard = { rank : 0, score : 0 }
						}
						$("#capture>.icon").append('<div class="address">\
							<span>'+open.From+'</span>\
							<span dir="rtl">'+open.From+'</span>\
							<rank>'+scoreboard.rank+'</rank>\
							<score>'+scoreboard.score+'</score>\
						</div>')
					}else{
						$capture.removeClass("on")
						var scoreboard = window.map.score["0x"+cc_address]
						if(!scoreboard){
							scoreboard = window.map.score[cc_address]
						}
						/*
							개발 Part 14 (검수) - E7'
							"0x"+cc_address 는 cc_address 가 빈 문자열일 때 "0x" 가 된다.
							Blockie 가 시드를 정규화하고 null 을 반환하지 않는다.
						*/
						$("#capture>.icon")
							.html(window.Blockie(cc_address))
							.append('<div class="address">\
								<span>'+cc_address+'</span>\
								<span dir="rtl">'+cc_address+'</span>\
								<rank>'+(scoreboard ? scoreboard.rank : "0")+'</rank>\
								<score>'+(scoreboard ? scoreboard.score : "0")+'</score>\
							</div>')
					}
				}
			}

			try{
				try{
					if(window.MapGen && window.MapGen.ready && self_player){
						var _size = 4
						var _biomeAssets = window.MapGen.assets(cc_address, {
							x : self_player.x,
							z : self_player.z
						}, _size)
						var _visible = []
						for(var _ai = 0; _ai < _assets.length; _ai++){
							var _a = _assets[_ai]
							if((_a.name + "").indexOf("#") === 0){
								_visible.push(_a)
								continue
							}
							var _pad = ((_a.name + "").indexOf("chord") === 0) ? 1 : 0
							if(_a.x < self_player.x - _size - _pad || _a.x > self_player.x + _size + _pad){
								continue
							}
							if(_a.z < self_player.z - _size - _pad || _a.z > self_player.z + _size + _pad){
								continue
							}
							var _ab = window.map.biomes[_a.x + ":" + _a.z]
							if(!_ab){
								continue
							}
							var _lift = 0.02
							var _an = _a.name + ""
							if(_an.indexOf("open") === 0){
								_lift = 0.14
							}else if(_an.indexOf("chord") === 0){
								_lift = 0.10
							}else if(_an.indexOf("flag") === 0){
								_lift = 0.18
							}
							_a.y = _ab.y + _lift
							_visible.push(_a)
						}
						_assets = _visible
						if(_biomeAssets.length){
							_assets = _biomeAssets.concat(_assets)
						}
					}
				}catch(err){
					console.log("room biome err",err);
				}
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

					if(_players.length){
						for(var a = 0; a < _players.length; a++){
							var _player = _players[a]

							var connected = false

							if(peers[_player.hash]){
								if(peers[_player.hash].iceConnectionState == "connected" && peers[_player.hash].connectionState == "connected"){
									connected = true
								}
							}

							var $player = $('emojis .deck .players .emoji_asset[hash="'+_player.hash+'"]')

							if(connected){
								$player.attr('connection', connection)
							}
						}
					}

					var $mode = $('input[name="mode"]:checked')
					var mode = $mode.val()

					$root
						.removeAttr("nth")
						.removeAttr("count")

					$('#root.fiber>div>div').removeClass("flex")

					var w = document.documentElement.scrollWidth
					var h = document.documentElement.scrollHeight

					$body
						.attr("mode", mode)
						.attr("axis", (w > h ? "x" : "y"))

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
						diff = true
						window.assets.set(_assets)
					}
				}


				if(diff || frameloop){
					window.setFrameloop("always")
				}else{
					window.setDpr(OAuth3.isMobile ? 0.8 : 1)
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

					delete window.map.recommand

					var $recommand = $('.deck .emojis .emoji_asset[method="recommand"]')
					if($recommand.length){
						$recommand.removeAttr("emoji")
					}
				}

				var $recommand = $('.deck .emojis .emoji_asset[method="recommand"]')

				if($recommand.length){
					if(open){
						if(window.map.puzzle && !window.map.recommand){
							if(window.map.puzzle[x+":"+z]){
								$recommand.html("")
							}else{
								var recommnads = []

								for(var _x = -1; _x < 2; _x++){
									for(var _z = -1; _z < 2; _z++){
										if(x == (x+_x) && z == (z+_z)){
											continue;
										}

										var puzzle = window.map.puzzle[(x+_x)+':'+(z+_z)]

										if(puzzle){
											recommnads.push(puzzle);	
										}
									}
								}

								if(recommnads.length){
									var li = ""

									var recommnad = ""

									for(var r = 0; r < recommnads.length; r++){
										var recommnad = recommnads[r]

										if(recommnad){
											var emoji = recommnad.value

											recommnad = emoji

											if(window.typeof_item(emoji)){
												if(window.map.item[emoji]){
													li = '<a class="emoji color">'+emoji+'</a>'
												}
											}else{
												li = '<a class="emoji color">'+emoji+'</a>'
											}
										}
									}

									$recommand.html(li)
									$recommand.attr("emoji", recommnad)
								}else{
									$recommand.html("")
								}
							}
						}
					}else if(!window.map.recommand){
						$recommand.html("")
					}
				}

				var stickerCnt = 1
				var rewardLength = Object.keys(window.map.reward).length
				var li = '<div draggable="false" class="emoji_asset" emoji="🎁" type="reward" balance="'+rewardLength+'"><a class="emoji color">🎁</a><span class="cnt">'+rewardLength+'</span></div>\
						<div draggable="false" class="emoji_asset" emoji="📦" type="item" method="open"><a class="emoji color">📦</a><span class="cnt">'+cookies.balance+'</span></div>'

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

				if(Object.keys(peers).length){
					for(var peer in peers){
						if(peers.hasOwnProperty(peer)) {
							
							var connect = connecting.find(function(c){
								if(c.connectionState){
									if(c.hash == peer.hash){
										return true
									}else{
										return false
									}
								}else{
									return true
								}
							});

							if(!connect){
								delete peers[peer.hash]
							}
						}
					}
				}

				
			}catch(err){
				// console.log("err",err);
			}

			setTimeout(function(){
				if(cookies.to){
					if(!$body.attr("bingo")){
						window.getTable("flows")
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

								if(player_hash.indexOf(_player_hash) > -1){
									var isPlayground = _player.emoji.indexOf("data:image") > -1

									if(isPlayground){
										if(_player.hash.toLowerCase().indexOf(cc_address) > -1){
											tooltip_body = '<li>\
												<a class="hashType Dialog '+(cookies.email ? 'verify' : '')+'">Dialog</a>\
											</li>\
											<li>\
												<a class="hashType Flow '+(cookies.email ? 'verify' : '')+'">Flow</a>\
											</li>\
											<li>\
												<a class="hashType Withdrawal '+(cookies.email ? 'verify' : '')+'">Withdrawal</a>\
											</li>'
										}else{
											tooltip_body = '<li>\
												<a class="hashType Portal">Portal</a>\
											</li>\
											<li></li>\
											<li></li>'
										}
										
									}else if(open){
										if(open.From == player_hash){
											$tooltip.addClass("open")
										}

										tooltip_body = '<li>\
											<a class="hashType Portal">Portal</a>\
										</li>\
										<li>\
											<a class="hashType Chord">Chord</a>\
										</li>\
										<li>\
											<a class="hashType Mine">Mine</a>\
										</li>'
									}else{
										tooltip_body = '<li>\
											<a class="hashType Flag">Flag</a>\
										</li>\
										<li>\
											<a class="hashType Chord">Chord</a>\
										</li>\
										<li>\
											<a class="hashType Open">Open</a>\
										</li>'
									}	
								}else{
									if(ethers.isAddress(_player.emoji)){
										if(_player.emoji == cc_address){
											tooltip_body = '<li>\
												<a class="hashType Dialog">Talk</a>\
											</li>\
											<li>\
												<a class="hashType Follow">Follow</a>\
											</li>\
											<li>\
												<a class="hashType Report">Report</a>\
											</li>'
										}else{
											tooltip_body = '<li>\
												<a class="hashType Portal">Portal</a>\
											</li>\
											<li>\
												<a class="hashType "></a>\
											</li>\
											<li>\
												<a class="hashType"></a>\
											</li>'
										}
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

										if(window.tutorial){
											if(window.tutorial.portal.indexOf(_player_hash) > -1){
												tooltip_body = '<li>\
													<a class="hashType Portal">Portal</a>\
												</li>\
												<li>\
													<a class="hashType "></a>\
												</li>\
												<li>\
													<a class="hashType"></a>\
												</li>'
											}
										}
									}
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

				if(props){
					if(props.length){
						var end = false

						for(var i = 0; i < props.length; i++){
							var prop = props[i]

							if(peers[prop.hash]){
								if(peers[prop.hash].oembed){
									plyrs[prop.hash] = peers[prop.hash]

									var $player = document.querySelector('[id="'+prop.hash+'"]')

									if($player){
										var $plyr = $player.querySelector('[id="'+prop.hash+'"] .plyr')

										var $thumb = $('emojis .deck .players .emoji_asset[hash="'+prop.hash+'"]')

										try{
											if(peers[prop.hash].emoji == prop.emoji){
												if(peers[prop.hash].seek != $plyr.querySelector('input[data-plyr="seek"]').value){
													$thumb.addClass("playing")
												}else{
													$thumb.removeClass("playing")
													delete peers[prop.hash].seek
												}

												peers[prop.hash].seek = $plyr.querySelector('input[data-plyr="seek"]').value * 1

												if(peers[prop.hash].seek > (OAuth3.localhost ? 99 : 99.5)){
													if(!peers[prop.hash].count){
														sessionStorage[prop.hash] = peers[prop.hash].count = 1
													}else{
														sessionStorage[prop.hash] = peers[prop.hash].count++
													}

													delete peers[prop.hash].seek

													end = peers[prop.hash]
												}
											}else{
												peers[prop.hash].destroy()

												$plyr.outerHTML = '<div data-plyr-provider data-plyr-embed-id></div>'
												$player.querySelector('picture').innerHTML = '<img src="'+prop.oembed.src+'">'

												$thumb.removeClass("playing")
												// delete peers[prop.hash].destroy
												delete peers.playing
												delete peers[prop.hash].seek
											}
										}catch(err){

										}
									}
								}
							}

							if(prop.oembed){
								plyrs.push(prop.hash)
								var video_selector = '[id="'+prop.hash+'"][alt="player"] [data-plyr-provider]'

								var $video_emoji = $(video_selector)

								var oembed = window.oembed(new URL(prop.emoji))

								if($video_emoji.length && !peers[prop.hash].oembed && (!peers.playing || prop.hash == peers.playing)){
									try{
										$('[id="'+prop.hash+'"][alt="player"]').attr("type","video")
										$video_emoji.attr("data-plyr-provider",prop.oembed.provider)
										$video_emoji.attr("data-plyr-embed-id",prop.oembed.id)

										// var autoplay = Object.keys(plyrs).length > 0 ? false : true

										var count = 0

										if(sessionStorage[prop.hash]){
											count = sessionStorage[prop.hash] * 1
										}else{
											sessionStorage[prop.hash] = 0
										}

										peers[prop.hash] = new Plyr(video_selector, {
											youtube: { noCookie: true },
											autoplay : true,
											muted : true,
											loop : {
												active : false
											},
											volume: 0
										});
										peers[prop.hash].play()
										peers[prop.hash].count = count
										peers[prop.hash].hash = prop.hash
										peers[prop.hash].emoji = prop.emoji
										peers[prop.hash].oembed = prop.oembed

										peers[prop.hash].Id = prop.Id
										peers[prop.hash].From = prop.From
										peers[prop.hash].To = prop.To
										peers[prop.hash].Cc = prop.Cc
										peers[prop.hash].Subject = prop.Subject
										peers[prop.hash].Flag = prop.Flag
										peers[prop.hash].Date = prop.Date
										peers.playing = prop.hash

										_messages.push(prop)


										
									}catch(err){
										console.log("err",err);
									}
								}

								var count = 0

								if(sessionStorage[prop.hash]){
									count = sessionStorage[prop.hash] * 1
								}else{
									sessionStorage[prop.hash] = 0
								}

								peers[prop.hash].count = count
								peers[prop.hash].hash = prop.hash
								peers[prop.hash].emoji = prop.emoji
								peers[prop.hash].oembed = oembed

								peers[prop.hash].Id = prop.Id
								peers[prop.hash].From = prop.From
								peers[prop.hash].To = prop.To
								peers[prop.hash].Cc = prop.Cc
								peers[prop.hash].Subject = prop.Subject
								peers[prop.hash].Flag = prop.Flag
								peers[prop.hash].Date = prop.Date
							}else{
								var type = ""
								var _url = ""

								try{
									_url = new URL(prop.emoji)
								}catch(err){

								}

								if(_url){
									if(window.location.host == _url.host){
										href = _url.href

										type = "portal"
									}else{
										var oembed = window.oembed(_url)

										if(oembed.provider){
											provider = oembed.provider
											embed = oembed.id
											
											type = "video"
										}else if(_url.href.indexOf(".gif") > -1 || _url.href.indexOf(".jpg") > -1 || _url.href.indexOf(".jpeg") > -1 || _url.href.indexOf(".png") > -1 || _url.href.indexOf(".webp") > -1){
											type = "image"
											src = _url.href
										}
									}
								}else{
									var animation = window.typeof_emoji(prop.emoji)

									if(animation){
										type = "image"
									}else{
										type = "text"
									}
								}

								$('[id="'+prop.hash+'"][alt="player"]').attr("type",type)
							}
						}

						if(end){
							try{
								delete peers.playing
								delete peers[end.hash].seek

								sessionStorage[end.hash] = end.count + 1

								var muted = end.muted

								end.destroy()

								var src = 'https://i.ytimg.com/vi/'+end.oembed.id+'/default.jpg'

								var $player = document.querySelector('[id="'+end.hash+'"]')
									$player.querySelector('picture').innerHTML = '<img src="'+src+'">'

								var $plyr = $player.querySelector('[id="'+end.hash+'"] .plyr')
								if($plyr){											
									$plyr.outerHTML = '<div data-plyr-provider data-plyr-embed-id></div>'
								}

								var $thumb = $('emojis .deck .players .emoji_asset[hash="'+end.hash+'"]')

								$thumb.removeClass("playing")

								// delete peers[end.hash].destroy


								var index = plyrs.indexOf(end.hash)

								if(plyrs[index+1]){
									prop = plyrs[plyrs[index+1]]
								}else{
									prop = plyrs[plyrs[0]]
								}
								
								try{
									var video_selector = '[id="'+prop.hash+'"][alt="player"] [data-plyr-provider]'

									var $video_emoji = $(video_selector)

									$('[id="'+prop.hash+'"][alt="player"]').attr("type","video")
									$video_emoji.attr("data-plyr-provider",prop.oembed.provider)
									$video_emoji.attr("data-plyr-embed-id",prop.oembed.id)
									

									peers[prop.hash] = new Plyr(video_selector, {
										youtube: { noCookie: true },
										autoplay : true,
										muted : muted,
										loop : {
											active : false
										},
										volume: muted ? 0 : 1
									});

									var count = 0

									if(sessionStorage[prop.hash]){
										count = sessionStorage[prop.hash] * 1
									}else{
										sessionStorage[prop.hash] = 0
									}
									peers[prop.hash].play()
									peers[prop.hash].count = count
									peers[prop.hash].hash = prop.hash
									peers[prop.hash].emoji = prop.emoji
									peers[prop.hash].oembed = prop.oembed

									peers[prop.hash].Id = prop.Id
									peers[prop.hash].From = prop.From
									peers[prop.hash].To = prop.To
									peers[prop.hash].Cc = prop.Cc
									peers[prop.hash].Subject = prop.Subject
									peers[prop.hash].Flag = prop.Flag
									peers[prop.hash].Date = prop.Date
									peers.playing = prop.hash

									_messages.push(prop)
								}catch(err){
									console.log("err",err);
								}
							}catch(err){
								console.log("Err",err);
							}
						}
					}
				}

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
									type : "player",
									self : row.From,
									hash : row.Id,
									x : asset[0],
									y : 0.5,
									z : asset[1],
									emoji : link
								})

								var playerProp = peers[row.Id]

								_players.cnt += 1

								if(!peers[row.Id]){
									peers[row.Id] = {
										hash : row.Id,
										id : oembed.id,
										provider : oembed.provider,
										emoji : link
									}
								}

								row.hash = row.Id
								row.oembed = oembed
								row.emoji = link
								row.x = assets[0]
								row.z = assets[1]

								if(playerProp){
									if(!playerProp.index && playerProp.emoji != self_player.emoji){
										props.push(row)
									}
								}else{
									props.push(row)
								}

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
																						var id = window.randomHash()
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

										window.RoomState.flows = flows
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
					var $form = document.querySelector('form[name="memepoly.com"]')

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
			}else if(isDialog != "dialog" && !Object.keys(window.com).length){
				$body.removeAttr("bingo")
			}
		}

		if(!window.Init.done["room"]){
			window.Init(cookies)
		}
		if(typeof window.Poll.ing == "undefined"){
			if(cookies.hash){
				if(window.dialog){
					if(OAuth3.xhr){
						if(OAuth3.xhr.query){
							if(OAuth3.xhr.query.to == "flows" || OAuth3.xhr.query.to == "form"){
								return
							}
						}
					}
				}

				window.Poll.ing = setInterval(window.Poll, 600)
			}else{
				window.location.href = OAuth3.host+"/logout"
			}
		}
	}catch(err){
		console.log("err",err);
	}
}

window.RoomPoll = async function(){
	try{
		var $body = $("body")
		var cookies = window.cookies
		var peers = window.RoomState.peers

		var self_player
		try{
			if(window.players){
				if(window.players.self){
					self_player = window.players.self()
				}
			}
		}catch(err){
			var player_hash = cookies.address ? cookies.address : cookies.hash
			window.players.set([{
				self : true,
				hash : player_hash,
				x : 1.5,
				y : 0.5,
				z : 1.5,
				emoji : "😀"
			}])

			try{
				self_player = window.players.self()
			}catch(err){
				// console.log("err",err);
			}
		}

		if(typeof self_player != "undefined"){
			if(cookies.hash && !OAuth3.xhr){
				var url = window.RoomUrl()

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

				try{
					var description = []
					for(var peer in peers){
						if(peers.hasOwnProperty(peer)) {
							var connection = peers[peer]
							if(!connection.oembed){
								if(connection.connectionState == "new" || connection.connectionState == "connecting" || connection.iceConnectionState == "disconnected" || connection.connectionState == "failed"){
									
								}else{
									
								}

								if(connection.index){
									if(connection.iceConnectionState == "disconnected" || connection.connectionState == "failed"){
										// console.log("연결 끊김");
										try{
											// if(localstream['getUserMedia'] && connection['getUserMedia']){
											// 	setStream(connection, 'getUserMedia')
											// }else if(localstream['getDisplayMedia'] && connection['getDisplayMedia']){
											// 	setStream(connection, 'getDisplayMedia')
											// }else{
											// 	delete peers[peer]
											// }

											description = false
										}catch(err){
											// console.log("err",err);
										}
									}else{
										var desc = {}

										if(connection.connectionState == "connecting"){
											if(peers[peer].count){
												if(peers[peer].count > 1){
													// console.log("연결 실패");
													try{
														// if(localstream['getUserMedia']){
														// 	setStream(connection, 'getUserMedia')
														// }else if(localstream['getDisplayMedia']){
														// 	setStream(connection, 'getDisplayMedia')
														// }else{
														// 	delete peers[peer]
														// }

														description = false
													}catch(err){
														// console.log("Err",err);
													}
												}
											}

											if(description){
												if(typeof peers[peer].count == "undefined"){
													peers[peer].count = 0
												}else{
													peers[peer].count++
												}
											}
										}

										if(description){
											if(connection.connectionState == "connected" && connection.signalingState == "stable"){

											}else{
												if(connection.pendingAnswerDescription){
													desc = connection.pendingAnswerDescription

												}else if(connection.pendingOfferDescription){
													desc = connection.pendingOfferDescription

												}

												desc = {
													sdp : desc.sdp ? desc.sdp : "",
													type : desc.type ? desc.type :"",
													hash : desc.hash ? desc.hash : "",
													flag : desc.flag ? desc.flag : ""
												}

												description.push(desc)
											}
										}
									}
								}
							}
						}
					}

					/*
						개발 Part 9
						SDP 큐와 candidate 큐를 합쳐 보낸다.
						candidate 는 SDP 를 기다리지 않고 즉시 전송된다.
						description 이 false 인 경우(연결 실패)에도 candidate 는 버린다.
					*/
					if(description){
						if(window.rtcQueue && window.rtcQueue.length){
							description = description.concat(window.rtcQueue)
							window.rtcQueue = []
						}
						if(description.length){
							body.description = JSON.stringify(description)
						}
					}else if(window.rtcQueue){
						window.rtcQueue = []
					}
					
				}catch(err){
					console.log("peer error",err);
				}

				var query = {
					href : window.location.href,
					hash : cookies.hash,
					token : cookies.token,
					x : self_player.x ? self_player.x : "1.5",
					y : self_player.y ? self_player.y : "0",
					z : self_player.z ? self_player.z : "1.5"
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

					}else if(Object.keys(window.com).length){
						_to = window.com.address * 1
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

window.RoomInit = function(cookies){
	var $body = $("body")
	var $aside = $(".aside")
	var $status = document.querySelector(".aside .status")
	var $go = $("#go")
	var $nav = $('input[id="nav"]')
	var $root = $('#root.fiber')

	var peers = window.RoomState.peers
	var localstream = window.RoomState.localstream

	var player_hash = cookies.address ? cookies.address : cookies.hash

	var setupBody = ''


	// if(hasWebcam || hasMicrophone){
		setupBody = '<form name="person">\
			<div class="mode">\
				<input name="mode" class="person_mode" type="radio" value="third" id="third" checked>\
				<label for="third">\
					<span>Third</span>\
				</label>\
				<input name="mode" class="person_mode" type="radio" value="first" id="first">\
				<label for="first">\
					<span>First</span>\
				</label>\
			</div>\
		</form>'
	// }
	if(!document.querySelector("#header nav ul.gnb")){
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
		</ul>'+setupBody;
	}

	if(!document.querySelector('#header nav form[name="person"]')){
		$("#header nav").append(setupBody)
	}

	if(Object.keys(window.com).length){
		$body.attr("mode", (window.com.mode ? window.com.mode : "third"))
		
		$('.person_mode').removeAttr("checked")
		$('.person_mode[value="'+window.com.mode+'"]').attr("checked","checked")
	}

	if(!document.querySelector('#header label[for="nav"] canvas')){
		var icon = blockies.create({seed: player_hash.indexOf("0x") > -1 ? player_hash : "0x"+player_hash});

		document.querySelector('#header label[for="nav"]').appendChild(icon);
	}

	window.ButtonDown

	window.leftButtonDown = false;
	window.rightButtonDown = false;

	var onMineSweeper = function(e) {
		if(window.Mode() != "room"){
			return
		}

		try{
			if(window.players){
				if(window.players.length){
					if(cookies.address || cookies.hash){
						var player = window.players.self()
						if(window.leftButtonDown && !window.rightButtonDown){
							window.leftButtonDown = false
							return
						}

						if(player.x == window.cursor.current.position.x && player.z == window.cursor.current.position.z && !open && window.rightButtonDown && window.leftButtonDown){
							return
						}

						var url = window.RoomUrl();

						var body = {
							emoji : window.emojis.self
						}

						var query = {
							href : window.location.href,
							hash : cookies.hash,
							token : cookies.token,
							x : window.cursor.current.position.x,
							z : window.cursor.current.position.z
						}

						var _assets = window.assets;

						var id = cookies.hash+"["+query.x+","+query.z+"]"

						var open = window.map.open[query.x+":"+query.z]

						if(window.rightButtonDown && window.leftButtonDown && open){
							// $('player[self="true"] .tooltip .Chord').click()
							body.cc = "chord"

							_assets.push({
								id : id,
								hash : player.hash,
								name : "chord",
								value : "",
								color: "yellow",
								x : window.cursor.current.position.x,
								y : -0.04,
								z : window.cursor.current.position.z
							})

						}else if(!open){
							// $('player[self="true"] .tooltip .Flag').click()

							body.cc = "flag"

							_assets.push({
								id : id,
								hash : player.hash,
								name : "flag",
								value : "",
								color: "orange",
								x : window.cursor.current.position.x,
								y : -0.08,
								z : window.cursor.current.position.z
							})

							window.rightButtonDown = false;
						}

						if(body.cc){
							window.RoomEmoji("🫥")

							if(OAuth3.xhr){
								OAuth3.xhr.abort()
								delete OAuth3.xhr
							}

							OAuth3.xhr = OAuth3.fetch({
								method : "POST",
								query : query,
								body : body,
								url : url
							}, window.Callback)

							window.assets.set(_assets)	
						}
					}
				}
			}
		}catch(err){

		}
			
	}

	$body.mousedown(function(e) {
		if(window.ButtonDown){
			clearTimeout(window.ButtonDown)
			delete window.ButtonDown

			window.leftButtonDown = false
			window.rightButtonDown = false
		}

		if(e.which == 1) {
			window.leftButtonDown = true;
		} else if (e.which == 3) {
			window.rightButtonDown = true;
		}
	});

	$body.mouseup(function(e) {
		onMineSweeper(e)

		window.ButtonDown = setTimeout(function(){
			if(e.which == 1) {
				window.leftButtonDown = false;
			} else if (e.which == 3) {
				window.rightButtonDown = false;
			}
			delete window.ButtonDown
		}, 10)
	});

	window.addEventListener('focus', function(){
		window.setFrameloop("always")
	})

	window.addEventListener('blur', function(){
		window.setFrameloop("demand")
	})

	window.addEventListener('change', function(e){
		if(window.Mode() != "room"){
			return
		}

		try{
			var $this = $(e.target)

			var $item = $this.closest("item")

			if($item.length){
				var value = $this.val()
				$item.find("label").text(value);
				$item.attr("checked","checked")
				$this.val("")

				window.RoomChat(window.RoomState.flows[window.dialog.index], value)
			}
		}catch(err){

		}
	})

	$body.on({
		click : async function(e){
			if(window.Mode() != "room"){
				return
			}
			var $this = $(e.target)
			/*
				개발 Part 17 (미니맵)
				마이룸에는 .voronoi 줌 토글 분기 자체가 없었다.
				(BoardInit 에만 있었고 그마저 e.target 정확 일치라 잘 먹지 않았다)
				players 유무와 무관한 UI 동작이므로 최상단에서 처리한다.
			*/
			var $voronoi = $this.closest(".voronoi")
			if($voronoi.length){
				if($voronoi.hasClass("zoom")){
					$voronoi.removeClass("zoom")
				}else{
					$voronoi.addClass("zoom")
				}
				setTimeout(function(){
					if(window.MapFocus){
						window.MapFocus()
					}
				}, 0)
				return
			}
			if(window.players){
				if(window.players.length){
					if(cookies.address || cookies.hash){
						var player = window.players.self()
						var $player = $('player[id="'+player.hash+'"][alt="player"]')
							var url = window.RoomUrl();

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

						if($this.hasClass("person_mode")){
							var mode = $this.val()

							$body.attr("mode", mode)

							$root
								.removeAttr("nth")
								.removeAttr("count")

							$('#root.fiber>div>div').removeClass("flex")

							var w = document.documentElement.scrollWidth
							var h = document.documentElement.scrollHeight

							$body
								.attr("mode", mode)
								.attr("axis", (w > h ? "x" : "y"))

							if(mode == "first"){
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

								var $emoji = $('.emoji[type="emoji"]')

								if(!$emoji.hasClass("on")){
									$emoji.click();
								}
							}
						}
						if($this.hasClass("skip") || $this.hasClass("tutorial")){
							e.preventDefault()

							$(".layer, .layer form.popup").removeClass("on")

							return
						}

						if($this.hasClass("plyr__poster")){
							var $$player = $this.closest("player")
							var hash = $$player.attr("id")

							var plyr = peers[hash]

							var currentTime = plyr.currentTime

							if($body.attr("tooltip")){
								$body.removeAttr("tooltip")
								$$player.find("tooltip").removeClass("on")
								
								$('.emoji_asset.playing').removeClass('playing')

								peers[hash].play()
								
								// if(OAuth3.isMobile){
								// 	peers[hash].play()
								// }else{
								// 	$$player.find("iframe")[0].contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*')
								// }
							}else{
								$body.attr("tooltip","true")
								$$player.find("tooltip").addClass("on")
								$$player.find("iframe")[0].contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*')
							}

							return
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

						if($this.closest("dialog").length){
							var $form = document.querySelector('form[name="oauth.network"]')

							if($form && $form.className.indexOf("contenteditable") == -1 && ($this.attr("type") == "flow" || $this[0].tagName == "ITEM" || $this.hasClass("datepicker")) && window.dialog){
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
										// window.dialog.index++
										window.RoomState.flows = flows
										
										if(window.dialog.index < flows.length){
											window.getTable('form', false, window.dialog.flow.response, flows)
										}else{
											// var callback = function(res){
											// 	if(OAuth3.xhr){
											// 		OAuth3.xhr.abort()
											// 		delete OAuth3.xhr
											// 	}

											// 	delete window.dialog

											// 	getTable("flows")
											// }

											// OAuth3.submit($form, callback)
										}
									}
								}
							}
						}

						if($this.hasClass("screen")){
							var $stream = $this.closest("stream")
							var $video = $stream.find("video")
							var video = $video[0]

							if($this.hasClass("full")){

								try {
									if(window.mode == "full"){
										$stream.removeAttr("mode")
										window.mode = ""
										await document.exitFullscreen()
									}else{
										$("#root stream").removeAttr("mode")
										$stream.attr("mode","full")
										window.mode = "full"
										await video.requestFullscreen()
									}
								} catch (err) {
									// console.log("err",err);
								}
							}

							// if($this.hasClass("wide")){
								
							// }
							
							if($this.hasClass("close")){
								var method = 'getDisplayMedia'
								var $$player = $this.closest("player")
								var id = $$player.attr("id")
								var created
								var connection = peers[id]

								if(connection){
									if(connection[method]){
										if(connection[method].method){
											created = true
											setStream(connection, method)
										}
									}
								}

								if(!created){
									setStream({}, method, true)
								}
							}

							// if($this.hasClass("mic")){
								
							// }

							if($this.hasClass("volume")){
								if($video.attr("muted")){
									$video.removeAttr("muted")
									$this.text("volume_up")
								}else{
									$video.attr("muted",true)
									$this.text("volume_off")
								}
							}

							if($this.hasClass("pip")){
								try {
									if(window.mode == "pip"){
										$stream.removeAttr("mode")
										window.mode = ""
										await document.exitPictureInPicture();
									}else{
										$("#root stream").removeAttr("mode")
										$stream.attr("mode","pip")
										window.mode = "pip"
										await video.requestPictureInPicture();
									}
								} catch (err) {
									// console.log("err",err);
								}
							}

							return
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
									window.Zoom()
								}

								var before = peers[peers.playing]

								if(focus != peers.playing){
									var prop = peers[focus]

									if(prop){
										if(prop.oembed){
											try{
												var $player = document.querySelector('[id="'+before.hash+'"]')

												var $plyr = $player.querySelector('[id="'+before.hash+'"] .plyr')

												try{
													before.destroy()
												}catch(err){
													console.log("Err",err);
												}

												$plyr.outerHTML = '<div data-plyr-provider data-plyr-embed-id></div>'
												$player.querySelector('picture').innerHTML = '<img src="'+before.oembed.src+'">'

												// delete peers[prop.hash].destroy
												delete peers.playing
												delete peers[before.hash].seek

												var $thumb = $('emojis .deck .players .emoji_asset[hash="'+before.hash+'"]')

												$thumb.removeClass("playing")
											}catch(err){
												// console.log("Err",err);
											}

											try{
												var video_selector = '[id="'+prop.hash+'"][alt="player"] [data-plyr-provider]'

												var $video_emoji = $(video_selector)


												$('[id="'+prop.hash+'"][alt="player"]').attr("type","video")
												$video_emoji.attr("data-plyr-provider",prop.oembed.provider)
												$video_emoji.attr("data-plyr-embed-id",prop.oembed.id)
												var count = 0

												if(sessionStorage[prop.hash]){
													count = sessionStorage[prop.hash] * 1
												}else{
													sessionStorage[prop.hash] = 0
												}

												peers[prop.hash] = new Plyr(video_selector, {
													youtube: { noCookie: true },
													autoplay : true,
													muted : false,
													loop : {
														active : false
													},
													volume: 1
												});
												peers[prop.hash].play()
												peers[prop.hash].count = count
												peers[prop.hash].hash = prop.hash
												peers[prop.hash].emoji = prop.emoji
												peers[prop.hash].oembed = prop.oembed

												peers[prop.hash].Id = prop.Id
												peers[prop.hash].From = prop.From
												peers[prop.hash].To = prop.To
												peers[prop.hash].Cc = prop.Cc
												peers[prop.hash].Subject = prop.Subject
												peers[prop.hash].Flag = prop.Flag
												peers[prop.hash].Date = prop.Date
												peers.playing = prop.hash

												// _messages.push(prop)

												var $playlist = $(".item.playlist")

												$playlist.attr("id",prop.hash)


												$playlist[0].outerHTML = '<li id="'+prop.Id+'" class="item playlist self">\
													<div class="thumb"><img src="'+prop.oembed.src+'"></div>\
													<div class="text">\
														<span class="icon" data-from="'+prop.From+'"></span>\
													</div>\
												</li>'

												var $icons = $("messages li .icon")

												if($icons.length){
													$icons.each(function(i, el){
														var hash = el.dataset.from

														var $icon = $icons.eq(i)

														try{
															$icon.find('canvas').remove()
															$icon.append(blockies.create({seed: "0x"+hash}))
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
															$icon.find('canvas').remove()
															$icon.append(blockies.create({seed: "0x"+hash}))
														}catch(err){

														}
													})						
												}
												var $messages = $("messages")

												$messages.addClass("on")

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
											}catch(err){
												// console.log("Err",err);
											}
										}
									}
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
									window.setDpr(0.8)
								}else{
									window.setDpr(1)
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

								window.RoomEmoji(window.emojis.self)
							}
							// 인벤토리
						}
						
						if($this.hasClass("message")){
							if($this.hasClass("close")){
								if(!Object.keys(window.com).length){
									if($body.attr("bingo") == "dialog"){
										if($('field[draggable="false"]').hasClass('image_enable')){
											$('field[draggable="false"]').removeClass('image_enable').removeAttr("style")
											$('field').removeClass("on")
											$('field flows').html("")

											return
										}

										if(OAuth3.xhr){
											OAuth3.xhr.abort()
											delete OAuth3.xhr
										}
										delete window.dialog

										$('form[name="oauth.network"]').removeClass("on")

										$body
											.removeAttr("class")
											.removeAttr("bingo")
										$("messages ul").html("")
									}
								}
								if($body.attr("bingo") == "notify"){
									$('form[name="oauth.network"]').removeClass("on")

									$body
										.removeAttr("class")
										.removeAttr("bingo")
								}
							// }

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

								if($this.hasClass("Send")){
									$body.addClass("sendbox")
									return
								}else if($this.hasClass("Portal")){
									var open = window.map.open[player.x+":"+player.z]

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
									}else if(open){
										body.emoji = player.emoji
										body.cc = "portal"
									}

								}else if($this.hasClass("Mine")){
									body.emoji = player.emoji
									body.cc = "puzzle"
									/*
										개발 Part 16 (마이룸 퍼즐)
										서버가 JSON 문자열 항목을 기대하므로 미리 직렬화한다.
									*/
									body.puzzles = window.RoomPuzzlePayload([{
										id : "",
										emoji : "💣",
										hash : player.hash,
										x : player.x,
										z : player.z
									}])
								}else if($this.hasClass("Chord")){
									body.cc = "chord"
								}else if($this.hasClass("Fire")){
									return
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

									if(cc_address == cookies.address){
										window.getTable("form",true)
									}else{
										window.getTable("flows")
									}
									return
								}else if($this.hasClass("Flow")){
									delete window.dialog

									if(cc_address == cookies.address){
										window.getTable("flows",true)
									}
									return
								}
							}catch(err){
								// console.log("err",err);
							}

							var id = cookies.hash+"["+player.x+","+player.z+"]"

							var _assets = window.assets;

							var diff = false

							if(body.cc == "chord"){
								diff = true
								
								_assets.push({
									id : id,
									hash : player.hash,
									name : "chord",
									value : "",
									color: "yellow",
									x : player.x,
									y : -0.04,
									z : player.z
								})
							}

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

							window.RoomEmoji("🫥")

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

									}else if(Object.keys(window.com).length){
										_to = window.com.address * 1
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
							window.Zoom()
							var open = window.map.open[(player.x+":"+player.z)]
							if(method == "recommand"){
								emoji = $this.text()
								method = ""

								if(window.typeof_item(emoji)){
									type = "item"
								}else{
									type = "emoji"
								}
							}

							var body = {
								emoji : window.typeof_emoji(emoji) ? emoji : window.emojis.self
							}

							var $talk = $("talks")
							var $messages = $("messages")

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

											var url = window.RoomUrl() + "/";

											var href = window.com.href ? window.com.href : window.location.href

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

												var _href = "https://memepoly.com/"+cookies.vapid

												if(!cookies.vapid){
													$('.emoji_asset[method="notify"]').removeClass("on")
												}

												if(OAuth3.isMobile){
													if(cookies.vapid){
														window.open(_href+"?referer="+encodeURIComponent(href),'_top','noreferrer')
													}else if(Object.keys(window.com).length){
														$body.attr('bingo','dialog')
														$aside.removeClass("on")
													}
												}else if(cookies.vapid){
													if(Object.keys(window.com).length){
														$body.attr('bingo','notify')
														$aside.addClass("on")
													}
													

													if(!document.querySelector("notify")){
														$body.append('<notify><input type="checkbox" id="notify"><div class="tb"><div class="tc"></div></div></notify>')
													}

													document.querySelector("notify .tc").innerHTML = '<form name="memepoly.com" action="javascript:Subscribe()">\
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
										if($this.hasClass("on")){
											$this.removeClass("on")
											// if(method == "getUserMedia"){
											// 	window.RoomEmoji(window.emojis.self, true)
											// }
											if(localstream[method]){
												// if(localstream[method].method){
												// 	method = localstream[method].method
												// }

												if(Object.keys(peers).length){
													for(var peer in peers){
														if(peers.hasOwnProperty(peer)) {
															var connection = peers[peer]

															if(connection){
																if(connection[method] && !connection.oembed){		
																	// var _method = method

																	if(connection[method].method){
																		setStream(connection, method)	
																	}
																}
															}
														}
													}
												}

												setStream({}, method, true)
											}
										}else{
											if(peers[player.hash]){
												if(peers[player.hash].destroy){
													try{
														peers[player.hash].destroy()
														$('[id="'+player.hash+'"] .plyr')[0].outerHTML = '<div data-plyr-provider data-plyr-embed-id></div>'
														// delete peers[player.hash].destroy
													}catch(err){
														console.log("Err",err);
													}
												}
											}

											var video = true

											var audio = true

											var _switch = false

											if($this.attr("emoji") == "mic"){
												video = false
											}

											if(localstream[method]){
												if(Object.keys(peers).length){
													for(var peer in peers){
														if(peers.hasOwnProperty(peer)) {
															var connection = peers[peer]

															if(connection){
																if(connection[method] && !connection.oembed){
																	delete peers[peer].method
																	
																	if(connection[method].method){
																		setStream(connection, method)
																	}
																}
															}
														}
													}
												}

												setStream({}, method, true)

												return
											}

											var enable = await getMedia(method, video, audio)

											if(enable){
												$(e.target).addClass("on")

												return
											}
										}

										

										return
									}
								}else{
									// if(peers[player.hash]){
									// 	if(peers[player.hash].destroy){
									// 		try{
									// 			peers[player.hash].destroy()
									// 			$('[id="'+player.hash+'"] .plyr')[0].outerHTML = '<div data-plyr-provider data-plyr-embed-id></div>'

									// 			// delete peers[player.hash].destroy
									// 		}catch(err){

									// 		}
									// 	}
									// }

									// if(Object.keys(localstream).length){
									// 	for(var method in localstream){
									// 		if(localstream.hasOwnProperty(method)) {
									// 			var $method = $('[method="'+method+'"].on')
												
									// 			if($method.length){
									// 				$method.click()
									// 			}
									// 		}
									// 	}
									// }
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
										window.RoomEmoji("🫥")
										
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
							}else if(open){
								if(method == "open"){
									window.RoomEmoji("🫥")
								}

								var piece = {
									id : "",
									value : method == "open" ? "📦" : emoji,
									hash : player.hash,
									x : player.x,
									z : player.z
								}

								body.cc = "puzzle"
								body.puzzles = []

								var bingo = []

								bingo.x = 1
								bingo.z = 1

								bingo._tr = 1
								bingo._tl = 1
								bingo._bl = 1
								bingo._br = 1

								var puzzles = JSON.stringify(window.map.puzzle)
									puzzles = JSON.parse(puzzles)

								puzzles[player.x+":"+player.z] = piece

								var bingoLimit = emoji == "😎" ? 1 : 2

								for(var _x = -2; _x < 3; _x++){
									for(var _z = -2; _z < 3; _z++){
										var puzzle = puzzles[((player.x+_x)+":"+(player.z+_z))]

										if(puzzle){
											if(emoji == puzzle.value || emoji == "😎"){
												if(_x == 0){
													// column
													var _puzzle = puzzles[(player.x+_x)+":"+(player.z+_z)]

													if(_puzzle){
														if(emoji == _puzzle.value || emoji == "😎"){
															if(bingo.x > bingoLimit){
																for(var i = _z - bingo.x; i <= _z; i++){
																	var puzl = puzzles[(player.x)+":"+(player.z+i)]

																	if(puzl){
																		if(!bingo[puzl.id] && (puzl.value == emoji || emoji == "😎")){
																			bingo[puzl.id] = true

																			puzl.emoji = puzl.value+""
																			delete puzl.value
																			delete puzl.name
																			body.puzzles.push(puzl)
																		}
																	}
																}
															}

															bingo.x++
														}
													}
												}

												if(_z == 0){
													// row
													var _puzzle = puzzles[(player.x+_x)+":"+(player.z+_z)]

													if(_puzzle){
														if(emoji == _puzzle.value || emoji == "😎"){
															if(bingo.z > bingoLimit){
																for(var i = _x - bingo.z; i <= _x; i++){
																	var puzl = puzzles[(player.x+i)+":"+(player.z)]

																	if(puzl){
																		if(!bingo[puzl.id] && (puzl.value == emoji || emoji == "😎")){
																			bingo[puzl.id] = true

																			puzl.emoji = puzl.value+""
																			delete puzl.value
																			delete puzl.name
																			body.puzzles.push(puzl)
																		}
																	}
																}
															}

															bingo.z++
														}
													}
												}

												if(
													(_x == 0 && _z == 0) ||
													(_x < 0 && _z < 0 && (_x == _z)))
												{
													// cross
													if(bingo._tl > bingoLimit){
														var len = bingo._tl 

														for(var i = _x - bingo._tl; i <= _x; i++){
															var puzl = puzzles[(player.x+i)+":"+(player.z+i)]

															if(puzl){
																if(!bingo[puzl.id] && (puzl.value == emoji || emoji == "😎")){
																	bingo[puzl.id] = true
																	
																	puzl.emoji = puzl.value+""
																	delete puzl.value
																	delete puzl.name
																	body.puzzles.push(puzl)
																}
															}
														}
													}

													bingo._tr++
													bingo._tl++
												}

												if(
													(_x == 0 && _z == 0) ||
													(_x > 0 && _z < 0 && (_x == Math.abs(_z)))
												){
													// cross
													if(bingo._tr > bingoLimit){
														var len = bingo._tr 
														for(var i = _x - bingo._tr; i <= _x; i++){
															var puzl = puzzles[(player.x-i)+":"+(player.z+i)]

															if(puzl){
																if(!bingo[puzl.id] && (puzl.value == emoji || emoji == "😎")){
																	bingo[puzl.id] = true
																	
																	puzl.emoji = puzl.value+""
																	delete puzl.value
																	delete puzl.name
																	body.puzzles.push(puzl)
																}
															}
														}
													}

													bingo._tr++
													bingo._tl++
												}

												if(
													(_x == 0 && _z == 0) ||
													(_x > 0 && _z > 0 && (_x == _z))
												){
													// cross
													if(bingo._br > bingoLimit){
														var len = bingo._br 
														for(var i = _z - bingo._br; i <= _z; i++){
															var puzl = puzzles[(player.x-i)+":"+(player.z-i)]

															if(puzl){
																if(!bingo[puzl.id] && (puzl.value == emoji || emoji == "😎")){
																	bingo[puzl.id] = true
																	
																	puzl.emoji = puzl.value+""
																	delete puzl.value
																	delete puzl.name
																	body.puzzles.push(puzl)
																}
															}
														}
													}

													bingo._br++
													bingo._bl++
												}

												
												if(
													(_x == 0 && _z == 0) ||
													(_x < 0 && _z > 0 && (Math.abs(_x) == _z))
												){
													// cross
													if(bingo._bl > bingoLimit){
														var len = bingo._bl 
														for(var i = _z - bingo._bl; i <= _z; i++){
															var puzl = puzzles[(player.x+i)+":"+(player.z-i)]

															if(puzl){
																if(!bingo[puzl.id] && (puzl.value == emoji || emoji == "😎")){
																	bingo[puzl.id] = true
																	
																	puzl.emoji = puzl.value+""
																	delete puzl.value
																	delete puzl.name
																	body.puzzles.push(puzl)
																}
															}
														}
													}

													bingo._br++
													bingo._bl++
												}
											}
										}
									}
								}

								if(body.puzzles.length){
									if(typeof piece.emoji == "undefined" && typeof piece.value != "undefined"){
										/*
											개발 Part 16 (마이룸 퍼즐)
											빙고가 성립한 경로에서는 piece 가 value 를 유지한 채였다.
											아래 프리뷰 타일이 value:undefined 로 그려져
											조각이 잠깐 비어 보였다.
										*/
										piece.emoji = piece.value + ""
										delete piece.value
									}
									var _assets = window.assets;
									_assets.push({
										id : "",
										hash : piece.hash,
										name : "puzzle",
										value : piece.emoji,
										color: false,
										x : piece.x,
										y : 0,
										z : piece.z
									})
									// var assets_ = JSON.stringify(_assets)
									window.assets.set(_assets)
								}else if(body.puzzles.length == 0){
									piece.emoji = piece.value+""
									delete piece.value
									
									body.puzzles = [piece]
								}
								/*
									개발 Part 16 (마이룸 퍼즐)
									전송 직전에 항목을 JSON 문자열로 직렬화한다.
									서버 room.js 의 puzzle 분기가 문자열을 파싱하도록 되어 있어
									객체를 그대로 보내면 파싱 실패로 배열이 통째로 비워졌다.
									(오픈 타일에서 이모지를 골라도 기록되지 않던 원인)
								*/
								body.puzzles = window.RoomPuzzlePayload(body.puzzles)

								if(type == "emoji"){
									if(emoji == "😎"){													
										window.RoomEmoji(emoji, true)
										window.emojis.self = player_emoji
									}else if(body.puzzles.length == 0){
										window.RoomEmoji(emoji)
										return
									}else{
										body.emoji = emoji
										
										window.RoomEmoji(emoji, true)
										window.emojis.self = emoji
									}
								}

								var query = {
									href : window.location.href,
									hash : cookies.hash,
									token : cookies.token,
									x : player.x,
									z : player.z
								}


								if($body.attr("bingo") == "dialog"){
									var _to = ""

									if(window.dialog){
										_to = window.dialog.to
										if(window.cookies.to){
											_to = window.cookies.to
										}else{
											_to = window.dialog.to
										}

										_to = (_to.indexOf("0x") == 0 ? _to : "0x"+_to) * 1

									}else if(Object.keys(window.com).length){
										_to = window.com.address * 1
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
											query.href = "http://" + OAuth3.localhost +"/"+ _address.replace("0x","#")
										}else{
											query.href = window.location.origin +"/"+ _address.replace("0x","#")
										}

										query.to = _address
									}
								}

								player = window.players.self()

								
								$body.attr("bingo", Object.keys(window.com).length ? "dialog" : true)
								$body.removeAttr("class")

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
										query : query,
										body : body,
										url : url
									}, window.Callback);
								}
							}else{
								if(method == "open"){
									body.open = "true"

									window.RoomEmoji("🫥")

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
										
										window.RoomEmoji(emoji)
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
			if(window.Mode() != "room"){
				return
			}

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

					var _islandMode = (window.MapGen && window.MapGen.ready) ? true : false
					var edge = _islandMode ? (1000000000000000000 / 2) + 1 : (window.grid.edge / 2) + 1
					var $go = $("#go")
					if(_islandMode){
						var _nb = window.map.biomes[player.x + ":" + player.z]
						if(!_nb){
							return
						}
						if(_nb.water){
							return
						}
						player.y = _nb.y
					}
					if(player.x < edge && player.x > -edge && player.z < edge && player.z > -edge){
						if(window.camera){
							if(window.camera.hash){
								if(window.camera.hash != player.hash){
									window.camera.set({})
								}
							}
						}

						if(_islandMode){
							window[player.hash].position.y = player.y + 0.5
							window.current.current.position.y = player.y + 0.01
							window.cursor.current.position.y = player.y + 0.01
						}
						window[player.hash].position.x = window.current.current.position.x = window.cursor.current.position.x = player.x
						window[player.hash].position.z = window.current.current.position.z = window.cursor.current.position.z = player.z
						if(window.map.open){
							var open = window.map.open[player.x+":"+player.z]

							var $capture = $("#capture")

							$("#capture .xyz .x").html(Math.floor(player.x))
							$("#capture .xyz .z").html(Math.floor(player.z))

							var $recommand = $('.deck .emojis .emoji_asset[method="recommand"]')

							if(open){
								$capture.addClass("on")
								$("#capture>.icon").html(blockies.create({seed: "0x"+open.hash}))

								var scoreboard = window.map.score[open.hash]

								$("#capture>.icon").append('<div class="address">\
									<span>'+open.hash+'</span>\
									<span dir="rtl">'+open.hash+'</span>\
									<rank>'+scoreboard.rank+'</rank>\
									<score>'+scoreboard.score+'</score>\
								</div>')

								if(window.map.puzzle[player.x+":"+player.z]){
									$recommand.html("")
								}else{
									if(window.map.puzzle){
										var recommnads = []

										for(var _x = -1; _x < 2; _x++){
											for(var _z = -1; _z < 2; _z++){
												if(player.x == (player.x+_x) && player.z == (player.z+_z)){
													continue;
												}

												var puzzle = window.map.puzzle[(player.x+_x)+':'+(player.z+_z)]

												recommnads.push(puzzle);
											}
										}

										if(recommnads.length){
											var li = ""

											for(var r = 0; r < recommnads.length; r++){
												var recommnad = recommnads[r]

												if(recommnad){
													var emoji = recommnad.value

													if(emoji){
														if(window.typeof_item(emoji)){
															if(window.map.item[emoji]){
																li = '<a class="emoji color">'+emoji+'</a>'
															}
														}else{
															li = '<a class="emoji color">'+emoji+'</a>'
														}
													}
												}
											}

											$recommand.html(li)
										}else{
											$recommand.html("")
										}
									}
								}
							}else{
								$recommand.html("")
								$capture.removeClass("on")
								$("#capture>.icon").html('')
								

								if($capture.hasClass("open_rank")){
									$capture.click()
								}
							}

							var $player = $('player[id="'+player.hash+'"][alt="player"]')
							var $tooltip = $player.find("tooltip ul");
								$tooltip.removeClass("open")

							if(player.hash == cookies.hash || player.hash == cookies.address){
								if(open){
									if(open.hash == player.hash){
										$tooltip.addClass("open","true")
									}

									// Random

									$tooltip.html('<li>\
										<a class="hashType Portal">Portal</a>\
									</li>\
									<li>\
										<a class="hashType Chord">Chord</a>\
									</li>\
									<li>\
										<a class="hashType Mine">Mine</a>\
									</li>')
								}else{
									$tooltip.html('<li>\
										<a class="hashType Flag">Flag</a>\
									</li>\
									<li>\
										<a class="hashType Chord">Chord</a>\
									</li>\
									<li>\
										<a class="hashType Open">Open</a>\
									</li>')
								}
									
							}else{
								// Random
								$tooltip.html('<li>\
									<a class="hashType Portal">Portal</a>\
								</li>\
								<li>\
									<a class="hashType Follow">Follow</a>\
								</li>\
								<li>\
									<a class="hashType Report">Report</a>\
								</li>')
							}
						}


						if(window.tutorial){
							if(window.tutorial.name == "Move" && window.tutorial.step == 1){
								window.Tutorial(2)
							}
						}
					}

					var _edge = _islandMode ? ((1000000000000000000 / 2) - 1) : (( window.grid.edge / 2 ) - 1)
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
		if(window.Mode() != "room"){
			return
		}

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

	window.RoomChat = function(flow, date){
		var player = window.players.self()
		var len = window.players.length
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

				}else if(Object.keys(window.com).length){
					_to = window.com.address * 1
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
						
						if(window.RoomState.flows[window.dialog.index+1]){
							body.flow = JSON.stringify(window.RoomState.flows[window.dialog.index+1])
							_dialog = JSON.stringify(flow)
							_dialog = JSON.parse(_dialog)
						}else{
							_dialog = JSON.stringify(window.RoomState.flows[window.dialog.index])
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

			var url = window.RoomUrl();

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

	if(!OAuth3.isMobile){
		window.emojis.unshift({
			method : "getDisplayMedia",
			icon : "cast",
			type : "emoji"
		})
	}

	window.emojis.unshift({
		method : "chat",
		icon : "chat",
		type : "emoji"
	})

	if(Object.keys(window.com).length){
		window.emojis.unshift({
			method : "notify",
			icon : "notifications",
			type : "emoji"
		})
	}

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
}

window.RoomHashChange = function(e){
	var cookies = window.cookies

	var $body = $("body")
	var $nav = $('input[id="nav"]')
	var $status = document.querySelector(".aside .status")
	var $go = $("#go")

	document.scrollingElement.scrollTop = 0
	window.MapReset()
	if(window.MapGen){
		window.MapGen.ready = false
		/*
			개발 Part 16 (미니맵)
			룸이 바뀌면 이전 섬의 base64 는 무효다.
			캐시를 비워야 apply(true) 이후 sync() 가 새 섬을 그린다.
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
	if(window.FieldsSync){
		window.FieldsSync(true)
	}
	delete window.dialog

	$body
		.removeAttr("class")
		.removeAttr("bingo")
		.removeAttr("chat")
		.addClass("loading")

	var $form = $('form[name="oauth.network"]')
	$form.removeClass("on")

	if(window.RoomState.form_template.length > 0){
		$form[0].outerHTML = window.RoomState.form_template
	}

	$nav.prop("checked",false)

	$('messages ul, #rank ol, #capture>.rank_toggle, talks ul').html("")

	var address = window.location.hash.replace("#","0x")

	var player

	try{
		player = window.players.self()
	}catch(err){
		player = {
			hash : cookies.address ? cookies.address : cookies.hash
		}
	}

	var _host_url = new URL(window.location.href)

	var host_address = ethers.hashMessage((_host_url.host+"/"))
		host_address = ethers.computeAddress(host_address).toLowerCase()

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
		$("#intro .coptyright p").html('Lounge')
	}

	if(OAuth3.xhr){
		OAuth3.xhr.abort()
		delete OAuth3.xhr
	}

	clearInterval(window.Poll.ing)
	window.Poll.ing = setInterval(window.Poll, 600)

	$go.referer = true

	if(Object.keys(peers).length){
		var stream_connection = false

		for(var peer in peers){
			if(peers.hasOwnProperty(peer)) {
				var connection = peers[peer]

				if(connection){
					if(connection.oembed){
						if(connection.destroy){
							connection.destroy()
						}
					}else if(connection["getDisplayMedia"] || connection["getUserMedia"]){
						stream_connection = true

						if(localstream["getDisplayMedia"]){
							setStream(connection, "getDisplayMedia")
						}

						if(localstream["getUserMedia"]){
							setStream(connection, "getUserMedia")
						}
					}
				}
			}
		}

		if(!stream_connection){
			if(localstream["getDisplayMedia"]){
				setStream({}, "getDisplayMedia", true)
			}

			if(localstream["getUserMedia"]){
				setStream({}, "getUserMedia", true)
			}
		}

		for(var peer in peers){
			if(peers.hasOwnProperty(peer)) {
				delete peers[peer]
			}
		}
	}

	$status.innerHTML = '<div class="loading">\
		<strong>Loading...</strong>\
	</div>'

	setTimeout(function(){
		window.speed = 0.1

		window.camera.set({})

		var _rp = { x : 1.5, y : 0.5, z : 1.5 }
		try{
			if(window.MapGen && window.MapGen.ready && window.fields && window.fields.length){
				var _rr, _rb
				for(var _ri = 0; _ri < window.fields.length; _ri++){
					_rr = window.fields[Math.floor(Math.random() * window.fields.length)]
					_rb = window.map.biomes[_rr.x + ":" + _rr.z]
					if(_rb && !_rb.water){
						break
					}
				}
				if(_rr && _rb){
					_rp = { x : _rr.x, y : _rb.y, z : _rr.z }
				}
			}
		}catch(err){
		}
		window.players.set([{
			follow : false,
			self : true,
			type : "player",
			hash : cookies.address ? cookies.address : cookies.hash,
			emoji : window.emojis.self ? window.emojis.self : "😀",
			x : _rp.x,
			y : _rp.y + 0.5,
			z : _rp.z
		}])
		window.assets.set([])
		window.setFrameloop("always")
		/*
			개발 Part 18 (스폰)
			룸이 바뀌면 좌표계가 통째로 갈린다. 즉시 배치한다.
		*/
		window.Snap = 8
		try{
			window.current.current.position.x = window.cursor.current.position.x = _rp.x
			window.current.current.position.y = window.cursor.current.position.y = _rp.y + 0.01
			window.current.current.position.z = window.cursor.current.position.z = _rp.z
			if(window[player.hash]){
				window[player.hash].position.x = _rp.x
				window[player.hash].position.y = _rp.y + 0.5
				window[player.hash].position.z = _rp.z
			}
		}catch(err){
		}

		delete window.response
	}, 2000)
}