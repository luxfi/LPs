# LP Taxonomy: Research-Grade Subject Model

> **Core Principle**: Subjects describe knowledge. Chains describe deployment.

This document formally defines the Lux Proposals (LP) categorization system — a research-grade taxonomy that separates knowledge domains from execution environments.

## Design Philosophy

### Why Subject-First?

Traditional blockchain documentation collapses distinct research domains into product categories. This creates several problems:

1. **Cryptographers lose trust** — MPC and Threshold are distinct fields with different guarantees
2. **Researchers disengage** — Cannot navigate by knowledge domain
3. **Depth appears shallow** — Lux's crypto research looks like implementation detail
4. **SEO suffers** — Cannot rank for distinct research terms

By separating subjects from chains:

- Lux reads like a **systems + crypto research lab**
- Work becomes **citeable** by domain
- Each domain can **evolve independently**
- Investors see **breadth with rigor**

### Taxonomy Hierarchy

```
┌─────────────────────────────────────────────────────────────────┐
│                    SUBJECTS (Research Domains)                   │
│  Consensus │ Threshold │ MPC │ KMS │ PQC │ ZKP │ Crypto │ AI    │
└─────────────────────────────────────────────────────────────────┘
                              ↓ deployed on
┌─────────────────────────────────────────────────────────────────┐
│                    CHAINS (Execution Domains)                    │
│  P-Chain │ C-Chain │ X-Chain │ T-Chain │ Q-Chain │ Z-Chain │ ...│
└─────────────────────────────────────────────────────────────────┘
                              ↓ enables
┌─────────────────────────────────────────────────────────────────┐
│                       PRODUCT AREAS                              │
│  DeFi │ DEX │ Tokens │ Wallets │ Governance │ Privacy │ ...     │
└─────────────────────────────────────────────────────────────────┘
```

---

## Section 1: Subjects (Research Domains)

These are the core knowledge areas — how cryptographers and protocol researchers think.

### 1.1 Consensus Systems

**Slug**: `consensus`
**Question Answered**: "Who agrees and when?"
**NOT**: "How keys are held"

| Aspect | Details |
|--------|---------|
| **Includes** | Photon, Flare, Quasar, Snowman, epoching, validator rotation, block timing, parallel validation, sequencer design |
| **Excludes** | MPC, Threshold signing, cryptographic primitives |
| **LP Range** | 100-199 |

Consensus is the **physics engine** of the network. It determines agreement and finality, not key management.

### 1.2 Threshold Cryptography

**Slug**: `threshold`
**Focus**: Distributed signing and key control
**Where Ringtail lives**

| Aspect | Details |
|--------|---------|
| **Includes** | FROST, CGGMP, CGGMP21, Ringtail, threshold ECDSA/Schnorr, resharing protocols, signer rotation, per-asset threshold keys |
| **Explicitly NOT** | Generic MPC computation, Custody UX, KMS policy |

Threshold cryptography is **signing-focused** — multiple parties cooperatively sign without any single party holding the full key.

### 1.3 Multi-Party Computation (MPC)

**Slug**: `mpc`
**Question Answered**: "What can we compute without revealing inputs?"
**Relationship to Threshold**: Overlaps in math, **NOT** in scope

| Aspect | Details |
|--------|---------|
| **Includes** | MPC protocols beyond signing, secure function evaluation, distributed computation, privacy-preserving compute, MPC-based bridges (compute side), MPC custody logic (not keys) |
| **Related but separate** | Threshold crypto (different scope), ZKP (different guarantees) |

MPC is a **research-heavy, investor-relevant domain** for general secure computation.

### 1.4 Key Management Systems (KMS)

**Slug**: `kms`
**Nature**: Governance + ops layer for keys
**This is NEITHER MPC nor Threshold**

| Aspect | Details |
|--------|---------|
| **Includes** | K-Chain, HSM integration, key lifecycle, policy engines, access control, rotation rules, custody enforcement |
| **Depends on** | Threshold crypto, MPC, PQC (eventually) |

KMS is **enterprise-grade** operational control of cryptographic material.

### 1.5 Post-Quantum Cryptography (PQC)

**Slug**: `pqc`
**Focus**: Hardness assumptions, NOT protocol topology
**Separate from**: Threshold, MPC, ZKP

| Aspect | Details |
|--------|---------|
| **Includes** | ML-KEM (Kyber), ML-DSA (Dilithium), SLH-DSA (SPHINCS+), Lamport OTS, crypto agility frameworks, hybrid transitions |
| **Standards** | NIST FIPS 203, 204, 205 |

PQC is about **future-resistant primitives** based on mathematical hardness assumptions.

### 1.6 Zero-Knowledge Proof Systems (ZKP)

**Slug**: `zkp`
**Question Answered**: "How to prove correctness without revealing state?"
**Explicitly NOT**: MPC, Threshold signing, encryption-only systems

| Aspect | Details |
|--------|---------|
| **Includes** | ZK proofs, zkVMs, SNARKs, STARKs, validity proofs, Groth16, PLONK, recursive proofs, circuit design |
| **Execution** | Z-Chain (research phase) |

ZKP provides **verifiability without disclosure**.

### 1.7 Cryptography (Foundational)

**Slug**: `crypto`
**Nature**: The toolbox, not the system

| Aspect | Details |
|--------|---------|
| **Includes** | Hash functions, elliptic curves (secp256k1, secp256r1, Ed25519), BLS signatures, RNG, signature verification, crypto libraries |
| **Think of it as** | "Crypto the toolbox, not crypto the system" |

Foundational primitives used by higher-level research domains.

### 1.8 AI & Attestation Systems

**Slug**: `ai`
**Nature**: A new research vertical, not an add-on

| Aspect | Details |
|--------|---------|
| **Includes** | AI mining, training ledgers, attestations, LLM integration, confidential AI compute, model verification, GPU acceleration |
| **Execution** | A-Chain |

Verification of computation, models, and AI agents.

---

## Section 2: Chains (Execution Domains)

Chains are **products that deploy subjects**. They aggregate research domains into execution environments.

| Chain | Slug | Purpose | LP Range | Deploys |
|-------|------|---------|----------|---------|
| **P-Chain** | `p-chain` | Platform coordination | 1000-1199 | Validators, staking, subnets |
| **C-Chain** | `c-chain` | EVM execution | 2000-2499 | Smart contracts, precompiles |
| **X-Chain** | `x-chain` | Asset exchange | 3000-3999 | UTXO, atomic swaps |
| **T-Chain** | `t-chain` | Threshold execution | 7000-7999 | Threshold + MPC |
| **Q-Chain** | `q-chain` | Quantum-safe | 4000-4999 | PQC |
| **Z-Chain** | `z-chain` | ZK execution | 8000-8999 | ZKP (research) |
| **A-Chain** | `a-chain` | AI execution | 5000-5999 | AI & Attestation |
| **B-Chain** | `b-chain` | Bridge execution | 6000-6999 | Bridging systems |

---

## Section 3: Systems (Protocol Infrastructure)

Cross-cutting infrastructure that uses multiple subjects.

### 3.1 Bridging Systems

**Slug**: `bridge`
**Nature**: Asset movement between domains (a SYSTEM, not just messaging)
**Uses**: MPC, Threshold, Consensus

| Component | Description |
|-----------|-------------|
| Teleport | Primary bridge protocol |
| BridgeVM | Dedicated bridge execution |
| Asset Registry | Cross-chain asset tracking |
| Emergency Recovery | Security procedures |

### 3.2 Interoperability

**Slug**: `interop`
**Critical Distinction**: Interop ≠ Bridge
**Focus**: Messages, NOT value

| Component | Description |
|-----------|-------------|
| Warp Protocol | Cross-chain messaging |
| ICM | Inter-chain messaging |
| Message Formats | Standardized payloads |
| Relayer Infra | Message delivery |

### 3.3 Network

**Slug**: `network`
**LP Range**: 0-99
**Focus**: The system as a whole

Architecture, tokenomics, topology, and how chains fit together.

### 3.4 Node Infrastructure

**Slug**: `node`
**Focus**: The minimum system to participate

Node lifecycle, state sync, pruning, snapshots, plugin architecture, VM loading.

---

## Section 4: Product Areas

Application-layer standards and protocols.

| Area | Slug | LP Range | Focus |
|------|------|----------|-------|
| **Markets & DeFi** | `defi` | 2500-2519 | AMMs, lending, perpetuals, oracles |
| **DEX & Trading** | `dex` | 9000-9999 | Order books, HFT, CLOB |
| **Assets & Tokens** | `tokens` | — | LRC-20, LRC-721, LRC-1155 |
| **Wallets & Identity** | `wallets` | — | Multisig, AA, DIDs |
| **Governance & Impact** | `governance` | 2520-2599 | DAOs, ESG, public goods |
| **Privacy** | `privacy` | — | FHE, TEE, MEV protection |
| **Developer Platform** | `dev-platform` | — | SDKs, CLIs, GraphQL |
| **Security** | `security` | — | Audits, bug bounties |
| **Research** | `research` | 700-999 | Experimental protocols |
| **Scaling** | `scaling` | — | L2, rollups, DA |

---

## Key Distinctions (Academically Defensible)

These separations are **critical for credibility**:

| Distinction | Rationale |
|-------------|-----------|
| **Threshold ≠ MPC** | Signing-focused vs general secure computation |
| **MPC ≠ KMS** | Computation protocols vs governance/ops layer |
| **ZKP ≠ Privacy** | Proof systems vs confidential compute |
| **Consensus ≠ Crypto** | Agreement mechanics vs key mechanics |
| **Subjects ≠ Chains** | Knowledge domains vs deployment environments |
| **Interop ≠ Bridge** | Messages vs value movement |

---

## Categorization Priority

LPs are assigned to **exactly one category** using this priority order:

```
1. Tag match (most accurate — first matching tag wins)
2. Number range (LP series allocation)
3. Explicit frontmatter category (fallback for untagged LPs)
```

**Why tags first?** Many legacy LPs have `category: Core` in frontmatter which is too vague. Tags provide accurate subject classification.

---

## How This Surfaces in UI

### Browse by:
- **Subject** (MPC, Threshold, ZKP, PQC, Consensus…)
- **Chain** (C-Chain, T-Chain, Z-Chain…)
- **Product Area** (Bridge, DeFi, DEX, Wallets)
- **Research Track**

This is how **real research labs** present work.

---

## Tag Schema

### Subject Tags
```
consensus, photon, flare, quasar, snowman, finality, bft, validators, epoching
threshold, frost, cggmp, ringtail, tss, resharing, threshold-ecdsa
mpc, secure-computation, distributed-computation, mpc-bridge
kms, key-management, k-chain, hsm, policy-engine, custody
pqc, post-quantum, ml-kem, ml-dsa, slh-dsa, dilithium, kyber, lamport
zk, zkp, zkvm, snark, stark, validity-proof, circuit, groth16, plonk
crypto, hash, curve, bls, ed25519, secp256k1, secp256r1
ai, attestation, llm, training-ledger, gpu, inference, model
```

### Chain Tags
```
p-chain, platform, staking, delegation, subnet
c-chain, evm, precompile, solidity, gas, coreth
x-chain, utxo, atomic-swap
t-chain
q-chain, quantum-chain, quantum-safe
z-chain
a-chain
b-chain, bridgevm
```

### System Tags
```
bridge, teleport, teleporter, bridge-security, asset-registry
interop, warp, icm, cross-chain, message-format, relayer
network, architecture, topology, tokenomics
node, sync, pruning, snapshot, plugin, database
```

### Product Tags
```
defi, amm, lending, yield, perpetuals, oracle
dex, trading, orderbook, clob, hft, exchange
token, tokens, lrc, nft, fungible
wallet, multisig, safe, account-abstraction, did, identity
governance, dao, voting, esg, sustainability, impact
privacy, fhe, tee, confidential, mev
sdk, dev-tools, cli, api, graphql
security, audit, vulnerability, bug-bounty
research, paper, academic, experimental
scaling, l2, rollup, throughput, fraud-proof
```

---

## Implementation

The taxonomy is implemented in [`docs/lib/source.ts`](./lib/source.ts) with:

- `LP_TOPICS`: Array of category definitions with slugs, names, tags, and ranges
- `getPrimaryCategory()`: Assigns each LP to exactly one category
- `getCategorizedPages()`: Groups LPs by primary category (deduplicated)

---

## Why This Matters

> If MPC and Threshold are collapsed:
> - cryptographers lose trust
> - serious researchers disengage
> - Lux looks less deep than it is

> By splitting them:
> - Lux reads like a systems + crypto lab
> - your work becomes citeable
> - each domain can evolve independently
> - investors see breadth with rigor

---

## Final Rule

**Subjects describe knowledge.**
**Chains describe deployment.**

This taxonomy models Lux as a **research-grade cryptography and systems lab** — not just another blockchain.
