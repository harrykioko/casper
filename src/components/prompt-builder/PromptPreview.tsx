import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PromptActions } from "./PromptActions";
import { motion } from "framer-motion";

interface PromptPreviewProps {
  isLoading: boolean;
  generatedPrompt: string;
}

export function PromptPreview({ isLoading, generatedPrompt }: PromptPreviewProps) {
  if (isLoading) {
    return (
      <Card className="h-full bg-background/30 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle className="text-lg text-foreground">Generated Prompt</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-center h-32">
              <div className="text-center space-y-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-sm text-muted-foreground">Generating prompt...</p>
              </div>
            </div>
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      className="h-full flex flex-col"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="flex-1 bg-background/30 backdrop-blur-sm border-border/50 flex flex-col">
        <CardHeader className="flex-shrink-0">
          <CardTitle className="text-lg text-foreground">Generated Prompt</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col space-y-4">
          <div className="flex-1 min-h-0">
            <div className="bg-background/40 border border-border/60 rounded-md h-full">
              <ScrollArea className="h-full">
                <div className="p-4">
                  <pre className="text-sm text-foreground whitespace-pre-wrap font-mono leading-relaxed">
                    {generatedPrompt}
                  </pre>
                </div>
              </ScrollArea>
            </div>
          </div>
          
          <div className="flex-shrink-0">
            <PromptActions />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}