package com.romsteam.roms.service.serviceImpl;

import com.romsteam.roms.dto.request.LoginRequest;
import com.romsteam.roms.dto.request.VerifyManagerPinRequest;
import com.romsteam.roms.dto.response.LoginResponse;
import com.romsteam.roms.entity.Staff;
import com.romsteam.roms.entity.StaffSchedule;
import com.romsteam.roms.entity.enums.ShiftType;
import com.romsteam.roms.entity.enums.UserRole;
import com.romsteam.roms.exception.AppException;
import com.romsteam.roms.repository.StaffRepository;
import com.romsteam.roms.repository.StaffScheduleRepository;
import com.romsteam.roms.security.JwtTokenProvider;
import com.romsteam.roms.service.AuthService;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AuthServiceImpl implements AuthService {

    private final AuthenticationManager authenticationManager;
    private final StaffRepository staffRepository;
    private final StaffScheduleRepository staffScheduleRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final PasswordEncoder passwordEncoder;

    public AuthServiceImpl(AuthenticationManager authenticationManager,
                           StaffRepository staffRepository,
                           StaffScheduleRepository staffScheduleRepository,
                           JwtTokenProvider jwtTokenProvider,
                           PasswordEncoder passwordEncoder) {
        this.authenticationManager = authenticationManager;
        this.staffRepository = staffRepository;
        this.staffScheduleRepository = staffScheduleRepository;
        this.jwtTokenProvider = jwtTokenProvider;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public LoginResponse login(LoginRequest request) {
        try {
            // 1. Thuc hien xac thuc username va pinCode qua AuthenticationManager
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getUsername(),
                            request.getPinCode()
                    )
            );

            // 2. Luu vao SecurityContext
            SecurityContextHolder.getContext().setAuthentication(authentication);

            // 3. Lay thong tin nhan vien tu CSDL
            Staff staff = staffRepository.findByUsername(request.getUsername())
                    .orElseThrow(() -> new AppException("Nhân viên không tồn tại", HttpStatus.NOT_FOUND));

            // 4. KIỂM TRA ĐIỀU KIỆN PHÂN CÔNG CA TRỰC THEO NGÀY (MULTI-DAY SHIFT SCHEDULING):
            // Nếu KHÔNG phải Quản lý (MANAGER), bắt buộc phải có lịch trực trong ngày hôm nay từ bảng staff_schedules (Đăng ký qua Script SQL)
            String currentShiftName = "NONE";
            if (staff.getRole() != UserRole.MANAGER) {
                LocalDate today = LocalDate.now();
                LocalTime now = LocalTime.now();
                DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");

                // 4.1. Tìm tất cả ca trực của nhân viên trong ngày hôm nay từ bảng staff_schedules
                List<StaffSchedule> todaySchedules = staffScheduleRepository.findByStaffAndWorkDate(staff, today);

                // Nếu hôm nay chưa được đăng ký ca trực trong CSDL
                if (todaySchedules == null || todaySchedules.isEmpty()) {
                    throw new AppException(
                            String.format("Bạn không có lịch làm việc trong ngày hôm nay (%s)! Vui lòng liên hệ Quản lý.",
                                    today.format(dateFormatter)),
                            HttpStatus.FORBIDDEN
                    );
                }

                // 4.2. Tìm ca trực: Ưu tiên ca khớp với giờ thực tế nếu nhân viên được phân nhiều ca trong ngày
                StaffSchedule activeSchedule = todaySchedules.stream()
                        .filter(s -> {
                            if (s.getShiftType() == null) return false;
                            LocalTime start = s.getShiftType().getStartTime();
                            LocalTime end = s.getShiftType().getEndTime();
                            if (start != null && end != null) {
                                return !now.isBefore(start.minusMinutes(15)) && !now.isAfter(end);
                            }
                            return true;
                        })
                        .findFirst()
                        .orElse(null);

                // Nếu ngoài khung giờ chuẩn nhưng đang trong giai đoạn test (ShiftType.isWithinShift trả về true), cho phép vào ca được xếp
                if (activeSchedule == null) {
                    activeSchedule = todaySchedules.stream()
                            .filter(s -> s.getShiftType() != null && s.getShiftType().isWithinShift(now))
                            .findFirst()
                            .orElse(todaySchedules.get(0));
                }

                currentShiftName = activeSchedule.getShiftType().name();
            }

            // 5. Cap nhat trang thai dang trong ca truc
            staff.setIsOnShift(true);
            staffRepository.save(staff);

            // 6. Sinh token JWT
            String token = jwtTokenProvider.generateToken(authentication);

            // 7. Dong goi LoginResponse tra ve cho frontend (lay shift truc tiep tu staff_schedules)
            return LoginResponse.builder()
                    .accessToken(token)
                    .tokenType("Bearer")
                    .id(staff.getId())
                    .username(staff.getUsername())
                    .fullName(staff.getFullName())
                    .role(staff.getRole().name())
                    .assignedShift(currentShiftName)
                    .isOnShift(staff.getIsOnShift())
                    .build();

        } catch (BadCredentialsException e) {
            throw new AppException("Sai tên đăng nhập hoặc mã PIN!", HttpStatus.UNAUTHORIZED);
        }
    }

    @Override
    public boolean verifyManagerPin(VerifyManagerPinRequest request) {
        Staff manager = staffRepository.findByUsername(request.getManagerUsername())
                .orElseThrow(() -> new AppException("Không tìm thấy tài khoản quản lý", HttpStatus.NOT_FOUND));

        if (manager.getRole() != UserRole.MANAGER) {
            throw new AppException("Tài khoản này không có quyền Quản lý để phê duyệt!", HttpStatus.FORBIDDEN);
        }

        if (!passwordEncoder.matches(request.getPinCode(), manager.getPinCode())) {
            throw new AppException("Mã PIN Quản lý không chính xác!", HttpStatus.UNAUTHORIZED);
        }

        return true;
    }

    @Override
    public void logout(String username) {
        if (username == null || username.trim().isEmpty()) return;

        staffRepository.findByUsername(username).ifPresent(staff -> {
            // Khi nhan vien dang xuat, cap nhat isOnShift = false
            staff.setIsOnShift(false);
            staffRepository.save(staff);
        });
    }
}
