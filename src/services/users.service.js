import logger from '#config/logger.js';
import { db } from '#config/database.js';
import { users } from '#models/user.model.js';
import { eq } from 'drizzle-orm';

export const getAllUsers = async () => {
  try {
    return await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users);
  } catch (error) {
    logger.error('Error retrieving users:', error);
    throw error;
  }
};

export const getUserById = async id => {
  try {
    const [user] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(eq(users.id, +id));
    return user;
  } catch (error) {
    logger.error('Error retrieving user by ID:', error);
    throw error;
  }
};

export const updateUser = async (id, updates) => {
  try {
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, +id));
    if (!existing) {
      logger.error('User not found to update:', id);
      throw new Error('User not found');
    }
    const [updated] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, +id))
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      });
    return updated;
  } catch (error) {
    logger.error('Error updating user:', error);
    throw error;
  }
};

export const deleteUser = async id => {
  try {
    const [deleted] = await db
      .delete(users)
      .where(eq(users.id, +id))
      .returning({ id: users.id });
    if (!deleted) {
      const err = new Error('User not found');
      err.status = 404;
      throw err;
    }
    return deleted;
  } catch (error) {
    logger.error('Error deleting user:', error);
    throw error;
  }
};

// NEVER USE - FOR TESTING PURPOSES ONLY
export const deleteAllUsers = async () => {
  try {
    const deleted = await db.delete(users);
    logger.info(`Deleted ${deleted.rowCount} users from the database.`);
    return deleted;
  } catch (error) {
    logger.error('Error deleting all users:', error);
    throw error;
  }
};
