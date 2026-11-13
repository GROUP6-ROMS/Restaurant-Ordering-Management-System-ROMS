package com.romsteam.roms.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * Cấu hình hệ thống WebSocket STOMP Message Broker cho ROMS
 * Hỗ trợ giao tiếp 2 chiều thời gian thực cực nhanh (<20ms) giữa Backend và các thiết bị Frontend
 * (Tablet Phục vụ, Màn hình Bếp KDS, Máy thu ngân POS, Điện thoại Khách hàng quét mã QR).
 */
@Slf4j
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Kích hoạt Simple In-Memory Message Broker với các tiền tố đích đến (/topic cho broadcast, /queue cho unicast)
        config.enableSimpleBroker("/topic", "/queue");
        // Tiền tố cho các message từ client gửi lên backend xử lý
        // config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // 1. Endpoint STOMP hỗ trợ SockJS fallback (cho trình duyệt hạn chế WebSocket)
        registry.addEndpoint("/ws-roms")
                .setAllowedOriginPatterns("*")
                .withSockJS();

        // 2. Endpoint STOMP thuần Native WebSocket (chuẩn HTML5 WebSocket cho độ trễ thấp nhất)
        registry.addEndpoint("/ws-roms-native")
                .setAllowedOriginPatterns("*");
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        // Chặn tuyệt đối Client tùy tiện phát sóng tin nhắn trực tiếp qua broker STOMP (/topic/** hoặc /queue/**)
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
                if (accessor != null && StompCommand.SEND.equals(accessor.getCommand())) {
                    String destination = accessor.getDestination();
                    log.warn("[Security] Phát hiện và chặn client gửi trực tiếp STOMP SEND tới destination: {}", destination);
                    throw new AccessDeniedException("Client không được phép gửi tin nhắn trực tiếp qua broker WebSocket: " + destination);
                }
                return message;
            }
        });
    }
}
