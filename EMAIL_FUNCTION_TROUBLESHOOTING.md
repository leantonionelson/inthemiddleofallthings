# Email Function Troubleshooting Guide

## Common Errors

### 502 Bad Gateway Error
This means the Netlify function is being called but failing. Common causes:

1. **Missing RESEND_API_KEY**
   - Go to Netlify Dashboard → Site settings → Environment variables
   - Verify `RESEND_API_KEY` is set
   - Value should be: `re_6djHv3CP_DAzCmamCL1wRVx8d5KZZNYK2`
   - **Important**: After adding/updating, you must **redeploy** the site

2. **Domain Not Verified in Resend**
   - The "from" email uses `noreply@middleofallthings.com`
   - This domain must be verified in your Resend account
   - Go to Resend Dashboard → Domains → Add/Verify domain
   - Add DNS records as instructed by Resend

3. **Function Not Deployed**
   - Check Netlify build logs to ensure function compiled
   - TypeScript functions should auto-compile, but check for errors
   - Verify `netlify/functions/send-email.ts` exists

### 404 Not Found Error
This means the function endpoint isn't found. Check:

1. **Function Path**
   - Should be accessible at: `/.netlify/functions/send-email`
   - Check `netlify.toml` has: `functions = "netlify/functions"`

2. **Build Configuration**
   - Ensure function is in correct location: `netlify/functions/send-email.ts`
   - Check build logs for function compilation errors

## Quick Fixes

### Step 1: Verify Environment Variable
1. Go to [Netlify Dashboard](https://app.netlify.com)
2. Select your site
3. Go to **Site settings** → **Environment variables**
4. Check if `RESEND_API_KEY` exists
5. If missing, add it with value: `re_6djHv3CP_DAzCmamCL1wRVx8d5KZZNYK2`
6. **Redeploy** the site (trigger a new deployment)

### Step 2: Verify Domain in Resend
1. Go to [Resend Dashboard](https://resend.com/domains)
2. Check if `middleofallthings.com` is verified
3. If not, add the domain and verify DNS records
4. Alternatively, use a verified domain or Resend's test domain

### Step 3: Test the Function
After redeploying, test the function directly:

```bash
curl -X POST https://your-site.netlify.app/.netlify/functions/send-email \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

### Step 4: Check Function Logs
1. Go to Netlify Dashboard → Functions
2. Click on `send-email` function
3. Check logs for error messages
4. Look for specific error details

## Alternative: Use Resend Test Domain

If domain verification is an issue, you can temporarily use Resend's test domain:

Update `netlify/functions/send-email.ts` line 69:
```typescript
from: 'onboarding@resend.dev', // Temporary test domain
```

**Note**: This only works for testing. For production, you must verify your domain.

## Testing Locally

To test the function locally:

1. Install Netlify CLI:
   ```bash
   npm install -g netlify-cli
   ```

2. Add to `.env` file:
   ```
   RESEND_API_KEY=re_6djHv3CP_DAzCmamCL1wRVx8d5KZZNYK2
   ```

3. Run Netlify Dev:
   ```bash
   netlify dev
   ```

4. Test the function:
   ```bash
   curl -X POST http://localhost:8888/.netlify/functions/send-email \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com"}'
   ```

## Common Resend Errors

### "Domain not found"
- Domain `middleofallthings.com` not verified in Resend
- Solution: Verify domain in Resend dashboard

### "Invalid API key"
- `RESEND_API_KEY` is incorrect or expired
- Solution: Regenerate API key in Resend and update Netlify

### "Rate limit exceeded"
- Too many requests sent
- Solution: Wait or upgrade Resend plan

## Deployment Checklist

- [ ] `RESEND_API_KEY` set in Netlify environment variables
- [ ] Domain verified in Resend dashboard
- [ ] Function file exists at `netlify/functions/send-email.ts`
- [ ] `netlify.toml` has `functions = "netlify/functions"`
- [ ] Site redeployed after adding environment variable
- [ ] Function logs checked for errors

## Still Not Working?

1. **Check Netlify Function Logs**
   - Dashboard → Functions → send-email → Logs
   - Look for specific error messages

2. **Verify Function is Deployed**
   - Dashboard → Functions
   - Should see `send-email` function listed

3. **Test with Simple Endpoint**
   - Create a test function to verify functions work at all
   - If test fails, there's a broader Netlify Functions issue

4. **Contact Support**
   - Check Netlify status page
   - Check Resend status page
   - Review both service's documentation





