import { useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore, carState, inputKeys } from '@/game/store';
import { updatePhysics } from '@/game/physics';
import { WORLD } from '@/game/worldData';
import { getTheme } from '@/game/themes';
import { startEngine, updateEngineSound, stopEngine, startDriftSound, updateDriftSound, stopDriftSound, playCollisionSound } from '@/game/audio';
import { updateAICoach, getAITip, resetAICoach } from '@/game/aiCoach';
import Car3D from './Car3D';
import WorldRenderer from './WorldRenderer';
import DriftEffects from './DriftEffects';

function GameController() {
  const camPos = useRef(new THREE.Vector3(0, 10, -15));
  const soundEnabled = useGameStore(s => s.soundEnabled);
  const addAiTip = useGameStore(s => s.addAiTip);
  const tipTimer = useRef(0);
  const wasDrifting = useRef(false);
  const engineStarted = useRef(false);

  useEffect(() => {
    resetAICoach();
    const down = (e: KeyboardEvent) => {
      inputKeys[e.key] = true;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
      // Start engine on first input
      if (soundEnabled && !engineStarted.current) {
        startEngine();
        engineStarted.current = true;
      }
    };
    const up = (e: KeyboardEvent) => { inputKeys[e.key] = false; };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      stopEngine();
      stopDriftSound();
      engineStarted.current = false;
    };
  }, [soundEnabled]);

  useFrame(({ camera }, delta) => {
    updatePhysics(delta, WORLD.buildings);
    updateAICoach(delta);

    // Audio
    if (soundEnabled) {
      updateEngineSound(carState.speed);

      const drifting = carState.isDrifting && carState.driftAngle > 0.15 && carState.speed > 5;
      if (drifting && !wasDrifting.current) startDriftSound();
      if (!drifting && wasDrifting.current) stopDriftSound();
      if (drifting) updateDriftSound(carState.driftAngle);
      wasDrifting.current = drifting;

      if (carState.collided) playCollisionSound();
    }

    // AI tips every 15s
    tipTimer.current += delta;
    if (tipTimer.current > 15) {
      tipTimer.current = 0;
      addAiTip(getAITip());
    }

    // Camera follow
    const dist = 14;
    const height = 8;
    const tx = carState.px - Math.sin(carState.heading) * dist;
    const tz = carState.pz - Math.cos(carState.heading) * dist;

    camPos.current.x += (tx - camPos.current.x) * 0.04;
    camPos.current.y += (height - camPos.current.y) * 0.04;
    camPos.current.z += (tz - camPos.current.z) * 0.04;

    camera.position.copy(camPos.current);
    camera.lookAt(carState.px, 1, carState.pz);

    if (carState.isDrifting && carState.speed > 5) {
      const s = carState.driftAngle * 0.12;
      camera.position.x += (Math.random() - 0.5) * s;
      camera.position.y += (Math.random() - 0.5) * s * 0.4;
    }
  });

  return null;
}

function SceneLighting() {
  const theme = useGameStore(s => s.theme);
  const timeOfDay = useGameStore(s => s.timeOfDay);
  const cfg = getTheme(theme, timeOfDay);

  return (
    <>
      <ambientLight intensity={cfg.ambient} />
      <directionalLight position={[50, 80, 30]} intensity={cfg.sunIntensity} castShadow />
      <fog attach="fog" args={[cfg.fog, 60, 350]} />
      <color attach="background" args={[cfg.sky]} />
    </>
  );
}

export default function GameCanvas() {
  return (
    <div className="absolute inset-0">
      {/* dpr={[1,2]} caps retina resolution load (shadows + 3D) to reduce VRAM spikes that cause context loss */}
      <Canvas
        camera={{ position: [0, 10, -15], fov: 60 }}
        shadows
        dpr={[1, 2]}
        onCreated={({ gl }) => {
          gl.domElement.addEventListener('webglcontextlost', (e) => {
            // Without preventDefault, recovery is impossible; you may still need a refresh after restore.
            e.preventDefault();
            console.warn(
              '[WebGL] Context lost. Common causes: tab in background, GPU driver reset, or VRAM limits. Try closing other GPU-heavy tabs or reloading the page.'
            );
          });
        }}
      >
        <GameController />
        <SceneLighting />
        <WorldRenderer />
        <Car3D />
        <DriftEffects />
      </Canvas>
    </div>
  );
}
