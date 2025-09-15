# 🚀 Production Setup Guide

## Backend Deployment

### 1. Deploy Backend to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy backend
cd backend
vercel

# Follow prompts:
# - Link to existing project? No
# - Project name: middle-app-backend
# - Directory: ./
# - Override settings? No
```

### 2. Set Backend Environment Variables in Vercel

Go to Vercel Dashboard → Your Project → Settings → Environment Variables:

```
STRIPE_SECRET_KEY=sk_live_your_live_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
STRIPE_PUBLISHABLE_KEY=pk_live_your_live_publishable_key
STRIPE_MONTHLY_PRICE_ID=price_1S7aamJz7MVRzFNxBPwjpKdF
STRIPE_YEARLY_PRICE_ID=price_1S7aclJz7MVRzFNxwG80mrp6
FIREBASE_PROJECT_ID=datallm-918aa
FIREBASE_PRIVATE_KEY_ID=your_private_key_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour_private_key\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your_client_email
FIREBASE_CLIENT_ID=your_client_id
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
FRONTEND_URL=https://your-frontend-domain.netlify.app
PRODUCTION_URL=https://your-frontend-domain.netlify.app
```

### 3. Configure Stripe Webhooks

1. **Go to Stripe Dashboard** → Webhooks
2. **Add endpoint**: `https://your-backend-url.vercel.app/api/webhooks/stripe`
3. **Select events**:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. **Copy webhook secret** to Vercel environment variables

## Frontend Deployment

### 1. Update Netlify Environment Variables

Go to Netlify Dashboard → Your Site → Site Settings → Environment Variables:

```
VITE_BACKEND_URL=https://your-backend-url.vercel.app
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your_live_publishable_key
VITE_STRIPE_MONTHLY_PRICE_ID=price_1S7aamJz7MVRzFNxBPwjpKdF
VITE_STRIPE_YEARLY_PRICE_ID=price_1S7aclJz7MVRzFNxwG80mrp6
```

### 2. Redeploy Frontend

```bash
# Trigger a new deployment
git commit --allow-empty -m "trigger deployment"
git push origin main
```

## Testing Production

### 1. Test Backend Health
```bash
curl https://your-backend-url.vercel.app/health
```

### 2. Test Payment Flow
1. Go to your production site
2. Complete onboarding
3. Try the payment flow
4. Check Stripe Dashboard for test payments

### 3. Monitor Logs
- **Vercel**: Dashboard → Functions → View logs
- **Stripe**: Dashboard → Webhooks → View delivery logs
- **Netlify**: Dashboard → Functions → View logs

## Environment Variables Summary

### Backend (Vercel)
- Stripe keys (live)
- Firebase service account
- Webhook secrets
- CORS origins

### Frontend (Netlify)
- Backend URL
- Stripe publishable key
- Price IDs

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Check `FRONTEND_URL` in backend environment variables
   - Ensure it matches your Netlify domain

2. **Webhook Failures**
   - Verify webhook URL is correct
   - Check webhook secret matches
   - View webhook delivery logs in Stripe

3. **Authentication Errors**
   - Verify Firebase service account key
   - Check Firebase project ID matches

### Debug Commands

```bash
# Check backend health
curl https://your-backend-url.vercel.app/health

# Test webhook locally
stripe listen --forward-to https://your-backend-url.vercel.app/api/webhooks/stripe

# View Vercel logs
vercel logs
```

## Security Checklist

- [ ] Use live Stripe keys in production
- [ ] Set up proper CORS origins
- [ ] Configure webhook secrets
- [ ] Use HTTPS for all endpoints
- [ ] Secure Firebase service account key
- [ ] Enable rate limiting
- [ ] Monitor error logs

## 🎉 You're Live!

Once deployed, your app will have:
- ✅ Real Stripe payments
- ✅ Secure backend API
- ✅ Webhook processing
- ✅ Production-ready security
