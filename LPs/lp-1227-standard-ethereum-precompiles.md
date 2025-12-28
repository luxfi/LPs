---
lp: 1227
title: Standard Ethereum Precompiles (EIP-1108, EIP-2537)
description: Documents the standard Ethereum precompiles available on Lux EVM chains, including BN254/alt_bn128 for Groth16 verification and BLS12-381 for consensus proofs
author: Lux Core Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Implemented
type: Standards Track
category: Core
created: 2025-12-27
requires: 1226
tags: [evm, precompile, zk, groth16, bls12-381, cryptography]
order: 1227
---

## Abstract

This LP documents the standard Ethereum precompiles (addresses 0x01-0x11) available on all Lux EVM chains (C-Chain, Zoo, Hanzo, etc.). These precompiles are critical for:

1. **Groth16 SNARK Verification** - BN254/alt_bn128 curve operations (0x06-0x08)
2. **BLS Signature Verification** - BLS12-381 curve operations (0x0b-0x11)
3. **Cryptographic Primitives** - ECRECOVER, SHA256, MODEXP, BLAKE2F

All Lux EVM chains inherit these from `github.com/luxfi/geth/core/vm/contracts.go`.

## Specification

### Core Precompiles (Active from Genesis)

These are active on all Lux EVM chains with `berlinBlock: 0`:

| Address | Name | Gas Cost | EIP | Status |
|---------|------|----------|-----|--------|
| 0x01 | ECRECOVER | 3,000 | Frontier | ✅ Active |
| 0x02 | SHA256 | 60 + 12/word | Frontier | ✅ Active |
| 0x03 | RIPEMD160 | 600 + 120/word | Frontier | ✅ Active |
| 0x04 | IDENTITY | 15 + 3/word | Frontier | ✅ Active |
| 0x05 | MODEXP | EIP-2565 formula | Berlin | ✅ Active |
| 0x06 | BN256_ADD | 150 | EIP-1108 | ✅ Active |
| 0x07 | BN256_MUL | 6,000 | EIP-1108 | ✅ Active |
| 0x08 | BN256_PAIRING | 45,000 + 34,000/pair | EIP-1108 | ✅ Active |
| 0x09 | BLAKE2F | 1/round | EIP-152 | ✅ Active |

### Cancun Precompiles (KZG)

| Address | Name | Gas Cost | EIP | Status |
|---------|------|----------|-----|--------|
| 0x0a | KZG_POINT_EVAL | 50,000 | EIP-4844 | ✅ Active (with Cancun) |

### Prague Precompiles (BLS12-381)

These require `pragueTime` to be set in chain config:

| Address | Name | Gas Cost | EIP | Status |
|---------|------|----------|-----|--------|
| 0x0b | BLS12381_G1ADD | 375 | EIP-2537 | 🔜 Ready (Prague) |
| 0x0c | BLS12381_G1MSM | 12,000 | EIP-2537 | 🔜 Ready (Prague) |
| 0x0d | BLS12381_G2ADD | 600 | EIP-2537 | 🔜 Ready (Prague) |
| 0x0e | BLS12381_G2MSM | 22,500 | EIP-2537 | 🔜 Ready (Prague) |
| 0x0f | BLS12381_PAIRING | 37,700 + 32,600/pair | EIP-2537 | 🔜 Ready (Prague) |
| 0x10 | BLS12381_MAP_G1 | 5,500 | EIP-2537 | 🔜 Ready (Prague) |
| 0x11 | BLS12381_MAP_G2 | 23,800 | EIP-2537 | 🔜 Ready (Prague) |

## BN254/alt_bn128 for Groth16 (EIP-1108)

### Overview

The BN254 curve (also called alt_bn128) is the most widely used curve for Groth16 SNARK verification on EVM. EIP-1108 (Istanbul) reduced gas costs by ~90%, making on-chain ZK verification practical.

### Gas Cost History

| Precompile | Pre-Istanbul | Post-Istanbul (EIP-1108) |
|------------|--------------|-------------------------|
| BN256_ADD | 500 | **150** |
| BN256_MUL | 40,000 | **6,000** |
| BN256_PAIRING (base) | 100,000 | **45,000** |
| BN256_PAIRING (per-pair) | 80,000 | **34,000** |

### Groth16 Verification Cost

A typical Groth16 proof verification requires:
- 1 pairing check with ~4 pairs: 45,000 + 4×34,000 = **181,000 gas**
- Plus scalar multiplications and additions: ~50,000 gas
- **Total: ~230,000-250,000 gas per proof**

### Example Usage

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract Groth16Verifier {
    // BN254 precompile addresses
    address constant BN254_ADD = address(0x06);
    address constant BN254_MUL = address(0x07);
    address constant BN254_PAIRING = address(0x08);
    
    /// @notice Verify a Groth16 proof
    /// @param a G1 point (proof element)
    /// @param b G2 point (proof element)
    /// @param c G1 point (proof element)
    /// @param input Public inputs
    function verifyProof(
        uint256[2] memory a,
        uint256[2][2] memory b,
        uint256[2] memory c,
        uint256[] memory input
    ) public view returns (bool) {
        // Construct pairing check input
        // Uses 0x08 ECPAIRING precompile internally
        // ...implementation details...
    }
    
    /// @notice Elliptic curve addition using 0x06 precompile
    function ecAdd(uint256[2] memory p1, uint256[2] memory p2) 
        internal view returns (uint256[2] memory r) 
    {
        uint256[4] memory input;
        input[0] = p1[0];
        input[1] = p1[1];
        input[2] = p2[0];
        input[3] = p2[1];
        
        assembly {
            if iszero(staticcall(gas(), 0x06, input, 0x80, r, 0x40)) {
                revert(0, 0)
            }
        }
    }
}
```

## BLS12-381 for Consensus Verification (EIP-2537)

### Overview

BLS12-381 is the curve used by Ethereum 2.0 and many modern blockchains for BLS signatures. On Lux, this enables:

1. **Quasar Consensus Proofs** - Verify BLS aggregate signatures from validators
2. **Ethereum Light Client** - Verify beacon chain sync committee signatures
3. **Cross-Chain Bridges** - Trustless verification without oracles

### Activation

BLS12-381 precompiles are available in `PrecompiledContractsPrague`. To enable:

```json
{
  "config": {
    "pragueTime": 1735689600
  }
}
```

### Example Usage

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract BLSVerifier {
    // BLS12-381 precompile addresses (EIP-2537)
    address constant BLS_G1ADD = address(0x0b);
    address constant BLS_G1MSM = address(0x0c);
    address constant BLS_G2ADD = address(0x0d);
    address constant BLS_G2MSM = address(0x0e);
    address constant BLS_PAIRING = address(0x0f);
    address constant BLS_MAP_G1 = address(0x10);
    address constant BLS_MAP_G2 = address(0x11);
    
    /// @notice Verify BLS aggregate signature
    /// @param signature Aggregate BLS signature (G2 point)
    /// @param pubkeys Array of BLS public keys (G1 points)
    /// @param message Message that was signed
    function verifyAggregateSignature(
        bytes memory signature,
        bytes[] memory pubkeys,
        bytes32 message
    ) public view returns (bool) {
        // Uses 0x0f BLS12-381 pairing precompile
        // Computes e(aggregatePubkey, H(message)) == e(G1, signature)
        // ...implementation details...
    }
}
```

## MODEXP for RSA/Large Integer Operations (EIP-2565)

### Overview

MODEXP (0x05) performs modular exponentiation, essential for:
- RSA signature verification
- Large integer cryptography
- Some ZK proof systems

### Gas Formula (EIP-2565)

```
gas = max(200, floor(mult_complexity * iter_complexity / 3))

mult_complexity = max(base_len, mod_len)^2 / GQUADDIVISOR

iter_complexity:
  - If exp_len <= 32 and exp == 0: 0
  - If exp_len <= 32: exp.bit_length() - 1
  - If exp_len > 32: 8 * (exp_len - 32) + max(0, exp_high.bit_length() - 1)
```

## Not Included (Custom Precompiles)

The following are NOT standard Ethereum precompiles and require custom implementation:

| Hash Function | Status | Recommendation |
|---------------|--------|----------------|
| Poseidon | ❌ Not standard | Push into ZK circuit |
| Pedersen | ❌ Not standard | Push into ZK circuit |
| MiMC | ❌ Not standard | Push into ZK circuit |

**Best Practice**: For ZK-friendly hashes, perform hashing inside the SNARK circuit and only verify the constant-size proof on-chain.

## Implementation

### Source Files

- **Precompile Implementation**: `github.com/luxfi/geth/core/vm/contracts.go`
- **Gas Parameters**: `github.com/luxfi/geth/params/protocol_params.go`
- **Fork Selection**: `github.com/luxfi/geth/core/vm/contracts.go:224` (`activePrecompiledContracts`)

### Fork Progression

```
Genesis → Homestead (0x01-0x04)
    ↓
Byzantium → adds BN254 with high gas (0x05-0x08)
    ↓
Istanbul (EIP-1108) → reduces BN254 gas by 90%
    ↓
Berlin (EIP-2565) → optimized MODEXP pricing
    ↓
Cancun (EIP-4844) → adds KZG (0x0a)
    ↓
Prague (EIP-2537) → adds BLS12-381 (0x0b-0x11)
```

### Lux Chain Config

All Lux EVM chains activate Istanbul/Berlin from genesis:

```json
{
  "config": {
    "istanbulBlock": 0,
    "berlinBlock": 0,
    "londonBlock": 0
  }
}
```

## Security Considerations

1. **Gas Estimation**: Always estimate gas before calling precompiles; invalid inputs consume all gas
2. **Input Validation**: Precompiles revert on malformed curve points
3. **Side Channels**: Precompile implementations should be constant-time
4. **Curve Security**: BN254 provides ~100-bit security; BLS12-381 provides ~128-bit

## Test Cases

```bash
# Run precompile tests
cd ~/work/lux/geth
go test -v ./core/vm/... -run "TestPrecompile"

# Run BN254 specific tests
go test -v ./core/vm/... -run "TestBn256"

# Run BLS12-381 tests
go test -v ./core/vm/... -run "TestBls12381"
```

## Motivation

Standard Ethereum precompiles are essential for EVM compatibility and enable critical cryptographic operations that would be prohibitively expensive in pure Solidity:

1. **Groth16 verification** requires BN254 curve pairings
2. **BLS signatures** require BLS12-381 curve operations
3. **Ethereum compatibility** requires identical gas costs

## Rationale

Lux EVM chains inherit all standard Ethereum precompiles to ensure full compatibility with existing smart contracts and tooling. Gas costs match Ethereum mainnet post-EIP-1108 for predictable behavior.

## Backwards Compatibility

All precompiles are active from genesis with identical behavior to Ethereum mainnet. No breaking changes to existing contracts.

## References

- [EIP-1108: Reduce alt_bn128 precompile gas costs](https://eips.ethereum.org/EIPS/eip-1108)
- [EIP-2537: BLS12-381 curve operations](https://eips.ethereum.org/EIPS/eip-2537)
- [EIP-2565: ModExp Gas Cost](https://eips.ethereum.org/EIPS/eip-2565)
- [EIP-152: BLAKE2 compression function](https://eips.ethereum.org/EIPS/eip-152)
- [LP-1226: C-Chain EVM Equivalence](./lp-1226-c-chain-evm-equivalence-and-core-eips-adoption.md)
- [LP-3520: Precompile Suite Overview](./lp-3520-precompile-suite-overview.md)

---

*Last Updated: 2025-12-27*
*Implementation Status: Core precompiles active, BLS12-381 ready for Prague activation*
