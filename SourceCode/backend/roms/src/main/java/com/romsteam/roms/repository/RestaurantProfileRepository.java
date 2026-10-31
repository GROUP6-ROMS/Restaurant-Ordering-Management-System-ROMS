package com.romsteam.roms.repository;

import com.romsteam.roms.entity.RestaurantProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RestaurantProfileRepository extends JpaRepository<RestaurantProfile, Long> {

    Optional<RestaurantProfile> findFirstByOrderByIdAsc();
}
