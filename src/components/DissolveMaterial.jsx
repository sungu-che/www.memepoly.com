import { useFrame } from "@react-three/fiber";
import { patchShaders } from "gl-noise";
import { easing } from "maath";
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
		// float noise = gln_sfbm(vUv, opts); // THE ORIGINAL CODE FROM THE TUTORIAL
		float noise = gln_sfbm(vPosition, opts); // use the world position instead of the uv for a better effect working on all objects
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
	var uProgress = window.map[(props.position.x+":"+props.position.z)] ? 1 : 0
	var uniforms = React.useRef({
		uThickness: { value: 0.1 },
		uColor: { value: new THREE.Color(props.color == "black" ? "#333" : props.color).multiplyScalar(50) },
		uProgress: { value: uProgress },
	});

	var baseMaterial = new THREE.MeshStandardMaterial({ color: props.color });

	useFrame((_state, delta) => {
		if(uniforms.current.uProgress.value > 0.9){
			window.map[(props.position.x+":"+props.position.z)] = uProgress = 1
		}

		if(!uProgress){
			window.map[(props.position.x+":"+props.position.z)] = uniforms.current.uProgress
			if(window.frameloop == "always"){
				easing.damp(
					uniforms.current.uProgress,
					"value",
					1,
					0.5,
					delta
				);
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