package com.romsteam.roms.service.serviceImpl;

import com.romsteam.roms.dto.request.LoginRequest;
import com.romsteam.roms.dto.response.LoginResponse;
import com.romsteam.roms.entity.Staff;
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
import org.springframework.stereotype.Service;

@Service
public class AuthServiceImpl implements AuthService {

    private final AuthenticationManager authenticationManager;
    private final StaffRepository staffRepository;
    private final JwtTokenProvider jwtTokenProvider;

    // Tiem cac bean can thiet qua constructor injection
    public AuthServiceImpl(AuthenticationManager authenticationManager,
                           StaffRepository staffRepository,
                           JwtTokenProvider jwtTokenProvider) {
        this.authenticationManager = authenticationManager;
        this.staffRepository = staffRepository;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    @Override
    public LoginResponse login(LoginRequest request) {
        try {
            // 1. Thuc hien xac thuc username va password qua Spring Security AuthenticationManager
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getUsername(),
                            request.getPassword()
                    )
            );

            // 2. Luu thong tin xac thuc vao SecurityContext
            SecurityContextHolder.getContext().setAuthentication(authentication);

            // 3. Sinh token JWT
            String token = jwtTokenProvider.generateToken(authentication);

            // 4. Lay thong tin nhan vien tu CSDL de tra ve frontend
            Staff staff = staffRepository.findByUsername(request.getUsername())
                    .orElseThrow(() -> new AppException("Nhan vien khong ton tai", HttpStatus.NOT_FOUND));

            // 5. Dong goi vao LoginResponse
            return new LoginResponse(
                    token,
                    staff.getId(),
                    staff.getUsername(),
                    staff.getFullName(),
                    staff.getRole().name()
            );

        } catch (BadCredentialsException e) {
            // Nem ngoai le neu sai ten dang nhap hoac mat khau
            throw new AppException("Sai ten dang nhap hoac mat khau!", HttpStatus.UNAUTHORIZED);
        }
    }
}
