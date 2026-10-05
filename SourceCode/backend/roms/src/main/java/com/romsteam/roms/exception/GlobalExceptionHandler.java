package com.romsteam.roms.exception;

import com.romsteam.roms.dto.response.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

// @RestControllerAdvice: Lang nghe va danh chan (intercept) moi Exception xay ra o tat ca cac RestController
@RestControllerAdvice
public class GlobalExceptionHandler {

    // 1. Xu ly ngoai le nghiep vu do lap trinh vien tu nem ra (AppException)
    @ExceptionHandler(AppException.class)
    public ResponseEntity<ApiResponse<Void>> handleAppException(AppException ex) {
        ApiResponse<Void> response = ApiResponse.error(ex.getMessage());
        return new ResponseEntity<>(response, ex.getHttpStatus());
    }

    // 2. Xu ly ngoai le khi du lieu request body vi pham validation (@Valid: rong, qua dai, so am...)
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Void>> handleValidationExceptions(MethodArgumentNotValidException ex) {
        // Gom danh sach cac truong bi loi va thong diep tuong ung: Key = ten thuoc tinh, Value = cau loi
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach((error) -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });

        ApiResponse<Void> response = ApiResponse.error("Dữ liệu gửi lên không hợp lệ!", errors);
        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }

    // 3. Xu ly tat ca cac ngoai le he thong khong mong muon khac (NullPointerException, SQL loi ket noi...)
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleGlobalException(Exception ex) {
        // Ghi de thong diep chung de tranh de lo thong tin nhay cam cua server ra client
        ApiResponse<Void> response = ApiResponse.error("Đã xảy ra lỗi hệ thống nội bộ: " + ex.getMessage());
        return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
