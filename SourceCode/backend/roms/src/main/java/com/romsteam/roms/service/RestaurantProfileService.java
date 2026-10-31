package com.romsteam.roms.service;

import com.romsteam.roms.dto.request.UpdateRestaurantProfileRequest;
import com.romsteam.roms.dto.response.RestaurantProfileResponse;

public interface RestaurantProfileService {

    RestaurantProfileResponse getProfile();

    RestaurantProfileResponse updateProfile(UpdateRestaurantProfileRequest request);
}
