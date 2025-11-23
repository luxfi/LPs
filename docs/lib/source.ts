import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const LPS_DIR = path.join(process.cwd(), '../LPs');

export interface LPMetadata {
  title?: string;
  description?: string;
  lp?: number;
  status?: string;
  type?: string;
  category?: string;
  author?: string;
  created?: string;
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

function getAllLPFiles(): string[] {
  try {
    const files = fs.readdirSync(LPS_DIR);
    return files.filter(file => file.endsWith('.md') || file.endsWith('.mdx'));
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

    return {
      slug,
      data: {
        title: data.title || filename.replace(/\.mdx?$/, ''),
        description: data.description,
        content,
        frontmatter: data as LPMetadata,
      },
    };
  } catch (error) {
    console.error(`Error reading LP file ${filename}:`, error);
    return null;
  }
}

export const source = {
  getPage(slugParam?: string[]): LPPage | null {
    const slug = slugParam || ['index'];
    const filename = `${slug.join('/')}.md`;
    const mdxFilename = `${slug.join('/')}.mdx`;

    // Try .md first, then .mdx
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
      .filter((page): page is LPPage => page !== null);
  },
};
