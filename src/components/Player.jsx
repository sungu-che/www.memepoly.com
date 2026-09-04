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

	useFrame((e) => {
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

		if (group.current.position.distanceTo(position) > 0.1 && window.frameloop == "always") {
			const direction = group.current.position
				.clone()
				.sub(position)
				.normalize()
				.multiplyScalar(window.speed);

			group.current.position.sub(direction);
			group.current.lookAt(position);
		}
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