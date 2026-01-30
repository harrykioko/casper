import { ReactNode } from 'react';

interface PortfolioCompanyLayoutProps {
  hero: ReactNode;
  nav: ReactNode;
  content: ReactNode;
  rail: ReactNode;
}

export function PortfolioCompanyLayout({ hero, nav, content, rail }: PortfolioCompanyLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Hero */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border">
        {hero}
      </div>

      {/* 3-Column Body */}
      <div className="max-w-[1800px] mx-auto px-6 py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Left: Mode Navigation */}
          <div className="col-span-2">
            <div className="sticky top-[140px]">
              {nav}
            </div>
          </div>

          {/* Middle: Main Content */}
          <div className="col-span-7 min-h-[calc(100vh-200px)]">
            {content}
          </div>

          {/* Right: Context Rail */}
          <div className="col-span-3">
            <div className="sticky top-[140px] space-y-4">
              {rail}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
