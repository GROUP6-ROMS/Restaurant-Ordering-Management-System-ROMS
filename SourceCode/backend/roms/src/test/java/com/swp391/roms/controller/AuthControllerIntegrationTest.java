package com.swp391.roms.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.swp391.roms.dto.request.LoginRequest;
import com.swp391.roms.dto.response.LoginResponse;
import com.swp391.roms.security.JwtTokenProvider;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class AuthControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Test
    @DisplayName("POST /api/v1/auth/login - Should authenticate successfully with seeded waiter account")
    void testLogin_Success() throws Exception {
        LoginRequest request = new LoginRequest("waiter", "123456");

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.code", is(200)))
                .andExpect(jsonPath("$.data.accessToken", notNullValue()))
                .andExpect(jsonPath("$.data.tokenType", is("Bearer")))
                .andExpect(jsonPath("$.data.expiresIn", is(28800)))
                .andExpect(jsonPath("$.data.user.username", is("waiter")))
                .andExpect(jsonPath("$.data.user.role", is("ROLE_WAITER")))
                .andExpect(jsonPath("$.data.user.status", is("ACTIVE")));
    }

    @Test
    @DisplayName("POST /api/v1/auth/login - Should reject with 400 Bad Request when fields are blank")
    void testLogin_Validation_BlankFields() throws Exception {
        LoginRequest request = new LoginRequest("", "");

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.status", is(400)))
                .andExpect(jsonPath("$.errors", hasSize(greaterThanOrEqualTo(2))));
    }

    @Test
    @DisplayName("POST /api/v1/auth/login - Should reject with 400 Bad Request when password too short")
    void testLogin_Validation_ShortPassword() throws Exception {
        LoginRequest request = new LoginRequest("waiter", "123");

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.status", is(400)))
                .andExpect(jsonPath("$.errors[0].field", is("password")));
    }

    @Test
    @DisplayName("POST /api/v1/auth/login - Should reject with 401 Unauthorized when password is wrong")
    void testLogin_WrongPassword() throws Exception {
        LoginRequest request = new LoginRequest("waiter", "wrong_password");

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.status", is(401)))
                .andExpect(jsonPath("$.message", containsString("không chính xác")));
    }

    @Test
    @DisplayName("POST /api/v1/auth/login - Should reject with 401 when account is INACTIVE")
    void testLogin_InactiveAccount() throws Exception {
        LoginRequest request = new LoginRequest("inactive_staff", "123456");

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.status", is(401)))
                .andExpect(jsonPath("$.message", containsString("vô hiệu hóa")));
    }

    @Test
    @DisplayName("GET /api/v1/auth/me - Should return current user profile with valid Bearer token")
    void testGetMe_WithValidJwt() throws Exception {
        // Login first to get live token
        LoginRequest loginRequest = new LoginRequest("admin", "123456");
        MvcResult loginResult = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andReturn();

        String responseJson = loginResult.getResponse().getContentAsString();
        String token = objectMapper.readTree(responseJson).get("data").get("accessToken").asText();

        mockMvc.perform(get("/api/v1/auth/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.username", is("admin")))
                .andExpect(jsonPath("$.data.role", is("ROLE_MANAGER")));
    }

    @Test
    @DisplayName("GET /api/v1/auth/me - Should return 401 Unauthorized when Authorization header is missing")
    void testGetMe_WithoutToken() throws Exception {
        mockMvc.perform(get("/api/v1/auth/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.status", is(401)));
    }

    @Test
    @DisplayName("POST /api/v1/auth/logout - Should succeed when valid Bearer token provided")
    void testLogout_Success() throws Exception {
        String token = jwtTokenProvider.generateToken("waiter", 2L, "ROLE_WAITER", "Phục Vụ");

        mockMvc.perform(post("/api/v1/auth/logout")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.message", is("Đăng xuất thành công")));
    }
}
