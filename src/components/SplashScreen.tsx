import { useEffect, useState } from 'react';
import heroCar from '@/assets/hero-car.jpg';

interface Props { onDone: () => void; }

export default function SplashScreen({ onDone }: Props) {
  const [opacity, setOpacity] = useState(0);

  useEffect(() => {
    requestAnimationFrame(() => setOpacity(1));
    const fadeTimer = setTimeout(() => setOpacity(0), 4000);
    const doneTimer = setTimeout(onDone, 5000);
    return () => { clearTimeout(fadeTimer); clearTimeout(doneTimer); };
  }, [onDone]);

  return (
    <div className="w-full h-screen relative overflow-hidden bg-background flex items-center justify-center"
      style={{ transition: 'opacity 1s ease', opacity }}>
      <img src={heroCar} alt="Car" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, hsl(220 20% 7% / 0.3), hsl(220 20% 7% / 0.7))' }} />
      <div className="relative z-10 text-center">
        <h1 className="font-display text-4xl md:text-6xl font-black text-foreground text-glow tracking-widest animate-slide-up">
          DRIFT SIMULATOR
        </h1>
        <p className="font-body text-muted-foreground mt-3 text-lg animate-fade-in" style={{ animationDelay: '0.5s' }}>
          Loading experience...
        </p>
        <div className="mt-6 mx-auto w-48 h-1 rounded-full overflow-hidden" style={{ background: 'hsl(220 20% 18%)' }}>
          <div className="h-full rounded-full" style={{
            background: 'hsl(217 91% 60%)',
            animation: 'loading-bar 4s ease-out forwards',
          }} />
        </div>
      </div>
    </div>
  );
}
