import { MultiSelect } from "./MultiSelect";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PromptDetailsFormProps {
  inputTypes: string[];
  setInputTypes: (types: string[]) => void;
  outputFormats: string[];
  setOutputFormats: (formats: string[]) => void;
  constraints: string[];
  setConstraints: (constraints: string[]) => void;
  tone: string;
  setTone: (tone: string) => void;
  customInputType: string;
  setCustomInputType: (value: string) => void;
  customOutputFormat: string;
  setCustomOutputFormat: (value: string) => void;
  customConstraints: string;
  setCustomConstraints: (value: string) => void;
  customTone: string;
  setCustomTone: (value: string) => void;
}

const inputTypeOptions = [
  "Pasted Text",
  "Code File", 
  "Screenshot",
  "JSON",
  "Spreadsheet",
  "None"
];

const outputFormatOptions = [
  "Markdown",
  "JSON",
  "Plain Text",
  "Table",
  "Bullet Points"
];

const constraintOptions = [
  "Max word count",
  "Avoid phrases",
  "Include examples", 
  "Use headers"
];

const toneOptions = [
  "Friendly",
  "Formal",
  "Instructional",
  "Creative"
];

export function PromptDetailsForm({
  inputTypes,
  setInputTypes,
  outputFormats,
  setOutputFormats,
  constraints,
  setConstraints,
  tone,
  setTone,
  customInputType,
  setCustomInputType,
  customOutputFormat,
  setCustomOutputFormat,
  customConstraints,
  setCustomConstraints,
  customTone,
  setCustomTone
}: PromptDetailsFormProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <MultiSelect
            label="Input Type"
            options={inputTypeOptions}
            selectedValues={inputTypes}
            onChange={setInputTypes}
            placeholder="Select input types"
          />
          <div>
            <Label className="text-xs text-muted-foreground">Add custom input (optional)</Label>
            <Input
              value={customInputType}
              onChange={(e) => setCustomInputType(e.target.value)}
              placeholder="e.g. customer support transcript"
              className="h-8 text-sm glassmorphic"
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <MultiSelect
            label="Output Format"
            options={outputFormatOptions}
            selectedValues={outputFormats}
            onChange={setOutputFormats}
            placeholder="Select output formats"
          />
          <div>
            <Label className="text-xs text-muted-foreground">Add custom input (optional)</Label>
            <Input
              value={customOutputFormat}
              onChange={(e) => setCustomOutputFormat(e.target.value)}
              placeholder="e.g. CSV table"
              className="h-8 text-sm glassmorphic"
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <MultiSelect
            label="Constraints"
            options={constraintOptions}
            selectedValues={constraints}
            onChange={setConstraints}
            placeholder="Select constraints"
          />
          <div>
            <Label className="text-xs text-muted-foreground">Add custom input (optional)</Label>
            <Input
              value={customConstraints}
              onChange={(e) => setCustomConstraints(e.target.value)}
              placeholder="e.g. use plain English with analogies"
              className="h-8 text-sm glassmorphic"
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <MultiSelect
            label="Tone"
            options={toneOptions}
            selectedValues={tone ? [tone] : []}
            onChange={(values) => setTone(values[0] || "")}
            placeholder="Select tone"
            singleSelect
          />
          <div>
            <Label className="text-xs text-muted-foreground">Add custom input (optional)</Label>
            <Input
              value={customTone}
              onChange={(e) => setCustomTone(e.target.value)}
              placeholder="e.g. sarcastic but respectful"
              className="h-8 text-sm glassmorphic"
            />
          </div>
        </div>
      </div>
    </div>
  );
}