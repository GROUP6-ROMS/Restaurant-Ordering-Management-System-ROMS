package com.romsteam.roms.service;

import com.romsteam.roms.dto.request.LoginRequest;
import com.romsteam.roms.dto.request.RequestOtpRequest;
import com.romsteam.roms.dto.request.ResetPinRequest;
import com.romsteam.roms.dto.response.LoginResponse;
import com.romsteam.roms.dto.response.StaffResponse;
import com.romsteam.roms.entity.Staff;
import com.romsteam.roms.entity.StaffSchedule;
import com.romsteam.roms.entity.enums.ShiftType;
import com.romsteam.roms.entity.enums.UserRole;
import com.romsteam.roms.exception.AppException;
import com.romsteam.roms.repository.StaffRepository;
import com.romsteam.roms.repository.StaffScheduleRepository;
import com.romsteam.roms.security.JwtTokenProvider;
import com.romsteam.roms.service.serviceImpl.AuthServiceImpl;
import com.romsteam.roms.service.serviceImpl.StaffServiceImpl;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Security & Anti-BruteForce Unit Tests - Khóa Tài Khoản Khi Nhập Sai Mã PIN Quá 5 Lần")
class AuthPinLockTest {

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private StaffRepository staffRepository;

    @Mock
    private StaffScheduleRepository staffScheduleRepository;

    @Mock
    private JwtTokenProvider jwtTokenProvider;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private AuthServiceImpl authService;

    @InjectMocks
    private StaffServiceImpl staffService;

    private Staff testStaff;

    @BeforeEach
    void setUp() {
        testStaff = Staff.builder()
                .id(10L)
                .username("EMP-001")
                .fullName("Nguyễn Văn Phục Vụ")
                .pinCode("$2a$10$encodedPin123456")
                .role(UserRole.WAITER)
                .isActive(true)
                .isOnShift(false)
                .failedPinAttempts(0)
                .build();
    }

    @Test
    @DisplayName("1. Nhập sai mã PIN lần đầu: Tăng số lần thử lên 1 và cảnh báo còn 4 lần")
    void testWrongPin_IncrementsAttemptCounter_AndWarnsRemainingAttempts() {
        when(staffRepository.findByUsername("EMP-001")).thenReturn(Optional.of(testStaff));
        when(passwordEncoder.matches("000000", testStaff.getPinCode())).thenReturn(false);
        when(staffRepository.save(any(Staff.class))).thenAnswer(invocation -> invocation.getArgument(0));

        LoginRequest request = new LoginRequest();
        request.setUsername("EMP-001");
        request.setPinCode("000000");

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(AppException.class)
                .satisfies(ex -> {
                    AppException appEx = (AppException) ex;
                    assertThat(appEx.getHttpStatus()).isEqualTo(HttpStatus.UNAUTHORIZED);
                    assertThat(appEx.getMessage()).contains("Mã PIN không chính xác! Bạn còn 4 lần thử");
                });

        assertThat(testStaff.getFailedPinAttempts()).isEqualTo(1);
        assertThat(testStaff.getIsActive()).isTrue();
        verify(staffRepository, times(1)).save(testStaff);
    }

    @Test
    @DisplayName("2. Nhập sai mã PIN liên tiếp 5 lần: Tài khoản tự động bị KHÓA và ngắt ca trực")
    void testFiveConsecutiveWrongPins_LocksAccount() {
        testStaff.setFailedPinAttempts(4); // Đã sai 4 lần trước đó
        when(staffRepository.findByUsername("EMP-001")).thenReturn(Optional.of(testStaff));
        when(passwordEncoder.matches("999999", testStaff.getPinCode())).thenReturn(false);
        when(staffRepository.save(any(Staff.class))).thenAnswer(invocation -> invocation.getArgument(0));

        LoginRequest request = new LoginRequest();
        request.setUsername("EMP-001");
        request.setPinCode("999999");

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(AppException.class)
                .satisfies(ex -> {
                    AppException appEx = (AppException) ex;
                    assertThat(appEx.getHttpStatus()).isEqualTo(HttpStatus.FORBIDDEN);
                    assertThat(appEx.getMessage()).contains("bị KHÓA do nhập sai mã PIN 5 lần liên tiếp");
                });

        assertThat(testStaff.getFailedPinAttempts()).isEqualTo(5);
        assertThat(testStaff.getIsActive()).isFalse();
        assertThat(testStaff.getIsOnShift()).isFalse();
        assertThat(testStaff.getLockedAt()).isNotNull();
        assertThat(testStaff.isLocked()).isTrue();
        verify(staffRepository, times(1)).save(testStaff);
    }

    @Test
    @DisplayName("3. Tài khoản đã bị khóa: Kể cả nhập ĐÚNG mã PIN vẫn bị chặn đăng nhập")
    void testLockedAccount_EvenWithCorrectPin_IsRejected() {
        testStaff.setFailedPinAttempts(5);
        testStaff.setIsActive(false);

        when(staffRepository.findByUsername("EMP-001")).thenReturn(Optional.of(testStaff));

        LoginRequest request = new LoginRequest();
        request.setUsername("EMP-001");
        request.setPinCode("123456"); // Nhập đúng PIN chuẩn

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(AppException.class)
                .satisfies(ex -> {
                    AppException appEx = (AppException) ex;
                    assertThat(appEx.getHttpStatus()).isEqualTo(HttpStatus.FORBIDDEN);
                    assertThat(appEx.getMessage()).contains("bị KHÓA do nhập sai mã PIN 5 lần liên tiếp");
                });

        // Không tiến hành so khớp mã PIN hay gọi AuthenticationManager
        verify(passwordEncoder, never()).matches(anyString(), anyString());
        verify(authenticationManager, never()).authenticate(any());
    }

    @Test
    @DisplayName("4. Nhập đúng mã PIN trước 5 lần: Reset số lần thử sai về 0")
    void testCorrectPinBeforeFiveAttempts_ResetsFailedCounter() {
        testStaff.setFailedPinAttempts(3); // Từng nhập sai 3 lần

        when(staffRepository.findByUsername("EMP-001")).thenReturn(Optional.of(testStaff));
        when(passwordEncoder.matches("123456", testStaff.getPinCode())).thenReturn(true);
        when(staffRepository.save(any(Staff.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Authentication mockAuth = mock(Authentication.class);
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class))).thenReturn(mockAuth);

        StaffSchedule schedule = StaffSchedule.builder()
                .staff(testStaff)
                .workDate(LocalDate.now())
                .shiftType(ShiftType.MORNING)
                .build();
        when(staffScheduleRepository.findByStaffAndWorkDate(eq(testStaff), any(LocalDate.class)))
                .thenReturn(List.of(schedule));
        when(jwtTokenProvider.generateToken(mockAuth)).thenReturn("mock-jwt-token-xyz");

        LoginRequest request = new LoginRequest();
        request.setUsername("EMP-001");
        request.setPinCode("123456");

        LoginResponse response = authService.login(request);

        assertThat(response).isNotNull();
        assertThat(response.getAccessToken()).isEqualTo("mock-jwt-token-xyz");
        assertThat(testStaff.getFailedPinAttempts()).isEqualTo(0);
        assertThat(testStaff.getLockedAt()).isNull();
    }

    @Test
    @DisplayName("5. Quản lý mở khóa tài khoản: Reset failedPinAttempts về 0 và kích hoạt lại isActive = true")
    void testManagerUnlocksStaffAccount() {
        testStaff.setFailedPinAttempts(5);
        testStaff.setIsActive(false);

        when(staffRepository.findById(10L)).thenReturn(Optional.of(testStaff));
        when(staffRepository.save(any(Staff.class))).thenAnswer(invocation -> invocation.getArgument(0));

        StaffResponse response = staffService.unlockStaff(10L);

        assertThat(response).isNotNull();
        assertThat(testStaff.getIsActive()).isTrue();
        assertThat(testStaff.getFailedPinAttempts()).isEqualTo(0);
        assertThat(testStaff.getLockedAt()).isNull();
        assertThat(testStaff.isLocked()).isFalse();
        verify(staffRepository, times(1)).save(testStaff);
    }

    @Test
    @DisplayName("6. Quản lý yêu cầu cấp OTP khôi phục mã PIN: Thành công, sinh OTP 6 số và mask email")
    void testRequestPinResetOtp_ManagerSuccess() {
        Staff manager = Staff.builder()
                .id(1L)
                .username("MGR-001")
                .fullName("Trần Quản Lý")
                .role(UserRole.MANAGER)
                .email("manager@roms.vn")
                .isActive(true)
                .build();

        when(staffRepository.findByUsername("MGR-001")).thenReturn(Optional.of(manager));

        RequestOtpRequest req = new RequestOtpRequest();
        req.setUsername("MGR-001");

        Map<String, Object> result = authService.requestPinResetOtp(req);

        assertThat(result).isNotNull();
        assertThat(result.get("success")).isEqualTo(true);
        assertThat(result.get("username")).isEqualTo("MGR-001");
        assertThat(result.get("otpHint")).isNotNull();
        assertThat(result.get("otpHint").toString()).matches("^\\d{6}$");
        assertThat(result.get("maskedEmail").toString()).contains("***");
    }

    @Test
    @DisplayName("7. Nhân viên thường (WAITER) yêu cầu cấp OTP: Bị từ chối với mã lỗi FORBIDDEN")
    void testRequestPinResetOtp_NonManagerStaff_Forbidden() {
        when(staffRepository.findByUsername("EMP-001")).thenReturn(Optional.of(testStaff));

        RequestOtpRequest req = new RequestOtpRequest();
        req.setUsername("EMP-001");

        assertThatThrownBy(() -> authService.requestPinResetOtp(req))
                .isInstanceOf(AppException.class)
                .satisfies(ex -> {
                    AppException appEx = (AppException) ex;
                    assertThat(appEx.getHttpStatus()).isEqualTo(HttpStatus.FORBIDDEN);
                    assertThat(appEx.getMessage()).contains("MANAGER");
                });
    }

    @Test
    @DisplayName("8. Khôi phục mã PIN Quản lý bằng Master Recovery Key: Mở khóa và reset số lần thử")
    void testResetPinWithMasterRecoveryKey_Success() {
        Staff lockedManager = Staff.builder()
                .id(1L)
                .username("MGR-001")
                .fullName("Trần Quản Lý")
                .role(UserRole.MANAGER)
                .pinCode("$2a$10$oldPin")
                .isActive(false)
                .failedPinAttempts(5)
                .lockedAt(java.time.LocalDateTime.now())
                .build();

        when(staffRepository.findByUsername("MGR-001")).thenReturn(Optional.of(lockedManager));
        when(passwordEncoder.encode("654321")).thenReturn("$2a$10$newEncoded654321");
        when(staffRepository.save(any(Staff.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ResetPinRequest req = new ResetPinRequest();
        req.setUsername("MGR-001");
        req.setOtpOrRecoveryKey("ROMS-RECOVERY-2026");
        req.setNewPinCode("654321");
        req.setConfirmPinCode("654321");

        authService.resetPinWithOtpOrRecoveryKey(req);

        assertThat(lockedManager.getPinCode()).isEqualTo("$2a$10$newEncoded654321");
        assertThat(lockedManager.getIsActive()).isTrue();
        assertThat(lockedManager.getFailedPinAttempts()).isEqualTo(0);
        assertThat(lockedManager.getLockedAt()).isNull();
        assertThat(lockedManager.isLocked()).isFalse();
        verify(staffRepository, times(1)).save(lockedManager);
    }

    @Test
    @DisplayName("9. Khôi phục mã PIN Quản lý bằng OTP hợp lệ: Mở khóa và đổi mã PIN thành công")
    void testResetPinWithOtp_Success() {
        Staff lockedManager = Staff.builder()
                .id(1L)
                .username("MGR-001")
                .fullName("Trần Quản Lý")
                .role(UserRole.MANAGER)
                .pinCode("$2a$10$oldPin")
                .email("manager@roms.vn")
                .isActive(false)
                .failedPinAttempts(5)
                .lockedAt(java.time.LocalDateTime.now())
                .build();

        when(staffRepository.findByUsername("MGR-001")).thenReturn(Optional.of(lockedManager));
        when(passwordEncoder.encode("888888")).thenReturn("$2a$10$newEncoded888888");
        when(staffRepository.save(any(Staff.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Bước 1: Yêu cầu sinh mã OTP
        RequestOtpRequest otpReq = new RequestOtpRequest();
        otpReq.setUsername("MGR-001");
        Map<String, Object> otpRes = authService.requestPinResetOtp(otpReq);
        String generatedOtp = (String) otpRes.get("otpHint");

        // Bước 2: Dùng mã OTP để đặt lại mã PIN
        ResetPinRequest resetReq = new ResetPinRequest();
        resetReq.setUsername("MGR-001");
        resetReq.setOtpOrRecoveryKey(generatedOtp);
        resetReq.setNewPinCode("888888");
        resetReq.setConfirmPinCode("888888");

        authService.resetPinWithOtpOrRecoveryKey(resetReq);

        assertThat(lockedManager.getPinCode()).isEqualTo("$2a$10$newEncoded888888");
        assertThat(lockedManager.getIsActive()).isTrue();
        assertThat(lockedManager.getFailedPinAttempts()).isEqualTo(0);
        assertThat(lockedManager.isLocked()).isFalse();
    }

    @Test
    @DisplayName("10. Khôi phục mã PIN thất bại nếu nhập mã OTP sai hoặc xác nhận mã PIN không khớp")
    void testResetPin_ValidationFailures() {
        // Trường hợp 1: PIN xác nhận không khớp
        ResetPinRequest mismatchReq = new ResetPinRequest();
        mismatchReq.setUsername("MGR-001");
        mismatchReq.setOtpOrRecoveryKey("123456");
        mismatchReq.setNewPinCode("111111");
        mismatchReq.setConfirmPinCode("222222");

        assertThatThrownBy(() -> authService.resetPinWithOtpOrRecoveryKey(mismatchReq))
                .isInstanceOf(AppException.class)
                .satisfies(ex -> {
                    AppException appEx = (AppException) ex;
                    assertThat(appEx.getHttpStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
                    assertThat(appEx.getMessage()).contains("Mã PIN xác nhận không trùng khớp");
                });

        // Trường hợp 2: Mã OTP sai
        Staff manager = Staff.builder()
                .id(1L)
                .username("MGR-001")
                .role(UserRole.MANAGER)
                .build();
        when(staffRepository.findByUsername("MGR-001")).thenReturn(Optional.of(manager));

        ResetPinRequest wrongOtpReq = new ResetPinRequest();
        wrongOtpReq.setUsername("MGR-001");
        wrongOtpReq.setOtpOrRecoveryKey("000000"); // Sai OTP và không phải Master key
        wrongOtpReq.setNewPinCode("654321");
        wrongOtpReq.setConfirmPinCode("654321");

        assertThatThrownBy(() -> authService.resetPinWithOtpOrRecoveryKey(wrongOtpReq))
                .isInstanceOf(AppException.class)
                .satisfies(ex -> {
                    AppException appEx = (AppException) ex;
                    assertThat(appEx.getHttpStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
                    assertThat(appEx.getMessage()).contains("Mã OTP xác thực hoặc Khóa khôi phục Master Key không chính xác");
                });
    }
}

