
// Type guard function to safely parse attendees from Json
export function parseAttendees(attendeesJson: any): Array<{ name: string; email?: string; avatar?: string; }> {
  if (!attendeesJson || !Array.isArray(attendeesJson)) {
    return [];
  }
  
  return attendeesJson.map((attendee: any) => ({
    name: attendee?.name || 'Unknown',
    email: attendee?.email || undefined,
    avatar: attendee?.avatar || undefined,
  }));
}

export function transformDatabaseEvent(event: any) {
  return {
    id: event.id,
    microsoftEventId: event.microsoft_event_id,
    title: event.title,
    startTime: event.start_time,
    endTime: event.end_time || undefined,
    location: event.location || undefined,
    category: event.category || 'personal',
    description: event.description || undefined,
    attendees: parseAttendees(event.attendees),
  };
}
