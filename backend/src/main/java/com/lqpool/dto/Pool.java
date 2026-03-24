package com.lqpool.dto;

public record Pool(
        String id,
        String platform,
        String chain,
        Token token0,
        Token token1,
        double feeTier,
        double tvl,
        double volume24h,
        double feeApr,
        double volatility30d,
        int score
) {}
