
import { useState } from "react";
import { Plus, ExternalLink, Trash2, Globe, Github, Hash, FileText, Figma, HardDrive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useAssets, Asset, AssetType } from "@/hooks/useAssets";
import { AddAssetModal } from "@/components/modals/AddAssetModal";

interface AssetsSectionProps {
  projectId: string;
}

const assetTypeConfig: Record<AssetType, { icon: React.ComponentType<any>; color: string; bgColor: string }> = {
  domain: { icon: Globe, color: "text-green-700 dark:text-green-400", bgColor: "bg-green-100 dark:bg-green-900/30" },
  repository: { icon: Github, color: "text-blue-700 dark:text-blue-400", bgColor: "bg-blue-100 dark:bg-blue-900/30" },
  social: { icon: Hash, color: "text-purple-700 dark:text-purple-400", bgColor: "bg-purple-100 dark:bg-purple-900/30" },
  notion: { icon: FileText, color: "text-gray-700 dark:text-gray-400", bgColor: "bg-gray-100 dark:bg-gray-900/30" },
  figma: { icon: Figma, color: "text-pink-700 dark:text-pink-400", bgColor: "bg-pink-100 dark:bg-pink-900/30" },
  drive: { icon: HardDrive, color: "text-yellow-700 dark:text-yellow-400", bgColor: "bg-yellow-100 dark:bg-yellow-900/30" },
  other: { icon: Globe, color: "text-gray-700 dark:text-gray-400", bgColor: "bg-gray-100 dark:bg-gray-900/30" }
};

function AssetCard({ asset, onDelete }: { asset: Asset; onDelete: (id: string) => void }) {
  const [isHovered, setIsHovered] = useState(false);
  const typeConfig = assetTypeConfig[asset.type];
  const Icon = typeConfig.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="relative group bg-muted/20 backdrop-blur border border-muted/30 rounded-xl p-3 hover:bg-muted/30 hover:ring-1 hover:ring-muted/50 transition-all duration-200"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-start gap-3">
        <div className={`w-8 h-8 rounded-lg ${typeConfig.bgColor} flex items-center justify-center flex-shrink-0`}>
          <Icon className={`w-4 h-4 ${typeConfig.color}`} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-medium text-sm text-foreground truncate">{asset.name}</h4>
            
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                size="sm"
                variant="ghost"
                className="w-6 h-6 p-0 hover:bg-destructive/20 hover:text-destructive"
                onClick={() => onDelete(asset.id)}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="w-6 h-6 p-0 hover:bg-primary/20 hover:text-primary"
                onClick={() => window.open(asset.url, '_blank')}
              >
                <ExternalLink className="w-3 h-3" />
              </Button>
            </div>
          </div>
          
          <div className="flex items-center gap-2 mt-1">
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${typeConfig.bgColor} ${typeConfig.color}`}>
              {asset.type}
            </span>
          </div>
          
          {asset.notes && (
            <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
              {asset.notes}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-12">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/20 flex items-center justify-center">
        <Globe className="w-8 h-8 text-muted-foreground" />
      </div>
      <p className="text-sm text-muted-foreground">
        No assets yet – link your domains, repos, or social accounts.
      </p>
    </div>
  );
}

export function AssetsSection({ projectId }: AssetsSectionProps) {
  const { assets, loading, addAsset, deleteAsset } = useAssets(projectId);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  if (loading) {
    return (
      <div className="bg-muted/20 backdrop-blur border border-muted/30 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground">Assets</h3>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-muted/20 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-muted/20 backdrop-blur border border-muted/30 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground">Assets</h3>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsAddModalOpen(true)}
            className="h-8 gap-1 hover:bg-primary/20 hover:text-primary"
          >
            <Plus className="w-4 h-4" />
            Add Asset
          </Button>
        </div>

        {assets.length === 0 ? (
          <EmptyState />
        ) : (
          <motion.div className="space-y-3" layout>
            <AnimatePresence>
              {assets.map((asset) => (
                <AssetCard
                  key={asset.id}
                  asset={asset}
                  onDelete={deleteAsset}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      <AddAssetModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onAddAsset={addAsset}
      />
    </>
  );
}
