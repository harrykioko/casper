import { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Star, Loader2, Globe, Upload, Check, X } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { CompanyStatus, FounderInput } from '@/types/portfolio';
import { fetchCompanyLogo } from '@/services/logoService';
import { supabase } from '@/integrations/supabase/client';
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
  const [logoApproved, setLogoApproved] = useState(!!initialData?.logo_url);
  const [pendingLogo, setPendingLogo] = useState<string | null>(null);
  const [status, setStatus] = useState<CompanyStatus>(initialData?.status || 'active');
  const [founders, setFounders] = useState<FounderInput[]>(
    initialData?.founders || [{ name: '', email: '', role: '', is_primary: true }]
  );
  const [loading, setLoading] = useState(false);
  const [fetchingLogo, setFetchingLogo] = useState(false);
  const [uploading, setUploading] = useState(false);
  const lastFetchedUrl = useRef<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset form when modal opens/closes or initialData changes
  useEffect(() => {
    if (open) {
      setName(initialData?.name || '');
      setWebsiteUrl(initialData?.website_url || '');
      setLogoUrl(initialData?.logo_url || '');
      setLogoApproved(!!initialData?.logo_url);
      setPendingLogo(null);
      setStatus(initialData?.status || 'active');
      setFounders(initialData?.founders || [{ name: '', email: '', role: '', is_primary: true }]);
      lastFetchedUrl.current = initialData?.website_url || '';
    }
  }, [open, initialData]);

  // Auto-fetch logo when website URL changes (only for new companies without approved logo)
  useEffect(() => {
    // Don't auto-fetch if:
    // - No website URL
    // - Already fetched this URL
    // - Editing with an existing approved logo
    // - Currently has an approved logo
    if (!websiteUrl.trim() || 
        websiteUrl === lastFetchedUrl.current || 
        logoApproved) {
      return;
    }
    
    // Validate URL format
    try {
      new URL(websiteUrl);
    } catch {
      return;
    }

    const timeoutId = setTimeout(async () => {
      setFetchingLogo(true);
      try {
        const logoUrl = await fetchCompanyLogo(websiteUrl);
        lastFetchedUrl.current = websiteUrl;
        
        if (logoUrl) {
          setPendingLogo(logoUrl);
        }
      } catch (error) {
        console.error('Failed to fetch logo:', error);
      } finally {
        setFetchingLogo(false);
      }
    }, 800);

    return () => clearTimeout(timeoutId);
  }, [websiteUrl, logoApproved]);

  const handleAddFounder = () => {
    setFounders([...founders, { name: '', email: '', role: '', is_primary: false }]);
  };

  const handleRemoveFounder = (index: number) => {
    const newFounders = founders.filter((_, i) => i !== index);
    if (founders[index].is_primary && newFounders.length > 0) {
      newFounders[0].is_primary = true;
    }
    setFounders(newFounders);
  };

  const handleFounderChange = (index: number, field: keyof FounderInput, value: string | boolean) => {
    const newFounders = [...founders];
    if (field === 'is_primary' && value === true) {
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
      const logoUrl = await fetchCompanyLogo(websiteUrl);
      lastFetchedUrl.current = websiteUrl;
      if (logoUrl) {
        setPendingLogo(logoUrl);
        setLogoApproved(false);
      } else {
        toast.error('No logo found on website');
      }
    } catch (error) {
      toast.error('Failed to fetch logo');
    } finally {
      setFetchingLogo(false);
    }
  };

  const approvePendingLogo = () => {
    if (pendingLogo) {
      setLogoUrl(pendingLogo);
      setLogoApproved(true);
      setPendingLogo(null);
      toast.success('Logo approved');
    }
  };

  const clearPendingLogo = () => {
    setPendingLogo(null);
  };

  const clearLogo = () => {
    setLogoUrl('');
    setLogoApproved(false);
    setPendingLogo(null);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File must be under 5MB');
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const filename = `${crypto.randomUUID()}.${ext}`;
      
      const { error } = await supabase.storage
        .from('company-logos')
        .upload(filename, file);
        
      if (error) throw error;
      
      const { data: { publicUrl } } = supabase.storage
        .from('company-logos')
        .getPublicUrl(filename);
        
      setLogoUrl(publicUrl);
      setLogoApproved(true);
      setPendingLogo(null);
      toast.success('Logo uploaded');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload logo');
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const displayLogo = logoUrl || pendingLogo;

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
          </div>

          {/* Logo Section - Redesigned */}
          <div className="space-y-2">
            <Label>Company Logo</Label>
            
            {/* Logo Preview Card */}
            <div className="flex items-center gap-4 p-3 rounded-lg border bg-muted/30">
              {/* Preview */}
              <div className="flex-shrink-0 w-14 h-14 rounded-lg bg-background border flex items-center justify-center overflow-hidden">
                {displayLogo ? (
                  <img
                    src={displayLogo}
                    alt="Logo preview"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <span className="text-lg font-bold text-muted-foreground">
                    {name?.charAt(0)?.toUpperCase() || '?'}
                  </span>
                )}
              </div>

              {/* Status & Actions */}
              <div className="flex-1 min-w-0 space-y-2">
                {fetchingLogo && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Fetching logo...
                  </div>
                )}
                
                {pendingLogo && !logoApproved && !fetchingLogo && (
                  <div className="flex items-center gap-2">
                    <Button type="button" size="sm" variant="default" onClick={approvePendingLogo}>
                      <Check className="h-3 w-3 mr-1" /> Approve
                    </Button>
                    <Button type="button" size="sm" variant="ghost" onClick={clearPendingLogo}>
                      <X className="h-3 w-3 mr-1" /> Clear
                    </Button>
                  </div>
                )}
                
                {logoApproved && logoUrl && !fetchingLogo && (
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      <Check className="h-3 w-3 mr-1" /> Logo set
                    </Badge>
                    <Button type="button" size="sm" variant="ghost" onClick={clearLogo} className="h-6 w-6 p-0">
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )}

                {!pendingLogo && !logoUrl && !fetchingLogo && (
                  <p className="text-xs text-muted-foreground">
                    No logo set
                  </p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleManualFetch}
                disabled={fetchingLogo || uploading || !websiteUrl.trim()}
              >
                <Globe className="h-4 w-4 mr-2" />
                Fetch from website
              </Button>
              
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading || fetchingLogo}
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                Upload
              </Button>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>
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
