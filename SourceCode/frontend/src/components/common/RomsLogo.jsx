import React, { useState } from 'react';
import logoSvg from '../../assets/roms-logo.svg';
import { useRestaurantProfile } from '../../utils/restaurantConfig';

export default function RomsLogo({ size = 36, showText = false, textSubtitle = null, customLogo = null, style = {} }) {
  const profile = useRestaurantProfile();
  const [imageError, setImageError] = useState(false);

  // Ưu tiên Logo tùy chỉnh của quán nếu có cấu hình
  const activeLogoUrl = !imageError && (customLogo || profile?.logoUrl);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', ...style }}>
      {activeLogoUrl ? (
        <img
          src={activeLogoUrl}
          alt={profile?.brandName || 'Restaurant Logo'}
          onError={() => setImageError(true)}
          style={{
            width: `${size}px`,
            height: `${size}px`,
            objectFit: 'cover',
            borderRadius: '8px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
          }}
        />
      ) : (
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
      )}

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
            {profile?.brandName || 'ROMS'}
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
