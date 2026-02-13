# EncryptedCRDT - LP-6500 fheCRDT Architecture

Self-contained Solidity example demonstrating on-chain primitives for the
fheCRDT architecture: privacy-preserving, offline-first app-chains that
combine blockchain consensus with local-first CRDT replication and FHE.

## Architecture Overview

```
Off-chain (local)          On-chain (Lux)          DA Layer
+-----------------+        +------------------+     +-----------+
| SQLite + CRDTs  |------->| DocReceipt       |<----| DAReceipt |
| (LWW, OR-Set)   |        | (LP-6501)        |     | (LP-6502) |
+-----------------+        +------------------+     +-----------+
```

Actual encrypted data lives off-chain. The chain stores lightweight
`DocReceipt` records for ordering and audit, referencing `DAReceipt`
certificates that prove data availability.

## CRDT Types (LP-6500)

| ID | Type         | Use Case                          |
|----|--------------|-----------------------------------|
| 0  | LWW-Register | Simple key-value with timestamps  |
| 1  | MV-Register  | Concurrent writes preserved       |
| 6  | OR-Set       | Tag-based add/remove membership   |
| 8  | RGA-List     | Ordered collaborative editing     |

## Contract Functions

| Function       | Purpose                                      |
|----------------|----------------------------------------------|
| `lwwUpdate`    | Record a LWW-Register update with Lamport ts |
| `orSetAdd`     | OR-Set add with unique element tag           |
| `orSetRemove`  | OR-Set remove referencing add tags           |
| `confirmDA`    | DA committee attestation (bridge/relayer)    |

## Precompile Addresses

| Address  | Name             | LP      |
|----------|------------------|---------|
| `0x0501` | Poseidon2        | LP-3658 |
| `0x0530` | Receipt Registry | LP-0530 |

## Related Specifications

- [LP-6500: fheCRDT Architecture](../../LPs/lp-6500-fhecrdt-architecture.md)
- [LP-6501: DocReceipts](../../LPs/lp-6501-fhecrdt-docreceipts.md)
- [LP-6502: DAReceipts](../../LPs/lp-6502-fhecrdt-dareceipts.md)

## Related Implementations

- `luxfhe/examples/encrypted-crdt` -- FHE client library for encrypted CRDTs
- `luxfi/fhe/cmd/crdt` -- CLI for CRDT document management
- PIP-0013 -- FHE parameter set for CRDT encryption

## Build

```bash
solc --abi --bin EncryptedCRDT.sol -o out/
```

## License

MIT
