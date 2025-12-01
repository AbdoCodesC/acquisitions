import { signUpSchema, signInSchema } from '#validations/auth.validation.js';
import { formatValidationErrors } from '#utils/format.js';
import logger from '#config/logger.js';
import { createUser, authenticateUser } from '#services/auth.service.js';
import { jwttoken } from '#utils/jwt.js';
import { cookies } from '#utils/cookies.js';

export const signup = async (req, res, next) => {
  try {
    const validationResult = signUpSchema.safeParse(req.body);
    if (!validationResult.success)
      return res.status(400).json({
        error: 'Invalid input data.',
        details: formatValidationErrors(validationResult.error),
      });
    // Proceed with signup logic (e.g., save user to database)
    const { name, email, password, role } = validationResult.data;
    // auth service to create user
    const user = await createUser(name, email, password, role);
    const token = jwttoken.sign({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    cookies.set(res, 'token', token);

    logger.info(`User signed up with email: ${email}`);
    res.status(201).json({
      message: 'User signed up successfully.',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    logger.error('Error in signup controller: ' + error.message);
    if (error.message === 'User with this email already exists.') {
      return res.status(409).json({ message: 'Email already exists.' });
    }
    next(error);
  }
};

export const signin = async (req, res, next) => {
  try {
    const validationResult = signInSchema.safeParse(req.body);
    if (!validationResult.success)
      return res.status(400).json({
        error: 'Invalid input data.',
        details: formatValidationErrors(validationResult.error),
      });

    const { email, password } = validationResult.data;

    // authenticate user
    const user = await authenticateUser(email, password);

    const token = jwttoken.sign({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    cookies.set(res, 'token', token);

    logger.info(`User signed in with email: ${email}`);
    res.status(200).json({
      message: 'User signed in successfully.',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    logger.error('Error in signin controller: ' + error.message);
    if (error.message === 'Invalid email or password.') {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }
    next(error);
  }
};

export const signout = async (req, res, next) => {
  try {
    cookies.clear(res, 'token');

    logger.info('User signed out successfully');
    res.status(200).json({
      message: 'User signed out successfully.',
    });
  } catch (error) {
    logger.error('Error in signout controller: ' + error.message);
    next(error);
  }
};
