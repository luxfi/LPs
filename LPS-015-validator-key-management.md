---
lps: 015
title: Validator Key Management and Chain Bootstrap
tags: [validator, staker, tls, bls, pq, genesis, key-rotation, kms]
description: Secure validator key lifecycle — generation, storage, rotation, genesis binding, and post-quantum readiness
author: Lux Core Team (@luxfi)
status: Draft
type: Standards Track
category: Security
created: 2025-11-22
requires:
  - lps-012 (Post-Quantum Cryptography)
---

# LPS-015: Validator Key Management and Chain Bootstrap

## Abstract

Defines the security model for validator staker keys across the Lux network. Each validator node has 3 cryptographic identities: TLS (node identity + p2p), BLS (consensus voting), and staking (P-Chain registration). Keys MUST be unique per node, non-deterministic, and stored in hardware-backed or KMS-backed storage. This LP covers key generation, persistence, rotation, genesis binding, and the chain bootstrap process.

## Motivation

Validator keys are the highest-value targets on any proof-of-stake network. A compromised validator key allows:
- Double-signing (equivocation attacks)
- Unauthorized withdrawal of staked funds
- Network partition attacks via key collusion
- Permanent loss of stake via slashing

The Lux network requires a key management standard that:
1. Prevents key reuse across nodes (undermines fault tolerance)
2. Prevents key derivation from shared secrets (one compromise = all compromised)
3. Supports key rotation without downtime
4. Enables post-quantum key migration
5. Works across bare-metal, cloud, and Kubernetes environments

## Specification

### 1. Key Types

Each validator maintains 3 independent key pairs:

| Key | Algorithm | Purpose | Rotation |
|-----|-----------|---------|----------|
| **Staker TLS** | ECDSA P-256 (X.509 cert) | Node identity, p2p encryption, NodeID derivation | Annual or on compromise |
| **BLS Signer** | BLS12-381 | Consensus voting, subnet attestation | Per-epoch (planned) |
| **Staking Key** | secp256k1 (derived from TLS) | P-Chain validator registration, reward address | Tied to TLS cert lifecycle |

**Post-Quantum Path** (LPS-012):
| Key | Classical | Post-Quantum | Timeline |
|-----|-----------|--------------|----------|
| TLS | ECDSA P-256 | ML-DSA-65 + Ringtail hybrid | Phase 1 (2026) |
| BLS | BLS12-381 | Ringtail lattice (threshold-friendly) | Phase 1 (2026) |
| Staking | secp256k1 | Ringtail lattice | Phase 1 (2026) |

ML-DSA-65 on TLS adds ~7 KB to the initial handshake (one-time per connection) but provides NIST FIPS 204 compliance — important for regulated institutional clients. Ringtail on consensus voting keeps per-block overhead minimal with threshold-aggregatable signatures.

Hybrid mode: classical + PQ signatures on every message. Secure if either algorithm holds.

### 2. Key Generation

**MUST**: Keys are generated locally on the node using a CSPRNG (crypto/rand).

**MUST NOT**:
- Derive from a shared mnemonic (one mnemonic = all validators compromised)
- Derive from deterministic seeds (predictable = attackable)
- Copy keys between nodes (undermines N-of-M fault tolerance)
- Generate keys on a developer machine and transfer (exposure risk)

**Generation Process**:
```
1. Node boots for the first time
2. Init container checks for existing keys in persistent storage
3. If no keys exist:
   a. Generate ECDSA P-256 key pair → staker.key
   b. Self-sign X.509 cert (10-year expiry) → staker.crt
   c. Generate BLS12-381 key pair → signer.key
   d. Compute NodeID = CB58(RIPEMD160(SHA256(staker.crt.DER)))
   e. Store all 3 files in persistent storage
4. If keys exist: load and verify integrity
```

### 3. Key Storage

**Production (Kubernetes)**:
```
Tier 1 (recommended): Hardware Security Module (HSM)
  - PKCS#11 interface via --staking-kms-endpoint
  - Keys never leave the HSM boundary
  - Supported: AWS CloudHSM, GCP Cloud HSM, Zymbit Zymkey

Tier 2 (acceptable): KMS-backed Kubernetes Secrets
  - Keys stored in etcd, encrypted at rest via KMS provider
  - Per-node Secret: staker-keys-{node-index}
  - RBAC: only the specific pod can read its own Secret

Tier 3 (development only): Persistent Volume
  - Keys on a PVC with ReadWriteOnce access
  - Acceptable for devnet/testnet, NOT for mainnet

NEVER: emptyDir (keys lost on restart, breaks genesis binding)
```

**Key Storage Manifest Pattern (Tier 2)**:
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: staker-keys-node-0
  namespace: chain
type: Opaque
data:
  staker.crt: <base64>
  staker.key: <base64>
  signer.key: <base64>
  node.id: <base64>  # cached NodeID for quick reference
```

StatefulSet mounts per-node:
```yaml
volumes:
  - name: staking
    secret:
      secretName: staker-keys-node-{{ .podIndex }}
```

### 4. Genesis Binding

The genesis file MUST reference the actual validator NodeIDs and BLS public keys. This creates a cryptographic binding between the genesis state and the physical validators.

**Process**:
```
1. Generate keys for all N validators (Section 2)
2. Extract NodeIDs and BLS public keys from each
3. Run: genesis -network <name> -keys-dir <path-to-all-keys>
4. The genesis tool:
   a. Reads staker.crt → derives NodeID
   b. Reads signer.key → extracts BLS public key
   c. Generates initialStakers[] with real NodeIDs + BLS keys
   d. Generates allocations[] with correct HRP for the network ID
   e. Generates C-Chain alloc from the mnemonic (separate concern)
5. Deploy genesis as ConfigMap
6. Boot nodes with matching keys
```

**Network ID → HRP Mapping**:
| Network ID | HRP | Example |
|------------|-----|---------|
| 1 | lux | P-lux1abc... |
| 2 | test | P-test1abc... |
| 3 | dev | P-dev1abc... |
| 1337 | local | P-local1abc... |
| other | custom | P-custom1abc... |

### 5. Chain Bootstrap Process

Complete bootstrap for a new network:

```
Phase 0: Key Generation
  - For each validator (0..N-1):
    - Generate TLS + BLS keys
    - Store in KMS / Secrets
    - Record NodeID + BLS pubkey

Phase 1: Genesis Generation
  - Run: ~/work/lux/genesis/cmd/genesis/
  - Inputs: validator keys, network ID, mnemonic (for C-Chain only)
  - Output: genesis.json with:
    - initialStakers (from real NodeIDs)
    - allocations (P/X with correct HRP)
    - cChainGenesis (from mnemonic)
  - Store in ~/work/lux/genesis/configs/{network}/

Phase 2: Primary Network Boot
  - Deploy genesis as ConfigMap
  - Mount validator keys into pods
  - Boot nodes with --network-id and --genesis-file
  - Wait for P/X/C chains to bootstrap
  - Verify: all validators connected, BLS keys match

Phase 3: Subnet Creation
  - Run: ~/work/liquidity/cli deploy evm
  - Creates subnet on P-Chain
  - Creates Liquid EVM blockchain
  - Registers validators to subnet
  - Wait for subnet to bootstrap

Phase 4: Contract Deployment
  - Deploy CREATE2 factory (deterministic address)
  - Deploy USDL, ComplianceRegistry, LiquidTokenFactory, BatchFactory
  - Deploy 12K+ SecurityTokens via BatchFactory
  - Same CREATE2 salt → same addresses on all networks

Phase 5: Verification
  - Check all accounts funded (P/X/C)
  - Check all contracts deployed
  - Run E2E tests
  - Explorer indexing all blocks
```

### 6. Key Rotation

**Planned rotation** (no downtime):
```
1. Generate new key set for the node
2. Register new NodeID as validator on P-Chain (addValidator tx)
3. Wait for new validator to sync
4. Remove old NodeID from validator set (removeValidator tx)
5. Securely destroy old keys
```

**Emergency rotation** (on compromise):
```
1. Immediately remove compromised NodeID from validator set
2. Generate new keys on a clean machine
3. Re-register with new NodeID
4. Investigate and remediate the compromise
5. Update genesis for next network reset (if needed)
```

### 7. Re-launch with New NodeIDs

When validators need new IPs or keys (migration, compromise, hardware refresh):

```
1. Snapshot current chain state (ZapDB native backup)
2. Export state: ~/work/lux/state/backups/<date>/
3. Generate new validator keys
4. Regenerate genesis with new NodeIDs:
   ~/work/lux/genesis/cmd/genesis/ -keys-dir <new-keys>
5. Update K8s Secrets with new keys
6. Update genesis ConfigMap
7. Delete old PVCs (force clean boot)
8. Boot nodes — they bootstrap from genesis
9. Restore state from snapshot (if preserving history)
10. Redeploy contracts via CREATE2 (same addresses)
```

**What's preserved**: C-Chain contract addresses (CREATE2 deterministic), account balances (genesis alloc), chain configuration.

**What changes**: NodeIDs, BLS keys, P-Chain staker records, IP addresses.

### 8. Liquidity Network Specifics

The Liquidity network (`~/work/liquidity/`) is a sovereign L1 on Lux:

| Network | ID | Chain ID | Validators | Genesis Mnemonic |
|---------|-----|----------|------------|------------------|
| mainnet | 1 | 8675309 | 5 | LUX_MNEMONIC (C-Chain only) |
| testnet | 2 | 8675310 | 5 | LUX_MNEMONIC (C-Chain only) |
| devnet | 3 | 8675311 | 5 | LUX_MNEMONIC (C-Chain only) |
| local | 1337 | 1337 | 3 | light mnemonic (C-Chain only) |

**CRITICAL**: The mnemonic funds C-Chain accounts ONLY. It does NOT generate validator keys. Validator keys are always unique, random, per-node.

### 9. Security Considerations

- **Key isolation**: Each validator's keys are accessible ONLY to that validator's pod
- **No shared secrets**: Validator keys are never derived from a shared seed
- **Defense in depth**: Even if one validator is compromised, the network continues (BFT threshold)
- **Post-quantum ready**: Hybrid classical+PQ signatures on all validator messages (LPS-012)
- **Audit trail**: All key operations logged to KMS audit log
- **Secure destruction**: Old keys are cryptographically erased, not just deleted

## Reference Implementation

- Key generation: `~/work/lux/node/staking/` (TLS + BLS)
- Genesis tool: `~/work/lux/genesis/cmd/genesis/`
- Regenerate genesis: `~/work/lux/genesis/cmd/regenerate-genesis/`
- CLI deploy: `~/work/liquidity/cli/cmd/deploycmd/`
- Operator: `~/work/liquidity/operator/` (manages validator lifecycle)
- KMS staking: `~/work/lux/node/config/config.go` (`--staking-kms-endpoint`)

## Copyright

Copyright (C) 2024-2026, Lux Partners Limited. All rights reserved.
