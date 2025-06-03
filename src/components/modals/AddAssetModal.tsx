
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AssetType } from "@/hooks/useAssets";
import { motion } from "framer-motion";

interface AddAssetModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddAsset: (asset: {
    name: string;
    url: string;
    type: AssetType;
    notes?: string;
    icon?: string;
  }) => Promise<void>;
}

const assetTypes: { value: AssetType; label: string }[] = [
  { value: 'domain', label: 'Domain' },
  { value: 'repository', label: 'Repository' },
  { value: 'social', label: 'Social' },
  { value: 'notion', label: 'Notion' },
  { value: 'figma', label: 'Figma' },
  { value: 'drive', label: 'Drive' },
  { value: 'other', label: 'Other' }
];

export function AddAssetModal({ open, onOpenChange, onAddAsset }: AddAssetModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    type: 'other' as AssetType,
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.url.trim()) return;

    setIsSubmitting(true);
    try {
      await onAddAsset({
        name: formData.name.trim(),
        url: formData.url.trim(),
        type: formData.type,
        notes: formData.notes.trim() || undefined
      });
      
      // Reset form and close modal
      setFormData({
        name: '',
        url: '',
        type: 'other',
        notes: ''
      });
      onOpenChange(false);
    } catch (error) {
      // Error handling is done in the hook
    } finally {
      setIsSubmitting(false);
    }
  };

  const isValid = formData.name.trim() && formData.url.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border border-gray-200 dark:border-gray-800 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Add Asset
          </DialogTitle>
        </DialogHeader>

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Name *
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Asset name"
              className="bg-muted/20 border border-muted/40"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="url" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              URL *
            </Label>
            <Input
              id="url"
              type="url"
              value={formData.url}
              onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
              placeholder="https://example.com"
              className="bg-muted/20 border border-muted/40"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Type
            </Label>
            <Select 
              value={formData.type} 
              onValueChange={(value: AssetType) => setFormData(prev => ({ ...prev, type: value }))}
            >
              <SelectTrigger className="bg-muted/20 border border-muted/40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover backdrop-blur-md border border-muted/40">
                {assetTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Notes (optional)
            </Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Additional notes about this asset..."
              className="bg-muted/20 border border-muted/40 min-h-[80px]"
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!isValid || isSubmitting}
              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0"
            >
              {isSubmitting ? "Adding..." : "Add Asset"}
            </Button>
          </div>
        </motion.form>
      </DialogContent>
    </Dialog>
  );
}
