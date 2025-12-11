---
lp: 0334
title: Per-Asset Threshold Key Management
description: Framework for independent threshold signature configurations per bridged asset, enabling risk-based security and optimized performance.
author: Lux Protocol Team (@luxdefi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Standards Track
category: Core
created: 2025-12-11
requires: 13, 14, 15, 17, 330, 333
---

> **See also**: [LP-13](./lp-0013-m-chain-decentralised-mpc-custody-and-swap-signature-layer.md), [LP-14](./lp-0014-m-chain-threshold-signatures-with-cgg21-uc-non-interactive-ecdsa.md), [LP-15](./lp-0015-mpc-bridge-protocol.md), [LP-17](./lp-0017-bridge-asset-registry.md), [LP-330](./lp-0330-t-chain-thresholdvm-specification.md), [LP-333](./lp-0333-dynamic-signer-rotation-with-lss-protocol.md), [LP-INDEX](./LP-INDEX.md)
>
> **Related LPs**:
> - **LP-330**: T-Chain ThresholdVM Specification - defines the underlying threshold signature infrastructure
> - **LP-333**: Dynamic Signer Rotation with LSS Protocol - specifies how keys are rotated without changing public keys

## Abstract

This proposal specifies a per-asset threshold key management system for Lux's T-Chain (Threshold Chain) and M-Chain MPC custody layer. Each `ManagedKey` operates independently with its own threshold (t), total party count (n), and signer set, allowing distinct security configurations per bridged asset. High-value assets (e.g., BTC, large USDC pools) use higher thresholds (4-of-7 or 5-of-9) for stronger security, while lower-value or high-frequency assets use reduced thresholds (2-of-3) for faster signing latency. This design isolates key compromise risks, enables flexible governance per asset class, and optimizes performance based on asset risk profiles. The specification covers key naming conventions, threshold selection guidelines, key lifecycle management, signer assignment strategies, cross-key coordination, monitoring, and a complete RPC API for key management operations.

## Motivation

### Problem Statement

Current bridge architectures typically employ a single threshold signature configuration for all assets. This one-size-fits-all approach creates several problems:

1. **Suboptimal Security-Performance Trade-off**: A single threshold must balance security needs of high-value assets against latency requirements of frequent low-value transfers. A 5-of-9 threshold secure enough for BTC custody imposes unnecessary 800ms latency on $50 USDC transfers.

2. **Uniform Compromise Impact**: If a universal key is compromised, all bridged assets are at risk simultaneously. There is no compartmentalization of custody risk.

3. **Inflexible Governance**: Different asset classes may have different stakeholders, compliance requirements, or operational needs. A uniform signer set cannot accommodate these differences.

4. **Inefficient Resource Allocation**: High-capability signers are required for all operations, even trivial transfers where simpler hardware would suffice.

### Solution

Per-asset threshold key management addresses these problems by treating each `ManagedKey` as an independent cryptographic entity:

```go
// From thresholdvm/vm.go
type ManagedKey struct {
    KeyID        string      // "eth-usdc", "lux-btc", etc.
    Threshold    int         // t value for THIS key
    TotalParties int         // n value for THIS key
    PartyIDs     []party.ID  // Signers for THIS key
    Algorithm    MPCAlgo     // CGG21, MuSig2, FROST, Ringtail
    CreatedAt    uint64      // Block height
    LastRotation uint64      // Last key refresh height
    Metadata     KeyMetadata // Extended attributes
}
```

Example configurations demonstrating flexibility:

| KeyID | Threshold | Parties | Use Case |
|-------|-----------|---------|----------|
| `lux-usdc` | 2-of-3 | 3 | Fast, frequent small transfers |
| `eth-btc` | 4-of-7 | 7 | High-value BTC custody |
| `zoo-nft` | 3-of-5 | 5 | Balanced NFT bridge |
| `eth-usdc-large` | 5-of-9 | 9 | Large USDC (>$100K) transfers |
| `btc-native` | 5-of-9 | 9 | Native BTC via Taproot MuSig2 |

### Benefits

1. **Risk-Based Security**: Higher-value assets receive proportionally stronger protection through increased thresholds and larger signer committees.

2. **Performance Optimization**: Low-value, high-frequency transfers complete faster with reduced thresholds, improving user experience without compromising security for the value at stake.

3. **Flexible Governance**: Different asset classes can have distinct governance models, compliance structures, and operational procedures appropriate to their specific requirements.

4. **Isolated Compromise**: Compromising one key's signer set does not affect other keys. An attacker who compromises signers for `eth-usdc` cannot sign for `btc-native` unless those signers overlap and meet the threshold for both.

5. **Regulatory Compliance**: Certain jurisdictions or asset types may require specific custody arrangements. Per-asset keys enable compliance with diverse regulatory frameworks.

6. **Operational Efficiency**: Signer hardware and availability requirements can be tailored per asset, reducing infrastructure costs for lower-risk assets.

## Specification

### 1. Key Naming Convention

Keys follow a hierarchical naming scheme that encodes source chain, asset, and optional variant:

```
{source_chain}-{asset_symbol}[-{variant}]
```

This naming convention provides:
- **Uniqueness**: Each key has a globally unique identifier
- **Discoverability**: Keys can be enumerated by chain or asset
- **Clarity**: The purpose and scope of each key is immediately apparent
- **Extensibility**: New chains and assets can be added without conflicts

#### 1.1 Source Chain Identifiers

| Chain | Identifier | Chain ID | Notes |
|-------|------------|----------|-------|
| Ethereum | `eth` | 1 | Mainnet only |
| Bitcoin | `btc` | N/A | Mainnet, Taproot addresses |
| Lux | `lux` | 96369 | All Lux chains (C-Chain) |
| ZOO | `zoo` | 200200 | ZOO network mainnet |
| SPC | `spc` | 36911 | SparklePonya Club mainnet |
| Hanzo | `hanzo` | 36963 | Hanzo AI network |
| Arbitrum | `arb` | 42161 | Arbitrum One |
| Base | `base` | 8453 | Base L2 |
| Optimism | `op` | 10 | Optimism mainnet |
| Polygon | `poly` | 137 | Polygon PoS |
| XRP Ledger | `xrpl` | N/A | XRPL mainnet |
| Solana | `sol` | N/A | Solana mainnet |
| BNB Chain | `bsc` | 56 | BNB Smart Chain |
| Avalanche | `avax` | 43114 | Avalanche C-Chain |

#### 1.2 Asset Symbol Rules

- Use lowercase ticker symbols: `btc`, `eth`, `usdc`, `usdt`
- For native tokens, use chain name: `eth-eth`, `btc-native`, `lux-lux`
- For wrapped tokens, prefix with `w`: `eth-wbtc`, `arb-weth`
- For NFT collections, use collection identifier: `eth-bayc`, `eth-cryptopunks`

#### 1.3 Variant Suffixes

Optional suffixes indicate specialized configurations. Variants enable the same asset to have multiple keys with different security profiles:

| Suffix | Meaning | Typical Threshold | Use Case |
|--------|---------|-------------------|----------|
| `-micro` | Micro-transactions (<$1K) | 2-of-3 | Retail payments, small swaps |
| `-small` | Small transfers ($1K-$10K) | 2-of-3 | Standard user transactions |
| `-medium` | Medium transfers ($10K-$100K) | 3-of-5 | Business transactions |
| `-large` | High-value transfers ($100K-$1M) | 4-of-7 | Institutional transfers |
| `-whale` | Very large transfers (>$1M) | 5-of-9 | Whale movements |
| `-custody` | Long-term custody (cold storage) | 7-of-11 | Treasury, reserves |
| `-hot` | High-frequency trading/liquidity | 2-of-3 | Market making, DEX liquidity |
| `-nft` | Non-fungible token specific | 3-of-5 | NFT bridge operations |
| `-defi` | DeFi protocol integration | 3-of-5 | Lending, staking protocols |
| `-v2` | Version 2 of key (post-rotation) | Inherited | Emergency key replacement |
| `-backup` | Backup/disaster recovery key | 5-of-9 | Used if primary compromised |

#### 1.4 Examples

```
eth-usdc           # Ethereum USDC, standard tier
eth-usdc-large     # Ethereum USDC, high-value tier (higher threshold)
eth-usdc-hot       # Ethereum USDC, liquidity/market-making (lower threshold)
btc-native         # Native Bitcoin via Taproot
btc-native-custody # Bitcoin cold storage (maximum threshold)
lux-lux            # Native LUX token
zoo-zoo            # Native ZOO token
arb-weth           # Arbitrum wrapped ETH
base-usdc          # Base USDC
eth-bayc-nft       # Bored Ape Yacht Club NFTs
xrpl-xrp           # Native XRP
```

#### 1.5 KeyID Validation

```go
var keyIDRegex = regexp.MustCompile(`^[a-z]{2,6}-[a-z0-9]{1,12}(-[a-z0-9]{1,10})?$`)

func ValidateKeyID(keyID string) error {
    if !keyIDRegex.MatchString(keyID) {
        return fmt.Errorf("invalid keyID format: %s", keyID)
    }
    parts := strings.Split(keyID, "-")
    if len(parts) < 2 || len(parts) > 3 {
        return fmt.Errorf("keyID must have 2-3 parts: %s", keyID)
    }
    if _, ok := SupportedChains[parts[0]]; !ok {
        return fmt.Errorf("unsupported chain: %s", parts[0])
    }
    return nil
}
```

### 2. Threshold Selection Guidelines

#### 2.1 Value-Based Tiers

| Asset Value Tier | Threshold (t) | Total Parties (n) | Latency Target | Security Level |
|-----------------|---------------|-------------------|----------------|----------------|
| Micro (<$1K) | 2 | 3 | <150ms | Basic |
| Small ($1K-$10K) | 2 | 3 | <200ms | Standard |
| Medium ($10K-$100K) | 3 | 5 | <400ms | Enhanced |
| Large ($100K-$1M) | 4 | 7 | <600ms | High |
| Very Large (>$1M) | 5 | 9 | <800ms | Maximum |
| Custody (Cold) | 7 | 11 | <2000ms | Ultra |

#### 2.2 Threshold Formulas

The threshold t for a given party count n follows the Byzantine fault tolerance formula:

```
t = ceil((2n + 1) / 3)
```

This ensures safety with up to `f = n - t` Byzantine (malicious or unavailable) parties:

| n | t | f (tolerated failures) | Security Margin |
|---|---|------------------------|-----------------|
| 3 | 2 | 1 | 33.3% |
| 5 | 3 | 2 | 40.0% |
| 7 | 5 | 2 | 28.6% |
| 9 | 6 | 3 | 33.3% |
| 11 | 8 | 3 | 27.3% |
| 15 | 10 | 5 | 33.3% |
| 21 | 14 | 7 | 33.3% |

#### 2.3 Algorithm Selection by Asset Type

| Asset Type | Recommended Algorithm | Rationale |
|------------|----------------------|-----------|
| ECDSA chains (ETH, BSC, etc.) | CGG21 | Native ECDSA compatibility |
| Bitcoin Taproot | MuSig2 | BIP-340 Schnorr aggregation |
| EdDSA chains (XRPL, Solana) | FROST | Ed25519 threshold support |
| Quantum-sensitive custody | Ringtail | Post-quantum lattice-based |
| High-frequency trading | CGG21 + presigning | Sub-100ms with offline prep |

#### 2.4 Configuration Examples

```go
// Standard stablecoin configuration
var ethUSDCConfig = KeyConfig{
    KeyID:        "eth-usdc",
    Threshold:    2,
    TotalParties: 3,
    Algorithm:    AlgoCGG21,
    ValueTier:    TierSmall,
    MaxTxValue:   10_000 * 1e6, // $10K in USDC decimals
}

// High-value Bitcoin custody
var btcNativeConfig = KeyConfig{
    KeyID:        "btc-native-custody",
    Threshold:    5,
    TotalParties: 9,
    Algorithm:    AlgoMuSig2,
    ValueTier:    TierVeryLarge,
    MaxTxValue:   0, // No limit (governance approval required)
}

// Large USDC with quantum backup
var ethUSDCLargeConfig = KeyConfig{
    KeyID:        "eth-usdc-large",
    Threshold:    4,
    TotalParties: 7,
    Algorithm:    AlgoCGG21,
    ValueTier:    TierLarge,
    MaxTxValue:   1_000_000 * 1e6, // $1M
    QuantumBackup: true,           // Ringtail dual-sig enabled
}
```

### 2.5 Complete Asset Configuration Examples

This section provides production-ready configurations for major bridged assets.

#### 2.5.1 Bitcoin (BTC) Configuration

Bitcoin requires special handling due to Taproot/MuSig2 requirements:

```go
// BTC Native - Standard tier for typical transfers
var btcNativeConfig = KeyConfig{
    KeyID:        "btc-native",
    Threshold:    3,
    TotalParties: 5,
    Algorithm:    AlgoMuSig2,  // BIP-340 Schnorr for Taproot
    CurveType:    SECP256K1,
    ValueTier:    TierMedium,
    MaxTxValue:   10 * 1e8,    // 10 BTC per tx
    DailyLimit:   100 * 1e8,   // 100 BTC daily
    RefreshDays:  14,          // Bi-weekly share refresh
    Metadata: KeyMetadata{
        Description: "Native Bitcoin bridge via Taproot MuSig2",
        Tags:        []string{"bitcoin", "taproot", "musig2"},
        Attributes: map[string]string{
            "address_type": "p2tr",
            "script_type":  "taproot_key_spend",
        },
    },
}

// BTC Large - High-value institutional transfers
var btcLargeConfig = KeyConfig{
    KeyID:        "btc-native-large",
    Threshold:    5,
    TotalParties: 9,
    Algorithm:    AlgoMuSig2,
    CurveType:    SECP256K1,
    ValueTier:    TierVeryLarge,
    MaxTxValue:   100 * 1e8,   // 100 BTC per tx
    DailyLimit:   500 * 1e8,   // 500 BTC daily
    Cooldown:     100,         // 100 blocks between large txs
    RefreshDays:  7,           // Weekly share refresh
    RequiresDual: false,
    Metadata: KeyMetadata{
        Description: "High-value Bitcoin custody for institutional transfers",
        Tags:        []string{"bitcoin", "taproot", "institutional", "high-value"},
    },
}

// BTC Custody - Cold storage equivalent
var btcCustodyConfig = KeyConfig{
    KeyID:        "btc-native-custody",
    Threshold:    7,
    TotalParties: 11,
    Algorithm:    AlgoMuSig2,
    CurveType:    SECP256K1,
    ValueTier:    TierCustody,
    MaxTxValue:   0,           // No per-tx limit (governance required)
    DailyLimit:   0,           // No daily limit (governance required)
    Cooldown:     1000,        // 1000 blocks cooldown
    RefreshDays:  3,           // Every 3 days
    RequiresDual: true,        // Quantum backup required
    Metadata: KeyMetadata{
        Description: "Bitcoin cold storage - maximum security treasury",
        Tags:        []string{"bitcoin", "custody", "cold-storage", "treasury"},
        Attributes: map[string]string{
            "governance_required": "true",
            "min_confirmations":   "6",
        },
    },
}
```

#### 2.5.2 Ethereum (ETH) Configuration

```go
// ETH Native - Standard tier
var ethNativeConfig = KeyConfig{
    KeyID:        "eth-eth",
    Threshold:    3,
    TotalParties: 5,
    Algorithm:    AlgoCGG21,  // Threshold ECDSA
    CurveType:    SECP256K1,
    ValueTier:    TierMedium,
    MaxTxValue:   100 * 1e18,  // 100 ETH per tx
    DailyLimit:   1000 * 1e18, // 1000 ETH daily
    RefreshDays:  14,
    Metadata: KeyMetadata{
        Description: "Native ETH bridge for standard transfers",
        Tags:        []string{"ethereum", "native", "ecdsa"},
    },
}

// ETH Large - High-value transfers
var ethLargeConfig = KeyConfig{
    KeyID:        "eth-eth-large",
    Threshold:    5,
    TotalParties: 9,
    Algorithm:    AlgoCGG21,
    CurveType:    SECP256K1,
    ValueTier:    TierVeryLarge,
    MaxTxValue:   1000 * 1e18,  // 1000 ETH per tx
    DailyLimit:   10000 * 1e18, // 10000 ETH daily
    Cooldown:     50,           // 50 blocks cooldown
    RefreshDays:  7,
    Metadata: KeyMetadata{
        Description: "High-value ETH custody for whale transfers",
        Tags:        []string{"ethereum", "large", "institutional"},
    },
}
```

#### 2.5.3 USDC Configuration

```go
// USDC Micro - Fast small payments
var usdcMicroConfig = KeyConfig{
    KeyID:        "eth-usdc-micro",
    Threshold:    2,
    TotalParties: 3,
    Algorithm:    AlgoCGG21,
    CurveType:    SECP256K1,
    ValueTier:    TierMicro,
    MaxTxValue:   1_000 * 1e6,    // $1K per tx
    DailyLimit:   50_000 * 1e6,   // $50K daily
    RefreshDays:  90,             // Quarterly refresh
    Metadata: KeyMetadata{
        Description: "USDC micro-payments - fast, low-value transfers",
        Tags:        []string{"stablecoin", "usdc", "micro", "fast"},
        Attributes: map[string]string{
            "target_latency": "150ms",
            "erc20_address":  "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        },
    },
}

// USDC Standard - Default stablecoin bridge
var usdcStandardConfig = KeyConfig{
    KeyID:        "eth-usdc",
    Threshold:    2,
    TotalParties: 3,
    Algorithm:    AlgoCGG21,
    CurveType:    SECP256K1,
    ValueTier:    TierSmall,
    MaxTxValue:   10_000 * 1e6,   // $10K per tx
    DailyLimit:   500_000 * 1e6,  // $500K daily
    RefreshDays:  30,
    Metadata: KeyMetadata{
        Description: "Standard USDC bridge for retail transfers",
        Tags:        []string{"stablecoin", "usdc", "standard"},
    },
}

// USDC Large - Institutional stablecoin
var usdcLargeConfig = KeyConfig{
    KeyID:        "eth-usdc-large",
    Threshold:    4,
    TotalParties: 7,
    Algorithm:    AlgoCGG21,
    CurveType:    SECP256K1,
    ValueTier:    TierLarge,
    MaxTxValue:   1_000_000 * 1e6,   // $1M per tx
    DailyLimit:   10_000_000 * 1e6,  // $10M daily
    Cooldown:     25,                 // 25 blocks cooldown
    RefreshDays:  14,
    QuantumBackup: true,
    Metadata: KeyMetadata{
        Description: "Large USDC transfers with enhanced security",
        Tags:        []string{"stablecoin", "usdc", "large", "institutional"},
    },
}

// USDC Custody - Treasury reserve
var usdcCustodyConfig = KeyConfig{
    KeyID:        "eth-usdc-custody",
    Threshold:    7,
    TotalParties: 11,
    Algorithm:    AlgoCGG21,
    CurveType:    SECP256K1,
    ValueTier:    TierCustody,
    MaxTxValue:   0,                  // Governance required
    DailyLimit:   0,                  // Governance required
    Cooldown:     500,
    RefreshDays:  3,
    RequiresDual: true,
    Metadata: KeyMetadata{
        Description: "USDC treasury custody - cold storage",
        Tags:        []string{"stablecoin", "usdc", "custody", "treasury"},
    },
}
```

#### 2.5.4 USDT Configuration

```go
// USDT Standard - Default tier
var usdtStandardConfig = KeyConfig{
    KeyID:        "eth-usdt",
    Threshold:    2,
    TotalParties: 3,
    Algorithm:    AlgoCGG21,
    CurveType:    SECP256K1,
    ValueTier:    TierSmall,
    MaxTxValue:   10_000 * 1e6,   // $10K per tx
    DailyLimit:   500_000 * 1e6,  // $500K daily
    RefreshDays:  30,
    Metadata: KeyMetadata{
        Description: "Standard USDT bridge for retail transfers",
        Tags:        []string{"stablecoin", "usdt", "standard"},
        Attributes: map[string]string{
            "erc20_address": "0xdAC17F958D2ee523a2206206994597C13D831ec7",
            "decimals":      "6",
        },
    },
}

// USDT Large - High-value
var usdtLargeConfig = KeyConfig{
    KeyID:        "eth-usdt-large",
    Threshold:    4,
    TotalParties: 7,
    Algorithm:    AlgoCGG21,
    CurveType:    SECP256K1,
    ValueTier:    TierLarge,
    MaxTxValue:   1_000_000 * 1e6,   // $1M per tx
    DailyLimit:   10_000_000 * 1e6,  // $10M daily
    Cooldown:     25,
    RefreshDays:  14,
    Metadata: KeyMetadata{
        Description: "Large USDT transfers with enhanced security",
        Tags:        []string{"stablecoin", "usdt", "large"},
    },
}

// Multi-chain USDT configurations
var bscUsdtConfig = KeyConfig{
    KeyID:        "bsc-usdt",
    Threshold:    2,
    TotalParties: 3,
    Algorithm:    AlgoCGG21,
    CurveType:    SECP256K1,
    ValueTier:    TierSmall,
    MaxTxValue:   10_000 * 1e18,
    RefreshDays:  30,
    Metadata: KeyMetadata{
        Description: "BSC USDT bridge",
        Tags:        []string{"stablecoin", "usdt", "bsc"},
        Attributes: map[string]string{
            "chain_id":      "56",
            "bep20_address": "0x55d398326f99059fF775485246999027B3197955",
        },
    },
}
```

#### 2.5.5 Complete Asset Registry

```go
// DefaultAssetConfigs provides production configurations for all major assets
var DefaultAssetConfigs = map[string]KeyConfig{
    // Bitcoin
    "btc-native":         btcNativeConfig,
    "btc-native-large":   btcLargeConfig,
    "btc-native-custody": btcCustodyConfig,

    // Ethereum
    "eth-eth":       ethNativeConfig,
    "eth-eth-large": ethLargeConfig,

    // USDC (multi-chain)
    "eth-usdc":         usdcStandardConfig,
    "eth-usdc-micro":   usdcMicroConfig,
    "eth-usdc-large":   usdcLargeConfig,
    "eth-usdc-custody": usdcCustodyConfig,
    "arb-usdc":         arbUsdcConfig,
    "base-usdc":        baseUsdcConfig,
    "poly-usdc":        polyUsdcConfig,

    // USDT (multi-chain)
    "eth-usdt":       usdtStandardConfig,
    "eth-usdt-large": usdtLargeConfig,
    "bsc-usdt":       bscUsdtConfig,

    // Lux ecosystem
    "lux-lux":  luxNativeConfig,
    "zoo-zoo":  zooNativeConfig,
    "spc-spc":  spcNativeConfig,

    // Wrapped assets
    "eth-wbtc": wbtcConfig,
    "arb-weth": arbWethConfig,
}

// GetConfigForAsset returns the appropriate configuration
func GetConfigForAsset(keyID string) (KeyConfig, error) {
    config, ok := DefaultAssetConfigs[keyID]
    if !ok {
        return KeyConfig{}, fmt.Errorf("no configuration for asset: %s", keyID)
    }
    return config, nil
}

// GetConfigForValueTier returns appropriate key for a transfer value
func GetConfigForValueTier(chain, asset string, valueUSD uint64) (KeyConfig, error) {
    tier := ClassifyValue(valueUSD)
    variants := []string{
        fmt.Sprintf("%s-%s-%s", chain, asset, tier.Suffix()),
        fmt.Sprintf("%s-%s", chain, asset), // fallback to standard
    }

    for _, keyID := range variants {
        if config, ok := DefaultAssetConfigs[keyID]; ok {
            return config, nil
        }
    }

    return KeyConfig{}, fmt.Errorf("no suitable key for %s-%s at tier %s", chain, asset, tier)
}
```

### 3. Key Creation Workflow

#### 3.1 Key Creation Transaction

```go
type KeyCreateTx struct {
    BaseTx
    KeyID         string       // Unique key identifier
    Threshold     uint8        // Required signers
    TotalParties  uint8        // Total signers
    Algorithm     MPCAlgo      // CGG21, MuSig2, FROST, Ringtail
    PartyIDs      []party.ID   // Initial signer set
    ValueTier     ValueTier    // Security tier
    MaxTxValue    uint64       // Per-tx limit (0 = unlimited)
    Metadata      KeyMetadata  // Extended attributes
    GovernanceSig []byte       // Required governance approval
}
```

#### 3.2 Distributed Key Generation Protocol

Key creation follows the CGG21 DKG protocol (or equivalent for other algorithms):

```
1. PROPOSE: Governance submits KeyCreateTx with parameters
2. ACCEPT:  Selected parties acknowledge participation
3. COMMIT:  Each party commits to DKG round 1 values
4. SHARE:   Parties exchange encrypted key shares
5. VERIFY:  All parties verify share consistency
6. PUBLISH: Aggregate public key committed on-chain
```

```go
// DKG state machine
type DKGState uint8

const (
    DKGProposed DKGState = iota
    DKGAccepted
    DKGCommitted
    DKGShared
    DKGVerified
    DKGComplete
    DKGFailed
)

type DKGSession struct {
    KeyID       string
    State       DKGState
    Round       uint8
    Commitments map[party.ID][]byte
    Shares      map[party.ID]EncryptedShare
    AggPubKey   []byte
    StartHeight uint64
    Timeout     uint64
}
```

#### 3.3 Creation RPC Flow

```
Client                 T-Chain/M-Chain               Signers
   |                        |                          |
   |--KeyCreateTx---------->|                          |
   |                        |--DKGInit---------------->|
   |                        |                          |
   |                        |<--DKGCommit (round 1)----|
   |                        |<--DKGCommit (round 1)----|
   |                        |                          |
   |                        |--DKGRound2-------------->|
   |                        |<--DKGShare---------------|
   |                        |<--DKGShare---------------|
   |                        |                          |
   |                        |--DKGFinalize------------>|
   |                        |<--AggPubKey--------------|
   |                        |                          |
   |<--KeyCreated-----------|                          |
```

### 4. Key Metadata Storage

#### 4.1 On-Chain State

```go
// Primary key registry (stored in VM state)
type KeyRegistry struct {
    Keys map[string]*ManagedKey // keyID -> key
}

type ManagedKey struct {
    KeyID         string
    Threshold     uint8
    TotalParties  uint8
    PartyIDs      []party.ID
    Algorithm     MPCAlgo
    AggPubKey     []byte        // 33-65 bytes depending on algorithm
    CreatedAt     uint64        // Block height
    LastRotation  uint64        // Last refresh height
    LastUsed      uint64        // Last signing height
    TxCount       uint64        // Total signatures produced
    ValueLocked   uint64        // Current custody value (wei)
    Status        KeyStatus     // Active, Rotating, Suspended, Revoked
    Metadata      KeyMetadata
}

type KeyMetadata struct {
    Description   string            // Human-readable description
    ValueTier     ValueTier
    MaxTxValue    uint64            // Per-transaction limit
    DailyLimit    uint64            // Rolling 24h limit
    Cooldown      uint64            // Blocks between large txs
    RequiresDual  bool              // Requires quantum backup sig
    Tags          []string          // Classification tags
    Attributes    map[string]string // Custom key-value pairs
}

type KeyStatus uint8

const (
    KeyStatusActive    KeyStatus = iota
    KeyStatusRotating            // DKG in progress for new shares
    KeyStatusSuspended           // Temporarily disabled
    KeyStatusRevoked             // Permanently disabled
)
```

#### 4.2 Off-Chain Signer State

Each signer maintains local state:

```go
type SignerKeyStore struct {
    KeyID       string
    ShareIndex  uint8
    SecretShare []byte          // Encrypted at rest
    PublicPoly  [][]byte        // Verification polynomial
    PeerShares  map[uint8][]byte // Other parties' public shares
    Nonces      []NonceState    // Presigning nonces
    LastRefresh uint64
}

type NonceState struct {
    K      []byte // Nonce share
    Gamma  []byte // Commitment
    Used   bool
    Height uint64 // Block when generated
}
```

### 5. Signer Assignment Strategies

#### 5.1 Selection Criteria

Signers are selected based on multiple factors:

```go
type SignerScore struct {
    PartyID      party.ID
    StakeWeight  uint64   // LUX staked
    Uptime       float64  // 30-day availability (0.0-1.0)
    Latency      uint64   // Median response time (ms)
    SuccessRate  float64  // Signing success rate
    SlashHistory uint32   // Number of slashes
    Geography    string   // Datacenter region
    Hardware     HWClass  // TEE/HSM capabilities
}

func SelectSigners(candidates []SignerScore, n int, config KeyConfig) []party.ID {
    // Filter by minimum requirements
    eligible := filter(candidates, func(s SignerScore) bool {
        return s.StakeWeight >= MinStakeForTier[config.ValueTier] &&
               s.Uptime >= MinUptimeForTier[config.ValueTier] &&
               s.SlashHistory < MaxSlashesAllowed
    })

    // Sort by composite score
    sort.Slice(eligible, func(i, j int) bool {
        return compositeScore(eligible[i]) > compositeScore(eligible[j])
    })

    // Apply geographic diversity constraint
    selected := diversifyGeography(eligible[:n*2], n)

    return selected
}
```

#### 5.2 Geographic Diversity

Keys should have signers distributed across multiple jurisdictions and data centers to ensure resilience against regional failures, regulatory actions, and coordinated attacks:

```go
type GeographyConstraint struct {
    MinRegions     int      // At least N distinct regions
    MaxPerRegion   int      // At most M signers per region
    BannedRegions  []string // Compliance exclusions
    PreferredRegions []string // Regions with priority
}

var DefaultGeoConstraint = GeographyConstraint{
    MinRegions:   3,
    MaxPerRegion: 3,
    BannedRegions: []string{}, // Configurable per asset
    PreferredRegions: []string{"us-east", "eu-west", "ap-southeast"},
}

// Geographic regions for signer distribution
type Region string

const (
    RegionUSEast      Region = "us-east"
    RegionUSWest      Region = "us-west"
    RegionEUWest      Region = "eu-west"
    RegionEUCentral   Region = "eu-central"
    RegionAPSoutheast Region = "ap-southeast"
    RegionAPNortheast Region = "ap-northeast"
    RegionSAEast      Region = "sa-east"
    RegionMEWest      Region = "me-west"
)

// DiversifySigners ensures geographic spread of signers
func DiversifySigners(candidates []SignerScore, n int, constraints GeographyConstraint) ([]party.ID, error) {
    regionCounts := make(map[Region]int)
    selected := make([]party.ID, 0, n)
    regionsUsed := make(map[Region]bool)

    // First pass: ensure minimum regions are covered
    for _, candidate := range candidates {
        region := Region(candidate.Geography)

        // Skip banned regions
        if contains(constraints.BannedRegions, string(region)) {
            continue
        }

        // Skip if region already at max
        if regionCounts[region] >= constraints.MaxPerRegion {
            continue
        }

        selected = append(selected, candidate.PartyID)
        regionCounts[region]++
        regionsUsed[region] = true

        if len(selected) >= n {
            break
        }
    }

    // Verify minimum regions constraint
    if len(regionsUsed) < constraints.MinRegions {
        return nil, fmt.Errorf("insufficient geographic diversity: need %d regions, have %d",
            constraints.MinRegions, len(regionsUsed))
    }

    return selected, nil
}

// Per-tier geographic requirements
var TierGeoRequirements = map[ValueTier]GeographyConstraint{
    TierMicro: {MinRegions: 2, MaxPerRegion: 2},
    TierSmall: {MinRegions: 2, MaxPerRegion: 2},
    TierMedium: {MinRegions: 3, MaxPerRegion: 2},
    TierLarge: {MinRegions: 4, MaxPerRegion: 2},
    TierVeryLarge: {MinRegions: 5, MaxPerRegion: 2},
    TierCustody: {MinRegions: 6, MaxPerRegion: 2},
}
```

**Geographic Diversity Rationale:**

| Tier | Min Regions | Max Per Region | Rationale |
|------|-------------|----------------|-----------|
| Micro | 2 | 2 | Minimal diversity for fast operations |
| Small | 2 | 2 | Balanced for standard transfers |
| Medium | 3 | 2 | Business-grade diversity |
| Large | 4 | 2 | Institutional requirements |
| Very Large | 5 | 2 | High-value protection |
| Custody | 6 | 2 | Maximum geographic spread |

#### 5.3 Hardware Requirements by Tier

| Value Tier | Hardware Requirement |
|------------|---------------------|
| Micro/Small | Standard server, encrypted storage |
| Medium | HSM-backed key storage |
| Large | TEE (SGX/TDX) + HSM |
| Very Large | Dedicated HSM cluster |
| Custody | Air-gapped HSM + multi-sig cold storage |

#### 5.4 Signer Overlap Management

When signers participate in multiple keys, overlap is tracked to prevent cascading failures:

```go
type OverlapMatrix struct {
    Overlaps map[string]map[string]int // keyID -> keyID -> overlap count
}

func (om *OverlapMatrix) CheckNewKey(keyID string, signers []party.ID, existing map[string][]party.ID) error {
    for existingKey, existingSigners := range existing {
        overlap := countOverlap(signers, existingSigners)
        overlapRatio := float64(overlap) / float64(len(signers))
        if overlapRatio > MaxOverlapRatio {
            return fmt.Errorf("key %s has %.0f%% overlap with %s (max %.0f%%)",
                keyID, overlapRatio*100, existingKey, MaxOverlapRatio*100)
        }
    }
    return nil
}

const MaxOverlapRatio = 0.6 // Maximum 60% signer overlap between any two keys
```

### 6. Cross-Key Coordination

#### 6.1 Multi-Key Signing Sessions

When a transaction requires multiple keys (e.g., atomic swap involving two assets), coordination ensures atomicity:

```go
type MultiKeySession struct {
    SessionID  ids.ID
    Keys       []string        // KeyIDs involved
    Messages   [][]byte        // Messages to sign
    Status     map[string]bool // KeyID -> signed status
    Timeout    uint64
    CreatedAt  uint64
}

// Coordinator ensures all-or-nothing execution
func (c *Coordinator) ExecuteMultiKey(session MultiKeySession) ([][]byte, error) {
    results := make([][]byte, len(session.Keys))
    var wg sync.WaitGroup
    var mu sync.Mutex
    var firstErr error

    for i, keyID := range session.Keys {
        wg.Add(1)
        go func(idx int, kid string) {
            defer wg.Done()
            sig, err := c.SignWithKey(kid, session.Messages[idx])
            mu.Lock()
            defer mu.Unlock()
            if err != nil && firstErr == nil {
                firstErr = err
            }
            results[idx] = sig
        }(i, keyID)
    }

    wg.Wait()
    if firstErr != nil {
        return nil, fmt.Errorf("multi-key signing failed: %w", firstErr)
    }
    return results, nil
}
```

#### 6.2 Key Dependency Graph

Some keys may have dependencies (e.g., a wrapped asset key depends on the native asset key):

```go
type KeyDependency struct {
    Parent   string // Parent keyID
    Child    string // Dependent keyID
    Relation string // "wraps", "backs", "derives"
}

// Dependency validation
func ValidateKeyOperation(keyID string, op Operation, deps []KeyDependency) error {
    for _, dep := range deps {
        if dep.Child == keyID {
            parentKey := GetKey(dep.Parent)
            if parentKey.Status != KeyStatusActive {
                return fmt.Errorf("parent key %s is %v", dep.Parent, parentKey.Status)
            }
        }
    }
    return nil
}
```

### 7. Key Lifecycle Management

#### 7.1 State Transitions

```
                    +-------------+
                    |   PROPOSED  |
                    +------+------+
                           |
                    DKG Complete
                           v
                    +------+------+
     +------------->|   ACTIVE    |<-------------+
     |              +------+------+              |
     |                     |                     |
  Unsuspend           Rotate/Suspend         Refresh
     |                     |                     |
     |              +------v------+              |
     +--------------|  ROTATING   |--------------+
                    +------+------+
                           |
                    Revoke/Expire
                           v
                    +------+------+
                    |   REVOKED   |
                    +-------------+
```

#### 7.2 Key Rotation

Proactive key refresh regenerates shares without changing the public key:

```go
type KeyRotateTx struct {
    BaseTx
    KeyID         string
    NewPartyIDs   []party.ID  // Optional: change signer set
    NewThreshold  uint8       // Optional: change threshold
    Reason        string      // Audit trail
    GovernanceSig []byte
}

// Rotation triggers new DKG session
func (vm *VM) ProcessKeyRotate(tx *KeyRotateTx) error {
    key := vm.state.GetKey(tx.KeyID)
    if key == nil {
        return ErrKeyNotFound
    }
    if key.Status != KeyStatusActive {
        return ErrKeyNotActive
    }

    // Start rotation DKG
    key.Status = KeyStatusRotating
    session := &DKGSession{
        KeyID:       tx.KeyID,
        State:       DKGProposed,
        StartHeight: vm.ctx.BlockHeight(),
        Timeout:     vm.ctx.BlockHeight() + DKGTimeoutBlocks,
    }

    // New parties if specified, otherwise same parties with new shares
    if len(tx.NewPartyIDs) > 0 {
        session.Parties = tx.NewPartyIDs
    } else {
        session.Parties = key.PartyIDs
    }

    return vm.state.StartDKG(session)
}
```

#### 7.3 Automatic Refresh Schedule

Keys are automatically refreshed based on tier:

| Value Tier | Refresh Interval | Rationale |
|------------|------------------|-----------|
| Micro/Small | 90 days | Low risk, minimal overhead |
| Medium | 30 days | Moderate protection |
| Large | 14 days | Enhanced security |
| Very Large | 7 days | High-value protection |
| Custody | 3 days | Maximum security |

```go
type RefreshPolicy struct {
    IntervalBlocks uint64
    GracePeriod    uint64 // Blocks after interval before forced refresh
}

var RefreshPolicies = map[ValueTier]RefreshPolicy{
    TierMicro:   {IntervalBlocks: 90 * 7200, GracePeriod: 7 * 7200},
    TierSmall:   {IntervalBlocks: 90 * 7200, GracePeriod: 7 * 7200},
    TierMedium:  {IntervalBlocks: 30 * 7200, GracePeriod: 3 * 7200},
    TierLarge:   {IntervalBlocks: 14 * 7200, GracePeriod: 2 * 7200},
    TierVeryLarge: {IntervalBlocks: 7 * 7200, GracePeriod: 1 * 7200},
    TierCustody: {IntervalBlocks: 3 * 7200, GracePeriod: 6 * 3600},
}
```

#### 7.4 Key Rotation Policies

Key rotation encompasses both proactive share refresh (preserving the public key) and emergency key replacement (new public key). This section details comprehensive rotation policies per value tier.

##### 7.4.1 Rotation Policy Types

```go
// RotationType defines the type of key rotation
type RotationType uint8

const (
    // ProactiveRefresh regenerates shares without changing public key
    // Uses LSS resharing protocol per LP-333
    ProactiveRefresh RotationType = iota

    // SignerRotation changes the signer set while preserving public key
    // Triggered by validator set changes
    SignerRotation

    // ThresholdChange modifies t/n parameters while preserving public key
    // Requires governance approval for custody-tier keys
    ThresholdChange

    // EmergencyReplacement creates new key with new public key
    // Used when compromise suspected or reshare impossible
    EmergencyReplacement
)

// RotationPolicy defines rotation behavior for a key
type RotationPolicy struct {
    // Proactive refresh
    RefreshInterval   time.Duration // Time between share refreshes
    RefreshGrace      time.Duration // Grace period before forced refresh
    MaxShareAge       time.Duration // Maximum age before key suspended

    // Signer rotation
    AutoRotateOnValidatorChange bool    // Trigger on validator set change
    MinSignerOverlap            float64 // Minimum overlap ratio for rotation
    MaxSignerReplacementRatio   float64 // Max signers replaced per rotation

    // Emergency
    EmergencyContactBlocks uint64   // Blocks to attempt contact before emergency
    RequireGovernance      bool     // Require governance for emergency actions
}

// TierRotationPolicies defines rotation policies per value tier
var TierRotationPolicies = map[ValueTier]RotationPolicy{
    TierMicro: {
        RefreshInterval:           90 * 24 * time.Hour,
        RefreshGrace:              7 * 24 * time.Hour,
        MaxShareAge:               120 * 24 * time.Hour,
        AutoRotateOnValidatorChange: false,
        MinSignerOverlap:          0.5,
        MaxSignerReplacementRatio: 0.5,
        EmergencyContactBlocks:    100,
        RequireGovernance:         false,
    },
    TierSmall: {
        RefreshInterval:           90 * 24 * time.Hour,
        RefreshGrace:              7 * 24 * time.Hour,
        MaxShareAge:               120 * 24 * time.Hour,
        AutoRotateOnValidatorChange: false,
        MinSignerOverlap:          0.5,
        MaxSignerReplacementRatio: 0.5,
        EmergencyContactBlocks:    100,
        RequireGovernance:         false,
    },
    TierMedium: {
        RefreshInterval:           30 * 24 * time.Hour,
        RefreshGrace:              3 * 24 * time.Hour,
        MaxShareAge:               45 * 24 * time.Hour,
        AutoRotateOnValidatorChange: true,
        MinSignerOverlap:          0.6,
        MaxSignerReplacementRatio: 0.4,
        EmergencyContactBlocks:    50,
        RequireGovernance:         false,
    },
    TierLarge: {
        RefreshInterval:           14 * 24 * time.Hour,
        RefreshGrace:              2 * 24 * time.Hour,
        MaxShareAge:               21 * 24 * time.Hour,
        AutoRotateOnValidatorChange: true,
        MinSignerOverlap:          0.7,
        MaxSignerReplacementRatio: 0.3,
        EmergencyContactBlocks:    25,
        RequireGovernance:         true,
    },
    TierVeryLarge: {
        RefreshInterval:           7 * 24 * time.Hour,
        RefreshGrace:              24 * time.Hour,
        MaxShareAge:               14 * 24 * time.Hour,
        AutoRotateOnValidatorChange: true,
        MinSignerOverlap:          0.75,
        MaxSignerReplacementRatio: 0.25,
        EmergencyContactBlocks:    10,
        RequireGovernance:         true,
    },
    TierCustody: {
        RefreshInterval:           3 * 24 * time.Hour,
        RefreshGrace:              12 * time.Hour,
        MaxShareAge:               7 * 24 * time.Hour,
        AutoRotateOnValidatorChange: true,
        MinSignerOverlap:          0.8,
        MaxSignerReplacementRatio: 0.2,
        EmergencyContactBlocks:    5,
        RequireGovernance:         true,
    },
}
```

##### 7.4.2 Rotation Triggers

```go
// RotationTrigger defines what initiates a rotation
type RotationTrigger uint8

const (
    TriggerScheduled          RotationTrigger = iota // Time-based scheduled refresh
    TriggerValidatorChange                           // Validator set modification
    TriggerSignerOffline                             // Signer unreachable
    TriggerSecurityIncident                          // Compromise suspected
    TriggerGovernanceDecision                        // Manual governance action
    TriggerThresholdPolicy                           // Policy-driven (e.g., max age)
)

// ShouldRotate evaluates if rotation is needed
func (rm *RotationManager) ShouldRotate(keyID string) (bool, RotationTrigger, error) {
    key := rm.state.GetKey(keyID)
    policy := TierRotationPolicies[key.Metadata.ValueTier]

    // Check scheduled refresh
    shareAge := time.Since(time.Unix(int64(key.LastRotation), 0))
    if shareAge > policy.RefreshInterval {
        return true, TriggerScheduled, nil
    }

    // Check max age (force rotation)
    if shareAge > policy.MaxShareAge {
        return true, TriggerThresholdPolicy, nil
    }

    // Check signer availability
    offlineCount := rm.countOfflineSigners(key.PartyIDs)
    if float64(offlineCount)/float64(len(key.PartyIDs)) > (1 - policy.MinSignerOverlap) {
        return true, TriggerSignerOffline, nil
    }

    // Check for pending validator changes
    if policy.AutoRotateOnValidatorChange && rm.hasPendingValidatorChange(keyID) {
        return true, TriggerValidatorChange, nil
    }

    return false, 0, nil
}
```

##### 7.4.3 Rotation Execution

```go
// ExecuteRotation performs the appropriate rotation based on trigger
func (rm *RotationManager) ExecuteRotation(keyID string, trigger RotationTrigger) error {
    key := rm.state.GetKey(keyID)
    policy := TierRotationPolicies[key.Metadata.ValueTier]

    // Check governance requirement
    if policy.RequireGovernance && !rm.hasGovernanceApproval(keyID, trigger) {
        return ErrGovernanceRequired
    }

    switch trigger {
    case TriggerScheduled, TriggerThresholdPolicy:
        // Proactive refresh - same signers, new shares
        return rm.executeProactiveRefresh(key)

    case TriggerValidatorChange:
        // Signer rotation per LP-333
        newSigners := rm.computeNewSignerSet(key)
        return rm.executeSignerRotation(key, newSigners)

    case TriggerSignerOffline:
        // Remove offline signers and rotate
        activeSigners := rm.getActiveSigners(key.PartyIDs)
        if len(activeSigners) < int(key.Threshold) {
            return rm.executeEmergencyReplacement(key)
        }
        return rm.executeSignerRotation(key, activeSigners)

    case TriggerSecurityIncident:
        // Emergency replacement with new public key
        return rm.executeEmergencyReplacement(key)

    case TriggerGovernanceDecision:
        // Follow governance directive
        return rm.executeGovernanceRotation(key)
    }

    return nil
}

// executeProactiveRefresh performs share refresh without changing public key
func (rm *RotationManager) executeProactiveRefresh(key *ManagedKey) error {
    tx := &KeyRotateTx{
        KeyID:        key.KeyID,
        NewPartyIDs:  key.PartyIDs, // Same signers
        NewThreshold: key.Threshold, // Same threshold
        Reason:       "proactive_refresh",
    }
    return rm.submitRotation(tx)
}
```

##### 7.4.4 Rotation Summary by Tier

| Tier | Refresh Interval | Max Share Age | Auto-Rotate | Governance Required |
|------|------------------|---------------|-------------|---------------------|
| Micro | 90 days | 120 days | No | No |
| Small | 90 days | 120 days | No | No |
| Medium | 30 days | 45 days | Yes | No |
| Large | 14 days | 21 days | Yes | Yes |
| Very Large | 7 days | 14 days | Yes | Yes |
| Custody | 3 days | 7 days | Yes | Yes |

#### 7.5 Emergency Suspension

```go
type KeySuspendTx struct {
    BaseTx
    KeyID         string
    Reason        string
    Evidence      []byte // Proof of compromise or misbehavior
    Duration      uint64 // 0 = indefinite
    GovernanceSig []byte
}

// Emergency suspension can be triggered by governance or automated detection
func (vm *VM) ProcessKeySuspend(tx *KeySuspendTx) error {
    key := vm.state.GetKey(tx.KeyID)
    key.Status = KeyStatusSuspended
    key.Metadata.Attributes["suspend_reason"] = tx.Reason
    key.Metadata.Attributes["suspend_height"] = strconv.FormatUint(vm.ctx.BlockHeight(), 10)

    // Emit event for monitoring
    vm.EmitEvent(EventKeySuspended{
        KeyID:  tx.KeyID,
        Reason: tx.Reason,
        Height: vm.ctx.BlockHeight(),
    })

    return nil
}
```

### 8. Monitoring and Alerting

#### 8.1 Key Health Metrics

```go
type KeyHealthMetrics struct {
    KeyID            string
    SignerAvailability map[party.ID]float64 // 24h availability
    MedianLatency    uint64                  // Signing latency (ms)
    SuccessRate      float64                 // Last 1000 signatures
    LastSignature    uint64                  // Block height
    PendingRequests  int                     // Queued signing requests
    ShareFreshness   uint64                  // Blocks since last refresh
    ValueAtRisk      uint64                  // Current custody value
}

func ComputeKeyHealth(keyID string) KeyHealthMetrics {
    key := GetKey(keyID)
    metrics := KeyHealthMetrics{
        KeyID:           keyID,
        ShareFreshness:  currentHeight - key.LastRotation,
        ValueAtRisk:     key.ValueLocked,
    }

    // Aggregate signer availability
    for _, pid := range key.PartyIDs {
        metrics.SignerAvailability[pid] = GetSignerUptime(pid, 24*time.Hour)
    }

    // Calculate operational metrics
    metrics.MedianLatency = GetMedianSigningLatency(keyID, 1000)
    metrics.SuccessRate = GetSigningSuccessRate(keyID, 1000)
    metrics.LastSignature = GetLastSignatureHeight(keyID)
    metrics.PendingRequests = GetPendingRequestCount(keyID)

    return metrics
}
```

#### 8.2 Alert Conditions

| Condition | Severity | Threshold | Action |
|-----------|----------|-----------|--------|
| Signer offline | Warning | 1 signer >5min | Notify ops |
| Threshold at risk | Critical | <t+1 signers available | Page on-call |
| Signing latency high | Warning | >2x baseline | Investigate |
| Share refresh overdue | Warning | >GracePeriod | Trigger refresh |
| Signing failures | Critical | >3 consecutive | Suspend key |
| Anomalous tx pattern | Warning | ML anomaly score >0.9 | Review queue |

```go
type AlertRule struct {
    Name        string
    Condition   func(KeyHealthMetrics) bool
    Severity    AlertSeverity
    Cooldown    time.Duration
    Actions     []AlertAction
}

var DefaultAlertRules = []AlertRule{
    {
        Name: "threshold_at_risk",
        Condition: func(m KeyHealthMetrics) bool {
            available := countAvailable(m.SignerAvailability, 0.95)
            key := GetKey(m.KeyID)
            return available < int(key.Threshold) + 1
        },
        Severity: SeverityCritical,
        Cooldown: 5 * time.Minute,
        Actions:  []AlertAction{ActionPage, ActionSlack, ActionEmail},
    },
    {
        Name: "share_refresh_overdue",
        Condition: func(m KeyHealthMetrics) bool {
            key := GetKey(m.KeyID)
            policy := RefreshPolicies[key.Metadata.ValueTier]
            return m.ShareFreshness > policy.IntervalBlocks + policy.GracePeriod
        },
        Severity: SeverityWarning,
        Cooldown: 1 * time.Hour,
        Actions:  []AlertAction{ActionTriggerRefresh, ActionSlack},
    },
}
```

#### 8.3 Dashboard Endpoints

```go
// GET /keys/health
type KeyHealthResponse struct {
    Keys []KeyHealthSummary `json:"keys"`
}

type KeyHealthSummary struct {
    KeyID       string  `json:"keyId"`
    Status      string  `json:"status"`
    Health      string  `json:"health"` // healthy, degraded, critical
    Available   int     `json:"availableSigners"`
    Required    int     `json:"requiredSigners"`
    Total       int     `json:"totalSigners"`
    Latency     uint64  `json:"medianLatencyMs"`
    SuccessRate float64 `json:"successRate"`
    LastUsed    uint64  `json:"lastUsedBlock"`
    ValueLocked string  `json:"valueLocked"` // Human-readable USD
}
```

### 9. RPC API for Key Management

#### 9.1 Key Registry Methods

```protobuf
service KeyManager {
    // Key lifecycle
    rpc CreateKey(CreateKeyRequest) returns (CreateKeyResponse);
    rpc GetKey(GetKeyRequest) returns (GetKeyResponse);
    rpc ListKeys(ListKeysRequest) returns (ListKeysResponse);
    rpc RotateKey(RotateKeyRequest) returns (RotateKeyResponse);
    rpc SuspendKey(SuspendKeyRequest) returns (SuspendKeyResponse);
    rpc RevokeKey(RevokeKeyRequest) returns (RevokeKeyResponse);

    // Signing operations
    rpc Sign(SignRequest) returns (SignResponse);
    rpc SignMulti(SignMultiRequest) returns (SignMultiResponse);
    rpc GetSigningStatus(SigningStatusRequest) returns (SigningStatusResponse);

    // Monitoring
    rpc GetKeyHealth(KeyHealthRequest) returns (KeyHealthResponse);
    rpc GetKeyMetrics(KeyMetricsRequest) returns (KeyMetricsResponse);
    rpc ListAlerts(ListAlertsRequest) returns (ListAlertsResponse);

    // Signer management
    rpc ListSigners(ListSignersRequest) returns (ListSignersResponse);
    rpc GetSignerStatus(SignerStatusRequest) returns (SignerStatusResponse);
}
```

#### 9.2 JSON-RPC Methods (under `/ext/bc/T`)

| Method | Description | Auth Level |
|--------|-------------|------------|
| `tchain.key.create` | Create new managed key | Governance |
| `tchain.key.get` | Get key details | Public |
| `tchain.key.list` | List all keys | Public |
| `tchain.key.rotate` | Initiate key rotation | Governance |
| `tchain.key.suspend` | Suspend key operations | Governance |
| `tchain.key.revoke` | Permanently revoke key | Governance |
| `tchain.key.sign` | Request signature | Authorized |
| `tchain.key.signStatus` | Check signing request status | Public |
| `tchain.key.health` | Get key health metrics | Public |
| `tchain.key.metrics` | Get detailed metrics | Operator |
| `tchain.signer.list` | List signers for key | Public |
| `tchain.signer.status` | Get signer availability | Public |

#### 9.3 Request/Response Examples

**Create Key:**

```json
// Request
{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tchain.key.create",
    "params": {
        "keyId": "eth-usdc",
        "threshold": 2,
        "totalParties": 3,
        "algorithm": "CGG21",
        "partyIds": ["party-1", "party-2", "party-3"],
        "valueTier": "small",
        "maxTxValue": "10000000000",
        "metadata": {
            "description": "Ethereum USDC bridge key",
            "tags": ["stablecoin", "ethereum"]
        },
        "governanceSignature": "0x..."
    }
}

// Response
{
    "jsonrpc": "2.0",
    "id": 1,
    "result": {
        "keyId": "eth-usdc",
        "status": "creating",
        "dkgSessionId": "abc123...",
        "estimatedCompletion": 12345678
    }
}
```

**Sign Request:**

```json
// Request
{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tchain.key.sign",
    "params": {
        "keyId": "eth-usdc",
        "message": "0x...",
        "requestId": "req-456",
        "metadata": {
            "txType": "transfer",
            "value": "1000000000",
            "recipient": "0x..."
        }
    }
}

// Response
{
    "jsonrpc": "2.0",
    "id": 2,
    "result": {
        "requestId": "req-456",
        "status": "pending",
        "estimatedLatency": 200
    }
}
```

**Get Key Health:**

```json
// Request
{
    "jsonrpc": "2.0",
    "id": 3,
    "method": "tchain.key.health",
    "params": {
        "keyId": "eth-usdc"
    }
}

// Response
{
    "jsonrpc": "2.0",
    "id": 3,
    "result": {
        "keyId": "eth-usdc",
        "status": "active",
        "health": "healthy",
        "signers": {
            "available": 3,
            "required": 2,
            "total": 3,
            "details": [
                {"partyId": "party-1", "availability": 0.999, "latency": 45},
                {"partyId": "party-2", "availability": 0.998, "latency": 52},
                {"partyId": "party-3", "availability": 0.995, "latency": 48}
            ]
        },
        "metrics": {
            "medianLatencyMs": 48,
            "successRate": 0.9997,
            "lastSignatureBlock": 12345670,
            "totalSignatures": 150432,
            "pendingRequests": 2
        },
        "shareAge": {
            "lastRefreshBlock": 12300000,
            "ageBlocks": 45670,
            "refreshDueBlock": 12948000,
            "status": "fresh"
        }
    }
}
```

### 10. Security Considerations

#### 10.1 Key Isolation Properties

Each managed key provides cryptographic isolation:

1. **Share Independence**: Key shares for different `KeyID`s are generated in independent DKG sessions. Compromise of shares for one key reveals nothing about other keys.

2. **Signer Set Separation**: Even when signers overlap between keys, the threshold requirement is evaluated independently. An attacker controlling t-1 signers for Key A and t-1 signers for Key B cannot combine knowledge to forge signatures for either key.

3. **Value Compartmentalization**: Maximum custody value per key can be enforced, limiting exposure from any single key compromise.

#### 10.2 Compromise Scenarios

| Scenario | Impact | Mitigation |
|----------|--------|------------|
| Single signer compromised | None (t-1 shares insufficient) | Detect via anomaly, rotate |
| t-1 signers compromised | None (threshold not met) | High alert, emergency rotation |
| t signers compromised | Single key funds at risk | Other keys unaffected; value limits cap loss |
| Algorithm break (ECDSA) | Keys using that algorithm at risk | Migrate to PQ algorithms; dual-sig mode |
| Key metadata leaked | Operational intelligence exposed | Metadata is mostly public; shares remain secure |

#### 10.3 Attack Surface Minimization

```go
// Access control for key operations
type Permission uint8

const (
    PermNone Permission = iota
    PermRead           // View key metadata
    PermSign           // Request signatures
    PermOperate        // Manage signers
    PermGovernance     // Create/revoke keys
)

type ACL struct {
    KeyID       string
    Permissions map[ids.ShortID]Permission
}

func (vm *VM) CheckPermission(caller ids.ShortID, keyID string, required Permission) error {
    acl := vm.state.GetACL(keyID)
    if acl.Permissions[caller] < required {
        return fmt.Errorf("insufficient permission: have %v, need %v",
            acl.Permissions[caller], required)
    }
    return nil
}
```

#### 10.4 Quantum Security

Keys may be configured for hybrid classical/quantum security:

```go
type QuantumConfig struct {
    Enabled         bool   // Dual-signature mode
    ClassicalAlgo   MPCAlgo // CGG21, MuSig2, FROST
    QuantumAlgo     MPCAlgo // Ringtail (lattice-based)
    ClassicalThresh uint8
    QuantumThresh   uint8
}

// Dual signature verification
func VerifyDualSignature(msg []byte, classical, quantum []byte, config QuantumConfig) error {
    if err := VerifyClassical(msg, classical, config.ClassicalAlgo); err != nil {
        return fmt.Errorf("classical signature invalid: %w", err)
    }
    if config.Enabled {
        if err := VerifyQuantum(msg, quantum, config.QuantumAlgo); err != nil {
            return fmt.Errorf("quantum signature invalid: %w", err)
        }
    }
    return nil
}
```

### 11. Backwards Compatibility

This LP is additive to existing M-Chain and T-Chain functionality:

1. **Existing Keys**: Keys created before this specification continue to function. They are implicitly assigned `KeyID` based on their asset and default metadata.

2. **Legacy RPC**: Existing RPC methods (`mchain.swapSig.*`) remain operational. New methods are additive.

3. **Transaction Formats**: New transaction types (`KeyCreateTx`, `KeyRotateTx`, etc.) use unused type IDs. Existing transaction processing is unchanged.

4. **Signer Software**: Existing `mpckeyd` instances can be upgraded incrementally. The protocol negotiates capabilities during DKG.

### 12. Test Cases

#### 12.1 Key Creation Tests

```go
func TestKeyCreation_ValidConfig(t *testing.T) {
    vm := setupTestVM()

    tx := &KeyCreateTx{
        KeyID:        "eth-usdc",
        Threshold:    2,
        TotalParties: 3,
        Algorithm:    AlgoCGG21,
        PartyIDs:     []party.ID{"p1", "p2", "p3"},
        ValueTier:    TierSmall,
    }

    err := vm.ProcessKeyCreate(tx)
    require.NoError(t, err)

    key := vm.state.GetKey("eth-usdc")
    require.NotNil(t, key)
    require.Equal(t, KeyStatusActive, key.Status)
    require.Equal(t, uint8(2), key.Threshold)
}

func TestKeyCreation_InvalidThreshold(t *testing.T) {
    vm := setupTestVM()

    tx := &KeyCreateTx{
        KeyID:        "eth-usdc",
        Threshold:    4, // Invalid: threshold > totalParties
        TotalParties: 3,
    }

    err := vm.ProcessKeyCreate(tx)
    require.ErrorIs(t, err, ErrInvalidThreshold)
}

func TestKeyCreation_DuplicateKeyID(t *testing.T) {
    vm := setupTestVM()
    createKey(vm, "eth-usdc", 2, 3)

    tx := &KeyCreateTx{
        KeyID:        "eth-usdc", // Duplicate
        Threshold:    3,
        TotalParties: 5,
    }

    err := vm.ProcessKeyCreate(tx)
    require.ErrorIs(t, err, ErrKeyExists)
}
```

#### 12.2 Multi-Key Signing Tests

```go
func TestMultiKeySigning_AllSucceed(t *testing.T) {
    vm := setupTestVM()
    createKey(vm, "eth-usdc", 2, 3)
    createKey(vm, "btc-native", 3, 5)

    session := MultiKeySession{
        Keys:     []string{"eth-usdc", "btc-native"},
        Messages: [][]byte{msg1, msg2},
    }

    sigs, err := vm.coordinator.ExecuteMultiKey(session)
    require.NoError(t, err)
    require.Len(t, sigs, 2)

    // Verify signatures
    require.NoError(t, verifySignature("eth-usdc", msg1, sigs[0]))
    require.NoError(t, verifySignature("btc-native", msg2, sigs[1]))
}

func TestMultiKeySigning_OneKeyFails(t *testing.T) {
    vm := setupTestVM()
    createKey(vm, "eth-usdc", 2, 3)
    createKey(vm, "btc-native", 3, 5)

    // Suspend one key
    vm.state.GetKey("btc-native").Status = KeyStatusSuspended

    session := MultiKeySession{
        Keys:     []string{"eth-usdc", "btc-native"},
        Messages: [][]byte{msg1, msg2},
    }

    _, err := vm.coordinator.ExecuteMultiKey(session)
    require.Error(t, err)
    require.Contains(t, err.Error(), "suspended")
}
```

#### 12.3 Key Rotation Tests

```go
func TestKeyRotation_SameSigners(t *testing.T) {
    vm := setupTestVM()
    createKey(vm, "eth-usdc", 2, 3)
    originalPubKey := vm.state.GetKey("eth-usdc").AggPubKey

    tx := &KeyRotateTx{
        KeyID:  "eth-usdc",
        Reason: "scheduled refresh",
    }

    err := vm.ProcessKeyRotate(tx)
    require.NoError(t, err)

    // Complete DKG
    completeDKG(vm, "eth-usdc")

    key := vm.state.GetKey("eth-usdc")
    require.Equal(t, KeyStatusActive, key.Status)
    require.Equal(t, originalPubKey, key.AggPubKey) // Same public key
    require.Greater(t, key.LastRotation, uint64(0))
}

func TestKeyRotation_ChangeSigners(t *testing.T) {
    vm := setupTestVM()
    createKey(vm, "eth-usdc", 2, 3)

    tx := &KeyRotateTx{
        KeyID:       "eth-usdc",
        NewPartyIDs: []party.ID{"p4", "p5", "p6"}, // New signers
        Reason:      "signer replacement",
    }

    err := vm.ProcessKeyRotate(tx)
    require.NoError(t, err)

    completeDKG(vm, "eth-usdc")

    key := vm.state.GetKey("eth-usdc")
    require.Equal(t, []party.ID{"p4", "p5", "p6"}, key.PartyIDs)
    // Note: public key changes when signers change
}
```

#### 12.4 Threshold Tier Tests

```go
func TestThresholdTiers(t *testing.T) {
    testCases := []struct {
        tier      ValueTier
        expThresh uint8
        expN      uint8
    }{
        {TierMicro, 2, 3},
        {TierSmall, 2, 3},
        {TierMedium, 3, 5},
        {TierLarge, 4, 7},
        {TierVeryLarge, 5, 9},
        {TierCustody, 7, 11},
    }

    for _, tc := range testCases {
        t.Run(tc.tier.String(), func(t *testing.T) {
            config := DefaultConfigForTier(tc.tier)
            require.Equal(t, tc.expThresh, config.Threshold)
            require.Equal(t, tc.expN, config.TotalParties)
        })
    }
}
```

### 13. Reference Implementation

All reference implementations are available in the Lux GitHub organization: https://github.com/luxfi

#### 13.1 Core Components

| Component | Repository | Path |
|-----------|------------|------|
| Key Registry | `github.com/luxfi/node` | `vms/thresholdvm/keys/registry.go` |
| DKG Protocol | `github.com/luxfi/node` | `vms/thresholdvm/keys/dkg.go` |
| Key Lifecycle | `github.com/luxfi/node` | `vms/thresholdvm/keys/lifecycle.go` |
| Signer Selection | `github.com/luxfi/node` | `vms/thresholdvm/keys/selection.go` |
| RPC Handlers | `github.com/luxfi/node` | `vms/thresholdvm/api/keys.go` |
| Value Tier Config | `github.com/luxfi/node` | `vms/thresholdvm/keys/tiers.go` |
| Geographic Diversity | `github.com/luxfi/node` | `vms/thresholdvm/keys/geography.go` |

#### 13.2 SDK Integration

| Component | Repository | Path |
|-----------|------------|------|
| Multisig Client | `github.com/luxfi/sdk` | `multisig/client.go` |
| Key Management | `github.com/luxfi/sdk` | `multisig/keys.go` |
| Signing Sessions | `github.com/luxfi/sdk` | `multisig/session.go` |
| Asset Configs | `github.com/luxfi/sdk` | `multisig/assets.go` |

#### 13.3 Threshold Cryptography

| Protocol | Repository | Path |
|----------|------------|------|
| CGG21 (ECDSA) | `github.com/luxfi/threshold` | `protocols/cmp/` |
| MuSig2 (BIP-340) | `github.com/luxfi/threshold` | `protocols/musig2/` |
| FROST (Schnorr) | `github.com/luxfi/threshold` | `protocols/frost/` |
| Ringtail (PQ) | `github.com/luxfi/threshold` | `protocols/ringtail/` |
| LSS Resharing | `github.com/luxfi/threshold` | `protocols/lss/` |

#### 13.4 Bridge Integration

| Component | Repository | Path |
|-----------|------------|------|
| Bridge Contracts | `github.com/luxfi/bridge` | `contracts/` |
| Teleport Protocol | `github.com/luxfi/bridge` | `teleport/` |
| Asset Registry | `github.com/luxfi/bridge` | `registry/` |

#### 13.5 Related Repositories

- **Node**: `github.com/luxfi/node` - Lux Network node implementation
- **Threshold**: `github.com/luxfi/threshold` - Threshold cryptography library
- **Bridge**: `github.com/luxfi/bridge` - Cross-chain bridge infrastructure
- **SDK**: `github.com/luxfi/sdk` - Client SDK for interacting with Lux Network
- **CLI**: `github.com/luxfi/cli` - Command-line tools for network management

### 14. Economic Impact

#### 14.1 Signer Economics

Per-asset keys enable differentiated economics:

| Tier | Signer Fee (per sig) | Stake Requirement |
|------|---------------------|-------------------|
| Micro | 0.1 LUX | 1,000 LUX |
| Small | 0.2 LUX | 2,500 LUX |
| Medium | 0.5 LUX | 5,000 LUX |
| Large | 1.0 LUX | 10,000 LUX |
| Very Large | 2.0 LUX | 25,000 LUX |
| Custody | 5.0 LUX | 50,000 LUX |

#### 14.2 Protocol Revenue

Higher-tier keys generate more revenue per signature, incentivizing signers to maintain high-quality infrastructure for valuable assets.

## Cross-References

This LP integrates with several other Lux Proposals:

### Required Dependencies

| LP | Title | Relationship |
|----|-------|--------------|
| LP-0013 | M-Chain Decentralised MPC Custody | Foundation for threshold custody operations |
| LP-0014 | CGG21 UC Non-Interactive ECDSA | Threshold ECDSA protocol used for EVM chains |
| LP-0015 | MPC Bridge Protocol | Bridge signing integration |
| LP-0017 | Bridge Asset Registry | Asset metadata and configuration source |
| LP-0330 | T-Chain ThresholdVM Specification | Underlying VM for key management |
| LP-0333 | Dynamic Signer Rotation with LSS | Key rotation without public key changes |

### Integration Points

**With LP-0330 (T-Chain ThresholdVM):**
- This LP defines per-asset configurations; LP-330 implements the underlying VM
- Key creation transactions defined in LP-330 use configurations from this LP
- Value tiers map to threshold parameters in LP-330's `ThresholdConfig`

**With LP-0333 (Dynamic Signer Rotation):**
- Rotation policies in this LP trigger resharing defined in LP-333
- `TierRotationPolicies` determine when LP-333's `ReshareInitTx` is generated
- Geographic diversity constraints affect LP-333's signer selection

**With LP-0015 (MPC Bridge Protocol):**
- Bridge signing requests are routed to appropriate keys based on value tier
- Asset configurations in this LP determine which key handles each bridge transfer
- Multi-chain USDC/USDT configurations enable cross-chain bridge operations

### Example Integration Flow

```
1. Bridge receives transfer request for 500,000 USDC on Ethereum
2. This LP's GetConfigForValueTier("eth", "usdc", 500000) returns "eth-usdc-large"
3. LP-330's T-Chain processes SignRequest for key "eth-usdc-large"
4. LP-0014's CGG21 protocol generates threshold signature
5. If rotation needed, LP-333's resharing is triggered per this LP's policy
```

## Copyright

Copyright and related rights waived via [CC0](../LICENSE.md).
