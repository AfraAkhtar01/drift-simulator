import { carState, inputKeys, useGameStore } from './store';
import type { BuildingData } from './worldData';

function normalizeAngle(a: number): number {
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
}

export function updatePhysics(dt: number, buildings: BuildingData[]) {
  dt = Math.min(dt, 0.05);

  const weather = useGameStore.getState().weather;
  const gripFactor = weather === 'rain' ? 0.6 : 1.0;

  const fwdX = Math.sin(carState.heading);
  const fwdZ = Math.cos(carState.heading);

  // Engine
  if (inputKeys.ArrowUp || inputKeys.w) {
    carState.vx += fwdX * 25 * dt;
    carState.vz += fwdZ * 25 * dt;
  }
  if (inputKeys.ArrowDown || inputKeys.s) {
    carState.vx -= fwdX * 35 * dt;
    carState.vz -= fwdZ * 35 * dt;
  }

  carState.speed = Math.sqrt(carState.vx * carState.vx + carState.vz * carState.vz);

  // Steering
  const steerRate = 2.5 * Math.min(1, carState.speed / 15);
  carState.wheelAngle = 0;
  if (inputKeys.ArrowLeft || inputKeys.a) carState.wheelAngle = 1;
  if (inputKeys.ArrowRight || inputKeys.d) carState.wheelAngle = -1;
  carState.heading += carState.wheelAngle * steerRate * dt;

  // Drift
  carState.isDrifting = !!(inputKeys[' '] && carState.speed > 5);
  if (carState.isDrifting) {
    carState.heading += carState.wheelAngle * 1.8 * dt;
  }

  // Lateral friction
  const rightX = Math.cos(carState.heading);
  const rightZ = -Math.sin(carState.heading);
  const forwardSpeed = carState.vx * fwdX + carState.vz * fwdZ;
  const lateralSpeed = carState.vx * rightX + carState.vz * rightZ;
  const lateralDamping = carState.isDrifting ? 1.5 : 8.0;
  const dampedLateral = lateralSpeed * Math.exp(-lateralDamping * gripFactor * dt);

  const newFwdX = Math.sin(carState.heading);
  const newFwdZ = Math.cos(carState.heading);
  const newRightX = Math.cos(carState.heading);
  const newRightZ = -Math.sin(carState.heading);

  carState.vx = newFwdX * forwardSpeed + newRightX * dampedLateral;
  carState.vz = newFwdZ * forwardSpeed + newRightZ * dampedLateral;

  // Drag
  carState.vx *= Math.exp(-0.4 * dt);
  carState.vz *= Math.exp(-0.4 * dt);

  // Rolling friction
  carState.speed = Math.sqrt(carState.vx * carState.vx + carState.vz * carState.vz);
  if (carState.speed > 0.1) {
    const factor = Math.max(0, 1 - 2.0 * dt / carState.speed);
    carState.vx *= factor;
    carState.vz *= factor;
  } else if (!(inputKeys.ArrowUp || inputKeys.w)) {
    carState.vx = 0;
    carState.vz = 0;
  }

  // Move
  const newPx = carState.px + carState.vx * dt;
  const newPz = carState.pz + carState.vz * dt;

  // Collision
  let collided = false;
  const r = 2;
  for (const b of buildings) {
    const cx = Math.max(b.x - b.w / 2, Math.min(newPx, b.x + b.w / 2));
    const cz = Math.max(b.z - b.d / 2, Math.min(newPz, b.z + b.d / 2));
    const dx = newPx - cx, dz = newPz - cz;
    if (dx * dx + dz * dz < r * r) {
      collided = true;
      carState.collided = true;
      carState.vx *= -0.3;
      carState.vz *= -0.3;
      carState.currentDrift = 0;
      carState.comboMultiplier = 1;
      break;
    }
  }
  if (!collided) {
    carState.px = newPx;
    carState.pz = newPz;
  }

  carState.speed = Math.sqrt(carState.vx * carState.vx + carState.vz * carState.vz);

  // Drift angle
  if (carState.speed > 1) {
    const velAngle = Math.atan2(carState.vx, carState.vz);
    carState.driftAngle = Math.abs(normalizeAngle(carState.heading - velAngle));
  } else {
    carState.driftAngle = 0;
  }

  // Scoring
  if (carState.isDrifting && carState.driftAngle > 0.15 && carState.speed > 5) {
    carState.currentDrift += carState.driftAngle * carState.speed * carState.comboMultiplier * dt * 10;
    carState.comboMultiplier = Math.min(carState.comboMultiplier + 0.3 * dt, 5);
  } else if (carState.currentDrift > 0) {
    carState.driftScore += Math.floor(carState.currentDrift);
    carState.currentDrift = 0;
    carState.comboMultiplier = 1;
  }
}
