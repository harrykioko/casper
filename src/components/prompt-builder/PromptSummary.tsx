import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface PromptSummaryProps {
  goalInput: string;
  inputTypes: string[];
  outputFormats: string[];
  constraints: string[];
  tone: string;
  customInputType: string;
  customOutputFormat: string;
  customConstraints: string;
  customTone: string;
}

export function PromptSummary({
  goalInput,
  inputTypes,
  outputFormats,
  constraints,
  tone,
  customInputType,
  customOutputFormat,
  customConstraints,
  customTone
}: PromptSummaryProps) {
  const renderSection = (title: string, items: string[], customValue: string) => {
    const allItems = [...items];
    if (customValue.trim()) {
      allItems.push(customValue);
    }
    
    if (allItems.length === 0) return null;

    return (
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-foreground">{title}</h4>
        <div className="flex flex-wrap gap-1">
          {allItems.map((item, index) => (
            <Badge 
              key={index} 
              variant="secondary" 
              className="text-xs bg-background/60 text-foreground/80"
            >
              {item}
            </Badge>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Card className="bg-background/30 backdrop-blur-sm border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg text-foreground">Prompt Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="text-sm font-medium text-foreground mb-2">Goal</h4>
          <p className="text-sm text-muted-foreground bg-background/40 p-3 rounded-md">
            {goalInput}
          </p>
        </div>
        
        {renderSection("Input Types", inputTypes, customInputType)}
        {renderSection("Output Formats", outputFormats, customOutputFormat)}
        {renderSection("Constraints", constraints, customConstraints)}
        
        {(tone || customTone) && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-foreground">Tone</h4>
            <Badge variant="secondary" className="text-xs bg-background/60 text-foreground/80">
              {tone || customTone}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}