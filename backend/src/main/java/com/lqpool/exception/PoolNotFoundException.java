package com.lqpool.exception;

public class PoolNotFoundException extends RuntimeException {
    public PoolNotFoundException(String poolId) {
        super("Pool not found: " + poolId);
    }
}
