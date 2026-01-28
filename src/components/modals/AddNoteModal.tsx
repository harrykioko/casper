import { useState, useEffect } from 'react';
import { StickyNote, Building2, FolderKanban, CheckSquare, BookOpen, ChevronDown } from 'lucide-react';
import { GlassModal, GlassModalContent, GlassModalHeader, GlassModalTitle } from '@/components/ui/GlassModal';
import { NoteEditor } from '@/components/notes/NoteEditor';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { createNote } from '@/hooks/useNotes';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import type { NoteTargetType, NoteContext } from '@/types/notes';

interface AddNoteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultContext?: NoteContext;
}

type TargetOption = {
  id: string;
  name: string;
};

const targetTypeConfig: Record<NoteTargetType, { label: string; icon: React.ElementType }> = {
  task: { label: 'Task', icon: CheckSquare },
  company: { label: 'Company', icon: Building2 },
  project: { label: 'Project', icon: FolderKanban },
  reading_item: { label: 'Reading Item', icon: BookOpen },
};

export function AddNoteModal({ open, onOpenChange, defaultContext }: AddNoteModalProps) {
  const { user } = useAuth();
  const [targetType, setTargetType] = useState<NoteTargetType>(defaultContext?.targetType || 'project');
  const [targetId, setTargetId] = useState<string>(defaultContext?.targetId || '');
  const [targetOptions, setTargetOptions] = useState<TargetOption[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [targetPickerOpen, setTargetPickerOpen] = useState(false);

  useEffect(() => {
    if (!user || !open) return;

    const fetchOptions = async () => {
      setLoadingOptions(true);
      setTargetId('');
      
      try {
        let options: TargetOption[] = [];

        switch (targetType) {
          case 'task': {
            const { data } = await supabase
              .from('tasks')
              .select('id, content')
              .eq('created_by', user.id)
              .eq('completed', false)
              .order('created_at', { ascending: false })
              .limit(50);
            options = (data || []).map(t => ({ id: t.id, name: t.content }));
            break;
          }
          case 'company': {
            const { data } = await supabase
              .from('companies')
              .select('id, name')
              .eq('created_by', user.id)
              .order('name')
              .limit(50);
            options = (data || []).map(c => ({ id: c.id, name: c.name }));
            break;
          }
          case 'project': {
            const { data } = await supabase
              .from('projects')
              .select('id, name')
              .eq('created_by', user.id)
              .order('name')
              .limit(50);
            options = (data || []).map(p => ({ id: p.id, name: p.name }));
            break;
          }
          case 'reading_item': {
            const { data } = await supabase
              .from('reading_items')
              .select('id, title')
              .eq('created_by', user.id)
              .eq('is_archived', false)
              .order('created_at', { ascending: false })
              .limit(50);
            options = (data || []).map(r => ({ id: r.id, name: r.title }));
            break;
          }
        }

        setTargetOptions(options);
      } catch (err) {
        console.error('Error fetching target options:', err);
      } finally {
        setLoadingOptions(false);
      }
    };

    fetchOptions();
  }, [targetType, user, open]);

  useEffect(() => {
    if (defaultContext && open) {
      setTargetType(defaultContext.targetType);
      setTargetId(defaultContext.targetId);
    }
  }, [defaultContext, open]);

  const handleSave = async (payload: { title?: string; content: string }) => {
    if (!targetId) return;

    const result = await createNote({
      ...payload,
      primaryContext: { targetType, targetId },
    });

    if (result) {
      onOpenChange(false);
      setTargetId('');
    }
  };

  const selectedTarget = targetOptions.find(t => t.id === targetId);
  const TargetIcon = targetTypeConfig[targetType].icon;

  return (
    <GlassModal open={open} onOpenChange={onOpenChange}>
      <GlassModalContent className="max-w-lg">
        <GlassModalHeader>
          <GlassModalTitle className="flex items-center gap-2">
            <StickyNote className="w-5 h-5 text-amber-500" />
            <span>New Note</span>
          </GlassModalTitle>
        </GlassModalHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground uppercase tracking-wide">
              Attach to
            </Label>
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-[140px] justify-between">
                    <span className="flex items-center gap-2">
                      <TargetIcon className="w-4 h-4" />
                      {targetTypeConfig[targetType].label}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {(Object.keys(targetTypeConfig) as NoteTargetType[]).map((type) => {
                    const config = targetTypeConfig[type];
                    return (
                      <DropdownMenuItem
                        key={type}
                        onClick={() => setTargetType(type)}
                        className={cn(targetType === type && "bg-accent")}
                      >
                        <config.icon className="w-4 h-4 mr-2" />
                        {config.label}
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>

              <Popover open={targetPickerOpen} onOpenChange={setTargetPickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className={cn("flex-1 justify-between", !targetId && "text-muted-foreground")}
                    disabled={loadingOptions}
                  >
                    <span className="truncate">
                      {loadingOptions ? "Loading..." : selectedTarget?.name || `Select ${targetTypeConfig[targetType].label.toLowerCase()}...`}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 opacity-50 flex-shrink-0" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder={`Search ${targetTypeConfig[targetType].label.toLowerCase()}s...`} />
                    <CommandList>
                      <CommandEmpty>No {targetTypeConfig[targetType].label.toLowerCase()}s found.</CommandEmpty>
                      <CommandGroup>
                        {targetOptions.map((option) => (
                          <CommandItem
                            key={option.id}
                            value={option.name}
                            onSelect={() => {
                              setTargetId(option.id);
                              setTargetPickerOpen(false);
                            }}
                          >
                            <span className="truncate">{option.name}</span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <NoteEditor
            mode="create"
            onSave={handleSave}
            onCancel={() => onOpenChange(false)}
            className="border-0 p-0 bg-transparent backdrop-blur-none"
          />
        </div>
      </GlassModalContent>
    </GlassModal>
  );
}
