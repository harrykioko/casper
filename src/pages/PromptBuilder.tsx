import { useState } from "react";
import { GoalInput } from "@/components/prompt-builder/GoalInput";
import { ExamplePills } from "@/components/prompt-builder/ExamplePills";
import { PromptDetailsForm } from "@/components/prompt-builder/PromptDetailsForm";
import { GenerateButton } from "@/components/prompt-builder/GenerateButton";

export default function PromptBuilder() {
  const [goalInput, setGoalInput] = useState<string>("");
  const [inputTypes, setInputTypes] = useState<string[]>([]);
  const [outputFormats, setOutputFormats] = useState<string[]>([]);
  const [constraints, setConstraints] = useState<string[]>([]);
  const [tone, setTone] = useState<string>("");
  const [customInputType, setCustomInputType] = useState<string>("");
  const [customOutputFormat, setCustomOutputFormat] = useState<string>("");
  const [customConstraints, setCustomConstraints] = useState<string>("");
  const [customTone, setCustomTone] = useState<string>("");

  const handleGenerate = () => {
    console.log("Prompt Builder Values:", {
      goalInput,
      inputTypes,
      outputFormats,
      constraints,
      tone,
      customInputType,
      customOutputFormat,
      customConstraints,
      customTone,
    });
  };

  const handleExampleClick = (example: string) => {
    setGoalInput(example);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-2xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent hover:drop-shadow-lg transition-all duration-300">
            Prompt Builder
          </h1>
          <p className="text-base text-muted-foreground">
            Create high-quality AI prompts tailored to your specific needs
          </p>
        </div>

        <div className="space-y-6">
          <GoalInput value={goalInput} onChange={setGoalInput} />
          
          <ExamplePills onExampleClick={handleExampleClick} />
          
          <PromptDetailsForm
            inputTypes={inputTypes}
            setInputTypes={setInputTypes}
            outputFormats={outputFormats}
            setOutputFormats={setOutputFormats}
            constraints={constraints}
            setConstraints={setConstraints}
            tone={tone}
            setTone={setTone}
            customInputType={customInputType}
            setCustomInputType={setCustomInputType}
            customOutputFormat={customOutputFormat}
            setCustomOutputFormat={setCustomOutputFormat}
            customConstraints={customConstraints}
            setCustomConstraints={setCustomConstraints}
            customTone={customTone}
            setCustomTone={setCustomTone}
          />
          
          <GenerateButton 
            onGenerate={handleGenerate}
            disabled={!goalInput.trim()}
          />
        </div>
      </div>
    </div>
  );
}