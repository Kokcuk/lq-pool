package com.lqpool.service;

import com.lqpool.client.DefiLlamaClient;
import com.lqpool.client.DefiLlamaClient.RawPool;
import com.lqpool.dto.Pool;
import com.lqpool.dto.PoolsResponse;
import com.lqpool.dto.Token;
import com.lqpool.exception.InvalidParamException;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Stream;

@Service
public class PoolService {

    private static final Set<String> SUPPORTED_PROJECTS = Set.of("uniswap-v3", "sushiswap-v3", "pancakeswap-v3");
    private static final Set<String> VALID_SORT_FIELDS = Set.of("score", "tvl", "volume24h", "feeApr", "volatility30d");

    private final DefiLlamaClient defiLlamaClient;

    public PoolService(DefiLlamaClient defiLlamaClient) {
        this.defiLlamaClient = defiLlamaClient;
    }

    public PoolsResponse getPools(List<String> platforms, List<String> chains,
                                  double minTvl, double minVolume,
                                  String sort, String order,
                                  int limit, int offset) {
        if (!VALID_SORT_FIELDS.contains(sort)) {
            throw new InvalidParamException("sort must be one of: " + String.join(", ", VALID_SORT_FIELDS));
        }
        if (!order.equals("asc") && !order.equals("desc")) {
            throw new InvalidParamException("order must be 'asc' or 'desc'");
        }
        if (limit < 1 || limit > 200) {
            throw new InvalidParamException("limit must be between 1 and 200");
        }
        if (offset < 0) {
            throw new InvalidParamException("offset must be >= 0");
        }

        List<RawPool> raw = defiLlamaClient.fetchPools();

        // Filter to supported projects, apply TVL/volume minimums, platform/chain filters
        List<RawPool> filtered = raw.stream()
                .filter(p -> SUPPORTED_PROJECTS.contains(p.project()))
                .filter(p -> p.tvlUsd() != null && p.tvlUsd() >= minTvl)
                .filter(p -> p.volumeUsd1d() != null && p.volumeUsd1d() >= minVolume)
                .filter(p -> platforms.isEmpty() || platforms.contains(p.project()))
                .filter(p -> chains.isEmpty() || chains.contains(toChainSlug(p.chain())))
                .toList();

        // Convert to Pool DTOs with normalized scores
        List<Pool> pools = toScoredPools(filtered);

        // Sort
        Comparator<Pool> comparator = switch (sort) {
            case "tvl" -> Comparator.comparingDouble(Pool::tvl);
            case "volume24h" -> Comparator.comparingDouble(Pool::volume24h);
            case "feeApr" -> Comparator.comparingDouble(Pool::feeApr);
            case "volatility30d" -> Comparator.comparingDouble(Pool::volatility30d);
            default -> Comparator.comparingInt(Pool::score);
        };
        if (order.equals("desc")) {
            comparator = comparator.reversed();
        }
        pools = pools.stream().sorted(comparator).toList();

        int total = pools.size();
        List<Pool> page = pools.stream().skip(offset).limit(limit).toList();
        return new PoolsResponse(total, page);
    }

    private List<Pool> toScoredPools(List<RawPool> rawPools) {
        // volatility30d is not available from DeFiLlama pools endpoint without per-pool price fetches.
        // Score is min-max normalized feeApr across all fetched pools.
        List<Pool> preliminary = rawPools.stream()
                .map(this::toPoolWithoutScore)
                .toList();

        double minApr = preliminary.stream().mapToDouble(Pool::feeApr).min().orElse(0);
        double maxApr = preliminary.stream().mapToDouble(Pool::feeApr).max().orElse(1);
        double range = maxApr - minApr;

        return preliminary.stream()
                .map(p -> {
                    int score = range > 0 ? (int) Math.round((p.feeApr() - minApr) / range * 100) : 50;
                    return new Pool(p.id(), p.platform(), p.chain(), p.token0(), p.token1(),
                            p.feeTier(), p.tvl(), p.volume24h(), p.feeApr(), p.volatility30d(), score);
                })
                .toList();
    }

    private Pool toPoolWithoutScore(RawPool raw) {
        String[] symbols = raw.symbol() != null ? raw.symbol().split("-", 2) : new String[]{"?", "?"};
        String sym0 = symbols.length > 0 ? symbols[0] : "?";
        String sym1 = symbols.length > 1 ? symbols[1] : "?";

        List<String> tokens = raw.underlyingTokens() != null ? raw.underlyingTokens() : List.of();
        String addr0 = tokens.size() > 0 ? tokens.get(0) : null;
        String addr1 = tokens.size() > 1 ? tokens.get(1) : null;

        Token token0 = new Token(sym0, sym0, addr0);
        Token token1 = new Token(sym1, sym1, addr1);

        double feeTier = parseFeeTier(raw.poolMeta());
        double tvl = raw.tvlUsd() != null ? raw.tvlUsd() : 0;
        double volume = raw.volumeUsd1d() != null ? raw.volumeUsd1d() : 0;
        double feeApr = raw.apyBase() != null ? raw.apyBase() : 0;

        return new Pool(raw.pool(), raw.project(), toChainSlug(raw.chain()),
                token0, token1, feeTier, tvl, volume, feeApr, 0.0, 0);
    }

    private double parseFeeTier(String poolMeta) {
        if (poolMeta == null || poolMeta.isBlank()) return 0.0;
        String cleaned = poolMeta.replace("%", "").trim();
        try {
            return Double.parseDouble(cleaned);
        } catch (NumberFormatException e) {
            return 0.0;
        }
    }

    // Maps DeFiLlama chain names to our slugs
    static String toChainSlug(String chain) {
        if (chain == null) return "";
        return switch (chain) {
            case "BSC" -> "bsc";
            case "Avalanche" -> "avalanche";
            case "zkSync Era" -> "zksync";
            case "Polygon zkEVM" -> "polygon-zkevm";
            case "opBNB" -> "opbnb";
            default -> chain.toLowerCase();
        };
    }
}
