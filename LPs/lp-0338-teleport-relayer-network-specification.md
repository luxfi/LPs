---
lp: 0338
title: Teleport Relayer Network Specification [DEPRECATED]
description: DEPRECATED - The Teleport bridge uses a fully decentralized architecture without a separate relayer network. Cross-chain observation is handled by B-Chain watchers.
author: Lux Protocol Team (@luxdefi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Withdrawn
type: Standards Track
category: Core
created: 2025-12-11
withdrawal-reason: Architecture consolidation - B-Chain watchers provide decentralized cross-chain observation without separate relayer infrastructure
superseded-by: lp-0331
---

# LP-0338: Teleport Relayer Network Specification [DEPRECATED]

## Deprecation Notice

**This LP has been WITHDRAWN and is no longer part of the Teleport Bridge System architecture.**

### Reason for Deprecation

The separate Relayer Network concept has been deprecated because:

1. **Fully Decentralized Architecture**: The Teleport bridge operates as a decentralized network of chains (T-Chain, B-Chain) without requiring a separate relayer layer.

2. **B-Chain Watchers**: Cross-chain event observation is handled by B-Chain's integrated watchers, which are run by validators as part of the BridgeVM. This eliminates the need for separate relayer infrastructure.

3. **Warp Messaging**: Cross-chain communication within Lux Network uses native Warp messaging, which is handled at the consensus layer by validators.

4. **No Separate Incentive Layer**: By integrating observation into B-Chain validators, the incentive structure is unified with staking rather than requiring separate relayer economics.

### Decentralized Architecture

The Teleport bridge operates without relayers:

```
+-------------------------------------------------------------------------+
|                    Teleport Bridge (Decentralized)                       |
+-------------------------------------------------------------------------+
|                                                                         |
|  +-------------------+                      +-------------------+        |
|  |   External Chain  |                      |   Lux Network     |        |
|  |   (ETH, BTC, etc) |                      |                   |        |
|  +-------------------+                      +-------------------+        |
|         |                                           ^                   |
|         | Events                                    | Warp Messages     |
|         v                                           |                   |
|  +-------------------+    Validator Set     +-------------------+        |
|  | B-Chain Watchers  | <==================> | T-Chain Signers   |        |
|  | (per validator)   |                      | (threshold MPC)   |        |
|  +-------------------+                      +-------------------+        |
|         |                                           |                   |
|         | Observations                              | Signatures        |
|         v                                           v                   |
|  +-------------------------------------------------------------------+  |
|  |                    B-Chain Consensus                               |  |
|  |  - Aggregates observations from validator watchers                 |  |
|  |  - Requests signatures from T-Chain                                |  |
|  |  - Executes bridge operations                                      |  |
|  +-------------------------------------------------------------------+  |
|                                                                         |
+-------------------------------------------------------------------------+
```

### How It Works Without Relayers

1. **Deposit Flow**:
   - User deposits on external chain
   - B-Chain validators run watchers that observe the deposit
   - Observations are submitted to B-Chain consensus
   - Once quorum is reached, B-Chain requests T-Chain signature
   - T-Chain threshold signers produce signature
   - Wrapped tokens are minted on C-Chain

2. **Withdrawal Flow**:
   - User burns wrapped tokens on C-Chain
   - B-Chain observes the burn via Warp message
   - B-Chain requests T-Chain signature for external chain release
   - T-Chain produces signature
   - B-Chain submits signed transaction to external chain

### Migration Guide

For implementations that were planning to use the Relayer Network:

| Relayer Concept | Replacement |
|----------------|-------------|
| Relayer registration | Validator registration on B-Chain |
| Relayer staking | Validator staking (unified) |
| Event observation | B-Chain watchers (integrated into validator) |
| Proof generation | B-Chain consensus (multi-validator observation) |
| Message delivery | Warp messages + B-Chain transactions |
| Fee settlement | Validator rewards from bridge fees |

### B-Chain Watcher Configuration

Validators configure watchers in their B-Chain node:

```json
{
  "bridgevm": {
    "watchers": {
      "ethereum": {
        "rpcEndpoints": [
          "https://eth-mainnet.g.alchemy.com/v2/...",
          "https://mainnet.infura.io/v3/..."
        ],
        "confirmations": 12,
        "contracts": {
          "vault": "0x..."
        }
      },
      "bitcoin": {
        "rpcEndpoints": ["https://btc.getblock.io/..."],
        "confirmations": 6
      }
    },
    "observationQuorum": 0.67
  }
}
```

### References

- [LP-0331: B-Chain BridgeVM Specification](./lp-0331-b-chain-bridgevm-specification.md) - Bridge operations and watchers
- [LP-0330: T-Chain ThresholdVM Specification](./lp-0330-t-chain-thresholdvm-specification.md) - Threshold signatures
- [LP-0332: Teleport Bridge Architecture](./lp-0332-teleport-bridge-architecture-unified-cross-chain-protocol.md) - Complete protocol
- [LP-0329: Teleport Bridge System Index](./lp-0329-teleport-bridge-system-index.md) - System overview

## Copyright

Copyright and related rights waived via [CC0](../LICENSE.md).
