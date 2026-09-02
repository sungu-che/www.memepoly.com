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

	try{
		var player = window.players.self()

		if(e.point){
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

			var edge = (grid.edge / 2) + 1

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

		if(cursor.current.position.x != point.x || cursor.current.position.z != point.z){
			cursor.current.position.x = point.x
			cursor.current.position.z = point.z

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

		var _edge = (grid.edge / 2) - 1

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

		if(!window.Poll.ing){
			return
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