---
lp: 5341
title: "@luxfi/threshold TypeScript SDK"
description: TypeScript SDK for interacting with T-Chain threshold signature services
author: Lux Industries Inc.
discussions-to: https://github.com/luxfi/lps/discussions
status: Review
type: Standards Track
category: Interface
created: 2025-12-17
requires: 7330, 7340
tags: [sdk, typescript, threshold-crypto]
order: 341
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

```solidity
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

## Rationale

### TypeScript-First Design

Choosing TypeScript provides:

1. **Type Safety**: Compile-time errors for API misuse
2. **IntelliSense**: Autocomplete for all methods and options
3. **Documentation**: Types serve as inline documentation
4. **Ecosystem**: Wide adoption in web3 and DeFi development

### Async/Await API

The async/await pattern provides:

1. **Simplicity**: Clean, readable code without callback hell
2. **Error Handling**: Native try/catch for error management
3. **Composability**: Easy to chain operations and use with other async code

### Chain-Based Protocol Selection

Auto-selecting protocols based on target chain:

1. **Developer Experience**: No need to know which protocol to use
2. **Correctness**: Ensures appropriate curve and signature format
3. **Flexibility**: Override available when explicit control needed

## Backwards Compatibility

### T-Chain RPC Compatibility

The SDK is compatible with T-Chain RPC versions:

- v1.0.x: Full support for all methods
- Future versions: Protocol negotiation via health check

### ethers.js Compatibility

Works with ethers.js v6:

- Uses standard types (BigInt, hex strings)
- Compatible with ethers Transaction and Wallet types
- Works alongside ethers providers

### Browser Compatibility

Supports modern browsers:

- Chrome 80+, Firefox 75+, Safari 13+
- React Native with proper polyfills
- Node.js 16+

### Migration from Direct RPC

Migrating from direct RPC calls:

```typescript
// Before (direct RPC)
const result = await fetch(endpoint, {
  method: 'POST',
  body: JSON.stringify({
    jsonrpc: '2.0',
    method: 'threshold.keygen',
    params: [{ keyId: 'key1', threshold: 3, parties: 5 }]
  })
})

// After (SDK)
const client = new ThresholdClient({ endpoint })
const result = await client.keygen({ keyId: 'key1', threshold: 3, totalParties: 5 })
```

## Test Cases

### Client Tests

```typescript
describe('ThresholdClient', () => {
  it('initializes with valid endpoint', () => {
    const client = new ThresholdClient({ endpoint: 'http://localhost:9650/ext/bc/T' });
    expect(client).toBeDefined();
  });

  it('keygen returns session info', async () => {
    const result = await client.keygen({
      keyId: 'test-key',
      threshold: 2,
      totalParties: 3,
      protocol: 'lss'
    });
    expect(result.sessionId).toBeDefined();
    expect(result.status).toBe('pending');
  });

  it('waitForKeygen polls until complete', async () => {
    const keygen = await client.keygen({ keyId: 'poll-test', threshold: 2, totalParties: 3 });
    const result = await client.waitForKeygen(keygen.sessionId);
    expect(result.publicKey).toMatch(/^0x04/);
    expect(result.publicKey.length).toBe(130);
  });

  it('sign returns valid signature', async () => {
    const sig = await client.signAndWait({
      keyId: 'test-key',
      messageHash: '0x' + '00'.repeat(32),
      messageType: 'raw'
    });
    expect(sig.r).toBeInstanceOf(BigInt);
    expect(sig.s).toBeInstanceOf(BigInt);
    expect(sig.signature).toMatch(/^0x[a-f0-9]+$/);
  });

  it('handles network errors with retry', async () => {
    const badClient = new ThresholdClient({
      endpoint: 'http://invalid:9999',
      retry: { maxAttempts: 2, baseDelay: 100 }
    });
    await expect(badClient.health()).rejects.toThrow(ThresholdError);
  });
});
```

### Protocol Selection Tests

```typescript
describe('Chain-based protocol selection', () => {
  it('selects LSS for Ethereum', async () => {
    const keygen = await client.keygen({ keyId: 'eth-key', chain: 'ethereum' });
    const key = await client.getKey('eth-key');
    expect(key.protocol).toBe('lss');
    expect(key.curve).toBe('secp256k1');
  });

  it('selects FROST for Bitcoin Taproot', async () => {
    const keygen = await client.keygen({
      keyId: 'btc-key',
      chain: 'bitcoin',
      options: { taproot: true }
    });
    const key = await client.getKey('btc-key');
    expect(key.protocol).toBe('frost');
    expect(key.curve).toBe('secp256k1');
  });

  it('selects FROST with Ed25519 for Solana', async () => {
    const keygen = await client.keygen({ keyId: 'sol-key', chain: 'solana' });
    const key = await client.getKey('sol-key');
    expect(key.protocol).toBe('frost');
    expect(key.curve).toBe('ed25519');
  });
});
```

### Error Handling Tests

```typescript
describe('Error handling', () => {
  it('throws KEY_NOT_FOUND for unknown key', async () => {
    try {
      await client.getKey('nonexistent');
      fail('Should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(ThresholdError);
      expect((error as ThresholdError).code).toBe('KEY_NOT_FOUND');
    }
  });

  it('throws TIMEOUT when operation exceeds limit', async () => {
    const slowClient = new ThresholdClient({
      endpoint,
      timeout: 1  // 1ms timeout
    });
    await expect(slowClient.health()).rejects.toMatchObject({
      code: 'TIMEOUT'
    });
  });
});
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
```
