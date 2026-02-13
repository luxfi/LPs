// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// EncryptedCRDT - LP-6500 fheCRDT Architecture
// Demonstrates on-chain primitives for privacy-preserving CRDTs:
// LWW-Register with FHE-encrypted values, OR-Set with tag semantics,
// DocReceipt anchoring (LP-6501), and DAReceipt certificates (LP-6502).
// Actual CRDT state lives off-chain (local SQLite + DA layer).
// This contract records receipts and roots for ordering and audit.

// -- Precompile Addresses --------------------------------------------------------
address constant POSEIDON2        = address(0x0501); // LP-3658
address constant RECEIPT_REGISTRY = address(0x0530); // LP-0530

// Supported CRDT types from LP-6500.
enum CRDTType {
    LWWRegister,   // 0 - Last-Writer-Wins register
    MVRegister,    // 1 - Multi-Value register
    GCounter,      // 2 - Grow-only counter
    PNCounter,     // 3 - Positive-negative counter
    GSet,          // 4 - Grow-only set
    TwoPSet,       // 5 - Two-phase set
    ORSet,         // 6 - Observed-Remove set
    LWWMap,        // 7 - Last-Writer-Wins map
    RGAList        // 8 - Replicated Growable Array
}

// DocReceipt (LP-6501): on-chain anchor for a document update.
struct DocReceipt {
    bytes32  documentId;       // Unique document identifier
    bytes32  contentHash;      // Poseidon2 hash of encrypted content
    uint64   documentVersion;  // Monotonic version counter
    CRDTType crdtType;         // CRDT used for this document
    bytes32  daReference;      // DAReceipt hash (LP-6502)
    bytes32  namespace;        // Application namespace hash
    address  author;           // Update author
    uint64   timestamp;
}

// DAReceipt (LP-6502): data availability certificate.
struct DAReceipt {
    bytes32 daHash;            // DA layer content hash
    bytes32 attestationRoot;   // Committee attestation Merkle root
    uint32  committee;         // Number of attesters
    uint64  confirmedAt;
    bool    available;         // True once committee threshold met
}

contract EncryptedCRDT {

    // -- State -------------------------------------------------------------------
    mapping(bytes32 => DocReceipt)  public docReceipts;   // documentId -> latest
    mapping(bytes32 => DAReceipt)   public daReceipts;    // daHash -> certificate
    mapping(bytes32 => uint64)      public docVersions;   // documentId -> version
    uint256 public totalDocs;
    uint256 public totalUpdates;

    event DocUpdated(bytes32 indexed documentId, uint64 version, bytes32 daReference);
    event DAConfirmed(bytes32 indexed daHash, uint32 committee);

    // ----------------------------------------------------------------
    // LWW-Register: submit encrypted value update
    // ----------------------------------------------------------------

    /// @notice Record a Last-Writer-Wins register update.
    /// @param documentId     Unique document ID.
    /// @param encryptedValue FHE-encrypted new value (stored off-chain via DA).
    /// @param lamportTs      Lamport timestamp for LWW ordering.
    /// @param daReference    DAReceipt hash proving data availability.
    function lwwUpdate(
        bytes32 documentId,
        bytes   calldata encryptedValue,
        uint64  lamportTs,
        bytes32 daReference
    ) external {
        require(daReceipts[daReference].available, "DA not confirmed");
        require(lamportTs > docVersions[documentId], "stale update");

        // Precompile: Poseidon2 hash of the encrypted content
        (bool ok, bytes memory raw) = POSEIDON2.staticcall(
            abi.encodePacked(uint8(0x01), encryptedValue)
        );
        require(ok, "Poseidon2 failed");
        bytes32 contentHash = abi.decode(raw, (bytes32));

        if (docVersions[documentId] == 0) totalDocs++;
        docVersions[documentId] = lamportTs;
        totalUpdates++;

        docReceipts[documentId] = DocReceipt(
            documentId, contentHash, lamportTs,
            CRDTType.LWWRegister, daReference,
            keccak256(abi.encodePacked(msg.sender)), // namespace placeholder
            msg.sender, uint64(block.timestamp)
        );
        emit DocUpdated(documentId, lamportTs, daReference);
    }

    // ----------------------------------------------------------------
    // OR-Set: tag-based add / remove
    // ----------------------------------------------------------------

    /// @notice Record an OR-Set add operation.
    /// @param documentId  Set document ID.
    /// @param elementTag  Unique tag for the add operation.
    /// @param daReference DAReceipt hash for the encrypted element.
    function orSetAdd(
        bytes32 documentId,
        bytes32 elementTag,
        bytes32 daReference
    ) external {
        require(daReceipts[daReference].available, "DA not confirmed");

        uint64 version = docVersions[documentId] + 1;
        docVersions[documentId] = version;
        totalUpdates++;

        // Precompile: content hash = Poseidon2(documentId, elementTag, "add")
        (bool ok, bytes memory raw) = POSEIDON2.staticcall(
            abi.encodePacked(uint8(0x04), documentId, elementTag, bytes32("add"))
        );
        require(ok, "Poseidon2 failed");
        bytes32 contentHash = abi.decode(raw, (bytes32));

        docReceipts[documentId] = DocReceipt(
            documentId, contentHash, version,
            CRDTType.ORSet, daReference,
            keccak256(abi.encodePacked(msg.sender)),
            msg.sender, uint64(block.timestamp)
        );
        emit DocUpdated(documentId, version, daReference);
    }

    /// @notice Record an OR-Set remove operation.
    function orSetRemove(
        bytes32 documentId,
        bytes32 elementTag,
        bytes32 daReference
    ) external {
        require(daReceipts[daReference].available, "DA not confirmed");

        uint64 version = docVersions[documentId] + 1;
        docVersions[documentId] = version;
        totalUpdates++;

        (bool ok, bytes memory raw) = POSEIDON2.staticcall(
            abi.encodePacked(uint8(0x04), documentId, elementTag, bytes32("remove"))
        );
        require(ok, "Poseidon2 failed");
        bytes32 contentHash = abi.decode(raw, (bytes32));

        docReceipts[documentId] = DocReceipt(
            documentId, contentHash, version,
            CRDTType.ORSet, daReference,
            keccak256(abi.encodePacked(msg.sender)),
            msg.sender, uint64(block.timestamp)
        );
        emit DocUpdated(documentId, version, daReference);
    }

    // ----------------------------------------------------------------
    // DA Receipt confirmation (LP-6502)
    // ----------------------------------------------------------------

    /// @notice Confirm data availability from the DA committee.
    /// @dev    In production this is called by the DA bridge / relayer.
    function confirmDA(
        bytes32 daHash,
        bytes32 attestationRoot,
        uint32  committee
    ) external {
        require(committee >= 3, "insufficient committee");
        daReceipts[daHash] = DAReceipt(daHash, attestationRoot, committee, uint64(block.timestamp), true);
        emit DAConfirmed(daHash, committee);
    }
}
