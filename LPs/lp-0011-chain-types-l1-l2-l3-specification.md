---
lp: 11
title: Chain Types - L1/L2/L3 Specification
description: Defines L1 sovereign chains, L2 primary-validated chains, and L3 application chains
author: Lux Network (@luxfi)
status: Final
type: Standards Track
category: Core
created: 2025-12-27
---

# LP-0011: Chain Types - L1/L2/L3 Specification

## Abstract

This LP defines the three chain types supported by the Lux Network: L1 (sovereign chains with independent validator sets), L2 (chains validated by the primary network), and L3 (application-specific chains built on L2s). Each type offers different tradeoffs between sovereignty, security inheritance, and operational complexity.

## Motivation

Lux Network supports a flexible chain architecture where developers can choose the appropriate level of sovereignty and security for their use case:

- **Maximum sovereignty**: Run your own validator set (L1)
- **Shared security**: Inherit primary network security (L2)
- **Application-specific**: Build on existing L2 infrastructure (L3)

This specification provides the canonical definitions and CLI tooling for each chain type.

## Specification

### Chain Type Definitions

#### L1: Sovereign Chain

A fully independent blockchain with its own validator set.

```yaml
type: L1
name: "Sovereign Chain"
validators: independent
security: self-provided
consensus: configurable
examples:
  - Hanzo (AI compute chain)
  - Custom enterprise chains
```

**Characteristics:**
- Own validator set (minimum 5 validators recommended)
- Full control over consensus parameters
- Independent staking economics
- Custom VM support
- Cross-chain communication via Warp messaging

**CLI Creation:**
```bash
lux chain create mychain --type l1 --validators 5 --vm evm
lux chain deploy mychain --mainnet
```

**Genesis Configuration:**
```json
{
  "chainType": "L1",
  "validatorSet": {
    "type": "independent",
    "minValidators": 5,
    "stakingToken": "MYTOKEN"
  },
  "consensus": {
    "engine": "snowman",
    "parameters": {
      "k": 20,
      "alpha": 15,
      "betaVirtuous": 15,
      "betaRogue": 20
    }
  }
}
```

#### L2: Primary Network Validated Chain

A chain validated by the Lux primary network validators.

```yaml
type: L2
name: "Primary Network Chain"
validators: primary-network
security: inherited
consensus: shared
examples:
  - Zoo (conservation/AI chain)
  - Partner ecosystem chains
```

**Characteristics:**
- Validated by primary network (no separate validator set needed)
- Inherits primary network security
- Lower operational overhead
- Shared LUX staking economics
- Faster time-to-launch

**CLI Creation:**
```bash
lux chain create mychain --type l2 --vm evm
lux chain deploy mychain --mainnet
```

**Genesis Configuration:**
```json
{
  "chainType": "L2",
  "validatorSet": {
    "type": "primary-network",
    "inheritSecurity": true
  },
  "consensus": {
    "engine": "snowman",
    "parameters": "inherit"
  }
}
```

#### L3: Application Chain

An application-specific chain built on top of an L2.

```yaml
type: L3
name: "Application Chain"
validators: l2-inherited
security: l2-inherited
consensus: l2-inherited
examples:
  - Gaming chains on Zoo
  - DeFi chains on partner L2s
```

**Characteristics:**
- Built on existing L2 infrastructure
- Inherits L2 security and validation
- Application-specific customization
- Minimal operational overhead
- Fastest deployment path

**CLI Creation:**
```bash
lux chain create myapp --type l3 --parent zoo --vm evm
lux chain deploy myapp --mainnet
```

**Genesis Configuration:**
```json
{
  "chainType": "L3",
  "parentChain": "zoo",
  "validatorSet": {
    "type": "l2-inherited",
    "parentChainId": "200200"
  }
}
```

### Comparison Matrix

| Feature | L1 (Sovereign) | L2 (Primary Network) | L3 (Application) |
|---------|----------------|---------------------|------------------|
| **Validators** | Own set | Primary network | Parent L2 |
| **Security** | Self-provided | Inherited | Double-inherited |
| **Staking** | Custom token | LUX | Parent token |
| **Consensus** | Configurable | Shared | Inherited |
| **Launch Time** | Weeks | Days | Hours |
| **Operational Cost** | High | Medium | Low |
| **Sovereignty** | Maximum | Medium | Limited |
| **Use Case** | Enterprise, AI compute | Ecosystem partners | Applications |

### CLI Commands

#### Chain Creation

```bash
# Create L1 sovereign chain
lux chain create <name> --type l1 [--validators N] [--vm <vm>]

# Create L2 primary network chain
lux chain create <name> --type l2 [--vm <vm>]

# Create L3 application chain
lux chain create <name> --type l3 --parent <l2-name> [--vm <vm>]
```

#### Chain Deployment

```bash
# Deploy to mainnet
lux chain deploy <name> --mainnet

# Deploy to testnet
lux chain deploy <name> --testnet

# Deploy locally
lux chain deploy <name> --local
```

#### Chain Management

```bash
# List chains
lux chain list [--type l1|l2|l3]

# Get chain info
lux chain info <name>

# Upgrade chain
lux chain upgrade <name> --config <config.json>
```

### Cross-Chain Communication

All chain types support Warp messaging for cross-chain communication:

```go
// WarpMessage structure (same for all chain types)
type WarpMessage struct {
    SourceChainID      ids.ID
    DestinationChainID ids.ID
    Payload            []byte
    Signature          []byte // BLS aggregate signature
}
```

**L1 → L2 Communication:**
```bash
# Send message from L1 to L2
lux warp send --from hanzo --to zoo --payload "0x..."
```

**L2 → L3 Communication:**
```bash
# Send message from L2 to child L3
lux warp send --from zoo --to zoo-gaming --payload "0x..."
```

## Security Considerations

#### L1 Security
- Requires sufficient validator diversity
- Minimum 5 validators recommended
- Staking economics must incentivize honest behavior
- Slashing conditions must be defined

#### L2 Security
- Inherits primary network's 80%+ Byzantine fault tolerance
- No additional staking requirements
- Security scales with primary network

#### L3 Security
- Depends on parent L2 security
- Should verify parent L2 has sufficient security
- May add application-level security measures

## Rationale

The three-tier chain architecture provides flexibility for different use cases:

1. **L1 for sovereignty**: Projects requiring full control (AI compute, enterprise) can run independent validator sets
2. **L2 for ecosystem**: Partner projects can launch quickly with inherited security
3. **L3 for applications**: Rapid deployment of application-specific chains

## Backwards Compatibility

This LP introduces new chain type classifications. Existing chains are classified as:
- C-Chain, X-Chain, P-Chain: Primary network (special status)
- Existing custom chains: L1 by default (can opt into L2 model)

## Reference Implementation

- CLI: `github.com/luxfi/cli/cmd/chaincmd`
- Node: `github.com/luxfi/node/vms/platformvm/blocks`
- Genesis: `github.com/luxfi/genesis/pkg/genesis`

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
