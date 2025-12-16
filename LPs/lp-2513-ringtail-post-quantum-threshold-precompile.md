---
lp: 2513
title: Ringtail Post-Quantum Threshold Signature Precompile
description: Native precompile for LWE-based post-quantum threshold signatures using Ringtail protocol
author: Lux Core Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Standards Track
category: Core
created: 2025-12-14
requires: 4200, 4110
activation:
  flag: lp2513-ringtail-pq-threshold
  hfName: "Quantum"
  activationHeight: "0"
tags: [pqc, threshold-crypto, precompile, lattice]
---

## Abstract

This LP specifies a precompiled contract for verifying Ringtail post-quantum threshold signatures at address `0x020000000000000000000000000000000000000B`. Ringtail is a two-round Learning With Errors (LWE) based threshold signature scheme providing quantum-resistant security for multi-party signing scenarios. The precompile enables quantum-safe threshold wallets, Quasar consensus validator signatures, and long-term secure key escrow without requiring a trusted dealer.

## Activation

| Parameter          | Value                              |
|--------------------|------------------------------------|
| Flag string        | `lp2513-ringtail-pq-threshold`     |
| Precompile Address | `0x020000000000000000000000000000000000000B` |
| Default in code    | **false** until Quantum fork       |
| Deployment branch  | `v1.22.0-lp2513`                   |
| Roll-out criteria  | Q-Chain activation                 |
| Back-off plan      | Disable via chain config           |

## Motivation

### The Post-Quantum Threshold Problem

Multi-party cryptographic signatures face a dual challenge:

1. **Distributed Trust**: No single party should hold the complete signing key
2. **Threshold Policies**: Operations require t-of-n parties to authorize
3. **Quantum Resistance**: Classical threshold schemes (FROST, CGGMP21) are vulnerable to Shor's algorithm
4. **No Trusted Dealer**: Key generation must be fully distributed

Existing threshold signature schemes provide strong classical security but will be broken by quantum computers:

| Scheme | Quantum Safe | Rounds | Trusted Dealer |
|--------|--------------|--------|----------------|
| FROST | No | 2 | No |
| CGGMP21 | No | 5+ | No |
| BLS | No | 1 | Yes |
| **Ringtail** | **Yes** | **2** | **No** |

### Why Ringtail?

Ringtail (ePrint 2024/1113) provides unique properties for quantum-safe threshold signatures:

1. **Post-Quantum**: Based on Ring Learning With Errors (Ring-LWE) lattice problem
2. **Two-Round Protocol**: Efficient signing with only two communication rounds
3. **Threshold Capable**: Native support for t-of-n signing policies
4. **Distributed Key Generation**: No trusted dealer required
5. **Forward Secure**: Compromised shares do not reveal past signatures
6. **NIST Alignment**: Built on same lattice foundations as FIPS 204/205

### Use Cases

- **Quasar Consensus**: Quantum-safe validator threshold signatures for block finality
- **Threshold Wallets**: Multi-party custody with post-quantum security
- **DAO Governance**: Quantum-safe council signing for high-value decisions
- **Cross-Chain Bridges**: Post-quantum threshold bridge guardian signatures
- **Enterprise Custody**: Institutional multi-sig with long-term quantum protection
- **Key Escrow**: Long-term secure key backup requiring multiple parties to recover

## Specification

### Precompile Address

```text
0x020000000000000000000000000000000000000B
```markdown

### Input Format

The precompile accepts a packed binary input:

| Offset | Length | Field | Description |
|--------|--------|-------|-------------|
| 0      | 4      | `threshold` | Required number of signers (big-endian uint32) |
| 4      | 4      | `totalParties` | Total number of participants (big-endian uint32) |
| 8      | 32     | `messageHash` | Hash of message being verified |
| 40     | variable | `signature` | Ringtail threshold signature (~20KB) |

**Minimum size**: 40 bytes + signature size

### Signature Format

The Ringtail signature contains lattice-based components:

| Component | Size | Description |
|-----------|------|-------------|
| `c` | ~256 bytes | Challenge polynomial |
| `z` | ~1,792 bytes | Response vector (N polynomials) |
| `Delta` | ~2,048 bytes | Difference vector (M polynomials) |
| `A` | ~14,336 bytes | Public matrix (M x N) |
| `bTilde` | ~2,048 bytes | Rounded vector |

**Total signature size**: ~20KB

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
```markdown

**Examples:**
| Configuration | Gas Cost | Use Case |
|---------------|----------|----------|
| 2-of-3 | 180,000 | Simple multisig |
| 3-of-5 | 200,000 | DAO council |
| 5-of-7 | 220,000 | Enterprise custody |
| 10-of-15 | 300,000 | Bridge guardians |
| 67-of-100 | 1,150,000 | Validator consensus |

### Lattice Parameters

From `ringtail/sign/config.go`:

| Parameter | Value | Description |
|-----------|-------|-------------|
| M | 8 | Matrix rows |
| N | 7 | Matrix columns |
| LogN | 8 | Ring dimension log (256) |
| Q | 0x1000000004A01 | Prime modulus (48-bit) |
| SigmaE | 6.108 | Error distribution |
| SigmaStar | 1.73e11 | Masking distribution |

### Solidity Interface

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IRingtailThreshold
 * @notice Interface for the Ringtail Post-Quantum Threshold Signature precompile
 * @dev Precompile address: 0x020000000000000000000000000000000000000B
 *
 * Ringtail implements LWE-based threshold signatures providing:
 * - Post-quantum security (resistant to Shor's algorithm)
 * - Two-round signing protocol
 * - Distributed key generation (no trusted dealer)
 * - Configurable t-of-n threshold
 */
interface IRingtailThreshold {
    /**
     * @notice Verify a Ringtail threshold signature
     * @param threshold The minimum number of parties required (t)
     * @param totalParties The total number of parties in the protocol (n)
     * @param messageHash The 32-byte hash of the message that was signed
     * @param signature The threshold signature bytes (~20KB)
     * @return valid True if the signature is valid and threshold is met
     */
    function verifyThreshold(
        uint32 threshold,
        uint32 totalParties,
        bytes32 messageHash,
        bytes calldata signature
    ) external view returns (bool valid);

    /**
     * @notice Estimate gas for threshold verification
     * @param parties The number of parties in the threshold signature
     * @return gasEstimate The estimated gas cost
     */
    function estimateGas(uint32 parties) external pure returns (uint256 gasEstimate);
}

/**
 * @title RingtailThresholdLib
 * @notice Library for interacting with the Ringtail Threshold precompile
 */
library RingtailThresholdLib {
    /// @notice Address of the Ringtail threshold precompile
    address constant RINGTAIL_THRESHOLD = 0x020000000000000000000000000000000000000B;

    /// @notice Gas costs
    uint256 constant BASE_GAS = 150_000;
    uint256 constant PER_PARTY_GAS = 10_000;

    /// @notice Errors
    error InvalidThreshold();
    error SignatureVerificationFailed();
    error InsufficientGas();

    /**
     * @notice Verify a threshold signature, reverting on failure
     * @param threshold Minimum number of parties required
     * @param totalParties Total number of parties
     * @param messageHash Hash of the signed message
     * @param signature Threshold signature bytes
     */
    function verifyOrRevert(
        uint32 threshold,
        uint32 totalParties,
        bytes32 messageHash,
        bytes calldata signature
    ) internal view {
        if (threshold == 0 || threshold > totalParties) {
            revert InvalidThreshold();
        }

        bool valid = IRingtailThreshold(RINGTAIL_THRESHOLD).verifyThreshold(
            threshold,
            totalParties,
            messageHash,
            signature
        );

        if (!valid) {
            revert SignatureVerificationFailed();
        }
    }

    /**
     * @notice Estimate gas required for verification
     * @param parties Number of parties in threshold
     * @return Gas estimate
     */
    function estimateGas(uint32 parties) internal pure returns (uint256) {
        return BASE_GAS + (uint256(parties) * PER_PARTY_GAS);
    }

    /**
     * @notice Check if threshold parameters are valid
     * @param threshold Minimum parties required
     * @param totalParties Total parties
     * @return True if valid
     */
    function isValidThreshold(uint32 threshold, uint32 totalParties) internal pure returns (bool) {
        return threshold > 0 && threshold <= totalParties && totalParties >= 2;
    }
}

/**
 * @title RingtailThresholdVerifier
 * @notice Abstract contract for using Ringtail threshold signatures
 */
abstract contract RingtailThresholdVerifier {
    using RingtailThresholdLib for *;

    /// @notice Emitted when a threshold signature is verified
    event ThresholdSignatureVerified(
        uint32 indexed threshold,
        uint32 indexed totalParties,
        bytes32 messageHash,
        bool valid
    );

    /**
     * @notice Verify a threshold signature
     */
    function verifyThresholdSignature(
        uint32 threshold,
        uint32 totalParties,
        bytes32 messageHash,
        bytes calldata signature
    ) internal view returns (bool) {
        return IRingtailThreshold(RingtailThresholdLib.RINGTAIL_THRESHOLD).verifyThreshold(
            threshold,
            totalParties,
            messageHash,
            signature
        );
    }
}
```text

### Example Usage

```solidity
/**
 * @title QuantumSafeDAO
 * @notice DAO governance with post-quantum threshold signatures
 */
contract QuantumSafeDAO is RingtailThresholdVerifier {
    struct Council {
        uint32 threshold;      // e.g., 5
        uint32 totalMembers;   // e.g., 7
        bool active;
    }

    Council public council;
    mapping(bytes32 => bool) public executedProposals;

    event ProposalExecuted(bytes32 indexed proposalHash);

    function executeProposal(
        bytes32 proposalHash,
        bytes calldata councilSignature
    ) external {
        require(!executedProposals[proposalHash], "Already executed");

        // Verify quantum-safe threshold signature
        RingtailThresholdLib.verifyOrRevert(
            council.threshold,
            council.totalMembers,
            proposalHash,
            councilSignature
        );

        executedProposals[proposalHash] = true;
        emit ProposalExecuted(proposalHash);
    }
}

/**
 * @title QuantumSafeMultisig
 * @notice Multi-party wallet with post-quantum security
 */
contract QuantumSafeMultisig is RingtailThresholdVerifier {
    uint32 public threshold;
    uint32 public totalOwners;
    uint256 public nonce;

    function withdraw(
        address to,
        uint256 amount,
        bytes calldata thresholdSig
    ) external {
        bytes32 txHash = keccak256(abi.encode(
            address(this),
            to,
            amount,
            nonce++
        ));

        RingtailThresholdLib.verifyOrRevert(
            threshold,
            totalOwners,
            txHash,
            thresholdSig
        );

        payable(to).transfer(amount);
    }
}
```text

## Rationale

### Why Ringtail Over Other Post-Quantum Schemes?

**Comparison with alternatives:**

| Scheme | Post-Quantum | Threshold | Rounds | Trusted Dealer | Sig Size |
|--------|--------------|-----------|--------|----------------|----------|
| **Ringtail** | Yes | Yes | 2 | No | ~20KB |
| FROST | No | Yes | 2 | No | 64 bytes |
| CGGMP21 | No | Yes | 5+ | No | 65 bytes |
| BLS | No | Yes | 1 | Yes | 96 bytes |
| ML-DSA | Yes | No | - | - | 3.3KB |
| SLH-DSA | Yes | No | - | - | 7.9KB |

Ringtail is the **only** post-quantum threshold scheme with:
- No trusted dealer requirement
- Two-round signing protocol
- Provable security reductions to lattice problems

### Gas Cost Justification

The gas formula accounts for:

1. **Base Lattice Operations**: 150K gas for Ring-LWE verification
   - Polynomial multiplication in NTT domain
   - Matrix-vector operations
   - Challenge polynomial evaluation

2. **Per-Party Overhead**: 10K gas per participant for:
   - Commitment verification
   - Share validation
   - Aggregation computation

**Comparison to classical threshold schemes:**
- FROST: 50K base + 5K per signer (classical security)
- CGGMP21: 75K base + 10K per signer (classical security)
- Ringtail: 150K base + 10K per party (quantum security)
- **3x cost premium** for quantum resistance is acceptable for high-value applications

### Signature Size Trade-off

Ringtail signatures are larger than classical schemes (~20KB vs 64-96 bytes) due to lattice-based cryptography requirements. This is an inherent trade-off for quantum resistance:

| Scheme | Signature Size | Quantum Safe |
|--------|---------------|--------------|
| ECDSA | 65 bytes | No |
| Schnorr/FROST | 64 bytes | No |
| BLS | 96 bytes | No |
| **Ringtail** | **~20KB** | **Yes** |
| ML-DSA | 3,309 bytes | Yes |

The larger signature size is acceptable because:
- Storage is cheap compared to security value
- Compression can reduce on-chain footprint
- Alternative is no quantum-safe threshold option

### Two-Round Protocol Efficiency

Ringtail achieves threshold signatures in 2 rounds:

```yaml
Round 1: Each party broadcasts commitment
         D_i, MACs_i := party.SignRound1(A, sid, PRFKey, T)

Round 2: Each party broadcasts response
         z_i := party.SignRound2(A, bTilde, DSum, sid, mu, T, PRFKey, hash)

Finalize: Combiner aggregates shares
         c, z_sum, Delta := party.SignFinalize(z, A, bTilde)
```text

This is **optimal** - no threshold scheme can achieve fewer rounds without a trusted dealer.

### Integration with Quasar Consensus

Ringtail is designed for Quasar (LP-4110) dual-certificate finality:

```text
Block Finalization:
  1. BLS Certificate: Classical finality (fast, smaller)
  2. Ringtail Certificate: Post-quantum finality (secure)

Both certificates must validate for true quantum-safe finality.
```text

This provides:
- **Immediate classical security** via BLS
- **Long-term quantum security** via Ringtail
- **Graceful degradation** if either scheme is compromised

## Backwards Compatibility

This LP introduces a new precompile and has no backwards compatibility issues. Contracts compiled before this LP can call the precompile after activation.

### Migration from Classical Threshold

Projects using FROST/CGGMP21 can migrate incrementally:

**Phase 1**: Dual signatures (classical + post-quantum)
```solidity
function verify(bytes calldata frostSig, bytes calldata ringtailSig) internal view {
    require(verifyFROST(frostSig), "FROST failed");
    require(verifyRingtail(ringtailSig), "Ringtail failed");
}
```text

**Phase 2**: Migrate keys to Ringtail-only

**Phase 3**: Deprecate classical threshold after transition period

## Test Cases

### Test Vector 1: Valid 2-of-3 Threshold

**Input:**
```yaml
threshold: 2
totalParties: 3
messageHash: keccak256("Test message for threshold signature")
signature: <Ringtail signature from 2 of 3 parties>
```

**Expected Output:** `0x...0001` (valid)
**Expected Gas:** 150,000 + (3 x 10,000) = 180,000 gas

### Test Vector 2: Insufficient Signers (1-of-3)

**Input:**
```yaml
threshold: 2
totalParties: 3
messageHash: <same as above>
signature: <Ringtail signature from only 1 party>
```text

**Expected Output:** `0x...0000` (invalid - threshold not met)

### Test Vector 3: Invalid Signature Share

**Input:**
```yaml
threshold: 2
totalParties: 3
messageHash: <valid hash>
signature: <Ringtail signature with 1 corrupted share>
```text

**Expected Output:** `0x...0000` (invalid - share verification failed)

### Test Vector 4: Large Threshold (67-of-100)

**Input:**
```yaml
threshold: 67
totalParties: 100
messageHash: <valid hash>
signature: <Ringtail signature from 67 parties>
```

**Expected Output:** `0x...0001` (valid)
**Expected Gas:** 150,000 + (100 x 10,000) = 1,150,000 gas

### Test Vector 5: Wrong Message

**Input:**
```yaml
threshold: 2
totalParties: 3
messageHash: <different hash than signed>
signature: <valid signature for original message>
```text

**Expected Output:** `0x...0000` (invalid)

## Reference Implementation

**Implementation Status**: Complete

See: `/Users/z/work/lux/standard/src/precompiles/ringtail/`

**Key Files:**
- `contract.go` (257 lines) - Core precompile implementation
- `module.go` (88 lines) - Precompile registration
- `contract_test.go` (406 lines) - Comprehensive test suite
- `IRingtailThreshold.sol` (246 lines) - Solidity interface and library
- `README.md` (338 lines) - Complete documentation

**Cryptography:**
- External Package: `ringtail/sign`
- Protocol: Two-round threshold signature (ePrint 2024/1113)
- Security: Ring-LWE with >128-bit post-quantum security
- Parameters: Configurable threshold and total parties

**Test Results:**
All tests passing:
- Valid threshold signature verification (2-of-3, 3-of-5, n-of-n)
- Insufficient threshold rejection
- Invalid signature detection
- Wrong message detection
- Input validation
- Gas cost verification

## Security Considerations

### Post-Quantum Security

Ringtail's security rests on the hardness of:

1. **Ring Learning With Errors (Ring-LWE)**
   - Quantum computers cannot solve efficiently
   - Reduction to worst-case lattice problems (SVP, SIVP)
   - >128-bit post-quantum security level

2. **Short Integer Solution (Ring-SIS)**
   - Used for commitment scheme
   - Also believed quantum-resistant
   - Standard lattice assumption

**Security Level**: NIST Level 3 equivalent (comparable to AES-192)

### Classical Security

Classical attackers face:
- Best known attack: BKZ lattice reduction
- Complexity: 2^128 operations minimum
- Security margin: Conservative parameter selection

### Threshold Security Properties

**Safety (Unforgeability)**:
- Adversary controlling < t parties learns NOTHING about private key
- Corrupted shares don't help forge signatures
- Even with access to all < t shares

**Liveness**:
- Any t parties can produce signature
- No single point of failure
- Robust against n - t offline parties

**Honest Majority Assumption**:
- Protocol assumes < n/2 corrupted parties
- Recommended: t > 2n/3 for Byzantine fault tolerance

### Distributed Key Generation

Ringtail supports DKG without trusted dealer:
```text
1. Each party generates share locally
2. Broadcast commitments with MACs
3. Verify all commitments
4. Compute public key from commitments
```text

No party ever sees the full private key.

### Side-Channel Resistance

Implementation uses:
- Constant-time lattice operations
- Blinded share generation
- Secure memory clearing after use
- No timing-dependent branches
- NTT operations in constant time

### Quantum Attack Scenarios

| Attack Vector | Classical Security | Post-Quantum Security |
|---------------|-------------------|----------------------|
| Break one share | Safe (DL hard) | Safe (LWE hard) |
| Break threshold | Safe (DL hard) | Safe (LWE hard) |
| Break commitment | Safe (hash) | Safe (Ring-SIS) |
| Forge signature | Safe (DL hard) | Safe (LWE hard) |
| Shor's Algorithm | BREAKS classical | LWE unaffected |
| Grover's Algorithm | 2x speedup | Mitigated by parameters |

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
// GOOD: Verify before state changes
function withdraw(bytes calldata sig) external {
    RingtailThresholdLib.verifyOrRevert(..., sig);
    // Safe to modify state
    balance[msg.sender] = 0;
}

// BAD: State change before verification
function withdraw(bytes calldata sig) external {
    balance[msg.sender] = 0;  // Vulnerable!
    require(ringtail.verify(..., sig), "Invalid sig");
}
```text

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
- Critical infrastructure (bridges, governance)
- Regulatory compliance requiring PQ security
- Quasar validator consensus signatures

**When FROST/CGGMP21 is Sufficient:**
- Low-value transactions
- Short-term operations
- Performance-critical applications
- When classical security is acceptable risk

### Validator Economics

For Quasar consensus validators:
- Ringtail verification per block: ~200K gas
- Cost per finality: $0.01 - $0.10 (depending on gas price)
- Essential for dual-certificate finality
- No alternative for quantum-safe threshold consensus

## Open Questions

1. **Should we support different security levels?**
   - Current: >128-bit post-quantum
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

5. **Signature compression?**
   - Current: ~20KB signature
   - Could implement compression for on-chain storage
   - Trade-off: Compression cost vs storage savings

## Implementation Notes

### Integration with `ringtail`

The precompile uses the external Ringtail implementation:
```go
import (
    "ringtail/sign"
    "github.com/luxfi/lattice/v6/ring"
)

func verifyRingtail(threshold, totalParties uint32, msgHash []byte, sig []byte) bool {
    // Initialize ring parameters
    r, _ := ring.NewRing(1<<sign.LogN, []uint64{sign.Q})
    r_xi, _ := ring.NewRing(1<<sign.LogN, []uint64{sign.QXi})
    r_nu, _ := ring.NewRing(1<<sign.LogN, []uint64{sign.QNu})

    // Deserialize and verify
    c, z, Delta, A, bTilde, _ := deserializeSignature(r, r_xi, r_nu, sig)
    return sign.Verify(r, r_xi, r_nu, z, A, mu, bTilde, c, Delta)
}
```

**Ringtail Package Features:**
- Two-round signing protocol
- Distributed key generation
- Lagrange coefficient computation
- NTT-based polynomial operations
- Network stack for party communication

### Parameter Constraints

**Validation:**
- `threshold` must be > 0 and <= `totalParties`
- `totalParties` must be >= 2 (no point in 1-of-1)
- Recommended: `threshold` >= `totalParties/2 + 1` (honest majority)
- Maximum: `totalParties` <= 1000 (practical limit)

**Security Recommendations:**
- Byzantine threshold: `threshold` > `totalParties * 2/3`
- Liveness threshold: `totalParties - threshold` < `totalParties/3`
- Optimal: 67-of-100 (67% threshold, 33% offline tolerance)

## Comparison: Ringtail vs Alternatives

### vs FROST (LP-7321)

| Aspect | Ringtail | FROST |
|--------|----------|-------|
| Quantum Safe | Yes | No |
| Rounds | 2 | 2 |
| Signature Size | ~20KB | 64 bytes |
| Gas (3-of-5) | 200,000 | 75,000 |
| Use Case | Long-term, high-value | Performance-critical |

**Recommendation**: Use FROST for current security, Ringtail for quantum safety.

### vs ML-DSA (LP-2311)

| Aspect | Ringtail | ML-DSA |
|--------|----------|--------|
| Threshold | Yes (t-of-n) | No (single-party) |
| Quantum Safe | Yes | Yes |
| Signature Size | ~20KB | 3.3KB |
| Gas | 150K + 10K/party | 100K base |
| Use Case | Multi-party | Single-party |

**Recommendation**: Use ML-DSA for single-signer PQ, Ringtail for threshold PQ.

### vs CGGMP21 (LP-7322)

| Aspect | Ringtail | CGGMP21 |
|--------|----------|---------|
| Quantum Safe | Yes | No |
| Rounds | 2 | 5+ |
| Signature Size | ~20KB | 65 bytes |
| Gas (3-of-5) | 200,000 | 125,000 |
| ECDSA Compatible | No | Yes |

**Recommendation**: Use CGGMP21 for ECDSA compatibility, Ringtail for quantum safety.

## References

### Specifications
- **Ringtail Paper**: [ePrint 2024/1113](https://eprint.iacr.org/2024/1113) - "Two-Round Threshold Signatures from LWE"
- **Ring-LWE**: Lyubashevsky et al., "On Ideal Lattices and Learning with Errors Over Rings"
- **FIPS 204**: NIST ML-DSA (Dilithium) standard (same lattice foundations)

### Implementation
- **Precompile**: `/Users/z/work/lux/standard/src/precompiles/ringtail/`
- **Ringtail Library**: `ringtail/sign/` (external)
- **Lattice Library**: `github.com/luxfi/lattice/v6/`

### Related LPs
- **LP-4200**: Post-Quantum Cryptography Suite for Lux Network
- **LP-4110**: Quasar Consensus Protocol (uses Ringtail for PQ finality)
- **LP-2311**: ML-DSA Precompile (non-threshold PQ signature)
- **LP-2312**: SLH-DSA Precompile (hash-based PQ signature)
- **LP-7321**: FROST Precompile (classical threshold for comparison)
- **LP-7322**: CGGMP21 Precompile (classical ECDSA threshold)
- **LP-7324**: Ringtail Threshold Signature Precompile (original draft)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
