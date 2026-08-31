import React from 'react';
import { getSpeciesConfig } from '../../constants/species';

interface SpeciesBadgeProps {
  species?: string | null;
  showEnglish?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  variant?: 'subtle' | 'solid' | 'outline' | 'text';
  className?: string;
}

export const SpeciesBadge: React.FC<SpeciesBadgeProps> = ({
  species,
  showEnglish = false,
  size = 'sm',
  variant = 'subtle',
  className = '',
}) => {
  const conf = getSpeciesConfig(species);

  // Size styling
  const sizeClasses = {
    xs: 'px-1.5 py-0.5 text-[10px] gap-1',
    sm: 'px-2 py-0.5 text-xs gap-1.5',
    md: 'px-2.5 py-1 text-xs gap-1.5 font-extrabold',
    lg: 'px-3 py-1.5 text-sm gap-2 font-black',
  }[size];

  // Variant styling
  let styleClasses = `${conf.bgClass} ${conf.textClass} ${conf.borderClass} border`;
  if (variant === 'solid') {
    styleClasses = 'text-white border-transparent';
  } else if (variant === 'outline') {
    styleClasses = `bg-transparent ${conf.textClass} ${conf.borderClass} border`;
  } else if (variant === 'text') {
    styleClasses = `bg-transparent border-transparent ${conf.textClass} p-0`;
  }

  const solidBgStyle = variant === 'solid' ? { backgroundColor: conf.hexColor } : {};

  return (
    <span
      style={solidBgStyle}
      className={`inline-flex items-center rounded-lg select-none whitespace-nowrap font-bold transition-all ${sizeClasses} ${styleClasses} ${className}`}
    >
      <span className="shrink-0 font-black leading-none" style={{ color: variant === 'solid' ? '#ffffff' : conf.hexColor }}>
        {conf.symbol}
      </span>
      <span className={variant === 'solid' ? 'text-white' : conf.textClass}>{conf.koreanName}</span>
      {showEnglish && (
        <span className="opacity-75 text-[10px] font-normal">
          ({conf.englishName})
        </span>
      )}
    </span>
  );
};

export const SpeciesLabel: React.FC<Omit<SpeciesBadgeProps, 'variant'>> = (props) => (
  <SpeciesBadge {...props} variant="text" size={props.size || 'sm'} />
);

