package com.romsteam.roms.service.serviceImpl;

import com.romsteam.roms.dto.request.CreateZoneRequest;
import com.romsteam.roms.dto.request.UpdateZoneRequest;
import com.romsteam.roms.dto.response.ZoneResponse;
import com.romsteam.roms.entity.Zone;
import com.romsteam.roms.exception.AppException;
import com.romsteam.roms.exception.ResourceNotFoundException;
import com.romsteam.roms.repository.RestaurantTableRepository;
import com.romsteam.roms.repository.ZoneRepository;
import com.romsteam.roms.service.ZoneService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ZoneServiceImpl implements ZoneService {

    private final ZoneRepository zoneRepository;
    private final RestaurantTableRepository tableRepository;

    @Override
    @Transactional(readOnly = true)
    public List<ZoneResponse> getAllZones() {
        List<Zone> zones = zoneRepository.findByIsActiveTrueOrderByDisplayOrderAsc();
        return zones.stream()
                .map(this::mapToZoneResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public ZoneResponse getZoneById(Long id) {
        Zone zone = zoneRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Khu vực không tồn tại với ID: " + id));
        return mapToZoneResponse(zone);
    }

    @Override
    @Transactional
    public ZoneResponse createZone(CreateZoneRequest request) {
        String cleanCode = request.getZoneCode().trim().toUpperCase();

        if (zoneRepository.existsByZoneCode(cleanCode)) {
            throw new AppException("Mã khu vực '" + cleanCode + "' đã tồn tại trong hệ thống!", HttpStatus.CONFLICT);
        }

        int displayOrder = request.getDisplayOrder() != null ? request.getDisplayOrder() : 0;
        if (displayOrder == 0) {
            displayOrder = (int) zoneRepository.count() + 1;
        }

        Zone zone = Zone.builder()
                .zoneCode(cleanCode)
                .name(request.getName().trim())
                .description(request.getDescription() != null ? request.getDescription().trim() : null)
                .displayOrder(displayOrder)
                .isActive(true)
                .build();

        Zone savedZone = zoneRepository.save(zone);
        return mapToZoneResponse(savedZone);
    }

    @Override
    @Transactional
    public ZoneResponse updateZone(Long id, UpdateZoneRequest request) {
        Zone zone = zoneRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Khu vực không tồn tại với ID: " + id));

        zone.setName(request.getName().trim());
        if (request.getDescription() != null) {
            zone.setDescription(request.getDescription().trim());
        }
        if (request.getDisplayOrder() != null) {
            zone.setDisplayOrder(request.getDisplayOrder());
        }

        Zone updatedZone = zoneRepository.save(zone);
        return mapToZoneResponse(updatedZone);
    }

    @Override
    @Transactional
    public void deleteZone(Long id) {
        Zone zone = zoneRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Khu vực không tồn tại với ID: " + id));

        // Ràng buộc toàn vẹn dữ liệu: Không cho xóa nếu đang có bàn ăn trực thuộc khu vực này
        long existingTables = tableRepository.countByZone(zone.getZoneCode());
        if (existingTables > 0) {
            throw new AppException(
                    String.format("Không thể xóa khu vực '%s' vì đang có %d bàn ăn trực thuộc. Vui lòng chuyển các bàn sang khu vực khác trước khi xóa!",
                            zone.getName(), existingTables),
                    HttpStatus.BAD_REQUEST
            );
        }

        zoneRepository.delete(zone);
    }

    private ZoneResponse mapToZoneResponse(Zone zone) {
        long tableCount = tableRepository.countByZoneAndIsActiveTrue(zone.getZoneCode());
        return ZoneResponse.builder()
                .id(zone.getId())
                .zoneCode(zone.getZoneCode())
                .name(zone.getName())
                .description(zone.getDescription())
                .displayOrder(zone.getDisplayOrder())
                .tableCount(tableCount)
                .isActive(zone.getIsActive())
                .createdAt(zone.getCreatedAt())
                .updatedAt(zone.getUpdatedAt())
                .build();
    }
}
