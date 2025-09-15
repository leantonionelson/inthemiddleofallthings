const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { getFirestore } = require('../config/firebase');

const router = express.Router();

// Stripe webhook endpoint
router.post('/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log('Received webhook event:', event.type);

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object);
        break;
      
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object);
        break;
      
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;
      
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object);
        break;
      
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Handle successful checkout session
async function handleCheckoutSessionCompleted(session) {
  console.log('Processing checkout session completed:', session.id);
  
  const firebaseUid = session.metadata.firebase_uid;
  if (!firebaseUid) {
    console.error('No Firebase UID in session metadata');
    return;
  }

  const db = getFirestore();
  
  // Update user document with subscription info
  await db.collection('users').doc(firebaseUid).update({
    stripeCustomerId: session.customer,
    lastActive: new Date()
  });
}

// Handle subscription created
async function handleSubscriptionCreated(subscription) {
  console.log('Processing subscription created:', subscription.id);
  
  const firebaseUid = subscription.metadata.firebase_uid;
  if (!firebaseUid) {
    console.error('No Firebase UID in subscription metadata');
    return;
  }

  const db = getFirestore();
  
  // Get price details
  const price = await stripe.prices.retrieve(subscription.items.data[0].price.id);
  
  // Update user document
  await db.collection('users').doc(firebaseUid).update({
    subscriptionStatus: {
      isActive: true,
      status: subscription.status,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      planName: price.nickname || 'Premium Plan',
      stripeCustomerId: subscription.customer,
      stripeSubscriptionId: subscription.id,
      priceId: subscription.items.data[0].price.id
    },
    lastActive: new Date()
  });
}

// Handle subscription updated
async function handleSubscriptionUpdated(subscription) {
  console.log('Processing subscription updated:', subscription.id);
  
  const firebaseUid = subscription.metadata.firebase_uid;
  if (!firebaseUid) {
    console.error('No Firebase UID in subscription metadata');
    return;
  }

  const db = getFirestore();
  
  // Get price details
  const price = await stripe.prices.retrieve(subscription.items.data[0].price.id);
  
  // Update user document
  await db.collection('users').doc(firebaseUid).update({
    subscriptionStatus: {
      isActive: subscription.status === 'active',
      status: subscription.status,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      planName: price.nickname || 'Premium Plan',
      stripeCustomerId: subscription.customer,
      stripeSubscriptionId: subscription.id,
      priceId: subscription.items.data[0].price.id
    },
    lastActive: new Date()
  });
}

// Handle subscription deleted
async function handleSubscriptionDeleted(subscription) {
  console.log('Processing subscription deleted:', subscription.id);
  
  const firebaseUid = subscription.metadata.firebase_uid;
  if (!firebaseUid) {
    console.error('No Firebase UID in subscription metadata');
    return;
  }

  const db = getFirestore();
  
  // Update user document
  await db.collection('users').doc(firebaseUid).update({
    subscriptionStatus: {
      isActive: false,
      status: 'canceled',
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      planName: 'No Plan',
      stripeCustomerId: subscription.customer,
      stripeSubscriptionId: subscription.id
    },
    lastActive: new Date()
  });
}

// Handle successful invoice payment
async function handleInvoicePaymentSucceeded(invoice) {
  console.log('Processing invoice payment succeeded:', invoice.id);
  
  if (invoice.subscription) {
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
    const firebaseUid = subscription.metadata.firebase_uid;
    
    if (firebaseUid) {
      const db = getFirestore();
      await db.collection('users').doc(firebaseUid).update({
        lastActive: new Date()
      });
    }
  }
}

// Handle failed invoice payment
async function handleInvoicePaymentFailed(invoice) {
  console.log('Processing invoice payment failed:', invoice.id);
  
  if (invoice.subscription) {
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
    const firebaseUid = subscription.metadata.firebase_uid;
    
    if (firebaseUid) {
      const db = getFirestore();
      
      // Update subscription status to past_due
      await db.collection('users').doc(firebaseUid).update({
        'subscriptionStatus.status': 'past_due',
        'subscriptionStatus.isActive': false,
        lastActive: new Date()
      });
    }
  }
}

module.exports = router;
