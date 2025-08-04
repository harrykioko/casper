import { Badge } from "@/components/ui/badge";

interface ExamplePillsProps {
  onExampleClick: (example: string) => void;
}

const examples = [
  "Write marketing copy",
  "Analyze data trends",
  "Debug code issues",
  "Summarize content",
  "Create documentation",
  "Generate ideas"
];

export function ExamplePills({ onExampleClick }: ExamplePillsProps) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground text-center">
        Or try one of these examples:
      </p>
      <div className="flex flex-wrap gap-2 justify-center">
        {examples.map((example, index) => (
          <Badge
            key={index}
            variant="outline"
            className="cursor-pointer hover:bg-primary/10 hover:border-primary/30 transition-colors px-3 py-1 text-sm"
            onClick={() => onExampleClick(example)}
          >
            {example}
          </Badge>
        ))}
      </div>
    </div>
  );
}