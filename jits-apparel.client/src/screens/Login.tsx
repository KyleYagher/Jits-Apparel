import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { Alert, AlertDescription } from '../components/ui/alert';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import '../components/JitsLogoText.css';
import { JitsLogoText } from '../components/JitsLogoText';

const BRAND_SHADOW_COLORS = [
  'shadow-pink-500/50',
  'shadow-orange-500/50',
  'shadow-yellow-500/50',
  'shadow-cyan-500/50',
];

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Pick a random shadow color on mount (initializer function runs only once)
  const [shadowColor] = useState(() =>
    BRAND_SHADOW_COLORS[Math.floor(Math.random() * BRAND_SHADOW_COLORS.length)]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      console.log('Attempting login with:', email);
      const result = await login(email, password);
      console.log('Login result:', result);

      if (result.success) {
        // Redirect to profile page after successful login
        navigate('/profile');
      } else {
        setError(result.error || 'Login failed');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 pb-12 bg-linear-to-br from-pink-50/50 via-orange-50/30 to-cyan-50/50 dark:from-pink-950/20 dark:via-orange-950/10 dark:to-cyan-950/20">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        

        {/* Login Form */}
        <div className={`bg-card border border-gray-800 rounded-lg px-8 pb-8 shadow-[0_0_25px_-5px] ${shadowColor}`}>
            <div className="text-center mb-8 rounded">
                <div className="flex flex-row justify-center">
                    {/* <JitsLogo scale={0.38}/>  */}
                    <JitsLogoText text="Login" scale={0.999}/>
                </div>
                <p className="text-muted-foreground">
                    Sign in to access your account ...
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
                )}

                <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    disabled={isLoading}
                />
                </div>

                <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                    <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    disabled={isLoading}
                    className="pr-10"
                    />
                    <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                    >
                    {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                    ) : (
                        <Eye className="h-4 w-4" />
                    )}
                    </button>
                </div>
                </div>

                <Button
                type="submit"
                className="w-full text-white"
                style={{
                    background: 'linear-gradient(90deg, var(--jits-pink) 0%, var(--jits-orange) 50%, var(--jits-cyan) 100%)'
                }}
                disabled={isLoading}
                >
                {isLoading ? 'Signing in...' : 'Sign In'}
                </Button>
            </form>

          {/* Demo Credentials */}
          {/* <div className="mt-6 p-4 bg-muted/50 rounded-lg border border-dashed">
            <p className="text-sm mb-2">
              <strong>Demo Credentials:</strong>
            </p>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>Email: demo@jits.co.za</p>
              <p>Password: password123</p>
            </div>
          </div> */}

          {/* Don't have an account */}
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => navigate('/register')}
                className="text-foreground hover:underline font-medium"
              >
                Register
              </button>
            </p>
          </div>

          {/* Back to Home */}
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
