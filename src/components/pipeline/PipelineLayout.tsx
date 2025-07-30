import { ReactNode } from 'react';

interface PipelineLayoutProps {
  board: ReactNode;
  sidebar: ReactNode;
}

export function PipelineLayout({ board, sidebar }: PipelineLayoutProps) {
  return (
    <div className="flex w-full h-full">
      {/* Left Column - Board Content */}
      <section className="flex-1 min-w-0">
        {board}
      </section>
      
      {/* Right Column - Sticky Sidebar */}
      <aside className="w-96 border-l border-white/10 bg-white/5 backdrop-blur-sm sticky top-0 h-screen overflow-y-auto p-6 space-y-6">
        {sidebar}
      </aside>
    </div>
  );
}