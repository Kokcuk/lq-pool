package com.lqpool.dto;

public record VolatilityMetrics(
        double stdDev1y,
        double maxDrawdown1y,
        double percentInRange
) {}
