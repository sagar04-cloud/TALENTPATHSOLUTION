import type { Transporter } from 'nodemailer';

export function createSmtpTransporter(): Transporter;

export function formatStructuredEmailText(enquiry: Record<string, any>): string;

export function formatStructuredEmailHtml(enquiry: Record<string, any>): string;

export function formatThankYouEmailText(enquiry: Record<string, any>): string;

export function formatThankYouEmailHtml(enquiry: Record<string, any>): string;

export interface ThankYouResult {
  sent: boolean;
  messageId?: string;
  to?: string;
  cc?: string[];
  bcc?: string[];
  refId?: string;
  subject?: string;
  reason?: string;
  error?: string;
}

export interface SmtpSendResult {
  success: boolean;
  refId: string;
  adminLead: {
    messageId: string;
    subject: string;
    recipients: {
      to: string;
      cc?: string[];
      bcc?: string[];
    };
  };
  userThankYou: ThankYouResult;
  messageId: string;
  subject: string;
  recipients: {
    to: string;
    cc?: string[];
    bcc?: string[];
  };
}

export function sendThankYouEmail(enquiry: Record<string, any>, existingTransporter?: Transporter | null): Promise<ThankYouResult>;

export function sendEnquiryEmail(enquiry: Record<string, any>): Promise<SmtpSendResult>;
