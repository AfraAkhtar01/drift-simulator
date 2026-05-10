import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { carState } from '@/game/store';

const MAX_MARKS = 2000;

export default function DriftEffects() {
  // Skid marks
  const marksRef = useRef<THREE.InstancedMesh>(null);
  const markIdx = useRef(0);
  const tempObj = useMemo(() => new THREE.Object3D(), []);
  const lastMarkPos = useRef({ x: 0, z: 0 });

  // Smoke
  const smokeGeom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(300);
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setDrawRange(0, 0);
    return g;
  }, []);
  const smokeData = useRef<{ x: number; y: number; z: number; life: number }[]>([]);

  const smokeTexture = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 32; c.height = 32;
    const ctx = c.getContext('2d')!;
    const g = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 32, 32);
    return new THREE.CanvasTexture(c);
  }, []);

  useFrame((_, dt) => {
    dt = Math.min(dt, 0.05);

    // Skid marks
    if (carState.isDrifting && carState.speed > 5 && marksRef.current) {
      const dx = carState.px - lastMarkPos.current.x;
      const dz = carState.pz - lastMarkPos.current.z;
      if (dx * dx + dz * dz > 1) {
        const h = carState.heading;
        const rearOffsets = [
          { x: Math.cos(h) * 0.8 - Math.sin(h) * 1.3, z: -Math.sin(h) * 0.8 - Math.cos(h) * 1.3 },
          { x: -Math.cos(h) * 0.8 - Math.sin(h) * 1.3, z: Math.sin(h) * 0.8 - Math.cos(h) * 1.3 },
        ];
        for (const off of rearOffsets) {
          const idx = markIdx.current % MAX_MARKS;
          tempObj.position.set(carState.px + off.x, 0.015, carState.pz + off.z);
          tempObj.rotation.set(-Math.PI / 2, 0, h);
          tempObj.scale.set(1, 1, 1);
          tempObj.updateMatrix();
          marksRef.current.setMatrixAt(idx, tempObj.matrix);
          markIdx.current++;
        }
        marksRef.current.count = Math.min(markIdx.current, MAX_MARKS);
        marksRef.current.instanceMatrix.needsUpdate = true;
        lastMarkPos.current = { x: carState.px, z: carState.pz };
      }
    }

    // Smoke particles
    if (carState.isDrifting && carState.speed > 5 && smokeData.current.length < 100) {
      const bx = carState.px - Math.sin(carState.heading) * 2.5;
      const bz = carState.pz - Math.cos(carState.heading) * 2.5;
      smokeData.current.push(
        { x: bx + (Math.random() - 0.5) * 2, y: 0.5 + Math.random(), z: bz + (Math.random() - 0.5) * 2, life: 1 },
        { x: bx + (Math.random() - 0.5) * 2, y: 0.5 + Math.random(), z: bz + (Math.random() - 0.5) * 2, life: 1 },
      );
    }

    let alive = 0;
    const posArr = smokeGeom.getAttribute('position') as THREE.BufferAttribute;
    const arr = posArr.array as Float32Array;
    for (let i = 0; i < smokeData.current.length; i++) {
      const p = smokeData.current[i];
      p.life -= dt * 1.5;
      p.y += dt * 2;
      if (p.life > 0) {
        arr[alive * 3] = p.x;
        arr[alive * 3 + 1] = p.y;
        arr[alive * 3 + 2] = p.z;
        smokeData.current[alive] = p;
        alive++;
      }
    }
    smokeData.current.length = alive;
    posArr.needsUpdate = true;
    smokeGeom.setDrawRange(0, alive);
  });

  return (
    <>
      <instancedMesh ref={marksRef} args={[undefined, undefined, MAX_MARKS]} frustumCulled={false}>
        <planeGeometry args={[0.25, 0.7]} />
        <meshBasicMaterial color="#111111" transparent opacity={0.6} depthWrite={false} />
      </instancedMesh>

      <points geometry={smokeGeom} frustumCulled={false}>
        <pointsMaterial map={smokeTexture} size={2.5} transparent opacity={0.35} sizeAttenuation depthWrite={false} />
      </points>
    </>
  );
}
