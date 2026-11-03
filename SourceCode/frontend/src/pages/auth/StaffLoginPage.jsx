import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth, getRoleHome } from '../../context/AuthContext';
import Icon from '../../components/common/Icon';
import RomsLogo from '../../components/common/RomsLogo';
import { authApi } from '../../api/authApi';
import './staffLogin.css';

const PRESET_ACCOUNTS = [
  { role: 'MANAGER', roleLabel: 'Quản Lý', code: 'MGR-001', pin: '123456', name: 'Dương Trong', icon: 'shield_person', color: '#9D4124' },
  { role: 'WAITER', roleLabel: 'Phục Vụ', code: 'EMP-001', pin: '123456', name: 'Phạm Minh Đức', icon: 'room_service', color: '#9D4124' },
  { role: 'KITCHEN', roleLabel: 'Bếp KDS', code: 'KDS-001', pin: '123456', name: 'Ngô Viết Bảo Huy', icon: 'cooking', color: '#9D4124' },
  { role: 'CASHIER', roleLabel: 'Thu Ngân', code: 'CSH-001', pin: '123456', name: 'Đỗ Võ Thanh Trung', icon: 'point_of_sale', color: '#9D4124' },
];

export default function StaffLoginPage() {
  const { login, user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Màn hình 1: Nhập mã nhân viên
  const [employeeCode, setEmployeeCode] = useState('MGR-001');
  const [errorMessage, setErrorMessage] = useState(null);

  // Màn hình 2: Popup Modal Touchpad nhập mã PIN
  const [showPinModal, setShowPinModal] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isShaking, setIsShaking] = useState(false);

  // Modal Khôi phục mã PIN Quản lý
  const [showForgotPinModal, setShowForgotPinModal] = useState(false);
  const [forgotStep, setForgotStep] = useState(1);
  const [forgotUsername, setForgotUsername] = useState('MGR-001');
  const [otpOrKey, setOtpOrKey] = useState('');
  const [newPinCode, setNewPinCode] = useState('');
  const [confirmPinCode, setConfirmPinCode] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState(null);
  const [forgotSuccess, setForgotSuccess] = useState(null);
  const [otpHint, setOtpHint] = useState(null);
  const [maskedEmail, setMaskedEmail] = useState(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Đếm ngược thời gian chờ gửi lại mã OTP (cooldown 60s)
  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Tìm thông tin preset tương ứng với mã nhân viên hiện tại (nếu có)
  const matchedPreset = PRESET_ACCOUNTS.find(
    p => p.code.toUpperCase() === employeeCode.trim().toUpperCase()
  );

  // Mở Popup PIN khi bấm chọn Preset
  const handleSelectPreset = (preset) => {
    setEmployeeCode(preset.code);
    setErrorMessage(null);
    setPin('');
    setPinError(null);
    setShowPinModal(true);
  };

  // Mở Popup PIN từ form mã nhân viên
  const handleProceedToPin = (e) => {
    if (e) e.preventDefault();
    if (!employeeCode.trim()) {
      setErrorMessage('Vui lòng nhập Mã Nhân Viên!');
      return;
    }
    setErrorMessage(null);
    setPin('');
    setPinError(null);
    setShowPinModal(true);
  };

  // Thực hiện đăng nhập khi gõ đủ 6 số PIN
  const executeLogin = useCallback(async (codeToLogin, pinToLogin) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setPinError(null);

    try {
      const result = await login(codeToLogin.trim().toUpperCase(), pinToLogin);
      if (result.success) {
        setShowPinModal(false);
        const targetRoute = location.state?.from?.pathname || getRoleHome(result.role);
        navigate(targetRoute, { replace: true });
      } else {
        setPinError(result.message || 'Mã PIN ca trực không chính xác!');
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 400);
        setPin(''); // Xóa mã PIN để nhập lại
      }
    } catch (err) {
      setPinError('Lỗi kết nối máy chủ, vui lòng thử lại!');
      setPin('');
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, login, location, navigate]);

  // Nhấn phím số trên Numpad
  const handleNumpadPress = useCallback((num) => {
    if (isSubmitting) return;
    setPinError(null);
    if (pin.length < 6) {
      const nextPin = pin + num;
      setPin(nextPin);
      if (nextPin.length === 6) {
        executeLogin(employeeCode, nextPin);
      }
    }
  }, [pin, isSubmitting, employeeCode, executeLogin]);

  // Xóa 1 ký tự số
  const handleNumpadBackspace = useCallback(() => {
    if (isSubmitting) return;
    setPinError(null);
    setPin(prev => prev.slice(0, -1));
  }, [isSubmitting]);

  // Xóa toàn bộ số PIN
  const handleNumpadClear = useCallback(() => {
    if (isSubmitting) return;
    setPinError(null);
    setPin('');
  }, [isSubmitting]);

  // Bắt phím bàn phím vật lý trên Desktop khi Popup PIN đang mở
  useEffect(() => {
    if (!showPinModal) return;

    const handleKeyDown = (e) => {
      if (isSubmitting) return;
      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        handleNumpadPress(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleNumpadBackspace();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setShowPinModal(false);
      } else if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        handleNumpadClear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showPinModal, isSubmitting, handleNumpadPress, handleNumpadBackspace, handleNumpadClear]);

  // Mở modal Khôi phục mã PIN Quản lý
  const handleOpenForgotPin = () => {
    if (employeeCode.startsWith('MGR') || matchedPreset?.role === 'MANAGER') {
      setForgotUsername(employeeCode);
    } else {
      setForgotUsername('MGR-001');
    }
    setForgotStep(1);
    setForgotError(null);
    setForgotSuccess(null);
    setOtpOrKey('');
    setNewPinCode('');
    setConfirmPinCode('');
    setOtpHint(null);
    setResendCooldown(0);
    setShowPinModal(false);
    setShowForgotPinModal(true);
  };

  // Bước 1: Yêu cầu cấp mã OTP
  const handleRequestOtp = async (e) => {
    if (e) e.preventDefault();
    if (!forgotUsername.trim()) {
      setForgotError('Vui lòng nhập Mã Nhân Viên Quản lý!');
      return;
    }
    setForgotLoading(true);
    setForgotError(null);
    try {
      const res = await authApi.requestPinResetOtp(forgotUsername.trim());
      const data = res.data?.data || res.data || {};
      setOtpHint(data.otpHint || null);
      setMaskedEmail(data.maskedEmail || 'quản lý');
      setForgotSuccess(data.message || 'Đã gửi mã OTP khôi phục thành công!');
      setForgotStep(2);
      setResendCooldown(60);
      setOtpOrKey('');
    } catch (err) {
      setForgotError(err.response?.data?.message || 'Không thể yêu cầu mã OTP. Vui lòng kiểm tra lại!');
    } finally {
      setForgotLoading(false);
    }
  };

  // Bước 2: Đặt lại mã PIN bằng OTP hoặc Master Key
  const handleResetPin = async (e) => {
    if (e) e.preventDefault();
    if (!otpOrKey.trim()) {
      setForgotError('Vui lòng nhập mã OTP hoặc Master Recovery Key!');
      return;
    }
    if (!newPinCode || newPinCode.length !== 6 || !/^\d{6}$/.test(newPinCode)) {
      setForgotError('Mã PIN mới phải gồm chính xác 6 chữ số!');
      return;
    }
    if (newPinCode !== confirmPinCode) {
      setForgotError('Xác nhận mã PIN mới không trùng khớp!');
      return;
    }

    setForgotLoading(true);
    setForgotError(null);
    try {
      const res = await authApi.resetPinWithOtp(
        forgotUsername.trim(),
        otpOrKey.trim(),
        newPinCode,
        confirmPinCode
      );
      const data = res.data?.data || res.data || {};
      alert(data.message || 'Đặt lại mã PIN thành công! Vui lòng đăng nhập với mã PIN mới.');
      setShowForgotPinModal(false);
      setEmployeeCode(forgotUsername);
      setPin('');
      setShowPinModal(true);
    } catch (err) {
      const errorMsg = err.response?.data?.message || (err.response ? 'Mã OTP xác thực không chính xác hoặc đã hết hạn!' : err.message);
      setForgotError(errorMsg);
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="staff-login-wrapper">
      {/* Card Màn hình chính: Nhập mã nhân viên */}
      <div className="staff-login-card">
        {/* Header with Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <RomsLogo size={40} />
          <div>
            <span style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 900, fontSize: '1.25rem', color: '#1F1B1A', letterSpacing: '0.04em' }}>
              ROMS
            </span>
            <span style={{ fontSize: '0.72rem', color: '#9D4124', display: 'block', fontWeight: 700, letterSpacing: '0.06em' }}>
              HỆ THỐNG VẬN HÀNH CA TRỰC
            </span>
          </div>
        </div>

        <h2 style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 900, fontSize: '1.5rem', color: '#1F1B1A', margin: '0 0 6px' }}>
          Đăng Nhập Ca Làm Việc
        </h2>
        <p style={{ margin: '0 0 16px', fontSize: '0.85rem', color: '#89726B', lineHeight: 1.45 }}>
          Chọn nhanh vị trí trực hoặc nhập Mã Thẻ Nhân Viên để tiến hành xác thực vào ca.
        </p>

        {/* Thông báo nếu tab hiện tại đã có ca trực */}
        {isAuthenticated && user?.role && (
          <div style={{
            background: '#FDF7F5',
            border: '1px solid #EAE0DE',
            borderRadius: '12px',
            padding: '10px 14px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Icon name="verified_user" size={18} style={{ color: '#9D4124' }} />
              <span style={{ fontSize: '0.78rem', color: '#56423D' }}>
                Đang trực: <b>{user.fullName || user.username}</b> ({user.role})
              </span>
            </div>
            <button
              type="button"
              onClick={() => navigate(getRoleHome(user.role), { replace: true })}
              style={{
                background: '#9D4124',
                color: '#FFF',
                border: 'none',
                borderRadius: '8px',
                padding: '4px 10px',
                fontSize: '0.74rem',
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              Vào ca →
            </button>
          </div>
        )}

        {/* Error Message */}
        {errorMessage && (
          <div style={{
            background: '#FFDAD6',
            color: '#BA1A1A',
            padding: '10px 14px',
            borderRadius: '12px',
            marginBottom: '16px',
            fontSize: '0.82rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Icon name="error" size={18} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Role Preset Quick Selection */}
        <div style={{ marginBottom: '18px' }}>
          <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#56423D', display: 'block', marginBottom: '8px' }}>
            Chọn Nhanh Ca / Vị Trí Trực (Demo):
          </span>
          <div className="staff-login-presets-container">
            {PRESET_ACCOUNTS.map(p => {
              const isSelected = employeeCode.trim().toUpperCase() === p.code;
              return (
                <button
                  key={p.role}
                  type="button"
                  className="staff-preset-chip"
                  onClick={() => handleSelectPreset(p)}
                  style={{
                    border: isSelected ? `2px solid ${p.color}` : '1px solid #EAE0DE',
                    background: isSelected ? '#FFF8F6' : '#FFFFFF',
                    color: isSelected ? p.color : '#56423D'
                  }}
                >
                  <Icon name={p.icon} size={16} />
                  <span>{p.roleLabel}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Form nhập Mã Nhân Viên */}
        <form onSubmit={handleProceedToPin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#56423D', marginBottom: '6px' }}>
              Mã Nhân Viên (Mã Thẻ)
            </label>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '13px 15px',
                borderRadius: '14px',
                background: '#FFF8F6',
                border: '1.5px solid #EAE0DE',
                boxSizing: 'border-box'
              }}
            >
              <Icon name="badge" size={22} style={{ color: '#9D4124' }} />
              <input
                type="text"
                required
                placeholder="VD: MGR-001, EMP-001, KDS-001..."
                value={employeeCode}
                onChange={(e) => setEmployeeCode(e.target.value.toUpperCase())}
                style={{
                  border: 'none',
                  background: 'transparent',
                  outline: 'none',
                  fontSize: '1.05rem',
                  fontWeight: 800,
                  color: '#1F1B1A',
                  width: '100%'
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            style={{
              marginTop: '4px',
              padding: '14px',
              borderRadius: '14px',
              background: '#9D4124',
              color: '#FFFFFF',
              border: 'none',
              fontFamily: "'Epilogue', sans-serif",
              fontWeight: 900,
              fontSize: '0.98rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'pointer',
              boxShadow: '0 6px 18px rgba(157, 65, 36, 0.3)',
              transition: 'all 0.15s ease'
            }}
          >
            <Icon name="key" size={20} />
            <span>Tiếp Tục Nhập Mã PIN →</span>
          </button>

          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '4px' }}>
            <button
              type="button"
              onClick={handleOpenForgotPin}
              style={{
                background: 'none',
                border: 'none',
                color: '#9D4124',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 8px',
                borderRadius: '6px'
              }}
            >
              <Icon name="lock_reset" size={16} />
              Quên mã PIN Quản Lý?
            </button>
          </div>
        </form>

        <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #F0E6E4', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link to="/" style={{ fontSize: '0.82rem', color: '#89726B', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
            <Icon name="arrow_back" size={16} />
            Trang Chủ
          </Link>
          <span style={{ fontSize: '0.75rem', color: '#89726B' }}>
            ROMS Hospitality v2.4
          </span>
        </div>
      </div>

      {/* ==========================================================================
          POPUP MODAL TOUCHPAD NHẬP MÃ PIN (TWO-STEP AUTH)
          ========================================================================== */}
      {showPinModal && (
        <div
          className="staff-pin-modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isSubmitting) {
              setShowPinModal(false);
            }
          }}
        >
          <div className={`staff-pin-modal-card ${isShaking ? 'staff-pin-shake' : ''}`}>
            {/* Nút đóng [X] */}
            <button
              type="button"
              onClick={() => !isSubmitting && setShowPinModal(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: '#F6ECEA',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#56423D'
              }}
              title="Đóng"
            >
              <Icon name="close" size={18} />
            </button>

            {/* Thông tin nhân viên đang vào ca */}
            <div style={{ textAlign: 'center', marginBottom: '8px' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 12px',
                borderRadius: '9999px',
                background: '#FFF8F6',
                border: '1px solid #FFDBC9',
                color: '#9D4124',
                fontSize: '0.78rem',
                fontWeight: 800,
                marginBottom: '6px'
              }}>
                <Icon name={matchedPreset ? matchedPreset.icon : 'badge'} size={15} />
                <span>{matchedPreset ? `${matchedPreset.roleLabel} • ${matchedPreset.name}` : employeeCode}</span>
              </div>
              <h3 style={{ margin: '2px 0 0', fontFamily: "'Epilogue', sans-serif", fontWeight: 900, fontSize: '1.25rem', color: '#1F1B1A' }}>
                Xác Thực Mã PIN Ca Trực
              </h3>
            </div>

            {/* Thông báo lỗi mã PIN nếu có */}
            {pinError && (
              <div style={{
                background: '#FFDAD6',
                color: '#BA1A1A',
                padding: '6px 12px',
                borderRadius: '10px',
                fontSize: '0.78rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginBottom: '4px',
                textAlign: 'center'
              }}>
                <Icon name="error" size={16} />
                <span>{pinError}</span>
              </div>
            )}

            {/* Hàng 6 chấm tròn mã PIN */}
            <div className="staff-pin-dots-container">
              {[0, 1, 2, 3, 4, 5].map((idx) => (
                <div
                  key={idx}
                  className={`staff-pin-dot ${pin.length > idx ? 'filled' : 'empty'}`}
                />
              ))}
            </div>

            {/* Lưới Bàn phím số Touchpad 3x4 */}
            <div className="staff-numpad-grid">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  type="button"
                  className="staff-numpad-btn"
                  disabled={isSubmitting}
                  onClick={() => handleNumpadPress(num.toString())}
                >
                  {num}
                </button>
              ))}

              {/* Phím Clear */}
              <button
                type="button"
                className="staff-numpad-btn btn-action"
                disabled={isSubmitting}
                onClick={handleNumpadClear}
                title="Xóa hết"
              >
                C
              </button>

              {/* Phím 0 */}
              <button
                type="button"
                className="staff-numpad-btn"
                disabled={isSubmitting}
                onClick={() => handleNumpadPress('0')}
              >
                0
              </button>

              {/* Phím Backspace */}
              <button
                type="button"
                className="staff-numpad-btn btn-action btn-backspace"
                disabled={isSubmitting}
                onClick={handleNumpadBackspace}
                title="Xóa lùi"
              >
                <Icon name="backspace" size={22} />
              </button>
            </div>

            {/* Dòng trạng thái đang xác thực */}
            {isSubmitting && (
              <div style={{ marginTop: '12px', fontSize: '0.8rem', color: '#9D4124', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="animate-spin">⏳</span>
                <span>Đang xác thực ca trực...</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Khôi Phục Mã PIN Quản Lý (Giữ nguyên chính sách bảo mật) */}
      {showForgotPinModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          zIndex: 9999
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '24px',
            maxWidth: '460px',
            width: '100%',
            padding: '28px',
            boxShadow: '0 25px 60px -15px rgba(0,0,0,0.5)',
            position: 'relative'
          }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: '#FFF8F6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#9D4124'
                }}>
                  <Icon name="lock_reset" size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: '#1F1B1A', fontFamily: "'Epilogue', sans-serif" }}>
                    Khôi Phục Mã PIN Quản Lý
                  </h3>
                  <span style={{ fontSize: '0.75rem', color: '#89726B' }}>
                    {forgotStep === 1 ? 'Bước 1: Xác thực tài khoản' : 'Bước 2: Cài đặt mã PIN mới'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowForgotPinModal(false)}
                style={{
                  background: '#F6ECEA',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#56423D'
                }}
              >
                <Icon name="close" size={18} />
              </button>
            </div>

            {/* Error / Success Messages */}
            {forgotError && (
              <div style={{
                background: '#FFDAD6',
                color: '#BA1A1A',
                padding: '10px 14px',
                borderRadius: '10px',
                marginBottom: '14px',
                fontSize: '0.8rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <Icon name="error" size={16} />
                <span>{forgotError}</span>
              </div>
            )}

            {forgotSuccess && (
              <div style={{
                background: '#D4EDDA',
                color: '#155724',
                padding: '10px 14px',
                borderRadius: '10px',
                marginBottom: '14px',
                fontSize: '0.8rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <Icon name="check_circle" size={16} />
                <span>{forgotSuccess}</span>
              </div>
            )}

            {/* STEP 1: Request OTP */}
            {forgotStep === 1 && (
              <form onSubmit={handleRequestOtp} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ background: '#FDF7F5', border: '1px solid #EAE0DE', borderRadius: '12px', padding: '12px', fontSize: '0.8rem', color: '#56423D', lineHeight: '1.4' }}>
                  <div style={{ fontWeight: 800, color: '#9D4124', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Icon name="info" size={16} />
                    Chính sách bảo mật hệ thống ROMS:
                  </div>
                  Chỉ tài khoản Quản lý cơ sở (role <b>MANAGER</b>) mới có quyền tự khôi phục mã PIN. Nhân viên khác vui lòng liên hệ trực tiếp Quản lý ca trực.
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#56423D', marginBottom: '6px' }}>
                    Mã Nhân Viên Quản Lý
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: MGR-001"
                    value={forgotUsername}
                    onChange={(e) => setForgotUsername(e.target.value.toUpperCase())}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '12px',
                      background: '#FFF8F6',
                      border: '1.5px solid #9D4124',
                      fontSize: '0.95rem',
                      fontWeight: 800,
                      color: '#1F1B1A',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={forgotLoading}
                  style={{
                    padding: '12px',
                    borderRadius: '12px',
                    background: '#9D4124',
                    color: '#FFF',
                    border: 'none',
                    fontWeight: 800,
                    fontSize: '0.9rem',
                    cursor: forgotLoading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 12px rgba(157, 65, 36, 0.25)',
                    opacity: forgotLoading ? 0.7 : 1
                  }}
                >
                  <Icon name="send" size={18} />
                  {forgotLoading ? 'Đang tạo mã OTP...' : 'Gửi Mã Xác Thực OTP'}
                </button>
              </form>
            )}

            {/* STEP 2: Reset PIN */}
            {forgotStep === 2 && (
              <form onSubmit={handleResetPin} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ background: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: '12px', padding: '12px', fontSize: '0.8rem', color: '#0369A1' }}>
                  <div style={{ fontWeight: 800, color: '#0284C7', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Icon name="mail" size={18} />
                    Mã xác thực OTP đã được gửi thành công!
                  </div>
                  <div style={{ color: '#0C4A6E', lineHeight: '1.4' }}>
                    Hệ thống đã gửi mã OTP 6 chữ số tới hộp thư <strong>{maskedEmail || 'quản lý'}</strong>. Vui lòng kiểm tra hộp thư đến (hoặc hòm thư Spam).
                  </div>
                  <div style={{ marginTop: '8px', fontSize: '0.74rem', color: '#64748B', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #E0F2FE', paddingTop: '6px' }}>
                    <span>Hiệu lực trong 5 phút</span>
                    <button
                      type="button"
                      disabled={resendCooldown > 0 || forgotLoading}
                      onClick={handleRequestOtp}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: resendCooldown > 0 ? '#94A3B8' : '#9D4124',
                        fontWeight: 700,
                        cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer',
                        padding: 0,
                        textDecoration: 'underline',
                        fontSize: '0.76rem'
                      }}
                    >
                      {resendCooldown > 0 ? `Gửi lại sau (${resendCooldown}s)` : 'Gửi lại mã OTP'}
                    </button>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#56423D', marginBottom: '4px' }}>
                    Mã Xác Thực OTP (6 Số)
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    placeholder="Nhập 6 chữ số từ email"
                    value={otpOrKey}
                    onChange={(e) => setOtpOrKey(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: '1px solid #EAE0DE',
                      fontSize: '1rem',
                      fontWeight: 700,
                      letterSpacing: '2px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#56423D', marginBottom: '4px' }}>
                      Mã PIN Mới (6 Số)
                    </label>
                    <input
                      type="password"
                      maxLength={6}
                      required
                      placeholder="••••••"
                      value={newPinCode}
                      onChange={(e) => setNewPinCode(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '10px',
                        border: '1px solid #EAE0DE',
                        fontSize: '1rem',
                        fontWeight: 800,
                        letterSpacing: '4px',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#56423D', marginBottom: '4px' }}>
                      Xác Nhận PIN Mới
                    </label>
                    <input
                      type="password"
                      maxLength={6}
                      required
                      placeholder="••••••"
                      value={confirmPinCode}
                      onChange={(e) => setConfirmPinCode(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '10px',
                        border: '1px solid #EAE0DE',
                        fontSize: '1rem',
                        fontWeight: 800,
                        letterSpacing: '4px',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                  <button
                    type="button"
                    onClick={() => setForgotStep(1)}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '10px',
                      background: '#F6ECEA',
                      color: '#56423D',
                      border: 'none',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      cursor: 'pointer'
                    }}
                  >
                    ← Quay lại
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '10px',
                      background: '#9D4124',
                      color: '#FFF',
                      border: 'none',
                      fontWeight: 800,
                      fontSize: '0.88rem',
                      cursor: forgotLoading ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      boxShadow: '0 4px 12px rgba(157, 65, 36, 0.25)',
                      opacity: forgotLoading ? 0.7 : 1
                    }}
                  >
                    <Icon name="check" size={18} />
                    {forgotLoading ? 'Đang cập nhật...' : 'Xác Nhận Đặt Lại Mã PIN'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
