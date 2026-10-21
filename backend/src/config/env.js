import 'dotenv/config';

// Valeurs d'exemple de .env.example qui ne doivent jamais servir en vrai
const PLACEHOLDER_SECRETS = ['votre_secret_jwt_tres_securise', 'changez_moi', 'change_me'];
const MIN_SECRET_LENGTH = 32;

/**
 * Vérifie les variables d'environnement.
 * Renvoie { errors, warnings } : les erreurs empêchent le serveur de fonctionner correctement,
 * les avertissements signalent une configuration risquée.
 */
export const checkEnv = (env = process.env) => {
  const errors = [];
  const warnings = [];
  const isProduction = env.NODE_ENV === 'production';

  if (!env.DATABASE_URL) {
    errors.push("DATABASE_URL est manquant (ex: postgresql://utilisateur:motdepasse@localhost:5432/immo_tul)");
  } else if (!/^postgres(ql)?:\/\//.test(env.DATABASE_URL)) {
    errors.push('DATABASE_URL doit commencer par postgresql://');
  }

  if (!env.JWT_SECRET) {
    errors.push('JWT_SECRET est manquant : lancez « npm run env:init » pour en générer un');
  } else if (PLACEHOLDER_SECRETS.includes(env.JWT_SECRET)) {
    (isProduction ? errors : warnings).push("JWT_SECRET utilise encore la valeur d'exemple : générez-en un nouveau");
  } else if (env.JWT_SECRET.length < MIN_SECRET_LENGTH) {
    (isProduction ? errors : warnings).push(`JWT_SECRET est trop court (${env.JWT_SECRET.length} caractères, ${MIN_SECRET_LENGTH} minimum)`);
  }

  if (env.PORT && !/^\d+$/.test(env.PORT)) {
    errors.push(`PORT doit être un nombre (reçu : « ${env.PORT} »)`);
  }

  if (!env.FRONTEND_URL) {
    warnings.push("FRONTEND_URL est absent : seul http://localhost:5173 pourra appeler l'API");
  } else if (isProduction && env.FRONTEND_URL.includes('localhost')) {
    warnings.push('FRONTEND_URL pointe vers localhost alors que NODE_ENV=production');
  }

  // Emails : configuration SMTP complète ou absente, jamais à moitié
  const smtpFields = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS'];
  const smtpSet = smtpFields.filter((k) => env[k]);
  if (smtpSet.length > 0 && smtpSet.length < smtpFields.length) {
    const missing = smtpFields.filter((k) => !env[k]).join(', ');
    warnings.push(`SMTP incomplet (manque : ${missing}) : les emails risquent de ne pas partir`);
  }
  if (!env.SMTP_HOST && isProduction) {
    warnings.push('SMTP non configuré : aucun email ne sera envoyé (notifications de messages)');
  }
  if (env.SMTP_HOST && !env.MAIL_TO) {
    warnings.push("MAIL_TO est vide : l'agence ne recevra pas les notifications de nouveaux messages");
  }

  if (env.ADMIN_PASSWORD && env.ADMIN_PASSWORD.length < 8) {
    warnings.push('ADMIN_PASSWORD fait moins de 8 caractères');
  }

  return { errors, warnings };
};

/**
 * Affiche le résultat de la vérification. En production, une erreur arrête le processus ;
 * en développement, on prévient sans bloquer.
 */
export const assertEnv = () => {
  const { errors, warnings } = checkEnv();
  warnings.forEach((w) => console.warn(`⚠️  Configuration : ${w}`));
  if (errors.length > 0) {
    errors.forEach((e) => console.error(`❌ Configuration : ${e}`));
    if (process.env.NODE_ENV === 'production') {
      console.error('Arrêt : corrigez le fichier .env (voir .env.example).');
      process.exit(1);
    }
  }
};
