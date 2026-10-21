#!/usr/bin/env node
/**
 * Vérifie la configuration email et envoie un message de test.
 *
 *   npm run mail:test                         envoie à MAIL_TO
 *   npm run mail:test -- quelquun@exemple.mg  envoie à cette adresse
 */
import 'dotenv/config';
import { sendMail, verifyMailer, isMailerConfigured, agencyRecipients } from '../src/services/mailer.js';

const to = process.argv[2] || agencyRecipients().join(', ');
if (!to) {
  console.error('❌ Aucun destinataire : renseignez MAIL_TO dans .env ou passez une adresse en argument.');
  process.exit(1);
}

if (isMailerConfigured()) {
  console.log(`Connexion à ${process.env.SMTP_HOST}:${process.env.SMTP_PORT || 587}…`);
  const check = await verifyMailer();
  if (!check.ok) {
    console.error(`❌ Connexion SMTP impossible : ${check.error?.message}`);
    console.error('   Vérifiez SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER et SMTP_PASS dans .env');
    process.exit(1);
  }
  console.log('✅ Connexion SMTP réussie');
} else {
  console.log('ℹ️  SMTP non configuré : l\'email de test sera seulement affiché ci-dessous.');
}

const sentAt = new Date().toLocaleString('fr-FR');
const result = await sendMail({
  to,
  subject: 'Test d\'envoi — ImmoTuléar',
  text: `Ceci est un email de test envoyé par le site ImmoTuléar le ${sentAt}.\nSi vous le recevez, les notifications des messages fonctionnent.`,
  html: `<p>Ceci est un email de test envoyé par le site <strong>ImmoTuléar</strong> le ${sentAt}.</p><p>Si vous le recevez, les notifications des messages fonctionnent.</p>`,
});

process.exit(result.ok ? 0 : 1);
