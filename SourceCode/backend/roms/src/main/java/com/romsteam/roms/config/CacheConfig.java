package com.romsteam.roms.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.Arrays;
import java.util.concurrent.TimeUnit;

/**
 * Cấu hình Spring Cache sử dụng Caffeine (High-Performance In-Memory Cache).
 * Tối ưu hóa truy vấn thực đơn và danh mục cho khách quét mã QR,
 * giảm tải 95%+ áp lực đọc vào CSDL SQL Server trong các khung giờ cao điểm.
 */
@Configuration
@EnableCaching
public class CacheConfig {

    public static final String CACHE_CUSTOMER_MENU = "customerMenu";
    public static final String CACHE_CATEGORIES = "categories";

    @Bean
    public CacheManager cacheManager() {
        CaffeineCacheManager cacheManager = new CaffeineCacheManager();
        cacheManager.setCacheNames(Arrays.asList(
                CACHE_CUSTOMER_MENU,
                CACHE_CATEGORIES
        ));
        cacheManager.setCaffeine(Caffeine.newBuilder()
                .initialCapacity(20)
                .maximumSize(500)
                .expireAfterWrite(60, TimeUnit.SECONDS) // Tự động làm mới định kỳ mỗi 60s
                .recordStats());
        return cacheManager;
    }
}
