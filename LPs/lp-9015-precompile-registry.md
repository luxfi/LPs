---
lp: 9015
title: Precompile Registry - DeFi Precompile Address Map
tags: [precompile, registry, defi, core, infrastructure]
description: Central registry of all Lux DeFi and cryptographic precompile addresses
author: Lux Network Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Review
type: Standards Track
category: Core
created: 2025-12-21
requires: 3020, 9010, 9011
implementation: ~/work/lux/standard/contracts/liquidity/precompiles/PrecompileRegistry.sol
order: 15
---

> **Documentation**: [docs.lux.network/precompiles](https://docs.lux.network/precompiles)
>
> **Source**: 

## Abstract

LP-9015 specifies the PrecompileRegistry, a central registry and helper library for all Lux EVM precompiles. The registry maps addresses in the `0x0200...00XX` range to named precompiles covering core network functions, post-quantum cryptography, threshold signatures, and DeFi primitives.

## Motivation

### Precompile Discovery

Applications need to:
1. **Discover** available precompiles
2. **Verify** precompile availability
3. **Categorize** precompiles by function
4. **Track** address changes across upgrades

### Registry Benefits

1. **Single Source of Truth**: One location for all addresses
2. **Type Safety**: Named constants prevent address errors
3. **Upgradability**: Central location for address updates
4. **Discovery**: Runtime precompile availability checks

## Specification

### Address Range

All Lux precompiles use the address range:
```solidity
0x0200000000000000000000000000000000000001  to
0x0200000000000000000000000000000000000FFF
```

### Registry Contract

```solidity
// SPDX-License-Identifier: BSD-3-Clause
// Copyright (c) 2025 Lux Industries Inc.
pragma solidity ^0.8.24;

/// @title PrecompileRegistry
/// @notice Central registry of all Lux DeFi precompile addresses
/// @dev All precompiles are in the 0x0200...00XX address range
library PrecompileRegistry {
    /*//////////////////////////////////////////////////////////////
                         CORE PRECOMPILES
    //////////////////////////////////////////////////////////////*/

    /// @notice Deployer allow list management
    address internal constant DEPLOYER_ALLOW_LIST = 0x0200000000000000000000000000000000000001;

    /// @notice Transaction allow list management
    address internal constant TX_ALLOW_LIST = 0x0200000000000000000000000000000000000002;

    /// @notice Fee manager for dynamic gas pricing
    address internal constant FEE_MANAGER = 0x0200000000000000000000000000000000000003;

    /// @notice Native token minting
    address internal constant NATIVE_MINTER = 0x0200000000000000000000000000000000000004;

    /// @notice Cross-chain Warp messaging
    address internal constant WARP = 0x0200000000000000000000000000000000000005;

    /// @notice Reward manager for validators
    address internal constant REWARD_MANAGER = 0x0200000000000000000000000000000000000006;

    /*//////////////////////////////////////////////////////////////
                      CRYPTOGRAPHY PRECOMPILES
    //////////////////////////////////////////////////////////////*/

    /// @notice ML-DSA (FIPS 204) post-quantum signatures
    address internal constant ML_DSA = 0x0200000000000000000000000000000000000007;

    /// @notice SLH-DSA (FIPS 205) hash-based signatures
    address internal constant SLH_DSA = 0x0200000000000000000000000000000000000008;

    /// @notice General post-quantum crypto operations
    address internal constant PQ_CRYPTO = 0x0200000000000000000000000000000000000009;

    /// @notice Quasar quantum consensus operations
    address internal constant QUASAR = 0x020000000000000000000000000000000000000a;

    /// @notice Ringtail lattice threshold signatures
    address internal constant RINGTAIL = 0x020000000000000000000000000000000000000B;

    /// @notice FROST Schnorr threshold signatures
    address internal constant FROST = 0x020000000000000000000000000000000000000c;

    /// @notice CGGMP21 ECDSA threshold signatures
    address internal constant CGGMP21 = 0x020000000000000000000000000000000000000D;

    /// @notice Bridge verification (reserved)
    address internal constant BRIDGE = 0x020000000000000000000000000000000000000E;

    /*//////////////////////////////////////////////////////////////
                          DEFI PRECOMPILES
    //////////////////////////////////////////////////////////////*/

    /// @notice Native HFT DEX (QuantumSwap/LX)
    /// @dev 434M orders/sec, 2ns latency, 1ms finality
    address internal constant DEX = 0x0200000000000000000000000000000000000010;

    /// @notice Multi-source oracle aggregator
    /// @dev Chainlink, Pyth, Binance, Kraken, Native TWAP
    address internal constant ORACLE = 0x0200000000000000000000000000000000000011;

    /// @notice Lending protocol interface
    address internal constant LENDING = 0x0200000000000000000000000000000000000012;

    /// @notice Staking operations
    address internal constant STAKING = 0x0200000000000000000000000000000000000013;

    /// @notice Yield aggregator
    address internal constant YIELD = 0x0200000000000000000000000000000000000014;

    /// @notice Derivatives/Perpetuals
    address internal constant PERPS = 0x0200000000000000000000000000000000000015;

    /*//////////////////////////////////////////////////////////////
                       ATTESTATION PRECOMPILES
    //////////////////////////////////////////////////////////////*/

    /// @notice GPU/TEE attestation (AI tokens)
    address internal constant ATTESTATION = 0x0200000000000000000000000000000000000300;

    /*//////////////////////////////////////////////////////////////
                         HELPER FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /// @notice Check if address is a known precompile
    function isPrecompile(address addr) internal pure returns (bool) {
        uint256 addrInt = uint256(uint160(addr));

        // Check 0x0200...00XX range (Core + Crypto + DeFi)
        if (addrInt >= uint256(uint160(0x0200000000000000000000000000000000000001)) &&
            addrInt <= uint256(uint160(0x0200000000000000000000000000000000000015))) {
            return true;
        }

        // Check attestation range
        if (addrInt == uint256(uint160(0x0200000000000000000000000000000000000300))) {
            return true;
        }

        return false;
    }

    /// @notice Get precompile name
    function getPrecompileName(address addr) internal pure returns (string memory) {
        if (addr == DEPLOYER_ALLOW_LIST) return "DeployerAllowList";
        if (addr == TX_ALLOW_LIST) return "TxAllowList";
        if (addr == FEE_MANAGER) return "FeeManager";
        if (addr == NATIVE_MINTER) return "NativeMinter";
        if (addr == WARP) return "Warp";
        if (addr == REWARD_MANAGER) return "RewardManager";
        if (addr == ML_DSA) return "ML-DSA";
        if (addr == SLH_DSA) return "SLH-DSA";
        if (addr == PQ_CRYPTO) return "PQCrypto";
        if (addr == QUASAR) return "Quasar";
        if (addr == RINGTAIL) return "Ringtail";
        if (addr == FROST) return "FROST";
        if (addr == CGGMP21) return "CGGMP21";
        if (addr == BRIDGE) return "Bridge";
        if (addr == DEX) return "DEX";
        if (addr == ORACLE) return "Oracle";
        if (addr == LENDING) return "Lending";
        if (addr == STAKING) return "Staking";
        if (addr == YIELD) return "Yield";
        if (addr == PERPS) return "Perps";
        if (addr == ATTESTATION) return "Attestation";
        return "Unknown";
    }

    /// @notice Get precompile category
    function getPrecompileCategory(address addr) internal pure returns (string memory) {
        uint256 addrInt = uint256(uint160(addr));

        if (addrInt >= uint256(uint160(0x0200000000000000000000000000000000000001)) &&
            addrInt <= uint256(uint160(0x0200000000000000000000000000000000000006))) {
            return "Core";
        }

        if (addrInt >= uint256(uint160(0x0200000000000000000000000000000000000007)) &&
            addrInt <= uint256(uint160(0x020000000000000000000000000000000000000E))) {
            return "Cryptography";
        }

        if (addrInt >= uint256(uint160(0x0200000000000000000000000000000000000010)) &&
            addrInt <= uint256(uint160(0x0200000000000000000000000000000000000015))) {
            return "DeFi";
        }

        if (addrInt == uint256(uint160(0x0200000000000000000000000000000000000300))) {
            return "Attestation";
        }

        return "Unknown";
    }
}
```solidity

### PrecompileChecker Contract

```solidity
/// @title PrecompileChecker
/// @notice Utility contract for checking precompile availability
contract PrecompileChecker {
    using PrecompileRegistry for address;

    /// @notice Check if all DeFi precompiles are available
    function checkDeFiPrecompiles() external view returns (
        bool dexAvailable,
        bool oracleAvailable,
        bool lendingAvailable,
        bool stakingAvailable
    ) {
        dexAvailable = _isContractLive(PrecompileRegistry.DEX);
        oracleAvailable = _isContractLive(PrecompileRegistry.ORACLE);
        lendingAvailable = _isContractLive(PrecompileRegistry.LENDING);
        stakingAvailable = _isContractLive(PrecompileRegistry.STAKING);
    }

    /// @notice Check if all crypto precompiles are available
    function checkCryptoPrecompiles() external view returns (
        bool mldsaAvailable,
        bool frostAvailable,
        bool cggmp21Available,
        bool ringtailAvailable
    ) {
        mldsaAvailable = _isContractLive(PrecompileRegistry.ML_DSA);
        frostAvailable = _isContractLive(PrecompileRegistry.FROST);
        cggmp21Available = _isContractLive(PrecompileRegistry.CGGMP21);
        ringtailAvailable = _isContractLive(PrecompileRegistry.RINGTAIL);
    }

    /// @notice Get all precompile statuses
    function getAllPrecompileStatuses() external view returns (
        address[] memory addresses,
        string[] memory names,
        bool[] memory available
    ) {
        addresses = new address[](21);
        names = new string[](21);
        available = new bool[](21);

        addresses[0] = PrecompileRegistry.DEPLOYER_ALLOW_LIST;
        addresses[1] = PrecompileRegistry.TX_ALLOW_LIST;
        addresses[2] = PrecompileRegistry.FEE_MANAGER;
        addresses[3] = PrecompileRegistry.NATIVE_MINTER;
        addresses[4] = PrecompileRegistry.WARP;
        addresses[5] = PrecompileRegistry.REWARD_MANAGER;
        addresses[6] = PrecompileRegistry.ML_DSA;
        addresses[7] = PrecompileRegistry.SLH_DSA;
        addresses[8] = PrecompileRegistry.PQ_CRYPTO;
        addresses[9] = PrecompileRegistry.QUASAR;
        addresses[10] = PrecompileRegistry.RINGTAIL;
        addresses[11] = PrecompileRegistry.FROST;
        addresses[12] = PrecompileRegistry.CGGMP21;
        addresses[13] = PrecompileRegistry.BRIDGE;
        addresses[14] = PrecompileRegistry.DEX;
        addresses[15] = PrecompileRegistry.ORACLE;
        addresses[16] = PrecompileRegistry.LENDING;
        addresses[17] = PrecompileRegistry.STAKING;
        addresses[18] = PrecompileRegistry.YIELD;
        addresses[19] = PrecompileRegistry.PERPS;
        addresses[20] = PrecompileRegistry.ATTESTATION;

        for (uint256 i = 0; i < addresses.length; i++) {
            names[i] = addresses[i].getPrecompileName();
            available[i] = _isContractLive(addresses[i]);
        }
    }

    /// @notice Check if precompile is live
    function _isContractLive(address addr) internal view returns (bool) {
        uint256 size;
        assembly {
            size := extcodesize(addr)
        }
        // Precompiles don't have code but can still be called
        // We check by attempting a static call
        (bool success,) = addr.staticcall("");
        return success || size > 0;
    }
}
```

### Complete Precompile Address Map

```solidity
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                           Lux Precompile Address Map                                │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│  CORE PRECOMPILES (0x0200...0001 - 0x0200...0006)                                  │
│  ┌─────────────────┬────────────────────────────────────────────────────────────┐  │
│  │ Address         │ Name / Function                                            │  │
│  ├─────────────────┼────────────────────────────────────────────────────────────┤  │
│  │ 0x02...0001     │ DeployerAllowList - Contract deployment permissions        │  │
│  │ 0x02...0002     │ TxAllowList - Transaction sending permissions              │  │
│  │ 0x02...0003     │ FeeManager - Dynamic gas pricing (LP-176)                  │  │
│  │ 0x02...0004     │ NativeMinter - Native LUX token minting                    │  │
│  │ 0x02...0005     │ Warp - Cross-chain messaging (LP-2515)                     │  │
│  │ 0x02...0006     │ RewardManager - Validator reward distribution              │  │
│  └─────────────────┴────────────────────────────────────────────────────────────┘  │
│                                                                                     │
│  CRYPTOGRAPHY PRECOMPILES (0x0200...0007 - 0x0200...000E)                          │
│  ┌─────────────────┬────────────────────────────────────────────────────────────┐  │
│  │ Address         │ Name / Function                                            │  │
│  ├─────────────────┼────────────────────────────────────────────────────────────┤  │
│  │ 0x02...0007     │ ML-DSA - FIPS 204 post-quantum signatures (LP-2514)        │  │
│  │ 0x02...0008     │ SLH-DSA - FIPS 205 hash-based signatures (LP-2312)         │  │
│  │ 0x02...0009     │ PQCrypto - General post-quantum operations                 │  │
│  │ 0x02...000a     │ Quasar - Quantum consensus operations (LP-2516)            │  │
│  │ 0x02...000B     │ Ringtail - Lattice threshold signatures (LP-320)           │  │
│  │ 0x02...000c     │ FROST - Schnorr threshold signatures (LP-321)              │  │
│  │ 0x02...000D     │ CGGMP21 - ECDSA threshold signatures (LP-322)              │  │
│  │ 0x02...000E     │ Bridge - Bridge verification (reserved)                    │  │
│  └─────────────────┴────────────────────────────────────────────────────────────┘  │
│                                                                                     │
│  DEFI PRECOMPILES (0x0200...0010 - 0x0200...0015)                                  │
│  ┌─────────────────┬────────────────────────────────────────────────────────────┐  │
│  │ Address         │ Name / Function                                            │  │
│  ├─────────────────┼────────────────────────────────────────────────────────────┤  │
│  │ 0x02...0010     │ DEX - Native HFT order book (LP-9010) 434M ops/sec         │  │
│  │ 0x02...0011     │ Oracle - Multi-source price feeds (LP-9011)                │  │
│  │ 0x02...0012     │ Lending - Protocol interface (reserved)                    │  │
│  │ 0x02...0013     │ Staking - Staking operations (reserved)                    │  │
│  │ 0x02...0014     │ Yield - Yield aggregation (reserved)                       │  │
│  │ 0x02...0015     │ Perps - Perpetuals/Derivatives (reserved)                  │  │
│  └─────────────────┴────────────────────────────────────────────────────────────┘  │
│                                                                                     │
│  ATTESTATION PRECOMPILES (0x0200...0300)                                           │
│  ┌─────────────────┬────────────────────────────────────────────────────────────┐  │
│  │ Address         │ Name / Function                                            │  │
│  ├─────────────────┼────────────────────────────────────────────────────────────┤  │
│  │ 0x02...0300     │ Attestation - GPU/TEE attestation for AI tokens            │  │
│  └─────────────────┴────────────────────────────────────────────────────────────┘  │
│                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### Gas Costs

| Precompile | Typical Operation | Gas Cost |
|------------|------------------|----------|
| DeployerAllowList | Check permission | 2,600 |
| TxAllowList | Check permission | 2,600 |
| FeeManager | Get fee config | 2,600 |
| NativeMinter | Mint tokens | 10,000 |
| Warp | Send message | 50,000 |
| ML-DSA | Verify signature | 100,000 |
| FROST | Verify threshold | 75,000 |
| CGGMP21 | Verify threshold | 125,000 |
| Ringtail | Verify threshold | 200,000 |
| DEX | Place order | 30,000 |
| Oracle | Get price | 5,000 |

## Rationale

### Address Range Selection

The `0x0200...` prefix was chosen to:
1. Avoid collision with standard Ethereum precompiles (`0x01` - `0x09`)
2. Allow for 4096+ precompiles in the range
3. Enable category-based grouping

### Category Grouping

Precompiles are grouped by function:
- **0x01-0x06**: Core network management
- **0x07-0x0E**: Cryptographic operations
- **0x10-0x1F**: DeFi primitives
- **0x0300+**: Specialized functions

### Availability Checking

The `_isContractLive` function uses:
1. `extcodesize`: Check for contract code
2. `staticcall`: Verify precompile responds

This handles both deployed contracts and native precompiles.

## Backwards Compatibility

### Existing Precompiles

All existing precompiles maintain their addresses. New precompiles are added at unused addresses.

### Library Integration

Applications can import the library:

```solidity
import {PrecompileRegistry} from "./PrecompileRegistry.sol";

contract MyContract {
    function useDEX() external {
        IDEX dex = IDEX(PrecompileRegistry.DEX);
        // Use DEX...
    }
}
```solidity

## Test Cases

### Precompile Discovery

```solidity
function testPrecompileDiscovery() public {
    assertTrue(PrecompileRegistry.isPrecompile(PrecompileRegistry.DEX));
    assertTrue(PrecompileRegistry.isPrecompile(PrecompileRegistry.ORACLE));
    assertFalse(PrecompileRegistry.isPrecompile(address(0x123)));
}
```

### Category Classification

```solidity
function testPrecompileCategories() public {
    assertEq(
        PrecompileRegistry.getPrecompileCategory(PrecompileRegistry.DEX),
        "DeFi"
    );
    assertEq(
        PrecompileRegistry.getPrecompileCategory(PrecompileRegistry.FROST),
        "Cryptography"
    );
}
```solidity

### Availability Check

```solidity
function testDeFiAvailability() public {
    (bool dex, bool oracle, bool lending, bool staking) =
        checker.checkDeFiPrecompiles();

    assertTrue(dex, "DEX not available");
    assertTrue(oracle, "Oracle not available");
    // Lending and staking may be reserved
}
```

## Reference Implementation

**Location**: `/Users/z/work/lux/standard/contracts/liquidity/precompiles/PrecompileRegistry.sol`

```solidity
contracts/liquidity/precompiles/
├── PrecompileRegistry.sol   # Registry library (this LP)
├── IDEX.sol                 # LP-9010
├── IOracle.sol              # LP-9011
└── README.md                # Documentation
```

## Security Considerations

### Address Verification

Applications should verify precompile addresses:

```solidity
require(
    PrecompileRegistry.isPrecompile(addr),
    "Not a precompile"
);
```solidity

### Upgrade Safety

Precompile addresses are immutable. New features require new addresses.

### Availability Checks

Critical operations should verify precompile availability before use.

## Related LPs

- **LP-2517**: Precompile Suite Overview
- **LP-9010**: DEX Precompile
- **LP-9011**: Oracle Precompile
- **LP-321**: FROST Threshold Signatures
- **LP-322**: CGGMP21 Threshold ECDSA
- **LP-320**: Ringtail Threshold Signatures

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
```
