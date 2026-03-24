package com.lqpool.controller;

import com.lqpool.dto.PoolAnalysis;
import com.lqpool.dto.PoolsResponse;
import com.lqpool.exception.InvalidParamException;
import com.lqpool.service.AnalysisService;
import com.lqpool.service.PoolService;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;

@RestController
@RequestMapping("/api/pools")
public class PoolController {

    private final PoolService poolService;
    private final AnalysisService analysisService;

    public PoolController(PoolService poolService, AnalysisService analysisService) {
        this.poolService = poolService;
        this.analysisService = analysisService;
    }

    @GetMapping
    public PoolsResponse getPools(
            @RequestParam(required = false) String platform,
            @RequestParam(required = false) String chain,
            @RequestParam(defaultValue = "100000") double minTvl,
            @RequestParam(defaultValue = "10000") double minVolume,
            @RequestParam(defaultValue = "score") String sort,
            @RequestParam(defaultValue = "desc") String order,
            @RequestParam(defaultValue = "50") int limit,
            @RequestParam(defaultValue = "0") int offset
    ) {
        List<String> platforms = parseCommaSeparated(platform);
        List<String> chains = parseCommaSeparated(chain);
        return poolService.getPools(platforms, chains, minTvl, minVolume, sort, order, limit, offset);
    }

    @GetMapping("/{poolId}/analysis")
    public PoolAnalysis getAnalysis(
            @PathVariable String poolId,
            @RequestParam(defaultValue = "5") int risk
    ) {
        return analysisService.analyze(poolId, risk);
    }

    private List<String> parseCommaSeparated(String value) {
        if (value == null || value.isBlank()) return List.of();
        return Arrays.stream(value.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();
    }
}
