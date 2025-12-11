---
lp: 7324
title: Ringtail Threshold Signature Precompile
description: Native precompile for lattice-based (LWE) post-quantum threshold signatures
author: Lux Core Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Standards Track
category: Core
created: 2025-11-13
requires: 4, 311
activation:
  flag: lp324-ringtail-precompile
  hfName: "Quantum"
  activationHeight: "0"
tags: [pqc, threshold-crypto, precompile]
---

## Abstract

This LP specifies a precompiled contract for verifying Ringtail threshold signatures at address `0x020000000000000000000000000000000000000B`. Ringtail is a lattice-based (Ring-LWE) two-round threshold signature scheme providing post-quantum security for multi-party signing scenarios. The precompile enables quantum-safe threshold wallets, distributed validator signing, and multi-party custody without requiring a trusted dealer.

## Motivation

### The Threshold Signature Problem

Multi-party signatures require multiple parties to collectively authorize operations:

1. **Distributed Trust**: No single party holds the full signing key
2. **Threshold Policies**: Require t-of-n parties to sign (e.g., 3-of-5)
3. **Post-Quantum Security**: Classical schemes (ECDSA, Schnorr) vulnerable to quantum attacks
4. **No Trusted Dealer**: Key generation must be distributed

### Why Ringtail?

Ringtail provides unique properties for quantum-safe threshold signatures:

1. **Post-Quantum**: Based on Ring Learning With Errors (Ring-LWE) lattice problem
2. **Two-Round Protocol**: Efficient signing with only two communication rounds
3. **Threshold Capable**: Native support for t-of-n signing policies
4. **Distributed Key Generation**: No trusted dealer required
5. **Forward Secure**: Compromised shares don't reveal past signatures

### Use Cases

- **Quasar Consensus**: Quantum-safe validator threshold signatures
- **Threshold Wallets**: Multi-party custody with PQ security
- **DAO Governance**: Quantum-safe council signing
- **Cross-Chain Bridges**: Post-quantum threshold bridge signatures
- **Enterprise Custody**: Institutional multi-sig with quantum protection

## Specification

### Precompile Address

```
0x020000000000000000000000000000000000000B
```

### Input Format

The precompile accepts a packed binary input:

| Offset | Length | Field | Description |
|--------|--------|-------|-------------|
| 0      | 4      | `threshold` | Required number of signers (big-endian uint32) |
| 4      | 4      | `totalParties` | Total number of participants (big-endian uint32) |
| 8      | 32     | `messageHash` | Hash of message being verified |
| 40     | variable | `signature` | Ringtail threshold signature |

**Minimum size**: 40 bytes + signature size (~1-2KB depending on parameters)

### Signature Format

The Ringtail signature contains:
- **Round 1 Commitments**: Hash commitments from all signers
- **Round 2 Responses**: Lattice-based signature shares
- **Aggregated Signature**: Combined threshold signature
- **Participant Bitmap**: Which parties participated (bitset)

### Output Format

32-byte word:
- `0x0000000000000000000000000000000000000000000000000000000000000001` - signature valid
- `0x0000000000000000000000000000000000000000000000000000000000000000` - signature invalid

### Gas Cost

```
gas = BASE_COST + (totalParties * PER_PARTY_COST)

Where:
  BASE_COST = 150,000 gas
  PER_PARTY_COST = 10,000 gas per participant
```

**Examples:**
- 3-of-5 threshold: 150,000 + (5 × 10,000) = 200,000 gas
- 10-of-15 threshold: 150,000 + (15 × 10,000) = 300,000 gas
- 67-of-100 threshold: 150,000 + (100 × 10,000) = 1,150,000 gas

### Solidity Interface

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IRingtail {
    /**
     * @dev Verifies a Ringtail threshold signature
     * @param threshold Required number of signers (t)
     * @param totalParties Total number of participants (n)
     * @param messageHash Hash of the signed message
     * @param signature The Ringtail threshold signature
     * @return valid True if signature is valid with threshold met
     */
    function verifyThreshold(
        uint32 threshold,
        uint32 totalParties,
        bytes32 messageHash,
        bytes calldata signature
    ) external view returns (bool valid);
}

library RingtailLib {
    IRingtail constant RINGTAIL = IRingtail(0x020000000000000000000000000000000000000B);
    
    /**
     * @dev Verify threshold signature or revert
     */
    function verifyOrRevert(
        uint32 threshold,
        uint32 totalParties,
        bytes32 messageHash,
        bytes calldata signature
    ) internal view {
        require(
            RINGTAIL.verifyThreshold(threshold, totalParties, messageHash, signature),
            "Ringtail: invalid threshold signature"
        );
    }
    
    /**
     * @dev Calculate gas cost for verification
     */
    function estimateGas(uint32 totalParties) internal pure returns (uint256) {
        return 150_000 + (uint256(totalParties) * 10_000);
    }
}

/**
 * @dev Base contract for Ringtail threshold verification
 */
abstract contract RingtailVerifier {
    IRingtail internal constant ringtail = IRingtail(0x020000000000000000000000000000000000000B);
    
    modifier validRingtailSignature(
        uint32 threshold,
        uint32 totalParties,
        bytes32 messageHash,
        bytes calldata signature
    ) {
        require(
            ringtail.verifyThreshold(threshold, totalParties, messageHash, signature),
            "Invalid Ringtail threshold signature"
        );
        _;
    }
}
```

### Example Usage

```solidity
contract QuantumSafeDAO is RingtailVerifier {
    struct Council {
        uint32 threshold;        // e.g., 3
        uint32 totalMembers;     // e.g., 5
        bool active;
    }
    
    Council public council;
    
    function executeProposal(
        bytes32 proposalHash,
        bytes calldata councilSignature
    ) external validRingtailSignature(
        council.threshold,
        council.totalMembers,
        proposalHash,
        councilSignature
    ) {
        // Execute the proposal
        // Signature verified by modifier
    }
}

contract ThresholdWallet is RingtailVerifier {
    uint32 public threshold = 2;
    uint32 public totalOwners = 3;
    
    function withdraw(
        address to,
        uint256 amount,
        uint256 nonce,
        bytes calldata thresholdSig
    ) external {
        bytes32 txHash = keccak256(abi.encode(to, amount, nonce));
        
        RingtailLib.verifyOrRevert(
            threshold,
            totalOwners,
            txHash,
            thresholdSig
        );
        
        // Execute withdrawal
        payable(to).transfer(amount);
    }
}
```

## Rationale

### Why Ringtail Over Other Threshold Schemes?

**Comparison:**

| Scheme | Post-Quantum | Rounds | Trusted Dealer | Security Assumption |
|--------|--------------|--------|----------------|-------------------|
| **Ringtail** | ✅ Yes | 2 | ❌ No | Ring-LWE |
| FROST | ❌ No | 2 | ❌ No | Discrete Log |
| CGGMP21 | ❌ No | 5+ | ❌ No | Discrete Log |
| BLS | ❌ No | 1 | ✅ Yes | Pairing |

Ringtail is the ONLY post-quantum threshold scheme with:
- No trusted dealer requirement
- Two-round signing protocol
- Provable security reductions

### Gas Cost Justification

The gas formula accounts for:

1. **Base Lattice Operations**: 150K gas for ring-LWE verification
2. **Per-Party Overhead**: 10K gas per participant for:
   - Commitment verification
   - Share validation
   - Aggregation computation

**Comparison to FROST**:
- FROST: 50K base + 5K per signer (classical security)
- Ringtail: 150K base + 10K per party (quantum security)
- **3x cost premium** for quantum resistance is acceptable

### Two-Round Protocol Efficiency

Ringtail achieves threshold signatures in 2 rounds:

```
Round 1: Each party broadcasts commitment
Round 2: Each party broadcasts response
Result: Aggregated threshold signature
```

This is optimal - no threshold scheme can do better than 2 rounds without a trusted dealer.

### Integration with Quasar Consensus

Ringtail is used in Quasar (LP-99) for dual-certificate finality:
- **BLS Certificate**: Classical finality (fast)
- **Ringtail Certificate**: Post-quantum finality (secure)

Both must validate for true finality.

## Backwards Compatibility

This LP introduces a new precompile and has no backwards compatibility issues.

### Migration from Classical Threshold

Projects using FROST/CGGMP21 can migrate incrementally:

**Phase 1**: Dual signatures (classical + PQ)
```solidity
function verify(bytes calldata frostSig, bytes calldata ringtailSig) {
    require(verifyFROST(frostSig), "FROST failed");
    require(verifyRingtail(ringtailSig), "Ringtail failed");
}
```

**Phase 2**: Migrate keys to Ringtail-only

**Phase 3**: Deprecate classical threshold after transition period

## Test Cases

### Test Vector 1: Valid 2-of-3 Threshold

**Input:**
```
threshold: 2
totalParties: 3
messageHash: keccak256("Test message for threshold signature")
signature: <Ringtail signature from 2 of 3 parties>
```

**Expected Output:** `0x...0001` (valid)
**Expected Gas:** 150,000 + (3 × 10,000) = 180,000 gas

### Test Vector 2: Insufficient Signers (1-of-3)

**Input:**
```
threshold: 2
totalParties: 3
messageHash: <same as above>
signature: <Ringtail signature from only 1 party>
```

**Expected Output:** `0x...0000` (invalid - threshold not met)

### Test Vector 3: Invalid Signature Share

**Input:**
```
threshold: 2
totalParties: 3
messageHash: <valid hash>
signature: <Ringtail signature with 1 corrupted share>
```

**Expected Output:** `0x...0000` (invalid - share verification failed)

### Test Vector 4: Large Threshold (67-of-100)

**Input:**
```
threshold: 67
totalParties: 100
messageHash: <valid hash>
signature: <Ringtail signature from 67 parties>
```

**Expected Output:** `0x...0001` (valid)
**Expected Gas:** 150,000 + (100 × 10,000) = 1,150,000 gas

## Reference Implementation

**Implementation Status**: ✅ COMPLETE

See: `standard/src/precompiles/ringtail/`

**Key Files:**
- `contract.go` - Core precompile implementation (257 lines)
- `module.go` - Precompile registration (50 lines)
- `contract_test.go` - Comprehensive test suite (236 lines)
- `IRingtail.sol` - Solidity interface and library (288 lines)
- `README.md` - Complete documentation (501 lines)

**Cryptography:**
- External Package: `ringtail/sign`
- Protocol: Two-round threshold signature (ePrint 2024/1113)
- Security: Ring-LWE with 128-bit post-quantum security
- Parameters: Configurable threshold and total parties

**Test Results:**
All tests passing:
- Valid threshold signature verification
- Insufficient threshold rejection
- Invalid share detection
- Large threshold (10-of-15) support
- Gas cost verification
- Edge cases and error handling

## Security Considerations

### Post-Quantum Security

Ringtail's security rests on the hardness of:

1. **Ring Learning With Errors (Ring-LWE)**
   - Quantum computer cannot solve efficiently
   - Reduction to worst-case lattice problems
   - 128-bit post-quantum security level

2. **Short Integer Solution (Ring-SIS)**
   - Used for commitment scheme
   - Also believed quantum-resistant

### Threshold Security

**Safety Properties:**
- Adversary controlling < threshold parties learns NOTHING about private key
- Corrupted shares don't help forge signatures
- Honest majority assumption: < n/2 corrupted parties

**Liveness Properties:**
- Any threshold parties can produce signature
- No single point of failure
- Robust against n - threshold offline parties

### Distributed Key Generation

Ringtail supports DKG without trusted dealer:
```
1. Each party generates share locally
2. Broadcast commitments
3. Verify all commitments
4. Compute public key from commitments
```

No party ever sees the full private key.

### Side-Channel Resistance

Implementation uses:
- Constant-time lattice operations
- Blinded share generation
- Secure memory clearing after use
- No timing-dependent branches

### Quantum Attack Scenarios

| Attack Vector | Classical Security | Post-Quantum Security |
|---------------|-------------------|----------------------|
| Break one share | Safe (DL hard) | Safe (LWE hard) |
| Break threshold | Safe (DL hard) | Safe (LWE hard) |
| Break commitment | Safe (hash) | Safe (Ring-SIS) |
| Forge signature | Safe (DL hard) | Safe (LWE hard) |
| Shor's Algorithm | ❌ Breaks DL | ✅ LWE unaffected |

### Key Management

**Critical Requirements:**
1. **Shares must be stored securely** (encrypted at rest)
2. **Never combine shares** (defeats threshold property)
3. **Rotate shares periodically** (forward security)
4. **Backup shares redundantly** (liveness requirement)
5. **Use hardware security** (HSM/TEE when possible)

### Integration Security

When using Ringtail in smart contracts:
```solidity
// ✅ GOOD: Verify before state changes
function withdraw(bytes calldata sig) external {
    require(ringtail.verify(sig), "Invalid sig");
    // Safe to modify state
}

// ❌ BAD: State change before verification
function withdraw(bytes calldata sig) external {
    updateState();  // Vulnerable to reentrancy
    require(ringtail.verify(sig), "Invalid sig");
}
```

## Economic Impact

### Gas Cost Comparison

| Scheme | 3-of-5 Threshold | 10-of-15 Threshold | Security |
|--------|-----------------|-------------------|----------|
| **Ringtail** | 200,000 gas | 300,000 gas | Post-quantum |
| FROST | 75,000 gas | 125,000 gas | Classical |
| CGGMP21 | 125,000 gas | 225,000 gas | Classical |

**Trade-off**: 2-3x higher gas for quantum security

### Use Case Economics

**When Ringtail is Worth It:**
- High-value assets (> $1M) needing quantum protection
- Long-term storage (> 5 years)
- Critical infrastructure
- Regulatory compliance requiring PQ security

**When FROST/CGGMP21 is Sufficient:**
- Low-value transactions
- Short-term operations
- Performance-critical applications
- Current regulatory requirements

### Validator Economics

For Quasar consensus validators:
- Ringtail verification per block: ~200K gas
- Cost per finality: $0.01 - $0.10 (depending on gas price)
- Essential for dual-certificate finality
- No alternative for quantum-safe threshold consensus

## Open Questions

1. **Should we support different security levels?**
   - Current: 128-bit post-quantum
   - Could add: 192-bit or 256-bit variants
   - Trade-off: Higher security vs performance cost

2. **Distributed key refresh?**
   - Periodic share rotation without re-keying
   - Forward security vs complexity
   - Proactive security model

3. **Hardware acceleration?**
   - Lattice operations could be hardware-accelerated
   - FPGA/ASIC for Ring-LWE operations
   - Significant performance gains possible

4. **Cross-chain threshold?**
   - Use Ringtail for multi-chain signing
   - Coordinate threshold across different blockchains
   - Bridge security architecture

## Implementation Notes

### Integration with `ringtail`

The precompile uses the external Ringtail implementation:
```go
import "github.com/luxfi/ringtail/sign"

func verifyRingtail(threshold, totalParties uint32, msgHash []byte, sig []byte) bool {
    return sign.Verify(sig, msgHash, threshold, totalParties)
}
```

**Ringtail Package Features:**
- Two-round signing protocol
- Distributed key generation
- Shamir secret sharing
- NTT-based polynomial operations
- Network stack for party communication

### Parameter Constraints

**Validation:**
- `threshold` must be > 0 and ≤ `totalParties`
- `totalParties` must be ≥ 2 (no point in 1-of-1)
- Recommended: `threshold` ≥ `totalParties/2 + 1` (honest majority)
- Maximum: `totalParties` ≤ 1000 (practical limit)

**Security Recommendations:**
- Byzantine threshold: `threshold` > `totalParties * 2/3`
- Liveness threshold: `totalParties - threshold` < `totalParties/3`
- Optimal: 67-of-100 (67% threshold, 33% offline tolerance)

## References

- **Ringtail Paper**: "Two-Round Threshold Signatures from LWE" (ePrint 2024/1113)
- **Ring-LWE**: Lyubashevsky et al., "On Ideal Lattices and Learning with Errors Over Rings"
- **Implementation**: `github.com/luxfi/ringtail` and `standard/src/precompiles/ringtail/`
- **LP-99**: Quasar Consensus with Dual-Certificate Finality
- **LP-311**: ML-DSA Precompile (non-threshold PQ signature)
- **LP-321**: FROST Precompile (classical threshold for comparison)
- **LP-322**: CGGMP21 Precompile (classical ECDSA threshold)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
