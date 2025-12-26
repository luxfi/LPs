---
lp: 7324
title: Ringtail Threshold Signature Precompile
description: Native precompile for lattice-based (LWE) post-quantum threshold signatures
author: Lux Core Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Implemented
type: Standards Track
category: Core
created: 2025-11-13
requires: 4, 3500
activation:
  flag: lp324-ringtail-precompile
  hfName: "Quantum"
  activationHeight: "0"
tags: [pqc, threshold-crypto, precompile]
order: 324
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

```solidity
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

```solidity
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
```solidity

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

```markdown
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
```solidity

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
```solidity

**Expected Output:** `0x...0001` (valid)
**Expected Gas:** 150,000 + (3 × 10,000) = 180,000 gas

### Test Vector 2: Insufficient Signers (1-of-3)

**Input:**
```
threshold: 2
totalParties: 3
messageHash: <same as above>
signature: <Ringtail signature from only 1 party>
```solidity

**Expected Output:** `0x...0000` (invalid - threshold not met)

### Test Vector 3: Invalid Signature Share

**Input:**
```
threshold: 2
totalParties: 3
messageHash: <valid hash>
signature: <Ringtail signature with 1 corrupted share>
```solidity

**Expected Output:** `0x...0000` (invalid - share verification failed)

### Test Vector 4: Large Threshold (67-of-100)

**Input:**
```
threshold: 67
totalParties: 100
messageHash: <valid hash>
signature: <Ringtail signature from 67 parties>
```solidity

**Expected Output:** `0x...0001` (valid)
**Expected Gas:** 150,000 + (100 × 10,000) = 1,150,000 gas

## Reference Implementation

**Implementation Status**: ✅ COMPLETE (Full Production Stack)

### Full Implementation Stack

The Ringtail precompile is implemented across multiple layers, providing post-quantum threshold signatures:

```
┌─────────────────────────────────────────────────────────────────┐
│                    Solidity Interface                           │
│  IRingtail.sol → RingtailLib.sol → RingtailVerifier.sol        │
└─────────────────────────┬───────────────────────────────────────┘
                          │ staticcall
┌─────────────────────────▼───────────────────────────────────────┐
│              EVM Precompile Layer (Go)                          │
│  precompiles/ringtail/contract.go → Run() → Verify()           │
└─────────────────────────┬───────────────────────────────────────┘
                          │ calls
┌─────────────────────────▼───────────────────────────────────────┐
│           Ringtail Protocol Layer (Go)                          │
│  ringtail/ → Two-round threshold signature protocol            │
│  + Distributed Key Generation (DKG)                             │
│  + Shamir Secret Sharing over Ring-LWE                          │
└─────────────────────────┬───────────────────────────────────────┘
                          │ uses
┌─────────────────────────▼───────────────────────────────────────┐
│          Lattice Cryptography Primitives                        │
│  lattice/ → Ring-LWE, Ring-SIS, NTT operations                 │
│  + Number Theoretic Transform (NTT)                             │
│  + Polynomial arithmetic over cyclotomic rings                  │
└─────────────────────────────────────────────────────────────────┘
```solidity

#### 1. EVM Precompile Layer (`~/work/lux/precompiles/ringtail/`)

| File | Lines | Purpose |
|------|-------|---------|
| `contract.go` | 257 | Core precompile at `0x020000...000B`, signature verification |
| `module.go` | 50 | Precompile registration with EVM |
| `contract_test.go` | 236 | Comprehensive test suite |
| `IRingtail.sol` | 288 | Solidity interface and library |
| `README.md` | 501 | Complete documentation |

**Precompile Address**: `0x020000000000000000000000000000000000000B`

#### 2. Ringtail Protocol Layer (`~/work/lux/ringtail/`)

| Directory/File | Purpose |
|----------------|---------|
| `sign/sign.go` | Core two-round signing protocol |
| `sign/verify.go` | Non-destructive signature verification |
| `sign/aggregate.go` | Threshold signature aggregation |
| `sign/types.go` | Signature and public key types |
| `keygen/keygen.go` | Distributed key generation (no trusted dealer) |
| `keygen/round1.go` | Round 1: Commitment generation |
| `keygen/round2.go` | Round 2: Share distribution |
| `keygen/verify.go` | Share verification |
| `share/shamir.go` | Shamir secret sharing over Ring-LWE |
| `share/lagrange.go` | Lagrange interpolation for lattices |
| `network/` | Party communication stack |

**Core Protocol Functions**:
```go
// Distributed Key Generation (no trusted dealer)
func Keygen(participants []party.ID, threshold int) (*GroupKey, map[party.ID]*Share, error)

// Round 1: Generate and broadcast commitment
func SignRound1(share *Share, message []byte) (*Round1Output, error)

// Round 2: Generate signature share from all Round 1 outputs
func SignRound2(share *Share, round1Outputs []*Round1Output) (*SignatureShare, error)

// Aggregate threshold signature shares
func Aggregate(shares []*SignatureShare, threshold int) (*Signature, error)

// Verify threshold signature (non-destructive)
func Verify(groupKey *GroupKey, message []byte, sig *Signature) bool
```

#### 3. Lattice Cryptography Primitives (`~/work/lux/lattice/`)

| Directory/File | Purpose |
|----------------|---------|
| `ring/ring.go` | Cyclotomic ring R_q = Z_q[X]/(X^n + 1) |
| `ring/ntt.go` | Number Theoretic Transform (fast polynomial multiplication) |
| `ring/intt.go` | Inverse NTT |
| `lwe/sample.go` | Ring-LWE error sampling (discrete Gaussian) |
| `lwe/keygen.go` | Ring-LWE key generation |
| `lwe/encrypt.go` | Ring-LWE encryption |
| `lwe/decrypt.go` | Ring-LWE decryption |
| `sis/hash.go` | Ring-SIS collision-resistant hash (for commitments) |
| `params/` | Security parameter configurations |

**Ring-LWE Parameters** (128-bit post-quantum security):
```go
const (
    N      = 1024     // Polynomial degree (power of 2)
    Q      = 12289    // Modulus (prime, NTT-friendly)
    Sigma  = 3.192    // Gaussian distribution width
    Beta   = 32       // Bound for small coefficients
)
```go

#### 4. Quasar Consensus Integration (`~/work/lux/node/consensus/protocol/quasar/`)

| File | Purpose |
|------|---------|
| `epoch.go` | EpochManager for Ringtail key rotation |
| `ringtail.go` | Threshold Ringtail signing for finality certificates |
| `hybrid_consensus.go` | Dual-certificate finality (BLS + Ringtail) |
| `epoch_test.go` | 8 comprehensive epoch management tests |

**Epoch-Based Key Management**:
```go
// EpochManager manages Ringtail key epochs for validator set
type EpochManager struct {
    currentEpoch      uint64
    currentKeys       *EpochKeys
    lastKeygenTime    time.Time
    epochHistory      map[uint64]*EpochKeys  // Cross-epoch verification
    historyLimit      int                     // Default: 3 epochs
    currentValidators []string
    threshold         int
}

// Key rotation triggers
const (
    MinEpochDuration = 1 * time.Hour   // Rate limiting
    MaxEpochDuration = 24 * time.Hour  // Forced rotation
    HistoryLimit     = 3               // Epochs preserved
)

// Verify signature from any epoch in history
func (em *EpochManager) VerifySignatureForEpoch(
    message string, sig *Signature, epoch uint64) bool
```

### Test Results

All tests passing across the full stack:

**Precompile Tests** (`precompiles/ringtail/contract_test.go`):
- Valid threshold signature verification
- Insufficient threshold rejection
- Invalid share detection
- Large threshold (10-of-15) support
- Gas cost verification
- Edge cases and error handling

**Protocol Tests** (`ringtail/sign/sign_test.go`):
- Two-round protocol correctness
- Threshold aggregation (t-of-n for various t, n)
- Signature non-malleability
- Cross-party verification

**Epoch Tests** (`consensus/protocol/quasar/epoch_test.go`):
- Epoch creation and rotation
- Cross-epoch verification
- Rate limiting enforcement
- History pruning

### Cryptographic Details

**Protocol**: Two-Round Threshold Signatures from LWE (ePrint 2024/1113)

**Security**:
- 128-bit post-quantum security level
- Based on Ring Learning With Errors (Ring-LWE)
- Commitment scheme uses Ring-SIS
- Provable reduction to worst-case lattice problems

**Signature Size**: ~1.2 KB (varies with parameters)

**Parameters**: Configurable threshold (t) and total parties (n)

### Repository Locations

| Component | Repository | Version |
|-----------|------------|---------|
| Precompile | [`github.com/luxfi/precompiles/ringtail/`](https://github.com/luxfi/precompiles/tree/main/ringtail) | v0.1.7 |
| Ringtail Library | [`github.com/luxfi/ringtail/`](https://github.com/luxfi/ringtail) | v0.1.2 |
| Lattice Primitives | [`github.com/luxfi/lattice/`](https://github.com/luxfi/lattice) | v6.1.2 |
| Epoch Management | [`github.com/luxfi/node/consensus/protocol/quasar/`](https://github.com/luxfi/node/tree/main/consensus/protocol/quasar) | - |
| Solidity Interface | [`github.com/luxfi/standard/contracts/crypto/precompiles/IRingtailThreshold.sol`](https://github.com/luxfi/standard/tree/main/contracts/crypto/precompiles) | v1.1.0 |

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
```solidity
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

### Epoch-Based Key Rotation (LP-1181 Integration)

Ringtail keys are managed via epoch-based rotation in Quasar consensus:

| Constant | Value | Purpose |
|----------|-------|---------|
| `MinEpochDuration` | 1 hour | Minimum time between key rotations (rate limiting) |
| `MaxEpochDuration` | 24 hours | Maximum time keys can be used (forced rotation) |
| `HistoryLimit` | 3 epochs | Number of historical epochs preserved for verification |

**Key Rotation Triggers:**
1. **Validator Set Change**: When validators are added/removed (rate-limited to 1/hour)
2. **Forced Expiration**: After 24 hours even if validator set unchanged
3. **Manual Rotation**: Via `RotateEpoch(validators, force=true)`

**Epoch Counter Limits:**
- Uses `uint64` supporting 18 quintillion values
- At 1 epoch/hour: **2.1 trillion years** before overflow
- Effectively unlimited for all practical purposes

**Cross-Epoch Verification:**
Signatures from previous epochs remain verifiable until history is pruned (default: last 3 epochs).

```go
// EpochManager manages Ringtail key epochs for the validator set.
type EpochManager struct {
    currentEpoch      uint64
    currentKeys       *EpochKeys
    lastKeygenTime    time.Time
    epochHistory      map[uint64]*EpochKeys  // Cross-epoch verification
    historyLimit      int
    currentValidators []string
    threshold         int
}

func (em *EpochManager) VerifySignatureForEpoch(message string, sig *Signature, epoch uint64) bool {
    keys, exists := em.epochHistory[epoch]
    if !exists || keys.GroupKey == nil || sig == nil {
        return false
    }
    return ringtailThreshold.Verify(keys.GroupKey, message, sig)
}
```solidity

**Implementation Files:**
- `consensus/protocol/quasar/epoch.go` - EpochManager
- `consensus/protocol/quasar/epoch_test.go` - Tests (8 tests)
- `ringtail/sign/sign.go` - Non-destructive Verify function

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

### Secure Implementation Guidelines

#### Cryptographic Requirements

**Ring-LWE Security Parameters** (128-bit post-quantum):
```go
// ~/work/lux/lattice/params/params.go
// Parameters MUST satisfy:
// 1. n = power of 2 (enables fast NTT)
// 2. q = NTT-friendly prime (q ≡ 1 mod 2n)
// 3. σ (Gaussian width) balances correctness vs security
// 4. Security level verified via lattice estimator

const (
    N     = 1024       // Ring dimension (power of 2)
    Q     = 12289      // Modulus (prime, q ≡ 1 mod 2048)
    Sigma = 3.192      // Discrete Gaussian parameter
    Beta  = 32         // Bound for small elements
    
    // Derived security: 128-bit post-quantum
    // Classical: ~280 bits
    // Quantum (Grover): ~140 bits
)
```solidity

**Discrete Gaussian Sampling** (CRITICAL for security):
```go
// ~/work/lux/lattice/lwe/sample.go
// MUST use constant-time rejection sampling
// NEVER use approximations (e.g., binomial) for threshold crypto

func SampleGaussian(sigma float64, prng io.Reader) int64 {
    // Uses BLAKE3-based PRNG for determinism
    // Constant-time comparison to prevent timing attacks
    // Table-based lookup for efficiency + security
    for {
        candidate := sampleFromTable(prng)
        if constantTimeCompare(candidate, sigma) {
            return candidate
        }
    }
}
```

**NTT (Number Theoretic Transform)** for fast polynomial multiplication:
```go
// ~/work/lux/lattice/ring/ntt.go
// Forward NTT: Convert polynomial to NTT domain
// Inverse NTT: Convert back to coefficient domain
// All operations in NTT domain for O(n log n) multiplication

func ForwardNTT(coeffs []int64, n int, q int64, roots []int64) []int64 {
    // Cooley-Tukey butterfly
    // Constant-time implementation
    // Pre-computed twiddle factors
}

func InverseNTT(values []int64, n int, q int64, invRoots []int64) []int64 {
    // Gentleman-Sande butterfly
    // Multiply by n^(-1) mod q
}
```go

#### Side-Channel Resistance

**Constant-Time Polynomial Operations**:
```go
// ~/work/lux/lattice/ring/ring.go
// ALL operations MUST be constant-time:
// - Addition: Modular add without branches
// - Multiplication: NTT-based, no data-dependent branches
// - Reduction: Barrett or Montgomery reduction

func PolyMul(a, b *Poly) *Poly {
    // 1. Forward NTT (constant-time)
    aNTT := ForwardNTT(a.Coeffs)
    bNTT := ForwardNTT(b.Coeffs)
    
    // 2. Pointwise multiplication (constant-time)
    cNTT := make([]int64, len(aNTT))
    for i := range cNTT {
        cNTT[i] = barrettReduce(aNTT[i] * bNTT[i])
    }
    
    // 3. Inverse NTT (constant-time)
    return &Poly{Coeffs: InverseNTT(cNTT)}
}
```

**Memory Protection**:
```go
// Secret clearing after use
defer func() {
    for i := range secretKey.Coeffs {
        secretKey.Coeffs[i] = 0
    }
    for i := range share.Secret {
        share.Secret[i] = 0
    }
}()
```solidity

### Integration Points Across Lux Infrastructure

#### 1. EVM Precompile (`~/work/lux/precompiles/ringtail/`)

| Component | File | Security Role |
|-----------|------|---------------|
| Signature Verification | `contract.go:Run()` | Validates Ring-LWE threshold signatures |
| Gas Metering | `contract.go:RequiredGas()` | Prevents DoS via gas limits |
| Input Validation | `contract.go:parseInput()` | Validates threshold parameters |

```go
// contract.go - Core verification flow
func (c *RingtailPrecompile) Run(input []byte) ([]byte, error) {
    // 1. Parse threshold parameters
    threshold, totalParties, msgHash, sig := parseInput(input)
    
    // 2. Validate parameters
    if threshold == 0 || threshold > totalParties {
        return falseBytes, nil
    }
    
    // 3. Verify Ring-LWE signature
    valid := ringtail.Verify(groupKey, msgHash, sig)
    
    return boolToBytes(valid), nil
}
```

#### 2. Ringtail Protocol (`~/work/lux/ringtail/`)

**Distributed Key Generation** (no trusted dealer):
```go
// keygen/keygen.go
// Security: Verifiable secret sharing over Ring-LWE
// - Each party generates random polynomial
// - Commitments use Ring-SIS hash
// - Shares verified via lattice math

func Keygen(parties []party.ID, threshold int) (*GroupKey, map[party.ID]*Share, error) {
    // Round 1: Generate commitments
    for _, p := range parties {
        p.commitment = ringHashCommit(p.polynomial)
    }
    
    // Round 2: Distribute shares securely
    for i, p := range parties {
        for j, q := range parties {
            shares[j] = evalPolynomial(p.polynomial, j)
        }
    }
    
    // Derive group public key
    groupKey := aggregateCommitments(commitments)
    return groupKey, shares, nil
}
```go

**Two-Round Signing Protocol**:
```go
// sign/sign.go
// Round 1: Commitment generation
func SignRound1(share *Share, message []byte) (*Round1Output, error) {
    // Generate ephemeral lattice element
    y := sampleGaussian(Sigma)
    w := A * y  // Public commitment
    
    return &Round1Output{Commitment: ringHash(w)}, nil
}

// Round 2: Response generation
func SignRound2(share *Share, r1Outputs []*Round1Output) (*SignatureShare, error) {
    // Aggregate commitments
    aggregatedW := aggregate(r1Outputs)
    
    // Compute challenge
    c := hashChallenge(aggregatedW, message)
    
    // Compute response: z = y + c*s (with rejection sampling)
    z := add(y, mul(c, share.Secret))
    
    return &SignatureShare{Response: z}, nil
}
```

#### 3. Quasar Consensus Integration (`~/work/lux/node/consensus/protocol/quasar/`)

**Epoch-Based Key Management**:
```go
// epoch.go - Ringtail key epochs for validator set
type EpochManager struct {
    currentEpoch      uint64
    currentKeys       *EpochKeys
    lastKeygenTime    time.Time
    epochHistory      map[uint64]*EpochKeys  // Cross-epoch verification
    historyLimit      int                     // Default: 3 epochs
}

// Key rotation security
func (em *EpochManager) RotateEpoch(validators []string, force bool) error {
    // Rate limiting: Minimum 1 hour between rotations
    if !force && time.Since(em.lastKeygenTime) < MinEpochDuration {
        return ErrTooSoon
    }
    
    // Forced rotation: Maximum 24 hours key lifetime
    if time.Since(em.lastKeygenTime) > MaxEpochDuration {
        force = true
    }
    
    // Generate new threshold keys
    groupKey, shares := ringtailDKG(validators, threshold)
    
    // Prune old epochs
    em.pruneHistory()
    
    return nil
}
```go

**Dual-Certificate Finality** (BLS + Ringtail):
```go
// hybrid_consensus.go
// Both certificates MUST validate for true finality

func ValidateBlock(block *Block) bool {
    // 1. Verify BLS aggregate signature (classical finality)
    if !bls.Verify(block.BLSSignature) {
        return false
    }
    
    // 2. Verify Ringtail threshold signature (post-quantum finality)
    if !ringtail.Verify(block.RingtailSignature) {
        return false
    }
    
    // Both signatures valid = quantum-safe finality
    return true
}
```

#### 4. Smart Contract Integration

**Secure Usage Pattern**:
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {RingtailLib} from "./RingtailLib.sol";

contract QuantumSafeVault is RingtailVerifier {
    uint32 public threshold;
    uint32 public totalOwners;
    mapping(bytes32 => bool) public usedNonces;
    
    // ✅ SECURE: Verify before state changes with replay protection
    function withdraw(
        address to,
        uint256 amount,
        uint256 nonce,
        bytes calldata sig
    ) external nonReentrant {
        bytes32 messageHash = keccak256(abi.encode(
            "RingtailVault-v1",
            block.chainid,
            address(this),
            to,
            amount,
            nonce
        ));
        
        // 1. Replay protection
        require(!usedNonces[messageHash], "Nonce already used");
        usedNonces[messageHash] = true;
        
        // 2. Verify post-quantum threshold signature
        RingtailLib.verifyOrRevert(
            threshold,
            totalOwners,
            messageHash,
            sig
        );
        
        // 3. Execute transfer
        (bool success,) = to.call{value: amount}("");
        require(success, "Transfer failed");
    }
}
```solidity

### Network Usage Map

| Component | Location | Ringtail Usage |
|-----------|----------|----------------|
| Precompile | `precompiles/ringtail/` | On-chain verification |
| Ringtail Library | `ringtail/` | Threshold signing protocol |
| Lattice Primitives | `lattice/` | Ring-LWE, Ring-SIS, NTT |
| Epoch Management | `consensus/protocol/quasar/epoch.go` | Validator key rotation |
| Quasar Finality | `consensus/protocol/quasar/hybrid_consensus.go` | Dual-certificate finality |
| C-Chain | `node/vms/coreth/` | Smart contract verification |
| Bridge Custody | `node/bridges/` | Post-quantum bridge security |
| Warp Messaging | `node/vms/platformvm/warp/` | Cross-subnet PQ signatures |

### Quantum Threat Timeline

| Year | Threat Level | Recommended Action |
|------|--------------|-------------------|
| 2024-2030 | Low | Classical schemes acceptable for short-term |
| 2030-2035 | Medium | Hybrid classical + PQ recommended |
| 2035+ | High | Ringtail required for long-term security |

**Migration Strategy**:
1. **Now**: Deploy hybrid (BLS + Ringtail) for new systems
2. **2025-2027**: Transition existing systems to hybrid
3. **2030+**: Phase out classical-only signatures

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

2. **~~Distributed key refresh?~~** ✅ IMPLEMENTED (LP-1181)
   - Epoch-based key rotation implemented via `EpochManager`
   - Rate-limited to 1 rotation per hour minimum
   - Forced rotation after 24 hours maximum
   - Cross-epoch verification preserves last 3 epochs
   - Forward security achieved via regular rotation

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

- **Ringtail Paper**: "Two-Round Threshold Signatures from LWE" ([ePrint 2024/1113](https://eprint.iacr.org/2024/1113))
- **Ring-LWE**: Lyubashevsky et al., "On Ideal Lattices and Learning with Errors Over Rings"
- **Precompile Implementation**: [`github.com/luxfi/precompiles/ringtail`](https://github.com/luxfi/precompiles/tree/main/ringtail) (v0.1.7)
- **Ringtail Protocol**: [`github.com/luxfi/ringtail`](https://github.com/luxfi/ringtail) (v0.1.2)
- **Lattice Primitives**: [`github.com/luxfi/lattice`](https://github.com/luxfi/lattice) (v6.1.2)
- **Solidity Interface**: [`github.com/luxfi/standard/contracts/crypto/precompiles/IRingtailThreshold.sol`](https://github.com/luxfi/standard/blob/main/contracts/crypto/precompiles/IRingtailThreshold.sol)
- **LP-110**: Quasar Consensus with Dual-Certificate Finality
- **LP-311**: ML-DSA Precompile (non-threshold PQ signature)
- **LP-7321**: FROST Precompile (classical threshold for comparison)
- **LP-7322**: CGGMP21 Precompile (classical ECDSA threshold)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
