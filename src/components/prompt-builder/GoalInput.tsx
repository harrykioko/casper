import { Textarea } from "@/components/ui/textarea";

interface GoalInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function GoalInput({ value, onChange }: GoalInputProps) {
  return (
    <div className="space-y-2">
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="What do you want this prompt to help you do?"
        className="min-h-[120px] text-base resize-none glassmorphic focus:border-primary/50"
        rows={5}
      />
    </div>
  );
}