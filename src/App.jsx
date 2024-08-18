import { Canvas } from "@react-three/fiber";
import { EffectComposer, Bloom } from "@react-three/postprocessing";

import { Experience } from "./components/Experience";

import { useState, Suspense } from "react";


function App() {
	const [frameloop, setFrameloop] = useState("never");

	const [effect, setEffect] = useState(true);

	window.effect = effect
	window.setEffect = setEffect

	window.frameloop = frameloop
	window.setFrameloop = setFrameloop

	return (
		<>
			<Canvas frameloop={frameloop} camera={{ position: [6, 6, 6], fov: 40 }} performance={{ current: 1, min: 0.1, max: 1, debounce: 200}} gl={{ antialias: true, alpha: true }}>
				<Suspense>
					<EffectComposer>
						<Bloom luminanceThreshold mipmapBlur luminanceSmoothing intensity />
					</EffectComposer>
				</Suspense>
				<Experience />
			</Canvas>
		</>
	);
}

export default App;
