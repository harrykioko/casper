
import { useState } from "react";
import { X } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";

interface Habit {
  id: string;
  label: string;
  streak?: number;
}

export function HabitsTab() {
  const [habits, setHabits] = useState<Habit[]>([
    { id: "1", label: "Write in journal", streak: 7 },
    { id: "2", label: "Move for 30 minutes", streak: 3 },
    { id: "3", label: "Drink 2L of water", streak: 5 },
    { id: "4", label: "Review schedule for tomorrow" }
  ]);
  const [newHabitText, setNewHabitText] = useState("");

  const handleAddHabit = () => {
    if (newHabitText.trim()) {
      const newHabit: Habit = {
        id: uuidv4(),
        label: newHabitText.trim()
      };
      setHabits([...habits, newHabit]);
      setNewHabitText("");
      toast.success("Habit added");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAddHabit();
    }
  };

  const handleDeleteHabit = (id: string) => {
    setHabits(habits.filter(habit => habit.id !== id));
    toast.success("Habit removed");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-pink-500" />
          Daily Habits
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Your Daily Habits</h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1 mb-4">
            These will appear on your dashboard every day under "Nonnegotiables."
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Input
              placeholder="e.g. Write in journal"
              value={newHabitText}
              onChange={(e) => setNewHabitText(e.target.value)}
              onKeyDown={handleKeyDown}
              className="border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 placeholder-zinc-400 dark:placeholder-zinc-500"
            />
            <Button 
              onClick={handleAddHabit}
              className="bg-zinc-800 hover:bg-zinc-900 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-white"
            >
              Add
            </Button>
          </div>

          {habits.length === 0 ? (
            <div className="text-center py-6 text-zinc-500 dark:text-zinc-400">
              No habits added yet
            </div>
          ) : (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Current Habits</h3>
              <ul className="flex flex-wrap gap-2">
                {habits.map((habit) => (
                  <li 
                    key={habit.id}
                    className="flex items-center gap-1 px-3 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-full"
                  >
                    <span className="text-sm">{habit.label}</span>
                    {habit.streak !== undefined && (
                      <span className="text-xs text-zinc-500 dark:text-zinc-400 ml-1">
                        · {habit.streak}-day streak
                      </span>
                    )}
                    <button 
                      onClick={() => handleDeleteHabit(habit.id)}
                      className="ml-1 text-zinc-400 hover:text-red-500 dark:text-zinc-500 dark:hover:text-red-400"
                      title="Delete habit"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="text-xs text-zinc-500 dark:text-zinc-400 pt-2 border-t border-zinc-200 dark:border-zinc-700">
          <p>Streaks are automatically tracked when you complete habits consistently.</p>
        </div>
      </CardContent>
    </Card>
  );
}
