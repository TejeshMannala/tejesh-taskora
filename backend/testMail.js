import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ─────────────────────────────────────────────────────────────────────────────
//  SMTP Diagnostic Tool — run with:  node testMail.js
// ─────────────────────────────────────────────────────────────────────────────

console.log('');
console.log('═══════════════════════════════════════════════════════════');
console.log('  Gmail SMTP Diagnostic Tool');
console.log('═══════════════════════════════════════════════════════════');
console.log('');

// 1. Load .env
// -------------------------------------------------------------------
const envPath = resolve(__dirname, '.env');
console.log(`[1] Loading .env from: ${envPath}`);

const result = dotenv.config({ path: envPath });

if (result.error) {
  console.error(`    FAILED to load .env: ${result.error.message}`);
  process.exit(1);
}
console.log('    .env loaded successfully');
console.log('');

// 2. Check env vars
// -------------------------------------------------------------------
console.log('[2] Environment variables:');

const user = process.env.MAIL_USER || process.env.SMTP_USER;
const pass = process.env.MAIL_PASS || process.env.SMTP_PASS;
const host = process.env.SMTP_HOST || 'smtp.gmail.com';
const port = parseInt(process.env.SMTP_PORT, 10) || 587;
const secure = process.env.SMTP_SECURE === 'true';

console.log(`    MAIL_USER / SMTP_USER: ${user || 'NOT SET'}`);
console.log(`    MAIL_PASS / SMTP_PASS: ${pass ? 'SET (' + pass.length + ' chars)' : 'NOT SET'}`);
console.log(`    SMTP_HOST:              ${host}`);
console.log(`    SMTP_PORT:              ${port}`);
console.log(`    SMTP_SECURE:            ${secure}`);

if (!user) {
  console.error('\n    ❌ MAIL_USER is missing. Add it to backend/.env');
  process.exit(1);
}
if (!pass) {
  console.error('\n    ❌ MAIL_PASS is missing. Add it to backend/.env');
  process.exit(1);
}

// Validate Gmail App Password format (16 chars, no spaces)
const cleanPass = pass.replace(/\s/g, '');
if (cleanPass.length !== 16) {
  console.log(`    ⚠️  App Password length is ${cleanPass.length} chars — Gmail App Passwords are exactly 16 characters`);
} else {
  console.log('    ✅ App Password length: 16 characters (correct)');
}

console.log('');

// 3. Attempt SMTP connection
// -------------------------------------------------------------------
console.log('[3] Creating Nodemailer transporter...');

const transporter = nodemailer.createTransport({
  host,
  port,
  secure,
  auth: { user, pass: cleanPass },
  tls: {
    rejectUnauthorized: false,
  },
  debug: true,
  logger: true,
});

console.log('    Transporter created');
console.log('    Attempting SMTP connection and authentication...');
console.log('');

try {
  const success = await transporter.verify();
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  ✅  SMTP CONNECTION SUCCESSFUL');
  console.log('  ✅  Gmail credentials are VALID');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
  console.log(`  Account: ${user}`);
  console.log(`  Host:    ${host}:${port}`);
  console.log('');
  process.exit(0);
} catch (error) {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  ❌  SMTP CONNECTION FAILED');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');

  // 4. Detailed error analysis
  // -------------------------------------------------------------------
  console.log('[4] Error details:');
  console.log('');
  console.log(`  Error code:     ${error.code || 'N/A'}`);
  console.log(`  Error command:  ${error.command || 'N/A'}`);
  console.log(`  Error response: ${error.response || 'N/A'}`);
  console.log(`  Error message:  ${error.message}`);
  console.log('');

  // 5. Root cause diagnosis
  // -------------------------------------------------------------------
  console.log('[5] Root cause analysis:');
  console.log('');

  const msg = error.message || '';
  const response = error.response || '';

  if (msg.includes('535') || response.includes('535')) {
    console.log('  ❌ ERROR 535: Username and Password not accepted');
    console.log('');
    console.log('  This means Gmail RECEIVED your credentials and REJECTED them.');
    console.log('  The App Password you have stored in .env is no longer valid.');
    console.log('');

    if (cleanPass.length !== 16) {
      console.log('  ⚠️  Your password is not 16 characters — this is not a valid App Password.');
      console.log('     App Passwords are always exactly 16 characters (no spaces).');
      console.log('');
    }

    console.log('  Common causes (in order of likelihood):');
    console.log('');
    console.log('  1. App Password was revoked at https://myaccount.google.com/apppasswords');
    console.log('     → Fix: Generate a NEW App Password and update .env');
    console.log('');
    console.log('  2. 2-Step Verification is NOT enabled on this Google account');
    console.log('     → App Passwords only work when 2-Step Verification is ON');
    console.log('     → Fix: Enable at https://myaccount.google.com/security');
    console.log('');
    console.log('  3. App Password was generated for a different Google account');
    console.log('     → MAIL_USER is mannalatejesh2004@gmail.com');
    console.log('     → The App Password must be generated FROM this exact account');
    console.log('');
    console.log('  4. Google account password was changed recently');
    console.log('     → All App Passwords are automatically revoked when you change your password');
    console.log('     → Fix: Generate a new App Password');
    console.log('');
    console.log('  5. Less secure app access (not applicable anymore)');
    console.log('     → Google removed this option in 2022');
    console.log('     → App Passwords are the ONLY way to use SMTP with 2FA');
    console.log('');
  } else if (msg.includes('connect') || msg.includes('ENOTFOUND') || msg.includes('ECONNREFUSED')) {
    console.log('  ❌ Network error — cannot reach Gmail SMTP servers');
    console.log('');
    console.log('  This means your computer cannot connect to smtp.gmail.com:587');
    console.log('  Possible causes: firewall, antivirus, corporate proxy, or no internet');
  } else if (msg.includes('Missing credentials')) {
    console.log('  ❌ MAIL_USER or MAIL_PASS is empty in .env');
    console.log('');
    console.log('  One of the auth fields is undefined or empty.');
  } else {
    console.log('  ❌ Unknown error (see details above)');
  }

  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  HOW TO FIX');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
  console.log('  Step 1: Go to https://myaccount.google.com/security');
  console.log('          Verify "2-Step Verification" is ON');
  console.log('');
  console.log('  Step 2: Go to https://myaccount.google.com/apppasswords');
  console.log('          (If 2FA is OFF, this page will tell you to enable it first)');
  console.log('');
  console.log('  Step 3: Select "Mail" + "Windows Computer" → Click Generate');
  console.log('');
  console.log('  Step 4: Copy the 16-character App Password');
  console.log('          (format: "xxxx xxxx xxxx xxxx" — remove spaces)');
  console.log('');
  console.log('  Step 5: Edit backend/.env and set:');
  console.log('          MAIL_PASS=your_16_character_code');
  console.log('          SMTP_PASS=your_16_character_code');
  console.log('');
  console.log('  Step 6: Run this test again:  node testMail.js');
  console.log('');

  process.exit(1);
}
