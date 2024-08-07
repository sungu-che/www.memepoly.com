import { Environment, Html, Text } from "@react-three/drei";

import { Suspense, useEffect, useRef, useState, useMemo } from "react";

import { Player } from "./Player";

import * as THREE from "three";
import { useFrame, useThree, useLoader } from "@react-three/fiber";

import { DissolveMaterial } from "./DissolveMaterial";

import dirtImg from './images/dirt.jpg';
import grassImg from './images/grass.jpg';
import glassImg from './images/glass.png';
import logImg from './images/log.jpg';
import woodImg from './images/wood.png';


const textures = {
	dirt : new THREE.TextureLoader().load(dirtImg),
	grass : new THREE.TextureLoader().load(grassImg),
	glass : new THREE.TextureLoader().load(glassImg),
	wood : new THREE.TextureLoader().load(woodImg),
	log : new THREE.TextureLoader().load(logImg)
}

textures.dirt.magFilter = THREE.NearestFilter;
textures.dirt.minFilter = THREE.LinearMipMapLinearFilter;
textures.grass.magFilter = THREE.NearestFilter;
textures.grass.minFilter = THREE.LinearMipMapLinearFilter;
textures.glass.magFilter = THREE.NearestFilter;
textures.glass.minFilter = THREE.LinearMipMapLinearFilter;
textures.wood.magFilter = THREE.NearestFilter;
textures.wood.minFilter = THREE.LinearMipMapLinearFilter;
textures.log.magFilter = THREE.NearestFilter;
textures.log.minFilter = THREE.LinearMipMapLinearFilter

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
				var fov = 0.5

				if(window.flutter_inappwebview){
					if(cookies.address){
						fov = 0.5
					}
				}

				if(Object.keys(window.com).length){
					fov = 0.5
				}

				if(window.frameloop == "always"){
					var vec = new THREE.Vector3(position.x,position.y-fov,position.z)
					e.camera?.lookAt(vec)
					e.camera.position.lerp(new THREE.Vector3(position.x+far.x,position.y+far.y,position.z+far.z ), 0.2)
				}

				if(OAuth3.interval){
					if(!OAuth3.after){
						if(window.frameloop == "demand"){
							// window.setFrameloop("always")
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

		var $body = $("body")

		try{
			if(e.point){
				point = new THREE.Vector3().copy(e.point).round().addScalar(0.5)
			}else if(e.target.tagName == "CANVAS"){
				if(typeof point.x != "undefined" && typeof point.z != "undefined"){
					var player = self()

					var biome = window.map.biomes[point.x+":"+point.z]

					point.y = biome.y

					if(biome){
						if(biome.water){
							return
						}
					}						

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
									.removeClass("loading")
									.removeAttr("tooltip")
								
								$("emojis").removeClass("on");
								$("tooltip").removeClass("on");
								$("#capture>.icon").html('')

								$(".map canvas").css({top : -point.z * 0.4, left : -point.x * 0.4})

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
									if(OAuth3.xhr){
										OAuth3.xhr.abort()
										delete OAuth3.xhr
									}

									setTimeout(function(){
										window.Callback(window.response)
									}, OAuth3.isMobile ? 500 : 1000)
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
			var texture = 'glass'

			var opacity = 0

			var color = props.color

			if(props.name == "ROAD1" || 
				props.name == "ROAD2" ||
				props.name == "ROAD3" || 
				props.name == "BRIDGE"){
				texture = "wood"
			}else if(props.name == "SUBTROPICAL_DESERT" ||
				props.name == "TAIGA" ||
				props.name == "LAVA" ||
				props.name == "TEMPERATE_DESERT"
				){
				texture = "dirt"

			}else{
				texture = "glass"

				opacity = 0.7
			}

			// OCEAN: "#44447a",
			// COAST: "#33335a",
			// LAKESHORE: "#225588",
			// LAKE: "#336699",
			// RIVER: "#225588",
			// MARSH: "#2f6666",

			// BEACH: "#a09077",
			// ICE: "#99ffff",
			// LAVA: "#cc3333",

			
			// ROAD1: "#442211",
			// ROAD2: "#553322",
			// ROAD3: "#664433",
			// BRIDGE: "#686860",

			

			// // Terrain
			// SNOW: "#ffffff",
			// TUNDRA: "#bbbbaa",
			// BARE: "#888888",
			// SCORCHED: "#555555",
			// TAIGA: "#99aa77",
			// SHRUBLAND: "#889977",
			// TEMPERATE_DESERT: "#c9d29b",
			// TEMPERATE_RAIN_FOREST: "#448855",
			// TEMPERATE_DECIDUOUS_FOREST: "#679459",
			// GRASSLAND: "#88aa55",
			// SUBTROPICAL_DESERT: "#d2b98b",
			// TROPICAL_RAIN_FOREST: "#337755",
			// TROPICAL_SEASONAL_FOREST: "#559944"


			return <>
				<group rotation-x={rotation_x} position={props.position}>
					<mesh position={[0, 0, 0.005]}>
						<boxGeometry attach="geometry" args={[1, 1]} />
						<meshStandardMaterial attach="material" map={textures[texture]} color={color} opacity={1} transparent={true} />
					</mesh>
					<Html className="clipped">
						<div className="emoji color" x={props.position.x} z={props.position.z}>{props.value}</div>
					</Html>
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

		window.addEventListener('click', onClick);
		gl.domElement.addEventListener('webglcontextlost', onContextLost, false);

		return () => {
			window.removeEventListener('click', onClick);
			gl.domElement.removeEventListener('webglcontextlost', onContextLost, false)
		}
	})

	var fog = OAuth3.isMobile ? ["#fff", 10, 20] : ["#fff", 10, 14]

	return (
		<>
			<Suspense>
				<Environment files="warehouse.hdr" />
			</Suspense>

			<fog attach="fog" args={fog} />

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
