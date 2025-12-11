---
lp: 0332
title: Teleport Bridge Architecture - Unified Cross-Chain Protocol
description: Comprehensive specification for Lux Network's decentralized cross-chain bridge using T-Chain (ThresholdVM) for MPC key management and B-Chain (BridgeVM) for bridge coordination
author: Lux Partners (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Standards Track
category: Core
created: 2025-12-11
requires: 13, 14, 15, 16, 81, 103, 301
tags: [teleport, bridge, cross-chain]
---

> **See also**: [LP-330](./lp-0330-t-chain-thresholdvm-specification.md), [LP-331](./lp-0331-b-chain-bridgevm-specification.md), [LP-333](./lp-0333-dynamic-signer-rotation-with-lss-protocol.md), [LP-334](./lp-0334-per-asset-threshold-key-management.md), [LP-335](./lp-0335-bridge-smart-contract-integration.md), [LP-336](./lp-0336-k-chain-keymanagementvm-specification.md), [LP-INDEX](./LP-INDEX.md)

## Abstract

This LP specifies the Teleport Bridge Architecture, a unified cross-chain protocol for Lux Network that combines T-Chain (ThresholdVM) for MPC key management with B-Chain (BridgeVM) for bridge operation coordination. The architecture enables trustless, decentralized bridging between Lux Network and external blockchains including Ethereum, Bitcoin, Base, Arbitrum, Optimism, and Cosmos IBC chains. A single MPC-generated address works across all EVM-compatible chains, eliminating the need for chain-specific custody solutions. The system uses threshold signatures (CGG21 for ECDSA, LSS for dynamic resharing, and Ringtail for quantum-safe extensions) with configurable t-of-n thresholds, ensuring no single party controls bridged funds. Teleport provides sub-minute finality for intra-Lux transfers and 8-20 minute finality for external chain bridges, processing over 100 TPS with bridge fees under $0.001.

## Related Specifications

This LP is part of the Teleport Bridge specification suite:

| LP | Title | Description |
|----|-------|-------------|
| **LP-330** | [T-Chain (ThresholdVM)](./lp-0330-t-chain-thresholdvm-specification.md) | Threshold signature chain for distributed key management |
| **LP-331** | [B-Chain (BridgeVM)](./lp-0331-b-chain-bridgevm-specification.md) | Bridge coordination chain for cross-chain operations |
| **LP-332** | Teleport Bridge Architecture (this document) | Unified architecture specification |
| **LP-333** | [Dynamic Signer Rotation](./lp-0333-dynamic-signer-rotation-with-lss-protocol.md) | LSS protocol for validator set changes |
| **LP-334** | [Per-Asset Key Management](./lp-0334-per-asset-threshold-key-management.md) | Independent threshold configs per asset |
| **LP-335** | [Bridge Smart Contracts](./lp-0335-bridge-smart-contract-integration.md) | Solidity contract integration |
| **LP-336** | [K-Chain (KeyManagementVM)](./lp-0336-k-chain-keymanagementvm-specification.md) | Post-quantum key encapsulation |

## Motivation

### Current Bridge Landscape

Cross-chain bridges have historically been the weakest link in blockchain security, with over $2.5B lost to bridge exploits since 2020. Existing architectures suffer from:

1. **Centralized Custody**: Single points of failure where compromised keys drain entire TVL
2. **Security Fragmentation**: Multiple bridge implementations with inconsistent security models
3. **Operational Complexity**: Managing separate bridges for each external chain
4. **Quantum Vulnerability**: Classical ECDSA signatures vulnerable to future quantum attacks
5. **No Accountability**: Impossible to identify malicious actors in failed signing sessions

### Teleport Solution

The Teleport Bridge Architecture addresses these challenges by:

1. **Decentralized MPC Custody**: Threshold signatures ensure t-of-n validators must cooperate; no single party ever holds the complete private key
2. **Unified Infrastructure**: One MPC address works on ALL EVM chains - deploy once, bridge everywhere
3. **Identifiable Aborts**: CGG21 protocol pinpoints misbehaving validators for slashing
4. **Dynamic Resharing**: LSS protocol enables validator set changes without rotating public keys
5. **Quantum-Safe Path**: Ringtail lattice-based signatures provide post-quantum protection
6. **Dual-Chain Coordination**: T-Chain manages keys, B-Chain orchestrates operations

### Comparison with Other Bridges

| Bridge | Custody Model | Signature | Finality | Accountability |
|--------|---------------|-----------|----------|----------------|
| **Teleport** | MPC t-of-n | CGG21/LSS/Ringtail | 8 min | Identifiable abort |
| Wormhole | Guardian multisig | ECDSA | 15 min | None |
| LayerZero | Oracle+Relayer | Varies | 12 min | None |
| Axelar | Validator set | Threshold | 10 min | Slashing |
| IBC | Light client | Ed25519 | 6s | Fraud proofs |
| tBTC | GG18 | ECDSA | 20 min | None (migrating) |

## Specification

### Network Architecture

The Teleport system operates across two specialized chains within Lux Network:

```
                     ┌──────────────────────────────────────────────────────┐
                     │                  Lux Primary Network                 │
                     │                                                       │
                     │  ┌─────────────┐              ┌─────────────────────┐│
                     │  │  T-Chain    │◄────────────►│      B-Chain        ││
                     │  │(ThresholdVM)│   Warp Msg   │     (BridgeVM)      ││
                     │  │             │              │                      ││
                     │  │ - Key Gen   │              │ - Bridge Requests   ││
                     │  │ - Signing   │              │ - Asset Registry    ││
                     │  │ - Resharing │              │ - Relayer Coord     ││
                     │  │ - Key Store │              │ - Fee Distribution  ││
                     │  └─────────────┘              └─────────────────────┘│
                     │         │                              │              │
                     │         │      ┌─────────────┐         │              │
                     │         └──────│  K-Chain    │─────────┘              │
                     │                │(KeyMgmtVM)  │                        │
                     │                │ - ML-KEM    │                        │
                     │                │ - Encrypted │                        │
                     │                │   Storage   │                        │
                     │                └─────────────┘                        │
                     │                       │                               │
                     │  ┌──────┴──────────────────────────────┴────────┐    │
                     │  │              Internal Chains                  │    │
                     │  │     C-Chain    X-Chain    P-Chain    Z-Chain  │    │
                     │  └───────────────────────────────────────────────┘    │
                     └──────────────────────────────────────────────────────┘
                                              │
                     ┌────────────────────────┼────────────────────────┐
                     │                        │                        │
              ┌──────┴──────┐          ┌──────┴──────┐          ┌──────┴──────┐
              │  Ethereum   │          │   Bitcoin   │          │   Cosmos    │
              │  + L2s      │          │   + UTXO    │          │   + IBC     │
              │             │          │             │          │             │
              │ Same MPC    │          │ Taproot     │          │ IBC Light   │
              │ Address!    │          │ MuSig2      │          │ Client      │
              └─────────────┘          └─────────────┘          └─────────────┘
```

#### T-Chain (ThresholdVM)

T-Chain is a specialized subnet providing MPC key management. See [LP-330](./lp-0330-t-chain-thresholdvm-specification.md) for complete specification.

**Chain Parameters:**
- **Chain ID**: `T` (Threshold)
- **Consensus**: Lux Snowball++ with 2s finality
- **Block Time**: 500ms
- **Staking Token**: LUX (minimum 5,000 LUX per signer)
- **Threshold**: Configurable t-of-n (default: 2/3 + 1)

**Responsibilities:**
- Distributed key generation (DKG) without trusted dealer
- Threshold signature generation (CGG21, LSS, FROST, Ringtail)
- Proactive key refresh (epoch-based)
- Dynamic resharing for validator rotation (see [LP-333](./lp-0333-dynamic-signer-rotation-with-lss-protocol.md))
- Key share storage and recovery

#### B-Chain (BridgeVM)

B-Chain orchestrates bridge operations. See [LP-331](./lp-0331-b-chain-bridgevm-specification.md) for complete specification.

**Chain Parameters:**
- **Chain ID**: `B` (Bridge)
- **Consensus**: Lux Snowball++ with 2s finality
- **Block Time**: 500ms
- **Staking Token**: LUX (minimum 10,000 LUX per validator)

**Responsibilities:**
- Bridge request processing and validation
- Asset registry management (see [LP-334](./lp-0334-per-asset-threshold-key-management.md))
- Relayer coordination
- Fee calculation and distribution
- Cross-chain message routing
- Emergency pause mechanisms

#### K-Chain (KeyManagementVM)

K-Chain provides post-quantum key management. See [LP-336](./lp-0336-k-chain-keymanagementvm-specification.md) for complete specification.

**Responsibilities:**
- ML-KEM (FIPS 203) key encapsulation
- Encrypted bridge message storage
- Threshold decryption via T-Chain integration
- Hybrid classical/quantum security

### Node Requirements and Configuration

#### Hardware Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| CPU | 8 cores | 16+ cores |
| RAM | 32 GB | 64 GB |
| Storage | 500 GB NVMe | 1 TB NVMe |
| Network | 100 Mbps | 1 Gbps |
| HSM | Optional | Required for mainnet |

### 5-Node Teleport Network Configuration

The Teleport network requires a minimum of 5 nodes running both BridgeVM and ThresholdVM with coordinated key shares. This section provides complete deployment configuration.

#### Network Topology

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                    Teleport Network (5-Node Minimum)                          │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                       │
│  │   Node 1    │    │   Node 2    │    │   Node 3    │                       │
│  │ (Leader)    │◄──►│             │◄──►│             │                       │
│  │             │    │             │    │             │                       │
│  │ Party ID: 1 │    │ Party ID: 2 │    │ Party ID: 3 │                       │
│  │ Share: s_1  │    │ Share: s_2  │    │ Share: s_3  │                       │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘                       │
│         │                  │                  │                               │
│         └──────────────────┼──────────────────┘                               │
│                            │                                                  │
│         ┌──────────────────┼──────────────────┐                               │
│         │                  │                  │                               │
│  ┌──────┴──────┐    ┌──────┴──────┐    ┌─────────────┐                       │
│  │   Node 4    │    │   Node 5    │    │ Standby     │                       │
│  │             │◄──►│             │    │ Nodes       │                       │
│  │             │    │             │    │ (Optional)  │                       │
│  │ Party ID: 4 │    │ Party ID: 5 │    │             │                       │
│  │ Share: s_4  │    │ Share: s_5  │    │             │                       │
│  └─────────────┘    └─────────────┘    └─────────────┘                       │
│                                                                               │
│  Threshold: 3-of-5 (Byzantine fault tolerant: can lose 2 nodes)              │
│  Warp Messaging: Enabled for T-Chain <-> B-Chain communication               │
│                                                                               │
└──────────────────────────────────────────────────────────────────────────────┘
```

#### Node Configuration Files

**teleport-node-config.json** (per-node configuration):

```json
{
  "version": 1,
  "network": {
    "networkId": "teleport-mainnet",
    "chainId": {
      "T": "tchain-mainnet",
      "B": "bchain-mainnet"
    },
    "rpcPort": 9630,
    "stakingPort": 9631,
    "warpEnabled": true
  },
  "node": {
    "nodeId": "NodeID-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    "partyId": 1,
    "keystorePath": "/secure/mpc/keys",
    "stakeAmount": "10000000000000"
  },
  "mpc": {
    "threshold": 3,
    "totalParties": 5,
    "protocol": "lss",
    "quantumSafe": false,
    "refreshEpochBlocks": 43200,
    "signingTimeoutMs": 30000
  },
  "keys": {
    "bridge-main": {
      "protocol": "lss",
      "threshold": 3,
      "parties": 5,
      "curve": "secp256k1",
      "refreshEnabled": true
    },
    "bridge-btc": {
      "protocol": "musig2",
      "threshold": 3,
      "parties": 5,
      "curve": "secp256k1"
    },
    "bridge-quantum": {
      "protocol": "ringtail",
      "threshold": 3,
      "parties": 5,
      "lattice": "dilithium3"
    }
  },
  "security": {
    "hsmEnabled": true,
    "hsmProvider": "yubihsm",
    "auditLogPath": "/var/log/mpc/audit.log",
    "tlsEnabled": true,
    "tlsCertPath": "/etc/teleport/certs/node.crt",
    "tlsKeyPath": "/etc/teleport/certs/node.key"
  },
  "warp": {
    "enabled": true,
    "allowedChains": ["T", "B", "C"],
    "signatureAggregation": true
  }
}
```

#### Network Bootstrap Script

```bash
#!/bin/bash
# bootstrap-teleport-network.sh - Initialize 5-node Teleport network

set -euo pipefail

LUXD_BIN="${LUXD_BIN:-node/build/luxd}"
CONFIG_DIR="${CONFIG_DIR:-/etc/teleport}"
DATA_DIR="${DATA_DIR:-/var/lib/teleport}"
LOG_DIR="${LOG_DIR:-/var/log/teleport}"

# Node endpoints (configure per environment)
declare -A NODES=(
  ["node1"]="10.0.0.1"
  ["node2"]="10.0.0.2"
  ["node3"]="10.0.0.3"
  ["node4"]="10.0.0.4"
  ["node5"]="10.0.0.5"
)

# Bootstrap peers for network formation
BOOTSTRAP_PEERS=""
for node in "${!NODES[@]}"; do
  BOOTSTRAP_PEERS+="${NODES[$node]}:9631,"
done
BOOTSTRAP_PEERS="${BOOTSTRAP_PEERS%,}"

# Start node with Teleport configuration
start_teleport_node() {
  local node_id=$1
  local party_id=$2
  local ip=${NODES[$node_id]}

  echo "Starting Teleport node: $node_id (party $party_id) at $ip"

  $LUXD_BIN \
    --network-id=96369 \
    --public-ip=$ip \
    --http-host=0.0.0.0 \
    --http-port=9630 \
    --staking-port=9631 \
    --staking-enabled=true \
    --staking-tls-cert-file=$CONFIG_DIR/certs/$node_id.crt \
    --staking-tls-key-file=$CONFIG_DIR/certs/$node_id.key \
    --bootstrap-ips=$BOOTSTRAP_PEERS \
    --vm-aliases-file=$CONFIG_DIR/vm-aliases.json \
    --chain-config-dir=$CONFIG_DIR/chains \
    --threshold-party-id=$party_id \
    --threshold-keystore-path=$DATA_DIR/$node_id/mpc \
    --threshold-config=$CONFIG_DIR/threshold-config.json \
    --warp-enabled=true \
    --log-dir=$LOG_DIR/$node_id \
    --log-level=info \
    --db-dir=$DATA_DIR/$node_id/db \
    2>&1 | tee -a $LOG_DIR/$node_id/luxd.log &

  echo "Node $node_id started with PID $!"
}

# Initialize network with all 5 nodes
main() {
  mkdir -p $LOG_DIR $DATA_DIR

  for i in {1..5}; do
    start_teleport_node "node$i" $i
    sleep 2  # Stagger startup
  done

  echo "Waiting for network formation..."
  sleep 30

  # Verify network health
  for node in "${!NODES[@]}"; do
    echo "Checking $node..."
    curl -s http://${NODES[$node]}:9630/ext/health | jq .
  done
}

main "$@"
```

#### VM Aliases Configuration

**vm-aliases.json**:

```json
{
  "tchain-mainnet": "thresholdvm",
  "bchain-mainnet": "bridgevm",
  "keychain-mainnet": "keymanagementvm"
}
```

### Warp Messaging Integration

Teleport uses Lux Warp Messaging for secure cross-chain communication between T-Chain and B-Chain.

#### Warp Message Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Warp Messaging Architecture                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  B-Chain (BridgeVM)                      T-Chain (ThresholdVM)               │
│  ┌────────────────────┐                  ┌────────────────────┐              │
│  │ 1. Withdrawal Req  │                  │ 3. Receive Request │              │
│  │    Created         │                  │    via Warp        │              │
│  │                    │                  │                    │              │
│  │ 2. Send Warp Msg   │─────────────────►│ 4. Validate &      │              │
│  │    (SignRequest)   │   Warp Message   │    Decode          │              │
│  │                    │                  │                    │              │
│  │                    │                  │ 5. MPC Sign        │              │
│  │                    │                  │    (3-of-5)        │              │
│  │                    │                  │                    │              │
│  │ 7. Receive Sig     │◄─────────────────│ 6. Send Warp Msg   │              │
│  │    via Warp        │   Warp Message   │    (Signature)     │              │
│  │                    │                  │                    │              │
│  │ 8. Submit to       │                  └────────────────────┘              │
│  │    External Chain  │                                                      │
│  └────────────────────┘                                                      │
│                                                                              │
│  Warp Message Security:                                                      │
│  - BLS aggregate signatures from subnet validators                           │
│  - Source chain verification via P-Chain state                               │
│  - Replay protection via message nonces                                      │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### Warp Message Types

```go
package warp

import (
	"github.com/luxfi/node/codec"
	"github.com/luxfi/node/ids"
	"github.com/luxfi/node/vms/platformvm/warp"
)

// SignatureRequestPayload is sent from B-Chain to T-Chain
type SignatureRequestPayload struct {
	RequestID   ids.ID   `json:"requestId"`
	KeyID       string   `json:"keyId"`
	MessageHash [32]byte `json:"messageHash"`
	Protocol    string   `json:"protocol"` // "lss", "cgg21", "frost", "ringtail"
	Deadline    uint64   `json:"deadline"`
	Metadata    []byte   `json:"metadata"`
}

// SignatureResponsePayload is sent from T-Chain to B-Chain
type SignatureResponsePayload struct {
	RequestID ids.ID   `json:"requestId"`
	Signature []byte   `json:"signature"`
	R         [32]byte `json:"r"`
	S         [32]byte `json:"s"`
	V         uint8    `json:"v"`
	Signers   []int    `json:"signers"`
	Timestamp uint64   `json:"timestamp"`
}

// CreateSignatureRequestWarpMessage constructs a Warp message for signature request
func CreateSignatureRequestWarpMessage(
	sourceChainID ids.ID,
	payload *SignatureRequestPayload,
) (*warp.UnsignedMessage, error) {
	payloadBytes, err := codec.Marshal(payload)
	if err != nil {
		return nil, err
	}

	return &warp.UnsignedMessage{
		NetworkID:     96369, // LUX mainnet
		SourceChainID: sourceChainID,
		Payload:       payloadBytes,
	}, nil
}

// WarpMessageHandler processes incoming Warp messages on T-Chain
type WarpMessageHandler struct {
	vm          *ThresholdVM
	validator   warp.Validator
}

func (h *WarpMessageHandler) HandleMessage(msg *warp.Message) error {
	// 1. Verify BLS aggregate signature
	if err := h.validator.Verify(msg); err != nil {
		return fmt.Errorf("warp signature invalid: %w", err)
	}

	// 2. Decode payload
	var payload SignatureRequestPayload
	if err := codec.Unmarshal(msg.UnsignedMessage.Payload, &payload); err != nil {
		return fmt.Errorf("decode payload: %w", err)
	}

	// 3. Validate request
	if err := h.validateRequest(&payload); err != nil {
		return fmt.Errorf("invalid request: %w", err)
	}

	// 4. Initiate MPC signing
	return h.vm.ProcessSignatureRequest(&payload)
}
```

#### Warp Configuration

**chains/T/config.json**:

```json
{
  "warp-api-enabled": true,
  "warp-peer-list-gossip-enabled": true,
  "warp-peer-list-gossip-frequency": "1m",
  "warp-signature-request-timeout": "30s",
  "allowed-incoming-warp-source-chains": ["B"],
  "outgoing-warp-destinations": ["B", "C"]
}
```

**chains/B/config.json**:

```json
{
  "warp-api-enabled": true,
  "warp-peer-list-gossip-enabled": true,
  "warp-signature-request-timeout": "30s",
  "allowed-incoming-warp-source-chains": ["T"],
  "outgoing-warp-destinations": ["T", "C"]
}
```

### T-Chain and B-Chain Coordination

The interaction between T-Chain and B-Chain follows a request-response pattern with Warp messaging:

```go
package coordination

import (
	"context"
	"time"

	"github.com/luxfi/node/ids"
	"github.com/luxfi/node/vms/platformvm/warp"
	"github.com/luxfi/bridge/types"
)

// BridgeCoordinator manages T-Chain <-> B-Chain communication
type BridgeCoordinator struct {
	bChainClient    *BChainClient
	tChainClient    *TChainClient
	warpSender      warp.Sender
	pendingRequests map[ids.ID]*SignatureRequest
}

// RequestSignatureForWithdrawal coordinates a withdrawal signature
func (c *BridgeCoordinator) RequestSignatureForWithdrawal(
	ctx context.Context,
	withdrawal *types.WithdrawalRequest,
) (*types.SignatureResult, error) {
	// 1. Prepare signature request
	request := &SignatureRequest{
		RequestID:   ids.GenerateTestID(),
		KeyID:       c.getKeyForAsset(withdrawal.Token),
		MessageHash: withdrawal.Hash(),
		Protocol:    "lss",
		Deadline:    uint64(time.Now().Add(5 * time.Minute).Unix()),
	}

	// 2. Send request to T-Chain via Warp
	warpMsg, err := CreateSignatureRequestWarpMessage(
		c.bChainClient.ChainID(),
		request.ToPayload(),
	)
	if err != nil {
		return nil, fmt.Errorf("create warp message: %w", err)
	}

	signedMsg, err := c.warpSender.SignAndSend(ctx, warpMsg)
	if err != nil {
		return nil, fmt.Errorf("send warp message: %w", err)
	}

	// 3. Track pending request
	c.pendingRequests[request.RequestID] = request

	// 4. Wait for response via Warp callback
	select {
	case result := <-request.ResultChan:
		delete(c.pendingRequests, request.RequestID)
		return result, nil
	case <-ctx.Done():
		return nil, ctx.Err()
	case <-time.After(5 * time.Minute):
		return nil, ErrSignatureTimeout
	}
}

// HandleSignatureResponse processes signature response from T-Chain
func (c *BridgeCoordinator) HandleSignatureResponse(
	msg *warp.Message,
) error {
	var response SignatureResponsePayload
	if err := codec.Unmarshal(msg.Payload, &response); err != nil {
		return err
	}

	request, ok := c.pendingRequests[response.RequestID]
	if !ok {
		return ErrUnknownRequest
	}

	// Deliver result
	request.ResultChan <- &types.SignatureResult{
		Signature: response.Signature,
		R:         response.R,
		S:         response.S,
		V:         response.V,
		Signers:   response.Signers,
	}

	return nil
}
```

### Key Generation Ceremony

The initial key generation creates MPC addresses without any trusted dealer:

```bash
# 1. Initialize key generation ceremony (coordinator)
curl -X POST http://node1:9630/ext/bc/T/rpc \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "threshold_keygen",
    "params": {
      "keyId": "bridge-main",
      "protocol": "lss",
      "threshold": 3,
      "totalParties": 5,
      "curve": "secp256k1",
      "sessionId": "keygen-2025-001"
    }
  }'
# Returns: {"sessionId": "keygen-2025-001", "status": "initiated"}

# 2. Each party participates in DKG rounds (automated)
# Round 1: Polynomial generation and commitment broadcast
# Round 2: Share distribution to each party
# Round 3: Share verification and aggregation

# 3. Retrieve the generated MPC public key / address
curl -X POST http://node1:9630/ext/bc/T/rpc \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "threshold_getAddress",
    "params": {
      "keyId": "bridge-main"
    }
  }'
# Returns: {"address": "0x1234...", "publicKey": "0x04...", "generation": 1}

# 4. Verify key across all parties
curl -X POST http://node1:9630/ext/bc/T/rpc \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "threshold_verifyKey",
    "params": {
      "keyId": "bridge-main",
      "publicKey": "0x04..."
    }
  }'
# Returns: {"verified": true, "signers": [1, 2, 3, 4, 5]}
```

#### DKG Protocol Details

```go
package dkg

import (
	"crypto/elliptic"

	"github.com/luxfi/threshold/curve"
	"github.com/luxfi/threshold/zkproof"
)

// Protocol represents supported threshold protocols
type Protocol string

const (
	ProtocolLSS     Protocol = "lss"
	ProtocolCGG21   Protocol = "cgg21"
	ProtocolFROST   Protocol = "frost"
	ProtocolRingtail Protocol = "ringtail"
)

// DKGSession manages a distributed key generation ceremony
type DKGSession struct {
	SessionID    string
	KeyID        string
	Protocol     Protocol
	Threshold    int            // t
	TotalParties int            // n
	Curve        elliptic.Curve
	State        DKGState
}

// DKGRound1 contains first round data
type DKGRound1 struct {
	PartyID      int
	Coefficients []curve.Scalar  // Random polynomial coefficients
	Commitments  []curve.Point   // C_i = coeff_i * G
	ChainKey     []byte          // Session binding
}

// DKGRound2 contains second round data
type DKGRound2 struct {
	PartyID   int
	Shares    map[int]curve.Scalar  // Encrypted shares for each party
	Proofs    []zkproof.Proof       // Correctness proofs
}

// DKGRound3 contains third round data
type DKGRound3 struct {
	PartyID         int
	AggregatedShare curve.Scalar     // x_i = sum(received shares)
	PublicKey       curve.Point      // Y = sum(C_j,0)
	Verification    []byte           // Final verification proof
}
```

### Bridge Flow: Deposit (External -> Lux)

Complete deposit flow from Ethereum to Lux C-Chain:

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│   User   │     │ Ethereum │     │ Relayer  │     │ B-Chain  │     │ C-Chain  │
└────┬─────┘     └────┬─────┘     └────┬─────┘     └────┬─────┘     └────┬─────┘
     │                 │                 │                 │                 │
     │  1. deposit()   │                 │                 │                 │
     │────────────────►│                 │                 │                 │
     │                 │                 │                 │                 │
     │                 │ 2. Lock tokens  │                 │                 │
     │                 │ Emit Deposit    │                 │                 │
     │                 │ event           │                 │                 │
     │                 │─────────────────►                 │                 │
     │                 │                 │ 3. Observe      │                 │
     │                 │                 │ + Verify        │                 │
     │                 │                 │────────────────►│                 │
     │                 │                 │                 │                 │
     │                 │                 │                 │ 4. Request sig  │
     │                 │                 │                 │ from T-Chain    │
     │                 │                 │                 │─────────────────►
     │                 │                 │                 │    (Warp Msg)   │
     │                 │                 │                 │                 │
     │                 │                 │                 │◄────────────────│
     │                 │                 │                 │ 5. Receive sig  │
     │                 │                 │                 │                 │
     │                 │                 │                 │ 6. Mint tokens  │
     │                 │                 │                 │────────────────►│
     │                 │                 │                 │                 │
     │◄────────────────────────────────────────────────────────────────────────
     │  7. Receive wrapped tokens                                            │
     │                 │                 │                 │                 │
```

#### Deposit Contract Interface

See [LP-335](./lp-0335-bridge-smart-contract-integration.md) for complete contract specification.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

interface ITeleportVault {
    event Deposit(
        bytes32 indexed depositId,
        address indexed token,
        address indexed sender,
        uint256 amount,
        bytes32 destChainId,
        address recipient,
        uint256 timestamp
    );

    event DepositConfirmed(
        bytes32 indexed depositId,
        bytes32 txHash
    );

    struct DepositRequest {
        bytes32 depositId;
        address token;
        address sender;
        uint256 amount;
        bytes32 destChainId;
        address recipient;
        uint256 timestamp;
        uint256 confirmations;
        DepositStatus status;
    }

    enum DepositStatus {
        Pending,
        Confirmed,
        Completed,
        Refunded
    }

    function deposit(
        address token,
        uint256 amount,
        bytes32 destChainId,
        address recipient
    ) external payable returns (bytes32 depositId);

    function depositNative(
        bytes32 destChainId,
        address recipient
    ) external payable returns (bytes32 depositId);

    function getDeposit(bytes32 depositId)
        external view returns (DepositRequest memory);
}

contract TeleportVault is ITeleportVault, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    address public mpcSigner;  // T-Chain MPC address
    uint256 public depositNonce;
    uint256 public minConfirmations = 12;

    mapping(bytes32 => DepositRequest) public deposits;
    mapping(address => bool) public supportedTokens;
    mapping(bytes32 => bool) public supportedChains;

    constructor(address _mpcSigner) {
        mpcSigner = _mpcSigner;
    }

    function deposit(
        address token,
        uint256 amount,
        bytes32 destChainId,
        address recipient
    ) external payable nonReentrant whenNotPaused returns (bytes32 depositId) {
        require(supportedTokens[token], "Token not supported");
        require(supportedChains[destChainId], "Chain not supported");
        require(amount > 0, "Amount must be positive");
        require(recipient != address(0), "Invalid recipient");

        // Transfer tokens to vault
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);

        // Generate unique deposit ID
        depositId = keccak256(abi.encode(
            block.chainid,
            address(this),
            depositNonce++,
            msg.sender,
            block.timestamp
        ));

        // Store deposit
        deposits[depositId] = DepositRequest({
            depositId: depositId,
            token: token,
            sender: msg.sender,
            amount: amount,
            destChainId: destChainId,
            recipient: recipient,
            timestamp: block.timestamp,
            confirmations: 0,
            status: DepositStatus.Pending
        });

        emit Deposit(
            depositId,
            token,
            msg.sender,
            amount,
            destChainId,
            recipient,
            block.timestamp
        );
    }

    function depositNative(
        bytes32 destChainId,
        address recipient
    ) external payable nonReentrant whenNotPaused returns (bytes32 depositId) {
        require(supportedChains[destChainId], "Chain not supported");
        require(msg.value > 0, "Amount must be positive");
        require(recipient != address(0), "Invalid recipient");

        depositId = keccak256(abi.encode(
            block.chainid,
            address(this),
            depositNonce++,
            msg.sender,
            block.timestamp
        ));

        deposits[depositId] = DepositRequest({
            depositId: depositId,
            token: address(0),  // Native token
            sender: msg.sender,
            amount: msg.value,
            destChainId: destChainId,
            recipient: recipient,
            timestamp: block.timestamp,
            confirmations: 0,
            status: DepositStatus.Pending
        });

        emit Deposit(
            depositId,
            address(0),
            msg.sender,
            msg.value,
            destChainId,
            recipient,
            block.timestamp
        );
    }
}
```

### Bridge Flow: Withdraw (Lux -> External)

Complete withdrawal flow from Lux C-Chain to Ethereum:

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│   User   │     │ C-Chain  │     │ B-Chain  │     │ T-Chain  │     │ Ethereum │
└────┬─────┘     └────┬─────┘     └────┬─────┘     └────┬─────┘     └────┬─────┘
     │                 │                 │                 │                 │
     │  1. burn()      │                 │                 │                 │
     │────────────────►│                 │                 │                 │
     │                 │                 │                 │                 │
     │                 │ 2. Burn wrapped │                 │                 │
     │                 │ tokens          │                 │                 │
     │                 │────────────────►│                 │                 │
     │                 │                 │                 │                 │
     │                 │                 │ 3. Validate     │                 │
     │                 │                 │ burn proof      │                 │
     │                 │                 │────────────────►│                 │
     │                 │                 │                 │                 │
     │                 │                 │                 │ 4. MPC Sign     │
     │                 │                 │                 │ release tx      │
     │                 │                 │◄────────────────│                 │
     │                 │                 │ 5. Signature    │                 │
     │                 │                 │                 │                 │
     │                 │                 │ 6. Submit       │                 │
     │                 │                 │ release tx      │                 │
     │                 │                 │────────────────────────────────────►
     │                 │                 │                 │                 │
     │                 │                 │                 │                 │ 7. Verify sig
     │                 │                 │                 │                 │ release tokens
     │                 │                 │                 │                 │
     │◄────────────────────────────────────────────────────────────────────────
     │  8. Receive native tokens                                             │
```

### Supported Chain Types

#### EVM Chains (Same MPC Address)

All EVM-compatible chains use the same MPC-generated secp256k1 address:

| Chain | Chain ID | Teleporter | Vault | Status |
|-------|----------|------------|-------|--------|
| LUX Mainnet | 96369 | 0x5B562e80A56b600d729371eB14fE3B83298D0642 | 0x08c0f48517C6d94Dd18aB5b132CA4A84FB77108e | Active |
| Ethereum | 1 | 0xebD1Ee9BCAaeE50085077651c1a2dD452fc6b72e | 0xcf963Fe4E4cE126047147661e6e06e171f366506 | Active |
| Arbitrum | 42161 | 0xA60429080752484044e529012aA46e1D691f50Ab | 0xE6e3E18F86d5C35ec1E24c0be8672c8AA9989258 | Active |
| Optimism | 10 | 0xbdCE894aEd7d30BA0C0D0B51604ee9d225fc8b95 | 0x37d9fB96722ebDDbC8000386564945864675099B | Active |
| Base | 8453 | 0x37d9fB96722ebDDbC8000386564945864675099B | 0x3226bb1d3055685EFC1b0E49718B909a1c6Ce18d | Active |
| Polygon | 137 | 0xE09C9b6Ed2BADAa97AB00652dF75da05adc6dAeF | 0x217feE2a1a6A31Dda68433270531F56C91EC8D2B | Active |
| BSC | 56 | 0xebD1Ee9BCAaeE50085077651c1a2dD452fc6b72e | 0xcf963Fe4E4cE126047147661e6e06e171f366506 | Active |
| ZOO | 200200 | 0x5B562e80A56b600d729371eB14fE3B83298D0642 | 0x08c0f48517C6d94Dd18aB5b132CA4A84FB77108e | Active |

#### UTXO Chains (Bitcoin, Litecoin)

Bitcoin uses Taproot MuSig2 for threshold signatures:

```go
package bitcoin

import (
	"github.com/btcsuite/btcd/btcutil"
	"github.com/btcsuite/btcd/txscript"
	"github.com/btcsuite/btcd/wire"
	"github.com/luxfi/threshold/musig2"
)

// BitcoinBridge manages BTC custody via MuSig2
type BitcoinBridge struct {
	KeyID       string
	Protocol    string  // "musig2"
	Threshold   int     // 11-of-15
	TaprootAddr string  // bc1p...
	tChain      TChainClient
	chainParams *chaincfg.Params
}

// ProcessDeposit handles incoming BTC deposits
func (b *BitcoinBridge) ProcessDeposit(tx *wire.MsgTx) (*DepositProof, error) {
	// Verify tx sends to our Taproot address
	for _, out := range tx.TxOut {
		addr, err := btcutil.DecodeAddress(
			txscript.ExtractPkScriptAddrs(out.PkScript),
			b.chainParams,
		)
		if err != nil {
			continue
		}
		if addr.String() == b.TaprootAddr {
			return &DepositProof{
				TxID:   tx.TxHash().String(),
				Amount: out.Value,
				Script: out.PkScript,
			}, nil
		}
	}
	return nil, errors.New("no matching output")
}

// SignWithdrawal creates a threshold signature for BTC withdrawal
func (b *BitcoinBridge) SignWithdrawal(
	txHash []byte,
	signers []int,
) (*schnorr.Signature, error) {
	// Request threshold signature from T-Chain
	sig, err := b.tChain.RequestSignature(SignRequest{
		KeyID:       b.KeyID,
		Protocol:    "musig2",
		MessageHash: txHash,
		Signers:     signers,
	})
	if err != nil {
		return nil, err
	}
	return schnorr.ParseSignature(sig)
}
```

### SDK Usage

#### TypeScript SDK

```typescript
import {
  TeleportClient,
  ThresholdClient,
  BridgeClient,
  SignatureRequest,
  DepositParams,
  WithdrawParams,
} from '@luxfi/bridge-sdk';
import { ethers } from 'ethers';

// Initialize Teleport client
const teleport = new TeleportClient({
  network: 'mainnet', // or 'testnet'
  rpcEndpoint: 'http://localhost:9630',
});

// Initialize individual clients
const thresholdClient = new ThresholdClient({
  endpoint: 'http://localhost:9630/ext/bc/T/rpc',
});

const bridgeClient = new BridgeClient({
  endpoint: 'http://localhost:9630/ext/bc/B/rpc',
});

// Helper: wait with timeout
async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Request threshold signature from T-Chain
async function requestSignature(messageHash: string): Promise<string> {
  const request: SignatureRequest = {
    keyId: 'bridge-main',
    messageHash,
    protocol: 'lss',
    deadline: Math.floor(Date.now() / 1000) + 300, // 5 min timeout
  };

  const { sessionId } = await thresholdClient.requestSignature(request);

  // Poll for signature completion
  let result;
  const maxAttempts = 60;
  for (let i = 0; i < maxAttempts; i++) {
    await sleep(1000);
    result = await thresholdClient.getSignature(sessionId);

    if (result.status === 'completed') {
      return result.signature;
    }
    if (result.status === 'failed') {
      throw new Error(`Signing failed: ${result.error}`);
    }
  }

  throw new Error('Signature request timeout');
}

// Bridge deposit: External chain -> Lux
async function bridgeToLux(
  sourceChainId: number,
  token: string,
  amount: bigint,
  recipient: string,
): Promise<string> {
  // 1. Get vault address for source chain
  const vault = await bridgeClient.getVaultAddress(sourceChainId);

  // 2. Approve vault to spend tokens (if ERC20)
  if (token !== ethers.ZeroAddress) {
    const tokenContract = new ethers.Contract(
      token,
      ['function approve(address,uint256) returns (bool)'],
      signer,
    );
    await tokenContract.approve(vault, amount);
  }

  // 3. Initiate deposit
  const depositParams: DepositParams = {
    token,
    amount: amount.toString(),
    destChainId: '96369', // LUX mainnet
    recipient,
  };

  const { depositId, txHash } = await bridgeClient.initiateDeposit(depositParams);
  console.log(`Deposit initiated: ${depositId} (tx: ${txHash})`);

  // 4. Wait for bridge completion
  let status;
  const maxWait = 120; // 10 minutes max
  for (let i = 0; i < maxWait; i++) {
    await sleep(5000);
    status = await bridgeClient.getBridgeStatus(depositId);
    console.log(`Bridge status: ${status.status}`);

    if (status.status === 'completed') {
      return status.destTxHash;
    }
    if (status.status === 'failed') {
      throw new Error(`Bridge failed: ${status.error}`);
    }
  }

  throw new Error('Bridge timeout');
}

// Bridge withdrawal: Lux -> External chain
async function bridgeFromLux(
  wrappedToken: string,
  amount: bigint,
  recipient: string,
  destChainId: string,
): Promise<string> {
  // 1. Burn wrapped tokens on C-Chain
  const withdrawParams: WithdrawParams = {
    token: wrappedToken,
    amount: amount.toString(),
    destChainId,
    recipient,
  };

  const burnTx = await bridgeClient.initiateWithdraw(withdrawParams);
  console.log(`Burn tx: ${burnTx.txHash}`);

  // 2. Get release hash for MPC signature
  const releaseHash = await bridgeClient.getReleaseHash(burnTx.withdrawId);

  // 3. Request MPC signature from T-Chain
  const signature = await requestSignature(releaseHash);
  console.log(`MPC signature obtained`);

  // 4. Submit release on destination chain
  const releaseContract = new ethers.Contract(
    await bridgeClient.getReleaseAddress(destChainId),
    [
      'function release(address,address,uint256,bytes32,bytes32,bytes) external',
    ],
    signer,
  );

  const tx = await releaseContract.release(
    wrappedToken,
    recipient,
    amount,
    ethers.encodeBytes32String('96369'), // source chain
    burnTx.txHash,
    signature,
  );

  const receipt = await tx.wait();
  return receipt.hash;
}

// Get bridge statistics
async function getBridgeStats(): Promise<void> {
  const stats = await bridgeClient.getBridgeStats();
  console.log('Bridge Statistics:');
  console.log(`  Total deposits: ${stats.totalDeposits}`);
  console.log(`  Total withdrawals: ${stats.totalWithdrawals}`);
  console.log(`  TVL: $${stats.totalValueLocked}`);
  console.log(`  24h volume: $${stats.volume24h}`);
}

// Example usage
async function main(): Promise<void> {
  // Bridge 100 USDC from Ethereum to Lux
  const destTxHash = await bridgeToLux(
    1, // Ethereum
    '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC
    100n * 10n ** 6n, // 100 USDC
    '0xYourLuxAddress',
  );
  console.log(`Bridge complete: ${destTxHash}`);
}
```

#### Go SDK

```go
package main

import (
	"context"
	"fmt"
	"math/big"
	"time"

	"github.com/ethereum/go-ethereum/common"
	"github.com/luxfi/sdk/bridge"
	"github.com/luxfi/sdk/threshold"
)

// TeleportClient wraps bridge and threshold clients
type TeleportClient struct {
	threshold *threshold.Client
	bridge    *bridge.Client
}

// NewTeleportClient creates a new Teleport client
func NewTeleportClient(thresholdEndpoint, bridgeEndpoint string) *TeleportClient {
	return &TeleportClient{
		threshold: threshold.NewClient(thresholdEndpoint),
		bridge:    bridge.NewClient(bridgeEndpoint),
	}
}

// RequestSignature requests a threshold signature from T-Chain
func (c *TeleportClient) RequestSignature(
	ctx context.Context,
	keyID string,
	messageHash []byte,
) ([]byte, error) {
	// Initiate signature request
	session, err := c.threshold.RequestSignature(ctx, &threshold.SignatureRequest{
		KeyID:       keyID,
		MessageHash: messageHash,
		Protocol:    "lss",
		Deadline:    uint64(time.Now().Add(5 * time.Minute).Unix()),
	})
	if err != nil {
		return nil, fmt.Errorf("request signature: %w", err)
	}

	// Poll for completion
	ticker := time.NewTicker(time.Second)
	defer ticker.Stop()

	timeout := time.After(5 * time.Minute)

	for {
		select {
		case <-ctx.Done():
			return nil, ctx.Err()
		case <-timeout:
			return nil, fmt.Errorf("signature timeout")
		case <-ticker.C:
			result, err := c.threshold.GetSignature(ctx, session.SessionID)
			if err != nil {
				return nil, err
			}

			switch result.Status {
			case "completed":
				return result.Signature, nil
			case "failed":
				return nil, fmt.Errorf("signing failed: %s", result.Error)
			}
		}
	}
}

// BridgeDeposit initiates a deposit from external chain to Lux
func (c *TeleportClient) BridgeDeposit(
	ctx context.Context,
	token common.Address,
	amount *big.Int,
	destChainID string,
	recipient common.Address,
) (*bridge.DepositResult, error) {
	return c.bridge.InitiateDeposit(ctx, &bridge.DepositParams{
		Token:       token,
		Amount:      amount,
		DestChainID: destChainID,
		Recipient:   recipient,
	})
}

// BridgeWithdraw initiates a withdrawal from Lux to external chain
func (c *TeleportClient) BridgeWithdraw(
	ctx context.Context,
	token common.Address,
	amount *big.Int,
	destChainID string,
	recipient common.Address,
) (*bridge.WithdrawResult, error) {
	// 1. Initiate withdrawal (burn tokens)
	withdrawResult, err := c.bridge.InitiateWithdraw(ctx, &bridge.WithdrawParams{
		Token:       token,
		Amount:      amount,
		DestChainID: destChainID,
		Recipient:   recipient,
	})
	if err != nil {
		return nil, fmt.Errorf("initiate withdraw: %w", err)
	}

	// 2. Get release hash
	releaseHash, err := c.bridge.GetReleaseHash(ctx, withdrawResult.WithdrawID)
	if err != nil {
		return nil, fmt.Errorf("get release hash: %w", err)
	}

	// 3. Request MPC signature
	signature, err := c.RequestSignature(ctx, "bridge-main", releaseHash)
	if err != nil {
		return nil, fmt.Errorf("request signature: %w", err)
	}

	withdrawResult.Signature = signature
	return withdrawResult, nil
}

// GetBridgeStatus returns the status of a bridge operation
func (c *TeleportClient) GetBridgeStatus(
	ctx context.Context,
	txHash string,
) (*bridge.BridgeStatus, error) {
	return c.bridge.GetBridgeStatus(ctx, txHash)
}

// GetTVL returns total value locked in the bridge
func (c *TeleportClient) GetTVL(ctx context.Context) (*bridge.TVLInfo, error) {
	return c.bridge.GetTotalValueLocked(ctx)
}

func main() {
	ctx := context.Background()

	client := NewTeleportClient(
		"http://localhost:9630/ext/bc/T/rpc",
		"http://localhost:9630/ext/bc/B/rpc",
	)

	// Example: Get TVL
	tvl, err := client.GetTVL(ctx)
	if err != nil {
		panic(err)
	}
	fmt.Printf("Total Value Locked: $%s\n", tvl.TotalUSD)

	// Example: Bridge deposit
	deposit, err := client.BridgeDeposit(
		ctx,
		common.HexToAddress("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"), // USDC
		big.NewInt(100_000_000), // 100 USDC
		"96369", // LUX mainnet
		common.HexToAddress("0xYourAddress"),
	)
	if err != nil {
		panic(err)
	}
	fmt.Printf("Deposit ID: %s\n", deposit.DepositID)
}
```

### Deployment Guide

#### Mainnet Deployment

**Prerequisites:**
- 5+ nodes with required hardware specifications
- HSM devices configured (YubiHSM recommended)
- TLS certificates for all nodes
- Minimum 50,000 LUX staked per node

**Step 1: Prepare Configuration**

```bash
# Create deployment directory
mkdir -p /opt/teleport/{config,certs,data,logs}

# Generate node certificates
./scripts/generate-certs.sh --nodes 5 --output /opt/teleport/certs

# Create configuration files
./scripts/generate-configs.sh \
  --network mainnet \
  --threshold 3 \
  --parties 5 \
  --output /opt/teleport/config
```

**Step 2: Deploy Infrastructure**

```bash
# Deploy using provided Ansible playbook
ansible-playbook -i inventory/mainnet.yml deploy-teleport.yml

# Or deploy manually per node
for i in {1..5}; do
  scp -r /opt/teleport node$i:/opt/teleport
  ssh node$i "systemctl enable --now teleport-node"
done
```

**Step 3: Initialize Key Generation**

```bash
# Run DKG ceremony (only once, from coordinator node)
curl -X POST http://node1:9630/ext/bc/T/rpc \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "threshold_keygen",
    "params": {
      "keyId": "bridge-main",
      "protocol": "lss",
      "threshold": 3,
      "totalParties": 5,
      "curve": "secp256k1"
    }
  }'

# Verify key generation completed
for i in {1..5}; do
  curl -s http://node$i:9630/ext/bc/T/rpc \
    -d '{"jsonrpc":"2.0","id":1,"method":"threshold_getAddress","params":{"keyId":"bridge-main"}}' \
    | jq .
done
```

**Step 4: Deploy Bridge Contracts**

```bash
# Deploy contracts to all supported chains
cd ~/work/lux/bridge/contracts

# Deploy to Ethereum
forge script script/DeployVault.s.sol \
  --rpc-url $ETH_RPC \
  --broadcast \
  --verify

# Deploy to LUX C-Chain
forge script script/DeployVault.s.sol \
  --rpc-url http://localhost:9630/ext/bc/C/rpc \
  --broadcast

# Repeat for other chains...
```

**Step 5: Configure Relayers**

```bash
# Start relayer service
cd ~/work/lux/bridge/relayer
./relayer --config /opt/teleport/config/relayer.json
```

#### Testnet Deployment

For testnet, use reduced requirements:

```json
{
  "network": {
    "networkId": "teleport-testnet",
    "chainId": {
      "T": "tchain-testnet",
      "B": "bchain-testnet"
    }
  },
  "mpc": {
    "threshold": 2,
    "totalParties": 3,
    "protocol": "lss"
  }
}
```

```bash
# Deploy testnet with 3 nodes
./scripts/deploy-testnet.sh --nodes 3 --threshold 2
```

#### Monitoring and Operations

```bash
# Health check endpoint
curl http://localhost:9630/ext/health

# T-Chain metrics
curl http://localhost:9630/ext/bc/T/metrics

# B-Chain bridge stats
curl http://localhost:9630/ext/bc/B/rpc \
  -d '{"jsonrpc":"2.0","id":1,"method":"bridge_getStats","params":{}}'

# Monitor signing sessions
curl http://localhost:9630/ext/bc/T/rpc \
  -d '{"jsonrpc":"2.0","id":1,"method":"threshold_getPendingSessions","params":{}}'
```

### Fee Distribution Model

```go
package fees

import "math/big"

// FeeConfig defines bridge fee parameters
type FeeConfig struct {
	BaseFee           uint64  // Minimum fee in LUX (e.g., 0.001)
	PercentageFee     uint64  // Basis points (30 = 0.3%)
	MaxFee            uint64  // Cap on fees

	// Distribution (must sum to 10000)
	ValidatorShare    uint64  // 50% to active signers
	RelayerShare      uint64  // 20% to relayers
	TreasuryShare     uint64  // 20% to DAO insurance fund
	BurnShare         uint64  // 10% burned
}

// CalculateFee computes the bridge fee for a transfer
func (c *FeeConfig) CalculateFee(amount *big.Int) *big.Int {
	// Percentage fee
	percentFee := new(big.Int).Mul(amount, big.NewInt(int64(c.PercentageFee)))
	percentFee.Div(percentFee, big.NewInt(10000))

	// Add base fee
	totalFee := new(big.Int).Add(percentFee, big.NewInt(int64(c.BaseFee)))

	// Apply cap
	maxFee := big.NewInt(int64(c.MaxFee))
	if totalFee.Cmp(maxFee) > 0 {
		return maxFee
	}

	return totalFee
}
```

## Rationale

### Why Two Chains (T-Chain + B-Chain)?

**Separation of Concerns**: T-Chain focuses solely on cryptographic operations (key management, signing), while B-Chain handles business logic (asset tracking, fee distribution, governance). This separation:

1. Isolates cryptographic operations from complex bridge logic
2. Allows independent scaling and optimization
3. Reduces attack surface for key material
4. Enables specialized consensus parameters per chain

### Why CGG21 + LSS + Ringtail?

1. **CGG21**: Best-in-class threshold ECDSA with identifiable aborts - essential for accountability
2. **LSS**: Unique dynamic resharing capability - enables validator rotation without key change (see [LP-333](./lp-0333-dynamic-signer-rotation-with-lss-protocol.md))
3. **Ringtail**: Lattice-based post-quantum protection - future-proofs against quantum attacks

### Why Same MPC Address Across EVM Chains?

1. **Simplified Operations**: One key ceremony covers all EVM chains
2. **Reduced Risk**: Fewer keys means fewer potential compromise vectors
3. **Better UX**: Users interact with one consistent address
4. **Cost Efficient**: Single key refresh covers entire EVM ecosystem

### Why Threshold Signatures Over Multisig?

| Aspect | Threshold Sig | Multisig |
|--------|---------------|----------|
| On-chain verification | Single sig check | n sig checks |
| Gas cost | Constant | Linear in n |
| Key rotation | No tx needed | Requires on-chain update |
| Privacy | Signers hidden | Signers visible |
| Composability | Standard ECDSA | Contract-specific |

## Backwards Compatibility

### Migration from Existing Bridges

1. **Parallel Operation**: Teleport operates alongside existing bridges during transition
2. **Asset Preservation**: Wrapped tokens from legacy bridges can be migrated via burn-mint
3. **API Compatibility**: REST gateway translates legacy HTTP calls to Teleport RPC

### Upgrade Path

```
Phase 1 (Current): Deploy T-Chain + B-Chain with CGG21
Phase 2 (Q1 2025): Enable LSS for dynamic resharing
Phase 3 (Q2 2025): Add Ringtail dual signatures
Phase 4 (Q3 2025): Full quantum-safe transition
```

## Reference Implementation

### Repositories

| Repository | Description | Status |
|------------|-------------|--------|
| [github.com/luxfi/node](https://github.com/luxfi/node) | Lux node with T-Chain (ThresholdVM), B-Chain (BridgeVM) | Active |
| [github.com/luxfi/bridge](https://github.com/luxfi/bridge) | Bridge monorepo (SDK, relayer, UI) | Active |
| [github.com/luxfi/standard](https://github.com/luxfi/standard) | Solidity contracts (Vault, Release, Wrapped) | Active |
| [github.com/luxfi/threshold](https://github.com/luxfi/threshold) | Threshold cryptography (CGG21, LSS, FROST, Ringtail) | Active |
| [github.com/luxfi/sdk](https://github.com/luxfi/sdk) | Client SDK (TypeScript, Go) | Active |

### Local Development

```bash
# Clone repositories
git clone https://github.com/luxfi/node.git ~/work/lux/node
git clone https://github.com/luxfi/bridge.git ~/work/lux/bridge
git clone https://github.com/luxfi/threshold.git ~/work/lux/threshold

# Build node with ThresholdVM and BridgeVM
cd ~/work/lux/node
./scripts/build.sh

# Build threshold library
cd ~/work/lux/threshold
go build ./...
go test -v -race ./...

# Build bridge SDK
cd ~/work/lux/bridge
pnpm install
pnpm build

# Run local test network
cd ~/work/lux/node
./scripts/run-teleport-testnet.sh
```

### Contract Deployments

| Network | Teleporter | Vault | Wrapped Factory |
|---------|------------|-------|-----------------|
| LUX Mainnet (96369) | 0x5B562e80A56b600d729371eB14fE3B83298D0642 | 0x08c0f48517C6d94Dd18aB5b132CA4A84FB77108e | 0x... |
| Ethereum (1) | 0xebD1Ee9BCAaeE50085077651c1a2dD452fc6b72e | 0xcf963Fe4E4cE126047147661e6e06e171f366506 | 0x... |
| Base (8453) | 0x37d9fB96722ebDDbC8000386564945864675099B | 0x3226bb1d3055685EFC1b0E49718B909a1c6Ce18d | 0x... |

## Security Considerations

### Threat Model

**Adversary Capabilities:**
- Can corrupt up to t-1 of n signer nodes (Byzantine fault tolerance)
- Can delay network messages up to bounded time
- Cannot break cryptographic assumptions (ECDSA, Paillier, LWE)
- Cannot compromise HSM-protected key shares

**Security Properties:**

1. **Unforgeability**: Adversary cannot produce valid signature without t honest parties
2. **Robustness**: Protocol completes despite t-1 malicious parties
3. **Privacy**: No party learns the full private key
4. **Identifiability**: Misbehaving parties are identified for slashing

### Bridge-Specific Threats

| Threat | Impact | Mitigation |
|--------|--------|------------|
| Key Compromise | Total TVL loss | t-of-n threshold, HSM storage, proactive refresh |
| Eclipse Attack | Isolate honest nodes | Diverse network topology, multi-provider connections |
| Double Spend | Duplicate claims | Strict ordering, nonce tracking, finality requirements |
| Replay Attack | Reuse old signatures | Chain-specific domain separators, nonces, expiry |
| Oracle Manipulation | Wrong asset pricing | Multi-source oracles, TWAP, circuit breakers |
| Smart Contract Bug | Fund drainage | Multiple audits, formal verification, upgrade timelock |
| Quantum Attack | Future key extraction | Ringtail dual signatures, migration path |

### Operational Security

1. **Key Management**
   - Hardware Security Modules (HSM) for production
   - Geographic distribution of signers
   - Regular key refresh (every 24 hours)

2. **Monitoring**
   - Real-time TVL tracking
   - Anomaly detection for unusual volumes
   - Alert thresholds for large transfers

3. **Emergency Procedures**
   - Governance-controlled pause mechanism
   - Multi-day timelock on large withdrawals
   - Insurance fund from fee accumulation

### Audit Requirements

- [ ] Cryptography audit (Trail of Bits)
- [ ] Smart contract audit (OpenZeppelin)
- [ ] Economic audit (Gauntlet)
- [ ] Quantum-safe assessment (ISARA)
- [ ] Penetration testing (ongoing)

## Test Cases

See the full test suite in [github.com/luxfi/bridge/tests](https://github.com/luxfi/bridge/tree/main/tests).

## Economic Impact

### Fee Structure

| Transfer Amount | Fee (%) | Min Fee | Max Fee |
|-----------------|---------|---------|---------|
| < $1,000 | 0.30% | $0.001 | $3.00 |
| $1,000 - $100,000 | 0.20% | $3.00 | $200.00 |
| > $100,000 | 0.10% | $100.00 | $1,000.00 |

### Revenue Distribution

```
50% -> Validator rewards (active signers)
20% -> Relayer incentives
20% -> DAO treasury (insurance fund)
10% -> LUX token burn
```

### Economic Security

- **Minimum Stake**: 10,000 LUX per validator
- **Slashing**: 20% of stake for malicious behavior
- **Insurance Cap**: 10% of bridge TVL

## Open Questions

1. **Quantum Timeline**: When should dual signatures become mandatory?
2. **Signer Economics**: Optimal stake requirements and reward rates?
3. **Cross-L2 Optimization**: Direct L2-to-L2 paths or always via mainnet?
4. **IBC Integration**: Full Cosmos interoperability scope?

## Copyright

Copyright and related rights waived via [CC0](../LICENSE.md).
