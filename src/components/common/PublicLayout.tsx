import { Outlet } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { FloatingWhatsApp } from './FloatingWhatsApp';

export const PublicLayout = () => {
  const { scrollYProgress } = useScroll();
  // Smooth fade: 0 opacity at the top of the page to eliminate any initial dot/shadow glitch,
  // fading smoothly into view once the user actively scrolls.
  const opacity = useTransform(scrollYProgress, [0, 0.015, 0.04], [0, 0.7, 1]);

  return (
    <div className="min-h-screen flex flex-col bg-brand-bgLight text-brand-darkText relative">
      {/* Top Reading Scroll Progress Bar: smooth GPU transform, zero spring oscillation glitch */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-brand-blue via-indigo-500 to-blue-400 z-50 origin-left pointer-events-none"
        style={{ scaleX: scrollYProgress, opacity }}
      />
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <FloatingWhatsApp />
    </div>
  );
};
