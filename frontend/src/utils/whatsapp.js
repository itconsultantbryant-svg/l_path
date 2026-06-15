export const resolveWhatsAppUrl = (contact) => {
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
