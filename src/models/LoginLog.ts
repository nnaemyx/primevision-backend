import mongoose, { Document, Schema } from 'mongoose';

export interface ILoginLog extends Document {
  user: mongoose.Types.ObjectId;
  ip: string;
  userAgent: string;
  createdAt: Date;
}

const LoginLogSchema = new Schema<ILoginLog>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    ip: { type: String, default: '' },
    userAgent: { type: String, default: '' },
  },
  { timestamps: true }
);

export default mongoose.model<ILoginLog>('LoginLog', LoginLogSchema);
