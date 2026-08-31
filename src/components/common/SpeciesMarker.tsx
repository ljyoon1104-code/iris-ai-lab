import React from 'react';
import { getSpeciesConfig, type SpeciesShape } from '../../constants/species';

interface SpeciesMarkerProps {
  species?: string | null;
  shape?: SpeciesShape;
  cx?: number;
  cy?: number;
  size?: number; // Visual radius / half-width, default 5.5
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
  className?: string;
  style?: React.CSSProperties;
  onClick?: (e: React.MouseEvent) => void;
  onMouseEnter?: (e: React.MouseEvent) => void;
  onMouseLeave?: (e: React.MouseEvent) => void;
}

export const SpeciesMarker: React.FC<SpeciesMarkerProps> = ({
  species,
  shape: explicitShape,
  cx = 0,
  cy = 0,
  size = 5.5,
  fill,
  stroke = '#ffffff',
  strokeWidth = 1.5,
  opacity = 1,
  className = '',
  style,
  onClick,
  onMouseEnter,
  onMouseLeave,
}) => {
  const conf = getSpeciesConfig(species);
  const targetShape = explicitShape || conf.shape;
  const targetFill = fill || conf.hexColor;

  if (targetShape === 'circle') {
    return (
      <circle
        cx={cx}
        cy={cy}
        r={size}
        fill={targetFill}
        stroke={stroke}
        strokeWidth={strokeWidth}
        opacity={opacity}
        className={className}
        style={style}
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      />
    );
  }

  if (targetShape === 'triangle') {
    // Equilateral triangle centered at (cx, cy)
    const topY = cy - size * 1.15;
    const botY = cy + size * 0.85;
    const leftX = cx - size * 1.05;
    const rightX = cx + size * 1.05;
    const points = `${cx},${topY} ${leftX},${botY} ${rightX},${botY}`;

    return (
      <polygon
        points={points}
        fill={targetFill}
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
        opacity={opacity}
        className={className}
        style={style}
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      />
    );
  }

  // targetShape === 'square'
  const side = size * 1.8;
  const x = cx - side / 2;
  const y = cy - side / 2;

  return (
    <rect
      x={x}
      y={y}
      width={side}
      height={side}
      rx={1.5}
      fill={targetFill}
      stroke={stroke}
      strokeWidth={strokeWidth}
      opacity={opacity}
      className={className}
      style={style}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    />
  );
};

