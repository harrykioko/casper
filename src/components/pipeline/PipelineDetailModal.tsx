import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PipelineCompany, RoundEnum, SectorEnum, PipelineStatus } from '@/types/pipeline';
import { usePipeline } from '@/hooks/usePipeline';
import { useToast } from '@/hooks/use-toast';
import { Trash2 } from 'lucide-react';

interface PipelineDetailModalProps {
  company: PipelineCompany | null;
  isOpen: boolean;
  onClose: () => void;
}

const rounds: RoundEnum[] = ['Seed', 'Series A', 'Series B', 'Series C', 'Series D', 'Series E', 'Series F+'];
const sectors: SectorEnum[] = [
  'Lending', 'Payments', 'DevOps', 'Sales Enablement', 'Wealth', 
  'Real Estate', 'Consumer', 'Capital Markets', 'Blockchain'
];
const statuses: PipelineStatus[] = ['new', 'active', 'passed', 'to_share', 'interesting', 'pearls'];

export function PipelineDetailModal({ company, isOpen, onClose }: PipelineDetailModalProps) {
  const [formData, setFormData] = useState<Partial<PipelineCompany>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { updateCompany, deleteCompany } = usePipeline();
  const { toast } = useToast();

  // Update form data when company changes
  useEffect(() => {
    if (company) {
      setFormData(company);
    }
  }, [company]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await updateCompany(company.id, formData);
      
      toast({
        title: "Success",
        description: "Company updated successfully",
      });

      // Analytics
      if ((window as any).gtag) {
        const changedFields = Object.keys(formData).filter(
          key => formData[key as keyof PipelineCompany] !== company[key as keyof PipelineCompany]
        );
        
        (window as any).gtag('event', 'pipeline_edit_save', {
          id: company.id,
          fields_changed: changedFields
        });
      }

      onClose();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update company",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!company || !confirm(`Are you sure you want to delete ${company.company_name}?`)) return;

    try {
      await deleteCompany(company.id);
      onClose();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete company",
        variant: "destructive",
      });
    }
  };

  if (!company) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Edit Company
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDelete}
              className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company_name">Company Name *</Label>
              <Input
                id="company_name"
                value={formData.company_name || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="current_round">Round *</Label>
              <Select
                value={formData.current_round || ''}
                onValueChange={(value) => setFormData(prev => ({ ...prev, current_round: value as RoundEnum }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select round" />
                </SelectTrigger>
                <SelectContent>
                  {rounds.map(round => (
                    <SelectItem key={round} value={round}>{round}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status || ''}
                onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as PipelineStatus }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map(status => (
                    <SelectItem key={status} value={status}>
                      {status.replace('_', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sector">Sector</Label>
              <Select
                value={formData.sector || ''}
                onValueChange={(value) => setFormData(prev => ({ 
                  ...prev, 
                  sector: value === 'none' ? undefined : value as SectorEnum 
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select sector" />
                </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No sector</SelectItem>
              {sectors.map(sector => (
                    <SelectItem key={sector} value={sector}>{sector}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="raise_amount_usd">Raise Amount (USD)</Label>
              <Input
                id="raise_amount_usd"
                type="number"
                placeholder="1000000"
                value={formData.raise_amount_usd || ''}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  raise_amount_usd: e.target.value ? Number(e.target.value) : undefined 
                }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="close_date">Close Date</Label>
              <Input
                id="close_date"
                type="date"
                value={formData.close_date || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, close_date: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              type="url"
              placeholder="https://company.com"
              value={formData.website || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <div>
              <Label htmlFor="top_of_mind" className="text-sm font-medium">Top of Mind</Label>
              <p className="text-xs text-muted-foreground">Show on Dashboard for quick access</p>
            </div>
            <input
              type="checkbox"
              id="top_of_mind"
              checked={formData.is_top_of_mind || false}
              onChange={(e) => setFormData(prev => ({ ...prev, is_top_of_mind: e.target.checked }))}
              className="h-4 w-4 rounded border-border"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="next_steps">Next Steps</Label>
            <Textarea
              id="next_steps"
              placeholder="What are the next steps for this deal?"
              value={formData.next_steps || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, next_steps: e.target.value }))}
              rows={4}
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}