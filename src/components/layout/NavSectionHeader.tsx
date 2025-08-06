interface NavSectionHeaderProps {
  title: string;
  expanded: boolean;
}

export function NavSectionHeader({ title, expanded }: NavSectionHeaderProps) {
  if (!expanded) return null;
  
  return (
    <div className="px-4 py-2 mb-2">
      <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        {title}
      </h3>
    </div>
  );
}