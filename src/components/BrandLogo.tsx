import React from 'react';
import { TRADEXORA_LOGO_DATA_URI, TRADEXORA_LOGO_FALLBACK } from '../assets/brandLogo';

interface BrandLogoProps {
  className?: string;
  size?: number | string;
  alt?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  className = 'w-full h-full object-contain',
  size,
  alt = 'TradeXora Logo'
}) => {
  const style = size ? { width: size, height: size } : undefined;

  return (
    <img
      src={TRADEXORA_LOGO_DATA_URI}
      alt={alt}
      className={className}
      style={style}
      loading="eager"
      decoding="sync"
      onError={(e) => {
        const target = e.currentTarget as HTMLImageElement;
        if (target.src !== TRADEXORA_LOGO_FALLBACK) {
          target.src = TRADEXORA_LOGO_FALLBACK;
        }
      }}
    />
  );
};
