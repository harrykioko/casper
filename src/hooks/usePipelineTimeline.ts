import { useMemo } from 'react';
import { PipelineInteraction, PipelineTimelineEvent } from '@/types/pipelineExtended';
import { PipelineTask } from './usePipelineTasks';
import { InteractionType } from '@/types/portfolio';

export function usePipelineTimeline(
  interactions: PipelineInteraction[],
  tasks: PipelineTask[]
): PipelineTimelineEvent[] {
  return useMemo(() => {
    const events: PipelineTimelineEvent[] = [];

    // Add interaction events
    for (const interaction of interactions) {
      events.push({
        id: `interaction-${interaction.id}`,
        type: 'interaction',
        timestamp: interaction.occurred_at,
        title: getInteractionTitle(interaction.interaction_type),
        description: interaction.content,
        icon: interaction.interaction_type,
        metadata: { interaction },
      });
    }

    // Add task created events
    for (const task of tasks) {
      events.push({
        id: `task-created-${task.id}`,
        type: 'task_created',
        timestamp: task.created_at,
        title: 'Task created',
        description: task.content,
        icon: 'task',
        metadata: { task },
      });

      // Add task completed events
      if (task.completed && task.completed_at) {
        events.push({
          id: `task-completed-${task.id}`,
          type: 'task_completed',
          timestamp: task.completed_at,
          title: 'Task completed',
          description: task.content,
          icon: 'task',
          metadata: { task },
        });
      }
    }

    // Sort by timestamp descending
    events.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return events;
  }, [interactions, tasks]);
}

function getInteractionTitle(type: InteractionType): string {
  switch (type) {
    case 'note':
      return 'Note added';
    case 'call':
      return 'Call logged';
    case 'meeting':
      return 'Meeting recorded';
    case 'email':
      return 'Email logged';
    case 'update':
      return 'Update posted';
    default:
      return 'Interaction';
  }
}
