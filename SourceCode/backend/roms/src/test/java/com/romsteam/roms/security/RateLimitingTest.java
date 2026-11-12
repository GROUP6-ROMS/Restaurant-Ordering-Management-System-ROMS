package com.romsteam.roms.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class RateLimitingTest {

    private RateLimitingService rateLimitingService;
    private RateLimitingFilter rateLimitingFilter;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        rateLimitingService = new RateLimitingService();
        objectMapper = new ObjectMapper().findAndRegisterModules();
        rateLimitingFilter = new RateLimitingFilter(rateLimitingService, objectMapper);
    }

    @Test
    @DisplayName("OTP rate limit allows 3 calls and blocks the 4th call")
    void testOtpRateLimiting() {
        String testIp = "192.168.1.100";
        rateLimitingService.resetLimitsForIp(testIp);

        assertTrue(rateLimitingService.tryConsumeOtp(testIp));
        assertTrue(rateLimitingService.tryConsumeOtp(testIp));
        assertTrue(rateLimitingService.tryConsumeOtp(testIp));
        assertFalse(rateLimitingService.tryConsumeOtp(testIp));

        rateLimitingService.resetLimitsForIp(testIp);
        assertTrue(rateLimitingService.tryConsumeOtp(testIp));
    }

    @Test
    @DisplayName("Auth rate limit allows 10 calls and blocks the 11th call")
    void testAuthRateLimiting() {
        String testIp = "192.168.1.101";
        rateLimitingService.resetLimitsForIp(testIp);

        for (int i = 0; i < 10; i++) {
            assertTrue(rateLimitingService.tryConsumeAuth(testIp), "Attempt " + (i + 1) + " should be allowed");
        }
        assertFalse(rateLimitingService.tryConsumeAuth(testIp), "Attempt 11 should be blocked");
    }

    @Test
    @DisplayName("Extracts client IP correctly from X-Forwarded-For and X-Real-IP")
    void testClientIpExtraction() {
        MockHttpServletRequest requestWithForwarded = new MockHttpServletRequest();
        requestWithForwarded.addHeader("X-Forwarded-For", "203.0.113.195, 70.41.3.18");
        assertEquals("203.0.113.195", rateLimitingService.getClientIp(requestWithForwarded));

        MockHttpServletRequest requestWithRealIp = new MockHttpServletRequest();
        requestWithRealIp.addHeader("X-Real-IP", "198.51.100.42");
        assertEquals("198.51.100.42", rateLimitingService.getClientIp(requestWithRealIp));

        MockHttpServletRequest directRequest = new MockHttpServletRequest();
        directRequest.setRemoteAddr("127.0.0.1");
        assertEquals("127.0.0.1", rateLimitingService.getClientIp(directRequest));
    }

    @Test
    @DisplayName("RateLimitingFilter intercepts and responds 429 when OTP limit exceeded")
    void testFilterBlocksExcessiveOtp() throws Exception {
        String testIp = "10.0.0.50";
        rateLimitingService.resetLimitsForIp(testIp);

        FilterChain filterChain = mock(FilterChain.class);

        // First 3 requests should pass to filterChain
        for (int i = 0; i < 3; i++) {
            MockHttpServletRequest req = new MockHttpServletRequest("POST", "/api/auth/forgot-pin/request-otp");
            req.setRemoteAddr(testIp);
            MockHttpServletResponse res = new MockHttpServletResponse();
            rateLimitingFilter.doFilter(req, res, filterChain);
            assertEquals(HttpStatus.OK.value(), res.getStatus());
        }

        verify(filterChain, times(3)).doFilter(any(HttpServletRequest.class), any(HttpServletResponse.class));

        // 4th request must be intercepted with HTTP 429
        MockHttpServletRequest blockedReq = new MockHttpServletRequest("POST", "/api/auth/forgot-pin/request-otp");
        blockedReq.setRemoteAddr(testIp);
        MockHttpServletResponse blockedRes = new MockHttpServletResponse();
        rateLimitingFilter.doFilter(blockedReq, blockedRes, filterChain);

        assertEquals(HttpStatus.TOO_MANY_REQUESTS.value(), blockedRes.getStatus());
        assertTrue(blockedRes.getContentAsString().contains("429") || blockedRes.getContentAsString().contains("OTP"));
        // filterChain should still have been called only 3 times
        verify(filterChain, times(3)).doFilter(any(HttpServletRequest.class), any(HttpServletResponse.class));
    }

    @Test
    @DisplayName("RateLimitingFilter allows unaffected endpoints without consuming auth/otp quotas")
    void testFilterAllowsNormalEndpoints() throws Exception {
        MockHttpServletRequest req = new MockHttpServletRequest("GET", "/api/customer/dining/menu");
        req.setRemoteAddr("10.0.0.99");
        MockHttpServletResponse res = new MockHttpServletResponse();
        FilterChain filterChain = mock(FilterChain.class);

        rateLimitingFilter.doFilter(req, res, filterChain);

        verify(filterChain, times(1)).doFilter(req, res);
        assertEquals(HttpStatus.OK.value(), res.getStatus());
    }
}
