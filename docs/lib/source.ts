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

export interface LPCategory {
  name: string;
  description: string;
  range?: [number, number];
  lps: LPPage[];
}

// LP number ranges for categories
const LP_CATEGORIES: { name: string; description: string; range: [number, number] }[] = [
  { name: 'Core Architecture', description: 'Network fundamentals', range: [0, 99] },
  { name: 'Consensus', description: 'Consensus protocols', range: [100, 199] },
  { name: 'Cryptography', description: 'Crypto standards', range: [200, 299] },
  { name: 'Token Standards', description: 'LRC token specs', range: [300, 399] },
  { name: 'DeFi', description: 'DeFi protocols', range: [400, 499] },
  { name: 'Governance', description: 'Governance proposals', range: [500, 599] },
  { name: 'Network Upgrades', description: 'Protocol upgrades', range: [600, 699] },
  { name: 'Research', description: 'Research papers', range: [700, 999] },
  { name: 'P-Chain', description: 'Platform chain', range: [1000, 1999] },
  { name: 'C-Chain', description: 'Contract chain', range: [2000, 2999] },
  { name: 'X-Chain', description: 'Exchange chain', range: [3000, 3999] },
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
      lps: allPages.filter(page => {
        const lpNum = getLPNumber(page);
        return lpNum >= cat.range[0] && lpNum <= cat.range[1];
      }),
    })).filter(cat => cat.lps.length > 0);
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
  getPageTree(): any {
    const categories = this.getCategorizedPages();

    return {
      name: 'LPs',
      children: [
        {
          type: 'page',
          name: 'Overview',
          url: '/docs',
        },
        ...categories.map(cat => ({
          type: 'folder',
          name: cat.name,
          description: cat.description,
          children: cat.lps.slice(0, 20).map(lp => ({
            type: 'page',
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
