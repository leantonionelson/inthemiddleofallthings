# Backend API Deployment Guide

This guide will help you deploy the backend API for production Stripe integration.

## 🚀 Quick Deployment with Vercel (Recommended)

### 1. Install Vercel CLI
```bash
npm install -g vercel
```

### 2. Deploy Backend
```bash
cd backend
vercel
```

### 3. Set Environment Variables in Vercel
Go to your Vercel dashboard → Project → Settings → Environment Variables and add:

```
STRIPE_SECRET_KEY=sk_live_your_live_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
STRIPE_PUBLISHABLE_KEY=pk_live_your_live_publishable_key
STRIPE_MONTHLY_PRICE_ID=price_your_monthly_price_id
STRIPE_YEARLY_PRICE_ID=price_your_yearly_price_id
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_PRIVATE_KEY_ID=your_private_key_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour_private_key\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your_client_email
FIREBASE_CLIENT_ID=your_client_id
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
FRONTEND_URL=https://your-frontend-domain.com
PRODUCTION_URL=https://your-frontend-domain.com
```

## 🔧 Stripe Setup

### 1. Create Products and Prices in Stripe Dashboard
1. Go to Stripe Dashboard → Products
2. Create a new product called "Premium Plan"
3. Add two prices:
   - Monthly: £7.99/month
   - Yearly: £59.99/year
4. Copy the Price IDs (start with `price_`)

### 2. Set Up Webhooks
1. Go to Stripe Dashboard → Webhooks
2. Add endpoint: `https://your-backend-url.vercel.app/api/webhooks/stripe`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy the webhook secret

## 🔥 Firebase Setup

### 1. Generate Service Account Key
1. Go to Firebase Console → Project Settings → Service Accounts
2. Click "Generate new private key"
3. Download the JSON file
4. Extract the values for environment variables

### 2. Update Firestore Rules
Add this to your `firestore.rules`:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## 🌐 Frontend Configuration

### 1. Update Environment Variables
Add to your frontend `.env`:
```
VITE_BACKEND_URL=https://your-backend-url.vercel.app
VITE_STRIPE_MONTHLY_PRICE_ID=price_your_monthly_price_id
VITE_STRIPE_YEARLY_PRICE_ID=price_your_yearly_price_id
```

### 2. Update Netlify Environment Variables
Add the same variables to your Netlify build environment variables.

## 🧪 Testing

### 1. Test Backend Health
```bash
curl https://your-backend-url.vercel.app/health
```

### 2. Test Stripe Integration
1. Use Stripe test cards: `4242 4242 4242 4242`
2. Check webhook delivery in Stripe Dashboard
3. Verify subscription status in your app

## 🔒 Security Checklist

- [ ] Use live Stripe keys in production
- [ ] Set up proper CORS origins
- [ ] Enable rate limiting
- [ ] Use HTTPS for all endpoints
- [ ] Validate webhook signatures
- [ ] Secure Firebase service account key

## 📊 Monitoring

### 1. Vercel Analytics
Monitor API usage and performance in Vercel dashboard.

### 2. Stripe Dashboard
Monitor payments, subscriptions, and webhook delivery.

### 3. Firebase Console
Monitor user authentication and Firestore usage.

## 🚨 Troubleshooting

### Common Issues

1. **Webhook not receiving events**
   - Check webhook URL is correct
   - Verify webhook secret matches
   - Check Vercel function logs

2. **Authentication errors**
   - Verify Firebase service account key
   - Check Firebase project ID matches
   - Ensure user is authenticated

3. **CORS errors**
   - Update CORS origins in backend
   - Check frontend URL is correct

### Debug Commands

```bash
# Check Vercel function logs
vercel logs

# Test webhook locally
stripe listen --forward-to localhost:3001/api/webhooks/stripe
```

## 📈 Production Checklist

- [ ] Deploy backend to Vercel
- [ ] Set all environment variables
- [ ] Configure Stripe webhooks
- [ ] Update frontend with backend URL
- [ ] Test payment flow end-to-end
- [ ] Set up monitoring and alerts
- [ ] Configure backup and recovery
- [ ] Update documentation

## 🎉 You're Ready!

Once deployed, your app will have:
- ✅ Real Stripe payment processing
- ✅ Secure subscription management
- ✅ Webhook-based status updates
- ✅ Customer portal integration
- ✅ Production-ready security

Your users can now make real payments and manage their subscriptions! 🚀
