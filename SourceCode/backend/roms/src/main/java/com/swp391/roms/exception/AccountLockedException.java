package com.swp391.roms.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

import java.time.LocalDateTime;

@Getter
public class AccountLockedException extends AppException {

    private final LocalDateTime lockedUntil;
    private final long minutesRemaining;

    public AccountLockedException(String message, LocalDateTime lockedUntil, long minutesRemaining) {
        super(message, HttpStatus.LOCKED); // 423 LOCKED
        this.lockedUntil = lockedUntil;
        this.minutesRemaining = minutesRemaining;
    }
}
