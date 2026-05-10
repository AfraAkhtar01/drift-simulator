import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { carState } from '@/game/store';
import { useGameStore } from '@/game/store';

export default function Car3D() {
  const groupRef = useRef<THREE.Group>(null);
  const carColor = useGameStore(s => s.carColor);
  const wheelsRef = useRef<THREE.Mesh[]>([]);

  useFrame(() => {
    if (!groupRef.current) return;
    groupRef.current.position.set(carState.px, 0, carState.pz);
    groupRef.current.rotation.y = carState.heading;
    wheelsRef.current.forEach(w => { if (w) w.rotation.x += carState.speed * 0.05; });
  });

  const wheelPositions: [number, number, number][] = [
    [-1.05, 0.25, 1.4], [1.05, 0.25, 1.4],
    [-1.05, 0.25, -1.4], [1.05, 0.25, -1.4],
  ];

  return (
    <group ref={groupRef}>
      {/* Body */}
      <mesh position={[0, 0.45, 0]} castShadow>
        <boxGeometry args={[2, 0.5, 4.5]} />
        <meshStandardMaterial color={carColor} metalness={0.6} roughness={0.3} />
      </mesh>
      {/* Cabin */}
      <mesh position={[0, 0.85, -0.2]} castShadow>
        <boxGeometry args={[1.7, 0.45, 2.2]} />
        <meshStandardMaterial color={carColor} metalness={0.6} roughness={0.3} />
      </mesh>
      {/* Windshield */}
      <mesh position={[0, 0.85, 0.95]} rotation={[0.4, 0, 0]}>
        <planeGeometry args={[1.65, 0.55]} />
        <meshStandardMaterial color="#88ccff" transparent opacity={0.4} side={THREE.DoubleSide} metalness={0.9} roughness={0.1} />
      </mesh>
      {/* Headlights */}
      {[-0.7, 0.7].map((x, i) => (
        <mesh key={`hl${i}`} position={[x, 0.45, 2.26]}>
          <boxGeometry args={[0.4, 0.15, 0.05]} />
          <meshStandardMaterial color="#ffffaa" emissive="#ffffaa" emissiveIntensity={2} />
        </mesh>
      ))}
      {/* Tail lights */}
      {[-0.7, 0.7].map((x, i) => (
        <mesh key={`tl${i}`} position={[x, 0.45, -2.26]}>
          <boxGeometry args={[0.4, 0.15, 0.05]} />
          <meshStandardMaterial color="#ff3333" emissive="#ff3333" emissiveIntensity={1} />
        </mesh>
      ))}
      {/* Spoiler */}
      <mesh position={[0, 1.0, -2.0]}>
        <boxGeometry args={[1.8, 0.05, 0.4]} />
        <meshStandardMaterial color={carColor} metalness={0.5} roughness={0.4} />
      </mesh>
      {/* Wheels */}
      {wheelPositions.map((pos, i) => (
        <mesh key={i} position={pos} rotation={[0, 0, Math.PI / 2]}
          ref={(el: THREE.Mesh | null) => { if (el) wheelsRef.current[i] = el; }}>
          <cylinderGeometry args={[0.28, 0.28, 0.22, 16]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
}
