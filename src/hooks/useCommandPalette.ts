
import { useState, useEffect, useMemo } from 'react';
import Fuse from 'fuse.js';
import { CommandItem, CommandGroup } from '@/types/commandPalette';
import { 
  LayoutDashboard, 
  FolderKanban, 
  MessageSquareText, 
  BookOpen, 
  Settings, 
  Plus, 
  CheckSquare, 
  Link 
} from 'lucide-react';

interface UseCommandPaletteProps {
  onNavigate?: (path: string) => void;
  onAddTask?: () => void;
  onAddProject?: () => void;
  onAddPrompt?: () => void;
  onAddLink?: () => void;
}

export function useCommandPalette({
  onNavigate,
  onAddTask,
  onAddProject,
  onAddPrompt,
  onAddLink
}: UseCommandPaletteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentCommands, setRecentCommands] = useState<string[]>([]);

  // Define all available commands
  const allCommands: CommandItem[] = useMemo(() => [
    // Navigation
    {
      id: 'nav-dashboard',
      title: 'Dashboard',
      description: 'Go to dashboard',
      icon: LayoutDashboard,
      action: () => onNavigate?.('/'),
      group: 'navigation',
      keywords: ['home', 'main']
    },
    {
      id: 'nav-projects',
      title: 'Projects',
      description: 'Manage your projects',
      icon: FolderKanban,
      action: () => onNavigate?.('/projects'),
      group: 'navigation'
    },
    {
      id: 'nav-prompts',
      title: 'Prompt Library',
      description: 'Browse and manage prompts',
      icon: MessageSquareText,
      action: () => onNavigate?.('/prompts'),
      group: 'navigation',
      keywords: ['prompts', 'templates']
    },
    {
      id: 'nav-reading',
      title: 'Reading List',
      description: 'Your saved links and articles',
      icon: BookOpen,
      action: () => onNavigate?.('/reading-list'),
      group: 'navigation',
      keywords: ['links', 'articles', 'bookmarks']
    },
    {
      id: 'nav-settings',
      title: 'Settings',
      description: 'App preferences and configuration',
      icon: Settings,
      action: () => onNavigate?.('/settings'),
      group: 'navigation',
      keywords: ['preferences', 'config']
    },
    // Quick Actions
    {
      id: 'action-task',
      title: 'New Task',
      description: 'Create a new task',
      icon: CheckSquare,
      action: () => onAddTask?.(),
      group: 'actions',
      keywords: ['add', 'create', 'todo'],
      shortcut: '⌘T'
    },
    {
      id: 'action-project',
      title: 'New Project',
      description: 'Create a new project',
      icon: FolderKanban,
      action: () => onAddProject?.(),
      group: 'actions',
      keywords: ['add', 'create']
    },
    {
      id: 'action-prompt',
      title: 'New Prompt',
      description: 'Create a new prompt',
      icon: MessageSquareText,
      action: () => onAddPrompt?.(),
      group: 'actions',
      keywords: ['add', 'create', 'template']
    },
    {
      id: 'action-link',
      title: 'Add Link',
      description: 'Add link to reading list',
      icon: Link,
      action: () => onAddLink?.(),
      group: 'actions',
      keywords: ['add', 'save', 'bookmark']
    }
  ], [onNavigate, onAddTask, onAddProject, onAddPrompt, onAddLink]);

  // Fuzzy search setup
  const fuse = useMemo(() => new Fuse(allCommands, {
    keys: [
      { name: 'title', weight: 0.7 },
      { name: 'description', weight: 0.3 },
      { name: 'keywords', weight: 0.5 }
    ],
    threshold: 0.3,
    includeScore: true
  }), [allCommands]);

  // Filter and group commands based on query
  const filteredGroups: CommandGroup[] = useMemo(() => {
    let commands = allCommands;
    
    if (query.trim()) {
      const results = fuse.search(query);
      commands = results.map(result => result.item);
      
      // Add dynamic "Create task" command if typing
      if (query.trim() && !commands.some(cmd => cmd.id === 'dynamic-task')) {
        commands.unshift({
          id: 'dynamic-task',
          title: `Create task: ${query}`,
          description: 'Create a new task with this content',
          icon: Plus,
          action: () => {
            // Create task with the query content
            onAddTask?.();
          },
          group: 'actions'
        });
      }
    }

    // Group commands
    const groups: CommandGroup[] = [];
    
    const navigationItems = commands.filter(cmd => cmd.group === 'navigation');
    const actionItems = commands.filter(cmd => cmd.group === 'actions');
    const recentItems = commands.filter(cmd => recentCommands.includes(cmd.id));

    if (recentItems.length > 0 && !query.trim()) {
      groups.push({ id: 'recent', title: 'Recent', items: recentItems });
    }
    
    if (actionItems.length > 0) {
      groups.push({ id: 'actions', title: 'Quick Actions', items: actionItems });
    }
    
    if (navigationItems.length > 0) {
      groups.push({ id: 'navigation', title: 'Navigation', items: navigationItems });
    }

    return groups;
  }, [allCommands, fuse, query, recentCommands, onAddTask]);

  // Get all items in order for keyboard navigation
  const allItems = useMemo(() => {
    return filteredGroups.flatMap(group => group.items);
  }, [filteredGroups]);

  // Reset selection when items change
  useEffect(() => {
    setSelectedIndex(0);
  }, [allItems]);

  // Keyboard navigation
  const handleKeyDown = (e: KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % allItems.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + allItems.length) % allItems.length);
        break;
      case 'Enter':
        e.preventDefault();
        if (allItems[selectedIndex]) {
          executeCommand(allItems[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        close();
        break;
    }
  };

  const executeCommand = (command: CommandItem) => {
    // Add to recent commands
    setRecentCommands(prev => {
      const updated = [command.id, ...prev.filter(id => id !== command.id)].slice(0, 5);
      localStorage.setItem('casper-recent-commands', JSON.stringify(updated));
      return updated;
    });
    
    command.action();
    close();
  };

  const open = () => {
    setIsOpen(true);
    setQuery('');
    setSelectedIndex(0);
  };

  const close = () => {
    setIsOpen(false);
    setQuery('');
    setSelectedIndex(0);
  };

  // Load recent commands from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('casper-recent-commands');
    if (saved) {
      try {
        setRecentCommands(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load recent commands:', e);
      }
    }
  }, []);

  // Keyboard event listener
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, allItems, selectedIndex]);

  return {
    isOpen,
    query,
    setQuery,
    selectedIndex,
    filteredGroups,
    allItems,
    open,
    close,
    executeCommand
  };
}
