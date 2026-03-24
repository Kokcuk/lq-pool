package com.lqpool.controller;

import com.lqpool.dto.Platform;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/platforms")
public class PlatformController {

    private static final List<Platform> PLATFORMS = List.of(
            new Platform("uniswap-v3", "Uniswap v3",
                    List.of("ethereum", "arbitrum", "optimism", "polygon", "base", "bsc", "avalanche", "celo", "blast")),
            new Platform("sushiswap-v3", "SushiSwap v3",
                    List.of("ethereum", "arbitrum", "optimism", "polygon", "base", "bsc", "avalanche", "fantom")),
            new Platform("pancakeswap-v3", "PancakeSwap v3",
                    List.of("bsc", "ethereum", "arbitrum", "base", "zksync", "polygon-zkevm", "linea", "opbnb"))
    );

    @GetMapping
    public List<Platform> getPlatforms() {
        return PLATFORMS;
    }
}
