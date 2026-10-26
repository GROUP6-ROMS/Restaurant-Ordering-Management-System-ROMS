import React from 'react';
import RomsLogo from './RomsLogo';

/**
 * RouteLoadingFallback
 * High-performance, branded loading fallback for React.lazy routes
 * Complies with ROMS Terracotta / Warm Ivory Design System
 */
export default function RouteLoadingFallback({ message = 'Đang tải dữ liệu...' }) {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        gap: '16px',
        background: 'transparent',
      }}
    >
      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            position: 'absolute',
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            border: '2px solid rgba(157, 65, 36, 0.15)',
            borderTopColor: '#9D4124',
            animation: 'spin 0.9s linear infinite',
          }}
        />
        <RomsLogo size={36} />
      </div>

      <div style={{ textAlign: 'center' }}>
        <p
          style={{
            margin: 0,
            fontSize: '0.875rem',
            fontWeight: 600,
            color: '#56423D',
            letterSpacing: '0.01em',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}
        >
          {message}
        </p>
        <span
          style={{
            fontSize: '0.75rem',
            color: '#89726B',
            display: 'block',
            marginTop: '4px',
          }}
        >
          Vui lòng đợi trong giây lát
        </span>
      </div>
    </div>
  );
}
