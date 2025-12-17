// TOC item type compatible with @hanzo/ui/docs
export interface TOCItemType {
  title: string;
  url: string;
  depth: number;
}

// Legacy interface for our custom TOC component
export interface TOCItem {
  id: string;
  text: string;
  level: number;
}

// Extract headings from markdown content (server-side utility)
// Returns TOCItemType format for sidebar
export function extractHeadings(content: string): TOCItemType[] {
  const headings: TOCItemType[] = [];
  const lines = content.split('\n');

  for (const line of lines) {
    // Match markdown headings (## Heading, ### Heading, etc.)
    const match = line.match(/^(#{2,4})\s+(.+)$/);
    if (match) {
      const depth = match[1].length;
      const title = match[2].trim();
      // Create a slug from the heading text
      const id = title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');

      headings.push({ title, url: `#${id}`, depth });
    }
  }

  return headings;
}
