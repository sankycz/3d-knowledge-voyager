"use client";

import { Stars, Cloud, Float, Sphere, OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef, useMemo } from "react";
import * as THREE from "three";
import KnowledgeGraph from "./KnowledgeGraph";

export default function Experience({ items, onSelect, selectedId, isScanning }: { 
  items: any[], 
  onSelect: (id: string) => void,
  selectedId: string | null,
  isScanning: boolean
}) {
  const nebulaRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (nebulaRef.current) {
      nebulaRef.current.rotation.y += 0.0005;
      nebulaRef.current.rotation.z += 0.0002;
    }
  });

  return (
    <>
      <color attach="background" args={["#020205"]} />
      <fog attach="fog" args={["#020205", 20, 45]} />
      
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
      <ambientLight intensity={0.2} />
      <pointLight position={[10, 10, 10]} intensity={1.5} color="#00ffff" />
      <pointLight position={[-10, -10, -10]} intensity={1} color="#8a2be2" />
      <spotLight position={[0, 20, 0]} intensity={2} color="#ffffff" angle={0.5} penumbra={1} />

      {/* Background Environment */}
      <Stars radius={150} depth={50} count={9000} factor={4} saturation={0.8} fade speed={1.5} />
      
      <group ref={nebulaRef}>
        <Cloud 
          opacity={0.15} 
          speed={0.4} 
          bounds={[20, 10, 10]} 
          segments={40} 
          color="#113366" 
          position={[0, 0, -10]}
        />
        <Cloud 
          opacity={0.1} 
          speed={0.2} 
          bounds={[15, 5, 5]} 
          segments={20} 
          color="#440066" 
          position={[10, 5, -8]}
        />
        <Cloud 
          opacity={0.05} 
          speed={0.3} 
          bounds={[20, 10, 10]} 
          segments={30} 
          color="#006644" 
          position={[-10, -5, -12]}
        />
      </group>

      {/* Orbital Wireframe Grid & Scanning Sweep */}
      <group rotation={[Math.PI / 2, 0, 0]}>
        <gridHelper args={[120, 40, "#00ffff", "#ffffff"]}>
          <meshBasicMaterial attach="material" color="#00ffff" transparent opacity={0.04} />
        </gridHelper>
        
        {/* Scanning Sweep Line */}
        {isScanning && (
          <ScanningSweep />
        )}

        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[12, 12.1, 128]} />
          <meshBasicMaterial color="#00ffff" transparent opacity={0.2} toneMapped={false} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[22, 22.05, 128]} />
          <meshBasicMaterial color="#8a2be2" transparent opacity={0.1} toneMapped={false} />
        </mesh>
      </group>

      {/* Knowledge Core */}
      <KnowledgeGraph 
        items={items} 
        onSelect={onSelect} 
        selectedId={selectedId}
        isScanning={isScanning}
      />

      {/* Knowledge Core Glow */}
      <Float speed={4} rotationIntensity={1} floatIntensity={1}>
        <Sphere args={[1.5, 32, 32]} position={[0, 0, 0]}>
          <meshBasicMaterial color="#00ffff" transparent opacity={0.2} wireframe toneMapped={false} />
        </Sphere>
      </Float>
      <Sphere args={[4, 64, 64]} position={[0, 0, 0]}>
        <meshBasicMaterial color="#00ffff" transparent opacity={0.05} toneMapped={false} />
      </Sphere>
    </>
  );
}

function ScanningSweep() {
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
      <meshBasicMaterial color="#00ffff" transparent opacity={0.1} side={THREE.DoubleSide} />
    </mesh>
  );
}
