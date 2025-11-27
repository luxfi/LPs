---
lp: 0313
title: Warp Messaging Precompile
description: Native precompile for cross-chain message verification and BLS signature aggregation
author: Lux Core Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Standards Track
category: Core
created: 2025-11-14
requires: 22
activation:
  flag: lp313-warp-precompile
  hfName: "Teleport"
  activationHeight: "0"
---

## Abstract

This LP specifies the Warp Messaging precompile at address `0x0200000000000000000000000000000000000008`, which enables cross-chain message verification using BLS signature aggregation. The precompile verifies validator-signed messages for secure inter-chain communication, asset transfers, and state synchronization across Lux chains and subnets.

## Motivation

Cross-chain interoperability requires secure message passing with cryptographic proof that validators have attested to message validity. Warp provides:

1. **BLS Signature Aggregation**: Combine multiple validator signatures into one
2. **Threshold Verification**: Ensure sufficient validator stake has signed
3. **Cross-Chain Assets**: Enable native token transfers between chains
4. **State Proofs**: Verify state from other chains
5. **Atomic Operations**: Coordinate multi-chain transactions

## Specification

### Precompile Address
```
0x0200000000000000000000000000000000000008
```

### Input Format

| Offset | Length | Field | Description |
|--------|--------|-------|-------------|
| 0      | 32     | `messageHash` | Keccak256 hash of the message |
| 32     | 32     | `netID` | Source network/subnet ID |
| 64     | 96     | `aggregateSignature` | BLS aggregate signature |
| 160    | 32     | `bitsetLength` | Number of validators in bitset |
| 192    | variable | `bitset` | Packed bitset of signers |

### Output Format
- `0x...0001` - Message valid (threshold met)
- `0x...0000` - Message invalid

### Gas Cost
```
gas = BASE_COST + (numSigners * SIGNER_COST)

Where:
  BASE_COST = 50,000 gas
  SIGNER_COST = 1,000 gas per validator
```

## Reference Implementation

See: `node/vms/platformvm/warp/`

**Key Files:**
- `warp.go`: Core Warp message handling
- `signer.go`: BLS signature aggregation and verification
- `validator.go`: Validator set management and stake validation
- `message.go`: Message construction and validation

**BLS Cryptography:**
- Implementation: `node/crypto/bls/`
- Standard: BLS-12-381 threshold signatures
- Proof of Possession: BLS proof of possession for validator keys
- Aggregation: Multiple signatures combined into single aggregate

**EVM Precompile:**
- Location: `evm/precompile/contracts/warp/`
- Contract: `contract.go` - Precompile implementation
- Interface: `IWarp.sol` - Solidity interface and library
- Gas Cost: BASE_COST (50,000) + SIGNER_COST (1,000 per validator)

## Rationale

### Design Decisions

**1. BLS Signature Aggregation**: BLS signatures allow multiple validator signatures to be combined into a single aggregate signature, dramatically reducing on-chain verification costs. A single aggregate verification replaces N individual signature checks.

**2. Epoch-Based Validator Sets**: Using epoched validator sets (LP-181) provides predictable verification targets. Validators know in advance which public keys to aggregate against, enabling efficient message signing without real-time P-Chain queries.

**3. Weight Threshold**: The 67% stake weight threshold ensures Byzantine fault tolerance while allowing message finality with a supermajority. This matches Lux consensus assumptions.

**4. Precompile vs. Native Opcode**: Implementing as a precompile rather than a new EVM opcode maintains compatibility with standard EVM tooling while enabling specialized BLS cryptography operations.

### Alternatives Considered

- **ECDSA Multi-sig**: Rejected due to O(n) verification cost vs O(1) for BLS aggregation
- **Relay-based bridges**: Rejected as requiring additional trust assumptions beyond validator set
- **State proofs only**: Insufficient for general message passing; combined approach preferred
- **Per-message threshold**: Fixed 67% chosen for simplicity and alignment with consensus

## Test Cases

### Test Vector 1: Valid Warp Message
**Input:**
```
messageHash: 0x<keccak256 of message payload>
netID: <source network ID>
aggregateSignature: 0x<BLS aggregate signature>
bitset: <bitmap of signers>
```
**Expected Output:** `0x...0001` (valid)
**Expected Gas:** ~60,000 (50k base + 10k for typical validator set)

### Test Vector 2: Invalid Signature
**Input:** Same as above but with tampered signature
**Expected Output:** `0x...0000` (invalid)
**Expected Gas:** ~60,000 (verification still runs)

### Test Vector 3: Insufficient Stake Weight
**Input:** Valid signature but only 60% of validators have signed
**Expected Output:** `0x...0000` (below 67% threshold)

### Test Vector 4: Cross-Chain Replay Protection
**Input:** Valid message for netID=1, replayed on netID=2
**Expected Output:** `0x...0000` (network ID mismatch)

## Security Considerations

### BLS Signature Security
- **Scheme**: BLS-12-381 with threshold aggregation
- **Security Level**: 128-bit (NIST equivalent security)
- **Proof of Possession**: Each validator proves ownership of private key
- **Rogue Key Protection**: PoP prevents rogue key attacks in threshold settings

### Stake Threshold Validation
- **Requirement**: 67% of network stake must have signed
- **Calculation**: Stake weight verified during aggregation
- **Byzantine Resilience**: Tolerates up to 33% malicious validators
- **Dynamic Updates**: Validator set changes reflected in P-Chain state

### Replay Protection
- **Network ID**: Included in signed message digest
- **Direction**: Prevents messages from one chain being replayed on another
- **Subnet Support**: Each subnet has unique network ID in genesis
- **Atomic Swap Chains**: Different chains have different source netIDs

### Message Format Validation
- **Length Checks**: All inputs validated for correct sizes
- **Signature Encoding**: BLS signatures must be exactly 48 bytes
- **Public Key Encoding**: BLS public keys must be exactly 96 bytes
- **Bitset Parsing**: Carefully validated to prevent out-of-bounds access

### Implementation Security
- **Constant-Time Operations**: BLS verification uses constant-time implementations
- **No Signature Malleability**: BLS signatures are non-malleable
- **DoS Protection**: Gas costs prevent computational DoS attacks
- **Input Sanitization**: All inputs bounds-checked before use

## Solidity Interface

```solidity
interface IWarp {
    /**
     * @dev Verify a Warp message with BLS signature aggregation
     * @param messageHash The Keccak256 hash of the message
     * @param netID Source network/subnet ID
     * @param aggregateSignature The BLS aggregate signature
     * @param bitsetLength Number of validators in the bitset
     * @param bitset Packed bitset indicating which validators signed
     * @return valid True if message is valid and threshold is met
     */
    function verifyMessage(
        bytes32 messageHash,
        uint32 netID,
        bytes calldata aggregateSignature,
        uint32 bitsetLength,
        bytes calldata bitset
    ) external view returns (bool valid);
}
```

## Backwards Compatibility

This LP introduces a new precompile and has no backwards compatibility issues. Existing contracts compiled before this LP can call the precompile after activation.

## References

- **BLS-12-381**: https://datatracker.ietf.org/doc/html/draft-irtf-cfrg-bls-signature/
- **Threshold Signatures**: https://en.wikipedia.org/wiki/Threshold_cryptosystem
- **Warp Implementation**: `node/vms/platformvm/warp/`
- **LP-311**: ML-DSA Post-Quantum Alternative
- **LP-312**: SLH-DSA Alternative for Higher Security

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).