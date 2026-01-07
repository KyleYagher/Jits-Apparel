import { useEffect, useState } from 'react';
import { JitsLogo } from './JitsLogo';

export function SplashScreen() {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (!show) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background transition-opacity duration-500"
      style={{
        opacity: show ? 1 : 0,
        pointerEvents: show ? 'auto' : 'none'
      }}
    >
      <div className="text-center space-y-8 animate-pulse">
        <JitsLogo scale={0.5} />
        <div className="flex items-center justify-center gap-2">
          <div 
            className="w-3 h-3 rounded-full animate-bounce"
            style={{ 
              background: 'var(--jits-pink)',
              animationDelay: '0ms'
            }}
          />
          <div 
            className="w-3 h-3 rounded-full animate-bounce"
            style={{ 
              background: 'var(--jits-orange)',
              animationDelay: '150ms'
            }}
          />
          <div 
            className="w-3 h-3 rounded-full animate-bounce"
            style={{ 
              background: 'var(--jits-yellow)',
              animationDelay: '300ms'
            }}
          />
          <div 
            className="w-3 h-3 rounded-full animate-bounce"
            style={{ 
              background: 'var(--jits-cyan)',
              animationDelay: '450ms'
            }}
          />
        </div>
      </div>
    </div>
  );
}
