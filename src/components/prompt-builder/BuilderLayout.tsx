import { motion } from "framer-motion";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { PromptSummary } from "./PromptSummary";
import { FollowUpForm } from "./FollowUpForm";
import { PromptPreview } from "./PromptPreview";

interface BuilderLayoutProps {
  goalInput: string;
  inputTypes: string[];
  outputFormats: string[];
  constraints: string[];
  tone: string;
  customInputType: string;
  customOutputFormat: string;
  customConstraints: string;
  customTone: string;
  followUpAnswers: Record<string, string>;
  onFollowUpAnswersChange: (answers: Record<string, string>) => void;
  followUpQuestions: string[];
  isLoading: boolean;
  generatedPrompt: string;
  onSubmitAnswers: () => void;
  onRegenerate: () => void;
  onSave: () => void;
}

export function BuilderLayout({
  goalInput,
  inputTypes,
  outputFormats,
  constraints,
  tone,
  customInputType,
  customOutputFormat,
  customConstraints,
  customTone,
  followUpAnswers,
  onFollowUpAnswersChange,
  followUpQuestions,
  isLoading,
  generatedPrompt,
  onSubmitAnswers,
  onRegenerate,
  onSave
}: BuilderLayoutProps) {
  const containerVariants = {
    hidden: { x: 100, opacity: 0 },
    visible: { 
      x: 0, 
      opacity: 1,
      transition: { 
        duration: 0.4,
        staggerChildren: 0.1
      }
    }
  };

  return (
    <motion.div 
      className="h-screen w-full"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <ResizablePanelGroup direction="horizontal" className="h-full">
        <ResizablePanel defaultSize={40} minSize={30} maxSize={50}>
          <motion.div 
            className="h-full p-6 bg-background/50 backdrop-blur-sm border-r border-border/50"
            variants={{
              hidden: { y: 20, opacity: 0 },
              visible: { y: 0, opacity: 1 }
            }}
          >
            <div className="space-y-6 h-full flex flex-col">
              <PromptSummary
                goalInput={goalInput}
                inputTypes={inputTypes}
                outputFormats={outputFormats}
                constraints={constraints}
                tone={tone}
                customInputType={customInputType}
                customOutputFormat={customOutputFormat}
                customConstraints={customConstraints}
                customTone={customTone}
              />
              
              <div className="flex-1 min-h-0">
              <FollowUpForm
                questions={followUpQuestions}
                answers={followUpAnswers}
                onAnswersChange={onFollowUpAnswersChange}
                onSubmit={onSubmitAnswers}
                isLoading={isLoading}
              />
              </div>
            </div>
          </motion.div>
        </ResizablePanel>
        
        <ResizableHandle withHandle />
        
        <ResizablePanel defaultSize={60}>
          <motion.div 
            className="h-full p-6"
            variants={{
              hidden: { y: 20, opacity: 0 },
              visible: { y: 0, opacity: 1 }
            }}
          >
            <PromptPreview 
              isLoading={isLoading} 
              generatedPrompt={generatedPrompt}
              onRegenerate={onRegenerate}
              onSave={onSave}
            />
          </motion.div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </motion.div>
  );
}