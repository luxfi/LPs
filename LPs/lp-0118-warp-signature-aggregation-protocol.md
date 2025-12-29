---
lp: 118
title: Warp Signature Aggregation Protocol
description: P2P protocol for requesting and aggregating BLS signatures for Warp cross-chain messages
author: Lux Network Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Final
type: Standards Track
category: Networking
created: 2024-12-23
tags: [warp, bls, signatures, p2p, cross-chain]
---

# LP-0118: Warp Signature Aggregation Protocol

## Abstract

This LP defines the P2P protocol for requesting and aggregating BLS signatures for Warp cross-chain messages. It specifies the message formats, handler interfaces, and aggregation process used by validators to collectively sign Warp messages.

## Motivation

Warp messaging requires collecting signatures from multiple validators to achieve quorum. A standardized protocol ensures:

1. **Interoperability**: All nodes use the same message format
2. **Efficiency**: Binary format minimizes bandwidth
3. **Security**: Proper verification before signing
4. **Consistency**: Unified handler interface across VMs

## Specification

### P2P Handler ID

```go
const SignatureHandlerID = 0x12345678
```

All Warp signature requests use this handler ID in the P2P protocol.

### Message Formats

#### Signature Request

Binary format (length-prefixed fields):

```
+------------------+------------------+
| Message Length   | Message Bytes    |
| (4 bytes, BE)    | (variable)       |
+------------------+------------------+
| Justification Len| Justification    |
| (4 bytes, BE)    | (variable)       |
+------------------+------------------+
```

Go representation:

```go
type SignatureRequest struct {
    Message       []byte // Unsigned warp message bytes
    Justification []byte // Optional proof/context
}
```

#### Signature Response

Binary format:

```
+------------------+
| Signature Bytes  |
| (96 bytes)       |
+------------------+
```

Go representation:

```go
type SignatureResponse struct {
    Signature []byte // BLS signature (96 bytes)
}
```

### Interfaces

#### Verifier

Before signing, messages must be verified:

```go
type Verifier interface {
    Verify(ctx context.Context, msg *UnsignedMessage, justification []byte) error
}
```

#### SignatureHandler

Handles incoming signature requests:

```go
type SignatureHandler interface {
    Request(ctx context.Context, nodeID ids.NodeID, deadline time.Time, requestBytes []byte) ([]byte, error)
}
```

#### Signer

Signs verified messages:

```go
type Signer interface {
    Sign(msg *UnsignedMessage) ([]byte, error)
}
```

### Protocol Flow

1. **Request**: Node A sends `SignatureRequest` to Node B
2. **Verify**: Node B's `Verifier` validates the message and justification
3. **Sign**: If valid, Node B's `Signer` creates a BLS signature
4. **Cache**: Signature is cached by message ID for future requests
5. **Respond**: Node B returns `SignatureResponse` with the signature
6. **Aggregate**: Node A collects signatures until quorum is reached

### Aggregation

The `SignatureAggregator` queries validators in parallel:

```go
func (s *SignatureAggregator) AggregateSignatures(
    ctx context.Context,
    message *Message,
    justification []byte,
    validators []*Validator,
    quorumNum, quorumDen uint64,
) (*Message, *big.Int, *big.Int, error)
```

Aggregation continues until:
- Quorum weight is achieved (success)
- All validators are exhausted without quorum (failure)
- Context is cancelled (failure)

### Error Codes

| Code | Name | Description |
|------|------|-------------|
| 1 | ParseError | Failed to parse request |
| 2 | VerifyError | Message verification failed |
| 3 | SignError | Signing failed |
| 4 | NotFound | Message not found |

## Rationale

### Binary Message Format

Using a compact binary format (vs JSON) provides:

1. **Bandwidth Efficiency**: 96-byte signatures are optimal for BLS
2. **Parsing Speed**: Fixed-width fields enable zero-copy parsing
3. **Determinism**: Binary serialization is unambiguous
4. **Cryptographic Safety**: No string encoding edge cases

### Handler ID Convention

Using `0x12345678` as the handler ID follows the p2p protocol convention where:
- IDs are allocated sequentially
- Application-specific handlers use high values
- Allows easy identification in network diagnostics

### Parallel Aggregation

Collecting signatures in parallel (vs sequentially) reduces latency:

- Reduces worst-case latency from O(n) to O(1)
- Handles validator failures gracefully with timeouts
- Enables dynamic quorum adjustment based on available validators

## Implementation

As of warp v1.18.0, this protocol is implemented in `github.com/luxfi/warp`:

- `signature_request.go` - Request/response types and marshaling
- `signature_aggregator.go` - Aggregator implementation
- `verifier.go` - Verifier interface

### Migration from lp118 Package

The original implementation was in `github.com/luxfi/p2p/lp118`. As of warp v1.18.0, all types have been consolidated:

| Old (p2p/lp118) | New (warp) |
|-----------------|------------|
| `lp118.HandlerID` | `warp.SignatureHandlerID` |
| `lp118.Verifier` | `warp.Verifier` |
| `lp118.SignatureRequest` | `warp.SignatureRequest` |
| `lp118.SignatureResponse` | `warp.SignatureResponse` |
| `lp118.NewCachedHandler` | `warp.NewCachedSignatureHandler` |
| `lp118.NewHandlerAdapter` | `warp.NewSignatureHandlerAdapter` |
| `lp118.SignatureAggregator` | `warp.SignatureAggregator` |

The `github.com/luxfi/p2p/lp118` package has been deleted.

## Security Considerations

1. **Verification Required**: Always verify messages before signing
2. **Rate Limiting**: Implement rate limiting to prevent DoS
3. **Justification Validation**: Verify justification proofs when provided
4. **Quorum Security**: Use 2/3+ quorum for BFT security guarantees
5. **Replay Protection**: Network ID and chain ID prevent cross-chain replay

## Backwards Compatibility

The binary format is backwards compatible. The package location change requires import updates but no protocol changes.

## References

- [LP-6602: Warp Cross-Chain Messaging Protocol](./lp-6602-warp-cross-chain-messaging-protocol.md)
- [LP-3510: Warp Messaging Precompile](./lp-3510-warp-messaging-precompile.md)
- [BLS12-381 Curve](https://hackmd.io/@benjaminion/bls12-381)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
