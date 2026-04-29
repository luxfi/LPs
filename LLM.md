# lps — AI Assistant Context

## Key Terminology (2026-04-10)

**Quasar Consensus = Triple Consensus (BLS + Ringtail + ML-DSA)**:
- **BLS12-381**: classical fast-path, 48-byte aggregate proof
- **Ringtail** (Ring-LWE): post-quantum threshold proof, variable size
- **ML-DSA-65** (FIPS 204): post-quantum identity proof, ~3.3 KB

Each layer independently toggleable. `TripleSignRound1` runs all 3 in parallel. `IsTripleMode()` returns true when all configured. GPU acceleration aspirational (not yet implemented). Transport is ZAP, not p2p. PQ-TLS 1.3 coming (Go 1.26 ML-KEM-768 default).

**Key LPs**:
- LP-020: Quasar triple consensus (QuasarCert wire format)
- LP-070: ML-DSA
- LP-073: Ringtail
- LP-075: BLS
- LP-076: Universal threshold
- LP-022: ZAP wire protocol

## CI Runners (2026-04-29) — closes #256

Two ARC scale-set labels total across hanzoai/luxfi/luxcpp/luxgpu/zooai: `hanzo-build-linux-amd64` (live, hanzo-k8s) and `hanzo-build-linux-arm64` (paused — DOKS no arm64). One ARC listener Helm release per org, all listeners use the same scale-set name and same labels. No `<org>-build-*` labels exist or will be created. See `CI-RUNNERS.md` and `CI-RUNNER-DEPLOY-RUNBOOK.md` for full state.

