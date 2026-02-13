# The Quantum Event Horizon: Why Blockchain Finality Needs to Survive Quantum Computers

*Lux Network's Quasar consensus engine introduces a finality boundary that no adversary — classical or quantum — can reverse.*

## The Problem No One Talks About

Every blockchain has a finality mechanism. Bitcoin uses proof-of-work with probabilistic finality — wait 6 blocks (~60 minutes) and you're "probably" safe. Ethereum uses committee-based finality — wait for validator attestations (~13 minutes) and you're finalized.

But both mechanisms rely on cryptographic signatures that quantum computers will break.

**Bitcoin** uses ECDSA (secp256k1). Shor's algorithm on a sufficiently powerful quantum computer breaks ECDSA in polynomial time. An attacker with a quantum computer could forge transaction signatures and rewrite Bitcoin's history.

**Ethereum** uses BLS signatures (BLS12-381) for its consensus layer. BLS relies on the hardness of the discrete logarithm problem in pairing-friendly elliptic curve groups — also broken by Shor's algorithm.

This isn't theoretical. NIST has already standardized post-quantum algorithms (FIPS 203, 204, 205) because the cryptographic community believes quantum computers capable of breaking current standards will exist within a planning horizon of 10-15 years.

Every seal, timestamp, and finality guarantee anchored to Bitcoin or Ethereum today has an expiration date.

## What is the Quantum Event Horizon?

The Event Horizon is a concept from general relativity — the boundary around a black hole beyond which nothing can escape. In Lux Network's Quasar consensus, the **Quantum Event Horizon** is the boundary beyond which no consensus operation — classical or quantum — can reverse finalized state.

### How It Works

Quasar consensus runs two signing layers in parallel:

**Layer 1 — Classical (BLS)**
Validators sign blocks using BLS aggregate signatures. This is fast (~500ms to finality) and produces compact proofs (96 bytes). It provides the same security as Ethereum's consensus — safe against any adversary without a quantum computer.

**Layer 2 — Post-Quantum (Lattice)**
Every ~3 seconds, Quasar bundles several BLS-finalized blocks and validators add lattice-based signatures (Ringtail protocol, based on Ring-LWE). These signatures are larger (~3KB) but require ≥2^160 operations to forge — even with a quantum computer.

A block achieves **quantum finality** when it has both certificates. The point at which this happens is the Event Horizon.

```
Classical:  ──[B1]──[B2]──[B3]──[B4]──[B5]──[B6]──
                    ~500ms finality each
                              │
Quantum:    ──────────[QB1: covers B1-B6]──────────
                         ~3s quantum finality
                              │
                    ═══════════╪═══════════
                        EVENT HORIZON
                     (point of no return)
```

### Why "Event Horizon"?

In physics, once something crosses a black hole's event horizon, it cannot return. Similarly, once a block crosses the Quantum Event Horizon:

- No classical adversary (unlimited hash power, full network control) can reverse it
- No quantum adversary (arbitrary quantum computation) can reverse it
- No combination of adversaries can reverse it

The only assumption: ≥1/3 of stake-weighted validators are honest. This is the same assumption every proof-of-stake system makes — but Lux is the only one where this assumption holds under quantum attack.

## Why This Matters for Data Integrity

Consider what happens when you seal evidence — a document proving a human rights violation, a medical record, a financial audit trail. The seal must remain valid for:

- **Legal proceedings**: 5-20 years
- **Regulatory compliance**: 7-10 years
- **Medical records**: Patient lifetime (~80 years)
- **Historical evidence**: Indefinitely

SHA-256 hashes anchored to Bitcoin or Ethereum will not survive this timeline if quantum computers arrive within it. A seal is only as strong as the finality of the chain it's anchored to.

Lux's approach:

| Finality Level | Time | Quantum-Safe | Use Case |
|:---------------|:-----|:-------------|:---------|
| Classical Final | ~500ms | No | Real-time monitoring |
| Quantum Final | ~3s | Yes | Legal evidence, compliance |
| Horizon Final | ~6s | Yes + checkpoint proof | Court submission, whistleblower |

A seal at **Horizon Final** comes with a self-contained proof: the receipt, its Merkle inclusion path, and the dual-signed checkpoint. This proof is independently verifiable by anyone, forever, without running a Lux node.

## The Technical Stack

The Quantum Event Horizon sits at the top of a carefully designed cryptographic stack:

```
Layer 4: Applications
         Data Integrity Seals (LP-0535)
         AI Content Provenance (LP-7110)
         Encrypted CRDTs (LP-6500)
              │
Layer 3: Privacy
         FHE Encryption (Private Seals)
         ZK Proofs (ZK Seals)
         Threshold Decryption (t-of-n)
              │
Layer 2: Receipts
         Receipt Registry (LP-0530)
         Poseidon2 Merkle Accumulator (4B leaves)
         Cross-chain Groth16 Export
              │
Layer 1: Consensus Finality
         Quasar Engine
         BLS + Lattice Dual Certificates
         Event Horizon Checkpoints (LP-0536)
              │
Layer 0: Cryptographic Primitives
         Poseidon2 (ZK-friendly, PQ-safe hash)
         ML-DSA / SLH-DSA (PQ signatures)
         ML-KEM (PQ key encapsulation)
```

Every layer is post-quantum safe. There is no single classical cryptographic assumption whose failure compromises the system.

## Performance

The common objection to post-quantum cryptography is performance. Lattice signatures are larger and slower than BLS. Quasar addresses this through async bundling:

- Classical blocks are produced and finalized at full speed (~500ms)
- Quantum certificates are aggregated asynchronously in ~3-second bundles
- Applications that need speed use classical finality
- Applications that need longevity wait 3 additional seconds for quantum finality

Real measurements from the Quasar implementation:

| Operation | Time | Size |
|:----------|:-----|:-----|
| BLS sign | 1.2ms | 96 bytes |
| BLS aggregate (100 validators) | 0.5ms | 96 bytes |
| Lattice sign | 2.5ms | 2.4KB |
| Lattice aggregate (100 validators) | 8ms | ~3KB |
| Total to quantum finality | <3s | — |

The overhead is minimal. For a 3-second wait, you get finality that survives quantum computing. For most applications, this is an obvious trade.

## Comparison With Other Approaches

**NIST PQC migration** (what most chains plan): Replace ECDSA/BLS with ML-DSA everywhere. Simple but lossy — you lose BLS aggregation efficiency and get larger signatures across the board.

**Hybrid signatures** (what some propose): Sign everything with both classical and PQ schemes. Better, but doubles signature overhead on every operation.

**Quasar's approach**: Run classical consensus at full speed. Add quantum certificates asynchronously in bundles. Best of both worlds — classical performance with quantum security, and a clean finality boundary (the Event Horizon) that applications can reason about.

## Building on the Event Horizon

The Event Horizon isn't just a consensus mechanism — it's a primitive that applications build on:

- **Data seals** specify their minimum finality requirement (LP-0535)
- **AI model attestations** wait for horizon finality before being considered permanent (LP-7110)
- **Encrypted CRDTs** use horizon checkpoints as sync boundaries (LP-6500)
- **Cross-chain bridges** export horizon proofs as Groth16 proofs to external chains

The Event Horizon transforms "trust this chain" into "verify this proof." And the proof survives quantum computers.

---

*Quasar implementation: [github.com/luxfi/consensus](https://github.com/luxfi/consensus) | Specifications: [lps.lux.network](https://lps.lux.network)*
