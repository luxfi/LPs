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
  category?: 'Core' | 'Networking' | 'Interface' | 'LRC' | 'Bridge';
  author?: string;
  created?: string;
  updated?: string;
  requires?: string | number[];
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

// LP category metadata with educational content
export interface CategoryMeta {
  slug: string;
  name: string;
  shortDesc: string;
  description: string;
  range: [number, number];
  icon: string;
  color: string;
  learnMore: string;
  keyTopics: string[];
}

// LP number ranges for categories with rich educational content
const LP_CATEGORIES: CategoryMeta[] = [
  {
    slug: 'core',
    name: 'Core Architecture',
    shortDesc: 'Network fundamentals',
    description: 'Foundational specifications defining how the Lux Network operates. Covers network topology, node requirements, data structures, and the multi-chain architecture that enables high throughput and low latency.',
    range: [0, 99],
    icon: 'layers',
    color: 'blue',
    learnMore: 'Core architecture LPs define the backbone of Lux Network, including how nodes communicate, validate transactions, and maintain consensus across multiple chains.',
    keyTopics: ['Network topology', 'Node specifications', 'Data structures', 'Multi-chain design'],
  },
  {
    slug: 'consensus',
    name: 'Consensus',
    shortDesc: 'Consensus protocols',
    description: 'Consensus mechanisms that secure the network. Lux uses a novel family of consensus protocols including Snowman for linear chains and Avalanche for DAG-based consensus, enabling sub-second finality.',
    range: [100, 199],
    icon: 'consensus',
    color: 'purple',
    learnMore: 'Consensus protocols determine how nodes agree on the state of the blockchain. Lux\'s probabilistic consensus achieves finality in under 2 seconds with mathematical guarantees.',
    keyTopics: ['Snowman consensus', 'Avalanche protocol', 'Byzantine fault tolerance', 'Finality guarantees'],
  },
  {
    slug: 'cryptography',
    name: 'Cryptography',
    shortDesc: 'Cryptographic standards',
    description: 'Cryptographic primitives and post-quantum security standards. Includes digital signatures (ECDSA, Ed25519, ML-DSA), hash functions, key encapsulation (ML-KEM), and zero-knowledge proofs.',
    range: [200, 299],
    icon: 'lock',
    color: 'emerald',
    learnMore: 'Cryptography secures transactions and protects user assets. Lux is pioneering post-quantum cryptography to future-proof against quantum computer attacks.',
    keyTopics: ['Digital signatures', 'Post-quantum crypto', 'ML-KEM/ML-DSA', 'Zero-knowledge proofs'],
  },
  {
    slug: 'tokens',
    name: 'Token Standards',
    shortDesc: 'LRC token specifications',
    description: 'Standards for fungible and non-fungible tokens on Lux. LRC-20 (fungible), LRC-721 (NFTs), and LRC-1155 (multi-token) maintain ERC compatibility while adding Lux-specific optimizations.',
    range: [300, 399],
    icon: 'token',
    color: 'amber',
    learnMore: 'Token standards define how digital assets are created, transferred, and managed. ERC-compatible standards ensure seamless migration from Ethereum.',
    keyTopics: ['LRC-20 fungible', 'LRC-721 NFTs', 'LRC-1155 multi-token', 'Token metadata'],
  },
  {
    slug: 'defi',
    name: 'DeFi',
    shortDesc: 'Decentralized finance',
    description: 'Protocols for decentralized finance including automated market makers (AMMs), lending/borrowing, yield optimization, and derivatives. Building blocks for permissionless financial infrastructure.',
    range: [400, 499],
    icon: 'chart',
    color: 'green',
    learnMore: 'DeFi eliminates intermediaries from financial services. These protocols enable trustless trading, lending, and yield generation directly on-chain.',
    keyTopics: ['AMM protocols', 'Lending markets', 'Yield aggregators', 'Liquid staking'],
  },
  {
    slug: 'governance',
    name: 'Governance',
    shortDesc: 'On-chain governance',
    description: 'Decentralized governance mechanisms for protocol upgrades, parameter changes, and treasury management. Enables token holders to propose and vote on network changes.',
    range: [500, 599],
    icon: 'vote',
    color: 'indigo',
    learnMore: 'Governance LPs define how the community makes decisions. On-chain voting ensures transparent, verifiable, and democratic protocol evolution.',
    keyTopics: ['Proposal system', 'Voting mechanisms', 'Treasury management', 'Delegation'],
  },
  {
    slug: 'upgrades',
    name: 'Network Upgrades',
    shortDesc: 'Protocol upgrades',
    description: 'Specifications for network upgrades, hard forks, and feature activations. Coordinates changes across validators and ensures smooth transitions without disrupting operations.',
    range: [600, 699],
    icon: 'upgrade',
    color: 'orange',
    learnMore: 'Network upgrades introduce new features and improvements. Coordinated activation ensures all nodes upgrade together, maintaining consensus.',
    keyTopics: ['Hard fork specs', 'Feature activation', 'Validator coordination', 'Migration guides'],
  },
  {
    slug: 'research',
    name: 'Research',
    shortDesc: 'Research & innovation',
    description: 'Cutting-edge research including quantum-resistant cryptography, novel consensus mechanisms, scalability solutions, and theoretical foundations for blockchain security.',
    range: [700, 799],
    icon: 'research',
    color: 'pink',
    learnMore: 'Research LPs push the boundaries of blockchain technology. Includes academic papers, proofs of security, and experimental protocols.',
    keyTopics: ['Quantum security', 'Scalability research', 'Formal verification', 'Novel protocols'],
  },
  {
    slug: 'sustainability',
    name: 'Sustainability & ESG',
    shortDesc: 'Environmental and social impact',
    description: 'Proposals for environmental sustainability, social responsibility, and governance transparency. Lux Network is committed to carbon-neutral operations and positive environmental impact.',
    range: [800, 899],
    icon: 'leaf',
    color: 'green',
    learnMore: 'Sustainability LPs ensure Lux Network operates as a force for good. Covers energy efficiency, carbon offsetting, environmental reporting, and social impact metrics aligned with ESG principles.',
    keyTopics: ['Carbon neutrality', 'Energy efficiency', 'ESG reporting', 'Social impact'],
  },
  {
    slug: 'impact',
    name: 'Impact & Public Goods',
    shortDesc: 'Public goods and social benefit',
    description: 'Standards for funding public goods, charitable giving, and measuring positive social impact. Building blockchain infrastructure that serves humanity.',
    range: [900, 999],
    icon: 'heart',
    color: 'rose',
    learnMore: 'Impact LPs define how Lux Network contributes to public goods and social benefit. Includes treasury allocations for charitable causes, impact measurement frameworks, and partnerships with non-profits.',
    keyTopics: ['Public goods funding', 'Charitable giving', 'Impact measurement', 'Social benefit'],
  },
];

function getAllLPFiles(): string[] {
  try {
    const files = fs.readdirSync(LPS_DIR);
    return files
      .filter(file => file.endsWith('.md') || file.endsWith('.mdx'))
      .filter(file => file.startsWith('lp-') || file === 'index.mdx' || file === 'governance.md');
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

  getPagesByCategory(category: string): LPPage[] {
    return this.getAllPages().filter(
      page => page.data.frontmatter.category?.toLowerCase() === category.toLowerCase()
    );
  },

  getCategorizedPages(): LPCategory[] {
    const allPages = this.getAllPages();

    return LP_CATEGORIES.map(cat => ({
      ...cat,
      description: cat.shortDesc, // Keep backward compatibility
      lps: allPages.filter(page => {
        const lpNum = getLPNumber(page);
        return lpNum >= cat.range[0] && lpNum <= cat.range[1];
      }),
    })).filter(cat => cat.lps.length > 0);
  },

  // Get all categories including empty ones (for educational display)
  getAllCategories(): LPCategory[] {
    const allPages = this.getAllPages();

    return LP_CATEGORIES.map(cat => ({
      ...cat,
      description: cat.shortDesc,
      lps: allPages.filter(page => {
        const lpNum = getLPNumber(page);
        return lpNum >= cat.range[0] && lpNum <= cat.range[1];
      }),
    }));
  },

  // Get category metadata by name
  getCategoryByName(name: string): CategoryMeta | undefined {
    return LP_CATEGORIES.find(cat => cat.name.toLowerCase() === name.toLowerCase());
  },

  // Get category by slug
  getCategoryBySlug(slug: string): LPCategory | undefined {
    const allPages = this.getAllPages();
    const cat = LP_CATEGORIES.find(c => c.slug === slug);
    if (!cat) return undefined;

    return {
      ...cat,
      description: cat.shortDesc,
      lps: allPages.filter(page => {
        const lpNum = getLPNumber(page);
        return lpNum >= cat.range[0] && lpNum <= cat.range[1];
      }),
    };
  },

  // Get all category slugs for static params
  getAllCategorySlugs(): string[] {
    return LP_CATEGORIES.map(cat => cat.slug);
  },

  getStats(): { total: number; byStatus: Record<string, number>; byType: Record<string, number> } {
    const pages = this.getAllPages();
    const byStatus: Record<string, number> = {};
    const byType: Record<string, number> = {};

    pages.forEach(page => {
      const status = page.data.frontmatter.status || 'Unknown';
      const type = page.data.frontmatter.type || 'Unknown';
      byStatus[status] = (byStatus[status] || 0) + 1;
      byType[type] = (byType[type] || 0) + 1;
    });

    return { total: pages.length, byStatus, byType };
  },

  // Generate page tree for Fumadocs sidebar
  getPageTree() {
    const categories = this.getCategorizedPages();

    return {
      name: 'LPs',
      children: [
        {
          type: 'page' as const,
          name: 'Overview',
          url: '/docs',
        },
        ...categories.map(cat => ({
          type: 'folder' as const,
          name: cat.name,
          description: cat.description,
          children: cat.lps.slice(0, 20).map(lp => ({
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
};
