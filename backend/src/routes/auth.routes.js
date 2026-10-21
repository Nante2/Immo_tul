import express from 'express';
import { register, login, getMe, updateMe, listUsers, deleteUser } from '../controllers/auth.controller.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { validateRegister, validateLogin } from '../middleware/validate.js';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Limite les tentatives de connexion (protection contre le brute force)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 tentatives par fenêtre par IP
  skipSuccessfulRequests: true,
  message: { error: 'Trop de tentatives de connexion, veuillez réessayer dans 15 minutes.' }
});

// Le premier admin est créé avec createAdmin.js ; ensuite seuls les admins créent des comptes
router.post('/register', authenticate, requireAdmin, validateRegister, register);
router.post('/login', loginLimiter, validateLogin, login);
router.get('/me', authenticate, getMe);
router.put('/me', authenticate, updateMe);
router.get('/users', authenticate, requireAdmin, listUsers);
router.delete('/users/:id', authenticate, requireAdmin, deleteUser);

export default router;
