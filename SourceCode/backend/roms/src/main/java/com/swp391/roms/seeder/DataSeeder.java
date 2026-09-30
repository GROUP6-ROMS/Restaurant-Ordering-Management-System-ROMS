package com.swp391.roms.seeder;

import com.swp391.roms.entity.Role;
import com.swp391.roms.entity.User;
import com.swp391.roms.entity.enums.RoleName;
import com.swp391.roms.entity.enums.UserStatus;
import com.swp391.roms.repository.RoleRepository;
import com.swp391.roms.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        seedRoles();
        seedUsers();
    }

    private void seedRoles() {
        createRoleIfNotExists(RoleName.ROLE_MANAGER, "Quản lý nhà hàng - Toàn quyền quản trị");
        createRoleIfNotExists(RoleName.ROLE_WAITER, "Nhân viên phục vụ sàn - Quản lý bàn & order");
        createRoleIfNotExists(RoleName.ROLE_CHEF, "Bếp trưởng / Nhân viên bếp - Xử lý KDS");
        createRoleIfNotExists(RoleName.ROLE_CASHIER, "Thu ngân - Thanh toán & kết toán két tiền");
    }

    private Role createRoleIfNotExists(RoleName roleName, String description) {
        return roleRepository.findByName(roleName)
                .orElseGet(() -> {
                    Role role = Role.builder()
                            .name(roleName)
                            .description(description)
                            .build();
                    Role saved = roleRepository.save(role);
                    log.info("Seeded role: {}", roleName);
                    return saved;
                });
    }

    private void seedUsers() {
        Role managerRole = roleRepository.findByName(RoleName.ROLE_MANAGER).orElseThrow();
        Role waiterRole = roleRepository.findByName(RoleName.ROLE_WAITER).orElseThrow();
        Role chefRole = roleRepository.findByName(RoleName.ROLE_CHEF).orElseThrow();
        Role cashierRole = roleRepository.findByName(RoleName.ROLE_CASHIER).orElseThrow();

        String defaultHashedPassword = passwordEncoder.encode("123456");

        createUserIfNotExists("admin", defaultHashedPassword, "Quản Lý Nhà Hàng", "admin@roms.com", "0901234567", managerRole, UserStatus.ACTIVE);
        createUserIfNotExists("waiter", defaultHashedPassword, "Nguyễn Văn Phục Vụ", "waiter@roms.com", "0902345678", waiterRole, UserStatus.ACTIVE);
        createUserIfNotExists("chef", defaultHashedPassword, "Trần Văn Bếp Trưởng", "chef@roms.com", "0903456789", chefRole, UserStatus.ACTIVE);
        createUserIfNotExists("cashier", defaultHashedPassword, "Lê Thị Thu Ngân", "cashier@roms.com", "0904567890", cashierRole, UserStatus.ACTIVE);
        createUserIfNotExists("inactive_staff", defaultHashedPassword, "Nhân Viên Đã Nghỉ Việc", "inactive@roms.com", "0909999999", waiterRole, UserStatus.INACTIVE);
    }

    private void createUserIfNotExists(String username, String passwordHash, String fullName,
                                       String email, String phone, Role role, UserStatus status) {
        if (!userRepository.existsByUsername(username)) {
            User user = User.builder()
                    .username(username)
                    .passwordHash(passwordHash)
                    .fullName(fullName)
                    .email(email)
                    .phone(phone)
                    .role(role)
                    .status(status)
                    .failedAttempts(0)
                    .mustChangePassword(false)
                    .build();
            userRepository.save(user);
            log.info("Seeded user: {} with role: {} and status: {}", username, role.getName(), status);
        }
    }
}
