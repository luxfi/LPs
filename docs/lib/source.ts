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

// Topic definitions - tag-based categories that aggregate LPs by subject matter
// Topics match LPs via: tags, frontmatter category, or LP number range
// NOTE: contentMatch is disabled - too aggressive, matches unrelated LPs
const LP_TOPICS: CategoryMeta[] = [
  // === GOVERNANCE & DAO ===
  {
    slug: 'governance',
    name: 'Governance & DAO',
    shortDesc: 'On-chain governance and DAOs',
    description: 'Decentralized governance mechanisms, DAO frameworks, voting systems, treasury management, and proposal processes. Enables community-driven protocol evolution.',
    range: [2520, 2599], // DAO platform specs
    tags: ['governance', 'dao', 'voting', 'proposal', 'treasury', 'delegation', 'accountability'],
    // No contentMatch - too broad
    icon: 'vote',
    color: 'indigo',
    learnMore: 'Governance LPs define how the community makes decisions. Includes DAO contracts, voting mechanisms, treasury management, and delegation systems.',
    keyTopics: ['DAO frameworks', 'Voting mechanisms', 'Treasury management', 'Delegation', 'Proposal systems'],
  },
  // === CORE ARCHITECTURE ===
  {
    slug: 'core',
    name: 'Core Architecture',
    shortDesc: 'Network fundamentals',
    description: 'Foundational specifications defining how the Lux Network operates. Covers network topology, node requirements, data structures, and the multi-chain architecture.',
    range: [0, 99],
    tags: ['core', 'architecture', 'network', 'topology', 'nodes'],
    icon: 'layers',
    color: 'blue',
    learnMore: 'Core architecture LPs define the backbone of Lux Network, including how nodes communicate, validate transactions, and maintain consensus.',
    keyTopics: ['Network topology', 'Node specifications', 'Data structures', 'Multi-chain design'],
  },
  // === CONSENSUS ===
  {
    slug: 'consensus',
    name: 'Consensus',
    shortDesc: 'Consensus protocols',
    description: 'Consensus mechanisms that secure the network. Includes Snowman for linear chains, DAG-based consensus, and sub-second finality protocols.',
    range: [100, 199],
    tags: ['consensus', 'snowman', 'avalanche', 'finality', 'bft', 'quasar', 'photon'],
    icon: 'consensus',
    color: 'purple',
    learnMore: 'Consensus protocols determine how nodes agree on the state of the blockchain. Lux achieves finality in under 2 seconds.',
    keyTopics: ['Snowman consensus', 'Quasar protocol', 'Byzantine fault tolerance', 'Finality guarantees'],
  },
  // === CRYPTOGRAPHY ===
  {
    slug: 'cryptography',
    name: 'Cryptography',
    shortDesc: 'Cryptographic standards',
    description: 'Cryptographic primitives and post-quantum security. Includes digital signatures, key encapsulation, hash functions, and zero-knowledge proofs.',
    range: [200, 299],
    tags: ['crypto', 'cryptography', 'signature', 'encryption', 'quantum', 'ml-kem', 'ml-dsa', 'zk', 'zkp'],
    icon: 'lock',
    color: 'emerald',
    learnMore: 'Cryptography secures transactions and protects assets. Lux pioneers post-quantum cryptography for future-proof security.',
    keyTopics: ['Digital signatures', 'Post-quantum crypto', 'ML-KEM/ML-DSA', 'Zero-knowledge proofs'],
  },
  // === TOKEN STANDARDS ===
  {
    slug: 'tokens',
    name: 'Token Standards',
    shortDesc: 'LRC token specifications',
    description: 'Standards for fungible and non-fungible tokens. LRC-20, LRC-721, LRC-1155 maintain ERC compatibility with Lux optimizations.',
    range: [300, 399],
    tags: ['token', 'lrc', 'erc', 'nft', 'fungible', 'lrc-20', 'lrc-721', 'lrc-1155'],
    icon: 'token',
    color: 'amber',
    learnMore: 'Token standards define how digital assets are created, transferred, and managed. ERC-compatible for seamless migration.',
    keyTopics: ['LRC-20 fungible', 'LRC-721 NFTs', 'LRC-1155 multi-token', 'Token metadata'],
  },
  // === DEFI ===
  {
    slug: 'defi',
    name: 'DeFi',
    shortDesc: 'Decentralized finance',
    description: 'Protocols for decentralized finance including AMMs, lending, yield optimization, staking, and derivatives.',
    range: [400, 499],
    tags: ['defi', 'amm', 'lending', 'yield', 'staking', 'swap', 'liquidity', 'dex'],
    // No contentMatch - too broad
    icon: 'chart',
    color: 'green',
    learnMore: 'DeFi eliminates intermediaries from financial services. Enables trustless trading, lending, and yield generation.',
    keyTopics: ['AMM protocols', 'Lending markets', 'Yield aggregators', 'Liquid staking', 'DEX'],
  },
  // === NETWORK UPGRADES ===
  {
    slug: 'upgrades',
    name: 'Network Upgrades',
    shortDesc: 'Protocol upgrades',
    description: 'Specifications for network upgrades, hard forks, and feature activations. Coordinates changes across validators.',
    range: [600, 699],
    tags: ['upgrade', 'fork', 'activation', 'migration'],
    icon: 'upgrade',
    color: 'orange',
    learnMore: 'Network upgrades introduce new features. Coordinated activation ensures all nodes upgrade together.',
    keyTopics: ['Hard fork specs', 'Feature activation', 'Validator coordination', 'Migration guides'],
  },
  // === RESEARCH ===
  {
    slug: 'research',
    name: 'Research',
    shortDesc: 'Research & innovation',
    description: 'Cutting-edge research including quantum-resistant cryptography, novel consensus, scalability solutions, and formal verification.',
    range: [700, 799],
    tags: ['research', 'paper', 'academic', 'innovation', 'theory'],
    icon: 'research',
    color: 'pink',
    learnMore: 'Research LPs push the boundaries of blockchain technology. Includes academic papers and experimental protocols.',
    keyTopics: ['Quantum security', 'Scalability research', 'Formal verification', 'Novel protocols'],
  },
  // === SUSTAINABILITY & ESG ===
  {
    slug: 'sustainability',
    name: 'Sustainability & ESG',
    shortDesc: 'Environmental and social impact',
    description: 'Environmental sustainability, social responsibility, and governance transparency. Carbon-neutral operations and ESG compliance.',
    range: [800, 899],
    tags: ['sustainability', 'esg', 'carbon', 'green', 'environment', 'climate', 'energy'],
    icon: 'leaf',
    color: 'green',
    learnMore: 'Sustainability LPs ensure Lux operates as a force for good. Covers energy efficiency and ESG reporting.',
    keyTopics: ['Carbon neutrality', 'Energy efficiency', 'ESG reporting', 'Social impact'],
  },
  // === IMPACT & PUBLIC GOODS ===
  {
    slug: 'impact',
    name: 'Impact & Public Goods',
    shortDesc: 'Public goods and social benefit',
    description: 'Standards for funding public goods, charitable giving, and measuring positive social impact.',
    range: [900, 999],
    tags: ['impact', 'public-goods', 'charity', 'social', 'benefit', 'grants'],
    icon: 'heart',
    color: 'rose',
    learnMore: 'Impact LPs define how Lux contributes to public goods and social benefit.',
    keyTopics: ['Public goods funding', 'Charitable giving', 'Impact measurement', 'Community grants'],
  },
  // === PLATFORM CHAIN ===
  {
    slug: 'platform',
    name: 'Platform Chain (P-Chain)',
    shortDesc: 'Platform layer specifications',
    description: 'P-Chain specifications including validator management, staking, delegation, and subnet creation.',
    range: [1000, 1999],
    tags: ['p-chain', 'platform', 'validator', 'staking', 'delegation', 'subnet'],
    icon: 'platform',
    color: 'violet',
    learnMore: 'P-Chain is the metadata blockchain that coordinates validators and subnets across the network.',
    keyTopics: ['Validator management', 'Staking mechanics', 'Subnet creation', 'Delegation'],
  },
  // === EVM & SMART CONTRACTS ===
  {
    slug: 'evm',
    name: 'EVM & Smart Contracts',
    shortDesc: 'C-Chain and EVM specs',
    description: 'C-Chain EVM specifications, precompiled contracts, gas optimization, and smart contract standards.',
    range: [2000, 2999],
    tags: ['evm', 'c-chain', 'precompile', 'solidity', 'smart-contract', 'gas'],
    icon: 'code',
    color: 'cyan',
    learnMore: 'C-Chain runs the EVM with enhanced performance. Precompiles add native functionality.',
    keyTopics: ['EVM precompiles', 'Gas optimization', 'Contract standards', 'C-Chain specs'],
  },
  // === PROTOCOL EXTENSIONS ===
  {
    slug: 'protocol',
    name: 'Protocol Extensions',
    shortDesc: 'Protocol-level extensions',
    description: 'Extensions to core protocols including messaging, state management, and cross-VM communication.',
    range: [3000, 3999],
    tags: ['protocol', 'extension', 'state', 'messaging'],
    icon: 'extension',
    color: 'teal',
    learnMore: 'Protocol extensions add new capabilities to the base layer.',
    keyTopics: ['State management', 'Protocol messaging', 'Cross-VM calls', 'Extensions'],
  },
  // === VIRTUAL MACHINES & SUBNETS ===
  {
    slug: 'vms',
    name: 'Virtual Machines & Subnets',
    shortDesc: 'Custom VMs and subnets',
    description: 'Custom virtual machines, subnet configurations, and specialized execution environments.',
    range: [4000, 4999],
    tags: ['vm', 'subnet', 'chain', 'execution'],
    icon: 'vm',
    color: 'fuchsia',
    learnMore: 'Custom VMs allow specialized blockchains. Subnets provide isolated execution environments.',
    keyTopics: ['Custom VMs', 'Subnet configs', 'Execution environments', 'Chain creation'],
  },
  // === INTEROPERABILITY ===
  {
    slug: 'interop',
    name: 'Interoperability',
    shortDesc: 'Cross-chain communication',
    description: 'Cross-chain communication, asset transfers, and multi-chain coordination. ICM and warp messaging.',
    range: [5000, 5999],
    tags: ['interop', 'cross-chain', 'icm', 'warp', 'messaging'],
    icon: 'link',
    color: 'sky',
    learnMore: 'Interoperability LPs define how assets and messages flow between chains.',
    keyTopics: ['ICM messaging', 'Warp protocol', 'Asset transfers', 'Multi-chain'],
  },
  // === BRIDGE PROTOCOLS ===
  {
    slug: 'bridge',
    name: 'Bridge Protocols',
    shortDesc: 'Cross-chain bridges',
    description: 'Bridge implementations connecting Lux to Ethereum, Bitcoin, Solana, and other networks.',
    range: [6000, 6999],
    tags: ['bridge', 'ethereum', 'bitcoin', 'relayer', 'custody'],
    icon: 'bridge',
    color: 'lime',
    learnMore: 'Bridge protocols enable trustless asset transfers between Lux and external blockchains.',
    keyTopics: ['Ethereum bridge', 'Bitcoin integration', 'Light clients', 'Relayers'],
  },
  // === THRESHOLD CRYPTOGRAPHY ===
  {
    slug: 'threshold',
    name: 'Threshold Cryptography (T-Chain)',
    shortDesc: 'Threshold signatures and MPC',
    description: 'Threshold signature schemes, T-Chain specifications, and multi-party computation for secure key management.',
    range: [7000, 7999],
    tags: ['threshold', 'mpc', 't-chain', 'frost', 'tss', 'custody', 'key-management'],
    icon: 'key',
    color: 'yellow',
    learnMore: 'T-Chain provides threshold cryptography services. Multiple parties cooperatively sign without any single party holding the key.',
    keyTopics: ['Threshold signatures', 'MPC protocols', 'FROST', 'Distributed custody'],
  },
  // === ADVANCED PROTOCOLS ===
  {
    slug: 'advanced',
    name: 'Advanced Protocols',
    shortDesc: 'Advanced specifications',
    description: 'Advanced protocols including zero-knowledge proofs, privacy features, MEV protection, and cutting-edge cryptography.',
    range: [8000, 8999],
    tags: ['zk', 'privacy', 'mev', 'rollup', 'l2', 'zkvm'],
    icon: 'advanced',
    color: 'slate',
    learnMore: 'Advanced LPs push blockchain technology boundaries. Includes privacy-preserving computations and MEV mitigation.',
    keyTopics: ['Zero-knowledge', 'Privacy features', 'MEV protection', 'L2/Rollups'],
  },
  // === DEX & TRADING ===
  {
    slug: 'dex',
    name: 'DEX & Trading',
    shortDesc: 'Decentralized exchanges',
    description: 'Decentralized exchange protocols, trading engines, order books, perpetuals, and high-frequency trading infrastructure.',
    range: [9000, 9099],
    tags: ['dex', 'trading', 'orderbook', 'perpetuals', 'hft', 'exchange'],
    icon: 'chart',
    color: 'emerald',
    learnMore: 'DEX LPs define decentralized trading infrastructure. Includes order matching, perpetuals, and HFT venues.',
    keyTopics: ['Order matching', 'Perpetuals', 'HFT infrastructure', 'Liquidity'],
  },
  // === EXTENDED SPECIFICATIONS ===
  {
    slug: 'extended',
    name: 'Extended Specifications',
    shortDesc: 'Extended and experimental',
    description: 'Extended specifications for experimental features, future upgrades, and specialized use cases.',
    range: [9100, 99999],
    tags: ['experimental', 'future', 'incubation'],
    icon: 'flask',
    color: 'neutral',
    learnMore: 'Extended LPs cover experimental and future-facing specifications.',
    keyTopics: ['Experimental', 'Future upgrades', 'Specialized use cases', 'Incubation'],
  },
  // === SDK & DEV TOOLS ===
  {
    slug: 'dev-tools',
    name: 'SDK & Developer Tools',
    shortDesc: 'Development tools and SDKs',
    description: 'SDKs, CLIs, testing frameworks, and developer tooling for building on Lux Network.',
    tags: ['sdk', 'dev-tools', 'cli', 'testing', 'tooling', 'api'],
    icon: 'code',
    color: 'blue',
    learnMore: 'Developer tools make building on Lux accessible. Includes SDKs, CLIs, and testing frameworks.',
    keyTopics: ['SDKs', 'CLI tools', 'Testing frameworks', 'APIs'],
  },
  // === WALLET ===
  {
    slug: 'wallet',
    name: 'Wallet Standards',
    shortDesc: 'Wallet specifications',
    description: 'Wallet standards including HD wallets, multi-signature schemes, hardware wallet integration, and account abstraction.',
    tags: ['wallet', 'multisig', 'hd-wallet', 'account-abstraction'],
    icon: 'wallet',
    color: 'purple',
    learnMore: 'Wallet standards define how users interact with their assets securely.',
    keyTopics: ['HD wallets', 'Multi-signature', 'Hardware wallets', 'Account abstraction'],
  },
  // === SECURITY ===
  {
    slug: 'security',
    name: 'Security',
    shortDesc: 'Security standards',
    description: 'Security auditing frameworks, vulnerability disclosure, bug bounties, and security best practices.',
    tags: ['security', 'audit', 'vulnerability', 'bug-bounty'],
    icon: 'shield',
    color: 'red',
    learnMore: 'Security LPs ensure the network and applications are safe. Includes audit frameworks and disclosure processes.',
    keyTopics: ['Security audits', 'Vulnerability disclosure', 'Bug bounties', 'Best practices'],
  },
  // === IDENTITY ===
  {
    slug: 'identity',
    name: 'Identity & DIDs',
    shortDesc: 'Decentralized identity',
    description: 'Decentralized identity standards, DIDs, verifiable credentials, and identity management.',
    tags: ['identity', 'did', 'credential', 'kyc', 'ssi'],
    icon: 'user',
    color: 'indigo',
    learnMore: 'Identity LPs enable self-sovereign identity and verifiable credentials on Lux.',
    keyTopics: ['DIDs', 'Verifiable credentials', 'Identity management', 'SSI'],
  },
  // === INTERFACE ===
  {
    slug: 'interface',
    name: 'Interface & APIs',
    shortDesc: 'APIs, SDKs, and tools',
    description: 'Developer interfaces including APIs, SDKs, CLI tools, testing frameworks, and application integrations. Defines how developers interact with the network.',
    tags: ['interface', 'api', 'sdk', 'cli', 'rpc', 'graphql'],
    icon: 'code',
    color: 'sky',
    learnMore: 'Interface LPs define developer-facing APIs, SDKs, command-line tools, and integration standards.',
    keyTopics: ['RPC APIs', 'SDKs', 'CLI tools', 'Testing frameworks', 'GraphQL'],
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

    const slug = filename.replace(/\.mdx?$/, '').split('/');

    // Extract LP number from filename or frontmatter
    const lpMatch = filename.match(/lp-(\d+)/);
    const lpNumber = data.lp || (lpMatch ? parseInt(lpMatch[1], 10) : null);

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

// Check if an LP matches a topic via tags or number range
// NOTE: contentMatch is disabled - too aggressive and matches unrelated LPs
function lpMatchesTopic(page: LPPage, topic: CategoryMeta): boolean {
  const lpNum = getLPNumber(page);
  const lpTags = (page.data.frontmatter.tags || []).map((t: string) => t.toLowerCase());
  const lpCategory = (page.data.frontmatter.category || '').toLowerCase();

  // Check number range
  if (topic.range && lpNum >= topic.range[0] && lpNum <= topic.range[1]) {
    return true;
  }

  // Check tags overlap
  if (topic.tags) {
    const topicTags = topic.tags.map(t => t.toLowerCase());
    if (lpTags.some(t => topicTags.includes(t))) {
      return true;
    }
  }

  // Check frontmatter category matches topic slug or name
  if (lpCategory === topic.slug || lpCategory === topic.name.toLowerCase()) {
    return true;
  }

  return false;
}

export const source = {
  getPage(slugParam?: string[]): LPPage | null {
    if (!slugParam || slugParam.length === 0) {
      return null;
    }

    const slug = slugParam;
    const filename = `${slug.join('/')}.md`;
    const mdxFilename = `${slug.join('/')}.mdx`;

    let page = readLPFile(filename);
    if (!page) {
      page = readLPFile(mdxFilename);
    }

    return page;
  },

  generateParams(): { slug: string[] }[] {
    const files = getAllLPFiles();
    return files.map(file => ({
      slug: file.replace(/\.mdx?$/, '').split('/'),
    }));
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
  getCategorizedPages(): LPCategory[] {
    const allPages = this.getAllPages();

    return LP_TOPICS.map(topic => ({
      ...topic,
      description: topic.shortDesc,
      lps: allPages.filter(page => lpMatchesTopic(page, topic)),
    })).filter(cat => cat.lps.length > 0);
  },

  // Get all topics including empty ones
  getAllTopics(): LPCategory[] {
    const allPages = this.getAllPages();

    return LP_TOPICS.map(topic => ({
      ...topic,
      description: topic.shortDesc,
      lps: allPages.filter(page => lpMatchesTopic(page, topic)),
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
  getCategoryBySlug(slug: string): LPCategory | undefined {
    const allPages = this.getAllPages();
    const topic = LP_TOPICS.find(t => t.slug === slug);
    if (!topic) return undefined;

    return {
      ...topic,
      description: topic.shortDesc,
      lps: allPages.filter(page => lpMatchesTopic(page, topic)),
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

    // Count by topic
    LP_TOPICS.forEach(topic => {
      byTopic[topic.slug] = pages.filter(p => lpMatchesTopic(p, topic)).length;
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
