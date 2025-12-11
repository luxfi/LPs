---
lp: 6341
title: Decentralized Secrets Management Platform
description: Application-layer secrets management platform built on K-Chain providing Infisical-like functionality for projects, environments, version control, and DevOps integration
author: Lux Protocol Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Standards Track
category: Interface
created: 2025-12-11
requires: 330, 336
activation:
  flag: lp341-secrets-platform
  hfName: "Vault"
  activationHeight: "0"
tags: [security, dev-tools]
---

> **See also**: [LP-330](./lp-0330-t-chain-thresholdvm-specification.md), [LP-336](./lp-0336-k-chain-keymanagementvm-specification.md), [LP-INDEX](./LP-INDEX.md)

## Conformance

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119) and [RFC 8174](https://www.rfc-editor.org/rfc/rfc8174).

### Conformance Requirements

An implementation is conformant with this specification if it:

1. **MUST** implement all REQUIRED secret operations (Create, Read, Update, Delete)
2. **MUST** encrypt all secrets using ML-KEM as specified in LP-336
3. **MUST** maintain an immutable audit log for all secret access
4. **MUST** enforce RBAC policies before granting access
5. **MUST** support threshold decryption via T-Chain for protected environments
6. **SHOULD** implement secret versioning with rollback capability
7. **SHOULD** support environment inheritance hierarchies
8. **MAY** implement optional rotation providers for automatic secret rotation
9. **MUST NOT** store or transmit plaintext secrets outside client boundaries
10. **MUST NOT** allow secret access without valid authentication

## Abstract

This LP specifies a decentralized secrets management platform built as an application layer on K-Chain (KeyManagementVM). The platform provides enterprise-grade secrets management with:

1. **Project/Workspace Organization** - Hierarchical organization of secrets by project and workspace
2. **Environment Management** - Isolated environments (development, staging, production) with inheritance
3. **Version Control** - Git-like versioning of secrets with rollback capabilities
4. **Access Control** - RBAC with fine-grained permissions at organization, project, and environment levels
5. **DevOps Integration** - Native SDKs, CLI tools, and CI/CD integrations

Unlike centralized solutions (Infisical, HashiCorp Vault, AWS Secrets Manager), this platform operates entirely on-chain with threshold decryption via T-Chain, eliminating single points of failure while providing enterprise compliance features.

## Activation

| Parameter          | Value                    |
|--------------------|--------------------------|
| Flag string        | `lp341-secrets-platform` |
| Default in code    | **false** until block 0  |
| Deployment branch  | `v1.0.0-lp341`           |
| Roll-out criteria  | Genesis activation       |
| Back-off plan      | Disable via config flag  |

## Motivation

### Problem Statement

Current secrets management solutions face fundamental challenges:

1. **Centralization Risk**: Cloud-based secret managers (AWS KMS, HashiCorp Vault Cloud) create single points of failure and vendor lock-in
2. **Trust Requirements**: Organizations must trust third-party providers with their most sensitive data
3. **Compliance Complexity**: Multi-region compliance requires complex architectures across providers
4. **No Native Blockchain Support**: Existing solutions lack first-class blockchain integration
5. **Audit Opacity**: Audit trails are controlled by providers, not verifiable by customers
6. **Recovery Dependency**: Key recovery depends on provider availability and policies

### Solution: Decentralized Secrets Platform

This platform addresses these challenges:

1. **Zero-Trust Architecture**: Secrets encrypted client-side, only decryptable by authorized parties
2. **Threshold Decryption**: High-value secrets require multi-party approval via T-Chain
3. **Immutable Audit**: On-chain audit trail cryptographically verifiable
4. **Global Availability**: Decentralized infrastructure with no single point of failure
5. **Native Web3**: First-class support for dApp secrets, validator keys, and bridge credentials
6. **Self-Sovereign**: Organizations control their own encryption keys

### Use Cases

- **dApp Configuration**: API keys, database credentials, third-party service tokens
- **Validator Operations**: Signing keys, node credentials, monitoring tokens
- **Bridge Infrastructure**: Custodial keys, relay credentials, oracle API keys
- **Enterprise Deployment**: Multi-environment secrets for hybrid cloud/blockchain apps
- **CI/CD Pipelines**: Build-time secrets injection without hardcoding
- **Compliance**: SOC2, HIPAA, PCI-DSS compliant secrets management

## Specification

### Architecture Overview

```
+-------------------------------------------------------------------------+
|                    Decentralized Secrets Platform                        |
+-------------------------------------------------------------------------+
|                                                                          |
|  +--------------------+    +--------------------+    +-----------------+ |
|  |   SDK Layer        |    |   Service Layer    |    |  Storage Layer  | |
|  |                    |    |                    |    |                 | |
|  | - TypeScript SDK   |    | - Secret Service   |    | - K-Chain       | |
|  | - Go SDK           |--->| - Project Service  |--->| - IPFS (large)  | |
|  | - Python SDK       |    | - Env Service      |    | - Version Store | |
|  | - CLI Tool         |    | - Access Service   |    |                 | |
|  +--------------------+    +--------------------+    +-----------------+ |
|           |                         |                        |           |
|           v                         v                        v           |
|  +--------------------+    +--------------------+    +-----------------+ |
|  |   Integration      |    |   Security Layer   |    |  T-Chain        | |
|  |                    |    |                    |    |                 | |
|  | - K8s Operator     |    | - ML-KEM Encrypt   |    | - Threshold     | |
|  | - Docker Provider  |    | - RBAC Engine      |    |   Decryption    | |
|  | - GitHub Actions   |    | - Audit Logger     |    | - Multi-Party   | |
|  | - Terraform        |    | - Policy Engine    |    |   Approval      | |
|  +--------------------+    +--------------------+    +-----------------+ |
|                                                                          |
+-------------------------------------------------------------------------+
```

### Data Model

#### Organization

```go
import (
    "github.com/luxfi/ids"
)

// Organization represents the top-level entity for secrets management
type Organization struct {
    OrgID           ids.ID                // Unique 32-byte identifier
    Name            string                // Human-readable name
    Slug            string                // URL-safe identifier

    // Ownership
    Owner           ids.ShortID           // Primary owner address
    Admins          []ids.ShortID         // Organization administrators

    // Configuration
    Settings        *OrgSettings          // Organization-wide settings
    Plan            OrgPlan               // Subscription tier

    // Metadata
    CreatedAt       uint64                // Block height
    UpdatedAt       uint64

    // Statistics
    ProjectCount    uint32
    MemberCount     uint32
    SecretCount     uint64
}

// OrgSettings defines organization-level configuration
type OrgSettings struct {
    // Security
    RequireMFA              bool          // Require multi-factor auth
    MinPasswordStrength     uint8         // Minimum password complexity
    SessionTimeout          uint64        // Session expiration (seconds)
    IPAllowlist             []string      // Allowed IP ranges (CIDR)

    // Encryption
    DefaultMLKEMLevel       uint8         // Default ML-KEM security level (1,3,5)
    RequireThreshold        bool          // Require threshold encryption for all secrets
    DefaultThreshold        uint32        // Default t-of-n threshold

    // Compliance
    AuditRetention          uint64        // Audit log retention (blocks)
    RequireApprovalForProd  bool          // Production changes require approval
    AllowedRegions          []string      // Geographic restrictions

    // Integration
    WebhookURL              string        // Notification webhook
    SlackIntegration        *SlackConfig
    PagerDutyIntegration    *PagerDutyConfig
}

// OrgPlan defines subscription tiers
type OrgPlan uint8

const (
    PlanFree       OrgPlan = 0x00  // Free tier: 5 projects, 100 secrets
    PlanTeam       OrgPlan = 0x01  // Team: 25 projects, 1000 secrets
    PlanBusiness   OrgPlan = 0x02  // Business: 100 projects, 10000 secrets
    PlanEnterprise OrgPlan = 0x03  // Enterprise: unlimited
)
```

#### Project

```go
// Project represents a collection of related secrets (e.g., an application)
type Project struct {
    ProjectID       ids.ID                // Unique identifier
    OrgID           ids.ID                // Parent organization
    Name            string                // Project name
    Slug            string                // URL-safe identifier
    Description     string                // Project description

    // Hierarchy
    ParentProjectID ids.ID                // Optional parent project for nesting

    // Configuration
    Settings        *ProjectSettings

    // Encryption
    ProjectKEK      ids.ID                // Project-level Key Encryption Key (K-Chain ref)

    // Access
    DefaultRole     ProjectRole           // Default role for new members

    // Metadata
    CreatedAt       uint64
    UpdatedAt       uint64
    CreatedBy       ids.ShortID

    // Statistics
    EnvironmentCount uint32
    SecretCount      uint64
    MemberCount      uint32

    // Tags
    Tags            []string              // User-defined tags
}

// ProjectSettings defines project-level configuration
type ProjectSettings struct {
    // Environments
    Environments    []string              // Allowed environments (dev, staging, prod)
    DefaultEnv      string                // Default environment

    // Secret Behavior
    AutoRotate      bool                  // Enable automatic rotation
    RotationPeriod  uint64                // Rotation interval (blocks)
    VersionRetention uint32               // Number of versions to retain

    // Access
    RequireReviewForProd bool             // Require approval for production changes
    AllowBranchEnvs      bool             // Allow dynamic branch environments

    // Integration
    GitRepo         string                // Linked git repository
    WebhookEvents   []WebhookEvent        // Events to trigger webhooks
}

// ProjectRole defines permission levels
type ProjectRole uint8

const (
    RoleViewer    ProjectRole = 0x00  // Read-only access
    RoleDeveloper ProjectRole = 0x01  // Read + write dev/staging
    RoleMaintainer ProjectRole = 0x02 // Read + write all environments
    RoleAdmin     ProjectRole = 0x03  // Full control including settings
    RoleOwner     ProjectRole = 0x04  // Transfer ownership, delete project
)
```

#### Environment

```go
// Environment represents an isolated secrets scope (dev, staging, prod)
type Environment struct {
    EnvID           ids.ID                // Unique identifier
    ProjectID       ids.ID                // Parent project
    Name            string                // Environment name (dev, staging, production)
    Slug            string                // URL-safe identifier

    // Hierarchy
    ParentEnvID     ids.ID                // Parent environment for inheritance
    InheritSecrets  bool                  // Inherit parent secrets

    // Configuration
    Settings        *EnvSettings

    // Encryption
    EnvKEK          ids.ID                // Environment-specific KEK (K-Chain ref)
    ThresholdKeyID  ids.ID                // T-Chain key for threshold decryption
    Threshold       uint32                // Required signers (0 = no threshold)

    // Access Control
    AccessPolicy    ids.ID                // K-Chain access policy reference

    // Metadata
    CreatedAt       uint64
    UpdatedAt       uint64
    CreatedBy       ids.ShortID

    // Statistics
    SecretCount     uint64

    // Protection
    Protected       bool                  // Prevent accidental deletion
    Locked          bool                  // Prevent all modifications
    LockReason      string                // Reason for lock
}

// EnvSettings defines environment-level configuration
type EnvSettings struct {
    // Access
    RequireApproval     bool              // Changes require approval
    Approvers           []ids.ShortID     // Who can approve changes
    ApprovalCount       uint32            // Required approvals
    ApprovalTimeout     uint64            // Approval expiration (blocks)

    // Automation
    AutoMerge           bool              // Auto-merge approved changes
    CIIntegration       *CIConfig         // CI/CD configuration

    // Notifications
    NotifyOnChange      bool              // Send notifications on changes
    NotifyRecipients    []string          // Notification targets

    // Branch Linking
    LinkedBranches      []string          // Git branches (e.g., "main", "release/*")

    // Security
    IPRestrictions      []string          // IP allowlist for this env
    TimeRestrictions    *TimeWindow       // Access time windows
}

// TimeWindow defines allowed access times
type TimeWindow struct {
    DaysOfWeek  []int                     // 0=Sunday, 6=Saturday
    StartHourUTC int                      // 0-23
    EndHourUTC   int                      // 0-23
    Timezone     string                   // For display purposes
}
```

#### Secret

```go
// Secret represents an encrypted configuration value
type Secret struct {
    SecretID        ids.ID                // Unique identifier
    EnvID           ids.ID                // Parent environment
    ProjectID       ids.ID                // Parent project (denormalized)

    // Identity
    Key             string                // Secret key name (e.g., "DATABASE_URL")
    Path            string                // Optional path for grouping (e.g., "/database/")

    // Value (encrypted on K-Chain)
    KChainSecretID  ids.ID                // Reference to K-Chain EncryptedSecret
    ValueHash       [32]byte              // SHA-256 of plaintext for change detection

    // Metadata
    Type            SecretType            // Classification
    Description     string                // Human-readable description
    Tags            []string              // User-defined tags

    // Versioning
    Version         uint32                // Current version number
    VersionHistory  []SecretVersionRef    // Version references

    // Lifecycle
    CreatedAt       uint64
    UpdatedAt       uint64
    CreatedBy       ids.ShortID
    UpdatedBy       ids.ShortID
    ExpiresAt       uint64                // Optional expiration (0 = never)

    // Rotation
    AutoRotate      bool                  // Enable automatic rotation
    RotationPeriod  uint64                // Rotation interval (blocks)
    LastRotated     uint64                // Last rotation block
    RotationHandler RotationConfig        // How to rotate

    // Access
    OverridePolicy  ids.ID                // Secret-specific access policy (optional)

    // Inheritance
    InheritedFrom   ids.ID                // Source environment if inherited
    OverridesParent bool                  // True if this overrides inherited value

    // Linking
    LinkedSecrets   []ids.ID              // Related secrets (e.g., user + password)
}

// SecretType categorizes secrets for policy and rotation purposes
type SecretType uint8

const (
    TypeGeneric        SecretType = 0x00  // Generic secret
    TypeDatabaseCred   SecretType = 0x01  // Database credentials
    TypeAPIKey         SecretType = 0x02  // API key
    TypeOAuthToken     SecretType = 0x03  // OAuth tokens
    TypeSSHKey         SecretType = 0x04  // SSH private key
    TypeTLSCert        SecretType = 0x05  // TLS certificate + key
    TypeSigningKey     SecretType = 0x06  // Cryptographic signing key
    TypeWebhookSecret  SecretType = 0x07  // Webhook signing secret
    TypeEncryptionKey  SecretType = 0x08  // Symmetric encryption key
    TypeServiceAccount SecretType = 0x09  // Service account credentials
    TypeJWTSecret      SecretType = 0x0A  // JWT signing secret
)

// RotationConfig defines how secrets are rotated
type RotationConfig struct {
    Strategy        RotationStrategy      // Rotation strategy
    ProviderType    string                // e.g., "aws-rds", "github-token"
    ProviderConfig  map[string]string     // Provider-specific config
    NotifyOnRotate  bool                  // Send notification after rotation
}

type RotationStrategy uint8

const (
    StrategyManual    RotationStrategy = 0x00  // Manual rotation only
    StrategyAutomatic RotationStrategy = 0x01  // Automatic on schedule
    StrategyOnDemand  RotationStrategy = 0x02  // Triggered via API
    StrategyExternal  RotationStrategy = 0x03  // External system rotates
)
```

#### SecretVersion

```go
// SecretVersion represents a historical version of a secret
type SecretVersion struct {
    VersionID       ids.ID                // Unique version identifier
    SecretID        ids.ID                // Parent secret
    Version         uint32                // Version number (1-based)

    // Encrypted Value
    KChainSecretID  ids.ID                // K-Chain encrypted secret reference
    ValueHash       [32]byte              // SHA-256 of plaintext

    // Metadata
    CreatedAt       uint64                // Block height
    CreatedBy       ids.ShortID           // Who created this version
    Comment         string                // Change description

    // Rollback Info
    RolledBackFrom  uint32                // Previous version if rollback
    RolledBackTo    uint32                // Target version if rolled back

    // Status
    Status          VersionStatus

    // Diff
    ChangeType      ChangeType            // What changed
}

type VersionStatus uint8

const (
    StatusActive   VersionStatus = 0x00   // Current version
    StatusArchived VersionStatus = 0x01   // Previous version
    StatusDeleted  VersionStatus = 0x02   // Soft deleted
    StatusPending  VersionStatus = 0x03   // Pending approval
)

type ChangeType uint8

const (
    ChangeCreated  ChangeType = 0x00      // New secret
    ChangeUpdated  ChangeType = 0x01      // Value changed
    ChangeRolled   ChangeType = 0x02      // Rolled back
    ChangeRotated  ChangeType = 0x03      // Auto-rotated
    ChangeMigrated ChangeType = 0x04      // Migrated from another system
)

// SecretVersionRef is a lightweight reference to a version
type SecretVersionRef struct {
    VersionID   ids.ID
    Version     uint32
    CreatedAt   uint64
    CreatedBy   ids.ShortID
    ValueHash   [32]byte                  // For quick comparison
}
```

#### AccessPolicy

```go
// AccessPolicy defines who can access secrets and how
type AccessPolicy struct {
    PolicyID        ids.ID                // Unique identifier
    Name            string                // Policy name
    Description     string

    // Scope
    OrgID           ids.ID                // Organization scope
    ProjectID       ids.ID                // Project scope (optional, zero = org-wide)
    EnvID           ids.ID                // Environment scope (optional)

    // Role Assignments
    Assignments     []RoleAssignment

    // Conditions
    Conditions      []AccessCondition

    // Time Constraints
    ValidFrom       uint64                // Policy start time (block height)
    ValidUntil      uint64                // Policy end time (0 = forever)

    // Multi-Party
    RequireApproval bool                  // Require approval for access
    ApprovalConfig  *ApprovalConfig

    // Metadata
    CreatedAt       uint64
    UpdatedAt       uint64
    CreatedBy       ids.ShortID

    // Status
    Active          bool
}

// RoleAssignment binds a principal to a role
type RoleAssignment struct {
    PrincipalType   PrincipalType         // User, Group, ServiceAccount
    PrincipalID     ids.ID                // Principal identifier
    Role            ProjectRole           // Assigned role

    // Scope refinement
    Environments    []string              // Limit to specific environments
    SecretPaths     []string              // Limit to specific paths (glob patterns)

    // Conditions
    Conditions      []AccessCondition

    // Expiration
    ExpiresAt       uint64                // Assignment expiration (0 = never)
}

type PrincipalType uint8

const (
    PrincipalUser           PrincipalType = 0x00
    PrincipalGroup          PrincipalType = 0x01
    PrincipalServiceAccount PrincipalType = 0x02
    PrincipalMachine        PrincipalType = 0x03  // Machine identity (K8s pod, etc.)
)

// AccessCondition defines contextual access requirements
type AccessCondition struct {
    Type            ConditionType
    Operator        ConditionOperator
    Value           string
}

type ConditionType uint8

const (
    ConditionIP          ConditionType = 0x00  // Source IP
    ConditionTime        ConditionType = 0x01  // Time of day
    ConditionGeo         ConditionType = 0x02  // Geographic location
    ConditionMFA         ConditionType = 0x03  // MFA required
    ConditionDevice      ConditionType = 0x04  // Device trust
    ConditionNetwork     ConditionType = 0x05  // Network (VPN, etc.)
    ConditionAttribute   ConditionType = 0x06  // Custom attribute
)

type ConditionOperator uint8

const (
    OpEquals    ConditionOperator = 0x00
    OpNotEquals ConditionOperator = 0x01
    OpIn        ConditionOperator = 0x02
    OpNotIn     ConditionOperator = 0x03
    OpMatches   ConditionOperator = 0x04  // Regex
    OpContains  ConditionOperator = 0x05
)

// ApprovalConfig defines multi-party approval requirements
type ApprovalConfig struct {
    RequiredCount   uint32                // Number of approvals needed
    Approvers       []ids.ShortID         // Allowed approvers
    Timeout         uint64                // Approval timeout (blocks)
    NotifyOnRequest bool                  // Notify approvers
    AutoReject      bool                  // Auto-reject on timeout
}
```

#### AuditLog

```go
// AuditLog represents an immutable audit entry
type AuditLog struct {
    LogID           ids.ID                // Unique identifier

    // Event
    EventType       AuditEventType        // Type of event
    EventTime       uint64                // Block height
    EventTimestamp  int64                 // Unix timestamp

    // Actor
    ActorType       PrincipalType
    ActorID         ids.ID
    ActorAddress    ids.ShortID           // Blockchain address
    ActorName       string                // Human-readable (if available)

    // Resource
    ResourceType    ResourceType
    ResourceID      ids.ID
    ResourcePath    string                // e.g., "org/project/env/secret"

    // Context
    Action          string                // e.g., "read", "update", "delete"
    OldValue        [32]byte              // Hash of old value (for changes)
    NewValue        [32]byte              // Hash of new value

    // Request Context
    SourceIP        string
    UserAgent       string
    RequestID       ids.ID

    // Result
    Success         bool
    ErrorCode       string                // Error code if failed
    ErrorMessage    string

    // Additional Data
    Metadata        map[string]string     // Event-specific metadata

    // Chain Anchoring
    BlockHash       ids.ID                // K-Chain block hash
    TxHash          ids.ID                // Transaction hash
}

type AuditEventType uint8

const (
    EventSecretRead       AuditEventType = 0x00
    EventSecretCreate     AuditEventType = 0x01
    EventSecretUpdate     AuditEventType = 0x02
    EventSecretDelete     AuditEventType = 0x03
    EventSecretRotate     AuditEventType = 0x04
    EventSecretRollback   AuditEventType = 0x05
    EventAccessGrant      AuditEventType = 0x10
    EventAccessRevoke     AuditEventType = 0x11
    EventAccessDenied     AuditEventType = 0x12
    EventApprovalRequest  AuditEventType = 0x20
    EventApprovalGrant    AuditEventType = 0x21
    EventApprovalDeny     AuditEventType = 0x22
    EventProjectCreate    AuditEventType = 0x30
    EventProjectUpdate    AuditEventType = 0x31
    EventProjectDelete    AuditEventType = 0x32
    EventEnvCreate        AuditEventType = 0x40
    EventEnvUpdate        AuditEventType = 0x41
    EventEnvDelete        AuditEventType = 0x42
    EventMemberAdd        AuditEventType = 0x50
    EventMemberRemove     AuditEventType = 0x51
    EventMemberRoleChange AuditEventType = 0x52
)

type ResourceType uint8

const (
    ResourceOrg         ResourceType = 0x00
    ResourceProject     ResourceType = 0x01
    ResourceEnvironment ResourceType = 0x02
    ResourceSecret      ResourceType = 0x03
    ResourcePolicy      ResourceType = 0x04
    ResourceMember      ResourceType = 0x05
    ResourceServiceAcct ResourceType = 0x06
)
```

### Secret Operations

#### CRUD Operations

```go
// SecretService handles all secret operations
type SecretService struct {
    kchain    *kchain.Client            // K-Chain RPC client
    tchain    *tchain.Client            // T-Chain RPC client (for threshold)
    state     *PlatformState            // Platform state
    audit     *AuditLogger
}

// CreateSecret creates a new secret
func (s *SecretService) CreateSecret(ctx context.Context, req *CreateSecretRequest) (*Secret, error) {
    // 1. Validate request
    if err := req.Validate(); err != nil {
        return nil, fmt.Errorf("invalid request: %w", err)
    }

    // 2. Check authorization
    if err := s.checkAccess(ctx, req.EnvID, ActionCreate); err != nil {
        s.audit.LogAccessDenied(ctx, req.EnvID, ActionCreate)
        return nil, err
    }

    // 3. Get environment's encryption key
    env := s.state.Environments[req.EnvID]
    encKey := env.EnvKEK

    // 4. Encrypt secret value via K-Chain
    kchainSecret, err := s.kchain.StoreSecret(ctx, &kchain.StoreSecretRequest{
        EncryptionKeyID: encKey,
        Plaintext:       req.Value,
        SecretType:      mapSecretType(req.Type),
        Labels: map[string]string{
            "project": req.ProjectID.String(),
            "env":     req.EnvID.String(),
            "key":     req.Key,
        },
    })
    if err != nil {
        return nil, fmt.Errorf("K-Chain encryption failed: %w", err)
    }

    // 5. Create secret record
    secret := &Secret{
        SecretID:       ids.GenerateID(),
        EnvID:          req.EnvID,
        ProjectID:      env.ProjectID,
        Key:            req.Key,
        Path:           req.Path,
        KChainSecretID: kchainSecret.SecretID,
        ValueHash:      sha256.Sum256(req.Value),
        Type:           req.Type,
        Description:    req.Description,
        Tags:           req.Tags,
        Version:        1,
        CreatedAt:      s.currentBlock(),
        UpdatedAt:      s.currentBlock(),
        CreatedBy:      s.currentUser(ctx),
        UpdatedBy:      s.currentUser(ctx),
    }

    // 6. Create initial version
    version := &SecretVersion{
        VersionID:      ids.GenerateID(),
        SecretID:       secret.SecretID,
        Version:        1,
        KChainSecretID: kchainSecret.SecretID,
        ValueHash:      secret.ValueHash,
        CreatedAt:      secret.CreatedAt,
        CreatedBy:      secret.CreatedBy,
        Comment:        "Initial creation",
        Status:         StatusActive,
        ChangeType:     ChangeCreated,
    }

    secret.VersionHistory = []SecretVersionRef{{
        VersionID: version.VersionID,
        Version:   1,
        CreatedAt: version.CreatedAt,
        CreatedBy: version.CreatedBy,
        ValueHash: version.ValueHash,
    }}

    // 7. Store in platform state
    s.state.Secrets[secret.SecretID] = secret
    s.state.SecretVersions[version.VersionID] = version

    // 8. Audit log
    s.audit.Log(ctx, &AuditLog{
        EventType:    EventSecretCreate,
        ResourceType: ResourceSecret,
        ResourceID:   secret.SecretID,
        ResourcePath: fmt.Sprintf("%s/%s/%s", env.ProjectID, env.Slug, req.Key),
        Action:       "create",
        NewValue:     secret.ValueHash,
        Success:      true,
    })

    return secret, nil
}

// GetSecret retrieves and decrypts a secret
func (s *SecretService) GetSecret(ctx context.Context, req *GetSecretRequest) ([]byte, error) {
    // 1. Find secret
    secret := s.findSecret(req.ProjectID, req.EnvID, req.Key)
    if secret == nil {
        // Check inheritance
        secret = s.findInheritedSecret(req.ProjectID, req.EnvID, req.Key)
        if secret == nil {
            return nil, ErrSecretNotFound
        }
    }

    // 2. Check authorization
    if err := s.checkAccess(ctx, secret.EnvID, ActionRead); err != nil {
        s.audit.LogAccessDenied(ctx, secret.SecretID, ActionRead)
        return nil, err
    }

    // 3. Check if threshold decryption required
    env := s.state.Environments[secret.EnvID]
    if env.Threshold > 0 {
        return s.thresholdDecrypt(ctx, secret, env)
    }

    // 4. Direct decryption via K-Chain
    plaintext, err := s.kchain.RetrieveSecret(ctx, &kchain.RetrieveSecretRequest{
        SecretID: secret.KChainSecretID,
    })
    if err != nil {
        return nil, fmt.Errorf("K-Chain decryption failed: %w", err)
    }

    // 5. Audit log
    s.audit.Log(ctx, &AuditLog{
        EventType:    EventSecretRead,
        ResourceType: ResourceSecret,
        ResourceID:   secret.SecretID,
        Action:       "read",
        Success:      true,
    })

    return plaintext, nil
}

// UpdateSecret updates a secret value
func (s *SecretService) UpdateSecret(ctx context.Context, req *UpdateSecretRequest) (*Secret, error) {
    // 1. Find existing secret
    secret := s.state.Secrets[req.SecretID]
    if secret == nil {
        return nil, ErrSecretNotFound
    }

    // 2. Check authorization
    if err := s.checkAccess(ctx, secret.EnvID, ActionUpdate); err != nil {
        return nil, err
    }

    // 3. Check if approval required
    env := s.state.Environments[secret.EnvID]
    if env.Settings.RequireApproval {
        return s.submitForApproval(ctx, secret, req)
    }

    // 4. Encrypt new value via K-Chain
    kchainSecret, err := s.kchain.StoreSecret(ctx, &kchain.StoreSecretRequest{
        EncryptionKeyID: env.EnvKEK,
        Plaintext:       req.Value,
    })
    if err != nil {
        return nil, fmt.Errorf("K-Chain encryption failed: %w", err)
    }

    // 5. Create new version
    newVersion := secret.Version + 1
    version := &SecretVersion{
        VersionID:      ids.GenerateID(),
        SecretID:       secret.SecretID,
        Version:        newVersion,
        KChainSecretID: kchainSecret.SecretID,
        ValueHash:      sha256.Sum256(req.Value),
        CreatedAt:      s.currentBlock(),
        CreatedBy:      s.currentUser(ctx),
        Comment:        req.Comment,
        Status:         StatusActive,
        ChangeType:     ChangeUpdated,
    }

    // 6. Archive old version
    oldVersion := s.state.SecretVersions[secret.VersionHistory[len(secret.VersionHistory)-1].VersionID]
    oldVersion.Status = StatusArchived

    // 7. Update secret
    oldHash := secret.ValueHash
    secret.KChainSecretID = kchainSecret.SecretID
    secret.ValueHash = version.ValueHash
    secret.Version = newVersion
    secret.UpdatedAt = s.currentBlock()
    secret.UpdatedBy = s.currentUser(ctx)
    secret.VersionHistory = append(secret.VersionHistory, SecretVersionRef{
        VersionID: version.VersionID,
        Version:   newVersion,
        CreatedAt: version.CreatedAt,
        CreatedBy: version.CreatedBy,
        ValueHash: version.ValueHash,
    })

    s.state.SecretVersions[version.VersionID] = version

    // 8. Audit log
    s.audit.Log(ctx, &AuditLog{
        EventType:    EventSecretUpdate,
        ResourceType: ResourceSecret,
        ResourceID:   secret.SecretID,
        Action:       "update",
        OldValue:     oldHash,
        NewValue:     version.ValueHash,
        Success:      true,
        Metadata: map[string]string{
            "version": fmt.Sprintf("%d", newVersion),
            "comment": req.Comment,
        },
    })

    return secret, nil
}

// DeleteSecret soft-deletes a secret
func (s *SecretService) DeleteSecret(ctx context.Context, req *DeleteSecretRequest) error {
    secret := s.state.Secrets[req.SecretID]
    if secret == nil {
        return ErrSecretNotFound
    }

    // Check authorization
    if err := s.checkAccess(ctx, secret.EnvID, ActionDelete); err != nil {
        return err
    }

    // Mark as deleted (soft delete)
    secret.DeletedAt = s.currentBlock()
    secret.DeletedBy = s.currentUser(ctx)

    // Audit
    s.audit.Log(ctx, &AuditLog{
        EventType:    EventSecretDelete,
        ResourceType: ResourceSecret,
        ResourceID:   secret.SecretID,
        Action:       "delete",
        Success:      true,
    })

    return nil
}
```

#### Import/Export Operations

```go
// ImportExportService handles bulk secret operations
type ImportExportService struct {
    secretService *SecretService
    kchain        *kchain.Client
}

// ExportFormat defines export file formats
type ExportFormat string

const (
    FormatJSON    ExportFormat = "json"
    FormatYAML    ExportFormat = "yaml"
    FormatDotEnv  ExportFormat = "dotenv"
    FormatEnvJSON ExportFormat = "env-json"  // For Infisical compatibility
)

// ExportSecrets exports secrets in specified format (encrypted)
func (s *ImportExportService) ExportSecrets(ctx context.Context, req *ExportRequest) (*ExportResult, error) {
    // 1. Get all secrets for environment
    secrets := s.secretService.ListSecrets(ctx, req.ProjectID, req.EnvID)

    // 2. Generate export encryption key
    exportKey, err := s.kchain.GenerateKey(ctx, &kchain.KeyGenRequest{
        KeyID:     fmt.Sprintf("export-%d", time.Now().Unix()),
        Algorithm: "ML-KEM-768",
        Purpose:   "Secret export encryption",
        ExpiresAt: s.currentBlock() + 7200, // 24 hours
    })
    if err != nil {
        return nil, fmt.Errorf("export key generation failed: %w", err)
    }

    // 3. Decrypt and re-encrypt for export
    exportData := &ExportData{
        Version:     "1.0",
        ExportedAt:  time.Now().UTC(),
        ProjectID:   req.ProjectID.String(),
        Environment: req.EnvID.String(),
        Secrets:     make([]ExportedSecret, 0, len(secrets)),
    }

    for _, secret := range secrets {
        // Decrypt current value
        plaintext, err := s.secretService.GetSecret(ctx, &GetSecretRequest{
            SecretID: secret.SecretID,
        })
        if err != nil {
            continue // Skip secrets user can't access
        }

        exportData.Secrets = append(exportData.Secrets, ExportedSecret{
            Key:         secret.Key,
            Path:        secret.Path,
            Value:       plaintext,
            Type:        secret.Type.String(),
            Description: secret.Description,
            Tags:        secret.Tags,
        })
    }

    // 4. Serialize and encrypt
    var serialized []byte
    switch req.Format {
    case FormatJSON:
        serialized, _ = json.Marshal(exportData)
    case FormatYAML:
        serialized, _ = yaml.Marshal(exportData)
    case FormatDotEnv:
        serialized = serializeDotEnv(exportData)
    }

    // 5. Encrypt export with ML-KEM
    encrypted, err := s.kchain.Encrypt(ctx, &kchain.EncryptRequest{
        EncryptionKeyID: exportKey.KeyID,
        Plaintext:       serialized,
    })
    if err != nil {
        return nil, fmt.Errorf("export encryption failed: %w", err)
    }

    return &ExportResult{
        EncryptedData:   encrypted.Ciphertext,
        ExportKeyID:     exportKey.KeyID,
        ExportPublicKey: exportKey.PublicKey,
        Format:          req.Format,
        SecretCount:     len(exportData.Secrets),
        ExportedAt:      exportData.ExportedAt,
    }, nil
}

// ImportSecrets imports secrets from encrypted export
func (s *ImportExportService) ImportSecrets(ctx context.Context, req *ImportRequest) (*ImportResult, error) {
    // 1. Decrypt import data
    plaintext, err := s.kchain.Decrypt(ctx, &kchain.DecryptRequest{
        EncryptionKeyID: req.ImportKeyID,
        Ciphertext:      req.EncryptedData,
    })
    if err != nil {
        return nil, fmt.Errorf("import decryption failed: %w", err)
    }

    // 2. Deserialize
    var importData ExportData
    switch req.Format {
    case FormatJSON:
        json.Unmarshal(plaintext, &importData)
    case FormatYAML:
        yaml.Unmarshal(plaintext, &importData)
    case FormatDotEnv:
        importData = parseDotEnv(plaintext)
    }

    // 3. Import secrets
    result := &ImportResult{
        Created:  0,
        Updated:  0,
        Skipped:  0,
        Errors:   make([]ImportError, 0),
    }

    for _, secret := range importData.Secrets {
        // Check if secret exists
        existing := s.secretService.findSecret(req.ProjectID, req.EnvID, secret.Key)

        if existing != nil {
            switch req.ConflictStrategy {
            case ConflictSkip:
                result.Skipped++
                continue
            case ConflictOverwrite:
                _, err := s.secretService.UpdateSecret(ctx, &UpdateSecretRequest{
                    SecretID: existing.SecretID,
                    Value:    secret.Value,
                    Comment:  "Imported from export",
                })
                if err != nil {
                    result.Errors = append(result.Errors, ImportError{
                        Key:   secret.Key,
                        Error: err.Error(),
                    })
                } else {
                    result.Updated++
                }
            case ConflictError:
                result.Errors = append(result.Errors, ImportError{
                    Key:   secret.Key,
                    Error: "secret already exists",
                })
            }
        } else {
            // Create new secret
            _, err := s.secretService.CreateSecret(ctx, &CreateSecretRequest{
                EnvID:       req.EnvID,
                Key:         secret.Key,
                Path:        secret.Path,
                Value:       secret.Value,
                Type:        parseSecretType(secret.Type),
                Description: secret.Description,
                Tags:        secret.Tags,
            })
            if err != nil {
                result.Errors = append(result.Errors, ImportError{
                    Key:   secret.Key,
                    Error: err.Error(),
                })
            } else {
                result.Created++
            }
        }
    }

    return result, nil
}
```

#### Rotation Workflows

```go
// RotationService handles secret rotation
type RotationService struct {
    secretService *SecretService
    providers     map[string]RotationProvider
}

// RotationProvider defines interface for rotation implementations
type RotationProvider interface {
    // Rotate generates a new secret value
    Rotate(ctx context.Context, secret *Secret, config map[string]string) ([]byte, error)

    // Verify checks if the new secret is valid
    Verify(ctx context.Context, secret *Secret, value []byte) error

    // Rollback reverts to previous value
    Rollback(ctx context.Context, secret *Secret, previousValue []byte) error
}

// RotateSecret rotates a secret using configured provider
func (s *RotationService) RotateSecret(ctx context.Context, secretID ids.ID) (*RotationResult, error) {
    secret := s.secretService.state.Secrets[secretID]
    if secret == nil {
        return nil, ErrSecretNotFound
    }

    if secret.RotationHandler.Strategy == StrategyManual {
        return nil, fmt.Errorf("secret configured for manual rotation only")
    }

    // Get provider
    provider, ok := s.providers[secret.RotationHandler.ProviderType]
    if !ok {
        return nil, fmt.Errorf("unknown rotation provider: %s", secret.RotationHandler.ProviderType)
    }

    // Get current value for rollback
    currentValue, err := s.secretService.GetSecret(ctx, &GetSecretRequest{
        SecretID: secretID,
    })
    if err != nil {
        return nil, fmt.Errorf("failed to get current value: %w", err)
    }

    // Generate new value
    newValue, err := provider.Rotate(ctx, secret, secret.RotationHandler.ProviderConfig)
    if err != nil {
        return nil, fmt.Errorf("rotation failed: %w", err)
    }

    // Verify new value
    if err := provider.Verify(ctx, secret, newValue); err != nil {
        // Verification failed, don't update
        return nil, fmt.Errorf("new secret verification failed: %w", err)
    }

    // Update secret
    updated, err := s.secretService.UpdateSecret(ctx, &UpdateSecretRequest{
        SecretID: secretID,
        Value:    newValue,
        Comment:  "Automatic rotation",
    })
    if err != nil {
        // Rollback if update failed
        provider.Rollback(ctx, secret, currentValue)
        return nil, fmt.Errorf("failed to store rotated secret: %w", err)
    }

    // Update rotation timestamp
    secret.LastRotated = s.secretService.currentBlock()

    return &RotationResult{
        SecretID:    secretID,
        OldVersion:  updated.Version - 1,
        NewVersion:  updated.Version,
        RotatedAt:   secret.LastRotated,
        NextRotation: secret.LastRotated + secret.RotationPeriod,
    }, nil
}

// DatabaseRotationProvider rotates database credentials
type DatabaseRotationProvider struct {
    dbClients map[string]*sql.DB
}

func (p *DatabaseRotationProvider) Rotate(ctx context.Context, secret *Secret, config map[string]string) ([]byte, error) {
    dbType := config["db_type"]
    host := config["host"]
    username := config["username"]

    // Generate new password
    newPassword := generateSecurePassword(32)

    // Connect to database and change password
    switch dbType {
    case "postgres":
        _, err := p.dbClients[host].ExecContext(ctx,
            "ALTER USER $1 WITH PASSWORD $2",
            username, newPassword)
        if err != nil {
            return nil, fmt.Errorf("postgres password change failed: %w", err)
        }

    case "mysql":
        _, err := p.dbClients[host].ExecContext(ctx,
            "ALTER USER ?@'%' IDENTIFIED BY ?",
            username, newPassword)
        if err != nil {
            return nil, fmt.Errorf("mysql password change failed: %w", err)
        }
    }

    // Return connection string with new password
    connStr := fmt.Sprintf("%s://%s:%s@%s/%s",
        dbType, username, newPassword, host, config["database"])

    return []byte(connStr), nil
}
```

#### Automated Secret Rotation Protocol

The automated rotation protocol defines the state machine and message flow for scheduled secret rotation.

```
Rotation State Machine:

    +----------+     schedule      +------------+
    |   IDLE   |----------------->| SCHEDULED  |
    +----------+                   +------------+
         ^                              |
         |                              | trigger
         |                              v
    +----------+     success      +------------+
    |  ACTIVE  |<-----------------| ROTATING   |
    +----------+                   +------------+
         ^                              |
         |                              | failure
         |     retry < max              v
         +--------------------------+--------+
                                    | FAILED |
                                    +--------+
                                         |
                                         | manual_resolve
                                         v
                                    +----------+
                                    | ROLLBACK |
                                    +----------+
```

```go
// RotationProtocol implements the automated rotation state machine
type RotationProtocol struct {
    scheduler *RotationScheduler
    executor  *RotationExecutor
    notifier  *RotationNotifier
    state     *PlatformState
}

// RotationJob represents a scheduled rotation task
type RotationJob struct {
    JobID           ids.ID
    SecretID        ids.ID
    State           RotationState
    ScheduledAt     uint64        // Block height
    StartedAt       uint64
    CompletedAt     uint64
    RetryCount      uint32
    MaxRetries      uint32
    Error           string
    PreviousVersion uint32
    NewVersion      uint32
}

type RotationState uint8

const (
    RotationStateIdle      RotationState = 0x00
    RotationStateScheduled RotationState = 0x01
    RotationStateRotating  RotationState = 0x02
    RotationStateActive    RotationState = 0x03
    RotationStateFailed    RotationState = 0x04
    RotationStateRollback  RotationState = 0x05
)

// ScheduleRotation creates a new rotation job
func (p *RotationProtocol) ScheduleRotation(ctx context.Context, secretID ids.ID, triggerAt uint64) (*RotationJob, error) {
    secret := p.state.Secrets[secretID]
    if secret == nil {
        return nil, ErrSecretNotFound
    }

    if !secret.AutoRotate {
        return nil, fmt.Errorf("secret not configured for automatic rotation")
    }

    job := &RotationJob{
        JobID:       ids.GenerateID(),
        SecretID:    secretID,
        State:       RotationStateScheduled,
        ScheduledAt: triggerAt,
        MaxRetries:  3,
    }

    p.state.RotationJobs[job.JobID] = job
    p.scheduler.Schedule(job)

    return job, nil
}

// ExecuteRotation performs the actual rotation
func (p *RotationProtocol) ExecuteRotation(ctx context.Context, jobID ids.ID) error {
    job := p.state.RotationJobs[jobID]
    if job == nil {
        return ErrJobNotFound
    }

    // Transition to rotating state
    job.State = RotationStateRotating
    job.StartedAt = p.currentBlock()

    // Execute rotation with retry logic
    for attempt := uint32(0); attempt <= job.MaxRetries; attempt++ {
        job.RetryCount = attempt

        result, err := p.executor.Rotate(ctx, job.SecretID)
        if err == nil {
            // Success - transition to active
            job.State = RotationStateActive
            job.CompletedAt = p.currentBlock()
            job.NewVersion = result.NewVersion
            job.PreviousVersion = result.OldVersion

            // Notify on success
            p.notifier.NotifyRotationComplete(ctx, job)

            // Schedule next rotation
            secret := p.state.Secrets[job.SecretID]
            if secret.AutoRotate && secret.RotationPeriod > 0 {
                p.ScheduleRotation(ctx, job.SecretID, p.currentBlock()+secret.RotationPeriod)
            }

            return nil
        }

        job.Error = err.Error()

        // Exponential backoff between retries
        if attempt < job.MaxRetries {
            time.Sleep(time.Duration(1<<attempt) * time.Second)
        }
    }

    // All retries exhausted - transition to failed
    job.State = RotationStateFailed
    p.notifier.NotifyRotationFailed(ctx, job)

    return fmt.Errorf("rotation failed after %d attempts: %s", job.MaxRetries+1, job.Error)
}

// RollbackRotation reverts a failed rotation
func (p *RotationProtocol) RollbackRotation(ctx context.Context, jobID ids.ID) error {
    job := p.state.RotationJobs[jobID]
    if job == nil {
        return ErrJobNotFound
    }

    if job.State != RotationStateFailed {
        return fmt.Errorf("can only rollback failed rotations")
    }

    job.State = RotationStateRollback

    // Rollback to previous version
    err := p.executor.Rollback(ctx, job.SecretID, int(job.PreviousVersion))
    if err != nil {
        return fmt.Errorf("rollback failed: %w", err)
    }

    job.State = RotationStateActive
    p.notifier.NotifyRotationRolledBack(ctx, job)

    return nil
}
```

**Rotation Protocol Requirements:**

1. Implementations **MUST** maintain rotation state in K-Chain for auditability
2. Implementations **MUST** retry failed rotations up to `MaxRetries` times
3. Implementations **MUST** notify configured channels on rotation events
4. Implementations **SHOULD** support exponential backoff between retries
5. Implementations **MUST** support manual rollback for failed rotations
6. Implementations **MUST NOT** leave secrets in an inconsistent state

#### Inheritance and Overrides

```go
// InheritanceService handles secret inheritance between environments
type InheritanceService struct {
    state *PlatformState
}

// GetEffectiveSecrets returns all secrets for an environment including inherited
func (s *InheritanceService) GetEffectiveSecrets(ctx context.Context, envID ids.ID) ([]*EffectiveSecret, error) {
    env := s.state.Environments[envID]
    if env == nil {
        return nil, ErrEnvironmentNotFound
    }

    // Build inheritance chain
    chain := s.buildInheritanceChain(env)

    // Collect secrets from all environments in chain
    secretMap := make(map[string]*EffectiveSecret) // key -> secret

    for _, chainEnv := range chain {
        for _, secret := range s.state.SecretsByEnv[chainEnv.EnvID] {
            key := secret.Path + "/" + secret.Key

            if existing, ok := secretMap[key]; ok {
                // Override existing
                existing.OverriddenBy = secret.SecretID
                existing.OverriddenInEnv = chainEnv.EnvID
            }

            secretMap[key] = &EffectiveSecret{
                Secret:        secret,
                InheritedFrom: chainEnv.EnvID,
                IsOverride:    chainEnv.EnvID != envID,
            }
        }
    }

    result := make([]*EffectiveSecret, 0, len(secretMap))
    for _, es := range secretMap {
        result = append(result, es)
    }

    return result, nil
}

// buildInheritanceChain builds the environment inheritance chain
func (s *InheritanceService) buildInheritanceChain(env *Environment) []*Environment {
    chain := []*Environment{}

    current := env
    for current != nil {
        chain = append([]*Environment{current}, chain...) // Prepend for correct order

        if current.ParentEnvID == ids.Empty || !current.InheritSecrets {
            break
        }

        current = s.state.Environments[current.ParentEnvID]
    }

    return chain
}

// Example inheritance structure:
//
// base (development)
//   |
//   +-- staging (inherits from base)
//   |     |
//   |     +-- staging-eu (inherits from staging)
//   |
//   +-- production (inherits from base)
//         |
//         +-- production-eu (inherits from production)
//         |
//         +-- production-us (inherits from production)
//
// If staging has DATABASE_URL and base has API_KEY:
// - staging-eu sees both DATABASE_URL (from staging) and API_KEY (from base)
// - If staging-eu defines DATABASE_URL, it overrides staging's value
```

### Access Control Model

```go
// AccessControlService implements RBAC with hierarchical scopes
type AccessControlService struct {
    state *PlatformState
}

// CheckAccess verifies if a principal can perform an action on a resource
func (s *AccessControlService) CheckAccess(ctx context.Context, req *AccessCheckRequest) error {
    principal := s.getPrincipal(ctx)

    // Build effective permissions from all applicable policies
    permissions := s.buildEffectivePermissions(principal, req.ResourceType, req.ResourceID)

    // Check if action is allowed
    if !permissions.Allows(req.Action) {
        return &AccessDeniedError{
            Principal: principal.ID,
            Action:    req.Action,
            Resource:  req.ResourceID,
            Reason:    "insufficient permissions",
        }
    }

    // Check conditions
    for _, condition := range permissions.Conditions {
        if !s.evaluateCondition(ctx, condition) {
            return &AccessDeniedError{
                Principal: principal.ID,
                Action:    req.Action,
                Resource:  req.ResourceID,
                Reason:    fmt.Sprintf("condition not met: %s", condition.Type),
            }
        }
    }

    return nil
}

// buildEffectivePermissions aggregates permissions from all applicable policies
func (s *AccessControlService) buildEffectivePermissions(principal *Principal, resourceType ResourceType, resourceID ids.ID) *EffectivePermissions {
    perms := &EffectivePermissions{
        Actions:    make(map[Action]bool),
        Conditions: make([]AccessCondition, 0),
    }

    // Get resource hierarchy
    hierarchy := s.getResourceHierarchy(resourceType, resourceID)
    // e.g., [org, project, environment, secret]

    // Find all applicable policies
    for _, policy := range s.state.Policies {
        if !policy.Active {
            continue
        }

        // Check if policy applies to this resource
        if !s.policyApplies(policy, hierarchy) {
            continue
        }

        // Check if policy has assignment for this principal
        for _, assignment := range policy.Assignments {
            if s.assignmentMatches(assignment, principal) {
                // Add permissions from role
                rolePerms := s.getRolePermissions(assignment.Role)
                for action, allowed := range rolePerms.Actions {
                    if allowed {
                        perms.Actions[action] = true
                    }
                }

                // Add conditions
                perms.Conditions = append(perms.Conditions, assignment.Conditions...)
            }
        }
    }

    return perms
}

// ServiceAccount represents a machine identity for API access
type ServiceAccount struct {
    ServiceAccountID ids.ID
    OrgID            ids.ID
    Name             string
    Description      string

    // Authentication
    PublicKey        []byte                // Ed25519 public key
    TokenHash        [32]byte              // Hash of current token

    // Scope
    ProjectScopes    []ids.ID              // Limited to specific projects (empty = all)
    EnvScopes        []string              // Limited to specific environments (empty = all)
    SecretScopes     []string              // Path patterns (empty = all)

    // Permissions
    MaxRole          ProjectRole           // Maximum role this SA can have
    Actions          []Action              // Allowed actions

    // Rate Limiting
    RateLimit        uint32                // Requests per minute
    BurstLimit       uint32                // Burst capacity

    // Lifecycle
    CreatedAt        uint64
    CreatedBy        ids.ShortID
    ExpiresAt        uint64                // 0 = never
    LastUsed         uint64

    // Security
    IPAllowlist      []string              // Allowed source IPs
    RequireMTLS      bool                  // Require mutual TLS
}

// CreateServiceAccountToken generates a new API token for a service account
func (s *AccessControlService) CreateServiceAccountToken(ctx context.Context, saID ids.ID, ttl uint64) (*Token, error) {
    sa := s.state.ServiceAccounts[saID]
    if sa == nil {
        return nil, ErrServiceAccountNotFound
    }

    // Generate token
    tokenBytes := make([]byte, 32)
    rand.Read(tokenBytes)

    token := &Token{
        TokenID:          ids.GenerateID(),
        ServiceAccountID: saID,
        TokenHash:        sha256.Sum256(tokenBytes),
        CreatedAt:        s.currentBlock(),
        ExpiresAt:        s.currentBlock() + ttl,
        Scopes:           sa.ProjectScopes,
    }

    s.state.Tokens[token.TokenID] = token
    sa.TokenHash = token.TokenHash

    // Return raw token (only time it's available)
    return &Token{
        TokenID:   token.TokenID,
        RawToken:  base64.StdEncoding.EncodeToString(tokenBytes),
        ExpiresAt: token.ExpiresAt,
    }, nil
}
```

### SDK Integration

#### TypeScript SDK

```typescript
// @luxfi/secrets - TypeScript SDK for Decentralized Secrets Management

import { KChainClient } from '@luxfi/kchain';
import { TChainClient } from '@luxfi/tchain';

export interface SecretClientConfig {
  /** K-Chain RPC endpoint */
  kchainEndpoint: string;
  /** T-Chain RPC endpoint (for threshold decryption) */
  tchainEndpoint?: string;
  /** Authentication token */
  token: string;
  /** Organization ID */
  orgId: string;
  /** Default project ID */
  projectId?: string;
  /** Default environment */
  environment?: string;
  /** Cache TTL in seconds */
  cacheTtl?: number;
}

export class SecretClient {
  private kchain: KChainClient;
  private tchain?: TChainClient;
  private config: SecretClientConfig;
  private cache: Map<string, CachedSecret>;

  constructor(config: SecretClientConfig) {
    this.config = config;
    this.kchain = new KChainClient(config.kchainEndpoint);
    if (config.tchainEndpoint) {
      this.tchain = new TChainClient(config.tchainEndpoint);
    }
    this.cache = new Map();
  }

  /**
   * Get a single secret by key
   * @example
   * const dbUrl = await client.getSecret('DATABASE_URL');
   */
  async getSecret(key: string, options?: GetSecretOptions): Promise<string> {
    const projectId = options?.projectId ?? this.config.projectId;
    const env = options?.environment ?? this.config.environment;

    if (!projectId || !env) {
      throw new Error('projectId and environment are required');
    }

    // Check cache
    const cacheKey = `${projectId}:${env}:${key}`;
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value;
    }

    // Fetch from platform
    const response = await this.request('GET', `/secrets/${projectId}/${env}/${key}`);
    const value = response.value;

    // Cache result
    if (this.config.cacheTtl) {
      this.cache.set(cacheKey, {
        value,
        expiresAt: Date.now() + this.config.cacheTtl * 1000,
      });
    }

    return value;
  }

  /**
   * Get all secrets for an environment
   * @example
   * const secrets = await client.getAllSecrets({ environment: 'production' });
   * console.log(secrets.DATABASE_URL);
   */
  async getAllSecrets(options?: GetAllSecretsOptions): Promise<Record<string, string>> {
    const projectId = options?.projectId ?? this.config.projectId;
    const env = options?.environment ?? this.config.environment;

    const response = await this.request('GET', `/secrets/${projectId}/${env}`);

    const secrets: Record<string, string> = {};
    for (const secret of response.secrets) {
      secrets[secret.key] = secret.value;
    }

    return secrets;
  }

  /**
   * Create or update a secret
   * @example
   * await client.setSecret('API_KEY', 'sk-...');
   */
  async setSecret(key: string, value: string, options?: SetSecretOptions): Promise<void> {
    const projectId = options?.projectId ?? this.config.projectId;
    const env = options?.environment ?? this.config.environment;

    await this.request('PUT', `/secrets/${projectId}/${env}/${key}`, {
      value,
      type: options?.type ?? 'generic',
      description: options?.description,
      tags: options?.tags,
    });

    // Invalidate cache
    const cacheKey = `${projectId}:${env}:${key}`;
    this.cache.delete(cacheKey);
  }

  /**
   * Delete a secret
   */
  async deleteSecret(key: string, options?: DeleteSecretOptions): Promise<void> {
    const projectId = options?.projectId ?? this.config.projectId;
    const env = options?.environment ?? this.config.environment;

    await this.request('DELETE', `/secrets/${projectId}/${env}/${key}`);

    const cacheKey = `${projectId}:${env}:${key}`;
    this.cache.delete(cacheKey);
  }

  /**
   * List secret versions
   */
  async getSecretVersions(key: string, options?: GetVersionsOptions): Promise<SecretVersion[]> {
    const projectId = options?.projectId ?? this.config.projectId;
    const env = options?.environment ?? this.config.environment;

    const response = await this.request('GET', `/secrets/${projectId}/${env}/${key}/versions`);
    return response.versions;
  }

  /**
   * Rollback to a previous version
   */
  async rollbackSecret(key: string, version: number, options?: RollbackOptions): Promise<void> {
    const projectId = options?.projectId ?? this.config.projectId;
    const env = options?.environment ?? this.config.environment;

    await this.request('POST', `/secrets/${projectId}/${env}/${key}/rollback`, {
      version,
      comment: options?.comment,
    });
  }

  /**
   * Inject secrets into process.env
   * @example
   * await client.injectSecrets();
   * // Now process.env.DATABASE_URL is available
   */
  async injectSecrets(options?: InjectOptions): Promise<void> {
    const secrets = await this.getAllSecrets(options);

    for (const [key, value] of Object.entries(secrets)) {
      if (options?.prefix) {
        process.env[`${options.prefix}${key}`] = value;
      } else {
        process.env[key] = value;
      }
    }
  }

  /**
   * Watch for secret changes (WebSocket)
   */
  watch(callback: (event: SecretChangeEvent) => void, options?: WatchOptions): () => void {
    const projectId = options?.projectId ?? this.config.projectId;
    const env = options?.environment ?? this.config.environment;

    const ws = new WebSocket(`${this.config.kchainEndpoint.replace('http', 'ws')}/watch/${projectId}/${env}`);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      callback(data);

      // Invalidate cache on change
      const cacheKey = `${projectId}:${env}:${data.key}`;
      this.cache.delete(cacheKey);
    };

    return () => ws.close();
  }

  private async request(method: string, path: string, body?: any): Promise<any> {
    const response = await fetch(`${this.config.kchainEndpoint}/api/v1${path}`, {
      method,
      headers: {
        'Authorization': `Bearer ${this.config.token}`,
        'Content-Type': 'application/json',
        'X-Org-Id': this.config.orgId,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      throw new SecretsError(response.status, await response.text());
    }

    return response.json();
  }
}

// Usage example
const client = new SecretClient({
  kchainEndpoint: 'https://kchain.lux.network',
  token: process.env.LUX_SECRETS_TOKEN!,
  orgId: 'org_abc123',
  projectId: 'proj_xyz789',
  environment: 'production',
  cacheTtl: 300, // 5 minutes
});

// Get single secret
const dbUrl = await client.getSecret('DATABASE_URL');

// Get all secrets and inject
await client.injectSecrets();

// Watch for changes
const unwatch = client.watch((event) => {
  console.log(`Secret ${event.key} changed in ${event.environment}`);
});
```

#### Go SDK

```go
// Package secrets provides Go SDK for Decentralized Secrets Management
package secrets

import (
    "context"
    "encoding/json"
    "fmt"
    "net/http"
    "sync"
    "time"

    "github.com/luxfi/ids"
)

// Client is the secrets management SDK client
type Client struct {
    httpClient  *http.Client
    baseURL     string
    token       string
    orgID       string
    projectID   string
    environment string

    cache       map[string]*cachedSecret
    cacheMu     sync.RWMutex
    cacheTTL    time.Duration
}

// Config holds client configuration
type Config struct {
    // Required
    BaseURL     string
    Token       string
    OrgID       string

    // Optional defaults
    ProjectID   string
    Environment string
    CacheTTL    time.Duration

    // HTTP settings
    Timeout     time.Duration
}

// NewClient creates a new secrets client
func NewClient(cfg *Config) (*Client, error) {
    if cfg.BaseURL == "" || cfg.Token == "" || cfg.OrgID == "" {
        return nil, fmt.Errorf("BaseURL, Token, and OrgID are required")
    }

    timeout := cfg.Timeout
    if timeout == 0 {
        timeout = 30 * time.Second
    }

    return &Client{
        httpClient: &http.Client{Timeout: timeout},
        baseURL:    cfg.BaseURL,
        token:      cfg.Token,
        orgID:      cfg.OrgID,
        projectID:  cfg.ProjectID,
        environment: cfg.Environment,
        cache:      make(map[string]*cachedSecret),
        cacheTTL:   cfg.CacheTTL,
    }, nil
}

// GetSecret retrieves a single secret
func (c *Client) GetSecret(ctx context.Context, key string, opts ...Option) (string, error) {
    o := c.applyOptions(opts)

    // Check cache
    if c.cacheTTL > 0 {
        c.cacheMu.RLock()
        cached, ok := c.cache[c.cacheKey(o.ProjectID, o.Environment, key)]
        c.cacheMu.RUnlock()

        if ok && time.Now().Before(cached.expiresAt) {
            return cached.value, nil
        }
    }

    // Fetch from API
    path := fmt.Sprintf("/secrets/%s/%s/%s", o.ProjectID, o.Environment, key)

    var resp struct {
        Value string `json:"value"`
    }

    if err := c.request(ctx, "GET", path, nil, &resp); err != nil {
        return "", fmt.Errorf("get secret failed: %w", err)
    }

    // Update cache
    if c.cacheTTL > 0 {
        c.cacheMu.Lock()
        c.cache[c.cacheKey(o.ProjectID, o.Environment, key)] = &cachedSecret{
            value:     resp.Value,
            expiresAt: time.Now().Add(c.cacheTTL),
        }
        c.cacheMu.Unlock()
    }

    return resp.Value, nil
}

// GetAllSecrets retrieves all secrets for an environment
func (c *Client) GetAllSecrets(ctx context.Context, opts ...Option) (map[string]string, error) {
    o := c.applyOptions(opts)

    path := fmt.Sprintf("/secrets/%s/%s", o.ProjectID, o.Environment)

    var resp struct {
        Secrets []struct {
            Key   string `json:"key"`
            Value string `json:"value"`
        } `json:"secrets"`
    }

    if err := c.request(ctx, "GET", path, nil, &resp); err != nil {
        return nil, fmt.Errorf("get all secrets failed: %w", err)
    }

    secrets := make(map[string]string, len(resp.Secrets))
    for _, s := range resp.Secrets {
        secrets[s.Key] = s.Value
    }

    return secrets, nil
}

// SetSecret creates or updates a secret
func (c *Client) SetSecret(ctx context.Context, key, value string, opts ...Option) error {
    o := c.applyOptions(opts)

    path := fmt.Sprintf("/secrets/%s/%s/%s", o.ProjectID, o.Environment, key)

    body := map[string]interface{}{
        "value": value,
    }

    if o.Description != "" {
        body["description"] = o.Description
    }
    if o.SecretType != "" {
        body["type"] = o.SecretType
    }
    if len(o.Tags) > 0 {
        body["tags"] = o.Tags
    }

    if err := c.request(ctx, "PUT", path, body, nil); err != nil {
        return fmt.Errorf("set secret failed: %w", err)
    }

    // Invalidate cache
    c.cacheMu.Lock()
    delete(c.cache, c.cacheKey(o.ProjectID, o.Environment, key))
    c.cacheMu.Unlock()

    return nil
}

// DeleteSecret removes a secret
func (c *Client) DeleteSecret(ctx context.Context, key string, opts ...Option) error {
    o := c.applyOptions(opts)

    path := fmt.Sprintf("/secrets/%s/%s/%s", o.ProjectID, o.Environment, key)

    if err := c.request(ctx, "DELETE", path, nil, nil); err != nil {
        return fmt.Errorf("delete secret failed: %w", err)
    }

    return nil
}

// Rollback reverts a secret to a previous version
func (c *Client) Rollback(ctx context.Context, key string, version int, opts ...Option) error {
    o := c.applyOptions(opts)

    path := fmt.Sprintf("/secrets/%s/%s/%s/rollback", o.ProjectID, o.Environment, key)

    body := map[string]interface{}{
        "version": version,
    }
    if o.Comment != "" {
        body["comment"] = o.Comment
    }

    return c.request(ctx, "POST", path, body, nil)
}

// GetEnv returns all secrets as environment variable format
func (c *Client) GetEnv(ctx context.Context, opts ...Option) ([]string, error) {
    secrets, err := c.GetAllSecrets(ctx, opts...)
    if err != nil {
        return nil, err
    }

    env := make([]string, 0, len(secrets))
    for k, v := range secrets {
        env = append(env, fmt.Sprintf("%s=%s", k, v))
    }

    return env, nil
}

// Usage example
func Example() {
    client, _ := NewClient(&Config{
        BaseURL:     "https://kchain.lux.network",
        Token:       os.Getenv("LUX_SECRETS_TOKEN"),
        OrgID:       "org_abc123",
        ProjectID:   "proj_xyz789",
        Environment: "production",
        CacheTTL:    5 * time.Minute,
    })

    ctx := context.Background()

    // Get single secret
    dbURL, _ := client.GetSecret(ctx, "DATABASE_URL")

    // Get all secrets
    secrets, _ := client.GetAllSecrets(ctx)

    // Set a secret
    client.SetSecret(ctx, "API_KEY", "sk-...", WithDescription("External API key"))

    // Rollback
    client.Rollback(ctx, "API_KEY", 2, WithComment("Reverting to known good value"))
}
```

#### Python SDK

```python
"""
luxfi-secrets - Python SDK for Decentralized Secrets Management
"""

import os
import json
import time
import hashlib
from typing import Optional, Dict, List, Any
from dataclasses import dataclass
from functools import lru_cache

import httpx
from pydantic import BaseModel


class SecretVersion(BaseModel):
    version: int
    created_at: int
    created_by: str
    comment: Optional[str] = None


class Secret(BaseModel):
    key: str
    value: str
    type: str = "generic"
    description: Optional[str] = None
    tags: List[str] = []
    version: int = 1


class SecretsClient:
    """Client for Lux Decentralized Secrets Management Platform"""

    def __init__(
        self,
        base_url: str = "https://kchain.lux.network",
        token: Optional[str] = None,
        org_id: Optional[str] = None,
        project_id: Optional[str] = None,
        environment: Optional[str] = None,
        cache_ttl: int = 300,  # seconds
    ):
        """
        Initialize the secrets client.

        Args:
            base_url: K-Chain API endpoint
            token: Authentication token (defaults to LUX_SECRETS_TOKEN env var)
            org_id: Organization ID
            project_id: Default project ID
            environment: Default environment
            cache_ttl: Cache time-to-live in seconds (0 to disable)
        """
        self.base_url = base_url.rstrip('/')
        self.token = token or os.getenv("LUX_SECRETS_TOKEN")
        self.org_id = org_id or os.getenv("LUX_ORG_ID")
        self.project_id = project_id or os.getenv("LUX_PROJECT_ID")
        self.environment = environment or os.getenv("LUX_ENVIRONMENT")
        self.cache_ttl = cache_ttl

        self._cache: Dict[str, tuple[str, float]] = {}
        self._client = httpx.Client(
            base_url=f"{self.base_url}/api/v1",
            headers={
                "Authorization": f"Bearer {self.token}",
                "X-Org-Id": self.org_id,
                "Content-Type": "application/json",
            },
            timeout=30.0,
        )

    def get_secret(
        self,
        key: str,
        project_id: Optional[str] = None,
        environment: Optional[str] = None,
        default: Optional[str] = None,
    ) -> Optional[str]:
        """
        Get a single secret by key.

        Args:
            key: Secret key name
            project_id: Project ID (uses default if not specified)
            environment: Environment (uses default if not specified)
            default: Default value if secret not found

        Returns:
            Secret value or default
        """
        project_id = project_id or self.project_id
        environment = environment or self.environment

        if not project_id or not environment:
            raise ValueError("project_id and environment are required")

        # Check cache
        cache_key = f"{project_id}:{environment}:{key}"
        if cache_key in self._cache:
            value, expires_at = self._cache[cache_key]
            if time.time() < expires_at:
                return value

        try:
            response = self._client.get(
                f"/secrets/{project_id}/{environment}/{key}"
            )
            response.raise_for_status()
            value = response.json()["value"]

            # Update cache
            if self.cache_ttl > 0:
                self._cache[cache_key] = (value, time.time() + self.cache_ttl)

            return value
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 404:
                return default
            raise

    def get_all_secrets(
        self,
        project_id: Optional[str] = None,
        environment: Optional[str] = None,
    ) -> Dict[str, str]:
        """
        Get all secrets for an environment.

        Returns:
            Dictionary of key -> value
        """
        project_id = project_id or self.project_id
        environment = environment or self.environment

        response = self._client.get(
            f"/secrets/{project_id}/{environment}"
        )
        response.raise_for_status()

        secrets = {}
        for secret in response.json()["secrets"]:
            secrets[secret["key"]] = secret["value"]

        return secrets

    def set_secret(
        self,
        key: str,
        value: str,
        project_id: Optional[str] = None,
        environment: Optional[str] = None,
        description: Optional[str] = None,
        secret_type: str = "generic",
        tags: Optional[List[str]] = None,
    ) -> None:
        """Create or update a secret."""
        project_id = project_id or self.project_id
        environment = environment or self.environment

        body = {
            "value": value,
            "type": secret_type,
        }
        if description:
            body["description"] = description
        if tags:
            body["tags"] = tags

        response = self._client.put(
            f"/secrets/{project_id}/{environment}/{key}",
            json=body,
        )
        response.raise_for_status()

        # Invalidate cache
        cache_key = f"{project_id}:{environment}:{key}"
        self._cache.pop(cache_key, None)

    def delete_secret(
        self,
        key: str,
        project_id: Optional[str] = None,
        environment: Optional[str] = None,
    ) -> None:
        """Delete a secret."""
        project_id = project_id or self.project_id
        environment = environment or self.environment

        response = self._client.delete(
            f"/secrets/{project_id}/{environment}/{key}"
        )
        response.raise_for_status()

    def get_versions(
        self,
        key: str,
        project_id: Optional[str] = None,
        environment: Optional[str] = None,
    ) -> List[SecretVersion]:
        """Get version history for a secret."""
        project_id = project_id or self.project_id
        environment = environment or self.environment

        response = self._client.get(
            f"/secrets/{project_id}/{environment}/{key}/versions"
        )
        response.raise_for_status()

        return [SecretVersion(**v) for v in response.json()["versions"]]

    def rollback(
        self,
        key: str,
        version: int,
        project_id: Optional[str] = None,
        environment: Optional[str] = None,
        comment: Optional[str] = None,
    ) -> None:
        """Rollback a secret to a previous version."""
        project_id = project_id or self.project_id
        environment = environment or self.environment

        body = {"version": version}
        if comment:
            body["comment"] = comment

        response = self._client.post(
            f"/secrets/{project_id}/{environment}/{key}/rollback",
            json=body,
        )
        response.raise_for_status()

    def inject_env(
        self,
        project_id: Optional[str] = None,
        environment: Optional[str] = None,
        prefix: str = "",
    ) -> None:
        """Inject all secrets into os.environ."""
        secrets = self.get_all_secrets(project_id, environment)
        for key, value in secrets.items():
            os.environ[f"{prefix}{key}"] = value

    def __enter__(self):
        return self

    def __exit__(self, *args):
        self._client.close()


# Usage example
if __name__ == "__main__":
    client = SecretsClient(
        org_id="org_abc123",
        project_id="proj_xyz789",
        environment="production",
    )

    # Get single secret
    db_url = client.get_secret("DATABASE_URL")

    # Get all secrets
    secrets = client.get_all_secrets()

    # Inject into environment
    client.inject_env()

    # Set a secret
    client.set_secret(
        "API_KEY",
        "sk-...",
        description="External API key",
        tags=["external", "api"],
    )
```

#### CLI Tool Specification

```go
// lux-secrets CLI tool
package main

import (
    "fmt"
    "os"

    "github.com/spf13/cobra"
)

func main() {
    rootCmd := &cobra.Command{
        Use:   "lux-secrets",
        Short: "Decentralized secrets management CLI",
    }

    // Global flags
    rootCmd.PersistentFlags().String("token", "", "Authentication token (or LUX_SECRETS_TOKEN env)")
    rootCmd.PersistentFlags().String("org", "", "Organization ID (or LUX_ORG_ID env)")
    rootCmd.PersistentFlags().String("project", "", "Project ID (or LUX_PROJECT_ID env)")
    rootCmd.PersistentFlags().String("env", "", "Environment (or LUX_ENVIRONMENT env)")
    rootCmd.PersistentFlags().String("format", "table", "Output format: table, json, yaml, dotenv")

    // Commands
    rootCmd.AddCommand(
        getCmd(),
        setCmd(),
        deleteCmd(),
        listCmd(),
        runCmd(),
        exportCmd(),
        importCmd(),
        rollbackCmd(),
        rotateCmd(),
        auditCmd(),
        loginCmd(),
        projectCmd(),
        envCmd(),
    )

    if err := rootCmd.Execute(); err != nil {
        os.Exit(1)
    }
}

// lux-secrets get DATABASE_URL
func getCmd() *cobra.Command {
    return &cobra.Command{
        Use:   "get [key]",
        Short: "Get a secret value",
        Args:  cobra.ExactArgs(1),
        RunE: func(cmd *cobra.Command, args []string) error {
            client := newClient(cmd)
            value, err := client.GetSecret(cmd.Context(), args[0])
            if err != nil {
                return err
            }
            fmt.Println(value)
            return nil
        },
    }
}

// lux-secrets set DATABASE_URL "postgres://..."
func setCmd() *cobra.Command {
    cmd := &cobra.Command{
        Use:   "set [key] [value]",
        Short: "Set a secret value",
        Args:  cobra.ExactArgs(2),
        RunE: func(cmd *cobra.Command, args []string) error {
            client := newClient(cmd)
            desc, _ := cmd.Flags().GetString("description")
            secretType, _ := cmd.Flags().GetString("type")

            return client.SetSecret(cmd.Context(), args[0], args[1],
                WithDescription(desc),
                WithSecretType(secretType))
        },
    }
    cmd.Flags().String("description", "", "Secret description")
    cmd.Flags().String("type", "generic", "Secret type")
    return cmd
}

// lux-secrets list
func listCmd() *cobra.Command {
    return &cobra.Command{
        Use:   "list",
        Short: "List all secrets",
        RunE: func(cmd *cobra.Command, args []string) error {
            client := newClient(cmd)
            secrets, err := client.ListSecrets(cmd.Context())
            if err != nil {
                return err
            }

            format, _ := cmd.Flags().GetString("format")
            return printSecrets(secrets, format)
        },
    }
}

// lux-secrets run -- node server.js
func runCmd() *cobra.Command {
    return &cobra.Command{
        Use:   "run -- [command]",
        Short: "Run a command with secrets injected",
        Args:  cobra.MinimumNArgs(1),
        RunE: func(cmd *cobra.Command, args []string) error {
            client := newClient(cmd)
            secrets, err := client.GetAllSecrets(cmd.Context())
            if err != nil {
                return err
            }

            // Build environment
            env := os.Environ()
            for k, v := range secrets {
                env = append(env, fmt.Sprintf("%s=%s", k, v))
            }

            // Execute command
            return execCommand(args[0], args[1:], env)
        },
    }
}

// lux-secrets export --format dotenv > .env
func exportCmd() *cobra.Command {
    cmd := &cobra.Command{
        Use:   "export",
        Short: "Export secrets",
        RunE: func(cmd *cobra.Command, args []string) error {
            client := newClient(cmd)
            format, _ := cmd.Flags().GetString("format")
            encrypted, _ := cmd.Flags().GetBool("encrypted")

            if encrypted {
                result, err := client.ExportEncrypted(cmd.Context(), format)
                if err != nil {
                    return err
                }
                fmt.Println(result)
            } else {
                secrets, err := client.GetAllSecrets(cmd.Context())
                if err != nil {
                    return err
                }
                return printSecretsForExport(secrets, format)
            }
            return nil
        },
    }
    cmd.Flags().Bool("encrypted", true, "Export encrypted")
    return cmd
}

// lux-secrets rollback DATABASE_URL --version 3
func rollbackCmd() *cobra.Command {
    cmd := &cobra.Command{
        Use:   "rollback [key]",
        Short: "Rollback secret to previous version",
        Args:  cobra.ExactArgs(1),
        RunE: func(cmd *cobra.Command, args []string) error {
            client := newClient(cmd)
            version, _ := cmd.Flags().GetInt("version")
            comment, _ := cmd.Flags().GetString("comment")

            return client.Rollback(cmd.Context(), args[0], version,
                WithComment(comment))
        },
    }
    cmd.Flags().Int("version", 0, "Target version (required)")
    cmd.Flags().String("comment", "", "Rollback comment")
    cmd.MarkFlagRequired("version")
    return cmd
}
```

### DevOps Integration

#### Kubernetes Operator

The Kubernetes Operator provides native integration for syncing secrets from the Lux Secrets Platform to Kubernetes Secrets.

**Operator Requirements:**

1. The operator **MUST** watch SecretSync custom resources in all namespaces (or configured namespaces)
2. The operator **MUST** authenticate to the Lux Secrets Platform using a ServiceAccount token
3. The operator **MUST** reconcile secrets at the configured `refreshInterval`
4. The operator **MUST** update the SecretSync status with sync results
5. The operator **SHOULD** support automatic reloading of dependent pods on secret changes
6. The operator **MUST NOT** log secret values in plaintext

**Deployment Architecture:**

```
+-------------------+         +----------------------+
|  Lux Secrets      |         |  Kubernetes Cluster  |
|  Platform (K-Chain)|<--------|  secrets-operator    |
+-------------------+    TLS  +----------------------+
                                       |
                                       | watches
                                       v
                              +------------------+
                              | SecretSync CRs   |
                              +------------------+
                                       |
                                       | creates/updates
                                       v
                              +------------------+
                              | K8s Secrets      |
                              +------------------+
                                       |
                                       | mounted/injected
                                       v
                              +------------------+
                              | Application Pods |
                              +------------------+
```

**Helm Chart Installation:**

```bash
# Add the Lux Helm repository
helm repo add luxfi https://charts.lux.network
helm repo update

# Install the secrets operator
helm install lux-secrets-operator luxfi/secrets-operator \
  --namespace lux-system \
  --create-namespace \
  --set auth.token="lux_sk_..." \
  --set auth.orgId="org_abc123"
```

**Operator RBAC:**

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: lux-secrets-operator
rules:
  - apiGroups: ["secrets.lux.network"]
    resources: ["secretsyncs"]
    verbs: ["get", "list", "watch", "update", "patch"]
  - apiGroups: ["secrets.lux.network"]
    resources: ["secretsyncs/status"]
    verbs: ["update", "patch"]
  - apiGroups: [""]
    resources: ["secrets"]
    verbs: ["get", "list", "watch", "create", "update", "patch", "delete"]
  - apiGroups: [""]
    resources: ["events"]
    verbs: ["create", "patch"]
---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: lux-secrets-operator
  namespace: lux-system
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: lux-secrets-operator
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: lux-secrets-operator
subjects:
  - kind: ServiceAccount
    name: lux-secrets-operator
    namespace: lux-system
```

```yaml
# CRD: SecretSync
apiVersion: apiextensions.k8s.io/v1
kind: CustomResourceDefinition
metadata:
  name: secretsyncs.secrets.lux.network
spec:
  group: secrets.lux.network
  versions:
    - name: v1
      served: true
      storage: true
      schema:
        openAPIV3Schema:
          type: object
          properties:
            spec:
              type: object
              required:
                - projectId
                - environment
              properties:
                projectId:
                  type: string
                  description: Lux Secrets project ID
                environment:
                  type: string
                  description: Environment to sync from
                secretName:
                  type: string
                  description: Target Kubernetes secret name
                namespace:
                  type: string
                  description: Target namespace
                refreshInterval:
                  type: string
                  default: "5m"
                  description: Sync interval
                secretKeys:
                  type: array
                  description: Specific keys to sync (empty = all)
                  items:
                    type: string
                managedFields:
                  type: array
                  description: Additional managed fields
                  items:
                    type: object
                    properties:
                      sourceKey:
                        type: string
                      targetKey:
                        type: string
            status:
              type: object
              properties:
                lastSyncTime:
                  type: string
                  format: date-time
                syncedSecrets:
                  type: integer
                syncStatus:
                  type: string
                  enum: [Synced, Failed, Pending]
                lastError:
                  type: string
  scope: Namespaced
  names:
    plural: secretsyncs
    singular: secretsync
    kind: SecretSync
    shortNames:
      - ss

---
# Example SecretSync resource
apiVersion: secrets.lux.network/v1
kind: SecretSync
metadata:
  name: app-secrets
  namespace: production
spec:
  projectId: proj_xyz789
  environment: production
  secretName: app-secrets
  refreshInterval: 5m
  secretKeys:
    - DATABASE_URL
    - REDIS_URL
    - API_KEY
  managedFields:
    - sourceKey: DB_PASSWORD
      targetKey: database-password
```

```go
// Kubernetes Operator Controller
package controller

import (
    "context"
    "time"

    secretsv1 "github.com/luxfi/secrets-operator/api/v1"
    "github.com/luxfi/secrets"
    corev1 "k8s.io/api/core/v1"
    "k8s.io/apimachinery/pkg/runtime"
    ctrl "sigs.k8s.io/controller-runtime"
    "sigs.k8s.io/controller-runtime/pkg/client"
)

type SecretSyncReconciler struct {
    client.Client
    Scheme        *runtime.Scheme
    SecretsClient *secrets.Client
}

func (r *SecretSyncReconciler) Reconcile(ctx context.Context, req ctrl.Request) (ctrl.Result, error) {
    // Fetch SecretSync resource
    var secretSync secretsv1.SecretSync
    if err := r.Get(ctx, req.NamespacedName, &secretSync); err != nil {
        return ctrl.Result{}, client.IgnoreNotFound(err)
    }

    // Fetch secrets from Lux platform
    luxSecrets, err := r.SecretsClient.GetAllSecrets(ctx,
        secrets.WithProject(secretSync.Spec.ProjectID),
        secrets.WithEnvironment(secretSync.Spec.Environment))
    if err != nil {
        secretSync.Status.SyncStatus = "Failed"
        secretSync.Status.LastError = err.Error()
        r.Status().Update(ctx, &secretSync)
        return ctrl.Result{RequeueAfter: time.Minute}, err
    }

    // Filter secrets if specific keys requested
    data := make(map[string][]byte)
    if len(secretSync.Spec.SecretKeys) > 0 {
        for _, key := range secretSync.Spec.SecretKeys {
            if value, ok := luxSecrets[key]; ok {
                data[key] = []byte(value)
            }
        }
    } else {
        for k, v := range luxSecrets {
            data[k] = []byte(v)
        }
    }

    // Apply managed field mappings
    for _, mapping := range secretSync.Spec.ManagedFields {
        if value, ok := data[mapping.SourceKey]; ok {
            data[mapping.TargetKey] = value
        }
    }

    // Create or update Kubernetes secret
    k8sSecret := &corev1.Secret{
        ObjectMeta: ctrl.ObjectMeta{
            Name:      secretSync.Spec.SecretName,
            Namespace: secretSync.Namespace,
        },
        Data: data,
    }

    if err := r.CreateOrUpdate(ctx, k8sSecret); err != nil {
        secretSync.Status.SyncStatus = "Failed"
        secretSync.Status.LastError = err.Error()
        r.Status().Update(ctx, &secretSync)
        return ctrl.Result{RequeueAfter: time.Minute}, err
    }

    // Update status
    secretSync.Status.SyncStatus = "Synced"
    secretSync.Status.LastSyncTime = time.Now().Format(time.RFC3339)
    secretSync.Status.SyncedSecrets = len(data)
    secretSync.Status.LastError = ""
    r.Status().Update(ctx, &secretSync)

    // Requeue based on refresh interval
    interval, _ := time.ParseDuration(secretSync.Spec.RefreshInterval)
    return ctrl.Result{RequeueAfter: interval}, nil
}
```

#### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy with Secrets

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install Lux Secrets CLI
        uses: luxfi/secrets-action/setup@v1

      - name: Inject Secrets
        uses: luxfi/secrets-action@v1
        with:
          token: ${{ secrets.LUX_SECRETS_TOKEN }}
          org-id: ${{ vars.LUX_ORG_ID }}
          project-id: ${{ vars.LUX_PROJECT_ID }}
          environment: production
          export-to: env  # or 'file' for .env file

      - name: Deploy
        run: |
          # Secrets are now available as environment variables
          echo "Deploying to $DEPLOY_TARGET"
          ./deploy.sh
```

```go
// GitHub Action implementation
package main

import (
    "context"
    "fmt"
    "os"
    "strings"

    "github.com/luxfi/secrets"
    "github.com/sethvargo/go-githubactions"
)

func main() {
    ctx := context.Background()
    action := githubactions.New()

    // Get inputs
    token := action.GetInput("token")
    orgID := action.GetInput("org-id")
    projectID := action.GetInput("project-id")
    environment := action.GetInput("environment")
    exportTo := action.GetInput("export-to")

    // Create client
    client, err := secrets.NewClient(&secrets.Config{
        BaseURL:     "https://kchain.lux.network",
        Token:       token,
        OrgID:       orgID,
        ProjectID:   projectID,
        Environment: environment,
    })
    if err != nil {
        action.Fatalf("Failed to create client: %v", err)
    }

    // Fetch secrets
    allSecrets, err := client.GetAllSecrets(ctx)
    if err != nil {
        action.Fatalf("Failed to fetch secrets: %v", err)
    }

    switch exportTo {
    case "env":
        // Export to GitHub Actions environment
        for key, value := range allSecrets {
            // Mask sensitive values in logs
            action.AddMask(value)
            // Export to subsequent steps
            action.SetEnv(key, value)
        }
        action.Infof("Exported %d secrets to environment", len(allSecrets))

    case "file":
        // Write to .env file
        var lines []string
        for key, value := range allSecrets {
            action.AddMask(value)
            lines = append(lines, fmt.Sprintf("%s=%s", key, value))
        }
        os.WriteFile(".env", []byte(strings.Join(lines, "\n")), 0600)
        action.Infof("Wrote %d secrets to .env file", len(allSecrets))

    case "output":
        // Set as action output (encrypted)
        action.SetOutput("secrets", encryptForOutput(allSecrets))
    }
}
```

#### GitLab CI Integration

```yaml
# .gitlab-ci.yml
image: alpine:latest

variables:
  LUX_ORG_ID: "org_abc123"
  LUX_PROJECT_ID: "proj_xyz789"

before_script:
  - apk add --no-cache curl jq
  - curl -fsSL https://releases.lux.network/secrets-cli/install.sh | sh
  - export PATH="$PATH:/usr/local/bin"

.inject_secrets: &inject_secrets
  - |
    lux-secrets export --format dotenv \
      --token "$LUX_SECRETS_TOKEN" \
      --org "$LUX_ORG_ID" \
      --project "$LUX_PROJECT_ID" \
      --env "$CI_ENVIRONMENT_NAME" > .env
    export $(cat .env | xargs)

stages:
  - build
  - test
  - deploy

build:
  stage: build
  script:
    - *inject_secrets
    - ./build.sh

test:
  stage: test
  script:
    - *inject_secrets
    - ./test.sh

deploy_staging:
  stage: deploy
  environment:
    name: staging
  script:
    - *inject_secrets
    - ./deploy.sh
  only:
    - develop

deploy_production:
  stage: deploy
  environment:
    name: production
  script:
    - *inject_secrets
    - ./deploy.sh
  when: manual
  only:
    - main
```

```go
// GitLab CI Helper - luxfi/secrets-gitlab
package main

import (
    "context"
    "fmt"
    "os"
    "strings"

    "github.com/luxfi/secrets"
)

func main() {
    ctx := context.Background()

    // Read GitLab CI environment variables
    token := os.Getenv("LUX_SECRETS_TOKEN")
    orgID := os.Getenv("LUX_ORG_ID")
    projectID := os.Getenv("LUX_PROJECT_ID")
    environment := os.Getenv("CI_ENVIRONMENT_NAME")
    if environment == "" {
        environment = "development"
    }

    client, err := secrets.NewClient(&secrets.Config{
        BaseURL:     "https://kchain.lux.network",
        Token:       token,
        OrgID:       orgID,
        ProjectID:   projectID,
        Environment: environment,
    })
    if err != nil {
        fmt.Fprintf(os.Stderr, "Error: %v\n", err)
        os.Exit(1)
    }

    allSecrets, err := client.GetAllSecrets(ctx)
    if err != nil {
        fmt.Fprintf(os.Stderr, "Failed to fetch secrets: %v\n", err)
        os.Exit(1)
    }

    // Output in dotenv format for GitLab CI
    var lines []string
    for key, value := range allSecrets {
        // Escape special characters for shell
        escapedValue := strings.ReplaceAll(value, "'", "'\\''")
        lines = append(lines, fmt.Sprintf("%s='%s'", key, escapedValue))
    }

    fmt.Println(strings.Join(lines, "\n"))
}
```

#### Terraform Provider

```hcl
# Terraform provider for Lux Secrets

terraform {
  required_providers {
    luxsecrets = {
      source  = "luxfi/secrets"
      version = "~> 1.0"
    }
  }
}

provider "luxsecrets" {
  token       = var.lux_secrets_token
  org_id      = var.lux_org_id
  base_url    = "https://kchain.lux.network"  # optional
}

# Data source: Read secret
data "luxsecrets_secret" "database_url" {
  project_id  = "proj_xyz789"
  environment = "production"
  key         = "DATABASE_URL"
}

# Resource: Manage secret
resource "luxsecrets_secret" "api_key" {
  project_id  = "proj_xyz789"
  environment = "production"
  key         = "EXTERNAL_API_KEY"
  value       = var.external_api_key

  type        = "api_key"
  description = "External service API key"
  tags        = ["external", "api"]

  rotation {
    enabled  = true
    interval = "30d"
  }
}

# Resource: Project
resource "luxsecrets_project" "app" {
  org_id      = var.lux_org_id
  name        = "My Application"
  slug        = "my-app"
  description = "Main application secrets"

  settings {
    environments         = ["development", "staging", "production"]
    default_environment  = "development"
    auto_rotate          = true
    rotation_period      = "7776000"  # 90 days in seconds
    require_review_prod  = true
  }
}

# Resource: Environment
resource "luxsecrets_environment" "production" {
  project_id  = luxsecrets_project.app.id
  name        = "Production"
  slug        = "production"

  parent_environment_id = luxsecrets_environment.staging.id
  inherit_secrets       = true

  settings {
    require_approval = true
    approval_count   = 2
    approvers        = [var.admin_address, var.security_address]
  }

  protected = true
}

# Output for use in other resources
output "database_url" {
  value     = data.luxsecrets_secret.database_url.value
  sensitive = true
}
```

```go
// Terraform Provider implementation
package provider

import (
    "context"

    "github.com/hashicorp/terraform-plugin-sdk/v2/diag"
    "github.com/hashicorp/terraform-plugin-sdk/v2/helper/schema"
    "github.com/luxfi/secrets"
)

func Provider() *schema.Provider {
    return &schema.Provider{
        Schema: map[string]*schema.Schema{
            "token": {
                Type:        schema.TypeString,
                Required:    true,
                Sensitive:   true,
                DefaultFunc: schema.EnvDefaultFunc("LUX_SECRETS_TOKEN", nil),
            },
            "org_id": {
                Type:        schema.TypeString,
                Required:    true,
                DefaultFunc: schema.EnvDefaultFunc("LUX_ORG_ID", nil),
            },
            "base_url": {
                Type:     schema.TypeString,
                Optional: true,
                Default:  "https://kchain.lux.network",
            },
        },
        ResourcesMap: map[string]*schema.Resource{
            "luxsecrets_secret":      resourceSecret(),
            "luxsecrets_project":     resourceProject(),
            "luxsecrets_environment": resourceEnvironment(),
            "luxsecrets_policy":      resourcePolicy(),
        },
        DataSourcesMap: map[string]*schema.Resource{
            "luxsecrets_secret":  dataSourceSecret(),
            "luxsecrets_secrets": dataSourceSecrets(),
        },
        ConfigureContextFunc: providerConfigure,
    }
}

func resourceSecret() *schema.Resource {
    return &schema.Resource{
        CreateContext: resourceSecretCreate,
        ReadContext:   resourceSecretRead,
        UpdateContext: resourceSecretUpdate,
        DeleteContext: resourceSecretDelete,

        Schema: map[string]*schema.Schema{
            "project_id": {
                Type:     schema.TypeString,
                Required: true,
                ForceNew: true,
            },
            "environment": {
                Type:     schema.TypeString,
                Required: true,
                ForceNew: true,
            },
            "key": {
                Type:     schema.TypeString,
                Required: true,
                ForceNew: true,
            },
            "value": {
                Type:      schema.TypeString,
                Required:  true,
                Sensitive: true,
            },
            "type": {
                Type:     schema.TypeString,
                Optional: true,
                Default:  "generic",
            },
            "description": {
                Type:     schema.TypeString,
                Optional: true,
            },
            "tags": {
                Type:     schema.TypeList,
                Optional: true,
                Elem:     &schema.Schema{Type: schema.TypeString},
            },
            "version": {
                Type:     schema.TypeInt,
                Computed: true,
            },
        },
    }
}

func resourceSecretCreate(ctx context.Context, d *schema.ResourceData, meta interface{}) diag.Diagnostics {
    client := meta.(*secrets.Client)

    err := client.SetSecret(ctx,
        d.Get("key").(string),
        d.Get("value").(string),
        secrets.WithProject(d.Get("project_id").(string)),
        secrets.WithEnvironment(d.Get("environment").(string)),
        secrets.WithDescription(d.Get("description").(string)),
        secrets.WithSecretType(d.Get("type").(string)),
    )
    if err != nil {
        return diag.FromErr(err)
    }

    d.SetId(fmt.Sprintf("%s/%s/%s",
        d.Get("project_id"),
        d.Get("environment"),
        d.Get("key")))

    return resourceSecretRead(ctx, d, meta)
}
```

### Security Considerations

#### Zero-Knowledge Architecture

```go
// ZeroKnowledge ensures platform never sees plaintext secrets
type ZeroKnowledge struct {
    // Client-side encryption
    // All encryption/decryption happens in client SDKs
    // K-Chain only stores ciphertext

    // Key derivation
    // User's master key derived from password + org salt
    // K-Chain never sees the master key
}

// ClientSideEncryption encrypts before sending to K-Chain
func (c *SecretClient) EncryptLocally(plaintext []byte) (*EncryptedPayload, error) {
    // 1. Derive DEK from user's master key
    dek := c.deriveDEK(c.masterKey, c.currentDEKVersion)

    // 2. Encrypt with AES-256-GCM
    nonce := make([]byte, 12)
    rand.Read(nonce)

    block, _ := aes.NewCipher(dek)
    gcm, _ := cipher.NewGCM(block)

    ciphertext := gcm.Seal(nil, nonce, plaintext, nil)

    // 3. K-Chain stores only ciphertext
    return &EncryptedPayload{
        Ciphertext:  ciphertext[:len(ciphertext)-gcm.Overhead()],
        Nonce:       nonce,
        Tag:         ciphertext[len(ciphertext)-gcm.Overhead():],
        KEKVersion:  c.currentDEKVersion,
    }, nil
}
```

#### End-to-End Encryption

```go
// E2EEncryption ensures secrets are encrypted in transit and at rest
type E2EEncryption struct {
    // Transport: TLS 1.3 with ML-KEM hybrid
    // At Rest: ML-KEM wrapped DEK + AES-256-GCM data encryption
    // Key Hierarchy: User Master Key -> Project KEK -> Environment DEK -> Secret
}

// EncryptionHierarchy
//
// User Master Key (derived from password)
//     |
//     +-> Project KEK (ML-KEM encapsulated)
//             |
//             +-> Environment DEK (AES-256 wrapped)
//                     |
//                     +-> Secret Ciphertext (AES-256-GCM encrypted)
```

#### Threshold Decryption for High-Value Secrets

```go
// ThresholdProtection requires multi-party approval for sensitive secrets
type ThresholdProtection struct {
    TChainKeyID    ids.ID   // T-Chain threshold key
    Threshold      uint32   // Required signers
    Signers        []ids.ID // Authorized signers
}

// RequestThresholdDecryption initiates T-Chain decryption
func (s *SecretService) RequestThresholdDecryption(ctx context.Context, secretID ids.ID) (*DecryptRequest, error) {
    secret := s.state.Secrets[secretID]
    env := s.state.Environments[secret.EnvID]

    if env.Threshold == 0 {
        return nil, fmt.Errorf("secret not threshold protected")
    }

    // Submit to T-Chain for threshold decryption
    // See LP-330 for T-Chain ThresholdVM specification
    return s.tchain.RequestThresholdDecrypt(ctx, &tchain.ThresholdDecryptRequest{
        KeyID:          env.ThresholdKeyID,
        Ciphertext:     secret.KChainSecretID, // Reference to K-Chain encrypted data
        RequiredShares: env.Threshold,
        Deadline:       s.currentBlock() + 300, // 5 minute timeout
    })
}
```

#### Audit Trail and Compliance

```go
// ComplianceAudit provides immutable audit trail
type ComplianceAudit struct {
    // All access logged on-chain
    // Cryptographically verifiable
    // Exportable for compliance reports
}

// GenerateComplianceReport creates SOC2/HIPAA/PCI-DSS compliant reports
func (a *AuditService) GenerateComplianceReport(ctx context.Context, req *ComplianceReportRequest) (*ComplianceReport, error) {
    // Fetch audit logs for time range
    logs, err := a.GetAuditLogs(ctx, req.StartBlock, req.EndBlock)
    if err != nil {
        return nil, err
    }

    report := &ComplianceReport{
        Framework:    req.Framework, // SOC2, HIPAA, PCI-DSS
        StartTime:    req.StartTime,
        EndTime:      req.EndTime,
        GeneratedAt:  time.Now(),

        Summary: ComplianceSummary{
            TotalAccesses:     len(logs),
            UniqueUsers:       countUniqueActors(logs),
            FailedAttempts:    countFailed(logs),
            PolicyViolations:  countViolations(logs),
        },

        AccessLog:     logs,

        // Cryptographic proof of log integrity
        MerkleRoot:    computeMerkleRoot(logs),
        BlockRange:    fmt.Sprintf("%d-%d", req.StartBlock, req.EndBlock),
    }

    return report, nil
}
```

## Rationale

### Why Build on K-Chain?

1. **Native Encryption**: K-Chain provides ML-KEM post-quantum encryption primitives
2. **T-Chain Integration**: Threshold decryption for high-value secrets without additional infrastructure
3. **On-Chain Audit**: Immutable, verifiable audit trail
4. **Decentralization**: No single point of failure

### Why Not Use Existing Solutions?

| Feature | Infisical | HashiCorp Vault | AWS KMS | This Platform |
|---------|-----------|-----------------|---------|---------------|
| Decentralized | No | No | No | Yes |
| Post-Quantum | No | No | No | Yes (ML-KEM) |
| Threshold Access | No | Enterprise | No | Yes (T-Chain) |
| On-Chain Audit | No | No | No | Yes |
| Vendor Lock-in | Some | Yes | Yes | No |
| Self-Sovereign | Partial | Yes | No | Yes |

### Design Decisions

1. **Project/Environment Hierarchy**: Matches common development workflows
2. **Version Control**: Enables rollback and audit without external VCS
3. **SDK-First**: Developer experience prioritized with native SDKs
4. **K8s Native**: First-class Kubernetes integration via operator

## Backwards Compatibility

This LP introduces new functionality on K-Chain with no backwards compatibility concerns.

### Migration from Existing Solutions

```go
// MigrationService helps migrate from other secret managers
type MigrationService struct {
    importers map[string]SecretImporter
}

// Supported migrations
var SupportedMigrations = []string{
    "infisical",
    "hashicorp-vault",
    "aws-secrets-manager",
    "azure-key-vault",
    "gcp-secret-manager",
    "dotenv",
    "kubernetes-secrets",
}

// MigrateFromInfisical imports secrets from Infisical
func (m *MigrationService) MigrateFromInfisical(ctx context.Context, config *InfisicalConfig) (*MigrationResult, error) {
    // 1. Connect to Infisical
    infisical := infisical.NewClient(config.Token)

    // 2. List all projects and environments
    projects, _ := infisical.ListProjects()

    // 3. Import each project
    result := &MigrationResult{}
    for _, proj := range projects {
        // Create project in Lux
        luxProj, _ := m.createProject(ctx, proj.Name, proj.Slug)

        // Import environments
        for _, env := range proj.Environments {
            luxEnv, _ := m.createEnvironment(ctx, luxProj.ProjectID, env.Name)

            // Import secrets
            secrets, _ := infisical.GetSecrets(proj.ID, env.Slug)
            for _, secret := range secrets {
                m.importSecret(ctx, luxEnv.EnvID, secret)
                result.SecretsImported++
            }
        }
        result.ProjectsImported++
    }

    return result, nil
}
```

## Test Cases

### Unit Tests

```go
func TestSecretCRUD(t *testing.T) {
    service := setupTestService(t)
    ctx := context.Background()

    // Create
    secret, err := service.CreateSecret(ctx, &CreateSecretRequest{
        EnvID:       testEnvID,
        Key:         "DATABASE_URL",
        Value:       []byte("postgres://localhost/test"),
        Type:        TypeDatabaseCred,
        Description: "Test database",
    })
    require.NoError(t, err)
    require.Equal(t, uint32(1), secret.Version)

    // Read
    value, err := service.GetSecret(ctx, &GetSecretRequest{
        ProjectID:   testProjectID,
        EnvID:       testEnvID,
        Key:         "DATABASE_URL",
    })
    require.NoError(t, err)
    require.Equal(t, []byte("postgres://localhost/test"), value)

    // Update
    updated, err := service.UpdateSecret(ctx, &UpdateSecretRequest{
        SecretID: secret.SecretID,
        Value:    []byte("postgres://localhost/test_v2"),
        Comment:  "Updated connection",
    })
    require.NoError(t, err)
    require.Equal(t, uint32(2), updated.Version)

    // Delete
    err = service.DeleteSecret(ctx, &DeleteSecretRequest{
        SecretID: secret.SecretID,
    })
    require.NoError(t, err)
}

func TestEnvironmentInheritance(t *testing.T) {
    service := setupTestService(t)
    ctx := context.Background()

    // Create base environment with secrets
    baseEnv := createTestEnvironment(t, "base", ids.Empty)
    service.CreateSecret(ctx, &CreateSecretRequest{
        EnvID: baseEnv.EnvID,
        Key:   "API_KEY",
        Value: []byte("base-key"),
    })
    service.CreateSecret(ctx, &CreateSecretRequest{
        EnvID: baseEnv.EnvID,
        Key:   "DATABASE_URL",
        Value: []byte("base-db"),
    })

    // Create child environment with override
    childEnv := createTestEnvironment(t, "staging", baseEnv.EnvID)
    childEnv.InheritSecrets = true
    service.CreateSecret(ctx, &CreateSecretRequest{
        EnvID: childEnv.EnvID,
        Key:   "DATABASE_URL",
        Value: []byte("staging-db"),
    })

    // Get effective secrets
    effective, err := service.GetEffectiveSecrets(ctx, childEnv.EnvID)
    require.NoError(t, err)

    // Should have API_KEY from base and DATABASE_URL from staging
    apiKey := findSecret(effective, "API_KEY")
    require.NotNil(t, apiKey)
    require.Equal(t, baseEnv.EnvID, apiKey.InheritedFrom)

    dbURL := findSecret(effective, "DATABASE_URL")
    require.NotNil(t, dbURL)
    require.Equal(t, childEnv.EnvID, dbURL.InheritedFrom)
    require.True(t, dbURL.IsOverride)
}

func TestAccessControl(t *testing.T) {
    service := setupTestService(t)
    ctx := context.Background()

    // Create policy with role assignment
    policy := &AccessPolicy{
        PolicyID:  ids.GenerateID(),
        OrgID:     testOrgID,
        ProjectID: testProjectID,
        Assignments: []RoleAssignment{
            {
                PrincipalType: PrincipalUser,
                PrincipalID:   developerID,
                Role:          RoleDeveloper,
                Environments:  []string{"development", "staging"},
            },
        },
    }

    // Developer should access dev
    ctx = withUser(ctx, developerID)
    err := service.checkAccess(ctx, devEnvID, ActionRead)
    require.NoError(t, err)

    // Developer should NOT access production
    err = service.checkAccess(ctx, prodEnvID, ActionRead)
    require.ErrorIs(t, err, ErrAccessDenied)
}

func TestVersionRollback(t *testing.T) {
    service := setupTestService(t)
    ctx := context.Background()

    // Create and update secret multiple times
    secret, _ := service.CreateSecret(ctx, &CreateSecretRequest{
        EnvID: testEnvID,
        Key:   "CONFIG",
        Value: []byte("v1"),
    })

    service.UpdateSecret(ctx, &UpdateSecretRequest{
        SecretID: secret.SecretID,
        Value:    []byte("v2"),
    })

    service.UpdateSecret(ctx, &UpdateSecretRequest{
        SecretID: secret.SecretID,
        Value:    []byte("v3"),
    })

    // Rollback to v1
    err := service.RollbackSecret(ctx, &RollbackRequest{
        SecretID:      secret.SecretID,
        TargetVersion: 1,
        Comment:       "Reverting to known good",
    })
    require.NoError(t, err)

    // Verify current value is v1
    value, _ := service.GetSecret(ctx, &GetSecretRequest{
        SecretID: secret.SecretID,
    })
    require.Equal(t, []byte("v1"), value)

    // Version should be 4 (v1 re-applied)
    updated := service.state.Secrets[secret.SecretID]
    require.Equal(t, uint32(4), updated.Version)
}
```

### Integration Tests

```go
func TestKChainIntegration(t *testing.T) {
    if testing.Short() {
        t.Skip("Skipping K-Chain integration test")
    }

    // Connect to testnet K-Chain
    kchain := kchain.NewClient("https://kchain-testnet.lux.network")
    service := NewSecretService(kchain, nil)

    ctx := context.Background()

    // Create secret (should encrypt via K-Chain)
    secret, err := service.CreateSecret(ctx, &CreateSecretRequest{
        EnvID: testEnvID,
        Key:   "INTEGRATION_TEST",
        Value: []byte("test-value"),
    })
    require.NoError(t, err)

    // Verify K-Chain secret exists
    kchainSecret, err := kchain.GetSecret(ctx, secret.KChainSecretID)
    require.NoError(t, err)
    require.NotNil(t, kchainSecret)

    // Retrieve and decrypt
    value, err := service.GetSecret(ctx, &GetSecretRequest{
        SecretID: secret.SecretID,
    })
    require.NoError(t, err)
    require.Equal(t, []byte("test-value"), value)
}

func TestThresholdDecryption(t *testing.T) {
    if testing.Short() {
        t.Skip("Skipping T-Chain integration test")
    }

    kchain := kchain.NewClient("https://kchain-testnet.lux.network")
    tchain := tchain.NewClient("https://tchain-testnet.lux.network")
    service := NewSecretService(kchain, tchain)

    ctx := context.Background()

    // Create threshold-protected environment
    env := createTestEnvironment(t, "production", ids.Empty)
    env.ThresholdKeyID = testThresholdKeyID
    env.Threshold = 2

    // Create secret in threshold environment
    secret, _ := service.CreateSecret(ctx, &CreateSecretRequest{
        EnvID: env.EnvID,
        Key:   "HIGH_VALUE_KEY",
        Value: []byte("super-secret"),
    })

    // Request decryption (should require T-Chain approval)
    request, err := service.GetSecret(ctx, &GetSecretRequest{
        SecretID: secret.SecretID,
    })
    require.Error(t, err) // Should fail without threshold approval
    require.Contains(t, err.Error(), "threshold approval required")

    // Simulate T-Chain approval (2 of 3 signers)
    simulateThresholdApproval(t, tchain, request.RequestID, 2)

    // Now retrieval should succeed
    value, err := service.GetSecret(ctx, &GetSecretRequest{
        SecretID: secret.SecretID,
    })
    require.NoError(t, err)
    require.Equal(t, []byte("super-secret"), value)
}
```

### Test Vectors

This section provides concrete test vectors for implementers to validate their implementations.

#### Organization Creation Test Vector

```json
{
  "test_id": "TV-ORG-001",
  "description": "Create organization with default settings",
  "input": {
    "name": "Acme Corporation",
    "slug": "acme-corp",
    "owner": "0x8db97C7cEcE249c2b98bDC0226Cc4C2A57BF52FC",
    "plan": "team"
  },
  "expected_output": {
    "org_id": "2ZpGhv4VYD8e3YkW9rN1xQ5mKjHpLfAb7cRtUoXiJn6s",
    "settings": {
      "require_mfa": false,
      "default_mlkem_level": 3,
      "require_threshold": false,
      "audit_retention": 2592000
    }
  }
}
```

#### Secret Encryption Test Vector

```json
{
  "test_id": "TV-SECRET-001",
  "description": "Encrypt a database credential secret",
  "input": {
    "key": "DATABASE_URL",
    "plaintext": "postgres://admin:s3cr3t@db.example.com:5432/production",
    "type": "database_cred",
    "environment": "production",
    "mlkem_level": 3
  },
  "kek_id": "K3y8nM2pL4vR6wX9qA1sC5fG7hJ0tB",
  "expected_hash": "a7f3b2c1d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1",
  "encrypted_length_min": 128,
  "encrypted_length_max": 256
}
```

#### Secret Version History Test Vector

```json
{
  "test_id": "TV-VERSION-001",
  "description": "Version history after multiple updates",
  "initial_value": "v1-initial",
  "updates": [
    {"value": "v2-updated", "comment": "First update"},
    {"value": "v3-final", "comment": "Second update"}
  ],
  "expected_versions": [
    {"version": 1, "status": "archived", "change_type": "created"},
    {"version": 2, "status": "archived", "change_type": "updated"},
    {"version": 3, "status": "active", "change_type": "updated"}
  ],
  "rollback_to": 1,
  "expected_after_rollback": {
    "current_version": 4,
    "current_value": "v1-initial",
    "latest_change_type": "rolled"
  }
}
```

#### Environment Inheritance Test Vector

```json
{
  "test_id": "TV-INHERIT-001",
  "description": "Secret inheritance across environment hierarchy",
  "environments": [
    {
      "name": "base",
      "slug": "base",
      "parent": null,
      "secrets": {
        "API_URL": "https://api.example.com",
        "LOG_LEVEL": "info",
        "DATABASE_URL": "postgres://localhost/dev"
      }
    },
    {
      "name": "staging",
      "slug": "staging",
      "parent": "base",
      "inherit_secrets": true,
      "secrets": {
        "DATABASE_URL": "postgres://staging.db/app",
        "CACHE_URL": "redis://staging.cache:6379"
      }
    },
    {
      "name": "production",
      "slug": "production",
      "parent": "staging",
      "inherit_secrets": true,
      "secrets": {
        "DATABASE_URL": "postgres://prod.db/app",
        "LOG_LEVEL": "warn"
      }
    }
  ],
  "expected_effective_secrets": {
    "production": {
      "API_URL": {"value": "https://api.example.com", "inherited_from": "base"},
      "LOG_LEVEL": {"value": "warn", "inherited_from": "production", "is_override": true},
      "DATABASE_URL": {"value": "postgres://prod.db/app", "inherited_from": "production", "is_override": true},
      "CACHE_URL": {"value": "redis://staging.cache:6379", "inherited_from": "staging"}
    }
  }
}
```

#### Access Control Test Vector

```json
{
  "test_id": "TV-RBAC-001",
  "description": "Role-based access control validation",
  "policy": {
    "org_id": "org_abc123",
    "project_id": "proj_xyz789",
    "assignments": [
      {
        "principal_type": "user",
        "principal_id": "user_developer",
        "role": "developer",
        "environments": ["development", "staging"]
      },
      {
        "principal_type": "user",
        "principal_id": "user_admin",
        "role": "admin",
        "environments": ["*"]
      }
    ]
  },
  "test_cases": [
    {
      "actor": "user_developer",
      "environment": "development",
      "action": "read",
      "expected": "allowed"
    },
    {
      "actor": "user_developer",
      "environment": "production",
      "action": "read",
      "expected": "denied",
      "error": "ErrAccessDenied"
    },
    {
      "actor": "user_admin",
      "environment": "production",
      "action": "delete",
      "expected": "allowed"
    }
  ]
}
```

#### Rotation Protocol Test Vector

```json
{
  "test_id": "TV-ROTATE-001",
  "description": "Automated secret rotation lifecycle",
  "secret": {
    "key": "DB_PASSWORD",
    "type": "database_cred",
    "auto_rotate": true,
    "rotation_period": 7776000,
    "provider_type": "postgres",
    "provider_config": {
      "host": "db.example.com",
      "username": "app_user",
      "database": "production"
    }
  },
  "rotation_sequence": [
    {"state": "scheduled", "scheduled_at": 1000000},
    {"state": "rotating", "started_at": 1000000},
    {"state": "active", "completed_at": 1000001, "new_version": 2}
  ],
  "failure_scenario": {
    "error": "connection refused",
    "retries": 3,
    "final_state": "failed"
  },
  "rollback_expected": {
    "state": "active",
    "version": 1
  }
}
```

#### CLI Usage Test Vector

```bash
# TV-CLI-001: Complete CLI workflow test

# Setup
export LUX_SECRETS_TOKEN="lux_sk_test_abc123..."
export LUX_ORG_ID="org_abc123"
export LUX_PROJECT_ID="proj_xyz789"
export LUX_ENVIRONMENT="development"

# Test 1: Create secret
$ lux-secrets set DATABASE_URL "postgres://localhost/dev" --type database_cred
# Expected: Secret created successfully

# Test 2: Read secret
$ lux-secrets get DATABASE_URL
# Expected output: postgres://localhost/dev

# Test 3: List secrets
$ lux-secrets list --format json
# Expected output:
# {"secrets":[{"key":"DATABASE_URL","type":"database_cred","version":1}]}

# Test 4: Export to dotenv
$ lux-secrets export --format dotenv
# Expected output: DATABASE_URL=postgres://localhost/dev

# Test 5: Run with injected secrets
$ lux-secrets run -- printenv DATABASE_URL
# Expected output: postgres://localhost/dev

# Test 6: Rollback
$ lux-secrets set DATABASE_URL "postgres://localhost/dev_v2"
$ lux-secrets rollback DATABASE_URL --version 1 --comment "Reverting"
$ lux-secrets get DATABASE_URL
# Expected output: postgres://localhost/dev

# Test 7: View audit log
$ lux-secrets audit --key DATABASE_URL --limit 5
# Expected: List of 5 audit events for DATABASE_URL
```

#### API Response Test Vectors

```json
{
  "test_id": "TV-API-001",
  "description": "API response format validation",
  "endpoints": [
    {
      "method": "GET",
      "path": "/api/v1/secrets/proj_xyz789/production/DATABASE_URL",
      "headers": {
        "Authorization": "Bearer lux_sk_test_...",
        "X-Org-Id": "org_abc123"
      },
      "expected_status": 200,
      "expected_body": {
        "key": "DATABASE_URL",
        "value": "<decrypted_value>",
        "type": "database_cred",
        "version": 1,
        "created_at": "<timestamp>",
        "updated_at": "<timestamp>"
      }
    },
    {
      "method": "GET",
      "path": "/api/v1/secrets/proj_xyz789/production/NONEXISTENT",
      "expected_status": 404,
      "expected_body": {
        "error": "secret_not_found",
        "message": "Secret 'NONEXISTENT' not found in environment 'production'"
      }
    },
    {
      "method": "PUT",
      "path": "/api/v1/secrets/proj_xyz789/production/NEW_SECRET",
      "body": {
        "value": "secret-value",
        "type": "generic",
        "description": "Test secret"
      },
      "expected_status": 201,
      "expected_body": {
        "key": "NEW_SECRET",
        "version": 1,
        "created": true
      }
    }
  ]
}
```

## Reference Implementation

### Repository Structure

```
github.com/luxfi/secrets-platform/
├── api/
│   ├── proto/                    # gRPC/Protobuf definitions
│   └── openapi/                  # OpenAPI specs
├── cmd/
│   ├── secrets-service/          # Main service binary
│   └── secrets-cli/              # CLI tool
├── internal/
│   ├── service/
│   │   ├── secret.go             # Secret operations
│   │   ├── project.go            # Project management
│   │   ├── environment.go        # Environment management
│   │   ├── access.go             # Access control
│   │   ├── audit.go              # Audit logging
│   │   ├── rotation.go           # Secret rotation
│   │   └── import_export.go      # Import/export
│   ├── storage/
│   │   ├── kchain.go             # K-Chain integration
│   │   └── state.go              # Platform state
│   ├── auth/
│   │   ├── token.go              # Token validation
│   │   └── rbac.go               # RBAC engine
│   └── integration/
│       ├── kubernetes/           # K8s operator
│       ├── terraform/            # Terraform provider
│       └── cicd/                 # CI/CD integrations
├── sdk/
│   ├── go/                       # Go SDK
│   ├── typescript/               # TypeScript SDK
│   └── python/                   # Python SDK
├── operator/                     # Kubernetes operator
└── terraform/                    # Terraform provider

github.com/luxfi/node/vms/kmsvm/
└── secrets/                      # K-Chain secrets extension
    ├── service.go
    ├── tx/
    │   ├── create_project.go
    │   ├── create_environment.go
    │   └── ...
    └── state.go
```

## Security Considerations

This specification implements multiple layers of security for secrets management:

1. **Zero-Knowledge Architecture**: The K-Chain platform never sees plaintext secrets. All encryption and decryption operations occur client-side, with only ciphertext stored on-chain.

2. **End-to-End Encryption**: Secrets are encrypted at rest using AES-256-GCM and in transit using TLS 1.3 with ML-KEM hybrid key exchange for quantum resistance.

3. **Client-Side Key Derivation**: User master keys are derived locally from password and organization salt using HKDF-SHA256. The platform never has access to master keys.

4. **Access Control**: Fine-grained RBAC with environment-based access policies. All access is audited on-chain for compliance.

5. **Threshold Signature Integration**: Critical operations require T-Chain threshold signatures, preventing single-point-of-compromise attacks.

6. **Post-Quantum Cryptography**: ML-KEM encryption ensures long-term security against future quantum computing attacks.

7. **Audit Logging**: All secret access events are recorded on-chain, providing immutable audit trails for compliance (SOC 2, ISO 27001).

See Section "Security Considerations" within the Specification for detailed implementation including zero-knowledge proofs and end-to-end encryption flows.

## References

1. [LP-330](./lp-0330-t-chain-thresholdvm-specification.md) - T-Chain ThresholdVM Specification
2. [LP-336](./lp-0336-k-chain-keymanagementvm-specification.md) - K-Chain KeyManagementVM Specification
3. Infisical Documentation - https://infisical.com/docs
4. HashiCorp Vault - https://www.vaultproject.io/docs
5. NIST FIPS 203 - ML-KEM Standard
6. SOC 2 Type II Compliance - https://www.aicpa.org/soc2

## Copyright

Copyright and related rights waived via [CC0](../LICENSE.md).
