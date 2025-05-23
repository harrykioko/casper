
import { useState } from "react";
import { Check, Sparkles } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { motion } from "framer-motion";
import { toast } from "sonner";

export interface Nonnegotiable {
  id: string;
  label: string;
  streak?: number;
}

interface NonnegotiablesProps {
  items: Nonnegotiable[];
}

export function Nonnegotiables({ items }: NonnegotiablesProps) {
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  const handleToggleItem = (id: string) => {
    const newState = !checkedItems[id];
    
    setCheckedItems(prev => ({
      ...prev,
      [id]: newState
    }));

    if (newState) {
      // Show toast when item is checked
      toast.success("Good job!", {
        description: "Nonnegotiable completed",
        icon: <Sparkles className="h-4 w-4" />,
      });
    }
  };

  return (
    <div className="bg-white/5 backdrop-blur rounded-lg px-4 py-3 shadow-sm space-y-2">
      <h2 className="text-xs uppercase tracking-wide text-white/60 pb-2 border-b border-white/10">
        Nonnegotiables
      </h2>
      
      {items.length === 0 ? (
        <div className="text-center py-2 text-zinc-500 dark:text-white/60 text-sm">
          No nonnegotiables set
        </div>
      ) : (
        <div className="space-y-2.5 pt-1">
          {items.map((item) => (
            <motion.div
              key={item.id}
              className="flex items-center space-x-2"
              whileHover={{ x: 2 }}
              animate={checkedItems[item.id] ? { opacity: 0.7 } : { opacity: 1 }}
            >
              <Checkbox 
                id={`nonnegotiable-${item.id}`}
                checked={checkedItems[item.id] || false}
                onCheckedChange={() => handleToggleItem(item.id)}
                className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
              />
              <label
                htmlFor={`nonnegotiable-${item.id}`}
                className={`text-sm flex items-center cursor-pointer ${
                  checkedItems[item.id] ? "line-through text-white/60" : "text-white/90"
                }`}
              >
                {item.label}
                {item.streak !== undefined && (
                  <span className="text-white/40 text-xs ml-1">· {item.streak}</span>
                )}
              </label>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
