package com.lqpool.dto;

import java.util.List;

public record PoolAnalysis(
        String poolId,
        double currentPrice,
        int riskTolerance,
        double confidenceLevel,
        PriceWindow priceWindow,
        double ilAtLower,
        double ilAtUpper,
        VolatilityMetrics volatilityMetrics,
        List<PricePoint> priceHistory
) {}
