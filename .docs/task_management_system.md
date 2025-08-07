# Task Management System Documentation

## Overview
The Casper application features a comprehensive task management system built with React, TypeScript, and Supabase. The system allows users to create, organize, and track tasks with various levels of categorization and prioritization.

## UI/Design Elements

### Visual Design System
- **Glassmorphic Theme**: The entire UI uses a glassmorphic design with `bg-muted/30` backgrounds and `backdrop-blur` effects
- **Dark Theme Default**: Optimized for dark mode with carefully chosen contrast ratios
- **Animations**: 
  - Confetti animation on task completion
  - Smooth transitions for hover states
  - Drag-and-drop animations in Kanban view
  - Framer Motion for smooth component transitions

### Color System
- **Priority Indicators**:
  - High Priority: `border-red-500`
  - Medium Priority: `border-orange-500`
  - Low Priority: `border-gray-400`
- **Status Visual Cues**:
  - Completed tasks: `opacity-60` with strikethrough text
  - Active tasks: Full opacity with hover effects

### Layout Patterns
- **Responsive Design**: Mobile-first approach with breakpoints at `lg:` for desktop
- **Card-based Layout**: Tasks displayed in card components with subtle shadows
- **Sticky Elements**: Quick tasks panel sticks to vi ewport for easy access

## Components Architecture

### Core Task Components

#### 1. **Tasks Page** (`src/pages/Tasks.tsx`)
- Main container for the task management system
- Manages view modes (List/Kanban)
- Coordinates filters and sorting
- Handles task selection and modal states

#### 2. **QuickTaskInput** (`src/components/tasks/QuickTaskInput.tsx`)
- Global task input bar at the top of the page
- Auto-focuses on mount for quick entry
- Creates "quick tasks" for rapid capture
- Minimal UI with inline submit button

#### 3. **TasksMainContent** (`src/components/tasks/TasksMainContent.tsx`)
- Container for regular tasks in list view
- 70% width on desktop layouts
- Displays tasks using TaskList component
- Shows empty state with visual placeholder

#### 4. **QuickTasksPanel** (`src/components/tasks/QuickTasksPanel.tsx`)
- Dedicated panel for quick tasks
- 30% width sidebar on desktop
- Sticky positioning for constant visibility
- Lightning bolt emoji for visual distinction

#### 5. **TasksKanbanView** (`src/components/tasks/TasksKanbanView.tsx`)
- Three-column Kanban board (To Do, In Progress, Done)
- Drag-and-drop functionality using react-beautiful-dnd
- Visual feedback during drag operations
- Automatic status updates on column change

#### 6. **TaskList** (`src/components/dashboard/TaskList.tsx`)
- Reusable list component for displaying tasks
- Handles completion animations
- Inline delete functionality
- Click-to-edit behavior

### Task Card Components

#### 7. **TaskCardContent** (`src/components/task-cards/TaskCardContent.tsx`)
- Displays task text content
- Handles text truncation
- Shows strikethrough for completed tasks

#### 8. **TaskCardMetadata** (`src/components/task-cards/TaskCardMetadata.tsx`)
- Shows task metadata (priority, project, date)
- Adapts layout for list vs kanban views
- Color-coded project badges

#### 9. **TaskCardPriority** (`src/components/task-cards/TaskCardPriority.tsx`)
- Visual priority indicator
- Color-coded badges

#### 10. **TaskCardProject** (`src/components/task-cards/TaskCardProject.tsx`)
- Project association display
- Uses project color coding

#### 11. **TaskCardDate** (`src/components/task-cards/TaskCardDate.tsx`)
- Scheduled date display
- Calendar icon with formatted dates

### Modal Components

#### 12. **TaskDetailsDialog** (`src/components/modals/TaskDetailsDialog.tsx`)
- Full task editing interface
- Keyboard shortcuts (Cmd+S to save, Esc to close)
- Delete functionality with confirmation
- Uses glassmorphic modal design

#### 13. **TaskDetailsForm** (`src/components/modals/task-details/TaskDetailsForm.tsx`)
- Form fields for all task properties
- Project and category selection
- Priority and status controls
- Date picker for scheduling

#### 14. **AddTaskDialog** (`src/components/modals/AddTaskDialog.tsx`)
- Simple modal for adding new tasks
- Loading states during submission
- Toast notifications for feedback

### Filter & Control Components

#### 15. **TasksFilters** (`src/components/tasks/TasksFilters.tsx`)
- Comprehensive filtering interface
- Category, Project, Status, Priority filters
- Sort options (Date, Priority, Project, Status)
- Toggle groups and select dropdowns

#### 16. **ViewModeToggle** (`src/components/tasks/ViewModeToggle.tsx`)
- Switch between List and Kanban views
- Visual toggle with icons

## User Flows

### 1. **Quick Task Creation Flow**
```
User clicks input → Types task → Presses Enter
→ Task created as "quick task" → Appears in Quick Tasks panel
→ Can be edited/enriched later
```

### 2. **Regular Task Creation Flow**
```
User opens Add Task modal → Fills in details
→ Selects project/category/priority → Sets due date
→ Saves task → Task appears in main list
```

### 3. **Task Completion Flow**
```
User clicks checkbox → Confetti animation plays
→ Task marked as completed → Moves to "Done" status
→ Visual opacity reduced → Strike-through applied
```

### 4. **Task Editing Flow**
```
User clicks on task → TaskDetailsDialog opens
→ Edits properties → Saves changes (Cmd+S)
→ Updates reflected immediately → Toast notification shown
```

### 5. **Kanban Workflow**
```
User switches to Kanban view → Sees three columns
→ Drags task between columns → Status auto-updates
→ Visual feedback during drag → Position saved
```

### 6. **Quick Task Triage Flow**
```
Quick tasks created → Appear in side panel
→ User reviews and enriches → Converts to regular task
→ Task moves to main list → Quick task removed
```

## Hooks and Services

### Data Management Hooks

#### 1. **useTasks** (`src/hooks/useTasks.ts`)
- **Purpose**: Core task data management
- **Features**:
  - Fetches tasks with related data (projects, categories)
  - CRUD operations (create, update, delete)
  - Data transformation between frontend/backend formats
  - Real-time state updates
- **Key Functions**:
  - `createTask()`: Creates new task with user association
  - `updateTask()`: Updates task properties
  - `deleteTask()`: Removes task from database
  - `transformTask()`: Converts DB format to frontend format

#### 2. **useTasksManager** (`src/hooks/useTasksManager.tsx`)
- **Purpose**: Business logic layer for task operations
- **Features**:
  - Wraps useTasks with additional logic
  - Handles quick task conversions
  - Status and completion management
- **Key Functions**:
  - `handleAddTask()`: Creates regular or quick tasks
  - `handleCompleteTask()`: Toggles completion state
  - `handleUpdateTaskStatus()`: Changes task workflow status
  - `handleUpdateTask()`: Full task updates with category resolution

#### 3. **useTaskDetails** (`src/hooks/useTaskDetails.ts`)
- **Purpose**: Task editing state management
- **Features**:
  - Form state for task properties
  - Validation logic
  - Update preparation

#### 4. **useTaskFiltering** (`src/hooks/useTaskFiltering.ts`)
- **Purpose**: Client-side task filtering and sorting
- **Features**:
  - Multi-criteria filtering
  - Configurable sort orders
  - Memoized for performance
- **Filter Criteria**:
  - Status (todo, in progress, done)
  - Priority (high, medium, low)
  - Category
  - Project
- **Sort Options**:
  - Date (newest first)
  - Priority (high to low)
  - Project (alphabetical)
  - Status (workflow order)

#### 5. **useProjectTasks** (`src/hooks/useProjectTasks.ts`)
- **Purpose**: Project-specific task queries
- **Features**:
  - Filters tasks by project
  - Used in project detail views

### Supporting Hooks

#### 6. **useCategories** (`src/hooks/useCategories.ts`)
- Manages task categories
- Provides category lookup functions

#### 7. **useProjects** (`src/hooks/useProjects.ts`)
- Manages project data
- Used for project filtering and display

## Backend Tables

### Tasks Table Schema
```sql
tasks: {
  id: uuid (primary key)
  content: text (required)
  completed: boolean (default: false)
  completed_at: timestamp
  created_at: timestamp
  updated_at: timestamp
  created_by: uuid (foreign key → users)
  
  -- Organization
  project_id: uuid (foreign key → projects)
  category_id: uuid (foreign key → categories)
  
  -- Properties
  priority: text (low, medium, high)
  status: text (todo, inprogress, done)
  scheduled_for: timestamp
  is_quick_task: boolean (default: false)
}
```

### Relationships
- **User Association**: Every task has a `created_by` field linking to the user
- **Project Association**: Optional link to projects table
- **Category Association**: Optional link to categories table

### Database Features
- **Row Level Security**: Tasks filtered by user authentication
- **Automatic Timestamps**: created_at and updated_at managed by Supabase
- **Soft Relationships**: Null allowed for project and category

## State Management

### Context Usage
- No global task context - uses local component state
- Tasks fetched fresh on component mount
- TanStack Query for caching and synchronization

### Data Flow
```
Component → useTasksManager → useTasks → Supabase Client
                ↓                 ↓
          Business Logic    Database Operations
                ↓                 ↓
            UI Updates      Real-time Updates
```

## Integration Points

### Current Integrations

1. **Projects Integration**
   - Tasks can be assigned to projects
   - Project colors displayed on task cards
   - Filter tasks by project

2. **Categories Integration**
   - Tasks can be categorized
   - Category-based filtering
   - Category management separate from tasks

3. **Dashboard Integration**
   - Today's tasks shown on dashboard
   - Quick access to task creation
   - Summary statistics

4. **Calendar Integration**
   - Tasks with scheduled_for dates
   - Could sync with calendar events
   - Date-based task views

## Performance Optimizations

1. **Memoization**
   - Filtered tasks memoized in useTaskFiltering
   - Prevents unnecessary re-renders

2. **Lazy Loading**
   - Task details loaded on demand
   - Modal content not rendered until opened

3. **Optimistic Updates**
   - UI updates before server confirmation
   - Rollback on error

4. **Batch Operations**
   - Multiple filter changes batched
   - Single re-render for multiple state updates

---

# Proposed Changes and Improvements

## Integration Enhancements

### 1. **Deep Calendar Integration**
- **Current State**: Tasks have scheduled_for dates but limited calendar interaction
- **Proposed Changes**:
  - Bi-directional sync between tasks and calendar events
  - Create calendar events from tasks automatically
  - Time blocking for tasks in calendar view
  - Drag tasks directly onto calendar slots
  - Show task deadlines as all-day events

### 2. **Pipeline Company Integration**
- **Current State**: No connection between tasks and pipeline companies
- **Proposed Changes**:
  - Create tasks directly from pipeline company cards
  - Link tasks to specific deals/companies
  - Auto-generate follow-up tasks based on deal stages
  - Task templates for common pipeline activities
  - Show related tasks on company detail views

### 3. **Reading List Integration**
- **Current State**: Separate reading list with no task connection
- **Proposed Changes**:
  - "Read later" tasks that link to reading list items
  - Auto-create review tasks for important articles
  - Track reading progress through task completion
  - Generate summary tasks after reading

### 4. **Prompt Builder Integration**
- **Current State**: No connection to AI prompt generation
- **Proposed Changes**:
  - Generate task descriptions using AI
  - Break down complex tasks into subtasks with AI
  - Smart task suggestions based on project context
  - Auto-categorize and prioritize tasks with AI

### 5. **Nonnegotiables Integration**
- **Current State**: Separate habit tracking system
- **Proposed Changes**:
  - Convert habits to recurring tasks
  - Show habit tasks in daily view
  - Track habit streaks through task completion
  - Unified completion interface

## UI/UX Improvements

### 1. **Enhanced Task Input**
- **Smart Natural Language Processing**
  - Parse dates from text ("tomorrow", "next Monday")
  - Extract projects/categories from hashtags (#project @category)
  - Auto-detect priority from keywords ("urgent", "ASAP")
  - Inline AI suggestions while typing

### 2. **Advanced Kanban Features**
- **Swimlanes by Project/Category**
  - Horizontal grouping in Kanban view
  - Collapsible swimlanes
  - Custom column configurations per project

- **Work-in-Progress Limits**
  - Set max items per column
  - Visual warnings when approaching limits
  - Block adding tasks to full columns

### 3. **Task Templates and Automation**
- **Reusable Task Templates**
  - Save common task structures
  - Quick-create from templates
  - Project-specific template libraries

- **Automation Rules**
  - Auto-assign tasks based on keywords
  - Scheduled task creation
  - Status-based notifications
  - Chain task dependencies

### 4. **Improved Quick Tasks**
- **Inline Enrichment**
  - Edit properties without opening modal
  - Keyboard shortcuts for quick categorization
  - Bulk operations on multiple quick tasks
  - Smart conversion to regular tasks

### 5. **Enhanced Filtering and Views**
- **Saved View Configurations**
  - Personal view presets
  - Quick switch between views
  - Share views with team

- **Advanced Filters**
  - Date range filtering
  - Multi-select filters
  - Exclude filters (NOT logic)
  - Search within results

### 6. **Task Relationships**
- **Subtasks**
  - Hierarchical task structure
  - Progress rollup to parent tasks
  - Collapsible task trees

- **Dependencies**
  - Block/blocked by relationships
  - Visual dependency graph
  - Automatic status updates

### 7. **Time Tracking**
- **Built-in Timer**
  - Start/stop timer on tasks
  - Automatic time logging
  - Pomodoro integration
  - Time estimates vs actual

### 8. **Mobile Optimization**
- **Touch-Optimized Interface**
  - Swipe gestures for quick actions
  - Bottom sheet modals
  - Thumb-friendly button placement
  - Offline support with sync

### 9. **Analytics Dashboard**
- **Task Metrics**
  - Completion rates by project/category
  - Average task duration
  - Productivity trends
  - Workload distribution

### 10. **Collaboration Features**
- **Task Assignment**
  - Assign to team members
  - Comments and discussions
  - Activity feed
  - @mentions in task descriptions

## Technical Improvements

### 1. **Real-time Updates**
- Implement Supabase real-time subscriptions
- Live collaboration on tasks
- Instant sync across devices

### 2. **Performance Optimizations**
- Virtual scrolling for large task lists
- Lazy load task details
- Implement service worker for offline support
- Image optimization for project icons

### 3. **Search Enhancement**
- Full-text search across tasks
- Search filters and facets
- Recent searches history
- Search suggestions

### 4. **Keyboard Navigation**
- Complete keyboard control
- Vim-style navigation
- Custom keyboard shortcuts
- Command palette integration

### 5. **Export/Import**
- Export tasks to CSV/JSON
- Import from other task managers
- Backup and restore functionality
- API for third-party integrations

## Priority Implementation Roadmap

### Phase 1: Foundation (Week 1-2)
1. Implement subtasks and task relationships
2. Add natural language date parsing
3. Create task templates system
4. Enhance quick task inline editing

### Phase 2: Integration (Week 3-4)
1. Deep calendar integration
2. Pipeline company task linking
3. Reading list task generation
4. Unified completion interface

### Phase 3: Intelligence (Week 5-6)
1. AI-powered task descriptions
2. Smart categorization
3. Automation rules engine
4. Predictive task suggestions

### Phase 4: Collaboration (Week 7-8)
1. Real-time updates
2. Task comments
3. Team assignment
4. Activity tracking

### Phase 5: Polish (Week 9-10)
1. Mobile optimization
2. Analytics dashboard
3. Advanced search
4. Performance improvements

## Success Metrics
- **User Engagement**: Daily active users, tasks created per user
- **Efficiency**: Average time to complete tasks, quick task conversion rate
- **Integration Usage**: Cross-feature task creation, linked entities
- **Performance**: Page load time, interaction responsiveness
- **User Satisfaction**: Feature adoption rate, user feedback scores