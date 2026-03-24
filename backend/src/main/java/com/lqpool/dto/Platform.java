package com.lqpool.dto;

import java.util.List;

public record Platform(
        String id,
        String name,
        List<String> chains
) {}
