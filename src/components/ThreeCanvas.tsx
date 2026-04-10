"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import Experience from "./Experience";

interface ThreeCanvasProps {
  items: any[];
  onSelect: (id: string) => void;
  selectedId: string | null;
  isScanning: boolean;
  theme: "light" | "dark";
}

export default function ThreeCanvas({ items, onSelect, selectedId, isScanning, theme }: ThreeCanvasProps) {
  return (
    <div className="w-full h-screen bg-transparent">
      <Canvas
        shadows
        camera={{ position: [0, 5, 20], fov: 35 }}
        gl={{ antialias: true }}
      >
        <Suspense fallback={null}>
          <Experience 
            items={items} 
            onSelect={onSelect} 
            selectedId={selectedId} 
            isScanning={isScanning} 
            theme={theme}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
