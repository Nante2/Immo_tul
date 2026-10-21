import express from 'express';
import { create, getAll, getById, updateStatus, remove } from '../controllers/contact.controller.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { validateContact } from '../middleware/validate.js';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Rate limiting pour la création de contacts (prévention spam)
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests par fenêtre par IP
  message: { error: 'Trop de requêtes, veuillez réessayer plus tard.' }
});

// Route publique
router.post('/', contactLimiter, validateContact, create);

// Routes protégées
router.get('/', authenticate, getAll);
router.get('/:id', authenticate, getById);
router.put('/:id/status', authenticate, updateStatus);
router.delete('/:id', authenticate, requireAdmin, remove);

export default router;
