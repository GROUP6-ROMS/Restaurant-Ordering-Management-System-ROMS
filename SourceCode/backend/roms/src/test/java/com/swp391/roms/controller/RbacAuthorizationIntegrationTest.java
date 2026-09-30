package com.swp391.roms.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.swp391.roms.dto.request.LoginRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class RbacAuthorizationIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private String adminToken;
    private String waiterToken;
    private String chefToken;
    private String cashierToken;

    @BeforeEach
    void setUp() throws Exception {
        adminToken = obtainAccessToken("admin", "123456");
        waiterToken = obtainAccessToken("waiter", "123456");
        chefToken = obtainAccessToken("chef", "123456");
        cashierToken = obtainAccessToken("cashier", "123456");
    }

    private String obtainAccessToken(String username, String password) throws Exception {
        LoginRequest request = new LoginRequest(username, password);
        MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andReturn();

        String response = result.getResponse().getContentAsString();
        return objectMapper.readTree(response).get("data").get("accessToken").asText();
    }

    @Test
    @DisplayName("RBAC - Manager role should have access to /api/v1/test/manager")
    void testManager_CanAccessManagerEndpoint() throws Exception {
        mockMvc.perform(get("/api/v1/test/manager")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.message", is("Access Granted")));
    }

    @Test
    @DisplayName("RBAC - Waiter role should be denied (403 Forbidden) from /api/v1/test/manager")
    void testWaiter_CannotAccessManagerEndpoint() throws Exception {
        mockMvc.perform(get("/api/v1/test/manager")
                        .header("Authorization", "Bearer " + waiterToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.status", is(403)));
    }

    @Test
    @DisplayName("RBAC - Waiter role should have access to /api/v1/test/waiter")
    void testWaiter_CanAccessWaiterEndpoint() throws Exception {
        mockMvc.perform(get("/api/v1/test/waiter")
                        .header("Authorization", "Bearer " + waiterToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.message", is("Access Granted")));
    }

    @Test
    @DisplayName("RBAC - Manager role should also have access to /api/v1/test/waiter")
    void testManager_CanAccessWaiterEndpoint() throws Exception {
        mockMvc.perform(get("/api/v1/test/waiter")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));
    }

    @Test
    @DisplayName("RBAC - Chef role should have access to /api/v1/test/chef")
    void testChef_CanAccessChefEndpoint() throws Exception {
        mockMvc.perform(get("/api/v1/test/chef")
                        .header("Authorization", "Bearer " + chefToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));
    }

    @Test
    @DisplayName("RBAC - Chef role should be denied (403 Forbidden) from /api/v1/test/cashier")
    void testChef_CannotAccessCashierEndpoint() throws Exception {
        mockMvc.perform(get("/api/v1/test/cashier")
                        .header("Authorization", "Bearer " + chefToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status", is(403)));
    }

    @Test
    @DisplayName("RBAC - Cashier role should have access to /api/v1/test/cashier")
    void testCashier_CanAccessCashierEndpoint() throws Exception {
        mockMvc.perform(get("/api/v1/test/cashier")
                        .header("Authorization", "Bearer " + cashierToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));
    }

    @Test
    @DisplayName("RBAC - Cashier role should be denied (403 Forbidden) from /api/v1/test/chef")
    void testCashier_CannotAccessChefEndpoint() throws Exception {
        mockMvc.perform(get("/api/v1/test/chef")
                        .header("Authorization", "Bearer " + cashierToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status", is(403)));
    }

    @Test
    @DisplayName("RBAC - Unauthenticated requests should be rejected with 401 Unauthorized")
    void testUnauthenticated_Rejected() throws Exception {
        mockMvc.perform(get("/api/v1/test/waiter"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status", is(401)));
    }
}
