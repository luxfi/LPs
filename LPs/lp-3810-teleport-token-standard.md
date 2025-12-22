---
lp: 3810
title: Teleport Token Standard
description: Unified token bridging standard for native and remote tokens across Lux Network chains
author: Lux Network Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Standards Track
category: LRC
created: 2025-12-14
requires: 6016, 6017, 6022
tags: [teleport, bridge, tokens, cross-chain]
order: 2718
---

## Abstract

LP-2510 defines the Teleport Token Standard, a unified bridging framework for Lux Network that provides canonical token representations across chains. The standard distinguishes between native tokens (LUX, DLUX) originating on Lux and remote tokens (LETH, LBTC) bridged from external chains. It specifies the token contract architecture, bridge mechanics via MPC oracle signatures and Warp Messaging, and deterministic token factory deployment patterns.

## Motivation

Cross-chain token transfers require a standardized approach for:

1. **Token Classification**: Clear distinction between native and remote assets
2. **Canonical Addresses**: Deterministic deployment ensures consistent token addresses
3. **Bridge Security**: MPC threshold signatures prevent unauthorized minting
4. **Replay Protection**: Chain-specific message hashing prevents cross-chain replay
5. **Unified Interface**: Single bridgeable token base (ERC20B/LRC20) for all teleported assets

## Specification

### Token Classification

#### Native Tokens

Tokens originating on Lux Network:

| Token | Symbol | Description | Decimals |
|-------|--------|-------------|----------|
| LUX | LUX | Native gas/staking token | 18 |
| DLUX | DLUX | Delegated LUX (liquid staking) | 18 |

#### Remote Tokens

Tokens bridged from external chains:

| Token | Symbol | Origin | Decimals | Description |
|-------|--------|--------|----------|-------------|
| LETH | LETH | Ethereum | 18 | Lux-wrapped ETH |
| LBTC | LBTC | Bitcoin | 8 | Lux-wrapped BTC |

### Core Token Interface (ERC20B)

All teleportable tokens extend `ERC20B`, which provides bridge-controlled minting and burning:

```solidity
contract ERC20B is ERC20, Ownable, AccessControl {
    event LogMint(address indexed account, uint amount);
    event LogBurn(address indexed account, uint amount);
    event AdminGranted(address to);
    event AdminRevoked(address to);

    modifier onlyAdmin() {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Ownable");
        _;
    }

    function mint(address account, uint256 amount) public onlyAdmin returns (bool);
    function burnIt(address account, uint256 amount) public onlyAdmin returns (bool);
    function grantAdmin(address to) public onlyAdmin;
    function revokeAdmin(address to) public onlyAdmin;
}
```solidity

### LRC20 Base Standard

The `LRC20` contract provides the base ERC20 implementation with Lux-specific naming:

```solidity
contract LRC20 {
    function name() public view returns (string memory);
    function symbol() public view returns (string memory);
    function decimals() public pure returns (uint8);  // 18
    function totalSupply() public view returns (uint256);
    function balanceOf(address account) public view returns (uint256);
    function transfer(address to, uint256 amount) public returns (bool);
    function allowance(address owner, address spender) public view returns (uint256);
    function approve(address spender, uint256 amount) public returns (bool);
    function transferFrom(address from, address to, uint256 amount) public returns (bool);
}
```

### Token Implementations

#### LETH (Lux-wrapped ETH)

```solidity
contract LuxETH is ERC20B {
    string public constant _name = 'LuxETH';
    string public constant _symbol = 'LETH';

    constructor() ERC20B(_name, _symbol) {}
}
```

#### LBTC (Lux-wrapped BTC)

```solidity
contract LuxBTC is ERC20B {
    string public constant _name = 'LuxBTC';
    string public constant _symbol = 'LBTC';

    constructor() ERC20B(_name, _symbol) {}
}
```solidity

### Bridge Architecture

#### Teleport Bridge Contract

The `Bridge` contract handles cross-chain minting via MPC oracle signatures:

```solidity
contract Bridge is Ownable, AccessControl {
    uint256 public feeRate;  // Default: 1% (10 * 10^15)
    address internal payoutAddr;

    // MPC Oracle address mapping
    mapping(address => MPCOracleAddrInfo) internal MPCOracleAddrMap;

    // Transaction replay protection
    mapping(bytes => TransactionInfo) internal transactionMap;

    // Events
    event BridgeBurned(address caller, uint256 amt);
    event BridgeMinted(address recipient, address token, uint256 amt);
    event NewMPCOracleSet(address MPCOracle);

    // Burn tokens for bridge-out
    function bridgeBurn(uint256 amount, address tokenAddr) public;

    // Mint tokens with MPC signature verification
    function bridgeMintStealth(
        uint256 amt,
        string memory hashedId,
        address toTargetAddrStr,
        bytes memory signedTXInfo,
        address tokenAddrStr,
        string memory chainId,
        string memory vault
    ) public returns (address);

    // Admin functions
    function setMPCOracle(address MPCO) public onlyAdmin;
    function setPayoutAddress(address addr, uint256 feeR) public onlyAdmin;
}
```

#### Message Format

Bridge messages are constructed as:

```
message = concat(
    amount,                           // uint256 as string
    keccak256(targetAddress),         // bytes32 hex
    hashedTxId,                       // string
    keccak256(tokenAddress),          // bytes32 hex
    keccak256(chainId),               // bytes32 hex
    vault                             // string
)
```

Signature verification:

```solidity
bytes32 prefixedHash = keccak256(
    abi.encodePacked("\x19Ethereum Signed Message:\n32", keccak256(message))
);
address signer = ecrecover(prefixedHash, v, r, s);
require(MPCOracleAddrMap[signer].exists, 'BadSig');
```

#### Warp Messaging Integration

For chain-to-chain transfers, Teleport integrates with Lux Warp Messaging (LP-6022):

```solidity
struct TeleportMessage {
    uint8 version;
    bytes32 sourceChain;
    bytes32 destinationChain;
    uint64 nonce;
    address asset;
    uint256 amount;
    address sender;
    address recipient;
    bytes data;  // optional
}
```

### Supported Chain Routes

| Source Chain | Chain ID | Destination Chain | Chain ID | Bridge Type |
|--------------|----------|-------------------|----------|-------------|
| Lux C-Chain | 96369 | Ethereum | 1 | Teleport MPC |
| Lux C-Chain | 96369 | Hanzo EVM | 36963 | Warp Messaging |
| Lux C-Chain | 96369 | Zoo EVM | 200200 | Warp Messaging |
| Ethereum | 1 | Lux C-Chain | 96369 | Teleport MPC |
| Hanzo EVM | 36963 | Lux C-Chain | 96369 | Warp Messaging |
| Zoo EVM | 200200 | Lux C-Chain | 96369 | Warp Messaging |

### Token Factory Pattern

Deterministic deployment via CREATE2:

```solidity
contract TokenFactory {
    bytes32 public constant SALT = keccak256("LUX_TELEPORT_TOKEN_V1");

    function deployToken(
        string memory name,
        string memory symbol,
        uint8 decimals,
        address bridge
    ) external returns (address token) {
        bytes memory bytecode = abi.encodePacked(
            type(ERC20B).creationCode,
            abi.encode(name, symbol)
        );

        token = Create2.deploy(0, SALT, bytecode);
        ERC20B(token).grantAdmin(bridge);
    }

    function computeAddress(
        string memory name,
        string memory symbol
    ) external view returns (address) {
        bytes memory bytecode = abi.encodePacked(
            type(ERC20B).creationCode,
            abi.encode(name, symbol)
        );
        return Create2.computeAddress(SALT, keccak256(bytecode));
    }
}
```solidity

## Rationale

### MPC Oracle Design

The MPC threshold signature approach provides:

- **Decentralization**: No single point of failure
- **Security**: Threshold t-of-n prevents unauthorized minting
- **Flexibility**: Oracle set can be rotated without contract upgrade
- **Compatibility**: Standard ECDSA signatures work with existing infrastructure

### ERC20B vs ERC20

`ERC20B` extends standard ERC20 with:

- Admin-controlled minting for bridge operations
- Admin-controlled burning for bridge-out
- Role-based access control for multi-admin scenarios
- Event emission for bridge tracking

### Chain ID Hashing

Hashing chain IDs in messages:

- Prevents chain ID collision attacks
- Provides uniform 32-byte identifiers
- Enables efficient signature verification

### Fee Structure

Default 1% fee:

- Compensates bridge operators
- Discourages spam transactions
- Configurable per-bridge instance

## Backwards Compatibility

### ERC20 Compatibility

All tokens implement standard ERC20 interface:

- `transfer`, `transferFrom`, `approve`
- `balanceOf`, `allowance`, `totalSupply`
- `name`, `symbol`, `decimals`

### Existing Bridge Migration

Tokens deployed with the standard can:

- Accept mints from multiple authorized bridges
- Support gradual migration from legacy bridges
- Maintain consistent addresses via CREATE2

## Test Cases

### Bridge Mint Test

```solidity
function testBridgeMint() public {
    // Setup
    address alice = address(0x1);
    uint256 amount = 1 ether;

    // Generate MPC signature
    string memory message = buildMessage(amount, alice, txHash, tokenAddr, chainId, vault);
    bytes memory sig = signWithMPC(message);

    // Execute bridge mint
    bridge.bridgeMintStealth(
        amount,
        txHash,
        alice,
        sig,
        address(leth),
        "96369",
        vault
    );

    // Verify: 99% received (1% fee)
    assertEq(leth.balanceOf(alice), amount * 99 / 100);
}
```

### Bridge Burn Test

```solidity
function testBridgeBurn() public {
    // Setup: mint tokens first
    leth.mint(address(this), 1 ether);

    // Execute burn
    bridge.bridgeBurn(0.5 ether, address(leth));

    // Verify
    assertEq(leth.balanceOf(address(this)), 0.5 ether);
    assertEq(leth.totalSupply(), 0.5 ether);
}
```

### Replay Protection Test

```solidity
function testReplayProtection() public {
    // First mint succeeds
    bridge.bridgeMintStealth(amount, txHash, alice, sig, token, chainId, vault);

    // Replay reverts
    vm.expectRevert("DupeTX");
    bridge.bridgeMintStealth(amount, txHash, alice, sig, token, chainId, vault);
}
```

### Invalid Signature Test

```solidity
function testInvalidSignature() public {
    bytes memory badSig = hex"deadbeef";

    vm.expectRevert("BadSig");
    bridge.bridgeMintStealth(amount, txHash, alice, badSig, token, chainId, vault);
}
```solidity

## Reference Implementation

### Contract Locations

| Contract | Path | Description |
|----------|------|-------------|
| Bridge.sol | `standard/src/teleport/Bridge.sol` | Core bridge contract |
| ERC20B.sol | `standard/src/tokens/ERC20B.sol` | Bridgeable token base |
| LETH.sol | `standard/src/tokens/LETH.sol` | Lux-wrapped ETH |
| LBTC.sol | `standard/src/tokens/LBTC.sol` | Lux-wrapped BTC |
| LRC20.sol | `standard/src/tokens/LRC20.sol` | Base LRC20 implementation |

### Repository

**GitHub**: https://github.com/luxfi/standard

**Local Path**: `/Users/z/work/lux/standard/`

### Build and Test

```bash
cd ~/work/lux/standard

# Build
forge build

# Test
forge test --match-path test/teleport/*.t.sol -vvv

# Deploy Bridge
forge create src/teleport/Bridge.sol:Bridge \
  --rpc-url https://api.lux.network/ext/bc/C/rpc \
  --broadcast

# Deploy LETH
forge create src/tokens/LETH.sol:LuxETH \
  --rpc-url https://api.lux.network/ext/bc/C/rpc \
  --broadcast
```

### Deployed Addresses

| Contract | C-Chain (96369) | Hanzo (36963) | Zoo (200200) |
|----------|-----------------|---------------|--------------|
| Bridge | TBD | TBD | TBD |
| LETH | TBD | TBD | TBD |
| LBTC | TBD | TBD | TBD |
| LRC20Factory | TBD | TBD | TBD |

## Security Considerations

### MPC Threshold Security

- **Threshold Selection**: Minimum 2-of-3 for production, recommended 5-of-9
- **Key Rotation**: Regular rotation via `setMPCOracle()` reduces compromise risk
- **Geographic Distribution**: MPC nodes across multiple jurisdictions
- **Hardware Security**: HSM-backed key shares (see LP-7325)

### Replay Attack Prevention

Message uniqueness enforced via:

```solidity
mapping(bytes => TransactionInfo) internal transactionMap;

function addMappingStealth(bytes memory _key) internal {
    require(!transactionMap[_key].exists);
    transactionMap[_key].exists = true;
}
```

Each signature can only be used once globally.

### Chain ID Binding

Messages include hashed chain ID:

```solidity
varStruct.toChainIdHash = keccak256(abi.encodePacked(chainId));
```

Prevents cross-chain replay even with identical transaction parameters.

### Admin Key Security

- Multi-sig required for admin operations
- Time-locked admin changes recommended
- Emergency pause functionality via `pauseBridge()`

### Fee Manipulation

- Fee rate changes require admin role
- Maximum fee cap recommended (e.g., 5%)
- Fee changes should be time-locked

### Oracle Liveness

- Monitor oracle uptime
- Implement backup oracle sets
- Grace period for oracle rotation

## Economic Impact

### Bridge Fees

Default 1% fee structure:

| Amount | Fee | Net Received |
|--------|-----|--------------|
| 1 ETH | 0.01 ETH | 0.99 ETH |
| 10 BTC | 0.1 BTC | 9.9 BTC |
| 1000 LUX | 10 LUX | 990 LUX |

### Gas Costs

| Operation | Gas (estimated) |
|-----------|-----------------|
| bridgeBurn | ~65,000 |
| bridgeMintStealth | ~150,000 |
| setMPCOracle | ~45,000 |
| grantAdmin | ~50,000 |

### Liquidity Implications

- Bridge TVL affects token availability
- Cross-chain arbitrage opportunities
- Fee revenue for bridge operators

## Related LPs

| LP | Title | Relationship |
|----|-------|--------------|
| LP-6016 | Teleport Cross-Chain Protocol | Core protocol specification |
| LP-6017 | Bridge Asset Registry | Asset tracking and metadata |
| LP-6018 | Cross-Chain Message Format | Message encoding standard |
| LP-6019 | Bridge Security Framework | Security requirements |
| LP-6022 | Warp Messaging 2.0 | Native interchain transfers |
| LP-9072 | Bridged Asset Standard | General bridged asset interface |
| LP-3528 | LRC-20 Bridgable Token Extension | Bridgeable token extensions |

## Copyright

Copyright and related rights waived via [CC0](../LICENSE.md).
