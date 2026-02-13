# SealFinality - LP-0536 Seal Finality via Quantum Event Horizon

Self-contained Solidity example demonstrating the `ISealFinality` precompile
interface. Seals progress through four finality tiers, from `Pending` to the
irreversible `HorizonFinal` state anchored by Quasar consensus checkpoints.

## Finality States

| State           | ID | Guarantee                                      |
|-----------------|----|-------------------------------------------------|
| Pending         | 0  | Seal submitted, awaiting verification            |
| ClassicalFinal  | 1  | Finalized by Snowman++ classical consensus       |
| QuantumFinal    | 2  | Confirmed by Quasar quantum-finality round       |
| HorizonFinal    | 3  | Irreversible -- anchored at Event Horizon        |

Each state subsumes all guarantees of the previous state. Applications
choose their minimum acceptable tier via `requiredFinality`.

## Precompile Address

| Address  | Name           | LP      |
|----------|----------------|---------|
| `0x0536` | Seal Finality  | LP-0536 |
| `0x0501` | Poseidon2      | LP-3658 |
| `0x0530` | Receipt Registry | LP-0530 |

## ISealFinality Interface

```solidity
function getFinalityState(bytes32 sealId) view returns (FinalityInfo);
function meetsFinality(bytes32 sealId, FinalityState required) view returns (bool);
function getHorizonRoot() view returns (bytes32 root, uint64 checkpoint);
function exportHorizonProof(bytes32 sealId) view returns (bytes proof, bytes32 root);
```

## How It Works

1. **Gate on finality** -- `acceptIfFinal(sealId)` queries the precompile
   and accepts the seal only if it meets the configured finality tier.
2. **Query horizon** -- `latestHorizon()` returns the most recent
   Quantum Event Horizon checkpoint root and block number.
3. **Cross-chain export** -- `exportForCrossChain(sealId)` generates a
   horizon proof that external chains can verify independently.

## Related Specifications

- [LP-0536: Seal Finality via Quantum Event Horizon](../../LPs/lp-0536-seal-finality.md)
- [LP-0530: Z-Chain Receipt Registry](../../LPs/lp-0530-receipt-registry.md)
- [LP-0535: Data Integrity Seal Protocol](../../LPs/lp-0535-data-seal-protocol.md)
- [LP-110: Quasar Consensus Protocol](../../LPs/lp-110.md)

## Build

```bash
solc --abi --bin SealFinality.sol -o out/
```

## License

MIT
