'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import type { TOCItem } from '@/lib/toc';

interface TOCProps {
  items: TOCItem[];
  className?: string;
}

export function TableOfContents({ items, className }: TOCProps) {
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: '-80px 0px -80% 0px' }
    );

    // Observe all heading elements
    items.forEach((item) => {
      const element = document.getElementById(item.id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [items]);

  if (items.length === 0) return null;

  return (
    <nav className={cn('text-sm', className)}>
      <div className="font-medium mb-4 text-foreground">On this page</div>
      <ul className="space-y-2">
        {items.map((item) => (
          <li
            key={item.id}
            style={{ paddingLeft: `${(item.level - 2) * 12}px` }}
          >
            <a
              href={`#${item.id}`}
              className={cn(
                'block py-1 text-muted-foreground hover:text-foreground transition-colors duration-200',
                'border-l-2 pl-3 -ml-px',
                activeId === item.id
                  ? 'border-foreground text-foreground font-medium'
                  : 'border-transparent'
              )}
              onClick={(e) => {
                e.preventDefault();
                const element = document.getElementById(item.id);
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth' });
                  setActiveId(item.id);
                }
              }}
            >
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
