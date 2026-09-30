package com.swp391.roms.service.impl;

import com.swp391.roms.entity.AuditLog;
import com.swp391.roms.entity.User;
import com.swp391.roms.repository.AuditLogRepository;
import com.swp391.roms.service.AuditLogService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuditLogServiceImpl implements AuditLogService {

    private final AuditLogRepository auditLogRepository;

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void log(String action, String targetType, String targetId, String reason, User performedBy, String ipAddress) {
        try {
            AuditLog auditLog = AuditLog.builder()
                    .action(action)
                    .targetType(targetType)
                    .targetId(targetId)
                    .reason(reason)
                    .performedBy(performedBy)
                    .ipAddress(ipAddress)
                    .build();

            auditLogRepository.save(auditLog);
            log.info("Audit log recorded: action={}, user={}, ip={}", action, performedBy != null ? performedBy.getUsername() : "anonymous", ipAddress);
        } catch (Exception ex) {
            log.error("Failed to write audit log: action={}, error={}", action, ex.getMessage(), ex);
        }
    }
}
