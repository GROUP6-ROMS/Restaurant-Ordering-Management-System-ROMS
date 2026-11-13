import React from 'react';

/**
 * Common Material Symbols Icon component for ROMS
 * Standardized across all pages and layouts with built-in accessibility
 */
export default function Icon({
  name,
  size = 20,
  fill = 0,
  weight = 500,
  className = '',
  style = {},
  ariaLabel,
  onClick,
  ...rest
}) {
  const isInteractive = Boolean(onClick);

  return (
    <span
      className={`material-symbols-outlined ${className}`.trim()}
      role={ariaLabel ? 'img' : isInteractive ? 'button' : undefined}
      aria-label={ariaLabel}
      aria-hidden={ariaLabel ? undefined : true}
      onClick={onClick}
      style={{
        fontSize: typeof size === 'number' ? `${size}px` : size,
        fontVariationSettings: `'FILL' ${fill}, 'wght' ${weight}, 'GRAD' 0, 'opsz' 24`,
        verticalAlign: 'middle',
        lineHeight: 1,
        userSelect: 'none',
        display: 'inline-block',
        cursor: isInteractive ? 'pointer' : undefined,
        ...style
      }}
      {...rest}
    >
      {name}
    </span>
  );
}
