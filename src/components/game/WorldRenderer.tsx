import { useRef, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { useGameStore } from '@/game/store';
import { WORLD, ROAD_CONFIG } from '@/game/worldData';
import { getTheme } from '@/game/themes';

export default function WorldRenderer() {
  const theme = useGameStore(s => s.theme);
  const timeOfDay = useGameStore(s => s.timeOfDay);
  const cfg = getTheme(theme, timeOfDay);

  const buildingRef = useRef<THREE.InstancedMesh>(null);
  const trunkRef = useRef<THREE.InstancedMesh>(null);
  const foliageRef = useRef<THREE.InstancedMesh>(null);
  const tempObj = useMemo(() => new THREE.Object3D(), []);

  useEffect(() => {
    if (buildingRef.current) {
      WORLD.buildings.forEach((b, i) => {
        tempObj.position.set(b.x, b.h / 2, b.z);
        tempObj.scale.set(b.w, b.h, b.d);
        tempObj.updateMatrix();
        buildingRef.current!.setMatrixAt(i, tempObj.matrix);
      });
      buildingRef.current.instanceMatrix.needsUpdate = true;
    }
  }, []);

  useEffect(() => {
    if (trunkRef.current && foliageRef.current) {
      WORLD.trees.forEach((t, i) => {
        tempObj.position.set(t.x, 1, t.z);
        tempObj.scale.set(1, 1, 1);
        tempObj.updateMatrix();
        trunkRef.current!.setMatrixAt(i, tempObj.matrix);

        tempObj.position.set(t.x, 3.5, t.z);
        tempObj.updateMatrix();
        foliageRef.current!.setMatrixAt(i, tempObj.matrix);
      });
      trunkRef.current.instanceMatrix.needsUpdate = true;
      foliageRef.current.instanceMatrix.needsUpdate = true;
    }
  }, []);

  const { spacing, width, grid } = ROAD_CONFIG;
  const roadLen = grid * spacing * 2;

  const roads = useMemo(() => {
    const arr: { pos: [number, number, number]; size: [number, number]; rot: number }[] = [];
    for (let i = -grid; i <= grid; i++) {
      arr.push({ pos: [0, 0.01, i * spacing], size: [roadLen, width], rot: 0 });
      arr.push({ pos: [i * spacing, 0.01, 0], size: [width, roadLen], rot: 0 });
    }
    return arr;
  }, []);

  return (
    <>
      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
        <planeGeometry args={[2000, 2000]} />
        <meshStandardMaterial color={cfg.ground} />
      </mesh>

      {/* Roads */}
      {roads.map((r, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={r.pos}>
          <planeGeometry args={r.size} />
          <meshStandardMaterial color={cfg.road} />
        </mesh>
      ))}

      {/* Road center lines */}
      {roads.map((r, i) => (
        <mesh key={`cl${i}`} rotation={[-Math.PI / 2, 0, 0]}
          position={[r.pos[0], 0.02, r.pos[2]]}>
          <planeGeometry args={[r.size[0] === roadLen ? roadLen : 0.15, r.size[0] === roadLen ? 0.15 : roadLen]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.3} />
        </mesh>
      ))}

      {/* Buildings */}
      {WORLD.buildings.length > 0 && (
        <instancedMesh ref={buildingRef} args={[undefined, undefined, WORLD.buildings.length]} castShadow frustumCulled={false}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={cfg.building} roughness={0.8} />
        </instancedMesh>
      )}

      {/* Trees */}
      {WORLD.trees.length > 0 && (
        <>
          <instancedMesh ref={trunkRef} args={[undefined, undefined, WORLD.trees.length]} frustumCulled={false}>
            <cylinderGeometry args={[0.2, 0.3, 2, 6]} />
            <meshStandardMaterial color={cfg.trunk} />
          </instancedMesh>
          <instancedMesh ref={foliageRef} args={[undefined, undefined, WORLD.trees.length]} frustumCulled={false}>
            <coneGeometry args={[1.5, 3, 6]} />
            <meshStandardMaterial color={cfg.tree} />
          </instancedMesh>
        </>
      )}
    </>
  );
}
