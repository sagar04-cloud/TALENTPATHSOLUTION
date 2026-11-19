import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { AlertCircle, Loader2, Send } from 'lucide-react';
import { enquiryService } from '../../services/enquiryService';
import { trackFormStart } from '../../lib/analytics';
import { EnquirySuccessView } from './EnquirySuccessView';

const contactSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().optional().refine(val => !val || /^[0-9]{10}$/.test(val), 'Phone must be a valid 10-digit number'),
  subject: z.string().min(3, 'Subject is required'),
  message: z.string().min(5, 'Message must be at least 5 characters'),
  consentGiven: z.boolean().refine(val => val === true, 'Consent is required'),
  honeypot: z.string().optional()
});

type ContactFormValues = z.infer<typeof contactSchema>;

export const GeneralContactForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedRefId, setSubmittedRefId] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      subject: '',
      message: '',
      consentGiven: false,
      honeypot: ''
    }
  });

  const handleReset = () => {
    setSubmittedRefId(null);
    setServerError(null);
    reset();
  };

  const onSubmit = async (values: ContactFormValues) => {
    setIsSubmitting(true);
    setServerError(null);

    try {
      const [res] = await Promise.all([
        enquiryService.submitEnquiry({
          full_name: values.name,
          email: values.email,
          phone: values.phone || 'Not provided',
          service_type: 'general',
          source_page: window.location.pathname,
          interested_program: values.subject,
          message: values.message,
          consent_given: values.consentGiven,
          honeypot: values.honeypot
        }),
        new Promise((resolve) => setTimeout(resolve, 1800))
      ]);

      if (res.success) {
        setSubmittedRefId(res.id);
        reset();
      } else {
        setServerError(res.error || 'Failed to submit message.');
      }
    } catch {
      setServerError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitting) {
    return (
      <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-100 shadow-soft-sm text-center animate-in fade-in duration-300 flex flex-col items-center justify-center space-y-6 min-h-[380px]">
        <div className="relative flex items-center justify-center py-4">
          <div className="loader"></div>
        </div>
        <div className="space-y-1.5 max-w-sm mx-auto">
          <p className="font-heading font-bold text-base text-brand-darkText">
            Sending Your Message...
          </p>
          <p className="text-xs text-slate-400">
            Please wait while we deliver your inquiry
          </p>
        </div>
      </div>
    );
  }

  if (submittedRefId) {
    return <EnquirySuccessView onReset={handleReset} />;
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      onFocus={() => trackFormStart('general_contact_form')}
      className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-soft-sm space-y-4 text-left"
    >
      <input type="text" {...register('honeypot')} className="hidden" tabIndex={-1} autoComplete="off" />

      {serverError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs flex items-center">
          <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
          <span>{serverError}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-brand-darkText uppercase tracking-wider mb-1.5">
            Your Name <span className="text-brand-blue">*</span>
          </label>
          <input
            type="text"
            placeholder="e.g. John Doe"
            {...register('name')}
            className={`w-full px-4 py-2.5 rounded-full border text-xs focus:outline-none transition-all ${
              errors.name ? 'border-red-400 bg-red-50/30' : 'border-slate-200 focus:border-brand-blue'
            }`}
          />
          {errors.name && <p className="text-red-500 text-[11px] mt-1">{errors.name.message}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-brand-darkText uppercase tracking-wider mb-1.5">
            Email Address <span className="text-brand-blue">*</span>
          </label>
          <input
            type="email"
            placeholder="e.g. john@example.com"
            {...register('email')}
            className={`w-full px-4 py-2.5 rounded-full border text-xs focus:outline-none transition-all ${
              errors.email ? 'border-red-400 bg-red-50/30' : 'border-slate-200 focus:border-brand-blue'
            }`}
          />
          {errors.email && <p className="text-red-500 text-[11px] mt-1">{errors.email.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-brand-darkText uppercase tracking-wider mb-1.5">
            10-Digit Mobile (Optional)
          </label>
          <input
            type="tel"
            inputMode="numeric"
            maxLength={10}
            placeholder="e.g. 9876543210"
            {...register('phone', {
              onChange: (e) => {
                e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10);
              }
            })}
            className="w-full px-4 py-2.5 rounded-full border border-slate-200 text-xs focus:outline-none focus:border-brand-blue font-mono"
          />
          {errors.phone && <p className="text-red-500 text-[11px] mt-1">{errors.phone.message}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-brand-darkText uppercase tracking-wider mb-1.5">
            Subject <span className="text-brand-blue">*</span>
          </label>
          <input
            type="text"
            placeholder="e.g. General Inquiry / Partnership"
            {...register('subject')}
            className={`w-full px-4 py-2.5 rounded-full border text-xs focus:outline-none transition-all ${
              errors.subject ? 'border-red-400 bg-red-50/30' : 'border-slate-200 focus:border-brand-blue'
            }`}
          />
          {errors.subject && <p className="text-red-500 text-[11px] mt-1">{errors.subject.message}</p>}
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-brand-darkText uppercase tracking-wider mb-1.5">
          Message <span className="text-brand-blue">*</span>
        </label>
        <textarea
          rows={4}
          placeholder="How can we assist you today?"
          {...register('message')}
          className={`w-full p-4 rounded-2xl border text-xs focus:outline-none transition-all resize-none ${
            errors.message ? 'border-red-400 bg-red-50/30' : 'border-slate-200 focus:border-brand-blue'
          }`}
        ></textarea>
        {errors.message && <p className="text-red-500 text-[11px] mt-1">{errors.message.message}</p>}
      </div>

      <div className="pt-1">
        <label className="flex items-start space-x-2.5 text-xs text-slate-600 cursor-pointer">
          <input
            type="checkbox"
            {...register('consentGiven')}
            className="mt-0.5 rounded border-slate-300 text-brand-blue focus:ring-brand-blue"
          />
          <span>
            I agree to the <a href="/privacy-policy" target="_blank" className="text-brand-blue underline">Privacy Policy</a> and allow Talent Path Solutions to contact me.
          </span>
        </label>
        {errors.consentGiven && <p className="text-red-500 text-[11px] mt-1">{errors.consentGiven.message}</p>}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-3.5 px-6 rounded-full font-heading font-bold text-xs tracking-wider uppercase bg-brand-blue hover:bg-brand-blueHover text-white shadow-pill hover:shadow-pill-hover transition-all flex items-center justify-center disabled:opacity-75 disabled:cursor-not-allowed"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            <span>Sending Message...</span>
          </>
        ) : (
          <>
            <span>Send Message</span>
            <Send className="w-4 h-4 ml-2" />
          </>
        )}
      </button>
    </form>
  );
};
