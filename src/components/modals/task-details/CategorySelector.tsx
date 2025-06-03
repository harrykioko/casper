
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CategorySelectorProps {
  selectedCategory: string | undefined;
  setSelectedCategory: (category: string | undefined) => void;
}

const categories = [
  { id: "work", name: "Work" },
  { id: "personal", name: "Personal" },
  { id: "health", name: "Health" },
  { id: "learning", name: "Learning" },
  { id: "creative", name: "Creative" },
  { id: "social", name: "Social" }
];

export function CategorySelector({ selectedCategory, setSelectedCategory }: CategorySelectorProps) {
  return (
    <div className="space-y-1">
      <label className="text-sm text-muted-foreground mb-1 block">Category</label>
      <Select 
        value={selectedCategory || "none"} 
        onValueChange={(value) => {
          if (value === "none") {
            setSelectedCategory(undefined);
          } else {
            setSelectedCategory(value);
          }
        }}
      >
        <SelectTrigger className="w-full bg-muted/20 border border-muted/40 rounded-md text-base">
          <SelectValue placeholder="Select category" />
        </SelectTrigger>
        <SelectContent className="bg-popover backdrop-blur-md border border-muted/40 z-50">
          {categories.map((category) => (
            <SelectItem key={category.id} value={category.id}>
              {category.name}
            </SelectItem>
          ))}
          <SelectItem value="none">No Category</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
