---
lp: 062
title: Hardware Security Module Key Management
tags: [kms, hsm, key-management, secrets, encryption]
description: HSM-backed key management service for all Lux infrastructure secrets
author: Lux Core Team (@luxfi)
status: Final
type: Standards Track
category: Identity
created: 2025-11-01
references:
  - FIPS 140-3
  - lps-061 (IAM Architecture)
  - lps-015 (Validator Key Management)
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

## Security Considerations

1. HSM-backed keys never leave the HSM boundary. Sign operations happen inside the HSM.
2. Access is authenticated via IAM (LP-061). Each service has a scoped service account.
3. Key rotation does not invalidate old ciphertext -- old key versions decrypt, new version encrypts.
4. Audit log records every key operation with timestamp, caller identity, and result.

## Reference

| Resource | Location |
|----------|----------|
| KMS service | https://kms.hanzo.ai |
| KMS implementation | `github.com/hanzoai/kms` |
| KMSSecret CRD | `github.com/hanzoai/kms/crds/` |

## Copyright

Copyright (C) 2025-2026, Lux Partners Limited. All rights reserved.

Licensed under the MIT License.
