---
lp: 2516
title: Quasar Quantum Consensus Precompile
description: Native precompile suite for hybrid BLS/Ringtail consensus operations enabling quantum-safe finality
author: Lux Core Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Standards Track
category: Core
created: 2025-12-14
requires: 4, 2311
activation:
  flag: lp2516-quasar-precompile
  hfName: "Quasar"
  activationHeight: "0"
tags: [pqc, precompile, consensus, q-chain]
order: 516
---

## Abstract

This LP specifies the Quasar consensus precompile suite at address range `0x0300000000000000000000000000000000000020` through `0x0300000000000000000000000000000000000025`. Quasar provides hyper-efficient on-chain verification of consensus proofs using hybrid BLS/Ringtail signatures, enabling 1ms block finality via Fast Probabilistic Consensus (FPC) with K=3 validator minimum. The precompiles integrate with Q-Chain for quantum-safe finality across all Lux chains (P, C, X, A, etc.).

## Activation

| Parameter          | Value                              |
|--------------------|------------------------------------|
| Flag string        | `lp2516-quasar-precompile`         |
| Precompile Range   | `0x0300...0020` - `0x0300...0025`  |
| Default in code    | **false** until Quasar fork        |
| Deployment branch  | `v1.25.0-quasar`                   |
| Roll-out criteria  | Q-Chain activation                 |
| Back-off plan      | Disable via chain config           |

## Motivation

### The Need for Quantum-Safe Consensus

Current blockchain consensus relies on BLS or ECDSA signatures for validator attestations. While BLS provides efficient aggregation, it remains vulnerable to quantum computers running Shor's algorithm. Quasar provides a hybrid approach:

1. **Classical Performance**: BLS signatures for immediate speed (5,000 gas)
2. **Quantum Safety**: Ringtail (ML-DSA) signatures for long-term security (8,000 gas)
3. **Hybrid Security**: Combined BLS+Ringtail for defense-in-depth (10,000 gas)

### Why FPC with K=3?

Fast Probabilistic Consensus (FPC) achieves 1ms finality by:

- **Minimal Validator Quorum**: K=3 validators sufficient for probabilistic finality
- **Parallel Voting**: Validators vote simultaneously without sequential rounds
- **Threshold Convergence**: 2/3 threshold (22/32 validators) provides BFT guarantees
- **Compressed Witnesses**: 44-byte witnesses instead of full signature sets

### Q-Chain Integration

Q-Chain serves as the quantum finality layer for all Lux chains:

```
+------------------------------------------------------------------+
|  Q-Chain (Quantum Finality Layer)                                |
|  Stores quantum-final block tips via Quasar (BLS/Ringtail)       |
+------------------------------------------------------------------+
           |          |          |          |          |
    +------+   +------+   +------+   +------+   +------+
    |P-Chain|  |C-Chain|  |X-Chain|  |A-Chain|  |chains|
    +-------+  +-------+  +-------+  +-------+  +-------+
```

Each chain submits block tips to Q-Chain for quantum-safe finalization. Once finalized on Q-Chain, blocks inherit quantum resistance across all chains.

## Specification

### Precompile Addresses

| Address | Name | Gas Cost | Purpose |
|---------|------|----------|---------|
| `0x0300000000000000000000000000000000000020` | VerkleVerify | 3,000 | Verkle witness verification with PQ finality |
| `0x0300000000000000000000000000000000000021` | BLSVerify | 5,000 | BLS signature verification |
| `0x0300000000000000000000000000000000000022` | BLSAggregate | 2,000/sig | BLS signature aggregation |
| `0x0300000000000000000000000000000000000023` | RingtailVerify | 8,000 | ML-DSA post-quantum verification |
| `0x0300000000000000000000000000000000000024` | HybridVerify | 10,000 | BLS+Ringtail hybrid verification |
| `0x0300000000000000000000000000000000000025` | CompressedVerify | 1,000 | Ultra-compressed witness verification |

### VerkleVerify (0x...0020)

Verifies Verkle witnesses with post-quantum finality assumption.

**Input Format:**
| Offset | Length | Field | Description |
|--------|--------|-------|-------------|
| 0 | 32 | `commitment` | Verkle commitment |
| 32 | 32 | `proof` | Verkle proof |
| 64 | 1 | `thresholdMet` | PQ threshold indicator |

**Output:** 32-byte boolean (0x01 = valid, 0x00 = invalid)

**Gas:** 3,000 (ultra-low due to PQ finality assumption)

### BLSVerify (0x...0021)

Verifies BLS12-381 signatures using compressed public keys.

**Input Format:**
| Offset | Length | Field | Description |
|--------|--------|-------|-------------|
| 0 | 48 | `publicKey` | Compressed BLS public key |
| 48 | 32 | `messageHash` | Hash of signed message |
| 80 | 96 | `signature` | BLS signature |

**Output:** 32-byte boolean

**Gas:** 5,000

### BLSAggregate (0x...0022)

Aggregates multiple BLS signatures into a single signature.

**Input Format:** Concatenated 96-byte BLS signatures

**Output:** 96-byte aggregated signature

**Gas:** 2,000 per signature (scales linearly)

### RingtailVerify (0x...0023)

Verifies Ringtail (ML-DSA) post-quantum signatures.

**Input Format:**
| Offset | Length | Field | Description |
|--------|--------|-------|-------------|
| 0 | 1 | `mode` | ML-DSA mode (0=44, 1=65, 2=87) |
| 1 | 2 | `pubKeyLen` | Public key length (big-endian) |
| 3 | var | `publicKey` | ML-DSA public key |
| 3+len | 2 | `msgLen` | Message length (big-endian) |
| 5+len | var | `message` | Message bytes |
| 5+len+msgLen | var | `signature` | ML-DSA signature |

**Supported Modes:**
- Mode 0: ML-DSA-44 (NIST Level 1)
- Mode 1: ML-DSA-65 (NIST Level 3, recommended)
- Mode 2: ML-DSA-87 (NIST Level 5)

**Output:** 32-byte boolean

**Gas:** 8,000

### HybridVerify (0x...0024)

Verifies combined BLS + Ringtail signatures for defense-in-depth.

**Input Format:**
| Offset | Length | Field | Description |
|--------|--------|-------|-------------|
| 0 | 96 | `blsSignature` | BLS signature |
| 96 | 2 | `ringtailSigLen` | Ringtail signature length |
| 98 | var | `ringtailSignature` | ML-DSA signature |
| 98+len | 32 | `messageHash` | Message hash |
| 130+len | 48 | `blsPublicKey` | BLS public key |
| 178+len | var | `ringtailPublicKey` | ML-DSA public key |

**Output:** 32-byte boolean (both must be valid)

**Gas:** 10,000

### CompressedVerify (0x...0025)

Ultra-fast verification of compressed consensus witnesses.

**Input Format:**
| Offset | Length | Field | Description |
|--------|--------|-------|-------------|
| 0 | 16 | `commitment` | Compressed commitment |
| 16 | 16 | `proof` | Compressed proof |
| 32 | 8 | `metadata` | Block metadata |
| 40 | 4 | `validatorBits` | Validator bitfield (32 validators) |

**Threshold:** 22/32 validators (2/3 BFT threshold)

**Output:** 32-byte boolean

**Gas:** 1,000 (ultra-low)

### Solidity Interfaces

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IVerkleVerify {
    function verify(
        bytes32 commitment,
        bytes32 proof,
        bool thresholdMet
    ) external view returns (bool valid);
}

interface IBLSVerify {
    function verify(
        bytes calldata publicKey,
        bytes32 messageHash,
        bytes calldata signature
    ) external view returns (bool valid);
}

interface IBLSAggregate {
    function aggregate(bytes[] calldata signatures)
        external view returns (bytes memory aggregatedSignature);
}

interface IRingtailVerify {
    function verify(
        uint8 mode,
        bytes calldata publicKey,
        bytes calldata message,
        bytes calldata signature
    ) external view returns (bool valid);
}

interface IHybridVerify {
    function verify(
        bytes calldata blsSignature,
        bytes calldata ringtailSignature,
        bytes32 messageHash,
        bytes calldata blsPublicKey,
        bytes calldata ringtailPublicKey
    ) external view returns (bool valid);
}

interface ICompressedVerify {
    function verify(
        bytes16 commitment,
        bytes16 proof,
        bytes8 metadata,
        uint32 validatorBits
    ) external view returns (bool valid);
}
```

### QuasarLib Helper Library

```solidity
library QuasarLib {
    address constant VERKLE_VERIFY = 0x0300000000000000000000000000000000000020;
    address constant BLS_VERIFY = 0x0300000000000000000000000000000000000021;
    address constant BLS_AGGREGATE = 0x0300000000000000000000000000000000000022;
    address constant RINGTAIL_VERIFY = 0x0300000000000000000000000000000000000023;
    address constant HYBRID_VERIFY = 0x0300000000000000000000000000000000000024;
    address constant COMPRESSED_VERIFY = 0x0300000000000000000000000000000000000025;

    uint256 constant VERKLE_GAS = 3000;
    uint256 constant BLS_VERIFY_GAS = 5000;
    uint256 constant BLS_AGGREGATE_GAS_PER_SIG = 2000;
    uint256 constant RINGTAIL_GAS = 8000;
    uint256 constant HYBRID_GAS = 10000;
    uint256 constant COMPRESSED_GAS = 1000;

    uint256 constant BLS_PUBKEY_SIZE = 48;
    uint256 constant BLS_SIGNATURE_SIZE = 96;
    uint256 constant VALIDATOR_THRESHOLD = 22;

    error BLSVerificationFailed();
    error RingtailVerificationFailed();
    error HybridVerificationFailed();

    function verifyBLS(
        bytes memory publicKey,
        bytes32 messageHash,
        bytes memory signature
    ) internal view returns (bool valid) {
        require(publicKey.length == BLS_PUBKEY_SIZE, "Invalid pubkey size");
        require(signature.length == BLS_SIGNATURE_SIZE, "Invalid sig size");

        bytes memory input = abi.encodePacked(publicKey, messageHash, signature);
        (bool success, bytes memory result) = BLS_VERIFY.staticcall(input);
        if (!success || result.length == 0) return false;
        return result[0] == 0x01;
    }

    function countValidators(uint32 validatorBits) internal pure returns (uint256 count) {
        while (validatorBits > 0) {
            count += validatorBits & 1;
            validatorBits >>= 1;
        }
    }

    function isThresholdMet(uint32 validatorBits) internal pure returns (bool) {
        return countValidators(validatorBits) >= VALIDATOR_THRESHOLD;
    }
}
```

## Architecture

### Fast Probabilistic Consensus (FPC)

Quasar implements FPC for 1ms block finality:

```
Round 0 (Proposal):
  Proposer → Block + BLS signature → Broadcast

Round 1 (Vote):
  Validators (K >= 3) → Parallel votes → Threshold check

Finality (1ms):
  threshold >= 2/3 → Block final
  threshold < 2/3 → Next round
```

**Key Parameters:**
- **K**: Minimum 3 validators for quorum
- **Threshold**: 22/32 (68.75%) for finality
- **Round Time**: ~500μs per round
- **Total Finality**: ~1ms (2 rounds typical)

### Hybrid Classical/PQ Signatures

Validators maintain two key pairs:

1. **BLS Key Pair**: For fast classical signatures
2. **Ringtail Key Pair**: For quantum-safe signatures

**Signature Strategy:**
```
Normal Operation:     BLS only (5,000 gas, fast)
High-Value Blocks:    Hybrid BLS+Ringtail (10,000 gas, quantum-safe)
Long-Term Finality:   Ringtail only (8,000 gas, stored on Q-Chain)
```

### Q-Chain Role

Q-Chain stores quantum-final block tips for all Lux chains:

```go
type QChainFinalityRecord struct {
    ChainID        [32]byte      // Source chain identifier
    BlockHeight    uint64        // Finalized block height
    BlockHash      [32]byte      // Finalized block hash
    Timestamp      uint64        // Finalization timestamp (ms)
    BLSAggSig      [96]byte      // Aggregated BLS signatures
    RingtailSig    []byte        // Ringtail threshold signature
    ValidatorBits  uint32        // Participating validator bitfield
}
```

**Finality Flow:**
1. C-Chain block reaches local finality
2. Validators sign block hash with BLS + Ringtail
3. Aggregated proof submitted to Q-Chain
4. Q-Chain verifies threshold and stores finality record
5. Block inherits quantum resistance from Q-Chain attestation

### Integration with LX DEX

LX DEX uses Quasar for 1ms trade finality:

```solidity
contract LXDEXSettlement is QuasarVerifier {
    function settleWithQuantumFinality(
        bytes32 blockHash,
        uint32 validatorBits,
        bytes calldata blsAggregate,
        bytes calldata ringtailProof
    ) external {
        // Verify compressed witness (1,000 gas)
        require(_isThresholdMet(validatorBits), "Threshold not met");

        // Verify BLS aggregate (5,000 gas)
        _verifyBLS(validatorBits, blockHash, blsAggregate);

        // Optional: Verify Ringtail for high-value settlements
        if (msg.value > HIGH_VALUE_THRESHOLD) {
            _verifyRingtail(blockHash, ringtailProof);
        }

        // Execute settlement
        _executeSettlement();
    }
}
```

**Performance:**
- Order matching: 2ns (GPU) / 487ns (CPU)
- Consensus finality: 1ms
- Total settlement: ~1.5ms

## Rationale

### Why Six Precompiles?

Each precompile serves a distinct purpose:

1. **VerkleVerify**: State proofs with PQ finality assumption
2. **BLSVerify**: Fast validator signatures (most common)
3. **BLSAggregate**: Signature compression for efficiency
4. **RingtailVerify**: Quantum-safe signatures when needed
5. **HybridVerify**: Defense-in-depth for critical operations
6. **CompressedVerify**: Ultra-fast consensus witness checks

### Gas Cost Justification

| Precompile | Gas | Rationale |
|------------|-----|-----------|
| VerkleVerify | 3,000 | Simple commitment check with PQ assumption |
| BLSVerify | 5,000 | BLS pairing ~100μs on M1 |
| BLSAggregate | 2,000/sig | Linear aggregation cost |
| RingtailVerify | 8,000 | ML-DSA ~108μs verification |
| HybridVerify | 10,000 | BLS + Ringtail combined |
| CompressedVerify | 1,000 | Bitfield counting only |

### Why K=3 Minimum?

K=3 provides sufficient randomness for FPC while enabling:
- Small chain validation
- Fast convergence (fewer messages)
- Minimal trust assumptions

For high-security chains, K can be increased via chain config.

### Address Range 0x0300...

The `0x0300...` prefix distinguishes Quasar precompiles from:
- `0x0100...`: Ethereum standard precompiles
- `0x0200...`: Lux cryptographic precompiles (ML-DSA, etc.)
- `0x0300...`: Lux consensus precompiles (Quasar)

## Backwards Compatibility

This LP introduces new precompiles with no backwards compatibility issues. Existing contracts continue to function. New contracts can opt into quantum-safe consensus verification.

### Migration Path

**Phase 1**: Deploy Quasar precompiles, validators generate Ringtail keys
**Phase 2**: High-value transactions use hybrid verification
**Phase 3**: Q-Chain stores Ringtail proofs for all finalized blocks
**Phase 4**: Optional: Require Ringtail for cross-chain messages

## Test Cases

### Test 1: BLS Verification

```solidity
function testBLSVerification() public {
    bytes memory pubKey = hex"..."; // 48 bytes
    bytes32 msgHash = keccak256("test message");
    bytes memory sig = hex"..."; // 96 bytes

    bool valid = QuasarLib.verifyBLS(pubKey, msgHash, sig);
    assertTrue(valid);
}
```

**Expected Gas:** 5,000

### Test 2: Compressed Witness

```solidity
function testCompressedWitness() public {
    bytes16 commitment = bytes16(0);
    bytes16 proof = bytes16(0);
    bytes8 metadata = bytes8(0);
    uint32 validatorBits = 0xFFFFFC00; // 22 validators

    (bool success,) = COMPRESSED_VERIFY.staticcall(
        abi.encodePacked(commitment, proof, metadata, validatorBits)
    );
    assertTrue(success);
}
```

**Expected Gas:** 1,000

### Test 3: Hybrid Verification

```solidity
function testHybridVerification() public {
    // Both BLS and Ringtail must pass
    bytes memory input = abi.encodePacked(
        blsSignature,      // 96 bytes
        uint16(ringtailSig.length),
        ringtailSig,
        messageHash,       // 32 bytes
        blsPublicKey,      // 48 bytes
        ringtailPublicKey
    );

    (bool success, bytes memory result) = HYBRID_VERIFY.staticcall(input);
    assertTrue(success);
    assertEq(result[0], 0x01);
}
```

**Expected Gas:** 10,000

### Test 4: Threshold Check

```solidity
function testValidatorThreshold() public {
    // 21 validators (below threshold)
    uint32 belowThreshold = 0x001FFFFF; // 21 bits set
    assertFalse(QuasarLib.isThresholdMet(belowThreshold));

    // 22 validators (at threshold)
    uint32 atThreshold = 0x003FFFFF; // 22 bits set
    assertTrue(QuasarLib.isThresholdMet(atThreshold));
}
```

### Test 5: Invalid Signature Rejection

```solidity
function testInvalidSignatureRejected() public {
    bytes memory invalidSig = new bytes(96);
    bool valid = QuasarLib.verifyBLS(validPubKey, msgHash, invalidSig);
    assertFalse(valid);
}
```

## Reference Implementation

**Location:** `/Users/z/work/lux/precompiles/quasar/`

**Key Files:**
- `contract.go` (357 lines): Core precompile implementations
- `IQuasar.sol` (340 lines): Solidity interfaces and library

**Cryptography Dependencies:**
- `github.com/luxfi/crypto/bls`: BLS12-381 operations
- `github.com/luxfi/crypto/mldsa`: ML-DSA (Ringtail) signatures

**Node Integration:**
- `github.com/luxfi/node/vms/quantumvm/`: Q-Chain virtual machine
- `github.com/luxfi/node/consensus/quasar/`: Quasar consensus engine

## Security Considerations

### Post-Quantum Security

Ringtail signatures provide security against quantum computers:
- Based on Module-LWE lattice hardness
- NIST FIPS 204 compliant (ML-DSA)
- 128-bit post-quantum security (Level 3)

BLS signatures remain classical-only but provide:
- Efficient aggregation (constant-size proofs)
- Fast verification for normal operations
- Defense-in-depth when combined with Ringtail

### Threshold Security

The 22/32 (2/3) threshold ensures:
- Byzantine fault tolerance: f < n/3 malicious validators
- No single point of failure
- Deterministic finality once threshold reached

### Validator Key Management

**Requirements:**
1. BLS and Ringtail keys stored separately
2. HSM recommended for high-value validators
3. Key rotation policy every 90 days
4. Multi-party computation for key generation

### Replay Protection

Each block hash is unique, preventing signature replay. Q-Chain records include:
- Chain ID (prevents cross-chain replay)
- Block height (prevents same-chain replay)
- Timestamp (enables expiration policies)

### Compressed Witness Attacks

Compressed witnesses rely on validator bitfields. Attacks mitigated by:
- Validator set anchored to P-Chain
- Bitfield positions verified against registry
- Invalid positions cause verification failure

## Economic Impact

### Gas Cost Comparison

| Operation | Quasar Gas | Alternative | Savings |
|-----------|-----------|-------------|---------|
| BLS Verify | 5,000 | On-chain pairing: 200K | 97.5% |
| Compressed Check | 1,000 | Full sig verify: 10K+ | 90% |
| Hybrid Verify | 10,000 | Separate calls: 13K | 23% |

### LX DEX Impact

1ms finality enables:
- HFT-competitive trading
- Atomic cross-chain swaps
- Real-time settlement

**Revenue Impact:**
- 434M orders/sec throughput
- $0.001 per trade average
- ~$434K/sec theoretical max revenue

## Open Questions

1. **Should CompressedVerify support >32 validators?**
   - Current: 32 validators max (4-byte bitfield)
   - Alternative: Variable-length bitfield

2. **Should we cache BLS aggregate verification results?**
   - Pro: Reduces gas for repeated checks
   - Con: Adds state, complexity

3. **Integration with ERC-4337 account abstraction?**
   - Quantum-safe user operations
   - Ringtail-based bundler signatures

4. **Q-Chain fee model for finality attestations?**
   - Currently: No direct fees
   - Option: Small LUX fee per attestation

## References

- **NIST FIPS 204**: https://csrc.nist.gov/pubs/fips/204/final (ML-DSA)
- **BLS12-381**: https://hackmd.io/@benjaminion/bls12-381
- **LP-4**: Quantum-Resistant Cryptography Integration
- **LP-2311**: ML-DSA Signature Verification Precompile
- **LP-700**: Quasar Consensus Protocol Specification
- **Implementation**: `/Users/z/work/lux/precompiles/quasar/`

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
