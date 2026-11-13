package com.romsteam.roms.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * DTO phản hồi kết quả Chốt ca két tiền (Cash Shift Closure)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CloseShiftResponse {
    private String shiftType;
    private String cashierUsername;
    private String cashierFullName;
    private String approvedByManager;
    private BigDecimal countedCash;
    private BigDecimal theoreticalCash;
    private BigDecimal cashDifference;
    private String reason;
    private String handoverNote;
    private LocalDateTime closedAt;
    private String status;
    private String message;
}
