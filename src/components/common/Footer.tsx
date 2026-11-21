import { Link } from 'react-router-dom';
import {
  Phone,
  Mail,
  MapPin,
  MessageCircle,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { COMPANY_CONFIG } from '../../config/company';
import { trackCallClick, trackEmailClick, trackWhatsAppClick } from '../../lib/analytics';

const CURRENT_YEAR = new Date().getFullYear();

export const Footer = () => {
  const currentYear = CURRENT_YEAR;

  return (
    <footer className="bg-brand-navyDark text-slate-300 pt-16 pb-8 border-t border-white/5 relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-24 bg-brand-blue/10 blur-3xl pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-14 border-b border-white/10">

          {/* Brand & Introduction */}
          <div className="lg:col-span-2 space-y-5">
            <Link to="/" className="flex items-center space-x-3.5 group" aria-label="Talent Path Solutions Home">
              <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center p-1 shadow-md group-hover:scale-105 transition-transform shrink-0">
                <img
                  src="/logo-icon.png"
                  alt="Talent Path Solutions Logo"
                  className="w-full h-full object-contain"
                  width="44"
                  height="44"
                />
              </div>
              <div className="flex flex-col">
                <span className="font-heading font-extrabold text-xl text-white tracking-tight group-hover:text-blue-300 transition-colors">
                  TALENT PATH
                </span>
                <span className="text-[10px] uppercase tracking-widest text-[#ebb242] font-bold">
                  SOLUTIONS
                </span>
              </div>
            </Link>

            <p className="text-sm text-slate-300 leading-relaxed max-w-sm">
              {COMPANY_CONFIG.shortDescription}
            </p>

            <div className="pt-2 flex items-center space-x-3">
              <a
                href="https://www.linkedin.com/company/talentpathsolutions/?contentTrackingId=SM8wV%2BQmQr%2BkbMMV5Gg3pA%3D%3D&viewName=premium-nav-upsell-text&upsellOrderOrigin=Tracking%3Av1%3Apremium_nav_upsell_text%3ANav%3AIn-Product"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn profile"
                className="w-9 h-9 rounded-lg bg-white/5 hover:bg-brand-blue flex items-center justify-center text-slate-300 hover:text-white transition-colors"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" /></svg>
              </a>
              <a
                href={COMPANY_CONFIG.socialLinks.facebook}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook page"
                className="w-9 h-9 rounded-lg bg-white/5 hover:bg-brand-blue flex items-center justify-center text-slate-300 hover:text-white transition-colors"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 2.04C6.5 2.04 2 6.53 2 12.06C2 17.06 5.66 21.21 10.44 21.96V14.96H7.9V12.06H10.44V9.85C10.44 7.34 11.93 5.96 14.22 5.96C15.31 5.96 16.45 6.15 16.45 6.15V8.62H15.19C13.95 8.62 13.56 9.39 13.56 10.18V12.06H16.34L15.89 14.96H13.56V21.96A10 10 0 0 0 22 12.06C22 6.53 17.5 2.04 12 2.04Z" /></svg>
              </a>
              <a
                href="https://www.instagram.com/talentpathsolutions01"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram profile"
                className="w-9 h-9 rounded-lg bg-white/5 hover:bg-brand-blue flex items-center justify-center text-slate-300 hover:text-white transition-colors"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>
              </a>
            </div>
          </div>

          {/* Programs & Pathways */}
          <div className="space-y-4">
            <h4 className="font-heading font-bold text-sm uppercase tracking-wider text-white">
              Education & Pathways
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/courses" className="text-slate-300 hover:text-white transition-colors inline-flex items-center">
                  <ArrowRight className="w-3 h-3 mr-1.5 text-brand-blue" />
                  All Degree Programs
                </Link>
              </li>
              <li>
                <Link to="/flexible-learning" className="text-slate-300 hover:text-white transition-colors inline-flex items-center">
                  <ArrowRight className="w-3 h-3 mr-1.5 text-brand-blue" />
                  Flexible & Distance Degrees
                </Link>
              </li>
              <li>
                <Link to="/sslc-puc" className="text-slate-300 hover:text-white transition-colors inline-flex items-center">
                  <ArrowRight className="w-3 h-3 mr-1.5 text-brand-blue" />
                  SSLC & PUC Education
                </Link>
              </li>
              <li>
                <Link to="/career-guidance" className="text-slate-300 hover:text-white transition-colors inline-flex items-center">
                  <ArrowRight className="w-3 h-3 mr-1.5 text-brand-blue" />
                  Career Counseling
                </Link>
              </li>
            </ul>
          </div>

          {/* Corporate & Organization Services */}
          <div className="space-y-4">
            <h4 className="font-heading font-bold text-sm uppercase tracking-wider text-white">
              Corporate & Support
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/recruitment" className="text-slate-300 hover:text-white transition-colors inline-flex items-center">
                  <ArrowRight className="w-3 h-3 mr-1.5 text-brand-blue" />
                  Recruitment & Manpower
                </Link>
              </li>
              <li>
                <Link to="/contact?tab=admission" className="text-slate-300 hover:text-white transition-colors inline-flex items-center">
                  <ArrowRight className="w-3 h-3 mr-1.5 text-brand-blue" />
                  Admissions Enquiry
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-slate-300 hover:text-white transition-colors inline-flex items-center">
                  <ArrowRight className="w-3 h-3 mr-1.5 text-brand-blue" />
                  About Talent Path
                </Link>
              </li>
              <li>
                <Link to="/news" className="text-slate-300 hover:text-white transition-colors inline-flex items-center">
                  <ArrowRight className="w-3 h-3 mr-1.5 text-brand-blue" />
                  News & Insights
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-slate-300 hover:text-white transition-colors inline-flex items-center">
                  <ArrowRight className="w-3 h-3 mr-1.5 text-brand-blue" />
                  Contact Advisory Team
                </Link>
              </li>
            </ul>
          </div>

          {/* Verified Contact Details */}
          <div className="space-y-4">
            <h4 className="font-heading font-bold text-sm uppercase tracking-wider text-white">
              Verified Contact
            </h4>
            <ul className="space-y-3 text-xs leading-relaxed">
              <li className="flex items-start space-x-2.5">
                <MapPin className="w-4 h-4 text-brand-blue flex-shrink-0 mt-0.5" />
                <span>
                  {COMPANY_CONFIG.address.fullFormatted}
                  <br />
                  <a
                    href={COMPANY_CONFIG.address.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-blueMuted hover:text-white underline mt-0.5 inline-block"
                  >
                    View on Google Maps
                  </a>
                </span>
              </li>
              <li>
                <a
                  href={`tel:${COMPANY_CONFIG.phone.raw}`}
                  onClick={() => trackCallClick('footer')}
                  className="flex items-center space-x-2.5 text-slate-300 hover:text-white transition-colors"
                >
                  <Phone className="w-4 h-4 text-brand-blue flex-shrink-0" />
                  <span>{COMPANY_CONFIG.phone.display}</span>
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${COMPANY_CONFIG.email.admissions}`}
                  onClick={() => trackEmailClick('footer')}
                  className="flex items-center space-x-2.5 text-slate-300 hover:text-white transition-colors"
                >
                  <Mail className="w-4 h-4 text-brand-blue flex-shrink-0" />
                  <span className="truncate">{COMPANY_CONFIG.email.admissions}</span>
                </a>
              </li>
              <li>
                <a
                  href={`https://wa.me/${COMPANY_CONFIG.whatsapp.raw}?text=${encodeURIComponent(COMPANY_CONFIG.whatsapp.defaultMessage)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackWhatsAppClick('footer')}
                  className="flex items-center space-x-2.5 text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
                >
                  <MessageCircle className="w-4 h-4 flex-shrink-0" />
                  <span>WhatsApp: {COMPANY_CONFIG.whatsapp.display}</span>
                </a>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom copyright & legal compliance */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>
              &copy; {currentYear} {COMPANY_CONFIG.name}. All rights reserved.
            </span>
          </div>

          <div className="flex items-center space-x-6">
            <Link to="/privacy-policy" className="hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms-conditions" className="hover:text-white transition-colors">
              Terms & Conditions
            </Link>

          </div>
        </div>
      </div>
    </footer>
  );
};
