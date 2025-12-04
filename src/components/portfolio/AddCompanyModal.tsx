import { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Star, Loader2, Globe } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CompanyStatus, FounderInput } from '@/types/portfolio';
import { fetchLinkMetadata } from '@/services/linkMetadataService';
import { toast } from 'sonner';

interface AddCompanyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    name: string;
    website_url?: string;
    logo_url?: string;
    status: CompanyStatus;
    founders: FounderInput[];
  }) => Promise<void>;
  initialData?: {
    name: string;
    website_url?: string | null;
    logo_url?: string | null;
    status: CompanyStatus;
    founders: FounderInput[];
  };
  isEditing?: boolean;
}

export function AddCompanyModal({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  isEditing = false,
}: AddCompanyModalProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [websiteUrl, setWebsiteUrl] = useState(initialData?.website_url || '');
  const [logoUrl, setLogoUrl] = useState(initialData?.logo_url || '');
  const [status, setStatus] = useState<CompanyStatus>(initialData?.status || 'active');
  const [founders, setFounders] = useState<FounderInput[]>(
    initialData?.founders || [{ name: '', email: '', role: '', is_primary: true }]
  );
  const [loading, setLoading] = useState(false);
  const [fetchingLogo, setFetchingLogo] = useState(false);
  const lastFetchedUrl = useRef<string>('');

  // Auto-fetch logo when website URL changes
  useEffect(() => {
    if (!websiteUrl.trim() || websiteUrl === lastFetchedUrl.current) return;
    
    // Validate URL format
    try {
      new URL(websiteUrl);
    } catch {
      return;
    }

    const timeoutId = setTimeout(async () => {
      setFetchingLogo(true);
      try {
        const metadata = await fetchLinkMetadata(websiteUrl);
        lastFetchedUrl.current = websiteUrl;
        
        // Prefer image (usually higher quality) over favicon
        const logo = metadata.image || metadata.favicon;
        if (logo) {
          setLogoUrl(logo);
          toast.success('Logo fetched from website');
        }
      } catch (error) {
        console.error('Failed to fetch logo:', error);
      } finally {
        setFetchingLogo(false);
      }
    }, 800);

    return () => clearTimeout(timeoutId);
  }, [websiteUrl]);

  const handleAddFounder = () => {
    setFounders([...founders, { name: '', email: '', role: '', is_primary: false }]);
  };

  const handleRemoveFounder = (index: number) => {
    const newFounders = founders.filter((_, i) => i !== index);
    // If removed founder was primary, make first one primary
    if (founders[index].is_primary && newFounders.length > 0) {
      newFounders[0].is_primary = true;
    }
    setFounders(newFounders);
  };

  const handleFounderChange = (index: number, field: keyof FounderInput, value: string | boolean) => {
    const newFounders = [...founders];
    if (field === 'is_primary' && value === true) {
      // Unset all other primaries
      newFounders.forEach((f, i) => {
        f.is_primary = i === index;
      });
    } else {
      newFounders[index] = { ...newFounders[index], [field]: value };
    }
    setFounders(newFounders);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      await onSubmit({
        name: name.trim(),
        website_url: websiteUrl.trim() || undefined,
        logo_url: logoUrl.trim() || undefined,
        status,
        founders: founders.filter(f => f.name.trim()),
      });
      onOpenChange(false);
      // Reset form
      if (!isEditing) {
        setName('');
        setWebsiteUrl('');
        setLogoUrl('');
        setStatus('active');
        setFounders([{ name: '', email: '', role: '', is_primary: true }]);
        lastFetchedUrl.current = '';
      }
    } finally {
      setLoading(false);
    }
  };

  const handleManualFetch = async () => {
    if (!websiteUrl.trim()) return;
    try {
      new URL(websiteUrl);
    } catch {
      toast.error('Invalid URL');
      return;
    }

    setFetchingLogo(true);
    try {
      const metadata = await fetchLinkMetadata(websiteUrl);
      lastFetchedUrl.current = websiteUrl;
      const logo = metadata.image || metadata.favicon;
      if (logo) {
        setLogoUrl(logo);
        toast.success('Logo fetched from website');
      } else {
        toast.error('No logo found on website');
      }
    } catch (error) {
      toast.error('Failed to fetch logo');
    } finally {
      setFetchingLogo(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Portfolio Company' : 'Add Portfolio Company'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Company Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Company Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Acme Inc."
              required
            />
          </div>

          {/* Website URL */}
          <div className="space-y-2">
            <Label htmlFor="website">Website URL</Label>
            <Input
              id="website"
              type="url"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="https://example.com"
            />
            <p className="text-xs text-muted-foreground">
              Logo will be auto-fetched from website
            </p>
          </div>

          {/* Logo URL with Preview */}
          <div className="space-y-2">
            <Label htmlFor="logo">Logo URL</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="logo"
                  type="url"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="Auto-fetched or enter manually"
                  className="pr-10"
                />
                {fetchingLogo && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleManualFetch}
                disabled={fetchingLogo || !websiteUrl.trim()}
                title="Fetch logo from website"
              >
                <Globe className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Logo Preview */}
            {logoUrl && (
              <div className="flex items-center gap-3 p-2 rounded-md bg-muted/50">
                <img
                  src={logoUrl}
                  alt="Logo preview"
                  className="h-10 w-10 object-contain rounded"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <span className="text-xs text-muted-foreground truncate flex-1">
                  {logoUrl}
                </span>
              </div>
            )}
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as CompanyStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="watching">Watching</SelectItem>
                <SelectItem value="exited">Exited</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Founders */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Founders</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleAddFounder}
                className="h-7 text-xs"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Founder
              </Button>
            </div>

            {founders.map((founder, index) => (
              <div
                key={index}
                className="p-3 rounded-lg border bg-muted/30 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Founder {index + 1}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant={founder.is_primary ? 'secondary' : 'ghost'}
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleFounderChange(index, 'is_primary', true)}
                      title="Set as primary contact"
                    >
                      <Star className={`h-3 w-3 ${founder.is_primary ? 'fill-current' : ''}`} />
                    </Button>
                    {founders.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive"
                        onClick={() => handleRemoveFounder(index)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>

                <Input
                  value={founder.name}
                  onChange={(e) => handleFounderChange(index, 'name', e.target.value)}
                  placeholder="Name"
                  className="h-8 text-sm"
                />
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="email"
                    value={founder.email || ''}
                    onChange={(e) => handleFounderChange(index, 'email', e.target.value)}
                    placeholder="Email"
                    className="h-8 text-sm"
                  />
                  <Input
                    value={founder.role || ''}
                    onChange={(e) => handleFounderChange(index, 'role', e.target.value)}
                    placeholder="Role (e.g., CEO)"
                    className="h-8 text-sm"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !name.trim()}>
              {loading ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Company'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
