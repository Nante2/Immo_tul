import { body, validationResult } from 'express-validator';

// Middleware pour traiter les résultats de validation
export const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Règles de validation pour la création de propriété
export const validateProperty = [
  body('titre').notEmpty().withMessage('Le titre est requis'),
  body('description').notEmpty().withMessage('La description est requise'),
  body('prix').notEmpty().withMessage('Le prix est requis'),
  body('priceNumeric').isFloat({ min: 0 }).withMessage('Le prix numérique doit être positif'),
  body('type').isIn(['Maison', 'Villa', 'Terrain', 'Appartement']).withMessage('Type de bien invalide'),
  body('location').notEmpty().withMessage('La localisation est requise'),
  body('area').notEmpty().withMessage('La surface est requise'),
  body('actionType').isIn(['sale', 'rent']).withMessage('Type d\'action invalide (sale ou rent)'),
  handleValidation,
];

// Règles de validation pour un contact
export const validateContact = [
  body('name').notEmpty().withMessage('Le nom est requis'),
  body('email').isEmail().withMessage('Email invalide'),
  body('subject').notEmpty().withMessage('Le sujet est requis'),
  body('message').notEmpty().withMessage('Le message est requis'),
  handleValidation,
];

// Règles de validation pour le login
export const validateLogin = [
  body('email').isEmail().withMessage('Email invalide'),
  body('password').notEmpty().withMessage('Le mot de passe est requis'),
  handleValidation,
];

// Règles de validation pour l'inscription
export const validateRegister = [
  body('name').notEmpty().withMessage('Le nom est requis'),
  body('email').isEmail().withMessage('Email invalide'),
  body('password').isLength({ min: 6 }).withMessage('Le mot de passe doit faire au moins 6 caractères'),
  handleValidation,
];
