/**
 * Quản lý Cấu hình Thông tin Nhà hàng / Quán ăn động (Versatile Restaurant Profile)
 * Đồng bộ hai chiều thời gian thực giữa CSDL SQL Server (Backend REST API + WebSocket) và Trình duyệt
 */

import { useState, useEffect } from 'react';
import { restaurantProfileApi } from '../api/restaurantProfileApi';
import { subscribeRealtimeEvents } from './realtimeSync';

const STORAGE_KEY = 'roms_restaurant_profile';

export const DEFAULT_PROFILE = {
  name: 'HỆ THỐNG NHÀ HÀNG & QUÁN ĂN ROMS',
  brandName: 'ROMS Dining & POS',
  tagline: 'Phục vụ tận tâm • Món ngon chuẩn vị • Vận hành thông minh',
  address: 'Số 123 Đường Ẩm Thực, Quận 1, TP. Hồ Chí Minh',
  phone: '0901.234.567',
  taxCode: '0318999999',
  wifiName: 'ROMS-GUEST',
  wifiPassword: 'roms-welcome',
  footerMessage: 'Cảm ơn Quý khách & Hẹn gặp lại!',
  logoUrl: '',
  bankAccountName: 'NGO VIET BAO HUY',
  bankName: 'MBBank',
  bankAccountNumber: '0905982428',
  bankBin: '970422',
};

export const RESTAURANT_PRESETS = [
  {
    id: 'binh_dan',
    title: 'Quán Ăn Bình Dân / Phở & Cơm Tấm',
    icon: '🍜',
    desc: 'Phù hợp quán phở, bún chả, cơm tấm, quán ăn gia đình thường nhật',
    data: {
      name: 'QUÁN PHỞ GIA TRUYỀN & CƠM TẤM ROMS',
      brandName: 'Phở & Cơm Tấm ROMS',
      tagline: 'Ngon chuẩn vị truyền thống • Giá cả bình dân • Đậm đà bản sắc',
      address: '45 Đường Nguyễn Tri Phương, Quận 5, TP. Hồ Chí Minh',
      phone: '0903.111.222',
      taxCode: '0315888999',
      wifiName: 'PHO-ROMS-FREE',
      wifiPassword: 'anngonmoingay',
      footerMessage: 'Kính chúc Quý khách ngon miệng và tràn đầy năng lượng!',
      logoUrl: '',
      bankAccountName: 'NGO VIET BAO HUY',
      bankName: 'MBBank',
      bankAccountNumber: '0905982428',
      bankBin: '970422',
    }
  },
  {
    id: 'lau_nuong',
    title: 'Quán Lẩu Nướng / BBQ & Quán Nhậu',
    icon: '🍲',
    desc: 'Phù hợp quán lẩu Thái, nướng không khói, hải sản, tụ họp bạn bè',
    data: {
      name: 'ROMS BBQ & HOTPOT - LẨU NƯỚNG KHÔNG KHÓI',
      brandName: 'ROMS BBQ & Hotpot',
      tagline: 'Lẩu đậm đà • Nướng thơm lừng • Bàn tiệc rôm rả',
      address: '88 Đường Phan Xích Long, Phú Nhuận, TP. Hồ Chí Minh',
      phone: '0908.333.444',
      taxCode: '0316777888',
      wifiName: 'ROMS-BBQ-5G',
      wifiPassword: 'launuongthomngon',
      footerMessage: 'Cảm ơn Quý khách đã quây quần cùng ROMS BBQ!',
      logoUrl: '',
      bankAccountName: 'NGO VIET BAO HUY',
      bankName: 'MBBank',
      bankAccountNumber: '0905982428',
      bankBin: '970422',
    }
  },
  {
    id: 'cafe_tra_sua',
    title: 'Quán Cafe & Trà Sữa / Bakery',
    icon: '☕',
    desc: 'Phù hợp quán cafe, trà sữa, thức uống giải khát & bánh ngọt take-away',
    data: {
      name: 'ROMS COFFEE & TEA HOUSE',
      brandName: 'ROMS Coffee & Tea',
      tagline: 'Cà phê nguyên chất • Trà trái cây tươi mát • Không gian thư giãn',
      address: '12 Đường Lê Lợi, Bến Nghé, Quận 1, TP. Hồ Chí Minh',
      phone: '0909.555.666',
      taxCode: '0317666555',
      wifiName: 'ROMS-Coffee-FreeWifi',
      wifiPassword: 'coffeeandtea',
      footerMessage: 'Chúc Quý khách một ngày tuyệt vời & Hẹn gặp lại!',
      logoUrl: '',
      bankAccountName: 'NGO VIET BAO HUY',
      bankName: 'MBBank',
      bankAccountNumber: '0905982428',
      bankBin: '970422',
    }
  },
  {
    id: 'nha_hang',
    title: 'Nhà Hàng Ẩm Thực Đa Phong Cách',
    icon: '🍷',
    desc: 'Phù hợp nhà hàng gia đình, ẩm thực vùng miền, tiệc liên hoan & sự kiện',
    data: {
      name: 'HỆ THỐNG NHÀ HÀNG ẨM THỰC ROMS',
      brandName: 'ROMS Restaurant & Lounge',
      tagline: 'Tinh hoa ẩm thực phong phú • Không gian ấm cúng & chuyên nghiệp',
      address: 'Số 123 Đường Ẩm Thực, Quận 1, TP. Hồ Chí Minh',
      phone: '0901.234.567',
      taxCode: '0318999999',
      wifiName: 'ROMS-GUEST',
      wifiPassword: 'roms-welcome',
      footerMessage: 'Cảm ơn Quý khách & Hẹn gặp lại!',
      logoUrl: '',
      bankAccountName: 'NGO VIET BAO HUY',
      bankName: 'MBBank',
      bankAccountNumber: '0905982428',
      bankBin: '970422',
    }
  }
];

export const getRestaurantProfile = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return { ...DEFAULT_PROFILE, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.warn('Lỗi đọc cấu hình nhà hàng cục bộ:', e);
  }
  return DEFAULT_PROFILE;
};

export const saveRestaurantProfile = (newProfile) => {
  try {
    const updated = { ...DEFAULT_PROFILE, ...newProfile };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('roms_restaurant_profile_changed', { detail: updated }));
    return updated;
  } catch (e) {
    console.error('Lỗi lưu cấu hình nhà hàng cục bộ:', e);
    return DEFAULT_PROFILE;
  }
};

/**
 * Hook phản ứng tự động lấy thông tin từ Backend CSDL và cập nhật Realtime đa thiết bị
 */
export const useRestaurantProfile = () => {
  const [profile, setProfile] = useState(() => getRestaurantProfile());

  useEffect(() => {
    // 1. Tải cấu hình mới nhất từ Backend (SQL Server)
    const fetchLatestProfile = async () => {
      try {
        const res = await restaurantProfileApi.getProfile();
        if (res && res.data) {
          const remoteProfile = { ...DEFAULT_PROFILE, ...res.data };
          setProfile(remoteProfile);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(remoteProfile));
        }
      } catch (err) {
        // Giữ fallback từ localStorage / DEFAULT_PROFILE
        console.warn('[Restaurant Profile] Dùng cấu hình dự phòng offline:', err.message);
      }
    };

    fetchLatestProfile();

    // 2. Lắng nghe thay đổi cục bộ (cùng tab hoặc giữa các tab trình duyệt)
    const handleProfileChange = (e) => {
      if (e?.detail) {
        setProfile(e.detail);
      } else {
        setProfile(getRestaurantProfile());
      }
    };

    window.addEventListener('roms_restaurant_profile_changed', handleProfileChange);
    window.addEventListener('storage', handleProfileChange);

    // 3. Lắng nghe sự kiện WebSocket thời gian thực từ Backend khi Quản lý lưu
    const unsubscribeWs = subscribeRealtimeEvents((event) => {
      if (event?.type === 'RESTAURANT_PROFILE_UPDATE' && event.payload) {
        const updated = { ...DEFAULT_PROFILE, ...event.payload };
        setProfile(updated);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      }
    });

    return () => {
      window.removeEventListener('roms_restaurant_profile_changed', handleProfileChange);
      window.removeEventListener('storage', handleProfileChange);
      if (typeof unsubscribeWs === 'function') {
        unsubscribeWs();
      }
    };
  }, []);

  return profile;
};
