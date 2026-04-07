"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import Experience from "./Experience";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";

export default function ThreeCanvas({ searchQuery }: { searchQuery: string }) {
  return (
    <div className="w-full h-screen bg-neutral-950">
      <Canvas shadows>
        <Suspense fallback={null}>
          <PerspectiveCamera makeDefault position={[12, 12, 12]} fov={50} />
          <Experience searchQuery={searchQuery} />
          <OrbitControls makeDefault minPolarAngle={0} maxPolarAngle={Math.PI / 1.75} />
        </Suspense>
      </Canvas>
    </div>
  );
}
