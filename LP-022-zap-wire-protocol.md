---
lp: 022
title: ZAP Wire Protocol
tags: [zap, wire, protocol, serialization, binary, networking]
description: Binary wire protocol with sub-microsecond serialization for Lux node communication
author: Lux Industries
status: Final
type: Standards Track
category: Networking
created: 2023-01-15
requires:
  - lps-020 (Quasar Consensus)
references:
  - lp-2000 (Network Protocol)
  - lp-2100 (ZAP Upgrade)
---

# LP-022: ZAP Wire Protocol

## Abstract

ZAP (Zero-copy Allocation-free Protocol) is Lux Network's binary wire protocol for node-to-node communication. It replaces the legacy Protobuf-based protocol with a fixed-layout binary format that achieves sub-microsecond serialization through zero-copy parsing and arena-based allocation. All consensus messages, block propagation, and peer management use ZAP framing.

## Specification

### Frame Format

```
+--------+--------+----------+---------+----------+
| Magic  | MsgType| Length   | Payload | Checksum |
| 2B     | 1B     | 4B (BE)  | variable| 4B CRC32 |
+--------+--------+----------+---------+----------+
```

- **Magic**: `0x5A50` ("ZP") -- identifies ZAP frames on the wire
- **MsgType**: single byte identifying the message (256 types max)
- **Length**: big-endian uint32, max payload 8 MB
- **Payload**: type-specific binary layout, no self-describing tags
- **Checksum**: CRC32-C of `MsgType || Length || Payload`

### Message Types

| Type | ID | Direction | Description |
|---|---|---|---|
| `Handshake` | 0x01 | bidirectional | Version, network ID, node ID, BLS key |
| `Ping` | 0x02 | bidirectional | Keepalive with uptimes |
| `Pong` | 0x03 | bidirectional | Ping response |
| `PushBlock` | 0x10 | push | New block with QC |
| `PullBlock` | 0x11 | request | Request block by ID |
| `BlockResponse` | 0x12 | response | Block data |
| `PushTx` | 0x20 | push | Transaction gossip |
| `Consensus` | 0x30 | bidirectional | Consensus votes, proposals |
| `WarpMsg` | 0x40 | push | Cross-chain Warp message relay |
| `StateSync` | 0x50 | bidirectional | State sync chunks (LP-024) |

### Serialization

Payloads use fixed-offset layouts. Fields are packed in declaration order with explicit alignment:

- `uint64` / `int64`: 8 bytes, big-endian
- `[32]byte`: 32 bytes, no prefix
- `[]byte`: 4-byte length prefix + data
- `bool`: 1 byte (0x00 or 0x01)

No reflection, no field tags, no schema evolution within a version. Protocol changes require a version bump in the `Handshake` message.

### Zero-Copy Parsing

The receiver maps the payload buffer directly to a typed struct. No intermediate allocations:

1. Validate checksum (CRC32-C, hardware-accelerated on x86/ARM)
2. Bounds-check field offsets against `Length`
3. Return a view struct referencing the original buffer

The buffer is owned by an arena allocator recycled per connection. Typical parse time: 200-400 nanoseconds for a full block message.

### Connection Management

- **Transport**: TCP with TLS 1.3 (node staker certificates)
- **Multiplexing**: single TCP connection per peer, messages interleaved by type
- **Flow control**: per-type send queues with backpressure; slow peers are disconnected after 30s queue full
- **Compression**: optional LZ4 frame compression for `PushBlock` and `StateSync` (negotiated in handshake)

## Security Considerations

1. **No schema evolution**: prevents deserialization confusion attacks. Peers must agree on protocol version at handshake.
2. **CRC32-C**: detects corruption, not tampering. TLS provides authentication and integrity.
3. **8 MB payload limit**: bounds memory allocation per message. Blocks exceeding this are split across multiple `StateSync` chunks.

## Reference

| Resource | Location |
|---|---|
| Wire protocol implementation | `github.com/luxfi/node/network/zap/` |
| Peer management | `github.com/luxfi/node/network/peer/` |
| TLS certificates | LP-015 |

## Copyright

Copyright (C) 2024-2026, Lux Partners Limited. All rights reserved.

Licensed under the MIT License.
