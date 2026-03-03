---
lp: 062
title: Hardware Security Module Key Management
tags: [kms, hsm, key-management, secrets, encryption, quasar, precompile]
description: HSM-backed key management service for all Lux/Hanzo infrastructure secrets, integrated as a Quasar precompile per LP-133
author: Lux Core Team (@luxfi)
status: Final
type: Standards Track
category: Identity
created: 2025-11-01
updated: 2025-12-15
references:
  - FIPS 140-3
  - lps-061 (IAM Architecture)
  - lps-015 (Validator Key Management)
  - lps-019 (Threshold MPC)
  - lps-076 (Universal Threshold)
  - lps-133 (Quasar-Native App Stack)
  - lps-134 (Lux Chain Topology)
---

# LP-062: Hardware Security Module Key Management

## Abstract

Defines the key management architecture for Lux infrastructure. All secrets (signing keys, API tokens, database credentials, TLS certificates) are stored in KMS (kms.hanzo.ai), backed by FIPS 140-3 Level 3 HSMs. Secrets are synced to Kubernetes via KMSSecret CRDs. No secret is ever stored in environment files, source code, or plaintext configuration.

## Specification

### Architecture

```
KMS (kms.hanzo.ai)
  |-- HSM backend (FIPS 140-3 Level 3)
  |-- REST API (authenticated via IAM)
  |-- KMSSecret CRD controller (syncs to K8s Secrets)
```

### Key Types

| Type | Algorithm | Use Case |
|------|-----------|----------|
| Signing | Ed25519, secp256k1, ML-DSA | Transaction signing, MPC shares |
| Encryption | AES-256-GCM | Data-at-rest encryption |
| TLS | RSA-4096, ECDSA P-384 | Service TLS certificates |
| HMAC | HMAC-SHA256 | Webhook signing, API auth |

### Operations

- **Create**: `POST /v1/keys` -- generate a new key in HSM, returns key ID.
- **Sign**: `POST /v1/keys/{id}/sign` -- sign data without exporting the key.
- **Encrypt/Decrypt**: `POST /v1/keys/{id}/encrypt|decrypt` -- envelope encryption.
- **Rotate**: `POST /v1/keys/{id}/rotate` -- create new version, old version remains for decryption.
- **Export**: Not supported for HSM-backed keys. Software keys support wrapped export.

### Kubernetes Integration

KMSSecret CRD syncs secrets from KMS to K8s:

```yaml
apiVersion: kms.hanzo.ai/v1
kind: KMSSecret
metadata:
  name: luxd-staking
spec:
  secretRef: luxd/staking/mainnet
  target:
    name: staking-keys
    namespace: lux-mainnet
```

The controller polls KMS every 60 seconds and updates the K8s Secret. Pods mount the Secret as a volume.

## Quasar Integration (LP-133)

Hanzo KMS (`~/work/hanzo/kms`) integrates with the Quasar-native app
stack via a precompile + lane-scoped key material, per LP-133 §3 (MPC +
KMS as Quasar cert lanes). KMS operations become Quasar transactions
executed by the QuasarGPU adapter; key material is held in tenant-scoped
lanes; access control is enforced by a precompile that consults the
P-Chain identity root in `QuasarRoundDescriptor.pchain_validator_root`.

### Operation → transaction mapping

| KMS RPC | Quasar transaction shape | Lane impact |
|---|---|---|
| `kms_keygen` | mints a key into `H("kms", tenant_id, key_id)` | new lane created |
| `kms_rotate` | bumps version on the key lane | MVCC version increment |
| `kms_derive` | read-only tx | no version bump |
| `kms_sign` | calls KMS precompile + emits CertLane artifact | sign-event recorded |
| `kms_revoke` | flips status bit on key lane | tombstone recorded |

### Lane scoping

```
key_lane = H("kms", tenant_id, key_id)
```

Tenant boundaries map to the IAM owner claim. Cross-tenant access is
structurally impossible: a precompile call against a lane the caller's
tenant does not own returns `ACCESS_DENIED` without consulting any
external policy store.

### Cert-lane integration

Threshold-KMS operations (where the key itself is held as t-of-n shares
across validators rather than in a single HSM) reuse the M-Chain cert
lanes from LP-134:

| Threshold-KMS use case | Cert lane | LP |
|---|---|---|
| Threshold ECDSA sign-as-key | `MChainCGGMP21` (5) | LP-019, LP-076 |
| Threshold Schnorr/EdDSA sign-as-key | `MChainFROST` (6) | LP-019, LP-076 |
| Post-quantum threshold sign | `MChainRingtailGen` (7) | LP-073, LP-076 |
| TFHE key-share storage | M-Chain ceremony → F-Chain key arena | LP-013, LP-066 |

This makes threshold-KMS a thin wrapper over the existing MPC ceremony
infrastructure: the "key" is exactly the group public key produced by an
M-Chain DKG, and "sign" is a `SignRequestTx` against that key's lane.

### Replay-proof binding

Every KMS sign request that emits a cert artifact MUST bind the
`certificate_subject` from the active `QuasarRoundDescriptor`. A KMS
signature for round R cannot be replayed in round R+1 because the
upstream chain roots differ — the binding is structural, not policy-
enforced. See LP-020 §"Cert Subject — The Replay-Proof Binding".

### Precompile address

KMS access-control + sign dispatch runs at a reserved EVM precompile
address (assigned by LP-078 / LP-079); the precompile reads the IAM
identity root from `QuasarRoundDescriptor.pchain_validator_root` and the
key lane from `H("kms", tenant_id, key_id)`. Concrete address allocation
lives in the precompile registry, not in this LP.

## Security Considerations

1. HSM-backed keys never leave the HSM boundary. Sign operations happen inside the HSM.
2. Access is authenticated via IAM (LP-061). Each service has a scoped service account.
3. Key rotation does not invalidate old ciphertext -- old key versions decrypt, new version encrypts.
4. Audit log records every key operation with timestamp, caller identity, and result.
5. Quasar-side key material lives in tenant-scoped lanes; cross-tenant reads are structurally rejected by the precompile, not by policy.
6. Threshold-KMS sign artifacts bind `certificate_subject` and are therefore non-replayable across rounds (LP-020 §replay-proof binding).
7. The KMS service plane (`kms.hanzo.ai`) and the on-chain precompile are independently auditable: every chain-side operation has a corresponding KMS audit record, and any divergence is detectable.

## Reference

| Resource | Location |
|----------|----------|
| KMS service | https://kms.hanzo.ai |
| KMS implementation | `github.com/hanzoai/kms`, `~/work/hanzo/kms` |
| Lux KMS service plane | `~/work/lux/kms` |
| KMSSecret CRD | `github.com/hanzoai/kms/crds/` |
| Quasar app-stack integration | LP-133 §3 |
| M-Chain cert lanes for threshold-KMS | LP-134 §QuasarCertLane registry |

## Copyright

Copyright (C) 2025, Lux Partners Limited. All rights reserved.

Licensed under the MIT License.
