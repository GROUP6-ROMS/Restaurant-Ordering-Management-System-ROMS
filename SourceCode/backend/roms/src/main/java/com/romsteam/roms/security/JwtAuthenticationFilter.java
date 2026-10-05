package com.romsteam.roms.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
// Ke thua OncePerRequestFilter: Dam bao bo loc chi chay dung mot lan duy nhat cho moi yeu cau HTTP
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider jwtTokenProvider;
    private final UserDetailsService userDetailsService;

    // Tiem cac dependency can thiet qua constructor
    public JwtAuthenticationFilter(JwtTokenProvider jwtTokenProvider, UserDetailsService userDetailsService) {
        this.jwtTokenProvider = jwtTokenProvider;
        this.userDetailsService = userDetailsService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        // 1. Trich xuat chuoi JWT token tu HTTP Header "Authorization"
        String token = getJwtFromRequest(request);

        // 2. Neu co token va token hop le thi nap thong tin nguoi dung vao SecurityContext
        if (StringUtils.hasText(token) && jwtTokenProvider.validateToken(token)) {
            // Lay username tu token
            String username = jwtTokenProvider.getUsernameFromToken(token);

            // Nap chi tiet UserDetails tu database
            UserDetails userDetails = userDetailsService.loadUserByUsername(username);

            // Tao doi tuong xac thuc danh tinh chinh thuc
            UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                    userDetails,
                    null,
                    userDetails.getAuthorities()
            );
            authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

            // Luu thong tin xac thuc vao Security Context cua thread hien tai
            SecurityContextHolder.getContext().setAuthentication(authentication);
        }

        // 3. Cho phep request tiep tuc di qua cac filter ke tiep de vao Controller
        filterChain.doFilter(request, response);
    }

    // Phuong thuc phu: Cat bo tien to "Bearer " de lay chuoi token thuan
    private String getJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7); // Bo qua 7 ky tu "Bearer "
        }
        return null;
    }
}
