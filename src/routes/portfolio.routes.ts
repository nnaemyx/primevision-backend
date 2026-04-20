import { Router } from 'express';
import { getBalance, getGrowthHistory, getTransactionHistory } from '../controllers/portfolio.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

router.use(protect);
router.get('/balance', getBalance);
router.get('/history', getGrowthHistory);
router.get('/transactions', getTransactionHistory);

export default router;
