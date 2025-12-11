---
lp: 0330
title: T-Chain (ThresholdVM) Specification
description: Defines the T-Chain as Lux Network's dedicated threshold signature chain for distributed key management with dynamic resharing
author: Lux Protocol Team (@luxdefi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Standards Track
category: Core
created: 2025-12-11
requires: 14, 81, 103, 104, 321, 322, 323
activation:
  flag: lp330-t-chain
  hfName: "Threshold"
  activationHeight: "0"
---

> **See also**: [LP-14](./lp-0014-m-chain-threshold-signatures-with-cgg21-uc-non-interactive-ecdsa.md), [LP-81](./lp-0081-b-chain-bridge-chain-specification.md), [LP-103](./lp-0103-mpc-lss---multi-party-computation-linear-secret-sharing-with-dynamic-resharing.md), [LP-104](./lp-0104-frost---flexible-round-optimized-schnorr-threshold-signatures-for-eddsa.md), [LP-331](./lp-0331-b-chain-bridgevm-specification.md), [LP-332](./lp-0332-teleport-bridge-architecture-unified-cross-chain-protocol.md), [LP-333](./lp-0333-dynamic-signer-rotation-with-lss-protocol.md), [LP-334](./lp-0334-per-asset-threshold-key-management.md), [LP-335](./lp-0335-bridge-smart-contract-integration.md), [LP-336](./lp-0336-k-chain-keymanagementvm-specification.md), [LP-INDEX](./LP-INDEX.md)

## Abstract

This LP specifies the T-Chain (Threshold Chain), Lux Network's dedicated blockchain for threshold cryptography operations. T-Chain implements the ThresholdVM, a purpose-built virtual machine that manages distributed key shares using Linear Secret Sharing (LSS), supports both CGGMP21 threshold ECDSA and FROST threshold Schnorr signatures, and enables dynamic signer rotation without key reconstruction. Each validator node holds a share of managed keys, ensuring no single party ever possesses the complete private key. T-Chain provides threshold signature services to B-Chain (BridgeVM), M-Chain (MPC custody), and other Lux chain consumers requiring distributed signing authority.

## Activation

| Parameter          | Value                    |
|--------------------|--------------------------|
| Flag string        | `lp330-t-chain`          |
| Default in code    | **false** until block 0  |
| Deployment branch  | `v1.0.0-lp330`           |
| Roll-out criteria  | Genesis activation       |
| Back-off plan      | Disable via config flag  |

## Conformance

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119) and [RFC 8174](https://www.rfc-editor.org/rfc/rfc8174).

### Conformance Levels

Implementations of this specification fall into three conformance levels:

| Level | Requirements |
|-------|--------------|
| **Core** | MUST implement all transaction types (KeyGenTx, SignRequestTx, SignResponseTx, ReshareTx, ReshareCompleteTx, KeyRotateTx, RefreshTx). MUST support at least CGGMP21_ECDSA algorithm. |
| **Extended** | MUST meet Core requirements. MUST implement FROST_SCHNORR and FROST_EDDSA protocols. MUST support BIP-340 Taproot signatures. |
| **Full** | MUST meet Extended requirements. MUST implement all RPC API endpoints. MUST support WebSocket subscriptions. SHOULD implement HSM integration. |

### Normative Requirements Summary

1. Implementations MUST validate all threshold configurations against the constraints defined in `ThresholdConfig.Validate()`.
2. Implementations MUST verify that public keys remain unchanged during resharing operations.
3. Implementations MUST use authenticated channels (TLS with mutual authentication) for all signer communication.
4. Implementations MUST implement identifiable abort for Byzantine signer detection.
5. Implementations SHOULD implement proactive share refresh at intervals not exceeding `MaxKeyAge` blocks.
6. Implementations MAY support additional signature algorithms beyond those specified, provided they maintain security guarantees equivalent to CGGMP21 or FROST.

## Motivation

### Problem Statement

Threshold cryptography is fundamental to secure cross-chain bridges, decentralized custody, and distributed signing. Current implementations face several challenges:

1. **Key Centralization Risk**: Traditional bridge architectures rely on centralized key management, creating single points of failure
2. **Static Signer Sets**: Most threshold schemes require complete key regeneration when signers change, causing operational disruption
3. **Protocol Fragmentation**: Different signature schemes (ECDSA, Schnorr, EdDSA) require separate infrastructure
4. **Signature Coordination Overhead**: Managing signing sessions across validators requires dedicated state machine logic
5. **Share Leakage Over Time**: Without proactive refresh, an adversary accumulating shares can eventually reconstruct keys

### Solution: Dedicated Threshold Chain

T-Chain addresses these challenges by providing:

1. **Isolated Threshold State**: Dedicated chain for key management eliminates competition for block space
2. **Dynamic Resharing**: LSS-based protocol enables signer rotation without public key changes
3. **Multi-Protocol Support**: Unified infrastructure for CGGMP21 (ECDSA) and FROST (Schnorr/EdDSA)
4. **On-Chain Session Management**: Consensus-backed signing coordination with deterministic outcomes
5. **Proactive Security**: Automatic share refresh limits adversary accumulation windows

### Use Cases

- **B-Chain Bridge Custody**: Threshold control of bridge vault addresses
- **M-Chain Swap Signatures**: Distributed signing for cross-chain swaps
- **DAO Treasury Management**: Multi-party control of protocol funds
- **Validator Key Rotation**: Seamless transition between validator sets
- **Cross-Chain Oracle Signing**: Threshold attestation for oracle data

## Specification

### Chain Architecture

T-Chain is a specialized Lux subnet running the ThresholdVM:

```
+-------------------------------------------------------------------------+
|                         T-Chain Architecture                            |
+-------------------------------------------------------------------------+
|                                                                         |
|  +-------------------+    +-------------------+    +------------------+ |
|  |   External        |    |   T-Chain Core    |    |   Consumers      | |
|  |   Requests        |    |                   |    |                  | |
|  +-------------------+    +-------------------+    +------------------+ |
|  | SignRequest       |    | ThresholdVM       |    | B-Chain Bridge   | |
|  | KeyGenRequest     |    | LSS Key Manager   |    | M-Chain MPC      | |
|  | ReshareRequest    |    | Session Orchestr. |    | DAO Contracts    | |
|  | RefreshRequest    |    | Signature Agg.    |    | Oracle Services  | |
|  +-------------------+    +-------------------+    +------------------+ |
|           |                       |                        ^           |
|           v                       v                        |           |
|  +-------------------------------------------------------------------+ |
|  |                    Validator Signer Network                       | |
|  +-------------------------------------------------------------------+ |
|  | Node A (Share A)  | Node B (Share B)  | Node C (Share C)  | ...   | |
|  | CGGMP21 + FROST   | CGGMP21 + FROST   | CGGMP21 + FROST   |       | |
|  +-------------------------------------------------------------------+ |
|                                                                         |
+-------------------------------------------------------------------------+
```

### Core Components

#### 1. ThresholdVM State

```go
// ThresholdState represents the complete T-Chain state
type ThresholdState struct {
    // Key Registry
    ManagedKeys     map[KeyID]*ManagedKey     // All managed threshold keys
    KeysByOwner     map[Address][]KeyID       // Keys indexed by owner
    KeysByConsumer  map[ChainID][]KeyID       // Keys indexed by consumer chain

    // Session Management
    ActiveSessions  map[SessionID]*SignSession // In-progress signing sessions
    PendingRequests map[RequestID]*SignRequest // Queued signature requests

    // Signer State
    SignerRegistry  map[NodeID]*SignerInfo    // Registered threshold signers
    SignerShares    map[KeyID]map[NodeID]bool // Which signers hold which key shares

    // Protocol State
    CurrentEpoch    uint64                    // Current refresh epoch
    LastRefresh     map[KeyID]uint64          // Last refresh block per key

    // Economic State
    RewardPool      *big.Int                  // Accumulated signing rewards
    SlashingQueue   []SlashingEvent           // Pending slashing events
}
```

#### 2. Managed Key Structure

```go
// ManagedKey represents a threshold-managed cryptographic key
type ManagedKey struct {
    KeyID           KeyID                 // Unique identifier: "eth-usdc", "lux-btc"
    PublicKey       []byte                // Aggregated public key (never changes)
    Algorithm       SignatureAlgorithm    // CGGMP21_ECDSA, FROST_SCHNORR, FROST_EDDSA

    // Threshold Configuration (per-key, not global)
    Threshold       uint32                // t: minimum signers required
    TotalParties    uint32                // n: total parties holding shares
    PartyIDs        []party.ID            // Current signer set

    // Reshare Tracking
    Generation      uint32                // Incremented on each reshare
    CreatedAt       uint64                // Block height of creation
    LastReshare     uint64                // Block height of last reshare

    // Ownership
    Owner           Address               // Who can request signatures
    Consumer        ChainID               // Which chain uses this key

    // Metadata
    CurveType       CurveType             // secp256k1, ed25519, etc.
    Purpose         string                // Human-readable purpose
}

// SignatureAlgorithm defines supported threshold signature protocols
type SignatureAlgorithm uint8

const (
    CGGMP21_ECDSA    SignatureAlgorithm = 0x01  // Threshold ECDSA
    FROST_SCHNORR    SignatureAlgorithm = 0x02  // Threshold Schnorr (BIP-340)
    FROST_EDDSA      SignatureAlgorithm = 0x03  // Threshold EdDSA (Ed25519)
    LSS_SCHNORR      SignatureAlgorithm = 0x04  // LSS-based Schnorr
)

// CurveType defines supported elliptic curves
type CurveType uint8

const (
    SECP256K1  CurveType = 0x01  // Bitcoin, Ethereum
    ED25519    CurveType = 0x02  // Solana, Cardano
    P256       CurveType = 0x03  // NIST P-256
)
```

#### 3. Threshold Configuration

```go
// ThresholdConfig defines per-key threshold parameters
type ThresholdConfig struct {
    Threshold    uint32      // t: number of parties needed to sign
    TotalParties uint32      // n: total parties
    PartyIDs     []party.ID  // Specific signer identities
}

// Validation constraints
func (c *ThresholdConfig) Validate() error {
    if c.Threshold == 0 {
        return errors.New("threshold must be > 0")
    }
    if c.Threshold > c.TotalParties {
        return errors.New("threshold must be <= total parties")
    }
    if c.TotalParties > MaxParties {
        return errors.New("total parties exceeds maximum (100)")
    }
    if len(c.PartyIDs) != int(c.TotalParties) {
        return errors.New("party ID count must match total parties")
    }
    return nil
}

// Recommended thresholds by security level
var RecommendedThresholds = map[string]ThresholdConfig{
    "standard":   {Threshold: 3, TotalParties: 5},   // 3-of-5
    "high":       {Threshold: 5, TotalParties: 7},   // 5-of-7
    "enterprise": {Threshold: 7, TotalParties: 10},  // 7-of-10
    "bridge":     {Threshold: 11, TotalParties: 15}, // 11-of-15
}
```

### Transaction Types

T-Chain defines six transaction types for threshold operations:

#### Transaction Type Registry

| TxID | Name              | Purpose                                      | Gas Cost |
|:-----|:------------------|:---------------------------------------------|:---------|
| 0xT1 | KeyGenTx          | Initialize distributed key generation        | 500,000  |
| 0xT2 | SignRequestTx     | Request signature from threshold group       | 50,000   |
| 0xT3 | SignResponseTx    | Submit signature share                       | 25,000   |
| 0xT4 | ReshareTx         | Initiate key resharing to new party set      | 750,000  |
| 0xT5 | ReshareCompleteTx | Finalize resharing with proofs               | 250,000  |
| 0xT6 | KeyRotateTx       | Emergency key rotation (new public key)      | 1,000,000|
| 0xT7 | RefreshTx         | Proactive share refresh (same public key)    | 300,000  |

#### 1. KeyGenTx - Distributed Key Generation

```go
// KeyGenTx initiates threshold key generation
type KeyGenTx struct {
    BaseTx

    // Key Configuration
    KeyID           KeyID              // Unique identifier for this key
    Algorithm       SignatureAlgorithm // CGGMP21_ECDSA, FROST_SCHNORR, etc.
    CurveType       CurveType          // secp256k1, ed25519, etc.

    // Threshold Parameters
    Threshold       uint32             // t value
    TotalParties    uint32             // n value
    PartyIDs        []party.ID         // Initial signer set (NodeIDs)

    // Ownership
    Owner           Address            // Who can request signatures
    Consumer        ChainID            // Consuming chain (B-Chain, M-Chain, etc.)

    // Metadata
    Purpose         string             // e.g., "eth-usdc-bridge"
    ExpirationBlock uint64             // Optional: key expiration
}

// Validation
func (tx *KeyGenTx) Verify(state *ThresholdState) error {
    // Check key doesn't exist
    if _, exists := state.ManagedKeys[tx.KeyID]; exists {
        return ErrKeyAlreadyExists
    }

    // Validate threshold config
    config := ThresholdConfig{
        Threshold:    tx.Threshold,
        TotalParties: tx.TotalParties,
        PartyIDs:     tx.PartyIDs,
    }
    if err := config.Validate(); err != nil {
        return err
    }

    // Verify all party IDs are registered signers
    for _, pid := range tx.PartyIDs {
        if _, ok := state.SignerRegistry[NodeID(pid)]; !ok {
            return ErrUnknownSigner
        }
    }

    // Verify algorithm/curve compatibility
    if !IsCompatible(tx.Algorithm, tx.CurveType) {
        return ErrIncompatibleAlgorithmCurve
    }

    return nil
}

// Execution triggers DKG protocol
func (tx *KeyGenTx) Execute(state *ThresholdState, signers []Signer) (*ManagedKey, error) {
    // Create DKG session
    session := &DKGSession{
        KeyID:     tx.KeyID,
        Algorithm: tx.Algorithm,
        Config: ThresholdConfig{
            Threshold:    tx.Threshold,
            TotalParties: tx.TotalParties,
            PartyIDs:     tx.PartyIDs,
        },
        State: DKGStateCommitment,
    }

    // Each signer generates polynomial and commitments
    // Protocol runs asynchronously via SignResponseTx

    return nil, nil // Key created when DKG completes
}
```

#### 2. SignRequestTx - Signature Request

```go
// SignRequestTx requests a threshold signature
type SignRequestTx struct {
    BaseTx

    // Request Identity
    RequestID       RequestID          // Unique request identifier
    KeyID           KeyID              // Which key to sign with

    // Message
    MessageHash     [32]byte           // Hash of message to sign
    MessageType     MessageType        // RAW, EIP712, BIP340, etc.

    // Callback
    CallbackChain   ChainID            // Where to send signature
    CallbackAddress Address            // Contract to call with signature

    // Timing
    Deadline        uint64             // Block height deadline

    // Authorization
    Requester       Address            // Must be key owner or delegatee
}

// MessageType defines message encoding
type MessageType uint8

const (
    RAW_HASH     MessageType = 0x01  // Raw 32-byte hash
    EIP712       MessageType = 0x02  // Ethereum typed data
    BIP340       MessageType = 0x03  // Bitcoin Taproot
    COSMOS_ADR36 MessageType = 0x04  // Cosmos ADR-036
)

// Validation
func (tx *SignRequestTx) Verify(state *ThresholdState) error {
    // Check key exists
    key, exists := state.ManagedKeys[tx.KeyID]
    if !exists {
        return ErrKeyNotFound
    }

    // Verify authorization
    if tx.Requester != key.Owner && !IsDelegate(state, tx.Requester, tx.KeyID) {
        return ErrUnauthorized
    }

    // Check for duplicate request
    if _, exists := state.PendingRequests[tx.RequestID]; exists {
        return ErrDuplicateRequest
    }

    // Verify deadline is in future
    if tx.Deadline <= state.CurrentBlock {
        return ErrDeadlinePassed
    }

    return nil
}

// Execution creates signing session
func (tx *SignRequestTx) Execute(state *ThresholdState) (*SignSession, error) {
    key := state.ManagedKeys[tx.KeyID]

    session := &SignSession{
        SessionID:     NewSessionID(tx.RequestID),
        KeyID:         tx.KeyID,
        MessageHash:   tx.MessageHash,
        Algorithm:     key.Algorithm,
        Threshold:     key.Threshold,
        PartyIDs:      key.PartyIDs,
        State:         SessionStateCommitment,
        Commitments:   make(map[party.ID][]byte),
        Shares:        make(map[party.ID][]byte),
        Deadline:      tx.Deadline,
        CallbackChain: tx.CallbackChain,
        CallbackAddr:  tx.CallbackAddress,
    }

    state.ActiveSessions[session.SessionID] = session
    return session, nil
}
```

#### 3. SignResponseTx - Submit Signature Share

```go
// SignResponseTx submits a signature share
type SignResponseTx struct {
    BaseTx

    // Session Reference
    SessionID       SessionID          // Which signing session

    // Signer Identity
    SignerID        party.ID           // Which party is responding
    Round           uint8              // Which protocol round

    // Response Data (varies by protocol and round)
    Commitment      []byte             // Round 1: nonce commitment
    Share           []byte             // Round 2: signature share
    Proof           []byte             // Optional: ZK proof of correctness
}

// Validation
func (tx *SignResponseTx) Verify(state *ThresholdState) error {
    // Check session exists
    session, exists := state.ActiveSessions[tx.SessionID]
    if !exists {
        return ErrSessionNotFound
    }

    // Verify signer is participant
    if !session.HasParty(tx.SignerID) {
        return ErrNotParticipant
    }

    // Verify round is current
    if tx.Round != session.CurrentRound {
        return ErrWrongRound
    }

    // Verify deadline not passed
    if state.CurrentBlock > session.Deadline {
        return ErrSessionExpired
    }

    return nil
}

// Execution processes share and potentially completes signature
func (tx *SignResponseTx) Execute(state *ThresholdState) (*Signature, error) {
    session := state.ActiveSessions[tx.SessionID]

    switch tx.Round {
    case 1:
        // Store commitment
        session.Commitments[tx.SignerID] = tx.Commitment

        // Check if ready for round 2
        if len(session.Commitments) >= int(session.Threshold) {
            session.State = SessionStateSharing
            session.CurrentRound = 2
        }

    case 2:
        // Verify commitment matches
        if !VerifyCommitment(session.Commitments[tx.SignerID], tx.Share) {
            // Identifiable abort - slash this signer
            state.SlashingQueue = append(state.SlashingQueue, SlashingEvent{
                SignerID: tx.SignerID,
                Reason:   "commitment_mismatch",
                SessionID: tx.SessionID,
            })
            return nil, ErrCommitmentMismatch
        }

        // Store share
        session.Shares[tx.SignerID] = tx.Share

        // Check if enough shares for aggregation
        if len(session.Shares) >= int(session.Threshold) {
            return session.Aggregate()
        }
    }

    return nil, nil
}
```

#### 4. ReshareTx - Initiate Resharing

```go
// ReshareTx initiates key resharing to new party set
type ReshareTx struct {
    BaseTx

    // Key Reference
    KeyID           KeyID              // Key to reshare

    // New Configuration
    NewThreshold    uint32             // New t value
    NewTotalParties uint32             // New n value
    NewPartyIDs     []party.ID         // New signer set

    // Transition Period
    TransitionBlocks uint64            // Blocks for reshare completion

    // Authorization
    Requester       Address            // Must be key owner
}

// Reshare Protocol Visualization
//
// Generation 0: Parties A, B, C (2-of-3)
//      |
//      | ReshareTx(newParties=[A, B, D, E], threshold=3)
//      v
// Generation 1: Parties A, B, D, E (3-of-4)  <- Same public key!
//      |
//      | ReshareTx(newParties=[B, D, E, F, G], threshold=3)
//      v
// Generation 2: B, D, E, F, G (3-of-5)  <- Same public key!

// Validation
func (tx *ReshareTx) Verify(state *ThresholdState) error {
    key, exists := state.ManagedKeys[tx.KeyID]
    if !exists {
        return ErrKeyNotFound
    }

    // Only owner can initiate reshare
    if tx.Requester != key.Owner {
        return ErrUnauthorized
    }

    // Validate new configuration
    config := ThresholdConfig{
        Threshold:    tx.NewThreshold,
        TotalParties: tx.NewTotalParties,
        PartyIDs:     tx.NewPartyIDs,
    }
    if err := config.Validate(); err != nil {
        return err
    }

    // Verify new parties are registered signers
    for _, pid := range tx.NewPartyIDs {
        if _, ok := state.SignerRegistry[NodeID(pid)]; !ok {
            return ErrUnknownSigner
        }
    }

    // Ensure minimum overlap for security
    overlap := countOverlap(key.PartyIDs, tx.NewPartyIDs)
    if overlap < int(key.Threshold) {
        return ErrInsufficientOverlap
    }

    return nil
}

// Execution creates reshare session
func (tx *ReshareTx) Execute(state *ThresholdState) (*ReshareSession, error) {
    key := state.ManagedKeys[tx.KeyID]

    session := &ReshareSession{
        SessionID:    NewReshareSessionID(tx.KeyID, key.Generation+1),
        KeyID:        tx.KeyID,
        OldConfig: ThresholdConfig{
            Threshold:    key.Threshold,
            TotalParties: key.TotalParties,
            PartyIDs:     key.PartyIDs,
        },
        NewConfig: ThresholdConfig{
            Threshold:    tx.NewThreshold,
            TotalParties: tx.NewTotalParties,
            PartyIDs:     tx.NewPartyIDs,
        },
        State:    ReshareStateInitiated,
        Deadline: state.CurrentBlock + tx.TransitionBlocks,
    }

    return session, nil
}
```

#### 5. ReshareCompleteTx - Finalize Resharing

```go
// ReshareCompleteTx finalizes a resharing operation
type ReshareCompleteTx struct {
    BaseTx

    // Session Reference
    ReshareSessionID SessionID          // Which reshare session

    // Completion Proofs
    NewCommitments   map[party.ID][]byte // Commitments from new parties
    VerificationKey  []byte              // Should match existing public key
    Proofs           [][]byte            // ZK proofs of correct resharing
}

// Validation ensures public key is preserved
func (tx *ReshareCompleteTx) Verify(state *ThresholdState) error {
    session, exists := state.ReshareSessions[tx.ReshareSessionID]
    if !exists {
        return ErrSessionNotFound
    }

    key := state.ManagedKeys[session.KeyID]

    // CRITICAL: Verify public key unchanged
    if !bytes.Equal(tx.VerificationKey, key.PublicKey) {
        return ErrPublicKeyMismatch
    }

    // Verify all new parties have submitted commitments
    for _, pid := range session.NewConfig.PartyIDs {
        if _, ok := tx.NewCommitments[pid]; !ok {
            return ErrMissingCommitment
        }
    }

    // Verify proofs
    for i, proof := range tx.Proofs {
        if !VerifyReshareProof(proof, session, i) {
            return ErrInvalidProof
        }
    }

    return nil
}

// Execution updates key configuration
func (tx *ReshareCompleteTx) Execute(state *ThresholdState) error {
    session := state.ReshareSessions[tx.ReshareSessionID]
    key := state.ManagedKeys[session.KeyID]

    // Update key configuration (public key stays same!)
    key.Threshold = session.NewConfig.Threshold
    key.TotalParties = session.NewConfig.TotalParties
    key.PartyIDs = session.NewConfig.PartyIDs
    key.Generation++
    key.LastReshare = state.CurrentBlock

    // Update share mapping
    delete(state.SignerShares, session.KeyID)
    state.SignerShares[session.KeyID] = make(map[NodeID]bool)
    for _, pid := range session.NewConfig.PartyIDs {
        state.SignerShares[session.KeyID][NodeID(pid)] = true
    }

    // Clean up session
    delete(state.ReshareSessions, tx.ReshareSessionID)

    return nil
}
```

#### 6. KeyRotateTx - Emergency Rotation

```go
// KeyRotateTx performs emergency key rotation (new public key)
type KeyRotateTx struct {
    BaseTx

    // Key Reference
    OldKeyID        KeyID              // Key to rotate from
    NewKeyID        KeyID              // New key identifier

    // New Configuration
    NewThreshold    uint32
    NewTotalParties uint32
    NewPartyIDs     []party.ID

    // Emergency Authorization
    Reason          string             // e.g., "key_compromise", "mass_signer_exit"
    EmergencyProof  []byte             // Multi-sig from governance
}

// Unlike reshare, rotation creates new public key
// Used when resharing is impossible (too few old signers)
func (tx *KeyRotateTx) Execute(state *ThresholdState) error {
    // Mark old key as deprecated
    oldKey := state.ManagedKeys[tx.OldKeyID]
    oldKey.Deprecated = true
    oldKey.ReplacedBy = tx.NewKeyID

    // Initiate DKG for new key
    keygenTx := &KeyGenTx{
        KeyID:        tx.NewKeyID,
        Algorithm:    oldKey.Algorithm,
        CurveType:    oldKey.CurveType,
        Threshold:    tx.NewThreshold,
        TotalParties: tx.NewTotalParties,
        PartyIDs:     tx.NewPartyIDs,
        Owner:        oldKey.Owner,
        Consumer:     oldKey.Consumer,
        Purpose:      oldKey.Purpose + " (rotated)",
    }

    return keygenTx.Execute(state, nil)
}
```

### State Machine

#### Key Lifecycle States

```
                                +-------------+
                                |   PENDING   |  KeyGenTx submitted
                                +------+------+
                                       |
                                       v DKG protocol completes
                                +------+------+
                     +--------->|   ACTIVE    |<---------+
                     |          +------+------+          |
                     |                 |                 |
                     |    ReshareTx    |    RefreshTx    |
                     |                 v                 |
                     |          +------+------+          |
                     +----------| RESHARING   |----------+
                                +------+------+
                                       |
                                       v ReshareCompleteTx
                                +------+------+
                                |   ACTIVE    |  (new generation)
                                +-------------+
                                       |
                                       v KeyRotateTx (emergency)
                                +------+------+
                                | DEPRECATED  |
                                +-------------+
```

#### Signing Session States

```
                                +-------------+
             SignRequestTx ---->| COMMITMENT  |  Round 1: collect nonce commitments
                                +------+------+
                                       |
                                       v t commitments received
                                +------+------+
                                |  SHARING    |  Round 2: collect signature shares
                                +------+------+
                                       |
                                       v t shares received
                                +------+------+
                                | AGGREGATING |  Combine shares into signature
                                +------+------+
                                       |
                         +-------------+-------------+
                         |                           |
                         v                           v
                  +------+------+             +------+------+
                  |  COMPLETED  |             |   FAILED    |
                  +-------------+             +-------------+
                         |                           |
                         v                           v
                  Callback to consumer        Identifiable abort
                                              (slash misbehaving signer)
```

### LSS Protocol Integration

T-Chain uses Linear Secret Sharing as the foundation for all threshold operations:

#### Polynomial Secret Sharing

```go
// LSS share generation
type LSSScheme struct {
    Field     *big.Int    // Prime field order
    Threshold int         // Degree + 1 of polynomial
}

// GenerateShares creates n shares from secret s
func (lss *LSSScheme) GenerateShares(s *big.Int, n int) ([]*Share, error) {
    // Construct polynomial f(x) = s + a1*x + a2*x^2 + ... + a_{t-1}*x^{t-1}
    coeffs := make([]*big.Int, lss.Threshold)
    coeffs[0] = s
    for i := 1; i < lss.Threshold; i++ {
        coeffs[i] = RandomScalar(lss.Field)
    }

    shares := make([]*Share, n)
    for i := 1; i <= n; i++ {
        x := big.NewInt(int64(i))
        y := EvaluatePolynomial(coeffs, x, lss.Field)
        shares[i-1] = &Share{Index: i, Value: y}
    }

    return shares, nil
}

// ReconstructSecret recovers s from t shares
func (lss *LSSScheme) ReconstructSecret(shares []*Share) (*big.Int, error) {
    if len(shares) < lss.Threshold {
        return nil, ErrInsufficientShares
    }

    // Lagrange interpolation at x = 0
    s := big.NewInt(0)
    for i, share_i := range shares[:lss.Threshold] {
        lambda := LagrangeCoefficient(shares[:lss.Threshold], i, lss.Field)
        term := new(big.Int).Mul(share_i.Value, lambda)
        s.Add(s, term)
        s.Mod(s, lss.Field)
    }

    return s, nil
}
```

#### Verifiable Secret Sharing (VSS)

```go
// FeldmanVSS adds public verification to LSS
type FeldmanVSS struct {
    LSS    *LSSScheme
    G      curve.Point   // Generator
    Curve  curve.Curve
}

// GenerateWithCommitments creates verifiable shares
func (vss *FeldmanVSS) GenerateWithCommitments(s *big.Int, n int) (*VSSOutput, error) {
    // Generate coefficients
    coeffs := make([]*big.Int, vss.LSS.Threshold)
    coeffs[0] = s
    for i := 1; i < vss.LSS.Threshold; i++ {
        coeffs[i] = RandomScalar(vss.LSS.Field)
    }

    // Create commitments: C_j = a_j * G
    commitments := make([]curve.Point, vss.LSS.Threshold)
    for j, a := range coeffs {
        commitments[j] = vss.Curve.ScalarMul(vss.G, a)
    }

    // Generate shares
    shares := make([]*Share, n)
    for i := 1; i <= n; i++ {
        x := big.NewInt(int64(i))
        y := EvaluatePolynomial(coeffs, x, vss.LSS.Field)
        shares[i-1] = &Share{Index: i, Value: y}
    }

    return &VSSOutput{
        Shares:      shares,
        Commitments: commitments,
    }, nil
}

// VerifyShare checks share against public commitments
func (vss *FeldmanVSS) VerifyShare(share *Share, commitments []curve.Point) bool {
    // Compute: share.Value * G
    sharePoint := vss.Curve.ScalarMul(vss.G, share.Value)

    // Compute: sum(C_j * i^j) for j = 0..t-1
    expected := vss.Curve.Identity()
    x := big.NewInt(int64(share.Index))
    xPow := big.NewInt(1)

    for _, C := range commitments {
        term := vss.Curve.ScalarMul(C, xPow)
        expected = vss.Curve.Add(expected, term)
        xPow.Mul(xPow, x)
        xPow.Mod(xPow, vss.LSS.Field)
    }

    return sharePoint.Equal(expected)
}
```

### CGGMP21 Protocol Support

T-Chain implements CGGMP21 (Canetti-Gennaro-Goldfeder-Makriyannis-Peled 2021) for threshold ECDSA with UC security and identifiable aborts. This protocol provides the strongest known security guarantees for threshold ECDSA signing.

#### CGGMP21 Protocol Properties

| Property | Description |
|----------|-------------|
| **Security Model** | UC (Universal Composability) secure |
| **Rounds (DKG)** | 3 rounds for key generation |
| **Rounds (Sign)** | 4 rounds (3 presign + 1 online) |
| **Presigning** | Non-interactive after setup |
| **Abort** | Identifiable abort with cheater detection |
| **Assumptions** | Strong RSA, DDH, Paillier semantic security |

#### Paillier Encryption for Multiplicative-to-Additive (MtA)

CGGMP21 uses Paillier encryption for secure multiplication of secret shares:

```go
import (
    "github.com/luxfi/crypto/paillier"
    "github.com/luxfi/crypto/zkp"
)

// PaillierKeyPair for MtA protocol
type PaillierKeyPair struct {
    PublicKey  *paillier.PublicKey   // N = p*q (2048-bit modulus)
    PrivateKey *paillier.PrivateKey  // phi(N) = (p-1)(q-1)
}

// MtA converts multiplicative share to additive share
// Given: party i has a_i, party j has b_j
// Goal: party i gets alpha, party j gets beta, where alpha + beta = a_i * b_j
type MtAProtocol struct {
    // Round 1: Party i encrypts a_i
    Ciphertext  *big.Int           // Enc(a_i) under j's Paillier key
    RangeProof  *zkp.RangeProof    // Proves a_i in valid range

    // Round 2: Party j homomorphically computes
    // c' = Enc(a_i)^{b_j} * Enc(beta) = Enc(a_i * b_j + beta)
    // Returns c' to party i
    Response    *big.Int
    BetaProof   *zkp.AffineProof   // Proves correct computation
}

func (m *MtAProtocol) Execute(
    ai *big.Int,           // Party i's multiplicative share
    bj *big.Int,           // Party j's multiplicative share
    pkj *paillier.PublicKey,
) (alpha, beta *big.Int, err error) {
    // Party i: encrypt a_i
    ciphertext, r := pkj.Encrypt(ai)

    // Party j: sample random beta, compute response
    beta = RandomScalar(curveOrder)
    response := pkj.HomomorphicMul(ciphertext, bj)
    response = pkj.HomomorphicAdd(response, beta)

    // Party i: decrypt to get a_i * b_j + beta, subtract beta' (their share)
    // alpha = Dec(response) - beta' where beta' = beta (sent securely)
    alpha = new(big.Int).Sub(pkj.Decrypt(response), beta)
    alpha.Mod(alpha, curveOrder)

    return alpha, beta, nil
}
```

#### CGGMP21 Manager Implementation

```go
import (
    "github.com/luxfi/crypto/secp256k1"
    "github.com/luxfi/crypto/paillier"
    "github.com/luxfi/crypto/zkp"
    "github.com/luxfi/threshold/session"
)

// CGGMP21Manager handles threshold ECDSA operations
type CGGMP21Manager struct {
    State    *ThresholdState
    Curve    *secp256k1.Curve
    Paillier *paillier.Manager
}

// DKG Protocol (3 rounds)
type CGGMP21DKG struct {
    // Round 1: Commitment
    Round1Msg struct {
        Commitment [32]byte            // Hash of VSS dealing
        DecommKey  [32]byte            // Decommitment key
    }

    // Round 2: Share Distribution
    Round2Msg struct {
        VSSDealing    *vss.Dealing     // Encrypted shares
        SchnorrProof  *schnorr.Proof   // Proof of knowledge
        RIDShare      []byte           // Random ID share
    }

    // Round 3: Complaints
    Round3Msg struct {
        Complaints []Complaint         // Against misbehaving parties
    }
}

// Signing Protocol (4 rounds with presigning)
type CGGMP21Sign struct {
    // Presigning (can be done offline)
    Presign struct {
        K      *big.Int              // Nonce share
        Gamma  *big.Int              // Multiplication share
        Delta  *big.Int              // k * gamma product share
    }

    // Online signing (1 round once message known)
    Online struct {
        MessageHash [32]byte
        SigmaShare  *big.Int          // Signature share
    }
}

// ExecuteSign performs threshold ECDSA signing
func (m *CGGMP21Manager) ExecuteSign(
    session *SignSession,
    message [32]byte,
) (*ecdsa.Signature, error) {
    // 1. Collect presignatures from t parties
    presigs := m.collectPresignatures(session)

    // 2. Compute challenge
    // c = H(R || PK || m)
    R := m.aggregateR(presigs)

    // 3. Each party computes sigma_i = k_i * m + r * x_i
    sigmaShares := make(map[party.ID]*big.Int)
    for _, pid := range session.Signers {
        sigmaShares[pid] = m.computeSigmaShare(pid, message, R)
    }

    // 4. Aggregate signature
    s := m.aggregateSigma(sigmaShares)

    // 5. Verify before returning
    sig := &ecdsa.Signature{R: R.X, S: s}
    if !ecdsa.Verify(session.PublicKey, message[:], sig) {
        return nil, ErrSignatureVerificationFailed
    }

    return sig, nil
}
```

### FROST Protocol Support

T-Chain implements FROST (Flexible Round-Optimized Schnorr Threshold) for threshold Schnorr and EdDSA signatures. FROST provides optimal round complexity (2 rounds) and robust signature aggregation.

#### FROST Protocol Properties

| Property | Description |
|----------|-------------|
| **Security Model** | Unforgeability under DLP assumption |
| **Rounds (DKG)** | 2 rounds (Pedersen DKG) |
| **Rounds (Sign)** | 2 rounds (commitment + response) |
| **Robustness** | Non-robust (requires honest majority) |
| **Assumptions** | Discrete Log Problem (DLP), Random Oracle Model |
| **Supported Curves** | secp256k1 (BIP-340), ed25519, P-256 |

#### FROST DKG Protocol

```go
import (
    "github.com/luxfi/crypto/curve"
    "github.com/luxfi/crypto/frost"
    "github.com/luxfi/crypto/vss"
)

// FROST DKG uses Pedersen Distributed Key Generation
type FROSTDKGSession struct {
    // Round 1: Each party broadcasts commitment to their polynomial
    Round1 struct {
        // Commitment to coefficients: C_ij = a_ij * G + b_ij * H (Pedersen)
        Commitments []curve.Point
        // Proof of knowledge of secret a_i0
        SchnorrProof *frost.SchnorrProof
    }

    // Round 2: Each party sends encrypted shares
    Round2 struct {
        // Share for party j: f_i(j) where f_i is party i's polynomial
        Shares map[party.ID]*big.Int
        // Encrypted with party j's public key
        EncryptedShares map[party.ID][]byte
    }
}

// FROST DKG Execution
func (s *FROSTDKGSession) Execute(
    parties []party.ID,
    threshold int,
) (*FROSTKeyShare, error) {
    n := len(parties)

    // Round 1: Generate polynomial and commitments
    // f_i(x) = a_i0 + a_i1*x + ... + a_i(t-1)*x^(t-1)
    poly := frost.NewPolynomial(threshold)
    commitments := poly.Commitments()

    // Broadcast commitments and collect from all parties
    allCommitments := s.collectCommitments(parties)

    // Round 2: Compute and distribute shares
    for _, pj := range parties {
        share := poly.Evaluate(partyIndex(pj))
        s.sendShare(pj, share)
    }

    // Collect shares and verify against commitments
    receivedShares := s.collectShares(parties)
    for pi, share := range receivedShares {
        if !frost.VerifyShare(share, allCommitments[pi], s.myIndex) {
            return nil, fmt.Errorf("invalid share from %s", pi)
        }
    }

    // Aggregate shares: x_i = sum(f_j(i)) for all j
    secretShare := big.NewInt(0)
    for _, share := range receivedShares {
        secretShare.Add(secretShare, share)
        secretShare.Mod(secretShare, curveOrder)
    }

    // Compute group public key: Y = sum(C_j0) for all j
    publicKey := curve.Identity()
    for _, commits := range allCommitments {
        publicKey = curve.Add(publicKey, commits[0])
    }

    return &FROSTKeyShare{
        SecretShare: secretShare,
        PublicKey:   publicKey,
        Index:       s.myIndex,
    }, nil
}
```

#### FROST Manager Implementation

```go
import (
    "github.com/luxfi/crypto/curve"
    "github.com/luxfi/crypto/frost"
    "github.com/luxfi/crypto/schnorr"
)

// FROSTManager handles threshold Schnorr operations
type FROSTManager struct {
    State *ThresholdState
    Curve curve.Curve     // secp256k1 for BIP-340, ed25519 for EdDSA
}

// FROST Signing Protocol (2 rounds)
type FROSTSign struct {
    // Round 1: Commitments
    Round1 struct {
        D curve.Point     // d * G (hiding nonce)
        E curve.Point     // e * G (binding nonce)
    }

    // Round 2: Responses
    Round2 struct {
        Z curve.Scalar    // z_i = d_i + e_i * rho_i + lambda_i * x_i * c
    }
}

// ExecuteSign performs threshold Schnorr signing
func (m *FROSTManager) ExecuteSign(
    session *SignSession,
    message [32]byte,
) (*schnorr.Signature, error) {
    // Round 1: Collect nonce commitments (D_i, E_i)
    commitments := make(map[party.ID]*Round1Commitment)
    for _, pid := range session.Signers {
        commitments[pid] = session.Commitments[pid].(*Round1Commitment)
    }

    // Compute binding values rho_i = H(i, m, {D_j, E_j})
    rhos := make(map[party.ID]*big.Int)
    for _, pid := range session.Signers {
        rhos[pid] = m.computeRho(pid, message, commitments)
    }

    // Compute group commitment R = sum(D_i + rho_i * E_i)
    R := m.Curve.Identity()
    for pid, commit := range commitments {
        rhoE := m.Curve.ScalarMul(commit.E, rhos[pid])
        R = m.Curve.Add(R, commit.D)
        R = m.Curve.Add(R, rhoE)
    }

    // Compute challenge c = H(R, Y, m)
    c := m.computeChallenge(R, session.PublicKey, message)

    // Round 2: Collect responses z_i
    responses := make(map[party.ID]*big.Int)
    for _, pid := range session.Signers {
        lambda := LagrangeCoefficient(session.Signers, pid)
        z_i := m.computeResponse(pid, rhos[pid], lambda, c, session)
        responses[pid] = z_i
    }

    // Aggregate: z = sum(z_i)
    z := big.NewInt(0)
    for _, z_i := range responses {
        z.Add(z, z_i)
        z.Mod(z, m.Curve.Order())
    }

    sig := &schnorr.Signature{R: R, S: z}

    // Verify: z*G = R + c*Y
    if !schnorr.Verify(session.PublicKey, message[:], sig) {
        return nil, ErrSignatureVerificationFailed
    }

    return sig, nil
}

// Taproot Support (BIP-340)
func (m *FROSTManager) ExecuteSignTaproot(
    session *SignSession,
    message [32]byte,
) (*taproot.Signature, error) {
    // Adjust for x-only public key
    if session.PublicKey.Y().Bit(0) == 1 {
        // Negate all shares if Y is odd
        for pid := range session.Shares {
            session.Shares[pid] = m.Curve.Negate(session.Shares[pid])
        }
    }

    sig, err := m.ExecuteSign(session, message)
    if err != nil {
        return nil, err
    }

    // Convert to x-only format
    return &taproot.Signature{
        R: sig.R.X(),
        S: sig.S,
    }, nil
}
```

### Dynamic Resharing Mechanism

The resharing protocol enables changing signers without changing public keys:

```go
// ReshareProtocol implements dynamic key resharing
type ReshareProtocol struct {
    OldConfig ThresholdConfig    // Current (t_old, n_old, parties_old)
    NewConfig ThresholdConfig    // Target (t_new, n_new, parties_new)
    PublicKey curve.Point        // Must remain unchanged
}

// ExecuteReshare transfers shares to new party set
func (p *ReshareProtocol) ExecuteReshare(
    oldShares map[party.ID]*big.Int,
    newParties []party.ID,
) (map[party.ID]*big.Int, error) {
    // Each old party creates subshares for new parties
    subshares := make(map[party.ID]map[party.ID]*big.Int)

    for oldPID, oldShare := range oldShares {
        // Create polynomial with oldShare as constant term
        poly := NewPolynomial(p.NewConfig.Threshold-1, oldShare)

        // Generate subshares for each new party
        subshares[oldPID] = make(map[party.ID]*big.Int)
        for _, newPID := range newParties {
            subshares[oldPID][newPID] = poly.Evaluate(partyIndex(newPID))
        }
    }

    // Each new party aggregates subshares
    newShares := make(map[party.ID]*big.Int)
    for _, newPID := range newParties {
        aggregated := big.NewInt(0)
        for oldPID := range oldShares {
            // Apply Lagrange coefficient for old party
            lambda := LagrangeCoefficient(keys(oldShares), oldPID)
            term := new(big.Int).Mul(subshares[oldPID][newPID], lambda)
            aggregated.Add(aggregated, term)
        }
        newShares[newPID] = aggregated.Mod(aggregated, curveOrder)
    }

    // Verify: new shares should reconstruct same secret
    // (verify without reconstruction via public key check)
    newPubKey := p.reconstructPublicKey(newShares, p.NewConfig.Threshold)
    if !newPubKey.Equal(p.PublicKey) {
        return nil, ErrResharePublicKeyMismatch
    }

    return newShares, nil
}

// Example reshare scenarios:
//
// Scenario 1: Add parties (expand signer set)
//   Before: 2-of-3 (A, B, C)
//   After:  3-of-5 (A, B, C, D, E)
//   Overlap: A, B, C (all old parties continue)
//
// Scenario 2: Remove parties (contract signer set)
//   Before: 3-of-5 (A, B, C, D, E)
//   After:  2-of-3 (A, C, E)
//   Overlap: A, C, E (subset continues)
//
// Scenario 3: Replace parties (rotate signers)
//   Before: 2-of-3 (A, B, C)
//   After:  2-of-3 (A, B, D)
//   Overlap: A, B (C replaced by D)
```

### Validator-to-Signer Mapping

```go
// SignerInfo represents a registered threshold signer
type SignerInfo struct {
    NodeID          NodeID            // Lux validator node ID
    PublicKey       []byte            // BLS public key for authentication
    Endpoints       []string          // P2P endpoints for signing
    Stake           uint64            // Staked LUX
    ActiveKeys      []KeyID           // Keys this signer participates in
    Performance     *PerformanceStats // Historical performance
    JoinedAt        uint64            // Block height joined
}

// PerformanceStats tracks signer reliability
type PerformanceStats struct {
    TotalSessions       uint64   // Total signing sessions
    SuccessfulSessions  uint64   // Completed successfully
    MissedDeadlines     uint64   // Failed to respond in time
    InvalidShares       uint64   // Submitted bad shares
    AverageLatency      uint64   // Average response time (ms)
}

// SignerRegistry manages signer registration and selection
type SignerRegistry struct {
    Signers         map[NodeID]*SignerInfo
    MinStake        uint64             // Minimum stake to be signer
    MaxKeys         uint32             // Max keys per signer
}

// SelectSigners chooses signers for new key
func (r *SignerRegistry) SelectSigners(n int, exclude []NodeID) ([]party.ID, error) {
    // Sort by stake * performance score
    candidates := r.rankCandidates(exclude)

    if len(candidates) < n {
        return nil, ErrInsufficientSigners
    }

    // Select top n candidates
    selected := make([]party.ID, n)
    for i := 0; i < n; i++ {
        selected[i] = party.ID(candidates[i].NodeID)
    }

    return selected, nil
}

// ValidatorSync synchronizes with P-Chain/Q-Chain validator set
func (r *SignerRegistry) ValidatorSync(validators []Validator) error {
    // Add new validators as potential signers
    for _, v := range validators {
        if v.Stake >= r.MinStake {
            if _, exists := r.Signers[v.NodeID]; !exists {
                r.Signers[v.NodeID] = &SignerInfo{
                    NodeID:    v.NodeID,
                    PublicKey: v.BlsKey,
                    Stake:     v.Stake,
                    JoinedAt:  currentBlock,
                }
            }
        }
    }

    // Mark exited validators
    for nodeID := range r.Signers {
        if !containsValidator(validators, nodeID) {
            // Schedule reshare for keys this signer participated in
            r.scheduleReshareForExitedSigner(nodeID)
        }
    }

    return nil
}
```

### RPC API Endpoints

T-Chain exposes JSON-RPC endpoints under `/ext/bc/T`:

#### threshold_keygen - Generate New Threshold Key

```json
// Request
{
    "jsonrpc": "2.0",
    "method": "threshold_keygen",
    "params": {
        "keyId": "eth-usdc-bridge",
        "algorithm": "CGGMP21_ECDSA",
        "curveType": "secp256k1",
        "threshold": 11,
        "totalParties": 15,
        "partyIds": ["nodeA", "nodeB", "nodeC", ...],
        "owner": "0x1234...abcd",
        "consumer": "B-Chain",
        "purpose": "USDC bridge vault"
    },
    "id": 1
}

// Response
{
    "jsonrpc": "2.0",
    "result": {
        "txId": "0xabc123...",
        "keyId": "eth-usdc-bridge",
        "status": "pending_dkg",
        "estimatedCompletion": 30  // blocks
    },
    "id": 1
}
```

#### threshold_sign - Request Threshold Signature

```json
// Request
{
    "jsonrpc": "2.0",
    "method": "threshold_sign",
    "params": {
        "keyId": "eth-usdc-bridge",
        "messageHash": "0x7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069",
        "messageType": "RAW_HASH",
        "deadline": 1000,           // block height
        "callbackChain": "B-Chain",
        "callbackAddress": "0x5678...efgh"
    },
    "id": 1
}

// Response
{
    "jsonrpc": "2.0",
    "result": {
        "requestId": "0xdef456...",
        "sessionId": "0x789abc...",
        "status": "commitment_phase",
        "signers": ["nodeA", "nodeB", "nodeC", ...],
        "threshold": 11,
        "deadline": 1000
    },
    "id": 1
}
```

#### threshold_reshare - Trigger Key Resharing

```json
// Request
{
    "jsonrpc": "2.0",
    "method": "threshold_reshare",
    "params": {
        "keyId": "eth-usdc-bridge",
        "newThreshold": 13,
        "newTotalParties": 18,
        "newPartyIds": ["nodeA", "nodeB", "nodeD", "nodeE", ...],
        "transitionBlocks": 100
    },
    "id": 1
}

// Response
{
    "jsonrpc": "2.0",
    "result": {
        "reshareSessionId": "0xfed987...",
        "keyId": "eth-usdc-bridge",
        "status": "initiated",
        "currentGeneration": 3,
        "targetGeneration": 4,
        "deadline": 1100
    },
    "id": 1
}
```

#### threshold_getAddress - Get MPC Public Key/Address

```json
// Request
{
    "jsonrpc": "2.0",
    "method": "threshold_getAddress",
    "params": {
        "keyId": "eth-usdc-bridge",
        "format": "ethereum"  // "ethereum", "bitcoin_p2tr", "solana", "raw"
    },
    "id": 1
}

// Response
{
    "jsonrpc": "2.0",
    "result": {
        "keyId": "eth-usdc-bridge",
        "publicKey": "0x04abc123...",  // uncompressed
        "publicKeyCompressed": "0x02abc123...",
        "addresses": {
            "ethereum": "0x1234...5678",
            "bitcoin_p2tr": "bc1p...",
            "solana": "5xyz..."
        }
    },
    "id": 1
}
```

#### threshold_getKeyStatus - Query Key State

```json
// Request
{
    "jsonrpc": "2.0",
    "method": "threshold_getKeyStatus",
    "params": {
        "keyId": "eth-usdc-bridge"
    },
    "id": 1
}

// Response
{
    "jsonrpc": "2.0",
    "result": {
        "keyId": "eth-usdc-bridge",
        "status": "active",
        "algorithm": "CGGMP21_ECDSA",
        "curveType": "secp256k1",
        "threshold": 11,
        "totalParties": 15,
        "partyIds": ["nodeA", "nodeB", ...],
        "generation": 3,
        "createdAt": 50000,
        "lastReshare": 80000,
        "owner": "0x1234...abcd",
        "consumer": "B-Chain",
        "activeSessions": 2,
        "totalSignatures": 15847
    },
    "id": 1
}
```

#### threshold_listKeys - List Managed Keys

```json
// Request
{
    "jsonrpc": "2.0",
    "method": "threshold_listKeys",
    "params": {
        "owner": "0x1234...abcd",      // optional filter
        "consumer": "B-Chain",          // optional filter
        "algorithm": "CGGMP21_ECDSA",   // optional filter
        "status": "active",             // optional filter
        "page": 1,
        "pageSize": 20
    },
    "id": 1
}

// Response
{
    "jsonrpc": "2.0",
    "result": {
        "keys": [
            {
                "keyId": "eth-usdc-bridge",
                "publicKey": "0x02abc...",
                "algorithm": "CGGMP21_ECDSA",
                "threshold": 11,
                "totalParties": 15,
                "status": "active"
            },
            {
                "keyId": "btc-taproot-vault",
                "publicKey": "0x03def...",
                "algorithm": "FROST_SCHNORR",
                "threshold": 5,
                "totalParties": 7,
                "status": "active"
            }
        ],
        "total": 42,
        "page": 1,
        "pageSize": 20
    },
    "id": 1
}
```

#### threshold_getSession - Get Signing Session Status

```json
// Request
{
    "jsonrpc": "2.0",
    "method": "threshold_getSession",
    "params": {
        "sessionId": "0x789abc..."
    },
    "id": 1
}

// Response
{
    "jsonrpc": "2.0",
    "result": {
        "sessionId": "0x789abc...",
        "keyId": "eth-usdc-bridge",
        "messageHash": "0x7f83b165...",
        "state": "sharing",
        "currentRound": 2,
        "threshold": 11,
        "totalParties": 15,
        "commitments": 14,
        "shares": 8,
        "deadline": 1000,
        "createdAt": 950,
        "signers": ["nodeA", "nodeB", ...],
        "respondedSigners": ["nodeA", "nodeC", ...],
        "pendingSigners": ["nodeB", "nodeD", ...]
    },
    "id": 1
}
```

#### threshold_getReshareSession - Get Reshare Session Status

```json
// Request
{
    "jsonrpc": "2.0",
    "method": "threshold_getReshareSession",
    "params": {
        "reshareSessionId": "0xfed987..."
    },
    "id": 1
}

// Response
{
    "jsonrpc": "2.0",
    "result": {
        "reshareSessionId": "0xfed987...",
        "keyId": "eth-usdc-bridge",
        "state": "share_distribution",
        "currentGeneration": 3,
        "targetGeneration": 4,
        "oldThreshold": 11,
        "oldTotalParties": 15,
        "newThreshold": 13,
        "newTotalParties": 18,
        "oldParties": ["nodeA", "nodeB", ...],
        "newParties": ["nodeA", "nodeD", ...],
        "completedParties": 12,
        "deadline": 1100,
        "createdAt": 1000,
        "publicKeyVerified": false
    },
    "id": 1
}
```

#### threshold_getSignerInfo - Get Signer Details

```json
// Request
{
    "jsonrpc": "2.0",
    "method": "threshold_getSignerInfo",
    "params": {
        "nodeId": "nodeA"
    },
    "id": 1
}

// Response
{
    "jsonrpc": "2.0",
    "result": {
        "nodeId": "nodeA",
        "publicKey": "0x04abc123...",
        "endpoints": ["10.0.0.1:9631", "10.0.0.1:9632"],
        "stake": "50000000000000000000000",
        "status": "active",
        "joinedAt": 10000,
        "activeKeys": ["eth-usdc-bridge", "btc-taproot-vault", ...],
        "performance": {
            "totalSessions": 15847,
            "successfulSessions": 15832,
            "missedDeadlines": 12,
            "invalidShares": 3,
            "averageLatencyMs": 45,
            "uptime99d": 99.92
        },
        "rewards": {
            "pending": "125000000000000000000",
            "totalClaimed": "8750000000000000000000"
        }
    },
    "id": 1
}
```

#### threshold_listSigners - List Registered Signers

```json
// Request
{
    "jsonrpc": "2.0",
    "method": "threshold_listSigners",
    "params": {
        "status": "active",
        "minStake": "10000000000000000000000",
        "sortBy": "performance",
        "page": 1,
        "pageSize": 50
    },
    "id": 1
}

// Response
{
    "jsonrpc": "2.0",
    "result": {
        "signers": [
            {
                "nodeId": "nodeA",
                "stake": "50000000000000000000000",
                "activeKeys": 12,
                "successRate": 99.95,
                "avgLatencyMs": 45
            },
            {
                "nodeId": "nodeB",
                "stake": "35000000000000000000000",
                "activeKeys": 8,
                "successRate": 99.87,
                "avgLatencyMs": 52
            }
        ],
        "total": 47,
        "page": 1,
        "pageSize": 50
    },
    "id": 1
}
```

#### threshold_refresh - Trigger Proactive Share Refresh

```json
// Request
{
    "jsonrpc": "2.0",
    "method": "threshold_refresh",
    "params": {
        "keyId": "eth-usdc-bridge"
    },
    "id": 1
}

// Response
{
    "jsonrpc": "2.0",
    "result": {
        "txId": "0xabc789...",
        "keyId": "eth-usdc-bridge",
        "status": "refresh_initiated",
        "currentGeneration": 3,
        "newGeneration": 4,
        "estimatedCompletion": 20
    },
    "id": 1
}
```

#### threshold_getSignature - Retrieve Completed Signature

```json
// Request
{
    "jsonrpc": "2.0",
    "method": "threshold_getSignature",
    "params": {
        "requestId": "0xdef456..."
    },
    "id": 1
}

// Response (ECDSA)
{
    "jsonrpc": "2.0",
    "result": {
        "requestId": "0xdef456...",
        "keyId": "eth-usdc-bridge",
        "algorithm": "CGGMP21_ECDSA",
        "status": "completed",
        "signature": {
            "r": "0x7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069",
            "s": "0x4b2c8e5a9f3d6c1e7a8b5d4f2c9e6a3b1d8c5f4e2a9b7c6d3e1f4a8b2c5d9e6f",
            "v": 27
        },
        "completedAt": 1050,
        "signers": ["nodeA", "nodeC", "nodeE", "nodeG", "nodeH", "nodeJ", "nodeK", "nodeL", "nodeM", "nodeN", "nodeO"]
    },
    "id": 1
}

// Response (Schnorr/Taproot)
{
    "jsonrpc": "2.0",
    "result": {
        "requestId": "0xdef456...",
        "keyId": "btc-taproot-vault",
        "algorithm": "FROST_SCHNORR",
        "status": "completed",
        "signature": {
            "r": "0x7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069",
            "s": "0x4b2c8e5a9f3d6c1e7a8b5d4f2c9e6a3b1d8c5f4e2a9b7c6d3e1f4a8b2c5d9e6f"
        },
        "completedAt": 1050,
        "signers": ["nodeA", "nodeC", "nodeE"]
    },
    "id": 1
}
```

#### Additional RPC Method Summary

| Method | Description |
|--------|-------------|
| `threshold_getSession` | Get signing session status |
| `threshold_getReshareSession` | Get reshare session status |
| `threshold_getSignerInfo` | Get signer details and stats |
| `threshold_listSigners` | List registered signers |
| `threshold_refresh` | Trigger proactive share refresh |
| `threshold_getSignature` | Retrieve completed signature |
| `threshold_estimateGas` | Estimate gas for operation |
| `threshold_getRewards` | Get pending signer rewards |
| `threshold_claimRewards` | Claim accumulated rewards |
| `threshold_getChainInfo` | Get T-Chain status and parameters |
| `threshold_subscribe` | WebSocket subscription for events |

### Security Model

#### Threat Model

**Adversary Capabilities:**
1. Can corrupt up to t-1 signer nodes
2. Can observe all network traffic
3. Can delay (but not drop) messages
4. Has full control over corrupted nodes

**Security Goals:**
1. **Unforgeability**: Adversary cannot forge signatures without t shares
2. **Key Secrecy**: Adversary learns nothing about private key from < t shares
3. **Liveness**: Protocol completes if >= t honest parties participate
4. **Identifiable Abort**: Misbehaving parties can be identified and slashed

#### Cryptographic Assumptions

| Protocol | Assumptions |
|----------|-------------|
| CGGMP21 | Strong RSA, DDH, Paillier semantic security, ECDSA-EUF-CMA |
| FROST | Discrete Log (DLP), Random Oracle Model (ROM) |
| LSS | Information-theoretic security (no computational assumptions) |
| VSS | DLP for Feldman VSS verification |

#### Attack Mitigations

```go
// 1. Share Leakage Prevention
type ShareProtection struct {
    // Encrypt shares at rest
    EncryptedShare  []byte
    EncryptionKey   []byte  // Derived from validator key

    // Proactive refresh schedule
    RefreshInterval uint64  // Blocks between refreshes
    LastRefresh     uint64
}

// 2. Byzantine Signer Detection
type ByzantineDetection struct {
    // Track commitment-response consistency
    CommitmentHash  [32]byte
    ResponseHash    [32]byte

    // Slash on mismatch
    func VerifyConsistency() error {
        if !MatchesCommitment(response, commitment) {
            return SlashSigner(signerID, "commitment_mismatch")
        }
        return nil
    }
}

// 3. Replay Attack Prevention
type ReplayProtection struct {
    RequestNonce    uint64    // Unique per request
    SessionID       SessionID // Derived from nonce + keyID
    Timestamp       uint64    // Block timestamp

    // Reject duplicate sessions
    func IsReplay(state *ThresholdState) bool {
        _, exists := state.CompletedSessions[SessionID]
        return exists
    }
}

// 4. Timing Attack Prevention
type TimingProtection struct {
    // Constant-time operations
    func ConstantTimeCompare(a, b []byte) bool {
        return subtle.ConstantTimeCompare(a, b) == 1
    }

    // Randomized response timing
    func AddJitter(baseDelay time.Duration) time.Duration {
        jitter := rand.Intn(100) // 0-100ms jitter
        return baseDelay + time.Duration(jitter)*time.Millisecond
    }
}
```

#### Slashing Conditions

| Violation | Penalty | Evidence Required |
|-----------|---------|-------------------|
| Invalid share submission | 10% stake | Share fails VSS verification |
| Commitment mismatch | 20% stake | Commitment != H(response) |
| Double signing | 50% stake | Two valid shares for same session |
| Offline during session | 5% stake | No response before deadline |
| Key material exposure | 100% stake | Proven via signature analysis |

### Consensus Parameters

```go
var DefaultThresholdParams = Parameters{
    // Block Production
    BlockInterval:      2 * time.Second,
    MaxBlockSize:       2 * 1024 * 1024,  // 2MB

    // Session Limits
    MaxActiveSessions:  1000,
    SessionTimeout:     300,  // blocks (~10 minutes)
    MaxPartiesPerKey:   100,

    // Economic
    BaseKeygenFee:      10 * units.LUX,
    BaseSignFee:        0.1 * units.LUX,
    RewardPerSign:      0.05 * units.LUX,
    SlashBase:          100 * units.LUX,

    // Security
    MinThreshold:       2,
    MinRefreshInterval: 43200,  // ~1 day in blocks
    MaxKeyAge:          2592000, // ~60 days without refresh

    // Signer Requirements
    MinSignerStake:     10000 * units.LUX,
    MaxKeysPerSigner:   50,
}
```

## IANA-Style Protocol Registries

This section defines protocol registries for T-Chain identifiers. While not registered with IANA, these registries follow IANA conventions for extensibility and interoperability.

### Transaction Type Registry

| Type ID | Name | Description | Status |
|:--------|:-----|:------------|:-------|
| `0xT1` | KeyGenTx | Distributed key generation initiation | REQUIRED |
| `0xT2` | SignRequestTx | Threshold signature request | REQUIRED |
| `0xT3` | SignResponseTx | Signature share submission | REQUIRED |
| `0xT4` | ReshareTx | Key resharing initiation | REQUIRED |
| `0xT5` | ReshareCompleteTx | Resharing finalization | REQUIRED |
| `0xT6` | KeyRotateTx | Emergency key rotation | REQUIRED |
| `0xT7` | RefreshTx | Proactive share refresh | REQUIRED |
| `0xT8`-`0xTF` | Reserved | Reserved for future core extensions | - |
| `0x10`-`0xFF` | User-defined | Available for custom extensions | OPTIONAL |

New transaction types in the range `0xT8`-`0xTF` MUST be specified via an LP amendment. User-defined types (`0x10`-`0xFF`) MAY be used for application-specific extensions but MUST NOT conflict with core semantics.

### Signature Algorithm Registry

| Algorithm ID | Name | Curve | Security Level | Status |
|:-------------|:-----|:------|:---------------|:-------|
| `0x01` | CGGMP21_ECDSA | secp256k1 | 128-bit | REQUIRED |
| `0x02` | FROST_SCHNORR | secp256k1 | 128-bit | RECOMMENDED |
| `0x03` | FROST_EDDSA | ed25519 | 128-bit | RECOMMENDED |
| `0x04` | LSS_SCHNORR | secp256k1 | 128-bit | OPTIONAL |
| `0x05` | CGGMP21_ECDSA_P256 | P-256 | 128-bit | OPTIONAL |
| `0x06`-`0x0F` | Reserved | - | - | - |
| `0x10`-`0x1F` | Post-quantum | - | 128-256 bit | Future |

### Curve Type Registry

| Curve ID | Name | Field Size | ECDLP Security | Status |
|:---------|:-----|:-----------|:---------------|:-------|
| `0x01` | SECP256K1 | 256-bit | 128-bit | REQUIRED |
| `0x02` | ED25519 | 255-bit | 128-bit | REQUIRED |
| `0x03` | P256 (NIST) | 256-bit | 128-bit | OPTIONAL |
| `0x04` | P384 (NIST) | 384-bit | 192-bit | OPTIONAL |
| `0x05`-`0x0F` | Reserved | - | - | - |

### Message Type Registry

| Type ID | Name | Description | Encoding |
|:--------|:-----|:------------|:---------|
| `0x01` | RAW_HASH | Raw 32-byte hash | None |
| `0x02` | EIP712 | Ethereum typed data | EIP-712 |
| `0x03` | BIP340 | Bitcoin Taproot | BIP-340 tagged hash |
| `0x04` | COSMOS_ADR36 | Cosmos arbitrary signing | ADR-036 |
| `0x05` | LUX_WARP | Lux Warp message | Warp encoding |
| `0x06`-`0x0F` | Reserved | Reserved for standards | - |

### Session State Registry

| State ID | Name | Description |
|:---------|:-----|:------------|
| `0x00` | PENDING | Session created, awaiting participants |
| `0x01` | COMMITMENT | Round 1: collecting nonce commitments |
| `0x02` | SHARING | Round 2: collecting signature shares |
| `0x03` | AGGREGATING | Combining shares into final signature |
| `0x04` | COMPLETED | Signature successfully generated |
| `0x05` | FAILED | Session failed (timeout or abort) |
| `0x06` | ABORTED | Identifiable abort with misbehaving party |

## Wire Format Specification

This section defines the binary encoding for T-Chain protocol messages. All multi-byte integers use big-endian encoding. All messages MUST be prefixed with a 4-byte magic number `0x54434841` ("TCHA").

### Common Header Format

```
 0                   1                   2                   3
 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                         Magic (0x54434841)                    |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|    Version    |  Message Type |           Reserved            |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                        Payload Length                         |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                                                               |
+                        Session ID (32 bytes)                  +
|                                                               |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                                                               |
+                        Sender ID (20 bytes)                   +
|                                                               |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
```

| Field | Size | Description |
|:------|:-----|:------------|
| Magic | 4 bytes | Protocol identifier `0x54434841` |
| Version | 1 byte | Protocol version (current: `0x01`) |
| Message Type | 1 byte | See Message Type table below |
| Reserved | 2 bytes | MUST be zero |
| Payload Length | 4 bytes | Length of payload in bytes |
| Session ID | 32 bytes | Unique session identifier |
| Sender ID | 20 bytes | NodeID of message sender |

### Message Types

| Type | Value | Payload |
|:-----|:------|:--------|
| DKG_ROUND1 | `0x01` | DKGRound1Payload |
| DKG_ROUND2 | `0x02` | DKGRound2Payload |
| DKG_ROUND3 | `0x03` | DKGRound3Payload |
| SIGN_COMMITMENT | `0x10` | SignCommitmentPayload |
| SIGN_SHARE | `0x11` | SignSharePayload |
| RESHARE_SUBSHARE | `0x20` | ReshareSubsharePayload |
| RESHARE_PROOF | `0x21` | ReshareProofPayload |
| ABORT | `0xF0` | AbortPayload |
| ACK | `0xFF` | Empty |

### DKG Round 1 Payload (Commitment)

```
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|  Algorithm ID |   Curve ID    |    Threshold  |  Total Parties|
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                    Party Index (2 bytes)                      |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|        Commitment Count       |           Reserved            |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                                                               |
+                  Commitment[0] (33 bytes compressed)          +
|                                                               |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                              ...                              |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                                                               |
+                  Schnorr Proof (64 bytes)                     +
|                                                               |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
```

### Sign Commitment Payload (FROST Round 1)

```
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                    Party Index (2 bytes)                      |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                                                               |
+                  D Commitment (33 bytes compressed)           +
|                                                               |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                                                               |
+                  E Commitment (33 bytes compressed)           +
|                                                               |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
```

### Sign Share Payload (Round 2)

```
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                    Party Index (2 bytes)                      |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                                                               |
+                  Signature Share (32 bytes)                   +
|                                                               |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|        Proof Length           |                               |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+                               +
|                  Optional ZK Proof (variable)                 |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
```

### Abort Payload (Identifiable Abort)

```
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|   Abort Reason|                    Reserved                   |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                                                               |
+                  Accused Party ID (20 bytes)                  +
|                                                               |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|        Evidence Length        |                               |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+                               +
|                  Evidence Data (variable)                     |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
```

| Abort Reason | Value | Description |
|:-------------|:------|:------------|
| COMMITMENT_MISMATCH | `0x01` | Share does not match commitment |
| INVALID_SHARE | `0x02` | Share fails VSS verification |
| TIMEOUT | `0x03` | Party did not respond in time |
| DOUBLE_COMMIT | `0x04` | Party sent conflicting commitments |
| INVALID_PROOF | `0x05` | ZK proof verification failed |

## Security Analysis: Threshold-Specific Threat Vectors

This section analyzes threat vectors specific to threshold signature schemes beyond the general security model.

### T1: Adaptive Adversary Share Accumulation

**Threat**: An adversary corrupts different parties over time, accumulating shares across key generations.

**Analysis**: If adversary corrupts parties {P1, P2} in generation g1, then {P3, P4} in generation g2, they may hold shares that together exceed the threshold.

**Mitigation**:
- Proactive refresh MUST be performed at regular intervals (RECOMMENDED: every 43,200 blocks / ~1 day)
- Refresh invalidates all previous-generation shares
- Implementations MUST track share generation numbers
- Cross-generation share reconstruction MUST fail

```go
// Share generation binding
type BoundShare struct {
    Share      *big.Int
    Generation uint32
    KeyID      KeyID
}

func (s *BoundShare) Verify(expectedGen uint32) error {
    if s.Generation != expectedGen {
        return ErrGenerationMismatch // Prevents cross-gen attacks
    }
    return nil
}
```

### T2: Rogue Key Attack on FROST DKG

**Threat**: Malicious party chooses their polynomial coefficients after seeing honest parties' commitments, biasing the resulting public key.

**Analysis**: In FROST DKG Round 1, if an adversary waits to see all commitments before submitting theirs, they can compute coefficients that result in a public key with a known discrete log relationship to another key they control.

**Mitigation**:
- FROST DKG MUST use a commit-then-reveal structure
- Round 1 MUST collect hashed commitments H(C_i) before revealing C_i
- Implementations MUST reject late submissions
- Proof of knowledge MUST bind the commitment

```go
// Rogue key prevention via commit-reveal
type DKGCommitReveal struct {
    // Phase 1: Submit hash
    CommitHash [32]byte  // H(commitment || decommit_key)

    // Phase 2: Reveal (after all hashes collected)
    Commitment []byte
    DecommitKey [32]byte

    // Proof of knowledge prevents rogue key
    ProofOfKnowledge *SchnorrProof
}
```

### T3: Nonce Reuse in Threshold ECDSA

**Threat**: If the same nonce k is used for two different messages, the private key can be recovered.

**Analysis**: Given signatures (r, s1) and (r, s2) on messages m1 and m2 with same nonce:
```
k = (m1 - m2) / (s1 - s2) mod n
x = (s1 * k - m1) / r mod n
```

**Mitigation**:
- CGGMP21 MUST use pre-signed nonces computed during keygen
- Each nonce MUST be bound to a specific session ID
- Implementations MUST track used nonces and reject duplicates
- Nonces MUST be derived deterministically from session entropy

```go
// Nonce binding prevents reuse
type BoundNonce struct {
    Nonce     *big.Int
    SessionID SessionID
    KeyID     KeyID
    Used      bool
}

func (n *BoundNonce) MarkUsed() error {
    if n.Used {
        return ErrNonceAlreadyUsed
    }
    n.Used = true
    return nil
}
```

### T4: Grinding Attack on Session ID Selection

**Threat**: Adversary manipulates session ID generation to produce IDs that bias signing outcomes.

**Analysis**: If session IDs are not properly randomized, an adversary might generate many candidate sessions and select one with favorable properties.

**Mitigation**:
- Session IDs MUST include contributions from multiple parties
- Session ID = H(request_hash || block_hash || participant_nonces)
- No single party can control the session ID
- Implementations SHOULD use commit-reveal for participant nonces

### T5: Denial of Service via Signing Queue Flooding

**Threat**: Adversary submits many signature requests to exhaust signer resources.

**Analysis**: Each signing session requires signers to perform expensive operations. An adversary with sufficient funds could degrade service quality.

**Mitigation**:
- Base fee MUST be economically significant (0.1 LUX minimum)
- Dynamic fee market SHOULD increase fees under load
- Per-key rate limiting MUST be enforced (RECOMMENDED: 10 requests/block)
- Signer resource quotas MUST be implemented

```go
// Rate limiting per key
type RateLimiter struct {
    RequestsPerBlock map[KeyID]uint32
    MaxPerBlock      uint32 // Default: 10
}

func (r *RateLimiter) Allow(keyID KeyID, block uint64) bool {
    count := r.RequestsPerBlock[keyID]
    if count >= r.MaxPerBlock {
        return false
    }
    r.RequestsPerBlock[keyID]++
    return true
}
```

### T6: Sybil Attack on Signer Selection

**Threat**: Adversary creates multiple signer identities to gain disproportionate influence in key generation.

**Analysis**: If signer selection is based purely on stake, an adversary with N * MinStake could control N signer slots.

**Mitigation**:
- Minimum stake MUST be set high enough to limit Sybil economics (10,000 LUX)
- Signer selection SHOULD incorporate performance history
- Geographic and organizational diversity SHOULD be considered
- Maximum keys per signer MUST be enforced (50 keys)

### Security Parameter Requirements

| Parameter | Minimum | Recommended | Maximum |
|:----------|:--------|:------------|:--------|
| Threshold (t) | 2 | n/2 + 1 | n - 1 |
| Total Parties (n) | 3 | 7-15 | 100 |
| Refresh Interval | 21,600 blocks | 43,200 blocks | 86,400 blocks |
| Session Timeout | 100 blocks | 300 blocks | 600 blocks |
| Min Signer Stake | 1,000 LUX | 10,000 LUX | - |

## Interoperability

This section defines how T-Chain interoperates with other Lux chains and external systems.

### T-Chain to B-Chain Integration

T-Chain provides threshold signatures to B-Chain (BridgeVM) for cross-chain asset custody. Communication occurs via Lux Warp Messaging.

```
+-------------+     Warp Message      +-------------+
|   B-Chain   | --------------------> |   T-Chain   |
|  (BridgeVM) |   SignRequest         | (ThresholdVM|
+-------------+                       +-------------+
       ^                                     |
       |          Warp Message               |
       +--------- SignatureResult -----------+
```

**Request Flow**:
1. B-Chain BridgeVM constructs withdrawal message
2. B-Chain submits `SignRequest` via Warp to T-Chain
3. T-Chain validates request and initiates signing session
4. T-Chain returns signature via Warp callback
5. B-Chain uses signature to release assets on external chain

**RPC Endpoint**: `http://localhost:9630/ext/bc/T/rpc`

```go
// B-Chain to T-Chain signature request
type BridgeSignRequest struct {
    // Warp routing
    SourceChain   ids.ID  // B-Chain ID
    DestChain     ids.ID  // T-Chain ID

    // Signature parameters
    KeyID         KeyID
    MessageHash   [32]byte
    MessageType   MessageType

    // Callback
    CallbackID    RequestID
    Deadline      uint64
}

// T-Chain to B-Chain response
type BridgeSignResponse struct {
    RequestID     RequestID
    Signature     []byte        // DER or raw format
    SignerSet     []party.ID    // Who signed
    Success       bool
    Error         string        // If failed
}
```

### T-Chain to K-Chain Integration

K-Chain (KeyManagementVM) stores key metadata and access control policies. T-Chain queries K-Chain for authorization decisions.

```
+-------------+     Query Policy      +-------------+
|   T-Chain   | --------------------> |   K-Chain   |
| (ThresholdVM|                       |  (KeyMgmtVM)|
+-------------+                       +-------------+
       ^                                     |
       |          Authorization              |
       +----------- Response ---------------+
```

**Authorization Flow**:
1. T-Chain receives `SignRequest` for key K
2. T-Chain queries K-Chain: "Can requester R sign with key K?"
3. K-Chain evaluates policies (rate limits, time windows, amount limits)
4. K-Chain returns authorization decision
5. T-Chain proceeds or rejects based on decision

```go
// K-Chain authorization query
type AuthorizationQuery struct {
    KeyID       KeyID
    Requester   Address
    Operation   string     // "sign", "reshare", "rotate"
    Context     AuthContext
}

type AuthContext struct {
    Amount      *big.Int   // For amount-limited keys
    Destination Address    // For destination-limited keys
    Timestamp   uint64
}

type AuthorizationResponse struct {
    Allowed     bool
    Reason      string
    RateLimit   *RateLimitStatus
    Expiry      uint64     // Authorization expires at block
}
```

### T-Chain to M-Chain Integration

M-Chain (MultisigVM) can delegate signing authority to T-Chain for operations requiring threshold signatures.

**Delegation Pattern**:
1. M-Chain multisig approves operation
2. M-Chain submits to T-Chain as authorized requester
3. T-Chain verifies M-Chain signature on request
4. T-Chain performs threshold signing
5. Result returned to M-Chain for execution

### External Chain Integration

T-Chain signatures are consumed by smart contracts on external chains (Ethereum, Bitcoin, Solana, etc.).

**Ethereum Integration**:
```solidity
// Solidity interface for T-Chain signature verification
interface ITChainVerifier {
    // Verify ECDSA signature from T-Chain
    function verifyTChainSignature(
        bytes32 keyId,
        bytes32 messageHash,
        bytes calldata signature
    ) external view returns (bool);

    // Get T-Chain public key for a key ID
    function getTChainPublicKey(
        bytes32 keyId
    ) external view returns (bytes memory);
}
```

**Bitcoin Taproot Integration**:
```
T-Chain FROST signature -> 64-byte Schnorr signature
                        -> Taproot witness spend
                        -> Bitcoin transaction broadcast
```

### Cross-Chain Message Format

Messages between chains use a standardized envelope:

```go
type CrossChainMessage struct {
    Version     uint8
    SourceChain ids.ID
    DestChain   ids.ID
    Nonce       uint64
    Payload     []byte
    Signature   []byte   // BLS aggregate from source chain validators
}
```

### Interoperability Requirements

1. T-Chain MUST accept Warp messages from registered consumer chains (B-Chain, M-Chain)
2. T-Chain MUST validate Warp message signatures before processing
3. T-Chain MUST return signatures in format compatible with destination chain
4. External chain integrations MUST verify T-Chain signatures match registered public keys
5. Rate limits SHOULD be enforced per source chain

## Rationale

### Why Dedicated T-Chain?

1. **Isolation**: Threshold operations require careful state management; dedicated chain prevents interference
2. **Specialization**: ThresholdVM optimized for cryptographic operations, not general computation
3. **Security Boundary**: Clear separation between signing logic and application logic
4. **Resource Guarantee**: No competition for block space with other applications

### Why Per-Key Threshold Configuration?

Different use cases require different security profiles:

| Use Case | Recommended | Rationale |
|----------|-------------|-----------|
| Bridge vault ($1B+) | 11-of-15 | Maximum security, can tolerate 4 offline |
| DAO treasury | 5-of-7 | Balance security/usability |
| Hot wallet | 2-of-3 | Fast signing, limited exposure |
| Oracle signing | 7-of-10 | Byzantine fault tolerance |

Global threshold would force one-size-fits-all, reducing flexibility.

### Why LSS for Resharing?

Alternatives considered:

1. **Full Key Regeneration**: Requires new public key, breaking existing integrations
2. **Proactive Secret Sharing**: Only refreshes shares, doesn't change signer set
3. **Additive Resharing**: Limited to adding parties, not removing

LSS provides:
- Same public key across generations
- Both addition and removal of parties
- Threshold can be adjusted
- Information-theoretic security

### Why Support Both CGGMP21 and FROST?

| Chain | Signature | Protocol |
|-------|-----------|----------|
| Ethereum | ECDSA | CGGMP21 |
| Bitcoin | Schnorr (Taproot) | FROST |
| Solana | EdDSA | FROST |
| Cosmos | Secp256k1 | CGGMP21 |

Supporting both protocols enables T-Chain to serve as universal threshold service for all major chains.

## Backwards Compatibility

T-Chain is a new subnet; no backwards compatibility concerns.

### Integration with Existing Chains

- **B-Chain**: Uses T-Chain for bridge vault signatures via Warp messaging
- **M-Chain**: Uses T-Chain for swap signatures
- **C-Chain**: Contracts can request signatures via T-Chain precompile

### Migration from M-Chain MPC

Existing M-Chain MPC operations can migrate to T-Chain:

1. Register existing keys on T-Chain via `KeyGenTx` with known public keys
2. Run parallel signing during transition
3. Update consumers to use T-Chain RPC
4. Deprecate M-Chain MPC endpoints

## Test Cases

### Unit Tests

```go
func TestKeyGeneration(t *testing.T) {
    // Test 3-of-5 CGGMP21 key generation
    parties := []party.ID{"p1", "p2", "p3", "p4", "p5"}
    threshold := 3

    config, err := tchain.GenerateKey(
        "test-key",
        CGGMP21_ECDSA,
        SECP256K1,
        threshold,
        parties,
    )
    require.NoError(t, err)
    require.Len(t, config.PartyIDs, 5)
    require.Equal(t, 3, config.Threshold)

    // Verify public key is valid secp256k1 point
    require.True(t, secp256k1.IsOnCurve(config.PublicKey))
}

func TestThresholdSigning(t *testing.T) {
    // Setup 3-of-5 key
    key := setupTestKey(t, 5, 3)
    message := sha256.Sum256([]byte("test message"))

    // Sign with exactly threshold parties
    signers := key.PartyIDs[:3]
    sig, err := tchain.Sign(key.KeyID, message[:], signers)
    require.NoError(t, err)

    // Verify signature
    valid := ecdsa.Verify(key.PublicKey, message[:], sig)
    require.True(t, valid)

    // Sign with fewer than threshold should fail
    _, err = tchain.Sign(key.KeyID, message[:], key.PartyIDs[:2])
    require.Error(t, err)
    require.Contains(t, err.Error(), "insufficient signers")
}

func TestDynamicResharing(t *testing.T) {
    // Initial 3-of-5
    key := setupTestKey(t, 5, 3)
    originalPubKey := key.PublicKey

    // Reshare to 4-of-7 with partial overlap
    newParties := []party.ID{"p1", "p2", "p6", "p7", "p8", "p9", "p10"}
    newKey, err := tchain.Reshare(key.KeyID, 4, newParties)
    require.NoError(t, err)

    // Verify public key unchanged
    require.True(t, bytes.Equal(newKey.PublicKey, originalPubKey))

    // Verify new configuration
    require.Equal(t, 4, newKey.Threshold)
    require.Equal(t, 7, newKey.TotalParties)
    require.Equal(t, key.Generation+1, newKey.Generation)

    // Verify signing works with new parties
    message := sha256.Sum256([]byte("post-reshare test"))
    sig, err := tchain.Sign(newKey.KeyID, message[:], newParties[:4])
    require.NoError(t, err)
    require.True(t, ecdsa.Verify(originalPubKey, message[:], sig))
}

func TestFROSTTaproot(t *testing.T) {
    // Setup 3-of-5 FROST key for Bitcoin Taproot
    key := setupTestKey(t, 5, 3, FROST_SCHNORR, SECP256K1)
    message := sha256.Sum256([]byte("bitcoin transaction"))

    // Sign with FROST
    sig, err := tchain.SignTaproot(key.KeyID, message[:], key.PartyIDs[:3])
    require.NoError(t, err)

    // Verify BIP-340 signature format
    require.Len(t, sig.R, 32)  // x-only
    require.Len(t, sig.S, 32)

    // Verify with Bitcoin Taproot verification
    valid := taproot.Verify(key.PublicKey.X(), message[:], sig)
    require.True(t, valid)
}

func TestByzantineSignerDetection(t *testing.T) {
    key := setupTestKey(t, 5, 3)

    // Simulate malicious signer submitting invalid share
    session := startSignSession(t, key.KeyID)

    // Honest signers submit valid commitments
    for _, pid := range key.PartyIDs[:2] {
        submitValidCommitment(t, session, pid)
    }

    // Malicious signer submits mismatched commitment/share
    maliciousPID := key.PartyIDs[2]
    commitment := submitValidCommitment(t, session, maliciousPID)

    // Submit share that doesn't match commitment
    invalidShare := []byte("invalid share data")
    err := submitShare(t, session, maliciousPID, invalidShare)
    require.Error(t, err)
    require.Contains(t, err.Error(), "commitment mismatch")

    // Verify slashing event created
    events := getSlashingEvents(t, maliciousPID)
    require.Len(t, events, 1)
    require.Equal(t, "commitment_mismatch", events[0].Reason)
}

func TestProactiveRefresh(t *testing.T) {
    key := setupTestKey(t, 5, 3)
    originalPubKey := key.PublicKey
    originalGeneration := key.Generation

    // Trigger refresh
    refreshedKey, err := tchain.RefreshShares(key.KeyID)
    require.NoError(t, err)

    // Public key unchanged
    require.True(t, bytes.Equal(refreshedKey.PublicKey, originalPubKey))

    // Generation incremented
    require.Equal(t, originalGeneration+1, refreshedKey.Generation)

    // Old shares should no longer work (in real system)
    // New shares should work
    message := sha256.Sum256([]byte("post-refresh test"))
    sig, err := tchain.Sign(key.KeyID, message[:], key.PartyIDs[:3])
    require.NoError(t, err)
    require.True(t, ecdsa.Verify(originalPubKey, message[:], sig))
}
```

### Integration Tests

```go
func TestEndToEndBridgeSignature(t *testing.T) {
    // 1. B-Chain requests signature from T-Chain
    bridgeRequest := &BridgeSignRequest{
        KeyID:     "eth-usdc-bridge",
        TxHash:    sha256.Sum256([]byte("bridge tx data")),
        Deadline:  currentBlock + 100,
    }

    // 2. Submit via Warp message
    warpMsg := createWarpMessage(bridgeRequest)
    txID, err := tchain.SubmitSignRequest(warpMsg)
    require.NoError(t, err)

    // 3. Wait for signature completion
    sig, err := waitForSignature(txID, 30*time.Second)
    require.NoError(t, err)

    // 4. Verify signature valid for bridge vault address
    bridgeAddress := getKeyAddress(t, "eth-usdc-bridge")
    valid := verifyEthereumSignature(bridgeAddress, bridgeRequest.TxHash, sig)
    require.True(t, valid)
}

func TestCrossChainReshare(t *testing.T) {
    // Simulate validator rotation triggering reshare

    // 1. Q-Chain reports validator set change
    oldValidators := []NodeID{"v1", "v2", "v3", "v4", "v5"}
    newValidators := []NodeID{"v1", "v2", "v4", "v6", "v7"}  // v3, v5 exit; v6, v7 join

    // 2. T-Chain receives validator update
    err := tchain.HandleValidatorUpdate(newValidators)
    require.NoError(t, err)

    // 3. Keys with exited validators should be reshared
    keysAffected := tchain.GetKeysWithSigners([]NodeID{"v3", "v5"})
    for _, keyID := range keysAffected {
        status := getKeyStatus(t, keyID)
        require.Equal(t, "resharing", status)
    }

    // 4. Wait for reshare completion
    for _, keyID := range keysAffected {
        waitForReshareComplete(t, keyID, 60*time.Second)

        key := getKey(t, keyID)
        // Verify no exited validators in new party set
        for _, pid := range key.PartyIDs {
            require.NotContains(t, []NodeID{"v3", "v5"}, NodeID(pid))
        }
    }
}
```

### Stress Tests

```go
func TestHighThroughputSigning(t *testing.T) {
    // Setup multiple keys
    keys := setupTestKeys(t, 10, 5, 3)  // 10 keys, 5-of-3 each

    // Submit 1000 signature requests concurrently
    var wg sync.WaitGroup
    results := make(chan error, 1000)

    for i := 0; i < 1000; i++ {
        wg.Add(1)
        go func(idx int) {
            defer wg.Done()
            keyID := keys[idx%10].KeyID
            message := sha256.Sum256([]byte(fmt.Sprintf("msg-%d", idx)))
            _, err := tchain.Sign(keyID, message[:], nil)
            results <- err
        }(i)
    }

    wg.Wait()
    close(results)

    // All signatures should complete
    var errors []error
    for err := range results {
        if err != nil {
            errors = append(errors, err)
        }
    }
    require.Empty(t, errors, "Expected no errors, got %d", len(errors))
}

func TestLargeSignerSet(t *testing.T) {
    // Test with 100 signers (maximum)
    parties := make([]party.ID, 100)
    for i := range parties {
        parties[i] = party.ID(fmt.Sprintf("signer-%d", i))
    }

    // 67-of-100 threshold
    key, err := tchain.GenerateKey("large-key", CGGMP21_ECDSA, SECP256K1, 67, parties)
    require.NoError(t, err)

    // Sign with exactly 67 parties
    message := sha256.Sum256([]byte("large threshold test"))
    sig, err := tchain.Sign(key.KeyID, message[:], parties[:67])
    require.NoError(t, err)
    require.True(t, ecdsa.Verify(key.PublicKey, message[:], sig))
}
```

### Test Vectors

This section provides concrete test vectors for implementers to verify correctness of cryptographic operations.

#### Test Vector 1: LSS Share Generation (2-of-3)

```
# Shamir Secret Sharing over secp256k1 order
Field Order (n): 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141

# Secret (private key)
Secret (s): 0x0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF

# Polynomial coefficients: f(x) = s + a1*x (degree 1 for t=2)
a1: 0xFEDCBA9876543210FEDCBA9876543210FEDCBA9876543210FEDCBA9876543210

# Shares f(i) for i = 1, 2, 3
Share 1 (x=1): 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF0000000000000000000000000000000F
Share 2 (x=2): 0xFEDCBA9876543210FEDCBA9876543210FEDCBA987654321000000000000001F
Share 3 (x=3): 0xFDB97530ECA86421FDB97530ECA86420FECBA9877654320100000000000002F

# Lagrange coefficients for reconstruction (shares 1 and 2)
Lambda_1 (for x=1): 2
Lambda_2 (for x=2): -1 (mod n)

# Verification: s = Lambda_1 * Share_1 + Lambda_2 * Share_2
```

#### Test Vector 2: Feldman VSS Commitments

```
# Generator G (secp256k1)
G_x: 0x79BE667EF9DCBBAC55A06295CE870B07029BFCDB2DCE28D959F2815B16F81798
G_y: 0x483ADA7726A3C4655DA4FBFC0E1108A8FD17B448A68554199C47D08FFB10D4B8

# Polynomial coefficients (same as above)
a0 = s: 0x0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF
a1:     0xFEDCBA9876543210FEDCBA9876543210FEDCBA9876543210FEDCBA9876543210

# Commitments C_j = a_j * G
C_0 (public key):
  x: 0x4F355BDCB7CC0AF728EF3CCEB9615D90684BB5B2CA5F859AB0F0B704075871AA
  y: 0x385B83C3D5BE3A8C6AF2FA0B62E7D5E8F9E7D8C6B5A4B3A2918273645546373A

C_1:
  x: 0x7E2B897B8CEBC6BB9E6C8F1F20F1E2E3E4F5F6F7F8F9FAFBFCFDFEFF00010203
  y: 0x1A2B3C4D5E6F707172737475767778797A7B7C7D7E7F80818283848586878889

# Verification for Share 1: Share_1 * G == C_0 + 1 * C_1
```

#### Test Vector 3: FROST Signing (2-of-3 on secp256k1)

```
# Group public key Y (aggregated from DKG)
Y_x: 0x4F355BDCB7CC0AF728EF3CCEB9615D90684BB5B2CA5F859AB0F0B704075871AA
Y_y: 0x385B83C3D5BE3A8C6AF2FA0B62E7D5E8F9E7D8C6B5A4B3A2918273645546373A

# Message hash
m: 0x7F83B1657FF1FC53B92DC18148A1D65DFC2D4B1FA3D677284ADDD200126D9069

# Signers: parties 1 and 2

# Party 1 nonces (round 1)
d_1: 0x1111111111111111111111111111111111111111111111111111111111111111
e_1: 0x2222222222222222222222222222222222222222222222222222222222222222
D_1 = d_1 * G:
  x: 0x4D5A86F273D2EA73FC50F70A7B9C8D7E6F5049382D3C4B5A6978877665544332
E_1 = e_1 * G:
  x: 0x5B6C7D8E9FA0B1C2D3E4F50617283940A1B2C3D4E5F60718293A4B5C6D7E8F90

# Party 2 nonces (round 1)
d_2: 0x3333333333333333333333333333333333333333333333333333333333333333
e_2: 0x4444444444444444444444444444444444444444444444444444444444444444
D_2 = d_2 * G:
  x: 0x6C7D8E9FA0B1C2D3E4F5061728394041B2C3D4E5F607182930A4B5C6D7E8F901
E_2 = e_2 * G:
  x: 0x7D8E9FA0B1C2D3E4F506172839404152C3D4E5F60718293041B5C6D7E8F90102

# Binding values (rho)
rho_1 = H("FROST-binding", 1, m, {D_1, E_1, D_2, E_2}):
  0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
rho_2 = H("FROST-binding", 2, m, {D_1, E_1, D_2, E_2}):
  0xBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB

# Group commitment R = sum(D_i + rho_i * E_i)
R_x: 0x8E9FA0B1C2D3E4F50617283940415263D4E5F6071829304152C6D7E8F9010203

# Challenge c = H("FROST-challenge", R, Y, m)
c: 0xCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC

# Lagrange coefficients
lambda_1 = 2
lambda_2 = -1 (mod n)

# Party signature shares (round 2)
# z_i = d_i + e_i * rho_i + lambda_i * x_i * c
z_1: 0x1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF
z_2: 0xFEDCBA0987654321FEDCBA0987654321FEDCBA0987654321FEDCBA0987654321

# Aggregate signature
z = z_1 + z_2 (mod n): 0x11111111111111111111111111111111111111111111111111111111111110

# Final signature
Signature (R, z):
  R: 0x8E9FA0B1C2D3E4F50617283940415263D4E5F6071829304152C6D7E8F9010203
  z: 0x11111111111111111111111111111111111111111111111111111111111110

# Verification: z * G == R + c * Y
```

#### Test Vector 4: CGGMP21 Paillier MtA

```
# Paillier modulus N (2048-bit, truncated for display)
N: 0xC5B2...7F3D (2048 bits)

# Party A input a, Party B input b
a: 0x0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF
b: 0xFEDCBA9876543210FEDCBA9876543210FEDCBA9876543210FEDCBA9876543210

# Target: alpha + beta = a * b (mod curve order)

# Party A encrypts a
Enc(a): 0x1234...5678 (4096 bits)

# Party B computes response
beta (random): 0x9876543210FEDCBA9876543210FEDCBA9876543210FEDCBA9876543210FEDCBA
response = Enc(a)^b * Enc(-beta): 0xABCD...EF01 (4096 bits)

# Party A decrypts
alpha = Dec(response) (mod n)

# Verification
alpha + beta == a * b (mod curve order)
```

#### Test Vector 5: Wire Format Encoding

```
# SignCommitment message for FROST Round 1

# Header (64 bytes)
Magic:          0x54434841  # "TCHA"
Version:        0x01
Message Type:   0x10        # SIGN_COMMITMENT
Reserved:       0x0000
Payload Length: 0x00000044  # 68 bytes
Session ID:     0x7F83B1657FF1FC53B92DC18148A1D65DFC2D4B1FA3D677284ADDD200126D9069
Sender ID:      0x8DB97C7CECE249C2B98BDC0226CC4C2A57BF52FC

# Payload (68 bytes)
Party Index:    0x0001
D Commitment:   0x024D5A86F273D2EA73FC50F70A7B9C8D7E6F5049382D3C4B5A6978877665544332
E Commitment:   0x025B6C7D8E9FA0B1C2D3E4F50617283940A1B2C3D4E5F60718293A4B5C6D7E8F90

# Full message (hex)
54434841 01100000 00000044
7F83B1657FF1FC53B92DC18148A1D65DFC2D4B1FA3D677284ADDD200126D9069
8DB97C7CECE249C2B98BDC0226CC4C2A57BF52FC
0001
024D5A86F273D2EA73FC50F70A7B9C8D7E6F5049382D3C4B5A6978877665544332
025B6C7D8E9FA0B1C2D3E4F50617283940A1B2C3D4E5F60718293A4B5C6D7E8F90
```

#### Test Vector 6: RPC Request/Response

```json
// Request: threshold_sign
{
    "jsonrpc": "2.0",
    "method": "threshold_sign",
    "params": {
        "keyId": "test-vector-key",
        "messageHash": "0x7F83B1657FF1FC53B92DC18148A1D65DFC2D4B1FA3D677284ADDD200126D9069",
        "messageType": "RAW_HASH",
        "deadline": 1000000
    },
    "id": 1
}

// Expected response (after signing completes)
{
    "jsonrpc": "2.0",
    "result": {
        "requestId": "0xABCDEF1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890",
        "keyId": "test-vector-key",
        "algorithm": "FROST_SCHNORR",
        "status": "completed",
        "signature": {
            "r": "0x8E9FA0B1C2D3E4F50617283940415263D4E5F6071829304152C6D7E8F9010203",
            "s": "0x0000000000000000000000000000000011111111111111111111111111111110"
        },
        "completedAt": 999850,
        "signers": ["party1", "party2"]
    },
    "id": 1
}
```

## Reference Implementation

### Repository Structure

```
github.com/luxfi/node/vms/thresholdvm/
├── vm.go                   # ThresholdVM implementation
├── state.go                # State management
├── block.go                # Block structure and validation
├── tx/
│   ├── keygen.go           # KeyGenTx
│   ├── sign_request.go     # SignRequestTx
│   ├── sign_response.go    # SignResponseTx
│   ├── reshare.go          # ReshareTx
│   ├── reshare_complete.go # ReshareCompleteTx
│   └── key_rotate.go       # KeyRotateTx
├── session/
│   ├── dkg_session.go      # DKG protocol state machine
│   ├── sign_session.go     # Signing session management
│   └── reshare_session.go  # Reshare protocol state machine
├── protocol/
│   ├── cggmp21/            # CGGMP21 implementation
│   ├── frost/              # FROST implementation
│   └── lss/                # LSS resharing implementation
├── rpc/
│   ├── service.go          # JSON-RPC handlers
│   └── types.go            # RPC request/response types
└── config.go               # Chain configuration

github.com/luxfi/node/crypto/threshold/
├── lss/
│   ├── share.go            # Secret sharing primitives
│   ├── vss.go              # Verifiable secret sharing
│   └── reshare.go          # Resharing protocol
├── cggmp21/
│   ├── keygen.go           # DKG protocol
│   ├── sign.go             # Signing protocol
│   ├── presign.go          # Pre-signing
│   └── refresh.go          # Key refresh
└── frost/
    ├── keygen.go           # DKG protocol
    ├── sign.go             # Signing protocol
    └── taproot.go          # BIP-340 support

github.com/luxfi/sdk/multisig/
├── threshold.go            # High-level threshold API
├── keygen.go               # Key generation helpers
├── sign.go                 # Signing helpers
└── reshare.go              # Resharing helpers
```

### Key Implementation Files

**vm.go - ThresholdVM Core**
```go
package thresholdvm

import (
    "github.com/luxfi/ids"
    "github.com/luxfi/database/manager"
    "github.com/luxfi/node/snow"
    "github.com/luxfi/node/snow/engine/common"
    "github.com/luxfi/node/vms"
    "github.com/luxfi/threshold/cggmp21"
    "github.com/luxfi/threshold/frost"
    "github.com/luxfi/threshold/lss"
)

var (
    _ vms.VM = (*VM)(nil)
)

type VM struct {
    ctx    *snow.Context
    state  *ThresholdState
    config *Config

    // Protocol managers
    cggmp21 *cggmp21.Manager
    frost   *frost.Manager
    lss     *lss.Manager
}

func (vm *VM) Initialize(
    ctx *snow.Context,
    dbManager manager.Manager,
    genesisBytes []byte,
    upgradeBytes []byte,
    configBytes []byte,
    toEngine chan<- common.Message,
    fxs []*common.Fx,
    appSender common.AppSender,
) error {
    // Initialize state
    vm.state = NewThresholdState(dbManager)

    // Initialize protocol managers
    vm.cggmp21 = cggmp21.NewManager(vm.ctx, vm.state)
    vm.frost = frost.NewManager(vm.ctx, vm.state)
    vm.lss = lss.NewManager(vm.ctx, vm.state)

    // Parse genesis
    genesis, err := ParseGenesis(genesisBytes)
    if err != nil {
        return err
    }

    // Initialize genesis keys
    for _, key := range genesis.Keys {
        vm.state.ManagedKeys[key.KeyID] = key
    }

    return nil
}
```

## Security Considerations

### Key Management

1. **Share Storage**: Shares MUST be encrypted at rest using validator key material
2. **Memory Protection**: Shares SHOULD be stored in secure memory regions when available
3. **Access Control**: Only ThresholdVM process should access share storage
4. **Backup**: Shares SHOULD be backed up to prevent loss (but backup security critical)

### Network Security

1. **Authenticated Channels**: All signer communication MUST use TLS with mutual authentication
2. **Message Integrity**: All protocol messages MUST include authenticated signatures
3. **Replay Protection**: Session IDs and nonces MUST be verified
4. **DoS Mitigation**: Rate limiting on sign requests, session limits per key

### Operational Security

1. **Monitoring**: Real-time alerting for failed sessions, slashing events
2. **Incident Response**: Procedures for key rotation on compromise
3. **Audit Logging**: Complete transcript of all protocol messages
4. **Access Review**: Regular review of key owners and delegatees

### Threat Mitigations

| Threat | Mitigation |
|--------|------------|
| Key Extraction | Threshold prevents extraction; proactive refresh limits exposure |
| Byzantine Signers | Identifiable abort with slashing |
| Replay Attacks | Unique session IDs, nonce binding |
| Man-in-the-Middle | Authenticated channels, commitment schemes |
| Timing Attacks | Constant-time operations, response jitter |
| Share Leakage | Encrypted storage, proactive refresh |
| Validator Compromise | Minimum overlap requirements for resharing |

## Economic Impact

### Fee Structure

| Operation | Base Fee | Per-Party Fee |
|-----------|----------|---------------|
| KeyGen | 10 LUX | 1 LUX |
| Sign | 0.1 LUX | 0.01 LUX |
| Reshare | 5 LUX | 0.5 LUX |
| Refresh | 2 LUX | 0.2 LUX |

### Signer Rewards

- **Per-Signature Reward**: 0.05 LUX (split among participating signers)
- **Availability Bonus**: 0.01 LUX per epoch for > 99% response rate
- **Reward Source**: Sign request fees + T-Chain block rewards

### Slashing Economics

| Violation | Slash Amount | Recipient |
|-----------|--------------|-----------|
| Invalid Share | 10% stake | Burn |
| Commitment Mismatch | 20% stake | 50% reporter, 50% burn |
| Double Sign | 50% stake | 50% reporter, 50% burn |
| Offline | 5% stake | Burn |

## Open Questions

1. **Cross-Chain Key Discovery**: How should consumers discover available T-Chain keys?
2. **Key Expiration**: Should keys have mandatory expiration requiring renewal?
3. **Emergency Pause**: Should there be a mechanism to pause all signing?
4. **Fee Market**: Should signature fees be dynamic based on demand?

## Future Work

1. **Post-Quantum Threshold**: Integrate Ringtail for quantum-safe threshold signatures
2. **Hardware Security Module (HSM) Integration**: Support for HSM-backed shares
3. **Multi-Chain Aggregation**: Sign for multiple chains in single session
4. **Threshold Encryption**: Add threshold decryption capabilities

## Implementation Timeline

### Phase 1: Core Protocol (Q1 2025)

| Milestone | Description | Duration | Dependencies |
|-----------|-------------|----------|--------------|
| **M1.1** | ThresholdVM core state machine | 4 weeks | - |
| **M1.2** | LSS/VSS library implementation | 3 weeks | - |
| **M1.3** | CGGMP21 key generation protocol | 4 weeks | M1.2 |
| **M1.4** | Basic RPC API endpoints | 2 weeks | M1.1 |
| **M1.5** | Unit test suite (>90% coverage) | 2 weeks | M1.1-M1.4 |

**Deliverables:**
- `github.com/luxfi/threshold` - Core threshold cryptography library
- `github.com/luxfi/node/vms/thresholdvm` - ThresholdVM implementation
- Genesis configuration for T-Chain testnet

### Phase 2: Signing Protocols (Q2 2025)

| Milestone | Description | Duration | Dependencies |
|-----------|-------------|----------|--------------|
| **M2.1** | CGGMP21 signing with presignatures | 4 weeks | M1.3 |
| **M2.2** | FROST Schnorr signing protocol | 3 weeks | M1.2 |
| **M2.3** | FROST EdDSA (Ed25519) support | 2 weeks | M2.2 |
| **M2.4** | BIP-340 Taproot compatibility | 2 weeks | M2.2 |
| **M2.5** | Signing session orchestration | 3 weeks | M2.1, M2.2 |
| **M2.6** | Integration test suite | 2 weeks | M2.1-M2.5 |

**Deliverables:**
- Complete signing protocol implementations
- Session management with timeout handling
- Cross-protocol signing API

### Phase 3: Dynamic Resharing (Q2-Q3 2025)

| Milestone | Description | Duration | Dependencies |
|-----------|-------------|----------|--------------|
| **M3.1** | LSS reshare protocol implementation | 4 weeks | M1.2 |
| **M3.2** | Validator-to-signer mapping | 2 weeks | M3.1 |
| **M3.3** | Automatic reshare on validator change | 3 weeks | M3.2 |
| **M3.4** | Proactive share refresh | 2 weeks | M3.1 |
| **M3.5** | Generation management and rollback | 2 weeks | M3.3 |

**Deliverables:**
- Zero-downtime signer rotation
- Automatic reshare triggers via P-Chain/Q-Chain watcher
- Generation tracking with atomic rollback

### Phase 4: B-Chain Integration (Q3 2025)

| Milestone | Description | Duration | Dependencies |
|-----------|-------------|----------|--------------|
| **M4.1** | T-Chain to B-Chain Warp messaging | 3 weeks | M2.5 |
| **M4.2** | Bridge signature request flow | 3 weeks | M4.1 |
| **M4.3** | Per-asset threshold configuration | 2 weeks | M4.2 |
| **M4.4** | Callback delivery to external chains | 3 weeks | M4.2 |
| **M4.5** | End-to-end bridge signing tests | 2 weeks | M4.1-M4.4 |

**Deliverables:**
- Complete B-Chain integration (see [LP-331](./lp-0331-b-chain-bridgevm-specification.md))
- External chain signature delivery
- Per-asset key management (see [LP-334](./lp-0334-per-asset-threshold-key-management.md))

### Phase 5: Security Hardening (Q4 2025)

| Milestone | Description | Duration | Dependencies |
|-----------|-------------|----------|--------------|
| **M5.1** | Identifiable abort implementation | 3 weeks | M2.1 |
| **M5.2** | Slashing condition enforcement | 2 weeks | M5.1 |
| **M5.3** | Encrypted share storage | 2 weeks | - |
| **M5.4** | External security audit | 6 weeks | M5.1-M5.3 |
| **M5.5** | Bug bounty program launch | 2 weeks | M5.4 |

**Deliverables:**
- Audited threshold signature implementation
- Slashing for protocol violations
- Secure share storage

### Phase 6: Mainnet Launch (Q1 2026)

| Milestone | Description | Duration | Dependencies |
|-----------|-------------|----------|--------------|
| **M6.1** | Testnet stress testing | 4 weeks | M5.4 |
| **M6.2** | Performance optimization | 3 weeks | M6.1 |
| **M6.3** | Mainnet genesis configuration | 2 weeks | M6.2 |
| **M6.4** | Mainnet deployment | 1 week | M6.3 |
| **M6.5** | Post-launch monitoring | Ongoing | M6.4 |

**Deliverables:**
- Production-ready T-Chain
- Mainnet genesis with initial signer set
- Monitoring and alerting infrastructure

### Timeline Visualization

```
2025 Q1     2025 Q2     2025 Q3     2025 Q4     2026 Q1
|-----------|-----------|-----------|-----------|-----------|
[=== Phase 1: Core Protocol ===]
            [=== Phase 2: Signing ===]
                    [=== Phase 3: Resharing ===]
                        [=== Phase 4: B-Chain Integration ===]
                                    [=== Phase 5: Security ===]
                                                [=== Phase 6: Launch ===]
```

### Related LP Dependencies

| LP | Title | Integration Point |
|----|-------|-------------------|
| [LP-331](./lp-0331-b-chain-bridgevm-specification.md) | B-Chain BridgeVM | Signature consumer |
| [LP-332](./lp-0332-teleport-bridge-architecture-unified-cross-chain-protocol.md) | Teleport Architecture | System design |
| [LP-333](./lp-0333-dynamic-signer-rotation-with-lss-protocol.md) | Dynamic Signer Rotation | Resharing protocol |
| [LP-334](./lp-0334-per-asset-threshold-key-management.md) | Per-Asset Keys | Key configuration |
| [LP-335](./lp-0335-bridge-smart-contract-integration.md) | Bridge Contracts | External chain integration |
| [LP-336](./lp-0336-k-chain-keymanagementvm-specification.md) | K-Chain KeyManagementVM | Key encapsulation |

## References

1. Canetti, R., Gennaro, R., Goldfeder, S., Makriyannis, N., & Peled, U. (2021). **UC Non-Interactive, Proactive, Threshold ECDSA with Identifiable Aborts**. Cryptology ePrint Archive, Report 2021/060.
2. Komlo, C., & Goldberg, I. (2020). **FROST: Flexible Round-Optimized Schnorr Threshold Signatures**. SAC 2020, Cryptology ePrint 2020/852.
3. Shamir, A. (1979). **How to Share a Secret**. Communications of the ACM.
4. Feldman, P. (1987). **A Practical Scheme for Non-Interactive Verifiable Secret Sharing**. FOCS 1987.
5. Pedersen, T. (1991). **Non-Interactive and Information-Theoretic Secure Verifiable Secret Sharing**. CRYPTO 1991.
6. Herzberg, A., et al. (1995). **Proactive Secret Sharing**. CRYPTO 1995.
7. BIP-340. **Schnorr Signatures for secp256k1**. Bitcoin Improvement Proposal.
8. BIP-341. **Taproot: SegWit version 1 spending rules**. Bitcoin Improvement Proposal.
9. IETF CFRG. **FROST: Flexible Round-Optimized Schnorr Threshold Signatures**. draft-irtf-cfrg-frost.

## Copyright

Copyright and related rights waived via [CC0](../LICENSE.md).
