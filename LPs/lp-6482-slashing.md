---
lp: 6482
title: LuxDA Slashing Protocol
description: LuxDA Slashing Protocol specification for LuxDA Bus
author: Lux Protocol Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Standards Track
category: Core
created: 2026-01-02
tags: [luxda-bus, data-availability, messaging]
---

## Abstract

This LP defines slashing conditions and challenge mechanisms for operator misbehavior.

## Specification

### 1. Slashing Conditions

| Condition | Penalty | Evidence |
|-----------|---------|----------|
| Double signing | 5% stake | Conflicting signatures |
| DA unavailability | 2% stake | Failed retrieval proof |
| Prolonged downtime | 1% stake/day | Missed attestations |
| Invalid state transition | 10% stake | Fraud proof |
| TFHE key withholding | 5% stake | Missing decrypt shares |

### 2. Challenge Protocol

```go
type Challenge struct {
    ChallengeID    [32]byte
    Challenger     Identity
    Accused        Identity
    Type           ChallengeType
    Evidence       []byte
    Bond           *big.Int
    Deadline       uint64
    Status         ChallengeStatus
}

type ChallengeStatus uint8
const (
    ChallengePending  ChallengeStatus = 0
    ChallengeValid    ChallengeStatus = 1
    ChallengeInvalid  ChallengeStatus = 2
    ChallengeExpired  ChallengeStatus = 3
)
```

### 3. Resolution Process

```
1. Challenger posts bond + evidence
2. Accused has response window (24h)
3. If no response: automatic slash
4. If response: arbitration
5. Winner receives loser's bond
```

### 4. Fraud Proofs

For state transition challenges:

```go
type FraudProof struct {
    // Claimed invalid transition
    Header       *MsgHeader
    PrevState    []byte
    ClaimedState []byte
    ActualState  []byte

    // Merkle proofs
    StateProof   []byte
}
```

---

*LP-6482 v1.0.0 - 2026-01-02*

## Backwards Compatibility

This specification introduces new functionality and does not modify existing protocols. It is fully backwards compatible with existing implementations.

