package com.swp391.roms.service;

import com.swp391.roms.dto.request.LoginRequest;
import com.swp391.roms.dto.response.LoginResponse;
import com.swp391.roms.dto.response.UserSummaryDto;
import com.swp391.roms.entity.Role;
import com.swp391.roms.entity.User;
import com.swp391.roms.entity.enums.RoleName;
import com.swp391.roms.entity.enums.UserStatus;
import com.swp391.roms.exception.AccountLockedException;
import com.swp391.roms.exception.UnauthorizedException;
import com.swp391.roms.repository.UserRepository;
import com.swp391.roms.security.JwtTokenProvider;
import com.swp391.roms.service.impl.AuthServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtTokenProvider jwtTokenProvider;

    @Mock
    private AuditLogService auditLogService;

    @InjectMocks
    private AuthServiceImpl authService;

    private User sampleUser;
    private Role waiterRole;

    @BeforeEach
    void setUp() {
        waiterRole = Role.builder()
                .id(2)
                .name(RoleName.ROLE_WAITER)
                .description("Nhân viên phục vụ")
                .build();

        sampleUser = User.builder()
                .id(2L)
                .username("waiter")
                .passwordHash("$2a$10$hashedpassword")
                .fullName("Nguyễn Văn Phục Vụ")
                .email("waiter@roms.com")
                .phone("0901112233")
                .role(waiterRole)
                .status(UserStatus.ACTIVE)
                .failedAttempts(0)
                .lockedUntil(null)
                .build();
    }

    @Test
    @DisplayName("Login should succeed when valid credentials are provided")
    void testLogin_Success() {
        LoginRequest request = new LoginRequest("waiter", "123456");

        when(userRepository.findByUsername("waiter")).thenReturn(Optional.of(sampleUser));
        when(passwordEncoder.matches("123456", sampleUser.getPasswordHash())).thenReturn(true);
        when(jwtTokenProvider.generateToken(anyString(), anyLong(), anyString(), anyString())).thenReturn("mock.jwt.token");
        when(jwtTokenProvider.getExpirationDurationSeconds()).thenReturn(28800L);

        LoginResponse response = authService.login(request, "127.0.0.1");

        assertNotNull(response);
        assertEquals("mock.jwt.token", response.getAccessToken());
        assertEquals("Bearer", response.getTokenType());
        assertEquals(28800L, response.getExpiresIn());
        assertEquals("waiter", response.getUser().getUsername());
        assertEquals("ROLE_WAITER", response.getUser().getRole());

        verify(userRepository).save(sampleUser);
        verify(auditLogService).log(eq("LOGIN_SUCCESS"), eq("USER"), eq("2"), anyString(), eq(sampleUser), anyString());
    }

    @Test
    @DisplayName("Login should fail and increment failedAttempts when password is wrong")
    void testLogin_InvalidPassword_IncrementsFailedAttempts() {
        LoginRequest request = new LoginRequest("waiter", "wrongpass");

        when(userRepository.findByUsername("waiter")).thenReturn(Optional.of(sampleUser));
        when(passwordEncoder.matches("wrongpass", sampleUser.getPasswordHash())).thenReturn(false);

        UnauthorizedException exception = assertThrows(UnauthorizedException.class, () ->
                authService.login(request, "127.0.0.1")
        );

        assertTrue(exception.getMessage().contains("Bạn còn 4 lần thử"));
        assertEquals(1, sampleUser.getFailedAttempts());
        verify(userRepository).save(sampleUser);
        verify(auditLogService).log(eq("LOGIN_FAILED"), eq("USER"), eq("2"), anyString(), eq(sampleUser), anyString());
    }

    @Test
    @DisplayName("Account should be locked for 15 minutes upon 5th consecutive failed attempt")
    void testLogin_AccountLockoutOnFifthFailure() {
        sampleUser.setFailedAttempts(4);
        LoginRequest request = new LoginRequest("waiter", "wrongpass");

        when(userRepository.findByUsername("waiter")).thenReturn(Optional.of(sampleUser));
        when(passwordEncoder.matches("wrongpass", sampleUser.getPasswordHash())).thenReturn(false);

        AccountLockedException exception = assertThrows(AccountLockedException.class, () ->
                authService.login(request, "127.0.0.1")
        );

        assertTrue(exception.getMessage().contains("Bạn đã nhập sai 5 lần"));
        assertEquals(5, sampleUser.getFailedAttempts());
        assertEquals(UserStatus.LOCKED, sampleUser.getStatus());
        assertNotNull(sampleUser.getLockedUntil());
        verify(auditLogService).log(eq("ACCOUNT_LOCKED"), eq("USER"), eq("2"), anyString(), eq(sampleUser), anyString());
    }

    @Test
    @DisplayName("Login should be rejected immediately if account is already locked")
    void testLogin_AccountAlreadyLocked() {
        sampleUser.setStatus(UserStatus.LOCKED);
        sampleUser.setLockedUntil(LocalDateTime.now().plusMinutes(10));
        LoginRequest request = new LoginRequest("waiter", "123456");

        when(userRepository.findByUsername("waiter")).thenReturn(Optional.of(sampleUser));

        AccountLockedException exception = assertThrows(AccountLockedException.class, () ->
                authService.login(request, "127.0.0.1")
        );

        assertTrue(exception.getMessage().contains("tạm khóa"));
        verifyNoInteractions(passwordEncoder);
    }

    @Test
    @DisplayName("Expired lock should be automatically cleared and user can log in")
    void testLogin_AccountLockExpired_AutoUnlocks() {
        sampleUser.setStatus(UserStatus.LOCKED);
        sampleUser.setLockedUntil(LocalDateTime.now().minusMinutes(1)); // Expired 1 min ago
        LoginRequest request = new LoginRequest("waiter", "123456");

        when(userRepository.findByUsername("waiter")).thenReturn(Optional.of(sampleUser));
        when(passwordEncoder.matches("123456", sampleUser.getPasswordHash())).thenReturn(true);
        when(jwtTokenProvider.generateToken(anyString(), anyLong(), anyString(), anyString())).thenReturn("mock.jwt.token");

        LoginResponse response = authService.login(request, "127.0.0.1");

        assertNotNull(response);
        assertEquals(UserStatus.ACTIVE, sampleUser.getStatus());
        assertNull(sampleUser.getLockedUntil());
        assertEquals(0, sampleUser.getFailedAttempts());
    }

    @Test
    @DisplayName("Login should be rejected if user does not exist")
    void testLogin_UserNotFound() {
        LoginRequest request = new LoginRequest("unknown_user", "123456");
        when(userRepository.findByUsername("unknown_user")).thenReturn(Optional.empty());

        UnauthorizedException exception = assertThrows(UnauthorizedException.class, () ->
                authService.login(request, "127.0.0.1")
        );

        assertEquals("Tên đăng nhập hoặc mật khẩu không chính xác", exception.getMessage());
    }

    @Test
    @DisplayName("Login should be rejected if user account is INACTIVE")
    void testLogin_AccountInactive() {
        sampleUser.setStatus(UserStatus.INACTIVE);
        LoginRequest request = new LoginRequest("waiter", "123456");

        when(userRepository.findByUsername("waiter")).thenReturn(Optional.of(sampleUser));

        UnauthorizedException exception = assertThrows(UnauthorizedException.class, () ->
                authService.login(request, "127.0.0.1")
        );

        assertTrue(exception.getMessage().contains("vô hiệu hóa"));
    }

    @Test
    @DisplayName("Logout should record audit log")
    void testLogout_Success() {
        when(userRepository.findByUsername("waiter")).thenReturn(Optional.of(sampleUser));

        authService.logout("waiter", "127.0.0.1");

        verify(auditLogService).log(eq("LOGOUT"), eq("USER"), eq("2"), anyString(), eq(sampleUser), eq("127.0.0.1"));
    }

    @Test
    @DisplayName("GetMe should return user summary")
    void testGetMe_Success() {
        when(userRepository.findByUsername("waiter")).thenReturn(Optional.of(sampleUser));

        UserSummaryDto me = authService.getMe("waiter");

        assertNotNull(me);
        assertEquals("waiter", me.getUsername());
        assertEquals("ROLE_WAITER", me.getRole());
    }
}
