
import { useState } from "react";
import { Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

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
    <div className="bg-white/5 backdrop-blur-md rounded-lg p-4 shadow-sm ring-1 ring-white/10 space-y-3">
      <h2 className="text-xs uppercase tracking-wide text-white/60 pb-2 border-b border-white/10">
        Nonnegotiables
      </h2>
      
      {items.length === 0 ? (
        <div className="text-center py-2 text-zinc-500 dark:text-white/60 text-sm">
          No nonnegotiables set
        </div>
      ) : (
        <div className="space-y-3 pt-1">
          {items.map((item) => (
            <motion.div
              key={item.id}
              className="flex items-center justify-between"
              whileHover={{ x: 2 }}
              animate={checkedItems[item.id] ? { opacity: 0.7 } : { opacity: 1 }}
            >
              <div className="flex items-center space-x-2">
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className="relative"
                >
                  <input
                    type="checkbox"
                    id={`nonnegotiable-${item.id}`}
                    checked={checkedItems[item.id] || false}
                    onChange={() => handleToggleItem(item.id)}
                    className="peer appearance-none w-4 h-4 rounded-full border border-white/20 bg-white/5 transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background focus:ring-primary checked:border-none"
                  />
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 opacity-0 peer-checked:opacity-100 transition-opacity" />
                  {checkedItems[item.id] && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="absolute inset-0 flex items-center justify-center text-white"
                    >
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        width="10" 
                        height="10" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="3" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </motion.div>
                  )}
                </motion.div>
                <Label
                  htmlFor={`nonnegotiable-${item.id}`}
                  className={cn(
                    "text-sm text-white cursor-pointer",
                    checkedItems[item.id] && "line-through text-white/60"
                  )}
                >
                  {item.label}
                </Label>
              </div>

              {item.streak !== undefined && (
                <span className="text-xs text-white/40 ml-2">
                  · {item.streak}-day streak
                </span>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
