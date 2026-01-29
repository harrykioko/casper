import { ReactNode } from 'react';

interface DealRoomLayoutProps {
  hero: ReactNode;
  tabs: ReactNode;
  content: ReactNode;
  rail: ReactNode;
}

export function DealRoomLayout({ hero, tabs, content, rail }: DealRoomLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Hero */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border">
        {hero}
      </div>

      {/* 3-Column Body */}
      <div className="max-w-[1800px] mx-auto px-6 py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Left: Tab Navigation */}
          <div className="col-span-2">
            <div className="sticky top-[120px]">
              {tabs}
            </div>
          </div>

          {/* Middle: Main Content */}
          <div className="col-span-7 min-h-[calc(100vh-180px)]">
            {content}
          </div>

          {/* Right: Context Rail */}
          <div className="col-span-3">
            <div className="sticky top-[120px] space-y-4">
              {rail}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
