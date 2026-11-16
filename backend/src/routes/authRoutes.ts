import { Router } from 'express';
import { register, login, verifyEmail } from '../controllers/authController.js';

const router = Router();
router.post('/register', register);
router.post('/verify-email', verifyEmail);
router.post('/login', login);

export default router;