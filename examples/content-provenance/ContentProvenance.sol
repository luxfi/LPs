// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// ContentProvenance - LP-7110 AI & Media Content Provenance Standard
// Tracks model manifests, output attestations, and media derivation DAGs
// on the Lux A-Chain / Z-Chain with EU AI Act compliance hooks.

// -- Precompile Addresses --------------------------------------------------------
address constant POSEIDON2        = address(0x0501); // LP-3658
address constant SEAL_SUBMIT      = address(0x0536); // LP-0535: data seal
address constant RECEIPT_REGISTRY = address(0x0530); // LP-0530

// Model manifest: immutable record of an AI model's identity.
struct ModelManifest {
    bytes32 manifestId;          // Poseidon2(weightsHash, archHash, trainingHash)
    bytes32 weightsHash;         // Hash of serialised weights
    bytes32 architectureHash;    // Hash of architecture description
    bytes32 trainingDataHash;    // Hash of training dataset manifest
    string  modelName;           // Human-readable name
    string  modelVersion;        // Semantic version
    address registrant;          // Entity that registered the model
    uint64  registeredAt;
}

// Output attestation: links a content hash back to a model.
struct OutputAttestation {
    bytes32 attestationId;
    bytes32 contentHash;         // Poseidon2 hash of output content
    bytes32 manifestId;          // Model that produced the output
    bytes32 encryptedModelProof; // FHE-encrypted comparison proof (LP-0535 Private)
    uint64  createdAt;
}

// Derivation edge in the media DAG.
struct Derivation {
    bytes32 childHash;           // Derived content
    bytes32 parentHash;          // Source content
    bytes32 transformHash;       // Description of transformation applied
    uint64  timestamp;
}

// EU AI Act risk tier (Article 6).
enum RiskTier { Minimal, Limited, High, Unacceptable }

contract ContentProvenance {
    mapping(bytes32 => ModelManifest)    public manifests;
    mapping(bytes32 => OutputAttestation) public attestations;
    mapping(bytes32 => Derivation[])     public derivations; // child -> parents
    mapping(bytes32 => RiskTier)         public riskTiers;

    event ManifestRegistered(bytes32 indexed manifestId, address indexed registrant);
    event OutputAttested(bytes32 indexed attestationId, bytes32 indexed manifestId);
    event DerivationRecorded(bytes32 indexed childHash, bytes32 indexed parentHash);
    event RiskTierSet(bytes32 indexed manifestId, RiskTier tier);

    // ----------------------------------------------------------------
    // Model manifest registration
    // ----------------------------------------------------------------

    /// @notice Register an AI model manifest on-chain.
    function registerManifest(
        bytes32 weightsHash,
        bytes32 architectureHash,
        bytes32 trainingDataHash,
        string  calldata modelName,
        string  calldata modelVersion
    ) external returns (bytes32 manifestId) {
        // Precompile: Poseidon2 hash of the three model identity hashes
        (bool ok, bytes memory raw) = POSEIDON2.staticcall(
            abi.encodePacked(uint8(0x04), weightsHash, architectureHash, trainingDataHash)
        );
        require(ok, "Poseidon2 failed");
        manifestId = abi.decode(raw, (bytes32));

        require(manifests[manifestId].registeredAt == 0, "already registered");

        manifests[manifestId] = ModelManifest(
            manifestId, weightsHash, architectureHash, trainingDataHash,
            modelName, modelVersion, msg.sender, uint64(block.timestamp)
        );
        emit ManifestRegistered(manifestId, msg.sender);
    }

    // ----------------------------------------------------------------
    // Output attestation (encrypted model ID comparison)
    // ----------------------------------------------------------------

    /// @notice Attest that content was produced by a registered model.
    /// @param contentHash       Poseidon2 hash of the output.
    /// @param manifestId        Registered model manifest.
    /// @param encModelProof     FHE-encrypted proof of model identity match.
    function attestOutput(
        bytes32 contentHash,
        bytes32 manifestId,
        bytes32 encModelProof
    ) external returns (bytes32 attestationId) {
        require(manifests[manifestId].registeredAt != 0, "unknown model");

        attestationId = keccak256(abi.encodePacked(contentHash, manifestId, block.timestamp));

        // Precompile: seal the attestation via LP-0535 Private mode
        (bool ok,) = SEAL_SUBMIT.call(
            abi.encode(attestationId, contentHash, uint8(2), encModelProof)
        );
        require(ok, "Seal failed");

        attestations[attestationId] = OutputAttestation(
            attestationId, contentHash, manifestId, encModelProof, uint64(block.timestamp)
        );
        emit OutputAttested(attestationId, manifestId);
    }

    // ----------------------------------------------------------------
    // Media derivation DAG
    // ----------------------------------------------------------------

    /// @notice Record a derivation edge: childHash was derived from parentHash.
    function recordDerivation(
        bytes32 childHash,
        bytes32 parentHash,
        bytes32 transformHash
    ) external {
        derivations[childHash].push(Derivation(childHash, parentHash, transformHash, uint64(block.timestamp)));
        emit DerivationRecorded(childHash, parentHash);
    }

    // ----------------------------------------------------------------
    // EU AI Act compliance interface
    // ----------------------------------------------------------------

    /// @notice Assign a risk tier to a model manifest (Article 6 classification).
    function setRiskTier(bytes32 manifestId, RiskTier tier) external {
        require(manifests[manifestId].registrant == msg.sender, "not registrant");
        riskTiers[manifestId] = tier;
        emit RiskTierSet(manifestId, tier);
    }

    /// @notice Check whether a model meets the minimum disclosure requirements.
    function meetsDisclosure(bytes32 manifestId) external view returns (bool) {
        ModelManifest storage m = manifests[manifestId];
        return m.weightsHash != bytes32(0)
            && m.architectureHash != bytes32(0)
            && m.trainingDataHash != bytes32(0);
    }
}
