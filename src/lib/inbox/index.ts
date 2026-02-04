// Inbox utilities
export { buildTaskNoteFromEmail, buildCommitmentContextFromEmail } from "./buildTaskNote";
export { buildTaskDraftFromEmail, buildCommitmentDraftFromSuggestion, buildManualCommitmentDraft, parseDueHint } from "./buildTaskDraft";
export { 
  buildPipelineDraftFromSuggestion, 
  buildManualPipelineDraft, 
  detectIntroSignals, 
  inferDomainFromEmail, 
  inferCompanyName,
  inferStageFromContext,
} from "./buildPipelineDraft";
