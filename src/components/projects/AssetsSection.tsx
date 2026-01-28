import { useState } from "react";
import { Plus, ExternalLink, Trash2, Globe, Github, Hash, FileText, Figma, HardDrive, Link } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useAssets, Asset, AssetType } from "@/hooks/useAssets";
import { AddAssetModal } from "@/components/modals/AddAssetModal";
import { GlassModuleCard } from "./GlassModuleCard";
import { ProjectEmptyState } from "./ProjectEmptyState";
import { cn } from "@/lib/utils";

interface AssetsSectionProps {
  projectId: string;
}

const assetTypeConfig: Record<AssetType, { icon: React.ComponentType<any>; color: string; bgColor: string }> = {
  domain: { icon: Globe, color: "text-green-600 dark:text-green-400", bgColor: "bg-green-500/10" },
  repository: { icon: Github, color: "text-blue-600 dark:text-blue-400", bgColor: "bg-blue-500/10" },
  social: { icon: Hash, color: "text-purple-600 dark:text-purple-400", bgColor: "bg-purple-500/10" },
  notion: { icon: FileText, color: "text-gray-600 dark:text-gray-400", bgColor: "bg-gray-500/10" },
  figma: { icon: Figma, color: "text-pink-600 dark:text-pink-400", bgColor: "bg-pink-500/10" },
  drive: { icon: HardDrive, color: "text-yellow-600 dark:text-yellow-400", bgColor: "bg-yellow-500/10" },
  other: { icon: Globe, color: "text-gray-600 dark:text-gray-400", bgColor: "bg-gray-500/10" }
};

function AssetCard({ asset, onDelete }: { asset: Asset; onDelete: (id: string) => void }) {
  const typeConfig = assetTypeConfig[asset.type];
  const Icon = typeConfig.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className={cn(
        "group/asset relative p-3 rounded-xl transition-all duration-200",
        "bg-white/30 dark:bg-white/[0.03]",
        "border border-white/20 dark:border-white/[0.06]",
        "hover:bg-white/50 dark:hover:bg-white/[0.06]",
        "hover:translate-y-[-1px] hover:shadow-sm"
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn(
          "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0",
          typeConfig.bgColor
        )}>
          <Icon className={cn("w-4 h-4", typeConfig.color)} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-medium text-sm text-foreground truncate">{asset.name}</h4>
            
            <div className="flex items-center gap-1 opacity-0 group-hover/asset:opacity-100 transition-opacity">
              <Button
                size="sm"
                variant="ghost"
                className="w-6 h-6 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                onClick={() => onDelete(asset.id)}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="w-6 h-6 p-0 text-muted-foreground hover:text-primary hover:bg-primary/10"
                onClick={() => window.open(asset.url, '_blank')}
              >
                <ExternalLink className="w-3 h-3" />
              </Button>
            </div>
          </div>
          
          <div className="flex items-center gap-2 mt-1">
            <span className={cn(
              "inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium",
              typeConfig.bgColor, 
              typeConfig.color
            )}>
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

export function AssetsSection({ projectId }: AssetsSectionProps) {
  const { assets, loading, addAsset, deleteAsset } = useAssets(projectId);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  if (loading) {
    return (
      <GlassModuleCard
        icon={<Link className="w-4 h-4" />}
        title="Assets"
        accentColor="#8b5cf6"
      >
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-muted/20 rounded-xl animate-pulse" />
          ))}
        </div>
      </GlassModuleCard>
    );
  }

  return (
    <>
      <GlassModuleCard
        icon={<Link className="w-4 h-4" />}
        title="Assets"
        count={assets.length}
        onAdd={() => setIsAddModalOpen(true)}
        addLabel="Add Asset"
        accentColor="#8b5cf6"
      >
        {assets.length === 0 ? (
          <ProjectEmptyState
            icon={<Link className="w-7 h-7" />}
            title="No assets yet"
            description="Link your domains, repos, or social accounts."
            actionLabel="Add Asset"
            onAction={() => setIsAddModalOpen(true)}
          />
        ) : (
          <motion.div className="space-y-2" layout>
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
      </GlassModuleCard>

      <AddAssetModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onAddAsset={addAsset}
      />
    </>
  );
}
