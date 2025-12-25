---
lp: 38
title: Native Chain Indexer Architecture (github.com/luxfi/indexer)
tags: [indexer, explorer, dag, consensus, api]
description: Multi-chain indexer for Lux Network's native DAG and linear chains
author: Lux Industries Inc.
discussions-to: https://github.com/luxfi/lps/discussions
status: Living
type: Standards Track
category: Core
created: 2025-12-25
---

## Abstract

This LP documents `github.com/luxfi/indexer`, the official multi-chain indexer for Lux Network's native chains. The indexer provides real-time data indexing, persistence, and REST APIs for 7 native chains (P, X, A, B, Q, T, Z) while C-Chain uses Blockscout (Elixir-based EVM indexer).

## Motivation

Lux Network operates multiple chains with different consensus models:

1. **DAG-based Chains** (X, A, B, Q, T, Z): Use vertex/parent model with multiple parents per vertex, enabling fast consensus through parallel processing
2. **Linear Chains** (P): Use block/parent model with single parent, required for strict ordering of validator operations
3. **EVM Chains** (C): Smart contracts indexed by Blockscout

A unified indexer is needed that:

- Understands both DAG and linear consensus models
- Provides real-time WebSocket streaming for live visualization
- Exposes Blockscout-compatible REST APIs
- Scales independently per chain
- Supports multiple storage backends

## Specification

### Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              LUX INDEXER ARCHITECTURE                            │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │                     LUX Explorer Frontend (Next.js)                        │  │
│  │                        explore.lux.network                                 │  │
│  └───────────────────────────────────┬───────────────────────────────────────┘  │
│                                      │                                          │
│            ┌─────────────────────────┴─────────────────────────┐                │
│            ▼                                                   ▼                │
│  ┌─────────────────────┐                       ┌───────────────────────────────┐│
│  │   Blockscout        │                       │   LUX Indexer (this repo)     ││
│  │   (Elixir)          │                       │   (Go)                        ││
│  │                     │                       │                               ││
│  │   C-Chain (EVM)     │                       │   DAG: X, A, B, Q, T, Z       ││
│  │   Port 4000         │                       │   Linear: P                   ││
│  └─────────┬───────────┘                       └───────────────┬───────────────┘│
│            │                                                   │                │
│            └─────────────────────┬─────────────────────────────┘                │
│                                  ▼                                              │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │                            PostgreSQL 15                                   │  │
│  │  explorer_cchain │ explorer_xchain │ explorer_pchain │ explorer_*         │  │
│  └───────────────────────────────────────────────────────────────────────────┘  │
│                                  │                                              │
│                                  ▼                                              │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │                           LUX Node (luxd)                                  │  │
│  │                             Port 9630                                      │  │
│  │   RPC: xvm.* │ pvm.* │ avm.* │ bvm.* │ qvm.* │ tvm.* │ zvm.*              │  │
│  └───────────────────────────────────────────────────────────────────────────┘  │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Chain Configuration

#### DAG-based Chains

| Chain | Port | Database | RPC Endpoint | Description |
|-------|------|----------|--------------|-------------|
| **X-Chain** | 4200 | explorer_xchain | /ext/bc/X | Asset exchange, UTXOs |
| **A-Chain** | 4500 | explorer_achain | /ext/bc/A | AI compute, attestations |
| **B-Chain** | 4600 | explorer_bchain | /ext/bc/B | Cross-chain bridge |
| **Q-Chain** | 4300 | explorer_qchain | /ext/bc/Q | Quantum finality proofs |
| **T-Chain** | 4700 | explorer_tchain | /ext/bc/T | MPC threshold signatures |
| **Z-Chain** | 4400 | explorer_zchain | /ext/bc/Z | Privacy, ZK transactions |

#### Linear Chains

| Chain | Port | Database | RPC Endpoint | Description |
|-------|------|----------|--------------|-------------|
| **P-Chain** | 4100 | explorer_pchain | /ext/bc/P | Platform, validators, staking |

#### EVM Chains (Blockscout)

| Chain | Port | Database | Description |
|-------|------|----------|-------------|
| **C-Chain** | 4000 | explorer_cchain | Smart contracts (Elixir/Blockscout) |

### Package Structure

```
github.com/luxfi/indexer/
├── cmd/
│   └── indexer/              # CLI entry point
├── dag/                       # Shared DAG indexer library
│   ├── dag.go                # Vertex/Edge types
│   ├── websocket.go          # Live DAG streaming
│   └── http.go               # REST API handlers
├── chain/                     # Shared linear chain library
│   ├── chain.go              # Block types
│   └── http.go               # REST API handlers
├── xchain/                    # X-Chain adapter
│   └── adapter.go            # UTXO/Asset parsing
├── achain/                    # A-Chain adapter
│   └── adapter.go            # AI attestation parsing
├── bchain/                    # B-Chain adapter
│   └── adapter.go            # Bridge transfer parsing
├── qchain/                    # Q-Chain adapter
│   └── adapter.go            # Quantum proof parsing
├── tchain/                    # T-Chain adapter
│   └── adapter.go            # MPC signature parsing
├── zchain/                    # Z-Chain adapter
│   └── adapter.go            # Privacy proof parsing
├── pchain/                    # P-Chain adapter
│   └── adapter.go            # Validator/staking parsing
├── storage/                   # Pluggable storage backends
│   ├── storage.go            # Interface
│   ├── postgres.go           # PostgreSQL
│   ├── badger.go             # BadgerDB (embedded)
│   └── dgraph.go             # Dgraph (graph DB)
└── deploy/
    ├── docker/
    └── k8s/
```

### Data Models

#### DAG Vertex

```go
type Vertex struct {
    ID        string          `json:"id"`
    Type      string          `json:"type"`
    ParentIDs []string        `json:"parentIds"`  // Multiple parents (DAG!)
    Height    uint64          `json:"height"`
    Epoch     uint32          `json:"epoch"`
    TxIDs     []string        `json:"txIds"`
    Timestamp time.Time       `json:"timestamp"`
    Status    Status          `json:"status"`     // pending|accepted|rejected
    Data      json.RawMessage `json:"data"`       // Chain-specific
    Metadata  json.RawMessage `json:"metadata"`
}

type Edge struct {
    Source string `json:"source"`
    Target string `json:"target"`
    Type   string `json:"type"`  // parent|input|output|reference
}
```

#### Linear Block

```go
type Block struct {
    ID        string          `json:"id"`
    ParentID  string          `json:"parentId"`  // Single parent (linear!)
    Height    uint64          `json:"height"`
    Timestamp time.Time       `json:"timestamp"`
    Status    Status          `json:"status"`
    TxCount   int             `json:"txCount"`
    TxIDs     []string        `json:"txIds"`
    Data      json.RawMessage `json:"data"`
}
```

### REST API

All indexers expose Blockscout-compatible `/api/v2/` endpoints:

#### DAG Chains (X, A, B, Q, T, Z)

```
GET  /api/v2/stats                    # Chain statistics
GET  /api/v2/vertices                 # List DAG vertices (paginated)
GET  /api/v2/vertices/:id             # Get vertex by ID
GET  /api/v2/edges                    # List DAG edges
GET  /api/v2/edges?vertex=:id         # Get edges for vertex
WS   /api/v2/dag/subscribe            # Live DAG stream
GET  /health                          # Health check
```

#### Linear Chains (P)

```
GET  /api/v2/stats                    # Block statistics
GET  /api/v2/blocks                   # List blocks (paginated)
GET  /api/v2/blocks/:id               # Get block by ID
GET  /api/v2/blocks/height/:height    # Get block by height
WS   /api/v2/blocks/subscribe         # Live block stream
GET  /health                          # Health check
```

### WebSocket Live Streaming

Real-time updates for DAG visualization:

```javascript
const ws = new WebSocket('ws://localhost:4200/api/v2/dag/subscribe');

ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    switch (msg.type) {
        case 'vertex_added':     // New vertex detected
            console.log('New vertex:', msg.data.vertex);
            break;
        case 'edge_added':       // New parent relationship
            console.log('New edge:', msg.data.edge);
            break;
        case 'vertex_accepted':  // Vertex consensus finalized
            console.log('Accepted:', msg.data.vertex.id);
            break;
        case 'heartbeat':        // Keep-alive (30s interval)
            break;
    }
};
```

### Database Schema

#### DAG Tables

```sql
CREATE TABLE {chain}_vertices (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    parent_ids JSONB DEFAULT '[]',
    height BIGINT,
    epoch INT,
    tx_ids JSONB DEFAULT '[]',
    timestamp TIMESTAMPTZ NOT NULL,
    status TEXT DEFAULT 'pending',
    data JSONB,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE {chain}_edges (
    source TEXT NOT NULL,
    target TEXT NOT NULL,
    type TEXT NOT NULL,
    PRIMARY KEY (source, target, type)
);

CREATE TABLE {chain}_stats (
    id INT PRIMARY KEY DEFAULT 1,
    total_vertices BIGINT DEFAULT 0,
    pending_vertices BIGINT DEFAULT 0,
    accepted_vertices BIGINT DEFAULT 0,
    total_edges BIGINT DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_{chain}_vertices_height ON {chain}_vertices(height);
CREATE INDEX idx_{chain}_vertices_timestamp ON {chain}_vertices(timestamp);
CREATE INDEX idx_{chain}_vertices_status ON {chain}_vertices(status);
```

#### Linear Tables

```sql
CREATE TABLE {chain}_blocks (
    id TEXT PRIMARY KEY,
    parent_id TEXT,
    height BIGINT NOT NULL UNIQUE,
    timestamp TIMESTAMPTZ NOT NULL,
    status TEXT DEFAULT 'pending',
    tx_count INT DEFAULT 0,
    tx_ids JSONB DEFAULT '[]',
    data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_{chain}_blocks_height ON {chain}_blocks(height);
CREATE INDEX idx_{chain}_blocks_timestamp ON {chain}_blocks(timestamp);
```

### Adapter Interface

Each chain implements:

```go
// DAG chains
type DAGAdapter interface {
    ParseVertex(data json.RawMessage) (*Vertex, error)
    GetRecentVertices(ctx context.Context, limit int) ([]json.RawMessage, error)
    GetVertexByID(ctx context.Context, id string) (json.RawMessage, error)
    InitSchema(db *sql.DB) error
    GetStats(ctx context.Context, db *sql.DB) (map[string]interface{}, error)
}

// Linear chains
type ChainAdapter interface {
    ParseBlock(data json.RawMessage) (*Block, error)
    GetRecentBlocks(ctx context.Context, limit int) ([]json.RawMessage, error)
    GetBlockByID(ctx context.Context, id string) (json.RawMessage, error)
    GetBlockByHeight(ctx context.Context, height uint64) (json.RawMessage, error)
    InitSchema(db *sql.DB) error
    GetStats(ctx context.Context, db *sql.DB) (map[string]interface{}, error)
}
```

### Chain-Specific Data

#### X-Chain (Exchange)

```go
type XChainVertexData struct {
    UTXOs []struct {
        ID        string   `json:"id"`
        Amount    uint64   `json:"amount"`
        AssetID   string   `json:"assetId"`
        Addresses []string `json:"addresses"`
        Threshold uint32   `json:"threshold"`
        Locktime  uint64   `json:"locktime"`
        Spent     bool     `json:"spent"`
    } `json:"utxos"`
    Assets []struct {
        ID          string `json:"id"`
        Name        string `json:"name"`
        Symbol      string `json:"symbol"`
        Denomination uint8  `json:"denomination"`
        Supply      uint64 `json:"supply"`
    } `json:"assets"`
}
```

#### A-Chain (AI)

```go
type AChainVertexData struct {
    Attestations []struct {
        ID            string `json:"id"`
        Provider      string `json:"provider"`
        TEEQuoteHash  string `json:"teeQuoteHash"`
        ModelHash     string `json:"modelHash"`
        ComputeUnits  uint64 `json:"computeUnits"`
        PrivacyLevel  uint8  `json:"privacyLevel"`
    } `json:"attestations"`
    Inferences []struct {
        ID         string  `json:"id"`
        ModelID    string  `json:"modelId"`
        InputHash  string  `json:"inputHash"`
        OutputHash string  `json:"outputHash"`
        Confidence float64 `json:"confidence"`
        Latency    uint64  `json:"latency"`
    } `json:"inferences"`
}
```

#### T-Chain (Teleport)

```go
type TChainVertexData struct {
    Signatures []struct {
        ID           string   `json:"id"`
        Protocol     string   `json:"protocol"`  // FROST|CGGMP21|LSS
        Threshold    uint32   `json:"threshold"`
        TotalSigners uint32   `json:"totalSigners"`
        PublicKey    string   `json:"publicKey"`
        MessageHash  string   `json:"messageHash"`
        Signature    string   `json:"signature"`
    } `json:"signatures"`
    KeyShares []struct {
        ID          string `json:"id"`
        SessionID   string `json:"sessionId"`
        PartyID     string `json:"partyId"`
        Commitment  string `json:"commitment"`
    } `json:"keyShares"`
}
```

#### Q-Chain (Quantum)

```go
type QChainVertexData struct {
    FinalityProofs []struct {
        ID             string `json:"id"`
        SourceChain    string `json:"sourceChain"`
        SourceBlockID  string `json:"sourceBlockId"`
        SourceHeight   uint64 `json:"sourceHeight"`
        RingtailProof  string `json:"ringtailProof"`
        BLSAggregate   string `json:"blsAggregate"`
    } `json:"finalityProofs"`
}
```

## Deployment

### Docker Compose

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_USER: blockscout
      POSTGRES_PASSWORD: blockscout
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5433:5432"

  xchain-indexer:
    image: luxfi/indexer:latest
    command: ["xchain"]
    environment:
      - RPC_ENDPOINT=http://node:9630/ext/bc/X
      - DATABASE_URL=postgres://blockscout:blockscout@postgres:5432/explorer_xchain
      - HTTP_PORT=4200
    ports:
      - "4200:4200"

  pchain-indexer:
    image: luxfi/indexer:latest
    command: ["pchain"]
    environment:
      - RPC_ENDPOINT=http://node:9630/ext/bc/P
      - DATABASE_URL=postgres://blockscout:blockscout@postgres:5432/explorer_pchain
      - HTTP_PORT=4100
    ports:
      - "4100:4100"

  # ... additional chain indexers
```

### Kubernetes

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: xchain-indexer
spec:
  replicas: 1
  template:
    spec:
      containers:
      - name: indexer
        image: luxfi/indexer:latest
        args: ["xchain"]
        env:
        - name: RPC_ENDPOINT
          value: "http://lux-node:9630/ext/bc/X"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: indexer-secrets
              key: database-url
        ports:
        - containerPort: 4200
        livenessProbe:
          httpGet:
            path: /health
            port: 4200
```

## Performance

| Metric | Value |
|--------|-------|
| Poll Interval | 2 seconds |
| Stats Update | 30 seconds |
| WebSocket Heartbeat | 30 seconds |
| HTTP Timeout | 30 seconds |
| Database Pool | 10 connections |

### Scaling

- **Horizontal**: Run multiple indexer instances behind load balancer
- **Vertical**: Increase connection pool size for high-volume chains
- **Read Replicas**: PostgreSQL read replicas for query scaling

## Security Considerations

1. **Database Access**: Use connection pooling and prepared statements
2. **API Rate Limiting**: Implement per-IP rate limits on REST endpoints
3. **WebSocket Limits**: Maximum 1000 concurrent connections per chain
4. **RPC Authentication**: Support for authenticated RPC endpoints

## Related LPs

- [LP-1136](/docs/lp-1136): X-Chain Order-Book DEX API
- [LP-0098](/docs/lp-0098): GraphDB and GraphQL Engine (G-Chain)
- [LP-7330](/docs/lp-7330): T-Chain ThresholdVM Specification
- [LP-2000](/docs/lp-2000): AI Token and A-Chain Mining
- [LP-7013](/docs/lp-7013): T-Chain MPC Custody

## References

- [LUX Indexer Repository](https://github.com/luxfi/indexer)
- [LUX Consensus](https://github.com/luxfi/consensus) - DAG/Chain data structures
- [LUX Node](https://github.com/luxfi/node) - Blockchain node
- [LUX Explorer](https://github.com/luxfi/explore) - Frontend
- [Blockscout](https://github.com/blockscout/blockscout) - C-Chain indexer

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
