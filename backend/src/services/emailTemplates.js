// Modèles des emails envoyés par le site (HTML simple + version texte)

const AGENCY = {
  name: 'ImmoTuléar',
  phones: ['+261 32 02 600 43', '+261 32 05 112 22'],
  email: 'info@immotulear.mg',
  whatsapp: 'https://wa.me/261320260043',
  address: 'Angle Rue du marché, Bd Galliéni, 601 Tuléar (Centre Ville)',
};

const COLORS = { primary: '#0b4f9c', accent: '#0ea5d9', dark: '#0a2540', muted: '#64748b', border: '#e2e8f0' };

// Échappe le texte saisi par les visiteurs avant de l'insérer dans du HTML
export const escapeHtml = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

// Un sujet d'email tient sur une ligne (pas d'injection d'en-têtes) et reste court
const oneLine = (value = '', max = 120) => String(value).replace(/[\r\n]+/g, ' ').trim().slice(0, max);

const siteUrl = () => (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');

const nl2br = (text) => escapeHtml(text).replace(/\r?\n/g, '<br>');

const layout = (title, body) => `<!doctype html>
<html lang="fr">
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;">
        <tr><td style="background:${COLORS.dark};padding:20px 28px;">
          <span style="font-size:22px;font-weight:bold;color:#ffffff;">Immo<span style="color:${COLORS.accent};">Tuléar</span></span>
        </td></tr>
        <tr><td style="padding:28px;">
          <h1 style="margin:0 0 16px;font-size:20px;color:${COLORS.dark};">${title}</h1>
          ${body}
        </td></tr>
        <tr><td style="padding:16px 28px;border-top:1px solid ${COLORS.border};font-size:12px;color:${COLORS.muted};">
          ${AGENCY.name} · ${AGENCY.address}<br>${AGENCY.phones.join(' · ')} · ${AGENCY.email}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

const row = (label, valueHtml) =>
  `<tr><td style="padding:6px 12px 6px 0;color:${COLORS.muted};font-size:14px;white-space:nowrap;vertical-align:top;">${label}</td>` +
  `<td style="padding:6px 0;font-size:14px;">${valueHtml}</td></tr>`;

const button = (href, label) =>
  `<a href="${escapeHtml(href)}" style="display:inline-block;background:${COLORS.primary};color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:bold;font-size:14px;">${label}</a>`;

const propertyUrl = (property) => `${siteUrl()}/property/${property.id}`;

/** Notification à l'agence : un visiteur a envoyé un message. */
export const newContactEmail = (contact, property) => {
  // Le titre du bien n'est ajouté que si le sujet ne le contient pas déjà (« Intéressé par: … »)
  const withProperty = property && !contact.subject.includes(property.titre) ? ` (${property.titre})` : '';
  const subject = oneLine(`Nouveau message : ${contact.subject}${withProperty}`);
  const adminUrl = `${siteUrl()}/admin/messages`;

  const html = layout('Nouveau message depuis le site', `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
      ${row('Nom', escapeHtml(contact.name))}
      ${row('Email', `<a href="mailto:${escapeHtml(contact.email)}" style="color:${COLORS.primary};">${escapeHtml(contact.email)}</a>`)}
      ${contact.phone ? row('Téléphone', `<a href="tel:${escapeHtml(contact.phone)}" style="color:${COLORS.primary};">${escapeHtml(contact.phone)}</a>`) : ''}
      ${row('Sujet', escapeHtml(contact.subject))}
      ${property ? row('Bien', `<a href="${escapeHtml(propertyUrl(property))}" style="color:${COLORS.primary};">${escapeHtml(property.titre)}</a>`) : ''}
    </table>
    <div style="background:#f8fafc;border:1px solid ${COLORS.border};border-radius:8px;padding:16px;font-size:14px;line-height:1.6;margin-bottom:24px;">
      ${nl2br(contact.message)}
    </div>
    <p style="margin:0 0 20px;font-size:14px;color:${COLORS.muted};">Répondez directement à cet email pour écrire à ${escapeHtml(contact.name)}.</p>
    ${button(adminUrl, "Ouvrir dans l'administration")}
  `);

  const text = [
    'Nouveau message depuis le site ImmoTuléar',
    '',
    `Nom : ${contact.name}`,
    `Email : ${contact.email}`,
    contact.phone ? `Téléphone : ${contact.phone}` : null,
    `Sujet : ${contact.subject}`,
    property ? `Bien : ${property.titre} (${propertyUrl(property)})` : null,
    '',
    contact.message,
    '',
    `Administration : ${adminUrl}`,
  ].filter((l) => l !== null).join('\n');

  return { subject, html, text, replyTo: { name: oneLine(contact.name, 80), address: contact.email } };
};

/** Accusé de réception envoyé au visiteur. */
export const contactAcknowledgementEmail = (contact, property) => {
  const subject = 'Nous avons bien reçu votre message — ImmoTuléar';
  const firstName = oneLine(contact.name, 80).split(' ')[0];

  const html = layout(`Merci ${escapeHtml(firstName)}, votre message est bien arrivé`, `
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">
      Notre équipe a bien reçu votre demande${property ? ` concernant <a href="${escapeHtml(propertyUrl(property))}" style="color:${COLORS.primary};">${escapeHtml(property.titre)}</a>` : ''}
      et vous répondra dans les plus brefs délais.
    </p>
    <p style="margin:0 0 8px;font-size:13px;color:${COLORS.muted};">Rappel de votre message :</p>
    <div style="background:#f8fafc;border:1px solid ${COLORS.border};border-radius:8px;padding:16px;font-size:14px;line-height:1.6;margin-bottom:24px;">
      <strong>${escapeHtml(contact.subject)}</strong><br>${nl2br(contact.message)}
    </div>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">
      Pour une réponse plus rapide, appelez-nous au <strong>${AGENCY.phones[0]}</strong> ou écrivez-nous sur WhatsApp.
    </p>
    ${button(AGENCY.whatsapp, 'Nous écrire sur WhatsApp')}
  `);

  const text = [
    `Bonjour ${firstName},`,
    '',
    `Nous avons bien reçu votre message${property ? ` concernant « ${property.titre} »` : ''} et vous répondrons dans les plus brefs délais.`,
    '',
    'Rappel de votre message :',
    contact.subject,
    contact.message,
    '',
    `Pour une réponse plus rapide : ${AGENCY.phones[0]} ou WhatsApp ${AGENCY.whatsapp}`,
    '',
    `${AGENCY.name} — ${AGENCY.address}`,
  ].join('\n');

  return { subject, html, text, replyTo: AGENCY.email };
};
