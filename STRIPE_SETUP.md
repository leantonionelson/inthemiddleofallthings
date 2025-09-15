# Stripe Payment Integration Setup

This document explains how to set up Stripe payments for the premium subscription features.

## 🎯 Overview

The app now includes:
- ✅ **Stripe Payment Integration** - Secure payment processing
- ✅ **Subscription Management** - Monthly premium plans
- ✅ **Feature Restrictions** - AI and save features require paid subscription
- ✅ **Payment Onboarding** - Payment step in signup flow
- ✅ **Upgrade Prompts** - Contextual upgrade prompts for restricted features

## 🔧 Setup Instructions

### 1. Stripe Account Setup

1. **Create Stripe Account**
   - Go to [stripe.com](https://stripe.com) and create an account
   - Complete account verification and enable live mode when ready

2. **Create Product and Price**
   - In Stripe Dashboard, go to Products
   - Create a new product: "Premium Plan"
   - Add a recurring price: $9.99/month
   - Copy the Price ID (starts with `price_`)

### 2. Environment Variables

Add these environment variables to your `.env` file:

```bash
# Stripe Configuration
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
VITE_STRIPE_PRICE_ID=price_your_price_id_here

# For production, use live keys:
# VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your_live_publishable_key_here
# VITE_STRIPE_PRICE_ID=price_your_live_price_id_here
```

### 3. Backend API Setup (Required)

The frontend expects these API endpoints to be implemented:

#### Create Checkout Session
```
POST /api/create-checkout-session
Authorization: Bearer <firebase_token>
Content-Type: application/json

{
  "userId": "firebase_user_id",
  "email": "user@example.com",
  "priceId": "price_1234567890",
  "successUrl": "https://yourapp.com/payment-success",
  "cancelUrl": "https://yourapp.com/payment-canceled"
}

Response:
{
  "sessionId": "cs_test_1234567890"
}
```

#### Get Subscription Status
```
GET /api/subscription-status
Authorization: Bearer <firebase_token>

Response:
{
  "status": "active",
  "currentPeriodEnd": "2024-02-01T00:00:00Z",
  "cancelAtPeriodEnd": false,
  "planName": "Premium Plan"
}
```

#### Cancel Subscription
```
POST /api/cancel-subscription
Authorization: Bearer <firebase_token>
Content-Type: application/json

{
  "userId": "firebase_user_id"
}

Response:
{
  "success": true
}
```

#### Create Customer Portal Session
```
POST /api/create-customer-portal-session
Authorization: Bearer <firebase_token>
Content-Type: application/json

{
  "userId": "firebase_user_id",
  "returnUrl": "https://yourapp.com"
}

Response:
{
  "url": "https://billing.stripe.com/session_1234567890"
}
```

## 📱 User Experience

### Onboarding Flow
1. User completes personality questions
2. User selects voice preference
3. **Payment step** - Choose premium plan or skip
4. Symbol generation and completion

### Feature Restrictions
- **Free Users**: Can read content and use basic audio
- **Premium Users**: Full access to AI, highlights, progress sync

### Upgrade Prompts
When free users try to access premium features:
- Save highlights → Upgrade prompt
- Ask AI → Upgrade prompt
- Access saved content → Upgrade prompt

## 🔒 Security Features

- **Firebase Authentication** - User identity verification
- **Stripe Webhooks** - Secure payment event handling
- **Token-based API** - Firebase ID tokens for API authentication
- **Client-side Validation** - Immediate feedback for restricted features

## 💰 Pricing Structure

### Premium Plan - $9.99/month
- ✅ Unlimited AI conversations
- ✅ Save highlights and progress
- ✅ Cross-device synchronization
- ✅ Premium audio features
- ✅ Advanced reading analytics
- ✅ 7-day free trial
- ✅ Cancel anytime

## 🛠️ Development Notes

### Mock Mode
For development without a backend, the Stripe service includes mock responses:
- Mock payment intents
- Mock subscription status
- Mock checkout sessions

### Testing
Use Stripe test cards for development:
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- 3D Secure: `4000 0025 0000 3155`

## 📊 Analytics & Monitoring

Track these key metrics:
- Conversion rate from free to paid
- Feature usage by subscription status
- Payment success/failure rates
- Churn rate and retention

## 🚀 Deployment Checklist

- [ ] Stripe account created and verified
- [ ] Environment variables configured
- [ ] Backend API endpoints implemented
- [ ] Webhook endpoints configured
- [ ] Test payments working
- [ ] Production keys configured
- [ ] Analytics tracking enabled

## 🔄 Webhook Events

Configure these webhook events in Stripe:
- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

## 📞 Support

For Stripe-related issues:
- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Support](https://support.stripe.com)
- [Firebase + Stripe Integration Guide](https://firebase.google.com/docs/functions/stripe)

## 🎉 Benefits

- **Secure Payments** - Industry-standard security
- **Global Support** - Accept payments worldwide
- **Mobile Optimized** - Works on all devices
- **Subscription Management** - Easy billing and cancellations
- **Analytics** - Detailed payment and usage insights
