package com.romsteam.roms.repository;

import com.romsteam.roms.entity.Zone;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ZoneRepository extends JpaRepository<Zone, Long> {

    Optional<Zone> findByZoneCode(String zoneCode);

    boolean existsByZoneCode(String zoneCode);

    List<Zone> findByIsActiveTrueOrderByDisplayOrderAsc();

    List<Zone> findAllByOrderByDisplayOrderAsc();
}
