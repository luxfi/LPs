// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// DataSeal - LP-0535 Verifiable Data Integrity Seal Protocol
// Demonstrates Z-Chain precompile calls for sealing data with
// Public, ZK, or Private (FHE) modes and batch Poseidon2 Merkle roots.
// Precompile addresses live on the Z-Chain only.

// -- Z-Chain Precompile Addresses ------------------------------------------------
address constant POSEIDON2        = address(0x0501); // LP-3658
address constant RECEIPT_REGISTRY = address(0x0530); // LP-0530
address constant SEAL_REGISTER    = address(0x0535); // LP-0535: register seal program
address constant SEAL_SUBMIT      = address(0x0536); // LP-0535: submit seal
address constant SEAL_QUERY       = address(0x0537); // LP-0535: query seal status
address constant SEAL_BATCH       = address(0x0538); // LP-0535: batch seal with Merkle

// Seal modes defined by LP-0535.
enum SealMode {
    Public,     // 0 - plaintext hash commitment
    ZK,         // 1 - ZK proof of data properties without revealing data
    Private     // 2 - FHE-encrypted seal; verifiable without decryption
}

// On-chain representation of a verified seal.
struct Seal {
    bytes32 sealId;          // Poseidon2(dataHash, mode, creator)
    bytes32 dataHash;        // Hash of the sealed payload
    SealMode mode;           // Public | ZK | Private
    address creator;         // Seal originator
    uint64  sealedAt;        // Block timestamp
    bytes32 receiptHash;     // Receipt Registry receipt (LP-0530)
}

// Batch Merkle root over multiple seals.
struct BatchRoot {
    bytes32 root;            // Poseidon2 Merkle root
    uint32  count;           // Number of seals in batch
    uint64  createdAt;
}

contract DataSeal {
    mapping(bytes32 => Seal)      public seals;
    mapping(bytes32 => BatchRoot) public batches;
    uint256 public sealCount;

    event SealCreated(bytes32 indexed sealId, SealMode mode, address indexed creator);
    event BatchCreated(bytes32 indexed batchRoot, uint32 count);

    // ----------------------------------------------------------------
    // Single seal
    // ----------------------------------------------------------------

    /// @notice Create a data integrity seal.
    /// @param dataHash  Poseidon2 hash of the payload.
    /// @param mode      Public, ZK, or Private (FHE).
    /// @param proof     ZK/FHE proof bytes (empty for Public mode).
    function seal(bytes32 dataHash, SealMode mode, bytes calldata proof)
        external
        returns (bytes32 sealId)
    {
        // Precompile: compute seal identifier via Poseidon2(dataHash, mode, sender)
        (bool ok, bytes memory raw) = POSEIDON2.staticcall(
            abi.encodePacked(uint8(0x04), dataHash, bytes32(uint256(mode)), bytes32(uint256(uint160(msg.sender))))
        );
        require(ok, "Poseidon2 failed");
        sealId = abi.decode(raw, (bytes32));

        // Precompile: submit seal to the Seal precompile for verification
        (bool submitted,) = SEAL_SUBMIT.call(
            abi.encode(sealId, dataHash, uint8(mode), proof)
        );
        require(submitted, "Seal submission failed");

        // Precompile: register receipt in Receipt Registry (LP-0530)
        (bool regOk, bytes memory receiptRaw) = RECEIPT_REGISTRY.call(
            abi.encode(sealId, dataHash)
        );
        require(regOk, "Receipt registration failed");
        bytes32 receiptHash = abi.decode(receiptRaw, (bytes32));

        seals[sealId] = Seal(sealId, dataHash, mode, msg.sender, uint64(block.timestamp), receiptHash);
        sealCount++;
        emit SealCreated(sealId, mode, msg.sender);
    }

    // ----------------------------------------------------------------
    // Batch seal with Poseidon2 Merkle batching
    // ----------------------------------------------------------------

    /// @notice Batch-seal multiple data hashes into a single Merkle root.
    /// @param dataHashes Array of Poseidon2 hashes to seal together.
    /// @param mode       Common seal mode for the batch.
    function batchSeal(bytes32[] calldata dataHashes, SealMode mode)
        external
        returns (bytes32 batchRoot)
    {
        require(dataHashes.length > 0 && dataHashes.length <= 256, "batch size 1..256");

        // Precompile: compute Poseidon2 Merkle root over all data hashes
        (bool ok, bytes memory raw) = SEAL_BATCH.staticcall(
            abi.encode(dataHashes, uint8(mode))
        );
        require(ok, "Batch Merkle failed");
        batchRoot = abi.decode(raw, (bytes32));

        batches[batchRoot] = BatchRoot(batchRoot, uint32(dataHashes.length), uint64(block.timestamp));
        emit BatchCreated(batchRoot, uint32(dataHashes.length));
    }

    // ----------------------------------------------------------------
    // Query
    // ----------------------------------------------------------------

    /// @notice Check whether a seal exists and return its receipt hash.
    function verifySeal(bytes32 sealId) external view returns (bool exists, bytes32 receiptHash) {
        Seal storage s = seals[sealId];
        exists = s.sealedAt != 0;
        receiptHash = s.receiptHash;
    }
}
