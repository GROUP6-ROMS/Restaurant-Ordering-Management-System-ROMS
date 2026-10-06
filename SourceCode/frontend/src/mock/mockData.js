// ===================================================================
// ROMS MOCK DATA - Du lieu gia lap phuc vu lap trinh Frontend doc lap
// Khong phu thuoc vao Backend khi chua khoi chay server
// ===================================================================

export const MOCK_CATEGORIES = [
  { id: 1, name: "Khai Vị", description: "Các món nhẹ kích thích vị giác đầu bữa", displayOrder: 1, icon: "Salad" },
  { id: 2, name: "Món Chính", description: "Các món đặc sắc chế biến từ thịt bò, gà, hải sản", displayOrder: 2, icon: "UtensilsCrossed" },
  { id: 3, name: "Đồ Uống Đóng Chai", description: "Nước giải khát có sẵn, nước khoáng, nước ngọt & bia ướp lạnh", displayOrder: 3, icon: "Coffee" },
  { id: 4, name: "Tráng Miệng", description: "Bánh ngọt thủ công, kem & chè thanh mát", displayOrder: 4, icon: "Cake" },
];

export const MOCK_MENU_ITEMS = [
  // Khai vị
  {
    id: 101,
    categoryId: 1,
    name: "Nem Rán Hải Sản Giòn Rụm",
    description: "Tôm mực tươi gói bánh tráng phơi sương, chiên vàng ươm chấm sốt mayonnaise chua ngọt đặc biệt.",
    price: 89000,
    imageUrl: "https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80",
    isAvailable: true,
    tag: "Bestseller",
    prepTime: "10-15 phút"
  },
  {
    id: 102,
    categoryId: 1,
    name: "Salad Cá Hồi Sốt Chanh Leo",
    description: "Cá hồi Na Uy áp chảo nhẹ kết hợp xà lách Romaine, cà chua bi, hạt óc chó và sốt chanh leo chua dịu.",
    price: 119000,
    imageUrl: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop&q=80",
    isAvailable: true,
    tag: "Healthy",
    prepTime: "8-10 phút"
  },
  {
    id: 103,
    categoryId: 1,
    name: "Khoai Tây Múi Cau Lắc Rong Biển",
    description: "Khoai tây củ Bỉ cắt múi dày chiên vàng, lắc bột rong biển thơm lừng cùng phô mai béo ngậy.",
    price: 59000,
    imageUrl: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=600&auto=format&fit=crop&q=80",
    isAvailable: true,
    tag: "Món Ăn Vặt",
    prepTime: "8 phút"
  },

  // Món chính
  {
    id: 201,
    categoryId: 2,
    name: "Bò Bít Tết Sốt Tiêu Đen ROMS Signature",
    description: "Thăn bò Wagyu nướng chín tới vừa mềm mọng, ăn kèm măng tây, khoai tây nghiền và sốt tiêu đen đậm đà.",
    price: 289000,
    imageUrl: "https://images.unsplash.com/photo-1558030006-450675393462?w=600&auto=format&fit=crop&q=80",
    isAvailable: true,
    tag: "Chef's Choice",
    prepTime: "15-20 phút"
  },
  {
    id: 202,
    categoryId: 2,
    name: "Sườn Nướng BBQ Tảng Sốt Mật Ong",
    description: "Sườn heo tuyển chọn ướp sốt BBQ mật ong 24 giờ, nướng than hoa mềm róc xương thơm nức mũi.",
    price: 249000,
    imageUrl: "https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80",
    isAvailable: true,
    tag: "Yêu Thích",
    prepTime: "18-22 phút"
  },
  {
    id: 203,
    categoryId: 2,
    name: "Mì Ý Tôm Hùm Sốt Kem Cay",
    description: "Sợi mì Spaghetti tươi xào cùng tôm sú to, sốt kem sữa béo nhẹ pha chút ớt cay nồng phong cách Ý-Á.",
    price: 189000,
    imageUrl: "https://images.unsplash.com/photo-1621996346565-e3d5d628102a?w=600&auto=format&fit=crop&q=80",
    isAvailable: true,
    tag: "Món Mới",
    prepTime: "12-15 phút"
  },
  {
    id: 204,
    categoryId: 2,
    name: "Cơm Chiên Hải Sản Hoàng Kim",
    description: "Cơm hạt ngọc xào trứng muối bọc vàng óng, ngập tràn tôm sú, mực ống và sò điệp tươi.",
    price: 139000,
    imageUrl: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=600&auto=format&fit=crop&q=80",
    isAvailable: false, // Hết hàng để test giao diện Sold-Out
    tag: "Tạm Hết",
    prepTime: "12 phút"
  },

  // Đồ uống đóng chai & có sẵn (Chuyển order cho Waiter lấy từ tủ mát, không qua Bar)
  {
    id: 301,
    categoryId: 3,
    name: "Coca-Cola Sleek Lon 320ml (Ướp Lạnh)",
    description: "Nước ngọt có gas ướp lạnh giải khát sảng khoái, phục vụ kèm ly đá và lát chanh tươi.",
    price: 25000,
    imageUrl: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600&auto=format&fit=crop&q=80",
    isAvailable: true,
    tag: "Bestseller",
    prepTime: "1-2 phút (Waiter phục vụ)"
  },
  {
    id: 302,
    categoryId: 3,
    name: "Nước Khoáng Aquafina Chai 500ml",
    description: "Nước uống tinh khiết tiệt trùng đóng chai cao cấp, phục vụ ướp lạnh mang ra bàn ngay.",
    price: 15000,
    imageUrl: "https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=600&auto=format&fit=crop&q=80",
    isAvailable: true,
    tag: "Tinh Khiết",
    prepTime: "1-2 phút (Waiter phục vụ)"
  },
  {
    id: 303,
    categoryId: 3,
    name: "Bia Tiger Crystal Lon 330ml (Bạc)",
    description: "Bia tinh lọc lạnh sảng khoái, đậm đà êm đằm, phục vụ ướp lạnh kèm ly đá pha lê.",
    price: 35000,
    imageUrl: "https://images.unsplash.com/photo-1608270199026-646e7f8e32c0?w=600&auto=format&fit=crop&q=80",
    isAvailable: true,
    tag: "Ưa Thích",
    prepTime: "1-2 phút (Waiter phục vụ)"
  },
  {
    id: 304,
    categoryId: 3,
    name: "Trà Ô Long TEA+ Plus Chai 455ml",
    description: "Trà Ô Long vị thanh nhẹ, chứa chất chống oxy hóa OTPP, ướp lạnh sẵn trong tủ mát.",
    price: 22000,
    imageUrl: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600&auto=format&fit=crop&q=80",
    isAvailable: true,
    tag: "Thanh Mát",
    prepTime: "1-2 phút (Waiter phục vụ)"
  },

  // Tráng miệng
  {
    id: 401,
    categoryId: 4,
    name: "Bánh Tiramisu Rượu Kahlua Cổ Điển",
    description: "Bánh mềm tan trong miệng, ngấm đẫm hương cà phê espresso và rượu mùi Kahlua, phủ bột cacao Bỉ thượng hạng.",
    price: 65000,
    imageUrl: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=600&auto=format&fit=crop&q=80",
    isAvailable: true,
    tag: "Ngọt Ngào",
    prepTime: "3 phút"
  },
  {
    id: 402,
    categoryId: 4,
    name: "Panna Cotta Sốt Dâu Tây Tươi",
    description: "Kem sữa nấu mềm dẻo mịn màng, phủ sốt mứt dâu tây Đà Lạt chua ngọt kích thích.",
    price: 55000,
    imageUrl: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&auto=format&fit=crop&q=80",
    isAvailable: true,
    tag: "Yêu Thích",
    prepTime: "3 phút"
  }
];

export const MOCK_TABLES = [
  { id: 1, tableNumber: "Bàn 01", capacity: 4, status: "AVAILABLE", qrToken: "table-01-token-12345", currentSessionId: null },
  { id: 2, tableNumber: "Bàn 02", capacity: 2, status: "OCCUPIED", qrToken: "table-02-token-23456", currentSessionId: 101, guestCount: 2, orderTotal: 347000 },
  { id: 3, tableNumber: "Bàn 03", capacity: 4, status: "AVAILABLE", qrToken: "table-03-token-34567", currentSessionId: null },
  { id: 4, tableNumber: "Bàn 04", capacity: 6, status: "OCCUPIED", qrToken: "table-04-token-45678", currentSessionId: 102, guestCount: 5, orderTotal: 824000 },
  { id: 5, tableNumber: "Bàn 05", capacity: 4, status: "OCCUPIED", qrToken: "table-05-secret-token", currentSessionId: 103, guestCount: 3, orderTotal: 497000 },
  { id: 6, tableNumber: "Bàn 06", capacity: 2, status: "DIRTY", qrToken: "table-06-token-67890", currentSessionId: null },
  { id: 7, tableNumber: "Bàn 07", capacity: 8, status: "RESERVED", qrToken: "table-07-token-78901", currentSessionId: null, reservationInfo: "Khách: Anh Dũng (0901234567) - 19:30" },
  { id: 8, tableNumber: "Bàn 08", capacity: 4, status: "AVAILABLE", qrToken: "table-08-token-89012", currentSessionId: null },
  { id: 9, tableNumber: "VIP 1", capacity: 10, status: "OCCUPIED", qrToken: "table-vip1-token-90123", currentSessionId: 104, guestCount: 8, orderTotal: 1850000 },
  { id: 10, tableNumber: "VIP 2", capacity: 12, status: "AVAILABLE", qrToken: "table-vip2-token-01234", currentSessionId: null },
];

export const MOCK_ACTIVE_ORDERS = [
  {
    id: 1,
    tableNumber: "Bàn 05",
    orderCode: "ORD-20261005-001",
    status: "COOKING",
    orderTime: "12:15",
    elapsedMinutes: 12,
    items: [
      { id: 1, name: "Bò Bít Tết Sốt Tiêu Đen ROMS Signature", quantity: 1, note: "Chín vừa (Medium-Rare)", status: "COOKING" },
      { id: 2, name: "Nem Rán Hải Sản Giòn Rụm", quantity: 2, note: "Cho thêm sốt mayonnaise", status: "READY" }
    ]
  },
  {
    id: 2,
    tableNumber: "Bàn 02",
    orderCode: "ORD-20261005-002",
    status: "READY",
    orderTime: "12:20",
    elapsedMinutes: 7,
    items: [
      { id: 4, name: "Mì Ý Tôm Hùm Sốt Kem Cay", quantity: 1, note: "Không cay", status: "READY" },
      { id: 5, name: "Salad Cá Hồi Sốt Chanh Leo", quantity: 1, note: "Sốt để riêng", status: "READY" }
    ]
  },
  {
    id: 3,
    tableNumber: "Bàn 04",
    orderCode: "ORD-20261005-003",
    status: "PENDING",
    orderTime: "12:24",
    elapsedMinutes: 3,
    items: [
      { id: 6, name: "Sườn Nướng BBQ Tảng Sốt Mật Ong", quantity: 1, note: "Làm nóng giúp bàn", status: "PENDING" },
      { id: 7, name: "Khoai Tây Múi Cau Lắc Rong Biển", quantity: 1, note: "", status: "PENDING" }
    ]
  }
];
