import { useState } from 'react';
import { Phone, Mail, Users, FileText, Bell, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { format, formatDistanceToNow } from 'date-fns';

interface CompanyInteractionsSectionProps {
  interactions: CompanyInteraction[];
  loading: boolean;
  onCreateInteraction: (data: {
    interaction_type: InteractionType;
    content: string;
  }) => Promise<CompanyInteraction | null>;
  onDeleteInteraction: (id: string) => Promise<boolean>;
}

const interactionIcons: Record<InteractionType, React.ReactNode> = {
  note: <FileText className="h-3.5 w-3.5" />,
  call: <Phone className="h-3.5 w-3.5" />,
  meeting: <Users className="h-3.5 w-3.5" />,
  email: <Mail className="h-3.5 w-3.5" />,
  update: <Bell className="h-3.5 w-3.5" />,
};

const interactionLabels: Record<InteractionType, string> = {
  note: 'Note',
  call: 'Call',
  meeting: 'Meeting',
  email: 'Email',
  update: 'Update',
};

export function CompanyInteractionsSection({
  interactions,
  loading,
  onCreateInteraction,
  onDeleteInteraction,
}: CompanyInteractionsSectionProps) {
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

  const recentInteractions = interactions.slice(0, 5);

  return (
    <Card className="bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium">Notes & Interactions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Composer */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Add a note or interaction..."
            className="min-h-[80px] resize-none"
            disabled={creating}
          />
          <div className="flex items-center gap-2">
            <Select value={type} onValueChange={(v) => setType(v as InteractionType)}>
              <SelectTrigger className="w-32 h-8">
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

        {/* Recent interactions */}
        {loading ? (
          <div className="text-sm text-muted-foreground py-4 text-center">
            Loading interactions...
          </div>
        ) : recentInteractions.length === 0 ? (
          <div className="text-sm text-muted-foreground py-4 text-center">
            No interactions yet. Add a note to get started.
          </div>
        ) : (
          <div className="space-y-3 pt-2">
            <div className="text-xs font-medium text-muted-foreground">
              Recent
            </div>
            {recentInteractions.map((interaction) => (
              <InteractionItem
                key={interaction.id}
                interaction={interaction}
                onDelete={() => onDeleteInteraction(interaction.id)}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface InteractionItemProps {
  interaction: CompanyInteraction;
  onDelete: () => void;
}

function InteractionItem({ interaction, onDelete }: InteractionItemProps) {
  return (
    <div className="group flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary">
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
        <p className="text-sm text-foreground line-clamp-2">
          {interaction.content}
        </p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
        onClick={onDelete}
      >
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  );
}
