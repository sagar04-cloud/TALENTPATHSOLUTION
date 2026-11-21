import type { Enquiry, EnquiryStatus, EnquiryNote, FilterOptions } from '../types/index.ts';
import { INITIAL_ENQUIRIES } from '../data/initialData.ts';
import { trackFormSubmitSuccess } from '../lib/analytics.ts';

const STORAGE_KEY = 'tps_enquiries_v1';

// Cross-tab real-time sync channel
let broadcastChannel: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    broadcastChannel = new BroadcastChannel('tps_realtime_leads_sync');
  }
} catch {
  // Graceful fallback for older environments
}

export function normalizeEnquiry(raw: any, fallbackId?: string): Enquiry {
  const id = String(raw?.id || fallbackId || `enq-${Date.now()}`);
  const initial = INITIAL_ENQUIRIES.find(e => e.id === id);

  return {
    id,
    created_at: raw?.created_at || initial?.created_at || new Date().toISOString(),
    user_id: raw?.user_id || initial?.user_id || '',
    full_name: String(raw?.full_name || initial?.full_name || 'Enquiry Candidate').trim(),
    email: String(raw?.email || initial?.email || '').trim(),
    phone: String(raw?.phone || initial?.phone || '').trim(),
    service_type: (raw?.service_type || initial?.service_type || 'general') as Enquiry['service_type'],
    status: (raw?.status || initial?.status || 'new') as Enquiry['status'],
    source_page: raw?.source_page || initial?.source_page || '/',
    message: raw?.message || initial?.message || '',
    consent_given: Boolean(raw?.consent_given ?? initial?.consent_given ?? true),
    interested_program: raw?.interested_program || initial?.interested_program,
    education_level: raw?.education_level || initial?.education_level,
    learning_mode: raw?.learning_mode || initial?.learning_mode,
    city_district: raw?.city_district || initial?.city_district,
    current_status: raw?.current_status || initial?.current_status,
    area_of_interest: raw?.area_of_interest || initial?.area_of_interest,
    career_goal: raw?.career_goal || initial?.career_goal,
    preferred_contact_method: raw?.preferred_contact_method || initial?.preferred_contact_method,
    organization_name: raw?.organization_name || initial?.organization_name,
    assigned_to: raw?.assigned_to !== undefined ? raw.assigned_to : initial?.assigned_to,
    follow_up_date: raw?.follow_up_date !== undefined ? raw.follow_up_date : initial?.follow_up_date,
    notes: Array.isArray(raw?.notes) ? raw.notes : (initial?.notes || [])
  };
}

// Initialize local store if empty and repair any partial cached records
const getStoredEnquiries = (): Enquiry[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_ENQUIRIES));
      return INITIAL_ENQUIRIES;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map((item, idx) => normalizeEnquiry(item, `ENQ-GEN-${idx}`));
    }
    return INITIAL_ENQUIRIES;
  } catch {
    return INITIAL_ENQUIRIES;
  }
};

const setStoredEnquiries = (enquiries: Enquiry[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(enquiries));
    window.dispatchEvent(new CustomEvent('tps_enquiries_updated', { detail: enquiries }));
    if (broadcastChannel) {
      broadcastChannel.postMessage({ type: 'enquiries_updated', timestamp: Date.now() });
    }
  } catch (err) {
    console.error('Failed to save enquiries to localStorage', err);
  }
};

export interface SubmitEnquiryInput {
  full_name: string;
  email: string;
  phone: string;
  service_type: Enquiry['service_type'];
  source_page?: string;
  message?: string;
  consent_given: boolean;
  honeypot?: string;

  // Specific fields
  interested_program?: string;
  education_level?: string;
  learning_mode?: Enquiry['learning_mode'];
  city_district?: string;
  current_status?: string;
  area_of_interest?: string;
  career_goal?: string;
  preferred_contact_method?: Enquiry['preferred_contact_method'];
  organization_name?: string;
  recruitment_requirement?: string;
  number_of_positions?: string;
}

export const ADMIN_NOTIFICATION_EMAIL = 'talentpathsolutions1@gmail.com';

export interface StructuredEmailResult {
  subject: string;
  body: string;
  mailtoUrl: string;
  gmailWebUrl: string;
  autoresponseBody?: string;
  thankYouSubject?: string;
  thankYouBody?: string;
}

/**
 * Builds a clean, professional, human-readable email format for candidate communication and counselor review
 */
export function buildStructuredEmail(enquiry: Enquiry): StructuredEmailResult {
  const formattedDate = new Date(enquiry.created_at).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Kolkata'
  });

  let subject = '';
  let body = '';

  if (enquiry.service_type === 'admission') {
    const programName = enquiry.interested_program || 'Degree / Course Program';
    subject = `Enquiry Leads: Admission - ${programName} - ${enquiry.full_name} (ID: ${enquiry.id})`;
    body = `ENQUIRY REFERENCE ID: ${enquiry.id}
DELIVERY STATUS: Delivered to Support Desk (${ADMIN_NOTIFICATION_EMAIL})
DATE & TIME: ${formattedDate} IST

APPLICANT DETAILS:
• Full Name: ${enquiry.full_name}
• Mobile / WhatsApp: ${enquiry.phone}
• Email Address: ${enquiry.email || 'Not provided'}
• City / District: ${enquiry.city_district || 'Not provided'}
• Current Qualification: ${enquiry.education_level || 'Not specified'}
• Preferred Study Mode: ${enquiry.learning_mode || 'Flexible Learning'}

PROGRAM APPLIED FOR:
${programName}

SPECIFIC QUERIES / CANDIDATE MESSAGE:
${enquiry.message && enquiry.message.trim() ? enquiry.message.trim() : 'Please provide the curriculum details, fee structure, and next admission batch schedule.'}

--------------------------------------------------
CONFIRMATION NOTICE:
This inquiry has been officially registered with Reference ID ${enquiry.id}.
A confirmation receipt has also been dispatched to ${enquiry.email || 'the applicant'}.
An admissions counselor will review this inquiry and respond within 24 business hours.`;
  } else if (enquiry.service_type === 'career_guidance') {
    const area = enquiry.area_of_interest || 'Career Guidance';
    subject = `Enquiry Leads: Career Guidance - ${area} - ${enquiry.full_name} (ID: ${enquiry.id})`;
    body = `ENQUIRY REFERENCE ID: ${enquiry.id}
DELIVERY STATUS: Delivered to Support Desk (${ADMIN_NOTIFICATION_EMAIL})
DATE & TIME: ${formattedDate} IST

APPLICANT DETAILS:
• Full Name: ${enquiry.full_name}
• Mobile / WhatsApp: ${enquiry.phone}
• Email Address: ${enquiry.email || 'Not provided'}
• City / District: ${enquiry.city_district || 'Not provided'}
• Current Status: ${enquiry.current_status || 'Not specified'}
• Area of Interest: ${enquiry.area_of_interest || 'Not specified'}
• Career Goal: ${enquiry.career_goal || 'Not specified'}
• Preferred Contact Method: ${enquiry.preferred_contact_method || 'WhatsApp / Phone'}

MESSAGE / SPECIFIC QUERIES:
${enquiry.message && enquiry.message.trim() ? enquiry.message.trim() : 'I would like to request a 1-on-1 counseling session to evaluate career and educational pathways.'}

--------------------------------------------------
CONFIRMATION NOTICE:
This career guidance request has been registered with Reference ID ${enquiry.id}.
A confirmation receipt has also been dispatched to ${enquiry.email || 'the applicant'}.
A senior advisor will contact the candidate within 24 business hours.`;
  } else if (enquiry.service_type === 'recruitment') {
    const org = enquiry.organization_name || 'Corporate Staffing';
    subject = `Enquiry Leads: Corporate Hiring - ${org} - ${enquiry.full_name} (ID: ${enquiry.id})`;
    body = `ENQUIRY REFERENCE ID: ${enquiry.id}
DELIVERY STATUS: Delivered to Support Desk (${ADMIN_NOTIFICATION_EMAIL})
DATE & TIME: ${formattedDate} IST

ORGANIZATION & CONTACT DETAILS:
• Organization / Company: ${enquiry.organization_name || 'Not specified'}
• Contact Person: ${enquiry.full_name}
• Phone Number: ${enquiry.phone}
• Official Email: ${enquiry.email || 'Not provided'}
• Office Location: ${enquiry.city_district || 'Not provided'}
• Recruitment Requirement: ${enquiry.recruitment_requirement || 'Workforce Staffing'}
• Positions Needed: ${enquiry.number_of_positions || '1-5'}

HIRING REQUIREMENTS:
${enquiry.message && enquiry.message.trim() ? enquiry.message.trim() : 'We would like to connect with Talent Path Solutions to discuss corporate staffing and hiring timelines.'}

--------------------------------------------------
CONFIRMATION NOTICE:
This corporate inquiry has been logged with Reference ID ${enquiry.id}.
A confirmation notice has been sent to ${enquiry.email || 'the authorized contact'}.
The corporate staffing desk will contact the representative within 24 business hours.`;
  } else {
    const topic = enquiry.interested_program || 'General Information';
    subject = `Enquiry Leads: Support - ${topic} - ${enquiry.full_name} (ID: ${enquiry.id})`;
    body = `ENQUIRY REFERENCE ID: ${enquiry.id}
DELIVERY STATUS: Delivered to Support Desk (${ADMIN_NOTIFICATION_EMAIL})
DATE & TIME: ${formattedDate} IST

CONTACT DETAILS:
• Full Name: ${enquiry.full_name}
• Phone: ${enquiry.phone}
• Email Address: ${enquiry.email || 'Not provided'}
• Subject Topic: ${topic}

MESSAGE:
${enquiry.message && enquiry.message.trim() ? enquiry.message.trim() : 'Please reach out regarding this inquiry.'}

--------------------------------------------------
CONFIRMATION NOTICE:
This enquiry has been registered with Reference ID ${enquiry.id}.
A delivery confirmation has been sent to ${enquiry.email || 'the user'}.
Our support desk will respond within 24 business hours.`;
  }

  const encodedSubject = encodeURIComponent(subject);
  const encodedBody = encodeURIComponent(body);
  const ccParam = enquiry.email ? `&cc=${encodeURIComponent(enquiry.email)}` : '';

  const mailtoUrl = `mailto:${ADMIN_NOTIFICATION_EMAIL}?subject=${encodedSubject}${ccParam}&body=${encodedBody}`;
  const gmailWebUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(ADMIN_NOTIFICATION_EMAIL)}${ccParam}&su=${encodedSubject}&body=${encodedBody}`;

  const thankYouSubject = `Inquiry Confirmation: Talent Path Solutions [Ref: ${enquiry.id}]`;
  const thankYouBody = `Dear ${enquiry.full_name},

Thank you for contacting Talent Path Solutions. We have received your inquiry and registered your reference ticket with our advisory team.

REFERENCE TICKET ID: ${enquiry.id}
Service Category: ${(enquiry.service_type || 'general').replace(/_/g, ' ').toUpperCase()}
Submission Date: ${formattedDate} IST
Contact Email: ${enquiry.email || 'Not provided'}
Contact Phone: ${enquiry.phone || 'Not provided'}
City / District: ${enquiry.city_district || 'Not specified'}

WHAT HAPPENS NEXT?
1. Advisor Review: A dedicated counselor is reviewing your profile and requirements.
2. Pathway Assessment: We review eligibility, curriculum options, or hiring timelines.
3. Direct Consultation: We will reach out via Phone / WhatsApp within 24 business hours.

DIRECT CONTACT & SUPPORT:
• Helpline / Call: +91 97389 29550
• WhatsApp: +91 97389 29550
• Support Email: ${ADMIN_NOTIFICATION_EMAIL}
• Operating Hours: Monday – Saturday: 9:30 AM – 6:30 PM IST

Warm regards,
Admissions & Counseling Team
Talent Path Solutions`;

  return { subject, body, mailtoUrl, gmailWebUrl, thankYouSubject, thankYouBody };
}

export interface EmailDeliveryStatus {
  dispatched: boolean;
  adminLeadSent: boolean;
  thankYouSent: boolean;
  thankYouTo?: string;
  error?: string;
}

/**
 * Dispatches an automated structured email via Google SMTP Service (/api/send-enquiry)
 * with CC, BCC, Recipient, and structured body.
 */
async function dispatchEmailToInbox(enquiry: Enquiry, _structured: StructuredEmailResult): Promise<EmailDeliveryStatus> {
  try {
    const res = await fetch('/api/send-enquiry', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(enquiry)
    });

    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      const adminSent = Boolean(data?.adminLead?.messageId || data?.messageId);
      const thankYouSent = Boolean(data?.userThankYou?.sent);
      
      if (!adminSent && !thankYouSent) {
        console.warn(`⚠️ [Google SMTP Alert] Neither Admin Lead nor Client Thank-You email could be dispatched. Check SMTP credentials in .env. Admin: ${data?.adminLead?.error || 'failed'}, Client: ${data?.userThankYou?.error || 'failed'}`);
      } else {
        console.log(`✅ [Google SMTP] Enquiry ${enquiry.id} delivered via /api/send-enquiry (Admin: ${adminSent ? 'Sent' : 'Failed'}, Thank You Email: ${thankYouSent ? 'Sent to ' + (data?.userThankYou?.to || enquiry.email) : 'Pending'})`);
      }

      return {
        dispatched: true,
        adminLeadSent: adminSent,
        thankYouSent: thankYouSent,
        thankYouTo: data?.userThankYou?.to || enquiry.email,
        error: data?.userThankYou?.error || data?.adminLead?.error
      };
    } else {
      const err = await res.json().catch(() => ({}));
      const errMsg = err?.error || `Server returned ${res.status}`;
      console.warn(`[Google SMTP] Server responded with status ${res.status}:`, err);
      return {
        dispatched: false,
        adminLeadSent: false,
        thankYouSent: false,
        error: errMsg
      };
    }
  } catch (err: any) {
    console.warn('[Google SMTP Note] Background email dispatch note (fallback to local cache & mailto):', err);
    return {
      dispatched: false,
      adminLeadSent: false,
      thankYouSent: false,
      error: err?.message || 'Network error connecting to email API'
    };
  }
}

export interface SubmitEnquiryResult {
  success: boolean;
  id: string;
  error?: string;
  emailData?: StructuredEmailResult;
  emailDelivery?: EmailDeliveryStatus;
}

export const enquiryService = {
  /**
   * Helper to filter an enquiry array with criteria
   */
  filterEnquiriesList(items: Enquiry[], filters?: FilterOptions): Enquiry[] {
    let filtered = items;
    if (filters?.service_type && filters.service_type !== 'all') {
      filtered = filtered.filter(e => e.service_type === filters.service_type);
    }
    if (filters?.status && filters.status !== 'all') {
      filtered = filtered.filter(e => e.status === filters.status);
    }
    if (filters?.search && filters.search.trim()) {
      const q = filters.search.toLowerCase();
      filtered = filtered.filter(e => 
        e.full_name?.toLowerCase().includes(q) ||
        e.email?.toLowerCase().includes(q) ||
        e.phone?.toLowerCase().includes(q) ||
        (e.organization_name && e.organization_name.toLowerCase().includes(q)) ||
        (e.city_district && e.city_district.toLowerCase().includes(q))
      );
    }
    return filtered;
  },

  /**
   * Submit an enquiry or registration and dispatch structured notification to talentpathsolutions1@gmail.com
   */
  async submitEnquiry(input: SubmitEnquiryInput): Promise<SubmitEnquiryResult> {
    // 1. Honeypot anti-spam check
    if (input.honeypot && input.honeypot.trim() !== '') {
      console.warn('Spam submission detected and dropped.');
      return { success: true, id: 'SPAM-FILTERED' };
    }

    // 2. Validate mandatory consent
    if (!input.consent_given) {
      return { success: false, id: '', error: 'Privacy policy consent is required.' };
    }

    const uniqueId = `TPS-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
    
    const newEnquiry: Enquiry = {
      id: uniqueId,
      created_at: new Date().toISOString(),
      user_id: input.phone || 'public-lead',
      full_name: (input.full_name || 'Enquiry Candidate').trim(),
      email: (input.email || '').trim().toLowerCase(),
      phone: (input.phone || '').trim(),
      service_type: input.service_type,
      status: 'new',
      source_page: input.source_page || window.location.pathname,
      message: input.message?.trim(),
      consent_given: input.consent_given,
      interested_program: input.interested_program,
      education_level: input.education_level,
      learning_mode: input.learning_mode,
      city_district: input.city_district?.trim(),
      current_status: input.current_status,
      area_of_interest: input.area_of_interest,
      career_goal: input.career_goal,
      preferred_contact_method: input.preferred_contact_method,
      organization_name: input.organization_name?.trim(),
      recruitment_requirement: input.recruitment_requirement,
      number_of_positions: input.number_of_positions,
      notes: []
    };

    // 3. Save to persistent storage cache & broadcast IMMEDIATELY (0ms delay for UI)
    const current = getStoredEnquiries();
    setStoredEnquiries([newEnquiry, ...current]);
    trackFormSubmitSuccess(input.service_type, input.service_type);

    // 4. Build high-level structured email and asynchronously dispatch via Google SMTP
    const structured = buildStructuredEmail(newEnquiry);
    const emailDelivery = await dispatchEmailToInbox(newEnquiry, structured);

    return { 
      success: true, 
      id: uniqueId, 
      emailData: structured,
      emailDelivery
    };
  },

  /**
   * Subscribe to real-time enquiry updates for the Admin CRM.
   * Emits live updates whenever any lead is created, status changed, or note added.
   * Dual-channel: Listens locally (across all tabs via BroadcastChannel & custom events).
   */
  subscribeToEnquiries(filters: FilterOptions | undefined, callback: (enquiries: Enquiry[]) => void): () => void {
    const handleLocalUpdate = () => {
      const local = getStoredEnquiries();
      callback(this.filterEnquiriesList(local, filters));
    };

    // Immediate initial push from local storage
    handleLocalUpdate();

    window.addEventListener('tps_enquiries_updated', handleLocalUpdate);
    window.addEventListener('storage', handleLocalUpdate);
    if (broadcastChannel) {
      broadcastChannel.addEventListener('message', handleLocalUpdate);
    }

    return () => {
      window.removeEventListener('tps_enquiries_updated', handleLocalUpdate);
      window.removeEventListener('storage', handleLocalUpdate);
      if (broadcastChannel) {
        broadcastChannel.removeEventListener('message', handleLocalUpdate);
      }
    };
  },

  /**
   * Subscribe to real-time enquiries for a specific user (Student Portal)
   */
  subscribeToUserEnquiries(email?: string, userId?: string, callback?: (enquiries: Enquiry[]) => void): () => void {
    if (!callback) return () => {};

    const handleUserUpdate = () => {
      const all = getStoredEnquiries();
      const userItems = all.filter(e => 
        (userId && e.user_id === userId) || 
        (email && e.email?.toLowerCase() === email.toLowerCase())
      );
      callback(userItems);
    };

    // Immediate initial push
    handleUserUpdate();

    window.addEventListener('tps_enquiries_updated', handleUserUpdate);
    window.addEventListener('storage', handleUserUpdate);
    if (broadcastChannel) {
      broadcastChannel.addEventListener('message', handleUserUpdate);
    }

    return () => {
      window.removeEventListener('tps_enquiries_updated', handleUserUpdate);
      window.removeEventListener('storage', handleUserUpdate);
      if (broadcastChannel) {
        broadcastChannel.removeEventListener('message', handleUserUpdate);
      }
    };
  },

  /**
   * Fetch enquiries with flexible filtering and sorting
   */
  async getEnquiries(filters?: FilterOptions): Promise<Enquiry[]> {
    const items = getStoredEnquiries();
    return this.filterEnquiriesList(items, filters);
  },

  /**
   * Get enquiries submitted by a specific user (for student portal)
   */
  async getUserEnquiries(email?: string, userId?: string): Promise<Enquiry[]> {
    const all = await this.getEnquiries();
    if (!email && !userId) return [];
    
    return all.filter(e => 
      (userId && e.user_id === userId) || 
      (email && e.email?.toLowerCase() === email.toLowerCase())
    );
  },

  /**
   * Get single enquiry by ID
   */
  async getEnquiryById(id: string): Promise<Enquiry | null> {
    const list = getStoredEnquiries();
    return list.find(e => e.id === id) || null;
  },

  /**
   * Update lead status (syncs to localStorage and broadcasts across tabs in real-time)
   */
  async updateStatus(id: string, status: EnquiryStatus, assignedTo?: string, followUpDate?: string): Promise<boolean> {
    const updatePayload: Partial<Enquiry> = {
      status
    };
    if (assignedTo !== undefined) updatePayload.assigned_to = assignedTo;
    if (followUpDate !== undefined) updatePayload.follow_up_date = followUpDate;

    // Update local store immediately with guaranteed complete fields
    const items = getStoredEnquiries();
    const index = items.findIndex(e => e.id === id);
    let fullUpdated: Enquiry;

    if (index !== -1) {
      fullUpdated = normalizeEnquiry({
        ...items[index],
        ...updatePayload
      }, id);
      items[index] = fullUpdated;
    } else {
      fullUpdated = normalizeEnquiry({
        id,
        ...updatePayload
      }, id);
      items.push(fullUpdated);
    }
    setStoredEnquiries(items);
    return true;
  },

  /**
   * Add internal note to an enquiry
   */
  async addNote(enquiryId: string, author: string, content: string): Promise<boolean> {
    const newNote: EnquiryNote = {
      id: `note-${Date.now()}`,
      enquiry_id: enquiryId,
      author,
      content: content.trim(),
      created_at: new Date().toISOString()
    };

    const items = getStoredEnquiries();
    const index = items.findIndex(e => e.id === enquiryId);

    if (index !== -1) {
      const existingNotes = items[index].notes || [];
      const updatedNotes = [...existingNotes, newNote];
      const fullUpdated = normalizeEnquiry({
        ...items[index],
        notes: updatedNotes
      }, enquiryId);
      items[index] = fullUpdated;
      setStoredEnquiries(items);
    }

    return true;
  },

  /**
   * Export lead records to CSV format
   */
  exportToCSV(enquiries: Enquiry[]): void {
    const headers = [
      'Reference ID',
      'Date',
      'Full Name',
      'Phone',
      'Email',
      'Service',
      'Status',
      'Program / Requirement',
      'City',
      'Organization',
      'Assigned To',
      'Follow Up Date',
      'Source Page'
    ];

    const rows = enquiries.map(e => [
      `"${e.id}"`,
      `"${new Date(e.created_at).toLocaleString()}"`,
      `"${e.full_name}"`,
      `"${e.phone}"`,
      `"${e.email}"`,
      `"${e.service_type}"`,
      `"${e.status}"`,
      `"${e.interested_program || e.recruitment_requirement || e.area_of_interest || ''}"`,
      `"${e.city_district || ''}"`,
      `"${e.organization_name || ''}"`,
      `"${e.assigned_to || ''}"`,
      `"${e.follow_up_date || ''}"`,
      `"${e.source_page || ''}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `TalentPath_Leads_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
