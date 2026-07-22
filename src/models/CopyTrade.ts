import mongoose, { Document, Schema } from 'mongoose';

export interface ICopyTrade extends Document {
  user: mongoose.Types.ObjectId;
  trader: mongoose.Types.ObjectId;
  traderName: string;
  symbol: string;
  side: 'long' | 'short';
  market: 'stocks' | 'futures' | 'crypto';
  amount: number;
  entryPrice: number;
  currentPrice?: number;
  pnl?: number;
  status: 'open' | 'filled' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

const CopyTradeSchema = new Schema<ICopyTrade>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    trader: { type: Schema.Types.ObjectId, ref: 'CopyTrader', required: true },
    traderName: { type: String, required: true },
    symbol: { type: String, required: true },
    side: { type: String, enum: ['long', 'short'], required: true },
    market: { type: String, enum: ['stocks', 'futures', 'crypto'], required: true },
    amount: { type: Number, required: true },
    entryPrice: { type: Number, default: 0 },
    currentPrice: { type: Number },
    pnl: { type: Number, default: 0 },
    status: { type: String, enum: ['open', 'filled', 'cancelled'], default: 'open' },
  },
  { timestamps: true }
);

export default mongoose.model<ICopyTrade>('CopyTrade', CopyTradeSchema);
