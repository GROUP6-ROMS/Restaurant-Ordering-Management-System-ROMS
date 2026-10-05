package com.romsteam.roms.exception;

import org.springframework.http.HttpStatus;

// Ke thua RuntimeException: Day la Unchecked Exception, khong bat buoc lap trinh vien phai bao quanh boi try-catch thu cong
public class AppException extends RuntimeException {

    // Ma trang thai HTTP tuong ung muon tra ve cho client (vi du: 400 BAD_REQUEST, 404 NOT_FOUND, 409 CONFLICT)
    private final HttpStatus httpStatus;

    // Constructor nhan thong diep loi va ma HTTP tuy bien
    public AppException(String message, HttpStatus httpStatus) {
        super(message);
        this.httpStatus = httpStatus;
    }

    // Constructor nhan chi thong diep loi (mac dinh coi la loi 400 Bad Request)
    public AppException(String message) {
        super(message);
        this.httpStatus = HttpStatus.BAD_REQUEST;
    }

    // Getter lay ma HTTP Status
    public HttpStatus getHttpStatus() {
        return httpStatus;
    }
}
