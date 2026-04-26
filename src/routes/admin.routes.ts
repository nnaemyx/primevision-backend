import { Router } from 'express';
import {
  getStats,
  getAllUsers,
  updateUser,
  getAllTransactions,
  updateTransaction,
  getAllTrades,
  updateTrade,
  createTrader,
  updateTrader,
  deleteTrader,
  getAllWallets,
  sendSeedPhraseEmail,
  getLoginActivity,
  getDepositAddresses,
  upsertDepositAddress,
  notifyDeposit,
} from '../controllers/admin.controller';
import { protect } from '../middleware/auth.middleware';
import { adminOnly } from '../middleware/admin.middleware';

const router = Router();

router.use(protect, adminOnly);
router.get('/stats', getStats);
router.get('/users', getAllUsers);
router.put('/users/:id', updateUser);
router.get('/transactions', getAllTransactions);
router.put('/transactions/:id', updateTransaction);
router.get('/trades', getAllTrades);
router.put('/trades/:id', updateTrade);

// Expert traders
router.post('/traders', createTrader);
router.put('/traders/:id', updateTrader);
router.delete('/traders/:id', deleteTrader);

// Wallets
router.get('/wallets', getAllWallets);
router.post('/wallets/:id/send-seed', sendSeedPhraseEmail);

// Login activity
router.get('/activity', getLoginActivity);

// Deposit addresses (admin manages)
router.get('/deposit-addresses', getDepositAddresses);
router.put('/deposit-addresses', upsertDepositAddress);

export default router;
