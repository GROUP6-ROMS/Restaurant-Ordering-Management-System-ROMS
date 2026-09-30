package com.swp391.roms.controller;

import com.swp391.roms.common.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/test")
@SecurityRequirement(name = "Bearer Authentication")
@Tag(name = "RBAC Test", description = "Các API kiểm thử phân quyền vai trò nhân viên trong hệ thống (Manager, Waiter, Chef, Cashier)")
public class TestRbacController {

    @GetMapping("/manager")
    @PreAuthorize("hasAuthority('ROLE_MANAGER')")
    @Operation(summary = "Kiểm thử quyền Manager", description = "Chỉ tài khoản có ROLE_MANAGER mới được truy cập")
    public ResponseEntity<ApiResponse<String>> testManager() {
        return ResponseEntity.ok(ApiResponse.success("Access Granted", "Xin chào Quản lý! Bạn có toàn quyền quản trị hệ thống."));
    }

    @GetMapping("/waiter")
    @PreAuthorize("hasAuthority('ROLE_WAITER') or hasAuthority('ROLE_MANAGER')")
    @Operation(summary = "Kiểm thử quyền Waiter", description = "Dành cho Waiter và Manager")
    public ResponseEntity<ApiResponse<String>> testWaiter() {
        return ResponseEntity.ok(ApiResponse.success("Access Granted", "Xin chào Nhân viên Bồi bàn! Bạn có quyền quản lý sơ đồ bàn và gọi món."));
    }

    @GetMapping("/chef")
    @PreAuthorize("hasAuthority('ROLE_CHEF') or hasAuthority('ROLE_MANAGER')")
    @Operation(summary = "Kiểm thử quyền Chef/Kitchen", description = "Dành cho Bếp trưởng và Manager")
    public ResponseEntity<ApiResponse<String>> testChef() {
        return ResponseEntity.ok(ApiResponse.success("Access Granted", "Xin chào Bếp trưởng! Bạn có quyền xem và xử lý đơn trên KDS."));
    }

    @GetMapping("/cashier")
    @PreAuthorize("hasAuthority('ROLE_CASHIER') or hasAuthority('ROLE_MANAGER')")
    @Operation(summary = "Kiểm thử quyền Cashier", description = "Dành cho Thu ngân và Manager")
    public ResponseEntity<ApiResponse<String>> testCashier() {
        return ResponseEntity.ok(ApiResponse.success("Access Granted", "Xin chào Thu ngân! Bạn có quyền kết toán hóa đơn và quản lý két tiền."));
    }
}
