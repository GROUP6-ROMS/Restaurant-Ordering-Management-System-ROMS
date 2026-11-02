import React, { useState, useEffect, useMemo, useRef } from 'react';
import Icon from '../../components/common/Icon';
import { menuApi } from '../../api/menuApi';
import { useDialog } from '../../context/DialogContext';

// Hàm loại bỏ dấu tiếng Việt chuẩn quốc tế (VD: "Bò Wagyu" -> "bo wagyu")
const removeVietnameseTones = (str) => {
  if (!str) return '';
  return str
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Bỏ các dấu thanh huyền, sắc, hỏi, ngã, nặng
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
};
export default function MenuManagementPage() {
  // Dữ liệu từ Backend CSDL
  const [dishes, setDishes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [summary, setSummary] = useState({
    totalDishes: 0,
    activeDishes: 0,
    pausedDishes: 0,
    averageMarginPercent: 0
  });

  // Trạng thái tải dữ liệu
  const [loading, setLoading] = useState(true);
  const [savingItem, setSavingItem] = useState(false);

  // Món đang được chọn để cấu hình trên panel bên phải
  const [selectedDishId, setSelectedDishId] = useState(null);

  // Bộ lọc
  const [activeCategoryFilter, setActiveCategoryFilter] = useState('ALL');
  const [selectedStationFilter, setSelectedStationFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showAddDishModal, setShowAddDishModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // State Modal Quản lý danh mục
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [catActionLoading, setCatActionLoading] = useState(false);

  // Form thêm món mới
  const [newDish, setNewDish] = useState({
    name: '',
    sku: '',
    categoryId: '',
    station: 'KITCHEN',
    price: 85000,
    costPrice: 30000,
    tag: 'Món Mới',
    description: '',
    imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500'
  });

  const { showConfirm, showAlert, showToast: globalShowToast } = useDialog();

  // Hiển thị thông báo Toast
  const showToast = (msg, type = 'success') => {
    globalShowToast(msg, type);
    setToastMessage(typeof msg === 'string' ? msg : msg?.message);
    setTimeout(() => setToastMessage(null), 3200);
  };

  // Quản lý tải lên hình ảnh từ thiết bị
  const editFileInputRef = useRef(null);
  const addFileInputRef = useRef(null);
  const [isUploadingEditImage, setIsUploadingEditImage] = useState(false);
  const [isUploadingAddImage, setIsUploadingAddImage] = useState(false);
  const [isCustomUrlMode, setIsCustomUrlMode] = useState(false);
  const [isCustomAddUrlMode, setIsCustomAddUrlMode] = useState(false);

  // Xử lý upload ảnh cho món đang chọn sửa
  const handleUploadSelectedDishImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showAlert({
        title: 'Định dạng không hợp lệ',
        message: 'Vui lòng chọn file hình ảnh (JPG, PNG, WEBP, GIF)!',
        type: 'warning'
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showAlert({
        title: 'File quá lớn',
        message: 'Dung lượng ảnh tối đa là 5MB. Vui lòng chọn ảnh nhỏ hơn!',
        type: 'warning'
      });
      return;
    }

    try {
      setIsUploadingEditImage(true);
      const res = await menuApi.uploadDishImage(file);
      if (res.data?.data?.imageUrl) {
        handleUpdateSelectedDishField('imageUrl', res.data.data.imageUrl);
        showToast('Tải ảnh món ăn lên thành công!');
      }
    } catch (err) {
      console.error('Lỗi khi tải ảnh lên:', err);
      const errMsg = err.response?.data?.message || 'Không thể tải ảnh lên máy chủ. Vui lòng thử lại!';
      showAlert({
        title: 'Lỗi tải ảnh',
        message: errMsg,
        type: 'error'
      });
    } finally {
      setIsUploadingEditImage(false);
      if (editFileInputRef.current) editFileInputRef.current.value = '';
    }
  };

  // Xử lý upload ảnh cho món ăn mới trong Modal
  const handleUploadNewDishImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showAlert({
        title: 'Định dạng không hợp lệ',
        message: 'Vui lòng chọn file hình ảnh (JPG, PNG, WEBP, GIF)!',
        type: 'warning'
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showAlert({
        title: 'File quá lớn',
        message: 'Dung lượng ảnh tối đa là 5MB. Vui lòng chọn ảnh nhỏ hơn!',
        type: 'warning'
      });
      return;
    }

    try {
      setIsUploadingAddImage(true);
      const res = await menuApi.uploadDishImage(file);
      if (res.data?.data?.imageUrl) {
        setNewDish(prev => ({ ...prev, imageUrl: res.data.data.imageUrl }));
        showToast('Tải ảnh món mới lên thành công!');
      }
    } catch (err) {
      console.error('Lỗi khi tải ảnh lên:', err);
      const errMsg = err.response?.data?.message || 'Không thể tải ảnh lên máy chủ. Vui lòng thử lại!';
      showAlert({
        title: 'Lỗi tải ảnh',
        message: errMsg,
        type: 'error'
      });
    } finally {
      setIsUploadingAddImage(false);
      if (addFileInputRef.current) addFileInputRef.current.value = '';
    }
  };

  // 1. Tải toàn bộ dữ liệu ban đầu từ Backend
  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [sumRes, catRes, itemsRes] = await Promise.all([
        menuApi.getSummary(),
        menuApi.getCategories(),
        menuApi.getItems()
      ]);

      if (sumRes.data?.data) setSummary(sumRes.data.data);
      if (catRes.data?.data) {
        setCategories(catRes.data.data);
        if (catRes.data.data.length > 0 && !newDish.categoryId) {
          setNewDish(prev => ({ ...prev, categoryId: catRes.data.data[0].id }));
        }
      }
      if (itemsRes.data?.data) {
        const list = itemsRes.data.data;
        setDishes(list);
        if (list.length > 0 && !selectedDishId) {
          setSelectedDishId(list[0].id);
        }
      }
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu thực đơn:', err);
      showToast('Không thể kết nối đến máy chủ Backend!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Món đang chọn hiển thị trên panel chi tiết
  const selectedDish = useMemo(() => {
    return dishes.find(d => d.id === selectedDishId) || dishes[0] || null;
  }, [dishes, selectedDishId]);

  // Cập nhật giá trị các trường trong panel chi tiết món đang chọn
  const handleUpdateSelectedDishField = (field, value) => {
    if (!selectedDish) return;
    setDishes(prev => prev.map(d => d.id === selectedDish.id ? { ...d, [field]: value } : d));
  };

  // 2. Lưu cấu hình món ăn về Backend CSDL
  const handleSaveSelectedDish = async () => {
    if (!selectedDish) return;
    setSavingItem(true);
    try {
      const payload = {
        name: selectedDish.name,
        sku: selectedDish.sku,
        categoryId: selectedDish.categoryId,
        price: selectedDish.price,
        costPrice: selectedDish.costPrice,
        station: selectedDish.station,
        tag: selectedDish.tag,
        description: selectedDish.description,
        imageUrl: selectedDish.imageUrl,
        isAvailable: selectedDish.isAvailable
      };

      const res = await menuApi.updateItem(selectedDish.id, payload);
      if (res.data?.data) {
        const updated = res.data.data;
        setDishes(prev => prev.map(d => d.id === updated.id ? updated : d));
        // Cập nhật lại số liệu KPI
        const sumRes = await menuApi.getSummary();
        if (sumRes.data?.data) setSummary(sumRes.data.data);
        showToast(`Đã lưu cấu hình món [${updated.name}] thành công!`);
      }
    } catch (err) {
      console.error('Lỗi khi lưu món ăn:', err);
      showToast(err.response?.data?.message || 'Có lỗi khi lưu cấu hình món ăn!');
    } finally {
      setSavingItem(false);
    }
  };

  // 3. Toggle trạng thái Hết món (86'd)
  const handleToggleAvailable = async (dishId) => {
    try {
      const res = await menuApi.toggleAvailability(dishId);
      if (res.data?.data) {
        const updated = res.data.data;
        setDishes(prev => prev.map(d => d.id === updated.id ? updated : d));
        // Cập nhật KPI
        const sumRes = await menuApi.getSummary();
        if (sumRes.data?.data) setSummary(sumRes.data.data);
        showToast(`Đã chuyển [${updated.name}] sang: ${updated.isAvailable ? 'ĐANG BÁN' : 'TẠM HẾT (86d)'}!`);
      }
    } catch (err) {
      console.error('Lỗi khi đổi trạng thái món:', err);
      showToast('Không thể cập nhật trạng thái món ăn!');
    }
  };

  // 4. Tạo món ăn mới
  const handleCreateDish = async () => {
    if (!newDish.name.trim() || !newDish.sku.trim()) {
      showAlert({
        title: 'Thiếu thông tin món ăn',
        message: 'Vui lòng nhập đầy đủ tên món ăn và mã SKU!',
        type: 'warning'
      });
      return;
    }
    try {
      const res = await menuApi.createItem(newDish);
      if (res.data?.data) {
        const created = res.data.data;
        setDishes(prev => [created, ...prev]);
        setSelectedDishId(created.id);
        setShowAddDishModal(false);
        // Reset form
        setNewDish({
          name: '',
          sku: '',
          categoryId: categories[0]?.id || '',
          station: 'KITCHEN',
          price: 85000,
          costPrice: 30000,
          tag: 'Món Mới',
          description: '',
          imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500'
        });
        // Cập nhật KPI & Danh mục
        const [sumRes, catRes] = await Promise.all([menuApi.getSummary(), menuApi.getCategories()]);
        if (sumRes.data?.data) setSummary(sumRes.data.data);
        if (catRes.data?.data) setCategories(catRes.data.data);
        showToast(`Đã tạo mới món ăn [${created.name}] thành công!`, 'success');
      }
    } catch (err) {
      console.error('Lỗi khi thêm món:', err);
      showAlert({
        title: 'Lỗi tạo món ăn',
        message: err.response?.data?.message || 'Có lỗi xảy ra khi tạo món ăn!',
        type: 'error'
      });
    }
  };

  // 4b. Xóa món ăn khỏi thực đơn
  const handleDeleteDish = async (dishId, dishName) => {
    const targetName = dishName || selectedDish?.name || 'món ăn này';

    // Hộp thoại xác nhận an toàn trực tiếp trên UI
    const confirmed = await showConfirm({
      title: 'Xác nhận xóa món ăn',
      message: `Bạn có chắc chắn muốn xóa món [${targetName}] khỏi thực đơn không?\nMón này sẽ không hiển thị trên Thực đơn gọi món của khách nữa.`,
      confirmText: 'Xóa món',
      type: 'danger'
    });
    if (!confirmed) return;

    try {
      // 1. Gọi API Backend xóa món (Soft Delete)
      await menuApi.deleteItem(dishId);

      // 2. Loại bỏ món vừa xóa khỏi danh sách trên màn hình
      const remainingDishes = dishes.filter(d => d.id !== dishId);
      setDishes(remainingDishes);

      // 3. Nếu món đang chọn trên panel bên phải là món vừa bị xóa -> chọn món đầu tiên còn lại
      if (selectedDishId === dishId) {
        setSelectedDishId(remainingDishes.length > 0 ? remainingDishes[0].id : null);
      }

      // 4. Đồng bộ lại 3 thẻ KPI và số lượng món trong danh mục
      const [sumRes, catRes] = await Promise.all([
        menuApi.getSummary(),
        menuApi.getCategories()
      ]);
      if (sumRes.data?.data) setSummary(sumRes.data.data);
      if (catRes.data?.data) setCategories(catRes.data.data);

      showToast(`Đã xóa món [${targetName}] khỏi thực đơn thành công!`, 'success');
    } catch (err) {
      console.error('Lỗi khi xóa món ăn:', err);
      showAlert({
        title: 'Lỗi xóa món ăn',
        message: err.response?.data?.message || 'Có lỗi xảy ra khi xóa món ăn!',
        type: 'error'
      });
    }
  };

  // 5. Thêm danh mục mới
  const handleCreateCategory = async () => {
    if (!newCatName.trim()) {
      showAlert({
        title: 'Thiếu tên danh mục',
        message: 'Vui lòng nhập tên danh mục!',
        type: 'warning'
      });
      return;
    }
    setCatActionLoading(true);
    try {
      const res = await menuApi.createCategory({ name: newCatName.trim(), description: newCatDesc.trim() });
      if (res.data?.data) {
        setCategories(prev => [...prev, res.data.data]);
        setNewCatName('');
        setNewCatDesc('');
        showToast('Thêm danh mục mới thành công!', 'success');
      }
    } catch (err) {
      console.error('Lỗi khi tạo danh mục:', err);
      showAlert({
        title: 'Lỗi tạo danh mục',
        message: err.response?.data?.message || 'Không thể tạo danh mục!',
        type: 'error'
      });
    } finally {
      setCatActionLoading(false);
    }
  };

  // 6. Xóa danh mục
  const handleDeleteCategory = async (catId) => {
    const confirmed = await showConfirm({
      title: 'Xóa nhóm danh mục',
      message: 'Bạn có chắc chắn muốn xóa nhóm danh mục này không?',
      confirmText: 'Xóa danh mục',
      type: 'danger'
    });
    if (!confirmed) return;

    try {
      await menuApi.deleteCategory(catId);
      setCategories(prev => prev.filter(c => c.id !== catId));
      showToast('Đã xóa danh mục thành công!', 'success');
    } catch (err) {
      showAlert({
        title: 'Lỗi xóa danh mục',
        message: err.response?.data?.message || 'Không thể xóa danh mục!',
        type: 'error'
      });
    }
  };



  // Lọc danh sách món ăn hiển thị bên trái (Tìm kiếm thông minh chuẩn xác 100%)
  const filteredDishes = useMemo(() => {
    const cleanSearch = removeVietnameseTones(searchQuery);

    return dishes.filter(d => {
      // 1. Tìm kiếm theo từ khóa
      if (cleanSearch) {
        const dishNameNormalized = removeVietnameseTones(d.name || '');
        const dishSkuNormalized = removeVietnameseTones(d.sku || '');

        let matchKeyword = false;

        // Nếu chỉ gõ 1 ký tự: BẮT BUỘC Tên món hoặc SKU phải BẮT ĐẦU bằng chữ cái đó
        if (cleanSearch.length === 1) {
          matchKeyword = dishNameNormalized.startsWith(cleanSearch) ||
            dishSkuNormalized.startsWith(cleanSearch);
        } else {
          // Khi gõ từ 2 ký tự trở lên: Tìm kiếm linh hoạt xuất hiện trong Tên hoặc SKU
          matchKeyword = dishNameNormalized.includes(cleanSearch) ||
            dishSkuNormalized.includes(cleanSearch);
        }

        if (!matchKeyword) return false;
      }

      // 2. Lọc theo danh mục
      if (activeCategoryFilter !== 'ALL' && d.categoryId !== activeCategoryFilter) return false;

      // 3. Lọc theo trạm xử lý
      if (selectedStationFilter !== 'ALL' && d.station !== selectedStationFilter) return false;

      return true;
    });
  }, [dishes, searchQuery, activeCategoryFilter, selectedStationFilter]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '16px' }}>
        <Icon name="sync" size={40} style={{ color: '#9D4124', animation: 'spin 1s linear infinite' }} />
        <span style={{ fontSize: '1rem', color: '#89726B', fontWeight: 600 }}>Đang kết nối CSDL và tải danh mục thực đơn...</span>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1360px', margin: '0 auto', paddingBottom: '40px' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '80px',
          right: '24px',
          zIndex: 9999,
          background: '#1F1B1A',
          color: '#FFF8F6',
          padding: '12px 20px',
          borderRadius: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
          animation: 'slideDown 0.25s ease-out'
        }}>
          <Icon name="check_circle" size={20} fill={1} style={{ color: '#FFB68C' }} />
          <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{toastMessage}</span>
        </div>
      )}

      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#89726B', marginBottom: '4px' }}>
            <span>ROMS Suite</span>
            <Icon name="chevron_right" size={14} />
            <span>Vận Hành FOH & BOH</span>
            <Icon name="chevron_right" size={14} />
            <span style={{ color: '#9D4124', fontWeight: 700 }}>Quản Lý Thực Đơn & Món Ăn</span>
          </div>
          <h1 style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1.9rem', color: '#1F1B1A', margin: 0 }}>
            Quản Lý Thực Đơn, Món Ăn & Cấu Hình Định Lượng
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>


          {/* Nút Quản Lý Danh Mục */}
          <button
            type="button"
            onClick={() => setShowCategoryModal(true)}
            style={{
              padding: '9px 16px',
              borderRadius: '10px',
              border: '1px solid #EAE0DE',
              background: '#FFFFFF',
              color: '#56423D',
              fontWeight: 700,
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
          >
            <Icon name="category" size={18} style={{ color: '#9D4124' }} />
            <span>Quản Lý Danh Mục</span>
          </button>

          {/* Nút Thêm Món Ăn Mới */}
          <button
            type="button"
            onClick={() => setShowAddDishModal(true)}
            style={{
              padding: '9px 18px',
              borderRadius: '10px',
              border: 'none',
              background: '#9D4124',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(157, 65, 36, 0.25)'
            }}
          >
            <Icon name="add_circle" size={18} />
            <span>+ Thêm Món Ăn Mới</span>
          </button>
        </div>
      </div>

      {/* 3 Thẻ KPI Thống Kê Vận Hành Thực Tế */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px' }}>
        {/* KPI 1: Đang phục vụ */}
        <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '18px 20px', border: '1px solid #F0E6E4', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#89726B', letterSpacing: '0.04em' }}>
              Món Đang Hoạt Động
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#FFDBC9', color: '#9D4124', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="restaurant" size={18} />
            </div>
          </div>
          <div style={{ marginTop: '10px', display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1.9rem', color: '#9D4124' }}>
              {summary.activeDishes}
            </span>
            <span style={{ fontSize: '0.82rem', color: '#89726B' }}>món đang phục vụ</span>
          </div>
        </div>

        {/* KPI 2: Cảnh báo hết hàng 86'd */}
        <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '18px 20px', border: '1px solid #F0E6E4', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#BA1A1A', letterSpacing: '0.04em' }}>
              Cảnh Báo Hết Hàng (86'd)
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#FFDAD6', color: '#93000A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="block" size={18} />
            </div>
          </div>
          <div style={{ marginTop: '10px', display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1.9rem', color: '#BA1A1A' }}>
              {summary.pausedDishes}
            </span>
            <span style={{ fontSize: '0.82rem', color: '#89726B' }}>món tạm ngưng</span>
          </div>
        </div>

        {/* KPI 3: Biên lợi nhuận gộp trung bình */}
        <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '18px 20px', border: '1px solid #F0E6E4', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#596232', letterSpacing: '0.04em' }}>
              Biên Lợi Nhuận Gộp Trung Bình
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#DDE8AB', color: '#181E00', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="trending_up" size={18} />
            </div>
          </div>
          <div style={{ marginTop: '10px', display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1.9rem', color: '#596232' }}>
              {summary.averageMarginPercent}%
            </span>
            <span style={{ fontSize: '0.82rem', color: '#89726B' }}>trên giá niêm yết</span>
          </div>
        </div>
      </div>

      {/* Bộ Lọc & Tìm Kiếm Đa Tiêu Chí */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: '16px',
        padding: '14px 18px',
        border: '1px solid #F0E6E4',
        marginBottom: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* Ô tìm kiếm theo tên hoặc mã SKU */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: '#FCF1EF',
            borderRadius: '10px',
            padding: '8px 14px',
            flex: '1 1 240px'
          }}>
            <Icon name="search" size={18} style={{ color: '#89726B' }} />
            <input
              type="text"
              placeholder="Tìm theo tên món ăn hoặc mã SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.85rem', width: '100%', color: '#1F1B1A' }}
            />
          </div>

          {/* Chọn Trạm xử lý Bếp hoặc Phục Vụ */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: '#89726B', fontWeight: 600 }}>Trạm xử lý:</span>
            <select
              value={selectedStationFilter}
              onChange={(e) => setSelectedStationFilter(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '10px',
                border: '1px solid #EAE0DE',
                background: '#FCF1EF',
                fontSize: '0.82rem',
                fontWeight: 700,
                color: '#1F1B1A',
                outline: 'none'
              }}
            >
              <option value="ALL">Tất cả các trạm</option>
              <option value="KITCHEN">Bếp (Món nấu tại chỗ)</option>
              <option value="WAITER">Phục Vụ (Đồ uống có sẵn)</option>
            </select>
          </div>
        </div>

        {/* Category Pills nạp động từ CSDL */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingTop: '4px' }}>
          <button
            type="button"
            onClick={() => setActiveCategoryFilter('ALL')}
            style={{
              padding: '7px 14px',
              borderRadius: '9999px',
              border: 'none',
              background: activeCategoryFilter === 'ALL' ? '#9D4124' : '#F6ECEA',
              color: activeCategoryFilter === 'ALL' ? '#FFFFFF' : '#56423D',
              fontWeight: 700,
              fontSize: '0.8rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            Tất Cả ({dishes.length})
          </button>
          {categories.map(cat => {
            const isActive = activeCategoryFilter === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategoryFilter(cat.id)}
                style={{
                  padding: '7px 14px',
                  borderRadius: '9999px',
                  border: 'none',
                  background: isActive ? '#9D4124' : '#F6ECEA',
                  color: isActive ? '#FFFFFF' : '#56423D',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {cat.name} ({cat.dishCount || 0})
              </button>
            );
          })}
        </div>
      </div>

      {/* Khung chia 2 cột: Danh sách món (7 cột) & Panel cấu hình món (5 cột) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '20px', alignItems: 'flex-start' }}>
        {/* Cột Trái: Danh Sách Thẻ Món Ăn (7 Cột) */}
        <div style={{ gridColumn: 'span 7', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1F1B1A' }}>
              Danh Sách Món Ăn ({filteredDishes.length} món)
            </span>
            <span style={{ fontSize: '0.75rem', color: '#89726B' }}>
              Bấm vào thẻ để chỉnh sửa cấu hình
            </span>
          </div>

          {filteredDishes.length === 0 ? (
            <div style={{ background: '#FFFFFF', borderRadius: '16px', padding: '40px', textAlign: 'center', border: '1px dashed #EAE0DE' }}>
              <Icon name="search_off" size={40} style={{ color: '#89726B', marginBottom: '8px' }} />
              <p style={{ margin: 0, fontWeight: 700, color: '#56423D' }}>Không tìm thấy món ăn nào phù hợp với bộ lọc!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filteredDishes.map(dish => {
                const isSelected = selectedDish?.id === dish.id;
                const margin = dish.marginPercent ? Math.round(dish.marginPercent) : 0;

                return (
                  <div
                    key={dish.id}
                    onClick={() => setSelectedDishId(dish.id)}
                    style={{
                      background: '#FFFFFF',
                      borderRadius: '16px',
                      padding: '14px',
                      border: isSelected ? '2px solid #9D4124' : '1px solid #F0E6E4',
                      boxShadow: isSelected ? '0 6px 18px rgba(157, 65, 36, 0.12)' : '0 1px 6px rgba(0,0,0,0.02)',
                      display: 'flex',
                      gap: '14px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <img
                      src={dish.imageUrl || 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500'}
                      alt={dish.name}
                      style={{ width: '84px', height: '84px', borderRadius: '12px', objectFit: 'cover', flexShrink: 0 }}
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500';
                      }}
                    />

                    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontFamily: 'monospace', fontSize: '0.72rem', color: '#89726B', fontWeight: 700 }}>
                              {dish.sku}
                            </span>
                            <span style={{
                              padding: '1px 6px',
                              borderRadius: '4px',
                              background: dish.isAvailable ? '#DDE8AB' : '#FFDAD6',
                              color: dish.isAvailable ? '#181E00' : '#93000A',
                              fontSize: '0.68rem',
                              fontWeight: 700
                            }}>
                              {dish.isAvailable ? 'Đang Bán' : 'Tạm Hết (86d)'}
                            </span>
                            <span style={{ padding: '1px 6px', borderRadius: '4px', background: '#F6ECEA', fontSize: '0.68rem', color: '#56423D' }}>
                              {dish.station === 'WAITER' ? 'Phục Vụ' : 'Bếp'}
                            </span>
                          </div>

                          <span style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1rem', color: '#9D4124' }}>
                            {Number(dish.price).toLocaleString('vi-VN')}₫
                          </span>
                        </div>

                        <h4 style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '0.95rem', color: '#1F1B1A', margin: '4px 0 2px' }}>
                          {dish.name}
                        </h4>
                        <p style={{ margin: 0, fontSize: '0.78rem', color: '#56423D', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {dish.description || 'Chưa có mô tả chi tiết'}
                        </p>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid #F6ECEA', marginTop: '6px' }}>
                        <div style={{ fontSize: '0.72rem', color: '#89726B' }}>
                          Giá vốn: <strong>{Number(dish.costPrice || 0).toLocaleString('vi-VN')}₫</strong> • Lời: <strong style={{ color: '#596232' }}>{margin}%</strong>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleAvailable(dish.id);
                            }}
                            style={{
                              padding: '4px 10px',
                              borderRadius: '6px',
                              border: '1px solid #EAE0DE',
                              background: dish.isAvailable ? '#FFF' : '#FFDAD6',
                              color: dish.isAvailable ? '#56423D' : '#BA1A1A',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            {dish.isAvailable ? 'Ngưng Bán (86)' : 'Kích Hoạt'}
                          </button>

                          {/* DÁN THÊM NÚT THÙNG RÁC XÓA NHANH TẠI ĐÂY: */}
                          <button
                            type="button"
                            title="Xóa món ăn"
                            onClick={(e) => {
                              e.stopPropagation(); // Ngăn sự kiện click chọn thẻ
                              handleDeleteDish(dish.id, dish.name);
                            }}
                            style={{
                              padding: '4px 7px',
                              borderRadius: '6px',
                              border: '1px solid #FFDAD6',
                              background: '#FFF0ED',
                              color: '#BA1A1A',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center'
                            }}
                          >
                            <Icon name="delete" size={15} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Cột Phải: Panel Cấu Hình Chi Tiết Món Ăn (5 Cột - Sticky) */}
        <div style={{ gridColumn: 'span 5', position: 'sticky', top: '84px' }}>
          {selectedDish ? (
            <div style={{
              background: '#FFFFFF',
              borderRadius: '20px',
              padding: '22px',
              border: '1px solid #F0E6E4',
              boxShadow: '0 4px 20px rgba(0,0,0,0.06)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Icon name="tune" size={22} style={{ color: '#9D4124' }} />
                  <h3 style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1.15rem', color: '#1F1B1A', margin: 0 }}>
                    Cấu Hình Món Ăn
                  </h3>
                </div>
                <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#9D4124', fontSize: '0.85rem' }}>
                  {selectedDish.sku}
                </span>
              </div>

              {/* Form chỉnh sửa chi tiết */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '16px' }}>
                {/* Tên món */}
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1F1B1A', display: 'block', marginBottom: '4px' }}>
                    Tên món ăn:
                  </label>
                  <input
                    type="text"
                    value={selectedDish.name}
                    onChange={(e) => handleUpdateSelectedDishField('name', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '10px',
                      border: '1px solid #EAE0DE',
                      background: '#FFFFFF',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      color: '#1F1B1A',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                {/* Danh mục */}
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1F1B1A', display: 'block', marginBottom: '4px' }}>
                    Nhóm danh mục:
                  </label>
                  <select
                    value={selectedDish.categoryId || ''}
                    onChange={(e) => handleUpdateSelectedDishField('categoryId', Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '10px',
                      border: '1px solid #EAE0DE',
                      background: '#FFFFFF',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      color: '#56423D',
                      boxSizing: 'border-box'
                    }}
                  >
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                {/* Giá bán & Giá vốn */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1F1B1A', display: 'block', marginBottom: '4px' }}>
                      Giá bán niêm yết (₫):
                    </label>
                    <input
                      type="number"
                      value={selectedDish.price}
                      onChange={(e) => handleUpdateSelectedDishField('price', parseInt(e.target.value) || 0)}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '10px',
                        border: '1px solid #EAE0DE',
                        background: '#FFFFFF',
                        fontSize: '0.85rem',
                        fontWeight: 800,
                        color: '#9D4124',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1F1B1A', display: 'block', marginBottom: '4px' }}>
                      Giá vốn nguyên liệu (₫):
                    </label>
                    <input
                      type="number"
                      value={selectedDish.costPrice}
                      onChange={(e) => handleUpdateSelectedDishField('costPrice', parseInt(e.target.value) || 0)}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '10px',
                        border: '1px solid #EAE0DE',
                        background: '#FFFFFF',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        color: '#56423D',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                {/* Thẻ tính toán biên lợi nhuận thời gian thực */}
                <div style={{
                  background: '#FCF1EF',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  border: '1px solid #FFDBC9',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '8px'
                }}>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: '#89726B', display: 'block' }}>Lợi nhuận gộp/món:</span>
                    <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#9D4124' }}>
                      {Math.max(0, (selectedDish.price || 0) - (selectedDish.costPrice || 0)).toLocaleString('vi-VN')}₫
                    </span>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: '#89726B', display: 'block' }}>Tỷ suất lợi nhuận:</span>
                    <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#596232' }}>
                      {selectedDish.price > 0
                        ? (((selectedDish.price - selectedDish.costPrice) / selectedDish.price) * 100).toFixed(1)
                        : 0}%
                    </span>
                  </div>
                </div>

                {/* Trạm điều phối KDS */}
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1F1B1A', display: 'block', marginBottom: '4px' }}>
                    Trạm điều phối nhận vé:
                  </label>
                  <select
                    value={selectedDish.station || 'KITCHEN'}
                    onChange={(e) => handleUpdateSelectedDishField('station', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '10px',
                      border: '1px solid #EAE0DE',
                      background: '#FFFFFF',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      color: '#56423D',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="KITCHEN">Bếp (KDS nấu món tại chỗ)</option>
                    <option value="WAITER">Phục Vụ (Đồ uống lon/chai lấy tủ mát)</option>
                  </select>
                </div>

                {/* Ảnh món ăn & Tải lên từ thiết bị */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1F1B1A' }}>
                      Hình ảnh món ăn:
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsCustomUrlMode(!isCustomUrlMode)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#9D4124',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        padding: 0,
                        textDecoration: 'underline'
                      }}
                    >
                      {isCustomUrlMode ? 'Đóng ô URL' : 'Dán link URL'}
                    </button>
                  </div>

                  {/* Khung xem trước và nút tải ảnh từ thiết bị */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 12px',
                    borderRadius: '12px',
                    background: '#FFF8F6',
                    border: '1.5px dashed #FFDBC9'
                  }}>
                    <div style={{
                      position: 'relative',
                      width: '64px',
                      height: '64px',
                      borderRadius: '10px',
                      overflow: 'hidden',
                      background: '#F0E6E4',
                      flexShrink: 0
                    }}>
                      <img
                        src={selectedDish.imageUrl || 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500'}
                        alt={selectedDish.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500';
                        }}
                      />
                      {isUploadingEditImage && (
                        <div style={{
                          position: 'absolute',
                          inset: 0,
                          background: 'rgba(0,0,0,0.5)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#FFF'
                        }}>
                          <Icon name="progress_activity" size={20} className="animate-spin" />
                        </div>
                      )}
                    </div>

                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <input
                        type="file"
                        ref={editFileInputRef}
                        accept="image/png, image/jpeg, image/jpg, image/webp, image/gif"
                        onChange={handleUploadSelectedDishImage}
                        style={{ display: 'none' }}
                      />
                      <button
                        type="button"
                        disabled={isUploadingEditImage}
                        onClick={() => editFileInputRef.current?.click()}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          padding: '7px 12px',
                          borderRadius: '8px',
                          border: 'none',
                          background: isUploadingEditImage ? '#EAE0DE' : '#9D4124',
                          color: '#FFFFFF',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          cursor: isUploadingEditImage ? 'not-allowed' : 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <Icon name="upload" size={16} />
                        <span>{isUploadingEditImage ? 'Đang tải lên...' : 'Tải ảnh từ thiết bị'}</span>
                      </button>
                      <span style={{ fontSize: '0.68rem', color: '#89726B' }}>
                        Hỗ trợ JPG, PNG, WEBP tối đa 5MB
                      </span>
                    </div>
                  </div>

                  {/* Ô nhập URL dự phòng nếu bật toggle */}
                  {isCustomUrlMode && (
                    <div style={{ marginTop: '8px' }}>
                      <input
                        type="text"
                        placeholder="Nhập đường dẫn URL ảnh (https://...)"
                        value={selectedDish.imageUrl || ''}
                        onChange={(e) => handleUpdateSelectedDishField('imageUrl', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          border: '1px solid #EAE0DE',
                          background: '#FFFFFF',
                          fontSize: '0.78rem',
                          color: '#56423D',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Mô tả */}
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1F1B1A', display: 'block', marginBottom: '4px' }}>
                    Mô tả món ăn:
                  </label>
                  <textarea
                    rows={2}
                    value={selectedDish.description || ''}
                    onChange={(e) => handleUpdateSelectedDishField('description', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '10px',
                      border: '1px solid #EAE0DE',
                      background: '#FFFFFF',
                      fontSize: '0.82rem',
                      color: '#56423D',
                      boxSizing: 'border-box',
                      resize: 'none'
                    }}
                  />
                </div>
              </div>

              {/* Nút Lưu Cấu Hình */}
              <button
                type="button"
                disabled={savingItem}
                onClick={handleSaveSelectedDish}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '12px',
                  background: '#9D4124',
                  color: '#FFF',
                  border: 'none',
                  fontFamily: "'Epilogue', sans-serif",
                  fontWeight: 800,
                  fontSize: '0.92rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: savingItem ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 14px rgba(157, 65, 36, 0.25)',
                  opacity: savingItem ? 0.7 : 1
                }}
              >
                <Icon name="save" size={18} />
                <span>{savingItem ? 'Đang lưu vào CSDL...' : 'Lưu Cấu Hình Món Ăn'}</span>
              </button>

              {/* DÁN THÊM NÚT XÓA MÓN NGAY ĐÂY: */}
              <button
                type="button"
                onClick={() => handleDeleteDish(selectedDish.id, selectedDish.name)}
                style={{
                  width: '100%',
                  marginTop: '10px',
                  padding: '10px',
                  borderRadius: '12px',
                  background: '#FFF0ED',
                  color: '#BA1A1A',
                  border: '1px solid #FFDAD6',
                  fontFamily: "'Epilogue', sans-serif",
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#FFDAD6'}
                onMouseLeave={e => e.currentTarget.style.background = '#FFF0ED'}
              >
                <Icon name="delete" size={18} />
                <span>Xóa Món Khỏi Thực Đơn</span>
              </button>

            </div>
          ) : (
            <div style={{ background: '#FFF', padding: '30px', borderRadius: '20px', border: '1px solid #F0E6E4', textAlign: 'center', color: '#89726B' }}>
              Chọn một món ăn bên danh sách để cấu hình
            </div>
          )}
        </div>
      </div>

      {/* MODAL 1: Thêm Món Ăn Mới */}
      {showAddDishModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          background: 'rgba(31, 27, 26, 0.65)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: '#FFFFFF',
            width: '100%',
            maxWidth: '540px',
            borderRadius: '24px',
            padding: '24px',
            boxShadow: '0 12px 36px rgba(0,0,0,0.25)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Icon name="add_circle" size={24} style={{ color: '#9D4124' }} />
                <h3 style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1.2rem', color: '#1F1B1A', margin: 0 }}>
                  Thêm Món Ăn Mới Vào Thực Đơn
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddDishModal(false)}
                style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#F6ECEA', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <Icon name="close" size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
              {/* Tên món */}
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1F1B1A', display: 'block', marginBottom: '4px' }}>
                  Tên món ăn <span style={{ color: '#9D4124' }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Bò Bít Tết Sốt Nấm Truffle"
                  value={newDish.name}
                  onChange={(e) => setNewDish({ ...newDish, name: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #EAE0DE', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              {/* SKU & Trạm xử lý */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1F1B1A', display: 'block', marginBottom: '4px' }}>
                    Mã SKU <span style={{ color: '#9D4124' }}>*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="DISH-008"
                    value={newDish.sku}
                    onChange={(e) => setNewDish({ ...newDish, sku: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #EAE0DE', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1F1B1A', display: 'block', marginBottom: '4px' }}>
                    Trạm xử lý
                  </label>
                  <select
                    value={newDish.station}
                    onChange={(e) => setNewDish({ ...newDish, station: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #EAE0DE', outline: 'none', boxSizing: 'border-box' }}
                  >
                    <option value="KITCHEN">Bếp (KDS nấu tại chỗ)</option>
                    <option value="WAITER">Phục Vụ (Đồ lon/chai sẵn)</option>
                  </select>
                </div>
              </div>

              {/* Danh mục & Tag */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1F1B1A', display: 'block', marginBottom: '4px' }}>
                    Nhóm danh mục <span style={{ color: '#9D4124' }}>*</span>
                  </label>
                  <select
                    value={newDish.categoryId}
                    onChange={(e) => setNewDish({ ...newDish, categoryId: Number(e.target.value) })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #EAE0DE', outline: 'none', boxSizing: 'border-box' }}
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1F1B1A', display: 'block', marginBottom: '4px' }}>
                    Nhãn nổi bật
                  </label>
                  <input
                    type="text"
                    placeholder="Bestseller, Món Mới..."
                    value={newDish.tag}
                    onChange={(e) => setNewDish({ ...newDish, tag: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #EAE0DE', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* Giá bán & Giá vốn */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1F1B1A', display: 'block', marginBottom: '4px' }}>
                    Giá bán niêm yết (VNĐ) <span style={{ color: '#9D4124' }}>*</span>
                  </label>
                  <input
                    type="number"
                    value={newDish.price}
                    onChange={(e) => setNewDish({ ...newDish, price: parseInt(e.target.value) || 0 })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #EAE0DE', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1F1B1A', display: 'block', marginBottom: '4px' }}>
                    Giá vốn Cost (VNĐ) <span style={{ color: '#9D4124' }}>*</span>
                  </label>
                  <input
                    type="number"
                    value={newDish.costPrice}
                    onChange={(e) => setNewDish({ ...newDish, costPrice: parseInt(e.target.value) || 0 })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #EAE0DE', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* Hình ảnh món ăn mới & Tải lên từ thiết bị */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1F1B1A' }}>
                    Hình ảnh món ăn:
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsCustomAddUrlMode(!isCustomAddUrlMode)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#9D4124',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      padding: 0,
                      textDecoration: 'underline'
                    }}
                  >
                    {isCustomAddUrlMode ? 'Đóng ô URL' : 'Dán link URL'}
                  </button>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 12px',
                  borderRadius: '12px',
                  background: '#FFF8F6',
                  border: '1.5px dashed #FFDBC9'
                }}>
                  <div style={{
                    position: 'relative',
                    width: '60px',
                    height: '60px',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    background: '#F0E6E4',
                    flexShrink: 0
                  }}>
                    <img
                      src={newDish.imageUrl || 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500'}
                      alt="Ảnh món mới"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500';
                      }}
                    />
                    {isUploadingAddImage && (
                      <div style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'rgba(0,0,0,0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#FFF'
                      }}>
                        <Icon name="progress_activity" size={20} className="animate-spin" />
                      </div>
                    )}
                  </div>

                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <input
                      type="file"
                      ref={addFileInputRef}
                      accept="image/png, image/jpeg, image/jpg, image/webp, image/gif"
                      onChange={handleUploadNewDishImage}
                      style={{ display: 'none' }}
                    />
                    <button
                      type="button"
                      disabled={isUploadingAddImage}
                      onClick={() => addFileInputRef.current?.click()}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        padding: '7px 12px',
                        borderRadius: '8px',
                        border: 'none',
                        background: isUploadingAddImage ? '#EAE0DE' : '#9D4124',
                        color: '#FFFFFF',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: isUploadingAddImage ? 'not-allowed' : 'pointer'
                      }}
                    >
                      <Icon name="upload" size={16} />
                      <span>{isUploadingAddImage ? 'Đang tải lên...' : 'Tải ảnh từ thiết bị'}</span>
                    </button>
                    <span style={{ fontSize: '0.68rem', color: '#89726B' }}>
                      Hỗ trợ JPG, PNG, WEBP tối đa 5MB
                    </span>
                  </div>
                </div>

                {isCustomAddUrlMode && (
                  <div style={{ marginTop: '8px' }}>
                    <input
                      type="text"
                      placeholder="Dán link URL ảnh (https://...)"
                      value={newDish.imageUrl}
                      onChange={(e) => setNewDish({ ...newDish, imageUrl: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #EAE0DE', outline: 'none', boxSizing: 'border-box', fontSize: '0.78rem' }}
                    />
                  </div>
                )}
              </div>

              {/* Mô tả */}
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1F1B1A', display: 'block', marginBottom: '4px' }}>
                  Mô tả món ăn:
                </label>
                <textarea
                  rows={2}
                  placeholder="Thành phần chính, hương vị..."
                  value={newDish.description}
                  onChange={(e) => setNewDish({ ...newDish, description: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #EAE0DE', outline: 'none', boxSizing: 'border-box', resize: 'none' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setShowAddDishModal(false)}
                style={{ flex: 1, padding: '11px', borderRadius: '12px', background: '#F0E6E4', border: 'none', fontWeight: 700, color: '#56423D', cursor: 'pointer' }}
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleCreateDish}
                style={{ flex: 1, padding: '11px', borderRadius: '12px', background: '#9D4124', border: 'none', fontWeight: 700, color: '#FFFFFF', cursor: 'pointer' }}
              >
                Tạo Món Ăn
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Quản Lý Nhóm Danh Mục Món Ăn */}
      {showCategoryModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          background: 'rgba(31, 27, 26, 0.65)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: '#FFFFFF',
            width: '100%',
            maxWidth: '560px',
            borderRadius: '24px',
            padding: '24px',
            boxShadow: '0 12px 36px rgba(0,0,0,0.25)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Icon name="category" size={24} style={{ color: '#9D4124' }} />
                <h3 style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1.2rem', color: '#1F1B1A', margin: 0 }}>
                  Quản Lý Nhóm Danh Mục Thực Đơn
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCategoryModal(false)}
                style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#F6ECEA', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <Icon name="close" size={18} />
              </button>
            </div>

            {/* Form thêm mới danh mục */}
            <div style={{ background: '#FCF1EF', padding: '14px', borderRadius: '14px', marginBottom: '18px', border: '1px solid #FFDBC9' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#9D4124', display: 'block', marginBottom: '8px' }}>
                + Thêm Nhóm Danh Mục Mới
              </span>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <input
                  type="text"
                  placeholder="Tên danh mục (VD: Lẩu & Nướng...)"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: '1px solid #EAE0DE', fontSize: '0.85rem' }}
                />
                <button
                  type="button"
                  disabled={catActionLoading}
                  onClick={handleCreateCategory}
                  style={{ padding: '8px 16px', borderRadius: '8px', background: '#9D4124', color: '#FFF', border: 'none', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}
                >
                  {catActionLoading ? 'Đang thêm...' : 'Thêm'}
                </button>
              </div>
              <input
                type="text"
                placeholder="Mô tả ngắn gọn về nhóm món ăn..."
                value={newCatDesc}
                onChange={(e) => setNewCatDesc(e.target.value)}
                style={{ width: '100%', padding: '6px 12px', borderRadius: '8px', border: '1px solid #EAE0DE', fontSize: '0.8rem', boxSizing: 'border-box' }}
              />
            </div>

            {/* Danh sách danh mục hiện có */}
            <div style={{ maxHeight: '280px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {categories.map(cat => (
                <div
                  key={cat.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid #EAE0DE',
                    background: '#FFFFFF'
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 800, fontSize: '0.88rem', color: '#1F1B1A' }}>{cat.name}</span>
                    <span style={{ fontSize: '0.75rem', color: '#89726B', marginLeft: '8px' }}>
                      ({cat.dishCount || 0} món)
                    </span>
                    {cat.description && (
                      <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#89726B' }}>{cat.description}</p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteCategory(cat.id)}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '6px',
                      background: '#FFDAD6',
                      border: 'none',
                      color: '#BA1A1A',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Xóa
                  </button>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '16px', textAlign: 'right' }}>
              <button
                type="button"
                onClick={() => setShowCategoryModal(false)}
                style={{ padding: '9px 20px', borderRadius: '10px', background: '#F0E6E4', border: 'none', fontWeight: 700, color: '#56423D', cursor: 'pointer' }}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
