/**
 * Person Types
 *
 * Unified contact directory - single source of truth for all people
 * across portfolio and pipeline companies.
 */

export type RelationshipTier = 'inner_circle' | 'close' | 'familiar' | 'acquaintance';

export interface Person {
  id: string;

  // Identity
  name: string;
  email?: string;
  phone?: string;
  linkedinUrl?: string;
  avatarUrl?: string;

  // Importance
  relationshipTier?: RelationshipTier;
  isVip: boolean;

  // Metadata
  notes?: string;
  tags?: string[];

  // Timestamps
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface PersonWithRoles extends Person {
  companyRoles: CompanyRole[];
}

export interface CompanyRole {
  roleId: string;
  companyId: string;
  companyType: 'portfolio' | 'pipeline';
  companyName?: string; // Populated by join
  role?: string;
  isFounder: boolean;
  isPrimaryContact: boolean;
  isCurrent: boolean;
  startedAt?: string;
  endedAt?: string;
}

export interface PersonInsert {
  name: string;
  email?: string;
  phone?: string;
  linkedinUrl?: string;
  avatarUrl?: string;
  relationshipTier?: RelationshipTier;
  isVip?: boolean;
  notes?: string;
  tags?: string[];
}

export interface PersonUpdate {
  name?: string;
  email?: string | null;
  phone?: string | null;
  linkedinUrl?: string | null;
  avatarUrl?: string | null;
  relationshipTier?: RelationshipTier | null;
  isVip?: boolean;
  notes?: string | null;
  tags?: string[] | null;
}

export interface CompanyRoleInsert {
  personId: string;
  companyId: string;
  companyType: 'portfolio' | 'pipeline';
  role?: string;
  isFounder?: boolean;
  isPrimaryContact?: boolean;
  isCurrent?: boolean;
  startedAt?: string;
  endedAt?: string;
}

/**
 * Full profile for a person including all related data
 */
export interface PersonProfile {
  person: PersonWithRoles;
  companies: Array<{
    id: string;
    name: string;
    type: 'portfolio' | 'pipeline';
    role?: string;
    isFounder: boolean;
    isPrimaryContact: boolean;
    isCurrent: boolean;
    logoUrl?: string;
  }>;
  commitments: Array<{
    id: string;
    content: string;
    status: string;
    dueAt?: string;
    promisedAt: string;
  }>;
  recentInteractions: Array<{
    id: string;
    type: string;
    content: string;
    occurredAt: string;
    companyName?: string;
  }>;
  upcomingMeetings: Array<{
    id: string;
    title: string;
    startTime: string;
  }>;
  relatedTasks: Array<{
    id: string;
    content: string;
    completed: boolean;
    scheduledFor?: string;
  }>;
  relatedEmails: Array<{
    id: string;
    subject: string;
    receivedAt: string;
    isRead: boolean;
  }>;
}

/**
 * Transform database row to frontend type
 */
export function transformPerson(row: any): Person {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    linkedinUrl: row.linkedin_url,
    avatarUrl: row.avatar_url,
    relationshipTier: row.relationship_tier,
    isVip: row.is_vip ?? false,
    notes: row.notes,
    tags: row.tags,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Transform person with roles from the view
 */
export function transformPersonWithRoles(row: any): PersonWithRoles {
  const person = transformPerson(row);
  const companyRoles: CompanyRole[] = (row.company_roles || [])
    .filter((r: any) => r && r.role_id)
    .map((r: any) => ({
      roleId: r.role_id,
      companyId: r.company_id,
      companyType: r.company_type,
      companyName: r.company_name,
      role: r.role,
      isFounder: r.is_founder ?? false,
      isPrimaryContact: r.is_primary_contact ?? false,
      isCurrent: r.is_current ?? true,
    }));

  return {
    ...person,
    companyRoles,
  };
}

/**
 * Transform frontend type to database format
 */
export function transformPersonForDatabase(data: PersonInsert | PersonUpdate): any {
  const result: any = {};

  if ('name' in data && data.name !== undefined) result.name = data.name;
  if ('email' in data) result.email = data.email;
  if ('phone' in data) result.phone = data.phone;
  if ('linkedinUrl' in data) result.linkedin_url = data.linkedinUrl;
  if ('avatarUrl' in data) result.avatar_url = data.avatarUrl;
  if ('relationshipTier' in data) result.relationship_tier = data.relationshipTier;
  if ('isVip' in data) result.is_vip = data.isVip;
  if ('notes' in data) result.notes = data.notes;
  if ('tags' in data) result.tags = data.tags;

  return result;
}

/**
 * Transform company role for database
 */
export function transformCompanyRoleForDatabase(data: CompanyRoleInsert): any {
  return {
    person_id: data.personId,
    company_id: data.companyId,
    company_type: data.companyType,
    role: data.role,
    is_founder: data.isFounder ?? false,
    is_primary_contact: data.isPrimaryContact ?? false,
    is_current: data.isCurrent ?? true,
    started_at: data.startedAt,
    ended_at: data.endedAt,
  };
}
