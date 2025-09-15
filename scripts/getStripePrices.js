/**
 * Script to get Price IDs from your Stripe product
 * 
 * Usage: node scripts/getStripePrices.js
 * 
 * Make sure to set your Stripe secret key in the environment variable:
 * STRIPE_SECRET_KEY=sk_live_your_secret_key_here
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function getPriceIds() {
  try {
    console.log('🔍 Fetching your Stripe products and prices...\n');

    // Get all products
    const products = await stripe.products.list({
      limit: 10,
      active: true
    });

    if (products.data.length === 0) {
      console.log('❌ No products found in your Stripe account');
      return;
    }

    console.log('📦 Products found:');
    products.data.forEach((product, index) => {
      console.log(`\n${index + 1}. Product: ${product.name}`);
      console.log(`   ID: ${product.id}`);
      console.log(`   Description: ${product.description || 'No description'}`);
    });

    // Get all prices
    const prices = await stripe.prices.list({
      limit: 20,
      active: true
    });

    console.log('\n💰 Prices found:');
    prices.data.forEach((price, index) => {
      const product = products.data.find(p => p.id === price.product);
      console.log(`\n${index + 1}. Price: ${price.nickname || 'No nickname'}`);
      console.log(`   ID: ${price.id}`);
      console.log(`   Amount: ${price.unit_amount ? (price.unit_amount / 100) : 'N/A'} ${price.currency?.toUpperCase()}`);
      console.log(`   Interval: ${price.recurring?.interval || 'One-time'}`);
      console.log(`   Product: ${product?.name || 'Unknown'}`);
    });

    // Look for monthly and yearly prices
    const monthlyPrices = prices.data.filter(price => 
      price.recurring?.interval === 'month' && 
      (price.nickname?.toLowerCase().includes('monthly') || 
       price.nickname?.toLowerCase().includes('month'))
    );

    const yearlyPrices = prices.data.filter(price => 
      price.recurring?.interval === 'year' && 
      (price.nickname?.toLowerCase().includes('yearly') || 
       price.nickname?.toLowerCase().includes('year') ||
       price.nickname?.toLowerCase().includes('annual'))
    );

    console.log('\n🎯 Recommended Price IDs for your .env file:');
    
    if (monthlyPrices.length > 0) {
      const monthly = monthlyPrices[0];
      console.log(`VITE_STRIPE_MONTHLY_PRICE_ID=${monthly.id}`);
    } else {
      console.log('❌ No monthly prices found');
    }

    if (yearlyPrices.length > 0) {
      const yearly = yearlyPrices[0];
      console.log(`VITE_STRIPE_YEARLY_PRICE_ID=${yearly.id}`);
    } else {
      console.log('❌ No yearly prices found');
    }

    console.log('\n📝 Add these to your .env file and redeploy!');

  } catch (error) {
    console.error('❌ Error fetching Stripe data:', error.message);
    
    if (error.message.includes('Invalid API Key')) {
      console.log('\n💡 Make sure to set your Stripe secret key:');
      console.log('STRIPE_SECRET_KEY=sk_live_your_secret_key_here');
    }
  }
}

// Run the script
getPriceIds();
