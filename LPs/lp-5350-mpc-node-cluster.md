---
lp: 5350
title: MPC Node Cluster (github.com/luxfi/mpc)
tags: [mpc, threshold-crypto, custody, wallet]
description: Resilient MPC node cluster for distributed cryptographic wallet generation and signing
author: Lux Industries Inc.
discussions-to: https://github.com/luxfi/lps/discussions
status: Review
type: Standards Track
category: Core
created: 2025-12-25
requires: 7013, 7014, 7340
---

## Abstract

This LP documents `github.com/luxfi/mpc`, a high-performance, open-source Multi-Party Computation (MPC) engine for securely generating and managing cryptographic wallets across distributed nodes. The system enables threshold signatures without ever exposing the full private key, supporting both classical (ECDSA, EdDSA) and post-quantum signature schemes.

## Motivation

Traditional custody solutions have critical weaknesses:

1. **Single Point of Failure**: One compromised key loses all assets
2. **Key Management Complexity**: Secure storage and backup of private keys
3. **Trust Concentration**: Custodians have full control over funds
4. **Quantum Vulnerability**: ECDSA keys will be vulnerable to quantum attacks

Lux MPC solves these by:

- Distributing key shares across multiple nodes (no single party has full key)
- Requiring threshold cooperation for signing (e.g., 2-of-3)
- Supporting key refresh without changing public key
- Integrating with post-quantum schemes via Ringtail

## Specification

### Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              LUX MPC ARCHITECTURE                               │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                           MPC Node Cluster                               │   │
│  │  ┌───────────┐     ┌───────────┐     ┌───────────┐     ┌───────────┐   │   │
│  │  │  Node 1   │     │  Node 2   │     │  Node 3   │ ... │  Node N   │   │   │
│  │  │ (Share 1) │     │ (Share 2) │     │ (Share 3) │     │ (Share N) │   │   │
│  │  └─────┬─────┘     └─────┬─────┘     └─────┬─────┘     └─────┬─────┘   │   │
│  │        │                 │                 │                 │         │   │
│  │        └─────────────────┼─────────────────┼─────────────────┘         │   │
│  │                          │                 │                           │   │
│  │                          ▼                 ▼                           │   │
│  │                    ┌───────────────────────────┐                       │   │
│  │                    │      NATS Messaging       │                       │   │
│  │                    │  (Coordination Layer)     │                       │   │
│  │                    └───────────────────────────┘                       │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                      │                                         │
│                                      ▼                                         │
│  ┌───────────────────────────────────────────────────────────────────────────┐ │
│  │                              Consul                                       │ │
│  │                    (Service Discovery & Health)                           │ │
│  └───────────────────────────────────────────────────────────────────────────┘ │
│                                      │                                         │
│                                      ▼                                         │
│  ┌───────────────────────────────────────────────────────────────────────────┐ │
│  │                            Badger KV                                      │ │
│  │                    (Encrypted Key Share Storage)                          │ │
│  └───────────────────────────────────────────────────────────────────────────┘ │
│                                                                                 │
│  Cryptographic Engine: github.com/luxfi/threshold                              │
│  ├── ECDSA (secp256k1) via CGGMP21                                            │
│  ├── EdDSA (Ed25519) via FROST                                                │
│  ├── Schnorr (secp256k1) via FROST                                            │
│  └── Post-quantum via Ringtail                                                 │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Package Structure

```
github.com/luxfi/mpc/
├── cmd/
│   └── mpc/              # CLI entry point
├── pkg/
│   ├── bridge/           # Bridge integration (B-Chain)
│   ├── client/           # Go client SDK
│   ├── common/           # Shared utilities
│   ├── config/           # Configuration management
│   ├── constant/         # Protocol constants
│   ├── encoding/         # Message encoding
│   ├── encryption/       # age-based encryption
│   ├── keygen/           # Key generation handlers
│   ├── node/             # MPC node implementation
│   ├── protocol/         # Protocol implementations
│   │   └── cggmp21/      # CGGMP21 ECDSA threshold
│   ├── reshare/          # Key resharing logic
│   ├── session/          # Session management
│   ├── sign/             # Signing handlers
│   └── storage/          # Badger KV storage
├── e2e/                  # End-to-end tests
└── images/               # Architecture diagrams
```

### Dependencies

| Component | Purpose |
|-----------|---------|
| **NATS** | Real-time pub/sub messaging for MPC coordination |
| **Badger KV** | Encrypted local storage for key shares |
| **Consul** | Service discovery and health checking |
| **Lux Threshold** | Cryptographic engine (CGGMP21, FROST, LSS) |
| **age** | Modern encryption for key material protection |

### Supported Protocols

| Protocol | Curve | Chains | LP Reference |
|----------|-------|--------|--------------|
| **CGGMP21** | secp256k1 | Bitcoin, Ethereum, EVM L2s | LP-7014, LP-7322 |
| **FROST** | Ed25519 | Solana, Cardano, Polkadot | LP-7104, LP-7321 |
| **FROST** | secp256k1 | Bitcoin Taproot | LP-7321 |
| **LSS** | secp256k1 | Dynamic resharing | LP-7103, LP-7323 |
| **Ringtail** | Lattice | Post-quantum chains | LP-7324 |

### Threshold Configuration

```go
type ThresholdConfig struct {
    Threshold   uint32   // Minimum signers required (t)
    TotalNodes  uint32   // Total number of nodes (n)
    PartyIDs    []string // Unique identifiers for each party
}

// Example: 2-of-3 configuration
config := ThresholdConfig{
    Threshold:  2,
    TotalNodes: 3,
    PartyIDs:   []string{"node1", "node2", "node3"},
}
```

### API Endpoints

#### Key Generation

```
POST /api/v1/keygen
{
    "session_id": "uuid",
    "threshold": 2,
    "total": 3,
    "curve": "secp256k1",
    "protocol": "cggmp21"
}

Response:
{
    "session_id": "uuid",
    "public_key": "0x04...",
    "address": "0x...",
    "status": "completed"
}
```

#### Signing

```
POST /api/v1/sign
{
    "session_id": "uuid",
    "public_key": "0x04...",
    "message_hash": "0x...",
    "signers": ["node1", "node2"]
}

Response:
{
    "session_id": "uuid",
    "signature": "0x...",
    "recovery_id": 0,
    "status": "completed"
}
```

#### Key Refresh

```
POST /api/v1/refresh
{
    "session_id": "uuid",
    "public_key": "0x04...",
    "new_threshold": 3,
    "new_total": 5,
    "new_parties": ["node1", "node2", "node3", "node4", "node5"]
}
```

### Client SDKs

**Go Client**:
```go
import "github.com/luxfi/mpc/pkg/client"

client := client.New(client.Config{
    Nodes: []string{"node1:8080", "node2:8080", "node3:8080"},
})

// Generate key
result, err := client.Keygen(ctx, &client.KeygenRequest{
    Threshold: 2,
    Curve:     "secp256k1",
    Protocol:  "cggmp21",
})

// Sign message
sig, err := client.Sign(ctx, &client.SignRequest{
    PublicKey:   result.PublicKey,
    MessageHash: hash,
    Signers:     []string{"node1", "node2"},
})
```

**TypeScript Client** (github.com/luxfi/mpc-client-ts):
```typescript
import { MPCClient } from '@luxfi/mpc-client';

const client = new MPCClient({
    nodes: ['http://node1:8080', 'http://node2:8080', 'http://node3:8080'],
});

// Generate key
const { publicKey, address } = await client.keygen({
    threshold: 2,
    curve: 'secp256k1',
    protocol: 'cggmp21',
});

// Sign transaction
const signature = await client.sign({
    publicKey,
    messageHash: txHash,
    signers: ['node1', 'node2'],
});
```

## Integration with Lux Ecosystem

### T-Chain (ThresholdVM)

The MPC package provides the off-chain signer component for T-Chain:

1. **SwapSigTx Generation**: MPC nodes produce threshold signatures for swap transactions
2. **Custody Management**: T-Chain tracks key registrations and signer participation
3. **Reward Distribution**: Signers receive rewards based on SLA compliance

### B-Chain (BridgeVM)

Bridge operations use MPC for cross-chain custody:

```go
// Bridge integration
import "github.com/luxfi/mpc/pkg/bridge"

bridgeClient := bridge.NewClient(mpcNodes)

// Sign bridge release
signature, err := bridgeClient.SignRelease(ctx, &bridge.ReleaseRequest{
    DestChain:  "ethereum",
    Recipient:  ethAddress,
    Amount:     amount,
    AssetID:    assetID,
})
```

### Safe Multisig

MPC nodes can act as Safe owners via threshold signer contracts:

1. Deploy `SafeCGGMP21Signer` with MPC public key
2. Add signer contract as Safe owner
3. MPC nodes collaboratively sign Safe transactions

### Private Standalone MPC

For users who want private MPC without using T-Chain:

```bash
# Start 3-node MPC cluster
docker-compose up -d

# Generate wallet
curl -X POST http://localhost:8080/api/v1/keygen \
  -d '{"threshold": 2, "total": 3, "curve": "secp256k1"}'

# Sign message
curl -X POST http://localhost:8080/api/v1/sign \
  -d '{"public_key": "...", "message_hash": "...", "signers": ["node1", "node2"]}'
```

## Deployment

### Docker Compose

```yaml
version: '3.8'
services:
  mpc-node-1:
    image: luxfi/mpc:latest
    environment:
      - NODE_ID=node1
      - NATS_URL=nats://nats:4222
      - CONSUL_ADDR=consul:8500
      - THRESHOLD=2
      - TOTAL_NODES=3
    volumes:
      - ./data/node1:/data

  mpc-node-2:
    image: luxfi/mpc:latest
    environment:
      - NODE_ID=node2
      - NATS_URL=nats://nats:4222
      - CONSUL_ADDR=consul:8500

  mpc-node-3:
    image: luxfi/mpc:latest
    environment:
      - NODE_ID=node3
      - NATS_URL=nats://nats:4222
      - CONSUL_ADDR=consul:8500

  nats:
    image: nats:latest

  consul:
    image: consul:latest
```

### Kubernetes

```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: mpc-nodes
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: mpc
        image: luxfi/mpc:latest
        env:
        - name: NODE_ID
          valueFrom:
            fieldRef:
              fieldPath: metadata.name
```

## Rationale

The MPC node cluster design was chosen because:
1. Threshold signatures eliminate single points of failure
2. CGGMP21 provides identifiable abort for malicious parties
3. gRPC provides efficient binary protocol for node communication
4. Share refresh enables secure key rotation without key regeneration

## Backwards Compatibility

This LP defines new infrastructure and does not affect existing systems.

## Security Considerations

### Key Security

1. **Share Isolation**: Each node only holds a share, never the full key
2. **Encrypted Storage**: Key shares encrypted with age before storage
3. **Memory Protection**: Shares cleared from memory after use
4. **Threshold Security**: Requires t parties to sign (no single compromise)

### Network Security

1. **TLS Everywhere**: All inter-node communication uses TLS
2. **Authentication**: Nodes authenticate via certificates
3. **Message Signing**: Protocol messages are signed by senders
4. **Replay Protection**: Session IDs and nonces prevent replay attacks

### Operational Security

1. **Health Monitoring**: Consul tracks node health
2. **Audit Logging**: All operations logged for compliance
3. **Key Rotation**: Regular key refresh without changing public key
4. **Disaster Recovery**: Share backup and recovery procedures

## Performance

| Operation | Latency (3-of-5) | Throughput |
|-----------|------------------|------------|
| Keygen | ~2s | 50 keys/min |
| Sign (ECDSA) | ~200ms | 300 sigs/sec |
| Sign (EdDSA) | ~150ms | 400 sigs/sec |
| Refresh | ~1s | 60 refresh/min |

## Related LPs

- [LP-7013](/docs/lp-7013): T-Chain Decentralised MPC Custody
- [LP-7014](/docs/lp-7014): T-Chain Threshold Signatures (CGGMP21)
- [LP-7103](/docs/lp-7103): MPC LSS Linear Secret Sharing
- [LP-7104](/docs/lp-7104): FROST Threshold Signatures
- [LP-7340](/docs/lp-7340): Threshold Cryptography Library
- [LP-6015](/docs/lp-6015): MPC Bridge Protocol
- [LP-3310](/docs/lp-3310): Safe Multisig Standard

## References

- [Lux MPC Repository](https://github.com/luxfi/mpc)
- [Lux Threshold Library](https://github.com/luxfi/threshold)
- [TypeScript Client](https://github.com/luxfi/mpc-client-ts)
- [CGGMP21 Paper](https://eprint.iacr.org/2021/060)
- [FROST Paper](https://eprint.iacr.org/2020/852)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
