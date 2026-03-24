package com.lqpool.dto;

public record PriceWindow(
        double lowerPrice,
        double upperPrice,
        double spreadPercent
) {}
