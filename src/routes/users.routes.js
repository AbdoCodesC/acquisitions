import express from 'express';
import {
  fetchAllUsers,
  fetchUserById,
  updateUserController,
  deleteUserController,
  deleteAllUsersController,
} from '#controllers/users.controller.js';
import { authenticateToken, requireRole } from '#middleware/auth.middleware.js';

const router = express.Router();

router.get('/', authenticateToken, requireRole(['admin']), fetchAllUsers);
router.get('/:id', authenticateToken, fetchUserById);
router.put(
  '/:id',
  authenticateToken,
  requireRole(['admin', 'user']),
  updateUserController
);
router.delete(
  '/:id',
  authenticateToken,
  requireRole(['admin']),
  deleteUserController
);

// Admin only route to delete all users
router.delete(
  '/',
  authenticateToken,
  requireRole(['admin']),
  deleteAllUsersController
);
export default router;
