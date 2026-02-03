/**
 * Inbox Activity Types
 *
 * Tracks actions taken on inbox items for audit trail and analytics.
 */

export type InboxActivityActionType =
  | 'link_company'
  | 'create_task'
  | 'create_commitment'
  | 'create_pipeline_company'
  | 'mark_complete'
  | 'archive'
  | 'snooze'
  | 'dismiss_suggestion';

export interface InboxActivity {
  id: string;
  createdBy: string;
  inboxItemId: string;
  actionType: InboxActivityActionType;
  targetId?: string;
  targetType?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface InboxActivityInsert {
  inboxItemId: string;
  actionType: InboxActivityActionType;
  targetId?: string;
  targetType?: string;
  metadata?: Record<string, unknown>;
}
