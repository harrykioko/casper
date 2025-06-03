
import { format, isToday, isTomorrow, isYesterday, isPast, parseISO } from 'date-fns';

export function formatTaskDate(dateString: string | undefined): string | null {
  if (!dateString) return null;
  
  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : new Date(dateString);
    
    if (isNaN(date.getTime())) return null;
    
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    if (isYesterday(date)) return 'Yesterday';
    
    // For this week, show day name
    const daysDiff = Math.abs(Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
    if (daysDiff <= 7) {
      return format(date, 'EEE'); // Mon, Tue, etc.
    }
    
    // For older/future dates, show month and day
    return format(date, 'MMM d');
  } catch (error) {
    return null;
  }
}

export function isOverdue(dateString: string | undefined): boolean {
  if (!dateString) return false;
  
  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : new Date(dateString);
    return isPast(date) && !isToday(date);
  } catch (error) {
    return false;
  }
}

export function getDateVariant(dateString: string | undefined): 'default' | 'today' | 'overdue' {
  if (!dateString) return 'default';
  
  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : new Date(dateString);
    
    if (isOverdue(dateString)) return 'overdue';
    if (isToday(date)) return 'today';
    return 'default';
  } catch (error) {
    return 'default';
  }
}
