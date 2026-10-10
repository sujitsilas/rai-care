/**
 * SparkHeal lead capture: Google Apps Script web app.
 *
 * Receives "Get Updates" signups from the website form (index.html), adds each
 * one as a row in this Google Sheet, and emails the founder. Setup steps are in
 * README.md next to this file.
 */

const NOTIFY_EMAIL = 'kanishk@raicare.health';
const SHEET_NAME = 'Leads';
const HEADERS = [
  'Timestamp', 'Name', 'Email', 'Role', 'Company', 'Position', 'Notify me',
  'UTM source', 'UTM medium', 'UTM campaign', 'Referrer'
];

/** Run once from the Apps Script editor: creates the Leads tab and grants permissions. */
function setup() {
  getSheet_();
  // Touch MailApp so the authorization prompt also covers sending email
  Logger.log('Emails left today: ' + MailApp.getRemainingDailyQuota());
}

/** Lets you open the web app URL in a browser to confirm the deployment is live. */
function doGet() {
  return ContentService.createTextOutput('SparkHeal lead capture is running.');
}

function doPost(e) {
  const p = (e && e.parameter) || {};

  // Honeypot: people never see this field, bots fill it in
  if (p.website) return json_({ ok: true });

  const lead = {
    name: clean_(p.name, 120),
    email: clean_(p.email, 160),
    role: clean_(p.role, 60),
    company: clean_(p.company, 160),
    position: clean_(p.position, 160),
    notify: p.notify === 'yes' ? 'Yes' : 'No',
    utmSource: clean_(p.utm_source, 100),
    utmMedium: clean_(p.utm_medium, 100),
    utmCampaign: clean_(p.utm_campaign, 100),
    referrer: clean_(p.referrer, 300)
  };

  if (!lead.name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email)) {
    return json_({ ok: false, error: 'Missing name or invalid email' });
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    getSheet_().appendRow([new Date()].concat([
      lead.name, lead.email, lead.role, lead.company, lead.position, lead.notify,
      lead.utmSource, lead.utmMedium, lead.utmCampaign, lead.referrer
    ].map(safe_)));
  } finally {
    lock.releaseLock();
  }

  try {
    const label = [lead.role, lead.company].filter(Boolean).join(', ');
    MailApp.sendEmail({
      to: NOTIFY_EMAIL,
      replyTo: lead.email,
      subject: 'New SparkHeal lead: ' + lead.name + (label ? ' (' + label + ')' : ''),
      body: [
        'New signup from the SparkHeal website:',
        '',
        'Name: ' + lead.name,
        'Email: ' + lead.email,
        'Role: ' + lead.role,
        'Company: ' + lead.company,
        'Position: ' + lead.position,
        'Notify when available: ' + lead.notify,
        'Source: ' + ([lead.utmSource, lead.utmMedium, lead.utmCampaign].filter(Boolean).join(' / ') || 'direct'),
        'Referrer: ' + (lead.referrer || 'none'),
        '',
        'All leads: ' + SpreadsheetApp.getActiveSpreadsheet().getUrl()
      ].join('\n')
    });
  } catch (err) {
    // Daily email quota reached: the row is already saved, so the signup still succeeds
    console.error(err);
  }

  return json_({ ok: true });
}

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
  }
  return sheet;
}

function clean_(value, maxLength) {
  return String(value || '').trim().slice(0, maxLength);
}

/** Stops a submitted value like "=HYPERLINK(...)" from running as a formula in the Sheet. */
function safe_(value) {
  return /^[=+\-@]/.test(value) ? "'" + value : value;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
