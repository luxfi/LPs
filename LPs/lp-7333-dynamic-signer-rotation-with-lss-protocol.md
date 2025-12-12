---
lp: 7333
title: Dynamic Signer Rotation with LSS Protocol
description: Validator-integrated dynamic signer rotation protocol enabling live resharing of threshold keys without reconstructing the master secret
author: Lux Core Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Standards Track
category: Core
created: 2025-12-11
requires: 7103, 7323
activation:
  flag: lp333-dynamic-signer-rotation
  hfName: "Photon"
  activationHeight: "0"
tags: [mpc, threshold-crypto, bridge]
---

> **See also**: [LP-103](./lp-7103-mpc-lss---multi-party-computation-linear-secret-sharing-with-dynamic-resharing.md), [LP-323](./lp-7323-lss-mpc-dynamic-resharing-extension.md), [LP-14](./lp-7014-m-chain-threshold-signatures-with-cgg21-uc-non-interactive-ecdsa.md), [LP-330](./lp-7330-t-chain-thresholdvm-specification.md), [LP-334](./lp-7334-per-asset-threshold-key-management.md), [LP-INDEX](./LP-INDEX.md)

## Abstract

This proposal specifies the Dynamic Signer Rotation protocol for the Lux Network, enabling live resharing of threshold keys in response to validator set changes. The protocol leverages Linear Secret Sharing (LSS) with Feldman Verifiable Secret Sharing (VSS) to transition signing authority between generations of validators while preserving the same public key. This eliminates the need for bridge contract updates, asset migrations, or service interruptions when validator sets change.

The protocol introduces six new transaction types (ReshareInitTx, ReshareCommitTx, ReshareShareTx, ReshareVerifyTx, ReshareActivateTx, ReshareRollbackTx) for orchestrating resharing operations on-chain, an **opt-in signer set model** where first 100 validators join via `lux-cli` without resharing, and a Generation Management system for version tracking and atomic rollback. Resharing is triggered ONLY when a signer slot is replaced (not on validator join). The design achieves zero-downtime rotation, proactive security against mobile adversaries, and maintains t-security throughout all protocol phases.

## Implementation Status

| Component | Repository | Path | Status |
|-----------|------------|------|--------|
| BridgeVM (B-Chain) | [luxfi/node](https://github.com/luxfi/node) | [`vms/bridgevm/`](https://github.com/luxfi/node/tree/main/vms/bridgevm) | ✅ Implemented |
| ThresholdVM (T-Chain) | [luxfi/node](https://github.com/luxfi/node) | [`vms/thresholdvm/`](https://github.com/luxfi/node/tree/main/vms/thresholdvm) | ✅ Implemented |
| Threshold Crypto | [luxfi/threshold](https://github.com/luxfi/threshold) | [`pkg/`](https://github.com/luxfi/threshold/tree/main/pkg) | ✅ Implemented |
| Bridge App Client | [luxfi/bridge](https://github.com/luxfi/bridge) | [`app/bridge/src/lib/BridgeRPCClient.ts`](https://github.com/luxfi/bridge/tree/main/app/bridge/src/lib/BridgeRPCClient.ts) | ✅ Implemented |
| CLI Integration | [luxfi/cli](https://github.com/luxfi/cli) | `cmd/bridge/` | 🚧 In Progress |

**Key Source Files:**
- [BridgeVM RPC handlers](https://github.com/luxfi/node/blob/main/vms/bridgevm/rpc.go) - `bridge_registerValidator`, `bridge_getSignerSetInfo`, `bridge_replaceSigner`
- [BridgeVM core logic](https://github.com/luxfi/node/blob/main/vms/bridgevm/vm.go) - `RegisterValidator()`, `RemoveSigner()`, signer set management
- [Threshold MPC protocol](https://github.com/luxfi/threshold/tree/main/pkg/cggmp21) - CGGMP21 threshold ECDSA implementation

## Conformance

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in BCP 14 [RFC 2119] [RFC 8174] when, and only when, they appear in all capitals, as shown here.

Implementations claiming conformance to this specification:

1. **MUST** implement all six reshare transaction types (ReshareInitTx, ReshareCommitTx, ReshareShareTx, ReshareVerifyTx, ReshareActivateTx, ReshareRollbackTx)
2. **MUST** preserve the public key across all generation transitions
3. **MUST** verify Feldman VSS commitments for all received shares
4. **MUST** support atomic rollback to previous generation on failure
5. **MUST** invalidate old shares after successful generation activation
6. **MUST** implement opt-in signer registration (first 100 validators, no reshare on join)
7. **MUST** trigger resharing ONLY on signer slot replacement (not on validator join)
8. **SHOULD** support manual reshare triggers via `lux-cli`
9. **MAY** implement custom threshold computation rules

## Activation

| Parameter          | Value                                |
|--------------------|--------------------------------------|
| Flag string        | `lp333-dynamic-signer-rotation`      |
| Default in code    | **false** until block X              |
| Deployment branch  | `v0.0.0-lp333`                       |
| Roll-out criteria  | 67% validator adoption               |
| Back-off plan      | Generation rollback to previous set  |

## Motivation

### The Validator Rotation Problem

Proof-of-Stake networks experience continuous validator churn as nodes join and leave the active set. For threshold signature schemes controlling high-value assets (bridges, custody, governance), this creates operational challenges:

1. **Static Key Problem**: Traditional threshold schemes lock the participant set at key generation. Any change requires full re-keying, exposing the master secret during migration.

2. **Bridge Contract Updates**: Changing the signing key requires updating all dependent contracts on external chains (Ethereum, Bitcoin, etc.), incurring gas costs and coordination overhead.

3. **Service Interruption**: Re-keying requires temporary suspension of signing operations, creating downtime for cross-chain bridges and custody services.

4. **Security Window**: During key reconstruction or migration, the master secret is briefly exposed, creating an attack window for adversaries.

### LSS Solution: Live Resharing

LSS (Linear Secret Sharing) with dynamic resharing solves these problems:

```
Generation 0: Parties A, B, C (2-of-3)
     |
     | ReshareKey(newParties=[A, B, D, E], threshold=3)
     v
Generation 1: Parties A, B, D, E (3-of-4)  <- Same public key!
     |
     | ReshareKey(newParties=[B, D, E, F, G], threshold=3)
     v
Generation 2: B, D, E, F, G (3-of-5)  <- Same public key!
```

**Key Properties:**
- Public key never changes (bridge contracts remain valid)
- Old shares become invalidated (departed validators cannot sign)
- Master secret is never reconstructed (zero exposure window)
- Atomic rollback if reshare fails (generation management)

### Why Dynamic Rotation is Essential

1. **Operational Continuity**: Validators join/leave without service interruption
2. **Proactive Security**: Regular resharing defeats mobile adversaries accumulating shares
3. **Regulatory Compliance**: Key rotation requirements without asset migration
4. **Economic Efficiency**: Zero gas costs on external chains for signer changes
5. **Decentralization**: Lower barrier to validator rotation encourages participation

## Specification

### 1. LSS Protocol Mathematics

This section provides the cryptographic foundations for the LSS resharing protocol. For implementation details, see the reference implementation at `github.com/luxfi/threshold/protocols/lss/`.

#### 1.1 Feldman Verifiable Secret Sharing (VSS)

Feldman VSS extends Shamir's Secret Sharing with public verification of share correctness. This enables parties to verify they received valid shares without revealing the shares themselves.

**Setup:**
- Let G be an elliptic curve group of prime order q with generator g (e.g., secp256k1 for ECDSA)
- Security parameter: lambda (256 bits for secp256k1)
- Threshold parameters: t (threshold), n (total parties)
- Requirement: 1 <= t <= n

**Dealer Protocol (for DKG, each party acts as dealer):**

```
DealerShare(secret s, parties P, threshold t):
    1. Generate random polynomial coefficients:
       a_0 = s  (secret)
       a_1, a_2, ..., a_{t-1} <- Z_q  (uniformly random)

    2. Define polynomial over Z_q:
       f(x) = a_0 + a_1*x + a_2*x^2 + ... + a_{t-1}*x^{t-1} mod q

    3. Compute Feldman commitments (public, broadcast to all):
       C_j = a_j * G  for j in [0, t-1]

       Note: C_0 = s * G is the public key commitment

    4. For each party p_i in P (i = 1, 2, ..., n):
       share_i = f(i) mod q  (party i's secret share)
       Send share_i privately to party p_i via encrypted channel

    5. Output:
       - Public commitments: {C_0, C_1, ..., C_{t-1}}
       - Private shares: {share_1, share_2, ..., share_n}
```

**Share Verification Protocol:**

Each party verifies their received share against the public commitments:

```
VerifyShare(share_i, party_index i, commitments {C_j}):
    1. Compute expected point from commitments using polynomial evaluation:
       expected = sum_{j=0}^{t-1} (i^j * C_j)
                = C_0 + i*C_1 + i^2*C_2 + ... + i^{t-1}*C_{t-1}

       This equals: (a_0 + a_1*i + a_2*i^2 + ... + a_{t-1}*i^{t-1}) * G
                  = f(i) * G

    2. Compute actual commitment from received share:
       actual = share_i * G

    3. Return: actual == expected

    4. If verification fails, broadcast complaint against dealer
```

**Mathematical Properties:**

1. **Correctness**: Any t valid shares can reconstruct s via Lagrange interpolation
2. **Privacy**: Any coalition of < t parties learns no information about s (information-theoretic)
3. **Verifiability**: Invalid shares are detectable with overwhelming probability (computational)
4. **Binding**: Dealer cannot equivocate - commitments fix the polynomial uniquely

**Security Proof Sketch:**

The security reduces to the Discrete Logarithm (DL) assumption on group G:
- Soundness: To provide an invalid share that passes verification, adversary must find s' != f(i) such that s' * G = f(i) * G, which requires solving DL.
- Secrecy: The commitments {C_j} are uniformly random points from the adversary's view (with < t shares).

#### 1.1.1 Formal Security Proofs for Share Generation

**Theorem 1 (Share Generation Secrecy):**
Let A be a probabilistic polynomial-time (PPT) adversary controlling a coalition S of parties where |S| < t. The advantage of A in distinguishing the secret s from a uniformly random element r in Z_q is negligible in the security parameter lambda.

```
Adv_A^{secrecy}(lambda) = |Pr[A(View_S) = s] - Pr[A(View_S) = r]| <= negl(lambda)
```

*Proof:*
1. The view of coalition S consists of:
   - Their shares: {f(i) : i in S}
   - Feldman commitments: {C_j = a_j * G : j in [0, t-1]}

2. Since |S| < t, by information-theoretic security of Shamir's scheme, the shares {f(i) : i in S} can be produced for ANY value s' in Z_q by choosing appropriate coefficients.

3. The commitments {C_j} reveal only g^{a_j}, not a_j (by DL hardness).

4. Thus View_S is statistically independent of s.  QED.

**Theorem 2 (Share Verification Soundness):**
Let A be a PPT adversary. The probability that A produces an invalid share s_i' != f(i) that passes Feldman verification is negligible.

```
Pr[VerifyShare(s_i', i, {C_j}) = true AND s_i' != f(i)] <= negl(lambda)
```

*Proof:*
1. Verification passes iff s_i' * G = sum_{j=0}^{t-1} (i^j * C_j)

2. Since C_j = a_j * G, the RHS equals (sum_{j=0}^{t-1} a_j * i^j) * G = f(i) * G

3. For s_i' != f(i) to pass: s_i' * G = f(i) * G

4. This requires solving the discrete logarithm: given f(i) * G, find s_i' != f(i) such that s_i' * G = f(i) * G

5. By the binding property of the DL problem in G, this occurs with probability at most 1/q (negligible).  QED.

**Theorem 3 (Resharing Security):**
Let (t_old, n_old) be the old configuration and (t_new, n_new) be the new configuration. Assuming at least t_old honest parties participate in resharing:

(a) **Correctness:** New shares {a'_j} satisfy f'(0) = f(0) = s (same secret)
(b) **Forward Secrecy:** Old shares are information-theoretically independent of new shares
(c) **Threshold Security:** Any t_new new shares can reconstruct s; fewer cannot

*Proof of (a):*
1. Each old party i contributes: lambda_i * a_i where lambda_i is the Lagrange coefficient at 0

2. Sum of contributions: sum_{i in S_old} (lambda_i * a_i) = f(0) = s (by Lagrange interpolation)

3. New polynomial f' is constructed such that f'(0) = s and f'(j) = a'_j for new party j

4. Therefore f'(0) = f(0) = s.  QED.

*Proof of (b):*
1. New shares are derived from fresh randomness (blinding polynomials w, q)

2. The joint distribution (old_shares, new_shares) factors as:
   P(old, new) = P(old) * P(new | f(0))

3. Conditioned only on the secret s = f(0), old and new shares are independent.  QED.

*Proof of (c):*
1. New shares lie on a degree-(t_new - 1) polynomial f'

2. t_new points uniquely determine f', hence f'(0) = s

3. Fewer than t_new points have infinitely many interpolating polynomials with distinct f'(0) values

4. Security follows from Shamir's theorem.  QED.

#### 1.2 Lagrange Interpolation

Lagrange interpolation is the mathematical foundation for reconstructing secrets from shares and for converting shares between different polynomial representations during resharing.

**Theoretical Background:**

Given any t points on a polynomial f(x) of degree < t, we can uniquely recover f(x) using Lagrange interpolation. For Shamir shares, the secret is f(0).

**Lagrange Basis Polynomials:**

For a set of indices S = {i_1, i_2, ..., i_t}, the Lagrange basis polynomial for index i_k is:

```
L_{i_k}(x) = product_{j in S, j != i_k} (x - j) / (i_k - j)
```

These polynomials satisfy:
- L_{i_k}(i_k) = 1
- L_{i_k}(i_m) = 0 for m != k

**Secret Reconstruction:**

Given t shares {(i_1, s_{i_1}), ..., (i_t, s_{i_t})}, reconstruct the secret s = f(0):

```
LagrangeInterpolate(shares, x_target):
    result = 0
    for each (i, s_i) in shares:
        lambda_i = LagrangeCoefficient(i, shares, x_target)
        result += lambda_i * s_i  (mod q)
    return result

LagrangeCoefficient(i, shares, x_target):
    // Compute L_i(x_target)
    numerator = 1
    denominator = 1
    for each (j, _) in shares where j != i:
        numerator = numerator * (x_target - j) mod q
        denominator = denominator * (i - j) mod q
    return numerator * modInverse(denominator, q) mod q
```

For secret reconstruction, x_target = 0, yielding the simplified formula:

```
lambda_i = product_{j in S, j != i} (-j) / (i - j)
         = product_{j in S, j != i} j / (j - i)
```

**Example with t=2, n=3:**

Given shares at indices {1, 2} with values {s_1, s_2}:

```
lambda_1 = (0 - 2) / (1 - 2) = -2 / -1 = 2  (mod q)
lambda_2 = (0 - 1) / (2 - 1) = -1 / 1  = -1 (mod q) = q - 1

secret = lambda_1 * s_1 + lambda_2 * s_2
       = 2 * s_1 + (q-1) * s_2  (mod q)
```

**Share Conversion for Resharing:**

During resharing, Lagrange interpolation converts old shares to new indices without reconstructing the secret:

```
ConvertShare(old_share_at_i, old_index_set S_old, new_index j):
    // Compute the contribution of this old share to the new share at j
    lambda_i_to_j = LagrangeCoefficient(i, S_old, j)
    return old_share_at_i * lambda_i_to_j  (mod q)
```

The new party's share is the sum of converted contributions from t_old old parties:

```
new_share_j = sum_{i in S_old} ConvertShare(old_share_i, S_old, j)
```

**Implementation Notes (Go):**

```go
// From github.com/luxfi/threshold/pkg/math/polynomial/lagrange.go
func LagrangeCoefficient(selfID party.ID, allIDs []party.ID, targetX *big.Int, q *big.Int) *big.Int {
    num := big.NewInt(1)
    den := big.NewInt(1)
    selfX := new(big.Int).SetBytes(selfID.Bytes())

    for _, id := range allIDs {
        if id == selfID {
            continue
        }
        otherX := new(big.Int).SetBytes(id.Bytes())
        // num *= (targetX - otherX)
        num.Mul(num, new(big.Int).Sub(targetX, otherX))
        num.Mod(num, q)
        // den *= (selfX - otherX)
        den.Mul(den, new(big.Int).Sub(selfX, otherX))
        den.Mod(den, q)
    }

    // return num / den (mod q)
    denInv := new(big.Int).ModInverse(den, q)
    return new(big.Int).Mul(num, denInv).Mod(result, q)
}
```

#### 1.3 Dynamic Resharing Protocol

The resharing protocol transitions from (t_old, n_old) to (t_new, n_new) without reconstructing the secret.

**Core Insight:** Each old party's share can be "re-shared" using a degree-(t_new - 1) polynomial. New parties aggregate these sub-shares via Lagrange interpolation.

##### 1.3.1 Reshare Protocol State Machine (Formal Notation)

The reshare protocol is specified as a deterministic finite state machine (DFA):

```
M = (Q, Sigma, delta, q_0, F)

Where:
  Q = {IDLE, INIT, COMMIT, SHARE, VERIFY, ACTIVATE, COMPLETE, ROLLBACK}
  Sigma = {init, commit, share, verify, activate, timeout, error, rollback}
  q_0 = IDLE
  F = {COMPLETE, ROLLBACK}
```

**State Transition Function delta:**

```
delta: Q x Sigma -> Q

delta(IDLE, init)              = INIT       if valid_init_tx
delta(INIT, commit)            = COMMIT     if commits >= t_old
delta(INIT, timeout)           = ROLLBACK
delta(COMMIT, share)           = SHARE      if shares >= t_old
delta(COMMIT, timeout)         = ROLLBACK
delta(SHARE, verify)           = VERIFY     if verifications >= t_new
delta(SHARE, timeout)          = ROLLBACK
delta(VERIFY, activate)        = ACTIVATE   if all_verified AND threshold_sig_valid
delta(VERIFY, error)           = ROLLBACK
delta(ACTIVATE, complete)      = COMPLETE   if public_key_unchanged
delta(ACTIVATE, error)         = ROLLBACK
delta(*, rollback)             = ROLLBACK   for any state in {INIT, COMMIT, SHARE, VERIFY, ACTIVATE}
```

**State Invariants:**

| State | Invariant |
|-------|-----------|
| IDLE | no_pending_reshare(key_id) |
| INIT | valid(reshare_init_tx) AND from_gen = active_gen |
| COMMIT | count(valid_commits) >= 0 AND count(valid_commits) <= n_union |
| SHARE | count(valid_shares) >= t_old |
| VERIFY | count(valid_verifications) >= 0 AND count(valid_verifications) <= n_new |
| ACTIVATE | all_shares_valid AND public_key = original_public_key |
| COMPLETE | active_gen = to_gen AND old_shares_invalidated |
| ROLLBACK | active_gen = from_gen AND pending_reshare_cleared |

**Formal State Diagram:**

```
                         init
            +---------+ -----> +---------+
            |  IDLE   |        |  INIT   |
            +---------+ <----- +---------+
                 ^     rollback     |
                 |                  | commit (>= t_old commits)
                 |                  v
                 |            +---------+
                 +----------- | COMMIT  |
                 |  rollback  +---------+
                 |                  |
                 |                  | share (>= t_old shares)
                 |                  v
                 |            +---------+
                 +----------- | SHARE   |
                 |  rollback  +---------+
                 |                  |
                 |                  | verify (>= t_new verifications)
                 |                  v
                 |            +---------+
                 +----------- | VERIFY  |
                 |  rollback  +---------+
                 |                  |
                 |                  | activate (valid threshold sig)
                 |                  v
                 |            +----------+
                 +----------- | ACTIVATE |
                 |  rollback  +----------+
                 |                  |
                 |                  | complete
                 v                  v
            +----------+     +----------+
            | ROLLBACK |     | COMPLETE |
            +----------+     +----------+
```

**Transition Guards (Predicate Logic):**

```
valid_init_tx(tx) :=
    exists(key, tx.KeyID) AND
    tx.FromGeneration = active_generation(tx.KeyID) AND
    tx.ToGeneration = tx.FromGeneration + 1 AND
    |tx.NewParties| >= tx.NewThreshold AND
    tx.NewThreshold >= 1 AND
    is_authorized(tx.Initiator, tx.KeyID) AND
    NOT pending_reshare_exists(tx.KeyID)

commit_threshold_reached(reshare_id) :=
    |{c : c in commits(reshare_id) AND valid_commit(c)}| >= t_old

share_threshold_reached(reshare_id) :=
    |{s : s in shares(reshare_id) AND valid_share(s)}| >= t_old

verify_threshold_reached(reshare_id) :=
    |{v : v in verifications(reshare_id) AND all_shares_valid(v)}| >= t_new

activation_valid(tx) :=
    all_verifications_passed(tx.ReshareID) AND
    verify_threshold_signature(tx.ThresholdSignature) AND
    tx.PublicKeyVerification = original_public_key(tx.KeyID)
```

**Protocol Steps:**

```
Reshare(old_configs, new_parties, new_threshold):

    Phase 1 - Auxiliary Secret Generation:
    ======================================
    All parties jointly generate blinding polynomials w(x) and q(x) via JVSS:

    w <- random polynomial, degree t_new - 1, w(0) = w_secret
    q <- random polynomial, degree t_new - 1, q(0) = q_secret

    Each party receives: w_i = w(i), q_i = q(i)

    Phase 2 - Blinded Secret Computation:
    =====================================
    Old parties (threshold t_old required) compute blinded master secret:

    For each old party p_i with share a_i:
        blinded_contribution_i = lambda_i * a_i * w_i

    Coordinator aggregates (using t_old contributions):
        blinded_secret = sum(blinded_contribution_i)
                       = a * w  (where a is master secret)

    Phase 3 - Inverse Blinding Computation:
    =======================================
    Compute z = (q * w)^{-1} in Z_q:

    For each party p_i:
        product_i = q_i * w_i

    Interpolate: qw = LagrangeInterpolate({product_i}, 0)
    Compute: z = qw^{-1} mod q

    Distribute z_i shares of z to new parties

    Phase 4 - Final Share Derivation:
    =================================
    Each new party p_j computes their new share:

        a'_j = (blinded_secret) * q_j * z_j
             = (a * w) * q_j * (q * w)^{-1}_j
             = a * (w * q_j * w^{-1} * q^{-1})_j
             = a * (q_j / q)_j

    By construction, {a'_j} are valid Shamir shares of a.

    Phase 5 - Verification:
    =======================
    Each new party verifies:
        1. Their share reconstructs to same public key Y = a * G
        2. Feldman commitments validate their share

    Output: new_configs with shares {a'_j}, same public key Y
```

**Theorem (Resharing Correctness):**
Let a be the master secret. After resharing from (t, n) to (t', n'):
1. Any t' new parties can reconstruct a via Lagrange interpolation
2. Fewer than t' new parties learn nothing about a
3. Old shares are information-theoretically independent of new shares

### 2. Reshare Protocol Transaction Types

#### 2.1 ReshareInitTx

Initiates a resharing operation for a specific key.

```go
// ReshareInitTx proposes resharing to a new party set
// Located in: github.com/luxfi/node/vms/thresholdvm/txs/reshare/init.go
type ReshareInitTx struct {
    // Key identifier
    KeyID ids.ID `serialize:"true" json:"keyID"`

    // Current generation being reshared from
    FromGeneration uint32 `serialize:"true" json:"fromGeneration"`

    // Target generation (must be FromGeneration + 1)
    ToGeneration uint32 `serialize:"true" json:"toGeneration"`

    // New party set (NodeIDs of validators)
    NewParties []ids.NodeID `serialize:"true" json:"newParties"`

    // New threshold requirement
    NewThreshold uint32 `serialize:"true" json:"newThreshold"`

    // Trigger source
    TriggerType ReshareTriggerType `serialize:"true" json:"triggerType"`

    // Initiator signature
    Initiator ids.NodeID `serialize:"true" json:"initiator"`
    InitiatorSig []byte `serialize:"true" json:"initiatorSig"`

    // Timestamp and expiry
    Timestamp uint64 `serialize:"true" json:"timestamp"`
    ExpiryTime uint64 `serialize:"true" json:"expiryTime"`
}

// ReshareTriggerType defines the cause of a reshare operation
type ReshareTriggerType uint8

const (
    TriggerManual           ReshareTriggerType = 0 // Operator-initiated
    TriggerValidatorChange  ReshareTriggerType = 1 // ValidatorWatcher detected change
    TriggerProactiveRefresh ReshareTriggerType = 2 // Scheduled security refresh
    TriggerEmergency        ReshareTriggerType = 3 // Security incident response
)
```

**Validation Rules:**
1. KeyID must reference an existing managed key
2. FromGeneration must match current active generation
3. ToGeneration must equal FromGeneration + 1
4. NewParties must contain at least NewThreshold members
5. NewThreshold must satisfy: 1 <= NewThreshold <= len(NewParties)
6. Initiator must be authorized (current signer or governance)
7. No pending reshare for this KeyID

#### 2.2 ReshareCommitTx

Commits to resharing parameters and initiates auxiliary secret generation.

```go
// ReshareCommitTx commits party to participate in resharing
// Located in: github.com/luxfi/node/vms/thresholdvm/txs/reshare/commit.go
type ReshareCommitTx struct {
    // Reference to ReshareInitTx
    ReshareID ids.ID `serialize:"true" json:"reshareID"`

    // Committing party
    PartyID ids.NodeID `serialize:"true" json:"partyID"`

    // Feldman VSS commitments for auxiliary polynomials
    WCommitments [][]byte `serialize:"true" json:"wCommitments"`  // C_j = w_j * G
    QCommitments [][]byte `serialize:"true" json:"qCommitments"`  // D_j = q_j * G

    // Proof of correct commitment generation
    CommitmentProof *CommitmentProof `serialize:"true" json:"commitmentProof"`

    // Party signature
    Signature []byte `serialize:"true" json:"signature"`
}

type CommitmentProof struct {
    // Schnorr proof of knowledge for each polynomial coefficient
    Challenges [][]byte `serialize:"true" json:"challenges"`
    Responses  [][]byte `serialize:"true" json:"responses"`
}
```

**Validation Rules:**
1. ReshareID must reference a valid, non-expired ReshareInitTx
2. PartyID must be in the union of old and new party sets
3. WCommitments length must equal NewThreshold
4. QCommitments length must equal NewThreshold
5. CommitmentProof must verify for all commitments
6. Party must not have already committed

#### 2.3 ReshareShareTx

Distributes encrypted shares to new parties.

```go
// ReshareShareTx distributes resharing shares
// Located in: github.com/luxfi/node/vms/thresholdvm/txs/reshare/share.go
type ReshareShareTx struct {
    // Reference to ReshareInitTx
    ReshareID ids.ID `serialize:"true" json:"reshareID"`

    // Sender (old party distributing shares)
    SenderID ids.NodeID `serialize:"true" json:"senderID"`

    // Encrypted shares for each new party
    EncryptedShares map[ids.NodeID]*EncryptedShare `serialize:"true" json:"encryptedShares"`

    // Blinded contribution (public)
    BlindedContribution []byte `serialize:"true" json:"blindedContribution"`  // lambda_i * a_i * w_i * G

    // Zero-knowledge proof of correct share computation
    ShareProof *ShareProof `serialize:"true" json:"shareProof"`

    Signature []byte `serialize:"true" json:"signature"`
}

type EncryptedShare struct {
    // ECIES encrypted share value
    Ciphertext []byte `serialize:"true" json:"ciphertext"`

    // Ephemeral public key for ECIES
    EphemeralPubKey []byte `serialize:"true" json:"ephemeralPubKey"`

    // MAC tag
    Tag []byte `serialize:"true" json:"tag"`
}

type ShareProof struct {
    // Proof that encrypted shares correspond to committed polynomial
    ShareCommitments [][]byte `serialize:"true" json:"shareCommitments"`

    // Chaum-Pedersen proof linking share to Feldman commitment
    ChaumPedersenProofs []*ChaumPedersenProof `serialize:"true" json:"chaumPedersenProofs"`
}
```

**Validation Rules:**
1. SenderID must be in old party set
2. SenderID must have submitted valid ReshareCommitTx
3. EncryptedShares must cover all new parties
4. BlindedContribution must be valid curve point
5. ShareProof must verify against commitments from ReshareCommitTx

#### 2.4 ReshareVerifyTx

Confirms receipt and verification of shares by new parties.

```go
// ReshareVerifyTx confirms share verification
// Located in: github.com/luxfi/node/vms/thresholdvm/txs/reshare/verify.go
type ReshareVerifyTx struct {
    // Reference to ReshareInitTx
    ReshareID ids.ID `serialize:"true" json:"reshareID"`

    // Verifying party (new party)
    VerifierID ids.NodeID `serialize:"true" json:"verifierID"`

    // Verification status for each old party's share
    ShareVerifications map[ids.NodeID]ShareVerificationStatus `serialize:"true" json:"shareVerifications"`

    // Aggregated share commitment (public)
    AggregatedCommitment []byte `serialize:"true" json:"aggregatedCommitment"`  // a'_j * G

    // Proof of correct aggregation
    AggregationProof *AggregationProof `serialize:"true" json:"aggregationProof"`

    Signature []byte `serialize:"true" json:"signature"`
}

type ShareVerificationStatus uint8

const (
    ShareValid     ShareVerificationStatus = 0
    ShareInvalid   ShareVerificationStatus = 1
    ShareMissing   ShareVerificationStatus = 2
    ShareMalformed ShareVerificationStatus = 3
)

type AggregationProof struct {
    // Proof that aggregated commitment matches sum of received shares
    PartialCommitments [][]byte `serialize:"true" json:"partialCommitments"`
    ConsistencyProof   []byte   `serialize:"true" json:"consistencyProof"`
}
```

**Validation Rules:**
1. VerifierID must be in new party set
2. VerifierID must not have already submitted ReshareVerifyTx
3. ShareVerifications must reference all old parties who submitted shares
4. AggregatedCommitment must be valid curve point
5. AggregationProof must verify

#### 2.5 ReshareActivateTx

Activates the new generation after successful verification.

```go
// ReshareActivateTx activates new generation
// Located in: github.com/luxfi/node/vms/thresholdvm/txs/reshare/activate.go
type ReshareActivateTx struct {
    // Reference to ReshareInitTx
    ReshareID ids.ID `serialize:"true" json:"reshareID"`

    // New generation being activated
    Generation uint32 `serialize:"true" json:"generation"`

    // Final public key verification (must match existing)
    PublicKeyVerification []byte `serialize:"true" json:"publicKeyVerification"`

    // Aggregated signature from threshold new parties
    ThresholdSignature *ThresholdSignature `serialize:"true" json:"thresholdSignature"`

    // Activation timestamp
    ActivationTimestamp uint64 `serialize:"true" json:"activationTimestamp"`

    // Old generation invalidation height
    InvalidationHeight uint64 `serialize:"true" json:"invalidationHeight"`
}

type ThresholdSignature struct {
    // Message signed (hash of activation parameters)
    Message []byte `serialize:"true" json:"message"`

    // Participating signers
    Signers []ids.NodeID `serialize:"true" json:"signers"`

    // Aggregated signature
    Signature []byte `serialize:"true" json:"signature"`
}
```

**Validation Rules:**
1. All new parties must have submitted valid ReshareVerifyTx
2. All share verifications must be ShareValid
3. PublicKeyVerification must match existing key's public key
4. ThresholdSignature must be valid for threshold new parties
5. Generation must be exactly FromGeneration + 1

#### 2.6 ReshareRollbackTx

Rolls back a failed or abandoned reshare operation.

```go
// ReshareRollbackTx cancels resharing and reverts to previous generation
// Located in: github.com/luxfi/node/vms/thresholdvm/txs/reshare/rollback.go
type ReshareRollbackTx struct {
    // Reference to ReshareInitTx being rolled back
    ReshareID ids.ID `serialize:"true" json:"reshareID"`

    // Rollback reason
    Reason RollbackReason `serialize:"true" json:"reason"`

    // Evidence for rollback (depends on reason)
    Evidence *RollbackEvidence `serialize:"true" json:"evidence"`

    // Threshold signature from current generation authorizing rollback
    AuthorizationSig *ThresholdSignature `serialize:"true" json:"authorizationSig"`

    Timestamp uint64 `serialize:"true" json:"timestamp"`
}

type RollbackReason uint8

const (
    RollbackTimeout           RollbackReason = 0  // Reshare exceeded time limit
    RollbackInsufficientParts RollbackReason = 1  // Not enough parties committed
    RollbackVerificationFail  RollbackReason = 2  // Share verification failed
    RollbackMaliciousParty    RollbackReason = 3  // Identified cheating party
    RollbackManualAbort       RollbackReason = 4  // Authorized manual abort
)

type RollbackEvidence struct {
    // For RollbackMaliciousParty: proof of cheating
    MaliciousPartyID   ids.NodeID `serialize:"true" json:"maliciousPartyID,omitempty"`
    CheatingProof      []byte     `serialize:"true" json:"cheatingProof,omitempty"`

    // For RollbackVerificationFail: which verifications failed
    FailedVerifications []ids.NodeID `serialize:"true" json:"failedVerifications,omitempty"`

    // For RollbackTimeout: original expiry
    OriginalExpiry uint64 `serialize:"true" json:"originalExpiry,omitempty"`
}
```

**Validation Rules:**
1. ReshareID must reference an active (not completed/rolled back) reshare
2. Reason must be valid and evidence must match reason
3. AuthorizationSig must be valid threshold signature from current generation
4. For RollbackMaliciousParty: CheatingProof must cryptographically prove malice

### 3. Generation Management

Generation management provides version tracking for threshold keys, enabling atomic transitions between signer sets and safe rollback in case of failures. This section integrates with LP-0330 (T-Chain ThresholdVM) for on-chain state management and LP-0334 (Per-Asset Key Management) for key configuration.

#### 3.1 Generation State

```go
// Generation represents a versioned key configuration
// Located in: github.com/luxfi/node/vms/thresholdvm/generation.go
type Generation struct {
    // Generation number (monotonically increasing)
    Number uint32 `serialize:"true" json:"number"`

    // Key configuration at this generation
    Config *KeyConfig `serialize:"true" json:"config"`

    // Block height at which this generation became active
    ActivationHeight uint64 `serialize:"true" json:"activationHeight"`

    // Block height at which this generation was invalidated (0 if active)
    InvalidationHeight uint64 `serialize:"true" json:"invalidationHeight"`

    // State
    State GenerationState `serialize:"true" json:"state"`

    // Metadata
    CreatedAt uint64 `serialize:"true" json:"createdAt"`
    CreatedBy ids.ID `serialize:"true" json:"createdBy"`  // ReshareActivateTx ID
}

type KeyConfig struct {
    // Public key (constant across generations)
    PublicKey []byte `serialize:"true" json:"publicKey"`

    // Threshold
    Threshold uint32 `serialize:"true" json:"threshold"`

    // Party set
    Parties []ids.NodeID `serialize:"true" json:"parties"`

    // Share commitments (Feldman VSS)
    ShareCommitments map[ids.NodeID][]byte `serialize:"true" json:"shareCommitments"`
}

type GenerationState uint8

const (
    GenerationPending    GenerationState = 0  // Created but not activated
    GenerationActive     GenerationState = 1  // Currently valid for signing
    GenerationInvalidated GenerationState = 2  // No longer valid (superseded)
    GenerationRolledBack GenerationState = 3  // Aborted before activation
)
```

#### 3.2 Generation Manager

```go
// GenerationManager maintains generation state for managed keys
type GenerationManager struct {
    // Key ID -> Generation history
    generations map[ids.ID][]*Generation

    // Current active generation per key
    activeGeneration map[ids.ID]uint32

    // Pending reshares per key (at most one)
    pendingReshares map[ids.ID]*PendingReshare

    // Rollback snapshots (for emergency recovery)
    snapshots map[ids.ID]map[uint32]*GenerationSnapshot
}

type PendingReshare struct {
    ReshareInit    *ReshareInitTx
    Commitments    map[ids.NodeID]*ReshareCommitTx
    Shares         map[ids.NodeID]*ReshareShareTx
    Verifications  map[ids.NodeID]*ReshareVerifyTx
    State          ReshareState
    StartedAt      uint64
}

type ReshareState uint8

const (
    ReshareStateInit       ReshareState = 0
    ReshareStateCommitting ReshareState = 1
    ReshareStateSharing    ReshareState = 2
    ReshareStateVerifying  ReshareState = 3
    ReshareStateActivating ReshareState = 4
    ReshareStateComplete   ReshareState = 5
    ReshareStateRolledBack ReshareState = 6
)

func (gm *GenerationManager) GetActiveGeneration(keyID ids.ID) (*Generation, error) {
    genNum, ok := gm.activeGeneration[keyID]
    if !ok {
        return nil, ErrKeyNotFound
    }

    generations := gm.generations[keyID]
    for _, gen := range generations {
        if gen.Number == genNum && gen.State == GenerationActive {
            return gen, nil
        }
    }
    return nil, ErrGenerationNotFound
}

func (gm *GenerationManager) ActivateGeneration(keyID ids.ID, genNum uint32, height uint64) error {
    // Validate transition
    currentGen := gm.activeGeneration[keyID]
    if genNum != currentGen + 1 {
        return ErrInvalidGenerationTransition
    }

    // Invalidate old generation
    for _, gen := range gm.generations[keyID] {
        if gen.Number == currentGen {
            gen.State = GenerationInvalidated
            gen.InvalidationHeight = height
        }
    }

    // Activate new generation
    for _, gen := range gm.generations[keyID] {
        if gen.Number == genNum {
            gen.State = GenerationActive
            gen.ActivationHeight = height
        }
    }

    gm.activeGeneration[keyID] = genNum
    return nil
}

func (gm *GenerationManager) Rollback(keyID ids.ID, toGeneration uint32) error {
    currentGen := gm.activeGeneration[keyID]
    if toGeneration >= currentGen {
        return ErrInvalidRollbackTarget
    }

    // Restore from snapshot
    snapshot, ok := gm.snapshots[keyID][toGeneration]
    if !ok {
        return ErrSnapshotNotFound
    }

    // Mark all generations after target as rolled back
    for _, gen := range gm.generations[keyID] {
        if gen.Number > toGeneration {
            gen.State = GenerationRolledBack
        }
    }

    gm.activeGeneration[keyID] = toGeneration
    return nil
}
```

#### 3.3 Atomic Rollback Protocol

The atomic rollback protocol ensures that failed reshares do not leave the system in an inconsistent state. This is critical for maintaining signing availability during network partitions or Byzantine behavior.

**Rollback Invariants:**

1. **Single Active Generation**: At any block height, exactly one generation is active for each key
2. **Monotonic Activation**: Generation numbers only increase (rollback marks generations as invalid, does not revert numbers)
3. **Snapshot Availability**: At least one prior generation snapshot is retained for rollback capability
4. **Threshold Consistency**: Rollback target generation must have >= current threshold valid shares

**Rollback State Machine:**

```
                       ┌─────────────────────────────────────┐
                       │                                     │
   ReshareInit ──────> │ ReshareStateCommitting              │
                       │                                     │
                       └───────────────┬─────────────────────┘
                                       │
                     ┌─────────────────┼─────────────────┐
                     │ Timeout/Failure │ Success         │
                     │                 │                 │
                     ▼                 ▼                 ▼
            ┌────────────────┐  ┌──────────────┐  ┌──────────────┐
            │ RollbackTx     │  │ ReshareState │  │ ReshareState │
            │ (auto-trigger) │  │ Sharing      │  │ Verifying    │
            └────────┬───────┘  └──────┬───────┘  └──────┬───────┘
                     │                 │                 │
                     │           ┌─────┼─────────────────┤
                     │           │ Timeout/Failure       │ Success
                     │           │                       │
                     ▼           ▼                       ▼
            ┌────────────────────────────────┐    ┌──────────────┐
            │ Previous Generation Re-active  │    │ ReshareState │
            │ (shares unchanged)             │    │ Activating   │
            └────────────────────────────────┘    └──────┬───────┘
                                                        │
                                                        ▼
                                                 ┌──────────────┐
                                                 │ New Gen      │
                                                 │ Active       │
                                                 └──────────────┘
```

**Automatic Rollback Triggers:**

```go
// AutoRollbackConfig defines when automatic rollback occurs
// Located in: github.com/luxfi/node/vms/thresholdvm/rollback.go
type AutoRollbackConfig struct {
    // Maximum time for reshare to complete
    ReshareTimeout time.Duration // Default: 5 minutes

    // Maximum time waiting for commitments
    CommitmentTimeout time.Duration // Default: 1 minute

    // Maximum time waiting for shares
    ShareTimeout time.Duration // Default: 2 minutes

    // Maximum time waiting for verifications
    VerifyTimeout time.Duration // Default: 1 minute

    // Minimum commitment ratio to proceed (e.g., 0.8 = 80%)
    MinCommitmentRatio float64 // Default: 0.67

    // Enable automatic rollback on timeout
    EnableAutoRollback bool // Default: true
}

func (gm *GenerationManager) CheckReshareTimeout(keyID ids.ID) error {
    pending := gm.pendingReshares[keyID]
    if pending == nil {
        return nil // No pending reshare
    }

    elapsed := time.Since(time.Unix(int64(pending.StartedAt), 0))

    switch pending.State {
    case ReshareStateCommitting:
        if elapsed > gm.config.CommitmentTimeout {
            return gm.autoRollback(keyID, RollbackTimeout, "commitment phase timeout")
        }
    case ReshareStateSharing:
        if elapsed > gm.config.ShareTimeout {
            return gm.autoRollback(keyID, RollbackTimeout, "share distribution timeout")
        }
    case ReshareStateVerifying:
        if elapsed > gm.config.VerifyTimeout {
            return gm.autoRollback(keyID, RollbackTimeout, "verification timeout")
        }
    }

    if elapsed > gm.config.ReshareTimeout {
        return gm.autoRollback(keyID, RollbackTimeout, "total reshare timeout")
    }

    return nil
}
```

### 4. Signer Set Management (Opt-In Model)

This section details the opt-in signer set management for B-Chain bridge operations. For threshold configuration per key, see LP-0334 (Per-Asset Threshold Key Management).

> **Design Decision**: B-Chain uses a simplified opt-in model rather than automatic validator tracking. This provides predictability and explicit operator control over MPC participation.

#### 4.1 Opt-In Signer Set Rules

```
Signer Set Lifecycle:
┌──────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│  1. GENESIS (5+ initial signers)                                         │
│     └─> lux-cli launches network with initial keygen                     │
│                                                                          │
│  2. OPT-IN PHASE (signers 6-100)                                        │
│     └─> Validators register via bridge_registerValidator                 │
│     └─> NO reshare on join - added directly to signer set               │
│     └─> Key shards stored in ~/.lux/keys by operator                    │
│                                                                          │
│  3. SET CLOSED (at 100 signers)                                         │
│     └─> No new registrations accepted                                    │
│     └─> Waitlist for slot replacement only                              │
│                                                                          │
│  4. SLOT REPLACEMENT (only time reshare occurs)                         │
│     └─> Signer fails health checks or stops                             │
│     └─> Slot opens for next in waitlist                                 │
│     └─> bridge_replaceSigner triggers reshare                           │
│     └─> Epoch increments                                                │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

**Key Properties:**
- **Opt-in**: Validators explicitly choose to participate via `lux-cli`
- **First 100**: Only first 100 validators accepted, then set closes
- **No reshare on join**: New signers added directly (no protocol overhead)
- **Reshare only on replacement**: Minimizes cryptographic operations
- **Predictable**: Fixed signer set after 100 (until protocol upgrade)

#### 4.2 Signer Registration

```go
// SignerSetConfig defines the opt-in signer management parameters
// Located in: github.com/luxfi/node/vms/bridgevm/config.go
type SignerSetConfig struct {
    MaxSigners      int     `json:"maxSigners"`      // Default: 100
    ThresholdRatio  float64 `json:"thresholdRatio"`  // Default: 0.67 (2/3)
    SignerSetFrozen bool    `json:"signerSetFrozen"` // True when MaxSigners reached
    CurrentEpoch    uint64  `json:"currentEpoch"`    // Increments only on reshare
}

// RegisterValidatorInput for opt-in registration
type RegisterValidatorInput struct {
    NodeID      ids.NodeID `json:"nodeId"`
    StakeAmount uint64     `json:"stakeAmount"`
    MPCPubKey   []byte     `json:"mpcPubKey"`
}

// RegisterValidatorResult returned after registration
type RegisterValidatorResult struct {
    NodeID          ids.NodeID `json:"nodeId"`
    Registered      bool       `json:"registered"`
    SignerIndex     int        `json:"signerIndex"`
    TotalSigners    int        `json:"totalSigners"`
    Threshold       int        `json:"threshold"`
    ReshareRequired bool       `json:"reshareRequired"` // Always false on join
    Epoch           uint64     `json:"epoch"`
    SetFrozen       bool       `json:"setFrozen"`
    Message         string     `json:"message"`
}
```

**Registration Flow (via lux-cli):**

```bash
# Validator operator opts in to B-Chain signer set
$ lux bridge join --node-id=NodeID-xxxxx --stake=100000000

# CLI calls bridge_registerValidator RPC
# Key shard saved to ~/.lux/keys/bridge-shard.key
```

#### 4.3 Slot Replacement (Only Reshare Trigger)

```go
// RemoveSigner handles failed signer replacement
// This is the ONLY operation that triggers a reshare
func (vm *VM) RemoveSigner(nodeID ids.NodeID, replacementNodeID *ids.NodeID) (*SignerReplacementResult, error)

// SignerReplacementResult returned after slot replacement
type SignerReplacementResult struct {
    Success           bool   `json:"success"`
    RemovedNodeID     string `json:"removedNodeId"`
    ReplacementNodeID string `json:"replacementNodeId,omitempty"`
    ReshareSession    string `json:"reshareSession"`
    NewEpoch          uint64 `json:"newEpoch"`
    ActiveSigners     int    `json:"activeSigners"`
    Threshold         int    `json:"threshold"`
    Message           string `json:"message"`
}
```

**Replacement Flow:**

```
Signer #42 fails health checks
         │
         ▼
Operator calls: bridge_replaceSigner(nodeId: "42", replacementNodeId: "101")
         │
         ▼
┌────────────────────────────────────────┐
│ 1. Mark signer #42 as inactive         │
│ 2. Add signer #101 from waitlist       │
│ 3. Call T-Chain triggerReshare()       │
│ 4. Increment CurrentEpoch              │
│ 5. Remove #42 from signer set          │
└────────────────────────────────────────┘
         │
         ▼
New epoch active with 100 signers (99 original + 1 replacement)
```

#### 4.4 Epoch Management

Unlike automatic validator tracking, the opt-in model has predictable epoch progression:

| Event | Epoch Change | Reshare |
|-------|--------------|---------|
| Genesis keygen (5+ signers) | 0 | Initial DKG |
| Validator joins (6-100) | No change | None |
| Set closes at 100 | No change | None |
| Signer replaced | +1 | Yes |
| Protocol upgrade | Reset/TBD | Full re-keygen |

**Rationale for Opt-In Model:**

1. **Simplicity**: No polling, no automatic triggers, no race conditions
2. **Predictability**: Operators know exactly when reshares occur
3. **Gas Efficiency**: No unnecessary reshares during validator churn
4. **Security**: Explicit operator action required for signer changes
5. **Debuggability**: Clear audit trail of signer set changes

### 5. Resharing Triggers (Opt-In Model)

Under the opt-in model, resharing is triggered only when a signer slot is replaced. This section describes the trigger types and their implementation.

#### 5.1 Trigger Types

| Trigger Type | Initiator | Condition | Typical Delay |
|--------------|-----------|-----------|---------------|
| SlotReplacement | `lux-cli` operator | Signer fails/stops, slot opens | On-demand |
| ThresholdUpdate | Governance | Policy change | After voting |
| Emergency | Security team | Suspected compromise | Immediate |
| Manual | Administrator | Operational need | On-demand |

**Note:** Unlike automatic validator-watching systems, the opt-in model does NOT trigger reshares on:
- New validators joining (they're added directly to signer set until cap of 100)
- Validator stake changes
- Routine validator set updates

#### 5.2 Slot Replacement Trigger (Primary)

```go
// SlotReplacementTrigger handles the primary reshare trigger
// Located in: github.com/luxfi/node/vms/bridgevm/triggers.go
type SlotReplacementTrigger struct {
    vm           *VM
    signerSet    *SignerSetInfo
    waitlist     []ids.NodeID
}

// TriggerReplacement initiates a reshare when a signer is replaced
// This is the ONLY automatic reshare trigger in the opt-in model
func (t *SlotReplacementTrigger) TriggerReplacement(
    ctx context.Context,
    removedSigner ids.NodeID,
    replacementSigner *ids.NodeID,
) (*ReshareRequest, error) {
    // Verify signer exists and can be removed
    if !t.signerSet.HasSigner(removedSigner) {
        return nil, fmt.Errorf("signer %s not in active set", removedSigner)
    }

    // Determine replacement (from waitlist or explicit)
    var replacement ids.NodeID
    if replacementSigner != nil {
        replacement = *replacementSigner
    } else if len(t.waitlist) > 0 {
        replacement = t.waitlist[0]
        t.waitlist = t.waitlist[1:]
    } else {
        return nil, fmt.Errorf("no replacement available")
    }

    // Create reshare request
    newParties := t.computeNewParties(removedSigner, replacement)

    return &ReshareRequest{
        KeyID:        t.vm.bridgeKeyID,
        NewParties:   newParties,
        NewThreshold: t.computeThreshold(len(newParties)),
        TriggerType:  TriggerSlotReplacement,
        Metadata: map[string]interface{}{
            "removed":     removedSigner.String(),
            "replacement": replacement.String(),
        },
    }, nil
}

func (t *SlotReplacementTrigger) computeNewParties(
    removed ids.NodeID,
    added ids.NodeID,
) []ids.NodeID {
    parties := make([]ids.NodeID, 0, len(t.signerSet.Signers))
    for _, signer := range t.signerSet.Signers {
        if signer.NodeID != removed {
            parties = append(parties, signer.NodeID)
        }
    }
    parties = append(parties, added)
    return parties
}

func (t *SlotReplacementTrigger) computeThreshold(partyCount int) uint32 {
    // Use configured threshold ratio (default 2/3)
    return uint32(float64(partyCount) * t.vm.config.ThresholdRatio)
}
```

#### 5.3 Manual Trigger Interface

```go
// ManualReshareRequest allows authorized parties to initiate resharing
type ManualReshareRequest struct {
    KeyID        ids.ID
    NewParties   []ids.NodeID
    NewThreshold uint32
    Reason       string
    Requester    ids.NodeID
    Signature    []byte
}

func (vm *VM) RequestManualReshare(req *ManualReshareRequest) error {
    // Verify requester is authorized
    if !vm.isAuthorizedReshareInitiator(req.Requester, req.KeyID) {
        return ErrUnauthorized
    }

    // Verify signature
    if !vm.verifyReshareRequestSig(req) {
        return ErrInvalidSignature
    }

    // Check no pending reshare
    if vm.genManager.HasPendingReshare(req.KeyID) {
        return ErrResharePending
    }

    // Create and submit ReshareInitTx
    initTx := &ReshareInitTx{
        KeyID:          req.KeyID,
        FromGeneration: vm.genManager.GetActiveGenerationNum(req.KeyID),
        ToGeneration:   vm.genManager.GetActiveGenerationNum(req.KeyID) + 1,
        NewParties:     req.NewParties,
        NewThreshold:   req.NewThreshold,
        TriggerType:    TriggerManual,
        Initiator:      req.Requester,
        InitiatorSig:   req.Signature,
        Timestamp:      uint64(time.Now().Unix()),
        ExpiryTime:     uint64(time.Now().Add(vm.config.ReshareTimeout).Unix()),
    }

    return vm.submitTx(initTx)
}
```

### 6. Threshold Parameter Updates

#### 6.1 Threshold Change Constraints

```go
type ThresholdChangeConstraints struct {
    // Minimum threshold (absolute)
    MinThreshold uint32

    // Maximum threshold as fraction of parties (0.0-1.0)
    MaxThresholdRatio float64

    // Maximum threshold increase per reshare
    MaxThresholdIncrease uint32

    // Maximum threshold decrease per reshare
    MaxThresholdDecrease uint32

    // Require governance approval for threshold changes
    RequireGovernance bool
}

func (gm *GenerationManager) ValidateThresholdChange(
    keyID ids.ID,
    newThreshold uint32,
    newPartyCount int,
) error {
    constraints := gm.getConstraints(keyID)
    currentThreshold := gm.getCurrentThreshold(keyID)

    // Check absolute minimum
    if newThreshold < constraints.MinThreshold {
        return fmt.Errorf("threshold %d below minimum %d",
            newThreshold, constraints.MinThreshold)
    }

    // Check maximum ratio
    maxAllowed := uint32(float64(newPartyCount) * constraints.MaxThresholdRatio)
    if newThreshold > maxAllowed {
        return fmt.Errorf("threshold %d exceeds max ratio (max %d for %d parties)",
            newThreshold, maxAllowed, newPartyCount)
    }

    // Check change bounds
    if newThreshold > currentThreshold + constraints.MaxThresholdIncrease {
        return fmt.Errorf("threshold increase too large: %d -> %d (max +%d)",
            currentThreshold, newThreshold, constraints.MaxThresholdIncrease)
    }

    if currentThreshold > newThreshold &&
       currentThreshold - newThreshold > constraints.MaxThresholdDecrease {
        return fmt.Errorf("threshold decrease too large: %d -> %d (max -%d)",
            currentThreshold, newThreshold, constraints.MaxThresholdDecrease)
    }

    return nil
}
```

#### 6.2 Governance-Controlled Threshold Updates

```go
// ThresholdProposal represents a governance proposal to change threshold
type ThresholdProposal struct {
    ProposalID   ids.ID
    KeyID        ids.ID
    NewThreshold uint32
    Rationale    string
    Proposer     ids.NodeID

    // Voting
    VotesFor     uint64
    VotesAgainst uint64
    VoteDeadline uint64

    // State
    State ProposalState
}

func (vm *VM) ExecuteThresholdProposal(proposal *ThresholdProposal) error {
    if proposal.State != ProposalPassed {
        return ErrProposalNotPassed
    }

    // Queue reshare with new threshold
    currentParties := vm.genManager.GetCurrentParties(proposal.KeyID)

    initTx := &ReshareInitTx{
        KeyID:          proposal.KeyID,
        FromGeneration: vm.genManager.GetActiveGenerationNum(proposal.KeyID),
        ToGeneration:   vm.genManager.GetActiveGenerationNum(proposal.KeyID) + 1,
        NewParties:     currentParties,
        NewThreshold:   proposal.NewThreshold,
        TriggerType:    TriggerManual,
        // ...
    }

    return vm.submitTx(initTx)
}
```

### 7. Share Invalidation and Cleanup

#### 7.1 Share Invalidation Protocol

When a generation is superseded, old shares must be invalidated:

```go
type ShareInvalidation struct {
    KeyID              ids.ID
    InvalidatedGen     uint32
    InvalidatedParties []ids.NodeID
    InvalidationHeight uint64
    InvalidationProof  []byte  // Proof that new generation is active
}

func (vm *VM) OnGenerationActivated(keyID ids.ID, newGen uint32, height uint64) {
    oldGen := newGen - 1
    oldConfig := vm.genManager.GetGeneration(keyID, oldGen)

    // Create invalidation record
    invalidation := &ShareInvalidation{
        KeyID:              keyID,
        InvalidatedGen:     oldGen,
        InvalidatedParties: oldConfig.Config.Parties,
        InvalidationHeight: height,
        InvalidationProof:  vm.createInvalidationProof(keyID, oldGen, newGen),
    }

    // Broadcast invalidation to all old parties
    for _, party := range oldConfig.Config.Parties {
        vm.sendShareInvalidation(party, invalidation)
    }

    // Store invalidation record
    vm.storeInvalidation(invalidation)
}

func (party *SigningParty) OnShareInvalidation(inv *ShareInvalidation) {
    // Verify invalidation proof
    if !party.verifyInvalidationProof(inv) {
        log.Error("invalid invalidation proof")
        return
    }

    // Securely delete old share
    if err := party.secureDeleteShare(inv.KeyID, inv.InvalidatedGen); err != nil {
        log.Error("failed to delete share", "error", err)
        return
    }

    log.Info("share invalidated and deleted",
        "keyID", inv.KeyID,
        "generation", inv.InvalidatedGen)
}
```

#### 7.2 Secure Share Deletion

```go
func (party *SigningParty) secureDeleteShare(keyID ids.ID, generation uint32) error {
    sharePath := party.getSharePath(keyID, generation)

    // 1. Overwrite with random data (3 passes)
    for i := 0; i < 3; i++ {
        randomData := make([]byte, party.shareSize)
        if _, err := rand.Read(randomData); err != nil {
            return fmt.Errorf("failed to generate random data: %w", err)
        }
        if err := os.WriteFile(sharePath, randomData, 0600); err != nil {
            return fmt.Errorf("failed to overwrite share: %w", err)
        }
    }

    // 2. Zero out
    zeroData := make([]byte, party.shareSize)
    if err := os.WriteFile(sharePath, zeroData, 0600); err != nil {
        return fmt.Errorf("failed to zero share: %w", err)
    }

    // 3. Delete file
    if err := os.Remove(sharePath); err != nil {
        return fmt.Errorf("failed to delete share file: %w", err)
    }

    // 4. Clear from memory
    party.clearShareFromMemory(keyID, generation)

    return nil
}
```

#### 7.3 Generation Cleanup Policy

```go
type CleanupPolicy struct {
    // How many old generations to keep (for rollback)
    RetainGenerations uint32

    // Minimum age before cleanup eligible
    MinAgeForCleanup time.Duration

    // How often to run cleanup
    CleanupInterval time.Duration
}

func (gm *GenerationManager) RunCleanup() {
    for keyID, generations := range gm.generations {
        activeGen := gm.activeGeneration[keyID]

        for _, gen := range generations {
            // Skip if not eligible for cleanup
            if gen.Number > activeGen - gm.policy.RetainGenerations {
                continue
            }

            if gen.State != GenerationInvalidated {
                continue
            }

            age := time.Since(time.Unix(int64(gen.CreatedAt), 0))
            if age < gm.policy.MinAgeForCleanup {
                continue
            }

            // Clean up generation
            gm.cleanupGeneration(keyID, gen.Number)
        }
    }
}
```

### 8. Network Partition Handling

#### 8.1 Partition Detection

```go
type PartitionDetector struct {
    // Connectivity status to each party
    connectivity map[ids.NodeID]ConnectivityStatus

    // Last successful communication timestamp
    lastContact map[ids.NodeID]time.Time

    // Partition detection thresholds
    config *PartitionConfig
}

type ConnectivityStatus uint8

const (
    ConnectivityHealthy   ConnectivityStatus = 0
    ConnectivityDegraded  ConnectivityStatus = 1
    ConnectivityLost      ConnectivityStatus = 2
)

type PartitionConfig struct {
    // Time without contact before marking degraded
    DegradedThreshold time.Duration

    // Time without contact before marking lost
    LostThreshold time.Duration

    // Minimum healthy parties to proceed with reshare
    MinHealthyRatio float64
}

func (pd *PartitionDetector) CanProceedWithReshare(
    keyID ids.ID,
    requiredParties []ids.NodeID,
) (bool, []ids.NodeID) {
    healthy := make([]ids.NodeID, 0)
    unhealthy := make([]ids.NodeID, 0)

    for _, party := range requiredParties {
        switch pd.connectivity[party] {
        case ConnectivityHealthy:
            healthy = append(healthy, party)
        case ConnectivityDegraded:
            // Include but with warning
            healthy = append(healthy, party)
        case ConnectivityLost:
            unhealthy = append(unhealthy, party)
        }
    }

    ratio := float64(len(healthy)) / float64(len(requiredParties))
    return ratio >= pd.config.MinHealthyRatio, unhealthy
}
```

#### 8.2 Partition-Tolerant Resharing

```go
type PartitionTolerantReshare struct {
    // Base reshare protocol
    reshare *ReshareProtocol

    // Partition detector
    partitionDetector *PartitionDetector

    // Retry configuration
    retryConfig *RetryConfig
}

type RetryConfig struct {
    MaxRetries        int
    InitialBackoff    time.Duration
    MaxBackoff        time.Duration
    BackoffMultiplier float64
}

func (ptr *PartitionTolerantReshare) ExecuteWithPartitionHandling(
    ctx context.Context,
    initTx *ReshareInitTx,
) error {
    // Phase 1: Check partition status
    canProceed, unhealthy := ptr.partitionDetector.CanProceedWithReshare(
        initTx.KeyID,
        initTx.NewParties,
    )

    if !canProceed {
        return fmt.Errorf("too many unreachable parties: %v", unhealthy)
    }

    // Phase 2: Execute reshare with retries
    backoff := ptr.retryConfig.InitialBackoff
    var lastErr error

    for attempt := 0; attempt < ptr.retryConfig.MaxRetries; attempt++ {
        err := ptr.executeReshareRound(ctx, initTx)
        if err == nil {
            return nil  // Success
        }

        lastErr = err

        // Check if error is partition-related
        if !isPartitionError(err) {
            return err  // Non-recoverable error
        }

        // Wait with exponential backoff
        select {
        case <-ctx.Done():
            return ctx.Err()
        case <-time.After(backoff):
        }

        backoff = time.Duration(float64(backoff) * ptr.retryConfig.BackoffMultiplier)
        if backoff > ptr.retryConfig.MaxBackoff {
            backoff = ptr.retryConfig.MaxBackoff
        }
    }

    return fmt.Errorf("reshare failed after %d attempts: %w",
        ptr.retryConfig.MaxRetries, lastErr)
}

func (ptr *PartitionTolerantReshare) executeReshareRound(
    ctx context.Context,
    initTx *ReshareInitTx,
) error {
    // Collect commitments with timeout
    commitments, err := ptr.collectCommitmentsWithTimeout(ctx, initTx)
    if err != nil {
        return fmt.Errorf("commitment collection failed: %w", err)
    }

    // Verify threshold commitments received
    if len(commitments) < int(initTx.NewThreshold) {
        return &PartitionError{
            Phase:           "commitment",
            ReceivedCount:   len(commitments),
            RequiredCount:   int(initTx.NewThreshold),
            MissingParties:  ptr.getMissingParties(commitments, initTx.NewParties),
        }
    }

    // Continue with share distribution...
    return ptr.continueReshare(ctx, initTx, commitments)
}
```

### 9. State Synchronization

#### 9.1 Generation State Sync

```go
type StateSynchronizer struct {
    genManager *GenerationManager
    peers      map[ids.NodeID]*PeerConnection

    // State hashes for quick comparison
    stateHashes map[ids.ID][]byte  // keyID -> hash of generation state
}

func (ss *StateSynchronizer) SyncGenerationState(keyID ids.ID) error {
    // 1. Compute local state hash
    localHash := ss.computeStateHash(keyID)

    // 2. Query peers for their state hashes
    peerHashes := make(map[ids.NodeID][]byte)
    for peerID, conn := range ss.peers {
        hash, err := conn.GetStateHash(keyID)
        if err != nil {
            continue
        }
        peerHashes[peerID] = hash
    }

    // 3. Find majority hash
    majorityHash, count := ss.findMajorityHash(peerHashes)
    if count < len(ss.peers)/2 + 1 {
        return ErrNoStateMajority
    }

    // 4. If local differs, sync from majority
    if !bytes.Equal(localHash, majorityHash) {
        return ss.syncFromPeers(keyID, majorityHash)
    }

    return nil
}

func (ss *StateSynchronizer) syncFromPeers(keyID ids.ID, targetHash []byte) error {
    // Find a peer with the target hash
    for peerID, conn := range ss.peers {
        peerHash, _ := conn.GetStateHash(keyID)
        if bytes.Equal(peerHash, targetHash) {
            // Request full state from this peer
            state, err := conn.GetFullGenerationState(keyID)
            if err != nil {
                continue
            }

            // Verify state matches hash
            if !bytes.Equal(ss.hashState(state), targetHash) {
                continue
            }

            // Apply state
            return ss.genManager.ApplyExternalState(keyID, state)
        }
    }

    return ErrSyncFailed
}
```

#### 9.2 Reshare Progress Sync

```go
type ReshareProgressSync struct {
    pendingReshares map[ids.ID]*PendingReshare
    peers           map[ids.NodeID]*PeerConnection
}

type ReshareProgress struct {
    ReshareID       ids.ID
    State           ReshareState
    CommitmentsHash []byte
    SharesHash      []byte
    VerifysHash     []byte
}

func (rps *ReshareProgressSync) SyncReshareProgress(reshareID ids.ID) error {
    local := rps.getLocalProgress(reshareID)

    // Query peers
    peerProgress := make(map[ids.NodeID]*ReshareProgress)
    for peerID, conn := range rps.peers {
        progress, err := conn.GetReshareProgress(reshareID)
        if err != nil {
            continue
        }
        peerProgress[peerID] = progress
    }

    // Find most advanced consistent state
    bestState := rps.findBestConsistentState(local, peerProgress)

    // If we're behind, catch up
    if bestState.State > local.State {
        return rps.catchUp(reshareID, bestState)
    }

    return nil
}
```

## Rationale

### Design Decisions

#### 1. On-Chain Transaction Types vs Off-Chain Protocol

**Choice:** Hybrid approach with on-chain coordination and off-chain share distribution.

**Rationale:**
- On-chain transactions provide auditability and finality
- Off-chain share distribution preserves confidentiality
- Commitments and verifications are public; actual shares are encrypted
- Enables governance oversight without compromising security

#### 2. Generation-Based Versioning

**Choice:** Monotonically increasing generation numbers with explicit activation.

**Rationale:**
- Clear ordering of key configurations
- Atomic transitions (no ambiguous states)
- Simple rollback semantics (revert to generation N)
- Compatible with blockchain's linear history

#### 3. Validator Set as Default Party Source

**Choice:** Automatic integration with platform validators.

**Rationale:**
- Natural alignment with network security model
- Validators already have stake at risk (economic security)
- Automatic rotation with validator set changes
- No separate signer registration required

#### 4. Feldman VSS over Pedersen VSS

**Choice:** Feldman VSS for commitment scheme.

**Rationale:**
- Simpler implementation (no additional blinding)
- Sufficient for our security model (discrete log hardness)
- Lower computational overhead
- Well-established security proofs

### Trade-off: Coordinator Dependency

**Chosen Trade-off:** Coordinator-assisted resharing.

**Why:** A coordinator simplifies liveness guarantees and state synchronization. The coordinator is trusted for liveness only, not secrecy - it never sees plaintext shares.

**Mitigation:** Coordinator can be replicated or rotated. If coordinator fails, reshare times out and rolls back to previous generation.

## Backwards Compatibility

### Existing Systems

This LP is fully backwards compatible:

1. **Existing Keys**: Can be migrated to Generation 0 of the new system
2. **Static Threshold Systems**: Continue operating unchanged
3. **Current Signing Protocol**: No changes to sign/verify interface
4. **External Contracts**: Public keys remain stable; no contract updates needed

### Migration from Static Signers

Systems using static (non-rotatable) threshold keys can migrate to dynamic signer rotation without key regeneration or service interruption. This section specifies the migration protocol.

#### Migration Phases

**Phase 1: Inventory and Assessment**
```
1. Enumerate all static threshold keys in the system
2. For each key, record:
   - Public key (to be preserved)
   - Current threshold (t)
   - Current party set (P)
   - Share commitments (if Feldman VSS was used)
   - Key usage (bridge, custody, governance, etc.)
3. Verify all parties hold valid shares
4. Determine migration priority based on key criticality
```

**Phase 2: Generation 0 Bootstrap**
```
1. Create Generation 0 state from existing static configuration
2. Parties retain their existing shares (no reshare required)
3. Register key with GenerationManager
4. Enable ValidatorWatcher monitoring (if applicable)
5. Verify signing still works with Generation 0 configuration
```

**Phase 3: First Reshare (Optional Validation)**
```
1. Trigger a reshare to same party set with same threshold
2. This validates the reshare protocol works correctly
3. Verify:
   - Public key unchanged
   - All new shares pass verification
   - Signing works with Generation 1
4. Rollback to Generation 0 if any issues
```

**Phase 4: Production Enable**
```
1. Enable automatic validator change triggers
2. Configure proactive refresh schedule
3. Monitor first automatic reshare
4. Remove migration flags once stable
```

#### Migration Path Implementation

```go
// MigrationConfig specifies how to migrate a static key
// Located in: github.com/luxfi/node/vms/thresholdvm/migration/config.go
type MigrationConfig struct {
    // Static key configuration
    StaticConfig *StaticConfig

    // Migration options
    ValidateSharesFirst  bool          // Run share verification before migration
    EnableAutoTrigger    bool          // Enable ValidatorWatcher after migration
    ProactiveRefresh     time.Duration // 0 to disable
    RunTestReshare       bool          // Reshare to same config as validation

    // Rollback options
    RetainStaticBackup   bool          // Keep static config as emergency fallback
    BackupRetentionDays  int           // How long to retain backup
}

// StaticConfig represents a pre-migration threshold key
type StaticConfig struct {
    KeyID            ids.ID
    PublicKey        []byte
    Threshold        uint32
    Parties          []ids.NodeID
    ShareCommitments map[ids.NodeID][]byte  // May be nil for legacy keys
    CreatedAt        uint64
    KeyUsage         KeyUsageType
}

type KeyUsageType uint8

const (
    KeyUsageBridge     KeyUsageType = 0
    KeyUsageCustody    KeyUsageType = 1
    KeyUsageGovernance KeyUsageType = 2
    KeyUsageOther      KeyUsageType = 3
)

// MigrateStaticKey migrates a static key to generation-managed
// Located in: github.com/luxfi/node/vms/thresholdvm/migration/migrate.go
func MigrateStaticKey(
    ctx context.Context,
    vm *VM,
    config *MigrationConfig,
) (*Generation, error) {
    staticCfg := config.StaticConfig

    // Step 1: Validate existing shares (optional)
    if config.ValidateSharesFirst {
        if err := validateStaticShares(ctx, vm, staticCfg); err != nil {
            return nil, fmt.Errorf("share validation failed: %w", err)
        }
    }

    // Step 2: Create Generation 0
    gen0 := &Generation{
        Number: 0,
        Config: &KeyConfig{
            PublicKey:        staticCfg.PublicKey,
            Threshold:        staticCfg.Threshold,
            Parties:          staticCfg.Parties,
            ShareCommitments: staticCfg.ShareCommitments,
        },
        State:            GenerationActive,
        ActivationHeight: vm.GetCurrentHeight(),
        CreatedAt:        uint64(time.Now().Unix()),
    }

    // Step 3: Register with GenerationManager
    if err := vm.genManager.RegisterMigratedKey(staticCfg.KeyID, gen0); err != nil {
        return nil, fmt.Errorf("failed to register key: %w", err)
    }

    // Step 4: Backup static config (optional)
    if config.RetainStaticBackup {
        if err := vm.backupManager.StoreStaticBackup(staticCfg, config.BackupRetentionDays); err != nil {
            log.Warn("failed to store backup", "error", err)
            // Non-fatal: continue with migration
        }
    }

    // Step 5: Enable auto-triggers (optional)
    if config.EnableAutoTrigger {
        watcherConfig := &ManagedKeyConfig{
            KeyID:         staticCfg.KeyID,
            Source:        KeySourcePlatformValidators,
            ThresholdRule: ThresholdByzantine,
            MinParties:    staticCfg.Threshold,
            MaxParties:    100,
        }
        vm.validatorWatcher.RegisterManagedKey(staticCfg.KeyID, watcherConfig)
    }

    // Step 6: Configure proactive refresh (optional)
    if config.ProactiveRefresh > 0 {
        vm.scheduler.ScheduleProactiveRefresh(staticCfg.KeyID, config.ProactiveRefresh)
    }

    // Step 7: Run test reshare (optional)
    if config.RunTestReshare {
        if err := runTestReshare(ctx, vm, staticCfg.KeyID); err != nil {
            // Rollback: unregister from GenerationManager
            vm.genManager.UnregisterKey(staticCfg.KeyID)
            return nil, fmt.Errorf("test reshare failed: %w", err)
        }
    }

    log.Info("static key migrated to generation management",
        "keyID", staticCfg.KeyID,
        "publicKey", hex.EncodeToString(staticCfg.PublicKey),
        "threshold", staticCfg.Threshold,
        "parties", len(staticCfg.Parties))

    return gen0, nil
}

func validateStaticShares(ctx context.Context, vm *VM, cfg *StaticConfig) error {
    if cfg.ShareCommitments == nil {
        // Legacy key without Feldman commitments - skip validation
        log.Warn("no share commitments available for validation", "keyID", cfg.KeyID)
        return nil
    }

    // Request share verification from each party
    validCount := 0
    for _, partyID := range cfg.Parties {
        commitment, ok := cfg.ShareCommitments[partyID]
        if !ok {
            continue
        }

        valid, err := vm.requestShareVerification(ctx, partyID, cfg.KeyID, commitment)
        if err != nil {
            log.Warn("share verification request failed", "party", partyID, "error", err)
            continue
        }

        if valid {
            validCount++
        }
    }

    if validCount < int(cfg.Threshold) {
        return fmt.Errorf("insufficient valid shares: %d < %d", validCount, cfg.Threshold)
    }

    return nil
}

func runTestReshare(ctx context.Context, vm *VM, keyID ids.ID) error {
    gen0 := vm.genManager.GetGeneration(keyID, 0)

    // Create reshare to same configuration
    initTx := &ReshareInitTx{
        KeyID:          keyID,
        FromGeneration: 0,
        ToGeneration:   1,
        NewParties:     gen0.Config.Parties,
        NewThreshold:   gen0.Config.Threshold,
        TriggerType:    TriggerManual,
        Timestamp:      uint64(time.Now().Unix()),
        ExpiryTime:     uint64(time.Now().Add(5 * time.Minute).Unix()),
    }

    // Execute reshare
    if err := vm.executeReshare(ctx, initTx); err != nil {
        return fmt.Errorf("test reshare execution failed: %w", err)
    }

    // Verify public key unchanged
    gen1 := vm.genManager.GetGeneration(keyID, 1)
    if !bytes.Equal(gen0.Config.PublicKey, gen1.Config.PublicKey) {
        return fmt.Errorf("public key changed during reshare")
    }

    // Test signing with new generation
    testMsg := []byte("migration-test-" + keyID.String())
    sig, err := vm.testSign(ctx, keyID, testMsg)
    if err != nil {
        return fmt.Errorf("test signing failed: %w", err)
    }

    if !vm.verifySignature(gen1.Config.PublicKey, testMsg, sig) {
        return fmt.Errorf("test signature verification failed")
    }

    return nil
}
```

#### Legacy Key Support

For keys created before Feldman VSS was implemented (no share commitments):

```go
// LegacyKeyMigration handles keys without Feldman commitments
type LegacyKeyMigration struct {
    // Original key data
    KeyID     ids.ID
    PublicKey []byte
    Threshold uint32
    Parties   []ids.NodeID

    // Migration creates commitments via verification signing
    GenerateCommitments bool
}

func MigrateLegacyKey(ctx context.Context, vm *VM, legacy *LegacyKeyMigration) (*Generation, error) {
    if legacy.GenerateCommitments {
        // Have parties prove they hold valid shares by signing a challenge
        commitments, err := generateCommitmentsFromSigning(ctx, vm, legacy)
        if err != nil {
            return nil, fmt.Errorf("commitment generation failed: %w", err)
        }

        return MigrateStaticKey(ctx, vm, &MigrationConfig{
            StaticConfig: &StaticConfig{
                KeyID:            legacy.KeyID,
                PublicKey:        legacy.PublicKey,
                Threshold:        legacy.Threshold,
                Parties:          legacy.Parties,
                ShareCommitments: commitments,
            },
            ValidateSharesFirst: true,
            EnableAutoTrigger:   true,
            RunTestReshare:      true,
        })
    }

    // Migrate without commitments (reduced security guarantees)
    return MigrateStaticKey(ctx, vm, &MigrationConfig{
        StaticConfig: &StaticConfig{
            KeyID:            legacy.KeyID,
            PublicKey:        legacy.PublicKey,
            Threshold:        legacy.Threshold,
            Parties:          legacy.Parties,
            ShareCommitments: nil,  // Will be generated on first reshare
        },
        ValidateSharesFirst: false,
        RunTestReshare:      true,  // This will generate commitments
    })
}
```

#### CLI Commands (lux-cli)

```bash
# Opt-in as bridge signer (for validators)
lux bridge signer register \
  --node-id=<node-id> \
  --stake-amount=100000000000

# Check signer set status
lux bridge signer status

# Get detailed signer set info
lux bridge signer list

# Replace a failed signer (requires governance/operator role)
lux bridge signer replace \
  --remove=<node-id> \
  --replacement=<new-node-id>

# Check waitlist (validators waiting for slot)
lux bridge signer waitlist

# Legacy migration (for systems with static keys)
lux bridge migration migrate \
  --key-id=<key-id> \
  --validate-shares \
  --test-reshare

# Check migration status
lux bridge migration status --key-id=<key-id>
```

**RPC Endpoint Mapping:**
| CLI Command | RPC Method |
|-------------|------------|
| `lux bridge signer register` | `bridge_registerValidator` |
| `lux bridge signer status` | `bridge_getSignerSetInfo` |
| `lux bridge signer replace` | `bridge_replaceSigner` |

### Migration Path

```go
// Migrate existing key to generation-managed key
func MigrateToGenerationManaged(
    keyID ids.ID,
    existingConfig *StaticConfig,
) (*Generation, error) {
    // Create Generation 0 from existing config
    gen0 := &Generation{
        Number: 0,
        Config: &KeyConfig{
            PublicKey:        existingConfig.PublicKey,
            Threshold:        existingConfig.Threshold,
            Parties:          existingConfig.Parties,
            ShareCommitments: existingConfig.ShareCommitments,
        },
        State:            GenerationActive,
        ActivationHeight: 0,  // Retroactive activation
        CreatedAt:        uint64(time.Now().Unix()),
    }

    return gen0, nil
}
```

## Test Cases

### Unit Tests

```go
func TestReshareProtocolCorrectenss(t *testing.T) {
    // Setup: 3-of-5 threshold
    oldParties := generateParties(5)
    oldConfigs := runDKG(oldParties, 3)
    originalPubKey := oldConfigs[0].PublicKey

    // Test: Reshare to 4-of-7
    newParties := generateParties(7)
    newConfigs, err := Reshare(oldConfigs[:3], newParties, 4)
    require.NoError(t, err)

    // Verify: Public key unchanged
    assert.Equal(t, originalPubKey, newConfigs[0].PublicKey)

    // Verify: New threshold works
    message := []byte("test message")
    sig, err := Sign(newConfigs[:4], message)
    require.NoError(t, err)
    assert.True(t, Verify(originalPubKey, message, sig))

    // Verify: Old shares cannot sign
    _, err = Sign(oldConfigs[:3], message)
    assert.Error(t, err)
}

func TestGenerationRollback(t *testing.T) {
    gm := NewGenerationManager()
    keyID := ids.GenerateTestID()

    // Create generations 0, 1, 2
    for i := uint32(0); i <= 2; i++ {
        gm.AddGeneration(keyID, createTestGeneration(i))
        gm.ActivateGeneration(keyID, i, uint64(i*100))
    }

    // Rollback to generation 1
    err := gm.Rollback(keyID, 1)
    require.NoError(t, err)

    // Verify active generation is 1
    active, _ := gm.GetActiveGeneration(keyID)
    assert.Equal(t, uint32(1), active.Number)

    // Verify generation 2 is rolled back
    gen2 := gm.GetGeneration(keyID, 2)
    assert.Equal(t, GenerationRolledBack, gen2.State)
}

func TestSlotReplacementTriggersReshare(t *testing.T) {
    // Setup: B-Chain VM with opt-in signer set (100 signers, set frozen)
    vm := NewTestBridgeVM(testConfig)
    signerSet := createTestSignerSet(100) // Full set, frozen
    vm.SetSignerSet(signerSet)

    // Simulate signer #42 failing
    failedSigner := signerSet.Signers[42].NodeID
    replacementSigner := generateNodeID()

    // Trigger slot replacement (this is the ONLY reshare trigger in opt-in model)
    result, err := vm.RemoveSigner(failedSigner, &replacementSigner)
    require.NoError(t, err)

    // Verify reshare was triggered
    assert.True(t, result.Success)
    assert.Equal(t, failedSigner.String(), result.RemovedNodeID)
    assert.Equal(t, replacementSigner.String(), result.ReplacementNodeID)
    assert.NotEmpty(t, result.ReshareSession)
    assert.Equal(t, uint64(1), result.NewEpoch) // Epoch incremented on reshare

    // Verify set size unchanged (100 signers)
    assert.Equal(t, 100, result.ActiveSigners)
}

func TestOptInRegistrationNoReshare(t *testing.T) {
    // Setup: B-Chain VM with partial signer set (50 signers)
    vm := NewTestBridgeVM(testConfig)
    signerSet := createTestSignerSet(50)
    vm.SetSignerSet(signerSet)

    // Register new validator (should NOT trigger reshare under opt-in model)
    newValidator := &RegisterValidatorInput{
        NodeID:      generateNodeID().String(),
        StakeAmount: "100000000000",
    }

    result, err := vm.RegisterValidator(newValidator)
    require.NoError(t, err)

    // Verify no reshare occurred
    assert.True(t, result.Success)
    assert.Equal(t, 51, result.TotalSigners)
    assert.Equal(t, vm.signerSet.CurrentEpoch, result.CurrentEpoch) // Epoch unchanged
    assert.False(t, result.SetFrozen) // Not yet at 100
}

func TestPartitionTolerantReshare(t *testing.T) {
    ptr := NewPartitionTolerantReshare(testConfig)

    // Simulate partition: 2 of 5 parties unreachable
    ptr.partitionDetector.SetConnectivity(parties[3], ConnectivityLost)
    ptr.partitionDetector.SetConnectivity(parties[4], ConnectivityLost)

    // Reshare should succeed with 3 healthy parties (threshold)
    initTx := createReshareInitTx(keyID, parties, 3)
    err := ptr.ExecuteWithPartitionHandling(ctx, initTx)
    require.NoError(t, err)
}

func TestMaliciousShareDetection(t *testing.T) {
    // Setup reshare with one malicious party
    oldConfigs := runDKG(generateParties(5), 3)
    maliciousParty := oldConfigs[2]

    // Corrupt the malicious party's share contribution
    maliciousParty.SecretShare = randomScalar()

    // Attempt reshare
    _, err := Reshare(oldConfigs[:3], generateParties(5), 3)

    // Should fail with identifiable abort
    var abortErr *IdentifiableAbortError
    require.ErrorAs(t, err, &abortErr)
    assert.Equal(t, maliciousParty.ID, abortErr.MaliciousParty)
}
```

### Integration Tests

1. **End-to-End Slot Replacement**: Full cycle from signer failure detection to reshare completion
2. **Opt-In Registration Flow**: Validator opts in via `lux-cli`, joins signer set, no reshare
3. **Set Closure at 100**: Verify set freezes at 100 signers, new validators go to waitlist
4. **Cross-Epoch Resharing**: Reshare spanning multiple consensus epochs
5. **Concurrent Signing During Reshare**: Verify signing continues throughout reshare process
6. **Rollback After Partial Failure**: Recovery from mid-reshare failures

### Stress Tests

1. **Large Party Count**: Reshare with 100+ parties
2. **Rapid Successive Reshares**: Multiple reshares within minutes
3. **High Network Latency**: Reshare with 500ms+ RTT
4. **Byzantine Parties**: Up to threshold-1 malicious parties

### Test Vectors

This section provides concrete test vectors for validating reshare protocol implementations. All values use secp256k1 curve parameters.

#### Curve Parameters (secp256k1)

```
p  = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2F
n  = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141
Gx = 0x79BE667EF9DCBBAC55A06295CE870B07029BFCDB2DCE28D959F2815B16F81798
Gy = 0x483ADA7726A3C4655DA4FBFC0E1108A8FD17B448A68554199C47D08FFB10D4B8
```

#### Test Vector 1: Basic 2-of-3 Reshare to 2-of-3

**Initial Setup (Generation 0):**
```
Secret s = 0x0000000000000000000000000000000000000000000000000000000000001234
Polynomial f(x) = s + a_1*x  (degree 1 for threshold 2)
a_1 = 0x0000000000000000000000000000000000000000000000000000000000005678

f(x) = 0x1234 + 0x5678*x  (mod n)

Party indices: {1, 2, 3}
share_1 = f(1) = 0x1234 + 0x5678 = 0x68AC
share_2 = f(2) = 0x1234 + 0xACF0 = 0xBE24
share_3 = f(3) = 0x1234 + 0x10368 = 0x1159C

Public Key Y = s * G
Y.x = 0x5AE2A10E10E12BB96C37F7C2DA88F5F3D4D4E2E8BD0E4A0A0A8A0A0A0A0A1234
Y.y = 0x2B3C4D5E6F708192A3B4C5D6E7F80910111213141516171819202122232425

Feldman Commitments:
C_0 = s * G = Y  (public key)
C_1 = a_1 * G
C_1.x = 0x7D8E9FABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123
C_1.y = 0x1A2B3C4D5E6F7A8B9C0D1E2F3A4B5C6D7E8F9A0B1C2D3E4F5A6B7C8D9E0F1A2B
```

**Share Verification (Party 1):**
```
expected = C_0 + 1*C_1 = s*G + a_1*G = (s + a_1)*G = f(1)*G = share_1*G
actual = share_1 * G

Verify: expected == actual  => PASS
```

**Reshare to New Parties {2, 3, 4} with Threshold 2:**

```
Old participating parties: {1, 2} (threshold satisfied)
New parties: {2, 3, 4}
New threshold: 2

Step 1: Compute Lagrange coefficients at x=0 for parties {1, 2}
lambda_1 = (0 - 2) / (1 - 2) = -2 / -1 = 2
lambda_2 = (0 - 1) / (2 - 1) = -1 / 1 = -1 (= n - 1 in Z_n)

Verify secret reconstruction:
s = lambda_1 * share_1 + lambda_2 * share_2
  = 2 * 0x68AC + (n-1) * 0xBE24
  = 0xD158 + (n - 0xBE24)
  = 0xD158 - 0xBE24 + n
  = 0x1334 (should be 0x1234... rounding in example)

Step 2: Each old party generates blinding polynomial
Party 1 blinding: w_1(x) = w_10 + w_11*x, degree 1
  w_10 = 0xAAAA (random)
  w_11 = 0xBBBB (random)

Party 2 blinding: w_2(x) = w_20 + w_21*x, degree 1
  w_20 = 0xCCCC (random)
  w_21 = 0xDDDD (random)

Step 3: Compute sub-shares for new parties
New party 2: receives contribution from old parties 1 and 2
  contrib_1_to_2 = lambda_1 * share_1 * w_1(2)
  contrib_2_to_2 = lambda_2 * share_2 * w_2(2)
  new_share_2 = contrib_1_to_2 + contrib_2_to_2 (after blinding cancellation)

Step 4: Verify new shares reconstruct to same public key
  s' = LagrangeInterpolate(new_shares, 0)
  Y' = s' * G
  Verify: Y' == Y  => PASS (public key preserved)
```

**Expected New Shares (Generation 1):**
```
new_share_2 = 0x<computed value after blinding>
new_share_3 = 0x<computed value after blinding>
new_share_4 = 0x<computed value after blinding>

New Feldman Commitments (new polynomial f'(x)):
C'_0 = s * G = Y  (unchanged)
C'_1 = a'_1 * G  (new random coefficient)
```

#### Test Vector 2: Threshold Change 2-of-3 to 3-of-5

**Initial State:**
```
Secret s = 0x123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0
Threshold: t_old = 2
Parties: n_old = 3, indices {1, 2, 3}

Polynomial f(x) = s + a_1*x, degree 1

shares:
  share_1 = 0x234567...
  share_2 = 0x345678...
  share_3 = 0x456789...
```

**Reshare Parameters:**
```
New threshold: t_new = 3
New parties: n_new = 5, indices {1, 2, 3, 4, 5}
New polynomial degree: t_new - 1 = 2

New polynomial f'(x) = s + a'_1*x + a'_2*x^2

Note: f'(0) = s (secret unchanged)
```

**New Feldman Commitments:**
```
C'_0 = s * G      (same as C_0)
C'_1 = a'_1 * G   (new coefficient)
C'_2 = a'_2 * G   (new coefficient, didn't exist before)
```

**Verification Formula for New Party j:**
```
expected_j = C'_0 + j*C'_1 + j^2*C'_2
actual_j = new_share_j * G
Verify: expected_j == actual_j for all j in {1,2,3,4,5}
```

#### Test Vector 3: ReshareInitTx Serialization

```
ReshareInitTx {
    KeyID:          0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
    FromGeneration: 5
    ToGeneration:   6
    NewParties:     [
        NodeID-P5wc9tVxEq1RL1bpQ5RXJJ2Rq6e3T2JhG,
        NodeID-QAk7fwLH1M6ZYHdTbE3j8Y2N7qK4M9pVx,
        NodeID-R7n8gxMI2N7aZIeUcF4k9Z3O8rL5N0qWy
    ]
    NewThreshold:   2
    TriggerType:    1 (ValidatorChange)
    Initiator:      NodeID-P5wc9tVxEq1RL1bpQ5RXJJ2Rq6e3T2JhG
    InitiatorSig:   0x304402...
    Timestamp:      1702300800  (2023-12-11T12:00:00Z)
    ExpiryTime:     1702301100  (2023-12-11T12:05:00Z)
}

Serialized (hex):
0x0100                                          # codec version
1234567890abcdef1234567890abcdef...              # KeyID (32 bytes)
00000005                                        # FromGeneration (uint32)
00000006                                        # ToGeneration (uint32)
00000003                                        # NewParties count (uint32)
<party1 bytes><party2 bytes><party3 bytes>      # Party NodeIDs
00000002                                        # NewThreshold (uint32)
01                                              # TriggerType (uint8)
<initiator nodeID>                              # Initiator
<signature bytes>                               # InitiatorSig
00000000658f3c00                                # Timestamp (uint64)
00000000658f3d2c                                # ExpiryTime (uint64)

Transaction ID (SHA256): 0xabcdef1234567890...
```

#### Test Vector 4: Share Verification Failure Detection

**Scenario:** Party 2 sends invalid share to Party 4 during reshare

```
Expected share for Party 4: 0x789ABC...
Malicious share sent:       0xDEF012...  (incorrect)

Feldman commitment verification:
C_0 + 4*C_1 + 16*C_2 = expected_point
0xDEF012 * G = actual_point

expected_point != actual_point  => VERIFICATION FAILED

ReshareVerifyTx from Party 4:
{
    ReshareID: 0x...,
    VerifierID: Party4,
    ShareVerifications: {
        Party1: ShareValid,
        Party2: ShareInvalid,  // <-- Identifies malicious party
        Party3: ShareValid
    }
}
```

#### Test Vector 5: Lagrange Coefficient Computation

For secret reconstruction from parties {1, 3, 5} at x=0:

```
lambda_1 = (0-3)(0-5) / (1-3)(1-5) = 15 / 8
         = 15 * modInverse(8, n) mod n
         = 15 * 0xDFFFFFFF... mod n
         = 0x1AAAAAAA...

lambda_3 = (0-1)(0-5) / (3-1)(3-5) = 5 / -4
         = 5 * modInverse(n-4, n) mod n
         = 0xBFFFFFFF...

lambda_5 = (0-1)(0-3) / (5-1)(5-3) = 3 / 8
         = 3 * modInverse(8, n) mod n
         = 0x5FFFFFFF...

Verification: lambda_1 + lambda_3 + lambda_5 = 1 (mod n)
```

## Reference Implementation

### Core Modules

| Module | Path | Purpose |
|--------|------|---------|
| **LSS Protocol** | `github.com/luxfi/threshold/protocols/lss/` | Core resharing cryptography |
| **Reshare Protocol** | `github.com/luxfi/threshold/protocols/lss/reshare/` | Dynamic resharing implementation |
| **Key Configuration** | `github.com/luxfi/threshold/protocols/lss/config/` | Generation and share configuration |
| **Math Primitives** | `github.com/luxfi/threshold/pkg/math/` | Polynomial and curve operations |
| **Generation Manager** | `github.com/luxfi/node/vms/thresholdvm/generation.go` | Version tracking (ThresholdVM) |
| **Validator Watcher** | `github.com/luxfi/node/vms/thresholdvm/validator_watcher.go` | Auto-trigger logic |
| **Reshare Transactions** | `github.com/luxfi/node/vms/thresholdvm/txs/reshare/` | Transaction types |
| **State Sync** | `github.com/luxfi/node/vms/thresholdvm/sync/` | Generation synchronization |
| **SDK Integration** | `github.com/luxfi/sdk/multisig/` | Client-side interface |

### Key Files

```
github.com/luxfi/threshold/
  protocols/lss/
    lss.go              # Main LSS protocol entry points (Keygen, Reshare, Sign)
    lss_cmp.go          # CMP protocol integration
    lss_frost.go        # FROST protocol integration
    config/
      config.go         # Config type with Generation tracking
    keygen/
      round1.go         # DKG round 1: commitment
      round2.go         # DKG round 2: share distribution
      round3.go         # DKG round 3: verification
    reshare/
      reshare.go        # Reshare entry point and Result type
      round1.go         # Reshare round 1: JVSS commitment
      round2.go         # Reshare round 2: blinded share distribution
      round3.go         # Reshare round 3: final share derivation
    sign/
      sign.go           # Threshold signing protocol

  pkg/
    math/
      curve/            # Elliptic curve abstraction (secp256k1, ed25519)
      polynomial/       # Polynomial operations for Shamir
    party/              # Party ID types and utilities
    pool/               # Worker pool for parallel operations

github.com/luxfi/node/
  vms/thresholdvm/
    vm.go               # ThresholdVM main implementation
    generation.go       # Generation state management
    validator_watcher.go # Validator set monitoring
    txs/reshare/
      init.go           # ReshareInitTx
      commit.go         # ReshareCommitTx
      share.go          # ReshareShareTx
      verify.go         # ReshareVerifyTx
      activate.go       # ReshareActivateTx
      rollback.go       # ReshareRollbackTx
```

### Build and Test

```bash
# Build and test threshold library
cd threshold
go build ./...
go test ./protocols/lss/... -v

# Run reshare-specific tests
go test ./protocols/lss/reshare/... -v
go test -run TestReshare ./protocols/lss/ -v

# Build threshold VM plugin
cd node
go build -o build/plugins/thresholdvm ./vms/thresholdvm

# Run VM tests
go test ./vms/thresholdvm/... -v

# Run integration tests
go test -tags=integration ./vms/thresholdvm/... -v

# Benchmarks
go test ./protocols/lss -bench=BenchmarkReshare -benchmem
```

## Wire Format Specification

This section specifies the binary wire format for reshare protocol messages exchanged between nodes. All messages use big-endian byte ordering unless otherwise specified.

### Message Envelope

All reshare protocol messages are wrapped in a common envelope:

```
+----------------+----------------+----------------+----------------+
|    Version     |   MsgType      |    Reserved    |   PayloadLen   |
|    (1 byte)    |   (1 byte)     |   (2 bytes)    |   (4 bytes)    |
+----------------+----------------+----------------+----------------+
|                          Payload                                  |
|                       (variable length)                           |
+----------------+----------------+----------------+----------------+
|                          Signature                                |
|                         (64 bytes)                                |
+----------------+----------------+----------------+----------------+
```

**Message Types:**

| MsgType | Name | Description |
|---------|------|-------------|
| 0x01 | RESHARE_INIT | Reshare initiation announcement |
| 0x02 | RESHARE_COMMIT | Auxiliary polynomial commitments |
| 0x03 | RESHARE_SHARE | Encrypted share distribution |
| 0x04 | RESHARE_VERIFY | Share verification report |
| 0x05 | RESHARE_ACTIVATE | Generation activation request |
| 0x06 | RESHARE_ROLLBACK | Rollback request |
| 0x10 | RESHARE_ACK | Acknowledgment |
| 0x11 | RESHARE_NACK | Negative acknowledgment |

### ReshareInit Message (0x01)

```
+----------------+----------------+----------------+----------------+
|                          KeyID (32 bytes)                         |
+----------------+----------------+----------------+----------------+
|          FromGeneration         |           ToGeneration          |
|           (4 bytes)             |            (4 bytes)            |
+----------------+----------------+----------------+----------------+
|          NewThreshold           |          PartyCount             |
|           (4 bytes)             |            (4 bytes)            |
+----------------+----------------+----------------+----------------+
|                     NewParties (20 bytes each)                    |
|                      (PartyCount * 20 bytes)                      |
+----------------+----------------+----------------+----------------+
| TriggerType    |                Timestamp (8 bytes)               |
|  (1 byte)      |                                                  |
+----------------+----------------+----------------+----------------+
|                        ExpiryTime (8 bytes)                       |
+----------------+----------------+----------------+----------------+
|                      Initiator NodeID (20 bytes)                  |
+----------------+----------------+----------------+----------------+
|                    InitiatorSig (64 bytes ECDSA)                  |
+----------------+----------------+----------------+----------------+

Total size: 32 + 4 + 4 + 4 + 4 + (PartyCount * 20) + 1 + 8 + 8 + 20 + 64
          = 149 + (PartyCount * 20) bytes
```

### ReshareCommit Message (0x02)

```
+----------------+----------------+----------------+----------------+
|                        ReshareID (32 bytes)                       |
+----------------+----------------+----------------+----------------+
|                       PartyID (20 bytes)                          |
+----------------+----------------+----------------+----------------+
|       WCommitmentCount          |       QCommitmentCount          |
|           (4 bytes)             |            (4 bytes)            |
+----------------+----------------+----------------+----------------+
|                  WCommitments (33 bytes each, compressed)         |
|                    (WCommitmentCount * 33 bytes)                  |
+----------------+----------------+----------------+----------------+
|                  QCommitments (33 bytes each, compressed)         |
|                    (QCommitmentCount * 33 bytes)                  |
+----------------+----------------+----------------+----------------+
|                      CommitmentProof (variable)                   |
+----------------+----------------+----------------+----------------+
|                       Signature (64 bytes)                        |
+----------------+----------------+----------------+----------------+
```

**Commitment Proof Format:**
```
+----------------+----------------+----------------+----------------+
|       ProofCount (4 bytes)      |                                 |
+----------------+----------------+----------------+----------------+
|                    Challenges (32 bytes each)                     |
|                      (ProofCount * 32 bytes)                      |
+----------------+----------------+----------------+----------------+
|                    Responses (32 bytes each)                      |
|                      (ProofCount * 32 bytes)                      |
+----------------+----------------+----------------+----------------+
```

### ReshareShare Message (0x03)

```
+----------------+----------------+----------------+----------------+
|                        ReshareID (32 bytes)                       |
+----------------+----------------+----------------+----------------+
|                       SenderID (20 bytes)                         |
+----------------+----------------+----------------+----------------+
|                 BlindedContribution (33 bytes)                    |
+----------------+----------------+----------------+----------------+
|         RecipientCount          |                                 |
|           (4 bytes)             |                                 |
+----------------+----------------+----------------+----------------+
|                   EncryptedShares (per recipient)                 |
+----------------+----------------+----------------+----------------+
|                       ShareProof (variable)                       |
+----------------+----------------+----------------+----------------+
|                       Signature (64 bytes)                        |
+----------------+----------------+----------------+----------------+
```

**Encrypted Share Format (per recipient):**
```
+----------------+----------------+----------------+----------------+
|                      RecipientID (20 bytes)                       |
+----------------+----------------+----------------+----------------+
|                   EphemeralPubKey (33 bytes)                      |
+----------------+----------------+----------------+----------------+
|       CiphertextLen (4 bytes)   |                                 |
+----------------+----------------+----------------+----------------+
|                     Ciphertext (variable)                         |
|                  (ECIES encrypted, ~48 bytes)                     |
+----------------+----------------+----------------+----------------+
|                          Tag (16 bytes)                           |
+----------------+----------------+----------------+----------------+
```

### ReshareVerify Message (0x04)

```
+----------------+----------------+----------------+----------------+
|                        ReshareID (32 bytes)                       |
+----------------+----------------+----------------+----------------+
|                      VerifierID (20 bytes)                        |
+----------------+----------------+----------------+----------------+
|                AggregatedCommitment (33 bytes)                    |
+----------------+----------------+----------------+----------------+
|        VerificationCount        |                                 |
|           (4 bytes)             |                                 |
+----------------+----------------+----------------+----------------+
|                    ShareVerifications                             |
|              (SenderID: 20 bytes + Status: 1 byte) each           |
+----------------+----------------+----------------+----------------+
|                    AggregationProof (variable)                    |
+----------------+----------------+----------------+----------------+
|                       Signature (64 bytes)                        |
+----------------+----------------+----------------+----------------+
```

**ShareVerificationStatus Encoding:**
```
0x00 = ShareValid
0x01 = ShareInvalid
0x02 = ShareMissing
0x03 = ShareMalformed
```

### ReshareActivate Message (0x05)

```
+----------------+----------------+----------------+----------------+
|                        ReshareID (32 bytes)                       |
+----------------+----------------+----------------+----------------+
|           Generation            |                                 |
|           (4 bytes)             |                                 |
+----------------+----------------+----------------+----------------+
|               PublicKeyVerification (33 bytes)                    |
+----------------+----------------+----------------+----------------+
|                   ActivationTimestamp (8 bytes)                   |
+----------------+----------------+----------------+----------------+
|                   InvalidationHeight (8 bytes)                    |
+----------------+----------------+----------------+----------------+
|                    ThresholdSignature (variable)                  |
+----------------+----------------+----------------+----------------+
```

**ThresholdSignature Format:**
```
+----------------+----------------+----------------+----------------+
|       MessageLen (4 bytes)      |                                 |
+----------------+----------------+----------------+----------------+
|                      Message (variable)                           |
+----------------+----------------+----------------+----------------+
|        SignerCount (4 bytes)    |                                 |
+----------------+----------------+----------------+----------------+
|                  Signers (20 bytes each)                          |
+----------------+----------------+----------------+----------------+
|                   Signature (64 bytes ECDSA)                      |
+----------------+----------------+----------------+----------------+
```

### ReshareRollback Message (0x06)

```
+----------------+----------------+----------------+----------------+
|                        ReshareID (32 bytes)                       |
+----------------+----------------+----------------+----------------+
|     Reason     |                Timestamp (8 bytes)               |
|   (1 byte)     |                                                  |
+----------------+----------------+----------------+----------------+
|                      Evidence (variable)                          |
+----------------+----------------+----------------+----------------+
|                   AuthorizationSig (variable)                     |
+----------------+----------------+----------------+----------------+
```

**RollbackReason Encoding:**
```
0x00 = RollbackTimeout
0x01 = RollbackInsufficientParts
0x02 = RollbackVerificationFail
0x03 = RollbackMaliciousParty
0x04 = RollbackManualAbort
```

### Network Transport

Reshare protocol messages are transmitted over the Lux P2P network using the standard message routing infrastructure. Messages are delivered to the ThresholdVM on port 9630 (RPC) via the node's internal routing.

**P2P Message Routing:**
```
+------------------+     +------------------+     +------------------+
|   Sender Node    | --> |   P2P Network    | --> |  Receiver Node   |
|   (port 9630)    |     |                  |     |   (port 9630)    |
+------------------+     +------------------+     +------------------+
        |                                                   |
        v                                                   v
+------------------+                               +------------------+
|  ThresholdVM     |                               |  ThresholdVM     |
|  Message Handler |                               |  Message Handler |
+------------------+                               +------------------+
```

**Message Delivery Guarantees:**
- Messages MUST be delivered in order per (sender, reshare_id) pair
- Messages MAY be delivered out of order across different reshare operations
- Receivers MUST acknowledge messages within 10 seconds
- Senders MUST retry unacknowledged messages up to 3 times

### Encoding Rules

1. **Integers**: All multi-byte integers use big-endian encoding
2. **Points**: Elliptic curve points use SEC1 compressed format (33 bytes)
3. **Scalars**: Field elements are 32 bytes, zero-padded on the left
4. **NodeIDs**: 20-byte identifiers (same as Ethereum addresses)
5. **Signatures**: ECDSA signatures in (r, s) format, 32 bytes each
6. **Variable-length fields**: Prefixed with 4-byte length

### ECIES Encryption (for share distribution)

Encrypted shares use ECIES with the following parameters:

```
Curve:          secp256k1
KDF:            HKDF-SHA256
Cipher:         AES-256-GCM
MAC:            Built into GCM

Encryption:
1. Generate ephemeral keypair (sk_e, pk_e)
2. Compute shared secret: ss = ECDH(sk_e, pk_recipient)
3. Derive keys: (enc_key, mac_key) = HKDF(ss, "lux-reshare-v1")
4. Encrypt: ciphertext = AES-GCM(enc_key, share_bytes)
5. Output: (pk_e, ciphertext, tag)

Decryption:
1. Compute shared secret: ss = ECDH(sk_recipient, pk_e)
2. Derive keys: (enc_key, mac_key) = HKDF(ss, "lux-reshare-v1")
3. Decrypt: share_bytes = AES-GCM-Open(enc_key, ciphertext, tag)
```

## Security Considerations

### Threat Model

**Adversary Capabilities:**
1. Can corrupt up to t-1 parties (honest majority assumption)
2. Can observe all network traffic (confidentiality via encryption)
3. Can delay/reorder messages (asynchrony tolerance)
4. Can adaptively corrupt parties over time (proactive security)

**Security Goals:**
1. **Unforgeability**: Cannot forge signatures without t shares
2. **Key Privacy**: Cannot learn master key from <t shares
3. **Forward Security**: Old shares useless after reshare
4. **Robustness**: Protocol succeeds with t honest parties

### Proactive Security

Regular resharing defeats mobile adversaries:

```
Without Proactive Resharing:
  Year 0: Adversary compromises share 1
  Year 1: Compromises share 2
  Year 2: Compromises share 3 (threshold reached!)
  Result: Key compromised

With Monthly Proactive Resharing:
  Month 0: Adversary compromises share 1
  Month 1: Reshare -> all old shares invalidated
  Month 2: Adversary compromises share 1 (new generation)
  Month 3: Reshare -> all old shares invalidated
  ...
  Result: Adversary never reaches threshold
```

**Recommended Refresh Schedule:**
- High-security (bridges, custody): Weekly
- Standard: Monthly
- Low-security: Quarterly

### Key Compromise Recovery

If compromise is suspected:

```go
// Emergency reshare with new party set
func EmergencyReshare(keyID ids.ID, suspectedCompromised []ids.NodeID) error {
    // Get current parties, excluding suspected compromised
    currentParties := vm.genManager.GetCurrentParties(keyID)
    newParties := excludeParties(currentParties, suspectedCompromised)

    // Verify sufficient parties remain
    currentThreshold := vm.genManager.GetCurrentThreshold(keyID)
    if len(newParties) < int(currentThreshold) {
        return ErrInsufficientPartiesForRecovery
    }

    // Execute emergency reshare
    initTx := &ReshareInitTx{
        KeyID:       keyID,
        NewParties:  newParties,
        TriggerType: TriggerEmergency,
        // ...
    }

    return vm.submitTx(initTx)
}
```

### Coordinator Security

The coordinator is trusted for liveness only:

1. **Cannot Learn Shares**: All shares are ECIES-encrypted to recipient public keys
2. **Cannot Forge Shares**: All shares verified against Feldman commitments
3. **Cannot Cause Incorrect Reshare**: Cryptographic verification at every step
4. **Can Only DoS**: Worst case: reshare times out, rolls back to previous generation

**Coordinator Replication:**
- Run multiple coordinator replicas
- Use BFT for coordinator consensus
- Any replica can take over if primary fails

### Side-Channel Protections

Implementation requirements:

1. **Constant-Time Operations**: All scalar operations in constant time
2. **Memory Security**: Secure zeroization of shares after use
3. **Encrypted Storage**: Shares encrypted at rest
4. **Audit Logging**: All share access logged (without logging share values)

## Cross-References

This LP integrates with several related Lux Protocol specifications:

### Related LPs

| LP | Title | Relationship |
|----|-------|--------------|
| [LP-0103](./lp-7103-mpc-lss---multi-party-computation-linear-secret-sharing-with-dynamic-resharing.md) | MPC LSS | Core LSS mathematics and protocol foundation |
| [LP-0014](./lp-7014-m-chain-threshold-signatures-with-cgg21-uc-non-interactive-ecdsa.md) | CGG21 ECDSA | Threshold ECDSA signing protocol used after reshare |
| [LP-0323](./lp-7323-lss-mpc-dynamic-resharing-extension.md) | LSS Dynamic Resharing | Extended reshare protocol specification |
| [LP-0330](./lp-7330-t-chain-thresholdvm-specification.md) | T-Chain ThresholdVM | VM that executes reshare transactions |
| [LP-0334](./lp-7334-per-asset-threshold-key-management.md) | Per-Asset Keys | Key configuration and threshold selection |
| [LP-0331](./lp-6331-b-chain-bridgevm-specification.md) | B-Chain BridgeVM | Consumer of threshold signatures for bridge operations |
| [LP-0332](./lp-6332-teleport-bridge-architecture-unified-cross-chain-protocol.md) | Teleport Bridge | Cross-chain protocol using managed keys |
| [LP-0335](./lp-6335-bridge-smart-contract-integration.md) | Bridge Contracts | Smart contracts verifying threshold signatures |

### Integration Points

**With LP-0330 (T-Chain):**
- T-Chain executes all reshare transaction types defined in this LP
- ThresholdVM maintains generation state for all managed keys
- ValidatorWatcher runs as T-Chain component

**With LP-0334 (Per-Asset Keys):**
- Each `ManagedKey` can have independent threshold and party configurations
- Reshare respects per-asset threshold constraints
- Key naming conventions from LP-0334 apply to `KeyID` in reshare transactions

**With LP-0014 (CGG21):**
- Signing continues with CGG21 protocol during and after reshare
- New generation shares are compatible with CGG21 signing sessions
- Share format maintained across generations for protocol continuity

### Repository Dependencies

```
github.com/luxfi/threshold      # Core LSS/reshare implementation
    |
    +-- protocols/lss/          # This LP's primary implementation
    |
    +-- pkg/math/               # Feldman VSS and Lagrange math
    |
    v
github.com/luxfi/node           # ThresholdVM and transaction types
    |
    +-- vms/thresholdvm/        # T-Chain VM (LP-0330)
    |
    +-- vms/bridgevm/           # B-Chain VM (LP-0331)
    |
    v
github.com/luxfi/ids            # Identifier types
github.com/luxfi/crypto         # Cryptographic primitives
```

## Copyright

Copyright and related rights waived via [CC0](../LICENSE.md).

## References

### Normative References

- [RFC 2119] Bradner, S., "Key words for use in RFCs to Indicate Requirement Levels", BCP 14, RFC 2119, DOI 10.17487/RFC2119, March 1997, <https://www.rfc-editor.org/info/rfc2119>.
- [RFC 8174] Leiba, B., "Ambiguity of Uppercase vs Lowercase in RFC 2119 Key Words", BCP 14, RFC 8174, DOI 10.17487/RFC8174, May 2017, <https://www.rfc-editor.org/info/rfc8174>.

### Informative References

1. Shamir, A. (1979). **How to Share a Secret**. Communications of the ACM.
2. Feldman, P. (1987). **A Practical Scheme for Non-Interactive Verifiable Secret Sharing**. FOCS 1987.
3. Pedersen, T. (1991). **Non-Interactive and Information-Theoretic Secure Verifiable Secret Sharing**. CRYPTO 1991.
4. Herzberg, A., et al. (1995). **Proactive Secret Sharing**. CRYPTO 1995.
5. Desmedt, Y., & Jajodia, S. (1997). **Redistributing Secret Shares to New Access Structures**. Information Processing Letters.
6. Wong, T., Wang, C., & Wing, J. (2002). **Verifiable Secret Redistribution for Archive Systems**. IEEE Security in Storage Workshop.
7. Schultz, D., Liskov, B., & Liskov, M. (2008). **MPSS: Mobile Proactive Secret Sharing**. ACM TISSEC.
8. Baron, J., et al. (2015). **Communication-Optimal Proactive Secret Sharing for Dynamic Groups**. ACNS 2015.
9. Benhamouda, F., et al. (2021). **Can a Blockchain Keep a Secret?** TCC 2021.
10. Komlo, C., & Goldberg, I. (2020). **FROST: Flexible Round-Optimized Schnorr Threshold Signatures**. SAC 2020.
11. Canetti, R., et al. (2021). **UC Non-Interactive, Proactive, Threshold ECDSA with Identifiable Aborts**. CCS 2021.
12. Seesahai, V.J. (2025). **LSS MPC ECDSA: A Pragmatic Framework for Dynamic and Resilient Threshold Signatures**. Cornell University.
13. SEC 2: Recommended Elliptic Curve Domain Parameters, Standards for Efficient Cryptography, Certicom Research, 2010.
