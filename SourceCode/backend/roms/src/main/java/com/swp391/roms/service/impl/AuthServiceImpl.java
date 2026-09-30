package com.swp391.roms.service.impl;

import com.swp391.roms.dto.request.LoginRequest;
import com.swp391.roms.dto.response.LoginResponse;
import com.swp391.roms.dto.response.UserSummaryDto;
import com.swp391.roms.entity.User;
import com.swp391.roms.entity.enums.UserStatus;
import com.swp391.roms.exception.AccountLockedException;
import com.swp391.roms.exception.ResourceNotFoundException;
import com.swp391.roms.exception.UnauthorizedException;
import com.swp391.roms.repository.UserRepository;
import com.swp391.roms.security.JwtTokenProvider;
import com.swp391.roms.service.AuditLogService;
import com.swp391.roms.service.AuthService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private static final int MAX_FAILED_ATTEMPTS = 5;
    private static final int LOCKOUT_MINUTES = 15;

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final AuditLogService auditLogService;

    @Override
    @Transactional
    public LoginResponse login(LoginRequest request, String ipAddress) {
        String username = request.getUsername().trim();

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> {
                    auditLogService.log("LOGIN_FAILED", "USER", null, "Username not found: " + username, null, ipAddress);
                    return new UnauthorizedException("Tên đăng nhập hoặc mật khẩu không chính xác");
                });

        // 1. Check temporary lockout
        if (user.getLockedUntil() != null) {
            if (user.getLockedUntil().isAfter(LocalDateTime.now())) {
                long minutesRemaining = Duration.between(LocalDateTime.now(), user.getLockedUntil()).toMinutes() + 1;
                log.warn("Login rejected: user {} is locked until {}", username, user.getLockedUntil());
                throw new AccountLockedException(
                        String.format("Tài khoản của bạn đã bị tạm khóa do nhập sai mật khẩu 5 lần. Vui lòng thử lại sau %d phút.", minutesRemaining),
                        user.getLockedUntil(),
                        minutesRemaining
                );
            } else {
                // Lockout period expired: reset state
                log.info("Lockout expired for user {}. Unlocking account.", username);
                user.setStatus(UserStatus.ACTIVE);
                user.setFailedAttempts(0);
                user.setLockedUntil(null);
                userRepository.save(user);
            }
        }

        // 2. Check active status
        if (user.getStatus() == UserStatus.INACTIVE) {
            log.warn("Login rejected: user {} is INACTIVE", username);
            auditLogService.log("LOGIN_FAILED", "USER", user.getId().toString(), "Account is inactive", user, ipAddress);
            throw new UnauthorizedException("Tài khoản đã bị vô hiệu hóa. Vui lòng liên hệ quản lý");
        }

        // 3. Verify password
        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            int failedAttempts = user.getFailedAttempts() + 1;
            user.setFailedAttempts(failedAttempts);

            if (failedAttempts >= MAX_FAILED_ATTEMPTS) {
                LocalDateTime lockedUntil = LocalDateTime.now().plusMinutes(LOCKOUT_MINUTES);
                user.setStatus(UserStatus.LOCKED);
                user.setLockedUntil(lockedUntil);
                userRepository.save(user);

                auditLogService.log("ACCOUNT_LOCKED", "USER", user.getId().toString(),
                        "Account locked for 15 minutes due to 5 consecutive failed logins", user, ipAddress);

                log.warn("Account {} locked until {} due to {} failed attempts", username, lockedUntil, failedAttempts);
                throw new AccountLockedException(
                        "Mật khẩu không chính xác. Bạn đã nhập sai 5 lần, tài khoản bị tạm khóa 15 phút.",
                        lockedUntil,
                        LOCKOUT_MINUTES
                );
            } else {
                userRepository.save(user);
                auditLogService.log("LOGIN_FAILED", "USER", user.getId().toString(),
                        String.format("Invalid password attempt (%d/%d)", failedAttempts, MAX_FAILED_ATTEMPTS), user, ipAddress);

                int remaining = MAX_FAILED_ATTEMPTS - failedAttempts;
                log.warn("User {} failed login attempt ({}/{})", username, failedAttempts, MAX_FAILED_ATTEMPTS);
                throw new UnauthorizedException(
                        String.format("Tên đăng nhập hoặc mật khẩu không chính xác. Bạn còn %d lần thử trước khi bị khóa tài khoản", remaining)
                );
            }
        }

        // 4. Success: reset failure counter & issue JWT
        user.setFailedAttempts(0);
        user.setLockedUntil(null);
        userRepository.save(user);

        String roleName = user.getRole().getName().name();
        String accessToken = jwtTokenProvider.generateToken(user.getUsername(), user.getId(), roleName, user.getFullName());

        auditLogService.log("LOGIN_SUCCESS", "USER", user.getId().toString(), "Successful authentication", user, ipAddress);

        UserSummaryDto userSummary = UserSummaryDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(roleName)
                .status(user.getStatus().name())
                .build();

        return LoginResponse.builder()
                .accessToken(accessToken)
                .tokenType("Bearer")
                .expiresIn(jwtTokenProvider.getExpirationDurationSeconds())
                .user(userSummary)
                .build();
    }

    @Override
    @Transactional
    public void logout(String username, String ipAddress) {
        userRepository.findByUsername(username).ifPresent(user -> {
            auditLogService.log("LOGOUT", "USER", user.getId().toString(), "User logged out", user, ipAddress);
            log.info("User {} logged out successfully", username);
        });
    }

    @Override
    @Transactional(readOnly = true)
    public UserSummaryDto getMe(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", username));

        return UserSummaryDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(user.getRole().getName().name())
                .status(user.getStatus().name())
                .build();
    }
}
