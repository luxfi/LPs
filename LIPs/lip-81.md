---
lip: 81
title: Indexer API Standard
description: Defines the standard API interface for blockchain indexers based on Blockscout
author: Lux Network Team (@luxdefi)
discussions-to: https://github.com/luxfi/lips/discussions
status: Draft
type: Standards Track
category: Interface
created: 2025-01-23
requires: 0, 20
---

## Abstract

This LIP defines the standard API interface for blockchain indexers on the Lux Network, based on the Blockscout explorer framework. The standard ensures consistent data access patterns across all Lux chains while supporting chain-specific features and enabling efficient querying of blockchain data for applications, wallets, and analytics platforms.

## Motivation

A standardized indexer API is essential for:

1. **Developer Experience**: Consistent API across all Lux chains
2. **Application Compatibility**: Apps can work with any Lux chain indexer
3. **Data Accessibility**: Efficient access to historical blockchain data
4. **Multi-Chain Support**: Unified interface for Lux's 5-chain architecture
5. **Performance**: Optimized queries for common use cases

## Specification

### Core API Endpoints

#### Block Endpoints
```typescript
interface BlockAPI {
  // Get block by number or hash
  GET /api/v2/blocks/:blockNumberOrHash
  Response: {
    number: number;
    hash: string;
    timestamp: string;
    miner: string;
    difficulty: string;
    totalDifficulty: string;
    size: number;
    gasUsed: string;
    gasLimit: string;
    baseFeePerGas?: string;
    burntFees?: string;
    extraData: string;
    parentHash: string;
    unclesHash: string;
    stateRoot: string;
    receiptsRoot: string;
    transactionsRoot: string;
    transactions: Transaction[] | string[];
    uncles: string[];
  }

  // Get latest blocks
  GET /api/v2/blocks
  Query: {
    limit?: number;  // Default: 20, Max: 100
    offset?: number;
    type?: 'block' | 'uncle' | 'reorg';
  }
  Response: {
    items: Block[];
    next_page_params: {
      limit: number;
      offset: number;
    } | null;
  }

  // Get block transactions
  GET /api/v2/blocks/:blockNumberOrHash/transactions
  Query: {
    limit?: number;
    offset?: number;
  }
  Response: {
    items: Transaction[];
    next_page_params: object | null;
  }
}
```

#### Transaction Endpoints
```typescript
interface TransactionAPI {
  // Get transaction by hash
  GET /api/v2/transactions/:transactionHash
  Response: {
    hash: string;
    nonce: number;
    blockHash: string | null;
    blockNumber: number | null;
    transactionIndex: number | null;
    from: string;
    to: string | null;
    value: string;
    gasPrice: string;
    gas: string;
    input: string;
    v: string;
    r: string;
    s: string;
    status: 'success' | 'failed' | 'pending';
    gasUsed?: string;
    cumulativeGasUsed?: string;
    effectiveGasPrice?: string;
    type: number;
    maxFeePerGas?: string;
    maxPriorityFeePerGas?: string;
    logs?: Log[];
    decodedInput?: DecodedData;
    tokenTransfers?: TokenTransfer[];
    confirmations: number;
  }

  // Get transaction logs
  GET /api/v2/transactions/:transactionHash/logs
  Response: {
    items: Log[];
  }

  // Get transaction token transfers
  GET /api/v2/transactions/:transactionHash/token-transfers
  Response: {
    items: TokenTransfer[];
  }

  // Get internal transactions
  GET /api/v2/transactions/:transactionHash/internal-transactions
  Response: {
    items: InternalTransaction[];
  }
}
```

#### Address Endpoints
```typescript
interface AddressAPI {
  // Get address details
  GET /api/v2/addresses/:address
  Response: {
    address: string;
    balance: string;
    balanceUSD?: string;
    transactionCount: number;
    gasUsed: string;
    validatedBlocksCount?: number;
    createdAt?: string;
    updatedAt?: string;
    isContract: boolean;
    isToken?: boolean;
    isVerified?: boolean;
    name?: string;
    implementation?: string;
    tokenInfo?: TokenInfo;
    contractInfo?: ContractInfo;
  }

  // Get address transactions
  GET /api/v2/addresses/:address/transactions
  Query: {
    limit?: number;
    offset?: number;
    filter?: 'from' | 'to';
    startBlock?: number;
    endBlock?: number;
    startDate?: string;
    endDate?: string;
  }
  Response: {
    items: Transaction[];
    next_page_params: object | null;
  }

  // Get address token transfers
  GET /api/v2/addresses/:address/token-transfers
  Query: {
    limit?: number;
    offset?: number;
    token?: string;
    type?: 'LRC-20' | 'LRC-721' | 'LRC-1155';
  }
  Response: {
    items: TokenTransfer[];
    next_page_params: object | null;
  }

  // Get address token balances
  GET /api/v2/addresses/:address/tokens
  Query: {
    type?: 'LRC-20' | 'LRC-721' | 'LRC-1155';
  }
  Response: {
    items: TokenBalance[];
  }

  // Get address internal transactions
  GET /api/v2/addresses/:address/internal-transactions
  Response: {
    items: InternalTransaction[];
  }

  // Get address logs
  GET /api/v2/addresses/:address/logs
  Query: {
    topic0?: string;
    topic1?: string;
    topic2?: string;
    topic3?: string;
  }
  Response: {
    items: Log[];
  }
}
```

#### Token Endpoints
```typescript
interface TokenAPI {
  // Get token details
  GET /api/v2/tokens/:contractAddress
  Response: {
    address: string;
    name: string;
    symbol: string;
    decimals: number;
    type: 'LRC-20' | 'LRC-721' | 'LRC-1155';
    totalSupply: string;
    holders: number;
    transfers: number;
    icon?: string;
    website?: string;
    isVerified?: boolean;
    marketCap?: string;
    price?: string;
    priceChangePercentage24h?: number;
  }

  // Get token transfers
  GET /api/v2/tokens/:contractAddress/transfers
  Query: {
    limit?: number;
    offset?: number;
    startBlock?: number;
    endBlock?: number;
  }
  Response: {
    items: TokenTransfer[];
    next_page_params: object | null;
  }

  // Get token holders
  GET /api/v2/tokens/:contractAddress/holders
  Query: {
    limit?: number;
    offset?: number;
  }
  Response: {
    items: TokenHolder[];
    next_page_params: object | null;
  }

  // Get NFT instances (for LRC-721/1155)
  GET /api/v2/tokens/:contractAddress/instances
  Query: {
    limit?: number;
    offset?: number;
  }
  Response: {
    items: NFTInstance[];
    next_page_params: object | null;
  }

  // Get specific NFT instance
  GET /api/v2/tokens/:contractAddress/instances/:tokenId
  Response: {
    tokenId: string;
    owner: string;
    metadata: NFTMetadata;
    transfers: number;
    imageUrl?: string;
    animationUrl?: string;
    externalUrl?: string;
  }
}
```

#### Smart Contract Endpoints
```typescript
interface ContractAPI {
  // Get contract info
  GET /api/v2/smart-contracts/:address
  Response: {
    address: string;
    creatorAddress: string;
    creationTxHash: string;
    deploymentDate: string;
    isVerified: boolean;
    verificationDate?: string;
    compilerVersion?: string;
    optimizationEnabled?: boolean;
    optimizationRuns?: number;
    evmVersion?: string;
    sourceCode?: string;
    abi?: object[];
    constructorArguments?: string;
    libraries?: Library[];
    proxyType?: string;
    implementation?: string;
  }

  // Verify contract
  POST /api/v2/smart-contracts/:address/verification
  Body: {
    sourceCode: string | SourceFile[];
    contractName: string;
    compilerVersion: string;
    optimizationEnabled: boolean;
    optimizationRuns?: number;
    evmVersion?: string;
    libraries?: Library[];
    constructorArguments?: string;
  }
  Response: {
    status: 'pending' | 'success' | 'failed';
    message: string;
  }

  // Read contract
  GET /api/v2/smart-contracts/:address/methods-read
  Response: {
    items: ReadMethod[];
  }

  // Write contract (get interface)
  GET /api/v2/smart-contracts/:address/methods-write
  Response: {
    items: WriteMethod[];
  }
}
```

#### Multi-Chain Endpoints
```typescript
interface MultiChainAPI {
  // Get supported chains
  GET /api/v2/chains
  Response: {
    items: ChainInfo[];
  }

  // Cross-chain transaction lookup
  GET /api/v2/cross-chain/transactions/:txHash
  Query: {
    sourceChain?: string;
    destinationChain?: string;
  }
  Response: {
    sourceTransaction: Transaction;
    destinationTransaction?: Transaction;
    bridgeInfo?: BridgeInfo;
    status: 'pending' | 'completed' | 'failed';
  }

  // Multi-chain address lookup
  GET /api/v2/cross-chain/addresses/:address
  Response: {
    chains: {
      [chainId: string]: {
        balance: string;
        transactionCount: number;
        tokenBalances: TokenBalance[];
      }
    }
  }
}
```

#### Search and Analytics
```typescript
interface SearchAPI {
  // Universal search
  GET /api/v2/search
  Query: {
    q: string;
    type?: 'address' | 'transaction' | 'token' | 'block' | 'all';
  }
  Response: {
    addresses: Address[];
    transactions: Transaction[];
    tokens: Token[];
    blocks: Block[];
  }

  // Advanced search
  POST /api/v2/search/advanced
  Body: {
    filters: {
      type?: string[];
      dateRange?: { from: string; to: string };
      valueRange?: { min: string; max: string };
      status?: string[];
      method?: string[];
    };
    sort?: {
      field: string;
      order: 'asc' | 'desc';
    };
    limit?: number;
    offset?: number;
  }
  Response: {
    items: SearchResult[];
    total: number;
    next_page_params: object | null;
  }
}
```

#### Statistics Endpoints
```typescript
interface StatsAPI {
  // Chain statistics
  GET /api/v2/stats
  Response: {
    totalBlocks: number;
    totalTransactions: string;
    totalAccounts: number;
    totalTokens: number;
    averageBlockTime: number;
    networkHashRate?: string;
    marketCap?: string;
    gasPrice: {
      slow: string;
      average: string;
      fast: string;
    };
  }

  // Transaction statistics
  GET /api/v2/stats/transactions
  Query: {
    period?: 'hour' | 'day' | 'week' | 'month';
  }
  Response: {
    items: {
      date: string;
      transactionCount: number;
      gasUsed: string;
      averageGasPrice: string;
    }[];
  }

  // Top tokens
  GET /api/v2/stats/tokens
  Query: {
    type?: 'LRC-20' | 'LRC-721' | 'LRC-1155';
    sort?: 'holders' | 'transfers' | 'marketCap';
    limit?: number;
  }
  Response: {
    items: TokenStats[];
  }
}
```

### WebSocket API

```typescript
interface WebSocketAPI {
  // Real-time subscriptions
  WS /api/v2/ws

  // Subscribe to new blocks
  {
    "event": "subscribe",
    "topic": "blocks"
  }

  // Subscribe to address transactions
  {
    "event": "subscribe",
    "topic": "addresses:transactions",
    "params": {
      "address": "0x..."
    }
  }

  // Subscribe to token transfers
  {
    "event": "subscribe",
    "topic": "tokens:transfers",
    "params": {
      "token": "0x...",
      "address": "0x..."  // optional
    }
  }

  // Message format
  {
    "event": "data",
    "topic": "blocks",
    "data": Block
  }
}
```

### Response Types

```typescript
interface TokenTransfer {
  transactionHash: string;
  logIndex: number;
  token: TokenInfo;
  from: string;
  to: string;
  value: string;
  tokenId?: string;  // For NFTs
  amounts?: string[]; // For LRC-1155
  tokenIds?: string[]; // For LRC-1155
  timestamp: string;
  blockNumber: number;
}

interface Log {
  address: string;
  topics: string[];
  data: string;
  blockNumber: number;
  transactionHash: string;
  transactionIndex: number;
  blockHash: string;
  logIndex: number;
  removed: boolean;
  decodedData?: DecodedData;
}

interface DecodedData {
  method: string;
  parameters: {
    name: string;
    type: string;
    value: any;
  }[];
}

interface NFTMetadata {
  name?: string;
  description?: string;
  image?: string;
  animationUrl?: string;
  externalUrl?: string;
  attributes?: {
    trait_type: string;
    value: any;
    display_type?: string;
  }[];
}
```

### Rate Limiting

```typescript
interface RateLimits {
  // Response headers
  'X-RateLimit-Limit': number;      // Requests per window
  'X-RateLimit-Remaining': number;  // Remaining requests
  'X-RateLimit-Reset': number;      // Unix timestamp of reset

  // Default limits
  public: {
    requestsPerMinute: 100;
    requestsPerDay: 10000;
  };
  
  authenticated: {
    requestsPerMinute: 1000;
    requestsPerDay: 100000;
  };
}
```

### Error Responses

```typescript
interface ErrorResponse {
  error: {
    code: number;
    message: string;
    details?: any;
  };
}

// Common error codes
enum ErrorCode {
  INVALID_PARAMS = 400,
  NOT_FOUND = 404,
  RATE_LIMITED = 429,
  INTERNAL_ERROR = 500,
  SERVICE_UNAVAILABLE = 503
}
```

## Rationale

### Design Decisions

1. **Blockscout Compatibility**: Based on proven Blockscout API design
2. **RESTful Design**: Standard HTTP/REST patterns for broad compatibility
3. **Multi-Chain Native**: Built-in support for Lux's multiple chains
4. **Performance First**: Pagination, filtering, and efficient queries
5. **Real-time Support**: WebSocket API for live data

### Extensions to Blockscout

1. **Multi-Chain Queries**: Cross-chain transaction and balance lookups
2. **LRC Token Standards**: Native support for Lux token standards
3. **Chain-Specific Features**: Support for X-Chain UTXOs, Z-Chain privacy features
4. **Enhanced Search**: Advanced filtering and cross-chain search

## Backwards Compatibility

This API maintains compatibility with:
- Standard Blockscout API endpoints
- Etherscan API format (with adapter)
- Web3 RPC where applicable

## Test Cases

### Basic API Test
```typescript
async function testBlockAPI() {
  const response = await fetch('/api/v2/blocks/latest');
  const block = await response.json();
  
  expect(block).toHaveProperty('number');
  expect(block).toHaveProperty('hash');
  expect(block).toHaveProperty('timestamp');
  expect(block.transactions).toBeInstanceOf(Array);
}
```

### Pagination Test
```typescript
async function testPagination() {
  // First page
  const page1 = await fetch('/api/v2/blocks?limit=10');
  const data1 = await page1.json();
  
  expect(data1.items).toHaveLength(10);
  expect(data1.next_page_params).toBeDefined();
  
  // Next page
  const page2 = await fetch('/api/v2/blocks?limit=10&offset=' + 
    data1.next_page_params.offset);
  const data2 = await page2.json();
  
  expect(data2.items[0].number).toBeLessThan(data1.items[9].number);
}
```

### WebSocket Test
```typescript
function testWebSocket() {
  const ws = new WebSocket('wss://explorer-api.lux.network/api/v2/ws');
  
  ws.on('open', () => {
    ws.send(JSON.stringify({
      event: 'subscribe',
      topic: 'blocks'
    }));
  });
  
  ws.on('message', (data) => {
    const message = JSON.parse(data);
    if (message.event === 'data' && message.topic === 'blocks') {
      expect(message.data).toHaveProperty('number');
      expect(message.data).toHaveProperty('hash');
    }
  });
}
```

## Reference Implementation

Reference implementation based on Blockscout:
- https://github.com/luxdefi/explorer
- https://github.com/blockscout/blockscout

Key features:
- PostgreSQL database with optimized indexes
- Elixir/Phoenix backend
- Real-time WebSocket support
- Horizontal scaling support

## Security Considerations

### API Security
- Rate limiting per IP and API key
- DDoS protection
- Input validation and sanitization
- SQL injection prevention

### Data Integrity
- Blockchain data verification
- Reorg handling
- Data consistency checks
- Cache invalidation strategies

### Privacy
- Optional address privacy mode
- IP anonymization
- Query log retention policies
- GDPR compliance features

## Copyright

Copyright and related rights waived via [CC0](../LICENSE.md).