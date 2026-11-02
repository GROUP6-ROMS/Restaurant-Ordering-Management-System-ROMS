package com.romsteam.roms.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * Cấu hình phục vụ tài nguyên tĩnh (Static Resources) cho các file upload (ảnh món ăn).
 * Giúp trình duyệt có thể truy cập ảnh đã tải lên qua URL /api/uploads/menu/** hoặc /uploads/menu/**
 */
@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Value("${app.upload.dir:uploads/menu}")
    private String uploadDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        Path uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
        String fileLocation = "file:" + uploadPath.toString() + "/";

        // Cho phép truy cập qua /api/uploads/menu/** (tương thích proxy của Vite và Nginx)
        registry.addResourceHandler("/api/uploads/menu/**")
                .addResourceLocations(fileLocation);

        // Cho phép truy cập trực tiếp qua /uploads/menu/**
        registry.addResourceHandler("/uploads/menu/**")
                .addResourceLocations(fileLocation);
    }
}
