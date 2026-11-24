import React from 'react';
import { ThemeMode } from '../types';

interface BrandLogoProps {
  variant?: 'horizontal' | 'symbol' | 'badge';
  theme?: ThemeMode;
  className?: string;
  alt?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  variant = 'horizontal',
  theme = 'light',
  className = 'h-8 w-auto',
  alt = 'Preço Justo',
}) => {
  const src =
    variant === 'symbol'
      ? '/brand/simbolo-preco-justo.svg'
      : variant === 'badge'
      ? '/brand/favicon.svg'
      : theme === 'dark'
      ? '/brand/logo-preco-justo-escuro.svg'
      : '/brand/logo-preco-justo.svg';

  return (
    <img
      src={src}
      alt={alt}
      draggable={false}
      className={`shrink-0 select-none object-contain ${className}`}
    />
  );
};
