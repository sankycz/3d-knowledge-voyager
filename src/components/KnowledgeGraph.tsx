"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useRef, useState, useMemo, useEffect } from "react";
import * as THREE from "three";
import { Text, Float, Line, Sphere, Billboard, QuadraticBezierLine } from "@react-three/drei";

interface NodeData {
  id: string;
  title: string;
  category: string;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  size: number;
}

interface EdgeData {
  source: string;
  target: string;
}

interface KnowledgeGraphProps {
  items: any[];
  onSelect: (id: string) => void;
  selectedId: string | null;
  isScanning: boolean;
}

const CATEGORY_COLORS: Record<string, string> = {
  AI: "#00ffff",
  "Věda": "#8a2be2",
  Tech: "#00ffa3",
  "Výzkum": "#ffaa00",
  Default: "#4444ff",
};

export default function KnowledgeGraph({ items, onSelect, selectedId, isScanning }: KnowledgeGraphProps) {
  const { camera } = useThree();
  const graphRef = useRef<THREE.Group>(null);
  const [nodes, setNodes] = useState<NodeData[]>([]);
  const [edges, setEdges] = useState<EdgeData[]>([]);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  useEffect(() => {
    if (items.length === 0) return;

    const newNodes: NodeData[] = items.map((item, i) => {
      const existing = nodes.find(n => n.id === item.id);
      if (existing) return existing;

      const r = 12 + Math.random() * 8;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      return {
        id: item.id,
        title: item.title,
        category: item.category || "Default",
        x: r * Math.sin(phi) * Math.cos(theta),
        y: r * Math.sin(phi) * Math.sin(theta),
        z: r * Math.cos(phi),
        vx: 0,
        vy: 0,
        vz: 0,
        size: 0.2 + Math.random() * 0.3,
      };
    });

    const newEdges: EdgeData[] = [];
    const categories = Array.from(new Set(newNodes.map(n => n.category)));
    
    categories.forEach(cat => {
      const catNodes = newNodes.filter(n => n.category === cat);
      catNodes.forEach((node, idx) => {
        const targetIdx = (idx + 1) % catNodes.length;
        if (node.id !== catNodes[targetIdx].id) {
          newEdges.push({ source: node.id, target: catNodes[targetIdx].id });
        }
      });
    });

    setNodes(newNodes);
    setEdges(newEdges);
  }, [items]);

  useFrame((state, delta) => {
    if (nodes.length < 2) return;

    const dt = Math.min(delta, 0.1); 
    const scanMultiplier = isScanning ? 3 : 1;

    for (let i = 0; i < nodes.length; i++) {
      const n1 = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) {
        const n2 = nodes[j];
        const dx = n1.x - n2.x;
        const dy = n1.y - n2.y;
        const dz = n1.z - n2.z;
        const distSq = dx * dx + dy * dy + dz * dz + 0.1;
        const force = 1.5 / distSq;
        
        const dist = Math.sqrt(distSq);
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        const fz = (dz / dist) * force;

        n1.vx += fx; n1.vy += fy; n1.vz += fz;
        n2.vx -= fx; n2.vy -= fy; n2.vz -= fz;
      }

      const distCenter = Math.sqrt(n1.x * n1.x + n1.y * n1.y + n1.z * n1.z);
      const gravity = distCenter * 0.008 * scanMultiplier;
      n1.vx -= (n1.x / distCenter) * gravity;
      n1.vy -= (n1.y / distCenter) * gravity;
      n1.vz -= (n1.z / distCenter) * gravity;
    }

    edges.forEach(edge => {
      const n1 = nodes.find(n => n.id === edge.source);
      const n2 = nodes.find(n => n.id === edge.target);
      if (!n1 || !n2) return;

      const dx = n1.x - n2.x;
      const dy = n1.y - n2.y;
      const dz = n1.z - n2.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) || 0.1;
      const force = (dist - 8) * 0.015;

      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;
      const fz = (dz / dist) * force;

      n1.vx -= fx; n1.vy -= fy; n1.vz -= fz;
      n2.vx += fx; n2.vy += fy; n2.vz += fz;
    });

    nodes.forEach(n => {
      n.x += n.vx;
      n.y += n.vy;
      n.z += n.vz;
      n.vx *= 0.9;
      n.vy *= 0.9;
      n.vz *= 0.9;
    });

    if (graphRef.current) {
      graphRef.current.rotation.y += delta * 0.03 * scanMultiplier;
    }
  });

  return (
    <group ref={graphRef}>
      {edges.map((edge, i) => {
        const s = nodes.find(n => n.id === edge.source);
        const t = nodes.find(n => n.id === edge.target);
        if (!s || !t) return null;

        // Calculate a consistent but dynamic mid point for the Bezier curve
        const mid: [number, number, number] = [
          (s.x + t.x) / 2 + (Math.sin(i) * 2),
          (s.y + t.y) / 2 + (Math.cos(i) * 2),
          (s.z + t.z) / 2 + (Math.sin(i + 1) * 2)
        ];

        return (
          <Connection 
            key={`${edge.source}-${edge.target}`} 
            start={[s.x, s.y, s.z]} 
            end={[t.x, t.y, t.z]} 
            mid={mid}
            isScanning={isScanning}
            isHighlighted={hoveredNodeId === edge.source || hoveredNodeId === edge.target || selectedId === edge.source || selectedId === edge.target}
          />
        );
      })}

        <GraphNode
          key={node.id}
          node={node}
          isSelected={node.id === selectedId}
          isHovered={node.id === hoveredNodeId}
          isScanning={isScanning}
          onSelect={() => onSelect(node.id)}
          onHover={(hovered) => setHoveredNodeId(hovered ? node.id : null)}
        />
      ))}
    </group>
  );
}

function Connection({ start, end, mid, isScanning, isHighlighted }: { 
  start: any, 
  end: any, 
  mid: any, 
  isScanning: boolean, 
  isHighlighted: boolean 
}) {
  const lineRef = useRef<any>(null);
  const packetRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (lineRef.current) {
      lineRef.current.material.dashOffset -= 0.01 * (isScanning ? 5 : 1);
    }
    if (packetRef.current) {
      const speed = isHighlighted ? 2 : (isScanning ? 3 : 0.8);
      const t = (state.clock.getElapsedTime() * speed) % 1;
      // Quadratic Bezier Interpolation
      const x = (1 - t) * (1 - t) * start[0] + 2 * (1 - t) * t * mid[0] + t * t * end[0];
      const y = (1 - t) * (1 - t) * start[1] + 2 * (1 - t) * t * mid[1] + t * t * end[1];
      const z = (1 - t) * (1 - t) * start[2] + 2 * (1 - t) * t * mid[2] + t * t * end[2];
      packetRef.current.position.set(x, y, z);
      
      if (packetRef.current.material instanceof THREE.MeshBasicMaterial) {
        packetRef.current.material.opacity = isHighlighted ? 1 : 0.4;
      }
    }
  });

  return (
    <group>
      <QuadraticBezierLine
        ref={lineRef}
        start={start}
        end={end}
        mid={mid}
        color={isHighlighted ? "#00ffff" : "#4444ff"}
        opacity={isHighlighted ? 0.8 : 0.15}
        transparent
        lineWidth={isHighlighted ? 1.5 : 0.5}
        dashed={!isHighlighted}
        dashSize={0.2}
        gapSize={0.2}
      />
      <mesh ref={packetRef}>
        <sphereGeometry args={[isHighlighted ? 0.08 : 0.04, 8, 8]} />
        <meshBasicMaterial color={isHighlighted ? "#ffffff" : "#00ffff"} toneMapped={false} transparent />
      </mesh>
    </group>
  );
}

function GraphNode({ node, isSelected, isHovered, isScanning, onSelect, onHover }: { 
  node: NodeData, 
  isSelected: boolean, 
  isHovered: boolean,
  isScanning: boolean,
  onSelect: () => void,
  onHover: (hovered: boolean) => void
}) {
  const groupRef = useRef<THREE.Group>(null);
  const color = CATEGORY_COLORS[node.category] || CATEGORY_COLORS.Default;

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.position.lerp(new THREE.Vector3(node.x, node.y, node.z), 0.1);
    }
  });

  return (
    <group ref={groupRef}>
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
        <mesh 
          onClick={(e) => { e.stopPropagation(); onSelect(); }}
          onPointerOver={(e) => { e.stopPropagation(); onHover(true); document.body.style.cursor = 'pointer'; }}
          onPointerOut={() => { onHover(false); document.body.style.cursor = 'auto'; }}
        >
          <sphereGeometry args={[isSelected ? 0.4 : 0.18, 32, 32]} />
          <meshStandardMaterial 
            color={isSelected || isHovered ? "#ffffff" : color} 
            emissive={color} 
            emissiveIntensity={isSelected || isHovered ? 8 : (isScanning ? 3 : 1.5)} 
            toneMapped={false}
          />
          
          {/* Secondary "Ping" Ring */}
          {(isSelected || isScanning) && (
            <PingAnimation color={color} />
          )}

          {/* Glow Sphere */}
          {isSelected && (
            <mesh scale={[2, 2, 2]}>
              <sphereGeometry args={[0.3, 16, 16]} />
              <meshBasicMaterial color={color} transparent opacity={0.15} wireframe />
            </mesh>
          )}
        </mesh>
      </Float>

      <Billboard position={[0, 0.8, 0]}>
        <Text
          fontSize={0.15}
          color="white"
          maxWidth={1.5}
          textAlign="center"
          font="https://fonts.gstatic.com/s/jetbrainsmono/v18/t6nu27PSqS_Z7xPto9N06UeX029q83Mv.woff"
          fillOpacity={isSelected ? 1 : (isScanning ? 0.9 : 0.3)}
        >
          {node.title.toUpperCase()}
          <meshBasicMaterial 
            color="white" 
            transparent 
            opacity={isSelected ? 1 : 0.3} 
            toneMapped={false}
          />
        </Text>
      </Billboard>
    </group>
  );
}

function PingAnimation({ color }: { color: string }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (ref.current) {
      const t = (state.clock.getElapsedTime() * 1.5) % 1;
      ref.current.scale.setScalar(1 + t * 4);
      if (ref.current.material instanceof THREE.MeshBasicMaterial) {
        ref.current.material.opacity = (1 - t) * 0.5;
      }
    }
  });

  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.2, 0.22, 32]} />
      <meshBasicMaterial color={color} transparent opacity={0.5} side={THREE.DoubleSide} toneMapped={false} />
    </mesh>
  );
}
