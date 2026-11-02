import React, { useState, useEffect } from 'react';
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

  const [employeeCode, setEmployeeCode] = useState('MGR-001');
  const [pin, setPin] = useState('123456');
  const [activeRole, setActiveRole] = useState('MANAGER');
  const [activeField, setActiveField] = useState('pin'); // 'code' or 'pin'
  const [errorMessage, setErrorMessage] = useState(null);
  const [mobileView, setMobileView] = useState('FORM'); // 'FORM' | 'NUMPAD'

  // Modal Khôi phục mã PIN Quản lý
  const [showForgotPinModal, setShowForgotPinModal] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1: request OTP, 2: reset PIN
  const [forgotUsername, setForgotUsername] = useState('MGR-001');
  const [otpOrKey, setOtpOrKey] = useState('');
  const [newPinCode, setNewPinCode] = useState('');
  const [confirmPinCode, setConfirmPinCode] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState(null);
  const [forgotSuccess, setForgotSuccess] = useState(null);
  const [otpHint, setOtpHint] = useState(null);
  const [maskedEmail, setMaskedEmail] = useState(null);

  // Không ép tự động chuyển hướng để cho phép nhân viên đổi ca / chọn vai trò khác
  // Nếu muốn vào tiếp ca hiện tại, người dùng có nút bấm nhanh "Vào ca →" trên thông báo

  // Handle Preset Account Selection
  const handleSelectPreset = (preset) => {
    setEmployeeCode(preset.code);
    setPin(preset.pin);
    setActiveRole(preset.role);
    setErrorMessage(null);
  };

  // Numpad Touch Input
  const handleNumpadPress = (num) => {
    setErrorMessage(null);
    if (activeField === 'pin') {
      if (pin.length < 6) {
        setPin(prev => prev + num);
      }
    } else {
      setEmployeeCode(prev => prev + num);
    }
  };

  const handleNumpadBackspace = () => {
    setErrorMessage(null);
    if (activeField === 'pin') {
      setPin(prev => prev.slice(0, -1));
    } else {
      setEmployeeCode(prev => prev.slice(0, -1));
    }
  };

  const handleNumpadClear = () => {
    if (activeField === 'pin') {
      setPin('');
    } else {
      setEmployeeCode('');
    }
  };

  // Submit Login
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!employeeCode.trim()) {
      setErrorMessage('Vui lòng nhập Mã Nhân Viên!');
      return;
    }
    if (!pin || pin.length !== 6 || !/^\d{6}$/.test(pin)) {
      setErrorMessage('Mã PIN ca trực phải gồm chính xác 6 chữ số!');
      return;
    }

    // 1. Chờ kết quả xác thực từ Backend
    const result = await login(employeeCode, pin);

    // 2. Nếu đăng nhập thành công từ CSDL -> Điều hướng vào ca trực
    if (result.success) {
      const targetRoute = location.state?.from?.pathname || getRoleHome(result.role);
      navigate(targetRoute, { replace: true });
    } else {
      // 3. Nếu sai mã PIN hoặc tài khoản không tồn tại -> Báo lỗi đỏ lên giao diện
      setErrorMessage(result.message);
    }
  };

  // Mở modal Khôi phục mã PIN Quản lý
  const handleOpenForgotPin = () => {
    if (employeeCode.startsWith('MGR') || activeRole === 'MANAGER') {
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
      setMaskedEmail(data.maskedEmail || 'email');
      setForgotSuccess(data.message || 'Đã tạo mã OTP khôi phục thành công!');
      setForgotStep(2);
      if (data.otpHint) {
        setOtpOrKey(data.otpHint);
      }
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
      setForgotError('Mã PIN xác nhận không trùng khớp!');
      return;
    }
    setForgotLoading(true);
    setForgotError(null);
    try {
      await authApi.resetPinWithOtpOrRecoveryKey({
        username: forgotUsername.trim(),
        otpOrRecoveryKey: otpOrKey.trim(),
        newPinCode: newPinCode.trim(),
        confirmPinCode: confirmPinCode.trim()
      });
      setForgotSuccess('Đặt lại mã PIN thành công! Đang tự động điền mã PIN mới...');
      setEmployeeCode(forgotUsername.trim());
      setPin(newPinCode.trim());
      setActiveRole('MANAGER');
      setErrorMessage(null);
      setTimeout(() => {
        setShowForgotPinModal(false);
        setForgotSuccess(null);
      }, 1500);
    } catch (err) {
      setForgotError(err.response?.data?.message || 'Không thể đặt lại mã PIN. Vui lòng thử lại!');
    } finally {
      setForgotLoading(false);
    }
  };


  return (
    <div className="staff-login-wrapper">
      <div className="staff-login-card">
        {/* Left Side: Employee ID, PIN, Preset Chips */}
        <div
          className="staff-login-left"
          style={{
            display: mobileView === 'NUMPAD' && typeof window !== 'undefined' && window.innerWidth <= 860 ? 'none' : 'flex'
          }}
        >
          <div>
            {/* Header with Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <RomsLogo size={38} />
              <div>
                <span style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 900, fontSize: '1.25rem', color: '#1F1B1A', letterSpacing: '0.04em' }}>
                  ROMS
                </span>
                <span style={{ fontSize: '0.72rem', color: '#9D4124', display: 'block', fontWeight: 700, letterSpacing: '0.06em' }}>
                  HỆ THỐNG VẬN HÀNH CA TRỰC
                </span>
              </div>
            </div>

            {/* Mobile View Toggle Tabs */}
            <div className="staff-login-mobile-tabs">
              <button
                type="button"
                className={`staff-login-mobile-tab-btn ${mobileView === 'FORM' ? 'active' : ''}`}
                onClick={() => setMobileView('FORM')}
              >
                <Icon name="badge" size={16} />
                <span>Nhập Ca & PIN</span>
              </button>
              <button
                type="button"
                className={`staff-login-mobile-tab-btn ${mobileView === 'NUMPAD' ? 'active' : ''}`}
                onClick={() => {
                  setMobileView('NUMPAD');
                  setActiveField('pin');
                }}
              >
                <Icon name="dialpad" size={16} />
                <span>Bàn Phím Số ({pin.length}/6)</span>
              </button>
            </div>

            <h2 style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 900, fontSize: '1.5rem', color: '#1F1B1A', margin: '0 0 6px' }}>
              Đăng Nhập Ca Làm Việc
            </h2>
            <p style={{ margin: '0 0 16px', fontSize: '0.85rem', color: '#89726B' }}>
              Quét thẻ nhân viên hoặc nhập Mã Nhân Viên và Mã PIN để vào vị trí làm việc.
            </p>

            {/* Thông báo nếu tab hiện tại đã có ca trực (cho phép đổi ca hoặc vào lại ca) */}
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
                    Tab này đang đăng nhập: <b>{user.fullName || user.username}</b> ({user.role})
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
            <div style={{ marginBottom: '16px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#56423D', display: 'block', marginBottom: '8px' }}>
                Chọn Nhanh Ca / Vị Trí Trực (Demo):
              </span>
              <div className="staff-login-presets-container">
                {PRESET_ACCOUNTS.map(p => {
                  const isSelected = employeeCode === p.code;
                  return (
                    <button
                      key={p.role}
                      type="button"
                      onClick={() => handleSelectPreset(p)}
                      style={{
                        padding: '7px 12px',
                        borderRadius: '10px',
                        border: isSelected ? `2px solid ${p.color}` : '1px solid #EAE0DE',
                        background: isSelected ? '#FFF8F6' : '#FFFFFF',
                        color: isSelected ? p.color : '#56423D',
                        fontWeight: 800,
                        fontSize: '0.76rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <Icon name={p.icon} size={16} />
                      {p.roleLabel}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Inputs: Employee Code & PIN */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#56423D', marginBottom: '6px' }}>
                  Mã Nhân Viên (Mã Thẻ)
                </label>
                <div
                  onClick={() => setActiveField('code')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    background: activeField === 'code' ? '#FFF8F6' : '#FDF7F5',
                    border: activeField === 'code' ? '2px solid #9D4124' : '1px solid #EAE0DE',
                    cursor: 'pointer'
                  }}
                >
                  <Icon name="badge" size={20} style={{ color: '#89726B' }} />
                  <input
                    type="text"
                    required
                    placeholder="VD: MGR-001, EMP-001..."
                    value={employeeCode}
                    onChange={(e) => setEmployeeCode(e.target.value.toUpperCase())}
                    onFocus={() => setActiveField('code')}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      outline: 'none',
                      fontSize: '0.95rem',
                      fontWeight: 800,
                      color: '#1F1B1A',
                      width: '100%'
                    }}
                  />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#56423D' }}>
                    Mã PIN Ca Trực (6 Số)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileView('NUMPAD');
                      setActiveField('pin');
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: 'transparent',
                      border: 'none',
                      color: '#9D4124',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    <Icon name="dialpad" size={15} />
                    Bàn phím số Numpad
                  </button>
                </div>
                <div
                  onClick={() => setActiveField('pin')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    background: activeField === 'pin' ? '#FFF8F6' : '#FDF7F5',
                    border: activeField === 'pin' ? '2px solid #9D4124' : '1px solid #EAE0DE',
                    cursor: 'pointer'
                  }}
                >
                  <Icon name="pin" size={20} style={{ color: '#89726B' }} />
                  <input
                    type="password"
                    maxLength={6}
                    required
                    placeholder="••••••"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    onFocus={() => setActiveField('pin')}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      outline: 'none',
                      fontSize: '1.25rem',
                      fontWeight: 800,
                      letterSpacing: '8px',
                      color: '#1F1B1A',
                      width: '100%'
                    }}
                  />
                </div>
              </div>

              <button
                type="submit"
                style={{
                  marginTop: '8px',
                  padding: '14px',
                  borderRadius: '14px',
                  background: '#9D4124',
                  color: '#FFFFFF',
                  border: 'none',
                  fontFamily: "'Epilogue', sans-serif",
                  fontWeight: 900,
                  fontSize: '0.95rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  boxShadow: '0 6px 18px rgba(157, 65, 36, 0.3)'
                }}
              >
                <Icon name="login" size={20} />
                Vào Ca Làm Việc
              </button>

              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '6px' }}>
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
                    borderRadius: '6px',
                    textDecoration: 'none'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                  onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                >
                  <Icon name="lock_reset" size={16} />
                  Quên mã PIN Quản Lý?
                </button>
              </div>
            </form>
          </div>

          <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #F0E6E4', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Link to="/" style={{ fontSize: '0.8rem', color: '#89726B', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
              <Icon name="arrow_back" size={16} />
              Trang Chủ
            </Link>
            <span style={{ fontSize: '0.75rem', color: '#89726B' }}>
              ROMS v2.4 Enterprise
            </span>
          </div>
        </div>

        {/* Right Side: Touchscreen Numpad for Fast POS/Tablet Access */}
        <div
          className="staff-login-right"
          style={{
            display: mobileView === 'FORM' && typeof window !== 'undefined' && window.innerWidth <= 860 ? 'none' : 'flex'
          }}
        >
          {/* Mobile Back to Form button if active */}
          <div className="staff-login-mobile-tabs" style={{ width: '100%', maxWidth: '300px' }}>
            <button
              type="button"
              className={`staff-login-mobile-tab-btn ${mobileView === 'FORM' ? 'active' : ''}`}
              onClick={() => setMobileView('FORM')}
            >
              <Icon name="arrow_back" size={16} />
              <span>Quay Lại Biểu Mẫu</span>
            </button>
            <button
              type="button"
              className={`staff-login-mobile-tab-btn ${mobileView === 'NUMPAD' ? 'active' : ''}`}
              onClick={() => setMobileView('NUMPAD')}
            >
              <Icon name="dialpad" size={16} />
              <span>Bàn Phím Số</span>
            </button>
          </div>

          <div style={{ width: '100%', maxWidth: '300px' }}>
            <div style={{ textAlign: 'center', marginBottom: '14px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#9D4124', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Bàn Phím Số Cảm Ứng (Touch Numpad)
              </span>
              <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: '#56423D' }}>
                Đang nhập cho: <b>{activeField === 'pin' ? 'MÃ PIN (6 Số)' : 'MÃ NHÂN VIÊN'}</b>
              </p>
            </div>

            {/* PIN Dots Preview */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '12px',
              margin: '0 auto 16px',
              padding: '10px 16px',
              background: '#FFFFFF',
              borderRadius: '12px',
              border: '1px solid #EAE0DE'
            }}>
              {[0, 1, 2, 3, 4, 5].map(idx => (
                <div
                  key={idx}
                  style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    background: pin.length > idx ? '#9D4124' : '#EAE0DE',
                    transition: 'all 0.15s ease'
                  }}
                />
              ))}
            </div>

            {/* Grid 3x4 Numpad */}
            <div
              className="staff-numpad-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '10px'
              }}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleNumpadPress(num.toString())}
                  style={{
                    height: '54px',
                    borderRadius: '14px',
                    border: '1px solid #EAE0DE',
                    background: '#FFFFFF',
                    fontFamily: "'Epilogue', sans-serif",
                    fontWeight: 800,
                    fontSize: '1.35rem',
                    color: '#1F1B1A',
                    cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                    transition: 'transform 0.1s ease, background 0.1s ease'
                  }}
                  onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.96)'}
                  onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  {num}
                </button>
              ))}

              {/* Clear */}
              <button
                type="button"
                onClick={handleNumpadClear}
                style={{
                  height: '54px',
                  borderRadius: '14px',
                  border: '1px solid #EAE0DE',
                  background: '#F6ECEA',
                  color: '#56423D',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                C
              </button>

              {/* Zero */}
              <button
                type="button"
                onClick={() => handleNumpadPress('0')}
                style={{
                  height: '54px',
                  borderRadius: '14px',
                  border: '1px solid #EAE0DE',
                  background: '#FFFFFF',
                  fontFamily: "'Epilogue', sans-serif",
                  fontWeight: 800,
                  fontSize: '1.35rem',
                  color: '#1F1B1A',
                  cursor: 'pointer'
                }}
              >
                0
              </button>

              {/* Backspace */}
              <button
                type="button"
                onClick={handleNumpadBackspace}
                style={{
                  height: '54px',
                  borderRadius: '14px',
                  border: '1px solid #EAE0DE',
                  background: '#F6ECEA',
                  color: '#BA1A1A',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <Icon name="backspace" size={22} />
              </button>
            </div>

            {/* Direct Login Button on Numpad for Mobile */}
            <button
              type="button"
              onClick={handleSubmit}
              style={{
                width: '100%',
                marginTop: '14px',
                padding: '13px',
                borderRadius: '12px',
                background: '#9D4124',
                color: '#FFFFFF',
                border: 'none',
                fontWeight: 900,
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(157, 65, 36, 0.28)'
              }}
            >
              <Icon name="login" size={18} />
              Vào Ca Làm Việc
            </button>
          </div>
        </div>
      </div>

      {/* Modal Khôi Phục Mã PIN Quản Lý */}
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
                {/* OTP Demo/Test badge */}
                <div style={{ background: '#FFF8F6', border: '1px dashed #9D4124', borderRadius: '12px', padding: '10px 12px', fontSize: '0.78rem', color: '#56423D' }}>
                  <div style={{ fontWeight: 800, color: '#9D4124', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Icon name="key" size={16} />
                    Mã Xác Thực Dự Phòng (Demo/Hội đồng chấm thi):
                  </div>
                  <div>Mã OTP vừa sinh: <b style={{ letterSpacing: '2px', color: '#9D4124', fontSize: '0.9rem' }}>{otpHint || 'Chờ gửi'}</b></div>
                  <div style={{ marginTop: '2px', fontSize: '0.74rem', color: '#89726B' }}>Hoặc dùng Master Recovery Key: <code style={{ fontWeight: 700, color: '#1F1B1A' }}>ROMS-RECOVERY-2026</code></div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#56423D', marginBottom: '4px' }}>
                    Mã Xác Thực OTP (6 Số) Hoặc Master Key
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nhập 6 số OTP hoặc Khóa Master"
                    value={otpOrKey}
                    onChange={(e) => setOtpOrKey(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: '1px solid #EAE0DE',
                      fontSize: '0.9rem',
                      fontWeight: 700,
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

