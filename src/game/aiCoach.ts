// AI Driving Coach - analyzes driving patterns and gives tips
import { carState } from './store';

interface DrivingStats {
  avgSpeed: number;
  maxSpeed: number;
  driftTime: number;
  totalTime: number;
  collisions: number;
  longestDrift: number;
  currentDriftDuration: number;
}

const stats: DrivingStats = {
  avgSpeed: 0, maxSpeed: 0, driftTime: 0, totalTime: 0,
  collisions: 0, longestDrift: 0, currentDriftDuration: 0,
};

let speedSamples = 0;
let speedSum = 0;

export function updateAICoach(dt: number) {
  stats.totalTime += dt;
  speedSamples++;
  speedSum += carState.speed;
  stats.avgSpeed = speedSum / speedSamples;
  if (carState.speed > stats.maxSpeed) stats.maxSpeed = carState.speed;

  if (carState.isDrifting && carState.driftAngle > 0.15) {
    stats.driftTime += dt;
    stats.currentDriftDuration += dt;
    if (stats.currentDriftDuration > stats.longestDrift) {
      stats.longestDrift = stats.currentDriftDuration;
    }
  } else {
    stats.currentDriftDuration = 0;
  }

  if (carState.collided) {
    stats.collisions++;
    carState.collided = false;
  }
}

export function getAITip(): string {
  const tips: string[] = [];

  if (stats.totalTime < 5) return '🏁 Start driving to get AI coaching tips!';

  const driftRatio = stats.driftTime / stats.totalTime;

  if (stats.collisions > 3 && stats.totalTime < 30) {
    tips.push('⚠️ Too many collisions! Slow down before corners.');
  }
  if (driftRatio < 0.05 && stats.totalTime > 10) {
    tips.push('💡 Try holding SPACE while turning to initiate drifts!');
  }
  if (stats.avgSpeed < 15 && stats.totalTime > 10) {
    tips.push('🚀 Push the throttle more! Higher speed = bigger drift scores.');
  }
  if (stats.longestDrift > 3) {
    tips.push('🔥 Great drift! Try chaining drifts for combo multipliers.');
  }
  if (stats.maxSpeed > 60) {
    tips.push('⚡ Impressive top speed! Use that momentum for power slides.');
  }
  if (driftRatio > 0.3) {
    tips.push('🎯 Expert drifter! Try different angles for max points.');
  }
  if (stats.collisions === 0 && stats.totalTime > 20) {
    tips.push('✨ Clean driving! Now push the limits harder.');
  }

  return tips.length > 0 ? tips[Math.floor(Math.random() * tips.length)] : '🏎️ Keep practicing your drift technique!';
}

export function resetAICoach() {
  stats.avgSpeed = 0; stats.maxSpeed = 0; stats.driftTime = 0;
  stats.totalTime = 0; stats.collisions = 0; stats.longestDrift = 0;
  stats.currentDriftDuration = 0; speedSamples = 0; speedSum = 0;
}

export function getDrivingStats() { return { ...stats }; }
