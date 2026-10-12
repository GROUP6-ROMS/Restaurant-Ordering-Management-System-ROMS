import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth, getRoleHome } from '../../context/AuthContext';
import Icon from '../../components/common/Icon';
import RomsLogo from '../../components/common/RomsLogo';

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


  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #2D1612 0%, #1A0D0A 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      boxSizing: 'border-box'
    }}>
      <div style={{
        background: '#FFFFFF',
        borderRadius: '28px',
        maxWidth: '960px',
        width: '100%',
        boxShadow: '0 25px 60px -15px rgba(0,0,0,0.5)',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        overflow: 'hidden'
      }}>
        {/* Left Side: Employee ID, PIN, Preset Chips */}
        <div style={{ padding: '36px 32px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            {/* Header with Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
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

            <h2 style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 900, fontSize: '1.6rem', color: '#1F1B1A', margin: '0 0 6px' }}>
              Đăng Nhập Ca Làm Việc
            </h2>
            <p style={{ margin: '0 0 20px', fontSize: '0.85rem', color: '#89726B' }}>
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
            <div style={{ marginBottom: '20px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#56423D', display: 'block', marginBottom: '8px' }}>
                Chọn Nhanh Ca / Vị Trí Trực (Demo):
              </span>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {PRESET_ACCOUNTS.map(p => {
                  const isSelected = employeeCode === p.code;
                  return (
                    <button
                      key={p.role}
                      type="button"
                      onClick={() => handleSelectPreset(p)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '10px',
                        border: isSelected ? `2px solid ${p.color}` : '1px solid #EAE0DE',
                        background: isSelected ? '#FFF8F6' : '#FFFFFF',
                        color: isSelected ? p.color : '#56423D',
                        fontWeight: 800,
                        fontSize: '0.75rem',
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
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#56423D', marginBottom: '6px' }}>
                  Mã PIN Ca Trực (6 Số)
                </label>
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
            </form>
          </div>

          <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #F0E6E4', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Link to="/" style={{ fontSize: '0.8rem', color: '#89726B', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
              <Icon name="arrow_back" size={16} />
              Quay lại Trang Chủ
            </Link>
            <span style={{ fontSize: '0.75rem', color: '#89726B' }}>
              ROMS v2.4 Enterprise
            </span>
          </div>
        </div>

        {/* Right Side: Touchscreen Numpad for Fast POS/Tablet Access */}
        <div style={{
          background: '#FCF1EF',
          padding: '36px 32px',
          borderLeft: '1px solid #F0E6E4',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <div style={{ width: '100%', maxWidth: '300px' }}>
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#9D4124', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Bàn Phím Số Cảm Ứng (Touch Numpad)
              </span>
              <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: '#56423D' }}>
                Đang nhập cho: <b>{activeField === 'pin' ? 'MÃ PIN' : 'MÃ NHÂN VIÊN'}</b>
              </p>
            </div>

            {/* PIN Dots Preview */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '12px',
              margin: '0 auto 20px',
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
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '12px'
            }}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleNumpadPress(num.toString())}
                  style={{
                    height: '56px',
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
                  height: '56px',
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
                  height: '56px',
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
                  height: '56px',
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
          </div>
        </div>
      </div>
    </div>
  );
}
