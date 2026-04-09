---
lp: 017
title: Native Bridge Programs for Teleport
tags: [bridge, teleport, solana, ton, sui, aptos, cosmos, xrpl, tron, polkadot, near, stellar, stacks, cardano, starknet, icp, algorand, fuel, tezos, opnet]
description: 18 native on-chain programs implementing the Teleport bridge protocol on non-EVM chains
author: Lux Industries
status: Final
type: Standards Track
category: Bridge
created: 2023-06-01
requires:
  - lps-016 (OmnichainRouter)
  - lps-019 (Threshold MPC)
references:
  - lp-6332 (Teleport Bridge Architecture)
  - lp-3001 (Teleport Bridge MPC)
  - lp-3810 (Teleport Token Standard)
---

# LP-017: Native Bridge Programs for Teleport

## Abstract

Defines 18 native on-chain programs that implement the Teleport bridge protocol on non-EVM chains. Each program is written in the chain's native language and uses the chain's native signature verification to validate MPC threshold signatures. FROST (EdDSA/Schnorr) is used for Ed25519-native chains. CGGMP21 (ECDSA) is used for secp256k1-native chains. All programs implement the same lock/mint/burn/release pattern defined in LP-003 and LP-016.

## Motivation

Teleport bridges EVM chains via the OmnichainRouter (LP-016). Non-EVM chains require native programs because:

1. EVM contracts cannot be deployed on non-EVM chains
2. Each chain has unique transaction formats, account models, and signature schemes
3. Native programs can use built-in signature verification (cheaper, audited by the chain itself)
4. Wrapping non-EVM chains through an intermediary EVM adds latency and trust assumptions

By deploying native programs on each chain, Teleport provides direct bridging without intermediaries.

## Specification

### 1. Program Registry

| # | Chain | Language | Signature | Account Model | Program ID Format |
|---|-------|----------|-----------|---------------|-------------------|
| 1 | Solana | Anchor/Rust | Ed25519 (FROST) | Account-based (Solana accounts) | Base58 program address |
| 2 | TON | FunC | Ed25519 (FROST) | Actor-based (contracts are actors) | Raw address (workchain:hash) |
| 3 | Sui | Move | Ed25519 (FROST) | Object-based | Object ID (hex) |
| 4 | Aptos | Move | Ed25519 (FROST) | Account-based (resources) | Module address (hex) |
| 5 | Cosmos | CosmWasm/Rust | secp256k1 (CGGMP21) | Account-based (Cosmos SDK) | Bech32 contract address |
| 6 | XRPL | Hooks/C | secp256k1 (CGGMP21) | Account-based (XRPL ledger) | rAddress (Hook account) |
| 7 | TRON | Solidity/TVM | secp256k1 (CGGMP21) | Account-based (EVM-like) | Base58Check address |
| 8 | Polkadot | ink!/Rust | Ed25519 (FROST) | Account-based (Substrate) | SS58 contract address |
| 9 | NEAR | Rust/WASM | Ed25519 (FROST) | Account-based (named accounts) | Named account (e.g. teleport.near) |
| 10 | Stellar | Soroban/Rust | Ed25519 (FROST) | Account-based (Stellar accounts) | Contract ID (hex) |
| 11 | Stacks | Clarity | secp256k1 (CGGMP21) | Account-based (Stacks) | Principal (SP address) |
| 12 | Cardano | Aiken | Ed25519 (FROST) | UTXO-based | Script hash (hex) |
| 13 | StarkNet | Cairo | STARK-friendly (FROST adapted) | Account-based (StarkNet) | Felt contract address |
| 14 | ICP | Rust Canister | Ed25519 (FROST) | Canister-based (actor model) | Canister ID (principal) |
| 15 | Algorand | PyTeal | Ed25519 (FROST) | Account-based (Algorand) | Application ID (uint64) |
| 16 | Fuel | Sway | secp256k1 (CGGMP21) | UTXO-based | Contract ID (hex) |
| 17 | Tezos | CameLIGO | Ed25519 (FROST) | Account-based (Tezos) | KT1 address |
| 18 | OP_NET | AssemblyScript | secp256k1 (CGGMP21) | UTXO-based (Bitcoin) | Contract address (hex) |

### 2. Common Interface

Every program, regardless of chain, implements these operations:

```
lock(amount, dest_chain_id, dest_address) -> nonce
burn(amount, dest_chain_id) -> nonce
bridge_mint(recipient, amount, source_chain_id, nonce, signature) -> success
bridge_release(recipient, amount, source_chain_id, nonce, signature) -> success
set_signer_key(new_key, effective_timestamp, authorization_signature) -> success
```

The interface maps to each chain's native calling convention:

- **Solana**: Anchor instruction discriminators
- **TON**: Internal message op-codes
- **Sui**: Entry functions on a shared object
- **Cosmos**: CosmWasm execute messages (JSON)
- **Cardano**: UTXO datum + redeemer
- **XRPL**: Hook invoke with HookParameters
- **ICP**: Canister update calls (Candid)

### 3. Signature Verification

#### Ed25519 Chains (FROST)

Chains with native Ed25519 support use FROST aggregate signatures directly. The MPC group produces a single Ed25519 signature that the chain verifies using its built-in Ed25519 verification.

```
FROST group (t-of-n signers)
  -> 2-round signing protocol
  -> produces single Ed25519 signature (R, s)
  -> chain verifies: Ed25519.verify(aggregate_pubkey, message, signature)
```

Chains: Solana, TON, Sui, Aptos, Polkadot, NEAR, Stellar, Cardano, StarkNet (adapted), ICP, Algorand, Tezos.

#### secp256k1 Chains (CGGMP21)

Chains with native secp256k1/ECDSA support use CGGMP21 aggregate signatures. The MPC group produces a single ECDSA signature.

```
CGGMP21 group (t-of-n signers)
  -> pre-signing + signing rounds
  -> produces single ECDSA signature (r, s, v)
  -> chain verifies: ecrecover(message_hash, v, r, s) == aggregate_address
```

Chains: Cosmos, XRPL, TRON, Stacks, Fuel, OP_NET.

### 4. Per-Chain Implementation Details

#### 4.1 Solana (Anchor/Rust)

```rust
#[program]
pub mod teleport_bridge {
    pub fn lock(ctx: Context<Lock>, amount: u64, dest_chain_id: u64, dest_address: [u8; 32]) -> Result<()>;
    pub fn burn(ctx: Context<Burn>, amount: u64, dest_chain_id: u64) -> Result<()>;
    pub fn bridge_mint(ctx: Context<BridgeMint>, recipient: Pubkey, amount: u64,
                       source_chain_id: u64, nonce: [u8; 32], sig: [u8; 64]) -> Result<()>;
    pub fn bridge_release(ctx: Context<BridgeRelease>, recipient: Pubkey, amount: u64,
                          source_chain_id: u64, nonce: [u8; 32], sig: [u8; 64]) -> Result<()>;
}
```

Signature verification uses the Solana Ed25519 program (`Ed25519SigVerify111111111111111111111111111`) via CPI. The aggregate FROST public key is stored in a PDA (program-derived address).

Nonce tracking uses a PDA per nonce: `seeds = [b"nonce", nonce.as_ref()]`. If the PDA account exists, the nonce has been processed.

#### 4.2 TON (FunC)

```func
() recv_internal(int msg_value, cell in_msg_full, slice in_msg_body) impure {
    int op = in_msg_body~load_uint(32);
    if (op == op::lock) { ... }
    if (op == op::burn) { ... }
    if (op == op::bridge_mint) { ... }
    if (op == op::bridge_release) { ... }
}
```

Signature verification: TON natively supports Ed25519 via the `check_signature(hash, signature, public_key)` built-in. The aggregate FROST key is stored in contract storage cell.

Nonce tracking: dictionary (hashmap) in contract storage. Key = nonce hash, value = 1.

#### 4.3 Sui (Move)

```move
module teleport::bridge {
    public entry fun lock(bridge: &mut Bridge, coin: Coin<T>, dest_chain_id: u64, dest_address: vector<u8>, ctx: &mut TxContext);
    public entry fun burn(bridge: &mut Bridge, coin: Coin<T>, dest_chain_id: u64, ctx: &mut TxContext);
    public entry fun bridge_mint(bridge: &mut Bridge, recipient: address, amount: u64,
                                  source_chain_id: u64, nonce: vector<u8>, sig: vector<u8>, ctx: &mut TxContext);
}
```

Sui supports Ed25519 signature verification via `sui::ed25519::ed25519_verify`. The bridge is a shared object with dynamic fields for nonce tracking.

#### 4.4 Cardano (Aiken)

Cardano uses UTXO datum/redeemer:

```aiken
type Redeemer {
    Lock { amount: Int, dest_chain_id: Int, dest_address: ByteArray }
    Burn { amount: Int, dest_chain_id: Int }
    BridgeMint { recipient: Address, amount: Int, source_chain_id: Int, nonce: ByteArray, sig: ByteArray }
    BridgeRelease { recipient: Address, amount: Int, source_chain_id: Int, nonce: ByteArray, sig: ByteArray }
}

type Datum {
    signer_key: ByteArray,
    total_locked: Int,
    nonces: List<ByteArray>,
}
```

Ed25519 verification uses Cardano's `verifyEd25519Signature` built-in (Plutus V2+). The bridge validator script enforces that mints match the MPC signature and nonce is not in the datum's nonce list.

#### 4.5 XRPL (Hooks/C)

```c
int64_t hook(uint32_t reserved) {
    uint8_t op[4];
    hook_param(SBUF(op), "op", 2);

    if (UINT32_FROM_BUF(op) == OP_LOCK) { /* ... */ }
    if (UINT32_FROM_BUF(op) == OP_BRIDGE_MINT) {
        // Verify secp256k1 signature via util_verify
        uint8_t sig[72], pubkey[33], hash[32];
        // ... load from hook params ...
        int64_t result = util_verify(SBUF(hash), SBUF(sig), SBUF(pubkey));
        if (result != 1) rollback(SBUF("bad sig"), 1);
        // ... emit payment ...
    }
}
```

XRPL Hooks use `util_verify` for secp256k1 ECDSA verification. Nonce tracking via Hook State (key-value store on the ledger entry).

#### 4.6 Cosmos (CosmWasm/Rust)

```rust
#[cw_serde]
pub enum ExecuteMsg {
    Lock { amount: Uint128, dest_chain_id: u64, dest_address: String },
    Burn { amount: Uint128, dest_chain_id: u64 },
    BridgeMint { recipient: String, amount: Uint128, source_chain_id: u64, nonce: Binary, sig: Binary },
    BridgeRelease { recipient: String, amount: Uint128, source_chain_id: u64, nonce: Binary, sig: Binary },
}
```

CosmWasm provides `deps.api.secp256k1_verify(message_hash, signature, public_key)` for ECDSA verification. Nonce tracking via `Map<Vec<u8>, bool>` in contract storage.

#### 4.7 ICP (Rust Canister)

```rust
#[update]
async fn bridge_mint(recipient: Principal, amount: u64, source_chain_id: u64,
                     nonce: Vec<u8>, sig: Vec<u8>) -> Result<(), String> {
    // Verify Ed25519 signature using ic_cdk::api::crypto::verify
    // ...
}
```

ICP canisters use the management canister's `ecdsa_public_key` and `sign_with_ecdsa` for threshold ECDSA, but for verification of incoming FROST signatures, the canister verifies Ed25519 using a Rust crate compiled to WASM (ed25519-dalek).

#### 4.8 Remaining Chains

The remaining 10 chains (NEAR, Stellar, Stacks, StarkNet, Algorand, Fuel, Tezos, OP_NET, Polkadot, TRON) follow the same pattern:

- Native language implementation
- Built-in or library signature verification matching the chain's native curve
- Nonce tracking in contract/program storage
- Lock/mint/burn/release matching the common interface

Full implementations are in `github.com/luxfi/teleport/programs/`.

### 5. Message Format

All chains use the same canonical message format for signature verification:

```
message = keccak256(abi.encode(
    "TELEPORT_V1",
    source_chain_id,
    dest_chain_id,
    operation_type,    // 0x01=lock, 0x02=burn, 0x03=mint, 0x04=release
    token_address,     // 32 bytes, left-padded for shorter addresses
    recipient,         // 32 bytes, left-padded
    amount,            // uint256
    nonce              // 32 bytes
))
```

For Ed25519 chains, the message is hashed with SHA-512 as required by the EdDSA specification. For secp256k1 chains, keccak256 is used directly.

### 6. Relayer Architecture

Each non-EVM chain has a dedicated relayer service:

```
Lux C-Chain (or any EVM)          Relayer Service              Target Chain
-------------------------         ----------------             ------------
Lock event emitted        --->    Watches events       --->    Calls bridge_mint
                                  Verifies finality            with MPC signature
                                  Requests MPC signing
                                  Formats native tx
```

Relayers are stateless Go services (one per target chain) that:
1. Watch for Warp/event messages on source chains
2. Verify finality on the source chain
3. Request a threshold signature from the MPC group (LP-019)
4. Format the transaction in the target chain's native format
5. Submit to the target chain

Relayers hold no keys. They are message routers. The MPC group holds the signing authority.

## Security Considerations

1. **Native verification**: Each program uses the chain's own signature verification. This means the verification code is part of the chain's consensus-critical path and has been audited by the chain's own security processes. No custom cryptography is deployed on-chain.

2. **Nonce replay**: Every program tracks processed nonces in persistent storage. The nonce includes source chain ID, preventing cross-chain replay. The nonce includes amount and recipient, preventing parameter substitution.

3. **Account model differences**: UTXO chains (Cardano, Fuel, OP_NET) require the bridge to manage UTXOs rather than account balances. The lock operation consumes input UTXOs and produces a bridge-controlled UTXO. The bridge_release operation produces a new UTXO for the recipient.

4. **Finality assumptions**: Each relayer waits for source chain finality before requesting MPC signing. Finality thresholds per chain: Solana (32 slots), TON (1 masterchain block), Sui (checkpoint), Cardano (2160 blocks for deep finality, 30 blocks for probabilistic), etc.

5. **Program upgradeability**: Programs on Solana (upgradeable by default) and CosmWasm (migrate entrypoint) support upgrades. Programs on Sui (immutable by default), Cardano (script hash), and StarkNet (proxy pattern) have different upgrade models. All programs use the chain's standard upgrade mechanism with the governor as the upgrade authority.

6. **Ed25519 vs secp256k1 choice**: The choice is dictated by the chain's native support. Using the native curve avoids deploying custom precompiles or libraries, reducing attack surface.

## Reference

| Resource | Location |
|---|---|
| Teleport programs | `github.com/luxfi/teleport/programs/` |
| LP-016 OmnichainRouter | `LP-016-omnichain-router.md` |
| LP-019 Threshold MPC | `LP-019-threshold-mpc.md` |
| Teleport Token Standard | `lp-3810-teleport-token-standard.md` |
| Teleport Bridge Architecture | `lp-6332-teleport-bridge-architecture-unified-cross-chain-protocol.md` |

## Copyright

Copyright (C) 2024-2026, Lux Partners Limited. All rights reserved.

Licensed under the MIT License.
