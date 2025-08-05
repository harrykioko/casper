import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface FollowUpFormProps {
  questions: string[];
  answers: Record<string, string>;
  onAnswersChange: (answers: Record<string, string>) => void;
  onSubmit: () => void;
  isLoading: boolean;
}

const mockFollowUps = [
  "Who is the end user for this prompt?",
  "What structure should the output follow?",
  "Are there specific examples that should be included?",
  "What's the desired response length or format?"
];

export function FollowUpForm({ questions, answers, onAnswersChange, onSubmit, isLoading }: FollowUpFormProps) {
  const handleAnswerChange = (question: string, value: string) => {
    onAnswersChange({
      ...answers,
      [question]: value
    });
  };

  const hasAnswers = Object.values(answers).some(answer => answer.trim().length > 0);

  return (
    <Card className="bg-background/30 backdrop-blur-sm border-border/50 h-full flex flex-col">
      <CardHeader className="pb-3 flex-shrink-0">
        <CardTitle className="text-lg text-foreground">Refine Your Prompt</CardTitle>
        <p className="text-sm text-muted-foreground">
          Answer these questions to improve your prompt quality
        </p>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col space-y-4">
        <div className="space-y-4 flex-1">
          {questions.map((question, index) => (
            <div key={index} className="space-y-2">
              <Label htmlFor={`question-${index}`} className="text-sm font-medium text-foreground">
                {question}
              </Label>
              <Textarea
                id={`question-${index}`}
                placeholder="Your answer..."
                value={answers[question] || ""}
                onChange={(e) => handleAnswerChange(question, e.target.value)}
                className="min-h-[60px] bg-background/40 border-border/60 text-sm resize-none"
                disabled={isLoading}
              />
            </div>
          ))}
        </div>
        
        <div className="flex-shrink-0 pt-2">
          <Button 
            onClick={onSubmit}
            disabled={questions.length === 0 || Object.values(answers).every(answer => !answer.trim()) || isLoading}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              "Submit Answers"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}