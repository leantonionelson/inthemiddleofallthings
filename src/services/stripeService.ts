/**
 * Stripe Payment Service
 * 
 * Handles Stripe payment integration for subscription management
 */

import { loadStripe, Stripe, StripeElements } from '@stripe/stripe-js';
import { regionalPricingService } from './regionalPricing';

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
    try {
      // In a real implementation, this would call your backend API
      // For now, we'll simulate the response
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
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
   * Create a subscription checkout session using Stripe's client-side checkout
   */
  public async createCheckoutSession(priceId?: string): Promise<string> {
    try {
      if (!this.stripe) {
        throw new Error('Stripe is not initialized');
      }

      const { error } = await this.stripe.redirectToCheckout({
        lineItems: [{
          price: priceId || STRIPE_MONTHLY_PRICE_ID,
          quantity: 1,
        }],
        mode: 'subscription',
        successUrl: `${window.location.origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${window.location.origin}/payment-canceled`,
        billingAddressCollection: 'auto',
      });

      if (error) {
        console.error('Stripe checkout error:', error);
        throw new Error(error.message || 'Failed to redirect to checkout');
      }

      // This line will not be reached as redirectToCheckout redirects the page
      return 'redirecting';
    } catch (error: any) {
      console.error('Error creating checkout session:', error);
      throw new Error(error.message || 'Failed to create checkout session. Please try again.');
    }
  }

  /**
   * Redirect to Stripe Checkout (alias for createCheckoutSession)
   */
  public async redirectToCheckout(priceId?: string): Promise<void> {
    await this.createCheckoutSession(priceId);
  }

  /**
   * Simulate successful payment (for testing purposes)
   */
  private simulatePaymentSuccess(): void {
    // Update localStorage with subscription status
    localStorage.setItem('subscriptionStatus', JSON.stringify({
      isActive: true,
      status: 'active',
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      cancelAtPeriodEnd: false,
      planName: 'Premium Plan',
      stripeCustomerId: `cus_${Date.now()}`,
      stripeSubscriptionId: `sub_${Date.now()}`
    }));
    
    console.log('✅ Payment simulation completed - user subscription activated');
  }

  /**
   * Get user's subscription status from localStorage
   */
  public async getSubscriptionStatus(): Promise<SubscriptionStatus | null> {
    try {
      // Get subscription status from localStorage
      const subscriptionData = localStorage.getItem('subscriptionStatus');
      if (subscriptionData) {
        const parsed = JSON.parse(subscriptionData);
        return {
          isActive: parsed.isActive || false,
          status: parsed.status || 'incomplete',
          currentPeriodEnd: parsed.currentPeriodEnd ? new Date(parsed.currentPeriodEnd) : null,
          cancelAtPeriodEnd: parsed.cancelAtPeriodEnd || false,
          planName: parsed.planName || 'Premium Plan'
        };
      }
      
      // Return default status if no subscription found
      return {
        isActive: false,
        status: 'incomplete',
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
        planName: 'Premium Plan'
      };
    } catch (error) {
      console.error('Error getting subscription status:', error);
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
    try {
      const response = await fetch('/api/cancel-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to cancel subscription');
      }
      
      // Update localStorage
      const subscriptionData = localStorage.getItem('subscriptionStatus');
      if (subscriptionData) {
        const parsed = JSON.parse(subscriptionData);
        parsed.isActive = false;
        parsed.status = 'canceled';
        parsed.cancelAtPeriodEnd = true;
        localStorage.setItem('subscriptionStatus', JSON.stringify(parsed));
      }
    } catch (error) {
      console.error('Error canceling subscription:', error);
      throw error;
    }
  }

  /**
   * Create customer portal session for subscription management
   * Note: This requires Stripe's customer portal to be configured in your Stripe dashboard
   */
  public async createCustomerPortalSession(): Promise<void> {
    try {
      // Check subscription status from localStorage
      const subscriptionData = localStorage.getItem('subscriptionStatus');
      if (!subscriptionData) {
        throw new Error('No active subscription found. Please contact support for assistance.');
      }
      
      const parsed = JSON.parse(subscriptionData);
      const customerId = parsed.stripeCustomerId;
      
      if (!customerId) {
        throw new Error('No active subscription found. Please contact support for assistance.');
      }

      // For now, we'll show a message that directs users to contact support
      // In a full implementation, you'd need a backend to create portal sessions
      throw new Error('To manage your subscription, please contact support at support@yourapp.com');
    } catch (error) {
      console.error('Error creating customer portal session:', error);
      throw error;
    }
  }

  /**
   * Redirect to customer portal
   */
  public async redirectToCustomerPortal(): Promise<void> {
    await this.createCustomerPortalSession();
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
