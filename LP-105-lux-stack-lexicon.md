---
lp: 105
title: The Lux Finality Stack — Public Vocabulary and Internal Names
tags: [vocabulary, lexicon, naming, quasar, pulsar, lens, lumen, beam, photon, nebula, prism, horizon, lss, mldsa]
description: Authoritative naming for the Lux consensus and post-quantum cryptography stack. Cosmological + optical + cryptographic only. No borrowed brands. Defines Photon, Nebula, Lumen, Beam, LSS, Lens, Pulsar, Pulse, Prism, Horizon, Quasar.
author: Lux Core Team (@luxfi)
status: Final
type: Informational
category: Process
created: 2026-03-03
references:
  - LP-019 (Threshold MPC)
  - LP-020 (Quasar Consensus)
  - LP-070 (ML-DSA)
  - LP-073 (Pulsar — lattice threshold)
  - LP-075 (BLS Aggregate)
  - LP-076 (Universal Threshold Framework)
  - LP-077 (LSS — Linear Shamir Secret Sharing)
  - LP-103 (Lens — curve threshold)
---

# LP-105: The Lux Finality Stack — Public Vocabulary and Internal Names

## Architectural thesis

> Lux is not merely adding post-quantum signatures to a chain; it defines a hybrid finality architecture for DAG-native consensus, with protocol-agnostic threshold lifecycle, post-quantum threshold sealing, and cross-chain propagation of Horizon finality.

## Claims and evidence

| Claim | Evidence |
|---|---|
| Finality is a transcript-bound hybrid certificate | Quasar Horizon proof (`proofs/quasar/horizon-soundness.tex`) + transcript-mutation tests (`pulsar/reshare/negative_transcript_test.go`, 17 cases × 3 sites) |
| DAG roots are finalized, not blocks | NebulaRoot bound in Pulse (`proofs/definitions/transcript-binding.tex`) + Warp v2 envelope tests |
| Dynamic lifecycle works | LSS-Pulsar / LSS-Lens 10/10 acceptance tests + Rollback tests |
| Cross-chain finality transport | Warp 2.0 envelope round-trip + signature tests (`warp/pulsar/`, real t-of-n ceremony) |
| Hash-suite identity matters | Cross-suite negative tests (`warp/pulsar/hashsuite_mismatch_test.go`) |
| Groth16 not PQ | LP-105 Proof-Lane Classification + paper §11 caveat + `IsPQRootOfTrust` predicate test |
| Production implementation | Fresh-clone CI green; KAT regen scripts byte-equal across runs; 22+ fuzz harnesses 0 panics in 10s+; benchmark report; freeze tag `v0.1.0-rc1-pq-consensus-freeze`; upstream lattigo DoS reported + fix landed ([luxfi/lattice#2](https://github.com/luxfi/lattice/issues/2), [luxfi/lattice#3](https://github.com/luxfi/lattice/pull/3)) |

## Ten architectural commitments

1. Hybrid finality is a bound certificate object.
2. DAG-native chains finalize roots/frontiers, not blocks.
3. Dynamic threshold lifecycle is a reusable systems abstraction.
4. PQ threshold finality needs activation-gated resharing.
5. Cross-chain messages should carry source finality.
6. L1/L2/L3 should be defined by validation relationships.
7. Hash-suite identity is consensus-critical state.
8. Pairing proof wrappers are not PQ roots of trust.
9. Classical and PQ threshold kernels can share one lifecycle.
10. Lux composes all of this into a coherent PQ consensus stack.

## Abstract

This LP defines the authoritative terminology for the Lux consensus and post-quantum cryptography stack. Lux uses a cosmological and optical naming scheme to distinguish data substrate, transport, voting, aggregation, threshold lifecycle, threshold signing, certificate composition, and finality semantics. Every name is **Lux-owned, generic-scientific, technically accurate, and not borrowed from any external franchise**.

> *Lux contributes the missing systems layer between modern PQ threshold signatures and real permissionless blockchain consensus: dynamic validator rotation, share lifecycle, activation-gated resharing, certificate composition, and hybrid classical/PQ finality.* This LP is the vocabulary that names that contribution.

## Naming rules (normative)

A name enters the Lux stack only if it is:

1. **Lux-owned or generic-scientific.**
2. **Cosmological, optical, or cryptographic** in origin.
3. **Technically accurate** about the layer it names.
4. **Not borrowed from any external franchise** (no ship names, no franchise tech, no fictional artifacts).
5. **Not confusing with NIST primitive names** (ML-KEM, ML-DSA, SHA3, SHAKE, cSHAKE, KMAC, TupleHash, SLH-DSA stay verbatim).

Lux **does not rename NIST primitives**. ML-KEM stays ML-KEM. ML-DSA stays ML-DSA. SHA3 stays SHA3. Lux names identify *system roles and composition layers*, not replacement cryptographic standards.

## Public authoritative stack

| Name | Layer | Meaning |
|---|---|---|
| **Nebula** | Data / execution substrate | DAG/GPU-native substrate; frontier roots, epoch roots, bundle roots |
| **Photon** | Consensus signal | Individual validator vote, observation, or attestation |
| **Lumen** | Transport | Post-quantum encrypted/authenticated stream layer |
| **Beam** | Fast classical aggregate | BLS aggregate certificate over independent validator keys |
| **LSS** | Threshold lifecycle | Lifecycle Secret Sharing: generation, rollback, snapshots, live resharing |
| **Lens** | Classical threshold | Curve-threshold kernel (FROST/Schnorr/EdDSA family); see LP-103 |
| **Pulsar** | Post-quantum threshold | Lattice/PQ threshold kernel (Ringtail-derived) |
| **Pulse** | PQ certificate artifact | One Pulsar threshold certificate over a Nebula root |
| **Prism** | Certificate composition | Verifies that every certificate lane refracts from the same Nebula transcript |
| **Horizon** | Finality semantics | Finality boundary once required certificate lanes bind the same transcript |
| **Quasar** | System | Full leaderless consensus protocol |

### Canonical sentence

> Nebula provides the DAG/GPU-native substrate. Photons are validator signals carried through Lumen streams and cohered into Beams. LSS moves threshold shares across generations. Lens emits classical threshold certificates; Pulsar emits post-quantum Pulses. Prism verifies that every certificate lane binds the same Nebula transcript. Quasar reaches the Horizon when finality is sealed.

## Prism (new, this LP)

**Prism** is the certificate-composition and transcript-binding verifier inside Quasar. It is a *verifier*, not a key, not a signature, not a kernel.

```
Prism verifies that every certificate lane is bound to the same
Nebula transcript: chain_id, network_id, epoch, validator-set hash,
KeyEraID, Generation, hash-suite identifier, and Nebula root.

When Prism accepts the Beam, ML-DSA lane, and Pulse together,
Quasar reaches the Horizon.
```

A `HorizonCertificate` is the artifact Prism emits when the bound lanes verify:

```go
type HorizonCertificate struct {
    Beam       bls.AggregateCertificate
    MLDSA      mldsa.CertificateSet
    Pulsar     pulsar.Certificate     // one Pulse
    NebulaRoot ids.ID
    KeyEraID   pulsar.KeyEraID
    GroupID    pulsar.GroupID
    Generation uint64
    HashSuiteID string                // e.g., "Pulsar-SHA3"
}
```

Prism's verification order:

1. Verify domain separation and transcript binding (every lane references the same Nebula root, same hash-suite, same KeyEraID + Generation).
2. Verify BLS Beam aggregate.
3. Verify ML-DSA attestation set against signer bitmap (or Z-Chain Groth16 rollup; see *Proof-lane classification* below — Groth16 is a classical compression/compatibility wrapper, not a PQ root of trust).
4. Verify Pulsar Pulse under the active KeyEra/GroupKey.
5. Verify signer-set and validator-set hashes match epoch state.
6. Verify Nebula root / epoch / round linkage.

`Horizon-final` is **never** defined as "BLS OR Pulsar." It is defined as **Prism-bound hybrid finality**: every required lane refracts from the same transcript.

## Internal Lux-native vocabulary

For internal modules, dashboards, operator-facing language, and developer metaphors. Every term is Lux-native scientific.

| Internal concept | Lux-native name | Meaning |
|---|---|---|
| Encrypted session/channel | **Lumen Channel** | One PQ/hybrid encrypted stream session |
| Fast stream mode | **Lumen Fast** | AEAD-ratchet mode, no per-frame OTS — gossip, mempool, bundle data |
| Audit/control stream mode | **Lumen Audit** | OTS or publicly verifiable high-value frames — votes, resharing messages, activation certs |
| Bulk transfer mode | **Lumen Bulk** | Bundle/state/chunk transport with optional erasure coding |
| Hybrid KEM handshake | **Hybrid Lumen Handshake** | ML-KEM-768 + X25519 hybrid (cited as the X-Wing IETF combiner where the exact primitive is relevant) |
| Node identity key | **Node Identity** | Per-validator wire-identity key |
| Key vault | **Vault** | Encrypted key storage |
| Signing interface | **Signer Interface** | HSM / signer plug-in surface |
| Secret key material | **Key Material** | Generic cryptographic secret bytes |
| Threshold share | **Shard** | One validator's share of a Pulsar or Lens group key |
| Long-lived public-key lineage | **KeyEraID** | Bumps only at Reanchor |
| Resharing version | **Generation** | Bumps every Refresh / Reshare |
| Rollback ancestry | **RollbackFrom** | Records prior generation reverted from |
| Group public key | **GroupKey** | Persistent (A, bTilde) for Pulsar; (g, h, X) for Lens |
| Key-era transcript archive | **Epoch Archive** | Ceremony or activation transcript history |
| Local signer | **Signer** | Per-party signing object |
| DAG planner | **Nebula Planner** | Frontier / bundle / root selection |
| GPU fast path | **Nebula Engine** | GPU-native execution path |
| Bundle retrieval | **Nebula Fetch** | Pull missing DAG/bundle data |
| Network protection | **Shield** | DoS / spam / admission control |
| Telemetry / observability | **Radiance** *(optional)* | System health, logs, metrics |
| Verifier view | **Aperture** *(optional)* | Inclusion proof / Merkle path through a Nebula root |
| Adapter between schemes | **Refraction** *(optional)* | Cross-protocol state translation |
| Family of certificate lanes | **Spectrum** *(optional)* | Beam + ML-DSA + Pulse together |

The optional terms (Radiance, Aperture, Refraction, Spectrum) are reserved for future use; do not add them to public specs unless they earn their place.

## Threshold lifecycle terminology

| Concept | Canonical Lux term | Meaning |
|---|---|---|
| Long-lived threshold public-key lineage | **KeyEraID** | Changes only at Reanchor |
| Resharing version | **Generation** | Bumps on every Refresh or Reshare |
| Rollback ancestry | **RollbackFrom** | 0 on forward; > 0 records prior generation reverted from |
| Same-set share update | **Refresh** (HJKY97) | Same committee, same secret, fresh shares |
| Old-set → new-set transition | **Reshare** (Desmedt-Jajodia) | Validator rotation while preserving secret |
| New-generation gate | **Activation Certificate** | New committee proves it can sign under unchanged GroupKey |
| Fresh public-key lineage | **Reanchor** | New key era, new GroupKey |
| Membership manager role | **Bootstrap Dealer** | Orchestrates resharing; never holds unencrypted secrets |
| Signing orchestration role | **Signature Coordinator** | Collects partials; combines certificates |

## Quasar finality state machine

Public state names. These are the values consumed by clients, indexers, and bridges.

| State | Required evidence | Meaning |
|---|---|---|
| **Observed** | Photons seen | Votes/gossip observed; no finality |
| **Beam-final** | BLS Beam verifies | Fast classical aggregate finality |
| **PQ-attested** | ML-DSA attestation set verifies | Per-validator PQ signatures present |
| **Pulse-sealed** | Pulsar Pulse verifies over Nebula root | Compact PQ threshold certificate exists |
| **Horizon-final** | Prism accepts Beam + ML-DSA + Pulse against same Nebula transcript | Hybrid finality boundary reached |

`Horizon-final` is the strongest state. `Beam-final` and `Pulse-sealed` may exist independently as intermediate confirmations; only Prism-bound hybrid finality crosses the Horizon.

## Nebula / DAG terminology

| Term | Meaning |
|---|---|
| **Nebula** | DAG/GPU-native substrate |
| **NebulaRoot** | Generic root of a DAG state object (frontier, epoch, or bundle) |
| **NebulaFrontierRoot** | Root of current DAG frontier |
| **NebulaEpochRoot** | Epoch-level DAG commitment |
| **NebulaBundleRoot** | Root of bundled finalized DAG/block objects |
| **NebulaPath** | Inclusion path through DAG/bundle |
| **Nebula Planner** | Internal: DAG frontier planner |
| **Nebula Engine** | Internal: GPU execution / acceleration path |

A Pulse signs a `NebulaRoot`, never a vague "block":

```
Pulse = Pulsar.Sign(
    QuasarTranscript(
        NebulaRoot,
        chain_id, network_id, epoch, round,
        validator_set_hash,
        KeyEraID, Generation,
        hash_suite_id,
    )
)
```

## Public package naming

```
github.com/luxfi/consensus          Quasar / Nebula integration; Photon/Beam/Pulse/Prism/Horizon
github.com/luxfi/pulsar             PQ lattice threshold kernel
github.com/luxfi/lens               Curve threshold kernel (LP-103)
github.com/luxfi/threshold          LSS lifecycle framework + per-kernel adapters
github.com/luxfi/warp/pulsar        Warp 2.0 cross-chain Pulse path (LP-021v2)
github.com/luxfi/lumen              PQ E2E stream layer (forthcoming Lumen LP)
github.com/luxfi/fhe                Lux FHE-Go reference runtime (LP-167)
github.com/luxfi/luxcpp/crypto/fhe  Lux FHE-C++ production runtime (LP-167)
```

### Lux FHE — dual-runtime split (LP-167)

Lux FHE is a **dual-runtime** stack: **Lux FHE-Go** is the reference
+ integration runtime (canonical semantics, KAT generation, chain
integration); **Lux FHE-C++** is the production acceleration runtime
(GPU-native execution via Lux FHE-CUDA / Lux FHE-HIP, with
Lux FHE-SYCL reserved for portable accelerators). Both runtimes share
**Lux FHE-Core** (parameter sets, ciphertext format, transcript
binding) and are pinned together by the **Lux FHE-KAT** corpus —
Go-generated KATs replay byte-equal in C++ and vice versa. **Nebula-FHE**
is the DAG/GPU-native scheduler; the F-Chain `drain_fhe` service
(LP-013) is its in-process realisation. **Lux FHEVM** is the
contract-runtime layer. **LP-167** is the canonical FHE LP — see it
for the full vocabulary, repository layout, and acceptance criteria.

Inside `github.com/luxfi/threshold`:

```
protocols/lss/                Lifecycle framework + adapters
  lss_pulsar.go               LSS-Pulsar adapter
  lss_lens.go                 LSS-Lens adapter
  lss_cmp.go                  LSS-CMP adapter (ECDSA)
  lss_frost.go                LSS-FROST shim (deprecated; superseded by lss_lens.go)
protocols/pulsar/             Round orchestration wrapper for Pulsar kernel
protocols/lens/               Round orchestration wrapper for Lens kernel
protocols/frost/              Upstream/reference primitives consumed by Lens
protocols/ringtail/           Upstream/reference primitives consumed by Pulsar (deprecated for production)
```

## Crypto-standard mapping

Use these names *verbatim* in specs and papers. Do not rename them.

| Primitive | Standards / prior-art name | Lux layer | Lux role |
|---|---|---|---|
| Hybrid KEM | X-Wing combiner (X25519 + ML-KEM-768 + SHA3) | Lumen | PQ/classical hybrid session establishment |
| KEM | ML-KEM (FIPS 203) | Lumen | PQ component of hybrid transport |
| Classical DH | X25519 | Lumen | Classical component of hybrid transport |
| Signature | ML-DSA (FIPS 204) | ML-DSA lane | PQ per-validator identity / attestation |
| Stateful hash signatures | LMS / XMSS / SLH-DSA | Lumen Audit (optional) | Public audit frames; forward-secure frame auth |
| BLS aggregate | BLS12-381 aggregate signatures | Beam | Fast classical aggregate finality |
| Curve threshold | FROST (RFC 9591, Komlo-Goldberg 2020) | Lens | Curve-threshold kernel |
| Lattice threshold | Ringtail / Threshold Raccoon / Hermine family | Pulsar | PQ lattice threshold finality |
| Proactive refresh | HJKY97 | LSS | Same-set share refresh |
| Secret redistribution | Desmedt-Jajodia 1997 | LSS | Old-set → new-set resharing |
| Verifiable redistribution | Wong-Wang-Wing 2002 | LSS | VSR / transition verification |
| NIST threshold call | NIST IR 8214C | Pulsar/LSS/Quasar packaging | Spec + reference impl + evaluation target |
| Hash profile | SHA3-256 / cSHAKE256 / KMAC256 / TupleHash256 (FIPS 202, NIST SP 800-185) | Pulsar | Pulsar-SHA3 transcript / PRF / MAC |

> **X-Wing note.** The IETF hybrid-KEM combiner is named "X-Wing" by its authors; that is its standardized name and Lux cites it as such where the specific primitive is relevant. In Lux prose where the exact primitive is not the focus, prefer "hybrid KEM handshake" or "Hybrid Lumen Handshake." Lux does not introduce franchise-flavored names of its own.

## LP / paper crosswalk

Each LP / paper owns specific names; cross-LP references use this canon:

| LP / paper | Names it owns |
|---|---|
| **LP-073 Pulsar** | Pulsar, Pulse, LSS-Pulsar, KeyEraID, Generation, RollbackFrom, Activation Certificate, Pulsar-SHA3 |
| **LP-020 Quasar** | Quasar, Nebula, Photon, Beam, Prism, Horizon, HorizonCertificate |
| **LP-077 LSS** | LSS, Generation, RollbackFrom, Snapshot, LiveReshare, Bootstrap Dealer, Signature Coordinator |
| **LP-103 Lens** | Lens, LSS-Lens, FROST/Schnorr curve threshold |
| **Forthcoming Lumen LP** | Lumen, Lumen Channel, Lumen Fast, Lumen Audit, Lumen Bulk, Hybrid Lumen Handshake |
| **Pulsar-SHA3 spec** | HashSuite, Pulsar-SHA3, HashSuiteID, canonical TupleHash encoding |
| **Forthcoming DKG2 LP** | Reanchor, distributed key generation, key-era creation |
| **LP-021v2 (Warp 2.0)** | EnvelopeV2, Pulse over Warp envelope, WARP-PULSAR-ENVELOPE-v1 prefix |

## Network tier model: L1 / L2

In the Lux architecture, the L1 / L2 distinction is **not** about rollups, fraud proofs, or sequencers. It is about **validator co-validation**.

### L1 — default, sovereign, independent

Every chain built on the Lux stack is **implicitly L1**:

- Own `chain_id` and `network_id`.
- Own validator set; own LSS-managed Pulsar `KeyEraID` lineage.
- Own Beam (BLS), own ML-DSA cert set, own Pulse.
- Own Horizon.
- No inherited security from any other chain.

L1 is the baseline tier. A chain does not need to opt in to be L1 — it simply does not declare a `primary_network_id`. There is no "L0" or "settlement layer" below L1.

L1 covers two distinct deployment shapes, both fully sovereign:

| L1 shape | Description |
|---|---|
| **Primary network** | A Lux-architecture network that other chains may opt to co-validate with (i.e., something other chains can declare as their `primary_network_id`). Examples include the Lux mainnet itself, or any chain that chooses to expose its validator set as a security anchor. |
| **Independent L1** | A chain that runs entirely on its own validator set, never co-validates with any primary, and is never declared as a primary by other chains. Operationally identical to a primary network, but with no downstream L2s anchored to it. |

The two shapes share the same protocol — a chain becomes a "primary" simply by *being declared* as `primary_network_id` by some L2. There is no protocol distinction; it is purely a graph property of who anchors to whom. An L1 with no L2s declared against it is operationally indistinguishable from one with many.

A chain may declare itself L1 forever, or convert to L2 (and back) via a Reanchor-class governance event.

### L2 — shared-security via co-validation

A chain becomes L2 of a primary network by declaring a `primary_network_id` and committing — at the consensus layer — to **co-validation** with that primary network's validator set:

```
L2 chain_id            = X
L2 network_id          = N_X
L2 primary_network_id  = N_P    (← the co-validated network)
L2 validator set       ⊇ subset of (or equal to) N_P's validator set
```

Co-validation is enforced by binding the primary network's `NebulaRoot` into the L2's activation transcript and bundle pulses (LP-073 / LP-105 transcript fields):

```
L2 activation message:
    QUASAR-PULSAR-ACTIVATE-v1 ||
        chain_id              = X
        network_id            = N_X
        primary_network_id    = N_P            ← NEW: declares L2 binding
        primary_nebula_root   = NebulaRoot_P   ← NEW: anchors to primary state
        key_era_id            = ...
        old_generation, new_generation, ...
        nebula_root           = NebulaRoot_X   (own state)
        ...
```

The L2's validators must be members of N_P's validator set (or a configurable subset thereof). Their Pulsar shares for L2 derive from the same Bootstrap Dealer / Signature Coordinator roles that validate N_P, so a Prism that accepts an L2 Horizon also implicitly verifies the validators were active on N_P at the bound primary epoch.

### What L2 is NOT in this model

- **Not a rollup.** No fraud proofs, no validity proofs, no transaction posting to L1. (Rollups are L3 — see below.)
- **Not subordinated.** The L2 produces its own Beam, Pulse, and Horizon. Liveness and safety are sovereign for L2-local state.
- **Not a sidechain.** The validator-set overlap is enforced at the activation-cert level, not optional bridge trust.
- **Not a sequencer model.** Block production is leaderless and follows the L2's own Quasar configuration.

### L3 — rollup / validity / app-specific execution

A chain is **L3** when it settles or anchors to an L1/L2 via succinct proofs (Groth16, STARK), FHE circuits, or fraud / validity proofs:

```
L3 chain_id            = X
L3 network_id          = N_X
L3 settlement_target   = N_S    (← L1 or L2 the rollup posts to)
L3 proof_system        ∈ { Groth16, STARK, FHE-backed, ... }
```

The proof system on an L3 is a **compatibility / compression / privacy adapter, not a PQ root of trust.** PQ finality of an L3 inherits from the underlying L1/L2's Pulse + ML-DSA — it is *never* the Groth16 wrapper itself.

| Tier | Anchors via | PQ root of trust |
|---|---|---|
| **L1** | own validator set | own Pulse + ML-DSA |
| **L2** | co-validation with primary `N_P` | primary's Pulse + ML-DSA, transitively |
| **L3** | succinct proof / fraud proof / FHE | underlying L1/L2's Pulse + ML-DSA (the proof system itself does not provide PQ security) |

A Z-Chain instance, for example, can be:
- **L1** if it runs a sovereign validator set;
- **L2** if it co-validates with another primary network;
- **L3** if it is a privacy/validity execution layer anchored to an L1/L2.

Do not hardcode "Z-Chain = L3". The tier is a *role*, defined by deployment.

### Tier transitions

A chain may transition between tiers via a Reanchor-class governance event. L1 → L2 binds to a primary; L2 → L1 drops the primary binding; L1/L2 → L3 declares a settlement target and proof system; L3 → L1/L2 graduates the chain to its own validator set. Every transition is gated by the same Reanchor mechanism that handles fresh KeyEraID creation.

### What L2 buys

- **Shared validator security.** Compromising the L2 requires compromising enough of N_P's validators — the L2 inherits N_P's economic and operational security model.
- **Cross-chain Prism binding.** A Horizon-final L2 cert proves the L2 state was sealed at a specific N_P primary state. Bridges, indexers, and downstream consumers can verify the link without trusting either chain in isolation.
- **Operational economy.** The L2 does not need its own validator-acquisition path; it leverages the primary's existing set.

### Multiple primaries

A chain may declare any one Lux-architecture network as its primary (Lux mainnet, Hanzo AI, Zoo, or another L1). The choice of `primary_network_id` is a deployment configuration, not a protocol-level constraint. A chain may also be L1 (no `primary_network_id` declared) and later opt in to L2 status via a Reanchor-class governance event that binds its key era to the primary's validator set.

### LSS / Pulsar consequences

An L2's `KeyEraID` lineage is its own — but the validator set behind each era is required to be a subset of `primary_network_id`'s active set at the era's Bootstrap (or Reanchor) moment. The activation cert's `primary_nebula_root` field binds the L2 to a specific N_P state, so L2 reshares cannot drift from the primary's validator-set evolution silently.

If the primary network undergoes a Reanchor (fresh GroupKey, new validator authority), every L2 anchored to it must either Reanchor to follow, Reanchor to a different primary, or drop to L1. This is by design: the security inheritance is explicit, not silent.

### Implementation surface

The L2 model adds two optional fields to `pulsar.TranscriptInputs` and the activation message:

```go
type TranscriptInputs struct {
    // existing fields ...
    PrimaryNetworkID  []byte    // empty for L1; set for L2
    PrimaryNebulaRoot [32]byte  // zero for L1; bound for L2
}
```

L1 chains leave both empty/zero. L2 chains populate them. Prism's verification rule:

```
If PrimaryNetworkID is non-empty:
    require validator-set subset of primary_network[PrimaryNetworkID]
        at primary state PrimaryNebulaRoot
    bind every Horizon cert lane to PrimaryNetworkID + PrimaryNebulaRoot
```

This makes L2 a first-class consensus tier rather than a bridge or rollup.

---

## Proof-lane classification (important)

Distinct from the certificate lanes (Beam, ML-DSA, Pulse), Lux supports optional **succinct proof wrappers** that compress or hide verification work. They are NOT certificate lanes; they wrap one.

| Wrapper | What it is | Post-quantum? | Where it fits |
|---|---|---|---|
| **Groth16 wrapper** | Pairing-based SNARK over BLS12-381; compresses ML-DSA cert-set verification into ~192-byte witness (Z-Chain rollup, LP-307) | **No.** Pairing-based; broken under Shor's algorithm. | Classical compatibility / compression / privacy layer. |
| **STARK wrapper** *(future)* | Hash-based transparent SNARK | Closer to PQ (depends on hash) | Open production-research target; not currently shipping |
| **Lattice ZK wrapper** *(future)* | Lattice-based proof system | Yes (under MLWE) | Open production-research target |

**Critical clarification.** A Groth16 proof asserting that an ML-DSA signature set verified is a *classical succinct proof of post-quantum signature verification*. The signature itself is PQ; the proof system wrapping the verification is **not post-quantum**. This is **not a PQ consensus proof.** PQ finality lives in **ML-DSA + Pulsar**. The Groth16 lane is a compatibility / compression / privacy adapter only.

Lux specifications must phrase this honestly:

| Wrong | Right |
|---|---|
| "Groth16 is the PQ proof lane" | "Groth16 is the classical succinct compression wrapper for ML-DSA verification" |
| "PQ finality from Groth16" | "PQ finality from ML-DSA + Pulsar; Groth16 compresses the ML-DSA verification for EVM compatibility" |
| "Z-Chain is L3 because it uses Groth16" | "Z-Chain may be L3 if it is a rollup; the choice of proof system does not define the tier" |

When a future PQ-friendly proof system (STARK, lattice-based) ships, it replaces Groth16 in the *wrapper* role. PQ finality still flows from ML-DSA + Pulsar; the wrapper succinctness inherits from whatever proof system is in use.

---

## Cross-chain messaging: Warp evolution

Lux Warp (LP-021, `github.com/luxfi/warp`) is the cross-chain messaging protocol. It evolves on the same lane structure as Quasar finality:

| Warp version | Signing lane | Status | Description |
|---|---|---|---|
| **Warp 1.x** | **Beam** (BLS aggregate over independent validator keys) | Shipping | Source-chain validators BLS-sign an outbound message; destination verifies the aggregate against the source's registered validator set. Classical fast cross-chain. |
| **Warp 2.0** | **Beam + ML-DSA cert set + Pulse** (Pulsar PQ threshold) | Shipping | Source chain emits a Pulsar threshold pulse over the Warp message envelope, anchored to a Nebula root and a `KeyEraID + Generation` lineage. Destination verifier checks Beam + ML-DSA + Pulse against the same source-chain transcript. The ML-DSA cert set is optional within the v2 envelope; deployments that need only PQ accountability without the full Pulse can populate that lane and leave Pulse empty. |
| **Warp Private** | **Pulse over FHE ciphertext** | Production-research | Z-Chain FHE ciphertext envelope; the Pulsar pulse signs the ciphertext digest; destination verifies under unchanged GroupKey without seeing plaintext. Pairs with Warp 2.0; orthogonal to it. |

The Warp 2.0 envelope is implemented at `github.com/luxfi/warp` (root package: `EnvelopeV2` + `ParseEnvelope` + `VerifyV2`) plus `github.com/luxfi/warp/pulsar` (KernelVerifier + transcript binding). Forward compatibility: a v2 receiver decodes v1 bytes via `ParseEnvelope` and lifts them into a v2 envelope with PQ lanes empty. Backward compatibility: v1 receivers reject v2 bytes (the leading `0x02` is not a valid RLP-list prefix); senders that need to reach v1-only verifiers emit Warp 1.x bytes on the v1 channel.

The Warp 2.0 envelope adds the following fields to the wire format:

```
WarpEnvelopeV2 {
    Message               *Message    // Warp 1.x message (Beam carrier; unchanged)
    SourceNebulaRoot      [32]byte    // Nebula transcript anchor
    SourceKeyEraID        uint64      // Pulsar lineage
    SourceGeneration      uint64      // Pulsar lineage
    HashSuiteID           string      // "Pulsar-SHA3" default
    PulsarPulse           []byte      // optional; Pulsar threshold sig
    MLDSACertSet          []byte      // optional; ML-DSA attestations
}
```

The version byte (0x02) precedes the RLP-encoded envelope; a future 0x03 envelope is reserved for additional lanes (e.g. Warp Private's FHE payload).

For L2 messaging (per the L1 / L2 model above), the L2 source chain's Pulse implicitly anchors the message to its `primary_network_id` because the L2's activation cert binds that primary's `NebulaRoot`. A destination chain receiving an L2 Warp message verifies the L2's Pulse and, transitively, the L2's anchor to its primary network — without trusting the L2 in isolation.

The standalone Warp 2.0 specification (LP-021v2) elaborates the Pulse transcript binding, byte-format details, and verifier algorithms; this LP-105 entry is the canonical vocabulary stub plus shipping summary.

---

## Names removed / never to use

The following terms are **explicitly excluded** from Lux specs, code, package names, and operator docs. They are either someone else's brand, confusing, or both.

- **Star-Wars-flavored terms**: Comlink, Navicomputer, Holocron, Scomp, Transponder, Code Cylinder, A-Wing, X-Wing (as a Lux name), Y-Wing, B-Wing, TIE, Hyperdrive, Deflector, Tractor, Wayfinder, Lightsaber, Crystal (as a Lux key term), Kyber (as a Lux package name), Bantha, Wookie, anything else fictional.
- **Trademarks and other-project names**: any term unique to a specific outside protocol family.
- **Colliding crypto names**: do not name a Lux package `kyber` (collides with CRYSTALS-Kyber → ML-KEM). Do not name keys "Crystal" (collides with CRYSTALS-Kyber / CRYSTALS-Dilithium).

If a developer needs a "cute" internal name, it must come from this LP's vocabulary or a future amendment. Contributions to this LP are welcome — the rule is the five-criteria test in the *Naming rules* section.

## Final coherent statement

> Nebula is the DAG/GPU-native substrate. Photons are the smallest validator signals. Photons travel through Lumen, the post-quantum encrypted stream layer; Lumen Channels carry them in three modes (Lumen Fast for high-throughput gossip, Lumen Audit for verifiable control frames, Lumen Bulk for bundle and state transfer). BLS coheres Photons into Beams. ML-DSA gives every validator a post-quantum identity. LSS moves threshold shares across generations under the no-trusted-dealer-after-genesis invariant. Lens emits classical threshold certificates. Pulsar emits compact post-quantum Pulses over Nebula roots. Prism verifies that every certificate lane refracts from the same Nebula transcript. Quasar reaches the Horizon when finality is sealed.

That sentence is the Lux stack. Use it.
