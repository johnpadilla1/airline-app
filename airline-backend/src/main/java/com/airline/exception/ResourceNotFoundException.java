package com.airline.exception;

public class ResourceNotFoundException extends RuntimeException {

    public ResourceNotFoundException(String message) {
        super(message);
    }

    public ResourceNotFoundException(String resourceName, Object fieldValue) {
        super(String.format("%s not found with value: %s", resourceName, fieldValue));
    }
}
