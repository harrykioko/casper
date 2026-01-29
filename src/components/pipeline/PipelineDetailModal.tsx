import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PipelineCompany, RoundEnum, SectorEnum, PipelineStatus } from '@/types/pipeline';
import { usePipeline } from '@/hooks/usePipeline';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Globe, Upload, Check, X, Loader2, ExternalLink } from 'lucide-react';
import { fetchCompanyLogo } from '@/services/logoService';
import { supabase } from '@/integrations/supabase/client';

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
  const navigate = useNavigate();
  const [formData, setFormData] = useState<Partial<PipelineCompany>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { updateCompany, deleteCompany } = usePipeline();
  const { toast } = useToast();

  // Logo state
  const [pendingLogo, setPendingLogo] = useState<string | null>(null);
  const [fetchingLogo, setFetchingLogo] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleOpenFullPage = () => {
    if (company) {
      onClose();
      navigate(`/pipeline/${company.id}`);
    }
  };

  // Update form data when company changes
  useEffect(() => {
    if (company) {
      setFormData(company);
      setPendingLogo(null);
    }
  }, [company]);

  const handleFetchLogo = async () => {
    const website = formData.website;
    if (!website) {
      toast({ title: 'Enter a website URL first', variant: 'destructive' });
      return;
    }

    setFetchingLogo(true);
    try {
      const logoUrl = await fetchCompanyLogo(website);
      if (logoUrl) {
        setPendingLogo(logoUrl);
      } else {
        toast({ title: 'No logo found', description: 'Try uploading manually' });
      }
    } catch (error) {
      toast({ title: 'Failed to fetch logo', variant: 'destructive' });
    } finally {
      setFetchingLogo(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: 'Please select an image file', variant: 'destructive' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'Image must be under 5MB', variant: 'destructive' });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `pipeline/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('company-logos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('company-logos')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, logo_url: publicUrl }));
      setPendingLogo(null);
      toast({ title: 'Logo uploaded' });
    } catch (error) {
      toast({ title: 'Failed to upload logo', variant: 'destructive' });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const approvePendingLogo = () => {
    if (pendingLogo) {
      setFormData(prev => ({ ...prev, logo_url: pendingLogo }));
      setPendingLogo(null);
    }
  };

  const clearPendingLogo = () => setPendingLogo(null);

  const clearLogo = () => {
    setFormData(prev => ({ ...prev, logo_url: undefined }));
    setPendingLogo(null);
  };

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
            <span>Edit Company</span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenFullPage}
                className="gap-1.5"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Open Full Page
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDelete}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
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

          {/* Logo Section */}
          <div className="space-y-3">
            <Label>Company Logo</Label>
            <div className="flex items-center gap-4 p-3 rounded-lg border border-border bg-muted/30">
              {/* Logo Preview */}
              <div className="w-14 h-14 rounded-lg bg-background border border-border flex items-center justify-center overflow-hidden shrink-0">
                {pendingLogo ? (
                  <img src={pendingLogo} alt="Pending logo" className="w-full h-full object-contain" />
                ) : formData.logo_url ? (
                  <img src={formData.logo_url} alt="Company logo" className="w-full h-full object-contain" />
                ) : (
                  <span className="text-lg font-semibold text-muted-foreground">
                    {formData.company_name?.charAt(0) || '?'}
                  </span>
                )}
              </div>

              {/* Status & Actions */}
              <div className="flex-1 min-w-0">
                {pendingLogo ? (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Approve this logo?</p>
                    <div className="flex gap-2">
                      <Button type="button" size="sm" onClick={approvePendingLogo}>
                        <Check className="h-3 w-3 mr-1" /> Use
                      </Button>
                      <Button type="button" size="sm" variant="outline" onClick={clearPendingLogo}>
                        <X className="h-3 w-3 mr-1" /> Reject
                      </Button>
                    </div>
                  </div>
                ) : formData.logo_url ? (
                  <div className="space-y-1">
                    <p className="text-sm text-foreground">Logo set</p>
                    <Button type="button" size="sm" variant="ghost" onClick={clearLogo} className="text-destructive hover:text-destructive h-7 px-2">
                      Remove
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No logo yet</p>
                )}
              </div>
            </div>

            {/* Fetch / Upload Buttons */}
            {!pendingLogo && (
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleFetchLogo}
                  disabled={fetchingLogo || !formData.website}
                >
                  {fetchingLogo ? (
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  ) : (
                    <Globe className="h-3 w-3 mr-1" />
                  )}
                  Fetch from website
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? (
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  ) : (
                    <Upload className="h-3 w-3 mr-1" />
                  )}
                  Upload
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            )}
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-warning/10 border border-warning/20">
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