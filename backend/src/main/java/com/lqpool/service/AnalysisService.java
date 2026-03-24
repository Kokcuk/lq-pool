package com.lqpool.service;

import com.lqpool.client.DefiLlamaClient;
import com.lqpool.client.DefiLlamaClient.RawPool;
import com.lqpool.dto.*;
import com.lqpool.exception.InvalidParamException;
import com.lqpool.exception.PoolNotFoundException;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class AnalysisService {

    // Risk tolerance (1–10) → confidence level (%)
    private static final int[] CONFIDENCE = {0, 99, 97, 95, 93, 90, 87, 83, 80, 75, 70};

    private final DefiLlamaClient defiLlamaClient;

    public AnalysisService(DefiLlamaClient defiLlamaClient) {
        this.defiLlamaClient = defiLlamaClient;
    }

    public PoolAnalysis analyze(String poolId, int risk) {
        if (risk < 1 || risk > 10) {
            throw new InvalidParamException("risk must be 1-10");
        }

        // Find pool in DeFiLlama data
        RawPool raw = defiLlamaClient.fetchPools().stream()
                .filter(p -> poolId.equals(p.pool()))
                .findFirst()
                .orElseThrow(() -> new PoolNotFoundException(poolId));

        List<String> tokens = raw.underlyingTokens();
        if (tokens == null || tokens.size() < 2) {
            throw new PoolNotFoundException(poolId + " (no underlying token addresses available)");
        }

        String chainSlug = PoolService.toChainSlug(raw.chain());
        String coinKey0 = toDeFiLlamaCoinsChain(chainSlug) + ":" + tokens.get(0).toLowerCase();
        String coinKey1 = toDeFiLlamaCoinsChain(chainSlug) + ":" + tokens.get(1).toLowerCase();

        List<PricePoint> prices0 = defiLlamaClient.fetchPriceHistory(coinKey0);
        List<PricePoint> prices1 = defiLlamaClient.fetchPriceHistory(coinKey1);

        if (prices0.isEmpty() || prices1.isEmpty()) {
            throw new PoolNotFoundException(poolId + " (price history unavailable)");
        }

        // Align price series by timestamp — use token0/token1 ratio
        List<PricePoint> ratioSeries = computeRatioSeries(prices0, prices1);
        if (ratioSeries.isEmpty()) {
            throw new PoolNotFoundException(poolId + " (could not compute price ratio series)");
        }

        double currentPrice = ratioSeries.get(ratioSeries.size() - 1).price();
        int confidenceLevel = CONFIDENCE[risk];

        double[] priceValues = ratioSeries.stream().mapToDouble(PricePoint::price).toArray();
        double[] sorted = Arrays.copyOf(priceValues, priceValues.length);
        Arrays.sort(sorted);

        double lowerTail = (1.0 - confidenceLevel / 100.0) / 2.0;
        double upperTail = 1.0 - lowerTail;
        double lowerPrice = percentile(sorted, lowerTail);
        double upperPrice = percentile(sorted, upperTail);
        double spreadPercent = (upperPrice - lowerPrice) / currentPrice * 100;

        PriceWindow priceWindow = new PriceWindow(lowerPrice, upperPrice, spreadPercent);

        // IL at boundaries using classic approximation: IL = 2*sqrt(r)/(1+r) - 1
        double ilAtLower = classicIL(lowerPrice / currentPrice) * 100;
        double ilAtUpper = classicIL(upperPrice / currentPrice) * 100;

        VolatilityMetrics volatilityMetrics = computeVolatilityMetrics(priceValues, lowerPrice, upperPrice);

        return new PoolAnalysis(poolId, currentPrice, risk, confidenceLevel,
                priceWindow, ilAtLower, ilAtUpper, volatilityMetrics, ratioSeries);
    }

    private List<PricePoint> computeRatioSeries(List<PricePoint> prices0, List<PricePoint> prices1) {
        // Build a map from timestamp to price for token1
        Map<Long, Double> map1 = new LinkedHashMap<>();
        for (PricePoint p : prices1) {
            map1.put(p.timestamp(), p.price());
        }

        List<PricePoint> result = new ArrayList<>();
        for (PricePoint p0 : prices0) {
            Double p1 = map1.get(p0.timestamp());
            if (p1 != null && p1 != 0) {
                result.add(new PricePoint(p0.timestamp(), p0.price() / p1));
            }
        }
        return result;
    }

    private double percentile(double[] sorted, double quantile) {
        if (sorted.length == 0) return 0;
        double pos = quantile * (sorted.length - 1);
        int lo = (int) pos;
        int hi = Math.min(lo + 1, sorted.length - 1);
        double frac = pos - lo;
        return sorted[lo] * (1 - frac) + sorted[hi] * frac;
    }

    private double classicIL(double r) {
        // IL = 2*sqrt(r)/(1+r) - 1  (negative value means loss)
        return 2 * Math.sqrt(r) / (1 + r) - 1;
    }

    private VolatilityMetrics computeVolatilityMetrics(double[] prices, double lower, double upper) {
        // 1-year daily stddev
        double mean = Arrays.stream(prices).average().orElse(0);
        double variance = Arrays.stream(prices)
                .map(p -> (p - mean) * (p - mean))
                .average().orElse(0);
        double stdDev = Math.sqrt(variance) / mean * 100; // as % of mean

        // Max drawdown
        double maxDrawdown = 0;
        double peak = prices[0];
        for (double price : prices) {
            if (price > peak) peak = price;
            double drawdown = (peak - price) / peak * 100;
            if (drawdown > maxDrawdown) maxDrawdown = drawdown;
        }

        // % of days in range
        long inRange = Arrays.stream(prices).filter(p -> p >= lower && p <= upper).count();
        double percentInRange = (double) inRange / prices.length * 100;

        return new VolatilityMetrics(stdDev, maxDrawdown, percentInRange);
    }

    // Maps our chain slugs to DeFiLlama coins API chain identifiers
    private String toDeFiLlamaCoinsChain(String slug) {
        return switch (slug) {
            case "avalanche" -> "avax";
            case "zksync" -> "era";
            case "polygon-zkevm" -> "polygon_zkevm";
            default -> slug;
        };
    }
}
