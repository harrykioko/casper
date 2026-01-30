import { CheckSquare, FileText, Users, Plus, ArrowRight } from 'lucide-react';
import { GlassPanel, GlassPanelHeader, GlassSubcard } from '@/components/ui/glass-panel';
import { Button } from '@/components/ui/button';
import { CompanyTask } from '@/hooks/useCompanyTasks';
import { CompanyInteraction, CompanyContact } from '@/types/portfolio';
import { formatDistanceToNow } from 'date-fns';
import { PortfolioMode } from '../PortfolioModeNav';

interface OverviewModeProps {
  tasks: CompanyTask[];
  interactions: CompanyInteraction[];
  founders: CompanyContact[];
  onModeChange: (mode: PortfolioMode) => void;
  onAddNote: () => void;
}

export function OverviewMode({ 
  tasks, 
  interactions, 
  founders, 
  onModeChange,
  onAddNote 
}: OverviewModeProps) {
  const openTasks = tasks.filter(t => !t.completed);
  const recentTasks = openTasks.slice(0, 2);
  const recentNotes = interactions.slice(0, 2);
  const latestInteraction = interactions[0];

  return (
    <div className="space-y-6">
      {/* At a Glance Section */}
      <section>
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-3">
          At a Glance
        </h2>
        
        <div className="grid grid-cols-2 gap-4">
          {/* Open Tasks Card */}
          <GlassPanel padding="md">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CheckSquare className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Open Tasks</span>
              </div>
              <span className="text-lg font-semibold">{openTasks.length}</span>
            </div>
            
            {recentTasks.length > 0 ? (
              <div className="space-y-2">
                {recentTasks.map(task => (
                  <div key={task.id} className="text-sm text-muted-foreground line-clamp-1">
                    {task.content}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No open tasks</p>
            )}
            
            <button 
              onClick={() => onModeChange('tasks')}
              className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 mt-3 transition-colors"
            >
              View all <ArrowRight className="h-3 w-3" />
            </button>
          </GlassPanel>

          {/* Recent Notes Card */}
          <GlassPanel padding="md">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Notes</span>
              </div>
              <span className="text-lg font-semibold">{interactions.length}</span>
            </div>
            
            {recentNotes.length > 0 ? (
              <div className="space-y-2">
                {recentNotes.map(note => (
                  <div key={note.id} className="text-sm text-muted-foreground line-clamp-1">
                    {note.content}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No notes yet</p>
            )}
            
            <button 
              onClick={() => onModeChange('notes')}
              className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 mt-3 transition-colors"
            >
              View all <ArrowRight className="h-3 w-3" />
            </button>
          </GlassPanel>
        </div>
      </section>

      {/* Key People Section */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Key People
          </h2>
          <button 
            onClick={() => onModeChange('people')}
            className="text-xs text-primary hover:text-primary/80 transition-colors"
          >
            View all
          </button>
        </div>
        
        <GlassPanel padding="md">
          {founders.length > 0 ? (
            <div className="space-y-3">
              {founders.slice(0, 3).map(founder => (
                <div key={founder.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{founder.name}</p>
                      {founder.role && (
                        <p className="text-xs text-muted-foreground">{founder.role}</p>
                      )}
                    </div>
                  </div>
                  {founder.email && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="text-xs h-7"
                      onClick={() => window.open(`mailto:${founder.email}`, '_blank')}
                    >
                      Email
                    </Button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No contacts added yet
            </p>
          )}
        </GlassPanel>
      </section>

      {/* Latest Interaction Section */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Latest Interaction
          </h2>
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={onAddNote}>
            <Plus className="h-3 w-3 mr-1" />
            Add note
          </Button>
        </div>
        
        <GlassPanel padding="md">
          {latestInteraction ? (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-medium capitalize px-2 py-0.5 bg-muted rounded">
                  {latestInteraction.interaction_type}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(latestInteraction.occurred_at), { addSuffix: true })}
                </span>
              </div>
              <p className="text-sm text-foreground line-clamp-3">
                {latestInteraction.content}
              </p>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground mb-2">No interactions yet</p>
              <Button variant="outline" size="sm" onClick={onAddNote}>
                <Plus className="h-3 w-3 mr-1" />
                Add your first note
              </Button>
            </div>
          )}
        </GlassPanel>
      </section>
    </div>
  );
}
