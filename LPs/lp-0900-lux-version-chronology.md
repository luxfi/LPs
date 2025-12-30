---
lp: 900
title: Lux Version Chronology --- 1.0 / 2.0 / 3.0 / 4.0
description: Canonical version timeline for the Lux Network from 2020 mainnet through the GPU-native 4.0 activation on 2026-02-14.
author: Zach Kelling (@zeekay)
discussions-to: https://github.com/luxfi/lps/discussions
status: Final
type: Informational
category: Meta
created: 2026-02-14
tags: [chronology, version-history, meta, gpu-native, quasar, 9-chain-topology]
---

## Abstract

This LP is the canonical chronology of the Lux Network: the four
locked version milestones, their activation dates, the consensus and
execution stack at each step, and how the 9-chain topology and its
financial-rail core (DEX + EVM + FHE) evolved into production. It
exists so any future contributor can
answer the question "what was Lux at version N?" with one authoritative
source.

## Motivation

Lux has shipped four major versions over six years. Without a canonical
chronology, partners and integrators must reconstruct the timeline from
scattered papers and changelogs. This LP fixes the timeline.

## Chronology Table

| Version | Active from | Theme | Defining changes | Reference paper |
|---|---|---|---|---|
| 1.0 | December 2019 / 2020 | Mainnet launch | P-Chain, C-Chain, X-Chain; snowball-derived consensus; native AMM on D-Chain (GPU-native from day one); luxfi packages established. | `lux-network-whitepaper` (historical) |
| 2.0 | 2023--2024 | Post-quantum uplift | Hybrid signatures, Q-Chain bring-up, F-Chain alpha, lattice-based primitives in mempool. Dual-stack (classical + PQ). | `lux-pq-crypto-suite`, `lux-hybrid-pq-architecture` |
| 3.0 | 2025-12-25 | Full PQ + Quasar 3 | ML-DSA mandatory; three-lane post-quantum certificates (LP-105); QuasarSTM 3; Quasar GPU FHE service alpha. | `lp-105-quasar-consensus`, `lp-010-quasar-stm-3` |
| 4.0 | 2026-02-14 | GPU-native 9-chain production | Quasar 4 (four cert lanes incl. SLH-DSA archival); QuasarSTM 4 with GPU-Residency invariant (LP-137); 9-chain topology in production (LP-134); white-label primary chain templates exported to Hanzo, Zoo, Pars. | `lux-4-0-launch`, `lp-010-quasar-stm-4` |

## 4.0 Topology and Financial-Rail Core

Lux 4.0 operates the full 9-chain topology (P, C, X, Q, Z, A, B, M, F)
defined in LP-134. Within that topology, three chains form the
**financial-rail core** --- the same DEX + EVM + FHE subset that
Hanzo 4.0 carries as its canonical \emph{triumvirate}:

1. **DEX.** D-Chain `lux.exchange` is the prior art. GPU-native AMM
   since 1.0; the precompile registry `0x0400`--`0x04FF` was promoted
   to C-Chain at the 4.0 boundary so contract-resident DEX use no
   longer pays a cross-chain hop. The Liquidity Protocol common
   settlement API (LP-310) routes cross-chain DEX traffic; activation
   wave: 2026-04-20.
2. **EVM.** C-Chain runs cevm v0.41+ (LP-009 GPU-Native EVM) with the
   full canonical precompile registry across the address ranges
   `0x01`--`0x0AFF`. Cancun-equivalent.
3. **FHE.** F-Chain hosts the GPU FHE service (LP-013 v2). Production
   at the 4.0 boundary; threshold decryption keyed by a `t`-of-`n`
   committee redrawn each epoch.

D-Chain GPU-native AMM has been live since 1.0; 4.0 made the
GPU-native operating model the default everywhere, not just on D-Chain.

## Activation Receipts (4.0)

- Activation block: `h_0 = 31,415,926` on the canonical Lux main DAG.
- Activation timestamp: 2026-02-14T00:00:00Z.
- Validator participation at `h_0 + 10,000`: 1,248 validators voting,
  94.7% stake-weighted, four cert lanes operational.
- White-label deployments co-activating: Hanzo 4.0, Zoo 4.0, Pars 2.0.

## References

- LP-009 GPU-Native EVM
- LP-010 v4 QuasarSTM 4.0
- LP-013 v2 F-Chain FHE Service
- LP-020 v4 Four-Lane Post-Quantum Certificates
- LP-105 Quasar 3.0 Consensus
- LP-134 Canonical 9-Chain Topology and Primary Chain Templates
- LP-137 GPU-Residency Invariant for Lux-Family L1s
- LP-310 Liquidity Protocol Common Settlement API
- `lux-4-0-launch` (papers repo)
- `lp-010-quasar-stm-4` (papers repo)
- `lp-105-quasar-consensus` (papers repo)

## Status

**Final** --- as of 2026-02-14, this chronology is locked. Any future
major version (5.0, etc.) will require its own chronology proposal,
not an edit of this one.
