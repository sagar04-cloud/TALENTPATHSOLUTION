# 📧 Talent Path Solutions - Email Testing & SMTP Verification Suite

This branch contains the **dedicated, standalone email service testing suite** for Talent Path Solutions.

---

## 📂 Included Components

* **`server/emailService.js`**: Core email dispatcher with HTML & Plain-Text templates for admin lead alerts and candidate confirmation receipts.
* **`server/smtpServer.js`**: Local mock/staging HTTP server simulating the serverless mailer.
* **`api/send-enquiry.js`**: Production Vercel serverless function with IP rate limiting, honeypot spam protection, and request sanitization.
* **`tests/emailService.test.mjs`**: Automated unit tests for email formatting, RFC 5322 compliance, HTML templating, and SMTP transporter configurations.
* **`tests/apiEndpoint.test.mjs`**: Automated endpoint tests for HTTP methods, headers, payload validation, and anti-spam filters.
* **`scripts/run-all-tests.js`**: Test runner executing the full test suite using Node's native test runner (`node:test`).
* **`scripts/test-smtp.js`**: Interactive verification tool for live Google SMTP credentials and inbox delivery checks.

---

## 🚀 Running the Tests

### 1. Install Dependencies
```bash
npm install
```

### 2. Run All Automated Unit Tests
```bash
npm test
```
Runs all unit test suites (`emailService.test.mjs` and `apiEndpoint.test.mjs`).

### 3. Verify Live Google SMTP Connection
1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Enter your Google SMTP App Password in `.env`:
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=465
   SMTP_SECURE=true
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=xxxx-xxxx-xxxx-xxxx
   SMTP_TO=sagaru.works@gmail.com
   ```
3. Run the live verification script:
   ```bash
   npm run smtp:test
   ```

### 4. Start Local SMTP Server (Optional)
```bash
npm run smtp:server
```
Runs a local HTTP server on port 3001 to accept test JSON payloads at `http://localhost:3001/api/send-enquiry`.
