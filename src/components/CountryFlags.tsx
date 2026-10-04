import React from 'react';

interface FlagProps {
  className?: string;
  width?: number | string;
  height?: number | string;
}

// 1. United States Flag (13 stripes + Canton with stars)
export const USFlag: React.FC<FlagProps> = ({ className = '', width = '100%', height = '100%' }) => (
  <svg viewBox="0 0 640 400" width={width} height={height} className={className}>
    <rect width="640" height="400" fill="#B22234" />
    {/* 6 White Stripes */}
    <rect y="30.77" width="640" height="30.77" fill="#FFFFFF" />
    <rect y="92.31" width="640" height="30.77" fill="#FFFFFF" />
    <rect y="153.85" width="640" height="30.77" fill="#FFFFFF" />
    <rect y="215.38" width="640" height="30.77" fill="#FFFFFF" />
    <rect y="276.92" width="640" height="30.77" fill="#FFFFFF" />
    <rect y="338.46" width="640" height="30.77" fill="#FFFFFF" />
    {/* Blue Canton */}
    <rect width="256" height="215.38" fill="#3C3B6E" />
    {/* Star Grid Pattern */}
    <g fill="#FFFFFF">
      {[1, 2, 3, 4, 5].map((row) =>
        [1, 2, 3, 4, 5, 6].map((col) => (
          <circle
            key={`s1-${row}-${col}`}
            cx={col * 36.5 - 18}
            cy={row * 35.8 - 18}
            r="4.5"
          />
        ))
      )}
      {[1, 2, 3, 4].map((row) =>
        [1, 2, 3, 4, 5].map((col) => (
          <circle
            key={`s2-${row}-${col}`}
            cx={col * 36.5}
            cy={row * 35.8}
            r="4"
            opacity="0.9"
          />
        ))
      )}
    </g>
  </svg>
);

// 2. Canadian Flag (Red-White-Red + Maple Leaf)
export const CanadaFlag: React.FC<FlagProps> = ({ className = '', width = '100%', height = '100%' }) => (
  <svg viewBox="0 0 640 400" width={width} height={height} className={className}>
    <rect width="640" height="400" fill="#D80027" />
    <rect x="160" width="320" height="400" fill="#FFFFFF" />
    {/* Stylized Maple Leaf */}
    <path
      d="M320 70l15 45 42-18-12 40 42 12-32 30 18 42-45-12-18 45-10-8v66h-20v-66l-10 8-18-45-45 12 18-42-32-30 42-12-12-40 42 18z"
      fill="#D80027"
    />
  </svg>
);

// 3. Swiss Flag (Red + White Greek Cross)
export const SwissFlag: React.FC<FlagProps> = ({ className = '', width = '100%', height = '100%' }) => (
  <svg viewBox="0 0 640 400" width={width} height={height} className={className}>
    <rect width="640" height="400" fill="#D52B1E" />
    <rect x="270" y="80" width="100" height="240" fill="#FFFFFF" rx="4" />
    <rect x="190" y="150" width="260" height="100" fill="#FFFFFF" rx="4" />
  </svg>
);

// 4. European Union Flag (Deep Blue + 12 Gold Stars)
export const EUFlag: React.FC<FlagProps> = ({ className = '', width = '100%', height = '100%' }) => (
  <svg viewBox="0 0 640 400" width={width} height={height} className={className}>
    <rect width="640" height="400" fill="#003399" />
    <g fill="#FFCC00" transform="translate(320, 200)">
      {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle, i) => {
        const rad = (angle * Math.PI) / 180;
        const x = Math.cos(rad) * 115;
        const y = Math.sin(rad) * 115;
        return (
          <polygon
            key={i}
            points="0,-16 4.7,-4.9 16.5,-4.9 6.9,2.1 10.6,13.2 0,6.2 -10.6,13.2 -6.9,2.1 -16.5,-4.9 -4.7,-4.9"
            transform={`translate(${x}, ${y}) scale(0.9)`}
          />
        );
      })}
    </g>
  </svg>
);

// 5. Japanese Flag (White + Crimson Sun Disc)
export const JapanFlag: React.FC<FlagProps> = ({ className = '', width = '100%', height = '100%' }) => (
  <svg viewBox="0 0 640 400" width={width} height={height} className={className}>
    <rect width="640" height="400" fill="#FFFFFF" />
    <circle cx="320" cy="200" r="115" fill="#BC002D" />
  </svg>
);

// 6. British Union Jack Flag
export const UKFlag: React.FC<FlagProps> = ({ className = '', width = '100%', height = '100%' }) => (
  <svg viewBox="0 0 640 400" width={width} height={height} className={className}>
    <clipPath id="uk-clip">
      <rect width="640" height="400" />
    </clipPath>
    <g clipPath="url(#uk-clip)">
      <rect width="640" height="400" fill="#012169" />
      {/* White Diagonals */}
      <path d="M0 0L640 400M640 0L0 400" stroke="#FFFFFF" strokeWidth="80" />
      {/* Red Diagonals */}
      <path d="M0 0L640 400M640 0L0 400" stroke="#C8102E" strokeWidth="48" />
      {/* White St George's Cross */}
      <path d="M320 0v400M0 200h640" stroke="#FFFFFF" strokeWidth="120" />
      {/* Red St George's Cross */}
      <path d="M320 0v400M0 200h640" stroke="#C8102E" strokeWidth="72" />
    </g>
  </svg>
);

// 7. Australian Flag (Union Jack + Commonwealth Star + Southern Cross)
export const AustraliaFlag: React.FC<FlagProps> = ({ className = '', width = '100%', height = '100%' }) => (
  <svg viewBox="0 0 640 400" width={width} height={height} className={className}>
    <rect width="640" height="400" fill="#00008B" />
    {/* Union Jack in Canton */}
    <g transform="scale(0.5)">
      <rect width="640" height="400" fill="#012169" />
      <path d="M0 0L640 400M640 0L0 400" stroke="#FFFFFF" strokeWidth="80" />
      <path d="M0 0L640 400M640 0L0 400" stroke="#C8102E" strokeWidth="48" />
      <path d="M320 0v400M0 200h640" stroke="#FFFFFF" strokeWidth="120" />
      <path d="M320 0v400M0 200h640" stroke="#C8102E" strokeWidth="72" />
    </g>
    {/* Large 7-Point Commonwealth Star */}
    <circle cx="160" cy="300" r="32" fill="#FFFFFF" />
    {/* Southern Cross on Right */}
    <circle cx="480" cy="80" r="14" fill="#FFFFFF" />
    <circle cx="560" cy="180" r="14" fill="#FFFFFF" />
    <circle cx="480" cy="320" r="14" fill="#FFFFFF" />
    <circle cx="410" cy="200" r="14" fill="#FFFFFF" />
    <circle cx="520" cy="240" r="10" fill="#FFFFFF" />
  </svg>
);

// 8. New Zealand Flag (Union Jack + 4 Red Stars with White Borders)
export const NZFlag: React.FC<FlagProps> = ({ className = '', width = '100%', height = '100%' }) => (
  <svg viewBox="0 0 640 400" width={width} height={height} className={className}>
    <rect width="640" height="400" fill="#00247D" />
    <g transform="scale(0.5)">
      <rect width="640" height="400" fill="#012169" />
      <path d="M0 0L640 400M640 0L0 400" stroke="#FFFFFF" strokeWidth="80" />
      <path d="M0 0L640 400M640 0L0 400" stroke="#C8102E" strokeWidth="48" />
      <path d="M320 0v400M0 200h640" stroke="#FFFFFF" strokeWidth="120" />
      <path d="M320 0v400M0 200h640" stroke="#C8102E" strokeWidth="72" />
    </g>
    {/* 4 Red Stars with White Borders */}
    <g fill="#CC142B" stroke="#FFFFFF" strokeWidth="4">
      <circle cx="490" cy="90" r="16" />
      <circle cx="565" cy="180" r="16" />
      <circle cx="490" cy="310" r="18" />
      <circle cx="420" cy="210" r="14" />
    </g>
  </svg>
);

// 9. Indian Flag (Tricolor + Ashoka Chakra)
export const IndiaFlag: React.FC<FlagProps> = ({ className = '', width = '100%', height = '100%' }) => (
  <svg viewBox="0 0 640 400" width={width} height={height} className={className}>
    <rect width="640" height="133.33" fill="#FF9933" />
    <rect y="133.33" width="640" height="133.33" fill="#FFFFFF" />
    <rect y="266.66" width="640" height="133.33" fill="#138808" />
    {/* Ashoka Chakra */}
    <circle cx="320" cy="200" r="48" fill="none" stroke="#000080" strokeWidth="6" />
    <circle cx="320" cy="200" r="10" fill="#000080" />
    <g stroke="#000080" strokeWidth="3">
      {[...Array(12)].map((_, i) => (
        <line
          key={i}
          x1="320"
          y1="152"
          x2="320"
          y2="248"
          transform={`rotate(${i * 15} 320 200)`}
        />
      ))}
    </g>
  </svg>
);

// 10. German Flag (Black-Red-Gold)
export const GermanyFlag: React.FC<FlagProps> = ({ className = '', width = '100%', height = '100%' }) => (
  <svg viewBox="0 0 640 400" width={width} height={height} className={className}>
    <rect width="640" height="133.33" fill="#000000" />
    <rect y="133.33" width="640" height="133.33" fill="#DD0000" />
    <rect y="266.66" width="640" height="133.33" fill="#FFCC00" />
  </svg>
);

// 11. French Flag (Blue-White-Red)
export const FranceFlag: React.FC<FlagProps> = ({ className = '', width = '100%', height = '100%' }) => (
  <svg viewBox="0 0 640 400" width={width} height={height} className={className}>
    <rect width="213.33" height="400" fill="#002654" />
    <rect x="213.33" width="213.33" height="400" fill="#FFFFFF" />
    <rect x="426.66" width="213.33" height="400" fill="#ED2939" />
  </svg>
);

// 12. Hong Kong Flag (Red + White Bauhinia Flower)
export const HKFlag: React.FC<FlagProps> = ({ className = '', width = '100%', height = '100%' }) => (
  <svg viewBox="0 0 640 400" width={width} height={height} className={className}>
    <rect width="640" height="400" fill="#DE2910" />
    {/* Stylized 5-Petal Bauhinia */}
    <g fill="#FFFFFF" transform="translate(320, 200)">
      {[0, 72, 144, 216, 288].map((angle, i) => (
        <path
          key={i}
          d="M0 0 C20 -40, 50 -70, 70 -50 C80 -30, 40 10, 0 0"
          transform={`rotate(${angle}) scale(1.4)`}
        />
      ))}
      <circle cx="0" cy="0" r="12" fill="#DE2910" />
    </g>
  </svg>
);

// 13. Mexican Flag (Green-White-Red + Crest)
export const MexicoFlag: React.FC<FlagProps> = ({ className = '', width = '100%', height = '100%' }) => (
  <svg viewBox="0 0 640 400" width={width} height={height} className={className}>
    <rect width="213.33" height="400" fill="#006847" />
    <rect x="213.33" width="213.33" height="400" fill="#FFFFFF" />
    <rect x="426.66" width="213.33" height="400" fill="#CE1126" />
    {/* Mexican Eagle Emblem */}
    <circle cx="320" cy="200" r="32" fill="#8E6338" opacity="0.9" />
    <path d="M305 190c10-15 20-15 30 0l-15 25z" fill="#006847" />
  </svg>
);

// 14. Norwegian Flag (Red + White-Edged Blue Cross)
export const NorwayFlag: React.FC<FlagProps> = ({ className = '', width = '100%', height = '100%' }) => (
  <svg viewBox="0 0 640 400" width={width} height={height} className={className}>
    <rect width="640" height="400" fill="#BA0C2F" />
    {/* White Cross */}
    <rect x="180" width="100" height="400" fill="#FFFFFF" />
    <rect y="150" width="640" height="100" fill="#FFFFFF" />
    {/* Blue Cross */}
    <rect x="205" width="50" height="400" fill="#00205B" />
    <rect y="175" width="640" height="50" fill="#00205B" />
  </svg>
);

// 15. Singapore Flag (Red/White + Crescent & 5 Stars)
export const SingaporeFlag: React.FC<FlagProps> = ({ className = '', width = '100%', height = '100%' }) => (
  <svg viewBox="0 0 640 400" width={width} height={height} className={className}>
    <rect width="640" height="200" fill="#EF3340" />
    <rect y="200" width="640" height="200" fill="#FFFFFF" />
    {/* Crescent Moon */}
    <path
      d="M130 50 A 60 60 0 0 0 130 150 A 50 50 0 0 1 130 50"
      fill="#FFFFFF"
    />
    {/* 5 Stars */}
    <g fill="#FFFFFF">
      <circle cx="155" cy="70" r="7" />
      <circle cx="175" cy="85" r="7" />
      <circle cx="170" cy="115" r="7" />
      <circle cx="145" cy="120" r="7" />
      <circle cx="135" cy="95" r="7" />
    </g>
  </svg>
);

// 16. Brazilian Flag (Green + Yellow Diamond + Blue Globe)
export const BrazilFlag: React.FC<FlagProps> = ({ className = '', width = '100%', height = '100%' }) => (
  <svg viewBox="0 0 640 400" width={width} height={height} className={className}>
    <rect width="640" height="400" fill="#009B3A" />
    <polygon points="320,40 600,200 320,360 40,200" fill="#FEDF01" />
    <circle cx="320" cy="200" r="75" fill="#002776" />
    <path d="M250 200 Q 320 180 390 205" stroke="#FFFFFF" strokeWidth="12" fill="none" />
  </svg>
);

// 17. Thai Flag (Red-White-Blue-White-Red)
export const ThaiFlag: React.FC<FlagProps> = ({ className = '', width = '100%', height = '100%' }) => (
  <svg viewBox="0 0 640 400" width={width} height={height} className={className}>
    <rect width="640" height="66.66" fill="#A51931" />
    <rect y="66.66" width="640" height="66.66" fill="#F4F5F8" />
    <rect y="133.33" width="640" height="133.33" fill="#2D2A4A" />
    <rect y="266.66" width="640" height="66.66" fill="#F4F5F8" />
    <rect y="333.33" width="640" height="66.66" fill="#A51931" />
  </svg>
);

// Flag code mapping for high-definition FlagCDN images
const FLAG_IMAGE_CODES: Record<string, string> = {
  USD: 'us', US: 'us',
  EUR: 'eu', EU: 'eu',
  GBP: 'gb', UK: 'gb', GB: 'gb',
  JPY: 'jp', JP: 'jp',
  CAD: 'ca', CA: 'ca',
  CHF: 'ch', CH: 'ch',
  AUD: 'au', AU: 'au',
  NZD: 'nz', NZ: 'nz',
  INR: 'in', IN: 'in',
  BRL: 'br', BR: 'br',
  MXN: 'mx', MX: 'mx',
  THB: 'th', TH: 'th',
  NOK: 'no', NO: 'no',
  SGD: 'sg', SG: 'sg',
  CNY: 'cn', CN: 'cn',
  HKD: 'hk', HK: 'hk', HSI: 'hk',
  ZAR: 'za', ZA: 'za',
  TRY: 'tr', TR: 'tr',
  SEK: 'se', SE: 'se',
  DE: 'de', GER: 'de', DAX: 'de',
  FR: 'fr', CAC: 'fr',
  ES: 'es',
};

// Component that renders high-definition real flag image with instant SVG fallback
export const RealCountryFlag: React.FC<{ code: string; className?: string; fallback: React.ReactNode }> = React.memo(({ code, className = '', fallback }) => {
  const [failed, setFailed] = React.useState(false);
  const countryCode = FLAG_IMAGE_CODES[code.toUpperCase().trim()];

  if (!countryCode || failed) {
    return <>{fallback}</>;
  }

  return (
    <img
      src={`https://flagcdn.com/w160/${countryCode}.png`}
      alt={code}
      className={className}
      style={{ imageRendering: '-webkit-optimize-contrast' }}
      loading="eager"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  );
});

// Helper function to resolve country flag by currency or country code with real image loading
export const renderCountryFlag = (code: string, className = ''): React.ReactNode => {
  const c = code.toUpperCase().trim();
  let svgFallback: React.ReactNode = null;
  switch (c) {
    case 'USD':
    case 'US':
      svgFallback = <USFlag className={className} />;
      break;
    case 'EUR':
    case 'EU':
      svgFallback = <EUFlag className={className} />;
      break;
    case 'GBP':
    case 'GB':
    case 'UK':
      svgFallback = <UKFlag className={className} />;
      break;
    case 'JPY':
    case 'JP':
      svgFallback = <JapanFlag className={className} />;
      break;
    case 'CAD':
    case 'CA':
      svgFallback = <CanadaFlag className={className} />;
      break;
    case 'CHF':
    case 'CH':
      svgFallback = <SwissFlag className={className} />;
      break;
    case 'AUD':
    case 'AU':
      svgFallback = <AustraliaFlag className={className} />;
      break;
    case 'NZD':
    case 'NZ':
      svgFallback = <NZFlag className={className} />;
      break;
    case 'INR':
    case 'IN':
      svgFallback = <IndiaFlag className={className} />;
      break;
    case 'MXN':
    case 'MX':
      svgFallback = <MexicoFlag className={className} />;
      break;
    case 'NOK':
    case 'NO':
      svgFallback = <NorwayFlag className={className} />;
      break;
    case 'SGD':
    case 'SG':
      svgFallback = <SingaporeFlag className={className} />;
      break;
    case 'BRL':
    case 'BR':
      svgFallback = <BrazilFlag className={className} />;
      break;
    case 'THB':
    case 'TH':
      svgFallback = <ThaiFlag className={className} />;
      break;
    case 'GER':
    case 'DE':
    case 'DAX':
      svgFallback = <GermanyFlag className={className} />;
      break;
    case 'FR':
    case 'CAC':
      svgFallback = <FranceFlag className={className} />;
      break;
    case 'HK':
    case 'HKD':
    case 'HSI':
      svgFallback = <HKFlag className={className} />;
      break;
    default:
      return null;
  }

  return <RealCountryFlag code={c} className={className} fallback={svgFallback} />;
};

// ==========================================
// DUAL FLAG BADGE (As seen in Olymp Trade)
// Overlapping rounded flags: Base flag at top-left, Quote flag at bottom-right
// ==========================================
interface DualFlagBadgeProps {
  baseCurrency: string;
  quoteCurrency: string;
  size?: number;
  className?: string;
}

export const DualFlagBadge: React.FC<DualFlagBadgeProps> = React.memo(({
  baseCurrency,
  quoteCurrency,
  size = 28,
  className = '',
}) => {
  // Flag chip dimensions proportioned to badge size (Olymp Trade ratio)
  const flagW = Math.round(size * 0.68);
  const flagH = Math.round(size * 0.54);

  return (
    <div
      className={`relative shrink-0 select-none flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      {/* 1. Base Currency Flag (Top-Left) */}
      <div
        className="absolute top-0 left-0 z-10 rounded-[3px] overflow-hidden shadow-xs border border-black/25"
        style={{
          width: flagW,
          height: flagH,
        }}
      >
        {renderCountryFlag(baseCurrency, 'w-full h-full object-cover block') || (
          <div className="w-full h-full bg-slate-700 flex items-center justify-center text-[7.5px] font-bold text-white uppercase">
            {baseCurrency.slice(0, 3)}
          </div>
        )}
      </div>

      {/* 2. Quote Currency Flag (Bottom-Right, overlapping with crisp white divider ring) */}
      <div
        className="absolute bottom-0 right-0 z-20 rounded-[3px] overflow-hidden shadow-sm border border-white ring-1 ring-black/15"
        style={{
          width: flagW,
          height: flagH,
        }}
      >
        {renderCountryFlag(quoteCurrency, 'w-full h-full object-cover block') || (
          <div className="w-full h-full bg-slate-800 flex items-center justify-center text-[7.5px] font-bold text-white uppercase">
            {quoteCurrency.slice(0, 3)}
          </div>
        )}
      </div>
    </div>
  );
});
