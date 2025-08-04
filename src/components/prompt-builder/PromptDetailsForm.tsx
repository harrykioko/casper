import { MultiSelect } from "./MultiSelect";

interface PromptDetailsFormProps {
  inputTypes: string[];
  setInputTypes: (types: string[]) => void;
  outputFormats: string[];
  setOutputFormats: (formats: string[]) => void;
  constraints: string[];
  setConstraints: (constraints: string[]) => void;
  tone: string;
  setTone: (tone: string) => void;
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
  setTone
}: PromptDetailsFormProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <MultiSelect
          label="Input Type"
          options={inputTypeOptions}
          selectedValues={inputTypes}
          onChange={setInputTypes}
          placeholder="Select input types"
        />
        
        <MultiSelect
          label="Output Format"
          options={outputFormatOptions}
          selectedValues={outputFormats}
          onChange={setOutputFormats}
          placeholder="Select output formats"
        />
        
        <MultiSelect
          label="Constraints"
          options={constraintOptions}
          selectedValues={constraints}
          onChange={setConstraints}
          placeholder="Select constraints"
        />
        
        <MultiSelect
          label="Tone"
          options={toneOptions}
          selectedValues={tone ? [tone] : []}
          onChange={(values) => setTone(values[0] || "")}
          placeholder="Select tone"
          singleSelect
        />
      </div>
    </div>
  );
}