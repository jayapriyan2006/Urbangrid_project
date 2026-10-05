package com.urbangrid.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Thrown when a Route already exists (duplicate name, etc.).
 * Automatically maps to HTTP 409 CONFLICT.
 */
@ResponseStatus(HttpStatus.CONFLICT)
public class RouteConflictException extends RuntimeException {

    public RouteConflictException(String message) {
        super(message);
    }
}
