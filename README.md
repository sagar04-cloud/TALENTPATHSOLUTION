# Talent Path Solutions — Corporate Web Application

A modern, responsive, conversion-optimized corporate web application and automated lead dispatch system built for **Talent Path Solutions** (University Admissions, Flexible Degrees, SSLC/PUC Board Pathways, 1-on-1 Career Advisory, and Corporate Recruitment Services).

---

## 1. Overview & Service Verticals

Talent Path Solutions provides comprehensive academic guidance and human resource solutions:
- **Degree Programs & Flexible Learning:** UGC & DEB-recognized undergraduate and postgraduate degrees with flexible learning schedules for students and working professionals.
- **SSLC & PUC Pathways:** 10th and 12th board completion pathways through recognized open-schooling frameworks (NIOS & state open boards).
- **1-on-1 Career Guidance:** Structured mentorship sessions exploring curriculum options, eligibility criteria, and examination formats.
- **Corporate Recruitment:** Staffing and talent acquisition vertical partnering with corporate firms, SMEs, and institutions.
- **Education News & Updates:** Timely insights, notifications, and examination guidance.

---

## 2. Technology Stack

- **Frontend Core:** React 19, TypeScript, Vite 8
- **Styling & Design Tokens:** Tailwind CSS with custom brand theme tokens (`src/index.css`, `tailwind.config.js`)
- **Animations:** Framer Motion & Hardware-Accelerated CSS SVG Animations
- **Icons:** Lucide React
- **Routing:** React Router v7 (`src/App.tsx`)
- **Forms & Validation:** React Hook Form + Zod Schema Validation (`@hookform/resolvers/zod`)
- **Backend & Serverless:** Vercel Serverless Function (`api/send-enquiry.js`) + Nodemailer
- **Analytics:** Google Analytics 4 (GA4) with client-side PII sanitization
- **Automated Testing:** Node.js native test runner (`node:test`), TAP compliance
- **Linting:** Oxlint

---

## 3. Project Architecture

```
d:/final cilent/
├── api/
│   └── send-enquiry.js         # Vercel Serverless Function (rate-limiting, sanitization, email dispatch)
├── public/
│   ├── apple-touch-icon.png    # iOS touch icon
│   ├── favicon.svg             # Clean corporate SVG favicon
│   ├── favicon.ico             # Multi-resolution ICO favicon
│   ├── logo.png                # Official emblem & wordmark logo
│   ├── og-image.jpg            # Open Graph social preview card
│   ├── robots.txt              # Search crawler directives
│   └── sitemap.xml             # Canonical XML sitemap
├── scripts/
│   ├── run-all-tests.js        # Automated test orchestrator running all 6 test suites
│   └── test-smtp.js            # Standalone SMTP connectivity diagnostic tool
├── server/
│   ├── emailService.js         # Core Nodemailer email builder & transporter
│   ├── emailService.d.ts       # TypeScript type declarations for emailService
│   └── smtpServer.js           # Local development Express SMTP relay
├── src/
│   ├── config/
│   │   └── company.ts          # Central corporate configuration (Phone, WhatsApp, Emails, Operating Hours)
│   ├── data/
│   │   └── initialData.ts      # Structured degree programs, news articles & data seeds
│   ├── lib/
│   │   └── analytics.ts        # GA4 event tracking with strict PII stripping
│   ├── services/
│   │   ├── enquiryService.ts   # Form submission service with fallback mailto generator
│   │   ├── programService.ts   # Program filtering, search & modal data
│   │   └── newsService.ts      # Education articles & news feeds
│   ├── types/
│   │   └── index.ts            # TypeScript interfaces (Enquiry, Program, NewsArticle, etc.)
│   ├── components/
│   │   ├── common/
│   │   │   ├── Navbar.tsx      # Header with mobile drawer, phone click-to-call & quick enquiry CTA
│   │   │   ├── Footer.tsx      # Corporate footer with direct links & accreditation notes
│   │   │   ├── FloatingWhatsApp.tsx # Floating WhatsApp quick-connect widget
│   │   │   ├── PublicLayout.tsx # Global page layout wrapper
│   │   │   ├── SEOHead.tsx     # Dynamic meta tags & page view analytics tracking
│   │   │   └── SpotlightCard.tsx # Interactive glowing card component
│   │   ├── forms/
│   │   │   ├── AdmissionEnquiryForm.tsx # 10-field admissions form with honeypot
│   │   │   ├── CareerGuidanceForm.tsx   # Specialized career mentorship form
│   │   │   ├── RecruitmentEnquiryForm.tsx # Corporate hiring request form
│   │   │   ├── GeneralContactForm.tsx   # General support & inquiry form
│   │   │   └── EnquirySuccessView.tsx   # Clean animated SVG checkmark confirmation screen
│   │   └── home/
│   │       ├── HeroSection.tsx
│   │       ├── CompanyIntro.tsx
│   │       ├── ServicesGrid.tsx
│   │       ├── HowItWorks.tsx
│   │       ├── WhyChooseUs.tsx
│   │       ├── FeaturedPrograms.tsx
│   │       ├── CareerGuidanceCTA.tsx
│   │       ├── NewsPreview.tsx
│   │       └── FinalCTA.tsx
│   └── pages/
│       ├── HomePage.tsx
│       ├── AboutPage.tsx
│       ├── CoursesPage.tsx
│       ├── CareerGuidancePage.tsx
│       ├── FlexibleLearningPage.tsx
│       ├── SslcPucPage.tsx
│       ├── RecruitmentPage.tsx
│       ├── NewsPage.tsx
│       ├── NewsDetailPage.tsx
│       ├── ContactPage.tsx
│       ├── PrivacyPolicyPage.tsx
│       ├── TermsPage.tsx
│       └── NotFoundPage.tsx
├── tests/
│   ├── apiEndpoint.test.mjs    # Tests for /api/send-enquiry (methods, security headers, rate-limiting)
│   ├── companyConfig.test.mjs  # Tests for corporate configuration consistency & valid contacts
│   ├── dataIntegrity.test.mjs  # Tests for course catalogs & schema validation
│   ├── emailService.test.mjs   # Tests for RFC 5322 formatting & HTML template rendering
│   ├── enquiryService.test.mjs # Tests for structured email data generation
│   └── publicAssets.test.mjs   # Tests for icons, logo dimensions, robots.txt & sitemap
├── .env.example                # Documented environment variables template
├── tailwind.config.js          # Tailwind CSS styling and theme definitions
├── tsconfig.json               # TypeScript configuration
├── vercel.json                 # Vercel deployment routes and serverless configuration
└── package.json
```

---

## 4. Setup & Running Locally

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Fill in your Google SMTP credentials (see Section 5 below).

### Step 3: Run the Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### Step 4: Run the Automated Unit Test Suite
```bash
npm test
```
Runs 6 automated test suites (23 test assertions) covering API endpoints, email builders, data integrity, and asset health.

### Step 5: Validate Production Build
```bash
npm run build
```

---

## 5. Automated Email Service (Google SMTP)

When a candidate or corporate representative submits an enquiry form:
1. **Serverless Dispatch:** The submission is processed by `POST /api/send-enquiry` with:
   - In-memory rate limiting (10 requests per 10 minutes per IP).
   - Silent honeypot spam-bot rejection.
   - CRLF and HTML injection sanitization.
2. **Dual-Delivery Delivery:**
   - **Admin Lead Notice:** Dispatched to the counselor desk (`sagaru.works@gmail.com` or configured `SMTP_TO`).
   - **Applicant Confirmation Receipt:** Dispatched to the candidate's email with their unique Reference ID.

### Generating Google App Password:
1. Go to your **Google Account** -> **Security** -> **2-Step Verification**.
2. Scroll to **App passwords**.
3. Generate a new password (e.g., named "TalentPath").
4. Copy the 16-character token into `.env`:
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=465
   SMTP_SECURE=true
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=xxxx-xxxx-xxxx-xxxx
   SMTP_FROM="Talent Path Solutions <your-email@gmail.com>"
   SMTP_TO=sagaru.works@gmail.com
   ```

### Verifying SMTP Connection:
```bash
npm run smtp:test
```

---

## 6. Enquiry Submission & Success Animation Flow

1. **Submission Trigger:** When the user clicks the submit button, the form validates inputs with Zod.
2. **Smooth Loading Ring:** Displays the glowing circular loader animation (`.loader`) with an intentional display delay to ensure a smooth, professional feel even on ultra-fast networks.
3. **Clean Success Confirmation (`EnquirySuccessView`):**
   - **Animated SVG Checkmark:** Emerald circle stroke draws around clockwise, fills into solid `#10B981`, followed by a crisp white checkmark drawing from left to right with an elastic pop.
   - **Title:** "Your Enquiry Application Submitted Successfully" enters with a smooth upward glide.
   - **Okay Button:** Returns the user cleanly back to the fresh enquiry form.
   - **Zero Watermarks:** Uncluttered, clean white card aesthetics matching the brand identity.

---

## 7. Google Analytics 4 (GA4) Tracking

- To enable tracking, specify your measurement ID in `.env` or `src/config/company.ts`:
  ```env
  VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
  ```
- **Automatically Tracked Events:**
  - `page_view` (route changes)
  - `form_start` (focus on any enquiry form)
  - `form_submit_success` (successful registration)
  - `click_whatsapp` (widget & floating button clicks)
  - `click_call` (helpline telephone clicks)
  - `click_email` (mail links)
  - `click_career_guidance`
  - `click_recruitment_enquiry`
- **Privacy Compliance:** All tracking strictly strips candidate names, phone numbers, and email addresses.

---

## 8. Production Deployment (Vercel)

The project includes `vercel.json` and serverless functions pre-configured for Vercel deployment:

1. Push your code to your GitHub repository:
   ```bash
   git push -u origin main
   ```
2. Log in to [Vercel](https://vercel.com) and import the repository.
3. Configure the Project Settings:
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Add the Environment Variables from your `.env` (`SMTP_USER`, `SMTP_PASS`, `SMTP_TO`, etc.) under **Project Settings -> Environment Variables**.
5. Click **Deploy**.

---

## 9. License & Ownership

Copyright © 2026 Talent Path Solutions. All rights reserved. jghkjh

