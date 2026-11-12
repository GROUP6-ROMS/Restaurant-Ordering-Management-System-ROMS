package com.romsteam.roms.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

/**
 * Cấu hình các Bean dùng chung toàn hệ thống
 */
@Configuration
public class AppConfig {

    /**
     * Khởi tạo RestTemplate với thời gian chờ kết nối (Timeout) hợp lý
     * Tránh việc gọi API bên ngoài bị treo luồng hệ thống.
     */
    @Bean
    public RestTemplate restTemplate() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        // Thời gian chờ kết nối tối đa: 5 giây
        factory.setConnectTimeout(5000);
        // Thời gian chờ phản hồi tối đa: 10 giây (tránh treo request khi model bên ngoài chậm)
        factory.setReadTimeout(10000);
        return new RestTemplate(factory);
    }
}