---
lp: 0340
title: Unified Bridge SDK Specification
description: Comprehensive SDK specification for developers integrating with the Teleport bridge protocol across TypeScript, Go, and Python
author: Lux Partners (@luxdefi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Standards Track
category: SDK
created: 2025-12-11
requires: 332, 335
---

## Abstract

This LP specifies the Unified Bridge SDK, a multi-language SDK suite enabling developers to integrate with the Teleport bridge protocol for cross-chain asset transfers. The SDK provides consistent APIs across TypeScript (github.com/luxfi/sdk-ts), Go (github.com/luxfi/sdk), and Python (github.com/luxfi/sdk-py) for deposit, withdrawal, and swap operations. The specification covers core modules (connection management, signing, encoding), chain-specific adapters, event subscription systems, error handling patterns, retry strategies, and fee estimation. Integration guides for DeFi protocols, wallets, and exchanges are included.

## Conformance

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in RFC 2119.

An implementation is conformant if it:

1. MUST implement all interfaces defined in Section 2 (Core Modules)
2. MUST implement the BridgeClient API defined in Section 3
3. MUST use the error code taxonomy defined in Section 11
4. MUST implement exponential backoff retry as defined in Section 12
5. SHOULD implement client-side rate limiting as defined in Section 13
6. MUST pass all test vectors defined in Section 14

Partial implementations MAY omit chain adapters for chains they do not support, but MUST clearly document unsupported chains.

## Motivation

The Teleport bridge architecture (LP-0332) and smart contract integration (LP-0335) define the protocol-level infrastructure for cross-chain transfers. Developers require well-documented, ergonomic SDKs to build applications on this infrastructure without needing deep protocol knowledge.

### Goals

1. **Consistent API Surface**: Identical concepts and patterns across all supported languages
2. **Type Safety**: Full type definitions in TypeScript, Go structs, and Python type hints
3. **Minimal Dependencies**: Standard library where possible; explicit, audited dependencies otherwise
4. **Fail-Fast Semantics**: Clear, actionable errors at the point of failure
5. **Deterministic Behavior**: Reproducible operations given the same inputs
6. **Event-Driven Architecture**: Subscription-based status tracking for long-running operations

### Non-Goals

1. Smart contract deployment (use Hardhat/Foundry directly)
2. Node operation (see node documentation)
3. MPC key management (handled by T-Chain validators)

## Specification

### 1. SDK Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          Application Layer                                   │
│                   (DeFi Protocols, Wallets, Exchanges)                       │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Unified Bridge SDK                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐│
│  │  sdk-ts     │  │    sdk      │  │   sdk-py    │  │   Common Protocol   ││
│  │ (TypeScript)│  │    (Go)     │  │  (Python)   │  │   Specification     ││
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
┌─────────────────────────────────────────────────────────────────────────────┐
│                            Core Modules                                      │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐  ┌──────────────┐ │
│  │  Connection   │  │    Signing    │  │   Encoding    │  │    Events    │ │
│  │   Manager     │  │    Module     │  │    Module     │  │    System    │ │
│  └───────────────┘  └───────────────┘  └───────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Chain Adapters                                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │   LUX    │ │ Ethereum │ │   Base   │ │ Arbitrum │ │ Optimism │   ...    │
│  │ Adapter  │ │ Adapter  │ │ Adapter  │ │ Adapter  │ │ Adapter  │          │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘          │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        Protocol Layer                                        │
│        B-Chain (BridgeVM)              T-Chain (ThresholdVM)                 │
│        Bridge Smart Contracts          MPC Signatures                        │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2. Core Modules

#### 2.1 Connection Module

Manages RPC connections to Lux Network and external chains.

**Interface Definition:**

```typescript
interface ConnectionConfig {
    // Lux Network endpoints
    luxRpcUrl: string;          // Default: https://api.lux.network
    bChainRpcUrl?: string;      // Default: {luxRpcUrl}/ext/bc/B/rpc
    tChainRpcUrl?: string;      // Default: {luxRpcUrl}/ext/bc/T/rpc
    cChainRpcUrl?: string;      // Default: {luxRpcUrl}/ext/bc/C/rpc

    // External chain endpoints (optional overrides)
    ethereumRpcUrl?: string;
    baseRpcUrl?: string;
    arbitrumRpcUrl?: string;
    optimismRpcUrl?: string;

    // Connection settings
    timeout?: number;           // Default: 30000ms
    retryAttempts?: number;     // Default: 3
    retryDelay?: number;        // Default: 1000ms
}

interface ConnectionManager {
    // Connection lifecycle
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    isConnected(): boolean;

    // Chain-specific providers
    getLuxProvider(): Provider;
    getChainProvider(chainId: ChainId): Provider;

    // Health checks
    checkHealth(): Promise<HealthStatus>;
    getLatency(chainId: ChainId): Promise<number>;
}
```

#### 2.2 Signing Module

Handles transaction signing with support for various wallet types.

**Interface Definition:**

```typescript
interface SignerConfig {
    type: 'privateKey' | 'mnemonic' | 'hardware' | 'walletConnect' | 'injected';

    // For privateKey type
    privateKey?: string;

    // For mnemonic type
    mnemonic?: string;
    derivationPath?: string;    // Default: "m/44'/60'/0'/0/0"

    // For hardware type
    transport?: 'usb' | 'bluetooth';
    deviceType?: 'ledger' | 'trezor';

    // For walletConnect type
    projectId?: string;

    // For injected type (browser wallets)
    windowProvider?: 'ethereum' | 'luxfi';
}

interface Signer {
    getAddress(): Promise<string>;
    signMessage(message: Uint8Array): Promise<Signature>;
    signTransaction(tx: TransactionRequest): Promise<string>;
    signTypedData(domain: TypedDataDomain, types: TypedDataField[], value: Record<string, unknown>): Promise<string>;
}

interface SignatureResult {
    r: string;
    s: string;
    v: number;
    signature: string;          // Concatenated r + s + v
}
```

#### 2.3 Encoding Module

Provides ABI encoding/decoding and message formatting.

**Interface Definition:**

```typescript
interface Encoder {
    // ABI encoding
    encodeFunction(abi: AbiItem, functionName: string, params: unknown[]): string;
    decodeFunction(abi: AbiItem, functionName: string, data: string): unknown[];

    // Event encoding
    encodeEventTopic(abi: AbiItem, eventName: string): string;
    decodeEventLog(abi: AbiItem, eventName: string, data: string, topics: string[]): unknown;

    // Bridge message encoding (EIP-712)
    encodeDepositMessage(params: DepositParams): string;
    encodeReleaseMessage(params: ReleaseParams): string;

    // Hash utilities
    keccak256(data: Uint8Array): string;
    sha256(data: Uint8Array): string;
}
```

#### 2.4 Event System

Subscription-based event tracking for bridge operations.

**Interface Definition:**

```typescript
type BridgeEventType =
    | 'deposit.initiated'
    | 'deposit.confirmed'
    | 'deposit.completed'
    | 'withdraw.initiated'
    | 'withdraw.signed'
    | 'withdraw.completed'
    | 'swap.initiated'
    | 'swap.completed'
    | 'error';

interface BridgeEvent {
    type: BridgeEventType;
    operationId: string;
    timestamp: number;
    data: DepositEvent | WithdrawEvent | SwapEvent | ErrorEvent;
}

interface EventEmitter {
    on(event: BridgeEventType, handler: (event: BridgeEvent) => void): void;
    once(event: BridgeEventType, handler: (event: BridgeEvent) => void): void;
    off(event: BridgeEventType, handler: (event: BridgeEvent) => void): void;
    emit(event: BridgeEventType, data: BridgeEvent): void;
}

interface EventSubscription {
    unsubscribe(): void;
    readonly isActive: boolean;
}
```

### 3. Bridge Client API

The core interface for bridge operations.

```typescript
interface BridgeClient {
    // Configuration
    readonly config: BridgeConfig;
    readonly events: EventEmitter;

    // Connection
    connect(): Promise<void>;
    disconnect(): Promise<void>;

    // Token operations
    deposit(params: DepositParams): Promise<DepositResult>;
    withdraw(params: WithdrawParams): Promise<WithdrawResult>;
    swap(params: SwapParams): Promise<SwapResult>;

    // Query operations
    getDepositStatus(depositId: string): Promise<DepositStatus>;
    getWithdrawStatus(withdrawId: string): Promise<WithdrawStatus>;
    getSupportedTokens(chainId: ChainId): Promise<TokenInfo[]>;
    getSupportedChains(): Promise<ChainInfo[]>;

    // Fee estimation
    estimateDepositFee(params: DepositParams): Promise<FeeEstimate>;
    estimateWithdrawFee(params: WithdrawParams): Promise<FeeEstimate>;

    // Utilities
    getTokenBalance(token: string, address: string, chainId: ChainId): Promise<bigint>;
    approveToken(token: string, amount: bigint, chainId: ChainId): Promise<string>;
}
```

### 4. TypeScript SDK (github.com/luxfi/sdk-ts)

#### 4.1 Installation

```bash
# npm
npm install @luxfi/bridge-sdk

# yarn
yarn add @luxfi/bridge-sdk

# pnpm
pnpm add @luxfi/bridge-sdk
```

#### 4.2 Setup and Configuration

```typescript
import { BridgeClient, ChainId } from '@luxfi/bridge-sdk';

// Create client with default configuration
const bridge = new BridgeClient({
    luxRpcUrl: 'https://api.lux.network',
});

// Create client with custom endpoints
const bridgeCustom = new BridgeClient({
    luxRpcUrl: 'https://api.lux.network',
    ethereumRpcUrl: 'https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY',
    timeout: 60000,
    retryAttempts: 5,
});

// Connect and initialize
await bridge.connect();

// Check connection health
const health = await bridge.checkHealth();
console.log('Bridge health:', health);
```

#### 4.3 Signer Configuration

```typescript
import { BridgeClient, PrivateKeySigner, WalletConnectSigner } from '@luxfi/bridge-sdk';

// Private key signer (for server-side applications)
const privateKeySigner = new PrivateKeySigner({
    privateKey: process.env.PRIVATE_KEY!,
});

// WalletConnect signer (for web applications)
const walletConnectSigner = new WalletConnectSigner({
    projectId: 'YOUR_WALLET_CONNECT_PROJECT_ID',
    chains: [ChainId.LUX_MAINNET, ChainId.ETHEREUM],
});

// Injected provider signer (for browser extensions)
const injectedSigner = new InjectedSigner({
    provider: window.ethereum,
});

// Create client with signer
const bridge = new BridgeClient({
    luxRpcUrl: 'https://api.lux.network',
    signer: privateKeySigner,
});
```

#### 4.4 Deposit Operation (External -> Lux)

```typescript
import { BridgeClient, ChainId, parseUnits, formatUnits } from '@luxfi/bridge-sdk';

async function depositToLux() {
    const bridge = new BridgeClient({
        luxRpcUrl: 'https://api.lux.network',
        signer: mySigner,
    });

    await bridge.connect();

    // Define deposit parameters
    const depositParams = {
        sourceChainId: ChainId.ETHEREUM,
        destinationChainId: ChainId.LUX_MAINNET,
        token: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC on Ethereum
        amount: parseUnits('1000', 6), // 1000 USDC
        recipient: '0xYourLuxAddress',
    };

    // Estimate fees before deposit
    const feeEstimate = await bridge.estimateDepositFee(depositParams);
    console.log(`Estimated fee: ${formatUnits(feeEstimate.totalFee, 18)} ETH`);
    console.log(`Estimated time: ${feeEstimate.estimatedTimeSeconds}s`);

    // Check and approve token allowance
    const currentAllowance = await bridge.getTokenAllowance(
        depositParams.token,
        await mySigner.getAddress(),
        ChainId.ETHEREUM
    );

    if (currentAllowance < depositParams.amount) {
        console.log('Approving token spend...');
        const approveTx = await bridge.approveToken(
            depositParams.token,
            depositParams.amount,
            ChainId.ETHEREUM
        );
        console.log(`Approval tx: ${approveTx}`);
    }

    // Subscribe to deposit events
    bridge.events.on('deposit.initiated', (event) => {
        console.log(`Deposit initiated: ${event.operationId}`);
    });

    bridge.events.on('deposit.confirmed', (event) => {
        console.log(`Deposit confirmed with ${event.data.confirmations} confirmations`);
    });

    bridge.events.on('deposit.completed', (event) => {
        console.log(`Deposit completed! Destination tx: ${event.data.destinationTxHash}`);
    });

    // Execute deposit
    const result = await bridge.deposit(depositParams);

    console.log(`Deposit ID: ${result.depositId}`);
    console.log(`Source tx hash: ${result.sourceTxHash}`);

    // Wait for completion (optional)
    const finalStatus = await bridge.waitForDeposit(result.depositId, {
        timeout: 600000,        // 10 minutes
        pollInterval: 5000,     // Check every 5 seconds
    });

    console.log(`Final status: ${finalStatus.status}`);
    console.log(`Wrapped token received: ${formatUnits(finalStatus.amountReceived, 6)} wUSDC`);

    await bridge.disconnect();
}
```

#### 4.5 Withdraw Operation (Lux -> External)

```typescript
import { BridgeClient, ChainId, parseUnits } from '@luxfi/bridge-sdk';

async function withdrawFromLux() {
    const bridge = new BridgeClient({
        luxRpcUrl: 'https://api.lux.network',
        signer: mySigner,
    });

    await bridge.connect();

    // Define withdraw parameters
    const withdrawParams = {
        sourceChainId: ChainId.LUX_MAINNET,
        destinationChainId: ChainId.ETHEREUM,
        token: '0xWrappedUSDCOnLux', // Wrapped USDC on Lux
        amount: parseUnits('500', 6), // 500 wUSDC
        recipient: '0xYourEthereumAddress',
    };

    // Subscribe to withdraw events
    bridge.events.on('withdraw.initiated', (event) => {
        console.log(`Withdraw initiated: ${event.operationId}`);
        console.log(`Burn tx: ${event.data.burnTxHash}`);
    });

    bridge.events.on('withdraw.signed', (event) => {
        console.log(`MPC signature received from ${event.data.signers.length} signers`);
    });

    bridge.events.on('withdraw.completed', (event) => {
        console.log(`Withdraw completed! Release tx: ${event.data.releaseTxHash}`);
    });

    // Execute withdrawal
    const result = await bridge.withdraw(withdrawParams);

    console.log(`Withdraw ID: ${result.withdrawId}`);
    console.log(`Burn tx hash: ${result.burnTxHash}`);

    // Wait for MPC signature and release
    const finalStatus = await bridge.waitForWithdraw(result.withdrawId, {
        timeout: 1200000,       // 20 minutes (includes MPC signing time)
        pollInterval: 10000,
    });

    console.log(`Native USDC received: ${formatUnits(finalStatus.amountReceived, 6)}`);

    await bridge.disconnect();
}
```

#### 4.6 Cross-Chain Swap

```typescript
import { BridgeClient, ChainId, parseUnits, parseEther } from '@luxfi/bridge-sdk';

async function crossChainSwap() {
    const bridge = new BridgeClient({
        luxRpcUrl: 'https://api.lux.network',
        signer: mySigner,
    });

    await bridge.connect();

    // Swap USDC on Ethereum for LUX on C-Chain
    const swapParams = {
        sourceChainId: ChainId.ETHEREUM,
        destinationChainId: ChainId.LUX_MAINNET,
        sourceToken: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC
        destinationToken: '0x0000000000000000000000000000000000000000', // Native LUX
        sourceAmount: parseUnits('100', 6), // 100 USDC
        minDestinationAmount: parseEther('10'), // Minimum 10 LUX
        recipient: '0xYourLuxAddress',
        deadline: Math.floor(Date.now() / 1000) + 3600, // 1 hour
        slippageBps: 50, // 0.5% slippage tolerance
    };

    // Get swap quote
    const quote = await bridge.getSwapQuote(swapParams);
    console.log(`Expected output: ${formatEther(quote.expectedOutput)} LUX`);
    console.log(`Price impact: ${quote.priceImpactBps / 100}%`);
    console.log(`Route: ${quote.route.join(' -> ')}`);

    // Execute swap
    const result = await bridge.swap(swapParams);

    console.log(`Swap ID: ${result.swapId}`);

    // Wait for completion
    const finalStatus = await bridge.waitForSwap(result.swapId);

    console.log(`Swap completed!`);
    console.log(`Source amount: ${formatUnits(finalStatus.sourceAmount, 6)} USDC`);
    console.log(`Received amount: ${formatEther(finalStatus.destinationAmount)} LUX`);
    console.log(`Effective rate: ${finalStatus.effectiveRate}`);

    await bridge.disconnect();
}
```

#### 4.7 Event Subscriptions

```typescript
import { BridgeClient, EventSubscription } from '@luxfi/bridge-sdk';

async function subscribeToEvents() {
    const bridge = new BridgeClient({
        luxRpcUrl: 'https://api.lux.network',
    });

    await bridge.connect();

    // Subscribe to all bridge events for a specific address
    const subscription = await bridge.subscribeToAddress('0xYourAddress', {
        chains: [ChainId.LUX_MAINNET, ChainId.ETHEREUM],
    });

    subscription.on('deposit', (event) => {
        console.log(`Deposit detected: ${event.depositId}`);
        console.log(`Amount: ${event.amount}`);
        console.log(`Status: ${event.status}`);
    });

    subscription.on('withdraw', (event) => {
        console.log(`Withdrawal detected: ${event.withdrawId}`);
    });

    subscription.on('error', (error) => {
        console.error(`Subscription error: ${error.message}`);
    });

    // Keep subscription active
    // ...

    // Cleanup
    subscription.unsubscribe();
    await bridge.disconnect();
}

// WebSocket-based real-time events
async function realtimeEvents() {
    const bridge = new BridgeClient({
        luxRpcUrl: 'https://api.lux.network',
        websocketUrl: 'wss://ws.lux.network',
    });

    await bridge.connect();

    // Subscribe to bridge contract events directly
    const eventStream = await bridge.subscribeToContractEvents({
        chainId: ChainId.LUX_MAINNET,
        contractAddress: '0xBridgeVaultAddress',
        events: ['Deposit', 'Release'],
    });

    for await (const event of eventStream) {
        if (event.name === 'Deposit') {
            console.log(`New deposit: ${event.args.depositId}`);
        } else if (event.name === 'Release') {
            console.log(`New release: ${event.args.releaseId}`);
        }
    }
}
```

### 5. Go SDK (github.com/luxfi/sdk)

#### 5.1 Installation

```bash
go get github.com/luxfi/sdk@latest
```

#### 5.2 Setup and Configuration

```go
package main

import (
    "context"
    "log"
    "time"

    "github.com/luxfi/sdk/bridge"
    "github.com/luxfi/sdk/chain"
)

func main() {
    // Create bridge client with default configuration
    client, err := bridge.NewClient(bridge.Config{
        LuxRPCURL: "https://api.lux.network",
        Timeout:   30 * time.Second,
    })
    if err != nil {
        log.Fatal(err)
    }
    defer client.Close()

    // Connect to network
    ctx := context.Background()
    if err := client.Connect(ctx); err != nil {
        log.Fatal(err)
    }

    // Check health
    health, err := client.CheckHealth(ctx)
    if err != nil {
        log.Fatal(err)
    }
    log.Printf("Bridge health: %+v", health)
}
```

#### 5.3 Signer Configuration

```go
package main

import (
    "github.com/luxfi/sdk/bridge"
    "github.com/luxfi/sdk/signer"
    "github.com/luxfi/crypto/secp256k1"
)

func setupSigners() {
    // Private key signer
    privateKey, _ := secp256k1.HexToPrivateKey("YOUR_PRIVATE_KEY_HEX")
    pkSigner := signer.NewPrivateKeySigner(privateKey)

    // Mnemonic signer with HD derivation
    mnemonicSigner, _ := signer.NewMnemonicSigner(
        "your twelve word mnemonic phrase goes here ...",
        "m/44'/60'/0'/0/0",
    )

    // Hardware wallet signer (Ledger)
    ledgerSigner, _ := signer.NewLedgerSigner(signer.LedgerConfig{
        DerivationPath: "m/44'/60'/0'/0/0",
    })

    // Create client with signer
    client, _ := bridge.NewClient(bridge.Config{
        LuxRPCURL: "https://api.lux.network",
        Signer:    pkSigner,
    })
    _ = client
}
```

#### 5.4 Deposit Operation

```go
package main

import (
    "context"
    "fmt"
    "log"
    "math/big"
    "time"

    "github.com/luxfi/sdk/bridge"
    "github.com/luxfi/sdk/chain"
    "github.com/luxfi/sdk/common"
)

func depositToLux() error {
    client, err := bridge.NewClient(bridge.Config{
        LuxRPCURL: "https://api.lux.network",
        Signer:    mySigner,
    })
    if err != nil {
        return fmt.Errorf("create client: %w", err)
    }
    defer client.Close()

    ctx := context.Background()
    if err := client.Connect(ctx); err != nil {
        return fmt.Errorf("connect: %w", err)
    }

    // Define deposit parameters
    amount := new(big.Int)
    amount.SetString("1000000000", 10) // 1000 USDC (6 decimals)

    depositParams := &bridge.DepositParams{
        SourceChainID:      chain.Ethereum,
        DestinationChainID: chain.LuxMainnet,
        Token:              common.HexToAddress("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"),
        Amount:             amount,
        Recipient:          common.HexToAddress("0xYourLuxAddress"),
    }

    // Estimate fees
    feeEstimate, err := client.EstimateDepositFee(ctx, depositParams)
    if err != nil {
        return fmt.Errorf("estimate fee: %w", err)
    }
    log.Printf("Estimated fee: %s wei", feeEstimate.TotalFee.String())
    log.Printf("Estimated time: %d seconds", feeEstimate.EstimatedTimeSeconds)

    // Check and approve allowance
    allowance, err := client.GetTokenAllowance(ctx, depositParams.Token, myAddress, chain.Ethereum)
    if err != nil {
        return fmt.Errorf("get allowance: %w", err)
    }

    if allowance.Cmp(amount) < 0 {
        log.Println("Approving token spend...")
        approveTx, err := client.ApproveToken(ctx, depositParams.Token, amount, chain.Ethereum)
        if err != nil {
            return fmt.Errorf("approve: %w", err)
        }
        log.Printf("Approval tx: %s", approveTx)
    }

    // Subscribe to events
    eventCh := make(chan *bridge.Event, 10)
    sub, err := client.SubscribeDeposit(ctx, eventCh)
    if err != nil {
        return fmt.Errorf("subscribe: %w", err)
    }
    defer sub.Unsubscribe()

    go func() {
        for event := range eventCh {
            switch event.Type {
            case bridge.EventDepositInitiated:
                log.Printf("Deposit initiated: %s", event.OperationID)
            case bridge.EventDepositConfirmed:
                log.Printf("Deposit confirmed: %d confirmations", event.Data.Confirmations)
            case bridge.EventDepositCompleted:
                log.Printf("Deposit completed: dest tx %s", event.Data.DestinationTxHash)
            }
        }
    }()

    // Execute deposit
    result, err := client.Deposit(ctx, depositParams)
    if err != nil {
        return fmt.Errorf("deposit: %w", err)
    }

    log.Printf("Deposit ID: %s", result.DepositID)
    log.Printf("Source tx: %s", result.SourceTxHash)

    // Wait for completion
    finalStatus, err := client.WaitForDeposit(ctx, result.DepositID, &bridge.WaitOptions{
        Timeout:      10 * time.Minute,
        PollInterval: 5 * time.Second,
    })
    if err != nil {
        return fmt.Errorf("wait: %w", err)
    }

    log.Printf("Final status: %s", finalStatus.Status)
    log.Printf("Amount received: %s", finalStatus.AmountReceived.String())

    return nil
}
```

#### 5.5 Withdraw Operation

```go
package main

import (
    "context"
    "fmt"
    "log"
    "math/big"
    "time"

    "github.com/luxfi/sdk/bridge"
    "github.com/luxfi/sdk/chain"
    "github.com/luxfi/sdk/common"
)

func withdrawFromLux() error {
    client, err := bridge.NewClient(bridge.Config{
        LuxRPCURL: "https://api.lux.network",
        Signer:    mySigner,
    })
    if err != nil {
        return fmt.Errorf("create client: %w", err)
    }
    defer client.Close()

    ctx := context.Background()
    if err := client.Connect(ctx); err != nil {
        return fmt.Errorf("connect: %w", err)
    }

    // Define withdraw parameters
    amount := new(big.Int)
    amount.SetString("500000000", 10) // 500 wUSDC

    withdrawParams := &bridge.WithdrawParams{
        SourceChainID:      chain.LuxMainnet,
        DestinationChainID: chain.Ethereum,
        Token:              common.HexToAddress("0xWrappedUSDCOnLux"),
        Amount:             amount,
        Recipient:          common.HexToAddress("0xYourEthereumAddress"),
    }

    // Subscribe to events
    eventCh := make(chan *bridge.Event, 10)
    sub, err := client.SubscribeWithdraw(ctx, eventCh)
    if err != nil {
        return fmt.Errorf("subscribe: %w", err)
    }
    defer sub.Unsubscribe()

    go func() {
        for event := range eventCh {
            switch event.Type {
            case bridge.EventWithdrawInitiated:
                log.Printf("Withdraw initiated: %s", event.OperationID)
                log.Printf("Burn tx: %s", event.Data.BurnTxHash)
            case bridge.EventWithdrawSigned:
                log.Printf("MPC signature received from %d signers", len(event.Data.Signers))
            case bridge.EventWithdrawCompleted:
                log.Printf("Withdraw completed: release tx %s", event.Data.ReleaseTxHash)
            }
        }
    }()

    // Execute withdrawal
    result, err := client.Withdraw(ctx, withdrawParams)
    if err != nil {
        return fmt.Errorf("withdraw: %w", err)
    }

    log.Printf("Withdraw ID: %s", result.WithdrawID)
    log.Printf("Burn tx: %s", result.BurnTxHash)

    // Wait for MPC signature and release
    finalStatus, err := client.WaitForWithdraw(ctx, result.WithdrawID, &bridge.WaitOptions{
        Timeout:      20 * time.Minute,
        PollInterval: 10 * time.Second,
    })
    if err != nil {
        return fmt.Errorf("wait: %w", err)
    }

    log.Printf("Native USDC received: %s", finalStatus.AmountReceived.String())

    return nil
}
```

#### 5.6 Integration with luxfi/node

```go
package main

import (
    "context"
    "log"

    "github.com/luxfi/sdk/bridge"
    "github.com/luxfi/node/vms/platformvm"
    "github.com/luxfi/node/api/keystore"
)

func integrateLuxNode() error {
    // Connect to local luxd node
    client, err := bridge.NewClient(bridge.Config{
        LuxRPCURL: "http://localhost:9630",
    })
    if err != nil {
        return err
    }
    defer client.Close()

    ctx := context.Background()

    // Access B-Chain directly
    bChainClient := client.BChainClient()

    // Get bridge status
    status, err := bChainClient.GetBridgeStatus(ctx)
    if err != nil {
        return err
    }
    log.Printf("Bridge TVL: %s", status.TotalValueLocked)

    // Access T-Chain for threshold operations
    tChainClient := client.TChainClient()

    // Get current signing committee
    committee, err := tChainClient.GetCommittee(ctx, "bridge-main")
    if err != nil {
        return err
    }
    log.Printf("Committee threshold: %d of %d", committee.Threshold, len(committee.Members))

    // Query signature status
    sigStatus, err := tChainClient.GetSignatureStatus(ctx, "session-id")
    if err != nil {
        return err
    }
    log.Printf("Signature status: %s", sigStatus.Status)

    return nil
}
```

### 6. Python SDK (github.com/luxfi/sdk-py)

#### 6.1 Installation

```bash
pip install luxfi-bridge-sdk
```

#### 6.2 Setup and Configuration

```python
import asyncio
from luxfi.bridge import BridgeClient, ChainId
from luxfi.bridge.signer import PrivateKeySigner

async def main():
    # Create client with default configuration
    client = BridgeClient(
        lux_rpc_url="https://api.lux.network",
    )

    # Or with custom configuration
    client = BridgeClient(
        lux_rpc_url="https://api.lux.network",
        ethereum_rpc_url="https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY",
        timeout=60.0,
        retry_attempts=5,
    )

    # Connect
    await client.connect()

    # Check health
    health = await client.check_health()
    print(f"Bridge health: {health}")

    # Cleanup
    await client.disconnect()

if __name__ == "__main__":
    asyncio.run(main())
```

#### 6.3 Async Client with Full Operations

```python
import asyncio
from decimal import Decimal
from luxfi.bridge import BridgeClient, ChainId
from luxfi.bridge.signer import PrivateKeySigner
from luxfi.bridge.utils import parse_units, format_units

async def bridge_operations():
    # Setup signer
    signer = PrivateKeySigner(private_key=os.environ["PRIVATE_KEY"])

    # Create and connect client
    client = BridgeClient(
        lux_rpc_url="https://api.lux.network",
        signer=signer,
    )
    await client.connect()

    try:
        # Deposit USDC from Ethereum to Lux
        deposit_result = await client.deposit(
            source_chain_id=ChainId.ETHEREUM,
            destination_chain_id=ChainId.LUX_MAINNET,
            token="0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
            amount=parse_units("1000", 6),
            recipient="0xYourLuxAddress",
        )
        print(f"Deposit ID: {deposit_result.deposit_id}")
        print(f"Source tx: {deposit_result.source_tx_hash}")

        # Wait for completion
        final_status = await client.wait_for_deposit(
            deposit_result.deposit_id,
            timeout=600,
            poll_interval=5,
        )
        print(f"Deposit completed: {final_status.status}")

        # Withdraw wUSDC from Lux to Ethereum
        withdraw_result = await client.withdraw(
            source_chain_id=ChainId.LUX_MAINNET,
            destination_chain_id=ChainId.ETHEREUM,
            token="0xWrappedUSDCOnLux",
            amount=parse_units("500", 6),
            recipient="0xYourEthereumAddress",
        )
        print(f"Withdraw ID: {withdraw_result.withdraw_id}")

        # Wait for MPC signature and release
        final_withdraw = await client.wait_for_withdraw(
            withdraw_result.withdraw_id,
            timeout=1200,
        )
        print(f"Withdraw completed: {final_withdraw.release_tx_hash}")

    finally:
        await client.disconnect()

if __name__ == "__main__":
    asyncio.run(bridge_operations())
```

#### 6.4 Event Subscriptions

```python
import asyncio
from luxfi.bridge import BridgeClient, ChainId
from luxfi.bridge.events import EventType

async def subscribe_to_events():
    client = BridgeClient(lux_rpc_url="https://api.lux.network")
    await client.connect()

    # Define event handlers
    async def on_deposit(event):
        print(f"Deposit {event.operation_id}: {event.data}")

    async def on_withdraw(event):
        print(f"Withdraw {event.operation_id}: {event.data}")

    async def on_error(event):
        print(f"Error: {event.data.message}")

    # Subscribe to events
    client.events.on(EventType.DEPOSIT_INITIATED, on_deposit)
    client.events.on(EventType.DEPOSIT_COMPLETED, on_deposit)
    client.events.on(EventType.WITHDRAW_INITIATED, on_withdraw)
    client.events.on(EventType.WITHDRAW_COMPLETED, on_withdraw)
    client.events.on(EventType.ERROR, on_error)

    # Subscribe to address-specific events
    subscription = await client.subscribe_to_address(
        address="0xYourAddress",
        chains=[ChainId.LUX_MAINNET, ChainId.ETHEREUM],
    )

    # Process events
    async for event in subscription:
        print(f"Event: {event.type} - {event.operation_id}")

    await client.disconnect()

if __name__ == "__main__":
    asyncio.run(subscribe_to_events())
```

#### 6.5 Context Manager Pattern

```python
import asyncio
from luxfi.bridge import BridgeClient
from luxfi.bridge.utils import parse_ether

async def with_context_manager():
    async with BridgeClient(lux_rpc_url="https://api.lux.network") as client:
        # Get supported tokens
        tokens = await client.get_supported_tokens(ChainId.ETHEREUM)
        for token in tokens:
            print(f"{token.symbol}: {token.address}")

        # Get supported chains
        chains = await client.get_supported_chains()
        for chain in chains:
            print(f"{chain.name} (ID: {chain.chain_id})")

        # Estimate deposit fee
        fee = await client.estimate_deposit_fee(
            source_chain_id=ChainId.ETHEREUM,
            destination_chain_id=ChainId.LUX_MAINNET,
            token="0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
            amount=parse_units("1000", 6),
        )
        print(f"Estimated fee: {format_units(fee.total_fee, 18)} ETH")

if __name__ == "__main__":
    asyncio.run(with_context_manager())
```

### 7. Common Patterns

#### 7.1 Error Handling

All SDKs use structured error types for precise failure diagnosis.

**TypeScript:**

```typescript
import {
    BridgeError,
    InsufficientBalanceError,
    InsufficientAllowanceError,
    SignatureTimeoutError,
    ChainNotSupportedError,
    TokenNotSupportedError,
    RpcError,
} from '@luxfi/bridge-sdk';

async function handleErrors() {
    const bridge = new BridgeClient({ luxRpcUrl: 'https://api.lux.network' });

    try {
        await bridge.deposit(depositParams);
    } catch (error) {
        if (error instanceof InsufficientBalanceError) {
            console.error(`Insufficient balance: have ${error.balance}, need ${error.required}`);
        } else if (error instanceof InsufficientAllowanceError) {
            console.error(`Need to approve ${error.required} tokens`);
            await bridge.approveToken(error.token, error.required, error.chainId);
        } else if (error instanceof SignatureTimeoutError) {
            console.error(`MPC signature timed out after ${error.timeoutSeconds}s`);
            console.error(`Session ID: ${error.sessionId}`);
        } else if (error instanceof ChainNotSupportedError) {
            console.error(`Chain ${error.chainId} is not supported`);
        } else if (error instanceof TokenNotSupportedError) {
            console.error(`Token ${error.token} on chain ${error.chainId} is not supported`);
        } else if (error instanceof RpcError) {
            console.error(`RPC error (${error.code}): ${error.message}`);
            console.error(`Chain: ${error.chainId}, Method: ${error.method}`);
        } else if (error instanceof BridgeError) {
            console.error(`Bridge error: ${error.message}`);
            console.error(`Error code: ${error.code}`);
        } else {
            throw error; // Re-throw unknown errors
        }
    }
}
```

**Go:**

```go
package main

import (
    "errors"
    "fmt"
    "log"

    "github.com/luxfi/sdk/bridge"
)

func handleErrors() {
    client, _ := bridge.NewClient(bridge.Config{
        LuxRPCURL: "https://api.lux.network",
    })

    result, err := client.Deposit(ctx, depositParams)
    if err != nil {
        var insufficientBalance *bridge.InsufficientBalanceError
        var insufficientAllowance *bridge.InsufficientAllowanceError
        var signatureTimeout *bridge.SignatureTimeoutError
        var chainNotSupported *bridge.ChainNotSupportedError
        var tokenNotSupported *bridge.TokenNotSupportedError
        var rpcError *bridge.RPCError

        switch {
        case errors.As(err, &insufficientBalance):
            log.Printf("Insufficient balance: have %s, need %s",
                insufficientBalance.Balance, insufficientBalance.Required)
        case errors.As(err, &insufficientAllowance):
            log.Printf("Need to approve %s tokens", insufficientAllowance.Required)
        case errors.As(err, &signatureTimeout):
            log.Printf("MPC signature timed out: session %s", signatureTimeout.SessionID)
        case errors.As(err, &chainNotSupported):
            log.Printf("Chain %d not supported", chainNotSupported.ChainID)
        case errors.As(err, &tokenNotSupported):
            log.Printf("Token %s not supported on chain %d",
                tokenNotSupported.Token, tokenNotSupported.ChainID)
        case errors.As(err, &rpcError):
            log.Printf("RPC error %d on chain %d: %s",
                rpcError.Code, rpcError.ChainID, rpcError.Message)
        default:
            return fmt.Errorf("unexpected error: %w", err)
        }
    }
}
```

**Python:**

```python
from luxfi.bridge.errors import (
    BridgeError,
    InsufficientBalanceError,
    InsufficientAllowanceError,
    SignatureTimeoutError,
    ChainNotSupportedError,
    TokenNotSupportedError,
    RpcError,
)

async def handle_errors():
    client = BridgeClient(lux_rpc_url="https://api.lux.network")

    try:
        await client.deposit(deposit_params)
    except InsufficientBalanceError as e:
        print(f"Insufficient balance: have {e.balance}, need {e.required}")
    except InsufficientAllowanceError as e:
        print(f"Need to approve {e.required} tokens")
        await client.approve_token(e.token, e.required, e.chain_id)
    except SignatureTimeoutError as e:
        print(f"MPC signature timed out after {e.timeout_seconds}s")
        print(f"Session ID: {e.session_id}")
    except ChainNotSupportedError as e:
        print(f"Chain {e.chain_id} is not supported")
    except TokenNotSupportedError as e:
        print(f"Token {e.token} on chain {e.chain_id} is not supported")
    except RpcError as e:
        print(f"RPC error ({e.code}): {e.message}")
        print(f"Chain: {e.chain_id}, Method: {e.method}")
    except BridgeError as e:
        print(f"Bridge error: {e.message}")
        print(f"Error code: {e.code}")
```

#### 7.2 Retry Strategies

**TypeScript:**

```typescript
import { BridgeClient, RetryStrategy, ExponentialBackoff } from '@luxfi/bridge-sdk';

// Create client with custom retry strategy
const bridge = new BridgeClient({
    luxRpcUrl: 'https://api.lux.network',
    retryStrategy: new ExponentialBackoff({
        maxAttempts: 5,
        initialDelayMs: 1000,
        maxDelayMs: 30000,
        backoffMultiplier: 2,
        retryableErrors: [
            'ETIMEDOUT',
            'ECONNRESET',
            'RATE_LIMITED',
            'NONCE_TOO_LOW',
        ],
    }),
});

// Or use built-in strategies
const bridgeWithLinear = new BridgeClient({
    luxRpcUrl: 'https://api.lux.network',
    retryStrategy: RetryStrategy.linear({
        maxAttempts: 3,
        delayMs: 2000,
    }),
});

// Custom retry logic for specific operations
async function depositWithRetry(params: DepositParams, maxRetries = 3): Promise<DepositResult> {
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await bridge.deposit(params);
        } catch (error) {
            lastError = error as Error;

            // Don't retry non-retryable errors
            if (error instanceof InsufficientBalanceError) {
                throw error;
            }

            if (attempt < maxRetries) {
                const delay = Math.min(1000 * Math.pow(2, attempt - 1), 30000);
                console.log(`Attempt ${attempt} failed, retrying in ${delay}ms...`);
                await sleep(delay);
            }
        }
    }

    throw lastError;
}
```

**Go:**

```go
package main

import (
    "context"
    "time"

    "github.com/luxfi/sdk/bridge"
    "github.com/luxfi/sdk/retry"
)

func configureRetry() {
    // Create client with custom retry strategy
    client, _ := bridge.NewClient(bridge.Config{
        LuxRPCURL: "https://api.lux.network",
        RetryStrategy: retry.ExponentialBackoff{
            MaxAttempts:        5,
            InitialDelay:       time.Second,
            MaxDelay:           30 * time.Second,
            BackoffMultiplier:  2.0,
            RetryableErrors:    []string{"ETIMEDOUT", "ECONNRESET", "RATE_LIMITED"},
        },
    })

    // Or use helper functions
    clientLinear, _ := bridge.NewClient(bridge.Config{
        LuxRPCURL:     "https://api.lux.network",
        RetryStrategy: retry.Linear(3, 2*time.Second),
    })
    _ = clientLinear
}

// Custom retry wrapper
func depositWithRetry(ctx context.Context, client *bridge.Client, params *bridge.DepositParams, maxRetries int) (*bridge.DepositResult, error) {
    var lastErr error

    for attempt := 1; attempt <= maxRetries; attempt++ {
        result, err := client.Deposit(ctx, params)
        if err == nil {
            return result, nil
        }

        lastErr = err

        // Don't retry non-retryable errors
        var insufficientBalance *bridge.InsufficientBalanceError
        if errors.As(err, &insufficientBalance) {
            return nil, err
        }

        if attempt < maxRetries {
            delay := time.Duration(1<<(attempt-1)) * time.Second
            if delay > 30*time.Second {
                delay = 30 * time.Second
            }
            log.Printf("Attempt %d failed, retrying in %v...", attempt, delay)
            time.Sleep(delay)
        }
    }

    return nil, fmt.Errorf("all %d attempts failed: %w", maxRetries, lastErr)
}
```

#### 7.3 Fee Estimation

**TypeScript:**

```typescript
import { BridgeClient, ChainId, parseUnits } from '@luxfi/bridge-sdk';

async function estimateFees() {
    const bridge = new BridgeClient({ luxRpcUrl: 'https://api.lux.network' });
    await bridge.connect();

    // Estimate deposit fee
    const depositFee = await bridge.estimateDepositFee({
        sourceChainId: ChainId.ETHEREUM,
        destinationChainId: ChainId.LUX_MAINNET,
        token: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        amount: parseUnits('1000', 6),
    });

    console.log(`Bridge fee: ${formatUnits(depositFee.bridgeFee, 6)} USDC`);
    console.log(`Gas fee (source): ${formatEther(depositFee.sourceGasFee)} ETH`);
    console.log(`Gas fee (dest): ${formatEther(depositFee.destinationGasFee)} LUX`);
    console.log(`Total fee: ${formatUnits(depositFee.totalFee, 6)} USDC equivalent`);
    console.log(`Estimated time: ${depositFee.estimatedTimeSeconds}s`);

    // Get fee breakdown
    const breakdown = depositFee.breakdown;
    console.log('\nFee breakdown:');
    console.log(`  Base fee: ${formatUnits(breakdown.baseFee, 6)} USDC`);
    console.log(`  Percentage fee (${breakdown.percentageBps / 100}%): ${formatUnits(breakdown.percentageFee, 6)} USDC`);
    console.log(`  Relayer fee: ${formatUnits(breakdown.relayerFee, 6)} USDC`);

    // Estimate withdraw fee (includes MPC signature cost)
    const withdrawFee = await bridge.estimateWithdrawFee({
        sourceChainId: ChainId.LUX_MAINNET,
        destinationChainId: ChainId.ETHEREUM,
        token: '0xWrappedUSDCOnLux',
        amount: parseUnits('500', 6),
    });

    console.log(`\nWithdraw fee: ${formatUnits(withdrawFee.totalFee, 6)} USDC equivalent`);
    console.log(`MPC signature cost: ${formatEther(withdrawFee.mpcSignatureFee)} LUX`);

    await bridge.disconnect();
}
```

### 8. Integration Guides

#### 8.1 DeFi Protocol Integration

```typescript
import { BridgeClient, ChainId } from '@luxfi/bridge-sdk';
import { YourDeFiProtocol } from './your-protocol';

/**
 * Example: Integrating bridge with a lending protocol
 * Allows users to deposit collateral from external chains
 */
class CrossChainLending {
    private bridge: BridgeClient;
    private lendingProtocol: YourDeFiProtocol;

    constructor() {
        this.bridge = new BridgeClient({
            luxRpcUrl: 'https://api.lux.network',
        });
        this.lendingProtocol = new YourDeFiProtocol();
    }

    /**
     * Bridge and deposit collateral in one flow
     */
    async depositCollateralFromExternal(
        sourceChainId: ChainId,
        token: string,
        amount: bigint,
        userAddress: string,
    ): Promise<{ bridgeTxHash: string; depositTxHash: string }> {
        // 1. Bridge tokens to Lux
        const bridgeResult = await this.bridge.deposit({
            sourceChainId,
            destinationChainId: ChainId.LUX_MAINNET,
            token,
            amount,
            recipient: this.lendingProtocol.vaultAddress, // Direct to protocol
        });

        // 2. Wait for bridge completion
        const finalStatus = await this.bridge.waitForDeposit(bridgeResult.depositId);

        // 3. Credit user in lending protocol
        const depositTx = await this.lendingProtocol.creditDeposit(
            userAddress,
            finalStatus.destinationToken,
            finalStatus.amountReceived,
            bridgeResult.depositId, // For accounting
        );

        return {
            bridgeTxHash: bridgeResult.sourceTxHash,
            depositTxHash: depositTx,
        };
    }

    /**
     * Withdraw collateral and bridge to external chain
     */
    async withdrawCollateralToExternal(
        destinationChainId: ChainId,
        token: string,
        amount: bigint,
        userAddress: string,
    ): Promise<{ withdrawTxHash: string; bridgeTxHash: string }> {
        // 1. Withdraw from lending protocol
        const withdrawTx = await this.lendingProtocol.withdraw(
            userAddress,
            token,
            amount,
        );

        // 2. Bridge to external chain
        const bridgeResult = await this.bridge.withdraw({
            sourceChainId: ChainId.LUX_MAINNET,
            destinationChainId,
            token,
            amount,
            recipient: userAddress,
        });

        // 3. Wait for bridge completion
        await this.bridge.waitForWithdraw(bridgeResult.withdrawId);

        return {
            withdrawTxHash: withdrawTx,
            bridgeTxHash: bridgeResult.burnTxHash,
        };
    }
}
```

#### 8.2 Wallet Integration

```typescript
import { BridgeClient, ChainId, InjectedSigner } from '@luxfi/bridge-sdk';

/**
 * Example: Web wallet integration
 */
class WalletBridgeUI {
    private bridge: BridgeClient | null = null;

    async connect(): Promise<string> {
        // Connect to user's wallet
        const signer = new InjectedSigner({
            provider: window.ethereum,
        });

        this.bridge = new BridgeClient({
            luxRpcUrl: 'https://api.lux.network',
            signer,
        });

        await this.bridge.connect();

        return await signer.getAddress();
    }

    async getSupportedRoutes(): Promise<BridgeRoute[]> {
        const chains = await this.bridge!.getSupportedChains();
        const routes: BridgeRoute[] = [];

        for (const source of chains) {
            for (const dest of chains) {
                if (source.chainId !== dest.chainId) {
                    const tokens = await this.bridge!.getSupportedTokens(source.chainId);
                    routes.push({
                        source,
                        destination: dest,
                        tokens,
                    });
                }
            }
        }

        return routes;
    }

    async getQuote(params: QuoteParams): Promise<BridgeQuote> {
        const fee = await this.bridge!.estimateDepositFee(params);
        const tokens = await this.bridge!.getSupportedTokens(params.destinationChainId);
        const destToken = tokens.find(t => t.bridgedFrom === params.token);

        return {
            inputAmount: params.amount,
            outputAmount: params.amount - fee.bridgeFee,
            fee: fee.totalFee,
            estimatedTime: fee.estimatedTimeSeconds,
            destinationToken: destToken,
        };
    }

    async executeBridge(params: BridgeParams): Promise<BridgeTransaction> {
        // Check allowance
        const allowance = await this.bridge!.getTokenAllowance(
            params.token,
            params.userAddress,
            params.sourceChainId,
        );

        if (allowance < params.amount) {
            // Request approval from user
            await this.bridge!.approveToken(params.token, params.amount, params.sourceChainId);
        }

        // Execute bridge
        const result = await this.bridge!.deposit(params);

        return {
            id: result.depositId,
            status: 'pending',
            sourceTxHash: result.sourceTxHash,
        };
    }

    async trackTransaction(depositId: string): Promise<AsyncIterable<TransactionStatus>> {
        return this.bridge!.trackDeposit(depositId);
    }
}
```

#### 8.3 Exchange Integration

```typescript
import { BridgeClient, ChainId } from '@luxfi/bridge-sdk';

/**
 * Example: Centralized exchange integration
 * Hot wallet management for cross-chain deposits/withdrawals
 */
class ExchangeBridgeService {
    private bridge: BridgeClient;
    private hotWalletsByChain: Map<ChainId, string>;

    constructor(config: ExchangeConfig) {
        this.bridge = new BridgeClient({
            luxRpcUrl: config.luxRpcUrl,
            signer: config.hotWalletSigner,
        });

        this.hotWalletsByChain = new Map([
            [ChainId.LUX_MAINNET, config.luxHotWallet],
            [ChainId.ETHEREUM, config.ethHotWallet],
            [ChainId.BASE, config.baseHotWallet],
        ]);
    }

    /**
     * Process user deposit from external chain
     */
    async processUserDeposit(
        userId: string,
        sourceChainId: ChainId,
        token: string,
        amount: bigint,
        sourceTxHash: string,
    ): Promise<void> {
        // 1. Verify deposit to our hot wallet
        const verified = await this.verifyDeposit(sourceChainId, token, amount, sourceTxHash);
        if (!verified) {
            throw new Error('Deposit not verified');
        }

        // 2. Bridge to Lux (if not already on Lux)
        if (sourceChainId !== ChainId.LUX_MAINNET) {
            const result = await this.bridge.deposit({
                sourceChainId,
                destinationChainId: ChainId.LUX_MAINNET,
                token,
                amount,
                recipient: this.hotWalletsByChain.get(ChainId.LUX_MAINNET)!,
            });

            // Wait for bridge completion
            const finalStatus = await this.bridge.waitForDeposit(result.depositId);

            // 3. Credit user account
            await this.creditUserAccount(userId, finalStatus.destinationToken, finalStatus.amountReceived);
        } else {
            // Direct Lux deposit
            await this.creditUserAccount(userId, token, amount);
        }
    }

    /**
     * Process user withdrawal to external chain
     */
    async processUserWithdrawal(
        userId: string,
        destinationChainId: ChainId,
        token: string,
        amount: bigint,
        userAddress: string,
    ): Promise<string> {
        // 1. Verify user balance
        const balance = await this.getUserBalance(userId, token);
        if (balance < amount) {
            throw new Error('Insufficient balance');
        }

        // 2. Debit user account
        await this.debitUserAccount(userId, token, amount);

        // 3. Bridge to destination chain
        if (destinationChainId !== ChainId.LUX_MAINNET) {
            const result = await this.bridge.withdraw({
                sourceChainId: ChainId.LUX_MAINNET,
                destinationChainId,
                token,
                amount,
                recipient: userAddress,
            });

            // Wait for completion
            const finalStatus = await this.bridge.waitForWithdraw(result.withdrawId);

            return finalStatus.releaseTxHash;
        } else {
            // Direct Lux transfer
            return await this.transferOnLux(token, amount, userAddress);
        }
    }

    /**
     * Monitor bridge events for automated processing
     */
    async startDepositMonitor(): Promise<void> {
        for (const [chainId, hotWallet] of this.hotWalletsByChain) {
            const subscription = await this.bridge.subscribeToAddress(hotWallet, {
                chains: [chainId],
            });

            subscription.on('deposit', async (event) => {
                // Auto-process detected deposits
                await this.processDetectedDeposit(event);
            });
        }
    }
}
```

### 9. Chain Adapters

Each supported chain has a dedicated adapter handling chain-specific logic.

```typescript
interface ChainAdapter {
    readonly chainId: ChainId;
    readonly nativeCurrency: NativeCurrency;
    readonly blockTime: number;
    readonly confirmationsRequired: number;

    // Connection
    connect(rpcUrl: string): Promise<void>;
    disconnect(): Promise<void>;

    // Transaction handling
    sendTransaction(tx: TransactionRequest): Promise<TransactionResponse>;
    waitForTransaction(txHash: string, confirmations?: number): Promise<TransactionReceipt>;

    // Balance queries
    getBalance(address: string): Promise<bigint>;
    getTokenBalance(token: string, address: string): Promise<bigint>;

    // Contract interaction
    call(contract: string, data: string): Promise<string>;
    estimateGas(tx: TransactionRequest): Promise<bigint>;

    // Chain-specific
    getBlockNumber(): Promise<number>;
    getGasPrice(): Promise<bigint>;
}
```

**Supported Chains:**

| Chain | Chain ID | Adapter | Confirmations |
|-------|----------|---------|---------------|
| LUX Mainnet | 96369 | `LuxAdapter` | 1 |
| LUX Testnet | 96368 | `LuxAdapter` | 1 |
| Ethereum | 1 | `EthereumAdapter` | 12 |
| Base | 8453 | `BaseAdapter` | 12 |
| Arbitrum | 42161 | `ArbitrumAdapter` | 12 |
| Optimism | 10 | `OptimismAdapter` | 12 |
| Polygon | 137 | `PolygonAdapter` | 256 |
| BSC | 56 | `BscAdapter` | 15 |
| ZOO | 200200 | `ZooAdapter` | 1 |

### 10. Security Considerations

1. **Private Key Handling**: Never expose private keys in client-side code. Use hardware wallets or server-side signing for production.

2. **RPC Endpoint Security**: Use authenticated RPC endpoints. Consider rate limiting and IP whitelisting.

3. **Input Validation**: All user inputs are validated before processing. Use the SDK's built-in validation.

4. **Signature Verification**: All MPC signatures are verified on-chain. The SDK does not trust off-chain signature claims.

5. **Nonce Management**: The SDK handles nonce management to prevent replay attacks.

6. **Timeout Handling**: All operations have configurable timeouts with sensible defaults.

### 11. Error Code Taxonomy

All SDK errors MUST use the following standardized error codes. Error codes are 5-digit integers organized by category.

#### 11.1 Error Code Ranges

| Range | Category | Description |
|-------|----------|-------------|
| 10000-10999 | Connection | Network and RPC connection errors |
| 11000-11999 | Authentication | Signing and authentication errors |
| 12000-12999 | Validation | Input validation errors |
| 13000-13999 | Bridge | Bridge-specific operation errors |
| 14000-14999 | Chain | Chain-specific errors |
| 15000-15999 | Timeout | Operation timeout errors |
| 16000-16999 | Rate Limit | Rate limiting errors |

#### 11.2 Error Code Definitions

**Connection Errors (10000-10999):**

| Code | Name | Description | Retryable |
|------|------|-------------|-----------|
| 10001 | `CONNECTION_FAILED` | Failed to establish connection to RPC endpoint | YES |
| 10002 | `CONNECTION_TIMEOUT` | Connection attempt timed out | YES |
| 10003 | `CONNECTION_CLOSED` | Connection was unexpectedly closed | YES |
| 10004 | `INVALID_RPC_URL` | Malformed or invalid RPC URL | NO |
| 10005 | `RPC_ERROR` | RPC endpoint returned an error | DEPENDS |
| 10006 | `WEBSOCKET_ERROR` | WebSocket connection error | YES |
| 10007 | `DNS_RESOLUTION_FAILED` | DNS lookup failed for RPC host | YES |

**Authentication Errors (11000-11999):**

| Code | Name | Description | Retryable |
|------|------|-------------|-----------|
| 11001 | `SIGNER_NOT_CONFIGURED` | No signer configured for write operations | NO |
| 11002 | `SIGNATURE_FAILED` | Failed to sign message or transaction | NO |
| 11003 | `INVALID_PRIVATE_KEY` | Invalid private key format | NO |
| 11004 | `INVALID_MNEMONIC` | Invalid mnemonic phrase | NO |
| 11005 | `HARDWARE_WALLET_ERROR` | Hardware wallet communication error | YES |
| 11006 | `USER_REJECTED` | User rejected the signature request | NO |
| 11007 | `INVALID_DERIVATION_PATH` | Invalid HD derivation path | NO |

**Validation Errors (12000-12999):**

| Code | Name | Description | Retryable |
|------|------|-------------|-----------|
| 12001 | `INVALID_ADDRESS` | Invalid address format | NO |
| 12002 | `INVALID_AMOUNT` | Invalid amount (zero, negative, or exceeds balance) | NO |
| 12003 | `INVALID_TOKEN` | Token address not recognized | NO |
| 12004 | `INVALID_CHAIN_ID` | Unsupported chain ID | NO |
| 12005 | `AMOUNT_TOO_SMALL` | Amount below minimum bridge amount | NO |
| 12006 | `AMOUNT_TOO_LARGE` | Amount exceeds maximum bridge amount | NO |
| 12007 | `INVALID_RECIPIENT` | Invalid recipient address | NO |
| 12008 | `SLIPPAGE_EXCEEDED` | Price slippage exceeded tolerance | NO |
| 12009 | `DEADLINE_EXPIRED` | Transaction deadline has passed | NO |

**Bridge Errors (13000-13999):**

| Code | Name | Description | Retryable |
|------|------|-------------|-----------|
| 13001 | `INSUFFICIENT_BALANCE` | Insufficient token balance | NO |
| 13002 | `INSUFFICIENT_ALLOWANCE` | Token allowance too low | NO |
| 13003 | `BRIDGE_PAUSED` | Bridge is temporarily paused | YES |
| 13004 | `ROUTE_NOT_FOUND` | No bridge route for token pair | NO |
| 13005 | `DEPOSIT_FAILED` | Deposit transaction failed | NO |
| 13006 | `WITHDRAW_FAILED` | Withdrawal transaction failed | NO |
| 13007 | `MPC_SIGNATURE_FAILED` | MPC signing session failed | YES |
| 13008 | `RELEASE_FAILED` | Token release transaction failed | YES |
| 13009 | `OPERATION_NOT_FOUND` | Deposit/withdraw ID not found | NO |
| 13010 | `DUPLICATE_OPERATION` | Operation already processed | NO |
| 13011 | `INSUFFICIENT_LIQUIDITY` | Insufficient bridge liquidity | YES |

**Chain Errors (14000-14999):**

| Code | Name | Description | Retryable |
|------|------|-------------|-----------|
| 14001 | `CHAIN_NOT_SUPPORTED` | Chain is not supported | NO |
| 14002 | `TOKEN_NOT_SUPPORTED` | Token not supported on chain | NO |
| 14003 | `NONCE_TOO_LOW` | Transaction nonce too low | YES |
| 14004 | `GAS_ESTIMATION_FAILED` | Failed to estimate gas | YES |
| 14005 | `TRANSACTION_UNDERPRICED` | Gas price too low | YES |
| 14006 | `TRANSACTION_REVERTED` | Transaction reverted on-chain | NO |
| 14007 | `BLOCK_NOT_FOUND` | Block not found | YES |
| 14008 | `CHAIN_REORGANIZED` | Chain reorg detected | YES |

**Timeout Errors (15000-15999):**

| Code | Name | Description | Retryable |
|------|------|-------------|-----------|
| 15001 | `OPERATION_TIMEOUT` | Operation exceeded timeout | YES |
| 15002 | `CONFIRMATION_TIMEOUT` | Waiting for confirmations timed out | YES |
| 15003 | `MPC_SIGNATURE_TIMEOUT` | MPC signing session timed out | YES |
| 15004 | `POLL_TIMEOUT` | Status polling exceeded timeout | YES |

**Rate Limit Errors (16000-16999):**

| Code | Name | Description | Retryable |
|------|------|-------------|-----------|
| 16001 | `RATE_LIMITED` | Request rate limit exceeded | YES |
| 16002 | `DAILY_LIMIT_EXCEEDED` | Daily operation limit exceeded | NO |
| 16003 | `CONCURRENT_LIMIT_EXCEEDED` | Too many concurrent operations | YES |

#### 11.3 Error Structure

All errors MUST include the following fields:

```typescript
interface BridgeError {
    code: number;           // Error code from taxonomy
    name: string;           // Error name (e.g., "INSUFFICIENT_BALANCE")
    message: string;        // Human-readable description
    retryable: boolean;     // Whether operation can be retried
    details?: {             // Optional contextual details
        chainId?: number;
        token?: string;
        amount?: string;
        required?: string;
        balance?: string;
        sessionId?: string;
        txHash?: string;
    };
    cause?: Error;          // Underlying error if applicable
}
```

**Go Error Structure:**

```go
type BridgeError struct {
    Code      int               `json:"code"`
    Name      string            `json:"name"`
    Message   string            `json:"message"`
    Retryable bool              `json:"retryable"`
    Details   map[string]string `json:"details,omitempty"`
    Cause     error             `json:"-"`
}

func (e *BridgeError) Error() string {
    return fmt.Sprintf("[%d] %s: %s", e.Code, e.Name, e.Message)
}

func (e *BridgeError) Unwrap() error {
    return e.Cause
}

// Predefined error constructors
func ErrInsufficientBalance(have, need *big.Int) *BridgeError {
    return &BridgeError{
        Code:      13001,
        Name:      "INSUFFICIENT_BALANCE",
        Message:   fmt.Sprintf("insufficient balance: have %s, need %s", have, need),
        Retryable: false,
        Details: map[string]string{
            "balance":  have.String(),
            "required": need.String(),
        },
    }
}

func ErrConnectionTimeout(endpoint string, duration time.Duration) *BridgeError {
    return &BridgeError{
        Code:      10002,
        Name:      "CONNECTION_TIMEOUT",
        Message:   fmt.Sprintf("connection to %s timed out after %v", endpoint, duration),
        Retryable: true,
        Details: map[string]string{
            "endpoint": endpoint,
            "timeout":  duration.String(),
        },
    }
}
```

**Python Error Structure:**

```python
from dataclasses import dataclass, field
from typing import Optional, Dict, Any

@dataclass
class BridgeError(Exception):
    """Base error class for all bridge SDK errors."""
    code: int
    name: str
    message: str
    retryable: bool
    details: Dict[str, Any] = field(default_factory=dict)
    cause: Optional[Exception] = None

    def __str__(self) -> str:
        return f"[{self.code}] {self.name}: {self.message}"

# Specific error classes
@dataclass
class InsufficientBalanceError(BridgeError):
    """Raised when account balance is insufficient."""
    balance: int = 0
    required: int = 0

    def __post_init__(self):
        self.code = 13001
        self.name = "INSUFFICIENT_BALANCE"
        self.message = f"insufficient balance: have {self.balance}, need {self.required}"
        self.retryable = False
        self.details = {"balance": str(self.balance), "required": str(self.required)}

@dataclass
class RateLimitedError(BridgeError):
    """Raised when rate limit is exceeded."""
    retry_after: float = 0

    def __post_init__(self):
        self.code = 16001
        self.name = "RATE_LIMITED"
        self.message = f"rate limit exceeded, retry after {self.retry_after}s"
        self.retryable = True
        self.details = {"retry_after": str(self.retry_after)}
```

### 12. Retry Strategy Specification

Implementations MUST support configurable retry strategies with exponential backoff as the default.

#### 12.1 Exponential Backoff Algorithm

The delay before retry attempt `n` (1-indexed) MUST be calculated as:

```
delay_n = min(initial_delay * (multiplier ^ (n - 1)) + jitter, max_delay)
```

Where:
- `initial_delay`: Starting delay (default: 1000ms)
- `multiplier`: Backoff multiplier (default: 2.0)
- `max_delay`: Maximum delay cap (default: 30000ms)
- `jitter`: Random value in range [0, initial_delay * 0.1]

#### 12.2 Retry Configuration

```typescript
interface RetryConfig {
    maxAttempts: number;        // Maximum retry attempts (default: 3)
    initialDelayMs: number;     // Initial delay in milliseconds (default: 1000)
    maxDelayMs: number;         // Maximum delay cap (default: 30000)
    multiplier: number;         // Backoff multiplier (default: 2.0)
    jitterEnabled: boolean;     // Enable jitter (default: true)
    retryableCodes: number[];   // Error codes to retry (default: all retryable)
}
```

**Go Implementation:**

```go
package retry

import (
    "context"
    "math"
    "math/rand"
    "time"

    "github.com/luxfi/sdk/bridge"
)

// Config defines retry behavior.
type Config struct {
    MaxAttempts   int
    InitialDelay  time.Duration
    MaxDelay      time.Duration
    Multiplier    float64
    JitterEnabled bool
    RetryableFn   func(error) bool
}

// DefaultConfig returns sensible defaults.
func DefaultConfig() Config {
    return Config{
        MaxAttempts:   3,
        InitialDelay:  time.Second,
        MaxDelay:      30 * time.Second,
        Multiplier:    2.0,
        JitterEnabled: true,
        RetryableFn:   IsRetryable,
    }
}

// IsRetryable returns true if the error can be retried.
func IsRetryable(err error) bool {
    var bridgeErr *bridge.BridgeError
    if errors.As(err, &bridgeErr) {
        return bridgeErr.Retryable
    }
    return false
}

// Do executes fn with retries according to config.
func Do[T any](ctx context.Context, cfg Config, fn func() (T, error)) (T, error) {
    var lastErr error
    var zero T

    for attempt := 1; attempt <= cfg.MaxAttempts; attempt++ {
        result, err := fn()
        if err == nil {
            return result, nil
        }

        lastErr = err
        if !cfg.RetryableFn(err) {
            return zero, err
        }

        if attempt < cfg.MaxAttempts {
            delay := cfg.calculateDelay(attempt)
            select {
            case <-ctx.Done():
                return zero, ctx.Err()
            case <-time.After(delay):
            }
        }
    }

    return zero, fmt.Errorf("all %d attempts failed: %w", cfg.MaxAttempts, lastErr)
}

func (c Config) calculateDelay(attempt int) time.Duration {
    delay := float64(c.InitialDelay) * math.Pow(c.Multiplier, float64(attempt-1))
    if delay > float64(c.MaxDelay) {
        delay = float64(c.MaxDelay)
    }

    if c.JitterEnabled {
        jitter := rand.Float64() * float64(c.InitialDelay) * 0.1
        delay += jitter
    }

    return time.Duration(delay)
}

// Usage example
func ExampleRetry() {
    client, _ := bridge.NewClient(bridge.Config{
        LuxRPCURL: "http://localhost:9630",
    })

    ctx := context.Background()
    cfg := retry.DefaultConfig()

    result, err := retry.Do(ctx, cfg, func() (*bridge.DepositResult, error) {
        return client.Deposit(ctx, depositParams)
    })
    if err != nil {
        log.Fatalf("deposit failed after retries: %v", err)
    }

    log.Printf("deposit succeeded: %s", result.DepositID)
}
```

**Python Implementation:**

```python
import asyncio
import random
from dataclasses import dataclass, field
from typing import TypeVar, Callable, Awaitable, List, Optional

from luxfi.bridge.errors import BridgeError

T = TypeVar('T')

@dataclass
class RetryConfig:
    """Configuration for retry behavior."""
    max_attempts: int = 3
    initial_delay: float = 1.0  # seconds
    max_delay: float = 30.0     # seconds
    multiplier: float = 2.0
    jitter_enabled: bool = True
    retryable_codes: List[int] = field(default_factory=list)

    def is_retryable(self, error: Exception) -> bool:
        """Check if error should trigger a retry."""
        if isinstance(error, BridgeError):
            if self.retryable_codes:
                return error.code in self.retryable_codes
            return error.retryable
        return False

    def calculate_delay(self, attempt: int) -> float:
        """Calculate delay for given attempt number (1-indexed)."""
        delay = self.initial_delay * (self.multiplier ** (attempt - 1))
        delay = min(delay, self.max_delay)

        if self.jitter_enabled:
            jitter = random.uniform(0, self.initial_delay * 0.1)
            delay += jitter

        return delay


async def retry(
    fn: Callable[[], Awaitable[T]],
    config: Optional[RetryConfig] = None,
) -> T:
    """Execute async function with retry logic.

    Args:
        fn: Async function to execute
        config: Retry configuration (uses defaults if None)

    Returns:
        Result from successful function call

    Raises:
        Last error if all retries exhausted
    """
    cfg = config or RetryConfig()
    last_error: Optional[Exception] = None

    for attempt in range(1, cfg.max_attempts + 1):
        try:
            return await fn()
        except Exception as e:
            last_error = e

            if not cfg.is_retryable(e):
                raise

            if attempt < cfg.max_attempts:
                delay = cfg.calculate_delay(attempt)
                await asyncio.sleep(delay)

    raise last_error


# Usage example
async def deposit_with_retry():
    from luxfi.bridge import BridgeClient

    client = BridgeClient(lux_rpc_url="http://localhost:9630")
    await client.connect()

    config = RetryConfig(
        max_attempts=5,
        initial_delay=1.0,
        multiplier=2.0,
    )

    result = await retry(
        lambda: client.deposit(
            source_chain_id=1,
            destination_chain_id=96369,
            token="0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
            amount=1000000000,
            recipient="0xYourAddress",
        ),
        config=config,
    )

    print(f"Deposit succeeded: {result.deposit_id}")
```

#### 12.3 Retry Decision Matrix

| Error Code | Retry | Notes |
|------------|-------|-------|
| 10001-10007 | YES | Network errors are transient |
| 11001-11007 | NO | Authentication errors require user action |
| 12001-12009 | NO | Validation errors won't change on retry |
| 13001-13002 | NO | Balance/allowance won't change |
| 13003 | YES | Bridge may unpause |
| 13004-13006 | NO | Permanent failures |
| 13007-13008 | YES | MPC may succeed on retry |
| 13009-13011 | VARIES | See specific codes |
| 14003-14005 | YES | Nonce/gas issues are transient |
| 14006 | NO | Reverts are permanent |
| 15001-15004 | YES | Timeouts can be retried |
| 16001 | YES | After backoff delay |
| 16002 | NO | Daily limits are enforced |
| 16003 | YES | After concurrent ops complete |

### 13. Rate Limiting

Implementations SHOULD implement client-side rate limiting to avoid overwhelming RPC endpoints and to respect service quotas.

#### 13.1 Rate Limiter Interface

```typescript
interface RateLimiter {
    // Acquire permission to make a request
    acquire(): Promise<void>;

    // Acquire with timeout
    acquireWithTimeout(timeoutMs: number): Promise<boolean>;

    // Check if rate limited without blocking
    tryAcquire(): boolean;

    // Get current state
    getState(): RateLimiterState;
}

interface RateLimiterState {
    availableTokens: number;
    waitingRequests: number;
    lastRefillTime: number;
}

interface RateLimiterConfig {
    requestsPerSecond: number;  // Token refill rate (default: 10)
    burstSize: number;          // Maximum burst capacity (default: 20)
    maxWaitingRequests: number; // Queue limit (default: 100)
}
```

#### 13.2 Token Bucket Implementation

**Go Implementation:**

```go
package ratelimit

import (
    "context"
    "sync"
    "time"
)

// Limiter implements token bucket rate limiting.
type Limiter struct {
    mu              sync.Mutex
    tokens          float64
    maxTokens       float64
    refillRate      float64 // tokens per second
    lastRefillTime  time.Time
    waitQueue       chan struct{}
    maxWaiting      int
}

// Config defines rate limiter behavior.
type Config struct {
    RequestsPerSecond float64
    BurstSize         int
    MaxWaiting        int
}

// DefaultConfig returns production defaults.
func DefaultConfig() Config {
    return Config{
        RequestsPerSecond: 10,
        BurstSize:         20,
        MaxWaiting:        100,
    }
}

// New creates a rate limiter with the given config.
func New(cfg Config) *Limiter {
    return &Limiter{
        tokens:         float64(cfg.BurstSize),
        maxTokens:      float64(cfg.BurstSize),
        refillRate:     cfg.RequestsPerSecond,
        lastRefillTime: time.Now(),
        waitQueue:      make(chan struct{}, cfg.MaxWaiting),
        maxWaiting:     cfg.MaxWaiting,
    }
}

// Acquire blocks until a token is available.
func (l *Limiter) Acquire(ctx context.Context) error {
    // Try to acquire immediately
    if l.TryAcquire() {
        return nil
    }

    // Queue up
    select {
    case l.waitQueue <- struct{}{}:
        defer func() { <-l.waitQueue }()
    default:
        return &BridgeError{
            Code:      16003,
            Name:      "CONCURRENT_LIMIT_EXCEEDED",
            Message:   "too many waiting requests",
            Retryable: true,
        }
    }

    // Wait for token
    ticker := time.NewTicker(10 * time.Millisecond)
    defer ticker.Stop()

    for {
        select {
        case <-ctx.Done():
            return ctx.Err()
        case <-ticker.C:
            if l.TryAcquire() {
                return nil
            }
        }
    }
}

// TryAcquire attempts to acquire a token without blocking.
func (l *Limiter) TryAcquire() bool {
    l.mu.Lock()
    defer l.mu.Unlock()

    l.refill()

    if l.tokens >= 1 {
        l.tokens--
        return true
    }
    return false
}

func (l *Limiter) refill() {
    now := time.Now()
    elapsed := now.Sub(l.lastRefillTime).Seconds()
    l.tokens += elapsed * l.refillRate
    if l.tokens > l.maxTokens {
        l.tokens = l.maxTokens
    }
    l.lastRefillTime = now
}

// State returns current limiter state.
func (l *Limiter) State() State {
    l.mu.Lock()
    defer l.mu.Unlock()

    l.refill()
    return State{
        AvailableTokens:  l.tokens,
        WaitingRequests:  len(l.waitQueue),
        LastRefillTime:   l.lastRefillTime,
    }
}

type State struct {
    AvailableTokens float64
    WaitingRequests int
    LastRefillTime  time.Time
}
```

**Python Implementation:**

```python
import asyncio
import time
from dataclasses import dataclass
from typing import Optional

from luxfi.bridge.errors import BridgeError

@dataclass
class RateLimiterConfig:
    """Configuration for rate limiter."""
    requests_per_second: float = 10.0
    burst_size: int = 20
    max_waiting: int = 100


class RateLimiter:
    """Token bucket rate limiter for async operations."""

    def __init__(self, config: Optional[RateLimiterConfig] = None):
        cfg = config or RateLimiterConfig()
        self._tokens = float(cfg.burst_size)
        self._max_tokens = float(cfg.burst_size)
        self._refill_rate = cfg.requests_per_second
        self._last_refill = time.monotonic()
        self._waiting = 0
        self._max_waiting = cfg.max_waiting
        self._lock = asyncio.Lock()

    async def acquire(self, timeout: Optional[float] = None) -> None:
        """Acquire a token, blocking until available.

        Args:
            timeout: Maximum wait time in seconds (None for indefinite)

        Raises:
            BridgeError: If max waiting requests exceeded or timeout
        """
        if self.try_acquire():
            return

        if self._waiting >= self._max_waiting:
            raise BridgeError(
                code=16003,
                name="CONCURRENT_LIMIT_EXCEEDED",
                message="too many waiting requests",
                retryable=True,
            )

        self._waiting += 1
        try:
            start = time.monotonic()
            while True:
                await asyncio.sleep(0.01)  # 10ms polling

                if self.try_acquire():
                    return

                if timeout is not None:
                    elapsed = time.monotonic() - start
                    if elapsed >= timeout:
                        raise BridgeError(
                            code=16001,
                            name="RATE_LIMITED",
                            message=f"rate limit timeout after {timeout}s",
                            retryable=True,
                        )
        finally:
            self._waiting -= 1

    def try_acquire(self) -> bool:
        """Try to acquire a token without blocking.

        Returns:
            True if token acquired, False otherwise
        """
        self._refill()

        if self._tokens >= 1:
            self._tokens -= 1
            return True
        return False

    def _refill(self) -> None:
        """Refill tokens based on elapsed time."""
        now = time.monotonic()
        elapsed = now - self._last_refill
        self._tokens += elapsed * self._refill_rate
        self._tokens = min(self._tokens, self._max_tokens)
        self._last_refill = now

    @property
    def state(self) -> dict:
        """Get current rate limiter state."""
        self._refill()
        return {
            "available_tokens": self._tokens,
            "waiting_requests": self._waiting,
            "last_refill_time": self._last_refill,
        }


# Usage with bridge client
class RateLimitedBridgeClient:
    """Bridge client with built-in rate limiting."""

    def __init__(self, client, limiter: Optional[RateLimiter] = None):
        self._client = client
        self._limiter = limiter or RateLimiter()

    async def deposit(self, **kwargs):
        """Rate-limited deposit operation."""
        await self._limiter.acquire()
        return await self._client.deposit(**kwargs)

    async def withdraw(self, **kwargs):
        """Rate-limited withdraw operation."""
        await self._limiter.acquire()
        return await self._client.withdraw(**kwargs)

    async def get_deposit_status(self, deposit_id: str):
        """Rate-limited status query."""
        await self._limiter.acquire()
        return await self._client.get_deposit_status(deposit_id)
```

#### 13.3 Per-Chain Rate Limits

Different chains have different RPC rate limits. Implementations SHOULD use per-chain limiters:

| Chain | Recommended RPS | Burst Size | Notes |
|-------|-----------------|------------|-------|
| LUX | 50 | 100 | Local node: unlimited |
| Ethereum | 10 | 20 | Varies by provider |
| Base | 10 | 20 | Varies by provider |
| Arbitrum | 10 | 20 | Varies by provider |
| Optimism | 10 | 20 | Varies by provider |
| Polygon | 30 | 50 | Higher limits |

### 14. Test Vectors

This section provides test vectors for SDK conformance testing.

#### 14.1 Address Encoding

```json
{
  "test_vectors": [
    {
      "name": "Valid Ethereum address",
      "input": "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
      "normalized": "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
      "valid": true
    },
    {
      "name": "Lowercase address",
      "input": "0xd8da6bf26964af9d7eed9e03e53415d37aa96045",
      "normalized": "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
      "valid": true
    },
    {
      "name": "Invalid checksum",
      "input": "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96046",
      "valid": false,
      "error_code": 12001
    },
    {
      "name": "Invalid length",
      "input": "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA9604",
      "valid": false,
      "error_code": 12001
    }
  ]
}
```

#### 14.2 Amount Parsing

```json
{
  "test_vectors": [
    {
      "name": "Parse USDC amount",
      "input": "1000",
      "decimals": 6,
      "expected_wei": "1000000000"
    },
    {
      "name": "Parse ETH amount",
      "input": "1.5",
      "decimals": 18,
      "expected_wei": "1500000000000000000"
    },
    {
      "name": "Parse with max precision",
      "input": "0.000001",
      "decimals": 6,
      "expected_wei": "1"
    },
    {
      "name": "Parse zero",
      "input": "0",
      "decimals": 18,
      "expected_wei": "0"
    },
    {
      "name": "Reject negative",
      "input": "-100",
      "decimals": 6,
      "valid": false,
      "error_code": 12002
    }
  ]
}
```

#### 14.3 Fee Estimation Vectors

```json
{
  "test_vectors": [
    {
      "name": "USDC Ethereum to Lux deposit",
      "source_chain": 1,
      "destination_chain": 96369,
      "token": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      "amount": "1000000000",
      "expected_fee": {
        "bridge_fee_bps": 10,
        "min_fee": "100000",
        "source_gas_estimate": "150000",
        "destination_gas_estimate": "100000"
      }
    },
    {
      "name": "Native ETH to Lux deposit",
      "source_chain": 1,
      "destination_chain": 96369,
      "token": "0x0000000000000000000000000000000000000000",
      "amount": "1000000000000000000",
      "expected_fee": {
        "bridge_fee_bps": 5,
        "min_fee": "1000000000000000",
        "source_gas_estimate": "21000",
        "destination_gas_estimate": "100000"
      }
    }
  ]
}
```

#### 14.4 SDK Usage Test Vectors

**Go SDK Test:**

```go
package bridge_test

import (
    "context"
    "math/big"
    "testing"
    "time"

    "github.com/luxfi/sdk/bridge"
    "github.com/luxfi/sdk/chain"
    "github.com/luxfi/sdk/common"
)

func TestDepositFeeEstimation(t *testing.T) {
    // Connect to Lux testnet
    client, err := bridge.NewClient(bridge.Config{
        LuxRPCURL: "http://localhost:9630",
        Timeout:   30 * time.Second,
    })
    if err != nil {
        t.Fatalf("failed to create client: %v", err)
    }
    defer client.Close()

    ctx := context.Background()
    if err := client.Connect(ctx); err != nil {
        t.Fatalf("failed to connect: %v", err)
    }

    // Test fee estimation
    amount := new(big.Int)
    amount.SetString("1000000000", 10) // 1000 USDC

    fee, err := client.EstimateDepositFee(ctx, &bridge.DepositParams{
        SourceChainID:      chain.Ethereum,
        DestinationChainID: chain.LuxMainnet,
        Token:              common.HexToAddress("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"),
        Amount:             amount,
    })
    if err != nil {
        t.Fatalf("fee estimation failed: %v", err)
    }

    // Verify fee structure
    if fee.BridgeFee == nil || fee.BridgeFee.Sign() < 0 {
        t.Error("bridge fee should be non-negative")
    }
    if fee.SourceGasFee == nil || fee.SourceGasFee.Sign() <= 0 {
        t.Error("source gas fee should be positive")
    }
    if fee.EstimatedTimeSeconds <= 0 {
        t.Error("estimated time should be positive")
    }

    t.Logf("Fee estimate: bridge=%s, gas=%s, time=%ds",
        fee.BridgeFee, fee.SourceGasFee, fee.EstimatedTimeSeconds)
}

func TestErrorHandling(t *testing.T) {
    client, _ := bridge.NewClient(bridge.Config{
        LuxRPCURL: "http://localhost:9630",
    })
    defer client.Close()

    ctx := context.Background()
    _ = client.Connect(ctx)

    // Test insufficient balance error
    amount := new(big.Int)
    amount.SetString("999999999999999999999999", 10) // Huge amount

    _, err := client.Deposit(ctx, &bridge.DepositParams{
        SourceChainID:      chain.Ethereum,
        DestinationChainID: chain.LuxMainnet,
        Token:              common.HexToAddress("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"),
        Amount:             amount,
        Recipient:          common.HexToAddress("0x1234567890123456789012345678901234567890"),
    })

    var insufficientBalance *bridge.InsufficientBalanceError
    if !errors.As(err, &insufficientBalance) {
        t.Errorf("expected InsufficientBalanceError, got %T: %v", err, err)
    }

    if insufficientBalance.Code != 13001 {
        t.Errorf("expected error code 13001, got %d", insufficientBalance.Code)
    }
}

func TestRateLimiting(t *testing.T) {
    limiter := ratelimit.New(ratelimit.Config{
        RequestsPerSecond: 10,
        BurstSize:         5,
        MaxWaiting:        10,
    })

    ctx := context.Background()

    // Burst should succeed
    for i := 0; i < 5; i++ {
        if !limiter.TryAcquire() {
            t.Errorf("burst request %d should succeed", i)
        }
    }

    // Next should fail immediately
    if limiter.TryAcquire() {
        t.Error("request after burst should fail")
    }

    // Should succeed after waiting
    time.Sleep(200 * time.Millisecond) // Wait for ~2 tokens
    if !limiter.TryAcquire() {
        t.Error("request after refill should succeed")
    }
}
```

**Python SDK Test:**

```python
import asyncio
import pytest
from decimal import Decimal

from luxfi.bridge import BridgeClient, ChainId
from luxfi.bridge.errors import InsufficientBalanceError, BridgeError
from luxfi.bridge.utils import parse_units, format_units
from luxfi.bridge.ratelimit import RateLimiter, RateLimiterConfig


@pytest.fixture
async def client():
    """Create connected bridge client."""
    client = BridgeClient(lux_rpc_url="http://localhost:9630")
    await client.connect()
    yield client
    await client.disconnect()


@pytest.mark.asyncio
async def test_fee_estimation(client):
    """Test deposit fee estimation returns valid structure."""
    fee = await client.estimate_deposit_fee(
        source_chain_id=ChainId.ETHEREUM,
        destination_chain_id=ChainId.LUX_MAINNET,
        token="0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        amount=parse_units("1000", 6),
    )

    assert fee.bridge_fee >= 0, "bridge fee should be non-negative"
    assert fee.source_gas_fee > 0, "source gas fee should be positive"
    assert fee.estimated_time_seconds > 0, "estimated time should be positive"

    print(f"Fee estimate: bridge={fee.bridge_fee}, "
          f"gas={fee.source_gas_fee}, time={fee.estimated_time_seconds}s")


@pytest.mark.asyncio
async def test_insufficient_balance_error(client):
    """Test that insufficient balance raises correct error."""
    huge_amount = parse_units("999999999999", 6)  # Way more than any balance

    with pytest.raises(InsufficientBalanceError) as exc_info:
        await client.deposit(
            source_chain_id=ChainId.ETHEREUM,
            destination_chain_id=ChainId.LUX_MAINNET,
            token="0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
            amount=huge_amount,
            recipient="0x1234567890123456789012345678901234567890",
        )

    error = exc_info.value
    assert error.code == 13001
    assert error.name == "INSUFFICIENT_BALANCE"
    assert not error.retryable


@pytest.mark.asyncio
async def test_address_validation():
    """Test address validation."""
    client = BridgeClient(lux_rpc_url="http://localhost:9630")
    await client.connect()

    # Valid address should work
    valid = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"
    assert client.validate_address(valid) is True

    # Invalid checksum should fail
    invalid = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96046"
    with pytest.raises(BridgeError) as exc_info:
        client.validate_address(invalid, strict=True)
    assert exc_info.value.code == 12001

    await client.disconnect()


@pytest.mark.asyncio
async def test_rate_limiter():
    """Test token bucket rate limiter."""
    config = RateLimiterConfig(
        requests_per_second=10,
        burst_size=5,
        max_waiting=10,
    )
    limiter = RateLimiter(config)

    # Burst should succeed
    for i in range(5):
        assert limiter.try_acquire(), f"burst request {i} should succeed"

    # Next should fail immediately
    assert not limiter.try_acquire(), "request after burst should fail"

    # Should succeed after waiting
    await asyncio.sleep(0.2)  # Wait for ~2 tokens
    assert limiter.try_acquire(), "request after refill should succeed"


@pytest.mark.asyncio
async def test_amount_parsing():
    """Test amount parsing utilities."""
    # Standard parsing
    assert parse_units("1000", 6) == 1000000000
    assert parse_units("1.5", 18) == 1500000000000000000
    assert parse_units("0.000001", 6) == 1
    assert parse_units("0", 18) == 0

    # Formatting
    assert format_units(1000000000, 6) == "1000.0"
    assert format_units(1500000000000000000, 18) == "1.5"

    # Negative should fail
    with pytest.raises(BridgeError) as exc_info:
        parse_units("-100", 6)
    assert exc_info.value.code == 12002


@pytest.mark.asyncio
async def test_chain_support():
    """Test chain support queries."""
    client = BridgeClient(lux_rpc_url="http://localhost:9630")
    await client.connect()

    chains = await client.get_supported_chains()

    # LUX mainnet must be supported
    lux_chain = next((c for c in chains if c.chain_id == 96369), None)
    assert lux_chain is not None, "LUX mainnet must be supported"
    assert lux_chain.name == "LUX Mainnet"

    # Ethereum must be supported
    eth_chain = next((c for c in chains if c.chain_id == 1), None)
    assert eth_chain is not None, "Ethereum must be supported"

    await client.disconnect()
```

#### 14.5 Connection Test Vectors

```json
{
  "test_vectors": [
    {
      "name": "Local Lux node connection",
      "rpc_url": "http://localhost:9630",
      "b_chain_path": "/ext/bc/B/rpc",
      "t_chain_path": "/ext/bc/T/rpc",
      "c_chain_path": "/ext/bc/C/rpc",
      "expected_port": 9630
    },
    {
      "name": "Production Lux connection",
      "rpc_url": "https://api.lux.network",
      "expected_chains": [96369, 200200, 36911],
      "timeout_ms": 30000
    },
    {
      "name": "Invalid URL should fail",
      "rpc_url": "not-a-valid-url",
      "expected_error_code": 10004
    },
    {
      "name": "Unreachable host should timeout",
      "rpc_url": "http://192.0.2.1:9630",
      "expected_error_code": 10002,
      "timeout_ms": 5000
    }
  ]
}
```

## Rationale

### Why Three SDKs?

Different application contexts require different languages:
- **TypeScript**: Web applications, browser extensions, Node.js services
- **Go**: High-performance backend services, integration with luxfi/node
- **Python**: Data analysis, scripting, ML/AI applications

### Why Event-Driven Architecture?

Bridge operations are inherently asynchronous and long-running. Event subscriptions provide:
- Real-time status updates
- Non-blocking operation
- Clean separation of concerns

### Why Structured Errors?

Precise error types enable:
- Automated error handling
- Clear user feedback
- Proper retry logic

### Trade-off: SDK Complexity vs. Protocol Complexity

**Chosen Trade-off: SDK Simplicity**

The SDK abstracts protocol complexity (MPC coordination, multi-chain routing, signature formats) behind simple APIs. This increases SDK maintenance burden but dramatically improves developer experience. Protocol changes require SDK updates, but applications using the SDK remain stable.

## Backwards Compatibility

The SDK versioning follows semantic versioning:
- Major versions: Breaking API changes
- Minor versions: New features, backwards compatible
- Patch versions: Bug fixes

Deprecation warnings are provided for at least one minor version before removal.

## Test Cases

See `bridge/test/sdk/` for comprehensive test suites covering:
- Unit tests for each module
- Integration tests with mock bridge
- E2E tests against testnet

## Reference Implementation

### Repositories

| Repository | Language | Status |
|------------|----------|--------|
| [github.com/luxfi/sdk-ts](https://github.com/luxfi/sdk-ts) | TypeScript | Active |
| [github.com/luxfi/sdk](https://github.com/luxfi/sdk) | Go | Active |
| [github.com/luxfi/sdk-py](https://github.com/luxfi/sdk-py) | Python | Active |

### Related Specifications

- **LP-0332**: Teleport Bridge Architecture - Unified Cross-Chain Protocol
- **LP-0335**: Bridge Smart Contract Integration
- **LP-0330**: T-Chain (ThresholdVM) Specification
- **LP-0331**: B-Chain (BridgeVM) Specification

## Copyright

Copyright and related rights waived via [CC0](../LICENSE.md).
