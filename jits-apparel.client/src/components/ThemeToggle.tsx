import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../../context/useTheme';
import { Button } from './ui/button';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const themes = [
    { value: 'light' as const, icon: Sun, label: 'Light' },
    { value: 'dark' as const, icon: Moon, label: 'Dark' },
    { value: 'system' as const, icon: Monitor, label: 'System' },
  ];

  return (
    <div className="flex items-center gap-1 p-1 rounded-full" style={{ backgroundColor: '#262626' }}>
      {themes.map(({ value, icon: Icon, label }) => (
        <Button
          type='button'
          key={value}
          onClick={() => setTheme(value)}
          size="icon"  // <-- Add this
          className={`size-8 rounded-full transition-all bg-transparent ${  // optional: make them slightly smaller/tighter
            theme === value
              ? 'shadow-md'
              : 'text-muted-foreground hover:text-foreground'
          }`}
          style={theme === value ? {
            background: 'linear-gradient(90deg, #ec4899 0%, #f97316 100%)',
            color: 'white'
          } : {}}
          title={label}
          aria-label={`Switch to ${label} theme`}
        >
          <Icon className="w-4 h-4" />
        </Button>
      ))}
    </div>
  );
}