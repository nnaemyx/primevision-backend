import { Router } from 'express';
import { getBalance, getGrowthHistory, getTransactionHistory, allocatePortfolio } from '../controllers/portfolio.controller';
import { notifyDeposit, getDepositAddresses } from '../controllers/admin.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

router.use(protect);
router.get('/balance', getBalance);
router.get('/history', getGrowthHistory);
router.get('/transactions', getTransactionHistory);
router.post('/allocation', allocatePortfolio);

// Deposit helpers (authenticated users)
router.get('/deposit-addresses', getDepositAddresses);  // public to authenticated users (read-only)
router.post('/deposit-notify', notifyDeposit);          // user clicks "Sent"

export default router;
