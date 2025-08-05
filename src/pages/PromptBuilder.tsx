import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GoalInput } from "@/components/prompt-builder/GoalInput";
import { ExamplePills } from "@/components/prompt-builder/ExamplePills";
import { PromptDetailsForm } from "@/components/prompt-builder/PromptDetailsForm";
import { GenerateButton } from "@/components/prompt-builder/GenerateButton";
import { BuilderLayout } from "@/components/prompt-builder/BuilderLayout";
import { PromptBuilderService } from "@/services/promptBuilderService";
import { useToast } from "@/hooks/use-toast";

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
  const [followUpQuestions, setFollowUpQuestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState<string>("");
  const { toast } = useToast();

  const handleGenerate = async () => {
    try {
      setMode('generating');
      setIsLoading(true);

      const payload = PromptBuilderService.buildPayload({
        goalInput,
        inputTypes,
        outputFormats,
        constraints,
        tone,
        customInputType,
        customOutputFormat,
        customConstraints,
        customTone
      });

      const response = await PromptBuilderService.getFollowUps(payload);

      if (response.followup_questions && response.followup_questions.length > 0) {
        setFollowUpQuestions(response.followup_questions);
        setFollowUpAnswers({});
        setMode('active');
      } else if (response.prompt) {
        setGeneratedPrompt(response.prompt);
        setMode('active');
      } else {
        throw new Error('Invalid response from API');
      }
    } catch (error) {
      console.error('Error generating prompt:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate prompt. Please try again.",
        variant: "destructive"
      });
      setMode('idle');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitAnswers = async () => {
    try {
      setIsLoading(true);

      const clarifications = followUpQuestions.map(question => 
        followUpAnswers[question] || ""
      );

      const payload = PromptBuilderService.buildPayload({
        goalInput,
        inputTypes,
        outputFormats,
        constraints,
        tone,
        customInputType,
        customOutputFormat,
        customConstraints,
        customTone,
        clarifications
      });

      const response = await PromptBuilderService.generatePrompt(payload);
      setGeneratedPrompt(response.prompt);
    } catch (error) {
      console.error('Error generating final prompt:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate final prompt. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
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
          followUpQuestions={followUpQuestions}
          isLoading={mode === 'generating' || isLoading}
          generatedPrompt={generatedPrompt}
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