package com.romsteam.roms.dto.response;

public class LoginResponse {

    // Chuoi ma hoa JWT Token
    private String accessToken;

    // Loai token chuan OAuth2/JWT (mac dinh la Bearer)
    private String tokenType = "Bearer";

    // Id nhan vien
    private Long id;

    // Ten dang nhap
    private String username;

    // Ho ten day du cua nhan vien
    private String fullName;

    // Vai tro (MANAGER, WAITER, KITCHEN, CASHIER)
    private String role;

    // ===================================================================
    // CONSTRUCTORS
    // ===================================================================

    public LoginResponse() {
    }

    public LoginResponse(String accessToken, Long id, String username, String fullName, String role) {
        this.accessToken = accessToken;
        this.tokenType = "Bearer";
        this.id = id;
        this.username = username;
        this.fullName = fullName;
        this.role = role;
    }

    // ===================================================================
    // GETTERS & SETTERS
    // ===================================================================

    public String getAccessToken() {
        return accessToken;
    }

    public void setAccessToken(String accessToken) {
        this.accessToken = accessToken;
    }

    public String getTokenType() {
        return tokenType;
    }

    public void setTokenType(String tokenType) {
        this.tokenType = tokenType;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }
}
