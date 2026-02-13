# ContentProvenance - LP-7110 AI & Media Content Provenance Standard

Self-contained Solidity example for tracking AI model identity, output
attestation, and media derivation chains on the Lux A-Chain / Z-Chain.

## Capabilities

| Feature                | Description                                         |
|------------------------|-----------------------------------------------------|
| Model Manifest         | Immutable on-chain record of weights, arch, data    |
| Output Attestation     | FHE-encrypted proof linking content to a model      |
| Derivation DAG         | Parent-child graph of media transformations          |
| EU AI Act Compliance   | Risk tier classification and disclosure checks       |

## Precompile Addresses

| Address  | Name             | LP      |
|----------|------------------|---------|
| `0x0501` | Poseidon2        | LP-3658 |
| `0x0530` | Receipt Registry | LP-0530 |
| `0x0536` | Seal Submit      | LP-0535 |

## How It Works

1. **Register a model** -- `registerManifest()` hashes three identity
   components (weights, architecture, training data) with Poseidon2 to
   produce a unique `manifestId`.
2. **Attest an output** -- `attestOutput()` links content to a model
   using an FHE-encrypted proof sealed through LP-0535 Private mode.
   The model identity is never revealed on-chain.
3. **Record derivations** -- `recordDerivation()` builds a DAG of
   content transformations for full provenance lineage.
4. **Classify risk** -- `setRiskTier()` and `meetsDisclosure()` provide
   EU AI Act Article 6 compliance hooks.

## Related Specifications

- [LP-7110: AI & Media Content Provenance Standard](../../LPs/lp-7110-content-provenance.md)
- [LP-0535: Data Integrity Seal Protocol](../../LPs/lp-0535-data-seal-protocol.md)
- [LP-3658: Poseidon2 Hash Precompile](../../LPs/lp-3658-poseidon2-precompile.md)

## Related Implementations

- `luxfhe/examples/content-provenance` -- FHE client for encrypted attestations
- `luxfi/fhe/cmd/provenance` -- CLI for model manifest management
- `luxfi/fhe/cmd/mediaseal` -- CLI for media derivation sealing
- PIP-0011 -- FHE parameter set for content provenance

## Build

```bash
solc --abi --bin ContentProvenance.sol -o out/
```

## License

MIT
