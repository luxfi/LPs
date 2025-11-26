---
lp: 325
title: Lux KMS Hardware Security Module Integration
description: Unified key management system with multi-provider HSM support for validator security
author: Lux Core Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Standards Track
category: Core
created: 2025-11-22
requires: 320, 321, 322, 323
---

## Abstract

This LP specifies the Lux Key Management System (KMS) architecture with Hardware Security Module (HSM) support for secure validator key storage and cryptographic operations. Lux KMS provides a unified interface supporting 8 HSM providers across enterprise cloud, on-premise, embedded, and open-source platforms, enabling validators to choose security levels matching their deployment requirements and budget.

## Motivation

### The Validator Security Problem

Blockchain validators face critical security requirements:

1. **Private Key Protection**: Validator signing keys must never be exposed
2. **Tamper Resistance**: Physical attacks must be detectable
3. **Compliance**: FIPS 140-2 Level 3 for regulated deployments
4. **High Availability**: 99.99% uptime with key backup/recovery
5. **Cost Efficiency**: Range from $0 (dev/test) to enterprise-grade
6. **Multi-Chain**: Support for BLS12-381, ECDSA secp256k1, Ed25519, ML-DSA (post-quantum)

### Why HSM Support is Critical

Hardware Security Modules provide:

- **Physical Tamper Detection**: Cryptographic key destruction on physical intrusion
- **Key Extraction Prevention**: Keys never leave secure boundary (even for admins)
- **FIPS Certification**: Government-grade security (FIPS 140-2 Level 3)
- **Audit Logging**: Complete operation history for compliance
- **High Throughput**: 100-3,000 signing operations per second
- **Multi-Algorithm**: Classical and post-quantum cryptography

### Use Cases

**Enterprise Production Validators**
- FIPS 140-2 Level 3 compliance required
- SOC 2 Type II audit requirements
- 99.99% uptime SLA
- HSM: AWS CloudHSM, Thales Luna, Fortanix

**Small/Medium Validators**
- Budget-conscious deployments
- FIPS compliance desired but not mandatory
- 99.9% uptime acceptable
- HSM: YubiHSM 2 FIPS ($650), Google Cloud KMS

**Development & Testing**
- Local development without hardware
- CI/CD pipeline integration
- Fast iteration cycles
- HSM: SoftHSM2 (free), Nitrokey ($75-95)

**Edge/IoT Validators**
- Raspberry Pi deployments
- Low power consumption
- Physical security in untrusted locations
- HSM: Zymbit SCM ($125-155)

## Specification

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                 Lux Validator Node                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   P-Chain    │  │   Q-Chain    │  │   X-Chain    │      │
│  │  Validator   │  │  Validator   │  │  Validator   │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │              │
│         └──────────────────┴──────────────────┘              │
│                            │                                 │
│                  ┌─────────▼─────────┐                       │
│                  │   Lux KMS Client  │                       │
│                  │  (Unified API)    │                       │
│                  └─────────┬─────────┘                       │
└────────────────────────────┼─────────────────────────────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
    ┌────▼────┐         ┌───▼────┐         ┌───▼────┐
    │ PKCS#11 │         │ REST   │         │ gRPC   │
    │ HSMs    │         │ APIs   │         │ APIs   │
    └────┬────┘         └───┬────┘         └───┬────┘
         │                  │                   │
    ┌────┴────┬────────┬────┴────┬─────────────┴──────┐
    │         │        │         │                     │
┌───▼───┐ ┌──▼──┐ ┌───▼───┐ ┌───▼─────┐    ┌─────────▼────┐
│ Thales│ │ AWS │ │Fortanix│ │YubiHSM2│    │ Google Cloud │
│ Luna  │ │Cloud│ │  HSM  │ │ FIPS   │    │     KMS      │
│ HSM   │ │ HSM │ │       │ │        │    │              │
└───────┘ └─────┘ └───────┘ └────────┘    └──────────────┘
```

### Supported HSM Providers

#### Enterprise Cloud HSMs

| Provider | Interface | FIPS 140-2 | Cost/Month | Use Case |
|----------|-----------|------------|------------|----------|
| **Thales Luna Cloud** | PKCS#11 | Level 3 | $1,200 | Multi-cloud enterprise |
| **AWS CloudHSM** | PKCS#11 | Level 3 | $1,152 | AWS-native deployments |
| **Google Cloud KMS** | REST/gRPC | Level 3 | $30-3,000 | GCP-native, pay-per-use |
| **Fortanix DSM** | PKCS#11/REST | Level 3 | $1,000 | Multi-cloud portability |

#### Affordable & Open-Source HSMs

| Provider | Interface | FIPS 140-2 | Cost | Use Case |
|----------|-----------|------------|------|----------|
| **YubiHSM 2 FIPS** | PKCS#11 | Level 3 | $650 (one-time) | Small/medium prod |
| **Zymbit SCM** | PKCS#11 | Physical only | $125-155 (one-time) | IoT/Edge (Raspberry Pi) |
| **Nitrokey HSM** | PKCS#11 (OpenSC) | CC EAL 5+ | €69-89 (one-time) | Budget validators |
| **SoftHSM2** | PKCS#11 | - | Free (BSD-2) | Development/testing |

### KMS API Interface

#### Core Operations

```go
package kms

// Client provides unified HSM interface
type Client interface {
    // Signing operations
    Sign(ctx context.Context, keyID string, message []byte) ([]byte, error)
    SignBLS(ctx context.Context, keyID string, message []byte) (*BLSSignature, error)
    SignThreshold(ctx context.Context, keyID string, message []byte, threshold uint32) ([]byte, error)

    // Key management
    GenerateKey(ctx context.Context, algorithm Algorithm) (string, error)
    ImportKey(ctx context.Context, key []byte, algorithm Algorithm) (string, error)
    DeleteKey(ctx context.Context, keyID string) error

    // Key backup and recovery
    ExportWrapped(ctx context.Context, keyID string, wrapKeyID string) ([]byte, error)
    ImportWrapped(ctx context.Context, wrappedKey []byte, wrapKeyID string) (string, error)

    // Health and monitoring
    HealthCheck(ctx context.Context) error
    GetMetrics(ctx context.Context) (*Metrics, error)
}

// Algorithm types supported
type Algorithm int

const (
    AlgorithmBLS12_381 Algorithm = iota
    AlgorithmECDSA_secp256k1
    AlgorithmECDSA_secp256r1
    AlgorithmEd25519
    AlgorithmML_DSA_65  // Post-quantum (FIPS 204)
    AlgorithmRSA_2048
    AlgorithmRSA_4096
)
```

#### Configuration

```yaml
# Lux KMS Configuration
kms:
  provider: aws-cloudhsm  # or: thales-luna, google-cloud-kms, fortanix,
                          #     yubihsm2, zymbit, nitrokey, softhsm2

  # Provider-specific configuration
  aws-cloudhsm:
    cluster_id: cluster-abc123
    region: us-east-1
    pkcs11_lib: /opt/cloudhsm/lib/libcloudhsm_pkcs11.so
    pin: ${HSM_PIN}
    slot: 0

  google-cloud-kms:
    project_id: lux-validator-prod
    location: global
    key_ring: lux-kms-keyring
    credentials: /etc/kms/gcp-service-account.json

  yubihsm2:
    connector_url: http://127.0.0.1:12345
    pkcs11_lib: /usr/lib/pkcs11/yubihsm_pkcs11.so
    auth_key_id: 1
    password: ${YUBIHSM_PASSWORD}

  softhsm2:
    pkcs11_lib: /usr/lib/softhsm/libsofthsm2.so
    token_label: LuxValidator
    pin: ${SOFTHSM_PIN}
    slot: 0

  # High availability configuration
  failover:
    enabled: true
    backup_provider: thales-luna
    health_check_interval: 30s
    failure_threshold: 3
```

### Integration with Lux Consensus

#### P-Chain Validators

```go
// P-Chain validator using HSM for BLS signing
type Validator struct {
    kms    kms.Client
    keyID  string
    nodeID ids.NodeID
}

func (v *Validator) Sign(msg []byte) (*bls.Signature, error) {
    sig, err := v.kms.SignBLS(context.Background(), v.keyID, msg)
    if err != nil {
        return nil, fmt.Errorf("HSM signing failed: %w", err)
    }
    return sig, nil
}
```

#### Q-Chain Threshold Signatures (Ringtail)

Integrates with LP-320 (Ringtail), LP-321 (FROST), LP-322 (CGGMP21):

```go
// Q-Chain validator using HSM for threshold signing
func (v *QuasarValidator) ThresholdSign(
    msg []byte,
    threshold uint32,
) ([]byte, error) {
    // Use HSM-backed threshold signature
    return v.kms.SignThreshold(
        context.Background(),
        v.thresholdKeyID,
        msg,
        threshold,
    )
}
```

### Security Considerations

#### Key Generation

**Enterprise HSMs** (Thales, AWS, Google, Fortanix):
- Keys generated inside HSM boundary
- True hardware random number generator (HRNG)
- Keys never exist in plaintext outside HSM

**Affordable HSMs** (YubiHSM 2, Zymbit, Nitrokey):
- On-device key generation
- Hardware RNG on secure chip
- USB-based but tamper-resistant

**Development HSMs** (SoftHSM2):
- ⚠️ **NOT FOR PRODUCTION**: Keys stored on filesystem
- Uses OpenSSL RNG
- Suitable only for development/testing

#### Tamper Detection

**Physical Tamper Detection**:
- **Thales Luna, AWS CloudHSM, Fortanix**: Mesh detection, automatic key erasure
- **YubiHSM 2, Zymbit, Nitrokey**: Chip-level tamper detection
- **Google Cloud KMS**: Logical isolation (no physical hardware)
- **SoftHSM2**: No physical protection (software only)

**Audit Logging**:
- All HSM operations logged with timestamp and user
- Tamper-evident log chains (YubiHSM 2, enterprise HSMs)
- Integration with Lux monitoring stack

#### Multi-HSM High Availability

```yaml
kms:
  mode: multi-hsm

  primary:
    provider: aws-cloudhsm
    weight: 70  # 70% of operations

  backup:
    provider: thales-luna
    weight: 30  # 30% of operations

  failover:
    enabled: true
    strategy: automatic
    health_check_interval: 30s
    failure_threshold: 3
```

### Performance Benchmarks

| Provider | BLS Sign (ops/sec) | ECDSA Sign (ops/sec) | Latency (p50) |
|----------|-------------------|---------------------|---------------|
| SoftHSM2 | N/A | 5,000+ | <1ms |
| AWS CloudHSM | 800 | 3,000 | 1ms |
| Fortanix | 600 | 2,500 | 2ms |
| Thales Luna | 500 | 2,000 | 2ms |
| YubiHSM 2 | N/A | 100-300 | 5ms |
| Zymbit | 100 | 300 | 5ms |
| Google Cloud KMS | 200 | 500 | 10ms |
| Nitrokey | N/A | 50-100 | 10ms |

**Note**: BLS12-381 support varies by provider. Post-quantum (ML-DSA) supported by enterprise HSMs only.

## Implementation

### Repository Structure

```
lux/
├── kms/                          # Lux KMS implementation
│   ├── client/                   # Unified KMS client
│   │   ├── client.go            # Main client interface
│   │   ├── pkcs11.go            # PKCS#11 provider base
│   │   └── rest.go              # REST API provider base
│   ├── providers/
│   │   ├── aws/                 # AWS CloudHSM
│   │   ├── google/              # Google Cloud KMS
│   │   ├── thales/              # Thales Luna
│   │   ├── fortanix/            # Fortanix DSM
│   │   ├── yubihsm/             # YubiHSM 2
│   │   ├── zymbit/              # Zymbit SCM
│   │   ├── nitrokey/            # Nitrokey HSM (OpenSC)
│   │   └── softhsm/             # SoftHSM2
│   ├── config/                  # Configuration handling
│   ├── metrics/                 # Prometheus metrics
│   └── docs/                    # Documentation
│       └── hsm-providers-comparison.mdx  # Provider comparison
```

### Installation

```bash
# Install Lux KMS
go get github.com/luxfi/kms

# Install PKCS#11 libraries (example: AWS CloudHSM)
sudo yum install cloudhsm-client
sudo /opt/cloudhsm/bin/configure -a <cluster-ip>

# Or for YubiHSM 2
sudo apt-get install yubihsm-shell

# Or for development (SoftHSM2)
sudo apt-get install softhsm2
softhsm2-util --init-token --slot 0 --label "LuxTest"
```

### Migration Between HSMs

Lux KMS supports zero-downtime migration:

```bash
# Export keys from source HSM (wrapped/encrypted)
luxd kms export-key \
  --source-hsm=aws-cloudhsm \
  --key-id=validator-key-1 \
  --wrap-key-id=migration-key \
  --output=exported-key.enc

# Import to destination HSM
luxd kms import-key \
  --dest-hsm=google-cloud-kms \
  --input=exported-key.enc \
  --wrap-key-id=migration-key

# Gradual rollout (blue-green)
luxd kms set-weight google-cloud-kms 10   # 10% traffic
# Monitor for 24 hours
luxd kms set-weight google-cloud-kms 50   # 50% traffic
# Monitor for 24 hours
luxd kms set-weight google-cloud-kms 100  # Full cutover
```

## Cost Analysis

### 3-Year Total Cost of Ownership

| Provider | Year 1 | Year 2 | Year 3 | Total | Savings vs Enterprise |
|----------|--------|--------|--------|-------|----------------------|
| **SoftHSM2** | $0 | $0 | $0 | **$0** | 100% |
| **Nitrokey** | $75-95 | $0 | $0 | **$75-95** | 99.8% |
| **Zymbit** | $125-155 | $0 | $0 | **$125-155** | 99.7% |
| **Google KMS** (10M ops/mo) | $360 | $360 | $360 | **$1,080** | 97.4% |
| **YubiHSM 2** | $650 | $0 | $0 | **$650** | 98.4% |
| **AWS CloudHSM** | $14,016 | $14,016 | $14,016 | **$42,048** | - |
| **Fortanix** | $12,000 | $12,000 | $12,000 | **$36,000** | - |
| **Thales Luna** | $14,400 | $14,400 | $14,400 | **$43,200** | - |

**Key Insight**: Open-source and affordable HSMs offer **97.4-100% cost savings** over 3 years while maintaining strong security for appropriate use cases.

**Cost Calculation Notes**:
- Google Cloud KMS: 10M ops/mo = $30/mo operations + $0.30/mo key storage = $30.30/mo ≈ $360/year
- AWS CloudHSM: $1.60/hour × 730 hours/mo × 12 = $14,016/year

## Rationale

### Design Decisions

**1. Multi-Provider Architecture**: Supporting 8 HSM providers ensures validators can choose solutions matching their security requirements, compliance needs, and budget constraints. No vendor lock-in.

**2. Unified Interface**: A single KMS API across all providers simplifies integration and allows seamless migration between HSM backends without code changes.

**3. Plugin Architecture**: HSM providers are loaded as plugins, enabling community-contributed backends and custom integrations for specialized hardware.

**4. Hardware Abstraction**: The KMS layer abstracts hardware-specific details, allowing the same validator code to run against SoftHSM (development) and enterprise HSMs (production).

### Alternatives Considered

- **Single Provider**: Rejected as it creates vendor lock-in and limits deployment options
- **Direct HSM Integration**: Rejected due to complexity; each HSM vendor has different APIs
- **Software-only**: Rejected for production use; HSMs provide tamper resistance and key isolation
- **Threshold Signatures Only**: Rejected as some use cases require single-key operations

## Backwards Compatibility

This LP introduces new infrastructure without breaking existing validator deployments:

- **Existing Validators**: Can continue using file-based keys; KMS is opt-in
- **Migration Path**: Validators can gradually migrate keys to HSM without downtime
- **API Compatibility**: KMS interface is additive; existing signing APIs remain unchanged
- **Configuration**: New KMS config section in validator config files

## Security Considerations

### Key Isolation

- Private keys never leave HSM boundary in hardware-backed deployments
- Memory isolation prevents key extraction even with root access
- Side-channel resistant operations in compliant HSMs

### Audit and Compliance

- FIPS 140-2 Level 3 certification available with enterprise HSMs
- Key usage audit logs for compliance reporting
- Role-based access control for multi-operator setups

### Backup and Recovery

- Secure key backup with split-secret schemes
- Recovery procedures require multi-party authorization
- Hardware redundancy recommendations in documentation

### Attack Vectors

- Physical tampering detected by HSM zeroization
- Network isolation recommended for HSM interfaces
- Regular firmware updates for security patches

## Test Cases

### Unit Tests

```go
func TestKMSProviderInitialization(t *testing.T) {
    providers := []string{"softhsm", "yubikey", "gcpkms", "awscloudkey"}
    for _, provider := range providers {
        kms, err := kms.NewProvider(provider, testConfig)
        require.NoError(t, err)
        require.NotNil(t, kms)
    }
}

func TestKeyGeneration(t *testing.T) {
    kms := setupTestKMS(t)
    keyID, err := kms.GenerateKey(kms.ECDSA_SECP256K1)
    require.NoError(t, err)
    require.NotEmpty(t, keyID)
}

func TestSignAndVerify(t *testing.T) {
    kms := setupTestKMS(t)
    keyID, _ := kms.GenerateKey(kms.ECDSA_SECP256K1)
    message := []byte("test message")

    signature, err := kms.Sign(keyID, message)
    require.NoError(t, err)

    valid, err := kms.Verify(keyID, message, signature)
    require.NoError(t, err)
    require.True(t, valid)
}

func TestProviderSwitch(t *testing.T) {
    // Generate key on SoftHSM
    soft := setupProvider(t, "softhsm")
    keyID, _ := soft.GenerateKey(kms.ECDSA_SECP256K1)

    // Export and import to YubiKey (test migration)
    exported, _ := soft.ExportKey(keyID, wrappingKey)
    yubi := setupProvider(t, "yubikey")
    newKeyID, err := yubi.ImportKey(exported, wrappingKey)
    require.NoError(t, err)
    require.NotEmpty(t, newKeyID)
}
```

### Integration Tests

1. **Multi-Provider Signing**: Sign same message with keys from different HSMs, verify signatures
2. **Failover Testing**: Simulate HSM failure, verify backup HSM takes over
3. **Concurrent Access**: 100 concurrent signing requests to verify thread safety
4. **Key Rotation**: Generate new key, migrate operations, retire old key

## References

### Documentation
- [Lux KMS Documentation](https://github.com/luxfi/kms/tree/main/docs)
- [HSM Provider Comparison](https://github.com/luxfi/kms/blob/main/docs/documentation/platform/kms/hsm-providers-comparison.md)
- [LP-321: Ringtail Threshold Signature Precompile](lp-321-ringtail-threshold-signature-precompile.md)
- [LP-321: FROST Threshold Signature Precompile](lp-321-frost-threshold-signature-precompile.md)
- [LP-322: CGGMP21 Threshold ECDSA Precompile](lp-322-cggmp21-threshold-ecdsa-precompile.md)
- [LP-323: LSS-MPC Dynamic Resharing Extension](lp-323-lss-mpc-dynamic-resharing-extension.md)

### HSM Vendors
- [Thales Luna Cloud HSM](https://cpl.thalesgroup.com/encryption/hardware-security-modules/cloud-hsms)
- [AWS CloudHSM](https://aws.amazon.com/cloudhsm/)
- [Google Cloud KMS](https://cloud.google.com/kms)
- [Fortanix DSM](https://www.fortanix.com/products/data-security-manager)
- [YubiHSM 2](https://www.yubico.com/product/yubihsm-2-fips/)
- [Zymbit SCM](https://www.zymbit.com/)
- [Nitrokey HSM](https://www.nitrokey.com/)
- [SoftHSM2](https://github.com/softhsm/SoftHSMv2)

### Standards
- [FIPS 140-2](https://csrc.nist.gov/publications/detail/fips/140/2/final) - Security Requirements for Cryptographic Modules
- [PKCS#11](http://docs.oasis-open.org/pkcs11/pkcs11-base/v2.40/pkcs11-base-v2.40.html) - Cryptographic Token Interface Standard
- [NIST Post-Quantum Cryptography](https://csrc.nist.gov/projects/post-quantum-cryptography)

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
