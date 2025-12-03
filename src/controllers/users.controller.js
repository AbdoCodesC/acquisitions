import logger from '#config/logger.js';
import {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  deleteAllUsers,
} from '#services/users.service.js';
import {
  updateUserSchema,
  userIdSchema,
} from '#validations/users.validation.js';

export const fetchAllUsers = async (req, res, next) => {
  try {
    logger.info('Fetching all users');
    const allUsers = await getAllUsers();
    res.status(200).json({
      message: 'Users retrieved successfully',
      users: allUsers,
      count: allUsers.length,
    });
    next();
  } catch (error) {
    logger.error('Error in getUsers controller:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const fetchUserById = async (req, res, next) => {
  try {
    const parseResult = userIdSchema.safeParse({ params: req.params });
    if (!parseResult.success) {
      return res
        .status(400)
        .json({ message: 'Invalid ID', errors: parseResult.error.flatten() });
    }
    const id = parseResult.data.params.id;
    logger.info(`Fetching user by id: ${id}`);
    const user = await getUserById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({
      message: 'User retrieved successfully',
      user,
    });
    next();
  } catch (error) {
    logger.error('Error in fetchUserById controller:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const updateUserController = async (req, res, next) => {
  try {
    const parseResult = updateUserSchema.safeParse({
      params: req.params,
      body: req.body,
    });
    if (!parseResult.success) {
      return res.status(400).json({
        message: 'Invalid request',
        errors: parseResult.error.flatten(),
      });
    }
    const { id } = parseResult.data.params;
    const updates = { ...parseResult.data.body };

    // Only allow users to update their own account; admins can update anyone
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const isSelf = req.user.id === id;
    const isAdmin = req.user.role === 'admin';
    if (!isSelf && !isAdmin) {
      return res
        .status(403)
        .json({ message: 'Forbidden: cannot update other users' });
    }

    // Only admins can change role
    if (updates.role && !isAdmin) {
      return res
        .status(403)
        .json({ message: 'Forbidden: only admin can change role' });
    }

    logger.info(`Updating user id: ${id}`);
    const updated = await updateUser(id, updates);
    res
      .status(200)
      .json({ message: 'User updated successfully', user: updated });
    next();
  } catch (error) {
    const status = error.status || 500;
    logger.error('Error in updateUser controller:', error);
    res.status(status).json({
      message: status === 404 ? 'User not found' : 'Internal Server Error',
    });
  }
};

export const deleteUserController = async (req, res, next) => {
  try {
    const parseResult = userIdSchema.safeParse({ params: req.params });
    if (!parseResult.success) {
      return res
        .status(400)
        .json({ message: 'Invalid ID', errors: parseResult.error.flatten() });
    }
    const id = parseResult.data.params.id;

    // Only allow user to delete self or admin to delete anyone
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const isSelf = req.user.id === id;
    const isAdmin = req.user.role === 'admin';
    if (!isSelf && !isAdmin) {
      return res
        .status(403)
        .json({ message: 'Forbidden: cannot delete other users' });
    }

    logger.info(`Deleting user id: ${id}`);
    await deleteUser(id);
    res.status(200).json({ message: 'User deleted successfully' });
    next();
  } catch (error) {
    const status = error.status || 500;
    logger.error('Error in deleteUser controller:', error);
    res.status(status).json({
      message: status === 404 ? 'User not found' : 'Internal Server Error',
    });
  }
};

export const deleteAllUsersController = async (req, res, next) => {
  try {
    // Only allow admin to delete all users
    if (!req.user || req.user.role !== 'admin') {
      return res
        .status(403)
        .json({ message: 'Forbidden: only admin can delete all users' });
    }

    logger.info('Deleting all users');
    await deleteAllUsers();
    res.status(200).json({ message: 'All users deleted successfully' });
    next();
  } catch (error) {
    logger.error('Error in deleteAllUsers controller:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
