---
lp: 137-TFHE-REAL-THRESHOLD-SPEC
title: TFHE Real Threshold Specification — replace the fake `protocols/tfhe`
tags: [fhe, tfhe, threshold, security, lattice, blocker]
description: Specification to replace the placeholder threshold-FHE implementation in luxfi/threshold/protocols/tfhe with a real Shamir-share + lattice partial-decrypt + Lagrange combine pipeline.
author: CTO (review by Red 2026-04-28)
status: Draft (security blocker)
type: Standards Track
category: Privacy
created: 2026-04-28
references:
  - LP-066 (Threshold FHE umbrella spec)
  - LP-076 (Universal Threshold Framework)
  - LP-137-RED-AUDIT (adversarial review F5)
  - LP-137-CRYPTO-ARCHITECTURE
  - LP-137-REGULATED-LANES
---

# LP-137-TFHE-REAL-THRESHOLD-SPEC

## Status

**SECURITY BLOCKER.** The current `luxfi/threshold/protocols/tfhe` implementation
is NOT a threshold scheme. It is master-key replication wrapped in HMAC theatre.
Anyone holding any single `KeyShare` can decrypt every ciphertext in the system.

This spec defines the contract for the real implementation. It does NOT fix
the bug — that is a multi-week cryptographer-reviewed effort. It defines what
the real fix must look like so callers can plan against a stable API.

## Refused review (Red 2026-04-28)

Three independent failures, all in `protocols/tfhe`:

1. **`KeyGenerator.GenerateKeys`** (tfhe.go ~line 374):
   ```go
   shares[pid] = &SecretKeyShare{
       UnderlyingKey: masterSK, // <-- every party gets the FULL master key
       LambdaCoeff:   computeLagrangeCoeff(i, kg.totalParties),
   }
   ```
   This is master-key replication. Shamir secret sharing is not happening.

2. **`PartialDecrypter.PartialDecrypt`** (committee.go ~line 255):
   ```go
   partial := computePartial(key, sessionID, ct.ID)
   // partial = HMAC(key, "LUX/FHE/THRESHOLD/PARTIAL/v1" || sessionID || ctID)
   ```
   Returns an HMAC tag that fingerprints `(party, session, ciphertext)`. There
   is no lattice operation, no noise contribution, no relation to the
   ciphertext content. It cannot be combined into a decryption.

3. **`Protocol.CombineShares`** (tfhe.go ~line 232):
   ```go
   value := p.decryptor.DecryptUint64(ct) // ignores p.shares entirely
   ```
   Calls single-party `DecryptUint64` against the master key copy. The
   `p.shares` map is checked for size and ciphertext-id match, then thrown
   away. A single party can decrypt with no peers.

#149 ("kill HMAC mask shim") replaced the parallel HMAC-XOR aggregator with a
direct dispatch to `Protocol.CombineShares`. The dispatch is correct; the
dispatch target is the broken routine in (3).

## Compensating controls (this session)

Until the real implementation lands:

- Top-of-file UNSAFE warnings in `tfhe.go` and `committee.go`.
- Panic guards in `KeyGenerator.GenerateKeys`, `PartialDecrypter.PartialDecrypt`,
  `Protocol.CombineShares`, and `NewProtocol`. All four panic in production.
- Tests opt in via `LUX_ALLOW_FAKE_TFHE_FOR_TESTING_ONLY=1` set in a package-level
  `TestMain`.
- Production reachability documented below — production callers MUST migrate
  off this package before regulated traffic flows through it.

These controls STAY until the real threshold lands. No environment-variable
override exists for production deployments.

## Production callers (audit, 2026-04-28)

Single import path of concern:

| File | Symbol | Risk |
|------|--------|------|
| `lux/mpc/pkg/mpc/tfhe_session.go:154` | `tfhe.NewKeyGenerator` | Production blocker — keygen runs in regulated MPC sessions. |
| `lux/mpc/pkg/mpc/tfhe_session.go:349` | `tfhe.NewProtocol` | Production blocker — every TFHE compute session instantiates the broken Protocol. |
| `lux/mpc/pkg/mpc/tfhe_session.go:523` | `(*tfheComputeSession).GetProtocol` returns `*tfhe.Protocol` | Re-exposes the broken Protocol to MPC callers. |

`lux-mpc` is the primary production MPC namespace (3 nodes, dashboard API,
postgres, valkey) and serves regulated lanes. With the panic guards in place,
`tfhe_session.go` will fail loudly the moment any TFHE keygen or compute
session is initiated in production. Until the real implementation lands,
any code path that allocates a `tfheComputeSession` is a production crash.

Confidential lanes (#136) and FHE-policy on-chain (M-Chain × F-Chain
integration #114) MUST NOT be enabled while the panic guards are in force —
they will tombstone the relevant MPC node. This is intentional.

## Real-implementation contract

The real implementation routes through `luxfi/lattice` threshold primitives,
which already implement Shamir share generation, partial-decrypt, and
Lagrange combine over the lattice ciphertext space.

### Interface (Go-idiomatic, package `tfhe`)

```go
// GenerateShares performs a t-of-n distributed key generation.
//
// PRECONDITION: 1 <= t <= n; secure session-binding sessionID.
// POSTCONDITION: Each party_i receives a SecretKeyShare such that:
//   - share_i is a Shamir polynomial evaluation at point x_i, NOT the master key.
//   - knowledge of fewer than t shares yields no information about the master key.
//   - the collective public key encrypts to the same lattice ciphertext space
//     as the threshold-decryption circuit expects.
//
// Implementation MUST NOT instantiate fhe.NewKeyGenerator and clone masterSK.
GenerateShares(ctx context.Context, t, n int, sessionID [32]byte) (
    pk *fhe.PublicKey,
    shares map[party.ID]*SecretKeyShare,
    err error,
)

// PartialDecrypt produces party_i's contribution to threshold decryption.
//
// PRECONDITION: share is the output of GenerateShares for the same session.
// POSTCONDITION: PartialDec encodes party_i's lattice partial:
//     partial_i = a_i * s_i + e_i  (in the BFV/CKKS partial-decryption sense)
// where a_i depends on ct, s_i is the Shamir share, and e_i is fresh
// smudging noise. Combining t such partials with their Lagrange coefficients
// recovers the cleartext modulo q with overwhelming probability.
//
// Implementation MUST NOT return an HMAC tag.
PartialDecrypt(ctx context.Context, share *SecretKeyShare, ct *fhe.BitCiphertext) (
    *PartialDec,
    error,
)

// CombineShares Lagrange-interpolates t partials at x = 0 to recover the cleartext.
//
// PRECONDITION: |partials| >= t; all partials decrypt the same ciphertext id.
// POSTCONDITION: returns the cleartext bytes. Fails closed on share-set
// inconsistency, threshold underflow, or noise-blowup beyond q/4.
//
// Implementation MUST NOT call decryptor.DecryptUint64. The decryptor over
// a master-key copy MUST NOT exist on a per-party basis.
CombineShares(ctx context.Context, ct *fhe.BitCiphertext, partials []*PartialDec) (
    cleartext []byte,
    err error,
)
```

### Internal types

```go
// SecretKeyShare is a Shamir share of the lattice secret key, NOT the key itself.
type SecretKeyShare struct {
    PartyID    party.ID
    Index      int       // x_i (Lagrange evaluation point)
    Generation uint64
    Share      *lattice.SecretShare // opaque; no fhe.SecretKey field
}

// PartialDec is one party's lattice partial decryption.
type PartialDec struct {
    PartyID        party.ID
    Index          int
    Generation     uint64
    CiphertextHash [32]byte
    Partial        *lattice.PartialDecryption // opaque; carries a_i*s_i + e_i, NOT bytes
}
```

The `*fhe.SecretKey` field on `SecretKeyShare` is removed. There is no master
key copy on any party. Period.

## Migration plan

1. **Stage 0 (this session)** — UNSAFE warnings + panic guards land. Production
   crashes loudly. Tests opt in via env var.
2. **Stage 1** — `luxfi/lattice` exposes the threshold primitives publicly.
   Add `pkg/lattice/threshold` with `GenerateShares` / `PartialDecrypt` /
   `CombineShares` matching the contract above.
3. **Stage 2** — Replace `protocols/tfhe/tfhe.go` internals with calls into
   `pkg/lattice/threshold`. The `Protocol` struct's `encryptor` and `decryptor`
   fields go away. The `Config.SecretKeyShare.UnderlyingKey` field goes away.
4. **Stage 3** — Cryptographer review. External review (one rotation, ≥1
   reviewer with prior threshold-FHE publication track record).
5. **Stage 4** — Remove panic guards. Remove `LUX_ALLOW_FAKE_TFHE_FOR_TESTING_ONLY`
   and the `TestMain` that sets it. Tests must pass against the real impl.
6. **Stage 5** — Re-enable confidential lanes (#136) and FHE-policy on-chain
   (#114). Red re-audits.

Tests written today (`tfhe_test.go`, `committee_test.go`) verify orchestration
shape only. Once the real impl lands, those tests will naturally fail
(ciphertext-bound shares, noise budget) and must be rewritten against
threshold-correctness invariants:

- Any t shares decrypt; any t-1 shares do not.
- Lagrange combine over different t-subsets yields the same cleartext.
- Noise budget remains under q/4 for the supported circuit depth.
- Partial-decrypt is bound to ciphertext content, not just ciphertext id.

## Effort + risk

| Stage | Effort | Risk |
|-------|--------|------|
| 0     | shipped 2026-04-28 | none — fail-closed |
| 1     | 1–2 weeks | medium — lattice API surface |
| 2     | 1 week    | medium — caller migration in `lux/mpc` |
| 3     | 4–6 weeks | high — external cryptographer rotation |
| 4–5   | 1 week    | low |

Total elapsed: 6–10 weeks gated on cryptographer availability. Until Stage 5
ships, every confidential-lane workload runs against a fail-closed gate.

## Non-goals

- This spec does NOT define the lattice scheme parameters (BFV vs CKKS vs
  TFHE-rs). That is `luxfi/lattice`'s job.
- This spec does NOT define the DKG transport. That is the threshold protocol
  framework's job (CMP/FROST share-distribution rounds).
- This spec does NOT mandate ZK proofs of partial-decrypt correctness. The
  `Proof` field on `DecryptionShare` remains optional and out of scope here.

## References

- LP-066: Threshold FHE umbrella spec.
- LP-076: Universal threshold framework.
- LP-137-RED-AUDIT: original F5 finding.
- `luxfi/threshold/protocols/tfhe/tfhe.go` (UNSAFE banner).
- `luxfi/threshold/protocols/tfhe/committee.go` (UNSAFE banner).
