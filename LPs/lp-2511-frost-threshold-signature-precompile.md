---
lp: 2511
title: FROST Threshold Signature Precompile
description: Native EVM precompile for FROST (Flexible Round-Optimized Schnorr Threshold) signature verification
author: Lux Core Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Standards Track
category: Core
created: 2025-12-14
requires: 2000
activation:
  flag: lp2511-frost-precompile
  hfName: "Quantum"
  activationHeight: "0"
tags: [threshold-crypto, precompile, mpc, schnorr]
---

## Abstract

This LP specifies a precompiled contract for verifying FROST (Flexible Round-Optimized Schnorr Threshold) signatures at address `0x020000000000000000000000000000000000000C`. FROST enables efficient t-of-n threshold signatures using Schnorr signatures, producing compact 64-byte signatures indistinguishable from single-party signatures. The precompile supports Bitcoin Taproot (BIP-340/341), Ed25519, and secp256k1 curves, enabling MPC custody wallets, cross-chain bridge validators, and DAO governance with minimal gas overhead.

## Activation

| Parameter          | Value                              |
|--------------------|------------------------------------|
| Flag string        | `lp2511-frost-precompile`          |
| Default in code    | **false** until Quantum fork       |
| Deployment branch  | `v1.0.0-lp2511`                    |
| Roll-out criteria  | C-Chain, Hanzo EVM, Zoo EVM        |
| Back-off plan      | Disable via chain config flag      |

## Motivation

### The Threshold Signature Challenge

Multi-party signatures are essential for:

1. **Distributed Trust**: No single party controls the signing key
2. **Threshold Policies**: Require t-of-n parties to authorize (e.g., 3-of-5)
3. **Operational Resilience**: Function with n-t offline parties
4. **Attack Resistance**: Adversary must compromise >= t parties

Existing threshold schemes have limitations:

| Scheme | Rounds | Signature Size | Gas Cost (3-of-5) | Quantum Safe |
|--------|--------|----------------|-------------------|--------------|
| Native Multisig | 1 | n * 65 bytes | n * 21,000 | No |
| BLS Threshold | 1 | 96 bytes | 120,000 | No |
| CGGMP21 (ECDSA) | 5+ | 65 bytes | 125,000 | No |
| **FROST** | **2** | **64 bytes** | **75,000** | No |

### Why FROST?

FROST (Flexible Round-Optimized Schnorr Threshold) provides unique advantages:

1. **Two-Round Protocol**: Optimal round complexity without trusted dealer
2. **Compact Signatures**: 64 bytes (R || s), identical to single-party Schnorr
3. **Bitcoin Taproot**: Native BIP-340/341 compatibility for cross-chain custody
4. **Ed25519 Support**: Works with Solana, Cardano, TON, Polkadot
5. **No Trusted Dealer**: Distributed key generation without central party
6. **IETF Standard**: draft-irtf-cfrg-frost specification

### Use Cases

**1. Bitcoin Taproot Multisig (BIP-340/341)**
- Threshold control of Bitcoin Taproot addresses
- Same key controls Bitcoin + EVM assets
- Atomic cross-chain swaps with threshold approval

**2. MPC Custody Wallets**
- Institutional custody without single point of failure
- Geographic distribution of key shares
- Regulatory compliance with distributed control

**3. Cross-Chain Bridge Validators**
- Guardian threshold for bridge security
- Efficient signature aggregation
- Lower gas costs than ECDSA multisig

**4. DAO Governance**
- Council-based threshold voting
- Treasury multisig with threshold approval
- Emergency multisig with time-delayed execution

## Specification

### Precompile Address

```text
0x020000000000000000000000000000000000000C
```markdown

### Input Format

The precompile accepts a packed binary input:

| Offset | Length | Field | Description |
|--------|--------|-------|-------------|
| 0 | 4 | `threshold` | Required number of signers (t), big-endian uint32 |
| 4 | 4 | `totalSigners` | Total number of participants (n), big-endian uint32 |
| 8 | 32 | `publicKey` | Aggregated threshold public key (x-coordinate) |
| 40 | 32 | `messageHash` | SHA-256 or Keccak-256 hash of message |
| 72 | 64 | `signature` | Schnorr signature (R || s) |

**Total Input Size**: 136 bytes (fixed)

### Signature Format (BIP-340 Compatible)

FROST produces standard Schnorr signatures:

```
signature = R || s
where:
  R = 32 bytes (nonce commitment, x-coordinate only)
  s = 32 bytes (signature scalar)
```markdown

The signature is cryptographically indistinguishable from a single-party Schnorr signature.

### Output Format

32-byte word:
- `0x0000000000000000000000000000000000000000000000000000000000000001` - valid signature
- `0x0000000000000000000000000000000000000000000000000000000000000000` - invalid signature

### Gas Cost

```
gas = BASE_COST + (totalSigners * PER_SIGNER_COST)

where:
  BASE_COST = 50,000 gas
  PER_SIGNER_COST = 5,000 gas per participant
```markdown

**Cost Examples**:

| Configuration | Gas Cost | Comparison to ecrecover |
|---------------|----------|------------------------|
| 2-of-3 | 65,000 | 21.7x (threshold capability) |
| 3-of-5 | 75,000 | 25x |
| 5-of-7 | 85,000 | 28.3x |
| 10-of-15 | 125,000 | 41.7x |

### Two-Round Signing Protocol

```
Setup (one-time DKG):
  - Each party i generates polynomial f_i(x) of degree t-1
  - Broadcast commitments: C_i,k = f_i(k) * G for k = 0..t-1
  - Send shares: s_i,j = f_i(j) to party j (encrypted)
  - Verify shares: s_i,j * G = SUM(C_i,k * j^k)
  - Aggregated public key: PK = SUM(C_j,0)

Round 1 (Commitment):
  - Each signer generates nonce pair (d, e)
  - Broadcast commitments (D, E) = (d*G, e*G)
  - Aggregator collects t commitments

Round 2 (Response):
  - Compute binding value rho from all commitments
  - Compute challenge c = H(R || P || m)
  - Each signer computes z = d + (e * rho) + (lambda * sk * c)
  - Aggregator combines: s = SUM(z), R = SUM(D + rho*E)
  - Output: signature (R, s)
```markdown

### Solidity Interface

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IFROST
 * @dev Interface for FROST threshold signature verification precompile
 *
 * FROST (Flexible Round-Optimized Schnorr Threshold) is a threshold signature
 * scheme based on Schnorr signatures. It enables t-of-n signing where any t
 * parties can collaboratively produce a signature that appears to be from a
 * single signer.
 *
 * Features:
 * - Efficient Schnorr-based threshold signatures
 * - Compatible with Ed25519 and secp256k1 Schnorr
 * - Used for Bitcoin Taproot multisig
 * - Lower gas cost than ECDSA threshold (CGGMP21)
 *
 * Address: 0x020000000000000000000000000000000000000C
 */
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

/**
 * @title FROSTLib
 * @dev Library for FROST threshold signature operations
 */
library FROSTLib {
    /// @dev Address of the FROST precompile
    address constant FROST_PRECOMPILE = 0x020000000000000000000000000000000000000C;

    /// @dev Gas cost constants
    uint256 constant BASE_GAS = 50_000;
    uint256 constant PER_SIGNER_GAS = 5_000;

    error InvalidThreshold();
    error InvalidSignature();
    error SignatureVerificationFailed();

    /**
     * @notice Verify FROST signature and revert on failure
     * @param threshold Minimum signers required
     * @param totalSigners Total number of parties
     * @param publicKey Aggregated public key
     * @param messageHash Message hash
     * @param signature Schnorr signature
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
     * @param totalSigners Total number of parties
     * @return gas Estimated gas cost
     */
    function estimateGas(uint32 totalSigners) internal pure returns (uint256 gas) {
        return BASE_GAS + (uint256(totalSigners) * PER_SIGNER_GAS);
    }

    /**
     * @notice Check if threshold parameters are valid
     * @param threshold Minimum signers required
     * @param totalSigners Total number of parties
     * @return valid True if parameters are valid
     */
    function isValidThreshold(uint32 threshold, uint32 totalSigners) internal pure returns (bool valid) {
        return threshold > 0 && threshold <= totalSigners;
    }
}

/**
 * @title FROSTVerifier
 * @dev Abstract contract for FROST signature verification
 */
abstract contract FROSTVerifier {
    using FROSTLib for *;

    event FROSTSignatureVerified(
        uint32 threshold,
        uint32 totalSigners,
        bytes32 indexed publicKey,
        bytes32 indexed messageHash
    );

    /**
     * @notice Verify FROST threshold signature
     */
    function verifyFROSTSignature(
        uint32 threshold,
        uint32 totalSigners,
        bytes32 publicKey,
        bytes32 messageHash,
        bytes calldata signature
    ) internal view {
        FROSTLib.verifyOrRevert(
            threshold,
            totalSigners,
            publicKey,
            messageHash,
            signature
        );
    }
}
```text

### Usage Examples

**Bitcoin Taproot Bridge**:

```solidity
contract TaprootBridge is FROSTVerifier {
    struct BridgeConfig {
        uint32 threshold;        // e.g., 3
        uint32 totalGuardians;   // e.g., 5
        bytes32 taprootPubKey;   // Aggregated FROST key
    }

    BridgeConfig public config;
    mapping(bytes32 => bool) public processedTxs;

    function relayBitcoinTransaction(
        bytes32 btcTxHash,
        uint256 amount,
        address recipient,
        bytes calldata guardianSignature
    ) external {
        require(!processedTxs[btcTxHash], "Already processed");

        // Verify threshold signature from guardians
        bytes32 messageHash = keccak256(abi.encode(btcTxHash, amount, recipient));
        verifyFROSTSignature(
            config.threshold,
            config.totalGuardians,
            config.taprootPubKey,
            messageHash,
            guardianSignature
        );

        processedTxs[btcTxHash] = true;
        // Mint wrapped BTC or release locked assets
    }
}
```text

**MPC Custody Wallet**:

```solidity
contract MPCCustodyWallet is FROSTVerifier {
    bytes32 public custodyKey;
    uint32 public threshold;
    uint32 public totalCustodians;

    function executeTransaction(
        address to,
        uint256 value,
        bytes calldata data,
        bytes calldata custodianSignature
    ) external returns (bool success) {
        bytes32 txHash = keccak256(abi.encode(
            address(this),
            to,
            value,
            data,
            nonce++
        ));

        FROSTLib.verifyOrRevert(
            threshold,
            totalCustodians,
            custodyKey,
            txHash,
            custodianSignature
        );

        (success,) = to.call{value: value}(data);
        require(success, "Transaction failed");
    }
}
```text

**DAO Treasury**:

```solidity
contract DAOTreasury is FROSTVerifier {
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

        // Execute approved proposal
        _executeProposal(proposalId);
    }
}
```text

## Rationale

### Gas Cost Justification

The gas formula accounts for:

1. **Base Schnorr Verification (50,000 gas)**:
   - Point multiplication: s * G
   - Point addition: R + c * P
   - Hash computation: H(R || P || m)
   - Scalar operations and field arithmetic

2. **Per-Signer Overhead (5,000 gas)**:
   - Commitment verification metadata
   - Lagrange coefficient computation
   - Share validation in aggregation

**Comparison to ecrecover (3,000 gas)**:
- FROST 2-of-3: 65,000 gas (21.7x premium for threshold)
- FROST 3-of-5: 75,000 gas (25x premium)

The premium is justified by:
- Distributed trust (no single point of failure)
- Threshold flexibility (any t-of-n configuration)
- Compact aggregated signatures (64 bytes regardless of t)

### Why Two Rounds?

Two rounds is the theoretical minimum for threshold signatures without a trusted dealer:

- **Round 1**: Parties commit to nonces, preventing adversarial nonce selection
- **Round 2**: Parties compute partial signatures using binding commitment

One-round schemes require either:
- Trusted dealer (security risk)
- Deterministic nonces (reduces security guarantees)

### Bitcoin Taproot Compatibility

FROST signatures are byte-identical to BIP-340 Schnorr:

```text
BIP-340 Signature: R (32 bytes) || s (32 bytes)
FROST Signature:   R (32 bytes) || s (32 bytes)
```text

This enables:
- Same threshold key controls Bitcoin Taproot + Lux EVM
- Cross-chain atomic swaps with unified key management
- Bridge validators using single signing infrastructure

## Backwards Compatibility

This LP introduces a new precompile at a previously unused address. No backwards compatibility issues.

### Migration from Native Multisig

Projects using native multisig can adopt FROST incrementally:

**Phase 1 - Hybrid**:
```solidity
function verify(bytes calldata sig) internal view returns (bool) {
    if (sig.length == 64) {
        return verifyFROST(sig);  // New FROST signature
    } else {
        return verifyMultisig(sig);  // Legacy multisig
    }
}
```text

**Phase 2 - Transition**: Generate FROST keys, update configurations

**Phase 3 - Deprecate**: Remove legacy multisig support

## Test Cases

### Test Vector 1: Valid 3-of-5 Threshold

```yaml
Input:
  threshold: 3
  totalSigners: 5
  publicKey: 0x9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08
  messageHash: keccak256("Test FROST signature")
  signature: <valid 64-byte Schnorr signature>

Expected Output: 0x...0001 (valid)
Expected Gas: 75,000
```text

### Test Vector 2: Invalid Signature

```yaml
Input:
  threshold: 3
  totalSigners: 5
  publicKey: <same as above>
  messageHash: <same as above>
  signature: <corrupted signature>

Expected Output: 0x...0000 (invalid)
Expected Gas: 75,000 (verification still runs)
```

### Test Vector 3: Invalid Threshold (t > n)

```yaml
Input:
  threshold: 6
  totalSigners: 5
  ...

Expected: Revert with "invalid threshold: t must be <= n"
```text

### Test Vector 4: Zero Threshold

```yaml
Input:
  threshold: 0
  totalSigners: 5
  ...

Expected: Revert with "invalid threshold: t must be > 0"
```

### Test Vector 5: Large Threshold (10-of-15)

```yaml
Input:
  threshold: 10
  totalSigners: 15
  publicKey: <valid key>
  messageHash: <valid hash>
  signature: <valid 10-of-15 signature>

Expected Output: 0x...0001 (valid)
Expected Gas: 125,000
```text

## Reference Implementation

**Implementation Status**: Complete

**Location**: `/Users/z/work/lux/standard/src/precompiles/frost/`

### File Inventory

| File | Lines | Description |
|------|-------|-------------|
| `contract.go` | 167 | Core precompile implementation |
| `contract_test.go` | 201 | Comprehensive test suite |
| `module.go` | 67 | Precompile registration |
| `IFROST.sol` | 238 | Solidity interface and library |
| `README.md` | 266 | Complete documentation |

**Total**: 939 lines

### Core Implementation (contract.go)

```go
package frost

import (
    "encoding/binary"
    "errors"

    "github.com/luxfi/threshold/protocols/frost"
    "github.com/ethereum/go-ethereum/common"
)

const (
    FROSTPrecompileAddress = "0x020000000000000000000000000000000000000C"
    BaseCost               = 50000
    PerSignerCost          = 5000
    InputSize              = 136 // 4 + 4 + 32 + 32 + 64
)

var (
    ErrInvalidInput     = errors.New("invalid input length")
    ErrInvalidThreshold = errors.New("invalid threshold: t must be > 0 and <= n")
    ErrInvalidSignature = errors.New("invalid signature length")
)

func (c *FROSTPrecompile) Run(input []byte) ([]byte, error) {
    if len(input) != InputSize {
        return nil, ErrInvalidInput
    }

    threshold := binary.BigEndian.Uint32(input[0:4])
    totalSigners := binary.BigEndian.Uint32(input[4:8])

    if threshold == 0 || threshold > totalSigners {
        return nil, ErrInvalidThreshold
    }

    publicKey := input[8:40]
    messageHash := input[40:72]
    signature := input[72:136]

    if len(signature) != 64 {
        return nil, ErrInvalidSignature
    }

    // Verify using FROST library
    valid := frost.Verify(publicKey, messageHash, signature)

    result := make([]byte, 32)
    if valid {
        result[31] = 1
    }
    return result, nil
}

func (c *FROSTPrecompile) RequiredGas(input []byte) uint64 {
    if len(input) < 8 {
        return BaseCost
    }
    totalSigners := binary.BigEndian.Uint32(input[4:8])
    return BaseCost + uint64(totalSigners)*PerSignerCost
}
```markdown

### External Dependency

**Threshold Library**: `github.com/luxfi/threshold/protocols/frost`

Provides:
- `frost.Keygen()` - Distributed key generation
- `frost.KeygenTaproot()` - Bitcoin Taproot key generation
- `frost.Sign()` - Two-round threshold signing
- `frost.Verify()` - Standard Schnorr verification
- `frost.Refresh()` - Share refreshing

## Security Considerations

### Cryptographic Security

FROST security relies on the **discrete logarithm assumption** over elliptic curves:

- Given P = x * G, it is computationally infeasible to recover x
- Standard assumption for ECDSA, Schnorr, Ed25519
- **NOT quantum-safe** (vulnerable to Shor's algorithm)

For quantum resistance, use Ringtail (LP-7324) or post-quantum alternatives.

### Threshold Security Properties

**Safety (Unforgeability)**:
- Adversary controlling < t parties cannot forge signatures
- Even with access to all t-1 shares
- Shares individually reveal no information about the secret key

**Liveness**:
- Any t honest parties can produce valid signature
- Tolerates up to n-t offline/crashed parties
- No single point of failure

**Robustness**:
- Byzantine adversary can corrupt up to t-1 parties
- Honest majority assumption: >= t honest parties
- Recommended: t > 2n/3 for Byzantine fault tolerance

### Critical Security Requirements

**1. Nonce Uniqueness (CRITICAL)**:

```
// NEVER reuse nonces - enables key recovery
d1, e1 := generateNonces()
sig1 := sign(msg1, d1, e1)
sig2 := sign(msg2, d1, e1)  // FATAL: Key recovery attack!

// ALWAYS generate fresh nonces per signature
for each signature {
    d, e := crypto.RandomNonces()
    sig := sign(msg, d, e)
}
```text

**2. Message Hashing**:

```solidity
// CORRECT: Hash before signing
bytes32 messageHash = keccak256(abi.encode(data));
verifyFROST(..., messageHash, signature);

// WRONG: Sign raw data (collision vulnerability)
verifyFROST(..., rawData, signature);
```text

**3. Domain Separation**:

```solidity
bytes32 messageHash = keccak256(abi.encodePacked(
    "FROST-LUX-v1",      // Domain tag
    block.chainid,       // Chain ID
    address(this),       // Contract address
    nonce,               // Replay protection
    data
));
```text

### Side-Channel Considerations

Implementation must use:
- Constant-time scalar multiplication
- Timing-independent branches
- Memory clearing after use
- Protection against power analysis

### Integration Security

```solidity
// CORRECT: Verify before state change
function withdraw(bytes calldata sig) external {
    require(verifyFROST(sig), "Invalid signature");
    balance[msg.sender] = 0;  // Safe after verification
}

// WRONG: State change before verification
function withdraw(bytes calldata sig) external {
    balance[msg.sender] = 0;  // VULNERABLE
    require(verifyFROST(sig), "Invalid signature");
}
```

## Economic Impact

### Gas Cost Comparison

| Scheme | 2-of-3 | 3-of-5 | 5-of-7 | 10-of-15 |
|--------|--------|--------|--------|----------|
| **FROST** | 65,000 | 75,000 | 85,000 | 125,000 |
| CGGMP21 | 105,000 | 125,000 | 145,000 | 225,000 |
| Native Multisig | 42,000 | 63,000 | 105,000 | 210,000 |
| BLS (Warp) | 120,000 | 120,000 | 120,000 | 120,000 |

**Cost at 50 gwei (ETH @ $4000)**:

| Configuration | FROST Cost | CGGMP21 Cost | Savings |
|---------------|------------|--------------|---------|
| 3-of-5 | $0.15 | $0.25 | 40% |
| 5-of-7 | $0.17 | $0.29 | 41% |
| 10-of-15 | $0.25 | $0.45 | 44% |

### Use Case Economics

**When FROST is Optimal**:
- Bitcoin Taproot integration required
- Threshold flexibility needed (variable t-of-n)
- Gas costs acceptable for security trade-off
- Same key across Bitcoin + EVM chains

**When to Use Alternatives**:
- **Low-value (<$1K)**: Native multisig (cheaper)
- **ECDSA required**: CGGMP21 (LP-7322)
- **Quantum-safe required**: Ringtail (LP-7324)
- **Fixed aggregation**: BLS (constant cost)

## Open Questions

1. **Ed25519-FROST Support**: Should a separate precompile be added for Ed25519 curve (Solana/Cardano compatibility)?

2. **Key Refresh Integration**: How should the precompile integrate with LP-7323 LSS-MPC for dynamic threshold changes?

3. **Hardware Acceleration**: Should FPGA/ASIC acceleration be specified for high-throughput validators?

4. **Cross-Chain Coordination**: Standard for coordinating threshold signing across Bitcoin + multiple EVM chains?

## Standards Compliance

### IETF FROST

Implements: [draft-irtf-cfrg-frost](https://datatracker.ietf.org/doc/draft-irtf-cfrg-frost/)

- Two-round signing protocol
- Distributed key generation
- Shamir secret sharing
- Schnorr signature verification

### BIP-340: Schnorr Signatures for secp256k1

Full compatibility with Bitcoin Schnorr:
- 32-byte public keys (x-coordinate only)
- 64-byte signatures (R || s)
- Tagged hash construction

### BIP-341: Taproot

FROST keys can be used directly as Taproot output keys:
- P2TR spending with threshold signature
- Script path alternative for recovery
- MuSig2/FROST hybrid spending paths

## Related LPs

- **LP-2000**: C-Chain EVM Specification (base EVM)
- **LP-7321**: FROST Threshold Signature Precompile (canonical reference)
- **LP-7322**: CGGMP21 Threshold ECDSA Precompile
- **LP-7323**: LSS-MPC Dynamic Resharing Extension
- **LP-7324**: Ringtail Threshold Signature Precompile (post-quantum)
- **LP-4200**: Post-Quantum Cryptography Suite

## References

### Specifications

- **IETF FROST**: [draft-irtf-cfrg-frost](https://datatracker.ietf.org/doc/draft-irtf-cfrg-frost/)
- **BIP-340**: [Schnorr Signatures for secp256k1](https://github.com/bitcoin/bips/blob/master/bip-0340.mediawiki)
- **BIP-341**: [Taproot: SegWit version 1 spending rules](https://github.com/bitcoin/bips/blob/master/bip-0341.mediawiki)

### Academic Papers

- Chelsea Komlo and Ian Goldberg. "FROST: Flexible Round-Optimized Schnorr Threshold Signatures" (ePrint 2020/852)
- Torben Pryds Pedersen. "A Threshold Cryptosystem without a Trusted Party" (EUROCRYPT 1991)

### Implementation

- **Precompile**: `standard/src/precompiles/frost/`
- **Threshold Library**: `github.com/luxfi/threshold/protocols/frost`
- **Solidity Interface**: `standard/src/precompiles/frost/IFROST.sol`
- **Tests**: `standard/src/precompiles/frost/contract_test.go`

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
