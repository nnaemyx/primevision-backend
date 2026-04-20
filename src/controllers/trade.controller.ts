import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import Trade from '../models/Trade';
import User from '../models/User';

export const executeTrade = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { symbol, market, type, side, price, amount, quantity, stopLoss, takeProfit, leverage, lockingPeriod } = req.body;
    const user = await User.findById(req.user?._id);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    if (user.balance < amount) {
      res.status(400).json({ message: 'Insufficient balance' });
      return;
    }
    const trade = await Trade.create({
      user: user._id,
      symbol,
      market,
      type,
      side,
      price,
      amount,
      quantity,
      stopLoss,
      takeProfit,
      leverage,
      lockingPeriod,
      status: type === 'market' ? 'filled' : 'open',
      executionPrice: type === 'market' ? price : undefined,
    });
    user.balance -= amount;
    await user.save();
    res.status(201).json(trade);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: (err as Error).message });
  }
};

export const getOpenOrders = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const trades = await Trade.find({ user: req.user?._id, status: 'open' }).sort({ createdAt: -1 });
    res.json(trades);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: (err as Error).message });
  }
};

export const getFilledOrders = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const trades = await Trade.find({ user: req.user?._id, status: 'filled' }).sort({ createdAt: -1 });
    res.json(trades);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: (err as Error).message });
  }
};

export const getTradeHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { market } = req.query as { market?: string };
    const filter: Record<string, unknown> = { user: req.user?._id };
    if (market) filter.market = market;
    const trades = await Trade.find(filter).sort({ createdAt: -1 }).limit(50);
    res.json(trades);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: (err as Error).message });
  }
};

export const cancelOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const trade = await Trade.findOne({ _id: req.params.id, user: req.user?._id, status: 'open' });
    if (!trade) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }
    trade.status = 'cancelled';
    await trade.save();
    // Refund
    await User.findByIdAndUpdate(req.user?._id, { $inc: { balance: trade.amount } });
    res.json(trade);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: (err as Error).message });
  }
};
