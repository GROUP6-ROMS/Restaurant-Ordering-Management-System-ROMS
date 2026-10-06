import React from 'react';
import logoSvg from '../../assets/roms-logo.svg';

export default function RomsLogo({ size = 36, showText = false, textSubtitle = null, style = {} }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', ...style }}>
      <img
        src={logoSvg}
        alt="ROMS Logo"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          objectFit: 'contain',
          filter: 'drop-shadow(0 2px 6px rgba(189, 89, 58, 0.25))'
        }}
      />
      {showText && (
        <div>
          <div style={{
            fontFamily: "'Epilogue', sans-serif",
            fontWeight: 800,
            fontSize: `${size * 0.42}px`,
            color: '#9D4124',
            letterSpacing: '-0.02em',
            lineHeight: 1
          }}>
            ROMS
          </div>
          {textSubtitle && (
            <div style={{
              fontSize: `${Math.max(10, size * 0.22)}px`,
              color: '#89726B',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              fontWeight: 700,
              marginTop: '2px'
            }}>
              {textSubtitle}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
