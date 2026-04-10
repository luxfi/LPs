---
lp: 102
title: Encrypted Streaming Replication — SQLite + ZapDB
tags: [encryption, replication, sqlite, zapdb, age, pq, s3]
description: E2E post-quantum encrypted streaming replication for SQLite (WAL-based) and ZapDB (incremental backup) to S3-compatible storage using age (ML-KEM-768 + X25519)
author: Lux Core Team (@luxfi)
status: Living
type: Standards Track
category: Core
created: 2026-04-09
requires:
  - lp-0006 (Security)
  - lp-0008 (Plugin Architecture)
references:
  - hip-0302 (Hanzo Replicate)
  - zip-0803 (Zoo Encrypted Streaming Replication)
---

# LP-102: Encrypted Streaming Replication — SQLite + ZapDB

## Abstract

This proposal specifies end-to-end post-quantum encrypted streaming replication for two storage engines used across the Lux ecosystem:

1. **SQLite** (WAL-based) — used by Base-powered services (ATS, BD, TA, IAM, KMS)
2. **ZapDB** (incremental backup) — used by high-throughput KV workloads (DEX state, MPC session cache, consensus metadata)

Both engines replicate continuously to S3-compatible object storage. All data at rest in S3 is encrypted with age using ML-KEM-768 + X25519 hybrid keys. Recovery is automatic: pods restore from S3 on startup, eliminating PVC scheduling constraints.

## Motivation

Lux services run per-org SQLite databases (via Base) and per-chain ZapDB instances. Both are embedded, single-writer stores deployed as StatefulSets or sidecar containers. This creates a durability problem:

1. **Pod ephemerality**: K8s pods are mortal. A node drain, OOM kill, or rolling update destroys local state. PVCs mitigate this but introduce scheduling constraints and cross-AZ reattach latency.
2. **Per-org SQLite**: Base services maintain one SQLite file per tenant organization. A single ATS pod may hold 50+ SQLite databases. PVC-based backup does not scale.
3. **ZapDB volatility**: ZapDB is an in-memory KV store with periodic snapshots. Without continuous replication, a crash loses all state since the last snapshot.
4. **Compliance**: SEC Rule 17a-4, FINRA 4511, and MiFID II require immutable audit trails. Encrypted off-site replication satisfies the "separate storage" requirement.
5. **Post-quantum readiness**: Current X25519 encryption is vulnerable to harvest-now-decrypt-later attacks. Financial data encrypted today must remain confidential for 30+ years.

## Specification

### Encryption Layers

Three independent layers protect data. Compromise of one does not compromise the others.

| Layer | Scope | Algorithm | Key Source |
|-------|-------|-----------|------------|
| 1. Disk encryption | SQLite at rest on local disk | sqlcipher (AES-256-CBC, 256K PBKDF2 iterations) | Per-DB passphrase from KMS |
| 2. S3 encryption | Data at rest in object storage | age v1.3.0+ (ML-KEM-768 + X25519 hybrid) | Per-service age keypair |
| 3. Transport encryption | Data in flight to S3 | TLS 1.3 (ECDHE + AES-256-GCM) | S3 endpoint certificate |

### Per-Principal Key Derivation

Each service (and each org within a service) gets a unique Content Encryption Key (CEK) derived via HKDF:

```
master_key       = KMS.get("lux/replicate/master")
service_salt     = SHA-256("lux:replicate:" || service_name)
org_salt         = SHA-256("lux:replicate:" || service_name || ":" || org_id)
service_cek      = HKDF-SHA-256(master_key, service_salt, 32)
org_cek          = HKDF-SHA-256(master_key, org_salt, 32)
age_identity     = age.NewX25519Identity(seed=org_cek)
```

Cross-service or cross-org access requires the master key. Individual CEKs cannot derive sibling keys.

### SQLite Replication (Replicate Sidecar)

The `luxfi/replicate` sidecar (a Litestream fork with age encryption) runs alongside every Base-powered service.

**Architecture**:

```
Pod
├── init-container: luxfi/replicate restore
│   └── Downloads latest snapshot + WAL segments from S3
│   └── Decrypts with age identity
│   └── Writes SQLite files to emptyDir volume
├── main-container: service (ATS, BD, TA, etc.)
│   └── Opens SQLite in WAL mode
│   └── Writes to emptyDir volume
└── sidecar-container: luxfi/replicate replicate
    └── Watches SQLite WAL changes (inotify)
    └── Encrypts WAL segments with age
    └── Streams to S3 every 1 second
    └── Takes full snapshot every 24 hours
```

**S3 path convention**:

```
s3://{bucket}/{env}/{service}/{org_id}/
├── generations/
│   └── {generation_id}/
│       ├── snapshots/
│       │   └── {sequence}.snapshot.age
│       └── wal/
│           └── {start_offset}_{end_offset}.wal.age
└── latest
```

**Recovery objectives**:

| Metric | Target |
|--------|--------|
| RPO | 1 second (continuous WAL streaming) |
| RTO | 30 seconds (snapshot restore + WAL replay) |
| Retention | 72 hours WAL, 30 days snapshots |

### ZapDB Replication (ZapDB Replicator)

ZapDB is a high-throughput KV store used for DEX orderbook state, MPC session caches, and consensus metadata. Unlike SQLite, ZapDB does not use WAL. Instead, it produces incremental backup frames in ZAP binary format.

**ZAP binary format**:

```
Frame header (16 bytes):
  [0:4]   magic    = 0x5A415001 ("ZAP\x01")
  [4:8]   frame_id = monotonic uint32
  [8:12]  length   = payload length in bytes
  [12:14] checksum = CRC-16 of payload
  [14:15] flags    = 0x01=snapshot, 0x02=delta, 0x04=compressed
  [15:16] reserved = 0x00

Payload:
  If flags & 0x04: zstd-compressed key-value pairs
  Otherwise: raw key-value pairs

  Key-value encoding:
    [0:4]   key_len   = uint32 BE
    [4:4+k] key       = bytes
    [4+k:8+k] val_len = uint32 BE
    [8+k:8+k+v] value = bytes
    ... repeat until payload exhausted
```

**Architecture**:

```
Pod
├── init-container: luxfi/zapdb-replicator restore
│   └── Downloads latest snapshot frame from S3
│   └── Decrypts with age identity
│   └── Applies delta frames in order
│   └── Writes ZapDB data to emptyDir volume
├── main-container: service (DEX, MPC, etc.)
│   └── Opens ZapDB in replication mode
│   └── Emits ZAP frames to Unix socket
└── sidecar-container: luxfi/zapdb-replicator replicate
    └── Reads ZAP frames from Unix socket
    └── Encrypts each frame with age
    └── Streams to S3 (batched, 500ms window)
    └── Emits full snapshot frame every 4 hours
```

**S3 path convention**:

```
s3://{bucket}/{env}/{service}/{instance_id}/zapdb/
├── snapshots/
│   └── {frame_id}.snap.zap.age
├── deltas/
│   └── {start_frame}_{end_frame}.delta.zap.age
└── latest
```

**Recovery objectives**:

| Metric | Target |
|--------|--------|
| RPO | 500 milliseconds (batched frame streaming) |
| RTO | 15 seconds (snapshot + delta replay) |
| Retention | 24 hours deltas, 7 days snapshots |

### Post-Quantum Encryption

All age encryption uses ML-KEM-768 + X25519 hybrid mode, available natively in age v1.3.0+.

**Key properties**:

- Recipient public keys use the `age1pq` prefix (hybrid ML-KEM-768 + X25519)
- Backward compatible: standard age clients with PQ support can decrypt
- Forward secure: compromise of X25519 key alone is insufficient if attacker lacks ML-KEM private key
- NIST FIPS 203 compliant (ML-KEM-768 = CRYSTALS-Kyber Level 3)

**Key generation**:

```bash
# Generate hybrid PQ identity
age-keygen --pq > /run/secrets/replicate-identity.txt

# Public key format: age1pq1<bech32-encoded-hybrid-key>
# Private key format: AGE-SECRET-KEY-1PQ<bech32-encoded-hybrid-key>
```

**Key rotation**:

Keys rotate on a 90-day cycle. During rotation, both old and new keys are valid recipients. The Replicate sidecar encrypts to both keys for a 24-hour overlap window, then drops the old key.

### emptyDir Replaces PVC

With continuous replication, local storage uses `emptyDir` (backed by the node's ephemeral disk or tmpfs). Benefits:

1. No PVC provisioner dependency
2. No cross-AZ reattach latency
3. Pods schedule on any node
4. Storage is disposable — S3 is the source of truth

## Security Considerations

1. **Master key compromise**: Attacker can derive all CEKs. Mitigation: master key lives in HSM-backed KMS, requires MFA for access, and is rotated annually.
2. **S3 bucket access**: Even with bucket access, data is age-encrypted. Attacker needs the age identity (derived from master key) to decrypt.
3. **Sidecar compromise**: The sidecar holds the age identity in memory. A container escape could read it. Mitigation: use K8s `securityContext.readOnlyRootFilesystem`, drop all capabilities, run as non-root.
4. **Harvest-now-decrypt-later**: ML-KEM-768 hybrid encryption ensures that even a quantum computer cannot decrypt captured ciphertext.

## Backward Compatibility

Services currently using PVC-backed storage continue to work. The Replicate sidecar is additive. Migration path:

1. Add Replicate sidecar to existing StatefulSet
2. Let it build initial snapshot from live database
3. Switch PVC to emptyDir in next rolling update
4. Pod restores from S3 on restart

## Reference Implementation

Full LaTeX specification with formal proofs of encryption composability and recovery guarantees:

`luxfi/papers/lp-102-encrypted-sqlite-replication.tex`

Reference implementations:

- `luxfi/replicate` — SQLite WAL replication sidecar (Go)
- `luxfi/zapdb-replicator` — ZapDB frame replication sidecar (Go)
- `luxfi/age` — age encryption with ML-KEM-768 hybrid support (Go)
