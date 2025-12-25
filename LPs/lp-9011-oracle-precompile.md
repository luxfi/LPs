---
lp: 9011
title: Oracle Precompile - Multi-Source Price Aggregation
tags: [defi, oracle, precompile, chainlink, pyth, pricing]
description: Native EVM precompile for multi-source oracle aggregation with Chainlink, Pyth, and CEX feeds
author: Lux Network Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Review
type: Standards Track
category: Core
created: 2025-12-21
requires: 9000, 9010, 3020
implementation: ~/work/lux/standard/contracts/liquidity/precompiles/IOracle.sol
order: 11
---

> **Documentation**: [docs.lux.network/oracle](https://docs.lux.network/oracle)
>
> **Source**: 

## Abstract

LP-9011 specifies the Oracle Precompile at address `0x0200000000000000000000000000000000000011`, providing unified access to multiple price oracle sources including native TWAP, Chainlink, Pyth Network, and major CEX feeds (Binance, Kraken). The precompile aggregates prices with configurable staleness thresholds and confidence intervals for reliable DeFi price discovery.

## Motivation

### Oracle Fragmentation

Current DeFi applications face challenges with oracle integration:

| Issue | Impact | Solution |
|-------|--------|----------|
| Multiple integrations | Complex code, more bugs | Single unified interface |
| Staleness risks | Stale prices = losses | Configurable freshness |
| Single source risk | Oracle manipulation | Multi-source aggregation |
| Gas costs | Multiple calls = high gas | Single precompile call |

### Multi-Source Benefits

1. **Reliability**: No single point of failure
2. **Accuracy**: Cross-validate prices across sources
3. **Freshness**: Use freshest price from any source
4. **MEV Protection**: Harder to manipulate multiple sources

## Specification

### Precompile Address

```solidity
0x0200000000000000000000000000000000000011
```

### Interface Definition

```solidity
// SPDX-License-Identifier: BSD-3-Clause
// Copyright (c) 2025 Lux Industries Inc.
pragma solidity ^0.8.24;

/// @title IOracle - Multi-Source Oracle Precompile Interface
/// @notice Aggregates prices from Chainlink, Pyth, CEXs, and native TWAP
/// @dev Precompile at 0x0200000000000000000000000000000000000011
interface IOracle {
    /*//////////////////////////////////////////////////////////////
                                TYPES
    //////////////////////////////////////////////////////////////*/

    /// @notice Oracle source types
    enum OracleSource {
        NATIVE_TWAP,      // Lux DEX TWAP
        CHAINLINK,        // Chainlink Data Feeds
        PYTH,             // Pyth Network
        BINANCE,          // Binance Oracle (CEX)
        KRAKEN,           // Kraken Oracle (CEX)
        UNISWAP_V3,       // Uniswap V3 TWAP
        AGGREGATE         // Multi-source aggregation
    }

    /// @notice Price data with metadata
    struct Price {
        uint256 price;          // Price in 18 decimals
        uint256 confidence;     // Confidence interval
        uint256 timestamp;      // Last update time
        OracleSource source;    // Price source
        int32 expo;             // Exponent for raw price
    }

    /// @notice Aggregated price from multiple sources
    struct AggregatedPrice {
        uint256 price;          // Median/weighted price
        uint256 minPrice;       // Lowest source price
        uint256 maxPrice;       // Highest source price
        uint256 deviation;      // Max deviation in bps
        uint256 numSources;     // Sources used
        uint256 timestamp;      // Aggregation time
        OracleSource[] sources; // Contributing sources
    }

    /// @notice TWAP configuration
    struct TWAPConfig {
        bytes32 marketId;       // DEX market
        uint256 period;         // TWAP period in seconds
        uint256 minSamples;     // Minimum sample count
    }

    /// @notice Oracle source configuration
    struct SourceConfig {
        OracleSource source;
        address feedAddress;    // Source-specific address
        uint256 maxStaleness;   // Max age in seconds
        uint256 weight;         // Weight for aggregation
        bool enabled;
    }

    /*//////////////////////////////////////////////////////////////
                           PRICE FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /// @notice Get latest price from best available source
    /// @param baseToken Base token address
    /// @param quoteToken Quote token address
    /// @return price Latest price data
    function getPrice(address baseToken, address quoteToken)
        external view returns (Price memory price);

    /// @notice Get price from specific source
    /// @param baseToken Base token address
    /// @param quoteToken Quote token address
    /// @param source Oracle source to use
    /// @return price Price from specified source
    function getPriceFromSource(
        address baseToken,
        address quoteToken,
        OracleSource source
    ) external view returns (Price memory price);

    /// @notice Get aggregated price from all sources
    /// @param baseToken Base token address
    /// @param quoteToken Quote token address
    /// @param maxStaleness Maximum acceptable age in seconds
    /// @return aggregated Aggregated price data
    function getAggregatedPrice(
        address baseToken,
        address quoteToken,
        uint256 maxStaleness
    ) external view returns (AggregatedPrice memory aggregated);

    /// @notice Get TWAP from native DEX
    /// @param config TWAP configuration
    /// @return twap Time-weighted average price
    function getTWAP(TWAPConfig calldata config)
        external view returns (uint256 twap);

    /// @notice Get prices from multiple pairs
    /// @param baseTokens Array of base tokens
    /// @param quoteTokens Array of quote tokens
    /// @return prices Array of price data
    function getPrices(
        address[] calldata baseTokens,
        address[] calldata quoteTokens
    ) external view returns (Price[] memory prices);

    /*//////////////////////////////////////////////////////////////
                        CHAINLINK COMPATIBLE
    //////////////////////////////////////////////////////////////*/

    /// @notice Get latest round data (Chainlink interface)
    /// @param feedId Chainlink feed identifier
    /// @return roundId Round ID
    /// @return answer Price answer
    /// @return startedAt Round start time
    /// @return updatedAt Last update time
    /// @return answeredInRound Round when answered
    function latestRoundData(bytes32 feedId) external view returns (
        uint80 roundId,
        int256 answer,
        uint256 startedAt,
        uint256 updatedAt,
        uint80 answeredInRound
    );

    /// @notice Get decimals for a feed
    function decimals(bytes32 feedId) external view returns (uint8);

    /// @notice Get feed description
    function description(bytes32 feedId) external view returns (string memory);

    /*//////////////////////////////////////////////////////////////
                          PYTH COMPATIBLE
    //////////////////////////////////////////////////////////////*/

    /// @notice Get Pyth price (no older than age)
    /// @param priceId Pyth price feed ID
    /// @param age Maximum acceptable age
    /// @return price Pyth price data
    function getPriceNoOlderThan(bytes32 priceId, uint256 age)
        external view returns (Price memory price);

    /// @notice Get Pyth EMA price
    /// @param priceId Pyth price feed ID
    /// @return emaPrice Exponential moving average price
    function getEmaPriceUnsafe(bytes32 priceId)
        external view returns (Price memory emaPrice);

    /// @notice Update Pyth prices
    /// @param updateData Pyth update data
    function updatePriceFeeds(bytes[] calldata updateData) external payable;

    /// @notice Get Pyth update fee
    function getUpdateFee(bytes[] calldata updateData)
        external view returns (uint256 fee);

    /*//////////////////////////////////////////////////////////////
                        VALIDATION FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /// @notice Check if price is fresh
    /// @param baseToken Base token
    /// @param quoteToken Quote token
    /// @param maxStaleness Maximum acceptable age
    /// @return fresh Whether price is fresh
    function isPriceFresh(
        address baseToken,
        address quoteToken,
        uint256 maxStaleness
    ) external view returns (bool fresh);

    /// @notice Check if all sources agree within threshold
    /// @param baseToken Base token
    /// @param quoteToken Quote token
    /// @param maxDeviation Maximum deviation in bps
    /// @return consensus Whether sources agree
    function hasConsensus(
        address baseToken,
        address quoteToken,
        uint256 maxDeviation
    ) external view returns (bool consensus);

    /// @notice Get available sources for a pair
    function getAvailableSources(address baseToken, address quoteToken)
        external view returns (OracleSource[] memory sources);

    /*//////////////////////////////////////////////////////////////
                              EVENTS
    //////////////////////////////////////////////////////////////*/

    event PriceUpdated(
        address indexed baseToken,
        address indexed quoteToken,
        uint256 price,
        OracleSource source,
        uint256 timestamp
    );

    event SourceAdded(
        address indexed baseToken,
        address indexed quoteToken,
        OracleSource source,
        address feedAddress
    );

    event PriceDeviation(
        address indexed baseToken,
        address indexed quoteToken,
        uint256 deviation,
        OracleSource source1,
        OracleSource source2
    );
}
```solidity

### OracleLib Helper Library

```solidity
/// @title OracleLib - Helper library for Oracle precompile
/// @notice Simplifies oracle price queries
library OracleLib {
    IOracle internal constant ORACLE = IOracle(0x0200000000000000000000000000000000000011);

    /// @notice Get price or revert if stale
    function getPriceOrRevert(
        address baseToken,
        address quoteToken,
        uint256 maxStaleness
    ) internal view returns (uint256 price) {
        IOracle.Price memory p = ORACLE.getPrice(baseToken, quoteToken);
        require(
            block.timestamp - p.timestamp <= maxStaleness,
            "OracleLib: stale price"
        );
        return p.price;
    }

    /// @notice Get aggregated price with minimum sources
    function getAggregatedPriceOrRevert(
        address baseToken,
        address quoteToken,
        uint256 maxStaleness,
        uint256 minSources
    ) internal view returns (uint256 price) {
        IOracle.AggregatedPrice memory agg = ORACLE.getAggregatedPrice(
            baseToken, quoteToken, maxStaleness
        );
        require(agg.numSources >= minSources, "OracleLib: insufficient sources");
        return agg.price;
    }

    /// @notice Get price with deviation check
    function getPriceWithDeviationCheck(
        address baseToken,
        address quoteToken,
        uint256 maxDeviation
    ) internal view returns (uint256 price) {
        require(
            ORACLE.hasConsensus(baseToken, quoteToken, maxDeviation),
            "OracleLib: price deviation"
        );
        return ORACLE.getPrice(baseToken, quoteToken).price;
    }

    /// @notice Convert price to different decimals
    function scalePrice(uint256 price, uint8 fromDecimals, uint8 toDecimals)
        internal pure returns (uint256)
    {
        if (fromDecimals == toDecimals) return price;
        if (fromDecimals < toDecimals) {
            return price * 10**(toDecimals - fromDecimals);
        }
        return price / 10**(fromDecimals - toDecimals);
    }
}
```

### ChainlinkCompatible Wrapper

```solidity
/// @title ChainlinkCompatible - Drop-in Chainlink AggregatorV3 replacement
/// @notice Allows existing Chainlink integrations to use Oracle precompile
abstract contract ChainlinkCompatible {
    IOracle internal constant ORACLE = IOracle(0x0200000000000000000000000000000000000011);

    address public immutable baseToken;
    address public immutable quoteToken;
    bytes32 public immutable feedId;
    uint8 public immutable override decimals;

    constructor(address _baseToken, address _quoteToken, uint8 _decimals) {
        baseToken = _baseToken;
        quoteToken = _quoteToken;
        feedId = keccak256(abi.encodePacked(_baseToken, _quoteToken));
        decimals = _decimals;
    }

    function latestRoundData() external view returns (
        uint80 roundId,
        int256 answer,
        uint256 startedAt,
        uint256 updatedAt,
        uint80 answeredInRound
    ) {
        return ORACLE.latestRoundData(feedId);
    }

    function latestAnswer() external view returns (int256) {
        IOracle.Price memory p = ORACLE.getPrice(baseToken, quoteToken);
        return int256(p.price);
    }

    function latestTimestamp() external view returns (uint256) {
        IOracle.Price memory p = ORACLE.getPrice(baseToken, quoteToken);
        return p.timestamp;
    }

    function description() external view returns (string memory) {
        return ORACLE.description(feedId);
    }
}
```solidity

### PythCompatible Wrapper

```solidity
/// @title PythCompatible - Drop-in Pyth Network replacement
/// @notice Allows existing Pyth integrations to use Oracle precompile
abstract contract PythCompatible {
    IOracle internal constant ORACLE = IOracle(0x0200000000000000000000000000000000000011);

    function getPriceUnsafe(bytes32 id) external view returns (IOracle.Price memory) {
        return ORACLE.getPriceFromSource(
            _idToBase(id),
            _idToQuote(id),
            IOracle.OracleSource.PYTH
        );
    }

    function getPriceNoOlderThan(bytes32 id, uint256 age)
        external view returns (IOracle.Price memory)
    {
        return ORACLE.getPriceNoOlderThan(id, age);
    }

    function getEmaPriceUnsafe(bytes32 id)
        external view returns (IOracle.Price memory)
    {
        return ORACLE.getEmaPriceUnsafe(id);
    }

    function getEmaPriceNoOlderThan(bytes32 id, uint256 age)
        external view returns (IOracle.Price memory)
    {
        IOracle.Price memory p = ORACLE.getEmaPriceUnsafe(id);
        require(block.timestamp - p.timestamp <= age, "Pyth: stale EMA");
        return p;
    }

    function updatePriceFeeds(bytes[] calldata updateData) external payable {
        ORACLE.updatePriceFeeds{value: msg.value}(updateData);
    }

    function getUpdateFee(bytes[] calldata updateData)
        external view returns (uint256)
    {
        return ORACLE.getUpdateFee(updateData);
    }

    function _idToBase(bytes32 id) internal pure virtual returns (address);
    function _idToQuote(bytes32 id) internal pure virtual returns (address);
}
```

### Gas Costs

| Operation | Gas Cost | Notes |
|-----------|----------|-------|
| `getPrice` | 5,000 | Single source |
| `getAggregatedPrice` | 15,000 | Multi-source |
| `getTWAP` | 10,000 | DEX TWAP |
| `getPrices` (batch) | 3,000 per pair | Bulk discount |
| `updatePriceFeeds` | 50,000+ | Pyth updates |
| `hasConsensus` | 20,000 | Cross-validation |

### Oracle Source Configuration

```solidity
┌─────────────────────────────────────────────────────────────────┐
│                     Oracle Source Priority                      │
├─────────────────────┬───────────────────────────────────────────┤
│ Source              │ Priority / Use Case                       │
├─────────────────────┼───────────────────────────────────────────┤
│ 1. Native TWAP      │ Primary for Lux-native assets             │
│ 2. Chainlink        │ Primary for major assets (ETH, BTC)       │
│ 3. Pyth             │ High-frequency, low-latency needs         │
│ 4. Binance/Kraken   │ Cross-validation, exotic pairs            │
│ 5. Uniswap V3       │ EVM TWAP fallback                         │
│ 6. Aggregate        │ Maximum security, multi-source            │
└─────────────────────┴───────────────────────────────────────────┘
```

## Rationale

### Multi-Source Aggregation

The aggregation algorithm:
1. Collect prices from all enabled sources
2. Filter out stale prices (> maxStaleness)
3. Calculate median price (robust to outliers)
4. Compute min/max and deviation
5. Return aggregated result with metadata

### Staleness Configuration

Default staleness thresholds:
- Chainlink: 3600s (1 hour heartbeat)
- Pyth: 60s (high-frequency)
- CEX feeds: 30s (real-time)
- Native TWAP: 300s (5 minutes)

### Weight-Based Aggregation

Sources can have different weights:
- Chainlink (weight: 40): High reliability
- Pyth (weight: 30): High frequency
- Native TWAP (weight: 20): Native liquidity
- CEX (weight: 10): Supplementary

## Backwards Compatibility

### Chainlink Migration

Existing Chainlink consumers can migrate with minimal changes:

```solidity
// Before: Direct Chainlink
AggregatorV3Interface feed = AggregatorV3Interface(feedAddress);
(, int256 answer,,,) = feed.latestRoundData();

// After: Oracle precompile (Chainlink compatible)
(, int256 answer,,,) = OracleLib.ORACLE.latestRoundData(feedId);
```solidity

### Pyth Migration

Pyth consumers get identical interface:

```solidity
// Before: Pyth
IPyth pyth = IPyth(pythAddress);
PythStructs.Price memory price = pyth.getPriceNoOlderThan(priceId, age);

// After: Oracle precompile
IOracle.Price memory price = OracleLib.ORACLE.getPriceNoOlderThan(priceId, age);
```

## Test Cases

### Price Aggregation

```solidity
function testAggregatedPrice() public view {
    address weth = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
    address usdc = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;

    IOracle.AggregatedPrice memory agg = OracleLib.ORACLE.getAggregatedPrice(
        weth,
        usdc,
        3600 // 1 hour staleness
    );

    // Verify aggregation
    assertGt(agg.numSources, 1);
    assertLe(agg.deviation, 100); // Max 1% deviation
    assertGe(agg.price, agg.minPrice);
    assertLe(agg.price, agg.maxPrice);
}
```solidity

### TWAP Calculation

```solidity
function testNativeTWAP() public view {
    bytes32 marketId = keccak256("LUX/USDC");

    uint256 twap = OracleLib.ORACLE.getTWAP(IOracle.TWAPConfig({
        marketId: marketId,
        period: 300, // 5 minutes
        minSamples: 10
    }));

    assertGt(twap, 0);
}
```

## Reference Implementation

### Core Implementation

**Location**: `/Users/z/work/lux/standard/contracts/liquidity/precompiles/IOracle.sol`

```solidity
contracts/liquidity/precompiles/
├── IOracle.sol           # Interface definition (this LP)
├── OraclePrecompile.go   # Go precompile implementation
├── aggregator/           # Price aggregation logic
│   ├── median.go
│   ├── weighted.go
│   └── consensus.go
└── sources/              # Oracle source adapters
    ├── chainlink.go
    ├── pyth.go
    ├── binance.go
    └── twap.go
```

## Security Considerations

### Price Manipulation

1. **Multi-Source Requirement**: Critical operations require multiple sources
2. **Deviation Detection**: Alert on source disagreement
3. **TWAP Resistance**: Use time-weighted prices for large trades

### Staleness Protection

1. **Configurable Thresholds**: Per-source staleness limits
2. **Automatic Fallback**: Use next-best source if primary stale
3. **Circuit Breaker**: Pause if all sources stale

### Flash Loan Resistance

1. **Block Timestamp Checks**: Prevent same-block manipulation
2. **TWAP Windows**: Minimum observation periods
3. **Confidence Intervals**: Reject low-confidence prices

## Economic Impact

### Gas Savings

| Operation | Without Precompile | With Precompile | Savings |
|-----------|-------------------|-----------------|---------|
| Single price | 15,000 gas | 5,000 gas | 67% |
| Multi-source | 50,000 gas | 15,000 gas | 70% |
| Batch prices | 100,000 gas | 20,000 gas | 80% |

### Cost Comparison

For 1M price queries/day:
- Traditional oracles: ~$50,000/month (gas + subscriptions)
- Oracle precompile: ~$5,000/month (gas only)

## Related LPs

- **LP-9005**: Native Oracle Protocol
- **LP-9010**: DEX Precompile (price source)
- **LP-9013**: CrossChainDeFiRouter (oracle consumer)
- **LP-2517**: Precompile Suite Overview

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
