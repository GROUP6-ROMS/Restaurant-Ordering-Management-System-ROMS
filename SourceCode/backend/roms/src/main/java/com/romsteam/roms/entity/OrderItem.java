package com.romsteam.roms.entity;

import com.romsteam.roms.entity.enums.OrderItemStatus;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

// Khai bao Entity dai dien cho bang chi tiet mon duoc goi
@Entity
@Table(name = "order_items") // Bang luu chi tiet tung mon goi trong SQL Server
public class OrderItem {

    // Khoa chinh chi tiet mon
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Khoa ngoai lien ket nguoc lai dot goi mon (Order)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    // Khoa ngoai tro sang mon an trong thuc don (MenuItem)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "menu_item_id", nullable = false)
    private MenuItem menuItem;

    // So luong mon khach goi (vi du: 2 phan, 3 ly)
    @Column(name = "quantity", nullable = false)
    private Integer quantity;

    // Don gia tai thoi diem goi mon (Luu gia tinh de sau nay mon co doi gia niem yet thi don cu khong bi sai tien)
    @Column(name = "unit_price", nullable = false, precision = 12, scale = 2)
    private BigDecimal unitPrice;

    // Thanh tien cua dong mon nay: subtotal = quantity * unitPrice
    @Column(name = "subtotal", nullable = false, precision = 12, scale = 2)
    private BigDecimal subtotal;

    // Ghi chu rieng cho mon nay gui xuong bep (vi du: "It cay", "Khong hanh", "Nhieu da")
    @Column(name = "note", length = 255)
    private String note;

    // Trang thai nau mon tren man hinh bep KDS (PENDING, COOKING, READY, SERVED, CANCELLED)
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private OrderItemStatus status = OrderItemStatus.PENDING;

    // Thoi diem tao mon
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    // Thoi diem cap nhat trang thai che bien gan nhat
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // ===================================================================
    // CONSTRUCTORS (HAM KHOI TAO)
    // ===================================================================

    // Constructor mac dinh khong tham so (bat buoc cho Hibernate/JPA)
    public OrderItem() {
        this.status = OrderItemStatus.PENDING;
    }

    // Constructor day du tham so
    public OrderItem(Long id, Order order, MenuItem menuItem, Integer quantity, BigDecimal unitPrice, BigDecimal subtotal, String note, OrderItemStatus status, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.order = order;
        this.menuItem = menuItem;
        this.quantity = quantity;
        this.unitPrice = unitPrice;
        this.subtotal = subtotal;
        this.note = note;
        this.status = status != null ? status : OrderItemStatus.PENDING;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    // ===================================================================
    // GETTERS & SETTERS (PHUONG THUC DOC VA GHI DU LIEU)
    // ===================================================================

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Order getOrder() {
        return order;
    }

    public void setOrder(Order order) {
        this.order = order;
    }

    public MenuItem getMenuItem() {
        return menuItem;
    }

    public void setMenuItem(MenuItem menuItem) {
        this.menuItem = menuItem;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }

    public BigDecimal getUnitPrice() {
        return unitPrice;
    }

    public void setUnitPrice(BigDecimal unitPrice) {
        this.unitPrice = unitPrice;
    }

    public BigDecimal getSubtotal() {
        return subtotal;
    }

    public void setSubtotal(BigDecimal subtotal) {
        this.subtotal = subtotal;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }

    public OrderItemStatus getStatus() {
        return status;
    }

    public void setStatus(OrderItemStatus status) {
        this.status = status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
