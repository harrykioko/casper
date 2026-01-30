import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogOverlay, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Clock, MapPin, Video, Users, Calendar, ExternalLink,
  Link2, Unlink, Search, MessageSquare, Loader2, Check,
  Sparkles, ChevronDown, ChevronUp, Mail, Globe,
} from "lucide-react";
import DOMPurify from "dompurify";
import { extractJoinLink, stripBoilerplate } from "@/lib/calendarParsing";
import { getDomainFromEmail } from "@/lib/domainMatching";
import { useCalendarEventLinking } from "@/hooks/useCalendarEventLinking";
import { useCalendarFollowups } from "@/hooks/useCalendarFollowups";
import type { CompanySearchResult } from "@/types/calendarLinking";
import { supabase } from "@/integrations/supabase/client";
import { FocusTriageBar } from "./FocusTriageBar";

interface CalendarEvent {
  id: string;
  title: string;
  startTime: string;
  endTime?: string;
  location?: string;
  category?: string;
  description?: string;
  attendees?: Array<{
    name: string;
    email?: string;
    avatar?: string;
  }>;
}

interface FocusEventModalProps {
  event: CalendarEvent | null;
  isOpen: boolean;
  onClose: () => void;
  // Triage actions
  onMarkTrusted: () => void;
  onSnooze: (until: Date) => void;
  onNoAction: () => void;
  showLink?: boolean;
  onLink?: () => void;
}

const QUICK_CHIPS = [
  "Send recap email",
  "Schedule next meeting",
  "Request docs",
  "Add to pipeline",
];

/**
 * Self-contained Focus event modal with integrated triage bar.
 * Mirrors EventDetailsModal content but adds the triage bar inside the Dialog.
 */
export function FocusEventModal({
  event,
  isOpen,
  onClose,
  onMarkTrusted,
  onSnooze,
  onNoAction,
  showLink = false,
  onLink,
}: FocusEventModalProps) {
  const navigate = useNavigate();
  const [showFollowups, setShowFollowups] = useState(false);
  const [followupText, setFollowupText] = useState("");
  const [showCompanySearch, setShowCompanySearch] = useState(false);
  const [companyQuery, setCompanyQuery] = useState("");
  const [searchResults, setSearchResults] = useState<CompanySearchResult[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [fallbackLogoUrl, setFallbackLogoUrl] = useState<string | null>(null);

  const {
    linkedCompany,
    suggestions,
    loading: linkingLoading,
    linkCompany,
    unlinkCompany,
    acceptSuggestion,
    dismissSuggestion,
    eventPeople,
    searchCompanies,
  } = useCalendarEventLinking(isOpen ? event : null);

  const {
    processing,
    followupData,
    processFollowups,
    saveNote,
    createTasks,
    setFollowupData,
  } = useCalendarFollowups();

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setShowFollowups(false);
      setFollowupText("");
      setShowCompanySearch(false);
      setCompanyQuery("");
      setSearchResults([]);
      setSelectedItems(new Set());
      setFollowupData(null);
      setFallbackLogoUrl(null);
    }
  }, [isOpen, setFollowupData]);

  // Fetch fallback logo
  useEffect(() => {
    if (linkedCompany && !linkedCompany.companyLogoUrl) {
      const fetchFallbackLogo = async () => {
        const table = linkedCompany.companyType === "pipeline" ? "pipeline_companies" : "companies";
        const { data } = await supabase.from(table).select("logo_url").eq("id", linkedCompany.companyId).single();
        if (data?.logo_url) setFallbackLogoUrl(data.logo_url);
      };
      fetchFallbackLogo();
    } else {
      setFallbackLogoUrl(null);
    }
  }, [linkedCompany]);

  const displayLogoUrl = linkedCompany?.companyLogoUrl || fallbackLogoUrl;

  // Company search debounce
  useEffect(() => {
    if (!companyQuery || companyQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      const results = await searchCompanies(companyQuery);
      setSearchResults(results);
    }, 300);
    return () => clearTimeout(timer);
  }, [companyQuery, searchCompanies]);

  const handleProcessFollowups = useCallback(async () => {
    if (!event || !followupText.trim()) return;
    await processFollowups(followupText, event, linkedCompany);
  }, [event, followupText, linkedCompany, processFollowups]);

  const handleSaveNote = useCallback(async () => {
    if (!event || !followupText.trim()) return;
    await saveNote(followupText, event.id, linkedCompany?.companyId, linkedCompany?.companyType);
  }, [event, followupText, linkedCompany, saveNote]);

  const handleCreateTasks = useCallback(async () => {
    if (!followupData) return;
    const items = followupData.actionItems.filter((_, i) => selectedItems.has(i));
    if (items.length === 0) return;
    await createTasks(items, linkedCompany?.companyId, linkedCompany?.companyType);
    setSelectedItems(new Set());
  }, [followupData, selectedItems, linkedCompany, createTasks]);

  const toggleItem = useCallback((index: number) => {
    setSelectedItems(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }, []);

  const handleCompanyClick = useCallback(() => {
    if (linkedCompany) {
      const path = linkedCompany.companyType === "pipeline"
        ? `/pipeline/${linkedCompany.companyId}`
        : `/portfolio/${linkedCompany.companyId}`;
      navigate(path);
      onClose();
    }
  }, [linkedCompany, navigate, onClose]);

  if (!event) return null;

  const joinLink = extractJoinLink(event);
  const descResult = event.description ? stripBoilerplate(event.description) : null;

  const formatTime = (timeString: string) => {
    const date = new Date(timeString);
    return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true });
  };

  const formatDate = (timeString: string) => {
    const date = new Date(timeString);
    return date.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  };

  const getTimeRange = () => {
    const startTime = formatTime(event.startTime);
    if (event.endTime) return `${startTime} – ${formatTime(event.endTime)}`;
    return startTime;
  };

  const getInitials = (name: string) =>
    name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

  const sanitizeDescription = (description: string) =>
    DOMPurify.sanitize(description, {
      ALLOWED_TAGS: ["p", "br", "strong", "em", "u", "ul", "ol", "li", "a", "span", "div"],
      ALLOWED_ATTR: ["href", "target", "rel"],
      ALLOW_DATA_ATTR: false,
    });

  const hasPhysicalLocation = event.location && !event.location.startsWith("http");

  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog open={isOpen} onOpenChange={onClose}>
          <DialogOverlay className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm" />
          <DialogContent
            className="fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%] w-full max-w-[90vw] sm:max-w-lg max-h-[85vh] p-0 border-none bg-transparent shadow-none [&>button]:hidden"
            aria-labelledby="event-title"
            aria-describedby="event-description"
          >
            <DialogTitle className="sr-only">{event.title}</DialogTitle>
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="relative rounded-2xl bg-muted/30 backdrop-blur-xl border border-muted/40 shadow-lg overflow-hidden"
            >
              {/* Triage bar at the top of the modal */}
              <FocusTriageBar
                onMarkTrusted={() => { onMarkTrusted(); onClose(); }}
                onSnooze={(until) => { onSnooze(until); onClose(); }}
                onNoAction={() => { onNoAction(); onClose(); }}
                showLink={showLink}
                onLink={onLink}
              />

              {/* Header */}
              <div className="p-6 pb-4">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <h1 id="event-title" className="text-xl font-bold text-foreground leading-tight flex-1">
                    {event.title}
                  </h1>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    className="h-8 w-8 rounded-full hover:bg-muted/50 transition-colors flex-shrink-0"
                    aria-label="Close modal"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Date */}
                <div className="flex items-center gap-2 text-muted-foreground mb-3">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm font-medium">{formatDate(event.startTime)}</span>
                </div>

                {/* Time Badge */}
                <Badge
                  variant="secondary"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/50 text-foreground border-0"
                >
                  <Clock className="h-3 w-3" />
                  {getTimeRange()}
                </Badge>
              </div>

              {/* Content */}
              <div className="px-6 pb-6 max-h-[55vh] overflow-y-auto space-y-5">
                {/* Primary Actions Row */}
                <div className="flex items-center gap-2 flex-wrap">
                  {joinLink && (
                    <Button asChild size="sm" className="bg-primary/80 hover:bg-primary text-primary-foreground rounded-xl">
                      <a href={joinLink.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5">
                        <Video className="h-3.5 w-3.5" />
                        Join {joinLink.provider.charAt(0).toUpperCase() + joinLink.provider.slice(1)}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </Button>
                  )}
                  {!linkedCompany && !showCompanySearch && (
                    <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setShowCompanySearch(true)}>
                      <Link2 className="h-3.5 w-3.5 mr-1.5" />
                      Link Company
                    </Button>
                  )}
                  <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setShowFollowups(!showFollowups)}>
                    <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
                    Follow-up
                    {showFollowups ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
                  </Button>
                </div>

                {/* Linked Company Section */}
                {linkedCompany && (
                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-wide font-medium text-muted-foreground">Linked Company</p>
                    <div className="flex items-center gap-2">
                      <div
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 cursor-pointer hover:bg-muted/70 transition-colors"
                        onClick={handleCompanyClick}
                      >
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={displayLogoUrl || undefined} alt={linkedCompany.companyName} />
                          <AvatarFallback className="text-[9px] bg-background border border-border">
                            {linkedCompany.companyName.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium text-foreground">{linkedCompany.companyName}</span>
                        <span className="text-xs text-muted-foreground">({linkedCompany.companyType})</span>
                      </div>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={unlinkCompany}>
                        <Unlink className="h-3 w-3 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Suggestion Cards */}
                {!linkedCompany && suggestions.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-wide font-medium text-muted-foreground">Suggested Companies</p>
                    <div className="space-y-2">
                      {suggestions.map(s => (
                        <div key={s.id} className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-background/50 border border-muted/30">
                          <div className="flex items-center gap-2 min-w-0">
                            <Avatar className="h-6 w-6 flex-shrink-0">
                              <AvatarFallback className="text-[9px] bg-muted">
                                {s.companyName.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">{s.companyName}</p>
                              <p className="text-xs text-muted-foreground">
                                {s.matchReason === "domain_match" ? `Domain: ${s.matchedDomain}` : "Title match"}
                                {" "}<span className="text-muted-foreground/60">({s.companyType})</span>
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => acceptSuggestion(s)}>
                              <Check className="h-3 w-3 mr-1" /> Link
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-muted-foreground" onClick={() => dismissSuggestion(s)}>
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Company Search */}
                {showCompanySearch && !linkedCompany && (
                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-wide font-medium text-muted-foreground">Search Companies</p>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        placeholder="Search by company name..."
                        value={companyQuery}
                        onChange={e => setCompanyQuery(e.target.value)}
                        className="pl-9 h-9 rounded-xl text-sm"
                        autoFocus
                      />
                    </div>
                    {searchResults.length > 0 && (
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {searchResults.map(r => (
                          <button
                            key={`${r.type}-${r.id}`}
                            className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors text-left"
                            onClick={() => {
                              linkCompany(r);
                              setShowCompanySearch(false);
                              setCompanyQuery("");
                            }}
                          >
                            <Avatar className="h-5 w-5 flex-shrink-0">
                              <AvatarImage src={r.logoUrl || undefined} alt={r.name} />
                              <AvatarFallback className="text-[8px] bg-muted">
                                {r.name.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm truncate">{r.name}</span>
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 ml-auto">{r.type}</Badge>
                          </button>
                        ))}
                      </div>
                    )}
                    {companyQuery.length >= 2 && searchResults.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-2">No companies found</p>
                    )}
                  </div>
                )}

                {/* Location (physical) */}
                {hasPhysicalLocation && (
                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-wide font-medium text-muted-foreground">Location</p>
                    <div className="flex items-start gap-3">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-foreground break-words">{event.location}</p>
                    </div>
                  </div>
                )}

                {/* People Section */}
                {event.attendees && event.attendees.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-xs uppercase tracking-wide font-medium text-muted-foreground">
                      <Users className="h-3.5 w-3.5 inline mr-1" />
                      Attendees ({event.attendees.length})
                    </p>
                    <div className="space-y-1.5 max-h-40 overflow-y-auto">
                      {event.attendees.map((attendee, index) => {
                        const domain = attendee.email ? getDomainFromEmail(attendee.email) : null;
                        return (
                          <div key={index} className="flex items-center gap-2.5 py-1">
                            <Avatar className="h-7 w-7">
                              <AvatarImage src={attendee.avatar} alt={attendee.name} />
                              <AvatarFallback className="text-xs bg-muted text-muted-foreground">
                                {getInitials(attendee.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-foreground truncate">{attendee.name}</p>
                              {attendee.email && (
                                <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                                  <Mail className="h-2.5 w-2.5" />
                                  {attendee.email}
                                </p>
                              )}
                            </div>
                            {domain && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 flex-shrink-0">
                                <Globe className="h-2.5 w-2.5 mr-0.5" />
                                {domain}
                              </Badge>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Description */}
                {descResult && (
                  <div className="space-y-3">
                    <p className="text-xs uppercase tracking-wide font-medium text-muted-foreground">Description</p>
                    {descResult.isBoilerplateOnly ? (
                      <p className="text-sm text-muted-foreground italic">No additional notes</p>
                    ) : (
                      <div
                        id="event-description"
                        className="prose prose-sm max-h-60 overflow-y-auto text-muted-foreground rounded-md border border-muted/30 p-3 bg-background/50"
                        dangerouslySetInnerHTML={{ __html: sanitizeDescription(descResult.clean) }}
                      />
                    )}
                  </div>
                )}

                {/* Follow-ups Section */}
                {showFollowups && (
                  <div className="space-y-3 border-t border-muted/30 pt-4">
                    <p className="text-xs uppercase tracking-wide font-medium text-muted-foreground">
                      <Sparkles className="h-3.5 w-3.5 inline mr-1" />
                      Follow-up Notes
                    </p>

                    {/* Quick chips */}
                    <div className="flex flex-wrap gap-1.5">
                      {QUICK_CHIPS.map(chip => (
                        <button
                          key={chip}
                          className="text-xs px-2.5 py-1 rounded-full bg-muted/50 hover:bg-muted/80 text-foreground transition-colors"
                          onClick={() => setFollowupText(prev => prev ? `${prev}\n- ${chip}` : `- ${chip}`)}
                        >
                          {chip}
                        </button>
                      ))}
                    </div>

                    <Textarea
                      placeholder="Write your meeting notes and follow-ups here..."
                      value={followupText}
                      onChange={e => setFollowupText(e.target.value)}
                      className="min-h-[80px] rounded-xl text-sm resize-none"
                    />

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        className="rounded-xl"
                        onClick={handleProcessFollowups}
                        disabled={processing || !followupText.trim()}
                      >
                        {processing ? (
                          <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Processing...</>
                        ) : (
                          <><Sparkles className="h-3.5 w-3.5 mr-1.5" /> Process with AI</>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-xl"
                        onClick={handleSaveNote}
                        disabled={!followupText.trim()}
                      >
                        Save Note
                      </Button>
                    </div>

                    {/* AI Results */}
                    {followupData && (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-3 mt-3"
                      >
                        {followupData.summary && (
                          <div className="p-3 rounded-xl bg-background/50 border border-muted/30">
                            <p className="text-xs font-medium text-muted-foreground mb-1">Summary</p>
                            <p className="text-sm text-foreground">{followupData.summary}</p>
                          </div>
                        )}

                        {followupData.keyTopics.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {followupData.keyTopics.map((topic, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {topic}
                              </Badge>
                            ))}
                          </div>
                        )}

                        {followupData.actionItems.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-xs font-medium text-muted-foreground">Action Items</p>
                            {followupData.actionItems.map((item, i) => (
                              <label
                                key={i}
                                className="flex items-start gap-2 p-2 rounded-lg hover:bg-muted/30 cursor-pointer transition-colors"
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedItems.has(i)}
                                  onChange={() => toggleItem(i)}
                                  className="mt-0.5 rounded"
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm">{item.content}</p>
                                  {(item.assignee || item.dueSuggestion) && (
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                      {item.assignee && <span>Assignee: {item.assignee}</span>}
                                      {item.assignee && item.dueSuggestion && " · "}
                                      {item.dueSuggestion && <span>Due: {item.dueSuggestion}</span>}
                                    </p>
                                  )}
                                </div>
                              </label>
                            ))}
                            <Button
                              size="sm"
                              className="rounded-xl"
                              onClick={handleCreateTasks}
                              disabled={selectedItems.size === 0}
                            >
                              <Check className="h-3.5 w-3.5 mr-1.5" />
                              Create {selectedItems.size} Task{selectedItems.size !== 1 ? "s" : ""}
                            </Button>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </DialogContent>
        </Dialog>
      )}
    </AnimatePresence>
  );
}
