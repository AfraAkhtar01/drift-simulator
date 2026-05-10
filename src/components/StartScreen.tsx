import { useState, useEffect } from 'react';
import { useGameStore, resetCar } from '@/game/store';
import type { GameTheme, CarType } from '@/game/store';
import { playUIClick } from '@/game/audio';
import heroCar from '@/assets/hero-car.jpg';

const CAR_COLORS = [
  { label: 'Racing Red', hex: '#e53935' },
  { label: 'Electric Blue', hex: '#1E88E5' },
  { label: 'Sunburst Yellow', hex: '#FDD835' },
  { label: 'Rally Green', hex: '#43A047' },
  { label: 'Pearl White', hex: '#EEEEEE' },
  { label: 'Stealth Black', hex: '#212121' },
  { label: 'Sunset Orange', hex: '#FB8C00' },
  { label: 'Midnight Purple', hex: '#8E24AA' },
];

const CAR_TYPES: { id: CarType; label: string; icon: string; desc: string }[] = [
  { id: 'sport', label: 'Sport', icon: '🏎️', desc: 'Balanced performance' },
  { id: 'muscle', label: 'Muscle', icon: '💪', desc: 'Raw power, loose grip' },
  { id: 'jdm', label: 'JDM', icon: '🔰', desc: 'Best drift control' },
  { id: 'supercar', label: 'Supercar', icon: '⚡', desc: 'Top speed beast' },
];

const THEMES: { id: GameTheme; label: string; emoji: string; gradient: string }[] = [
  { id: 'city', label: 'City', emoji: '🏙️', gradient: 'from-slate-600 to-slate-800' },
  { id: 'desert', label: 'Desert', emoji: '🏜️', gradient: 'from-amber-600 to-orange-800' },
  { id: 'snow', label: 'Snow', emoji: '❄️', gradient: 'from-blue-200 to-blue-400' },
  { id: 'mountain', label: 'Mountain', emoji: '⛰️', gradient: 'from-green-600 to-green-800' },
  { id: 'tokyo', label: 'Tokyo', emoji: '🗼', gradient: 'from-purple-600 to-indigo-800' },
  { id: 'coastal', label: 'Coastal', emoji: '🌊', gradient: 'from-cyan-500 to-blue-600' },
  { id: 'forest', label: 'Forest', emoji: '🌲', gradient: 'from-emerald-700 to-green-900' },
  { id: 'industrial', label: 'Industrial', emoji: '🏭', gradient: 'from-gray-500 to-gray-700' },
];

type Tab = 'settings' | 'customize' | 'leaderboard';

/** Small label under each score — server rows use `created_at` instead of stored theme names. */
function secondaryLabel(score: { created_at?: string }) {
  if (!score.created_at) return '—';
  try {
    return new Date(score.created_at).toLocaleDateString();
  } catch {
    return '—';
  }
}

export default function StartScreen() {
  const { theme, weather, timeOfDay, carColor, carType, topScores, leaderboardLoading, leaderboardError, soundEnabled,
    setTheme, setWeather, setTimeOfDay, setCarColor, setCarType, setSoundEnabled, setScreen,
    refreshLeaderboard } = useGameStore();
  const [tab, setTab] = useState<Tab>('settings');

  useEffect(() => {
    refreshLeaderboard();
  }, [refreshLeaderboard]);

  const handleStart = () => {
    playUIClick();
    resetCar();
    setScreen('playing');
  };

  const click = (fn: () => void) => () => { playUIClick(); fn(); };

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <img src={heroCar} alt="Car" className="absolute inset-0 w-full h-full object-cover" width={1920} height={1080} />
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, hsl(220 20% 7% / 0.6), hsl(220 20% 7% / 0.92))' }} />

      <div className="relative z-10 flex flex-col items-center justify-center h-full px-4 gap-4 overflow-y-auto py-6">
        {/* Title */}
        <div className="text-center animate-slide-up">
          <h1 className="font-display text-3xl md:text-5xl font-black text-foreground text-glow tracking-wider leading-tight">
            AI-POWERED 3D<br />CAR DRIFT SIMULATOR
          </h1>
          <p className="font-body text-muted-foreground mt-1 text-sm">Master the art of drifting • AI Coach Active</p>
        </div>

        {/* Tab Nav */}
        <div className="flex gap-1 glass rounded-xl p-1 animate-slide-up" style={{ animationDelay: '0.05s' }}>
          {([['settings', '⚙️ Setup'], ['customize', '🔧 Modify'], ['leaderboard', '🏆 Scores']] as [Tab, string][]).map(([t, l]) => (
            <button key={t} onClick={click(() => setTab(t))}
              className={`px-4 py-2 rounded-lg text-sm font-body transition-all ${
                tab === t ? 'glass-blue text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}>{l}</button>
          ))}
        </div>

        {/* Panel */}
        <div className="glass rounded-2xl p-5 w-full max-w-lg animate-slide-up" style={{ animationDelay: '0.1s' }}>
          {tab === 'settings' && (
            <>
              {/* Theme */}
              <div className="mb-4">
                <label className="text-xs font-body text-muted-foreground uppercase tracking-wider">Environment</label>
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {THEMES.map(t => (
                    <button key={t.id} onClick={click(() => setTheme(t.id))}
                      className={`rounded-xl py-2 px-1 text-center text-xs font-body transition-all overflow-hidden relative ${
                        theme === t.id ? 'ring-2 ring-primary scale-105' : 'opacity-70 hover:opacity-100'
                      }`}>
                      <div className={`absolute inset-0 bg-gradient-to-br ${t.gradient} opacity-40`} />
                      <div className="relative">
                        <div className="text-lg">{t.emoji}</div>
                        <div className="text-foreground mt-0.5">{t.label}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggles */}
              <div className="flex gap-3 mb-4">
                <button onClick={click(() => setWeather(weather === 'dry' ? 'rain' : 'dry'))}
                  className={`flex-1 rounded-xl py-2 text-sm font-body transition-all ${
                    weather === 'rain' ? 'glass-blue ring-1 ring-primary' : 'glass'
                  }`}>
                  <span className="text-foreground">{weather === 'dry' ? '☀️ Dry' : '🌧️ Rain'}</span>
                </button>
                <button onClick={click(() => setTimeOfDay(timeOfDay === 'day' ? 'night' : 'day'))}
                  className={`flex-1 rounded-xl py-2 text-sm font-body transition-all ${
                    timeOfDay === 'night' ? 'glass-blue ring-1 ring-primary' : 'glass'
                  }`}>
                  <span className="text-foreground">{timeOfDay === 'day' ? '🌞 Day' : '🌙 Night'}</span>
                </button>
                <button onClick={click(() => setSoundEnabled(!soundEnabled))}
                  className={`flex-1 rounded-xl py-2 text-sm font-body transition-all ${
                    soundEnabled ? 'glass-blue ring-1 ring-primary' : 'glass'
                  }`}>
                  <span className="text-foreground">{soundEnabled ? '🔊 Sound' : '🔇 Mute'}</span>
                </button>
              </div>
            </>
          )}

          {tab === 'customize' && (
            <>
              {/* Car Type */}
              <div className="mb-4">
                <label className="text-xs font-body text-muted-foreground uppercase tracking-wider">Car Type</label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {CAR_TYPES.map(c => (
                    <button key={c.id} onClick={click(() => setCarType(c.id))}
                      className={`rounded-xl p-3 text-left font-body transition-all ${
                        carType === c.id ? 'glass-blue ring-2 ring-primary' : 'glass opacity-70 hover:opacity-100'
                      }`}>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{c.icon}</span>
                        <div>
                          <div className="text-foreground text-sm font-bold">{c.label}</div>
                          <div className="text-muted-foreground text-[10px]">{c.desc}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Car Color with mini car icons */}
              <div>
                <label className="text-xs font-body text-muted-foreground uppercase tracking-wider">Paint Color</label>
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {CAR_COLORS.map(c => (
                    <button key={c.hex} onClick={click(() => setCarColor(c.hex))}
                      className={`rounded-xl p-2 text-center transition-all font-body ${
                        carColor === c.hex ? 'ring-2 ring-primary scale-105' : 'glass opacity-70 hover:opacity-100'
                      }`}>
                      <div className="mx-auto w-10 h-6 rounded-md mb-1 shadow-lg relative overflow-hidden"
                        style={{ backgroundColor: c.hex }}>
                        {/* Mini car silhouette */}
                        <div className="absolute inset-0 flex items-center justify-center text-[10px] opacity-60">🚗</div>
                      </div>
                      <div className="text-[9px] text-muted-foreground">{c.label}</div>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {tab === 'leaderboard' && (
            <div>
              <h3 className="font-display text-sm text-foreground mb-3">🏆 Top 10 All-Time Scores</h3>
              {leaderboardLoading ? (
                <p className="text-muted-foreground text-sm font-body text-center py-4">Loading scores from server…</p>
              ) : leaderboardError ? (
                <div className="text-center py-4 space-y-2">
                  <p className="text-muted-foreground text-sm font-body">{leaderboardError}</p>
                  <button type="button" onClick={() => refreshLeaderboard()}
                    className="text-accent text-xs font-body underline underline-offset-2 hover:opacity-90">
                    Try again
                  </button>
                </div>
              ) : topScores.length === 0 ? (
                <p className="text-muted-foreground text-sm font-body text-center py-4">No scores yet. Start racing!</p>
              ) : (
                <div className="space-y-1">
                  {topScores.map((s, i) => (
                    <div key={s._id ?? `${s.name}-${i}-${s.score}`} className={`flex items-center justify-between py-2 px-3 rounded-lg font-body text-sm ${
                      i < 3 ? 'glass-blue' : 'glass'
                    }`}>
                      <div className="flex items-center gap-2">
                        <span className="text-base">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}</span>
                        <span className="text-foreground">{s.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-accent font-bold">{s.score.toLocaleString()}</span>
                        <span className="text-muted-foreground text-[10px] ml-2">{secondaryLabel(s)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Start Button */}
        <button onClick={handleStart}
          className="w-full max-w-lg py-3 rounded-xl font-display font-bold text-lg tracking-wider transition-all hover:scale-[1.02] active:scale-[0.98] animate-slide-up"
          style={{
            animationDelay: '0.2s',
            background: 'linear-gradient(135deg, hsl(217 91% 60%), hsl(217 91% 45%))',
            color: 'white',
            boxShadow: '0 0 30px hsl(217 91% 60% / 0.4)',
          }}>
          🏁 START RACING
        </button>
      </div>
    </div>
  );
}
