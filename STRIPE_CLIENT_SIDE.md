# Client-Side Stripe Integration

This app uses Stripe's prebuilt checkout form directly without a backend. Here's how it works:

## Configuration

### Environment Variables (.env)
```
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key
VITE_STRIPE_MONTHLY_PRICE_ID=price_your_monthly_price_id  
VITE_STRIPE_YEARLY_PRICE_ID=price_your_yearly_price_id
```

### Required Stripe Setup

1. **Price IDs**: Get these from your Stripe Dashboard → Products
2. **Publishable Key**: Get from Stripe Dashboard → Developers → API Keys

## Payment Flow

1. **Initiate Payment**: User clicks "Subscribe" in onboarding
2. **Client-Side Redirect**: App calls `stripe.redirectToCheckout()` 
3. **Stripe Checkout**: User completes payment on Stripe's hosted page
4. **Return**: User returns to success/cancel URLs
5. **Update Subscription**: App updates Firebase user profile

## Key Files

### `src/services/stripeService.ts`
- `createCheckoutSession()`: Uses `stripe.redirectToCheckout()`
- `getSubscriptionStatus()`: Reads from Firebase user profile
- No backend API calls

### `src/components/PaymentStep.tsx`
- Handles payment initiation during onboarding
- Redirects to Stripe checkout
- Error handling for failed payments

### `src/pages/PaymentSuccess.tsx`
- Updates user subscription status in Firebase
- Redirects to main app
- URL: `/payment-success?session_id=...`

### `src/pages/PaymentCanceled.tsx`
- Handles canceled payments
- Option to try again or continue free
- URL: `/payment-canceled`

## Testing

### Test Cards (Use Stripe's test mode)
```
4242 4242 4242 4242 - Visa (succeeds)
4000 0000 0000 0002 - Visa (decline)
4000 0025 0000 3155 - Visa (requires authentication)
```

### Test Flow
1. Start onboarding
2. Select a subscription plan
3. Use test card number
4. Complete checkout
5. Verify redirect to success page
6. Check Firebase user profile updated

## Subscription Management

Since there's no backend:
- Subscription status is stored in Firebase user profile
- Customer portal requires backend (currently shows support message)
- Cancellations must be handled through Stripe Dashboard or customer support

## Important Notes

⚠️ **Production Considerations**:
- Use live Stripe keys in production
- Set up Stripe webhooks if you add a backend later
- Customer portal requires backend for full functionality
- Consider adding webhook handling for subscription updates

✅ **What Works Without Backend**:
- Payment processing
- Subscription activation
- Status tracking in Firebase
- Basic subscription management

❌ **What Requires Backend**:
- Customer portal sessions
- Webhook processing
- Advanced subscription management
- Automated renewals/cancellations

## Deployment

1. Set environment variables in Netlify/Vercel
2. Update Stripe checkout success/cancel URLs to production domain
3. Test with live cards in production
4. Monitor Stripe Dashboard for payments
