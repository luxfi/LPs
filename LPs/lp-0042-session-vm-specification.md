---
lp: 42
title: SessionVM - Post-Quantum Secure Messaging Virtual Machine
tags: [vm, session, messaging, post-quantum, privacy]
description: Specification for SessionVM, a Lux virtual machine providing post-quantum secure session-based messaging
author: Lux Core Team (@luxfi)
status: Draft
type: Standards Track
category: VM
created: 2026-01-23
discussions-to: https://github.com/luxfi/lps/discussions
order: 42
tier: core
---

## Abstract

SessionVM is a Lux virtual machine that provides post-quantum secure session-based messaging capabilities. It enables encrypted communication sessions between participants using ML-KEM for key exchange and ML-DSA for signatures.

## Motivation

As quantum computing advances, current cryptographic schemes become vulnerable. SessionVM provides:

1. **Post-Quantum Security**: Uses NIST-standardized ML-KEM-768 and ML-DSA-65 algorithms
2. **Session-Based Communication**: Encrypted channels with automatic key rotation
3. **Decentralized Infrastructure**: No central servers, messages are stored on-chain
4. **Privacy by Default**: All messages are encrypted, no metadata leakage

### Use Cases

- **Private Messaging**: Secure communication between parties
- **Group Channels**: Multi-party encrypted communication
- **IoT Communication**: Secure device-to-device messaging
- **Cross-Chain Messaging**: Foundation for secure Warp messages

## Specification

### VM Identification

- **VMID**: `speKUgLBX6WRD5cfGeEfLa43LxTXUBckvtv4td6F3eTXvRP48`
- **Name**: `sessionvm`
- **Repository**: `github.com/luxfi/session`

### Core Components

#### Session

A session represents an encrypted communication channel between participants.

```go
type Session struct {
    ID           ids.ID            // Unique session identifier
    Participants []ids.ID          // Session participants
    PublicKeys   [][]byte          // ML-KEM public keys
    Created      time.Time         // Creation timestamp
    Expires      time.Time         // Expiration timestamp
    Status       string            // pending|active|expired|closed
    Metadata     map[string]string // Optional metadata
}
```

#### Message

An encrypted message within a session.

```go
type Message struct {
    ID         ids.ID    // Unique message identifier
    SessionID  ids.ID    // Parent session
    Sender     ids.ID    // Sender identifier
    Ciphertext []byte    // ML-KEM encrypted content
    Signature  []byte    // ML-DSA signature
    Timestamp  time.Time // Message timestamp
    Sequence   uint64    // Sequence number for ordering
}
```

### RPC API

SessionVM exposes a JSON-RPC API:

#### sessionvm.CreateSession

Create a new encrypted session.

**Parameters:**
- `participants`: Array of participant IDs
- `publicKeys`: Array of hex-encoded ML-KEM public keys

**Returns:**
- `sessionId`: Created session ID
- `expires`: Expiration timestamp (Unix)

#### sessionvm.SendMessage

Send an encrypted message within a session.

**Parameters:**
- `sessionId`: Target session ID
- `sender`: Sender ID
- `ciphertext`: Hex-encoded encrypted message
- `signature`: Hex-encoded ML-DSA signature

**Returns:**
- `messageId`: Created message ID
- `sequence`: Message sequence number

#### sessionvm.GetSession

Retrieve session details.

**Parameters:**
- `sessionId`: Session ID to retrieve

**Returns:**
- `session`: Session object

#### sessionvm.Health

Health check endpoint.

**Returns:**
- `healthy`: Boolean health status
- `sessions`: Active session count
- `channels`: Active channel count

### Configuration

SessionVM configuration options:

```json
{
  "sessionTTL": 86400,      // Session lifetime in seconds (default: 24h)
  "maxMessages": 10000,      // Max messages per session
  "maxChannels": 1000,       // Max channels
  "retentionDays": 30,       // Message retention period
  "idPrefix": "07"           // Post-quantum session ID prefix
}
```

### Cryptographic Schemes

SessionVM uses NIST-standardized post-quantum algorithms:

| Algorithm | Purpose | NIST Standard |
|:----------|:--------|:--------------|
| ML-KEM-768 | Key encapsulation | FIPS 203 |
| ML-DSA-65 | Digital signatures | FIPS 204 |

### Plugin Installation

SessionVM runs as a Lux node plugin:

```bash
# Build the plugin
cd ~/work/lux/session
go build -o sessionvm ./plugin/

# Install to plugin directory
cp sessionvm ~/.lux/plugins/speKUgLBX6WRD5cfGeEfLa43LxTXUBckvtv4td6F3eTXvRP48
```

Or use `parsd` which auto-installs both EVM and SessionVM:

```bash
parsd  # Automatically configures EVM + SessionVM
```

## Rationale

### Why a Separate VM?

1. **Separation of Concerns**: Messaging logic is distinct from EVM smart contracts
2. **Optimized Storage**: Purpose-built for session/message data structures
3. **Independent Scaling**: Can scale messaging independently of EVM execution
4. **Composability**: Can be combined with EVM for rich applications

### Why Post-Quantum?

Current asymmetric cryptography (RSA, ECDSA, ECDH) is vulnerable to quantum attacks. SessionVM uses lattice-based cryptography that is believed to be quantum-resistant.

## Backwards Compatibility

SessionVM is a new VM and has no backwards compatibility concerns. It is designed to work alongside existing VMs (particularly EVM) on the same Lux subnet.

## Security Considerations

1. **Key Management**: Session keys should be derived from user-controlled ML-KEM keys
2. **Forward Secrecy**: Consider implementing key rotation within sessions
3. **Metadata Protection**: Session IDs use "07" prefix to indicate PQ encryption
4. **Message Ordering**: Sequence numbers prevent replay attacks

## Reference Implementation

The reference implementation is available at:
- **Repository**: https://github.com/luxfi/session
- **VMID**: `speKUgLBX6WRD5cfGeEfLa43LxTXUBckvtv4td6F3eTXvRP48`

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
