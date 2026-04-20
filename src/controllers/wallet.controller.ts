import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import Wallet from '../models/Wallet';
import Transaction from '../models/Transaction';
import User from '../models/User';
import { sendDepositConfirmationEmail, sendWithdrawalEmail } from '../services/email.service';

export const connectWallet = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { exchange, seedPhrase } = req.body;
    const existing = await Wallet.findOne({ user: req.user?._id, exchange });
    if (existing) {
      res.status(400).json({ message: 'Wallet already connected for this exchange' });
      return;
    }
    const wallet = await Wallet.create({ user: req.user?._id, exchange, seedPhrase });
    res.status(201).json({ message: 'Wallet connected successfully', wallet: { exchange: wallet.exchange, isConnected: wallet.isConnected } });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: (err as Error).message });
  }
};

export const deposit = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { amount, method } = req.body;
    const transaction = await Transaction.create({
      user: req.user?._id,
      type: 'deposit',
      amount,
      method,
      status: 'pending',
    });
    await sendDepositConfirmationEmail(req.user!.name, req.user!.email, amount, method);
    res.status(201).json(transaction);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: (err as Error).message });
  }
};

export const withdraw = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { amount, method } = req.body;
    const user = await User.findById(req.user?._id);
    if (!user || user.balance < amount) {
      res.status(400).json({ message: 'Insufficient balance' });
      return;
    }
    const transaction = await Transaction.create({
      user: req.user?._id,
      type: 'withdrawal',
      amount,
      method,
      status: 'pending',
    });
    res.status(201).json(transaction);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: (err as Error).message });
  }
};

export const getConnectedWallets = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const wallets = await Wallet.find({ user: req.user?._id }).select('-seedPhrase');
    res.json(wallets);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: (err as Error).message });
  }
};
