export interface TOCItem {
  id: string;
  text: string;
  level: number;
}

// Extract headings from markdown content (server-side utility)
export function extractHeadings(content: string): TOCItem[] {
  const headings: TOCItem[] = [];
  const lines = content.split('\n');

  for (const line of lines) {
    // Match markdown headings (## Heading, ### Heading, etc.)
    const match = line.match(/^(#{2,4})\s+(.+)$/);
    if (match) {
      const level = match[1].length;
      const text = match[2].trim();
      // Create a slug from the heading text
      const id = text
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');

      headings.push({ id, text, level });
    }
  }

  return headings;
}
