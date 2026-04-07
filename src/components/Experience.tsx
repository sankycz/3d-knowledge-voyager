"use client";

import { Environment, Float, MeshDistortMaterial, Sphere, Text, Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef, useState, useEffect } from "react";
import * as THREE from "three";

interface NewsItem {
  id: number;
  title: string;
  summary: string;
  content: string;
  link?: string;
}

export default function Experience({ searchQuery = "" }: { searchQuery?: string }) {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<NewsItem | null>(null);
  const [loading, setLoading] = useState(true);

  // Načítání dynamických dat z reálného RSS API
  useEffect(() => {
    async function fetchNews() {
      try {
        setLoading(true);
        const res = await fetch("/api/news");
        const data = await res.json();
        setNews(data);
      } catch (err) {
        console.error("Chyba při načítání novinek:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchNews();
  }, []);

  return (
    <>
      <Environment preset="city" />
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 10, 10]} intensity={1.5} castShadow />
      <gridHelper args={[100, 100, "#2a2a2a", "#1a1a1a"]} position={[0, -0.01, 0]} />

      <Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.5}>
        <mesh position={[0, 2, 0]}>
          <octahedronGeometry args={[1.5, 0]} />
          <MeshDistortMaterial
            color="#3b82f6"
            speed={2}
            distort={0.4}
            radius={1}
            roughness={0.2}
            metalness={0.8}
            emissive="#1d4ed8"
            emissiveIntensity={0.2}
          />
        </mesh>
      </Float>

      <Text
        position={[0, 4.5, 0]}
        fontSize={0.8}
        color="white"
        font="https://fonts.gstatic.com/s/plusjakartasans/v3/L0xoDF6tsZBy4shX8PncY4WGD_6m8f3F.woff"
      >
        {loading ? "AKTUALIZUJI DATA..." : searchQuery ? `VÝSLEDKY VYHLEDÁVÁNÍ` : "KNOWLEDGE VOYAGER"}
      </Text>

      {/* Projekty (zatím statické) */}
      <ProjectArtifact position={[-5, 1, 5]} color="#ec4899" title="Stitch Plugin" />
      <ProjectArtifact position={[5, 1, -5]} color="#10b981" title="Splunk MCP" />
      
      {/* Dynamické novinky (vizuální filtrování zatemňováním) */}
      {news.map((item, index) => {
        const isMatch = !searchQuery || 
          item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.summary.toLowerCase().includes(searchQuery.toLowerCase());
        
        const radius = 7 + Math.floor(index / 3) * 3;
        const angle = (index * (Math.PI / 2)) + (Math.floor(index / 4) * (Math.PI / 6));
        
        return (
          <NewsSphere 
            key={item.id}
            position={[
              Math.sin(angle) * radius, 
              2 + Math.sin(index) * 1.5, 
              Math.cos(angle) * radius
            ]}
            item={item} 
            isDimmed={!isMatch}
            isSelected={selectedItem?.id === item.id}
            onSelect={() => setSelectedItem(item === selectedItem ? null : item)}
          />
        );
      })}

      {/* Info panel pro vybranou novinku (3D detail) */}
      {selectedItem && (
        <Html position={[0, 6.5, 0]} center distanceFactor={12} pointerEvents="auto">
          <div className="bg-neutral-900/90 backdrop-blur-3xl border border-blue-500/30 p-8 rounded-3xl w-[500px] shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-2xl font-black text-blue-400 pr-4">{selectedItem.title}</h3>
              <button 
                onClick={() => setSelectedItem(null)}
                className="text-neutral-500 hover:text-white transition-colors p-1"
              >
                ✕
              </button>
            </div>
            <p className="text-neutral-300 leading-relaxed text-lg mb-6">
              {selectedItem.summary}
            </p>
            <div className="flex justify-between items-center pt-4 border-t border-white/5">
              <div className="flex gap-2">
                <span className="bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">AI Context</span>
              </div>
              {selectedItem.link && (
                <a 
                  href={selectedItem.link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-white text-xs font-bold underline transition-colors"
                >
                  Číst původní článek →
                </a>
              )}
            </div>
          </div>
        </Html>
      )}
    </>
  );
}

function ProjectArtifact({ position, color, title }: { position: [number, number, number], color: string, title: string }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame(() => {
    if (meshRef.current) meshRef.current.rotation.y += 0.01;
  });

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        castShadow
      >
        <boxGeometry args={[1.5, 1.5, 1.5]} />
        <meshStandardMaterial color={hovered ? "#ffffff" : color} metalness={0.6} roughness={0.2} transparent opacity={0.8} />
      </mesh>
      <Text position={[0, 1.5, 0]} fontSize={0.3} color="white" anchorX="center" anchorY="middle">
        {title}
      </Text>
    </group>
  );
}

function NewsSphere({ position, item, onSelect, isSelected, isDimmed }: { 
  position: [number, number, number], 
  item: NewsItem, 
  onSelect: () => void,
  isSelected: boolean,
  isDimmed: boolean
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <group position={position} scale={isDimmed ? 0.3 : 1}>
      <Float speed={isDimmed ? 0.5 : 2} rotationIntensity={isDimmed ? 0.2 : 1} floatIntensity={1}>
        <Sphere
          onPointerDown={(e) => {
            if (isDimmed) return;
            e.stopPropagation();
            onSelect();
          }}
          args={[0.8, 32, 32]}
          onPointerOver={() => !isDimmed && setHovered(true)}
          onPointerOut={() => setHovered(false)}
        >
          <meshStandardMaterial
            color={isSelected ? "#3b82f6" : (hovered ? "#fde047" : "#eab308")}
            emissive={isSelected ? "#2563eb" : "#eab308"}
            emissiveIntensity={hovered || isSelected ? 0.8 : 0.4}
            metalness={0.9}
            roughness={0.1}
            transparent
            opacity={isDimmed ? 0.05 : 1}
          />
        </Sphere>
      </Float>
      {!isDimmed && (
        <Text position={[0, 1.4, 0]} fontSize={0.2} color="white" anchorX="center" anchorY="middle" maxWidth={2}>
          {item.title}
        </Text>
      )}
    </group>
  );
}
