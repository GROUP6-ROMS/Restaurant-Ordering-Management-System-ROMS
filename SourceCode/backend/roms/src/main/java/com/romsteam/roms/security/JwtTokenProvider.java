package com.romsteam.roms.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;

@Component // Danh dau la Spring Component de inject vao cac class khac khi can
public class JwtTokenProvider {

    // Khoa bi mat dung de ky va giai ma JWT (doc tu application.properties)
    @Value("${jwt.secret}")
    private String jwtSecret;

    // Thoi gian song cua JWT tinh bang mili-giay (vi du: 86400000 ms = 24 gio)
    @Value("${jwt.expiration}")
    private long jwtExpirationDate;

    // Tao khoa ky HMAC an toan tu chuoi bi mat Base64/Hex
    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(Decoders.BASE64.decode(jwtSecret));
    }

    // 1. Tao chuoi token JWT tu doi tuong xac thuc thanh cong (sau khi user dang nhap)
    public String generateToken(Authentication authentication) {
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        Date currentDate = new Date();
        Date expireDate = new Date(currentDate.getTime() + jwtExpirationDate);

        return Jwts.builder()
                .subject(userDetails.getUsername()) // Luu username vao phan Subject cua token
                .issuedAt(currentDate)              // Thoi diem cap phat token
                .expiration(expireDate)             // Thoi diem token het han
                .signWith(getSigningKey())          // Ky dien tu bang khoa bi mat HMAC SHA-256
                .compact();                         // Dong goi thanh chuoi ky tu dang xxxxx.yyyyy.zzzzz
    }

    // 2. Trich xuat username tu ben trong chuoi token gui len
    public String getUsernameFromToken(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(getSigningKey()) // Kiem tra chu ky hop le truoc khi boc tach
                .build()
                .parseSignedClaims(token)
                .getPayload();
        return claims.getSubject();
    }

    // 3. Kiem tra token co hop le, nguyen ven va con han su dung hay khong
    public boolean validateToken(String token) {
        try {
            Jwts.parser()
                    .verifyWith(getSigningKey())
                    .build()
                    .parseSignedClaims(token);
            return true; // Token hoan toan hop le
        } catch (MalformedJwtException e) {
            System.err.println("JWT token không đúng định dạng: " + e.getMessage());
        } catch (ExpiredJwtException e) {
            System.err.println("JWT token đã hết hạn sử dụng: " + e.getMessage());
        } catch (UnsupportedJwtException e) {
            System.err.println("JWT token không được hỗ trợ: " + e.getMessage());
        } catch (IllegalArgumentException e) {
            System.err.println("Chuỗi JWT rỗng hoặc không hợp lệ: " + e.getMessage());
        }
        return false; // Token co loi hoac da bi lam gia
    }
}
