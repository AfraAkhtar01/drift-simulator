import { useEffect, useCallback } from 'react';
import { useGameStore } from '@/game/store';
import SplashScreen from '@/components/SplashScreen';
import StartScreen from '@/components/StartScreen';
import GameCanvas from '@/components/game/GameCanvas';
import HUD from '@/components/game/HUD';

export default function Index() {
  const screen = useGameStore(s => s.screen);
  const setScreen = useGameStore(s => s.setScreen);

  useEffect(() => {
    document.title = 'AI-Powered 3D Car Drift Simulator';
  }, []);

  const onSplashDone = useCallback(() => setScreen('start'), [setScreen]);

  return (
    <div className="w-screen h-screen overflow-hidden bg-background">
      {screen === 'splash' && <SplashScreen onDone={onSplashDone} />}
      {screen === 'start' && <StartScreen />}
      {screen === 'playing' && (
        <>
          <GameCanvas />
          <HUD />
        </>
      )}
    </div>
  );
}
