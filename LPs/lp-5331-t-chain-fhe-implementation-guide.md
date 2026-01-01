---
lp: 5331
title: T-Chain FHE Implementation Guide
description: Complete implementation guide for T-Chain threshold FHE with RPC API, security hardening, and integration patterns
author: Lux Protocol Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Final
type: Informational
category: Core
created: 2025-12-28
requires: 203, 5330, 5103
tags: [fhe, threshold-crypto, implementation, rpc, security]
order: 5331
---

# LP-5331: T-Chain FHE Implementation Guide

## Abstract

This LP provides comprehensive implementation documentation for the T-Chain Fully Homomorphic Encryption (FHE) module. It covers the production implementation details, RPC API specification, security hardening measures, and integration patterns for developers building on Lux Network's threshold FHE infrastructure.

## Implementation Overview

The T-Chain FHE module provides threshold decryption capabilities where no single party holds the complete secret key. The implementation uses:

- **CKKS Scheme**: For approximate arithmetic on encrypted data
- **Lattice-based Multiparty Protocol**: From `luxfi/lattice/multiparty` for threshold operations
- **67-of-100 Threshold**: Default committee configuration
- **Warp Messaging**: For cross-chain FHE requests and results

### Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        T-Chain FHE Architecture                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐  │
│  │   RPC Layer     │     │  Handler Layer  │     │  Relayer Layer  │  │
│  │  (TFHEService)  │◄───►│  (WarpHandler)  │◄───►│   (Relayer)     │  │
│  └────────┬────────┘     └────────┬────────┘     └────────┬────────┘  │
│           │                       │                       │            │
│           ▼                       ▼                       ▼            │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │                      Integration Layer                           │  │
│  │                  (ThresholdFHEIntegration)                       │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │  │
│  │  │   Sessions   │  │   Shares     │  │   Results    │          │  │
│  │  │   (map)      │  │   (collect)  │  │   (combine)  │          │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘          │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                │                                       │
│                                ▼                                       │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │                      Lifecycle Layer                             │  │
│  │                    (LifecycleManager)                            │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │  │
│  │  │     DKG      │  │    Epoch     │  │     Key      │          │  │
│  │  │  Ceremonies  │  │  Transitions │  │   Rotation   │          │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘          │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                │                                       │
│                                ▼                                       │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │                      Registry Layer                              │  │
│  │                        (Registry)                                │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │  │
│  │  │  Ciphertexts │  │   Permits    │  │  Committees  │          │  │
│  │  │   (handles)  │  │   (access)   │  │   (epochs)   │          │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘          │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. LifecycleManager

Manages DKG ceremonies, epoch transitions, and key rotation.

```go
// Location: vms/thresholdvm/fhe/lifecycle.go

type LifecycleManager struct {
    config            *LifecycleConfig
    registry          *Registry
    currentEpoch      uint64
    currentDKG        *DKGCeremony
    currentTransition *TransitionState
    
    // Callbacks (invoked WITHOUT holding mutex - deadlock safe)
    onEpochChange     func(oldEpoch, newEpoch uint64)
    onDKGComplete     func(epoch uint64, publicKey []byte)
}

type LifecycleConfig struct {
    CommitteeSize     int           // Default: 100
    Threshold         int           // Default: 67 (2/3 + 1)
    EpochBlocks       uint64        // Blocks per epoch
    DKGTimeout        time.Duration // Default: 5 minutes
    KeyRotationBlocks uint64        // Rotation interval
}
```

**DKG Ceremony Phases:**
1. `DKGPending` - Ceremony created, awaiting participants
2. `DKGCommitPhase` - Collecting Feldman commitments
3. `DKGSharePhase` - Collecting encrypted shares
4. `DKGCompleted` - Key generated successfully
5. `DKGFailed` - Ceremony failed (timeout, malicious actor)

### 2. Registry

Persistent storage for ciphertexts, permits, and committee state.

```go
// Location: vms/thresholdvm/fhe/registry.go

type Registry struct {
    db    database.Database
    mu    sync.RWMutex  // Protects all compound operations
    epoch uint64
}

// Key operations - all TOCTOU-safe with mutex protection
func (r *Registry) RegisterCiphertext(meta *CiphertextMeta) error
func (r *Registry) GetCiphertextMeta(handle [32]byte) (*CiphertextMeta, error)
func (r *Registry) CreatePermit(permit *Permit) error
func (r *Registry) ValidatePermit(handle, permitID [32]byte, requester [20]byte) error
func (r *Registry) AddCommitteeMember(member *CommitteeMember) error
func (r *Registry) SetEpoch(epoch uint64, info *EpochInfo) error
```

### 3. ThresholdFHEIntegration

Core threshold decryption logic using lattice multiparty.

```go
// Location: vms/thresholdvm/fhe/integration.go

type ThresholdFHEIntegration struct {
    config     *ThresholdConfig
    sessions   map[[32]byte]*DecryptionSession
    combiner   *multiparty.Combiner  // luxfi/lattice/multiparty
}

func DefaultThresholdConfig() *ThresholdConfig {
    return &ThresholdConfig{
        Threshold:         67,
        TotalParties:      100,
        SessionTimeout:    30 * time.Second,
        MaxConcurrentSessions: 1000,
        
        // CKKS Parameters
        LogN:              14,
        LogQ:              []int{55, 40, 40, 40, 40},
        LogP:              []int{55, 55},
        LogSlots:          13,
    }
}
```

### 4. Warp Payloads

Cross-chain message formats for FHE operations.

```go
// Location: vms/thresholdvm/fhe/warp_payloads.go

// Version and type constants
const (
    PayloadVersionV1              = 0x01
    PayloadTypeFHEDecryptRequestV1 = 0x01
    PayloadTypeFHEDecryptResultV1  = 0x02
    PayloadTypeFHEReencryptRequestV1 = 0x03
    PayloadTypeFHETaskResultV1     = 0x04
    PayloadTypeFHEKeyRotationV1    = 0x05
)

// Decrypt request - 202 bytes fixed
type FHEDecryptRequestV1 struct {
    RequestID        [32]byte  // Unique request identifier
    CiphertextHandle [32]byte  // Handle to encrypted data
    PermitID         [32]byte  // Access permit
    SourceChainID    ids.ID    // Origin chain
    Epoch            uint64    // Committee epoch
    Nonce            uint64    // Replay prevention
    Expiry           int64     // Unix timestamp expiry
    Requester        [20]byte  // Caller address
    Callback         [20]byte  // Callback contract
    CallbackSelector [4]byte   // Function selector
    GasLimit         uint64    // Gas for callback
}

// Decrypt result - 207+ bytes
type FHEDecryptResultV1 struct {
    RequestID          [32]byte  // Matching request ID
    ResultHandle       [32]byte  // Result identifier
    SourceChainID      ids.ID    // T-chain ID
    Epoch              uint64    // Signing epoch
    Status             uint8     // Success/Failed/Expired/Denied
    CommitteeSignature [96]byte  // BLS12-381 aggregate signature
    Plaintext          []byte    // Decrypted data
}
```

## RPC API Specification

All RPC methods use the `tfhe_` namespace and follow JSON-RPC 2.0.

### Connection

```bash
# HTTP
curl -X POST -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"tfhe_getNetworkKey","params":[],"id":1}' \
  http://localhost:9650/ext/bc/T/rpc

# WebSocket
wscat -c ws://localhost:9650/ext/bc/T/ws
```

### Methods

#### tfhe_registerCiphertext

Register a new ciphertext handle with metadata.

**Request:**
```json
{
  "jsonrpc": "2.0",
  "method": "tfhe_registerCiphertext",
  "params": {
    "handle": "0x1234...5678",
    "owner": "0xabcd...ef01",
    "fheType": 4,
    "encryptedSize": 32768
  },
  "id": 1
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "result": {
    "success": true,
    "registeredAt": 1735344000
  },
  "id": 1
}
```

**Authentication:** Requires caller to match `owner` when Authenticator is configured.

---

#### tfhe_getCiphertextMeta

Retrieve metadata for a ciphertext handle.

**Request:**
```json
{
  "jsonrpc": "2.0",
  "method": "tfhe_getCiphertextMeta",
  "params": {
    "handle": "0x1234...5678"
  },
  "id": 1
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "result": {
    "handle": "0x1234...5678",
    "owner": "0xabcd...ef01",
    "fheType": 4,
    "encryptedSize": 32768,
    "registeredAt": 1735344000,
    "epoch": 5
  },
  "id": 1
}
```

---

#### tfhe_createPermit

Create an access permit for a ciphertext.

**Request:**
```json
{
  "jsonrpc": "2.0",
  "method": "tfhe_createPermit",
  "params": {
    "ciphertextHandle": "0x1234...5678",
    "grantor": "0xabcd...ef01",
    "grantee": "0x9876...5432",
    "permissions": 7,
    "expiry": 1735430400
  },
  "id": 1
}
```

**Permissions bitmap:**
- `0x01` - Read (decrypt)
- `0x02` - Compute (use in operations)
- `0x04` - Transfer (grant to others)

**Response:**
```json
{
  "jsonrpc": "2.0",
  "result": {
    "permitID": "0xfedc...ba98",
    "createdAt": 1735344000
  },
  "id": 1
}
```

**Authentication:** Requires caller to match `grantor`.

---

#### tfhe_decrypt

Request threshold decryption of a ciphertext.

**Request:**
```json
{
  "jsonrpc": "2.0",
  "method": "tfhe_decrypt",
  "params": {
    "ciphertextHandle": "0x1234...5678",
    "permitID": "0xfedc...ba98",
    "callback": "0x1111...2222",
    "callbackSelector": "0xabcdef12",
    "gasLimit": 100000
  },
  "id": 1
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "result": {
    "requestID": "0xaaaa...bbbb",
    "estimatedBlocks": 3,
    "epoch": 5
  },
  "id": 1
}
```

---

#### tfhe_getDecryptResult

Get the result of a decryption request.

**Request:**
```json
{
  "jsonrpc": "2.0",
  "method": "tfhe_getDecryptResult",
  "params": {
    "requestID": "0xaaaa...bbbb"
  },
  "id": 1
}
```

**Response (pending):**
```json
{
  "jsonrpc": "2.0",
  "result": {
    "status": "pending",
    "sharesCollected": 45,
    "threshold": 67
  },
  "id": 1
}
```

**Response (completed):**
```json
{
  "jsonrpc": "2.0",
  "result": {
    "status": "success",
    "plaintext": "0x00000000000000000000000000000064",
    "signature": "0x...",
    "completedAt": 1735344100
  },
  "id": 1
}
```

---

#### tfhe_getDecryptBatchResult

Get results for multiple decryption requests.

**Request:**
```json
{
  "jsonrpc": "2.0",
  "method": "tfhe_getDecryptBatchResult",
  "params": {
    "requestIDs": [
      "0xaaaa...bbbb",
      "0xcccc...dddd"
    ]
  },
  "id": 1
}
```

**Limit:** Maximum 100 requests per batch (returns `ErrBatchTooLarge` if exceeded).

---

#### tfhe_decryptBatch

Request decryption of multiple ciphertexts atomically.

**Request:**
```json
{
  "jsonrpc": "2.0",
  "method": "tfhe_decryptBatch",
  "params": {
    "requests": [
      {
        "ciphertextHandle": "0x1234...5678",
        "permitID": "0xfedc...ba98"
      },
      {
        "ciphertextHandle": "0x2345...6789",
        "permitID": "0xedcb...a987"
      }
    ],
    "callback": "0x1111...2222",
    "callbackSelector": "0xabcdef12",
    "gasLimit": 200000
  },
  "id": 1
}
```

**Limit:** Maximum 100 requests per batch.

---

#### tfhe_getNetworkKey

Get the current network public key for encryption.

**Request:**
```json
{
  "jsonrpc": "2.0",
  "method": "tfhe_getNetworkKey",
  "params": {},
  "id": 1
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "result": {
    "publicKey": "0x...",
    "epoch": 5,
    "validUntilBlock": 1000000
  },
  "id": 1
}
```

---

#### tfhe_getCommitteeInfo

Get current committee information.

**Request:**
```json
{
  "jsonrpc": "2.0",
  "method": "tfhe_getCommitteeInfo",
  "params": {
    "epoch": 5
  },
  "id": 1
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "result": {
    "epoch": 5,
    "threshold": 67,
    "totalMembers": 100,
    "members": ["NodeID-...", "NodeID-...", ...],
    "publicKey": "0x...",
    "startBlock": 900000,
    "endBlock": 1000000
  },
  "id": 1
}
```

---

#### tfhe_getEpochInfo

Get epoch transition information.

**Request:**
```json
{
  "jsonrpc": "2.0",
  "method": "tfhe_getEpochInfo",
  "params": {
    "epoch": 5
  },
  "id": 1
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "result": {
    "epoch": 5,
    "status": "active",
    "startBlock": 900000,
    "dkgCompletedAt": 1735300000,
    "transitionStatus": "finalized"
  },
  "id": 1
}
```

## Security Hardening

The implementation includes comprehensive security measures addressing all CTO audit findings:

### 1. DKG Timeout Enforcement

DKG ceremonies that exceed the configured timeout are automatically failed:

```go
// In OnBlock - enforced every block
if lm.currentDKG != nil && 
   lm.currentDKG.Status != DKGCompleted && 
   lm.currentDKG.Status != DKGFailed {
    startTime := time.Unix(lm.currentDKG.StartedAt, 0)
    if time.Since(startTime) > lm.config.DKGTimeout {
        lm.currentDKG.Status = DKGFailed
        lm.currentDKG.Error = "DKG ceremony timed out"
        // Also fail associated transition
        if lm.currentTransition != nil {
            lm.currentTransition.Status = TransitionFailed
        }
    }
}
```

**Configuration:** Default 5 minutes, configurable via `LifecycleConfig.DKGTimeout`.

### 2. Callback Deadlock Prevention

All callbacks are invoked AFTER releasing the mutex to prevent deadlock:

```go
// Pattern used throughout lifecycle.go
func (lm *LifecycleManager) OnBlock(blockHeight uint64) error {
    var cb *deferredCallback
    
    func() {
        lm.mu.Lock()
        defer lm.mu.Unlock()
        // ... work that produces callback ...
        cb, _ = lm.finalizeTransitionLocked()
    }()
    
    // Callback invoked WITHOUT holding mutex
    lm.invokeCallback(cb)
    return nil
}
```

### 3. DKG Participant Validation

Only registered committee members can submit DKG shares:

```go
func (lm *LifecycleManager) SubmitDKGShare(nodeID ids.NodeID, share *DKGShare) error {
    // Verify participant is in committee
    found := false
    for _, p := range lm.currentDKG.Participants {
        if p == nodeID {
            found = true
            break
        }
    }
    if !found {
        return fmt.Errorf("node %s not a DKG participant", nodeID)
    }
    // ... continue with share validation
}
```

### 4. Commitment Verification

Shares are verified against Feldman commitments before acceptance:

```go
// Using luxfi/lattice/multiparty for verification
if !multiparty.VerifyShare(share.ShareData, share.Commitment, share.Index) {
    return fmt.Errorf("share verification failed for node %s", nodeID)
}
```

### 5. TOCTOU Race Prevention

All compound read-modify-write operations are protected by mutex:

```go
func (r *Registry) UpdateDecryptRequest(...) error {
    r.mu.Lock()           // Lock BEFORE read
    defer r.mu.Unlock()
    
    data, _ := r.db.Get(key)  // Read
    // ... unmarshal, modify ...
    return r.db.Put(key, updatedData)  // Write - still under lock
}
```

### 6. Request Expiry Validation

Warp messages with expired timestamps are rejected:

```go
func (r *FHEDecryptRequestV1) Validate() error {
    if r.Expiry > 0 && time.Now().Unix() > r.Expiry {
        return ErrRequestExpired
    }
    return nil
}

// Automatically called during ParsePayload
```

### 7. RPC Authentication

Sensitive RPC methods verify caller identity:

```go
type Authenticator interface {
    GetCallerAddress(ctx context.Context) ([20]byte, error)
}

func (s *FHEService) CreatePermit(ctx context.Context, args *CreatePermitArgs, ...) error {
    if s.auth != nil {
        caller, err := s.auth.GetCallerAddress(ctx)
        if err != nil {
            return ErrAuthRequired
        }
        if caller != grantor {
            return ErrUnauthorized
        }
    }
    // ... create permit
}
```

**Configuration:** Pass authenticator via `WithAuthenticator(auth)` option.

### 8. Batch Size Limits

DoS prevention via batch size validation:

```go
const MaxBatchSize = 100

func (s *FHEService) GetDecryptBatchResult(...) error {
    if len(args.RequestIDs) > MaxBatchSize {
        return ErrBatchTooLarge
    }
    // ... process batch
}
```

### 9. BLS Signature Size

Correct BLS12-381 signature size (96 bytes, not 32):

```go
type FHEDecryptResultV1 struct {
    // ...
    CommitteeSignature [96]byte  // BLS12-381 G2 point (96 bytes)
    // ...
}
```

### 10. Constant-Time Comparisons

Permit validation uses constant-time comparison to prevent timing attacks:

```go
import "crypto/subtle"

func (r *Registry) ValidatePermit(handle, permitID [32]byte, requester [20]byte) error {
    // Constant-time comparison
    if subtle.ConstantTimeCompare(permit.Grantee[:], requester[:]) != 1 {
        return ErrPermitDenied
    }
    // ...
}
```

### 11. State Persistence

Registry state is persisted to disk, surviving restarts:

```go
func NewRegistry(db database.Database) (*Registry, error) {
    r := &Registry{db: db}
    // Restore epoch from database
    if epochData, err := db.Get(currentEpochKey); err == nil {
        r.epoch = binary.BigEndian.Uint64(epochData)
    }
    return r, nil
}
```

## Integration Patterns

### Smart Contract Integration (Solidity)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {TFHE} from "@lux/fhe/TFHE.sol";
import {Gateway} from "@lux/fhe/Gateway.sol";

contract PrivateVoting {
    // Encrypted vote counts
    euint32 public yesVotes;
    euint32 public noVotes;
    
    // Request decryption of final results
    function revealResults() external {
        // Request async decryption
        uint256[] memory cts = new uint256[](2);
        cts[0] = Gateway.toUint256(yesVotes);
        cts[1] = Gateway.toUint256(noVotes);
        
        FHE.decrypt(
            cts,
            this.receiveResults.selector,
            0,  // No additional params
            block.timestamp + 1 hours,  // Expiry
            false  // Not trustless
        );
    }
    
    // Callback receives decrypted values
    function receiveResults(
        uint256 requestId,
        uint32 decryptedYes,
        uint32 decryptedNo
    ) external onlyGateway {
        emit ResultsRevealed(decryptedYes, decryptedNo);
    }
}
```

### Go SDK Integration

```go
import (
    "github.com/luxfi/node/vms/thresholdvm/fhe"
    "github.com/luxfi/lattice/tfhe"
)

func main() {
    // Connect to T-chain
    client, _ := rpc.Dial("http://localhost:9650/ext/bc/T/rpc")
    
    // Get network public key
    var keyResult struct {
        PublicKey string `json:"publicKey"`
        Epoch     uint64 `json:"epoch"`
    }
    client.Call(&keyResult, "tfhe_getNetworkKey")
    
    // Encrypt data locally
    pk := tfhe.UnmarshalPublicKey(keyResult.PublicKey)
    encrypted := tfhe.EncryptUint32(pk, 42)
    
    // Register ciphertext
    handle := sha256.Sum256(encrypted)
    client.Call(nil, "tfhe_registerCiphertext", map[string]interface{}{
        "handle": hex.EncodeToString(handle[:]),
        "owner":  myAddress,
        "fheType": 4,  // euint32
    })
    
    // Request decryption
    var decryptResult struct {
        RequestID string `json:"requestID"`
    }
    client.Call(&decryptResult, "tfhe_decrypt", map[string]interface{}{
        "ciphertextHandle": hex.EncodeToString(handle[:]),
        "permitID": permitID,
        "callback": callbackAddress,
        "callbackSelector": "0x12345678",
        "gasLimit": 100000,
    })
    
    // Poll for result
    for {
        var result struct {
            Status    string `json:"status"`
            Plaintext string `json:"plaintext"`
        }
        client.Call(&result, "tfhe_getDecryptResult", map[string]interface{}{
            "requestID": decryptResult.RequestID,
        })
        
        if result.Status == "success" {
            fmt.Printf("Decrypted: %s\n", result.Plaintext)
            break
        }
        time.Sleep(time.Second)
    }
}
```

### TypeScript SDK Integration

```typescript
import { TFHEClient, EncryptedValue } from '@luxfi/tfhe-sdk';

async function example() {
  // Connect to T-chain
  const client = new TFHEClient('http://localhost:9650/ext/bc/T/rpc');
  
  // Get network key
  const { publicKey, epoch } = await client.getNetworkKey();
  
  // Encrypt value
  const encrypted = await client.encrypt(42n, 'euint32');
  
  // Register ciphertext
  const handle = await client.registerCiphertext({
    encrypted,
    owner: myAddress,
  });
  
  // Create permit
  const permit = await client.createPermit({
    handle,
    grantee: contractAddress,
    permissions: ['read', 'compute'],
    expiry: Date.now() + 3600_000, // 1 hour
  });
  
  // Request decryption
  const requestId = await client.decrypt({
    handle,
    permitId: permit.id,
    callback: {
      address: contractAddress,
      selector: '0x12345678',
      gasLimit: 100_000n,
    },
  });
  
  // Wait for result
  const result = await client.waitForDecryptResult(requestId, {
    timeout: 30_000,
    pollInterval: 1_000,
  });
  
  console.log('Decrypted:', result.plaintext);
}
```

## Error Codes

| Code | Name | Description |
|------|------|-------------|
| `ErrCiphertextNotFound` | Ciphertext not registered | Handle not in registry |
| `ErrPermitNotFound` | Permit not found | Invalid permit ID |
| `ErrPermitExpired` | Permit has expired | Permit past expiry time |
| `ErrPermitDenied` | Permission denied | Caller not authorized |
| `ErrRequestExpired` | Request has expired | Warp message past expiry |
| `ErrBatchTooLarge` | Batch size exceeds limit | More than 100 items |
| `ErrDKGNotActive` | No active DKG ceremony | DKG not in progress |
| `ErrNotParticipant` | Not a DKG participant | Node not in committee |
| `ErrShareVerificationFailed` | Share verification failed | Invalid Feldman proof |
| `ErrEpochMismatch` | Epoch mismatch | Request for wrong epoch |
| `ErrAuthRequired` | Authentication required | No auth context |
| `ErrUnauthorized` | Caller not authorized | Auth mismatch |

## Test Coverage

The implementation includes comprehensive tests:

```
Package: github.com/luxfi/node/vms/thresholdvm/fhe

Tests:     289 passed
Coverage:  84.9% of statements

Key Test Files:
- lifecycle_test.go    (1085 lines) - DKG, epochs, transitions
- rpc_test.go          (1313 lines) - All RPC methods
- registry_test.go     (335 lines)  - CRUD operations
- warp_payloads_test.go (504 lines) - Serialization
- handler_test.go      (273 lines)  - Warp message handling
- relayer_test.go      (826 lines)  - Cross-chain relay
- integration_test.go  (1038 lines) - Full flow tests
```

## Performance Considerations

### Latency

| Operation | Expected Latency |
|-----------|-----------------|
| Ciphertext registration | < 10ms |
| Permit creation | < 10ms |
| Decrypt request submission | < 50ms |
| Share generation | < 100ms |
| Full decryption (67 shares) | 3-10 blocks |

### Throughput

| Metric | Value |
|--------|-------|
| Max concurrent sessions | 1000 |
| Max batch size | 100 |
| Shares per block | ~100 |
| Decryptions per epoch | ~10,000 |

### Memory

| Component | Approximate Size |
|-----------|-----------------|
| CKKS parameters | ~2 KB |
| Bootstrap key | ~170 MB (shared) |
| Per-session state | ~1 KB |
| Per-share | ~256 bytes |

## Configuration Reference

### LifecycleConfig

```go
type LifecycleConfig struct {
    CommitteeSize     int           `json:"committeeSize"`     // Default: 100
    Threshold         int           `json:"threshold"`         // Default: 67
    EpochBlocks       uint64        `json:"epochBlocks"`       // Default: 100000
    DKGTimeout        time.Duration `json:"dkgTimeout"`        // Default: 5m
    KeyRotationBlocks uint64        `json:"keyRotationBlocks"` // Default: 0 (disabled)
    MinParticipants   int           `json:"minParticipants"`   // Default: threshold
}
```

### ThresholdConfig

```go
type ThresholdConfig struct {
    Threshold             int           `json:"threshold"`
    TotalParties          int           `json:"totalParties"`
    SessionTimeout        time.Duration `json:"sessionTimeout"`
    MaxConcurrentSessions int           `json:"maxConcurrentSessions"`
    
    // CKKS Parameters
    LogN     int   `json:"logN"`
    LogQ     []int `json:"logQ"`
    LogP     []int `json:"logP"`
    LogSlots int   `json:"logSlots"`
}
```

## Backwards Compatibility

This implementation is backwards compatible with:
- LP-0203 Threshold FHE specification
- LP-5330 ThresholdVM specification
- LP-5103 LSS protocol

New features (authentication, batch limits) are opt-in and don't break existing integrations.

## Security Considerations

1. **Key Material**: Secret key shares are never reconstructed. Decryption happens via multiparty protocol.

2. **Committee Trust**: Security relies on honest majority (67-of-100). Compromising 34+ nodes breaks security.

3. **Timing Attacks**: Constant-time comparisons used for all security-sensitive operations.

4. **Replay Prevention**: Nonce and expiry fields prevent replay attacks across epochs.

5. **Authentication**: RPC authentication is optional but STRONGLY RECOMMENDED for production.

6. **Audit Status**: Implementation passed CTO security review with all HIGH severity issues addressed.

## References

- [LP-0203: Threshold FHE Specification](/docs/lp-0203-threshold-fhe-integration/)
- [LP-5330: ThresholdVM Specification](/docs/lp-5330-t-chain-thresholdvm-specification/)
- [LP-5103: LSS Protocol](/docs/lp-5103-mpc-lss-linear-secret-sharing/)
- [luxfi/lattice](https://github.com/luxfi/lattice) - Lattice cryptography library
- [luxfi/node](https://github.com/luxfi/node) - Node implementation

