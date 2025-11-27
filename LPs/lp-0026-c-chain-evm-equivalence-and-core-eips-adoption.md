---
lp: 0026
title: 'C-Chain EVM Equivalence and Core EIPs Adoption'
description: Formalizes the policy of maintaining C-Chain EVM equivalence with Ethereum and Lux by adopting their major network upgrades and their constituent EIPs/ACPs.
author: Gemini (@gemini)
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Standards Track
category: Core
created: 2025-07-22
---

## Abstract

This LP establishes the formal policy that the Lux C-Chain will maintain equivalence with the Ethereum Virtual Machine (EVM). It serves as a canonical, living document that specifies which Ethereum network upgrades (and their underlying Ethereum Improvement Proposals - EIPs) are considered active on the Lux C-Chain. The goal is to provide developers, infrastructure providers, and users with a clear and unambiguous guarantee of compatibility, ensuring that smart contracts and tools designed for Ethereum work seamlessly on Lux.

## Motivation

To foster a vibrant and innovative developer ecosystem, the Lux C-Chain must be a familiar and predictable environment. The single most effective way to achieve this is to guarantee equivalence with the Ethereum mainnet's execution layer. This policy provides several key benefits:

*   **Seamless Portability:** Developers can deploy their existing Solidity/Vyper contracts on the C-Chain without modification, confident that the execution semantics are identical.
*   **Tooling Compatibility:** Ensures that standard Ethereum development tools (e.g., Foundry, Hardhat, Remix), wallets (e.g., MetaMask), and infrastructure services (e.g., block explorers, indexers) work out-of-the-box.
*   **Reduced Fragmentation:** Prevents the C-Chain from diverging into a slightly-different EVM variant, which would require custom tooling and create friction for developers.
*   **Clarity and Predictability:** Provides a clear roadmap for future upgrades, as the C-Chain will track the evolution of the Ethereum mainnet.

## Specification

**1. Policy of Equivalence:**

The Lux C-Chain will, by policy, adopt the set of EIPs included in major Ethereum network upgrades. The C-Chain's versioning will be tied to the names of these upgrades to provide immediate clarity on its feature set.

**2. Adopted Ethereum Network Upgrades:**

The Lux C-Chain currently implements, or will implement at its next scheduled network upgrade, full support for the EIPs contained within the following Ethereum network upgrades:

*   **Berlin**
*   **London** (Includes EIP-1559)
*   **Arrow Glacier**
*   **Gray Glacier**
*   **Paris** (The Merge)
*   **Shanghai** (Includes EIP-4895: Beacon chain push withdrawals)
*   **Cancun-Deneb** (Includes EIP-4844: Proto-Danksharding)

**3. Adopted Lux C-Chain Network Upgrades:**

The Lux C-Chain also incorporates all Lux C-Chain network upgrades (ACPs) from genesis through August 2025. For a full list and details of these ACPs, see the [Lux ACP repository](https://github.com/lux-foundation/ACPs).

**4. Future Upgrades:**

This LP will be updated to include future Ethereum network upgrades (e.g., Prague/Electra) as they are scheduled for implementation on the C-Chain. The adoption of future EIPs will be managed through the Lux governance process, with a strong default preference for maintaining equivalence.

## Rationale

Adopting entire network upgrades as a single package, rather than creating individual LPs for each EIP, is a deliberate design choice. It is more efficient and provides greater clarity. Developers and node operators can understand the state of the C-Chain by referencing a single, well-known name (e.g., "Shanghai-compatible") rather than a long list of LP numbers. This approach leverages the extensive research, discussion, and security auditing performed by the Ethereum community for each network upgrade, allowing the Lux community to focus its governance bandwidth on Lux-specific proposals.

## Backwards Compatibility

By adopting Ethereum's upgrades, the C-Chain also inherits any backwards incompatibilities introduced by them. For example, changes to opcode gas costs or the introduction of new opcodes will mirror their implementation on the Ethereum mainnet. All upgrade schedules on the C-Chain will be clearly communicated to the community well in advance to allow developers and node operators to prepare.

## Implementation

### C-Chain Repository Structure
**Repository**: `/Users/z/work/lux/geth/` (coreth fork)

### EVM Implementation
- **Base**: Ethereum go-ethereum (geth)
- **Lux Integration**: `/Users/z/work/lux/geth/core/`
  - EIP adoption and testing
  - Opcode implementations
  - Gas cost adjustments

- **Precompiles**: `/Users/z/work/lux/geth/core/vm/`
  - Standard Ethereum precompiles (0x01-0x08)
  - Lux-specific precompiles
  - Custom precompile framework

### Adopted EIP Tracking
- **Berlin (EIP-2930, EIP-2565, EIP-3198, EIP-3529, EIP-3541)**: Implemented
- **London (EIP-1559, EIP-3554, EIP-3541, EIP-3529)**: Implemented
- **Shanghai (EIP-3651, EIP-3855, EIP-3860, EIP-4895)**: Implemented
- **Cancun-Deneb (EIP-4844, EIP-4788, EIP-6780)**: Implemented

### Testing Framework
```bash
cd /Users/z/work/lux/geth
# Run C-Chain tests
go test ./core/vm -v
# Run EIP-specific tests
go test ./core/vm -run TestEIP1559
```

### Upgrade Activation
- **Hardfork Coordination**: Node consensus parameters
  - Located in `/Users/z/work/lux/geth/params/`
  - Block heights for each upgrade
  - Feature flag activation

- **Configuration**:
  - Network ID matching
  - Chain ID specification
  - Fork activation blocks

### Developer Compatibility
```bash
# Deploy to C-Chain
forge create MyContract.sol:MyContract --rpc-url http://localhost:9650/ext/bc/C

# Verify contract (Ethereum-compatible)
cast etherscan-verify <address>
```

### GitHub References
- **Coreth (C-Chain)**: https://github.com/luxfi/geth
- **Node Integration**: https://github.com/luxfi/node/tree/main/vms/evm
- **Standard Library**: https://github.com/luxfi/standard

### Compatibility Matrix
| Feature | EVM Status | C-Chain Support |
|---------|------------|-----------------|
| Solidity | Latest | ✅ Via hardhat/foundry |
| Vyper | Latest | ✅ Latest compiler |
| Web3.js | v4+ | ✅ Full support |
| ethers.js | v6+ | ✅ Full support |
| Foundry | Latest | ✅ Native support |
| Hardhat | v2.17+ | ✅ Full support |
| MetaMask | Latest | ✅ Custom RPC |

### Performance Characteristics
- **Block Time**: ~2 seconds (configurable via LP-226)
- **Gas Limit**: ~8M (EVM standard)
- **TPS**: ~450 (varies with transaction size)
- **Finality**: ~15 blocks (Chain consensus)

## Security Considerations

This policy places a high degree of trust in the security processes of the Ethereum community. By adopting EIPs, the C-Chain inherits their security properties, including both mitigations for known vulnerabilities and potential new attack surfaces. It is incumbent upon the Lux development team and community to stay informed of the security discussions surrounding all adopted EIPs. Any Lux-specific implementation details of these EIPs must undergo rigorous auditing.

## Copyright

Copyright and related rights waived via [CC0](https://creativecommons.org/publicdomain/zero/1.0/).
