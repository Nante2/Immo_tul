import express from 'express';
import { getAll, getStats, getById, getSimilar, create, update, updateStatus, remove } from '../controllers/property.controller.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { validateProperty } from '../middleware/validate.js';

const router = express.Router();

// Public routes
router.get('/', getAll);
router.get('/stats', getStats);
router.get('/:id/similar', getSimilar);
router.get('/:id', getById);

// Protected routes (Admin/Agent)
router.post('/', authenticate, validateProperty, create);
router.put('/:id', authenticate, validateProperty, update);
router.patch('/:id/status', authenticate, updateStatus);
router.delete('/:id', authenticate, requireAdmin, remove);

export default router;
