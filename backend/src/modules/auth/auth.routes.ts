import { Router } from 'express';
import { AuthController, registerSchema, loginSchema } from './auth.controller';
import { validateRequest } from '../../middleware/validate';
import { requireAuth } from '../../middleware/auth';
import { authLimiter } from '../../middleware/rateLimiter';

const router = Router();

router.post('/register', authLimiter, validateRequest(registerSchema), AuthController.register);
router.post('/login', authLimiter, validateRequest(loginSchema), AuthController.login);
router.get('/me', requireAuth, AuthController.getMe);

export default router;
