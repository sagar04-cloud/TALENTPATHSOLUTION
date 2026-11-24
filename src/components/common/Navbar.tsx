import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Menu, 
  X, 
  ChevronDown, 
  GraduationCap, 
  Compass, 
  BookOpen, 
  Clock, 
  PhoneCall
} from 'lucide-react';
import { COMPANY_CONFIG } from '../../config/company';
import { trackCallClick } from '../../lib/analytics';

export const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProgramsDropdownOpen, setIsProgramsDropdownOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  const [prevPath, setPrevPath] = useState(location.pathname);
  if (prevPath !== location.pathname) {
    setPrevPath(location.pathname);
    setIsMobileMenuOpen(false);
    setIsProgramsDropdownOpen(false);
  }

  // Prevent background scrolling when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/' || location.pathname === '';
    return location.pathname.startsWith(path);
  };

  const navLinks = [
    { title: 'Home', path: '/' },
    { title: 'Courses & Programs', path: '/courses' },
    { title: 'SSLC & PUC Pathways', path: '/sslc-puc' },
    { title: 'Flexible & Distance Degrees', path: '/flexible-learning' },
    { title: 'Mentors & Guidance', path: '/career-guidance' },
    { title: 'Recruitment', path: '/recruitment' },
    { title: 'About Us', path: '/about' },
    { title: 'Contact', path: '/contact' }
  ];

  const programLinks = [
    {
      title: "SSLC & PUC Pathways",
      desc: "10th & 12th board completion pathways",
      path: "/sslc-puc",
      icon: BookOpen,
    },
    {
      title: "All Degree Programs",
      desc: "Undergraduate & Postgraduate degrees",
      path: "/courses",
      icon: GraduationCap,
    },
    {
      title: "Distance & Flexible Learning",
      desc: "UGC-recognized flexible study schedules",
      path: "/flexible-learning",
      icon: Clock,
    },
    {
      title: "1-on-1 Career Advisory",
      desc: "Personalized educational counseling",
      path: "/career-guidance",
      icon: Compass,
    }
  ];

  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-md shadow-soft-sm py-3 border-b border-slate-100'
          : 'bg-white/90 backdrop-blur-sm py-4 border-b border-slate-100/60'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        
        {/* Brand Logo with exact official Emblem Icon and Typography */}
        <Link to="/" className="flex items-center gap-2.5 sm:gap-3 group shrink-0" aria-label="Talent Path Solutions Home">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white border border-slate-200/90 shadow-xs flex items-center justify-center p-1 group-hover:scale-105 group-hover:shadow-md transition-all shrink-0">
            <img 
              src="/logo-icon.png" 
              alt="Talent Path Solutions Logo" 
              className="w-full h-full object-contain"
              width="44"
              height="44"
              loading="eager"
            />
          </div>
          <div className="flex flex-col text-left">
            <span className="font-heading font-black text-lg sm:text-xl tracking-tight text-[#06347f] group-hover:text-brand-blue transition-colors leading-none">
              TALENT<span className="text-brand-blue">PATH</span>
            </span>
            <span className="text-[9px] sm:text-[10px] font-bold text-[#ebb242] tracking-widest uppercase mt-0.5 leading-none">
              SOLUTIONS
            </span>
          </div>
        </Link>

        {/* Center Nav Links - Single-line guaranteed with whitespace-nowrap */}
        <nav className="hidden lg:flex items-center space-x-1 xl:space-x-1.5 shrink-0">
          <Link
            to="/"
            className={`px-3 py-1.5 xl:px-3.5 xl:py-2 text-xs font-semibold tracking-wide whitespace-nowrap transition-all rounded-full ${
              isActive('/') 
                ? 'text-brand-blue font-bold bg-brand-blueLight/80 shadow-xs' 
                : 'text-slate-600 hover:text-brand-blue hover:bg-slate-100/70'
            }`}
          >
            Home
          </Link>

          {/* Programs Dropdown */}
          <div 
            className="relative"
            onMouseEnter={() => setIsProgramsDropdownOpen(true)}
            onMouseLeave={() => setIsProgramsDropdownOpen(false)}
          >
            <button
              className={`px-3 py-1.5 xl:px-3.5 xl:py-2 text-xs font-semibold tracking-wide whitespace-nowrap inline-flex items-center transition-all rounded-full ${
                isActive('/courses') || isActive('/flexible-learning') || isActive('/sslc-puc')
                  ? 'text-brand-blue font-bold bg-brand-blueLight/80 shadow-xs'
                  : 'text-slate-600 hover:text-brand-blue hover:bg-slate-100/70'
              }`}
              aria-expanded={isProgramsDropdownOpen}
            >
              <span>Courses & Programs</span>
              <ChevronDown className={`ml-1 w-3.5 h-3.5 transition-transform duration-200 ${isProgramsDropdownOpen ? 'rotate-180 text-brand-blue' : ''}`} />
            </button>

            {isProgramsDropdownOpen && (
              <div className="absolute top-full left-0 w-80 pt-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-soft-xl border border-slate-100/90 p-2.5 space-y-1">
                  {programLinks.map((item, idx) => (
                    <Link
                      key={idx}
                      to={item.path}
                      className="flex items-start p-2.5 rounded-xl hover:bg-brand-blueLight/50 transition-colors group"
                    >
                      <div className="p-2 rounded-xl bg-brand-blueLight text-brand-blue group-hover:bg-brand-blue group-hover:text-white transition-colors mr-3 mt-0.5 shrink-0">
                        <item.icon className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-brand-darkText group-hover:text-brand-blue block">
                          {item.title}
                        </span>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                          {item.desc}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Link
            to="/career-guidance"
            className={`px-3 py-1.5 xl:px-3.5 xl:py-2 text-xs font-semibold tracking-wide whitespace-nowrap transition-all rounded-full ${
              isActive('/career-guidance') 
                ? 'text-brand-blue font-bold bg-brand-blueLight/80 shadow-xs' 
                : 'text-slate-600 hover:text-brand-blue hover:bg-slate-100/70'
            }`}
          >
            Mentors & Guidance
          </Link>

          <Link
            to="/recruitment"
            className={`px-3 py-1.5 xl:px-3.5 xl:py-2 text-xs font-semibold tracking-wide whitespace-nowrap transition-all rounded-full ${
              isActive('/recruitment') 
                ? 'text-brand-blue font-bold bg-brand-blueLight/80 shadow-xs' 
                : 'text-slate-600 hover:text-brand-blue hover:bg-slate-100/70'
            }`}
          >
            Recruitment
          </Link>

          <Link
            to="/about"
            className={`px-3 py-1.5 xl:px-3.5 xl:py-2 text-xs font-semibold tracking-wide whitespace-nowrap transition-all rounded-full ${
              isActive('/about') 
                ? 'text-brand-blue font-bold bg-brand-blueLight/80 shadow-xs' 
                : 'text-slate-600 hover:text-brand-blue hover:bg-slate-100/70'
            }`}
          >
            About Us
          </Link>

          <Link
            to="/contact"
            className={`px-3 py-1.5 xl:px-3.5 xl:py-2 text-xs font-semibold tracking-wide whitespace-nowrap transition-all rounded-full ${
              isActive('/contact') 
                ? 'text-brand-blue font-bold bg-brand-blueLight/80 shadow-xs' 
                : 'text-slate-600 hover:text-brand-blue hover:bg-slate-100/70'
            }`}
          >
            Contact
          </Link>
        </nav>

        {/* Right CTA Area */}
        <div className="hidden lg:flex items-center space-x-2 xl:space-x-3 shrink-0">
          <a
            href={`tel:${COMPANY_CONFIG.phone.raw}`}
            onClick={() => trackCallClick('navbar')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-semibold text-xs text-slate-700 hover:text-brand-blue hover:bg-slate-100/70 transition-colors whitespace-nowrap"
            title={`Call Admissions: ${COMPANY_CONFIG.phone.display}`}
          >
            <PhoneCall className="w-3.5 h-3.5 text-brand-blue shrink-0" />
            <span className="hidden xl:inline">{COMPANY_CONFIG.phone.display}</span>
          </a>

          <Link
            to="/contact?tab=admission"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-full font-heading font-bold text-xs text-white bg-gradient-to-r from-brand-blue to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-pill hover:shadow-pill-hover transition-all transform hover:-translate-y-0.5 active:translate-y-0 whitespace-nowrap shrink-0"
          >
            <span>Enquire Now</span>
          </Link>
        </div>

        {/* Mobile menu button */}
        <div className="flex items-center space-x-2 lg:hidden">
          <Link
            to="/contact?tab=admission"
            className="text-xs font-bold px-3 py-1.5 bg-brand-blue text-white rounded-full shadow-sm"
          >
            Enquire Now
          </Link>

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-xl text-slate-700 hover:bg-slate-100 focus:outline-none"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

      </div>

      {/* Mobile Menu Backdrop and Sheet */}
      {isMobileMenuOpen && (
        <>
          {/* Backdrop to prevent interaction with underlying page and eliminate odd overlaps */}
          <div 
            className="fixed inset-0 top-[65px] bg-slate-900/50 backdrop-blur-xs z-30 lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Mobile Drawer */}
          <div className="fixed top-[65px] left-0 right-0 max-h-[calc(100vh-65px)] overflow-y-auto bg-white border-b border-slate-200 shadow-2xl z-40 lg:hidden px-5 pt-3 pb-8 text-left animate-in slide-in-from-top-2 duration-200">
            <nav className="space-y-1">
              {navLinks.map((link) => {
                const active = isActive(link.path);
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`block px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                      active
                        ? 'bg-brand-blueLight text-brand-blue font-bold'
                        : 'text-slate-700 hover:bg-slate-50 hover:text-brand-blue'
                    }`}
                  >
                    {link.title}
                  </Link>
                );
              })}
            </nav>

            <div className="pt-4 mt-3 border-t border-slate-100 space-y-2.5">
              <a
                href={`tel:${COMPANY_CONFIG.phone.raw}`}
                onClick={() => {
                  trackCallClick('mobile_nav');
                  setIsMobileMenuOpen(false);
                }}
                className="w-full inline-flex items-center justify-center py-2.5 rounded-full border border-slate-200 text-slate-800 text-xs font-bold space-x-2 hover:bg-slate-50 transition-colors"
              >
                <PhoneCall className="w-3.5 h-3.5 text-brand-blue" />
                <span>Call Admissions: {COMPANY_CONFIG.phone.display}</span>
              </a>
              <Link
                to="/contact?tab=admission"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full inline-flex items-center justify-center py-3 rounded-full bg-gradient-to-r from-brand-blue to-indigo-600 text-white text-xs font-bold uppercase tracking-wider shadow-pill hover:shadow-pill-hover transition-all"
              >
                Enquire Now
              </Link>
            </div>
          </div>
        </>
      )}
    </header>
  );
};
