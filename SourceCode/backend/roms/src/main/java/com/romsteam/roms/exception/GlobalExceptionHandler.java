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

import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;

// @RestControllerAdvice: Lang nghe va danh chan (intercept) moi Exception xay ra o tat ca cac RestController
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    // 1. Xu ly ngoai le nghiep vu do lap trinh vien tu nem ra (AppException)
    @ExceptionHandler(AppException.class)
    public ResponseEntity<ApiResponse<Void>> handleAppException(AppException ex) {
        log.warn("[TraceID: {}] Nghiệp vụ ngoại lệ [{}]: {}", MDC.get("traceId"), ex.getHttpStatus(), ex.getMessage());
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

        log.warn("[TraceID: {}] Dữ liệu request không hợp lệ: {}", MDC.get("traceId"), errors);
        ApiResponse<Void> response = ApiResponse.error("Dữ liệu gửi lên không hợp lệ!", errors);
        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }

    // 2.1. Xu ly ngoai le khong tim thay tai nguyen (ResourceNotFoundException -> 404 NOT_FOUND)
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleResourceNotFoundException(ResourceNotFoundException ex) {
        log.warn("[TraceID: {}] Tài nguyên không tồn tại: {}", MDC.get("traceId"), ex.getMessage());
        ApiResponse<Void> response = ApiResponse.error(ex.getMessage());
        return new ResponseEntity<>(response, HttpStatus.NOT_FOUND);
    }

    // 2.2. Xu ly ngoai le sai dinh dang kieu du lieu tham so URL/ID (MethodArgumentTypeMismatchException -> 400 BAD_REQUEST)
    @ExceptionHandler(org.springframework.web.method.annotation.MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ApiResponse<Void>> handleTypeMismatchException(org.springframework.web.method.annotation.MethodArgumentTypeMismatchException ex) {
        log.warn("[TraceID: {}] Tham số URL không đúng định dạng: {}", MDC.get("traceId"), ex.getName());
        ApiResponse<Void> response = ApiResponse.error("Tham số yêu cầu không đúng định dạng: " + ex.getName());
        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }

    // 2.3. Xu ly ngoai le tu choi quyen truy cap (AccessDeniedException -> 403 FORBIDDEN)
    @ExceptionHandler(org.springframework.security.access.AccessDeniedException.class)
    public ResponseEntity<ApiResponse<Void>> handleAccessDeniedException(org.springframework.security.access.AccessDeniedException ex) {
        log.warn("[TraceID: {}] Bị từ chối truy cập: {}", MDC.get("traceId"), ex.getMessage());
        ApiResponse<Void> response = ApiResponse.error("Bạn không có quyền thực hiện hành động này!");
        return new ResponseEntity<>(response, HttpStatus.FORBIDDEN);
    }

    // 3. Xu ly tat ca cac ngoai le he thong khong mong muon khac (NullPointerException, SQL loi ket noi...)
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleGlobalException(Exception ex) {
        log.error("[TraceID: {}] Lỗi hệ thống nội bộ chưa kiểm soát: {}", MDC.get("traceId"), ex.getMessage(), ex);
        // Ghi de thong diep chung de tranh de lo thong tin nhay cam cua server ra client
        ApiResponse<Void> response = ApiResponse.error("Đã xảy ra lỗi hệ thống nội bộ: " + ex.getMessage());
        return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
