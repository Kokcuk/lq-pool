package com.lqpool.client;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.lqpool.dto.PricePoint;
import com.lqpool.exception.UpstreamException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@Component
public class DefiLlamaClient {

    private final RestClient restClient;
    private final String poolsUrl;
    private final String coinsUrl;

    public DefiLlamaClient(RestClient restClient,
                           @Value("${defillama.pools.url}") String poolsUrl,
                           @Value("${defillama.coins.url}") String coinsUrl) {
        this.restClient = restClient;
        this.poolsUrl = poolsUrl;
        this.coinsUrl = coinsUrl;
    }

    public List<RawPool> fetchPools() {
        try {
            PoolsResponse response = restClient.get()
                    .uri(poolsUrl)
                    .retrieve()
                    .body(PoolsResponse.class);
            if (response == null || response.data() == null) {
                return List.of();
            }
            return response.data();
        } catch (RestClientException ex) {
            throw new UpstreamException("Failed to fetch pools from DeFiLlama", ex);
        }
    }

    /**
     * Fetches 1-year daily price history for a token.
     * @param coin DeFiLlama coin identifier in format "{chain}:{address}"
     */
    public List<PricePoint> fetchPriceHistory(String coin) {
        long start = Instant.now().getEpochSecond() - 365L * 24 * 3600;
        try {
            CoinsResponse response = restClient.get()
                    .uri(coinsUrl + "/{coin}?start={start}&span=365&period=1d", coin, start)
                    .retrieve()
                    .body(CoinsResponse.class);
            if (response == null || response.coins() == null) {
                return List.of();
            }
            CoinData coinData = response.coins().get(coin);
            if (coinData == null || coinData.prices() == null) {
                return List.of();
            }
            return coinData.prices().stream()
                    .map(p -> new PricePoint(p.timestamp(), p.price()))
                    .toList();
        } catch (RestClientException ex) {
            throw new UpstreamException("Failed to fetch price history from DeFiLlama for " + coin, ex);
        }
    }

    // Raw DeFiLlama response types

    @JsonIgnoreProperties(ignoreUnknown = true)
    record PoolsResponse(
            @JsonProperty("data") List<RawPool> data
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record RawPool(
            @JsonProperty("pool") String pool,
            @JsonProperty("chain") String chain,
            @JsonProperty("project") String project,
            @JsonProperty("symbol") String symbol,
            @JsonProperty("tvlUsd") Double tvlUsd,
            @JsonProperty("apyBase") Double apyBase,
            @JsonProperty("volumeUsd1d") Double volumeUsd1d,
            @JsonProperty("underlyingTokens") List<String> underlyingTokens,
            @JsonProperty("poolMeta") String poolMeta
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    record CoinsResponse(
            @JsonProperty("coins") Map<String, CoinData> coins
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    record CoinData(
            @JsonProperty("prices") List<RawPricePoint> prices,
            @JsonProperty("symbol") String symbol
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    record RawPricePoint(
            @JsonProperty("timestamp") long timestamp,
            @JsonProperty("price") double price
    ) {}
}
