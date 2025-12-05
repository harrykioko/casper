export interface InboxItem {
  id: string;
  from: string;
  fromEmail: string;
  subject: string;
  preview: string;
  timestamp: string;
  isRead: boolean;
  type: 'email' | 'notification' | 'mention';
}

export const mockInboxData: InboxItem[] = [
  {
    id: '1',
    from: 'Sarah Chen',
    fromEmail: 'sarah@techcorp.com',
    subject: 'Q4 Board Meeting Follow-up',
    preview: 'Hi! Following up on our discussion about the quarterly metrics. I wanted to share some additional context on...',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    isRead: false,
    type: 'email',
  },
  {
    id: '2',
    from: 'Marcus Johnson',
    fromEmail: 'marcus@startupxyz.io',
    subject: 'Re: Investment Terms',
    preview: 'Thanks for sending over the term sheet. Our legal team has reviewed and we have a few questions about...',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
    isRead: false,
    type: 'email',
  },
  {
    id: '3',
    from: 'Notification',
    fromEmail: 'system@casper.app',
    subject: 'Weekly Digest Ready',
    preview: 'Your weekly activity summary is ready. You completed 12 tasks and had 8 meetings this week...',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    isRead: true,
    type: 'notification',
  },
  {
    id: '4',
    from: 'Alex Rivera',
    fromEmail: 'alex@acmeinc.com',
    subject: 'Intro: New Portfolio Company',
    preview: 'I wanted to introduce you to the team at NewCo. They are doing some interesting work in the AI space...',
    timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(), // 2 days ago
    isRead: true,
    type: 'email',
  },
];
