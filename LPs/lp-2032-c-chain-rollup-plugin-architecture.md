---
lp: 2032
title: C-Chain Rollup Plugin Architecture
description: A plugin-based architecture for integrating Optimism and other rollup stacks into the Lux C-Chain (geth) client
author: Lux Network Team
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Standards Track
category: Core
created: 2025-07-23
tags: [l2, evm, scaling]
requires: 26
---

## Abstract

This LP defines a modular, plugin-driven architecture for the Lux C-Chain client (based on geth) to support Optimism (OP Stack) and future rollup implementations. By decoupling rollup-specific logic into a separate `rollup` module, the C-Chain binary remains lean while offering seamless integration of rollup execution, consensus, RPC, and tooling via feature flags.

## Motivation

The Lux C-Chain guarantees EVM equivalence with Ethereum (LP-26). To extend this flexibility to layer-2 rollups (e.g., Optimism) and emerging chains, the C-Chain client must adopt a plugin model. This enables:
- **Separation of Concerns**: Core C-Chain logic remains focused on the base chain.
- **Rollup Isolation**: OP-specific forks, payload builders, and consensus modules live in dedicated packages.
- **Developer Ergonomics**: Integrators enable a rollup via flags without altering core code.
- **Future-Proofing**: Adding new rollups (Arbitrum, Base, custom) requires only drop-in modules under `rollup/`.

## Specification

### Repository Layout

Component directories under the C-Chain client:
```
cmd/geth/                # geth CLI entrypoint
core/                     # Ethereum base-chain implementation
consensus/                # Base-chain consensus (PoW/PoS)
rpc/                      # Base-chain RPC modules
rollup/                   # Rollup plugin modules
├─ optimism/              # Optimism stack integration
│  ├─ evm/                # OP-specific EVM forks and hardfork logic
│  ├─ consensus/          # OP rollup consensus rules (sequencer logic)
│  ├─ payload/            # OP payload builder (Cannon/CannonRollup)
│  ├─ rpc/                # OP RPC namespaces (eth_getBlockProof, etc.)
│  └─ cli/                # OP CLI commands (genesis, dev, attach)
└─ <rollup-name>/         # Future rollup modules
```

### Build and Feature Flags

Enable rollup code via Go build tags or flags:

```bash
# Build geth with Optimism support
go build -tags "rollup_optimism" ./cmd/geth

# Run geth with the OP plugin enabled
./geth --rollup.optimism --rollup.config ./config/optimism.toml
```

### CLI Integration

Extend the `geth` CLI to register rollup subcommands:

```go
// in cmd/geth/main.go
func init() {
    // Base-chain commands
    rootCmd.AddCommand(startCmd, attachCmd, ...)

    // Register rollup plugins
    if Flags.Rollup == "optimism" {
        optimism.RegisterCommands(rootCmd)
    }
}
```

### Configuration

Rollup-specific options in the geth config file:

```toml
[rollup]
type = "optimism"
genesis = "./optimism/genesis.json"
sequencer.enabled = true
relay.rpc = "https://mainnet.optimism.io"
```

### Rollup Module API

Rollup plugins implement a common interface:

```go
type RollupPlugin interface {
    Name() string
    RegisterGenesis(genesisPath string) error
    StartSequencer(ctx context.Context) error
    RegisterRPC(rpcServer *rpc.Server)
}
```

For Optimism, see `rollup/optimism/plugin.go` and subpackages.

## Rationale

Decoupling rollup logic into standalone modules mirrors how Paradigm's reth organizes its `crates/optimism/*` hierarchy (layout.md). It maximizes code reuse, simplifies testing, and aligns geth with modern, extensible client designs.

## Backwards Compatibility

The plugin architecture is fully additive. Without the `rollup_*` build tag or `--rollup` flag, geth behaves identically to the existing C-Chain client.

## Test Cases

- Build and run geth with no rollup → base-chain behavior.
- Build and run geth with Optimism tag and flag → OP payloads accepted.
- RPC calls under `rollup_optimism` namespace.

## Reference Implementation

Proof-of-concept module for Optimism integration lives in the `geth` repository under `rollup/optimism/`:
```text
geth/rollup/optimism/
├─ evm/
├─ consensus/
├─ payload/
├─ rpc/
└─ plugin.go
```

### References for OP‑Geth Architecture

For implementation patterns and infrastructure setup, see:
- `~/work/op/op-geth` (Optimism's op-geth client plugin layout)
- `~/work/op/infra` (supporting infrastructure and deployment tooling)

## Integration with Lux Node Multi-Consensus

To support unified node infrastructure, the Lux Node monorepo must embed the OP Stack consensus and relayer components (`op-node`) into its multi-consensus engine. Leveraging the same plugin model, a single Lux Node instance can validate both the base C-Chain and an Optimism rollup chain concurrently by loading both consensus plugins side-by-side.

## Implementation

### C-Chain Rollup Plugin Architecture

**Location**: `~/work/lux/geth/rollup/`
**GitHub**: [`github.com/luxfi/geth/tree/main/rollup`](https://github.com/luxfi/geth/tree/main/rollup)

**Core Plugins**:
- Location: `~/work/lux/geth/rollup/optimism/`
- [`plugin.go`](https://github.com/luxfi/geth/blob/main/rollup/optimism/plugin.go) - Plugin interface
- [`evm/fork.go`](https://github.com/luxfi/geth/blob/main/rollup/optimism/evm/fork.go) - EVM fork logic
- [`consensus/sequencer.go`](https://github.com/luxfi/geth/blob/main/rollup/optimism/consensus/sequencer.go) - Sequencer integration
- [`payload/builder.go`](https://github.com/luxfi/geth/blob/main/rollup/optimism/payload/builder.go) - Payload building
- [`rpc/methods.go`](https://github.com/luxfi/geth/blob/main/rollup/optimism/rpc/methods.go) - RPC extensions

**Build with Rollup Support**:
```bash
cd ~/work/lux/geth
go build -tags "rollup_optimism" -o geth ./cmd/geth
```

**Plugin Loading Example**:
```go
// From cmd/geth/main.go
if flags.Rollup == "optimism" {
    rollupPlugin := optimism.New(config)
    node.RegisterRollupPlugin(rollupPlugin)
}
```

**Testing**:
```bash
cd ~/work/lux/geth
go test ./rollup/optimism/... -v
```

### RPC Extensions

**Optimism-specific RPC methods** (under `rollup_` namespace):
- `rollup_getSequencerCommitment` - Get the latest sequencer commitment
- `rollup_getL1Proof` - Verify L1 proof inclusion
- `rollup_estimateGas` - Account for rollup fees in gas estimation

## Security Considerations

- Ensure isolation between rollup and base-chain state to avoid cross-contamination.
- Validate rollup-specific genesis and fork logic before execution.
- Limit RPC exposure to authorized namespaces when rollup plugin is enabled.
- Implement fraud proof verification for rollup sequencer commitments.

## Economic Impact (optional)

Rolling up to Ethereum mainnet incurs L1 gas costs proportional to the data published per batch. For example, publishing 10 KB of calldata at ~16 gas/byte costs ~160 000 gas. At 50 gwei and an ETH price of $1 800, that is ~$14.40 per batch. Amortized over 100 L2 transactions, that is ~$0.14 per L2 tx.

With EIP‑4844 (proto‑dank sharding), data gas cost falls to ~1.6 gas/byte—reducing cost by ~10×. Under the same assumptions, L1 cost per L2 tx drops to ~$0.015.

Sequencers (node operators) collect these L1 fees by charging an L2 base fee designed to cover L1 gas + operator margin. A typical fee model:
```
L2 base fee = (estimated L1 gas per L2 tx × current gas price) + operator service fee
```
Operator margins should cover infrastructure, storage, and bandwidth costs. Larger batch sizes (e.g. 100–500 tx) or longer aggregation windows reduce per‑tx gas costs.

## Open Questions (optional)

1. What batching window (tx count or time) balances L1 cost savings vs. L2 latency?
2. Should operator margins be fixed, market‑driven via auctions, or dynamically adjusted?
3. How should L1 gas refunds (e.g. EIP‑3529 burn refunds) be allocated back to L2 users or operators?
4. Which data availability layer (Ethereum L1 vs. Celestia vs. others) optimizes cost and throughput for Lux rollups?

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).