import { ReactNode } from "react";

interface CommandStreamLayoutProps {
  filterPanel: ReactNode;
  actionStream: ReactNode;
  assistPanel: ReactNode;
}

export function CommandStreamLayout({ filterPanel, actionStream, assistPanel }: CommandStreamLayoutProps) {
  return (
    <div className="grid grid-cols-[260px_1fr_320px] gap-6 max-w-[1280px] mx-auto w-full">
      <aside className="pt-2">{filterPanel}</aside>
      <main className="min-w-0">{actionStream}</main>
      <aside className="pt-2">{assistPanel}</aside>
    </div>
  );
}
