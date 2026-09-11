import dotenv from 'dotenv';
dotenv.config();

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  jwtSecret: process.env.JWT_SECRET || 'beautybid_default_jwt_secret_dev',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_beautybid12345',
    keySecret: process.env.RAZORPAY_KEY_SECRET || 'beautybid_secret_key_testing_98765',
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || 'beautybid_webhook_secret_998877',
  },
  defaultMinRankIncrement: parseFloat(process.env.DEFAULT_MIN_RANK_INCREMENT || '500'),
  currency: process.env.CURRENCY || 'INR',
};
