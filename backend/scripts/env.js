#!/usr/bin/env node
/**
 * Gestion du fichier .env du backend.
 *
 *   npm run env:init            crée .env à partir de .env.example, avec des secrets générés
 *   npm run env:init -- --force recrée .env (l'ancien est sauvegardé en .env.backup-<date>)
 *   npm run env:check           vérifie .env sans afficher les secrets
 *   npm run env:secret          génère un nouveau JWT_SECRET dans .env (déconnecte tout le monde)
 */
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const ENV_PATH = path.join(ROOT, '.env');
const EXAMPLE_PATH = path.join(ROOT, '.env.example');
const SECRET_KEYS = ['JWT_SECRET', 'ADMIN_PASSWORD', 'DATABASE_URL', 'SMTP_PASS'];

const randomSecret = () => crypto.randomBytes(48).toString('hex');
// Mot de passe lisible : lettres et chiffres sans caractères ambigus
const randomPassword = (length = 16) => {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  return Array.from(crypto.randomBytes(length), (b) => alphabet[b % alphabet.length]).join('');
};

// Remplace (ou ajoute) KEY=valeur dans le contenu d'un fichier .env, en gardant les commentaires
const setValue = (content, key, value) => {
  const line = `${key}=${value}`;
  const regex = new RegExp(`^${key}=.*$`, 'm');
  return regex.test(content) ? content.replace(regex, line) : `${content.trimEnd()}\n${line}\n`;
};

// Masque les secrets à l'affichage : mot de passe d'une URL, ou valeur entière
const mask = (key, value) => {
  if (!value) return '(vide)';
  if (key === 'DATABASE_URL') return value.replace(/(\/\/[^:/]+:)[^@]+@/, '$1••••@');
  if (SECRET_KEYS.includes(key)) return `•••• (${value.length} caractères)`;
  return value;
};

const init = (force) => {
  if (!fs.existsSync(EXAMPLE_PATH)) {
    console.error('❌ .env.example introuvable');
    process.exit(1);
  }
  if (fs.existsSync(ENV_PATH)) {
    if (!force) {
      console.log('ℹ️  .env existe déjà : rien n\'a été modifié.');
      console.log('   Pour le recréer : npm run env:init -- --force (l\'ancien sera sauvegardé)');
      return;
    }
    const backup = `${ENV_PATH}.backup-${new Date().toISOString().replace(/[:.]/g, '-')}`;
    fs.copyFileSync(ENV_PATH, backup);
    console.log(`💾 Ancien .env sauvegardé dans ${path.basename(backup)}`);
  }

  let content = fs.readFileSync(EXAMPLE_PATH, 'utf8');
  content = setValue(content, 'JWT_SECRET', randomSecret());
  content = setValue(content, 'ADMIN_PASSWORD', randomPassword());
  // Valeurs passées en ligne de commande : DATABASE_URL=... npm run env:init
  for (const key of ['DATABASE_URL', 'PORT', 'FRONTEND_URL', 'ADMIN_EMAIL', 'NODE_ENV']) {
    if (process.env[key]) content = setValue(content, key, process.env[key]);
  }
  fs.writeFileSync(ENV_PATH, content, { mode: 0o600 });

  console.log('✅ .env créé.');
  console.log('   JWT_SECRET et ADMIN_PASSWORD ont été générés aléatoirement (voir le fichier .env).');
  console.log('   Vérifiez DATABASE_URL, puis lancez : npm run env:check');
};

const check = async () => {
  if (!fs.existsSync(ENV_PATH)) {
    console.error('❌ Pas de fichier .env : lancez « npm run env:init »');
    process.exit(1);
  }
  const values = dotenv.parse(fs.readFileSync(ENV_PATH));
  const exampleKeys = Object.keys(dotenv.parse(fs.readFileSync(EXAMPLE_PATH)));

  console.log('Variables du fichier .env :');
  for (const key of exampleKeys) {
    console.log(`  ${key.padEnd(16)} ${mask(key, values[key])}`);
  }
  const extra = Object.keys(values).filter((k) => !exampleKeys.includes(k));
  if (extra.length) console.log(`  (autres : ${extra.join(', ')})`);
  const missing = exampleKeys.filter((k) => !(k in values));
  if (missing.length) console.log(`\n⚠️  Absentes de .env (valeur par défaut utilisée) : ${missing.join(', ')}`);

  const { checkEnv } = await import('../src/config/env.js');
  const { errors, warnings } = checkEnv(values);
  warnings.forEach((w) => console.log(`⚠️  ${w}`));
  errors.forEach((e) => console.log(`❌ ${e}`));

  // Test de connexion à la base
  if (values.DATABASE_URL) {
    const { default: pg } = await import('pg');
    const client = new pg.Client({ connectionString: values.DATABASE_URL, connectionTimeoutMillis: 5000 });
    try {
      await client.connect();
      const { rows } = await client.query("SELECT to_regclass('public.properties') AS t");
      console.log(rows[0].t
        ? '✅ Connexion à la base réussie, schéma présent'
        : '✅ Connexion à la base réussie — schéma absent : lancez « npm run db:init »');
    } catch (err) {
      console.log(`❌ Connexion à la base impossible : ${err.message}`);
      errors.push('db');
    } finally {
      await client.end().catch(() => {});
    }
  }

  // Test de connexion au serveur SMTP
  if (values.SMTP_HOST) {
    Object.assign(process.env, values);
    const { verifyMailer } = await import('../src/services/mailer.js');
    const result = await verifyMailer();
    console.log(result.ok
      ? '✅ Connexion SMTP réussie'
      : `❌ Connexion SMTP impossible : ${result.error?.message}`);
    if (!result.ok) errors.push('smtp');
  } else {
    console.log('ℹ️  SMTP non configuré : les emails seront affichés dans le terminal (développement)');
  }

  if (errors.length) process.exit(1);
  console.log('\n✅ Configuration valide');
};

const rotateSecret = () => {
  if (!fs.existsSync(ENV_PATH)) {
    console.error('❌ Pas de fichier .env : lancez « npm run env:init »');
    process.exit(1);
  }
  const content = setValue(fs.readFileSync(ENV_PATH, 'utf8'), 'JWT_SECRET', randomSecret());
  fs.writeFileSync(ENV_PATH, content, { mode: 0o600 });
  console.log('✅ Nouveau JWT_SECRET généré. Redémarrez le serveur : toutes les sessions devront se reconnecter.');
};

const [command, ...args] = process.argv.slice(2);
if (command === 'init') init(args.includes('--force'));
else if (command === 'check') await check();
else if (command === 'secret') rotateSecret();
else {
  console.log('Usage : node scripts/env.js <init [--force] | check | secret>');
  process.exit(1);
}
