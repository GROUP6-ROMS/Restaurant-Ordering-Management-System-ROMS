package com.romsteam.roms.service;

import com.romsteam.roms.dto.request.CreateZoneRequest;
import com.romsteam.roms.dto.request.UpdateZoneRequest;
import com.romsteam.roms.dto.response.ZoneResponse;

import java.util.List;

public interface ZoneService {

    List<ZoneResponse> getAllZones();

    ZoneResponse getZoneById(Long id);

    ZoneResponse createZone(CreateZoneRequest request);

    ZoneResponse updateZone(Long id, UpdateZoneRequest request);

    void deleteZone(Long id);
}
