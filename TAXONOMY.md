# Lux Canonical Taxonomy

Authoritative naming reference. All LPs, papers, code, and docs must
conform. Last updated 2025-12-15 (Quasar 3.0 launch).

## Chains

| Chain | VM | URI | Role |
|---|---|---|---|
| **P-Chain** | **PVM** | `lux:pvm`  | Platform — staking, validators, epochs, slashing |
| **C-Chain** | **EVM** (cevm) | `lux:evm`  | Contracts — general smart contracts |
| **X-Chain** | **XVM** | `lux:xvm`  | UTXO — assets, swaps, native txs |
| **Q-Chain** | **QVM** | `lux:qvm`  | Quasar threshold-key (Ringtail DKG ceremony) |
| **Z-Chain** | **ZVM** | `lux:zvm`  | Zero-knowledge (Groth16 rollups + ZKP registry) |
| **A-Chain** | **AIVM** | `lux:aivm` | Attestation + AI provenance (TEE quotes, audit, identity, model registry) |
| **B-Chain** | **BVM** | `lux:bvm`  | Bridge — cross-ecosystem messaging |
| **M-Chain** | **MVM** | `lux:mvm`  | MPC ceremonies (CGGMP21, FROST, Ringtail-general) |
| **F-Chain** | **FVM** | `lux:fvm`  | FHE compute (TFHE, encrypted EVM, confidential ERC-20) |

## Consensus family (LP-020 §Quasar 3.0)

| Lux name | Role |
|---|---|
| **Quasar** | top-level consensus family + cert layer |
| **Photon** | committee selection (k-of-N, Fisher-Yates + luminance reputation) |
| **Wave** | per-round threshold voting + FPC |
| **Focus** | confidence accumulation (β consecutive successes = local finality) |
| **Nova** | linear-chain consensus mode (P-Chain, C-Chain, X-Chain, Q-Chain, Z-Chain) |
| **Nebula** | DAG consensus mode (A-Chain optional, M-Chain, F-Chain) |
| **Prism** | DAG geometry (frontiers, cuts, uniform sampling) |
| **Horizon** | DAG order theory (reachability, LCA, transitive closure, skip lists) |
| **Flare** | DAG cert/skip detection via 2f+1 quorum |
| **Ray** | linear-chain finality driver (Wave + Focus + Sink) |
| **Field** | DAG finality driver (Wave + safe-prefix commit) |

## Forbidden names (must NOT appear in current Lux LPs / code / papers)

| Name | Why forbidden | Replace with |
|---|---|---|
| `Snowball` | upstream Avalanche; Lux uses Photon | `Photon` (LP-020) |
| `Snowflake` | upstream; Lux uses Wave | `Wave` (LP-020) |
| `Snowman` | upstream linear protocol | `Nova` mode (LP-134) |
| `Avalanche` (DAG protocol) | upstream DAG protocol | `Nebula` mode (LP-134) |
| `Avalanche` (network/brand) | upstream brand | `Lux` / `Lux Network` |
| `avalanchego` | upstream node binary | `luxd` (`luxfi/node`) |
| `ava-labs/...` (package paths) | upstream packages | `luxfi/...` |
| `avax` (token symbol) | upstream | `LUX` |
| `avax.*` (Go identifiers) | upstream UTXO types | `lux.*` |
| **`AVM`** (X-Chain VM) | upstream X-Chain VM name | **`XVM`** (Lux X-Chain VM) |

**`AVM` collision note**: Avalanche called the X-Chain VM "AVM" (UTXO).
Lux uses `XVM` for that role and `AIVM` (AI/Attestation VM) for
A-Chain. The A-Chain VM is named **AIVM** specifically to disambiguate
from upstream Avalanche's AVM.

## Historical references — preserved

These contexts are allowed to mention upstream names with explicit
qualification:

- "Background" / "History" / "Origin" / "Inspired by" / "Forked from"
  sections in any LP or paper
- Bibliographic citations (e.g., "Snowflake to Avalanche: A Novel
  Metastable Consensus Protocol Family" — that paper exists)
- Migration / compatibility tables that explicitly compare Lux vs
  upstream

For these: the upstream name must be qualified with its Lux equivalent,
e.g., "Snowman (= Lux Nova mode)".

## Threshold-VM substrate

`~/work/lux/chains/thresholdvm` is a **library**, not a chain.
M-Chain (MVM) and F-Chain (FVM) both depend on it but stay
operationally distinct (orthogonal validators, ceremony cadence,
gas economics). **No T-Chain.** LP-7013 is Expired (deprecated
2025-12-25).

## Canonical references

- LP-020 — Quasar Consensus 3.0
- LP-132 — QuasarGPU Execution Adapter
- LP-134 — Lux Chain Topology (this taxonomy's authoritative source)
- LP-135 — QuasarSTM 4.0 Production Spec (activation 2026-02-14)
- LP-137 — GPU-Residency Invariant
- LP-7013 — T-Chain (Expired, deprecated by LP-134)
