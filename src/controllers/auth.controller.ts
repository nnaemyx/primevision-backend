import { Request, Response } from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import LoginLog from '../models/LoginLog';
import { sendWelcomeEmail, sendOTPEmail, sendPasswordResetEmail } from '../services/email.service';

const generateToken = (id: string): string =>
  jwt.sign({ id }, process.env.JWT_SECRET as string, { expiresIn: '30d' });

const generateOTP = (): string =>
  Math.floor(100000 + Math.random() * 900000).toString();

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, country } = req.body;
    const existing = await User.findOne({ email });
    if (existing) {
      res.status(400).json({ message: 'Email already registered' });
      return;
    }
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    const user = await User.create({ name, email, password, country, otp, otpExpiry });
    await sendOTPEmail(name, email, otp);
    res.status(201).json({ message: 'OTP sent to email', userId: user._id });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: (err as Error).message });
  }
};

export const verifyOTP = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, otp } = req.body;
    const user = await User.findById(userId);
    if (!user || user.otp !== otp || !user.otpExpiry || user.otpExpiry < new Date()) {
      res.status(400).json({ message: 'Invalid or expired OTP' });
      return;
    }
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();
    await sendWelcomeEmail(user.name, user.email);
    const token = generateToken(user._id.toString());
    res.json({ token, user: { _id: user._id, name: user.name, email: user.email, role: user.role, balance: user.balance } });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: (err as Error).message });
  }
};

export const sendOTP = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    const otp = generateOTP();
    user.otp = otp;
    user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();
    await sendOTPEmail(user.name, email, otp);
    res.json({ message: 'OTP sent', userId: user._id });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: (err as Error).message });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }
    if (!user.isActive) {
      res.status(403).json({ message: 'Account suspended. Contact support.' });
      return;
    }
    if (!user.isVerified) {
      const otp = generateOTP();
      user.otp = otp;
      user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
      await user.save();
      await sendOTPEmail(user.name, user.email, otp);
      res.status(403).json({
        message: 'Email not verified. A new code has been sent to your email.',
        requiresVerification: true,
        userId: user._id,
      });
      return;
    }
    // Log login
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.socket.remoteAddress || '';
    const userAgent = req.headers['user-agent'] || '';
    await LoginLog.create({ user: user._id, ip, userAgent });

    const token = generateToken(user._id.toString());
    res.json({ token, user: { _id: user._id, name: user.name, email: user.email, role: user.role, balance: user.balance, isVerified: user.isVerified } });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: (err as Error).message });
  }
};

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      res.json({ message: 'If that email exists, a reset link was sent.' });
      return;
    }
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetToken = resetToken;
    user.resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();
    const resetUrl = `${process.env.FRONTEND_URL}/auth/reset-password?token=${resetToken}`;
    await sendPasswordResetEmail(user.name, email, resetUrl);
    res.json({ message: 'If that email exists, a reset link was sent.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: (err as Error).message });
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, password } = req.body;
    const user = await User.findOne({ resetToken: token, resetTokenExpiry: { $gt: new Date() } });
    if (!user) {
      res.status(400).json({ message: 'Invalid or expired reset token' });
      return;
    }
    user.password = password;
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();
    res.json({ message: 'Password reset successful' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: (err as Error).message });
  }
};
