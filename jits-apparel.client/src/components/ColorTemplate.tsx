export function ColorTemplate() {
  return (
    <div className="w-full max-w-6xl mx-auto space-y-12">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-5xl" style={{ fontFamily: 'Yesteryear, cursive' }}>
          Jits Brand Colors
        </h1>
        <p className="text-muted-foreground">
          A vibrant color palette embodying super cool, fancy, and funky vibes
        </p>
      </div>

      {/* Primary Brand Colors */}
      <section className="space-y-6">
        <h2 className="text-2xl">Primary Brand Colors</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Pink */}
          <div className="space-y-3">
            <div 
              className="h-32 rounded-lg shadow-lg"
              style={{ background: 'linear-gradient(135deg, #ec4899 0%, #f9a8d4 100%)' }}
            ></div>
            <div>
              <h3 className="mb-1">Jits Pink</h3>
              <p className="text-sm text-muted-foreground">#ec4899</p>
              <p className="text-xs text-muted-foreground mt-1">Vibrant & Bold</p>
            </div>
          </div>

          {/* Orange */}
          <div className="space-y-3">
            <div 
              className="h-32 rounded-lg shadow-lg"
              style={{ background: 'linear-gradient(135deg, #f97316 0%, #fb923c 100%)' }}
            ></div>
            <div>
              <h3 className="mb-1">Jits Orange</h3>
              <p className="text-sm text-muted-foreground">#f97316</p>
              <p className="text-xs text-muted-foreground mt-1">Energetic & Warm</p>
            </div>
          </div>

          {/* Yellow */}
          <div className="space-y-3">
            <div 
              className="h-32 rounded-lg shadow-lg"
              style={{ background: 'linear-gradient(135deg, #eab308 0%, #fde047 100%)' }}
            ></div>
            <div>
              <h3 className="mb-1">Jits Yellow</h3>
              <p className="text-sm text-muted-foreground">#eab308</p>
              <p className="text-xs text-muted-foreground mt-1">Bright & Funky</p>
            </div>
          </div>

          {/* Cyan */}
          <div className="space-y-3">
            <div 
              className="h-32 rounded-lg shadow-lg"
              style={{ background: 'linear-gradient(135deg, #06b6d4 0%, #22d3ee 100%)' }}
            ></div>
            <div>
              <h3 className="mb-1">Jits Cyan</h3>
              <p className="text-sm text-muted-foreground">#06b6d4</p>
              <p className="text-xs text-muted-foreground mt-1">Cool & Fresh</p>
            </div>
          </div>
        </div>
      </section>

      {/* Gradient Showcase */}
      <section className="space-y-6">
        <h2 className="text-2xl">Signature Gradients</h2>
        <div className="space-y-4">
          {/* Main brand gradient */}
          <div className="relative h-24 rounded-lg overflow-hidden shadow-lg">
            <div 
              className="h-full"
              style={{ 
                background: 'linear-gradient(90deg, #ec4899 0%, #f97316 33%, #eab308 66%, #06b6d4 100%)' 
              }}
            ></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-white text-lg drop-shadow-lg">Main Brand Gradient</p>
            </div>
          </div>

          {/* Alternative gradients */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative h-20 rounded-lg overflow-hidden shadow-md">
              <div 
                className="h-full"
                style={{ background: 'linear-gradient(135deg, #ec4899 0%, #06b6d4 100%)' }}
              ></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-white text-sm drop-shadow-lg">Pink to Cyan</p>
              </div>
            </div>
            <div className="relative h-20 rounded-lg overflow-hidden shadow-md">
              <div 
                className="h-full"
                style={{ background: 'linear-gradient(135deg, #f97316 0%, #eab308 100%)' }}
              ></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-white text-sm drop-shadow-lg">Orange to Yellow</p>
              </div>
            </div>
            <div className="relative h-20 rounded-lg overflow-hidden shadow-md">
              <div 
                className="h-full"
                style={{ background: 'linear-gradient(135deg, #ec4899 0%, #f97316 50%, #06b6d4 100%)' }}
              ></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-white text-sm drop-shadow-lg">Tri-Color</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Color Variations */}
      <section className="space-y-6">
        <h2 className="text-2xl">Color Variations</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Light variations */}
          <div className="space-y-3">
            <h3 className="text-lg">Light Tones</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-lg shadow" style={{ backgroundColor: '#f9a8d4' }}></div>
                <div>
                  <p className="text-sm">Pink Light</p>
                  <p className="text-xs text-muted-foreground">#f9a8d4</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-lg shadow" style={{ backgroundColor: '#fb923c' }}></div>
                <div>
                  <p className="text-sm">Orange Light</p>
                  <p className="text-xs text-muted-foreground">#fb923c</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-lg shadow" style={{ backgroundColor: '#fde047' }}></div>
                <div>
                  <p className="text-sm">Yellow Light</p>
                  <p className="text-xs text-muted-foreground">#fde047</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-lg shadow" style={{ backgroundColor: '#22d3ee' }}></div>
                <div>
                  <p className="text-sm">Cyan Light</p>
                  <p className="text-xs text-muted-foreground">#22d3ee</p>
                </div>
              </div>
            </div>
          </div>

          {/* Dark variations */}
          <div className="space-y-3">
            <h3 className="text-lg">Dark Tones</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-lg shadow" style={{ backgroundColor: '#be185d' }}></div>
                <div>
                  <p className="text-sm">Pink Dark</p>
                  <p className="text-xs text-muted-foreground">#be185d</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-lg shadow" style={{ backgroundColor: '#c2410c' }}></div>
                <div>
                  <p className="text-sm">Orange Dark</p>
                  <p className="text-xs text-muted-foreground">#c2410c</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-lg shadow" style={{ backgroundColor: '#a16207' }}></div>
                <div>
                  <p className="text-sm">Yellow Dark</p>
                  <p className="text-xs text-muted-foreground">#a16207</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-lg shadow" style={{ backgroundColor: '#0e7490' }}></div>
                <div>
                  <p className="text-sm">Cyan Dark</p>
                  <p className="text-xs text-muted-foreground">#0e7490</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Usage Examples */}
      <section className="space-y-6">
        <h2 className="text-2xl">Usage Examples</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Button examples */}
          <div className="space-y-3">
            <h3>Buttons</h3>
            <div className="space-y-2">
              <button
                type="button" 
                className="w-full px-6 py-3 rounded-lg text-white transition-transform hover:scale-105"
                style={{ backgroundColor: '#ec4899' }}
              >
                Primary Action
              </button>
              <button
                type="button" 
                className="w-full px-6 py-3 rounded-lg text-white transition-transform hover:scale-105"
                style={{ backgroundColor: '#f97316' }}
              >
                Secondary Action
              </button>
              <button 
                type="button"
                className="w-full px-6 py-3 rounded-lg text-white transition-transform hover:scale-105"
                style={{ backgroundColor: '#06b6d4' }}
              >
                Accent Action
              </button>
            </div>
          </div>

          {/* Card example */}
          <div className="space-y-3">
            <h3>Cards</h3>
            <div 
              className="p-6 rounded-lg shadow-lg text-white"
              style={{ 
                background: 'linear-gradient(135deg, #ec4899 0%, #f97316 100%)' 
              }}
            >
              <h4 className="mb-2">Featured Product</h4>
              <p className="text-sm opacity-90">
                Cool, funky designs that stand out
              </p>
            </div>
          </div>

          {/* Badge examples */}
          <div className="space-y-3">
            <h3>Badges & Tags</h3>
            <div className="flex flex-wrap gap-2">
              <span 
                className="px-3 py-1 rounded-full text-white text-sm"
                style={{ backgroundColor: '#ec4899' }}
              >
                New
              </span>
              <span 
                className="px-3 py-1 rounded-full text-white text-sm"
                style={{ backgroundColor: '#f97316' }}
              >
                Hot
              </span>
              <span 
                className="px-3 py-1 rounded-full text-white text-sm"
                style={{ backgroundColor: '#eab308' }}
              >
                Sale
              </span>
              <span 
                className="px-3 py-1 rounded-full text-white text-sm"
                style={{ backgroundColor: '#06b6d4' }}
              >
                Limited
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
