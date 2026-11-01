import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import Icon from '../components/common/Icon';

const DialogContext = createContext();

export function DialogProvider({ children }) {
  // State quản lý Hộp thoại Modal (Alert / Confirm)
  const [dialog, setDialog] = useState(null);
  const dialogResolverRef = useRef(null);

  // State quản lý Toast thông báo trên giao diện
  const [toasts, setToasts] = useState([]);

  /**
   * Hiển thị Hộp thoại Xác nhận (Confirm Dialog) trực tiếp trên UI
   * Trả về Promise<boolean>: true nếu người dùng bấm Xác nhận, false nếu Hủy
   */
  const showConfirm = useCallback(({
    title = 'Xác nhận thao tác',
    message = '',
    confirmText = 'Xác nhận',
    cancelText = 'Hủy bỏ',
    type = 'danger' // 'danger' | 'warning' | 'info'
  }) => {
    return new Promise((resolve) => {
      dialogResolverRef.current = resolve;
      setDialog({
        mode: 'confirm',
        title,
        message,
        confirmText,
        cancelText,
        type
      });
    });
  }, []);

  /**
   * Hiển thị Hộp thoại Thông báo (Alert Dialog) trực tiếp trên UI
   * Trả về Promise<void>: giải phóng khi người dùng bấm Đã hiểu
   */
  const showAlert = useCallback(({
    title = 'Thông báo',
    message = '',
    confirmText = 'Đã hiểu',
    type = 'info' // 'error' | 'warning' | 'info' | 'success'
  }) => {
    return new Promise((resolve) => {
      dialogResolverRef.current = resolve;
      setDialog({
        mode: 'alert',
        title,
        message,
        confirmText,
        type
      });
    });
  }, []);

  const closeDialog = useCallback((result = false) => {
    if (dialogResolverRef.current) {
      dialogResolverRef.current(result);
      dialogResolverRef.current = null;
    }
    setDialog(null);
  }, []);

  /**
   * Hiển thị Toast thông báo nổi trên góc màn hình Web (In-App Toast UI)
   */
  const showToast = useCallback((msg, type = 'success', duration = 3500) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 6);
    const text = typeof msg === 'string' ? msg : msg?.message || 'Thông báo hệ thống';
    const toastType = typeof msg === 'object' && msg?.type ? msg.type : type;

    setToasts((prev) => [...prev, { id, text, type: toastType }]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Lắng nghe phím ESC và Enter khi Dialog đang mở
  useEffect(() => {
    if (!dialog) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        closeDialog(false);
      } else if (e.key === 'Enter') {
        closeDialog(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dialog, closeDialog]);

  // Can thiệp window.alert để chuyển hướng toàn bộ thông báo alert cũ lên UI Web
  useEffect(() => {
    const originalAlert = window.alert;
    window.alert = (msg) => {
      showAlert({
        title: 'Thông Báo',
        message: String(msg || ''),
        type: 'info'
      });
    };

    return () => {
      window.alert = originalAlert;
    };
  }, [showAlert]);

  // Cấu hình màu sắc và icon cho Dialog theo type
  const getTypeConfig = (type) => {
    switch (type) {
      case 'danger':
      case 'error':
        return {
          icon: 'error',
          iconColor: '#BA1A1A',
          iconBg: '#FCEAE8',
          btnBg: '#BA1A1A',
          btnColor: '#FFFFFF',
          btnHover: '#93000A'
        };
      case 'warning':
        return {
          icon: 'warning',
          iconColor: '#D97706',
          iconBg: '#FEF3C7',
          btnBg: '#9D4124',
          btnColor: '#FFFFFF',
          btnHover: '#83341B'
        };
      case 'success':
        return {
          icon: 'check_circle',
          iconColor: '#16A34A',
          iconBg: '#DCFCE7',
          btnBg: '#16A34A',
          btnColor: '#FFFFFF',
          btnHover: '#15803D'
        };
      case 'info':
      default:
        return {
          icon: 'info',
          iconColor: '#9D4124',
          iconBg: '#FCF1EF',
          btnBg: '#9D4124',
          btnColor: '#FFFFFF',
          btnHover: '#83341B'
        };
    }
  };

  return (
    <DialogContext.Provider value={{ showConfirm, showAlert, showToast }}>
      {children}

      {/* =================================================================== */}
      {/* 1. HỘP THOẠI XÁC NHẬN / THÔNG BÁO GIAO DIỆN (CUSTOM DIALOG MODAL)   */}
      {/* =================================================================== */}
      {dialog && (() => {
        const cfg = getTypeConfig(dialog.type);
        return (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 100000,
              background: 'rgba(31, 27, 26, 0.55)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
              animation: 'fadeIn 0.15s ease-out'
            }}
            onClick={() => closeDialog(false)}
          >
            <div
              style={{
                width: '100%',
                maxWidth: '430px',
                background: '#FFFFFF',
                borderRadius: '18px',
                border: '1.5px solid #EAE0DE',
                boxShadow: '0 24px 48px rgba(44, 34, 30, 0.22)',
                padding: '24px',
                animation: 'scaleUp 0.18s ease-out',
                position: 'relative'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header Icon + Tiêu đề */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: '14px' }}>
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    background: cfg.iconBg,
                    color: cfg.iconColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <Icon name={cfg.icon} size={24} fill={1} />
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#1F1B1A', lineHeight: 1.3 }}>
                    {dialog.title}
                  </h3>
                  <div
                    style={{
                      fontSize: '0.88rem',
                      color: '#56423D',
                      marginTop: '8px',
                      lineHeight: 1.55,
                      whiteSpace: 'pre-line',
                      wordBreak: 'break-word'
                    }}
                  >
                    {dialog.message}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  gap: '10px',
                  marginTop: '22px'
                }}
              >
                {dialog.mode === 'confirm' ? (
                  <>
                    <button
                      type="button"
                      onClick={() => closeDialog(false)}
                      style={{
                        padding: '9px 18px',
                        borderRadius: '10px',
                        border: '1px solid #EAE0DE',
                        background: '#FFF8F6',
                        color: '#56423D',
                        fontSize: '0.84rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'background 0.15s'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#F6ECEA')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = '#FFF8F6')}
                    >
                      {dialog.cancelText}
                    </button>
                    <button
                      type="button"
                      onClick={() => closeDialog(true)}
                      style={{
                        padding: '9px 20px',
                        borderRadius: '10px',
                        border: 'none',
                        background: cfg.btnBg,
                        color: cfg.btnColor,
                        fontSize: '0.84rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                        transition: 'background 0.15s'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = cfg.btnHover)}
                      onMouseLeave={(e) => (e.currentTarget.style.background = cfg.btnBg)}
                    >
                      {dialog.confirmText}
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => closeDialog(true)}
                    style={{
                      width: '100%',
                      padding: '10px 18px',
                      borderRadius: '10px',
                      border: 'none',
                      background: cfg.btnBg,
                      color: cfg.btnColor,
                      fontSize: '0.88rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                      transition: 'background 0.15s'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = cfg.btnHover)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = cfg.btnBg)}
                  >
                    {dialog.confirmText}
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* =================================================================== */}
      {/* 2. HỆ THỐNG TOAST THÔNG BÁO NỔI TRÊN GIAO DIỆN (IN-APP TOAST HUB)  */}
      {/* =================================================================== */}
      {toasts.length > 0 && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 100001,
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            maxWidth: '380px',
            pointerEvents: 'none'
          }}
        >
          {toasts.map((t) => {
            const isError = t.type === 'error' || t.type === 'danger';
            const isSuccess = t.type === 'success';
            const isWarn = t.type === 'warning';

            const bg = isError
              ? '#BA1A1A'
              : isSuccess
              ? '#1E293B'
              : isWarn
              ? '#D97706'
              : '#1F1B1A';

            const iconName = isError
              ? 'error'
              : isSuccess
              ? 'check_circle'
              : isWarn
              ? 'warning'
              : 'info';

            const iconColor = isError
              ? '#FFCDD2'
              : isSuccess
              ? '#4ADE80'
              : isWarn
              ? '#FDE68A'
              : '#FFB68C';

            return (
              <div
                key={t.id}
                style={{
                  pointerEvents: 'auto',
                  background: bg,
                  color: '#FFFFFF',
                  padding: '11px 16px',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  boxShadow: '0 10px 28px rgba(0,0,0,0.28)',
                  animation: 'slideInRight 0.2s ease-out'
                }}
              >
                <Icon name={iconName} size={20} fill={1} style={{ color: iconColor, flexShrink: 0 }} />
                <span style={{ fontSize: '0.86rem', fontWeight: 600, flex: 1, lineHeight: 1.4 }}>
                  {t.text}
                </span>
                <button
                  type="button"
                  onClick={() => removeToast(t.id)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'rgba(255,255,255,0.7)',
                    cursor: 'pointer',
                    padding: '2px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                  title="Đóng thông báo"
                >
                  <Icon name="close" size={16} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </DialogContext.Provider>
  );
}

export function useDialog() {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('useDialog must be used within a DialogProvider');
  }
  return context;
}
