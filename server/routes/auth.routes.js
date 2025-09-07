import express from 'express';
import { register, login ,verifyEmail,sendVerificationCode,resetPassword} from '../controllers/auth.controller.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/verify', verifyEmail);
router.post('/send-verification-code', sendVerificationCode);
router.post('/reset-password', resetPassword);  

export default router;
