import './JitsLogoText.css';

export function JitsLogoText({ text = 'JitS', scale = 1 }: { text?: string; scale?: number }) {
    return (
      <div
        className="jits-logo-text-wrapper"
        style={{ '--scale': scale } as React.CSSProperties} // use CSS variable instead of inline transform
      >
        <svg viewBox="0 0 600 280" className="w-full max-w-3xl" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="textGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" className="jits-logo-gradient-stop1" />
              <stop offset="33%" className="jits-logo-gradient-stop2" />
              <stop offset="66%" className="jits-logo-gradient-stop3" />
              <stop offset="100%" className="jits-logo-gradient-stop4" />
            </linearGradient>
          </defs>
  
          <g>
            <text x="300" y="180" textAnchor="middle" fill="url(#textGradient)" className="jits-logo-text">
              {text}
            </text>
          </g>
        </svg>
      </div>
    );
  }