import nodemailer from 'nodemailer';

// Le transport est créé à la première utilisation, une fois le .env chargé
let transporter = null;

export const isMailerConfigured = () => Boolean(process.env.SMTP_HOST);

const getTransporter = () => {
  if (transporter) return transporter;
  if (isMailerConfigured()) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
      connectionTimeout: 10000,
    });
  } else {
    // Sans SMTP (développement) : l'email est construit puis affiché dans le terminal, jamais envoyé
    transporter = nodemailer.createTransport({ jsonTransport: true });
  }
  return transporter;
};

// Affichage lisible d'une adresse : chaîne, ou objet { name, address }
const formatAddress = (a) => (typeof a === 'object' && a !== null ? `${a.name} <${a.address}>` : a);

const defaultFrom = () => process.env.MAIL_FROM || process.env.SMTP_USER || 'ImmoTuléar <no-reply@localhost>';

// Destinataires des notifications de l'agence (MAIL_TO, séparés par des virgules)
export const agencyRecipients = () =>
  (process.env.MAIL_TO || '').split(',').map((s) => s.trim()).filter(Boolean);

/**
 * Envoie un email. Ne lève jamais d'erreur : un problème SMTP ne doit pas
 * empêcher l'enregistrement d'un message. Renvoie { ok, info | error }.
 */
export const sendMail = async (options) => {
  const message = { from: defaultFrom(), ...options };
  try {
    const info = await getTransporter().sendMail(message);
    if (!isMailerConfigured()) {
      console.log(
        `📧 Email non envoyé (SMTP non configuré)\n` +
        `   À : ${[].concat(message.to).join(', ')}\n` +
        (message.replyTo ? `   Répondre à : ${formatAddress(message.replyTo)}\n` : '') +
        `   Sujet : ${message.subject}\n` +
        `   ---\n${(message.text || '').split('\n').map((l) => `   ${l}`).join('\n')}`
      );
    } else {
      const preview = nodemailer.getTestMessageUrl(info);
      console.log(`📧 Email envoyé à ${[].concat(message.to).join(', ')} : « ${message.subject} »${preview ? `\n   Aperçu : ${preview}` : ''}`);
    }
    return { ok: true, info };
  } catch (error) {
    console.error(`❌ Échec d'envoi d'email à ${[].concat(message.to).join(', ')} : ${error.message}`);
    return { ok: false, error };
  }
};

// Vérifie la connexion au serveur SMTP (utilisé par env:check et mail:test)
export const verifyMailer = async () => {
  if (!isMailerConfigured()) return { ok: false, reason: 'not-configured' };
  try {
    await getTransporter().verify();
    return { ok: true };
  } catch (error) {
    return { ok: false, reason: 'error', error };
  }
};
