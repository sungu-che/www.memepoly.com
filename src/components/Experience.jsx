import { Environment, Html, Text } from "@react-three/drei";

import { Suspense, useEffect, useRef, useState, useMemo } from "react";

import { Player } from "./Player";

import * as THREE from "three";
import { useFrame, useThree, useLoader } from "@react-three/fiber";

import { DissolveMaterial } from "./DissolveMaterial";

var direction = {
	x : 0,
	z : 0
}


export const Experience = () => {
	const [players, setPlayers] = useState([]);
	const [assets, setAssets] = useState([]);

	const [camera, setCamera] = useState({});

	const [grid, setGrid] = useState([]);

	const [selector, setSelector] = useState({});

	const [far, setFar] = useState({
		x : 4.5,
		y : 4.5,
		z : 4.5
	});

	grid.size = 1000000000000000000
	grid.edge = 1000000000000000000 - 1

	grid.area = 100

	grid.x = grid.size
	grid.z = grid.size
	grid.center = "#000"
	grid.line = "#000"

	const current = useRef();
	const cursor = useRef();

	current.color = "white";
	cursor.color = "white";

	const self = function(){
		var cookies = window.cookies
		var player_hash = cookies.address ? cookies.address : cookies.hash
		var player = window[player_hash]

		var position

		try{
			position = current.current.position
		}catch(err){
			position = player.position
		}

		return {
			emoji : player.emoji,
			hash : player.hash,
			follow : player.follow,
			self : player.self,
			type : player.type,
			x : position.x,
			y : player.position.y,
			z : position.z
		}
	}

	var interval = function(){
		if(OAuth3.after){
			if(OAuth3.before == OAuth3.after){
				clearInterval(OAuth3.interval)

				OAuth3.interval = undefined
				OAuth3.after = undefined
				OAuth3.before = undefined
			}
		}		
		
		if(OAuth3.before){
			OAuth3.after = OAuth3.before
		}
	}

	useFrame((e,delta) => {
		var cookies = window.cookies
		if(cookies){
			var position

			var player = window[cookies.address ? cookies.address : cookies.hash]

			if(player){
				if(player.group){
					if(player.group.current){
						position = player.group.current.position
					}
				}
			}

			if(camera.hash){
				if(window[camera.hash]){
					position = window[camera.hash].group.current.position
				}
			}

			if(position){
				var fov = 1

				if(window.flutter_inappwebview){
					if(cookies.address){
						fov = 0.5
					}
				}

				if(Object.keys(window.com).length){
					fov = 1
				}

				if(window.frameloop == "always"){
					var vec = new THREE.Vector3(position.x,position.y-fov,position.z)
					e.camera?.lookAt(vec)
					e.camera.position.lerp(new THREE.Vector3(position.x+far.x,position.y+far.y,position.z+far.z ), 0.2)
				}

				if(OAuth3.interval){
					if(!OAuth3.after){
						if(window.frameloop == "demand"){
							window.setFrameloop("always")
						}
					}

					OAuth3.before = position.x
				}
			}
		}
	})

	var point = {}

	var onClick = function(e){
		window.setFrameloop("always")

		var cookies = window.cookies

		if(window.leftButtonDown && window.rightButtonDown){
			return
		}

		var $body = $("body")

		try{
			var player = self()

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

				point = new THREE.Vector3().copy(e.point).round().addScalar(0.5)

				var x = point.x
				var z = point.z

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

			}else if(e.target.tagName == "CANVAS"){
				if(typeof point.x != "undefined" && typeof point.z != "undefined"){
					if(cursor.current.position.x == point.x && cursor.current.position.z == point.z){
						if(cookies.hash && players.length){
							if(player.x == cursor.current.position.x && player.z == cursor.current.position.z){

							}else{
								if(window.tutorial){
									if(typeof window.tutorial.x != "undefined"){
										if(window.tutorial.x == cursor.current.position.x && window.tutorial.z == cursor.current.position.z){

										}else{
											return
										}
									}
								}


								if(window.camera){
									if(window.camera.hash){
										if(window.camera.hash != player.hash){
											setCamera({})
										}
									}
								}

								window[player.hash].position.x = current.current.position.x = point.x
								window[player.hash].position.z = current.current.position.z = point.z

								var $recommand = $('.deck .emojis .emoji_asset[method="recommand"]')

								delete window.map.recommand
								$recommand.removeAttr("emoji")

								OAuth3.interval = setInterval(interval, 2000)

								var $player = $('player[id="'+player.hash+'"]')
								$player.removeClass("select_puzzle")

								$("body")
									.removeClass("loading")
									.removeAttr("tooltip")
								
								$("emojis").removeClass("on");
								$("tooltip").removeClass("on");
								$("#capture>.icon").html('')

								var url = "https://popup.link"

								if(OAuth3.localhost){
									url = "http://localhost:3001"
								}

								var $go = $("#go")

								var _url = new URL(window.location.href)

								var cc_address = ethers.hashMessage(_url.href.replace(window.location.protocol+"//",""))
									cc_address = ethers.computeAddress(cc_address).toLowerCase().replace("0x","")

								if(window.location.hash){
									cc_address = window.location.hash.replace("#","")
								}

								if(window.dialog){
									cc_address = (window.dialog.to.indexOf("0x") == 0 ? window.dialog.to : "0x"+window.dialog.to).replace("0x","")
								}

								if(window.map.open){
									var open = window.map.open[point.x+":"+point.z]
									var $capture = $("#capture")

									$("#capture .xyz .x").html(Math.floor(point.x))
									$("#capture .xyz .z").html(Math.floor(point.z))

									var $recommand = $('.deck .emojis .emoji_asset[method="recommand"]')

									if(open){
										$capture.addClass("on")
										$("#capture>.icon").html(blockies.create({seed: (open.hash.indexOf("0x") == 0 ? open.hash : "0x"+open.hash)}))

										var scoreboard = window.map.score[open.hash]

										$("#capture>.icon").append('<div class="address">\
											<span>'+open.hash+'</span>\
											<span dir="rtl">'+open.hash+'</span>\
											<rank>'+scoreboard.rank+'</rank>\
											<score>'+scoreboard.score+'</score>\
										</div>')

										if(window.map.puzzle[point.x+":"+point.z]){
											$recommand.html("")
										}else{
											if(window.map.puzzle){
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
												if(player.hash.toLowerCase() == cc_address){
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
												if(open.hash == player.hash.toLowerCase()){
													$tooltip.addClass("open","true")
												}

												// Random

												tooltip_body = '<li>\
													<a class="hashType Portal">Portal</a>\
												</li>\
												<li>\
													<a class="hashType Chord">Build</a>\
												</li>\
												<li>\
													<a class="hashType Mine">Mine</a>\
												</li>'
											}else{
												tooltip_body = '<li>\
													<a class="hashType Flag">Flag</a>\
												</li>\
												<li>\
													<a class="hashType Chord">Build</a>\
												</li>\
												<li>\
													<a class="hashType Open">Open</a>\
												</li>'
											}
												
										}else{
											// Random
											tooltip_body = '<li>\
												<a class="hashType Dialog">Swap</a>\
											</li>\
											<li>\
												<a class="hashType Follow">Follow</a>\
											</li>\
											<li>\
												<a class="hashType Report">Send</a>\
											</li>'
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


								var edge = (grid.edge / 2) - 1

								if(point.x < -edge || point.z < -edge || point.x > edge || point.z > edge){
									var alpha = 0

									if(point.x > edge || point.z < -edge){
										alpha = 1
									}else if(point.x < -edge || point.z > edge){
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


								if(window.tutorial){
									if(window.tutorial.name){
										if(window.tutorial.x == point.x && window.tutorial.z == point.z){
											if(window.tutorial.name == "MineSweeper"){
												if(window.tutorial.step == 1){
													window.Tutorial(2, 2)
												}else if(window.tutorial.step == 3){
													window.Tutorial(2, 4)
												}
											}else if(window.tutorial.name == "Puzzle"){
												if(window.tutorial.step == 0){
													window.Tutorial(3, 1)
												}
											}else if(window.tutorial.name == "Sticker"){
												if(window.tutorial.step == 2){
													window.Tutorial(5)
												}
											}else if(window.tutorial.name == "Mine"){
												if(window.tutorial.step == 1){
													window.Tutorial(6)
												}
											}else if(window.tutorial.name == "Portal"){
												if(window.tutorial.step == 1){
													window.Tutorial(6,2)
												}
											}
										}
									}else{
										window.Tutorial(1, 1)
									}
								}else{
									var query = {
										href : window.location.href,
										hash : cookies.hash,
										token : cookies.token,
										x : point.x,
										y : point.y,
										z : point.z
									}

									if(window.dialog){
										query.href = window.location.origin + (window.dialog.to.indexOf("0x") == 0 ? window.dialog.to : "0x"+window.dialog.to).replace("0x","#")
									}

									// if(Object.keys(window.com).length){
									// 	var _from = (cookies.address ? cookies.address : "0x"+cookies.hash) * 1
									// 	var _to = window.com.address * 1
									// 	var _address

									// 	if(_from > _to){
									// 		_address = ethers.hashMessage(_from.toString() + _to.toString())
									// 		_address = ethers.computeAddress(_address).toLowerCase()
									// 	}else{
									// 		_address = ethers.hashMessage(_to.toString() + _from.toString())
									// 		_address = ethers.computeAddress(_address).toLowerCase()
									// 	}

									// 	query.to = _address
									// 	query.href = window.location.origin + _address.replace("0x","#")
									// }

									var _to = ""

									if($body.attr("bingo") == "dialog"){
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
									}

									if(_to){
										var _from = (cookies.address ? cookies.address : "0x"+cookies.hash) * 1

										var _address

										if(_from > _to){
											_address = ethers.hashMessage(_from.toString() + _to.toString())
											_address = ethers.computeAddress(_address).toLowerCase()
										}else{
											_address = ethers.hashMessage(_to.toString() + _from.toString())
											_address = ethers.computeAddress(_address).toLowerCase()
										}

										query.href = window.location.origin +"/"+ _address.replace("0x","#")
										query.to = _address
									}

									if(!window.Polling){
										return
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
								}
							}
						}
					}else{
						cursor.current.position.x = point.x
						cursor.current.position.z = point.z
					}
				}
			}
		}catch(err){
			console.log("err",err);
		}
	}

	const onContextmenu = function(e){
		e.preventDefault();
	}

	const Asset = function(props){
		var href = "";
		var src = "";
		var emoji = "";

		var rotation_x = -Math.PI / 2

		if(props.name == "asset"){
			rotation_x = 0
		}

		try{
			var uri = new URL(props.value);

			type = "link"

			if(uri.host.indexOf("youtube.com") > -1 || uri.host.indexOf("youtu.be") > -1){
				type = "embed";
			}else if(uri.host.indexOf("vimeo.com") > -1){

			}else if(uri.host.indexOf("twitch.tv") > -1){

			}
		}catch(err){
			
		}

		if(props.name == "tutorial"){
			return <>
				<mesh rotation-x={rotation_x} position={props.position}>
					<planeGeometry attach="geometry" args={[0.9, 0.9]} />
					<meshStandardMaterial attach="material" color={props.color} />

					<Text rotation-z={Math.PI / 0.0815} fontSize={0.5} position={[0, 0, 0.1]} color="#fff">!</Text>
				</mesh>
			</>
		}else if(props.name == "puzzle"){
			var hex = props.value.codePointAt(0).toString(16)

			// if(isNaN(hex)){
				src = `/src/fonts/emoji/emoji_u${hex}.png`
			// }else{
			// 	var emojis = props.value.split("_")
				
			// 	src = `https://www.gstatic.com/android/keyboard/emojikitchen/20201001/${emojis[0]}/${emojis[0]}_${emojis[1]}.png`
			// }

			const texture = useLoader(THREE.TextureLoader, src)

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
		}else if(props.name == "mine"){
			const texture = useLoader(THREE.TextureLoader, '/src/fonts/emoji/emoji_u1f4a3.png')

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
		}else if(window.Biomes[props.name]){
			return <>
				<group rotation-x={rotation_x} position={props.position}>
					<mesh position={[0, 0, 0.005]}>
						<planeGeometry attach="geometry" args={[1, 1]} />
						<meshStandardMaterial attach="material" color={props.color} />
					</mesh>
					{/*<Html className="clipped">
						<div className="emoji color" x={props.position.x} z={props.position.z}>{props.value}</div>
					</Html>*/}
				</group>
			</>
		}else{
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
	}

	const { gl } = useThree();

	const onContextLost = function (event) {
		event.preventDefault();

		setTimeout(function () {
			try{
				gl.forceContextRestore();
				window.setFrameloop("always")
			}catch(err){
				window.location.reload()
			}			
		}, 100);
	}


	window.players = players;
	window.players.set = setPlayers;
	window.players.self = self;

	useEffect((e) => {
		window.players = players;
		window.players.set = setPlayers;
		window.players.self = self;

		window.assets = assets
		window.assets.set = setAssets

		window.camera = camera;
		window.camera.set = setCamera;

		window.selector = selector;
		window.selector.set = setSelector;

		window.far = far;
		window.far.set = setFar;

		window.cursor = cursor;
		window.current = current;

		window.grid = grid

		window.gl = gl

		var canvas = gl.domElement

		window.addEventListener('click', onClick);
		window.addEventListener('contextmenu', onContextmenu);
		canvas.addEventListener('webglcontextlost', onContextLost, false);

		return () => {
			window.removeEventListener('click', onClick);
			window.removeEventListener('contextmenu', onContextmenu);
			canvas.removeEventListener('webglcontextlost', onContextLost, false)
		}
	})

	return (
		<>
			<Suspense>
				<Environment files="warehouse.hdr" />
			</Suspense>

			<fog attach="fog" args={["#333", 4, 14]} />

			<mesh ref={cursor} rotation-x={-Math.PI / 2} position={[1.5, -0.001, 1.5]}>
				<planeGeometry attach="geometry" args={[0.6, 0.6]} />
				<meshStandardMaterial attach="material" color={cursor.color} />
			</mesh>

			<mesh ref={current} rotation-x={-Math.PI / 2} position={[1.5, 0, 1.5]}>
				<planeGeometry attach="geometry" args={[0.9, 0.9]} />
				<meshStandardMaterial attach="material" color={current.color} />
			</mesh>

			<mesh  rotation-x={-Math.PI / 2} onClick={onClick}>
				<planeGeometry attach="geometry" args={[grid.x, grid.z]} />
				<meshStandardMaterial attach="material" opacity={0} transparent />
			</mesh>


			{/*<mesh rotation-x={-Math.PI / 2} position={[0, -0.01, 0]}>
				<planeGeometry attach="geometry" args={[100, 100]} />
				<meshStandardMaterial attach="material" color={"green"} />
			</mesh>*/}

			<Suspense>
				{assets.map((asset) => (
					<Asset 
						key={asset.id}
						uid={asset.id}
						hash={asset.hash}
						name={asset.name}
						value={asset.value}
						color={asset.color}
						position={
							new THREE.Vector3(
								asset.x,
								asset.y,
								asset.z
							)
						}
					/>
				))}
			</Suspense>
			
			<Suspense>
				{players.map((player) => (
					<Player
						key={player.hash}
						uid={player.hash}
						name="Player"
						hash={player.hash}
						emoji={player.emoji}
						self={player.self}
						follow={player.follow}
						position={
							new THREE.Vector3(
								player.x,
								player.y,
								player.z
							)
						}
					/>
				))}
			</Suspense>
		</>
	);
};
