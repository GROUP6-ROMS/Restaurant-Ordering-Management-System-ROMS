/**
 * ROMS Realtime Synchronization Helper
 * Đồng bộ sự kiện thời gian thực giữa các tab trình duyệt (Waiter, Cashier POS, Kitchen KDS)
 * Sử dụng BroadcastChannel API chuẩn HTML5 (<5ms latency) kết hợp dự phòng localStorage StorageEvent.
 */

const CHANNEL_NAME = 'roms_realtime_sync';
const STORAGE_KEY = 'roms_realtime_sync_event';

// Giữ BroadcastChannel singleton tồn tại xuyên suốt phiên làm việc của tab
let broadcastChannelInstance = null;

const getBroadcastChannel = () => {
  if (typeof BroadcastChannel !== 'undefined') {
    if (!broadcastChannelInstance) {
      try {
        broadcastChannelInstance = new BroadcastChannel(CHANNEL_NAME);
      } catch (e) {
        console.warn('[RealtimeSync] Cannot create BroadcastChannel:', e);
      }
    }
  }
  return broadcastChannelInstance;
};

/**
 * Phát sự kiện đồng bộ realtime tới tất cả các tab trình duyệt khác cùng origin
 * @param {Object|string} eventData Ví dụ: { type: 'PAYMENT_REQUEST', tableId: 22 } hoặc 'CALL_WAITER'
 * @param {Object} [extraData] Dữ liệu bổ sung nếu eventData là chuỗi tên sự kiện
 */
export const broadcastRealtimeEvent = (eventData, extraData = {}) => {
  let payload;
  if (typeof eventData === 'string') {
    payload = {
      type: eventData,
      ...(extraData && typeof extraData === 'object' ? extraData : {}),
      timestamp: Date.now()
    };
  } else if (eventData && typeof eventData === 'object') {
    payload = {
      ...eventData,
      timestamp: Date.now()
    };
  } else {
    return;
  }

  // 1. BroadcastChannel API (chuẩn HTML5, giữ channel mở, không gọi close() để tránh hủy IPC message)
  try {
    const ch = getBroadcastChannel();
    if (ch) {
      ch.postMessage(payload);
    }
  } catch (err) {
    console.warn('[RealtimeSync] BroadcastChannel post error:', err);
  }

  // 2. Dự phòng bằng localStorage storage event (hoạt động trên 100% môi trường kể cả WebView/iFrame)
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (err) {
    // Bỏ qua nếu quota hoặc storage bị hạn chế
  }
};

/**
 * Lắng nghe sự kiện đồng bộ từ các tab khác
 * @param {Function} onMessageCallback Callback nhận payload sự kiện: (payload) => void
 * @returns {Function} cleanup function để hủy listener khi component unmount
 */
export const subscribeRealtimeEvents = (onMessageCallback) => {
  if (typeof onMessageCallback !== 'function') {
    return () => {};
  }

  // Tránh xử lý trùng lặp khi cả BroadcastChannel và StorageEvent cùng kích hoạt trong vòng 400ms
  let lastProcessedKey = '';
  let lastProcessedTime = 0;

  const handleIncomingMessage = (data) => {
    if (!data || typeof data !== 'object') return;
    const msgKey = `${data.type}_${data.tableId || ''}_${data.timestamp || ''}`;
    const now = Date.now();
    if (msgKey === lastProcessedKey && now - lastProcessedTime < 400) {
      return; // Bỏ qua trùng lặp
    }
    lastProcessedKey = msgKey;
    lastProcessedTime = now;
    onMessageCallback(data);
  };

  // 1. Lắng nghe qua BroadcastChannel
  const ch = getBroadcastChannel();
  const handleBcMessage = (event) => {
    if (event.data) {
      handleIncomingMessage(event.data);
    }
  };

  if (ch) {
    ch.addEventListener('message', handleBcMessage);
  }

  // 2. Lắng nghe qua StorageEvent (khi localStorage được ghi từ tab khác)
  const handleStorage = (e) => {
    if (e.key === STORAGE_KEY && e.newValue) {
      try {
        const data = JSON.parse(e.newValue);
        handleIncomingMessage(data);
      } catch (err) {
        // Bỏ qua nếu dữ liệu không phải JSON hợp lệ
      }
    }
  };
  window.addEventListener('storage', handleStorage);

  // Return cleanup function
  return () => {
    if (ch) {
      try {
        ch.removeEventListener('message', handleBcMessage);
      } catch (e) {}
    }
    window.removeEventListener('storage', handleStorage);
  };
};
