# DataSeal - LP-0535 Verifiable Data Integrity Seal Protocol

Self-contained Solidity example demonstrating the Z-Chain Data Seal
precompile interface. Seals commit to data integrity using three modes:
**Public** (plaintext hash), **ZK** (zero-knowledge proof), and
**Private** (FHE-encrypted, verifiable without decryption).

## Precompile Addresses (Z-Chain)

| Address  | Name             | LP      |
|----------|------------------|---------|
| `0x0501` | Poseidon2        | LP-3658 |
| `0x0530` | Receipt Registry | LP-0530 |
| `0x0535` | Seal Register    | LP-0535 |
| `0x0536` | Seal Submit      | LP-0535 |
| `0x0537` | Seal Query       | LP-0535 |
| `0x0538` | Seal Batch       | LP-0535 |

## How It Works

1. **Single seal** -- `seal(dataHash, mode, proof)` computes a
   Poseidon2-based seal ID, submits it through the Seal precompile, and
   registers a receipt in the Receipt Registry (LP-0530).
2. **Batch seal** -- `batchSeal(dataHashes, mode)` builds a Poseidon2
   Merkle root over up to 256 data hashes in one call.
3. **Query** -- `verifySeal(sealId)` checks existence and returns the
   receipt hash for cross-chain export.

## Related Specifications

- [LP-0535: Data Integrity Seal Protocol](../../LPs/lp-0535-data-seal-protocol.md)
- [LP-0530: Z-Chain Receipt Registry](../../LPs/lp-0530-receipt-registry.md)
- [LP-3658: Poseidon2 Hash Precompile](../../LPs/lp-3658-poseidon2-precompile.md)

## Related Implementations

- `luxfhe/examples/data-seal` -- FHE client for Private-mode seals
- `luxfi/fhe/cmd/seal` -- CLI tool for seal creation and verification
- PIP-0010 -- FHE parameter set for data seals

## Build

Compile with `solc >= 0.8.24` or any Foundry / Hardhat toolchain:

```bash
solc --abi --bin DataSeal.sol -o out/
```

## License

MIT
