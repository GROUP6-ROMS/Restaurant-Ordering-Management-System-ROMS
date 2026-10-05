package com.romsteam.roms.dto.request;

import jakarta.validation.constraints.NotBlank;

public class LoginRequest {

    // Ten dang nhap cua nhan vien (khong duoc de trong)
    @NotBlank(message = "Ten dang nhap khong duoc de trong")
    private String username;

    // Mat khau dang nhap (khong duoc de trong)
    @NotBlank(message = "Mat khau khong duoc de trong")
    private String password;

    // ===================================================================
    // CONSTRUCTORS
    // ===================================================================

    public LoginRequest() {
    }

    public LoginRequest(String username, String password) {
        this.username = username;
        this.password = password;
    }

    // ===================================================================
    // GETTERS & SETTERS
    // ===================================================================

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}
