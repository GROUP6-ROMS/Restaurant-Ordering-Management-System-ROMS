package com.romsteam.roms.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.LocalDateTime;

// @JsonInclude: Chi serialize ra JSON cac truong khong mang gia tri null (vi du: neu khong co loi thi khong gui truong errors: null)
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {

    // Kieu du lieu T (Generics): Dai dien cho bat ky kieu du lieu nao truyen vao (vi du: Staff, List<MenuItem>, String...)

    // Co trang thai request: true = thanh cong, false = that bai
    private boolean success;

    // Cau thong bao than thien cho nguoi dung (vi du: "Dang nhap thanh cong", "Mon an khong ton tai")
    private String message;

    // Du lieu payload thuc te tra ve cho frontend (chua doi tuong kieu T)
    private T data;

    // Danh sach chi tiet loi neu co (danh cho validation form hoac debug)
    private Object errors;

    // Thoi diem may chu sinh ra phan hoi nay
    private LocalDateTime timestamp = LocalDateTime.now();

    // ===================================================================
    // CONSTRUCTORS (HAM KHOI TAO)
    // ===================================================================

    // Constructor mac dinh khong tham so
    public ApiResponse() {
        this.timestamp = LocalDateTime.now();
    }

    // Constructor day du tham so
    public ApiResponse(boolean success, String message, T data, Object errors) {
        this.success = success;
        this.message = message;
        this.data = data;
        this.errors = errors;
        this.timestamp = LocalDateTime.now();
    }

    // ===================================================================
    // CAC HAM TIEN ICH TINH (STATIC FACTORY METHODS) GIUP GOI NHANH O CONTROLLER
    // ===================================================================

    // Tra ve ket qua thanh cong co du lieu payload va thong diep
    public static <T> ApiResponse<T> success(T data, String message) {
        ApiResponse<T> response = new ApiResponse<>();
        response.setSuccess(true);
        response.setMessage(message);
        response.setData(data);
        response.setTimestamp(LocalDateTime.now());
        return response;
    }

    // Tra ve ket qua thanh cong chi co du lieu payload (thong diep mac dinh "Thao tac thanh cong")
    public static <T> ApiResponse<T> success(T data) {
        return success(data, "Thao tác thành công");
    }

    // Tra ve ket qua that bai chi co cau thong bao loi
    public static <T> ApiResponse<T> error(String message) {
        ApiResponse<T> response = new ApiResponse<>();
        response.setSuccess(false);
        response.setMessage(message);
        response.setTimestamp(LocalDateTime.now());
        return response;
    }

    // Tra ve ket qua that bai kem theo danh sach chi tiet cac truong bi loi
    public static <T> ApiResponse<T> error(String message, Object errors) {
        ApiResponse<T> response = new ApiResponse<>();
        response.setSuccess(false);
        response.setMessage(message);
        response.setErrors(errors);
        response.setTimestamp(LocalDateTime.now());
        return response;
    }

    // ===================================================================
    // GETTERS & SETTERS (PHUONG THUC DOC VA GHI DU LIEU)
    // ===================================================================

    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public T getData() {
        return data;
    }

    public void setData(T data) {
        this.data = data;
    }

    public Object getErrors() {
        return errors;
    }

    public void setErrors(Object errors) {
        this.errors = errors;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }
}
