package com.swp391.roms.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;

class JwtTokenProviderTest {

    private JwtTokenProvider tokenProvider;
    private final String secret = "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970";
    private final long expirationMs = 28800000L; // 8 hours

    @BeforeEach
    void setUp() {
        tokenProvider = new JwtTokenProvider();
        ReflectionTestUtils.setField(tokenProvider, "jwtSecret", secret);
        ReflectionTestUtils.setField(tokenProvider, "jwtExpirationMs", expirationMs);
        tokenProvider.init();
    }

    @Test
    @DisplayName("Should generate valid JWT token with correct claims")
    void testGenerateToken_Success() {
        String token = tokenProvider.generateToken("waiter", 2L, "ROLE_WAITER", "Nguyễn Văn Phục Vụ");

        assertNotNull(token);
        assertTrue(tokenProvider.validateToken(token));
        assertEquals("waiter", tokenProvider.getUsernameFromToken(token));
        assertEquals(2L, tokenProvider.getUserIdFromToken(token));
        assertEquals("ROLE_WAITER", tokenProvider.getRoleFromToken(token));
        assertEquals(28800, tokenProvider.getExpirationDurationSeconds());
    }

    @Test
    @DisplayName("Should validate token successfully")
    void testValidateToken_Valid() {
        String token = tokenProvider.generateToken("admin", 1L, "ROLE_MANAGER", "Quản Lý");
        assertTrue(tokenProvider.validateToken(token));
    }

    @Test
    @DisplayName("Should reject malformed JWT token")
    void testValidateToken_Malformed() {
        String malformedToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalidpayload.signature";
        assertFalse(tokenProvider.validateToken(malformedToken));
    }

    @Test
    @DisplayName("Should reject token with invalid signature")
    void testValidateToken_InvalidSignature() {
        // Create token with different secret
        JwtTokenProvider otherProvider = new JwtTokenProvider();
        ReflectionTestUtils.setField(otherProvider, "jwtSecret", "1111111111111111111111111111111111111111111111111111111111111111");
        ReflectionTestUtils.setField(otherProvider, "jwtExpirationMs", expirationMs);
        otherProvider.init();

        String tokenFromOther = otherProvider.generateToken("waiter", 2L, "ROLE_WAITER", "Phục Vụ");

        assertFalse(tokenProvider.validateToken(tokenFromOther));
    }

    @Test
    @DisplayName("Should reject expired JWT token")
    void testValidateToken_Expired() throws InterruptedException {
        JwtTokenProvider shortLivedProvider = new JwtTokenProvider();
        ReflectionTestUtils.setField(shortLivedProvider, "jwtSecret", secret);
        ReflectionTestUtils.setField(shortLivedProvider, "jwtExpirationMs", 1L); // 1ms
        shortLivedProvider.init();

        String token = shortLivedProvider.generateToken("waiter", 2L, "ROLE_WAITER", "Phục Vụ");
        Thread.sleep(10); // Wait for token to expire

        assertFalse(shortLivedProvider.validateToken(token));
    }
}
