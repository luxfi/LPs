// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// ReceiptRegistry - LP-0530 Z-Chain Receipt Registry
// Demonstrates the Receipt Registry precompile interface: program
// registration, proof submission, receipt queries, Merkle inclusion
// proofs, and cross-chain Groth16 export.
// All functions delegate to Z-Chain precompiles at 0x0530-0x053F.

// -- Z-Chain Precompile Addresses ------------------------------------------------
address constant POSEIDON2       = address(0x0501); // LP-3658
address constant RECEIPT_REGISTRY = address(0x0530); // LP-0530: main registry
address constant RECEIPT_ROOT    = address(0x0531); // LP-0530: Merkle root queries
address constant RECEIPT_PROOF   = address(0x0532); // LP-0530: inclusion proofs
address constant RECEIPT_EXPORT  = address(0x0533); // LP-0530: Groth16 export

// -- Domain Separation Tags (LP-3658) -------------------------------------------
bytes32 constant DST_MERKLE_NODE = bytes32(uint256(0x01));
bytes32 constant DST_MERKLE_LEAF = bytes32(uint256(0x02));
bytes32 constant DST_RECEIPT     = bytes32(uint256(0x05));

// Proof system identifiers (Production Lane IDs 1-99).
uint32 constant SYSTEM_STARK   = 1;
uint32 constant SYSTEM_GROTH16 = 2;
uint32 constant SYSTEM_PLONK   = 3;
uint32 constant SYSTEM_NOVA    = 4;

// Canonical receipt as defined in LP-0530.
struct Receipt {
    bytes32 programId;
    bytes32 claimHash;       // Poseidon2(publicInputs)
    bytes32 receiptHash;     // Unique receipt identifier
    uint32  proofSystemId;   // 1=STARK, 2=Groth16, 3=PLONK, 4=Nova
    uint32  version;
    uint64  verifiedAt;
    uint64  verifiedBlock;
    bytes32 parentReceipt;   // For proof chains (0x0 if root)
    bytes32 aggregationRoot; // For batched proofs (0x0 if single)
}

// Merkle inclusion proof for a receipt.
struct MerkleProof {
    bytes32   receiptHash;
    bytes32   root;
    bytes32[] siblings;      // Depth-32 tree = up to 32 siblings
    uint256   index;         // Leaf position in tree
}

contract ReceiptRegistry {

    // ----------------------------------------------------------------
    // Program registration
    // ----------------------------------------------------------------

    /// @notice Register a verification program.
    /// @param codeHash           Hash of the program/circuit code.
    /// @param supportedSystems   Proof system IDs the program accepts.
    /// @param vkCommitments      Verification key commitment per system.
    /// @return programId         Unique program identifier.
    function registerProgram(
        bytes32   codeHash,
        uint32[]  calldata supportedSystems,
        bytes32[] calldata vkCommitments
    ) external returns (bytes32 programId) {
        // Precompile: RECEIPT_REGISTRY.registerProgram
        (bool ok, bytes memory raw) = RECEIPT_REGISTRY.call(
            abi.encodeWithSignature(
                "registerProgram(bytes32,uint32[],bytes32[])",
                codeHash, supportedSystems, vkCommitments
            )
        );
        require(ok, "program registration failed");
        programId = abi.decode(raw, (bytes32));
    }

    // ----------------------------------------------------------------
    // Proof submission
    // ----------------------------------------------------------------

    /// @notice Submit a proof for on-chain verification and receipt generation.
    /// @param programId     Program to verify against.
    /// @param systemId      Proof system (STARK=1, Groth16=2, PLONK=3, Nova=4).
    /// @param proof         Raw proof bytes.
    /// @param publicInputs  Public inputs to the computation.
    /// @return receipt       Canonical receipt written to Merkle tree.
    function submitProof(
        bytes32   programId,
        uint32    systemId,
        bytes     calldata proof,
        bytes32[] calldata publicInputs
    ) external returns (Receipt memory receipt) {
        // Precompile: RECEIPT_REGISTRY.submitProof
        (bool ok, bytes memory raw) = RECEIPT_REGISTRY.call(
            abi.encodeWithSignature(
                "submitProof(bytes32,uint32,bytes,bytes32[])",
                programId, systemId, proof, publicInputs
            )
        );
        require(ok, "proof verification failed");
        receipt = abi.decode(raw, (Receipt));
    }

    // ----------------------------------------------------------------
    // Receipt queries
    // ----------------------------------------------------------------

    /// @notice Retrieve a receipt by its hash.
    function getReceipt(bytes32 receiptHash) external view returns (Receipt memory) {
        // Precompile: RECEIPT_REGISTRY.getReceipt (static)
        (bool ok, bytes memory raw) = RECEIPT_REGISTRY.staticcall(
            abi.encodeWithSignature("getReceipt(bytes32)", receiptHash)
        );
        require(ok, "receipt not found");
        return abi.decode(raw, (Receipt));
    }

    /// @notice Get the latest Poseidon2 Merkle root (depth 32, 4B leaves).
    function getLatestRoot() external view returns (bytes32 root) {
        // Precompile: RECEIPT_ROOT
        (bool ok, bytes memory raw) = RECEIPT_ROOT.staticcall("");
        require(ok, "root query failed");
        root = abi.decode(raw, (bytes32));
    }

    // ----------------------------------------------------------------
    // Merkle inclusion proof
    // ----------------------------------------------------------------

    /// @notice Generate a Merkle inclusion proof for a receipt.
    function getInclusionProof(bytes32 receiptHash) external view returns (MerkleProof memory) {
        // Precompile: RECEIPT_PROOF
        (bool ok, bytes memory raw) = RECEIPT_PROOF.staticcall(
            abi.encode(receiptHash)
        );
        require(ok, "inclusion proof failed");
        return abi.decode(raw, (MerkleProof));
    }

    // ----------------------------------------------------------------
    // Cross-chain Groth16 export
    // ----------------------------------------------------------------

    /// @notice Export a receipt with a Groth16 wrapper proof for external chains.
    /// @dev    The wrapper proves inclusion in the Poseidon2 Merkle tree using
    ///         a pairing-friendly proof that EVM L1s can verify cheaply.
    function exportForExternalChain(bytes32 receiptHash)
        external
        view
        returns (bytes memory groth16Proof, bytes32 root)
    {
        // Precompile: RECEIPT_EXPORT
        (bool ok, bytes memory raw) = RECEIPT_EXPORT.staticcall(
            abi.encode(receiptHash)
        );
        require(ok, "export failed");
        (groth16Proof, root) = abi.decode(raw, (bytes, bytes32));
    }
}
