import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { HelpCircle, Plus } from 'lucide-react';
import { RoundEnum } from '@/types/pipeline';
import { usePipeline } from '@/hooks/usePipeline';
import { useToast } from '@/hooks/use-toast';

export function NewPipelineInput() {
  const [input, setInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createCompany } = usePipeline();
  const { toast } = useToast();

  const parseInput = (text: string): { company_name: string; current_round: RoundEnum } | null => {
    // Regex to match "Company Name (Round)" format
    const regex = /^(.+?)\s*\((.+?)\)$/;
    const match = text.trim().match(regex);
    
    if (!match) return null;
    
    const [, company_name, round] = match;
    const trimmedCompany = company_name.trim();
    const trimmedRound = round.trim();
    
    // Validate round
    const validRounds: RoundEnum[] = ['Seed', 'Series A', 'Series B', 'Series C', 'Series D', 'Series E', 'Series F+'];
    const normalizedRound = validRounds.find(r => r.toLowerCase() === trimmedRound.toLowerCase());
    
    if (!normalizedRound || !trimmedCompany) return null;
    
    return { company_name: trimmedCompany, current_round: normalizedRound };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isSubmitting) return;

    const parsed = parseInput(input);
    if (!parsed) {
      toast({
        title: "Invalid format",
        description: "Please use format: Company Name (Round)",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await createCompany(parsed);
      setInput('');
      
      // Analytics event
      if ((window as any).gtag) {
        (window as any).gtag('event', 'pipeline_create', {
          company_name: parsed.company_name,
          round: parsed.current_round
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create company",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isValid = parseInput(input) !== null;

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 items-center w-full">
      <div className="relative flex-1">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Company Name (Round)"
          className="pr-8"
          disabled={isSubmitting}
        />
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <HelpCircle className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent>
              <p>Format: Company Name (Round)</p>
              <p>Example: Acme Corp (Series A)</p>
              <p>Valid rounds: Seed, Series A-F+</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <Button 
        type="submit" 
        disabled={!isValid || isSubmitting}
        size="icon"
      >
        <Plus className="h-4 w-4" />
      </Button>
    </form>
  );
}