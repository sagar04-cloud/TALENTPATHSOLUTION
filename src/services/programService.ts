import type { Program } from '../types/index.ts';
import { INITIAL_PROGRAMS } from '../data/initialData.ts';

// Clear any stale local storage from prior iterations or admin mock sessions
if (typeof window !== 'undefined') {
  try {
    ['tps_programs_v1', 'tps_programs_v2', 'tps_programs_v3'].forEach(k => {
      localStorage.removeItem(k);
    });
  } catch {
    // Ignore storage errors in restricted iframe/browser modes
  }
}

/**
 * Deterministic rank mapping guaranteeing strict hierarchy:
 * 1: 10th / SSLC
 * 2: 12th / PUC
 * 3: BCA (Undergrad)
 * 4: BBA (Undergrad)
 * 5: B.Com (Undergrad)
 * 6: MCA (Postgrad)
 * 7: MBA (Postgrad)
 * 8: M.Com (Postgrad)
 */
export const getProgramRank = (prog: Program): number => {
  if (typeof prog.order === 'number') {
    return prog.order;
  }
  const t = (prog.title || '').toLowerCase();
  if (t.includes('sslc') || t.includes('10th')) return 1;
  if (t.includes('puc') || t.includes('12th')) return 2;
  if (t.includes('bca') || (t.includes('bachelor') && t.includes('computer'))) return 3;
  if (t.includes('bba') || (t.includes('bachelor') && t.includes('business'))) return 4;
  if (t.includes('b.com') || t.includes('bcom') || (t.includes('bachelor') && t.includes('commerce'))) return 5;
  if (t.includes('mca') || (t.includes('master') && t.includes('computer'))) return 6;
  if (t.includes('mba') || (t.includes('master') && t.includes('business'))) return 7;
  if (t.includes('m.com') || t.includes('mcom') || (t.includes('master') && t.includes('commerce'))) return 8;

  if (prog.category === 'sslc_puc') return 2.5;
  if (prog.category === 'undergraduate') return 5.5;
  if (prog.category === 'postgraduate') return 8.5;
  return 99;
};

export const sortPrograms = (programs: Program[]): Program[] => {
  return [...programs].sort((a, b) => getProgramRank(a) - getProgramRank(b));
};

export const programService = {
  async getPrograms(category?: string): Promise<Program[]> {
    let items = sortPrograms(INITIAL_PROGRAMS);
    if (category && category !== 'all') {
      items = items.filter(p => p.category === category);
    }
    return items;
  },

  async getPublishedPrograms(category?: string): Promise<Program[]> {
    const all = await this.getPrograms(category);
    return all.filter(p => p.is_published);
  },

  async getProgramBySlug(slug: string): Promise<Program | null> {
    const all = await this.getPrograms();
    return all.find(p => p.slug === slug) || null;
  }
};
