import { useState, useEffect, useRef } from "react";

interface MasonryGridProps {
  children: React.ReactNode[];
  columns?: { default: number; sm?: number; md?: number; lg?: number; xl?: number };
  gap?: number;
  className?: string;
}

export function MasonryGrid({ 
  children, 
  columns = { default: 1, sm: 2, md: 3, lg: 4 },
  gap = 16,
  className = ""
}: MasonryGridProps) {
  const [columnCount, setColumnCount] = useState(columns.default);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateColumns = () => {
      if (typeof window === 'undefined') return;
      const width = window.innerWidth;
      if (columns.xl && width >= 1280) {
        setColumnCount(columns.xl);
      } else if (columns.lg && width >= 1024) {
        setColumnCount(columns.lg);
      } else if (columns.md && width >= 768) {
        setColumnCount(columns.md);
      } else if (columns.sm && width >= 640) {
        setColumnCount(columns.sm);
      } else {
        setColumnCount(columns.default);
      }
    };

    updateColumns();
    window.addEventListener("resize", updateColumns);
    return () => window.removeEventListener("resize", updateColumns);
  }, [columns]);

  // Distribute children across columns
  const columnsArray = Array.from({ length: columnCount }, () => [] as React.ReactNode[]);
  
  children.forEach((child, index) => {
    columnsArray[index % columnCount].push(child);
  });

  return (
    <div 
      ref={containerRef}
      className={`flex ${className}`}
      style={{ gap: `${gap}px` }}
      data-testid="masonry-grid"
    >
      {columnsArray.map((column, columnIndex) => (
        <div
          key={columnIndex}
          className="flex-1 flex flex-col"
          style={{ gap: `${gap}px` }}
          data-testid={`masonry-column-${columnIndex}`}
        >
          {column}
        </div>
      ))}
    </div>
  );
}
