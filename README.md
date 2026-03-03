# Lux Improvement Proposals (LPs)

> Lux is not merely adding post-quantum signatures to a chain; it defines a hybrid finality architecture for DAG-native consensus, with protocol-agnostic threshold lifecycle, post-quantum threshold sealing, and cross-chain propagation of Horizon finality.

See [LP-105 §Claims and evidence](LP-105-lux-stack-lexicon.md#claims-and-evidence) for the canonical claims/evidence table and the ten architectural commitments — single source of truth.

This repository hosts the Lux Improvement Proposals: standards, processes, and informational specifications for the Lux network and its post-quantum consensus stack.

## Index

See [LP-INDEX.md](LP-INDEX.md) for the full catalogue of LPs.

## Key LPs

| LP | Title |
|---|---|
| LP-019 | Threshold MPC |
| LP-020 | Quasar Consensus |
| LP-070 | ML-DSA |
| LP-073 | Pulsar — Lattice-Based Threshold Signatures |
| LP-075 | BLS Aggregate |
| LP-076 | Universal Threshold Framework |
| LP-077 | LSS — Linear Shamir Secret Sharing |
| LP-103 | Lens — Curve-Based Threshold Signatures |
| LP-105 | The Lux Finality Stack — Public Vocabulary and Internal Names |

## Status freeze

The PQ-consensus stack ships under freeze tag `v0.1.0-rc1-pq-consensus-freeze`. Fresh-clone CI is green; KAT regen scripts are byte-equal across runs; six fuzz harnesses exercise zero panics in 60 seconds.

## How to run tests

Each implementation repo (consensus, pulsar, lens, threshold, warp) ships its own test suite:

```bash
GOWORK=off go test ./...
```

## How to regenerate KATs

KAT regeneration scripts live in each kernel repo's `cmd/` directory:

```bash
GOWORK=off go run ./cmd/<oracle-name> -<flags>
```

Output is byte-equal across runs given the same inputs.
