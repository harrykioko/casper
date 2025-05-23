
import { Link2, Plus } from "lucide-react";
import { CardTitle, Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Link {
  id: string;
  title: string;
  url: string;
}

interface ProjectLinksListProps {
  links: Link[];
}

export function ProjectLinksList({ links }: ProjectLinksListProps) {
  return (
    <Card className="relative rounded-2xl bg-white/70 dark:bg-zinc-900/60 backdrop-blur-sm ring-1 ring-black/5 dark:ring-white/10 hover:shadow-md/10 transition hover:translate-y-[-2px] group">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center">
          <Link2 className="mr-2 h-5 w-5" />
          Resources
          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition">
            <Button variant="ghost" size="sm" className="gap-1 text-xs">
              <Plus className="h-3.5 w-3.5" />
              Resource
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {links.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">No links yet</p>
        ) : (
          <ul className="space-y-2">
            {links.map(link => (
              <li key={link.id}>
                <a 
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-3 rounded-md hover:bg-accent/30 transition-colors text-sm group/link"
                >
                  <Link2 className="h-3.5 w-3.5 shrink-0" />
                  <span className="group-hover/link:underline">{link.title}</span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
