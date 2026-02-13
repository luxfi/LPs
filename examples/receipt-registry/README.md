# ReceiptRegistry - LP-0530 Z-Chain Receipt Registry

Self-contained Solidity example demonstrating the Z-Chain Receipt Registry
precompile interface. Receipts are the universal interoperability object in
the Lux ZK stack -- every verified proof produces a receipt stored in a
Poseidon2 Merkle accumulator (depth 32, up to 4 billion leaves).

## Precompile Addresses (Z-Chain)

| Address  | Name             | Description                        |
|----------|------------------|------------------------------------|
| `0x0501` | Poseidon2        | ZK-friendly hash (LP-3658)         |
| `0x0530` | Receipt Registry | Main registry interface (LP-0530)  |
| `0x0531` | Receipt Root     | Current / historical Merkle roots  |
| `0x0532` | Receipt Proof    | Merkle inclusion proof generation  |
| `0x0533` | Receipt Export   | Groth16 wrapper for external chains|

## Proof System IDs (Production Lane)

| ID | System  | PQ-Safe | Setup      |
|----|---------|---------|------------|
| 1  | STARK   | Yes     | None       |
| 2  | Groth16 | No      | Trusted    |
| 3  | PLONK   | No      | Universal  |
| 4  | Nova    | No      | None       |

## How It Works

1. **Register a program** -- `registerProgram(codeHash, systems, vks)`
   creates a program entry with supported proof systems and VK commitments.
2. **Submit a proof** -- `submitProof(programId, systemId, proof, inputs)`
   verifies the proof on-chain and returns a canonical `Receipt`.
3. **Query receipts** -- `getReceipt(hash)` and `getLatestRoot()` read
   from the Poseidon2 Merkle accumulator.
4. **Inclusion proofs** -- `getInclusionProof(hash)` returns a depth-32
   Merkle path for independent verification.
5. **Cross-chain export** -- `exportForExternalChain(hash)` wraps the
   inclusion proof in a Groth16 proof verifiable on any EVM chain.

## Receipt Hash Construction

```
receiptHash = Poseidon2(DST_RECEIPT, programId, claimHash,
                        proofSystemId, version, verifiedAt)
```

Domain separation tags from LP-3658:
- `0x01` MERKLE_NODE, `0x02` MERKLE_LEAF, `0x05` RECEIPT

## Related Specifications

- [LP-0530: Z-Chain Receipt Registry](../../LPs/lp-0530-receipt-registry.md)
- [LP-3658: Poseidon2 Hash Precompile](../../LPs/lp-3658-poseidon2-precompile.md)
- [LP-0510: STARK Verification Precompiles](../../LPs/lp-0510-stark-verifier-precompile.md)
- [LP-0536: Seal Finality via Quantum Event Horizon](../../LPs/lp-0536-seal-finality.md)

## Build

```bash
solc --abi --bin ReceiptRegistry.sol -o out/
```

## License

MIT
