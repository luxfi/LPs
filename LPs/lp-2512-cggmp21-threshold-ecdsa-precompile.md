---
lp: 2512
title: CGGMP21 Threshold ECDSA Precompile
description: Native precompile for UC-secure threshold ECDSA with identifiable aborts
author: Lux Core Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Standards Track
category: Core
created: 2025-12-14
requires: 2000
activation:
  flag: lp2512-cggmp21-precompile
  hfName: "Quantum"
  activationHeight: "0"
tags: [threshold-crypto, mpc, precompile, ecdsa]
---

## Abstract

This LP specifies a precompiled contract for verifying CGGMP21 (Canetti-Gennaro-Goldfeder-Makriyannis-Peled 2021) threshold ECDSA signatures at address `0x020000000000000000000000000000000000000D`. CGGMP21 is a state-of-the-art threshold signature protocol providing UC-security (Universal Composability) with **identifiable aborts**, enabling detection and penalization of malicious parties. The precompile enables Ethereum-compatible threshold wallets, institutional custody, DAO treasury management, and cross-chain bridge signing with enterprise-grade security guarantees.

## Motivation

### The Threshold ECDSA Problem

Multi-party custody and governance require threshold signatures where any t-of-n parties can authorize operations. For Ethereum and Bitcoin compatibility, ECDSA threshold signatures are essential:

1. **ECDSA Compatibility**: Native support for Ethereum/Bitcoin signatures without wallet changes
2. **Threshold Policies**: Flexible t-of-n signing (e.g., 3-of-5 council, 5-of-7 institutional custody)
3. **Malicious Security**: Protection against actively malicious parties
4. **Identifiable Aborts**: Detection and slashing of malicious participants
5. **Key Refresh**: Proactive security through share rotation

### Why CGGMP21?

CGGMP21 provides unique advantages over previous threshold ECDSA protocols:

1. **Identifiable Aborts**: Unlike GG20, CGGMP21 can identify which party caused protocol failure
2. **UC Security**: Universally composable security against malicious adversaries
3. **Efficient Refresh**: Non-interactive key refresh without changing the public key
4. **Presignature Support**: Precompute signatures for faster online signing phase
5. **Industry Standard**: Widely adopted in enterprise custody (Fireblocks, ZenGo, etc.)

### Use Cases

1. **Institutional Custody**: 5-of-7 multisig for enterprise-grade asset management
2. **DAO Treasury Management**: Council-based threshold signatures for governance
3. **Cross-Chain Message Signing**: Validators sign bridge messages with threshold ECDSA
4. **Multi-Party Wallets**: Distributed key management without single point of failure
5. **Staking Validators**: Threshold validator keys with identifiable aborts for slashing

## Specification

### Precompile Address

```text
0x020000000000000000000000000000000000000D
```markdown

### Input Format

The precompile accepts a packed binary input (170 bytes minimum):

| Offset | Length | Field | Description |
|--------|--------|-------|-------------|
| 0 | 4 | `threshold` | Required number of signers t (big-endian uint32) |
| 4 | 4 | `totalSigners` | Total number of participants n (big-endian uint32) |
| 8 | 65 | `publicKey` | Aggregated ECDSA public key (uncompressed: 0x04 \|\| x \|\| y) |
| 73 | 32 | `messageHash` | Keccak256 hash of the message |
| 105 | 65 | `signature` | ECDSA signature (r \|\| s \|\| v) |

**Total minimum size**: 170 bytes

### ECDSA Signature Format

The signature follows standard Ethereum ECDSA format (65 bytes):

- **r** (32 bytes): Signature component r
- **s** (32 bytes): Signature component s
- **v** (1 byte): Recovery identifier (27/28 or 0/1)

CGGMP21 produces signatures indistinguishable from single-party ECDSA, ensuring compatibility with all existing ECDSA verification.

### Output Format

**32 bytes**: Boolean result as uint256
- `0x0000000000000000000000000000000000000000000000000000000000000001` = Valid signature
- `0x0000000000000000000000000000000000000000000000000000000000000000` = Invalid signature

### Gas Costs

The gas cost is calculated based on the threshold configuration:

```
gas = 75,000 + (totalSigners * 10,000)
```markdown

| Configuration | Total Signers | Gas Cost |
|---------------|---------------|----------|
| 2-of-3 | 3 | 105,000 |
| 3-of-5 | 5 | 125,000 |
| 5-of-7 | 7 | 145,000 |
| 7-of-10 | 10 | 175,000 |
| 10-of-15 | 15 | 225,000 |
| 15-of-20 | 20 | 275,000 |

**Rationale**: Higher base cost than FROST reflects ECDSA's computational complexity. Per-party cost accounts for threshold verification overhead and potential abort identification.

### Error Conditions

| Error | Condition |
|-------|-----------|
| `ErrInvalidInputLength` | Input < 170 bytes |
| `ErrInvalidThreshold` | threshold == 0 OR threshold > totalSigners |
| `ErrInvalidPublicKey` | publicKey length != 65 OR invalid curve point |
| `ErrInvalidSignature` | signature length != 65 |
| `ErrSignatureVerifyFail` | Signature does not verify against public key |

## Solidity Interface

### ICGGMP21.sol

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title ICGGMP21
 * @dev Interface for CGGMP21 threshold signature verification precompile
 *
 * CGGMP21 is a modern threshold ECDSA protocol with identifiable aborts.
 * It enables t-of-n threshold signing for ECDSA signatures used in
 * Ethereum, Bitcoin, and other ECDSA-based blockchains.
 *
 * Features:
 * - Modern threshold ECDSA (CGGMP21 protocol)
 * - Identifiable aborts (malicious parties can be detected)
 * - Compatible with standard ECDSA verification
 * - Supports key refresh without changing public key
 *
 * Address: 0x020000000000000000000000000000000000000D
 */
interface ICGGMP21 {
    /**
     * @notice Verify a CGGMP21 threshold signature
     * @param threshold The minimum number of signers required (t)
     * @param totalSigners The total number of parties (n)
     * @param publicKey The aggregated ECDSA public key (65 bytes uncompressed)
     * @param messageHash The hash of the message (32 bytes)
     * @param signature The ECDSA signature (65 bytes: r || s || v)
     * @return valid True if the signature is valid
     */
    function verify(
        uint32 threshold,
        uint32 totalSigners,
        bytes calldata publicKey,
        bytes32 messageHash,
        bytes calldata signature
    ) external view returns (bool valid);
}
```text

### CGGMP21Lib Library

```solidity
/**
 * @title CGGMP21Lib
 * @dev Library for CGGMP21 threshold signature operations
 */
library CGGMP21Lib {
    /// @dev Address of the CGGMP21 precompile
    address constant CGGMP21_PRECOMPILE = 0x020000000000000000000000000000000000000D;

    /// @dev Gas cost constants
    uint256 constant BASE_GAS = 75_000;
    uint256 constant PER_SIGNER_GAS = 10_000;

    error InvalidThreshold();
    error InvalidPublicKey();
    error InvalidSignature();
    error SignatureVerificationFailed();

    /**
     * @notice Verify CGGMP21 signature and revert on failure
     * @param threshold Minimum signers required
     * @param totalSigners Total number of parties
     * @param publicKey Aggregated public key (65 bytes)
     * @param messageHash Message hash
     * @param signature ECDSA signature (65 bytes)
     */
    function verifyOrRevert(
        uint32 threshold,
        uint32 totalSigners,
        bytes calldata publicKey,
        bytes32 messageHash,
        bytes calldata signature
    ) internal view {
        if (threshold == 0 || threshold > totalSigners) {
            revert InvalidThreshold();
        }
        if (publicKey.length != 65) {
            revert InvalidPublicKey();
        }
        if (signature.length != 65) {
            revert InvalidSignature();
        }

        bytes memory input = abi.encodePacked(
            threshold,
            totalSigners,
            publicKey,
            messageHash,
            signature
        );

        (bool success, bytes memory result) = CGGMP21_PRECOMPILE.staticcall(input);
        require(success, "CGGMP21 precompile call failed");

        bool valid = abi.decode(result, (bool));
        if (!valid) {
            revert SignatureVerificationFailed();
        }
    }

    /**
     * @notice Estimate gas for CGGMP21 verification
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

    /**
     * @notice Validate public key format
     * @param publicKey Public key bytes
     * @return valid True if valid uncompressed ECDSA key
     */
    function isValidPublicKey(bytes calldata publicKey) internal pure returns (bool valid) {
        return publicKey.length == 65 && publicKey[0] == 0x04;
    }
}
```text

### ThresholdWallet Contract

```solidity
/**
 * @title ThresholdWallet
 * @dev Example threshold wallet using CGGMP21
 */
contract ThresholdWallet {
    using CGGMP21Lib for *;

    struct WalletConfig {
        uint32 threshold;
        uint32 totalSigners;
        bytes publicKey;
        uint256 nonce;
    }

    WalletConfig public config;
    mapping(bytes32 => bool) public executedTxs;

    event WalletInitialized(uint32 threshold, uint32 totalSigners);
    event TransactionExecuted(bytes32 indexed txHash, address indexed to, uint256 value);

    /**
     * @notice Initialize threshold wallet
     * @param threshold Minimum signers required
     * @param totalSigners Total number of signers
     * @param publicKey Aggregated ECDSA public key
     */
    function initialize(
        uint32 threshold,
        uint32 totalSigners,
        bytes calldata publicKey
    ) external {
        require(config.threshold == 0, "Already initialized");
        require(CGGMP21Lib.isValidThreshold(threshold, totalSigners), "Invalid threshold");
        require(CGGMP21Lib.isValidPublicKey(publicKey), "Invalid public key");

        config = WalletConfig({
            threshold: threshold,
            totalSigners: totalSigners,
            publicKey: publicKey,
            nonce: 0
        });

        emit WalletInitialized(threshold, totalSigners);
    }

    /**
     * @notice Execute transaction with threshold signature
     * @param to Destination address
     * @param value Amount to send
     * @param data Transaction data
     * @param signature CGGMP21 threshold signature
     */
    function executeTransaction(
        address to,
        uint256 value,
        bytes calldata data,
        bytes calldata signature
    ) external {
        bytes32 txHash = keccak256(abi.encodePacked(
            address(this),
            to,
            value,
            data,
            config.nonce
        ));

        require(!executedTxs[txHash], "Transaction already executed");

        CGGMP21Lib.verifyOrRevert(
            config.threshold,
            config.totalSigners,
            config.publicKey,
            txHash,
            signature
        );

        executedTxs[txHash] = true;
        config.nonce++;

        (bool success, ) = to.call{value: value}(data);
        require(success, "Transaction failed");

        emit TransactionExecuted(txHash, to, value);
    }

    receive() external payable {}
}
```text

## Use Cases

### 1. Institutional Custody (5-of-7 Multisig)

```solidity
contract InstitutionalCustody {
    using CGGMP21Lib for *;

    // 5-of-7 threshold for institutional custody
    uint32 constant THRESHOLD = 5;
    uint32 constant TOTAL_SIGNERS = 7;
    bytes public custodyPublicKey;

    function transferAssets(
        address token,
        address to,
        uint256 amount,
        bytes calldata thresholdSig
    ) external {
        bytes32 txHash = keccak256(abi.encodePacked(
            address(this),
            token,
            to,
            amount,
            block.chainid
        ));

        CGGMP21Lib.verifyOrRevert(
            THRESHOLD,
            TOTAL_SIGNERS,
            custodyPublicKey,
            txHash,
            thresholdSig
        );

        IERC20(token).transfer(to, amount);
    }
}
```text

### 2. DAO Treasury Management

```solidity
contract DAOTreasury {
    using CGGMP21Lib for *;

    // 7-of-10 DAO council
    uint32 public constant DAO_THRESHOLD = 7;
    uint32 public constant DAO_COUNCIL_SIZE = 10;
    bytes public daoPublicKey;

    mapping(bytes32 => bool) public executedProposals;

    function executeDAODecision(
        bytes32 proposalId,
        address target,
        bytes calldata executionData,
        bytes calldata councilSignature
    ) external {
        require(!executedProposals[proposalId], "Already executed");

        bytes32 messageHash = keccak256(abi.encodePacked(
            proposalId,
            target,
            executionData
        ));

        CGGMP21Lib.verifyOrRevert(
            DAO_THRESHOLD,
            DAO_COUNCIL_SIZE,
            daoPublicKey,
            messageHash,
            councilSignature
        );

        executedProposals[proposalId] = true;
        (bool success, ) = target.call(executionData);
        require(success, "Execution failed");
    }
}
```text

### 3. Cross-Chain Message Signing

```solidity
contract ThresholdBridge {
    using CGGMP21Lib for *;

    uint32 public constant VALIDATOR_THRESHOLD = 5;
    uint32 public constant TOTAL_VALIDATORS = 7;
    bytes public validatorPublicKey;

    mapping(bytes32 => bool) public processedMessages;

    function relayMessage(
        uint256 sourceChain,
        bytes calldata message,
        bytes calldata validatorSig
    ) external {
        bytes32 messageHash = keccak256(abi.encodePacked(
            sourceChain,
            block.chainid,
            message
        ));

        require(!processedMessages[messageHash], "Already processed");

        CGGMP21Lib.verifyOrRevert(
            VALIDATOR_THRESHOLD,
            TOTAL_VALIDATORS,
            validatorPublicKey,
            messageHash,
            validatorSig
        );

        processedMessages[messageHash] = true;
        // Process cross-chain message
    }
}
```text

## Technical Details

### CGGMP21 Protocol Properties

**Key Properties**:
- **Identifiable Aborts**: Unlike GG20, can identify malicious parties causing failures
- **UC Security**: Universally composable under malicious adversaries
- **Efficient Refresh**: Proactive security without changing public key
- **Presignature Support**: Precompute signatures for faster online phase

**Protocol Phases**:
1. **Key Generation (DKG)**: 5 rounds - parties jointly generate ECDSA key shares
2. **Signing**: 7 rounds (or 2 rounds with presignatures) - t-of-n parties produce signature
3. **Key Refresh**: 5 rounds - update shares without changing public key

### Identifiable Aborts Mechanism

When a malicious party causes signing to fail:

1. **Zero-Knowledge Proofs**: Each party proves correctness of their contribution
2. **Abort Detection**: Protocol identifies which party's proof failed
3. **Slashing Integration**: On-chain contracts can penalize identified party
4. **DoS Protection**: Prevents repeated attack attempts

## Rationale

### Design Decisions

**1. CGGMP21 over GG20**: CGGMP21 was chosen for identifiable aborts, enabling slashing of malicious parties in blockchain contexts.

**2. Precompile vs Contract**: Native precompile provides gas efficiency and consistent verification across all EVM implementations.

**3. Gas Cost Model**: Base cost (75,000) covers ECDSA verification; per-signer cost (10,000) accounts for threshold complexity tracking.

**4. Standard ECDSA Output**: Signatures are indistinguishable from single-party ECDSA, ensuring maximum compatibility.

### Alternatives Considered

- **GG20**: Earlier protocol, lacks identifiable aborts
- **FROST**: Schnorr-based, not ECDSA compatible
- **Contract-based Multi-sig**: Higher gas costs, less composable

## Backwards Compatibility

This LP introduces a new precompile at an unused address. No backwards compatibility concerns exist. Existing ECDSA verification and multi-sig contracts continue to work unchanged.

## Test Cases

Reference implementation tests: `github.com/luxfi/standard/src/precompiles/cggmp21/contract_test.go`

### Test 1: Valid 3-of-5 Signature
```yaml
Input:
  threshold: 3
  totalSigners: 5
  publicKey: 0x04[...65 bytes...]
  messageHash: 0x[32 bytes]
  signature: 0x[65 bytes r||s||v]

Expected Output: 0x0000...0001 (valid)
Gas Used: 125,000
```text

### Test 2: Invalid Signature
```text
Input: (same as Test 1 with corrupted signature)
Expected Output: 0x0000...0000 (invalid)
Gas Used: 125,000
```

### Test 3: Invalid Threshold (t > n)
```yaml
Input:
  threshold: 6
  totalSigners: 5

Expected: Revert with ErrInvalidThreshold
```

### Test 4: Invalid Threshold (t = 0)
```yaml
Input:
  threshold: 0
  totalSigners: 5

Expected: Revert with ErrInvalidThreshold
```text

### Test 5: Wrong Message Hash
```text
Input: (valid signature, different message hash)
Expected Output: 0x0000...0000 (invalid)
```text

### Test 6: Input Too Short
```yaml
Input: < 170 bytes
Expected: Revert with ErrInvalidInputLength
```text

## Reference Implementation

### Precompile Implementation

**Location**: `github.com/luxfi/standard/src/precompiles/cggmp21/`

**Files**:
- `contract.go` (214 lines) - EVM precompile implementation
- `contract_test.go` (303 lines) - Comprehensive test suite with benchmarks
- `module.go` (68 lines) - Precompile registration
- `ICGGMP21.sol` (269 lines) - Solidity interface, library, and example contracts
- `README.md` (303 lines) - Documentation and usage examples

**Repository**: https://github.com/luxfi/standard/tree/main/src/precompiles/cggmp21

### MPC Protocol Library

**Location**: `github.com/luxfi/mpc/pkg/protocol/cggmp21`

**Core Functions**:
```go
// Key generation (distributed)
func Keygen(group curve.Curve, selfID party.ID, participants []party.ID,
            threshold int) protocol.StartFunc

// Threshold signing
func Sign(config *Config, signers []party.ID, messageHash []byte) protocol.StartFunc

// Key refresh (proactive security)
func Refresh(config *Config) protocol.StartFunc

// Presignature generation
func PreSign(config *Config, signers []party.ID) protocol.StartFunc
```text

## Security Considerations

### Threshold Selection Guidelines

| Use Case | Recommended | Rationale |
|----------|-------------|-----------|
| Personal Wallet | 2-of-3 | Simple backup, low overhead |
| Small DAO | 3-of-5 | Standard governance |
| Trading Firm | 5-of-7 | High security, operational flexibility |
| Institutional Custody | 5-of-7 to 7-of-10 | Enterprise security, compliance |
| Validator Networks | 2/3 majority | Byzantine fault tolerance |

### Key Management Best Practices

1. **Geographic Distribution**: Store shares in different physical locations
2. **Hardware Security**: Use HSMs for institutional custody
3. **Regular Refresh**: Periodically refresh shares for forward security
4. **Monitoring**: Track abort events to detect attacks
5. **Slashing**: Penalize parties identified in aborts

### Message Hashing

Always use domain separation:

```solidity
bytes32 domainSeparator = keccak256(abi.encodePacked(
    "EIP712Domain",
    keccak256("CGGMP21-v1"),
    keccak256(abi.encodePacked(address(this))),
    block.chainid
));

bytes32 messageHash = keccak256(abi.encodePacked(
    "\x19\x01",
    domainSeparator,
    keccak256(abi.encode(nonce, data))
));
```

### Identifiable Abort Handling

When an abort is identified:
1. Log event with malicious party identifier
2. Slash stake if applicable
3. Exclude party from future signing
4. Restart signing without malicious party

## Performance

Benchmarks on Apple M1 Max:

| Configuration | Gas Cost | Verify Time | Memory |
|---------------|----------|-------------|--------|
| 2-of-3 | 105,000 | ~65 us | 12 KB |
| 3-of-5 | 125,000 | ~80 us | 14 KB |
| 5-of-7 | 145,000 | ~95 us | 16 KB |
| 7-of-10 | 175,000 | ~115 us | 19 KB |
| 10-of-15 | 225,000 | ~140 us | 22 KB |

## Standards Compliance

- **CGGMP21 Paper**: [ePrint 2021/060](https://eprint.iacr.org/2021/060) - UC Non-Interactive, Proactive, Threshold ECDSA
- **ECDSA**: secp256k1 curve (Bitcoin/Ethereum standard)
- **EIP-191**: Ethereum Signed Data Standard
- **EIP-712**: Typed Structured Data Hashing

## References

### Academic Papers

1. **CGGMP21**:
   - Canetti, Gennaro, Goldfeder, Makriyannis, Peled (2021)
   - "UC Non-Interactive, Proactive, Threshold ECDSA"
   - ePrint Archive: 2021/060
   - https://eprint.iacr.org/2021/060

2. **GG20 (Predecessor)**:
   - Gennaro, Goldfeder (2020)
   - "One Round Threshold ECDSA with Identifiable Abort"
   - ePrint Archive: 2020/540

3. **Universal Composability**:
   - Canetti (2001)
   - "Universally Composable Security: A New Paradigm"
   - FOCS 2001

### Implementation References

- **Lux Precompile**: https://github.com/luxfi/standard/tree/main/src/precompiles/cggmp21
- **MPC Library**: https://github.com/luxfi/mpc/tree/main/pkg/protocol/cggmp21

### Industry Adoption

- **Fireblocks**: Institutional custody using CGGMP21
- **ZenGo**: Mobile threshold wallet
- **Binance**: Enterprise custody solution

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
