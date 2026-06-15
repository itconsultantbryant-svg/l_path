/**
 * Turn admin-configured WhatsApp contact (link or phone) into a clickable URL.
 */
const resolveWhatsAppUrl = (contact) => {
  if (!contact || !String(contact).trim()) return null;

  const raw = String(contact).trim();

  if (/^https?:\/\//i.test(raw)) {
    return raw;
  }

  if (/^(chat\.whatsapp\.com|wa\.me)\//i.test(raw) || /^chat\.whatsapp\.com/i.test(raw)) {
    return raw.startsWith('http') ? raw : `https://${raw}`;
  }

  const digits = raw.replace(/\D/g, '');
  if (!digits) return null;

  return `https://wa.me/${digits}`;
};

const parseBooleanSetting = (value, defaultValue = true) => {
  if (value === null || value === undefined || value === '') return defaultValue;
  if (typeof value === 'boolean') return value;
  const normalized = String(value).trim().toLowerCase();
  if (['true', '1', 'yes', 'on'].includes(normalized)) return true;
  if (['false', '0', 'no', 'off'].includes(normalized)) return false;
  return defaultValue;
};

module.exports = {
  resolveWhatsAppUrl,
  parseBooleanSetting
};
