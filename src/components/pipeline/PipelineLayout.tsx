import { ReactNode } from 'react';

interface PipelineLayoutProps {
  board: ReactNode;
  sidebar: ReactNode;
}

export function PipelineLayout({ board, sidebar }: PipelineLayoutProps) {
  return (
    <div className="grid lg:grid-cols-[4fr_1fr] gap-8 items-start">
      {/* Left Column (80%) - Board Content */}
      <section className="flex flex-col space-y-6 min-w-0">
        {board}
      </section>
      
      {/* Right Column (20%) - Sticky Sidebar */}
      <aside className="hidden lg:flex flex-col sticky top-24 space-y-6 max-w-xs w-full">
        {sidebar}
      </aside>
    </div>
  );
}