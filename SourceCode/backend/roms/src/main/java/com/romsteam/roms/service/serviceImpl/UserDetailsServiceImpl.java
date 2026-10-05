package com.romsteam.roms.service.serviceImpl;

import com.romsteam.roms.entity.Staff;
import com.romsteam.roms.repository.StaffRepository;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Collections;

@Service
public class UserDetailsServiceImpl implements UserDetailsService {

    private final StaffRepository staffRepository;

    // Tiem StaffRepository qua ham khoi tao (Constructor Injection)
    public UserDetailsServiceImpl(StaffRepository staffRepository) {
        this.staffRepository = staffRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        // 1. Tim thong tin nhan vien trong CSDL theo ten dang nhap
        Staff staff = staffRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("Không tìm thấy nhân viên với tên đăng nhập: " + username));

        // 2. Kiem tra xem tai khoan co dang bi khoa (nghi viec) hay khong
        if (!staff.getIsActive()) {
            throw new UsernameNotFoundException("Tài khoản này hiện đang bị khóa hoặc đã ngưng hoạt động!");
        }

        // 3. Chuyen doi vai tro UserRole thanh GrantedAuthority (Chuan Spring Security quy dinh tien to "ROLE_")
        // Vi du: WAITER -> "ROLE_WAITER", MANAGER -> "ROLE_MANAGER"
        SimpleGrantedAuthority authority = new SimpleGrantedAuthority("ROLE_" + staff.getRole().name());

        // 4. Tra ve doi tuong User chuan cua Spring Security
        // LUU Y QUAN TRONG: Can lay mat khau da ma hoa (staff.getPassword()) de Spring Security doi chieu voi mat khau nguoi dung nhap
        return new User(
                staff.getUsername(),
                staff.getPassword(), // Mat khau BCrypt lay tu Entity Staff
                Collections.singletonList(authority)
        );
    }
}
