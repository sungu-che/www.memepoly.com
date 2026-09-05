import { Environment, Html, Text } from "@react-three/drei"

import { Suspense, useEffect, useRef, useState, useMemo } from "react"

import { Player } from "./Player"
import { RoomAsset, RoomGrid } from "./RoomWorld"

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
textures.grass.magFilter = THREE.NearestFilter
textures.grass.minFilter = THREE.LinearMipMapLinearFilter
textures.glass.magFilter = THREE.NearestFilter
textures.glass.minFilter = THREE.LinearMipMapLinearFilter
textures.black.magFilter = THREE.NearestFilter
textures.black.minFilter = THREE.LinearMipMapLinearFilter

var PropertyLevelEmoji = ["", "🪵", "🏠", "🏪", "🏰"]
var fields = []
window.FieldsSync = function(force){
	var key = ""
	try{
		key = window.MapGen ? window.MapGen.key : ""
	}catch(err){
	}
	if(!force && window.fields && window.FieldsSync.key === key && window.fields.length){
		return window.fields
	}
	var hash = ""
	try{
		hash = window.MapGen && window.MapGen.target() ? window.MapGen.target().hash : ""
	}catch(err){
	}
	var next = window.Fields(hash)
	var _isRing = next.ring ? true : false
	next.forEach(function(field, index){
		if(_isRing){
			if(index % 45 == 0){
				field.jail = true
			}else if(index % 9 == 0){
				field.drop = "❓"
				field.gate = true
			}else if(index % 3 == 0){
				field.item = "❔"
			}
		}
		field.index = index
		var b = window.map && window.map.biomes ? window.map.biomes[`${field.x}:${field.z}`] : null
		if(b){
			field.biome = "#" + b.biome
			field.y = b.y
			field.water = b.water ? true : false
		}
		if(!field.property){
			field.property = {
				level: 0,
				owner: "",
				type: "empty",
				toll: 0,
				cost: window.PropertyCost,
				tollTable: window.PropertyToll,
				materials: window.PropertyMaterials
			}
		}
		next[`${field.x}:${field.z}`] = field
	})
	fields = next
	window.fields = next
	window.FieldsSync.key = key
	return next
}
window.FieldsSync.key = null
window.FieldsSync()


export const Experience = () => {
	const [players, setPlayers] = useState([]);

	const [assets, setAssets] = useState([]);

	const [camera, setCamera] = useState({});

	const [selector, setSelector] = useState({});

	const [grid, setGrid] = useState([]);

	const [far, setFar] = useState({
		x : 4.5,
		y : 5.5,
		z : 4.5
	});

	grid.size = 40
	grid.edge = 10 - 1

	grid.x = grid.size
	grid.z = grid.size
	grid.center = "#000"
	grid.line = "#000"

	const current = useRef()
	const cursor = useRef()

	current.color = "white"
	cursor.color = "white"

	const self = function(){
		var cookies = window.cookies
		if(!cookies){
			return null
		}
		var player_hash = cookies.address ? cookies.address : cookies.hash
		if(!player_hash){
			return null
		}
		var player = window[player_hash]
		if(player){
			if(window[player_hash].group.current == null && player.position){
				window[player_hash].group.current = player.position
			}
		}else{
			var position
			if(window.Mode() == "room"){
				if(window.MapGen && window.MapGen.ready && fields.length){
					var _rr, _rb
					for(var _ri = 0; _ri < fields.length; _ri++){
						_rr = fields[Math.floor(Math.random() * fields.length)]
						_rb = window.map.biomes[`${_rr.x}:${_rr.z}`]
						if(_rb && !_rb.water){
							break
						}
					}
					if(!_rr){ _rr = fields[0] }
					if(!_rb){ _rb = { y : 0.5 } }
					position = {
						x : _rr.x,
						y : _rb.y,
						z : _rr.z
					}
				}else{
					position = {
						x : 1.5,
						y : 0.5,
						z : 1.5
					}
				}
			}else if(cookies.axis){
				/*
					개발 Part 14 (검수) - G2
					현행은 바이옴이 없으면 position 을 만들지 않고
					아래 랜덤 스폰 루프로 빠져 저장 좌표를 버렸다.
					또한 axis 의 y 는 서버가 +1 오프셋을 더한 값이라
					그대로 쓰면 캐릭터가 공중에 떴다.
					window.AxisParse 가 두 문제를 함께 처리한다.
				*/
				var _ax = window.AxisParse ? window.AxisParse(cookies.axis) : null
				if(_ax && _ax.ok){
					position = {
						x : _ax.x,
						y : _ax.y,
						z : _ax.z
					}
				}
			}

			if(!position){
				var r, b

				for(var i = 0; i < fields.length; i++){
					r = fields[Math.floor(Math.random() * fields.length)]
					b = window.map.biomes[`${r.x}:${r.z}`]

					if(b){
						if(!b.water){
							break
						}
					}
				}

				if(!r){
					r = fields[0]
				}

				if(!b){
					b = { y : 0.5 }
				}

				position = {
					x : r.x,
					y : b.y,
					z : r.z
				}
			}

			player = {
				team : cookies.team ? cookies.team : "",
				follow : false,
				self : true,
				hash : player_hash,
				emoji : "😀",
				position : position
			}

			window[player_hash] = player
			window[player_hash].group = {
				current : {
					position : position
				}
			}
		}

		var _position = player.position

		try{
			if(window.Mode() == "room"){
				if(current.current){
					_position = current.current.position
				}
			}
		}catch(err){

		}

		return {
			emoji : player.emoji,
			hash : player.hash,
			follow : player.follow,
			self : player.self,
			team : player.team,
			type : player.type,
			x : _position.x,
			y : player.position.y,
			z : _position.z
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

	window.RoomInterval = interval

	useFrame((e,delta) => {
		var cookies = window.cookies
		if(window.Mode() == "room" && !(window.MapGen && window.MapGen.ready)){
			try{
				current.current.position.y = 0
				cursor.current.position.y = -0.001
			}catch(err){
			}
		}else{
			/*
				개발 Part 63 (커서 높이 유지)
				커서는 자기가 놓인 칸의 높이를 따라야 한다.
				클릭 순간에만 맞추면 그 뒤로 어긋난다.
				  MapGen 이 섬을 다시 만들면 같은 좌표의 고도가 바뀐다
				  판이 전환되면 지형이 통째로 달라진다
				  개발 Part 63 이전에는 Player.jsx 가 매 프레임 덮어써
				  플레이어 발밑 높이로 끌려갔다
				여기서 자기 칸 기준으로만 유지한다.
				좌표는 0.5 그리드이므로 그대로 키로 쓴다.
				차이가 미세하면 건드리지 않아 불필요한 행렬 갱신을 피한다.
			*/
			try{
				var _cu = cursor.current
				if(_cu){
					var _cb = window.map.biomes[_cu.position.x + ":" + _cu.position.z]
					if(_cb && typeof _cb.y !== "undefined"){
						var _cl = window.CursorLift ? window.CursorLift * 1 : 0.06
						if(isNaN(_cl)){
							_cl = 0.06
						}
						var _want = (_cb.y * 1) + _cl
						if(Math.abs(_cu.position.y - _want) > 0.005){
							_cu.position.y = _want
						}
					}
				}
			}catch(err){
			}
		}
		
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
				var _cv = window.__camVec
				if(!_cv){
					_cv = window.__camVec = {
						target : new THREE.Vector3(),
						look : new THREE.Vector3()
					}
				}
				var _camTarget = _cv.target.set(position.x+far.x, position.y+far.y, position.z+far.z)
				var _camLook = _cv.look.set(position.x, position.y-fov, position.z)
				if(window.Snap > 0){
					e.camera.position.copy(_camTarget)
					e.camera?.lookAt(_camLook)
				}else{
					var _cdt = (typeof delta === "number" && delta > 0 && delta < 0.25) ? delta : (1 / 60)
					var _ctau = window.CamTau ? window.CamTau * 1 : 0.12
					if(isNaN(_ctau) || _ctau <= 0){
						_ctau = 0.12
					}
					var _ct = 1 - Math.exp(-_cdt / _ctau)
					if(_ct > 1){ _ct = 1 }
					e.camera.position.lerp(_camTarget, _ct)
					e.camera?.lookAt(_camLook)
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
		if(window.Snap > 0){
			window.Snap = window.Snap - 1
		}
	})

	var point = {}
	var onClick = function(e){
		if(window.Mode() == "room" && !(window.MapGen && window.MapGen.ready)){
			if(window.RoomClick){
				return window.RoomClick(e)
			}
			return
		}
		if(window.MapGen && !window.MapGen.ready){
			try{
				window.MapGen.apply()
			}catch(err){
			}
		}
		var cookies = window.cookies
		try{
			if(cookies){
				var _isRoom = window.Mode() == "room"
				var _canMove = _isRoom
					? true
					: (window.CanFreeMove ? window.CanFreeMove() : true)
				if((_isRoom || cookies.axis) && !cookies.damage){
					if(e.point){
						var _point = new THREE.Vector3().copy(e.point).round().addScalar(0.5)
						var biome = window.map.biomes[_point.x+":"+_point.z]
						if(!biome){
							return
						}
						if(biome.water){
							return
						}
						point = _point
					}else if(e.target.tagName == "CANVAS"){
						if(typeof point.x != "undefined" && typeof point.z != "undefined"){
							var player = self()
							var biome = window.map.biomes[point.x+":"+point.z]
							if(!biome){
								return
							}
							point.y = biome.y
							if(cursor.current.position.x == point.x && cursor.current.position.z == point.z){
								if(!_canMove){
									try{
										if(cookies.damage || cookies.dead){
											window.Notice("DEAD", "Go to My Room", 2000)
										}else if((cookies.dice * 1) > 0){
											window.Notice("ROLLING", "Wait for the dice", 1600)
										}else if(!cookies.enter){
											window.Notice("BOARD MODE", "Roll the dice to move", 2000)
										}
									}catch(err){
									}
									return
								}
								if(window.CanMoveTo && !window.CanMoveTo(point.x, point.z)){
									try{
										var _mr = window.CanMoveTo.reason
										if(_mr === "anchor"){
											var _ma = window.RingAnchor ? window.RingAnchor() : null
											window.Notice("BOARD PATH",
												_ma
													? ("Return through " + Math.floor(_ma.x) + ", " + Math.floor(_ma.z))
													: "You cannot step onto the board path here",
												2600)
										}else if(_mr === "noanchor"){
											window.Notice("BOARD PATH",
												"You cannot step onto the board path here", 2200)
										}else{
											window.Notice("FIELD ONLY", "UCAV cannot enter the board path", 2200)
										}
									}catch(err){
									}
									return
								}
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
										var _tlift = window.TileLift ? window.TileLift * 1 : 0.02
										if(isNaN(_tlift)){
											_tlift = 0.02
										}
										current.current.position.y = point.y + _tlift
										window[player.hash].position.x = current.current.position.x = point.x
										window[player.hash].position.z = current.current.position.z = point.z

										var $player = $('player[id="'+player.hash+'"]')
										// $player.removeClass("select_puzzle")

										$("body")
											.attr("biome", biome.biome)
											.removeClass("loading")
											.removeAttr("tooltip")
										
										$("emojis").removeClass("on");
										$("tooltip").removeClass("on");
										$("#capture>.icon").html('')
										if(!(window.MapFocus && window.MapFocus(point.x, point.z))){
											$(".map").css({top : - ((point.z * 2) + 100) , left : - ((point.x * 2) + 0) })
										}
										$(".xyz").text(`${Math.floor(point.x)} : ${Math.floor(point.z)}`)

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
												delete cookies.damage
												window.response.body.cookies = JSON.stringify(cookies)
											}

											window.Callback(window.response)
										}
									}
								}
							}else{
								var _clift = window.CursorLift ? window.CursorLift * 1 : 0.06
								if(isNaN(_clift)){
									_clift = 0.06
								}
								cursor.current.position.x = point.x
								cursor.current.position.y = point.y + _clift
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

	const ChordTile = function(props){
		var cells = useMemo(function(){
			var out = []
			for(var _cx = -1; _cx < 2; _cx++){
				for(var _cz = -1; _cz < 2; _cz++){
					var bx = props.position.x + _cx
					var bz = props.position.z + _cz
					var b = null
					try{
						b = window.map.biomes[bx + ":" + bz]
					}catch(err){
					}
					if(!b){
						continue
					}
					if(b.water){
						continue
					}
					out.push({
						key : bx + ":" + bz,
						x : _cx,
						y : (b.y + 0.02) - props.position.y,
						z : _cz
					})
				}
			}
			return out
		}, [props.position.x, props.position.z, props.position.y])
		return <>
			<group position={props.position}>
				{cells.map(function(c){
					return <mesh key={c.key} rotation-x={-Math.PI / 2} position={[c.x, c.y, c.z]} onClick={onClick}>
						<planeGeometry attach="geometry" args={[0.9, 0.9]} />
						<meshStandardMaterial attach="material" color={props.color ? props.color : "yellow"} transparent opacity={0.55} />
					</mesh>
				})}
			</group>
		</>
	}

	const OpenTile = function(props){
		var texture = useMemo(function(){
			try{
				var _seed = (props.hash + "")
				if(_seed.indexOf("0x") != 0){
					_seed = "0x" + _seed
				}
				var _canvas = blockies.create({
					seed : _seed.toLowerCase(),
					size : 8,
					scale : 8
				})
				var _t = new THREE.CanvasTexture(_canvas)
				_t.magFilter = THREE.NearestFilter
				_t.minFilter = THREE.NearestFilter
				_t.needsUpdate = true
				return _t
			}catch(err){
				return null
			}
		}, [props.hash])
		if(!texture){
			return <>
				<group position={props.position}>
					<group></group>
				</group>
			</>
		}
		return <>
			<group position={props.position}>
				<mesh rotation-x={-Math.PI / 2} position={[0, 0.02, 0]} onClick={onClick}>
					<planeGeometry attach="geometry" args={[0.94, 0.94]} />
					<meshBasicMaterial attach="material" map={texture} transparent opacity={0.92} />
				</mesh>
				<Html className="clipped">
					<div className="emoji color open" x={props.position.x} z={props.position.z}></div>
				</Html>
			</group>
		</>
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
			if(props.color == "black"){
				color = props.color
				opacity = 0.5
			}

			if(biome){
				if(biome.bomb && !biome.water){
					texture = color = "black"
				}
			}
			var field = null
			if(window.Mode() != "room"){
				if(window.EdgeReady && window.EdgeReady()){
					field = window.fields ? window.fields[`${props.position.x}:${props.position.z}`] : null
				}
			}

			if(emoji){
				if(field){
					if(field.jail){
						return <>
						<group position={props.position}>
							<mesh position={[0, 0, 0.005]} onClick={onClick}>
								<boxGeometry attach="geometry" args={[1, 1]} />
								<meshStandardMaterial attach="material" map={textures[texture]} transparent opacity={opacity} color="#5a5a7a" />
							</mesh>
							<Html className="clipped">
								<div className="emoji color jail" x={props.position.x} z={props.position.z}></div>
							</Html>
						</group>
						</>
					}
					if(field.gate){
						return <>
						<group position={props.position}>
							<mesh position={[0, 0, 0.005]} onClick={onClick}>
								<boxGeometry attach="geometry" args={[1, 1]} />
								<meshStandardMaterial attach="material" map={textures[texture]} transparent opacity={opacity} color="#ffcc00" />
							</mesh>
							<mesh rotation-y={Math.PI / 3.8} position={[0, 1, 0]}>
								<planeGeometry attach="geometry" args={[1, 1]} />
								<meshBasicMaterial attach="material" map={useLoader(THREE.TextureLoader, `/src/fonts/emoji/emoji_u${window.emojiUnicode(emoji)}.png`)} transparent />
							</mesh>
							<mesh rotation-x={rotation_x} rotation-z={Math.PI / 0.0815} position={[0, 0.52, 0]}>
								<planeGeometry attach="geometry" args={[0.7, 0.7]} />
								<meshBasicMaterial attach="material" map={useLoader(THREE.TextureLoader, `/src/fonts/emoji/emoji_u${window.emojiUnicode("🚪")}.png`)} transparent />
							</mesh>
							<Html className="clipped">
								<div className="emoji color gate" x={props.position.x} z={props.position.z}></div>
							</Html>
						</group>
						</>
					}
					if(field.property && field.property.level > 0){
						var propertyEmoji = PropertyLevelEmoji[field.property.level]
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
								<planeGeometry attach="geometry" args={[0.7, 0.7]} />
								<meshBasicMaterial attach="material" map={useLoader(THREE.TextureLoader, `/src/fonts/emoji/emoji_u${window.emojiUnicode(propertyEmoji)}.png`)} transparent />
							</mesh>
							<Html className="clipped">
								<div className="emoji color property" level={field.property.level} x={props.position.x} z={props.position.z}></div>
							</Html>
						</group>
						</>
					}
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
					if(field.jail){
						return <>
						<group position={props.position}>
							<mesh position={[0, 0, 0.005]} onClick={onClick}>
								<boxGeometry attach="geometry" args={[1, 1]} />
								<meshStandardMaterial attach="material" map={textures[texture]} transparent opacity={opacity} color="#5a5a7a" />
							</mesh>
							<Html className="clipped">
								<div className="emoji color jail" x={props.position.x} z={props.position.z}></div>
							</Html>
						</group>
						</>
					}
					if(field.gate){
						return <>
						<group position={props.position}>
							<mesh position={[0, 0, 0.005]} onClick={onClick}>
								<boxGeometry attach="geometry" args={[1, 1]} />
								<meshStandardMaterial attach="material" map={textures[texture]} transparent opacity={opacity} color="#ffcc00" />
							</mesh>
							<mesh rotation-x={rotation_x} rotation-z={Math.PI / 0.0815} position={[0, 0.52, 0]}>
								<planeGeometry attach="geometry" args={[0.7, 0.7]} />
								<meshBasicMaterial attach="material" map={useLoader(THREE.TextureLoader, `/src/fonts/emoji/emoji_u${window.emojiUnicode("🚪")}.png`)} transparent />
							</mesh>
							<Html className="clipped">
								<div className="emoji color gate" x={props.position.x} z={props.position.z}></div>
							</Html>
						</group>
						</>
					}
					if(field.property && field.property.level > 0){
						var propertyEmoji = PropertyLevelEmoji[field.property.level]
						return <>
						<group position={props.position}>
							<mesh position={[0, 0, 0.005]} onClick={onClick}>
								<boxGeometry attach="geometry" args={[1, 1]} />
								<meshStandardMaterial attach="material" map={textures[texture]} transparent opacity={opacity} color={color} />
							</mesh>
							<mesh rotation-x={rotation_x} rotation-z={Math.PI / 0.0815} position={[0, 0.52, 0]}>
								<planeGeometry attach="geometry" args={[0.7, 0.7]} />
								<meshBasicMaterial attach="material" map={useLoader(THREE.TextureLoader, `/src/fonts/emoji/emoji_u${window.emojiUnicode(propertyEmoji)}.png`)} transparent />
							</mesh>
							<Html className="clipped">
								<div className="emoji color property" level={field.property.level} x={props.position.x} z={props.position.z}></div>
							</Html>
						</group>
						</>
					}
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
		try{
			if(window.FieldsSync){ window.FieldsSync() }
		}catch(err){
		}
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

		window.grid = grid

		window.cursor = cursor;
		window.current = current;

		window.gl = gl

		window.addEventListener('click', onClick);
		window.addEventListener('contextmenu', onContextmenu);
		gl.domElement.addEventListener('webglcontextlost', onContextLost, false);

		return () => {
			window.removeEventListener('click', onClick);
			window.removeEventListener('contextmenu', onContextmenu);
			gl.domElement.removeEventListener('webglcontextlost', onContextLost, false)
		}
	})

	var mode = window.Mode()

	return (
		<>
			<Suspense>
				<Environment files="warehouse.hdr" />
			</Suspense>
			<mesh ref={cursor} rotation-x={-Math.PI / 2} position={[1.5, -0.001, 1.5]} renderOrder={10}>
				<planeGeometry attach="geometry" args={[0.6, 0.6]} />
				<meshBasicMaterial
					attach="material"
					color={cursor.color}
					transparent
					opacity={0.85}
					toneMapped={false}
					depthWrite={false}
					polygonOffset
					polygonOffsetFactor={-4}
					polygonOffsetUnits={-4}
				/>
			</mesh>
			<mesh ref={current} rotation-x={-Math.PI / 2} position={[1.5, 0, 1.5]} renderOrder={9}>
				<planeGeometry attach="geometry" args={[0.9, 0.9]} />
				<meshBasicMaterial
					attach="material"
					color={current.color}
					transparent
					opacity={0.45}
					toneMapped={false}
					depthWrite={false}
					polygonOffset
					polygonOffsetFactor={-3}
					polygonOffsetUnits={-3}
				/>
			</mesh>

			{(mode == "room" && !(window.MapGen && window.MapGen.ready)) ? <RoomGrid onClick={onClick} /> : null}

			<Suspense>
				{assets.map((asset) => (
					(mode == "room" && (window.MapGen && window.MapGen.ready) && (asset.name + "").indexOf("chord") === 0) ? (
						<ChordTile
							key={asset.id + ":chord"}
							uid={asset.id}
							hash={asset.hash}
							color={asset.color}
							position={
								new THREE.Vector3(
									asset.x,
									asset.y,
									asset.z
								)
							}
						/>
					) : (mode == "room" && (window.MapGen && window.MapGen.ready) && (asset.name + "").indexOf("open") === 0) ? (
						<OpenTile
							key={asset.id + ":" + asset.name}
							uid={asset.id}
							hash={asset.hash}
							name={asset.name}
							position={
								new THREE.Vector3(
									asset.x,
									asset.y,
									asset.z
								)
							}
						/>
					) : (mode == "room" && (asset.name + "").indexOf("#") !== 0) ? (
						<RoomAsset
							key={asset.id + ":" + asset.name}
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
					) : (
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
					)
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
						role={player.role}
						dice={player.dice}
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
