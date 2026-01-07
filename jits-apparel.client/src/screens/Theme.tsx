import { useTheme } from '../../context/useTheme';
import { ThemeToggle } from '../components/ThemeToggle';
import { ShoppingCart, Heart, Star } from 'lucide-react';

export default function ThemeScreen() {
  const { resolvedTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background py-16 px-4">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 style={{ fontFamily: 'Yesteryear, cursive', fontSize: '3rem' }}>
            Theme Showcase
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Experience the Jits brand in both light and dark modes. Switch between themes 
            to see how our vibrant gradient colors adapt to different environments.
          </p>
          <div className="flex justify-center pt-4">
            <ThemeToggle />
          </div>
          <p className="text-sm text-muted-foreground pt-2">
            Current theme: <span className="font-semibold">{resolvedTheme}</span>
          </p>
        </div>

        {/* Color Palette */}
        <section className="space-y-6">
          <div>
            <h2 className="mb-4">Brand Colors</h2>
            <p className="text-muted-foreground mb-6">
              Our signature gradient flows through pink, orange, yellow, and cyan
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-3">
              <div className="h-32 rounded-xl shadow-lg" style={{ backgroundColor: 'var(--jits-pink)' }} />
              <div className="text-center">
                <p className="font-semibold">Pink</p>
                <p className="text-sm text-muted-foreground">#ec4899</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="h-32 rounded-xl shadow-lg" style={{ backgroundColor: 'var(--jits-orange)' }} />
              <div className="text-center">
                <p className="font-semibold">Orange</p>
                <p className="text-sm text-muted-foreground">#f97316</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="h-32 rounded-xl shadow-lg" style={{ backgroundColor: 'var(--jits-yellow)' }} />
              <div className="text-center">
                <p className="font-semibold">Yellow</p>
                <p className="text-sm text-muted-foreground">#eab308</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="h-32 rounded-xl shadow-lg" style={{ backgroundColor: 'var(--jits-cyan)' }} />
              <div className="text-center">
                <p className="font-semibold">Cyan</p>
                <p className="text-sm text-muted-foreground">#06b6d4</p>
              </div>
            </div>
          </div>
        </section>

        {/* Gradient Examples */}
        <section className="space-y-6">
          <div>
            <h2 className="mb-4">Gradient Variations</h2>
            <p className="text-muted-foreground mb-6">
              Our brand gradient in different combinations
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div 
              className="h-48 rounded-xl shadow-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(90deg, var(--jits-pink) 0%, var(--jits-orange) 100%)' }}
            >
              <p className="text-white text-xl">Pink to Orange</p>
            </div>
            <div 
              className="h-48 rounded-xl shadow-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(90deg, var(--jits-orange) 0%, var(--jits-yellow) 100%)' }}
            >
              <p className="text-white text-xl">Orange to Yellow</p>
            </div>
            <div 
              className="h-48 rounded-xl shadow-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(90deg, var(--jits-yellow) 0%, var(--jits-cyan) 100%)' }}
            >
              <p className="text-white text-xl">Yellow to Cyan</p>
            </div>
            <div 
              className="h-48 rounded-xl shadow-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, var(--jits-pink) 0%, var(--jits-orange) 33%, var(--jits-yellow) 66%, var(--jits-cyan) 100%)' }}
            >
              <p className="text-white text-xl">Full Spectrum</p>
            </div>
          </div>
        </section>

        {/* UI Components */}
        <section className="space-y-6">
          <div>
            <h2 className="mb-4">UI Components</h2>
            <p className="text-muted-foreground mb-6">
              How our components look in the current theme
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* Buttons */}
            <div className="space-y-4 p-6 bg-card rounded-xl border shadow-sm">
              <h3>Buttons</h3>
              <div className="space-y-3">
                <button
                  type='button' 
                  className="w-full px-6 py-3 rounded-lg text-white transition-all hover:opacity-90"
                  style={{ background: 'linear-gradient(90deg, var(--jits-pink) 0%, var(--jits-orange) 100%)' }}
                >
                  Primary Button
                </button>
                <button className="w-full px-6 py-3 rounded-lg border border-border bg-card hover:bg-muted transition-colors">
                  Secondary Button
                </button>
                <button className="w-full px-6 py-3 rounded-lg text-muted-foreground hover:text-foreground transition-colors">
                  Text Button
                </button>
              </div>
            </div>

            {/* Cards */}
            <div className="space-y-4">
              <h3>Cards</h3>
              <div className="p-6 bg-card rounded-xl border shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h4>Product Card</h4>
                  <Heart className="w-5 h-5 text-muted-foreground hover:text-(--jits-pink)] cursor-pointer transition-colors" />
                </div>
                <div className="h-32 bg-muted rounded-lg flex items-center justify-center">
                  <p className="text-muted-foreground">Image Placeholder</p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Starting at</p>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-(--jits-yellow)] text-(--jits-yellow)]" />
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span>R 299.00</span>
                  <button
                    type="button"
                    title='add_to_cart'
                    className="p-2 rounded-lg hover:bg-muted transition-colors"
                  >
                    <ShoppingCart className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Typography */}
        <section className="space-y-6">
          <div>
            <h2 className="mb-4">Typography</h2>
            <p className="text-muted-foreground mb-6">
              Text styles and hierarchy
            </p>
          </div>
          <div className="space-y-4 p-6 bg-card rounded-xl border shadow-sm">
            <h1>Heading 1 - The quick brown fox</h1>
            <h2>Heading 2 - The quick brown fox</h2>
            <h3>Heading 3 - The quick brown fox</h3>
            <h4>Heading 4 - The quick brown fox</h4>
            <p>Paragraph - The quick brown fox jumps over the lazy dog. This is regular body text that demonstrates how paragraphs look in the current theme.</p>
            <p className="text-muted-foreground">
              Muted text - This is muted text used for secondary information and descriptions.
            </p>
            <p className="text-sm">Small text - This is smaller text used for captions and labels.</p>
          </div>
        </section>

        {/* Inputs */}
        <section className="space-y-6">
          <div>
            <h2 className="mb-4">Form Elements</h2>
            <p className="text-muted-foreground mb-6">
              Inputs and interactive elements
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4 p-6 bg-card rounded-xl border shadow-sm">
              <div className="space-y-2">
                <label>Text Input</label>
                <input
                  type="text"
                  placeholder="Enter your email"
                  className="w-full px-4 py-2 rounded-lg bg-input-background border border-border focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="space-y-2">
                <label>Select Dropdown</label>
                <select
                  title='select'
                  className="w-full px-4 py-2 rounded-lg bg-input-background border border-border focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option>Option 1</option>
                  <option>Option 2</option>
                  <option>Option 3</option>
                </select>
              </div>
            </div>
            <div className="space-y-4 p-6 bg-card rounded-xl border shadow-sm">
              <div className="space-y-2">
                <label>Textarea</label>
                <textarea
                  placeholder="Enter your message"
                  rows={4}
                  className="w-full px-4 py-2 rounded-lg bg-input-background border border-border focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="checkbox" className="rounded" />
                <label htmlFor="checkbox" className="text-sm">I agree to the terms and conditions</label>
              </div>
            </div>
          </div>
        </section>

        {/* Background Variations */}
        <section className="space-y-6">
          <div>
            <h2 className="mb-4">Background Variations</h2>
            <p className="text-muted-foreground mb-6">
              Different background treatments
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-8 bg-card rounded-xl border shadow-sm text-center">
              <h4 className="mb-2">Card Background</h4>
              <p className="text-sm text-muted-foreground">Default card styling</p>
            </div>
            <div className="p-8 bg-muted rounded-xl text-center">
              <h4 className="mb-2">Muted Background</h4>
              <p className="text-sm text-muted-foreground">Subtle sections</p>
            </div>
            <div 
              className="p-8 rounded-xl text-center"
              style={{ background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.1) 0%, rgba(6, 182, 212, 0.1) 100%)' }}
            >
              <h4 className="mb-2">Gradient Overlay</h4>
              <p className="text-sm text-muted-foreground">Subtle brand accent</p>
            </div>
          </div>
        </section>

        {/* Info Box */}
        <section className="p-8 rounded-xl border-2 border-dashed border-border space-y-4 text-center">
          <h3>Theme System Features</h3>
          <ul className="space-y-2 text-muted-foreground max-w-2xl mx-auto text-left">
            <li>✅ Automatic system theme detection</li>
            <li>✅ Manual theme override (Light/Dark/System)</li>
            <li>✅ localStorage persistence across sessions</li>
            <li>✅ Smooth transitions between themes</li>
            <li>✅ Consistent brand colors in both modes</li>
            <li>✅ Accessible color contrast ratios</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
