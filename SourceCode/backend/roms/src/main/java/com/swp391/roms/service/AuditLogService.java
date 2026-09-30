package com.swp391.roms.service;

import com.swp391.roms.entity.User;

public interface AuditLogService {

    void log(String action, String targetType, String targetId, String reason, User performedBy, String ipAddress);
}
