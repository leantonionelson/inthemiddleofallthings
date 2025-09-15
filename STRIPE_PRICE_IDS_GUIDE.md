# 🔧 Fix: Get Your Stripe Price IDs

## The Problem
You're getting a "Something went wrong" error because you have a **Product ID** (`prod_T3i0YYSWIUTFlV`) but the app needs **Price IDs** (which start with `price_`).

## 🚀 Quick Fix

### Option 1: Use the Script (Recommended)
1. **Install Stripe CLI** (if you don't have it):
   ```bash
   npm install -g stripe
   ```

2. **Run the script to get your Price IDs**:
   ```bash
   # Set your Stripe secret key
   export STRIPE_SECRET_KEY=sk_live_your_secret_key_here
   
   # Run the script
   node scripts/getStripePrices.js
   ```

3. **Copy the Price IDs** from the output and update your `.env` file:
   ```bash
   VITE_STRIPE_MONTHLY_PRICE_ID=price_1234567890abcdef
   VITE_STRIPE_YEARLY_PRICE_ID=price_0987654321fedcba
   ```

### Option 2: Manual Method
1. **Go to your Stripe Dashboard** → Products
2. **Find your product** (ID: `prod_T3i0YYSWIUTFlV`)
3. **Click on the product** to see its prices
4. **Copy the Price IDs** (they start with `price_`)
5. **Update your `.env` file** with the correct Price IDs

## 📝 What You Need

You need **TWO** Price IDs:
- **Monthly Price ID**: For £7.99/month subscription
- **Yearly Price ID**: For £59.99/year subscription

## 🔍 How to Identify the Right Prices

Look for prices that match:
- **Monthly**: £7.99, recurring every month
- **Yearly**: £59.99, recurring every year

## ⚠️ Important Notes

- **Product IDs** start with `prod_` (what you currently have)
- **Price IDs** start with `price_` (what you need)
- You need **Price IDs**, not Product IDs
- Each billing period needs its own Price ID

## 🧪 Test After Fix

1. **Update your `.env` file** with the correct Price IDs
2. **Restart your development server**:
   ```bash
   npm run dev
   ```
3. **Go to the payment step** in onboarding
4. **The error should be gone** and payment should work

## 🚨 If You Still Get Errors

1. **Check the browser console** for error messages
2. **Verify the Price IDs** are correct in your `.env` file
3. **Make sure you're using live keys** for production
4. **Check that your Stripe product is active**

## 📞 Need Help?

If you're still having issues:
1. Run the script: `node scripts/getStripePrices.js`
2. Check the console output for your Price IDs
3. Make sure your Stripe secret key is correct
4. Verify your product has both monthly and yearly prices

---

**The script will show you exactly which Price IDs to use!** 🎯
