import { 
  FileText, 
  Paperclip, 
  Mail, 
  CheckCircle2, 
  ChevronRight 
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { DealRoomTab } from '@/pages/PipelineCompanyDetail';
import { PipelineInteraction } from '@/types/pipelineExtended';
import { PipelineAttachment } from '@/hooks/usePipelineAttachments';
import { LinkedCommunication } from '@/hooks/useCompanyLinkedCommunications';

interface PipelineTask {
  id: string;
  content: string;
  completed: boolean;
  completed_at?: string | null;
  scheduled_for?: string | null;
}

interface DealSignalsProps {
  recentNote?: PipelineInteraction | null;
  recentFile?: PipelineAttachment | null;
  recentComm?: LinkedCommunication | null;
  lastCompletedTask?: PipelineTask | null;
  onNavigate: (tab: DealRoomTab) => void;
}

interface SignalRowProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  timestamp: string;
  onClick: () => void;
}

function SignalRow({ icon: Icon, label, timestamp, onClick }: SignalRowProps) {
  const relativeTime = formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 py-2 px-1 hover:bg-muted/30 rounded-lg transition-colors group text-left"
    >
      <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
      <span className="flex-1 text-sm text-foreground truncate">{label}</span>
      <span className="text-xs text-muted-foreground flex-shrink-0">{relativeTime}</span>
      <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
    </button>
  );
}

export function DealSignals({ 
  recentNote, 
  recentFile, 
  recentComm, 
  lastCompletedTask,
  onNavigate 
}: DealSignalsProps) {
  // Build signals array, filtering out nulls
  const signals: { 
    key: string; 
    icon: React.ComponentType<{ className?: string }>; 
    label: string; 
    timestamp: string;
    tab: DealRoomTab;
  }[] = [];

  if (recentNote) {
    signals.push({
      key: 'note',
      icon: FileText,
      label: recentNote.content.slice(0, 60) + (recentNote.content.length > 60 ? '...' : ''),
      timestamp: recentNote.occurred_at,
      tab: 'notes',
    });
  }

  if (recentFile) {
    signals.push({
      key: 'file',
      icon: Paperclip,
      label: recentFile.file_name,
      timestamp: recentFile.created_at,
      tab: 'files',
    });
  }

  if (recentComm) {
    signals.push({
      key: 'comm',
      icon: Mail,
      label: recentComm.title || 'Communication',
      timestamp: recentComm.timestamp,
      tab: 'comms',
    });
  }

  if (lastCompletedTask) {
    signals.push({
      key: 'task',
      icon: CheckCircle2,
      label: `✓ ${lastCompletedTask.content}`,
      timestamp: lastCompletedTask.completed_at || lastCompletedTask.scheduled_for || new Date().toISOString(),
      tab: 'tasks',
    });
  }

  // Don't render anything if no signals exist
  if (signals.length === 0) {
    return null;
  }

  // Sort by timestamp (most recent first) and limit to 5
  const sortedSignals = signals
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5);

  return (
    <div className="pt-4 border-t border-border/50">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2 px-1">
        Signals
      </p>
      
      <div className="space-y-0.5">
        {sortedSignals.map((signal) => (
          <SignalRow
            key={signal.key}
            icon={signal.icon}
            label={signal.label}
            timestamp={signal.timestamp}
            onClick={() => onNavigate(signal.tab)}
          />
        ))}
      </div>
    </div>
  );
}
