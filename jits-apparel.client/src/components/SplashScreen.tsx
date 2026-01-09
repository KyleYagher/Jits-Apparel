import { useEffect, useState } from 'react';
import { JitsLogo } from './JitsLogo';

interface SplashScreenProps {
  /** Display mode: 'fullscreen' for initial app load, 'inline' for section loading, 'overlay' for modal-like loading */
  mode?: 'fullscreen' | 'inline' | 'overlay';
  /** Whether to show the splash screen */
  show?: boolean;
  /** Optional message to display below the loading indicator */
  message?: string;
  /** Auto-hide after specified milliseconds (only applies to fullscreen mode without explicit show prop) */
  autoHideMs?: number;
  /** Size variant for inline mode */
  size?: 'sm' | 'md' | 'lg';
  /** Optional minimum height for inline mode */
  minHeight?: string;
}

function LoadingDots({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const dotSizes = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };

  return (
    <div className="flex items-center justify-center gap-2">
      <div
        className={`${dotSizes[size]} rounded-full animate-bounce`}
        style={{
          background: 'var(--jits-pink)',
          animationDelay: '0ms'
        }}
      />
      <div
        className={`${dotSizes[size]} rounded-full animate-bounce`}
        style={{
          background: 'var(--jits-orange)',
          animationDelay: '150ms'
        }}
      />
      <div
        className={`${dotSizes[size]} rounded-full animate-bounce`}
        style={{
          background: 'var(--jits-yellow)',
          animationDelay: '300ms'
        }}
      />
      <div
        className={`${dotSizes[size]} rounded-full animate-bounce`}
        style={{
          background: 'var(--jits-cyan)',
          animationDelay: '450ms'
        }}
      />
    </div>
  );
}

export function SplashScreen({
  mode = 'fullscreen',
  show: showProp,
  message,
  autoHideMs = 2000,
  size = 'md',
  minHeight = '200px'
}: SplashScreenProps) {
  const [internalShow, setInternalShow] = useState(true);

  // Use prop if provided, otherwise use internal state
  const show = showProp !== undefined ? showProp : internalShow;

  useEffect(() => {
    // Only auto-hide for fullscreen mode when no explicit show prop is provided
    if (mode === 'fullscreen' && showProp === undefined) {
      const timer = setTimeout(() => {
        setInternalShow(false);
      }, autoHideMs);

      return () => clearTimeout(timer);
    }
  }, [mode, autoHideMs, showProp]);

  if (!show) return null;

  // Fullscreen mode - covers entire viewport
  if (mode === 'fullscreen') {
    return (
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-background transition-opacity duration-500"
        style={{
          opacity: show ? 1 : 0,
          pointerEvents: show ? 'auto' : 'none'
        }}
      >
        <div className="text-center space-y-8">
          <div className="animate-pulse">
            <JitsLogo scale={0.5} />
          </div>
          <LoadingDots size="md" />
          {message && (
            <p className="text-muted-foreground text-sm">{message}</p>
          )}
        </div>
      </div>
    );
  }

  // Overlay mode - semi-transparent overlay for sections
  if (mode === 'overlay') {
    return (
      <div
        className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg"
      >
        <div className="text-center space-y-4">
          <LoadingDots size={size} />
          {message && (
            <p className="text-muted-foreground text-sm">{message}</p>
          )}
        </div>
      </div>
    );
  }

  // Inline mode - for use within page sections
  return (
    <div
      className="flex flex-col items-center justify-center py-12"
      style={{ minHeight }}
    >
      <div className="text-center space-y-4">
        <LoadingDots size={size} />
        {message && (
          <p className="text-muted-foreground text-sm">{message}</p>
        )}
      </div>
    </div>
  );
}

// Export the LoadingDots component for use in smaller loading indicators
export { LoadingDots };
