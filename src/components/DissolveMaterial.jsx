import { useFrame } from "@react-three/fiber";
import { patchShaders } from "gl-noise";
import * as React from "react";
import * as THREE from "three";
import CSM from "three-custom-shader-material";

const vertexShader = /* glsl */ `
	varying vec2 vUv;
	varying vec3 vPosition; // use the world position instead of the uv
	void main() {
		vUv = uv;
		vPosition = position;
	}`;

const fragmentShader = patchShaders(/* glsl */ `
	varying vec2 vUv;
	varying vec3 vPosition;
	uniform float uThickness;
	uniform vec3 uColor;
	uniform float uProgress;
	
	void main() {
		gln_tFBMOpts opts = gln_tFBMOpts(1.0, 0.3, 2.0, 5.0, 1.0, 5, false, false);
		float noise = gln_sfbm(vPosition, opts);
		noise = gln_normalize(noise);

		float progress = uProgress;

		float alpha = step(1.0 - progress, noise);
		float border = step((1.0 - progress) - uThickness, noise) - alpha;
		
		csm_DiffuseColor.a = alpha + border;
		csm_DiffuseColor.rgb = mix(csm_DiffuseColor.rgb, uColor, border);
	}`);

export function DissolveMaterial({
	...props
}) {
	if(!window.map.dissolve){
		window.map.dissolve = {}
	}

	var key = props.position.x+":"+props.position.z

	var uProgress = window.map.dissolve[key] ? 1 : 0

	var uniforms = React.useRef({
		uThickness: { value: 0.1 },
		uColor: { value: new THREE.Color(props.color == "black" ? "#333" : props.color).multiplyScalar(50) },
		uProgress: { value: uProgress },
	});

	var baseMaterial = new THREE.MeshStandardMaterial({ color: props.color });

	useFrame((_state, delta) => {
		if(!window.map.dissolve){
			window.map.dissolve = {}
		}

		if(uniforms.current.uProgress.value > 0.9){
			window.map.dissolve[key] = uProgress = 1
		}

		if(!uProgress){
			window.map.dissolve[key] = uniforms.current.uProgress

			if(window.frameloop == "always"){
				var _v = uniforms.current.uProgress.value
				var _t = 1 - Math.exp(-(delta / 0.5))

				uniforms.current.uProgress.value = _v + (1 - _v) * _t
			}
		}
	});

	return (
		<>
			<CSM
				baseMaterial={baseMaterial}
				vertexShader={vertexShader}
				fragmentShader={fragmentShader}
				uniforms={uniforms.current}
				toneMapped={true}
				transparent
			/>
		</>
	);
}