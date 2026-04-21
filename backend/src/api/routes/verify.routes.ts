import { Router } from 'express';
import { VerificationController } from '../controllers/VerificationController';

const router = Router();

router.post('/send', VerificationController.send);
router.post('/check', VerificationController.check);

export { router as verifyRoutes };
