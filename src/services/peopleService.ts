import { supabase } from '@/integrations/supabase/client';
import type { PersonRecord } from '@/types/calendarLinking';

/**
 * Upserts attendees into the people table by email + created_by.
 * Runs in background when modal opens — does not block UI.
 */
export async function upsertAttendeesAsPeople(
  attendees: Array<{ name: string; email?: string }>,
  userId: string
): Promise<PersonRecord[]> {
  const results: PersonRecord[] = [];

  for (const attendee of attendees) {
    if (!attendee.email) continue;

    const email = attendee.email.trim().toLowerCase();

    // Check if person already exists for this user
    const { data: existing } = await supabase
      .from('people')
      .select('id, name, email, avatar_url, created_by')
      .eq('email', email)
      .eq('created_by', userId)
      .maybeSingle();

    if (existing) {
      results.push({
        id: existing.id,
        name: existing.name,
        email: existing.email,
        avatarUrl: existing.avatar_url,
        createdBy: existing.created_by,
      });
      continue;
    }

    // Insert new person
    const { data: inserted, error } = await supabase
      .from('people')
      .insert({
        name: attendee.name || email.split('@')[0],
        email,
        created_by: userId,
      })
      .select('id, name, email, avatar_url, created_by')
      .single();

    if (!error && inserted) {
      results.push({
        id: inserted.id,
        name: inserted.name,
        email: inserted.email,
        avatarUrl: inserted.avatar_url,
        createdBy: inserted.created_by,
      });
    }
  }

  return results;
}
