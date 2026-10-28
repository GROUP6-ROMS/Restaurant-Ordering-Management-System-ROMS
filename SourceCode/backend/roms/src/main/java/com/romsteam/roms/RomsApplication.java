package com.romsteam.roms;

import jakarta.annotation.PostConstruct;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.util.TimeZone;

@SpringBootApplication
public class RomsApplication {

	@PostConstruct
	public void init() {
		// Đảm bảo toàn bộ ứng dụng Spring Boot luôn chạy trên múi giờ Việt Nam (GMT+7)
		// bất kể môi trường triển khai (Local, Docker, VPS, Linux container)
		TimeZone.setDefault(TimeZone.getTimeZone("Asia/Ho_Chi_Minh"));
	}

	public static void main(String[] args) {
		SpringApplication.run(RomsApplication.class, args);
	}

}
