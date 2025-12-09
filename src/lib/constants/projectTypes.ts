import { Search, FileText, Map, Code, Folder } from 'lucide-react';

export const PROJECT_TYPES = {
  research: {
    value: 'research',
    label: 'Research / Deep Dive',
    icon: Search,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
  },
  thought_piece: {
    value: 'thought_piece',
    label: 'Thought Piece / Memo',
    icon: FileText,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
  },
  market_map: {
    value: 'market_map',
    label: 'Market Map / Landscape',
    icon: Map,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
  },
  coding: {
    value: 'coding',
    label: 'Coding / Building',
    icon: Code,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
  },
  other: {
    value: 'other',
    label: 'Other / General',
    icon: Folder,
    color: 'text-slate-500',
    bgColor: 'bg-slate-500/10',
  },
} as const;

export const PROJECT_STATUSES = {
  active: {
    value: 'active',
    label: 'Active',
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
    dotColor: 'bg-emerald-500',
  },
  paused: {
    value: 'paused',
    label: 'Paused',
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    dotColor: 'bg-amber-500',
  },
  completed: {
    value: 'completed',
    label: 'Completed',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    dotColor: 'bg-blue-500',
  },
  archived: {
    value: 'archived',
    label: 'Archived',
    color: 'text-slate-400',
    bgColor: 'bg-slate-400/10',
    dotColor: 'bg-slate-400',
  },
} as const;

export type ProjectType = keyof typeof PROJECT_TYPES;
export type ProjectStatus = keyof typeof PROJECT_STATUSES;

export const PROJECT_TYPE_OPTIONS = Object.values(PROJECT_TYPES);
export const PROJECT_STATUS_OPTIONS = Object.values(PROJECT_STATUSES);
