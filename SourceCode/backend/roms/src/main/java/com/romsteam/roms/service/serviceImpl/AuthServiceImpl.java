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

import org.springframework.beans.factory.annotation.Value;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.HashMap;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class AuthServiceImpl implements AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthServiceImpl.class);

    private final AuthenticationManager authenticationManager;
    private final StaffRepository staffRepository;
    private final StaffScheduleRepository staffScheduleRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.security.master-recovery-key:ROMS-RECOVERY-2026}")
    private String masterRecoveryKey = "ROMS-RECOVERY-2026";

    // Lưu trữ OTP tạm thời trong bộ nhớ thread-safe với thời hạn 5 phút
    private static class OtpEntry {
        final String otp;
        final LocalDateTime expiry;

        OtpEntry(String otp, LocalDateTime expiry) {
            this.otp = otp;
            this.expiry = expiry;
        }

        boolean isExpired() {
            return LocalDateTime.now().isAfter(expiry);
        }
    }

    private final Map<String, OtpEntry> otpStorage = new ConcurrentHashMap<>();

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
        String username = request.getUsername() != null ? request.getUsername().trim() : "";
        String pinCode = request.getPinCode() != null ? request.getPinCode().trim() : "";

        // 1. Kiểm tra tài khoản nhân viên có tồn tại trong CSDL không
        Staff staff = staffRepository.findByUsername(username)
                .orElseThrow(() -> new AppException("Sai tên đăng nhập hoặc mã PIN!", HttpStatus.UNAUTHORIZED));

        // 2. Chặn đăng nhập nếu tài khoản đã bị khóa (do nhập sai 5 lần hoặc Quản lý tạm khóa)
        if (staff.isLocked()) {
            String lockMsg = (staff.getFailedPinAttempts() != null && staff.getFailedPinAttempts() >= 5)
                    ? "Tài khoản của bạn đã bị KHÓA do nhập sai mã PIN 5 lần liên tiếp! Vui lòng liên hệ Quản lý để mở khóa."
                    : "Tài khoản của bạn hiện đang bị khóa hoặc đã ngưng hoạt động! Vui lòng liên hệ Quản lý.";
            throw new AppException(lockMsg, HttpStatus.FORBIDDEN);
        }

        // 3. Kiểm tra tính hợp lệ của mã PIN
        if (!passwordEncoder.matches(pinCode, staff.getPinCode())) {
            staff.recordFailedAttempt();
            staffRepository.save(staff);

            if (staff.isLocked()) {
                throw new AppException(
                        "Tài khoản của bạn đã bị KHÓA do nhập sai mã PIN 5 lần liên tiếp! Vui lòng liên hệ Quản lý để mở khóa.",
                        HttpStatus.FORBIDDEN
                );
            } else {
                int remaining = 5 - (staff.getFailedPinAttempts() != null ? staff.getFailedPinAttempts() : 0);
                throw new AppException(
                        "Mã PIN không chính xác! Bạn còn " + remaining + " lần thử trước khi tài khoản bị khóa.",
                        HttpStatus.UNAUTHORIZED
                );
            }
        }

        // 4. Mã PIN chính xác -> Reset số lần nhập sai PIN về 0
        if (staff.getFailedPinAttempts() != null && staff.getFailedPinAttempts() > 0) {
            staff.resetFailedAttempts();
            staffRepository.save(staff);
        }

        try {
            // 5. Xác thực qua AuthenticationManager để SecurityContext có đầy đủ Principal & Authorities
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(username, pinCode)
            );
            SecurityContextHolder.getContext().setAuthentication(authentication);

            // 6. KIỂM TRA ĐIỀU KIỆN PHÂN CÔNG CA TRỰC THEO NGÀY (MULTI-DAY SHIFT SCHEDULING):
            // Nếu KHÔNG phải Quản lý (MANAGER), bắt buộc phải có lịch trực trong ngày hôm nay từ bảng staff_schedules (Đăng ký qua Script SQL)
            String currentShiftName = "NONE";
            if (staff.getRole() != UserRole.MANAGER) {
                LocalDate today = LocalDate.now();
                LocalTime now = LocalTime.now();
                DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");

                // 6.1. Tìm tất cả ca trực của nhân viên trong ngày hôm nay từ bảng staff_schedules
                List<StaffSchedule> todaySchedules = staffScheduleRepository.findByStaffAndWorkDate(staff, today);

                // Nếu hôm nay chưa được đăng ký ca trực trong CSDL
                if (todaySchedules == null || todaySchedules.isEmpty()) {
                    throw new AppException(
                            String.format("Bạn không có lịch làm việc trong ngày hôm nay (%s)! Vui lòng liên hệ Quản lý.",
                                    today.format(dateFormatter)),
                            HttpStatus.FORBIDDEN
                    );
                }

                // 6.2. Tìm ca trực: Ưu tiên ca khớp với giờ thực tế nếu nhân viên được phân nhiều ca trong ngày
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

            // 7. Cap nhat trang thai dang trong ca truc
            staff.setIsOnShift(true);
            staffRepository.save(staff);

            // 8. Sinh token JWT
            String token = jwtTokenProvider.generateToken(authentication);

            // 9. Dong goi LoginResponse tra ve cho frontend (lay shift truc tiep tu staff_schedules)
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

        if (manager.isLocked()) {
            throw new AppException("Tài khoản Quản lý này hiện đang bị khóa!", HttpStatus.FORBIDDEN);
        }

        if (!passwordEncoder.matches(request.getPinCode(), manager.getPinCode())) {
            manager.recordFailedAttempt();
            staffRepository.save(manager);
            if (manager.isLocked()) {
                throw new AppException("Tài khoản Quản lý đã bị KHÓA do nhập sai mã PIN quá 5 lần!", HttpStatus.FORBIDDEN);
            }
            int remaining = 5 - (manager.getFailedPinAttempts() != null ? manager.getFailedPinAttempts() : 0);
            throw new AppException("Mã PIN Quản lý không chính xác! Còn " + remaining + " lần thử.", HttpStatus.UNAUTHORIZED);
        }

        if (manager.getFailedPinAttempts() != null && manager.getFailedPinAttempts() > 0) {
            manager.resetFailedAttempts();
            staffRepository.save(manager);
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

    @Override
    public Map<String, Object> requestPinResetOtp(com.romsteam.roms.dto.request.RequestOtpRequest request) {
        if (request == null || request.getUsername() == null || request.getUsername().trim().isEmpty()) {
            throw new AppException("Vui lòng cung cấp mã nhân viên Quản lý!", HttpStatus.BAD_REQUEST);
        }

        String username = request.getUsername().trim();
        Staff staff = staffRepository.findByUsername(username)
                .orElseThrow(() -> new AppException("Tài khoản không tồn tại trên hệ thống!", HttpStatus.NOT_FOUND));

        if (staff.getRole() != UserRole.MANAGER) {
            throw new AppException("Chức năng tự khôi phục mã PIN chỉ áp dụng cho tài khoản Quản lý (MANAGER)! Vui lòng liên hệ Quản lý cơ sở để cấp lại mã PIN.", HttpStatus.FORBIDDEN);
        }

        // Sinh mã OTP ngẫu nhiên 6 chữ số
        String otp = String.format("%06d", new java.util.Random().nextInt(900000) + 100000);
        otpStorage.put(username.toUpperCase(), new OtpEntry(otp, LocalDateTime.now().plusMinutes(5)));

        log.warn("=========================================================================================");
        log.warn("[SECURITY RECOVERY OTP] Mã OTP đặt lại mã PIN cho Quản lý {} ({}) là: {}", staff.getFullName(), username, otp);
        log.warn("[SECURITY RECOVERY OTP] Mã OTP có hiệu lực trong 5 phút. Khóa Master Recovery Key dự phòng: {}", masterRecoveryKey);
        log.warn("=========================================================================================");

        String maskedEmail = "email quản lý";
        if (staff.getEmail() != null && staff.getEmail().contains("@")) {
            maskedEmail = staff.getEmail().replaceAll("(^.{2})(.*)(@.*$)", "$1***$3");
        }

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("username", staff.getUsername());
        response.put("fullName", staff.getFullName());
        response.put("role", staff.getRole().name());
        response.put("maskedEmail", maskedEmail);
        response.put("message", "Đã khởi tạo mã xác thực OTP khôi phục cho Quản lý " + staff.getFullName() + "! Bạn có thể dùng mã OTP (hiệu lực 5 phút) hoặc Khóa khôi phục Master Key dự phòng.");
        // Gợi ý mã OTP phục vụ kiểm thử / demo trực tiếp thuận tiện
        response.put("otpHint", otp);
        return response;
    }

    @Override
    public void resetPinWithOtpOrRecoveryKey(com.romsteam.roms.dto.request.ResetPinRequest request) {
        if (request == null) {
            throw new AppException("Dữ liệu yêu cầu không hợp lệ!", HttpStatus.BAD_REQUEST);
        }

        String username = request.getUsername() != null ? request.getUsername().trim() : "";
        String keyOrOtp = request.getOtpOrRecoveryKey() != null ? request.getOtpOrRecoveryKey().trim() : "";
        String newPin = request.getNewPinCode() != null ? request.getNewPinCode().trim() : "";
        String confirmPin = request.getConfirmPinCode() != null ? request.getConfirmPinCode().trim() : "";

        if (!newPin.matches("^\\d{6}$")) {
            throw new AppException("Mã PIN mới phải gồm chính xác 6 chữ số!", HttpStatus.BAD_REQUEST);
        }

        if (!newPin.equals(confirmPin)) {
            throw new AppException("Mã PIN xác nhận không trùng khớp với mã PIN mới!", HttpStatus.BAD_REQUEST);
        }

        Staff staff = staffRepository.findByUsername(username)
                .orElseThrow(() -> new AppException("Tài khoản nhân viên không tồn tại!", HttpStatus.NOT_FOUND));

        if (staff.getRole() != UserRole.MANAGER) {
            throw new AppException("Chỉ tài khoản Quản lý mới được phép thực hiện chức năng này!", HttpStatus.FORBIDDEN);
        }

        boolean isMasterKey = masterRecoveryKey.equalsIgnoreCase(keyOrOtp);
        OtpEntry activeOtp = otpStorage.get(username.toUpperCase());
        boolean isOtpValid = activeOtp != null && !activeOtp.isExpired() && activeOtp.otp.equals(keyOrOtp);

        if (!isMasterKey && !isOtpValid) {
            if (activeOtp != null && activeOtp.isExpired()) {
                otpStorage.remove(username.toUpperCase());
                throw new AppException("Mã OTP đã hết thời hạn hiệu lực (5 phút)! Vui lòng bấm gửi lại mã OTP mới.", HttpStatus.BAD_REQUEST);
            }
            throw new AppException("Mã OTP xác thực hoặc Khóa khôi phục Master Key không chính xác!", HttpStatus.BAD_REQUEST);
        }

        // Đặt lại mã PIN băm BCrypt và mở khóa tài khoản
        staff.setPinCode(passwordEncoder.encode(newPin));
        staff.unlock();
        staffRepository.save(staff);

        // Hủy OTP sau khi đã sử dụng thành công
        otpStorage.remove(username.toUpperCase());

        log.info("Manager {} ({}) successfully reset PIN using {}", 
                staff.getUsername(), staff.getFullName(), isMasterKey ? "Master Recovery Key" : "OTP");
    }
}
