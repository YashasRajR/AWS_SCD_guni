interface MascotProps {
  variant?: 'default' | 'wave' | 'sm' | 'sad' | 'lockup';
  size?: number | string;
  className?: string;
}

export function Mascot({ variant = 'default', size, className = '' }: MascotProps) {
  const pixelSize = typeof size === 'number' ? `${size}px` : size;

  if (variant === 'lockup') {
    return (
      <div className={`mascot-lockup ${className}`} style={pixelSize ? { height: pixelSize } : undefined}>
        <svg viewBox="0 0 160 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="mascot-lockup-svg">
          {/* AWS SBG × GUNI Lockup */}
          <rect x="2" y="4" width="28" height="28" rx="4" fill="#232F3E" stroke="#FF9900" strokeWidth="1.5" />
          <path d="M9 22L16 11L23 22" stroke="#FF9900" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M12 18H20" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
          
          <text x="36" y="16" fill="#14181F" fontFamily="Inter, sans-serif" fontWeight="800" fontSize="11" letterSpacing="0.05em">
            AWS SBG
          </text>
          <text x="88" y="16" fill="#FF9900" fontFamily="Inter, sans-serif" fontWeight="700" fontSize="11">
            ×
          </text>
          <text x="100" y="16" fill="#14181F" fontFamily="Inter, sans-serif" fontWeight="800" fontSize="11" letterSpacing="0.05em">
            GUNI
          </text>
          <text x="36" y="27" fill="#656D79" fontFamily="JetBrains Mono, monospace" fontWeight="600" fontSize="7.5" letterSpacing="0.12em">
            STUDENTS COMMUNITY DAY
          </text>
        </svg>
      </div>
    );
  }

  const defaultDimensions =
    variant === 'sm'
      ? { width: 44, height: 44 }
      : variant === 'wave'
      ? { width: 72, height: 72 }
      : { width: 90, height: 90 };

  const w = size || defaultDimensions.width;
  const h = size || defaultDimensions.height;

  return (
    <div
      className={`mascot-container mascot-${variant} ${className}`}
      style={{ width: w, height: h, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 100 100" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Background glow / aura */}
        <circle cx="50" cy="50" r="46" fill="#EEF1F5" stroke="#232F3E" strokeWidth="1.5" strokeDasharray="3 3" />

        {/* Mascot Body / Cloud builder head */}
        <rect x="25" y="28" width="50" height="44" rx="10" fill="#232F3E" stroke="#14181F" strokeWidth="2" />
        
        {/* Antenna / Cloud Sensor */}
        <line x1="50" y1="28" x2="50" y2="18" stroke="#FF9900" strokeWidth="3" strokeLinecap="round" />
        <circle cx="50" cy="16" r="4" fill="#FF9900" />

        {/* Visor / Face screen */}
        <rect x="31" y="36" width="38" height="22" rx="5" fill="#16191F" stroke="#FF9900" strokeWidth="1.2" />

        {/* Face Elements depending on variant */}
        {variant === 'sad' ? (
          <>
            {/* Sad / Puzzled Eyes */}
            <circle cx="41" cy="46" r="3" fill="#FF9900" />
            <circle cx="59" cy="46" r="3" fill="#FF9900" />
            {/* Question mark / droop mouth */}
            <path d="M44 53C47 50 53 50 56 53" stroke="#FF9900" strokeWidth="1.5" strokeLinecap="round" />
          </>
        ) : (
          <>
            {/* Friendly Bright Eyes */}
            <circle cx="41" cy="46" r="3.5" fill="#FF9900" />
            <circle cx="59" cy="46" r="3.5" fill="#FF9900" />
            <circle cx="42" cy="44.5" r="1.2" fill="#FFFFFF" />
            <circle cx="60" cy="44.5" r="1.2" fill="#FFFFFF" />
            {/* Happy Builder Smile (AWS curved smile arrow) */}
            <path d="M43 51C47 54.5 53 54.5 57 51" stroke="#FF9900" strokeWidth="2" strokeLinecap="round" />
          </>
        )}

        {/* Chest Builder Badge */}
        <rect x="42" y="74" width="16" height="4" rx="2" fill="#FF9900" />
        
        {/* Arm - Waving or Standing */}
        {variant === 'wave' ? (
          <path
            d="M75 48C84 42 88 32 86 26C81 27 77 34 75 40"
            fill="#FF9900"
            stroke="#232F3E"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        ) : (
          <>
            <rect x="18" y="44" width="7" height="16" rx="3.5" fill="#FF9900" />
            <rect x="75" y="44" width="7" height="16" rx="3.5" fill="#FF9900" />
          </>
        )}

        {/* Feet */}
        <rect x="34" y="72" width="10" height="6" rx="3" fill="#232F3E" />
        <rect x="56" y="72" width="10" height="6" rx="3" fill="#232F3E" />
      </svg>
    </div>
  );
}
