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

    // 1. Tao chuoi token JWT tu doi tuong xac thuc thanh cong (sau khi nhan vien dang nhap)
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

    // 1.1. Tao chuoi token JWT ngan han danh rieng cho Thuc khach quet ma QR tai ban an (Dining Token)
    // Thoi gian song: 4 gio (du cho 1 bua an tai ban, tu dong het han chong lam dung)
    public String generateDiningToken(Long tableId, String tableNumber) {
        Date currentDate = new Date();
        long diningExpiration = 4 * 60 * 60 * 1000L; // 4 gio
        Date expireDate = new Date(currentDate.getTime() + diningExpiration);

        return Jwts.builder()
                .subject("CUSTOMER-" + tableNumber)
                .claim("tableId", tableId)
                .claim("tableNumber", tableNumber)
                .claim("role", "ROLE_CUSTOMER")
                .claim("tokenType", "DINING_TOKEN")
                .issuedAt(currentDate)
                .expiration(expireDate)
                .signWith(getSigningKey())
                .compact();
    }

    // 2. Trich xuat username tu ben trong chuoi token gui len
    public String getUsernameFromToken(String token) {
        Claims claims = getClaimsFromToken(token);
        return claims.getSubject();
    }

    // 2.1. Trich xuat toan bo Claims tu token da duoc ky
    public Claims getClaimsFromToken(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    // 2.2. Kiem tra xem co phai la Dining Token cua Thuc khach hay khong
    public boolean isCustomerDiningToken(String token) {
        try {
            Claims claims = getClaimsFromToken(token);
            return "DINING_TOKEN".equals(claims.get("tokenType")) || "ROLE_CUSTOMER".equals(claims.get("role"));
        } catch (Exception e) {
            return false;
        }
    }

    // 2.3. Trich xuat tableId tu Dining Token
    public Long getTableIdFromToken(String token) {
        try {
            Claims claims = getClaimsFromToken(token);
            Object tableId = claims.get("tableId");
            if (tableId instanceof Number) {
                return ((Number) tableId).longValue();
            }
        } catch (Exception ignored) {}
        return null;
    }

    // 2.4. Trich xuat tableNumber tu Dining Token
    public String getTableNumberFromToken(String token) {
        try {
            Claims claims = getClaimsFromToken(token);
            return claims.get("tableNumber", String.class);
        } catch (Exception ignored) {}
        return null;
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
