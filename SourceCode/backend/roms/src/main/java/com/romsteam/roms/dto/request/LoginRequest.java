package com.romsteam.roms.dto.request;

import jakarta.validation.constraints.NotBlank;

public class LoginRequest {

    // Ten dang nhap cua nhan vien (khong duoc de trong)
    @NotBlank(message = "Ten dang nhap khong duoc de trong")
    private String username;

    // Ma PIN 6 chu so (bat buoc, dung dinh dang 6 chu so)
    @NotBlank(message = "Mã PIN không được để trống")
    @jakarta.validation.constraints.Pattern(regexp = "^\\d{6}$", message = "Mã PIN phải gồm đúng 6 chữ số")
    private String pinCode;

    // ===================================================================
    // CONSTRUCTORS
    // ===================================================================

    public LoginRequest() {
    }

    public LoginRequest(String username, String pinCode) {
        this.username = username;
        this.pinCode = pinCode;
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

    public String getPinCode() {
        return pinCode;
    }

    public void setPinCode(String pinCode) {
        this.pinCode = pinCode;
    }
}
