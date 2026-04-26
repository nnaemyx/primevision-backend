import mongoose, { Document, Schema } from 'mongoose';

export interface IDepositAddress extends Document {
  symbol: string;  // e.g. 'BTC', 'ETH', 'USDT', 'SOL'
  name: string;    // e.g. 'Bitcoin'
  address: string;
  color: string;
  updatedBy?: mongoose.Types.ObjectId;
  updatedAt: Date;
}

const DepositAddressSchema = new Schema<IDepositAddress>(
  {
    symbol: { type: String, required: true, unique: true, uppercase: true },
    name: { type: String, required: true },
    address: { type: String, required: true },
    color: { type: String, default: '#e9d758' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export default mongoose.model<IDepositAddress>('DepositAddress', DepositAddressSchema);
