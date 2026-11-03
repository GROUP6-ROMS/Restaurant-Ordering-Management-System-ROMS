import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { cashierApi } from '../../api/cashierApi';
import { waiterApi } from '../../api/waiterApi';
import { paymentApi } from '../../api/paymentApi';
import { broadcastRealtimeEvent, subscribeRealtimeEvents } from '../../utils/realtimeSync';
import { useRestaurantProfile } from '../../utils/restaurantConfig';

import Icon from '../../components/common/Icon';
import { QRCodeSVG } from 'qrcode.react';
import { useDialog } from '../../context/DialogContext';

// Hàm sinh URL ảnh QR động chuẩn NAPAS 247
const generateVietQrUrl = (amount, billCode, tableCode, profile) => {
  const bank = profile?.bankName || 'MB';
  const accNo = profile?.bankAccountNumber || '090123456789';
  const accName = profile?.bankAccountName || profile?.name || 'NHA HANG ROMS';
  const memo = encodeURIComponent(`${billCode || 'ROMS'} ${tableCode || ''}`.trim());
  return `https://img.vietqr.io/image/${bank}-${accNo}-compact2.png?amount=${amount || 0}&addInfo=${memo}&accountName=${encodeURIComponent(accName)}`;
};

// Hàm phát âm thanh chuông ting-ting bằng Web Audio API khi có yêu cầu tính tiền mới
const playBillChime = () => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime); // Nốt A5
    osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.15); // Nốt A6

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.6);
  } catch (err) {
    // Trình duyệt chặn autoplay khi chưa có tương tác từ người dùng, bỏ qua an toàn
  }
};

export default function PosCheckoutPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const restaurantProfile = useRestaurantProfile();
  const { showConfirm, showAlert } = useDialog();

  // Navigation tab chính: 'POS' | 'HISTORY' | 'SHIFT'
  const [activePosTab, setActivePosTab] = useState('POS');
  const [isFullscreen, setIsFullscreen] = useState(Boolean(document.fullscreenElement));

  // State danh sách bàn POS từ Database
  const [posTables, setPosTables] = useState([]);
  const [selectedTableId, setSelectedTableId] = useState(null);
  const [selectedZone, setSelectedZone] = useState('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('IN_USE'); // 'IN_USE' (Mặc định: Bàn đang phục vụ / cần tính tiền) | 'CALLING' | 'DIRTY' | 'ALL'
  const [zonesList, setZonesList] = useState([]);
  const [isLoadingTables, setIsLoadingTables] = useState(false);

  // State chi tiết tạm tính của bàn được chọn (Bill Preview)
  const [billPreview, setBillPreview] = useState(null);
  const [isLoadingBill, setIsLoadingBill] = useState(false);

  // Menu món ăn từ CSDL cho thanh gọi nhanh món ăn tại quầy
  const [menuCatalog, setMenuCatalog] = useState([]);
  const [searchDishQuery, setSearchDishQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Chiết khấu & Giảm giá
  const [discountType, setDiscountType] = useState('NONE'); // 'NONE' | 'PERCENT' | 'AMOUNT'
  const [discountValue, setDiscountValue] = useState(0);

  // Phương thức thanh toán
  const [paymentMethod, setPaymentMethod] = useState('BANK_TRANSFER'); // 'CASH' | 'BANK_TRANSFER' | 'CARD'
  const [cashGiven, setCashGiven] = useState('');
  const [checkoutNote, setCheckoutNote] = useState('');

  // Lịch sử hóa đơn (Tab HISTORY)
  const [invoices, setInvoices] = useState([]);
  const [historySearch, setHistorySearch] = useState('');
  const [historyMethodFilter, setHistoryMethodFilter] = useState('ALL');
  const [historyDate, setHistoryDate] = useState(new Date().toISOString().split('T')[0]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [viewingHistoryInvoice, setViewingHistoryInvoice] = useState(null);

  // Đối soát két tiền & Chốt ca (Tab SHIFT)
  const [shiftSummary, setShiftSummary] = useState(null);
  const [shiftType, setShiftType] = useState('MORNING');
  const [denominations, setDenominations] = useState({
    500000: 15,
    200000: 10,
    100000: 8,
    50000: 5,
    20000: 4,
    10000: 2
  });
  const [handoverNote, setHandoverNote] = useState('Ca trực hoàn tất tốt, không phát sinh sai sót lớn.');
  const [isShiftClosed, setIsShiftClosed] = useState(() => {
    return sessionStorage.getItem('roms_cashier_shift_closed') === 'true';
  });
  const [shiftApprovedAt, setShiftApprovedAt] = useState(null);

  // Lắng nghe URL params ?tab=SHIFT&trigger=approval từ nút Đăng Xuất StaffLayout
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'SHIFT') {
      setActivePosTab('SHIFT');
      if (searchParams.get('trigger') === 'approval') {
        setShowShiftApprovalModal(true);
      }
    }
  }, [searchParams]);

  // Modals & Thông báo
  const [showVietQrModal, setShowVietQrModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Trạng thái thanh toán payOS VietQR thời gian thực
  const [payOsData, setPayOsData] = useState(null);
  const [isGeneratingPayOsQr, setIsGeneratingPayOsQr] = useState(false);
  const [payOsPollingActive, setPayOsPollingActive] = useState(false);
  const [payOsSettled, setPayOsSettled] = useState(false);
  const [isCheckingPayOsManual, setIsCheckingPayOsManual] = useState(false);
  const handlePayOsPaymentSuccessRef = useRef();
  const payOsDataRef = useRef();
  payOsDataRef.current = payOsData;

  // Modal Quản lý duyệt hủy món (Void item)
  const [showVoidModal, setShowVoidModal] = useState(false);
  const [itemToVoid, setItemToVoid] = useState(null);
  const [voidReason, setVoidReason] = useState('Khách đổi ý trước khi chế biến');
  const [managerPin, setManagerPin] = useState('');
  const [voidError, setVoidError] = useState(null);

  // Modal Quản lý duyệt chốt ca
  const [showShiftApprovalModal, setShowShiftApprovalModal] = useState(false);
  const [shiftManagerPin, setShiftManagerPin] = useState('');
  const [shiftManagerNote, setShiftManagerNote] = useState('Đã đối soát đầy đủ tiền két và hóa đơn ca trực, chấp thuận chốt sổ bàn giao.');
  const [shiftApprovalError, setShiftApprovalError] = useState(null);

  // Modal Đóng phiên bàn trống (0đ)
  const [showCloseEmptyModal, setShowCloseEmptyModal] = useState(false);
  const [closeEmptyReason, setCloseEmptyReason] = useState('Khách rời đi, không dùng món');
  const [closeEmptyTargetStatus, setCloseEmptyTargetStatus] = useState('AVAILABLE');
  const [isClosingEmpty, setIsClosingEmpty] = useState(false);

  // QA Guards & Kiểm soát rủi ro thanh toán
  const [isSubmittingCheckout, setIsSubmittingCheckout] = useState(false);
  const [showDiningWarningModal, setShowDiningWarningModal] = useState(false);
  const [discountManagerPin, setDiscountManagerPin] = useState('');
  const [confirmUnservedChecked, setConfirmUnservedChecked] = useState(false);

  // Ref lưu ID các bàn đang yêu cầu thanh toán để kích hoạt chuông ting-ting
  const prevCallingTableIdsRef = useRef(new Set());
  const selectedTableIdRef = useRef(selectedTableId);

  useEffect(() => {
    selectedTableIdRef.current = selectedTableId;
  }, [selectedTableId]);

  // Toast notification
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  // Fullscreen toggle
  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // 1. Tải danh mục Khu vực & Menu món ăn từ CSDL
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [zonesRes, menuRes] = await Promise.all([
          waiterApi.getZones().catch(() => ({ data: { data: [] } })),
          waiterApi.getMenu().catch(() => ({ data: { data: [] } }))
        ]);

        if (zonesRes.data?.data) {
          setZonesList(zonesRes.data.data);
        }
        if (menuRes.data?.data) {
          setMenuCatalog(menuRes.data.data);
        }
      } catch (err) {
        console.error('Lỗi tải dữ liệu khu vực và menu:', err);
      }
    };
    fetchMetadata();
  }, []);

  // 2. Tải thông tin tạm tính (Bill Preview) khi chọn bàn
  const fetchBillPreview = useCallback(async (tableId, silent = false) => {
    if (!tableId) {
      setBillPreview(null);
      return;
    }
    if (!silent) setIsLoadingBill(true);
    try {
      const res = await cashierApi.getBillPreview(tableId);
      if (res.data?.data) {
        setBillPreview(res.data.data);
      } else {
        setBillPreview(null);
      }
    } catch (err) {
      console.warn(`[Cashier POS] Không thể tải bill preview cho bàn ${tableId}:`, err);
      // Giữ nguyên hoặc fallback về dữ liệu currentTable ở tầng activeBill
      setBillPreview(null);
    } finally {
      if (!silent) setIsLoadingBill(false);
    }
  }, []);

  // 3. Tải danh sách bàn POS (Polling + Đồng bộ tức thời)
  const fetchPosTables = useCallback(async (silent = false) => {
    if (!silent) setIsLoadingTables(true);
    try {
      const zoneParam = selectedZone === 'ALL' ? null : selectedZone;
      const res = await cashierApi.getPosTables(zoneParam);
      const tables = res.data?.data || [];
      setPosTables(tables);

      // Kiểm tra chuông báo tính tiền mới
      const currentCalling = new Set();
      let newlyCallingTableId = null;

      tables.forEach(t => {
        if (t.isCallingBill || t.status === 'PAYMENT_REQUEST') {
          currentCalling.add(t.id);
          if (!prevCallingTableIdsRef.current.has(t.id)) {
            newlyCallingTableId = t.id;
          }
        }
      });

      if (newlyCallingTableId) {
        playBillChime();
        const callingTableObj = tables.find(t => t.id === newlyCallingTableId);
        const callingName = callingTableObj ? (callingTableObj.code || callingTableObj.name) : 'Bàn mới';
        showToast(`🔔 ${callingName} vừa yêu cầu thanh toán hóa đơn!`);
        // Tự động chuyển ngay tới bàn vừa gọi tính tiền
        setSelectedTableId(newlyCallingTableId);
        selectedTableIdRef.current = newlyCallingTableId;
        fetchBillPreview(newlyCallingTableId, false);
      } else {
        // Cập nhật selectedTableId:
        let resolvedId = null;
        setSelectedTableId(prevId => {
          if (tables.length === 0) return null;

          // 1. Nếu bàn trước đó vẫn nằm trong danh sách và còn đang phục vụ -> Giữ nguyên bàn đang chọn
          if (prevId) {
            const prevTable = tables.find(t => t.id === prevId);
            if (prevTable) {
              const isStillInUse = prevTable.isCallingBill || prevTable.status === 'PAYMENT_REQUEST' || prevTable.status === 'DRAFT_PRINTED' || prevTable.status === 'OCCUPIED' || prevTable.status === 'DINING';
              if (isStillInUse) {
                resolvedId = prevId;
                return prevId;
              }
            }
          }

          // 2. Nếu có bàn đang gọi tính tiền -> Ưu tiên chọn bàn đó
          const anyCallingTable = tables.find(t => t.isCallingBill || t.status === 'PAYMENT_REQUEST');
          if (anyCallingTable) {
            resolvedId = anyCallingTable.id;
            return anyCallingTable.id;
          }

          // 3. Nếu chưa chọn bàn nào và có bàn đang dùng bữa -> Tự động chọn bàn đang dùng bữa đầu tiên
          const anyActiveTable = tables.find(t => t.status === 'OCCUPIED' || t.status === 'DINING' || t.status === 'DRAFT_PRINTED');
          if (anyActiveTable) {
            resolvedId = anyActiveTable.id;
            return anyActiveTable.id;
          }

          return null;
        });

        // Tự động đồng bộ lại bill preview của bàn đang chọn (silent = true) để cập nhật ngay hasPaymentRequest & món mới
        const targetSyncId = resolvedId || selectedTableIdRef.current;
        if (targetSyncId) {
          selectedTableIdRef.current = targetSyncId;
          fetchBillPreview(targetSyncId, true);
        }
      }

      prevCallingTableIdsRef.current = currentCalling;
    } catch (err) {
      console.error('Lỗi tải danh sách bàn POS:', err);
    } finally {
      if (!silent) setIsLoadingTables(false);
    }
  }, [selectedZone, fetchBillPreview]);

  // Lắng nghe realtime events từ BroadcastChannel & localStorage
  useEffect(() => {
    const unsubscribe = subscribeRealtimeEvents((event) => {
      if (event?.type === 'BILL_PAID' || event?.status === 'BILL_PAID') {
        const currentPayOs = payOsDataRef.current;
        if (currentPayOs && (event.tableId === selectedTableIdRef.current || event.payload?.payosOrderCode === currentPayOs.orderCode)) {
          if (handlePayOsPaymentSuccessRef.current) {
            handlePayOsPaymentSuccessRef.current({
              orderCode: currentPayOs.orderCode,
              billCode: event.payload?.billCode || currentPayOs.billCode,
              amount: event.payload?.finalAmount || currentPayOs.amount,
              tableId: event.tableId,
              tableNumber: event.tableNumber
            });
          }
        }
        fetchPosTables(true);
      } else if (event?.type === 'PAYMENT_REQUEST') {
        playBillChime();
        showToast(`🔔 ${event.tableName || 'Bàn mới'} vừa yêu cầu thanh toán hóa đơn!`);
        if (event.tableId) {
          setSelectedTableId(event.tableId);
          selectedTableIdRef.current = event.tableId;
          fetchBillPreview(event.tableId, false);
        }
        fetchPosTables(true);
      } else if (event?.type === 'TABLE_UPDATE' || event?.type === 'ORDER_UPDATE') {
        fetchPosTables(true);
        if (selectedTableIdRef.current) {
          fetchBillPreview(selectedTableIdRef.current, true);
        }
      }
    });
    return unsubscribe;
  }, [fetchPosTables, fetchBillPreview]);

  // Lắng nghe khi người dùng chuyển lại tab Thu Ngân hoặc focus cửa sổ
  useEffect(() => {
    const handleTabActive = () => {
      if (document.visibilityState === 'visible') {
        fetchPosTables(true);
        if (selectedTableIdRef.current) {
          fetchBillPreview(selectedTableIdRef.current, true);
        }
      }
    };
    window.addEventListener('focus', handleTabActive);
    document.addEventListener('visibilitychange', handleTabActive);
    return () => {
      window.removeEventListener('focus', handleTabActive);
      document.removeEventListener('visibilitychange', handleTabActive);
    };
  }, [fetchPosTables, fetchBillPreview]);

  // Polling chu kỳ 2.5 giây
  useEffect(() => {
    fetchPosTables();
    const interval = setInterval(() => {
      fetchPosTables(true);
    }, 2500);
    return () => clearInterval(interval);
  }, [fetchPosTables]);

  // Tải chi tiết bill khi chọn bàn mới
  useEffect(() => {
    if (selectedTableId) {
      fetchBillPreview(selectedTableId);
    }
  }, [selectedTableId, fetchBillPreview]);

  // Phân loại số lượng bàn theo trạng thái nghiệp vụ
  const callingCount = posTables.filter(t => t.isCallingBill || t.status === 'PAYMENT_REQUEST').length;
  const inUseCount = posTables.filter(t => t.isCallingBill || t.status === 'PAYMENT_REQUEST' || t.status === 'DRAFT_PRINTED' || t.status === 'OCCUPIED' || t.status === 'DINING').length;
  const dirtyCount = posTables.filter(t => t.status === 'DIRTY').length;

  // Lọc danh sách bàn theo Khu Vực và Trạng Thái phục vụ
  const filteredPosTables = posTables.filter(t => {
    // 1. Lọc khu vực
    if (selectedZone !== 'ALL' && t.zone !== selectedZone) return false;

    // 2. Lọc trạng thái nghiệp vụ
    if (selectedStatusFilter === 'IN_USE') {
      return t.isCallingBill || t.status === 'PAYMENT_REQUEST' || t.status === 'DRAFT_PRINTED' || t.status === 'OCCUPIED' || t.status === 'DINING';
    }
    if (selectedStatusFilter === 'CALLING') {
      return t.isCallingBill || t.status === 'PAYMENT_REQUEST';
    }
    if (selectedStatusFilter === 'DIRTY') {
      return t.status === 'DIRTY';
    }
    return true; // 'ALL' (Hiện tất cả bàn bao gồm cả bàn trống)
  });

  // Bàn đang được chọn hiện tại (tìm trong posTables toàn bộ để không bị mất khi đang lọc zone)
  const currentTable = posTables.find(t => t.id === selectedTableId) || null;

  // Nếu bàn được chọn thuộc khu vực khác bộ lọc, tự động mở rộng sang ALL để hiển thị thẻ bàn
  useEffect(() => {
    if (currentTable && selectedZone !== 'ALL' && currentTable.zone !== selectedZone) {
      setSelectedZone('ALL');
    }
  }, [currentTable, selectedZone]);

  // 4. Tải lịch sử hóa đơn khi mở Tab HISTORY
  const fetchInvoiceHistory = useCallback(async () => {
    setIsLoadingHistory(true);
    try {
      const params = {
        date: historyDate || null,
        paymentMethod: historyMethodFilter === 'ALL' ? null : historyMethodFilter,
        search: historySearch.trim() || null
      };
      const res = await cashierApi.getInvoices(params);
      setInvoices(res.data?.data || []);
    } catch (err) {
      console.error('Lỗi tải lịch sử hóa đơn:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [historyDate, historyMethodFilter, historySearch]);

  useEffect(() => {
    if (activePosTab === 'HISTORY') {
      fetchInvoiceHistory();
    }
  }, [activePosTab, fetchInvoiceHistory]);

  // 5. Tải tổng hợp doanh thu ca khi mở Tab SHIFT
  const fetchShiftSummary = useCallback(async () => {
    try {
      const res = await cashierApi.getShiftSummary(shiftType, historyDate);
      setShiftSummary(res.data?.data || null);
    } catch (err) {
      console.error('Lỗi tải tổng hợp ca:', err);
    }
  }, [shiftType, historyDate]);

  useEffect(() => {
    if (activePosTab === 'SHIFT') {
      fetchShiftSummary();
    }
  }, [activePosTab, fetchShiftSummary]);

  // Chi tiết hóa đơn hiển thị (activeBill): Ưu tiên billPreview chính xác từ API,
  // nếu chưa tải xong (hoặc đang tải) thì dùng ngay dữ liệu từ currentTable để giao diện không bao giờ bị 0đ / trống món
  const activeBill = useMemo(() => {
    if (billPreview) return billPreview;
    if (!currentTable || (!currentTable.orderTotal && (!currentTable.items || currentTable.items.length === 0))) {
      return null;
    }
    const orderItems = Array.isArray(currentTable.items) ? currentTable.items : [];
    const tableSubtotal = Number(currentTable.orderTotal || 0);
    const taxRate = 8.0;
    const taxAmt = Math.round(tableSubtotal * 0.08);

    const mappedItems = orderItems.map(it => ({
      orderItemId: it.orderItemId || it.id,
      itemName: it.itemName || it.name || 'Món ăn',
      quantity: it.quantity || 1,
      unitPrice: it.unitPrice || it.price || 0,
      subtotal: it.subtotal || ((it.unitPrice || it.price || 0) * (it.quantity || 1)),
      note: it.note || '',
      status: it.status || 'COOKING'
    }));

    const unserved = mappedItems.filter(i => i.status === 'PENDING' || i.status === 'COOKING')
      .reduce((sum, i) => sum + (Number(i.quantity) || 1), 0);

    return {
      tableId: currentTable.id,
      tableCode: currentTable.code,
      tableName: currentTable.name,
      zoneName: currentTable.zoneName,
      guestCount: currentTable.guestCount || currentTable.capacity || 1,
      timeIn: currentTable.timeIn || '--:--',
      durationMinutes: currentTable.durationMinutes || 0,
      sessionId: currentTable.sessionId,
      billCode: currentTable.orderCode || `BILL-${currentTable.code}`,
      subtotal: tableSubtotal,
      taxRate: taxRate,
      taxAmount: taxAmt,
      discountAmount: 0,
      finalAmount: tableSubtotal + taxAmt,
      unservedCount: unserved,
      hasPaymentRequest: Boolean(currentTable.isCallingBill || currentTable.status === 'PAYMENT_REQUEST'),
      isDraftPrinted: Boolean(currentTable.isDraftPrinted || currentTable.status === 'DRAFT_PRINTED'),
      items: mappedItems
    };
  }, [billPreview, currentTable]);

  // Tính toán số liệu tài chính hóa đơn trực tiếp từ activeBill (hoặc fallback currentTable)
  const rawSubtotal = activeBill ? Number(activeBill.subtotal || 0) : 0;
  let computedDiscount = 0;
  if (discountType === 'PERCENT' && discountValue > 0) {
    computedDiscount = Math.round((rawSubtotal * discountValue) / 100);
  } else if (discountType === 'AMOUNT' && discountValue > 0) {
    computedDiscount = Math.min(rawSubtotal, Number(discountValue));
  }

  const vatRate = 8.0;
  const computedVat = Math.round((rawSubtotal * vatRate) / 100);
  const finalCalculatedAmount = Math.max(0, rawSubtotal + computedVat - computedDiscount);
  const roundedFinalAmount = Math.round(finalCalculatedAmount / 1000) * 1000;

  // Thêm nhanh món ăn vào bàn
  const handleQuickAddDish = async (dish) => {
    if (!currentTable) {
      showToast('Vui lòng chọn một bàn ăn trước!');
      return;
    }
    try {
      await waiterApi.addOrder(currentTable.id, {
        items: [
          {
            menuItemId: dish.id,
            quantity: 1,
            note: ''
          }
        ]
      });
      showToast(`Đã thêm [${dish.name}] vào ${currentTable.name}`);
      await fetchBillPreview(currentTable.id);
      await fetchPosTables(true);
      broadcastRealtimeEvent({ type: 'ORDER_UPDATE', tableId: currentTable.id });
      broadcastRealtimeEvent({ type: 'TABLE_UPDATE', tableId: currentTable.id, status: 'OCCUPIED' });
    } catch (err) {
      showToast(err.response?.data?.message || 'Không thể thêm món vào bàn!');
    }
  };

  // Đóng phiên ăn bàn trống (0đ) khi khách không dùng món
  const handleConfirmCloseEmpty = async () => {
    if (!currentTable || isClosingEmpty) return;
    setIsClosingEmpty(true);
    try {
      await cashierApi.closeEmptySession(currentTable.id, {
        reason: closeEmptyReason,
        targetStatus: closeEmptyTargetStatus
      });
      const closedTableId = currentTable.id;
      const closedTableName = currentTable.name;
      setShowCloseEmptyModal(false);
      setSelectedTableId(null);
      selectedTableIdRef.current = null;
      setBillPreview(null);
      showToast(`Đã đóng phiên bàn trống cho ${closedTableName}! Bàn đã sẵn sàng.`);
      await fetchPosTables(true);
      broadcastRealtimeEvent({ type: 'TABLE_UPDATE', tableId: closedTableId, status: closeEmptyTargetStatus });
    } catch (err) {
      showToast(err.response?.data?.message || 'Có lỗi xảy ra khi đóng phiên bàn trống!');
    } finally {
      setIsClosingEmpty(false);
    }
  };

  // Yêu cầu hủy món cần Quản lý duyệt mã PIN
  const handleRequestVoidItem = (item) => {
    setItemToVoid(item);
    setManagerPin('');
    setVoidError(null);
    setShowVoidModal(true);
  };

  const handleConfirmVoid = async (e) => {
    if (e) e.preventDefault();
    if (!managerPin || managerPin.trim().length !== 6 || !/^\d{6}$/.test(managerPin.trim())) {
      setVoidError('Mã PIN Quản lý phải gồm đúng 6 chữ số!');
      return;
    }
    try {
      await cashierApi.voidItem(itemToVoid.orderItemId, {
        managerPin: managerPin.trim(),
        reason: voidReason
      });
      setShowVoidModal(false);
      showToast(`Quản lý đã phê duyệt hủy món [${itemToVoid.itemName || itemToVoid.name}]!`);
      if (currentTable) {
        await fetchBillPreview(currentTable.id);
        await fetchPosTables(true);
      }
    } catch (err) {
      setVoidError(err.response?.data?.message || 'Mã PIN Quản lý không chính xác!');
    }
  };

  // In phiếu tạm tính (Pre-bill)
  const handlePrintDraftBill = async () => {
    if (!currentTable || !activeBill || rawSubtotal === 0) {
      showToast('Bàn chưa có món ăn để in phiếu tạm tính!');
      return;
    }
    try {
      await cashierApi.markDraftPrinted(currentTable.id);
      setReceiptData({
        isDraft: true,
        billCode: activeBill.billCode || `PRE-${currentTable.code}`,
        tableName: currentTable.name,
        zoneName: currentTable.zoneName,
        cashierName: user?.fullName || 'Thu Ngân POS',
        paymentTimeFormatted: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date().toLocaleDateString('vi-VN'),
        items: activeBill.items.map(i => ({
          name: i.itemName,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          subtotal: i.subtotal
        })),
        subtotal: rawSubtotal,
        taxAmount: computedVat,
        discountAmount: computedDiscount,
        finalAmount: finalCalculatedAmount,
        paymentMethodLabel: 'Phiếu Tạm Tính (Chưa Thanh Toán)'
      });
      setShowReceiptModal(true);
      setShowDiningWarningModal(false);
      await fetchBillPreview(currentTable.id);
      await fetchPosTables(true);
      broadcastRealtimeEvent({ type: 'TABLE_UPDATE', tableId: currentTable.id, status: 'DRAFT_PRINTED' });
      showToast(`Đã in phiếu tạm tính cho ${currentTable.name}`);
    } catch (err) {
      showToast('Lỗi khi in phiếu tạm tính!');
    }
  };

  // Chốt thanh toán hóa đơn với đầy đủ kiểm tra an toàn F&B
  const handleInitiateCheckout = () => {
    if (!currentTable || !activeBill || rawSubtotal === 0) {
      showToast('Bàn hiện không có món ăn để thanh toán!');
      return;
    }

    // QA Check 4: Tiền khách đưa khi thanh toán tiền mặt (CASH)
    if (paymentMethod === 'CASH') {
      const given = Number(cashGiven) || 0;
      if (given < finalCalculatedAmount) {
        showToast(`Tiền khách đưa chưa đủ! Còn thiếu ${(finalCalculatedAmount - given).toLocaleString('vi-VN')}₫`);
        return;
      }
    }

    // QA Check 5: Giảm giá lớn (> 30% hoặc > 200.000đ)
    const isHighDiscount = (discountType === 'PERCENT' && Number(discountValue) > 30) || computedDiscount > 200000;
    if (isHighDiscount && (!discountManagerPin || discountManagerPin.trim().length !== 6)) {
      showToast('Mức giảm giá lớn (> 30% hoặc > 200.000₫) yêu cầu nhập mã PIN Quản lý 6 số!');
      return;
    }

    // QA Check 0 & 1: Bàn đang dùng bữa bình thường HOẶC còn món đang nấu
    const isDiningWithoutRequest = !activeBill.hasPaymentRequest && !activeBill.isDraftPrinted;
    const hasUnserved = (activeBill.unservedCount || 0) > 0;

    if (isDiningWithoutRequest || hasUnserved) {
      setConfirmUnservedChecked(false);
      setShowDiningWarningModal(true);
      return;
    }

    if (paymentMethod === 'BANK_TRANSFER') {
      handleOpenVietQrPayment(false);
      return;
    }
    executeCheckoutPayment(false);
  };

  const handleConfirmDiningCheckout = () => {
    setShowDiningWarningModal(false);
    if (paymentMethod === 'BANK_TRANSFER') {
      handleOpenVietQrPayment(true);
      return;
    }
    executeCheckoutPayment(true);
  };

  // Xử lý khi cổng payOS xác nhận thanh toán thành công (Webhook hoặc Polling)
  const handlePayOsPaymentSuccess = useCallback(async (paidInfo) => {
    setPayOsSettled(true);
    setPayOsPollingActive(false);

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime);
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.12);
        osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.24);
        osc.frequency.setValueAtTime(1046.50, ctx.currentTime + 0.36);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
        osc.start();
        osc.stop(ctx.currentTime + 0.8);
      }
    } catch (e) {}

    showToast('🎉 ĐÃ NHẬN THANH TOÁN THÀNH CÔNG! MB Bank đã ghi nhận tiền.');

    setTimeout(async () => {
      setShowVietQrModal(false);

      try {
        const invoiceRes = await cashierApi.getInvoices({ search: paidInfo?.billCode || '' });
        const found = invoiceRes.data?.data?.find(inv => inv.billCode === paidInfo?.billCode) || invoiceRes.data?.data?.[0];
        if (found) {
          setReceiptData({
            isDraft: false,
            ...found
          });
          setShowReceiptModal(true);
        }
      } catch (e) {
        console.warn('Lỗi tải hóa đơn in:', e);
      }

      const completedTableId = currentTable?.id;
      setSelectedTableId(null);
      selectedTableIdRef.current = null;
      setBillPreview(null);
      setCashGiven('');
      setCheckoutNote('');
      setDiscountType('NONE');
      setDiscountValue(0);
      setDiscountManagerPin('');
      setPayOsData(null);
      await fetchPosTables(true);
      if (completedTableId) {
        broadcastRealtimeEvent({ type: 'BILL_PAID', tableId: completedTableId, status: 'COMPLETED' });
        broadcastRealtimeEvent({ type: 'BILL_PAID', tableId: completedTableId, status: 'COMPLETED' });
      broadcastRealtimeEvent({ type: 'TABLE_UPDATE', tableId: completedTableId, status: 'DIRTY' });
      }
    }, 1500);
  }, [currentTable, fetchPosTables]);

  handlePayOsPaymentSuccessRef.current = handlePayOsPaymentSuccess;

  // Khởi tạo link thanh toán VietQR động từ payOS
  const handleOpenVietQrPayment = async (forceCheckout = false) => {
    if (isSubmittingCheckout || isGeneratingPayOsQr) return;
    setIsGeneratingPayOsQr(true);
    setPayOsData(null);
    setPayOsSettled(false);

    try {
      const payload = {
        tableId: currentTable.id,
        discountType,
        discountValue: Number(discountValue) || 0,
        taxRate: 8.0,
        note: checkoutNote,
        forceCheckout: Boolean(forceCheckout),
        managerPin: discountManagerPin ? discountManagerPin.trim() : null
      };

      const res = await paymentApi.createPayOsLink(payload);
      const data = res.data?.data;
      if (!data) {
        throw new Error('Không nhận được dữ liệu link thanh toán từ máy chủ!');
      }

      setPayOsData(data);
      setShowVietQrModal(true);
      setPayOsPollingActive(true);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Không thể tạo mã VietQR payOS!';
      showToast(msg);
    } finally {
      setIsGeneratingPayOsQr(false);
    }
  };

  // Tra cứu trạng thái thanh toán thủ công từ Thu ngân
  const handleManualCheckPayOsStatus = async () => {
    if (!payOsData?.orderCode || isCheckingPayOsManual) return;
    setIsCheckingPayOsManual(true);
    try {
      const res = await paymentApi.checkPayOsStatus(payOsData.orderCode);
      const status = res.data?.data?.status;
      if (status === 'PAID') {
        handlePayOsPaymentSuccess(res.data.data);
      } else {
        showToast('⏳ Chưa nhận được thanh toán. Vui lòng nhắc khách kiểm tra lại giao dịch trên App Ngân hàng!');
      }
    } catch (err) {
      showToast('Lỗi khi tra cứu: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsCheckingPayOsManual(false);
    }
  };

  // Cơ chế Polling tự động kiểm tra giao dịch mỗi 2.5 giây khi modal QR mở
  useEffect(() => {
    if (!showVietQrModal || !payOsData?.orderCode || !payOsPollingActive || payOsSettled) {
      return;
    }

    const intervalId = setInterval(async () => {
      try {
        const res = await paymentApi.checkPayOsStatus(payOsData.orderCode);
        if (res.data?.data?.status === 'PAID') {
          handlePayOsPaymentSuccess(res.data.data);
        }
      } catch (err) {
        // Polling silent retry
      }
    }, 2500);

    return () => clearInterval(intervalId);
  }, [showVietQrModal, payOsData, payOsPollingActive, payOsSettled, handlePayOsPaymentSuccess]);

  const executeCheckoutPayment = async (forceCheckout = false) => {
    if (isSubmittingCheckout) return;
    setIsSubmittingCheckout(true);
    setShowVietQrModal(false);
    setShowDiningWarningModal(false);

    try {
      const payload = {
        paymentMethod,
        discountType,
        discountValue: Number(discountValue) || 0,
        taxRate: 8.0,
        cashGiven: paymentMethod === 'CASH' && cashGiven ? Number(cashGiven) : null,
        forceCheckout: Boolean(forceCheckout),
        managerPin: discountManagerPin ? discountManagerPin.trim() : null,
        note: checkoutNote
      };

      const res = await cashierApi.checkout(currentTable.id, payload);
      const invoiceData = res.data?.data;

      setReceiptData({
        isDraft: false,
        ...invoiceData
      });
      setShowReceiptModal(true);
      showToast(`Thanh toán thành công ${currentTable.name}!`);

      // Cập nhật lại danh sách bàn và hóa đơn: Tự động gỡ thẻ bàn vừa thanh toán
      const completedTableId = currentTable.id;
      setSelectedTableId(null);
      selectedTableIdRef.current = null;
      setBillPreview(null);
      setCashGiven('');
      setCheckoutNote('');
      setDiscountType('NONE');
      setDiscountValue(0);
      setDiscountManagerPin('');
      await fetchPosTables(true);
      broadcastRealtimeEvent({ type: 'TABLE_UPDATE', tableId: completedTableId, status: 'DIRTY' });
    } catch (err) {
      showToast(err.response?.data?.message || 'Có lỗi xảy ra khi thanh toán hóa đơn!');
    } finally {
      setIsSubmittingCheckout(false);
    }
  };

  // Kiểm đếm két tiền thực tế
  const totalCountedCash = Object.entries(denominations).reduce(
    (sum, [denom, count]) => sum + Number(denom) * (Number(count) || 0),
    0
  );
  const theoreticalDrawerCash = shiftSummary ? Number(shiftSummary.theoreticalDrawerCash || 0) : 0;
  const cashDifference = totalCountedCash - theoreticalDrawerCash;

  // Xác nhận chốt ca làm việc có Quản lý duyệt
  const handleOpenShiftApproval = () => {
    setShiftManagerPin('');
    setShiftApprovalError(null);
    setShowShiftApprovalModal(true);
  };

  const handleConfirmShiftClose = async (e) => {
    if (e) e.preventDefault();
    if (!shiftManagerPin || shiftManagerPin.trim().length !== 6 || !/^\d{6}$/.test(shiftManagerPin.trim())) {
      setShiftApprovalError('Mã PIN Quản lý phải gồm đúng 6 chữ số!');
      return;
    }
    if (cashDifference !== 0 && (!shiftManagerNote || shiftManagerNote.trim().length < 3)) {
      setShiftApprovalError(`Két tiền có chênh lệch (${cashDifference > 0 ? '+' : ''}${cashDifference.toLocaleString('vi-VN')}₫)! Bắt buộc Quản lý phải nhập lý do/giải trình chênh lệch két tiền.`);
      return;
    }
    try {
      const res = await cashierApi.closeShift({
        managerPin: shiftManagerPin.trim(),
        reason: shiftManagerNote.trim(),
        shiftType: shiftType,
        countedCash: totalCountedCash,
        theoreticalCash: theoreticalDrawerCash,
        cashDifference: cashDifference,
        handoverNote: handoverNote
      });
      const approvedTime = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      setIsShiftClosed(true);
      setShiftApprovedAt(approvedTime);
      sessionStorage.setItem('roms_cashier_shift_closed', 'true');
      setShowShiftApprovalModal(false);
      showToast(res.data?.message || `Quản lý đã phê duyệt chốt ca và bàn giao két tiền lúc ${approvedTime}!`);
      fetchShiftSummary();
    } catch (err) {
      setShiftApprovalError(err.response?.data?.message || 'Mã PIN Quản lý không chính xác!');
    }
  };

  // Lọc catalog menu theo tìm kiếm và danh mục
  const filteredCatalog = menuCatalog.filter(item => {
    const matchSearch = item.name.toLowerCase().includes(searchDishQuery.toLowerCase());
    if (!matchSearch) return false;
    if (selectedCategory === 'ALL') return true;
    return item.categoryName === selectedCategory || item.category?.name === selectedCategory;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', minHeight: 'calc(100vh - 120px)' }}>
      {/* CSS In ấn nhiệt K80 chuyên dụng */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #thermal-receipt-print, #thermal-receipt-print * {
            visibility: visible;
          }
          #thermal-receipt-print {
            position: absolute;
            left: 0;
            top: 0;
            width: 80mm;
            margin: 0;
            padding: 4mm;
            font-family: 'Courier New', Courier, monospace;
            color: #000000;
            background: #FFFFFF;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '72px',
          right: '24px',
          zIndex: 9999,
          background: '#1F1B1A',
          color: '#FFF8F6',
          padding: '12px 18px',
          borderRadius: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
          animation: 'slideDown 0.25s ease-out'
        }}>
          <Icon name="check_circle" size={20} fill={1} style={{ color: '#FFB68C' }} />
          <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>{toastMessage}</span>
        </div>
      )}

      {/* POS Top Tabs Navigation */}
      <div style={{
        background: '#FFFFFF',
        padding: '10px 24px',
        borderBottom: '1px solid #EAE0DE',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
      }}>
        {/* 3 Main Tabs: Thu Ngân | Lịch Sử GD | Két Tiền / Chốt Ca */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: '#F0E6E4',
          padding: '4px',
          borderRadius: '14px',
          border: '1px solid #EAE0DE'
        }}>
          {[
            { id: 'POS', label: 'Thu Ngân', icon: 'point_of_sale' },
            { id: 'HISTORY', label: 'Lịch Sử GD', count: invoices.length, icon: 'receipt_long' },
            { id: 'SHIFT', label: 'Két Tiền / Chốt Ca', icon: 'savings' }
          ].map(tab => {
            const isActive = activePosTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActivePosTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 18px',
                  borderRadius: '10px',
                  border: 'none',
                  background: isActive ? '#9D4124' : 'transparent',
                  color: isActive ? '#FFFFFF' : '#56423D',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  boxShadow: isActive ? '0 2px 8px rgba(157, 65, 36, 0.28)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                <Icon name={tab.icon} size={18} fill={isActive ? 1 : 0} />
                <span>{tab.label}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <span style={{
                    padding: '1px 6px',
                    borderRadius: '9999px',
                    background: isActive ? 'rgba(255,255,255,0.25)' : '#EAE0DE',
                    color: isActive ? '#FFFFFF' : '#56423D',
                    fontSize: '0.72rem',
                    fontFamily: "'JetBrains Mono', monospace"
                  }}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Right Info: Shift Status & Drawer Balance */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: isShiftClosed ? '#DDE8AB' : '#FCF1EF',
            padding: '6px 12px',
            borderRadius: '10px',
            border: isShiftClosed ? '1px solid #C4D388' : '1px solid #EAE0DE',
            fontSize: '0.78rem',
            color: isShiftClosed ? '#181E00' : '#56423D',
            fontWeight: isShiftClosed ? 700 : 500
          }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: isShiftClosed ? '#181E00' : '#596232' }} />
            <span>
              Ca: {shiftSummary?.shiftName || 'Ca Sáng (06:00 - 14:00)'} • {isShiftClosed ? `Đã chốt (${shiftApprovedAt})` : `Thu ngân: ${user?.fullName || 'Thu Ngân POS'}`}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#FFDBC9', padding: '6px 14px', borderRadius: '10px', border: '1px solid #FFB59F', fontSize: '0.8rem', color: '#753400', fontWeight: 700 }}>
            <Icon name="payments" size={16} />
            <span>Két tiền: <strong>{(theoreticalDrawerCash || 0).toLocaleString('vi-VN')}₫</strong></span>
          </div>

          <button
            type="button"
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Thoát toàn màn hình' : 'Toàn màn hình POS'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '10px',
              border: isFullscreen ? '1px solid #9D4124' : '1px solid #EAE0DE',
              background: isFullscreen ? '#9D4124' : '#FFFFFF',
              color: isFullscreen ? '#FFFFFF' : '#56423D',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
              transition: 'all 0.15s ease'
            }}
          >
            <Icon name={isFullscreen ? 'fullscreen_exit' : 'fullscreen'} size={16} />
            <span>{isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: TRẠM THU NGÂN & BÁN HÀNG POS */}
      {activePosTab === 'POS' && (
        <>
          {/* Sub-bar Lọc Khu Vực Bàn */}
          <div style={{
            background: '#FCF1EF',
            padding: '10px 24px',
            borderBottom: '1px solid #EAE0DE',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto' }}>
              <button
                type="button"
                onClick={() => setSelectedZone('ALL')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  background: selectedZone === 'ALL' ? '#9D4124' : '#FFFFFF',
                  color: selectedZone === 'ALL' ? '#FFFFFF' : '#56423D',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  boxShadow: selectedZone === 'ALL' ? '0 2px 6px rgba(157, 65, 36, 0.2)' : '0 1px 3px rgba(0,0,0,0.04)'
                }}
              >
                Tất cả khu vực ({posTables.length})
              </button>

              {zonesList.map(z => {
                const isActive = selectedZone === z.zoneCode;
                const count = posTables.filter(t => t.zone === z.zoneCode).length;
                return (
                  <button
                    key={z.zoneCode}
                    type="button"
                    onClick={() => setSelectedZone(z.zoneCode)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '8px',
                      border: 'none',
                      background: isActive ? '#9D4124' : '#FFFFFF',
                      color: isActive ? '#FFFFFF' : '#56423D',
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      boxShadow: isActive ? '0 2px 6px rgba(157, 65, 36, 0.2)' : '0 1px 3px rgba(0,0,0,0.04)'
                    }}
                  >
                    {z.name} ({count})
                  </button>
                );
              })}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setSelectedStatusFilter('IN_USE')}
                style={{
                  padding: '5px 12px',
                  borderRadius: '8px',
                  border: selectedStatusFilter === 'IN_USE' ? '1.5px solid #9D4124' : '1px solid #EAE0DE',
                  background: selectedStatusFilter === 'IN_USE' ? '#9D4124' : '#FFFFFF',
                  color: selectedStatusFilter === 'IN_USE' ? '#FFFFFF' : '#56423D',
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: selectedStatusFilter === 'IN_USE' ? '0 2px 6px rgba(157, 65, 36, 0.2)' : '0 1px 3px rgba(0,0,0,0.03)'
                }}
              >
                <Icon name="receipt_long" size={14} />
                <span>Cần Thu Tiền ({inUseCount})</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedStatusFilter('CALLING')}
                style={{
                  padding: '5px 12px',
                  borderRadius: '8px',
                  border: selectedStatusFilter === 'CALLING' ? '1.5px solid #BA1A1A' : '1px solid #EAE0DE',
                  background: selectedStatusFilter === 'CALLING' ? '#BA1A1A' : '#FFFFFF',
                  color: selectedStatusFilter === 'CALLING' ? '#FFFFFF' : '#BA1A1A',
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: selectedStatusFilter === 'CALLING' ? '0 2px 6px rgba(186, 26, 26, 0.2)' : '0 1px 3px rgba(0,0,0,0.03)'
                }}
              >
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: selectedStatusFilter === 'CALLING' ? '#FFFFFF' : '#BA1A1A', animation: callingCount > 0 ? 'pulse 1s infinite' : 'none' }} />
                <span>Y/c Tính Tiền ({callingCount})</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedStatusFilter('DIRTY')}
                style={{
                  padding: '5px 12px',
                  borderRadius: '8px',
                  border: selectedStatusFilter === 'DIRTY' ? '1.5px solid #753400' : '1px solid #EAE0DE',
                  background: selectedStatusFilter === 'DIRTY' ? '#753400' : '#FFFFFF',
                  color: selectedStatusFilter === 'DIRTY' ? '#FFFFFF' : '#753400',
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: selectedStatusFilter === 'DIRTY' ? '0 2px 6px rgba(117, 52, 0, 0.2)' : '0 1px 3px rgba(0,0,0,0.03)'
                }}
              >
                <Icon name="cleaning_services" size={14} />
                <span>Chờ Dọn Bàn ({dirtyCount})</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedStatusFilter('ALL')}
                style={{
                  padding: '5px 12px',
                  borderRadius: '8px',
                  border: selectedStatusFilter === 'ALL' ? '1.5px solid #56423D' : '1px solid #EAE0DE',
                  background: selectedStatusFilter === 'ALL' ? '#56423D' : '#FFFFFF',
                  color: selectedStatusFilter === 'ALL' ? '#FFFFFF' : '#89726B',
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: selectedStatusFilter === 'ALL' ? '0 2px 6px rgba(86, 66, 61, 0.2)' : '0 1px 3px rgba(0,0,0,0.03)'
                }}
              >
                <Icon name="grid_view" size={14} />
                <span>Tất Cả ({posTables.length})</span>
              </button>
            </div>
          </div>

          {/* Main Grid: 7 Cột Lưới bàn & Menu + 5 Cột Hóa đơn chi tiết */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(12, 1fr)',
            gap: '20px',
            padding: '20px',
            alignItems: 'flex-start'
          }}>
            {/* Cột trái (7 cols): Sơ đồ bàn & Danh mục món ăn */}
            <div style={{ gridColumn: 'span 7', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Lưới bàn phục vụ POS */}
              <div style={{ background: '#FFFFFF', borderRadius: '18px', padding: '16px', border: '1px solid #F0E6E4', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Icon name="table_restaurant" size={20} style={{ color: '#9D4124' }} />
                    <h4 style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '0.95rem', color: '#1F1B1A', margin: 0 }}>
                      Sơ Đồ Bàn POS Realtime ({filteredPosTables.length} bàn{selectedStatusFilter === 'IN_USE' ? ' cần thu tiền' : selectedStatusFilter === 'CALLING' ? ' yêu cầu tính tiền' : selectedStatusFilter === 'DIRTY' ? ' chờ dọn đĩa' : ''})
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => fetchPosTables()}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', color: '#9D4124', fontSize: '0.78rem', fontWeight: 700 }}
                  >
                    <Icon name="refresh" size={16} /> Làm mới
                  </button>
                </div>

                {isLoadingTables ? (
                  <div style={{ padding: '30px', textAlign: 'center', color: '#89726B' }}>
                    Đang đồng bộ trạng thái bàn ăn từ máy chủ...
                  </div>
                ) : filteredPosTables.length === 0 ? (
                  <div style={{ padding: '36px 20px', textAlign: 'center', color: '#89726B' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#FCF1EF', color: '#9D4124', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px auto' }}>
                      <Icon name="check_circle" size={26} />
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#1F1B1A', marginBottom: '4px' }}>
                      {selectedStatusFilter === 'IN_USE'
                        ? 'Không có bàn nào đang cần thu tiền!'
                        : selectedStatusFilter === 'CALLING'
                        ? 'Hiện không có bàn nào đang yêu cầu tính tiền.'
                        : selectedStatusFilter === 'DIRTY'
                        ? 'Không có bàn nào đang chờ dọn.'
                        : 'Không có bàn nào trong khu vực này.'}
                    </div>
                    <p style={{ fontSize: '0.8rem', color: '#89726B', margin: '0 0 12px 0' }}>
                      {selectedStatusFilter === 'IN_USE' ? 'Tất cả các bàn đã hoàn tất thanh toán hoặc đang trống.' : ''}
                    </p>
                    {selectedStatusFilter !== 'ALL' && (
                      <button
                        type="button"
                        onClick={() => setSelectedStatusFilter('ALL')}
                        style={{
                          padding: '6px 14px',
                          borderRadius: '8px',
                          border: '1px solid #9D4124',
                          background: '#FFF8F6',
                          color: '#9D4124',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        Hiển thị tất cả ({posTables.length}) bàn
                      </button>
                    )}
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}>
                    {filteredPosTables.map(t => {
                      const isSelected = selectedTableId === t.id;
                      const isCalling = t.isCallingBill || t.status === 'PAYMENT_REQUEST';
                      const isDraft = t.status === 'DRAFT_PRINTED';
                      const isDirty = t.status === 'DIRTY';
                      const isAvailable = t.status === 'AVAILABLE';

                      let badgeBg = '#F6ECEA';
                      let badgeColor = '#56423D';
                      let borderStyle = isSelected ? '2px solid #9D4124' : '1px solid #EAE0DE';

                      if (isCalling) {
                        badgeBg = '#FFDAD6';
                        badgeColor = '#93000A';
                        borderStyle = '2px solid #BA1A1A';
                      } else if (isDraft) {
                        badgeBg = '#FFDBC9';
                        badgeColor = '#753400';
                      } else if (isDirty) {
                        badgeBg = '#EAE0DE';
                        badgeColor = '#89726B';
                      } else if (!isAvailable) {
                        badgeBg = '#DDE8AB';
                        badgeColor = '#181E00';
                      }

                      return (
                        <div
                          key={t.id}
                          onClick={() => {
                            setSelectedTableId(t.id);
                            selectedTableIdRef.current = t.id;
                            fetchBillPreview(t.id, false);
                          }}
                          style={{
                            background: isSelected ? '#FFF8F6' : '#FFFFFF',
                            border: borderStyle,
                            borderRadius: '14px',
                            padding: '10px',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            height: '115px',
                            boxShadow: isSelected ? '0 4px 14px rgba(157, 65, 36, 0.2)' : isCalling ? '0 0 12px rgba(186, 26, 26, 0.35)' : 'none',
                            transition: 'all 0.15s ease',
                            position: 'relative'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1rem', color: isSelected ? '#9D4124' : '#1F1B1A' }}>
                              {t.code}
                            </span>
                            {isCalling && (
                              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#BA1A1A', boxShadow: '0 0 6px #BA1A1A' }} />
                            )}
                          </div>

                          <div>
                            <div style={{ fontSize: '0.72rem', color: '#89726B', display: 'flex', justifyContent: 'space-between' }}>
                              <span>{t.guestCount || t.capacity} khách</span>
                              <span>{t.timeIn || '--:--'}</span>
                            </div>
                            <div style={{ fontWeight: 800, fontSize: '0.82rem', color: '#1F1B1A', marginTop: '2px' }}>
                              {t.orderTotal && Number(t.orderTotal) > 0 ? `${Math.round(Number(t.orderTotal) / 1000)}k` : 'Trống'}
                            </div>
                          </div>

                          <div style={{
                            background: badgeBg,
                            color: badgeColor,
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            padding: '2px 4px',
                            borderRadius: '6px',
                            textAlign: 'center',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {t.statusText}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Gọi nhanh món ăn tại quầy POS */}
              <div style={{ background: '#FFFFFF', borderRadius: '18px', padding: '16px', border: '1px solid #F0E6E4', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', marginBottom: '12px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#FCF1EF', borderRadius: '10px', padding: '6px 12px', flex: 1, minWidth: '180px' }}>
                    <Icon name="search" size={18} style={{ color: '#89726B' }} />
                    <input
                      type="text"
                      placeholder="Tìm nhanh món ăn để thêm vào hóa đơn..."
                      value={searchDishQuery}
                      onChange={(e) => setSearchDishQuery(e.target.value)}
                      style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.85rem', width: '100%', color: '#1F1B1A' }}
                    />
                  </div>
                </div>

                {/* Grid món ăn */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px', maxHeight: '280px', overflowY: 'auto' }}>
                  {filteredCatalog.slice(0, 12).map(dish => (
                    <div
                      key={dish.id}
                      onClick={() => handleQuickAddDish(dish)}
                      style={{
                        background: '#FFF8F6',
                        border: '1px solid #F0E6E4',
                        borderRadius: '12px',
                        padding: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        {dish.imageUrl && (
                          <img src={dish.imageUrl} alt={dish.name} style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover' }} />
                        )}
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1F1B1A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {dish.name}
                          </div>
                          <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#9D4124' }}>
                            {Number(dish.price).toLocaleString('vi-VN')}₫
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        style={{
                          width: '100%',
                          marginTop: '6px',
                          padding: '4px',
                          borderRadius: '6px',
                          background: '#FFFFFF',
                          border: '1px solid #EAE0DE',
                          color: '#9D4124',
                          fontWeight: 700,
                          fontSize: '0.72rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        <Icon name="add" size={14} /> Thêm vào {currentTable ? currentTable.code : 'Bàn'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Cột phải (5 cols): Hóa đơn chi tiết & Thanh toán nhanh */}
            <div style={{ gridColumn: 'span 5', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {!currentTable ? (
                <div style={{
                  background: '#FFFFFF',
                  borderRadius: '20px',
                  padding: '48px 24px',
                  border: '1px dashed #EAE0DE',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: '520px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
                }}>
                  <div style={{
                    width: '76px',
                    height: '76px',
                    borderRadius: '50%',
                    background: '#FCF1EF',
                    color: '#9D4124',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '18px',
                    boxShadow: '0 6px 16px rgba(157, 65, 36, 0.12)'
                  }}>
                    <Icon name="touch_app" size={38} />
                  </div>
                  <h3 style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1.2rem', color: '#1F1B1A', margin: '0 0 8px 0' }}>
                    Chưa Chọn Bàn Thanh Toán
                  </h3>
                  <p style={{ fontSize: '0.86rem', color: '#89726B', maxWidth: '300px', margin: '0 0 20px 0', lineHeight: 1.5 }}>
                    Vui lòng chọn một bàn đang phục vụ trên sơ đồ bên trái để xem chi tiết thực đơn và tiến hành thu ngân.
                  </p>
                  <div style={{
                    background: '#FCF1EF',
                    padding: '8px 16px',
                    borderRadius: '20px',
                    fontSize: '0.78rem',
                    color: '#9D4124',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <Icon name="bolt" size={16} /> Bàn thanh toán xong sẽ tự động ẩn khỏi danh sách
                  </div>
                </div>
              ) : (
                <div style={{
                  background: '#FFFFFF',
                  borderRadius: '20px',
                  padding: '20px',
                  border: '1px solid #F0E6E4',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.06)'
                }}>
                {/* Header Hóa đơn */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: '14px', borderBottom: '1px dashed #EAE0DE', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '12px',
                      background: '#9D4124',
                      color: '#FFFFFF',
                      fontFamily: "'Epilogue', sans-serif",
                      fontWeight: 800,
                      fontSize: '1.15rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {currentTable ? currentTable.code : '--'}
                    </span>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <h3 style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1.05rem', color: '#1F1B1A', margin: 0 }}>
                          {currentTable ? currentTable.name : 'Chưa chọn bàn'}
                        </h3>
                        <span style={{ fontSize: '0.75rem', background: '#F6ECEA', color: '#56423D', padding: '2px 6px', borderRadius: '6px', fontWeight: 600 }}>
                          {activeBill?.billCode || currentTable?.orderCode || '#ROMS'}
                        </span>
                        {activeBill && (
                          <span style={{
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '9999px',
                            background: activeBill.hasPaymentRequest ? '#FFDAD6' : (activeBill.isDraftPrinted ? '#FFDBC9' : '#DDE8AB'),
                            color: activeBill.hasPaymentRequest ? '#93000A' : (activeBill.isDraftPrinted ? '#753400' : '#181E00')
                          }}>
                            {activeBill.hasPaymentRequest ? '🔔 Chờ thanh toán' : (activeBill.isDraftPrinted ? '📄 Đã in tạm tính' : '🍽️ Đang dùng bữa')}
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: '0.78rem', color: '#89726B' }}>
                        {activeBill ? `${activeBill.guestCount} khách • Vào lúc ${activeBill.timeIn} (${activeBill.durationMinutes}p)` : 'Chưa có thông tin phiên ăn'}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handlePrintDraftBill}
                    title="In phiếu tạm tính cho khách xem trước"
                    style={{
                      padding: '6px 10px',
                      borderRadius: '8px',
                      border: '1px solid #EAE0DE',
                      background: '#FCF1EF',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      cursor: 'pointer',
                      color: '#9D4124',
                      fontWeight: 700,
                      fontSize: '0.75rem'
                    }}
                  >
                    <Icon name="print" size={16} /> Tạm Tính
                  </button>
                </div>

                {/* Danh sách món ăn chi tiết */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '240px', overflowY: 'auto', marginBottom: '14px' }}>
                  {isLoadingBill && !activeBill ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#89726B', fontSize: '0.85rem' }}>
                      Đang tải danh sách món ăn từ phiên ăn...
                    </div>
                  ) : !activeBill || !activeBill.items || activeBill.items.length === 0 ? (
                    <div style={{
                      padding: '24px 16px',
                      textAlign: 'center',
                      background: '#FFF8F6',
                      borderRadius: '14px',
                      border: '1px dashed #EAE0DE',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <Icon name="no_meals" size={32} style={{ color: '#89726B' }} />
                      <div style={{ color: '#1F1B1A', fontWeight: 700, fontSize: '0.9rem' }}>
                        Bàn hiện đang trống, chưa có món ăn (0đ)
                      </div>
                      <div style={{ color: '#89726B', fontSize: '0.78rem', maxWidth: '320px', lineHeight: 1.4 }}>
                        Khách chưa gọi món hoặc đã rời đi. Bạn có thể giải phóng bàn ngay hoặc chọn món từ danh mục bên dưới.
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowCloseEmptyModal(true)}
                        style={{
                          marginTop: '6px',
                          padding: '7px 16px',
                          borderRadius: '10px',
                          background: '#FFDAD6',
                          color: '#93000A',
                          border: '1px solid #FFB4AB',
                          fontWeight: 700,
                          fontSize: '0.8rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          cursor: 'pointer'
                        }}
                      >
                        <Icon name="event_busy" size={16} /> Đóng phiên bàn trống (0đ)
                      </button>
                    </div>
                  ) : (
                    activeBill.items.map(item => (
                      <div
                        key={item.orderItemId}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          background: '#FFF8F6',
                          padding: '8px 12px',
                          borderRadius: '12px',
                          border: '1px solid #F6ECEA'
                        }}
                      >
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 800, fontSize: '0.85rem', color: '#1F1B1A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {item.itemName}
                            </span>
                            <span style={{ fontSize: '0.7rem', color: '#9D4124', background: '#FFDBC9', padding: '1px 5px', borderRadius: '4px', fontWeight: 600 }}>
                              x{item.quantity}
                            </span>
                            {item.status && (
                              <span style={{
                                fontSize: '0.65rem',
                                fontWeight: 700,
                                padding: '1px 6px',
                                borderRadius: '4px',
                                background: item.status === 'SERVED' ? '#DDE8AB' : (item.status === 'READY' ? '#D0E4FF' : (item.status === 'COOKING' ? '#FFDBC9' : '#F0E6E4')),
                                color: item.status === 'SERVED' ? '#181E00' : (item.status === 'READY' ? '#003366' : (item.status === 'COOKING' ? '#753400' : '#56423D'))
                              }}>
                                {item.status === 'SERVED' ? 'Đã ra món' : (item.status === 'READY' ? 'Chờ bưng' : (item.status === 'COOKING' ? 'Đang nấu' : 'Chờ bếp'))}
                              </span>
                            )}
                          </div>
                          {item.note && (
                            <div style={{ fontSize: '0.72rem', color: '#89726B', fontStyle: 'italic' }}>
                              {item.note}
                            </div>
                          )}
                          <div style={{ fontSize: '0.78rem', color: '#9D4124', fontWeight: 700, marginTop: '2px' }}>
                            {Number(item.unitPrice).toLocaleString('vi-VN')}₫
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                          <span style={{ fontWeight: 800, fontSize: '0.88rem', color: '#1F1B1A', minWidth: '65px', textAlign: 'right' }}>
                            {Number(item.subtotal).toLocaleString('vi-VN')}₫
                          </span>

                          <button
                            type="button"
                            onClick={() => handleRequestVoidItem(item)}
                            title="Hủy món (Yêu cầu Quản lý duyệt)"
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '8px',
                              border: 'none',
                              background: '#FFDAD6',
                              color: '#BA1A1A',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <Icon name="delete" size={16} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Cảnh báo QA F&B: Món đang nấu / Bàn chưa yêu cầu tính tiền */}
                {activeBill?.unservedCount > 0 && (
                  <div style={{
                    background: '#FFF8E1',
                    border: '1px solid #FFE082',
                    color: '#795548',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginBottom: '10px'
                  }}>
                    <Icon name="warning" size={16} style={{ color: '#F57C00' }} />
                    <span>Còn <strong>{activeBill.unservedCount} phần món</strong> đang chế biến / chờ bếp!</span>
                  </div>
                )}
                {activeBill && !activeBill.hasPaymentRequest && !activeBill.isDraftPrinted && (
                  <div style={{
                    background: '#E8F4FD',
                    border: '1px solid #BEE3F8',
                    color: '#2B6CB0',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    fontSize: '0.76rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginBottom: '10px'
                  }}>
                    <Icon name="info" size={16} style={{ color: '#2B6CB0' }} />
                    <span>Bàn đang dùng bữa (chưa yêu cầu tính tiền). Khuyến nghị in tạm tính trước.</span>
                  </div>
                )}

                {/* Chiết khấu & Giảm giá */}
                <div style={{ background: '#FCF1EF', padding: '10px 14px', borderRadius: '12px', marginBottom: '12px', fontSize: '0.8rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontWeight: 700, color: '#56423D' }}>Chiết khấu / Giảm giá:</span>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {[
                        { type: 'NONE', label: '0%', val: 0 },
                        { type: 'PERCENT', label: '5%', val: 5 },
                        { type: 'PERCENT', label: '10%', val: 10 },
                        { type: 'PERCENT', label: '20%', val: 20 }
                      ].map(d => (
                        <button
                          key={d.label}
                          type="button"
                          onClick={() => {
                            setDiscountType(d.type);
                            setDiscountValue(d.val);
                          }}
                          style={{
                            padding: '2px 8px',
                            borderRadius: '6px',
                            border: discountType === d.type && discountValue === d.val ? '1px solid #9D4124' : '1px solid #EAE0DE',
                            background: discountType === d.type && discountValue === d.val ? '#9D4124' : '#FFFFFF',
                            color: discountType === d.type && discountValue === d.val ? '#FFFFFF' : '#56423D',
                            fontWeight: 700,
                            fontSize: '0.72rem',
                            cursor: 'pointer'
                          }}
                        >
                          {d.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Nhập mã PIN Quản lý khi Giảm giá lớn */}
                  {((discountType === 'PERCENT' && Number(discountValue) > 30) || computedDiscount > 200000) && (
                    <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px dashed #EAE0DE' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#BA1A1A', fontSize: '0.74rem', fontWeight: 700, marginBottom: '4px' }}>
                        <Icon name="lock" size={14} />
                        <span>Giảm giá &gt; 30% hoặc &gt; 200.000₫ yêu cầu mã PIN Quản lý:</span>
                      </div>
                      <input
                        type="password"
                        maxLength={6}
                        placeholder="Nhập PIN Quản lý 6 số (vd: 999999)..."
                        value={discountManagerPin}
                        onChange={(e) => setDiscountManagerPin(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '6px 10px',
                          borderRadius: '8px',
                          border: '1px solid #BA1A1A',
                          background: '#FFF',
                          fontSize: '0.82rem',
                          fontFamily: "'JetBrains Mono', monospace",
                          color: '#1F1B1A',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Bảng phân tích chi phí */}
                <div style={{ background: '#FCF1EF', padding: '12px 14px', borderRadius: '14px', marginBottom: '14px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.82rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#56423D' }}>
                    <span>Cộng tiền món:</span>
                    <span style={{ fontWeight: 700, color: '#1F1B1A' }}>{rawSubtotal.toLocaleString('vi-VN')}₫</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#56423D' }}>
                    <span>Thuế VAT (8%):</span>
                    <span style={{ fontWeight: 700, color: '#1F1B1A' }}>{computedVat.toLocaleString('vi-VN')}₫</span>
                  </div>
                  {computedDiscount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#BA1A1A' }}>
                      <span>Giảm giá ({discountType === 'PERCENT' ? `${discountValue}%` : 'VNĐ'}):</span>
                      <span style={{ fontWeight: 700 }}>-{computedDiscount.toLocaleString('vi-VN')}₫</span>
                    </div>
                  )}

                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    paddingTop: '8px',
                    marginTop: '4px',
                    borderTop: '1px solid #EAE0DE'
                  }}>
                    <div>
                      <span style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '0.92rem', color: '#1F1B1A', display: 'block' }}>
                        TỔNG CẦN THU
                      </span>
                      <span style={{ fontSize: '0.72rem', color: '#89726B' }}>Làm tròn: {roundedFinalAmount.toLocaleString('vi-VN')}₫</span>
                    </div>
                    <span style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1.45rem', color: '#9D4124' }}>
                      {finalCalculatedAmount.toLocaleString('vi-VN')}₫
                    </span>
                  </div>
                </div>

                {/* Chọn phương thức thanh toán */}
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#89726B', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '6px' }}>
                    Phương thức thanh toán
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                    {[
                      { id: 'CASH', label: 'Tiền mặt', icon: 'payments' },
                      { id: 'BANK_TRANSFER', label: 'VietQR', icon: 'qr_code_2' },
                      { id: 'CARD', label: 'Thẻ POS', icon: 'credit_card' }
                    ].map(m => {
                      const isActive = paymentMethod === m.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setPaymentMethod(m.id)}
                          style={{
                            padding: '10px 6px',
                            borderRadius: '12px',
                            border: isActive ? '1.5px solid #9D4124' : '1px solid #EAE0DE',
                            background: isActive ? '#9D4124' : '#FFF8F6',
                            color: isActive ? '#FFFFFF' : '#56423D',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '4px',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <Icon name={m.icon} size={20} />
                          <span style={{ fontSize: '0.78rem', fontWeight: 700 }}>{m.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Gợi ý & Nhập tiền mặt khách đưa (Validate đủ tiền) */}
                {paymentMethod === 'CASH' && (
                  <div style={{ marginBottom: '14px', background: '#FCF1EF', padding: '10px 12px', borderRadius: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontSize: '0.75rem', color: '#89726B', fontWeight: 600 }}>Tiền khách đưa:</span>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {[roundedFinalAmount, Math.ceil(roundedFinalAmount / 100000) * 100000, 500000, 1000000].map(val => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => setCashGiven(val.toString())}
                            style={{ padding: '3px 6px', borderRadius: '6px', border: '1px solid #EAE0DE', background: '#FFF', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}
                          >
                            {val.toLocaleString('vi-VN')}₫
                          </button>
                        ))}
                      </div>
                    </div>
                    <input
                      type="number"
                      placeholder="Nhập số tiền khách đưa..."
                      value={cashGiven}
                      onChange={(e) => setCashGiven(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: cashGiven && Number(cashGiven) < finalCalculatedAmount ? '1.5px solid #BA1A1A' : '1px solid #EAE0DE',
                        background: '#FFF',
                        fontSize: '0.85rem',
                        fontFamily: "'JetBrains Mono', monospace",
                        marginBottom: '6px',
                        boxSizing: 'border-box'
                      }}
                    />
                    {cashGiven && Number(cashGiven) < finalCalculatedAmount && (
                      <div style={{ color: '#BA1A1A', fontSize: '0.74rem', fontWeight: 700, paddingBottom: '4px' }}>
                        ⚠️ Tiền khách đưa chưa đủ (thiếu {(finalCalculatedAmount - Number(cashGiven)).toLocaleString('vi-VN')}₫)
                      </div>
                    )}
                    {cashGiven && Number(cashGiven) >= finalCalculatedAmount && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 700, color: '#059669', paddingTop: '4px', borderTop: '1px dashed #EAE0DE' }}>
                        <span>Tiền thối trả khách:</span>
                        <span>{(Number(cashGiven) - finalCalculatedAmount).toLocaleString('vi-VN')}₫</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Nút bấm Thanh toán & In hóa đơn với Loading & Disable Guard */}
                {(() => {
                  const isCashShort = paymentMethod === 'CASH' && Number(cashGiven || 0) < finalCalculatedAmount;
                  const isHighDisc = (discountType === 'PERCENT' && Number(discountValue) > 30) || computedDiscount > 200000;
                  const isPinMissing = isHighDisc && (!discountManagerPin || discountManagerPin.trim().length !== 6);
                  const isBtnDisabled = rawSubtotal === 0 || isSubmittingCheckout || isCashShort || isPinMissing;

                  if (rawSubtotal === 0) {
                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={() => setShowCloseEmptyModal(true)}
                          style={{
                            width: '100%',
                            padding: '13px 20px',
                            borderRadius: '16px',
                            background: '#BA1A1A',
                            color: '#FFFFFF',
                            border: 'none',
                            fontFamily: "'Epilogue', sans-serif",
                            fontWeight: 800,
                            fontSize: '0.95rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            cursor: 'pointer',
                            boxShadow: '0 4px 14px rgba(186, 26, 26, 0.25)',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <Icon name="event_busy" size={20} />
                          <span>Đóng Phiên Bàn Trống (0đ / Khách Rời Đi)</span>
                        </button>
                        <div style={{ fontSize: '0.74rem', color: '#89726B', textAlign: 'center', lineHeight: 1.4 }}>
                          Bàn chưa có món ăn để xuất hóa đơn. Bấm chọn món từ danh mục bên dưới nếu khách có dùng món.
                        </div>
                      </div>
                    );
                  }

                  return (
                    <button
                      type="button"
                      onClick={handleInitiateCheckout}
                      disabled={isBtnDisabled || isGeneratingPayOsQr}
                      style={{
                        width: '100%',
                        padding: '14px 20px',
                        borderRadius: '16px',
                        background: (isBtnDisabled || isGeneratingPayOsQr) ? '#CBD5E1' : '#9D4124',
                        color: '#FFFFFF',
                        border: 'none',
                        fontFamily: "'Epilogue', sans-serif",
                        fontWeight: 800,
                        fontSize: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        cursor: (isBtnDisabled || isGeneratingPayOsQr) ? 'not-allowed' : 'pointer',
                        boxShadow: (isBtnDisabled || isGeneratingPayOsQr) ? 'none' : '0 6px 18px rgba(157, 65, 36, 0.3)',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {isGeneratingPayOsQr ? (
                        <>
                          <Icon name="sync" size={20} style={{ animation: 'spin 1s linear infinite' }} />
                          <span>Đang Tạo Mã VietQR PayOS...</span>
                        </>
                      ) : isSubmittingCheckout ? (
                        <>
                          <Icon name="sync" size={20} style={{ animation: 'spin 1s linear infinite' }} />
                          <span>Đang Xử Lý Giao Dịch...</span>
                        </>
                      ) : (
                        <>
                          <Icon name="point_of_sale" size={22} />
                          <span>Thanh Toán & Xuất Hóa Đơn</span>
                          <Icon name="arrow_forward" size={18} />
                        </>
                      )}
                    </button>
                  );
                })()}
              </div>
            )}
          </div>
          </div>
        </>
      )}

      {/* VIEW 2: LỊCH SỬ GIAO DỊCH HÓA ĐƠN */}
      {activePosTab === 'HISTORY' && (
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Thanh KPI tổng hợp */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
            <div style={{ background: '#FFFFFF', padding: '16px 20px', borderRadius: '16px', border: '1px solid #F0E6E4' }}>
              <span style={{ fontSize: '0.8rem', color: '#89726B', fontWeight: 600 }}>Doanh thu trong ngày</span>
              <div style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1.6rem', color: '#1F1B1A', marginTop: '6px' }}>
                {invoices.reduce((sum, inv) => sum + Number(inv.finalAmount || 0), 0).toLocaleString('vi-VN')}₫
              </div>
            </div>

            <div style={{ background: '#FFFFFF', padding: '16px 20px', borderRadius: '16px', border: '1px solid #F0E6E4' }}>
              <span style={{ fontSize: '0.8rem', color: '#89726B', fontWeight: 600 }}>Số lượng hóa đơn</span>
              <div style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1.6rem', color: '#1F1B1A', marginTop: '6px' }}>
                {invoices.length} <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#89726B' }}>hóa đơn</span>
              </div>
            </div>

            <div style={{ background: '#FFFFFF', padding: '16px 20px', borderRadius: '16px', border: '1px solid #F0E6E4' }}>
              <span style={{ fontSize: '0.8rem', color: '#89726B', fontWeight: 600 }}>Tiền mặt</span>
              <div style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1.6rem', color: '#753400', marginTop: '6px' }}>
                {invoices.filter(i => i.paymentMethod === 'CASH').reduce((sum, inv) => sum + Number(inv.finalAmount || 0), 0).toLocaleString('vi-VN')}₫
              </div>
            </div>

            <div style={{ background: '#FFFFFF', padding: '16px 20px', borderRadius: '16px', border: '1px solid #F0E6E4' }}>
              <span style={{ fontSize: '0.8rem', color: '#89726B', fontWeight: 600 }}>Chuyển khoản (VietQR)</span>
              <div style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1.6rem', color: '#9D4124', marginTop: '6px' }}>
                {invoices.filter(i => i.paymentMethod === 'BANK_TRANSFER').reduce((sum, inv) => sum + Number(inv.finalAmount || 0), 0).toLocaleString('vi-VN')}₫
              </div>
            </div>
          </div>

          {/* Thanh lọc & tìm kiếm */}
          <div style={{ background: '#FFFFFF', padding: '16px 20px', borderRadius: '18px', border: '1px solid #F0E6E4', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ position: 'relative', flex: '1 1 300px', maxWidth: '480px' }}>
                <Icon name="search" size={20} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#89726B' }} />
                <input
                  type="text"
                  placeholder="Tìm theo mã HĐ (#BILL-...), số bàn, thu ngân..."
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px 10px 38px', borderRadius: '12px', border: '1.5px solid #EAE0DE', background: '#FCF1EF', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="date"
                  value={historyDate}
                  onChange={(e) => setHistoryDate(e.target.value)}
                  style={{ padding: '8px 12px', borderRadius: '10px', border: '1px solid #EAE0DE', background: '#FCF1EF', fontSize: '0.82rem', fontWeight: 600, color: '#1F1B1A', outline: 'none' }}
                />

                <button
                  type="button"
                  onClick={fetchInvoiceHistory}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', borderRadius: '12px', border: '1px solid #EAE0DE', background: '#FCF1EF', color: '#56423D', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}
                >
                  <Icon name="refresh" size={18} /> Làm mới
                </button>
              </div>
            </div>

            {/* Filter Pills PTTT */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', paddingTop: '6px', borderTop: '1px solid #F0E6E4' }}>
              <span style={{ fontSize: '0.78rem', color: '#89726B', fontWeight: 700 }}>PTTT:</span>
              {[
                { id: 'ALL', label: 'Tất cả' },
                { id: 'CASH', label: 'Tiền mặt' },
                { id: 'BANK_TRANSFER', label: 'VietQR Chuyển khoản' },
                { id: 'CARD', label: 'Thẻ POS' }
              ].map(m => {
                const isActive = historyMethodFilter === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setHistoryMethodFilter(m.id)}
                    style={{
                      padding: '4px 12px',
                      borderRadius: '8px',
                      border: '1px solid',
                      borderColor: isActive ? '#9D4124' : '#EAE0DE',
                      background: isActive ? '#FFDBC9' : '#FFFFFF',
                      color: isActive ? '#753400' : '#56423D',
                      fontWeight: 700,
                      fontSize: '0.75rem',
                      cursor: 'pointer'
                    }}
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bảng dữ liệu hóa đơn */}
          <div style={{ background: '#FFFFFF', borderRadius: '18px', border: '1px solid #F0E6E4', overflow: 'hidden' }}>
            {isLoadingHistory ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#89726B' }}>
                Đang tải danh sách hóa đơn từ CSDL...
              </div>
            ) : invoices.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#89726B' }}>
                Không tìm thấy hóa đơn nào phù hợp với bộ lọc!
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: '#FCF1EF', borderBottom: '1.5px solid #EAE0DE', color: '#89726B', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                    <th style={{ padding: '14px 18px', fontWeight: 800 }}>Mã Hóa Đơn</th>
                    <th style={{ padding: '14px 18px', fontWeight: 800 }}>Bàn & Khu Vực</th>
                    <th style={{ padding: '14px 18px', fontWeight: 800 }}>Thời Gian</th>
                    <th style={{ padding: '14px 18px', fontWeight: 800 }}>Thu Ngân</th>
                    <th style={{ padding: '14px 18px', fontWeight: 800 }}>Chi Tiết Món</th>
                    <th style={{ padding: '14px 18px', fontWeight: 800 }}>Phương Thức</th>
                    <th style={{ padding: '14px 18px', fontWeight: 800 }}>Tổng Tiền</th>
                    <th style={{ padding: '14px 18px', fontWeight: 800 }}>Trạng Thái</th>
                    <th style={{ padding: '14px 18px', fontWeight: 800, textAlign: 'center' }}>Thao Tác</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv, idx) => (
                    <tr key={inv.id} style={{ borderBottom: '1px solid #F0E6E4', background: idx % 2 === 0 ? '#FFFFFF' : '#FFFAF9' }}>
                      <td style={{ padding: '14px 18px', fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: '#9D4124' }}>
                        {inv.billCode}
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <strong style={{ color: '#1F1B1A' }}>{inv.tableName}</strong>
                        <span style={{ display: 'block', fontSize: '0.72rem', color: '#89726B' }}>{inv.zoneName}</span>
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <span style={{ fontWeight: 600, color: '#1F1B1A' }}>{inv.paymentTimeFormatted}</span>
                        <span style={{ display: 'block', fontSize: '0.72rem', color: '#89726B' }}>{inv.shiftName}</span>
                      </td>
                      <td style={{ padding: '14px 18px', color: '#56423D' }}>
                        {inv.cashierName}
                      </td>
                      <td style={{ padding: '14px 18px', maxWidth: '240px' }}>
                        <span style={{ fontWeight: 700, color: '#1F1B1A' }}>{inv.itemsCount || inv.items?.length || 0} món</span>
                        <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#89726B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {inv.itemsSummary || (inv.items ? inv.items.map(i => `${i.name} x${i.quantity}`).join(', ') : '')}
                        </p>
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <span style={{
                          padding: '4px 8px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700,
                          background: inv.paymentMethod === 'BANK_TRANSFER' ? '#FFDBC9' : inv.paymentMethod === 'CASH' ? '#FCF1EF' : '#DDE8AB',
                          color: inv.paymentMethod === 'BANK_TRANSFER' ? '#9D4124' : inv.paymentMethod === 'CASH' ? '#753400' : '#181E00'
                        }}>
                          {inv.paymentMethodLabel}
                        </span>
                      </td>
                      <td style={{ padding: '14px 18px', fontFamily: "'JetBrains Mono', monospace", fontWeight: 800, fontSize: '0.95rem', color: '#1F1B1A' }}>
                        {Number(inv.finalAmount).toLocaleString('vi-VN')}₫
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <span style={{
                          padding: '4px 10px', borderRadius: '9999px', fontSize: '0.72rem', fontWeight: 800,
                          background: '#DDE8AB', color: '#181E00'
                        }}>
                          {inv.statusLabel || 'Đã thanh toán'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              const res = await cashierApi.getInvoiceDetail(inv.id);
                              setReceiptData(res.data?.data || inv);
                              setShowReceiptModal(true);
                            } catch (e) {
                              setReceiptData(inv);
                              setShowReceiptModal(true);
                            }
                          }}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: '5px',
                            padding: '6px 12px', borderRadius: '8px',
                            border: '1px solid #EAE0DE', background: '#FFFFFF',
                            color: '#9D4124', fontWeight: 700, fontSize: '0.78rem',
                            cursor: 'pointer'
                          }}
                        >
                          <Icon name="print" size={16} />
                          <span>In lại HĐ</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* VIEW 3: KÉT TIỀN & BÀN GIAO CA */}
      {activePosTab === 'SHIFT' && (
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Top Shift Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
            <div style={{ background: '#FFFFFF', padding: '16px 20px', borderRadius: '16px', border: '1px solid #F0E6E4' }}>
              <span style={{ fontSize: '0.78rem', color: '#89726B', fontWeight: 600 }}>Tổng số hóa đơn ca</span>
              <div style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1.5rem', color: '#1F1B1A', marginTop: '6px' }}>
                {shiftSummary?.totalBillsCount || 0}
              </div>
            </div>

            <div style={{ background: '#FFFFFF', padding: '16px 20px', borderRadius: '16px', border: '1px solid #F0E6E4' }}>
              <span style={{ fontSize: '0.78rem', color: '#89726B', fontWeight: 600 }}>Doanh thu tiền mặt</span>
              <div style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1.5rem', color: '#753400', marginTop: '6px' }}>
                {Number(shiftSummary?.cashRevenue || 0).toLocaleString('vi-VN')}₫
              </div>
            </div>

            <div style={{ background: '#FFFFFF', padding: '16px 20px', borderRadius: '16px', border: '1px solid #F0E6E4' }}>
              <span style={{ fontSize: '0.78rem', color: '#89726B', fontWeight: 600 }}>Chuyển khoản VietQR</span>
              <div style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1.5rem', color: '#9D4124', marginTop: '6px' }}>
                {Number(shiftSummary?.bankRevenue || 0).toLocaleString('vi-VN')}₫
              </div>
            </div>

            <div style={{ background: '#FFFFFF', padding: '16px 20px', borderRadius: '16px', border: '1px solid #F0E6E4' }}>
              <span style={{ fontSize: '0.78rem', color: '#89726B', fontWeight: 600 }}>Quẹt thẻ POS</span>
              <div style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1.5rem', color: '#596232', marginTop: '6px' }}>
                {Number(shiftSummary?.cardRevenue || 0).toLocaleString('vi-VN')}₫
              </div>
            </div>

            <div style={{ background: '#FFDBC9', padding: '16px 20px', borderRadius: '16px', border: '1.5px solid #FFB59F' }}>
              <span style={{ fontSize: '0.78rem', color: '#753400', fontWeight: 800, textTransform: 'uppercase' }}>Két tiền lý thuyết</span>
              <div style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 900, fontSize: '1.6rem', color: '#753400', marginTop: '6px' }}>
                {theoreticalDrawerCash.toLocaleString('vi-VN')}₫
              </div>
            </div>
          </div>

          {/* Chia cột: Kiểm đếm tiền mặt vs Biên bản Z-Report */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '20px', alignItems: 'flex-start' }}>
            <div style={{ gridColumn: 'span 7', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Bảng kiểm đếm mệnh giá */}
              <div style={{ background: '#FFFFFF', borderRadius: '18px', padding: '20px', border: '1px solid #F0E6E4' }}>
                <h3 style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1.1rem', color: '#1F1B1A', marginBottom: '14px' }}>
                  Bảng Kiểm Đếm Tiền Mặt Theo Mệnh Giá
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {[
                    { denom: 500000, label: '500.000₫' },
                    { denom: 200000, label: '200.000₫' },
                    { denom: 100000, label: '100.000₫' },
                    { denom: 50000, label: '50.000₫' },
                    { denom: 20000, label: '20.000₫' },
                    { denom: 10000, label: '10.000₫' }
                  ].map(item => {
                    const count = denominations[item.denom] || 0;
                    const sub = item.denom * count;
                    return (
                      <div key={item.denom} style={{ background: '#FCF1EF', padding: '12px 14px', borderRadius: '12px', border: '1px solid #EAE0DE', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#1F1B1A' }}>{item.label}</span>
                          <span style={{ display: 'block', fontSize: '0.75rem', color: '#89726B', marginTop: '2px' }}>
                            = {sub.toLocaleString('vi-VN')}₫
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={() => setDenominations(prev => ({ ...prev, [item.denom]: Math.max(0, (prev[item.denom] || 0) - 1) }))}
                            style={{ width: '28px', height: '28px', borderRadius: '8px', border: '1px solid #EAE0DE', background: '#FFFFFF', fontWeight: 800, cursor: 'pointer' }}
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="0"
                            value={count}
                            onChange={(e) => setDenominations(prev => ({ ...prev, [item.denom]: Math.max(0, parseInt(e.target.value, 10) || 0) }))}
                            style={{ width: '45px', textAlign: 'center', padding: '4px', borderRadius: '8px', border: '1px solid #EAE0DE', background: '#FFFFFF', fontWeight: 800, outline: 'none' }}
                          />
                          <button
                            type="button"
                            onClick={() => setDenominations(prev => ({ ...prev, [item.denom]: (prev[item.denom] || 0) + 1 }))}
                            style={{ width: '28px', height: '28px', borderRadius: '8px', border: '1px solid #EAE0DE', background: '#FFFFFF', fontWeight: 800, cursor: 'pointer' }}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Kết quả đối soát */}
                <div style={{
                  marginTop: '16px',
                  padding: '16px',
                  borderRadius: '14px',
                  background: cashDifference === 0 ? '#EBF5E9' : '#FDE8E8',
                  border: cashDifference === 0 ? '1.5px solid #A6D799' : '1.5px solid #F8B4B4',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}>
                  <div>
                    <span style={{ fontSize: '0.78rem', color: cashDifference === 0 ? '#276722' : '#9B1C1C', fontWeight: 700 }}>
                      Tổng tiền mặt thực đếm trong két:
                    </span>
                    <div style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 900, fontSize: '1.4rem', color: cashDifference === 0 ? '#184F14' : '#771D1D' }}>
                      {totalCountedCash.toLocaleString('vi-VN')}₫
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.75rem', color: '#56423D', display: 'block' }}>Chênh lệch két:</span>
                    <span style={{
                      display: 'inline-block',
                      padding: '4px 12px',
                      borderRadius: '9999px',
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      background: cashDifference === 0 ? '#DDE8AB' : '#FFDAD6',
                      color: cashDifference === 0 ? '#181E00' : '#BA1A1A'
                    }}>
                      {cashDifference === 0 ? '✓ Khớp 100% (0₫)' : `${cashDifference > 0 ? '+' : ''}${cashDifference.toLocaleString('vi-VN')}₫`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Ghi chú bàn giao ca */}
              <div style={{ background: '#FFFFFF', borderRadius: '18px', padding: '20px', border: '1px solid #F0E6E4' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#56423D', marginBottom: '6px' }}>
                  Ghi chú bàn giao cho thu ngân ca tiếp theo:
                </label>
                <textarea
                  rows={3}
                  value={handoverNote}
                  onChange={(e) => setHandoverNote(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1.5px solid #EAE0DE', fontSize: '0.85rem', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            {/* Biên bản Z-Report khổ 80mm */}
            <div style={{ gridColumn: 'span 5', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ background: '#FFFFFF', borderRadius: '18px', padding: '20px', border: '1px solid #EAE0DE' }}>
                <h4 style={{ fontFamily: "'Epilogue', sans-serif", fontSize: '0.95rem', color: '#1F1B1A', margin: '0 0 12px' }}>
                  Biên Bản Z-Report Đối Soát Két (K80)
                </h4>

                <div style={{ background: '#FFFAF8', padding: '16px', borderRadius: '12px', border: '1px solid #F0E6E4', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.78rem', lineHeight: 1.6 }}>
                  <div style={{ textAlign: 'center', paddingBottom: '10px', borderBottom: '1px dashed #999' }}>
                    <div style={{ fontWeight: 800, fontSize: '1rem', color: '#9D4124' }}>ROMS RESTAURANT</div>
                    <div style={{ fontWeight: 800, marginTop: '4px' }}>BIÊN BẢN CHỐT CA & BÀN GIAO KÉT</div>
                  </div>

                  <div style={{ padding: '8px 0', borderBottom: '1px dashed #CCC', fontSize: '0.74rem' }}>
                    <div>Ngày: {new Date().toLocaleDateString('vi-VN')} • Giờ: {new Date().toLocaleTimeString('vi-VN')}</div>
                    <div>Ca: <strong>{shiftSummary?.shiftName || 'Ca Sáng (06:00 - 14:00)'}</strong></div>
                    <div>Thu ngân: <strong>{user?.fullName || 'Thu Ngân POS'}</strong></div>
                  </div>

                  <div style={{ padding: '8px 0', borderBottom: '1px dashed #CCC' }}>
                    <div style={{ fontWeight: 800 }}>DOANH THU THỰC TẾ:</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>- Tiền mặt:</span>
                      <strong>{Number(shiftSummary?.cashRevenue || 0).toLocaleString('vi-VN')}₫</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>- VietQR:</span>
                      <strong>{Number(shiftSummary?.bankRevenue || 0).toLocaleString('vi-VN')}₫</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>- Thẻ POS:</span>
                      <strong>{Number(shiftSummary?.cardRevenue || 0).toLocaleString('vi-VN')}₫</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, borderTop: '1px dotted #AAA', paddingTop: '4px', marginTop: '4px' }}>
                      <span>TỔNG DOANH THU:</span>
                      <strong style={{ color: '#9D4124' }}>{Number(shiftSummary?.totalRevenue || 0).toLocaleString('vi-VN')}₫</strong>
                    </div>
                  </div>

                  <div style={{ padding: '8px 0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>= Tiền mặt trong két:</span>
                      <strong>{theoreticalDrawerCash.toLocaleString('vi-VN')}₫</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#596232', fontWeight: 800 }}>
                      <span>= Tiền thực đếm:</span>
                      <strong>{totalCountedCash.toLocaleString('vi-VN')}₫</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, color: cashDifference === 0 ? '#596232' : '#BA1A1A' }}>
                      <span>CHÊNH LỆCH:</span>
                      <span>{cashDifference === 0 ? '0₫ (Khớp)' : `${cashDifference.toLocaleString('vi-VN')}₫`}</span>
                    </div>
                  </div>

                  {isShiftClosed ? (
                    <div style={{ background: '#DDE8AB', color: '#181E00', padding: '6px', textAlign: 'center', borderRadius: '6px', fontWeight: 800, marginTop: '8px' }}>
                      ✓ ĐÃ CHỐT CA BỞI QUẢN LÝ ({shiftApprovedAt})
                    </div>
                  ) : (
                    <div style={{ color: '#BA1A1A', textAlign: 'center', fontSize: '0.72rem', marginTop: '8px' }}>
                      * Cần Quản lý duyệt mã PIN 6 số để xác nhận chốt sổ
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '14px' }}>
                  <button
                    type="button"
                    onClick={handleOpenShiftApproval}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '12px',
                      background: isShiftClosed ? '#596232' : '#9D4124',
                      color: '#FFFFFF',
                      border: 'none',
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                  >
                    {isShiftClosed ? 'Ca Đã Chốt • Xem Phê Duyệt' : 'Quản Lý Xác Nhận Chốt Ca'}
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '12px',
                      background: '#F0E6E4',
                      color: '#56423D',
                      border: 'none',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    In Biên Bản Z-Report (K80)
                  </button>
                  {isShiftClosed && (
                    <button
                      type="button"
                      onClick={async () => {
                        sessionStorage.removeItem('roms_cashier_shift_closed');
                        await logout();
                        navigate('/login');
                      }}
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '12px',
                        background: '#BA1A1A',
                        color: '#FFFFFF',
                        border: 'none',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <Icon name="logout" size={18} />
                      Hoàn Tất Ca & Đăng Xuất An Toàn
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODALS */}
      {/* =================================================================== */}

      {/* MODAL 1: VIETQR CHUYỂN KHOẢN ĐỘNG CHUẨN NAPAS 24/7 (PAYOS OPEN BANKING) */}
      {showVietQrModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          background: 'rgba(31, 27, 26, 0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: '#FFFFFF',
            width: '100%',
            maxWidth: '430px',
            borderRadius: '28px',
            padding: '24px',
            textAlign: 'center',
            boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  background: '#E0F2FE',
                  color: '#0284C7',
                  padding: '4px 8px',
                  borderRadius: '8px',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  letterSpacing: '0.5px'
                }}>
                  VIETQR NAPAS 24/7
                </span>
                <span style={{
                  background: '#ECFDF5',
                  color: '#059669',
                  padding: '4px 8px',
                  borderRadius: '8px',
                  fontSize: '0.72rem',
                  fontWeight: 800
                }}>
                  MB BANK
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowVietQrModal(false);
                  setPayOsPollingActive(false);
                }}
                style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#F6ECEA', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <Icon name="close" size={18} />
              </button>
            </div>

            {/* Title */}
            <h3 style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1.2rem', color: '#1F1B1A', margin: '0 0 4px' }}>
              Quét Mã Thanh Toán {currentTable?.name}
            </h3>
            <p style={{ fontSize: '0.78rem', color: '#89726B', margin: '0 0 16px' }}>
              Mã GD: <strong>#{payOsData?.orderCode || 'ROMS'}</strong> • Mở mọi App Ngân hàng để quét
            </p>

            {/* QR Code Container */}
            <div style={{
              background: '#FFF8F6',
              padding: '16px',
              borderRadius: '20px',
              border: payOsSettled ? '2px solid #059669' : '2px dashed #9D4124',
              display: 'inline-block',
              marginBottom: '14px',
              position: 'relative',
              boxShadow: '0 4px 16px rgba(157, 65, 36, 0.08)'
            }}>
              {payOsSettled ? (
                <div style={{ width: '220px', height: '220px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#ECFDF5', borderRadius: '14px' }}>
                  <Icon name="check_circle" size={64} style={{ color: '#059669', marginBottom: '8px' }} />
                  <span style={{ fontWeight: 800, color: '#065F46', fontSize: '1.05rem' }}>ĐÃ NHẬN TIỀN!</span>
                  <span style={{ fontSize: '0.75rem', color: '#047857' }}>Đang tự động xuất hóa đơn...</span>
                </div>
              ) : payOsData?.qrCode ? (
                <div style={{ width: '220px', height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FFFFFF', borderRadius: '12px', padding: '10px' }}>
                  <QRCodeSVG
                    value={payOsData.qrCode}
                    size={200}
                    level="M"
                    includeMargin={false}
                  />
                </div>
              ) : (
                <img
                  src={`https://img.vietqr.io/image/970422-${payOsData?.accountNumber || '0905982428'}-compact2.png?amount=${payOsData?.amount || finalCalculatedAmount}&addInfo=${encodeURIComponent(payOsData?.description || (payOsData?.orderCode ? String(payOsData.orderCode) : ''))}&accountName=${encodeURIComponent(payOsData?.accountName || 'NGO VIET BAO HUY')}`}
                  alt="VietQR MB Bank"
                  style={{ width: '220px', height: '220px', display: 'block', borderRadius: '12px' }}
                />
              )}
            </div>

            {/* Amount */}
            <div style={{ marginBottom: '14px' }}>
              <span style={{ fontSize: '0.75rem', color: '#89726B', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Số tiền thanh toán:</span>
              <span style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 900, fontSize: '1.65rem', color: '#9D4124' }}>
                {Number(payOsData?.amount || finalCalculatedAmount).toLocaleString('vi-VN')}₫
              </span>
            </div>

            {/* Bank details card */}
            <div style={{
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '16px',
              padding: '12px 14px',
              textAlign: 'left',
              fontSize: '0.8rem',
              marginBottom: '16px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: '#64748B' }}>Ngân hàng:</span>
                <span style={{ fontWeight: 700, color: '#0F172A' }}>MB Bank (Quân Đội)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ color: '#64748B' }}>Số tài khoản:</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontWeight: 800, color: '#0F172A', fontFamily: 'monospace', fontSize: '0.9rem' }}>
                    {payOsData?.accountNumber || '0905 982 428'}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(payOsData?.accountNumber || '0905982428');
                      showToast('Đã sao chép số tài khoản!');
                    }}
                    style={{ background: 'none', border: 'none', color: '#0284C7', cursor: 'pointer', padding: 0 }}
                    title="Sao chép"
                  >
                    <Icon name="content_copy" size={14} />
                  </button>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: '#64748B' }}>Chủ tài khoản:</span>
                <span style={{ fontWeight: 700, color: '#0F172A' }}>{payOsData?.accountName || 'NGO VIET BAO HUY'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: payOsData?.checkoutUrl ? '6px' : '0' }}>
                <span style={{ color: '#64748B' }}>Nội dung CK:</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontWeight: 800, color: '#9D4124', fontFamily: 'monospace' }}>
                    {payOsData?.description || (payOsData?.orderCode ? String(payOsData.orderCode) : '')}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(payOsData?.description || (payOsData?.orderCode ? String(payOsData.orderCode) : ''));
                      showToast('Đã sao chép nội dung chuyển khoản!');
                    }}
                    style={{ background: 'none', border: 'none', color: '#0284C7', cursor: 'pointer', padding: 0 }}
                    title="Sao chép"
                  >
                    <Icon name="content_copy" size={14} />
                  </button>
                </div>
              </div>
              {payOsData?.checkoutUrl && (
                <div style={{ borderTop: '1px dashed #E2E8F0', paddingTop: '6px', textAlign: 'center' }}>
                  <a
                    href={payOsData.checkoutUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: '0.75rem', color: '#0284C7', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}
                  >
                    Mở cổng thanh toán payOS <Icon name="open_in_new" size={13} />
                  </a>
                </div>
              )}
            </div>

            {/* Realtime Status Indicator */}
            <div style={{
              background: payOsSettled ? '#ECFDF5' : '#FFFBEB',
              border: payOsSettled ? '1px solid #A7F3D0' : '1px solid #FDE68A',
              borderRadius: '12px',
              padding: '10px 14px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              textAlign: 'left'
            }}>
              <div style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: payOsSettled ? '#059669' : '#D97706',
                boxShadow: payOsSettled ? '0 0 8px #059669' : '0 0 8px #D97706',
                flexShrink: 0
              }} />
              <div style={{ fontSize: '0.78rem', color: payOsSettled ? '#065F46' : '#92400E' }}>
                <div style={{ fontWeight: 700 }}>
                  {payOsSettled ? 'Đã nhận được tiền thành công!' : 'Đang chờ khách quét mã và chuyển tiền...'}
                </div>
                <div style={{ fontSize: '0.72rem', color: payOsSettled ? '#047857' : '#B45309' }}>
                  {payOsSettled ? 'Hóa đơn đang được hoàn tất...' : 'Tự động xác nhận ngay khi tiền vào tài khoản MB Bank (NAPAS 24/7).'}
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
              <button
                type="button"
                onClick={() => {
                  setShowVietQrModal(false);
                  setPayOsPollingActive(false);
                }}
                style={{
                  flex: 1,
                  padding: '11px',
                  borderRadius: '12px',
                  background: '#F1F5F9',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  color: '#475569',
                  cursor: 'pointer'
                }}
              >
                Hủy / Đóng
              </button>
              <button
                type="button"
                onClick={handleManualCheckPayOsStatus}
                disabled={isCheckingPayOsManual || payOsSettled}
                style={{
                  flex: 1.4,
                  padding: '11px',
                  borderRadius: '12px',
                  background: payOsSettled ? '#059669' : (isCheckingPayOsManual ? '#94A3B8' : '#0284C7'),
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  color: '#FFFFFF',
                  cursor: (isCheckingPayOsManual || payOsSettled) ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <Icon name={isCheckingPayOsManual ? "sync" : "refresh"} size={16} />
                {isCheckingPayOsManual ? 'Đang Kiểm Tra...' : (payOsSettled ? 'Đã Thanh Toán' : 'Kiểm Tra Thanh Toán')}
              </button>
            </div>

            {/* Nút thoát hiểm F&B: Xác nhận thủ công nếu ngân hàng bị nghẽn mạng nhưng tiền đã vào App MB */}
            <div>
              <button
                type="button"
                onClick={async () => {
                  const confirmed = await showConfirm({
                    title: 'Xác nhận thu tiền thủ công',
                    message: `Bạn đã kiểm tra App MB Bank và chắc chắn nhận đủ tiền cho bàn ${payOsData?.tableNumber || currentTable?.name}?\n\nHệ thống sẽ chốt đơn và xuất hóa đơn ngay lập tức.`,
                    confirmText: 'Đã nhận đủ tiền',
                    type: 'success'
                  });
                  if (confirmed) {
                    executeCheckoutPayment(true);
                  }
                }}
                disabled={isSubmittingCheckout || payOsSettled}
                style={{
                  width: '100%',
                  padding: '11px',
                  borderRadius: '12px',
                  background: '#059669',
                  border: 'none',
                  fontWeight: 800,
                  fontSize: '0.84rem',
                  color: '#FFFFFF',
                  cursor: (isSubmittingCheckout || payOsSettled) ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 10px rgba(5, 150, 105, 0.2)'
                }}
              >
                <Icon name="verified" size={18} />
                <span>Xác Nhận Đã Nhận Tiền (Thủ Công / App MB Đã Báo Có)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: XEM VÀ IN HÓA ĐƠN NHIỆT KHỔ K80 (80mm) */}
      {showReceiptModal && receiptData && (
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
            maxWidth: '440px',
            borderRadius: '24px',
            padding: '24px',
            boxShadow: '0 12px 36px rgba(0,0,0,0.25)',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Vùng in ấn nhiệt chuẩn khổ 80mm */}
            <div id="thermal-receipt-print" style={{ overflowY: 'auto', flex: 1 }}>
              {receiptData.isReprint && (
                <div style={{
                  border: '2px dashed #BA1A1A',
                  background: '#FFF5F5',
                  color: '#BA1A1A',
                  padding: '6px',
                  textAlign: 'center',
                  fontWeight: 900,
                  fontSize: '0.82rem',
                  borderRadius: '6px',
                  marginBottom: '10px'
                }}>
                  *** BẢN IN LẠI (REPRINT) ***
                  <div style={{ fontSize: '0.68rem', fontWeight: 600 }}>Không có giá trị thanh toán mới</div>
                </div>
              )}
              <div style={{ textAlign: 'center', paddingBottom: '14px', borderBottom: '1px dashed #CCC' }}>
                <div style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1.25rem', color: '#9D4124' }}>
                  {restaurantProfile.name}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#56423D' }}>{restaurantProfile.address}</div>
                <div style={{ fontSize: '0.78rem', color: '#56423D' }}>
                  {restaurantProfile.phone && `Hotline: ${restaurantProfile.phone}`}
                  {restaurantProfile.taxCode ? ` • MST: ${restaurantProfile.taxCode}` : ''}
                </div>
                <div style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1.15rem', color: '#1F1B1A', marginTop: '8px' }}>
                  {receiptData.isDraft ? 'PHIẾU TẠM TÍNH TIỀN' : (receiptData.isReprint ? 'HÓA ĐƠN THANH TOÁN (IN LẠI)' : 'HÓA ĐƠN THANH TOÁN')}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#89726B' }}>
                  Mã HĐ: {receiptData.billCode} • {receiptData.paymentTimeFormatted || new Date().toLocaleTimeString('vi-VN')}
                </div>
              </div>

              <div style={{ padding: '12px 0', borderBottom: '1px dashed #CCC', fontSize: '0.82rem', display: 'flex', justifyContent: 'space-between' }}>
                <span>Bàn: <strong>{receiptData.tableName}</strong></span>
                <span>Thu ngân: <strong>{receiptData.cashierName}</strong></span>
              </div>

              {/* Chi tiết từng món ăn */}
              <div style={{ padding: '12px 0', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.82rem' }}>
                {receiptData.items && receiptData.items.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div>{item.name || item.itemName}</div>
                      <div style={{ fontSize: '0.72rem', color: '#89726B' }}>
                        {item.quantity} x {Number(item.unitPrice).toLocaleString('vi-VN')}₫
                      </div>
                    </div>
                    <div style={{ fontWeight: 700 }}>
                      {Number(item.subtotal).toLocaleString('vi-VN')}₫
                    </div>
                  </div>
                ))}
              </div>

              {/* Tổng kết tiền */}
              <div style={{ padding: '12px 0', borderTop: '1px dashed #CCC', display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Cộng tiền món:</span>
                  <span>{Number(receiptData.subtotal).toLocaleString('vi-VN')}₫</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Thuế VAT (8%):</span>
                  <span>{Number(receiptData.taxAmount || 0).toLocaleString('vi-VN')}₫</span>
                </div>
                {Number(receiptData.discountAmount || 0) > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#BA1A1A' }}>
                    <span>Giảm giá:</span>
                    <span>-{Number(receiptData.discountAmount).toLocaleString('vi-VN')}₫</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1.15rem', color: '#9D4124', marginTop: '6px', paddingTop: '6px', borderTop: '1.5px solid #1F1B1A' }}>
                  <span>TỔNG CỘNG:</span>
                  <span>{Number(receiptData.finalAmount).toLocaleString('vi-VN')}₫</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#56423D', marginTop: '4px' }}>
                  <span>Hình thức thanh toán:</span>
                  <strong>{receiptData.paymentMethodLabel || receiptData.paymentMethod}</strong>
                </div>
              </div>

              <div style={{ textAlign: 'center', fontSize: '0.75rem', color: '#89726B', padding: '12px 0 6px' }}>
                {receiptData.isDraft ? '* Quý khách vui lòng kiểm tra lại món trước khi thanh toán *' : (restaurantProfile.footerMessage || 'Cảm ơn Quý khách & Hẹn gặp lại!')}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }} className="no-print">
              <button
                type="button"
                onClick={() => {
                  setShowReceiptModal(false);
                  setReceiptData(null);
                }}
                style={{ flex: 1, padding: '11px', borderRadius: '12px', background: '#F0E6E4', border: 'none', fontWeight: 700, fontSize: '0.85rem', color: '#56423D', cursor: 'pointer' }}
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                style={{ flex: 1.4, padding: '11px', borderRadius: '12px', background: '#9D4124', border: 'none', fontWeight: 700, fontSize: '0.85rem', color: '#FFFFFF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <Icon name="print" size={18} /> In Ra Máy Nhiệt K80
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: QUẢN LÝ DUYỆT HỦY MÓN (PIN 6 SỐ) */}
      {showVoidModal && itemToVoid && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100,
          padding: '20px'
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '24px',
            maxWidth: '440px',
            width: '100%',
            padding: '28px',
            border: '2px solid #BA1A1A'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ width: '46px', height: '46px', borderRadius: '14px', background: '#FFDAD6', color: '#BA1A1A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="verified_user" size={26} />
              </div>
              <div>
                <h3 style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1.25rem', color: '#1F1B1A', margin: 0 }}>
                  Xác Nhận Hủy Món
                </h3>
                <span style={{ fontSize: '0.8rem', color: '#BA1A1A', fontWeight: 700 }}>
                  Yêu cầu Quản lý xác nhận mã PIN 6 số
                </span>
              </div>
            </div>

            <div style={{ background: '#FFF8F6', border: '1px dashed #EAE0DE', borderRadius: '14px', padding: '12px 16px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 800, color: '#1F1B1A', fontSize: '0.95rem' }}>
                  {itemToVoid.itemName || itemToVoid.name} ({itemToVoid.quantity} phần)
                </span>
                <span style={{ fontWeight: 800, color: '#BA1A1A', fontSize: '0.95rem' }}>
                  {Number(itemToVoid.subtotal).toLocaleString('vi-VN')}₫
                </span>
              </div>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#56423D', marginBottom: '6px' }}>
                Lý Do Hủy Món <span style={{ color: '#BA1A1A' }}>*</span>
              </label>
              <select
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #EAE0DE', fontSize: '0.85rem', fontWeight: 600, color: '#1F1B1A', background: '#FFFFFF', outline: 'none' }}
              >
                <option value="Khách đổi ý trước khi chế biến">Khách đổi ý trước khi chế biến</option>
                <option value="Món hết nguyên liệu / Bếp báo hủy">Món hết nguyên liệu / Bếp báo hủy</option>
                <option value="Nhân viên order nhầm món">Nhân viên order nhầm món</option>
                <option value="Khách khiếu nại chất lượng món ăn">Khách khiếu nại chất lượng món ăn</option>
              </select>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#56423D', marginBottom: '6px' }}>
                Mã PIN Quản Lý (MGR-001: 123456) <span style={{ color: '#BA1A1A' }}>*</span>
              </label>
              <input
                type="password"
                maxLength={6}
                placeholder="••••••"
                value={managerPin}
                onChange={(e) => {
                  setManagerPin(e.target.value);
                  setVoidError(null);
                }}
                autoFocus
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: voidError ? '2px solid #BA1A1A' : '1px solid #EAE0DE',
                  background: '#FDF7F5',
                  fontSize: '1.25rem',
                  letterSpacing: '8px',
                  textAlign: 'center',
                  fontWeight: 800,
                  color: '#1F1B1A',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              {voidError && (
                <div style={{ color: '#BA1A1A', fontSize: '0.78rem', fontWeight: 700, marginTop: '6px', textAlign: 'center' }}>
                  {voidError}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setShowVoidModal(false)}
                style={{ flex: 1, padding: '12px', borderRadius: '12px', background: '#F0E6E4', border: 'none', fontWeight: 700, fontSize: '0.88rem', color: '#56423D', cursor: 'pointer' }}
              >
                Hủy Bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmVoid}
                style={{ flex: 1.4, padding: '12px', borderRadius: '12px', background: '#BA1A1A', border: 'none', fontWeight: 700, fontSize: '0.88rem', color: '#FFFFFF', cursor: 'pointer' }}
              >
                Xác Nhận Hủy Món
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: QUẢN LÝ DUYỆT CHỐT CA VÀ BÀN GIAO KÉT (PIN 6 SỐ) */}
      {showShiftApprovalModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100,
          padding: '20px'
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '24px',
            maxWidth: '520px',
            width: '100%',
            padding: '26px',
            border: '2px solid #9D4124'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ width: '46px', height: '46px', borderRadius: '14px', background: '#FFDBC9', color: '#9D4124', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="shield_person" size={26} />
              </div>
              <div>
                <h3 style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1.25rem', color: '#1F1B1A', margin: 0 }}>
                  Quản Lý Phê Duyệt Chốt Ca
                </h3>
                <span style={{ fontSize: '0.8rem', color: '#9D4124', fontWeight: 700 }}>
                  Đối soát số liệu két tiền & chốt sổ ca làm việc
                </span>
              </div>
            </div>

            <div style={{ background: '#FFF8F6', borderRadius: '16px', border: '1px solid #F0E6E4', padding: '14px', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.82rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#89726B' }}>Thu ngân chốt ca:</span>
                <strong>{user?.fullName || 'Thu Ngân POS'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#89726B' }}>Tổng doanh thu ca:</span>
                <strong style={{ color: '#9D4124' }}>{Number(shiftSummary?.totalRevenue || 0).toLocaleString('vi-VN')}₫</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#89726B' }}>Tiền mặt thực đếm:</span>
                <strong>{totalCountedCash.toLocaleString('vi-VN')}₫</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#89726B' }}>Tình trạng đối soát két:</span>
                <span style={{
                  padding: '2px 8px', borderRadius: '6px', fontWeight: 800,
                  background: cashDifference === 0 ? '#DDE8AB' : '#FFDAD6',
                  color: cashDifference === 0 ? '#181E00' : '#BA1A1A'
                }}>
                  {cashDifference === 0 ? '✓ Khớp 100% (0₫)' : `Lệch: ${cashDifference.toLocaleString('vi-VN')}₫`}
                </span>
              </div>
            </div>

            {cashDifference !== 0 && (
              <div style={{
                background: '#FFF0F0',
                border: '1.5px solid #BA1A1A',
                borderRadius: '14px',
                padding: '12px 14px',
                marginBottom: '16px',
                display: 'flex',
                gap: '10px',
                alignItems: 'flex-start'
              }}>
                <Icon name="warning" size={22} style={{ color: '#BA1A1A', flexShrink: 0, marginTop: '2px' }} />
                <div style={{ fontSize: '0.8rem', color: '#93000A', lineHeight: 1.4 }}>
                  <strong>Cảnh báo chênh lệch két tiền: {cashDifference > 0 ? `Thừa +${cashDifference.toLocaleString('vi-VN')}₫` : `Thiếu ${cashDifference.toLocaleString('vi-VN')}₫`}!</strong>
                  <div style={{ marginTop: '3px', color: '#BA1A1A', fontSize: '0.76rem' }}>
                    * Quy định ROMS: Quản lý bắt buộc phải nhập mã PIN 6 số và ghi rõ lý do giải trình chênh lệch để bảo đảm tính minh bạch kiểm toán két tiền.
                  </div>
                </div>
              </div>
            )}

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#56423D', marginBottom: '6px' }}>
                {cashDifference !== 0 ? (
                  <span>Lý Do / Giải Trình Chênh Lệch Két Tiền <span style={{ color: '#BA1A1A' }}>* (Bắt buộc)</span></span>
                ) : (
                  <span>Ghi Chú Phê Duyệt Của Quản Lý (Tùy chọn):</span>
                )}
              </label>
              <textarea
                rows={2}
                value={shiftManagerNote}
                placeholder={cashDifference !== 0 ? "Nhập nguyên nhân thừa/thiếu tiền (vd: thối nhầm khách bàn 3, tiền lẻ đầu ca...)" : "Ghi chú ca trực..."}
                onChange={(e) => {
                  setShiftManagerNote(e.target.value);
                  setShiftApprovalError(null);
                }}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: (cashDifference !== 0 && !shiftManagerNote.trim()) ? '1.5px solid #BA1A1A' : '1px solid #EAE0DE',
                  fontSize: '0.82rem',
                  fontFamily: 'inherit',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#56423D', marginBottom: '6px' }}>
                Nhập Mã PIN Quản Lý (MGR-001: 123456) <span style={{ color: '#BA1A1A' }}>*</span>
              </label>
              <input
                type="password"
                maxLength={6}
                placeholder="••••••"
                value={shiftManagerPin}
                onChange={(e) => {
                  setShiftManagerPin(e.target.value);
                  setShiftApprovalError(null);
                }}
                autoFocus
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: shiftApprovalError ? '2px solid #BA1A1A' : '1px solid #EAE0DE',
                  background: '#FDF7F5',
                  fontSize: '1.25rem',
                  letterSpacing: '8px',
                  textAlign: 'center',
                  fontWeight: 800,
                  color: '#1F1B1A',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              {shiftApprovalError && (
                <div style={{ color: '#BA1A1A', fontSize: '0.78rem', fontWeight: 700, marginTop: '6px', textAlign: 'center' }}>
                  {shiftApprovalError}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setShowShiftApprovalModal(false)}
                style={{ flex: 1, padding: '12px', borderRadius: '12px', background: '#F0E6E4', border: 'none', fontWeight: 700, fontSize: '0.88rem', color: '#56423D', cursor: 'pointer' }}
              >
                Hủy Bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmShiftClose}
                style={{ flex: 1.5, padding: '12px', borderRadius: '12px', background: '#9D4124', border: 'none', fontWeight: 800, fontSize: '0.88rem', color: '#FFFFFF', cursor: 'pointer' }}
              >
                Quản Lý Xác Nhận Chốt Ca
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: CẢNH BÁO THANH TOÁN BÀN ĐANG PHỤC VỤ / CÒN MÓN CHƯA XONG */}
      {showDiningWarningModal && billPreview && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(31, 27, 26, 0.7)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1200,
          padding: '20px'
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '24px',
            maxWidth: '520px',
            width: '100%',
            padding: '28px',
            border: '2px solid #D97706',
            boxShadow: '0 16px 40px rgba(0,0,0,0.3)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon name="warning" size={28} />
              </div>
              <div>
                <h3 style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1.25rem', color: '#1F1B1A', margin: 0 }}>
                  Cảnh Báo Thanh Toán Bàn Đang Phục Vụ
                </h3>
                <span style={{ fontSize: '0.8rem', color: '#B45309', fontWeight: 700 }}>
                  Kiểm tra an toàn luồng F&B trước khi đóng phiên ăn của {currentTable?.name}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '18px' }}>
              {activeBill && !activeBill.hasPaymentRequest && !activeBill.isDraftPrinted && (
                <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '12px', padding: '12px', fontSize: '0.83rem', color: '#92400E', display: 'flex', gap: '10px' }}>
                  <Icon name="restaurant" size={20} style={{ color: '#D97706', flexShrink: 0 }} />
                  <div>
                    <strong>Bàn chưa gửi yêu cầu tính tiền:</strong> Khách hoặc phục vụ chưa bấm chuông tính tiền và chưa in phiếu tạm tính. Bấm thanh toán ngay có thể đóng nhầm bàn khách đang ngồi ăn.
                  </div>
                </div>
              )}

              {activeBill && (activeBill.unservedCount || 0) > 0 && (
                <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '12px', padding: '12px', fontSize: '0.83rem', color: '#991B1B', display: 'flex', gap: '10px' }}>
                  <Icon name="soup_kitchen" size={20} style={{ color: '#DC2626', flexShrink: 0 }} />
                  <div>
                    <strong>Bếp chưa làm xong:</strong> Bàn còn <strong style={{ textDecoration: 'underline' }}>{activeBill.unservedCount} phần món đang chế biến / chờ tiếp nhận</strong>. Khách có thể bị thu tiền cho món chưa được ăn!
                  </div>
                </div>
              )}
            </div>

            <div style={{ background: '#F8FAFC', padding: '12px 14px', borderRadius: '12px', border: '1px solid #E2E8F0', marginBottom: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 700, color: '#1E293B' }}>
                <input
                  type="checkbox"
                  checked={confirmUnservedChecked}
                  onChange={(e) => setConfirmUnservedChecked(e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: '#9D4124', cursor: 'pointer' }}
                />
                <span>Tôi đã xác nhận với khách/bếp và chịu trách nhiệm chốt hóa đơn này</span>
              </label>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setShowDiningWarningModal(false)}
                style={{ flex: 1, padding: '12px', borderRadius: '12px', background: '#F0E6E4', border: 'none', fontWeight: 700, fontSize: '0.85rem', color: '#56423D', cursor: 'pointer' }}
              >
                Hủy Bỏ
              </button>
              <button
                type="button"
                onClick={handlePrintDraftBill}
                style={{ flex: 1.4, padding: '12px', borderRadius: '12px', background: '#FFDBC9', border: '1px solid #FFB59F', fontWeight: 800, fontSize: '0.85rem', color: '#753400', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <Icon name="print" size={18} /> In Phiếu Tạm Tính
              </button>
              <button
                type="button"
                disabled={!confirmUnservedChecked}
                onClick={handleConfirmDiningCheckout}
                style={{
                  flex: 1.5,
                  padding: '12px',
                  borderRadius: '12px',
                  background: !confirmUnservedChecked ? '#CBD5E1' : '#9D4124',
                  border: 'none',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  color: '#FFFFFF',
                  cursor: !confirmUnservedChecked ? 'not-allowed' : 'pointer'
                }}
              >
                Xác Nhận Thanh Toán
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 6: XÁC NHẬN ĐÓNG PHIÊN BÀN TRỐNG (0đ) */}
      {showCloseEmptyModal && currentTable && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100,
          padding: '20px'
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '24px',
            maxWidth: '460px',
            width: '100%',
            padding: '28px',
            border: '2px solid #BA1A1A',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ width: '46px', height: '46px', borderRadius: '14px', background: '#FFDAD6', color: '#BA1A1A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="event_busy" size={26} />
              </div>
              <div>
                <h3 style={{ fontFamily: "'Epilogue', sans-serif", fontWeight: 800, fontSize: '1.25rem', color: '#1F1B1A', margin: 0 }}>
                  Đóng Phiên Bàn Trống (0đ)
                </h3>
                <span style={{ fontSize: '0.8rem', color: '#BA1A1A', fontWeight: 700 }}>
                  Giải phóng bàn khi khách không dùng món
                </span>
              </div>
            </div>

            <div style={{ background: '#FFF8F6', border: '1px dashed #EAE0DE', borderRadius: '14px', padding: '12px 16px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontWeight: 800, color: '#1F1B1A', fontSize: '1rem' }}>
                  {currentTable.name} • {currentTable.zoneName}
                </span>
                <span style={{ fontSize: '0.78rem', background: '#FFDBC9', color: '#753400', padding: '2px 8px', borderRadius: '6px', fontWeight: 700 }}>
                  Tổng tiền: 0đ
                </span>
              </div>
              <div style={{ fontSize: '0.78rem', color: '#89726B' }}>
                {activeBill?.guestCount || currentTable.capacity || 4} khách • Giờ vào: {activeBill?.timeIn || '--:--'}
              </div>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#56423D', marginBottom: '6px' }}>
                Lý Do Đóng Bàn <span style={{ color: '#BA1A1A' }}>*</span>
              </label>
              <select
                value={closeEmptyReason}
                onChange={(e) => setCloseEmptyReason(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #EAE0DE', fontSize: '0.85rem', fontWeight: 600, color: '#1F1B1A', background: '#FFFFFF', outline: 'none' }}
              >
                <option value="Khách rời đi, không dùng món">Khách rời đi, không dùng món</option>
                <option value="Nhân viên mở nhầm bàn">Nhân viên mở nhầm bàn</option>
                <option value="Khách đổi sang bàn khác">Khách đổi sang bàn khác</option>
                <option value="Khách hủy hẹn đột xuất">Khách hủy hẹn đột xuất</option>
                <option value="Lý do khác">Lý do khác</option>
              </select>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#56423D', marginBottom: '8px' }}>
                Trạng Thái Bàn Sau Khi Đóng:
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '10px', border: closeEmptyTargetStatus === 'AVAILABLE' ? '1.5px solid #00875A' : '1px solid #EAE0DE', background: closeEmptyTargetStatus === 'AVAILABLE' ? '#E3FCEF' : '#FFFFFF', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="closeTargetStatus"
                    value="AVAILABLE"
                    checked={closeEmptyTargetStatus === 'AVAILABLE'}
                    onChange={() => setCloseEmptyTargetStatus('AVAILABLE')}
                    style={{ accentColor: '#00875A' }}
                  />
                  <div>
                    <strong style={{ fontSize: '0.82rem', color: '#006644' }}>Sẵn sàng đón khách ngay (AVAILABLE)</strong>
                    <div style={{ fontSize: '0.72rem', color: '#5E6C84' }}>Phù hợp khi mở nhầm bàn hoặc khách vừa ngồi chưa dùng đồ</div>
                  </div>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '10px', border: closeEmptyTargetStatus === 'DIRTY' ? '1.5px solid #FF8B00' : '1px solid #EAE0DE', background: closeEmptyTargetStatus === 'DIRTY' ? '#FFF0B3' : '#FFFFFF', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="closeTargetStatus"
                    value="DIRTY"
                    checked={closeEmptyTargetStatus === 'DIRTY'}
                    onChange={() => setCloseEmptyTargetStatus('DIRTY')}
                    style={{ accentColor: '#FF8B00' }}
                  />
                  <div>
                    <strong style={{ fontSize: '0.82rem', color: '#8A5800' }}>Cần nhân viên dọn dẹp (DIRTY)</strong>
                    <div style={{ fontSize: '0.72rem', color: '#5E6C84' }}>Báo cho phục vụ ra dọn ly nước/khăn trước khi đón khách mới</div>
                  </div>
                </label>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                disabled={isClosingEmpty}
                onClick={() => setShowCloseEmptyModal(false)}
                style={{ flex: 1, padding: '12px', borderRadius: '12px', background: '#F0E6E4', border: 'none', fontWeight: 700, fontSize: '0.85rem', color: '#56423D', cursor: 'pointer' }}
              >
                Quay Lại
              </button>
              <button
                type="button"
                disabled={isClosingEmpty}
                onClick={handleConfirmCloseEmpty}
                style={{
                  flex: 1.5,
                  padding: '12px',
                  borderRadius: '12px',
                  background: '#BA1A1A',
                  border: 'none',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  color: '#FFFFFF',
                  cursor: isClosingEmpty ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                {isClosingEmpty ? (
                  <>
                    <Icon name="sync" size={18} style={{ animation: 'spin 1s linear infinite' }} />
                    <span>Đang Đóng Bàn...</span>
                  </>
                ) : (
                  <>
                    <Icon name="check" size={18} />
                    <span>Xác Nhận Đóng Bàn</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
