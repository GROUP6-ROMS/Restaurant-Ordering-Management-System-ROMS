package com.romsteam.roms.service.serviceImpl;

import com.romsteam.roms.dto.request.UpdateRestaurantProfileRequest;
import com.romsteam.roms.dto.response.RestaurantProfileResponse;
import com.romsteam.roms.dto.response.RomsRealtimeEvent;
import com.romsteam.roms.entity.RestaurantProfile;
import com.romsteam.roms.repository.RestaurantProfileRepository;
import com.romsteam.roms.service.RealtimeService;
import com.romsteam.roms.service.RestaurantProfileService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class RestaurantProfileServiceImpl implements RestaurantProfileService {

    private final RestaurantProfileRepository profileRepository;
    private final RealtimeService realtimeService;

    @Value("${payos.account-number:0905982428}")
    private String defaultPayosAccountNumber;

    @Value("${payos.account-name:NGO VIET BAO HUY}")
    private String defaultPayosAccountName;

    @Value("${payos.bank-name:MBBank}")
    private String defaultPayosBankName;

    @Value("${payos.bank-bin:970422}")
    private String defaultPayosBankBin;

    @Override
    @Transactional
    public RestaurantProfileResponse getProfile() {
        RestaurantProfile profile = profileRepository.findFirstByOrderByIdAsc()
                .orElseGet(this::initDefaultProfile);
        return mapToResponse(profile);
    }

    @Override
    @Transactional
    public RestaurantProfileResponse updateProfile(UpdateRestaurantProfileRequest request) {
        RestaurantProfile profile = profileRepository.findFirstByOrderByIdAsc()
                .orElseGet(this::initDefaultProfile);

        profile.setName(request.getName());
        profile.setBrandName(request.getBrandName());
        profile.setTagline(request.getTagline());
        profile.setAddress(request.getAddress());
        profile.setPhone(request.getPhone());
        profile.setTaxCode(request.getTaxCode());
        profile.setWifiName(request.getWifiName());
        profile.setWifiPassword(request.getWifiPassword());
        profile.setFooterMessage(request.getFooterMessage());
        profile.setLogoUrl(request.getLogoUrl());

        if (request.getBankAccountNumber() != null && !request.getBankAccountNumber().trim().isEmpty()) {
            profile.setBankAccountNumber(request.getBankAccountNumber());
        }
        if (request.getBankAccountName() != null && !request.getBankAccountName().trim().isEmpty()) {
            profile.setBankAccountName(request.getBankAccountName());
        }
        if (request.getBankName() != null && !request.getBankName().trim().isEmpty()) {
            profile.setBankName(request.getBankName());
        }
        if (request.getBankBin() != null && !request.getBankBin().trim().isEmpty()) {
            profile.setBankBin(request.getBankBin());
        }

        RestaurantProfile saved = profileRepository.save(profile);
        RestaurantProfileResponse response = mapToResponse(saved);

        // Bắn sự kiện thời gian thực qua WebSocket STOMP tới toàn bộ client
        try {
            RomsRealtimeEvent event = RomsRealtimeEvent.builder()
                    .type("RESTAURANT_PROFILE_UPDATE")
                    .payload(response)
                    .note("Cập nhật thông tin nhà hàng: " + response.getBrandName())
                    .timestamp(System.currentTimeMillis())
                    .build();
            realtimeService.publish("/topic/restaurant-profile", event);
        } catch (Exception e) {
            log.warn("[Realtime Service] Không thể phát event cập nhật thương hiệu: {}", e.getMessage());
        }

        return response;
    }

    private RestaurantProfile initDefaultProfile() {
        log.info("Khởi tạo cấu hình thương hiệu mặc định ban đầu cho ROMS...");
        RestaurantProfile defaultEntity = RestaurantProfile.builder()
                .name("HỆ THỐNG NHÀ HÀNG & QUÁN ĂN ROMS")
                .brandName("ROMS Dining & POS")
                .tagline("Phục vụ tận tâm • Món ngon chuẩn vị • Vận hành thông minh")
                .address("Số 123 Đường Ẩm Thực, Quận 1, TP. Hồ Chí Minh")
                .phone("0901.234.567")
                .taxCode("0318999999")
                .wifiName("ROMS-GUEST")
                .wifiPassword("roms-welcome")
                .footerMessage("Cảm ơn Quý khách & Hẹn gặp lại!")
                .logoUrl("")
                .bankAccountName(defaultPayosAccountName)
                .bankAccountNumber(defaultPayosAccountNumber)
                .bankName(defaultPayosBankName)
                .bankBin(defaultPayosBankBin)
                .build();
        return profileRepository.save(defaultEntity);
    }

    private RestaurantProfileResponse mapToResponse(RestaurantProfile p) {
        return RestaurantProfileResponse.builder()
                .id(p.getId())
                .name(p.getName())
                .brandName(p.getBrandName())
                .tagline(p.getTagline())
                .address(p.getAddress())
                .phone(p.getPhone())
                .taxCode(p.getTaxCode())
                .wifiName(p.getWifiName())
                .wifiPassword(p.getWifiPassword())
                .footerMessage(p.getFooterMessage())
                .logoUrl(p.getLogoUrl())
                .bankAccountName(p.getBankAccountName())
                .bankAccountNumber(p.getBankAccountNumber())
                .bankName(p.getBankName())
                .bankBin(p.getBankBin())
                .updatedAt(p.getUpdatedAt())
                .build();
    }
}
