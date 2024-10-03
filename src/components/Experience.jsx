import { Environment, Html, Text } from "@react-three/drei"

import { Suspense, useEffect, useRef, useState, useMemo } from "react"

import { Player } from "./Player"

import * as THREE from "three"
import { useFrame, useThree, useLoader } from "@react-three/fiber"

import dirtImg from './images/dirt.jpg'
import grassImg from './images/grass.jpg'
import glassImg from './images/glass.png'
import logImg from './images/log.jpg'
import woodImg from './images/wood.png'
import blackImg from './images/black.jpg'


const textures = {
	// dirt : new THREE.TextureLoader().load(dirtImg),
	grass : new THREE.TextureLoader().load(grassImg),
	glass : new THREE.TextureLoader().load(glassImg),
	// wood : new THREE.TextureLoader().load(woodImg),
	// log : new THREE.TextureLoader().load(logImg),
	black : new THREE.TextureLoader().load(blackImg)
}

// textures.dirt.magFilter = THREE.NearestFilter
// textures.dirt.minFilter = THREE.LinearMipMapLinearFilter
textures.grass.magFilter = THREE.NearestFilter
textures.grass.minFilter = THREE.LinearMipMapLinearFilter
textures.glass.magFilter = THREE.NearestFilter
textures.glass.minFilter = THREE.LinearMipMapLinearFilter
// textures.wood.magFilter = THREE.NearestFilter
// textures.wood.minFilter = THREE.LinearMipMapLinearFilter
// textures.log.magFilter = THREE.NearestFilter
// textures.log.minFilter = THREE.LinearMipMapLinearFilter
textures.black.magFilter = THREE.NearestFilter
textures.black.minFilter = THREE.LinearMipMapLinearFilter


export const Experience = () => {
	const [players, setPlayers] = useState([]);

	const [assets, setAssets] = useState([]);

	const [camera, setCamera] = useState({});

	const far = {
		x : 4.5,
		y : 5.5,
		z : 4.5
	}

	const current = useRef()
	const cursor = useRef()

	current.color = "white"
	cursor.color = "white"

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
			team : player.team,
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

		try{
			if(cookies){
				if(cookies.axis){
					if(e.point){
						var _point = new THREE.Vector3().copy(e.point).round().addScalar(0.5)

						var biome = window.map.biomes[_point.x+":"+_point.z]

						if(biome.water){
							return
						}

						point = _point
					}else if(e.target.tagName == "CANVAS"){
						if(typeof point.x != "undefined" && typeof point.z != "undefined"){
							var player = self()

							var biome = window.map.biomes[point.x+":"+point.z]

							point.y = biome.y

							if(cursor.current.position.x == point.x && cursor.current.position.z == point.z){
								if(cookies.hash && players.length){
									if(player.x == cursor.current.position.x && player.z == cursor.current.position.z){

									}else{
										if(window.camera){
											if(window.camera.hash){
												if(window.camera.hash != player.hash){
													setCamera({})
												}
											}
										}

										window[player.hash].position.y = point.y + 0.5
										
										current.current.position.y = point.y + 0.01

										window[player.hash].position.x = current.current.position.x = point.x
										window[player.hash].position.z = current.current.position.z = point.z

										OAuth3.interval = setInterval(interval, 2000)

										var $player = $('player[id="'+player.hash+'"]')
										// $player.removeClass("select_puzzle")

										$("body")
											.attr("biome", biome.biome)
											.removeClass("loading")
											.removeAttr("tooltip")
										
										$("emojis").removeClass("on");
										$("tooltip").removeClass("on");
										$("#capture>.icon").html('')

										// maker
										$(".map").css({top : - ((point.z * 2) + 100) , left : - ((point.x * 2) + 0) })
										$(".xyz").text(`${point.x} : ${point.z}`)

										var url = "https://emption.red"

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

										var edge = (1000000000000000000 / 2) - 1

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
										}else if(window.response){
											if(cookies.dice != 0){
												cookies.dice = -10
												window.response.body.cookies = JSON.stringify(cookies)
											}

											window.Callback(window.response)
										}
									}
								}
							}else{
								cursor.current.position.x = point.x
								cursor.current.position.y = point.y + 0.01
								cursor.current.position.z = point.z
							}
						}
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
		var cookies = window.cookies

		var url = new URL(window.location.href)

		var cc_address = ethers.hashMessage(url.href.replace(window.location.protocol+"//",""))
			cc_address = ethers.computeAddress(cc_address).toLowerCase()
			cc_address = cc_address.replace("0x","")

		if(window.location.hash){
			cc_address = window.location.hash.replace("#","")
		}

		var href = "";
	
		var emoji = "";

		var opacity = 1

		var rotation_x = -Math.PI / 2

		if(props.name == "asset"){
			rotation_x = 0
		}


		var biome = window.map.biomes[`${props.position.x}:${props.position.z}`]

		if(biome){
			if(biome.water){
				opacity = 0.8
			}
		}

		if(props.name == "#OCEAN"){
			return <>
				<group position={props.position}>
					<group></group>
				</group>
			</>
		}else if(props.name == "bomb"){
			var hex = props.value.codePointAt(0).toString(16)

			var src = `/src/fonts/emoji/emoji_u${hex}.png`

			return <>
				<group position={props.position}>
					<mesh rotation-y={Math.PI / 3.8} position={[0.13, 0.5, 0]}>
						<planeGeometry attach="geometry" args={[1, 1]} />
						<meshBasicMaterial attach="material" map={useLoader(THREE.TextureLoader, src)} transparent />
					</mesh>

					<Html className="clipped">
						<div className="emoji color" x={props.position.x} z={props.position.z}></div>
					</Html>
				</group>
			</>	
		}else if(window.Biomes[props.name]){
			var texture = 'glass'

			var color = props.color

			if(window.map.biomes[props.uid]){
				emoji = window.Biomes[color]
			}

			if(props.name == "#BEACH"){
				if(props.color == "black"){
					color = props.color


					opacity = 0.5
				}
			}

			if(biome){
				if(biome.bomb && !biome.water){
					texture = color = "black"
				}
			}

			var field = window.fields[`${props.position.x}:${props.position.z}`]

			if(emoji){
				if(field){
					if(field.item || field.drop){
						return <>
							<group position={props.position}>
								<mesh position={[0, 0, 0.005]} onClick={onClick}>
									<boxGeometry attach="geometry" args={[1, 1]} />
									<meshStandardMaterial attach="material" map={textures[texture]} transparent opacity={opacity} color={color} />
								</mesh>
								<mesh rotation-y={Math.PI / 3.8} position={[0, 1, 0]}>
									<planeGeometry attach="geometry" args={[1, 1]} />
									<meshBasicMaterial attach="material" map={useLoader(THREE.TextureLoader, `/src/fonts/emoji/emoji_u${window.emojiUnicode(emoji)}.png`)} transparent />
								</mesh>
								<mesh rotation-x={rotation_x} rotation-z={Math.PI / 0.0815} position={[0, 0.52, 0]}>
									<planeGeometry attach="geometry" args={[0.5, 0.5]} />
									<meshBasicMaterial attach="material" map={useLoader(THREE.TextureLoader, `/src/fonts/emoji/emoji_u${window.emojiUnicode(field.item || field.drop)}.png`)} transparent />
								</mesh>

								<Html className="clipped">
									<div className="emoji color" x={props.position.x} z={props.position.z}></div>
								</Html>
							</group>
						</>	
					}
				}

				return <>
					<group position={props.position}>
						<mesh position={[0, 0, 0.005]} onClick={onClick}>
							<boxGeometry attach="geometry" args={[1, 1]} />
							<meshStandardMaterial attach="material" map={textures[texture]} transparent opacity={opacity} color={color} />
						</mesh>
						<mesh rotation-y={Math.PI / 3.8} position={[0, 1, 0]}>
							<planeGeometry attach="geometry" args={[1, 1]} />
							<meshBasicMaterial attach="material" map={useLoader(THREE.TextureLoader, `/src/fonts/emoji/emoji_u${window.emojiUnicode(emoji)}.png`)} transparent />
						</mesh>

						<Html className="clipped">
							<div className="emoji color" x={props.position.x} z={props.position.z}></div>
						</Html>
					</group>
				</>	
			}else{
				if(field){
					if(field.item || field.drop){
						return <>
							<group position={props.position}>
								<mesh position={[0, 0, 0.005]} onClick={onClick}>
									<boxGeometry attach="geometry" args={[1, 1]} />
									<meshStandardMaterial attach="material" map={textures[texture]} transparent opacity={opacity} color={color} />
								</mesh>
								<mesh rotation-x={rotation_x} rotation-z={Math.PI / 0.0815} position={[0, 0.511, 0]}>
									<planeGeometry attach="geometry" args={[0.5, 0.5]} />
									<meshBasicMaterial attach="material" map={useLoader(THREE.TextureLoader, `/src/fonts/emoji/emoji_u${window.emojiUnicode(field.item || field.drop)}.png`)} transparent />
								</mesh>

								<Html className="clipped">
									<div className="emoji color" x={props.position.x} z={props.position.z}></div>
								</Html>
							</group>
						</>	
					}
				}

				return <>
					<group position={props.position}>
						<mesh position={[0, 0, 0.005]} onClick={onClick}>
							<boxGeometry attach="geometry" args={[1, 1]} />
							<meshStandardMaterial attach="material" map={textures[texture]} transparent opacity={opacity} color={color} />
						</mesh>

						<Html className="clipped">
							<div className="emoji color" x={props.position.x} z={props.position.z}></div>
						</Html>
					</group>
				</>	
			}
		}else{
			return <>
				<group position={props.position}>
					<group></group>
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

		window.cursor = cursor;
		window.current = current;

		window.gl = gl

		window.addEventListener('click', onClick);
		gl.domElement.addEventListener('webglcontextlost', onContextLost, false);

		return () => {
			window.removeEventListener('click', onClick);
			gl.domElement.removeEventListener('webglcontextlost', onContextLost, false)
		}
	})

	return (
		<>
			<Suspense>
				<Environment files="warehouse.hdr" />
			</Suspense>

			<mesh ref={cursor} rotation-x={-Math.PI / 2} position={[1.5, -0.001, 1.5]}>
				<planeGeometry attach="geometry" args={[0.6, 0.6]} />
				<meshStandardMaterial attach="material" color={cursor.color} />
			</mesh>

			<mesh ref={current} rotation-x={-Math.PI / 2} position={[1.5, 0, 1.5]}>
				<planeGeometry attach="geometry" args={[0.9, 0.9]} />
				<meshStandardMaterial attach="material" color={current.color} />
			</mesh>

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
						team={player.team}
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
