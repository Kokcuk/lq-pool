package com.lqpool.dto;

import java.util.List;

public record PoolsResponse(
        int total,
        List<Pool> pools
) {}
