import { Html, Text } from "@react-three/drei";

import * as THREE from "three";
import { useLoader } from "@react-three/fiber";

import { DissolveMaterial } from "./DissolveMaterial";

var hasDissolve = true

try{
	if(typeof DissolveMaterial != "function"){
		hasDissolve = false
	}
}catch(err){
	hasDissolve = false
}

export function RoomAsset(props){
	var href = "";
	var src = "";

	var rotation_x = -Math.PI / 2

	if(props.name == "asset"){
		rotation_x = 0
	}

	if(props.name == "puzzle"){
		var hex = props.value.codePointAt(0).toString(16)

		src = `/src/fonts/emoji/emoji_u${hex}.png`
	}else if(props.name == "mine"){
		src = '/src/fonts/emoji/emoji_u1f4a3.png'
	}

	const texture = useLoader(THREE.TextureLoader, src ? src : '/src/fonts/emoji/emoji_u1f4a3.png')

	if(props.name.indexOf("open") > -1){
		var color = ""

		var selector = window.selector

		if(selector){
			if(selector.hash){
				if(selector.hash == props.hash){
					color = props.color
				}
			}else{
				color = props.color
			}
		}else{
			color = props.color
		}

		if(!color){
			return <>
				<group position={props.position}>
					<group></group>
				</group>
			</>
		}

		if(props.name.indexOf("dissolve") > -1 && hasDissolve){
			return <>
				<mesh rotation-x={rotation_x} position={props.position}>
					<planeGeometry attach="geometry" args={[0.9, 0.9]} />
					<DissolveMaterial color={props.color} position={props.position} />

					<Text rotation-z={Math.PI / 0.0815} fontSize={0.5} position={[0, 0, 0.1]} color={props.color}>{props.value}</Text>
				</mesh>
			</>
		}

		return <>
			<mesh rotation-x={rotation_x} position={props.position}>
				<planeGeometry attach="geometry" args={[0.9, 0.9]} />
				<meshStandardMaterial attach="material" color={props.color} />

				<Text rotation-z={Math.PI / 0.0815} fontSize={0.5} position={[0, 0, 0.1]} color={props.color}>{props.value}</Text>
			</mesh>
		</>
	}

	if(props.name == "chord"){
		return <>
			<mesh rotation-x={rotation_x} position={props.position}>
				<planeGeometry attach="geometry" args={[2.9, 2.9]} />
				<meshStandardMaterial attach="material" color={props.color} />
			</mesh>
		</>
	}

	if(props.name == "flag"){
		return <>
			<mesh rotation-x={rotation_x} position={props.position}>
				<planeGeometry attach="geometry" args={[0.9, 0.9]} />
				<meshStandardMaterial attach="material" color={props.color} />

				<Text rotation-z={Math.PI / 0.0815} fontSize={0.5} position={[0, 0, 0.1]} color="#fff">?</Text>
			</mesh>
		</>
	}

	if(props.name == "tutorial"){
		return <>
			<mesh rotation-x={rotation_x} position={props.position}>
				<planeGeometry attach="geometry" args={[0.9, 0.9]} />
				<meshStandardMaterial attach="material" color={props.color} />

				<Text rotation-z={Math.PI / 0.0815} fontSize={0.5} position={[0, 0, 0.1]} color="#fff">!</Text>
			</mesh>
		</>
	}

	if(props.name == "puzzle" || props.name == "mine"){
		return <>
			<group rotation-x={rotation_x} position={props.position}>
				<mesh rotation-z={Math.PI / 0.0815} position={[0, 0, 0.005]}>
					<planeGeometry attach="geometry" args={[0.5, 0.5]} />
					<meshBasicMaterial attach="material" map={texture} transparent />
				</mesh>
				<Html className="clipped">
					<div className="emoji color" x={props.position.x} z={props.position.z}>{props.value}</div>
				</Html>
			</group>
		</>
	}

	return <>
		<group position={props.position}>
			<group>
				<Html>
					<div className="asset" href={href} src={src}>
						<span className="emoji color">0</span>
					</div>
				</Html>
			</group>
		</group>
	</>
}

export function RoomGrid(props){
	var grid = window.grid

	return <>
		<fog attach="fog" args={["#333", 4, 14]} />

		<mesh>
			<gridHelper onClick={props.onClick} args={[grid.x, grid.z, grid.center, grid.line]} />
		</mesh>
	</>
}

window.RoomPoint = {}
/*
	개발 Part 79 (마이룸 섬 좌표계)
	현행 문제
	  RoomClick 은 레거시 40칸 격자를 전제로 좌표를 자른다.
	    var edge = (grid.edge / 2) + 1
	  window.grid.edge 는 src/index.js 에서 10 - 1 = 9 로 고정이므로
	  edge 는 5.5 다. 즉 모든 클릭이 |x| <= 5.5, |z| <= 5.5 로 잘린다.
	  그런데 마이룸은 이미 섬(voronoi) 모드로 전환됐다.
	  RoomCallback 의 스폰 로직이 window.fields 에서 좌표를 뽑으므로
	  실제 스폰은 x=3.5, z=-19.5 같은 값이다.
	  그 자리에서 발밑을 눌러도 z 가 -5.5 로 잘려
	    첫 클릭   커서만 엉뚱한 곳으로 날아가고 return
	    두 번째   순간이동하거나 좌표 동일 판정에 걸려 아무 일도 없다
	  "마이룸에서 필드를 클릭해도 안 움직인다" 의 직접 원인이다.
	결정적 증거
	  src/room.js 의 조이스틱은 같은 이동인데 섬 모드로 갱신돼 있다.
	    var _islandMode = (window.MapGen && window.MapGen.ready) ? true : false
	    var edge = _islandMode ? (1000000000000000000 / 2) + 1 : (window.grid.edge / 2) + 1
	  조이스틱만 고치고 클릭 경로를 빠뜨렸다.
	  그래서 "조이스틱으로는 되는데 클릭으로는 안 된다" 가 된다.
	조치
	  판정을 조이스틱과 동일하게 맞춘다.
	    섬 모드   클램프를 사실상 해제하고 바이옴으로 판정한다
	    격자 모드 기존 클램프를 그대로 유지한다(튜토리얼 / MapGen 미준비)
	  높이(y)와 물 판정도 조이스틱과 같게 맞춘다.
	  현행은 x / z 만 옮겨 캐릭터가 지형에 파묻히거나 떴고,
	  바다로 걸어 들어가는 것도 막지 않았다.
*/
window.RoomIsland = function(){
	try{
		if(!window.MapGen || !window.MapGen.ready){
			return false
		}
		if(!window.map || !window.map.biomes){
			return false
		}
		return true
	}catch(err){
		return false
	}
}
window.RoomEdge = function(){
	/*
		이동 가능 한계.
		섬 모드에서는 바운딩 박스로 막지 않는다.
		실제 경계는 바이옴 유무(바다 / 미생성)가 정한다.
		src/room.js 조이스틱이 쓰는 값과 동일하게 둔다.
	*/
	if(window.RoomIsland()){
		return (1000000000000000000 / 2) + 1
	}
	return (window.grid.edge / 2) + 1
}
window.RoomClick = function(e){
	window.setFrameloop("always")
	var cookies = window.cookies
	if(window.leftButtonDown && window.rightButtonDown){
		return
	}
	var $body = $("body")
	var grid = window.grid
	var cursor = window.cursor
	var current = window.current
	var point = window.RoomPoint
	/*
		개발 Part 79 (사망 오버레이 자가 복구)
		Experience.jsx 개발 Part 69 의 클릭 게이트는
		  body[myroom] / body[panel] / body[dead] / body[stage]
		중 하나라도 서 있으면 3D 클릭을 통째로 무시한다.
		사망 후 마이룸으로 들어오면 body[dead] 가 남아
		여기까지 호출이 오지 않는다(개발 Part 78 에서 진입 시점에 정리한다).
		그래도 호출이 왔다는 것은 게이트를 통과했다는 뜻이므로,
		룸 모드에서 남아 있는 보드 전용 오버레이를 여기서 한 번 더 내린다.
		늦게 도착한 보드 응답이 다시 세우는 경로를 막는 최종 방어선이다.
	*/
	try{
		if(typeof $body.attr("dead") !== "undefined" ||
			typeof $body.attr("game") !== "undefined"){
			$body
				.removeAttr("dead")
				.removeAttr("game")
				.removeAttr("stage")
			$("#dead, #lobby, #raid").removeClass("on")
			if(window.DeadClose){
				window.DeadClose()
			}
			console.log("[room] board overlay cleared on click")
		}
	}catch(err){
	}
	try{
		var player = window.players.self()
		if(e.point){
			/*
				개발 Part 79 (마이룸 섬 좌표계)
				격자 모드에서만 기존 클램프를 적용한다.
				섬 모드에서 이 클램프를 태우면 스폰 좌표(예 z=-19.5)가
				-5.5 로 잘려 커서가 엉뚱한 곳으로 날아간다.
			*/
			var _island = window.RoomIsland()
			if(!_island){
				if(e.point.x > 0){
					if(e.point.x >= (grid.edge / 2) - 0.5){
						e.point.x = (grid.edge / 2) - 1
					}
				}
				if(e.point.z > 0){
					if(e.point.z >= (grid.edge / 2) - 0.5){
						e.point.z = (grid.edge / 2) - 1
					}
				}
				var edge = window.RoomEdge()
				if(e.point.x > edge){
					e.point.x = edge
				}
				if(e.point.x < -edge){
					e.point.x = -edge
				}
				if(e.point.z > edge){
					e.point.z = edge
				}
				if(e.point.z < -edge){
					e.point.z = -edge
				}
			}
			point = window.RoomPoint = new THREE.Vector3().copy(e.point).round().addScalar(0.5)

			if(window.map.open){
				var recommand

				var open = window.map.open[player.x+":"+player.z]

				if(open){
					var puzzle = window.map.puzzle[point.x+":"+point.z]

					if(puzzle){
						var typeof_emoji = window.typeof_emoji(puzzle.value)

						if(typeof_emoji){
							recommand = puzzle.value
						}

						var typeof_item = window.typeof_item(puzzle.value)

						if(typeof_item){
							if(window.map.item[puzzle.value]){
								recommand = puzzle.value
							}
						}
					}
				}

				var $recommand = $('.deck .emojis .emoji_asset[method="recommand"]')

				if(recommand){
					window.map.recommand = recommand

					$recommand.html('<a class="emoji color">'+recommand+'</a>')
				}else{
					delete window.map.recommand
					$recommand.removeAttr("emoji")

					var emoji = $recommand.attr("emoji")

					if(emoji){
						$recommand.html('<a class="emoji color">'+emoji+'</a>')
					}
				}
			}

			window.setFrameloop("demand")

			return
		}

		if(e.target.tagName != "CANVAS"){
			return
		}

		if(typeof point.x == "undefined" || typeof point.z == "undefined"){
			return
		}
		/*
			개발 Part 79 (마이룸 섬 좌표계)
			섬 모드에서는 갈 수 없는 칸을 커서 단계에서 막는다.
			  바이옴 없음  아직 생성되지 않은 좌표. 밟으면 y 를 알 수 없다
			  water        바다. 조이스틱은 이미 같은 판정을 한다
			    if(!_nb){ return }
			    if(_nb.water){ return }
			커서에서 막는 이유
			  아래 이동 분기는 "커서와 플레이어가 같은 칸" 일 때만 실행된다.
			  커서를 옮긴 뒤 이동에서 막으면 커서만 바다에 남아
			  "빨간 칸을 가리키는데 안 간다" 가 된다.
		*/
		var _roomIsland = window.RoomIsland()
		var _roomBiome = null
		if(_roomIsland){
			try{
				_roomBiome = window.map.biomes[point.x + ":" + point.z]
			}catch(err){
				_roomBiome = null
			}
			if(!_roomBiome){
				return
			}
			if(_roomBiome.water){
				return
			}
		}
		if(cursor.current.position.x != point.x || cursor.current.position.z != point.z){
			cursor.current.position.x = point.x
			cursor.current.position.z = point.z
			if(_roomBiome && typeof _roomBiome.y !== "undefined"){
				cursor.current.position.y = (_roomBiome.y * 1) + 0.01
			}
			return
		}

		if(!cookies.hash || !window.players.length){
			return
		}

		if(player.x == cursor.current.position.x && player.z == cursor.current.position.z){
			return
		}

		if(window.camera){
			if(window.camera.hash){
				if(window.camera.hash != player.hash){
					window.camera.set({})
				}
			}
		}

		/*
			개발 Part 79 (마이룸 섬 좌표계)
			현행은 x / z 만 옮겼다.
			격자 모드에서는 지면이 평평해 문제가 없었지만
			섬 모드는 칸마다 표고가 다르므로 캐릭터가 파묻히거나 뜬다.
			src/room.js 조이스틱과 동일한 오프셋을 쓴다.
			  플레이어 메시  y + 0.5
			  current        y + 0.01
			  cursor         y + 0.01
		*/
		if(_roomIsland && _roomBiome && typeof _roomBiome.y !== "undefined"){
			var _ry = _roomBiome.y * 1
			window[player.hash].position.y = _ry + 0.5
			current.current.position.y = _ry + 0.01
			cursor.current.position.y = _ry + 0.01
		}
		window[player.hash].position.x = current.current.position.x = point.x
		window[player.hash].position.z = current.current.position.z = point.z
		var $recommand = $('.deck .emojis .emoji_asset[method="recommand"]')

		delete window.map.recommand
		$recommand.removeAttr("emoji")

		if(window.RoomInterval){
			OAuth3.interval = setInterval(window.RoomInterval, 2000)
		}

		var $player = $('player[id="'+player.hash+'"]')
		$player.removeClass("select_puzzle")

		$body
			.removeClass("loading")
			.removeAttr("tooltip")

		$("emojis").removeClass("on");
		$("tooltip").removeClass("on");
		$("#capture>.icon").html('')

		var url = window.RoomUrl()

		var $go = $("#go")

		var _url = new URL(window.location.href)

		var cc_address = ethers.hashMessage(_url.href.replace(window.location.protocol+"//",""))
			cc_address = ethers.computeAddress(cc_address).toLowerCase().replace("0x","")

		if(window.location.hash){
			cc_address = window.location.hash.replace("#","")
		}

		if(window.map.open){
			var open = window.map.open[point.x+":"+point.z]
			var $capture = $("#capture")

			$("#capture .xyz .x").html(Math.floor(point.x))
			$("#capture .xyz .z").html(Math.floor(point.z))

			if(open){
				$capture.addClass("on")
				$("#capture>.icon").html(blockies.create({seed: (open.hash.indexOf("0x") == 0 ? open.hash : "0x"+open.hash)}))

				var scoreboard = window.map.score[open.hash]

				$("#capture>.icon").append('<div class="address">\
					<span>'+open.hash+'</span>\
					<span dir="rtl">'+open.hash+'</span>\
					<rank>'+(scoreboard ? scoreboard.rank : "0")+'</rank>\
					<score>'+(scoreboard ? scoreboard.score : "0")+'</score>\
				</div>')

				if(window.map.puzzle[point.x+":"+point.z]){
					$recommand.html("")
				}else{
					var recommnads = []

					for(var _x = -1; _x < 2; _x++){
						for(var _z = -1; _z < 2; _z++){
							if(point.x == (point.x+_x) && point.z == (point.z+_z)){
								continue;
							}

							var puzzle = window.map.puzzle[(point.x+_x)+':'+(point.z+_z)]

							recommnads.push(puzzle);
						}
					}

					if(recommnads.length){
						var li = ""

						for(var r = 0; r < recommnads.length; r++){
							var recommnad = recommnads[r]

							if(recommnad){
								var emoji = recommnad.value

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
					}else{
						$recommand.html("")
					}
				}
			}else{
				$recommand.html("")
				$capture.removeClass("on")

				var scoreboard = window.map.score[cc_address]

				if(!scoreboard){
					scoreboard = window.map.score["0x"+cc_address]
				}

				$("#capture>.icon")
					.html(blockies.create({seed: "0x"+cc_address}))
					.append('<div class="address">\
						<span>'+cc_address+'</span>\
						<span dir="rtl">'+cc_address+'</span>\
						<rank>'+(scoreboard ? scoreboard.rank : "0")+'</rank>\
						<score>'+(scoreboard ? scoreboard.score : "0")+'</score>\
					</div>')

				if($capture.hasClass("open_rank")){
					$capture.click()
				}
			}

			try{
				var $tooltip = $player.find("tooltip ul");
					$tooltip.removeClass("open")

				var tooltip_body = ""

				if(player.hash.toLowerCase() == cookies.hash || player.hash.toLowerCase() == cookies.address){
					var isPlayground = player.emoji.indexOf("data:image") > -1

					if(isPlayground){
						tooltip_body = '<li>\
							<a class="hashType Portal">Portal</a>\
						</li>\
						<li></li>\
						<li></li>'
					}else if(open){
						if(open.hash == player.hash.toLowerCase()){
							$tooltip.addClass("open","true")
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
					tooltip_body = '<li>\
						<a class="hashType Report">Report</a>\
					</li>\
					<li></li>\
					<li></li>'
				}

				var before_body = $tooltip.html()
					before_body = before_body.replace(/\t/gi,"").trim()

				var after_body = tooltip_body.replace(/\t/gi,"").trim()

				if(before_body != after_body){
					$tooltip.html(tooltip_body)
				}
			}catch(err){
				console.log("Err",err);
			}
		}else{
			$('.deck .emojis .emoji_asset[method="recommand"]').html("")
		}

		/*
			개발 Part 79 (마이룸 섬 좌표계)
			현행은 격자 기준 3.5 를 경계로 썼다.
			섬 모드에서는 거의 모든 좌표가 이 조건을 통과해
			$go 에 엉뚱한 east / west 방 링크가 상시 붙었다.
			src/room.js 조이스틱과 동일한 값으로 맞춘다.
		*/
		var _edge = _roomIsland
			? ((1000000000000000000 / 2) - 1)
			: ((grid.edge / 2) - 1)
		if(point.x < -_edge || point.z < -_edge || point.x > _edge || point.z > _edge){
			var alpha = 0

			if(point.x > _edge || point.z < -_edge){
				alpha = 1
			}else if(point.x < -_edge || point.z > _edge){
				alpha = -1
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

		/*
			개발 Part 79 (사망 후 폴링)
			현행 문제
			  사망하면 BoardCallback 이 폴링을 끊는다.
			    clearInterval(window.Poll.ing)
			    delete window.Poll.ing
			  그 상태로 마이룸에 들어오면 RoomCallback 이 다시 켜지만,
			  해시가 바뀌지 않는 진입(dead 패널의 .btn.myroom 이
			  이미 같은 해시에 있는 경우)에서는 onhashchange 가 발화하지 않아
			  첫 RoomCallback 이 오기 전까지 Poll.ing 이 없다.
			  그러면 여기서 return 되어 좌표가 서버에 올라가지 않는다.
			  화면에서는 캐릭터가 움직였는데 다음 응답이 옛 좌표로 되돌린다.
			  "움직였다가 제자리로 돌아온다" 로 보인다.
			조치
			  끊겨 있으면 되살리고 이동을 계속 진행한다.
			  이 함수는 룸 모드에서만 호출되므로 룸 주기(600ms)를 쓴다.
		*/
		if(!window.Poll.ing){
			try{
				if(cookies.hash){
					window.Poll.ing = setInterval(window.Poll, 600)
					console.log("[room] polling restarted on click")
				}
			}catch(err){
			}
			if(!window.Poll.ing){
				return
			}
		}
		var query = {
			href : window.location.href,
			hash : cookies.hash,
			token : cookies.token,
			x : point.x,
			y : 0,
			z : point.z
		}

		if(OAuth3.xhr){
			OAuth3.xhr.abort()
			delete OAuth3.xhr
		}

		OAuth3.xhr = OAuth3.fetch({
			method : "POST",
			url : url,
			body : {
				emoji : window.emojis.self
			},
			query : query
		}, window.Callback);
	}catch(err){
		console.log("err",err);
	}
}