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
	dirt : new THREE.TextureLoader().load(dirtImg),
	grass : new THREE.TextureLoader().load(grassImg),
	glass : new THREE.TextureLoader().load(glassImg),
	wood : new THREE.TextureLoader().load(woodImg),
	log : new THREE.TextureLoader().load(logImg),
	black : new THREE.TextureLoader().load(blackImg)
}

textures.dirt.magFilter = THREE.NearestFilter
textures.dirt.minFilter = THREE.LinearMipMapLinearFilter
textures.grass.magFilter = THREE.NearestFilter
textures.grass.minFilter = THREE.LinearMipMapLinearFilter
textures.glass.magFilter = THREE.NearestFilter
textures.glass.minFilter = THREE.LinearMipMapLinearFilter
textures.wood.magFilter = THREE.NearestFilter
textures.wood.minFilter = THREE.LinearMipMapLinearFilter
textures.log.magFilter = THREE.NearestFilter
textures.log.minFilter = THREE.LinearMipMapLinearFilter
textures.black.magFilter = THREE.NearestFilter
textures.black.minFilter = THREE.LinearMipMapLinearFilter


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

	grid.helper = 5

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
				var fov = 0.5

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
			if(e.point){
				point = new THREE.Vector3().copy(e.point).round().addScalar(0.5)
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

								var biomes = listToBiomes(window.map.biomes, 100)

								var size = 2
								var fields = []

								var reverse = false

								console.log("----------------")

								var current_biome 

								biomes.forEach(function(b, i){
									if(
										(point.x - size < b.x && point.x + size > b.x) &&
										(point.z - size < b.z && point.z + size > b.z)
									){
										if(b.biome == "BEACH"){
											fields.push(b)
										}
									}
								})

								fields.sort(function (a, b) {
									if(a.x + a.z >= b.x + b.z){
										return b.x - a.x || a.z - b.z;
									}else{
										return Math.sqrt(Math.pow(b.x, 2)) - Math.sqrt(Math.pow(a.x, 2)) && Math.sqrt(Math.pow(b.z, 2)) - Math.sqrt(Math.pow(a.z, 2))
									}
								    
								    // Compare first value then second 
								    

								    
								});

								fields.forEach(function(b,i){
									console.log("#"+i, (b.x +":"+ b.z));
								})
									
								console.log("----------------")

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

								$(".map canvas").css({top : -((point.z * 1.5) + 70) , left : -((point.x * 1.5) + 15 )})

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
		}catch(err){
			console.log("err",err);
		}
	}

	const onContextmenu = function(e){
		e.preventDefault();
	}

	const Asset = function(props){
		var url = new URL(window.location.href)

		var cc_address = ethers.hashMessage(url.href.replace(window.location.protocol+"//",""))
			cc_address = ethers.computeAddress(cc_address).toLowerCase()
			cc_address = cc_address.replace("0x","")

		if(window.location.hash){
			cc_address = window.location.hash.replace("#","")
		}

		var href = "";
	
		var emoji = "";

		var opacity = 0.8

		var rotation_x = -Math.PI / 2

		if(props.name == "asset"){
			rotation_x = 0
		}

		if(props.name == "bomb"){
			var hex = props.value.codePointAt(0).toString(16)

			var src = `/src/fonts/emoji/emoji_u${hex}.png`

			// props.color 값에 따라 스타일 변화

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

			if(props.name == "#ROAD1" || 
				props.name == "#ROAD2" ||
				props.name == "#ROAD3" || 
				props.name == "#BRIDGE"){
				texture = "wood"
			}else if(props.name == "#SUBTROPICAL_DESERT" ||
				props.name == "#TAIGA" ||
				props.name == "#LAVA" ||
				props.name == "#TEMPERATE_DESERT"
				){
				texture = "dirt"

			}else{
				texture = "glass"
			}

			if(window.map.biomes[`${props.position.x}:${props.position.z}`]){
				if(window.map.biomes[`${props.position.x}:${props.position.z}`].bomb){
					texture = color = "black"

					console.log('color',color)
				}
			}

			if(emoji){
				var hex = window.emojiUnicode(emoji)

				var src = `/src/fonts/emoji/emoji_u${hex}.png`

				return <>
					<group position={props.position}>
						<mesh position={[0, 0, 0.005]} onClick={onClick}>
							<boxGeometry attach="geometry" args={[1, 1]} />
							<meshStandardMaterial attach="material" map={textures[texture]} transparent opacity={opacity} color={color} />
						</mesh>
						<mesh rotation-y={Math.PI / 3.8} position={[0, 1, 0]}>
							<planeGeometry attach="geometry" args={[1, 1]} />
							<meshBasicMaterial attach="material" map={useLoader(THREE.TextureLoader, src)} transparent />
						</mesh>

						<Html className="clipped">
							<div className="emoji color" x={props.position.x} z={props.position.z}></div>
						</Html>
					</group>
				</>	
			}else{
				return <>
					<group position={props.position}>
						<mesh position={[0, 0, 0.005]} onClick={onClick}>
							<boxGeometry attach="geometry" args={[1, 1]} />
							<meshStandardMaterial attach="material" map={textures[texture]} opacity={opacity} transparent color={color} />
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

		window.selector = selector;
		window.selector.set = setSelector;

		window.far = far;
		window.far.set = setFar;

		window.cursor = cursor;
		window.current = current;

		window.grid = grid

		window.gl = gl

		window.addEventListener('click', onClick);
		gl.domElement.addEventListener('webglcontextlost', onContextLost, false);

		return () => {
			window.removeEventListener('click', onClick);
			gl.domElement.removeEventListener('webglcontextlost', onContextLost, false)
		}
	})

	var fog = ["#000", 8, 13]

	return (
		<>
			<Suspense>
				<Environment files="warehouse.hdr" />
				<fog attach="fog" args={fog} />
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
