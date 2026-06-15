const nodemailer = require('nodemailer');
const twilio = require('twilio');

const getEmailTransport = () => {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) {
    return null;
  }
  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass }
  });
};

const sendEmail = async ({ to, subject, text }) => {
  const transporter = getEmailTransport();
  if (!transporter) {
    return { ok: false, error: 'Email delivery is not configured.' };
  }
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  await transporter.sendMail({ from, to, subject, text });
  return { ok: true };
};

const getTwilioClient = () => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!accountSid || !authToken) {
    return null;
  }
  return twilio(accountSid, authToken);
};

const normalizeLiberiaNumber = (raw) => {
  if (!raw) return null;
  const trimmed = raw.toString().trim();
  if (trimmed.startsWith('+')) return trimmed;
  const digits = trimmed.replace(/\D/g, '');
  if (!digits) return null;
  if (digits.startsWith('231')) return `+${digits}`;
  if (digits.startsWith('0')) {
    return `+231${digits.slice(1)}`;
  }
  return `+231${digits}`;
};

const sendSms = async ({ to, body }) => {
  const client = getTwilioClient();
  const from = process.env.TWILIO_FROM;
  if (!client || !from) {
    return { ok: false, error: 'SMS delivery is not configured.' };
  }
  const normalizedTo = normalizeLiberiaNumber(to);
  if (!normalizedTo) {
    return { ok: false, error: 'Invalid phone number.' };
  }
  await client.messages.create({ to: normalizedTo, from, body });
  return { ok: true };
};

module.exports = {
  sendEmail,
  sendSms
};
