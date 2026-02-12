
import { useTheme } from "@/hooks/use-theme";
import casperIcon from "/lovable-uploads/casper-icon.png";

interface SidebarBrandProps {
  expanded: boolean;
}

export function SidebarBrand({ expanded }: SidebarBrandProps) {
  const { theme } = useTheme();
  const invertClass = theme === "light" ? "invert" : "";

  return (
    <div className="flex flex-col items-center mb-4">
      {expanded ? (
        <span className="text-2xl font-semibold tracking-wide text-foreground select-none" style={{ fontFamily: "'Inter', sans-serif" }}>
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
