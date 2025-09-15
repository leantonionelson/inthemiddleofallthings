/**
 * Stripe Payment Service
 * 
 * Handles Stripe payment integration for subscription management
 */

import { loadStripe, Stripe, StripeElements } from '@stripe/stripe-js';
import { authService } from './firebaseAuth';

// Stripe configuration
const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
const STRIPE_PRICE_ID = import.meta.env.VITE_STRIPE_PRICE_ID || 'price_1234567890'; // Replace with your actual price ID

export interface SubscriptionStatus {
  isActive: boolean;
  status: 'active' | 'canceled' | 'past_due' | 'unpaid' | 'trialing' | 'incomplete';
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  planName: string;
}

export interface PaymentIntent {
  clientSecret: string;
  amount: number;
  currency: string;
}

class StripeService {
  private stripe: Stripe | null = null;
  private elements: StripeElements | null = null;

  constructor() {
    this.initializeStripe();
  }

  /**
   * Initialize Stripe
   */
  private async initializeStripe(): Promise<void> {
    if (!STRIPE_PUBLISHABLE_KEY) {
      console.warn('Stripe publishable key not configured');
      return;
    }

    try {
      this.stripe = await loadStripe(STRIPE_PUBLISHABLE_KEY);
      if (!this.stripe) {
        throw new Error('Failed to load Stripe');
      }
      console.log('✅ Stripe initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Stripe:', error);
    }
  }

  /**
   * Get Stripe instance
   */
  public getStripe(): Stripe | null {
    return this.stripe;
  }

  /**
   * Create a payment intent for subscription
   */
  public async createPaymentIntent(): Promise<PaymentIntent> {
    const user = authService.getCurrentUser();
    if (!user) {
      throw new Error('User must be authenticated to create payment intent');
    }

    try {
      // In a real implementation, this would call your backend API
      // For now, we'll simulate the response
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user.getIdToken()}`
        },
        body: JSON.stringify({
          userId: user.uid,
          priceId: STRIPE_PRICE_ID
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create payment intent');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error creating payment intent:', error);
      // For development, return a mock payment intent
      return {
        clientSecret: 'pi_mock_client_secret',
        amount: 999, // $9.99 in cents
        currency: 'usd'
      };
    }
  }

  /**
   * Create a subscription checkout session
   */
  public async createCheckoutSession(): Promise<string> {
    const user = authService.getCurrentUser();
    if (!user) {
      throw new Error('User must be authenticated to create checkout session');
    }

    try {
      // In a real implementation, this would call your backend API
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user.getIdToken()}`
        },
        body: JSON.stringify({
          userId: user.uid,
          email: user.email,
          priceId: STRIPE_PRICE_ID,
          successUrl: `${window.location.origin}/payment-success`,
          cancelUrl: `${window.location.origin}/payment-canceled`
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const data = await response.json();
      return data.sessionId;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      // For development, return a mock session ID
      return 'cs_mock_session_id';
    }
  }

  /**
   * Redirect to Stripe Checkout
   */
  public async redirectToCheckout(): Promise<void> {
    if (!this.stripe) {
      throw new Error('Stripe not initialized');
    }

    try {
      const sessionId = await this.createCheckoutSession();
      
      const { error } = await this.stripe.redirectToCheckout({
        sessionId
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error redirecting to checkout:', error);
      throw error;
    }
  }

  /**
   * Get user's subscription status
   */
  public async getSubscriptionStatus(): Promise<SubscriptionStatus | null> {
    const user = authService.getCurrentUser();
    if (!user) {
      return null;
    }

    try {
      // In a real implementation, this would call your backend API
      const response = await fetch('/api/subscription-status', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${await user.getIdToken()}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to get subscription status');
      }

      const data = await response.json();
      return {
        isActive: data.status === 'active' || data.status === 'trialing',
        status: data.status,
        currentPeriodEnd: data.currentPeriodEnd ? new Date(data.currentPeriodEnd) : null,
        cancelAtPeriodEnd: data.cancelAtPeriodEnd || false,
        planName: data.planName || 'Premium Plan'
      };
    } catch (error) {
      console.error('Error getting subscription status:', error);
      // For development, return a mock subscription status
      return {
        isActive: false,
        status: 'incomplete',
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
        planName: 'Premium Plan'
      };
    }
  }

  /**
   * Cancel user's subscription
   */
  public async cancelSubscription(): Promise<void> {
    const user = authService.getCurrentUser();
    if (!user) {
      throw new Error('User must be authenticated to cancel subscription');
    }

    try {
      const response = await fetch('/api/cancel-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user.getIdToken()}`
        },
        body: JSON.stringify({
          userId: user.uid
        })
      });

      if (!response.ok) {
        throw new Error('Failed to cancel subscription');
      }
    } catch (error) {
      console.error('Error canceling subscription:', error);
      throw error;
    }
  }

  /**
   * Create customer portal session for subscription management
   */
  public async createCustomerPortalSession(): Promise<string> {
    const user = authService.getCurrentUser();
    if (!user) {
      throw new Error('User must be authenticated to create customer portal session');
    }

    try {
      const response = await fetch('/api/create-customer-portal-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user.getIdToken()}`
        },
        body: JSON.stringify({
          userId: user.uid,
          returnUrl: window.location.origin
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create customer portal session');
      }

      const data = await response.json();
      return data.url;
    } catch (error) {
      console.error('Error creating customer portal session:', error);
      throw error;
    }
  }

  /**
   * Redirect to customer portal
   */
  public async redirectToCustomerPortal(): Promise<void> {
    try {
      const portalUrl = await this.createCustomerPortalSession();
      window.location.href = portalUrl;
    } catch (error) {
      console.error('Error redirecting to customer portal:', error);
      throw error;
    }
  }

  /**
   * Check if user has active subscription
   */
  public async hasActiveSubscription(): Promise<boolean> {
    const subscription = await this.getSubscriptionStatus();
    return subscription?.isActive || false;
  }

  /**
   * Get subscription plan details
   */
  public getPlanDetails() {
    return {
      name: 'Premium Plan',
      price: '$9.99',
      priceId: STRIPE_PRICE_ID,
      features: [
        'Unlimited AI conversations',
        'Save highlights and progress',
        'Cross-device synchronization',
        'Premium audio features',
        'Advanced reading analytics'
      ],
      billing: 'monthly'
    };
  }
}

// Export singleton instance
export const stripeService = new StripeService();
export default stripeService;
