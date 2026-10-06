import React from 'react';

export default function Icon({ name, size = 20, fill = 0, style = {} }) {
  return (
    <span
      className="material-symbols-outlined"
      style={{
        fontSize: `${size}px`,
        fontVariationSettings: `'FILL' ${fill}, 'wght' 500, 'GRAD' 0, 'opsz' 24`,
        verticalAlign: 'middle',
        lineHeight: 1,
        ...style
      }}
    >
      {name}
    </span>
  );
}
