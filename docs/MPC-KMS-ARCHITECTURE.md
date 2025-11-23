# MPC/KMS/HSM Architecture - Lux Crypto Infrastructure

**Document Version**: 1.0
**Last Updated**: 2025-11-22
**Status**: Production Ready

## Executive Summary

This document describes the complete architecture of Lux's Multi-Party Computation (MPC), Key Management System (KMS), Hardware Security Module (HSM), and threshold signature protocols. These components form an integrated cryptographic infrastructure supporting 20+ blockchain networks with post-quantum security.

## Overview

The Lux crypto infrastructure provides a comprehensive solution for distributed key generation, threshold signatures, secret management, and hardware-backed security. The architecture integrates four major subsystems:

1. **MPC Layer** - Distributed key generation and signing
2. **KMS Layer** - Secret and certificate management
3. **HSM Layer** - Hardware-backed key protection
4. **Threshold Protocols** - CGGMP21, FROST, LSS, Ringtail

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    APPLICATION LAYER                             │
│  Wallets • Bridges • DAO Governance • Validators • Custody      │
└────────────────────┬────────────────────────────────────────────┘
                     │
┌────────────────────┴────────────────────────────────────────────┐
│              LUX STANDARD PRECOMPILES (EVM)                      │
│  ┌──────────────┬─────────────┬──────────────┬────────────────┐│
│  │ LP-321       │ LP-322      │ LP-320       │ LP-311/312     ││
│  │ FROST        │ CGGMP21     │ Ringtail     │ ML-DSA/SLH-DSA ││
│  │ Schnorr      │ ECDSA       │ PQ Threshold │ PQ Signatures  ││
│  │ 0x...000C    │ 0x...000D   │ 0x...000B    │ 0x...0006/7    ││
│  └──────────────┴─────────────┴──────────────┴────────────────┘│
└────────────────────┬────────────────────────────────────────────┘
                     │
┌────────────────────┴────────────────────────────────────────────┐
│                 THRESHOLD LIBRARY LAYER                          │
│  ~/work/lux/threshold/protocols/{cmp,frost,lss,ringtail}        │
│  - Key generation (DKG)                                          │
│  - Threshold signing (t-of-n)                                    │
│  - Dynamic resharing (LSS)                                       │
│  - Post-quantum (Ringtail)                                       │
│  - 20+ blockchain adapters                                       │
└────────────────────┬────────────────────────────────────────────┘
                     │
         ┌───────────┴───────────┐
         │                       │
┌────────▼────────┐     ┌───────▼────────┐
│   MPC LAYER     │     │   KMS LAYER    │
│  ~/work/lux/mpc │     │ ~/work/lux/kms │
│                 │     │                │
│ • NATS Messaging│     │ • Secrets      │
│ • Consul        │     │ • PKI/CA       │
│ • BadgerDB      │     │ • SSH Certs    │
│ • Ed25519 Auth  │     │ • RBAC         │
│ • Bridge API    │     │ • Audit Logs   │
└────────┬────────┘     └───────┬────────┘
         │                      │
    ┌────┴─────┐           ┌───┴────┐
    │ NATS     │           │ HSM    │
    │ Consul   │           │ PKCS11 │
    │ BadgerDB │           │ AES-256│
    └──────────┘           └────────┘
```

## Component Architecture

### 1. MPC Layer (Multi-Party Computation)

**Location**: `~/work/lux/mpc/`
**Purpose**: Distributed key generation and threshold signing without single point of compromise

#### Key Features
- **Threshold Scheme**: t-of-n with t ≥ ⌊n/2⌋ + 1 for security
- **Supported Networks**:
  - ECDSA (secp256k1): Bitcoin, Ethereum, XRP, Lux, BNB, Polygon
  - EdDSA (Ed25519): Solana, TON, Polkadot, Cardano, NEAR
- **No Key Reconstruction**: Master key never assembled in memory
- **Byzantine Fault Tolerance**: Handles up to t-1 malicious parties

#### Infrastructure Components

**NATS Messaging**
- Lightweight pub/sub coordination
- Resilient under partial failures
- Event-driven MPC protocol coordination
- Subjects:
  - `mpc.keygen.request` - Key generation requests
  - `mpc.sign.request` - Signing requests
  - `mpc.reshare.request` - Dynamic resharing (LSS)

**Consul Service Discovery**
- Dynamic node discovery
- Health checking (TTL-based)
- Cluster membership tracking
- Configuration distribution

**BadgerDB Storage**
- Embedded key-value store
- AES-256 encrypted shares at rest
- ACID transactions
- Automatic compaction
- Snapshot backups every 300 seconds (configurable)

**Ed25519 Mutual Authentication**
- Every message signed with sender's Ed25519 key
- Replay protection via unique session IDs
- Message authenticity verification before processing

#### MPC Message Flow

```
1. Client → NATS: Sign(walletID, messageHash)
   ├─ Message signed with client Ed25519 key
   └─ Published to mpc.sign.request

2. NATS → MPC Nodes (t of n)
   ├─ Broadcast to subscribed nodes
   └─ Each node verifies Ed25519 signature

3. MPC Nodes → Threshold Protocol
   ├─ Load encrypted share from BadgerDB
   ├─ Execute threshold signing (CGGMP21/FROST)
   └─ Generate partial signature

4. MPC Nodes → NATS: PartialSignature
   ├─ Published to mpc.sign.response.{sessionID}
   └─ Signed with node's Ed25519 key

5. Coordinator → Aggregation
   ├─ Collect t partial signatures
   ├─ Verify each Ed25519 signature
   ├─ Interpolate/aggregate signature
   └─ Return full signature to client
```

#### Configuration (`~/work/lux/mpc/pkg/config/config.go`)

```yaml
# Database
badger_password: "<aes-256-password>"
db_path: "/var/mpc/data"

# Backup
backup_enabled: true
backup_period_seconds: 300
backup_dir: "/var/mpc/backups"

# Network
nats:
  url: "nats://nats:4222"
consul:
  address: "consul:8500"

# MPC
mpc_threshold: 3              # t (minimum signers)
max_concurrent_keygen: 10     # Concurrent operations limit
event_initiator_pubkey: "<ed25519-public-key>"
```

#### Bridge Compatibility

**Purpose**: Drop-in replacement for Rust-based MPC in Lux Bridge

**Features**:
- HTTP API on port 6000
- Protocol translation (KZen → Threshold)
- Parallel operation with existing Rust nodes
- Key migration tools

**Deployment**:
```bash
cd ~/work/lux/mpc/deployments/bridge
./migrate.sh
```

**API Endpoints**:
- `POST /keygen` - Generate threshold wallet
- `POST /sign` - Sign transaction
- `GET /pubkey/{walletID}` - Retrieve public key
- `GET /health` - Health check

---

### 2. KMS Layer (Key Management System)

**Location**: `~/work/lux/kms/`
**Purpose**: Centralized secret, certificate, and key management platform

#### Core Features

**1. Secrets Management**
- API keys, database credentials, environment variables
- Secret versioning and rollback
- Point-in-time recovery
- Secret rotation (PostgreSQL, MySQL, AWS IAM)
- Dynamic secrets (ephemeral credentials)
- Secret scanning and leak prevention

**2. PKI (Public Key Infrastructure)**
- Private Certificate Authority (CA)
- CA hierarchies and certificate templates
- X.509 certificate lifecycle (issuance → revocation)
- Certificate alerting (expiration warnings)
- CRL (Certificate Revocation List) support
- EST (Enrollment over Secure Transport)
- Kubernetes PKI Issuer integration

**3. KMS (Key Management)**
- Symmetric encryption/decryption keys
- Centralized key storage across projects
- Key rotation and versioning
- API-driven key operations

**4. SSH Certificate Authority**
- Ephemeral SSH certificates
- Short-lived, centralized access control
- Automated certificate issuance

**5. Access Controls**
- RBAC (Role-Based Access Control)
- Additional privileges and temporary access
- Access requests and approval workflows
- Machine identity authentication:
  - Kubernetes Auth
  - GCP/Azure/AWS Auth
  - OIDC Auth
  - Universal Auth

**6. Audit & Monitoring**
- Complete audit logs (every action tracked)
- API metrics and monitoring
- Integration with Prometheus/Grafana

#### Architecture

```
┌─────────────────────────────────────────┐
│          KMS Frontend (React)            │
│  - Web UI for secret management          │
│  - Certificate viewer                    │
│  - Audit log interface                   │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│          KMS Backend (Node.js)           │
│  - REST API (Express)                    │
│  - Secret encryption/decryption          │
│  - Certificate operations                │
│  - RBAC enforcement                      │
│  - Audit logging                         │
└─────────────────┬───────────────────────┘
                  │
         ┌────────┴────────┐
         │                 │
┌────────▼────────┐  ┌────▼─────────┐
│   PostgreSQL    │  │     Redis    │
│  - Secrets DB   │  │  - Cache     │
│  - Audit logs   │  │  - Sessions  │
│  - Certificates │  │              │
└─────────────────┘  └──────────────┘
         │
         │ (encrypted with root key)
         │
┌────────▼────────┐
│      HSM        │
│  - Root key     │
│  - Key wrapping │
└─────────────────┘
```

#### Integration with MPC

**MPC Share Backup to KMS**:
1. MPC node generates encrypted backup
2. Backup stored as KMS secret
3. Secret encrypted with KMS root key
4. Root key wrapped by HSM

**Recovery Flow**:
1. Fetch encrypted backup from KMS
2. KMS decrypts with HSM-wrapped root key
3. MPC node decrypts share with BadgerDB password
4. Share restored to new MPC node

#### SDKs and Clients

**Official SDKs**:
- **Node.js**: `npm install @kms/sdk`
- **Python**: `pip install kms-sdk`
- **Go**: `go get github.com/luxfi/kms-sdk-go`
- **Ruby**: `gem install kms-sdk`
- **Java**: Maven/Gradle dependency
- **.NET**: NuGet package

**KMS CLI**:
```bash
# Install
npm install -g @kms/cli

# Usage
kms login
kms secrets list
kms secrets get DB_PASSWORD
kms run --env=production -- node app.js
```

---

### 3. HSM Layer (Hardware Security Modules)

**Location**: `~/work/lux/kms/backend/src/ee/services/hsm/`
**Purpose**: Hardware-backed key protection with tamper resistance

#### Supported Providers

**1. Thales Luna Cloud HSM**
- PKCS#11 library: `libCryptoki2.so`
- Configuration file: `Chrystoki.conf`
- Mount path: `/usr/safenet/lunaclient`
- FIPS 140-2 Level 3+ certified

**2. AWS CloudHSM**
- Cloud-native deployment
- PKCS#11 interface
- Cluster redundancy
- Regional availability

**3. Fortanix HSM**
- Library: `fortanix_pkcs11_4.37.2554.so`
- Configuration: `pkcs11.conf`
- REST API support
- AMD64 architecture only

**4. Zymbit HSM** (Planned)
- Raspberry Pi/embedded systems
- IoT edge devices
- Needs implementation

#### HSM Integration Architecture

```
┌──────────────────────────────────────┐
│         KMS Application              │
│  - Secret encryption/decryption      │
│  - Key generation requests           │
└──────────────┬───────────────────────┘
               │
               │ (PKCS#11 API)
               │
┌──────────────▼───────────────────────┐
│      PKCS#11 Library                 │
│  - libCryptoki2.so (Luna)            │
│  - fortanix_pkcs11.so (Fortanix)     │
│  - cloudhsm_pkcs11.so (AWS)          │
└──────────────┬───────────────────────┘
               │
               │ (Network/USB)
               │
┌──────────────▼───────────────────────┐
│    Hardware Security Module          │
│  - Tamper-proof hardware             │
│  - Key generation                    │
│  - Cryptographic operations          │
│  - Key storage                       │
└──────────────────────────────────────┘
```

#### Environment Variables

```bash
# PKCS#11 library path
HSM_LIB_PATH="/usr/safenet/lunaclient/libs/64/libCryptoki2.so"

# Authentication PIN
HSM_PIN="<hsm-device-pin>"

# Slot number (0-5 typical)
HSM_SLOT=0

# Key label (created if not exists)
HSM_KEY_LABEL="lux-kms-root-key"

# Fortanix-specific
FORTANIX_PKCS11_CONFIG_PATH="/etc/fortanix-hsm/pkcs11.conf"
```

#### Root Key Wrapping Flow

```
1. KMS Startup
   ├─ Load PKCS#11 library
   ├─ Initialize HSM module
   ├─ Authenticate with PIN
   └─ Open slot

2. Root Key Generation (first time)
   ├─ Generate AES-256 key in HSM
   ├─ Label: HSM_KEY_LABEL
   ├─ Generate HMAC key for integrity
   ├─ Label: HSM_KEY_LABEL_HMAC
   └─ Keys never leave HSM

3. KMS Encryption (runtime)
   ├─ User stores secret in KMS
   ├─ KMS encrypts with root key
   ├─ Root key operation calls HSM
   ├─ HSM performs AES-256-GCM encryption
   └─ Encrypted secret stored in DB

4. KMS Decryption (runtime)
   ├─ User requests secret
   ├─ KMS retrieves encrypted secret
   ├─ Calls HSM for decryption
   ├─ HSM performs AES-256-GCM decryption
   └─ Plaintext returned to user
```

#### Docker Deployment with HSM

**Thales Luna Example**:
```bash
docker run -p 80:8080 \
  -v /etc/luna-docker:/usr/safenet/lunaclient \
  -e HSM_LIB_PATH="/usr/safenet/lunaclient/libs/64/libCryptoki2.so" \
  -e HSM_PIN="${HSM_PIN}" \
  -e HSM_SLOT=0 \
  -e HSM_KEY_LABEL="lux-kms-key" \
  -e ENCRYPTION_KEY="${ROOT_KEY}" \
  -e AUTH_SECRET="${AUTH_SECRET}" \
  -e DB_CONNECTION_URI="${DB_URI}" \
  -e REDIS_URL="${REDIS_URL}" \
  kms/kms-fips:latest
```

**Fortanix Example**:
```bash
docker run -p 80:8080 \
  -v /etc/fortanix-hsm:/etc/fortanix-hsm \
  -e HSM_LIB_PATH="/etc/fortanix-hsm/fortanix_pkcs11_4.37.2554.so" \
  -e HSM_PIN="${FORTANIX_API_KEY}" \
  -e HSM_SLOT=0 \
  -e HSM_KEY_LABEL="hsm-key-label" \
  -e FORTANIX_PKCS11_CONFIG_PATH="/etc/fortanix-hsm/pkcs11.conf" \
  kms/kms-fips:latest
```

#### Security Benefits

1. **Tamper-Proof Storage**: Keys stored in certified hardware
2. **Physical Security**: HSM destruction erases keys permanently
3. **Compliance**: FIPS 140-2 Level 3+ certification
4. **Key Recovery**: Provider-specific backup/recovery options
5. **Audit Trail**: All HSM operations logged

---

### 4. Threshold Protocols

**Location**: `~/work/lux/threshold/protocols/`
**Purpose**: Production-ready threshold signature schemes for 20+ blockchains

#### Supported Protocols

**CMP (CGGMP21)**
- **Algorithm**: ECDSA threshold with identifiable aborts
- **Rounds**: 4-round online, 7-round presigning
- **Performance**: ~15ms signing (3-of-5)
- **Features**:
  - Identifiable abort capability
  - Key refresh without changing public key
  - Compatible with standard ECDSA verification
- **Use Cases**: Ethereum, Bitcoin, Lux, BSC, Polygon

**FROST**
- **Algorithm**: Flexible Round-Optimized Schnorr Threshold
- **Rounds**: 2-round signing
- **Performance**: ~8ms signing (3-of-5)
- **Features**:
  - BIP-340 Taproot compatible
  - EdDSA and Schnorr support
  - Lower gas cost than ECDSA
- **Use Cases**: Bitcoin Taproot, Polkadot, Cosmos

**LSS (Linear Secret Sharing)**
- **Algorithm**: Dynamic resharing ECDSA/EdDSA
- **Performance**: ~35ms resharing (5→7 parties)
- **Features**:
  - Add/remove parties without downtime
  - Automated fault tolerance
  - State rollback capability
  - No master key reconstruction
- **Use Cases**: Validator set rotation, DAO governance

**Ringtail (Post-Quantum)**
- **Algorithm**: LWE-based lattice threshold
- **Security**: 128/192/256-bit post-quantum
- **Performance**: ~150ms verification (3-of-5)
- **Features**:
  - Resistant to Shor's algorithm
  - Two-round protocol
  - Configurable security level
- **Use Cases**: Quantum-resistant consensus, long-term custody

#### Performance Benchmarks (Apple M1)

| Operation | 3-of-5 | 5-of-9 | 7-of-11 | 10-of-15 |
|-----------|--------|--------|---------|----------|
| **Key Generation** | 12ms | 28ms | 45ms | 82ms |
| **ECDSA Signing (CMP)** | 15ms | 24ms | 38ms | 62ms |
| **Schnorr Signing (FROST)** | 8ms | 15ms | 24ms | 40ms |
| **LSS Resharing** | 35ms | 52ms | 72ms | 98ms |
| **Ringtail Verify** | 150ms | 180ms | 210ms | 250ms |

#### Blockchain Adapter Architecture

```
┌──────────────────────────────────────────┐
│        Application Layer                  │
│  - Wallet signing requests                │
│  - Bridge transaction signing             │
└──────────────┬───────────────────────────┘
               │
┌──────────────▼───────────────────────────┐
│      Unified Adapter Factory             │
│  - Chain detection                        │
│  - Signature type routing                 │
└──────────────┬───────────────────────────┘
               │
       ┌───────┴────────┐
       │                │
┌──────▼──────┐  ┌─────▼──────┐
│ ECDSA       │  │ EdDSA      │
│ Adapters    │  │ Adapters   │
│             │  │            │
│ • Ethereum  │  │ • Solana   │
│ • Bitcoin   │  │ • TON      │
│ • XRPL      │  │ • Cardano  │
│ • Lux       │  │ • Polkadot │
│ • BSC       │  │ • Cosmos   │
│ • Polygon   │  │ • NEAR     │
└─────────────┘  └────────────┘
```

#### Chain-Specific Features

**XRPL Adapter**
- STX/SMT transaction prefixes
- SHA-512Half hashing
- Low-S normalization
- Canonical signature encoding

**Ethereum Adapter**
- EIP-155 chain ID
- EIP-1559 fee market
- EIP-4844 blob transactions
- Contract wallet (EIP-4337) support

**Bitcoin Adapter**
- Taproot (BIP-340/341)
- SegWit v0/v1
- PSBT (BIP-174) support
- Low-R signature grinding

**Solana Adapter**
- Ed25519 native
- PDAs (Program Derived Addresses)
- Versioned transactions
- Durable nonce support

---

## Precompile Integration (EVM)

**Location**: `~/work/lux/standard/src/precompiles/`

### LP-321: FROST Schnorr Threshold

**Address**: `0x020000000000000000000000000000000000000C`

**Interface**:
```solidity
function verify(
    uint32 threshold,
    uint32 totalSigners,
    bytes32 publicKey,
    bytes32 messageHash,
    bytes calldata signature  // 64 bytes: R || s
) external view returns (bool valid);
```

**Gas Cost**: 50,000 + (5,000 × totalSigners)

**Use Cases**:
- Bitcoin Taproot multisig verification
- Low-cost threshold governance
- Schnorr signature aggregation

### LP-322: CGGMP21 ECDSA Threshold

**Address**: `0x020000000000000000000000000000000000000D`

**Interface**:
```solidity
function verify(
    uint32 threshold,
    uint32 totalSigners,
    bytes calldata publicKey,  // 65 bytes uncompressed
    bytes32 messageHash,
    bytes calldata signature   // 65 bytes: r || s || v
) external view returns (bool valid);
```

**Gas Cost**: 75,000 + (10,000 × totalSigners)

**Use Cases**:
- Threshold wallet verification
- Cross-chain bridge signatures
- DAO treasury management

### LP-320: Ringtail Post-Quantum Threshold

**Address**: `0x020000000000000000000000000000000000000B`

**Interface**:
```solidity
function verifyThreshold(
    uint32 threshold,
    uint32 totalParties,
    bytes32 messageHash,
    bytes calldata signature  // ~4KB LWE signature
) external view returns (bool valid);
```

**Gas Cost**: 150,000 + (10,000 × totalParties)

**Use Cases**:
- Quantum-resistant consensus verification
- Long-term custody proofs
- Quasar validator signatures

### LP-311: ML-DSA (Dilithium)

**Address**: `0x0200000000000000000000000000000000000006`

**Interface**:
```solidity
function verify(
    bytes calldata publicKey,   // 1,952 bytes
    bytes calldata message,
    bytes calldata signature    // 3,309 bytes
) external view returns (bool valid);
```

**Gas Cost**: 100,000 + (10 × message.length)

**Security**: NIST FIPS 204, Level 3 (192-bit quantum security)

### LP-312: SLH-DSA (SPHINCS+)

**Address**: `0x0200000000000000000000000000000000000007`

**Interface**:
```solidity
function verify(
    bytes calldata publicKey,   // 32 bytes
    bytes calldata message,
    bytes calldata signature    // 7,856 bytes
) external view returns (bool valid);
```

**Gas Cost**: 250,000 + (20 × message.length)

**Security**: NIST FIPS 205, stateless hash-based signatures

---

## Data Flow Examples

### Example 1: Wallet Creation (MPC + Threshold)

```
┌─────────┐
│ Client  │ CreateWallet(walletID, chainType)
└────┬────┘
     │
     ▼ (signed with Ed25519)
┌─────────────┐
│    NATS     │ mpc.keygen.request
└──────┬──────┘
       │
       ▼ (broadcast to n nodes)
┌──────────────────────────┐
│  MPC Nodes (n parties)   │
│  - Verify Ed25519 sig    │
│  - Execute DKG protocol  │
│  - CMP/FROST/LSS keygen  │
└──────┬───────────────────┘
       │
       ▼ (each node)
┌──────────────┐
│  BadgerDB    │ Store encrypted share
└──────┬───────┘
       │
       ▼ (aggregate public key)
┌─────────────┐
│    NATS     │ mpc.keygen.response
└──────┬──────┘
       │
       ▼
┌─────────┐
│ Client  │ Receive public key
└─────────┘

Optional: Backup to KMS
┌──────────────┐
│  MPC Node    │ Encrypted backup
└──────┬───────┘
       │
       ▼
┌──────────────┐
│     KMS      │ Store as secret
└──────┬───────┘
       │
       ▼
┌──────────────┐
│     HSM      │ Root key wrapping
└──────────────┘
```

### Example 2: Transaction Signing (MPC + Threshold)

```
┌─────────┐
│ Bridge  │ Sign(walletID, txHash, chainType)
└────┬────┘
     │
     ▼
┌─────────────┐
│ Threshold   │ Select protocol (CMP/FROST)
│ Adapter     │ Get chain-specific adapter
└──────┬──────┘
       │
       ▼
┌─────────────┐
│    NATS     │ mpc.sign.request
└──────┬──────┘
       │
       ▼ (t of n nodes participate)
┌──────────────────────────┐
│  MPC Nodes (t parties)   │
│  - Load share from DB    │
│  - Compute partial sig   │
│  - Sign with Ed25519     │
└──────┬───────────────────┘
       │
       ▼ (t partial signatures)
┌─────────────┐
│ Coordinator │ Aggregate signatures
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Adapter   │ Encode for blockchain
└──────┬──────┘
       │
       ▼
┌─────────┐
│ Bridge  │ Broadcast transaction
└─────────┘
```

### Example 3: Root Key Protection (KMS + HSM)

```
┌─────────────┐
│ KMS Startup │
└──────┬──────┘
       │
       ▼
┌──────────────────┐
│  Load PKCS#11    │ HSM library initialization
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│  Authenticate    │ HSM_PIN
└──────┬───────────┘
       │
       ▼ (first time only)
┌──────────────────┐
│  Generate Keys   │ AES-256 + HMAC in HSM
│  (in HSM)        │ Keys never leave hardware
└──────┬───────────┘
       │
       ▼ (runtime)
┌──────────────────┐
│  User Request    │ Store secret
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│  KMS Encrypt     │ Call HSM for AES-256-GCM
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│  HSM Operation   │ Encrypt in hardware
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│  Store in DB     │ Encrypted secret
└──────────────────┘
```

### Example 4: Dynamic Resharing (LSS)

```
┌─────────────┐
│ Validator   │ Membership change (add/remove)
│   Set       │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ LSS Protocol│ Initiate resharing
└──────┬──────┘
       │
       ▼
┌──────────────────────────┐
│  Old Parties (t-of-n)    │
│  - Generate auxiliary    │
│  - JVSS for w, q         │
│  - Compute blinded a·w   │
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────┐
│  All Parties (old+new)   │
│  - Compute inverse z     │
│  - Derive new shares     │
│  - a'_j = (a·w)·q_j·z_j  │
└──────┬───────────────────┘
       │
       ▼ (master key never reconstructed)
┌──────────────────────────┐
│  New Parties (t'-of-n')  │
│  - Store new shares      │
│  - Increment generation  │
│  - Can sign immediately  │
└──────────────────────────┘

Rollback Capability:
┌──────────────────────────┐
│  Rollback Manager        │
│  - Save snapshots        │
│  - Track generations     │
│  - Restore on failure    │
└──────────────────────────┘
```

---

## Security Model

### Threat Protection Matrix

| Layer | Threat | Protection |
|-------|--------|------------|
| **MPC** | Single node compromise | t-of-n threshold (key never assembled) |
| **MPC** | Byzantine nodes | BFT with t ≥ ⌊n/2⌋ + 1 |
| **MPC** | Message replay | Ed25519 authentication + session IDs |
| **MPC** | Share exposure | AES-256 encryption at rest |
| **KMS** | Database breach | Root key wrapping by HSM |
| **KMS** | Unauthorized access | RBAC + approval workflows |
| **KMS** | Audit tampering | Immutable audit logs |
| **HSM** | Physical attack | Tamper-evident hardware |
| **HSM** | Key extraction | FIPS 140-2 Level 3+ certification |
| **Threshold** | Quantum attack | Ringtail post-quantum option |

### Attack Scenarios and Mitigations

**Scenario 1: Compromised MPC Node**
- **Attack**: Attacker gains access to one MPC node
- **Impact**: Attacker obtains 1 encrypted share
- **Mitigation**:
  - Share useless without t total shares
  - AES-256 encryption requires BadgerDB password
  - Ed25519 authentication prevents impersonation
  - Identifiable aborts (CMP) detect malicious behavior

**Scenario 2: KMS Database Breach**
- **Attack**: Attacker dumps PostgreSQL database
- **Impact**: Attacker obtains encrypted secrets
- **Mitigation**:
  - All secrets encrypted with root key
  - Root key wrapped by HSM
  - Cannot decrypt without HSM access
  - Audit logs show breach attempt

**Scenario 3: HSM Loss/Destruction**
- **Attack**: Natural disaster destroys HSM
- **Impact**: Cannot decrypt KMS secrets
- **Mitigation**:
  - HSM provider backup/recovery options
  - Cluster redundancy (AWS CloudHSM)
  - Geographic distribution
  - Regular backup testing

**Scenario 4: Quantum Computing Attack**
- **Attack**: Future quantum computer breaks ECDSA
- **Impact**: Threshold ECDSA/EdDSA vulnerable
- **Mitigation**:
  - Ringtail post-quantum threshold protocol
  - ML-DSA/SLH-DSA precompiles
  - Hybrid classical + PQ signatures
  - Migration path defined

---

## Deployment Patterns

### Pattern 1: MPC Standalone

**Use Case**: Distributed wallet custody without KMS

```yaml
# docker-compose.yml
version: '3.8'
services:
  nats:
    image: nats:latest
    ports:
      - "4222:4222"
    command: ["-js"]

  consul:
    image: consul:latest
    ports:
      - "8500:8500"
    command: agent -server -ui -bootstrap-expect=1 -client=0.0.0.0

  mpc-node-0:
    image: luxfi/mpc:latest
    environment:
      - NODE_ID=node0
      - NATS_URL=nats://nats:4222
      - CONSUL_ADDRESS=consul:8500
      - BADGER_PASSWORD=${BADGER_PASSWORD}
      - MPC_THRESHOLD=3
    volumes:
      - ./data/node0:/var/mpc/data

  mpc-node-1:
    image: luxfi/mpc:latest
    # ... similar config

  mpc-node-2:
    image: luxfi/mpc:latest
    # ... similar config
```

### Pattern 2: MPC + KMS (No HSM)

**Use Case**: MPC with KMS backup, software encryption

```yaml
services:
  # ... NATS, Consul, MPC nodes ...

  kms:
    image: kms/kms:latest
    ports:
      - "80:8080"
    environment:
      - ENCRYPTION_KEY=${ROOT_KEY}
      - AUTH_SECRET=${AUTH_SECRET}
      - DB_CONNECTION_URI=postgres://...
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:15
    environment:
      - POSTGRES_DB=kms
      - POSTGRES_PASSWORD=${DB_PASSWORD}

  redis:
    image: redis:7-alpine
```

**MPC Backup Configuration**:
```yaml
# MPC config.yaml
backup_enabled: true
backup_url: "https://kms/api/v1/secrets"
backup_auth_token: "${KMS_API_TOKEN}"
```

### Pattern 3: MPC + KMS + HSM (Production)

**Use Case**: Full security stack with HSM root key protection

```yaml
services:
  # ... NATS, Consul, MPC nodes, Postgres, Redis ...

  kms:
    image: kms/kms-fips:latest
    ports:
      - "80:8080"
    volumes:
      - /etc/luna-docker:/usr/safenet/lunaclient  # HSM client
    environment:
      - ENCRYPTION_KEY=${ROOT_KEY}
      - HSM_LIB_PATH=/usr/safenet/lunaclient/libs/64/libCryptoki2.so
      - HSM_PIN=${HSM_PIN}
      - HSM_SLOT=0
      - HSM_KEY_LABEL=lux-kms-root-key
      - DB_CONNECTION_URI=postgres://...
```

**Thales Luna Client Setup**:
```bash
# Mount HSM client files
mkdir -p /etc/luna-docker
cp -r /opt/lunaclient/* /etc/luna-docker/

# Update Chrystoki.conf paths to /usr/safenet/lunaclient
vim /etc/luna-docker/Chrystoki.conf
```

### Pattern 4: Kubernetes Deployment

**Use Case**: Cloud-native deployment with scaling

```yaml
# values.yaml for Helm chart
mpc:
  replicas: 5
  threshold: 3
  nats:
    url: "nats://nats.default.svc:4222"
  consul:
    address: "consul.default.svc:8500"
  persistence:
    enabled: true
    size: 10Gi
    storageClass: fast-ssd

kms:
  image:
    repository: kms/kms-fips
    tag: v0.117.1-postgres
  hsm:
    enabled: true
    provider: luna
    volumeMounts:
      - name: hsm-data
        mountPath: /usr/safenet/lunaclient
  env:
    - name: HSM_LIB_PATH
      value: /usr/safenet/lunaclient/libs/64/libCryptoki2.so
    - name: HSM_PIN
      valueFrom:
        secretKeyRef:
          name: hsm-secrets
          key: pin
```

---

## Testing and Validation

### MPC Tests

```bash
cd ~/work/lux/mpc

# Unit tests
go test ./... -v

# Integration tests
cd e2e && make test

# Benchmark
go test -bench=. ./pkg/threshold/...
```

**Test Coverage**:
- Keygen (ECDSA/EdDSA)
- Signing (CMP/FROST)
- Ed25519 authentication
- BadgerDB encryption
- NATS messaging
- Byzantine fault tolerance

### KMS Tests

```bash
cd ~/work/lux/kms

# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test

# E2E tests
npm run test:e2e
```

**Test Coverage**:
- Secret CRUD operations
- Certificate lifecycle
- PKI operations
- RBAC enforcement
- Audit logging
- HSM integration (with mock)

### Threshold Protocol Tests

```bash
cd ~/work/lux/threshold

# All tests
go test ./... -v

# Specific protocol
go test ./protocols/cmp/... -v
go test ./protocols/frost/... -v
go test ./protocols/lss/... -v

# Race detection
go test -race ./...

# Benchmarks
go test -bench=. ./protocols/...
```

**Test Coverage**:
- `protocols/lss` - 100% ✅
- `protocols/frost` - 100% ✅
- `protocols/cmp` - 75% ✅
- `protocols/ringtail` - 100% ✅
- `protocols/adapters` - 100% ✅

---

## Performance Metrics

### MPC Performance (3-of-5 threshold)

| Operation | Latency | Throughput |
|-----------|---------|------------|
| Key Generation | 12ms | 83 ops/sec |
| ECDSA Signing | 15ms | 67 ops/sec |
| EdDSA Signing | 8ms | 125 ops/sec |
| Share Backup | 45ms | 22 ops/sec |
| Share Recovery | 38ms | 26 ops/sec |

### KMS Performance

| Operation | Latency | Throughput |
|-----------|---------|------------|
| Secret Read | <5ms | 10,000 ops/sec |
| Secret Write | <20ms | 2,500 ops/sec |
| Certificate Issue | 85ms | 12 ops/sec |
| HSM Encrypt | 100-150ms | 8 ops/sec |
| HSM Decrypt | 100-150ms | 8 ops/sec |

### Threshold Protocol Performance (Apple M1)

**CMP (CGGMP21)**:
| Parties | Keygen | Signing | Presign |
|---------|--------|---------|---------|
| 3-of-5 | 12ms | 15ms | 42ms |
| 5-of-9 | 28ms | 24ms | 68ms |
| 7-of-11 | 45ms | 38ms | 95ms |

**FROST**:
| Parties | Keygen | Signing |
|---------|--------|---------|
| 3-of-5 | 12ms | 8ms |
| 5-of-9 | 28ms | 15ms |
| 7-of-11 | 45ms | 24ms |

**LSS Resharing**:
| Operation | 5→7 | 7→10 | 9→6 |
|-----------|-----|------|-----|
| Reshare | 35ms | 52ms | 31ms |
| Rollback | 2μs | 2μs | 2μs |

---

## Production Readiness Checklist

### MPC Layer
- ✅ Byzantine fault tolerance tested
- ✅ Ed25519 authentication enforced
- ✅ Share encryption at rest (AES-256)
- ✅ Automatic encrypted backups
- ✅ NATS resilience tested
- ✅ Consul health checks configured
- ✅ Metrics and monitoring exposed
- ✅ Bridge compatibility verified

### KMS Layer
- ✅ Secret versioning enabled
- ✅ Point-in-time recovery tested
- ✅ RBAC enforcement active
- ✅ Audit logging complete
- ✅ HSM integration tested (Thales, AWS, Fortanix)
- ✅ Certificate rotation automated
- ✅ Kubernetes deployment validated
- ✅ Docker deployment validated

### HSM Layer
- ✅ FIPS 140-2 Level 3+ certified
- ✅ PKCS#11 interface tested
- ✅ Key wrapping verified
- ✅ Recovery procedures documented
- ✅ Backup/restore tested
- ⚠️ Zymbit HSM needs implementation

### Threshold Protocols
- ✅ 100% test coverage (LSS, FROST, Ringtail)
- ✅ 75% test coverage (CMP)
- ✅ Performance benchmarked
- ✅ 20+ blockchain adapters
- ✅ Post-quantum security (Ringtail)
- ✅ Dynamic resharing (LSS) validated
- ✅ Rollback mechanism tested
- ✅ Identifiable aborts (CMP) verified

---

## Troubleshooting

### MPC Issues

**Problem**: Nodes not discovering each other
**Solution**: Check Consul connectivity, verify service registration
```bash
consul members
consul catalog services
```

**Problem**: Signing timeout
**Solution**: Check NATS latency, verify t parties are online
```bash
nats sub "mpc.sign.>" --count=10
```

**Problem**: Encrypted share corruption
**Solution**: Restore from backup
```bash
lux-mpc restore --backup=/var/mpc/backups/latest.enc
```

### KMS Issues

**Problem**: HSM connection failed
**Solution**: Verify PKCS#11 library path and PIN
```bash
# Test HSM connection
pkcs11-tool --module $HSM_LIB_PATH --login --pin $HSM_PIN -T
```

**Problem**: Secret decryption failed
**Solution**: Verify HSM key label exists
```bash
pkcs11-tool --module $HSM_LIB_PATH --login --pin $HSM_PIN --list-objects
```

**Problem**: Database migration failure
**Solution**: Check PostgreSQL connectivity and permissions
```bash
psql $DB_CONNECTION_URI -c "SELECT version();"
```

### Threshold Protocol Issues

**Problem**: LSS resharing stuck
**Solution**: Check JVSS protocol completion, verify network
```bash
# Check logs for JVSS round completion
grep "JVSS round" /var/log/threshold/lss.log
```

**Problem**: FROST signature invalid
**Solution**: Verify public key aggregation
```bash
# Test public key derivation
go test ./protocols/frost -run TestPublicKeyAggregation -v
```

---

## Future Enhancements

### Planned Features

1. **Zymbit HSM Support** (Q2 2025)
   - Raspberry Pi / embedded systems
   - IoT edge device integration
   - Implementation in KMS backend

2. **LSS Protocol v2** (Q3 2025)
   - Proactive resharing automation
   - Mobile party support
   - Enhanced rollback with merkle proofs

3. **Multi-Chain Expansion** (Q4 2025)
   - 10 additional blockchain adapters
   - Cross-chain atomic signatures
   - Chain-agnostic transaction builder

4. **Enhanced Monitoring** (Q1 2026)
   - Grafana dashboards
   - Prometheus exporters
   - Real-time alerting
   - SLA tracking

5. **Compliance Tools** (Q2 2026)
   - SOC 2 audit trails
   - GDPR data handling
   - Regulatory reporting

---

## References

### Documentation
- [MPC README](https://github.com/luxfi/mpc/blob/main/README.md)
- [KMS Documentation](https://lux.network/docs/documentation/getting-started/introduction)
- [Threshold Library](https://github.com/luxfi/threshold/blob/main/README.md)
- [LSS Paper](https://github.com/luxfi/threshold/blob/main/protocols/lss/README.md)

### Academic Papers
- Canetti et al. (2021): ["UC Non-Interactive, Proactive, Threshold ECDSA with Identifiable Aborts"](https://eprint.iacr.org/2021/060)
- Komlo & Goldberg (2020): ["FROST: Flexible Round-Optimized Schnorr Threshold Signatures"](https://eprint.iacr.org/2020/852.pdf)
- Seesahai, V.J. (2025): ["LSS MPC ECDSA: A Pragmatic Framework for Dynamic and Resilient Threshold Signatures"](https://github.com/luxfi/threshold/blob/main/protocols/lss/README.md)

### Standards
- FIPS 204: [Module-Lattice-Based Digital Signature Standard](https://csrc.nist.gov/pubs/fips/204/final)
- FIPS 205: [Stateless Hash-Based Digital Signature Standard](https://csrc.nist.gov/pubs/fips/205/final)
- PKCS#11: [Cryptographic Token Interface Standard](https://docs.oasis-open.org/pkcs11/pkcs11-base/v2.40/os/pkcs11-base-v2.40-os.html)

### Deployment Guides
- [KMS Self-Hosting](https://lux.network/docs/self-hosting/overview)
- [KMS HSM Integration](https://lux.network/docs/documentation/platform/kms/hsm-integration)
- [MPC Installation](https://github.com/luxfi/mpc/blob/main/INSTALLATION.md)

---

## Appendix A: Environment Variables

### MPC Configuration
```bash
# Database
BADGER_PASSWORD="<aes-256-password>"
DB_PATH="/var/mpc/data"

# Backup
BACKUP_ENABLED="true"
BACKUP_PERIOD_SECONDS="300"
BACKUP_DIR="/var/mpc/backups"

# Network
NATS_URL="nats://nats:4222"
CONSUL_ADDRESS="consul:8500"

# MPC
MPC_THRESHOLD="3"
MAX_CONCURRENT_KEYGEN="10"
EVENT_INITIATOR_PUBKEY="<ed25519-public-key>"
```

### KMS Configuration
```bash
# Database
DB_CONNECTION_URI="postgres://user:pass@host:5432/kms"
REDIS_URL="redis://redis:6379"

# Authentication
AUTH_SECRET="<random-secret>"
ENCRYPTION_KEY="<root-key>"

# HSM (optional)
HSM_LIB_PATH="/usr/safenet/lunaclient/libs/64/libCryptoki2.so"
HSM_PIN="<hsm-pin>"
HSM_SLOT="0"
HSM_KEY_LABEL="lux-kms-root-key"

# Features
SITE_URL="https://kms.example.com"
TELEMETRY_ENABLED="false"
```

---

## Appendix B: API Endpoints

### MPC API (Bridge Compatibility)

**Base URL**: `http://localhost:6000`

```bash
# Generate threshold wallet
POST /keygen
{
  "walletID": "uuid",
  "chainType": "ethereum",
  "threshold": 3,
  "totalParties": 5
}

# Sign transaction
POST /sign
{
  "walletID": "uuid",
  "messageHash": "0x...",
  "signers": ["node0", "node1", "node2"]
}

# Get public key
GET /pubkey/{walletID}

# Health check
GET /health
```

### KMS API

**Base URL**: `https://kms.example.com/api/v1`

```bash
# Create secret
POST /secrets
{
  "secretName": "DB_PASSWORD",
  "secretValue": "secretvalue",
  "type": "shared"
}

# Get secret
GET /secrets/{id}

# Update secret
PATCH /secrets/{id}

# Delete secret
DELETE /secrets/{id}

# Issue certificate
POST /pki/certificates
{
  "commonName": "example.com",
  "caId": "ca-uuid",
  "ttl": "30d"
}
```

---

**Document End**

For questions or contributions, contact:
- MPC: https://github.com/luxfi/mpc/issues
- KMS: https://github.com/luxfi/kms/issues
- Threshold: https://github.com/luxfi/threshold/issues
