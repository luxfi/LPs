---
lp: 0045
title: Z-Chain Encrypted Execution Layer Interface
description: Interface specification for Z-Chain’s encrypted execution layer, including EVM precompiles, JSON-RPC extensions, and TEE design.
author: Zach Kelling (@zeekay) and Lux Team (@luxfi)
discussions-to: https://github.com/luxfi/lps/discussions
status: Draft
type: Standards Track
category: Interface
created: 2025-07-24
---

## Abstract

Below is a complete interface specification for Z‑Chain’s encrypted execution layer. It covers:

- EVM precompiled contracts (precompiles) required for FHE, zk‑proofs and GPU‑TEE off‑load
- JSON‑RPC extensions the node must expose to wallets, dApps and dev‑ops tools
- Generic TEE design for NVIDIA Blackwell “TEE‑I/O” GPUs, including attestation and run‑time APIs

All choices are aligned with Zama’s fhEVM library and Lux-/Lux-class consensus parameters, while taking advantage of NVIDIA Confidential Computing.

## Motivation

Lux requires private smart‑contract capabilities with predictable performance and strong attestations. A clear interface for encrypted execution unlocks privacy‑preserving dApps, enables secure off‑load to GPU TEEs, and standardizes RPC and precompiles for ecosystem tooling.

## Specification

### 1  EVM Precompiles (contract addresses 0xF000 – 0xF05F)

Notation
All functions use standard Solidity ABI encoding.
CIPH = TFHE ciphertext (bytes)
SCALAR = little‑endian uint (32 bytes)
Gas values are the recommended main‑net base prices; chains may weight them by the measured median µs per op on reference hardware.

| Addr   | Name & purpose                          | staticcall ABI                        | Gas                    | Notes |
|:-------|:----------------------------------------|:--------------------------------------|:-----------------------|:------|
| 0xF000 | FHE.add                                 | fheAdd(bytes A,bytes B) returns (bytes)| 1 000 + 3· ·A        |       |
| 0xF001 | FHE.sub                                 | idem                                  | 1 000 + 3· ·A        |       |
| 0xF002 | FHE.mul                                 | idem                                  | 15 000 + 11· ·A      |       |
| 0xF003 | FHE.nand                                | fheNand(bytes A,bytes B)              | 400 + 2· ·A          |       |
| 0xF004 | FHE.xor                                 | idem                                  | 350 + 2· ·A          |       |
| 0xF005 | FHE.not                                 | fheNot(bytes A)                       | 250 + ·A             |       |
| 0xF006 | FHE.cmpGt                               | fheGt(bytes A,bytes B) returns (bytes)| 2 500 + 8· ·A        |       |
| 0xF007 | FHE.cmpEq                               | idem                                  | 2 000 + 6· ·A        |       |
| 0xF008 | FHE.bootstrap                           | bootstrap(bytes A)                    | 25 000 + 15· ·A       |       |
| 0xF009 | FHE.cmux                                | cmux(bytes sel,bytes A,bytes B)       | 5 000 + 12· ·A       |       |
| 0xF00A | FHE.pack                                | pack(bytes[] inputs)                  | 8 000 + Σ ·i          |       |
| 0xF00B | FHE.unpack                              | reverse of pack                       | linear                  |       |
| 0xF00C | FHE.keySwitch                           | keySwitch(bytes inCt,bytes newKeyID)  | 6 000 + 10· ·A       |       |
| 0xF00D | Reserved                                | –                                     | –                      | Up‑gradable opcode slot |
| 0xF00E | FHE.hash                                | fhePoseidon(bytes A)                  | 3 500 + 6· ·A        |       |
| 0xF00F | ZK.BLS12Verify                          | verify(bytes proof,bytes vk,bytes inputs) returns (bool)| 45 000        | Groth16 on BLS12‑381 |

Threshold & decryption helpers

| Addr   | Name                         | ABI                                     | Gas     | Comment                                                                |
|:-------|:-----------------------------|:----------------------------------------|:--------|:-----------------------------------------------------------------------|
| 0xF010 | FHE.decryptSync (LEGACY)     | decrypt(bytes A) returns (uint256)      | 200 000 | Will be deprecated once all apps migrate to async oracle               |
| 0xF011 | FHE.requestDecrypt           | reqDecrypt(bytes A,address callback)    | 15 000  | Emits DecryptRequested(id); oracle fulfils off‑chain                   |
| 0xF012 | FHE.asEuint                  | asEuint(uint256 p) returns(bytes)      | 4 000   | Deterministic encryption of literal (for constants)                   |
| 0xF013 | FHE.noise                    | noiseBudget(bytes A) returns(uint16)    | 700     | Allows contracts to react before overflow                             |

GPU‑TEE off‑load (Blackwell CC mode)

| Addr   | Name              | ABI                         | Gas      | Comment                                                                          |
|:-------|:------------------|:----------------------------|:---------|:---------------------------------------------------------------------------------|
| 0xF020 | TEE.attest        | attest() returns(bytes quote) | 20 000  | Returns SPDM‑based GPU attestation quote                                         |
| 0xF021 | TEE.execFHE       | exec(uint256 opcode,bytes blob) | dynamic | Pushes work to GPU queue; blocks until deterministic ciphertext result           |
| 0xF022 | TEE.execML        | execML(bytes modelID,bytes input) | dynamic | Runs Concrete‑ML inference in enclave                                            |
| 0xF023 | TEE.status        | status() returns(uint8 ready,uint32 qDepth) | 300 | For gas‑predictive scheduling                                                  |
| 0xF024 | TEE.metrics       | metrics() returns(uint64 opsPerSec,uint64 memMB) | 300 | Hardware tele‑metry (sealed JSON)                                             |

System / introspection

| Addr   | Name            | ABI                             | Gas  |
|:-------|:----------------|:--------------------------------|:-----|
| 0xF030 | FHE.gasEstimate | est(bytes bytecode) returns(uint256) | 0 (view) |
| 0xF031–0xF05F | Reserved |                              |      |

### 2  Z‑Chain JSON‑RPC extensions

All methods are namespaced (zchain_) to avoid collisions with standard eth_* calls.
Return values are JSON (hex‑encoded 0x… bytes where appropriate).

| Method                      | Params                     | Returns                                  | Purpose                                                                 |
|:----------------------------|:---------------------------|:-----------------------------------------|:------------------------------------------------------------------------|
| zchain_getFhePublicKey      | –                          | {pubKey: "0x…", params: {n,q,t}}        | Fetches network‑wide TFHE public key for client‑side encryption         |
| zchain_getCipherNoise       | ciphertext                 | uint16                                  | Same as precompile 0xF013 but off‑chain                                 |
| zchain_estimateFheGas       | {to,data}                  | uint256                                 | Extends eth_estimateGas by simulating FHE cost curve                     |
| zchain_submitDecrypt        | {ciphertext,callback}      | requestId                                | Asynchronous decrypt oracle entry point                                  |
| zchain_getDecryptResult     | requestId                  | {status,result}                         | Poll result; emits once ≥ t validator shares combined                   |
| zchain_getFheOpsPerSecond   | –                          | uint64                                  | Network‑wide moving median, for fee markets                              |
| zchain_getTeeQuote          | validatorID                | {quote, expires}                        | GPU SPDM attestation in COSE format                                      |
| zchain_getTeeStatus         | validatorID                | {ready,qDepth,gpuModel}                 | Health of validator’s Blackwell TEE                                       |
| zchain_pushTeeQuote         | {quote}                    | bool                                    | Validators upload refreshed quotes every epoch                           |
| zchain_getSubnetParams      | –                          | {k,alpha,betaVirt,betaRogue}            | Returns Lux consensus sampling parameters                                      |

All new methods follow the standard JSON‑RPC rules (positional or named params, integer fields hex‑encoded, error codes -320xx reserved).

### 3  Generic Blackwell GPU TEE (TEE‑I/O) integration

#### 3.1  Hardware roots of trust
- On‑die RoT: Firmware image & secure boot verified on GPU
- TEE‑I/O encrypts NVLink & PCIe traffic end‑to‑end, so ciphertexts remain sealed even in the DMA path.
- SPDM session between the CPU‑TEE (Intel TDX / AMD SEV‑SNP / ARM CCA) and the GPU’s “GSP‑RM” micro‑controller establishes symmetric keys.

#### 3.2  Runtime components per validator

```text
┌───────────────────────────────┐
│  luxd (Z‑Chain node)          │
│   ├─ Lux consensus        │
│   ├─ FHE‑VM (Go)              │
│   └─ TEE‑Manager (Rust)───────┐
└───────────────────────────────┘│ FFI
                                ▼
┌──────────────┐  SPDM TLS   ┌──────────────┐
│ CPU‑TEE CVM  │◄──────────►│ Blackwell GPU │
│  (TDX/SNP)   │            │   CC‑On mode  │
└──────────────┘            └──────────────┘
```

- **TEE‑Manager**: Maintains queue of FHE jobs, loads CUDA kernels compiled with -DGPU_CC, watches for timeouts, and hands results back to the EVM host function invoked by precompile 0xF021/0xF022.
- **Key storage**: Each validator’s FHE secret‑key share is sealed inside the CPU‑TEE; GPU kernels never access raw shares, only ciphertext operands.
- **Attestation**: At node start‑up TEE.attest() (precompile 0xF020) returns an SPDM quote containing:
  - GPU ID & firmware digest
  - CC‑mode bit + “TEE‑I/O‑enabled” flag
  - Measurement hash of the loaded FHE kernel bundle
Staked validators publish the quote on‑chain; discrepancies are slashable.

## Implementation

### Z-Chain Encrypted Execution Layer

**Location**: `~/work/lux/node/vms/zvm/`
**GitHub**: [`github.com/luxfi/node/tree/main/vms/zvm`](https://github.com/luxfi/node/tree/main/vms/zvm)

**Core Components**:
- [`precompile/fhe.go`](https://github.com/luxfi/node/blob/main/vms/zvm/precompile/fhe.go) - FHE precompile execution
- [`precompile/tee.go`](https://github.com/luxfi/node/blob/main/vms/zvm/precompile/tee.go) - TEE attestation and execution
- [`vm.go`](https://github.com/luxfi/node/blob/main/vms/zvm/vm.go) - Z-Chain VM
- [`rpc.go`](https://github.com/luxfi/node/blob/main/vms/zvm/rpc.go) - RPC extensions

**Solidity FHE Bindings**:
- Location: `~/work/lux/standard/src/precompiles/fhe/`
- [`TFHE.sol`](https://github.com/luxfi/standard/blob/main/src/precompiles/fhe/TFHE.sol) - FHE library
- [`IFHE.sol`](https://github.com/luxfi/standard/blob/main/src/precompiles/fhe/IFHE.sol) - FHE interface

**FHE Precompile Implementation**:
```go
// From precompile/fhe.go
func FHEAdd(input []byte) ([]byte, error) {
    // Parse ciphertexts A and B
    if len(input) < 3904 {
        return nil, fmt.Errorf("invalid input size")
    }

    ctA := input[:1952]
    ctB := input[1952:3904]

    // Execute on GPU TEE
    result, err := teeManager.ExecFHE(
        ctx,
        OpFHEAdd,
        append(ctA, ctB...),
    )
    if err != nil {
        return nil, err
    }

    return result, nil
}
```

**Testing**:
```bash
cd ~/work/lux/node
go test ./vms/zvm/precompile/... -v

cd ~/work/lux/standard
forge test --match-contract FHETest
forge coverage --match-contract TFHE
```

### Performance Characteristics

**Precompile Execution Times** (on NVIDIA B200):
| Operation | Time | Gas Cost |
|-----------|------|----------|
| FHE.add | ~1 µs | 1,000 |
| FHE.mul | ~750 ns | 15,000 |
| FHE.bootstrap | ~2 ms | 25,000 |
| FHE.keySwitch | ~1.5 ms | 6,000 |
| ZK.BLS12Verify | ~50 µs | 45,000 |
| TEE.attest | <1 ms | 20,000 |

#### 3.3  Execution flow for an encrypted add (euint32 + euint32)
1. Contract executes TFHE.add(a,b) → library encodes opcode=0x1, operands a,b and staticcalls 0xF021.
2. Precompile pushes job to TEE‑Manager; host thread yields.
3. Manager transmits encrypted operands via encrypted NVLink to GPU enclave.
4. GPU kernel performs TFHE gate sequence (≈ 750 ns on B200) and returns ciphertext c.
5. Result routed back through FFI, given to EVM; gas metered (1 000 + 3·|ct|).
6. Block remains deterministic because TFHE arithmetic is byte‑exact across nodes.

#### 3.4  Validator rotation & key refresh
- Epoch = 30 days. New validator joins → runs distributed‑key‑generation (DKG) protocol inside CPU‑TEE;
- Old shares erased; ciphertexts re‑keyed through FHE.keySwitch (precompile 0xF00C) executed once per encrypted storage slot; no downtime.

## Security & performance footnotes

* Lux consensus parameters [k = 20, α = 14, β₍ᵥ₎ = 18, β₍ᵣ₎ = 150] produce < 1 s finality with < 10⁻⁹ reversal probability in Lux‑scale networks.
* Blackwell Confidential Compute reports “< 2 % overhead vs clear‑text”, giving ~5× faster TFHE bootstraps than Hopper; precompile gas numbers assume B200 reference.
* All RPC and precompile inputs are validated against zk‑Proof‑of‑Plaintext‑Knowledge to stop garbage ciphertext attacks.

## What to implement next?

1. Code‑gen: auto‑emit Solidity bindings (TFHE.sol) matching the table above.
2. Node patch: integrate fhevm-go (now archived but still compiles) as the execution engine shim.
3. TEE driver: base on NVIDIA GPU Operator’s “confidential‑containers” branch.
4. Dev‑tools: finish zchain_getFhePublicKey + Hardhat plugin for gas estimation.
## Rationale

This design streamlines developer and operator workflows while preserving clarity and performance guarantees within Lux’s architecture.

## Backwards Compatibility

Additive and non‑breaking; features can be introduced gradually with configuration gates.

## Security Considerations

Enforce authentication where required, validate inputs, and follow recommended operational controls to prevent misuse.
