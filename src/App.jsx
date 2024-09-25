import { Canvas } from "@react-three/fiber";

import { Experience } from "./components/Experience";

import { useState } from "react";


function App() {
	const [frameloop, setFrameloop] = useState("never");

	window.frameloop = frameloop
	window.setFrameloop = setFrameloop

	return (
		<>
			<Canvas frameloop={frameloop} camera={{ position: [6, 6, 6], fov: 40 }} performance={{ current: 1, min: 1, max: 1, debounce: 200}} gl={{ antialias: false, alpha: false }}>
				<Experience />
			</Canvas>
		</>
	);		
}

export default App;
