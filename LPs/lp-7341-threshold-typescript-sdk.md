---
lp: 7341
title: "@luxfi/threshold TypeScript SDK"
description: TypeScript SDK for interacting with T-Chain threshold signature services
author: Lux Industries Inc.
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Standards Track
category: Interface
created: 2025-12-17
requires: 7330, 7340
tags: [sdk, typescript, threshold-crypto]
---

## Abstract

This LP specifies `@luxfi/threshold`, the TypeScript SDK for interacting with T-Chain (ThresholdVM) threshold signature services. The SDK provides a high-level client for key generation, signing, resharing, and key management operations, abstracting the JSON-RPC protocol into a clean async/await interface.

## Motivation

A TypeScript SDK enables:

1. **Web Integration**: Easy integration with web applications and wallets
2. **Bridge Frontend**: UI for bridge operations requiring threshold signatures
3. **Developer Experience**: Type-safe API with IntelliSense support
4. **Cross-Platform**: Works in Node.js, browsers, and React Native
5. **Testing**: Simplifies testing of T-Chain integrations

## Specification

### Package Location

```text
@luxfi/threshold (bridge/pkg/threshold/)
├── src/
│   ├── index.ts       # Package exports
│   ├── client.ts      # ThresholdClient class
│   └── types.ts       # TypeScript types
├── test/
│   └── client.test.ts # Test suite
├── package.json
└── tsconfig.json
```

### Installation

```bash
npm install @luxfi/threshold
# or
pnpm add @luxfi/threshold
```

### ThresholdClient

```typescript
import { ThresholdClient } from '@luxfi/threshold'

const client = new ThresholdClient({
  endpoint: 'http://localhost:9650/ext/bc/T'
})
```

### Client Options

```typescript
interface ThresholdClientOptions {
  /** T-Chain RPC endpoint */
  endpoint: string

  /** Request timeout in milliseconds (default: 30000) */
  timeout?: number

  /** Retry configuration */
  retry?: {
    maxAttempts?: number    // default: 3
    baseDelay?: number      // default: 1000ms
    maxDelay?: number       // default: 10000ms
  }
}
```

### Core Methods

#### Key Generation

```typescript
// Request key generation
const keygen = await client.keygen({
  keyId: 'eth-custody-key',
  threshold: 3,
  totalParties: 5,
  protocol: 'lss',        // 'lss' | 'cggmp21' | 'frost'
  curve: 'secp256k1'      // 'secp256k1' | 'ed25519'
})

// Returns session info
console.log(keygen.sessionId)  // 'keygen-abc123'

// Wait for completion
const result = await client.waitForKeygen(keygen.sessionId)
console.log(result.publicKey)  // '0x04...'
```

#### Chain-Based Keygen (Auto Protocol Selection)

```typescript
// Auto-selects best protocol for target chain
const ethKey = await client.keygen({
  keyId: 'eth-key',
  chain: 'ethereum'  // Uses LSS protocol, secp256k1
})

const solKey = await client.keygen({
  keyId: 'sol-key',
  chain: 'solana'    // Uses FROST protocol, ed25519
})

const btcKey = await client.keygen({
  keyId: 'btc-taproot',
  chain: 'bitcoin',
  options: { taproot: true }  // BIP-340 x-only keys
})
```

#### Signing

```typescript
// Request signature
const signResult = await client.sign({
  keyId: 'eth-custody-key',
  messageHash: '0x1234567890abcdef...',
  messageType: 'eth_sign'
})

// Wait for signature
const sig = await client.waitForSignature(signResult.sessionId)
console.log(sig.r)  // BigInt
console.log(sig.s)  // BigInt
console.log(sig.v)  // 27 or 28
```

#### Combined Sign and Wait

```typescript
const signature = await client.signAndWait({
  keyId: 'eth-custody-key',
  messageHash: '0x...',
  messageType: 'eth_sign'
})
```

#### Key Information

```typescript
const keyInfo = await client.getKey('eth-custody-key')
console.log(keyInfo.publicKey)
console.log(keyInfo.threshold)
console.log(keyInfo.totalParties)
console.log(keyInfo.generation)
console.log(keyInfo.protocol)
```

#### Resharing

```typescript
// Reshare to new parties
const reshare = await client.reshare({
  keyId: 'eth-custody-key',
  newParties: ['party6', 'party7', 'party8'],
  newThreshold: 2
})

await client.waitForReshare(reshare.sessionId)
```

#### Key Refresh

```typescript
// Refresh shares without changing public key
await client.refresh('eth-custody-key')
```

### Type Definitions

```typescript
// Protocol types
type Protocol = 'lss' | 'cggmp21' | 'frost' | 'bls' | 'ringtail'
type Chain = 'ethereum' | 'bitcoin' | 'solana' | 'lux' | 'polygon' | 'arbitrum'
type Curve = 'secp256k1' | 'ed25519' | 'bls12-381'

// Request types
interface KeygenRequest {
  keyId: string
  threshold?: number
  totalParties?: number
  protocol?: Protocol
  curve?: Curve
  chain?: Chain
  options?: {
    taproot?: boolean
    timeout?: number
  }
}

interface SignRequest {
  keyId: string
  messageHash: string
  messageType?: 'raw' | 'eth_sign' | 'typed_data'
  signers?: string[]
}

// Response types
interface KeygenResponse {
  sessionId: string
  status: 'pending' | 'running' | 'completed' | 'failed'
}

interface SignatureResponse {
  r: bigint
  s: bigint
  v?: number
  signature: string  // Hex-encoded full signature
}

interface KeyInfo {
  keyId: string
  publicKey: string
  protocol: Protocol
  curve: Curve
  threshold: number
  totalParties: number
  generation: number
  createdAt: number
  lastRefresh?: number
}

// Session types
interface SessionInfo {
  sessionId: string
  type: 'keygen' | 'sign' | 'reshare' | 'refresh'
  status: 'pending' | 'running' | 'completed' | 'failed'
  progress?: number
  error?: string
}
```

### Error Handling

```typescript
import { ThresholdClient, ThresholdError } from '@luxfi/threshold'

try {
  await client.sign({ keyId: 'unknown', messageHash: '0x...' })
} catch (error) {
  if (error instanceof ThresholdError) {
    console.log(error.code)     // 'KEY_NOT_FOUND'
    console.log(error.message)  // 'Key "unknown" not found'
  }
}
```

Error Codes:
- `KEY_NOT_FOUND`: Requested key does not exist
- `SESSION_NOT_FOUND`: Session ID not found
- `INSUFFICIENT_SIGNERS`: Not enough signers available
- `TIMEOUT`: Operation timed out
- `NETWORK_ERROR`: RPC connection failed
- `INVALID_MESSAGE`: Invalid message format
- `SIGNATURE_FAILED`: Signing protocol failed

### Advanced Usage

#### Listing Keys

```typescript
const keys = await client.listKeys({
  protocol: 'lss',
  limit: 100
})
```

#### Session Monitoring

```typescript
// List active sessions
const sessions = await client.listSessions({
  type: 'sign',
  status: 'running'
})

// Get session details
const session = await client.getSession('sign-xyz789')
```

#### Health Check

```typescript
const health = await client.health()
console.log(health.status)       // 'healthy'
console.log(health.protocols)    // ['lss', 'cggmp21', 'frost']
console.log(health.signerCount)  // 5
```

#### Network Statistics

```typescript
const stats = await client.getNetworkStats()
console.log(stats.totalKeys)
console.log(stats.totalSignatures)
console.log(stats.averageSignTime)
```

## Usage Examples

### Bridge Integration

```typescript
import { ThresholdClient } from '@luxfi/threshold'
import { ethers } from 'ethers'

async function bridgeWithdraw(
  client: ThresholdClient,
  withdrawalTx: ethers.TransactionRequest
) {
  // Hash the transaction
  const txHash = ethers.keccak256(
    ethers.Transaction.from(withdrawalTx).serialized
  )

  // Get threshold signature
  const sig = await client.signAndWait({
    keyId: 'bridge-eth-custody',
    messageHash: txHash,
    messageType: 'eth_sign'
  })

  // Add signature to transaction
  withdrawalTx.signature = {
    r: '0x' + sig.r.toString(16).padStart(64, '0'),
    s: '0x' + sig.s.toString(16).padStart(64, '0'),
    v: sig.v
  }

  // Broadcast
  const provider = new ethers.JsonRpcProvider(ETH_RPC)
  return provider.broadcastTransaction(
    ethers.Transaction.from(withdrawalTx).serialized
  )
}
```

### Solana Integration

```typescript
import { ThresholdClient } from '@luxfi/threshold'

async function signSolanaTransaction(
  client: ThresholdClient,
  message: Uint8Array
) {
  const sig = await client.signAndWait({
    keyId: 'bridge-sol-custody',
    messageHash: Buffer.from(message).toString('hex'),
    messageType: 'raw'
  })

  // Return Ed25519 signature
  return Buffer.from(sig.signature, 'hex')
}
```

## Testing

```bash
cd bridge/pkg/threshold
pnpm test

# Output:
# ✓ ThresholdClient initializes with endpoint
# ✓ keygen returns session info
# ✓ sign returns signature
# ✓ waitForKeygen polls until complete
# ✓ signAndWait combines operations
# ✓ handles network errors with retry
# ✓ validates input parameters
# ✓ supports chain-based protocol selection
```

## Related LPs

- **LP-7330**: T-Chain ThresholdVM Specification (RPC API)
- **LP-7340**: Threshold Cryptography Library (Go implementation)
- **LP-7014**: CMP/CGGMP21 Protocol
- **LP-7103**: LSS Protocol
- **LP-7104**: FROST Protocol

## Security Considerations

1. **No Private Data**: SDK never handles private key shares
2. **HTTPS Required**: Production use must use HTTPS endpoints
3. **Message Validation**: Validate message hashes before signing
4. **Access Control**: Implement authorization before signing requests
5. **Rate Limiting**: Implement client-side rate limiting

## Copyright

Copyright and related rights waived via [CC0](../LICENSE.md).
