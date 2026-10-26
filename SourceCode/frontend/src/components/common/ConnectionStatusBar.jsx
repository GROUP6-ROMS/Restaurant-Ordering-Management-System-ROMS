import React, { useState, useEffect } from 'react';
import Icon from './Icon';

/**
 * ConnectionStatusBar
 * Real-time network & offline detection banner
 * Enhances operational UX for Waiters, POS Cashiers, Kitchen and Diners
 */
export default function ConnectionStatusBar() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnected(true);
      const timer = setTimeout(() => setShowReconnected(false), 3500);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline && !showReconnected) {
    return null;
  }

  return (
    <div
      role="alert"
      aria-live="assertive"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 99999,
        padding: '8px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        fontSize: '0.8125rem',
        fontWeight: 600,
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
        transition: 'all 0.3s ease',
        background: isOnline ? '#2E7D32' : '#BA1A1A',
        color: '#FFFFFF',
      }}
    >
      <Icon
        name={isOnline ? 'wifi' : 'wifi_off'}
        size={18}
        style={{ color: '#FFFFFF' }}
      />
      <span>
        {isOnline
          ? 'Đã khôi phục kết nối Internet. Dữ liệu đang được đồng bộ...'
          : 'Mất kết nối Internet! Các thao tác sẽ được đồng bộ lại ngay khi có mạng.'}
      </span>
    </div>
  );
}
