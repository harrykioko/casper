/**
 * Priority System - Unified Model
 *
 * This file defines the TypeScript interfaces for the proposed unified priority system.
 * See docs/priority_system/02_proposed_model.md for full design documentation.
 *
 * Status: Phase 1 - Types defined but not yet wired into runtime behavior
 *
 * TODO: Implement in Phase 2
 * - Create useUnifiedPriority() hook
 * - Map all data sources to PriorityItem[]
 * - Implement scoring and filtering logic
 */

/**
 * PrioritySourceType
 * All possible sources of priority items in CASPER
 */
export type PrioritySourceType =
  | "task"
  | "inbox"
  | "portfolio_company"
  | "pipeline_company"
  | "calendar_event"
  | "reading_item"
  | "nonnegotiable"
  | "commitment"
  | "project"; // Future: project milestones, deadlines

/**
 * PriorityIconType
 * Visual indicators for different priority types
 */
export type PriorityIconType =
  | "overdue"           // Red triangle - past deadline
  | "due-today"         // Orange clock - due today
  | "due-soon"          // Yellow clock - due in 1-3 days
  | "stale-company"     // Orange alert - no contact in >14 days
  | "unread-email"      // Envelope - unread inbox item
  | "upcoming-event"    // Calendar - calendar event starting soon
  | "unread-reading"    // Book - unread reading item
  | "nonnegotiable"     // Star - daily habit/commitment
  | "commitment"        // Handshake - promise made to someone
  | "commitment-broken" // Broken handshake - overdue commitment
  | "high-importance";  // Red flag - high priority task

/**
 * PrioritySignal
 * Individual factor contributing to priority score
 * Used for explainability and debugging
 */
export interface PrioritySignal {
  source: string;        // e.g., "deadline", "staleness", "importance", "recency"
  weight: number;        // Contribution to final score (0-1)
  description: string;   // Human-readable explanation
  timestamp?: string;    // When this signal was last updated (ISO string)
}

/**
 * PriorityItem
 * Normalized representation of any priority signal across all data sources
 *
 * This is the core interface for the unified priority model. All data sources
 * (tasks, inbox, companies, calendar, etc.) are mapped to this common structure.
 *
 * Design principles:
 * - Multi-dimensional scoring (urgency, importance, recency, commitment)
 * - Explainable (reasoning field explains why item is prioritized)
 * - Actionable (includes context for navigation and quick actions)
 * - Time-aware (scores update as timestamps change)
 *
 * See docs/priority_system/02_proposed_model.md for mapping rules per source type.
 */
export interface PriorityItem {
  // ============================================================================
  // Identity
  // ============================================================================
  id: string;                      // Unique priority item ID (generated, not source ID)
  sourceType: PrioritySourceType;  // What it came from (task, inbox, company, etc.)
  sourceId: string;                // Original entity ID in source table

  // ============================================================================
  // Display
  // ============================================================================
  title: string;                   // Short, action-oriented title (e.g., "Follow up with Acme")
  subtitle?: string;               // Secondary context (e.g., "Overdue by 3 days")
  description?: string;            // Full description or content
  contextLabels?: string[];        // Tags like ["Portfolio: Cashmere", "High priority", "IC prep"]
  iconType?: PriorityIconType;     // Visual indicator

  // ============================================================================
  // Core Scoring Dimensions (0-1 normalized scores)
  // ============================================================================
  urgencyScore: number;            // Time sensitivity (deadlines, event proximity, email age)
  importanceScore: number;         // Strategic value, explicit priority, stakes
  recencyScore: number;            // How recently it became relevant or was touched
  commitmentScore: number;         // Explicit commitments (calendar, nonnegotiables, promises)
  effortScore?: number;            // Optional: estimated time to complete (0 = quick, 1 = large)

  // ============================================================================
  // Aggregated Priority Score
  // ============================================================================
  priorityScore: number;           // Final computed score for sorting (weighted sum of dimensions)

  // ============================================================================
  // Timestamps
  // ============================================================================
  dueAt?: string | null;           // ISO date for deadlines (tasks)
  eventStartAt?: string | null;    // ISO date for calendar events
  snoozedUntil?: string | null;    // ISO date if user snoozed this item
  createdAt?: string;              // When the underlying entity was created
  lastTouchedAt?: string;          // When it was last updated/interacted with

  // ============================================================================
  // State Flags
  // ============================================================================
  isBlocked?: boolean;             // Blocked on something else
  isCompleted?: boolean;           // Already done
  isSnoozed?: boolean;             // User explicitly snoozed
  isOverdue?: boolean;             // Past due date
  isDueToday?: boolean;            // Due today
  isDueSoon?: boolean;             // Due in next 1-3 days
  isTopPriority?: boolean;         // User-flagged as top priority (v1 override)

  // ============================================================================
  // Related Entities (for context and navigation)
  // ============================================================================
  companyId?: string | null;       // Portfolio or pipeline company ID
  companyName?: string | null;     // Company name (for display)
  companyLogoUrl?: string | null;  // Company logo URL (for display)
  projectId?: string | null;       // Project ID
  projectName?: string | null;     // Project name (for display)
  projectColor?: string | null;    // Project color (for display)

  // ============================================================================
  // Explainability
  // ============================================================================
  reasoning: string;               // Human-readable explanation (e.g., "Due tomorrow, high importance, linked to Cashmere IC")
  signals: PrioritySignal[];       // Contributing factors to the score (for debugging/transparency)
}

/**
 * PriorityConfig
 * Configuration for priority scoring algorithm
 *
 * These weights can be adjusted per user or globally to tune the priority model.
 * Default weights are designed based on product-minded heuristics (see docs).
 *
 * Future: Make these user-configurable or ML-learned
 */
export interface PriorityConfig {
  // Scoring weights (should sum to ~1.0 for normalization)
  weights: {
    urgency: number;      // Default: 0.35 (35%) - Deadlines and time sensitivity
    importance: number;   // Default: 0.30 (30%) - Strategic value and explicit priority
    recency: number;      // Default: 0.15 (15%) - How recently it became relevant
    commitment: number;   // Default: 0.20 (20%) - Explicit commitments (calendar, nonnegotiables)
    effort: number;       // Default: 0.00 (0%)  - Optional: quick wins boost (not yet implemented)
  };

  // Display limits
  maxItems: number;              // Default: 10 - Maximum items to show in priority list
  minScore: number;              // Default: 0.3 - Minimum priority score to display (filter noise)
  maxItemsPerSource: number;     // Default: 3 - Maximum items from same source type (diversity)

  // Staleness thresholds (days)
  companyStaleThreshold: number; // Default: 14 - Days without interaction before company is "stale"
  taskStaleThreshold: number;    // Default: 7 - Days without update before task is "stale"

  // Time windows (hours)
  calendarUpcomingWindow: number;  // Default: 48 - Hours ahead to consider calendar events
  inboxUrgentWindow: number;       // Default: 4 - Hours for inbox items to be "urgent"
}

/**
 * Default priority configuration (Full v2+ model)
 * See docs/priority_system/02_proposed_model.md for weight rationale
 */
export const DEFAULT_PRIORITY_CONFIG: PriorityConfig = {
  weights: {
    urgency: 0.35,      // 35% - Time sensitivity is primary driver
    importance: 0.30,   // 30% - Strategic value prevents low-stakes work from dominating
    recency: 0.15,      // 15% - Fresh items are more actionable
    commitment: 0.20,   // 20% - Explicit commitments must be honored
    effort: 0.00,       // 0%  - Not yet implemented (future: boost quick wins)
  },
  maxItems: 10,
  minScore: 0.3,
  maxItemsPerSource: 3,
  companyStaleThreshold: 14,
  taskStaleThreshold: 7,
  calendarUpcomingWindow: 48,
  inboxUrgentWindow: 4,
};

/**
 * V1 Priority Configuration (Lightweight, Production-Ready)
 *
 * This is the simplified v1 configuration focusing on:
 * - 3 data sources only (tasks, inbox, calendar)
 * - 2-dimensional scoring (urgency 60%, importance 40%)
 * - No recency, commitment, or effort weighting
 * - No diversity rules or score thresholds
 * - Simple top-8 selection
 *
 * Rationale:
 * - Urgency (60%): Time pressure is the primary driver of "what needs attention now"
 * - Importance (40%): Explicit priority (high/medium/low) and unread status matter
 * - Recency/Commitment: Computed for debugging but NOT weighted in v1
 *
 * See docs/priority_system/03_v1_tuning_guide.md for tuning instructions
 */
export const V1_PRIORITY_CONFIG: PriorityConfig = {
  weights: {
    urgency: 0.60,      // 60% - Time sensitivity (deadlines, event proximity, email age)
    importance: 0.40,   // 40% - Explicit priority and flags (high/medium/low, unread)
    recency: 0.00,      // 0%  - NOT USED in v1 (computed for debugging only)
    commitment: 0.00,   // 0%  - NOT USED in v1 (deferred to v2)
    effort: 0.00,       // 0%  - NOT USED in v1 (deferred to v2)
  },
  maxItems: 8,              // v1: Show top 8 items
  minScore: 0.0,            // v1: NO score threshold (all items eligible)
  maxItemsPerSource: 999,   // v1: NO diversity rules (deferred to v2)
  companyStaleThreshold: 14,
  taskStaleThreshold: 7,
  calendarUpcomingWindow: 48,  // Only show events in next 48 hours
  inboxUrgentWindow: 4,         // Inbox items <4 hours old are "urgent"
};

/**
 * V2 Priority Configuration (Full Coverage)
 *
 * Expands v1 to include all 8 data sources:
 * - Tasks, Inbox, Calendar (from v1)
 * - Portfolio companies (stale = needs attention)
 * - Pipeline companies (next_steps, close_date)
 * - Reading list (unread items)
 * - Nonnegotiables (habit tracking)
 *
 * Enhanced scoring:
 * - 4-dimensional (urgency 30%, importance 25%, commitment 25%, recency 10%, effort 10%)
 * - Diversity rules (max 4 items per source)
 * - Minimum score threshold (0.2)
 */
export const V2_PRIORITY_CONFIG: PriorityConfig = {
  weights: {
    urgency: 0.30,      // 30% - Time sensitivity (deadlines, staleness)
    importance: 0.25,   // 25% - Explicit priority, VIP status
    recency: 0.10,      // 10% - How recently it became relevant
    commitment: 0.25,   // 25% - Commitments score higher
    effort: 0.10,       // 10% - Quick wins get a boost when time-constrained
  },
  maxItems: 12,             // v2: Show top 12 items
  minScore: 0.2,            // v2: Filter out very low-signal items
  maxItemsPerSource: 4,     // v2: Diversity - no source dominates
  companyStaleThreshold: 14,
  taskStaleThreshold: 7,
  calendarUpcomingWindow: 48,
  inboxUrgentWindow: 4,
};

/**
 * EffortCategory
 * Bucket classification for task effort
 */
export type EffortCategory = 'quick' | 'medium' | 'deep' | 'unknown';

/**
 * Get effort category from minutes
 */
export function getEffortCategory(minutes: number | null | undefined): EffortCategory {
  if (minutes === null || minutes === undefined) return 'unknown';
  if (minutes <= 15) return 'quick';
  if (minutes <= 60) return 'medium';
  return 'deep';
}

/**
 * PriorityUserFeedback
 * Track user actions on priority items for learning
 *
 * Future: Use this data to adapt scoring weights per user
 */
export interface PriorityUserFeedback {
  priorityItemId: string;
  sourceType: PrioritySourceType;
  sourceId: string;
  action: "completed" | "snoozed" | "dismissed" | "clicked" | "ignored";
  actionTimestamp: string;
  priorityScoreAtTime: number;
  timeToAction?: number; // Milliseconds from first shown to action
}
