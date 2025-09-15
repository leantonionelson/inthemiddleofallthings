/**
 * Stripe Payment Service
 * 
 * Handles Stripe payment integration for subscription management
 */

import { loadStripe, Stripe, StripeElements } from '@stripe/stripe-js';
import { authService } from './firebaseAuth';

// Stripe configuration
const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
const STRIPE_MONTHLY_PRICE_ID = import.meta.env.VITE_STRIPE_MONTHLY_PRICE_ID || 'price_monthly';
const STRIPE_YEARLY_PRICE_ID = import.meta.env.VITE_STRIPE_YEARLY_PRICE_ID || 'price_yearly';

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
  public async createPaymentIntent(priceId?: string): Promise<PaymentIntent> {
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
          priceId: priceId || STRIPE_MONTHLY_PRICE_ID
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
  public async createCheckoutSession(priceId?: string): Promise<string> {
    const user = authService.getCurrentUser();
    if (!user) {
      throw new Error('User must be authenticated to create checkout session');
    }

    try {
      const idToken = await user.getIdToken();
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
      
      const response = await fetch(`${backendUrl}/api/stripe/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          priceId: priceId || STRIPE_MONTHLY_PRICE_ID,
          successUrl: `${window.location.origin}/payment-success`,
          cancelUrl: `${window.location.origin}/payment-canceled`
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create checkout session');
      }

      const data = await response.json();
      return data.sessionId;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      throw new Error('Failed to create checkout session. Please try again.');
    }
  }

  /**
   * Redirect to Stripe Checkout
   */
  public async redirectToCheckout(priceId?: string): Promise<void> {
    if (!this.stripe) {
      throw new Error('Stripe not initialized');
    }

    try {
      const sessionId = await this.createCheckoutSession(priceId);
      
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
   * Simulate successful payment (for demo purposes)
   */
  private simulatePaymentSuccess(): void {
    const user = authService.getCurrentUser();
    if (user) {
      // Update user profile with subscription status
      authService.updateUserProfile(user.uid, {
        subscriptionStatus: {
          isActive: true,
          status: 'active',
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          cancelAtPeriodEnd: false,
          planName: 'Premium Plan',
          stripeCustomerId: `cus_${user.uid}`,
          stripeSubscriptionId: `sub_${Date.now()}`
        }
      }).catch(console.error);
      
      console.log('✅ Payment simulation completed - user subscription activated');
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
      const idToken = await user.getIdToken();
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
      
      const response = await fetch(`${backendUrl}/api/stripe/subscription-status`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to get subscription status');
      }

      const data = await response.json();
      return {
        isActive: data.isActive,
        status: data.status,
        currentPeriodEnd: data.currentPeriodEnd ? new Date(data.currentPeriodEnd) : null,
        cancelAtPeriodEnd: data.cancelAtPeriodEnd || false,
        planName: data.planName || 'Premium Plan'
      };
    } catch (error) {
      console.error('Error getting subscription status:', error);
      // Fallback to local storage or default status
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
      const idToken = await user.getIdToken();
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
      
      const response = await fetch(`${backendUrl}/api/stripe/create-customer-portal-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          returnUrl: window.location.origin
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create customer portal session');
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
  public getPlanDetails(currency?: string, billing: 'monthly' | 'yearly' = 'monthly') {
    // Import regional pricing service dynamically to avoid circular imports
    const { regionalPricingService } = require('./regionalPricing');
    const detectedCurrency = currency || regionalPricingService.detectUserRegion();
    
    const planDetails = regionalPricingService.getPlanDetails(detectedCurrency, billing);
    
    // Add the correct Stripe price ID
    const priceId = billing === 'yearly' ? STRIPE_YEARLY_PRICE_ID : STRIPE_MONTHLY_PRICE_ID;
    
    // Check if we have valid price IDs
    if (!priceId || priceId.startsWith('price_') === false) {
      console.warn(`⚠️ Invalid or missing ${billing} price ID: ${priceId}`);
      console.warn('Please check your environment variables:');
      console.warn('- VITE_STRIPE_MONTHLY_PRICE_ID');
      console.warn('- VITE_STRIPE_YEARLY_PRICE_ID');
      console.warn('Run: node scripts/getStripePrices.js to get your Price IDs');
    }
    
    return {
      ...planDetails,
      priceId: priceId
    };
  }
}

// Export singleton instance
export const stripeService = new StripeService();
export default stripeService;
