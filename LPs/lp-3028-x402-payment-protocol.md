---
lp: 3028
title: x402 Payment Protocol
description: HTTP 402 Payment Required standard for AI-native internet payments
author: Lux Core Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Standards Track
category: LRC
created: 2025-01-23
requires: 3020, 3009
tags: [lrc, payments, ai-agent, http]
order: 285
---

# LP-3028: x402 Payment Protocol

## Abstract

x402 is an open standard for internet-native payments using HTTP 402 "Payment Required" status code. It enables AI agents and applications to make instant on-chain payments without human intervention, built on LRC-3009 gasless transfers.

## Motivation

The internet lacks a native payment layer:
- Credit cards require intermediaries
- Crypto payments need custom integration
- AI agents can't pay for resources autonomously

x402 provides:
- HTTP-native payment handshake
- Stablecoin settlement on L2
- AI agent compatibility
- Zero gas for end users

## Specification

### HTTP Flow

```
Client                         Server                      Facilitator
   |                              |                              |
   |-------- GET /resource ------>|                              |
   |                              |                              |
   |<------ 402 Payment Required --|                              |
   |        X-Payment: {schema}   |                              |
   |                              |                              |
   |-- Create LRC-3009 Auth ----->|                              |
   |                              |                              |
   |-------- GET /resource ------>|                              |
   |        X-Payment-Auth: sig   |                              |
   |                              |                              |
   |                              |------ Verify + Execute ----->|
   |                              |                              |
   |                              |<------ Payment Receipt ------|
   |                              |                              |
   |<--------- 200 OK ------------|                              |
   |        (resource content)    |                              |
```

### Payment Request Header

```http
HTTP/1.1 402 Payment Required
X-Payment-Request: {
  "version": "1",
  "network": "lux",
  "chainId": 96369,
  "facilitator": "0x...",
  "payee": "0x...",
  "token": "0x...",  // USDC address
  "amount": "1000000",  // 1 USDC (6 decimals)
  "resource": "/api/v1/data",
  "validFor": 300  // seconds
}
```

### Payment Authorization Header

```http
GET /api/v1/data HTTP/1.1
X-Payment-Authorization: {
  "from": "0x...",
  "to": "0x...",  // facilitator
  "value": "1000000",
  "validAfter": 1703145600,
  "validBefore": 1703145900,
  "nonce": "0x...",
  "signature": "0x..."  // LRC-3009 authorization
}
```

### Facilitator Contract

```solidity
contract X402Facilitator {
    struct PaymentRequest {
        address payee;
        address token;
        uint256 amount;
        bytes32 resourceHash;
        uint256 validUntil;
    }
    
    struct PaymentReceipt {
        bytes32 requestHash;
        address payer;
        uint256 timestamp;
        bytes32 txHash;
    }
    
    mapping(bytes32 => PaymentReceipt) public receipts;
    
    event PaymentProcessed(
        bytes32 indexed requestHash,
        address indexed payer,
        address indexed payee,
        uint256 amount
    );
    
    function processPayment(
        PaymentRequest calldata request,
        // LRC-3009 authorization params
        address from,
        uint256 validAfter,
        uint256 validBefore,
        bytes32 nonce,
        bytes calldata signature
    ) external returns (bytes32 receiptId) {
        // Verify request validity
        require(block.timestamp < request.validUntil, "Request expired");
        
        // Execute LRC-3009 transfer
        ILRC3009(request.token).transferWithAuthorization(
            from,
            request.payee,
            request.amount,
            validAfter,
            validBefore,
            nonce,
            signature
        );
        
        // Generate receipt
        receiptId = keccak256(abi.encodePacked(
            request.payee,
            from,
            request.amount,
            block.timestamp
        ));
        
        receipts[receiptId] = PaymentReceipt({
            requestHash: keccak256(abi.encode(request)),
            payer: from,
            timestamp: block.timestamp,
            txHash: bytes32(0)  // Set after tx confirmation
        });
        
        emit PaymentProcessed(
            keccak256(abi.encode(request)),
            from,
            request.payee,
            request.amount
        );
    }
}
```

### AI Agent Integration

```typescript
// AI Agent wallet with x402 support
class X402Agent {
  private wallet: Wallet;
  private allowance: bigint;
  
  async fetch(url: string): Promise<Response> {
    // Initial request
    let response = await fetch(url);
    
    if (response.status === 402) {
      // Parse payment request
      const paymentRequest = JSON.parse(
        response.headers.get('X-Payment-Request')!
      );
      
      // Check allowance
      if (BigInt(paymentRequest.amount) > this.allowance) {
        throw new Error('Exceeds allowance');
      }
      
      // Create LRC-3009 authorization
      const auth = await this.createAuthorization(paymentRequest);
      
      // Retry with payment
      response = await fetch(url, {
        headers: {
          'X-Payment-Authorization': JSON.stringify(auth)
        }
      });
    }
    
    return response;
  }
  
  private async createAuthorization(request: PaymentRequest) {
    const nonce = ethers.randomBytes(32);
    const validAfter = Math.floor(Date.now() / 1000);
    const validBefore = validAfter + request.validFor;
    
    const signature = await this.wallet.signTypedData(
      // EIP-712 domain and types
      // ...
    );
    
    return {
      from: this.wallet.address,
      to: request.facilitator,
      value: request.amount,
      validAfter,
      validBefore,
      nonce: ethers.hexlify(nonce),
      signature
    };
  }
}
```

### Server Implementation

```typescript
// Express middleware for x402
function x402Paywall(config: PaywallConfig) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const auth = req.headers['x-payment-authorization'];
    
    if (!auth) {
      // Request payment
      return res.status(402).json({
        'X-Payment-Request': {
          version: '1',
          network: 'lux',
          chainId: config.chainId,
          facilitator: config.facilitator,
          payee: config.payee,
          token: config.token,
          amount: config.amount,
          resource: req.path,
          validFor: 300
        }
      });
    }
    
    // Verify payment
    const payment = JSON.parse(auth);
    const receipt = await verifyPayment(payment, config);
    
    if (receipt) {
      req.paymentReceipt = receipt;
      next();
    } else {
      res.status(402).json({ error: 'Payment verification failed' });
    }
  };
}
```

## Use Cases

### AI Data Marketplace
```
AI Agent → 402 Payment Required for dataset
AI Agent → Signs LRC-3009 auth (1 USDC)
Server → Verifies, delivers dataset
```

### API Monetization
```
Developer → Builds paid API
Client → Gets 402 on rate limit
Client → Pays per-request
```

### Content Paywalls
```
User → Visits premium article
Site → Returns 402
Wallet → Auto-pays $0.10
Site → Delivers content
```

## Rationale

- HTTP 402 repurposed for crypto payments
- LRC-3009 enables gasless UX
- Facilitators abstract blockchain complexity
- Compatible with existing HTTP infrastructure

## Backwards Compatibility

The x402 protocol is designed to be backwards compatible with existing HTTP infrastructure. Services not implementing x402 continue to function normally. The protocol leverages the previously unused HTTP 402 status code and standard HTTP headers.

## Security Considerations

- Authorization time bounds prevent replay
- Facilitator verification required
- Amount limits for AI agents
- HTTPS required for header security

## References

- [x402 Protocol](https://x402.org)
- [Coinbase x402](https://github.com/coinbase/x402)
- [LP-3009: LRC-3009](./lp-3009-lrc-3009-transfer-authorization.md)
- [ERC-3009](https://eips.ethereum.org/EIPS/eip-3009)

## Copyright

Copyright and related rights waived via [CC0](../LICENSE.md).
