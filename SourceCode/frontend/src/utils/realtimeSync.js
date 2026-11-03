/**
 * ROMS Realtime Synchronization Engine
 * Kết hợp WebSocket STOMP (Spring Boot broker) + HTML5 BroadcastChannel + localStorage Fallback
 * 
 * - Đảm bảo đồng bộ thời gian thực đa thiết bị (Điện thoại khách, Tablet bồi bàn, Màn hình Bếp KDS, POS thu ngân)
 * - Tự động tái kết nối (Auto Reconnect) và chống trùng lặp sự kiện (Deduplication)
 */

import { Client } from '@stomp/stompjs';

const CHANNEL_NAME = 'roms_realtime_sync';
const STORAGE_KEY = 'roms_realtime_sync_event';

// Danh sách callback lắng nghe sự kiện chung
const globalSubscribers = new Set();
// Danh sách callback lắng nghe trạng thái kết nối
const connectionStateSubscribers = new Set();
// Bàn ăn cụ thể đang được subscribe riêng (/topic/dining/{tableId})
const diningTableSubscribers = new Map(); // tableId -> Set of callbacks

let broadcastChannelInstance = null;
let stompClientInstance = null;
let isConnected = false;

// Tránh xử lý trùng lặp sự kiện trong vòng 350ms
const recentEventSignatures = new Map();

const cleanOldSignatures = () => {
  const now = Date.now();
  for (const [key, timestamp] of recentEventSignatures.entries()) {
    if (now - timestamp > 2000) {
      recentEventSignatures.delete(key);
    }
  }
};

const getEventSignature = (data) => {
  if (!data || typeof data !== 'object') return '';
  const type = data.type || '';
  const tableId = data.tableId || '';
  const status = data.status || '';
  const orderId = data.orderId || (data.payload && data.payload.orderId) || '';
  return `${type}_${tableId}_${status}_${orderId}`;
};

const isDuplicateEvent = (data) => {
  cleanOldSignatures();
  const sig = getEventSignature(data);
  if (!sig) return false;
  const now = Date.now();
  if (recentEventSignatures.has(sig)) {
    const prev = recentEventSignatures.get(sig);
    if (now - prev < 350) {
      return true;
    }
  }
  recentEventSignatures.set(sig, now);
  return false;
};

// Dispatch tới toàn bộ callback
const dispatchToSubscribers = (data, source = 'WS') => {
  if (!data || typeof data !== 'object') return;
  if (isDuplicateEvent(data)) return;

  // 1. Gửi tới các subscribers toàn cục
  globalSubscribers.forEach((cb) => {
    try {
      cb(data);
    } catch (err) {
      console.warn('[RealtimeSync] Subscriber error:', err);
    }
  });

  // 2. Gửi tới subscriber riêng của bàn ăn nếu có tableId
  if (data.tableId && diningTableSubscribers.has(Number(data.tableId))) {
    const tableCallbacks = diningTableSubscribers.get(Number(data.tableId));
    tableCallbacks.forEach((cb) => {
      try {
        cb(data);
      } catch (err) {
        console.warn('[RealtimeSync] Dining table subscriber error:', err);
      }
    });
  }
};

// Khởi tạo BroadcastChannel nội bộ cùng trình duyệt
const getBroadcastChannel = () => {
  if (typeof BroadcastChannel !== 'undefined') {
    if (!broadcastChannelInstance) {
      try {
        broadcastChannelInstance = new BroadcastChannel(CHANNEL_NAME);
        broadcastChannelInstance.addEventListener('message', (event) => {
          if (event.data) {
            dispatchToSubscribers(event.data, 'BC');
          }
        });
      } catch (e) {
        console.warn('[RealtimeSync] BroadcastChannel init error:', e);
      }
    }
  }
  return broadcastChannelInstance;
};

// Lắng nghe StorageEvent (khi localStorage được ghi từ tab khác)
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY && e.newValue) {
      try {
        const data = JSON.parse(e.newValue);
        dispatchToSubscribers(data, 'STORAGE');
      } catch (err) {
        // Bỏ qua nếu dữ liệu không phải JSON hợp lệ
      }
    }
  });
}

// Xác định URL WebSocket phù hợp với môi trường
const resolveBrokerUrl = () => {
  if (typeof window === 'undefined') return '';
  if (import.meta.env?.VITE_WS_URL) {
    return import.meta.env.VITE_WS_URL;
  }

  const isHttps = window.location.protocol === 'https:';
  const wsProto = isHttps ? 'wss:' : 'ws:';
  const hostname = window.location.hostname || 'localhost';

  // Nếu đang chạy qua Vite dev server (thường là port 5173), dùng proxy /ws-roms-native
  if (window.location.port === '5173') {
    return `${wsProto}//${window.location.host}/ws-roms-native`;
  }

  // Kết nối trực tiếp đến backend Spring Boot trên port 8080 nếu chạy tách biệt
  return `${wsProto}//${hostname}:8080/ws-roms-native`;
};

// Khởi tạo STOMP Client
const initStompClient = () => {
  if (stompClientInstance || typeof window === 'undefined') {
    return stompClientInstance;
  }

  const brokerURL = resolveBrokerUrl();
  console.log('[WebSocket STOMP] Đang khởi tạo kết nối tới:', brokerURL);

  stompClientInstance = new Client({
    brokerURL,
    reconnectDelay: 4000,
    heartbeatIncoming: 4000,
    heartbeatOutgoing: 4000,
    debug: () => {
      // Bật debug nếu cần kiểm tra luồng STOMP frames
    },
    onConnect: (frame) => {
      isConnected = true;
      console.log('[WebSocket STOMP] Đã kết nối thành công tới máy chủ ROMS!');
      notifyConnectionState(true);

      // 1. Subscribe 6 topic nghiệp vụ cốt lõi
      const topics = [
        '/topic/tables',
        '/topic/kitchen',
        '/topic/service-requests',
        '/topic/orders',
        '/topic/pos',
        '/topic/staff' // <-- THÊM DÒNG NÀY ĐỂ NHẬN SỰ KIỆN LOGIN / LOGOUT TỨC THÌ
      ];

      topics.forEach((topic) => {
        try {
          stompClientInstance.subscribe(topic, (message) => {
            try {
              const body = JSON.parse(message.body);
              dispatchToSubscribers(body, `WS:${topic}`);
            } catch (jsonErr) {
              console.warn(`[WebSocket STOMP] Lỗi parse JSON từ topic ${topic}:`, jsonErr);
            }
          });
        } catch (subErr) {
          console.warn(`[WebSocket STOMP] Lỗi subscribe ${topic}:`, subErr);
        }
      });

      // 2. Tự động subscribe lại các bàn ăn đang được quan sát
      diningTableSubscribers.forEach((callbacks, tableId) => {
        subscribeStompDiningTopic(tableId);
      });
    },
    onDisconnect: () => {
      isConnected = false;
      console.log('[WebSocket STOMP] Đã ngắt kết nối với máy chủ.');
      notifyConnectionState(false);
    },
    onStompError: (frame) => {
      console.warn('[WebSocket STOMP] Broker error:', frame.headers?.message);
    },
    onWebSocketError: (event) => {
      console.warn('[WebSocket STOMP] Lỗi kết nối WebSocket:', event);
    }
  });

  try {
    stompClientInstance.activate();
  } catch (actErr) {
    console.warn('[WebSocket STOMP] Lỗi activate client:', actErr);
  }

  // Khởi động đồng thời BroadcastChannel
  getBroadcastChannel();

  return stompClientInstance;
};

// Helper subscribe topic riêng theo từng bàn /topic/dining/{tableId}
const activeStompSubscriptions = new Map();

const subscribeStompDiningTopic = (tableId) => {
  if (!stompClientInstance || !isConnected) return;
  const topic = `/topic/dining/${tableId}`;
  if (activeStompSubscriptions.has(topic)) return;

  try {
    const sub = stompClientInstance.subscribe(topic, (message) => {
      try {
        const body = JSON.parse(message.body);
        dispatchToSubscribers(body, `WS:${topic}`);
      } catch (err) {
        console.warn(`[WebSocket STOMP] Lỗi parse ${topic}:`, err);
      }
    });
    activeStompSubscriptions.set(topic, sub);
  } catch (err) {
    console.warn(`[WebSocket STOMP] Lỗi subscribe ${topic}:`, err);
  }
};

const notifyConnectionState = (status) => {
  connectionStateSubscribers.forEach((cb) => {
    try {
      cb(status);
    } catch (e) {
      console.warn('[RealtimeSync] Connection state callback error:', e);
    }
  });
};

/**
 * Kiểm tra xem kết nối WebSocket STOMP hiện tại có đang hoạt động hay không
 */
export const isRealtimeConnected = () => isConnected;

/**
 * Đăng ký theo dõi thay đổi trạng thái kết nối WebSocket STOMP
 * @param {Function} callback (isConnected: boolean) => void
 * @returns {Function} cleanup function
 */
export const onRealtimeConnectionChange = (callback) => {
  if (typeof callback !== 'function') return () => { };
  connectionStateSubscribers.add(callback);
  callback(isConnected);
  return () => {
    connectionStateSubscribers.delete(callback);
  };
};

/**
 * Phát sự kiện đồng bộ realtime tới tất cả các thiết bị khác qua WebSocket STOMP
 * và dự phòng bằng BroadcastChannel + localStorage
 * 
 * @param {Object|string} eventData Ví dụ: { type: 'PAYMENT_REQUEST', tableId: 22 } hoặc 'CALL_WAITER'
 * @param {Object} [extraData] Dữ liệu bổ sung nếu eventData là chuỗi
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

  // Đánh dấu sự kiện này vừa được phát để tab hiện tại không xử lý lặp
  isDuplicateEvent(payload);

  // 1. Gửi qua WebSocket STOMP tới máy chủ (để phân tán tới các thiết bị di động, tablet, KDS khác)
  // try {
  //   const client = initStompClient();
  //   if (client && client.connected) {
  //     client.publish({
  //       destination: '/app/broadcast',
  //       body: JSON.stringify(payload)
  //     });
  //   }
  // } catch (wsErr) {
  //   console.warn('[RealtimeSync] STOMP publish error:', wsErr);
  // }

  // 2. Gửi qua BroadcastChannel nội bộ (đồng bộ siêu tốc <3ms giữa các tab cùng trình duyệt)
  try {
    const ch = getBroadcastChannel();
    if (ch) {
      ch.postMessage(payload);
    }
  } catch (err) {
    console.warn('[RealtimeSync] BroadcastChannel post error:', err);
  }

  // 3. Dự phòng bằng localStorage storage event
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (err) {
    // Bỏ qua nếu quota hạn chế
  }
};

/**
 * Lắng nghe toàn bộ sự kiện đồng bộ realtime từ hệ thống (WebSocket STOMP + BroadcastChannel)
 * @param {Function} onMessageCallback Callback nhận payload sự kiện: (payload) => void
 * @returns {Function} cleanup function để hủy listener khi component unmount
 */
export const subscribeRealtimeEvents = (onMessageCallback) => {
  if (typeof onMessageCallback !== 'function') {
    return () => { };
  }

  // Đảm bảo STOMP Client đã được khởi tạo
  initStompClient();

  globalSubscribers.add(onMessageCallback);

  return () => {
    globalSubscribers.delete(onMessageCallback);
  };
};

/**
 * Lắng nghe sự kiện dành riêng cho một bàn ăn cụ thể (/topic/dining/{tableId})
 * Sử dụng cho màn hình khách dùng bữa (CustomerTrackingPage) hoặc Waiter theo dõi bàn
 * 
 * @param {number|string} tableId ID của bàn ăn
 * @param {Function} callback (payload) => void
 * @returns {Function} cleanup function
 */
export const subscribeDiningTableEvents = (tableId, callback) => {
  if (!tableId || typeof callback !== 'function') {
    return () => { };
  }

  initStompClient();
  const numericId = Number(tableId);

  if (!diningTableSubscribers.has(numericId)) {
    diningTableSubscribers.set(numericId, new Set());
    subscribeStompDiningTopic(numericId);
  }

  diningTableSubscribers.get(numericId).add(callback);

  return () => {
    const cbs = diningTableSubscribers.get(numericId);
    if (cbs) {
      cbs.delete(callback);
      if (cbs.size === 0) {
        diningTableSubscribers.delete(numericId);
        const topic = `/topic/dining/${numericId}`;
        const sub = activeStompSubscriptions.get(topic);
        if (sub) {
          try {
            sub.unsubscribe();
          } catch (e) { }
          activeStompSubscriptions.delete(topic);
        }
      }
    }
  };
};
