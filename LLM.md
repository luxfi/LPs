# lps — AI Assistant Context

## Post-E2E-PQ State (current)

The Lux Proposals (LPs) repository now hosts the canonical E2E-PQ
proposal set. Eight new LPs (168-179) landed this session, mirroring the
Hanzo HIPs 0077-0104.

### LPs that landed this session

| LP | Mirrors HIP | Topic |
|----|-------------|-------|
| LP-168 | HIP-0077 | Mesh Identity |
| LP-169 | HIP-0078 | Z-Chain |
| LP-170 | HIP-0079 | Q-Chain |
| LP-171 | HIP-0084 | Pulsar-M DKG |
| LP-172..179 | HIP-0085..104 | E2E PQ coverage |

### Recent significant commits

| SHA | Impact |
|-----|--------|
| `77d6d4e` | LP-172..179 — mirror HIP-0085..104 |
| `355a013` | LP-168/169/170/171 — mirror HIP-0077/0078/0079/0084 for Lux |
| `88825fd` | PQ canonical terminology (FIPS 203/204/205 + Pulsar + Lamport) |
| `e7a83ca` | Warp 2.0 canonical naming (Beam + ML-DSA + Pulse) |

### Cross-repo coherence
- This repo's LPs MIRROR the canonical Hanzo HIPs (HIP-0077..0104) for
  the Lux network specifically.
- Body text uses LP-specific paths (e.g. `luxfi/consensus`,
  `luxfi/node`); cross-references to Hanzo + Zoo are kept explicit.

---

## Key Terminology (2026-04-10)

**Quasar Consensus = Triple Consensus (BLS + Pulsar + ML-DSA)**:
- **BLS12-381**: classical fast-path, 48-byte aggregate proof
- **Pulsar** (Ring-LWE): post-quantum threshold proof, variable size
- **ML-DSA-65** (FIPS 204): post-quantum identity proof, ~3.3 KB

Each layer independently toggleable. `TripleSignRound1` runs all 3 in parallel. `IsTripleMode()` returns true when all configured. GPU acceleration aspirational (not yet implemented). Transport is ZAP, not p2p. PQ-TLS 1.3 coming (Go 1.26 ML-KEM-768 default).

**Key LPs**:
- LP-020: Quasar triple consensus (QuasarCert wire format)
- LP-070: ML-DSA
- LP-073: Pulsar
- LP-075: BLS
- LP-076: Universal threshold
- LP-022: ZAP wire protocol

## CI Runners (2026-04-29) — closes #256

Two ARC scale-set labels total across hanzoai/luxfi/luxcpp/luxgpu/zooai: `hanzo-build-linux-amd64` (live, hanzo-k8s) and `hanzo-build-linux-arm64` (paused — DOKS no arm64). One ARC listener Helm release per org, all listeners use the same scale-set name and same labels. No `<org>-build-*` labels exist or will be created. See `CI-RUNNERS.md` and `CI-RUNNER-DEPLOY-RUNBOOK.md` for full state.

