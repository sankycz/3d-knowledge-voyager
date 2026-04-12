"use client";

import { Stars, Cloud, Float, Sphere, OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef, useMemo } from "react";
import * as THREE from "three";
import KnowledgeGraph from "./KnowledgeGraph";

export default function Experience({ items, onSelect, selectedId, isScanning, theme, graphColorOverride }: { 
  items: any[], 
  onSelect: (id: string) => void,
  selectedId: string | null,
  isScanning: boolean,
  theme: "dark" | "light",
  graphColorOverride?: string
}) {
  const nebulaRef = useRef<THREE.Group>(null);

  const colors = useMemo(() => ({
    bg: theme === "dark" ? "#0e0e0e" : "#f8fafc",
    fog: theme === "dark" ? "#0e0e0e" : "#f8fafc",
    lightPrimary: graphColorOverride || (theme === "dark" ? "#a4e6ff" : "#00677f"),
    lightSecondary: theme === "dark" ? "#dfb7ff" : "#6b00b0",
    cloud1: theme === "dark" ? "#00d1ff" : "#00677f",
    cloud2: theme === "dark" ? "#9d05ff" : "#6b00b0",
    cloud3: theme === "dark" ? "#00fca1" : "#005b37",
    grid: graphColorOverride || (theme === "dark" ? "#a4e6ff" : "#00677f"),
  }), [theme, graphColorOverride]);

  useFrame((state) => {
    if (nebulaRef.current) {
      nebulaRef.current.rotation.y += 0.0005;
      nebulaRef.current.rotation.z += 0.0002;
    }
  });

  return (
    <>
      <color attach="background" args={[colors.bg]} />
      <fog attach="fog" args={[colors.fog, 20, 45]} />
      
      <PerspectiveCamera makeDefault position={[0, 0, 25]} fov={50} />
      <OrbitControls 
        enablePan={false} 
        enableZoom={true} 
        maxDistance={40} 
        minDistance={5}
        autoRotate={!isScanning}
        autoRotateSpeed={0.5}
      />

      {/* Lighting */}
      <ambientLight intensity={theme === "dark" ? 0.2 : 0.8} />
      <pointLight position={[10, 10, 10]} intensity={theme === "dark" ? 1.5 : 0.8} color={colors.lightPrimary} />
      <pointLight position={[-10, -10, -10]} intensity={theme === "dark" ? 1 : 0.5} color={colors.lightSecondary} />
      <spotLight position={[0, 20, 0]} intensity={theme === "dark" ? 2 : 1.2} color="#ffffff" angle={0.5} penumbra={1} />

      {/* Background Environment */}
      <Stars 
        radius={150} 
        depth={50} 
        count={theme === "dark" ? 9000 : 2000} 
        factor={4} 
        saturation={theme === "dark" ? 0.8 : 0.2} 
        fade 
        speed={1.5} 
      />
      
      <group ref={nebulaRef}>
        <Cloud 
          opacity={theme === "dark" ? 0.15 : 0.05} 
          speed={0.4} 
          bounds={[20, 10, 10]} 
          segments={40} 
          color={colors.cloud1} 
          position={[0, 0, -10]}
        />
        <Cloud 
          opacity={theme === "dark" ? 0.1 : 0.03} 
          speed={0.2} 
          bounds={[15, 5, 5]} 
          segments={20} 
          color={colors.cloud2} 
          position={[10, 5, -8]}
        />
        <Cloud 
          opacity={theme === "dark" ? 0.05 : 0.02} 
          speed={0.3} 
          bounds={[20, 10, 10]} 
          segments={30} 
          color={colors.cloud3} 
          position={[-10, -5, -12]}
        />
      </group>

      {/* Orbital Wireframe Grid & Scanning Sweep */}
      <group rotation={[Math.PI / 2, 0, 0]}>
        <gridHelper args={[120, 40, colors.grid, theme === "dark" ? "#ffffff" : "#64748b"]}>
          <meshBasicMaterial attach="material" color={colors.grid} transparent opacity={theme === "dark" ? 0.04 : 0.08} />
        </gridHelper>
        
        {/* Scanning Sweep Line */}
        {isScanning && (
          <ScanningSweep color={colors.grid} />
        )}

        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[12, 12.1, 128]} />
          <meshBasicMaterial color={colors.grid} transparent opacity={theme === "dark" ? 0.2 : 0.4} toneMapped={false} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[22, 22.05, 128]} />
          <meshBasicMaterial color={colors.lightSecondary} transparent opacity={theme === "dark" ? 0.1 : 0.2} toneMapped={false} />
        </mesh>
      </group>

      {/* Knowledge Core */}
      <KnowledgeGraph 
        items={items} 
        onSelect={onSelect} 
        selectedId={selectedId}
        isScanning={isScanning}
        theme={theme}
      />

      {/* Knowledge Core Glow */}
      <Float speed={4} rotationIntensity={1} floatIntensity={1}>
        <Sphere args={[1.5, 32, 32]} position={[0, 0, 0]}>
          <meshBasicMaterial color={colors.lightPrimary} transparent opacity={theme === "dark" ? 0.2 : 0.1} wireframe toneMapped={false} />
        </Sphere>
      </Float>
      <Sphere args={[4, 64, 64]} position={[0, 0, 0]}>
        <meshBasicMaterial color={colors.lightPrimary} transparent opacity={theme === "dark" ? 0.05 : 0.02} toneMapped={false} />
      </Sphere>
    </>
  );
}

function ScanningSweep({ color = "#00ffff" }: { color?: string }) {
  const lineRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (lineRef.current) {
      const t = (state.clock.getElapsedTime() * 0.5) % 1;
      lineRef.current.position.y = 50 - t * 100;
      if (lineRef.current.material instanceof THREE.MeshBasicMaterial) {
        lineRef.current.material.opacity = Math.sin(t * Math.PI) * 0.1;
      }
    }
  });

  return (
    <mesh ref={lineRef} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[120, 0.5]} />
      <meshBasicMaterial color={color} transparent opacity={0.1} side={THREE.DoubleSide} />
    </mesh>
  );
}
