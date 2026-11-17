import { motion } from 'framer-motion';

interface EnquirySuccessViewProps {
  onReset: () => void;
  title?: string;
}

export const EnquirySuccessView = ({
  onReset,
  title = "Your Enquiry Application Submitted Successfully"
}: EnquirySuccessViewProps) => {
  return (
    <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-100 shadow-soft-sm text-center flex flex-col items-center justify-center space-y-6 min-h-[380px] animate-in fade-in duration-300">
      {/* Crisp Animated Checkmark: Circle draws, fills with emerald, and white tick draws */}
      <div className="flex items-center justify-center my-2">
        <svg 
          className="success-checkmark" 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 52 52"
        >
          <circle 
            className="success-checkmark__circle" 
            cx="26" 
            cy="26" 
            r="24" 
            fill="none" 
          />
          <path 
            className="success-checkmark__check" 
            fill="none" 
            d="M14.5 27.2l7.2 7.2 16.2-16.3" 
          />
        </svg>
      </div>

      {/* Title with clean smooth entrance */}
      <motion.h3 
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.4, ease: "easeOut" }}
        className="font-heading font-black text-2xl sm:text-3xl text-brand-darkText tracking-tight max-w-md leading-snug"
      >
        {title}
      </motion.h3>

      {/* Okay Button */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.65, duration: 0.35, ease: "easeOut" }}
        className="pt-1"
      >
        <button
          type="button"
          onClick={onReset}
          className="px-10 py-3 rounded-full bg-brand-blue hover:bg-brand-blueHover text-white font-heading font-bold text-sm tracking-wide shadow-pill hover:shadow-pill-hover transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer min-w-[130px]"
        >
          Okay
        </button>
      </motion.div>
    </div>
  );
};
