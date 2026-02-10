import { cn } from "@/lib/utils";

export type HomeMode = "focus" | "command" | "executive";

interface ModeToggleProps {
  mode: HomeMode;
  onChange: (mode: HomeMode) => void;
}

const modes: { value: HomeMode; label: string }[] = [
  { value: "focus", label: "Focus Mode" },
  { value: "command", label: "Command Stream" },
  { value: "executive", label: "Executive Overview" },
];

export function ModeToggle({ mode, onChange }: ModeToggleProps) {
  return (
    <div className="inline-flex items-center rounded-full border border-border/50 bg-muted/30 p-1 backdrop-blur-sm">
      {modes.map((m) => (
        <button
          key={m.value}
          onClick={() => onChange(m.value)}
          className={cn(
            "rounded-full px-4 py-1.5 text-xs font-medium transition-all duration-200",
            mode === m.value
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground/70"
          )}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}
