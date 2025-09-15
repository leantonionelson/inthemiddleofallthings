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
      // For now, we'll use Stripe's client-side approach
      // In production, you should create a backend API endpoint
      console.log('Creating checkout session for user:', user.uid);
      
      // Simulate successful session creation
      // In a real implementation, you would call your backend API here
      const mockSessionId = `cs_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Store the session info for demo purposes
      localStorage.setItem('stripe_session_id', mockSessionId);
      localStorage.setItem('stripe_user_id', user.uid);
      
      return mockSessionId;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      throw new Error('Failed to create checkout session. Please try again.');
    }
  }

  /**
   * Redirect to Stripe Checkout
   */
  public async redirectToCheckout(priceId?: string): Promise<void> {
    try {
      const sessionId = await this.createCheckoutSession(priceId);
      
      // For demo purposes, simulate successful payment
      // In production, you would redirect to actual Stripe Checkout
      console.log('Redirecting to Stripe Checkout with session:', sessionId);
      
      // Simulate payment success after a short delay
      setTimeout(() => {
        // Update user's subscription status
        this.simulatePaymentSuccess();
      }, 2000);
      
      // Show a demo message instead of actual redirect
      alert('Demo Mode: Payment would redirect to Stripe Checkout. For now, simulating successful payment.');
      
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
  public getPlanDetails(currency?: string, billing: 'monthly' | 'yearly' = 'monthly') {
    // Import regional pricing service dynamically to avoid circular imports
    const { regionalPricingService } = require('./regionalPricing');
    const detectedCurrency = currency || regionalPricingService.detectUserRegion();
    
    const planDetails = regionalPricingService.getPlanDetails(detectedCurrency, billing);
    
    // Add the correct Stripe price ID
    return {
      ...planDetails,
      priceId: billing === 'yearly' ? STRIPE_YEARLY_PRICE_ID : STRIPE_MONTHLY_PRICE_ID
    };
  }
}

// Export singleton instance
export const stripeService = new StripeService();
export default stripeService;
