import { useState } from 'react';
import { Phone, Mail, Users, FileText, Bell, Trash2 } from 'lucide-react';
import { GlassPanel, GlassPanelHeader } from '@/components/ui/glass-panel';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CompanyInteraction, InteractionType } from '@/types/portfolio';
import { formatDistanceToNow } from 'date-fns';

interface NotesModeProps {
  interactions: CompanyInteraction[];
  loading: boolean;
  onCreateInteraction: (data: {
    interaction_type: InteractionType;
    content: string;
  }) => Promise<CompanyInteraction | null>;
  onDeleteInteraction: (id: string) => Promise<boolean>;
}

const interactionIcons: Record<InteractionType, React.ReactNode> = {
  note: <FileText className="h-4 w-4" />,
  call: <Phone className="h-4 w-4" />,
  meeting: <Users className="h-4 w-4" />,
  email: <Mail className="h-4 w-4" />,
  update: <Bell className="h-4 w-4" />,
};

const interactionLabels: Record<InteractionType, string> = {
  note: 'Note',
  call: 'Call',
  meeting: 'Meeting',
  email: 'Email',
  update: 'Update',
};

export function NotesMode({
  interactions,
  loading,
  onCreateInteraction,
  onDeleteInteraction,
}: NotesModeProps) {
  const [content, setContent] = useState('');
  const [type, setType] = useState<InteractionType>('note');
  const [creating, setCreating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setCreating(true);
    try {
      await onCreateInteraction({
        interaction_type: type,
        content: content.trim(),
      });
      setContent('');
      setType('note');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Composer */}
      <GlassPanel>
        <GlassPanelHeader title="Add Note" />
        <form onSubmit={handleSubmit} className="space-y-3">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Add a note or interaction..."
            className="min-h-[100px] resize-none bg-background/50"
            disabled={creating}
          />
          <div className="flex items-center gap-2">
            <Select value={type} onValueChange={(v) => setType(v as InteractionType)}>
              <SelectTrigger className="w-36 h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="note">Note</SelectItem>
                <SelectItem value="call">Call</SelectItem>
                <SelectItem value="meeting">Meeting</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="update">Update</SelectItem>
              </SelectContent>
            </Select>
            <Button
              type="submit"
              size="sm"
              disabled={!content.trim() || creating}
            >
              {creating ? 'Adding...' : 'Add'}
            </Button>
          </div>
        </form>
      </GlassPanel>

      {/* Interactions list */}
      <GlassPanel>
        <GlassPanelHeader title="All Notes & Interactions" />
        
        {loading ? (
          <div className="text-sm text-muted-foreground py-8 text-center">
            Loading...
          </div>
        ) : interactions.length === 0 ? (
          <div className="text-sm text-muted-foreground py-8 text-center">
            No notes yet. Add your first note above.
          </div>
        ) : (
          <div className="space-y-3">
            {interactions.map((interaction) => (
              <div
                key={interaction.id}
                className="group flex items-start gap-3 p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  {interactionIcons[interaction.interaction_type]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium">
                      {interactionLabels[interaction.interaction_type]}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(interaction.occurred_at), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm text-foreground whitespace-pre-wrap">
                    {interaction.content}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                  onClick={() => onDeleteInteraction(interaction.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </GlassPanel>
    </div>
  );
}
