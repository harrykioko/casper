// Polymorphic note target types
export type NoteTargetType = 'task' | 'company' | 'project' | 'reading_item';

// Note context for creating/linking notes
export interface NoteContext {
  targetType: NoteTargetType;
  targetId: string;
}

// Note link representing a connection between a note and an entity
export interface NoteLink {
  id: string;
  noteId: string;
  targetType: NoteTargetType;
  targetId: string;
  isPrimary: boolean;
  createdAt: string;
}

// Extended note type including polymorphic links
export interface Note {
  id: string;
  title: string | null;
  content: string;
  noteType: string | null;
  projectId: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  links?: NoteLink[];
}

// For creating a new note
export interface CreateNotePayload {
  title?: string;
  content: string;
  noteType?: string;
  primaryContext: NoteContext;
  secondaryContexts?: NoteContext[];
}

// For updating a note
export interface UpdateNotePayload {
  title?: string;
  content?: string;
  noteType?: string;
}

// Filter options for notes queries
export interface NotesFilter {
  targetType?: NoteTargetType | 'all';
  search?: string;
}
