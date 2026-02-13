// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// SealFinality - LP-0536 Seal Finality via Quantum Event Horizon
// Demonstrates the ISealFinality precompile interface for checking
// and upgrading seal finality states. Integrates with Quasar consensus
// (LP-110) to provide four finality tiers culminating in HorizonFinal.
// The precompile at 0x0536 is the authority for finality status.

// -- Z-Chain Precompile Addresses ------------------------------------------------
address constant POSEIDON2       = address(0x0501); // LP-3658
address constant RECEIPT_REGISTRY = address(0x0530); // LP-0530
address constant SEAL_FINALITY   = address(0x0536); // LP-0536: finality oracle

// Four finality states defined by LP-0536.
// Each state subsumes the guarantees of the previous one.
enum FinalityState {
    Pending,          // 0 - Seal submitted, not yet verified
    ClassicalFinal,   // 1 - Finalized by Snowman++ / classical consensus
    QuantumFinal,     // 2 - Finalized by Quasar quantum-finality round
    HorizonFinal      // 3 - Irreversible via Quantum Event Horizon checkpoint
}

// Finality metadata returned by the precompile.
struct FinalityInfo {
    bytes32       sealId;
    FinalityState state;
    uint64        classicalBlock;    // Block where classical finality was reached
    uint64        quantumRound;      // Quasar round that confirmed quantum finality
    bytes32       horizonProof;      // Event Horizon inclusion proof root (0x0 if not yet)
    uint64        finalizedAt;       // Timestamp of current finality state
}

// ISealFinality -- the interface exposed by the 0x0536 precompile.
interface ISealFinality {
    /// @notice Query current finality state for a seal.
    function getFinalityState(bytes32 sealId) external view returns (FinalityInfo memory);

    /// @notice Check whether a seal has reached at least the required finality.
    function meetsFinality(bytes32 sealId, FinalityState required) external view returns (bool);

    /// @notice Get the latest Quantum Event Horizon checkpoint root.
    function getHorizonRoot() external view returns (bytes32 root, uint64 checkpoint);

    /// @notice Generate a horizon proof for cross-chain export.
    function exportHorizonProof(bytes32 sealId) external view returns (bytes memory proof, bytes32 root);
}

contract SealFinality {

    /// @notice Minimum finality required by this application.
    FinalityState public requiredFinality;

    /// @notice Application-level seal records gated by finality.
    mapping(bytes32 => bool) public accepted;

    event FinalityChecked(bytes32 indexed sealId, FinalityState state, bool meets);
    event SealAccepted(bytes32 indexed sealId, FinalityState state);
    event HorizonExported(bytes32 indexed sealId, bytes32 root);

    constructor(FinalityState _required) {
        requiredFinality = _required;
    }

    // ----------------------------------------------------------------
    // Finality-gated acceptance
    // ----------------------------------------------------------------

    /// @notice Accept a seal only if it meets the application's finality requirement.
    /// @param sealId Seal to check and accept.
    function acceptIfFinal(bytes32 sealId) external returns (FinalityState state) {
        // Precompile: query finality state from LP-0536
        (bool ok, bytes memory raw) = SEAL_FINALITY.staticcall(
            abi.encodeWithSelector(ISealFinality.getFinalityState.selector, sealId)
        );
        require(ok, "finality query failed");
        FinalityInfo memory info = abi.decode(raw, (FinalityInfo));
        state = info.state;

        // Precompile: check if seal meets required finality
        (bool ok2, bytes memory raw2) = SEAL_FINALITY.staticcall(
            abi.encodeWithSelector(ISealFinality.meetsFinality.selector, sealId, requiredFinality)
        );
        require(ok2, "finality check failed");
        bool meets = abi.decode(raw2, (bool));

        emit FinalityChecked(sealId, state, meets);

        if (meets) {
            accepted[sealId] = true;
            emit SealAccepted(sealId, state);
        }
    }

    // ----------------------------------------------------------------
    // Horizon checkpoint queries
    // ----------------------------------------------------------------

    /// @notice Get the latest Quantum Event Horizon checkpoint.
    /// @dev    The horizon root anchors all HorizonFinal seals and can be
    ///         verified independently on external chains.
    function latestHorizon() external view returns (bytes32 root, uint64 checkpoint) {
        // Precompile: SEAL_FINALITY.getHorizonRoot
        (bool ok, bytes memory raw) = SEAL_FINALITY.staticcall(
            abi.encodeWithSelector(ISealFinality.getHorizonRoot.selector)
        );
        require(ok, "horizon query failed");
        (root, checkpoint) = abi.decode(raw, (bytes32, uint64));
    }

    // ----------------------------------------------------------------
    // Cross-chain export
    // ----------------------------------------------------------------

    /// @notice Export a horizon proof for verifying a seal on an external chain.
    /// @param sealId Seal that must have reached HorizonFinal.
    function exportForCrossChain(bytes32 sealId) external returns (bytes memory proof, bytes32 root) {
        // Precompile: SEAL_FINALITY.exportHorizonProof
        (bool ok, bytes memory raw) = SEAL_FINALITY.staticcall(
            abi.encodeWithSelector(ISealFinality.exportHorizonProof.selector, sealId)
        );
        require(ok, "export failed -- seal may not be HorizonFinal");
        (proof, root) = abi.decode(raw, (bytes, bytes32));
        emit HorizonExported(sealId, root);
    }

    // ----------------------------------------------------------------
    // Admin
    // ----------------------------------------------------------------

    /// @notice Update the minimum finality requirement.
    function setRequiredFinality(FinalityState _required) external {
        requiredFinality = _required;
    }
}
