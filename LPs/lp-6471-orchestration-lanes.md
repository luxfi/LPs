---
lp: 6471
title: LuxDA TFHE Orchestration Lanes
description: LuxDA TFHE Orchestration Lanes specification for LuxDA Bus
author: Lux Protocol Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Standards Track
category: Core
created: 2026-01-02
requires: [5702, 5340]
tags: [luxda-bus, tfhe, threshold-crypto, fhe]
---

## Abstract

This LP defines orchestration lanes - namespaces that run deterministic TFHE state machines for private coordination. Encrypted inputs trigger state transitions computed homomorphically.

## Motivation

Orchestration lanes enable:

1. **Private Voting**: Vote without revealing choice
2. **Sealed Auctions**: Bid without revealing amount
3. **Private Matching**: Match without revealing preferences
4. **Conditional Logic**: Execute based on encrypted state

## Specification

### 1. Orchestration Namespace

#### 1.1 Namespace Policy Flag

```go
type NamespacePolicy struct {
    // ... other fields
    TFHEOrch bool  // Enable orchestration mode
}
```

When `TFHEOrch = true`:
- All messages must have TFHE sidecars
- State machine rules apply
- Deterministic transitions enforced

#### 1.2 Orchestration Types

```go
type OrchestrationConfig struct {
    // State machine type
    MachineType OrchMachineType

    // State schema
    StateSchema *TFHESchema

    // Transition rules
    Transitions []TransitionRule

    // Committee config
    CommitteeConfig *CommitteeConfig
}

type OrchMachineType uint8
const (
    OrchVoting     OrchMachineType = 1
    OrchAuction    OrchMachineType = 2
    OrchMatching   OrchMachineType = 3
    OrchCounter    OrchMachineType = 4
    OrchCustom     OrchMachineType = 5
)
```

### 2. TFHE State Machine

#### 2.1 State Structure

```go
type OrchState struct {
    // State version
    Version uint64

    // Encrypted state variables
    Variables map[string]*TFHECiphertext

    // Public metadata
    Metadata map[string]any

    // Last processed message
    LastSeq uint64

    // State commitment
    Commitment [32]byte
}
```

#### 2.2 Transition Function

```go
type TransitionRule struct {
    // Message type this rule handles
    MessageType string

    // Input schema
    InputSchema *TFHESchema

    // State updates (homomorphic)
    Updates []StateUpdate
}

type StateUpdate struct {
    // Variable to update
    Variable string

    // Operation
    Operation TFHEOperation

    // Operands
    Operands []Operand
}

type TFHEOperation uint8
const (
    OpAdd        TFHEOperation = 1
    OpSub        TFHEOperation = 2
    OpMul        TFHEOperation = 3
    OpCmux       TFHEOperation = 4  // Conditional mux
    OpEq         TFHEOperation = 5
    OpLt         TFHEOperation = 6
    OpMax        TFHEOperation = 7
    OpMin        TFHEOperation = 8
    OpAnd        TFHEOperation = 9
    OpOr         TFHEOperation = 10
    OpNot        TFHEOperation = 11
)
```

### 3. Built-in Machines

#### 3.1 Private Voting

```go
type VotingMachine struct {
    // Configuration
    NumOptions   uint8
    VoterList    []Identity
    Threshold    uint64  // Required votes for decision

    // State (encrypted)
    VoteCounts   []*TFHEUint64  // Per option
    VoterStatus  map[Identity]*TFHEBool  // Has voted

    // Public
    VotingDeadline uint64
    Status         VotingStatus
}

func (vm *VotingMachine) ProcessVote(voter Identity, sidecar *TFHESidecar) error {
    // Check voter eligibility (plaintext check)
    if !vm.IsEligibleVoter(voter) {
        return ErrNotEligible
    }

    // Check not already voted (homomorphic)
    hasVoted := vm.VoterStatus[voter]

    // Extract encrypted vote (which option)
    encVote := sidecar.Ciphertext

    // Homomorphic update: count[i] += (vote == i) AND NOT hasVoted
    for i := uint8(0); i < vm.NumOptions; i++ {
        isThisOption := tfhe.Eq(encVote, tfhe.Encrypt(i))
        shouldCount := tfhe.And(isThisOption, tfhe.Not(hasVoted))
        vm.VoteCounts[i] = tfhe.Add(vm.VoteCounts[i], tfhe.Cmux(shouldCount, 1, 0))
    }

    // Mark as voted
    vm.VoterStatus[voter] = tfhe.Or(hasVoted, tfhe.EncryptBool(true))

    return nil
}
```

#### 3.2 Sealed Auction

```go
type AuctionMachine struct {
    // Configuration
    ReservePrice *TFHEUint64
    BidDeadline  uint64
    RevealDeadline uint64

    // State (encrypted)
    HighestBid    *TFHEUint64
    HighestBidder *TFHEUint160  // Address

    // Bids (encrypted)
    Bids map[Identity]*TFHEUint64
}

func (am *AuctionMachine) ProcessBid(bidder Identity, sidecar *TFHESidecar) error {
    encBid := sidecar.Ciphertext.(*TFHEUint64)

    // Store bid
    am.Bids[bidder] = encBid

    // Homomorphic comparison: is this bid higher?
    isHigher := tfhe.Gt(encBid, am.HighestBid)

    // Conditional update
    am.HighestBid = tfhe.Cmux(isHigher, encBid, am.HighestBid)
    am.HighestBidder = tfhe.Cmux(isHigher, EncryptAddress(bidder), am.HighestBidder)

    return nil
}
```

#### 3.3 Private Counter

```go
type CounterMachine struct {
    // Configuration
    Limit *TFHEUint64

    // State
    Count *TFHEUint64
}

func (cm *CounterMachine) Increment(sidecar *TFHESidecar) error {
    delta := sidecar.Ciphertext.(*TFHEUint64)

    // Add delta to count
    newCount := tfhe.Add(cm.Count, delta)

    // Check limit (encrypted comparison)
    withinLimit := tfhe.Le(newCount, cm.Limit)

    // Only update if within limit
    cm.Count = tfhe.Cmux(withinLimit, newCount, cm.Count)

    return nil
}
```

### 4. Custom State Machines

#### 4.1 Schema Definition

```go
type TFHESchema struct {
    Fields []SchemaField
}

type SchemaField struct {
    Name    string
    Type    TFHECiphertextType
    Default []byte  // Encrypted default
}
```

#### 4.2 Custom Transition

```go
type CustomTransition struct {
    // Bytecode for transition
    Bytecode []byte

    // Or: reference to on-chain contract
    ContractRef [32]byte
}
```

### 5. State Commitment

#### 5.1 State Hash

```go
func (s *OrchState) ComputeCommitment() [32]byte {
    // Sort variables by name
    names := sortedKeys(s.Variables)

    // Hash each variable
    var data []byte
    for _, name := range names {
        ct := s.Variables[name]
        data = append(data, []byte(name)...)
        data = append(data, ct.Commitment()...)
    }

    return sha3.Sum256(data)
}
```

#### 5.2 State Proof

```go
type StateProof struct {
    // State at specific seq
    State *OrchState

    // Merkle proof to header chain
    HeaderProof *HeaderInclusionProof

    // Transition proofs since
    TransitionProofs []TransitionProof
}
```

### 6. Message Processing

#### 6.1 Message Envelope

```go
type OrchMessage struct {
    // Message type (matches transition rule)
    Type string

    // TFHE sidecar with inputs
    Sidecar *TFHESidecar

    // Public parameters
    Params map[string]any
}
```

#### 6.2 Processing Pipeline

```go
func (lane *OrchLane) ProcessMessage(header *MsgHeader, msg *OrchMessage) error {
    // 1. Validate sidecar
    if err := ValidateSidecar(msg.Sidecar, header, lane.KeyRegistry); err != nil {
        return err
    }

    // 2. Find matching transition rule
    rule := lane.FindRule(msg.Type)
    if rule == nil {
        return ErrUnknownMessageType
    }

    // 3. Validate input schema
    if err := rule.InputSchema.Validate(msg.Sidecar); err != nil {
        return err
    }

    // 4. Execute transition (homomorphic)
    for _, update := range rule.Updates {
        if err := lane.ExecuteUpdate(update, msg.Sidecar); err != nil {
            return err
        }
    }

    // 5. Update state commitment
    lane.State.LastSeq = header.Seq
    lane.State.Version++
    lane.State.Commitment = lane.State.ComputeCommitment()

    return nil
}
```

### 7. Finalization

#### 7.1 Reveal Trigger

```go
type RevealTrigger struct {
    Type       RevealTriggerType
    Condition  []byte  // Trigger-specific
}

type RevealTriggerType uint8
const (
    TriggerTime      RevealTriggerType = 1  // After timestamp
    TriggerSeq       RevealTriggerType = 2  // After seq number
    TriggerQuorum    RevealTriggerType = 3  // After N participants
    TriggerExternal  RevealTriggerType = 4  // External oracle
)
```

#### 7.2 Finalization Process

```go
func (lane *OrchLane) Finalize(trigger *RevealTrigger) (*FinalResult, error) {
    // 1. Verify trigger condition
    if !lane.CheckTrigger(trigger) {
        return nil, ErrTriggerNotMet
    }

    // 2. Request decryption shares
    shares, err := lane.Committee.RequestDecryptShares(lane.State.Variables)
    if err != nil {
        return nil, err
    }

    // 3. Combine shares
    plaintext := lane.Committee.CombineShares(shares)

    // 4. Publish result
    result := &FinalResult{
        Variables: plaintext,
        Proof:     generateProof(lane.State, shares),
    }

    return result, nil
}
```

## Rationale

### Why Built-in Machines?

- Common use cases standardized
- Optimized implementations
- Easier auditing

### Why Deterministic Transitions?

- All nodes compute same result
- Verifiable state
- No trusted execution needed

### Why Epoch-Based?

- Key rotation support
- Committee evolution
- Security boundaries

## Security Considerations

### State Integrity

- Commitment in header chain
- Transition proofs
- Deterministic computation

### Privacy

- Inputs encrypted
- State encrypted
- Only final result revealed

### Denial of Service

- Rate limiting on messages
- Gas/fee for computation
- Resource bounds

## Test Plan

### Unit Tests

1. **Voting**: Vote processing, tally
2. **Auction**: Bid processing, winner
3. **Transitions**: All operations

### Integration Tests

1. **Full Voting Flow**: Setup → Vote → Reveal
2. **Multi-Round**: Multiple epochs
3. **State Recovery**: Reconstruct from messages

## References

- [TFHE-rs](https://github.com/zama-ai/tfhe-rs)
- [Private Voting Paper](https://eprint.iacr.org/2023/1110)
- [Sealed-Bid Auctions](https://eprint.iacr.org/2021/857)

---

*LP-6471 v1.0.0 - 2026-01-02*
