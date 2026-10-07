package com.romsteam.roms.entity;

import com.romsteam.roms.entity.enums.ShiftType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "staff_schedules", uniqueConstraints = {
        @UniqueConstraint(name = "UQ_staff_date_shift", columnNames = {"staff_id", "work_date", "shift_type"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StaffSchedule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Nhan vien duoc phan ca
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "staff_id", nullable = false)
    private Staff staff;

    // Ngay lam viec (LocalDate, dinh dang YYYY-MM-DD trong SQL Server)
    @Column(name = "work_date", nullable = false)
    private LocalDate workDate;

    // Ca lam viec trong ngay (MORNING, EVENING)
    @Enumerated(EnumType.STRING)
    @Column(name = "shift_type", nullable = false, length = 30)
    private ShiftType shiftType;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
