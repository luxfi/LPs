import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const LPS_DIR = path.join(process.cwd(), '../LPs');

export interface LPMetadata {
  lp?: number | string;
  title?: string;
  description?: string;
  status?: 'Draft' | 'Review' | 'Last Call' | 'Final' | 'Withdrawn' | 'Stagnant' | 'Superseded';
  type?: 'Standards Track' | 'Meta' | 'Informational';
  category?: string; // Flexible category field
  author?: string;
  created?: string;
  updated?: string;
  requires?: string | number | number[];
  related?: number[]; // Cross-links to related LPs
  tags?: string[];
  [key: string]: any;
}

export interface LPPage {
  slug: string[];
  data: {
    title: string;
    description?: string;
    content: string;
    frontmatter: LPMetadata;
  };
}

export interface LPCategory extends CategoryMeta {
  lps: LPPage[];
}

// Category metadata with educational content
export interface CategoryMeta {
  slug: string;
  name: string;
  shortDesc: string;
  description: string;
  range?: [number, number]; // Optional - for LP series
  tags?: string[]; // Tags that match this category
  contentMatch?: string[]; // Content keywords to match
  icon: string;
  color: string;
  learnMore: string;
  keyTopics: string[];
}

// ============================================================================
// LP TOPIC TAXONOMY - Research-Grade Subject Model
// ============================================================================
// CORE PRINCIPLE: Subjects describe knowledge. Chains describe deployment.
//
// This taxonomy separates:
// - SUBJECTS (research domains): Consensus, Threshold, MPC, ZKP, PQC, etc.
// - CHAINS (execution domains): C-Chain, T-Chain, Q-Chain, Z-Chain, etc.
// - PRODUCT AREAS: DeFi, DEX, Wallets, Governance, etc.
//
// MPC ≠ Threshold ≠ KMS ≠ ZKP ≠ Consensus ≠ Crypto (generic)
// They overlap in implementation, but they are DISTINCT research domains.
//
// ORDER MATTERS: More specific subjects come FIRST for priority matching
// Priority: 1) Tag match, 2) Number range, 3) Explicit frontmatter category
// ============================================================================

const LP_TOPICS: CategoryMeta[] = [
  // ============================================================================
  // SECTION 1: SUBJECTS (Research Domains)
  // ============================================================================
  // These are the core knowledge areas - how cryptographers and researchers think

  // ============================================================
  // 1.1 CONSENSUS SYSTEMS — Agreement, finality, validator coordination
  // ============================================================
  // Answers: "Who agrees and when?" NOT "How keys are held"
  {
    slug: 'consensus',
    name: 'Consensus Systems',
    shortDesc: 'Agreement & finality',
    description: 'Agreement, finality, and validator coordination. Photon selection, Flare DAG, Quasar sub-second finality, epoching, and block timing.',
    range: [100, 199],
    tags: ['consensus', 'photon', 'flare', 'quasar', 'snowman', 'finality', 'bft', 'validators', 'epoching', 'block-timing', 'sequencer', 'parallel-validation'],
    icon: 'consensus',
    color: 'purple',
    learnMore: 'Consensus is the physics engine of the network — who agrees and when. Lux achieves sub-second finality with Quasar.',
    keyTopics: ['Photon selection', 'Flare DAG', 'Quasar finality', 'Epoching', 'Validator rotation'],
  },

  // ============================================================
  // 1.2 THRESHOLD CRYPTOGRAPHY — Distributed signing and key control
  // ============================================================
  // This is signing-focused cryptography. Ringtail lives here.
  // EXPLICITLY NOT: Generic MPC computation, Custody UX, KMS policy
  {
    slug: 'threshold',
    name: 'Threshold Cryptography',
    shortDesc: 'Distributed signing',
    description: 'Distributed signing and key control. FROST, CGGMP, Ringtail, threshold ECDSA/Schnorr, resharing protocols, and signer rotation.',
    tags: ['threshold', 'threshold-crypto', 'frost', 'cggmp', 'cggmp21', 'ringtail', 'tss', 'resharing', 'signer-rotation', 'threshold-ecdsa', 'threshold-schnorr'],
    icon: 'key',
    color: 'yellow',
    learnMore: 'Threshold cryptography enables distributed signing — multiple parties sign without any single party holding the full key.',
    keyTopics: ['FROST', 'CGGMP', 'Ringtail', 'Threshold ECDSA', 'Dynamic resharing'],
  },

  // ============================================================
  // 1.3 MULTI-PARTY COMPUTATION (MPC) — General secure computation
  // ============================================================
  // Answers: "What can we compute without revealing inputs?"
  // Related but SEPARATE from Threshold (overlaps in math, not scope)
  {
    slug: 'mpc',
    name: 'Multi-Party Computation',
    shortDesc: 'Secure computation',
    description: 'General-purpose secure computation across parties. MPC protocols, secure function evaluation, distributed computation, and privacy-preserving compute.',
    tags: ['mpc', 'secure-computation', 'distributed-computation', 'privacy-preserving-compute', 'mpc-bridge', 'mpc-custody'],
    icon: 'compute',
    color: 'orange',
    learnMore: 'MPC answers "what can we compute without revealing inputs" — general secure computation beyond just signing.',
    keyTopics: ['Secure function evaluation', 'Distributed computation', 'MPC protocols', 'Privacy-preserving compute'],
  },

  // ============================================================
  // 1.4 KEY MANAGEMENT SYSTEMS (KMS) — Operational control of crypto material
  // ============================================================
  // This is NEITHER MPC nor Threshold — it's governance + ops for keys
  {
    slug: 'kms',
    name: 'Key Management',
    shortDesc: 'Key lifecycle & policy',
    description: 'Operational control of cryptographic material. K-Chain, HSM integration, key lifecycle, policy engines, access control, and custody enforcement.',
    tags: ['kms', 'key-management', 'k-chain', 'hsm', 'key-lifecycle', 'policy-engine', 'access-control', 'rotation-rules', 'custody-enforcement', 'custody'],
    icon: 'lock',
    color: 'slate',
    learnMore: 'KMS is the governance + ops layer for keys — policy engines, lifecycle management, and custody enforcement.',
    keyTopics: ['K-Chain', 'HSM integration', 'Policy engines', 'Key rotation', 'Custody enforcement'],
  },

  // ============================================================
  // 1.5 POST-QUANTUM CRYPTOGRAPHY (PQC) — Future-resistant primitives
  // ============================================================
  // About hardness assumptions, NOT protocol topology
  // Separate from Threshold, MPC, ZKP
  {
    slug: 'pqc',
    name: 'Post-Quantum Cryptography',
    shortDesc: 'Quantum-resistant',
    description: 'Future-resistant cryptographic primitives. ML-KEM (Kyber), ML-DSA (Dilithium), SLH-DSA (SPHINCS+), Lamport OTS, and hybrid transitions.',
    tags: ['pqc', 'post-quantum', 'quantum', 'ml-kem', 'ml-dsa', 'slh-dsa', 'dilithium', 'kyber', 'lamport', 'fips-203', 'fips-204', 'fips-205', 'cryptographic-agility', 'hybrid-transition'],
    icon: 'shield',
    color: 'emerald',
    learnMore: 'PQC is about hardness assumptions — quantum-resistant primitives based on NIST FIPS 203-205 standards.',
    keyTopics: ['ML-KEM', 'ML-DSA', 'SLH-DSA', 'Lamport OTS', 'Hybrid transitions'],
  },

  // ============================================================
  // 1.6 ZERO-KNOWLEDGE PROOF SYSTEMS (ZKP) — Verifiability without disclosure
  // ============================================================
  // Answers: "How to prove correctness without revealing state?"
  // EXPLICITLY NOT: MPC, Threshold signing, Encryption-only systems
  {
    slug: 'zkp',
    name: 'Zero-Knowledge Proofs',
    shortDesc: 'Verifiable privacy',
    description: 'Verifiability without disclosure. ZK proofs, zkVMs, SNARKs, STARKs, validity proofs, and privacy-preserving execution.',
    tags: ['zk', 'zkp', 'zkvm', 'snark', 'stark', 'validity-proof', 'circuit', 'groth16', 'plonk', 'recursive-proofs'],
    icon: 'eye-off',
    color: 'indigo',
    learnMore: 'ZKP answers "how to prove correctness without revealing state" — verifiability with privacy.',
    keyTopics: ['ZK-SNARKs', 'ZK-STARKs', 'zkVM execution', 'Validity proofs', 'Circuit design'],
  },

  // ============================================================
  // 1.7 CRYPTOGRAPHY (Foundational) — Shared primitives & abstractions
  // ============================================================
  // The toolbox, not the system: hash functions, curves, RNG, signature verification
  {
    slug: 'crypto',
    name: 'Cryptography',
    shortDesc: 'Primitives & curves',
    description: 'Foundational cryptographic primitives. Hash functions, elliptic curves, RNG, signature verification, and crypto libraries.',
    tags: ['crypto', 'cryptography', 'hash', 'curve', 'rng', 'signature', 'secp256k1', 'secp256r1', 'bls', 'ed25519', 'encryption'],
    icon: 'lock',
    color: 'gray',
    learnMore: 'Foundational crypto is the toolbox — primitives and abstractions used by higher-level systems.',
    keyTopics: ['Hash functions', 'Elliptic curves', 'Signature schemes', 'BLS', 'Ed25519'],
  },

  // ============================================================
  // 1.8 AI & ATTESTATION SYSTEMS — Verification of computation
  // ============================================================
  // A new research vertical, not an add-on
  {
    slug: 'ai',
    name: 'AI & Attestation',
    shortDesc: 'AI verification',
    description: 'Verification of computation, models, and agents. AI mining, training ledgers, attestations, LLM integration, and confidential AI compute.',
    tags: ['ai', 'attestation', 'ai-mining', 'llm', 'training-ledger', 'confidential-ai', 'gpu', 'inference', 'model', 'agent', 'ml', 'model-verification'],
    icon: 'brain',
    color: 'violet',
    learnMore: 'AI & Attestation is a new research vertical — verification of computation, models, and AI agents.',
    keyTopics: ['AI mining', 'Training ledgers', 'Attestations', 'LLM integration', 'Confidential AI'],
  },

  // ============================================================================
  // SECTION 2: CHAINS (Execution Domains)
  // ============================================================================
  // Chains are PRODUCTS that deploy SUBJECTS. They aggregate research domains.

  // ============================================================
  // 2.1 P-CHAIN — Platform coordination
  // ============================================================
  {
    slug: 'p-chain',
    name: 'P-Chain',
    shortDesc: 'Platform coordination',
    description: 'Platform chain for validator management, staking, delegation, subnet creation, and network coordination.',
    range: [1000, 1199],
    tags: ['p-chain', 'platform', 'staking', 'delegation', 'subnet', 'validator-management'],
    icon: 'platform',
    color: 'violet',
    learnMore: 'P-Chain is the metadata blockchain coordinating validators and subnets across the Lux network.',
    keyTopics: ['Validator management', 'Staking', 'Delegation', 'Subnet creation'],
  },

  // ============================================================
  // 2.2 C-CHAIN — EVM execution
  // ============================================================
  {
    slug: 'c-chain',
    name: 'C-Chain',
    shortDesc: 'EVM execution',
    description: 'Contract chain for EVM execution. Precompiled contracts, gas optimization, Solidity standards, and smart contract patterns.',
    range: [2000, 2499],
    tags: ['c-chain', 'evm', 'precompile', 'solidity', 'smart-contract', 'smart-contracts', 'gas', 'coreth'],
    icon: 'code',
    color: 'cyan',
    learnMore: 'C-Chain runs the EVM with enhanced performance. Precompiles add native cryptographic functionality.',
    keyTopics: ['EVM precompiles', 'Gas optimization', 'Contract standards', 'Solidity patterns'],
  },

  // ============================================================
  // 2.3 X-CHAIN — Asset exchange
  // ============================================================
  {
    slug: 'x-chain',
    name: 'X-Chain',
    shortDesc: 'Asset exchange',
    description: 'Exchange chain for native asset issuance, UTXO transactions, atomic swaps, and high-throughput transfers.',
    range: [3000, 3999],
    tags: ['x-chain', 'utxo', 'asset', 'atomic-swap'],
    icon: 'exchange',
    color: 'sky',
    learnMore: 'X-Chain handles high-throughput asset transfers with UTXO model for parallel processing.',
    keyTopics: ['Asset issuance', 'UTXO model', 'Atomic swaps', 'Exchange semantics'],
  },

  // ============================================================
  // 2.4 T-CHAIN — Threshold + MPC execution
  // ============================================================
  {
    slug: 't-chain',
    name: 'T-Chain',
    shortDesc: 'Threshold execution',
    description: 'Threshold chain for distributed signing and MPC custody. Deploys threshold cryptography and MPC research.',
    range: [7000, 7999],
    tags: ['t-chain'],
    icon: 'key',
    color: 'yellow',
    learnMore: 'T-Chain is the execution environment for threshold cryptography and MPC protocols.',
    keyTopics: ['Threshold execution', 'MPC custody', 'Distributed signing', 'Per-asset keys'],
  },

  // ============================================================
  // 2.5 Q-CHAIN — PQC execution
  // ============================================================
  {
    slug: 'q-chain',
    name: 'Q-Chain',
    shortDesc: 'Quantum-safe execution',
    description: 'Quantum chain for post-quantum cryptographic operations. Deploys PQC research with NIST algorithms.',
    range: [4000, 4999],
    tags: ['q-chain', 'quantum-chain', 'quantum-safe'],
    icon: 'shield',
    color: 'emerald',
    learnMore: 'Q-Chain is the execution environment for quantum-safe transaction processing.',
    keyTopics: ['PQC execution', 'Quantum safety', 'Cryptographic agility'],
  },

  // ============================================================
  // 2.6 Z-CHAIN — ZKP execution (research phase)
  // ============================================================
  {
    slug: 'z-chain',
    name: 'Z-Chain',
    shortDesc: 'ZK execution',
    description: 'Zero-knowledge chain for zkVM execution and validity proofs. Deploys ZKP research (research phase).',
    range: [8000, 8999],
    tags: ['z-chain'],
    icon: 'eye-off',
    color: 'indigo',
    learnMore: 'Z-Chain (research phase) is the execution environment for zero-knowledge proofs.',
    keyTopics: ['zkVM execution', 'Validity proofs', 'Private computation'],
  },

  // ============================================================
  // 2.7 A-CHAIN — AI execution
  // ============================================================
  {
    slug: 'a-chain',
    name: 'A-Chain',
    shortDesc: 'AI execution',
    description: 'Attestation chain for AI workloads. Deploys AI & attestation research: model inference, training ledgers, and verification.',
    range: [5000, 5999],
    tags: ['a-chain'],
    icon: 'brain',
    color: 'violet',
    learnMore: 'A-Chain is the execution environment for AI workloads and attestations.',
    keyTopics: ['AI execution', 'Model inference', 'Training provenance'],
  },

  // ============================================================
  // 2.8 B-CHAIN — Bridging execution
  // ============================================================
  {
    slug: 'b-chain',
    name: 'B-Chain',
    shortDesc: 'Bridge execution',
    description: 'Bridge chain for cross-chain asset movement. BridgeVM, Teleport protocol, and bridge security.',
    range: [6000, 6999],
    tags: ['b-chain', 'bridgevm', 'bridge-chain'],
    icon: 'bridge',
    color: 'lime',
    learnMore: 'B-Chain is the dedicated bridging infrastructure for secure cross-chain operations.',
    keyTopics: ['BridgeVM', 'Teleport', 'Asset registry', 'Bridge security'],
  },

  // ============================================================================
  // SECTION 3: SYSTEMS (Protocol Infrastructure)
  // ============================================================================

  // ============================================================
  // 3.1 BRIDGING SYSTEMS — Asset movement between domains
  // ============================================================
  // Bridge is a SYSTEM, not just messaging. Uses MPC, Threshold, Consensus.
  {
    slug: 'bridge',
    name: 'Bridging Systems',
    shortDesc: 'Asset movement',
    description: 'Asset movement between domains. Teleport, BridgeVM, asset registry, bridge security, and emergency recovery.',
    tags: ['bridge', 'teleport', 'teleporter', 'bridge-security', 'asset-registry', 'bridge-sdk'],
    icon: 'bridge',
    color: 'lime',
    learnMore: 'Bridges move assets between chains. Most exploits happen here — Lux treats this as infrastructure.',
    keyTopics: ['Teleport protocol', 'Bridge security', 'Asset registry', 'Emergency recovery'],
  },

  // ============================================================
  // 3.2 INTEROPERABILITY — Information movement
  // ============================================================
  // Interop ≠ Bridge. This is about MESSAGES, not VALUE.
  {
    slug: 'interop',
    name: 'Interoperability',
    shortDesc: 'Cross-chain messaging',
    description: 'Information movement, not value. Warp protocol, ICM, message formats, and relayer infrastructure.',
    tags: ['interop', 'warp', 'icm', 'cross-chain', 'message-format', 'interchain', 'relayer'],
    icon: 'link',
    color: 'sky',
    learnMore: 'Interop is about messages, not assets. Warp and ICM enable secure cross-chain communication.',
    keyTopics: ['Warp messaging', 'ICM protocol', 'Message formats', 'Native transfers'],
  },

  // ============================================================
  // 3.3 NETWORK — The system as a whole
  // ============================================================
  {
    slug: 'network',
    name: 'Network',
    shortDesc: 'Architecture & tokenomics',
    description: 'The Lux system as a whole: architecture, economic model, topology, and how chains fit together.',
    range: [0, 99],
    tags: ['network', 'architecture', 'topology', 'tokenomics', 'economics', 'incentives'],
    icon: 'globe',
    color: 'blue',
    learnMore: 'Network describes Lux as a whole — the blueprint, not node infra or consensus.',
    keyTopics: ['Network architecture', 'Tokenomics', 'Multi-chain topology', 'Standards framework'],
  },

  // ============================================================
  // 3.4 NODE — Infrastructure substrate
  // ============================================================
  {
    slug: 'node',
    name: 'Node Infrastructure',
    shortDesc: 'Node lifecycle',
    description: 'Node lifecycle, state sync, pruning, snapshots, plugin architecture, VM loading, and database.',
    tags: ['node', 'sync', 'pruning', 'snapshot', 'plugin', 'database', 'storage', 'vm-loader', 'network-runner', 'testing-framework'],
    icon: 'server',
    color: 'slate',
    learnMore: 'Node infrastructure is the minimum system required to participate in Lux.',
    keyTopics: ['Node lifecycle', 'State sync', 'Plugin architecture', 'VM loading'],
  },

  // ============================================================================
  // SECTION 4: PRODUCT AREAS
  // ============================================================================

  // ============================================================
  // 4.1 MARKETS & DEFI
  // ============================================================
  {
    slug: 'defi',
    name: 'Markets & DeFi',
    shortDesc: 'Decentralized finance',
    description: 'DeFi protocols: AMMs, lending, perpetuals, derivatives, yield optimization, and oracles.',
    range: [2500, 2519],
    tags: ['defi', 'amm', 'lending', 'yield', 'swap', 'liquidity', 'perpetuals', 'derivatives', 'compound', 'alchemix', 'oracle', 'self-repaying'],
    icon: 'chart',
    color: 'green',
    learnMore: 'DeFi on Lux is safer and faster due to infrastructure-first design.',
    keyTopics: ['AMM protocols', 'Lending markets', 'Perpetuals', 'Oracles'],
  },

  // ============================================================
  // 4.2 DEX & TRADING
  // ============================================================
  {
    slug: 'dex',
    name: 'DEX & Trading',
    shortDesc: 'High-performance DEX',
    description: 'DEX infrastructure: order books, matching engines, HFT venues, CLOB, and trading APIs.',
    range: [9000, 9999],
    tags: ['dex', 'trading', 'orderbook', 'clob', 'hft', 'exchange', 'matching-engine', 'venue'],
    icon: 'exchange',
    color: 'teal',
    learnMore: 'High-performance decentralized exchange infrastructure with HFT-grade matching.',
    keyTopics: ['Order books', 'CLOB', 'HFT venues', 'Matching engines'],
  },

  // ============================================================
  // 4.3 ASSETS & TOKENS
  // ============================================================
  {
    slug: 'tokens',
    name: 'Assets & Tokens',
    shortDesc: 'Token standards',
    description: 'Token standards: LRC-20, LRC-721, LRC-1155, extensions, and NFT staking.',
    tags: ['token', 'tokens', 'lrc', 'lrc-20', 'lrc-721', 'lrc-1155', 'nft', 'fungible', 'token-standard', 'erc20b', 'burnable', 'mintable', 'bridgable'],
    icon: 'token',
    color: 'amber',
    learnMore: 'Token standards define how digital assets are created and managed. ERC-compatible.',
    keyTopics: ['LRC-20', 'LRC-721', 'LRC-1155', 'Token extensions'],
  },

  // ============================================================
  // 4.4 WALLETS & IDENTITY
  // ============================================================
  {
    slug: 'wallets',
    name: 'Wallets & Identity',
    shortDesc: 'Wallet & DID',
    description: 'Wallet standards, multisig, Safe integration, account abstraction, DIDs, and verifiable credentials.',
    tags: ['wallet', 'multisig', 'safe', 'account-abstraction', 'smart-wallet', 'erc-4337', 'paymaster', 'did', 'identity', 'credential', 'kyc', 'ssi'],
    icon: 'wallet',
    color: 'purple',
    learnMore: 'This layer connects users, institutions, DAOs, and AI agents to Lux securely.',
    keyTopics: ['HD wallets', 'Multisig', 'Account abstraction', 'DIDs'],
  },

  // ============================================================
  // 4.5 GOVERNANCE & IMPACT
  // ============================================================
  {
    slug: 'governance',
    name: 'Governance & Impact',
    shortDesc: 'DAO & ESG',
    description: 'On-chain governance, DAO frameworks, voting, ESG compliance, sustainability, and public goods.',
    range: [2520, 2599],
    tags: ['governance', 'dao', 'voting', 'proposal', 'treasury', 'azorius', 'meta', 'esg', 'sustainability', 'carbon', 'green', 'impact', 'public-goods', 'grants', 'sdg'],
    icon: 'vote',
    color: 'indigo',
    learnMore: 'Lux explicitly models governance, ESG compliance, and public goods.',
    keyTopics: ['DAO frameworks', 'Voting mechanisms', 'ESG compliance', 'Public goods'],
  },

  // ============================================================
  // 4.6 PRIVACY
  // ============================================================
  {
    slug: 'privacy',
    name: 'Privacy',
    shortDesc: 'Confidential compute',
    description: 'Privacy-preserving protocols: FHE, TEE integration, confidential contracts, and MEV protection.',
    tags: ['privacy', 'fhe', 'tee', 'confidential-compute', 'confidential', 'mev', 'mev-protection'],
    icon: 'shield',
    color: 'slate',
    learnMore: 'Privacy enables confidential transactions and private smart contracts.',
    keyTopics: ['FHE', 'TEE integration', 'Confidential contracts', 'MEV protection'],
  },

  // ============================================================
  // 4.7 DEVELOPER PLATFORM
  // ============================================================
  {
    slug: 'dev-platform',
    name: 'Developer Platform',
    shortDesc: 'SDKs & tooling',
    description: 'SDKs, CLIs, GraphQL, testing frameworks, indexing, and developer tooling.',
    tags: ['sdk', 'dev-tools', 'cli', 'testing', 'tooling', 'api', 'indexing', 'graphql', 'typescript', 'library', 'standard-library', 'developer'],
    icon: 'code',
    color: 'blue',
    learnMore: 'Developer platform makes building on Lux accessible.',
    keyTopics: ['SDKs', 'CLI tools', 'GraphQL', 'Testing frameworks'],
  },

  // ============================================================
  // 4.8 SECURITY
  // ============================================================
  {
    slug: 'security',
    name: 'Security',
    shortDesc: 'Audits & safety',
    description: 'Security auditing, vulnerability disclosure, bug bounties, and best practices.',
    tags: ['security', 'audit', 'vulnerability', 'bug-bounty', 'safety'],
    icon: 'shield',
    color: 'red',
    learnMore: 'Security LPs ensure the network and applications are safe.',
    keyTopics: ['Security audits', 'Vulnerability disclosure', 'Bug bounties'],
  },

  // ============================================================
  // 4.9 RESEARCH
  // ============================================================
  {
    slug: 'research',
    name: 'Research',
    shortDesc: 'Ongoing research',
    description: 'Research track: novel consensus, scalability, FHE, data availability, and experimental protocols.',
    range: [700, 999],
    tags: ['research', 'paper', 'academic', 'innovation', 'theory', 'index', 'data-availability', 'stablecoin', 'payments', 'experimental'],
    icon: 'flask',
    color: 'pink',
    learnMore: 'Research track signals "We are still building the future."',
    keyTopics: ['Novel protocols', 'FHE research', 'Data availability', 'Stablecoin mechanisms'],
  },

  // ============================================================
  // 4.10 SCALING
  // ============================================================
  {
    slug: 'scaling',
    name: 'Scaling',
    shortDesc: 'L2 & throughput',
    description: 'Scalability solutions: Layer 2, rollups, state channels, and data availability.',
    tags: ['scaling', 'l2', 'rollup', 'layer2', 'throughput', 'fraud-proof'],
    icon: 'layers',
    color: 'orange',
    learnMore: 'Scaling LPs define how Lux achieves high throughput.',
    keyTopics: ['Rollups', 'State channels', 'Data availability', 'Fraud proofs'],
  },
];

// Keep the old LP_CATEGORIES for backward compatibility (number-range only)
const LP_CATEGORIES: CategoryMeta[] = LP_TOPICS.filter(t => t.range !== undefined);

function getAllLPFiles(): string[] {
  try {
    const files = fs.readdirSync(LPS_DIR);
    return files
      .filter(file => file.endsWith('.md') || file.endsWith('.mdx'))
      .filter(file => file.startsWith('lp-'));
  } catch (error) {
    console.error('Error reading LPs directory:', error);
    return [];
  }
}

function readLPFile(filename: string): LPPage | null {
  try {
    const filePath = path.join(LPS_DIR, filename);
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const { data, content } = matter(fileContents);

    // Extract LP number from filename (preferred - avoids YAML octal parsing issues)
    // YAML interprets numbers with leading zeros as octal (e.g., 0111 = 73 decimal)
    // Filename extraction is reliable: lp-0111-... → 111
    const lpMatch = filename.match(/lp-(\d+)/);
    const lpNumber = lpMatch ? parseInt(lpMatch[1], 10) : (data.lp || null);

    // Generate slug based on LP number only (e.g., "lp-9000" not "lp-9000-dex-core-specification")
    // This ensures consistent URLs: /docs/lp-9000 regardless of title in filename
    const slug = lpNumber !== null
      ? [`lp-${String(lpNumber).padStart(4, '0')}`]
      : filename.replace(/\.mdx?$/, '').split('/');

    // Convert Date objects to strings
    const processedData: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value instanceof Date) {
        processedData[key] = value.toISOString().split('T')[0];
      } else {
        processedData[key] = value;
      }
    }

    return {
      slug,
      data: {
        title: processedData.title || filename.replace(/\.mdx?$/, ''),
        description: processedData.description,
        content,
        frontmatter: {
          ...processedData,
          lp: lpNumber,
        } as LPMetadata,
      },
    };
  } catch (error) {
    console.error(`Error reading LP file ${filename}:`, error);
    return null;
  }
}

function getLPNumber(page: LPPage): number {
  const lp = page.data.frontmatter.lp;
  if (typeof lp === 'number') return lp;
  if (typeof lp === 'string') return parseInt(lp, 10) || 9999;
  return 9999;
}

// Determine the PRIMARY category for an LP (each LP belongs to exactly ONE category)
// Priority: 1) Tag match, 2) Number range, 3) Explicit frontmatter category
// NOTE: Tags take precedence because many LPs have legacy "category: Core" that should be ignored
function getPrimaryCategory(page: LPPage): string | null {
  const lpNum = getLPNumber(page);
  const lpTags = (page.data.frontmatter.tags || []).map((t: string) => t.toLowerCase());
  const lpCategory = (page.data.frontmatter.category || '').toLowerCase();

  // Priority 1: Tag match (first matching tag wins - most accurate categorization)
  for (const topic of LP_TOPICS) {
    if (topic.tags) {
      const topicTags = topic.tags.map(t => t.toLowerCase());
      if (lpTags.some(t => topicTags.includes(t))) {
        return topic.slug;
      }
    }
  }

  // Priority 2: Number range (LP series)
  for (const topic of LP_TOPICS) {
    if (topic.range && lpNum >= topic.range[0] && lpNum <= topic.range[1]) {
      return topic.slug;
    }
  }

  // Priority 3: Explicit frontmatter category (fallback for untagged LPs)
  if (lpCategory) {
    const exactMatch = LP_TOPICS.find(t =>
      t.slug === lpCategory || t.name.toLowerCase() === lpCategory
    );
    if (exactMatch) return exactMatch.slug;
  }

  return null;
}

export const source = {
  getPage(slugParam?: string[]): LPPage | null {
    if (!slugParam || slugParam.length === 0) {
      return null;
    }

    const slug = slugParam[0];

    // Extract LP number from slug (e.g., "lp-9000" → 9000)
    const lpMatch = slug.match(/lp-0*(\d+)/i);
    if (lpMatch) {
      const lpNumber = parseInt(lpMatch[1], 10);
      // Find the file that starts with this LP number
      const files = getAllLPFiles();
      const matchingFile = files.find(file => {
        const fileMatch = file.match(/lp-0*(\d+)/i);
        return fileMatch && parseInt(fileMatch[1], 10) === lpNumber;
      });
      if (matchingFile) {
        return readLPFile(matchingFile);
      }
    }

    // Fallback: try exact filename match (for non-standard filenames)
    const filename = `${slug}.md`;
    const mdxFilename = `${slug}.mdx`;

    let page = readLPFile(filename);
    if (!page) {
      page = readLPFile(mdxFilename);
    }

    return page;
  },

  generateParams(): { slug: string[] }[] {
    const files = getAllLPFiles();
    // Generate numeric-only slugs (e.g., lp-9000, not lp-9000-dex-core-specification)
    const slugs = new Set<string>();
    files.forEach(file => {
      const lpMatch = file.match(/lp-(\d+)/);
      if (lpMatch) {
        const lpNumber = parseInt(lpMatch[1], 10);
        slugs.add(`lp-${String(lpNumber).padStart(4, '0')}`);
      }
    });
    return Array.from(slugs).map(slug => ({ slug: [slug] }));
  },

  getAllPages(): LPPage[] {
    const files = getAllLPFiles();
    return files
      .map(readLPFile)
      .filter((page): page is LPPage => page !== null)
      .sort((a, b) => getLPNumber(a) - getLPNumber(b));
  },

  getPagesByStatus(status: string): LPPage[] {
    return this.getAllPages().filter(
      page => page.data.frontmatter.status?.toLowerCase() === status.toLowerCase()
    );
  },

  getPagesByType(type: string): LPPage[] {
    return this.getAllPages().filter(
      page => page.data.frontmatter.type?.toLowerCase() === type.toLowerCase()
    );
  },

  // Get LPs by frontmatter category field
  getPagesByCategory(category: string): LPPage[] {
    return this.getAllPages().filter(
      page => page.data.frontmatter.category?.toLowerCase() === category.toLowerCase()
    );
  },

  // Get LPs by tag
  getPagesByTag(tag: string): LPPage[] {
    const tagLower = tag.toLowerCase();
    return this.getAllPages().filter(page => {
      const tags = page.data.frontmatter.tags || [];
      return tags.some((t: string) => t.toLowerCase() === tagLower);
    });
  },

  // Get LPs by multiple tags (OR logic)
  getPagesByTags(tags: string[]): LPPage[] {
    const tagsLower = tags.map(t => t.toLowerCase());
    return this.getAllPages().filter(page => {
      const lpTags = (page.data.frontmatter.tags || []).map((t: string) => t.toLowerCase());
      return tagsLower.some(t => lpTags.includes(t));
    });
  },

  // Get all unique tags with counts
  getAllTags(): { tag: string; count: number }[] {
    const tagCounts = new Map<string, number>();
    this.getAllPages().forEach(page => {
      (page.data.frontmatter.tags || []).forEach((tag: string) => {
        const lower = tag.toLowerCase();
        tagCounts.set(lower, (tagCounts.get(lower) || 0) + 1);
      });
    });
    return Array.from(tagCounts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);
  },

  // Get all unique tags as simple array
  getAllTagNames(): string[] {
    const tags = new Set<string>();
    this.getAllPages().forEach(page => {
      (page.data.frontmatter.tags || []).forEach((tag: string) => tags.add(tag.toLowerCase()));
    });
    return Array.from(tags).sort();
  },

  // Get related LPs for a given LP
  getRelatedPages(page: LPPage): LPPage[] {
    const allPages = this.getAllPages();
    const lpNum = getLPNumber(page);
    const requires = page.data.frontmatter.requires;
    const related = page.data.frontmatter.related || [];
    const lpTags = page.data.frontmatter.tags || [];

    const relatedNums = new Set<number>();

    // Add explicitly required LPs
    if (Array.isArray(requires)) {
      requires.forEach(r => relatedNums.add(typeof r === 'string' ? parseInt(r, 10) : r));
    } else if (requires) {
      relatedNums.add(typeof requires === 'string' ? parseInt(requires as string, 10) : requires as number);
    }

    // Add explicitly related LPs
    related.forEach((r: number) => relatedNums.add(r));

    // Find LPs with matching tags (limit to top 5)
    const tagMatches = allPages
      .filter(p => {
        if (getLPNumber(p) === lpNum) return false;
        const pTags = p.data.frontmatter.tags || [];
        return lpTags.some((t: string) => pTags.includes(t));
      })
      .slice(0, 5);

    // Combine explicit relations with tag matches
    const result: LPPage[] = [];
    const seenNums = new Set<number>();

    // Add explicit relations first
    allPages.forEach(p => {
      const pNum = getLPNumber(p);
      if (relatedNums.has(pNum) && !seenNums.has(pNum)) {
        result.push(p);
        seenNums.add(pNum);
      }
    });

    // Add tag matches
    tagMatches.forEach(p => {
      const pNum = getLPNumber(p);
      if (!seenNums.has(pNum)) {
        result.push(p);
        seenNums.add(pNum);
      }
    });

    return result.slice(0, 10);
  },

  // Get categorized pages using topics (tag-based + range-based)
  // DEDUPLICATED: Each LP appears in exactly ONE category based on priority
  getCategorizedPages(): LPCategory[] {
    const allPages = this.getAllPages();

    // Group LPs by their primary category (each LP in exactly one category)
    const lpsByCategory = new Map<string, LPPage[]>();
    LP_TOPICS.forEach(topic => lpsByCategory.set(topic.slug, []));

    allPages.forEach(page => {
      const primaryCat = getPrimaryCategory(page);
      if (primaryCat && lpsByCategory.has(primaryCat)) {
        lpsByCategory.get(primaryCat)!.push(page);
      }
    });

    return LP_TOPICS.map(topic => ({
      ...topic,
      description: topic.shortDesc,
      lps: lpsByCategory.get(topic.slug) || [],
    })).filter(cat => cat.lps.length > 0);
  },

  // Get all topics including empty ones
  // DEDUPLICATED: Each LP appears in exactly ONE category based on priority
  getAllTopics(): LPCategory[] {
    const allPages = this.getAllPages();

    // Group LPs by their primary category (each LP in exactly one category)
    const lpsByCategory = new Map<string, LPPage[]>();
    LP_TOPICS.forEach(topic => lpsByCategory.set(topic.slug, []));

    allPages.forEach(page => {
      const primaryCat = getPrimaryCategory(page);
      if (primaryCat && lpsByCategory.has(primaryCat)) {
        lpsByCategory.get(primaryCat)!.push(page);
      }
    });

    return LP_TOPICS.map(topic => ({
      ...topic,
      description: topic.shortDesc,
      lps: lpsByCategory.get(topic.slug) || [],
    }));
  },

  // Get all categories (backward compatibility - number ranges only)
  getAllCategories(): LPCategory[] {
    const allPages = this.getAllPages();

    return LP_CATEGORIES.map(cat => ({
      ...cat,
      description: cat.shortDesc,
      lps: allPages.filter(page => {
        if (!cat.range) return false;
        const lpNum = getLPNumber(page);
        return lpNum >= cat.range[0] && lpNum <= cat.range[1];
      }),
    }));
  },

  // Get topic/category by slug (checks both topics and legacy categories)
  // DEDUPLICATED: Each LP appears in exactly ONE category based on priority
  getCategoryBySlug(slug: string): LPCategory | undefined {
    const topic = LP_TOPICS.find(t => t.slug === slug);
    if (!topic) return undefined;

    const allPages = this.getAllPages();

    // Filter LPs where this category is their PRIMARY category
    const lps = allPages.filter(page => getPrimaryCategory(page) === slug);

    return {
      ...topic,
      description: topic.shortDesc,
      lps,
    };
  },

  // Get topic metadata by name
  getCategoryByName(name: string): CategoryMeta | undefined {
    return LP_TOPICS.find(t => t.name.toLowerCase() === name.toLowerCase());
  },

  // Get all topic/category slugs for static params
  getAllCategorySlugs(): string[] {
    return LP_TOPICS.map(t => t.slug);
  },

  getAdjacentCategories(slug: string): { prev: LPCategory | null; next: LPCategory | null } {
    const categories = this.getCategorizedPages();
    const index = categories.findIndex(c => c.slug === slug);

    if (index === -1) {
      return { prev: null, next: null };
    }

    return {
      prev: index > 0 ? categories[index - 1] : categories[categories.length - 1],
      next: index < categories.length - 1 ? categories[index + 1] : categories[0],
    };
  },

  getStats(): {
    total: number;
    byStatus: Record<string, number>;
    byType: Record<string, number>;
    byTopic: Record<string, number>;
  } {
    const pages = this.getAllPages();
    const byStatus: Record<string, number> = {};
    const byType: Record<string, number> = {};
    const byTopic: Record<string, number> = {};

    pages.forEach(page => {
      const status = page.data.frontmatter.status || 'Unknown';
      const type = page.data.frontmatter.type || 'Unknown';
      byStatus[status] = (byStatus[status] || 0) + 1;
      byType[type] = (byType[type] || 0) + 1;
    });

    // Count by topic (deduplicated - each LP counted once)
    LP_TOPICS.forEach(topic => {
      byTopic[topic.slug] = pages.filter(p => getPrimaryCategory(p) === topic.slug).length;
    });

    return { total: pages.length, byStatus, byType, byTopic };
  },

  // Generate page tree for sidebar - grouped by topic
  getPageTree() {
    const topics = this.getCategorizedPages();

    return {
      name: 'LPs',
      children: [
        {
          type: 'page' as const,
          name: 'Overview',
          url: '/docs',
        },
        ...topics.map(topic => ({
          type: 'folder' as const,
          name: topic.name,
          description: topic.description,
          children: topic.lps.slice(0, 20).map(lp => ({
            type: 'page' as const,
            name: `LP-${lp.data.frontmatter.lp}: ${lp.data.title.substring(0, 40)}${lp.data.title.length > 40 ? '...' : ''}`,
            url: `/docs/${lp.slug.join('/')}`,
          })),
        })),
      ],
    };
  },

  // Search across all LPs
  search(query: string): LPPage[] {
    const q = query.toLowerCase();
    return this.getAllPages().filter(page => {
      const title = page.data.title.toLowerCase();
      const description = (page.data.description || '').toLowerCase();
      const content = page.data.content.toLowerCase();
      const tags = (page.data.frontmatter.tags || []).join(' ').toLowerCase();

      return title.includes(q) || description.includes(q) || content.includes(q) || tags.includes(q);
    });
  },

  // Get topic definitions for UI
  getTopicDefinitions(): CategoryMeta[] {
    return LP_TOPICS;
  },
};
