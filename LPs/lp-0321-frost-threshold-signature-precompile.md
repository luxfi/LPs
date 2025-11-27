---
lp: 0321
title: FROST Threshold Signature Precompile
description: Native precompile for Schnorr/EdDSA threshold signatures using FROST protocol
author: Lux Core Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Standards Track
category: Core
created: 2025-11-22
requires: 4
activation:
  flag: lp321-frost-precompile
  hfName: "Quantum"
  activationHeight: "0"
---

## Abstract

This LP specifies a precompiled contract for verifying FROST (Flexible Round-Optimized Schnorr Threshold) signatures at address `0x020000000000000000000000000000000000000C`. FROST enables efficient t-of-n threshold signatures using Schnorr signatures, compatible with Bitcoin Taproot (BIP-340/341), Ed25519 (Solana, Cardano), and secp256k1. The precompile provides compact 64-byte threshold signatures with a two-round signing protocol, offering lower gas costs than ECDSA-based threshold schemes.

## Motivation

### The Threshold Signature Challenge

Multi-party signatures are essential for:
1. **Distributed Trust**: No single party controls the signing key
2. **Threshold Policies**: Require t-of-n parties to authorize (e.g., 3-of-5)
3. **Operational Resilience**: Function with n-t offline parties
4. **Attack Resistance**: Adversary needs to compromise ≥t parties

Existing threshold schemes have limitations:
- **ECDSA Threshold (CGGMP21)**: Complex multi-round protocol, higher gas costs
- **BLS Threshold**: Requires trusted dealer, pairing-based cryptography
- **Native Multisig**: Linear verification cost, not aggregatable

### Why FROST?

FROST (Flexible Round-Optimized Schnorr Threshold) provides unique advantages:

1. **Efficiency**: Two-round signing protocol (commitment + response)
2. **Compact Signatures**: 64 bytes (standard Schnorr), same as single-party
3. **Bitcoin Compatibility**: Native support for Taproot (BIP-340/341) multisig
4. **Ed25519 Support**: Works with Solana, Cardano, TON, Polkadot signatures
5. **No Trusted Dealer**: Distributed key generation without central party
6. **Standards-Based**: IETF draft-irtf-cfrg-frost specification

### Use Cases

- **Bitcoin Taproot Multisig**: Quantum-resistant alternative to classical multisig
- **Cross-Chain Bridges**: Efficient threshold control of bridge assets
- **DAO Governance**: Council-based threshold voting and execution
- **Validator Signing**: Threshold validator signatures for consensus
- **Enterprise Custody**: Multi-party institutional wallet control

## Specification

### Precompile Address

```
0x020000000000000000000000000000000000000C
```

### Input Format

The precompile accepts a packed binary input:

| Offset | Length | Field | Description |
|--------|--------|-------|-------------|
| 0      | 4      | `threshold` | Required number of signers (big-endian uint32) |
| 4      | 4      | `totalSigners` | Total number of participants (big-endian uint32) |
| 8      | 32     | `aggregatePublicKey` | Aggregated threshold public key |
| 40     | 32     | `messageHash` | SHA-256 hash of message being verified |
| 72     | 64     | `signature` | Schnorr signature (R ‖ s) |

**Total size**: 136 bytes (fixed)

### Signature Format

FROST produces standard Schnorr signatures (BIP-340 format):
- **R** (32 bytes): Nonce commitment point (x-coordinate only)
- **s** (32 bytes): Signature scalar

The signature is indistinguishable from a single-party Schnorr signature.

### Output Format

32-byte word:
- `0x0000000000000000000000000000000000000000000000000000000000000001` - signature valid
- `0x0000000000000000000000000000000000000000000000000000000000000000` - signature invalid

### Gas Cost

```
gas = BASE_COST + (totalSigners * PER_SIGNER_COST)

Where:
  BASE_COST = 50,000 gas
  PER_SIGNER_COST = 5,000 gas per participant
```

**Examples:**
- 2-of-3 threshold: 50,000 + (3 × 5,000) = 65,000 gas
- 3-of-5 threshold: 50,000 + (5 × 5,000) = 75,000 gas
- 5-of-7 threshold: 50,000 + (7 × 5,000) = 85,000 gas
- 10-of-15 threshold: 50,000 + (15 × 5,000) = 125,000 gas

### Solidity Interface

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IFROST {
    /**
     * @notice Verify a FROST threshold signature
     * @param threshold The minimum number of signers required (t)
     * @param totalSigners The total number of parties (n)
     * @param publicKey The aggregated public key (32 bytes)
     * @param messageHash The hash of the message (32 bytes)
     * @param signature The Schnorr signature (64 bytes: R || s)
     * @return valid True if the signature is valid
     */
    function verify(
        uint32 threshold,
        uint32 totalSigners,
        bytes32 publicKey,
        bytes32 messageHash,
        bytes calldata signature
    ) external view returns (bool valid);
}

library FROSTLib {
    address constant FROST_PRECOMPILE = 0x020000000000000000000000000000000000000C;
    uint256 constant BASE_GAS = 50_000;
    uint256 constant PER_SIGNER_GAS = 5_000;

    error InvalidThreshold();
    error InvalidSignature();
    error SignatureVerificationFailed();

    /**
     * @notice Verify FROST signature and revert on failure
     */
    function verifyOrRevert(
        uint32 threshold,
        uint32 totalSigners,
        bytes32 publicKey,
        bytes32 messageHash,
        bytes calldata signature
    ) internal view {
        if (threshold == 0 || threshold > totalSigners) {
            revert InvalidThreshold();
        }
        if (signature.length != 64) {
            revert InvalidSignature();
        }

        bytes memory input = abi.encodePacked(
            threshold,
            totalSigners,
            publicKey,
            messageHash,
            signature
        );

        (bool success, bytes memory result) = FROST_PRECOMPILE.staticcall(input);
        require(success, "FROST precompile call failed");

        bool valid = abi.decode(result, (bool));
        if (!valid) {
            revert SignatureVerificationFailed();
        }
    }

    /**
     * @notice Estimate gas for FROST verification
     */
    function estimateGas(uint32 totalSigners) internal pure returns (uint256) {
        return BASE_GAS + (uint256(totalSigners) * PER_SIGNER_GAS);
    }

    /**
     * @notice Check if threshold parameters are valid
     */
    function isValidThreshold(uint32 threshold, uint32 totalSigners)
        internal pure returns (bool)
    {
        return threshold > 0 && threshold <= totalSigners;
    }
}

abstract contract FROSTVerifier {
    using FROSTLib for *;

    event FROSTSignatureVerified(
        uint32 threshold,
        uint32 totalSigners,
        bytes32 indexed publicKey,
        bytes32 indexed messageHash
    );

    function verifyFROSTSignature(
        uint32 threshold,
        uint32 totalSigners,
        bytes32 publicKey,
        bytes32 messageHash,
        bytes calldata signature
    ) internal view {
        FROSTLib.verifyOrRevert(threshold, totalSigners, publicKey, messageHash, signature);
    }
}
```

### Example Usage

```solidity
contract TaprootBridge is FROSTVerifier {
    struct BridgeConfig {
        uint32 threshold;        // e.g., 3
        uint32 totalGuardians;   // e.g., 5
        bytes32 taprootPubKey;
    }

    BridgeConfig public config;

    function relayBitcoinTransaction(
        bytes32 txHash,
        bytes calldata guardianSignature
    ) external {
        // Verify threshold signature from guardians
        verifyFROSTSignature(
            config.threshold,
            config.totalGuardians,
            config.taprootPubKey,
            txHash,
            guardianSignature
        );

        // Process Bitcoin transaction
        // Signature verified by FROST precompile
    }
}

contract DAOGovernance is FROSTVerifier {
    uint32 public constant COUNCIL_THRESHOLD = 5;
    uint32 public constant COUNCIL_SIZE = 7;
    bytes32 public councilPublicKey;

    function executeProposal(
        uint256 proposalId,
        bytes32 proposalHash,
        bytes calldata councilSignature
    ) external {
        FROSTLib.verifyOrRevert(
            COUNCIL_THRESHOLD,
            COUNCIL_SIZE,
            councilPublicKey,
            proposalHash,
            councilSignature
        );

        // Execute proposal - council approved
    }
}
```

## Rationale

### Why FROST Over Other Threshold Schemes?

**Comparison:**

| Scheme | Rounds | Signature Size | Gas Cost (3-of-5) | Quantum Safe | Standards |
|--------|--------|----------------|-------------------|--------------|-----------|
| **FROST** | 2 | 64 bytes | 75,000 | ❌ | IETF, BIP-340 |
| CGGMP21 | 5+ | 65 bytes | 125,000 | ❌ | ePrint 2021/060 |
| BLS | 1 | 96 bytes | 120,000 | ❌ | ETH2, Warp |
| Ringtail | 2 | ~4KB | 200,000 | ✅ | ePrint 2024/1113 |

FROST advantages:
- **Lowest gas cost** among classical threshold schemes
- **Compact signatures** (64 bytes vs 65+ bytes)
- **Two rounds** (vs 5+ for CGGMP21)
- **Bitcoin compatible** (Taproot BIP-341)
- **IETF standardized** (draft-irtf-cfrg-frost)

### Gas Cost Justification

The gas formula accounts for:

1. **Base Schnorr Verification**: 50K gas for elliptic curve operations
   - Point multiplication: s·G
   - Point addition: R + c·P
   - Hash computation: H(R ‖ P ‖ m)

2. **Per-Signer Overhead**: 5K gas per participant for:
   - Commitment verification
   - Share validation
   - Aggregation computation

**Comparison to ecrecover**:
- `ecrecover`: 3,000 gas (single-party ECDSA)
- FROST 2-of-3: 65,000 gas (21.7x for threshold capability)
- FROST 3-of-5: 75,000 gas (25x for threshold capability)

The premium is justified by:
- Distributed trust (no single point of failure)
- Threshold flexibility (any t-of-n can sign)
- Compact aggregated signatures

### Two-Round Protocol Efficiency

FROST achieves threshold signatures in 2 rounds:

```
Setup (one-time):
  - Distributed key generation (DKG)
  - Each party holds share of private key
  - Compute aggregated public key

Round 1 (Commitment):
  - Each signer generates nonce pair (d, e)
  - Broadcast commitments (D, E) = (d·G, e·G)
  - Aggregator collects commitments

Round 2 (Response):
  - Compute binding value ρ from all commitments
  - Compute challenge c = H(R ‖ P ‖ m)
  - Each signer computes response z = d + (e·ρ) + (λ·s·c)
  - Aggregator combines: s = Σ(z), R = Σ(D + ρ·E)
  - Output signature: (R, s)
```

This is **optimal** - no threshold scheme can do better than 2 rounds without a trusted dealer.

### Bitcoin Taproot Integration

FROST signatures are **identical** to BIP-340 Schnorr signatures:

```solidity
// Bitcoin Taproot key (32 bytes x-coordinate)
bytes32 taprootPubKey = /* aggregate FROST key */;

// FROST signature (64 bytes)
bytes calldata frostSig = /* threshold signature */;

// Verify via precompile
bool valid = FROST.verify(3, 5, taprootPubKey, txHash, frostSig);

// This signature is valid on Bitcoin mainnet!
```

Use cases:
- **Multi-chain custody**: Same threshold key controls Bitcoin + EVM assets
- **Cross-chain swaps**: Atomic swaps with threshold approval
- **Bridge security**: Threshold control of Bitcoin bridge funds

## Backwards Compatibility

This LP introduces a new precompile and has no backwards compatibility issues.

### Migration from ECDSA Multisig

Projects using native multisig can adopt FROST incrementally:

**Phase 1**: Hybrid verification (ECDSA OR FROST)
```solidity
function verify(bytes calldata sig) internal view returns (bool) {
    if (sig.length == 65) {
        // ECDSA multisig (multiple signatures)
        return verifyECDSAMultisig(sig);
    } else if (sig.length == 64) {
        // FROST threshold signature
        return verifyFROST(sig);
    }
    revert("Unknown signature type");
}
```

**Phase 2**: Transition keys to FROST-only

**Phase 3**: Deprecate ECDSA multisig after migration period

## Test Cases

### Test Vector 1: Valid 3-of-5 Threshold

**Input:**
```
threshold: 3
totalSigners: 5
publicKey: 0x9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08
messageHash: keccak256("Test FROST signature")
signature: 0x<64 bytes of valid Schnorr signature>
```

**Expected Output:** `0x...0001` (valid)
**Expected Gas:** 50,000 + (5 × 5,000) = 75,000 gas

### Test Vector 2: Invalid Signature

**Input:**
```
threshold: 3
totalSigners: 5
publicKey: <same as above>
messageHash: <same as above>
signature: 0x<64 bytes of INVALID signature>
```

**Expected Output:** `0x...0000` (invalid)
**Expected Gas:** 75,000 gas (verification still runs)

### Test Vector 3: Tampered Message

**Input:**
```
threshold: 3
totalSigners: 5
publicKey: <valid key>
messageHash: 0x<DIFFERENT hash than signed>
signature: <valid signature for different message>
```

**Expected Output:** `0x...0000` (invalid)

### Test Vector 4: Invalid Threshold Parameters

**Input:**
```
threshold: 6
totalSigners: 5
publicKey: <valid key>
messageHash: <valid hash>
signature: <valid signature>
```

**Expected:** Revert with "invalid threshold: t must be > 0 and <= n"

### Test Vector 5: Large Threshold (10-of-15)

**Input:**
```
threshold: 10
totalSigners: 15
publicKey: <valid key>
messageHash: <valid hash>
signature: <valid 10-of-15 signature>
```

**Expected Output:** `0x...0001` (valid)
**Expected Gas:** 50,000 + (15 × 5,000) = 125,000 gas

## Reference Implementation

**Implementation Status**: ✅ COMPLETE

See: `standard/src/precompiles/frost/`

**Key Files:**
- [`contract.go`](/Users/z/work/lux/standard/src/precompiles/frost/contract.go) - Core precompile implementation (167 lines)
- [`module.go`](/Users/z/work/lux/standard/src/precompiles/frost/module.go) - Precompile registration
- [`contract_test.go`](/Users/z/work/lux/standard/src/precompiles/frost/contract_test.go) - Comprehensive test suite
- [`IFROST.sol`](/Users/z/work/lux/standard/src/precompiles/frost/IFROST.sol) - Solidity interface and library (238 lines)
- [`README.md`](/Users/z/work/lux/standard/src/precompiles/frost/README.md) - Complete documentation (266 lines)

**Cryptography:**
- External Package: [`/Users/z/work/lux/threshold/protocols/frost`](/Users/z/work/lux/threshold/protocols/frost)
- Protocol: Two-round Schnorr threshold signature (IETF CFRG FROST)
- Curves: secp256k1 (Bitcoin), Ed25519 (Solana), curve25519
- Security: Discrete logarithm assumption

**Test Coverage:**
```go
// Test suite includes:
- Valid threshold signature verification
- Invalid signature rejection
- Message tampering detection
- Threshold parameter validation
- Gas cost verification
- Edge cases (1-of-1, n-of-n)
```

## Security Considerations

### Cryptographic Security

FROST's security rests on the **discrete logarithm assumption**:
- Adversary cannot compute private key from public key
- Standard assumption for ECDSA, Schnorr, Ed25519
- **Not quantum-safe** (vulnerable to Shor's algorithm)

For quantum resistance, use **Ringtail** (LP-320) or LSS-MPC (LP-323).

### Threshold Security Properties

**Safety (Unforgeability)**:
- Adversary controlling < t parties cannot forge signatures
- Even with access to all < t shares
- Shares reveal no information about the private key

**Liveness**:
- Any t honest parties can produce valid signature
- Tolerates up to n-t offline/crashed parties
- No single point of failure

**Robustness**:
- Byzantine adversary can corrupt up to t-1 parties
- Honest majority assumption: ≥ t honest parties
- Recommended: t > 2n/3 for Byzantine fault tolerance

### Distributed Key Generation

FROST supports DKG without trusted dealer:

```
1. Each party i generates random polynomial f_i(x) of degree t-1
2. Broadcast commitments: C_i,k = f_i(k)·G for k = 0..t-1
3. Send shares: s_i,j = f_i(j) to party j (secure channel)
4. Verify shares: s_i,j·G = Σ(C_i,k · j^k)
5. Compute key share: SK_i = Σ(s_j,i), PK_i = SK_i·G
6. Aggregated public key: PK = Σ(C_j,0)
```

No party ever sees the full private key.

### Nonce Security

**Critical requirement**: Nonces must be **unique per signature**

```
// ❌ NEVER reuse nonces
d1, e1 := generateNonces()
sig1 := sign(msg1, d1, e1)
sig2 := sign(msg2, d1, e1)  // KEY RECOVERY ATTACK!

// ✅ Always generate fresh nonces
for each signature {
    d, e := generateFreshNonces()
    sig := sign(msg, d, e)
}
```

Reusing nonces allows **private key recovery** from two signatures.

### Side-Channel Resistance

Implementation considerations:
- Use constant-time scalar multiplication
- Avoid timing-dependent branches
- Clear sensitive data from memory after use
- Protect against power analysis attacks

### Message Hashing

**Always hash messages** before signing:

```solidity
// ✅ CORRECT: Hash before signing
bytes32 messageHash = keccak256(abi.encode(data));
verifyFROST(..., messageHash, signature);

// ❌ WRONG: Sign raw data (vulnerable to collision attacks)
verifyFROST(..., rawData, signature);
```

Use domain separation to prevent cross-protocol attacks:

```solidity
bytes32 messageHash = keccak256(abi.encodePacked(
    "FROST-DOMAIN-v1",
    chainId,
    contractAddress,
    data
));
```

### Integration Security

When using FROST in smart contracts:

```solidity
// ✅ GOOD: Verify before state changes
function withdraw(bytes calldata sig) external {
    require(verifyFROST(sig), "Invalid signature");
    // Safe to modify state
    balance[msg.sender] = 0;
}

// ❌ BAD: State change before verification
function withdraw(bytes calldata sig) external {
    balance[msg.sender] = 0;  // Vulnerable!
    require(verifyFROST(sig), "Invalid signature");
}

// ✅ GOOD: Use reentrancy guard
function withdraw(bytes calldata sig) external nonReentrant {
    verifyFROSTSignature(..., sig);
    (bool success,) = msg.sender.call{value: amount}("");
    require(success);
}
```

## Economic Impact

### Gas Cost Comparison

| Scheme | 2-of-3 | 3-of-5 | 5-of-7 | Security | Use Case |
|--------|--------|--------|--------|----------|----------|
| **FROST** | 65,000 | 75,000 | 85,000 | Classical | General threshold |
| CGGMP21 | 75,000 | 125,000 | 175,000 | Classical | ECDSA compatibility |
| Ringtail | 180,000 | 200,000 | 220,000 | Post-quantum | Long-term storage |
| Native Multisig | 21k×2 | 21k×3 | 21k×5 | Classical | Simple multisig |

**Trade-off Analysis**:
- **FROST**: Best classical threshold (gas/security)
- **CGGMP21**: Use when ECDSA compatibility required
- **Ringtail**: Use when quantum resistance needed
- **Native Multisig**: Cheaper but not aggregatable

### Use Case Economics

**When FROST is Optimal**:
- Medium-value transactions ($1K-$1M)
- Bitcoin Taproot integration required
- Threshold flexibility needed (2-of-3, 3-of-5, etc.)
- Gas costs are acceptable trade-off for security

**When to Use Alternatives**:
- **Low-value (<$1K)**: Native multisig (cheaper)
- **High-value (>$1M, long-term)**: Ringtail (quantum-safe)
- **ECDSA required**: CGGMP21 (LP-322)

### Bridge Economics

For cross-chain bridges using FROST threshold:
- Gas per signature verification: ~75K gas
- Cost at 50 gwei: $0.15 (ETH at $4000)
- Significantly cheaper than CGGMP21 (~125K gas)
- Enables efficient Bitcoin ↔ EVM bridges

## Open Questions

1. **Should we support Ed25519-FROST separately?**
   - Current: secp256k1 Schnorr (Bitcoin compatible)
   - Ed25519-FROST: Different curve, used by Solana/Cardano
   - Trade-off: Additional precompile vs developer demand

2. **Dynamic threshold via LSS resharing?**
   - See LP-323 for LSS-MPC extension
   - Allows changing t-of-n without re-keying
   - Integration points with FROST

3. **Hardware acceleration?**
   - Schnorr verification could be hardware-accelerated
   - FPGA/ASIC for elliptic curve operations
   - Potential 10x performance improvement

4. **Cross-chain threshold coordination?**
   - Use FROST for multi-chain signing
   - Coordinate threshold across Bitcoin + EVM + Cosmos
   - Unified threshold custody architecture

## Implementation Notes

### Integration with `/Users/z/work/lux/threshold`

The precompile integrates with the external FROST threshold library:

```go
import "github.com/luxfi/threshold/protocols/frost"

// Available functions:
// - frost.Keygen() - Distributed key generation
// - frost.Sign() - Two-round threshold signing
// - frost.Verify() - Standard Schnorr verification
// - frost.Refresh() - Share refreshing
// - frost.KeygenTaproot() - Bitcoin Taproot keys
```

**Library Features:**
- Two-round signing protocol (commitment + response)
- Distributed key generation without trusted dealer
- Shamir secret sharing for threshold
- Network stack for party communication
- Support for secp256k1, Ed25519, curve25519

### Parameter Constraints

**Validation Rules**:
- `threshold` must be > 0 and ≤ `totalSigners`
- `totalSigners` must be ≥ 2 (1-of-1 is pointless)
- Recommended: `threshold` ≥ `totalSigners/2 + 1` (honest majority)
- Maximum: `totalSigners` ≤ 100 (practical limit for coordination)

**Security Recommendations**:
- Byzantine threshold: `threshold` > `totalSigners * 2/3`
- Liveness threshold: `totalSigners - threshold` < `totalSigners/3`
- Common configurations:
  - 2-of-3: Simple multisig
  - 3-of-5: Standard governance
  - 5-of-7: High-security custody
  - 7-of-10: Enterprise applications

### Schnorr Signature Verification

The precompile verifies standard Schnorr signatures:

```
Given:
  - Public key P (32 bytes x-coordinate)
  - Message hash m (32 bytes)
  - Signature (R, s) where R is 32 bytes, s is 32 bytes

Verify:
  1. Compute challenge: c = H(R || P || m)
  2. Verify equation: s·G = R + c·P
  3. Return true if equation holds, false otherwise
```

This is identical to BIP-340 verification, ensuring Bitcoin compatibility.

## Extensions

See **LP-323** (LSS-MPC) for dynamic resharing capabilities:
- Change threshold t without re-keying
- Add/remove parties from threshold set
- Proactive secret sharing for forward security
- Compatible with FROST base protocol

## References

### Specifications
- **IETF FROST**: [draft-irtf-cfrg-frost](https://datatracker.ietf.org/doc/draft-irtf-cfrg-frost/)
- **BIP-340**: [Schnorr Signatures for secp256k1](https://github.com/bitcoin/bips/blob/master/bip-0340.mediawiki)
- **BIP-341**: [Taproot: SegWit version 1 spending rules](https://github.com/bitcoin/bips/blob/master/bip-0341.mediawiki)

### Academic Papers
- Chelsea Komlo and Ian Goldberg (2020). "FROST: Flexible Round-Optimized Schnorr Threshold Signatures" (ePrint 2020/852)
- Torben Pryds Pedersen (1991). "A Threshold Cryptosystem without a Trusted Party"

### Implementation
- **Precompile**: [`standard/src/precompiles/frost/`](/Users/z/work/lux/standard/src/precompiles/frost/)
- **Threshold Library**: [`threshold/protocols/frost/`](/Users/z/work/lux/threshold/protocols/frost/)
- **Tests**: [`standard/src/precompiles/frost/contract_test.go`](/Users/z/work/lux/standard/src/precompiles/frost/contract_test.go)
- **Interface**: [`standard/src/precompiles/frost/IFROST.sol`](/Users/z/work/lux/standard/src/precompiles/frost/IFROST.sol)

### Related LPs
- **LP-4**: Quantum-Resistant Cryptography Integration
- **LP-320**: Ringtail Threshold Signatures (post-quantum alternative)
- **LP-322**: CGGMP21 Threshold ECDSA (ECDSA-compatible threshold)
- **LP-323**: LSS-MPC (dynamic resharing for FROST)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
