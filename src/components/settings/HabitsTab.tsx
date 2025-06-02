
import { useState } from "react";
import { X, Sparkles } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useNonnegotiables } from "@/hooks/useNonnegotiables";
import { useAuth } from "@/contexts/AuthContext";

export function HabitsTab() {
  const { user } = useAuth();
  const { nonnegotiables, loading, createNonnegotiable, deleteNonnegotiable } = useNonnegotiables();
  const [newHabitText, setNewHabitText] = useState("");

  const handleAddHabit = async () => {
    if (!user) {
      toast.error("You must be logged in to add habits");
      return;
    }

    if (newHabitText.trim()) {
      try {
        await createNonnegotiable({
          title: newHabitText.trim(),
          is_active: true
        });
        setNewHabitText("");
        toast.success("Habit added");
      } catch (error) {
        console.error('Error adding habit:', error);
        toast.error("Failed to add habit");
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAddHabit();
    }
  };

  const handleDeleteHabit = async (id: string) => {
    try {
      await deleteNonnegotiable(id);
      toast.success("Habit removed");
    } catch (error) {
      console.error('Error deleting habit:', error);
      toast.error("Failed to remove habit");
    }
  };

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-pink-500" />
            Daily Habits
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-zinc-500 dark:text-zinc-400">
            Please log in to manage your habits
          </div>
        </CardContent>
      </Card>
    );
  }

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
              disabled={loading}
            />
            <Button 
              onClick={handleAddHabit}
              className="bg-zinc-800 hover:bg-zinc-900 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-white"
              disabled={loading || !newHabitText.trim()}
            >
              Add
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-6 text-zinc-500 dark:text-zinc-400">
              Loading habits...
            </div>
          ) : nonnegotiables.length === 0 ? (
            <div className="text-center py-6 text-zinc-500 dark:text-zinc-400">
              No habits added yet
            </div>
          ) : (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Current Habits</h3>
              <ul className="flex flex-wrap gap-2">
                {nonnegotiables.map((habit) => (
                  <li 
                    key={habit.id}
                    className="flex items-center gap-1 px-3 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-full"
                  >
                    <span className="text-sm">{habit.title}</span>
                    <button 
                      onClick={() => handleDeleteHabit(habit.id)}
                      className="ml-1 text-zinc-400 hover:text-red-500 dark:text-zinc-500 dark:hover:text-red-400"
                      title="Delete habit"
                      disabled={loading}
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
          <p>Habits are automatically synced across your dashboard and settings.</p>
        </div>
      </CardContent>
    </Card>
  );
}
