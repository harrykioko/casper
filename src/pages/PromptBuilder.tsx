import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GoalInput } from "@/components/prompt-builder/GoalInput";
import { ExamplePills } from "@/components/prompt-builder/ExamplePills";
import { PromptDetailsForm } from "@/components/prompt-builder/PromptDetailsForm";
import { GenerateButton } from "@/components/prompt-builder/GenerateButton";
import { BuilderLayout } from "@/components/prompt-builder/BuilderLayout";

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
  
  // Builder mode state
  const [mode, setMode] = useState<'idle' | 'generating' | 'active'>('idle');
  const [followUpAnswers, setFollowUpAnswers] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [mockPrompt, setMockPrompt] = useState<string>("");

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
    
    setMode('generating');
    
    // Mock generation delay
    setTimeout(() => {
      const generatedPrompt = generateMockPrompt();
      setMockPrompt(generatedPrompt);
      setMode('active');
    }, 2000);
  };

  const generateMockPrompt = () => {
    const toneText = tone || customTone;
    const inputText = inputTypes.length > 0 ? inputTypes[0] : customInputType || "content";
    const outputText = outputFormats.length > 0 ? outputFormats[0] : customOutputFormat || "response";
    const constraintText = constraints.length > 0 ? constraints.join(", ") : customConstraints;
    
    let prompt = `Write a ${toneText ? `${toneText} ` : ""}${outputText} based on the following ${inputText}.`;
    
    if (constraintText) {
      prompt += ` Ensure that you ${constraintText}.`;
    }
    
    prompt += `\n\nGoal: ${goalInput}`;
    
    return prompt;
  };

  const handleSubmitAnswers = () => {
    console.log("Follow-up answers:", followUpAnswers);
    setIsLoading(true);
    
    // Mock processing delay
    setTimeout(() => {
      const improvedPrompt = generateImprovedPrompt();
      setMockPrompt(improvedPrompt);
      setIsLoading(false);
    }, 1500);
  };

  const generateImprovedPrompt = () => {
    const basePrompt = generateMockPrompt();
    const answersText = Object.entries(followUpAnswers)
      .filter(([_, answer]) => answer.trim())
      .map(([question, answer]) => `${question}: ${answer}`)
      .join('\n');
    
    return `${basePrompt}\n\nAdditional Context:\n${answersText}`;
  };

  const handleExampleClick = (example: string) => {
    setGoalInput(example);
  };

  const formVariants = {
    visible: { x: 0, opacity: 1 },
    hidden: { x: -100, opacity: 0, transition: { duration: 0.4 } }
  };

  if (mode === 'generating' || mode === 'active') {
    return (
      <AnimatePresence mode="wait">
        <BuilderLayout
          goalInput={goalInput}
          inputTypes={inputTypes}
          outputFormats={outputFormats}
          constraints={constraints}
          tone={tone}
          customInputType={customInputType}
          customOutputFormat={customOutputFormat}
          customConstraints={customConstraints}
          customTone={customTone}
          followUpAnswers={followUpAnswers}
          onFollowUpAnswersChange={setFollowUpAnswers}
          isLoading={mode === 'generating' || isLoading}
          mockPrompt={mockPrompt}
          onSubmitAnswers={handleSubmitAnswers}
        />
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div 
        className="min-h-screen flex flex-col items-center justify-center p-6"
        variants={formVariants}
        initial="visible"
        animate="visible"
        exit="hidden"
      >
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
      </motion.div>
    </AnimatePresence>
  );
}