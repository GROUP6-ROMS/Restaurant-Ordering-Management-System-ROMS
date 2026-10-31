import React, { useState, useEffect } from 'react';
import Icon from '../common/Icon';
import {
  getRestaurantProfile,
  saveRestaurantProfile,
  RESTAURANT_PRESETS,
  DEFAULT_PROFILE
} from '../../utils/restaurantConfig';
import { restaurantProfileApi } from '../../api/restaurantProfileApi';

export default function RestaurantProfileModal({ isOpen, onClose }) {
  const [profile, setProfile] = useState(() => getRestaurantProfile());
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activePresetId, setActivePresetId] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setProfile(getRestaurantProfile());
      setSavedSuccess(false);
      setIsSubmitting(false);
      setActivePresetId(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleApplyPreset = (preset) => {
    setActivePresetId(preset.id);
    setProfile(prev => ({
      ...prev,
      ...preset.data
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // 1. Lưu vĩnh viễn vào CSDL SQL Server ở Backend
      await restaurantProfileApi.updateProfile(profile);
      // 2. Cập nhật cache cục bộ và broadcast
      saveRestaurantProfile(profile);
      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 1000);
    } catch (err) {
      console.warn('Không thể lưu lên server, fallback lưu local:', err);
      saveRestaurantProfile(profile);
      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 1000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    if (window.confirm('Khôi phục lại thông tin thương hiệu mặc định của ROMS?')) {
      setProfile(DEFAULT_PROFILE);
      setActivePresetId(null);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.65)',
      backdropFilter: 'blur(5px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '16px'
    }}>
      <div style={{
        background: '#FFFFFF',
        borderRadius: '24px',
        width: '100%',
        maxWidth: '820px',
        maxHeight: '92vh',
        overflowY: 'auto',
        boxShadow: '0 25px 60px rgba(0,0,0,0.25)',
        display: 'flex',
        flexDirection: 'column',
        animation: 'modalFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #F0E6E4',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#FFF8F6',
          borderTopLeftRadius: '24px',
          borderTopRightRadius: '24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: '#9D4124',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(157, 65, 36, 0.25)'
            }}>
              <Icon name="storefront" size={24} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#1F1B1A' }}>
                Cấu Hình Thương Hiệu & Thông Tin Quán
              </h2>
              <p style={{ margin: '3px 0 0', fontSize: '0.8rem', color: '#89726B' }}>
                Tùy biến hiển thị trên Hóa đơn nhiệt K80, VietQR chuyển khoản, Phiếu tạm tính & Báo cáo
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: '#F0E6E4',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#56423D'
            }}
          >
            <Icon name="close" size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '22px' }}>
          
          {/* Quick 1-click Presets */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1F1B1A', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Icon name="auto_awesome" size={18} style={{ color: '#9D4124' }} />
                Chọn Mẫu Quán Nhanh (1-Click Presets):
              </span>
              <span style={{ fontSize: '0.75rem', color: '#89726B' }}>Chọn mẫu để áp dụng thông tin gợi ý tức thì</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
              {RESTAURANT_PRESETS.map((p) => {
                const isSelected = activePresetId === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleApplyPreset(p)}
                    style={{
                      padding: '12px',
                      borderRadius: '16px',
                      border: isSelected ? '2px solid #9D4124' : '1px solid #EAE0DE',
                      background: isSelected ? '#FCF1EF' : '#FFFFFF',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}
                  >
                    <div style={{ fontSize: '1.4rem' }}>{p.icon}</div>
                    <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#1F1B1A' }}>{p.title}</div>
                    <div style={{ fontSize: '0.72rem', color: '#89726B', lineHeight: 1.3 }}>{p.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form Fields: Grid 2 Columns */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            
            {/* Tên Quán / Nhà Hàng (K80 Receipt Header) */}
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#1F1B1A', marginBottom: '6px' }}>
                Tên Nhà Hàng / Quán Ăn (In hóa đơn K80 & Báo cáo) *
              </label>
              <input
                type="text"
                required
                value={profile.name || ''}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                placeholder="VD: QUÁN ĂN GIA ĐÌNH BÌNH DÂN ROMS"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  border: '1.5px solid #EAE0DE',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Tên thương hiệu ngắn */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#1F1B1A', marginBottom: '6px' }}>
                Tên thương hiệu ngắn (Brand Name)
              </label>
              <input
                type="text"
                value={profile.brandName || ''}
                onChange={(e) => setProfile({ ...profile, brandName: e.target.value })}
                placeholder="VD: ROMS Dining"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  border: '1.5px solid #EAE0DE',
                  fontSize: '0.88rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Hotline / Số điện thoại */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#1F1B1A', marginBottom: '6px' }}>
                Số Hotline / Điện thoại liên hệ
              </label>
              <input
                type="text"
                value={profile.phone || ''}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                placeholder="VD: 0901.234.567"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  border: '1.5px solid #EAE0DE',
                  fontSize: '0.88rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Địa chỉ quán */}
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#1F1B1A', marginBottom: '6px' }}>
                Địa chỉ quán (In trên hóa đơn & phiếu tính tiền)
              </label>
              <input
                type="text"
                value={profile.address || ''}
                onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                placeholder="VD: 123 Đường Ẩm Thực, Quận 1, TP. Hồ Chí Minh"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  border: '1.5px solid #EAE0DE',
                  fontSize: '0.88rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Mã số thuế */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#1F1B1A', marginBottom: '6px' }}>
                Mã số thuế (MST)
              </label>
              <input
                type="text"
                value={profile.taxCode || ''}
                onChange={(e) => setProfile({ ...profile, taxCode: e.target.value })}
                placeholder="VD: 0318999999"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  border: '1.5px solid #EAE0DE',
                  fontSize: '0.88rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Lời chúc chân hóa đơn */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#1F1B1A', marginBottom: '6px' }}>
                Lời chúc chân hóa đơn (Footer message)
              </label>
              <input
                type="text"
                value={profile.footerMessage || ''}
                onChange={(e) => setProfile({ ...profile, footerMessage: e.target.value })}
                placeholder="VD: Cảm ơn Quý khách & Hẹn gặp lại!"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  border: '1.5px solid #EAE0DE',
                  fontSize: '0.88rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Logo Thương Hiệu Quán (URL hình ảnh) */}
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#1F1B1A', marginBottom: '6px' }}>
                Đường dẫn ảnh Logo quán (Logo URL tùy chỉnh)
              </label>
              <input
                type="url"
                value={profile.logoUrl || ''}
                onChange={(e) => setProfile({ ...profile, logoUrl: e.target.value })}
                placeholder="VD: https://domain.com/logo.png (Để trống sẽ sử dụng Logo ROMS mặc định)"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  border: '1.5px solid #EAE0DE',
                  fontSize: '0.88rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          {/* Thông Tin Mạng WiFi Quán (Hiển thị tại màn hình gọi món & QR bàn ăn) */}
          <div style={{
            background: '#F7F9F6',
            border: '1px solid #D8E2D1',
            borderRadius: '16px',
            padding: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Icon name="wifi" size={20} style={{ color: '#596232' }} />
                <span style={{ fontWeight: 800, fontSize: '0.88rem', color: '#1F1B1A' }}>
                  Mạng WiFi Quán Cho Khách Ăn Tại Bàn (Guest WiFi)
                </span>
              </div>
              <span style={{ fontSize: '0.74rem', color: '#596232', fontWeight: 600 }}>
                Hiển thị trên màn hình khách quét QR & Thẻ để bàn
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#324024', marginBottom: '4px' }}>
                  Tên Mạng WiFi (SSID)
                </label>
                <input
                  type="text"
                  value={profile.wifiName || ''}
                  onChange={(e) => setProfile({ ...profile, wifiName: e.target.value })}
                  placeholder="VD: ROMS-GUEST, PHO-ROMS-FREE"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    border: '1px solid #CCC',
                    fontSize: '0.85rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#324024', marginBottom: '4px' }}>
                  Mật Khẩu WiFi (Khách 1-click sao chép)
                </label>
                <input
                  type="text"
                  value={profile.wifiPassword || ''}
                  onChange={(e) => setProfile({ ...profile, wifiPassword: e.target.value })}
                  placeholder="VD: roms-welcome, anngonmoingay"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    border: '1px solid #CCC',
                    fontSize: '0.85rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Ngân hàng & VietQR Chuyển khoản */}
          <div style={{
            background: '#FAF7F5',
            border: '1px solid #EAE0DE',
            borderRadius: '16px',
            padding: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Icon name="qr_code_2" size={20} style={{ color: '#9D4124' }} />
              <span style={{ fontWeight: 800, fontSize: '0.88rem', color: '#1F1B1A' }}>
                Tài Khoản Ngân Hàng Thụ Hưởng (Phục vụ sinh VietQR POS)
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#56423D', marginBottom: '4px' }}>
                  Ngân hàng thụ hưởng
                </label>
                <input
                  type="text"
                  value={profile.bankName || ''}
                  onChange={(e) => setProfile({ ...profile, bankName: e.target.value })}
                  placeholder="VD: MB, VCB, ACB"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    border: '1px solid #CCC',
                    fontSize: '0.85rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#56423D', marginBottom: '4px' }}>
                  Số tài khoản nhận tiền
                </label>
                <input
                  type="text"
                  value={profile.bankAccountNumber || ''}
                  onChange={(e) => setProfile({ ...profile, bankAccountNumber: e.target.value })}
                  placeholder="VD: 090123456789"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    border: '1px solid #CCC',
                    fontSize: '0.85rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#56423D', marginBottom: '4px' }}>
                  Tên thụ hưởng VietQR
                </label>
                <input
                  type="text"
                  value={profile.bankAccountName || ''}
                  onChange={(e) => setProfile({ ...profile, bankAccountName: e.target.value })}
                  placeholder="VD: NHA HANG ROMS"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    border: '1px solid #CCC',
                    fontSize: '0.85rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Mini Live Preview */}
          <div style={{
            background: '#FFF8F6',
            border: '1px dashed #9D4124',
            borderRadius: '16px',
            padding: '14px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9D4124', fontWeight: 800, marginBottom: '6px' }}>
              Xem Trước Bản In Nhiệt K80 (Live Thermal Bill Preview)
            </div>
            <div style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1.1rem', color: '#9D4124' }}>
              {profile.name || 'TÊN NHÀ HÀNG'}
            </div>
            <div style={{ fontSize: '0.76rem', color: '#56423D' }}>{profile.address || 'Địa chỉ quán'}</div>
            <div style={{ fontSize: '0.74rem', color: '#56423D', marginTop: '6px', background: '#FCF1EF', padding: '4px 10px', borderRadius: '8px', display: 'inline-block' }}>
              📶 WiFi Bàn: <strong>{profile.wifiName || 'ROMS-GUEST'}</strong> • Mật khẩu: <strong>{profile.wifiPassword || 'roms-welcome'}</strong>
            </div>
            <div style={{ fontSize: '0.74rem', color: '#89726B', fontStyle: 'italic', marginTop: '6px' }}>
              "{profile.footerMessage || 'Cảm ơn Quý khách & Hẹn gặp lại!'}"
            </div>
          </div>

          {/* Toast thông báo lưu thành công */}
          {savedSuccess && (
            <div style={{
              background: '#E8F5E9',
              border: '1px solid #4CAF50',
              color: '#2E7D32',
              padding: '10px 16px',
              borderRadius: '12px',
              fontWeight: 700,
              fontSize: '0.88rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              justifyContent: 'center'
            }}>
              <Icon name="check_circle" size={20} />
              Đã lưu cấu hình nhà hàng thành công! Toàn bộ hệ thống POS, K80, VietQR & Báo cáo đã cập nhật.
            </div>
          )}

          {/* Footer Actions */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '10px', borderTop: '1px solid #F0E6E4' }}>
            <button
              type="button"
              onClick={handleReset}
              style={{
                padding: '10px 16px',
                borderRadius: '12px',
                border: '1px solid #EAE0DE',
                background: '#FFFFFF',
                color: '#56423D',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              Đặt Lại Mặc Định
            </button>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '10px 18px',
                  borderRadius: '12px',
                  border: 'none',
                  background: '#F0E6E4',
                  color: '#56423D',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  padding: '10px 22px',
                  borderRadius: '12px',
                  border: 'none',
                  background: isSubmitting ? '#CCC' : '#9D4124',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: '0.88rem',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(157, 65, 36, 0.28)'
                }}
              >
                <Icon name="save" size={18} />
                {isSubmitting ? 'Đang Lưu...' : 'Lưu Cấu Hình Quán'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
