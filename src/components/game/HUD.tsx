import { useState, useEffect, useCallback } from 'react';
import { carState, inputKeys, useGameStore, resetCar } from '@/game/store';
import { playUIClick } from '@/game/audio';

export default function HUD() {
  const [speed, setSpeed] = useState(0);
  const [driftScore, setDriftScore] = useState(0);
  const [currentDrift, setCurrentDrift] = useState(0);
  const [combo, setCombo] = useState(1);
  const [isDrifting, setIsDrifting] = useState(false);
  const [showSave, setShowSave] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const aiTips = useGameStore(s => s.aiTips);
  const addScore = useGameStore(s => s.addScore);
  const setScreen = useGameStore(s => s.setScreen);

  useEffect(() => {
    const id = setInterval(() => {
      setSpeed(Math.round(carState.speed * 3.6));
      setDriftScore(carState.driftScore);
      setCurrentDrift(Math.floor(carState.currentDrift));
      setCombo(Math.round(carState.comboMultiplier * 10) / 10);
      setIsDrifting(carState.isDrifting && carState.driftAngle > 0.15);
    }, 80);
    return () => clearInterval(id);
  }, []);

  const setKey = useCallback((key: string, val: boolean) => { inputKeys[key] = val; }, []);

  const handleExit = () => {
    playUIClick();
    if (driftScore > 0) { setShowSave(true); } else { setScreen('start'); resetCar(); }
  };

  const handleSaveScore = async () => {
    const name = playerName.trim() || 'Anonymous';
    await addScore(name, driftScore);
    setShowSave(false);
    setScreen('start');
    resetCar();
  };

  const maxSpeed = 300;
  const pct = Math.min(speed / maxSpeed, 1);

  return (
    <div className="fixed inset-0 pointer-events-none z-10">
      {/* Speedometer */}
      <div className="absolute bottom-6 left-6 glass rounded-2xl p-4 w-40">
        <div className="relative h-3 rounded-full overflow-hidden mb-2" style={{ background: 'hsl(220 20% 18%)' }}>
          <div className="h-full rounded-full transition-all" style={{
            width: `${pct * 100}%`,
            background: pct > 0.8 ? 'hsl(0 84% 60%)' : pct > 0.5 ? 'hsl(25 95% 53%)' : 'hsl(217 91% 60%)',
          }} />
        </div>
        <div className="text-center">
          <span className="text-3xl font-display font-bold text-foreground">{speed}</span>
          <span className="text-xs text-muted-foreground ml-1">km/h</span>
        </div>
      </div>

      {/* Drift Score */}
      <div className="absolute bottom-6 right-6 glass rounded-2xl p-4 min-w-[160px] text-right">
        <div className="text-xs text-muted-foreground font-body uppercase tracking-wider">Drift Score</div>
        <div className="text-3xl font-display font-bold text-foreground">{driftScore.toLocaleString()}</div>
        {isDrifting && (
          <div className="mt-2 animate-slide-up">
            <div className="text-accent font-display text-lg font-bold text-glow-orange">+{currentDrift}</div>
            <div className="text-xs font-body" style={{ color: 'hsl(217 91% 60%)' }}>x{combo} COMBO</div>
          </div>
        )}
      </div>

      {/* Controls + Exit */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-2 items-center">
        <div className="glass rounded-xl px-4 py-2">
          <div className="flex gap-4 text-xs text-muted-foreground font-body">
            <span>↑ Accelerate</span><span>↓ Brake</span><span>← → Steer</span>
            <span className="text-accent">SPACE Drift</span>
          </div>
        </div>
        <button onClick={handleExit}
          className="glass rounded-xl px-3 py-2 text-xs font-body text-foreground pointer-events-auto hover:bg-destructive/20 transition-all">
          ✕ Exit
        </button>
      </div>

      {/* AI Coach Tips */}
      {aiTips.length > 0 && (
        <div className="absolute top-14 right-4 w-64">
          <div className="glass rounded-xl px-3 py-2 text-xs font-body text-foreground animate-slide-up">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">🤖 AI Coach</div>
            {aiTips[0]}
          </div>
        </div>
      )}

      {/* Save Score Modal */}
      {showSave && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-auto" style={{ background: 'hsl(220 20% 7% / 0.8)' }}>
          <div className="glass rounded-2xl p-6 w-80 text-center animate-slide-up">
            <h2 className="font-display text-xl text-foreground mb-2">🏁 Race Complete!</h2>
            <p className="text-2xl font-display font-bold text-accent mb-4">{driftScore.toLocaleString()} pts</p>
            <input
              value={playerName} onChange={e => setPlayerName(e.target.value)}
              placeholder="Enter your name"
              className="w-full rounded-lg px-3 py-2 mb-3 font-body text-sm bg-secondary text-foreground border border-border focus:outline-none focus:ring-2 focus:ring-primary"
              maxLength={20} autoFocus
            />
            <div className="flex gap-2">
              <button onClick={handleSaveScore}
                className="flex-1 py-2 rounded-lg font-display text-sm font-bold text-primary-foreground transition-all"
                style={{ background: 'hsl(217 91% 60%)' }}>
                Save Score
              </button>
              <button onClick={() => { setShowSave(false); setScreen('start'); resetCar(); }}
                className="flex-1 py-2 rounded-lg font-body text-sm glass text-foreground">
                Skip
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile controls */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 pointer-events-auto md:hidden">
        {[
          { key: 'ArrowUp', label: '▲' },
          { key: 'ArrowLeft', label: '◀' },
          { key: 'ArrowDown', label: '▼' },
          { key: 'ArrowRight', label: '▶' },
        ].map(({ key, label }) => (
          <button key={key}
            className="w-12 h-12 glass-blue rounded-xl text-foreground font-bold text-lg active:opacity-70 select-none"
            onTouchStart={() => setKey(key, true)} onTouchEnd={() => setKey(key, false)}
            onMouseDown={() => setKey(key, true)} onMouseUp={() => setKey(key, false)}
          >{label}</button>
        ))}
        <button
          className="w-20 h-12 glass-blue rounded-xl text-accent font-display text-sm font-bold active:opacity-70 select-none ml-2"
          onTouchStart={() => setKey(' ', true)} onTouchEnd={() => setKey(' ', false)}
          onMouseDown={() => setKey(' ', true)} onMouseUp={() => setKey(' ', false)}
        >DRIFT</button>
      </div>
    </div>
  );
}
