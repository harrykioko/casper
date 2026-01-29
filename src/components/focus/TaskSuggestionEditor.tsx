import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Check, X } from "lucide-react";

interface TaskSuggestion {
  type: string;
  description: string;
  priority: string;
}

interface TaskSuggestionEditorProps {
  suggestions: TaskSuggestion[];
  onCreateTask: (task: { content: string; priority: string }) => void;
}

export function TaskSuggestionEditor({ suggestions, onCreateTask }: TaskSuggestionEditorProps) {
  const [editStates, setEditStates] = useState<Record<number, { title: string; priority: string } | null>>({});
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());

  if (suggestions.length === 0) return null;

  const handleEdit = (index: number, field: 'title' | 'priority', value: string) => {
    setEditStates(prev => ({
      ...prev,
      [index]: {
        title: prev[index]?.title ?? suggestions[index].description,
        priority: prev[index]?.priority ?? suggestions[index].priority,
        [field]: value,
      },
    }));
  };

  const handleCreate = (index: number) => {
    const state = editStates[index];
    const suggestion = suggestions[index];
    onCreateTask({
      content: state?.title || suggestion.description,
      priority: state?.priority || suggestion.priority || 'medium',
    });
    setDismissed(prev => new Set(prev).add(index));
  };

  const handleSkip = (index: number) => {
    setDismissed(prev => new Set(prev).add(index));
  };

  const visibleSuggestions = suggestions.filter((_, i) => !dismissed.has(i));

  if (visibleSuggestions.length === 0) {
    return (
      <p className="text-xs text-muted-foreground italic">All suggestions processed</p>
    );
  }

  return (
    <div className="space-y-3">
      {suggestions.map((suggestion, index) => {
        if (dismissed.has(index)) return null;

        const state = editStates[index];
        const title = state?.title ?? suggestion.description;
        const priority = state?.priority ?? suggestion.priority ?? 'medium';

        return (
          <div
            key={index}
            className="p-3 rounded-md border border-muted/40 bg-muted/10 space-y-2"
          >
            <Input
              value={title}
              onChange={(e) => handleEdit(index, 'title', e.target.value)}
              className="text-sm h-8"
              placeholder="Task title"
            />
            <div className="flex items-center gap-2">
              <Select
                value={priority}
                onValueChange={(v) => handleEdit(index, 'priority', v)}
              >
                <SelectTrigger className="w-28 h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex-1" />
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-xs text-muted-foreground"
                onClick={() => handleSkip(index)}
              >
                <X className="h-3 w-3 mr-1" />
                Skip
              </Button>
              <Button
                size="sm"
                className="h-7 px-3 text-xs"
                onClick={() => handleCreate(index)}
              >
                <Check className="h-3 w-3 mr-1" />
                Create
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
