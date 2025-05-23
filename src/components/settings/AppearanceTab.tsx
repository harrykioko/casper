
import { useTheme } from "@/hooks/use-theme";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Sun, Moon } from "lucide-react";

export function AppearanceTab() {
  const { theme, setTheme } = useTheme();
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Theme</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Mode</Label>
          <RadioGroup 
            defaultValue={theme}
            onValueChange={(value) => setTheme(value as "light" | "dark" | "system")}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="light" id="light" />
              <Label htmlFor="light" className="flex items-center gap-1.5">
                <Sun className="h-4 w-4" />
                Light
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="dark" id="dark" />
              <Label htmlFor="dark" className="flex items-center gap-1.5">
                <Moon className="h-4 w-4" />
                Dark
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="system" id="system" />
              <Label htmlFor="system">System</Label>
            </div>
          </RadioGroup>
        </div>
        
        <div className="space-y-2">
          <Label>Color</Label>
          <div className="grid grid-cols-5 gap-2">
            <div className="bg-gradient-primary h-10 rounded-md cursor-pointer ring-2 ring-primary ring-offset-2 ring-offset-background"></div>
            <div className="bg-gradient-to-r from-pink-500 to-purple-500 h-10 rounded-md cursor-pointer"></div>
            <div className="bg-gradient-to-r from-cyan-500 to-blue-500 h-10 rounded-md cursor-pointer"></div>
            <div className="bg-gradient-to-r from-violet-500 to-indigo-500 h-10 rounded-md cursor-pointer"></div>
            <div className="bg-gradient-to-r from-amber-500 to-red-500 h-10 rounded-md cursor-pointer"></div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
