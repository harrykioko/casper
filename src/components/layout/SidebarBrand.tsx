
import { useTheme } from "@/hooks/use-theme";
import casperIcon from "/lovable-uploads/casper-icon.png";
import casperWordmark from "/lovable-uploads/casper-wordmark.png";

interface SidebarBrandProps {
  expanded: boolean;
}

export function SidebarBrand({ expanded }: SidebarBrandProps) {
  const { theme } = useTheme();
  const invertClass = theme === "light" ? "invert" : "";

  return (
    <div className="flex flex-col items-center gap-1 mb-8">
      {expanded ? (
        <img
          src={casperWordmark}
          alt="Casper"
          className={`h-6 w-auto ${invertClass}`}
        />
      ) : (
        <img
          src={casperIcon}
          alt="Casper"
          className={`h-7 w-7 rounded-md ${invertClass}`}
        />
      )}
    </div>
  );
}
