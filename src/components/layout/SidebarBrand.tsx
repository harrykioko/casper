
interface SidebarBrandProps {
  expanded: boolean;
}

export function SidebarBrand({ expanded }: SidebarBrandProps) {
  return (
    <div className="flex flex-col items-center gap-1 mb-8">
      {expanded ? (
        <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#FF6A79] to-[#415AFF]">
          Casper
        </div>
      ) : (
        <div className="h-8 w-8 rounded-full bg-gradient-to-r from-[#FF6A79] to-[#415AFF] flex items-center justify-center text-white font-bold">
          C
        </div>
      )}
    </div>
  );
}
