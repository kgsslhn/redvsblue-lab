const express = require('express');
const cookieParser = require('cookie-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3075;
const LOG_DIR = '/opt/admin/logs';

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

// ---------- LOGGING HELPERS ----------
function writeAccessLog(line) {
  const ts = new Date().toISOString().replace('T', ' ').substring(0, 19);
  fs.appendFileSync(path.join(LOG_DIR, 'access.log'), `[${ts}] ${line}\n`);
}
function writeErrorLog(level, msg) {
  const ts = new Date().toISOString().replace('T', ' ').substring(0, 19);
  fs.appendFileSync(path.join(LOG_DIR, 'error.log'), `[${ts}] [${level}] ${msg}\n`);
}

// ---------- PHASE 1: RECON ----------
// X-Powered-By: Node.js (Express sets it automatically)
app.set('x-powered-by', true);

// robots.txt
app.get('/robots.txt', (req, res) => {
  res.type('text/plain').send(
`User-agent: *
Disallow: /api/verify-mfa
Disallow: /dashboard
`);
});

// ---------- HOME (with ASCII hint) ----------
app.get('/', (req, res) => {
  // Set pre-auth cookie (HttpOnly FALSE — vulnerable!)
  res.cookie('pre_mfa_session', 'pending_mfa_verification', { httpOnly: false });
  res.send(`<!DOCTYPE html>
<html>
<head><title>Admin Feedback System</title></head>
<body>
<!--
   ___  ___  ___ ___ _  _   _____ ___ ___ _____
  | _ \\| _ \\/ _ \\_ _| \\| | |_   _/ __|_ _|_   _|
  |   /|   / (_) || || .\` |   | | \\__ \\| |  | |
  |_|_\\|_|_\\\\___/|___|_|\\_|   |_| |___/___| |_|
  psst... check /robots.txt ;)
-->
<h1>Admin Feedback System</h1>
<form method="POST" action="/api/feedback">
  <textarea name="message" placeholder="Your feedback"></textarea>
  <button type="submit">Submit</button>
</form>
</body>
</html>`);
});

// ---------- PHASE 2: WAF + XSS ----------
app.post('/api/feedback', (req, res) => {
  const msg = req.body.message || '';

  // Rudimentary WAF
  if (/<script/i.test(msg)) {
    writeErrorLog('WARN', `WAF block: <script> tag detected from ${req.ip}`);
    return res.status(403).send('403 Forbidden — WAF blocked <script>');
  }
  if (/document\.cookie/i.test(msg)) {
    writeErrorLog('WARN', `WAF block: document.cookie keyword from ${req.ip}`);
    return res.status(403).send('403 Forbidden — keyword blocked');
  }

  // Vulnerable: reflects message into dashboard
  writeAccessLog(`POST /api/feedback from ${req.ip} ua="${req.headers['user-agent']}"`);
  res.send(`Feedback stored. Preview: <div class="xss-payload">${msg}</div>`);
});

// ---------- PHASE 3: MFA VERIFY (never reached) ----------
app.post('/api/verify-mfa', (req, res) => {
  writeAccessLog(`POST /api/verify-mfa from ${req.ip}`);
  res.send('MFA verified');
});

// ---------- DASHBOARD (MFA bypass!) ----------
app.get('/dashboard', (req, res) => {
  const adminSession = req.cookies['adm_sess'];

  // VULNERABILITY: If adm_sess cookie exists, skip MFA entirely
  if (!adminSession) {
    writeAccessLog(`GET /dashboard from ${req.ip} - 302 redirect (no adm_sess)`);
    return res.redirect('/');
  }

  writeAccessLog(`GET /dashboard from ${req.ip} - 200 OK (adm_sess present)`);

  res.send(`<!DOCTYPE html>
<html>
<head><title>Admin Dashboard</title></head>
<body>
<h1>Admin Dashboard</h1>
<div class="xss-payload">${req.query.payload || ''}</div>
<hr>
<h2>🎉 CONGRATULATIONS</h2>
<pre>SCENARIO75{RED_C00k13_MFA_Byp4ss_0wn3d}</pre>
</body>
</html>`);
});

// ---------- SIMULATED ADMIN LOGIN (issues adm_sess) ----------
app.post('/api/login', (req, res) => {
  // Simplified: any login with correct MFA yields adm_sess
  res.cookie('adm_sess', 'admin_authenticated_' + Date.now(), { httpOnly: false });
  res.send('Logged in. adm_sess issued.');
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Admin Feedback System running on port ${PORT}`);
  writeAccessLog('Server started on port 3075');
});