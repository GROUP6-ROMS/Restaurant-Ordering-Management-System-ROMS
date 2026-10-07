package com.romsteam.roms.service.serviceImpl;

import com.romsteam.roms.dto.request.LoginRequest;
import com.romsteam.roms.dto.request.VerifyManagerPinRequest;
import com.romsteam.roms.dto.response.LoginResponse;
import com.romsteam.roms.entity.Staff;
import com.romsteam.roms.entity.enums.ShiftType;
import com.romsteam.roms.entity.enums.UserRole;
import com.romsteam.roms.exception.AppException;
import com.romsteam.roms.repository.StaffRepository;
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

import java.time.LocalTime;

@Service
public class AuthServiceImpl implements AuthService {

    private final AuthenticationManager authenticationManager;
    private final StaffRepository staffRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final PasswordEncoder passwordEncoder;

    public AuthServiceImpl(AuthenticationManager authenticationManager,
                           StaffRepository staffRepository,
                           JwtTokenProvider jwtTokenProvider,
                           PasswordEncoder passwordEncoder) {
        this.authenticationManager = authenticationManager;
        this.staffRepository = staffRepository;
        this.jwtTokenProvider = jwtTokenProvider;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public LoginResponse login(LoginRequest request) {
        try {
            // 1. Thuc hien xac thuc username va pinCode qua Spring Security AuthenticationManager
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getUsername(),
                            request.getPinCode()
                    )
            );

            // 2. Luu thong tin xac thuc vao SecurityContext
            SecurityContextHolder.getContext().setAuthentication(authentication);

            // 3. Lay thong tin nhan vien tu CSDL
            Staff staff = staffRepository.findByUsername(request.getUsername())
                    .orElseThrow(() -> new AppException("Nhân viên không tồn tại", HttpStatus.NOT_FOUND));

            // 4. KIEM TRA DIEU KIEN PHAN CONG CA TRUC:
            // Neu KHONG phai Quan ly (MANAGER), bat buoc phai duoc phan cong ca va trong khung gio ca truc
            if (staff.getRole() != UserRole.MANAGER) {
                ShiftType shift = staff.getAssignedShift();
                if (shift == null || shift == ShiftType.NONE) {
                    throw new AppException("Bạn chưa được phân công ca làm việc hôm nay! Vui lòng liên hệ Quản lý.", HttpStatus.FORBIDDEN);
                }

                LocalTime now = LocalTime.now();
                if (!shift.isWithinShift(now)) {
                    String message = String.format(
                            "Chưa đến hoặc đã hết ca làm việc của bạn (Ca %s: %s - %s). Bạn chỉ được đăng nhập trước giờ mở ca 15 phút!",
                            shift.getLabel(),
                            shift.getStartTime(),
                            shift.getEndTime()
                    );
                    throw new AppException(message, HttpStatus.FORBIDDEN);
                }
            }

            // 5. Cap nhat trang thai dang trong ca truc
            staff.setIsOnShift(true);
            staffRepository.save(staff);

            // 6. Sinh token JWT
            String token = jwtTokenProvider.generateToken(authentication);

            // 7. Dong goi LoginResponse tra ve cho frontend
            return LoginResponse.builder()
                    .accessToken(token)
                    .tokenType("Bearer")
                    .id(staff.getId())
                    .username(staff.getUsername())
                    .fullName(staff.getFullName())
                    .role(staff.getRole().name())
                    .assignedShift(staff.getAssignedShift() != null ? staff.getAssignedShift().name() : "NONE")
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
        if (username == null || username.trim().isEmpty()) {
            return;
        }

        staffRepository.findByUsername(username).ifPresent(staff -> {
            // Khi nhan vien dang xuat, cap nhat isOnShift = false
            staff.setIsOnShift(false);
            staffRepository.save(staff);
        });
    }
}
