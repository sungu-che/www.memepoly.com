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
	try{
		var _isSelf = (self == "true")
		if(!_isSelf && self_hash && props_hash){
			if(String(self_hash).toLowerCase() === String(props_hash).toLowerCase()){
				_isSelf = true
			}
		}
		if(!_isSelf){
			var _myRole = (cookies && cookies.role) ? cookies.role : ""
			if(_myRole == "UCAV" && props.role == "UCAV"){
				roleEmoji = "⚔"
			}
		}
	}catch(err){
		roleEmoji = ""
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
						var _lift = window.TileLift ? window.TileLift * 1 : 0.02
						if(isNaN(_lift)){
							_lift = 0.02
						}
						var _cy = window.current.current.position.y
						if(typeof _cy === "undefined" || Math.abs(_cy - (b.y + _lift)) > 0.05){
							window.current.current.position.y = b.y + _lift
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
		var _rolling = false;
		try {
			_rolling = (typeof window.Roll.ing !== "undefined");
		} catch (err) {
			_rolling = false;
		}
		if (_gap <= 1.6) {
			var _tau = _rolling
				? (window.MoveTau ? window.MoveTau * 1 : 0.25)
				: (window.MoveTauFree ? window.MoveTauFree * 1 : 0.25);
			if (isNaN(_tau) || _tau <= 0) {
				_tau = 0.15;
			}
			var _k = 1 - Math.exp(-_dt / _tau);
			if (_k > 1) {
				_k = 1;
			}
			group.current.position.lerp(position, _k);
		} else {
			var _speed = window.speed ? window.speed : 0.1;
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
		}
		if (_gap > 0.15) {
			group.current.lookAt(position.x, position.y, position.z);
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
		var _imgSrc = window.EmojiSrc ? window.EmojiSrc(props.emoji) : ""
		if(_imgSrc){
			type = "image"
			src = _imgSrc
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
									<img draggable="false" src={src} alt={alt} width="32" height="32"
										onError={function(e){
											if(!e || !e.target || !e.target.getAttribute("src")){
												return
											}
											if(window.EmojiSrcError){
												window.EmojiSrcError(e.target)
											}
										}} />
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