---
lp: 6462
title: LuxChat Group Chat (MLS)
description: LuxChat Group Chat (MLS) specification for LuxDA Bus
author: Lux Protocol Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Standards Track
category: Core
created: 2026-01-02
requires: [2200, 2211]
tags: [luxda-bus, e2ee, chat, pqc]
---

## Abstract

This LP defines group chat encryption for LuxDA using MLS (Messaging Layer Security, RFC 9420) semantics. Groups support efficient member addition/removal, forward secrecy, and post-compromise security with post-quantum key encapsulation.

## Motivation

Group messaging requires:

1. **Scalable Key Management**: Efficient for large groups
2. **Dynamic Membership**: Add/remove without re-keying all
3. **Forward Secrecy**: Past messages protected
4. **Post-Compromise Security**: Recovery after member compromise
5. **Transcript Consistency**: All members see same history

## Specification

### 1. Group Namespace

#### 1.1 Group ID and Namespace

```go
type GroupID [32]byte

func GenerateGroupID() GroupID {
    var id GroupID
    rand.Read(id[:])
    return id
}

func GroupNamespace(groupID GroupID) [20]byte {
    return DeriveNamespace("lux.group.v1", groupID[:])
}
```

#### 1.2 Group Policy

```go
type GroupPolicy struct {
    // Membership control
    AddMemberPolicy    MembershipPolicy
    RemoveMemberPolicy MembershipPolicy

    // Message policies
    AllowExternalSenders bool
    RequireEncryption    bool

    // Crypto requirements
    MinCipherSuite CipherSuite
    RequirePQ      bool

    // Administrative
    Admins []Identity
}

type MembershipPolicy uint8
const (
    PolicyAdminOnly    MembershipPolicy = 1
    PolicyAnyMember    MembershipPolicy = 2
    PolicyInviteOnly   MembershipPolicy = 3
)
```

### 2. MLS Core Concepts

#### 2.1 Ratchet Tree

```go
type RatchetTree struct {
    // Tree structure (binary tree)
    Nodes []TreeNode

    // Leaf count
    LeafCount uint32
}

type TreeNode struct {
    // Node type
    Type NodeType

    // For leaf nodes
    KeyPackage *KeyPackage
    MemberID   *Identity

    // For parent nodes
    PublicKey  []byte
    UnmergedLeaves []uint32
}

type NodeType uint8
const (
    NodeLeaf   NodeType = 1
    NodeParent NodeType = 2
    NodeBlank  NodeType = 3
)
```

#### 2.2 Group State

```go
type GroupState struct {
    // Group identification
    GroupID     GroupID
    Epoch       uint64

    // Tree
    Tree        *RatchetTree

    // Secrets
    GroupSecret []byte
    EpochSecret []byte

    // Derived keys
    SenderDataSecret []byte
    EncryptionSecret []byte
    ExporterSecret   []byte
    ConfirmationKey  []byte
    MembershipKey    []byte

    // Transcript hash
    ConfirmedTranscriptHash []byte
    InterimTranscriptHash   []byte
}
```

#### 2.3 Key Schedule

```go
func DeriveEpochSecrets(groupSecret, commitSecret []byte, context *GroupContext) *EpochSecrets {
    // Joiner secret
    joinerSecret := HKDF(groupSecret, "joiner")

    // Combine with commit
    epochSecret := HKDF(joinerSecret, commitSecret)

    // Derive application secrets
    return &EpochSecrets{
        SenderDataSecret: HKDF(epochSecret, "sender data", context),
        EncryptionSecret: HKDF(epochSecret, "encryption", context),
        ExporterSecret:   HKDF(epochSecret, "exporter", context),
        ConfirmationKey:  HKDF(epochSecret, "confirm", context),
        MembershipKey:    HKDF(epochSecret, "membership", context),
        ResumptionSecret: HKDF(epochSecret, "resumption", context),
        EpochAuthenticator: HMAC(confirmationKey, confirmedTranscriptHash),
    }
}
```

### 3. MLS Messages

#### 3.1 Message Types

```go
type MLSMessage struct {
    Version     uint8
    MessageType MLSMessageType
    Payload     []byte
}

type MLSMessageType uint8
const (
    MLSWelcome       MLSMessageType = 1
    MLSGroupInfo     MLSMessageType = 2
    MLSKeyPackage    MLSMessageType = 3
    MLSProposal      MLSMessageType = 4
    MLSCommit        MLSMessageType = 5
    MLSApplication   MLSMessageType = 6
)
```

#### 3.2 Proposal Types

```go
type Proposal struct {
    Type    ProposalType
    Payload []byte
}

type ProposalType uint8
const (
    ProposalAdd            ProposalType = 1
    ProposalUpdate         ProposalType = 2
    ProposalRemove         ProposalType = 3
    ProposalPreSharedKey   ProposalType = 4
    ProposalReInit         ProposalType = 5
    ProposalExternalInit   ProposalType = 6
    ProposalGroupContextExt ProposalType = 7
)
```

#### 3.3 Commit Message

```go
type Commit struct {
    // Proposals included in this commit
    Proposals []ProposalOrRef

    // Path update (new ratchet keys)
    Path *UpdatePath
}

type UpdatePath struct {
    // Sender's new leaf
    LeafNode *LeafNode

    // Path from leaf to root
    Nodes []UpdatePathNode
}

type UpdatePathNode struct {
    EncryptionKey []byte    // HPKE public key
    Ciphertexts   [][]byte  // Encrypted path secret for each resolution
}
```

### 4. Group Operations

#### 4.1 Create Group

```go
func CreateGroup(creator *KeyPackage, groupID GroupID, policy *GroupPolicy) (*GroupState, error) {
    // Initialize tree with creator as only leaf
    tree := NewRatchetTree()
    tree.AddLeaf(creator)

    // Initialize secrets
    initSecret := RandomBytes(32)
    groupSecret := HKDF(initSecret, "init")

    // Create initial state
    state := &GroupState{
        GroupID:     groupID,
        Epoch:       0,
        Tree:        tree,
        GroupSecret: groupSecret,
    }

    // Derive epoch secrets
    state.DeriveEpochSecrets()

    return state, nil
}
```

#### 4.2 Add Member

```go
func (g *GroupState) AddMember(newMember *KeyPackage) (*Commit, *Welcome, error) {
    // Create Add proposal
    addProposal := &Proposal{
        Type:    ProposalAdd,
        Payload: newMember.Encode(),
    }

    // Generate commit
    commit, err := g.GenerateCommit([]*Proposal{addProposal})
    if err != nil {
        return nil, nil, err
    }

    // Generate Welcome for new member
    welcome, err := g.GenerateWelcome(newMember, commit)
    if err != nil {
        return nil, nil, err
    }

    return commit, welcome, nil
}
```

#### 4.3 Remove Member

```go
func (g *GroupState) RemoveMember(memberIndex uint32) (*Commit, error) {
    // Create Remove proposal
    removeProposal := &Proposal{
        Type:    ProposalRemove,
        Payload: encodeUint32(memberIndex),
    }

    // Generate commit
    return g.GenerateCommit([]*Proposal{removeProposal})
}
```

#### 4.4 Update Keys

```go
func (g *GroupState) UpdateKeys() (*Commit, error) {
    // Create Update proposal with new key package
    newKeyPackage := GenerateKeyPackage(g.MyIdentity)
    updateProposal := &Proposal{
        Type:    ProposalUpdate,
        Payload: newKeyPackage.Encode(),
    }

    return g.GenerateCommit([]*Proposal{updateProposal})
}
```

### 5. Welcome Message

#### 5.1 Welcome Structure

```go
type Welcome struct {
    CipherSuite   CipherSuite
    Secrets       []EncryptedGroupSecrets
    EncryptedGroupInfo []byte
}

type EncryptedGroupSecrets struct {
    NewMemberKeyPackageHash []byte
    HPKECiphertext          []byte  // Encrypted to new member's init key
}
```

#### 5.2 Join Group

```go
func JoinGroup(welcome *Welcome, myKeyPackage *KeyPackage, myPrivKey []byte) (*GroupState, error) {
    // Find my encrypted secrets
    var mySecrets *EncryptedGroupSecrets
    myHash := KeyPackageHash(myKeyPackage)
    for _, secrets := range welcome.Secrets {
        if bytes.Equal(secrets.NewMemberKeyPackageHash, myHash) {
            mySecrets = &secrets
            break
        }
    }
    if mySecrets == nil {
        return nil, ErrNotInWelcome
    }

    // Decrypt group secrets using HPKE
    groupSecrets, err := HPKEDecrypt(
        myKeyPackage.InitKey,
        myPrivKey,
        mySecrets.HPKECiphertext,
    )
    if err != nil {
        return nil, err
    }

    // Decrypt group info
    groupInfo, err := DecryptGroupInfo(
        welcome.EncryptedGroupInfo,
        groupSecrets,
    )
    if err != nil {
        return nil, err
    }

    // Build state from group info
    return BuildStateFromGroupInfo(groupInfo, groupSecrets)
}
```

### 6. Application Messages

#### 6.1 Message Encryption

```go
type MLSApplicationMessage struct {
    GroupID     GroupID
    Epoch       uint64
    ContentType ContentType
    Sender      LeafIndex
    Ciphertext  []byte
}

func (g *GroupState) EncryptMessage(content []byte) (*MLSApplicationMessage, error) {
    // Get sender data key
    senderDataKey := g.GetSenderDataKey(g.MyLeafIndex)

    // Derive message key (secret tree ratchet)
    messageKey := g.RatchetMessageKey(g.MyLeafIndex)

    // Build authenticated data
    aad := buildAAD(g.GroupID, g.Epoch, g.MyLeafIndex)

    // AEAD encrypt
    nonce := DeriveNonce(messageKey, g.SendCounter)
    ciphertext := AESGCMEncrypt(messageKey, nonce, content, aad)

    g.SendCounter++

    return &MLSApplicationMessage{
        GroupID:     g.GroupID,
        Epoch:       g.Epoch,
        ContentType: ContentApplication,
        Sender:      g.MyLeafIndex,
        Ciphertext:  ciphertext,
    }, nil
}
```

#### 6.2 Message Decryption

```go
func (g *GroupState) DecryptMessage(msg *MLSApplicationMessage) ([]byte, error) {
    // Verify epoch
    if msg.Epoch != g.Epoch {
        return nil, ErrWrongEpoch
    }

    // Get message key for sender
    messageKey := g.GetMessageKey(msg.Sender)

    // Build AAD
    aad := buildAAD(msg.GroupID, msg.Epoch, msg.Sender)

    // Decrypt
    return AESGCMDecrypt(messageKey, nonce, msg.Ciphertext, aad)
}
```

### 7. Secret Tree

#### 7.1 Tree Derivation

```go
type SecretTree struct {
    Secrets []TreeSecret
}

type TreeSecret struct {
    Secret      []byte
    Generation  uint32
}

func (st *SecretTree) GetMessageKey(leafIndex uint32) []byte {
    // Get secret for leaf
    secret := st.Secrets[leafIndex]

    // Derive message key
    messageKey := HKDF(secret.Secret, "message", secret.Generation)

    // Ratchet
    st.Secrets[leafIndex] = TreeSecret{
        Secret:     HKDF(secret.Secret, "next"),
        Generation: secret.Generation + 1,
    }

    return messageKey
}
```

### 8. PQ Extensions

#### 8.1 PQ Cipher Suites

```go
const (
    // Classical (for comparison)
    MLS_128_DHKEMX25519_AES128GCM_SHA256_Ed25519 CipherSuite = 0x0001

    // PQ/Hybrid
    MLS_256_XWING_AES256GCM_SHA384_Ed25519_MLDSA CipherSuite = 0x0101
    MLS_256_MLKEM768_AES256GCM_SHA384_MLDSA65    CipherSuite = 0x0102
)
```

#### 8.2 Hybrid HPKE

```go
func HybridHPKEEncap(classicalPub, pqPub []byte) (ciphertext, sharedSecret []byte) {
    // X25519 DH
    ephPriv, ephPub := GenerateX25519()
    dhSecret := X25519(ephPriv, classicalPub)

    // ML-KEM encapsulation
    pqCiphertext, pqSecret := MLKEMEncapsulate(pqPub)

    // Combine secrets
    sharedSecret = HKDF(concat(dhSecret, pqSecret), "hybrid")
    ciphertext = concat(ephPub, pqCiphertext)

    return
}
```

### 9. Bus Integration

#### 9.1 Message Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    Group Namespace                           │
│                /lux/mainnet/group/{groupID}                 │
├─────────────────────────────────────────────────────────────┤
│ Seq 1: Welcome (to new member namespace)                    │
│ Seq 2: Commit (Add member)                                  │
│ Seq 3: Application message                                  │
│ Seq 4: Application message                                  │
│ Seq 5: Commit (Update keys)                                 │
│ Seq 6: Application message                                  │
│ ...                                                         │
└─────────────────────────────────────────────────────────────┘
```

#### 9.2 Header AAD Binding

```go
func (g *GroupState) BuildAAD(header *MsgHeader) []byte {
    return concat(
        header.NamespaceId[:],
        uint64ToBytes(header.Seq),
        g.GroupID[:],
        uint64ToBytes(g.Epoch),
    )
}
```

## Rationale

### Why MLS?

- IETF standard (RFC 9420)
- Designed for asynchronous messaging
- Efficient for large groups
- Built-in PQ support path

### Why Ratchet Tree?

- O(log n) complexity for updates
- Forward secrecy per message
- Post-compromise security via commits

### Why Epoch-Based Security?

- Clean security boundaries
- All state changes via commits
- Auditable security evolution

## Security Considerations

### Forward Secrecy

- Each epoch has independent secrets
- Past epochs unrecoverable after key deletion
- Message keys ratchet within epoch

### Post-Compromise Security

- Update proposal refreshes member's keys
- Commit forces new epoch
- Compromised member loses access after removal

### Transcript Consistency

- Transcript hash chains messages
- All members verify same transcript
- Divergence detectable

## Test Plan

### Unit Tests

1. **Tree Operations**: Add, remove, update nodes
2. **Key Derivation**: Verify against test vectors
3. **Encrypt/Decrypt**: Round-trip messages

### Integration Tests

1. **Group Lifecycle**: Create → Add → Message → Remove
2. **Multi-Device**: Same user, multiple devices
3. **Large Groups**: 100+ member groups

### Interop Tests

1. **RFC 9420 Vectors**: Test against official vectors
2. **Cross-Implementation**: Test with other MLS implementations

## References

- [MLS RFC 9420](https://www.rfc-editor.org/rfc/rfc9420)
- [MLS Architecture RFC 9420bis](https://www.ietf.org/archive/id/draft-ietf-mls-architecture-13.html)
- [OpenMLS](https://openmls.tech/)
- [Signal Groups](https://signal.org/docs/)

---

*LP-6462 v1.0.0 - 2026-01-02*
