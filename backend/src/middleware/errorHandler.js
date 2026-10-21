// Gestionnaire global d'erreurs
export const errorHandler = (err, req, res, next) => {
  console.error('❌ Erreur:', err.message);

  // Erreurs PostgreSQL
  // 23505 = unique_violation (remplace Prisma P2002)
  if (err.code === '23505') {
    return res.status(409).json({ error: 'Cette valeur existe déjà', field: err.constraint });
  }
  // 23503 = foreign_key_violation
  if (err.code === '23503') {
    return res.status(400).json({ error: 'Référence invalide: l\'enregistrement lié n\'existe pas' });
  }
  // 23502 = not_null_violation (remplace Prisma P2025 en partie)
  if (err.code === '23502') {
    return res.status(400).json({ error: `Le champ '${err.column}' est requis` });
  }
  // 22P02 = invalid_text_representation (ex: UUID/integer invalide)
  if (err.code === '22P02') {
    return res.status(400).json({ error: 'Format de données invalide' });
  }

  // Erreurs de validation
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'JSON invalide dans le corps de la requête' });
  }

  // Erreur Multer
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'Fichier trop volumineux (max 5 Mo)' });
  }
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({ error: 'Trop de fichiers envoyés (max 5)' });
  }

  // Erreur par défaut
  const status = err.status || 500;
  res.status(status).json({
    error: status === 500 ? 'Erreur interne du serveur' : err.message,
  });
};
