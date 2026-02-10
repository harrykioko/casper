
import { useTheme } from "@/hooks/use-theme";
import casperIcon from "/lovable-uploads/casper-icon.png";

interface SidebarBrandProps {
  expanded: boolean;
}

export function SidebarBrand({ expanded }: SidebarBrandProps) {
  const { theme } = useTheme();
  const invertClass = theme === "light" ? "invert" : "";

  return (
    <div className="flex flex-col items-center gap-1 mb-8">
      {expanded ? (
        <span className="text-lg font-medium tracking-wide text-foreground select-none" style={{ fontFamily: "'Inter', sans-serif" }}>
          casper
        </span>
      ) : (
        <img
          src={casperIcon}
          alt="Casper"
          className={`h-8 w-8 ${invertClass}`}
        />
      )}
    </div>
  );
}
