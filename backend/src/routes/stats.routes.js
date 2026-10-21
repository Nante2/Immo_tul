import express from 'express';
import { dashboard, propertyStats } from '../controllers/stats.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Toutes les routes statistiques sont protégées
router.use(authenticate);

router.get('/dashboard', dashboard);
router.get('/property/:id', propertyStats);

export default router;
