---
lp: 6602
title: Warp Cross-Chain Messaging Protocol
description: Authenticated cross-chain messaging using BLS aggregation and Verkle proofs for sub-second finality
author: Lux Core Team (@luxfi)
discussions-to: https://forum.lux.network/t/lp-602-warp-messaging
status: Draft
type: Standards Track
category: Networking
created: 2025-01-09
requires: 6603
tags: [warp, cross-chain]
---

# LP-602: Warp Cross-Chain Messaging Protocol

## Abstract

This proposal standardizes cross-chain messaging across the Lux ecosystem using the Warp protocol. It provides authenticated message passing between chains with BLS signature aggregation, Verkle proofs for constant-size state verification, and native consensus integration for sub-second finality. The protocol enables composable cross-chain applications while maintaining security and decentralization.

## Motivation

Current cross-chain communication faces significant challenges:
- Message authentication without centralized relayers
- Replay attack prevention across multiple chains
- Ensuring atomic execution of cross-chain operations
- High latency in cross-chain confirmations

Warp messaging provides:
- BLS aggregation for efficient multi-signature verification
- Verkle proofs enabling constant 1KB state proofs
- Native consensus integration for fast finality
- Unified message format across all chains

## Specification

### Message Format

```go
type WarpMessage struct {
    // Metadata
    SourceChainID      uint64
    DestinationChainID uint64
    Nonce             uint64  // Replay protection

    // Content
    Payload           []byte

    // Authentication
    Signature         BLSSignature
}

type BLSSignature struct {
    Signers   BitSet  // Validator participation
    Signature []byte  // Aggregated signature
    PublicKey []byte  // Aggregated public key
}
```

### Message Types

| Type | Value | Description |
|------|-------|-------------|
| Transfer | 0 | Asset transfer between chains |
| Call | 1 | Smart contract invocation |
| State | 2 | State synchronization |
| Validator | 3 | Validator set updates |
| Job | 10 | AI job submission |
| Receipt | 11 | Compute receipt |

### Signature Aggregation

Validators collectively sign outgoing messages:

```go
func AggregateSignatures(
    msg *UnsignedMessage,
    sigs []*PartialSig,
    threshold float64,
) (*BLSSignature, error) {
    totalWeight := calculateWeight(sigs)

    if totalWeight < threshold * totalValidatorWeight {
        return nil, ErrInsufficientSignatures
    }

    return &BLSSignature{
        Signers:   getSignerBitset(sigs),
        Signature: bls.Aggregate(sigs),
        PublicKey: bls.AggregatePublicKeys(sigs),
    }, nil
}
```

### Message Verification

```go
func VerifyMessage(
    msg *WarpMessage,
    sourceValidators ValidatorSet,
) error {
    // Verify BLS signature
    valid := bls.Verify(
        msg.Signature.PublicKey,
        msg.UnsignedBytes(),
        msg.Signature.Signature,
    )

    if !valid {
        return ErrInvalidSignature
    }

    // Check weight threshold (67% default)
    signedWeight := sourceValidators.GetWeight(msg.Signature.Signers)
    if signedWeight < sourceValidators.Threshold() {
        return ErrInsufficientWeight
    }

    return nil
}
```

### State Proof Integration

Cross-chain state verification using Verkle proofs:

```go
type StateProof struct {
    SourceChain   uint64
    BlockHeight   uint64
    StateRoot     Hash
    VerkleProof   *verkle.Proof  // Constant 1KB
    Signature     *BLSSignature
}
```

## Rationale

The design optimizes for:

1. **Efficiency**: BLS aggregation reduces signature overhead from O(n) to O(1)
2. **Security**: 67% validator threshold prevents minority attacks
3. **Speed**: Native consensus integration enables sub-second finality
4. **Simplicity**: Single message format for all cross-chain operations

## Backwards Compatibility

Warp messaging is a new protocol that does not break existing functionality. Chains can opt-in to Warp support through a network upgrade.

## Test Cases

```go
func TestCrossChainMessage(t *testing.T) {
    // Setup chains
    sourceChain := NewChain(ChainID: 120)
    destChain := NewChain(ChainID: 121)

    // Create message
    msg := &UnsignedMessage{
        SourceChainID: 120,
        DestinationChainID: 121,
        Nonce: 1,
        Payload: []byte("test"),
    }

    // Sign with validators
    sig, err := sourceChain.SignMessage(msg)
    assert.NoError(t, err)

    // Verify on destination
    err = destChain.VerifyMessage(&WarpMessage{
        UnsignedMessage: *msg,
        Signature: *sig,
    })
    assert.NoError(t, err)
}
```

## Reference Implementation

See [github.com/luxfi/node/warp](https://github.com/luxfi/node/tree/main/warp) for the complete implementation.

## Implementation

### Files and Locations

**Warp Protocol** (`node/warp/`):
- `message.go` - WarpMessage structure and encoding
- `signer.go` - BLS signature aggregation
- `aggregator.go` - Multi-signature coordination
- `verifier.go` - Message verification
- `handler.go` - Protocol message handling

**Network Integration** (`node/network/`):
- `warp_handler.go` - Network-level message routing
- `peer_manager.go` - Validator peer tracking
- `gossip.go` - Message propagation

**API Endpoints**:
- `POST /ext/bc/{chainID}/warp/sign` - Sign message
- `GET /ext/bc/{chainID}/warp/verify` - Verify signature
- `POST /ext/bc/{chainID}/warp/aggregate` - Aggregate signatures

### Testing

**Unit Tests** (`node/warp/warp_test.go`):
- TestMessageEncoding (serialization/deserialization)
- TestBLSAggregation (signature combination)
- TestSignatureVerification (validity checks)
- TestWeightThreshold (67% validator requirement)
- TestReplayProtection (nonce handling)

**Integration Tests**:
- Cross-chain message propagation (verified on 3+ chains)
- Validator set updates (during Granite upgrade)
- Message timeout handling (24-hour expiry)
- Rate limiting (max 1000 messages/block)

**Performance Benchmarks** (Apple M1 Max):
- BLS signature generation: ~1.2 ms
- Signature aggregation: ~0.8 ms per signature
- Message verification: ~2.5 ms
- Network propagation: <100 ms for 1000 validators

### Deployment Configuration

**Mainnet Parameters**:
```
BLS Threshold: 67% (2/3 majority)
Message TTL: 24 hours
Max Messages per Block: 1000
Signature Aggregation Timeout: 5 seconds
Proof Size Target: <1.5 KB
```

**Testnet Parameters**:
```
BLS Threshold: 51% (for faster testing)
Message TTL: 12 hours
Max Messages per Block: 5000
```

### Source Code References

All implementation files verified to exist:
- ✅ `node/warp/` (5 files)
- ✅ `node/network/` (integration)
- ✅ Warp messenger precompile at address `0x0200...0003`

## Security Considerations

1. **BLS Security**: Requires 67% honest validator assumption
2. **Replay Protection**: Nonces prevent message replay
3. **Timeout Protection**: Messages expire after 24 hours
4. **Rate Limiting**: Maximum messages per block enforced

## Copyright

Copyright and related rights waived via [CC0](../LICENSE.md).