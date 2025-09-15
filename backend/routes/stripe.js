const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { authenticateUser } = require('../middleware/auth');
const { getFirestore } = require('../config/firebase');
const Joi = require('joi');

const router = express.Router();

// Validation schemas
const createCheckoutSessionSchema = Joi.object({
  priceId: Joi.string().required(),
  successUrl: Joi.string().uri().required(),
  cancelUrl: Joi.string().uri().required()
});

const createCustomerPortalSchema = Joi.object({
  returnUrl: Joi.string().uri().required()
});

// Create checkout session
router.post('/create-checkout-session', authenticateUser, async (req, res) => {
  try {
    const { error, value } = createCheckoutSessionSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: error.details[0].message
      });
    }

    const { priceId, successUrl, cancelUrl } = value;
    const { uid, email } = req.user;

    // Get or create Stripe customer
    let customer;
    const existingCustomers = await stripe.customers.list({
      email: email,
      limit: 1
    });

    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0];
    } else {
      customer = await stripe.customers.create({
        email: email,
        metadata: {
          firebase_uid: uid
        }
      });
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        firebase_uid: uid,
        price_id: priceId
      },
      subscription_data: {
        metadata: {
          firebase_uid: uid
        }
      },
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      tax_id_collection: {
        enabled: true,
      },
    });

    res.json({
      sessionId: session.id,
      url: session.url
    });

  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({
      error: 'Failed to create checkout session'
    });
  }
});

// Get subscription status
router.get('/subscription-status', authenticateUser, async (req, res) => {
  try {
    const { uid } = req.user;
    const db = getFirestore();
    
    // Get user document from Firestore
    const userDoc = await db.collection('users').doc(uid).get();
    
    if (!userDoc.exists) {
      return res.json({
        isActive: false,
        status: 'no_subscription',
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
        planName: 'No Plan'
      });
    }

    const userData = userDoc.data();
    const subscriptionStatus = userData.subscriptionStatus;

    if (!subscriptionStatus) {
      return res.json({
        isActive: false,
        status: 'no_subscription',
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
        planName: 'No Plan'
      });
    }

    res.json({
      isActive: subscriptionStatus.isActive,
      status: subscriptionStatus.status,
      currentPeriodEnd: subscriptionStatus.currentPeriodEnd,
      cancelAtPeriodEnd: subscriptionStatus.cancelAtPeriodEnd,
      planName: subscriptionStatus.planName
    });

  } catch (error) {
    console.error('Error getting subscription status:', error);
    res.status(500).json({
      error: 'Failed to get subscription status'
    });
  }
});

// Create customer portal session
router.post('/create-customer-portal-session', authenticateUser, async (req, res) => {
  try {
    const { error, value } = createCustomerPortalSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: error.details[0].message
      });
    }

    const { returnUrl } = value;
    const { uid, email } = req.user;

    // Find Stripe customer
    const customers = await stripe.customers.list({
      email: email,
      limit: 1
    });

    if (customers.data.length === 0) {
      return res.status(404).json({
        error: 'No customer found'
      });
    }

    const customer = customers.data[0];

    // Create portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customer.id,
      return_url: returnUrl,
    });

    res.json({
      url: portalSession.url
    });

  } catch (error) {
    console.error('Error creating customer portal session:', error);
    res.status(500).json({
      error: 'Failed to create customer portal session'
    });
  }
});

// Cancel subscription
router.post('/cancel-subscription', authenticateUser, async (req, res) => {
  try {
    const { uid } = req.user;
    const db = getFirestore();
    
    // Get user document
    const userDoc = await db.collection('users').doc(uid).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    const userData = userDoc.data();
    const subscriptionStatus = userData.subscriptionStatus;

    if (!subscriptionStatus || !subscriptionStatus.stripeSubscriptionId) {
      return res.status(404).json({
        error: 'No active subscription found'
      });
    }

    // Cancel subscription at period end
    const subscription = await stripe.subscriptions.update(
      subscriptionStatus.stripeSubscriptionId,
      {
        cancel_at_period_end: true
      }
    );

    // Update user document
    await db.collection('users').doc(uid).update({
      'subscriptionStatus.cancelAtPeriodEnd': true,
      'subscriptionStatus.status': 'canceled'
    });

    res.json({
      message: 'Subscription will be canceled at the end of the current period',
      cancelAtPeriodEnd: true,
      currentPeriodEnd: subscription.current_period_end
    });

  } catch (error) {
    console.error('Error canceling subscription:', error);
    res.status(500).json({
      error: 'Failed to cancel subscription'
    });
  }
});

module.exports = router;
