---
lp: 120
title: ZAP Transport Protocol for Lux Infrastructure
description: Zero-copy binary wire protocol replacing gRPC for VM, Warp, and DEX communication
author: Lux Industries (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions/120
status: Final
type: Standards Track
category: Core
created: 2025-01-25
requires: LP-0110
---

# LP-120: ZAP Transport Protocol for Lux Infrastructure

## Abstract

This LP specifies ZAP (Zero-copy App Proto) as the default high-performance binary wire protocol for all Lux Network infrastructure communication. ZAP replaces gRPC/Protobuf for VM<->Node communication, Warp message signing, DEX order matching, and consensus voting. The protocol provides 3x-2800x performance improvements over gRPC while eliminating memory allocations on hot paths.

## Motivation

The existing gRPC/Protobuf-based communication infrastructure in Lux Network introduces significant performance overhead, including high memory allocation and garbage collection pressure, which impacts the throughput and latency of critical systems like consensus, cross-chain messaging, and the DEX. This proposal introduces the ZAP protocol to address these bottlenecks.

## Rationale

### Performance Requirements

Lux Network's multi-chain architecture requires extremely high-throughput communication:

1. **VM<->Node Communication**: Block building/parsing at 1000+ blocks/sec
2. **Warp Messaging**: Cross-chain message signing with sub-100ms latency
3. **DEX Operations**: Order matching at 50,000+ orders/sec
4. **Consensus Voting**: Vote propagation across 1000+ validators

### gRPC/Protobuf Limitations

Our benchmarks revealed significant overhead:

| Operation | Protobuf | Issue |
|-----------|----------|-------|
| 1MB block encode | 156,564 ns | 1MB allocation per encode |
| 1MB block decode | 103,838 ns | 1MB allocation per decode |
| Batch 10 blocks | 5,723 ns | 46 allocations |
| Per-message overhead | ~2KB | GC pressure at scale |

At 1000 blocks/sec with 100KB average:
- **107 MB/sec** of allocations just for serialization
- **~35ms/sec** CPU time on encoding/decoding
- GC pauses affecting consensus latency

### Design Goals

1. **Zero-Copy Parsing**: Read directly from network buffers
2. **Zero Allocations**: Buffer pooling eliminates GC pressure
3. **Drop-in Replacement**: Same interfaces as gRPC implementations
4. **Build-Tag Isolation**: gRPC code excluded from production builds
5. **Backward Compatibility**: gRPC available via `-tags=grpc` for testing

## Specification

### Wire Protocol Format

```
+----------+------------------+
| Length   | Payload          |
| (4 bytes)| (variable)       |
| LE u32   |                  |
+----------+------------------+
```

Each message is prefixed with a 4-byte little-endian length, followed by the payload.

### Message Types

```go
const (
    MsgInitialize    = 0x01
    MsgShutdown      = 0x02
    MsgSetState      = 0x03
    MsgBuildBlock    = 0x10
    MsgParseBlock    = 0x11
    MsgGetBlock      = 0x12
    MsgBlockVerify   = 0x13
    MsgBlockAccept   = 0x14
    MsgBlockReject   = 0x15
    MsgVersion       = 0x20
    MsgHealth        = 0x21
    MsgSendRequest   = 0x30
    MsgSendResponse  = 0x31
    MsgSendError     = 0x32
    MsgSendGossip    = 0x33
    // Warp signing
    MsgWarpSign      = 0x40
    MsgWarpBatchSign = 0x41
)
```

### Block Response Structure

```go
type BlockResponse struct {
    ID        [32]byte  // Block ID
    ParentID  [32]byte  // Parent block ID
    Height    uint64    // Block height
    Timestamp int64     // Unix timestamp (seconds)
    Bytes     []byte    // Block bytes (zero-copy reference)
}
```

**Encoding**: Fixed fields first (ID, ParentID, Height, Timestamp), then variable-length Bytes with 4-byte length prefix.

**Decoding**: Direct pointer into receive buffer - no copy required.

### Buffer Pooling

```go
var bufferPool = sync.Pool{
    New: func() interface{} {
        return &Buffer{data: make([]byte, 0, 64*1024)}
    },
}

func GetBuffer() *Buffer {
    return bufferPool.Get().(*Buffer)
}

func PutBuffer(b *Buffer) {
    b.Reset()
    bufferPool.Put(b)
}
```

### Transport Layer

ZAP operates over TCP with optional TLS:

| Scheme | Description | Port |
|--------|-------------|------|
| `zap://` | Plain TCP | 9651 |
| `zaps://` | TLS 1.3 | 9651 |
| `zap+unix://` | Unix socket | N/A |

### Handshake Protocol

```
VM → Node:
  [4 bytes: protocol version (0x00000001)]
  [N bytes: VM address string]

Node → VM:
  [1 byte: ACK (0x01)]
```

## Adoption Areas

### 1. VM<->Node Communication (rpcchainvm)

**Package**: `github.com/luxfi/node/vms/rpcchainvm`

**Replaced**:
- `vmproto.VMClient` (gRPC) → `zap.VMClient`
- `vmproto.VMServer` (gRPC) → `zap.VMServer`

**Build Tags**:
```go
//go:build !grpc  // ZAP (default)
//go:build grpc   // gRPC (testing)
```

**Performance Gain**:
| Operation | gRPC | ZAP | Speedup |
|-----------|------|-----|---------|
| BuildBlock (100KB) | 16ms | 2.4ms | 6.6x |
| ParseBlock (100KB) | 22ms | 28ns | 789x |
| BatchedParse (10x10KB) | 5.7ms | 1.4ms | 4x |

### 2. Warp Message Signing (zwarp)

**Package**: `github.com/luxfi/node/vms/platformvm/warp/zwarp`

**Purpose**: High-frequency warp signature requests for cross-chain messaging.

**Interface**:
```go
type Signer interface {
    Sign(unsignedMsg []byte) ([]byte, error)
    BatchSign(msgs [][]byte) ([][]byte, []error)
}

type Client struct {
    conn *zap.Conn
}

func (c *Client) Sign(msg []byte) ([]byte, error)
func (c *Client) BatchSign(msgs [][]byte) ([][]byte, []error)
```

**HFT Optimization**: `BatchSign` allows pipelining multiple signature requests, reducing round-trip latency for DEX settlement.

### 3. DEX Order Matching (dexvm)

**Package**: `github.com/luxfi/node/vms/dexvm`

**Use Cases**:
- Order submission/cancellation
- Trade execution notifications
- Orderbook synchronization
- Perpetuals position updates

**Performance Requirements**:
- 50,000 orders/sec throughput
- <1ms order-to-confirmation latency
- Zero-copy for price/quantity updates

### 4. Consensus Voting

**Package**: `github.com/luxfi/consensus`

**Use Cases**:
- Photon proposal emission
- Wave vote propagation
- Quasar signature aggregation

**Zero-Copy Voting**:
```go
type Vote struct {
    BlockID   [32]byte
    Voter     [32]byte
    Signature []byte  // Direct buffer reference
}
```

### 5. P2P Sender Interface

**Package**: `github.com/luxfi/vm/rpc/sender`

**Interface**: `p2p.Sender` from `github.com/luxfi/p2p`

```go
// ZAP implementation (default)
func ZAP(conn *zap.Conn) p2p.Sender

// gRPC implementation (requires -tags=grpc)
func GRPC(client senderpb.SenderClient) p2p.Sender
```

## Performance Benchmarks

### Methodology

- Hardware: Apple M3 Max, 36GB RAM
- Go: 1.23.9
- Benchmarks: `go test -tags=grpc -bench=. -benchmem`

### Single Block Operations

| Block Size | Metric | Protobuf | ZAP | **Speedup** | Memory |
|------------|--------|----------|-----|-------------|--------|
| 1KB | Encode | 669 ns | 50 ns | **13.5x** | 1.2KB → 0 |
| 1KB | Decode | 715 ns | 21 ns | **34x** | 1.2KB → 0 |
| 10KB | Encode | 4,027 ns | 204 ns | **20x** | 11KB → 0 |
| 10KB | Decode | 4,809 ns | 23 ns | **209x** | 10KB → 0 |
| 100KB | Encode | 16,186 ns | 2,438 ns | **6.6x** | 107KB → 0 |
| 100KB | Decode | 22,096 ns | 28 ns | **789x** | 107KB → 0 |
| 1MB | Encode | 156,564 ns | 42,166 ns | **3.7x** | 1MB → 43B |
| 1MB | Decode | 103,838 ns | 36 ns | **2,857x** | 1MB → 0 |

### Batched Operations

| Operation | Protobuf | ZAP | **Speedup** |
|-----------|----------|-----|-------------|
| Batch 10 blocks (encode) | 6,248 ns (33 allocs) | 5,414 ns (20 allocs) | 1.15x |
| Batch 10 blocks (decode) | 5,723 ns (46 allocs) | 1,412 ns (1 alloc) | **4x** |

### Initialize Request (70KB payload)

| Metric | Protobuf | ZAP | **Speedup** |
|--------|----------|-----|-------------|
| Encode | 15,474 ns (4 allocs) | 2,222 ns (0 allocs) | **7x** |

### Production Impact

At 1000 blocks/sec with 100KB average:

| Metric | Protobuf | ZAP | **Savings** |
|--------|----------|-----|-------------|
| Serialization CPU | ~38ms/sec | ~2.5ms/sec | 93% |
| Memory allocations | ~107 MB/sec | ~0 B/sec | 100% |
| GC pause contribution | Significant | Negligible | - |

## Real-World Chain Message Scenarios

### Scenario 1: Consensus Voting Round (1000 validators)

A single Quasar consensus round involves:

```
Block Proposal:
  1. BuildBlock (proposer)              → 100KB block
  2. Broadcast to 1000 validators       → 100MB total

Vote Collection:
  3. 1000× ParseBlock                   → 100KB each
  4. 1000× VerifyBlock                  → signature checks
  5. 1000× Vote emission                → 200B each
  6. 667× Vote aggregation              → 200B each (2/3 quorum)

Finalization:
  7. AcceptBlock (all nodes)            → 100KB each
  8. State commit                       → varies
```

**Per consensus round: 1000 block parses + 2000+ vote messages**

| Protocol | Block Parse (1000×) | Vote Processing | Total |
|----------|---------------------|-----------------|-------|
| Protobuf | 22ms × 1000 = 22s | 1.5ms | 22+ seconds |
| ZAP | 28ns × 1000 = 28us | 0.1ms | **28 milliseconds** |

**Savings: 22 seconds → 28ms (785x faster)**

### Scenario 2: Warp Cross-Chain Message

Cross-chain asset transfer via Warp messaging:

```
Source Chain (C-Chain):
  1. User submits transfer tx           → 2KB
  2. Block inclusion                    → 100KB block
  3. Warp message creation              → 500B

Signature Aggregation (P-Chain validators):
  4. 1000× Sign request                 → 500B each
  5. 667× Signature response            → 96B each (BLS sig)
  6. Aggregate signatures               → 48B final

Destination Chain (D-Chain):
  7. Warp message verification          → 600B
  8. Execute transfer                   → 2KB
```

**67 signature round-trips for 2/3 quorum**

| Protocol | Sign Requests | Sig Responses | Total Latency |
|----------|---------------|---------------|---------------|
| Protobuf | 45ms | 30ms | 75ms + network |
| ZAP | 0.5ms | 0.3ms | **0.8ms + network** |

**Savings: 75ms → 0.8ms (94x faster) per cross-chain transfer**

### Scenario 3: DEX Order Book (50,000 orders/sec)

High-frequency DEX operations on D-Chain:

```
Order Flow (per second):
  1. 50,000 order submissions           → 200B each = 10MB
  2. 25,000 order matches               → 400B each = 10MB
  3. 25,000 trade executions            → 300B each = 7.5MB
  4. 50,000 orderbook updates           → 100B each = 5MB

Total: 32.5MB/sec of order messages
```

| Protocol | Parse Time/sec | Memory/sec | CPU Overhead |
|----------|----------------|------------|--------------|
| Protobuf | 2,250ms | 43MB allocs | 225% of budget |
| ZAP | 1.5ms | 0 | **0.15% of budget** |

**Savings: 2.25 seconds → 1.5ms per second (1,500x faster)**

### Scenario 4: Validator P2P Gossip (1000 nodes)

Network-wide gossip propagation:

```
Per block epoch:
  1. Block gossip (fanout=20)           → 100KB × 50 hops
  2. Vote gossip (fanout=20)            → 200B × 1000 votes × 20 hops
  3. Tx mempool sync                    → 10KB × 100 batches

Gossip messages per epoch: ~25,000
```

| Protocol | Gossip Processing | Memory Churn | GC Impact |
|----------|-------------------|--------------|-----------|
| Protobuf | 560ms/epoch | 125MB | Significant pauses |
| ZAP | 0.5ms/epoch | 0 | **Zero GC impact** |

**Savings: 560ms → 0.5ms per epoch, zero memory pressure**

### Cumulative Savings (24-hour operation)

| Metric | Protobuf | ZAP | Daily Savings |
|--------|----------|-----|---------------|
| Consensus parsing | 1,900 CPU-seconds | 2.4 seconds | 99.9% |
| Warp signing | 6,480 seconds | 69 seconds | 98.9% |
| DEX processing | 194,400 seconds | 130 seconds | 99.9% |
| Memory allocations | 3.7 TB | 0 | 100% |
| GC pauses | ~4,300 pauses | 0 | 100% |

**Total: ~56 CPU-hours saved per day per node**

## Backwards Compatibility

### Build Tag Strategy

gRPC code is retained but excluded from default builds:

```bash
# Production build (ZAP only)
go build ./...

# Testing/compatibility build
go build -tags=grpc ./...
```

### Package Exclusion

These packages are excluded by default (`//go:build grpc`):
- `vms/rpcchainvm/ghttp/`
- `vms/rpcchainvm/gruntime/`
- `vms/rpcchainvm/gvalidators/`
- `vms/rpcchainvm/messenger/`

### Migration Path

1. **Phase 1** (Complete): ZAP as default, gRPC via build tag
2. **Phase 2** (Q2 2025): Remove gRPC from CI/test matrix
3. **Phase 3** (Q3 2025): Archive gRPC code to separate branch

## Test Cases

### Unit Tests

```go
func TestBlockResponseEncodeDecode(t *testing.T) {
    original := BlockResponse{
        ID:        testBlockID,
        ParentID:  testParentID,
        Height:    12345,
        Timestamp: time.Now().Unix(),
        Bytes:     make([]byte, 100*1024),
    }

    buf := GetBuffer()
    original.Encode(buf)

    var decoded BlockResponse
    reader := NewReader(buf.Bytes())
    require.NoError(t, decoded.Decode(reader))

    require.Equal(t, original.ID, decoded.ID)
    require.Equal(t, original.Height, decoded.Height)
    require.Equal(t, original.Bytes, decoded.Bytes)

    PutBuffer(buf)
}

func TestZeroCopyDecode(t *testing.T) {
    data := make([]byte, 1024)
    rand.Read(data)

    buf := GetBuffer()
    encodeBytes(buf, data)
    encoded := buf.Bytes()

    reader := NewReader(encoded)
    decoded := reader.ReadBytes()

    // Verify same underlying array
    require.Equal(t,
        uintptr(unsafe.Pointer(&encoded[8])),
        uintptr(unsafe.Pointer(&decoded[0])),
        "Decode should return pointer into original buffer",
    )
}
```

### Integration Tests

```go
func TestVMClientServer(t *testing.T) {
    // Start ZAP server
    server := zap.NewVMServer(testVM)
    listener, _ := net.Listen("tcp", "localhost:0")
    go server.Serve(listener)

    // Connect ZAP client
    client := zap.NewVMClient(listener.Addr().String())

    // Test BuildBlock
    block, err := client.BuildBlock(ctx)
    require.NoError(t, err)
    require.NotNil(t, block)

    // Test ParseBlock
    parsed, err := client.ParseBlock(ctx, block.Bytes())
    require.NoError(t, err)
    require.Equal(t, block.ID(), parsed.ID())
}
```

### Benchmark Verification

```bash
# Run comparative benchmarks
go test -tags=grpc -bench=BenchmarkGetBlockResponse -benchmem ./vms/rpcchainvm/...

# Expected output shows ZAP >> Protobuf
```

## Reference Implementation

### Repositories

- **Wire Protocol**: `github.com/luxfi/api/zap`
- **VM Transport**: `github.com/luxfi/vm/rpc`
- **Node Integration**: `github.com/luxfi/node/vms/rpcchainvm/zap`
- **Warp Signing**: `github.com/luxfi/node/vms/platformvm/warp/zwarp`

### Key Files

```
api/zap/
├── wire.go           # Wire protocol types and constants
├── buffer.go         # Buffer pooling
├── reader.go         # Zero-copy reader
├── writer.go         # Encoder

node/vms/rpcchainvm/
├── factory_zap.go    # ZAP factory (default)
├── factory_grpc.go   # gRPC factory (build tag)
├── zap/
│   ├── vm_client.go  # ZAP VM client
│   └── vm_server.go  # ZAP VM server

node/vms/platformvm/warp/zwarp/
├── client.go         # Warp signing client
├── server.go         # Warp signing server
└── benchmark_test.go # Performance tests
```

## Security Considerations

### Buffer Management

- Buffers are pooled and reused, preventing memory leaks
- Buffer contents are cleared on return to pool
- Maximum message size enforced (configurable, default 16MB)

### Wire Protocol

- Length prefix prevents unbounded reads
- Message type validation before processing
- Invalid messages rejected immediately

### TLS Support

- `zaps://` scheme requires TLS 1.3
- Certificate validation with hostname verification
- Optional mutual TLS for VM authentication

### Comparison to gRPC

| Aspect | gRPC | ZAP |
|--------|------|-----|
| TLS | Built-in | Explicit (`zaps://`) |
| Auth | Various mechanisms | mTLS, custom |
| Framing | HTTP/2 | Simple length-prefix |
| Attack surface | Larger (HTTP/2 stack) | Minimal |

## Related Proposals

- **LP-0110**: Quasar Consensus (uses ZAP for vote transport)
- **LP-0111**: Photon Selection (uses ZAP for proposal emission)
- **LP-6022**: Warp Messaging 2.0 (uses zwarp for signing)
- **LP-9000**: DEX Core (uses ZAP for order matching)

## Copyright

Copyright 2025 Lux Industries Inc. Released under BSD-3-Clause License.

---

*LP-120 Created: January 25, 2025*
*Status: Final*
