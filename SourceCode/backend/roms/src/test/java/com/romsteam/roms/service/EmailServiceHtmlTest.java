package com.romsteam.roms.service.serviceImpl;

import com.romsteam.roms.entity.MenuItem;
import com.romsteam.roms.entity.Reservation;
import com.romsteam.roms.entity.ReservationItem;
import com.romsteam.roms.service.serviceImpl.EmailServiceImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;

class EmailServiceHtmlTest {

    private final EmailServiceImpl emailService = new EmailServiceImpl();

    @Test
    @DisplayName("1. OTP Email HTML renders without exception")
    void buildOtpHtmlContent_RendersSuccessfully() {
        assertDoesNotThrow(() -> {
            // Act
            var html = emailService.buildOtpHtmlContent("Quản lý Ca Trực", "123456");
            assertThat(html).contains("Quản lý Ca Trực");
            assertThat(html).contains("123456");
        });
    }

    @Test
    @DisplayName("2. Reservation Created Email HTML renders all required fields without exception")
    void buildReservationCreatedHtml_RendersSuccessfully() {
        assertDoesNotThrow(() -> {
            Reservation r = Reservation.builder()
                    .customerName("Anh Tuấn FPT")
                    .customerPhone("0912345678")
                    .customerEmail("tuan@gmail.com")
                    .bookingCode("RES-20261115-001")
                    .guestCount(6)
                    .requestedZone("VIP")
                    .note("Bàn gần cửa sổ, tiệc sinh nhật")
                    .reservationTime(LocalDateTime.of(2026, 11, 15, 18, 30))
                    .items(List.of(
                            ReservationItem.builder()
                                    .menuItem(MenuItem.builder().name("Bò Wagyu Nướng Đá").price(BigDecimal.valueOf(450000)).build())
                                    .quantity(2)
                                    .subtotal(BigDecimal.valueOf(900000))
                                    .build()
                    ))
                    .build();

            // Act
            var html = emailService.buildReservationCreatedHtml(r);
            assertThat(html).contains("Anh Tuấn FPT");
            assertThat(html).contains("RES-20261115-001");
            assertThat(html).contains("0912345678");
            assertThat(html).contains("Phòng VIP Riêng Tư");
            assertThat(html).contains("Bò Wagyu Nướng Đá");
            assertThat(html).contains("900.000₫");
            assertThat(html).doesNotContain("{{");
        });
    }

    @Test
    @DisplayName("3. Reservation Confirmed Email HTML renders table info and safety lock without exception")
    void buildReservationConfirmedHtml_RendersSuccessfully() {
        assertDoesNotThrow(() -> {
            Reservation r = Reservation.builder()
                    .customerName("Chị Lan")
                    .customerPhone("0987654321")
                    .customerEmail("lan@gmail.com")
                    .bookingCode("RES-20261115-002")
                    .guestCount(4)
                    .reservationTime(LocalDateTime.of(2026, 11, 15, 19, 0))
                    .build();

            // Act
            var html = emailService.buildReservationConfirmedHtml(r, "VIP-02", "Phòng VIP Riêng Tư");
            assertThat(html).contains("Chị Lan");
            assertThat(html).contains("VIP-02");
            assertThat(html).contains("Phòng VIP Riêng Tư");
            assertThat(html).contains("RES-20261115-002");
            assertThat(html).contains("Cam kết giữ chỗ an toàn (Buffer Lock)");
            assertThat(html).doesNotContain("{{");
        });
    }

    @Test
    @DisplayName("4. Reservation Cancelled Email HTML renders cancel reason without exception")
    void buildReservationCancelledHtml_RendersSuccessfully() {
        assertDoesNotThrow(() -> {
            Reservation r = Reservation.builder()
                    .customerName("Anh Hải")
                    .bookingCode("RES-20261115-003")
                    .reservationTime(LocalDateTime.of(2026, 11, 15, 20, 0))
                    .build();

            // Act
            var html = emailService.buildReservationCancelledHtml(r, "Khách bận việc đột xuất");
            assertThat(html).contains("Anh Hải");
            assertThat(html).contains("RES-20261115-003");
            assertThat(html).contains("Khách bận việc đột xuất");
            assertThat(html).doesNotContain("{{");
        });
    }
}
