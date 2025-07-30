import { TrendingUp, TrendingDown, Share, Star, Gem, Plus } from 'lucide-react';

export const STATUS_META = {
  total: { label: 'Total', color: 'slate', icon: TrendingUp },
  active: { label: 'Active', color: 'emerald', icon: TrendingUp },
  passed: { label: 'Passed', color: 'rose', icon: TrendingDown },
  to_share: { label: 'To Share', color: 'amber', icon: Share },
  interesting: { label: 'Interesting', color: 'sky', icon: Star },
  pearls: { label: 'Pearls', color: 'purple', icon: Gem },
  new: { label: 'New', color: 'slate', icon: Plus },
} as const;