import { create } from 'zustand';
import { fetchLeaderboardFromServer, submitScoreToServer, type LeaderboardRow } from './leaderboardApi';

export type GameTheme = 'city' | 'desert' | 'snow' | 'mountain' | 'tokyo' | 'coastal' | 'forest' | 'industrial';
export type Weather = 'dry' | 'rain';
export type TimeOfDay = 'day' | 'night';
export type CarType = 'sport' | 'muscle' | 'jdm' | 'supercar';

export interface CarConfig {
  type: CarType;
  color: string;
  label: string;
}

const CAR_TYPES: Record<CarType, { label: string; speedMul: number; gripMul: number; driftMul: number }> = {
  sport:    { label: 'Sport',    speedMul: 1.0,  gripMul: 1.0,  driftMul: 1.0 },
  muscle:   { label: 'Muscle',   speedMul: 1.15, gripMul: 0.85, driftMul: 1.2 },
  jdm:      { label: 'JDM',      speedMul: 0.95, gripMul: 1.1,  driftMul: 1.3 },
  supercar: { label: 'Supercar', speedMul: 1.3,  gripMul: 1.05, driftMul: 0.9 },
};

export function getCarTypeStats(type: CarType) { return CAR_TYPES[type]; }

/** Shown on the leaderboard tab; mirrors server docs (no localStorage cache). */
export type LeaderboardEntry = LeaderboardRow;

interface GameStore {
  screen: 'splash' | 'start' | 'playing';
  theme: GameTheme;
  weather: Weather;
  timeOfDay: TimeOfDay;
  carColor: string;
  carType: CarType;
  topScores: LeaderboardEntry[];
  /** True while we're waiting on the server (first paint uses this instead of flashing "empty"). */
  leaderboardLoading: boolean;
  leaderboardError: string | null;
  soundEnabled: boolean;
  lastCollision: number;
  aiTips: string[];
  setScreen: (s: 'splash' | 'start' | 'playing') => void;
  setTheme: (t: GameTheme) => void;
  setWeather: (w: Weather) => void;
  setTimeOfDay: (t: TimeOfDay) => void;
  setCarColor: (c: string) => void;
  setCarType: (t: CarType) => void;
  setSoundEnabled: (b: boolean) => void;
  /** Sends the score to Flask, then updates `topScores` from the server's reply (no local cache). */
  addScore: (name: string, score: number) => Promise<void>;
  /** Call when opening the start screen (or anytime you want latest data from Atlas). */
  refreshLeaderboard: () => Promise<void>;
  setLastCollision: (t: number) => void;
  addAiTip: (tip: string) => void;
}

/** Keep the UI headline "Top 10" truthful even though the API may send more rows. */
const TOP_SHOWN = 10;

export const useGameStore = create<GameStore>((set) => ({
  screen: 'splash',
  theme: 'city',
  weather: 'dry',
  timeOfDay: 'day',
  carColor: '#e53935',
  carType: 'sport',
  topScores: [],
  leaderboardLoading: false,
  leaderboardError: null,
  soundEnabled: true,
  lastCollision: 0,
  aiTips: [],
  setScreen: (screen) => set({ screen }),
  setTheme: (theme) => set({ theme }),
  setWeather: (weather) => set({ weather }),
  setTimeOfDay: (timeOfDay) => set({ timeOfDay }),
  setCarColor: (carColor) => set({ carColor }),
  setCarType: (carType) => set({ carType }),
  setSoundEnabled: (soundEnabled) => set({ soundEnabled }),
  refreshLeaderboard: async () => {
    set({ leaderboardLoading: true, leaderboardError: null });
    try {
      const rows = await fetchLeaderboardFromServer();
      set({ topScores: rows.slice(0, TOP_SHOWN), leaderboardLoading: false });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not load leaderboard';
      console.error(msg);
      set({ leaderboardLoading: false, leaderboardError: msg });
    }
  },
  addScore: async (name, score) => {
    try {
      const rows = await submitScoreToServer(name, score);
      set({
        topScores: rows.slice(0, TOP_SHOWN),
        leaderboardError: null,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not save score';
      console.error(msg);
      set({ leaderboardError: msg });
      // Still try GET so stale data refreshes when the POST path misbehaves.
      try {
        const rows = await fetchLeaderboardFromServer();
        set({ topScores: rows.slice(0, TOP_SHOWN) });
      } catch {
        /* leave previous topScores visible */
      }
    }
  },
  setLastCollision: (lastCollision) => set({ lastCollision }),
  addAiTip: (tip) => set((s) => ({ aiTips: [tip, ...s.aiTips].slice(0, 5) })),
}));

export const carState = {
  px: 0, pz: 0,
  heading: 0,
  vx: 0, vz: 0,
  speed: 0,
  isDrifting: false,
  driftAngle: 0,
  wheelAngle: 0,
  driftScore: 0,
  currentDrift: 0,
  comboMultiplier: 1,
  collided: false,
};

export const inputKeys: Record<string, boolean> = {};

export function resetCar() {
  carState.px = 0; carState.pz = 0;
  carState.heading = 0;
  carState.vx = 0; carState.vz = 0;
  carState.speed = 0;
  carState.isDrifting = false;
  carState.driftAngle = 0;
  carState.wheelAngle = 0;
  carState.driftScore = 0;
  carState.currentDrift = 0;
  carState.comboMultiplier = 1;
  carState.collided = false;
  Object.keys(inputKeys).forEach(k => { inputKeys[k] = false; });
}
