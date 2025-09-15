# Middle App Backend API

A Node.js/Express backend API for handling Stripe payments and subscription management for the Middle App.

## Features

- 🔐 Firebase Authentication integration
- 💳 Stripe payment processing
- 📊 Subscription management
- 🔔 Webhook handling
- 🛡️ Security middleware (Helmet, CORS, Rate limiting)
- 📝 Request logging
- ✅ Input validation with Joi

## Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

### Required Variables

- `STRIPE_SECRET_KEY` - Your Stripe secret key
- `STRIPE_WEBHOOK_SECRET` - Your Stripe webhook secret
- `FIREBASE_PROJECT_ID` - Your Firebase project ID
- `FIREBASE_PRIVATE_KEY` - Your Firebase private key
- `FIREBASE_CLIENT_EMAIL` - Your Firebase client email

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

## Production

```bash
npm start
```

## API Endpoints

### Authentication
All endpoints require a valid Firebase ID token in the Authorization header:
```
Authorization: Bearer <firebase_id_token>
```

### Stripe Endpoints

#### Create Checkout Session
```
POST /api/stripe/create-checkout-session
```

Body:
```json
{
  "priceId": "price_1234567890",
  "successUrl": "https://yourapp.com/success",
  "cancelUrl": "https://yourapp.com/cancel"
}
```

#### Get Subscription Status
```
GET /api/stripe/subscription-status
```

#### Create Customer Portal Session
```
POST /api/stripe/create-customer-portal-session
```

Body:
```json
{
  "returnUrl": "https://yourapp.com/settings"
}
```

#### Cancel Subscription
```
POST /api/stripe/cancel-subscription
```

### Webhooks

#### Stripe Webhooks
```
POST /api/webhooks/stripe
```

## Deployment

### Vercel (Recommended)

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy:
```bash
vercel
```

3. Set environment variables in Vercel dashboard

### Other Platforms

The app can be deployed to any Node.js hosting platform:
- Heroku
- Railway
- DigitalOcean App Platform
- AWS Lambda (with serverless-express)

## Stripe Webhook Setup

1. Go to your Stripe Dashboard → Webhooks
2. Add endpoint: `https://your-backend-url.com/api/webhooks/stripe`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy the webhook secret to your environment variables

## Firebase Setup

1. Go to Firebase Console → Project Settings → Service Accounts
2. Generate a new private key
3. Use the values in your environment variables

## Security

- All endpoints are rate limited
- CORS is configured for your frontend domains
- Helmet provides security headers
- Input validation with Joi
- Firebase authentication required for all endpoints

## Error Handling

The API returns consistent error responses:

```json
{
  "error": "Error message"
}
```

Status codes:
- 200: Success
- 400: Bad Request (validation errors)
- 401: Unauthorized (authentication required)
- 404: Not Found
- 500: Internal Server Error
