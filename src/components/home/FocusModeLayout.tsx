import { ReactNode } from "react";

interface FocusModeLayoutProps {
  leftRail: ReactNode;
  center: ReactNode;
  rightRail: ReactNode;
}

export function FocusModeLayout({ leftRail, center, rightRail }: FocusModeLayoutProps) {
  return (
    <div className="grid grid-cols-[200px_1fr_240px] gap-10 max-w-[1280px] mx-auto w-full">
      {/* Left Rail */}
      <aside className="pt-2">{leftRail}</aside>

      {/* Center Column */}
      <main className="min-w-0">{center}</main>

      {/* Right Rail */}
      <aside className="pt-2">{rightRail}</aside>
    </div>
  );
}
