import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import React, { useMemo, useRef } from "react";

window.speed = 0.1

export function Player({
	...props
}) {
	const group = useRef();

	var cookies = window.cookies

	var props_hash = props.hash
	window[props_hash] = props
	window[props_hash].group = group

	var position = useMemo(() => props.position, []);

	var verify = props_hash.indexOf("0x") == 0 ? "true" : ""

	var self = ""

	if(props.self){
		if(props.self == true){
			self = "true"
		}else{
			self = props.self
		}
	}

	var follow = props.follow ? "true" : ""

	var self_hash = ""

	try{
		self_hash = cookies.address ? cookies.address : cookies.hash

		if(window.map.follow[self_hash].indexOf(props_hash) > -1){
			follow = "true"
		}
	}catch(err){

	}

	var roleEmoji = ""

	if(props.role == "PMC"){
		roleEmoji = "⚔"
	}else if(props.role == "SCAV"){
		roleEmoji = "🗡"
	}else if(props.role == "UCAV"){
		roleEmoji = "🛩"
	}

	useFrame((e, delta) => {
		position = window[props_hash].position
		var mode = window.Mode()

		if(cookies){
			if(mode == "room"){
				if(window.cookies.address){
					if(window.cookies.address == props_hash){
						position.x = window.current.current.position.x
						position.z = window.current.current.position.z
					}
				}else if(props_hash == window.cookies.hash){
					position.x = window.current.current.position.x
					position.z = window.current.current.position.z
				}
			}else{
				try{
					var b = window.map.biomes[`${Math.round(group.current.position.x - 0.5) + 0.5}:${Math.round(group.current.position.z - 0.5) + 0.5}`]
					if(!b){
						b = window.map.biomes[`${group.current.position.x}:${group.current.position.z}`]
					}
					if(b){
						var _cy = window.current.current.position.y
						if(typeof _cy === "undefined" || Math.abs(_cy - b.y) > 0.05){
							window.current.current.position.y = window.cursor.current.position.y = b.y
						}
					}
				}catch(err){
				}

				if(window.cookies.address){
					if(window.cookies.address == props_hash){
						position.x = window.current.current.position.x
						position.y = window.current.current.position.y + 0.5
						position.z = window.current.current.position.z
					}
				}else if(props_hash == window.cookies.hash){
					position.x = window.current.current.position.x
					position.y = window.current.current.position.y + 0.5
					position.z = window.current.current.position.z
				}
			}
		}

		/*
			개발 Part 18 (이동 보간 재작성)
			Part 17 의 오수정 3가지를 되돌리고 고친다.
			1) _gap > 3 순간이동
			   클릭 자유 이동은 3칸을 쉽게 넘는다.
			   그래서 필드에서 움직일 때마다 순간이동이 됐다("종종 튄다").
			   순간이동은 오직 window.Snap(진입 / 매치 전환 / 포털 / 룸 스폰)에서만 한다.
			2) 프레임 고정 스텝
			   multiplyScalar(window.speed) 는 프레임당 고정 거리라
			   프레임레이트가 흔들리면 속도가 그대로 흔들린다.
			   delta 를 곱해 초당 이동량을 일정하게 만든다.
			   기준은 60fps 이므로 speed * 60 * delta 가 기존과 동일 속도다.
			3) lookAt(position) 의 NaN
			   position 은 Experience 의 self() 경로에서 THREE.Vector3 가 아니라
			   { x, y, z } 평범한 객체가 들어올 수 있다.
			   Object3D.lookAt 은 isVector3 가 아니면 set(x, y, z) 로 처리하므로
			   객체를 넘기면 회전 행렬이 NaN 이 되어 표시가 튀었다.
			   반드시 3개 스칼라로 넘긴다.
			frameloop 게이트를 제거한 이유
			  보간을 "always" 에서만 돌리면 demand 로 내려가는 순간 이동이 멈춘다.
			  폴링 주기마다 always/demand 가 오가면 그게 곧 끊김으로 보인다.
			  프레임이 오는 동안에는 항상 목표를 향해 좁힌다.
		*/
		var _gap = group.current.position.distanceTo(position)
		if (window.Snap > 0) {
			group.current.position.set(position.x, position.y, position.z);
			return;
		}
		if (_gap <= 0.02) {
			group.current.position.set(position.x, position.y, position.z);
			return;
		}
		var _dt = (typeof delta === "number" && delta > 0 && delta < 0.25) ? delta : (1 / 60);
		var _speed = window.speed ? window.speed : 0.1;
		/*
			먼 거리일수록 가속한다.
			고정 속도(0.1/frame = 6칸/초)면 50칸 이동에 8초가 걸려
			"자연스럽다" 가 아니라 "느리다" 가 된다.
			최대 6배까지만 올려 가까운 거리의 연출은 그대로 둔다.
		*/
		var _boost = 1 + Math.min(_gap / 6, 5);
		var _step = _speed * 60 * _dt * _boost;
		if (_step >= _gap) {
			group.current.position.set(position.x, position.y, position.z);
		} else {
			const direction = group.current.position
				.clone()
				.sub(position)
				.normalize()
				.multiplyScalar(_step);
			group.current.position.sub(direction);
		}
		group.current.lookAt(position.x, position.y, position.z);
	});




	var type = "text"

	var url = false

	try{
		url = new URL(props.emoji)
	}catch(err){

	}

	var hex = ""
	var srcset = ""
	var src = ""
	var emoji = props.emoji

	var alt = props.emoji + ""

	var provider = ""
	var embed = ""

	var href = ""



	if(props.emoji.indexOf("data:image") > -1){
		type = "image"
		src = props.emoji
		alt = "playground"
		emoji = ""

	}else if(ethers.isAddress(props.emoji)){
		var hash = ""

		if(props.emoji.indexOf("#") > -1){
			hash = props.emoji.replace("#", "0x")
		}else{
			hash = "#"+props.emoji
		}

		href = window.location.host + window.location.pathname + hash

		type = "portal"
		alt = "portal"

	}else if(props.emoji.indexOf('https://') > -1){
		var oembed = window.oembed(url)

		if(oembed.provider){
			provider = oembed.provider
			embed = oembed.id
			src = oembed.src

			type = "video"			

		}else if(url.href.indexOf(".gif") > -1 || url.href.indexOf(".jpg") > -1 || url.href.indexOf(".jpeg") > -1 || url.href.indexOf(".png") > -1 || url.href.indexOf(".webp") > -1){
			type = "image"
			src = url.href
		}

		alt = "player"
	}else{
		alt = "player"

		var _animated = ["🔥", "🎃", "👻", "🛩", "⚔", "🗡"]

		if(props.emoji == "💣"){

		}else if(window.typeof_emoji(props.emoji) || _animated.indexOf(props.emoji) > -1){
			type = "image"
			hex = window.emojiUnicode(props.emoji)
			
			src = `/src/fonts/emoji/animated/${hex}.webp`
		}
	}

	return (
		<group ref={group} {...props} position={position}>
			<group>
				<Html>
					<player id={props_hash} team={props.team} dice={props.dice} type={type} self={self} follow={follow} verify={verify} alt={alt} role={props.role ? props.role : ""} world={window.Mode()} x={position.x} y={position.y} z={position.z}>
						<emoji type={type} selector={props_hash}>
							<div className="emoji color">
								<div data-plyr-provider={provider} data-plyr-embed-id={embed}></div>
								<picture>
									<img draggable="false" src={src} alt={alt} width="32" height="32" />
								</picture>
								<i>{emoji}</i>
								{roleEmoji ? <i className="role-emoji">{roleEmoji}</i> : null}
								<portal href={href}>
									<div className="mask"></div>
								</portal>
								<div className="address">
									<address>
										<span>{props_hash}</span>
										<span dir="rtl">{props_hash}</span>
									</address>
								</div>
							</div>
						</emoji>
						<div className="equipment" data-hash={props_hash}>
							<equipment>
								<ul></ul>
							</equipment>
						</div>
						<div className="tooltip">
							<tooltip>
								<ul className={props_hash}></ul>
							</tooltip>
						</div>
						<talks className={props_hash}>
							<ul></ul>
						</talks>
					</player>
				</Html>
			</group>
		</group>
	);
}