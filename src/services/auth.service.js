import logger from '#config/logger.js';
import bcrypt from 'bcryptjs';
import { db } from '#config/database.js';
import { eq } from 'drizzle-orm';
import { users } from '#models/user.model.js';

export const hashPassword = async password => {
  try {
    return await bcrypt.hash(password, 10); // 10 salt rounds
  } catch (error) {
    logger.error('Error hashing password: ' + error.message);
    throw new Error('Error hashing password: ' + error.message);
  }
};

export const createUser = async (name, email, password, role) => {
  try {
    // check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
      
    if (existingUser.length > 0)
      throw new Error('User with this email already exists.');

    // hash password
    const hashedPassword = await hashPassword(password);

    // saving user to database
    const [newUser] = await db
      .insert(users)
      .values({ name, email, password: hashedPassword, role })
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
      });

    logger.info(`Created new user with email: ${email}`);
    return newUser;
  } catch (error) {
    logger.error('Error creating user: ' + error.message);
    throw new Error('Error creating user: ' + error.message);
  }
};

export const comparePassword = async (password, hashedPassword) => {
  try {
    return await bcrypt.compare(password, hashedPassword);
  } catch (error) {
    logger.error('Error comparing password: ' + error.message);
    throw new Error('Error comparing password: ' + error.message);
  }
};

export const authenticateUser = async (email, password) => {
  try {
    // check if user exists and get password for validation
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user)
      throw new Error('Invalid email or password.');

    // validate password
    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid)
      throw new Error('Invalid email or password.');

    // return user without password
    logger.info(`User authenticated with email: ${email}`);
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  } catch (error) {
    logger.error('Error authenticating user: ' + error.message);
    throw new Error(error.message);
  }
};
