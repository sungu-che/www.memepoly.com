import { PerspectiveCamera, useAnimations, useGLTF, Sphere, Html } from "@react-three/drei";
import { useStore, useFrame, useGraph } from "@react-three/fiber";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { SkeletonUtils } from "three-stdlib";

window.speed = 0.1

function emojiUnicode (input) {
	return emojiUnicode.raw(input).split(' ').map(val => parseInt(val).toString(16)).join('_')
}

emojiUnicode.raw = function (input) {
	if (input.length === 1) {
		return input.charCodeAt(0).toString();
	}
	else if (input.length > 1) {
		const pairs = [];
		for (var i = 0; i < input.length; i++) {
			if (
				// high surrogate
				input.charCodeAt(i) >= 0xd800 && input.charCodeAt(i) <= 0xdbff
			) {
				if (
					input.charCodeAt(i + 1) >= 0xdc00 && input.charCodeAt(i + 1) <= 0xdfff
				) {
					// low surrogate
					pairs.push(
						(input.charCodeAt(i) - 0xd800) * 0x400
					  + (input.charCodeAt(i + 1) - 0xdc00) + 0x10000
					);
				}
			} else if (input.charCodeAt(i) < 0xd800 || input.charCodeAt(i) > 0xdfff) {
				// modifiers and joiners
				pairs.push(input.charCodeAt(i))
			}
		}
		return pairs.join(' ');
	}

	return '';
};

export function Player({
	...props
}) {
	const group = useRef();

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

	var self_hash = window.cookies.address ? window.cookies.address : window.cookies.hash


	try{
		if(window.map.follow[self_hash].indexOf(props_hash) > -1){
			follow = "true"
		}
	}catch(err){

	}

	useFrame((e) => {
		position = window[props_hash].position

		if(window.cookies){
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

		if(window.typeof_emoji(props.emoji)){
			type = "image"
			hex = emojiUnicode(props.emoji)
			
			src = `/src/fonts/emoji/animated/${hex}.webp`
		}
	}

	return (
		<group ref={group} {...props} position={position}>
			<group>
				<Html>
					<player id={props_hash} team={props.team} type={type} self={self} follow={follow} verify={verify} alt={alt} x={position.x} y={position.y} z={position.z}>
						<emoji type={type} selector={props_hash}>
							<div className="emoji color">
								<div data-plyr-provider={provider} data-plyr-embed-id={embed}></div>
								<picture>
									<img draggable="false" src={src} alt={alt} width="32" height="32" />
								</picture>
								<i>{emoji}</i>
								<portal href={href}>
									<div class="mask"></div>
								</portal>
								<div className="address">
									<address>
										<span>{props_hash}</span>
										<span dir="rtl">{props_hash}</span>
									</address>
								</div>
							</div>
						</emoji>
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