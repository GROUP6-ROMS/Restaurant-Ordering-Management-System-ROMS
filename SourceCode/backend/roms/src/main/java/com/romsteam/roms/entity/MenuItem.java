package com.romsteam.roms.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Entity đại diện cho một món ăn hoặc đồ uống trong thực đơn nhà hàng (Bảng: menu_items).
 * Áp dụng Project Lombok nhằm loại bỏ mã thừa Boilerplate (constructors, getters, setters).
 */
@Entity
@Table(name = "menu_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MenuItem {

    // Khóa chính tự tăng (IDENTITY) trong SQL Server
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Khóa ngoại trỏ đến danh mục món ăn (FetchType.LAZY để tối ưu truy vấn hiệu năng)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    // Mã quản lý kho/sản phẩm SKU (duy nhất, ví dụ: "DISH-001", "DRK-001")
    @Column(name = "sku", nullable = false, unique = true, length = 50)
    private String sku;

    // Tên món ăn (hỗ trợ tiếng Việt có dấu Unicode qua NVARCHAR)
    @Column(name = "name", nullable = false, columnDefinition = "NVARCHAR(150)")
    private String name;

    // Mô tả chi tiết món ăn (thành phần dinh dưỡng, hương vị, hướng dẫn thưởng thức)
    @Column(name = "description", columnDefinition = "NVARCHAR(500)")
    private String description;

    // Giá bán niêm yết cho khách (Dùng BigDecimal để đảm bảo chính xác tuyệt đối trong tài chính)
    @Column(name = "price", nullable = false, precision = 12, scale = 2)
    private BigDecimal price;

    // Giá vốn nguyên liệu / giá nhập hàng (Dùng để tính Lợi nhuận gộp và Tỷ suất Margin mà không cần Recipe BOM)
    @Builder.Default
    @Column(name = "cost_price", nullable = false, precision = 12, scale = 2, columnDefinition = "DECIMAL(12,2) DEFAULT 0")
    private BigDecimal costPrice = BigDecimal.ZERO;

    // Trạm điều phối xử lý món: "KITCHEN" (nấu tại bếp) hoặc "WAITER" (nước đóng lon/chai do phục vụ lấy từ tủ mát)
    @Builder.Default
    @Column(name = "station", nullable = false, length = 20, columnDefinition = "NVARCHAR(20) DEFAULT 'KITCHEN'")
    private String station = "KITCHEN";

    // Nhãn nổi bật hiển thị trên giao diện (Ví dụ: "Bestseller", "Chef's Choice", "Món Mới", "Healthy")
    @Column(name = "tag", length = 50)
    private String tag;

    // Đường dẫn ảnh món ăn (URL hình ảnh CDN hoặc đường dẫn máy chủ)
    @Column(name = "image_url", length = 500)
    private String imageUrl;

    // Trạng thái còn hàng hay hết hàng (true = đang bán, false = 86'd / tạm hết hàng)
    @Builder.Default
    @Column(name = "is_available", nullable = false)
    private Boolean isAvailable = true;

    // Định mức suất ăn phục vụ tối đa trong ngày (null = không giới hạn)
    @Column(name = "daily_stock")
    private Integer dailyStock;

    // Số suất ăn còn lại thực tế trong ngày (null = không giới hạn)
    @Column(name = "remaining_stock")
    private Integer remainingStock;

    /**
     * Giảm số lượng tồn kho còn lại khi khách gọi món
     * @param quantity số lượng đặt
     */
    public void decreaseStock(int quantity) {
        if (remainingStock != null) {
            this.remainingStock = Math.max(0, this.remainingStock - quantity);
            if (this.remainingStock <= 0) {
                this.isAvailable = false;
                this.tag = "Tạm Hết (86d)";
            }
        }
    }

    /**
     * Bổ sung hoặc cài đặt lại tồn kho trong ngày
     */
    public void replenishStock(Integer newStock) {
        this.dailyStock = newStock;
        this.remainingStock = newStock;
        if (newStock != null && newStock > 0) {
            this.isAvailable = true;
            if ("Tạm Hết (86d)".equals(this.tag)) {
                this.tag = "Đang Bán";
            }
        }
    }

    // Thứ tự hiển thị sắp xếp trên thực đơn (số nhỏ đứng trước)
    @Builder.Default
    @Column(name = "display_order")
    private Integer displayOrder = 0;

    // Trạng thái xóa mềm: true = món đang kinh doanh, false = đã xóa khỏi thực đơn
    @Builder.Default
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    // Thời điểm tạo món ăn (tự động điền lúc INSERT)
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    // Thời điểm cập nhật món ăn gần nhất (tự động cập nhật lúc UPDATE)
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;



    // Constructor hỗ trợ tương thích ngược cho code cũ (11 tham số)
    public MenuItem(Long id, Category category, String name, String description, BigDecimal price, String imageUrl, Boolean isAvailable, Integer displayOrder, Boolean isActive, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.category = category;
        this.name = name;
        this.description = description;
        this.price = price;
        this.imageUrl = imageUrl;
        this.isAvailable = isAvailable != null ? isAvailable : true;
        this.displayOrder = displayOrder != null ? displayOrder : 0;
        this.isActive = isActive != null ? isActive : true;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.sku = "DISH-" + (id != null ? id : System.currentTimeMillis());
        this.costPrice = BigDecimal.ZERO;
        this.station = "KITCHEN";
        this.tag = "Món Ăn";
    }

    // ===================================================================
    // HÀM TIỆN ÍCH NGHIỆP VỤ (BUSINESS LOGIC HELPERS)
    // ===================================================================

    /**
     * Tính lợi nhuận gộp trên mỗi đơn vị món bán ra: Profit = Price - CostPrice
     */
    public BigDecimal calculateProfit() {
        if (price != null && costPrice != null) {
            return price.subtract(costPrice);
        }
        return BigDecimal.ZERO;
    }

    /**
     * Tính tỷ suất lợi nhuận gộp phần trăm: Margin % = ((Price - CostPrice) / Price) * 100
     */
    public Double calculateMarginPercent() {
        if (price != null && costPrice != null && price.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal profit = price.subtract(costPrice);
            return profit.divide(price, 4, java.math.RoundingMode.HALF_UP)
                         .multiply(BigDecimal.valueOf(100))
                         .doubleValue();
        }
        return 0.0;
    }
}
